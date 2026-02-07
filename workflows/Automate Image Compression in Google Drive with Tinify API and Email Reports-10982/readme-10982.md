Automate Image Compression in Google Drive with Tinify API and Email Reports

https://n8nworkflows.xyz/workflows/automate-image-compression-in-google-drive-with-tinify-api-and-email-reports-10982


# Automate Image Compression in Google Drive with Tinify API and Email Reports

### 1. Workflow Overview

This workflow automates the compression of images stored in a designated Google Drive folder using the Tinify (TinyPNG) API and sends a detailed email report summarizing the compression results. It is designed for users who want to optimize image storage and bandwidth by automatically compressing images daily and archiving originals while maintaining logs and reporting.

The workflow is logically divided into these blocks:

- **1.1 Scheduled Trigger & Initialization:** Triggers the workflow daily at 8:00 AM and generates a unique processing ID.
- **1.2 File Retrieval & Batch Processing:** Retrieves all images from a specified Google Drive input folder and splits them into batches for processing.
- **1.3 Image Compression:** Downloads each image, sends it to the Tinify API for compression, downloads the compressed image, and saves it to a Google Drive compressed folder.
- **1.4 File Archiving:** Moves the original images to an archive folder after compression.
- **1.5 Logging:** Records detailed logs of each processed image (file names, sizes, URLs, IDs) in a data table.
- **1.6 Report Generation & Emailing:** Collects logs for the current processing session, generates an HTML report, and emails it via Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Initialization

- **Overview:** This block initiates the workflow once daily at 8:00 AM and generates a unique identifier for the processing session to track logs and reports.
- **Nodes Involved:**  
  - Daily at 08:00 am  
  - Generate Processing Id  

- **Node Details:**

  - **Daily at 08:00 am**  
    - Type: Schedule Trigger  
    - Role: Starts the workflow every day at 8 AM.  
    - Configuration: Interval trigger set to 8:00 AM daily.  
    - Input: None (time-based trigger).  
    - Output: Triggers the next node to generate a processing ID.  
    - Edge cases: Workflow won't start if n8n server is down or time zone mismatch occurs.  
    - Notes: Can be customized to change the schedule.

  - **Generate Processing Id**  
    - Type: Set Node  
    - Role: Creates a zero-padded unique processing ID string from the current workflow execution ID for traceability.  
    - Configuration: Generates `processing_id` by padding execution ID to 10 digits as a string.  
    - Key Expression: `{{$execution.id.toString().padStart(10, '0')}}`  
    - Input: Trigger from schedule node.  
    - Output: Passes processing ID downstream for logging and filtering logs.  
    - Edge cases: None significant; depends on valid execution ID.

---

#### 1.2 File Retrieval & Batch Processing

- **Overview:** Fetches all image files from the input Google Drive folder and splits them into manageable batches for sequential processing, enabling scalable handling of large numbers of files.
- **Nodes Involved:**  
  - Get all files  
  - Loop Over Original Files  
  - Loop Over Processed Files  

- **Node Details:**

  - **Get all files**  
    - Type: Google Drive (File/Folder List)  
    - Role: Lists all files in the specified "Image Compression" input folder in Google Drive.  
    - Configuration: Filters by folder ID for input folder; resource set to list files.  
    - Input: Processing ID from previous node.  
    - Output: List of file metadata objects.  
    - Edge cases: Folder ID must be valid; API quota limits; empty folder results in empty list.  
    - Credentials: Google Drive OAuth2 required.

  - **Loop Over Original Files**  
    - Type: SplitInBatches  
    - Role: Splits the list of original files from Google Drive into batches to process one by one.  
    - Configuration: Default batch size (can be configured).  
    - Input: Output of "Get all files".  
    - Output: One file per batch for processing.  
    - Edge cases: Large batch sizes may cause timeouts or memory issues.

  - **Loop Over Processed Files**  
    - Type: SplitInBatches  
    - Role: Iterates over processed files for post-processing actions such as archiving.  
    - Input: Output from the node that moves files to archive (see below).  
    - Output: One file per batch for subsequent moves.  
    - Edge cases: Same as above.

---

#### 1.3 Image Compression

