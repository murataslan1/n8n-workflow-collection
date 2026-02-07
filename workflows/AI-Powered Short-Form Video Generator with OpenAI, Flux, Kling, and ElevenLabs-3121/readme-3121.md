AI-Powered Short-Form Video Generator with OpenAI, Flux, Kling, and ElevenLabs

https://n8nworkflows.xyz/workflows/ai-powered-short-form-video-generator-with-openai--flux--kling--and-elevenlabs-3121


# AI-Powered Short-Form Video Generator with OpenAI, Flux, Kling, and ElevenLabs

### 1. Workflow Overview

This workflow automates the creation of engaging short-form videos (TikTok, YouTube Shorts, Instagram Reels) from content ideas stored in a Google Sheet. It targets content creators, digital marketers, and social media managers who want to streamline video production without manual editing or multiple tools.

The workflow is logically divided into five main blocks:

- **1.1 Caption Generation:** Extracts video ideas from Google Sheets and generates five creative, edgy captions using OpenAI.
- **1.2 Image Generation:** Expands captions into detailed image prompts and generates realistic images via Flux API (PiAPI).
- **1.3 Video Generation:** Converts generated images into short videos using Kling API (PiAPI), with retry and failure handling.
- **1.4 Voice-over Creation:** Generates a humorous voice-over script with OpenAI, converts it to speech using Eleven Labs API, and uploads audio to Google Drive.
- **1.5 Final Video Assembly and Publishing:** Combines videos, captions, and voice-overs into a final video using Creatomate API, uploads the final video to Google Drive, updates the Google Sheet with metadata, and sends a Discord notification.

Each block includes error handling, token usage tracking, and API key management to ensure smooth operation and cost monitoring.

---

### 2. Block-by-Block Analysis

#### 2.1 Caption Generation

- **Overview:**  
  Loads ideas from a Google Sheet and generates five short, entertaining video captions using OpenAI. The captions follow a Problem > Action > Reward narrative with edgy humor.

- **Nodes Involved:**  
  - Once Per Day (Schedule Trigger)  
  - Set API Keys (Set)  
  - Load Google Sheet (Google Sheets)  
  - Generate Video Captions (OpenAI)  
  - Create List (Code)  
  - Validate list formatting (If) [inactive]  

- **Node Details:**  

  - **Once Per Day**  
    - Type: Schedule Trigger  
    - Role: Triggers the workflow daily at 7 AM to start the process.  
    - Input: None  
    - Output: Triggers Set API Keys node.  
    - Edge cases: None significant.  

  - **Set API Keys**  
    - Type: Set  
    - Role: Stores API keys and template IDs for PiAPI, Eleven Labs, Creatomate.  
    - Configuration: Four string variables for keys and template ID.  
    - Input: Trigger from schedule.  
    - Output: Loads Google Sheet node.  
    - Edge cases: Missing or invalid keys will cause downstream API failures.  

  - **Load Google Sheet**  
    - Type: Google Sheets  
    - Role: Reads a single idea marked "for production" from a Google Sheet.  
    - Configuration: Filters rows where "production" column equals "for production".  
    - Credentials: Google Sheets OAuth2.  
    - Input: From Set API Keys.  
    - Output: Generates video captions node.  
    - Edge cases: No matching rows; API quota exceeded; auth errors.  

  - **Generate Video Captions**  
    - Type: OpenAI (Langchain)  
    - Role: Generates 5 edgy, first-person POV captions for the video idea.  
    - Configuration: Uses GPT-4o-mini model with a detailed system prompt emphasizing style and content rules (no quotes, minimal emojis, Andrew Tate style).  
    - Input: Idea text from Google Sheet.  
    - Output: Raw text response with 5 captions separated by newline.  
    - Credentials: OpenAI API key.  
    - Edge cases: API rate limits, prompt failures, unexpected output format.  

  - **Create List**  
    - Type: Code  
    - Role: Parses OpenAI response into an array of 5 individual caption items for downstream processing.  
    - Input: Raw OpenAI response.  
    - Output: List of 5 JSON items each with a caption text.  
    - Edge cases: Empty or malformed response; parsing errors.  

  - **Validate list formatting** (inactive)  
    - Type: If  
    - Role: Checks if the list contains more than one item to confirm valid parsing.  
    - Edge cases: If activated, would handle invalid response fallback.  

