Auto-create and publish AI social videos with Telegram, GPT-4 and Blotato

https://n8nworkflows.xyz/workflows/auto-create-and-publish-ai-social-videos-with-telegram--gpt-4-and-blotato-3654


# Auto-create and publish AI social videos with Telegram, GPT-4 and Blotato

### 1. Workflow Overview

This workflow automates the creation and multi-platform publishing of AI-generated short-form social videos (Reels) starting from a Telegram message input. It targets social media managers, content creators, and AI enthusiasts who want to streamline video content production and distribution without manual video editing or uploads.

The workflow is logically divided into five main blocks:

- **1.1 Input Reception and Parsing:** Receives Telegram messages (text or image), extracts prompts, and determines the input type.
- **1.2 AI Video Generation:** Creates videos either from text prompts using Blotato or from images using Kling via Piapi, including waiting for rendering completion.
- **1.3 Music Generation and Fusion:** Generates music with Piapi based on style prompts, converts text scripts to speech, and merges audio with video using JSON2Video.
- **1.4 Caption and Metadata Generation:** Uses GPT-4 to generate video overlay texts, social captions, and SEO-friendly titles; saves metadata to Google Sheets; sends final video and captions back to Telegram.
- **1.5 Multi-Platform Auto-Publishing:** Uploads the final video to Blotato and posts it automatically to nine social platforms via Blotato’s API.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Parsing

**Overview:**  
This block captures the initial Telegram message (text or image), cleans and splits the prompt into components, and routes the flow based on input type.

**Nodes Involved:**  
- Trigger Telegram Prompt or Image  
- Split Prompt or Image Input  
- Condition Input Type (Image or Text)  
- Download Image from Telegram (image path)  
- Extract Image File URL (image path)

**Node Details:**

- **Trigger Telegram Prompt or Image**  
  - Type: Telegram Trigger  
  - Role: Entry point; listens for Telegram messages (text or images).  
  - Config: Listens to "message" updates; uses Telegram API credentials.  
  - Inputs: Telegram messages.  
  - Outputs: Raw Telegram message JSON.  
  - Edge Cases: Missing or malformed messages; unsupported media types; Telegram API rate limits.

- **Split Prompt or Image Input**  
  - Type: Code (JavaScript)  
  - Role: Cleans input text, removes optional "generate video" prefix, splits by commas into video prompt, caption idea, and music style.  
  - Key Expressions: Uses regex to clean prefix; splits input string by commas; assigns defaults if missing.  
  - Inputs: Telegram message text or caption.  
  - Outputs: JSON with `videoPrompt`, `captionIdea`, `musicStyle`.  
  - Edge Cases: Empty or malformed input; missing commas; unexpected input formats.

- **Condition Input Type (Image or Text)**  
  - Type: If Node  
  - Role: Checks if the Telegram message contains text (true branch) or image (false branch).  
  - Config: Checks if `message.text` is non-empty.  
  - Inputs: Output of Split Prompt or Image Input and Telegram Trigger.  
  - Outputs: Routes to video generation from text or image processing.  
  - Edge Cases: Messages with neither text nor image; unexpected message structures.

- **Download Image from Telegram**  
  - Type: Telegram Node  
  - Role: Downloads the highest resolution image from Telegram message.  
  - Config: Uses file_id from Telegram photo array index 3 (highest res).  
  - Inputs: Telegram message with photo.  
  - Outputs: Telegram file download response.  
  - Edge Cases: Missing photo array or file_id; Telegram API failures.

- **Extract Image File URL**  
  - Type: HTTP Request  
  - Role: Constructs and fetches the direct URL to the Telegram image file.  
  - Config: Uses Telegram bot token and file_path from previous node.  
  - Inputs: Download Image from Telegram output.  
  - Outputs: Direct URL to image file.  
  - Edge Cases: Invalid file_path; Telegram API token issues.

---

#### 2.2 AI Video Generation

**Overview:**  
Generates a video either from a text prompt using Blotato or from an uploaded image using Kling via Piapi. Includes waiting for asynchronous rendering completion.

