AI-Powered Meta Ads Analysis & Creation with Gemini, GPT-4.1 Mini & Ads Manager

https://n8nworkflows.xyz/workflows/ai-powered-meta-ads-analysis---creation-with-gemini--gpt-4-1-mini---ads-manager-4684


# AI-Powered Meta Ads Analysis & Creation with Gemini, GPT-4.1 Mini & Ads Manager

### 1. Workflow Overview

This workflow automates the end-to-end processing of Meta (Facebook) Ads assets by leveraging AI and Meta Ads Manager APIs. It is designed to:

- Analyze video and image ad content using Google Gemini and OpenAI GPT-4.1 Mini models.
- Generate or enrich ad text descriptions using AI agents.
- Upload video and image assets to Meta Ads Manager, creating corresponding ad creatives and ads.
- Store analysis output and ad details in Google Sheets for tracking and further use.
- Manage files and triggers via Google Drive integration.

The workflow logically divides into the following functional blocks:

- **1.1 Google Drive Integration & Asset Retrieval**: Triggers on folder changes, fetches files metadata and content.
- **1.2 AI Analysis & Description Generation**: Processes video/image files through Gemini and OpenAI models, parsing outputs.
- **1.3 Asset Upload to Meta Ads Manager**: Uploads videos and images, creates ad creatives and ads.
- **1.4 Ad Data Management**: Reads and writes ad data and AI-generated descriptions to Google Sheets.
- **1.5 Control & Decision Logic**: Uses switches, filters, waits, and conditions to manage workflow execution flow and timing.

---

### 2. Block-by-Block Analysis

#### 2.1 Google Drive Integration & Asset Retrieval

- **Overview:**  
  This block listens for updates in a Google Drive folder, fetches all relevant files, and retrieves their metadata and contents to prepare for AI analysis and upload.

- **Nodes Involved:**  
  Google Drive Folder Updated, Fetch All Files, Get Files Metadata, Extract File Specs, Download from Google Drive

- **Node Details:**

  - **Google Drive Folder Updated**  
    - Type: Trigger  
    - Role: Watches a specific Google Drive folder for any new or updated files to trigger downstream processing.  
    - Input/Output: No input; outputs file list metadata.  
    - Edge Cases: Missing folder permissions, trigger latency.

  - **Fetch All Files**  
    - Type: Google Drive  
    - Role: Retrieves all files in the triggered folder for processing.  
    - Key Config: Folder ID specified, retrieves file list.  
    - Edge Cases: Large folder causing pagination; API limits.

  - **Get Files Metadata**  
    - Type: HTTP Request  
    - Role: Retrieves detailed metadata for each file fetched from Google Drive.  
    - Configuration: Uses Google Drive API endpoints.  
    - Edge Cases: API rate limits, invalid file IDs.

  - **Extract File Specs**  
    - Type: Set Node  
    - Role: Parses and sets key file properties (e.g., type, size) for downstream logic.  
    - Key Expressions: Extracts MIME type, file name, etc.  
    - Output: Structured metadata for each file.

  - **Download from Google Drive**  
    - Type: Google Drive  
    - Role: Downloads actual file content (video/image) for upload and AI processing.  
    - Edge Cases: Large file size causing timeouts; permission errors.

---

#### 2.2 AI Analysis & Description Generation

- **Overview:**  
  Files are analyzed via Google Gemini for video content and OpenAI GPT-4.1 Mini for generating or validating ad text descriptions. Outputs are parsed and stored.

- **Nodes Involved:**  
  Gemini - Generate Upload URL, Gemini - Upload File, Check State, If, Analyze Video with Gemini, AI Agent, OpenAI Chat Model, Structured Output Parser (and their equivalents for images), AI Agent1, OpenAI Chat Model1, Structured Output Parser1

