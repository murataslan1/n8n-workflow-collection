AI Resume Processing and GitHub Analysis with VLM Run

https://n8nworkflows.xyz/workflows/ai-resume-processing-and-github-analysis-with-vlm-run-5306


# AI Resume Processing and GitHub Analysis with VLM Run

---

### 1. Workflow Overview

This workflow automates the processing of candidate resumes received via Gmail and enriches candidate profiles through AI-powered resume parsing and GitHub profile analysis. Its target use cases include HR departments, technical recruiting teams, and talent acquisition specialists seeking to streamline candidate evaluation by combining structured resume data with GitHub intelligence.

The workflow is logically divided into the following blocks:

- **1.1 Resume Intake & Trigger:** Watches Gmail inbox for incoming resumes with attachments and triggers processing.
- **1.2 AI Resume Parsing:** Uses the VLM Run API to extract structured candidate information from the resume attachments.
- **1.3 GitHub Profile Detection & Analysis:** Checks if the parsed data has a GitHub URL, extracts the username, fetches and analyzes GitHub profile and repositories data.
- **1.4 Data Aggregation:** Combines AI parsed data and GitHub analysis results into a unified candidate profile.
- **1.5 Multi-Channel Output & Notifications:** Saves candidate data to Google Sheets, sends Slack notifications to the hiring team, and emails an acknowledgment to the candidate.

---

### 2. Block-by-Block Analysis

#### 2.1 Resume Intake & Trigger

- **Overview:** Monitors Gmail inbox continuously for new emails containing resume attachments and downloads those attachments to start processing.
- **Nodes Involved:**  
  - Monitor Gmail for Resumes

- **Node Details:**

  - **Monitor Gmail for Resumes**  
    - *Type & Role:* Gmail Trigger node that polls the inbox for new emails with attachments.  
    - *Configuration:* Polls every minute; downloads attachments automatically; filters unspecified (accepts all emails).  
    - *Expressions/Variables:* None specific; triggers on any new email with attachment.  
    - *Inputs:* External trigger (Gmail inbox).  
    - *Outputs:* Passes email and attachment data downstream.  
    - *Edge Cases:* Missing attachments, unsupported file types, rate limiting by Gmail API.  
    - *Credentials:* Gmail OAuth2 account configured for access.

#### 2.2 AI Resume Parsing

- **Overview:** Sends the downloaded resume attachment to the VLM Run API to extract structured candidate data including contact info, skills, experience, and social profiles.
- **Nodes Involved:**  
  - Parse Resume with VLM Run

- **Node Details:**

  - **Parse Resume with VLM Run**  
    - *Type & Role:* Custom VLM Run node invoking AI resume parsing service.  
    - *Configuration:* Uses first attachment as input file; domain set to "document.resume" for resume parsing.  
    - *Expressions/Variables:* File input is `attachment_0` from Gmail trigger.  
    - *Inputs:* Resume file from Gmail trigger.  
    - *Outputs:* JSON structured candidate data with normalized fields.  
    - *Edge Cases:* API authentication errors, unsupported resume formats, parsing failures.  
    - *Credentials:* VLM Run API key.

#### 2.3 GitHub Profile Detection & Analysis

- **Overview:** Checks if parsed resume data includes a GitHub URL. If present, extracts the GitHub username, fetches profile and repositories data from GitHub API, and analyzes repository languages, frameworks, stars, and forks.
- **Nodes Involved:**  
  - Check for Github Profile  
  - Extract GitHub Username  
  - Fetch GitHub Profile  
  - Fetch GitHub Repositories  
  - Process Profile Data  
  - Analyze Repository Data  
  - Combine GitHub Data  

