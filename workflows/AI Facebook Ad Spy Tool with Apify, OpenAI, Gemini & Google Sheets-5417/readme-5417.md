AI Facebook Ad Spy Tool with Apify, OpenAI, Gemini & Google Sheets

https://n8nworkflows.xyz/workflows/ai-facebook-ad-spy-tool-with-apify--openai--gemini---google-sheets-5417


# AI Facebook Ad Spy Tool with Apify, OpenAI, Gemini & Google Sheets

### 1. Workflow Overview

This workflow is an **AI-powered Facebook Ad Spy Tool** designed to scrape, analyze, and summarize competitor ads from Facebook’s public Ad Library. It targets marketing agencies, PPC clients, and advertisers who want to gain competitive intelligence on ad strategies across video, image, and text formats. The workflow combines web scraping, multi-modal AI processing (OpenAI GPT-4, Gemini), and data storage in Google Sheets for further use.

The workflow is logically divided into the following blocks:

- **1.1 Facebook Ad Library Scraping**: Initiates ad scraping using Apify, filters ads based on page likes, and routes ads by content type (video, image, text).
- **1.2 Video Ad Processing Pipeline**: Downloads video ads, uploads them to Google Drive and Gemini AI, runs video content analysis, and generates summaries plus rewritten ad copies.
- **1.3 Image & Text Ad Processing**: Processes image ads with GPT-4 Vision and text ads with GPT-4, summarizing and rewriting content for strategic insights.
- **1.4 Data Storage and Output**: Stores processed results in a Google Sheet to maintain a comprehensive competitor intelligence database.
- **1.5 Control & Orchestration**: Handles triggering, batching, waiting, and branching logic to manage scalable processing of ads.

---

### 2. Block-by-Block Analysis

#### 1.1 Facebook Ad Library Scraping

- **Overview:**  
This block triggers the workflow manually, scrapes Facebook ads via Apify API, filters advertisers with more than 1000 page likes, then uses a switch node to route ads according to their media type.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Run Ad Library Scraper (HTTP Request)  
  - Filter For Likes (Filter)  
  - Switch (Switch)  
  - Loop Over Video Ads (SplitInBatches)  
  - Loop Over Image Ads (SplitInBatches)  
  - Loop Over Text Ads (SplitInBatches)

- **Node Details:**

  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point to start scraping on demand.  
    - No inputs; outputs to Run Ad Library Scraper.  
    - Edge cases: None; manual start only.

  - **Run Ad Library Scraper**  
    - Type: HTTP Request  
    - Role: Calls Apify API to scrape Facebook ads with specified parameters: last 7 days, active ads, keyword "ai automation", US country, etc.  
    - Config: POST with JSON body including search terms, count=200 ads, authorization header with Apify API key (must be replaced).  
    - Outputs raw ad data for filtering.  
    - Edge cases: API key missing/invalid, request failure, rate limits, malformed JSON responses.

  - **Filter For Likes**  
    - Type: Filter  
    - Role: Removes advertisers with fewer than 1000 page likes to focus on high-quality competitors.  
    - Condition: `$json.advertiser.ad_library_page_info.page_info.likes > 1000`  
    - Outputs filtered ads to Switch node.  
    - Edge cases: Missing likes field, zero or null values, potential data inconsistencies.

  - **Switch**  
    - Type: Switch  
    - Role: Routes ads based on media content: detects if an ad contains video, image, or text only.  
    - Conditions:  
      - Video: existence of `snapshot.videos[0].video_sd_url` starting with "https://video-"  
      - Image: existence of `snapshot.images[0].original_image_url` starting with "https://scontent-ho"  
      - Fallback: Text  
    - Outputs to respective batch loops.  
    - Edge cases: Ads with missing or malformed media URLs, ads containing multiple media types, unexpected media types.

  - **Loop Over Video Ads / Image Ads / Text Ads**  
    - Type: SplitInBatches  
    - Role: Processes ads in manageable batches sequentially for each media type pipeline.  
    - Outputs to respective processing pipelines.  
    - Edge cases: Empty batches, batch size management, partial failures.

