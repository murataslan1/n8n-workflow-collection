AI-Powered Bug Tracking with GitHub Issues and Telegram Alerts using Gemini

https://n8nworkflows.xyz/workflows/ai-powered-bug-tracking-with-github-issues-and-telegram-alerts-using-gemini-6701


# AI-Powered Bug Tracking with GitHub Issues and Telegram Alerts using Gemini

### 1. Workflow Overview

This workflow automates the creation of GitHub issues from incoming bug reports received through a webhook, leveraging AI-powered classification and summarization via Google Gemini (PaLM). It also incorporates Telegram notifications to alert relevant groups based on the severity of the bug, with an optional manager approval step for issue creation. The workflow is designed for teams requiring automated bug tracking and real-time communication.

**Logical blocks:**

- **1.1 Input Reception and Initial Processing:** Reception of bug report data via webhook and initial classification using AI.
- **1.2 Classification and Filtering:** AI classifies bug severity; data is filtered and prepared for summarization.
- **1.3 Summarization and Issue Creation:** AI summarizes bug descriptions; issues are created on GitHub if approved.
- **1.4 Approval Workflow:** Manager approval for issue creation on GitHub.
- **1.5 Notifications:** Telegram messages are sent to different groups based on severity and issue creation status.
- **1.6 Supporting Notes:** Sticky notes providing context, instructions, and links.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Initial Processing

- **Overview:**  
  Receives incoming bug report data via a webhook and initiates AI classification.

- **Nodes Involved:**  
  - Webhook  
  - Bug Classifier  
  - Google Gemini Chat Model (used internally by Bug Classifier)

- **Node Details:**  
  - **Webhook**  
    - Type: Webhook  
    - Role: Entry point receiving POST requests at path `c16e3a34-5998-41c2-8a94-c9f0bddf3f27`.  
    - Config: Listens for POST requests.  
    - Inputs: External HTTP request with JSON body (expected keys: message, name, userId).  
    - Outputs: Passes data to Bug Classifier.  
    - Edge cases: Invalid JSON payload, missing fields, HTTP errors.

  - **Bug Classifier**  
    - Type: AI Text Classifier (n8n-nodes-langchain.textClassifier)  
    - Role: Classifies the bug report message into "High" or "Low" severity using Google Gemini.  
    - Config: Uses a system prompt defining categories "High" (disrupts main user flow) and "Low" (does not disrupt main flow but affects experience).  
    - Input: `message` field from webhook JSON.  
    - Output: Classification result including severity category and approval flag.  
    - Credentials: Google Gemini (PaLM) API.  
    - Edge cases: API timeouts, classification errors, unexpected outputs.

  - **Google Gemini Chat Model**  
    - Type: Language Model node used by Bug Classifier internally.  
    - Role: Processes classification prompt and returns JSON classification response.  
    - Credentials: Google Gemini (PaLM) API.  
    - Edge cases: API quota limits, authentication failures.

---

#### 2.2 Classification and Filtering

- **Overview:**  
  Filters and maps relevant data from previous steps to prepare for summarization.

- **Nodes Involved:**  
  - Filter (Set node)  
  - Sticky Note1 (contextual information)

- **Node Details:**  
  - **Filter**  
    - Type: Set node  
    - Role: Extracts and assigns key fields (`message`, `body.name`, `body.userId`) from webhook and classification outputs for further processing.  
    - Config:  
      - `message` = `Webhook.body.message`  
      - `body.name` = `Webhook.body.name`  
      - `body.userId` = `Webhook.body.userId`  
    - Edge cases: Missing or malformed input data.

  - **Sticky Note1**  
    - Type: Sticky Note  
    - Role: Provides explanation to ensure only relevant values pass to summarizer.

---

#### 2.3 Summarization and Issue Creation

- **Overview:**  
  Summarizes the bug report text with AI and creates a GitHub issue if appropriate.

- **Nodes Involved:**  
  - Bug Description Summarizer  
  - Google Gemini Chat Model1 (used internally by Summarizer)  
  - Create an issue  
  - Sticky Note2 (GitHub repo info)

