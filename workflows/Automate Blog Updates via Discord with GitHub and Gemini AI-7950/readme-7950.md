Automate Blog Updates via Discord with GitHub and Gemini AI

https://n8nworkflows.xyz/workflows/automate-blog-updates-via-discord-with-github-and-gemini-ai-7950


# Automate Blog Updates via Discord with GitHub and Gemini AI

### 1. Workflow Overview

This workflow automates blog post creation and editing via Discord commands by integrating GitHub repository management and AI content generation using Google Gemini and LangChain AI agent. It is designed for users who want to manage blog posts as Markdown files in a specific GitHub repository directory through conversational interaction on Discord.

**Target Use Cases:**  
- Drafting new blog posts from rough notes or topics shared via Discord  
- Editing existing blog posts upon user confirmation  
- Automating file management in GitHub repository (create, list, read, edit Markdown files)  
- Leveraging AI to generate, format, and polish blog content, including date stamping  

**Logical Blocks:**  
- **1.1 Input Reception:** Receive Discord messages as triggers to start the workflow.  
- **1.2 AI Processing:** An AI Agent powered by LangChain and Google Gemini processes user input, manages content generation, handles logic for file creation/editing, and interacts with GitHub API nodes.  
- **1.3 GitHub File Management:** Nodes for listing, reading, creating, and editing Markdown files in a specified directory of a GitHub repository.  
- **1.4 Memory and Confirmation Storage:** Temporary memory node to store user confirmations for editing actions.  
- **1.5 Output Dispatch:** Sending AI-generated responses back to Discord as messages.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
Listens for Discord messages to activate the workflow when user commands related to blog post creation or editing are detected.

- **Nodes Involved:**  
  - Discord Message Reader

- **Node Details:**  
  - **Discord Message Reader**  
    - Type: Discord Trigger node  
    - Role: Listens to all messages in Discord channels (pattern: "every")  
    - Configuration: Triggers workflow on every Discord message (pattern set to "every")  
    - Input: Discord message event  
    - Output: Passes message content to AI Agent  
    - Potential Failures: Discord API connectivity loss, permission issues for message reading  

#### 1.2 AI Processing

- **Overview:**  
Acts as the core processing unit to interpret user commands, generate blog content, manage file operations logic, and coordinate with GitHub nodes.

- **Nodes Involved:**  
  - AI Agent  
  - Google Gemini Chat Model

- **Node Details:**  
  - **AI Agent** (LangChain Agent node)  
    - Type: AI Agent node (LangChain)  
    - Role: Parses user input, applies a defined system prompt persona ("n8n Blog Master"), orchestrates blog post creation/editing logic, and calls GitHub nodes accordingly  
    - Configuration:  
      - Uses user input as text prompt (`{{$json.content}}`)  
      - System message defines operational constraints (repository name, owner, allowed paths, editing protocols) and workflow rules  
      - Integrates tools: Date & Time, GitHub nodes (Create, List, Read, Edit), Memory  
    - Inputs: Output from Discord Message Reader, AI language model output, Date & Time node output, GitHub nodes output, and memory buffer  
    - Outputs: Text response to be sent to Discord  
    - Edge Cases:  
      - Misinterpretation of user commands  
      - Failure in GitHub API calls (e.g., permission, resource not found)  
      - Confirmation handling errors  
      - Timeout or rate limits from AI or GitHub  
    - Version: 2.2  
    - Sub-workflow: None but acts as orchestrator calling other nodes via ai_tool connections  

  - **Google Gemini Chat Model**  
    - Type: AI Language Model node (Google Gemini)  
    - Role: Provides language model capabilities to the AI Agent for text generation and response formulation  
    - Configuration: Default options, no custom parameters  
    - Input: Passed from AI Agent as language model query  
    - Output: Generated text for AI Agent  
    - Edge Cases: Model API downtime, rate limits, malformed inputs  

#### 1.3 GitHub File Management

- **Overview:**  
Handles all interactions with the GitHub repository for managing Markdown blog post files inside a specified directory.

- **Nodes Involved:**  
  - List files in GitHub  
  - Get a file in GitHub  
  - Create a file in GitHub  
  - Edit a file in GitHub

