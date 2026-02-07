Automate Docker Container Updates with Telegram Approval System

https://n8nworkflows.xyz/workflows/automate-docker-container-updates-with-telegram-approval-system-3386


# Automate Docker Container Updates with Telegram Approval System

### 1. Workflow Overview

This workflow automates the update process of an n8n Docker container by integrating version checks, user approval via Telegram, and Docker commands executed over SSH. It targets DevOps engineers and system administrators who want to maintain their n8n Docker deployment up-to-date with minimal manual intervention while retaining control over when updates are applied.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Scheduling:** Accepts manual or scheduled triggers to start the update check.
- **1.2 Default Variable Initialization:** Sets essential variables such as working directory, container name, and Telegram chat ID.
- **1.3 Version Retrieval:** Fetches the currently installed n8n Docker image version from the server and the latest released version from the n8n GitHub repository.
- **1.4 Version Processing and Comparison:** Cleans the GitHub version string and merges it with the installed version, then compares both versions.
- **1.5 Notification and Approval via Telegram:** Sends Telegram messages to notify if the system is up-to-date or requests user approval to proceed with the update.
- **1.6 Docker Image Update and Container Restart:** Upon approval, pulls the latest Docker image, updates the container using docker-compose, and restarts it.
- **1.7 Confirmation Notification:** Sends a Telegram message confirming the update completion.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Scheduling

- **Overview:** This block triggers the workflow either manually or on a schedule (every 3 days at 13:00) to check for updates.
- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Schedule Trigger

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Allows manual initiation of the workflow for testing or immediate update checks.  
    - Configuration: Default manual trigger with no parameters.  
    - Input: None  
    - Output: Connects to "Set Default variable" node.  
    - Edge Cases: None significant; manual trigger depends on user action.

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Automatically triggers the workflow every 3 days at 13:00.  
    - Configuration: Interval set to 3 days, trigger hour 13.  
    - Input: None  
    - Output: Connects to "Set Default variable" node.  
    - Edge Cases: Timezone considerations; configured timezone is Asia/Tehran.  
    - Version: Uses typeVersion 1.2 for schedule trigger.

---

#### 1.2 Default Variable Initialization

- **Overview:** Sets essential workflow variables such as the working directory, n8n container name, and Telegram chat ID.
- **Nodes Involved:**  
  - Set Default variable  
  - Sticky Note (Default Variables)

- **Node Details:**

  - **Set Default variable**  
    - Type: Set  
    - Role: Defines three string variables:  
      - `working-directory`: Directory containing `docker-compose.yml` (initially empty, user must set).  
      - `n8n-container-name`: Docker container name for n8n (initially empty, user must set).  
      - `telegram-id`: Telegram chat ID (default set to "598677820" but should be customized).  
    - Configuration: Variables assigned as string types with placeholders or default values.  
    - Input: Receives trigger from manual or schedule trigger.  
    - Output: Connects to "check n8n installed version" and "Github HTTP Request" nodes.  
    - Edge Cases: Empty or incorrect variable values will cause downstream failures (e.g., SSH commands failing due to wrong directory or container name).  
    - Always outputs data to ensure downstream nodes receive variables.

  - **Sticky Note (Default Variables)**  
    - Type: Sticky Note  
    - Role: Provides instructions to set the three default variables before running the workflow.  
    - Content Highlights:  
      - `working-directory`: Path to `docker-compose.yml`.  
      - `n8n-container-name`: Name of the n8n Docker container.  
      - `telegram-id`: Telegram chat ID, retrievable via `@get_id_bot`.  
    - Position: Near the "Set Default variable" node for user reference.

---

#### 1.3 Version Retrieval

- **Overview:** Retrieves the currently installed n8n Docker image version from the server and fetches the latest released version from GitHub.
- **Nodes Involved:**  
  - check n8n installed version  
  - Github HTTP Request  
  - Sticky Notes (Check Installed Image Version, GitHub info)