---

#### 2.2 Image Generation

- **Overview:**  
  Converts each caption into a detailed image prompt using OpenAI, then generates images with Flux API (via PiAPI). Tracks token usage and retries on failure.

- **Nodes Involved:**  
  - Generate Image Prompts (OpenAI)  
  - Calculate Token Usage (Code)  
  - Generate Image (HTTP Request to PiAPI)  
  - Wait 3min (Wait)  
  - Get image (HTTP Request to PiAPI)  
  - Check for failures (If)  
  - Wait 5min (Wait)  
  - Wait to retry (Wait)  

- **Node Details:**  

  - **Generate Image Prompts**  
    - Type: OpenAI (Langchain)  
    - Role: Expands each caption into a hyper-realistic, cinematic image prompt optimized for Flux model.  
    - Configuration: Uses GPT-4o-mini with a complex system prompt enforcing first-person POV, no quotes/emojis, and environment descriptors.  
    - Input: Caption text from Create List node.  
    - Output: Detailed prompt text for image generation.  
    - Credentials: OpenAI API key.  
    - Edge cases: API errors, prompt misinterpretation.  

  - **Calculate Token Usage**  
    - Type: Code  
    - Role: Sums prompt and completion tokens across all OpenAI responses to track usage and cost.  
    - Input: All OpenAI responses from Generate Image Prompts.  
    - Output: Items enriched with total token counts.  
    - Edge cases: None significant.  

  - **Generate Image**  
    - Type: HTTP Request  
    - Role: Calls PiAPI Flux endpoint to generate images from prompts.  
    - Configuration: POST to PiAPI with model "Qubico/flux1-dev", 540x960 resolution, negative prompts to avoid unwanted elements.  
    - Headers: X-API-Key from Set API Keys node.  
    - Input: Image prompt from Generate Image Prompts.  
    - Output: Task ID for image generation.  
    - Edge cases: API key invalid, rate limits, network errors.  

  - **Wait 3min**  
    - Type: Wait  
    - Role: Delays 3 minutes to allow image generation to complete.  
    - Input: After Generate Image.  
    - Output: Get image node.  

  - **Get image**  
    - Type: HTTP Request  
    - Role: Polls PiAPI for image generation task status and result.  
    - Input: Task ID from Generate Image.  
    - Output: Image URL and status.  
    - Edge cases: Task failure, timeout, API errors.  

  - **Check for failures**  
    - Type: If  
    - Role: Checks if image generation status is "failed".  
    - Input: Get image output.  
    - Output: Retry or proceed.  
    - Edge cases: Failure triggers retry.  

  - **Wait 5min**  
    - Type: Wait  
    - Role: Waits 5 minutes before retrying image generation after failure.  
    - Input: On failure from Check for failures.  
    - Output: Generate Image node (retry).  

  - **Wait to retry**  
    - Type: Wait  
    - Role: Waits a configurable time before retrying video generation (used later).  
    - Input: On failure from video generation.  

---

#### 2.3 Video Generation

- **Overview:**  
  Converts each generated image into a short video clip using Kling API (PiAPI). Includes polling, failure detection, and retry logic.

- **Nodes Involved:**  
  - Image-to-Video (HTTP Request to PiAPI)  
  - Wait 10min (Wait)  
  - Get Video (HTTP Request to PiAPI)  
  - Fail check (If)  
  - Wait to retry (Wait)  

- **Node Details:**  

  - **Image-to-Video**  
    - Type: HTTP Request  
    - Role: Submits a video generation task to PiAPI Kling model using the image URL.  
    - Configuration: POST with model "kling", mode "pro", 5-second duration, camera control settings, negative prompts to avoid artifacts.  
    - Headers: X-API-Key from Set API Keys.  
    - Input: Image URL from Get image node.  
    - Output: Task ID for video generation.  
    - Edge cases: API errors, invalid image URL, rate limits.  

  - **Wait 10min**  
    - Type: Wait  
    - Role: Delays 10 minutes to allow video generation to complete.  
    - Input: After Image-to-Video.  
    - Output: Get Video node.  

  - **Get Video**  
    - Type: HTTP Request  
    - Role: Polls PiAPI for video generation task status and video URL.  
    - Input: Task ID from Image-to-Video.  
    - Output: Video URL and status.  
    - Edge cases: Task failure, timeout, API errors.  

  - **Fail check**  
    - Type: If  
    - Role: Checks if video generation status is "failed".  
    - Input: Get Video output.  
    - Output: Retry or proceed.  
    - Edge cases: Failure triggers retry.  

  - **Wait to retry**  
    - Type: Wait  
    - Role: Waits before retrying video generation on failure.  
    - Input: Fail check failure branch.  
    - Output: Image-to-Video (retry).  

