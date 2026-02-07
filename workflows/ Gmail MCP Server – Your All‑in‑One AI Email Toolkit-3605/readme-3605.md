 Gmail MCP Server – Your All‑in‑One AI Email Toolkit

https://n8nworkflows.xyz/workflows/-gmail-mcp-server---your-all-in-one-ai-email-toolkit-3605


#  Gmail MCP Server – Your All‑in‑One AI Email Toolkit

### 1. Workflow Overview

This workflow, **Gmail MCP Server – Your All‑in‑One AI Email Toolkit**, exposes the full Gmail API as a single Server-Sent Events (SSE) "tool server" endpoint designed for AI agents such as LangChain or n8n AI Agent nodes. It maps over 20 common Gmail operations (including search, send, reply, draft management, label and thread management, marking read/unread, and delete) into a unified interface accessible via simple JSON payloads.

**Target Use Cases:**  
- AI agents requiring real-time, programmatic access to Gmail functionalities.  
- Automating email workflows with AI reasoning over Gmail data.  
- Extending or customizing Gmail operations without modifying AI agent logic.  

**Logical Blocks:**  
- **1.1 MCP Trigger Setup:** The core SSE endpoint node that streams Gmail operations to AI agents.  
- **1.2 Message Tools:** Nodes handling individual email message operations (get, delete, reply, mark read/unread, add/remove labels).  
- **1.3 Label Tools:** Nodes managing Gmail labels (get, create, delete).  
- **1.4 Draft Tools:** Nodes for draft email management (create, get, delete, list).  
- **1.5 Thread Tools:** Nodes managing email threads (get, list, reply, add/remove labels).  
- **1.6 Documentation Sticky Notes:** Informational nodes providing usage instructions and grouping context.

---

### 2. Block-by-Block Analysis

#### 1.1 MCP Trigger Setup

- **Overview:**  
  This block contains the MCP Trigger node that acts as the SSE server endpoint. It listens for incoming AI agent requests and routes them to the appropriate GmailTool nodes based on the JSON payload.

- **Nodes Involved:**  
  - Gmail MCP Server

- **Node Details:**  
  - **Gmail MCP Server**  
    - Type: `@n8n/n8n-nodes-langchain.mcpTrigger`  
    - Role: SSE server endpoint for AI agents to invoke Gmail operations.  
    - Configuration:  
      - Path set to `"gmail"` to define the SSE URL endpoint.  
    - Inputs: Receives AI tool requests from all GmailTool nodes via `ai_tool` connections.  
    - Outputs: Streams responses back to AI agents.  
    - Credentials: None directly, but GmailTool nodes use Gmail OAuth2.  
    - Edge Cases:  
      - SSE connection drops or timeouts.  
      - Malformed JSON payloads from AI agents.  
      - Unsupported operation requests.  
    - Version: 1  

#### 1.2 Message Tools

- **Overview:**  
  This block manages operations on individual Gmail messages, including retrieval, deletion, replying, marking read/unread, and label management.

- **Nodes Involved:**  
  - get  
  - delete  
  - reply  
  - markAsRead  
  - markAsUnread  
  - addLabels  
  - removeLabels  
  - Sticky Note (Message Tools)

- **Node Details:**  

  - **get**  
    - Type: `gmailTool`  
    - Operation: Retrieve a specific message by ID.  
    - Parameters: `messageId` from AI input.  
    - Credentials: Gmail OAuth2.  
    - Inputs: From MCP Trigger via `ai_tool`.  
    - Outputs: Message data.  
    - Edge Cases: Invalid message ID, permission errors.

  - **delete**  
    - Type: `gmailTool`  
    - Operation: Delete a message by ID.  
    - Parameters: `messageId` from AI input.  
    - Edge Cases: Message not found, insufficient permissions.

  - **reply**  
    - Type: `gmailTool`  
    - Operation: Reply to a message.  
    - Parameters: Message body, CC, BCC, attachments, messageId.  
    - Email type: Text.  
    - Edge Cases: Attachment field missing, invalid message ID.

  - **markAsRead** / **markAsUnread**  
    - Type: `gmailTool`  
    - Operation: Mark message read/unread by ID.  
    - Edge Cases: Message ID invalid or already in desired state.

  - **addLabels** / **removeLabels**  
    - Type: `gmailTool`  
    - Operation: Add or remove labels from a message.  
    - Parameters: Label IDs or names, message ID.  
    - Edge Cases: Label not found, invalid message ID.

  - **Sticky Note (Message Tools)**  
    - Provides a visual grouping label "Message Tools" for clarity.

