Auto-Edit Images from Google Drive with Nano Banana and Send via Gmail

https://n8nworkflows.xyz/workflows/auto-edit-images-from-google-drive-with-nano-banana-and-send-via-gmail-8577


# Auto-Edit Images from Google Drive with Nano Banana and Send via Gmail

### 1. Workflow Overview

This workflow automates the process of editing images uploaded to a specific Google Drive folder using the Wavespeed API's Google Nano Banana image editing service and then emailing the edited image via Gmail. It is designed for creators, marketers, or operations teams who need automated, consistent image retouching with rapid delivery to a stakeholder's inbox.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Detect new image uploads to a specified Google Drive folder.
- **1.2 Image Edit Request Submission:** Send the uploaded image URL to the Wavespeed Nano Banana API for editing with a preset prompt.
- **1.3 Job Status Polling:** Wait and repeatedly check the status of the image editing job until completion.
- **1.4 Conditional Routing:** If the job is completed, proceed to send the edited image by email; otherwise, wait and recheck.
- **1.5 Email Delivery:** Send the edited image output to a configured Gmail recipient.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block monitors a specific Google Drive folder for new image files and triggers the workflow when a new file is created.

- **Nodes Involved:**  
  - Google Drive Trigger  
  - Sticky Note (for annotation)

- **Node Details:**

  **Google Drive Trigger**  
  - *Type:* Trigger node for Google Drive events  
  - *Configuration:* Watches for `fileCreated` events in a specific Google Drive folder (folder ID redacted for privacy). Polls every minute.  
  - *Key Expressions:* None beyond folder configuration.  
  - *Inputs:* None (trigger node)  
  - *Outputs:* Emits data on newly created files in the folder.  
  - *Version Requirements:* Uses typeVersion 1.  
  - *Potential Failures:* Authorization errors if OAuth2 credentials expire; network timeouts; folder ID misconfiguration.  
  - *Sticky Note:* "Image Upload to Drive Trigger"

---

#### 2.2 Image Edit Request Submission

- **Overview:**  
  Receives the newly uploaded image URL from Google Drive trigger and sends a POST request to Wavespeed’s Nano Banana API to initiate an image editing job with a predefined prompt.

- **Nodes Involved:**  
  - Post Image Edit Request  
  - Sticky Note (for annotation)

- **Node Details:**

  **Post Image Edit Request**  
  - *Type:* HTTP Request node  
  - *Configuration:*  
    - Method: POST  
    - URL: `https://api.wavespeed.ai/api/v3/google/nano-banana/edit`  
    - Body: JSON containing:  
      - `enable_base64_output`: false  
      - `enable_sync_mode`: false  
      - `images`: array with Google Drive file URL (`{{ $json.webContentLink }}`)  
      - `output_format`: "jpeg"  
      - `prompt`: "Change the lighting to night scene" (can be customized)  
    - Authentication: HTTP Header Auth with Wavespeed API key (credentials redacted)  
  - *Key Expressions:* Uses JSON templating to insert image URL.  
  - *Inputs:* From Google Drive Trigger  
  - *Outputs:* Returns JSON response including a job ID (`data.id`) for polling.  
  - *Version Requirements:* Used typeVersion 4.2 for HTTP Request.  
  - *Potential Failures:* API authentication errors, invalid URL input, network timeouts, API rate limits.  
  - *Sticky Note:* "Post Image to Nano Banana to Edit (Wavespeed)"

---

#### 2.3 Job Status Polling

- **Overview:**  
  After submitting the edit request, this block waits for a fixed period and then polls the Wavespeed API to check the status of the image editing job, repeating as necessary until completion.

- **Nodes Involved:**  
  - Wait 15 Secs  
  - Get Image Edit Request  
  - If (conditional node)  
  - Wait 15 Secs2  
  - Sticky Notes (for annotation)

