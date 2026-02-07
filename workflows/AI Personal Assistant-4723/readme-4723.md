AI Personal Assistant

https://n8nworkflows.xyz/workflows/ai-personal-assistant-4723


# AI Personal Assistant

---
### 1. Workflow Overview

This workflow, titled **AI Personal Assistant**, is designed to automate and streamline the management of professional communications and scheduling for Max Mitcham, focusing on email triage, meeting follow-ups, and Slack message monitoring. It integrates Gmail, Google Calendar, Slack, Fireflies transcription service, and Google Sheets with advanced AI agents powered by Anthropic language models to analyze, prioritize, and synthesize actionable insights. 

The workflow logically decomposes into the following blocks:

- **1.1 Input Reception & Triggering**: Initiates workflow execution via manual or scheduled triggers.
- **1.2 Email Processing & Prioritization**: Fetches emails (unread, sent, and specific queries), uses AI to triage and categorize emails by urgency and relevance.
- **1.3 Meeting Follow-up Management**: Extracts recent meetings from Google Calendar, fetches meeting transcripts, checks follow-up communications, and flags meetings requiring attention.
- **1.4 Slack Monitoring & Contextual Analysis**: Monitors Slack for unreplied direct messages and mentions, correlates with email and meeting data, prioritizes Slack responses.
- **1.5 Master Orchestration & Daily Briefing Compilation**: Aggregates outputs from email, meeting, and Slack agents, cross-references with prior to-do tasks stored in Google Sheets, and produces a consolidated daily briefing and to-do list.
- **1.6 Output & Notification**: Appends the final briefing to Google Sheets and sends a Slack message with the briefing to Max Mitcham.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Triggering

- **Overview:** This block sets off the workflow either manually or on a scheduled basis (weekdays at 8 AM), ensuring timely execution.

- **Nodes Involved:**
  - Schedule Trigger
  - When clicking ‘Test workflow’

- **Node Details:**

  - **Schedule Trigger**
    - Type: Schedule trigger
    - Configuration: Runs weekly Monday through Friday at 8:00 AM
    - Inputs: None (trigger node)
    - Outputs: Connects to "Email Assistant"
    - Edge Cases: Missed triggers if n8n instance is down; time zone considerations.
  
  - **When clicking ‘Test workflow’**
    - Type: Manual trigger
    - Configuration: Triggered manually for testing or ad hoc runs
    - Inputs: None
    - Outputs: Connects to "Email Assistant"
    - Edge Cases: Only triggers on manual user action; no automatic invocation.

---

#### 2.2 Email Processing & Prioritization

- **Overview:** This block fetches various categories of emails including unread emails to respond to, unread FYI emails, sent emails, and specific email retrieval by message ID. It uses Anthropic AI to triage emails, maintain session memory, and generate prioritized actions.

- **Nodes Involved:**
  - Get Email
  - Unread Emails - To Respond
  - Unread Emails - FYI
  - Check Sent
  - Anthropic Chat Model (Claude Sonnet 4)
  - Simple Memory
  - Email Assistant (LangChain Agent)

