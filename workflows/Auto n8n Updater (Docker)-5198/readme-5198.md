Auto n8n Updater (Docker)

https://n8nworkflows.xyz/workflows/auto-n8n-updater--docker--5198


# Auto n8n Updater (Docker)

### 1. Workflow Overview

This workflow automates the process of updating an n8n instance running inside a Docker environment. It regularly checks for new Docker image versions of n8n, compares the currently running version with the latest available on Docker Hub, fetches release notes from GitHub, summarizes them using an AI model, and requests manual approval via Telegram before triggering the Docker update via SSH on the host server.

The workflow is structured into the following logical blocks:

- **1.1 Scheduled Trigger and Instance Information Retrieval:** Periodically triggers the workflow to gather instance settings and verify if the environment is Docker-based.
- **1.2 Docker Version Retrieval and Comparison:** Fetches the running Docker image version, extracts the target version, retrieves the latest Docker Hub tag info, and compares digests to detect updates.
- **1.3 Release Notes Fetch and AI Summary:** Retrieves GitHub release notes for the target version, filters updates published recently, and uses an AI language model to generate a concise summary.
- **1.4 Manual Approval via Telegram:** Sends the release summary as a Telegram message requesting manual update approval.
- **1.5 Docker Update Execution:** Upon approval, connects via SSH to the server and executes Docker commands to pull the new image and restart containers with updated versions.
- **1.6 Configuration and Informational Nodes:** Set static parameters such as Docker paths and commands, and provide instructional sticky notes to assist users configuring or modifying the workflow.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger and Instance Information Retrieval

**Overview:**  
This block triggers the workflow hourly, fetches the n8n instance's current settings from the local REST API, and checks if the instance is running in a Docker environment.

**Nodes Involved:**  
- Every Hour  
- Get Instance's Settings  
- Is Docker  
- Sticky Note8  

**Node Details:**

- **Every Hour**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow execution every hour.  
  - Configuration: Interval set to trigger hourly.  
  - Input: None  
  - Output: Triggers "Get Instance's Settings" node.  
  - Edge Cases: Workflow relies on time correctness; misconfiguration could miss updates.

- **Get Instance's Settings**  
  - Type: HTTP Request  
  - Role: Retrieves local n8n instance settings via REST API (e.g., version, Docker status).  
  - Configuration: URL set to environment variable `WEBHOOK_URL` with `/rest/settings` endpoint.  
  - Input: Trigger from "Every Hour".  
  - Output: JSON data about instance.  
  - Edge Cases: Network errors, API unavailability, or authentication issues could fail retrieval.  
  - Requirements: `WEBHOOK_URL` environment variable must be correctly set.

- **Is Docker**  
  - Type: If Node  
  - Role: Checks if the instance is running in Docker by evaluating `data.isDocker` boolean from settings.  
  - Configuration: Condition checks if `data.isDocker` is true.  
  - Input: Output from "Get Instance's Settings".  
  - Output: Proceeds only if Docker environment is detected; else stops.  
  - Edge Cases: Missing or malformed `isDocker` field may cause failures or false negatives.

- **Sticky Note8**  
  - Type: Sticky Note  
  - Content: Explains this block fetches local settings and ensures Docker environment compatibility.  

---

#### 2.2 Docker Version Retrieval and Comparison

**Overview:**  
Retrieves the running Docker container’s image version, determines the target version tag, fetches the latest Docker Hub tag details, and compares image digests to detect if an update is required.

**Nodes Involved:**  
- Docker Path  
- Get n8n Current Version  
- Target Version  
- Get Version's Last Update  
- Get Current Version  
- Needs Update ?  
- Sticky Note5  
- Sticky Note6  
- Sticky Note7  

**Node Details:**

- **Docker Path**  
  - Type: Set  
  - Role: Defines static parameters including the absolute path to the Docker compose directory and worker scaling commands.  
  - Configuration:  
    - `docker_path` = "./n8n-docker-caddy" (default relative path; should be updated to absolute path)  
    - `worker_command` = "--scale n8n-worker=4" (optional scaling for workers)  
  - Input: From "Is Docker" node.  
  - Output: Supplies parameters for SSH commands.  
  - Edge Cases: Incorrect path or command here will cause update failures.

- **Get n8n Current Version**  
  - Type: SSH  
  - Role: Executes a Docker inspect command on the server to find current running n8n container image details.  
  - Configuration:  
    - Working directory: `docker_path` from "Docker Path" node  
    - Command: `docker inspect $(docker ps -q --filter "name=n8n")`  
  - Credentials: SSH password credential for root access to the server.  
  - Input: From "Docker Path".  
  - Output: JSON with container info including image tag.  
  - Edge Cases: SSH connection failure, container not running, command errors.

