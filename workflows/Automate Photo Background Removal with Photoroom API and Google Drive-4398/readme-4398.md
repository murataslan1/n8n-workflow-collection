Automate Photo Background Removal with Photoroom API and Google Drive

https://n8nworkflows.xyz/workflows/automate-photo-background-removal-with-photoroom-api-and-google-drive-4398


# Automate Photo Background Removal with Photoroom API and Google Drive

### 1. Workflow Overview

This workflow automates the process of removing image backgrounds using the Photoroom API and managing files on Google Drive. It is designed to process all images stored in a specified Google Drive folder, remove their backgrounds via API calls, save the processed images to a dedicated subfolder, and then move the original images to another subfolder for archival.

**Target Use Cases:**
- Batch processing of product or portrait images to remove backgrounds automatically.
- Maintaining an organized Google Drive folder structure with original and processed images separated.
- Scheduled daily automation to process newly added images without manual intervention.

**Logical Blocks:**

- **1.1 Scheduled Trigger and Input Collection:** Triggering the workflow daily and collecting all image files from a target Google Drive folder.
- **1.2 Image Processing Loop:** Iteratively downloading each image and sending it to the Photoroom API for background removal.
- **1.3 Saving Processed Images:** Saving the background-removed images into a dedicated subfolder on Google Drive.
- **1.4 Archiving Originals:** Moving each original image to a separate subfolder to keep the working folder clean.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger and Input Collection

- **Overview:**  
  This block initiates the workflow daily at 8:00 am and collects all files from a specified Google Drive folder to be processed.

- **Nodes Involved:**  
  - Daily at 08:00 am (Schedule Trigger)  
  - Get all files (Google Drive)  
  - Loop Over Items (Split in Batches)  
  - Loop Over Items1 (Split in Batches)

- **Node Details:**

  1. **Daily at 08:00 am**  
     - Type: Schedule Trigger  
     - Configuration: Triggers workflow daily at 08:00 am (hour-based trigger)  
     - Inputs: None (start node)  
     - Outputs: Triggers "Get all files" node  
     - Failure Modes: Rare; potential scheduling misconfiguration or workflow disabled  
     - Notes: Ensures automation runs daily without manual intervention

  2. **Get all files**  
     - Type: Google Drive (search files/folders)  
     - Configuration: Search all files in a specific Google Drive folder identified by folder ID `1j1wl00y4RAsRRecU74XxR6SpncYxMqdA`  
     - Inputs: Trigger from schedule  
     - Outputs: Passes list of files to "Loop Over Items" and "Loop Over Items1" nodes  
     - Failure Modes: Authentication errors, API quota limits, invalid folder ID  
     - Notes: Requires Google Drive API credentials  
     - Sticky Note Content: Explains setup for Google Drive folder and subfolders ("Remove Background", "Original") with links to Google Drive API documentation.

  3. **Loop Over Items**  
     - Type: SplitInBatches  
     - Configuration: Splits incoming files array into batches (default batch size) for processing images sequentially  
     - Inputs: Output from "Get all files"  
     - Outputs: Batch passed to "Download Image" node  
     - Failure Modes: Expression failures if input data malformed  
     - Notes: Controls processing rate to avoid API limits or memory overload

  4. **Loop Over Items1**  
     - Type: SplitInBatches  
     - Configuration: Similar to "Loop Over Items" but used for moving original files after processing  
     - Inputs: Output from "Get all files" (parallel path) and also from "Move to Original" node for looping  
     - Outputs: Batch passed to "Move to Original" node  
     - Failure Modes: Same as above  

---

#### 2.2 Image Processing Loop

- **Overview:**  
  Downloads each image file from Google Drive, sends it to the Photoroom API for background removal, and then saves the processed image to the designated subfolder.

- **Nodes Involved:**  
  - Download Image (Google Drive)  
  - Photoroom API Remove Background (HTTP Request)  
  - Save to Remove Background (Google Drive)

