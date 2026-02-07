Automate Bug Reports with Gemini AI: Jotform to GitHub with Telegram Alerts

https://n8nworkflows.xyz/workflows/automate-bug-reports-with-gemini-ai--jotform-to-github-with-telegram-alerts-9655


# Automate Bug Reports with Gemini AI: Jotform to GitHub with Telegram Alerts

### 1. Workflow Overview

This workflow automates the management of bug reports submitted through a JotForm form. It is designed to:

- Receive bug report submissions via JotForm.
- Use an AI agent powered by Google Gemini Chat and LangChain to analyze the bug description.
- Check if the bug already exists in a specified GitHub repository.
- Create a new GitHub issue if the bug is unique.
- Log all submissions and analysis results in a Google Sheet.
- Send a dynamic notification message to a Telegram chat, informing the team about the bug report status.

**Logical blocks:**

- **1.1 Input Reception:** Captures bug report submissions from JotForm.
- **1.2 AI Processing and GitHub Integration:** The AI agent reviews the bug, checks GitHub issues, and creates new issues as needed.
- **1.3 Data Logging:** Stores the bug report and analysis results in Google Sheets.
- **1.4 Notification:** Sends a Telegram message summarizing the bug status.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block triggers the workflow when a bug report is submitted via JotForm, extracting the form data for processing.

**Nodes Involved:**  
- JotForm Trigger

**Node Details:**

- **JotForm Trigger**  
  - *Type & Role:* Trigger node that activates the workflow upon form submission.  
  - *Configuration:* Configured to listen to form ID `252865896233066` with `onlyAnswers` set to false to capture all form data.  
  - *Expressions/Variables:* Outputs the entire raw request data including the bug description and user details.  
  - *Input/Output:* No input; outputs form submission JSON.  
  - *Edge Cases:* Failure can occur if the form ID is incorrect or API credentials are invalid. Network issues may cause webhook delivery failures.  
  - *Credentials:* Uses JotForm API credentials named "secondary".

---

#### 1.2 AI Processing and GitHub Integration

**Overview:**  
This block leverages an AI agent to analyze the bug description, check for duplicates in GitHub issues, and create a new issue if necessary.

**Nodes Involved:**  
- AI Agent  
- Google Gemini Chat Model  
- Get issues of a repository in GitHub  
- Create an issue in GitHub  
- Structured Output Parser

**Node Details:**

- **AI Agent**  
  - *Type & Role:* LangChain AI agent node; orchestrates AI logic and tool usage.  
  - *Configuration:*  
    - Prompt instructs the agent to:  
      1. Read the bug description from the JotForm submission (`$json.rawRequest['Bug Description']`).  
      2. Use the "Get issues of a repository in GitHub" tool to check for duplicates.  
      3. Use the "Create an issue in GitHub" tool if no duplicate is found.  
      4. Output a JSON with keys: `issue_name`, `issue_description`, and `present_in_github`.  
  - *Expressions:* Uses dynamic expressions to access form data and tool outputs.  
  - *Input:* Receives form submission from JotForm Trigger.  
  - *Output:* Sends structured JSON with bug status.  
  - *Edge Cases:* AI prompt or parsing errors can occur; tool authorization or API rate limits may cause failures.  
  - *Sub-workflows:* Integrates GitHub tools and language model nodes.

- **Google Gemini Chat Model**  
  - *Type & Role:* AI language model node providing the GPT-like backend for the AI Agent.  
  - *Configuration:* Default options, authenticated with Google PaLM API credentials named "Google Gemini(PaLM) Api account".  
  - *Input/Output:* Connected as AI language model to AI Agent.  
  - *Edge Cases:* API quota or auth failures possible.

- **Get issues of a repository in GitHub**  
  - *Type & Role:* GitHub API tool to fetch repository issues.  
  - *Configuration:* Owner and repository fields set dynamically (expression placeholders `=` in JSON).  
  - *Credentials:* Uses GitHub API credentials named "GitHub account".  
  - *Input/Output:* Invoked as a tool by AI Agent to check existing issues.  
  - *Edge Cases:* GitHub rate limits, permission errors, or incorrect repo info.