- **Overview:** Downloads each original image file, sends it to the Tinify API to compress, downloads the compressed image, and saves it to the "Compressed" Google Drive folder.
- **Nodes Involved:**  
  - Load Raw Image  
  - Tiny URL API Call  
  - Download Compressed Image  
  - Save to Remove Background (actually Save to Compressed folder)  
  - Processing Logs  

- **Node Details:**

  - **Load Raw Image**  
    - Type: Google Drive (Download)  
    - Role: Downloads the original image file content to send to the compression API.  
    - Configuration: Uses the file ID of each original image.  
    - Input: One file per batch from "Loop Over Original Files".  
    - Output: Binary image data for API call.  
    - Credentials: Google Drive OAuth2 required.  
    - Edge cases: File might be missing or inaccessible; download failures.

  - **Tiny URL API Call**  
    - Type: HTTP Request  
    - Role: Sends the image binary data to the Tinify API to compress it.  
    - Configuration:  
      - POST to `https://api.tinify.com/shrink`  
      - Content type: binary data  
      - HTTP Basic Auth with Tinify API key  
      - Accept header specifies PNG and JSON responses  
    - Input: Binary image data from "Load Raw Image".  
    - Output: JSON response with compressed image URL and size details.  
    - Credentials: HTTP Basic Auth with Tinify API key.  
    - Edge cases: API auth failure, rate limits, invalid image data, network timeouts.

  - **Download Compressed Image**  
    - Type: HTTP Request  
    - Role: Downloads the compressed image file from the URL returned by Tinify.  
    - Configuration: Response format set to file.  
    - Input: URL from "Tiny URL API Call" output JSON.  
    - Output: Binary compressed image file.  
    - Edge cases: Download failures, expired URLs.

  - **Save to Remove Background** (Note: Despite the confusing node name, it saves compressed images)  
    - Type: Google Drive (Upload)  
    - Role: Saves the compressed image binary into the "Compressed" folder on Google Drive with the original file name.  
    - Configuration:  
      - Drive: "My Drive"  
      - Folder ID: Compressed images folder ID  
      - File name: same as original  
    - Input: Compressed image binary from "Download Compressed Image".  
    - Output: Metadata of saved file.  
    - Credentials: Google Drive OAuth2 required.  
    - Edge cases: Folder ID must be valid; file overwrite behavior; API errors.

  - **Processing Logs**  
    - Type: Data Table  
    - Role: Inserts a record for each image processed with details for reporting.  
    - Configuration:  
      - Fields: fileName, originalSize, compressedSize, imageId, outputUrl, processingId  
      - Values extracted from previous nodes' JSON outputs.  
    - Input: Metadata from "Save to Remove Background" and compression info.  
    - Output: None (data table updated).  
    - Edge cases: Data table must exist with correct schema; API connectivity.

---

#### 1.4 File Archiving

- **Overview:** Moves original image files from the input folder to an archive folder named "Original Images" after successful compression.
- **Nodes Involved:**  
  - Move Files to the Folder /Original  

- **Node Details:**

  - **Move Files to the Folder /Original**  
    - Type: Google Drive (Move File)  
    - Role: Moves original files to an archive folder to keep the input folder clean.  
    - Configuration:  
      - Drive: "My Drive"  
      - Destination folder ID: Original Images folder  
      - File ID: From original file metadata  
    - Input: One file per batch from "Loop Over Processed Files".  
    - Output: Metadata confirming move.  
    - Credentials: Google Drive OAuth2 required.  
    - Edge cases: Folder ID validity, file permission issues, API errors.

---

#### 1.5 Logging & Data Management

- **Overview:** Collects log entries filtered by the current processing ID to summarize the compression session.
- **Nodes Involved:**  
  - Collect Logs  

- **Node Details:**

  - **Collect Logs**  
    - Type: Data Table (Get)  
    - Role: Retrieves all log entries from the data table for the current processing session using the processing ID.  
    - Configuration: Filter on `processingId` matching the current processing ID.  
    - Input: Processing ID from "Generate Processing Id".  
    - Output: Array of log entries for report generation.  
    - Edge cases: Data table must contain relevant records; empty logs if no images processed.