**Nodes Involved:**  
- Generate Video with blotato  
- Wait for blotato Video Rendering  
- Get blotato Video URL  
- Upload Image to Cloudinary  
- Convert Image to Video (Kling via Piapi)  
- Wait for Image-to-Video Rendering  
- Get Image-Based Video URL

**Node Details:**

- **Generate Video with blotato**  
  - Type: HTTP Request  
  - Role: Sends text prompt to Blotato API to create a cinematic style video using a predefined template.  
  - Config: POST to Blotato `/videos/creations` with JSON body including prompt and style.  
  - Inputs: Text prompt from Split Prompt or Image Input.  
  - Outputs: Video creation task ID and metadata.  
  - Edge Cases: API key invalid; network errors; prompt too long or invalid.

- **Wait for blotato Video Rendering**  
  - Type: Wait  
  - Role: Pauses workflow for 2 minutes to allow video rendering.  
  - Inputs: After video creation request.  
  - Outputs: Triggers next node after wait.  
  - Edge Cases: Rendering takes longer than wait time; no status polling implemented.

- **Get blotato Video URL**  
  - Type: HTTP Request  
  - Role: Retrieves the rendered video URL from Blotato using task ID.  
  - Config: GET request to Blotato `/videos/creations/{id}`.  
  - Inputs: Video creation task ID.  
  - Outputs: Video URL and metadata.  
  - Edge Cases: Video not ready; API errors.

- **Upload Image to Cloudinary**  
  - Type: HTTP Request  
  - Role: Uploads Telegram image to Cloudinary for hosting.  
  - Config: POST multipart/form-data with image binary and upload preset.  
  - Inputs: Image URL from Telegram.  
  - Outputs: Cloudinary hosted image URL.  
  - Edge Cases: Upload failures; credential issues.

- **Convert Image to Video**  
  - Type: HTTP Request  
  - Role: Sends Cloudinary image URL and prompt to Piapi’s Kling model to generate a short video.  
  - Config: POST to Piapi `/task` with video generation parameters including prompt, image URL, duration, and camera control.  
  - Inputs: Cloudinary image URL and prompt.  
  - Outputs: Task ID for video generation.  
  - Edge Cases: API errors; invalid parameters.

- **Wait for Image-to-Video Rendering**  
  - Type: Wait  
  - Role: Pauses workflow for 2 minutes to allow video rendering.  
  - Inputs: After video generation request.  
  - Outputs: Triggers next node after wait.  
  - Edge Cases: Rendering delays.

- **Get Image-Based Video URL**  
  - Type: HTTP Request  
  - Role: Retrieves video URL from Piapi using task ID.  
  - Inputs: Task ID from Convert Image to Video.  
  - Outputs: Video URL and metadata.  
  - Edge Cases: Video not ready; API errors.

---

#### 2.3 Music Generation and Fusion

**Overview:**  
Generates a music track based on style prompts, creates a short voice-over script with GPT-4, and merges the audio with the video using JSON2Video API.

**Nodes Involved:**  
- Generate Music with Piapi  
- Wait for Music Generation  
- Get Music File URL  
- Generate Script (GPT-4o-mini)  
- Split Script  
- Merge Video + Music  
- Wait for Fusion Completion  
- Get Final Video URL

**Node Details:**

- **Generate Music with Piapi**  
  - Type: HTTP Request  
  - Role: Requests Piapi to generate audio based on music style prompt.  
  - Config: POST to Piapi `/task` with model `Qubico/diffrhythm` and style prompt.  
  - Inputs: Music style from Split Prompt or Image Input.  
  - Outputs: Task ID for audio generation.  
  - Edge Cases: API errors; invalid style prompts.

- **Wait for Music Generation**  
  - Type: Wait  
  - Role: Pauses workflow for 2 minutes to allow audio generation.  
  - Inputs: After music generation request.  
  - Outputs: Triggers next node after wait.  
  - Edge Cases: Delays in audio generation.

- **Get Music File URL**  
  - Type: HTTP Request  
  - Role: Retrieves generated audio URL from Piapi using task ID.  
  - Inputs: Task ID from Generate Music with Piapi.  
  - Outputs: Audio URL and metadata.  
  - Edge Cases: Audio not ready; API errors.