---

#### 2.4 Voice-over Creation

- **Overview:**  
  Generates a funny narration script from captions using OpenAI, converts it to speech with Eleven Labs, uploads audio to Google Drive, and sets sharing permissions.

- **Nodes Involved:**  
  - Generate Script (OpenAI)  
  - Generate voice (HTTP Request to Eleven Labs)  
  - Upload Voice Audio (Google Drive)  
  - Set Access Permissions (Google Drive)  
  - List Elements1 (Code)  

- **Node Details:**  

  - **Generate Script**  
    - Type: OpenAI (Langchain)  
    - Role: Creates a brief, edgy narration script for the 5 captions, designed for 15 seconds total voice-over.  
    - Configuration: GPT-4o-mini with system prompt to emulate Andrew Tate/Charlie Sheen style, no emojis.  
    - Input: Captions from Generate Video Captions.  
    - Output: Script text.  
    - Credentials: OpenAI API key.  
    - Edge cases: API errors, unexpected output.  

  - **Generate voice**  
    - Type: HTTP Request  
    - Role: Sends script text to Eleven Labs Text-to-Speech API to generate audio.  
    - Configuration: POST to Eleven Labs TTS endpoint with API key header.  
    - Input: Script text from Generate Script.  
    - Output: Audio file or URL.  
    - Edge cases: API key invalid, rate limits, audio generation failure.  

  - **Upload Voice Audio**  
    - Type: Google Drive  
    - Role: Uploads generated audio file to a specific Google Drive folder.  
    - Configuration: Filename based on Google Sheet ID, folder ID set to "Resume Studio".  
    - Credentials: Google Drive OAuth2.  
    - Input: Audio from Generate voice.  
    - Output: Google Drive file metadata.  
    - Edge cases: Upload failure, auth errors.  

  - **Set Access Permissions**  
    - Type: Google Drive  
    - Role: Sets sharing permissions on uploaded audio file to "anyone with link can write".  
    - Input: File ID from Upload Voice Audio.  
    - Output: Confirmation of permission set.  
    - Edge cases: Permission errors, API limits.  

  - **List Elements1**  
    - Type: Code  
    - Role: Extracts the public URL of the uploaded audio file for later merging.  
    - Input: Output of Set Access Permissions.  
    - Output: JSON with sound_urls array.  

---

#### 2.5 Final Video Assembly and Publishing

- **Overview:**  
  Merges generated videos, captions, and voice-overs; renders the final video using Creatomate API; uploads the final video to Google Drive; updates the Google Sheet with metadata; and sends a Discord notification.

- **Nodes Involved:**  
  - Match captions with videos (Merge)  
  - List Elements (Code)  
  - Pair Videos with Audio (Merge)  
  - Render Final Video (HTTP Request to Creatomate)  
  - Wait1 (Wait)  
  - Get Final Video (HTTP Request)  
  - Get Raw File (HTTP Request)  
  - Upload Final Video (Google Drive)  
  - Set Permissions (Google Drive)  
  - Update Google Sheet (Google Sheets)  
  - Notify me on Discord (Discord)  

