Automate iOS Config Sync: .env to Xcode with GitHub PRs and Email Notifications

https://n8nworkflows.xyz/workflows/automate-ios-config-sync---env-to-xcode-with-github-prs-and-email-notifications-8391


# Automate iOS Config Sync: .env to Xcode with GitHub PRs and Email Notifications

### 1. Workflow Overview

This workflow automates the synchronization of iOS environment configuration files from a `.env.staging` file to iOS-specific configuration files (`Info.plist`, `Config.xcconfig`) in a GitHub repository. Upon detecting changes to the environment file in a GitHub push event, it calculates necessary configuration updates, creates a dedicated branch, opens a pull request (PR) with the updates, triggers cache invalidation if required, and sends an email notification to the iOS team.

**Target Use Cases:**  
- iOS development teams needing automated propagation of environment variable changes into Xcode config files.  
- Teams wanting automated PRs with config updates and notifications to streamline environment sync workflows.  
- Projects requiring cache invalidation triggers in Xcode builds when certain environment keys change.

**Logical Blocks:**

- **1.1 Input Reception and Configuration Setup:** Trigger on GitHub push and set static workflow parameters.  
- **1.2 Changed Files Detection:** Identify if `.env.staging` was modified.  
- **1.3 Configuration Diffing:** Determine what config files and keys need updating and if cache invalidation is necessary.  
- **1.4 Branch Management:** Generate a branch name and create a new branch in GitHub.  
- **1.5 File Preparation and PR Creation:** Prepare repo metadata, create a pull request with the config changes.  
- **1.6 Cache Invalidation:** Trigger cache invalidation logic if relevant keys changed.  
- **1.7 Notification:** Send email notification summarizing the sync results.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Configuration Setup

- **Overview:**  
  Listens for GitHub push events on a specific repository and initializes key static configuration parameters for the workflow.

- **Nodes Involved:**  
  - Github Push Trigger  
  - SetConfiguration

- **Node Details:**

  - **Github Push Trigger**  
    - *Type:* GitHub Webhook Trigger  
    - *Role:* Initiates workflow on push events to `username/repo_app` repository.  
    - *Config:* Monitors push events on repository `repo_app` owned by `username`. Uses GitHub OAuth credentials.  
    - *Inputs:* GitHub webhook push payload with commit and repo details.  
    - *Outputs:* Raw push data, including changed files, ref, commit SHA.  
    - *Edge Cases:* Webhook delivery failure, GitHub API rate limits, invalid credentials.

  - **SetConfiguration**  
    - *Type:* Set Node  
    - *Role:* Defines static parameters such as environment file path, config files, target branch, cache invalidation keys, PR labels, and email recipient.  
    - *Config:*  
      - `envFilePath`: `.env.staging`  
      - `configFiles`: `["Info.plist", "Config.xcconfig"]`  
      - `targetBranch`: `main`  
      - `cacheInvalidationKeys`: `["API_KEY", "BUNDLE_VERSION", "ENVIRONMENT"]`  
      - `prLabels`: `["config-sync", "automated", "ios"]`  
      - `emailTo`: `ios-team@example.com`  
    - *Inputs:* Receives GitHub push payload from trigger.  
    - *Outputs:* Configuration parameters passed downstream.  
    - *Edge Cases:* Misconfiguration of parameters, missing keys.

#### 2.2 Changed Files Detection

- **Overview:**  
  Parses the push payload to determine if the monitored `.env.staging` file was changed in the latest commits.

- **Nodes Involved:**  
  - Check Changed Files

- **Node Details:**

  - **Check Changed Files**  
    - *Type:* Code Node (JavaScript)  
    - *Role:* Extracts all added, modified, and removed files from commits and checks if `.env.staging` was among them.  
    - *Config:* Uses JavaScript to flatten commit file arrays and detect `.env.staging` changes based on `envFilePath`.  
    - *Key expressions:*  
      - `webhookData.commits` to get changed files  
      - `envFileChanged` boolean flag  
    - *Inputs:* JSON from `SetConfiguration` and GitHub push trigger.  
    - *Outputs:* JSON with repository info, ref, commit SHA, `envFileChanged` flag, and list of changed files.  
    - *Edge Cases:* Empty commits, missing repo data, malformed payload.

#### 2.3 Configuration Diffing

- **Overview:**  
  Simulates a diff between `.env.staging` environment variables and iOS config files, preparing a list of changes and determining if cache invalidation is required.

- **Nodes Involved:**  
  - Perform Config Diff

