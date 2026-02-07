Auto-Caption & Post Videos to Instagram & TikTok with Submagic, Postiz & OpenAI

https://n8nworkflows.xyz/workflows/auto-caption---post-videos-to-instagram---tiktok-with-submagic--postiz---openai-7992


# Auto-Caption & Post Videos to Instagram & TikTok with Submagic, Postiz & OpenAI

### 1. Workflow Overview

This workflow automates the process of captioning and posting videos to Instagram and TikTok using Submagic, Postiz, and OpenAI. It is designed for content creators or social media managers who want to streamline their short-form video publishing pipeline. The workflow detects new video uploads to a designated Google Drive folder, adds styled captions through Submagic, polls for completion, downloads the captioned video, uploads it to Postiz for multi-platform posting, generates optimized social media captions via OpenAI, posts the video with captions to Instagram/TikTok, and finally logs the entire process in Google Sheets for tracking.

Logical blocks in the workflow:

- **1.1 Input Reception:** Detect new video file in Google Drive.
- **1.2 Caption Generation with Submagic:** Submit video to Submagic, poll for captioned video readiness, and download the finished video.
- **1.3 Upload and Posting:** Upload captioned video to Postiz and post it to Instagram/TikTok.
- **1.4 Caption Refinement with OpenAI:** Generate engaging and brand-aligned captions using an AI language model.
- **1.5 Logging:** Record the video details, captions, and status to Google Sheets.
- **1.6 Control and Decision:** Conditional checks and waiting mechanisms for asynchronous processing.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block detects new video files added to a specific Google Drive folder, triggering the workflow.

**Nodes Involved:**  
- Google Drive Trigger

**Node Details:**

- **Google Drive Trigger**  
  - Type: Trigger node that listens to Google Drive file creation events.  
  - Configuration: Watches a specific folder identified by `<<<GOOGLE_DRIVE_FOLDER_ID>>>`, polling every minute for new files.  
  - Key Variables: Outputs file metadata including `webViewLink` used as video URL.  
  - Connections: Output flows to “Post to Submagic” node.  
  - Edge Cases: Potential auth errors with Google Drive OAuth, rate limits, or folder ID misconfiguration.  
  - Version: n8n-nodes-base.googleDriveTrigger v1.  

---

#### 1.2 Caption Generation with Submagic

**Overview:**  
This block sends the video to Submagic to generate styled captions, repeatedly checks for job completion, and downloads the captioned video once ready.

**Nodes Involved:**  
- Post to Submagic  
- Wait 15 Secs1  
- Get Captioned Video from Submagic  
- If (status check)  
- Wait 15 Secs (retry delay)  
- Download Captioned Video

**Node Details:**

- **Post to Submagic**  
  - Type: HTTP Request POST to Submagic API endpoint `/v1/projects`.  
  - Config: Sends JSON body with video URL (`{{ $json.webViewLink }}`), language `en`, a fixed title, and template name "Hormozi 2". Uses generic HTTP header auth with stored credentials.  
  - Output: Receives project ID for polling.  
  - Connections: Flows to “Wait 15 Secs1”.  
  - Edge Cases: API key errors, network timeouts, invalid video URL.  

- **Wait 15 Secs1**  
  - Type: Wait node introducing 15-second delay.  
  - Purpose: Pause before polling Submagic to allow processing time.  
  - Connections: Flows to “Get Captioned Video from Submagic”.  

- **Get Captioned Video from Submagic**  
  - Type: HTTP GET request to `/v1/projects/{{ $json.id }}` to fetch job status and results.  
  - Config: Uses generic HTTP header auth.  
  - Output: Returns JSON including `status` and `downloadUrl` if completed.  
  - Connections: Flows to “If” node for status evaluation.  
  - Edge Cases: API errors, invalid ID, rate limits.

- **If (status check)**  
  - Type: Conditional node checking if `status` equals `"completed"`.  
  - If True: Proceeds to “Download Captioned Video”.  
  - If False: Loops back to “Wait 15 Secs” for another delay before re-polling.  
  - Edge Cases: Unexpected status values or missing field.

- **Wait 15 Secs**  
  - Type: Wait node for 15 seconds to avoid aggressive polling.  
  - Connections: Loops back to “Get Captioned Video from Submagic”.  

