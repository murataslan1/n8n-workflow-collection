Analyze Meta Ads Creatives with Google Vision & Video Intelligence APIs

https://n8nworkflows.xyz/workflows/analyze-meta-ads-creatives-with-google-vision---video-intelligence-apis-7303


# Analyze Meta Ads Creatives with Google Vision & Video Intelligence APIs

### 1. Workflow Overview

This workflow automates the analysis of Meta Ads creatives by integrating Facebook Ads data with Google Cloud’s Vision and Video Intelligence APIs. It targets marketers, analysts, and ad researchers who want to extract rich insights from ad creatives, whether static images or videos, and consolidate the analysis results into Google Sheets for reporting and decision-making.

The workflow is logically divided into these main blocks:

- **1.1 Scheduled Trigger & Campaign Setup:** Initiates the workflow daily and sets the Meta Ads Campaign ID for analysis.
- **1.2 Retrieval of Active Ads & Branching:** Fetches active ads for the campaign and branches processing based on whether the creative is a video or an image.
- **1.3 Video Processing Block:** For video creatives, retrieves source URL, downloads and converts video to Base64, sends to Google Video Intelligence API, polls for completion, parses results, and stores insights.
- **1.4 Image Processing Block:** For image creatives, downloads image, converts to Base64, sends to Google Vision API, parses results, and stores insights.
- **1.5 Error Handling Block:** Captures and logs any errors such as missing URLs or API failures into a dedicated Google Sheets tab.
- **1.6 Data Output Block:** Consolidates all parsed annotation data and appends it to the main Google Sheet.

These blocks work together to provide a robust automated pipeline for analyzing and cataloging ad creative content at scale.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Scheduled Trigger & Campaign Setup

**Overview:**  
Starts the workflow every day at 9 AM and sets the Meta Ads Campaign ID to analyze.

**Nodes Involved:**  
- Run Daily at 9 AM  
- Set Campaign ID  
- Sticky Note Config

**Node Details:**  

- **Run Daily at 9 AM**  
  - Type: Schedule Trigger  
  - Configured to trigger daily at 9:00 AM local time.  
  - No inputs; output triggers the workflow start.  
  - Potential failure: None typical; relies on n8n scheduler.  

- **Set Campaign ID**  
  - Type: Set  
  - Role: Assigns a static string "campaign_id" (placeholder) to be replaced with the actual campaign ID by user.  
  - Key expression: sets "campaign_id" variable.  
  - Input: Trigger from schedule node. Output: Campaign ID passed downstream.  
  - Edge case: If campaign ID is not set correctly, subsequent Facebook API calls will fail.  

- **Sticky Note Config**  
  - Type: Sticky Note  
  - Role: Documentation for user on how to find the campaign ID in Facebook Ads Manager.  
  - No data flow.  

---

#### 2.2 Retrieval of Active Ads & Branching

**Overview:**  
Fetches all active ads from the specified campaign, splits the ads array into individual items, then branches processing based on creative type (video or image).

**Nodes Involved:**  
- Get Active Ads  
- Split Out  
- Is it a Video?  
- Sticky Note Split

**Node Details:**  

- **Get Active Ads**  
  - Type: Facebook Graph API  
  - Role: Retrieves ads for the campaign ID using Facebook Graph API v22.0.  
  - Query fields requested: id, name, creative details including video_data if available.  
  - Input: Campaign ID from Set Campaign ID node.  
  - Edge cases: Auth errors due to Facebook token expiry, API rate limits, campaign ID invalid.  

- **Split Out**  
  - Type: Split Out  
  - Role: Splits the list of ads into individual ad objects for processing.  
  - Input: Array of ads from Facebook API. Output: Single ad per item.  
  - Edge cases: Empty ad list results in no downstream processing.  

- **Is it a Video?**  
  - Type: If  
  - Role: Checks if the ad creative has a video by testing existence of `video_id` inside the creative object.  
  - Condition: Existence of `$json.data.creative.object_story_spec.video_data.video_id`.  
  - Branches:  
    - True: Process as video creative.  
    - False: Process as image creative.  
  - Edge cases: Creatives missing expected fields may cause condition expression failure.  

- **Sticky Note Split**  
  - Type: Sticky Note  
  - Role: Explains the branching logic for video vs image creatives.  

---

#### 2.3 Video Processing Block

