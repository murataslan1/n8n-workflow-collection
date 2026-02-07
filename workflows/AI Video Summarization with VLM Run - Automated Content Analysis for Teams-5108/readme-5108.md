AI Video Summarization with VLM Run - Automated Content Analysis for Teams

https://n8nworkflows.xyz/workflows/ai-video-summarization-with-vlm-run---automated-content-analysis-for-teams-5108


# AI Video Summarization with VLM Run - Automated Content Analysis for Teams

### 1. Workflow Overview

This workflow, titled **AI Video Summarization with VLM Run - Automated Content Analysis for Teams**, automates the ingestion and AI-powered summarization of video files uploaded to a Google Drive folder. It is designed to facilitate quick content analysis and team collaboration by generating concise video summaries and extracting key topics using VLM Run’s AI capabilities. The summarized content is then shared with the team via Slack notifications.

**Target Use Cases:**
- Summarizing meeting recordings
- Analyzing training videos and webinars
- Educational content review
- General video content analysis for teams

**Logical Blocks:**

- **1.1 Input Reception & Preparation:** Monitors a specific Google Drive folder for new video uploads and downloads these files for processing.
- **1.2 AI Video Processing:** Sends the downloaded video to VLM Run for asynchronous AI analysis (summary and topic extraction).
- **1.3 Async Callback Handling:** Receives the processed summary via a webhook callback from VLM Run.
- **1.4 Team Notification:** Posts the AI-generated summary and key topics to a Slack channel for team visibility.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Preparation

**Overview:**  
This block continuously monitors a designated Google Drive folder for new video files. Upon detecting a new file, it downloads the video content to prepare it for AI processing.

**Nodes Involved:**  
- Monitor Video Uploads  
- Download Video File  

**Node Details:**

- **Monitor Video Uploads**  
  - *Type:* Google Drive Trigger  
  - *Role:* Watches a specific Google Drive folder for new file creation events.  
  - *Configuration:*  
    - Event: fileCreated  
    - Polling interval: every minute  
    - Folder to watch: ID `1reWORwI1tMa-eGB75NCXq9eRw4CiQIhX` (specific folder)  
  - *Connections:* Output → Download Video File  
  - *Potential Failures:* Google Drive API quota limits, OAuth token expiration, folder permission issues, network timeouts  
  - *Credentials:* Google Drive OAuth2 account linked  

- **Download Video File**  
  - *Type:* Google Drive  
  - *Role:* Downloads the newly uploaded video file from Google Drive as binary data.  
  - *Configuration:*  
    - Operation: download  
    - File ID sourced dynamically from trigger data (`{{$json.id}}`)  
    - Binary property name: "data"  
  - *Connections:* Output → VLM Run Video Summarizer  
  - *Potential Failures:* File not found (if deleted before download), API errors, OAuth issues, file size limits  
  - *Credentials:* Same Google Drive OAuth2 account  

---

#### 1.2 AI Video Processing

**Overview:**  
This block sends the downloaded video file to the VLM Run AI platform for asynchronous summarization and key topic extraction.

**Nodes Involved:**  
- VLM Run Video Summarizer  

**Node Details:**

- **VLM Run Video Summarizer**  
  - *Type:* VLM Run AI node  
  - *Role:* Performs video summarization and topic extraction asynchronously via VLM Run API.  
  - *Configuration:*  
    - Input file: binary "data" from Download Video File node  
    - Domain: `video.summary` (indicates video summarization task)  
    - Operation: `video`  
    - Callback URL: `https://playground.vlm.run/webhook-test/summarize-video` (receives async results)  
    - Asynchronous processing enabled  
  - *Connections:* None (ends processing here; results returned via callback webhook)  
  - *Potential Failures:* API authentication errors, invalid video format, network issues, callback URL misconfiguration, large file timeouts  
  - *Credentials:* VLM Run API account  

---

#### 1.3 Async Callback Handling

**Overview:**  
This block waits for VLM Run to complete processing. When the AI finishes summarizing the video, it sends the result via HTTP POST to a webhook endpoint. This node receives the summary and topics for further processing.

**Nodes Involved:**  
- Receive VLM Run Callback  

**Node Details:**

- **Receive VLM Run Callback**  
  - *Type:* Webhook  
  - *Role:* Receives asynchronous POST requests from VLM Run with video summary data.  
  - *Configuration:*  
    - HTTP method: POST  
    - Path: `/summarize-video`  
    - Listens for incoming HTTP requests at this path  
  - *Connections:* Output → Send Summary to Team  
  - *Potential Failures:* Webhook endpoint unreachable, invalid payloads, security concerns if unauthenticated, payload schema changes  
  - *Version Requirements:* Webhook v2 node for enhanced features  

---

#### 1.4 Team Notification

**Overview:**  
Posts the AI-generated summary and extracted key topics to a Slack channel, enabling the team to quickly review video content and collaborate effectively.

**Nodes Involved:**  
- Send Summary to Team  

**Node Details:**

- **Send Summary to Team**  
  - *Type:* Slack node  
  - *Role:* Sends a formatted Slack message containing summary and key topics.  
  - *Configuration:*  
    - Message text includes:  
      - Title ("New Video Summary Ready!")  
      - Summary content (`{{ $json.body.response.content }}`)  
      - Key topics (`{{ $json.body.response.topics }}`)  
    - Channel: Selected from Slack workspace, e.g., `C08S3SR2LUW`  
    - Markdown enabled for rich formatting  
  - *Connections:* None (end node)  
  - *Potential Failures:* Slack API rate limits, invalid channel ID, OAuth token expiration, formatting errors  
  - *Credentials:* Slack OAuth2 account  

---

### 3. Summary Table