- **Node Details:**

  - **Gemini - Generate Upload URL**  
    - Type: HTTP Request  
    - Role: Obtains a pre-signed URL for uploading video assets to Gemini AI for analysis.  
    - Edge Cases: URL expiration, auth failures.

  - **Gemini - Upload File**  
    - Type: HTTP Request  
    - Role: Uploads video content to Gemini using the generated URL.  
    - Edge Cases: Upload failures, network interruptions.

  - **Check State**  
    - Type: HTTP Request  
    - Role: Polls Gemini to check processing status of the uploaded video.  
    - Logic: Loops with Wait nodes until complete or error state.

  - **If**  
    - Type: Conditional  
    - Role: Branches workflow based on the processing status (complete or pending).

  - **Analyze Video with Gemini**  
    - Type: HTTP Request  
    - Role: Initiates video analysis request to Gemini.

  - **AI Agent**  
    - Type: LangChain Agent  
    - Role: Uses GPT-4.1 Mini to generate or refine ad descriptions based on Gemini analysis output.  
    - Key Expressions: Input from Gemini output, uses structured output parser.

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat  
    - Role: Chat-based language model for natural language generation.

  - **Structured Output Parser**  
    - Type: LangChain Output Parser  
    - Role: Parses AI output into structured JSON for downstream use.

  - **AI Agent1, OpenAI Chat Model1, Structured Output Parser1**  
    - Role: Similar to above but tailored for image assets.

  - **Wait 2 Seconds / Wait 3 Seconds**  
    - Type: Wait  
    - Role: Implements polling delays between Gemini status checks.

---

#### 2.3 Asset Upload to Meta Ads Manager

- **Overview:**  
  This block uploads analyzed video and image files to Meta Ads Manager, creates ad creatives, and generates ads with the AI-generated descriptions.

- **Nodes Involved:**  
  Upload Ad Video, Get Video Preview Image, Create Video Ad Creative, Create Video Ad, Save Video Ad Details, Upload Ad Image, Upload Second Ad Image, Check if two or one image, Create Multiple Image Creative, Create Image Creative, Create Image Ad, Save Image Ad Details, Facebook Graph API, Video or Image, Video or Image Asset

- **Node Details:**

  - **Upload Ad Video**  
    - Type: Facebook Graph API  
    - Role: Uploads video asset to Meta Ads Manager.  
    - Edge Cases: Upload failures, API limits.

  - **Get Video Preview Image**  
    - Type: Facebook Graph API  
    - Role: Retrieves thumbnail/preview image for the uploaded video.

  - **Create Video Ad Creative**  
    - Type: Facebook Graph API  
    - Role: Creates a video ad creative object using uploaded video and AI-generated text.

  - **Create Video Ad**  
    - Type: Facebook Graph API  
    - Role: Creates the actual video ad entity in the Meta Ads Manager.

  - **Save Video Ad Details**  
    - Type: Google Sheets  
    - Role: Stores video ad IDs and metadata in Google Sheets.

  - **Upload Ad Image / Upload Second Ad Image**  
    - Type: Facebook Graph API  
    - Role: Uploads single or multiple image assets for image ads.

  - **Check if two or one image**  
    - Type: If Node  
    - Role: Checks whether the ad uses one or multiple images to branch accordingly.

  - **Create Multiple Image Creative / Create Image Creative**  
    - Type: Facebook Graph API  
    - Role: Creates single or multiple image ad creatives.

  - **Create Image Ad**  
    - Type: Facebook Graph API  
    - Role: Creates image ads on Meta Ads Manager.

  - **Save Image Ad Details**  
    - Type: Google Sheets  
    - Role: Logs image ad creation details.

  - **Facebook Graph API (generic node)**  
    - Used for various ad management API calls.

  - **Video or Image, Video or Image Asset**  
    - Type: Switch Nodes  
    - Role: Routes workflow based on asset type (video or image).

---

#### 2.4 Ad Data Management

- **Overview:**  
  This block manages ad data rows in Google Sheets, filters unprocessed ads, and coordinates settings retrieval.

- **Nodes Involved:**  
  Get Ads to Process, Filter Unprocessed Ads, Merge, Get Settings, Create Asset, Get All Rows, AI Description is Empty, Get File Metadata

- **Node Details:**

  - **Get Ads to Process**  
    - Type: Google Sheets  
    - Role: Retrieves all ads awaiting processing.

  - **Filter Unprocessed Ads**  
    - Type: Filter  
    - Role: Filters ads that have not yet been processed or enriched.

  - **Merge**  
    - Type: Merge  
    - Role: Combines datasets such as ads and settings for unified processing.

  - **Get Settings**  
    - Type: Google Sheets  
    - Role: Retrieves workflow configuration or parameters.

  - **Create Asset**  
    - Type: Google Sheets  
    - Role: Logs new asset information after processing.

  - **Get All Rows**  
    - Type: Google Sheets  
    - Role: Reads all rows for AI description checks.

  - **AI Description is Empty**  
    - Type: Filter  
    - Role: Filters rows missing AI-generated descriptions for further processing.

  - **Get File Metadata**  
    - Type: HTTP Request  
    - Role: Retrieves metadata needed for AI or upload steps.

