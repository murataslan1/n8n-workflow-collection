Automate Facebook Reels Publishing with Google Sheets and Drive

https://n8nworkflows.xyz/workflows/automate-facebook-reels-publishing-with-google-sheets-and-drive-10122


# Automate Facebook Reels Publishing with Google Sheets and Drive

### 1. Workflow Overview

This workflow automates the publishing of Facebook Reels by integrating Google Sheets and Google Drive with the Facebook Graph API. It is designed for social media managers or marketers who want to schedule and publish video content (Reels) on a Facebook Page using data stored in Google Sheets and videos stored in Google Drive.

The workflow is divided into two main logical blocks:

- **1.1 Video Inventory Synchronization:** Automatically scan a specified Google Drive folder for new MP4 video files and update the file metadata (name, ID, share link) into a Google Sheet that serves as a video inventory.

- **1.2 Facebook Reel Publishing Sequence:** Periodically check the Google Sheet for new video entries with associated metadata and captions, download the video from Drive, and perform a multi-step Facebook Reel upload (initialize upload session, upload video in chunks, finalize and publish). After publishing, the workflow updates the Google Sheet with the published post link and optionally posts a comment on the Reel.

---

### 2. Block-by-Block Analysis

#### 2.1 Video Inventory Synchronization

**Overview:**  
This block periodically searches a specific Google Drive folder for new MP4 video files and updates or appends their details into a dedicated Google Sheet. This maintains an up-to-date inventory of available videos for publishing.

**Nodes Involved:**  
- Schedule Trigger1  
- Search files and folders (Google Drive)  
- Append or update row in sheet (Google Sheets)  
- Sticky Note (documentation)

**Node Details:**

- **Schedule Trigger1**  
  - Type: Schedule Trigger  
  - Role: Initiates the inventory sync process periodically (default unspecified interval, likely manual or placeholder)  
  - Configuration: Interval not detailed (empty object), so likely requires setup for desired frequency  
  - Inputs: None (start node)  
  - Outputs: Triggers "Search files and folders"  
  - Edge cases: Misconfigured interval results in no trigger; no error handling needed here

- **Search files and folders**  
  - Type: Google Drive  
  - Role: Queries a specific Drive folder (folderId: "16tm-jSUaz4B4Xk8Dc0h-jxxKVydzwHKJ") for all video files with MIME type "video/mp4"  
  - Configuration: Uses query string to filter by MIME type, returns all matching files with fields `id` and `name`  
  - Credentials: Google Drive OAuth2  
  - Inputs: Trigger from Schedule Trigger1  
  - Outputs: Sends file metadata to "Append or update row in sheet"  
  - Edge cases: Folder access denied or empty folder; handles empty results by no rows appended

- **Append or update row in sheet**  
  - Type: Google Sheets  
  - Role: Inserts new or updates existing rows in the "Video stories facebook" sheet with video name, File ID, and a Drive share link  
  - Configuration:
    - Matching column: "File ID" to update existing rows  
    - Columns updated: Name, File ID, Link Share (constructed as direct download URL)  
    - Sheet and Document IDs preset  
  - Credentials: Google Sheets OAuth2  
  - Inputs: Output from "Search files and folders"  
  - Outputs: None (terminal for this branch)  
  - Edge cases: Sheet access issues, matching conflicts, or malformed data

- **Sticky Note (Video Inventory Documentation)**  
  - Type: Sticky Note  
  - Role: Provides contextual information for users about the video inventory sync block  
  - Content: Explains the block’s purpose to periodically update MP4 video listings from Drive to Sheets

---

#### 2.2 Facebook Reel Publishing Sequence

**Overview:**  
This block schedules regular checks of the Google Sheet for new videos ready to be published as Facebook Reels. It downloads the video from Drive, performs the multi-step Facebook video upload API calls per Facebook's required protocol, publishes the Reel with a caption, posts a comment, and updates the Google Sheet with the post URL.

**Nodes Involved:**  
- Schedule Trigger  
- info (Set node for credentials)  
- Get Row Sheet (Google Sheets)  
- If (conditional check for valid File ID)  
- Step 1: Initialize an Upload Session (HTTP Request)  
- Google Drive (Download video)  
- Get the size file (Code node)  
- Step 2: Upload the Video (HTTP Request)  
- Step 3: Publish the Reel (HTTP Request)  
- Update status (Google Sheets)  
- Wait (Wait node)  
- Create comment post (HTTP Request)  
- Sticky Note (workflow documentation)

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Periodically triggers the publishing sequence every 30 minutes  
  - Configuration: Interval set to every 30 minutes  
  - Inputs: None (start node)  
  - Outputs: Triggers "info" node  
  - Edge cases: Scheduling misconfiguration prevents workflow execution