- **Node Details:**

  1. **Download Image**  
     - Type: Google Drive (download file)  
     - Configuration: Downloads file using file ID from the current batch item  
     - Inputs: Batch item from "Loop Over Items"  
     - Outputs: Binary image data sent to Photoroom API node  
     - Failure Modes: File not found, permission denied, API errors  
     - Notes: Requires Google Drive API credentials  
     - Sticky Note Content: Describes downloading files and setting up API credentials

  2. **Photoroom API Remove Background**  
     - Type: HTTP Request  
     - Configuration: POST multipart/form-data to `https://image-api.photoroom.com/v2/edit` with parameters:  
       - Shadow mode: "ai.soft"  
       - Background color: "FFFFFF" (white)  
       - Padding: 0.1  
       - Image file: input binary data field "data" (the downloaded image)  
       - Headers include Accept and API key (x-api-key)  
     - Inputs: Binary image from "Download Image"  
     - Outputs: Processed image file returned as binary data named "result-sandbox-mode.png"  
     - Failure Modes: Invalid API key, request timeout, rate limiting, invalid image data  
     - Notes: Supports sandbox mode allowing 1,000 free API calls/month  
     - Sticky Note Content: Explains API usage and credential setup with link to Photoroom API documentation

  3. **Save to Remove Background**  
     - Type: Google Drive (upload file)  
     - Configuration: Saves the processed image with the original file name into the "Remove Background" subfolder  
     - Inputs: Binary data output from Photoroom API node  
     - Outputs: Passes data to "Loop Over Items" (for next batch)  
     - Failure Modes: Upload failures, permission issues  
     - Notes: Requires Google Drive API credentials  
     - Sticky Note Content: Included in related notes for this phase

---

#### 2.3 Archiving Originals

- **Overview:**  
  Moves the original unprocessed images to the "Original" subfolder on Google Drive after the background removal process is complete.

- **Nodes Involved:**  
  - Move to Original (Google Drive)  
  - Loop Over Items1 (Split in Batches)

- **Node Details:**

  1. **Move to Original**  
     - Type: Google Drive (move file)  
     - Configuration: Moves file using the file ID from "Loop Over Items1" batch to the "Original" subfolder  
     - Inputs: Batch item from "Loop Over Items1"  
     - Outputs: Loops back to "Loop Over Items1" for next file  
     - Failure Modes: File lock, permission denied, invalid folder ID  
     - Notes: Requires Google Drive API credentials  
     - Sticky Note Content: Explains moving files setup with links to Google Drive API docs

  2. **Loop Over Items1**  
     - Acts also as a continuation for moving files in batches as described in 2.1

---

### 3. Summary Table

