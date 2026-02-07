Automate Workflow & Credentials Backup to S3 with Retention Management

https://n8nworkflows.xyz/workflows/automate-workflow---credentials-backup-to-s3-with-retention-management-6436


# Automate Workflow & Credentials Backup to S3 with Retention Management

### 1. Workflow Overview

This workflow automates the backup of n8n workflows and credentials to an Amazon S3 bucket, with built-in retention management to delete outdated backups. It is designed for n8n users who want to securely archive their configurations and credentials regularly and manage storage by automatically removing backups older than a specified retention period.

The workflow consists of the following logical blocks:

- **1.1 Scheduled Trigger and Configuration Setup:** Initiates the backup process daily and sets configuration variables for S3 bucket name, retention period, timestamps, and temporary file paths.
- **1.2 Workflow Export and Backup Storage:** Retrieves all existing workflows, converts them to JSON, and uploads them individually to S3 with date-based folder structure.
- **1.3 Credential Export and Backup Storage:** Exports all credentials to a temporary file, reads the file, uploads it to S3, and cleans up the temporary file.
- **1.4 Existing Backup Retrieval and Retention Management:** Lists existing backups in the S3 bucket, extracts their last modified dates, filters backups that exceed the retention period, and deletes those outdated backups from S3.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger and Configuration Setup

- **Overview:**  
  This block triggers the workflow daily at 23:00 (11 PM) and initializes critical variables such as the S3 bucket name, current timestamp, retention duration, and temporary file path for credential exports.

- **Nodes Involved:**  
  - Daily Backup  
  - Config  
  - Sticky Note  
  - Sticky Note4  
  - Sticky Note5  
  - Sticky Note6

- **Node Details:**

  - **Daily Backup**  
    - Type: Schedule Trigger  
    - Role: Starts the workflow every day at 23:00.  
    - Configuration: Interval set to trigger at the 23rd hour daily.  
    - Input: None (trigger node).  
    - Output: Passes execution to Config node.  
    - Edge Cases: Misconfiguration could lead to no execution or multiple triggers per day. Timezone considerations may apply.

  - **Config**  
    - Type: Set  
    - Role: Defines workflow-wide variables such as:  
      - `bucketName`: S3 bucket to use (placeholder `<YOUR BUCKET NAME HERE>`, must be replaced).  
      - `timstamp`: Current date in `yyyy-MM-dd` format.  
      - `retention`: Number of days backups are kept (default 31).  
      - `retentionUnit`: Unit for retention period ("days").  
      - `tempCredentialBackupFile`: Temporary path for credential export file.  
    - Input: Triggered by Daily Backup.  
    - Output: Passes variables downstream to workflow export and backup listing nodes.  
    - Edge Cases: Not setting `bucketName` will cause downstream S3 operations to fail.

  - **Sticky Notes (Sticky Note, Sticky Note4, Sticky Note5, Sticky Note6)**  
    - Type: Sticky Note  
    - Role: Provide reminders and TODOs such as setting S3 credentials, configuring retention, API key setup, and activation instructions.  
    - Input/Output: None (documentation only).  
    - Important for users to review before running workflow.

---

#### 2.2 Workflow Export and Backup Storage

- **Overview:**  
  Retrieves all current workflows from n8n, serializes each as JSON, and uploads each to the configured S3 bucket under a structured path: `workflows/{workflowId}/{date}.json`.

- **Nodes Involved:**  
  - Get many workflows  
  - Store Workflow Backup

- **Node Details:**

  - **Get many workflows**  
    - Type: n8n API (n8n node)  
    - Role: Requests all workflows configured in the n8n instance.  
    - Configuration: No filter, requests all workflows.  
    - Input: Receives variables from Config node.  
    - Output: Passes each workflow JSON object downstream.  
    - Edge Cases: Requires valid n8n API credentials; failure if API key missing or insufficient permissions.  

  - **Store Workflow Backup**  
    - Type: S3 (Amazon Simple Storage Service)  
    - Role: Uploads each workflow JSON to S3 bucket as a file.  
    - Configuration:  
      - Bucket name: from `Config.bucketName`.  
      - File name pattern: `workflows/{workflowId}/{timestamp}.json`.  
      - File content: JSON string of the workflow.  
      - Tags: Adds S3 tag `name` with the workflow's name for easier identification.  
    - Input: Receives workflows from Get many workflows node.  
    - Output: None (end of this export branch).  
    - Edge Cases: S3 permission errors, bucket name misconfiguration, network timeouts.

---

#### 2.3 Credential Export and Backup Storage

