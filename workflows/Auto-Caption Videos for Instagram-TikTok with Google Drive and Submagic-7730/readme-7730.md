Auto-Caption Videos for Instagram/TikTok with Google Drive and Submagic

https://n8nworkflows.xyz/workflows/auto-caption-videos-for-instagram-tiktok-with-google-drive-and-submagic-7730


# Auto-Caption Videos for Instagram/TikTok with Google Drive and Submagic

### 1. Workflow Overview

This workflow automates the process of adding captions to videos for Instagram and TikTok by integrating Google Drive with the Submagic captioning service. It is designed to streamline social media content creation by automatically detecting new video uploads in a designated Google Drive folder, sending these videos to Submagic for captioning with a chosen template, polling the status of the captioning job until completion, downloading the captioned videos, and finally uploading the captioned versions back to Google Drive.

**Target Use Cases:**  
- Social media managers and content creators who regularly post captioned videos to Instagram Reels or TikTok.  
- Teams seeking to automate repetitive video captioning tasks to save time and ensure a consistent caption style.  
- Users leveraging cloud-based tools without local video processing.

**Logical Blocks:**  
- **1.1 Input Reception:** Detect new video uploads in a specific Google Drive folder.  
- **1.2 Captioning Request Submission:** Send the video URL to Submagic API with caption template details.  
- **1.3 Captioning Status Polling:** Wait and repeatedly check Submagic until the captioning job completes.  
- **1.4 Captioned Video Retrieval:** Download the finished captioned video from Submagic.  
- **1.5 Upload Captioned Video:** Upload the captioned video back to Google Drive for easy access and posting.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block listens for new video files created in a specified Google Drive folder and triggers the workflow upon detection.

**Nodes Involved:**  
- Google Drive Trigger

**Node Details:**  

- **Google Drive Trigger**  
  - *Type & Role:* Trigger node that activates the workflow on new file creation events in Google Drive.  
  - *Configuration:*  
    - Event set to `fileCreated` for detecting newly uploaded files.  
    - Polling every minute for near real-time responsiveness.  
    - Monitoring a specific folder identified by its Google Drive Folder ID.  
  - *Key Expressions/Variables:* Uses the folder ID to limit scope to the target folder.  
  - *Input/Output:* No input; outputs the metadata of the created file, including its `webViewLink` used downstream.  
  - *Potential Failures:*  
    - Authentication failure if Google Drive OAuth credentials are invalid or expired.  
    - Rate limiting by Google Drive API if polling frequency is too high.  
    - Folder ID misconfiguration leading to missed detections.  
  - *Version Requirements:* Compatible with n8n Google Drive Trigger v1.

---

#### 1.2 Captioning Request Submission

**Overview:**  
Sends the detected video URL to Submagic’s API to initiate captioning using a predefined template.

**Nodes Involved:**  
- Post to Submagic

**Node Details:**  

- **Post to Submagic**  
  - *Type & Role:* HTTP Request node performing a POST to Submagic’s project creation endpoint.  
  - *Configuration:*  
    - URL: `https://api.submagic.co/v1/projects`  
    - Method: POST  
    - Body parameters include:  
      - `title`: Hardcoded as “My First Video” (can be parameterized).  
      - `language`: English (`en`).  
      - `videoUrl`: Derived dynamically from the Google Drive Trigger’s `webViewLink` of the uploaded file.  
      - `templateName`: Set to “Hormozi 2” (preset caption style).  
    - Authentication: Uses generic HTTP header authentication with Submagic API key.  
  - *Key Expressions:* `={{ $json.webViewLink }}` to extract the video URL from the trigger node output.  
  - *Input/Output:* Input from Google Drive Trigger; outputs Submagic project creation response including project ID.  
  - *Potential Failures:*  
    - Invalid or missing Submagic API key causing 401 Unauthorized.  
    - API request limit exceeded or network timeouts.  
    - Incorrect video URL or unsupported formats rejected by Submagic.  
  - *Version Requirements:* HTTP Request node v4.2 or higher for enhanced authentication support.

---

#### 1.3 Captioning Status Polling

**Overview:**  
This block waits and repeatedly checks the status of the captioning job on Submagic until it completes.

**Nodes Involved:**  
- Wait (first instance)  
- Get Captioned Video from Submagic  
- If  
- Wait1 (second instance)

**Node Details:**  

- **Wait**  
  - *Type & Role:* Delay node that pauses workflow for 15 seconds before polling status.  
  - *Configuration:* Static 15-second wait.  
  - *Input/Output:* Receives output from “Post to Submagic” node; outputs trigger to “Get Captioned Video from Submagic.”  
  - *Potential Failures:* None significant; only timing delays.

