Automate Video Uploads to Thumbnails with FFmpeg and Google Drive

https://n8nworkflows.xyz/workflows/automate-video-uploads-to-thumbnails-with-ffmpeg-and-google-drive-7595


# Automate Video Uploads to Thumbnails with FFmpeg and Google Drive

### 1. Workflow Overview

This workflow automates the process of receiving a video file via HTTP upload, validating it as a video, extracting a thumbnail image at the 5-second mark using FFmpeg (auto-installed if missing), uploading that thumbnail to a specified Google Drive folder, and finally responding to the API caller with metadata about the stored thumbnail.  

It is designed for use cases such as video content platforms, media management systems, or any service requiring automatic thumbnail generation and cloud storage for uploaded video content.

**Logical Blocks:**

- **1.1 Input Reception and Validation:** Receives video file uploads via webhook and confirms the file is a video.
- **1.2 File Persistence:** Saves the uploaded video file to a temporary directory for processing.
- **1.3 Thumbnail Extraction:** Runs FFmpeg to extract a single thumbnail image from the video at 5 seconds, ensuring FFmpeg is available by auto-installing if necessary.
- **1.4 Thumbnail Loading:** Reads the extracted thumbnail back into the workflow as binary data.
- **1.5 Upload to Google Drive:** Uploads the thumbnail image to a configured Google Drive folder.
- **1.6 API Response:** Sends a JSON response back to the uploader with detailed metadata about the uploaded thumbnail file.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Validation

- **Overview:**  
Accepts HTTP POST requests at `/mediaUpload`, expecting a multipart form-data upload with a video file. Validates the MIME type to ensure the file is a video before proceeding.

- **Nodes Involved:**  
  - Accept Video Upload (Webhook)  
  - Validate Upload is Video (IF)  

- **Node Details:**

  - **Accept Video Upload (Webhook)**  
    - Type: Webhook  
    - Role: Entry point; listens for HTTP POST requests on `/mediaUpload`.  
    - Configuration:  
      - HTTP Method: POST  
      - Response Mode: Deferred until the last node (response from Respond to Webhook node)  
      - Expects binary file input in the field named `media` via multipart/form-data  
    - Input/Output: Receives HTTP request → outputs item with binary data `media`  
    - Failures: Incorrect HTTP method, missing file, or malformed multipart data could cause errors.  
    - Version: Compatible with n8n v1+  

  - **Validate Upload is Video (IF)**  
    - Type: Conditional (IF) node  
    - Role: Checks that the uploaded file's MIME type contains `video/`.  
    - Configuration:  
      - Condition: `{{$binary.file.mimeType}}` contains `video/`  
      - True branch proceeds; false branch could be developed to return an error response (not implemented here).  
    - Input: Output of Webhook node  
    - Output: True branch → video files; False branch → non-video files (no further processing here)  
    - Failures: If MIME type is missing or malformed, may incorrectly reject or accept files.  
    - Version: Uses v2 IF node syntax  

#### 2.2 File Persistence

- **Overview:**  
Writes the uploaded binary video data to a stable temporary file path on disk (`/tmp`) to enable external command-line processing by FFmpeg.

- **Nodes Involved:**  
  - Persist Upload to /tmp (Write Binary File)  

- **Node Details:**

  - **Persist Upload to /tmp (Write Binary File)**  
    - Type: Write Binary File  
    - Role: Saves binary video file to disk at `/tmp/` using original filename or defaults to `input.mp4`.  
    - Configuration:  
      - File path: `/tmp/<originalFilename>` if available; else `/tmp/input.mp4`  
      - Data property: binary data from `media` field  
    - Input: True branch output of IF node  
    - Output: JSON with `fileName` property containing the saved file path  
    - Failures: Disk write permissions, lack of `/tmp` directory, or filename conflicts could cause errors.  
    - Version: Standard node  

#### 2.3 Thumbnail Extraction

- **Overview:**  
Executes a shell command that attempts to locate FFmpeg in the environment or downloads a static build if missing, then extracts a thumbnail image at the 5-second timestamp from the saved video file.

- **Nodes Involved:**  
  - Extract Thumbnail with FFmpeg (Auto-Install) (Execute Command)  

