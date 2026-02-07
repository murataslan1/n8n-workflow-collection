Automate Email & Calendar Management with Gmail, Google Calendar & GPT-4o AI

https://n8nworkflows.xyz/workflows/automate-email---calendar-management-with-gmail--google-calendar---gpt-4o-ai-4366


# Automate Email & Calendar Management with Gmail, Google Calendar & GPT-4o AI

---

# 1. Workflow Overview

This workflow, titled **"[AOE] Inbox & Calendar Management Agent"**, automates comprehensive email and calendar management by integrating Gmail, Google Calendar, and GPT-4o AI capabilities. It is designed to serve as a personal AI assistant that analyzes emails, drafts replies, manages calendar events, and provides structured insights into inbox and calendar data.

**Target Use Cases:**

- Automated processing and classification of incoming Gmail messages.
- Generating AI-driven draft replies and email summaries.
- Managing Google Calendar events including retrieval and creation.
- Maintaining conversational context with memory and vector stores.
- Enabling multi-modal triggers including chat inputs and workflow executions.
- Supporting autonomous and user-confirmed actions to optimize email and calendar productivity.

**Logical Blocks:**

- **1.1 Input Reception & Triggers:** Nodes handling incoming chat messages, manual triggers, Gmail push triggers, and external workflow executions.
- **1.2 Email Retrieval & Processing:** Fetching emails and threads, summarizing email content, classifying emails, and labeling them in Gmail.
- **1.3 AI Analysis & Memory:** Utilizing OpenAI GPT-4o models for chat processing, embeddings generation, vector storage for historical context, and memory buffers.
- **1.4 Email Drafting & Management:** Creating new draft emails or replies, deleting emails upon AI instruction.
- **1.5 Calendar Event Handling:** Retrieving calendar events, adding new events, and converting date formats.
- **1.6 Utility & Support Nodes:** Code nodes for email summarization, date formatting, and sticky notes for documentation and guidance.

---

# 2. Block-by-Block Analysis

---

### 2.1 Input Reception & Triggers

**Overview:**  
This block captures inputs from various sources, including chat messages, manual triggers, Gmail pushes, and external workflow calls, to initiate the workflow.

**Nodes Involved:**  
- When chat message received  
- When Executed by Another Workflow  
- Gmail Trigger  
- When clicking ‘Test workflow’  
- sessionId-master (NoOp node for passing sessionId)  

**Node Details:**

- **When chat message received**  
  - Type: LangChain Chat Trigger  
  - Role: Listens for incoming chat messages to start the AI-driven email and calendar management process.  
  - Configuration: Uses a webhook to receive chat messages; no extra options set.  
  - Inputs: External chat message via webhook.  
  - Outputs: Passes to `sessionId-master`.  
  - Potential Failures: Webhook connectivity, malformed chat data.

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Allows this workflow to be triggered programmatically by another workflow with inputs `sessionId` and `chatInput`.  
  - Inputs: Workflow inputs containing session context and chat text.  
  - Outputs: Passes to `sessionId-master`.  
  - Edge Cases: Missing inputs or incorrect data types may cause failures.

- **Gmail Trigger**  
  - Type: Gmail Trigger  
  - Role: Monitors Gmail inbox for new emails every minute to trigger processing.  
  - Configuration: Polls Gmail inbox with no specific filters (monitors all incoming emails).  
  - Credentials: Gmail OAuth2 required.  
  - Outputs: Passes emails to `Classify Emails` and `Gmail - get recent Threads`.  
  - Failure Modes: OAuth token expiration, API rate limits.

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual initiation of the workflow for testing purposes.  
  - Outputs: Passes to `Gmail - get recent Threads`.  

- **sessionId-master (NoOp)**  
  - Type: No Operation (NoOp)  
  - Role: Acts as a pass-through node to hold and forward the session ID for contextual continuity.  
  - Outputs: Connects to the `EMail Agent`.  

---

### 2.2 Email Retrieval & Processing

**Overview:**  
Responsible for retrieving emails and threads from Gmail, summarizing their content, classifying them into categories, and applying Gmail labels accordingly.

