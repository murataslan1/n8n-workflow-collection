Auto-Create GitHub PRs & JIRA Updates from Git Commit Commands (Multi-Repo)

https://n8nworkflows.xyz/workflows/auto-create-github-prs---jira-updates-from-git-commit-commands--multi-repo--7048


# Auto-Create GitHub PRs & JIRA Updates from Git Commit Commands (Multi-Repo)

---

### 1. Workflow Overview

This workflow automates the creation of GitHub Pull Requests (PRs) and updates Jira task statuses based on commands embedded in Git commit messages across multiple repositories. It is designed to streamline developer workflows by interpreting specially formatted commit messages to trigger automated PR creation, Jira task status updates, and team notifications via Slack and Notion.

**Target Use Cases:**
- Developers pushing commits with embedded commands to auto-create PRs.
- Automated Jira task status updates upon task completion.
- Multi-repository support with dynamic webhook handling.
- Avoidance of duplicate PRs.
- Real-time team notifications on task and PR status.

**Logical Blocks:**

- **1.1 Input Reception:**
  - Listens for GitHub push events and captures commit data via webhook.

- **1.2 Commit Message Parsing:**
  - Extracts Jira ticket ID, commands (e.g., `[auto-pr]`, `[taskcompleted]`), and target base branch from commit messages.

- **1.3 Command Decision Logic:**
  - Determines if a PR should be created based on `[auto-pr]` command.
  - Checks for `[taskcompleted]` to decide if Jira task status should be updated.

- **1.4 Jira Task Verification:**
  - Confirms existence of Jira task matching the extracted ticket ID.

- **1.5 PR Existence Check:**
  - Queries GitHub to verify if a PR for the push branch already exists to prevent duplicates.

- **1.6 PR Creation:**
  - Creates a PR on GitHub if no existing PR is found and `[auto-pr]` command is present.

- **1.7 Jira Task Status Update:**
  - Updates Jira task status to "Development Done" if `[taskcompleted]` command is present.

- **1.8 Notifications & Logging:**
  - Sends Slack messages and appends blocks in Notion to inform the team about PR creation and Jira updates.

- **1.9 Error Handling & Workflow Control:**
  - Stops workflow execution on invalid commit messages or missing Jira tasks.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Captures GitHub push events via webhook to start the workflow.

- **Nodes Involved:**  
  - Webhook

- **Node Details:**  
  - **Webhook**  
    - Type: Webhook (HTTP listener)  
    - Configured to listen on path `github-push` for POST requests.  
    - Raw body enabled to capture full payload.  
    - Input: Incoming HTTP POST from GitHub webhook.  
    - Output: JSON payload containing push event data.  
    - Edge Cases:  
      - Missing or malformed webhook payload.  
      - Unauthorized requests if webhook secret verification is not configured (not shown).  
    - Sticky Note: Explains webhook role as listener for GitHub push events.

#### 1.2 Commit Message Parsing

- **Overview:**  
  Parses the first commit message from the push event to extract Jira key, commit description, commands, and target branch.

- **Nodes Involved:**  
  - Commit Message Breakdown (Code node)

- **Node Details:**  
  - **Commit Message Breakdown**  
    - Type: Code (JavaScript)  
    - Configured to run once per item.  
    - Parses commit message using regex pattern: `^([A-Z]+-\d+)\s(.*?)(?:\s\[(.*)\])?$`  
      - Extracts Jira ticket key, description, and optional command flags in brackets.  
    - Extracts flags such as `auto-pr`, `taskcompleted`, and base branch (any flag not equal to those two).  
    - Throws errors if format or mandatory info is missing.  
    - Outputs structured JSON with extracted data.  
    - Input: Payload from Webhook node.  
    - Output: Parsed commit data for downstream use.  
    - Edge Cases:  
      - Incorrect commit message format causes workflow stop.  
      - Missing base branch flag with `auto-pr` triggers error.  
    - Sticky Note: Describes node as "Decoder Ring" extracting key info from commit message.

#### 1.3 Command Decision Logic

- **Overview:**  
  Checks if commit includes commands to auto-create PR or mark task completed, routing workflow accordingly.

- **Nodes Involved:**  
  - Check for PR commands (If)  
  - Check for task completed command (If)