- **Node Details:**  
  - **Bug Description Summarizer**  
    - Type: AI Text Summarization Chain  
    - Role: Produces a concise summary of the bug report description using Google Gemini.  
    - Config: Large chunk size (100000) to accommodate long texts.  
    - Input: Filtered `message` text.  
    - Output: Summarized text used for GitHub issue body.  
    - Credentials: Google Gemini (PaLM) API.  
    - Edge cases: API response delays, incomplete summaries.

  - **Google Gemini Chat Model1**  
    - Type: Language Model node used by Summarizer internally.  
    - Credentials: Google Gemini (PaLM) API.

  - **Create an issue**  
    - Type: GitHub node  
    - Role: Creates a new issue in a specified GitHub repository with summary, description, and image.  
    - Config:  
      - Owner: GitHub user/organization URL (`https://github.com/rully-saputra15`)  
      - Repository: (empty, requires user customization)  
      - Title: Includes reporter name and userId.  
      - Body: Combines summary, original description, and image URL from classifier.  
      - Labels and assignees: Empty (customizable).  
    - Credentials: GitHub OAuth token.  
    - Edge cases: Authentication errors, repository access issues, API rate limits.  
    - Outputs: GitHub issue data including HTML URL for reference.

  - **Sticky Note2**  
    - Type: Sticky Note  
    - Role: Reminds user to customize repository link.

---

#### 2.4 Approval Workflow

- **Overview:**  
  Sends an approval request email to a manager for confirmation before creating GitHub issues for bugs.

- **Nodes Involved:**  
  - Approval from Manager  
  - If node (condition check on approval)  
  - Sticky Note4 (severity condition definition)

- **Node Details:**  
  - **Approval from Manager**  
    - Type: Gmail node  
    - Role: Sends an email with approval request containing bug report details and waits for manager approval.  
    - Config:  
      - SendTo: `rully.saputra4@gmail.com`  
      - Subject: Includes reporter name.  
      - Message: Includes bug message, reporter name, and userId.  
      - Operation: `sendAndWait` with double approval option (requires explicit approval).  
    - Credentials: Gmail OAuth2.  
    - Edge cases: Email sending failures, approval timeouts, invalid email addresses.

  - **If**  
    - Type: Conditional node  
    - Role: Checks if approval flag `data.approved` is true.  
    - Config: Boolean condition on `$json.data.approved`.  
    - Outputs:  
      - True: Proceed to Filter node for further processing.  
      - False: Sends notification to group (low severity path).  
    - Edge cases: Missing approval data, logic errors.

  - **Sticky Note4**  
    - Type: Sticky Note  
    - Role: Advises defining severity conditions based on data.

---

#### 2.5 Notifications

- **Overview:**  
  Sends Telegram notifications to groups about the bug report, differentiating between low and high severity.

- **Nodes Involved:**  
  - Notify Group (for low severity)  
  - Notify Manager Group (for high severity after issue creation)  
  - Sticky Note3 (Telegram instructions)

- **Node Details:**  
  - **Notify Group**  
    - Type: Telegram node  
    - Role: Sends a message to a Telegram chat for low severity bugs.  
    - Config:  
      - Text includes severity (Low), issue message, reporter name, user ID.  
      - `chatId`: Empty (should be user-configured).  
    - Credentials: Telegram API token.  
    - Edge cases: Invalid chat ID, API errors, message formatting issues.

  - **Notify Manager Group**  
    - Type: Telegram node  
    - Role: Sends a high severity notification with GitHub issue link after issue creation.  
    - Config:  
      - Text includes severity (High), summary, issue message, reporter details, and GitHub issue URL.  
      - `chatId`: Empty (must be configured).  
    - Credentials: Telegram API token.  
    - Edge cases: Similar to Notify Group.

  - **Sticky Note3**  
    - Type: Sticky Note  
    - Role: Provides link to Telegram node documentation and advises on message customization.

---

#### 2.6 Supporting Notes

- **Sticky Note (General Overview)**  
  - Explains the overall purpose: automating GitHub issue creation and Telegram notification using Gemini AI.  
  - Suggests enhancement by adding manager approval for low-severity bugs.  
  - Notes applicability for teams needing instant bug report visibility.  
  - Mentions possibility to swap Telegram for other messaging platforms.

---

### 3. Summary Table

