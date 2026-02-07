Automate AI Video Creation & Multi-Platform Publishing with Gemini & Creatomate

https://n8nworkflows.xyz/workflows/automate-ai-video-creation---multi-platform-publishing-with-gemini---creatomate-8404


# Automate AI Video Creation & Multi-Platform Publishing with Gemini & Creatomate

### 1. Workflow Overview

This workflow automates the entire process of creating viral AI-generated video content and publishing it to multiple platforms (YouTube and Instagram). It leverages Google Gemini for AI text generation, Pollinations AI for image generation, Airtable as a content and asset database, and Creatomate for video rendering. The workflow is designed for content creators and marketers targeting niches like Technology & AI, aiming to produce engaging, high-quality short videos optimized for social media formats such as YouTube Shorts and Instagram Reels.

The workflow is logically divided into the following blocks:

- **1.1 AI Content Generation:** Generates a viral video script with detailed scenes and image prompts using Google Gemini and LangChain nodes.
- **1.2 Image Prompt Processing & Generation:** Extracts image prompts from AI output, enhances them, and generates high-quality images with Pollinations AI.
- **1.3 Image Storage & Airtable Integration:** Converts and uploads generated images to Airtable, associating them with scene records.
- **1.4 Video Metadata Handling & Airtable Records:** Organizes and updates video metadata and scenes in Airtable tables.
- **1.5 Video Rendering with Creatomate:** Prepares structured video templates and submits them to Creatomate API for rendering.
- **1.6 Video Status Monitoring & Publishing:** Monitors rendering status, fetches the final video, and publishes it to YouTube and Instagram.

---

### 2. Block-by-Block Analysis

#### 2.1 AI Content Generation

**Overview:**  
Generates a viral Technology & AI video script with multiple scenes and associated image prompts using Google Gemini and LangChain. The output is structured JSON containing video metadata, scenes, and image prompts.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Google Gemini Chat Model (LangChain LM Chat Google Gemini)  
- Content Brain (LangChain Chain LLM)  
- Structured Output Parser (LangChain Structured Output Parser)  
- Set Video Title and Description (Set)  
- Create Record in Video Table (Airtable)  
- Split Out (Split Out)  

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Entry point for manual execution  
  - No parameters  
  - Output: Triggers Content Brain  

- **Google Gemini Chat Model**  
  - Type: LangChain Google Gemini Chat Model  
  - Role: Provides AI language model interface with Gemini 2.0 flash  
  - Configuration: Default parameters, no special tuning  
  - Output: Feeds Content Brain with AI-generated content  

- **Content Brain**  
  - Type: LangChain Chain LLM  
  - Role: Generates viral video script and detailed structured scenes  
  - Configuration:  
    - Input prompt defines expert viral content strategist role  
    - Specifies 6 scenes, hook-heavy style, niche-specific for Technology & AI  
    - Outputs JSON with video_id, title, description, and scenes array  
  - Outputs: Structured JSON parsed by Structured Output Parser  
  - Possible failure: API rate limits, malformed prompt causing parse errors  

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Role: Enforces JSON schema on AI output for reliable parsing  
  - Configuration: Example JSON schema specifying video metadata and scenes  
  - Outputs: Clean parsed JSON to Set Video Title and Description node  

- **Set Video Title and Description**  
  - Type: Set  
  - Role: Extracts video_title and description from parsed output for further use  
  - Config: Assigns output.video_title and output.description fields  

- **Create Record in Video Table**  
  - Type: Airtable node  
  - Role: Inserts or updates video metadata into Airtable Videos table  
  - Config: Uses video_id, video_title, description; sets "Ready to Process" to false initially  
  - Requires Airtable credentials and correct base/table IDs  
  - Edge cases: Authentication errors, API limits, data mapping failures  

- **Split Out**  
  - Type: Split Out  
  - Role: Splits scenes array from AI output to process scenes individually downstream  

---

#### 2.2 Image Prompt Processing & Generation

**Overview:**  
Processes image prompt texts from AI output scenes, enhances them with an AI agent for professional prompt structuring, then generates images via Pollinations AI.

**Nodes Involved:**  
- AI Agent - Create Image From Prompt (LangChain Agent)  
- Code - Clean Json (Code)  
- Code - Get Prompt (Code)  
- Code - Set Filename (Code)  
- Setting Values for Image Model (Set)  
- Image Create Request - Pollination AI (HTTP Request)  

**Node Details:**

