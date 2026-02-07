AI-Powered Product Video Generator (Foreplay + Gemini + Sora 2)

https://n8nworkflows.xyz/workflows/ai-powered-product-video-generator--foreplay---gemini---sora-2--9986


# AI-Powered Product Video Generator (Foreplay + Gemini + Sora 2)

### 1. Workflow Overview

This workflow automates the generation of personalized, cinematic-quality product videos leveraging Foreplay’s ad data, Google Gemini AI for creative prompt generation, and Kie.ai (Sora 2 model) for text-to-video synthesis. It is designed for marketers, brand managers, and content creators who want to produce quick, high-quality video ads without manual scripting or editing.

The workflow logic is organized into the following functional blocks:

- **1.1 Initialization and Configuration**: Manual trigger and setting up credentials and product information.
- **1.2 Data Retrieval**: Fetching the product image from Google Drive and competitor video data from Foreplay API.
- **1.3 Data Preparation**: Splitting Foreplay response and assembling input data for video generation.
- **1.4 Video Prompt Generation**: Using Google Gemini AI to create a personalized video prompt.
- **1.5 Video Generation and Monitoring**: Sending the prompt to Kie.ai for video creation, checking the generation status, and downloading the finished video.
- **1.6 Finalization**: Uploading the generated video to Google Drive and iteration over multiple ad examples if applicable.

---

### 2. Block-by-Block Analysis

#### 2.1 Initialization and Configuration

- **Overview:** This block sets up the workflow's starting point, configures necessary API credentials, and defines the static product details for use throughout the workflow.
- **Nodes Involved:**  
  - Manual Trigger  
  - Set Workflow Credentials  
  - Set Product Information  

- **Node Details:**

  - **Manual Trigger**  
    - Type: Trigger (manual)  
    - Role: Entry point to start the workflow manually.  
    - Configuration: Default manual trigger with no parameters.  
    - Inputs: None  
    - Outputs: Set Workflow Credentials  
    - Failure modes: None expected unless manual start is not executed.

  - **Set Workflow Credentials**  
    - Type: Set node  
    - Role: Assigns API keys and folder IDs for Google Drive, Foreplay, and other services.  
    - Configuration:  
      - `folderProductId` and `folderGeneratedId` set dynamically via variables (placeholders `GOOGLE_DRIVE_FOLDER_ID`) for Google Drive folders.  
      - `baseUrl` as Foreplay API base URL.  
      - `foreplayApiKey` and `brandId` set dynamically from environment or input variables.  
    - Inputs: Manual Trigger  
    - Outputs: Set Product Information  
    - Edge cases: Missing or incorrect credentials will cause API calls to fail downstream.

  - **Set Product Information**  
    - Type: Set node  
    - Role: Defines static product metadata required for prompt generation and API queries.  
    - Configuration:  
      - `productName`: "Homyped"  
      - `niche`: "fashion"  
      - `category`: "shoes"  
      - `targetMarket`: "b2c"  
    - Inputs: Set Workflow Credentials  
    - Outputs: Fetch Product Image from Google Drive  
    - Edge cases: Hardcoded values limit flexibility; should be parameterized for reuse.

---

#### 2.2 Data Retrieval

- **Overview:** Retrieves the product image from Google Drive and fetches competitor video ad data using the Foreplay API filtered by product niche and target market.
- **Nodes Involved:**  
  - Fetch Product Image from Google Drive  
  - Fetch Competitor Video Data (Foreplay API)  

