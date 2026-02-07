Auto-resolve Jira Tickets with GitHub Copilot using Port Context

https://n8nworkflows.xyz/workflows/auto-resolve-jira-tickets-with-github-copilot-using-port-context-11728


# Auto-resolve Jira Tickets with GitHub Copilot using Port Context

### 1. Workflow Overview

This workflow automates the resolution process of Jira tickets by leveraging contextual data from Port.io and coding agents such as GitHub Copilot. When a Jira issue is updated to an "In Progress" status with specific labels, the workflow extracts relevant operational context from Port, creates a corresponding GitHub issue with a clear title and developer-friendly description, and then assigns the issue to Copilot for coding assistance. Finally, it links the newly created GitHub issue back to the original Jira ticket and marks the ticket as assigned to avoid duplication.

The workflow logic is organized into the following blocks:

- **1.1 Jira Event Reception:** Listens for Jira issue update events and filters issues ready for automated assignment.
- **1.2 Context Extraction from Port:** Queries the Port.io catalog to extract relevant contextual information related to the Jira issue.
- **1.3 GitHub Issue Creation:** Parses the AI-generated response to create a GitHub issue with a proper title and body.
- **1.4 Copilot Assignment:** Adds a comment to the GitHub issue requesting GitHub Copilot to take ownership and begin working.
- **1.5 Jira Ticket Update:** Adds a comment linking the GitHub issue back to the Jira ticket and marks the ticket as assigned to Copilot.

---

### 2. Block-by-Block Analysis

#### 2.1 Jira Event Reception

- **Overview:**  
  This block listens for Jira issue update events and determines if the issue meets criteria for automated processing (status "In Progress", label "product_approved", not yet labeled "copilot_assigned").

- **Nodes Involved:**  
  - `On Jira ticket updated`  
  - `Is ready for assignment?`

- **Node Details:**

  - **On Jira ticket updated**  
    - *Type:* Jira Trigger node  
    - *Role:* Entry point that listens for `jira:issue_updated` webhook events from Jira Cloud.  
    - *Configuration:* Monitors all issue update events; uses Jira Cloud credentials.  
    - *Input/Output:* No input; outputs JSON representing the Jira event payload.  
    - *Potential Failures:* Webhook misconfiguration, auth errors, event filtering issues.

  - **Is ready for assignment?**  
    - *Type:* IF node  
    - *Role:* Filters incoming Jira update events to only proceed if the issue is moved to "In Progress", has the label `product_approved`, and does not already have the label `copilot_assigned`.  
    - *Key Expression:*  
      ```js
      $json.webhookEvent == "jira:issue_updated" &&
      $json.issue.fields.status.name == "In Progress" &&
      $json.issue.fields.labels.includes("product_approved") &&
      !$json.issue.fields.labels.includes("copilot_assigned")
      ```  
    - *Input:* Output from Jira Trigger node.  
    - *Output:* Routes "true" path to context extraction; "false" terminates processing.  
    - *Potential Failures:* Expression errors if fields missing, edge cases if labels or status change format.

---

#### 2.2 Context Extraction from Port

- **Overview:**  
  Queries Port.io’s catalog to extract only contextual information relevant to the Jira issue, including services, repositories, teams, documentation, cloud resources, and dependencies, forming a concise JSON output with a GitHub issue title and body.

- **Nodes Involved:**  
  - `Extract context from Port`  
  - `Parse Port AI response`

- **Node Details:**

  - **Extract context from Port**  
    - *Type:* Custom Port.io node (`CUSTOM.portIo`)  
    - *Role:* Sends a general AI invocation request to Port’s API using a prompt that summarizes the Jira issue and instructs to extract relevant context and create a GitHub issue title and body in a strict JSON format.  
    - *Key Configuration:*  
      - Tools filter: regex matching tools with names like `list`, `get`, `search`, `track`, `describe`  
      - Model: GPT-5 (Port’s internal AI model)  
      - System Prompt: "You are a helpful assistant"  
      - User Prompt: Detailed multi-line prompt with instructions to return only JSON with `github_issue_title` and `github_issue_body`.  
    - *Credentials:* Port.io API key.  
    - *Input:* JSON from Jira IF node with Jira issue details.  
    - *Output:* AI response containing JSON with GitHub issue title and body as a string.  
    - *Potential Failures:* API auth errors, prompt misformatting, response parsing failures, empty or malformed AI output.

  - **Parse Port AI response**  
    - *Type:* Custom Port.io node (`CUSTOM.portIo`)  
    - *Role:* Retrieves invocation results from Port AI using the invocation identifier from the previous node’s output.  
    - *Configuration:* Operation `getInvocation` using the `invocationIdentifier` from the previous response to fetch the final AI output.  
    - *Input:* Output from `Extract context from Port`.  
    - *Output:* Parsed AI response JSON.  
    - *Potential Failures:* Invocation ID missing or invalid, API errors, timeout waiting for response.