**Overview:**  
Processes video creatives by retrieving the direct source URL, downloading the video, converting it to Base64, sending it to Google Video Intelligence API for asynchronous analysis, polling for completion, parsing results, and logging insights.

**Nodes Involved:**  
- Get Video Source URL  
- Download Video File  
- Video to Base64 String  
- Loop for videos  
- Start Video Annotation  
- Wait 30s  
- Check Operation Status  
- If Ready  
- Wait 3s  
- Set id data for Video  
- Parse data  
- Add Segments data  
- Set (Video Error Row)  
- Add errors  
- Sticky Note Video

**Node Details:**  

- **Get Video Source URL**  
  - Type: Facebook Graph API  
  - Role: Retrieves video metadata including direct source URL of the video file.  
  - Uses Facebook Graph API v23.0, querying fields: permalink_url, created_time, id, source.  
  - Input: video_id from video creative.  
  - Edge cases: Video removed or permissions denied causing missing source URL.  

- **Download Video File**  
  - Type: HTTP Request  
  - Role: Downloads the video binary from the source URL.  
  - Input: URL from previous node.  
  - Edge cases: HTTP errors, timeouts, large file sizes causing failures.  

- **Video to Base64 String**  
  - Type: Extract From File  
  - Role: Converts downloaded binary video to Base64 string required by Google API.  
  - Edge cases: Memory constraints on large videos.  

- **Loop for videos**  
  - Type: Split in Batches  
  - Role: Processes video files in batches, controlling flow to the Google Video Intelligence API.  
  - Edge cases: Batch size too large or API quota limits.  

- **Start Video Annotation**  
  - Type: HTTP Request  
  - Role: Sends Base64 video content with requested features (label detection, speech transcription, text detection) to Google Video Intelligence API, initiating async job.  
  - Uses Google API credentials.  
  - Edge cases: API auth errors, invalid content, exceeding quotas.  
  - On error: continues flow to error handling node.  

- **Wait 30s**  
  - Type: Wait  
  - Role: Pauses 30 seconds before polling API for job status.  

- **Check Operation Status**  
  - Type: HTTP Request  
  - Role: Polls Google Video Intelligence API for completion status of the annotation job using operation name.  
  - Edge cases: Network errors, job failures.  

- **If Ready**  
  - Type: If  
  - Role: Checks if the video annotation job is done by verifying `done` field.  
  - Branches:  
    - True: proceeds to parse data.  
    - False: waits 3 seconds and polls again.  

- **Wait 3s**  
  - Type: Wait  
  - Role: Short wait between API polls to reduce request frequency.  

- **Set id data for Video**  
  - Type: Set  
  - Role: Assigns metadata fields (campaign_id, ad_id, creative_id, video_id, file_name, image_url, source) extracted from previous nodes for context in parsed data.  

- **Parse data**  
  - Type: Code  
  - Role: Parses Google Video Intelligence API JSON response, extracting segment labels, shot labels, text detection, speech transcription into structured rows.  
  - Handles edge cases like missing fields gracefully.  

- **Add Segments data**  
  - Type: Google Sheets  
  - Role: Appends parsed video annotation data rows to the main Google Sheet tab.  
  - Requires Google Sheets OAuth credentials.  
  - Edge cases: Sheets API rate limits or permission errors.  

- **Set (Video Error Row)**  
  - Type: Set  
  - Role: Constructs an error data row if video annotation fails, capturing error message and metadata.  

- **Add errors**  
  - Type: Google Sheets  
  - Role: Logs errors into a dedicated "errors" sheet tab for troubleshooting.  

- **Sticky Note Video**  
  - Type: Sticky Note  
  - Role: Documents the video processing logic for user clarity.  

---

#### 2.4 Image Processing Block

**Overview:**  
Processes static image creatives by downloading the image, converting it to Base64, sending it to Google Vision API for analysis (labels, text, logos, objects, safe search), parsing results, and storing insights.

**Nodes Involved:**  
- Has image_url?  
- Download Image File  
- Image to Base64 String  
- Start Image Annotation  
- Set id data for Static  
- Parse data from images  
- Add Segments data  
- Set (Error Row)  
- Add errors  
- Sticky Note Image

**Node Details:**  

- **Has image_url?**  
  - Type: If  
  - Role: Checks if the creative has an `image_url` field.  
  - Branches:  
    - True: proceed to download the image.  
    - False: send to error handling node for missing image URL.  