- **Node Details:**

  - **Fetch Product Image from Google Drive**  
    - Type: Google Drive node  
    - Role: Fetches one file (product image) from a specified Google Drive folder.  
    - Configuration:  
      - Limits results to 1 file from folder ID set in workflow credentials (`folderProductId`).  
      - Uses OAuth2 credentials named "Johan Drive".  
    - Inputs: Set Product Information  
    - Outputs: Fetch Competitor Video Data (Foreplay API)  
    - Edge cases: Empty folder or permission issues cause no image retrieval.

  - **Fetch Competitor Video Data (Foreplay API)**  
    - Type: HTTP Request  
    - Role: Requests recent competitor video ads data filtered by brand and niche from Foreplay API.  
    - Configuration:  
      - GET request with query parameters including brand_id, date range (last month to yesterday), live status, video duration, platform, niche, target market, language, etc.  
      - Authorization header uses Bearer token from workflow credentials.  
      - Returns up to 5 longest-running Instagram video ads in English.  
    - Inputs: Fetch Product Image from Google Drive  
    - Outputs: Split Foreplay Response  
    - Edge cases: API key invalid, rate limits, or network errors.

---

#### 2.3 Data Preparation

- **Overview:** Processes the Foreplay API response by splitting the array of ads and assembling relevant data fields to prepare for video prompt generation.
- **Nodes Involved:**  
  - Split Foreplay Response  
  - Assemble Video Input Data  

- **Node Details:**

  - **Split Foreplay Response**  
    - Type: Split Out node  
    - Role: Splits the `data` array from Foreplay API response into individual items for batch processing.  
    - Configuration: Splits on `data` field.  
    - Inputs: Fetch Competitor Video Data (Foreplay API)  
    - Outputs: Assemble Video Input Data  
    - Edge cases: Empty or malformed response.

  - **Assemble Video Input Data**  
    - Type: Set node  
    - Role: Extracts and sets key fields required for prompt generation and video creation.  
    - Configuration:  
      - Sets:  
        - `desc`: Ad description  
        - `transcript`: Full transcription text (nullable)  
        - `mood`: Emotional drivers as JSON object  
        - `duration`: Video duration in seconds  
        - `pictureUrl`: Google Drive thumbnail URL constructed using the product image ID  
    - Inputs: Split Foreplay Response  
    - Outputs: Iterate Over Ad Examples  
    - Edge cases: Missing or null fields in ad data.

---

#### 2.4 Video Prompt Generation

- **Overview:** Generates a personalized, cinematic video prompt text using Google Gemini LLM based on assembled input data and product metadata.
- **Nodes Involved:**  
  - Iterate Over Ad Examples  
  - Generate Video Prompt  
  - Google Gemini LLM  

- **Node Details:**

  - **Iterate Over Ad Examples**  
    - Type: Split In Batches  
    - Role: Processes each ad example individually to generate a video prompt and subsequent video.  
    - Configuration: Default batch size (1).  
    - Inputs: Assemble Video Input Data (initially) and Video Generation Status (for retries/failures).  
    - Outputs: Generate Video Prompt (main batch), empty (second output).  
    - Edge cases: Empty input array, batch processing errors.

  - **Generate Video Prompt**  
    - Type: Langchain Agent node  
    - Role: Constructs a detailed video scene prompt text using product info, ad description, transcript, mood scores, and video duration.  
    - Configuration:  
      - Uses a detailed system message defining role and instructions for prompt generation (VidPrompt AI assistant).  
      - Input text template injects product fields and ad data dynamically using expressions.  
    - Inputs: Iterate Over Ad Examples  
    - Outputs: Create Video Task (Kie.ai)  
    - Edge cases: Expression evaluation errors, AI model failures, quota limits.

  - **Google Gemini LLM**  
    - Type: Langchain Google Gemini chat LLM node  
    - Role: Executes the AI language model call powering the Generate Video Prompt node.  
    - Configuration: Uses connected Google Palm API credentials ("Johan Gemini").  
    - Inputs: Generate Video Prompt (agent)  
    - Outputs: Generate Video Prompt (agent) for further processing  
    - Edge cases: API key quota, network errors, model unavailability.

---

#### 2.5 Video Generation and Monitoring

- **Overview:** Sends the generated prompt and product image URL to Kie.ai’s Sora 2 model for video creation, monitors the job status, and downloads the finished video.
- **Nodes Involved:**  
  - Create Video Task (Kie.ai)  
  - Check Video Generation Status  
  - Video Generation Status (Switch)  
  - Wait Before Checking Again  
  - Download Finished Video  

