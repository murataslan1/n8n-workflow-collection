Automate GitHub Issue Assignments via Comment Commands

https://n8nworkflows.xyz/workflows/automate-github-issue-assignments-via-comment-commands-5004


# Automate GitHub Issue Assignments via Comment Commands

### 1. Workflow Overview

This n8n workflow automates the assignment of GitHub issues based on user comments containing the phrase "assign me." It listens for two key GitHub events: new issue creation and new comments on issues. The workflow parses these events to determine whether an issue is unassigned and if the requester wants to be assigned. It then assigns the issue accordingly or adds a comment if the issue is already assigned.

The workflow is logically divided into these blocks:
- **1.1 Input Reception:** Trigger node listens to GitHub webhook events for issues and issue comments.
- **1.2 Event Type Switch:** Determines if the event is a new issue or a comment.
- **1.3 New Issue Assignment Check:** For newly opened issues, checks if there is no assignee and if the issue body contains the command phrase.
- **1.4 Comment Command Check:** For issue comments, checks if the comment contains the command phrase.
- **1.5 Assignment Decision:** Checks if the issue is unassigned before assigning the commenter.
- **1.6 Assignment Execution:** Assigns the issue creator or commenter and applies an "assigned" label.
- **1.7 Feedback Commenting:** Adds a comment if the issue already has an assignee.
- **1.8 No Operation Nodes:** Gracefully ends branches where no action is needed.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Listens for GitHub issue and issue comment events to trigger the workflow.
- **Nodes Involved:** `Github Trigger1`
- **Node Details:**
  - Type: GitHub Trigger
  - Configuration: Listens to "issues" and "issue_comment" events on a specified owner/repository.
  - Authentication: OAuth2 via GitHub Personal Credentials.
  - Input: GitHub webhook events.
  - Output: Event JSON with payload of issue or comment data.
  - Potential Failures: Webhook misconfiguration, authentication errors, rate limiting by GitHub.
  - Notes: This node is the sole entry point for the workflow.

#### 2.2 Event Type Switch

- **Overview:** Routes the workflow based on the event action type - either newly opened/created issues or comments.
- **Nodes Involved:** `Switch`
- **Node Details:**
  - Type: Switch node to evaluate string conditions.
  - Configuration: Checks if `body.action` equals "opened" or "created" (indicating new issue or comment).
  - Input: Output from `Github Trigger1`.
  - Output Connections:
    - Output 1: For "opened" or "created" actions → new issues.
    - Output 2 (default): Other actions (not used here).
  - Edge Cases: Unexpected or unsupported GitHub event actions may lead to no output.
  - Version Notes: Standard Switch node, no special version requirements.

#### 2.3 New Issue Assignment Check

- **Overview:** Checks if a newly opened issue has no assignee and if its body contains the phrase "assign me".
- **Nodes Involved:** `IF no assignee?`
- **Node Details:**
  - Type: If node for combined numeric and regex condition.
  - Configuration:
    - Condition 1: Number of assignees equals zero.
    - Condition 2: Issue body matches regex `/[a,A]ssign[\w*\s*]*me/gm` to detect "assign me" phrase.
  - Input: Output from `Switch` node (new issues).
  - Output:
    - True: Issue creator should be assigned.
    - False: No action.
  - Edge Cases: Regex failing due to unexpected text encoding; issues with missing `assignees` array.
  - Potential Failures: Null or malformed JSON fields.

#### 2.4 Comment Command Check

- **Overview:** Checks if a comment contains the phrase "assign me".
- **Nodes Involved:** `IF wants to work?`
- **Node Details:**
  - Type: If node with regex string condition.
  - Configuration: Checks if comment body matches `/[a,A]ssign[\w*\s*]*me/gm`.
  - Input: Output from `Switch` node (comments).
  - Output:
    - True: Proceed to check if issue is unassigned.
    - False: No action.
  - Edge Cases: Comments with variations of the phrase; encoding issues.
  - Potential Failures: Missing comment body in payload.

#### 2.5 Assignment Decision

- **Overview:** For comments requesting assignment, checks if the issue still has no assignee.
- **Nodes Involved:** `IF not assigned?`
- **Node Details:**
  - Type: If node numeric condition.
  - Configuration: Checks if the number of assignees on the issue equals zero.
  - Input: True output from `IF wants to work?`.
  - Output:
    - True: Assign commenter.
    - False: Add feedback comment.
  - Edge Cases: Race conditions where assignment state changes during workflow execution.
  - Failures: Missing or malformed assignee data.

#### 2.6 Assignment Execution

