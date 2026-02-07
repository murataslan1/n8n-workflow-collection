Auto-Generate SEO Content from Trends with GPT-4o, FAL AI & Multi-Storage Support

https://n8nworkflows.xyz/workflows/auto-generate-seo-content-from-trends-with-gpt-4o--fal-ai---multi-storage-support-6278


# Auto-Generate SEO Content from Trends with GPT-4o, FAL AI & Multi-Storage Support

### 1. Workflow Overview

This workflow automates the generation of SEO-optimized marketing content from trending topics sourced in a spreadsheet, leveraging GPT-4o language models, FAL AI services for multimedia generation, and multi-storage support primarily via Microsoft SharePoint. It targets marketing and content teams aiming to streamline newsletter creation with AI-assisted copywriting, image, audio, and video production, followed by approval and storage.

The workflow can be logically divided into these main blocks:

- **1.1 Input Reception and Intent Determination**: Receives a webhook request containing user query parameters, extracts key intent fields (use case, video inclusion, video duration).

- **1.2 Trends Data Acquisition and Topic Selection**: Downloads a trends spreadsheet from SharePoint, then selects a trending topic randomly for content generation.

- **1.3 AI Content Generation**: Generates newsletter text content for the selected topic in German and English using GPT-4o via LangChain nodes, employing a predefined template.

- **1.4 Multimedia Asset Creation**: Creates image, video, and audio assets using Pollinations AI (image) and FAL AI (video and audio). It also manages asynchronous processing with wait nodes and merges video and audio.

- **1.5 Content Assembly and Formatting**: Replaces placeholders in the newsletter HTML template with AI-generated content, formats output for storage, and converts relevant data to binary.

- **1.6 Approval and Storage**: Sends generated newsletter content via Gmail for approval, waits for response, then uploads the final HTML, JPG image, and video URL (as a text file) to SharePoint.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Intent Determination

**Overview:**  
Handles incoming webhook requests containing user queries, extracts structured intent parameters (use case, video inclusion flag, video duration) to customize workflow execution.

**Nodes Involved:**  
- Receive Request  
- Determine Intent (LangChain Agent)  
- Parse Intent Fields (Code)  
- Configuration Settings (Set)  

**Node Details:**

- **Receive Request**  
  - *Type:* Webhook  
  - *Role:* Entry point for external HTTP POST requests delivering user input in raw body.  
  - *Config:* Path set, rawBody enabled to capture request payload.  
  - *Input/Output:* No input; outputs request body as JSON.  
  - *Failures:* Webhook not reachable, invalid payload format.

- **Determine Intent**  
  - *Type:* LangChain Agent  
  - *Role:* Parses the user query text to extract `usecase` (string), `include_video` (boolean), and `video_duration` (string with constraints "5" or "10").  
  - *Config:* Uses a prompt instructing JSON response with fields and defaulting logic.  
  - *Input:* Query text from webhook.  
  - *Output:* JSON string wrapped in markdown.  
  - *Failures:* OpenAI API errors, malformed responses, parsing errors.

- **Parse Intent Fields**  
  - *Type:* Code  
  - *Role:* Strips markdown code blocks and parses JSON from previous node, stores fields as workflow variables.  
  - *Input:* LangChain output.  
  - *Output:* JSON with extracted fields.  
  - *Failures:* JSON parse errors if AI output malformed.

- **Configuration Settings**  
  - *Type:* Set  
  - *Role:* Stores extracted intent fields into environment variables used throughout the workflow, plus static fields like approver email and API key placeholders.  
  - *Failures:* Missing or invalid values may cause downstream errors.

---

#### 2.2 Trends Data Acquisition and Topic Selection

**Overview:**  
Downloads the trending topics spreadsheet from SharePoint and selects a single trending topic either randomly or by another selection method.

**Nodes Involved:**  
- Get Trends XLSX (SharePoint)  
- Read Trends Data (Spreadsheet)  
- Select Topic from Trends (Code)  

**Node Details:**

- **Get Trends XLSX**  
  - *Type:* Microsoft SharePoint  
  - *Role:* Downloads an XLSX spreadsheet file containing trending topics from a configured SharePoint site and folder.  
  - *Config:* Uses OAuth2 credentials; file and folder IDs predefined.  
  - *Failures:* Authentication failures, file not found, permission issues.