- **info**  
  - Type: Set  
  - Role: Stores sensitive credentials and config parameters (Facebook Token and Page ID)  
  - Configuration: Static strings for "Token" and "Id Page" (placeholder values `<token>`, `<id page>`)  
  - Inputs: Trigger from Schedule Trigger  
  - Outputs: Triggers "Get Row Sheet"  
  - Edge cases: Missing or invalid token/page ID breaks Facebook API calls

- **Get Row Sheet**  
  - Type: Google Sheets  
  - Role: Reads rows from Google Sheet ("Publish a reel on a Facebook Page") containing video data and captions  
  - Configuration: Reads from first sheet (gid=0) of specified document ID  
  - Credentials: Google Sheets OAuth2  
  - Inputs: From "info"  
  - Outputs: Triggers "If" node  
  - Edge cases: Sheet access errors, empty sheet, or malformed data

- **If**  
  - Type: If (conditional)  
  - Role: Filters rows to only those with a non-empty "File ID" field  
  - Configuration: Checks if `File ID` is not empty  
  - Inputs: From "Get Row Sheet"  
  - Outputs:  
    - True: triggers "Step 1: Initialize an Upload Session"  
    - False: loops back to "Get Row Sheet" for next data (or no-op)  
  - Edge cases: Empty or invalid File ID skips upload process

- **Step 1: Initialize an Upload Session**  
  - Type: HTTP Request  
  - Role: Starts the Facebook video upload session via Graph API for Reels  
  - Configuration:  
    - Method: POST  
    - URL: `https://graph.facebook.com/v23.0/{PageID}/video_reels`  
    - Query parameters: `upload_phase=start`, `access_token` from "info"  
    - Response: Full HTTP response required (for upload URL and video ID)  
  - Inputs: From "If" (true branch)  
  - Outputs: Triggers "Google Drive" node  
  - Edge cases: Invalid token, permissions errors, API version deprecation, network timeout

- **Google Drive**  
  - Type: Google Drive  
  - Role: Downloads the video file from Drive using the "File ID" from the Google Sheet row  
  - Configuration:  
    - Operation: download  
    - File ID: dynamically from current row's `File ID` field  
    - Binary property name for output: "data"  
  - Credentials: Google Drive OAuth2  
  - Inputs: From "Step 1"  
  - Outputs: Triggers "Get the size file"  
  - Edge cases: File not found, permission denied, large file download limits

- **Get the size file**  
  - Type: Code (JavaScript)  
  - Role: Calculates the actual binary size of the downloaded file and declares it for Facebook upload  
  - Configuration:  
    - Reads base64 binary data length for accurate size  
    - Returns JSON with `declaredSize` and `actualSize`  
  - Inputs: From "Google Drive"  
  - Outputs: Triggers "Step 2: Upload the Video"  
  - Edge cases: Binary data missing or corrupted

- **Step 2: Upload the Video**  
  - Type: HTTP Request  
  - Role: Uploads the video content to Facebook using the upload URL obtained in Step 1  
  - Configuration:  
    - Method: POST  
    - URL: taken from `upload_url` in Step 1 response  
    - Content type: binaryData  
    - Headers include offset=0, file_size from "Get the size file", Authorization header with OAuth token  
    - Body: binary data from Google Drive download  
  - Inputs: From "Get the size file"  
  - Outputs: Triggers "Step 3: Publish the Reel"  
  - Edge cases: Upload URL expiration, partial upload errors, authorization failure

- **Step 3: Publish the Reel**  
  - Type: HTTP Request  
  - Role: Completes the upload by sending a finish signal, setting the Reel description, and publishing it  
  - Configuration:  
    - Method: POST  
    - URL: `https://graph.facebook.com/v23.0/{PageID}/video_reels`  
    - Query params: `upload_phase=finish`, `video_id` from Step 1, `access_token`, `video_state=PUBLISHED`, `description` from Google Sheet caption  
    - Full HTTP response required  
  - Inputs: From "Step 2"  
  - Outputs: Triggers "Update status" and "Wait"  
  - Edge cases: Publish failures, invalid video ID, token expiration

- **Update status**  
  - Type: Google Sheets  
  - Role: Updates the original row in Google Sheet with the Facebook Reel post link ("Link post")  
  - Configuration:  
    - Matching column: `row_number` from original row  
    - Updates "Link post" with "x" (likely placeholder, should be updated to actual post URL if available)  
    - Uses same Sheet and Document ID as "Get Row Sheet"  
  - Credentials: Google Sheets OAuth2  
  - Inputs: From "Step 3"  
  - Outputs: None  
  - Edge cases: Sheet write permission, invalid row number

- **Wait**  
  - Type: Wait  
  - Role: Delays next step by a configurable time (minutes)  
  - Configuration: Unit in minutes (value not explicitly set)  
  - Inputs: From "Step 3"  
  - Outputs: Triggers "Create comment post"  
  - Edge cases: Misconfigured wait time