- **Create an issue in GitHub**  
  - *Type & Role:* GitHub API tool to create a new issue.  
  - *Configuration:* Title and body set dynamically from AI Agent outputs via `$fromAI`. Owner and repo set dynamically. No labels or assignees configured.  
  - *Credentials:* Same as above.  
  - *Input/Output:* Invoked as a tool by AI Agent to create an issue when needed.  
  - *Edge Cases:* Auth failures, API limits, invalid data from AI.

- **Structured Output Parser**  
  - *Type & Role:* Parses AI Agent output JSON into structured data.  
  - *Configuration:* Example JSON schema with keys: `issue_name`, `issue_description`, `present_in_github`.  
  - *Input/Output:* Connected as output parser to AI Agent.  
  - *Edge Cases:* Parsing errors if AI output deviates from schema.

---

#### 1.3 Data Logging

**Overview:**  
Logs each bug report and its GitHub status into a Google Sheet for tracking and archival.

**Nodes Involved:**  
- Append or update row in sheet

**Node Details:**

- **Append or update row in sheet**  
  - *Type & Role:* Google Sheets node to append or update rows.  
  - *Configuration:*  
    - Maps form submission data (`submissionID`, user email, full name) and AI outputs (`issue_description`, `present_in_github?`) to columns `id`, `email`, `Full name`, `issue`, and `present_in_github?`.  
    - Uses the sheet named `Sheet1` in document ID `1WhQv-pyvnN4-j2hvH7DgYXSS3BZKrCLZlzV2a3eVJAw`.  
    - Uses `submissionID` as matching column for update or append.  
  - *Credentials:* Uses Google Sheets OAuth2 API credentials named "Google Sheets account".  
  - *Input/Output:* Receives AI Agent output, outputs enriched JSON for next node.  
  - *Edge Cases:* API quota limits, permission errors, or schema mismatch.

---

#### 1.4 Notification

**Overview:**  
Constructs a user-friendly message based on the issue status and sends it as a Telegram message to notify the team.

**Nodes Involved:**  
- Code in JavaScript  
- Send a text message

**Node Details:**

- **Code in JavaScript**  
  - *Type & Role:* Executes JavaScript to prepare the notification message.  
  - *Configuration:*  
    - Reads `issue` description and `present_in_github?` from Google Sheets output.  
    - Builds a message string with conditional content depending on whether the issue is already present on GitHub.  
    - Adds the message as `message` property in JSON output.  
  - *Expressions:* Uses standard JavaScript accessing `items[0].json`.  
  - *Input/Output:* Input from Google Sheets node; output to Telegram node.  
  - *Edge Cases:* Missing or malformed data may cause message errors.

- **Send a text message**  
  - *Type & Role:* Telegram node to send chat messages.  
  - *Configuration:*  
    - Sends the `message` property as the Telegram message text.  
    - Sends to a configured Telegram chat ID (placeholder `"enter-your-chat-id"` in JSON).  
    - `appendAttribution` is set to false to avoid extra branding.  
  - *Credentials:* Uses Telegram API credentials named "jobaibot".  
  - *Input/Output:* Receives message JSON from JavaScript node; no output.  
  - *Edge Cases:* Invalid chat ID, Telegram API failures, or credential issues.

---

### 3. Summary Table

