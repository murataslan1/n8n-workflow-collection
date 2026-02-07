Auto-Generate Facebook Posts from Video Insights using Dumpling AI + GPT-4o

https://n8nworkflows.xyz/workflows/auto-generate-facebook-posts-from-video-insights-using-dumpling-ai---gpt-4o-5168


# Auto-Generate Facebook Posts from Video Insights using Dumpling AI + GPT-4o

### 1. Workflow Overview

This workflow automates the generation of Facebook posts and related images from newly uploaded tutorial videos in a specific Google Drive folder. It is designed for content creators or marketers who want to repurpose video content into engaging social media posts with minimal manual effort.

The workflow is logically divided into these blocks:

- **1.1 Input Reception**: Detect new video file uploads in a designated Google Drive folder.
- **1.2 Video Processing**: Download the video and convert it into a base64-encoded string suitable for AI processing.
- **1.3 AI Insight Extraction**: Send the base64 video to Dumpling AI to extract structured tutorial insights.
- **1.4 Content Generation with GPT-4o**: Use OpenAI’s GPT-4o model to generate a concise Facebook post and a descriptive image prompt based on the extracted insights.
- **1.5 AI Image Generation**: Generate a visual image from the prompt using Dumpling AI’s image generation API.
- **1.6 Data Logging**: Save the generated Facebook post and image URL in a Google Sheet for review or scheduling.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Listens continuously to a specific Google Drive folder. When a new video file is uploaded, it triggers the workflow to start processing.

- **Nodes Involved:**  
  - Trigger on New Video Upload

- **Node Details:**  

  - **Trigger on New Video Upload**  
    - Type: Google Drive Trigger  
    - Role: Watches a specific Google Drive folder for new file creation events every minute.  
    - Configuration: Triggers only on new files created in folder ID `1NU00YbKNiHJptNuQZH6kgVUhLvDzE0ka` (cached folder URL provided).  
    - Credentials: Uses OAuth2 credentials for Google Drive access.  
    - Inputs: None (trigger node).  
    - Outputs: Emits JSON metadata of the new video file, including file ID, name, and other metadata.  
    - Edge cases: Potential failures include Google Drive API rate limits, folder permission errors, or connectivity issues.  
    - Version-specific: Uses typeVersion 1.

#### 2.2 Video Processing

- **Overview:**  
  Downloads the video file from Google Drive and converts it into a base64 string for the AI API.

- **Nodes Involved:**  
  - Download Video File  
  - Convert Video to Base64

- **Node Details:**  

  - **Download Video File**  
    - Type: Google Drive node  
    - Role: Downloads the video file using the ID from the trigger node.  
    - Configuration: Operates in "download" mode, file ID dynamically set from trigger output (`{{$json.id}}`).  
    - Credentials: Google Drive OAuth2 credentials reused.  
    - Input: Receives file metadata from trigger node.  
    - Output: Binary data of the downloaded video.  
    - Edge cases: File not found, permission denied, or download timeouts.  
    - Version: 3.

  - **Convert Video to Base64**  
    - Type: Extract From File  
    - Role: Converts the binary video data into a base64-encoded string stored in JSON property `data`.  
    - Configuration: Uses "binaryToProperty" operation with default options.  
    - Input: Receives binary data from Download node.  
    - Output: JSON with `data` property containing base64 string.  
    - Edge cases: Corrupted binary data, memory constraints on large files.  
    - Version: 1.

#### 2.3 AI Insight Extraction

- **Overview:**  
  Sends the base64 video to Dumpling AI’s endpoint to extract structured insights relevant to the tutorial content.

- **Nodes Involved:**  
  - Extract Key Insights with Dumpling AI

- **Node Details:**  

  - **Extract Key Insights with Dumpling AI**  
    - Type: HTTP Request  
    - Role: Calls Dumpling AI’s `/extract-video` API with a detailed prompt to extract tutorial insights as JSON.  
    - Configuration: POST request with JSON body including:  
      - `inputMethod`: "base64"  
      - `video`: base64 string from previous node  
      - `prompt`: A complex instruction to extract topic, tools, purpose, steps, modules, use cases, and tips from the video transcript.  
      - `jsonMode`: true to request structured JSON response.  
    - Authentication: HTTP header auth with Dumpling AI API key credential.  
    - Input: JSON containing base64 video string.  
    - Output: JSON with extracted tutorial insights.  
    - Edge cases: API auth failures, timeout on large files, malformed JSON responses, or incomplete extraction.  
    - Version: 4.2.

#### 2.4 Content Generation with GPT-4o

- **Overview:**  
  Uses OpenAI’s GPT-4o to generate a friendly Facebook post and an image prompt JSON from the extracted key insights.

- **Nodes Involved:**  
  - Generate Facebook Post & Image Prompt

