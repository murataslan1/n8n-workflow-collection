AI-Powered Knowledge Assistant using Google Sheets, OpenAI, and Supabase Vector Search

https://n8nworkflows.xyz/workflows/ai-powered-knowledge-assistant-using-google-sheets--openai--and-supabase-vector-search-4477


# AI-Powered Knowledge Assistant using Google Sheets, OpenAI, and Supabase Vector Search

### 1. Workflow Overview

This workflow implements an AI-powered code review assistant triggered by GitHub push events on a specific repository. It automatically fetches commit details, formats the code changes, sends them to an AI agent for review, and emails the AI-generated review summary. The workflow integrates GitHub for event triggers, OpenAI-compatible AI agents for code analysis, and Gmail for notifications.

Logical blocks:

- **1.1 GitHub Event Reception**: Listens for code pushes on a specified GitHub repository.
- **1.2 Commit Data Retrieval and Parsing**: Fetches commit details and extracts relevant metadata and file diffs.
- **1.3 Formatting Code Diffs**: Processes raw patch data into color-coded HTML for readability.
- **1.4 AI Code Review**: Sends formatted code diffs and metadata to an AI agent that performs a detailed code review.
- **1.5 Output Preparation and Email Notification**: Combines AI review output with formatted data and sends an email summary.
- **1.6 Workflow Completion**: Ends the workflow after sending the email.

---

### 2. Block-by-Block Analysis

#### 1.1 GitHub Event Reception

**Overview:**  
This block listens for push events on a specific GitHub repository and outputs the raw webhook payload for subsequent processing.

**Nodes Involved:**  
- Github Trigger  
- Parser

**Node Details:**  

- **Github Trigger**  
  - *Type*: GitHub Trigger Node  
  - *Role*: Listens for GitHub push events on a user-specified repository.  
  - *Configuration*:  
    - Owner set dynamically from URL: `https://github.com/akhilv77`  
    - Repository selected from list, preset to "relevance"  
    - Events: `push`  
    - Credentials: GitHub OAuth2  
  - *Input/Output*: No input; outputs webhook JSON payload on push event.  
  - *Potential Failures*: Authentication errors, webhook misconfiguration, network issues.  
  - *Sticky Note*: "👨‍💻 Github Trigger: customize fields to listen to specific project."

- **Parser**  
  - *Type*: Set Node (Data transformation)  
  - *Role*: Extracts and restructures important fields from the webhook payload for further HTTP requests.  
  - *Configuration*: Assigns repository id, name, owner name, head_commit id, and lists of files added, removed, and modified into the workflow data structure.  
  - *Key Expressions*: Uses expressions like `={{ $json.body.repository.id }}` to map data.  
  - *Input*: Output from Github Trigger  
  - *Output*: Parsed JSON with selected fields for commit API call.  
  - *Potential Failures*: Expression errors if webhook payload structure changes.

---

#### 1.2 Commit Data Retrieval and Parsing

**Overview:**  
Retrieves detailed commit information from GitHub using the commit ID and prepares the data for formatting.

**Nodes Involved:**  
- HTTP Request  
- Code  

**Node Details:**  

- **HTTP Request**  
  - *Type*: HTTP Request Node  
  - *Role*: Calls GitHub API to get detailed commit info (files changed, diffs, author, etc.) using extracted repo and commit IDs.  
  - *Configuration*:  
    - URL dynamically built: `https://api.github.com/repos/{{owner}}/{{repo}}/commits/{{commit_id}}`  
    - Authentication: GitHub OAuth2 credentials  
    - Headers sent per GitHub API requirements  
  - *Input*: Parsed data from Parser node  
  - *Output*: JSON commit details including changed files and patch data  
  - *Potential Failures*: Rate limiting by GitHub, API auth errors, invalid commit ID, network issues.

- **Code**  
  - *Type*: Code Node (JavaScript)  
  - *Role*: Formats commit patch data into color-coded HTML blocks for improved readability and constructs an HTML summary of commit metadata and changed files.  
  - *Configuration Highlights*:  
    - Parses patch lines to color additions (green), deletions (red), and hunk headers (gray)  
    - Builds HTML sections for repository info, commit info, and each changed file with styled code diffs  
    - Uses expressions to fetch repo and commit metadata from previous nodes  
  - *Input*: Output from HTTP Request node  
  - *Output*: JSON with `htmlOutput` property containing the formatted HTML  
  - *Potential Failures*: JavaScript errors if input structure changes, HTML injection risks if data is not sanitized (currently escapes `<` and `>`)  
  - *Sticky Note*: None directly, but formatting is critical for downstream AI analysis and email.

---

#### 1.3 AI Code Review

**Overview:**  
Sends the formatted HTML snippet containing commit details and code diffs to a LangChain AI agent configured as a code reviewer, which returns a structured HTML summary of issues or a clean report.

**Nodes Involved:**  
- AI Agent  
- Groq Chat Model  
- Simple Memory