- **Get Captioned Video from Submagic**  
  - *Type & Role:* HTTP Request node performing GET call to Submagic API to retrieve project status.  
  - *Configuration:*  
    - URL dynamically constructed as `https://api.submagic.co/v1/projects/{{ $json.id }}`, where `id` is the project ID from the Submagic response.  
    - Authentication: Same generic HTTP header authentication with Submagic API key.  
  - *Key Expressions:* Uses the project `id` from the previous node’s JSON to query status.  
  - *Input/Output:* Input from Wait node or Wait1 node; outputs project status including `status` field.  
  - *Potential Failures:*  
    - Authentication errors.  
    - Network issues or API downtime.  
    - Invalid project ID causing 404 Not Found.

- **If**  
  - *Type & Role:* Conditional node that checks if the captioning job’s status is “completed.”  
  - *Configuration:* Checks if `{{$json.status}}` equals `"completed"`.  
  - *Input/Output:* Input from “Get Captioned Video from Submagic.”  
    - If True (status completed), proceeds to download the captioned video.  
    - If False, loops back to waiting (Wait1) and polling again.  
  - *Potential Failures:* Expression evaluation errors if `status` field is missing or malformed.

- **Wait1**  
  - *Type & Role:* Secondary Wait node, also delaying 15 seconds before re-checking status.  
  - *Input/Output:* Triggered if status is not “completed,” loops back to “Get Captioned Video from Submagic.”  
  - *Potential Failures:* Same as the first Wait node.

---

#### 1.4 Captioned Video Retrieval

**Overview:**  
Downloads the fully captioned video from the URL provided by Submagic once the job is complete.

**Nodes Involved:**  
- Download Captioned Video

**Node Details:**  

- **Download Captioned Video**  
  - *Type & Role:* HTTP Request node used to download the captioned video file.  
  - *Configuration:*  
    - URL is dynamically set as `={{ $json.downloadUrl }}`, extracted from the Submagic project details after completion.  
    - No authentication assumed needed; direct file download.  
  - *Input/Output:* Input from the “If” node when status is completed; outputs the binary video data for upload.  
  - *Potential Failures:*  
    - Invalid or expired download URL.  
    - Network or timeout issues.  
    - Large file size causing memory or timeout constraints.

---

#### 1.5 Upload Captioned Video

**Overview:**  
Uploads the downloaded captioned video back into a specified Google Drive folder for easy access and posting.

**Nodes Involved:**  
- Upload file

**Node Details:**  

- **Upload file**  
  - *Type & Role:* Google Drive node configured to upload files to Google Drive.  
  - *Configuration:*  
    - Drive ID and Folder ID set to target the desired Google Drive location.  
    - File data input is binary data from the “Download Captioned Video” node.  
  - *Input/Output:* Input is the binary video file from the download node; no output connections beyond final storage.  
  - *Potential Failures:*  
    - Authentication errors with Google Drive OAuth.  
    - File upload size limits exceeded.  
    - Folder permission issues.  

---

### 3. Summary Table

| Node Name                   | Node Type                 | Functional Role                           | Input Node(s)                   | Output Node(s)                  | Sticky Note                                                                                                                       |
|-----------------------------|---------------------------|-----------------------------------------|--------------------------------|--------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Google Drive Trigger         | Google Drive Trigger      | Detect new video uploads in Drive       | -                              | Post to Submagic                | Google Drive Trigger                                                                                                             |
| Post to Submagic            | HTTP Request              | Send video URL to Submagic API          | Google Drive Trigger            | Wait                           | Post to Submagic for Caption                                                                                                     |
| Wait                        | Wait                      | Pause before polling Submagic status    | Post to Submagic                | Get Captioned Video from Submagic | Wait Loop & Get Captioned Video                                                                                                |
| Get Captioned Video from Submagic | HTTP Request              | Poll Submagic for captioning status     | Wait, Wait1                    | If                             | Wait Loop & Get Captioned Video                                                                                                |
| If                          | If                        | Check if captioning job is completed    | Get Captioned Video from Submagic | Download Captioned Video, Wait1 | Wait Loop & Get Captioned Video                                                                                                |
| Wait1                       | Wait                      | Secondary delay before re-polling       | If                             | Get Captioned Video from Submagic | Wait Loop & Get Captioned Video                                                                                                |
| Download Captioned Video    | HTTP Request              | Download finalized captioned video      | If                             | Upload file                    | Download Captioned Video                                                                                                        |
| Upload file                 | Google Drive              | Upload captioned video to Drive         | Download Captioned Video        | -                              | Upload Captioned Video to Drive                                                                                                |
| Sticky Note                 | Sticky Note               | Workflow description and overview       | -                              | -                              | 🎥 Auto-Caption Videos for Instagram with Google Drive + Submagic... (full content as per workflow)                              |
| Sticky Note1                | Sticky Note               | Label for Google Drive Trigger block    | -                              | -                              | Google Drive Trigger                                                                                                             |
| Sticky Note2                | Sticky Note               | Label for Post to Submagic block        | -                              | -                              | Post to Submagic for Caption                                                                                                     |
| Sticky Note3                | Sticky Note               | Label for Wait loop and status check    | -                              | -                              | Wait Loop & Get Captioned Video                                                                                                 |
| Sticky Note4                | Sticky Note               | Label for Download Captioned Video      | -                              | -                              | Download Captioned Video                                                                                                        |
| Sticky Note5                | Sticky Note               | Label for Upload Captioned Video block  | -                              | -                              | Upload Captioned Video to Drive                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a “Google Drive Trigger” node:**  
   - Set event to `fileCreated`.  
   - Set trigger to watch a specific folder by selecting or entering the Google Drive Folder ID where videos will be uploaded.  
   - Configure OAuth2 credentials for Google Drive.  
   - Set polling interval to every 1 minute.

