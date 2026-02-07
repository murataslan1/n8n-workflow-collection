Auto-resolve Jira Tickets with GitHub Copilot using Port Context

https://n8nworkflows.xyz/workflows/auto-resolve-jira-tickets-with-github-copilot-using-port-context-11147


# Auto-resolve Jira Tickets with GitHub Copilot using Port Context

---

### 1. Workflow Overview

This workflow automates the resolution process of Jira tickets by leveraging coding agents such as GitHub Copilot, enriched with operational context from Port.io. It targets software development teams who want to streamline issue handling by automatically creating corresponding GitHub issues from Jira tickets that are moved to an “In Progress” state and are approved for product development. The workflow then assigns these GitHub issues to Copilot, linking back to Jira for traceability.

Logical blocks:

- **1.1 Jira Event Monitoring and Validation**: Detects relevant Jira issue updates meeting specific criteria for further processing.
- **1.2 Context Extraction from Port.io Catalog**: Queries Port.io’s catalog to extract relevant operational context about services, repositories, and documentation related to the Jira issue.
- **1.3 GitHub Issue Creation and Copilot Assignment**: Creates a GitHub issue with the extracted context and commands Copilot to start working on it.
- **1.4 Jira Ticket Updates and Traceability**: Adds comments and labels to the Jira ticket to link it with the created GitHub issue and mark it as assigned to Copilot.

---

### 2. Block-by-Block Analysis

#### 2.1 Jira Event Monitoring and Validation

- **Overview:**  
  Listens for Jira issue update events, filters issues that have moved to “In Progress”, labeled “product_approved”, and not yet assigned to Copilot.

- **Nodes Involved:**  
  - On Jira ticket updated  
  - Is ready for assignment?

- **Node Details:**  

  - **On Jira ticket updated**  
    - Type: Jira Trigger  
    - Role: Entry point that listens to Jira issue update events.  
    - Configuration: Triggers on `jira:issue_updated` events; uses Jira Software Cloud credentials.  
    - Input: Webhook events from Jira Cloud.  
    - Output: Emits the full Jira issue JSON payload.  
    - Edge cases: Missing permissions or inactive webhook could cause missed triggers.

  - **Is ready for assignment?**  
    - Type: If node  
    - Role: Filters Jira events to pass only those issues which:  
      - are updated to status “In Progress”  
      - have label “product_approved”  
      - do not have label “copilot_assigned”  
    - Key expression:  
      ```javascript
      $json.webhookEvent == "jira:issue_updated" &&
      $json.issue.fields.status.name == "In Progress" &&
      $json.issue.fields.labels.includes("product_approved") &&
      !$json.issue.fields.labels.includes("copilot_assigned")
      ```  
    - Input: Jira issue JSON from trigger node  
    - Output: Proceeds only if condition is true, otherwise stops.  
    - Edge cases: If labels or status fields are missing or malformed, condition may fail unexpectedly.

#### 2.2 Context Extraction from Port.io Catalog

- **Overview:**  
  Queries Port.io’s API to extract relevant contextual information about the Jira issue, including related services, repos, teams, architecture, and documentation, to enrich the GitHub issue content.

- **Nodes Involved:**  
  - Extract context from Port  
  - Parse Port AI response

- **Node Details:**  

  - **Extract context from Port**  
    - Type: Custom Port.io node (CUSTOM.portIo)  
    - Role: Sends a structured prompt to Port.io’s AI-powered catalog query service to find relevant context for the Jira issue.  
    - Configuration highlights:  
      - Tools regex filter to query services or other resources in Port catalog.  
      - User prompt includes Jira issue details (key, summary, type, description, project key/name).  
      - Output format is a JSON object with two fields: `github_issue_title` and `github_issue_body`.  
      - Uses "gpt-5" model via Port provider.  
    - Input: Jira issue JSON filtered by previous node.  
    - Output: Raw AI response containing JSON with GitHub issue title and body.  
    - Edge cases: API errors, empty context results, or malformed AI responses may break parsing downstream.

  - **Parse Port AI response**  
    - Type: Custom Port.io node (CUSTOM.portIo)  
    - Role: Fetches the invocation result from Port.io using the invocation ID to get the final AI response.  
    - Configuration: Uses the invocation identifier from the previous node’s output.  
    - Input: Invocation ID from "Extract context from Port" node output.  
    - Output: Parsed JSON containing `github_issue_title` and `github_issue_body`.  
    - Edge cases: Timeout or missing invocation results, invalid JSON parsing.