- **Node Details:**

  - **Check for Github Profile**  
    - *Type & Role:* If node that tests existence of GitHub URL in parsed data.  
    - *Configuration:* Condition checks if `$json.response.contact_info.github` exists and is non-empty.  
    - *Inputs:* Parsed resume JSON.  
    - *Outputs:* Branch 1 if GitHub URL exists, Branch 2 if not.  
    - *Edge Cases:* Missing or malformed GitHub URLs.  
    - *Version:* Uses version 2.2 for advanced if-node features.

  - **Extract GitHub Username**  
    - *Type & Role:* Code node extracting GitHub username from URL string.  
    - *Configuration:* Splits string by 'github.com/' and extracts the username segment.  
    - *Inputs:* GitHub URL string.  
    - *Outputs:* JSON object with `username` field.  
    - *Edge Cases:* Unexpected URL formats causing errors in string splitting.

  - **Fetch GitHub Profile**  
    - *Type & Role:* HTTP Request node querying GitHub API for user profile.  
    - *Configuration:* URL built dynamically as `https://api.github.com/users/{{ $json.username }}`.  
    - *Inputs:* GitHub username JSON.  
    - *Outputs:* GitHub user profile JSON.  
    - *Edge Cases:* Rate limiting, user not found, network issues.

  - **Fetch GitHub Repositories**  
    - *Type & Role:* HTTP Request node querying GitHub API for user repositories.  
    - *Configuration:* URL built dynamically as `https://api.github.com/users/{{ $json.username }}/repos`.  
    - *Inputs:* GitHub username JSON.  
    - *Outputs:* List of repositories JSON.  
    - *Edge Cases:* Rate limiting, empty repo list, API errors.

  - **Process Profile Data**  
    - *Type & Role:* Code node processing GitHub profile data.  
    - *Configuration:* Calculates approximate experience in years from account creation and last update dates, extracts followers count, public repos, and login.  
    - *Inputs:* GitHub profile JSON.  
    - *Outputs:* JSON with login, public_repos, followers, and approximate experience.  
    - *Edge Cases:* Missing or malformed date fields.

  - **Analyze Repository Data**  
    - *Type & Role:* Code node analyzing repository language and framework usage, aggregating stars and forks.  
    - *Configuration:* Scans repo language and description/topics for known frameworks; counts occurrences; sums stars and forks.  
    - *Inputs:* GitHub repositories JSON list.  
    - *Outputs:* Aggregated counts of languages, frameworks, total stars, total forks.  
    - *Edge Cases:* Repos with missing language or topics data.

  - **Combine GitHub Data**  
    - *Type & Role:* Merge node combining profile and repo analysis data streams.  
    - *Configuration:* Merges three inputs: profile data, repository data, and resume AI data (via later connection).  
    - *Inputs:* Outputs from Process Profile Data, Analyze Repository Data, and resume data.  
    - *Outputs:* Single merged JSON object with combined GitHub and resume info.  
    - *Edge Cases:* Missing inputs could cause incomplete merge.

#### 2.4 Data Aggregation

- **Overview:** Flattens and merges the resume parsed data and GitHub analysis results into a unified candidate profile JSON object.
- **Nodes Involved:**  
  - Flatten Response

- **Node Details:**

  - **Flatten Response**  
    - *Type & Role:* Code node combining multiple input streams into one flat JSON object.  
    - *Configuration:* Defensive checks to safely merge resume response, GitHub profile, and repository data into one object.  
    - *Inputs:* Array of three inputs: resume data, GitHub profile data, GitHub repo analysis data.  
    - *Outputs:* Single JSON object with all candidate data.  
    - *Edge Cases:* Missing any input index; null or undefined fields.

#### 2.5 Multi-Channel Output & Notifications

- **Overview:** Saves the aggregated candidate data into a Google Sheet, sends a Slack notification to the hiring team, and sends an acknowledgment email to the candidate.
- **Nodes Involved:**  
  - Save to Google Sheet  
  - Send Slack Notification  
  - Send Acknowledgement Email