- **Node Details:**

  - **Extract Thumbnail with FFmpeg (Auto-Install) (Execute Command)**  
    - Type: Execute Command  
    - Role: Runs shell script to ensure availability of FFmpeg, then extracts one thumbnail frame from the video at 5s.  
    - Configuration Highlights:  
      - Checks if `ffmpeg` command exists; uses it if found.  
      - If not found, downloads appropriate static FFmpeg build for the current CPU architecture to `/tmp/ffmpeg`.  
      - Extracts thumbnail with command:  
        `ffmpeg -y -ss 5 -i <video_file> -frames:v 1 -q:v 2 <output_thumbnail>`  
      - Output file: `/tmp/<originalFilename>_thumbnail.jpg`  
    - Inputs: JSON `fileName` from previous node (video path) and original filename from webhook node  
    - Outputs: Writes thumbnail file to disk (no direct binary output)  
    - Failures:  
      - Unsupported CPU architecture for FFmpeg static build  
      - Missing curl/wget for download  
      - FFmpeg execution errors (corrupt input file, permission issues)  
      - Shell script syntax errors  
    - Version: Requires environment capable of running shell commands and supporting tar/xz extraction  

#### 2.4 Thumbnail Loading

- **Overview:**  
Reads the newly created thumbnail image file from `/tmp` back into the workflow's binary data stream for subsequent upload.

- **Nodes Involved:**  
  - Load Thumbnail from Disk (Read Binary File)  

- **Node Details:**

  - **Load Thumbnail from Disk (Read Binary File)**  
    - Type: Read Binary File  
    - Role: Loads the thumbnail image binary data from disk to prepare for upload.  
    - Configuration:  
      - File path: `/tmp/<originalFilename>_thumbnail.jpg` (constructed dynamically)  
    - Input: Completion of FFmpeg command execution  
    - Output: Binary data of thumbnail image  
    - Failures: File not found if FFmpeg failed, read permission issues  
    - Version: Standard node  

#### 2.5 Upload to Google Drive

- **Overview:**  
Uploads the thumbnail image binary to a specified Google Drive folder, naming the file by appending `-thumb.jpg` to the original video filename.

- **Nodes Involved:**  
  - Upload Thumbnail to Drive (Google Drive)  

- **Node Details:**

  - **Upload Thumbnail to Drive (Google Drive)**  
    - Type: Google Drive  
    - Role: Uploads the thumbnail binary file to Google Drive into a configured folder.  
    - Configuration:  
      - Drive: "My Drive" (default Google Drive root)  
      - Target Folder ID: `1AXMk_yyq3sD_Oc9f5eRLuqtJevbX-d1i` (configurable)  
      - File name: Derived dynamically as `<originalFilename>-thumb.jpg`  
      - Credentials: OAuth2 credentials for Google Drive API  
    - Input: Binary thumbnail image data  
    - Output: Google Drive file metadata (id, name, size, links)  
    - Failures:  
      - Authentication or authorization errors with Google Drive API  
      - Folder ID invalid or inaccessible  
      - API rate limits or network issues  
    - Version: Google Drive node v3, OAuth2 required  

#### 2.6 API Response

- **Overview:**  
Sends a JSON response back to the original webhook caller with detailed metadata about the uploaded thumbnail on Google Drive.

- **Nodes Involved:**  
  - Return API Response (Respond to Webhook)  

- **Node Details:**

  - **Return API Response (Respond to Webhook)**  
    - Type: Respond to Webhook  
    - Role: Finalizes the HTTP response with a 200 status and JSON body including thumbnail metadata.  
    - Configuration:  
      - Response code: 200  
      - Response mode: JSON  
      - Response body includes:  
        - Success flag (`ok`)  
        - File name, type, size (bytes and human-readable)  
        - Google Drive URLs (view and download)  
        - Created and modified timestamps  
        - Image metadata (width, height, rotation)  
        - Owner display name  
    - Input: Google Drive metadata from upload node  
    - Output: HTTP response to client  
    - Failures: Misformatted expressions, missing metadata fields, or sending response before completion would cause errors  
    - Version: Standard node  

---

### 3. Summary Table

