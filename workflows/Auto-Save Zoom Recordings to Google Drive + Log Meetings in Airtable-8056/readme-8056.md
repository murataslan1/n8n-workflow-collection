Auto-Save Zoom Recordings to Google Drive + Log Meetings in Airtable

https://n8nworkflows.xyz/workflows/auto-save-zoom-recordings-to-google-drive---log-meetings-in-airtable-8056


# Auto-Save Zoom Recordings to Google Drive + Log Meetings in Airtable

### 1. Workflow Overview

This workflow automates the process of saving Zoom meeting recordings to Google Drive and logging associated meeting metadata into an Airtable base. It targets users or organizations that want to streamline the storage and tracking of Zoom recordings without manual intervention.

The workflow is structured into the following logical blocks:

- **1.1 Input Reception:** Receives Zoom recording completion webhook events.
- **1.2 Data Normalization:** Extracts and normalizes relevant recording data from the webhook payload.
- **1.3 Recording Download:** Downloads the Zoom recording file from the provided URL.
- **1.4 Upload to Google Drive:** Uploads the downloaded recording to a specified Google Drive folder.
- **1.5 Metadata Logging:** Logs or updates the meeting metadata in an Airtable base.
- **1.6 Result Logging:** Aggregates and enriches the metadata with Google Drive file info for final output.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block receives HTTP POST requests from Zoom’s recording.completed webhook event, triggering the workflow whenever a Zoom meeting recording is finalized.

- **Nodes Involved:**  
  - Zoom Recording Webhook

- **Node Details:**  
  - **Zoom Recording Webhook**  
    - Type: Webhook  
    - Technical Role: Entry point for Zoom webhook events  
    - Configuration:  
      - HTTP Method: POST  
      - Path: `zoom-recording` (endpoint URL segment)  
    - Key Expressions: None (raw webhook payload received)  
    - Inputs: External HTTP POST request from Zoom  
    - Outputs: Emits the entire Zoom webhook JSON payload to the next node  
    - Edge Cases:  
      - Missing or invalid webhook payload  
      - Unauthorized requests (should be handled by Zoom’s webhook security mechanisms)  
    - Version-specific: n8n Webhook node v1

#### 2.2 Data Normalization

- **Overview:**  
  This block parses the Zoom webhook payload to extract and normalize essential recording data needed for further processing and logging.

- **Nodes Involved:**  
  - Normalize Recording Data

- **Node Details:**  
  - **Normalize Recording Data**  
    - Type: Code  
    - Technical Role: Data transformation and extraction  
    - Configuration:  
      - JavaScript code extracts the first recording file info from the `recording_files` array and maps fields such as meeting ID, topic, host email, file URL, file type, and size. Also adds a timestamp.  
    - Key Expressions / Variables:  
      - `event.payload.object.recording_files[0]`  
      - Returns JSON object with normalized keys: `meeting_id`, `topic`, `host`, `file_url`, `file_type`, `file_size`, `timestamp`  
    - Inputs: Zoom webhook JSON  
    - Outputs: Normalized JSON object with relevant recording metadata  
    - Edge Cases:  
      - Missing or empty `recording_files` array  
      - Unexpected Zoom payload schema changes  
      - Multiple recording files (only first file processed)  
    - Version-specific: Code node v2

#### 2.3 Recording Download

- **Overview:**  
  Downloads the Zoom recording file using the extracted download URL.

- **Nodes Involved:**  
  - Download Recording

- **Node Details:**  
  - **Download Recording**  
    - Type: HTTP Request  
    - Technical Role: Downloads file content from Zoom recording URL  
    - Configuration:  
      - URL set dynamically from `file_url` field in normalized data  
      - HTTP GET request with default options  
    - Inputs: Normalized recording data (providing `file_url`)  
    - Outputs: Binary data stream of the recording file  
    - Edge Cases:  
      - Expired or invalid download URL  
      - Network timeouts or failures  
      - Large file sizes causing memory constraints  
    - Version-specific: HTTP Request node v4.1

#### 2.4 Upload to Google Drive

- **Overview:**  
  Uploads the downloaded recording file into a designated folder in Google Drive.

- **Nodes Involved:**  
  - Upload to Google Drive