- **Node Details:**  

  - **Generate Facebook Post & Image Prompt**  
    - Type: LangChain OpenAI node  
    - Role: Feeds Dumpling AI’s extracted insights into a system prompt instructing GPT-4o to create a short Facebook post and a concise image prompt.  
    - Configuration:  
      - Model: "chatgpt-4o-latest"  
      - Messages:  
        - System message: Defines the content writer and visual assistant role, output format (JSON), style (natural, friendly), and length constraints (100-150 words).  
        - User message: Injects extracted insights JSON dynamically from Dumpling AI node output.  
      - Outputs: JSON with keys `facebook_post` and `image_prompt`.  
    - Credentials: OpenAI API key.  
    - Input: Extracted insights JSON.  
    - Output: JSON with generated Facebook post text and image prompt string.  
    - Edge cases: API rate limiting, malformed input causing generation errors, unexpected output format.  
    - Version: 1.8.

#### 2.5 AI Image Generation

- **Overview:**  
  Sends the image prompt generated by GPT-4o to Dumpling AI’s image generation endpoint to produce an AI-generated image URL.

- **Nodes Involved:**  
  - Generate AI Image with Dumpling AI

- **Node Details:**  

  - **Generate AI Image with Dumpling AI**  
    - Type: HTTP Request  
    - Role: Calls Dumpling AI’s `/generate-ai-image` API with the prompt from GPT-4o to create an image.  
    - Configuration: POST request with JSON body:  
      - `model`: "recraft-v3"  
      - `input`: object containing `prompt` (dynamic from previous node’s JSON) and `style`: "any".  
    - Authentication: HTTP header auth with Dumpling AI API key.  
    - Input: JSON containing image prompt.  
    - Output: JSON including generated image URL(s).  
    - Edge cases: API errors, unsupported prompt formats, rate limits.  
    - Version: 4.2.

#### 2.6 Data Logging

- **Overview:**  
  Appends the generated Facebook post and image URL into a designated Google Sheet for record-keeping or publishing workflow.

- **Nodes Involved:**  
  - Save Post and Image URL to Google Sheet

- **Node Details:**  

  - **Save Post and Image URL to Google Sheet**  
    - Type: Google Sheets node  
    - Role: Appends a new row with the Facebook post text and image URL.  
    - Configuration:  
      - Operation: Append  
      - Sheet: "Sheet1" (gid=0) in the spreadsheet ID `1NkLQ4ZZ3qSv8HybYuKyW2BgViUij68ux4_SnoBphmWE`  
      - Columns mapped:  
        - Post: from `Generate Facebook Post & Image Prompt` node’s JSON path `message.content.facebook_post`  
        - Image URL: from `Generate AI Image with Dumpling AI` node’s JSON path `images[0].url`  
    - Credentials: Google Sheets OAuth2 credentials.  
    - Input: JSON containing post text and image URL.  
    - Output: Operation result confirmation.  
    - Edge cases: Sheet access permission issues, API limits, malformed data.  
    - Version: 4.6.

---

### 3. Summary Table

| Node Name                     | Node Type                       | Functional Role                      | Input Node(s)                     | Output Node(s)                          | Sticky Note                                                                                                   |
|-------------------------------|--------------------------------|------------------------------------|----------------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Trigger on New Video Upload    | Google Drive Trigger            | Detects new video uploads           | None                             | Download Video File                   | Listens to a specific Google Drive folder. Triggers on new video file creation every minute.                  |
| Download Video File            | Google Drive                   | Downloads video file from Drive     | Trigger on New Video Upload       | Convert Video to Base64               | Downloads the file using the triggered file ID.                                                              |
| Convert Video to Base64        | Extract From File               | Converts binary video to base64     | Download Video File               | Extract Key Insights with Dumpling AI | Converts binary data to base64 string for API consumption.                                                    |
| Extract Key Insights with Dumpling AI | HTTP Request                | Extracts structured video insights  | Convert Video to Base64           | Generate Facebook Post & Image Prompt | Sends base64 video to Dumpling AI with a detailed prompt to extract tutorial insights in JSON format.         |
| Generate Facebook Post & Image Prompt | LangChain OpenAI              | Generates Facebook post and image prompt | Extract Key Insights with Dumpling AI | Generate AI Image with Dumpling AI    | Uses GPT-4o to create friendly Facebook post and image prompt JSON based on extracted content.                 |
| Generate AI Image with Dumpling AI | HTTP Request                | Generates AI image from prompt       | Generate Facebook Post & Image Prompt | Save Post and Image URL to Google Sheet | Sends image prompt to Dumpling AI to generate visual image URL.                                               |
| Save Post and Image URL to Google Sheet | Google Sheets               | Logs post and image URL              | Generate AI Image with Dumpling AI | None                                  | Appends the generated content to a Google Sheet for review or publishing.                                    |
| Sticky Note                   | Sticky Note                   | Summary and documentation note       | None                             | None                                  | ### 📌 Workflow Summary: Automates content repurposing from video uploads to Facebook posts and images.       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add a **Google Drive Trigger** node named `Trigger on New Video Upload`.  
   - Set event to `fileCreated`, trigger on a specific folder.  
   - Provide the Google Drive folder ID to watch (`1NU00YbKNiHJptNuQZH6kgVUhLvDzE0ka`).  
   - Set polling interval to every minute.  
   - Configure Google Drive OAuth2 credentials.

