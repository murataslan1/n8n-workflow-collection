Automated AWS S3 to MinIO Object Backup with Scheduling

https://n8nworkflows.xyz/workflows/automated-aws-s3-to-minio-object-backup-with-scheduling-7284


# Automated AWS S3 to MinIO Object Backup with Scheduling

### 1. Workflow Overview

This workflow automates the backup process of objects stored in an AWS S3 bucket to a local MinIO object storage service. It is designed to run on a scheduled basis, retrieve all objects from a specified AWS S3 bucket (optionally filtered by a folder prefix), download each object, and then upload them into a designated bucket and folder on MinIO.

The workflow is logically divided into these blocks:

- **1.1 Schedule Trigger:** Initiates the workflow execution at a set time.
- **1.2 AWS S3 Objects Listing:** Retrieves a list of all objects in the specified AWS S3 bucket and folder.
- **1.3 Object Key Extraction:** Extracts individual object keys from the list to process them one by one.
- **1.4 Objects Download:** Downloads each object from AWS S3 based on its key.
- **1.5 Upload to MinIO:** Uploads each downloaded object to the configured MinIO bucket and folder.

The workflow includes important notes on credential setup and configuration parameters for both AWS S3 and MinIO integrations.

---

### 2. Block-by-Block Analysis

#### 2.1 Schedule Trigger

- **Overview:**  
  This block defines when the workflow runs automatically. It triggers the backup process daily at a specified time.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**

  - **Schedule Trigger**  
    - *Type & Role:* Schedule Trigger; initiates workflow based on time schedule.  
    - *Configuration:* Set to trigger daily at 02:15 AM.  
    - *Expressions/Variables:* None.  
    - *Inputs:* None (trigger node).  
    - *Outputs:* Connected to "Objects Listing" node.  
    - *Version Requirements:* n8n 0.121.0+ for scheduleTrigger 1.2.  
    - *Edge Cases:* Workflow will not run outside of schedule. Misconfiguration can cause no execution.  
    - *Sticky Note:* "Configure the Schedule Trigger to follow your needs."

#### 2.2 AWS S3 Objects Listing

- **Overview:**  
  This block fetches all objects within a specified folder of an AWS S3 bucket to list what needs to be backed up.

- **Nodes Involved:**  
  - Objects Listing

- **Node Details:**

  - **Objects Listing**  
    - *Type & Role:* AWS S3 node; performs "getAll" operation to list all objects.  
    - *Configuration:*  
      - Bucket: `yourBucket`  
      - Folder prefix: `folder/` (limits listing to this folder)  
      - Return all results: true  
      - Retry enabled with 5 seconds wait between retries.  
    - *Expressions/Variables:* None.  
    - *Inputs:* From Schedule Trigger.  
    - *Outputs:* To "Path Extraction" node.  
    - *Credentials:* AWS credentials configured with access and secret keys.  
    - *Edge Cases:*  
      - Authentication errors if AWS credentials are invalid.  
      - Network timeouts or throttling by AWS.  
      - Empty buckets or no matching keys result in no data passed forward.

#### 2.3 Object Key Extraction

- **Overview:**  
  Splits the array of objects into individual items so each object can be processed separately.

- **Nodes Involved:**  
  - Path Extraction

- **Node Details:**

  - **Path Extraction**  
    - *Type & Role:* SplitOut node; splits the list of objects into single items based on the `Key` field.  
    - *Configuration:* Field to split out: `Key`.  
    - *Expressions/Variables:* Uses `{{$json.Key}}` to extract object key.  
    - *Inputs:* From "Objects Listing".  
    - *Outputs:* To "Objects Download".  
    - *Edge Cases:* If the `Key` field is missing or empty, the split might fail or skip items.

#### 2.4 Objects Download

- **Overview:**  
  Downloads each object individually from AWS S3 using its key.

- **Nodes Involved:**  
  - Objects Download