#### 1.3 Label Tools

- **Overview:**  
  This block handles Gmail label operations such as listing all labels, retrieving a single label, creating new labels, and deleting labels.

- **Nodes Involved:**  
  - getLabels  
  - getLabel  
  - createLabel  
  - deleteLabel  
  - Sticky Note1 (Label Tools)

- **Node Details:**  

  - **getLabels**  
    - Operation: List all labels, optionally returning all or limited.  
    - Parameters: `returnAll` boolean from AI input.  
    - Edge Cases: API rate limits.

  - **getLabel**  
    - Operation: Get details of a label by ID.  
    - Parameters: `labelId` from AI input.  
    - Edge Cases: Label ID invalid.

  - **createLabel**  
    - Operation: Create a new label with a given name.  
    - Parameters: Label name from AI input.  
    - Edge Cases: Duplicate label names, invalid characters.

  - **deleteLabel**  
    - Operation: Delete a label by ID.  
    - Parameters: `labelId` from AI input.  
    - Edge Cases: Label in use, invalid ID.

  - **Sticky Note1 (Label Tools)**  
    - Visual grouping label "Label Tools".

#### 1.4 Draft Tools

- **Overview:**  
  This block manages Gmail draft emails, including creating, retrieving, deleting, and listing drafts.

- **Nodes Involved:**  
  - createDraft  
  - getDraft  
  - deleteDraft  
  - getManyDrafts  
  - Sticky Note2 (Draft Tools)

- **Node Details:**  

  - **createDraft**  
    - Operation: Create a draft email.  
    - Parameters: Message body, subject, CC, BCC, attachments.  
    - Attachments are binary data referenced by a field name from AI input.  
    - Edge Cases: Missing mandatory fields, attachment errors.

  - **getDraft**  
    - Operation: Retrieve a draft by ID.  
    - Parameters: `Draft_ID` from AI input.  
    - Edge Cases: Draft not found.

  - **deleteDraft**  
    - Operation: Delete a draft by ID.  
    - Parameters: `Draft_ID`.  
    - Edge Cases: Draft already deleted.

  - **getManyDrafts**  
    - Operation: List drafts, optionally including spam/trash and returning all or limited.  
    - Parameters: `Include_Spam_and_Trash` and `Return_All` booleans.  
    - Edge Cases: Large result sets, API limits.

  - **Sticky Note2 (Draft Tools)**  
    - Visual grouping label "Draft Tools".

#### 1.5 Thread Tools

- **Overview:**  
  This block manages Gmail threads, including retrieving single threads, listing multiple threads, replying to threads, and managing thread labels.

- **Nodes Involved:**  
  - getThread  
  - getManyThreads  
  - replyThread  
  - addLabelThread  
  - removeLabelThread  
  - Sticky Note3 (Thread Tools)

- **Node Details:**  

  - **getThread**  
    - Operation: Retrieve a thread by ID, optionally returning only messages.  
    - Parameters: `Thread_ID` and option `returnOnlyMessages`.  
    - Edge Cases: Thread not found.

  - **getManyThreads**  
    - Operation: List threads filtered by search query, received dates, and return all or limited.  
    - Parameters: `Search`, `Received_After`, `Received_Before`, `Return_All`.  
    - Edge Cases: Large result sets.

  - **replyThread**  
    - Operation: Reply to a thread.  
    - Parameters: Message body, CC, BCC, `Thread_ID`.  
    - Edge Cases: Invalid thread ID.

  - **addLabelThread** / **removeLabelThread**  
    - Operation: Add or remove labels from a thread.  
    - Parameters: Label IDs or names, `Thread_ID`.  
    - Edge Cases: Label or thread not found.

  - **Sticky Note3 (Thread Tools)**  
    - Visual grouping label "Thread Tools".

