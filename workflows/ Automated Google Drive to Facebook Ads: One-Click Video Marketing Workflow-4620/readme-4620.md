 Automated Google Drive to Facebook Ads: One-Click Video Marketing Workflow

https://n8nworkflows.xyz/workflows/-automated-google-drive-to-facebook-ads--one-click-video-marketing-workflow-4620


#  Automated Google Drive to Facebook Ads: One-Click Video Marketing Workflow

### 1. Workflow Overview

This workflow automates the process of video marketing by integrating Google Drive and Facebook Ads platforms. It is designed to fetch video files stored in Google Drive, download them, upload these videos to a Facebook Ad Account, and then create Facebook ad creatives using the uploaded videos. This enables marketers to launch video ad campaigns with a single manual trigger, simplifying content publishing and ad creation.

The workflow is logically divided into the following blocks:

- **1.1 Input Trigger**: Manual initiation of the workflow.
- **1.2 Google Drive Video Handling**: Listing and downloading video files from Google Drive.
- **1.3 Facebook Video Upload and Ad Creative Creation**: Uploading videos to Facebook Ads, extracting video IDs, and creating ad creatives.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Input Trigger

**Overview:**  
This block starts the entire workflow manually, enabling controlled execution on demand.

**Nodes Involved:**  
- Manual Trigger

**Node Details:**  

- **Manual Trigger**  
  - Type: Trigger node, initiates workflow execution manually.  
  - Configuration: Default manual trigger with no parameters.  
  - Expressions/Variables: None.  
  - Input: None (start node).  
  - Output: Triggers "List Drive Videos" node.  
  - Version: v1.  
  - Edge Cases: User must manually start; no automatic scheduling or triggers.  
  - Sticky Note: "Starts the workflow manually".

---

#### Block 1.2: Google Drive Video Handling

**Overview:**  
This block fetches video files from Google Drive by listing files matching criteria and downloads each selected video for further processing.

**Nodes Involved:**  
- List Drive Videos  
- Download Video

**Node Details:**  

- **List Drive Videos**  
  - Type: Google Drive node (file listing).  
  - Configuration: Set to fetch a file named "video1.pdf" (note: name suggests PDF, but sticky note states MP4 videos - possible mismatch to review).  
  - Credentials: Uses Google Drive OAuth2 credentials named "Google Drive account 2".  
  - Expressions/Variables: None explicit; static file name used for filtering.  
  - Input: Triggered from Manual Trigger.  
  - Output: Passes file metadata to "Download Video".  
  - Version: v2.  
  - Edge Cases:  
    - File not found if filename doesn't match.  
    - Permissions error if credentials lack access.  
    - Mismatch between expected MP4 video and PDF file name may cause logic failure.  
  - Sticky Note: "Fetches video files (MP4) from Google Drive".

- **Download Video**  
  - Type: Google Drive node (file download).  
  - Configuration: Downloads file using fileId dynamically from input list.  
  - Credentials: Google Drive OAuth2 credentials "Google Drive account 2".  
  - Expressions/Variables: File ID is dynamically obtained from previous node outputs.  
  - Input: Receives file metadata from "List Drive Videos".  
  - Output: Sends file binary data to "Upload Video to FB".  
  - Version: v2.  
  - Edge Cases:  
    - Download failure if file ID invalid or access revoked.  
    - Timeout if file is large or network issues.  
  - Sticky Note: "Downloads the selected video".

---

#### Block 1.3: Facebook Video Upload and Ad Creative Creation

**Overview:**  
This block uploads downloaded videos to Facebook Video Ads, extracts the returned video ID, and creates an ad creative linked to the uploaded video.

**Nodes Involved:**  
- Upload Video to FB  
- Extract Video ID  
- Create Ad Creative

**Node Details:**  