- **Node Details:**  
  - **Check for PR commands**  
    - Type: If node  
    - Tests if `autoPR` flag is true.  
    - True path proceeds to create PR and fetch Jira task details.  
    - False path goes to task completed check.  
    - Input: Output from Commit Message Breakdown node.  
    - Edge Cases:  
      - Flag parsing errors propagate here.  
    - Sticky Note: Explains decision to create PR or not based on `[auto-pr]`.  

  - **Check for task completed command**  
    - Type: If node  
    - Checks if `taskCompleted` flag is true.  
    - True path retrieves Jira task details for status update.  
    - False path leads to invalid commit message stop.  
    - Input: Output from Check for PR commands node (false path).  
    - Sticky Note: Describes check for `[taskcompleted]` command.

#### 1.4 Jira Task Verification

- **Overview:**  
  Verifies that the Jira task referenced in the commit exists before proceeding.

- **Nodes Involved:**  
  - Get task details for PR (Jira)  
  - Get Task Details without PR (Jira)  
  - Check if task exist (If)  
  - Check if task exists (If)  
  - JIRA Task does not exist (StopAndError)

- **Node Details:**  
  - **Get task details for PR**  
    - Type: Jira node (Get operation)  
    - Uses Jira Issue Key from commit message.  
    - Input: True branch from Check for PR commands.  
    - Output: Task details JSON.  
    - Edge Cases: Jira API auth failure or missing issue.  

  - **Get Task Details without PR**  
    - Type: Jira node (Get operation)  
    - Uses Jira Issue Key from commit message.  
    - Input: True branch from Check for task completed command.  
    - Output: Task details JSON.  

  - **Check if task exist**  
    - Type: If node  
    - Checks if Jira Issue ID exists and if `[taskcompleted]` is true.  
    - True path updates task status after PR.  
    - False path triggers JIRA Task does not exist error.  

  - **Check if task exists**  
    - Type: If node  
    - Checks existence of Jira Issue ID and `[taskcompleted]`.  
    - True path updates task status without PR.  
    - False path triggers JIRA Task does not exist error.  

  - **JIRA Task does not exist**  
    - Type: StopAndError  
    - Halts workflow with error message if task is invalid or missing completion command.  
    - Sticky Note: Describes safety net to avoid updating non-existent tasks.

#### 1.5 PR Existence Check

- **Overview:**  
  Queries GitHub to check if a PR already exists for the current branch to prevent duplicate PRs.

- **Nodes Involved:**  
  - Check if PR exists (HTTP Request)  
  - Code (processing PR existence)  
  - Merge

- **Node Details:**  
  - **Check if PR exists**  
    - Type: HTTP Request  
    - Queries GitHub API for PRs on repo filtered by head branch.  
    - Uses credentials for GitHub API.  
    - Input: Jira task details node output.  
    - Output: List of PRs or empty.  
    - Edge Cases: API rate limiting, auth failure, network errors.  
    - Sticky Note: Describes PR existence check to avoid duplicates.  

  - **Code**  
    - Type: Code node  
    - Processes HTTP response:  
      - If no PR found, sets `prExists` to false.  
      - If PR found, sets `prExists` to true and includes PR data.  
    - Outputs unified JSON for downstream processing.  

  - **Merge**  
    - Type: Merge node (Choose Branch)  
    - Merges data streams from PR existence check and processed PR data.  
    - Output: Unified PR info for next steps.  
    - Sticky Note: Acts as data convergence point for PR info.

#### 1.6 PR Creation

- **Overview:**  
  Creates a GitHub Pull Request if no existing PR is found and `[auto-pr]` command is included.

- **Nodes Involved:**  
  - Check whether a PR already exists (If)  
  - Request to create PR (HTTP Request)

- **Node Details:**  
  - **Check whether a PR already exists**  
    - Type: If node  
    - Checks `prExists` flag from Code node.  
    - True path skips PR creation.  
    - False path proceeds to create PR.  

  - **Request to create PR**  
    - Type: HTTP Request  
    - Sends POST to GitHub API to create PR with title, head branch, base branch, and body generated from extracted commit info.  
    - Uses GitHub OAuth credentials.  
    - Edge Cases: API rate limiting, auth failure, invalid base branch, network errors.  
    - Sticky Note: Finalizes PR creation step.

#### 1.7 Jira Task Status Update

- **Overview:**  
  Updates Jira task status to "Development Done" if `[taskcompleted]` command is present, either after PR creation or independently.

- **Nodes Involved:**  
  - Update task status after PR (Jira)  
  - Update the task status without PR (Jira)

- **Node Details:**  
  - **Update task status after PR**  
    - Type: Jira node (Update operation)  
    - Updates Jira issue status to ID `61` ("Development Done").  
    - Input: True path from Check if task exist node.  
    - Sticky Note: Marks task as done post PR creation.  

  - **Update the task status without PR**  
    - Type: Jira node (Update operation)  
    - Updates Jira issue status to ID `61` ("Development Done").  
    - Input: True path from Check if task exists node.  
    - Sticky Note: Allows Jira update without PR creation.