- **Node Details:**

  - **Save to Google Sheet**  
    - *Type & Role:* Google Sheets node to append or update candidate data in a spreadsheet.  
    - *Configuration:* Maps multiple fields from JSON to sheet columns, including name, email, phone, GitHub URLs, project language counts, GitHub stats, LinkedIn URLs. Uses "Name" as matching column to avoid duplicates.  
    - *Inputs:* Flattened candidate JSON data.  
    - *Outputs:* Confirmation of sheet update.  
    - *Edge Cases:* Sheet access permissions, schema mismatch, rate limits.  
    - *Credentials:* Google Sheets OAuth2.

  - **Send Slack Notification**  
    - *Type & Role:* Slack node sending a formatted message to a specific channel via webhook.  
    - *Configuration:* Message includes candidate name, email, and link to Google Sheet with full details; markdown enabled. Channel selected by ID.  
    - *Inputs:* Flattened candidate JSON data.  
    - *Outputs:* Slack message confirmation.  
    - *Edge Cases:* Invalid channel, webhook failure, Slack API rate limits.  
    - *Credentials:* Slack API token.

  - **Send Acknowledgement Email**  
    - *Type & Role:* Gmail node sending an email to the candidate as receipt confirmation.  
    - *Configuration:* Sends to candidate email from parsed data; fixed subject and message thanking the candidate; sender name set to "VLM Run"; no attribution appended.  
    - *Inputs:* Flattened candidate JSON data.  
    - *Outputs:* Email sent confirmation.  
    - *Edge Cases:* Invalid or missing email address, Gmail API quota limits.  
    - *Credentials:* Gmail OAuth2 account.

---

### 3. Summary Table

| Node Name                   | Node Type                   | Functional Role                        | Input Node(s)                   | Output Node(s)                            | Sticky Note                                                                                                                  |
|-----------------------------|-----------------------------|-------------------------------------|--------------------------------|------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Monitor Gmail for Resumes    | gmailTrigger                | Trigger on new resume emails         | External (Gmail inbox)          | Parse Resume with VLM Run                 | 📧 Resume Intake Processing: watches Gmail, detects attachments, downloads resumes, triggers processing automatically          |
| Parse Resume with VLM Run    | vlmRun                      | AI resume parsing                    | Monitor Gmail for Resumes       | Check for Github Profile                  | 🤖 AI Resume Analysis: extracts structured candidate data from resumes                                                        |
| Check for Github Profile     | if                          | Checks if GitHub URL is present      | Parse Resume with VLM Run       | Extract GitHub Username (if true), Flatten Response (if false) |                                                                                                                              |
| Extract GitHub Username      | code                        | Extracts GitHub username from URL   | Check for Github Profile        | Fetch GitHub Profile, Fetch GitHub Repositories | 🔍 GitHub Intelligence Engine: deep analysis of GitHub profile and repos with technology detection                              |
| Fetch GitHub Profile         | httpRequest                 | Fetches GitHub user profile         | Extract GitHub Username         | Process Profile Data                      |                                                                                                                              |
| Fetch GitHub Repositories    | httpRequest                 | Fetches GitHub user repos           | Extract GitHub Username         | Analyze Repository Data                   |                                                                                                                              |
| Process Profile Data         | code                        | Calculates experience & profile stats | Fetch GitHub Profile            | Combine GitHub Data                       |                                                                                                                              |
| Analyze Repository Data      | code                        | Aggregates repo languages, frameworks, stars, forks | Fetch GitHub Repositories      | Combine GitHub Data                       |                                                                                                                              |
| Combine GitHub Data          | merge                       | Merges GitHub profile, repo, and resume data | Process Profile Data, Analyze Repository Data, Parse Resume with VLM Run | Flatten Response                        |                                                                                                                              |
| Flatten Response             | code                        | Flattens and merges all candidate data | Combine GitHub Data             | Send Slack Notification, Send Acknowledgement Email, Save to Google Sheet | 📊 Multi-Channel Output: saves to Google Sheets, sends Slack notifications, sends acknowledgment email                        |
| Save to Google Sheet         | googleSheets                | Stores candidate data in spreadsheet | Flatten Response               | None                                     |                                                                                                                              |
| Send Slack Notification      | slack                       | Notifies team about new application | Flatten Response               | None                                     |                                                                                                                              |
| Send Acknowledgement Email   | gmail                       | Sends acknowledgment to candidate   | Flatten Response               | None                                     |                                                                                                                              |
| 📋 Workflow Overview1        | stickyNote                  | Documentation overview               | None                          | None                                     | Overview of the entire workflow, use cases, requirements                                                                    |
| 🤖 AI Processing Documentation1 | stickyNote              | Documentation of AI resume parsing  | None                          | None                                     | Details on AI resume extraction capabilities                                                                                |
| 🔍 GitHub Analysis Documentation3 | stickyNote            | Documentation of GitHub analysis    | None                          | None                                     | Explains GitHub profile and repo data analysis approach                                                                    |
| 📧 Intake Documentation1     | stickyNote                  | Documentation of Gmail intake        | None                          | None                                     | Explains Gmail monitoring and attachment download process                                                                   |
| 📊 Output Documentation1     | stickyNote                  | Documentation of output channels     | None                          | None                                     | Details on Google Sheets, Slack, and email outputs                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node: Monitor Gmail for Resumes**  
   - Type: Gmail Trigger  
   - Credentials: Connect your Gmail OAuth2 account.  
   - Configuration: Set to poll every minute, enable attachment download. No filters needed unless desired to limit to specific sender or subject.