- **Generate Script (GPT-4o-mini)**  
  - Type: OpenAI (Langchain)  
  - Role: Generates two short overlay text lines (hook and payoff) for video captions.  
  - Config: Uses GPT-4o-mini model with prompt to write two lines of overlay text based on caption idea.  
  - Inputs: Caption idea from Split Prompt or Image Input.  
  - Outputs: AI-generated text with lines prefixed by "text1:" and "text2:".  
  - Edge Cases: API key issues; malformed AI output.

- **Split Script**  
  - Type: Code (JavaScript)  
  - Role: Parses GPT output to extract `text1` and `text2` lines for overlay.  
  - Inputs: GPT output JSON.  
  - Outputs: JSON with `text1` and `text2`.  
  - Edge Cases: Unexpected AI output format; missing lines.

- **Merge Video + Music**  
  - Type: HTTP Request  
  - Role: Calls JSON2Video API to create a stylized video combining video, overlay texts, and audio track.  
  - Config: POST JSON with video URL, overlay text styling, and audio URL; uses custom authentication.  
  - Inputs: Video URL, overlay texts, audio URL.  
  - Outputs: Project ID for final video.  
  - Edge Cases: API errors; invalid URLs; auth failures.

- **Wait for Fusion Completion**  
  - Type: Wait  
  - Role: Pauses workflow for 1 minute to allow JSON2Video processing.  
  - Inputs: After merge request.  
  - Outputs: Triggers next node after wait.  
  - Edge Cases: Processing delays.

- **Get Final Video URL**  
  - Type: HTTP Request  
  - Role: Retrieves final merged video URL from JSON2Video using project ID.  
  - Inputs: Project ID from Merge Video + Music.  
  - Outputs: Final video URL and metadata.  
  - Edge Cases: Video not ready; API errors.

---

#### 2.4 Caption and Metadata Generation

**Overview:**  
Generates social media captions and SEO-friendly video titles using GPT-4, logs video metadata to Google Sheets, and sends final video and captions back to Telegram.

**Nodes Involved:**  
- Generate Social Caption (GPT-4)  
- Generate SEO Title (GPT-4)  
- Append Video Data to Google Sheet  
- Send Final Video to Telegram  
- Send Caption to Telegram  
- Assign Platform IDs for Blotato

**Node Details:**

- **Generate Social Caption (GPT-4)**  
  - Type: OpenAI (Langchain)  
  - Role: Creates a short, actionable social media caption based on caption idea.  
  - Config: GPT-4o-mini model with instructions to write problem+solution, max 150 chars, no quotes or line breaks.  
  - Inputs: Caption idea from Split Prompt or Image Input.  
  - Outputs: Caption text.  
  - Edge Cases: API errors; output formatting issues.

- **Generate SEO Title (GPT-4)**  
  - Type: OpenAI (Langchain)  
  - Role: Generates a punchy YouTube video title from caption idea.  
  - Config: GPT-4o-mini model with instructions to avoid special characters and keep under 70 chars.  
  - Inputs: Caption idea.  
  - Outputs: SEO-friendly title.  
  - Edge Cases: API errors; output formatting.

- **Append Video Data to Google Sheet**  
  - Type: Google Sheets  
  - Role: Logs video metadata (Title, Caption, URL) to a configured Google Sheet.  
  - Config: Append operation with columns mapped to title, caption, and video URL.  
  - Inputs: Title, caption, final video URL.  
  - Outputs: Confirmation of append.  
  - Edge Cases: Sheet access errors; invalid document ID; rate limits.

- **Send Final Video to Telegram**  
  - Type: Telegram Node  
  - Role: Sends a message to Telegram chat with video link and caption text for validation or reuse.  
  - Config: Sends text message with caption and video URL; uses chat ID from original Telegram message.  
  - Inputs: Caption and video URL from Google Sheet append.  
  - Outputs: Telegram message confirmation.  
  - Edge Cases: Telegram API errors; invalid chat ID.