- **Node Details:**

  - **check n8n installed version**  
    - Type: SSH  
    - Role: Runs a command on the server to get the installed n8n Docker image version label.  
    - Command:  
      ```bash
      sudo docker inspect "{{ $json['n8n-container-name'] }}" | jq -r '.[0].Config.Labels["org.opencontainers.image.version"]'
      ```  
    - Configuration: Uses SSH credentials with password authentication.  
    - Input: Receives variables from "Set Default variable".  
    - Output: Connects to "Merge Results" node.  
    - Edge Cases:  
      - SSH connection failure or authentication errors.  
      - Container not found or Docker inspect command fails.  
      - `jq` command missing or malformed JSON.  
    - Version: typeVersion 1.

  - **Github HTTP Request**  
    - Type: HTTP Request  
    - Role: Fetches the latest release information from the n8n GitHub repository API.  
    - URL: `https://api.github.com/repos/n8n-io/n8n/releases/latest`  
    - Configuration: Default GET request, no authentication.  
    - Input: Receives variables from "Set Default variable".  
    - Output: Connects to "Edit Version String" node.  
    - Edge Cases:  
      - GitHub API rate limiting or downtime.  
      - Network connectivity issues.  
    - Version: typeVersion 4.2.

  - **Sticky Notes**  
    - "Check Installed Image Version": Explains the purpose of the SSH command node.  
    - "Get information from the n8n GitHub repository": Explains the HTTP request node.

---

#### 1.4 Version Processing and Comparison

- **Overview:** Processes the GitHub version string to remove prefix and merges installed and latest versions for comparison.
- **Nodes Involved:**  
  - Edit Version String  
  - Merge Results  
  - Comapre Two Input (If node)  
  - Sticky Notes (Version string edit, SQL merge, version compare)

- **Node Details:**

  - **Edit Version String**  
    - Type: Set  
    - Role: Removes the `"n8n@"` prefix from the GitHub `tag_name` string to normalize the version format.  
    - Expression:  
      ```javascript
      {{$json["tag_name"].replace("n8n@", "")}}
      ```  
    - Input: Receives GitHub release data.  
    - Output: Connects to "Merge Results" node.  
    - Edge Cases: If `tag_name` is missing or malformed, expression may fail.

  - **Merge Results**  
    - Type: Merge (combineBySql)  
    - Role: Joins the installed version (`stdout` from SSH) and the cleaned GitHub version (`tag_name`) into a single data set for comparison.  
    - SQL Query:  
      ```sql
      SELECT input1.stdout, input2.tag_name 
      FROM input1 
      LEFT JOIN input2 ON true;
      ```  
    - Input: Receives installed version from "check n8n installed version" and cleaned GitHub version from "Edit Version String".  
    - Output: Connects to "Comapre Two Input" node.  
    - Edge Cases: SQL join assumes single-row inputs; multiple rows may cause unexpected results.

  - **Comapre Two Input**  
    - Type: If  
    - Role: Compares the installed version (`stdout`) with the latest GitHub version (`tag_name`).  
    - Condition: Checks if both strings are equal (strict, case-sensitive).  
    - Input: Receives merged data.  
    - Output:  
      - If true (versions equal): Connects to "Telegram Notif" (no update needed).  
      - If false (new version available): Connects to "Telegram Approve" (request update approval).  
    - Edge Cases: Version string format inconsistencies may cause false negatives or positives.

  - **Sticky Notes**  
    - "This node removes 'n8n@' from the version string": Explains "Edit Version String".  
    - "SQL Query: Merging Inputs": Explains the SQL merge node.  
    - "Compare Versions": Explains the comparison logic.

---

#### 1.5 Notification and Approval via Telegram

- **Overview:** Sends Telegram messages to notify the user about the update status and requests approval to proceed with the update.
- **Nodes Involved:**  
  - Telegram Notif  
  - Telegram Approve  
  - Sticky Notes (Telegram notification, approval)

- **Node Details:**

  - **Telegram Notif**  
    - Type: Telegram  
    - Role: Sends a message to the user indicating that n8n is already up to date.  
    - Message: `"n8n is up to date."`  
    - Chat ID: Uses `telegram-id` variable from defaults.  
    - Credentials: Uses Telegram API credentials.  
    - Input: Triggered when versions match.  
    - Output: None (end of this branch).  
    - Edge Cases: Telegram API errors, invalid chat ID.

  - **Telegram Approve**  
    - Type: Telegram (sendAndWait)  
    - Role: Sends a message informing a new version is available and waits for user confirmation to proceed.  
    - Message:  
      ```
      Hi, 
      a new n8n version is available. 
      I'm ready to update. 
      Can I start now?
      ```  
    - Chat ID: Uses `telegram-id` variable.  
    - Credentials: Telegram API credentials.  
    - Input: Triggered when new version detected.  
    - Output: Connects to "Pull n8n Image" node upon approval.  
    - Edge Cases: User does not respond or denies update; Telegram API errors.

  - **Sticky Notes**  
    - "Telegram Notification [OPTIONAL]": Explains the no-update notification.  
    - "Telegram Approve": Explains the approval request message.

