Auto-Generate Blog & AI Image from YouTube Videos with Dumpling AI & GPT-4o

https://n8nworkflows.xyz/workflows/auto-generate-blog---ai-image-from-youtube-videos-with-dumpling-ai---gpt-4o-4327


# Auto-Generate Blog & AI Image from YouTube Videos with Dumpling AI & GPT-4o

### 1. Workflow Overview

This workflow automates the process of generating a blog post and a corresponding AI-generated image from newly uploaded YouTube video files stored in a specific Google Drive folder. Its target use case is content creators or marketers who want to quickly produce textual and visual content based on video material without manual transcription or creative writing effort.

The workflow is logically divided into two major blocks:

- **1.1 Video Ingestion and Transcription:** Watches a designated Google Drive folder for new video files, downloads each new video, converts it to a Base64 string, and sends it to Dumpling AI’s video transcription API to obtain a full and detailed transcript.

- **1.2 Content Generation and Storage:** Uses GPT-4o to generate a blog post and an AI image prompt from the transcript, sends the prompt to Dumpling AI’s image generation API to produce a visual, and stores both the blog content and image in Airtable for easy publishing or social sharing.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Video Ingestion and Transcription

**Overview:**  
This block monitors Google Drive for new video uploads, downloads the videos, converts them into a Base64 representation suitable for API consumption, and then transcribes the entire audio content using Dumpling AI’s transcription API.

**Nodes Involved:**  
- Watch Folder for New YouTube Videos  
- Download Video File  
- Convert Downloaded Video to Base64  
- Transcribe Video with Dumpling AI (Full Transcript)

**Node Details:**

- **Watch Folder for New YouTube Videos**  
  - *Type:* Google Drive Trigger  
  - *Role:* Watches a specific Google Drive folder for new files created, polling every minute.  
  - *Configuration:* Watches a folder with ID `1mde_V0ePcJEebVydygVKT7GDiABjj2A4` (YouTube Videos folder). Uses Google Drive OAuth2 credentials.  
  - *Input/Output:* No input; outputs new file metadata.  
  - *Failures:* Possible auth errors if credentials expire; folder access permissions required.  
  - *Notes:* Triggers workflow automatically on new video file creation.

- **Download Video File**  
  - *Type:* Google Drive Node  
  - *Role:* Downloads the video file whose ID was detected by the trigger node.  
  - *Configuration:* Uses file ID from trigger node output; downloads the file binary. Uses same Google Drive credentials.  
  - *Input:* File metadata from trigger node.  
  - *Output:* Binary data of the downloaded video file.  
  - *Failures:* File may be large causing timeout; permission or file not found errors.

- **Convert Downloaded Video to Base64**  
  - *Type:* Extract From File  
  - *Role:* Converts the binary video data into a Base64 string stored as a JSON property for API use.  
  - *Configuration:* Operation set to "binaryToProperty" converting binary data into a Base64 string under `data`.  
  - *Input:* Binary video from previous node.  
  - *Output:* JSON item with Base64 encoded video string.  
  - *Failures:* Large files may cause memory issues; binary to Base64 conversion may fail on corrupted files.

- **Transcribe Video with Dumpling AI (Full Transcript)**  
  - *Type:* HTTP Request  
  - *Role:* Sends Base64 video string to Dumpling AI’s `/extract-video` endpoint to get a full transcript of the video’s audio.  
  - *Configuration:* POST request with JSON body containing the Base64 video and a detailed prompt requesting a verbatim, paragraph-formatted transcript including fillers and pauses.  
  - *Input:* Base64 video string from previous node.  
  - *Output:* Plain text transcription as JSON response.  
  - *Auth:* Uses generic HTTP header auth with configured credentials.  
  - *Failures:* API rate limits, network timeouts, invalid Base64 data, or malformed responses could cause failures.

---

#### 2.2 Content Generation and Storage

**Overview:**  
This block receives the transcript text, uses GPT-4o to generate a human-friendly blog post and an AI image prompt, then requests an AI image from Dumpling AI, and finally saves the blog post and image URL into Airtable.

**Nodes Involved:**  
- Generate Blog & Image Prompt using GPT-4o  
- Generate Visual from Blog Prompt with Dumpling AI  
- Save Blog Post to Airtable  
- Upload Blog post Image to Airtable

**Node Details:**

- **Generate Blog & Image Prompt using GPT-4o**  
  - *Type:* OpenAI Node (LangChain integration)  
  - *Role:* Uses GPT-4o to create a blog post and image prompt based on the transcript.  
  - *Configuration:*  
    - Model: GPT-4o  
    - System message instructs to write a clear, engaging blog post with opening, 2-4 explanatory paragraphs, and a conclusion; also to generate a concise, descriptive image prompt formatted as JSON with fields `blog_post` and `image_prompt`.  
    - User message includes the transcript text.  
  - *Input:* Transcript text from Dumpling AI node output.  
  - *Output:* JSON with `blog_post` and `image_prompt`.  
  - *Auth:* OpenAI credentials via API key.  
  - *Failures:* API quota limits, prompt parsing errors, incomplete JSON output.