| Node Name                                 | Node Type              | Functional Role                     | Input Node(s)                       | Output Node(s)                      | Sticky Note                                                                                               |
|-------------------------------------------|------------------------|-----------------------------------|-----------------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------------|
| Sticky Note                               | Sticky Note            | Documentation / Overview          | —                                 | —                                 | ## Video Upload → Auto-Thumbnail → Google Drive\n\n### **What it does (high level)**...                    |
| Sticky Note1                              | Sticky Note            | Documentation / Node Breakdown    | —                                 | —                                 | # **Node Breakdown & Descriptions:**\n\n### * The workflow starts with a **Webhook** node named...          |
| Accept Video Upload (Webhook)             | Webhook                | Receives video upload HTTP request| —                                 | Validate Upload is Video (IF)      | # The workflow starts with a **Webhook** node named **“Accept Video Upload”**, which activates on HTTP POST to `/mediaUpload`. It expects `multipart/form-data` with the file in the `media` field and defers responding until the last node, so the API reply can include the uploaded thumbnail’s metadata. |
| Validate Upload is Video (IF)             | IF                     | Validates MIME type is video      | Accept Video Upload (Webhook)      | Persist Upload to /tmp (Write Binary File) | # The next node, **IF** named **“Validate Upload is Video”**, checks `{{$binary.media.mimeType}}` contains `video/`. Only true (video) items proceed. If it ever receives a non-video, the false branch can return a **400** (optional improvement). |
| Persist Upload to /tmp (Write Binary File)| Write Binary File      | Saves uploaded video to disk      | Validate Upload is Video (IF)      | Extract Thumbnail with FFmpeg (Auto-Install) (Execute Command) | # The **Write Binary File** node named **“Persist Upload to /tmp”** writes the incoming `media` binary to disk at `/tmp/<originalFilename or input.mp4>`. This produces a stable file path for FFmpeg to read from. |
| Extract Thumbnail with FFmpeg (Auto-Install) (Execute Command)| Execute Command       | Extracts thumbnail with FFmpeg, auto-installs if missing | Persist Upload to /tmp (Write Binary File) | Load Thumbnail from Disk (Read Binary File) | # The **Execute Command** node named **“Extract Thumbnail with FFmpeg (Auto-Install)”** runs FFmpeg to grab a single frame at **5 seconds**. It auto-downloads FFmpeg if missing. |
| Load Thumbnail from Disk (Read Binary File)| Read Binary File       | Loads thumbnail image from disk   | Extract Thumbnail with FFmpeg (Auto-Install) (Execute Command) | Upload Thumbnail to Drive (Google Drive) | # The **Read Binary File** node named **“Load Thumbnail from Disk”** reads `/tmp/thumbnail.jpg` back into the item’s binary data, preparing it for upload. |
| Upload Thumbnail to Drive (Google Drive) | Google Drive           | Uploads thumbnail to Google Drive | Load Thumbnail from Disk (Read Binary File) | Return API Response (Respond to Webhook) | # The **Google Drive** node named **“Upload Thumbnail to Drive”** uploads the thumbnail image to your target folder (folder ID you configured). |
| Return API Response (Respond to Webhook) | Respond to Webhook     | Sends JSON response with metadata | Upload Thumbnail to Drive (Google Drive) | —                                 | # Finally, the **Respond to Webhook** node named **“Return API Response”** sends a JSON response to the caller including the Drive thumbnail metadata. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook node**  
   - Name: `Accept Video Upload (Webhook)`  
   - HTTP Method: POST  
   - Path: `mediaUpload`  
   - Response Mode: `Last Node` (defer response)  
   - Expect file upload in binary field named `media` via `multipart/form-data`

2. **Add an IF node**  
   - Name: `Validate Upload is Video (IF)`  
   - Condition: Check if `{{$binary.media.mimeType}}` contains `video/`  
   - Connect Webhook → IF node (true branch continues)

3. **Add Write Binary File node**  
   - Name: `Persist Upload to /tmp (Write Binary File)`  
   - File Name: Use expression `{{$binary.media.fileName ? "/tmp/" + $binary.media.fileName : "/tmp/input.mp4"}}`  
   - Data Property: `media` (binary)  
   - Connect IF true branch → Write Binary File node  

4. **Add Execute Command node**  
   - Name: `Extract Thumbnail with FFmpeg (Auto-Install) (Execute Command)`  
   - Command: Use multi-line shell script to:  
     - Identify if `ffmpeg` exists or download static build based on CPU architecture to `/tmp/ffmpeg`  
     - Extract thumbnail at 5 seconds with:  
       `ffmpeg -y -ss 5 -i <video_input> -frames:v 1 -q:v 2 <thumbnail_output>`  
     - Use expressions to get video file name and output file path:  
       - Input video: `{{ $('Persist Upload to /tmp (Write Binary File)').item.json.fileName }}`  
       - Output: `/tmp/{{ $('Accept Video Upload (Webhook)').item.binary.media.fileName }}_thumbnail.jpg`  
   - Connect Write Binary File → Execute Command