---

#### 1.2 Video Ad Processing Pipeline

- **Overview:**  
This pipeline handles video ads by downloading the video, uploading it to Google Drive and Gemini AI, analyzing the video content with Gemini’s multi-modal AI, then generating a strategic summary and rewritten ad copy using OpenAI GPT-4.

- **Nodes Involved:**  
  - Download Video (HTTP Request)  
  - Upload Video to Drive (Google Drive)  
  - Begin Gemini Upload Session (HTTP Request)  
  - Redownload Video (Google Drive)  
  - Upload Video to Gemini (HTTP Request)  
  - Wait3 (Wait)  
  - Analyze Video with Gemini (HTTP Request)  
  - Output Video Summary (OpenAI)  
  - Add as Type = Video (Google Sheets)  

- **Node Details:**

  - **Download Video**  
    - Type: HTTP Request  
    - Role: Downloads video file from Facebook using the video URL found in ad JSON.  
    - Config: URL dynamically set to `snapshot.videos[0].video_sd_url`.  
    - Outputs: binary video data.  
    - Edge cases: Video URL invalid, download failures, large file sizes, timeouts.

  - **Upload Video to Drive**  
    - Type: Google Drive  
    - Role: Uploads the downloaded video to Google Drive for temporary storage and Gemini access.  
    - Config: Upload to root folder or designated folder; filename "Example File" (modifiable).  
    - Credential: Google Drive OAuth2 credential required.  
    - Outputs: Google Drive file metadata including file ID.  
    - Edge cases: Upload failures, permission errors, quota limits.

  - **Begin Gemini Upload Session**  
    - Type: HTTP Request  
    - Role: Initiates a resumable upload session to Gemini API for video analysis.  
    - Config: POST to Gemini upload URL with headers specifying content length and upload protocol; API key required in query params.  
    - Outputs: Upload session URL in headers.  
    - Edge cases: API key invalid, network errors, header misconfiguration.

  - **Redownload Video**  
    - Type: Google Drive  
    - Role: Downloads the video file back from Google Drive to upload to Gemini.  
    - Config: Uses file ID from previous upload node.  
    - Credential: Google Drive OAuth2.  
    - Outputs: binary video data.  
    - Edge cases: File not found, permission issues.

  - **Upload Video to Gemini**  
    - Type: HTTP Request  
    - Role: Uploads the video data to Gemini using the resumable upload URL obtained earlier.  
    - Config: POST with binary data, headers for content length, offset, and upload commands; uses API key.  
    - Outputs: Confirmation of upload completion.  
    - Edge cases: Upload interruption, incorrect offsets, API errors.

  - **Wait3**  
    - Type: Wait  
    - Role: Waits 15 seconds to allow Gemini to process the uploaded video before analysis.  
    - Config: Fixed wait time of 15 seconds.  
    - Edge cases: Insufficient wait time causing premature analysis request.

  - **Analyze Video with Gemini**  
    - Type: HTTP Request  
    - Role: Sends a request to Gemini AI to generate a detailed description of the video content.  
    - Config: POST to Gemini model endpoint with JSON body requesting an exhaustive video description; uses API key; retries allowed on failure with 15s delay.  
    - Outputs: Gemini’s video content description.  
    - Edge cases: API call failures, rate limits, malformed responses.

  - **Output Video Summary**  
    - Type: OpenAI (Langchain node)  
    - Role: Uses GPT-4.1 to produce a strategic summary and rewritten ad copy from both scraped ad JSON and Gemini video description.  
    - Config: Temperature 0.7, system and user prompts tailored for ad analysis; outputs JSON with summary and rewritten copy.  
    - Credential: OpenAI API key required.  
    - Edge cases: API quota limits, prompt failures, JSON parsing errors.

  - **Add as Type = Video**  
    - Type: Google Sheets  
    - Role: Appends the analyzed video ad data (summary, rewritten copy, video prompt, metadata) to a Google Sheet database.  
    - Config: Maps fields such as `page_id`, `summary`, `rewritten_ad_copy`, `video_prompt` (from Gemini), date, etc.  
    - Credential: Google Sheets OAuth2.  
    - Edge cases: Sheet access denied, quota exceeded, schema mismatches.