**Node Details:**  

- **AI Agent**  
  - *Type*: LangChain Agent Node  
  - *Role*: Receives the formatted commit HTML, analyzes the code diffs, and generates an AI code review with focus on functional, style, security, spelling, and readability issues.  
  - *Configuration*:  
    - Prompt carefully instructs the agent to return one of two HTML blocks: either an actionable list of issues or a clean approval message.  
    - Uses AI memory buffer (Simple Memory) for session context.  
    - Connects to a Groq Chat Model instance for LLM processing.  
  - *Inputs*:  
    - Formatted HTML from Code node  
    - AI memory from Simple Memory node  
    - LLM from Groq Chat Model node  
  - *Output*: HTML code review summary block.  
  - *Potential Failures*: AI model errors, prompt misconfiguration, quota limits, memory buffer inconsistencies.  
  - *Sticky Note*: "Customize AI Agent: Update the prompt to focus on different review aspects."

- **Groq Chat Model**  
  - *Type*: LLM Chat Node (Groq API)  
  - *Role*: Provides the language model to power the AI Agent node.  
  - *Configuration*: Model set to "llama-3.1-8b-instant."  
  - *Credentials*: Groq API key.  
  - *Potential Failures*: API key invalidation, network issues, model unavailability.  
  - *Sticky Note*: "Customize LLM: Swap for other supported LLMs if needed."

- **Simple Memory**  
  - *Type*: LangChain Memory Buffer Node  
  - *Role*: Maintains conversation context for the AI Agent using a fixed session key.  
  - *Configuration*: Session key hardcoded, sessionIdType set to customKey.  
  - *Potential Failures*: Memory overflow, session key collision or invalidation.

---

#### 1.4 Output Preparation and Email Notification

**Overview:**  
Combines the AI agent's review with the formatted HTML output, then sends the review as an email to a specified recipient.

**Nodes Involved:**  
- Output Parser  
- Gmail  
- End Workflow

**Node Details:**  

- **Output Parser**  
  - *Type*: Code Node  
  - *Role*: Concatenates the HTML formatted commit data and the AI review HTML block from previous nodes into a single HTML string to be used in the email body.  
  - *Input*:  
    - `htmlOutput` from Code node  
    - `output` (AI review) from AI Agent node  
  - *Output*: JSON with combined `html` property.  
  - *Potential Failures*: Null or undefined inputs, string concatenation errors.

- **Gmail**  
  - *Type*: Gmail Node  
  - *Role*: Sends an email with the combined HTML review as the message body.  
  - *Configuration*:  
    - Recipient: `akhilgadiraju@gmail.com` (editable)  
    - Subject: "Code Review"  
    - Message body: HTML from Output Parser node  
    - Credentials: Gmail OAuth2 configured for the sender’s account.  
  - *Potential Failures*: OAuth token expiry, email delivery failures, invalid recipient address.  
  - *Sticky Note*: "Email Update: Change recipient or email styling."

- **End Workflow**  
  - *Type*: NoOp Node  
  - *Role*: Marks the end of the workflow execution.  
  - *Input*: From Gmail node  
  - *Output*: None  
  - *Potential Failures*: None

---

### 3. Summary Table

| Node Name       | Node Type                     | Functional Role                  | Input Node(s)          | Output Node(s)      | Sticky Note                                    |
|-----------------|-------------------------------|---------------------------------|-----------------------|---------------------|------------------------------------------------|
| Github Trigger  | GitHub Trigger                | Listens for GitHub push events  | None                  | Parser              | 👨‍💻 Github Trigger: customize fields to listen to specific project |
| Parser         | Set Node                     | Extracts key repo and commit info | Github Trigger        | HTTP Request        |                                                |
| HTTP Request   | HTTP Request                 | Fetches commit details from GitHub API | Parser                | Code                |                                                |
| Code           | Code Node (JS)               | Formats commit and patch data into HTML | HTTP Request          | AI Agent            |                                                |
| AI Agent       | LangChain AI Agent           | Generates AI code review summary | Code, Simple Memory, Groq Chat Model | Output Parser       | Customize AI Agent: Update the prompt to focus on different review aspects. |
| Groq Chat Model| LLM Chat Node                | Supplies LLM model for AI Agent | None                  | AI Agent            | Customize LLM: Swap for other supported LLMs if needed. |
| Simple Memory  | LangChain Memory Buffer      | Maintains AI session context    | None                  | AI Agent            |                                                |
| Output Parser  | Code Node                   | Combines formatted HTML and AI review | AI Agent              | Gmail               |                                                |
| Gmail          | Gmail                       | Sends code review email         | Output Parser         | End Workflow        | Email Update: Change recipient or email styling. |
| End Workflow   | NoOp                        | Marks workflow completion       | Gmail                 | None                |                                                |
| Sticky Note    | Sticky Note Node            | Various notes                   | None                  | None                | See nodes above for content                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Github Trigger node**  
   - Type: GitHub Trigger  
   - Set owner: `akhilv77` (or desired GitHub username)  
   - Repository: select repository (default "relevance")  
   - Events: select `push`  
   - Credentials: configure GitHub OAuth2 credentials with necessary repo access  
   - Save webhook URL if manual GitHub webhook setup is needed.