---

#### 2.3 GitHub Issue Creation

- **Overview:**  
  Uses the parsed AI response to create a GitHub issue in the specified repository with the generated title and body.

- **Nodes Involved:**  
  - `Create a GitHub issue`  
  - `Is issue creation successful?`

- **Node Details:**

  - **Create a GitHub issue**  
    - *Type:* GitHub node  
    - *Role:* Creates a new issue in a GitHub repository.  
    - *Key Configuration:*  
      - Owner: Organization URL (dynamic)  
      - Repository: Target repo (dynamic)  
      - Title: Parsed from AI JSON output’s `github_issue_title`  
      - Body: Parsed from AI JSON output’s `github_issue_body`  
      - Labels: `n8n`, `ai-workflow`  
      - Assignees: None initially  
    - *Credentials:* GitHub OAuth2.  
    - *Input:* Parsed JSON from Port AI response.  
    - *Output:* GitHub issue metadata including issue number.  
    - *Potential Failures:* GitHub API rate limits, auth errors, malformed title/body.

  - **Is issue creation successful?**  
    - *Type:* IF node  
    - *Role:* Checks if the GitHub issue creation returned a valid issue number (non-empty).  
    - *Key Expression:*  
      ```js
      $json.number !== ""
      ```  
    - *Input:* Output from GitHub issue creation node.  
    - *Output:* If true, proceeds to assign Copilot; else, stops.  
    - *Potential Failures:* Missing number in response, API inconsistencies.

---

#### 2.4 Copilot Assignment

- **Overview:**  
  Adds a comment to the newly created GitHub issue tagging Copilot and requesting it to take ownership and begin working on the issue.

- **Nodes Involved:**  
  - `Assign issue to Copilot`

- **Node Details:**

  - **Assign issue to Copilot**  
    - *Type:* GitHub node  
    - *Role:* Creates a comment on the GitHub issue with a message tagging `@copilot` to take ownership.  
    - *Key Configuration:*  
      - Owner and repository dynamic as in previous GitHub node  
      - Issue Number: Taken from the created GitHub issue node’s output  
      - Comment Body:  
        ```
        @copilot please take ownership of this issue and begin working on a solution.

        Use the information in the issue body and title to propose and implement the necessary code changes.
        ```  
    - *Credentials:* GitHub OAuth2.  
    - *Input:* GitHub issue number from issue creation.  
    - *Output:* Comment creation confirmation.  
    - *Potential Failures:* Comment rate limits, auth errors, issue number mismatch.

---

#### 2.5 Jira Ticket Update

- **Overview:**  
  Links the created GitHub issue back to the original Jira ticket by posting a comment, and marks the Jira issue with the label `copilot_assigned` to indicate automated handling.

- **Nodes Involved:**  
  - `Add issue link to Jira ticket`  
  - `Mark ticket as assigned`

- **Node Details:**

  - **Add issue link to Jira ticket**  
    - *Type:* Jira node  
    - *Role:* Adds a comment to the Jira issue that includes the GitHub issue URL for traceability.  
    - *Key Configuration:*  
      - Issue Key: From original Jira webhook payload  
      - Comment:  
        ```
        We've created an issue at {{ $json.issue_url }} and assigned it to Copilot.
        ```  
    - *Credentials:* Jira Cloud API credentials.  
    - *Input:* GitHub issue URL and original Jira issue key.  
    - *Output:* Jira comment creation success.  
    - *Potential Failures:* Jira API errors, permission issues, missing issue key or URL.

  - **Mark ticket as assigned**  
    - *Type:* Jira node  
    - *Role:* Updates the Jira issue to add the label `copilot_assigned` to prevent repeated assignments.  
    - *Key Configuration:*  
      - Issue Key: From original Jira event  
      - Update Fields: Append `copilot_assigned` label to existing labels array  
    - *Credentials:* Jira Cloud API credentials.  
    - *Input:* Original Jira issue labels and key.  
    - *Output:* Jira issue update confirmation.  
    - *Potential Failures:* Concurrent label updates causing race conditions, API errors.

---

### 3. Summary Table

