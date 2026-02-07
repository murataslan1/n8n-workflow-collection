Automate Daily Workflow Backups to Google Drive

https://n8nworkflows.xyz/workflows/automate-daily-workflow-backups-to-google-drive-10903


# Automate Daily Workflow Backups to Google Drive

### 1. Workflow Overview

This workflow automates the daily backup of all n8n workflows by saving their JSON representations to Google Drive in a timestamped folder. It is designed for n8n users who want to maintain regular backups of their workflow configurations without manual intervention. The workflow is logically divided into three main blocks:

- **1.1 Initialization:** Triggering the workflow on a schedule or manually and creating a dated backup folder in Google Drive.
- **1.2 Process & Upload:** Fetching all workflows from n8n, iterating over each, converting them to JSON files, and uploading them into the created folder.
- **1.3 Maintenance:** Cleaning up old backup folders on Google Drive by deleting backups older than 7 days to manage storage space.

---

### 2. Block-by-Block Analysis

#### 2.1 Initialization

- **Overview:**  
  Starts the workflow execution either on a scheduled trigger (default 11 PM daily) or manual trigger and creates a new Google Drive folder named with the current date to hold the day’s backups.

- **Nodes Involved:**  
  - Schedule Trigger  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Create Backup Folder  

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Configuration: Executes at 23:00 (11 PM) daily by default.  
    - Inputs: None (entry point)  
    - Outputs: Triggers the "Create Backup Folder" node.  
    - Edge Cases: Timezone differences may affect trigger timing if n8n server timezone is not set correctly.

  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Configuration: Allows manual start of the workflow from the n8n editor for testing or immediate backup.  
    - Inputs: None (entry point)  
    - Outputs: Triggers the "Create Backup Folder" node.

  - **Create Backup Folder**  
    - Type: Google Drive - Folder creation  
    - Configuration: Creates a folder named `Workflow Backups YYYY-MM-DD` in the user’s Google Drive "My Drive" root or specified parent folder.  
    - Key Expression: Folder name uses current date formatted as `{{ $now.format('yyyy-MM-dd') }}`.  
    - Inputs: Triggered by either Schedule Trigger or Manual Trigger.  
    - Outputs: Passes the created folder’s metadata (including ID) to the "Fetch Workflows" node.  
    - Credentials: Requires Google Drive OAuth2 credentials.  
    - Edge Cases:  
      - Failure if credentials are invalid or expired.  
      - Folder creation fails if Drive quota is exceeded or network issues occur.

---

#### 2.2 Process & Upload

- **Overview:**  
  Retrieves all workflows from the n8n instance, loops through each workflow, converts it to a JSON file, and uploads the file into the previously created Google Drive folder.

- **Nodes Involved:**  
  - Fetch Workflows  
  - Loop Workflows  
  - Convert to JSON  
  - Upload to Drive  

- **Node Details:**

  - **Fetch Workflows**  
    - Type: n8n API node  
    - Configuration: Calls the n8n API to list all workflows without filters.  
    - Inputs: Receives folder metadata from "Create Backup Folder".  
    - Outputs: Passes array of workflows to "Loop Workflows".  
    - Credentials: Requires n8n API credentials with appropriate permissions.  
    - Edge Cases:  
      - API errors if credentials are invalid.  
      - Empty workflow list if no workflows exist.

  - **Loop Workflows**  
    - Type: SplitInBatches  
    - Configuration: Splits workflows array into batches of 1 to process workflows individually, enabling sequential processing.  
    - Inputs: Receives workflows list from "Fetch Workflows".  
    - Outputs: For each workflow, triggers two parallel paths: "Cleanup Old Backups" and "Convert to JSON".  
    - Edge Cases: Large numbers of workflows may affect performance or cause rate limits.

  - **Convert to JSON**  
    - Type: Convert To File  
    - Configuration: Converts each workflow JSON object to a JSON file format with the filename set as the workflow name plus `.json` extension (`{{ $json.name }}.json`).  
    - Inputs: Receives individual workflow data from "Loop Workflows".  
    - Outputs: Passes file data to "Upload to Drive".  
    - Edge Cases: Filename conflicts if workflow names are duplicated; invalid JSON data could cause conversion failure.

  - **Upload to Drive**  
    - Type: Google Drive - File upload  
    - Configuration: Uploads the JSON file to the folder created earlier. The folder ID is dynamically retrieved from "Create Backup Folder" node output (`{{$('Create Backup Folder').item.json.id}}`). The file name is taken from the converted JSON file metadata.  
    - Inputs: Receives file content from "Convert to JSON".  
    - Outputs: Returns upload confirmation and then loops back to "Loop Workflows" to process the next workflow.  
    - Credentials: Google Drive OAuth2 credentials required.  
    - Edge Cases: Upload failures due to network, authentication, or quota limits.