- **Download Captioned Video**  
  - Type: HTTP Request GET to the `downloadUrl` from Submagic response.  
  - Purpose: Retrieves the finished captioned video file.  
  - Connections: Flows to “Upload to Postiz”.  
  - Edge Cases: Download failures, broken URLs, timeouts.

---

#### 1.3 Upload and Posting

**Overview:**  
Uploads the captioned video to Postiz and posts it on Instagram via Postiz’s API.

**Nodes Involved:**  
- Upload to Postiz  
- Update Log  
- Post to Instagram

**Node Details:**

- **Upload to Postiz**  
  - Type: HTTP Request POST to Postiz upload endpoint `/public/v1/upload`.  
  - Config: Sends multipart form-data with the binary video file from “Download Captioned Video”. Uses generic HTTP header auth.  
  - Output: Returns file ID and path in Postiz system.  
  - Connections: Flows to “Update Log”.  
  - Edge Cases: Upload failures, auth errors, file size limits.

- **Update Log**  
  - Type: Google Sheets append operation.  
  - Config: Appends a new row with video description/prompt, video URL, caption, and status to a specified Google Sheet (`<<<GOOGLE_SHEET_ID>>>`).  
  - Connections: Flows to “Get row(s) in sheet” for further processing.  
  - Edge Cases: Sheet access issues, quota limits.

- **Post to Instagram**  
  - Type: HTTP POST to Postiz post creation endpoint `/public/v1/posts`.  
  - Config: Sends JSON body specifying post type “now”, date timestamp, no tags, and includes Postiz integration ID (`cmeku38qa00cpo90yfw4ai6lt`). Attaches the uploaded media by ID and path.  
  - Authentication: Generic HTTP header auth.  
  - Connections: None downstream (end of posting flow).  
  - Edge Cases: Posting failures, invalid integration ID, API limits.

---

#### 1.4 Caption Refinement with OpenAI

**Overview:**  
Generates a creative and engaging caption for Instagram/TikTok posts using OpenAI’s GPT-5 model, specialized as an Instagram caption writer.

**Nodes Involved:**  
- Get row(s) in sheet  
- Code  
- OpenAI Chat Model  
- Caption Agent

**Node Details:**

- **Get row(s) in sheet**  
  - Type: Google Sheets read operation.  
  - Config: Reads rows from the tracking sheet to retrieve the latest or relevant data for caption generation.  
  - Output: Returns rows for further processing.  
  - Connections: Flows to “Code”.

- **Code**  
  - Type: JavaScript code node.  
  - Function: Selects the last item from input data array to focus caption generation on the most recent entry.  
  - Output: Single item array for next node.  
  - Connections: Flows to “Caption Agent”.

- **OpenAI Chat Model**  
  - Type: AI language model node using OpenAI GPT-5.  
  - Config: Uses stored OpenAI credentials, GPT-5 selected via parameter list.  
  - Connections: Feeds AI language model output to “Caption Agent”.

- **Caption Agent**  
  - Type: LangChain agent node designed for caption generation.  
  - Config: Receives “Image Prompt” text from sheet data, uses a system message specifying role as “expert Instagram caption writer” with detailed guidelines on tone, style, and CTA rotation.  
  - Output: Produces one final, clean caption with no extra formatting.  
  - Connections: Flows to “Post to Instagram”.  
  - Edge Cases: API errors, prompt misformatting, token limits.

---

#### 1.5 Logging

**Overview:**  
Logs each processed video’s metadata, captions, and posting status into a Google Sheet for content tracking and analytics.

**Nodes Involved:**  
- Update Log  
- Get row(s) in sheet  
- Code

**Node Details:**

- Covered above under Update Log, Get row(s) in sheet, and Code nodes.

---

#### 1.6 Control and Decision

**Overview:**  
Handles asynchronous polling and conditional flow control to wait for the captioned video generation to complete before proceeding.

**Nodes Involved:**  
- If  
- Wait 15 Secs  
- Wait 15 Secs1

**Node Details:**

- Covered above under respective wait and conditional nodes.

---

### 3. Summary Table

