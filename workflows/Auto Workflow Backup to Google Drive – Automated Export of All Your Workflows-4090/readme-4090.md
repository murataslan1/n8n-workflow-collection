Auto Workflow Backup to Google Drive – Automated Export of All Your Workflows

https://n8nworkflows.xyz/workflows/auto-workflow-backup-to-google-drive---automated-export-of-all-your-workflows-4090


# Auto Workflow Backup to Google Drive – Automated Export of All Your Workflows

---

### 1. Workflow Overview

This workflow automates the backup of all n8n workflows by exporting each workflow as a separate `.json` file and storing them in a date-stamped folder on Google Drive. It supports manual or scheduled triggering, enabling regular backups without manual intervention.

**Target Use Cases:**  
- Developers and teams managing multiple n8n workflows who require automated backup and version control.  
- Agencies or automation teams needing disaster recovery and easy workflow sharing.  
- Users wanting to keep Google Drive clean by optionally deleting old backup folders.

**Logical Blocks:**

- **1.1 Trigger Block**: Initiates the backup process either manually or on a scheduled interval.  
- **1.2 Backup Folder Creation**: Creates a uniquely named folder in Google Drive for the current backup session.  
- **1.3 Workflow Retrieval**: Connects to the n8n API to fetch all existing workflows.  
- **1.4 Workflow Iteration and File Conversion**: Processes each workflow individually, converting it into a `.json` file.  
- **1.5 Upload to Google Drive**: Uploads each `.json` workflow file into the created backup folder.  
- **1.6 Old Backup Cleanup (Optional)**: Retrieves existing backup folders, filters out the current one, and deletes the old folders to maintain drive organization.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Trigger Block

**Overview:**  
Starts the workflow either manually or automatically on a defined schedule.

**Nodes Involved:**  
- Manual trigger  
- Schedule Trigger

**Node Details:**

- **Manual trigger**  
  - *Type:* Trigger node for manual start  
  - *Configuration:* Default (no parameters)  
  - *Input:* None (starts workflow)  
  - *Output:* Triggers “Create new folder” node  
  - *Edge Cases:* User must manually trigger; no failures expected.

- **Schedule Trigger**  
  - *Type:* Trigger node for scheduled start  
  - *Configuration:* Runs weekly (every 1 week) by default; can be customized  
  - *Input:* None (starts workflow on schedule)  
  - *Output:* Triggers “Create new folder” node  
  - *Edge Cases:* Possible scheduling misconfiguration; time zone settings affect trigger time.

---

#### 1.2 Backup Folder Creation

**Overview:**  
Creates a new Google Drive folder named with the current date to store backup files.

**Nodes Involved:**  
- Create new folder

**Node Details:**

- **Create new folder**  
  - *Type:* Google Drive resource creation node  
  - *Configuration:*  
    - Folder name dynamically set as: `Workflow Backups [Day of week] [time] [date in dd-MM-yyyy]` (e.g., “Workflow Backups Monday 16-05-2025”)  
    - Parent folder ID must be replaced with user’s destination folder ID  
    - Uses Google Drive OAuth2 credentials (“Google demo” placeholder)  
  - *Input:* Trigger node output  
  - *Output:* Folder metadata including folder ID, passed downstream  
  - *Edge Cases:* Authentication failure with Google Drive; invalid folder ID; permission issues.

---

#### 1.3 Workflow Retrieval

**Overview:**  
Fetches the list of all workflows from the n8n instance via the internal API.

**Nodes Involved:**  
- Get n8n workflow

**Node Details:**

- **Get n8n workflow**  
  - *Type:* n8n API node to request workflows  
  - *Configuration:* No filters; retrieves all workflows  
  - *Credentials:* n8n API credentials (“n8n demo” placeholder) required  
  - *Input:* Output of “Create new folder” node  
  - *Output:* JSON array of all workflows with metadata (id, name, etc.)  
  - *Edge Cases:* API authentication issues, timeout, empty workflow list, network errors  
  - *Retry Logic:* Enabled (retry on failure) to handle transient errors.

---

#### 1.4 Workflow Iteration and File Conversion

**Overview:**  
Processes each workflow individually by iterating through workflows, converting each to a `.json` file.

**Nodes Involved:**  
- Loop (SplitInBatches)  
- Limit  
- Convert to File

**Node Details:**

- **Loop (SplitInBatches)**  
  - *Type:* Splits input array into batches for iterative processing  
  - *Configuration:* Default (batch size unspecified, defaults to 1)  
  - *Input:* List of workflows from “Get n8n workflow”  
  - *Output:* Single workflow item per iteration  
  - *Edge Cases:* Large numbers of workflows could slow processing; batch size tuning recommended.