| Node Name                 | Node Type                           | Functional Role                                 | Input Node(s)          | Output Node(s)            | Sticky Note                                                                                                                      |
|---------------------------|-----------------------------------|------------------------------------------------|------------------------|---------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Webhook                   | Webhook                           | Entry point receiving bug report POST requests | -                      | Bug Classifier            | ## Auto-Create GitHub Issues from Webhook Events & Notify via Telegram 🚀 Automate bug or task creation using a smart classifier and summarizer powered by Gemini. |
| Bug Classifier            | AI Text Classifier                 | Classifies bug severity via Google Gemini AI   | Webhook                 | Filter, Approval from Manager | Define the conditions for “High” vs “Low” severity based on your data.                                                         |
| Google Gemini Chat Model  | Language Model (Google Gemini)    | AI backend for Bug Classifier                   | Bug Classifier (internal) | Bug Classifier (internal)   |                                                                                                                                 |
| Filter                    | Set                               | Extracts relevant data for summarization       | Bug Classifier, If       | Bug Description Summarizer | ## Filter Ensure that only the relevant value is passed to the bug description summarizer.                                      |
| Bug Description Summarizer| AI Text Summarization Chain       | Summarizes bug description text                 | Filter                   | Create an issue            |                                                                                                                                 |
| Google Gemini Chat Model1 | Language Model (Google Gemini)    | AI backend for Summarizer                        | Bug Description Summarizer (internal) | Bug Description Summarizer (internal) |                                                                                                                                 |
| Create an issue           | GitHub                            | Creates GitHub issue for approved bugs          | Bug Description Summarizer | Notify Manager Group       | ## Github You can change with your repo link.                                                                                   |
| Approval from Manager     | Gmail (sendAndWait with approval) | Requests manager approval to create issue       | Bug Classifier           | If                        | Define the conditions for “High” vs “Low” severity based on your data.                                                         |
| If                       | If                                | Checks if manager approved issue creation       | Approval from Manager    | Filter (True), Notify Group (False) |                                                                                                                                 |
| Notify Group              | Telegram                          | Sends Telegram notification for low severity    | If                       | -                         | ## Messaging Platform You can use separate approaches for Telegram messages based on low or high severity. Telegram tutorial: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/message-operations/#send-message |
| Notify Manager Group      | Telegram                          | Sends Telegram notification for high severity   | Create an issue           | -                         | ## Messaging Platform You can use separate approaches for Telegram messages based on low or high severity. Telegram tutorial: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/message-operations/#send-message |
| Sticky Note               | Sticky Note                       | Overview and instructions                        | -                        | -                         | ## Auto-Create GitHub Issues from Webhook Events & Notify via Telegram 🚀 Automate bug or task creation using a smart classifier and summarizer powered by Gemini.          |
| Sticky Note1              | Sticky Note                       | Notes on filtering                               | -                        | -                         | ## Filter Ensure that only the relevant value is passed to the bug description summarizer.                                      |
| Sticky Note2              | Sticky Note                       | GitHub repo customization note                   | -                        | -                         | ## Github You can change with your repo link.                                                                                   |
| Sticky Note3              | Sticky Note                       | Telegram messaging customization and link       | -                        | -                         | ## Messaging Platform You can use separate approaches for Telegram messages based on low or high severity. Telegram tutorial: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/message-operations/#send-message |
| Sticky Note4              | Sticky Note                       | Severity condition advice                         | -                        | -                         | Define the conditions for “High” vs “Low” severity based on your data.                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `c16e3a34-5998-41c2-8a94-c9f0bddf3f27`  
   - Purpose: Entry point for receiving bug report JSON payloads.

2. **Create Bug Classifier node**  
   - Type: AI Text Classifier (`@n8n/n8n-nodes-langchain.textClassifier`)  
   - Input Text: `={{ $json.body.message }}` from Webhook node  
   - System Prompt: Classification into "High" or "Low" severity categories with JSON output only.  
   - Categories:  
     - High: Bug disrupts main user flow  
     - Low: Bug affects UX but not main flow  
   - Credentials: Google Gemini (PaLM) API setup required.  
   - Connect Webhook → Bug Classifier

3. **Create Gmail node for Approval from Manager**  
   - Type: Gmail  
   - Operation: `sendAndWait` with double approval required  
   - Send To: Manager email (e.g., `rully.saputra4@gmail.com`)  
   - Subject: Include reporter name dynamically (`=Approval to create a issue bug by {{ $json.body.name }}`)  
   - Message: Include bug message, reporter name, and userId.  
   - Credentials: Gmail OAuth2 setup required.  
   - Connect Bug Classifier → Approval from Manager