- **Read Trends Data**  
  - *Type:* Spreadsheet File  
  - *Role:* Parses the downloaded XLSX file into JSON data rows.  
  - *Failures:* Corrupt file, unsupported format.

- **Select Topic from Trends**  
  - *Type:* Code  
  - *Role:* Extracts all non-empty "Trend" values from spreadsheet rows, then randomly selects one topic for use. Returns selected topic and all available trends.  
  - *Failures:* Empty data set, logic errors.

---

#### 2.3 AI Content Generation

**Overview:**  
Generates B2B newsletter content based on the selected topic in both German and English, using a structured prompt and GPT-4o model.

**Nodes Involved:**  
- OpenAI Chat Model (lmChatOpenAi)  
- Prepare Newsletter Data (LangChain Agent)  
- Get Newsletter Template (SharePoint)  
- Extract from Text File  
- Build Newsletter (Code)  

**Node Details:**

- **OpenAI Chat Model**  
  - *Type:* LangChain lmChatOpenAi  
  - *Role:* Runs GPT-4o-mini model to generate newsletter content JSON.  
  - *Input:* Prompt constructed in Prepare Newsletter Data.  
  - *Credentials:* OpenAI API key.  
  - *Failures:* API limits, malformed prompt.

- **Prepare Newsletter Data**  
  - *Type:* LangChain Agent  
  - *Role:* Constructs the prompt for newsletter content generation, specifying detailed structure with placeholders for German and English content with tone and audience context.  
  - *Input:* Selected topic from trends.  
  - *Output:* Structured JSON with newsletter text fields.  
  - *Failures:* Prompt formatting errors, AI response quality.

- **Get Newsletter Template**  
  - *Type:* Microsoft SharePoint  
  - *Role:* Downloads an HTML template file containing placeholders to be replaced by AI-generated text.  
  - *Failures:* SharePoint access issues.

- **Extract from Text File**  
  - *Type:* Extract from File  
  - *Role:* Extracts template text content from downloaded file for substitution.  
  - *Failures:* File corrupt, unsupported format.

- **Build Newsletter**  
  - *Type:* Code  
  - *Role:* Parses AI output JSON, replaces all placeholders in the HTML template for both German and English sections. Adds current date. Returns final newsletter HTML and metadata for further use.  
  - *Failures:* JSON parse errors, missing placeholders, template mismatch.

---

#### 2.4 Multimedia Asset Creation

**Overview:**  
Creates supporting multimedia assets (image, video, audio) based on AI-generated prompts. Handles asynchronous requests and polling for processing completion. Merges video and audio into a final video file.

**Nodes Involved:**  
- Generate Video and Audio Prompt (LangChain Agent)  
- Parse Fields (Code)  
- Generate Image (HTTP Request to Pollinations AI)  
- Set Base64 Field (Set)  
- Convert Base64 to File (ConvertToFile)  
- Send Data to Download Service (HTTP Request to Velvet Syndicate)  
- Switch (Boolean to branch video generation)  
- Create FAL Video (HTTP Request to FAL AI)  
- Wait For Video (Wait)  
- Get Video (HTTP Request polling)  
- Video Still Processing (If)  
- Create Audio (HTTP Request to FAL AI)  
- Wait for Audio (Wait)  
- Get Audio (HTTP Request polling)  
- Audio Still Processing (If)  
- Create Merge Request (HTTP Request to FFmpeg API)  
- Wait for Merge (Wait)  
- Get Merged Video (HTTP Request polling)  

**Node Details:**

- **Generate Video and Audio Prompt**  
  - *Type:* LangChain Agent  
  - *Role:* Creates short prompts for video, audio, and image generation based on the use case and selected topic. Output is JSON with three prompt fields.  
  - *Input:* Use case and selected topic.  
  - *Failures:* Prompt or AI issues.

- **Parse Fields**  
  - *Type:* Code  
  - *Role:* Parses JSON AI output from previous node, extracts prompt fields and generates a random 8-character filename for asset naming.  
  - *Failures:* JSON parse errors.