- **Node Details:**

  - **Perform Config Diff**  
    - *Type:* Code Node (JavaScript)  
    - *Role:* When `.env.staging` changed, simulates environment changes and maps them to updates needed in `Info.plist` and `Config.xcconfig`. Determines if any cache invalidation keys changed.  
    - *Config:*  
      - Hardcoded example diff values for keys like `API_KEY`, `BUNDLE_VERSION`, `DEBUG_MODE`.  
      - Prepares `configUpdates` array with old and new values per file.  
      - Checks if any keys in `cacheInvalidationKeys` are present in the changes.  
    - *Inputs:* Outputs from `Check Changed Files` and `SetConfiguration`.  
    - *Outputs:* JSON with repository name, commit SHA, target branch, environment changes, config updates, cache invalidation flags.  
    - *Edge Cases:* No changes in `.env.staging`, parse errors, inconsistent config file names.

#### 2.4 Branch Management

- **Overview:**  
  Generates a unique branch name for the config sync and creates the branch in GitHub at the commit SHA.

- **Nodes Involved:**  
  - Create Branch Name  
  - Create Branch

- **Node Details:**

  - **Create Branch Name**  
    - *Type:* Code Node  
    - *Role:* Creates a timestamped branch name prefixing with `ios-config-sync/`.  
    - *Config:* Uses ISO timestamp with replacements for URL-safe characters.  
    - *Inputs:* Diff results from previous node.  
    - *Outputs:* Adds `branchName` to JSON.  
    - *Edge Cases:* Date/time generation issues.

  - **Create Branch**  
    - *Type:* HTTP Request Node  
    - *Role:* Calls GitHub API to create a new branch reference at the commit SHA with the generated branch name.  
    - *Config:*  
      - URL: `https://api.github.com/repos/{repository}/git/refs`  
      - Method: POST  
      - Body: JSON with `ref` = `refs/heads/{branchName}`, `sha` = commit SHA  
      - Authentication: GitHub OAuth token  
    - *Inputs:* JSON containing `repository`, `branchName`, and `commitSha`.  
    - *Outputs:* GitHub API response confirming branch creation.  
    - *Edge Cases:* Branch already exists, permission denied, API limits.

#### 2.5 File Preparation and PR Creation

- **Overview:**  
  Extracts repository metadata needed for PR creation and submits a pull request with the config sync changes.

- **Nodes Involved:**  
  - Prepare File and Merge Result  
  - Create PR

- **Node Details:**

  - **Prepare File and Merge Result**  
    - *Type:* Code Node  
    - *Role:* Parses repository URL to extract username and repo name, computes new branch name from ref, and merges data for PR creation.  
    - *Config:* Parses `url` from input JSON, extracts components, and normalizes branch name.  
    - *Inputs:* Output from `Create Branch` node.  
    - *Outputs:* JSON enriched with `user`, `repoName`, `repoFullName`, `newBranch`, and `targetBranch`.  
    - *Edge Cases:* Missing or malformed URLs.

  - **Create PR**  
    - *Type:* HTTP Request Node  
    - *Role:* Calls GitHub API to create a pull request from the new branch to the target branch with a descriptive title and body.  
    - *Config:*  
      - URL: `https://api.github.com/repos/{repoFullName}/pulls`  
      - Method: POST  
      - Body includes PR title, body, head (branch), base (target branch), and maintainer modify permission.  
      - Headers include Authorization bearer token.  
      - Authentication: GitHub OAuth credentials.  
      - Error handling: continues on error to allow notification step.  
    - *Inputs:* Data from previous node including branch and repository info.  
    - *Outputs:* PR metadata such as PR number for notifications.  
    - *Edge Cases:* PR already exists, API rate limit, invalid tokens.

#### 2.6 Cache Invalidation

- **Overview:**  
  Decides if Xcode build cache invalidation should be triggered based on config diffs and updates workflow data accordingly.

- **Nodes Involved:**  
  - Invalidate Cache

- **Node Details:**

  - **Invalidate Cache**  
    - *Type:* Code Node  
    - *Role:* Checks if cache invalidation is flagged; if yes, adds cache invalidation status and message to output JSON.  
    - *Config:* Simulates cache invalidation by setting flags and messages. Real implementation would trigger Xcode derived data cleanup or similar.  
    - *Inputs:* Output from `Create PR` node.  
    - *Outputs:* JSON with `cacheInvalidated` boolean and message.  
    - *Edge Cases:* Real cache invalidation failures not handled here; this is simulation.

#### 2.7 Notification

- **Overview:**  
  Sends an email summarizing the config sync operation, including repository details, PR link, number of files updated, and cache invalidation status.

- **Nodes Involved:**  
  - Send Email Notification

- **Node Details:**

  - **Send Email Notification**  
    - *Type:* Gmail Node  
    - *Role:* Sends an email to the iOS team with a detailed summary of the sync including repository name, branch, PR number, updated files, cache invalidation status, and URLs.  
    - *Config:*  
      - To: `ios-team@example.com` (from config)  
      - Subject: `iOS Config Sync Completed - {repository}`  
      - Message body uses expressions to pull PR and change details dynamically.  
      - Uses Gmail OAuth2 credentials.  
    - *Inputs:* Final JSON data from cache invalidation node and PR metadata.  
    - *Outputs:* Confirmation of email sent.  
    - *Edge Cases:* Email sending failures, invalid credentials, missing data in message body.