- **Node Details:**

  - **Objects Download**  
    - *Type & Role:* AWS S3 node; downloads file specified by `fileKey`.  
    - *Configuration:*  
      - Bucket: `yourBucket`  
      - FileKey: dynamically set as `={{ $json.Key }}` from previous node.  
      - Retry enabled with 5 seconds wait.  
    - *Expressions/Variables:* FileKey uses dynamic expression referencing current object key.  
    - *Inputs:* From "Path Extraction".  
    - *Outputs:* To "Upload objects on local MinIO".  
    - *Credentials:* Same AWS credentials as the listing node.  
    - *Edge Cases:*  
      - Missing object or deleted key results in errors.  
      - Network errors and timeouts possible.  
      - Large files require sufficient memory and timeout settings.

#### 2.5 Upload to MinIO

- **Overview:**  
  Uploads each downloaded object to a specified bucket and folder on a MinIO server.

- **Nodes Involved:**  
  - Upload objects on local MinIO

- **Node Details:**

  - **Upload objects on local MinIO**  
    - *Type & Role:* S3 node (compatible with MinIO); uploads files.  
    - *Configuration:*  
      - Bucket: `yourBucket` (can be same or different from AWS)  
      - FileName: dynamically set as `={{ $json.Key }}` to preserve original file path/name.  
      - Parent Folder Key: `DestinationFolder` (destination folder inside bucket).  
      - Operation: upload.  
    - *Expressions/Variables:* Filename uses current object key.  
    - *Inputs:* From "Objects Download".  
    - *Outputs:* None (end of chain).  
    - *Credentials:* MinIO credentials including endpoint URL, access key, secret key, with options to force path style and ignore SSL issues if running locally.  
    - *Edge Cases:*  
      - Authentication or connection failure to MinIO.  
      - Permission errors on bucket.  
      - Conflicts if file with same key exists.  
    - *Sticky Note:* "Link your MinIO Bucket and don't forget to specify the folder you want your backup to be in!"

---

### 3. Summary Table

| Node Name                   | Node Type            | Functional Role                | Input Node(s)           | Output Node(s)                 | Sticky Note                                                                                                    |
|-----------------------------|----------------------|-------------------------------|------------------------|-------------------------------|---------------------------------------------------------------------------------------------------------------|
| Schedule Trigger            | Schedule Trigger     | Initiate workflow on schedule | None                   | Objects Listing               | Configure the Schedule Trigger to follow your needs                                                           |
| Objects Listing             | AWS S3               | List all objects in bucket    | Schedule Trigger       | Path Extraction              |                                                                                                               |
| Path Extraction             | SplitOut             | Extract individual object keys| Objects Listing        | Objects Download             |                                                                                                               |
| Objects Download            | AWS S3               | Download each object          | Path Extraction        | Upload objects on local MinIO |                                                                                                               |
| Upload objects on local MinIO| S3                   | Upload objects to MinIO       | Objects Download       | None                         | Link your MinIO Bucket and don't forget to specify the folder you want your backup to be in!                   |
| Sticky Note37              | Sticky Note          | Instruction note              | None                   | None                         | Configure the Schedule Trigger to follow your needs                                                           |
| Sticky Note2               | Sticky Note          | Instruction note              | None                   | None                         | Link your MinIO Bucket and don't forget to specify the folder you want your backup to be in!                   |
| Sticky Note3               | Sticky Note          | Instruction note              | None                   | None                         | You'll need to configure an access to the AWS S3 Bucket you need to backup (with endpoint url, access key and secret key) as well as a MinIO service running on your network (to configure locally with a S3 Node, use the url based on your service IP (http://XXX.XXX.XXX.XXX:9000) and both access and secret keys aswell). Also, in the credentials section of N8N, check 'Force Path Style' & 'Ignore SSL Issues (Insecure)' if MinIO is running on the local network. You're using Proxmox VE? Create a MinIO LXC Container: https://community-scripts.github.io/ProxmoxVE/scripts?id=minio, it's easier ! |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node:**
   - Type: Schedule Trigger  
   - Set interval to daily at 02:15 AM (triggerAtHour: 2, triggerAtMinute: 15).  
   - This node has no inputs and outputs to the "Objects Listing" node.