- **Node Details:**  
  - **Upload to Google Drive**  
    - Type: Google Drive  
    - Technical Role: Uploads binary file data to Drive  
    - Configuration:  
      - Drive: My Drive (default Google Drive root)  
      - Folder ID: root (default root folder; user should replace with specific folder ID)  
      - File data: Uses binary data from prior HTTP download node  
    - Inputs: Binary recording file from Download Recording node  
    - Outputs: JSON metadata of uploaded file (`id`, `webViewLink`, etc.)  
    - Edge Cases:  
      - Invalid or unauthorized Google Drive credentials  
      - Quota exceeded or insufficient storage  
      - Network timeouts during upload  
    - Version-specific: Google Drive node v3  
    - Credential: Requires OAuth2 credentials for Google Drive

#### 2.5 Metadata Logging

- **Overview:**  
  Logs or updates the Zoom meeting recording metadata into an Airtable table for persistent tracking.

- **Nodes Involved:**  
  - Create or update a record

- **Node Details:**  
  - **Create or update a record**  
    - Type: Airtable  
    - Technical Role: Upsert operation to create or update a record in Airtable  
    - Configuration:  
      - Base: User’s Airtable base (ID: `appCV1g03wAMk91ZL`)  
      - Table: Zoom Meeting Log (`tblvmGsSf7xTDtIwS`)  
      - Columns mapped:  
        - Host ← `host` from JSON  
        - Topic ← `topic` from JSON  
        - File Size ← `file_type` (Note: seems swapped, possibly a misconfiguration as file size is a string)  
        - File Type ← "Other" (static value)  
        - Meeting ID ← `meeting_id` from JSON  
      - Operation: Upsert (create or update based on matching columns)  
      - Matching columns: None configured, so likely creates new records each time  
    - Inputs: Enriched JSON data with Google Drive info from Log Result node  
    - Outputs: Airtable API response  
    - Edge Cases:  
      - Invalid or missing Airtable API token  
      - Missing required fields in mapping  
      - API rate limits or errors  
    - Version-specific: Airtable node v2.1  
    - Credential: Airtable API token with full access

#### 2.6 Result Logging

- **Overview:**  
  Enhances the workflow data by combining the Google Drive upload metadata with the normalized recording data before passing it to the Airtable upsert node.

- **Nodes Involved:**  
  - Log Result

- **Node Details:**  
  - **Log Result**  
    - Type: Code  
    - Technical Role: Merges results from Google Drive upload with normalized data for logging  
    - Configuration:  
      - Retrieves Drive file info (`id`, `webViewLink`) from previous node output  
      - Retrieves normalized recording metadata from `Normalize Recording Data` node via expression  
      - Returns combined JSON object adding fields: `saved_to_drive` (true), `drive_file_id`, `drive_link`  
    - Inputs:  
      - Primary: Google Drive upload metadata  
      - Secondary (via expression): Normalized recording data  
    - Outputs: Enriched JSON object with combined metadata for Airtable insertion  
    - Edge Cases:  
      - If Drive upload fails, this node will not have expected input  
      - Expression failures if referenced nodes fail or data is missing  
    - Version-specific: Code node v2

---

### 3. Summary Table

| Node Name                | Node Type           | Functional Role                          | Input Node(s)           | Output Node(s)              | Sticky Note                                                                                                           |
|--------------------------|---------------------|----------------------------------------|-------------------------|----------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Zoom Recording Webhook    | Webhook             | Receive Zoom recording completed event | External POST request    | Normalize Recording Data    | 🎥 **SETUP REQUIRED:** 1. **Zoom Setup:** Create Zoom App → enable recording.completed event; add webhook URL from this workflow |
| Normalize Recording Data  | Code                | Extract and normalize Zoom recording data | Zoom Recording Webhook  | Download Recording          |                                                                                                                       |
| Download Recording        | HTTP Request        | Download Zoom recording file            | Normalize Recording Data | Upload to Google Drive      |                                                                                                                       |
| Upload to Google Drive    | Google Drive        | Upload recording file to Google Drive  | Download Recording       | Log Result                  |                                                                                                                       |
| Log Result               | Code                | Combine Drive upload metadata with recording data | Upload to Google Drive | Create or update a record   |                                                                                                                       |
| Create or update a record | Airtable            | Upsert meeting metadata into Airtable | Log Result               |                            |                                                                                                                       |
| Setup Instructions       | Sticky Note         | Setup instructions for Zoom, Drive, Airtable |                         |                            | 🎥 **SETUP REQUIRED:** 2. **Google Drive:** Connect OAuth; replace `YOUR_FOLDER_ID`; 3. **Airtable:** Create base → Table: `Meeting Logs` with specified columns |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**  
   - Type: Webhook  
   - Name: `Zoom Recording Webhook`  
   - HTTP Method: POST  
   - Path: `zoom-recording`  
   - Purpose: Receive Zoom’s recording.completed webhook events  