---

#### 1.6 Docker Image Update and Container Restart

- **Overview:** Upon user approval, pulls the latest Docker image, updates the container using docker-compose, and restarts it.
- **Nodes Involved:**  
  - Pull n8n Image  
  - docker compose pull  
  - docker compose up  
  - Telegram Notif1  
  - Sticky Notes (Pull Docker Image, Docker Compose Pull, Docker Compose Up, Telegram Notification)

- **Node Details:**

  - **Pull n8n Image**  
    - Type: SSH  
    - Role: Executes `sudo docker pull docker.n8n.io/n8nio/n8n` to fetch the latest image.  
    - Working Directory: Uses `working-directory` variable.  
    - Credentials: SSH password authentication.  
    - Input: Triggered after Telegram approval.  
    - Output: Connects to "docker compose pull".  
    - Edge Cases: SSH failures, Docker pull errors, network issues.

  - **docker compose pull**  
    - Type: SSH  
    - Role: Runs `sudo docker compose pull` in the working directory to pull updated images for all services.  
    - Working Directory: Uses `working-directory` variable.  
    - Credentials: SSH password authentication.  
    - Input: From "Pull n8n Image".  
    - Output: Connects to "docker compose up".  
    - Edge Cases: Docker compose not installed, permission issues.

  - **docker compose up**  
    - Type: SSH  
    - Role: Runs `sudo docker compose up -d` to start containers with the new images in detached mode.  
    - Working Directory: Uses `working-directory` variable.  
    - Credentials: SSH password authentication.  
    - Input: From "docker compose pull".  
    - Output: Connects to "Telegram Notif1".  
    - Edge Cases: Compose errors, container startup failures.

  - **Telegram Notif1**  
    - Type: Telegram  
    - Role: Sends a message confirming that n8n has been updated to the latest version.  
    - Message: `"We are updating n8n to the latest version."`  
    - Chat ID: Uses `telegram-id` variable.  
    - Credentials: Telegram API credentials.  
    - Input: From "docker compose up".  
    - Output: None (end of workflow).  
    - Edge Cases: Telegram API errors.

  - **Sticky Notes**  
    - "Pull Docker Image": Explains the pull command node.  
    - "Docker Compose Pull": Explains the compose pull command.  
    - "Docker Compose Up": Explains the compose up command.  
    - "Telegram Notification": Explains the update confirmation message.

---

### 3. Summary Table

