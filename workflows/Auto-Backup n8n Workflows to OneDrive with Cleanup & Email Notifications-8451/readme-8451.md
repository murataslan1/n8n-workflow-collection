Auto-Backup n8n Workflows to OneDrive with Cleanup & Email Notifications

https://n8nworkflows.xyz/workflows/auto-backup-n8n-workflows-to-onedrive-with-cleanup---email-notifications-8451


# Auto-Backup n8n Workflows to OneDrive with Cleanup & Email Notifications

---

### 1. Workflow Overview

This workflow automates the daily backup of all n8n workflows to Microsoft OneDrive, maintaining an organized archive by cleaning up old backup folders and notifying the user via a richly formatted HTML email upon successful completion. It targets users who want to safeguard their automation setups by creating time-stamped backups, manage storage by deleting backups older than 31 days, and receive detailed summaries of backup operations.

The workflow’s logic is organized into the following main blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow daily at 1:00 AM.
- **1.2 Backup Folder Creation:** Creates a new dated backup folder on OneDrive.
- **1.3 Workflow Retrieval and Conversion:** Fetches all existing n8n workflows and converts each into individual JSON files.
- **1.4 Upload to OneDrive:** Uploads the JSON files into the newly created backup folder.
- **1.5 Old Backup Folder Management:** Retrieves existing backup folders, filters out those older than 31 days, and deletes them one by one.
- **1.6 Backup Summary Email Preparation:** Aggregates backup statistics, cleanup status, and workflow insights into a detailed styled HTML email.
- **1.7 Email Notification:** Sends the prepared HTML email via Microsoft Outlook to inform the user of backup success.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:**  
  Triggers the workflow automatically once every day at 1:00 AM server time.

- **Nodes Involved:**  
  - Schedule Trigger Daily

- **Node Details:**  
  - **Schedule Trigger Daily**  
    - Type: Schedule Trigger  
    - Role: Initiates workflow execution on a daily schedule.  
    - Configuration: Set to trigger at hour 1 (1:00 AM).  
    - Inputs: None (time-based trigger).  
    - Outputs: Connects to "Create new backup folder" node.  
    - Edge Cases: Server timezone mismatches can affect trigger time, so verify server timezone settings.  
    - Version: 1.2

#### 2.2 Backup Folder Creation

- **Overview:**  
  Creates a new folder on OneDrive named with the current date formatted as `n8n_yyyy-MM-dd` to store the day’s backup files.

- **Nodes Involved:**  
  - Create new backup folder

- **Node Details:**  
  - **Create new backup folder**  
    - Type: Microsoft OneDrive Node  
    - Role: Creates a new folder to organize backup JSON files.  
    - Configuration:  
      - Resource: Folder  
      - Operation: Create  
      - Name: Dynamic expression `n8n_{{$now.format('yyyy-MM-dd')}}`  
      - Parent folder ID: Configurable, typically root or specified folder (requires manual insertion of folder ID).  
    - Inputs: Triggered by Schedule Trigger Daily.  
    - Outputs: Folder metadata (including folder ID) passed to "Retrieve workflows".  
    - Edge Cases: Permissions or quota issues on OneDrive may prevent folder creation.  
    - Requires valid OneDrive credentials with folder creation rights.  
    - Version: 1

#### 2.3 Workflow Retrieval and Conversion

- **Overview:**  
  Retrieves all workflows from the n8n instance and converts each workflow’s data into a formatted JSON file.

- **Nodes Involved:**  
  - Retrieve workflows  
  - Convert to JSON file

- **Node Details:**  
  - **Retrieve workflows**  
    - Type: n8n Core Node (n8n)  
    - Role: Fetches all workflows available in the n8n instance.  
    - Configuration: No filters applied (retrieves all workflows).  
    - Inputs: Receives trigger from "Create new backup folder".  
    - Outputs: Workflow data array passed to "Convert to JSON file".  
    - Edge Cases: Access issues if n8n API cannot be reached or credentials invalid.  
    - Version: 1

  - **Convert to JSON file**  
    - Type: Convert To File  
    - Role: Converts each workflow item into a separate JSON file in binary format.  
    - Configuration:  
      - Mode: Each (processes each workflow individually)  
      - Operation: toJson  
      - Format: Pretty JSON (formatted)  
      - File name: Dynamic expression `{{$json.name}}`  
    - Inputs: Workflow data from "Retrieve workflows".  
    - Outputs: Binary JSON files passed to "Upload JSON to folder".  
    - Edge Cases: Large workflows might create large files; ensure memory and storage availability.  
    - Version: 1.1

