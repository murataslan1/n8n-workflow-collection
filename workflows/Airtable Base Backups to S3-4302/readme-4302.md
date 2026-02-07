Airtable Base Backups to S3

https://n8nworkflows.xyz/workflows/airtable-base-backups-to-s3-4302


# Airtable Base Backups to S3

### 1. Workflow Overview

This workflow automates **weekly full backups of an Airtable base** by exporting all tables as CSV files and uploading them to an AWS S3 bucket. Additionally, it includes a **monthly pruning process** that deletes backup folders older than one month from the S3 bucket. Notifications on backup completion are sent via Slack.

The workflow can be logically divided into two main parts:

- **1.1 Weekly Backup Process:**  
  Triggered weekly, this block creates a new week folder in S3, retrieves Airtable base schema, exports each table’s records as CSV files, uploads them to the week folder, and sends a Slack notification when complete.

- **1.2 Monthly Prune Process:**  
  Triggered monthly, this block lists all backup folders in the S3 bucket, compares their timestamps against a cutoff date one month prior, and deletes folders older than that cutoff.

Supporting nodes handle data formatting, batching, and control flow.

---

### 2. Block-by-Block Analysis

#### 1.1 Weekly Backup Process

- **Overview:**  
  This block orchestrates the creation of a new weekly backup folder in S3, iterates over all tables in the Airtable base, exports their records to CSV files named after sanitized table names, uploads these files to the weekly folder, and concludes with a Slack notification.

- **Nodes Involved:**  
  - `Weekly Backup` (Schedule Trigger)  
  - `Set Week` (Set)  
  - `Create Folder` (AWS S3)  
  - `Airtable` (Airtable node to fetch base schema)  
  - `Loop Over Items` (SplitInBatches)  
  - `Create Table Metadata` (Set)  
  - `Pull Records` (Airtable node to get table records)  
  - `Convert to File` (ConvertToFile)  
  - `AWS S3` (AWS S3 upload)  
  - `Aggregate` (Aggregate)  
  - `Slack` (Slack notification)

- **Node Details:**

  1. **Weekly Backup**  
     - Type: Schedule Trigger  
     - Role: Triggers workflow weekly at 12:00  
     - Config: Interval set to every week, trigger at hour 12 (no timezone specified)  
     - Input: None  
     - Output: Starts the workflow  

  2. **Set Week**  
     - Type: Set  
     - Role: Defines the current week string (e.g., "2024-W23") to use as folder name  
     - Expression: `$now.toFormat("kkkk-'W'WW")` (ISO week-year format)  
     - Input: Trigger from `Weekly Backup`  
     - Output: Adds `currentWeek` field  

  3. **Create Folder**  
     - Type: AWS S3  
     - Role: Creates a new folder in the S3 bucket named after the current week  
     - Params: Bucket = "aired-out", folderName = `={{ $json.currentWeek }}`  
     - Credentials: AWS S3 Access with necessary permissions  
     - Input: From `Set Week`  
     - Output: Folder creation confirmation  

  4. **Airtable**  
     - Type: Airtable  
     - Role: Retrieves the schema of the Airtable base (list of tables)  
     - Params: Operation = getSchema, Base = "yourbase" (placeholder)  
     - Credentials: Airtable API Token  
     - Input: From `Create Folder`  
     - Output: List of tables metadata  

  5. **Loop Over Items**  
     - Type: SplitInBatches  
     - Role: Processes tables one by one to avoid overload  
     - Input: From `Airtable` (tables list)  
     - Output: Sends each table's metadata downstream  

  6. **Create Table Metadata**  
     - Type: Set  
     - Role: Sanitizes table name to create a safe filename and extracts table ID and name  
     - Expressions:  
       - `fileName` = sanitized table name (removes illegal filename chars, replaces spaces with underscores)  
       - `tableName` = original table name  
       - `tableID` = table ID for querying records  
     - Input: From `Loop Over Items`  
     - Output: Adds metadata for file naming and record pulling  

  7. **Pull Records**  
     - Type: Airtable  
     - Role: Retrieves all records from the current table using `search` operation  
     - Params: Base = "yourbase", Table = `={{ $json.tableID }}`  
     - Credentials: Airtable API Token  
     - Input: From `Create Table Metadata`  
     - Output: All records of the table  

  8. **Convert to File**  
     - Type: ConvertToFile  
     - Role: Converts the table records JSON into a CSV file  
     - Params: Filename = `={{ $('Create Table Metadata').item.json.fileName }}.csv`  
     - Input: From `Pull Records`  
     - Output: CSV file binary data  

  9. **AWS S3**  
     - Type: AWS S3  
     - Role: Uploads the CSV file to the S3 bucket inside the folder for the current week  
     - Params:  
       - operation = upload  
       - bucketName = "aired-out"  
       - fileName = same as CSV file name  
       - parentFolderKey = current week folder from `Set Week` node  
     - Credentials: AWS S3 Access  
     - Input: From `Convert to File`  
     - Output: Upload confirmation  

  10. **Aggregate**  
      - Type: Aggregate  
      - Role: Aggregates all batch outputs into one final output array  
      - Input: From `Loop Over Items` (main output)  
      - Output: Combined result for final notification  

  11. **Slack**  
      - Type: Slack  
      - Role: Sends a notification message to a Slack channel on backup completion  
      - Params:  
        - Text: ":floppy_disk: *Airtable Backup Complete*"  
        - Channel: "general" (channel ID `C08GPG2HTA4`)  
      - Credentials: Slack API Bot  
      - Input: From `Aggregate`  
      - Output: Slack message posted confirmation  

