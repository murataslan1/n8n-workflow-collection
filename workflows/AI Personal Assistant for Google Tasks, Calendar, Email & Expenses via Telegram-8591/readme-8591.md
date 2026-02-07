AI Personal Assistant for Google Tasks, Calendar, Email & Expenses via Telegram

https://n8nworkflows.xyz/workflows/ai-personal-assistant-for-google-tasks--calendar--email---expenses-via-telegram-8591


# AI Personal Assistant for Google Tasks, Calendar, Email & Expenses via Telegram

### 1. Workflow Overview

This workflow automates the creation, editing, and distribution of AI-generated viral videos based on user-submitted ideas and images via Telegram. It uses advanced AI models and multiple integrations to transform a user’s video concept into a finished video shared across various social media platforms.

**Target Use Cases:**  
- Content creators and marketers seeking automated video generation from user prompts and images.  
- Social media managers wanting to streamline multi-platform video publishing.  
- AI enthusiasts leveraging generative models for UGC-style video ads.

**Logical Blocks:**  
- **1.1 Input Reception & Image Acquisition:** Receive video ideas and images via Telegram, download and upload images to Google Drive, and log initial data.  
- **1.2 Image Analysis & Prompt Generation:** Analyze the uploaded image with OpenAI Vision, update descriptions in Google Sheets, then generate a structured image prompt using AI.  
- **1.3 Image Editing:** Submit the generated image prompt and image to NanoBanana for AI-based editing, wait for completion, then download the edited image.  
- **1.4 Video Script Generation:** Use AI to generate a detailed video script based on the user’s idea and image analysis, then format it for video generation.  
- **1.5 Video Generation & Captioning:** Generate the video with VEO3, wait for rendering, download the video, rewrite the caption via GPT-4o, and save metadata to Google Sheets.  
- **1.6 Multi-Platform Video Upload:** Upload the final video to Blotato and post it on 9 social media platforms concurrently.  
- **1.7 Status Update & Notification:** Update the Google Sheet status to "Published" and notify the user on Telegram.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Image Acquisition

- **Overview:** Captures user video idea and image from Telegram, downloads the image file, uploads it to Google Drive, and logs initial metadata in Google Sheets.  
- **Nodes Involved:** Telegram Trigger: Receive Video Idea, Telegram: Get Image File, Google Drive: Upload Image, Google Sheets: Log Image & Caption, Set: Bot Token (Placeholder), Telegram API: Get File URL  
- **Node Details:**  
  - **Telegram Trigger: Receive Video Idea**  
    - Type: Telegram Trigger  
    - Role: Entry point capturing user messages with image and caption.  
    - Parameters: Listens for message updates on Telegram.  
    - Outputs: User's chat id, photo file IDs, and caption.  
    - Edge Cases: Missing photo or caption, Telegram API errors, webhook failures.  
  - **Telegram: Get Image File**  
    - Type: Telegram node (file resource)  
    - Role: Downloads the largest resolution user image (photo[2]) from Telegram servers.  
    - Input: file_id from Telegram trigger  
    - Output: File binary data.  
    - Edge Cases: Invalid file_id, download failure, rate limits.  
  - **Google Drive: Upload Image**  
    - Type: Google Drive node  
    - Role: Uploads downloaded image to a specified Google Drive folder (public).  
    - Input: binary file data from Telegram node  
    - Outputs: Uploaded file metadata including public URL.  
    - Credentials: Google Drive OAuth2  
    - Edge Cases: Permissions denied, upload failure, API quota exceeded.  
  - **Google Sheets: Log Image & Caption**  
    - Type: Google Sheets node  
    - Role: Logs initial image metadata and user caption with "EN COURS" status in spreadsheet.  
    - Input: Google Drive URL, Telegram caption, image unique ID  
    - Credentials: Google Sheets OAuth2  
    - Edge Cases: Sheet ID or range errors, write conflicts.  
  - **Set: Bot Token (Placeholder)**  
    - Type: Set node  
    - Role: Holds Telegram bot token for subsequent API calls.  
    - Parameters: Contains empty string placeholder for bot token.  
  - **Telegram API: Get File URL**  
    - Type: HTTP Request  
    - Role: Uses Telegram bot token to get direct file URL for the uploaded image (photo[3]).  
    - Input: Bot token and file_id from Telegram trigger  
    - Edge Cases: Invalid token, file_id, HTTP errors.

