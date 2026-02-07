Auto-Generate GitHub Release Notes and Notify via Slack

https://n8nworkflows.xyz/workflows/auto-generate-github-release-notes-and-notify-via-slack-6763


# Auto-Generate GitHub Release Notes and Notify via Slack

---

### 1. Workflow Overview

This workflow automates the generation of GitHub release notes from merged pull requests and publishes a draft release on GitHub, followed by sending a notification to a Slack channel. It is designed for developers and release managers who want to streamline release note creation and communication across teams.

The workflow is structured into the following logical blocks:

- **1.1 Input Reception:** Collects repository information via a user form.
- **1.2 Configuration Setup:** Prepares configuration parameters and mappings.
- **1.3 GitHub Data Retrieval:** Fetches latest Git tag, its commit date, and merged pull requests since that tag.
- **1.4 Release Notes Generation:** Groups pull requests by label and generates formatted release notes.
- **1.5 GitHub Release Creation:** Creates a draft release on GitHub with the generated notes.
- **1.6 Slack Notification:** Sends the release notes summary to a Slack channel.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block collects user input required to identify the GitHub repository and branch for which release notes are to be generated. It serves as the workflow’s entry point.

- **Nodes Involved:**  
  - GitHub Release Input Form

- **Node Details:**  

  - **GitHub Release Input Form**  
    - Type: Form Trigger  
    - Role: Presents a form to the user collecting three fields: Repository Name, Repository Owner, and Branch Name.  
    - Configuration:  
      - Form Title: "GitHub Release Input Form"  
      - Fields:  
        - Repository Name (required)  
        - Repository Owner (required)  
        - Branch Name (required)  
    - Inputs: None (trigger node)  
    - Outputs: JSON with user inputs to next node  
    - Edge cases: User submits invalid or incomplete data; form validation handles required fields  
    - Version: 2.2  
    - Notes: Triggers workflow execution upon form submission  

#### 1.2 Configuration Setup

- **Overview:**  
  This block extracts and organizes user inputs, sets default mappings for labels to categorize pull requests, and defines a QA checklist that will be appended to release notes.

- **Nodes Involved:**  
  - Config

- **Node Details:**  

  - **Config**  
    - Type: Set Node  
    - Role: Assigns variables based on form inputs and defines static mappings:  
      - `repoOwner`, `repoName`, `defaultBranch`: extracted from form data  
      - `labelMap`: JSON string mapping GitHub labels to emoji-prefixed categories (e.g., `"Feature": "🚀 Features"`)  
      - `qaChecklist`: Array of QA checklist items as strings  
    - Key Expressions: Values assigned using expressions referencing `$json` from input  
    - Input: Receives form data JSON  
    - Output: JSON with structured config variables  
    - Edge cases: Missing or malformed input data; labelMap and qaChecklist are hardcoded strings and must be valid JSON  
    - Version: 3.4  

#### 1.3 GitHub Data Retrieval

- **Overview:**  
  This block sequentially gathers relevant GitHub data: latest tag, commit date of that tag, and merged pull requests since that commit date. This information is essential to determine what changes to include in the release notes.

- **Nodes Involved:**  
  - Get Latest Git Tag  
  - Get Commit Date of Latest Tag  
  - Fetch All Merged PRs Since Last Tag