- **Edge Cases & Failure Modes:**  
  - Airtable API limits or auth failure can cause record retrieval failure.  
  - AWS S3 upload failures due to permission or network issues.  
  - Filename sanitization might fail if table names contain unusual Unicode chars (regex handles Unicode letters/numbers).  
  - Slack webhook or channel permission issues may block notification.  
  - Network timeouts or API throttling should be handled by workflow retries (not shown).  

---

#### 1.2 Monthly Prune Process

- **Overview:**  
  This block runs monthly to delete backup folders older than one month from the S3 bucket, keeping storage usage manageable.

- **Nodes Involved:**  
  - `Monthly Prune` (Schedule Trigger)  
  - `Set Timestamps` (Set)  
  - `List Folders` (AWS S3)  
  - `If` (If node)  
  - `Delete File` (AWS S3)  
  - `No Operation, do nothing` (NoOp)

- **Node Details:**

  1. **Monthly Prune**  
     - Type: Schedule Trigger  
     - Role: Trigger workflow once a month  
     - Params: Interval set to every month (no specific day/time mentioned)  
     - Input: None  
     - Output: Starts pruning process  

  2. **Set Timestamps**  
     - Type: Set  
     - Role: Calculates the cutoff date string representing one month ago in ISO week format  
     - Expression: `$now.minus({ weeks: 4 }).toFormat("kkkk-'W'WW")`  
     - Sets field `cutoffDate` for comparison  

  3. **List Folders**  
     - Type: AWS S3  
     - Role: Retrieves all folders (backup weeks) inside the "aired-out" bucket  
     - Params: Resource = folder, operation = getAll, bucketName = "aired-out"  
     - Credentials: AWS S3 Access  
     - Input: From `Set Timestamps`  
     - Output: List of folder objects with `Key` fields  

  4. **If**  
     - Type: If  
     - Role: Compares each folder’s key (name) after trimming trailing slash to cutoffDate  
     - Condition: Folder key (string) is before cutoffDate (string) using dateTime comparison  
     - Input: From `List Folders` (iterates over each folder)  
     - Output:  
       - True: Folder is older than cutoffDate → proceed to delete  
       - False: Folder is recent → no action  

  5. **Delete File**  
     - Type: AWS S3  
     - Role: Deletes the folder in the S3 bucket  
     - Params:  
       - resource = folder  
       - operation = delete  
       - bucketName = "aired-out"  
       - folderKey = current folder’s key from `List Folders`  
     - Credentials: AWS S3 Access  
     - Input: From `If` (true branch)  
     - Output: Deletion confirmation  

  6. **No Operation, do nothing**  
     - Type: NoOp  
     - Role: Placeholder for false branch of `If` node (folders not deleted)  
     - Input: From `If` (false branch)  
     - Output: Ends branch cleanly  

- **Edge Cases & Failure Modes:**  
  - Date parsing errors if folder keys are not in expected week format (e.g., manual folders or corrupted keys).  
  - AWS permission errors on delete operation.  
  - Timezone differences may affect cutoff date logic if server time differs.  
  - Empty folder list results in no deletion, no errors.  