- **Overview:** Assigns the issue creator or commenter and adds an "assigned" label to the issue.
- **Nodes Involved:** `Assign Issue Creator`, `Assign Commenter`
- **Node Details:**
  - Type: GitHub node (edit issue operation).
  - Configuration:
    - Owner and repository dynamically set from incoming webhook data.
    - Operation: Edit issue with updated assignees and add label "assigned".
    - Assignee:
      - `Assign Issue Creator`: assigns the issue's user (creator).
      - `Assign Commenter`: assigns the comment's author.
    - Authentication: OAuth2 credentials for GitHub.
  - Input:
    - `Assign Issue Creator`: from `IF no assignee?` true output.
    - `Assign Commenter`: from `IF not assigned?` true output.
  - Outputs: Updated issue with assignment.
  - Edge Cases: Permission denied errors if OAuth token lacks repo write permissions; rate limiting.
  - Failures: API errors, invalid assignee usernames.

#### 2.7 Feedback Commenting

- **Overview:** Posts a comment informing the requester that the issue is already assigned to someone else.
- **Nodes Involved:** `Add Comment`
- **Node Details:**
  - Type: GitHub node (create comment operation).
  - Configuration:
    - Owner, repo, and issue number from webhook data.
    - Comment body dynamically mentions the commenter and current assignee.
    - Authentication: OAuth2 GitHub credentials.
  - Input: `IF not assigned?` false output.
  - Edge Cases: Assignee data missing or multiple assignees.
  - Failures: API rate limits, permission issues.

#### 2.8 No Operation Nodes

- **Overview:** Placeholder nodes where no action is required.
- **Nodes Involved:** `No Operation, do nothing`, `No Operation, do nothing1`
- **Node Details:**
  - Type: NoOp nodes that simply terminate branches gracefully.
  - Configuration: No parameters.
  - Inputs: False branches from `IF no assignee?` and `IF wants to work?`.
  - Purpose: Avoid workflow errors when no action is needed.

---

### 3. Summary Table

| Node Name              | Node Type           | Functional Role                           | Input Node(s)         | Output Node(s)              | Sticky Note                                                                                                                       |
|------------------------|---------------------|-----------------------------------------|-----------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Github Trigger1         | GitHub Trigger      | Listens for GitHub issues & comments    | (Trigger)             | Switch                      | Setup Guide: Set OAuth2 credentials; listen to your owner/repo; triggers on "issues" and "issue_comment" events.                |
| Switch                 | Switch              | Routes event by action type              | Github Trigger1       | IF no assignee?, IF wants to work? | Checks if event action is "opened" or "created" to differentiate new issues from comments.                                       |
| IF no assignee?         | If                  | Checks new issue for no assignee & command phrase | Switch (new issue)    | Assign Issue Creator, No Operation, do nothing | Checks if issue body includes "assign me" and no assignees are set.                                                              |
| Assign Issue Creator    | GitHub              | Assigns issue creator + adds label "assigned" | IF no assignee?       |                             | Automatically assigns the issue creator when conditions met.                                                                     |
| No Operation, do nothing| NoOp                | Ends branch with no action needed       | IF no assignee?       |                             |                                                                                                                                |
| IF wants to work?       | If                  | Checks if comment contains "assign me" | Switch (comments)     | IF not assigned?, No Operation, do nothing1 | Checks if commenter wants to be assigned by detecting "assign me" phrase.                                                       |
| IF not assigned?        | If                  | Checks if issue has no assignees         | IF wants to work?     | Assign Commenter, Add Comment | If issue unassigned, assign commenter; else add feedback comment.                                                                |
| Assign Commenter        | GitHub              | Assigns commenter + adds "assigned" label | IF not assigned?      |                             | Assigns the user who commented "assign me" if issue is unassigned.                                                               |
| Add Comment             | GitHub              | Posts comment that issue is already assigned | IF not assigned?      |                             | Comments to notify the commenter that the issue is already assigned to someone else.                                              |
| No Operation, do nothing1| NoOp                | Ends branch with no action needed       | IF wants to work?     |                             |                                                                                                                                |
| Sticky Note             | Sticky Note         | Workflow explanation and setup guide    |                       |                             | Contains detailed workflow explanation, setup instructions, and usage notes.                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create GitHub Trigger Node**
   - Type: GitHub Trigger
   - Parameters:
     - Owner: Your GitHub username or organization name.
     - Repository: Target repository name.
     - Events: Select "issues" and "issue_comment".
   - Authentication: Configure OAuth2 with GitHub Personal Credentials having repo access.
   - Position: Initial trigger.

2. **Add Switch Node**
   - Type: Switch
   - Parameters:
     - Value1: Expression `{{$json["body"]["action"]}}`
     - Rules:
       - Rule 1: Equals "opened"
       - Rule 2: Equals "created"
   - Connect GitHub Trigger output to Switch input.

3. **Add If Node "IF no assignee?"**
   - Type: If
   - Conditions:
     - Number Condition:
       - Value1: `{{$json["body"]["issue"]["assignees"].length}}`
       - Operation: equals
       - Value2: 0
     - String Condition:
       - Value1: `{{$json["body"]["issue"]["body"]}}`
       - Operation: regex
       - Value2: `/[a,A]ssign[\w*\s*]*me/gm`
   - Connect Switch output for "opened" to this node.