#### 1.2 Image Analysis & Prompt Generation

- **Overview:** Analyzes the reference image using OpenAI Vision to extract structured YAML metadata, updates the description in Google Sheets, then generates a realistic UGC-style image prompt using an AI agent.  
- **Nodes Involved:** OpenAI Vision: Analyze Reference Image, Google Sheets: Update Image Description, Generate Image Prompt, LLM: OpenAI Chat, LLM: Structured Output Parser  
- **Node Details:**  
  - **OpenAI Vision: Analyze Reference Image**  
    - Type: OpenAI image analysis node  
    - Role: Analyzes image content, returning YAML description of product/character.  
    - Input: Direct file URL from Telegram API node  
    - Output: YAML string with detailed features (brand, colors, style)  
    - Credentials: OpenAI API  
    - Edge Cases: Image too complex, API limits, invalid URL.  
  - **Google Sheets: Update Image Description**  
    - Type: Google Sheets node  
    - Role: Updates the sheet row with the YAML image description.  
    - Input: Extracted YAML content, image unique ID to match row  
    - Credentials: Google Sheets OAuth2  
    - Edge Cases: Matching failure, write conflicts.  
  - **Generate Image Prompt**  
    - Type: Langchain AI Agent node  
    - Role: Uses the image description and user caption to generate a natural, lifelike image prompt JSON object (≤120 words).  
    - Input: Caption and YAML description from Google Sheet  
    - Output: JSON with key `image_prompt`  
    - Edge Cases: Parsing errors, AI model downtime.  
  - **LLM: OpenAI Chat**  
    - Type: Langchain Chat node  
    - Role: Provides natural language processing to support image prompt generation.  
    - Credentials: OpenAI API  
  - **LLM: Structured Output Parser**  
    - Type: Langchain Output Parser  
    - Role: Parses AI output into structured JSON for subsequent use.

#### 1.3 Image Editing

- **Overview:** Sends the generated image prompt and uploaded image URLs to NanoBanana for AI editing, waits for processing, and downloads the edited image.  
- **Nodes Involved:** NanoBanana: Create Image, Wait for Image Edit, Download Edited Image  
- **Node Details:**  
  - **NanoBanana: Create Image**  
    - Type: HTTP Request (Fal.ai API)  
    - Role: Submits prompt and image URLs to NanoBanana API for AI editing.  
    - Input: JSON body with escaped image prompt and Google Drive image URL  
    - Credentials: Fal.ai API key  
    - Edge Cases: API errors, malformed request.  
  - **Wait for Image Edit**  
    - Type: Wait node  
    - Role: Pauses workflow for 20 seconds to allow image processing.  
    - Edge Cases: Insufficient wait time causing premature requests.  
  - **Download Edited Image**  
    - Type: HTTP Request  
    - Role: Downloads the edited image from NanoBanana response URL.  
    - Credentials: Fal.ai API key  
    - Edge Cases: Invalid URL, timeout.

#### 1.4 Video Script Generation

- **Overview:** Reads video parameters from Google Sheets, sets a master structured prompt schema, generates a video script with an AI agent using the user’s description and image analysis, then formats the prompt for video generation.  
- **Nodes Involved:** Google Sheets: Read Video Parameters (CONFIG), Set Master Prompt, OpenAI Chat Model, Structured Output Parser, AI Agent: Generate Video Script, Format Prompt  
- **Node Details:**  
  - **Google Sheets: Read Video Parameters (CONFIG)**  
    - Type: Google Sheets node  
    - Role: Retrieves configuration values such as model selection for video generation.  
    - Credentials: Google Sheets OAuth2  
  - **Set Master Prompt**  
    - Type: Set node  
    - Role: Defines a detailed JSON schema template for video ad prompts, including visual, audio, motion, and style parameters.  
  - **OpenAI Chat Model**  
    - Type: Langchain Chat node  
    - Role: Provides AI language model processing with GPT-4.1-mini for video script generation.  
    - Credentials: OpenAI API  
  - **Structured Output Parser**  
    - Type: Langchain Output Parser  
    - Role: Parses AI output ensuring it matches the required JSON schema.  
  - **AI Agent: Generate Video Script**  
    - Type: Langchain AI Agent node  
    - Role: Generates a user-generated-content style video script JSON object with fields `title` and `final_prompt`.  
    - Input: User caption, image description, master prompt schema  
    - Output: JSON with `title` and stringified `final_prompt`  
  - **Format Prompt**  
    - Type: Code node  
    - Role: Converts the structured prompt into a properly escaped JSON string and sets model and aspect ratio for video generation.  