---

#### 1.6 Report Generation & Emailing

- **Overview:** Builds an HTML report of compression results and sends it by email using Gmail.
- **Nodes Involved:**  
  - Generate Report  
  - Send Report  

- **Node Details:**

  - **Generate Report**  
    - Type: Code (JavaScript)  
    - Role: Creates a styled HTML report summarizing processed images, sizes before and after compression, total savings, and processing ID.  
    - Configuration: Custom JavaScript code processes input JSON logs to build an HTML table and summary.  
    - Input: Array of log entries from "Collect Logs".  
    - Output: JSON object with `html` string and `processingId`.  
    - Edge cases: Empty input data results in an empty report; code exceptions if fields missing.

  - **Send Report**  
    - Type: Gmail  
    - Role: Sends the generated HTML report as an email to a configured recipient.  
    - Configuration:  
      - Recipient email (set in parameters)  
      - Subject includes the processing ID  
      - Message body is the HTML from the previous node  
      - Attribution disabled  
    - Input: HTML report JSON from "Generate Report".  
    - Output: Email sent confirmation.  
    - Credentials: Gmail OAuth2 required.  
    - Edge cases: Authentication errors, invalid recipient, Gmail API quota.

---

### 3. Summary Table

| Node Name                    | Node Type               | Functional Role                                  | Input Node(s)                      | Output Node(s)                          | Sticky Note                                                                                 |
|------------------------------|-------------------------|-------------------------------------------------|----------------------------------|---------------------------------------|---------------------------------------------------------------------------------------------|
| Daily at 08:00 am            | Schedule Trigger        | Trigger workflow daily at 8:00 AM                | -                                | Generate Processing Id                 | ## 1. Daily trigger to fetch all the pictures to compress and generate a random processing Id |
| Generate Processing Id       | Set                     | Generates unique processing ID                    | Daily at 08:00 am                | Get all files, Collect Logs            | ## 1. Daily trigger to fetch all the pictures to compress and generate a random processing Id |
| Get all files                | Google Drive            | Lists all images in input folder                  | Generate Processing Id           | Loop Over Original Files, Loop Over Processed Files | ## 2. Compress each image using Tinyfy API and log the results                              |
| Loop Over Original Files     | SplitInBatches          | Processes images one-by-one for compression      | Get all files                   | Load Raw Image                        | ## 2. Compress each image using Tinyfy API and log the results                              |
| Load Raw Image               | Google Drive            | Downloads each original image                     | Loop Over Original Files         | Tiny URL API Call                     | ## 2. Compress each image using Tinyfy API and log the results                              |
| Tiny URL API Call            | HTTP Request            | Sends image to Tinify API for compression        | Load Raw Image                  | Download Compressed Image             | ## 2. Compress each image using Tinyfy API and log the results                              |
| Download Compressed Image    | HTTP Request            | Downloads compressed image from Tinify            | Tiny URL API Call               | Save to Remove Background             | ## 2. Compress each image using Tinyfy API and log the results                              |
| Save to Remove Background    | Google Drive            | Saves compressed image to compressed folder      | Download Compressed Image        | Processing Logs, Loop Over Original Files | ## 2. Compress each image using Tinyfy API and log the results                              |
| Processing Logs             | Data Table              | Records processing details for reporting          | Save to Remove Background       | -                                    | ## 2. Compress each image using Tinyfy API and log the results                              |
| Loop Over Processed Files    | SplitInBatches          | Iterates over processed files for archival        | Move Files to the Folder /Original | Move Files to the Folder /Original  | ## 3. Move the images that have been compressed to the folder for processed images          |
| Move Files to the Folder /Original | Google Drive      | Moves original files to archive folder            | Loop Over Processed Files       | Loop Over Processed Files             | ## 3. Move the images that have been compressed to the folder for processed images          |
| Collect Logs                | Data Table              | Retrieves logs for current processing session      | Generate Processing Id          | Generate Report                      | ## 4. Load all logs of the current `processingId` to generate a report sent by email        |
| Generate Report             | Code                    | Builds HTML summary report from logs               | Collect Logs                   | Send Report                         | ## 4. Load all logs of the current `processingId` to generate a report sent by email        |
| Send Report                 | Gmail                   | Sends HTML report email to configured recipient   | Generate Report                | -                                    | ## 4. Load all logs of the current `processingId` to generate a report sent by email        |
| Sticky Note                 | Sticky Note             | Workflow overview and setup instructions           | -                              | -                                    | ## Image Compressor using Tinyfy API + Setup & Customisation instructions (see detailed note) |
| Sticky Note8                | Sticky Note             | Notes on daily trigger and processing ID           | -                              | -                                    | ## 1. Daily trigger to fetch all the pictures to compress and generate a random processing Id |
| Sticky Note9                | Sticky Note             | Notes on compression and logging                    | -                              | -                                    | ## 2. Compress each image using Tinyfy API and log the results                              |
| Sticky Note10               | Sticky Note             | Notes on moving compressed images to archive folder | -                              | -                                    | ## 3. Move the images that have been compressed to the folder for processed images          |
| Sticky Note11               | Sticky Note             | Notes on log collection and report generation       | -                              | -                                    | ## 4. Load all logs of the current `processingId` to generate a report sent by email        |
| Sticky Note1                | Sticky Note             | Link to video tutorial                               | -                              | -                                    | ## [Video Tutorial](https://youtu.be/qXQVcaJgwrA)                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Scheduled Trigger Node**  
   - Add a **Schedule Trigger** node named "Daily at 08:00 am".  
   - Configure to trigger once daily at 8:00 AM (using "rule" interval with triggerAtHour=8).  