- **Overview:**  
  Exports all n8n credentials to a temporary JSON file, reads that file, uploads it to the S3 bucket under `credentials/{date}.json`, then deletes the temporary file to avoid leftovers.

- **Nodes Involved:**  
  - Export Credentials  
  - Load Credentials  
  - Store Credentials Backup  
  - Delete Temporary File

- **Node Details:**

  - **Export Credentials**  
    - Type: Execute Command  
    - Role: Runs CLI command `n8n export:credentials --all` to export all credentials into a file specified by `tempCredentialBackupFile` (default `/tmp/CredentialBackup.json`).  
    - Configuration: Command uses expression to insert temp file path from Config.  
    - Input: Receives variables from Config node.  
    - Output: Passes execution to Load Credentials node.  
    - Edge Cases: CLI must be accessible; permissions to write temp file required; failures if n8n environment not configured properly.

  - **Load Credentials**  
    - Type: Read/Write File  
    - Role: Reads the temporary credential backup JSON file into workflow data.  
    - Configuration: File path dynamically set from `Config.tempCredentialBackupFile`.  
    - Input: Output of Export Credentials.  
    - Output: Passes file content to Store Credentials Backup node.  
    - Edge Cases: File may not exist if Export Credentials failed; read permission issues.

  - **Store Credentials Backup**  
    - Type: S3  
    - Role: Uploads the credential backup JSON to S3 bucket under the path `credentials/{timestamp}.json`.  
    - Configuration:  
      - Bucket name from Config.  
      - File name pattern uses timestamp.  
      - Uploads JSON content read from file.  
    - Input: Receives credential JSON from Load Credentials.  
    - Output: Passes execution to Delete Temporary File.  
    - Edge Cases: S3 permissions, bucket misconfiguration.

  - **Delete Temporary File**  
    - Type: Execute Command  
    - Role: Deletes the temporary credential backup file to clean up.  
    - Configuration: Command `rm {tempCredentialBackupFile}` uses expression from Config.  
    - Input: After successful upload of credentials backup.  
    - Output: Ends this branch.  
    - Edge Cases: File deletion failure if file doesn't exist or permissions insufficient.

---

#### 2.4 Existing Backup Retrieval and Retention Management

- **Overview:**  
  Lists all files in the S3 bucket, extracts last modified dates and file keys, filters backups older than the retention period, and deletes those outdated backups from the bucket.

- **Nodes Involved:**  
  - Get Existing Backups  
  - Extract Date  
  - Keep Outdated Backups  
  - Delete Outdated Backups

- **Node Details:**

  - **Get Existing Backups**  
    - Type: S3  
    - Role: Lists all objects in the configured S3 bucket, returning all found backups.  
    - Configuration:  
      - Bucket name from Config.  
      - Operation: Search bucket, return all results.  
    - Input: Receives variables from Config node.  
    - Output: Passes list of S3 objects downstream.  
    - Edge Cases: S3 permission issues; network timeouts; large buckets could cause pagination issues (though `returnAll` is true).

  - **Extract Date**  
    - Type: Set  
    - Role: Maps each S3 object to extract:  
      - `date`: LastModified date formatted as `yyyy-MM-dd`.  
      - `key`: The S3 object key (filename/path).  
    - Input: List of S3 objects from Get Existing Backups.  
    - Output: Passes objects with date and key properties downstream.  
    - Edge Cases: Objects missing metadata could cause expression failures.

  - **Keep Outdated Backups**  
    - Type: Filter  
    - Role: Filters the list to keep only those backups whose `date` is before the current date minus the retention period.  
    - Configuration:  
      - Condition 1: `date` is not empty.  
      - Condition 2: `date` is before `now - retention days`.  
    - Input: Receives S3 objects with extracted dates.  
    - Output: Passes outdated backups downstream.  
    - Edge Cases: Date parsing failures if invalid date formats; retention period misconfiguration.

  - **Delete Outdated Backups**  
    - Type: S3  
    - Role: Deletes each outdated backup file from the S3 bucket using its key.  
    - Configuration:  
      - Bucket name from Config.  
      - Operation: Delete file by key.  
    - Input: List of filtered outdated backups from Keep Outdated Backups.  
    - Output: End of retention management.  
    - Edge Cases: Deletion failures due to permissions or file not found.

---

### 3. Summary Table