- **Node Details:**

  **Wait 15 Secs**  
  - *Type:* Wait node  
  - *Configuration:* Waits 15 seconds before polling job status.  
  - *Inputs:* From Post Image Edit Request  
  - *Outputs:* Proceeds to Get Image Edit Request  
  - *Version:* 1.1  
  - *Potential Failures:* None typical; delay time can be adjusted based on expected job duration.

  **Get Image Edit Request**  
  - *Type:* HTTP Request node  
  - *Configuration:*  
    - Method: GET  
    - URL: `https://api.wavespeed.ai/api/v3/predictions/{{ $json.data.id }}/result`  
    - Authentication: HTTP Header Auth with Wavespeed API key (credentials redacted)  
  - *Key Expressions:* Uses job ID from previous node to check status.  
  - *Inputs:* From Wait 15 Secs or Wait 15 Secs2  
  - *Outputs:* Returns job status and edited image output if completed.  
  - *Version:* 4.2  
  - *Potential Failures:* API authentication failure, invalid job ID, network errors.

  **If**  
  - *Type:* Conditional node  
  - *Configuration:* Checks if `data.status` equals `"completed"`.  
  - *Inputs:* From Get Image Edit Request  
  - *Outputs:*  
    - True branch: Send Edited Image to Email  
    - False branch: Wait 15 Secs2 (to wait and re-poll)  
  - *Version:* 2.2  
  - *Potential Failures:* Expression errors if data format changes.

  **Wait 15 Secs2**  
  - *Type:* Wait node  
  - *Configuration:* Waits 15 seconds before looping back to Get Image Edit Request for re-polling.  
  - *Inputs:* From If node (False branch)  
  - *Outputs:* Back to Get Image Edit Request  
  - *Version:* 1.1  
  - *Potential Failures:* None typical; can cause infinite loop if completion never occurs.

  *Sticky Notes:*  
  - "Get Edited Image from Nano Banana (Wavespeed)"  
  - "Send Edited Image to Email" (for nodes downstream)

---

#### 2.4 Email Delivery

- **Overview:**  
  Sends the final edited image URL or data via Gmail to a specified recipient once the image editing job is completed successfully.

- **Nodes Involved:**  
  - Send Edited Image to Email  
  - Sticky Note (for annotation)

- **Node Details:**

  **Send Edited Image to Email**  
  - *Type:* Gmail node  
  - *Configuration:*  
    - Recipient email address configured statically (redacted)  
    - Subject: "Edited Image"  
    - Message body: Uses `{{ $json.data.outputs[0] }}` which contains the edited image link or data from the Wavespeed API response.  
    - OAuth2 credentials for Gmail configured (redacted)  
  - *Inputs:* From If node (True branch)  
  - *Outputs:* None (terminal node)  
  - *Version:* 2.1  
  - *Potential Failures:* OAuth token expiration, Gmail sending limits, invalid email address, message size limits.

  *Sticky Note:* "Send Edited Image to Email"

---

### 3. Summary Table

| Node Name                | Node Type                | Functional Role                                  | Input Node(s)            | Output Node(s)                  | Sticky Note                                                                                                   |
|--------------------------|--------------------------|-------------------------------------------------|--------------------------|-------------------------------|---------------------------------------------------------------------------------------------------------------|
| Google Drive Trigger      | n8n-nodes-base.googleDriveTrigger | Detect new image upload in Drive folder         | None                     | Post Image Edit Request         | Image Upload to Drive Trigger                                                                                  |
| Post Image Edit Request   | n8n-nodes-base.httpRequest | Submit image edit job to Wavespeed Nano Banana API | Google Drive Trigger     | Wait 15 Secs                   | Post Image to Nano Banana to Edit (Wavespeed)                                                                 |
| Wait 15 Secs             | n8n-nodes-base.wait      | Wait before polling job status                    | Post Image Edit Request   | Get Image Edit Request          |                                                                                                               |
| Get Image Edit Request    | n8n-nodes-base.httpRequest | Poll Wavespeed API for edited image status       | Wait 15 Secs, Wait 15 Secs2 | If                            | Get Edited Image from Nano Banana (Wavespeed)                                                                 |
| If                       | n8n-nodes-base.if         | Check if the image edit job is completed          | Get Image Edit Request    | Send Edited Image to Email, Wait 15 Secs2 |                                                                                                               |
| Wait 15 Secs2            | n8n-nodes-base.wait      | Wait before re-polling job status                  | If (False branch)         | Get Image Edit Request          |                                                                                                               |
| Send Edited Image to Email | n8n-nodes-base.gmail    | Send edited image via Gmail                        | If (True branch)          | None                          | Send Edited Image to Email                                                                                      |
| Sticky Note              | n8n-nodes-base.stickyNote | Annotation                                        | None                     | None                          | Image Upload to Drive Trigger                                                                                  |
| Sticky Note1             | n8n-nodes-base.stickyNote | Annotation                                        | None                     | None                          | Post Image to Nano Banana to Edit (Wavespeed)                                                                 |
| Sticky Note2             | n8n-nodes-base.stickyNote | Annotation                                        | None                     | None                          | Get Edited Image from Nano Banana (Wavespeed)                                                                 |
| Sticky Note3             | n8n-nodes-base.stickyNote | Annotation                                        | None                     | None                          | Send Edited Image to Email                                                                                      |
| Sticky Note4             | n8n-nodes-base.stickyNote | Workflow description and overview                 | None                     | None                          | Google Drive → Wavespeed (Google Nano Banana) → Gmail: Auto-Edit & Email Images... [YouTube link included]      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger Node:**  
   - Type: Google Drive Trigger  
   - Event: `fileCreated`  
   - Folder to watch: Select the Google Drive folder where images will be uploaded. Use the folder ID.  
   - Polling interval: Every minute  
   - Credentials: Configure Google Drive OAuth2 credentials with appropriate scopes.

