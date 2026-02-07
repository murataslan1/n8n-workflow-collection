3D Product Video Generator from 2D Image for E-Commerce Stores

https://n8nworkflows.xyz/workflows/3d-product-video-generator-from-2d-image-for-e-commerce-stores-4987


# 3D Product Video Generator from 2D Image for E-Commerce Stores

### 1. Workflow Overview

This workflow automates the generation of a 3D product video from a 2D product image submitted via a form, targeted at e-commerce store owners who want professional product videos to enhance their marketing. It integrates form data collection, image background removal, video creation via an external AI service, Google Drive and Google Sheets for storage and tracking, and email notification when the video is ready.

Logical blocks included:

- **1.1 Input Reception:** Captures product photo and title from a public form submission.
- **1.2 File and Folder Management:** Creates a Google Drive folder for each product, uploads the original and processed images, and manages sharing permissions.
- **1.3 Background Removal:** Sends the product image to a background removal API, then uploads the result.
- **1.4 Video Generation:** Calls an AI video generation API with the processed image and a prompt for a rotating product video.
- **1.5 Video Status Polling and Download:** Waits and polls the video generation status until ready, then downloads the video file.
- **1.6 Data Logging and Notification:** Updates a Google Sheet with image and video links, and sends an email notification with the video link.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Captures product details (photo and title) via a user-facing web form.
- **Nodes Involved:** On Form Submission, Create Slug
- **Node Details:**

  - **On Form Submission**  
    - Type: Form Trigger  
    - Role: Entry point triggered when user submits product photo and title.  
    - Configuration: Form fields include a single file upload (required) and product title (required).  
    - Input: User HTTP request with form data.  
    - Output: JSON with form fields and binary data for the uploaded image.  
    - Edge cases: Missing required fields, invalid file formats.  
  - **Create Slug**  
    - Type: Code (JavaScript)  
    - Role: Generates a unique slug from product title for folder and record naming.  
    - Configuration: Converts title to lowercase, replaces spaces with dashes, appends random string.  
    - Input: JSON from form submission.  
    - Output: JSON with slug property.  
    - Edge cases: Missing or empty product title defaults to "default".

#### 2.2 File and Folder Management

- **Overview:** Creates a dedicated Google Drive folder per product, uploads images, shares folder access.
- **Nodes Involved:** Create Folder, Give Access to folder, Get Image File, Upload Original Image
- **Node Details:**

  - **Create Folder**  
    - Type: Google Drive node  
    - Role: Creates a folder in "My Drive" named after the slug.  
    - Configuration: Uses slug as folder name, root folder as parent.  
    - Input: Slug from previous node.  
    - Output: Folder metadata including ID.  
    - Edge cases: Folder creation failure due to API limits or permission issues.  
    - Credentials: Google Drive OAuth2  
  - **Give Access to folder**  
    - Type: Google Drive node  
    - Role: Sets folder sharing permission to "anyone with the link can read".  
    - Configuration: Uses folder ID, sets role to reader and type to anyone.  
    - Input: Folder ID from Create Folder.  
    - Output: Confirmation of sharing settings.  
    - Edge cases: Permission errors, API rate limits.  
  - **Get Image File**  
    - Type: Code node  
    - Role: Extracts binary file data from form submission for upload.  
    - Configuration: Iterates over all binary keys in form submission to prepare upload payload.  
    - Input: Form submission binary data.  
    - Output: JSON with filename and binary data for the product photo.  
    - Edge cases: Multiple binary files submitted (only first expected), missing binary data.  
  - **Upload Original Image**  
    - Type: Google Drive node  
    - Role: Uploads the original product image to the created folder.  
    - Configuration: Upload filename same as folder name, parent is created folder.  
    - Input: Binary image data from Get Image File.  
    - Output: File metadata including webViewLink.  
    - Edge cases: Upload failures, file size limits.

#### 2.3 Background Removal