---

#### 1.3 Image & Text Ad Processing

- **Overview:**  
Processes image and text ads separately by using GPT-4 Vision for image content analysis and GPT-4 for text-only ads, generating summaries and rewritten ad copies stored in Google Sheets.

- **Nodes Involved:**  

  - Image Route:  
    - Analyze Image (OpenAI Vision)  
    - Output Image Summary (OpenAI)  
    - Add as Type = Image (Google Sheets)  
    - Wait1 (Wait)  

  - Text Route:  
    - Output Text Summary (OpenAI)  
    - Add as Type = Text (Google Sheets)  
    - Wait (Wait)  

- **Node Details:**

  - **Analyze Image**  
    - Type: OpenAI Vision (Langchain)  
    - Role: Describes image content comprehensively using GPT-4 Vision model.  
    - Config: Input is image URL from `snapshot.images[0].original_image_url`.  
    - Credential: OpenAI API.  
    - Edge cases: Image URL invalid, API failures.

  - **Output Image Summary**  
    - Type: OpenAI (Langchain)  
    - Role: Summarizes ad JSON plus the image description for competitor intelligence.  
    - Config: GPT-4.1, temperature 0.7, tailored prompts for ad analysis producing JSON output.  
    - Credential: OpenAI API.  
    - Edge cases: API errors, prompt failures.

  - **Add as Type = Image**  
    - Type: Google Sheets  
    - Role: Stores image ad summaries, rewritten copy, and image prompt (description) into the database.  
    - Config: Maps fields like `page_id`, `summary`, `image_prompt`, etc.  
    - Credential: Google Sheets OAuth2.  
    - Edge cases: Sheet access errors.

  - **Wait1**  
    - Type: Wait  
    - Role: Adds a 1-second delay after image processing to ensure smooth batching.  
    - Edge cases: None.

  - **Output Text Summary**  
    - Type: OpenAI (Langchain)  
    - Role: Summarizes and rewrites text-only ads for strategic insights using GPT-4.1.  
    - Config: Similar prompt and JSON output format as image and video summaries.  
    - Credential: OpenAI API.  
    - Edge cases: Prompt or API failures.

  - **Add as Type = Text**  
    - Type: Google Sheets  
    - Role: Stores text ad analysis results in Google Sheets with metadata.  
    - Credential: Google Sheets OAuth2.  
    - Edge cases: Sheet access issues.

  - **Wait**  
    - Type: Wait  
    - Role: Adds 1-second delay after text processing batches.  
    - Edge cases: None.

---

#### 1.4 Data Storage and Output

- **Overview:**  
Stores all processed and analyzed ad data (video, image, text) in a centralized Google Sheets document to create a searchable and scalable competitor intelligence database.

- **Nodes Involved:**  
  - Add as Type = Video (Google Sheets)  
  - Add as Type = Image (Google Sheets)  
  - Add as Type = Text (Google Sheets)

- **Node Details:**  
Each Google Sheets node appends data to the same spreadsheet document and sheet (gid=0) with fields including ad type, page info, summary, rewritten ad copy, prompts, and timestamps.  
Credential: Google Sheets OAuth2 required.  
Edge cases: API quota limits, schema mismatches, access permissions.

---

#### 1.5 Control & Orchestration

- **Overview:**  
Manages execution flow control, batching, and timing to ensure smooth processing and avoid rate limits or overloading APIs.

- **Nodes Involved:**  
  - Wait (1s) after text ads  
  - Wait1 (1s) after image ads  
  - Wait2 (1s) after video ads  
  - Wait3 (15s) before analyzing video with Gemini  