**Nodes Involved:**  
- Get last emails  
- Gmail - get recent Threads  
- Gmail1 (Get specific thread)  
- Code - Summarize Email Thread as Text  
- Classify Emails  
- Gmail - Label as Colleges  
- Gmail label as kunde  

**Node Details:**

- **Get last emails**  
  - Type: Gmail Tool  
  - Role: Fetches the latest emails from the inbox.  
  - Configuration: Uses dynamic limit from AI input (`limit`), filters inbox only.  
  - Credentials: Gmail OAuth2.  
  - Outputs: Passes emails to `EMail Agent`.  
  - Failures: API quota, invalid query syntax.

- **Gmail - get recent Threads**  
  - Type: Gmail (threads resource)  
  - Role: Retrieves recent Gmail threads for deeper email context.  
  - Credentials: Gmail OAuth2.  
  - Outputs: Passes thread IDs to `Gmail1`.  

- **Gmail1**  
  - Type: Gmail (thread get operation)  
  - Role: Retrieves detailed data of a specific email thread by thread ID.  
  - Inputs: Thread ID from `Gmail - get recent Threads`.  
  - Outputs: Passes to `Code - Summarize Email Thread as Text`.  

- **Code - Summarize Email Thread as Text**  
  - Type: Code (JavaScript)  
  - Role: Processes each email message in a thread to create a formatted summary text with date, sender, recipient, subject, and snippet.  
  - Key Code Logic: Converts internal timestamp to ISO date, formats message details, concatenates with separators.  
  - Inputs: Messages array from Gmail1 node.  
  - Outputs: Enriches JSON with `emailSummary`, passes to `Default Data Loader`.  
  - Edge Cases: Missing fields in emails, invalid timestamps.

- **Classify Emails**  
  - Type: LangChain Text Classifier  
  - Role: Classifies emails into categories like "Kollegen" (colleagues) or "Kunden" (customers) based on subject, sender, and snippet.  
  - Configuration: Uses fallback category "other" if no match.  
  - Categories configured with descriptions and criteria.  
  - Outputs: Based on classification, triggers either `Gmail - Label as Colleges` or `Gmail label as kunde`.  
  - Edge Cases: Ambiguous emails, misclassification.

- **Gmail - Label as Colleges**  
  - Type: Gmail (add label operation)  
  - Role: Adds a Gmail label for emails identified as from colleagues.  
  - Configuration: Uses label ID `Label_749967004333244217`.  
  - Inputs: Message ID from classification.  
  - Credentials: Gmail OAuth2.

- **Gmail label as kunde**  
  - Type: Gmail (add label operation)  
  - Role: Adds a Gmail label for emails identified as customers.  
  - Configuration: Uses label ID `Label_4725571417728382593`.  
  - Inputs: Message ID from classification.  
  - Credentials: Gmail OAuth2.

---

### 2.3 AI Analysis & Memory

**Overview:**  
This block powers the AI-driven analysis of emails and calendar data, maintaining conversational context and enabling research into past conversations via vector stores.

**Nodes Involved:**  
- OpenAI Chat Model  
- OpenAI Chat Model1  
- OpenAI Chat Model2  
- Embeddings OpenAI  
- Embeddings OpenAI1  
- Threads History Vector Store  
- Write - Threads History Vector Store  
- Read- Threads History Vector Store  
- Research context and infos in previous conversations  
- Window Buffer Memory  
- EMail Agent  

**Node Details:**

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Processes chat inputs using GPT-4o model for natural language understanding and generation.  
  - Credentials: OpenAI API key.  
  - Inputs: From `sessionId-master`.  
  - Outputs: Feeds into `EMail Agent`.  
  - Edge Cases: API rate limits, model unavailability.

- **OpenAI Chat Model1**  
  - Similar to above but uses "gpt-4o-mini" model variant for context research.  
  - Inputs: Vector store queries.  
  - Outputs: `Research context and infos in previous conversations`.

- **OpenAI Chat Model2**  
  - Uses "gpt-4.1-mini" model for email classification assistance.  
  - Inputs: Email subject and snippet text.

- **Embeddings OpenAI**  
  - Generates vector embeddings for email content to support semantic search.  
  - Inputs: Summarized email data from `Default Data Loader`.  
  - Outputs: Feeds both the read and write vector stores.

