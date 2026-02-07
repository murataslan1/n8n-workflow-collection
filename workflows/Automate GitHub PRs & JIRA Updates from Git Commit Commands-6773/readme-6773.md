Automate GitHub PRs & JIRA Updates from Git Commit Commands

https://n8nworkflows.xyz/workflows/automate-github-prs---jira-updates-from-git-commit-commands-6773


# Automate GitHub PRs & JIRA Updates from Git Commit Commands

### 1. Workflow Overview

This workflow automates the integration between GitHub Pull Requests (PRs) and JIRA task management based on commands embedded in Git commit messages. Its primary use case is to streamline developer operations by triggering PR creation and updating JIRA task statuses automatically when specific command patterns are detected in commit messages.

The workflow is logically divided into the following blocks:

- **1.1 GitHub Commit Reception:** Listens for GitHub events (commits) and extracts relevant command information from commit messages.
- **1.2 Command Parsing & Validation:** Analyzes commit messages to identify commands related to PR creation or task completion.
- **1.3 JIRA Task Verification & Details Fetch:** Checks for the existence of referenced JIRA tasks and retrieves their details.
- **1.4 PR Existence Check & Creation:** Determines whether a PR already exists for the task and creates one if necessary.
- **1.5 JIRA Task Status Update:** Updates the status of the JIRA task based on the PR or task completion commands.
- **1.6 Error Handling:** Stops execution with error messages for invalid commit messages or non-existent JIRA tasks.

---

### 2. Block-by-Block Analysis

#### 1.1 GitHub Commit Reception

- **Overview:**  
  This block triggers on GitHub push events and initiates the workflow by extracting commit message data for further processing.

- **Nodes Involved:**  
  - GitHub Trigger  
  - Commit Message Breakdown

- **Node Details:**  
  - **GitHub Trigger**  
    - Type: `githubTrigger`  
    - Configuration: Listens to GitHub webhook events for repository push activity. Automatically configured webhook ID present.  
    - Inputs: Webhook trigger event from GitHub.  
    - Outputs: Emits commit data for downstream processing.  
    - Edge cases: Webhook misconfiguration, permission errors, or delayed events could cause missed triggers.  
  - **Commit Message Breakdown**  
    - Type: `code` node  
    - Configuration: Parses commit messages to extract commands and relevant tokens (e.g., task IDs, PR commands).  
    - Inputs: Commits data from GitHub Trigger.  
    - Outputs: Parsed command data passed to conditional checks.  
    - Edge cases: Parsing errors if commit message format deviates from expected pattern.

#### 1.2 Command Parsing & Validation

- **Overview:**  
  Determines if commit messages contain PR creation commands or task completion commands, directing the workflow accordingly.

- **Nodes Involved:**  
  - Check for PR commands (If)  
  - Check for task completed command (If)  
  - Invalid commit message (Stop and Error)

- **Node Details:**  
  - **Check for PR commands**  
    - Type: `if` node  
    - Configuration: Evaluates parsed commit message for PR command presence.  
    - Inputs: Parsed data from Commit Message Breakdown.  
    - Outputs: Branches to JIRA task retrieval if PR command detected; else to task completion check.  
    - Edge cases: False negatives if command keywords are misspelled or formatted incorrectly.  
  - **Check for task completed command**  
    - Type: `if` node  
    - Configuration: Checks commit message for a command indicating task completion.  
    - Inputs: From “Check for PR commands” negative branch.  
    - Outputs: Leads to task details retrieval or stops workflow with invalid message error.  
  - **Invalid commit message**  
    - Type: `stopAndError` node  
    - Configuration: Terminates workflow with error if no valid command is found.  
    - Inputs: From “Check for task completed command” negative branch.

#### 1.3 JIRA Task Verification & Details Fetch

- **Overview:**  
  Confirms whether the referenced JIRA task exists and retrieves task details to inform subsequent PR and status update actions.

- **Nodes Involved:**  
  - Get task details for PR (JIRA node)  
  - Get Task Details without PR (JIRA node)  
  - Check if task exists (If)  
  - Check if task exist (If)

- **Node Details:**  
  - **Get task details for PR**  
    - Type: `jira` node  
    - Configuration: Queries JIRA API for task details using extracted task ID from commit message.  
    - Inputs: From “Check for PR commands” positive branch.  
    - Outputs: Task details forwarded to PR existence check.  
    - Edge cases: Authentication issues, invalid task ID, JIRA API downtime.  
  - **Get Task Details without PR.**  
    - Type: `jira` node  
    - Configuration: Similar to above but for tasks referenced without PR commands.  
    - Inputs: From “Check for task completed command” positive branch.  
    - Outputs: Sent to task existence verification.  
  - **Check if task exists**  
    - Type: `if` node  
    - Configuration: Checks if JIRA returned task details (i.e., task exists).  
    - Inputs: From “Get Task Details without PR.”  
    - Outputs: Leads to task update or error handling.  
  - **Check if task exist**  
    - Type: `if` node  
    - Configuration: Same as above but for PR-related task detail retrieval.  
    - Inputs: From “Get task details for PR” and “Check whether a PR already exists”.  
    - Outputs: Advances workflow or triggers error node.

