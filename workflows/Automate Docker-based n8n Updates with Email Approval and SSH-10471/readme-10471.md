Automate Docker-based n8n Updates with Email Approval and SSH

https://n8nworkflows.xyz/workflows/automate-docker-based-n8n-updates-with-email-approval-and-ssh-10471


# Automate Docker-based n8n Updates with Email Approval and SSH

### 1. Workflow Overview

This workflow automates the process of updating an n8n instance deployed with Docker using a manual email approval step. It is targeted at administrators who want to keep their n8n instance up to date efficiently while retaining control over when updates happen. The workflow runs automatically every 3 days and can also be triggered manually for testing.

The workflow consists of the following logical blocks:  
- **1.1 Scheduled Trigger and Version Retrieval:** Automatically triggers every 3 days at 4 PM UTC to start the update check. Retrieves the current running n8n version and local Docker image digest.  
- **1.2 Remote Version Check and Comparison:** Queries Docker Hub for the latest n8n image digest and compares it with the local digest to detect updates.  
- **1.3 Approval Request via Email:** If an update is available, sends an email requesting approval with current and new version details and waits for user response.  
- **1.4 Update Script Management:** Checks for existence of an update script on the server, creates it if missing, ensuring idempotency and minimal file operations.  
- **1.5 Update Execution:** Upon approval, runs the update script in the background via SSH, which pulls the new image and restarts the Docker containers with a 30-second delay to allow workflow completion before restart.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger and Version Retrieval

**Overview:**  
This block triggers the workflow automatically every 3 days at 16:00 UTC and retrieves the current running version of n8n along with the local Docker image digest. This data is essential to determine whether an update is needed.

**Nodes Involved:**  
- Schedule Trigger  
- Get Current n8n Version (SSH)  
- Get Local Image Digest (SSH)  
- Sticky Notes for explanations  

**Node Details:**  

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Starts the workflow every 3 days at 4 PM UTC.  
  - Configuration: Interval of 3 days with trigger hour set to 16 (UTC).  
  - Input: None  
  - Output: Triggers "Get Current n8n Version" node.  
  - Failures: Misconfiguration of schedule or time zone mismatch may cause unexpected trigger time.  

- **Get Current n8n Version**  
  - Type: SSH  
  - Role: Executes `docker exec n8n-docker-caddy-n8n-1 n8n --version` remotely to get current n8n version.  
  - Configuration: Runs in `/root` directory via SSH using password authentication.  
  - Key command: `docker exec n8n-docker-caddy-n8n-1 n8n --version`  
  - Input: Trigger from Schedule Trigger  
  - Output: JSON with stdout containing version string  
  - Failures: SSH connection issues, container name mismatch, command failure if container down.  

- **Get Local Image Digest**  
  - Type: SSH  
  - Role: Retrieves the local Docker image digest for the n8n container image.  
  - Configuration: Command inspects the running container image and extracts RepoDigest.  
  - Key command: `docker inspect n8n-docker-caddy-n8n-1 --format='{{index .Image}}' | xargs docker inspect --format='{{index .RepoDigests 0}}'`  
  - Input: From "Get Current n8n Version" node  
  - Output: JSON with stdout containing image digest string  
  - Failures: SSH or Docker command errors, container not running, permissions issues.  

---

#### 1.2 Remote Version Check and Comparison

**Overview:**  
This block queries Docker Hub's registry API to fetch the remote digest of the latest n8n image and compares it against the local digest to determine if an update is available.

**Nodes Involved:**  
- Get Remote Image Digest (HTTP Request)  
- Prepare Update Data (Set)  
- If No Changes (If)  
- Sticky Notes explaining update check logic  

**Node Details:**  

- **Get Remote Image Digest**  
  - Type: HTTP Request  
  - Role: Fetches remote image digest metadata from Docker Hub API for the latest n8n tag.  
  - Configuration: GET request to `https://hub.docker.com/v2/repositories/n8nio/n8n/tags/latest`  
  - Input: From "Get Local Image Digest"  
  - Output: JSON including digest property extracted later  
  - Failures: Network issues, Docker Hub API changes, rate limiting.  

- **Prepare Update Data**  
  - Type: Set  
  - Role: Aggregates and prepares variables for the workflow: current version, local digest, remote digest, and boolean "update_available".  
  - Configuration: Uses expressions to extract fields from previous nodes and compares local and remote digests.  
  - Key expressions:  
    - `current_version` from previous SSH node output  
    - `local_digest` extracted from local digest string (splitting by '@')  
    - `remote_digest` from HTTP response's digest field  
    - `update_available` boolean comparing local and remote digests inequality  
  - Input: From "Get Remote Image Digest"  
  - Output: JSON with all prepared data for conditional checks  
  - Failures: Expression evaluation errors if prior node outputs are missing or malformed.  