| Node Name                  | Node Type                        | Functional Role                           | Input Node(s)             | Output Node(s)             | Sticky Note                                                                                  |
|----------------------------|---------------------------------|-----------------------------------------|---------------------------|----------------------------|----------------------------------------------------------------------------------------------|
| Google Drive Trigger        | googleDriveTrigger               | Detect new video files in Drive folder  |                           | Post to Submagic            | Google Drive Trigger                                                                        |
| Post to Submagic            | httpRequest                     | Submit video for captioning via Submagic| Google Drive Trigger       | Wait 15 Secs1               | Post to Submagic                                                                            |
| Wait 15 Secs1              | wait                           | Delay before polling Submagic status     | Post to Submagic           | Get Captioned Video from Submagic |                                                                                              |
| Get Captioned Video from Submagic | httpRequest               | Poll Submagic for job status             | Wait 15 Secs1, Wait 15 Secs| If                         | Caption with Submagic                                                                       |
| If                         | if                             | Check if captioning is complete          | Get Captioned Video from Submagic | Download Captioned Video, Wait 15 Secs |                                                                                              |
| Wait 15 Secs               | wait                           | Delay before retrying status poll        | If (false branch)          | Get Captioned Video from Submagic |                                                                                              |
| Download Captioned Video   | httpRequest                     | Download finalized captioned video       | If (true branch)           | Upload to Postiz            | Upload to Postiz                                                                            |
| Upload to Postiz            | httpRequest                     | Upload video to Postiz for posting       | Download Captioned Video   | Update Log                  |                                                                                              |
| Update Log                  | googleSheets                    | Log video & caption details to Google Sheets | Upload to Postiz          | Get row(s) in sheet         |                                                                                              |
| Get row(s) in sheet         | googleSheets                    | Retrieve rows for caption generation     | Update Log                 | Code                       |                                                                                              |
| Code                       | code                           | Extract last row from sheet data         | Get row(s) in sheet        | Caption Agent               |                                                                                              |
| OpenAI Chat Model           | lmChatOpenAi                   | AI language model for caption generation |                           | Caption Agent (AI input)    |                                                                                              |
| Caption Agent               | langchain.agent                | Generate social media caption with AI    | Code, OpenAI Chat Model    | Post to Instagram           | Caption for IG                                                                             |
| Post to Instagram           | httpRequest                    | Post video with caption to Instagram     | Caption Agent              |                            | Post to IG                                                                                 |
| Wait 15 Secs1              | wait                           | Delay before polling Submagic status     | Post to Submagic           | Get Captioned Video from Submagic |                                                                                              |
| Sticky Note (various)       | stickyNote                    | Visual workflow annotations               |                           |                            | Various notes covering Google Drive Trigger, Submagic, Postiz, Instagram captioning, posting, and overview |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Google Drive Trigger node:**
   - Type: Google Drive Trigger.
   - Configure to watch a specific folder (`<<<GOOGLE_DRIVE_FOLDER_ID>>>`).
   - Set polling interval to every minute.
   - Authenticate with Google Drive OAuth2 credentials.
   - Connect output to the next node.

2. **Add an HTTP Request node (“Post to Submagic”):**
   - Method: POST.
   - URL: `https://api.submagic.co/v1/projects`.
   - Authentication: Generic HTTP Header Auth with Submagic API key.
   - Body (JSON):
     - title: "My First Video".
     - language: "en".
     - videoUrl: `={{ $json.webViewLink }}` (from trigger).
     - templateName: "Hormozi 2".
   - Connect input from Google Drive Trigger.
   - Connect output to “Wait 15 Secs1”.

3. **Add a Wait node (“Wait 15 Secs1”):**
   - Duration: 15 seconds.
   - Connect input from “Post to Submagic”.
   - Connect output to “Get Captioned Video from Submagic”.

4. **Add an HTTP Request node (“Get Captioned Video from Submagic”):**
   - Method: GET.
   - URL: `=https://api.submagic.co/v1/projects/{{ $json.id }}` (poll project status).
   - Authentication: Generic HTTP Header Auth with Submagic API key.
   - Connect input from “Wait 15 Secs1” and from “Wait 15 Secs” (loop back).
   - Connect output to “If” node.

5. **Add an If node (“If”):**
   - Condition: Check if `{{$json.status}}` equals `"completed"`.
   - True branch: Connect to “Download Captioned Video”.
   - False branch: Connect to “Wait 15 Secs”.

6. **Add a Wait node (“Wait 15 Secs”):**
   - Duration: 15 seconds.
   - Connect input from the false branch of “If”.
   - Connect output back to “Get Captioned Video from Submagic”.

7. **Add an HTTP Request node (“Download Captioned Video”):**
   - Method: GET.
   - URL: `={{ $json.downloadUrl }}`.
   - Connect input from true branch of “If”.
   - Connect output to “Upload to Postiz”.