2. **Add Download Node:**  
   - Add a **Google Drive** node named `Download Video File`.  
   - Set operation to `download`.  
   - Configure file ID to reference `{{$json.id}}` from the trigger node.  
   - Connect output of trigger node to this node.  
   - Use the same Google Drive OAuth2 credentials.

3. **Add Conversion Node:**  
   - Add an **Extract From File** node named `Convert Video to Base64`.  
   - Set operation to `binaryToProperty`.  
   - Default settings suffice; output will be base64 string in JSON property `data`.  
   - Connect the binary output of the download node to this node.

4. **Add Dumpling AI Insight Extraction:**  
   - Add an **HTTP Request** node named `Extract Key Insights with Dumpling AI`.  
   - Set method to POST, URL to `https://app.dumplingai.com/api/v1/extract-video`.  
   - Configure request body (JSON) with keys:  
     - `"inputMethod": "base64"`  
     - `"video": "{{ $json.data }}"`  
     - `"prompt":` (Use the detailed Dumpling AI prompt from original node)  
     - `"jsonMode": true`  
   - Authentication: HTTP header auth with Dumpling AI API key credential.  
   - Connect output of conversion node to this node.

5. **Add GPT-4o Content Generation:**  
   - Add a **LangChain OpenAI** node named `Generate Facebook Post & Image Prompt`.  
   - Set model to `chatgpt-4o-latest`.  
   - Configure messages:  
     - System message: instruct content writer and image prompt creator role, output as JSON with `facebook_post` and `image_prompt`.  
     - User message: inject extracted content from previous node: `{{ $('Extract Key Insights with Dumpling AI').item.json.results }}`  
   - Enable JSON output.  
   - Set OpenAI API credentials.  
   - Connect from insight extraction node.

6. **Add Dumpling AI Image Generation:**  
   - Add an **HTTP Request** node named `Generate AI Image with Dumpling AI`.  
   - Set method to POST, URL: `https://app.dumplingai.com/api/v1/generate-ai-image`.  
   - Request body JSON:  
     - `"model": "recraft-v3"`  
     - `"input": { "prompt": "{{ $json.message.content.image_prompt }}", "style": "any" }`  
   - Authentication: HTTP header auth with Dumpling AI API key credential.  
   - Connect from GPT-4o node.

7. **Add Google Sheets Logging Node:**  
   - Add a **Google Sheets** node named `Save Post and Image URL to Google Sheet`.  
   - Operation: Append.  
   - Document ID: Set to your target Google Sheet ID (`1NkLQ4ZZ3qSv8HybYuKyW2BgViUij68ux4_SnoBphmWE`).  
   - Sheet name: `Sheet1` (gid=0).  
   - Map columns:  
     - Post: `={{ $('Generate Facebook Post & Image Prompt').item.json.message.content.facebook_post }}`  
     - Image URL: `={{ $json.images[0].url }}`  
   - Connect from image generation node.  
   - Configure Google Sheets OAuth2 credentials.

8. **Optional:** Add a **Sticky Note** node for documentation purposes with summary content.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                          | Context or Link                                                                                             |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| This workflow automates content repurposing from technical tutorial videos by extracting insights and generating Facebook posts plus AI images.                                                                                     | Workflow summary sticky note inside the workflow.                                                          |
| Dumpling AI APIs used: `/extract-video` for insight extraction and `/generate-ai-image` for image generation. Authentication via HTTP header auth with API keys is mandatory.                                                         | Dumpling AI API documentation (not included here).                                                         |
| OpenAI GPT-4o model employed for natural, friendly content writing with JSON output formatting.                                                                                                                                     | OpenAI API docs for model `chatgpt-4o-latest`.                                                             |
| Google Drive trigger and Google Sheets nodes require OAuth2 credentials with appropriate permissions to access the target folder and spreadsheet.                                                                                   | Google Cloud Console and API setup for Drive and Sheets.                                                   |
| Potential error points include API rate limits, file size constraints (large videos), malformed JSON responses, and permission issues on Google Drive or Sheets. Retrying and error handling mechanisms should be considered.          | N8n best practices for error workflows and credential management.                                           |
| The image prompt is designed to be descriptive but concise, suitable for text-to-image generation models. The `recraft-v3` model is specified for image generation in Dumpling AI.                                                    | Dumpling AI image generation model details.                                                                |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.