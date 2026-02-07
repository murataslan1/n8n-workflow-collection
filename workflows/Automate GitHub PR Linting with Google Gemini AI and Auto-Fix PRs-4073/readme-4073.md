Automate GitHub PR Linting with Google Gemini AI and Auto-Fix PRs

https://n8nworkflows.xyz/workflows/automate-github-pr-linting-with-google-gemini-ai-and-auto-fix-prs-4073


# Automate GitHub PR Linting with Google Gemini AI and Auto-Fix PRs

### 1. Workflow Overview

This workflow, named **LintBot: Your Automated Code Quality Assistant**, automates the process of linting pull requests (PRs) in a GitHub repository using an AI-powered linting service (Google Gemini). When a PR is created or updated, the workflow triggers via a GitHub webhook, fetches all changed files in the PR, analyzes and fixes linting issues using Google Gemini AI, and then creates a new branch with the corrected files. Finally, it submits a new PR with these automated linting fixes against the original base branch.

**Target Use Cases:**

- Automatically enforcing consistent code style and linting standards on GitHub PRs without manual intervention.
- Reducing code review overhead by automatically fixing formatting and linting issues.
- Integrating AI-based code quality analysis in CI/CD pipelines.
- Teams wanting to streamline code quality checks using AI and GitHub automation.

**Logical Blocks:**

- **1.1 Webhook Trigger & Common Fields Initialization:** Receives the PR event from GitHub and sets common repository parameters.
- **1.2 GitHub PR Metadata Retrieval:** Fetches detailed PR data including branch info and latest commit/tree hashes.
- **1.3 PR Changed Files Retrieval & Content Extraction:** Retrieves the list of changed files in the PR, downloads and decodes their contents.
- **1.4 File Data Aggregation:** Converts file contents into a structured JSON object for AI processing.
- **1.5 AI-Powered Linting and Fix Generation:** Sends the file data to Google Gemini AI agent to analyze, fix linting issues, and generate git commit/PR instructions.
- **1.6 GitHub Branch, Commit, and PR Management:** Creates blobs, trees, commits, branches, and PRs on GitHub based on AI output.
- **1.7 Response to Webhook:** Returns the AI agent’s output as webhook response.

---

### 2. Block-by-Block Analysis

#### 1.1 Webhook Trigger & Common Fields Initialization

- **Overview:** Listens for PR creation/update webhook calls from GitHub and initializes repository-specific common fields.
- **Nodes Involved:** 
  - Listen for Trigger from Github Workflow
  - Set Common Fields
- **Node Details:**

  1. **Listen for Trigger from Github Workflow**
     - Type: Webhook Trigger
     - Role: Entry point that receives PR event payloads via a webhook URL.
     - Config: Path is a unique webhook ID, responds with JSON content-type header.
     - Input: External HTTP POST requests from GitHub webhook.
     - Output: JSON payload containing PR number, repository, branch references.
     - Possible Failures: Webhook URL misconfiguration, authentication issues at GitHub webhook level, invalid payload structure.
  
  2. **Set Common Fields**
     - Type: Code Node (JavaScript)
     - Role: Defines and returns repository-specific variables such as GitHub organization, repo name, and API base endpoint.
     - Configuration: Hardcoded fields: 
       ```javascript
       {
         gitHubRepoName: 'my-membership',
         gitHubOrgName: 'carved-rock-fitness-gym'
       }
       ```
       Constructs `gitHubApiBaseEndpointUri` as `https://api.github.com/repos/{org}/{repo}`.
     - Input: Triggered by webhook node output.
     - Output: JSON with common fields for downstream API calls.
     - Potential Issues: Requires manual update to match target repository.

---

#### 1.2 GitHub PR Metadata Retrieval

- **Overview:** Retrieves detailed PR metadata including branch info, latest commit SHA, and tree hash to prepare for creating new commits.
- **Nodes Involved:**
  - Get PR GitHub Branch
  - Get Latest Main Branch Commit SHA
  - Get Latest Main Branch Tree Hash