- **Generate Image**  
  - *Type:* HTTP Request  
  - *Role:* Calls Pollinations AI image generation service, passing sanitized prompt to generate 1080x1350 image without logos. Retries on failure up to 5 times.  
  - *Failures:* Network errors, API failures, rate limits.

- **Set Base64 Field**  
  - *Type:* Set  
  - *Role:* Saves generated image binary data as base64 string for conversion.  
  - *Failures:* Missing binary data.

- **Convert Base64 to File**  
  - *Type:* ConvertToFile  
  - *Role:* Converts base64 string to binary file format for upload and CDN usage.  
  - *Failures:* Conversion errors.

- **Send Data to Download Service**  
  - *Type:* HTTP Request  
  - *Role:* Uploads image binary to Velvet Syndicate CDN, receiving a downloadable URL.  
  - *Failures:* Network errors, unauthorized access.

- **Switch**  
  - *Type:* Switch  
  - *Role:* Branches workflow based on `ENV_INCLUDE_VIDEO` boolean flag to either create video or skip video generation.  
  - *Failures:* Incorrect flag values.

- **Create FAL Video**  
  - *Type:* HTTP Request  
  - *Role:* Posts video creation request to FAL AI with prompt, image URL, and duration parameters.  
  - *Failures:* API key invalid, request rejected.

- **Wait For Video**  
  - *Type:* Wait  
  - *Role:* Waits fixed 30 seconds before polling video status.  
  - *Failures:* Timeout if processing delayed.

- **Get Video**  
  - *Type:* HTTP Request  
  - *Role:* Polls video generation status, returns video URL if ready.  
  - *Failures:* Processing errors, video unavailable.

- **Video Still Processing**  
  - *Type:* If  
  - *Role:* Checks if video still processing; if yes, loops back to wait; else proceeds.  
  - *Failures:* Infinite loops if no terminal status.

- **Create Audio**  
  - *Type:* HTTP Request  
  - *Role:* Posts audio prompt to FAL AI to generate background music.  
  - *Failures:* API errors.

- **Wait for Audio**  
  - *Type:* Wait  
  - *Role:* Waits 59 seconds before polling audio status.  
  - *Failures:* Timeout.

- **Get Audio**  
  - *Type:* HTTP Request  
  - *Role:* Polls audio generation status, returns audio URL if ready.  
  - *Failures:* Processing errors.

- **Audio Still Processing**  
  - *Type:* If  
  - *Role:* Checks if audio still processing; loops wait if yes, else continues.  
  - *Failures:* Loop risks.

- **Create Merge Request**  
  - *Type:* HTTP Request  
  - *Role:* Posts request to FFmpeg API to merge audio and video URLs into a single video file.  
  - *Failures:* API errors.

- **Wait for Merge**  
  - *Type:* Wait  
  - *Role:* Waits 50 seconds before polling merge status.  
  - *Failures:* Delay or failure.

- **Get Merged Video**  
  - *Type:* HTTP Request  
  - *Role:* Polls merge request result, returns final merged video URL.  
  - *Failures:* Missing output.

---

#### 2.5 Content Assembly and Formatting

**Overview:**  
Formats the final newsletter HTML content, converts multimedia assets to binary files, and prepares all for upload to storage.

**Nodes Involved:**  
- Build Newsletter (Code) (from block 2.3)  
- HTML to Binary (Code)  
- JPG to Binary (Code)  
- TXT to Binary (Code)  

**Node Details:**

- **Build Newsletter**  
  - *Already detailed in AI Content Generation block.*  
  - *Output:* Final newsletter HTML string and metadata.

- **HTML to Binary**  
  - *Type:* Code  
  - *Role:* Converts newsletter HTML string into a binary buffer with MIME type "text/html" and a static filename `"test.html"` (can be customized).  
  - *Failures:* Encoding issues.

- **JPG to Binary**  
  - *Type:* Code  
  - *Role:* Extracts generated image binary data for upload.  
  - *Failures:* Missing image data.

- **TXT to Binary**  
  - *Type:* Code  
  - *Role:* Converts merged video URL string into a plain text binary file with extension `.txt`.  
  - *Failures:* Missing URL string.

---

#### 2.6 Approval and Storage

