AI-Powered Knowledge Assistant using Google Sheets, OpenAI, and Supabase Vector Search

https://n8nworkflows.xyz/workflows/ai-powered-knowledge-assistant-using-google-sheets--openai--and-supabase-vector-search-4476


# AI-Powered Knowledge Assistant using Google Sheets, OpenAI, and Supabase Vector Search

### 1. Workflow Overview

This workflow automates an AI-powered code review process triggered by GitHub push events. When code is pushed to a specified repository, the workflow fetches commit details and diffs, formats them into HTML, sends the code diff to an AI agent for review, and emails the AI-generated review summary. The workflow integrates GitHub triggers, HTTP API calls, JavaScript formatting, AI language models, and email notifications.

**Logical blocks:**

- **1.1 GitHub Event Reception:** Listens for GitHub push events on a specified repository and extracts commit metadata.

- **1.2 Commit Data Retrieval and Parsing:** Uses GitHub API to fetch detailed commit data, parses relevant fields for subsequent processing.

- **1.3 Code Formatting:** Processes the commit diff data into a readable, color-coded HTML representation.

- **1.4 AI Code Review:** Sends the formatted commit diff HTML to a LangChain AI agent configured with a custom prompt to perform code review.

- **1.5 Output Formatting and Email Notification:** Combines AI review output with formatted commit info and sends an email notification.

- **1.6 Optional LLM and Memory Modules:** Support for LangChain memory buffer and a Groq Chat Model to supplement AI agent capabilities.

---

### 2. Block-by-Block Analysis

#### 2.1 GitHub Event Reception

- **Overview:**  
  Listens for GitHub push events on the configured repository to trigger the workflow.

- **Nodes Involved:**  
  - Github Trigger  
  - Parser

- **Node Details:**

  - **Github Trigger**  
    - Type: `n8n-nodes-base.githubTrigger`  
    - Role: Entry point listening for GitHub push events on the repository "relevance" owned by "akhilv77".  
    - Configurations:  
      - Owner URL linked to GitHub profile.  
      - Event subscribed: "push".  
      - Repository selected from a list with caching enabled.  
      - OAuth2 credentials configured for GitHub API access.  
    - Input: webhook from GitHub push event.  
    - Output: JSON payload containing push event data including repository and commit info.  
    - Potential failures: Webhook misconfiguration, auth errors, network issues.

  - **Parser**  
    - Type: `n8n-nodes-base.set`  
    - Role: Extracts and restructures key fields from the GitHub event JSON for easier access downstream.  
    - Configuration:  
      - Assigns repository id, name, owner name, commit id, and arrays of added/removed/modified files into standardized JSON fields.  
    - Input: Output from Github Trigger.  
    - Output: Cleaned and simplified JSON with selected commit metadata.  
    - Potential failures: Expression evaluation errors if expected fields missing.

---

#### 2.2 Commit Data Retrieval and Parsing

- **Overview:**  
  Fetches detailed commit information including changed files and diffs via GitHub REST API.

- **Nodes Involved:**  
  - HTTP Request  
  - Code

- **Node Details:**

  - **HTTP Request**  
    - Type: `n8n-nodes-base.httpRequest`  
    - Role: Queries GitHub API for commit details using repository and commit SHA from previous node.  
    - Configuration:  
      - URL templated dynamically to: `https://api.github.com/repos/{owner}/{repo}/commits/{commit_sha}`  
      - Authentication: OAuth2 via GitHub credentials.  
      - Headers: Standard GitHub API headers sent.  
    - Input: Parsed commit data from Parser node.  
    - Output: JSON response including files changed, diffs, stats, author info.  
    - Potential failures: API rate limits, invalid credentials, network errors.

  - **Code**  
    - Type: `n8n-nodes-base.code`  
    - Role: Formats raw diff patch data into color-coded HTML for readability and presentation.  
    - Configuration:  
      - Custom JavaScript code that:  
        - Parses patch line-by-line applying color coding (green for additions, red for deletions, gray for hunk headers).  
        - Builds an HTML block including repository info, commit metadata, and each changed file’s diff with formatting.  
      - Uses expressions to access prior node data dynamically.  
    - Input: HTTP Request node commit JSON.  
    - Output: JSON with a single field `htmlOutput` containing the full formatted HTML string.  
    - Edge cases: Empty patches, unexpected patch formats, HTML escaping.  
    - Failure: Runtime errors in JS code, missing input data.

---

#### 2.3 AI Code Review

