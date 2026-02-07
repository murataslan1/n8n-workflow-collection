AI-Powered Email to Jira Ticket Creation with Llama 3.2

https://n8nworkflows.xyz/workflows/ai-powered-email-to-jira-ticket-creation-with-llama-3-2-5473


# AI-Powered Email to Jira Ticket Creation with Llama 3.2

### 1. Workflow Overview

This workflow automates the conversion of incoming emails into structured Jira tickets using AI-powered natural language understanding. It targets teams that receive work requests or bug reports via email and want to streamline their issue tracking by automatically creating main Jira issues and corresponding subtasks.

The workflow is divided into the following logical blocks:

- **1.1 Email Reception and Content Retrieval**  
  Polls Gmail periodically for new emails from a specific sender and fetches the full content of each email for processing.

- **1.2 AI-Powered Email Analysis and Task Extraction**  
  Uses an LLM (Llama 3.2) via LangChain agent to analyze email content, classify it as a feature or issue, summarize the main ticket, and extract subtasks in a structured JSON format.

- **1.3 JSON Parsing and Data Preparation**  
  Cleans and parses the raw AI output JSON, then splits subtasks into individual items for downstream processing.

- **1.4 Jira Ticket Creation**  
  Creates a main Jira issue based on the AI summary and subsequently creates all related subtasks under the main ticket.

- **1.5 Orchestration and Synchronization**  
  Includes wait nodes to ensure ordered execution and handles dependencies between AI processing and Jira ticket creation.

---

### 2. Block-by-Block Analysis

#### 2.1 Email Reception and Content Retrieval

- **Overview:**  
  This block triggers periodically to check for new emails from a configured sender and fetches the full content of those emails for AI processing.

- **Nodes Involved:**  
  - Check for New Emails  
  - Fetch Full Email Content

- **Node Details:**

  - **Check for New Emails**  
    - *Type:* Gmail Trigger  
    - *Role:* Polls Gmail every 5 minutes filtering emails from "xyz@gmail.com".  
    - *Configuration:* Uses Gmail OAuth2 credentials named "Gmail account - test". Filters by sender email.  
    - *Input:* None (trigger node).  
    - *Output:* Emits new email metadata including message ID.  
    - *Edge Cases:* Gmail API rate limits; no emails matching filter; authentication errors.  
    - *Version:* 1.2

  - **Fetch Full Email Content**  
    - *Type:* Gmail Node  
    - *Role:* Retrieves the full content of the email using the message ID from the trigger.  
    - *Configuration:* Operation "get" with messageId set dynamically from trigger output (`={{ $json.id }}`).  
    - *Credentials:* Same Gmail OAuth2 creds as above.  
    - *Input:* Output from Check for New Emails.  
    - *Output:* Full email content including body text, sender, subject, etc.  
    - *Edge Cases:* Message ID invalid or deleted; Gmail API errors; empty email content.  
    - *Version:* 2.1

#### 2.2 AI-Powered Email Analysis and Task Extraction

- **Overview:**  
  This block processes the raw email text using a language model to classify the request and extract structured Jira ticket information.

- **Nodes Involved:**  
  - Analyze Email & Extract Tasks  
  - Chat Model (Llama 3.2)  
  - AI Tool - Think Support

- **Node Details:**

  - **Analyze Email & Extract Tasks**  
    - *Type:* LangChain Agent Node  
    - *Role:* Uses an LLM agent to analyze email text and output structured JSON describing the ticket category, summary, description, and subtasks.  
    - *Configuration:*  
      - Input text is the email body (`={{ $json.text }}`).  
      - System message instructs the AI to output pure JSON with specific fields: category, main_ticket, main_description, and sub_tasks.  
      - Uses the "think" tool as auxiliary support for reasoning.  
    - *Input:* Email content from Fetch Full Email Content node.  
    - *Output:* Raw AI output string containing JSON.  
    - *Edge Cases:* AI output not valid JSON; incomplete or ambiguous email content; model timeout or errors.  
    - *Version:* 1.8

  - **Chat Model**  
    - *Type:* LangChain LLM Chat Ollama Node  
    - *Role:* Provides the Llama 3.2 model backend for the AI agent.  
    - *Configuration:* Model set to "llama3.2", no additional options.  
    - *Credentials:* Ollama API credentials named "Ollama - test".  
    - *Input:* Connected from Analyze Email node as language model provider.  
    - *Output:* AI-generated text response.  
    - *Edge Cases:* API authentication errors; model unavailability; request timeouts.  
    - *Version:* 1

  - **AI Tool - Think Support**  
    - *Type:* LangChain Tool Think Node  
    - *Role:* Auxiliary tool to enhance AI reasoning during task extraction.  
    - *Input:* Linked to Analyze Email node as AI tool provider.  
    - *Output:* Assists in generating better AI responses.  
    - *Edge Cases:* Tool failure or misconfiguration.  
    - *Version:* 1