- **Node Details:**

  1. **Get PR GitHub Branch**
     - Type: HTTP Request (GET)
     - Role: Fetches PR details via GitHub API using PR number.
     - Config: URL constructed from common fields and PR number.
     - Authentication: GitHub Personal Access Token credential.
     - Output: JSON containing PR metadata including `head.ref` (source branch).
     - Failures: Auth errors, invalid PR number, API rate limits.

  2. **Get Latest Main Branch Commit SHA**
     - Type: HTTP Request (GET)
     - Role: Retrieves the latest commit SHA on the `main` branch.
     - Config: Uses GitHub API endpoint `/git/ref/heads/main`.
     - Auth: GitHub credential.
     - Output: JSON with latest commit SHA.
     - Failures: Branch not found, API errors.

  3. **Get Latest Main Branch Tree Hash**
     - Type: HTTP Request (GET)
     - Role: Using the commit SHA, fetches the tree hash for the commit.
     - Config: URL uses commit SHA from previous node.
     - Auth: GitHub credential.
     - Output: JSON with `tree.sha` representing the tree hash.
     - Failures: Invalid commit SHA, API issues.

---

#### 1.3 PR Changed Files Retrieval & Content Extraction

- **Overview:** Retrieves the list of files changed in the PR and downloads their contents for linting.
- **Nodes Involved:**
  - Get PR Files
  - Get File Contents
  - Convert Base64 to Text File
  - Extract from File
- **Node Details:**

  1. **Get PR Files**
     - Type: HTTP Request (GET)
     - Role: Fetches the list of changed files for the PR via GitHub API `/pulls/{pr_number}/files`.
     - Input: Uses PR number and common fields.
     - Auth: GitHub credential.
     - Output: Array of changed file metadata (paths, content URLs).
     - Failures: API rate limits, invalid PR number.

  2. **Get File Contents**
     - Type: HTTP Request (GET)
     - Role: For each file, fetches file content from GitHub using `contents_url`.
     - Auth: GitHub credential.
     - Output: Base64 encoded file content.
     - Failures: Large files causing timeout, private repo access issues.

  3. **Convert Base64 to Text File**
     - Type: ConvertToFile Node
     - Role: Converts base64 encoded content to binary/text data for processing.
     - Input Property: `content` field from previous node.
     - Output: Binary/text file data.
     - Failures: Base64 decoding errors.

  4. **Extract from File**
     - Type: ExtractFromFile Node
     - Role: Extracts text from binary file data.
     - Output: Text content of file for linting.
     - Failures: Non-text files, encoding issues.

---

#### 1.4 File Data Aggregation

- **Overview:** Structures each file’s path and code into a JSON object, then aggregates all files into a single collection for AI input.
- **Nodes Involved:**
  - Create Code/FilePath Object
  - Collect All Files Changed
- **Node Details:**

  1. **Create Code/FilePath Object**
     - Type: Set Node
     - Role: Creates a JSON object with fields `code` (file contents) and `filePath` (file path).
     - Inputs: Extracted text content and file metadata.
     - Output: JSON object per file.
     - Failures: Missing or malformed file content.

  2. **Collect All Files Changed**
     - Type: Aggregate Node
     - Role: Aggregates all individual file objects into one array.
     - Output: Single JSON array containing all files and their code.
     - Failures: Large PRs causing memory issues.

---

#### 1.5 AI-Powered Linting and Fix Generation

- **Overview:** Uses Google Gemini AI to analyze the aggregated file data, identify linting issues, create fixes, and generate git instructions (branches, commits, PRs).
- **Nodes Involved:**
  - AI Agent
  - Google Gemini Chat Model