---

### 3. Summary Table

| Node Name               | Node Type          | Functional Role                              | Input Node(s)              | Output Node(s)             | Sticky Note                                           |
|-------------------------|--------------------|----------------------------------------------|----------------------------|----------------------------|-------------------------------------------------------|
| Weekly Backup           | Schedule Trigger   | Triggers weekly backup workflow               | —                          | Set Week                   | ## Airtable Weekly Backups<br>Every week backup all tables in an Airtable base into a dedicated week sub-folder in S3. Notify when complete. |
| Set Week                | Set                | Defines current week folder name              | Weekly Backup              | Create Folder              |                                                       |
| Create Folder           | AWS S3             | Creates S3 folder for current week            | Set Week                   | Airtable                   |                                                       |
| Airtable                | Airtable           | Gets base schema (tables list)                | Create Folder              | Loop Over Items            |                                                       |
| Loop Over Items         | SplitInBatches     | Processes each table individually              | Airtable                   | Aggregate, Create Table Metadata |                                                       |
| Create Table Metadata   | Set                | Sanitizes table name and extracts metadata    | Loop Over Items            | Pull Records               |                                                       |
| Pull Records            | Airtable           | Fetches records of current table               | Create Table Metadata      | Convert to File            |                                                       |
| Convert to File         | ConvertToFile      | Converts records JSON to CSV file              | Pull Records               | AWS S3                     |                                                       |
| AWS S3                  | AWS S3             | Uploads CSV files to S3 bucket                 | Convert to File            | Loop Over Items            |                                                       |
| Aggregate               | Aggregate          | Aggregates batch outputs for notification     | Loop Over Items            | Slack                     |                                                       |
| Slack                   | Slack              | Sends completion notification to Slack        | Aggregate                  | —                          |                                                       |
| Monthly Prune           | Schedule Trigger   | Triggers monthly pruning workflow              | —                          | Set Timestamps             | ## Airtable Monthly Prune<br>Delete backups > 1 month old |
| Set Timestamps          | Set                | Calculates cutoff date for pruning             | Monthly Prune              | List Folders               |                                                       |
| List Folders            | AWS S3             | Lists all backup folders in S3 bucket          | Set Timestamps             | If                        |                                                       |
| If                      | If                 | Checks if folder is older than cutoff date     | List Folders               | Delete File, No Operation  |                                                       |
| Delete File             | AWS S3             | Deletes old backup folders                       | If (true branch)           | —                          |                                                       |
| No Operation, do nothing| NoOp               | Placeholder for folders not deleted             | If (false branch)          | —                          |                                                       |
| Sticky Note1            | Sticky Note        | Describes weekly backup purpose                 | —                          | —                          | ## Airtable Weekly Backups<br>Every week backup all tables in an Airtable base into a dedicated week sub-folder in S3. Notify when complete. |
| Sticky Note             | Sticky Note        | Describes monthly pruning purpose               | —                          | —                          | ## Airtable Monthly Prune<br>Delete backups > 1 month old |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow named "Airtable Full Backup".**

2. **Add a Schedule Trigger node named "Weekly Backup".**  
   - Set interval to **weeks**, triggering at hour **12 (noon)**.

3. **Add a Set node named "Set Week".**  
   - Connect `Weekly Backup` → `Set Week`.  
   - Add a string field `currentWeek` with expression:  
     ```javascript
     {{$now.toFormat("kkkk-'W'WW")}}
     ```

4. **Add an AWS S3 node named "Create Folder".**  
   - Connect `Set Week` → `Create Folder`.  
   - Set resource to **folder**.  
   - Set bucket name to your S3 bucket (e.g., `"aired-out"`).  
   - Set folder name to expression:  
     ```javascript
     {{$json.currentWeek}}
     ```  
   - Use AWS S3 credentials with bucket write permissions.

5. **Add an Airtable node named "Airtable".**  
   - Connect `Create Folder` → `Airtable`.  
   - Set operation to **getSchema** on your Airtable base.  
   - Supply Airtable API credentials.

6. **Add a SplitInBatches node named "Loop Over Items".**  
   - Connect `Airtable` → `Loop Over Items`.  
   - Leave batch size default or set as needed.