- **Embeddings OpenAI1**  
  - Generates embeddings for thread history data.

- **Threads History Vector Store**  
  - An in-memory vector store holding embeddings for past email conversations.  
  - Inputs: Populated by `Embeddings OpenAI1`.  
  - Outputs: Queried by `Research context and infos in previous conversations`.

- **Write - Threads History Vector Store**  
  - Inserts new embeddings into in-memory vector store.  
  - Configuration: Clears store on each run to refresh data.

- **Read- Threads History Vector Store**  
  - Performs semantic search on stored embeddings with a top-k limit of 100 results.

- **Research context and infos in previous conversations**  
  - LangChain Vector Store Tool using stored embeddings to answer questions about past emails, improving context-awareness.

- **Window Buffer Memory**  
  - Maintains a sliding window of recent conversational context with a window length of 10 entries, keyed by session ID.  
  - Inputs: Session ID dynamically resolved.  
  - Outputs: Feeds context into `EMail Agent`.

- **EMail Agent**  
  - LangChain Agent node acting as the core AI assistant managing emails and calendar.  
  - Configuration: Receives chat input, system prompt defines role and constraints (e.g., friendly draft replies, calendar awareness, confirmation before sending).  
  - Inputs: Chat messages, memory, email and calendar tools.  
  - Outputs: Drives subsequent email and calendar actions.

---

### 2.4 Email Drafting & Management

**Overview:**  
Handles creation of new email drafts, replies to threads, and deletion of emails as directed by the AI assistant.

**Nodes Involved:**  
- Create an Email Draft as response to a thread  
- Create an New Email Draft  
- Delete an email  
- Get an email by MessageID  

**Node Details:**

- **Create an Email Draft as response to a thread**  
  - Type: Gmail Tool (draft creation)  
  - Role: Creates a draft reply within an existing thread.  
  - Parameters: Receives message text, recipient email, subject, and thread ID dynamically from AI inputs.  
  - Credentials: Gmail OAuth2.  
  - Potential Failures: Invalid thread ID, missing recipient.

- **Create an New Email Draft**  
  - Type: Gmail Tool (draft creation)  
  - Role: Creates a new outgoing draft email not linked to any thread.  
  - Parameters: Message body, recipient email, and subject from AI inputs.  
  - Credentials: Gmail OAuth2.

- **Delete an email**  
  - Type: Gmail Tool (delete operation)  
  - Role: Deletes an email by message ID as instructed by the AI agent.  
  - Parameters: Message ID from AI input.  
  - Credentials: Gmail OAuth2.  
  - Edge Cases: Email not found, insufficient permissions.

- **Get an email by MessageID**  
  - Type: Gmail Tool (get operation)  
  - Role: Fetches a specific email by its message ID, often for context or confirmation.  
  - Parameters: Message ID dynamically provided.  
  - Credentials: Gmail OAuth2.

---

### 2.5 Calendar Event Handling

**Overview:**  
Manages retrieval of calendar events and the creation of new calendar entries based on AI suggestions.

**Nodes Involved:**  
- Get calendar events  
- Add an calender entry  
- Determine the name of the day of the week  

**Node Details:**

- **Get calendar events**  
  - Type: Google Calendar Tool (get all events)  
  - Role: Retrieves calendar events within a specified time range.  
  - Parameters: Start and end datetime from AI inputs, event limit, target calendar email.  
  - Credentials: Google Calendar OAuth2.  
  - Edge Cases: Date format errors, calendar access permission denied.

- **Add an calender entry**  
  - Type: Google Calendar Tool (create event)  
  - Role: Creates new calendar events or meetings with summary and description.  
  - Parameters: Start and end times, summary, description provided by AI.  
  - Credentials: Google Calendar OAuth2.

- **Determine the name of the day of the week**  
  - Type: DateTime Tool  
  - Role: Formats a given date into a human-readable weekday name plus date (e.g., "Tuesday 14 06").  
  - Input: Date string from AI.  
  - Output: Formatted date string for display or further processing.

---

### 2.6 Utility & Support Nodes

**Overview:**  
These nodes provide utility functions, documentation, and placeholders for workflow management.