- **Overview:** Removes background from the product image using the remove.bg API and uploads the processed image.
- **Nodes Involved:** Remove Image Background, Upload Remove BG image, Update Remove BG URL
- **Node Details:**

  - **Remove Image Background**  
    - Type: HTTP Request  
    - Role: Calls remove.bg API to remove background from uploaded image.  
    - Configuration: POST multipart/form-data with binary image, API key in header, response saved as binary file "no-bg.png".  
    - Input: Binary original image data.  
    - Output: Binary image with transparent background.  
    - Edge cases: API key invalid/expired, rate limiting, timeout, invalid image formats.  
  - **Upload Remove BG image**  
    - Type: Google Drive node  
    - Role: Uploads the no-background image to the product folder on Google Drive.  
    - Configuration: Upload filename prefixed with "no-bg" plus folder name, parent is product folder.  
    - Input: Binary data from Remove Image Background node.  
    - Output: File metadata including webViewLink.  
    - Edge cases: Upload errors, file corruption.  
  - **Update Remove BG URL**  
    - Type: Google Sheets node  
    - Role: Updates or appends row in Google Sheet with the URL of the background-removed image.  
    - Configuration: Matches row by Slug, updates "BG Remove Image" column.  
    - Input: webViewLink from uploaded image, slug from folder name.  
    - Output: Confirmation of sheet update.  
    - Edge cases: Sheet API errors, slug mismatch, concurrent updates.  
    - Credentials: Google Sheets OAuth2

#### 2.4 Video Generation

- **Overview:** Uses an external AI video generation API to create a rotating product video from the processed image.
- **Nodes Involved:** Extract Image ID from URL, Create Video
- **Node Details:**

  - **Extract Image ID from URL**  
    - Type: Code node  
    - Role: Parses Google Drive URL to extract file ID for API usage.  
    - Configuration: Regex extracts Drive file ID from "BG Remove Image" URL.  
    - Input: JSON containing BG Remove Image URL from Google Sheets update.  
    - Output: JSON with "fileId" field used for video API call.  
    - Edge cases: URL format changes, invalid or missing URLs.  
  - **Create Video**  
    - Type: HTTP Request  
    - Role: Calls external video generation API with prompt and image URL.  
    - Configuration: POST JSON body includes descriptive prompt and image URL constructed using extracted fileId, Authorization header with API key.  
    - Input: fileId from previous node.  
    - Output: JSON with status URL and response URL for video generation tracking.  
    - Edge cases: API failures, invalid API keys, malformed requests, network timeouts.

#### 2.5 Video Status Polling and Download

- **Overview:** Polls the video generation status endpoint, waits until the video is ready, then downloads and uploads the video file.
- **Nodes Involved:** Wait, Check Video Status, Is In Progress, Get Video Link, Convert to Binary File, Upload Video, Update Video Link
- **Node Details:**

  - **Wait**  
    - Type: Wait node  
    - Role: Delays workflow execution by 40 seconds before checking video status or retrying.  
    - Configuration: Wait for 40 seconds.  
    - Input/Output: Used twice — once after video creation and once if video generation is still in progress.  
    - Edge cases: Failure to resume after wait, race conditions if polling too fast.  
  - **Check Video Status**  
    - Type: HTTP Request  
    - Role: Queries video generation API status endpoint.  
    - Configuration: GET request to status_url with Authorization header.  
    - Input: status_url from Create Video response.  
    - Output: JSON with status (e.g., IN_PROGRESS, COMPLETED).  
    - Edge cases: API downtime, invalid status URL, incorrect API key.  
  - **Is In Progress**  
    - Type: If node  
    - Role: Branches workflow depending on whether video status is still "IN_PROGRESS".  
    - Configuration: Checks if status equals "IN_PROGRESS".  
    - Input: JSON status from Check Video Status.  
    - Output: If true, loops back to Wait; if false, proceeds to get video link.  
    - Edge cases: Unexpected status values, missing status field.  
  - **Get Video Link**  
    - Type: HTTP Request  
    - Role: Fetches final video URL after completion.  
    - Configuration: GET request to response_url with Authorization header.  
    - Input: response_url from Create Video node.  
    - Output: JSON with video URL.  
    - Edge cases: API errors, broken links.  
  - **Convert to Binary File**  
    - Type: HTTP Request  
    - Role: Downloads the video file as binary data.  
    - Configuration: GET request to video URL, response saved as binary in property "Video-file".  
    - Input: video URL from Get Video Link.  
    - Output: Binary video file.  
    - Edge cases: Download failures, large file size causing timeouts or memory issues.  
  - **Upload Video**  
    - Type: Google Drive node  
    - Role: Uploads the downloaded video to the product folder on Google Drive.  
    - Configuration: Uploads binary video under name "Video-file" to folder by ID.  
    - Input: Binary video file data.  
    - Output: File metadata including webViewLink.  
    - Edge cases: Upload size limits, permission errors.  
  - **Update Video Link**  
    - Type: Google Sheets node  
    - Role: Updates Google Sheet with video URL.  
    - Configuration: Appends or updates row matching slug with "Video Link" column.  
    - Input: Video URL from Upload Video node.  
    - Output: Confirmation of update.  
    - Edge cases: Sheet API errors, concurrency issues.  
    - Credentials: Google Sheets OAuth2