- **Target Version**  
  - Type: Set  
  - Role: Parses the image name from the Docker inspect output to isolate the tag (version) string.  
  - Configuration: Extracts image tag by parsing JSON from `stdout`, removing prefix, trimming.  
  - Input: From "Get n8n Current Version".  
  - Output: Sets `n8n_target_version` used in subsequent API calls.  
  - Edge Cases: Parsing failures if Docker inspect output changes format.

- **Get Version's Last Update**  
  - Type: HTTP Request  
  - Role: Requests metadata of the Docker Hub image tag corresponding to `n8n_target_version`.  
  - Configuration: URL constructed with Docker Hub API for n8nio/n8n repository and tag.  
  - Input: From "Target Version".  
  - Output: JSON containing tag details including digest.  
  - Edge Cases: API rate limits or network failures.

- **Get Current Version**  
  - Type: HTTP Request  
  - Role: Retrieves metadata about the currently running version of n8n’s Docker image tag from Docker Hub.  
  - Configuration: URL uses version from instance settings (`versionCli`).  
  - Input: From "Get Version's Last Update".  
  - Output: JSON including digest of currently deployed image.  
  - Edge Cases: Same as above.

- **Needs Update ?**  
  - Type: If Node  
  - Role: Compares the image digest from the running version and the latest tag to detect if an update is needed.  
  - Configuration: Condition checks if current digest differs from the latest digest.  
  - Input: From "Get Current Version".  
  - Output: True if update is needed, false otherwise.  
  - Edge Cases: Digest comparison failure if fields missing or malformed.

- **Sticky Note5**  
  - Content: Instructions for configuring server paths (`docker_path`) and optional worker scaling commands (`worker_command`).  
- **Sticky Note6**  
  - Content: Reminder to select SSH credentials for server access in SSH nodes.  
- **Sticky Note7**  
  - Content: Explanation of update detection logic based on Docker image digest comparison.

---

#### 2.3 Release Notes Fetch and AI Summary

**Overview:**  
Fetches official release notes from GitHub for the target version, filters releases published within the last hour, and processes the notes using a Google Gemini AI model to generate a concise, user-friendly summary.

**Nodes Involved:**  
- Get n8n Github Release  
- Published In Last Hours ?  
- Google Gemini Chat Model  
- Release Overview  
- Sticky Note1  
- Sticky Note2  
- Sticky Note3  
- Sticky Note4  

**Node Details:**

- **Get n8n Github Release**  
  - Type: HTTP Request  
  - Role: Fetches detailed release info from GitHub API for the target version.  
  - Configuration: URL constructed using the `n8n_target_version`.  
  - Input: From "Needs Update ?" node (true branch).  
  - Output: Release notes JSON including body text.  
  - On Error: Continues workflow even if API call fails (no blocking).  
  - Edge Cases: GitHub API limits, network issues.

- **Published In Last Hours ?**  
  - Type: If Node  
  - Role: Checks if the release was published within the last hour to avoid duplicate notifications.  
  - Configuration: Compares `published_at` field with current time minus one hour.  
  - Input: From "Get n8n Github Release".  
  - Output: True if recent, false otherwise.  
  - Edge Cases: Timezone or clock skew could affect logic.  
  - Notes: Should be adjusted if trigger interval changes.

- **Google Gemini Chat Model**  
  - Type: AI Language Model (Google Gemini)  
  - Role: Summarizes the raw release notes into a concise, easy-to-understand text.  
  - Configuration: Temperature set to 0 for deterministic output, model set to `models/gemma-3n-e4b-it`.  
  - Input: From "Published In Last Hours ?" true branch.  
  - Output: Text summary of release notes.  
  - Credentials: Google Palm API credentials required.  
  - Edge Cases: API errors, rate limits, or malformed release notes.

- **Release Overview**  
  - Type: Chain LLM (Langchain)  
  - Role: Further processes the AI-generated summary to ensure clear, prioritized communication of key changes.  
  - Configuration: Custom prompt designed to filter and reorder release notes by priority for n8n users.  
  - Input: From "Google Gemini Chat Model".  
  - Output: Final summarized text.  
  - Edge Cases: Prompt failures or unexpected input format.

- **Sticky Note1**  
  - Content: Instructions for setting Telegram Bot credentials and chat ID for update approval notifications.  
- **Sticky Note2**  
  - Content: Explanation of AI release summary block and flexibility to use other LLM providers.  
- **Sticky Note3**  
  - Content: Explanation about the time-check node preventing duplicate notifications and importance of adjusting it if schedule changes.  
