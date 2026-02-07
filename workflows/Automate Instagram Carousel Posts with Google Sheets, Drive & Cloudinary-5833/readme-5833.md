Automate Instagram Carousel Posts with Google Sheets, Drive & Cloudinary

https://n8nworkflows.xyz/workflows/automate-instagram-carousel-posts-with-google-sheets--drive---cloudinary-5833


# Automate Instagram Carousel Posts with Google Sheets, Drive & Cloudinary

### 1. Workflow Overview

This n8n workflow automates the creation and publishing of Instagram Carousel posts by integrating Google Sheets, Google Drive, Cloudinary, and the Instagram Graph API. It is designed for social media managers or content teams who schedule Instagram carousel posts via a Google Sheet, upload related images to a Google Drive folder, and want to automate the entire posting process.

**Logical blocks:**

1.1 **Trigger & Execution Retrieval**  
- Periodically triggers the workflow (every 5 minutes)  
- Reads scheduled carousel post data from a Google Sheet filtered by status "ToDo" and type "Carousel"

1.2 **Image Retrieval from Google Drive**  
- Retrieves the list of images from the specified Google Drive folder linked in the sheet entry  
- Downloads each image file for uploading

1.3 **Image Upload to Cloudinary**  
- Uploads each image to Cloudinary to obtain publicly accessible URLs

1.4 **Instagram Media Preparation**  
- Sets up Instagram API credentials and post metadata (caption, user ID, access token)  
- Creates individual Instagram media containers for each uploaded image

1.5 **Carousel Creation & Publishing**  
- Aggregates media container IDs into a carousel container  
- Publishes the carousel post to Instagram

1.6 **Post-Publish Update**  
- Updates the corresponding Google Sheet record status from "ToDo" to "Processed"

---

### 2. Block-by-Block Analysis

---

#### 1.1 Trigger & Execution Retrieval

**Overview:**  
This block triggers the workflow on a schedule and fetches the next carousel post details from a Google Sheet where the status is "ToDo" and type is "Carousel".

**Nodes Involved:**  
- Schedule Trigger  
- Get Execution for Carousel

**Node Details:**

- **Schedule Trigger**  
  - Type: scheduleTrigger  
  - Role: Periodically initiates workflow every 5 minutes (configurable interval)  
  - Inputs: None (start node)  
  - Outputs: Triggers "Get Execution for Carousel"  
  - Failure modes: n8n runtime errors, misconfiguration of interval

- **Get Execution for Carousel**  
  - Type: googleSheets (read rows)  
  - Role: Reads rows from a specific Google Sheet filtering rows where `Status` = "ToDo" and `Type` = "Carousel"  
  - Configuration:  
    - Document ID pointing to a Master Google Sheet  
    - Sheet name referencing the execution sheet  
    - Filters applied on columns "Status" and "Type"  
  - Inputs: Trigger from Schedule Trigger  
  - Outputs: Filtered rows passed to next node  
  - Credentials: Google Sheets OAuth2  
  - Failure modes: Authentication errors, sheet structure changes, no matching rows found

---

#### 1.2 Image Retrieval from Google Drive

**Overview:**  
Obtains the list of image files from the Google Drive folder URL specified in the sheet row, then downloads each image.

**Nodes Involved:**  
- Get image list from a Google Drive folder1  
- Download Image from Google Drive (Carousel)

**Node Details:**

- **Get image list from a Google Drive folder1**  
  - Type: googleDrive  
  - Role: Lists all files in the folder specified by the URL in the sheet record  
  - Configuration:  
    - Folder ID extracted dynamically from the "Folder" field in the Google Sheet row  
    - Returns all files with fields: id, name, thumbnailLink, webViewLink  
  - Inputs: Output from "Get Execution for Carousel"  
  - Outputs: List of files passed to Download Image node  
  - Credentials: Google Drive OAuth2  
  - Failure modes: Folder access permissions, invalid folder ID, empty folder

- **Download Image from Google Drive (Carousel)**  
  - Type: httpRequest  
  - Role: Downloads each image file using Google Drive's direct download link format  
  - Configuration:  
    - URL: `https://drive.google.com/uc?export=download&id={{ $json.id }}` dynamically set using file ID  
    - Response format: file (binary)  
  - Inputs: Each file from Drive listing node  
  - Outputs: Binary image data to upload node  
  - Failure modes: File not found, permission denied, download timeout

---

#### 1.3 Image Upload to Cloudinary

**Overview:**  
Uploads downloaded images to Cloudinary to obtain stable, public URLs for Instagram media upload.