#### 2.6 Data Logging and Notification

- **Overview:** Logs product data into Google Sheets and sends an email notification with video link.
- **Nodes Involved:** Insert New Product, Send E-Mail Notification
- **Node Details:**

  - **Insert New Product**  
    - Type: Google Sheets node  
    - Role: Appends a new row to Google Sheets with slug, product title, and original image link.  
    - Configuration: Uses Sheet1 of the specified Google Sheet document.  
    - Input: Slug, product title from form, webViewLink from original image upload.  
    - Output: Confirmation of append operation.  
    - Edge cases: Sheet access errors, duplicate entries.  
    - Credentials: Google Sheets OAuth2  
  - **Send E-Mail Notification**  
    - Type: Gmail node  
    - Role: Sends an email to notify about the product video availability with the video link.  
    - Configuration: Sends to fixed email (example@gmail.com), HTML message with embedded video link, subject "Product Video".  
    - Input: Video URL from Get Video Link node.  
    - Output: Email sent confirmation.  
    - Edge cases: SMTP errors, invalid recipient address.  
    - Credentials: Gmail OAuth2

---

### 3. Summary Table

| Node Name               | Node Type             | Functional Role                           | Input Node(s)            | Output Node(s)             | Sticky Note                                                                                         |
|-------------------------|-----------------------|-----------------------------------------|--------------------------|----------------------------|---------------------------------------------------------------------------------------------------|
| On Form Submission      | Form Trigger          | Captures product photo & title           | —                        | Create Slug                |                                                                                                   |
| Create Slug             | Code                  | Generates unique slug from product title | On Form Submission       | Create Folder              |                                                                                                   |
| Create Folder           | Google Drive          | Creates Google Drive folder named by slug| Create Slug              | Give Access to folder      |                                                                                                   |
| Give Access to folder   | Google Drive          | Shares folder with read access to anyone | Create Folder            | Get Image File             |                                                                                                   |
| Get Image File          | Code                  | Extracts binary image file from form data| Give Access to folder    | Upload Original Image, Remove Image Background |                                                                                                   |
| Upload Original Image   | Google Drive          | Uploads original product image           | Get Image File           | Insert New Product         |                                                                                                   |
| Insert New Product      | Google Sheets         | Logs new product info into Google Sheets | Upload Original Image    | —                         |                                                                                                   |
| Remove Image Background | HTTP Request          | Removes background from product image    | Get Image File           | Upload Remove BG image     |                                                                                                   |
| Upload Remove BG image  | Google Drive          | Uploads background-removed image         | Remove Image Background  | Update Remove BG URL       |                                                                                                   |
| Update Remove BG URL    | Google Sheets         | Updates sheet with BG removed image URL  | Upload Remove BG image   | Extract Image ID from URL  |                                                                                                   |
| Extract Image ID from URL| Code                  | Extracts Google Drive file ID from URL   | Update Remove BG URL     | Create Video               |                                                                                                   |
| Create Video            | HTTP Request          | Initiates AI video generation             | Extract Image ID from URL| Wait                      |                                                                                                   |
| Wait                    | Wait                  | Delays for 40 seconds before checking status | Create Video, Is In Progress | Check Video Status, Check Video Status |                                                                                                   |
| Check Video Status      | HTTP Request          | Polls video generation status             | Wait                     | Is In Progress             |                                                                                                   |
| Is In Progress          | If                    | Checks if video is still being processed  | Check Video Status       | Wait (Loop), Get Video Link|                                                                                                   |
| Get Video Link          | HTTP Request          | Retrieves final video URL when ready      | Is In Progress           | Convert to Binary File     |                                                                                                   |
| Convert to Binary File  | HTTP Request          | Downloads video file as binary             | Get Video Link           | Upload Video               |                                                                                                   |
| Upload Video            | Google Drive          | Uploads video file to Google Drive folder | Convert to Binary File   | Update Video Link          |                                                                                                   |
| Update Video Link       | Google Sheets         | Updates Google Sheet with video URL        | Upload Video             | Send E-Mail Notification   |                                                                                                   |
| Send E-Mail Notification| Gmail                 | Sends notification email with video link  | Update Video Link        | —                         |                                                                                                   |
| Sticky Note             | Sticky Note           | Provides sample Google Sheet link          | —                        | —                         | ## 3D Product Video<br>Sample Google Sheet<br>- https://docs.google.com/spreadsheets/d/18k1Gq2X2J3_cbwJ9XyJoysVuhIpWhgc1cmlTKBnB3Yw/edit?gid=0#gid=0 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node**  
   - Add **Form Trigger** node named "On Form Submission".  
   - Configure with form title "Shopify 3D Product Video".  
   - Add two required fields:  
     - File upload field labeled "Product Photo" (single file).  
     - Text field labeled "Product Title" with placeholder "Product Title".  