- **Node Details:**

  - **Create Video Task (Kie.ai)**  
    - Type: HTTP Request  
    - Role: Initiates a video generation task on Kie.ai with prompt, image, and rendering options.  
    - Configuration:  
      - POST request to `https://api.kie.ai/api/v1/jobs/createTask`.  
      - JSON body includes model `"sora-2-image-to-video"`, prompt text, image URL, aspect ratio `"portrait"`, and watermark removal flag.  
      - Authenticated via Bearer token credentials ("Kie.ai" HTTP Bearer Auth).  
    - Inputs: Generate Video Prompt  
    - Outputs: Check Video Generation Status  
    - Edge cases: Invalid auth, API rate limits, malformed JSON, Kie.ai service downtime.

  - **Check Video Generation Status**  
    - Type: HTTP Request  
    - Role: Polls Kie.ai API to check the current state of the video generation job.  
    - Configuration:  
      - GET request to `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...` with dynamic taskId from previous response.  
      - Authenticated via same Kie.ai credentials.  
    - Inputs: Create Video Task (initial), Wait Before Checking Again (retries)  
    - Outputs: Video Generation Status switch  
    - Edge cases: Network timeout, invalid taskId, API errors.

  - **Video Generation Status**  
    - Type: Switch node  
    - Role: Routes workflow based on the job state returned by Kie.ai.  
    - Configuration:  
      - Outputs:  
        - "Success" if `data.state` equals `"success"`  
        - "Failed" if `data.state` equals `"failed"`  
        - "extra" fallback for other states (e.g., pending)  
    - Inputs: Check Video Generation Status  
    - Outputs:  
      - Success → Download Finished Video  
      - Failed → Iterate Over Ad Examples (retry or abort)  
      - extra → Wait Before Checking Again (poll again)  
    - Edge cases: Unexpected states or malformed data.

  - **Wait Before Checking Again**  
    - Type: Wait node  
    - Role: Delays workflow for 1 minute before rechecking job status to prevent excessive polling.  
    - Configuration: Wait time 1 minute.  
    - Inputs: Video Generation Status (extra output)  
    - Outputs: Check Video Generation Status (poll again)  
    - Edge cases: Long delays increase total workflow time.

  - **Download Finished Video**  
    - Type: HTTP Request  
    - Role: Downloads the completed video file from Kie.ai’s URL.  
    - Configuration:  
      - GET request to URL extracted from `data.resultJson.resultUrls.first()`.  
      - No authentication needed (assumed public URL).  
    - Inputs: Video Generation Status (success output)  
    - Outputs: Upload Generated Video to Google Drive  
    - Edge cases: URL inaccessible, network errors, file corruption.

---

#### 2.6 Finalization

- **Overview:** Uploads the downloaded video file to a designated Google Drive folder and iterates over multiple ad examples if applicable.
- **Nodes Involved:**  
  - Upload Generated Video to Google Drive  
  - Iterate Over Ad Examples  

- **Node Details:**

  - **Upload Generated Video to Google Drive**  
    - Type: Google Drive node  
    - Role: Uploads the generated video file to Google Drive under a specified folder.  
    - Configuration:  
      - File name set dynamically as current date/time (`yyyy-MM-dd HH:mm`).  
      - Target folder ID from workflow credentials (`folderGeneratedId`).  
      - Uses OAuth2 credentials "Johan Drive".  
    - Inputs: Download Finished Video  
    - Outputs: Iterate Over Ad Examples (to continue processing further ads)  
    - Edge cases: Upload failures, permission errors.

  - **Iterate Over Ad Examples** (from Finalization)  
    - Reuses the same split-in-batches node to process next ad examples after a video is uploaded or if the previous generation failed.  
    - Input: Upload Generated Video to Google Drive or Video Generation Status (failed output).  
    - Output: Generate Video Prompt (for next batch) or ends if no more items.  
    - Edge cases: Loop control and batch exhaustion.

---

### 3. Summary Table