- **Limit**  
  - *Type:* Limits number of items passing through (default: no limit)  
  - *Configuration:* Default parameters (no explicit limit set)  
  - *Input:* Output of “Loop” node  
  - *Output:* Passed to “Get folders” node for cleanup logic  
  - *Edge Cases:* Misconfiguration could block items unintentionally.

- **Convert to File**  
  - *Type:* Converts JSON data to a file format  
  - *Configuration:*  
    - Format: JSON  
    - File name dynamically set as `[workflow name].json`  
  - *Input:* Single workflow JSON object from iteration  
  - *Output:* Binary file data for upload  
  - *Edge Cases:* Workflow names with invalid filename characters could cause failures; ensure name sanitization if required.

---

#### 1.5 Upload to Google Drive

**Overview:**  
Uploads each converted `.json` workflow file into the newly created Google Drive backup folder.

**Nodes Involved:**  
- Upload workflow

**Node Details:**

- **Upload workflow**  
  - *Type:* Google Drive file upload node  
  - *Configuration:*  
    - File name: `[workflow name].json` dynamically set  
    - Folder ID: Uses ID from “Create new folder” output  
    - Drive ID: Left empty (default drive)  
  - *Credentials:* Google Drive OAuth2 credentials (“Google demo”)  
  - *Input:* Output from “Convert to File” node  
  - *Output:* Metadata of uploaded file  
  - *Edge Cases:* Google Drive quota exceeded, API rate limits, permission errors.

- **Loop connection**  
  - Upload node output loops back to “Loop” node to process next workflow until all are uploaded.

---

#### 1.6 Old Backup Cleanup (Optional)

**Overview:**  
Optionally cleans up old backup folders by retrieving existing backup folders, filtering out the newly created one, and deleting the rest.

**Nodes Involved:**  
- Get folders  
- Filter  
- Delete folder

**Node Details:**

- **Get folders**  
  - *Type:* Google Drive node to list files/folders  
  - *Configuration:*  
    - No specific folder filter set (empty folderId list)  
    - Retrieves all files/folders accessible in drive  
  - *Credentials:* Google Drive OAuth2 credentials (“Google demo”)  
  - *Input:* Output of “Limit” node (connected after initial iterations)  
  - *Output:* List of folders/files in Google Drive  
  - *Edge Cases:* Large numbers of files may slow query; permission scope needed.

- **Filter**  
  - *Type:* Filter node to exclude current backup folder  
  - *Configuration:*  
    - Condition: Folder ID not equal to the ID of the current backup folder (from “Create new folder”)  
    - Case-insensitive string comparison  
  - *Input:* Output list from “Get folders”  
  - *Output:* Folders excluding the current backup folder  
  - *Edge Cases:* Misconfiguration could delete current backup folder; careful expression evaluation required.

- **Delete folder**  
  - *Type:* Google Drive folder deletion node  
  - *Configuration:*  
    - Permanently deletes each filtered folder  
    - Takes folder ID from filtered list  
  - *Credentials:* Google Drive OAuth2 credentials (“Google demo”)  
  - *Input:* Filtered folders from “Filter” node  
  - *Output:* Confirmation of deletion  
  - *Edge Cases:* Permission denied, folders containing files, API quota limits, irreversible deletion risk.

---

### 3. Summary Table

| Node Name          | Node Type                | Functional Role                  | Input Node(s)           | Output Node(s)        | Sticky Note                                                                                                                                |
|--------------------|--------------------------|--------------------------------|------------------------|-----------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| Manual trigger      | Manual Trigger           | Start workflow manually         | None                   | Create new folder      |                                                                                                                                             |
| Schedule Trigger    | Schedule Trigger         | Start workflow on schedule      | None                   | Create new folder      |                                                                                                                                             |
| Create new folder   | Google Drive             | Create dated backup folder      | Manual trigger, Schedule Trigger | Get n8n workflow      | Replace folder ID with your own destination folder in Google Drive for backups.                                                             |
| Get n8n workflow    | n8n API                  | Retrieve all workflows          | Create new folder      | Loop                  | Replace “n8n demo” with your n8n API credentials.                                                                                           |
| Loop               | SplitInBatches           | Iterate workflows individually  | Get n8n workflow       | Limit, Convert to File |                                                                                                                                             |
| Limit              | Limit                    | Control item flow (batch limit) | Loop                   | Get folders            |                                                                                                                                             |
| Get folders         | Google Drive             | List existing backup folders    | Limit                  | Filter                | Replace “Google demo” with your Google Drive OAuth2 credentials.                                                                            |
| Filter             | Filter                   | Exclude current backup folder   | Get folders            | Delete folder          |                                                                                                                                             |
| Delete folder       | Google Drive             | Delete old backup folders       | Filter                 | None                  | Use with caution: deletes folders permanently.                                                                                             |
| Convert to File     | Convert To File          | Convert workflows to .json files| Loop                   | Upload workflow        | Filename set to workflow name + .json                                                                                                      |
| Upload workflow     | Google Drive             | Upload converted workflow files | Convert to File        | Loop                   | Replace “Google demo” with your Google Drive OAuth2 credentials.                                                                            |
| Sticky Note        | Sticky Note              | Documentation and instructions  | None                   | None                   | Contains overall workflow description, setup instructions, and tips.                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a **Manual Trigger** node (default settings).  
   - Add a **Schedule Trigger** node configured to run weekly (interval: 1 week). Both will connect to the next step.