#### 1.5 Video Generation & Captioning

- **Overview:** Uses VEO3 API to generate a video based on the formatted prompt and edited image, waits for rendering completion, downloads the video, rewrites the video caption with GPT-4o ensuring strict character limits, and saves all metadata to Google Sheets.  
- **Nodes Involved:** Generate Video with VEO3, Wait for VEO3 Rendering, Download Video from VEO3, Rewrite Caption with GPT-4o, Save Caption Video to Google Sheets, Send Video URL via Telegram, Send Final Video Preview  
- **Node Details:**  
  - **Generate Video with VEO3**  
    - Type: HTTP Request  
    - Role: Calls VEO3 API to create video using prompt, model, aspect ratio, and edited image URL.  
    - Credentials: Kie AI API key  
    - Edge Cases: API rate limits, invalid parameters.  
  - **Wait for VEO3 Rendering**  
    - Type: Wait node  
    - Role: Waits 20 seconds for video processing.  
  - **Download Video from VEO3**  
    - Type: HTTP Request  
    - Role: Retrieves final video URLs using task ID from generation node.  
  - **Rewrite Caption with GPT-4o**  
    - Type: Langchain OpenAI node  
    - Role: Rewrites TikTok video caption text within strict 200 characters limit.  
    - Credentials: OpenAI API  
    - Edge Cases: Caption exceeding length, invalid input.  
  - **Save Caption Video to Google Sheets**  
    - Type: Google Sheets node  
    - Role: Updates the Google Sheet with final video title, caption, video URL, and status "CREATE".  
    - Credentials: Google Sheets OAuth2  
  - **Send Video URL via Telegram**  
    - Type: Telegram node  
    - Role: Sends the video URL to the user chat on Telegram.  
    - Credentials: Telegram API  
  - **Send Final Video Preview**  
    - Type: Telegram node  
    - Role: Sends the actual video file preview to the user on Telegram.

#### 1.6 Multi-Platform Video Upload

- **Overview:** Uploads the final video to Blotato platform and posts it on multiple social media including TikTok, LinkedIn, Facebook, Instagram, Twitter (X), YouTube, Threads, Bluesky, and Pinterest via Blotato’s API nodes.  
- **Nodes Involved:** Upload Video to BLOTATO, Tiktok, Linkedin, Facebook, Instagram, Twitter (X), Youtube, Threads, Bluesky, Pinterest, Merge  
- **Node Details:**  
  - **Upload Video to BLOTATO**  
    - Type: Blotato node  
    - Role: Uploads video media to Blotato.  
    - Input: Video URL from VEO3 download node  
    - Credentials: Blotato API key  
  - **Platform-specific nodes (TikTok, Linkedin, etc.)**  
    - Type: Blotato nodes configured per platform  
    - Role: Posts the video with caption on respective social media accounts using Blotato API.  
    - Input: Video URL and caption from Google Sheets  
    - Credentials: Blotato API key  
  - **Merge**  
    - Type: Merge node (chooseBranch mode)  
    - Role: Synchronizes parallel posting branches from all platforms before proceeding.  
    - Edge Cases: API failures per platform, rate limits, partial success handling.

#### 1.7 Status Update & Notification

- **Overview:** Updates the video status to "Published" in Google Sheets and sends a Telegram notification to the user confirming publishing completion.  
- **Nodes Involved:** Update Status to "DONE", Telegram: Send notification  
- **Node Details:**  
  - **Update Status to "DONE"**  
    - Type: Google Sheets node  
    - Role: Appends or updates the status field for the video row as "Published".  
    - Input: Image unique ID as key  
    - Credentials: Google Sheets OAuth2  
  - **Telegram: Send notification**  
    - Type: Telegram node  
    - Role: Sends a text message "Published" to user chat ID confirming workflow completion.  
    - Credentials: Telegram API

