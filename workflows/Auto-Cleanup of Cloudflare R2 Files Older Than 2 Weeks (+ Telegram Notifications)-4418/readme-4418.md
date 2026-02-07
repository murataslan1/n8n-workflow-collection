Auto-Cleanup of Cloudflare R2 Files Older Than 2 Weeks (+ Telegram Notifications)

https://n8nworkflows.xyz/workflows/auto-cleanup-of-cloudflare-r2-files-older-than-2-weeks----telegram-notifications--4418


# Auto-Cleanup of Cloudflare R2 Files Older Than 2 Weeks (+ Telegram Notifications)

### 1. Workflow Overview

This workflow automates the cleanup of files stored in a Cloudflare R2 bucket (S3-compatible storage) that are older than two weeks. It is designed to run on a scheduled basis and delete outdated files automatically, followed by sending Telegram notifications for each deleted file. The main use case is to maintain storage hygiene and manage costs by removing stale backups or data files from Cloudflare R2, while keeping the user informed via Telegram messages.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow daily at a specific hour.
- **1.2 Fetch Cloudflare R2 Files:** Retrieves all files from the specified R2 bucket and folder.
- **1.3 Filter Old Files:** Filters out files older than two weeks to identify which files should be deleted.
- **1.4 Delete Files:** Deletes each identified old file from the Cloudflare R2 bucket.
- **1.5 Send Telegram Notifications:** Sends a Telegram message confirming the successful removal of each file.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:**  
  This block triggers the workflow to run automatically every day at 9 AM.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**

  - **Schedule Trigger**  
    - **Type:** Schedule Trigger  
    - **Technical Role:** Initiates workflow execution based on a fixed schedule  
    - **Configuration:** Set to trigger every day at 09:00 (hour 9)  
    - **Input connections:** None (entry point)  
    - **Output connections:** Connected to the "S3" node to start file retrieval  
    - **Version Specifics:** Uses typeVersion 1.2 (supports modern scheduling options)  
    - **Edge Cases / Failure Types:**  
      - Workflow will simply not run if the n8n instance is down at trigger time  
      - No authentication issues expected  
    - **Notes:**  
      - Sticky Note: "Schedul\nRun from setup schedule time"

---

#### 1.2 Fetch Cloudflare R2 Files

- **Overview:**  
  Retrieves all files from a specified folder in the Cloudflare R2 bucket using the S3-compatible API.

- **Nodes Involved:**  
  - S3

- **Node Details:**

  - **S3**  
    - **Type:** S3 (n8n-nodes-base.s3)  
    - **Technical Role:** Lists all objects/files in the given bucket and folder  
    - **Configuration:**  
      - Operation: getAll (retrieve all files)  
      - Bucket: "bucketName" (placeholder requiring configuration)  
      - Folder Key: "Folder/" (prefix path to limit retrieval)  
      - Return all results: true  
      - Fetch owner metadata: false (not required)  
    - **Input connections:** Connected from "Schedule Trigger"  
    - **Output connections:** Connected to "Code" node for filtering  
    - **Credentials:** Uses Cloudflare S3 account credentials configured externally (named "Cloudflare S3 account")  
    - **Version Specifics:** TypeVersion 1  
    - **Edge Cases / Failure Types:**  
      - Authentication failure if credentials are invalid or expired  
      - Network timeouts or API rate limiting from Cloudflare  
      - Empty bucket or folder will produce empty output, handled downstream  
    - **Notes:**  
      - Sticky Note: "R2 Object (S3)\nGet file from Cloudflare R2 Object (S3)"

---

#### 1.3 Filter Old Files

- **Overview:**  
  Processes the list of files from the S3 node, filtering out only those files whose last modification date is older than two weeks.

- **Nodes Involved:**  
  - Code

- **Node Details:**

  - **Code**  
    - **Type:** Code (JavaScript)  
    - **Technical Role:** Custom filtering logic to select files older than two weeks  
    - **Configuration:**  
      - JavaScript code defines TWO_WEEKS in milliseconds  
      - Gets current timestamp and compares each file's LastModified date  
      - Returns only files where age > two weeks  
    - **Key expressions/variables:**  
      - `$items("S3", 0)` - accesses items output from the S3 node  
      - `item.json.LastModified` - field containing last modification timestamp of file  
    - **Input connections:** From "S3" node  
    - **Output connections:** To "S31" node for deletion  
    - **Version Specifics:** Uses typeVersion 2 (supports modern code node features)  
    - **Edge Cases / Failure Types:**  
      - Potential error if LastModified is missing or malformed in any file  
      - Empty input array will result in empty output, causing downstream nodes to skip execution  
    - **Notes:**  
      - Sticky Note: "Filter File\nFilter file for remove"

---

#### 1.4 Delete Files

- **Overview:**  
  Deletes each file identified as older than two weeks from the Cloudflare R2 bucket.

- **Nodes Involved:**  
  - S31

- **Node Details:**

  - **S31**  
    - **Type:** S3  
    - **Technical Role:** Deletes a single file from the bucket using the file key  
    - **Configuration:**  
      - Operation: delete  
      - Bucket: "bucketName" (same as fetch)  
      - File Key: Expression `={{ $json.Key }}` - uses the Key from the filtered file item  
      - Options: none specified  
    - **Input connections:** From "Code" node (filtered files)  
    - **Output connections:** To "Telegram" node for notification  
    - **Credentials:** Same Cloudflare S3 account as "S3" node  
    - **Version Specifics:** TypeVersion 1  
    - **Edge Cases / Failure Types:**  
      - Deletion failure if file does not exist or insufficient permissions  
      - Network or API errors can cause retries or failures  
      - If no files are filtered, this node does not execute  
    - **Notes:**  
      - Sticky Note: "Delete File\nRemove file from cloud"