2. **Generate Slug**  
   - Add **Code** node named "Create Slug".  
   - Use JavaScript to create slug from "Product Title": lowercase, replace spaces with dashes, append random 6-character string.  
   - Connect from "On Form Submission".  

3. **Create Google Drive Folder**  
   - Add **Google Drive** node named "Create Folder".  
   - Operation: Create folder, folder name set to slug from previous node.  
   - Parent folder: root ("My Drive").  
   - Connect from "Create Slug".  
   - Use valid Google Drive OAuth2 credentials.  

4. **Set Folder Sharing Permissions**  
   - Add **Google Drive** node named "Give Access to folder".  
   - Operation: Share folder with "anyone" role reader.  
   - Folder ID from "Create Folder".  
   - Connect from "Create Folder".  

5. **Extract Image File from Submission**  
   - Add **Code** node named "Get Image File".  
   - JavaScript to iterate over binary in form submission and prepare data for upload.  
   - Connect from "Give Access to folder".  

6. **Upload Original Image to Drive**  
   - Add **Google Drive** node "Upload Original Image".  
   - Upload file with name same as folder name.  
   - Parent folder ID from "Create Folder".  
   - Binary data from "Get Image File".  
   - Connect from "Get Image File".  

7. **Log New Product in Google Sheet**  
   - Add **Google Sheets** node "Insert New Product".  
   - Operation: Append row.  
   - Columns: Slug (from "Create Slug"), Product Title (from form), Original Image (webViewLink from uploaded image).  
   - Sheet name and document ID as per project.  
   - Connect from "Upload Original Image".  
   - Use Google Sheets OAuth2 credentials.  

8. **Remove Image Background**  
   - Add **HTTP Request** node "Remove Image Background".  
   - POST to remove.bg API endpoint.  
   - Set multipart-form-data body with binary image from "Get Image File".  
   - Header with valid remove.bg API key.  
   - Configure response to save binary file "no-bg.png".  
   - Connect from "Get Image File".  

9. **Upload Background-Removed Image**  
   - Add **Google Drive** node "Upload Remove BG image".  
   - Upload file named "no-bg" + folder name.  
   - Parent folder ID from "Create Folder".  
   - Input binary file from "Remove Image Background".  
   - Connect from "Remove Image Background".  