---

### 3. Summary Table

| Node Name                      | Node Type                        | Functional Role                                | Input Node(s)                               | Output Node(s)                            | Sticky Note                                                                                                                      |
|--------------------------------|----------------------------------|-----------------------------------------------|--------------------------------------------|------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger: Receive Video Idea | Telegram Trigger                 | Entry point: Receives user video idea & image | -                                          | Set: Bot Token (Placeholder), Telegram: Get Image File | # 📑 STEP 1 — Collect Idea & Image                                                                                              |
| Telegram: Get Image File        | Telegram                        | Downloads user image file                       | Telegram Trigger: Receive Video Idea       | Google Drive: Upload Image               | # 📑 STEP 1 — Collect Idea & Image                                                                                              |
| Google Drive: Upload Image      | Google Drive                    | Uploads image to Google Drive                   | Telegram: Get Image File                    | Google Sheets: Log Image & Caption       | # 📑 STEP 1 — Collect Idea & Image                                                                                              |
| Google Sheets: Log Image & Caption | Google Sheets                  | Logs initial image and caption data             | Google Drive: Upload Image                  | Set: Bot Token (Placeholder)              | # 📑 STEP 1 — Collect Idea & Image                                                                                              |
| Set: Bot Token (Placeholder)    | Set                            | Holds Telegram bot token placeholder            | Telegram Trigger: Receive Video Idea, Google Sheets: Log Image & Caption | Telegram API: Get File URL               | # 📑 STEP 1 — Collect Idea & Image                                                                                              |
| Telegram API: Get File URL      | HTTP Request                   | Retrieves direct Telegram file URL              | Set: Bot Token (Placeholder)                | OpenAI Vision: Analyze Reference Image   | # 📑 STEP 1 — Collect Idea & Image                                                                                              |
| OpenAI Vision: Analyze Reference Image | OpenAI Image Analysis          | Analyzes image and outputs YAML description     | Telegram API: Get File URL                   | Google Sheets: Update Image Description  | # 📑 STEP 2 — Create Image with NanoBanana                                                                                      |
| Google Sheets: Update Image Description | Google Sheets                  | Updates image description in sheet              | OpenAI Vision: Analyze Reference Image     | Generate Image Prompt                     | # 📑 STEP 2 — Create Image with NanoBanana                                                                                      |
| Generate Image Prompt           | Langchain Agent                | Creates realistic UGC-style image prompt JSON   | Google Sheets: Update Image Description    | NanoBanana: Create Image                  | # 📑 STEP 2 — Create Image with NanoBanana                                                                                      |
| LLM: OpenAI Chat               | Langchain Chat                 | Supports image prompt generation                 | -                                          | Generate Image Prompt                     | # 📑 STEP 2 — Create Image with NanoBanana                                                                                      |
| LLM: Structured Output Parser  | Langchain Output Parser        | Parses AI structured output                       | -                                          | Generate Image Prompt                     | # 📑 STEP 2 — Create Image with NanoBanana                                                                                      |
| NanoBanana: Create Image       | HTTP Request                   | Submits image editing request                     | Generate Image Prompt                       | Wait for Image Edit                       | # 📑 STEP 2 — Create Image with NanoBanana                                                                                      |
| Wait for Image Edit            | Wait                          | Waits 20 seconds for image processing            | NanoBanana: Create Image                    | Download Edited Image                     | # 📑 STEP 2 — Create Image with NanoBanana                                                                                      |
| Download Edited Image          | HTTP Request                   | Downloads edited image                            | Wait for Image Edit                         | Google Sheets: Read Video Parameters (CONFIG) | # 📑 STEP 2 — Create Image with NanoBanana                                                                                      |
| Google Sheets: Read Video Parameters (CONFIG) | Google Sheets                  | Reads video generation config parameters         | Download Edited Image                       | Set Master Prompt                        | # 📑 STEP 3 — Generate Video Ad Script                                                                                          |
| Set Master Prompt              | Set                            | Defines detailed video prompt schema              | Google Sheets: Read Video Parameters (CONFIG) | AI Agent: Generate Video Script          | # 📑 STEP 3 — Generate Video Ad Script                                                                                          |
| OpenAI Chat Model              | Langchain Chat                 | Generates video script JSON                        | Set Master Prompt                          | AI Agent: Generate Video Script          | # 📑 STEP 3 — Generate Video Ad Script                                                                                          |
| Structured Output Parser       | Langchain Output Parser        | Parses video script output                         | OpenAI Chat Model                          | AI Agent: Generate Video Script          | # 📑 STEP 3 — Generate Video Ad Script                                                                                          |
| AI Agent: Generate Video Script | Langchain Agent                | Creates structured video ad prompt JSON           | Structured Output Parser, Set Master Prompt | Format Prompt                           | # 📑 STEP 3 — Generate Video Ad Script                                                                                          |
| Format Prompt                 | Code                          | Formats prompt for VEO3 video generation           | AI Agent: Generate Video Script            | Generate Video with VEO3                  | # 📑 STEP 3 — Generate Video Ad Script                                                                                          |
| Generate Video with VEO3      | HTTP Request                   | Calls API to generate video                         | Format Prompt                             | Wait for VEO3 Rendering                   | # 📑 STEP 4 — Generate Video with VEO3                                                                                          |
| Wait for VEO3 Rendering       | Wait                          | Waits 20 seconds for video rendering                | Generate Video with VEO3                   | Download Video from VEO3                  | # 📑 STEP 4 — Generate Video with VEO3                                                                                          |
| Download Video from VEO3      | HTTP Request                   | Downloads generated video URLs                       | Wait for VEO3 Rendering                    | Rewrite Caption with GPT-4o               | # 📑 STEP 4 — Generate Video with VEO3                                                                                          |
| Rewrite Caption with GPT-4o    | Langchain OpenAI              | Rewrites video caption text with character limit   | Download Video from VEO3                   | Save Caption Video to Google Sheets      | # 📑 STEP 4 — Generate Video with VEO3                                                                                          |
| Save Caption Video to Google Sheets | Google Sheets                  | Saves final video metadata and caption              | Rewrite Caption with GPT-4o                | Send Video URL via Telegram               | # 📑 STEP 4 — Generate Video with VEO3                                                                                          |
| Send Video URL via Telegram   | Telegram                      | Sends video URL to user                              | Save Caption Video to Google Sheets       | Send Final Video Preview                  | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Send Final Video Preview      | Telegram                      | Sends actual video preview file to user             | Send Video URL via Telegram                | Upload Video to BLOTATO                   | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Upload Video to BLOTATO       | Blotato                       | Uploads video media to Blotato                        | Send Final Video Preview                   | TikTok, Linkedin, Facebook, ... (9 platforms) | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| TikTok                       | Blotato                       | Posts video on TikTok                                  | Upload Video to BLOTATO                    | Merge                                    | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Linkedin                     | Blotato                       | Posts video on LinkedIn                                | Upload Video to BLOTATO                    | Merge                                    | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Facebook                     | Blotato                       | Posts video on Facebook                                | Upload Video to BLOTATO                    | Merge                                    | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Instagram                   | Blotato                       | Posts video on Instagram                              | Upload Video to BLOTATO                    | Merge                                    | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Twitter (X)                 | Blotato                       | Posts video on Twitter (X)                            | Upload Video to BLOTATO                    | Merge                                    | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Youtube                     | Blotato                       | Posts video on YouTube                                | Upload Video to BLOTATO                    | Merge                                    | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Threads                     | Blotato                       | Posts video on Threads                                | Upload Video to BLOTATO                    | Merge                                    | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Bluesky                     | Blotato                       | Posts video on Bluesky                                | Upload Video to BLOTATO                    | Merge                                    | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Pinterest                   | Blotato                       | Posts video on Pinterest                              | Upload Video to BLOTATO                    | Merge                                    | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Merge                       | Merge                         | Synchronizes all social media posting branches       | TikTok, Linkedin, Facebook, Instagram, Twitter, YouTube, Threads, Bluesky, Pinterest | Update Status to "DONE"                  | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Update Status to "DONE"      | Google Sheets                 | Updates video status to Published                      | Merge                                     | Telegram: Send notification               | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Telegram: Send notification  | Telegram                      | Notifies user of publishing completion                | Update Status to "DONE"                    | -                                        | # 📑 STEP 5 — Auto-Post to All Platforms                                                                                        |
| Sticky Note(s)               | Sticky Note                   | Visual comments with step titles, tutorial links, and requirements | Various                                   | -                                        | See sticky note content in sections above for detailed guidance and links.                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node:**  
   - Type: Telegram Trigger  
   - Configure webhook to listen for message updates including photos and captions.  
   - Connect output to next nodes.