- **Node Details:**

  1. **AI Agent**
     - Type: Langchain Agent Node (AI agent orchestrator)
     - Role: Coordinates AI prompt and output, sends file data to Google Gemini, receives linting fixes and git operation details.
     - Configuration:
       - Input text: JSON stringified array of files.
       - System message instructs AI to:
         1. Fix linting issues.
         2. Check/create branch named `<PR branch>-linting-fix`.
         3. Commit fixed files.
         4. Create PR titled "Linting fixes for PR:<PR number>".
     - Input: Aggregated file data.
     - Output: AI-generated JSON with fix details and git commands.
     - Failures: AI service downtime, malformed AI responses, rate limits.

  2. **Google Gemini Chat Model**
     - Type: Langchain Google Gemini Chat Model
     - Role: Provides the underlying language model (Gemini 2.0 Flash) for the AI agent.
     - Credentials: Google AI API Key.
     - Failures: API key invalid, quota exceeded.

---

#### 1.6 GitHub Branch, Commit, and PR Management

- **Overview:** Uses AI-generated data to create blobs, trees, commits, branches, and finally a PR on GitHub with linting fixes.
- **Nodes Involved:**
  - Create GitHub Blob
  - Create GitHub Tree
  - Create GitHub Commit
  - Create Branch
  - Get Branch
  - Create Pull Request
- **Node Details:**

  1. **Create GitHub Blob**
     - Type: HTTP Request Tool (POST)
     - Role: Creates a GitHub blob object for each fixed file content.
     - Input: File content from AI output.
     - Auth: GitHub credential.
     - Failures: Large files, API errors.

  2. **Create GitHub Tree**
     - Type: HTTP Request Tool (POST)
     - Role: Creates a tree object in GitHub referencing blobs for files.
     - Input: Base tree hash from latest main branch, and AI-provided tree file structure.
     - Auth: GitHub credential.
     - Failures: Invalid tree structure.

  3. **Create GitHub Commit**
     - Type: HTTP Request Tool (POST)
     - Role: Creates a commit object referencing the new tree and parent commit.
     - Input: Commit message, tree hash, parent commit SHA.
     - Auth: GitHub credential.
     - Failures: Invalid commit data.

  4. **Create Branch**
     - Type: HTTP Request Tool (POST)
     - Role: Creates or updates a branch pointing to the new commit.
     - Input: Branch ref name, commit SHA.
     - Auth: GitHub credential.
     - Failures: Branch exists conflict, permission errors.

  5. **Get Branch**
     - Type: HTTP Request Tool (GET)
     - Role: Checks if the AI-generated branch already exists.
     - Input: Branch name from AI.
     - Auth: GitHub credential.
     - Failures: Branch not found, API errors.

  6. **Create Pull Request**
     - Type: HTTP Request Tool (POST)
     - Role: Creates a new PR in GitHub from the linting fixes branch to base branch (`main`).
     - Input: PR title, head branch, base branch, PR body.
     - Auth: GitHub credential.
     - Failures: PR creation errors, branch protection rules.

---

#### 1.7 Response to Webhook

- **Overview:** Returns the AI agent's output as an HTTP response to the webhook caller.
- **Nodes Involved:**
  - Respond to Webhook
- **Node Details:**

  1. **Respond to Webhook**
     - Type: Respond to Webhook
     - Role: Sends back the entire incoming data (including AI results) as the webhook response.
     - Input: AI Agent output.
     - Failures: Response timeout if AI processing delayed.

---

### 3. Summary Table