- **Node Details:**  

  - **Get Latest Git Tag**  
    - Type: HTTP Request  
    - Role: Calls GitHub API to fetch all tags for the specified repo and extracts the most recent semantic version tag.  
    - URL: `https://api.github.com/repos/{{repoOwner}}/{{repoName}}/tags`  
    - Authentication: GitHub API OAuth token (credential named "GitHub account")  
    - Headers: Additional header auth credential used  
    - Input: Config node output with repository info  
    - Output: JSON array of tags; first item assumed as latest tag  
    - Edge cases: API rate limits, invalid credentials, empty tags array  
    - Version: 4.2  

  - **Get Commit Date of Latest Tag**  
    - Type: HTTP Request  
    - Role: Retrieves detailed commit info for the latest tag to extract the commit date.  
    - URL: Dynamic, from previous node’s tag commit URL (`{{$json["commit"]["url"]}}`)  
    - Input: Output from "Get Latest Git Tag"  
    - Output: Commit details JSON containing timestamp  
    - Edge cases: Invalid or missing URL, API errors  
    - Version: 4.2  

  - **Fetch All Merged PRs Since Last Tag**  
    - Type: HTTP Request  
    - Role: Queries GitHub Search API for merged pull requests in the repo on the specified base branch merged after the latest tag commit date.  
    - URL: Constructed dynamically, e.g.:  
      `https://api.github.com/search/issues?q=is:pr+is:merged+repo:repoOwner/repoName+base:branchName+merged:>=commitDate`  
    - Input: Config node and commit date from previous nodes  
    - Output: JSON with `items` array containing PR details  
    - Edge cases: API pagination limit (max 100 results by default), API rate limits, no PRs found  
    - Version: 4.2  

#### 1.4 Release Notes Generation

- **Overview:**  
  This block processes the list of merged pull requests, groups them by labels according to the configured label map, formats them into Markdown release notes, and appends a predefined QA checklist.

- **Nodes Involved:**  
  - Adjusted: Group PRs & Generate Release Notes

- **Node Details:**  

  - **Adjusted: Group PRs & Generate Release Notes**  
    - Type: Code (JavaScript)  
    - Role:  
      - Reads PR data from previous node  
      - Groups PRs by matching labels against labelMap; unmatched PRs go under "📋 Others"  
      - Formats grouped PRs into Markdown sections with titles and bullet points  
      - Appends QA checklist items as unchecked boxes at the end  
    - Key Expressions:  
      - Accesses labelMap and qaChecklist from Config node  
      - Accesses PR data from "Fetch All Merged PRs Since Last Tag" node  
    - Input: PR JSON array  
    - Output: JSON with single property `release_notes` containing Markdown string  
    - Edge cases: Missing or malformed PR data, PRs without labels, empty PR list  
    - Version: 2  

#### 1.5 GitHub Release Creation

- **Overview:**  
  Creates a draft GitHub release on the repository using the latest tag and the generated release notes content.

- **Nodes Involved:**  
  - Github Pre Release

- **Node Details:**  

  - **Github Pre Release**  
    - Type: HTTP Request  
    - Role: Calls GitHub API to create a release with parameters:  
      - `tag_name` and `name`: latest tag name  
      - `body`: release notes markdown from previous node  
      - `draft`: true (release is a draft)  
      - `prerelease`: false  
    - URL: `https://api.github.com/repos/{{repoOwner}}/{{repoName}}/releases`  
    - Method: POST  
    - Authentication: Generic HTTP Header Auth (token-based)  
    - Input: release notes JSON from code node and config variables  
    - Output: GitHub release creation response including release URL  
    - Edge cases: API permission errors, invalid tag, network issues  
    - Version: 4.2  

#### 1.6 Slack Notification

- **Overview:**  
  Sends a message containing the release notes to a Slack channel to notify the team about the new release draft.

- **Nodes Involved:**  
  - Send message to slack

- **Node Details:**  

  - **Send message to slack**  
    - Type: HTTP Request  
    - Role: POSTs a message payload to Slack webhook URL including release notes and (optionally) release URL.  
    - URL: (configured by user, not set in JSON)  
    - Method: POST  
    - Body: JSON with `text` field combining release notes markdown and GitHub release URL  
    - Input: release notes and GitHub release URL from previous nodes  
    - Output: Slack API response  
    - Edge cases: Invalid or missing Slack webhook URL, network errors, message size limits  
    - Version: 4.2  

---

### 3. Summary Table