- **AI Agent - Create Image From Prompt**  
  - Type: LangChain Agent  
  - Role: Enhances raw image prompt text into detailed, professional prompts for image generation  
  - Input: Raw "Image Prompt" from Airtable scenes table  
  - Configuration: Uses a system message with comprehensive prompt guidelines for image quality, style, and text integration  
  - Output: Structured prompt JSON  
  - Potential failure: Parsing errors, API timeouts  

- **Code - Clean Json**  
  - Type: Code  
  - Role: Extracts and sanitizes raw AI output to isolate image prompts from JSON-like string response  
  - Logic: Parses lines containing `"prompt":` and aggregates prompts into an array  
  - Handles errors gracefully by returning empty array if parsing fails  

- **Code - Get Prompt**  
  - Type: Code  
  - Role: Structures each image prompt with model settings (width, height, inference steps, guidance scale) for API call  
  - Uses values from "Setting Values for Image Model" node  

- **Code - Set Filename**  
  - Type: Code  
  - Role: Assigns sequential filenames to image outputs (e.g., images_001.png) for consistent storage and retrieval  

- **Setting Values for Image Model**  
  - Type: Set  
  - Role: Defines key parameters for image generation model (model type: flux, width: 1080, height: 1920)  
  - These parameters are referenced downstream for API requests  

- **Image Create Request - Pollination AI**  
  - Type: HTTP Request  
  - Role: Sends image prompt and model parameters to Pollinations AI for image generation  
  - Config: POST request with JSON body, retries on failure with 5 seconds delay  
  - Outputs binary image file data  
  - Edge cases: API rate limits, network errors, invalid prompt causing failure  

---

#### 2.3 Image Storage & Airtable Integration

**Overview:**  
Converts generated images to base64, uploads them to Airtable as attachments linked to corresponding scene records, enabling asset management and use in video rendering.

**Nodes Involved:**  
- Converting Image file for Storing (Code)  
- Uploading Image in Airtable (HTTP Request)  
- Loop Over Items (Split In Batches)  
- Creating records in Scenes Table (Airtable)  

**Node Details:**

- **Converting Image file for Storing**  
  - Type: Code  
  - Role: Converts binary image data from Pollinations AI to base64 format with metadata for Airtable upload  
  - Throws error if no binary data found  
  - Outputs JSON with contentType, file, and filename fields  

- **Uploading Image in Airtable**  
  - Type: HTTP Request  
  - Role: Uploads base64 image to Airtable attachment endpoint for the Scenes table  
  - Requires Airtable personal access token for Authorization header  
  - Parameters: contentType, file (base64), filename  
  - Uses dynamic URL with record ID from Loop Over Items node  
  - Edge cases: Authentication failure, invalid base64 data, rate limits  

- **Loop Over Items**  
  - Type: Split In Batches  
  - Role: Iterates over batches of items for efficient processing of image uploads and Airtable API calls  

- **Creating records in Scenes Table**  
  - Type: Airtable  
  - Role: Upserts each scene with video ID, scene text, description, video title, image prompt, and scene number  
  - Mapping fields explicitly to Airtable columns  
  - Edge cases: Data mismatch, API failures, concurrent updates  

---

#### 2.4 Video Metadata Handling & Airtable Records

**Overview:**  
Organizes video and scene metadata, cleans and sorts Airtable records to prepare inputs for Creatomate video templating.

**Nodes Involved:**  
- Get Records for Airtable (HTTP Request)  
- Cleaning Airtable Output (Code)  
- Filter - Latest Video file (Filter)  
- Preparing for Creatomate (Code)  
- Merging Complete Video Details (Code)  
- Clean - Details (Code)  
- Merge (Merge)  

**Node Details:**

- **Get Records for Airtable**  
  - Type: HTTP Request  
  - Role: Fetches all records from Airtable Scenes table using API and auth token  
  - Outputs raw records array  

- **Cleaning Airtable Output**  
  - Type: Code  
  - Role: Flattens and sorts records by video title and scene number; fixes any array formatting in video title field  
  - Returns cleaned list preserving pairedItem for tracking  

- **Filter - Latest Video file**  
  - Type: Filter  
  - Role: Filters records to only keep those matching the current video's title  
  - Ensures processing only for active video  

- **Preparing for Creatomate**  
  - Type: Code  
  - Role: Builds a structured JSON object for Creatomate containing Title, Description, and pairs of Image and Text fields indexed by scene number  
  - Extracts full image URLs from Airtable attachments (prefers full thumbnails if available)  
  - Sorts scenes ascending by scene number  