---

### 3. Summary Table

| Node Name                   | Node Type             | Functional Role                                      | Input Node(s)                 | Output Node(s)              | Sticky Note                                                                                                                   |
|-----------------------------|-----------------------|-----------------------------------------------------|------------------------------|-----------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Github Push Trigger          | GitHub Trigger        | Listens for GitHub push events                       | —                            | SetConfiguration            | Watches for push events on the username/repo repository and captures commit, branch, and changed file details.               |
| SetConfiguration            | Set Node              | Defines static config parameters                      | Github Push Trigger           | Check Changed Files          | Defines env file path, config files, target branch, cache keys, PR labels, and email recipient.                               |
| Check Changed Files          | Code Node             | Detects if `.env.staging` was changed                 | SetConfiguration             | Perform Config Diff          | Parses commits to detect changes to the monitored environment file.                                                           |
| Perform Config Diff          | Code Node             | Simulates config file diffs and cache invalidation   | Check Changed Files           | Create Branch Name           | Analyzes env changes, determines file updates, and cache invalidation necessity.                                              |
| Create Branch Name           | Code Node             | Generates unique branch name with timestamp           | Perform Config Diff           | Create Branch                | Creates branch name prefix `ios-config-sync/` with timestamp suffix.                                                          |
| Create Branch                | HTTP Request          | Creates new branch in GitHub repository                | Create Branch Name            | Prepare File and Merge Result | Calls GitHub API to create branch at commit SHA.                                                                               |
| Prepare File and Merge Result| Code Node             | Parses repo info and merges data for PR               | Create Branch                | Create PR                   | Extracts user/repo from URL and prepares data for PR creation.                                                                 |
| Create PR                   | HTTP Request          | Opens pull request in GitHub with config changes      | Prepare File and Merge Result | Invalidate Cache             | Calls GitHub API to create PR from new branch to main branch with labels.                                                     |
| Invalidate Cache            | Code Node             | Flags and logs if Xcode cache invalidation is needed | Create PR                    | Send Email Notification      | Simulates cache invalidation and adds status message to workflow data.                                                        |
| Send Email Notification      | Gmail Node            | Sends email summary of sync to iOS team               | Invalidate Cache             | —                           | Sends notification email with PR link, change summary, and cache invalidation status.                                          |
| Sticky Note1                | Sticky Note           | Describes workflow blocks and node purposes           | —                            | —                           | Provides comprehensive explanation of each workflow block and node function.                                                   |
| Sticky Note                 | Sticky Note           | Workflow title and high-level description              | —                            | —                           | `iOS Environment Config Sync Wizard: .env to Xcode`                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create GitHub Push Trigger node**  
   - Type: `GitHub Trigger`  
   - Configure with OAuth credentials for GitHub.  
   - Set owner to `username` and repository to `repo_app`.  
   - Monitor the `push` event.  
   - Position appropriately.

2. **Create SetConfiguration node**  
   - Type: `Set`  
   - Define these string parameters:  
     - `envFilePath`: `.env.staging`  
     - `configFiles`: `["Info.plist", "Config.xcconfig"]` (JSON string)  
     - `targetBranch`: `main`  
     - `cacheInvalidationKeys`: `["API_KEY", "BUNDLE_VERSION", "ENVIRONMENT"]` (JSON string)  
     - `prLabels`: `["config-sync", "automated", "ios"]` (JSON string)  
     - `emailTo`: `ios-team@example.com`  
   - Connect GitHub Push Trigger output to SetConfiguration input.

3. **Create Check Changed Files node**  
   - Type: `Code`  
   - JavaScript code to:  
     - Extract `commits` from webhook payload.  
     - Flatten added/modified/removed files.  
     - Check if `.env.staging` (from config) is in changed files.  
     - Output JSON with repository name, ref, commit SHA, envFileChanged flag, list of changed files.  
   - Connect SetConfiguration output to this node.

4. **Create Perform Config Diff node**  
   - Type: `Code`  
   - JavaScript to:  
     - If `envFileChanged` is false, return empty.  
     - Parse `configFiles`, `targetBranch`, `cacheInvalidationKeys` from config.  
     - Simulate environment changes (hardcoded or dynamic).  
     - Prepare `configUpdates` array with old/new values per config file.  
     - Set `cacheInvalidationNeeded` if relevant keys changed.  
     - Output structured JSON with all info.  
   - Connect Check Changed Files output to this node.