| Node Name                      | Node Type                            | Functional Role                       | Input Node(s)            | Output Node(s)               | Sticky Note                                                                                                          |
|-------------------------------|------------------------------------|-------------------------------------|-------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------|
| JotForm Trigger                | n8n-nodes-base.jotFormTrigger      | Input Reception (form submission)   |                         | AI Agent                    | This workflow automates bug report handling from form submission to GitHub and notifications.                        |
| AI Agent                      | @n8n/n8n-nodes-langchain.agent     | AI Processing & GitHub Integration  | JotForm Trigger, Gemini Chat Model, Structured Output Parser, GitHub tools | Append or update row in sheet | This workflow automates bug report handling from form submission to GitHub and notifications.                        |
| Google Gemini Chat Model       | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | AI Language Model backend            |                         | AI Agent                    | This workflow automates bug report handling from form submission to GitHub and notifications.                        |
| Get issues of a repository in GitHub | n8n-nodes-base.githubTool           | GitHub issue lookup tool             |                         | AI Agent                    | This workflow automates bug report handling from form submission to GitHub and notifications.                        |
| Create an issue in GitHub      | n8n-nodes-base.githubTool           | GitHub issue creation tool           |                         | AI Agent                    | This workflow automates bug report handling from form submission to GitHub and notifications.                        |
| Structured Output Parser       | @n8n/n8n-nodes-langchain.outputParserStructured | AI output JSON parsing               |                         | AI Agent                    | This workflow automates bug report handling from form submission to GitHub and notifications.                        |
| Append or update row in sheet  | n8n-nodes-base.googleSheets         | Data Logging in Google Sheets       | AI Agent                 | Code in JavaScript           | This workflow automates bug report handling from form submission to GitHub and notifications.                        |
| Code in JavaScript             | n8n-nodes-base.code                 | Notification Message Preparation    | Append or update row in sheet | Send a text message          | This workflow automates bug report handling from form submission to GitHub and notifications.                        |
| Send a text message            | n8n-nodes-base.telegram             | Sends Telegram notification         | Code in JavaScript        |                             | This workflow automates bug report handling from form submission to GitHub and notifications.                        |
| Sticky Note                   | n8n-nodes-base.stickyNote            | Workflow explanation                 |                         |                             | This workflow automates the process of handling bug reports submitted through a form, from checking for duplicates on GitHub to logging the report and sending a notification. A bug report is submitted via a JotForm, initiating the workflow. An AI agent checks for duplicates on GitHub, creating a new issue if the bug is unique. The form submission and the AI's analysis are logged in a Google Sheet for record-keeping. A dynamic notification is sent to a Telegram chat, alerting the team to the new or existing issue. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the JotForm Trigger node:**  
   - Type: `JotForm Trigger`  
   - Configure form ID to `252865896233066` (your bug report form).  
   - Set `onlyAnswers` to false to receive full form data.  
   - Assign your JotForm API credentials.  