- **Node Details:**

  - **Get Email**
    - Type: Gmail Tool (v2.1)
    - Role: Retrieves a specific email based on a Message ID input dynamically provided
    - Configuration: Operation "get" with dynamic messageId expression
    - Credentials: Gmail OAuth2
    - Inputs: Trigger inputs from Email Assistant via AI override
    - Outputs: Email content JSON
    - Edge Cases: Invalid message ID, API rate limits, authentication expiry.
  
  - **Unread Emails - To Respond**
    - Type: Gmail Tool (v2.1)
    - Role: Fetches unread emails labeled for response
    - Configuration: Filters with unread status and specific label IDs, returns all messages optionally based on AI input
    - Credentials: Gmail OAuth2
    - Outputs: List of emails needing response
    - Edge Cases: Label IDs may change; unread status filtering may miss edge cases.
  
  - **Unread Emails - FYI**
    - Type: Gmail Tool (v2.1)
    - Role: Fetches unread emails flagged as FYI
    - Configuration: Filters with specific label IDs and unread status
    - Credentials: Gmail OAuth2
    - Outputs: List of FYI emails
    - Edge Cases: Same as above.
  
  - **Check Sent**
    - Type: Gmail Tool (v2.1)
    - Role: Retrieves sent emails filtered by recipient email dynamically from AI input
    - Configuration: Search query formatted as `to:{{ $fromAI('email') }}` and label "SENT"
    - Credentials: Gmail OAuth2
    - Outputs: Sent email messages for follow-up verification
    - Edge Cases: Email address format errors, rate limits.
  
  - **Anthropic Chat Model**
    - Type: LangChain Anthropic LM Chat (v1.3)
    - Role: AI model used for analyzing and triaging emails
    - Configuration: Model set to "claude-sonnet-4-20250514"
    - Credentials: Anthropic API
    - Inputs: Email content and context
    - Outputs: Prioritized email triage and recommendations
    - Edge Cases: API timeouts, model errors, prompt length limitations.
  
  - **Simple Memory**
    - Type: LangChain Memory Buffer (v1.3)
    - Role: Maintains conversational context window (50 tokens)
    - Configuration: SessionKey "1", custom session ID
    - Inputs: Email Assistant node input/output
    - Edge Cases: Memory overflow or context loss for long conversations.
  
  - **Email Assistant**
    - Type: LangChain Agent (v1.9)
    - Role: Central AI agent managing email triage and follow-ups
    - Configuration: System message defines assistant’s role, tasks, and access to Email, Slack, Calendar
    - Inputs: Trigger from Schedule or Manual, emails from Gmail nodes, memory from Simple Memory, model from Anthropic Chat Model
    - Outputs: Processed email triage report with priorities and flagged items
    - Edge Cases: Misinterpretation of email context, failure in AI processing, missing data.

---

#### 2.3 Meeting Follow-up Management

- **Overview:** Focuses on recent meetings retrieval, transcript fetching, and follow-up status verification via sent emails. It flags meetings requiring manual review or action.

- **Nodes Involved:**
  - Google Calendar
  - Fetch FireFlies
  - Check Sent1
  - Anthropic Chat Model1 (Claude Opus 4)
  - Follow Up Assistant (LangChain Agent)

- **Node Details:**

  - **Google Calendar**
    - Type: Google Calendar Tool (v1.3)
    - Role: Retrieves all meetings in a specified date range (passed from AI input)
    - Configuration: Calendar email "max@trigify.io", with dynamic after/before times and returnAll flag
    - Credentials: Google Calendar OAuth2
    - Inputs: AI parameters for timeMin and timeMax dynamically injected
    - Outputs: List of meetings with metadata
    - Edge Cases: Timezone mismatches, calendar access issues.
  
  - **Fetch FireFlies**
    - Type: HTTP Request (v4.2)
    - Role: Queries Fireflies API to fetch meeting transcripts based on participant email
    - Configuration: POST to Fireflies GraphQL endpoint with query for transcripts filtering by participant email
    - Authentication: Bearer token in header
    - Inputs: Participant email from AI input
    - Outputs: Transcript data including action items and summary
    - Edge Cases: API failures, missing transcripts, invalid tokens.
  
  - **Check Sent1**
    - Type: Gmail Tool (v2.1)
    - Role: Checks sent emails to verify if follow-up emails were sent to meeting participants
    - Configuration: Search query `to:{{ $fromAI('email') }}` with label "SENT"
    - Credentials: Gmail OAuth2
    - Inputs: Participant emails from AI input
    - Outputs: Sent email data for follow-up confirmation
    - Edge Cases: Similar to Check Sent node.
  
  - **Anthropic Chat Model1**
    - Type: LangChain Anthropic LM Chat (v1.3)
    - Role: AI model analyzing meetings, transcripts, and follow-ups
    - Configuration: Model set to "claude-opus-4-20250514"
    - Credentials: Anthropic API
    - Inputs: Meetings and transcript data
    - Outputs: Analysis and flags for meetings needing attention or follow-up
    - Edge Cases: Similar to other AI nodes.
  
  - **Follow Up Assistant**
    - Type: LangChain Agent (v1.9)
    - Role: Agent tasks to proactively manage follow-ups for meetings involving Max
    - Configuration: Detailed system prompt with objectives, context, criteria for flagging meetings without transcripts, and follow-up checks
    - Inputs: Meetings from Google Calendar, transcripts from Fireflies, sent emails from Check Sent1, Anthropic Chat Model1
    - Outputs: Lists of flagged meetings requiring manual review or follow-up
    - Edge Cases: Missing or incomplete meeting data, transcript unavailability, false positives/negatives in follow-up detection.