#### 2.3 JSON Parsing and Data Preparation

- **Overview:**  
  Cleans the raw AI output string to remove formatting artifacts, parses it into JSON, and then splits the subtasks array into separate items for Jira subtasks creation.

- **Nodes Involved:**  
  - Parse JSON Output from AI  
  - Wait  
  - Split Subtasks JSON to Items

- **Node Details:**

  - **Parse JSON Output from AI**  
    - *Type:* Code Node (JavaScript)  
    - *Role:* Processes raw AI response, strips markdown code block markers, and parses JSON.  
    - *Key Code Elements:*  
      - Removes leading ```json and trailing ``` markers.  
      - Tries JSON.parse, throws error on failure.  
      - Returns parsed JSON object with category, main_ticket, main_description, sub_tasks.  
    - *Input:* Output from Analyze Email & Extract Tasks.  
    - *Output:* Structured JSON object for downstream nodes.  
    - *Edge Cases:* Parsing errors due to malformed AI output; missing keys in JSON.  
    - *Version:* 2

  - **Wait**  
    - *Type:* Wait Node  
    - *Role:* Ensures sequential processing, waits for Parse JSON node to complete before continuing.  
    - *Configuration:* Default wait (no delay specified), used for synchronization.  
    - *Input:* From Analyze Email node.  
    - *Output:* Triggers Parse JSON node.  
    - *Edge Cases:* None significant; potential delays in execution.  
    - *Version:* 1.1

  - **Split Subtasks JSON to Items**  
    - *Type:* Code Node (JavaScript)  
    - *Role:* Converts the subtasks array into individual workflow items for separate Jira subtask creation.  
    - *Key Code Elements:*  
      - Extracts sub_tasks from parsed JSON.  
      - Maps each subtask to a new item with `sub_task` key.  
    - *Input:* From Jira - Create Main Issue node (main ticket creation).  
    - *Output:* Multiple items, each representing one subtask.  
    - *Edge Cases:* Empty subtasks array; malformed subtask objects.  
    - *Version:* 2

#### 2.4 Jira Ticket Creation

- **Overview:**  
  Creates a main Jira issue based on AI extracted main ticket info, then creates subtasks linked as children of the main issue.

- **Nodes Involved:**  
  - Jira - Create Main Issue  
  - Create Subtasks

- **Node Details:**

  - **Jira - Create Main Issue**  
    - *Type:* Jira Node  
    - *Role:* Creates the main Jira issue using project ID and issue type for a task.  
    - *Configuration:*  
      - Project ID: 10002  
      - Issue Type: Task (ID 10008)  
      - Summary: From `main_ticket` field in parsed JSON.  
      - Description: From `main_description` field.  
      - Assignee: User ID "5fec3f15dd5eb501088e0226" (cached name "ajay")  
    - *Credentials:* Jira Software Cloud API credentials "Jira SW Cloud - test".  
    - *Input:* From Parse JSON Output node.  
    - *Output:* Jira issue key and details for main ticket.  
    - *Edge Cases:* Jira API errors; invalid project or user IDs; permission issues.  
    - *Version:* 1

  - **Create Subtasks**  
    - *Type:* Jira Node  
    - *Role:* Creates subtasks under the main Jira issue using the subtask details extracted by AI.  
    - *Configuration:*  
      - Project ID: 10002  
      - Issue Type: Subtask (ID 10010)  
      - Summary and Description from each subtask JSON item (`sub_task.summary`, `sub_task.description`).  
      - Parent Issue Key dynamically linked from the main issue key.  
      - Assignee same as main issue.  
    - *Credentials:* Same Jira API creds as main issue node.  
    - *Input:* From Split Subtasks JSON to Items node.  
    - *Output:* Created Jira subtasks.  
    - *Edge Cases:* Parent issue missing or invalid; API failures; invalid subtask data.  
    - *Version:* 1