| Node Name                   | Node Type           | Functional Role                                | Input Node(s)                      | Output Node(s)                  | Sticky Note                                                                                      |
|-----------------------------|---------------------|-----------------------------------------------|----------------------------------|--------------------------------|------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’| Manual Trigger      | Manual start of workflow                       | None                             | Set Default variable            |                                                                                                |
| Schedule Trigger            | Schedule Trigger     | Scheduled start every 3 days at 13:00         | None                             | Set Default variable            | "Schedule Trigger: You can schedule this workflow, for example, every three days to check n8n images." |
| Set Default variable        | Set                  | Sets working-directory, container name, telegram-id | When clicking ‘Test workflow’, Schedule Trigger | check n8n installed version, Github HTTP Request | "Default Variables: Before starting, please set working-directory, n8n-container-name, telegram-id." |
| check n8n installed version | SSH                  | Retrieves installed n8n Docker image version  | Set Default variable             | Merge Results                  | "Check Installed Image Version: Execute a command on the server to determine which version is running." |
| Github HTTP Request         | HTTP Request          | Fetches latest n8n release info from GitHub   | Set Default variable             | Edit Version String            | "Get information from the n8n GitHub repository to find the latest released version of n8n."    |
| Edit Version String         | Set                   | Removes "n8n@" prefix from GitHub version tag | Github HTTP Request              | Merge Results                  | "This node removes 'n8n@' from the version string."                                            |
| Merge Results              | Merge (combineBySql)   | Merges installed and latest version data      | check n8n installed version, Edit Version String | Comapre Two Input             | "SQL Query: Merging Inputs: Joins installed version and GitHub version for comparison."         |
| Comapre Two Input           | If                    | Compares installed and latest versions        | Merge Results                   | Telegram Notif (if equal), Telegram Approve (if different) | "Compare Versions: Detects if a new version is available."                                     |
| Telegram Notif              | Telegram               | Notifies user n8n is up to date                | Comapre Two Input (true branch) | None                          | "Telegram Notification [OPTIONAL]: Inform no update needed."                                   |
| Telegram Approve            | Telegram (sendAndWait) | Requests user approval to update               | Comapre Two Input (false branch)| Pull n8n Image                | "Telegram Approve: Ask user if update can start."                                              |
| Pull n8n Image              | SSH                    | Pulls latest n8n Docker image                   | Telegram Approve                | docker compose pull           | "Pull Docker Image: Pull the latest n8n image."                                               |
| docker compose pull         | SSH                    | Pulls updated images via docker-compose        | Pull n8n Image                 | docker compose up             | "Docker Compose Pull: Runs in the working directory."                                         |
| docker compose up           | SSH                    | Starts containers with new images               | docker compose pull            | Telegram Notif1               | "Docker Compose Up: Starts container with new image."                                        |
| Telegram Notif1             | Telegram               | Confirms update completion                       | docker compose up              | None                         | "Telegram Notification: Inform that n8n has been updated."                                    |
| Sticky Note (Default Variables) | Sticky Note        | Instructions for setting default variables     | None                          | None                         | See content in section 1.2                                                                     |
| Sticky Note1                | Sticky Note            | Explains GitHub HTTP Request node               | None                          | None                         | "Get information from the n8n GitHub repository to find the latest released version of n8n."  |
| Sticky Note2                | Sticky Note            | Explains version string editing                  | None                          | None                         | "Removes 'n8n@' from version string."                                                        |
| Sticky Note3                | Sticky Note            | Explains installed version check                 | None                          | None                         | "Check Installed Image Version: Execute a command on the server to determine running version." |
| Sticky Note4                | Sticky Note            | Explains SQL merge query                          | None                          | None                         | "SQL Query: Merging Inputs with LEFT JOIN."                                                  |
| Sticky Note5                | Sticky Note            | Explains Telegram no-update notification         | None                          | None                         | "Telegram Notification [OPTIONAL]: Inform no update needed."                                 |
| Sticky Note6                | Sticky Note            | Explains version comparison                       | None                          | None                         | "Compare Versions: Detects if a new version is available."                                   |
| Sticky Note7                | Sticky Note            | Explains Telegram approval request                | None                          | None                         | "Telegram Approve: Ask user if update can start."                                            |
| Sticky Note8                | Sticky Note            | Explains Docker image pull command                 | None                          | None                         | "Pull Docker Image: Pull the latest n8n image."                                             |
| Sticky Note9                | Sticky Note            | Explains docker compose pull command               | None                          | None                         | "Docker Compose Pull: Runs in the working directory."                                       |
| Sticky Note10               | Sticky Note            | Explains docker compose up command                  | None                          | None                         | "Docker Compose Up: Starts container with new image."                                      |
| Sticky Note11               | Sticky Note            | Explains Telegram update confirmation notification | None                          | None                         | "Telegram Notification: Inform that n8n has been updated."                                  |
| Sticky Note12               | Sticky Note            | Explains schedule trigger                           | None                          | None                         | "Schedule Trigger: You can schedule this workflow, for example, every three days to check n8n images." |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Allow manual start of the workflow.

2. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger (typeVersion 1.2)  
   - Configure: Interval every 3 days, trigger at 13:00 (timezone Asia/Tehran).

3. **Create Set Node for Default Variables**  
   - Type: Set (typeVersion 3.4)  
   - Add three string variables:  
     - `working-directory`: Set to the path containing your `docker-compose.yml` (e.g., `/home/user/n8n`).  
     - `n8n-container-name`: Set to your n8n Docker container name (e.g., `n8n`).  
     - `telegram-id`: Set to your Telegram chat ID (find via `@get_id_bot`).  
   - Connect outputs of Manual Trigger and Schedule Trigger to this node.

4. **Create SSH Node to Check Installed Version**  
   - Type: SSH (typeVersion 1)  
   - Credentials: SSH password or key with sudo access.  
   - Command:  
     ```bash
     sudo docker inspect "{{ $json['n8n-container-name'] }}" | jq -r '.[0].Config.Labels["org.opencontainers.image.version"]'
     ```  
   - Working Directory: Use expression `={{ $json["working-directory"] }}`.  
   - Connect output of Set Default variable to this node.

5. **Create HTTP Request Node to Get Latest GitHub Release**  
   - Type: HTTP Request (typeVersion 4.2)  
   - Method: GET  
   - URL: `https://api.github.com/repos/n8n-io/n8n/releases/latest`  
   - Connect output of Set Default variable to this node.