10. **Update Google Sheet with BG Removed Image URL**  
    - Add **Google Sheets** node "Update Remove BG URL".  
    - Operation: Append or update row matching slug.  
    - Update "BG Remove Image" column with webViewLink from uploaded BG removed image.  
    - Connect from "Upload Remove BG image".  

11. **Extract File ID from BG Removed Image URL**  
    - Add **Code** node "Extract Image ID from URL".  
    - Use regex to extract Google Drive fileId from URL.  
    - Connect from "Update Remove BG URL".  

12. **Create AI Video**  
    - Add **HTTP Request** node "Create Video".  
    - POST to AI video API endpoint (https://queue.fal.run/fal-ai/kling-video/v1/standard/image-to-video).  
    - Body parameters:  
      - prompt: "A product placed on a reflective surface slowly rotates 360 degrees with dramatic studio lighting, soft shadows, and a smooth camera pan..."  
      - image_url: Constructed from extracted fileId in format `https://drive.usercontent.google.com/download?id={{fileId}}&export=view&authuser=0`  
    - Header: Authorization with API key.  
    - Connect from "Extract Image ID from URL".  

13. **Wait 40 Seconds**  
    - Add **Wait** node "Wait" configured to delay 40 seconds.  
    - Connect from "Create Video".  

14. **Check Video Status**  
    - Add **HTTP Request** node "Check Video Status".  
    - GET request to status_url from "Create Video" response.  
    - Header with Authorization API key.  
    - Connect from "Wait".  

15. **Evaluate Video Status**  
    - Add **If** node "Is In Progress".  
    - Condition: `$json.status === "IN_PROGRESS"`.  
    - Connect from "Check Video Status".  
    - If true: connect back to "Wait" node (loop).  
    - If false: connect to "Get Video Link".  

16. **Get Video Link**  
    - Add **HTTP Request** node "Get Video Link".  
    - GET request to response_url from "Create Video".  
    - Header with Authorization API key.  
    - Connect from "Is In Progress" (false branch).  

17. **Download Video as Binary**  
    - Add **HTTP Request** node "Convert to Binary File".  
    - GET request to video URL from "Get Video Link".  
    - Configure response as binary file saved under "Video-file".  
    - Connect from "Get Video Link".  

18. **Upload Video to Drive**  
    - Add **Google Drive** node "Upload Video".  
    - Upload binary video file named "Video-file" to product folder from "Create Folder".  
    - Connect from "Convert to Binary File".  

19. **Update Google Sheet with Video Link**  
    - Add **Google Sheets** node "Update Video Link".  
    - Append or update row matching slug with "Video Link" column.  
    - Video URL from "Get Video Link".  
    - Connect from "Upload Video".  

20. **Send Email Notification**  
    - Add **Gmail** node "Send E-Mail Notification".  
    - Send to configured email address.  
    - Subject: "Product Video".  
    - Message: HTML including link to video URL.  
    - Connect from "Update Video Link".  
    - Use Gmail OAuth2 credentials.  

21. **Add Sticky Note**  
    - Add Sticky Note with content:  
      - "## 3D Product Video"  
      - "Sample Google Sheet" with link: https://docs.google.com/spreadsheets/d/18k1Gq2X2J3_cbwJ9XyJoysVuhIpWhgc1cmlTKBnB3Yw/edit?gid=0#gid=0

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                           |
|-----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Sample Google Sheet used to log products, images, and video links.                                         | https://docs.google.com/spreadsheets/d/18k1Gq2X2J3_cbwJ9XyJoysVuhIpWhgc1cmlTKBnB3Yw/edit?gid=0#gid=0      |
| API Keys required for remove.bg and AI video generation service; keep these secure and monitor usage.      | Remove.bg API: https://www.remove.bg/api ; AI Video API: https://queue.fal.run/fal-ai/kling-video/v1/standard/image-to-video |
| Email notifications configured via Gmail OAuth2; ensure proper credential setup and consent for sending.  |                                                                                                          |
| The workflow is designed for scalability with polling loops and wait nodes; monitor for API rate limits.  |                                                                                                          |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.