#### 1.8 Notifications & Logging

- **Overview:**  
  Sends notifications to Slack and appends blocks to Notion pages to inform the team about PR creation and Jira task updates.

- **Nodes Involved:**  
  - Send message in slack with PR (Slack)  
  - Append a block in notion with PR (Notion)  
  - Send message in slack without PR (Slack)  
  - Append a block in notion without PR (Notion)

- **Node Details:**  
  - **Send message in slack with PR**  
    - Type: Slack node  
    - Posts message indicating PR creation and Jira status update to configured Slack channel via OAuth2.  
    - Input: After Jira task status update with PR.  
    - Edge Cases: Slack API auth failure, rate limits.  

  - **Append a block in notion with PR**  
    - Type: Notion node  
    - Appends block to Notion page summarizing PR creation and Jira update.  
    - Input: After Slack message with PR.  

  - **Send message in slack without PR**  
    - Type: Slack node  
    - Posts message indicating only Jira status update to Slack channel.  
    - Input: After Jira task status update without PR.  

  - **Append a block in notion without PR**  
    - Type: Notion node  
    - Appends block to Notion page about Jira status update only.  
    - Input: After Slack message without PR.  

  - Sticky Note: Explains notifications as final communication step.

#### 1.9 Error Handling & Workflow Control

- **Overview:**  
  Ensures workflow stops cleanly on invalid commit messages or missing Jira tasks to avoid incorrect actions.

- **Nodes Involved:**  
  - Invalid commit message (StopAndError)  
  - JIRA Task does not exist (StopAndError)

- **Node Details:**  
  - **Invalid commit message**  
    - Type: StopAndError  
    - Stops workflow if commit message format or commands are missing or invalid.  
    - Input: False path from Check for task completed command.  
    - Sticky Note: Explains gatekeeping for valid commit messages.  

  - **JIRA Task does not exist**  
    - Also described above, stops workflow when Jira task is invalid.

---

### 3. Summary Table