**Nodes Involved:**  
- Upload images to Cloudinary

**Node Details:**

- **Upload images to Cloudinary**  
  - Type: httpRequest  
  - Role: Uploads binary image data to Cloudinary via multipart/form-data POST request  
  - Configuration:  
    - URL: Cloudinary image upload endpoint, e.g. `https://api.cloudinary.com/v1_1/<your-cloud-name>/image/upload`  
    - Body parameters: file (binary data), upload_preset (Cloudinary preset for unsigned upload)  
  - Inputs: Binary image data from Google Drive download node  
  - Outputs: JSON response containing uploaded image URL and metadata  
  - Failure modes: Invalid Cloudinary credentials, upload preset misconfiguration, network errors, rate limits

---

#### 1.4 Instagram Media Preparation

**Overview:**  
Prepares Instagram API credentials and metadata, creates media containers for each image uploaded on Cloudinary.

**Nodes Involved:**  
- Setup for Instagram (access token, ig_business_id)  
- Create Media Container (Image)  
- Combine Instagram media containers

**Node Details:**

- **Setup for Instagram (access token, ig_business_id)**  
  - Type: set  
  - Role: Assigns Instagram API credentials and collects image URL and caption from previous nodes  
  - Configuration:  
    - Access token and Instagram user ID are hardcoded placeholders to be replaced by user  
    - Caption is taken from Google Sheet field "Expected content"  
    - Image URL assigned from Cloudinary upload response  
  - Inputs: Output from Cloudinary upload node  
  - Outputs: JSON with API credentials and post metadata  
  - Failure modes: Missing credentials, incorrect token or user ID

- **Create Media Container (Image)**  
  - Type: httpRequest  
  - Role: Creates individual media container for each image in Instagram via Graph API  
  - Configuration:  
    - POST to `https://graph.instagram.com/v23.0/{{ig_user_id}}/media`  
    - Body parameters: `image_url`, `caption`, `access_token`  
    - Content type: application/x-www-form-urlencoded  
  - Inputs: Instagram setup node output  
  - Outputs: Instagram media container ID  
  - Failure modes: Invalid access token, API errors, rate limits, malformed requests

- **Combine Instagram media containers**  
  - Type: aggregate  
  - Role: Aggregates all media container IDs into a single list for carousel creation  
  - Configuration:  
    - Merges the list of `body.id` fields from media container creation responses  
  - Inputs: Multiple media container creation outputs  
  - Outputs: Aggregated list of media IDs  
  - Failure modes: Empty list, aggregation failure

---

#### 1.5 Carousel Creation & Publishing

**Overview:**  
Creates a carousel media container from aggregated media items and publishes the carousel post on Instagram.

**Nodes Involved:**  
- Create Media Container (Carousel)  
- Publish Instagram Carousel

**Node Details:**

- **Create Media Container (Carousel)**  
  - Type: httpRequest  
  - Role: Creates a carousel container referencing the aggregated media items  
  - Configuration:  
    - POST to `https://graph.instagram.com/v23.0/{{ig_user_id}}/media`  
    - Body parameters:  
      - `caption` from Google Sheet content  
      - `media_type` set to "CAROUSEL"  
      - `children` set to aggregated media container IDs  
      - `access_token`  
    - Content type: application/x-www-form-urlencoded  
  - Inputs: Aggregated media container IDs and Instagram credentials  
  - Outputs: Carousel container ID  
  - Failure modes: API errors, invalid children IDs, caption length issues

- **Publish Instagram Carousel**  
  - Type: httpRequest  
  - Role: Publishes the carousel container to make the post live on Instagram  
  - Configuration:  
    - POST to `https://graph.instagram.com/v23.0/{{ig_user_id}}/media_publish`  
    - Body parameters:  
      - `creation_id` referencing carousel container ID  
      - `access_token`  
    - Response format: JSON  
  - Inputs: Carousel container ID and Instagram credentials  
  - Outputs: Post publishing confirmation  
  - Failure modes: API rate limits, invalid creation ID, expired token

---

#### 1.6 Post-Publish Update

**Overview:**  
After successful publish, updates the original Google Sheet record status from "ToDo" to "Processed" to avoid duplicate posting.

**Nodes Involved:**  
- Update Execute to "Processed"

**Node Details:**