- **Node Details:**  

  - **Match captions with videos**  
    - Type: Merge  
    - Role: Combines caption items with corresponding video items by position.  
    - Input: Captions and videos arrays.  
    - Output: Combined JSON with captions and video URLs.  

  - **List Elements**  
    - Type: Code  
    - Role: Creates a summary object containing scene titles, video URLs, token usage, and model info for final rendering.  
    - Input: Output of Match captions with videos and token usage nodes.  
    - Output: Single JSON item with arrays for video sources, texts, and tokens.  

  - **Pair Videos with Audio**  
    - Type: Merge  
    - Role: Combines the video/caption data with the voice-over URLs by position.  
    - Input: List Elements and List Elements1 outputs.  
    - Output: Complete data set for final video rendering.  

  - **Render Final Video**  
    - Type: HTTP Request  
    - Role: Sends a render request to Creatomate API with template ID and modifications (video sources, audio source, captions).  
    - Configuration: Uses Bearer token authorization with Creatomate API key.  
    - Input: Paired videos and audio data.  
    - Output: Render job ID.  
    - Edge cases: API errors, invalid template ID, rate limits.  

  - **Wait1**  
    - Type: Wait  
    - Role: Waits 3 minutes for Creatomate to process the render job.  

  - **Get Final Video**  
    - Type: HTTP Request  
    - Role: Polls Creatomate API for render job status and final video URL.  
    - Input: Render job ID.  
    - Output: Final video URL.  

  - **Get Raw File**  
    - Type: HTTP Request  
    - Role: Downloads metadata of the final video file (width, height, duration, frame rate).  
    - Input: Final video URL.  
    - Output: Video metadata.  

  - **Upload Final Video**  
    - Type: Google Drive  
    - Role: Uploads the final rendered video to Google Drive in the "Resume Studio" folder.  
    - Input: Video file metadata and URL.  
    - Output: Google Drive file metadata.  

  - **Set Permissions**  
    - Type: Google Drive  
    - Role: Sets sharing permissions on the uploaded final video file to "anyone with link can write".  
    - Input: File ID from Upload Final Video.  

  - **Update Google Sheet**  
    - Type: Google Sheets  
    - Role: Updates the original Google Sheet row with video metadata, token usage, costs, production status, and final output URL.  
    - Input: Video metadata and Google Drive link.  
    - Output: Confirmation of update.  

  - **Notify me on Discord**  
    - Type: Discord  
    - Role: Sends a webhook notification to Discord with a message containing the final video link.  
    - Input: Final video URL from Google Drive.  
    - Credentials: Discord webhook.  

---

### 3. Summary Table