---

#### 2.3 Maintenance

- **Overview:**  
  After processing workflows, this block deletes Google Drive folders with backups older than 7 days from a specified parent folder to keep storage clean.

- **Nodes Involved:**  
  - Cleanup Old Backups (Code Node)  

- **Node Details:**

  - **Cleanup Old Backups**  
    - Type: Code (JavaScript) Node  
    - Configuration:  
      - User must manually set `parentFolderId` to the Google Drive folder where backups are stored.  
      - The script queries Google Drive for folders with names containing 'Workflow Backups' under the parent folder.  
      - Compares each folder’s creation date to the cutoff date (7 days ago).  
      - Deletes folders older than 7 days by making authenticated HTTP DELETE requests to Google Drive API.  
      - Returns the number of deleted and remaining folders.  
    - Inputs: Triggered in parallel for each workflow iteration (though logically it acts once per execution).  
    - Outputs: Provides cleanup status JSON.  
    - Credentials: Google Drive OAuth2 credentials required.  
    - Edge Cases:  
      - Requires correct parent folder ID setup; otherwise, no folders are cleaned.  
      - Permission errors if OAuth2 credentials lack delete permissions.  
      - Network or API rate limit errors.  
      - Errors are caught and logged, with failures returned as part of JSON output.

---

### 3. Summary Table

| Node Name                 | Node Type             | Functional Role                             | Input Node(s)                      | Output Node(s)                        | Sticky Note                                                                                          |
|---------------------------|-----------------------|---------------------------------------------|-----------------------------------|-------------------------------------|----------------------------------------------------------------------------------------------------|
| Schedule Trigger          | Schedule Trigger      | Triggers workflow daily at 11 PM            | —                                 | Create Backup Folder                 | See "Main Description" for setup instructions including schedule adjustment.                        |
| When clicking ‘Execute workflow’ | Manual Trigger        | Allows manual execution of the workflow     | —                                 | Create Backup Folder                 | See "Main Description" for setup instructions.                                                     |
| Create Backup Folder      | Google Drive          | Creates dated folder for backups             | Schedule Trigger, Manual Trigger   | Fetch Workflows                     | Requires Google Drive OAuth2; folder named with date.                                              |
| Fetch Workflows           | n8n API               | Fetches all workflows from n8n instance     | Create Backup Folder               | Loop Workflows                      | Requires n8n API credentials.                                                                      |
| Loop Workflows            | SplitInBatches        | Iterates workflows one by one                | Fetch Workflows                   | Cleanup Old Backups, Convert to JSON | Splits workflows to process individually.                                                          |
| Convert to JSON           | Convert To File       | Converts workflow data to JSON file          | Loop Workflows                   | Upload to Drive                    | Generates JSON filename from workflow name.                                                        |
| Upload to Drive           | Google Drive          | Uploads JSON file to the created folder      | Convert to JSON                  | Loop Workflows                    | Uses folder ID output from "Create Backup Folder".                                                 |
| Cleanup Old Backups       | Code                  | Deletes backup folders older than 7 days     | Loop Workflows                   | —                                   | Must configure parent folder ID in code; deletes old backup folders to manage storage.             |
| Main Description          | Sticky Note           | Explains workflow purpose and setup          | —                                 | —                                   | Contains detailed workflow overview, how it works, and setup steps.                                |
| Section 1                 | Sticky Note           | Labels Initialization block                   | —                                 | —                                   | —                                                                                                  |
| Section 2                 | Sticky Note           | Labels Process & Upload block                  | —                                 | —                                   | —                                                                                                  |
| Section 3                 | Sticky Note           | Labels Maintenance block                       | —                                 | —                                   | —                                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 23:00 (11 PM) or your preferred hour.  
   - No credentials required.