#### 1.4 PR Existence Check & Creation

- **Overview:**  
  Checks if a PR already exists for the JIRA task and requests creation if none exists.

- **Nodes Involved:**  
  - Check if PR exists (HTTP Request)  
  - Check whether a PR already exists (If)  
  - Request to create PR (HTTP Request)

- **Node Details:**  
  - **Check if PR exists**  
    - Type: `httpRequest` node  
    - Configuration: Calls GitHub API to determine if a PR associated with the task exists.  
    - Inputs: From “Get task details for PR”.  
    - Outputs: Leads to conditional node to decide next steps.  
    - Edge cases: API rate limits, network errors, invalid authentication.  
  - **Check whether a PR already exists**  
    - Type: `if` node  
    - Configuration: Evaluates response from PR existence check.  
    - Inputs: From “Check if PR exists”.  
    - Outputs: Proceeds to update task status if PR exists or creates a PR if not.  
  - **Request to create PR**  
    - Type: `httpRequest` node  
    - Configuration: Sends POST request to GitHub API to create a PR based on information from the commit and JIRA task.  
    - Inputs: From “Check whether a PR already exists” negative branch.  
    - Outputs: Verifies task existence post-creation.

#### 1.5 JIRA Task Status Update

- **Overview:**  
  Updates JIRA task status based on PR creation or task completion commands, ensuring task states are synchronized with development progress.

- **Nodes Involved:**  
  - Update task status after PR (JIRA node)  
  - Update the task status without PR (JIRA node)

- **Node Details:**  
  - **Update task status after PR**  
    - Type: `jira` node  
    - Configuration: Changes JIRA task status to reflect PR-related progression (e.g., “In Review”).  
    - Inputs: From “Check if task exist” positive branch.  
    - Outputs: Workflow completion or next steps.  
    - Edge cases: Permission errors, invalid transition states.  
  - **Update the task status without PR**  
    - Type: `jira` node  
    - Configuration: Updates task status for tasks completed without PR creation.  
    - Inputs: From “Check if task exists” positive branch.  
    - Outputs: Workflow completion.  
    - Edge cases: Same as above.

#### 1.6 Error Handling

- **Overview:**  
  Stops the workflow and raises errors when invalid commit messages are detected or when referenced JIRA tasks do not exist.

- **Nodes Involved:**  
  - Invalid commit message (Stop and Error)  
  - JIRA Task does not exist (Stop and Error)

- **Node Details:**  
  - **Invalid commit message**  
    - Type: `stopAndError` node  
    - Configuration: Stops execution with error message for unrecognized commit commands.  
    - Inputs: From “Check for task completed command” false branch.  
  - **JIRA Task does not exist**  
    - Type: `stopAndError` node  
    - Configuration: Terminates workflow if JIRA task is not found during verification steps.  
    - Inputs: From negative branches of “Check if task exist” and “Check if task exists”.

---

### 3. Summary Table

| Node Name                      | Node Type          | Functional Role                                | Input Node(s)                   | Output Node(s)                           | Sticky Note |
|-------------------------------|--------------------|------------------------------------------------|--------------------------------|----------------------------------------|-------------|
| Github Trigger                | githubTrigger       | Receives GitHub commit events                   | —                              | Commit Message Breakdown                |             |
| Commit Message Breakdown      | code                | Parses commit messages for commands             | Github Trigger                 | Check for PR commands                   |             |
| Check for PR commands         | if                  | Checks for PR command in commit message         | Commit Message Breakdown       | Get task details for PR, Check for task completed command |             |
| Get task details for PR       | jira                | Retrieves JIRA task details for PR commands     | Check for PR commands          | Check if PR exists                      |             |
| Check if PR exists            | httpRequest         | Checks if PR already exists on GitHub           | Get task details for PR        | Check whether a PR already exists       |             |
| Check whether a PR already exists | if              | Branches based on PR existence                   | Check if PR exists             | Check if task exist, Request to create PR |             |
| Check if task exist           | if                  | Confirms JIRA task existence after PR check     | Check whether a PR already exists, Request to create PR | Update task status after PR, JIRA Task does not exist |             |
| Request to create PR          | httpRequest         | Creates PR on GitHub                             | Check whether a PR already exists | Check if task exist                   |             |
| Update task status after PR   | jira                | Updates JIRA task status after PR creation      | Check if task exist            | —                                      |             |
| Check for task completed command | if               | Checks for task completion command in commit    | Check for PR commands          | Get Task Details without PR, Invalid commit message |             |
| Get Task Details without PR.  | jira                | Retrieves JIRA task details without PR commands | Check for task completed command | Check if task exists                   |             |
| Check if task exists          | if                  | Confirms JIRA task existence without PR         | Get Task Details without PR.   | Update the task status without PR, JIRA Task does not exist |             |
| Update the task status without PR | jira            | Updates JIRA task status without PR             | Check if task exists           | —                                      |             |
| Invalid commit message        | stopAndError        | Stops workflow on invalid commit message        | Check for task completed command | —                                    |             |
| JIRA Task does not exist      | stopAndError        | Stops workflow if JIRA task not found            | Check if task exist, Check if task exists | —                                    |             |
| Sticky Note                  | stickyNote          | —                                                | —                              | —                                      |             |
| Sticky Note1                 | stickyNote          | —                                                | —                              | —                                      |             |
| Sticky Note2                 | stickyNote          | —                                                | —                              | —                                      |             |
| Sticky Note3                 | stickyNote          | —                                                | —                              | —                                      |             |
| Sticky Note4                 | stickyNote          | —                                                | —                              | —                                      |             |
| Sticky Note9                 | stickyNote          | —                                                | —                              | —                                      |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create GitHub Trigger node**  
   - Type: `githubTrigger`  
   - Configure to listen for Push events on your repository.  
   - Ensure webhook URL is registered in GitHub repo settings with proper permissions.