#### 1.6 Documentation Sticky Notes

- **Overview:**  
  These nodes provide usage instructions and context for users importing or modifying the workflow.

- **Nodes Involved:**  
  - Sticky Note4 (Usage Instructions)

- **Node Details:**  

  - **Sticky Note4**  
    - Content: Instructions to open the Gmail MCP Server node to obtain the SSE URL and use it in AI agent configurations.  
    - Positioned separately for visibility.

---

### 3. Summary Table

| Node Name         | Node Type                            | Functional Role                | Input Node(s)        | Output Node(s)       | Sticky Note                                                                                   |
|-------------------|------------------------------------|-------------------------------|----------------------|----------------------|----------------------------------------------------------------------------------------------|
| Gmail MCP Server   | MCP Trigger (`mcpTrigger`)          | SSE endpoint for AI agents    | Multiple GmailTool nodes via `ai_tool` | AI agents (SSE stream) | Usage: Open this node to get SSE URL for AI agent integration.                              |
| get               | GmailTool                          | Get single message            | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| delete            | GmailTool                          | Delete message                | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| reply             | GmailTool                          | Reply to message              | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| markAsRead        | GmailTool                          | Mark message as read          | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| markAsUnread      | GmailTool                          | Mark message as unread        | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| addLabels         | GmailTool                          | Add labels to message         | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| removeLabels      | GmailTool                          | Remove labels from message    | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| Sticky Note       | Sticky Note                       | Visual grouping "Message Tools" | None                 | None                 | "## Message Tools"                                                                           |
| getLabels         | GmailTool                          | List all labels               | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| getLabel          | GmailTool                          | Get label details             | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| createLabel       | GmailTool                          | Create new label              | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| deleteLabel       | GmailTool                          | Delete label                  | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| Sticky Note1      | Sticky Note                       | Visual grouping "Label Tools" | None                 | None                 | "## Label Tools"                                                                             |
| createDraft       | GmailTool                          | Create draft email            | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| getDraft          | GmailTool                          | Get draft email               | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| deleteDraft       | GmailTool                          | Delete draft email            | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| getManyDrafts     | GmailTool                          | List drafts                   | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| Sticky Note2      | Sticky Note                       | Visual grouping "Draft Tools" | None                 | None                 | "## Draft Tools"                                                                             |
| getManyThreads    | GmailTool                          | List threads                  | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| getThread         | GmailTool                          | Get thread details            | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| replyThread       | GmailTool                          | Reply to thread               | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| addLabelThread    | GmailTool                          | Add labels to thread          | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| removeLabelThread | GmailTool                          | Remove labels from thread     | Gmail MCP Server     | Gmail MCP Server     |                                                                                              |
| Sticky Note3      | Sticky Note                       | Visual grouping "Thread Tools" | None                 | None                 | "## Thread Tools"                                                                            |
| Sticky Note4      | Sticky Note                       | Usage instructions            | None                 | None                 | "## USAGE\n\nOpen the Gmail MCP Server node to obtain the SSE server URL.\nUse that to configure an N8N AI Agent flow or other AI tool." |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail OAuth2 Credential:**  
   - Set up OAuth2 credentials for Gmail API access in n8n with appropriate scopes (e.g., Gmail read/write).

2. **Add MCP Trigger Node:**  
   - Node Type: `@n8n/n8n-nodes-langchain.mcpTrigger`  
   - Name: `Gmail MCP Server`  
   - Parameters: Set `path` to `"gmail"`  
   - No credentials needed here.  
   - This node will serve as the SSE endpoint.