**Nodes Involved:**  
- Sticky Note (multiple instances)  
- Token Splitter  
- Default Data Loader  

**Node Details:**

- **Sticky Notes**  
  - Type: Sticky Note  
  - Role: Provide documentation, section titles, and guidance within the workflow editor for maintainers and users.  
  - Contents include: "Email Sorting Agent", "Email Access Tools", "Calendar Access Tools", "Email Thread Knowledge adder", "Main Inbox Assistance Agent".  

- **Token Splitter**  
  - Type: LangChain Text Splitter (Token-based)  
  - Role: Splits large email summaries into 2000 token chunks for embedding or processing limits.  

- **Default Data Loader**  
  - Type: LangChain Document Loader  
  - Role: Converts JSON email summary data into a format suitable for embedding generation.

---

# 3. Summary Table

| Node Name                              | Node Type                                    | Functional Role                        | Input Node(s)                      | Output Node(s)                                | Sticky Note                                                                                                 |
|--------------------------------------|----------------------------------------------|-------------------------------------|----------------------------------|-----------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| When chat message received            | LangChain Chat Trigger                        | Trigger: Chat message input          | External webhook                 | sessionId-master                              |                                                                                                             |
| When Executed by Another Workflow    | Execute Workflow Trigger                      | Trigger: External workflow call     | External workflow                | sessionId-master                              |                                                                                                             |
| Gmail Trigger                        | Gmail Trigger                                | Trigger: Gmail inbox push           | Gmail inbox                     | Classify Emails, Gmail - get recent Threads |                                                                                                             |
| When clicking ‘Test workflow’        | Manual Trigger                               | Manual trigger for testing           | Manual user                    | Gmail - get recent Threads                    |                                                                                                             |
| sessionId-master                    | NoOp                                         | Pass session ID                      | When chat message received, When Executed by Another Workflow | EMail Agent                                   |                                                                                                             |
| Get last emails                      | Gmail Tool                                   | Retrieve last emails from inbox     | External (from AI input)          | EMail Agent                                   |                                                                                                             |
| Gmail - get recent Threads          | Gmail (threads resource)                      | Retrieve recent threads              | Gmail Trigger, When clicking ‘Test workflow’ | Gmail1                                         |                                                                                                             |
| Gmail1                             | Gmail (thread get)                            | Get detailed thread data             | Gmail - get recent Threads        | Code - Summarize Email Thread as Text         |                                                                                                             |
| Code - Summarize Email Thread as Text | Code (JS)                                   | Summarize email thread content      | Gmail1                          | Default Data Loader                            |                                                                                                             |
| Classify Emails                    | LangChain Text Classifier                     | Classify emails into categories     | Gmail Trigger                   | Gmail - Label as Colleges, Gmail label as kunde |                                                                                                             |
| Gmail - Label as Colleges            | Gmail (add label)                            | Label emails from colleagues        | Classify Emails                 | None                                          |                                                                                                             |
| Gmail label as kunde                 | Gmail (add label)                            | Label emails from customers         | Classify Emails                 | None                                          |                                                                                                             |
| OpenAI Chat Model                  | LangChain OpenAI Chat Model                   | AI chat processing                  | sessionId-master                | EMail Agent                                   |                                                                                                             |
| OpenAI Chat Model1                 | LangChain OpenAI Chat Model                   | AI for research in past conversations | Embeddings OpenAI1             | Research context and infos in previous conversations |                                                                                                             |
| OpenAI Chat Model2                 | LangChain OpenAI Chat Model                   | AI for email classification        | Classify Emails                | Classify Emails                                |                                                                                                             |
| Embeddings OpenAI                 | LangChain Embeddings OpenAI                    | Generate embeddings for emails      | Default Data Loader             | Read- Threads History Vector Store, Write - Threads History Vector Store |                                                                                                             |
| Embeddings OpenAI1                | LangChain Embeddings OpenAI                    | Generate embeddings for thread history | Threads History Vector Store  | Threads History Vector Store                   |                                                                                                             |
| Threads History Vector Store        | LangChain Vector Store In-Memory              | Store past conversation embeddings | Embeddings OpenAI1             | Research context and infos in previous conversations |                                                                                                             |
| Write - Threads History Vector Store | LangChain Vector Store In-Memory              | Insert new embeddings               | Default Data Loader             | None                                          |                                                                                                             |
| Read- Threads History Vector Store  | LangChain Vector Store In-Memory              | Search embeddings                  | Embeddings OpenAI              | OpenAI Chat Model1                             |                                                                                                             |
| Research context and infos in previous conversations | LangChain Vector Store Tool                | Query past emails for context      | OpenAI Chat Model1             | EMail Agent                                   |                                                                                                             |
| Window Buffer Memory                | LangChain Memory Buffer Window                 | Maintain recent conversation context | sessionId-master               | EMail Agent                                   |                                                                                                             |
| EMail Agent                       | LangChain Agent                                | Core AI assistant managing emails and calendar | sessionId-master, OpenAI Chat Model, Window Buffer Memory, Get last emails, Delete an email, Create drafts, Calendar tools | Multiple email and calendar nodes               |                                                                                                             |
| Create an Email Draft as response to a thread | Gmail Tool (draft)                             | Create draft reply in thread        | EMail Agent                    | EMail Agent                                   |                                                                                                             |
| Create an New Email Draft           | Gmail Tool (draft)                             | Create new draft email              | EMail Agent                    | EMail Agent                                   |                                                                                                             |
| Delete an email                    | Gmail Tool (delete)                            | Delete email by message ID          | EMail Agent                    | EMail Agent                                   |                                                                                                             |
| Get an email by MessageID           | Gmail Tool (get)                               | Retrieve email by message ID        | EMail Agent                    | EMail Agent                                   |                                                                                                             |
| Get calendar events                | Google Calendar Tool (get all events)          | Retrieve calendar events            | EMail Agent                    | EMail Agent                                   |                                                                                                             |
| Add an calender entry              | Google Calendar Tool (create event)             | Create new calendar event           | EMail Agent                    | EMail Agent                                   |                                                                                                             |
| Determine the name of the day of the week | DateTime Tool                                  | Format date to weekday name         | EMail Agent                    | EMail Agent                                   |                                                                                                             |
| Token Splitter                    | LangChain Text Splitter (Token)                  | Split text into token chunks        | Default Data Loader            | Embeddings OpenAI                             |                                                                                                             |
| Default Data Loader               | LangChain Document Loader                        | Load email summary for embeddings   | Code - Summarize Email Thread as Text | Embeddings OpenAI, Write - Threads History Vector Store |                                                                                                             |
| Sticky Note (multiple nodes)       | Sticky Note                                    | Documentation and workflow notes    | None                          | None                                          | See notes in section 5                                                                                        |