- **Send Caption to Telegram**  
  - Type: Telegram Node  
  - Role: Sends the final video file to Telegram chat.  
  - Config: Sends video file using URL from Google Sheet; uses chat ID from previous Telegram message.  
  - Inputs: Video URL.  
  - Outputs: Telegram video send confirmation.  
  - Edge Cases: Telegram file size limits; invalid URLs.

- **Assign Platform IDs for Blotato**  
  - Type: Set Node  
  - Role: Defines platform-specific account IDs required for Blotato API publishing.  
  - Config: Hardcoded JSON object with IDs for Instagram, YouTube, TikTok, Facebook, Threads, Twitter, LinkedIn, Pinterest, Bluesky.  
  - Inputs: None (static data).  
  - Outputs: JSON with platform IDs.  
  - Edge Cases: Missing or incorrect IDs will cause publishing failures.

---

#### 2.5 Multi-Platform Auto-Publishing

**Overview:**  
Uploads the final video to Blotato and posts it automatically to nine social media platforms using Blotato’s API.

**Nodes Involved:**  
- Upload Video to Blotato  
- Post to Instagram  
- Post to YouTube  
- Post to TikTok  
- Post to Facebook Page  
- Post to Threads  
- Post to Twitter (X)  
- Post to LinkedIn  
- Post to Bluesky  
- Post to Pinterest  
- Sticky Note3 (documentation)

**Node Details:**

- **Upload Video to Blotato**  
  - Type: HTTP Request  
  - Role: Uploads the final video URL to Blotato media endpoint.  
  - Config: POST with video URL in body; uses Blotato API key header.  
  - Inputs: Final video URL from Google Sheet.  
  - Outputs: Media upload confirmation and media URL.  
  - Edge Cases: API key invalid; network errors.

- **Post to [Platform]** (Instagram, YouTube, TikTok, Facebook, Threads, Twitter, LinkedIn, Bluesky, Pinterest)  
  - Type: HTTP Request (one per platform)  
  - Role: Creates a post on each platform via Blotato API using platform-specific account IDs and media URLs.  
  - Config: POST to Blotato `/posts` endpoint with JSON body including accountId, targetType, content text (caption), and media URLs.  
  - Inputs: Platform IDs from Assign Platform IDs node; caption from Google Sheet; media URL from Upload Video to Blotato.  
  - Outputs: Post creation confirmation.  
  - Edge Cases: Missing or incorrect platform IDs; API errors; platform-specific constraints (e.g., privacy settings, board IDs for Pinterest).

- **Sticky Note3**  
  - Content: Describes this block as the final step automating distribution to 9 social platforms via Blotato API.

---

### 3. Summary Table