3. **Add Message Tools Nodes:**  
   - For each operation below, add a `gmailTool` node, set credentials to the Gmail OAuth2 credential, and configure parameters as follows:  
     - **get:** Operation `get`, parameter `messageId` from AI input.  
     - **delete:** Operation `delete`, parameter `messageId`.  
     - **reply:** Operation `reply`, parameters: `message` (text), `ccList`, `bccList`, `attachmentsBinary` (binary field name), `messageId`. Email type set to `text`.  
     - **markAsRead:** Operation `markAsRead`, parameter `messageId`.  
     - **markAsUnread:** Operation `markAsUnread`, parameter `messageId`.  
     - **addLabels:** Operation `addLabels`, parameters: `labelIds`, `messageId`.  
     - **removeLabels:** Operation `removeLabels`, parameters: `labelIds`, `messageId`.  
   - Connect each node’s `ai_tool` output to the MCP Trigger node’s corresponding input.

4. **Add Label Tools Nodes:**  
   - Add `gmailTool` nodes with Gmail OAuth2 credentials:  
     - **getLabels:** Resource `label`, operation `getAll`, parameter `returnAll` boolean.  
     - **getLabel:** Resource `label`, operation `get`, parameter `labelId`.  
     - **createLabel:** Resource `label`, operation `create`, parameter `name`.  
     - **deleteLabel:** Resource `label`, operation `delete`, parameter `labelId`.  
   - Connect each node’s `ai_tool` output to the MCP Trigger node.

5. **Add Draft Tools Nodes:**  
   - Add `gmailTool` nodes with Gmail OAuth2 credentials:  
     - **createDraft:** Resource `draft`, operation `create`, parameters: `message`, `subject`, `ccList`, `bccList`, `attachmentsBinary`.  
     - **getDraft:** Resource `draft`, operation `get`, parameter `messageId` (draft ID).  
     - **deleteDraft:** Resource `draft`, operation `delete`, parameter `messageId`.  
     - **getManyDrafts:** Resource `draft`, operation `getAll`, parameters: `includeSpamTrash` boolean, `returnAll` boolean.  
   - Connect each node’s `ai_tool` output to the MCP Trigger node.

6. **Add Thread Tools Nodes:**  
   - Add `gmailTool` nodes with Gmail OAuth2 credentials:  
     - **getThread:** Resource `thread`, operation `get`, parameters: `threadId`, option `returnOnlyMessages` boolean.  
     - **getManyThreads:** Resource `thread`, operation `getAll`, parameters: search filters (`q`, `receivedAfter`, `receivedBefore`), `returnAll` boolean.  
     - **replyThread:** Resource `thread`, operation `reply`, parameters: `message`, `ccList`, `bccList`, `threadId`.  
     - **addLabelThread:** Resource `thread`, operation `addLabels`, parameters: `labelIds`, `threadId`.  
     - **removeLabelThread:** Resource `thread`, operation `removeLabels`, parameters: `labelIds`, `threadId`.  
   - Connect each node’s `ai_tool` output to the MCP Trigger node.

7. **Add Sticky Notes for Documentation:**  
   - Add sticky notes to visually group nodes by function:  
     - Message Tools  
     - Label Tools  
     - Draft Tools  
     - Thread Tools  
     - Usage Instructions (explaining how to get the SSE URL and use it in AI agents).

8. **Set Node Positions:**  
   - Arrange nodes logically in the editor for clarity, grouping by function.

9. **Activate Workflow:**  
   - Ensure the workflow is active and test the SSE URL from the MCP Trigger node.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                  |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow requires n8n version ≥ 1.88 for MCP Trigger node support.                              | Version requirement for MCP Trigger node.                                                      |
| Set up Gmail OAuth2 credentials with appropriate scopes (e.g., Gmail API full access).          | Credential setup prerequisite.                                                                 |
| Usage: Open the Gmail MCP Server node to copy the SSE URL and paste it into AI agent “Tool Server” field. | Usage instructions embedded in Sticky Note4.                                                   |
| This workflow is designed to be extensible: add more GmailTool operations or swap credentials without changing AI agent logic. | Extensibility note from description.                                                           |
| For more information on Gmail API scopes and usage, refer to Google’s official Gmail API docs.  | External resource (not linked here but recommended).                                           |

---

This documentation provides a complete, structured reference for understanding, reproducing, and extending the Gmail MCP Server workflow in n8n. It is suitable for advanced users and AI agents to integrate Gmail operations seamlessly into AI-driven automation.