- **Merging Complete Video Details**  
  - Type: Code  
  - Role: Combines multiple data streams such as video metadata and scene details into a single unified JSON object  

- **Clean - Details**  
  - Type: Code  
  - Role: Flattens incoming metadata items to only pass plain text fields (video_title, description) downstream  

- **Merge**  
  - Type: Merge  
  - Role: Combines multiple streams of data into one for unified processing in subsequent steps  

---

#### 2.5 Video Rendering with Creatomate

**Overview:**  
Transforms prepared scene data into Creatomate video template format, submits the render request, waits for completion, and checks rendering status.

**Nodes Involved:**  
- Template for Creatomate (Code)  
- Video Rendering - Creatomate (HTTP Request)  
- Wait - 60 secs (Wait)  
- Get Video Status (HTTP Request)  
- Switch (Switch)  
- Stop and Error (Stop and Error)  

**Node Details:**

- **Template for Creatomate**  
  - Type: Code  
  - Role: Converts scene data into Creatomate API JSON format using template_id and modifications mapping  
  - Maps Image-X keys to image sources and Text-X keys to voiceover sources  
  - Template ID must be updated to user’s own Creatomate template  

- **Video Rendering - Creatomate**  
  - Type: HTTP Request  
  - Role: Sends video render request to Creatomate API with specified resolution (720x1280), framerate (30fps), and scale (1)  
  - Uses Bearer token authorization with Creatomate API key  
  - Outputs render job ID for status polling  

- **Wait - 60 secs**  
  - Type: Wait  
  - Role: Pauses workflow for 60 seconds to allow video rendering to process  
  - Webhook ID present for external triggering if needed  

- **Get Video Status**  
  - Type: HTTP Request  
  - Role: Polls Creatomate render job status endpoint using render job ID  
  - Authorization: Bearer Creatomate API key  

- **Switch**  
  - Type: Switch  
  - Role: Routes workflow based on render job status: "succeeded", "failed", or "being processed" (planned, transcribing, waiting, rendering)  
  - On failure: triggers Stop and Error node  
  - On processing: loops back to Wait node for further polling  
  - On success: passes to Merge node for next steps  

- **Stop and Error**  
  - Type: Stop and Error  
  - Role: Terminates workflow with error message if video generation fails  

---

#### 2.6 Video Status Monitoring & Publishing

**Overview:**  
Fetches the completed video file and publishes it to YouTube and Instagram using respective APIs.

**Nodes Involved:**  
- Get complete Video (HTTP Request)  
- Upload on Instagram (HTTP Request)  
- Upload on YouTube (YouTube node)  

**Node Details:**

- **Get complete Video**  
  - Type: HTTP Request  
  - Role: Downloads the final rendered video file from Creatomate video URL  
  - Input: URL from previous rendering status check  

- **Upload on Instagram**  
  - Type: HTTP Request  
  - Role: Uploads the rendered video to Instagram via Upload-Post.com API  
  - Method: POST multipart-form-data  
  - Requires API key passed via Authorization header  
  - Parameters include video title, description, username, platform array (instagram)  
  - Edge cases: API call limits (10 free calls/month), authentication errors  

- **Upload on YouTube**  
  - Type: YouTube node (n8n built-in)  
  - Role: Uploads video to connected YouTube channel  
  - Requires OAuth2 authentication with access to YouTube Data API  
  - Config: Title and description from workflow data, category set to Education (ID 27), region IN (India)  
  - Edge cases: OAuth token expiration, quota limits, upload failures  

---

### 3. Summary Table