**Overview:**  
Sends the generated newsletter with embedded image and video link via Gmail for approval, waits for approval response, then uploads all finalized content files to SharePoint storage.

**Nodes Involved:**  
- Send message and wait for response (Gmail)  
- Check Approval Status (If)  
- Upload HTML (SharePoint)  
- Upload JPG (SharePoint)  
- Upload Video URL (SharePoint)  
- Save Video URL if exists (If)  
- Merge1 (Merge node combining different outputs)  

**Node Details:**

- **Send message and wait for response**  
  - *Type:* Gmail  
  - *Role:* Sends an email containing newsletter HTML with embedded image and optional video link to the configured approver email, waits for their approval response via double approval type.  
  - *Failures:* SMTP authentication, email delivery issues.

- **Check Approval Status**  
  - *Type:* If  
  - *Role:* Evaluates if the approval email response contains "true" in the approved field; only proceeds with storage on positive approval.  
  - *Failures:* Missing or malformed approval response.

- **Merge1**  
  - *Type:* Merge  
  - *Role:* Combines multiple data streams (HTML, image, video URL, approval status) for downstream unified processing.  
  - *Failures:* Data mismatch.

- **Upload HTML**  
  - *Type:* Microsoft SharePoint  
  - *Role:* Uploads the newsletter HTML binary file to a configured SharePoint folder, filename based on random string.  
  - *Failures:* Auth errors, folder or file access errors.

- **Upload JPG**  
  - *Type:* Microsoft SharePoint  
  - *Role:* Uploads the generated image binary file JPG to SharePoint, matching random filename.  
  - *Failures:* As above.

- **Save Video URL if exists**  
  - *Type:* If  
  - *Role:* Conditional node checking `ENV_INCLUDE_VIDEO` flag to decide whether to upload video URL as a text file.  
  - *Failures:* Incorrect flag evaluation.

- **Upload Video URL**  
  - *Type:* Microsoft SharePoint  
  - *Role:* Uploads the video URL text file if video generation was included.  
  - *Failures:* Same as above.

---

### 3. Summary Table