8. **Add an HTTP Request node (“Upload to Postiz”):**
   - Method: POST.
   - URL: `https://api.postiz.com/public/v1/upload`.
   - Authentication: Generic HTTP Header Auth with Postiz API key.
   - Content-Type: multipart/form-data.
   - Body parameters: Attach video binary data from previous node.
   - Connect input from “Download Captioned Video”.
   - Connect output to “Update Log”.

9. **Add a Google Sheets node (“Update Log”):**
   - Operation: Append.
   - Configure with Google Sheets credentials.
   - Set target spreadsheet and sheet (`<<<GOOGLE_SHEET_ID>>>` and sheet name).
   - Map columns: Video Description / Prompt, Video URL, Caption, Status.
   - Connect input from “Upload to Postiz”.
   - Connect output to “Get row(s) in sheet”.

10. **Add a Google Sheets node (“Get row(s) in sheet”):**
    - Operation: Read (default).
    - Configure to read rows from the same sheet.
    - Connect input from “Update Log”.
    - Connect output to “Code”.

11. **Add a Code node (“Code”):**
    - JavaScript code to return only the last item from input data to focus caption generation on the latest entry.
    - Code:  
      ```js
      return [items[items.length - 1]];
      ```
    - Connect input from “Get row(s) in sheet”.
    - Connect output to “Caption Agent”.

12. **Add an OpenAI Chat Model node (“OpenAI Chat Model”):**
    - Choose model: GPT-5.
    - Authenticate with OpenAI API key.
    - Connect output to “Caption Agent” as AI language model input.

13. **Add a LangChain Agent node (“Caption Agent”):**
    - Input text: `={{ $json["Image Prompt"] }}` from sheet data.
    - System message: Define role and caption guidelines emphasizing playful, engaging captions for parents and kids promoting Larrydoodle.com.  
    - Output: Single caption string, no special characters or formatting.
    - Connect input from “Code” (data) and “OpenAI Chat Model” (language model).
    - Connect output to “Post to Instagram”.

14. **Add an HTTP Request node (“Post to Instagram”):**
    - Method: POST.
    - URL: `https://api.postiz.com/public/v1/posts`.
    - Authentication: Generic HTTP Header Auth with Postiz API key.
    - JSON body:  
      ```json
      {
        "type": "now",
        "shortLink": false,
        "date": "{{ new Date($now).toISOString() }}",
        "tags": [],
        "posts": [
          {
            "integration": { "id": "cmeku38qa00cpo90yfw4ai6lt" },
            "value": [
              {
                "content": "{{ $json.output }}",
                "image": [
                  {
                    "id": "{{ $node['Upload to Postiz'].json.id }}",
                    "path": "{{ $node['Upload to Postiz'].json.path }}"
                  }
                ]
              }
            ],
            "settings": { "post_type": "post" }
          }
        ]
      }
      ```
    - Connect input from “Caption Agent”.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Context or Link                         |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| 🎥 Auto-Caption & Autopost Videos to Instagram & TikTok: Automate your short-form content pipeline by generating captions with Submagic and posting via Postiz. Includes AI-generated captions with OpenAI and Google Sheets logging. Requires Google Drive, Submagic API, Postiz, OpenAI API, and Google Sheets accounts. Watch a step-by-step build of this workflow on: www.youtube.com/@automatewithmarc                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Workflow overview sticky note          |
| Caption Agent system message includes detailed instructions to create short, playful, and engaging captions aimed at parents and children, promoting the Larrydoodle platform, with rotating CTAs and a friendly tone. This ensures consistent brand voice and engagement.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Caption generation guidance             |
| Links and placeholders like `<<<GOOGLE_DRIVE_FOLDER_ID>>>`, `<<<GOOGLE_SHEET_ID>>>`, and API keys must be replaced with actual credentials and IDs for the workflow to function.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Credential and parameter placeholders   |
| Postiz integration ID (`cmeku38qa00cpo90yfw4ai6lt`) is used to specify the Instagram integration; this must correspond to the user's Postiz account setup.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Postiz API integration detail           |
| Polling delay with 15 seconds wait nodes prevents excessive API calls to Submagic, respecting rate limits and ensuring efficient job completion checks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Polling interval rationale               |

---

**Disclaimer:** The provided text is exclusively derived from an automated n8n workflow. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.