- **Generate Visual from Blog Prompt with Dumpling AI**  
  - *Type:* HTTP Request  
  - *Role:* Sends the image prompt to Dumpling AI’s image generation endpoint using model `FLUX.1-pro` to create a visual asset.  
  - *Configuration:* POST with JSON body including prompt text, resolution 1024x576, aspect ratio 16:9.  
  - *Input:* Image prompt string from GPT-4o node output.  
  - *Output:* Image generation response with image URL or asset.  
  - *Auth:* HTTP header auth with credentials.  
  - *Failures:* API errors, invalid prompt format, network issues.

- **Save Blog Post to Airtable**  
  - *Type:* Airtable Node  
  - *Role:* Creates a new record in Airtable with the blog post content in the `Content` field.  
  - *Configuration:*  
    - Base and Table selected from Airtable app and table IDs.  
    - Content field mapped to the blog post text from GPT-4o node.  
  - *Input:* Blog post text.  
  - *Output:* Airtable record metadata including record ID.  
  - *Auth:* Airtable Personal Access Token credentials.  
  - *Failures:* API rate limits, invalid table or base IDs, permission errors.

- **Upload Blog post Image to Airtable**  
  - *Type:* HTTP Request  
  - *Role:* Patches the newly created Airtable record to add the image prompt URL in the `Attachments` field.  
  - *Configuration:*  
    - PATCH request to Airtable API with record ID injected dynamically.  
    - JSON body contains the image URL under `Attachments` as an array of objects with `url`.  
  - *Input:* Airtable record ID from previous node, image prompt URL from GPT-4o output.  
  - *Output:* Updated Airtable record confirmation.  
  - *Auth:* HTTP header auth with Airtable connection credentials.  
  - *Failures:* Record ID missing or incorrect, URL invalid format, Airtable API errors.

---

### 3. Summary Table

| Node Name                                  | Node Type                  | Functional Role                                   | Input Node(s)                     | Output Node(s)                           | Sticky Note                                                                                      |
|--------------------------------------------|----------------------------|--------------------------------------------------|----------------------------------|-----------------------------------------|-------------------------------------------------------------------------------------------------|
| Watch Folder for New YouTube Videos         | Google Drive Trigger       | Detects new video files in specific Drive folder | None                             | Download Video File                      | ### 🎥 From Video Upload to Blog Prompt: This part watches new videos, downloads, converts to base64, and transcribes. |
| Download Video File                         | Google Drive               | Downloads the detected video file                 | Watch Folder for New YouTube Videos | Convert Downloaded Video to Base64       | Same as above                                                                                   |
| Convert Downloaded Video to Base64          | Extract From File          | Converts binary video data to Base64 string       | Download Video File               | Transcribe Video with Dumpling AI (Full Transcript) | Same as above                                                                                   |
| Transcribe Video with Dumpling AI (Full Transcript) | HTTP Request               | Sends Base64 video to Dumpling AI for transcription | Convert Downloaded Video to Base64 | Generate Blog & Image Prompt using GPT-4o | Same as above                                                                                   |
| Generate Blog & Image Prompt using GPT-4o   | OpenAI (LangChain)         | Generates blog post text and AI image prompt      | Transcribe Video with Dumpling AI (Full Transcript) | Generate Visual from Blog Prompt with Dumpling AI | Same as above                                                                                   |
| Generate Visual from Blog Prompt with Dumpling AI | HTTP Request               | Requests AI image generation based on prompt      | Generate Blog & Image Prompt using GPT-4o | Save Blog Post to Airtable              | ### 📝 Generate Image and Save Blog to Airtable: Generates image from prompt and stores blog and image in Airtable. |
| Save Blog Post to Airtable                   | Airtable                   | Saves generated blog post text                     | Generate Visual from Blog Prompt with Dumpling AI | Upload Blog post Image to Airtable      | Same as above                                                                                   |
| Upload Blog post Image to Airtable           | HTTP Request               | Updates Airtable record with image URL             | Save Blog Post to Airtable       | None                                    | Same as above                                                                                   |
| Sticky Note                                 | Sticky Note                | Describes first block (video ingestion & transcription) | None                             | None                                    | See content above                                                                              |
| Sticky Note1                                | Sticky Note                | Describes second block (content generation & storage) | None                             | None                                    | See content above                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger Node:**
   - Node Type: Google Drive Trigger  
   - Configure to watch a specific Google Drive folder (ID: `1mde_V0ePcJEebVydygVKT7GDiABjj2A4`) for new files created.  
   - Poll interval: every minute.  
   - Use valid Google Drive OAuth2 credentials.