- **Upload Video to FB**  
  - Type: HTTP Request node.  
  - Configuration:  
    - POST request to Facebook Graph API endpoint `https://graph-video.facebook.com/v19.0/{{ $json.ad_account_id }}/advideos`.  
    - Uses header-based authentication (likely OAuth token in headers).  
    - Uploads video binary to Facebook Ads account.  
  - Expressions/Variables: `{{ $json.ad_account_id }}` dynamically references Ad Account ID from input JSON.  
  - Input: Receives binary video data from "Download Video".  
  - Output: Passes Facebook API response JSON (video upload result) to "Extract Video ID".  
  - Version: v3.  
  - Edge Cases:  
    - Authentication failure (expired or invalid token).  
    - API rate limits or quota exceeded.  
    - Upload failure for large files or network issues.  
  - Sticky Note: "Uploads video to Facebook Ad Account".

- **Extract Video ID**  
  - Type: Function node.  
  - Configuration: Custom JavaScript function extracting video ID from Facebook response and appending Ad Account and Page IDs.  
  - Function code:  
    ```javascript
    return items.map(item => ({
      json: {
        video_id: item.json.id,
        ad_account_id: 'act_YOUR_AD_ACCOUNT_ID',
        page_id: 'YOUR_PAGE_ID'
      }
    }));
    ```  
  - Input: Receives JSON response from "Upload Video to FB".  
  - Output: Passes structured data to "Create Ad Creative".  
  - Version: v1.  
  - Edge Cases:  
    - Missing or malformed `id` in Facebook response leading to errors.  
    - Hardcoded Ad Account and Page IDs require manual update before use.  
  - Sticky Note: "Prepares ID and Ad Account/Page info".

- **Create Ad Creative**  
  - Type: HTTP Request node.  
  - Configuration:  
    - POST to Facebook Graph API endpoint `https://graph.facebook.com/v19.0/{{ $json.ad_account_id }}/adcreatives`.  
    - Header authentication.  
    - Uses video ID and account info to create ad creative.  
  - Expressions/Variables: `{{ $json.ad_account_id }}` dynamically used again.  
  - Input: Receives JSON with video ID and account info from "Extract Video ID".  
  - Output: Final response from Facebook ad creative API call.  
  - Version: v3.  
  - Edge Cases:  
    - Authentication or permission issues.  
    - Invalid video ID or ad account details causing API errors.  
  - Sticky Note: "Creates the ad creative using uploaded video".

---

### 3. Summary Table

| Node Name          | Node Type          | Functional Role                            | Input Node(s)         | Output Node(s)         | Sticky Note                                             |
|--------------------|--------------------|-------------------------------------------|-----------------------|------------------------|---------------------------------------------------------|
| Manual Trigger      | Manual Trigger     | Starts workflow manually                   | -                     | List Drive Videos       | Starts the workflow manually                            |
| List Drive Videos   | Google Drive       | Fetches video files (MP4) from Google Drive| Manual Trigger        | Download Video          | Fetches video files (MP4) from Google Drive             |
| Download Video      | Google Drive       | Downloads the selected video                | List Drive Videos      | Upload Video to FB      | Downloads the selected video                             |
| Upload Video to FB  | HTTP Request       | Uploads video to Facebook Ad Account        | Download Video         | Extract Video ID        | Uploads video to Facebook Ad Account                     |
| Extract Video ID    | Function           | Extracts video ID and prepares account info | Upload Video to FB     | Create Ad Creative      | Prepares ID and Ad Account/Page info                     |
| Create Ad Creative  | HTTP Request       | Creates the ad creative using the uploaded video | Extract Video ID       | -                      | Creates the ad creative using uploaded video            |
| Sticky Note        | Sticky Note         | Various notes for user guidance             | -                     | -                      | "Automatically fetches all MP4 videos from a Google Drive folder..." (covers overall workflow) |
| Sticky Note1       | Sticky Note         | Manual trigger note                         | -                     | -                      | Starts the workflow manually                            |
| Sticky Note2       | Sticky Note         | Google Drive video fetch note               | -                     | -                      | Fetches video files (MP4) from Google Drive             |
| Sticky Note3       | Sticky Note         | Download video note                         | -                     | -                      | Downloads the selected video                             |
| Sticky Note4       | Sticky Note         | FB upload note                             | -                     | -                      | Uploads video to Facebook Ad Account                     |
| Sticky Note5       | Sticky Note         | Extract Video ID note                       | -                     | -                      | Prepares ID and Ad Account/Page info                     |
| Sticky Note6       | Sticky Note         | Create Ad Creative note                     | -                     | -                      | Creates the ad creative using uploaded video            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add a "Manual Trigger" node. No parameters required. Connect it as the workflow starting point.