2. **Create Code Node to Normalize Data:**  
   - Type: Code  
   - Name: `Normalize Recording Data`  
   - Paste JavaScript code:  
     ```javascript
     const event = $input.first().json;
     const recording = event.payload.object.recording_files[0];
     return {
       json: {
         meeting_id: event.payload.object.id,
         topic: event.payload.object.topic,
         host: event.payload.object.host_email,
         file_url: recording.download_url,
         file_type: recording.file_type,
         file_size: recording.file_size,
         timestamp: new Date().toISOString()
       }
     };
     ```  
   - Connect output of `Zoom Recording Webhook` → input of `Normalize Recording Data`

3. **Create HTTP Request Node to Download File:**  
   - Type: HTTP Request  
   - Name: `Download Recording`  
   - HTTP Method: GET (default)  
   - URL: Set to expression `{{$json["file_url"]}}`  
   - Connect output of `Normalize Recording Data` → input of `Download Recording`

4. **Create Google Drive Upload Node:**  
   - Type: Google Drive  
   - Name: `Upload to Google Drive`  
   - Operation: Upload file  
   - Drive: My Drive (default)  
   - Folder ID: Use intended folder ID or leave as root by default  
   - Credentials: Set up OAuth2 credentials for Google Drive with upload permissions  
   - Input file: Connect binary data from `Download Recording`  
   - Connect output of `Download Recording` → input of `Upload to Google Drive`

5. **Create Code Node to Log Result:**  
   - Type: Code  
   - Name: `Log Result`  
   - JavaScript code:  
     ```javascript
     const driveFile = $input.first().json;
     const prev = $('Normalize Recording Data').item.json;
     return {
       json: {
         ...prev,
         saved_to_drive: true,
         drive_file_id: driveFile.id,
         drive_link: driveFile.webViewLink
       }
     };
     ```  
   - Connect output of `Upload to Google Drive` → input of `Log Result`

6. **Create Airtable Node to Create or Update Record:**  
   - Type: Airtable  
   - Name: `Create or update a record`  
   - Operation: Upsert record  
   - Base ID: Your Airtable base ID (e.g., `appCV1g03wAMk91ZL`)  
   - Table Name: `Zoom Meeting Log` (or your custom table)  
   - Mapping:  
     - Host ← `{{ $json.host }}`  
     - Topic ← `{{ $json.topic }}`  
     - File Size ← `{{ $json.file_size }}` (correcting from original to file_size)  
     - File Type ← Provide dynamic or static value (e.g., `Other` or from JSON)  
     - Meeting ID ← `{{ $json.meeting_id }}`  
   - Credentials: Airtable API token with full access  
   - Connect output of `Log Result` → input of `Create or update a record`

7. **(Optional) Add Sticky Note:**  
   - Add a Sticky Note node with setup instructions for Zoom webhook, Google Drive OAuth, and Airtable base/table creation.

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                                                                                                           |
|---------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| 🎥 **SETUP REQUIRED:**                                                                                   | General setup instructions for Zoom webhook event subscription, Google Drive OAuth connection, and Airtable base/table creation.        |
| Zoom Setup: Create Zoom App → enable `recording.completed` event and add webhook URL from this workflow | [Zoom API & Webhooks documentation](https://marketplace.zoom.us/docs/api-reference/webhook-reference/recording-events/recording-completed) |
| Google Drive: Connect OAuth and replace default folder ID with desired target folder                     | Google Drive API documentation and OAuth setup guides                                                                                     |
| Airtable: Create base with table `Meeting Logs` and columns: Meeting ID, Topic, Host, File Type, File Size, Google Drive Saved, Drive Link, Timestamp | Airtable API docs: https://airtable.com/api                                                                                              |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All handled data is legal and public.