| Node Name                   | Node Type                        | Functional Role                             | Input Node(s)                      | Output Node(s)                     | Sticky Note                                                                                                                                                                                                                                                                                                                                             |
|-----------------------------|---------------------------------|---------------------------------------------|----------------------------------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Receive Request             | Webhook                         | Entry point, receives user query             | -                                | Determine Intent                 |                                                                                                                                                                                                                                                                                                                                                         |
| Determine Intent            | LangChain Agent                 | Extracts structured intent from query       | Receive Request                  | Parse Intent Fields              |                                                                                                                                                                                                                                                                                                                                                         |
| Parse Intent Fields         | Code                           | Parses JSON from AI response                  | Determine Intent                 | Configuration Settings          |                                                                                                                                                                                                                                                                                                                                                         |
| Configuration Settings      | Set                            | Stores extracted intent as environment vars  | Parse Intent Fields              | Get Trends XLSX                 |                                                                                                                                                                                                                                                                                                                                                         |
| Get Trends XLSX             | Microsoft SharePoint            | Downloads trends spreadsheet                  | Configuration Settings          | Read Trends Data                | ### Trends Input Branch  \n**What it does**  \n• Downloads a trends spreadsheet from SharePoint.  \n• Randomly selects one trending topic for content generation.\n\n**Credentials needed**  \nMicrosoft SharePoint OAuth2 (for **Get Trends XLSX**).\n\n**User tweaks**  \n• Change the spreadsheet file location in **Get Trends XLSX**.  \n• Modify selection logic in **Select Topic from Trends** (currently random; could be weighted, chronological, etc.). |
| Read Trends Data            | Spreadsheet File               | Parses XLSX to JSON rows                      | Get Trends XLSX                 | Select Topic from Trends        | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Select Topic from Trends    | Code                           | Selects a trending topic at random            | Read Trends Data                | Prepare Newsletter Data, Generate Video and Audio Prompt | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Prepare Newsletter Data     | LangChain Agent                 | Creates newsletter content prompt and generates AI content | Select Topic from Trends        | OpenAI Chat Model               | ### Newsletter Template Branch  \n**What it does**  \n• Downloads your HTML template from SharePoint.  \n• **Extract from Text File → Build Newsletter** replaces placeholders with AI-generated content.\n\n**Credentials needed**  \nMicrosoft SharePoint OAuth2 (for **Get Newsletter Template**).\n\n**User must provide**  \n• Your own HTML template with these exact placeholders:  \n  `{{INTRODUCTION_DE}} {{TOPIC_DE}} {{DESCRIPTION_DE}} {{TEASER1_DE}} {{TEASER2_DE}} {{TEASER3_DE}} {{CTA_DE}} {{FOOTER_TEXT_DE}} {{FOOTER_NAME_DE}} {{TOPIC_TITLE_EN}} {{INTRODUCTION_EN}} {{TOPIC_EN}} {{DESCRIPTION_EN}} {{TEASER1_EN}} {{TEASER2_EN}} {{TEASER3_EN}} {{CTA_EN}} {{FOOTER_TEXT_EN}} {{FOOTER_NAME_EN}}`  \n• Upload this template to the SharePoint folder referenced in **Get Newsletter Template**. |
| OpenAI Chat Model           | LangChain lmChatOpenAi          | Runs GPT-4o-mini to generate newsletter JSON | Prepare Newsletter Data         | Prepare Newsletter Data (output) | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Get Newsletter Template     | Microsoft SharePoint            | Downloads HTML newsletter template            | Prepare Newsletter Data         | Extract from Text File          | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Extract from Text File      | Extract from File               | Extracts template text content                 | Get Newsletter Template         | Build Newsletter               | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Build Newsletter            | Code                           | Replaces template placeholders with AI content | Extract from Text File          | Merge1                        | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Generate Video and Audio Prompt | LangChain Agent             | Creates video/audio/image prompts for assets  | Select Topic from Trends        | Parse Fields                  | ### Image Assets Branch  \n**What it does**  \n• Uses Pollinations AI to create a 1080 × 1350 image from the AI-generated `image_prompt`.  \n• Converts to binary and uploads to Velvet Syndicate (optional CDN).\n\n**Credentials needed**  \nNone (Pollinations & Velvet accept unauthenticated requests).\n\n**User tweaks**  \n• Edit the prompt in **Generate Video and Audio Prompt** to change image style.  \n• Replace Velvet Syndicate URL in **Send Data to Download Service** if using another CDN. |
| Parse Fields                | Code                           | Parses JSON prompts, generates random filename | Generate Video and Audio Prompt | Generate Image                | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Generate Image              | HTTP Request                   | Calls Pollinations AI for image generation     | Parse Fields                   | Set Base64 Field              | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Set Base64 Field            | Set                            | Stores image data as base64 string              | Generate Image                 | Convert Base64 to File        | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Convert Base64 to File      | ConvertToFile                  | Converts base64 string to binary file           | Set Base64 Field               | Merge1, Send Data to Download Service | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Send Data to Download Service | HTTP Request                 | Uploads image binary to Velvet Syndicate CDN    | Convert Base64 to File         | Switch                       | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Switch                     | Switch                         | Branches workflow on video inclusion flag       | Send Data to Download Service | Create FAL Video or Merge1    | ### Video Assets Branch  \n**What it does**  \n• **FAL AI (kling-video)** creates a short video from the generated image.  \n• **FAL AI (lyria2)** generates background music.  \n• FFmpeg API merges video + audio → returns a public `video.url`.\n\n**Credentials needed**  \n`ENV_FALAI_APIKEY` (stored in **Configuration Settings**).\n\n**User tweaks**  \n• Set `include_video` and `video_duration` via webhook request.  \n• Edit `video_prompt` & `audio_prompt` generation in **Generate Video and Audio Prompt**. |
| Create FAL Video            | HTTP Request                   | Requests video creation with image and prompt   | Switch                        | Wait For Video               | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Wait For Video              | Wait                           | Waits 30 seconds before polling video status    | Create FAL Video              | Get Video                    | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Get Video                  | HTTP Request                   | Polls video generation status and retrieves URL | Wait For Video                | Video Still Processing       | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Video Still Processing      | If                             | Checks if video still processing, loops or proceeds | Get Video                    | Wait For Video, Create Audio | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Create Audio               | HTTP Request                   | Requests audio generation with prompt           | Video Still Processing        | Wait for Audio              | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Wait for Audio             | Wait                           | Waits 59 seconds before polling audio status    | Create Audio                 | Get Audio                   | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Get Audio                  | HTTP Request                   | Polls audio generation status and retrieves URL | Wait for Audio               | Audio Still Processing      | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Audio Still Processing      | If                             | Checks if audio still processing, loops or proceeds | Get Audio                   | Wait for Audio, Create Merge Request | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Create Merge Request       | HTTP Request                   | Requests merging audio + video into one file    | Audio Still Processing       | Wait for Merge              | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Wait for Merge             | Wait                           | Waits 50 seconds before polling merge status    | Create Merge Request         | Get Merged Video            | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Get Merged Video           | HTTP Request                   | Polls merged video generation status, gets URL  | Wait for Merge               | Merge1                     | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Merge1                     | Merge                          | Combines newsletter, image, video URL, approval status | Build Newsletter, Convert Base64 to File, TXT to Binary, Send message and wait for response | Send message and wait for response | ### Storage Branch  \n**What it does**  \n• Converts newsletter HTML, generated JPG, and video URL into binary files.  \n• Uploads all three files to SharePoint (or your chosen storage).\n\n**Credentials needed**  \nMicrosoft SharePoint OAuth2 (for all three **Upload …** nodes).\n\n**User tweaks**  \n• Change target folder IDs in each upload node.  \n• Replace SharePoint nodes with Google Drive, Dropbox, S3, etc.  \n• Modify filename pattern (currently `${random_filename}.html/.jpg/.txt`). |
| Send message and wait for response | Gmail                   | Sends newsletter and assets for approval, waits for response | Merge1                      | Check Approval Status       | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Check Approval Status      | If                             | Checks approval response, proceeds only if approved | Send message and wait for response | HTML to Binary, (else stop) | Same as above                                                                                                                                                                                                                                                                                                                                          |
| HTML to Binary             | Code                           | Converts newsletter HTML content to binary buffer | Check Approval Status        | Upload HTML                 | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Upload HTML                | Microsoft SharePoint            | Uploads newsletter HTML file to SharePoint       | HTML to Binary               | JPG to Binary               | Same as above                                                                                                                                                                                                                                                                                                                                          |
| JPG to Binary              | Code                           | Extracts image binary data for upload              | Upload HTML                 | Upload JPG                  | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Upload JPG                 | Microsoft SharePoint            | Uploads generated image file to SharePoint         | JPG to Binary                | Save Video URL if exists    | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Save Video URL if exists   | If                             | Checks if video URL should be uploaded based on flag | Upload JPG                  | TXT to Binary or Merge1     | Same as above                                                                                                                                                                                                                                                                                                                                          |
| TXT to Binary              | Code                           | Converts video URL string into a text binary file  | Save Video URL if exists     | Upload Video URL            | Same as above                                                                                                                                                                                                                                                                                                                                          |
| Upload Video URL           | Microsoft SharePoint            | Uploads video URL text file to SharePoint           | TXT to Binary                | -                          | Same as above                                                                                                                                                                                                                                                                                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node ("Receive Request")**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Unique identifier (e.g., `ff9c853e-f76e-4722-ba37-433ad1750e6b`)  
   - Enable raw body capture  
   - No credentials needed