| Node Name                     | Node Type                          | Functional Role                                | Input Node(s)                     | Output Node(s)               | Sticky Note                          |
|-------------------------------|----------------------------------|-----------------------------------------------|----------------------------------|-----------------------------|------------------------------------|
| Listen for Trigger from Github Workflow | Webhook Trigger                  | Receives GitHub PR webhook trigger             | -                                | Set Common Fields            |                                    |
| Set Common Fields              | Code                             | Defines repo-specific common API fields        | Listen for Trigger               | Get PR GitHub Branch         | Requires manual repo/org update     |
| Get PR GitHub Branch           | HTTP Request                     | Fetches PR metadata (branch info)               | Set Common Fields                | Get Latest Main Branch Commit SHA |                                |
| Get Latest Main Branch Commit SHA | HTTP Request                     | Gets latest commit SHA on main branch           | Get PR GitHub Branch             | Get Latest Main Branch Tree Hash |                                |
| Get Latest Main Branch Tree Hash | HTTP Request                     | Gets tree hash of latest main commit            | Get Latest Main Branch Commit SHA | Get PR Files                |                                |
| Get PR Files                  | HTTP Request                     | Retrieves list of files changed in PR           | Get Latest Main Branch Tree Hash | Get File Contents           |                                |
| Get File Contents             | HTTP Request                     | Downloads file content for each changed file    | Get PR Files                    | Convert Base64 to Text File |                                |
| Convert Base64 to Text File    | ConvertToFile                    | Converts base64 content to text/binary          | Get File Contents               | Extract from File           |                                |
| Extract from File             | ExtractFromFile                  | Extracts text content from file                  | Convert Base64 to Text File      | Create Code/FilePath Object |                                |
| Create Code/FilePath Object   | Set                             | Creates JSON object with code and file path     | Extract from File               | Collect All Files Changed   |                                |
| Collect All Files Changed     | Aggregate                       | Aggregates all file objects into one array       | Create Code/FilePath Object     | AI Agent                   |                                |
| AI Agent                     | Langchain Agent                  | Runs AI linting and generates git instructions   | Collect All Files Changed, Get Branch, Create Branch, Create GitHub Blob, Create GitHub Tree, Create GitHub Commit, Create Pull Request | Respond to Webhook          | AI-driven lint fixes & PR automation |
| Google Gemini Chat Model      | Langchain Language Model         | Provides AI model backend (Google Gemini)       | AI Agent (ai_languageModel)     | AI Agent                   | Requires Google AI API key         |
| Create GitHub Blob            | HTTP Request Tool                | Creates GitHub blob for fixed file content      | AI Agent (ai_tool)              | AI Agent                   | GitHub credential required         |
| Create GitHub Tree            | HTTP Request Tool                | Creates GitHub tree object referencing blobs    | AI Agent (ai_tool)              | AI Agent                   |                                   |
| Create GitHub Commit          | HTTP Request Tool                | Creates commit from tree and parent commit      | AI Agent (ai_tool)              | AI Agent                   |                                   |
| Create Branch                | HTTP Request Tool                | Creates or updates branch pointing to commit    | AI Agent (ai_tool)              | AI Agent                   |                                   |
| Get Branch                  | HTTP Request Tool                | Checks if branch exists                          | AI Agent (ai_tool)              | AI Agent                   |                                   |
| Create Pull Request           | HTTP Request Tool                | Creates PR from lint fixes branch                | AI Agent (ai_tool)              | AI Agent                   |                                   |
| Respond to Webhook            | Respond to Webhook               | Sends AI output as HTTP response to webhook     | AI Agent                      | -                           |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**
   - Type: Webhook
   - Path: Unique ID (e.g., `1da5a6e1-9453-4a65-bbac-a1fed633f6ad`)
   - Response Mode: Respond with data
   - Set response header `Content-Type` to `application/json`
   - This node will receive GitHub PR webhook payloads.

