Auto-Answer GitHub PR Questions with GPT-4o, Notion & Slack for Dev Teams

https://n8nworkflows.xyz/workflows/auto-answer-github-pr-questions-with-gpt-4o--notion---slack-for-dev-teams-10331


# Auto-Answer GitHub PR Questions with GPT-4o, Notion & Slack for Dev Teams

### 1. Workflow Overview

This workflow automates the process of responding to developer questions posted as comments on GitHub Pull Requests (PRs) using the GPT-4o model hosted on Azure OpenAI. It targets development teams who want to streamline their code review and collaboration process by automatically generating concise, context-aware technical answers to PR review comments that contain questions. The workflow then records these interactions in a Notion database for documentation and posts the AI-generated responses back to the team’s Slack channel to maintain visibility.

The workflow is organized into the following logical blocks:

- **1.1 GitHub PR Comment Reception & Validation:** Listens for PR review comment events, validates the webhook payload to ensure it contains necessary data.

- **1.2 Developer Question Detection:** Inspects the comment content to determine if it is a developer question warranting an AI response.

- **1.3 AI Response Generation:** Uses GPT-4o to generate a concise technical answer to the detected question.

- **1.4 Metadata Extraction & Storage:** Extracts relevant metadata from the GitHub payload and stores the comment and AI response in a Notion database.

- **1.5 Communication & Error Logging:** Posts the AI answer and PR link to Slack and logs any errors encountered during processing into a Google Sheets document.

---

### 2. Block-by-Block Analysis

#### 2.1 GitHub PR Comment Reception & Validation

**Overview:**  
This block initiates the workflow by receiving GitHub PR review comment events and validates the incoming payload to ensure it contains a valid comment URL before continuing.

**Nodes Involved:**  
- GitHub PR Comment Trigger  
- Validate GitHub Webhook Payload  
- Log Errors in Google Sheets

**Node Details:**

- **GitHub PR Comment Trigger**  
  - *Type:* GitHub Trigger (Webhook)  
  - *Role:* Starts the workflow upon a `pull_request_review_comment` event in the `weather-app` repository owned by user `saurabhg97`.  
  - *Configuration:* Uses OAuth2 authentication with a GitHub account; listens specifically to PR review comments.  
  - *Input/Output:* Output only; triggers downstream validation node.  
  - *Edge Cases:* Webhook failures, auth errors, or misconfigured repository or event types.  
  - *Sticky Note:* Explains this node’s role in capturing events including comment text, file path, PR number, and author.

- **Validate GitHub Webhook Payload**  
  - *Type:* If Condition  
  - *Role:* Checks that the incoming payload contains a non-empty comment URL (`body.comment.url`) to ensure data completeness.  
  - *Configuration:* Uses a strict string notEmpty check on `{{$json.body.comment.url}}`.  
  - *Input:* From GitHub trigger.  
  - *Output:* Routes valid data to question detection; invalid data to error logging.  
  - *Edge Cases:* Missing or malformed webhook data causing the condition to fail.  
  - *Sticky Note:* Describes validation purpose to prevent processing incomplete data.

- **Log Errors in Google Sheets**  
  - *Type:* Google Sheets Append  
  - *Role:* Records errors when webhook validation fails or other processing errors occur.  
  - *Configuration:* Appends error ID and message to a specific sheet named “error log sheet” in a pre-defined Google Sheet document.  
  - *Input:* From failed validation branch.  
  - *Edge Cases:* Google Sheets API errors, auth issues, or rate limiting.  
  - *Sticky Note:* Details error logging for operational visibility and troubleshooting.

---

#### 2.2 Developer Question Detection

**Overview:**  
Determines if the comment contains a developer question by searching for phrases like “how do I” or “how to” in the comment body. Only questions proceed to AI response generation.

**Nodes Involved:**  
- Detect Developer Question in PR Comment

**Node Details:**