2. **Download Telegram Image:**  
   - Add Telegram node (Get Image File resource).  
   - Use the largest photo size file_id from the trigger input.  
   - Connect output to Google Drive upload node.

3. **Upload Image to Google Drive:**  
   - Add Google Drive node (Upload File).  
   - Configure with OAuth2 credentials.  
   - Set destination folder (publicly accessible).  
   - Use binary data from Telegram node as file content.  
   - Connect output to Google Sheets log node.

4. **Log Image & Caption to Google Sheets:**  
   - Add Google Sheets node (Append or Update).  
   - Configure spreadsheet ID and sheet name.  
   - Map IMAGE NAME (unique ID), IMAGE URL (Google Drive link), CAPTION (Telegram caption), STATUS ("EN COURS").  
   - Connect output to Set node for bot token.

5. **Set Telegram Bot Token:**  
   - Add Set node.  
   - Define variable for YOUR_BOT_TOKEN with actual bot token string.  
   - Connect output to Telegram API HTTP Request node.

6. **Get Telegram File URL:**  
   - Add HTTP Request node.  
   - URL: `https://api.telegram.org/bot{{YOUR_BOT_TOKEN}}/getFile?file_id={{photo[3].file_id}}`  
   - Connect output to OpenAI Vision Analysis node.