5. **Create Create Branch Name node**  
   - Type: `Code`  
   - JavaScript to:  
     - Generate ISO timestamp, sanitize it (replace `:` and `.` with `-`).  
     - Create branch name prefixed with `ios-config-sync/` plus timestamp.  
     - Pass through all data plus new `branchName`.  
   - Connect Perform Config Diff output to this node.

6. **Create Create Branch node**  
   - Type: `HTTP Request`  
   - Configure:  
     - URL: `https://api.github.com/repos/{{ $json.repository }}/git/refs`  
     - Method: POST  
     - Body JSON: `{ "ref": "refs/heads/{{ $json.branchName }}", "sha": "{{ $json.commitSha }}" }`  
     - Authentication: Use GitHub OAuth credentials.  
     - Headers: Authorization `Bearer ${token}`, Content-Type `application/json`.  
     - Set error handling to continue on error.  
   - Connect Create Branch Name output to this node.

7. **Create Prepare File and Merge Result node**  
   - Type: `Code`  
   - JavaScript to:  
     - Parse repo URL from input JSON and extract user and repo names.  
     - Extract new branch name from `ref` field (remove `refs/heads/`).  
     - Include `targetBranch` from config.  
     - Output enriched JSON for PR.  
   - Connect Create Branch output to this node.

8. **Create Create PR node**  
   - Type: `HTTP Request`  
   - Configure:  
     - URL: `https://api.github.com/repos/{{ $json.repoFullName }}/pulls`  
     - Method: POST  
     - Body JSON:  
       ```json
       {
         "title": "Sync iOS Configurations",
         "body": "This PR syncs iOS configuration changes.",
         "head": "{{ $json.newBranch }}",
         "base": "{{ $json.targetBranch }}",
         "maintainer_can_modify": true
       }
       ```  
     - Authentication: GitHub OAuth credentials.  
     - Headers: Authorization `Bearer ${token}`, Content-Type `application/json`.  
     - Error handling: continue on error.  
   - Connect Prepare File and Merge Result output to this node.

9. **Create Invalidate Cache node**  
   - Type: `Code`  
   - JavaScript to:  
     - Check `cacheInvalidationNeeded`.  
     - If true, set `cacheInvalidated` true and add message with keys.  
     - Else, set `cacheInvalidated` false.  
     - Output updated JSON.  
   - Connect Create PR output to this node.

10. **Create Send Email Notification node**  
    - Type: `Gmail`  
    - Configure:  
      - To: `={{ $node["SetConfiguration"].json["emailTo"] }}`  
      - Subject: `iOS Config Sync Completed - {{ $json.head.repo.full_name }}`  
      - Message body:  
        ```
        Environment Configuration Sync Completed 
        Repository: {{ $json.head.repo.full_name }}
        Branch: {{ $('Prepare File and Merge Result').item.json.newBranch }}
        PR: #{{ $json.number }}

        Summary:
        - {{ $json.changed_files }} iOS config files updated
        - {{ $json.cacheInvalidated ? 'Xcode cache invalidation triggered' : 'No cache invalidation needed' }}

        Changes Made:
        {{ $json.configUpdates.map(u => `
        ${u.file}:
        ${u.changes.map(c => `  - ${c.key}: ${c.oldValue} → ${c.newValue}`).join('\n')}`).join('\n') }}

        View PR: https://github.com/{{ $json.head.repo.full_name }}/pull/{{ $json.number }}

        ---
        This email was automatically generated by the Environment Config Sync for iOS workflow.
        ```
      - Authentication: Gmail OAuth2 credentials.  
    - Connect Invalidate Cache output to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                               | Context or Link                                                                              |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| This workflow is designed specifically for syncing `.env.staging` environment changes to iOS Xcode config files, automating branch creation, PR submission, cache invalidation, and email notifications.                                                                                                       | Workflow purpose                                                                             |
| The cache invalidation step simulates Xcode cache cleanup; in production, integrate with scripts or tools that clean derived data or trigger Xcode rebuilds.                                                                                                                                              | Cache invalidation logic                                                                     |
| Email notifications are sent via Gmail OAuth2; ensure OAuth credentials have Gmail API scope enabled and token refresh capabilities configured properly.                                                                                                                                                   | Gmail OAuth2 setup                                                                           |
| The GitHub API calls require tokens with repo permissions to create branches and PRs; tokens must be stored securely in n8n credentials.                                                                                                                                                                  | GitHub OAuth token requirements                                                             |
| The workflow includes detailed sticky notes explaining each block for ease of understanding and maintenance.                                                                                                                                                                                              | See Sticky Note1 node in workflow                                                          |
| For further customization, environment changes and config diff logic need to be adapted to actual `.env` parsing and plist/xconfig file update mechanisms.                                                                                                                                               | Customization hint                                                                           |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.