#### 2.3 GitHub Issue Creation and Copilot Assignment

- **Overview:**  
  Creates a GitHub issue using the extracted context and then assigns it to GitHub Copilot by posting a comment requesting ownership.

- **Nodes Involved:**  
  - Create a GitHub issue  
  - Is issue creation successful?  
  - Assign issue to Copilot

- **Node Details:**  

  - **Create a GitHub issue**  
    - Type: GitHub node  
    - Role: Creates a new GitHub issue in a target repository.  
    - Configuration:  
      - Owner and repository are configured dynamically from credentials or expressions.  
      - Title and body are pulled from parsed Port.io AI response.  
      - Labels: “n8n” and “ai-workflow”.  
      - No assignees by default.  
    - Input: Parsed AI response JSON.  
    - Output: GitHub issue JSON, including issue number.  
    - Edge cases: API rate limits, permission errors, or invalid input fields.

  - **Is issue creation successful?**  
    - Type: If node  
    - Role: Checks if the GitHub issue creation returned a non-empty issue number.  
    - Expression: Checks if `$json.number` is not empty.  
    - Input: Output of “Create a GitHub issue”.  
    - Output: Continues only if issue creation succeeded.  
    - Edge cases: API failures or empty responses.

  - **Assign issue to Copilot**  
    - Type: GitHub node  
    - Role: Posts a comment on the newly created GitHub issue tagging @copilot to take ownership and begin work.  
    - Configuration:  
      - Comment body explicitly instructs Copilot to take ownership using issue title and body context.  
      - Uses the issue number from the previous node.  
    - Input: GitHub issue number from “Create a GitHub issue”.  
    - Output: GitHub comment JSON.  
    - Edge cases: Permission issues, invalid issue number, or comment posting failure.

#### 2.4 Jira Ticket Updates and Traceability

- **Overview:**  
  Updates the original Jira issue by adding a comment with the GitHub issue link and adds a label “copilot_assigned” to mark it as handled.

- **Nodes Involved:**  
  - Add issue link to Jira ticket  
  - Mark ticket as assigned

- **Node Details:**  

  - **Add issue link to Jira ticket**  
    - Type: Jira node  
    - Role: Adds a comment to the Jira issue linking the newly created GitHub issue URL.  
    - Configuration:  
      - Issue key dynamically extracted from webhook JSON.  
      - Comment text includes the GitHub issue URL.  
    - Input: Jira issue key and GitHub issue URL from previous nodes.  
    - Output: Jira comment JSON.  
    - Edge cases: Permissions to comment, invalid issue keys.

  - **Mark ticket as assigned**  
    - Type: Jira node  
    - Role: Updates the Jira issue labels by appending “copilot_assigned” label to indicate assignment completion.  
    - Configuration:  
      - Labels array is updated by concatenating the existing labels with “copilot_assigned”.  
      - Issue key from webhook JSON.  
    - Input: Jira issue JSON.  
    - Output: Jira issue update confirmation.  
    - Edge cases: Label duplication, API permission errors.

---

### 3. Summary Table