7. **Analyze Image with OpenAI Vision:**  
   - Add Langchain OpenAI node configured for image analysis.  
   - Input: direct file URL from Telegram API node.  
   - Output YAML describing image content.  
   - Connect output to Google Sheets update node.

8. **Update Image Description in Google Sheets:**  
   - Add Google Sheets node (Append or Update).  
   - Update row matching IMAGE NAME with IMAGE DESCRIPTION (YAML).  
   - Connect output to Generate Image Prompt node.

9. **Generate Image Prompt with AI Agent:**  
   - Add Langchain Agent node.  
   - Input: User caption and image description from Google Sheets.  
   - System message and instructions to generate JSON with `image_prompt`.  
   - Connect output to NanoBanana HTTP Request node.

10. **Create Image via NanoBanana API:**  
    - Add HTTP Request node.  
    - POST to NanoBanana API URL with JSON body containing escaped image prompt and Google Drive image URL.  
    - Provide Fal.ai API credentials.  
    - Connect output to Wait node.

11. **Wait for Image Editing:**  
    - Add Wait node for 20 seconds delay.  
    - Connect output to Download Edited Image node.

12. **Download Edited Image:**  
    - Add HTTP Request node.  
    - Use response_url from NanoBanana node to download the edited image.  
    - Connect output to Google Sheets read config node.

13. **Read Video Parameters from Google Sheets:**  
    - Add Google Sheets node.  
    - Read configuration parameters like model type and other video settings.  
    - Connect output to Set Master Prompt node.

14. **Set Master Prompt JSON Schema:**  
    - Add Set node.  
    - Define detailed JSON schema for video prompt structure as given in the workflow.  
    - Connect output to OpenAI Chat Model node.

15. **Generate Video Script with OpenAI Chat Model:**  
    - Add Langchain Chat node configured with GPT-4.1-mini.  
    - Input the user caption, image description, and master prompt schema.  
    - Connect output to Structured Output Parser node.

16. **Parse Structured Output:**  
    - Add Langchain Output Parser node.  
    - Validate and parse AI output to JSON with keys `title` and `final_prompt`.  
    - Connect output to AI Agent node.

17. **Run AI Agent for Video Script:**  
    - Add Langchain Agent node.  
    - Use parsed prompt data to generate video script JSON object.  
    - Connect output to Code node (Format Prompt).