---

#### 2.4 Slack Monitoring & Contextual Analysis

- **Overview:** Monitors Slack direct messages and mentions to Max Mitcham, determines if Max has replied, fetches related email and meeting context, and prioritizes Slack responses.

- **Nodes Involved:**
  - Slack1 (Slack Search)
  - Check Slack Mentions
  - Check Thread Mentions
  - Get User (Slack User Info)
  - Anthropic Chat Model3 (Claude Sonnet 4)
  - Slack Assistant (LangChain Agent)
  - Slack (Slack Tool v2.3)

- **Node Details:**

  - **Slack1**
    - Type: Slack (v2.3)
    - Role: Searches Slack messages posted by Max in a specific channel
    - Configuration: Query "in:<#C08RV147W01> from:me"
    - Credentials: Slack API token
    - Outputs: Slack messages for context
    - Edge Cases: Slack API rate limits, channel access issues.
  
  - **Check Slack Mentions**
    - Type: Slack Tool (v2.3)
    - Role: Searches Slack for mentions to Max’s Slack ID
    - Configuration: Query using Max’s Slack User ID
    - Credentials: Slack API token
    - Outputs: Messages mentioning Max
    - Edge Cases: ID changes, missing mentions.
  
  - **Check Thread Mentions**
    - Type: Slack Tool (v2.3)
    - Role: Searches for messages in threads in a specified channel from Max
    - Configuration: Dynamic query using channel ID from AI input
    - Credentials: Slack API token
    - Outputs: Thread messages
    - Edge Cases: Channel ID invalid or missing, thread depth limitations.
  
  - **Get User**
    - Type: Slack Tool (v2.3)
    - Role: Fetches Slack user info by User ID provided dynamically
    - Credentials: Slack API token
    - Outputs: User metadata (email, name)
    - Edge Cases: User ID invalid or expired.
  
  - **Anthropic Chat Model3**
    - Type: LangChain Anthropic LM Chat (v1.3)
    - Role: AI analyzing Slack messages for prioritization and context
    - Credentials: Anthropic API
    - Outputs: Prioritized Slack message analysis
    - Edge Cases: Model limitations.
  
  - **Slack Assistant**
    - Type: LangChain Agent (v1.9)
    - Role: Proactive Slack assistant analyzing unreplied messages, gathering email and meeting context, and prioritizing responses
    - Configuration: System message defines objectives and workflow including Slack message retrieval, checking replies, email and Fireflies context gathering
    - Inputs: Slack message data, email search, Fireflies transcript info
    - Outputs: Prioritized Slack response report
    - Edge Cases: Slack API failures, incomplete context, AI misinterpretation.
  
  - **Slack**
    - Type: Slack Tool (v2.3)
    - Role: Sends final daily briefing message to Max’s Slack user
    - Configuration: User set to Max’s Slack ID, text dynamically composed from Master Orchestrator output
    - Credentials: Slack API token
    - Edge Cases: Message delivery failures.

---

#### 2.5 Master Orchestration & Daily Briefing Compilation

- **Overview:** Synthesizes outputs from Email Assistant, Follow Up Assistant, Slack Assistant, and Previous To-Do's Google Sheet into a prioritized, actionable daily briefing and task list for Max Mitcham.

- **Nodes Involved:**
  - Previous To Do (Google Sheets)
  - Master Orchestrator Agent (LangChain Agent)
  - Anthropic Chat Model2 (Claude Sonnet 4)
  - Google Sheets (Append)
  - Slack2 (Slack Message Send)