2. **Create the Manual Trigger node:**  
   - Type: Manual Trigger  
   - No configuration needed.

3. **Create the "Create Backup Folder" node:**  
   - Type: Google Drive  
   - Operation: Create Folder  
   - Name: Use expression `Workflow Backups {{ $now.format('yyyy-MM-dd') }}`  
   - Drive: Select "My Drive" or desired drive.  
   - Credentials: Add Google Drive OAuth2 credentials.  
   - Connect outputs of Schedule Trigger and Manual Trigger to this node.

4. **Create the "Fetch Workflows" node:**  
   - Type: n8n API  
   - Operation: List Workflows (no filters)  
   - Credentials: Add n8n API credentials with read permissions.  
   - Connect output of "Create Backup Folder" to this node.

5. **Create the "Loop Workflows" node:**  
   - Type: SplitInBatches  
   - Batch Size: 1 (default) to process workflows individually.  
   - Connect output of "Fetch Workflows" to this node.

6. **Create the "Convert to JSON" node:**  
   - Type: Convert To File  
   - Operation: To JSON  
   - File Name: `{{ $json.name }}.json`  
   - Connect one output of "Loop Workflows" to this node.

7. **Create the "Upload to Drive" node:**  
   - Type: Google Drive  
   - Operation: Upload File  
   - File Name: Use expression `{{ $json.fileName }}` from previous node.  
   - Drive: Select "My Drive" or consistent with folder creation.  
   - Folder ID: Use expression `{{ $('Create Backup Folder').item.json.id }}` to upload into the created folder.  
   - Credentials: Google Drive OAuth2 credentials.  
   - Connect "Convert to JSON" output to this node.

8. **Connect the output of "Upload to Drive" back to "Loop Workflows":**  
   - This enables iterative processing of all workflows.

9. **Create the "Cleanup Old Backups" node:**  
   - Type: Code (JavaScript)  
   - Paste the provided JavaScript code into the node.  
   - **Important:** Replace `'PASTE_YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE'` with the actual Google Drive parent folder ID where backups are stored (the parent folder containing all daily backup folders).  
   - Credentials: Google Drive OAuth2 credentials.  
   - Connect one output of "Loop Workflows" to this node (parallel to "Convert to JSON") to run cleanup during batch processing.

10. **Add Sticky Notes for documentation:**  
    - Add a sticky note at the start explaining workflow purpose, setup instructions, and how it works.  
    - Add sticky notes to label each logical section: Initialization, Process & Upload, and Maintenance.

11. **Verify all credentials are valid and connected:**  
    - Google Drive OAuth2 (with permissions to create folders, upload files, and delete files).  
    - n8n API credentials (read access to workflows).

12. **Test the workflow:**  
    - Run manually using the Manual Trigger node and verify backups appear in Google Drive.  
    - Ensure old backups are cleaned properly after 7 days.

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                                                                           |
|-----------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Important to paste the Parent Folder ID in the 'Cleanup Old Backups' code node before running. | See "Cleanup Old Backups" node JavaScript code comment and main sticky note instructions.                 |
| Default schedule trigger is set to 11 PM daily; adjust as needed in the Schedule Trigger node. | Main sticky note and Schedule Trigger node configuration.                                                |
| Workflow uses Google Drive OAuth2 API; ensure scopes include file creation, reading, and deletion. | Google Drive API OAuth2 setup documentation for n8n.                                                    |
| n8n API credentials must have read access to workflows for fetching them properly.             | n8n API credential setup instructions.                                                                   |
| For large numbers of workflows, consider API rate limits and execution timeout settings in n8n. | General n8n API best practices.                                                                          |
| Folder naming uses ISO date format (YYYY-MM-DD) to keep folders ordered chronologically.       | Naming convention explained in "Create Backup Folder" node.                                              |
| Delete operation in cleanup handles errors gracefully and logs failures without stopping workflow. | Code node JavaScript error handling section.                                                             |
| Workflow inactive by default; activate when ready to deploy.                                  | Workflow metadata "active": false.                                                                         |

---

**Disclaimer:**  
The provided text derives exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All manipulated data are legal and public.