- **Detect Developer Question in PR Comment**  
  - *Type:* If Condition  
  - *Role:* Checks if the PR comment text includes help-related keywords indicating a question.  
  - *Configuration:* Uses JavaScript expressions to convert comment body to lowercase and searches for “how do i” or “how to”. Returns true if any found.  
  - *Input:* From webhook validation node.  
  - *Output:* Routes “true” to AI generation; “false” ends workflow silently.  
  - *Edge Cases:* False negatives if questions are phrased differently; potential expression evaluation errors if comment text is missing.  
  - *Sticky Note:* Explains keyword detection logic for routing.

---

#### 2.3 AI Response Generation

**Overview:**  
Generates a short, technically accurate reply to the developer’s PR comment question using the GPT-4o Azure OpenAI model.

**Nodes Involved:**  
- Configure GPT-4o Model  
- Generate AI Response for Developer Question

**Node Details:**

- **Configure GPT-4o Model**  
  - *Type:* Azure OpenAI Language Model Node (Langchain integration)  
  - *Role:* Establishes connection to GPT-4o hosted on Azure for AI text generation.  
  - *Configuration:* Model set explicitly to `gpt-4o`; credentials use Azure OpenAI API with OAuth.  
  - *Input:* None (setup node)  
  - *Output:* Provides AI model interface to downstream agent node.  
  - *Edge Cases:* API key expiration, quota limits, network timeouts.  
  - *Sticky Note:* Describes GPT-4o connection setup and purpose.

- **Generate AI Response for Developer Question**  
  - *Type:* Langchain Agent Node  
  - *Role:* Sends PR comment question and context to GPT-4o and receives a clear, concise answer (2-3 lines).  
  - *Configuration:*  
    - Input text template includes question, PR link, and repository info extracted from the webhook JSON.  
    - System message instructs the AI to be concise, helpful, and technically correct.  
  - *Input:* From question detection node and AI model node.  
  - *Output:* AI-generated response JSON containing the answer.  
  - *Edge Cases:* AI API failures, incomplete context, or unexpected AI output format.  
  - *Sticky Note:* Clarifies the AI’s role in drafting developer answers.

---

#### 2.4 Metadata Extraction & Storage

**Overview:**  
Extracts structured metadata from the webhook payload and saves the developer comment along with the AI response into a Notion database for documentation and tracking.

**Nodes Involved:**  
- Extract GitHub Comment Metadata  
- Save Comment Insight to Notion Database

**Node Details:**

- **Extract GitHub Comment Metadata**  
  - *Type:* Code (JavaScript) Node  
  - *Role:* Parses the webhook JSON to extract repository name, comment text, username, file path, and PR number.  
  - *Configuration:* JavaScript code references the original GitHub trigger node’s JSON output.  
  - *Input:* From AI response generation node.  
  - *Output:* JSON object with standardized metadata fields for use downstream.  
  - *Edge Cases:* Missing or malformed webhook data could cause runtime errors; code assumes presence of specific JSON paths.  
  - *Sticky Note:* Details the purpose of standardizing data for Notion.

- **Save Comment Insight to Notion Database**  
  - *Type:* Notion Node (databasePage resource)  
  - *Role:* Creates a new page in a Notion database (“test db”) with extracted metadata fields as properties.  
  - *Configuration:*  
    - Database ID specified explicitly.  
    - Properties mapped: Repository (title), comment body, username, current timestamp, file path, PR number.  
    - Authenticated using Notion API credentials.  
  - *Input:* From metadata extraction node.  
  - *Output:* Notion page creation confirmation.  
  - *Edge Cases:* Notion API rate limits, permission errors, invalid database ID.  
  - *Sticky Note:* Explains this node’s use as a living documentation hub.

---

#### 2.5 Communication & Error Logging

**Overview:**  
Posts the AI-generated response and original PR comment link to Slack to notify the team, ensuring real-time collaboration, and separately logs any errors encountered.

**Nodes Involved:**  
- Post AI Answer & PR Link to Slack  
- Log Errors in Google Sheets (also used in Block 2.1)

**Node Details:**