| Node Name                       | Node Type                            | Functional Role                           | Input Node(s)                          | Output Node(s)                         | Sticky Note                                                                                                                |
|--------------------------------|------------------------------------|-----------------------------------------|--------------------------------------|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’| Manual Trigger                     | Workflow entry point                     | -                                    | Content Brain                        |                                                                                                                            |
| Google Gemini Chat Model        | LangChain LM Chat Google Gemini    | AI language model input for content     | When clicking ‘Execute workflow’     | Content Brain                       | AI Content Generation & Structuring, explains viral content strategy and JSON output parsing                                |
| Content Brain                  | LangChain Chain LLM                | Generates viral video scripts            | Google Gemini Chat Model             | Set Video Title and Description, Create Record in Video Table, Split Out |                                                                                                                            |
| Structured Output Parser        | LangChain Structured Output Parser | Parses AI output to structured JSON     | Content Brain                       | Set Video Title and Description      |                                                                                                                            |
| Set Video Title and Description | Set                              | Extracts and sets video metadata         | Structured Output Parser             | Clean - Details                      | Video Metadata Handling                                                                                                     |
| Create Record in Video Table    | Airtable                         | Stores video metadata in Airtable        | Set Video Title and Description      | Split Out                          |                                                                                                                            |
| Split Out                      | Split Out                        | Splits scenes array for processing       | Create Record in Video Table          | Creating records in Scenes Table    |                                                                                                                            |
| AI Agent - Create Image From Prompt | LangChain Agent               | Enhances image prompt text                | Google Gemini Chat Model1            | Code - Clean Json                   | Image Prompt & Attributes, professional prompt structuring                                                                  |
| Code - Clean Json              | Code                            | Cleans AI raw text to extract prompts    | AI Agent - Create Image From Prompt  | Code - Get Prompt                  | Image Prompt Processing & File Setup                                                                                        |
| Code - Get Prompt              | Code                            | Structures image generation parameters   | Code - Clean Json                   | Code - Set Filename                |                                                                                                                            |
| Code - Set Filename            | Code                            | Assigns sequential filenames to images   | Code - Get Prompt                   | Image Create Request - Pollination AI |                                                                                                                            |
| Setting Values for Image Model  | Set                              | Defines model parameters for images      | Loop Over Items                     | AI Agent - Create Image From Prompt |                                                                                                                            |
| Image Create Request - Pollination AI | HTTP Request                 | Generates images from prompts             | Code - Set Filename                 | Converting Image file for Storing   | Image Generation & Storage                                                                                                  |
| Converting Image file for Storing | Code                         | Converts image binary to base64 for Airtable | Image Create Request - Pollination AI | Uploading Image in Airtable       |                                                                                                                            |
| Uploading Image in Airtable     | HTTP Request                     | Uploads images as attachments to Airtable | Converting Image file for Storing   | Loop Over Items                    |                                                                                                                            |
| Loop Over Items                | Split In Batches                 | Iterates over image upload batches       | Creating records in Scenes Table     | Get Records for Airtable, Setting Values for Image Model |                                                                                                                            |
| Creating records in Scenes Table | Airtable                      | Upserts individual scene records          | Split Out                          | Loop Over Items                    | Image Generation                                                                                                           |
| Get Records for Airtable        | HTTP Request                     | Fetches scenes records from Airtable     | Loop Over Items                   | Cleaning Airtable Output           | Image Prompt Processing & File Setup                                                                                        |
| Cleaning Airtable Output        | Code                            | Sorts and flattens Airtable records       | Get Records for Airtable            | Filter - Latest Video file          |                                                                                                                            |
| Filter - Latest Video file      | Filter                          | Filters records matching current video    | Cleaning Airtable Output            | Preparing for Creatomate           |                                                                                                                            |
| Preparing for Creatomate        | Code                            | Builds structured JSON for Creatomate     | Filter - Latest Video file          | Template for Creatomate            | Preparing Video Template (Creatomate)                                                                                      |
| Template for Creatomate         | Code                            | Converts data to Creatomate template format | Preparing for Creatomate           | Video Rendering - Creatomate       |                                                                                                                            |
| Video Rendering - Creatomate    | HTTP Request                     | Sends render request to Creatomate API    | Template for Creatomate            | Wait - 60 secs                    | Video Rendering & Status Check (Creatomate)                                                                                |
| Wait - 60 secs                 | Wait                            | Pauses for rendering                       | Video Rendering - Creatomate       | Get Video Status                  |                                                                                                                            |
| Get Video Status               | HTTP Request                     | Polls video render status                   | Wait - 60 secs                    | Switch                           |                                                                                                                            |
| Switch                        | Switch                          | Routes based on render status              | Get Video Status                  | Merge, Wait - 60 secs, Stop and Error |                                                                                                                            |
| Stop and Error                | Stop and Error                  | Stops workflow on render failure           | Switch                           | -                                |                                                                                                                            |
| Merge                        | Merge                           | Combines video metadata and details        | Switch                           | Merging Complete Video Details     | Video Metadata Handling                                                                                                     |
| Merging Complete Video Details | Code                            | Merges text and metadata objects           | Clean - Details, Switch            | Get complete Video                |                                                                                                                            |
| Clean - Details               | Code                            | Flattens metadata items                     | Set Video Title and Description    | Merge                           |                                                                                                                            |
| Get complete Video            | HTTP Request                     | Retrieves final rendered video file        | Merging Complete Video Details     | Upload on Instagram, Upload on YouTube | Video Metadata Handling                                                                                                     |
| Upload on Instagram           | HTTP Request                     | Uploads video to Instagram via API         | Get complete Video                | -                                | Upload on Instagram (via Upload-Post API)                                                                                  |
| Upload on YouTube             | YouTube                         | Uploads video to YouTube channel            | Get complete Video                | -                                | Upload on YouTube, requires OAuth2 authentication                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a manual trigger node named** `When clicking ‘Execute workflow’`.