2. **Create an AWS S3 Node for Objects Listing:**
   - Type: AWS S3  
   - Operation: getAll  
   - Bucket Name: `yourBucket` (replace with your actual AWS bucket name)  
   - Folder Key: `folder/` (optional, adjust to your folder prefix)  
   - Return All: true  
   - Enable "Retry On Fail" with 5000 ms wait between retries.  
   - Attach AWS credentials configured with your AWS access key, secret key, and region.  
   - Connect Schedule Trigger output to this node’s input.

3. **Create a SplitOut Node (Path Extraction):**
   - Type: SplitOut  
   - Field to Split Out: `Key`  
   - Input: Connect from "Objects Listing" node output.  
   - Output: Connect to "Objects Download" node.

4. **Create an AWS S3 Node for Objects Download:**
   - Type: AWS S3  
   - Operation: Download (default)  
   - Bucket Name: `yourBucket` (same as listing)  
   - File Key: Use expression `={{ $json.Key }}` to dynamically get the current object key.  
   - Enable "Retry On Fail" with 5000 ms wait.  
   - Use same AWS credentials as for listing.  
   - Connect input from "Path Extraction" output.

5. **Create an S3 Node for Uploading to MinIO:**
   - Type: S3 (compatible with MinIO)  
   - Operation: Upload  
   - Bucket Name: `yourBucket` (your MinIO bucket)  
   - File Name: Use expression `={{ $json.Key }}` to keep original file name/key.  
   - Parent Folder Key: `DestinationFolder` (set the destination folder in MinIO)  
   - Configure MinIO credentials:  
     - Endpoint URL: e.g., `http://XXX.XXX.XXX.XXX:9000` (your MinIO server IP and port)  
     - Access Key and Secret Key for MinIO  
     - Enable "Force Path Style" and "Ignore SSL Issues (Insecure)" if MinIO runs locally or with self-signed certs.  
   - Connect input from "Objects Download" output.

6. **Add Sticky Notes for Instructions:**
   - Near Schedule Trigger: "Configure the Schedule Trigger to follow your needs."  
   - Near Upload Node: "Link your MinIO Bucket and don't forget to specify the folder you want your backup to be in!"  
   - Add a note explaining AWS and MinIO credential setup and tips about Proxmox VE MinIO LXC container:  
     "You'll need to configure an access to the AWS S3 Bucket you need to backup (with endpoint URL, access key and secret key) as well as a MinIO service running on your network (to configure locally with a S3 Node, use the URL based on your service IP (http://XXX.XXX.XXX.XXX:9000) and both access and secret keys as well). Also, in the credentials section of N8N, check 'Force Path Style' & 'Ignore SSL Issues (Insecure)' if MinIO is running on the local network. You're using Proxmox VE? Create a MinIO LXC Container: https://community-scripts.github.io/ProxmoxVE/scripts?id=minio, it's easier!"

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                      | Context or Link                                                                                       |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| To run MinIO locally and integrate with n8n, ensure you set "Force Path Style" and "Ignore SSL Issues (Insecure)" in MinIO credentials if using self-signed certificates or local IP addresses.                                                                       | MinIO integration best practices.                                                                    |
| If using Proxmox VE virtualization, deploying MinIO as an LXC container simplifies local object storage setup.                                                                                                                                                   | https://community-scripts.github.io/ProxmoxVE/scripts?id=minio                                      |
| Schedule Trigger can be customized to match your backup window; adjust time and frequency according to your operational needs.                                                                                                                                   | n8n Schedule Trigger documentation.                                                                  |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.