| Node Name               | Node Type                 | Functional Role                                    | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                                                   |
|-------------------------|---------------------------|---------------------------------------------------|-------------------------------|-------------------------------|----------------------------------------------------------------------------------------------|
| Once Per Day            | Schedule Trigger          | Triggers workflow daily                            | None                          | Set API Keys                  |                                                                                              |
| Set API Keys            | Set                       | Stores API keys and template IDs                   | Once Per Day                  | Load Google Sheet             | SET BEFORE STARTING                                                                          |
| Load Google Sheet       | Google Sheets             | Loads video idea marked "for production"           | Set API Keys                  | Generate Video Captions       | ## 1. 🗨️Generate video captions from ideas in a Google Sheet                                |
| Generate Video Captions | OpenAI (Langchain)        | Generates 5 edgy captions from idea                | Load Google Sheet             | Create List                  |                                                                                              |
| Create List             | Code                      | Parses OpenAI captions into list                    | Generate Video Captions       | Validate list formatting      |                                                                                              |
| Validate list formatting| If                        | Validates list length (inactive)                    | Create List                  | Generate Image Prompts        |                                                                                              |
| Generate Image Prompts  | OpenAI (Langchain)        | Expands captions into detailed image prompts       | Create List                  | Calculate Token Usage         | ## 2. 🖼️Generate images with Flux using PiAPI                                               |
| Calculate Token Usage   | Code                      | Totals OpenAI token usage                            | Generate Image Prompts        | Generate Image               |                                                                                              |
| Generate Image          | HTTP Request (PiAPI)      | Generates images from prompts                        | Calculate Token Usage         | Wait 3min                   |                                                                                              |
| Wait 3min               | Wait                      | Waits for image generation                           | Generate Image               | Get image                   |                                                                                              |
| Get image               | HTTP Request (PiAPI)      | Polls image generation status                        | Wait 3min                   | Check for failures           |                                                                                              |
| Check for failures      | If                        | Checks if image generation failed                    | Get image                   | Wait 5min / Image-to-Video   |                                                                                              |
| Wait 5min               | Wait                      | Waits before retrying image generation               | Check for failures (fail)    | Generate Image               |                                                                                              |
| Image-to-Video          | HTTP Request (PiAPI)      | Converts images to videos                             | Wait to retry / Check for failures (success) | Wait 10min                   | ## 3. 🎬Generate videos with Kling using PiAPI                                              |
| Wait 10min              | Wait                      | Waits for video generation                           | Image-to-Video              | Get Video                   |                                                                                              |
| Get Video               | HTTP Request (PiAPI)      | Polls video generation status                        | Wait 10min                  | Fail check                  |                                                                                              |
| Fail check              | If                        | Checks if video generation failed                    | Get Video                   | Wait to retry / Match captions with videos |                                                                                              |
| Wait to retry           | Wait                      | Waits before retrying video generation               | Fail check (fail)            | Image-to-Video              |                                                                                              |
| Match captions with videos | Merge                   | Combines captions with videos by position            | Fail check (success), Validate list formatting (fail) | List Elements               |                                                                                              |
| List Elements           | Code                      | Creates summary object for final rendering           | Match captions with videos   | Pair Videos with Audio       |                                                                                              |
| Generate Script         | OpenAI (Langchain)        | Generates funny narration script from captions       | Validate list formatting (fail) | Generate voice              | ## 4. 🔉Generate voice overs with Eleven Labs                                                |
| Generate voice          | HTTP Request (Eleven Labs)| Converts script text to speech                        | Generate Script             | Upload Voice Audio           |                                                                                              |
| Upload Voice Audio      | Google Drive              | Uploads voice audio to Drive                          | Generate voice              | Set Access Permissions       |                                                                                              |
| Set Access Permissions  | Google Drive              | Sets sharing permissions on voice audio              | Upload Voice Audio          | List Elements1               |                                                                                              |
| List Elements1          | Code                      | Extracts public URLs of uploaded audio               | Set Access Permissions      | Pair Videos with Audio       |                                                                                              |
| Pair Videos with Audio  | Merge                     | Combines videos/captions with voice-over URLs        | List Elements, List Elements1 | Render Final Video          |                                                                                              |
| Render Final Video      | HTTP Request (Creatomate) | Sends render request with combined media              | Pair Videos with Audio      | Wait1                       | ## 5. 📥Complete video with Creatomate                                                      |
| Wait1                   | Wait                      | Waits for Creatomate render completion                | Render Final Video          | Get Final Video             |                                                                                              |
| Get Final Video         | HTTP Request (Creatomate) | Polls for final video URL                              | Wait1                      | Get Raw File                |                                                                                              |
| Get Raw File            | HTTP Request              | Downloads video metadata                               | Get Final Video             | Upload Final Video          |                                                                                              |
| Upload Final Video      | Google Drive              | Uploads final video to Drive                           | Get Raw File                | Set Permissions             |                                                                                              |
| Set Permissions         | Google Drive              | Sets sharing permissions on final video               | Upload Final Video          | Update Google Sheet         |                                                                                              |
| Update Google Sheet     | Google Sheets             | Updates sheet with metadata, tokens, costs, status   | Set Permissions             | Notify me on Discord        |                                                                                              |
| Notify me on Discord    | Discord                   | Sends notification with final video link              | Update Google Sheet         | None                       |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node ("Once Per Day")**  
   - Set to trigger daily at 7:00 AM.

2. **Add a Set node ("Set API Keys")**  
   - Create string parameters: "PiAPI Key", "ElevenLabs API Key", "Creatomate API Key", "Creatomate Template ID".  
   - Connect "Once Per Day" → "Set API Keys".

3. **Add a Google Sheets node ("Load Google Sheet")**  
   - Configure OAuth2 credentials for Google Sheets.  
   - Set document ID to your copied Google Sheet template.  
   - Filter rows where "production" column equals "for production".  
   - Connect "Set API Keys" → "Load Google Sheet".

4. **Add an OpenAI node ("Generate Video Captions")**  
   - Use GPT-4o-mini model.  
   - System prompt: instruct to generate 5 edgy, first-person POV captions about job hunting, no quotes, minimal emojis.  
   - Input message: pass the idea from Google Sheet.  
   - Connect "Load Google Sheet" → "Generate Video Captions".  
   - Configure OpenAI credentials.

5. **Add a Code node ("Create List")**  
   - JavaScript to split OpenAI response by newline and create an item per caption.  
   - Connect "Generate Video Captions" → "Create List".

6. *(Optional)* Add an If node ("Validate list formatting") to check list length > 1 (inactive in original).

7. **Add an OpenAI node ("Generate Image Prompts")**  
   - GPT-4o-mini model.  
   - System prompt: expand each caption into a detailed, first-person cinematic image prompt for Flux.  
   - Input: caption text from "Create List".  
   - Connect "Create List" → "Generate Image Prompts".  
   - Configure OpenAI credentials.