| Node Name                 | Node Type             | Functional Role                                       | Input Node(s)                 | Output Node(s)                    | Sticky Note                                                                                                                  |
|---------------------------|-----------------------|-----------------------------------------------------|------------------------------|---------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| On Jira ticket updated     | Jira Trigger          | Entry point: listens for Jira issue update events   | —                            | Is ready for assignment?          | See overview sticky note: Auto-resolve Jira tickets with coding agents                                                        |
| Is ready for assignment?   | If                    | Filters Jira issues to those ready for Copilot       | On Jira ticket updated        | Extract context from Port        |                                                                                                                              |
| Extract context from Port  | Custom Port.io node   | Queries Port catalog for relevant context            | Is ready for assignment?      | Parse Port AI response           | Sticky Note1: Port Context Lake — To extract contextual information relevant to the Jira issue                                |
| Parse Port AI response     | Custom Port.io node   | Retrieves and parses Port.io AI response              | Extract context from Port     | Create a GitHub issue            |                                                                                                                              |
| Create a GitHub issue      | GitHub                | Creates GitHub issue based on Port context            | Parse Port AI response        | Is issue creation successful?    | Sticky Note2: Github Copilot Assignment — Create issue and assign to Copilot                                                  |
| Is issue creation successful?| If                  | Checks if GitHub issue was created successfully       | Create a GitHub issue         | Assign issue to Copilot          |                                                                                                                              |
| Assign issue to Copilot    | GitHub                | Posts comment tagging Copilot to take ownership       | Is issue creation successful? | Add issue link to Jira ticket, Mark ticket as assigned |                                                                                                                              |
| Add issue link to Jira ticket | Jira               | Adds comment to Jira issue linking GitHub issue       | Assign issue to Copilot       | Mark ticket as assigned          | Sticky Note3: Jira Ticket Linkage — Links GitHub issue back to Jira for traceability                                          |
| Mark ticket as assigned    | Jira                  | Updates Jira labels to mark issue as assigned to Copilot | Assign issue to Copilot    | —                               |                                                                                                                              |
| Sticky Note                | Sticky Note           | Workflow overview and setup instructions              | —                            | —                               | See content in node                                                                                                          |
| Sticky Note1               | Sticky Note           | Explains Port context extraction block                | —                            | —                               | See content in node                                                                                                          |
| Sticky Note2               | Sticky Note           | Explains GitHub issue creation and Copilot assignment| —                            | —                               | See content in node                                                                                                          |
| Sticky Note3               | Sticky Note           | Explains Jira ticket linkage                           | —                            | —                               | See content in node                                                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Jira Trigger Node**  
   - Type: Jira Trigger  
   - Configure credentials for Jira Software Cloud account.  
   - Set events to listen to: `jira:issue_updated`.  
   - Save node as “On Jira ticket updated”.

2. **Add If Node to Filter Relevant Jira Issues**  
   - Name: “Is ready for assignment?”  
   - Condition (Expression):  
     ```javascript
     $json.webhookEvent == "jira:issue_updated" &&
     $json.issue.fields.status.name == "In Progress" &&
     $json.issue.fields.labels.includes("product_approved") &&
     !$json.issue.fields.labels.includes("copilot_assigned")
     ```  
   - Input: connect from “On Jira ticket updated” main output.  
   - Output: continue only if true.

3. **Add Custom Port.io Node for Context Extraction**  
   - Name: “Extract context from Port”  
   - Operation: `generalInvoke`  
   - Tools filter: regex `["^(list|get|search|track|describe)_.*"]`  
   - User prompt: Provide detailed prompt including Jira issue details (key, summary, type, description, project key/name) and instructions to return JSON with `github_issue_title` and `github_issue_body`.  
   - Model: `gpt-5` via Port provider.  
   - Credentials: Connect Port.io account with API key.  
   - Connect input from “Is ready for assignment?” true output.

4. **Add Custom Port.io Node to Parse AI Response**  
   - Name: “Parse Port AI response”  
   - Operation: `getInvocation`  
   - Invocation ID expression: `={{ $json.invocationIdentifier }}`  
   - Credentials: same Port.io account.  
   - Connect input from “Extract context from Port” main output.