- **Node Details:**  
  - **List files in GitHub**  
    - Type: GitHub Tool node  
    - Role: Lists files inside the specified blog directory to check for existing filenames before creation  
    - Configuration:  
      - Owner and Repository set dynamically from AI Agent inputs  
      - File path set to the target directory  
    - Input: Triggered by AI Agent requests  
    - Output: List of files in directory  
    - Edge Cases: API permission errors, empty directory, rate limits  

  - **Get a file in GitHub**  
    - Type: GitHub Tool node  
    - Role: Retrieves content of a specified Markdown file for reading or editing purposes  
    - Configuration: Owner, repo, file path defined dynamically  
    - Input: AI Agent requests for existing file content  
    - Output: File content for AI processing  
    - Edge Cases: File not found, permission errors, large file size issues  

  - **Create a file in GitHub**  
    - Type: GitHub Tool node  
    - Role: Creates new Markdown files in the specified directory with generated content  
    - Configuration:  
      - Owner, repo, file path, content, commit message dynamically passed from AI Agent  
    - Input: Triggered after AI content generation and filename resolution  
    - Output: Confirmation of file creation  
    - Edge Cases: "Resource not found" errors (workflow retries once), permission issues, duplicate file errors  

  - **Edit a file in GitHub**  
    - Type: GitHub Tool node  
    - Role: Updates existing Markdown files after user confirmation  
    - Configuration: Owner, repo, file path, new content, commit message passed dynamically  
    - Input: Triggered only after explicit user confirmation stored in memory  
    - Output: Confirmation of file editing  
    - Edge Cases: User rejection (workflow cancellation), permission errors, conflict if file changed externally  

#### 1.4 Memory and Confirmation Storage

- **Overview:**  
Stores temporary user confirmations and previous message history to handle multi-turn conversations and action verification.

- **Nodes Involved:**  
  - Simple Memory

- **Node Details:**  
  - **Simple Memory**  
    - Type: LangChain Memory Buffer Window node  
    - Role: Maintains conversation context and stores user confirmations for edit actions  
    - Configuration:  
      - Session key: "memoryKey": "history"  
      - SessionIdType: customKey  
      - Context window length: 20 (stores last 20 interactions)  
    - Input: User messages and AI Agent queries  
    - Output: Contextual memory data for AI Agent usage  
    - Edge Cases: Memory overflow or context loss if conversation too long, session reset issues  

#### 1.5 Output Dispatch

- **Overview:**  
Sends back AI-generated responses or status messages to Discord channels to inform the user of workflow progress or results.

- **Nodes Involved:**  
  - Sends Message to Discord

- **Node Details:**  
  - **Sends Message to Discord**  
    - Type: Discord node (message send)  
    - Role: Posts AI Agent output text as Discord messages to the appropriate channels  
    - Configuration:  
      - Message content: extracted from AI Agent output  
      - Guild ID and Channel ID set dynamically  
    - Input: Output from AI Agent node  
    - Output: Confirmation of message sent  
    - Edge Cases: Discord permission issues, invalid channel IDs, message rate limits  

---

### 3. Summary Table

| Node Name              | Node Type                          | Functional Role                          | Input Node(s)            | Output Node(s)           | Sticky Note                                                                   |
|------------------------|----------------------------------|----------------------------------------|--------------------------|--------------------------|-------------------------------------------------------------------------------|
| Discord Message Reader  | Discord Trigger                  | Input reception from Discord            | None                     | AI Agent                 |                                                                               |
| AI Agent               | LangChain Agent                  | Core AI processing, orchestration       | Discord Message Reader, Google Gemini Chat Model, Date & Time, GitHub nodes, Simple Memory | Sends Message to Discord    | Contains detailed system prompt defining persona, operational constraints, tools, and workflow logic |
| Google Gemini Chat Model| AI Language Model (Google Gemini)| Language model for text generation       | AI Agent                 | AI Agent                 |                                                                               |
| Date & Time             | DateTime Tool                   | Provides current date/time in IST       | AI Agent (ai_tool)       | AI Agent                 | Only IST timezone allowed                                                     |
| List files in GitHub    | GitHub Tool                    | Lists files in target directory         | AI Agent (ai_tool)       | AI Agent                 |                                                                               |
| Get a file in GitHub    | GitHub Tool                    | Reads file content from GitHub          | AI Agent (ai_tool)       | AI Agent                 |                                                                               |
| Create a file in GitHub | GitHub Tool                    | Creates new Markdown blog file           | AI Agent (ai_tool)       | AI Agent                 | Retries once on "Resource not found" error, then advises permissions check    |
| Edit a file in GitHub   | GitHub Tool                    | Edits existing Markdown file after confirmation | AI Agent (ai_tool)       | AI Agent                 | Requires explicit user confirmation stored in memory                         |
| Simple Memory           | LangChain Memory Buffer Window  | Stores conversation history and confirmations | Discord Message Reader   | AI Agent                 | Maintains last 20 interactions, used for edit confirmation                   |
| Sends Message to Discord| Discord node (send message)     | Sends AI response back to Discord       | AI Agent                 | None                     |                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Discord Message Reader node**  
   - Type: Discord Trigger  
   - Set trigger pattern to "every" to listen to all incoming messages.  
   - Configure Discord credentials with appropriate bot permissions (read messages).

2. **Create AI Agent node (LangChain Agent)**  
   - Type: LangChain Agent (Agent node)  
   - Input: Connect from Discord Message Reader main output.  
   - Configure the system prompt with the full workflow instructions and constraints as provided: persona, repo owner/name, allowed directory, editing protocols, tools usage, file naming rules, error handling logic.  
   - Enable use of AI tools and memory integrations.  
   - Configure inputs to accept outputs from AI language model, Date & Time tool, GitHub nodes, and memory node.