5. **Add Read Binary File node**  
   - Name: `Load Thumbnail from Disk (Read Binary File)`  
   - File Path: `/tmp/{{ $('Persist Upload to /tmp (Write Binary File)').item.binary.media.fileName }}_thumbnail.jpg`  
   - Connect Execute Command → Read Binary File

6. **Add Google Drive node**  
   - Name: `Upload Thumbnail to Drive (Google Drive)`  
   - Operation: Upload  
   - Drive ID: Select "My Drive"  
   - Folder ID: Enter target Google Drive folder ID (e.g., `1AXMk_yyq3sD_Oc9f5eRLuqtJevbX-d1i`)  
   - File Name: Expression: `{{$binary.media.fileName ? $binary.media.fileName + '-thumb.jpg' : 'thumbnail.jpg'}}`  
   - Credentials: Configure OAuth2 Google Drive credentials  
   - Connect Read Binary File → Google Drive

7. **Add Respond to Webhook node**  
   - Name: `Return API Response (Respond to Webhook)`  
   - Response Code: 200  
   - Response Type: JSON  
   - Response Body (JSON expression):  
     ```json
     {
       "ok": true,
       "fileName": "{{ $json.name || $json.originalFilename }}",
       "type": "{{ $json.mimeType || $json.fullFileExtension || $json.fileExtension }}",
       "sizeBytes": "{{ $json.size }}",
       "sizeHuman": "={{ (Number($json.size) >= 1048576 ? (Number($json.size)/1048576).toFixed(2) + ' MB' : (Number($json.size)/1024).toFixed(2) + ' KB') }}",
       "url": "={{ $json.webViewLink || ('https://drive.google.com/file/d/' + $json.id + '/view') }}",
       "downloadUrl": "={{ $json.webContentLink || ('https://drive.google.com/uc?id=' + $json.id + '&export=download') }}",
       "createdTime": "{{ $json.createdTime }}",
       "modifiedTime": "{{ $json.modifiedTime }}",
       "image": {
         "width": "{{ $json.imageMediaMetadata && $json.imageMediaMetadata.width }}",
         "height": "{{ $json.imageMediaMetadata && $json.imageMediaMetadata.height }}",
         "rotation": "{{ $json.imageMediaMetadata && $json.imageMediaMetadata.rotation }}"
       },
       "owner": "{{ $json.owners && $json.owners[0] && $json.owners[0].displayName }}"
     }
     ```
   - Connect Google Drive → Respond to Webhook

8. **Connect error/false branches if desired**  
   - For example, add error handling or 400 response if uploaded file is not a video (optional improvement).

9. **Activate the workflow and test**  
   - Deploy and test uploading video files via HTTP POST to `/mediaUpload`.  
   - Verify thumbnail extraction and upload to Google Drive.  
   - Confirm JSON API response with thumbnail metadata.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                       | Context or Link                                                                                                   |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| This workflow demonstrates an advanced pattern of on-the-fly FFmpeg installation to avoid environment dependencies, enabling portability across Linux hosts and containers.                                                                                                         | Workflow description and execute command node script                                                            |
| The Google Drive folder ID must be pre-created and accessible by the configured OAuth2 credentials to avoid upload failures.                                                                                                                                                     | Google Drive node configuration                                                                                  |
| The workflow expects a multipart/form-data HTTP POST with a binary file key named `media`. API clients must conform to this format.                                                                                                                                               | Webhook node setup                                                                                                |
| Consider adding error handling on the IF node's false branch to return HTTP 400 responses for non-video uploads.                                                                                                                                                                  | Suggested improvement in sticky note                                                                               |
| FFmpeg static builds are fetched from https://johnvansickle.com/ffmpeg/releases/ - ensure network access and that archive extraction tools (tar/xz) are available on the host.                                                                                                     | Execute Command node script                                                                                        |
| The thumbnail extraction uses a frame at exactly 5 seconds into the video; adjust `-ss 5` parameter in Execute Command node to change this behavior.                                                                                                                                | FFmpeg command parameters                                                                                         |
| For large files, consider size limits or streaming to avoid memory issues, as this workflow writes files to `/tmp` and fully loads thumbnails into memory before upload.                                                                                                           | Operational consideration                                                                                         |

---

**Disclaimer:**  
The provided text is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly follows content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.