5. **Add GitHub Node to Create Issue**  
   - Name: “Create a GitHub issue”  
   - Operation: Create Issue  
   - Owner: set GitHub organization or user URL  
   - Repository: select target repository name  
   - Title: set to expression `={{ $json.result.message.parseJson().github_issue_title }}`  
   - Body: set to expression `={{ $json.result.message.parseJson().github_issue_body }}`  
   - Labels: add “n8n” and “ai-workflow”  
   - Credentials: connect GitHub account with appropriate repo permissions.  
   - Connect input from “Parse Port AI response” main output.

6. **Add If Node to Check Issue Creation Success**  
   - Name: “Is issue creation successful?”  
   - Condition: Check if `$json.number` is not empty.  
   - Input: connect from “Create a GitHub issue” main output.  
   - Output: true path continues.

7. **Add GitHub Node to Post Comment Assigning Copilot**  
   - Name: “Assign issue to Copilot”  
   - Operation: Create Comment  
   - Owner and Repository: same as issue creation node.  
   - Issue Number: set by expression `={{ $('Create a GitHub issue').item.json.number }}`  
   - Comment Body:  
     ```
     @copilot please take ownership of this issue and begin working on a solution.

     Use the information in the issue body and title to propose and implement the necessary code changes.
     ```  
   - Credentials: GitHub account.  
   - Connect input from “Is issue creation successful?” true output.

8. **Add Jira Node to Add Comment Linking GitHub Issue**  
   - Name: “Add issue link to Jira ticket”  
   - Operation: Create Issue Comment  
   - Issue Key: dynamic from webhook JSON `={{ $('On Jira ticket updated').item.json.issue.key }}`  
   - Comment: `=We've created an issue at {{ $json.issue_url }} and assigned it to Copilot.`  
   - Credentials: Jira Software Cloud account.  
   - Connect input from “Assign issue to Copilot” main output.

9. **Add Jira Node to Update Issue Labels**  
   - Name: “Mark ticket as assigned”  
   - Operation: Update Issue  
   - Issue Key: same as above.  
   - Update Fields: Append label “copilot_assigned” to existing labels array using expression:  
     `={{ $('On Jira ticket updated').item.json.issue.fields.labels.concat('copilot_assigned') }}`  
   - Credentials: Jira Software Cloud account.  
   - Connect input from “Assign issue to Copilot” main output.

10. **Add Sticky Notes for Documentation** (optional but recommended)  
    - Add sticky notes describing:  
      - Workflow overview and setup instructions.  
      - Port context extraction purpose.  
      - GitHub Copilot assignment explanation.  
      - Jira ticket linkage and traceability.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                  | Context or Link                                         |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| Workflow improves Jira ticket resolution by auto-assigning coding agents with enriched context from Port.io for faster, more accurate development.                                                                           | Overview sticky note content                            |
| Port.io catalog is used to extract relevant operational context such as services, repos, docs, and dependencies, ensuring the GitHub issue is self-contained and developer-friendly.                                           | Sticky Note1 content                                    |
| GitHub Copilot is instructed via issue comments to take ownership and begin implementing solutions, streamlining the coding workflow.                                                                                        | Sticky Note2 content                                    |
| GitHub issue URLs are linked back to Jira issues with comments, and Jira tickets are labeled to mark assignment status, maintaining traceability of issue handling progress.                                                  | Sticky Note3 content                                    |
| Setup prerequisites include connecting Jira Cloud, Port.io, and GitHub accounts with appropriate credentials, enabling webhooks, and ensuring Copilot access to the repository.                                               | Overview sticky note content                            |
| Port.io registration and API key acquisition are required to enable context extraction.                                                                                                                                    | https://www.port.io                                    |
| Ensure a GitHub repository is configured and that a bot or user named @copilot has access to perform issue comments and assignments.                                                                                        | Overview sticky note content                            |

---

**Disclaimer:**  
The provided text and workflow originate exclusively from an automated process created using n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and publicly accessible.

---