2. **Add a Google Gemini Chat Model node:**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`  
   - Authenticate with your Google PaLM API credentials.  
   - Use default options.  

3. **Add GitHub "Get issues of a repository" node:**  
   - Type: `n8n-nodes-base.githubTool`  
   - Set resource to `repository` and operation to retrieve issues.  
   - Dynamically set repository owner and repository name via expressions (e.g., from environment variables or workflow parameters).  
   - Assign GitHub API credentials.  

4. **Add GitHub "Create an issue" node:**  
   - Type: `n8n-nodes-base.githubTool`  
   - Configure to create an issue with dynamic `title` and `body` fields (populated from AI outputs).  
   - Set owner and repository dynamically as above.  
   - No labels or assignees needed.  
   - Assign GitHub credentials.  

5. **Add Structured Output Parser node:**  
   - Type: `@n8n/n8n-nodes-langchain.outputParserStructured`  
   - Provide a JSON schema example with keys:  
     ```json
     {
       "issue_name": "Example issue title",
       "issue_description": "Detailed description of the issue",
       "present_in_github": false
     }
     ```  
   - Connect as the AI Agent’s output parser.  

6. **Add AI Agent node:**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Set the prompt to:  
     ```
     1. Firstly read the user submitted bug description from the below content:

     {{ $json.rawRequest['Bug Description'] }}

     2. Then secondly check whether the bug is already created in github repo or not for that use the tool named "Get issues of a repository in GitHub" and just check whethere the bug is already listed or not based on the context.

     3. If that particular issue is not there in github repo then simply create a new issue with appropiate names and for that just use the tool named "Create an issue in GitHub".

     4. And then only after following these above 3 steps above and then give output only in JSON with appropiate details:

     example output:
     {
       "issue_name": "UI Freeze on Back Navigation from Settings to Home",
       "issue_description": "A critical navigation bug occurs when a user attempts to return to the Home screen from the Settings screen. Upon initiating the back navigation action, the application's view transitions to the Home screen, but the user interface becomes completely unresponsive. All interactive elements fail to register any input, effectively trapping the user on a frozen Home screen and necessitating a full application restart to restore functionality.",
       "present_in_github": false
     }
     ```  
   - Link the `Google Gemini Chat Model` as AI language model.  
   - Link GitHub "Get issues" and "Create issue" nodes as tools.  
   - Link the Structured Output Parser as output parser.  
   - Connect input from JotForm Trigger.  

7. **Add Google Sheets node "Append or update row in sheet":**  
   - Type: `n8n-nodes-base.googleSheets`  
   - Configure to append or update rows using:  
     - Document ID: `1WhQv-pyvnN4-j2hvH7DgYXSS3BZKrCLZlzV2a3eVJAw` (your Google Sheet for bug logs).  
     - Sheet name or GID: `Sheet1` or `gid=0`.  
     - Matching column: `id` (mapped from `submissionID` from JotForm).  
     - Map columns:  
       - `id` ← submissionID  
       - `email` ← `Your Email Address` from form  
       - `Full name` ← concatenate first and last name from form  
       - `issue` ← `issue_description` from AI Agent output  
       - `present_in_github?` ← `present_in_github` from AI Agent output  
   - Assign Google Sheets OAuth2 credentials.  
   - Connect input from AI Agent.  

8. **Add Code node "Code in JavaScript":**  
   - Type: `n8n-nodes-base.code`  
   - Paste this JavaScript:  
     ```javascript
     const item = items[0];

     const issueDetails = item.json.issue;
     const isPresentOnGithub = item.json['present_in_github?'];

     let message = `An user submitted an issue....\n\n**Issue:** "${issueDetails}"\n\n`;

     if (isPresentOnGithub) {
       message += "✅ You don't need to do anything regarding this, as the issue is already reported on GitHub.";
     } else {
       message += "❗ Please look into this. The issue has just been created in our GitHub repo, so take your time to review and fix it.";
     }

     item.json.message = message;

     return item;
     ```  
   - Connect input from Google Sheets node.  

9. **Add Telegram node "Send a text message":**  
   - Type: `n8n-nodes-base.telegram`  
   - Set text to `={{ $json.message }}` to send the prepared message.  
   - Enter your Telegram chat ID in `chatId`.  
   - Set `appendAttribution` to false.  
   - Assign Telegram API credentials.  
   - Connect input from Code node.  

10. **Add Sticky Note for documentation:**  
    - Add a sticky note node describing the workflow purpose and logical flow for users.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                               | Context or Link                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow automates the process of handling bug reports submitted through a form, from checking for duplicates on GitHub to logging the report and sending a notification. | Overview sticky note content attached in workflow.                                                  |
| For detailed GitHub API usage and rate limits, see: https://docs.github.com/en/rest/reference/issues                                                          | GitHub API documentation                                                                            |
| Google Gemini (PaLM) API requires appropriate quota and billing enabled in Google Cloud Console.                                                            | Google PaLM API docs: https://developers.generativeai.google/api/guides/chat                      |
| Telegram Bot API documentation for chat and messaging: https://core.telegram.org/bots/api                                                                     | Telegram Bot API                                                                                   |
| JotForm Webhooks and API: https://api.jotform.com/docs/                                                                                                     | JotForm integration reference                                                                      |
| Google Sheets API limits and best practices: https://developers.google.com/sheets/api/guides/limits                                                          | Google Sheets API                                                                                   |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, respecting all current content policies. It contains no illegal, offensive, or protected elements. All data processed is legal and public.