- **Node Details:**  
Wait nodes introduce controlled delays to throttle API requests and batch processing.  
Webhook IDs indicate potential webhook triggers but primarily used here for timing.  
Edge cases: Delays too short causing API rate limit errors; too long causing unnecessary latency.

---

### 3. Summary Table

| Node Name                   | Node Type               | Functional Role                              | Input Node(s)              | Output Node(s)                | Sticky Note                                                                                                           |
|-----------------------------|-------------------------|----------------------------------------------|----------------------------|------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger          | Manual start of workflow                      | -                          | Run Ad Library Scraper         |                                                                                                                       |
| Run Ad Library Scraper       | HTTP Request            | Scrapes Facebook Ads with Apify API          | When clicking ‘Execute workflow’ | Filter For Likes               | Replace <your-apify-api-key-here> with actual Apify API key and customize search terms                                |
| Filter For Likes             | Filter                  | Filters advertisers with >1000 page likes    | Run Ad Library Scraper       | Switch                       |                                                                                                                       |
| Switch                      | Switch                  | Routes ads to video, image, or text pipelines| Filter For Likes             | Loop Over Video Ads, Loop Over Image Ads, Loop Over Text Ads |                                                                                                                       |
| Loop Over Video Ads          | SplitInBatches          | Batches video ads for processing              | Switch                      | Download Video                |                                                                                                                       |
| Loop Over Image Ads          | SplitInBatches          | Batches image ads for processing              | Switch                      | Analyze Image                 |                                                                                                                       |
| Loop Over Text Ads           | SplitInBatches          | Batches text ads for processing               | Switch                      | Output Text Summary           |                                                                                                                       |
| Download Video              | HTTP Request            | Downloads video from Facebook                  | Loop Over Video Ads          | Upload Video to Drive         |                                                                                                                       |
| Upload Video to Drive        | Google Drive            | Uploads video to Google Drive                  | Download Video              | Begin Gemini Upload Session   |                                                                                                                       |
| Begin Gemini Upload Session  | HTTP Request            | Starts video upload session to Gemini API     | Upload Video to Drive       | Redownload Video             | Add Gemini API key to Gemini-related nodes                                                                             |
| Redownload Video             | Google Drive            | Downloads video back from Drive for Gemini    | Begin Gemini Upload Session  | Upload Video to Gemini        |                                                                                                                       |
| Upload Video to Gemini       | HTTP Request            | Uploads video binary to Gemini                 | Redownload Video            | Wait3                        |                                                                                                                       |
| Wait3                       | Wait                    | Waits 15 seconds for Gemini processing         | Upload Video to Gemini       | Analyze Video with Gemini     |                                                                                                                       |
| Analyze Video with Gemini    | HTTP Request            | Analyzes video content using Gemini AI         | Wait3                       | Output Video Summary          |                                                                                                                       |
| Output Video Summary         | OpenAI (Langchain)      | Summarizes video ad and rewrites copy          | Analyze Video with Gemini    | Add as Type = Video           |                                                                                                                       |
| Add as Type = Video          | Google Sheets           | Stores video ad analysis data                   | Output Video Summary         | Wait2                        | Customize Google Sheet for storing video ad data                                                                      |
| Analyze Image               | OpenAI (Langchain)      | Analyzes image content using GPT-4 Vision     | Loop Over Image Ads          | Output Image Summary          |                                                                                                                       |
| Output Image Summary         | OpenAI (Langchain)      | Summarizes image ad and rewrites copy           | Analyze Image               | Add as Type = Image           |                                                                                                                       |
| Add as Type = Image          | Google Sheets           | Stores image ad analysis data                    | Output Image Summary         | Wait1                        |                                                                                                                       |
| Output Text Summary          | OpenAI (Langchain)      | Summarizes text ad and rewrites copy             | Loop Over Text Ads           | Add as Type = Text            |                                                                                                                       |
| Add as Type = Text           | Google Sheets           | Stores text ad analysis data                     | Output Text Summary          | Wait                         |                                                                                                                       |
| Wait                        | Wait                    | Waits 1 second after text ad processing         | Add as Type = Text           | Loop Over Text Ads (continue) |                                                                                                                       |
| Wait1                       | Wait                    | Waits 1 second after image ad processing        | Add as Type = Image          | Loop Over Image Ads (continue)|                                                                                                                       |
| Wait2                       | Wait                    | Waits 1 second after video ad processing        | Add as Type = Video          | Loop Over Video Ads (continue)|                                                                                                                       |
| Sticky Note (1)              | Sticky Note             | Explains Step 1: Facebook Ad Library Scraping   | -                          | -                            | ## 🕵️ STEP 1: Facebook Ad Library Scraping ... Setup: Replace <your-apify-api-key-here> with actual Apify API key and customize search terms |
| Sticky Note (2)              | Sticky Note             | Explains Step 2: Video Ad Processing Pipeline   | -                          | -                            | ## 📹 STEP 2: Video Ad Processing Pipeline ... Video processing requires Gemini API for multi-modal analysis           |
| Sticky Note (3)              | Sticky Note             | Explains Step 3: Image & Text Ad Processing      | -                          | -                            | ## 🖼️ STEP 3: Image & Text Ad Processing ... Comprehensive competitor intelligence database                          |
| Sticky Note (4)              | Sticky Note             | Explains Business Value & Applications           | -                          | -                            | ## 💰 BUSINESS VALUE & APPLICATIONS ... Scalable System: Process hundreds of ads automatically with detailed analysis |
| Sticky Note (5)              | Sticky Note             | Workflow setup instructions and tips             | -                          | -                            | ## AI Facebook Ad Spy Tool Steps: 1. Add API keys... 4. Adjust prompts and Google Sheets accordingly                   |