4. **Add GitHub Node "Assign Issue Creator"**
   - Type: GitHub
   - Operation: Edit issue
   - Parameters:
     - Owner: `{{$node["Switch"].json["body"]["repository"]["owner"]["login"]}}`
     - Repository: `{{$node["Switch"].json["body"]["repository"]["name"]}}`
     - Issue Number: `{{$json["body"]["issue"]["number"]}}`
     - Edit Fields:
       - Labels: ["assigned"]
       - Assignees: `{{$json.body.issue["user"]["login"]}}`
   - Authentication: OAuth2 with GitHub credentials.
   - Connect "IF no assignee?" true output here.

5. **Add No Operation Node "No Operation, do nothing"**
   - Type: NoOp
   - Connect "IF no assignee?" false output here.

6. **Add If Node "IF wants to work?"**
   - Type: If
   - Condition:
     - String:
       - Value1: `{{$json["body"]["comment"]["body"]}}`
       - Operation: regex
       - Value2: `/[a,A]ssign[\w*\s*]*me/gm`
   - Connect Switch output for "created" to this node.

7. **Add If Node "IF not assigned?"**
   - Type: If
   - Condition:
     - Number:
       - Value1: `{{$json["body"]["issue"]["assignees"].length}}`
       - Operation: equals
       - Value2: 0
   - Connect "IF wants to work?" true output here.

8. **Add GitHub Node "Assign Commenter"**
   - Type: GitHub
   - Operation: Edit issue
   - Parameters:
     - Owner: `{{$json["body"]["repository"]["owner"]["login"]}}`
     - Repository: `{{$json["body"]["repository"]["name"]}}`
     - Issue Number: `{{$json["body"]["issue"]["number"]}}`
     - Edit Fields:
       - Labels: ["assigned"]
       - Assignees: `{{$json["body"]["comment"]["user"]["login"]}}`
   - Authentication: OAuth2 with GitHub credentials.
   - Connect "IF not assigned?" true output here.

9. **Add GitHub Node "Add Comment"**
   - Type: GitHub
   - Operation: Create comment
   - Parameters:
     - Owner: `{{$json["body"]["repository"]["owner"]["login"]}}`
     - Repository: `{{$json["body"]["repository"]["name"]}}`
     - Issue Number: `{{$json["body"]["issue"]["number"]}}`
     - Body:  
       ```
       Hey @{{$json["body"]["comment"]["user"]["login"]}},

       This issue is already assigned to {{$json["body"]["issue"]["assignee"]["login"]}} 🙂
       ```
   - Authentication: OAuth2 with GitHub credentials.
   - Connect "IF not assigned?" false output here.

10. **Add No Operation Node "No Operation, do nothing1"**
    - Type: NoOp
    - Connect "IF wants to work?" false output here.

11. **Connect all nodes according to the logical flow:**
    - GitHub Trigger → Switch
    - Switch → IF no assignee? (new issues)
    - IF no assignee? → Assign Issue Creator (true), No Operation (false)
    - Switch → IF wants to work? (comments)
    - IF wants to work? → IF not assigned? (true), No Operation (false)
    - IF not assigned? → Assign Commenter (true), Add Comment (false)

12. **Activate Workflow**
    - Ensure all GitHub OAuth credentials have necessary permissions.
    - Enable the workflow.
    - Test by creating issues or comments containing "assign me."

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                   | Context or Link                                                                                               |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Automates GitHub triage by assigning issues or comment-based requests automatically, improving team workflow and fairness.                                                    | Workflow purpose                                                                                              |
| Setup Guide inside sticky note: clone/import JSON, configure OAuth2, enable workflow, test with "assign me" in issues/comments.                                               | Sticky note content                                                                                           |
| Optional tweaks include changing trigger events, adjusting regex for different commands, or adding notifications via Slack/email upon assignment.                            | Enhancement suggestions                                                                                       |
| OAuth2 authentication must have repo write permissions to modify issues and comments.                                                                                          | Credential requirement                                                                                        |
| GitHub API rate limiting and permission errors are common failure points; handle with appropriate retries or notifications if extended usage expected.                         | Error handling considerations                                                                                 |
| Regex used: `/[a,A]ssign[\w*\s*]*me/gm` detects various forms like "Assign me", "assign me", or "assignme". Can be customized for other phrases.                              | Regex detail                                                                                                |
| Workflow is inactive by default; activate only after proper credential configuration to avoid missed events or workflow failures.                                            | Workflow activation note                                                                                      |

---

**Disclaimer:** The provided documentation is based exclusively on an automated workflow created with n8n, respecting all current content policies and handling only legal, public data.