- **Sticky Note4**  
  - Content: Details about fetching release notes from GitHub API and that failure in this step still allows update notification without details.

---

#### 2.4 Manual Approval via Telegram

**Overview:**  
Sends the summarized release notes to a configured Telegram chat for manual approval. The workflow pauses to wait for a double confirmation (approve or disapprove buttons) before proceeding to update.

**Nodes Involved:**  
- Approve Update  
- Approved ?  
- Sticky Note1 (also applies here)  

**Node Details:**

- **Approve Update**  
  - Type: Telegram Node  
  - Role: Sends a message with the new n8n version and release summary; waits for user interaction for approval.  
  - Configuration:  
    - Message includes version name and release overview text.  
    - Approval options require double confirmation with "✅ Update" and "❌ Ignore" buttons.  
  - Credentials: Telegram Bot API credentials required.  
  - Input: From "Release Overview".  
  - Output: Proceeds based on approval response.  
  - Edge Cases: Telegram API connectivity issues, user inactivity leading to timeout.

- **Approved ?**  
  - Type: If Node  
  - Role: Checks if the user approved the update.  
  - Configuration: Condition checks if `data.approved` is true.  
  - Input: Output from "Approve Update".  
  - Output: True branch triggers update; false branch ends workflow.  
  - Edge Cases: Unexpected user input or cancellation.

---

#### 2.5 Docker Update Execution

**Overview:**  
When approved, this block executes Docker commands on the server via SSH to pull the new image, stop the existing containers, and start updated ones in detached mode, scaling workers if configured.

**Nodes Involved:**  
- Update Docker  
- Sticky Note9  

**Node Details:**

- **Update Docker**  
  - Type: SSH  
  - Role: Runs update commands on the server inside the configured Docker directory.  
  - Configuration:  
    - Working directory: `docker_path` variable.  
    - Command: Runs `docker compose pull`, `docker compose down`, and `docker compose up -d` with optional worker scaling in background using `nohup`.  
    - Output redirected to `update.log` file.  
  - Credentials: SSH password credential (same as "Get n8n Current Version").  
  - Input: From "Approved ?" node (true branch).  
  - Output: None (terminal node).  
  - Edge Cases: SSH connection errors, Docker command failures, permission issues, log file write errors.

- **Sticky Note9**  
  - Content: Detailed explanation of the update command steps, the importance of background execution to avoid workflow crash, and the log file location for troubleshooting.

---

#### 2.6 Configuration and Informational Nodes (Sticky Notes)

- **Sticky Note5:** Instructions for configuring server paths and worker scaling commands.  
- **Sticky Note6:** Reminder to select SSH credentials in SSH nodes.  
- **Sticky Note7:** Explanation of the update detection mechanism using Docker image digest comparison.  
- **Sticky Note8:** Clarifies the instance info retrieval and Docker environment validation.  
- **Sticky Note9:** Details about the update execution command and its background running nature.  
- **Sticky Note1:** Instructions for configuring Telegram Bot credential and chat ID for approval notifications.  
- **Sticky Note2:** Explains AI release summary and alternative LLM usage.  
- **Sticky Note3:** Notes on time check node and schedule trigger adjustments.  
- **Sticky Note4:** Explains fetching release notes from GitHub and fallback behavior on failure.

---

### 3. Summary Table