| Node Name                      | Node Type                 | Functional Role                          | Input Node(s)                         | Output Node(s)                                                                                  | Sticky Note                                                                                           |
|--------------------------------|---------------------------|----------------------------------------|-------------------------------------|------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Trigger Telegram Prompt or Image| Telegram Trigger          | Entry point: receives Telegram input   | -                                   | Split Prompt or Image Input                                                                     | # 🟫 STEP 1 — Create Video Using AI (image or text) This step handles the full video creation pipeline using AI. It starts from a Telegram message containing a prompt or image. |
| Split Prompt or Image Input     | Code                      | Cleans and splits input into components| Trigger Telegram Prompt or Image     | Condition Input Type (Image or Text)                                                            |                                                                                                     |
| Condition Input Type (Image or Text)| If Node               | Routes flow based on input type         | Split Prompt or Image Input          | Generate Video with blotato (text) / Download Image from Telegram (image)                        |                                                                                                     |
| Download Image from Telegram    | Telegram Node             | Downloads image from Telegram           | Condition Input Type (Image or Text) | Extract Image File URL                                                                          |                                                                                                     |
| Extract Image File URL          | HTTP Request              | Gets direct URL of Telegram image      | Download Image from Telegram         | Upload Image to Cloudinary                                                                      |                                                                                                     |
| Upload Image to Cloudinary      | HTTP Request              | Uploads image to Cloudinary             | Extract Image File URL               | Convert Image to Video                                                                          |                                                                                                     |
| Convert Image to Video          | HTTP Request              | Generates video from image via Piapi   | Upload Image to Cloudinary           | Wait for Image-to-Video Rendering                                                              |                                                                                                     |
| Wait for Image-to-Video Rendering| Wait                    | Waits for Piapi video rendering        | Convert Image to Video               | Get Image-Based Video URL                                                                       |                                                                                                     |
| Get Image-Based Video URL       | HTTP Request              | Retrieves video URL from Piapi          | Wait for Image-to-Video Rendering    | Merge Video Data (Image or Prompt)                                                             |                                                                                                     |
| Generate Video with blotato     | HTTP Request              | Generates video from text prompt       | Condition Input Type (Image or Text) | Wait for blotato Video Rendering                                                               |                                                                                                     |
| Wait for blotato Video Rendering| Wait                     | Waits for Blotato video rendering      | Generate Video with blotato          | Get blotato Video URL                                                                          |                                                                                                     |
| Get blotato Video URL           | HTTP Request              | Retrieves video URL from Blotato        | Wait for blotato Video Rendering     | Merge Video Data (Image or Prompt)                                                             |                                                                                                     |
| Merge Video Data (Image or Prompt)| Set                    | Combines video URL from either source   | Get blotato Video URL / Get Image-Based Video URL | Generate Music with Piapi                                                                |                                                                                                     |
| Generate Music with Piapi       | HTTP Request              | Generates music audio from style prompt| Merge Video Data (Image or Prompt)   | Wait for Music Generation                                                                      | # 🟫 STEP 2 — Create Music Here, a short-form voice-over script is generated using GPT-4 based on the topic. The script is converted to speech, uploaded, and merged with the AI-generated video — resulting in a fully narrated visual asset. |
| Wait for Music Generation       | Wait                      | Waits for music generation completion  | Generate Music with Piapi            | Get Music File URL                                                                             |                                                                                                     |
| Get Music File URL              | HTTP Request              | Retrieves generated music URL           | Wait for Music Generation            | Generate Script (GPT-4o-mini)                                                                  |                                                                                                     |
| Generate Script (GPT-4o-mini)  | OpenAI (Langchain)        | Creates overlay text script for video  | Get Music File URL                   | Split Script                                                                                   |                                                                                                     |
| Split Script                   | Code                      | Parses GPT output into text1 and text2 | Generate Script (GPT-4o-mini)        | Merge Video + Music                                                                            |                                                                                                     |
| Merge Video + Music            | HTTP Request              | Combines video, overlay text, and audio| Split Script                        | Wait for Fusion Completion                                                                    |                                                                                                     |
| Wait for Fusion Completion     | Wait                      | Waits for JSON2Video processing        | Merge Video + Music                  | Get Final Video URL                                                                           |                                                                                                     |
| Get Final Video URL            | HTTP Request              | Retrieves final merged video URL        | Wait for Fusion Completion           | Generate Social Caption (GPT-4)                                                                |                                                                                                     |
| Generate Social Caption (GPT-4)| OpenAI (Langchain)        | Creates social media caption             | Get Final Video URL                  | Generate SEO Title (GPT-4)                                                                     |                                                                                                     |
| Generate SEO Title (GPT-4)     | OpenAI (Langchain)        | Creates SEO-friendly video title        | Generate Social Caption (GPT-4)      | Append Video Data to Google Sheet                                                              |                                                                                                     |
| Append Video Data to Google Sheet| Google Sheets            | Logs metadata (title, caption, URL)     | Generate SEO Title (GPT-4)           | Send Final Video to Telegram                                                                   |                                                                                                     |
| Send Final Video to Telegram   | Telegram Node             | Sends video link and caption to Telegram| Append Video Data to Google Sheet    | Send Caption to Telegram                                                                      |                                                                                                     |
| Send Caption to Telegram       | Telegram Node             | Sends video file to Telegram chat       | Send Final Video to Telegram          | Assign Platform IDs for Blotato                                                                |                                                                                                     |
| Assign Platform IDs for Blotato| Set                       | Defines platform account IDs for Blotato| Send Caption to Telegram             | Upload Video to Blotato                                                                        |                                                                                                     |
| Upload Video to Blotato        | HTTP Request              | Uploads final video to Blotato           | Assign Platform IDs for Blotato      | Post to Instagram, YouTube, TikTok, Facebook, Threads, Twitter, LinkedIn, Bluesky, Pinterest    | # 🟥 STEP 5 — Auto-Publish to 9 Social Platforms The final step automates distribution using Blotato’s API. |
| Post to Instagram              | HTTP Request              | Posts video to Instagram via Blotato     | Upload Video to Blotato              | -                                                                                            |                                                                                                     |
| Post to YouTube                | HTTP Request              | Posts video to YouTube via Blotato       | Upload Video to Blotato              | -                                                                                            |                                                                                                     |
| Post to TikTok                 | HTTP Request              | Posts video to TikTok via Blotato        | Upload Video to Blotato              | -                                                                                            |                                                                                                     |
| Post to Facebook Page          | HTTP Request              | Posts video to Facebook via Blotato      | Upload Video to Blotato              | -                                                                                            |                                                                                                     |
| Post to Threads                | HTTP Request              | Posts video to Threads via Blotato       | Upload Video to Blotato              | -                                                                                            |                                                                                                     |
| Post to Twitter (X)            | HTTP Request              | Posts video to Twitter/X via Blotato     | Upload Video to Blotato              | -                                                                                            |                                                                                                     |
| Post to LinkedIn               | HTTP Request              | Posts video to LinkedIn via Blotato      | Upload Video to Blotato              | -                                                                                            |                                                                                                     |
| Post to Bluesky                | HTTP Request              | Posts video to Bluesky via Blotato       | Upload Video to Blotato              | -                                                                                            |                                                                                                     |
| Post to Pinterest             | HTTP Request              | Posts video to Pinterest via Blotato     | Upload Video to Blotato              | -                                                                                            |                                                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure to listen for "message" updates.  
   - Connect Telegram API credentials.  
   - Position: Start of workflow.