- **Update Execute to "Processed"**  
  - Type: googleSheets (update row)  
  - Role: Updates the "Status" column in the Google Sheet to "Processed" for the executed post  
  - Configuration:  
    - Matches rows by `ExecuteId` from the original sheet data  
    - Updates `Status` field value to "Processed"  
    - Uses the same sheet and document ID as initial read node  
  - Inputs: Output from "Publish Instagram Carousel" node  
  - Outputs: Confirmation of sheet update  
  - Credentials: Google Sheets OAuth2  
  - Failure modes: Authentication errors, sheet structure changes, concurrent updates

---

### 3. Summary Table

| Node Name                          | Node Type           | Functional Role                                  | Input Node(s)                       | Output Node(s)                       | Sticky Note                                                                                  |
|-----------------------------------|---------------------|-------------------------------------------------|-----------------------------------|------------------------------------|----------------------------------------------------------------------------------------------|
| Schedule Trigger                  | scheduleTrigger     | Periodic workflow trigger every 5 minutes       | None                              | Get Execution for Carousel          |                                                                                              |
| Get Execution for Carousel        | googleSheets        | Reads scheduled carousel post entries            | Schedule Trigger                  | Get image list from a Google Drive folder1 | The Google Drive folder needs to be shared publicly (Anyone with the link can view)            |
| Get image list from a Google Drive folder1 | googleDrive         | Lists files in Google Drive folder                | Get Execution for Carousel        | Download Image from Google Drive (Carousel) |                                                                                              |
| Download Image from Google Drive (Carousel) | httpRequest          | Downloads each image file from Google Drive      | Get image list from a Google Drive folder1 | Upload images to Cloudinary          |                                                                                              |
| Upload images to Cloudinary       | httpRequest          | Uploads images to Cloudinary                       | Download Image from Google Drive (Carousel) | Setup for Instagram (access token, ig_business_id) | After creating account and folder on Cloudinary, make sure to update: <your-cloud-name>, <your_upload_preset> |
| Setup for Instagram (access token, ig_business_id) | set                 | Sets Instagram API credentials and post metadata | Upload images to Cloudinary       | Create Media Container (Image)       | Update your instagram information below: <your-instagram-access-token>, <your-ig_user_id>     |
| Create Media Container (Image)    | httpRequest          | Creates Instagram media container for each image | Setup for Instagram (access token, ig_business_id) | Combine Instagram media containers  |                                                                                              |
| Combine Instagram media containers| aggregate           | Aggregates media container IDs                    | Create Media Container (Image)    | Create Media Container (Carousel)    |                                                                                              |
| Create Media Container (Carousel) | httpRequest          | Creates carousel container referencing images    | Combine Instagram media containers| Publish Instagram Carousel           |                                                                                              |
| Publish Instagram Carousel        | httpRequest          | Publishes the carousel post on Instagram         | Create Media Container (Carousel) | Update Execute to "Processed"        |                                                                                              |
| Update Execute to "Processed"     | googleSheets        | Updates Google Sheet status to "Processed"       | Publish Instagram Carousel        | None                               |                                                                                              |
| Sticky Note8                     | stickyNote          | Workflow overview and instructions (multi-node)  | None                              | None                               | https://docs.google.com/spreadsheets/d/1WEUHeQXFMYsWVAW3DykWwpANxxD3DxH-S6c0i06dW1g/edit?usp=sharing |
| Sticky Note1                     | stickyNote          | Google Drive folder sharing reminder               | None                              | None                               | The Google Drive folder needs to be shared publicly (Anyone with the link can view)            |
| Sticky Note2                     | stickyNote          | Cloudinary account setup reminder                   | None                              | None                               | After creating account and folder on Cloudinary, update <your-cloud-name> and <your_upload_preset> |
| Sticky Note                      | stickyNote          | Instagram token and user ID update reminder        | None                              | None                               | Update your instagram information below: <your-instagram-access-token>, <your-ig_user_id>     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Set the interval to every 5 minutes (or preferred frequency).

2. **Add a Google Sheets node (Get Execution for Carousel):**  
   - Operation: Read rows from a Google Sheet.  
   - Credentials: Configure Google Sheets OAuth2 credentials.  
   - Document ID: Paste your Google Sheet ID containing carousel posts.  
   - Sheet Name: Select the sheet/tab with scheduled posts.  
   - Filters: Add filters to select rows where `Status` = "ToDo" and `Type` = "Carousel".  
   - Connect output from Schedule Trigger.

3. **Add a Google Drive node (Get image list from a Google Drive folder):**  
   - Operation: List files in folder.  
   - Credentials: Configure Google Drive OAuth2 credentials.  
   - Folder ID: Dynamically set from the "Folder" column in the Google Sheet row (extract folder ID from URL).  
   - Connect output from Google Sheets node.