#### 2.4 Upload to OneDrive

- **Overview:**  
  Uploads the JSON workflow files created in the previous step into the newly created backup folder on OneDrive.

- **Nodes Involved:**  
  - Upload JSON to folder

- **Node Details:**  
  - **Upload JSON to folder**  
    - Type: Microsoft OneDrive Node  
    - Role: Uploads binary JSON files to OneDrive folder.  
    - Configuration:  
      - Parent ID: Uses expression `={{ $('Create new backup folder').item.json.id }}` to target the new backup folder  
      - Binary Data: True (uploads file content as binary)  
    - Inputs: JSON files from "Convert to JSON file".  
    - Outputs: Metadata of uploaded files passed to "Get backupfolders".  
    - Edge Cases: Upload failures due to network issues or permission errors.  
    - Version: 1

#### 2.5 Old Backup Folder Management

- **Overview:**  
  Manages retention by listing existing backup folders, filtering out those older than 31 days, and deleting them one at a time.

- **Nodes Involved:**  
  - Get backupfolders  
  - Filter backup folder  
  - Switch Old Folders  
  - Loop Over Items  
  - Delete old backup folder  
  - Merge

- **Node Details:**  
  - **Get backupfolders**  
    - Type: Microsoft OneDrive Node  
    - Role: Retrieves list of backup folders from OneDrive root or specified parent folder.  
    - Configuration:  
      - Resource: Folder  
      - Parent folder ID: Set manually to your main backup folder (requires folder ID insertion)  
    - Inputs: Triggered after "Upload JSON to folder".  
    - Outputs: Folder list passed to "Filter backup folder".  
    - Edge Cases: Permissions or API limits could cause failures.  
    - Version: 1

  - **Filter backup folder**  
    - Type: Code (JavaScript)  
    - Role: Filters folders older than 31 days based on `lastModifiedDateTime`. Returns old folders for deletion or a summary if none found.  
    - Key Logic:  
      - Uses Luxon DateTime to calculate cutoff date 31 days ago.  
      - Logs details for debugging.  
      - Returns list of old folders or a single summary object.  
    - Inputs: Folder list from "Get backupfolders".  
    - Outputs: List of old folders or summary passed to "Switch Old Folders".  
    - Edge Cases: Handles date parsing errors gracefully.  
    - Version: 2

  - **Switch Old Folders**  
    - Type: Switch  
    - Role: Routes workflow based on whether old folders exist (`hasOldFolders` boolean).  
    - Configuration:  
      - Output "True": if `hasOldFolders` is true, triggers deletion process.  
      - Output "False": if no old folders, skips deletion.  
    - Inputs: Filter results from "Filter backup folder".  
    - Outputs:  
      - True: to "Loop Over Items" (deletion)  
      - False: directly to "Merge".  
    - Edge Cases: Ensure `hasOldFolders` is boolean; misconfigurations could cause wrong routing.  
    - Version: 3.2

  - **Loop Over Items**  
    - Type: Split in Batches  
    - Role: Processes deletion of old folders one by one to avoid throttling or bulk issues.  
    - Configuration: Default batching, no special options.  
    - Inputs: List of folders to delete from Switch output True.  
    - Outputs:  
      - Main output: to "Delete old backup folder" (for actual deletion).  
      - Second output: to "Merge" (to combine results post deletion).  
    - Edge Cases: Network or permission errors during batch processing can cause partial failures.  
    - Version: 3

  - **Delete old backup folder**  
    - Type: Microsoft OneDrive Node  
    - Role: Deletes a folder by ID from OneDrive.  
    - Configuration:  
      - Resource: Folder  
      - Operation: Delete  
      - Folder ID: Dynamic expression `={{ $json.id }}` from Loop batch item.  
      - Always Output Data: false (does not output data when no error).  
    - Inputs: Folder ID from "Loop Over Items".  
    - Outputs: None (to Loop Over Items).  
    - Edge Cases: Incorrect folder IDs or permission issues can cause failures; deleted folders cannot be recovered.  
    - Version: 1

  - **Merge**  
    - Type: Merge  
    - Role: Combines outputs from deletion loop and from "Switch Old Folders" false path into one data stream.  
    - Configuration: Default merge behavior.  
    - Inputs:  
      - From "Prepare HTML Email" (success path)  
      - From "Loop Over Items" (deletion path)  
    - Outputs: To "Prepare HTML Email".  
    - Edge Cases: Mismatched data structures can cause merge issues.  
    - Version: 3.2