| Node Name               | Node Type                    | Functional Role                             | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                              |
|-------------------------|------------------------------|--------------------------------------------|-----------------------------|----------------------------|--------------------------------------------------------------------------------------------------------|
| Every Hour              | Schedule Trigger             | Triggers workflow hourly                   | None                        | Get Instance's Settings     |                                                                                                        |
| Get Instance's Settings | HTTP Request                | Fetches local n8n instance settings       | Every Hour                  | Is Docker                  | Sticky Note8: Explains fetching instance info and Docker validation                                    |
| Is Docker               | If                          | Checks if running in Docker environment    | Get Instance's Settings     | Docker Path                |                                                                                                        |
| Docker Path             | Set                         | Sets server Docker path and worker command | Is Docker                   | Get n8n Current Version    | Sticky Note5: Configure docker_path and worker scaling; Sticky Note6: SSH credentials reminder          |
| Get n8n Current Version | SSH                         | Retrieves running Docker container info   | Docker Path                 | Target Version             |                                                                                                        |
| Target Version          | Set                         | Parses target Docker image tag from inspect output | Get n8n Current Version  | Get Version's Last Update  |                                                                                                        |
| Get Version's Last Update | HTTP Request              | Gets Docker Hub tag metadata for target version | Target Version          | Get Current Version        | Sticky Note7: Explains update detection via digest comparison                                         |
| Get Current Version     | HTTP Request                | Gets Docker Hub tag metadata for current version | Get Version's Last Update | Needs Update ?             |                                                                                                        |
| Needs Update ?          | If                          | Compares digests to detect needed update  | Get Current Version         | Get n8n Github Release     |                                                                                                        |
| Get n8n Github Release  | HTTP Request                | Fetches GitHub release notes for target version | Needs Update ?             | Published In Last Hours ?, Approve Update | Sticky Note4: Fetch release notes; fallback on failure                                               |
| Published In Last Hours ?| If                          | Checks if release was published recently   | Get n8n Github Release      | Google Gemini Chat Model   | Sticky Note3: Explains time check to prevent duplicate notifications                                   |
| Google Gemini Chat Model| AI Language Model (Google Gemini) | Generates AI summary of release notes     | Published In Last Hours ?   | Release Overview           | Sticky Note2: AI summary explanation and alternative LLMs                                              |
| Release Overview        | Chain LLM (Langchain)        | Refines AI summary prioritizing key info  | Google Gemini Chat Model    | Approve Update             |                                                                                                        |
| Approve Update          | Telegram Node                | Sends summary and waits for user approval | Release Overview            | Approved ?                 | Sticky Note1: Instructions for Telegram Bot credential and chat ID                                    |
| Approved ?              | If                          | Checks user approval to proceed            | Approve Update              | Update Docker              |                                                                                                        |
| Update Docker           | SSH                         | Executes Docker update commands on server | Approved ?                  | None                      | Sticky Note9: Explains update commands, background process, and update.log file                       |
| Sticky Note1            | Sticky Note                 | Instructional note for Telegram setup      | None                        | None                      | Applies to Telegram approval nodes                                                                     |
| Sticky Note2            | Sticky Note                 | Instructional note for AI summary block    | None                        | None                      | Applies to AI summary nodes                                                                             |
| Sticky Note3            | Sticky Note                 | Instructional note for time check          | None                        | None                      | Applies to time check node                                                                              |
| Sticky Note4            | Sticky Note                 | Instructional note for fetching release notes| None                       | None                      | Applies to GitHub release fetch node                                                                    |
| Sticky Note5            | Sticky Note                 | Instructional note for server path config  | None                        | None                      | Applies to Docker path node                                                                             |
| Sticky Note6            | Sticky Note                 | SSH credentials reminder                    | None                        | None                      | Applies to SSH nodes                                                                                    |
| Sticky Note7            | Sticky Note                 | Explains update detection logic             | None                        | None                      | Applies to digest comparison nodes                                                                      |
| Sticky Note8            | Sticky Note                 | Explains instance info retrieval and Docker check | None                   | None                      | Applies to instance info nodes                                                                          |
| Sticky Note9            | Sticky Note                 | Explains Docker update execution step       | None                        | None                      | Applies to Update Docker node                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node ("Every Hour")**  
   - Set trigger interval to hourly (every 1 hour).

2. **Create HTTP Request Node ("Get Instance's Settings")**  
   - URL: Use environment variable `WEBHOOK_URL` + `/rest/settings`  
   - Method: GET  
   - Connect input from "Every Hour".

3. **Create If Node ("Is Docker")**  
   - Condition: Check if `data.isDocker` (from JSON path) is true (boolean)  
   - Connect input from "Get Instance's Settings".

4. **Create Set Node ("Docker Path")**  
   - Assign two string variables:  
     - `docker_path` = absolute path to Docker compose directory (e.g., `/home/user/n8n-docker`)  
     - `worker_command` = e.g., `--scale n8n-worker=4` or leave blank if no scaling  
   - Connect input from "Is Docker" (true branch).

5. **Create SSH Node ("Get n8n Current Version")**  
   - Credentials: SSH password for root user on n8n server.  
   - Working Directory: Use expression to get `docker_path` from "Docker Path".  
   - Command: `docker inspect $(docker ps -q --filter "name=n8n")`  
   - Connect input from "Docker Path".

6. **Create Set Node ("Target Version")**  
   - Extract `n8n_target_version` from the `stdout` field of SSH node output by parsing JSON and trimming the image tag.  
   - Connect input from "Get n8n Current Version".

7. **Create HTTP Request Node ("Get Version's Last Update")**  
   - URL: `https://registry.hub.docker.com/v2/repositories/n8nio/n8n/tags/{{ $json.n8n_target_version }}`  
   - Method: GET  
   - Connect input from "Target Version".

