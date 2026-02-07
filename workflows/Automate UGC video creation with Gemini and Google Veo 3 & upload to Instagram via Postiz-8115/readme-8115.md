Automate UGC video creation with Gemini and Google Veo 3 & upload to Instagram via Postiz

https://n8nworkflows.xyz/workflows/automate-ugc-video-creation-with-gemini-and-google-veo-3---upload-to-instagram-via-postiz-8115


# Automate UGC video creation with Gemini and Google Veo 3 & upload to Instagram via Postiz

### 1. Workflow Overview

This workflow automates the creation and publishing of User-Generated Content (UGC) videos using AI-powered video generation and social media scheduling tools. It leverages Google Gemini models for image analysis, creative video prompt generation, video creation (via Google Veo 3), and social media copywriting. The generated video content is uploaded to Google Drive and then published to Instagram via the Postiz platform. The workflow includes logical blocks for:

- **1.1 Input Initialization**: Manual trigger and setting the input image URL.
- **1.2 Image Analysis and Creative Brief Generation**: Using Google Gemini to analyze the image and generate a creative video prompt.
- **1.3 Video Generation and Social Copy Creation**: Producing the UGC video and preparing the Instagram caption.
- **1.4 Upload and Scheduling**: Uploading the video to Google Drive and Postiz, then scheduling the Instagram post.
- **1.5 Merging Outputs and Final Posting**: Combining outputs from video upload and caption setting to finalize the Instagram post scheduling.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Initialization

- **Overview:** This block starts the workflow manually and provides a hardcoded image URL to be used in the downstream processing.
- **Nodes Involved:** When clicking ‘Execute workflow’, Set image
- **Node Details:**

  - **When clicking ‘Execute workflow’**
    - Type: Manual Trigger
    - Role: Entry point to manually start the workflow.
    - Configuration: Default, no parameters.
    - Input: None
    - Output: Triggers the next node “Set image.”
    - Edge cases: None significant; requires manual execution.

  - **Set image**
    - Type: Set Node
    - Role: Assigns a fixed image URL to a variable `image_url`.
    - Configuration: Sets `image_url` to `https://n3wstorage.b-cdn.net/n3witalia/image_ugc.png` (replaceable by user).
    - Input: Trigger from manual node.
    - Output: Provides `image_url` for image analysis.
    - Edge cases: Ensure the URL is accessible and points to a valid image to avoid downstream analysis failures.

---

#### 2.2 Image Analysis and Creative Brief Generation

- **Overview:** Analyzes the input image using Google Gemini to extract descriptive content, then generates a creative director prompt describing an 8-second advertising video scene based on that description.
- **Nodes Involved:** Analyze image, Creative director
- **Node Details:**

  - **Analyze image**
    - Type: Google Gemini (Langchain) node configured for image analysis
    - Role: Extracts descriptive analysis of the image at `image_url`.
    - Configuration:
      - Model: `models/gemini-2.5-pro`
      - Resource: `image`
      - Operation: `analyze`
      - Input: Expression `={{ $json.image_url }}` to fetch the image URL from “Set image”
    - Input: Receives `image_url`
    - Output: Produces JSON content describing the image.
    - Credentials: Google Gemini API credentials required.
    - Edge cases: API authentication failures, image URL invalidity, API rate limits.

  - **Creative director**
    - Type: Google Gemini (Langchain) node for text generation
    - Role: Generates a detailed prompt describing a visual scene for an 8-second commercial spot based on the image description.
    - Configuration:
      - Model: `models/gemini-2.5-pro`
      - System Message: Instructions for creating a visual scene prompt focusing on setting, people, actions.
      - Message Content: Uses image description extracted from the previous node.
    - Input: Receives analyzed image description JSON.
    - Output: Text prompt describing the video scene.
    - Credentials: Google Gemini API.
    - Edge cases: Text generation failures, malformed input, API authentication failures.

---

#### 2.3 Video Generation and Social Copy Creation

- **Overview:** This block generates the UGC video using Google Veo 3 and concurrently produces a social media caption for Instagram using Google Gemini.
- **Nodes Involved:** Generate UGC Video, Social Media Manager, Set caption
- **Node Details:**

  - **Generate UGC Video**
    - Type: Google Gemini (Langchain) node configured for video generation.
    - Role: Creates a UGC video preview based on the creative director prompt and product image URL.
    - Configuration:
      - Model: `models/veo-3.0-generate-preview`
      - Resource: `video`
      - Prompt: Combines the text from `Creative director` node output with the product image URL from “Set image”
      - Options: Aspect ratio set to 16:9.
    - Input: Receives creative video prompt and image URL.
    - Output: Video file data and metadata.
    - Credentials: Google Gemini API (Eure environment).
    - Edge cases: Video generation timeout, API failures, incorrect prompt formation.

  - **Social Media Manager**
    - Type: Google Gemini (Langchain) node for text generation.
    - Role: Writes compelling Instagram copy based on the creative director’s scene description.
    - Configuration:
      - Model: `models/gemini-2.5-pro`
      - System Message: Social media manager instructions to generate Instagram ad copy without preamble.
      - Message Content: Scene description text from “Creative director.”
    - Input: Receives scene description.
    - Output: Instagram caption text.
    - Credentials: Google Gemini API.
    - Edge cases: Text generation failure, malformed input, API limits.

  - **Set caption**
    - Type: Set Node
    - Role: Assigns the generated social media caption text to a variable `caption`.
    - Configuration: Sets `caption` to the text output of “Social Media Manager.”
    - Input: Receives generated caption.
    - Output: Provides caption for final merge.
    - Edge cases: None significant.