2. **Add LangChain Agent ("Determine Intent")**  
   - Input: Extract `body.text` from webhook JSON  
   - Prompt: Extract JSON with fields `usecase` (string), `include_video` (boolean, default false), `video_duration` ("5" or "10") with logic  
   - Model: GPT-4o latest (configure OpenAI credentials)  
   - Output: Markdown-wrapped JSON string

3. **Add Code Node ("Parse Intent Fields")**  
   - Remove markdown code blocks  
   - Parse JSON string  
   - Assign `usecase`, `include_video`, `video_duration` to JSON fields  
   - Pass output to Set node

4. **Add Set Node ("Configuration Settings")**  
   - Store above fields as environment variables:  
     - ENV_USECASE = usecase  
     - ENV_INCLUDE_VIDEO = include_video (boolean)  
     - ENV_FALAI_VIDEO_DURATION = video_duration  
     - ENV_APPROVER_EMAIL = "test@mail.com" (or your approver)  
     - ENV_FALAI_APIKEY = "<YOUR_API_KEY>" (replace with real key)  

5. **Add Microsoft SharePoint Node ("Get Trends XLSX")**  
   - Operation: Download file  
   - Site & Folder: Configure your SharePoint details  
   - File: Select trends spreadsheet file  
   - OAuth2 credentials required  