2. **Create the Unique Processing ID Generator**  
   - Add a **Set** node named "Generate Processing Id".  
   - Connect from "Daily at 08:00 am".  
   - Set a string field `processing_id` with value: `{{$execution.id.toString().padStart(10, '0')}}`.  

3. **Add Google Drive Node to List Files**  
   - Add a **Google Drive** node named "Get all files".  
   - Connect from "Generate Processing Id".  
   - Configure:  
     - Operation: List files in folder  
     - Folder ID: Input folder ID where original images are stored  
     - Drive: "My Drive" (or your drive name)  
   - Set credentials with a valid Google Drive OAuth2 credential.  

4. **Add SplitInBatches for Original Files**  
   - Add **SplitInBatches** node named "Loop Over Original Files".  
   - Connect from "Get all files".  
   - Use default batch size or configure as needed.  

5. **Add Google Drive Download Node**  
   - Add **Google Drive** node named "Load Raw Image".  
   - Connect from "Loop Over Original Files".  
   - Configure:  
     - Operation: Download file  
     - File ID: Use expression `{{$json["id"]}}` (from current item).  
   - Use Google Drive OAuth2 credentials.  

6. **Add HTTP Request Node for Tinify API**  
   - Add **HTTP Request** node named "Tiny URL API Call".  
   - Connect from "Load Raw Image".  
   - Configure:  
     - Method: POST  
     - URL: `https://api.tinify.com/shrink`  
     - Authentication: HTTP Basic Auth  
     - Credentials: Create and select HTTP Basic Auth credential with Tinify API key as username, password empty.  
     - Send Body: true  
     - Content-Type: binary data  
     - Input Data Field: Use binary data from "Load Raw Image" node.  
     - Headers: Add `Accept: image/png, application/json`.  

7. **Add HTTP Request Node to Download Compressed Image**  
   - Add **HTTP Request** node named "Download Compressed Image".  
   - Connect from "Tiny URL API Call".  
   - Configure:  
     - Method: GET  
     - URL: Use expression `{{$json["output"]["url"]}}` from previous node.  
     - Response Format: File (to download binary).  

8. **Add Google Drive Upload Node for Compressed Images**  
   - Add **Google Drive** node named "Save to Remove Background".  
   - Connect from "Download Compressed Image".  
   - Configure:  
     - Operation: Upload file  
     - Folder ID: Compressed images folder ID  
     - Drive: "My Drive"  
     - File Name: Use expression `{{$json["name"]}}` from "Loop Over Original Files" item or pass as parameter.  
     - Binary Data: Pass binary from "Download Compressed Image".  
   - Use Google Drive OAuth2 credentials.  