---

#### 2.4 Upload and Scheduling

- **Overview:** Uploads the generated video to Google Drive and Postiz, then prepares the Instagram post scheduling.
- **Nodes Involved:** Upload video, Upload Video to Postiz, Merge, Instagram
- **Node Details:**

  - **Upload video**
    - Type: Google Drive node
    - Role: Uploads the generated video file to a specific Google Drive folder.
    - Configuration:
      - File name formatted with current date and original file name.
      - Drive: “My Drive”
      - Folder ID: Specific Google Drive folder for video ads.
    - Input: Receives video file from “Generate UGC Video.”
    - Output: Metadata about uploaded video file.
    - Credentials: Google Drive OAuth2 credentials.
    - Edge cases: Upload failures, permission errors, quota limits.

  - **Upload Video to Postiz**
    - Type: HTTP Request node
    - Role: Uploads the video file to Postiz platform for Instagram posting.
    - Configuration:
      - URL: `https://api.postiz.com/public/v1/upload`
      - Method: POST
      - Content-Type: multipart form-data
      - Body Parameter: passes video file binary data.
      - Authentication: Header Auth with stored Postiz credentials.
    - Input: Receives video file binary data from “Generate UGC Video.”
    - Output: Postiz upload response JSON.
    - Credentials: Postiz API key.
    - Edge cases: HTTP failures, auth errors, file size limits.

  - **Merge**
    - Type: Merge node
    - Role: Combines outputs from “Upload Video to Postiz” and “Set caption” for final Instagram post.
    - Configuration: Mode “combine” to merge all inputs.
    - Inputs: Receives merged video upload data and caption text.
    - Output: Combined JSON for Instagram node.
    - Edge cases: Data mismatch, missing inputs.

  - **Instagram**
    - Type: Postiz node for Instagram scheduling
    - Role: Schedules an Instagram post with the uploaded video and caption.
    - Configuration:
      - Date/time set to current time.
      - Post type: “post”
      - Uses combined data from “Merge” node.
      - Channel ID (integrationId) must be configured by user.
      - Enables short link generation.
    - Input: Combined data from “Merge.”
    - Output: Confirmation of scheduled post.
    - Credentials: Postiz API credentials.
    - Edge cases: Scheduling failures, invalid channel ID, API errors.

---

#### 2.5 Sticky Notes

- **Sticky Note**
  - Content: Overview describing the workflow purpose, usage of Google Gemini and Google Veo 3, and Postiz for Instagram upload.
  - Positioned to provide general context.

- **Sticky Note1**
  - Content: Step instructions for user setup:
    - Replace default image URL in “Set image.”
    - Create Postiz account.
    - Install Postiz node.
    - Configure HTTP Header Auth in “Upload Video to Postiz.”
    - Set Channel ID in “Instagram” node.
    - Execute the workflow.
  - Positioned near the start nodes for user guidance.

---

### 3. Summary Table

| Node Name                    | Node Type                          | Functional Role                               | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                                                      |
|------------------------------|----------------------------------|-----------------------------------------------|-------------------------------|-------------------------------|------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                   | Starts the workflow manually                    | None                          | Set image                     | Step instructions for setup (Sticky Note1)                                                    |
| Set image                    | Set                              | Sets the input image URL                        | When clicking ‘Execute workflow’ | Analyze image                | Step instructions for setup (Sticky Note1)                                                    |
| Analyze image               | Google Gemini (image analysis)    | Analyzes image to extract description          | Set image                     | Creative director             |                                                                                                |
| Creative director           | Google Gemini (text generation)   | Creates creative video prompt from image desc | Analyze image                 | Generate UGC Video, Social Media Manager |                                                                                                |
| Generate UGC Video          | Google Gemini (video generation)  | Produces UGC video preview                       | Creative director             | Upload video, Upload Video to Postiz |                                                                                                |
| Social Media Manager        | Google Gemini (text generation)   | Creates Instagram caption from video prompt    | Creative director             | Set caption                  |                                                                                                |
| Set caption                | Set                              | Assigns generated Instagram caption             | Social Media Manager          | Merge                        |                                                                                                |
| Upload video               | Google Drive                     | Uploads video file to Google Drive              | Generate UGC Video            | Merge                        |                                                                                                |
| Upload Video to Postiz      | HTTP Request                    | Uploads video file to Postiz for Instagram      | Generate UGC Video            | Merge                        | Setup requires HTTP Header Auth with Postiz credentials (Sticky Note1)                         |
| Merge                      | Merge                            | Combines video upload results and caption       | Upload Video to Postiz, Set caption | Instagram                   |                                                                                                |
| Instagram                  | Postiz node                      | Schedules Instagram post with video and caption | Merge                        | None                         | Set Channel ID; use Postiz account (Sticky Note1)                                             |
| Sticky Note                | Sticky Note                      | General workflow description                     | None                         | None                         | Overview of workflow, Google Gemini & Veo 3, Postiz link                                      |
| Sticky Note1               | Sticky Note                      | Setup instructions for nodes and credentials    | None                         | None                         | Setup instructions for “Set image”, Postiz, Auth, Channel ID, execution                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**
   - Name: When clicking ‘Execute workflow’
   - Type: Manual Trigger
   - Default settings.