2. **Add Google Drive 'List' Node**  
   - Add a "Google Drive" node configured for the "List" operation.  
   - Set the filename filter to `"video1.pdf"` (note: adjust to match actual MP4 video files to avoid mismatch).  
   - Attach Google Drive OAuth2 credentials configured with access to your Drive folders.  
   - Connect the output of "Manual Trigger" to this node.

3. **Add Google Drive 'Download' Node**  
   - Add another "Google Drive" node configured for the "Download" operation.  
   - Set the `fileId` parameter to dynamically use the file ID from the "List Drive Videos" output. Use expressions to map file IDs.  
   - Use the same Google Drive credentials as the previous node.  
   - Connect the output of "List Drive Videos" to this node.

4. **Add HTTP Request Node for Facebook Upload**  
   - Add an "HTTP Request" node.  
   - Configure it to POST to `https://graph-video.facebook.com/v19.0/{{ $json.ad_account_id }}/advideos`.  
   - Set authentication to "Header Auth" with Facebook OAuth token for the Ad Account.  
   - Map the binary video data from "Download Video" as the request payload.  
   - Connect the output of "Download Video" to this node.

5. **Add Function Node to Extract Video ID**  
   - Add a "Function" node.  
   - Paste the following code:  
     ```javascript
     return items.map(item => ({
       json: {
         video_id: item.json.id,
         ad_account_id: 'act_YOUR_AD_ACCOUNT_ID',
         page_id: 'YOUR_PAGE_ID'
       }
     }));
     ```  
   - Replace `'act_YOUR_AD_ACCOUNT_ID'` and `'YOUR_PAGE_ID'` with your actual Facebook Ad Account ID and Facebook Page ID strings.  
   - Connect the output of the Facebook Upload node to this function.

6. **Add HTTP Request Node for Creating Ad Creative**  
   - Add another "HTTP Request" node.  
   - Configure to POST to `https://graph.facebook.com/v19.0/{{ $json.ad_account_id }}/adcreatives`.  
   - Use header authentication with the same Facebook OAuth token.  
   - Map the JSON containing video ID and account info from the Function node as the payload.  
   - Connect the output of the Function node to this node.

**Notes on Credentials:**  
- Google Drive OAuth2 credentials must have permissions to list and download files.  
- Facebook OAuth token must have permissions to upload videos and create ad creatives on the specified Ad Account.

**Default Values & Constraints:**  
- Filename filter in Google Drive node should be updated to match actual video files (likely `.mp4` extension).  
- Facebook Ad Account ID and Page ID in the Function node must be replaced before running.  
- The workflow runs manually; no scheduling implemented.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                          |
|----------------------------------------------------------------------------------------------------------------------|-----------------------------------------|
| The workflow automatically fetches MP4 videos from Google Drive and uploads them to Facebook Ads for video marketing.| Overall workflow purpose (sticky note). |
| Facebook Graph API version v19.0 is used for video upload and ad creative creation.                                   | API endpoints in HTTP Request nodes.    |
| Facebook Ad Account ID and Page ID must be set manually in the Function node before running the workflow.             | Important credential/configuration step.|
| Potential mismatch in filename filter ("video1.pdf") should be reviewed and corrected to target video files (MP4).    | Critical for correct file selection.     |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.