---

### 3. Summary Table

| Node Name                  | Node Type                      | Functional Role                              | Input Node(s)                   | Output Node(s)                   | Sticky Note                                                  |
|----------------------------|--------------------------------|----------------------------------------------|--------------------------------|---------------------------------|--------------------------------------------------------------|
| Check for New Emails        | Gmail Trigger                  | Polls Gmail for new emails from sender       | None                           | Fetch Full Email Content         |                                                              |
| Fetch Full Email Content    | Gmail Node                    | Fetches full email content by message ID     | Check for New Emails            | Analyze Email & Extract Tasks    |                                                              |
| Analyze Email & Extract Tasks | LangChain Agent Node          | AI analyzes email text, extracts ticket info | Fetch Full Email Content        | Wait                            |                                                              |
| Chat Model                 | LangChain LLM Chat Ollama     | Provides Llama 3.2 LLM for analysis          | Analyze Email & Extract Tasks   | Analyze Email & Extract Tasks    |                                                              |
| AI Tool - Think Support    | LangChain Tool Think           | Auxiliary AI reasoning tool                   | Analyze Email & Extract Tasks   | Analyze Email & Extract Tasks    |                                                              |
| Wait                       | Wait Node                     | Synchronizes processing flow                   | Analyze Email & Extract Tasks   | Parse JSON Output from AI        |                                                              |
| Parse JSON Output from AI  | Code Node                    | Cleans and parses AI raw JSON output           | Wait                          | Jira - Create Main Issue         |                                                              |
| Jira - Create Main Issue   | Jira Node                    | Creates main Jira issue with AI data           | Parse JSON Output from AI       | Split Subtasks JSON to Items     |                                                              |
| Split Subtasks JSON to Items | Code Node                    | Splits subtasks array into individual items   | Jira - Create Main Issue        | Create Subtasks                  |                                                              |
| Create Subtasks            | Jira Node                    | Creates Jira subtasks under main issue         | Split Subtasks JSON to Items    | None                            |                                                              |
| Sticky Note                | Sticky Note                  | Overview and project description               | None                           | None                            | 📌 Email-to-Jira Auto Ticket Creator (AI-powered) – Overview<br>This AI-powered workflow reads emails, understands the request using an LLM, and creates structured Jira issues:<br>Flow Steps:<br>📨 Polls for new emails every 5 minutes.<br>📬 Fetches full email content.<br>🧠 Analyzes content using AI to understand the issue or feature request.<br>📊 Parses structured task data (main task + subtasks).<br>🧾 Creates a main Jira task.<br>🧾 Creates all related subtasks in Jira under the main task.<br>Perfect for project teams who get work requests via email and want them converted into actionable Jira tickets automatically. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Check for New Emails" Node**  
   - Type: Gmail Trigger  
   - Credentials: Configure Gmail OAuth2 ("Gmail account - test")  
   - Parameters: Set filter to sender "xyz@gmail.com"  
   - Polling: Every 5 minutes  
   - Position: Near workflow start

2. **Create "Fetch Full Email Content" Node**  
   - Type: Gmail Node  
   - Credentials: Same Gmail OAuth2 as above  
   - Operation: "get"  
   - Parameter: messageId = `={{ $json.id }}` (dynamically from trigger)  
   - Connect: Output of "Check for New Emails" → Input of this node

3. **Create "Analyze Email & Extract Tasks" Node**  
   - Type: LangChain Agent Node  
   - Parameters:  
     - Text input: `={{ $json.text }}` (email body)  
     - System message: set detailed instructions calling for pure JSON output with fields category, main_ticket, main_description, sub_tasks (see overview section for exact text)  
     - Enable "think" tool usage  
   - Connect: Output of "Fetch Full Email Content" → Input of this node

4. **Create "Chat Model" Node**  
   - Type: LangChain LLM Chat Ollama Node  
   - Parameters: Model = "llama3.2"  
   - Credentials: Ollama API credentials ("Ollama - test")  
   - Connect: Output of this node → Input "ai_languageModel" of "Analyze Email & Extract Tasks"

5. **Create "AI Tool - Think Support" Node**  
   - Type: LangChain Tool Think Node  
   - Connect: Output of this node → Input "ai_tool" of "Analyze Email & Extract Tasks"