---

### 4. Reproducing the Workflow from Scratch

**Step 1: Create Manual Trigger**

- Add a **Manual Trigger** node named "When clicking ‘Execute workflow’".
- No special configuration.

**Step 2: Add Apify Ad Library Scraper**

- Add an **HTTP Request** node named "Run Ad Library Scraper".
- Method: POST
- URL: `https://api.apify.com/v2/acts/XtaWFhbtfxyzqrFmd/run-sync-get-dataset-items`
- Body Type: JSON
- Body:
  ```json
  {
    "count": 200,
    "period": "last7d",
    "scrapeAdDetails": true,
    "scrapePageAds.activeStatus": "active",
    "urls": [
      {
        "url": "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=%22ai%20automation%22&search_type=keyword_exact_phrase&start_date[min]=2025-06-12&start_date[max]",
        "method": "GET"
      }
    ]
  }
  ```
- Headers:
  - Authorization: `Bearer <yourApiKey>` (replace with your Apify API key)
  - Accept: application/json
- Connect "When clicking ‘Execute workflow’" → "Run Ad Library Scraper"

**Step 3: Filter Advertisers by Likes**

- Add a **Filter** node named "Filter For Likes".
- Condition:  
  `{{$json["advertiser"]["ad_library_page_info"]["page_info"]["likes"]}} > 1000`
- Connect "Run Ad Library Scraper" → "Filter For Likes"

**Step 4: Add Switch Node to Route Ad Types**

- Add a **Switch** node named "Switch".
- Add rules:
  - Video: Check if `{{$json["snapshot"]["videos"][0]["video_sd_url"]}}` exists and starts with "https://video-"
  - Image: Check if `{{$json["snapshot"]["images"][0]["original_image_url"]}}` exists and starts with "https://scontent-ho"
  - Fallback: Text
- Connect "Filter For Likes" → "Switch"

**Step 5: Add SplitInBatches Nodes for Each Ad Type**

- Add three **SplitInBatches** nodes:
  - "Loop Over Video Ads" → output video ads
  - "Loop Over Image Ads" → output image ads
  - "Loop Over Text Ads" → output text ads