- **If No Changes**  
  - Type: If  
  - Role: Conditional branching to check if update_available is false (no changes detected).  
  - Configuration: Checks if `update_available` is false exactly (boolean false).  
  - Input: From "Prepare Update Data"  
  - Output:  
    - True path: Execute "No Updates" node (workflow ends silently)  
    - False path: Proceeds to "Ask For Approval to Update" node  
  - Failures: Expression failures, logic errors.  

---

#### 1.3 Approval Request via Email

**Overview:**  
If an update is available, this block sends an email with update details and interactive approval buttons. It waits for a double confirmation approval before proceeding.

**Nodes Involved:**  
- Ask For Approval to Update (Email Send)  
- If Approved (If)  
- Do Nothing (NoOp)  
- Sticky Notes describing email content and approval logic  

**Node Details:**  

- **Ask For Approval to Update**  
  - Type: Email Send (Send and Wait)  
  - Role: Sends an HTML email with update information and waits for user approval via embedded buttons.  
  - Configuration:
    - Subject: "Approval Required for Updating n8n!"  
    - To: configured admin email (must be edited by user)  
    - From: configured email address (must be edited)  
    - Message: HTML formatted with current version, digests, explanation, manual update instructions, and approval prompt  
    - Approval Type: Double confirmation (two-step approval)  
    - Wait limit: 3 retries allowed before timeout  
  - Input: From false branch of "If No Changes"  
  - Output: JSON with approval status in `data.approved` boolean  
  - Failures: SMTP credential errors, email delivery issues, timeout if no user response.  

- **If Approved**  
  - Type: If  
  - Role: Checks if user approved the update (data.approved == true).  
  - Input: From "Ask For Approval to Update"  
  - Output:  
    - True path: Proceed to "Check Existence of Update Script"  
    - False path: "Do Nothing" (workflow ends without updating)  
  - Failures: Expression evaluation errors, missing approval data.  

- **Do Nothing**  
  - Type: No Operation (NoOp)  
  - Role: Ends the workflow silently if update declined.  
  - Input: From false path of "If Approved"  
  - Output: None  
  - Failures: None  

---

#### 1.4 Update Script Management

**Overview:**  
This block ensures the update script exists on the server. If missing, it creates the script with commands to update the Docker containers. The script execution is deferred 30 seconds to ensure workflow completion.

**Nodes Involved:**  
- Check Existence of Update Script (SSH)  
- If File Exists (If)  
- Create Update Script (SSH)  
- Sticky Notes describing script logic and update process  

**Node Details:**  

- **Check Existence of Update Script**  
  - Type: SSH  
  - Role: Checks if `update_docker.sh` file exists in `/root` directory on the remote server.  
  - Configuration: Runs shell command:  
    ```
    sh -c "if [ -f update_docker.sh ]; then echo true; else echo false; fi"
    ```  
  - Input: From true path of "If Approved"  
  - Output: JSON with `stdout` either "true" or "false" string  
  - Failures: SSH connection issues, file permission errors.  

- **If File Exists**  
  - Type: If  
  - Role: Branches based on existence of the update script (stdout == "true").  
  - Input: From "Check Existence of Update Script"  
  - Output:  
    - True path: Proceed to "Execute Update Script"  
    - False path: Proceed to "Create Update Script"  
  - Failures: Expression errors, string comparison issues.  

- **Create Update Script**  
  - Type: SSH  
  - Role: Creates `update_docker.sh` script with commands to update the n8n Docker containers.  
  - Configuration: The script commands include:  
    - `sleep 30s` delay  
    - `cd /opt/n8n-docker-caddy` change directory  
    - `docker compose pull` to pull latest image  
    - `docker compose down` to stop containers  
    - `docker compose up -d` to restart containers in detached mode  
    - Sets executable permission on the script  
  - Input: False path from "If File Exists"  
  - Output: After creation, triggers "Execute Update Script"  
  - Failures: SSH permissions, script write errors.  

---

#### 1.5 Update Execution

**Overview:**  
This block executes the update script in the background on the remote server using `nohup` to ensure the workflow finishes immediately and the update proceeds asynchronously after a delay.

**Nodes Involved:**  
- Execute Update Script (SSH)  
- Sticky Note explaining the background execution  

**Node Details:**  

- **Execute Update Script**  
  - Type: SSH  
  - Role: Runs `update_docker.sh` script in the background with output redirected to `/root/update.log`.  
  - Configuration: Command executed:  
    ```
    sh -c "exec >/root/update.log 2>&1; nohup /root/update_docker.sh &"
    ```  
  - Input: From true path of "If File Exists" or after script creation  
  - Output: Ends workflow immediately to allow container restart after 30 seconds  
  - Failures: SSH connection issues, permission errors, script execution errors.  

---