2. **Create Backup Folder in Google Drive:**  
   - Add a **Google Drive** node configured to create a folder.  
   - Set resource to `folder`, operation to `create`.  
   - For the folder name, use an expression:  
     `Workflow Backups {{$now.format('cccc')}} {{$now.format('t')}} {{$now.format('dd-MM-yyyy')}}`  
   - Set the parent folder ID to your desired Google Drive backup folder.  
   - Configure with your **Google Drive OAuth2 credentials**.

3. **Fetch All n8n Workflows:**  
   - Add an **n8n API** node to get workflows.  
   - Use no filters to fetch all workflows.  
   - Connect output of “Create new folder” to this node.  
   - Configure with your **n8n API credentials**.

4. **Iterate Over Each Workflow:**  
   - Add a **SplitInBatches** node to split the list of workflows into single items (default batch size).  
   - Connect output of “Get n8n workflow” to this node.

5. **Limit Node:**  
   - Add a **Limit** node after “SplitInBatches” (optional, default no limit).  
   - Connect “SplitInBatches” output to “Limit.”

6. **Get Existing Backup Folders:**  
   - Add a **Google Drive** node to list folders/files.  
   - Set resource to `fileFolder`, operation to list files/folders.  
   - Leave folderId empty to list across Drive or set parent folder as needed.  
   - Connect “Limit” node output here.

7. **Filter Old Backup Folders:**  
   - Add a **Filter** node to exclude the current backup folder.  
   - Condition: Folder ID not equal to the ID from “Create new folder” node.  
   - Connect output of “Get folders” to this filter node.

8. **Delete Old Backup Folders:**  
   - Add a **Google Drive** node configured to delete folders permanently.  
   - Set resource to `folder`, operation to `deleteFolder`.  
   - Folder ID comes from filtered folders.  
   - Connect output of “Filter” node here.  
   - Use same Google Drive credentials.

9. **Convert Each Workflow to JSON File:**  
   - Add a **Convert To File** node.  
   - Set operation to convert to JSON file.  
   - File name expression: `{{$json.name}}.json`  
   - Connect “SplitInBatches” output to this node (also the path used for uploading).

10. **Upload JSON File to Google Drive:**  
    - Add a **Google Drive** node for file upload.  
    - Set resource to `file`, operation to `upload`.  
    - File name: use expression `{{$json.name}}.json` from the workflow data.  
    - Folder ID: use the ID output from “Create new folder.”  
    - Connect output of “Convert To File” node here.

11. **Loop Uploads:**  
    - Connect output of “Upload workflow” node back to “SplitInBatches” to continue uploading all workflows.

12. **Add Sticky Note (Optional):**  
    - Add a Sticky Note node containing the workflow purpose, instructions, and setup details for documentation.

13. **Configure Credentials:**  
    - Replace all placeholder credentials with your real Google Drive OAuth2 and n8n API credentials.

14. **Test Workflow:**  
    - Run the workflow manually first.  
    - Confirm backup folder creation and file uploads on Google Drive.  
    - Optionally enable the schedule trigger for automated backups.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                             | Context or Link                                                                                 |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow ensures automated versioning and backup of n8n workflows as `.json` files in a neatly date-stamped Google Drive folder.                                         | Workflow purpose                                                                                |
| Replace placeholders “Google demo” and “n8n demo” credentials with your actual credentials before running.                                                              | Setup instructions                                                                             |
| Use the “Schedule Trigger” node to automate backups on any desired interval (weekly suggested).                                                                          | Scheduling                                                                                     |
| Optional cleanup logic deletes old backup folders to avoid clutter; use with caution as deletion is permanent.                                                          | Cleanup logic                                                                                  |
| Workflow compatible with n8n version supporting Google Drive OAuth2 nodes (v3+ recommended) and n8n API node.                                                           | Version requirements                                                                           |
| Consider adding filename sanitization if workflow names may contain special characters invalid for file naming.                                                        | Edge case handling                                                                             |
| To extend, replace Google Drive upload node with other storage nodes (Dropbox, S3, etc.) for alternate backup locations.                                               | Extensibility                                                                                  |
| Official n8n Google Drive node documentation: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googledrive/                                          | Reference                                                                                      |
| Official n8n API node documentation: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.n8n/                                                             | Reference                                                                                      |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly complies with current content policies and contains no illegal, offensive, or proprietary elements. All data handled is legal and public.

---