| Node Name                    | Node Type              | Functional Role                                 | Input Node(s)           | Output Node(s)               | Sticky Note                                                                                                  |
|-----------------------------|------------------------|------------------------------------------------|-------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------------|
| Daily at 08:00 am           | Schedule Trigger       | Starts workflow daily at 08:00 am              | None                    | Get all files               |                                                                                                              |
| Get all files               | Google Drive           | Retrieves all image files from target folder   | Daily at 08:00 am       | Loop Over Items, Loop Over Items1 | Explains folder setup, credentials, subfolders; link to Google Drive API docs                                |
| Loop Over Items             | SplitInBatches         | Processes files in batches for background removal | Get all files           | Download Image              |                                                                                                              |
| Download Image              | Google Drive           | Downloads individual image file                 | Loop Over Items         | Photoroom API Remove Background | Describes downloading process and credentials; link to Google Drive API docs                                 |
| Photoroom API Remove Background | HTTP Request          | Sends image to Photoroom API for background removal | Download Image          | Save to Remove Background   | Explains API usage, sandbox mode, API key setup; link to Photoroom API docs                                  |
| Save to Remove Background   | Google Drive           | Uploads processed image to "Remove Background" folder | Photoroom API Remove Background | Loop Over Items             |                                                                                                              |
| Loop Over Items1            | SplitInBatches         | Processes files in batches for moving originals | Get all files, Move to Original | Move to Original            |                                                                                                              |
| Move to Original            | Google Drive           | Moves original files to "Original" subfolder   | Loop Over Items1        | Loop Over Items1            | Explains moving files setup and credentials; link to Google Drive API docs                                   |
| Sticky Note1                | Sticky Note            | Notes on input collection setup                  | None                    | None                       | Details on collecting original images and folder setup                                                      |
| Sticky Note                 | Sticky Note            | Notes on background removal process              | None                    | None                       | Details on download, API call, and saving processed images                                                  |
| Sticky Note2                | Sticky Note            | Notes on moving processed images                  | None                    | None                       | Details on moving files after processing                                                                     |
| Sticky Note3                | Sticky Note            | Link to complete video tutorial                   | None                    | None                       | [Complete Tutorial Video](https://www.youtube.com/watch?v=gBn9wd0fJ54) with thumbnail image                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configure to trigger daily at 08:00 am (set triggerAtHour to 8)

2. **Create Google Drive Node to Get All Files**  
   - Type: Google Drive (File/Folder Search)  
   - Set Credentials: Google Drive API credentials with access to your Drive  
   - Configure search:  
     - Resource: fileFolder  
     - Filter: files in folder with ID of your target input folder (e.g., `1j1wl00y4RAsRRecU74XxR6SpncYxMqdA`)  
   - Connect Schedule Trigger output to this node

3. **Create SplitInBatches Node ("Loop Over Items") for Processing**  
   - Type: SplitInBatches  
   - No special parameters (default batch size)  
   - Connect "Get all files" output to this node

4. **Create Google Drive Node to Download File**  
   - Type: Google Drive (Download File)  
   - Set Credentials: Google Drive API credentials  
   - Set File ID: Use expression `{{$json["id"]}}` to get the current batch file ID  
   - Connect "Loop Over Items" output to this node

5. **Create HTTP Request Node to Call Photoroom API**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://image-api.photoroom.com/v2/edit`  
   - Authentication: None; add header parameter `"x-api-key"` with your Photoroom API key  
   - Content Type: multipart/form-data  
   - Body Parameters:  
     - `shadow.mode` = "ai.soft"  
     - `background.color` = "FFFFFF"  
     - `padding` = "0.1"  
     - `imageFile` = binary data from previous node (field name "data")  
   - Response: Expect file response, save as binary property "result-sandbox-mode.png"  
   - Connect "Download Image" output to this node

6. **Create Google Drive Node to Save Processed Image**  
   - Type: Google Drive (Upload File)  
   - Set Credentials: Google Drive API credentials  
   - Folder ID: Select or enter folder ID for "Remove Background" subfolder  
   - File Name: Use expression `{{$json["name"]}}` from original file  
   - Binary Property to Upload: "result-sandbox-mode.png"  
   - Connect "Photoroom API Remove Background" output to this node

7. **Connect "Save to Remove Background" Node output back to "Loop Over Items" Node**  
   - This enables batch processing of all files

8. **Create Second SplitInBatches Node ("Loop Over Items1") for Moving Originals**  
   - Type: SplitInBatches  
   - No special parameters  
   - Connect "Get all files" output (parallel path) to this node

9. **Create Google Drive Node to Move Files**  
   - Type: Google Drive (Move File)  
   - Set Credentials: Google Drive API credentials  
   - File ID: Use expression `{{$json["id"]}}`  
   - Destination Folder ID: Select or enter folder ID for "Original" subfolder  
   - Connect "Loop Over Items1" output to this node

10. **Connect "Move to Original" node output back to "Loop Over Items1" node**  
    - This loops the process to move all original files one by one

**Additional Setup Notes:**  
- Create the two subfolders "Remove Background" and "Original" in your Google Drive before running.  
- Obtain and configure Google Drive API credentials in n8n with appropriate scopes (read/write).  
- Obtain Photoroom API key and add it securely in the HTTP Request node headers.  
- Adjust batch sizes in SplitInBatches nodes if needed for performance or API rate limit considerations.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow includes detailed setup instructions for Google Drive API usage and Photoroom API integration to remove image backgrounds automatically.                                                                                                                                                                                                                             | Sticky notes within the workflow nodes                                                            |
| Photoroom API free sandbox mode allows up to 1,000 calls per month, suitable for testing and low-volume use.                                                                                                                                                                                                                                                                    | https://docs.photoroom.com/                                                                         |
| Google Drive API integration requires OAuth2 credentials with access to relevant folders; ensure correct folder IDs and permissions are configured.                                                                                                                                                                                                                            | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googledrive/                      |
| Complete video tutorial available for visual guidance on this workflow setup and usage.                                                                                                                                                                                                                                                                                         | https://www.youtube.com/watch?v=gBn9wd0fJ54                                                        |
| Recommended folder structure: One input folder for images to process, two subfolders named "Remove Background" for processed images and "Original" for archival.                                                                                                                                                                                                               | Described in sticky notes                                                                           |

---

**Disclaimer:** The text provided is derived exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.