- **Download Image File**  
  - Type: HTTP Request  
  - Role: Downloads image binary from the `image_url`.  
  - Edge cases: HTTP errors, missing or inaccessible image.  

- **Image to Base64 String**  
  - Type: Extract From File  
  - Role: Converts image binary to Base64 string for Google Vision API.  

- **Start Image Annotation**  
  - Type: HTTP Request  
  - Role: Sends Base64 encoded image to Google Vision API with multiple feature requests (label detection, text detection, logo detection, landmark detection, object localization, web detection, safe search).  
  - Uses Google API credentials.  
  - Edge cases: API auth or quota errors.  

- **Set id data for Static**  
  - Type: Set  
  - Role: Assigns metadata fields for image creatives (campaign_id, ad_id, creative_id, file_name, image_url, source) to enrich parsed data.  

- **Parse data from images**  
  - Type: Code  
  - Role: Parses Google Vision API JSON response, extracting labels, logos, landmarks, objects (with bounding boxes), web entities, safe search annotations, and text annotations into structured rows.  

- **Add Segments data**  
  - Type: Google Sheets  
  - Role: Appends parsed image annotation data to the main Google Sheet tab.  

- **Set (Error Row)**  
  - Type: Set  
  - Role: Constructs an error data row if image URL is missing or invalid.  

- **Add errors**  
  - Type: Google Sheets  
  - Role: Logs errors into the dedicated errors sheet tab.  

- **Sticky Note Image**  
  - Type: Sticky Note  
  - Role: Documents the image processing logic for user clarity.  

---

#### 2.5 Error Handling Block

**Overview:**  
Centralized handling of errors arising from missing image URLs or failures during Google API video annotation. Logs detailed error information into a separate Google Sheets tab for review.

**Nodes Involved:**  
- Set (Error Row)  
- Set (Video Error Row)  
- Add errors  
- Sticky Note Errors

**Node Details:**  

- **Set (Error Row)**  
  - Captures missing image URL or video_id errors with metadata.  

- **Set (Video Error Row)**  
  - Captures errors from failed video annotation API calls with detailed error messages.  

- **Add errors**  
  - Appends error data rows to the `errors` tab in Google Sheets.  

- **Sticky Note Errors**  
  - Explains error handling strategy and destination of logs.  

---

#### 2.6 Data Output Block

**Overview:**  
Finalizes workflow execution by writing all parsed annotation data (from both video and image branches) into the main Google Sheet for consolidated reporting.

**Nodes Involved:**  
- Add Segments data  
- Sticky Note Google Sheets

**Node Details:**  

- **Add Segments data** (used in both video and image branches)  
  - Google Sheets node appending structured insight rows with detailed fields including campaign_id, ad_id, creative_id, video_id, annotation_type, label/text, confidence, timestamps, and processing time.  
  - Requires OAuth2 credentials with write access to target spreadsheet.  
  - Edge cases: Permission errors, rate limits, spreadsheet schema mismatch.  

- **Sticky Note Google Sheets**  
  - Provides user instructions and reminders about Google Sheets integration.  

---

### 3. Summary Table