- **Node Details:**

  - **Previous To Do**
    - Type: Google Sheets Tool (v4.5)
    - Role: Fetches all previous to-do entries from a Google Sheet for cross-referencing
    - Configuration: Reads sheet “gid=0” from specific documentId
    - Credentials: Google Sheets OAuth2
    - Outputs: List of pending/running to-do tasks
    - Edge Cases: Sheet access issues, schema changes.
  
  - **Master Orchestrator Agent**
    - Type: LangChain Agent (v1.9)
    - Role: AI synthesizer merging all prior agent outputs and previous task data into a consolidated daily briefing
    - Configuration: Detailed system prompt defining inputs, instructions, and output formatting
    - Inputs: Outputs from Email Assistant, Follow Up Assistant, Slack Assistant, and Previous To Do
    - Outputs: Final prioritized daily briefing text
    - Edge Cases: AI failures, inconsistent data inputs.
  
  - **Anthropic Chat Model2**
    - Type: LangChain Anthropic LM Chat (v1.3)
    - Role: Language model supporting the Master Orchestrator Agent
    - Credentials: Anthropic API
    - Inputs: Aggregated data
    - Outputs: Refined synthesized text
    - Edge Cases: Same as above.
  
  - **Google Sheets**
    - Type: Google Sheets (v4.5)
    - Role: Appends the daily briefing to a Google Sheet as a new to-do entry
    - Configuration: Target sheet “gid=0” with columns "Date" and "To-Do"
    - Credentials: Google Sheets OAuth2
    - Inputs: Master Orchestrator output mapped to "To-Do" column with current date
    - Edge Cases: API quotas, append failures.
  
  - **Slack2**
    - Type: Slack Tool (v2.3)
    - Role: Sends the compiled daily briefing to Max's Slack user account
    - Configuration: User set to Max’s Slack ID, message text from Master Orchestrator output
    - Credentials: Slack API token
    - Edge Cases: Slack API rate limits, message not delivered.

---

### 3. Summary Table

| Node Name               | Node Type                       | Functional Role                              | Input Node(s)                          | Output Node(s)                      | Sticky Note                                                              |
|-------------------------|--------------------------------|----------------------------------------------|---------------------------------------|-----------------------------------|-------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger               | Triggers workflow weekdays at 8 AM          | None                                  | Email Assistant                   |                                                                         |
| When clicking ‘Test workflow’ | Manual Trigger                | Manual start for testing                      | None                                  | Email Assistant                   |                                                                         |
| Get Email               | Gmail Tool (v2.1)              | Retrieves specific email by Message ID       | Email Assistant                      | Email Assistant                   |                                                                         |
| Unread Emails - To Respond | Gmail Tool (v2.1)              | Fetch unread emails needing response         | Email Assistant                      | Email Assistant                   |                                                                         |
| Unread Emails - FYI     | Gmail Tool (v2.1)              | Fetch unread FYI emails                        | Email Assistant                      | Email Assistant                   |                                                                         |
| Check Sent              | Gmail Tool (v2.1)              | Checks sent emails to validate follow-ups    | Email Assistant                      | Email Assistant                   |                                                                         |
| Anthropic Chat Model    | LangChain Anthropic LM Chat    | AI for email triage and prioritization       | Email Assistant                      | Email Assistant                   |                                                                         |
| Simple Memory           | LangChain Memory Buffer        | Maintains conversational context             | Email Assistant                      | Email Assistant                   |                                                                         |
| Email Assistant         | LangChain Agent                | Processes email triage and flags actions     | Schedule Trigger, Manual Trigger, Gmail nodes, Anthropic Chat Model, Simple Memory | Follow Up Assistant              |                                                                         |
| Google Calendar         | Google Calendar Tool (v1.3)    | Retrieves recent meetings for follow-up      | Follow Up Assistant                  | Follow Up Assistant               |                                                                         |
| Fetch FireFlies         | HTTP Request (v4.2)            | Fetches meeting transcripts from Fireflies   | Follow Up Assistant                  | Follow Up Assistant               | Use participant email from meetings for transcript fetch               |
| Check Sent1             | Gmail Tool (v2.1)              | Checks sent emails for meeting follow-ups    | Follow Up Assistant                  | Follow Up Assistant               |                                                                         |
| Anthropic Chat Model1   | LangChain Anthropic LM Chat    | AI analyzing meeting transcripts and follow-ups | Follow Up Assistant               | Follow Up Assistant               |                                                                         |
| Follow Up Assistant     | LangChain Agent                | Manages meeting follow-up detection and flagging | Email Assistant, Google Calendar, Fetch FireFlies, Check Sent1, Anthropic Chat Model1 | Slack Assistant                  |                                                                         |
| Slack1                  | Slack Tool (v2.3)              | Searches Slack messages from Max in channel  | Slack Assistant                     | Slack Assistant                  |                                                                         |
| Check Slack Mentions    | Slack Tool (v2.3)              | Searches Slack mentions to Max                | Slack Assistant                     | Slack Assistant                  |                                                                         |
| Check Thread Mentions   | Slack Tool (v2.3)              | Searches Slack thread messages by Max        | Slack Assistant                     | Slack Assistant                  |                                                                         |
| Get User                | Slack Tool (v2.3)              | Fetches Slack user info by ID                 | Slack Assistant                     | Slack Assistant                  |                                                                         |
| Anthropic Chat Model3   | LangChain Anthropic LM Chat    | AI analyzing Slack messages                    | Slack Assistant                     | Slack Assistant                  |                                                                         |
| Slack Assistant         | LangChain Agent                | Prioritizes Slack replies and gathers context | Follow Up Assistant                 | Master Orchestrator Agent        |                                                                         |
| Previous To Do          | Google Sheets Tool (v4.5)      | Reads prior to-do list                         | Master Orchestrator Agent           | Master Orchestrator Agent        |                                                                         |
| Master Orchestrator Agent | LangChain Agent                | Synthesizes all reports into daily briefing  | Email Assistant, Follow Up Assistant, Slack Assistant, Previous To Do | Google Sheets, Slack2             |                                                                         |
| Anthropic Chat Model2   | LangChain Anthropic LM Chat    | Supports Master Orchestrator AI               | Master Orchestrator Agent           | Master Orchestrator Agent        |                                                                         |
| Google Sheets           | Google Sheets (v4.5)           | Appends daily briefing to To-Do sheet         | Master Orchestrator Agent           | Slack2                          |                                                                         |
| Slack2                  | Slack Tool (v2.3)              | Sends daily briefing to Max via Slack         | Google Sheets                      | None                           |                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**
   - Add a **Schedule Trigger** node.
     - Set to run on weekdays (Monday-Friday) at 8:00 AM.
   - Add a **Manual Trigger** node named "When clicking ‘Test workflow’" for manual execution.