8. **Add a Code node ("Calculate Token Usage")**  
   - JavaScript to sum prompt and completion tokens from all OpenAI responses.  
   - Connect "Generate Image Prompts" → "Calculate Token Usage".

9. **Add an HTTP Request node ("Generate Image")**  
   - POST to PiAPI Flux endpoint: https://api.piapi.ai/api/v1/task  
   - Body: JSON with model "Qubico/flux1-dev", task_type "txt2img", prompt from "Generate Image Prompts", negative prompt, width 540, height 960.  
   - Headers: X-API-Key from "Set API Keys".  
   - Connect "Calculate Token Usage" → "Generate Image".

10. **Add a Wait node ("Wait 3min")**  
    - Wait 3 minutes.  
    - Connect "Generate Image" → "Wait 3min".

11. **Add an HTTP Request node ("Get image")**  
    - GET https://api.piapi.ai/api/v1/task/{{task_id}}  
    - Headers: X-API-Key.  
    - Connect "Wait 3min" → "Get image".

12. **Add an If node ("Check for failures")**  
    - Condition: $json.data.status equals "failed".  
    - Connect "Get image" → "Check for failures".

13. **Add a Wait node ("Wait 5min")**  
    - Wait 5 minutes.  
    - Connect failure branch of "Check for failures" → "Wait 5min".

14. **Connect "Wait 5min" → "Generate Image"** (retry loop).

15. **Connect success branch of "Check for failures" → next block (Image-to-Video).**

16. **Add an HTTP Request node ("Image-to-Video")**  
    - POST to PiAPI Kling endpoint: https://api.piapi.ai/api/v1/task  
    - Body: JSON with model "kling", task_type "video_generation", input includes image_url from "Get image", duration 5 sec, mode "pro", camera control config, negative prompt.  
    - Headers: X-API-Key.  
    - Connect from success branch of "Check for failures" or retry loop.  

17. **Add a Wait node ("Wait 10min")**  
    - Wait 10 minutes.  
    - Connect "Image-to-Video" → "Wait 10min".

18. **Add an HTTP Request node ("Get Video")**  
    - GET https://api.piapi.ai/api/v1/task/{{task_id}}  
    - Headers: X-API-Key.  
    - Connect "Wait 10min" → "Get Video".

19. **Add an If node ("Fail check")**  
    - Condition: $json.data.status equals "failed".  
    - Connect "Get Video" → "Fail check".

20. **Add a Wait node ("Wait to retry")**  
    - Wait configurable minutes (e.g., 5).  
    - Connect failure branch of "Fail check" → "Wait to retry".

21. **Connect "Wait to retry" → "Image-to-Video"** (retry loop).

22. **Connect success branch of "Fail check" → next block (Match captions with videos).**

23. **Add a Merge node ("Match captions with videos")**  
    - Mode: Combine by position.  
    - Inputs: video items and caption items.  
    - Connect success branch of "Fail check" and optionally from "Validate list formatting" fail branch → "Match captions with videos".

24. **Add a Code node ("List Elements")**  
    - Creates an object with arrays of scene titles, video URLs, token usage, and model info.  
    - Connect "Match captions with videos" → "List Elements".

25. **Add an OpenAI node ("Generate Script")**  
    - GPT-4o-mini model.  
    - System prompt: generate a 15-second edgy narration script from the 5 captions.  
    - Input: captions from "Generate Video Captions".  
    - Connect "Validate list formatting" fail branch → "Generate Script".  
    - Configure OpenAI credentials.

26. **Add an HTTP Request node ("Generate voice")**  
    - POST to Eleven Labs TTS endpoint: https://api.elevenlabs.io/v1/text-to-speech/{voice_id}  
    - Body: text from "Generate Script".  
    - Headers: xi-api-key from "Set API Keys".  
    - Connect "Generate Script" → "Generate voice".

27. **Add a Google Drive node ("Upload Voice Audio")**  
    - Upload audio file to Drive folder "Resume Studio".  
    - Filename: based on Google Sheet ID + "-voiceover.mp3".  
    - Connect "Generate voice" → "Upload Voice Audio".  
    - Configure Google Drive OAuth2 credentials.

28. **Add a Google Drive node ("Set Access Permissions")**  
    - Share uploaded audio file with "anyone with link" permission.  
    - Connect "Upload Voice Audio" → "Set Access Permissions".