| Node Name               | Node Type                 | Functional Role                                  | Input Node(s)                   | Output Node(s)                      | Sticky Note                                                                                                  |
|-------------------------|---------------------------|-------------------------------------------------|--------------------------------|-----------------------------------|--------------------------------------------------------------------------------------------------------------|
| Run Daily at 9 AM       | Schedule Trigger          | Triggers workflow daily at 9 AM                  | None                           | Set Campaign ID                   |                                                                                                              |
| Set Campaign ID          | Set                       | Sets the Meta Ads Campaign ID parameter          | Run Daily at 9 AM              | Get Active Ads                   | **⚙️ 1. Configuration: Campaign ID** This is the main configuration node. Instructions on how to find ID.    |
| Get Active Ads           | Facebook Graph API        | Fetches active ads from campaign                  | Set Campaign ID                | Split Out                       |                                                                                                              |
| Split Out                | Split Out                 | Splits ads array into individual ad items        | Get Active Ads                 | Is it a Video?                  | **🔀 2. Branching Logic: Is it a Video or an Image?** Explains video vs image processing paths.                |
| Is it a Video?           | If                        | Checks if creative has a video_id                  | Split Out                     | Get Video Source URL (True)      | Has image_url? (False)                                                                                         |                                                                                                              |
| Get Video Source URL     | Facebook Graph API        | Retrieves direct video source URL                  | Is it a Video? (True)          | Download Video File              |                                                                                                              |
| Download Video File      | HTTP Request              | Downloads video binary from URL                     | Get Video Source URL           | Video to Base64 String           |                                                                                                              |
| Video to Base64 String   | Extract From File         | Converts video binary to Base64 string             | Download Video File            | Loop for videos                 |                                                                                                              |
| Loop for videos          | Split in Batches          | Processes video in batches                          | Video to Base64 String         | Start Video Annotation (main), (error branch) |                                                                                                              |
| Start Video Annotation   | HTTP Request              | Sends video to Google Video Intelligence API       | Loop for videos (batch)        | Wait 30s (success), Set (Video Error Row) (error) | **🎞️ 3. Video Analysis** Explains video processing steps.                                                   |
| Wait 30s                 | Wait                      | Waits 30 seconds before polling job status         | Start Video Annotation         | Check Operation Status          |                                                                                                              |
| Check Operation Status   | HTTP Request              | Polls Google API for video annotation completion   | Wait 30s                      | If Ready                       |                                                                                                              |
| If Ready                 | If                        | Checks if video annotation task is done            | Check Operation Status         | Wait 3s (not ready), Set id data for Video (ready) |                                                                                                              |
| Wait 3s                  | Wait                      | Short wait between polls                            | If Ready                      | Loop for videos                |                                                                                                              |
| Set id data for Video    | Set                       | Sets metadata fields for video creative            | If Ready                      | Parse data                    |                                                                                                              |
| Parse data               | Code                      | Parses Google Video Intelligence response          | Set id data for Video          | Add Segments data             |                                                                                                              |
| Add Segments data        | Google Sheets             | Appends parsed annotation data to main sheet       | Parse data, Parse data from images | None                       | **💾 6. Write to Google Sheets** Instructions on setup and connection.                                     |
| Has image_url?           | If                        | Checks existence of image_url in creative          | Is it a Video? (False)         | Download Image File (true), Set (Error Row) (false) | **⚠️ 5. Error Handling** Explains error logging strategy.                                                   |
| Download Image File      | HTTP Request              | Downloads image binary from image_url               | Has image_url? (true)           | Image to Base64 String          |                                                                                                              |
| Image to Base64 String   | Extract From File         | Converts image binary to Base64 string              | Download Image File            | Start Image Annotation          |                                                                                                              |
| Start Image Annotation   | HTTP Request              | Sends image to Google Vision API                     | Image to Base64 String         | Set id data for Static          | **🖼️ 4. Image Analysis** Explains image processing steps.                                                   |
| Set id data for Static   | Set                       | Sets metadata fields for image creative             | Start Image Annotation         | Parse data from images          |                                                                                                              |
| Parse data from images   | Code                      | Parses Google Vision API response                    | Set id data for Static         | Add Segments data               |                                                                                                              |
| Set (Error Row)          | Set                       | Constructs error row for missing image_url          | Has image_url? (false)          | Add errors                    |                                                                                                              |
| Set (Video Error Row)    | Set                       | Constructs error row for video annotation failure   | Start Video Annotation (error) | Add errors                    |                                                                                                              |
| Add errors               | Google Sheets             | Appends error rows to errors sheet                   | Set (Error Row), Set (Video Error Row) | None                       |                                                                                                              |
| Sticky Note Config       | Sticky Note               | Explains campaign ID configuration                   | None                          | None                         |                                                                                                              |
| Sticky Note Split        | Sticky Note               | Explains branching logic for video vs image          | None                          | None                         |                                                                                                              |
| Sticky Note Video        | Sticky Note               | Documents video processing branch                     | None                          | None                         |                                                                                                              |
| Sticky Note Image        | Sticky Note               | Documents image processing branch                     | None                          | None                         |                                                                                                              |
| Sticky Note Errors       | Sticky Note               | Documents error handling strategy                      | None                          | None                         |                                                                                                              |
| Sticky Note Google Sheets| Sticky Note               | Documents final write to Google Sheets                 | None                          | None                         |                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Name: "Run Daily at 9 AM"  
   - Configure to trigger daily at hour 9 (9:00 AM).

2. **Create a Set node**  
   - Name: "Set Campaign ID"  
   - Assign a string field `campaign_id` with your Meta Ads Campaign ID (e.g., "1234567890").  
   - Connect "Run Daily at 9 AM" → "Set Campaign ID".