| Node Name                           | Node Type           | Functional Role                                   | Input Node(s)                   | Output Node(s)                     | Sticky Note                                                                                                                           |
|-----------------------------------|---------------------|-------------------------------------------------|--------------------------------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| GitHub Release Input Form          | Form Trigger        | Collects repo owner, repo name, and branch info | None                           | Config                           | ## Auto‑Generate Release Notes for Any GitHub Repo → Slack<br>See detailed workflow description in Sticky Note1                      |
| Config                            | Set                 | Prepares config variables and mappings           | GitHub Release Input Form       | Get Latest Git Tag               | #🚀 GitHub Automated Release Workflow (n8n)<br>Detailed description of nodes and purpose in Sticky Note1                              |
| Get Latest Git Tag                | HTTP Request        | Fetches latest Git tag from GitHub repo          | Config                         | Get Commit Date of Latest Tag    | #🚀 GitHub Automated Release Workflow (n8n)<br>Detailed description of nodes and purpose in Sticky Note1                              |
| Get Commit Date of Latest Tag    | HTTP Request        | Gets commit date of latest tag                    | Get Latest Git Tag             | Fetch All Merged PRs Since Last Tag | #🚀 GitHub Automated Release Workflow (n8n)<br>Detailed description of nodes and purpose in Sticky Note1                              |
| Fetch All Merged PRs Since Last Tag | HTTP Request        | Retrieves merged PRs after latest tag             | Get Commit Date of Latest Tag  | Adjusted: Group PRs & Generate Release Notes | #🚀 GitHub Automated Release Workflow (n8n)<br>Detailed description of nodes and purpose in Sticky Note1                              |
| Adjusted: Group PRs & Generate Release Notes | Code (JavaScript)    | Groups PRs by label and generates Markdown notes  | Fetch All Merged PRs Since Last Tag | Github Pre Release              | #🚀 GitHub Automated Release Workflow (n8n)<br>Detailed description of nodes and purpose in Sticky Note1                              |
| Github Pre Release               | HTTP Request        | Creates a draft GitHub release                     | Adjusted: Group PRs & Generate Release Notes | Send message to slack          | #🚀 GitHub Automated Release Workflow (n8n)<br>Detailed description of nodes and purpose in Sticky Note1                              |
| Send message to slack             | HTTP Request        | Sends release notes message to Slack               | Github Pre Release             | None                            | #🚀 GitHub Automated Release Workflow (n8n)<br>Detailed description of nodes and purpose in Sticky Note1                              |
| Sticky Note                      | Sticky Note         | Title and branding content                          | None                          | None                            | ## Auto‑Generate Release Notes for Any GitHub Repo → Slack                                                                            |
| Sticky Note1                     | Sticky Note         | Detailed workflow description and node explanations | None                          | None                            | #🚀 GitHub Automated Release Workflow (n8n)<br>Contains comprehensive node descriptions and purpose                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create `GitHub Release Input Form` node** (Form Trigger):  
   - Set form title: "GitHub Release Input Form"  
   - Add three required fields:  
     - Repository Name (text)  
     - Repository Owner (text)  
     - Branch Name (text)  
   - This node triggers workflow on form submission.

2. **Create `Config` node** (Set):  
   - Connect input from `GitHub Release Input Form` node.  
   - Set variables:  
     - `repoOwner` = `={{ $json['Repository Owner'] }}`  
     - `repoName` = `={{ $json['Repository Name'] }}`  
     - `defaultBranch` = `={{ $json['Branch Name'] }}`  
     - `labelMap` = `{"Feature": "🚀 Features", "bug": "🐞 Bug Fixes", "performance": "⚡ Performance", "sdk": "📦 SDK / Dependency"}` (string)  
     - `qaChecklist` = `["[ ] App boots successfully", "[ ] No crash on startup", "[ ] All features tested", "[ ] No broken UI on devices"]` (string/JSON array)

3. **Create `Get Latest Git Tag` node** (HTTP Request):  
   - Connect input from `Config` node.  
   - URL: `https://api.github.com/repos/{{$json["repoOwner"]}}/{{$json["repoName"]}}/tags`  
   - Authentication: Use GitHub OAuth credential with token permission.  
   - Method: GET  
   - No body.  
   - Use pagination if expecting many tags to ensure latest tag is retrieved.