3. **Add an “HTTP Request” node named “Post to Submagic”:**  
   - Method: POST  
   - URL: `https://api.submagic.co/v1/projects`  
   - Authentication: Generic HTTP Header Auth with your Submagic API key in headers.  
   - Body Parameters (JSON):  
     - `title`: Static string (e.g., “My First Video”)  
     - `language`: `"en"`  
     - `videoUrl`: Expression referencing `{{$json.webViewLink}}` from Google Drive trigger.  
     - `templateName`: `"Hormozi 2"` or your preferred Submagic template name.  
   - Connect Google Drive Trigger output to this node.

4. **Add a “Wait” node:**  
   - Set fixed wait time to 15 seconds.  
   - Connect “Post to Submagic” output to this node.

5. **Add an “HTTP Request” node named “Get Captioned Video from Submagic”:**  
   - Method: GET  
   - URL: Use expression `https://api.submagic.co/v1/projects/{{$json.id}}` where `id` is from the previous POST response.  
   - Authentication: Same as “Post to Submagic”.  
   - Connect “Wait” node output to this node.

6. **Add an “If” node:**  
   - Condition: Check if `{{$json.status}}` equals `"completed"`.  
   - Connect “Get Captioned Video from Submagic” output to this node.

7. **Add a second “Wait” node (“Wait1”):**  
   - Set fixed wait time to 15 seconds.  
   - Connect “If” node’s False output to this node.

8. **Loop back:**  
   - Connect “Wait1” output back to “Get Captioned Video from Submagic” for polling.

9. **Add an “HTTP Request” node named “Download Captioned Video”:**  
   - Method: GET  
   - URL: Expression `{{$json.downloadUrl}}` from the completed project details.  
   - Connect “If” node’s True output to this node.

10. **Add a “Google Drive” node named “Upload file”:**  
    - Operation: Upload file  
    - Drive ID: Select your Google Drive  
    - Folder ID: Select or enter the folder to upload captioned videos.  
    - Input: Use binary data from “Download Captioned Video” node.  
    - Connect “Download Captioned Video” output to this node.

11. **Set credentials:**  
    - Google Drive OAuth2 credentials for “Google Drive Trigger” and “Upload file” nodes.  
    - Generic HTTP Header Auth credentials with Submagic API key for “Post to Submagic” and “Get Captioned Video from Submagic” nodes.

12. **Add Sticky Notes (Optional but recommended):**  
    - Add descriptive sticky notes near each block for clarity, as in the original workflow.

13. **Test the workflow:**  
    - Upload a test video to the watched Google Drive folder.  
    - Monitor the workflow execution to verify captioning, download, and upload steps complete successfully.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                 | Context or Link                           |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------|
| 🎥 Auto-Caption Videos for Instagram with Google Drive + Submagic\n\nSave hours on video editing with this workflow! Whenever you upload a video to a specific Google Drive folder, it’s automatically sent to Submagic to generate engaging captions (using your chosen template). Once the captioned video is ready, it’s pulled back, downloaded, and uploaded into your Google Drive—fully captioned and Instagram-ready.\n\nWatch build along videos for workflows like these on: www.youtube.com/@automatewithmarc | Workflow description and tutorial video channel link |

---

This documentation provides a thorough understanding of the IG Auto Caption Agent Workflow, enabling smooth reproduction, customization, and troubleshooting.