18. **Format Prompt for Video Generation:**  
    - Add Code node.  
    - Stringify and escape the final prompt JSON, set model to `veo3_fast` and aspect ratio to `16:9`.  
    - Connect output to HTTP Request node for video generation.

19. **Generate Video with VEO3 API:**  
    - Add HTTP Request node.  
    - POST to VEO3 API with prompt, model, aspectRatio, and edited image URL.  
    - Provide Kie AI API credentials.  
    - Connect output to Wait node.

20. **Wait for Video Rendering:**  
    - Add Wait node for 20 seconds delay.  
    - Connect output to Download Video node.

21. **Download Video from VEO3:**  
    - Add HTTP Request node.  
    - Query for task status and video URLs using taskId from generation node.  
    - Connect output to Langchain OpenAI node for caption rewriting.

22. **Rewrite Caption with GPT-4o:**  
    - Add Langchain OpenAI node.  
    - Rewrite caption text under 200 characters using user caption and video title as context.  
    - Connect output to Google Sheets save node.

23. **Save Caption and Video Metadata to Google Sheets:**  
    - Add Google Sheets node.  
    - Append or update row with video title, caption, video URL, and status "CREATE".  
    - Connect output to Telegram node to send video URL.

24. **Send Video URL via Telegram:**  
    - Add Telegram node.  
    - Send text message with video URL to user chat.  
    - Connect output to Telegram node for final video preview.

25. **Send Final Video Preview via Telegram:**  
    - Add Telegram node.  
    - Send video file to user chat.  
    - Connect output to Blotato upload node.

26. **Upload Video to Blotato:**  
    - Add Blotato node.  
    - Upload video media URL.  
    - Connect output to multiple platform posting nodes.

27. **Post Video to Social Platforms:**  
    - Add Blotato nodes for TikTok, LinkedIn, Facebook, Instagram, Twitter, YouTube, Threads, Bluesky, Pinterest.  
    - Configure each with respective account IDs and video URL plus caption from Google Sheets.  
    - Connect all outputs to Merge node.

28. **Synchronize All Posts:**  
    - Add Merge node (chooseBranch mode) to wait for all platform posts to complete.  
    - Connect output to Google Sheets update node.

29. **Update Status to "Published":**  
    - Add Google Sheets node.  
    - Update status to "Published" for the video row.  
    - Connect output to Telegram notification node.

30. **Send Publishing Notification via Telegram:**  
    - Add Telegram node.  
    - Send a “Published” text message to the user confirming completion.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                         | Context or Link                                                                                                                                    |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| Full tutorial video for the workflow setup and overview is available: ![AI Voice Agent Preview](https://www.dr-firas.com/nanobanana.png) [Watch on YouTube](https://youtu.be/nlwpbXQqNQ4)                                            | Tutorial video for visual walkthrough                                                                                                            |
| Detailed documentation with setup instructions, API configs, and customization tips is hosted on Notion: [Open Documentation](https://automatisation.notion.site/NonoBanan-2643d6550fd98041aef5dcbe8ab0f7a1?source=copy_link)         | Documentation link                                                                                                                                 |
| Requirements include creating a Blotato Pro account, enabling “Verified Community Nodes” in n8n, setting up Blotato API credentials, duplicating a provided Google Sheet template, and making Google Drive folder public.              | Setup prerequisites                                                                                                                               |
| The workflow uses advanced AI models (OpenAI GPT-4, GPT-4o, VEO3, NanoBanana) requiring API keys and rate limit considerations. Ensure all credentials are properly configured and tested.                                           | Credential and API usage notes                                                                                                                    |
| The workflow is modular, with clearly separated functional blocks allowing easy maintenance and substitution of AI models or APIs as needed.                                                                                      | Architectural note                                                                                                                                |
| The use of Merge node in chooseBranch mode synchronizes multi-platform posting, but error handling for partial failures should be considered and may require workflow extension for retries or notifications.                       | Potential extension for robustness                                                                                                               |
| Telegram nodes rely on webhook URLs; ensure the webhook endpoint is publicly reachable and properly secured.                                                                                                                       | Telegram integration note                                                                                                                         |

---

**Disclaimer:** The provided text derives exclusively from an automated workflow created with n8n, adhering strictly to current content policies and containing no illegal, offensive, or protected material. All processed data are legal and public.