| Node Name                          | Node Type          | Functional Role                            | Input Node(s)                   | Output Node(s)                                | Sticky Note                                                                                                     |
|-----------------------------------|--------------------|------------------------------------------|--------------------------------|-----------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| Webhook                           | Webhook            | Entry point, listens to GitHub push event | None                           | Commit Message Breakdown                       | Step 1: Webhook Activated! 🪝 Entry point for GitHub push events                                                |
| Commit Message Breakdown          | Code               | Parses commit message for Jira key & commands | Webhook                       | Check for PR commands                          | Step 2: The Decoder Ring 🧠 Parses commit message for key info                                                  |
| Check for PR commands             | If                 | Checks for `[auto-pr]` flag to decide PR creation | Commit Message Breakdown       | Get task details for PR / Check for task completed command | Step 3: To PR, or Not to PR? 🤔 Decides on PR creation                                                         |
| Get task details for PR           | Jira               | Fetches Jira task details for PR path    | Check for PR commands (true)   | Check if PR exists                             | Step 4: Task Intel Incoming! 🕵️‍♂️ Fetches Jira task details                                                    |
| Check if PR exists                | HTTP Request       | Queries GitHub to check if PR exists      | Get task details for PR        | Code                                          | Step 5: PR Radar Activated! 📡 Checks for existing PRs                                                          |
| Code                             | Code               | Processes PR existence response           | Check if PR exists             | Merge                                         | Step 6: PR Data Extractor 🧠📄 Formats PR existence response                                                    |
| Merge                            | Merge              | Merges PR existence data streams          | Code, Check whether a PR already exists | Request to create PR / Merge                   | Step 7: PR Data Merge Hub 🔗🧩 Merges PR data for consistent downstream input                                    |
| Check whether a PR already exists| If                 | Checks if PR already exists                | Merge                         | Request to create PR / Merge                   |                                                                                                                |
| Request to create PR             | HTTP Request       | Creates GitHub Pull Request                | Check whether a PR already exists (false) | Check if task exist                            | Step 8: Launch the PR! 🚀 Creates PR automatically                                                              |
| Check if task exist             | If                 | Checks if Jira task exists and taskcompleted flag | Request to create PR, Check whether a PR already exists (true) | Update task status after PR / JIRA Task does not exist   | Heads-Up Node: Something’s Missing! ⚠️ Error handling for missing Jira task or commands                          |
| Update task status after PR      | Jira               | Updates Jira task status post PR           | Check if task exist (true)     | Send message in slack with PR, Append a block in notion with PR | Step 7: Status Update Sent! 📬 Updates Jira task status after PR creation                                        |
| Send message in slack with PR    | Slack              | Sends Slack notification on PR creation   | Update task status after PR    |                                               | Step 8: Spread the Word! 📣 Sends Slack notification about PR and task update                                   |
| Append a block in notion with PR | Notion             | Logs PR creation and task update in Notion | Update task status after PR    |                                               | Step 8: Spread the Word! 📣 Logs update in Notion                                                              |
| Check for task completed command | If                 | Checks for `[taskcompleted]` flag to update Jira | Check for PR commands (false)  | Get Task Details without PR / Invalid commit message | Step 4: Task Completion Check ✅❓ Detects if task is marked completed                                            |
| Get Task Details without PR      | Jira               | Fetches Jira task details without PR      | Check for task completed command (true) | Check if task exists                           | Step 5: Task Hunt Begins! 🔍 Verifies Jira task existence                                                       |
| Check if task exists             | If                 | Checks Jira task existence and taskcompleted flag | Get Task Details without PR    | Update the task status without PR / JIRA Task does not exist |                                                                                                                |
| Update the task status without PR| Jira               | Updates Jira task status without PR creation | Check if task exists (true)    | Send message in slack without PR, Append a block in notion without PR | Step 6: Silent Status Update 🤫✅ Updates Jira without PR creation                                               |
| Send message in slack without PR | Slack              | Sends Slack notification on Jira update only | Update the task status without PR |                                               | Step 8: Spread the Word! 📣 Sends Slack notification about Jira task update                                     |
| Append a block in notion without PR| Notion           | Logs Jira task update in Notion            | Update the task status without PR |                                               | Step 8: Spread the Word! 📣 Logs Jira update in Notion                                                         |
| Invalid commit message           | StopAndError       | Stops workflow on invalid commit format or missing commands | Check for task completed command (false) |                                               | Halt! Invalid Commit Detected 🚫 Ensures only valid commits trigger automation                                  |
| JIRA Task does not exist         | StopAndError       | Stops workflow if Jira task not found or taskcompleted missing | Check if task exist (false), Check if task exists (false) |                                               | Heads-Up Node: Something’s Missing! ⚠️ Prevents updating non-existent Jira tasks                                |
| Sticky Notes (various)           | Sticky Note        | Documentation and explanation              | Various                       |                                               | Contains detailed explanations, setup instructions, and commit message guide                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `github-push`  
   - Options: Enable Raw Body  
   - Purpose: Listen to GitHub push events.  

2. **Add Code Node ("Commit Message Breakdown"):**  
   - Type: Code  
   - Run once per item  
   - JavaScript code: Parse first commit message from webhook payload using regex to extract Jira ticket key, commit description, commands (optional), and push branch.  
   - Validate presence of required elements. Throw error on invalid format.  

3. **Add If Node ("Check for PR commands"):**  
   - Condition: `autoPR` flag equals `true` (string comparison)  
   - True branch: proceed to PR creation path  
   - False branch: proceed to task completed check  

4. **Add Jira Node ("Get task details for PR"):**  
   - Operation: Get issue  
   - Issue Key: from parsed Jira key variable  
   - Used in PR creation path to fetch task details  

5. **Add HTTP Request Node ("Check if PR exists"):**  
   - Method: GET  
   - URL: `https://api.github.com/repos/{owner}/{repo}/pulls?head={owner}:{pushBranch}`  
   - Credentials: GitHub OAuth  
   - Purpose: Check for existing PRs on branch  

6. **Add Code Node ("Code") to process PR existence:**  
   - If no PR found, set `prExists` to false  
   - If PR found, attach PR data and set `prExists` to true  

7. **Add Merge Node ("Merge"):**  
   - Mode: Choose Branch  
   - Merge outputs from "Code" and "Check whether a PR already exists" nodes for unified PR info  

8. **Add If Node ("Check whether a PR already exists"):**  
   - Condition: `prExists` equals `true`  
   - True branch: skip PR creation  
   - False branch: create PR  

9. **Add HTTP Request Node ("Request to create PR"):**  
   - Method: POST  
   - URL: `https://api.github.com/repos/{owner}/{repo}/pulls`  
   - Body (JSON):  
     - title: concatenate Jira key and commit description  
     - head: push branch  
     - base: base branch from commit message flags  
     - body: auto-generated message referencing Jira task  
   - Credentials: GitHub OAuth  

