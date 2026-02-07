Automate Video Story Publishing to Facebook Page using Google Drive and Sheets

https://n8nworkflows.xyz/workflows/automate-video-story-publishing-to-facebook-page-using-google-drive-and-sheets-10067


# Automate Video Story Publishing to Facebook Page using Google Drive and Sheets

### 1. Workflow Overview

This workflow automates the end-to-end process of publishing video stories to a Facebook Page using video files stored in Google Drive and metadata managed in Google Sheets. It is divided into two main logical blocks:

**1.1 Google Drive Video File Discovery and Google Sheets Update**  
Periodically searches a specific Google Drive folder for new MP4 video files. It then appends or updates their metadata (name, file ID, shareable link) in a Google Sheet to maintain an up-to-date catalog of available videos.

**1.2 Facebook Page Video Story Upload (3-Step Process)**  
On a scheduled basis, this block reads video metadata from the Google Sheet, downloads the video from Google Drive, and then uploads it to a Facebook Page’s video stories using Facebook’s multi-phase upload API. It tracks and updates the upload status back into the Google Sheet.

---

### 2. Block-by-Block Analysis

#### 2.1 Google Drive Video File Discovery and Google Sheets Update

- **Overview:**  
This block periodically queries a designated Google Drive folder for MP4 videos, extracts their IDs, names, and generates direct download links, then appends or updates this data into a Google Sheet.

- **Nodes Involved:**  
  - Schedule Trigger1  
  - Search files and folders (Google Drive)  
  - Append or update row in sheet (Google Sheets)  
  - Sticky Note (descriptive only)

- **Node Details:**

1. **Schedule Trigger1**  
   - Type: Schedule Trigger  
   - Role: Initiates the discovery process on a schedule (interval unspecified, default trigger)  
   - Config: Executes on a periodic basis as configured (empty interval implying default or manual trigger)  
   - Connections: Outputs to "Search files and folders"

2. **Search files and folders**  
   - Type: Google Drive node (file/folder search)  
   - Role: Searches the folder with ID `16tm-jSUaz4B4Xk8Dc0h-jxxKVydzwHKJ` for files where MIME type is 'video/mp4'  
   - Config: Uses query to filter MP4 files, returns all matching files with fields: id, name  
   - Credentials: Uses linked Google Drive OAuth2 account  
   - Input: Trigger from Schedule Trigger1  
   - Output: Passes found files to "Append or update row in sheet"  
   - Edge Cases:  
     - Permission errors on Drive folder access  
     - Empty folder returns no results (workflow continues gracefully)  

3. **Append or update row in sheet**  
   - Type: Google Sheets node  
   - Role: Inserts or updates rows in the specified Google Sheet with video metadata: Name, File ID, Link Share  
   - Config:  
     - Document ID: Google Sheet ID `1RnE5O06l7W6TLCLKkwEH5Oyl-EZ3OE-Uc3OWFbDohYI`  
     - Sheet: GID 0 (default sheet)  
     - Columns mapped:  
       - Name: file name from Drive  
       - File ID: Drive file ID  
       - Link Share: constructed download URL `https://drive.google.com/uc?id={{fileId}}&export=download`  
     - Matching on "File ID" to avoid duplicates  
   - Credentials: Google Sheets OAuth2 account  
   - Input: From "Search files and folders"  
   - Output: None specified  
   - Edge Cases:  
     - Sheet access permission errors  
     - Matching failures if schema changes  
     - Rate limiting on Google Sheets API  

4. **Sticky Note** (informational)  
   - Content: Describes this block as "Automated Google Drive Video List Update to Google Sheet"  
   - Role: Documentation only  

---

#### 2.2 Facebook Page Video Story Upload (3-Step Process)

- **Overview:**  
This block uploads a video to Facebook Page Stories using Facebook's multipart upload process: initializing an upload session, uploading the video binary, then finalizing the post. It uses video metadata from Google Sheets and downloads the video content from Google Drive.

- **Nodes Involved:**  
  - Schedule Trigger  
  - info (Set node)  
  - If  
  - Get Row Sheet (Google Sheets)  
  - Step 1: Initialize session (HTTP Request)  
  - Google Drive (download video)  
  - Set to the total size in bytes (Code node)  
  - Step 2: Upload the stored file (HTTP Request)  
  - Step 3. Post video (HTTP Request)  
  - Get upload status (HTTP Request)  
  - Update upload status in sheet (Google Sheets)  
  - Sticky Note1 (descriptive)

- **Node Details:**

1. **Schedule Trigger**  
   - Type: Schedule Trigger  
   - Role: Starts the Facebook upload process every 2 hours at minute 30  
   - Config: Interval trigger every 2 hours, triggers at minute 30  
   - Output: Passes flow to "info" node  