| Node Name               | Node Type          | Functional Role                         | Input Node(s)          | Output Node(s)           | Sticky Note                                                                                      |
|-------------------------|--------------------|---------------------------------------|-----------------------|--------------------------|-------------------------------------------------------------------------------------------------|
| Monitor Video Uploads    | Google Drive Trigger| Watches Google Drive folder for videos| -                     | Download Video File       | Watches designated Google Drive folder for new video uploads and triggers processing automatically. |
| Download Video File      | Google Drive       | Downloads video file for processing   | Monitor Video Uploads  | VLM Run Video Summarizer | Downloads the uploaded video file from Google Drive and prepares it for AI analysis.             |
| VLM Run Video Summarizer | VLM Run AI node    | Sends video to VLM Run for AI summary| Download Video File    | -                        | Processes video files using VLM AI to generate intelligent summaries and extract key topics. Runs asynchronously for large files. |
| Receive VLM Run Callback | Webhook            | Receives async summary from VLM Run   | -                     | Send Summary to Team      | Receives the completed video summary from VLM AI when asynchronous processing is finished.       |
| Send Summary to Team     | Slack              | Posts summary and topics to Slack     | Receive VLM Run Callback| -                       | Posts the AI-generated video summary and key topics to Slack channel for team review.            |
| 🎥 Workflow Overview     | Sticky Note        | Overview and summary of the entire workflow | -                   | -                        | ## 🎥 AI Video Summarization with VLM Run ... (full note content as above)                       |
| 📁 Input Documentation   | Sticky Note        | Explains input processing from Google Drive | -                   | -                        | ## 📁 Video Input Processing ... (full note content as above)                                   |
| 🤖 AI Processing Documentation | Sticky Note | Details AI video analysis capabilities | -                     | -                        | ## 🤖 AI Video Analysis ... (full note content as above)                                        |
| 🔗 Async Processing Documentation | Sticky Note| Explains async processing flow          | -                     | -                        | ## 🔗 Async Processing Flow ... (full note content as above)                                    |
| 💬 Output Documentation  | Sticky Note        | Describes Slack notification benefits  | -                     | -                        | ## 💬 Team Notifications ... (full note content as above)                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger Node ("Monitor Video Uploads")**  
   - Set event to `fileCreated` to detect new files.  
   - Configure to watch a specific folder by entering folder ID `1reWORwI1tMa-eGB75NCXq9eRw4CiQIhX`.  
   - Set polling interval to every minute for near real-time detection.  
   - Connect Google Drive OAuth2 credentials with required access permissions to the folder.

2. **Create Google Drive Node ("Download Video File")**  
   - Set operation to `download`.  
   - Configure file ID to be dynamic: `{{$json.id}}` from trigger output.  
   - Set binary property name to `data` to hold downloaded file data.  
   - Use the same Google Drive OAuth2 credentials as above.  
   - Connect the output of "Monitor Video Uploads" to this node.

3. **Create VLM Run Node ("VLM Run Video Summarizer")**  
   - Choose the VLM Run AI node from installed n8n nodes.  
   - Set operation to `video` and domain to `video.summary`.  
   - Input file: use binary property `data` passed from the download node.  
   - Enable asynchronous processing by setting "processAsynchronously" to true.  
   - Provide a valid callback URL, e.g., `https://your-n8n-domain/webhook/summarize-video`.  
   - Connect VLM Run API credentials.  
   - Connect the output of "Download Video File" node to this node.

4. **Create Webhook Node ("Receive VLM Run Callback")**  
   - Set HTTP method to POST.  
   - Set path to `/summarize-video` (must match callback URL in VLM Run node).  
   - Configure the node to listen for incoming webhook requests with video summary data.  
   - Connect this node’s output to Slack node.

5. **Create Slack Node ("Send Summary to Team")**  
   - Select Slack node of type "Post Message".  
   - Configure target Slack channel by selecting or entering channel ID (e.g., `C08S3SR2LUW`).  
   - Enable Markdown formatting.  
   - Construct message text using expressions from webhook JSON data:  
     ```
     🎥 *New Video Summary Ready!*

     📄 **Summary:**
     {{ $json.body.response.content }}

     🔍 **Key Topics:**
     {{ $json.body.response.topics }}

     ✅ Processing complete!
     ```  
   - Connect Slack OAuth2 credentials.  
   - Connect output of webhook node to this Slack node.

6. **Arrange nodes visually in the editor for clarity:**  
   - Left to right: Monitor Video Uploads → Download Video File → VLM Run Video Summarizer  
   - Separate branch for Webhook node → Slack node  

7. **Test the workflow:**  
   - Upload a supported video format (MP4, AVI, MOV, WebM, MKV) into the specified Google Drive folder.  
   - Confirm that the workflow triggers, downloads the file, sends it to VLM Run, receives the callback, and posts the summary to Slack.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                              |
|-----------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| The workflow is optimized for asynchronous processing to handle large video files and prevent timeouts. | See Async Processing Documentation sticky note               |
| Supported video formats include MP4, AVI, MOV, WebM, MKV, and various resolutions including mobile footage.| Input Documentation sticky note                               |
| VLM Run API access and credentials are required and must support asynchronous callback URLs.              | VLM Run Video Summarizer node documentation                   |
| Slack messaging benefits include instant team updates and centralized summaries for collaboration.       | Output Documentation sticky note                              |
| Workflow uses OAuth2 credentials for Google Drive and Slack integration.                                  | Credential setup described in node details                    |
| For deploying webhook URLs, ensure n8n instance is publicly accessible or use tunneling services.        | Webhook node best practice                                    |

---

This document comprehensively explains the workflow’s structure, node configurations, and interconnections, enabling users and AI agents to understand, reproduce, and extend the AI Video Summarization workflow efficiently.