10. **Add If Node ("Check if task exist"):**  
    - Conditions: Jira task exists AND `taskCompleted` is true  
    - True branch: update task status after PR  
    - False branch: stop with error  

11. **Add Jira Node ("Update task status after PR"):**  
    - Operation: Update issue  
    - Issue Key: Jira key  
    - Update Fields: statusId set to `61` ("Development Done")  

12. **Add Slack Node ("Send message in slack with PR"):**  
    - OAuth2 credentials for Slack  
    - Channel: configured channel ID  
    - Message: Notify PR creation and Jira update  

13. **Add Notion Node ("Append a block in notion with PR"):**  
    - Block ID: configured Notion page URL  
    - Append text block referencing PR creation and Jira update  

14. **Add If Node ("Check for task completed command"):**  
    - Condition: `taskCompleted` equals `true`  
    - True branch: get task details without PR  
    - False branch: invalid commit message stop  

15. **Add Jira Node ("Get Task Details without PR"):**  
    - Operation: Get issue  
    - Issue Key: Jira key from commit message  

16. **Add If Node ("Check if task exists"):**  
    - Conditions: Jira task exists AND `taskCompleted` is true  
    - True branch: update the task status without PR  
    - False branch: stop with error  

17. **Add Jira Node ("Update the task status without PR"):**  
    - Operation: Update issue  
    - Issue Key: Jira key  
    - Update Fields: statusId set to `61` ("Development Done")  

18. **Add Slack Node ("Send message in slack without PR"):**  
    - OAuth2 credentials for Slack  
    - Channel: configured channel ID  
    - Message: Notify Jira task status update only  

19. **Add Notion Node ("Append a block in notion without PR"):**  
    - Block ID: configured Notion page URL  
    - Append text block about Jira task update only  

20. **Add StopAndError Node ("Invalid commit message"):**  
    - Error message: "Workflow stopped due to invalid commit message or no commands provided"  
    - Connected to false branch of task completed command check  

21. **Add StopAndError Node ("JIRA Task does not exist"):**  
    - Error message: "Workflow stopped due to invalid task or no taskcompleted command"  
    - Connected to false branches of Jira task existence checks  

22. **Add Sticky Notes:**  
    - Add explanatory sticky notes near key nodes explaining purpose, usage, and setup instructions as per original workflow content.  

23. **Credentials Setup:**  
    - Configure GitHub OAuth credentials with repository access.  
    - Configure Jira API credentials with read/write permissions.  
    - Configure Slack OAuth credentials with chat permissions.  
    - Configure Notion credentials with page edit permissions.  

24. **GitHub Webhook Configuration:**  
    - Add the webhook URL generated by the Webhook node to each GitHub repository under Settings → Webhooks, listening for push events.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                   | Context or Link                          |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------|
| Welcome! To make this workflow yours, connect GitHub, Jira, Slack, and Notion credentials, and add the webhook URL to your repositories.                                                                                                                                                                                       | Sticky Note1 - Quick Setup Required     |
| The workflow entry point is a webhook listening to GitHub push events preventing manual triggers.                                                                                                                                                                                                                              | Sticky Note - Step 1                     |
| Commit message format must be: `TICKET-ID descriptive message [command1,command2,base-branch]` with commands like `[auto-pr]` and `[taskcompleted]`. Examples and automation triggers are detailed in Sticky Note17.                                                                                                               | Sticky Note17 - Commit Message Command Guide |
| The workflow prevents duplicate PR creation by querying GitHub before making a PR.                                                                                                                                                                                                                                              | Sticky Note5 and Sticky Note6            |
| The workflow updates Jira task status only if the `[taskcompleted]` command is present and Jira task exists.                                                                                                                                                                                                                   | Sticky Note13 and Sticky Note15         |
| Notifications are sent to Slack and logged in Notion for transparency and asynchronous tracking.                                                                                                                                                                                                                                | Sticky Note16 and Sticky Note11         |
| If the commit message is invalid or Jira task does not exist, the workflow stops to avoid erroneous automation.                                                                                                                                                                                                                | Sticky Note12 and Sticky Note10         |
| For detailed commit message command examples and their effects, see Sticky Note17, which provides a comprehensive remote control guide for automation.                                                                                                                                                                       | Sticky Note17                           |

---

**Disclaimer:**  
The content provided is exclusively from an automated workflow created with n8n, respecting all current content policies and containing no illegal or protected elements. All data processed are legal and public.

---