3. **Create Facebook Graph API node**  
   - Name: "Get Active Ads"  
   - Credentials: Facebook Graph API with valid token.  
   - Node: Use `{{$json.campaign_id}}` as the node.  
   - Edge: "ads"  
   - Query parameters: fields = `id,name,creative{id,object_type,thumbnail_url,image_url,object_story_spec{video_data{video_id,image_url}}}`  
   - Connect "Set Campaign ID" → "Get Active Ads".

4. **Create Split Out node**  
   - Name: "Split Out"  
   - Field to split out: `data` (assuming ads come in data array).  
   - Connect "Get Active Ads" → "Split Out".

5. **Create If node**  
   - Name: "Is it a Video?"  
   - Condition: Check if `$json.data.creative.object_story_spec.video_data.video_id` exists.  
   - Connect "Split Out" → "Is it a Video?".

6. **Video Branch:**

   a. **Create Facebook Graph API node**  
      - Name: "Get Video Source URL"  
      - Use node = `{{$json.data.creative.object_story_spec.video_data.video_id}}`.  
      - Query parameters: fields = `permalink_url,created_time,id,source`.  
      - Connect "Is it a Video?" (True) → "Get Video Source URL".

   b. **Create HTTP Request node**  
      - Name: "Download Video File"  
      - URL: `{{$json.source}}` (from previous node).  
      - Method: GET.  
      - Connect "Get Video Source URL" → "Download Video File".

   c. **Create Extract From File node**  
      - Name: "Video to Base64 String"  
      - Operation: binary to property conversion (Base64).  
      - Connect "Download Video File" → "Video to Base64 String".

   d. **Create Split in Batches node**  
      - Name: "Loop for videos"  
      - Controls batch size for video processing.  
      - Connect "Video to Base64 String" → "Loop for videos".

   e. **Create HTTP Request node**  
      - Name: "Start Video Annotation"  
      - URL: `https://videointelligence.googleapis.com/v1/videos:annotate`  
      - Method: POST  
      - JSON body:  
        ```json
        {
          "inputContent": "{{ $json.data }}",
          "features": ["LABEL_DETECTION", "SPEECH_TRANSCRIPTION", "TEXT_DETECTION"],
          "locationId": "us-east1"
        }
        ```  
      - Authentication: Google API OAuth2 with Google Cloud Video Intelligence credentials.  
      - Connect "Loop for videos" → "Start Video Annotation".

   f. **Create Wait node**  
      - Name: "Wait 30s"  
      - Amount: 30 seconds.  
      - Connect "Start Video Annotation" (success) → "Wait 30s".

   g. **Create HTTP Request node**  
      - Name: "Check Operation Status"  
      - URL: `https://videointelligence.googleapis.com/v1/{{ $('Start Video Annotation').item.json.name }}`  
      - Method: GET  
      - Authentication: Google API OAuth2.  
      - Connect "Wait 30s" → "Check Operation Status".

   h. **Create If node**  
      - Name: "If Ready"  
      - Condition: Check if `$json.done` is true.  
      - Connect "Check Operation Status" → "If Ready".

   i. **Connect If Ready branches:**  
      - True → "Set id data for Video" node  
      - False → "Wait 3s" node

   j. **Create Wait node**  
      - Name: "Wait 3s"  
      - Amount: 3 seconds.  
      - Connect "Wait 3s" → "Loop for videos" (retry polling).

   k. **Create Set node**  
      - Name: "Set id data for Video"  
      - Assign metadata fields: `campaign_id`, `ad_id`, `creative_id`, `video_id`, `file_name`, `image_url`, `source` from relevant nodes.  
      - Connect "If Ready" (True) → "Set id data for Video".

   l. **Create Code node**  
      - Name: "Parse data"  
      - JavaScript code parses Google Video Intelligence response into rows with fields for spreadsheet.  
      - Connect "Set id data for Video" → "Parse data".

   m. **Create Google Sheets node**  
      - Name: "Add Segments data"  
      - Operation: Append rows to main sheet.  
      - Configure columns with all metadata and parsed fields.  
      - Credential: Google Sheets OAuth2 with write access.  
      - Connect "Parse data" → "Add Segments data".

   n. **Error branch from "Start Video Annotation"**  
      - Create Set node "Set (Video Error Row)" with error info fields.  
      - Connect error output → "Set (Video Error Row)".  
      - Connect "Set (Video Error Row)" → "Add errors" Google Sheets node to log errors.