- **Overview:**  
  Sends the formatted HTML diff to an AI agent configured as a code reviewer, requesting an HTML summary of issues or confirmation of no problems.

- **Nodes Involved:**  
  - AI Agent  
  - Simple Memory (optional)  
  - Groq Chat Model (optional)

- **Node Details:**

  - **AI Agent**  
    - Type: `@n8n/n8n-nodes-langchain.agent`  
    - Role: Executes LangChain AI agent to analyze code diffs and provide review feedback.  
    - Configuration:  
      - Custom prompt instructs AI to:  
        - Analyze code changes only.  
        - Return HTML block summarizing functional, style, spelling, security issues.  
        - Output one of two HTML blocks depending on findings.  
      - Input text dynamically injected with the formatted HTML from prior nodes.  
      - Optional integration with LangChain memory and LLM nodes.  
    - Input: Formatted HTML from Code node.  
    - Output: AI-generated HTML review block.  
    - Failures: AI service timeouts, malformed input, prompt errors.

  - **Simple Memory**  
    - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
    - Role: Provides session memory buffer for AI context.  
    - Configuration:  
      - Uses a custom session key.  
    - Connected as AI memory input to AI Agent.  
    - Edge cases: Memory size limits, session key uniqueness.

  - **Groq Chat Model**  
    - Type: `@n8n/n8n-nodes-langchain.lmChatGroq`  
    - Role: Specifies the underlying language model (LLaMA 3.1 8b instant) used by AI Agent.  
    - Configuration:  
      - Model: "llama-3.1-8b-instant"  
      - Credentials: Groq API key.  
    - Connected as AI language model input to AI Agent.  
    - Potential issues: API limits, model availability.

---

#### 2.4 Output Formatting and Email Notification

- **Overview:**  
  Combines the original formatted commit HTML with AI review output and emails this composite HTML to a specified recipient.

- **Nodes Involved:**  
  - Output Parser  
  - Gmail  
  - End Workflow

- **Node Details:**

  - **Output Parser**  
    - Type: `n8n-nodes-base.code`  
    - Role: Concatenates the HTML from the "Code" node (commit info) and the AI Agent review HTML into one output.  
    - Configuration:  
      - JavaScript code that merges the two HTML snippets into a single string under the `html` key.  
    - Input: AI Agent output + Code node output.  
    - Output: JSON with combined HTML content.  
    - Failures: Missing input data.

  - **Gmail**  
    - Type: `n8n-nodes-base.gmail`  
    - Role: Sends an email containing the combined HTML report.  
    - Configuration:  
      - Recipient: "akhilgadiraju@gmail.com" (modifiable).  
      - Subject: "Code Review".  
      - Message body: Uses the combined HTML content dynamically injected.  
      - OAuth2 credentials configured for Gmail.  
    - Input: Output Parser combined HTML.  
    - Output: Email sent confirmation.  
    - Failures: Authentication errors, invalid recipient, network issues.

  - **End Workflow**  
    - Type: `n8n-nodes-base.noOp`  
    - Role: Marks the end of the workflow for clarity.  
    - No input/output processing.

---

### 3. Summary Table

| Node Name       | Node Type                                   | Functional Role                            | Input Node(s)      | Output Node(s)   | Sticky Note                                                  |
|-----------------|---------------------------------------------|-------------------------------------------|--------------------|------------------|--------------------------------------------------------------|
| Github Trigger  | n8n-nodes-base.githubTrigger                 | Trigger workflow on GitHub push event     | (Webhook)          | Parser           | ## 👨‍💻 Github Trigger customize the fields inside the github trigger to listen to specific project |
| Parser          | n8n-nodes-base.set                           | Extract and structure commit metadata     | Github Trigger     | HTTP Request     |                                                              |
| HTTP Request    | n8n-nodes-base.httpRequest                   | Get detailed commit data from GitHub API  | Parser             | Code             |                                                              |
| Code            | n8n-nodes-base.code                          | Format commit diff to color-coded HTML    | HTTP Request       | AI Agent         |                                                              |
| AI Agent        | @n8n/n8n-nodes-langchain.agent               | Analyze code diff, produce code review    | Code               | Output Parser    | ## Customize AI Agent Update the prompt to focus on different review aspects. |
| Simple Memory   | @n8n/n8n-nodes-langchain.memoryBufferWindow | Provide session memory to AI agent        | -                  | AI Agent (memory)|                                                              |
| Groq Chat Model | @n8n/n8n-nodes-langchain.lmChatGroq          | Language model for AI agent                | -                  | AI Agent (LLM)   | ## Customize LLM Swap for other supported LLMs if needed.    |
| Output Parser   | n8n-nodes-base.code                          | Combine commit HTML and AI review output  | AI Agent, Code     | Gmail            |                                                              |
| Gmail           | n8n-nodes-base.gmail                         | Send email with code review results       | Output Parser      | End Workflow     | ## Email Update Change recipient or email styling.            |
| End Workflow    | n8n-nodes-base.noOp                          | Workflow termination point                 | Gmail              | -                |                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Github Trigger" node**  
   - Type: `GitHub Trigger`  
   - Configure to listen on "push" events for repository "relevance" owned by "akhilv77".  
   - Set OAuth2 credentials for GitHub API access.  
   - Save webhook and ensure it is registered on GitHub repository settings.