29. **Add a Code node ("List Elements1")**  
    - Extracts public URLs of uploaded audio files.  
    - Connect "Set Access Permissions" → "List Elements1".

30. **Add a Merge node ("Pair Videos with Audio")**  
    - Combine outputs of "List Elements" and "List Elements1" by position.  
    - Connect "List Elements" and "List Elements1" → "Pair Videos with Audio".

31. **Add an HTTP Request node ("Render Final Video")**  
    - POST to Creatomate API: https://api.creatomate.com/v1/renders  
    - Body: JSON with template_id from "Set API Keys" and modifications for video sources, audio source, and text captions.  
    - Headers: Authorization Bearer with Creatomate API key.  
    - Connect "Pair Videos with Audio" → "Render Final Video".

32. **Add a Wait node ("Wait1")**  
    - Wait 3 minutes for rendering.  
    - Connect "Render Final Video" → "Wait1".

33. **Add an HTTP Request node ("Get Final Video")**  
    - GET https://api.creatomate.com/v1/renders/{{render_id}}  
    - Headers: Authorization Bearer.  
    - Connect "Wait1" → "Get Final Video".

34. **Add an HTTP Request node ("Get Raw File")**  
    - GET final video URL with responseFormat "file" to get metadata.  
    - Connect "Get Final Video" → "Get Raw File".

35. **Add a Google Drive node ("Upload Final Video")**  
    - Upload final video to Drive folder "Resume Studio".  
    - Filename: "POV-{{render_id}}.mp4".  
    - Connect "Get Raw File" → "Upload Final Video".

36. **Add a Google Drive node ("Set Permissions")**  
    - Share uploaded final video with "anyone with link" permission.  
    - Connect "Upload Final Video" → "Set Permissions".

37. **Add a Google Sheets node ("Update Google Sheet")**  
    - Update original row with video metadata, token usage, costs, production status, and final output URL.  
    - Connect "Set Permissions" → "Update Google Sheet".

38. **Add a Discord node ("Notify me on Discord")**  
    - Send webhook notification with final video link.  
    - Connect "Update Google Sheet" → "Notify me on Discord".  
    - Configure Discord webhook credentials.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                    | Context or Link                                                                                              |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| This workflow automates short-form video creation using AI technologies: OpenAI for text, Flux and Kling via PiAPI for images and videos, Eleven Labs for voice, and Creatomate for final video rendering.                                        | Workflow description                                                                                         |
| Setup requires API keys for OpenAI, PiAPI, Eleven Labs, Creatomate, and Google OAuth2 credentials for Sheets and Drive.                                                                                                                       | Setup instructions in workflow description                                                                  |
| Creatomate template JSON example available at https://pastebin.com/c7aMTeLK. Use this to create your video template and obtain the template ID.                                                                                              | Creatomate template setup                                                                                     |
| Google Sheet template copy link: https://docs.google.com/spreadsheets/d/1cjd8p_yx-M-3gWLEd5TargtoB35cW-3y66AOTNMQrrM/edit?usp=sharing                                                                                                          | Google Sheets template                                                                                         |
| Flux API models: Qubico/flux1-dev (default), flux1-schnell, flux1-advanced. Pricing and docs: https://piapi.ai/docs/flux-api/text-to-image?via=n8n                                                                                              | Flux API documentation                                                                                        |
| Kling API models: std (standard), pro (professional, default). Pricing and docs: https://piapi.ai/docs/kling-api/create-task?via=n8                                                                                                           | Kling API documentation                                                                                       |
| Eleven Labs TTS API docs: https://elevenlabs.io/docs/api-reference/text-to-speech/convert                                                                                                                                                      | Eleven Labs API documentation                                                                                 |
| Discord webhook integration for notifications: https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks                                                                                                                      | Discord webhook documentation                                                                                 |
| Token usage is tracked and stored for cost monitoring.                                                                                                                                                                                         | Cost tracking notes                                                                                           |
| The workflow is tested on n8n version 1.81.4.                                                                                                                                                                                                  | Version compatibility                                                                                         |

---

This structured documentation provides a comprehensive understanding of the workflow’s architecture, node configurations, error handling, and integration points, enabling advanced users and AI agents to reproduce, modify, and troubleshoot the workflow effectively.