9. **Add Data Table Node for Logging**  
   - Add **Data Table** node named "Processing Logs".  
   - Connect from "Save to Remove Background".  
   - Configure:  
     - Operation: Append data  
     - Data Table: Select your "Image Compression" data table.  
     - Map fields: fileName, originalSize, compressedSize, imageId, outputUrl, processingId from the relevant nodes.  

10. **Add SplitInBatches for Processed Files**  
    - Add **SplitInBatches** node named "Loop Over Processed Files".  
    - Connect from "Move Files to the Folder /Original" (step 12 output).  

11. **Add Google Drive Move Node to Archive Originals**  
    - Add **Google Drive** node named "Move Files to the Folder /Original".  
    - Connect from "Loop Over Processed Files".  
    - Configure:  
      - Operation: Move file  
      - Folder ID: Original Images archive folder ID  
      - Drive: "My Drive"  
      - File ID: Use expression `{{$json["id"]}}` from original file.  
    - Use Google Drive OAuth2 credentials.

12. **Connect "Save to Remove Background" to "Loop Over Original Files"**  
    - To continue processing images after saving compressed, connect "Save to Remove Background" output back to "Loop Over Original Files" to process next batch.  

13. **Add Data Table Node to Collect Logs**  
    - Add **Data Table** node named "Collect Logs".  
    - Connect from "Generate Processing Id".  
    - Configure:  
      - Operation: Get data  
      - Data Table: Image Compression data table  
      - Filter: processingId equals current processing ID (expression).  

14. **Add Code Node to Generate HTML Report**  
    - Add **Code** node named "Generate Report".  
    - Connect from "Collect Logs".  
    - Paste the provided JavaScript code that generates a styled HTML report from the logs.  

15. **Add Gmail Node to Send Report**  
    - Add **Gmail** node named "Send Report".  
    - Connect from "Generate Report".  
    - Configure:  
      - Recipient email address (your email)  
      - Subject: e.g., `"Image Compression Report - {{ $json.processingId }}"`  
      - Message: Use the generated HTML content from "Generate Report".  
    - Authenticate with Gmail OAuth2 credentials.  

16. **Configure Credentials**  
    - Create and configure:  
      - Google Drive OAuth2 credentials with necessary Drive scopes.  
      - HTTP Basic Auth credential with Tinify API key as username.  
      - Gmail OAuth2 credentials for sending email.

17. **Create Supporting Resources**  
    - Google Drive folders:  
      - Input (folder with images to compress)  
      - Compressed (folder to save compressed images)  
      - Original Images (archive folder for originals)  
    - Data Table named "Image Compression" with fields:  
      - fileName (string), originalSize (string), compressedSize (string), imageId (string), outputUrl (string), processingId (string).  

18. **Test the Workflow**  
    - Run manually or wait for scheduled trigger.  
    - Check logs, Google Drive folders, and email report for correctness.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                               | Context or Link                                         |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| Workflow includes a detailed sticky note with instructions: setup steps for Google Drive folders, data table, API keys, and Gmail credentials. Also includes customization tips for schedule and email template styling.                                         | Embedded sticky note in workflow "Sticky Note" node.   |
| The Tinify API documentation and authentication details are essential: https://tinypng.com/developers/reference                                                                                                                                             | Tinify API official docs                               |
| Video tutorial available for the workflow at: https://youtu.be/qXQVcaJgwrA                                                                                                                                                                                  | Sticky Note1 node                                       |
| The workflow respects Google Drive quotas; consider API limits and error handling for larger sets of images.                                                                                                                                                 | Best practices for Google Drive API                    |
| Gmail sending requires OAuth2 credentials with proper scopes; ensure the account is authorized to send emails via n8n.                                                                                                                                       | Gmail API and OAuth2 docs                              |
| The data table node is critical for logging; ensure schema matches fields exactly to avoid errors in report generation.                                                                                                                                      | n8n Data Table documentation                            |

---

**Disclaimer:**  
The provided description and analysis are based solely on an n8n workflow automation. It complies strictly with content policies and contains no illegal or sensitive data. All processed data is legal and public.