2. **Add a LangChain Google Gemini Chat Model node named** `Google Gemini Chat Model`.  
   - Use model: `models/gemini-2.0-flash`.  
   - Connect from manual trigger.  

3. **Add LangChain Chain LLM node named** `Content Brain`.  
   - Set detailed viral content strategist prompt for Technology & AI niche (as described).  
   - Enable structured output parsing with JSON schema matching video output format.  
   - Connect input from `Google Gemini Chat Model`.  

4. **Add LangChain Structured Output Parser named** `Structured Output Parser`.  
   - Configure JSON schema example to parse video_id, video_title, description, scenes array with scene_number, text, image_prompt.  
   - Connect output of `Content Brain` to this parser.  

5. **Add a Set node named** `Set Video Title and Description`.  
   - Assign `output.video_title` and `output.description` from parsed JSON fields.  
   - Connect from `Structured Output Parser`.  

6. **Add Airtable node named** `Create Record in Video Table`.  
   - Configure with your Airtable credentials, base ID, and Videos table ID.  
   - Map `Video ID`, `Video Title`, `Description` fields accordingly.  
   - Set "Ready to Process" to false initially.  
   - Connect from `Set Video Title and Description`.  

7. **Add Split Out node named** `Split Out`.  
   - Split `output.scenes` array into individual items.  
   - Connect from `Create Record in Video Table`.  

8. **Add Airtable node named** `Creating records in Scenes Table`.  
   - Configure with your Airtable base and Scenes table.  
   - Map scene fields: Video ID, Scene Text, Description, Video Title, Image Prompt, Scene Number.  
   - Set operation to Upsert with matching on record ID if available.  
   - Connect from `Split Out`.  

9. **Add Split In Batches node named** `Loop Over Items`.  
   - Use default batch size for processing scene images.  
   - Connect from `Creating records in Scenes Table`.  

10. **Add Set node named** `Setting Values for Image Model`.  
    - Define parameters: model = "flux", width = "1080", height = "1920".  
    - Connect from `Loop Over Items`.  

11. **Add LangChain Agent node named** `AI Agent - Create Image From Prompt`.  
    - Input: `Image Prompt` from scenes table.  
    - Use detailed prompt guidelines for image prompt creation (vertical 9:16 format, text integration, style).  
    - Connect from `Setting Values for Image Model`.  

12. **Add Code node named** `Code - Clean Json`.  
    - JavaScript function to extract clean image prompt JSON from AI output string.  
    - Connect from `AI Agent - Create Image From Prompt`.  

13. **Add Code node named** `Code - Get Prompt`.  
    - Structure image prompt body including width, height, inference steps (12), guidance scale (3.5), enable safety checker.  
    - Connect from `Code - Clean Json`.  

14. **Add Code node named** `Code - Set Filename`.  
    - Assign sequential filenames: images_001.png, images_002.png, etc.  
    - Connect from `Code - Get Prompt`.  

15. **Add HTTP Request node named** `Image Create Request - Pollination AI`.  
    - POST to `https://image.pollinations.ai/prompt/{{prompt}}`.  
    - Send JSON body with model settings and prompt.  
    - Set response format to file (binary).  
    - Enable retry on failure, 5 sec wait.  
    - Connect from `Code - Set Filename`.  

16. **Add Code node named** `Converting Image file for Storing`.  
    - Convert binary image to base64 for Airtable upload.  
    - Throw error if no binary data found.  
    - Connect from `Image Create Request - Pollination AI`.  

17. **Add HTTP Request node named** `Uploading Image in Airtable`.  
    - POST to Airtable attachment upload endpoint for Scenes table record.  
    - Use Airtable Personal Access Token for Authorization.  
    - Send JSON body with contentType, file (base64), filename.  
    - Connect from `Converting Image file for Storing`.  

18. **Add HTTP Request node named** `Get Records for Airtable`.  
    - GET request to Scenes table in Airtable.  
    - Use API key in Authorization header.  
    - Connect from `Loop Over Items`.  