#### 2.6 Backup Summary Email Preparation

- **Overview:**  
  Prepares a detailed and visually enhanced HTML email summarizing the backup results, including workflow counts, sizes, cleanup status, and insights.

- **Nodes Involved:**  
  - Prepare HTML Email

- **Node Details:**  
  - **Prepare HTML Email**  
    - Type: Code (JavaScript)  
    - Role: Aggregates data from multiple nodes (workflows retrieved, uploaded files, cleanup results) to build a styled HTML email body and subject line.  
    - Key Features:  
      - Calculates total workflows, active/inactive counts, recent modifications, large workflows (>50KB).  
      - Safely determines cleanup status (completed, not needed, unknown) by analyzing input data and execution paths.  
      - Generates a responsive HTML document with CSS styling for readability across devices.  
      - Includes detailed tables listing each workflow’s name, status, last update, and size.  
      - Logs debugging info for monitoring and troubleshooting.  
    - Inputs:  
      - Workflow data from "Retrieve workflows".  
      - Uploaded file data from "Upload JSON to folder".  
      - Cleanup status from deletion process merged via "Merge".  
    - Outputs: JSON with:  
      - `htmlEmailBody` (string): full HTML content  
      - `subject` (string): email subject line  
      - `summary` and `workflowList` objects for further processing if needed  
    - Edge Cases: Must handle missing or malformed data gracefully; errors in expressions or missing nodes can impact email content.  
    - Version: 2

#### 2.7 Email Notification

- **Overview:**  
  Sends the prepared HTML backup summary email to a specified recipient using Microsoft Outlook.

- **Nodes Involved:**  
  - Send HTML Success Email

- **Node Details:**  
  - **Send HTML Success Email**  
    - Type: Microsoft Outlook Node  
    - Role: Sends an email with the HTML content and subject generated by the previous node.  
    - Configuration:  
      - To: Must be manually configured with recipient email address.  
      - Subject: Expression `={{ $json.subject }}` (from Prepare HTML Email node output).  
      - Body Content: Expression `={{ $json.htmlEmailBody }}` (HTML content).  
      - Additional Fields: Sets `bodyContentType` to `html` for proper rendering.  
    - Inputs: Email content JSON from "Prepare HTML Email".  
    - Outputs: Email send confirmation or error details.  
    - Edge Cases: Invalid email address, Outlook credential errors, or network issues may cause failure.  
    - Requires properly configured Microsoft Outlook OAuth2 credentials.  
    - Version: 2

---

### 3. Summary Table