2. **Email Retrieval Nodes:**
   - Add **Gmail Tool** nodes:
     - "Get Email": Configure for operation "get" with dynamic Message ID input from AI.
     - "Unread Emails - To Respond": Set filters for unread emails and specific labels requiring response.
     - "Unread Emails - FYI": Set filters for unread FYI emails by label.
     - "Check Sent": Search in "SENT" label for emails sent to an email address dynamically provided.
   - Configure Gmail OAuth2 credentials for all Gmail nodes.

3. **Email AI Processing:**
   - Add an **Anthropic Chat Model** node with model "claude-sonnet-4-20250514".
   - Add a **Simple Memory** node with context window length 50 tokens.
   - Add a **LangChain Agent** node named "Email Assistant".
     - Paste the system prompt defining the personal assistant role, email triage tasks, and instructions.
     - Connect Gmail nodes and Anthropic Chat Model as AI language model input.
     - Connect Simple Memory for session context.
   - Connect both triggers (Schedule and Manual) to "Email Assistant".

4. **Meeting Follow-up Nodes:**
   - Add a **Google Calendar Tool** node.
     - Configure with Max’s calendar email.
     - Use dynamic inputs for timeMin and timeMax (passed from AI or workflow input).
     - Set operation to "getAll".
     - Authenticate with Google Calendar OAuth2.
   - Add an **HTTP Request** node named "Fetch FireFlies".
     - POST to Fireflies GraphQL endpoint with query to fetch transcripts by participant email.
     - Add Bearer token authorization header.
   - Add a **Gmail Tool** node named "Check Sent1".
     - Query sent emails filtered dynamically by participant email.
   - Add an **Anthropic Chat Model** node with model "claude-opus-4-20250514".
   - Add a **LangChain Agent** node named "Follow Up Assistant".
     - Paste the detailed system prompt describing meeting follow-up objectives and logic.
   - Connect "Email Assistant" output to "Follow Up Assistant".
   - Connect Google Calendar, Fetch FireFlies, Check Sent1, and Anthropic Chat Model1 nodes as inputs to "Follow Up Assistant".