2. **Add "Parser" node (Set node)**  
   - Type: `Set`  
   - Connect input from Github Trigger.  
   - Assign these fields with expressions from `$json` input:  
     - `body.repository.id` (number)  
     - `body.repository.name` (string)  
     - `body.repository.owner.name` (string)  
     - `body.head_commit.id` (string)  
     - `body.head_commit.added` (array)  
     - `body.head_commit.removed` (array)  
     - `body.head_commit.modified` (array)

3. **Add "HTTP Request" node**  
   - Type: `HTTP Request`  
   - Connect input from Parser node.  
   - Method: GET  
   - URL: `https://api.github.com/repos/{{ $json.body.repository.owner.name }}/{{ $json.body.repository.name }}/commits/{{ $json.body.head_commit.id }}`  
   - Authentication: OAuth2 with GitHub credentials.  
   - Send standard GitHub API headers.

4. **Add "Code" node**  
   - Type: `Code` (JavaScript)  
   - Connect input from HTTP Request node.  
   - Paste the provided JavaScript code that:  
     - Formats commit patch diffs with color coding in HTML.  
     - Builds an HTML block with repository and commit metadata.  
   - Use expressions to access data from Github Trigger and HTTP Request nodes.

5. **Add "AI Agent" node**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Connect input from Code node.  
   - Insert customized prompt instructing AI to analyze code diffs and return formatted HTML review summary.  
   - Configure AI memory input with a "Simple Memory" node (step 6).  
   - Configure AI language model input with "Groq Chat Model" node (step 7).

6. **Add "Simple Memory" node**  
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
   - Set a custom session key (e.g., a random string).  
   - Connect output to AI Agent’s AI memory input.

7. **Add "Groq Chat Model" node**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatGroq`  
   - Select model `"llama-3.1-8b-instant"`.  
   - Attach Groq API credentials.  
   - Connect output to AI Agent’s AI language model input.

8. **Add "Output Parser" node (Code)**  
   - Type: `Code`  
   - Connect input from AI Agent node.  
   - JavaScript code to concatenate:  
     - The `htmlOutput` from the Code node (commit info)  
     - The `html` from AI Agent output.  
   - Output combined HTML under `html` key.

9. **Add "Gmail" node**  
   - Type: `Gmail`  
   - Connect input from Output Parser node.  
   - Configure recipient email (default: "akhilgadiraju@gmail.com").  
   - Subject: "Code Review".  
   - Message body: Use output expression `{{ $json.html }}` for HTML content.  
   - Set OAuth2 Gmail credentials.

10. **Add "End Workflow" node (NoOp)**  
    - Type: `NoOp`  
    - Connect input from Gmail node.  
    - Marks end of workflow.

11. **Test the entire workflow by pushing code to the configured GitHub repository.**

---

### 5. General Notes & Resources

| Note Content                                                                                | Context or Link                                   |
|---------------------------------------------------------------------------------------------|--------------------------------------------------|
| Customize the fields inside the GitHub trigger to listen to a specific project.             | Sticky Note on Github Trigger node                |
| Update the AI Agent prompt to focus on different review aspects as needed.                   | Sticky Note on AI Agent node                       |
| Swap the LLM model to other supported models if needed for different AI capabilities.       | Sticky Note on Groq Chat Model node                |
| Change email recipient or adjust email styling to suit notification preferences.             | Sticky Note on Gmail node                           |

---

**Disclaimer:**  
This documentation is generated from an n8n workflow and respects all current content policies. It contains no illegal or offensive content. All data handled is legal and publicly accessible.