---

# 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add **When chat message received** node (LangChain chat trigger) with webhook enabled.  
   - Add **When Executed by Another Workflow** (Execute Workflow Trigger) configured to accept `sessionId` and `chatInput` inputs.  
   - Add **Gmail Trigger** node configured to poll inbox every minute without filters, using Gmail OAuth2 credentials.  
   - Add **Manual Trigger** node named "When clicking ‘Test workflow’" for testing.

2. **Setup Session ID Pass-Through:**  
   - Add a NoOp node named `sessionId-master` to forward session context. Connect outputs of all triggers to this node.

3. **Connect to AI Chat Model:**  
   - Add **OpenAI Chat Model** node configured with model `gpt-4o` and appropriate OpenAI credentials.  
   - Connect `sessionId-master` output to this node.

4. **Configure Email Retrieval:**  
   - Add **Get last emails** node (Gmail Tool) with inbox filter and dynamic limit from AI input `limit`. Use Gmail OAuth2 credentials.  
   - Add **Gmail - get recent Threads** node (Gmail threads resource) with Gmail OAuth2 credentials.  
   - Add **Gmail1** node to get details of each thread; connect output of "Gmail - get recent Threads" to this.  
   - Add **Code node** named "Summarize Email Thread as Text" with JS code that formats messages into summary.  
   - Connect output of `Gmail1` to the Code node.