5. **Slack Monitoring Nodes:**
   - Add Slack nodes:
     - "Slack1": Slack API search for messages from Max in specified channel.
     - "Check Slack Mentions": Search Slack for mentions to Max.
     - "Check Thread Mentions": Search Slack threads in a channel for Max’s replies.
     - "Get User": Fetch user info by Slack User ID.
   - Configure Slack API credentials (OAuth2 or token).
   - Add an **Anthropic Chat Model** node (Claude Sonnet 4) for Slack analysis.
   - Add a **LangChain Agent** node named "Slack Assistant".
     - Paste the system prompt defining Slack assistant objectives and processing steps.
   - Connect "Follow Up Assistant" output to "Slack Assistant".
   - Connect all Slack nodes and Anthropic Chat Model3 as inputs to "Slack Assistant".

6. **Master Orchestration Nodes:**
   - Add a **Google Sheets Tool** node named "Previous To Do".
     - Configure to read the "To-Do's" Google Sheet (sheet gid=0).
     - Authenticate with Google Sheets OAuth2.
   - Add a **LangChain Agent** node named "Master Orchestrator Agent".
     - Paste the detailed system prompt synthesizing all agents’ reports with instructions for output formatting.
     - Connect outputs of "Email Assistant", "Follow Up Assistant", "Slack Assistant", and "Previous To Do" to this node.
   - Add an **Anthropic Chat Model** node to support Master Orchestrator (Claude Sonnet 4).
   - Add a **Google Sheets** node (append operation).
     - Configure to append a new row with current date and the Master Orchestrator output in "To-Do" column.
   - Add a **Slack** node named "Slack2".
     - Configure to send a message to Max's Slack user with the text from Master Orchestrator output.
   - Connect "Master Orchestrator Agent" output to Google Sheets append node and Slack message node.

7. **Connect Nodes in Order:**
   - Schedule Trigger and Manual Trigger → Email Assistant
   - Email Assistant → Follow Up Assistant
   - Follow Up Assistant → Slack Assistant
   - Slack Assistant → Master Orchestrator Agent
   - Previous To Do sheet → Master Orchestrator Agent
   - Master Orchestrator Agent → Google Sheets append and Slack message nodes

8. **Credentials Setup:**
   - Set up OAuth2 credentials for Gmail, Google Calendar, Google Sheets, Slack, and Anthropic API keys.
   - Configure Fireflies API Bearer token in HTTP Request node.

9. **Default Values & Constraints:**
   - Ensure all dynamic inputs use AI overrides or expressions where needed.
   - Validate label IDs and calendar email addresses.
   - Set context window sizes and iteration limits for AI agents as per original.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                                 |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Fireflies transcript fetching requires participant email from Google Calendar meetings to work correctly.                                                                                                                                                                                                                                                                   | Node "Fetch FireFlies" description                                                                                |
| Slack Assistant focuses on unreplied direct messages and mentions, prioritizing based on relation to Trigify sales/partnerships.                                                                                                                                                                                                                                            | Slack Assistant system prompt                                                                                   |
| Master Orchestrator synthesizes multiple AI reports and previous to-dos into a single daily briefing, ensuring no new analysis beyond inputs.                                                                                                                                                                                                                                | Master Orchestrator Agent system prompt                                                                          |
| Labels and calendar IDs must be kept up to date to ensure accurate email and calendar data retrieval.                                                                                                                                                                                                                                                                        | Gmail and Google Calendar nodes configuration notes                                                              |
| The workflow requires valid OAuth2 credentials for Gmail, Google Calendar, Google Sheets, and Slack, plus API keys for Anthropic and Fireflies.                                                                                                                                                                                                                            | Credential nodes                                                                                                 |
| Anthropic models used are "claude-sonnet-4-20250514" for most triage and synthesis tasks, "claude-opus-4-20250514" specifically for meeting follow-up analysis.                                                                                                                                                                                                              | Anthropic Chat Model nodes                                                                                        |
| Slack user ID for Max Mitcham is `U057SEMAP6J` and is used for searches and message sending.                                                                                                                                                                                                                                                                                   | Slack Assistant and Slack nodes                                                                                   |

---

**Disclaimer:** The text provided originates exclusively from an n8n automated workflow. It strictly adheres to content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.