---

#### 2.5 Control & Decision Logic

- **Overview:**  
  This block manages execution flow, timing, and conditional branching to ensure correct sequence and handle asynchronous processing.

- **Nodes Involved:**  
  If, Wait, Wait 2 Seconds, Wait 3 Seconds, Check State, Video or Image, Video or Image Asset, Check if two or one image

- **Node Details:**

  - **If**  
    - Type: Conditional  
    - Role: Branches the workflow based on dynamic conditions like API response status.

  - **Wait / Wait 2 Seconds / Wait 3 Seconds**  
    - Type: Wait  
    - Role: Introduces delays, e.g., between polling attempts or API rate limiting.

  - **Check State**  
    - Type: HTTP Request  
    - Role: Polls external services for processing status.

  - **Video or Image / Video or Image Asset**  
    - Type: Switch Nodes  
    - Role: Routes processing based on asset media type.

  - **Check if two or one image**  
    - Type: If Node  
    - Role: Differentiates processing paths for single vs multiple image ads.

---

### 3. Summary Table

| Node Name                   | Node Type                           | Functional Role                                  | Input Node(s)                          | Output Node(s)                             | Sticky Note                                |
|-----------------------------|-----------------------------------|-------------------------------------------------|--------------------------------------|--------------------------------------------|--------------------------------------------|
| Google Drive Folder Updated  | Google Drive Trigger               | Triggers on Google Drive folder update          | None                                 | Fetch All Files                            |                                            |
| Fetch All Files             | Google Drive                      | Retrieves files list                             | Google Drive Folder Updated           | Get Files Metadata                         |                                            |
| Get Files Metadata          | HTTP Request                     | Gets detailed metadata for files                 | Fetch All Files                      | Extract File Specs                        |                                            |
| Extract File Specs          | Set                              | Parses file metadata                              | Get Files Metadata                   | Create Asset                              |                                            |
| Create Asset                | Google Sheets                    | Records new asset info                            | Extract File Specs                   | Get All Rows                              |                                            |
| Get All Rows                | Google Sheets                    | Reads all ads data rows                           | Create Asset                        | AI Description is Empty                   |                                            |
| AI Description is Empty     | Filter                           | Filters ads missing descriptions                  | Get All Rows                       | Get File Metadata                         |                                            |
| Get File Metadata           | HTTP Request                     | Retrieves metadata for files                      | AI Description is Empty             | Video or Image                            |                                            |
| Video or Image              | Switch                          | Routes based on video or image type               | Get File Metadata                  | Gemini - Generate Upload URL, Google Drive |                                            |
| Gemini - Generate Upload URL| HTTP Request                    | Gets upload URL for video analysis                | Video or Image                      | Download from Google Drive                |                                            |
| Download from Google Drive  | Google Drive                    | Downloads video/image file                         | Gemini - Generate Upload URL         | Gemini - Upload File                      |                                            |
| Gemini - Upload File        | HTTP Request                    | Uploads video file to Gemini                       | Download from Google Drive           | Wait 3 Seconds                           |                                            |
| Wait 3 Seconds              | Wait                            | Delay for processing status                        | Gemini - Upload File                 | Check State                              |                                            |
| Check State                 | HTTP Request                    | Polls Gemini processing status                     | Wait 3 Seconds                     | If                                       |                                            |
| If                         | If                              | Branches based on processing status               | Check State                        | Analyze Video with Gemini, Wait 2 Seconds |                                            |
| Wait 2 Seconds              | Wait                            | Delay before rechecking status                     | If                                 | Check State                              |                                            |
| Analyze Video with Gemini   | HTTP Request                    | Requests video analysis                            | If (processing complete branch)     | AI Agent                                |                                            |
| AI Agent                   | LangChain Agent                 | Generates/refines AI video ad description          | Analyze Video with Gemini           | Save Video Analysis Output                |                                            |
| Save Video Analysis Output  | Google Sheets                  | Logs video analysis results                         | AI Agent                          | None                                    |                                            |
| Google Drive               | Google Drive                   | Retrieves files for image processing                | Video or Image (image branch)        | AI Agent1                               |                                            |
| AI Agent1                  | LangChain Agent                | Generates/refines AI image ad description           | Google Drive                      | Save Image Analysis Output                |                                            |
| Save Image Analysis Output  | Google Sheets                  | Logs image analysis results                         | AI Agent1                         | None                                    |                                            |
| Upload Ad Video            | Facebook Graph API             | Uploads video to Meta Ads Manager                   | Get Video                        | Wait                                     |                                            |
| Get Video                  | HTTP Request                  | Retrieves video content                             | Video or Image Asset              | Upload Ad Video                          |                                            |
| Wait                      | Wait                          | Delay after video upload                            | Upload Ad Video                   | Get Video Preview Image                   |                                            |
| Get Video Preview Image     | Facebook Graph API             | Gets video thumbnail                                | Wait                             | Create Video Ad Creative                  |                                            |
| Create Video Ad Creative    | Facebook Graph API             | Creates video ad creative                           | Get Video Preview Image           | Create Video Ad                          |                                            |
| Create Video Ad             | Facebook Graph API             | Creates video ad                                   | Create Video Ad Creative          | Save Video Ad Details                     |                                            |
| Save Video Ad Details       | Google Sheets                  | Stores video ad info                               | Create Video Ad                  | None                                    |                                            |
| Upload Ad Image            | Facebook Graph API             | Uploads first ad image                             | Get image 1                      | Check if two or one image                 |                                            |
| Get image 1                | HTTP Request                  | Retrieves first image                              | Video or Image Asset              | Upload Ad Image                          |                                            |
| Check if two or one image   | If                            | Checks if ad has one or two images                 | Upload Ad Image                  | Get image (second image) or Create Image Creative |                                            |
| Get image                  | HTTP Request                  | Retrieves second image                             | Check if two or one image (true branch) | Upload Second Ad Image              |                                            |
| Upload Second Ad Image      | Facebook Graph API             | Uploads second ad image                            | Get image                       | Create Multiple Image Creative            |                                            |
| Create Multiple Image Creative | Facebook Graph API         | Creates multi-image ad creative                     | Upload Second Ad Image           | Create Image Ad                          |                                            |
| Create Image Creative       | Facebook Graph API             | Creates single-image ad creative                     | Check if two or one image (false branch) | Create Image Ad                     |                                            |
| Create Image Ad             | Facebook Graph API             | Creates image ad                                  | Create Image Creative, Create Multiple Image Creative | Facebook Graph API           |                                            |
| Facebook Graph API          | Facebook Graph API             | Executes various Meta Ads API calls                 | Create Image Ad                 | Save Image Ad Details                     |                                            |
| Save Image Ad Details       | Google Sheets                  | Stores image ad info                               | Facebook Graph API              | None                                    |                                            |
| Get Ads to Process          | Google Sheets                  | Reads ads requiring processing                      | When clicking ‘Test workflow’    | Filter Unprocessed Ads                    |                                            |
| Filter Unprocessed Ads      | Filter                         | Filters ads that need processing                    | Get Ads to Process              | Merge                                    |                                            |
| Merge                      | Merge                          | Combines ads and settings data                      | Filter Unprocessed Ads, Get Settings | Video or Image Asset                   |                                            |
| Get Settings               | Google Sheets                  | Retrieves workflow settings                          | When clicking ‘Test workflow’    | Merge                                    |                                            |
| When clicking ‘Test workflow’ | Manual Trigger              | Manual start point for testing                       | None                           | Get Ads to Process, Get Settings          |                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node** named "When clicking ‘Test workflow’" to start the workflow manually during testing.