2. **Add Code node “Commit Message Breakdown”**  
   - Type: `code`  
   - Configure the code to parse the incoming commit messages from the GitHub Trigger webhook payload.  
   - Extract commands such as PR creation requests and task IDs (e.g., JIRA issue keys).

3. **Add If node “Check for PR commands”**  
   - Type: `if`  
   - Set conditions to detect if commit message contains PR creation commands (e.g., keywords like “create PR”).  
   - Connect input from “Commit Message Breakdown”.

4. **Add JIRA node “Get task details for PR”**  
   - Type: `jira`  
   - Configure with credentials to query JIRA API for the issue key parsed from commit message.  
   - Connect from “Check for PR commands” positive branch.

5. **Add HTTP Request node “Check if PR exists”**  
   - Type: `httpRequest`  
   - Configure to call GitHub API to check if a PR related to the task already exists (e.g., search PRs by branch or issue key in title).  
   - Connect from “Get task details for PR”.

6. **Add If node “Check whether a PR already exists”**  
   - Type: `if`  
   - Evaluate HTTP response to decide if PR exists.  
   - Connect from “Check if PR exists”.

7. **Add If node “Check if task exist”**  
   - Type: `if`  
   - Confirm that task details were successfully retrieved from JIRA.  
   - Connect from “Check whether a PR already exists” positive branch and also from “Request to create PR” (next step).

8. **Add HTTP Request node “Request to create PR”**  
   - Type: `httpRequest`  
   - Configure to create a PR on GitHub using the relevant branch and task information.  
   - Connect from “Check whether a PR already exists” negative branch.

9. **Add JIRA node “Update task status after PR”**  
   - Type: `jira`  
   - Configure to update JIRA task workflow status to reflect PR creation (e.g., “In Review”).  
   - Connect from “Check if task exist” positive branch.

10. **Add If node “Check for task completed command”**  
    - Type: `if`  
    - Check if commit message contains commands indicating task completion.  
    - Connect from “Check for PR commands” negative branch.

11. **Add JIRA node “Get Task Details without PR.”**  
    - Type: `jira`  
    - Retrieve task details for completion command.  
    - Connect from “Check for task completed command” positive branch.

12. **Add If node “Check if task exists”**  
    - Type: `if`  
    - Confirm task presence in JIRA.  
    - Connect from “Get Task Details without PR.”.

13. **Add JIRA node “Update the task status without PR”**  
    - Type: `jira`  
    - Update task status to reflect task completion.  
    - Connect from “Check if task exists” positive branch.

14. **Add Stop and Error node “Invalid commit message”**  
    - Type: `stopAndError`  
    - Configure with error message like “Invalid commit message command”.  
    - Connect from “Check for task completed command” negative branch.

15. **Add Stop and Error node “JIRA Task does not exist”**  
    - Type: `stopAndError`  
    - Configure with error message like “JIRA Task does not exist”.  
    - Connect from negative branches of “Check if task exist” and “Check if task exists”.

16. **Credential Setup:**  
    - Configure GitHub OAuth credentials for `githubTrigger` and HTTP Request nodes interacting with GitHub API.  
    - Configure JIRA credentials (API token or OAuth) for all `jira` nodes.

17. **Connections:**  
    - Connect nodes according to the logic paths described above, ensuring correct branching for both PR and task completion commands.

18. **Testing:**  
    - Test with commit messages containing both valid and invalid commands.  
    - Verify PR creation, JIRA task updates, and error handling.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                      |
|-------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| This workflow requires GitHub and JIRA API credentials with sufficient permissions.             | Credential configuration for GitHub and JIRA nodes.|
| Proper commit message formatting with recognizable commands is critical for workflow success.   | Usage instruction for commit message conventions.  |
| Rate limits on GitHub API and JIRA API may affect workflow execution under high load conditions.| API limitations awareness.                           |
| For advanced customization, review GitHub and JIRA API documentation:                           | https://docs.github.com/en/rest, https://developer.atlassian.com/cloud/jira/platform/rest/v3/ |
| Consider adding retry/error handling logic for API calls to improve robustness.                 | Workflow enhancement suggestion.                     |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.