- Connect "Switch" outputs to respective batch nodes.

---

**Video Ad Pipeline**

**Step 6: Download Video**

- HTTP Request node "Download Video"
- Method: GET
- URL: `{{$json["snapshot"]["videos"][0]["video_sd_url"]}}`
- Connect "Loop Over Video Ads" → "Download Video"

**Step 7: Upload Video to Google Drive**

- Google Drive node "Upload Video to Drive"
- Operation: Upload
- Folder: root or desired folder
- Name: "Example File" (customize as needed)
- Credential: configure Google Drive OAuth2
- Connect "Download Video" → "Upload Video to Drive"

**Step 8: Begin Gemini Upload Session**

- HTTP Request node "Begin Gemini Upload Session"
- Method: POST
- URL: `https://generativelanguage.googleapis.com/upload/v1beta/files`
- Headers:
  - X-Goog-Upload-Protocol: resumable
  - X-Goog-Upload-Command: start
  - X-Goog-Upload-Header-Content-Length: `{{$json["size"]}}`
  - Content-Type: application/json
- Query Parameter: key = `<yourApiKey>` (Gemini API key)
- Connect "Upload Video to Drive" → "Begin Gemini Upload Session"

**Step 9: Redownload Video from Google Drive**

- Google Drive node "Redownload Video"
- Operation: Download
- File ID: `{{$node["Upload Video to Drive"].json["id"]}}`
- Credential: Google Drive OAuth2
- Connect "Begin Gemini Upload Session" → "Redownload Video"

**Step 10: Upload Video to Gemini**

- HTTP Request node "Upload Video to Gemini"
- Method: POST
- URL: `{{$json.headers["x-goog-upload-url"]}}`
- Headers:
  - Content-Length: `{{$node["Upload Video to Drive"].json["size"]}}`
  - X-Goog-Upload-Offset: 0
  - X-Goog-Upload-Command: upload, finalize
- Query Parameter: key = `<yourApiKey>`
- Body Type: Binary Data
- Input Data Field: data
- Connect "Redownload Video" → "Upload Video to Gemini"

**Step 11: Wait 15 seconds**

- Wait node "Wait3"
- Time: 15 seconds
- Connect "Upload Video to Gemini" → "Wait3"

**Step 12: Analyze Video with Gemini**

- HTTP Request node "Analyze Video with Gemini"
- Method: POST
- URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Body (JSON):
  ```json
  {
    "contents": [
      {
        "parts": [
          {"text": "Describe this video in excruciating detail. Do not output anything but the description of the video."},
          {
            "file_data": {
              "mime_type": "{{ $json.file.mimeType }}",
              "file_uri": "{{ $json.file.uri }}"
            }
          }
        ]
      }
    ]
  }
  ```
- Query Parameter: key = `<yourApiKey>`
- Retry on failure enabled with 15s intervals
- Connect "Wait3" → "Analyze Video with Gemini"

**Step 13: Generate Video Summary with OpenAI**

- OpenAI Langchain node "Output Video Summary"
- Model: GPT-4.1
- Temperature: 0.7
- Messages: System + user prompts including scraped ad JSON and Gemini video description; output JSON with summary and rewritten ad copy.
- Credential: OpenAI API
- Connect "Analyze Video with Gemini" → "Output Video Summary"

**Step 14: Store Video Data in Google Sheets**

- Google Sheets node "Add as Type = Video"
- Operation: Append
- Document: Select your Google Sheet for ad data
- Sheet: gid=0 or your sheet
- Columns mapped for ad metadata, summary, rewritten copy, video prompt (Gemini description), timestamps
- Credential: Google Sheets OAuth2
- Connect "Output Video Summary" → "Add as Type = Video"

**Step 15: Wait 1 second**

- Wait node "Wait2"
- Time: 1 second
- Connect "Add as Type = Video" → "Wait2"
- Connect "Wait2" back to "Loop Over Video Ads" for next batch