4. **Create `Get Commit Date of Latest Tag` node** (HTTP Request):  
   - Connect input from `Get Latest Git Tag` node.  
   - URL: `={{$json["commit"]["url"]}}` (dynamic from previous node output)  
   - Method: GET  
   - Authentication: Use same GitHub credential.  

5. **Create `Fetch All Merged PRs Since Last Tag` node** (HTTP Request):  
   - Connect input from `Get Commit Date of Latest Tag`.  
   - URL:  
     ```
     =https://api.github.com/search/issues?q=is:pr+is:merged+repo:{{ $('Config').first().json.repoOwner }}/{{ $('Config').first().json.repoName }}+base:{{ $('Config').first().json.defaultBranch }}+merged:>={{ $json.commit.author.date }}
     ```  
   - Method: GET  
   - Authentication: GitHub credential.  
   - Handle pagination if expecting large number of PRs.

6. **Create `Adjusted: Group PRs & Generate Release Notes` node** (Code):  
   - Connect input from `Fetch All Merged PRs Since Last Tag`.  
   - Language: JavaScript  
   - Paste the provided code that:  
     - Accesses `labelMap` and `qaChecklist` from `Config` node  
     - Groups PRs by label  
     - Formats Markdown release notes with sections and QA checklist  
   - Output: JSON with `release_notes` property.

7. **Create `Github Pre Release` node** (HTTP Request):  
   - Connect input from `Adjusted: Group PRs & Generate Release Notes` node.  
   - URL: `https://api.github.com/repos/{{ $('Config').first().json.repoOwner }}/{{ $('Config').first().json.repoName }}/releases`  
   - Method: POST  
   - Authentication: HTTP Header Auth with GitHub token that allows release creation  
   - Body parameters (JSON):  
     - `tag_name`: latest tag from `Get Latest Git Tag`  
     - `name`: same as `tag_name`  
     - `body`: release notes markdown from previous node  
     - `draft`: `true` (boolean)  
     - `prerelease`: `false` (boolean)

8. **Create `Send message to slack` node** (HTTP Request):  
   - Connect input from `Github Pre Release` node.  
   - URL: Slack Incoming Webhook URL (must be configured by user)  
   - Method: POST  
   - Body parameters (JSON):  
     - `text`: Combine release notes and GitHub release URL. Example:  
       ```
       {{$node["Adjusted: Group PRs & Generate Release Notes"].json.release_notes}} {{$json.html_url}}
       ```  
   - No authentication required if webhook URL used.

9. **Connect nodes** in sequence as described:  
   - `GitHub Release Input Form` → `Config` → `Get Latest Git Tag` → `Get Commit Date of Latest Tag` → `Fetch All Merged PRs Since Last Tag` → `Adjusted: Group PRs & Generate Release Notes` → `Github Pre Release` → `Send message to slack`

10. **Credentials:**  
    - GitHub OAuth token with permissions to read repo tags, commits, pull requests, and create releases.  
    - Slack Incoming Webhook URL for sending messages.

11. **Test workflow** by submitting the form with valid repository data and verifying the creation of draft release and Slack message.

---

### 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                            |
|----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| This workflow automates release note generation from merged PRs and drafts a GitHub release, notifying teams via Slack.          | Workflow purpose and automation context                    |
| Label Map JSON defines categorization of PRs for release notes sections: Features, Bug Fixes, Performance, SDK/Dependency.       | Customizable categorization logic                           |
| QA Checklist is appended to release notes to ensure critical testing steps are acknowledged before final release.                 | Quality assurance integration                               |
| Slack notification requires a valid Slack Incoming Webhook URL configured in the HTTP Request node for messaging.                | Slack integration details                                   |
| GitHub API rate limits and permissions should be considered when deploying this workflow for large or private repositories.      | GitHub API best practices                                   |
| The GitHub Release creation node uses draft mode for review before publishing official releases.                                 | Release management practice                                 |
| Sticky Note nodes contain detailed workflow description and node explanations embedded in the workflow canvas for reference.    | Documentation embedded within workflow                      |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---