2. **info**  
   - Type: Set node  
   - Role: Stores Facebook Page ID and Access Token as static strings for use in HTTP requests  
   - Config:  
     - ID Page: `<id page>` (to be replaced with actual Facebook Page ID)  
     - Token: `<token>` (to be replaced with valid access token)  
   - Output: Passes credentials to next nodes  

3. **If**  
   - Type: Conditional node  
   - Role: Checks if the "File ID" field from the Google Sheets data is non-empty as a condition to continue  
   - Config: Condition: `File ID` is not empty  
   - Input: From "Get Row Sheet"  
   - Outputs:  
     - True: proceeds to "Step 1: Initialize session"  
     - False: proceeds to "Get Row Sheet" (loop or skip)  

4. **Get Row Sheet**  
   - Type: Google Sheets node  
   - Role: Retrieves a single row from the Google Sheet matching the "Stories" column filter (dynamic input)  
   - Config:  
     - Document ID: same Google Sheet as before  
     - Sheet: GID 0  
     - Return first match only  
     - Filter on "Stories" column using input expression  
   - Credentials: Google Sheets OAuth2  
   - Output: Passes matched row to "If" node  

5. **Step 1: Initialize session**  
   - Type: HTTP Request  
   - Role: Begins Facebook's video story upload session by sending POST to `/video_stories` endpoint with `upload_phase=start`  
   - Config:  
     - URL: `https://graph.facebook.com/v23.0/{{Page ID}}/video_stories`  
     - Method: POST  
     - Query Params:  
       - upload_phase: start  
       - access_token: Facebook token  
     - Executes once per trigger  
   - Output: Upload session info including upload URL and video ID passed to next node  
   - On Error: Continue regular output (avoids stopping workflow on errors)  
   - Edge Cases:  
     - Invalid token or permissions error  
     - API rate limiting  
     - Unexpected response format  

6. **Google Drive**  
   - Type: Google Drive node  
   - Role: Downloads the video file selected by "File ID" from the Google Sheet row  
   - Config:  
     - Operation: Download file by ID  
     - File ID: dynamically from previous node output  
     - Output binary under property "data"  
   - Credentials: Google Drive OAuth2  
   - Input: From "Step 1: Initialize session" output  
   - Edge Cases:  
     - File not found or access denied on Drive  
     - Large files may cause timeout or memory issues  

7. **Set to the total size in bytes**  
   - Type: Code node (JavaScript)  
   - Role: Calculates the actual size of the downloaded binary video data (in bytes) for upload headers  
   - Config: Reads binary property 'data', computes length of base64 decoded data and declared file size, stores in JSON keys `declaredSize` and `actualSize`  
   - Input: From Google Drive download  
   - Output: Passes size info to next node  
   - Edge Cases:  
     - Binary data not present or corrupted  
     - Difference between declared and actual size  

8. **Step 2: Upload the stored file**  
   - Type: HTTP Request  
   - Role: Uploads video binary data to Facebook using the upload URL provided in Step 1  
   - Config:  
     - URL: dynamically from Step 1 response field `upload_url`  
     - Method: POST  
     - Content-Type: binaryData  
     - Headers:  
       - offset: 0 (start of upload)  
       - file_size: actual size from previous node  
       - Authorization: OAuth token  
     - Body: binary video data (`data` property)  
   - On Error: continue regular output  
   - Input: From "Set to the total size in bytes"  
   - Edge Cases:  
     - Upload URL expired or invalid  
     - Network errors or timeouts  
     - Authorization failures  

9. **Step 3. Post video**  
   - Type: HTTP Request  
   - Role: Finalizes video upload by sending `upload_phase=finish` with the video ID to post the video to Facebook stories  
   - Config:  
     - URL: `https://graph.facebook.com/v23.0/{{Page ID}}/video_stories`  
     - Method: POST  
     - Query Params:  
       - video_id: from Step 1 response  
       - upload_phase: finish  
       - access_token: token  
   - On Error: continue regular output  
   - Output: Passes response to "Get upload status"  
   - Edge Cases:  
     - Invalid video ID  
     - API errors or rejections  

10. **Get upload status**  
    - Type: HTTP Request  
    - Role: Queries Facebook API to check the status of the uploaded video story by video ID  
    - Config:  
      - URL: `https://graph.facebook.com/v23.0/{{video_id}}`  
      - Query: access_token  
      - Method: GET  
    - On Error: continue regular output  
    - Output: Passes status response to next node  