| Node Name              | Node Type             | Functional Role                                 | Input Node(s)             | Output Node(s)               | Sticky Note                                                    |
|------------------------|-----------------------|------------------------------------------------|---------------------------|-----------------------------|----------------------------------------------------------------|
| Daily Backup           | Schedule Trigger      | Triggers workflow daily at 23:00                 | None                      | Config                      | Adjust the trigger to suit your schedule (default: daily execution at 11pm). Remember to activate the workflow once all TODOs are resolved. Test the workflow by executing it. |
| Config                 | Set                   | Defines variables such as bucketName, retention, timestamp, temp file path | Daily Backup              | Get many workflows, Get Existing Backups, Export Credentials | Adjust retention (how long backups are kept, default: 31 days). Configure the name of the bucket that shall be used for storing the backups. Set the credentials for your backup S3 bucket here. |
| Get many workflows     | n8n API (n8n node)    | Retrieves all workflows from n8n instance        | Config                    | Store Workflow Backup        | Create an n8n API Key in the n8n settings and configure it in credentials of this node. Set the credentials for your backup S3 bucket here. |
| Store Workflow Backup  | S3                    | Uploads each workflow JSON to S3 bucket          | Get many workflows        | None                        | Set the credentials for your backup S3 bucket here.             |
| Get Existing Backups   | S3                    | Lists existing backup files in S3 bucket         | Config                    | Extract Date                | Set the credentials for your backup S3 bucket here.             |
| Extract Date           | Set                   | Extracts last modified date and key from backups | Get Existing Backups       | Keep Outdated Backups        |                                                                |
| Keep Outdated Backups  | Filter                | Filters backups older than retention period      | Extract Date              | Delete Outdated Backups      |                                                                |
| Delete Outdated Backups| S3                    | Deletes outdated backups from S3                  | Keep Outdated Backups     | None                        | Set the credentials for your backup S3 bucket here.             |
| Export Credentials     | Execute Command       | Exports all credentials to a temporary JSON file | Config                    | Load Credentials            | Set the credentials for your backup S3 bucket here.             |
| Load Credentials       | Read/Write File       | Reads exported credentials JSON file              | Export Credentials        | Store Credentials Backup     | Set the credentials for your backup S3 bucket here.             |
| Store Credentials Backup| S3                    | Uploads credentials JSON backup to S3             | Load Credentials          | Delete Temporary File        | Set the credentials for your backup S3 bucket here.             |
| Delete Temporary File  | Execute Command       | Deletes temporary credentials backup file         | Store Credentials Backup  | None                        | Set the credentials for your backup S3 bucket here.             |
| Sticky Note            | Sticky Note           | Reminder to set S3 credentials                     | None                      | None                        | Set the credentials for your backup S3 bucket here.             |
| Sticky Note1           | Sticky Note           | Reminder to set S3 credentials                     | None                      | None                        | Set the credentials for your backup S3 bucket here.             |
| Sticky Note2           | Sticky Note           | Reminder to set S3 credentials                     | None                      | None                        | Set the credentials for your backup S3 bucket here.             |
| Sticky Note3           | Sticky Note           | Reminder to set S3 credentials                     | None                      | None                        | Set the credentials for your backup S3 bucket here.             |
| Sticky Note4           | Sticky Note           | Reminder for retention and bucket configuration   | None                      | None                        | Adjust retention (how long backups are kept, default: 31 days). Configure the name of the bucket that shall be used for storing the backups. |
| Sticky Note5           | Sticky Note           | Reminder to adjust schedule and activate workflow | None                      | None                        | Adjust the trigger to suit your schedule (default: daily execution at 11pm). Remember to activate the workflow once all TODOs are resolved. Test the workflow by executing it. |
| Sticky Note6           | Sticky Note           | Reminder to create and configure n8n API Key      | None                      | None                        | Create an N8N API Key in the N8n settings. Configure it in the credentials of this node. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add **Schedule Trigger** node named `Daily Backup`.  
   - Set to trigger daily at 23:00 (hour 23).  

2. **Create Config Node:**  
   - Add **Set** node named `Config`.  
   - Connect output of `Daily Backup` to `Config`.  
   - Define variables:  
     - `bucketName` (string): Set to your actual S3 bucket name (replace `<YOUR BUCKET NAME HERE>`).  
     - `timstamp` (string): Expression `{{$now.format('yyyy-MM-dd')}}`.  
     - `retention` (number): Default `31`.  
     - `retentionUnit` (string): `"days"`.  
     - `tempCredentialBackupFile` (string): `"/tmp/CredentialBackup.json"`.