19. **Add Code node named** `Cleaning Airtable Output`.  
    - Flatten and sort scenes by Video Title and Scene Number.  
    - Ensure video title is plain text.  
    - Connect from `Get Records for Airtable`.  

20. **Add Filter node named** `Filter - Latest Video file`.  
    - Filter records matching current video title.  
    - Connect from `Cleaning Airtable Output`.  

21. **Add Code node named** `Preparing for Creatomate`.  
    - Extract image URLs and text per scene from Airtable records.  
    - Build output object: Title, Description, Image-X, Text-X keys.  
    - Connect from `Filter - Latest Video file`.  

22. **Add Code node named** `Template for Creatomate`.  
    - Map structured data to Creatomate API JSON template with template_id and modifications.  
    - Connect from `Preparing for Creatomate`.  

23. **Add HTTP Request node named** `Video Rendering - Creatomate`.  
    - POST request to Creatomate API renders endpoint with API key.  
    - Include template_id, resolution (720x1280), framerate (30fps), render scale (1), and modifications.  
    - Connect from `Template for Creatomate`.  

24. **Add Wait node named** `Wait - 60 secs`.  
    - Wait 60 seconds for rendering process.  
    - Connect from `Video Rendering - Creatomate`.  

25. **Add HTTP Request node named** `Get Video Status`.  
    - GET request to Creatomate API render status endpoint with render ID.  
    - Use API key in Authorization header.  
    - Connect from `Wait - 60 secs`.  

26. **Add Switch node named** `Switch`.  
    - Route based on status:  
      - "succeeded" → Merge node  
      - "failed" → Stop and Error node  
      - "being processed" (planned, transcribing, waiting, rendering) → back to Wait node  
    - Connect from `Get Video Status`.  

27. **Add Stop and Error node named** `Stop and Error`.  
    - Stop workflow with message “Failed Video Generation.”  
    - Connect from `Switch` failed output.  

28. **Add Merge node named** `Merge`.  
    - Merge render success data with other metadata.  
    - Connect from `Switch` succeeded output and `Clean - Details`.  

29. **Add Code node named** `Merging Complete Video Details`.  
    - Merge video metadata and scene details into one object.  
    - Connect from `Merge` and `Clean - Details`.  

30. **Add Code node named** `Clean - Details`.  
    - Flatten video metadata fields for upload.  
    - Connect from `Set Video Title and Description`.  

31. **Add HTTP Request node named** `Get complete Video`.  
    - GET request to video URL from Creatomate to fetch final video file.  
    - Connect from `Merging Complete Video Details`.  

32. **Add HTTP Request node named** `Upload on Instagram`.  
    - POST multipart form-data to Upload-Post.com API to upload video to Instagram.  
    - Use API key in Authorization.  
    - Connect from `Get complete Video`.  

33. **Add YouTube node named** `Upload on YouTube`.  
    - Upload video to YouTube channel using OAuth2 credentials.  
    - Set title and description from workflow data.  
    - Connect from `Get complete Video`.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                   | Context or Link                                                                                  |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Image Generation uses Pollinations AI, a free API for high-quality image creation with professional prompt guidelines.                                                                          | https://pollinations.ai/                                                                        |
| Viral AI Content Generation is powered by Google Gemini 2.0 and LangChain with strict JSON output parsing for reliability.                                                                     |                                                                                               |
| Airtable is used for storing video metadata and scene details. API tokens and base/table IDs must be replaced with user’s own credentials.                                                     | https://airtable.com/developers/web/api/introduction                                           |
| Creatomate provides video rendering with free credits on sign-up; update API key and template_id to your own.                                                                                   | https://creatomate.com/blog/how-to-create-videos-with-ai-voice-overs-using-n8n                  |
| Upload-Post.com API enables multi-platform video uploads (Instagram, Twitter, Facebook, etc.) with a free tier of 10 API calls/month.                                                         | https://docs.upload-post.com/api/upload-video                                                  |
| YouTube upload requires OAuth2 credentials with proper scopes; region and category can be adjusted as needed.                                                                                   | https://console.cloud.google.com/marketplace/product/google/youtube.googleapis.com              |
| ElevenLabs API integration is suggested for advanced AI voiceover support with free monthly credits.                                                                                            | https://elevenlabs.io/app/developers                                                           |
| Wait time after video render request is set to 60 seconds but can be adjusted based on video length and Creatomate processing speed.                                                           |                                                                                                |

---

**Disclaimer:** The text and workflow contents are generated from an n8n automation respecting all applicable content policies. All data processed are legal and public.