4. **Add an HTTP Request node (Download Image from Google Drive):**  
   - Method: GET  
   - URL: `https://drive.google.com/uc?export=download&id={{ $json.id }}` to download each image file by ID.  
   - Response Format: File (binary).  
   - Connect output from Google Drive node.

5. **Add an HTTP Request node (Upload images to Cloudinary):**  
   - Method: POST  
   - URL: `https://api.cloudinary.com/v1_1/<your-cloud-name>/image/upload`  
   - Content-Type: multipart/form-data  
   - Body Parameters:  
     - `file`: binary from previous node  
     - `upload_preset`: your Cloudinary preset for unsigned upload  
   - Connect output from Download Image node.

6. **Add a Set node (Setup for Instagram):**  
   - Assign static variables:  
     - `access_token`: your Instagram access token  
     - `ig_user_id`: your Instagram Business User ID  
     - `image_url`: set from Cloudinary upload response JSON `url` field  
     - `caption`: set from Google Sheet "Expected content" field  
   - Connect output from Cloudinary upload node.

7. **Add an HTTP Request node (Create Media Container (Image)):**  
   - Method: POST  
   - URL: `https://graph.instagram.com/v23.0/{{ $json.ig_user_id }}/media`  
   - Content-Type: application/x-www-form-urlencoded  
   - Body Parameters:  
     - `image_url`: from Set node  
     - `caption`: from Set node  
     - `access_token`: from Set node  
   - Connect output from Setup for Instagram node.

8. **Add an Aggregate node (Combine Instagram media containers):**  
   - Aggregate field: collect all `body.id` values from media container responses.  
   - Connect output from Create Media Container (Image) node.

9. **Add an HTTP Request node (Create Media Container (Carousel)):**  
   - Method: POST  
   - URL: `https://graph.instagram.com/v23.0/{{ ig_user_id }}/media`  
   - Content-Type: application/x-www-form-urlencoded  
   - Body Parameters:  
     - `caption`: from Google Sheet "Expected content"  
     - `media_type`: "CAROUSEL"  
     - `children`: aggregated media container IDs  
     - `access_token`: Instagram token  
   - Connect output from Aggregate node.

10. **Add an HTTP Request node (Publish Instagram Carousel):**  
    - Method: POST  
    - URL: `https://graph.instagram.com/v23.0/{{ ig_user_id }}/media_publish`  
    - Body Parameters:  
      - `creation_id`: from carousel container creation response  
      - `access_token`: Instagram token  
    - Connect output from Create Media Container (Carousel) node.

11. **Add a Google Sheets node (Update Execute to "Processed"):**  
    - Operation: Update row  
    - Credentials: Use same Google Sheets OAuth2 credentials  
    - Document ID and Sheet Name: same as initial Google Sheets node  
    - Match row by `ExecuteId` from initial execution data  
    - Update `Status` field to "Processed"  
    - Connect output from Publish Instagram Carousel node.

---

### 5. General Notes & Resources

| Note Content                                                                                                            | Context or Link                                                                                               |
|-------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| This workflow automates Instagram carousel posting using Google Sheets for scheduling and Google Drive + Cloudinary for image hosting. | Workflow overview and setup instructions are included as sticky notes inside the n8n workflow.                 |
| Google Drive folder must be shared publicly (Anyone with the link can view) for image download to work correctly.        | Sticky Note1                                                                                                  |
| After creating Cloudinary account and folder, update `<your-cloud-name>` and `<your_upload_preset>` in the HTTP Request node. | Sticky Note2                                                                                                  |
| Update Instagram credentials: `<your-instagram-access-token>` and `<your-ig_user_id>` in the Set node before running.    | Sticky Note for Instagram token update                                                                         |
| Sample Google Sheet for scheduling available here: https://docs.google.com/spreadsheets/d/1WEUHeQXFMYsWVAW3DykWwpANxxD3DxH-S6c0i06dW1g/edit?usp=sharing | Referenced in Sticky Note8                                                                                      |
| Sample Google Drive folder with images available here: https://drive.google.com/drive/u/1/folders/1QYYlHaSXNj7pTV0gNhKVKPPhImrZAy84 | Referenced in Sticky Note8                                                                                      |
| Cloudinary setup instructions: https://docs.google.com/document/d/1_KUPrmX0Df_WhsRvGvauWDkn5c__OLib/edit                  | Referenced in Sticky Note8                                                                                      |

---

**Disclaimer:** The provided description and documentation are generated based solely on an n8n workflow designed for legal and public data processing. It contains no illegal or protected content. All integrations comply with their respective API usage policies.