| Node Name               | Node Type                | Functional Role                         | Input Node(s)                 | Output Node(s)              | Sticky Note                                                                                                                                                                                                                  |
|-------------------------|--------------------------|---------------------------------------|------------------------------|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger Daily   | Schedule Trigger         | Initiates workflow daily at 1:00 AM   | None                         | Create new backup folder     | ## 📅 Schedule Trigger Daily: Triggers daily at 1:00 AM; server timezone sensitive.                                                                                                                                          |
| Create new backup folder | Microsoft OneDrive       | Creates dated backup folder on OneDrive | Schedule Trigger Daily        | Retrieve workflows           | ## 📁 Create New Backup Folder: Requires manual folder ID insertion for parent folder; dynamic folder name based on current date.                                                                                           |
| Retrieve workflows       | n8n Core Node            | Fetches all workflows from n8n         | Create new backup folder       | Convert to JSON file         | ## 📁 Retrieve Workflows: No filters applied; fetches all workflows; credentials must be valid.                                                                                                                              |
| Convert to JSON file     | Convert To File          | Converts workflows to JSON files       | Retrieve workflows            | Upload JSON to folder        | ## 📄 Convert to JSON file: Generates pretty-printed JSON files named after each workflow.                                                                                                                                   |
| Upload JSON to folder    | Microsoft OneDrive       | Uploads JSON files to backup folder    | Convert to JSON file          | Get backupfolders            | ## 📁 Upload JSON to Folder: Parent folder ID dynamically set; binary data upload enabled; ensure folder exists and permissions are correct.                                                                                |
| Get backupfolders        | Microsoft OneDrive       | Retrieves existing backup folders      | Upload JSON to folder         | Filter backup folder         | ## 📁 Get backup folders: Requires manual folder ID insertion; retrieves backup folders for cleanup.                                                                                                                       |
| Filter backup folder     | Code (JavaScript)        | Filters folders older than 31 days     | Get backupfolders             | Switch Old Folders           | ## 📁 Filter Backup Folder: Filters folders >31 days old; logs processing; outputs old folders or summary if none found.                                                                                                     |
| Switch Old Folders       | Switch                   | Routes based on presence of old folders | Filter backup folder          | Merge (False output), Loop Over Items (True output) | ## 🔄 Switch Old Folders: Routes workflow depending on `hasOldFolders` boolean; defines true/false output paths.                                                                                                            |
| Loop Over Items          | Split In Batches         | Processes deletion of old folders one by one | Switch Old Folders (True)     | Delete old backup folder (main), Merge (second) | ## 📁 Loop Over Items: Batch processes old folders for deletion one at a time.                                                                                                                                                |
| Delete old backup folder | Microsoft OneDrive       | Deletes a specified folder             | Loop Over Items               | Loop Over Items             | ## 🗑️ Delete Old Backup Folder: Deletes by folder ID dynamically; be cautious with folder IDs and permissions.                                                                                                              |
| Merge                   | Merge                    | Combines multiple data streams         | Loop Over Items, Switch Old Folders (False) | Prepare HTML Email          | ## 🔗 Merge: Combines outputs from deletion and non-deletion paths for email preparation.                                                                                                                                     |
| Prepare HTML Email       | Code (JavaScript)        | Builds detailed HTML summary email     | Merge                        | Send HTML Success Email      | ## 📧 Prepare HTML Email: Aggregates data, calculates statistics, formats styled HTML email body and subject.                                                                                                               |
| Send HTML Success Email  | Microsoft Outlook        | Sends the backup summary email         | Prepare HTML Email           | None                        | ## 📧 Send HTML Success Email: Sends HTML email with dynamic subject and body; requires Outlook credentials and configured recipient email.                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Daily node:**  
   - Type: Schedule Trigger  
   - Configure to trigger daily at 1:00 AM (set `triggerAtHour` to 1).  
   - No inputs; output connects to "Create new backup folder".

2. **Create Create new backup folder node:**  
   - Type: Microsoft OneDrive  
   - Operation: Create Folder  
   - Resource: Folder  
   - Name: Use expression `n8n_{{$now.format('yyyy-MM-dd')}}` to dynamically name folder by current date.  
   - Parent Folder ID: Insert your main OneDrive backup folder ID here (or leave blank for root).  
   - Connect input from Schedule Trigger Daily.  
   - Output connects to "Retrieve workflows".  

3. **Create Retrieve workflows node:**  
   - Type: n8n Core Node (n8n)  
   - Operation: Get all workflows (no filters).  
   - Input from Create new backup folder.  
   - Output connects to "Convert to JSON file".

4. **Create Convert to JSON file node:**  
   - Type: Convert To File  
   - Operation: toJson  
   - Mode: Each (process each workflow separately)  
   - Options: Enable `Format` (pretty JSON)  
   - File Name: Use expression `{{$json.name}}` to name files after workflow names.  
   - Input from Retrieve workflows.  
   - Output connects to "Upload JSON to folder".

5. **Create Upload JSON to folder node:**  
   - Type: Microsoft OneDrive  
   - Operation: Upload file  
   - Parent ID: Set expression `={{ $('Create new backup folder').item.json.id }}` to upload to new backup folder.  
   - Enable Binary Data upload.  
   - Input from Convert to JSON file.  
   - Output connects to "Get backupfolders".

6. **Create Get backupfolders node:**  
   - Type: Microsoft OneDrive  
   - Operation: List folders  
   - Resource: Folder  
   - Folder ID: Insert your main backup folder ID to list existing backup folders.  
   - Input from Upload JSON to folder.  
   - Output connects to "Filter backup folder".