- **Post AI Answer & PR Link to Slack**  
  - *Type:* Slack Node  
  - *Role:* Sends a message to a Slack user or channel containing the AI-generated answer and the GitHub PR comment URL.  
  - *Configuration:*  
    - Text concatenates AI response (`Generate AI Response for Developer Question.output`) and comment URL (`Detect Developer Question in PR Comment.body.comment.url`).  
    - Target user selected by Slack User ID.  
    - Authenticated using Slack API credentials.  
  - *Input:* From Notion save node.  
  - *Output:* Slack message confirmation.  
  - *Edge Cases:* Slack API errors, invalid user ID, message formatting issues.  
  - *Sticky Note:* Describes notification purpose for team collaboration.

- **Log Errors in Google Sheets** (see Block 2.1 for details)  
  - Shared error logging node used to capture all workflow errors for audit and troubleshooting.

---

### 3. Summary Table

| Node Name                          | Node Type                        | Functional Role                         | Input Node(s)                      | Output Node(s)                               | Sticky Note                                                                                                                                                 |
|-----------------------------------|---------------------------------|---------------------------------------|----------------------------------|----------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| GitHub PR Comment Trigger          | GitHub Trigger                  | Receive PR comment webhook             | None                             | Validate GitHub Webhook Payload               | Starts the workflow when a pull-request comment event occurs in GitHub; captures comment text, file path, PR number, and author.                            |
| Validate GitHub Webhook Payload    | If Condition                   | Validate payload completeness          | GitHub PR Comment Trigger        | Detect Developer Question, Log Errors in GS   | Checks if webhook payload includes a valid comment URL; routes errors to logging to avoid failed operations.                                               |
| Log Errors in Google Sheets        | Google Sheets Append           | Log errors                            | Validate GitHub Webhook Payload  | None                                         | Records webhook or processing errors in a shared Google Sheet for troubleshooting.                                                                          |
| Detect Developer Question in PR Comment | If Condition                   | Detect if comment is a developer question | Validate GitHub Webhook Payload | Generate AI Response for Developer Question   | Evaluates comment text for keywords like “how do I” or “how to” to decide if AI response is needed.                                                        |
| Configure GPT-4o Model             | Azure OpenAI Language Model    | Setup GPT-4o AI connection             | None                             | Generate AI Response for Developer Question    | Establishes connection to GPT-4o model on Azure OpenAI for AI processing.                                                                                   |
| Generate AI Response for Developer Question | Langchain Agent                | Generate AI answer to developer question | Detect Developer Question         | Extract GitHub Comment Metadata                | Uses GPT-4o to draft short, clear technical answers to developer questions in PR comments.                                                                 |
| Extract GitHub Comment Metadata    | Code (JavaScript)              | Extract and standardize GitHub comment metadata | Generate AI Response for Developer Question | Save Comment Insight to Notion Database       | Parses webhook JSON to extract repo, comment, username, file path, PR number for storage.                                                                   |
| Save Comment Insight to Notion Database | Notion DatabasePage           | Store comment and AI response in Notion | Extract GitHub Comment Metadata  | Post AI Answer & PR Link to Slack              | Appends data to a Notion database serving as documentation hub for developer queries and AI answers.                                                       |
| Post AI Answer & PR Link to Slack | Slack                         | Notify team with AI answer and PR link | Save Comment Insight to Notion Database | None                                         | Posts AI-generated response and PR comment URL to Slack user/channel to facilitate faster team collaboration and review.                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create GitHub PR Comment Trigger Node**  
   - Type: GitHub Trigger  
   - Parameters:  
     - Owner: `saurabhg97`  
     - Repository: `weather-app`  
     - Events: `pull_request_review_comment`  
     - Authentication: OAuth2 with GitHub credentials  
   - Connect output to the next node.

2. **Create Validate GitHub Webhook Payload Node**  
   - Type: If Condition (Version 2)  
   - Condition: Check if `{{$json.body.comment.url}}` is not empty (string notEmpty operator)  
   - Connect main true output to next block; false output to error logging.

3. **Create Log Errors in Google Sheets Node**  
   - Type: Google Sheets Append  
   - Document ID: Specify your Google Sheet ID  
   - Sheet Name: Use sheet named “error log sheet”  
   - Columns: `error_id` and `error` as strings  
   - Connect input from Validate GitHub Webhook Payload false output.  
   - Configure OAuth2 credentials for Google Sheets.