6. **Create Set Node to Edit Version String**  
   - Type: Set (typeVersion 3.4)  
   - Add string field `tag_name` with expression:  
     ```javascript
     {{$json["tag_name"].replace("n8n@", "")}}
     ```  
   - Connect output of GitHub HTTP Request to this node.

7. **Create Merge Node (combineBySql)**  
   - Type: Merge (typeVersion 3.1)  
   - Mode: combineBySql  
   - SQL Query:  
     ```sql
     SELECT input1.stdout, input2.tag_name 
     FROM input1 
     LEFT JOIN input2 ON true;
     ```  
   - Connect outputs of "check n8n installed version" (input1) and "Edit Version String" (input2) to this node.

8. **Create If Node to Compare Versions**  
   - Type: If (typeVersion 2.2)  
   - Condition: Check if `stdout` equals `tag_name` (strict, case-sensitive).  
   - Connect output of Merge node to this node.

9. **Create Telegram Node for No Update Notification**  
   - Type: Telegram (typeVersion 1.2)  
   - Operation: Send Message  
   - Chat ID: Use expression `={{ $('Set Default variable').item.json['telegram-id'] }}`  
   - Text: `"n8n is up to date."`  
   - Connect If node’s "true" output (versions equal) to this node.  
   - Configure Telegram API credentials.

10. **Create Telegram Node for Update Approval**  
    - Type: Telegram (typeVersion 1.2)  
    - Operation: Send and Wait for Response  
    - Chat ID: Use expression `={{ $('Set Default variable').item.json['telegram-id'] }}`  
    - Message:  
      ```
      Hi, 
      a new n8n version is available. 
      I'm ready to update. 
      Can I start now?
      ```  
    - Connect If node’s "false" output (new version available) to this node.  
    - Configure Telegram API credentials.

11. **Create SSH Node to Pull Latest n8n Image**  
    - Type: SSH (typeVersion 1)  
    - Command: `sudo docker pull docker.n8n.io/n8nio/n8n`  
    - Working Directory: Use expression `={{ $('Set Default variable').item.json['working-directory'] }}`  
    - Credentials: SSH password or key with sudo access.  
    - Connect output of Telegram Approve node to this node.

12. **Create SSH Node to Run `docker compose pull`**  
    - Type: SSH (typeVersion 1)  
    - Command: `sudo docker compose pull`  
    - Working Directory: Use expression `={{ $('Set Default variable').item.json['working-directory'] }}`  
    - Credentials: SSH password or key.  
    - Connect output of Pull n8n Image node to this node.

13. **Create SSH Node to Run `docker compose up -d`**  
    - Type: SSH (typeVersion 1)  
    - Command: `sudo docker compose up -d`  
    - Working Directory: Use expression `={{ $('Set Default variable').item.json['working-directory'] }}`  
    - Credentials: SSH password or key.  
    - Connect output of docker compose pull node to this node.

14. **Create Telegram Node to Confirm Update Completion**  
    - Type: Telegram (typeVersion 1.2)  
    - Operation: Send Message  
    - Chat ID: Use expression `={{ $('Set Default variable').item.json['telegram-id'] }}`  
    - Text: `"We are updating n8n to the latest version."`  
    - Connect output of docker compose up node to this node.  
    - Configure Telegram API credentials.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                 |
|----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Ensure SSH user has sudo privileges to run Docker commands without password prompts.                | Critical for SSH nodes executing Docker commands.                                              |
| Telegram chat ID can be obtained by messaging the bot `@get_id_bot` on Telegram.                    | Telegram setup prerequisite.                                                                   |
| Docker commands assume usage of `docker compose` (v2+). Modify commands if using `docker-compose`. | Customization note for different Docker setups.                                                |
| Workflow timezone is set to Asia/Tehran; adjust schedule trigger timezone as needed.                | Scheduling behavior depends on timezone setting.                                               |
| Telegram bot must be created via BotFather and credentials configured in n8n.                      | Telegram API integration prerequisite.                                                        |
| For troubleshooting SSH commands, verify network connectivity and Docker installation on the server.| Common failure points for SSH nodes.                                                          |
| The workflow can be extended to support other notification platforms by replacing Telegram nodes.  | Customization suggestion.                                                                      |
| The workflow uses SQL merge node with a simple LEFT JOIN on true; ensure inputs are single-row data.| Important for correct data merging and comparison.                                            |

---

This documentation provides a detailed, structured reference for understanding, reproducing, and modifying the "Automate Docker Container Updates with Telegram Approval System" workflow in n8n.