7. **Create Filter backup folder node:**  
   - Type: Code (JavaScript)  
   - Paste the provided script that filters folders older than 31 days using Luxon DateTime.  
   - Input from Get backupfolders.  
   - Output connects to "Switch Old Folders".

8. **Create Switch Old Folders node:**  
   - Type: Switch  
   - Condition: Boolean check on `hasOldFolders` field.  
   - Output True: connects to "Loop Over Items".  
   - Output False: connects to "Merge".

9. **Create Loop Over Items node:**  
   - Type: Split In Batches  
   - Default options (no special batch size configured).  
   - Input from Switch Old Folders (True output).  
   - Main output connects to "Delete old backup folder".  
   - Second output connects to "Merge".

10. **Create Delete old backup folder node:**  
    - Type: Microsoft OneDrive  
    - Operation: Delete folder  
    - Folder ID: Expression `={{ $json.id }}` (from Loop item).  
    - Input from Loop Over Items main output.  
    - Output connects back to Loop Over Items second output to continue merging results.

11. **Create Merge node:**  
    - Type: Merge  
    - Inputs: Two inputs — one from Loop Over Items (second output), one from Switch Old Folders (False output).  
    - Output connects to "Prepare HTML Email".

12. **Create Prepare HTML Email node:**  
    - Type: Code (JavaScript)  
    - Paste the provided advanced script that:  
      - Aggregates workflow and uploaded file data  
      - Calculates statistics (active, inactive, sizes, recent changes)  
      - Determines cleanup status by analyzing previous nodes’ outputs  
      - Constructs a fully styled HTML email body and subject line  
    - Inputs from Merge node.  
    - Output connects to "Send HTML Success Email".

13. **Create Send HTML Success Email node:**  
    - Type: Microsoft Outlook  
    - Configure:  
      - To: Enter valid recipient email address.  
      - Subject: Expression `={{ $json.subject }}`  
      - Body Content: Expression `={{ $json.htmlEmailBody }}`  
      - Additional Fields: Set `bodyContentType` to `html`.  
    - Input from Prepare HTML Email.  
    - No outputs.

14. **Credential Setup:**  
    - Configure Microsoft OneDrive OAuth2 credentials with permissions for folder creation, listing, file upload, and deletion.  
    - Configure Microsoft Outlook OAuth2 credentials with permission to send emails.  
    - Validate n8n instance access for the Retrieve workflows node.

15. **Testing & Validation:**  
    - Manually trigger or wait for scheduled run.  
    - Verify OneDrive folder creation and file upload.  
    - Check OneDrive for deletion of old folders (>31 days).  
    - Confirm receipt and rendering of the HTML email.  
    - Monitor execution logs for errors or warnings.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Context or Link                                                                                  |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The workflow’s main OneDrive folder ID must be manually inserted in the "Create new backup folder" and "Get backupfolders" nodes. Use the disabled "Search a folder" node to find folder IDs in your OneDrive if unknown.                                                                                                                                                                                                                                                                            | Sticky Note: "Search a folder" node (currently disabled)                                       |
| The HTML email uses responsive CSS and includes rich insights such as number of active workflows, recently modified workflows, large workflows, and detailed workflow list with statuses and sizes.                                                                                                                                                                                                                                                                                                    | Sticky Note: Prepare HTML Email node explanation                                               |
| The workflow assumes an active and authorized Microsoft OneDrive and Outlook accounts with sufficient permissions. Backup deletion is irreversible; ensure folder IDs are correct to avoid accidental data loss.                                                                                                                                                                                                                                                                                      | General caution                                                                                 |
| The scheduled trigger runs based on the server timezone, which may differ from your local timezone; adjust accordingly if precise timing is required.                                                                                                                                                                                                                                                                                                                                               | Sticky Note: Schedule Trigger Daily                                                           |
| For troubleshooting, check the logs output by the Prepare HTML Email node, which includes counts of workflows, cleanup status, and file upload details.                                                                                                                                                                                                                                                                                                                                             | Logs in Prepare HTML Email node                                                                |
| This workflow can be adapted to other cloud storage or email services by replacing OneDrive and Outlook nodes accordingly, provided equivalent functionality exists.                                                                                                                                                                                                                                                                                                                                | Extension note                                                                                  |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---