7. **Add a Set node named "Create Table Metadata".**  
   - Connect `Loop Over Items` → `Create Table Metadata`.  
   - Configure fields:  
     - `fileName` (string): sanitize table name using expression:  
       ```javascript
       {{$json.name.replace(/[^\p{L}\p{N}\s_-]+/gu, '').trim().replace(/\s+/g, '_')}}
       ```  
     - `tableName` (string): `{{$json.name}}`  
     - `tableID` (string): `{{$json.id}}`

8. **Add an Airtable node named "Pull Records".**  
   - Connect `Create Table Metadata` → `Pull Records`.  
   - Operation: **search** (retrieve all records)  
   - Base: same Airtable base  
   - Table: expression `{{$json.tableID}}`  
   - Airtable credentials as before.

9. **Add a ConvertToFile node named "Convert to File".**  
   - Connect `Pull Records` → `Convert to File`.  
   - Set file name (string) to expression:  
     ```javascript
     {{$('Create Table Metadata').item.json.fileName}}.csv
     ```  
   - Output format: CSV.

10. **Add an AWS S3 node named "AWS S3".**  
    - Connect `Convert to File` → `AWS S3`.  
    - Operation: **upload**  
    - Bucket name: `"aired-out"` (same as before)  
    - File name: same as CSV file name  
    - Additional field `parentFolderKey` set to:  
      ```javascript
      {{$('Set Week').item.json.currentWeek}}
      ```  
    - Use AWS S3 credentials.

11. **Connect `AWS S3` node back to `Loop Over Items` to process next table.**

12. **Add an Aggregate node named "Aggregate".**  
    - Connect `Loop Over Items` (main output for all batches) → `Aggregate`.  
    - Aggregate method: **aggregateAllItemData**.

13. **Add a Slack node named "Slack".**  
    - Connect `Aggregate` → `Slack`.  
    - Configure Slack webhook or API credentials.  
    - Message text: `":floppy_disk: *Airtable Backup Complete*"`  
    - Channel: select your target channel (e.g., general).

---

14. **Add a Schedule Trigger node named "Monthly Prune".**  
    - Set interval to **months** (default time).

15. **Add a Set node named "Set Timestamps".**  
    - Connect `Monthly Prune` → `Set Timestamps`.  
    - Add string field `cutoffDate` with expression:  
      ```javascript
      {{$now.minus({ weeks: 4 }).toFormat("kkkk-'W'WW")}}
      ```

16. **Add an AWS S3 node named "List Folders".**  
    - Connect `Set Timestamps` → `List Folders`.  
    - Resource: folder  
    - Operation: getAll  
    - Bucket: `"aired-out"`  
    - AWS credentials.

17. **Add an If node named "If".**  
    - Connect `List Folders` → `If`.  
    - Condition: Check if folder key (trim trailing slash) is before cutoffDate using dateTime comparison.  
    - Left value expression:  
      ```javascript
      {{$json.Key.replace(/\/$/, '')}}
      ```  
    - Right value: `{{$('Set Timestamps').item.json.cutoffDate}}`  
    - Operator: before (dateTime)

18. **Add an AWS S3 node named "Delete File".**  
    - Connect `If` (true output) → `Delete File`.  
    - Resource: folder  
    - Operation: delete  
    - Bucket: `"aired-out"`  
    - Folder key: expression `{{$json.Key}}`  
    - AWS credentials.

19. **Add a No Operation node named "No Operation, do nothing".**  
    - Connect `If` (false output) → `No Operation, do nothing`.

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                  |
|---------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| The workflow uses ISO week date format strings (e.g., "2024-W23") for folder naming and pruning logic. | Important for folder naming and cutoff comparison. |
| Slack notification uses a bot token and webhook ID; ensure proper channel permissions are granted.      | Slack API integration requires setup.           |
| AWS S3 Access credentials must have permissions for folder creation, file upload, listing, and deletion. | Essential for smooth S3 operations.              |
| The filename sanitization regex supports Unicode letters and numbers to avoid invalid S3 filenames.    | Prevents upload errors due to illegal characters. |

---

**Disclaimer:** The provided text is extracted exclusively from an n8n automated workflow. It complies fully with content policies and contains no illegal or protected data. All manipulated data is legal and public.