3. **Add Google Gemini Chat Model node**  
   - Type: LangChain LM Chat Google Gemini  
   - Connect AI Agent’s ai_languageModel input to this node’s output.  
   - Use default settings or configure API credentials for Google Gemini.  

4. **Add Date & Time Tool node**  
   - Type: DateTime Tool  
   - Configure timezone explicitly to "Asia/Kolkata" (IST).  
   - Connect AI Agent’s ai_tool input to this node’s output.

5. **Add GitHub nodes:**  
   - **List files in GitHub**  
     - Type: GitHub Tool (list files)  
     - Configure owner, repository, and target directory path dynamically (via expressions) from AI Agent variables.  
     - Connect AI Agent’s ai_tool input to this node’s output.  
   - **Get a file in GitHub**  
     - Type: GitHub Tool (get file)  
     - Configure with dynamic owner, repo, file path.  
     - Connect AI Agent’s ai_tool input to this node’s output.  
   - **Create a file in GitHub**  
     - Type: GitHub Tool (create file)  
     - Dynamic parameters for owner, repo, file path (directory + filename), content, commit message.  
     - Connect AI Agent’s ai_tool input to this node’s output.  
     - Add failure handling: on "Resource not found" error retry once, then notify user.  
   - **Edit a file in GitHub**  
     - Type: GitHub Tool (edit file)  
     - Dynamic parameters as above.  
     - Connect AI Agent’s ai_tool input to this node’s output.

6. **Add Simple Memory node**  
   - Type: LangChain Memory Buffer Window  
   - Configure:  
     - Session key: `"memoryKey": "history"` (literal string)  
     - Session ID type: customKey  
     - Context window length: 20  
   - Connect Discord Message Reader main output to this node input.  
   - Connect this node output to AI Agent’s ai_memory input.

7. **Add Sends Message to Discord node**  
   - Type: Discord (send message)  
   - Connect AI Agent main output to this node input.  
   - Configure:  
     - Content: Bind to AI Agent output response (`{{$node["AI Agent"].json["output"]}}`)  
     - Configure Guild ID and Channel ID dynamically as required for your Discord server channels.  
     - Ensure bot has permissions to send messages.

8. **Establish Connections:**  
   - Discord Message Reader → AI Agent (main)  
   - Discord Message Reader → Simple Memory (main) → AI Agent (ai_memory)  
   - AI Agent → Google Gemini Chat Model (ai_languageModel) → AI Agent  
   - AI Agent → Date & Time Tool (ai_tool) → AI Agent  
   - AI Agent → List files in GitHub (ai_tool) → AI Agent  
   - AI Agent → Get a file in GitHub (ai_tool) → AI Agent  
   - AI Agent → Create a file in GitHub (ai_tool) → AI Agent  
   - AI Agent → Edit a file in GitHub (ai_tool) → AI Agent  
   - AI Agent → Sends Message to Discord (main)

9. **Credentials Setup:**  
   - Discord: OAuth2 bot token with read and send message permissions  
   - GitHub: Personal Access Token with repo access to the specified repository  
   - Google Gemini: API credentials for Google Cloud language model access  

10. **Parameter Defaults and Constraints:**  
    - Repository owner, repository name, and directory path must be set as environment variables or AI Agent inputs replacing placeholders `<insert-username-here>`, `<insert-repo-name-here>`, `<insert-directory-path-here>`.  
    - Timezone fixed to IST in Date & Time tool.  
    - AI Agent prompt strictly defines operational scope and persona—do not alter to prevent security issues.  
    - Workflow expects user confirmations for editing files; confirmation stored in Simple Memory.  
    - Retry logic on GitHub "Resource not found" error implemented in AI Agent logic, not as explicit nodes.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                              |
|---------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| The AI Agent uses a detailed system prompt defining persona, operational constraints, and tool usage protocols. | Integral to workflow’s security and correct operation.       |
| Timezone for date operations is fixed to IST (India Standard Time) to maintain consistent blog post metadata. | Date & Time node configuration.                              |
| GitHub operations strictly confined to a specific directory to avoid unauthorized repository modifications.   | Ensures safety and scoped access.                             |
| On "Resource not found" errors during file creation, the workflow retries once automatically before notifying the user about possible permission issues. | Advanced error handling protocol.                             |
| Confirmation for editing files requires explicit user approval, stored temporarily in memory for multi-turn interactions. | Prevents unintended file modifications.                      |
| Discord bot requires appropriate permissions to read messages and send messages in target channels.           | Discord credential setup reminder.                            |
| The workflow can be adapted by replacing placeholders with actual repository and user details in the AI Agent system prompt and node parameters. | Customization instructions.                                  |

---

**Disclaimer:** The text provided is exclusively generated from an automated n8n workflow. It strictly complies with content policies and contains no illegal, offensive, or protected content. All data processed is legal and public.