2. **Add Google Sheets Node "Get Ads to Process"** to retrieve all pending ads to process. Configure with the appropriate spreadsheet and sheet containing ads data.

3. **Add Google Sheets Node "Get Settings"** to retrieve workflow settings or parameters.

4. **Add Merge Node** to combine outputs from "Get Ads to Process" and "Get Settings".

5. **Add Filter Node "Filter Unprocessed Ads"** to select ads without AI descriptions.

6. **Add Google Sheets Node "Get All Rows"** to retrieve all rows for description checks.

7. **Add Filter Node "AI Description is Empty"** to filter rows missing AI descriptions.

8. **Add HTTP Request Node "Get File Metadata"** to get metadata for files to process (videos/images).

9. **Add Switch Node "Video or Image"** to branch processing based on asset type (video or image).

10. **For Video Branch**:

    - Add HTTP Request Node "Gemini - Generate Upload URL" to get upload URL from Gemini AI.

    - Add Google Drive Node "Download from Google Drive" to download video file content.

    - Add HTTP Request Node "Gemini - Upload File" to upload the video to Gemini AI.

    - Add Wait Node "Wait 3 Seconds" to delay for processing.

    - Add HTTP Request Node "Check State" to poll Gemini for analysis status.

    - Add If Node "If" to check if analysis is complete.

    - If complete, add HTTP Request Node "Analyze Video with Gemini" to fetch analysis.

    - Add LangChain Agent Node "AI Agent" with OpenAI GPT-4.1 Mini to generate/refine ad description.

    - Add Google Sheets Node "Save Video Analysis Output" to log AI results.