5. **Prepare Embeddings and Vector Store:**  
   - Add **Default Data Loader** node to load the summarized email text for embedding.  
   - Add **Token Splitter** to chunk text into max 2000 tokens.  
   - Add **Embeddings OpenAI** node to generate embeddings from chunks.  
   - Add **Write - Threads History Vector Store** node configured to clear the store before inserting embeddings.  
   - Add **Threads History Vector Store** (in-memory vector store) to hold embeddings.  
   - Add **Read- Threads History Vector Store** node configured to load top 100 matches.  
   - Connect these nodes in sequence from summarized email text to embedding generation and vector store insertion.

6. **Configure Email Classification and Labeling:**  
   - Add **Classify Emails** node (LangChain Text Classifier) with categories "Kollegen" and "Kunden" and fallback "other".  
   - Connect `Gmail Trigger` to `Classify Emails`.  
   - Add `Gmail - Label as Colleges` and `Gmail label as kunde` nodes to add corresponding Gmail labels based on classification.  
   - Connect classification outputs to these label nodes.

7. **Setup Email Drafting and Deletion:**  
   - Add **Create an Email Draft as response to a thread** node with dynamic parameters (`message`, `To_Email`, `Subject`, `thread-ID`) from AI inputs.  
   - Add **Create an New Email Draft** node for new draft emails with similar parameters excluding `thread-ID`.  
   - Add **Delete an email** node to delete emails by message ID from AI inputs.  
   - Add **Get an email by MessageID** node to retrieve specific emails on demand.

8. **Setup Calendar Management:**  
   - Add **Get calendar events** node with dynamic `timeMin`, `timeMax`, and `limit` from AI inputs. Use Google Calendar OAuth2 credentials.  
   - Add **Add an calender entry** node to create new events with `Start`, `End`, `Summary`, and `Description` from AI inputs.  
   - Add **Determine the name of the day of the week** DateTime node to format dates for display.

9. **Configure AI Memory:**  
   - Add **Window Buffer Memory** node for conversation context with window length 10, using session ID as key.  
   - Connect this memory to `EMail Agent` node.

10. **Add Core AI Agent:**  
    - Add **EMail Agent** node (LangChain Agent) with system prompt describing assistant role, constraints, and behavior.  
    - Connect inputs from chat models, email tools (get, create, delete), calendar tools, and memory.  

11. **Add Research Vector Store Tool:**  
    - Add **Research context and infos in previous conversations** (LangChain Vector Store Tool) node to answer questions by querying vector store.  
    - Connect outputs from `OpenAI Chat Model1` and vector store.

12. **Add Sticky Notes:**  
    - Add sticky notes throughout the workflow for documentation and guidance, replicating the content and positions from the original.

13. **Credential Setup:**  
    - Configure Gmail OAuth2 credentials with appropriate scopes for reading, labeling, drafting, and deleting emails.  
    - Configure Google Calendar OAuth2 credentials for reading and writing calendar events.  
    - Configure OpenAI API credentials with access to GPT-4o and related models.

14. **Connect All Nodes According to Logical Flow:**  
    - Ensure all nodes are connected as per the original, particularly with AI inputs feeding tool nodes and outputs feeding back into the agent for autonomous decision-making.

---

# 5. General Notes & Resources

| Note Content                                                                                                                                                                  | Context or Link                                    |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| **Main Inbox Assistance Agent**: Before using, modify the classifier agent to fit your needs and add Gmail labels accordingly. Also, adjust prompts to your role and company. | Sticky Note near `sessionId-master` node.          |
| More professional AI agents and resources available at [AOE AI Lab](https://ai-radar.aoe.com/).                                                                               | Sticky Note near the start of the workflow.        |
| AI Assistant Prompt defines clear role for the assistant: friendly, professional drafts; calendar awareness; confirmation before sending emails or creating events.            | Embedded in `EMail Agent` node parameters.          |
| Gmail label IDs like `Label_4725571417728382593` and `Label_749967004333244217` must be pre-created in Gmail for correct labeling.                                           | Labeling nodes (`Gmail label as kunde` and `Gmail - Label as Colleges`). |
| Calendar timestamps from Google API are in UTC; the assistant converts these to user timezone (+2) for display and scheduling.                                               | System prompt instructions.                         |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, a workflow automation tool. This processing strictly adheres to existing content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.

---