7. **Image Branch:**

   a. **Create If node**  
      - Name: "Has image_url?"  
      - Condition: Check if `$json.data.creative.image_url` exists.  
      - Connect "Is it a Video?" (False) → "Has image_url?"

   b. **On True branch:**  
      i. **Create HTTP Request node**  
         - Name: "Download Image File"  
         - URL: `{{$json.data.creative.image_url}}`  
         - Connect "Has image_url?" (True) → "Download Image File"  

      ii. **Create Extract From File node**  
          - Name: "Image to Base64 String"  
          - Operation: binary to property (Base64).  
          - Connect "Download Image File" → "Image to Base64 String".

      iii. **Create HTTP Request node**  
           - Name: "Start Image Annotation"  
           - URL: `https://vision.googleapis.com/v1/images:annotate`  
           - Method: POST  
           - JSON body includes multiple features (label detection, text detection, logo detection, landmark detection, object localization, web detection, safe search).  
           - Authentication: Google API OAuth2 for Vision API.  
           - Connect "Image to Base64 String" → "Start Image Annotation".

      iv. **Create Set node**  
          - Name: "Set id data for Static"  
          - Assign metadata fields similar to video branch but for image creative.  
          - Connect "Start Image Annotation" → "Set id data for Static".

      v. **Create Code node**  
         - Name: "Parse data from images"  
         - Parses Google Vision API JSON response into structured rows.  
         - Connect "Set id data for Static" → "Parse data from images".

      vi. **Connect to "Add Segments data" Google Sheets node**  
          - Connect "Parse data from images" → "Add Segments data".

   c. **On False branch:**  
      - Create Set node "Set (Error Row)" with error info for missing image URL.  
      - Connect "Has image_url?" (False) → "Set (Error Row)" → "Add errors".

8. **Add Sticky Notes at relevant points** to document configuration steps, branching logic, video analysis, image analysis, error handling, and Google Sheets integration.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                           | Context or Link                                                                                                   |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| **⚙️ 1. Configuration: Campaign ID** Instructions on how to find the Meta Ads Campaign ID in Facebook Ads Manager address bar.                                                                                                                                                                                        | Sticky Note near "Set Campaign ID" node.                                                                         |
| **🔀 2. Branching Logic: Is it a Video or an Image?** Explains that creatives with video_id go through video analysis branch, others through image analysis branch.                                                                                                                                                  | Sticky Note near "Is it a Video?" node.                                                                           |
| **🎞️ 3. Video Analysis** Describes video processing steps including download, Base64 conversion, Google Video Intelligence API call, polling, and parsing.                                                                                                                                                            | Sticky Note near video processing nodes.                                                                          |
| **🖼️ 4. Image Analysis** Describes image processing steps including download, Base64 conversion, Google Vision API call, and parsing.                                                                                                                                                                                | Sticky Note near image processing nodes.                                                                          |
| **⚠️ 5. Error Handling** Explains error cases like missing image_url or video annotation failures and logging errors to a Google Sheets tab to prevent data loss and facilitate troubleshooting.                                                                                                                     | Sticky Note near error handling nodes.                                                                             |
| **💾 6. Write to Google Sheets** Reminds users to configure Google Sheets node with correct spreadsheet and tab, and to ensure OAuth credentials have write access.                                                                                                                                                   | Sticky Note near the final Google Sheets node "Add Segments data".                                                |
| Facebook Graph API documentation and version compatibility: https://developers.facebook.com/docs/graph-api/versions/                                                                                                                                                                                                   | Relevant for Facebook Graph API nodes.                                                                             |
| Google Cloud Video Intelligence API docs: https://cloud.google.com/video-intelligence/docs/                                                                                                                                                                                                                            | Relevant for video annotation nodes.                                                                               |
| Google Cloud Vision API docs: https://cloud.google.com/vision/docs/                                                                                                                                                                                                                                                    | Relevant for image annotation nodes.                                                                               |
| Google Sheets API docs: https://developers.google.com/sheets/api/quickstart/js                                                                                                                                                                                                                                         | Relevant for Google Sheets integration nodes.                                                                      |

---

This comprehensive analysis and stepwise reconstruction guide enable advanced users and automation agents to understand, reproduce, and extend the Meta Ads creative analysis workflow efficiently and reliably.