6. **Add Spreadsheet File Node ("Read Trends Data")**  
   - Input: File downloaded from SharePoint node  
   - Outputs JSON rows for each spreadsheet row  

7. **Add Code Node ("Select Topic from Trends")**  
   - Extract all non-empty "Trend" column entries  
   - Select one randomly  
   - Output JSON fields: Selected_Topic, Available_Trends, Selection_Method ("Random")  

8. **Add LangChain Agent ("Prepare Newsletter Data")**  
   - Input: Selected topic  
   - Prompt: Detailed newsletter content generation instructions with placeholders for German and English text sections  
   - Model: GPT-4o-mini (OpenAI credentials)  
   - Output: JSON with all newsletter fields

9. **Add Microsoft SharePoint Node ("Get Newsletter Template")**  
   - Download your HTML newsletter template file containing exact placeholders  
   - Use same site/folder setup as step 5  
   - OAuth2 credentials required  

10. **Add Extract from File Node ("Extract from Text File")**  
    - Operation: Extract text content from downloaded template file  

11. **Add Code Node ("Build Newsletter")**  
    - Parse AI JSON output from newsletter generation  
    - Replace all placeholders in template text with corresponding AI fields (both DE and EN)  
    - Replace `{{DATE}}` with current date in German locale  
    - Output final HTML string and metadata  

12. **Add LangChain Agent ("Generate Video and Audio Prompt")**  
    - Input: Use case and selected topic  
    - Prompt: Generate short prompts for video, audio, image generation (JSON output)  
    - Model: GPT-4o latest  
    - Output: JSON with `video_prompt`, `audio_prompt`, `image_prompt`  

13. **Add Code Node ("Parse Fields")**  
    - Parse JSON output of above node  
    - Extract prompts, generate random 8-character filename for assets  

14. **Add HTTP Request Node ("Generate Image")**  
    - URL: Pollinations AI URL with sanitized `image_prompt`  
    - Method: GET  
    - Retry on failure up to 5 times  

15. **Add Set Node ("Set Base64 Field")**  
    - Extract base64 string from image binary data for conversion  

16. **Add ConvertToFile Node ("Convert Base64 to File")**  
    - Source property: base64 from previous node  
    - Converts to binary file  

17. **Add HTTP Request Node ("Send Data to Download Service")**  
    - Upload image binary to Velvet Syndicate CDN (or alternative)  
    - Method: POST, multipart/form-data with field "image"  

18. **Add Switch Node ("Switch")**  
    - Condition: ENV_INCLUDE_VIDEO boolean  
    - True branch: Create video and audio  
    - False branch: Skip video generation  

19. **Add HTTP Request Node ("Create FAL Video")**  
    - URL: FAL AI video generation endpoint  
    - Method: POST  
    - Body: JSON with video_prompt, image_url from CDN, video duration  
    - Headers: Authorization using ENV_FALAI_APIKEY  

20. **Add Wait Node ("Wait For Video")**  
    - Wait 30 seconds before polling  

21. **Add HTTP Request Node ("Get Video")**  
    - Poll video generation status and retrieve video URL  

22. **Add If Node ("Video Still Processing")**  
    - Condition: Check if video still processing (error or incomplete)  
    - Loop back to Wait For Video if true  
    - Else proceed to create audio  

23. **Add HTTP Request Node ("Create Audio")**  
    - URL: FAL AI audio generation endpoint  
    - Method: POST  
    - Body: JSON with audio_prompt  
    - Headers: Authorization using ENV_FALAI_APIKEY  

24. **Add Wait Node ("Wait for Audio")**  
    - Wait 59 seconds  

25. **Add HTTP Request Node ("Get Audio")**  
    - Poll audio generation status and retrieve audio URL  