| Node Name                        | Node Type                        | Functional Role                                   | Input Node(s)                      | Output Node(s)                        | Sticky Note                                                                                         |
|---------------------------------|---------------------------------|-------------------------------------------------|----------------------------------|-------------------------------------|---------------------------------------------------------------------------------------------------|
| Sticky Note                     | Sticky Note                     | Provides workflow overview and instructions     | -                                | -                                   | ![Workflow Thumbnail](https://drive.google.com/thumbnail?id=1Q1-UcWXwv1eYzxjTumYCFXG1S7C3Be2V&sz=w1000) Workflow overview and setup instructions |
| Manual Trigger                  | Manual Trigger                  | Starts the workflow manually                     | -                                | Set Workflow Credentials             |                                                                                                   |
| Set Workflow Credentials        | Set                            | Defines API keys and folder IDs                  | Manual Trigger                   | Set Product Information              |                                                                                                   |
| Set Product Information         | Set                            | Defines static product metadata                   | Set Workflow Credentials          | Fetch Product Image from Google Drive |                                                                                                   |
| Fetch Product Image from Google Drive | Google Drive                   | Retrieves product image file                       | Set Product Information           | Fetch Competitor Video Data (Foreplay API) |                                                                                                   |
| Fetch Competitor Video Data (Foreplay API) | HTTP Request                   | Fetches competitor ads data from Foreplay API    | Fetch Product Image from Google Drive | Split Foreplay Response               |                                                                                                   |
| Split Foreplay Response         | Split Out                      | Splits array of ads for individual processing    | Fetch Competitor Video Data        | Assemble Video Input Data            |                                                                                                   |
| Assemble Video Input Data       | Set                            | Extracts and sets fields for prompt generation   | Split Foreplay Response           | Iterate Over Ad Examples             |                                                                                                   |
| Iterate Over Ad Examples        | Split In Batches               | Processes each ad example in batch                | Assemble Video Input Data, Video Generation Status (failed, upload) | Generate Video Prompt (batch 1), empty (batch 2) |                                                                                                   |
| Generate Video Prompt           | Langchain Agent                | Creates personalized text prompt for video       | Iterate Over Ad Examples           | Create Video Task (Kie.ai)           |                                                                                                   |
| Google Gemini LLM               | Langchain Google Gemini        | Executes AI language model call                   | Generate Video Prompt             | Generate Video Prompt                |                                                                                                   |
| Create Video Task (Kie.ai)      | HTTP Request                   | Initiates video generation task at Kie.ai        | Generate Video Prompt             | Check Video Generation Status        |                                                                                                   |
| Check Video Generation Status   | HTTP Request                   | Polls Kie.ai for job status                        | Create Video Task, Wait Before Checking Again | Video Generation Status              |                                                                                                   |
| Video Generation Status         | Switch                        | Routes workflow based on video job state          | Check Video Generation Status     | Download Finished Video (Success), Iterate Over Ad Examples (Failed), Wait Before Checking Again (Pending) |                                                                                                   |
| Wait Before Checking Again      | Wait                          | Delays before re-polling job status               | Video Generation Status (extra)   | Check Video Generation Status        |                                                                                                   |
| Download Finished Video         | HTTP Request                   | Downloads the finished video from Kie.ai          | Video Generation Status (Success) | Upload Generated Video to Google Drive |                                                                                                   |
| Upload Generated Video to Google Drive | Google Drive                   | Uploads generated video to Google Drive folder    | Download Finished Video           | Iterate Over Ad Examples             |                                                                                                   |
| Sticky Note1                   | Sticky Note                     | Step-by-step instructions for configuring workflow | -                                | -                                   | Step-by-step instructions for all key nodes and setup details                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger node**  
   - Type: Manual Trigger  
   - No configuration needed.

2. **Create Set Workflow Credentials node**  
   - Type: Set  
   - Add fields:  
     - `folderProductId` (string): set to your Google Drive folder ID for product images.  
     - `folderGeneratedId` (string): set to your Google Drive folder ID for generated videos.  
     - `baseUrl` (string): `https://public.api.foreplay.co/api` (Foreplay API base).  
     - `foreplayApiKey` (string): your Foreplay API key.  
     - `brandId` (string): your Foreplay brand ID.  
   - Connect Manual Trigger → Set Workflow Credentials.

3. **Create Set Product Information node**  
   - Type: Set  
   - Add fields with your product metadata:  
     - `productName`: e.g., "Homyped"  
     - `niche`: e.g., "fashion"  
     - `category`: e.g., "shoes"  
     - `targetMarket`: e.g., "b2c"  
   - Connect Set Workflow Credentials → Set Product Information.

4. **Create Google Drive node - Fetch Product Image from Google Drive**  
   - Resource: File/Folder  
   - Operation: List files (limit 1)  
   - Set folderId to `={{ $('Set Workflow Credentials').item.json.folderProductId }}`  
   - Use OAuth2 credentials for Google Drive (e.g., "Johan Drive").  
   - Connect Set Product Information → Fetch Product Image from Google Drive.

5. **Create HTTP Request node - Fetch Competitor Video Data (Foreplay API)**  
   - Method: GET  
   - URL: `={{ $('Set Workflow Credentials').item.json.baseUrl }}/spyder/brand/ads`  
   - Query parameters:  
     - `brand_id`: `={{ $('Set Workflow Credentials').item.json.brandId }}`  
     - `start_date`: `={{ $now.minus(1, 'month').format('yyyy-MM-dd') }}`  
     - `end_date`: `={{ $now.minus(1, 'day').format('yyyy-MM-dd') }}`  
     - `live`: true  
     - `display_format`: "video"  
     - `publisher_platform`: "instagram"  
     - `niches`: `={{ $('Set Product Information').item.json.niche }}`  
     - `market_target`: `={{ $('Set Product Information').item.json.targetMarket }}`  
     - `languages`: "en"  
     - `video_duration_min`: 5  
     - `video_duration_max`: 30  
     - `running_duration_min_days`: 1  
     - `limit`: 5  
     - `order`: "longest_running"  
   - Headers: Authorization: `Bearer {{ $('Set Workflow Credentials').item.json.foreplayApiKey }}`  
   - Connect Fetch Product Image from Google Drive → Fetch Competitor Video Data.

6. **Create Split Out node - Split Foreplay Response**  
   - Field to split out: `data`  
   - Connect Fetch Competitor Video Data → Split Foreplay Response.

7. **Create Set node - Assemble Video Input Data**  
   - Map the fields from split ad item:  
     - `desc`: `={{ $json.description }}`  
     - `transcript`: `={{ $json.full_transcription }}`  
     - `mood`: `={{ $json.emotional_drivers }}`  
     - `duration`: `={{ $json.video_duration }}`  
     - `pictureUrl`: `=https://drive.google.com/thumbnail?id={{ $('Fetch Product Image from Google Drive').item.json.id }}`  
   - Connect Split Foreplay Response → Assemble Video Input Data.

8. **Create Split In Batches node - Iterate Over Ad Examples**  
   - Default batch size (1)  
   - Connect Assemble Video Input Data → Iterate Over Ad Examples.

9. **Create Langchain Agent node - Generate Video Prompt**  
   - Text input template:  
     ```
     Generate a personalized product video prompt using the following data:

     Product Information:
     Product Name: {{ $('Set Product Information').item.json.productName }}
     Niche: {{ $('Set Product Information').item.json.niche }}
     Category: {{ $('Set Product Information').item.json.category }}
     Target Market: {{ $('Set Product Information').item.json.targetMarket }}

     Description:
     {{ $json.desc }}

     Transcription (can be null):
     {{ $json.transcript }}

     Mood (JSON format of emotion scores, each range from 1-10):
     {{ $json.mood.toJsonString() }}

     Video Duration (in seconds):
     {{ $json.duration }}
     ```
   - System message: Use the detailed prompt as in the original workflow (VidPrompt role, instructions, example).  
   - Connect Iterate Over Ad Examples (main output) → Generate Video Prompt.

10. **Create Langchain Google Gemini LLM node**  
    - Use Google Palm API credentials (e.g., "Johan Gemini").  
    - Connect Generate Video Prompt → Google Gemini LLM → Generate Video Prompt (to inject AI response).

11. **Create HTTP Request node - Create Video Task (Kie.ai)**  
    - Method: POST  
    - URL: `https://api.kie.ai/api/v1/jobs/createTask`  
    - JSON Body:  
      ```json
      {
        "model": "sora-2-image-to-video",
        "input": {
          "callBackUrl": "{{ $('Set Workflow Credentials').item.json.callBackUrl }}",
          "prompt": "{{ $json.output }}",
          "image_urls": ["{{ $('Assemble Video Input Data').item.json.pictureUrl }}"],
          "aspect_ratio": "portrait",
          "remove_watermark": true
        }
      }
      ```  
    - Authentication: HTTP Bearer Auth with Kie.ai credentials.  
    - Connect Generate Video Prompt → Create Video Task.

12. **Create HTTP Request node - Check Video Generation Status**  
    - Method: GET  
    - URL: `=https://api.kie.ai/api/v1/jobs/recordInfo?taskId={{ $json.data.taskId }}`  
    - Authentication: HTTP Bearer Auth with Kie.ai credentials.  
    - Connect Create Video Task → Check Video Generation Status.

13. **Create Switch node - Video Generation Status**  
    - Rules:  
      - Success: `data.state == "success"`  
      - Failed: `data.state == "failed"`  
      - Fallback: "extra"  
    - Connect Check Video Generation Status → Video Generation Status.

14. **Create Wait node - Wait Before Checking Again**  
    - Wait 1 minute.  
    - Connect Video Generation Status (extra output) → Wait Before Checking Again → Check Video Generation Status (loop).

15. **Create HTTP Request node - Download Finished Video**  
    - Method: GET  
    - URL: `={{ $json.data.resultJson.parseJson().resultUrls.first() }}`  
    - Connect Video Generation Status (Success output) → Download Finished Video.

16. **Create Google Drive node - Upload Generated Video to Google Drive**  
    - Operation: Upload file  
    - Name: `={{ $now.format('yyyy-MM-dd HH:mm') }}`  
    - Folder ID: `={{ $('Set Workflow Credentials').item.json.folderGeneratedId }}`  
    - Credentials: OAuth2 for Google Drive.  
    - Connect Download Finished Video → Upload Generated Video.

17. **Connect Upload Generated Video and Video Generation Status (Failed output) to Iterate Over Ad Examples**  
    - This enables batch processing of multiple ads.

18. **Add Sticky Notes for documentation**  
    - Include workflow overview and setup instructions as in the original sticky note nodes.

---

### 5. General Notes & Resources

| Note Content                                                                                                       | Context or Link                                                                                     |
|--------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Workflow Thumbnail and overview image provided: ![Thumbnail](https://drive.google.com/thumbnail?id=1Q1-UcWXwv1eYzxjTumYCFXG1S7C3Be2V&sz=w1000) | Visual reference for workflow layout and branding.                                                 |
| Step-by-step setup instructions are documented in a sticky note within the workflow, covering credential setup and node dependencies. | Provides essential configuration guidance to users before running the workflow.                    |
| Foreplay API documentation: https://public.api.foreplay.co/api (as base URL)                                       | API endpoint for competitor video ad data retrieval.                                              |
| Google Gemini AI credentials require Google Palm API access (configured via Langchain nodes).                      | Credential setup instructions for Google Gemini LLM integration.                                   |
| Kie.ai API details: https://api.kie.ai (video generation service using Sora 2 model)                               | API for text-to-video generation with callback and status polling support.                         |
| Google Drive folder permissions must be set to public or appropriately shared for image thumbnail and video upload. | Required for accessibility of media files by external APIs and workflow nodes.                     |

---

**Disclaimer:** The text provided is exclusively generated from an automated n8n workflow. It complies strictly with content policies and contains no illegal or protected material. All processed data is public and lawful.