4. **Add If node to check approval**  
   - Condition: Boolean check if `={{ $json.data.approved }}` is true  
   - True output: Proceed to Filter  
   - False output: Proceed to Notify Group (low severity notification)

5. **Create Filter node (Set type)**  
   - Assign fields:  
     - `message` = `={{ $('Webhook').item.json.body.message }}`  
     - `body.name` = `={{ $('Webhook').item.json.body.name }}`  
     - `body.userId` = `={{ $('Webhook').item.json.body.userId }}`  
   - Connect If (true) → Filter

6. **Create Bug Description Summarizer node**  
   - Type: AI Text Summarization Chain (`@n8n/n8n-nodes-langchain.chainSummarization`)  
   - Input: `message` from Filter node  
   - Chunk Size: Large (e.g., 100000) for long texts  
   - Credentials: Google Gemini (PaLM) API  
   - Connect Filter → Bug Description Summarizer

7. **Create GitHub node to Create an issue**  
   - Owner: Set to GitHub user/org URL (e.g., `https://github.com/rully-saputra15`)  
   - Repository: Specify your repo name (mandatory)  
   - Title: `=New issue from {{ $('Filter').item.json.body.name }} - {{ $('Filter').item.json.body.userId }}`  
   - Body:  
     ```
     Summary:
     {{ $json.output.text }}

     Description:
     {{ $('Filter').item.json.message }}

     Image: ![Image]({{ $('Bug Classifier').item.json.body.imageUrl }})
     ```  
   - Labels/Assignees: Optional, configure as needed  
   - Credentials: GitHub OAuth token required  
   - Connect Bug Description Summarizer → Create an issue

8. **Create Telegram node Notify Manager Group**  
   - Chat ID: Your Telegram group chat ID (required)  
   - Text:  
     ```
     ❗❗❗Severity: High❗❗❗

     Summary: {{ $('Bug Description Summarizer').item.json.output.text }}

     Issue: {{ $('Bug Classifier').item.json.body.message }}

     Name: {{ $('Bug Classifier').item.json.body.name }}

     User ID: {{ $('Bug Classifier').item.json.body.userId }}

     Github Link: {{ $json.html_url }}
     ```  
   - Credentials: Telegram API token  
   - Connect Create an issue → Notify Manager Group

9. **Create Telegram node Notify Group (low severity)**  
   - Chat ID: Your Telegram group chat ID (required)  
   - Text:  
     ```
     Severity: Low

     Issue: {{ $('Bug Classifier').item.json.body.message }}

     Name: {{ $('Bug Classifier').item.json.body.name }}

     User ID: {{ $('Bug Classifier').item.json.body.userId }}
     ```  
   - Credentials: Telegram API token  
   - Connect If (false) → Notify Group

10. **Add Sticky Notes for documentation** (optional but recommended)  
    - Add notes explaining workflow overview, filtering logic, GitHub repo customization, messaging platform instructions, and severity condition definition.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                      | Context or Link                                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Automate bug or task creation using a smart classifier and summarizer powered by Gemini. This setup listens for incoming data, classifies it, and sends Telegram notifications. | Workflow overview sticky note.                                                                                   |
| To make it more robust, consider adding manager approval for low-severity issues, if only high-severity issues should create GitHub issues.                                     | Workflow overview sticky note.                                                                                   |
| You can replace Telegram with your preferred messaging platform if desired.                                                                                                      | Workflow overview sticky note.                                                                                   |
| Define the conditions for “High” vs “Low” severity based on your data and business rules.                                                                                         | Sticky Note4                                                                                                     |
| Ensure that only relevant data values are passed to the bug description summarizer to avoid processing unnecessary information.                                                  | Sticky Note1                                                                                                     |
| Customize the GitHub repository link in the Create Issue node to match your target repo.                                                                                         | Sticky Note2                                                                                                     |
| Telegram tutorial for sending messages in n8n: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/message-operations/#send-message                      | Sticky Note3                                                                                                     |

---

**Disclaimer:** The provided content is extracted exclusively from an n8n automated workflow. It complies strictly with applicable content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.