2. **Create Set Node for Image URL**
   - Name: Set image
   - Connect from Manual Trigger.
   - Add variable `image_url` as string.
   - Set value to your image URL (default: `https://n3wstorage.b-cdn.net/n3witalia/image_ugc.png`).

3. **Add Google Gemini Node for Image Analysis**
   - Name: Analyze image
   - Connect from “Set image.”
   - Set resource to `image`.
   - Operation: `analyze`.
   - Model: `models/gemini-2.5-pro`.
   - Set `imageUrls` parameter to expression: `{{$json.image_url}}`.
   - Provide Google Gemini API credentials.

4. **Add Google Gemini Node for Creative Director Prompt**
   - Name: Creative director
   - Connect from “Analyze image.”
   - Model: `models/gemini-2.5-pro`.
   - System Message: Instruct to create an 8-second commercial video prompt describing setting, people, actions, based on image description.
   - Messages: Use analyzed image content from previous node.
   - Provide Google Gemini API credentials.

5. **Add Google Gemini Node for Video Generation**
   - Name: Generate UGC Video
   - Connect from “Creative director.”
   - Model: `models/veo-3.0-generate-preview`.
   - Resource: `video`.
   - Prompt: Combine creative director prompt and product image URL (expression: `{{$json.content.parts[0].text}}. Product Image: {{ $('Set image').item.json.image_url }}`).
   - Options: Set aspect ratio to 16:9.
   - Provide Google Gemini API credentials.

6. **Add Google Gemini Node for Social Media Caption**
   - Name: Social Media Manager
   - Connect from “Creative director.”
   - Model: `models/gemini-2.5-pro`.
   - System Message: Expert social media manager to write Instagram ad copy only.
   - Messages: Use creative director prompt text.
   - Provide Google Gemini API credentials.

7. **Add Set Node to Assign Caption**
   - Name: Set caption
   - Connect from “Social Media Manager.”
   - Assign variable `caption` from output text (`{{$json.content.parts[0].text}}`).

8. **Add Google Drive Node to Upload Video**
   - Name: Upload video
   - Connect from “Generate UGC Video.”
   - Configure to upload file to your Google Drive folder.
   - Filename pattern: `{{ $now.format('yyyyLLdd') }}-{{ $json.fileName }}`.
   - Set Drive to “My Drive” and specify target folder ID.
   - Provide Google Drive OAuth2 credentials.

9. **Add HTTP Request Node to Upload Video to Postiz**
   - Name: Upload Video to Postiz
   - Connect from “Generate UGC Video.”
   - Method: POST.
   - URL: `https://api.postiz.com/public/v1/upload`.
   - Content-Type: multipart form-data.
   - Body parameter: `file` with binary data from video.
   - Authentication: HTTP Header Auth with Postiz API key.
   - Provide Postiz API credentials.

10. **Add Merge Node**
    - Name: Merge
    - Connect inputs from “Upload Video to Postiz” and “Set caption.”
    - Mode: Combine all inputs.

11. **Add Postiz Node for Instagram Scheduling**
    - Name: Instagram
    - Connect from “Merge.”
    - Set post date/time to now (`{{$now.format('yyyy-LL-dd')}}T{{$now.format('HH:ii:ss')}}`).
    - Post type: `post`.
    - Configure post content with video ID/path and caption.
    - Set your Instagram Channel ID (integrationId).
    - Enable short link generation.
    - Provide Postiz API credentials.

12. **Add Sticky Notes (Optional)**
    - Add notes describing the workflow purpose, setup instructions, and links to Postiz.

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                                           |
|----------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| Automate UGC video creation with Gemini and Google Veo 3 & upload to Instagram via Postiz                       | Workflow purpose overview                                 |
| Create a FREE account on Postiz to enable Instagram publishing: https://postiz.com/?ref=n3witalia               | Postiz account setup                                      |
| Step-by-step instructions: Replace `image_url`, configure Postiz node and HTTP Header Auth, set Channel ID      | Setup guidelines in Sticky Note1                          |
| Postiz node documentation and API reference                                                                     | https://postiz.com/ (official site)                       |

---

**Disclaimer:**  
This documentation is generated from an automated n8n workflow and complies with current content policies. All data processed is legal and public.