2. **Add Parser node (Set node)**  
   - Type: Set  
   - Assign these fields from incoming webhook JSON:  
     - `body.repository.id` → `{{$json.body.repository.id}}` (number)  
     - `body.repository.name` → `{{$json.body.repository.name}}` (string)  
     - `body.repository.owner.name` → `{{$json.body.repository.owner.name}}` (string)  
     - `body.head_commit.id` → `{{$json.body.head_commit.id}}` (string)  
     - `body.head_commit.added` → `{{$json.body.head_commit.added}}` (array)  
     - `body.head_commit.removed` → `{{$json.body.head_commit.removed}}` (array)  
     - `body.head_commit.modified` → `{{$json.body.head_commit.modified}}` (array)  
   - Connect Github Trigger main output to Parser input.

3. **Add HTTP Request node**  
   - Type: HTTP Request  
   - Method: GET (default)  
   - URL: `https://api.github.com/repos/{{$json.body.repository.owner.name}}/{{$json.body.repository.name}}/commits/{{$json.body.head_commit.id}}`  
   - Authentication: GitHub OAuth2 (same credential as trigger)  
   - Headers: as required by GitHub API (default)  
   - Connect Parser main output to HTTP Request input.

4. **Add Code node for HTML formatting**  
   - Type: Code (JavaScript)  
   - Paste the provided JS code that:  
     - Parses commit patch lines, applies coloring for additions/deletions/hunks  
     - Builds HTML blocks for repo info, commit metadata, and changed files  
   - Use expressions to access data from Github Trigger node for metadata  
   - Connect HTTP Request main output to this Code node.

5. **Add LangChain Simple Memory node**  
   - Type: LangChain Memory Buffer Window  
   - Set session key to a unique string (e.g., `"dsfklasdyerbmnabfdaghkjhgashgkjhgaksjdhfgaoaiwrqwkbclayga"`)  
   - SessionIdType: customKey  
   - No inputs; used as AI memory source.

6. **Add Groq Chat Model node**  
   - Type: LangChain LLM Chat  
   - Model: "llama-3.1-8b-instant"  
   - Credentials: configure Groq API key  
   - No inputs; provides LLM for AI Agent.

7. **Add AI Agent node**  
   - Type: LangChain Agent  
   - Parameters:  
     - Text prompt instructing it as AI code reviewer with detailed expectations and output formatting as per provided prompt.  
   - Connect inputs:  
     - From Code node (formatted HTML) → main input  
     - From Simple Memory node → ai_memory input  
     - From Groq Chat Model node → ai_languageModel input

8. **Add Output Parser Code node**  
   - Type: Code (JavaScript)  
   - Script: concatenate `htmlOutput` from Code node with AI Agent output HTML block into a single `html` string  
   - Connect AI Agent main output to Output Parser input.  
   - Connect Code node output (formatted HTML) to Output Parser as well (if needed for concatenation).

9. **Add Gmail node**  
   - Type: Gmail  
   - Set:  
     - Recipient email (e.g., `akhilgadiraju@gmail.com`)  
     - Subject: `"Code Review"`  
     - Message: use expression to insert `{{$json.html}}` from Output Parser node  
   - Credentials: Gmail OAuth2 with proper send permissions  
   - Connect Output Parser main output to Gmail input.

10. **Add End Workflow node (NoOp)**  
    - Type: NoOp  
    - Connect Gmail main output to End Workflow input.

11. **Connect all nodes in order:**  
    Github Trigger → Parser → HTTP Request → Code → AI Agent (with inputs from Simple Memory and Groq Chat Model) → Output Parser → Gmail → End Workflow

12. **Add Sticky Notes as desired for documentation and reminders.**

---

### 5. General Notes & Resources

| Note Content                                                                       | Context or Link                                |
|------------------------------------------------------------------------------------|-----------------------------------------------|
| Customize the GitHub trigger fields to listen to specific repositories or events.  | Sticky Note on Github Trigger node.            |
| Customize the AI Agent prompt to adjust review focus and output formatting.        | Sticky Note on AI Agent node.                   |
| Swap the Groq Chat Model for other supported LLMs if required by your use case.    | Sticky Note on Groq Chat Model node.            |
| Update recipient email or message styling in Gmail node as per notification needs.| Sticky Note on Gmail node.                       |
| The code formatting uses basic HTML and CSS inline styles for compatibility in emails and AI inputs. | Important for readability and AI parsing.      |
| GitHub API rate limits and OAuth token expiry may affect workflow reliability.     | Operational consideration.                      |
| AI review outputs only a single HTML block with no extra markdown or explanation.  | Important for consistent downstream processing.|

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.