2. **Create AI Resume Parsing Node: Parse Resume with VLM Run**  
   - Type: VLM Run node (custom integration)  
   - Credentials: Configure with your VLM Run API key.  
   - Parameters: Use first attachment (`attachment_0`) as input file, set domain to "document.resume".

3. **Create Conditional Node: Check for Github Profile**  
   - Type: If node (version 2.2 or higher)  
   - Condition: Check if the expression `{{$json.response.contact_info.github}}` exists and is non-empty.

4. **Create Code Node: Extract GitHub Username**  
   - Type: Code  
   - Code:  
     ```javascript
     const url = $input.first().json.response.contact_info.github;
     const username = url.split('github.com/')[1].split('/')[0];
     return [{ json: { username } }];
     ```
   - Connect output of "Check for Github Profile" (true branch) to this node.

5. **Create HTTP Request Node: Fetch GitHub Profile**  
   - Type: HTTP Request  
   - URL: `https://api.github.com/users/{{ $json.username }}`  
   - Connect from "Extract GitHub Username".

6. **Create HTTP Request Node: Fetch GitHub Repositories**  
   - Type: HTTP Request  
   - URL: `https://api.github.com/users/{{ $json.username }}/repos`  
   - Connect from "Extract GitHub Username".

7. **Create Code Node: Process Profile Data**  
   - Type: Code  
   - Code:  
     ```javascript
     const user = items[0].json;
     const created = new Date(user.created_at);
     const updated = new Date(user.updated_at);
     const diffTime = Math.abs(updated - created);
     const years = diffTime / (1000 * 60 * 60 * 24 * 365.25);
     const experience = `~${Math.round(years)}`;
     return [{
       json: {
         login: user.login,
         public_repos: user.public_repos,
         followers: user.followers,
         experience
       }
     }];
     ```
   - Connect from "Fetch GitHub Profile".

8. **Create Code Node: Analyze Repository Data**  
   - Type: Code  
   - Code: Use the provided JavaScript code that counts languages, frameworks, stars, and forks from repositories, including a known frameworks list and helper functions as per the original.  
   - Connect from "Fetch GitHub Repositories".

9. **Create Merge Node: Combine GitHub Data**  
   - Type: Merge  
   - Number of inputs: 3  
   - Connect inputs:  
     - Input 1: "Process Profile Data"  
     - Input 2: "Analyze Repository Data"  
     - Input 3: Output from "Parse Resume with VLM Run" node (original resume data)  
   - Set merge mode to "Merge By Index" or default to combine data.