### 3. Summary Table

| Node Name                    | Node Type          | Functional Role                                   | Input Node(s)                      | Output Node(s)                       | Sticky Note                                                                                                      |
|------------------------------|--------------------|-------------------------------------------------|----------------------------------|------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Sticky Note 1                | Sticky Note        | Workflow start explanation and triggers overview| None                             | Schedule Trigger                   | 🚀 WORKFLOW START - Manual & scheduled triggers every 3 days at 4 PM UTC                                         |
| Schedule Trigger             | Schedule Trigger   | Starts workflow automatically every 3 days      | Sticky Note 1                   | Get Current n8n Version            |                                                                                                                 |
| Get Current n8n Version      | SSH                | Gets current n8n version from Docker container  | Schedule Trigger                | Get Local Image Digest             |                                                                                                                 |
| Get Local Image Digest       | SSH                | Gets current local Docker image digest           | Get Current n8n Version         | Get Remote Image Digest            |                                                                                                                 |
| Get Remote Image Digest      | HTTP Request       | Gets latest image digest from Docker Hub         | Get Local Image Digest          | Prepare Update Data                |                                                                                                                 |
| Prepare Update Data          | Set                | Prepares version and digest comparison variables | Get Remote Image Digest         | If No Changes                     |                                                                                                                 |
| If No Changes               | If                 | Checks if update is available (digest compare)   | Prepare Update Data             | No Updates / Ask For Approval to Update |                                                                                                                 |
| No Updates                  | NoOp               | Ends workflow silently if no update available    | If No Changes (true)            | None                             | ⛔ NO UPDATES FOUND - ends silently if up to date                                                                |
| Ask For Approval to Update  | Email Send (Send & Wait) | Sends update approval email and waits for response| If No Changes (false)          | If Approved                      | 📧 APPROVAL REQUEST - email with version info and approve/decline buttons                                       |
| If Approved                 | If                 | Checks if user approved the update                | Ask For Approval to Update      | Check Existence of Update Script / Do Nothing |                                                                                                                 |
| Do Nothing                  | NoOp               | Ends workflow if update declined                   | If Approved (false)             | None                             | 🛑 UPDATE DECLINED - ends if user declines update                                                               |
| Check Existence of Update Script | SSH           | Checks if update script exists on server          | If Approved (true)              | If File Exists                   | 🎯 SCRIPT LOGIC - checks for script existence to avoid redundant file creation                                  |
| If File Exists              | If                 | Branches based on script existence                 | Check Existence of Update Script| Execute Update Script / Create Update Script |                                                                                                                 |
| Create Update Script        | SSH                | Creates update script with Docker update commands | If File Exists (false)          | Execute Update Script             | 🔧 AUTOMATED UPDATE PROCESS - script creation with 30s delay and Docker commands                                |
| Execute Update Script       | SSH                | Runs update script asynchronously in background   | If File Exists (true), Create Update Script | None                      | 🚀 FINAL EXECUTION - runs update script with nohup and redirects output to log                                  |
| Sticky Note - Auto Update   | Sticky Note        | Explains automated update process steps            | None                          | None                             |                                                                                                                 |
| Sticky Note - Script Logic  | Sticky Note        | Explains script existence check logic              | None                          | None                             |                                                                                                                 |
| Sticky Note - Final Execution| Sticky Note       | Explains background script execution details       | None                          | None                             |                                                                                                                 |
| Sticky Note 9               | Sticky Note        | Explains update check logic comparing digests      | None                          | None                             | 🔀 UPDATE CHECK - Update detection logic                                                                        |
| Sticky Note 2               | Sticky Note        | Describes current version and local digest fetch   | None                          | None                             | 🔍 GET CURRENT INFO - retrieves current running info                                                             |
| Sticky Note 4               | Sticky Note        | Describes remote digest retrieval                    | None                          | None                             | 🔎 CHECK REMOTE DIGEST - uses Docker Registry HTTP API                                                            |
| Sticky Note 5               | Sticky Note        | Describes approval email content                      | None                          | None                             |                                                                                                                 |
| Sticky Note - Declined1     | Sticky Note        | Explains workflow termination on decline            | None                          | None                             |                                                                                                                 |
| Sticky Note 6               | Sticky Note        | Provides workflow high-level summary                  | None                          | None                             | 📊 WORKFLOW SUMMARY - detailed flow overview                                                                      |
| Sticky Note - Setup Requirements | Sticky Note   | Instructions for setting up credentials and server   | None                          | None                             | 🧩 SETUP REQUIREMENTS - SSH, SMTP creds, Docker setup, workflow import and testing instructions                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set interval: Every 3 days  
   - Trigger time: 16:00 UTC  