2. **Create HTTP Request Node to Post Image Edit Request:**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.wavespeed.ai/api/v3/google/nano-banana/edit`  
   - Body Content Type: JSON  
   - JSON Body:  
     ```json
     {
       "enable_base64_output": false,
       "enable_sync_mode": false,
       "images": [
         "{{ $json.webContentLink }}"
       ],
       "output_format": "jpeg",
       "prompt": "Change the lighting to night scene"
     }
     ```  
   - Authentication: HTTP Header Auth with Wavespeed API key  
   - Connect Google Drive Trigger output to this node’s input.

3. **Add Wait Node (Wait 15 Secs):**  
   - Type: Wait  
   - Duration: 15 seconds  
   - Connect from Post Image Edit Request node.

4. **Create HTTP Request Node to Get Image Edit Request Status:**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.wavespeed.ai/api/v3/predictions/{{ $json.data.id }}/result`  
   - Authentication: HTTP Header Auth with Wavespeed API key  
   - Connect from Wait 15 Secs node.

5. **Add If Node to Check Job Completion:**  
   - Type: If  
   - Condition: Check if `data.status` equals `"completed"`  
   - Connect from Get Image Edit Request node.

6. **Add Wait Node (Wait 15 Secs2) for Polling Loop:**  
   - Type: Wait  
   - Duration: 15 seconds  
   - Connect false branch of If node to this wait node, then connect output of this wait node back to Get Image Edit Request node (to poll again).

7. **Add Gmail Node to Send Edited Image:**  
   - Type: Gmail  
   - Recipient: Set email address (static or dynamic)  
   - Subject: "Edited Image"  
   - Message Body: Use expression `{{ $json.data.outputs[0] }}` to insert edited image output link or data.  
   - Credentials: Configure Gmail OAuth2 credentials with send email scope.  
   - Connect true branch of If node to this node.

8. **Add Sticky Notes:**  
   - Optionally add sticky notes above or near each block for documentation and clarity.

9. **Final Checks:**  
   - Verify all credentials are correctly configured and authorized.  
   - Adjust wait durations and prompt text as needed.  
   - Test the workflow end-to-end with a sample image upload.  
   - Implement error handling as needed (e.g., additional If nodes for API error codes or fail counters).

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                               |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| This workflow automates editing of images uploaded to Google Drive using Wavespeed’s Google Nano Banana API and delivers the results via Gmail. Ideal for social media pipelines, product photo retouching, or team approvals.                                                                                                                                                                                                                                                                                                                                                                                                                 | Workflow Description                                          |
| Video tutorials for workflows like this one are available at: www.youtube.com/@automatewithmarc                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | https://www.youtube.com/@automatewithmarc                      |
| Potential improvements include changing the prompt (e.g., “remove background”, “enhance product lighting”), dynamic recipient emails, saving results to Google Drive or S3 instead of email, and adding error handling with IF nodes and retry limits to avoid infinite polling loops.                                                                                                                                                                                                                                                                                                                                                             | Suggestions for customization and robustness                   |
| If the Wavespeed API cannot access the uploaded file URL due to permissions, consider setting the Google Drive file to “Share File” and using the shared link to ensure accessibility.                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Important integration note                                     |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow developed with n8n, respecting all applicable content policies and handling only legal, public data.