2. **Add Code Node "Split Prompt or Image Input"**  
   - JavaScript code to clean input text, remove "generate video" prefix, split by commas into `videoPrompt`, `captionIdea`, `musicStyle`.  
   - Connect output of Telegram Trigger to this node.

3. **Add If Node "Condition Input Type (Image or Text)"**  
   - Condition: Check if `message.text` is not empty.  
   - Connect output of Split Prompt or Image Input to this node.

4. **For Text Input Branch:**  
   - Add HTTP Request Node "Generate Video with blotato"  
     - POST to `https://backend.blotato.com/v2/videos/creations`  
     - JSON body includes `script` from `videoPrompt`, style "cinematic", template ID "base/pov/wakeup".  
     - Add Blotato API key in headers.  
   - Add Wait Node "Wait for blotato Video Rendering" (2 minutes).  
   - Add HTTP Request Node "Get blotato Video URL"  
     - GET `https://backend.blotato.com/v2/videos/creations/{id}` using ID from previous node.  
     - Use Blotato API key.  
   - Connect nodes sequentially.

5. **For Image Input Branch:**  
   - Add Telegram Node "Download Image from Telegram"  
     - Use `message.photo[3].file_id` from Telegram message.  
     - Connect Telegram credentials.  
   - Add HTTP Request Node "Extract Image File URL"  
     - GET `https://api.telegram.org/file/bot_YOURTOKEN/{file_path}` from previous node.  
   - Add HTTP Request Node "Upload Image to Cloudinary"  
     - POST multipart/form-data to Cloudinary upload endpoint.  
     - Include image binary and upload preset "n8n_video".  
     - Use HTTP Basic Auth credentials for Cloudinary.  
   - Add HTTP Request Node "Convert Image to Video"  
     - POST to Piapi `/task` endpoint with model "kling", video generation parameters including prompt and Cloudinary image URL.  
     - Use Piapi HTTP Header Auth credentials.  
   - Add Wait Node "Wait for Image-to-Video Rendering" (2 minutes).  
   - Add HTTP Request Node "Get Image-Based Video URL"  
     - GET Piapi `/task/{task_id}` to retrieve video URL.  
   - Connect nodes sequentially.