11. **Update upload status in sheet**  
    - Type: Google Sheets node  
    - Role: Updates the Google Sheet with the latest upload status info in the matched row, identified by `row_number`  
    - Config:  
      - Document ID and Sheet same as before  
      - Operation: update row by `row_number`  
      - Columns updated: row_number (minimum), could be extended to status fields if added  
    - Credentials: Google Sheets OAuth2  
    - Input: From "Get upload status"  
    - Edge Cases:  
      - Update failure due to permissions or row_number mismatch  

12. **Sticky Note1** (informational)  
    - Content: Describes this block as "Automated Video Posting to Facebook (3-Step Upload)"  
    - Role: Documentation only  

---

### 3. Summary Table

| Node Name                   | Node Type                 | Functional Role                                   | Input Node(s)               | Output Node(s)               | Sticky Note                                                                                 |
|-----------------------------|---------------------------|--------------------------------------------------|-----------------------------|-----------------------------|---------------------------------------------------------------------------------------------|
| Schedule Trigger1            | Schedule Trigger          | Periodic trigger for Google Drive video discovery| -                           | Search files and folders     | ## Automated Google Drive Video List Update to Google Sheet                                |
| Search files and folders     | Google Drive              | Search MP4 files in specific Drive folder        | Schedule Trigger1            | Append or update row in sheet|                                                                                             |
| Append or update row in sheet| Google Sheets             | Append/update video metadata in Google Sheet     | Search files and folders     | -                           |                                                                                             |
| Schedule Trigger             | Schedule Trigger          | Periodic trigger for Facebook video upload       | -                           | info                        | ## Automated Video Posting to Facebook (3-Step Upload)                                     |
| info                        | Set                       | Store Facebook Page ID and Token                  | Schedule Trigger             | Get Row Sheet               |                                                                                             |
| Get Row Sheet               | Google Sheets             | Retrieve metadata row matching Stories filter    | info                        | If                         |                                                                                             |
| If                          | Conditional               | Check if File ID exists to proceed                | Get Row Sheet               | Step 1: Initialize session / Get Row Sheet |                                                                                             |
| Step 1: Initialize session  | HTTP Request              | Start Facebook upload session                      | If (true output)             | Google Drive                |                                                                                             |
| Google Drive                | Google Drive              | Download video file by ID                          | Step 1: Initialize session  | Set to the total size in bytes|                                                                                             |
| Set to the total size in bytes| Code                     | Compute actual binary size for upload             | Google Drive                | Step 2: Upload the stored file|                                                                                             |
| Step 2: Upload the stored file| HTTP Request             | Upload video binary to Facebook                    | Set to the total size in bytes| Step 3. Post video          |                                                                                             |
| Step 3. Post video          | HTTP Request              | Finalize video story post on Facebook             | Step 2: Upload the stored file| Get upload status           |                                                                                             |
| Get upload status           | HTTP Request              | Query upload status from Facebook                  | Step 3. Post video          | Update upload status in sheet|                                                                                             |
| Update upload status in sheet| Google Sheets             | Update Google Sheet row with upload status        | Get upload status           | -                           |                                                                                             |
| Sticky Note                 | Sticky Note               | Documentation for Google Drive to Sheets block    | -                           | -                           | ## Automated Google Drive Video List Update to Google Sheet                                |
| Sticky Note1                | Sticky Note               | Documentation for Facebook video upload block     | -                           | -                           | ## Automated Video Posting to Facebook (3-Step Upload)                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger1 node**  
   - Type: Schedule Trigger  
   - Configure to run at desired interval (default or specified)  
   - Purpose: Periodically trigger video discovery  

2. **Create Google Drive node (Search files and folders)**  
   - Type: Google Drive (fileFolder resource)  
   - Operation: Search query  
   - Query: `mimeType = 'video/mp4'`  
   - Folder ID: `16tm-jSUaz4B4Xk8Dc0h-jxxKVydzwHKJ`  
   - Fields: `id, name`  
   - Credentials: Connect Google Drive OAuth2 account  
   - Connect output of Schedule Trigger1 to this node  

3. **Create Google Sheets node (Append or update row in sheet)**  
   - Type: Google Sheets  
   - Operation: Append or update row  
   - Document ID: `1RnE5O06l7W6TLCLKkwEH5Oyl-EZ3OE-Uc3OWFbDohYI`  
   - Sheet name / GID: `gid=0`  
   - Columns to map:  
     - Name: `{{$json["name"]}}`  
     - File ID: `{{$json["id"]}}`  
     - Link Share: `https://drive.google.com/uc?id={{$json["id"]}}&export=download`  
   - Matching columns: `File ID`  
   - Credentials: Google Sheets OAuth2 account  
   - Connect output of Google Drive search node to this node  