2. **Add Google Drive Node to Download File:**
   - Node Type: Google Drive  
   - Operation: Download  
   - File ID: Expression referencing trigger node’s file ID (`{{$json["id"]}}`).  
   - Use same Google Drive credentials.

3. **Add Extract From File Node to Convert to Base64:**
   - Node Type: Extract From File  
   - Operation: binaryToProperty  
   - Convert the binary video data into a Base64 string in a JSON property (default `data`).

4. **Add HTTP Request Node to Transcribe Video with Dumpling AI:**
   - Node Type: HTTP Request  
   - Method: POST  
   - URL: `https://app.dumplingai.com/api/v1/extract-video`  
   - Body (JSON):  
     ```json
     {
       "inputMethod": "base64",
       "video": "{{ $json.data }}",
       "prompt": "Please transcribe the entire audio content of this video. I need a clear, complete, and accurate transcript of everything that was said, without summarizing or skipping any part. Include all spoken words, even fillers or pauses like 'um' or 'uh', if present. Format the transcript in clean readable text, broken into paragraphs where appropriate.",
       "jsonMode": "false"
     }
     ```  
   - Authentication: HTTP Header Auth with Dumpling AI credentials.

5. **Add OpenAI Node (LangChain) to Generate Blog & Image Prompt:**
   - Node Type: `@n8n/n8n-nodes-langchain.openAi`  
   - Model: `gpt-4o`  
   - Messages:  
     - System message instructing to generate a full blog post and image prompt in exact JSON format.  
     - User message passing the transcript from previous node.  
   - Output: JSON with fields `blog_post` and `image_prompt`.  
   - Use OpenAI API credentials.

6. **Add HTTP Request Node to Generate Visual from Blog Prompt:**
   - Node Type: HTTP Request  
   - Method: POST  
   - URL: `https://app.dumplingai.com/api/v1/generate-ai-image`  
   - Body (JSON):  
     ```json
     {
       "model": "FLUX.1-pro",
       "input": {
         "prompt": "{{ $json.message.content.image_prompt }}",
         "width": 1024,
         "height": 576,
         "aspect_ratio": "16:9"
       }
     }
     ```  
   - Authentication: HTTP Header Auth with Dumpling AI credentials.

7. **Add Airtable Node to Save Blog Post:**
   - Node Type: Airtable  
   - Operation: Create  
   - Base and Table: Select appropriate Airtable base and table.  
   - Map `Content` field to the blog post text from the OpenAI node output.  
   - Use Airtable Personal Access Token credentials.

8. **Add HTTP Request Node to Upload Blog Post Image to Airtable:**
   - Node Type: HTTP Request  
   - Method: PATCH  
   - URL: `https://api.airtable.com/v0/{BaseID}/{TableName}/{{ $json.id }}` (inject the record ID from previous Airtable node).  
   - Body (JSON):  
     ```json
     {
       "fields": {
         "Attachments": [
           {
             "url": "{{ $('Generate Blog & Image Prompt using GPT-4o').item.json.message.content.image_prompt }}"
           }
         ]
       }
     }
     ```  
   - Authentication: HTTP Header Auth with Airtable connection credentials.

9. **Connect Nodes in Sequence:**
   - Connect Google Drive Trigger → Download Video File → Convert to Base64 → Transcribe Video → Generate Blog & Image Prompt → Generate Visual → Save Blog Post → Upload Blog Post Image.

10. **Add Sticky Notes (Optional):**
    - Add descriptive sticky notes for clarity on each block’s purpose.

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                                                                                   |
|-----------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The Dumpling AI API is used for both video transcription and AI image generation with specific endpoints.      | Dumpling AI API docs or portal (credentials needed).                                            |
| The GPT-4o model is a specialized OpenAI model suitable for creative content generation with structured output. | OpenAI API documentation and LangChain integration guidelines.                                  |
| Airtable is used as the final storage for blog content and images, enabling easy publishing or social media use.| Airtable API docs: https://airtable.com/api                                                   |
| The workflow assumes video files are uploaded in a format compatible with Dumpling AI’s video transcription.    | Check Dumpling AI supported video formats and size limits.                                      |
| Polling interval is set to 1 minute, which can be adjusted based on expected upload frequency and API limits.  | n8n Google Drive Trigger node configuration options.                                            |
| The workflow requires valid OAuth2 credentials for Google Drive, OpenAI API key, Dumpling AI HTTP header tokens, and Airtable tokens, all properly scoped. | Ensure credentials are kept secure and refreshed as needed.                                     |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n integration and automation tool. The processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.