---

#### 1.5 Send Telegram Notifications

- **Overview:**  
  Sends a Telegram message notifying about each successfully deleted file.

- **Nodes Involved:**  
  - Telegram

- **Node Details:**

  - **Telegram**  
    - **Type:** Telegram  
    - **Technical Role:** Sends message to a Telegram chat  
    - **Configuration:**  
      - Text: Emoji and message confirming file removal, includes file key dynamically:  
        ```
        ✅ Remove R2 backup complete  
        👌*{{ $('Code').item.json.Key }}*
        ```  
      - Chat ID: Placeholder "TELEGRAM_CHAT_ID" to be replaced with actual chat ID  
    - **Input connections:** From "S31" node (deleted file)  
    - **Output connections:** None (end of workflow)  
    - **Credentials:** Telegram API credentials configured externally ("Telegram account name")  
    - **Version Specifics:** TypeVersion 1.2  
    - **Edge Cases / Failure Types:**  
      - Failure if Telegram API credentials invalid or revoked  
      - Chat ID invalid or bot not authorized to send messages to chat  
      - Rate limiting by Telegram if many messages sent rapidly  
    - **Notes:**  
      - Sticky Note: "Telegram Notify\nNotify remove file success"

---

### 3. Summary Table

| Node Name       | Node Type         | Functional Role                  | Input Node(s)     | Output Node(s)   | Sticky Note                                      |
|-----------------|-------------------|--------------------------------|-------------------|------------------|-------------------------------------------------|
| Schedule Trigger| Schedule Trigger  | Initiates workflow daily at 9 AM| None              | S3               | Schedul<br>Run from setup schedule time         |
| S3              | S3                | Fetches all files from R2 bucket| Schedule Trigger  | Code             | R2 Object (S3)<br>Get file from Cloudflare R2 Object (S3) |
| Code            | Code              | Filters files older than 2 weeks| S3                | S31              | Filter File<br>Filter file for remove            |
| S31             | S3                | Deletes each filtered file       | Code              | Telegram         | Delete File<br>Remove file from cloud            |
| Telegram        | Telegram          | Sends notification for deletions| S31               | None             | Telegram Notify<br>Notify remove file success    |
| Sticky Note     | Sticky Note       | Annotation                      | None              | None             | Schedul<br>Run from setup schedule time         |
| Sticky Note1    | Sticky Note       | Annotation                      | None              | None             | R2 Object (S3)<br>Get file from Cloudflare R2 Object (S3) |
| Sticky Note2    | Sticky Note       | Annotation                      | None              | None             | Filter File<br>Filter file for remove            |
| Sticky Note3    | Sticky Note       | Annotation                      | None              | None             | Delete File<br>Remove file from cloud            |
| Sticky Note4    | Sticky Note       | Annotation                      | None              | None             | Telegram Notify<br>Notify remove file success    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add "Schedule Trigger" node:**  
   - Type: Schedule Trigger  
   - Set to run daily at 09:00 (hour 9)  
   - No credentials needed

3. **Add "S3" node (to fetch files):**  
   - Type: S3  
   - Operation: getAll  
   - Bucket Name: set your Cloudflare R2 bucket name (e.g., "bucketName")  
   - Folder Key: "Folder/" (adjust as needed)  
   - Return All: true  
   - Fetch Owner: false  
   - Credentials: Create or select Cloudflare S3 credentials with access key and secret configured for your R2 account  
   - Connect input from Schedule Trigger

4. **Add "Code" node (to filter old files):**  
   - Type: Code  
   - Language: JavaScript  
   - Code snippet:  
     ```js
     const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
     const now = Date.now();

     const items = $items("S3", 0);

     return items.filter(item => {
       const lastModified = new Date(item.json.LastModified).getTime();
       const age = now - lastModified;
       return age > TWO_WEEKS;
     });
     ```  
   - Connect input from S3 node

5. **Add "S3" node (to delete files):**  
   - Type: S3  
   - Operation: delete  
   - Bucket Name: same as fetch node  
   - File Key: Expression: `={{ $json.Key }}` (uses file key from filtered items)  
   - Credentials: same Cloudflare S3 account  
   - Connect input from Code node

6. **Add "Telegram" node (to send notification):**  
   - Type: Telegram  
   - Chat ID: set your Telegram chat ID where notifications will be sent  
   - Text (use Expression mode):  
     ```
     ✅ Remove R2 backup complete  
     👌*{{ $('Code').item.json.Key }}*
     ```  
   - Credentials: Configure Telegram API credentials (Bot token)  
   - Connect input from delete S3 node

7. **Connect all nodes sequentially:**  
   Schedule Trigger → S3 (fetch) → Code (filter) → S3 (delete) → Telegram (notify)

8. **Test workflow:**  
   - Ensure Cloudflare credentials have correct permissions  
   - Ensure Telegram bot is authorized for your chat  
   - Run manually or wait for scheduled trigger

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                  |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------|
| Workflow requires Cloudflare R2 bucket with S3-compatible API enabled and access credentials     | Cloudflare R2 documentation                      |
| Telegram notifications require a Telegram bot token and chat ID                                 | https://core.telegram.org/bots/api               |
| The workflow can be scheduled at any hour by modifying the Schedule Trigger node                 | n8n Schedule Trigger documentation                |
| Review Cloudflare R2 API rate limits and error handling for production readiness                 | https://developers.cloudflare.com/r2/api/overview|
| Make sure to replace placeholder bucket name and Telegram chat ID with actual values             | Workflow configuration step                       |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created using n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.