8. **Create HTTP Request Node ("Get Current Version")**  
   - URL: `https://registry.hub.docker.com/v2/repositories/n8nio/n8n/tags/{{ $('Get Instance\'s Settings').json.data.versionCli }}`  
   - Method: GET  
   - Connect input from "Get Version's Last Update".

9. **Create If Node ("Needs Update ?")**  
   - Condition: Compare `digest` from "Get Current Version" with `digest` from "Get Version's Last Update"  
   - If digests differ, proceed with update.  
   - Connect input from "Get Current Version".

10. **Create HTTP Request Node ("Get n8n Github Release")**  
    - URL: `https://api.github.com/repos/n8n-io/n8n/releases/{{ $json.n8n_target_version }}`  
    - Method: GET  
    - Connect input from "Needs Update ?" (true branch).  
    - On error, continue workflow.

11. **Create If Node ("Published In Last Hours ?")**  
    - Condition: Check if release `published_at` date is after current time minus 1 hour.  
    - Connect input from "Get n8n Github Release".

12. **Create AI Language Model Node ("Google Gemini Chat Model")**  
    - Model: `models/gemma-3n-e4b-it`  
    - Temperature: 0  
    - Connect input from "Published In Last Hours ?" (true branch).  
    - Credentials: Google Palm API credentials configured.

13. **Create Chain LLM Node ("Release Overview")**  
    - Prompt: Technical writer role analyzing n8n release notes, focusing on key features, fixes, and enhancements.  
    - Connect input from "Google Gemini Chat Model".

14. **Create Telegram Node ("Approve Update")**  
    - Send message with text: "New n8n Version {{ version name }}\n\n{{ release summary }}"  
    - Enable sendAndWait operation with double approval buttons: "✅ Update" and "❌ Ignore".  
    - Credentials: Telegram Bot API credential configured.  
    - Connect input from "Release Overview".

15. **Create If Node ("Approved ?")**  
    - Condition: Check if approval `data.approved` is true.  
    - Connect input from "Approve Update".

16. **Create SSH Node ("Update Docker")**  
    - Credentials: Same SSH credential as previous SSH nodes.  
    - Working Directory: Use `docker_path` variable.  
    - Command: Run in background using `nohup`:  
      ```
      docker compose pull && docker compose down && docker compose up -d {{ $json.worker_command }}
      ```  
      Output redirected to `update.log`.  
    - Connect input from "Approved ?" (true branch).

17. **Connect all false branches and failure outputs appropriately to halt or end workflow.**

18. **Add Sticky Notes** for configuration guidance and workflow explanations as per sticky note contents described in section 2.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                      | Context or Link                                                                                   |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| To enable fully automatic updates without manual approval, delete all nodes related to approval (Telegram nodes and If "Approved ?") and connect "Needs Update ?" true output directly to "Update Docker".                                                                                                        | Found in Sticky Note at position near manual approval section.                                   |
| Log file for update process is `update.log` inside the Docker compose directory on the server; check this file if update issues arise.                                                                                                                                                                         | Sticky Note9                                                                                     |
| The AI prompt used in "Release Overview" node filters release notes prioritizing features, enhancements, and critical fixes relevant for n8n users and developers, ignoring minor chores or documentation updates.                                                                                                | Node "Release Overview" details.                                                                 |
| Time check node ("Published In Last Hours ?") should be adjusted if the schedule trigger interval changes to prevent missed or duplicate notifications.                                                                                                                                                        | Sticky Note3                                                                                     |
| Telegram Bot must be configured with correct Bot API credential and personal chat ID for receiving update notifications and approval requests.                                                                                                                                                                  | Sticky Note1                                                                                     |
| SSH credentials used must have permissions to execute Docker commands and access the configured Docker compose directory on the server.                                                                                                                                                                        | Sticky Note6                                                                                     |
| The workflow requires environment variable `WEBHOOK_URL` set to the n8n REST API endpoint for fetching instance settings.                                                                                                                                                                                      | Node "Get Instance's Settings"                                                                    |
| Docker path and worker command settings must be tailored to your server setup; absolute paths recommended.                                                                                                                                                                                                      | Sticky Note5                                                                                     |
| For other AI language models, replace "Google Gemini Chat Model" with your preferred LLM node; the prompt is designed to be adaptable.                                                                                                                                                                        | Sticky Note2                                                                                     |
| The workflow is designed to run on n8n version supporting the used nodes versions (e.g., HTTP Request v4.2, SSH v1, AI nodes v1 or higher).                                                                                                                                                                     | General version compatibility consideration.                                                    |

---

**Disclaimer:**  
The provided text is a detailed analysis and documentation derived exclusively from an automated n8n workflow. All operations conform to content policies and handle only legal and public data.