- **Create comment post**  
  - Type: HTTP Request  
  - Role: Posts a comment under the published Reel with a promotional message and affiliate link  
  - Configuration:  
    - Method: POST  
    - URL: Facebook Graph API comments endpoint for the video post (note: hardcoded video ID prefix `115432036514099_` concatenated with video_id from Step 1)  
    - Query params: `access_token`, `message` constructed with affiliate link from Google Sheet row field `Link Aff 1`  
  - Inputs: From "Wait"  
  - Outputs: None  
  - Error Handling: On error, continues regular output without stopping workflow  
  - Edge cases: Incorrect video ID construction, invalid token, comment posting limits

- **Sticky Note (Publishing Documentation)**  
  - Type: Sticky Note  
  - Role: Provides detailed documentation on the publishing workflow, including prerequisites and links to example sheets and instructions  
  - Content includes links to Google Sheet example and official n8n example workflow for publishing Reels

---

### 3. Summary Table

| Node Name                         | Node Type            | Functional Role                              | Input Node(s)                   | Output Node(s)                                      | Sticky Note                                                                                                                              |
|----------------------------------|----------------------|----------------------------------------------|--------------------------------|----------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger                 | Schedule Trigger     | Initiates publishing workflow every 30 mins | None                           | info                                               |                                                                                                                                          |
| info                            | Set                  | Stores Facebook Page ID and Token            | Schedule Trigger               | Get Row Sheet                                      |                                                                                                                                          |
| Get Row Sheet                   | Google Sheets        | Reads rows with video data and captions      | info                          | If                                                 |                                                                                                                                          |
| If                             | If                   | Filters rows with non-empty File ID          | Get Row Sheet                 | Step 1: Initialize an Upload Session (true) / Get Row Sheet (false) |                                                                                                                                          |
| Step 1: Initialize an Upload Session | HTTP Request         | Starts Facebook video upload session         | If (true)                    | Google Drive                                        |                                                                                                                                          |
| Google Drive                   | Google Drive         | Downloads video file from Drive               | Step 1                       | Get the size file                                  |                                                                                                                                          |
| Get the size file              | Code                 | Calculates actual file size from binary data | Google Drive                 | Step 2: Upload the Video                           |                                                                                                                                          |
| Step 2: Upload the Video       | HTTP Request         | Uploads video binary to Facebook              | Get the size file             | Step 3: Publish the Reel                           |                                                                                                                                          |
| Step 3: Publish the Reel       | HTTP Request         | Finalizes upload and publishes the Reel      | Step 2                       | Update status, Wait                                |                                                                                                                                          |
| Update status                  | Google Sheets        | Updates Sheet row with post link              | Step 3                       | None                                               |                                                                                                                                          |
| Wait                          | Wait                 | Waits before posting a comment                 | Step 3                       | Create comment post                                |                                                                                                                                          |
| Create comment post            | HTTP Request         | Posts comment on Facebook Reel                 | Wait                         | None                                               |                                                                                                                                          |
| Schedule Trigger1              | Schedule Trigger     | Initiates video inventory sync (unspecified) | None                         | Search files and folders                           |                                                                                                                                          |
| Search files and folders       | Google Drive         | Searches Drive folder for MP4 videos           | Schedule Trigger1            | Append or update row in sheet                      |                                                                                                                                          |
| Append or update row in sheet  | Google Sheets        | Updates or appends video details to Sheet     | Search files and folders      | None                                               |                                                                                                                                          |
| Sticky Note                   | Sticky Note          | Documentation for publishing workflow          | None                         | None                                               | See detailed publishing instructions and links here: [Google Sheet example](https://docs.google.com/spreadsheets/d/1JMT2BpWxfcG-d_XEWRppdSr_ZkG0XvtiaGaB8Lzdl78/edit?usp=sharing), [n8n workflow example](https://n8n.io/workflows/10038) |
| Sticky Note1                  | Sticky Note          | Documentation for video inventory synchronization | None                         | None                                               | Explains automation of Drive video list update to Google Sheet                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Set interval to every 30 minutes  
   - Name: "Schedule Trigger"

2. **Create a Set node named "info"**  
   - Add two string parameters: "Token" and "Id Page"  
   - Set their values to your Facebook Page Access Token and Page ID respectively  
   - Connect "Schedule Trigger" output to "info" input

3. **Add a Google Sheets node named "Get Row Sheet"**  
   - Operation: Read rows  
   - Document ID: Your Google Sheet ID containing video info and captions  
   - Sheet Name: Use the first sheet or specify by gid=0  
   - Credentials: Google Sheets OAuth2 account  
   - Connect "info" output to "Get Row Sheet" input

4. **Add an If node named "If"**  
   - Condition: Check if `File ID` field is not empty  
   - Connect "Get Row Sheet" output to "If" input

5. **Add an HTTP Request node named "Step 1: Initialize an Upload Session"**  
   - Method: POST  
   - URL: `https://graph.facebook.com/v23.0/{{ $json["Id Page"] }}/video_reels`  
   - Query parameters:  
     - `upload_phase`: "start"  
     - `access_token`: Token from "info" node  
   - Response: Full HTTP response  
   - Connect "If" (true output) to this node

6. **Add a Google Drive node named "Google Drive"**  
   - Operation: Download file  
   - File ID: from "Get Row Sheet" row field `File ID`  
   - Binary property name: "data"  
   - Credentials: Google Drive OAuth2 account  
   - Connect "Step 1: Initialize an Upload Session" output to this node

7. **Add a Code node named "Get the size file"**  
   - Paste the JavaScript code to calculate actual binary size from base64 data  
   - Connect "Google Drive" output to this node

8. **Add an HTTP Request node named "Step 2: Upload the Video"**  
   - Method: POST  
   - URL: Use `upload_url` from Step 1 response (`={{ $('Step 1: Initialize an Upload Session').first().json.body.upload_url }}`)  
   - Content type: binaryData  
   - Headers:  
     - offset: "0"  
     - file_size: actual size from "Get the size file" node  
     - Authorization: `OAuth <Token>` from "info"  
   - Body: binary data from "Google Drive" node  
   - Connect "Get the size file" output to this node

9. **Add an HTTP Request node named "Step 3: Publish the Reel"**  
   - Method: POST  
   - URL: `https://graph.facebook.com/v23.0/{{ $json["Id Page"] }}/video_reels`  
   - Query parameters:  
     - `upload_phase`: "finish"  
     - `video_id`: obtained from Step 1 response  
     - `access_token`: Token from "info"  
     - `video_state`: "PUBLISHED"  
     - `description`: Caption from Google Sheet row  
   - Response: Full HTTP response  
   - Connect "Step 2: Upload the Video" output to this node

10. **Add a Google Sheets node named "Update status"**  
    - Operation: Update row  
    - Document ID and Sheet Name: same as "Get Row Sheet"  
    - Matching column: `row_number` from Google Sheet row  
    - Update column "Link post" with the published post link (or placeholder "x")  
    - Connect "Step 3: Publish the Reel" output to this node

11. **Add a Wait node**  
    - Unit: minutes  
    - Set desired delay time (e.g., 1 or 2 minutes)  
    - Connect "Step 3: Publish the Reel" output to this node

12. **Add an HTTP Request node named "Create comment post"**  
    - Method: POST  
    - URL: `https://graph.facebook.com/v23.0/{PageVideoPostID}/comments`  
      - Replace `{PageVideoPostID}` by concatenating your page post prefix and the video ID from Step 1  
    - Query parameters:  
      - `access_token`: Token from "info"  
      - `message`: Construct message with affiliate link from Google Sheet (e.g., "Mua hàng tại Shopee: {{ Link Aff 1 }}")  
    - Error handling: Set to continue on error  
    - Connect "Wait" output to this node

13. **Connect the false output of the If node back to "Get Row Sheet" or end gracefully**  
    - This ensures only valid rows proceed

14. **Configure credentials:**  
    - Set up Google Sheets OAuth2 credentials for all Google Sheets nodes  
    - Set up Google Drive OAuth2 credentials for Google Drive nodes  
    - Facebook Page access token and Page ID in the "info" node

15. **Optional:** Add Sticky Notes to document workflow sections for maintainability

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                  | Context or Link                                                                                                   |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| For detailed instructions on obtaining Facebook Page ID and Page Access Token with needed permissions, see the official n8n workflow example for publishing Reels.                                                            | https://n8n.io/workflows/10038                                                                                   |
| Ready-to-use Google Sheet example for video metadata and captions to use with this workflow template.                                                                                                                         | https://docs.google.com/spreadsheets/d/1JMT2BpWxfcG-d_XEWRppdSr_ZkG0XvtiaGaB8Lzdl78/edit?usp=sharing             |
| Facebook video upload requires a multi-step process: initialize upload session, upload video chunks, then finalize and publish. This workflow implements this process using Facebook Graph API v23.0.                          | Facebook Graph API documentation on video uploads                                                               |
| Videos must be in MP4 format and stored inside a shared Google Drive folder accessible by the connected Google account in n8n.                                                                                                | Workflow precondition                                                                                             |
| Posting comments under the published Reel is optional and includes a promotional affiliate message; failure to post comments does not halt the workflow.                                                                       | Error handling strategy                                                                                           |

---

**Disclaimer:**  
The text provided is exclusively derived from an n8n automated workflow. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.