| Node Name                  | Node Type                | Functional Role                                             | Input Node(s)             | Output Node(s)                  | Sticky Note                                                                                                                                                                                                                   |
|----------------------------|--------------------------|-------------------------------------------------------------|---------------------------|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| On Jira ticket updated      | Jira Trigger             | Listens for Jira issue update events                        | -                         | Is ready for assignment?       | ## Auto-resolve Jira tickets with coding agents  Improve issue resolution by assigning Jira tickets to coding agents with full operational context from Port, ensuring faster, accurate, and context-aware development          |
| Is ready for assignment?    | IF node                  | Filters Jira events for issues ready for assignment         | On Jira ticket updated      | Extract context from Port      | ## Auto-resolve Jira tickets with coding agents  See above                                                                                                                                                                   |
| Extract context from Port   | Custom Port.io            | Queries Port catalog to extract contextual info             | Is ready for assignment?    | Parse Port AI response         | ## Port Context Lake  To extract contextual information relevant to the Jira issue (services, repos, docs, resources, dependencies).                                                                                        |
| Parse Port AI response      | Custom Port.io            | Retrieves and parses AI response from Port                  | Extract context from Port   | Create a GitHub issue          | ## Port Context Lake  See above                                                                                                                                                                                             |
| Create a GitHub issue       | GitHub                   | Creates GitHub issue with AI-generated title and body       | Parse Port AI response      | Is issue creation successful?  | ## Github Copilot Assignment  To assign a ticket to Copilot, we first create a GitHub issue and then add a @copilot comment to the GitHub issue instructing Copilot to take ownership.                                       |
| Is issue creation successful?| IF node                 | Checks GitHub issue creation success                         | Create a GitHub issue       | Assign issue to Copilot        | ## Github Copilot Assignment  See above                                                                                                                                                                                     |
| Assign issue to Copilot     | GitHub                   | Adds comment tagging Copilot to take ownership              | Is issue creation successful?| Add issue link to Jira ticket; Mark ticket as assigned | ## Github Copilot Assignment  See above                                                                                                                                                                                     |
| Add issue link to Jira ticket| Jira                    | Adds comment to Jira issue linking GitHub issue             | Assign issue to Copilot     | Mark ticket as assigned        | ## Jira Ticket Linkage  To ensure that any new Github issue related to a Jira ticket is promptly linked back to the ticket in a comment, providing clear traceability and context for development progress.                   |
| Mark ticket as assigned     | Jira                     | Adds label `copilot_assigned` to Jira ticket                | Assign issue to Copilot     | -                             | ## Jira Ticket Linkage  See above                                                                                                                                                                                           |
| Sticky Note                | Sticky Note              | Documentation and overview                                   | -                         | -                             | ## Auto-resolve Jira tickets with coding agents  Improve issue resolution by assigning Jira tickets to coding agents with full operational context from Port, ensuring faster, accurate, and context-aware development          |
| Sticky Note1               | Sticky Note              | Documentation about Port context lake                        | -                         | -                             | ## Port Context Lake  To extract contextual information relevant to the Jira issue (services, repos, docs, resources, dependencies).                                                                                        |
| Sticky Note2               | Sticky Note              | Documentation about GitHub Copilot assignment                | -                         | -                             | ## Github Copilot Assignment  To assign a ticket to Copilot, we first create a GitHub issue and then add a @copilot comment to the GitHub issue instructing Copilot to take ownership.                                       |
| Sticky Note3               | Sticky Note              | Documentation about Jira ticket linkage                      | -                         | -                             | ## Jira Ticket Linkage  To ensure that any new Github issue related to a Jira ticket is promptly linked back to the ticket in a comment, providing clear traceability and context for development progress.                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Jira Trigger Node**  
   - Type: Jira Trigger  
   - Credentials: Jira Cloud API credentials  
   - Event: `jira:issue_updated`  
   - Name: "On Jira ticket updated"

2. **Create IF Node to Check Readiness**  
   - Type: IF  
   - Name: "Is ready for assignment?"  
   - Condition (Expression, Version 2):  
     ```
     $json.webhookEvent == "jira:issue_updated" &&
     $json.issue.fields.status.name == "In Progress" &&
     $json.issue.fields.labels.includes("product_approved") &&
     !$json.issue.fields.labels.includes("copilot_assigned")
     ```  
   - Connect input from "On Jira ticket updated" node.

3. **Create Custom Port.io Node for Context Extraction**  
   - Type: Custom Port.io node (`CUSTOM.portIo`)  
   - Operation: `generalInvoke`  
   - Tools: Regex filter `["^(list|get|search|track|describe)_.*"]`  
   - User Prompt: Multi-line prompt instructing to extract relevant context and produce JSON with `github_issue_title` and `github_issue_body` (copy prompt from overview)  
   - Model: `gpt-5`  
   - System Prompt: "You are a helpful assistant"  
   - Credentials: Port.io API key  
   - Connect input from "Is ready for assignment?" true output.