6. **Create "Wait" Node**  
   - Type: Wait Node, default config (no delay)  
   - Connect: Output of "Analyze Email & Extract Tasks" → Input of "Wait"

7. **Create "Parse JSON Output from AI" Node**  
   - Type: Code Node (JavaScript)  
   - Code:  
     ```javascript
     const rawOutput = $input.first().json.output;
     const cleaned = rawOutput.replace(/^```json/, '').replace(/```$/, '').trim();
     let parsed;
     try {
       parsed = JSON.parse(cleaned);
     } catch (err) {
       throw new Error("Failed to parse AI output as JSON: " + err.message);
     }
     return parsed;
     ```  
   - Connect: Output of "Wait" → Input of this node

8. **Create "Jira - Create Main Issue" Node**  
   - Type: Jira Node  
   - Credentials: Jira Software Cloud API ("Jira SW Cloud - test")  
   - Parameters:  
     - Project ID: 10002  
     - Issue Type: Task (ID 10008)  
     - Summary: `={{ $json.main_ticket }}`  
     - Description: `={{ $json.main_description }}`  
     - Assignee: User ID "5fec3f15dd5eb501088e0226"  
   - Connect: Output of "Parse JSON Output from AI" → Input of this node

9. **Create "Split Subtasks JSON to Items" Node**  
   - Type: Code Node (JavaScript)  
   - Code:  
     ```javascript
     const subtasks = $('Parse JSON Output from AI').first().json.sub_tasks;
     return subtasks.map(task => {
       return { json: { sub_task: task } };
     });
     ```  
   - Connect: Output of "Jira - Create Main Issue" → Input of this node

10. **Create "Create Subtasks" Node**  
    - Type: Jira Node  
    - Credentials: Same Jira API as above  
    - Parameters:  
      - Project ID: 10002  
      - Issue Type: Subtask (ID 10010)  
      - Summary: `={{ $json.sub_task.summary }}`  
      - Description: `={{ $json.sub_task.description }}`  
      - Parent Issue Key: `={{ $('Jira - Create Main Issue').item.json.key }}`  
      - Assignee: User ID "5fec3f15dd5eb501088e0226"  
    - Connect: Output of "Split Subtasks JSON to Items" → Input of this node

11. **Create Sticky Note**  
    - Add a Sticky Note node with the overview content (see Section 3 Sticky Note content) positioned for clarity.

12. **Verify Execution Order and Connections**  
    - Check all connections match the order described:
      - Gmail Trigger → Gmail Get → AI Agent  
      - AI Agent → Wait → Parse JSON  
      - Parse JSON → Jira Main Issue → Split Subtasks → Jira Subtasks

13. **Activate the Workflow**  
    - Enable and test with sample emails from the specified sender.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                   | Context or Link                                                                                 |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow uses Llama 3.2 via Ollama API to perform natural language understanding and task extraction.                                                                                                                                                     | Ollama API credentials required for AI processing.                                             |
| The AI prompt is carefully designed to output pure JSON with no extraneous formatting, which is crucial for safe parsing downstream.                                                                                                                          | Prompt embedded in "Analyze Email & Extract Tasks" node.                                       |
| Jira project and user IDs are hardcoded; these should be customized for your Jira instance and users.                                                                                                                                                          | Jira node configurations for project ID 10002 and assignee user ID "5fec3f15dd5eb501088e0226".|
| Gmail OAuth2 credentials must have permissions to read emails and fetch full message content.                                                                                                                                                                   | Gmail OAuth2 credentials setup required.                                                       |
| Polling interval is set to 5 minutes but can be adjusted based on use case and email volume.                                                                                                                                                                    | Configured in Gmail Trigger node.                                                              |
| The workflow assumes emails are formatted in a way that the AI can reliably extract ticket info; ambiguous or very short emails may cause parsing errors or incomplete ticket data.                                                                             | Consider adding validation or fallback logic if necessary.                                     |
| Potential failure points include API rate limits (Gmail and Jira), AI parsing errors, and network timeouts; adequate monitoring and error handling is recommended.                                                                                            | Error handling could be enhanced with n8n’s retry and error workflow features.                 |
| For more information on integrating n8n with Jira and Gmail, see the official n8n docs: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.jira/ and https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/                              | Official n8n documentation.                                                                    |

---

This reference provides a full, structured understanding of the workflow, enabling reproduction, modification, and troubleshooting in professional environments.