---

**Image Ad Pipeline**

**Step 16: Analyze Image with OpenAI Vision**

- OpenAI Langchain node "Analyze Image"
- Model: GPT-4 Vision (gpt-4o)
- Operation: Analyze image URL from `snapshot.images[0].original_image_url`
- Credential: OpenAI API
- Connect "Loop Over Image Ads" → "Analyze Image"

**Step 17: Generate Image Summary**

- OpenAI Langchain node "Output Image Summary"
- Model: GPT-4.1
- Temperature: 0.7
- Prompts similar to video summary, including scraped ad JSON and image description; output JSON
- Credential: OpenAI API
- Connect "Analyze Image" → "Output Image Summary"

**Step 18: Store Image Data in Google Sheets**

- Google Sheets node "Add as Type = Image"
- Operation: Append
- Map ad metadata, summary, rewritten copy, image prompt, timestamps
- Credential: Google Sheets OAuth2
- Connect "Output Image Summary" → "Add as Type = Image"

**Step 19: Wait 1 second**

- Wait node "Wait1"
- Time: 1 second
- Connect "Add as Type = Image" → "Wait1"
- Connect "Wait1" back to "Loop Over Image Ads" for next batch

---

**Text Ad Pipeline**

**Step 20: Generate Text Summary**

- OpenAI Langchain node "Output Text Summary"
- Model: GPT-4.1
- Temperature: 0.7
- Input: scraped ad JSON string; output JSON summary and rewritten copy
- Credential: OpenAI API
- Connect "Loop Over Text Ads" → "Output Text Summary"

**Step 21: Store Text Data in Google Sheets**

- Google Sheets node "Add as Type = Text"
- Operation: Append
- Map ad metadata, summary, rewritten copy, timestamps
- Credential: Google Sheets OAuth2
- Connect "Output Text Summary" → "Add as Type = Text"

**Step 22: Wait 1 second**

- Wait node "Wait"
- Time: 1 second
- Connect "Add as Type = Text" → "Wait"
- Connect "Wait" back to "Loop Over Text Ads" for next batch

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                  |
|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Replace `<yourApiKey>` in Apify and Gemini HTTP Request nodes with your actual API keys.                       | Workflow setup instructions (Sticky Note)                                                      |
| Google Drive OAuth2 credential is required for uploading and downloading videos.                               | Google Drive node credentials                                                                   |
| OpenAI API key is required with access to GPT-4 and GPT-4 Vision models.                                       | All OpenAI Langchain nodes                                                                      |
| The workflow handles batching and waits to avoid API rate limits and ensure stable processing.                 | Wait nodes (1 second for batches, 15 seconds for Gemini video processing)                        |
| Gemini API multi-modal capabilities are used for advanced video understanding and detailed content extraction.| Gemini Upload and Analyze Video nodes                                                           |
| The Google Sheets document acts as a centralized competitor intelligence database combining all ad analyses.   | Google Sheets nodes                                                                             |
| For best results, customize the OpenAI prompts to match your agency’s tone and analytic style.                 | OpenAI Langchain nodes prompts                                                                 |
| Video URLs and image URLs are extracted from the scraped ad JSON structure, ensure the scraper data format matches. | Switch node conditions                                                                          |
| Workflow designed for US Facebook ads and keyword "ai automation" — adjust scraper URL for different targets.  | Run Ad Library Scraper node body                                                                |
| For more info on using Apify: https://apify.com/docs/api/v2                                                         | Apify API documentation                                                                         |
| For Gemini API reference: https://developers.generativelanguage.googleapis.com/docs/models/gemini-2.0-flash     | Gemini API documentation                                                                       |
| For OpenAI API reference: https://platform.openai.com/docs/models/gpt-4                                       | OpenAI API documentation                                                                       |

---

**Disclaimer:**  
The content provided is exclusively from an n8n automated workflow. It complies strictly with content policies, contains no illegal or offensive elements, and manipulates only legal and public data.