4. **Create Custom Port.io Node for Parsing AI Response**  
   - Type: Custom Port.io node (`CUSTOM.portIo`)  
   - Operation: `getInvocation`  
   - Invocation ID: Expression `={{ $json.invocationIdentifier }}` from previous node output  
   - Credentials: Port.io API key  
   - Connect input from "Extract context from Port".

5. **Create GitHub Node to Create Issue**  
   - Type: GitHub  
   - Operation: `createIssue`  
   - Repository: Target repo (dynamic or fixed)  
   - Owner: Organization or user (dynamic or fixed)  
   - Title: Expression `={{ $json.result.message.parseJson().github_issue_title }}`  
   - Body: Expression `={{ $json.result.message.parseJson().github_issue_body }}`  
   - Labels: `n8n`, `ai-workflow`  
   - Credentials: GitHub OAuth2  
   - Connect input from "Parse Port AI response".

6. **Create IF Node to Check GitHub Issue Creation Success**  
   - Type: IF  
   - Condition: Check if `$json.number` is not empty (non-empty string)  
   - Connect input from "Create a GitHub issue".

7. **Create GitHub Node to Comment Assigning Copilot**  
   - Type: GitHub  
   - Operation: `createComment`  
   - Repository and Owner: Same as GitHub issue creation node  
   - Issue Number: Expression `={{ $('Create a GitHub issue').item.json.number }}`  
   - Comment Body:  
     ```
     @copilot please take ownership of this issue and begin working on a solution.

     Use the information in the issue body and title to propose and implement the necessary code changes.
     ```  
   - Credentials: GitHub OAuth2  
   - Connect input from IF node’s true output (issue created successfully).

8. **Create Jira Node to Add Issue Link Comment**  
   - Type: Jira  
   - Operation: `issueComment`  
   - Issue Key: Expression `={{ $('On Jira ticket updated').item.json.issue.key }}`  
   - Comment: Expression  
     ```
     We've created an issue at {{ $json.issue_url }} and assigned it to Copilot.
     ```  
   - Credentials: Jira Cloud API  
   - Connect input from "Assign issue to Copilot".

9. **Create Jira Node to Mark Ticket as Assigned**  
   - Type: Jira  
   - Operation: `update`  
   - Issue Key: Expression `={{ $('On Jira ticket updated').item.json.issue.key }}`  
   - Update Fields: Add label `copilot_assigned` to current labels array:  
     ```
     {{ $('On Jira ticket updated').item.json.issue.fields.labels.concat('copilot_assigned') }}
     ```  
   - Credentials: Jira Cloud API  
   - Connect input from "Assign issue to Copilot" parallel to previous Jira comment node.

10. **Connect "Assign issue to Copilot" Node Outputs to Both Jira Nodes**  
    - Connect main output of "Assign issue to Copilot" to inputs of both "Add issue link to Jira ticket" and "Mark ticket as assigned".

11. **Test the Workflow**  
    - Ensure webhook URL is configured in Jira to match the trigger.  
    - Move a Jira ticket with label `product_approved` into status `In Progress`.  
    - Verify GitHub issue creation, Copilot assignment comment, and Jira ticket update with link and label.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                         | Context or Link                                               |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| Connect your Jira Cloud account and enable `issue_updated` webhook events for this workflow to trigger.                                                           | Jira Cloud webhook setup                                      |
| Register and create a free account on [Port.io](https://www.port.io) to access the API and obtain credentials.                                                    | https://www.port.io                                           |
| Connect your GitHub account with OAuth2 credentials and ensure the target repository exists and is accessible by the workflow and the Copilot bot user.           | GitHub OAuth2 and repository permissions                      |
| The Copilot bot or user must have permission to comment and work on issues in the target GitHub repository.                                                        | GitHub Copilot bot access                                     |
| The workflow’s prompt strictly enforces returning only JSON objects for automation reliability; any deviation may cause parsing failures.                        | Prompt design best practices                                  |
| Labels and status names are case-sensitive and rely on consistent Jira workflow configuration; changes require updating the IF node expression accordingly.        | Jira workflow consistency                                     |
| This workflow is designed to improve development speed and accuracy by providing Copilot with rich operational context automatically extracted from Port.io data. | Workflow purpose summary                                     |

---

**Disclaimer:**  
The provided content originates exclusively from an automated workflow created with n8n, respecting all applicable content policies. It contains no illegal, offensive, or protected elements and processes only legal and public data.