3. **Create Workflow Export Nodes:**  
   - Add **n8n node** (n8n API) named `Get many workflows`.  
   - Configure with no filters to get all workflows.  
   - Connect `Config` output to `Get many workflows` input.  
   - Add **S3** node named `Store Workflow Backup`.  
   - Configure with:  
     - Operation: Upload  
     - Bucket Name: Expression `={{ $('Config').first().json.bucketName }}`  
     - File Name: Expression `=workflows/{{$json.id}}/{{$('Config').first().json.timstamp}}.json`  
     - File Content: Expression `={{ JSON.stringify($json) }}`  
     - Tags: Add tag `name` with value `{{$json.name}}`  
   - Connect `Get many workflows` output to `Store Workflow Backup` input.

4. **Create Credential Export Nodes:**  
   - Add **Execute Command** node named `Export Credentials`.  
   - Command: Expression `=n8n export:credentials --all --output={{ $json.tempCredentialBackupFile }}`.  
   - Connect `Config` output to `Export Credentials`.  
   - Add **Read/Write File** node named `Load Credentials`.  
   - File Selector: Expression `={{ $('Config').first().json.tempCredentialBackupFile }}`.  
   - Connect `Export Credentials` output to `Load Credentials`.  
   - Add **S3** node named `Store Credentials Backup`.  
   - Configure with:  
     - Operation: Upload  
     - Bucket Name: Expression `={{ $('Config').first().json.bucketName }}`  
     - File Name: Expression `=credentials/{{$('Config').first().json.timstamp}}.json`  
     - File Content: Use data from `Load Credentials`  
   - Connect `Load Credentials` output to `Store Credentials Backup`.  
   - Add **Execute Command** node named `Delete Temporary File`.  
   - Command: Expression `=rm {{ $('Config').first().json.tempCredentialBackupFile }}`.  
   - Connect `Store Credentials Backup` output to `Delete Temporary File`.

5. **Create Backup Retention Nodes:**  
   - Add **S3** node named `Get Existing Backups`.  
   - Configure with:  
     - Operation: Search  
     - Bucket Name: Expression `={{ $json.bucketName }}` (passed from Config)  
     - Return All: `true`  
   - Connect `Config` output to `Get Existing Backups`.  
   - Add **Set** node named `Extract Date`.  
   - Add assignments:  
     - `date`: Expression `={{ $json.LastModified.toDateTime().format('yyyy-MM-dd') }}`  
     - `key`: Expression `={{ $json.Key }}`  
   - Connect `Get Existing Backups` output to `Extract Date`.  
   - Add **Filter** node named `Keep Outdated Backups`.  
   - Configure conditions:  
     - `date` is not empty  
     - `date` is before current date minus retention (expression: `{{$json.date.toDateTime()}}` < `{{$now.minus($('Config').first().json.retention, $('Config').first().json.retentionUnit)}}`)  
   - Connect `Extract Date` output to `Keep Outdated Backups`.  
   - Add **S3** node named `Delete Outdated Backups`.  
   - Configure with:  
     - Operation: Delete  
     - Bucket Name: Expression `={{ $('Config').first().json.bucketName }}`  
     - File Key: Expression `={{ $json.key }}`  
   - Connect `Keep Outdated Backups` output to `Delete Outdated Backups`.

6. **Set Credentials:**  
   - Configure AWS S3 credentials on all S3 nodes (`Store Workflow Backup`, `Store Credentials Backup`, `Get Existing Backups`, and `Delete Outdated Backups`).  
   - Configure n8n API credentials on `Get many workflows` node.  
   - Ensure n8n CLI environment is accessible for `Export Credentials` and `Delete Temporary File` nodes.

7. **Review and Activate:**  
   - Review and edit all sticky notes for reminders and TODOs.  
   - Activate the workflow.  
   - Perform test runs to validate backups are created and retention deletes old backups.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                  |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Remember to replace `<YOUR BUCKET NAME HERE>` with your actual S3 bucket name in `Config` node. | Critical for S3 upload and deletion operations.                                                |
| Create an n8n API Key in the n8n settings and configure it for the `Get many workflows` node.  | Required for API access to list workflows.                                                     |
| Set up AWS credentials with necessary permissions for all S3 nodes to upload, list, and delete. | Permissions needed: s3:PutObject, s3:ListBucket, s3:DeleteObject on the specified bucket.       |
| The retention period is configurable via the `retention` and `retentionUnit` variables.          | Default retention is 31 days but can be adjusted based on storage policy.                       |
| The workflow is triggered daily at 23:00 by default; adjust the `Daily Backup` node to change schedule. | Modify trigger node's schedule to fit operational needs.                                       |
| Temporary credential export file is stored in `/tmp/CredentialBackup.json` by default.            | Ensure the environment allows writing and deleting files at this path; adjust if needed.       |
| The workflow includes multiple sticky notes as reminders for setup steps.                         | Check all sticky notes before running for smooth operation.                                   |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.