4. **Create Detect Developer Question in PR Comment Node**  
   - Type: If Condition (Version 2)  
   - Condition: Use expression to check if the comment body (lowercased) includes “how do i” or “how to”  
   - Expression Example:  
     ```js
     (
       $json["body"]["comment"]["body"].toLowerCase().includes("how do i") ||
       $json["body"]["comment"]["body"].toLowerCase().includes("how to")
     ).toString()
     ```  
   - Connect true output to AI generation; false output ends workflow.

5. **Create Configure GPT-4o Model Node**  
   - Type: Azure OpenAI Language Model (Langchain)  
   - Model: Set to `gpt-4o`  
   - Credentials: Azure OpenAI API with valid key and endpoint  
   - No inputs; connect output to AI response node.

6. **Create Generate AI Response for Developer Question Node**  
   - Type: Langchain Agent Node  
   - Parameters:  
     - Text input: Template embedding comment body, PR link, and repository info from webhook JSON  
     - System message: Instruct AI to provide short, clear, technically correct answers (2-3 lines max)  
   - Connect input from Detect Developer Question node (true) and GPT-4o model node.

7. **Create Extract GitHub Comment Metadata Node**  
   - Type: Code (JavaScript) Node  
   - Code: Extract fields from original webhook JSON (`GitHub PR Comment Trigger` node output)  
   ```js
   const webhookData = $('GitHub PR Comment Trigger').first().json;
   return [{
     json: {
       repository: webhookData.body.repository.full_name,
       comment: webhookData.body.comment.body,
       username: webhookData.body.comment.user.login,
       file_path: webhookData.body.comment.path,
       pr_number: webhookData.body.pull_request.number
     }
   }];
   ```  
   - Connect input from AI response node.

8. **Create Save Comment Insight to Notion Database Node**  
   - Type: Notion (databasePage resource)  
   - Database ID: Use your target Notion database ID  
   - Properties: Map as follows:  
     - Title: Repository name  
     - Name (title): Comment body  
     - Name (title): Username  
     - Name (title): Current timestamp (`{{$now}}`)  
     - Name (title): File path  
     - Name (title): PR number (cast to string)  
   - Credentials: Notion API OAuth2  
   - Connect input from metadata extraction node.

9. **Create Post AI Answer & PR Link to Slack Node**  
   - Type: Slack  
   - Parameters:  
     - Text: Concatenate AI response output and GitHub comment URL  
     - User: Slack user ID or channel ID to post message  
   - Credentials: Slack OAuth2 token  
   - Connect input from Notion save node.

10. **Configure Credentials**  
    - Azure OpenAI API: Provide valid endpoint and key for GPT-4o model  
    - GitHub OAuth2: Setup OAuth2 with required scopes for repository webhook events  
    - Google Sheets OAuth2: Setup OAuth2 with write access to target spreadsheet  
    - Notion API OAuth2: Provide integration token with access to the target database  
    - Slack API: Provide OAuth2 token with chat:write scope for posting messages

11. **Final Testing**  
    - Trigger the workflow by commenting on a PR with a question like “How do I…”  
    - Verify AI response generation, Notion entry creation, Slack notification, and error logging on malformed payloads.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                                                        |
|-------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Workflow uses GPT-4o model hosted on Azure OpenAI for advanced AI language capabilities.         | Azure OpenAI documentation: https://learn.microsoft.com/en-us/azure/cognitive-services/openai/                                         |
| Notion database serves as a live FAQ and documentation repository for developer queries.          | Notion API reference: https://developers.notion.com/                                                                                     |
| Slack notifications keep the dev team informed in real-time about automated AI responses.         | Slack API docs: https://api.slack.com/messaging                                                                                         |
| Google Sheets used for centralized error tracking to improve operational reliability.             | Google Sheets API guide: https://developers.google.com/sheets/api                                                                         |
| The workflow assumes the PR comment payload structure consistent with GitHub’s `pull_request_review_comment` webhook event. | GitHub webhook events: https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#pull_request_review_comment |
| For best results, ensure the GitHub OAuth app has appropriate permissions for reading PR comments. | OAuth scopes: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps                                        |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, a workflow automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly accessible.