26. **Add If Node ("Audio Still Processing")**  
    - Loop wait if still processing, else proceed to merge  

27. **Add HTTP Request Node ("Create Merge Request")**  
    - URL: FFmpeg API merge endpoint  
    - Method: POST  
    - Body: JSON with video_url and audio_url  
    - Headers: Authorization with ENV_FALAI_APIKEY  

28. **Add Wait Node ("Wait for Merge")**  
    - Wait 50 seconds  

29. **Add HTTP Request Node ("Get Merged Video")**  
    - Poll merge request status and retrieve merged video URL  

30. **Add Merge Node ("Merge1")**  
    - Combine outputs from:  
      - Build Newsletter (final HTML)  
      - Convert Base64 to File (image binary)  
      - TXT to Binary (video URL as text)  
      - Send message and wait for response (approval)  

31. **Add Gmail Node ("Send message and wait for response")**  
    - Send newsletter HTML with embedded image and optional video link to approver  
    - Subject: "SEO Content Approval"  
    - Use OAuth2 Gmail credentials  
    - Wait for double approval response  

32. **Add If Node ("Check Approval Status")**  
    - Check if approval response contains "true"  
    - If approved, proceed to storage  
    - Else stop workflow  

33. **Add Code Node ("HTML to Binary")**  
    - Convert newsletter HTML string to binary buffer  
    - MIME: text/html  
    - Filename: dynamic or fixed  

34. **Add Microsoft SharePoint Node ("Upload HTML")**  
    - Upload newsletter HTML binary file to SharePoint folder  
    - Filename based on random filename  

35. **Add Code Node ("JPG to Binary")**  
    - Extract image binary for upload  

36. **Add Microsoft SharePoint Node ("Upload JPG")**  
    - Upload image JPG file to SharePoint  

37. **Add If Node ("Save Video URL if exists")**  
    - Check ENV_INCLUDE_VIDEO flag  
    - If true, proceed to upload video URL text file  

38. **Add Code Node ("TXT to Binary")**  
    - Convert merged video URL string to text binary file  

39. **Add Microsoft SharePoint Node ("Upload Video URL")**  
    - Upload video URL text file to SharePoint  

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                                                                                                                                                 |
|-----------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Use Microsoft SharePoint OAuth2 credentials for all SharePoint file operations (download & upload).                              | SharePoint nodes: **Get Trends XLSX**, **Get Newsletter Template**, **Upload HTML/JPG/Video URL**                                                                                                                                   |
| Pollinations AI for image generation requires no authentication and supports prompt styling.                                      | Image Generation URL example: `https://image.pollinations.ai/prompt/...`                                                                                                                                                          |
| Velvet Syndicate CDN upload is optional and uses multipart-form-data. Replace URL if using different CDN.                        | URL: `https://operator.velvetsyndicate.de:8090/api/upload-image`                                                                                                                                                                  |
| FAL AI API key required for video and audio generation plus FFmpeg merge operations.                                              | Stored in environment variable `ENV_FALAI_APIKEY` in **Configuration Settings** node                                                                                                                                            |
| Approval email sent via Gmail OAuth2; double approval workflow is enabled to ensure content validation before storage.           | Gmail node config with OAuth2 credentials                                                                                                                                                                                        |
| HTML newsletter template must contain exact placeholders for German and English content fields to enable correct substitution.  | Placeholders: `{{INTRODUCTION_DE}}`, `{{TOPIC_DE}}`, ..., `{{FOOTER_NAME_EN}}`                                                                                                                                                   |
| Video generation inclusion (`include_video`) and duration (`video_duration`) are controlled via initial webhook request inputs. | See **Determine Intent** node for extraction and validation logic                                                                                                                                                                |
| Wait nodes are used with fixed delays (30-60 seconds) for asynchronous multimedia processing; consider adjusting delays based on API response times. | Potential for timeouts or infinite loops if external services delay or fail to respond                                                                                                                                             |
| The workflow uses LangChain nodes for AI prompt handling and OpenAI integration requiring valid API keys.                       | OpenAI API keys must be configured and available in credentials                                                                                                                                                                  |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected material. All handled data is legal and public.