2. **Create Code Node "Set Common Fields"**
   - Add JavaScript code setting:
     ```javascript
     const commonFields = {
       gitHubRepoName: 'my-membership',
       gitHubOrgName: 'carved-rock-fitness-gym'
     };
     commonFields.gitHubApiBaseEndpointUri = `https://api.github.com/repos/${commonFields.gitHubOrgName}/${commonFields.gitHubRepoName}`;
     return commonFields;
     ```
   - Connect Webhook node output to this node.

3. **Create HTTP Request Node "Get PR GitHub Branch"**
   - Method: GET
   - URL: `={{ $json.gitHubApiBaseEndpointUri }}/pulls/{{ $("Listen for Trigger from Github Workflow").item.json.pull_request_number }}`
   - Authentication: GitHub API credential (Personal Access Token with repo access)
   - Connect output of "Set Common Fields" to this node.

4. **Create HTTP Request Node "Get Latest Main Branch Commit SHA"**
   - Method: GET
   - URL: `={{ $json.gitHubApiBaseEndpointUri }}/git/ref/heads/main`
   - Auth: GitHub API credential
   - Connect "Get PR GitHub Branch" output to this node.

5. **Create HTTP Request Node "Get Latest Main Branch Tree Hash"**
   - Method: GET
   - URL: `={{ $json.gitHubApiBaseEndpointUri }}/git/commits/{{ $json.object.sha }}`
   - Auth: GitHub API credential
   - Connect "Get Latest Main Branch Commit SHA" output to this node.

6. **Create HTTP Request Node "Get PR Files"**
   - Method: GET
   - URL: `={{ $json.gitHubApiBaseEndpointUri }}/pulls/{{ $("Listen for Trigger from Github Workflow").item.json.pull_request_number }}/files`
   - Auth: GitHub API credential
   - Connect "Get Latest Main Branch Tree Hash" output to this node.

7. **Create HTTP Request Node "Get File Contents"**
   - Method: GET
   - URL: `={{ $json.contents_url }}`
   - Auth: GitHub API credential
   - Set to run for each item (loop over files)
   - Connect "Get PR Files" output to this node.

8. **Create ConvertToFile Node "Convert Base64 to Text File"**
   - Operation: toBinary
   - Source Property: content
   - Connect "Get File Contents" output to this node.

9. **Create ExtractFromFile Node "Extract from File"**
   - Operation: text extraction
   - Connect "Convert Base64 to Text File" output to this node.

10. **Create Set Node "Create Code/FilePath Object"**
    - Assign fields:
      - `code`: `={{ $json.data }}`
      - `filePath`: `={{ $("Get File Contents").item.json.path }}`
    - Connect "Extract from File" output to this node.

11. **Create Aggregate Node "Collect All Files Changed"**
    - Aggregate all data items into one array.
    - Connect "Create Code/FilePath Object" output to this node.

12. **Create Langchain Google Gemini Chat Model Node**
    - Model Name: `models/gemini-2.0-flash`
    - Credentials: Google Gemini API key
    - No inputs connected (used as AI model provider)

13. **Create Langchain Agent Node "AI Agent"**
    - Text: Pass JSON stringified files from "Collect All Files Changed"
    - System Message: Instructions to lint and fix code, manage branches and PRs.
    - Connect "Collect All Files Changed" to AI Agent main input.
    - Connect "Get Branch", "Create Branch", "Create GitHub Blob", "Create GitHub Tree", "Create GitHub Commit", "Create Pull Request" nodes as AI tool actions.
    - Connect "Google Gemini Chat Model" node to AI Agent's language model input.

14. **Create HTTP Request Tool Nodes for GitHub Operations**
    - "Get Branch" (GET) to check if linting branch exists.
    - "Create GitHub Blob" (POST) to create blobs for fixed files.
    - "Create GitHub Tree" (POST) to create tree from blobs.
    - "Create GitHub Commit" (POST) to create commit referencing tree.
    - "Create Branch" (POST) to create or update branch pointing to commit.
    - "Create Pull Request" (POST) to create PR from lint fixes branch to base.
    - Each uses GitHub API credential.
    - Connect outputs appropriately to AI Agent as AI tool inputs.

15. **Create Respond to Webhook Node**
    - Respond with all incoming items (AI Agent output).
    - Connect AI Agent main output to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                                  |
|----------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| GitHub Personal Access Token should have minimal required scopes: `repo`, `workflow`, `admin:repo_hook` | https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic |
| Google Gemini API key required for AI linting model                                                | https://ai.google.dev/tutorials/setup                                                                           |
| GitHub webhook must be configured to trigger this workflow on PR `opened` and `synchronize` events | `.github/workflows/lint-guardian.yml` sample provided in description                                            |
| AI Agent system message can be customized to enforce specific linting rules                         | Modify Langchain Agent node systemMessage parameter                                                            |
| Workflow template can be extended to add Slack notifications or approval steps                      | Suggested in description                                                                                        |

---

This detailed analysis and reproduction guide enables advanced users and automation agents to fully understand, replicate, and extend the LintBot workflow for AI-powered automated PR linting on GitHub repositories using n8n and Google Gemini AI.