6. **Merge Video Data (Image or Prompt)**  
   - Add Set Node "Merge Video Data (Image or Prompt)"  
   - Assign `url_video` from either Blotato or Piapi video URL.  
   - Connect outputs of both video URL retrieval nodes to this node.

7. **Generate Music with Piapi**  
   - HTTP Request Node to Piapi `/task` with model "Qubico/diffrhythm" and `musicStyle` prompt.  
   - Use Piapi HTTP Header Auth credentials.

8. **Wait for Music Generation** (2 minutes).

9. **Get Music File URL**  
   - HTTP Request GET to Piapi `/task/{task_id}` to get audio URL.

10. **Generate Script (GPT-4o-mini)**  
    - OpenAI Node using GPT-4o-mini model.  
    - Prompt to generate two overlay text lines based on `captionIdea`.

11. **Split Script**  
    - Code Node to parse GPT output into `text1` and `text2`.

12. **Merge Video + Music**  
    - HTTP Request to JSON2Video `/v2/movies` endpoint.  
    - JSON body includes video URL, overlay texts with styling, and audio URL.  
    - Use JSON2Video custom authentication.

13. **Wait for Fusion Completion** (1 minute).

14. **Get Final Video URL**  
    - HTTP Request GET to JSON2Video `/v2/movies?id={project}`.

15. **Generate Social Caption (GPT-4)**  
    - OpenAI Node with GPT-4o-mini model.  
    - Prompt to create actionable social media caption from `captionIdea`.

16. **Generate SEO Title (GPT-4)**  
    - OpenAI Node with GPT-4o-mini model.  
    - Prompt to create punchy YouTube title from `captionIdea`.

17. **Append Video Data to Google Sheet**  
    - Google Sheets Node (append operation).  
    - Map columns: Title (from SEO Title), Caption (from Social Caption), URL (final video URL).  
    - Connect Google Sheets OAuth2 credentials.

18. **Send Final Video to Telegram**  
    - Telegram Node to send text message with caption and video link.  
    - Use chat ID from original Telegram message.

19. **Send Caption to Telegram**  
    - Telegram Node to send video file using URL from Google Sheet.  
    - Use chat ID from original Telegram message.

20. **Assign Platform IDs for Blotato**  
    - Set Node with JSON object containing platform-specific account IDs for Instagram, YouTube, TikTok, Facebook, Threads, Twitter, LinkedIn, Pinterest, Bluesky.

21. **Upload Video to Blotato**  
    - HTTP Request POST to Blotato `/v2/media` with video URL from Google Sheet.  
    - Use Blotato API key.

22. **Post to Social Platforms via Blotato**  
    - Create one HTTP Request node per platform (Instagram, YouTube, TikTok, Facebook, Threads, Twitter, LinkedIn, Bluesky, Pinterest).  
    - POST to Blotato `/v2/posts` with JSON body including platform account ID, target type, caption text, and media URLs.  
    - Use Blotato API key.

23. **Connect all nodes according to the logical flow described above.**

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                                               |
|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| ⚠️ This workflow uses Community Nodes and requires a self-hosted n8n instance.                                 | Workflow disclaimer.                                                                                                          |
| Documentation and setup guide available at Notion: [Notion Guide](https://automatisation.notion.site/Auto-create-and-publish-AI-social-videos-with-Telegram-GPT-4-and-Blotato-1dc3d6550fd980019cebd8ca461bd4ba?pvs=4) | Official documentation link.                                                                                                 |
| Setup requires API keys and credentials for Telegram, OpenAI, Kling (Piapi), Cloudinary, Google Sheets, and Blotato. | Credential configuration instructions.                                                                                        |
| Customization tips: prompt formatting, text styling, Telegram approval step, platform disabling, Google Sheet filtering. | Workflow customization suggestions.                                                                                          |
| Sticky notes in workflow provide step-by-step explanations for each major block (Steps 1 to 5).                | Visual guidance embedded in workflow.                                                                                        |

---

This structured reference document provides a comprehensive understanding of the workflow’s architecture, node configurations, and operational logic, enabling advanced users and AI agents to reproduce, modify, or troubleshoot the automation effectively.