11. **For Image Branch**:

    - Add Google Drive Node "Google Drive" to download image files.

    - Add LangChain Agent Node "AI Agent1" with OpenAI GPT-4.1 Mini for image ad text generation.

    - Add Google Sheets Node "Save Image Analysis Output" to log AI results.

12. **Add Switch Node "Video or Image Asset"** to route based on asset type for upload.

13. **For Video Upload**:

    - Add HTTP Request Node "Get Video" to retrieve video content.

    - Add Facebook Graph API Node "Upload Ad Video" to upload video to Meta Ads Manager.

    - Add Wait Node "Wait" for upload stabilization.

    - Add Facebook Graph API Node "Get Video Preview Image" to get thumbnail.

    - Add Facebook Graph API Node "Create Video Ad Creative" to create video ad creative with AI text.

    - Add Facebook Graph API Node "Create Video Ad" to create the actual video ad.

    - Add Google Sheets Node "Save Video Ad Details" to log ad creation info.

14. **For Image Upload**:

    - Add HTTP Request Node "Get image 1" to retrieve first image.

    - Add Facebook Graph API Node "Upload Ad Image" to upload first image.

    - Add If Node "Check if two or one image" to check for multiple images.

    - If two images:

      - Add HTTP Request Node "Get image" to retrieve second image.

      - Add Facebook Graph API Node "Upload Second Ad Image" to upload second image.

      - Add Facebook Graph API Node "Create Multiple Image Creative" to create multi-image ad creative.

    - If one image:

      - Add Facebook Graph API Node "Create Image Creative" to create single-image ad creative.

    - Add Facebook Graph API Node "Create Image Ad" to create the image ad.

    - Add Google Sheets Node "Save Image Ad Details" to log ad creation info.

15. **Add Wait Nodes ("Wait 2 Seconds" and "Wait 3 Seconds")** as needed between polling or upload steps to avoid rate limits.

16. **Configure all Google Drive, Google Sheets, Facebook Graph API, and OpenAI credentials** with OAuth2 or API keys as appropriate:

    - Google Drive & Sheets: OAuth2 credentials with read/write access.

    - Facebook Graph API: OAuth2 or access token with ads management permissions.

    - OpenAI: API key for GPT-4.1 Mini model.

    - Gemini AI: API keys or tokens for HTTP requests.

17. **Set expressions and parameters according to your asset locations, ad account IDs, campaign IDs, and other Meta Ads Manager requirements.**

18. **Test each block independently** and then the entire flow end-to-end to ensure correct data flow and error handling.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                   |
|-------------------------------------------------------------------------------------------------|--------------------------------------------------|
| Workflow integrates Google Gemini AI for video analysis and OpenAI GPT-4.1 Mini for text generation. | AI models integration details                      |
| Uses Facebook Graph API for Meta Ads Manager interactions including asset uploads and ad creation. | Meta Ads Manager API documentation                 |
| Google Drive folder trigger enables real-time processing of uploaded assets.                    | Google Drive API and n8n Google Drive node docs   |
| Google Sheets used extensively for logging and configuration management.                        | Google Sheets API and n8n Google Sheets node docs |
| Workflow includes wait/polling loops to handle asynchronous AI processing latency.              | n8n Wait node and control flow best practices     |
| LangChain nodes used for advanced AI language model integration.                                | LangChain in n8n documentation                     |

---

This document covers all nodes, their roles, connections, and configuration insights to fully understand, reproduce, and maintain the workflow.