2. **Create SSH Node "Get Current n8n Version"**  
   - Command: `docker exec n8n-docker-caddy-n8n-1 n8n --version`  
   - Working Directory: `/root`  
   - Credentials: SSH Password (host, port 22, user root or ubuntu, password or key)  

3. **Create SSH Node "Get Local Image Digest"**  
   - Command: `docker inspect n8n-docker-caddy-n8n-1 --format='{{index .Image}}' | xargs docker inspect --format='{{index .RepoDigests 0}}'`  
   - Working Directory: `/root`  
   - Credentials: Same SSH credentials as above  

4. **Create HTTP Request Node "Get Remote Image Digest"**  
   - Method: GET  
   - URL: `https://hub.docker.com/v2/repositories/n8nio/n8n/tags/latest`  
   - No authentication  
   - Make sure to parse JSON response  

5. **Create Set Node "Prepare Update Data"**  
   - Assign variables:  
     - `current_version` from `Get Current n8n Version` stdout  
     - `local_digest` parsed from `Get Local Image Digest` stdout string after '@'  
     - `remote_digest` from `Get Remote Image Digest` JSON `digest` field  
     - `update_available` boolean comparing `local_digest` != `remote_digest`  

6. **Create If Node "If No Changes"**  
   - Condition: `update_available == false`  
   - True path: connect to NoOp node "No Updates"  
   - False path: connect to Email Send node "Ask For Approval to Update"  

7. **Create NoOp Node "No Updates"**  
   - Ends workflow if no update  

8. **Create Email Send Node "Ask For Approval to Update"**  
   - Mode: Send and Wait for Approval  
   - SMTP credentials configured properly  
   - From and To emails set accordingly  
   - Subject: "Approval Required for Updating n8n!"  
   - HTML message including current version, digests, update explanation, manual update commands, approval buttons with double confirmation  
   - Approval type: Double  
   - Limit retries to 3  

9. **Create If Node "If Approved"**  
   - Condition: `data.approved == true`  
   - True path: connect to SSH node "Check Existence of Update Script"  
   - False path: connect to NoOp node "Do Nothing"  

10. **Create NoOp Node "Do Nothing"**  
    - Ends workflow if declined  

11. **Create SSH Node "Check Existence of Update Script"**  
    - Command:  
      ```
      sh -c "if [ -f update_docker.sh ]; then echo true; else echo false; fi"
      ```  
    - Working directory: `/root`  
    - SSH credentials as above  

12. **Create If Node "If File Exists"**  
    - Condition: `stdout == "true"`  
    - True path: connect to SSH node "Execute Update Script"  
    - False path: connect to SSH node "Create Update Script"  

13. **Create SSH Node "Create Update Script"**  
    - Command:  
      ```
      sh -c "printf '%s\n' 'sleep 30s' 'cd /opt/n8n-docker-caddy' 'docker compose pull' 'docker compose down' 'docker compose up -d' > update_docker.sh; chmod +x update_docker.sh"
      ```  
    - Working directory: `/root`  
    - SSH credentials as above  
    - Connect output to "Execute Update Script"  

14. **Create SSH Node "Execute Update Script"**  
    - Command:  
      ```
      sh -c "exec >/root/update.log 2>&1; nohup /root/update_docker.sh &"
      ```  
    - Working directory: `/root`  
    - SSH credentials as above  

15. **Connect the Nodes as per the workflow connections described:**  
    - Schedule Trigger → Get Current n8n Version → Get Local Image Digest → Get Remote Image Digest → Prepare Update Data → If No Changes → (No Updates or Ask For Approval) → If Approved → Check Existence of Update Script → If File Exists → (Execute Update Script or Create Update Script → Execute Update Script)  

16. **Add Sticky Notes as documentation aids at relevant points for clarity (optional but recommended).**

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                      |
|----------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| Workflow uses SSH Password authentication for connecting to remote Docker host.                           | SSH Credentials setup instructions in Sticky Note. |
| SMTP credentials must be configured to send approval emails, supporting send-and-wait mode.               | SMTP Credentials setup instructions in Sticky Note.|
| Docker and docker-compose must be installed on the server running n8n containers.                         | Server setup instructions in Sticky Note.           |
| Scheduled trigger is optional; workflow can be run manually for testing or on-demand updates.             | Trigger details in Sticky Note 1.                    |
| To avoid unnecessary notifications, workflow compares local and remote Docker image digests before emailing. | Efficient update check logic documented in Sticky Notes. |
| The update script delays execution by 30 seconds to allow workflow to finish before Docker container restart. | Update script logic explained in Sticky Notes.      |
| Email approval uses double confirmation to reduce accidental updates.                                     | Approval email logic described in Sticky Notes.     |
| Manual update instructions are included in the approval email for fallback.                              | Email message template in Email Send node.           |

---

**Disclaimer:** The text provided is derived exclusively from an automated n8n workflow. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.