10. **Create Code Node: Flatten Response**  
    - Type: Code  
    - Code:  
      ```javascript
      const allItems = $input.all();
      const resumeData = allItems[0]?.json?.response || {};
      const githubData = allItems[1]?.json || {};
      const repoData = allItems[2]?.json || {};
      const mergedData = { ...githubData, ...resumeData, ...repoData };
      return [{ json: mergedData }];
      ```
    - Connect from "Combine GitHub Data".

11. **Create Google Sheets Node: Save to Google Sheet**  
    - Type: Google Sheets  
    - Credentials: Google Sheets OAuth2 account with write access.  
    - Operation: Append or Update  
    - Document ID: Your Google Sheet document ID  
    - Sheet Name: Specify sheet or gid (e.g., "gid=0")  
    - Mapping: Map fields like Name, Email, Phone no., GitHub URL, LinkedIn URL, language project counts (e.g., React Projects), GitHub stats (stars, forks), follower count, etc. Use expressions like `={{ $json.contact_info.full_name }}`, `={{ $json.languageCount?.React || null }}`, etc.  
    - Matching Columns: Use "Name" to avoid duplicates.

12. **Create Slack Node: Send Slack Notification**  
    - Type: Slack  
    - Credentials: Slack API token with permission to post messages.  
    - Channel: Set to desired Slack channel ID.  
    - Text: Use markdown to create a message with candidate name, email, and link to Google Sheet.  
    - Enable markdown formatting.

13. **Create Gmail Node: Send Acknowledgement Email**  
    - Type: Gmail  
    - Credentials: Gmail OAuth2 account.  
    - To: Candidate email from parsed data (`{{$json.contact_info.email}}`)  
    - Subject: "Thanks for Your Interest"  
    - Message: "We will get in touch shortly."  
    - Sender Name: "VLM Run"  
    - Disable attribution footer.

14. **Connect Outputs:**  
    - From "Flatten Response", connect to "Send Slack Notification", "Send Acknowledgement Email", and "Save to Google Sheet" nodes to trigger all three outputs concurrently.  
    - From "Check for Github Profile" false branch, connect directly to "Flatten Response" to handle cases without GitHub data.

15. **Add Sticky Notes for Documentation:**  
    - Add sticky notes summarizing each major section (intake, AI parsing, GitHub analysis, outputs, overview) for workflow clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                | Context or Link                                                                                                             |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| The workflow uses the VLM Run API for advanced AI resume parsing to reduce manual data entry and improve accuracy.                                                        | VLM Run API integration node                                                                                                 |
| GitHub analysis includes intelligent detection of technologies and frameworks, including frontend, backend, mobile, and DevOps tools.                                     | GitHub Intelligence Engine documentation sticky note                                                                         |
| The workflow supports real-time resume processing triggered by Gmail, ensuring timely candidate evaluation.                                                                | Gmail trigger node with attachment download                                                                                   |
| Multi-channel output includes Google Sheets for centralized data storage, Slack for team notifications, and Gmail for candidate communication.                            | Google Sheets, Slack, and Gmail nodes                                                                                        |
| Slack messages include a direct link to the Google Sheet for quick access to candidate details.                                                                             | Slack notification message configuration                                                                                      |
| The workflow handles gracefully missing GitHub profiles by skipping GitHub analysis and proceeding with resume data only.                                                 | Conditional node Check for Github Profile                                                                                     |
| Google Sheets schema includes over 20 columns covering personal info, social links, project counts by language, and GitHub stats to facilitate detailed candidate scoring. | Google Sheets node field mapping                                                                                              |
| Workflow requires proper OAuth2 credentials for Gmail, Google Sheets, and Slack, and API key for VLM Run.                                                                  | Credential setups                                                                                                            |
| For GitHub API requests, unauthenticated calls are used; consider adding authentication token to avoid rate limits in high-volume usage.                                | GitHub API HTTP Request nodes                                                                                                 |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, respecting all content policies and handling only legal, public data.

---