4. **Create Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Configure to run every 2 hours at minute 30 (e.g., Hours interval=2, Trigger at minute=30)  
   - Purpose: Initiate Facebook upload process  

5. **Create Set node (info)**  
   - Type: Set  
   - Add fields:  
     - ID Page: your Facebook Page ID (string)  
     - Token: your Facebook Page access token (string)  
   - Connect output of Schedule Trigger to this node  

6. **Create Google Sheets node (Get Row Sheet)**  
   - Type: Google Sheets  
   - Operation: Lookup row by filter on "Stories" column (dynamic input)  
   - Document ID and sheet same as before  
   - Options: Return first match only  
   - Credentials: Google Sheets OAuth2 account  
   - Connect output of "info" node to this node  

7. **Create If node**  
   - Type: If  
   - Condition: Check if `File ID` field in input data is not empty  
   - Connect output of "Get Row Sheet" to this node  
   - True output: proceed to Step 1: Initialize session  
   - False output: loop back or end (connect to "Get Row Sheet" or terminate)  

8. **Create HTTP Request node (Step 1: Initialize session)**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://graph.facebook.com/v23.0/{{ $json["ID Page"] }}/video_stories`  
   - Query parameters:  
     - upload_phase=start  
     - access_token={{ $json["Token"] }}  
   - Execute once: true  
   - Connect true output of If node to this node  

9. **Create Google Drive node (Google Drive download)**  
   - Type: Google Drive  
   - Operation: Download  
   - File ID: `{{$json["File ID"]}}` from previous node or sheet data  
   - Binary property name: `data`  
   - Credentials: Google Drive OAuth2  
   - Connect output of Step 1 initialize session node to this node  

10. **Create Code node (Set to the total size in bytes)**  
    - Type: Code (JavaScript)  
    - Code:  
    ```javascript
    return items.map(item => {
      const size = item.binary.data.fileSize;
      const contentLength = Buffer.from(item.binary.data.data, 'base64').length;
      item.json = {
        declaredSize: size,
        actualSize: contentLength
      };
      return item;
    });
    ```  
    - Connect output of Google Drive download node to this node  

11. **Create HTTP Request node (Step 2: Upload the stored file)**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: `={{ $json["body"]["upload_url"] }}` from Step 1 response  
    - Content type: binaryData  
    - Headers:  
      - offset: 0  
      - file_size: `={{ $json["actualSize"] }}`  
      - Authorization: `OAuth {{ $json["Token"] }}`  
    - Send binary data from property `data`  
    - Connect output of Code node to this node  

12. **Create HTTP Request node (Step 3: Post video)**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: `https://graph.facebook.com/v23.0/{{ $json["ID Page"] }}/video_stories`  
    - Query parameters:  
      - video_id: `={{ $json["body"]["video_id"] }}` from Step 1 response  
      - upload_phase: finish  
      - access_token: Facebook token  
    - Connect output of Step 2 upload node to this node  

13. **Create HTTP Request node (Get upload status)**  
    - Type: HTTP Request  
    - Method: GET  
    - URL: `https://graph.facebook.com/v23.0/{{ $json["body"]["video_id"] }}`  
    - Query: access_token  
    - Connect output of Step 3 post video node to this node  

14. **Create Google Sheets node (Update upload status in sheet)**  
    - Type: Google Sheets  
    - Operation: Update row  
    - Document ID and sheet as before  
    - Use row_number from sheet data to identify row  
    - Update relevant upload status columns as needed  
    - Credentials: Google Sheets OAuth2  
    - Connect output of Get upload status node to this node  

---

### 5. General Notes & Resources

| Note Content                                                                 | Context or Link                                  |
|------------------------------------------------------------------------------|-------------------------------------------------|
| The workflow handles the Facebook Page video story upload using multi-phase upload as per Facebook Graph API requirements, including session initialization, chunk upload, and finishing the upload. | Facebook Graph API video upload docs: https://developers.facebook.com/docs/graph-api/video-uploads/ |
| Google Drive and Sheets credentials must be properly configured with OAuth2 and have access permissions to the target folder and spreadsheet. | n8n credential setup documentation             |
| Access token for Facebook must have appropriate permissions (e.g., `pages_manage_posts`, `pages_read_engagement`) and be valid to avoid authentication errors. | Facebook Developer Portal                        |
| The workflow is designed to handle errors gracefully by continuing execution on HTTP request failures, but monitoring logs for errors is recommended. | n8n error handling best practices                |
| Consider file size limitations and rate limits imposed by Facebook and Google APIs to avoid workflow failures. | API documentation for Facebook and Google Drive |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.