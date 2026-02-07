Automate Telegram Support Handover from AI to Humans with GPT4 and Email Alerts

https://n8nworkflows.xyz/workflows/automate-telegram-support-handover-from-ai-to-humans-with-gpt4-and-email-alerts-9987


# Automate Telegram Support Handover from AI to Humans with GPT4 and Email Alerts

### 1. Workflow Overview

This workflow automates the handover of Telegram user support from an AI assistant (powered by GPT-4 via OpenRouter or Azure OpenAI) to human operators, with email alerts notifying operators and topic-based group chat management. It is designed for Telegram support groups that use forum topics, enabling seamless escalation from AI to humans while tracking conversation status in data tables.

Logical blocks:

- **1.1 Input Reception & Preprocessing:** Captures Telegram messages via webhook, filters message types (topic messages, text existence), and handles exit commands.
- **1.2 Configuration Setup:** Sets runtime variables such as user ID, operator email, SMTP email, Telegram group ID.
- **1.3 Conversation State Management:** Uses n8n data tables to track conversation types (ai/human), status (open/closed), and topic IDs. Manages creation and update of temporary message records.
- **1.4 AI Interaction:** Uses Langchain nodes with OpenRouter or Azure OpenAI GPT-4 models to process user messages, maintain conversational memory, and generate replies.
- **1.5 Human Handover Workflow:** Detects requests for human support, confirms with user, alerts operator via email, and upon operator approval, creates Telegram forum topics and updates conversation status.
- **1.6 Operator Notification and User Messaging:** Notifies user about operator attendance or unavailability, forwards messages between user and group topics accordingly.
- **1.7 Telegram Forum Topic Management:** Creates and closes Telegram forum topics, updates topic status in data tables.
- **1.8 Utility & Control Nodes:** Includes conditional stops, sticky notes with documentation, and helper nodes for retrieving chat admins or personal info.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Preprocessing

- **Overview:** Receives Telegram messages, distinguishes special commands ('exit'), topic messages, and ensures text messages exist before further processing.
- **Nodes Involved:** Telegram Trigger, Topic Message, Exit, Text Message, Stop Workflow
- **Node Details:**

  - **Telegram Trigger**
    - Type: Trigger node for Telegram updates (messages)
    - Configuration: Listens to "message" updates for configured Telegram bot credentials
    - Inputs: None (trigger)
    - Outputs: Raw Telegram message JSON
    - Edge cases: Webhook failures, invalid credentials, Telegram API downtime
  - **Topic Message**
    - Type: If node (conditional)
    - Checks if incoming message is a topic message and contains text
    - Routes topic messages to Exit or Text Message nodes
    - Edge cases: Missing fields in Telegram message, non-text topic messages
  - **Exit**
    - Type: If node
    - Checks if message text equals "exit"
    - Routes to Close Topic or Forward Message accordingly
    - Edge cases: Case sensitivity, unexpected message formats
  - **Text Message**
    - Type: If node
    - Checks if message text exists
    - Routes to Configuration or stops workflow if no text
  - **Stop Workflow**
    - Type: No-operation node to halt processing for irrelevant input

#### 1.2 Configuration Setup

- **Overview:** Sets key runtime parameters like user ID, SMTP sender email, operator email, personal Telegram ID, and group ID for use in downstream nodes.
- **Nodes Involved:** Configuration
- **Node Details:**

  - **Configuration**
    - Type: Set node
    - Assigns variables using expressions extracting user ID from Telegram message and static configuration strings for emails and group ID
    - Outputs these parameters as JSON for downstream use
    - Edge cases: Missing or incorrect Telegram message fields, misconfigured static values

#### 1.3 Conversation State Management

- **Overview:** Manages conversation state in n8n data tables tracking user sessions, conversation type (AI or human), topic IDs, and status (open/closed). Decides routing based on conversation status.
- **Nodes Involved:** Get Temporary Message, Message Router, Last Message Exists, Row is Empty, Create Temporary Message, Update Last Message, Update Temporary Message, Update Closed Topic
- **Node Details:**

  - **Get Temporary Message**
    - Type: Data Table Get
    - Retrieves open conversation rows for the current user
    - Edge cases: No rows found, multiple rows found
  - **Message Router**
    - Type: Switch node
    - Routes based on conversation type: "human", "ai", or empty (no conversation)
  - **Last Message Exists**
    - Type: Data Table Row Exists
    - Checks if an open conversation exists for the user
  - **Row is Empty**
    - Type: If node
    - Checks if data table response is empty, branches accordingly
  - **Create Temporary Message**
    - Type: Data Table Create
    - Inserts new row for user with type 'ai' and status 'open'
  - **Update Last Message**
    - Type: Data Table Update
    - Updates existing conversation row (e.g., status or type changes)
  - **Update Temporary Message**
    - Type: Data Table Update
    - Updates conversation row to 'human' type when operator attends, sets topic ID
  - **Update Closed Topic**
    - Type: Data Table Update
    - Marks a conversation row as 'closed' when topic is closed

#### 1.4 AI Interaction

- **Overview:** Processes user messages with GPT-4 based AI agent, maintains conversational memory, and sends AI-generated replies back to the user.
- **Nodes Involved:** AI Agent, OpenRouter Chat Model, Azure OpenAI Chat Model, Simple Memory, Reply To User
- **Node Details:**

  - **AI Agent**
    - Type: Langchain Agent
    - Receives user text, uses system prompt emphasizing calling "Reply To User" tool once or responding "Human" for handover request
    - Uses fallback in case of errors
  - **OpenRouter Chat Model**
    - Type: Langchain LM Chat OpenRouter
    - Model: "x-ai/grok-4-fast" (GPT-4 variant)
    - Provides AI language model for AI Agent
  - **Azure OpenAI Chat Model**
    - Type: Langchain LM Chat AzureOpenAI
    - Model: "gpt-4o-mini"
    - Alternative AI model option
  - **Simple Memory**
    - Type: Langchain Memory Buffer Window
    - Maintains conversation history buffer keyed by user ID
  - **Reply To User**
    - Type: Telegram Tool node
    - Sends AI-generated reply message to user Telegram chat

#### 1.5 Human Handover Workflow

- **Overview:** Detects when AI replies "Human" (indicating user wants human support), confirms user approval for operator handoff, sends email alert to operator, and upon operator confirmation, creates Telegram forum topic and updates chat status.
- **Nodes Involved:** Human Requested, Confirm Operator, User Approved, Alert Operator, Operator Confirmed, Operator Attendance, Operator Declined Attendance, Create Topic
- **Node Details:**

  - **Human Requested**
    - Type: If node
    - Checks if AI Agent output equals "Human" string (exact match, case-sensitive)
  - **Confirm Operator**
    - Type: Telegram node with "sendAndWait" and double approval options
    - Asks user to confirm switching to operator
  - **User Approved**
    - Type: If node
    - Checks if user response is approved (boolean true)
  - **Alert Operator**
    - Type: Email Send node with "sendAndWait" and approval options
    - Emails operator about user request, including username and 15-minute expiration notice
  - **Operator Confirmed**
    - Type: If node
    - Checks operator approval response (boolean true)
  - **Operator Attendance**
    - Type: Telegram node
    - Sends message to user: "Operator will be with you shortly."
  - **Operator Declined Attendance**
    - Type: Telegram node
    - Sends message to user: "Unfortunately, the operator is not free at the moment."
  - **Create Topic**
    - Type: HTTP Request (Telegram Bot API)
    - Creates a forum topic in configured group chat, named after the user ID

#### 1.6 Operator Notification and User Messaging

- **Overview:** Forwards user messages to operator group topics and vice versa; handles message routing depending on conversation type and topic.
- **Nodes Involved:** Forward Message To Group, Forward Message
- **Node Details:**

  - **Forward Message To Group**
    - Type: HTTP Request (Telegram Bot API)
    - Forwards user message to group chat topic using message ID and thread ID from temporary message data
  - **Forward Message**
    - Type: HTTP Request (Telegram Bot API)
    - Forwards message inside a topic message context (used when user replies inside forum topic)
  - Edge cases: Telegram API errors, invalid message or chat IDs

#### 1.7 Telegram Forum Topic Management

- **Overview:** Manages creation and closure of Telegram forum topics as part of the operator handover process and user commands.
- **Nodes Involved:** Close Topic, Update Closed Topic
- **Node Details:**

  - **Close Topic**
    - Type: HTTP Request (Telegram Bot API)
    - Closes a forum topic by chat ID and message_thread_id
  - **Update Closed Topic**
    - Type: Data Table Update
    - Marks topic status as "closed" in data table for the associated user/topic

#### 1.8 Utility & Control Nodes

- **Overview:** Support nodes for administrative tasks, personal info extraction, and workflow control.
- **Nodes Involved:** Personal, Personal Trigger (disabled), Chat Admins, Stop Workflow, Sticky Notes
- **Node Details:**

  - **Personal**
    - Type: Set node
    - Extracts personal user ID and group ID from Telegram message JSON for debugging or manual use
  - **Personal Trigger**
    - Type: Telegram Trigger (disabled)
    - Alternative trigger for capturing personal/group IDs during setup
  - **Chat Admins**
    - Type: HTTP Request
    - Fetches chat administrators list for verifying bot admin status (manual/diagnostic use)
  - **Stop Workflow**
    - NoOp node to halt execution for irrelevant cases
  - **Sticky Notes**
    - Provide documentation, setup instructions, credential info, and video guides embedded inside the workflow UI

---

### 3. Summary Table

| Node Name                   | Node Type                              | Functional Role                         | Input Node(s)               | Output Node(s)                  | Sticky Note                                                                                                   |
|-----------------------------|--------------------------------------|---------------------------------------|-----------------------------|--------------------------------|--------------------------------------------------------------------------------------------------------------|
| Telegram Trigger            | telegramTrigger                      | Entry point: receives Telegram messages | None                        | Topic Message                  |                                                                                                              |
| Topic Message              | if                                  | Checks if message is topic message with text | Telegram Trigger            | Exit, Text Message             |                                                                                                              |
| Exit                       | if                                  | Checks if message text equals "exit"   | Topic Message                | Close Topic, Forward Message   |                                                                                                              |
| Close Topic                | httpRequest                         | Closes Telegram forum topic             | Exit                        | Update Closed Topic            |                                                                                                              |
| Update Closed Topic        | dataTable                          | Marks topic as closed in data table     | Close Topic                 | None                          |                                                                                                              |
| Forward Message            | httpRequest                         | Forwards message inside topic context   | Exit                        | None                          |                                                                                                              |
| Text Message              | if                                  | Checks if message text exists            | Topic Message                | Configuration, Stop Workflow   |                                                                                                              |
| Stop Workflow             | noOp                                | Stops workflow for irrelevant inputs    | Text Message                | None                          |                                                                                                              |
| Configuration             | set                                 | Sets user, SMTP, operator email, group ID | Text Message                | Get Temporary Message          | Sticky Note19 explains Configuration node and SMTP mail setup                                                |
| Get Temporary Message      | dataTable                          | Retrieves open conversation for user    | Configuration               | Message Router                | Sticky Note20 explains Data Tables usage                                                                     |
| Message Router            | switch                             | Routes based on conversation type       | Get Temporary Message        | Forward Message To Group, AI Agent (x2) |                                                                                                              |
| Forward Message To Group  | httpRequest                       | Forwards user messages to group topic   | Message Router (human)       | None                          |                                                                                                              |
| AI Agent                  | langchain agent                   | Processes message with GPT-4 AI agent   | Message Router (ai), Reply To User (ai_tool), Simple Memory (ai_memory) | Human Requested               | Sticky Note1 explains AI Agent and memory usage                                                             |
| Human Requested           | if                                  | Checks if AI output requests human       | AI Agent                    | Confirm Operator, Last Message Exists |                                                                                                              |
| Confirm Operator          | telegram                           | Asks user to confirm handover to operator | Human Requested             | User Approved                |                                                                                                              |
| User Approved             | if                                  | Checks if user approved handover         | Confirm Operator            | Alert Operator, AI Agent       |                                                                                                              |
| Alert Operator            | emailSend                         | Sends email alert to operator            | User Approved               | Operator Confirmed             |                                                                                                              |
| Operator Confirmed        | if                                  | Checks operator email approval            | Alert Operator              | Operator Attendance, Operator Declined Attendance |                                                                                                              |
| Operator Attendance       | telegram                           | Notifies user operator will attend       | Operator Confirmed          | Create Topic                  |                                                                                                              |
| Operator Declined Attendance | telegram                        | Notifies user operator unavailable        | Operator Confirmed          | None                         |                                                                                                              |
| Create Topic              | httpRequest                       | Creates Telegram forum topic              | Operator Attendance         | Update Temporary Message       |                                                                                                              |
| Update Temporary Message  | dataTable                          | Updates conversation row to 'human' type | Create Topic                | None                         |                                                                                                              |
| Last Message Exists       | dataTable                          | Checks if open conversation exists       | Human Requested             | Row is Empty                  |                                                                                                              |
| Row is Empty              | if                                  | Checks if data table result is empty     | Last Message Exists         | Create Temporary Message, Update Last Message |                                                                                                              |
| Create Temporary Message  | dataTable                          | Creates new conversation row with type 'ai' | Row is Empty              | None                         |                                                                                                              |
| Update Last Message       | dataTable                          | Updates existing conversation row        | Row is Empty                | None                         |                                                                                                              |
| Simple Memory             | langchain memoryBufferWindow      | Maintains conversation history buffer    | None                       | AI Agent                     |                                                                                                              |
| Reply To User             | telegramTool                      | Sends AI-generated reply to user         | AI Agent                    | AI Agent (ai_tool)             |                                                                                                              |
| Personal                  | set                                 | Extracts personal user and group IDs     | Personal Trigger (disabled)  | None                         | Sticky Note18 covers Telegram setup and personal/group ID retrieval                                         |
| Personal Trigger          | telegramTrigger                   | Disabled alternative Telegram trigger    | None                       | Personal                     |                                                                                                              |
| Chat Admins               | httpRequest                       | Retrieves chat admins for bot verification | None                       | None                         | Sticky Note18 includes instructions for chat admin verification                                            |
| Sticky Note1              | stickyNote                       | Documentation and welcome note            | None                       | None                         |                                                                                                              |
| Sticky Note17             | stickyNote                       | Credentials reminder                       | None                       | None                         |                                                                                                              |
| Sticky Note18             | stickyNote                       | Telegram bot and group setup instructions | None                       | None                         |                                                                                                              |
| Sticky Note19             | stickyNote                       | Configuration and SMTP mail setup         | None                       | None                         |                                                                                                              |
| Sticky Note20             | stickyNote                       | Data Tables usage and notes                | None                       | None                         |                                                                                                              |
| Sticky Note21             | stickyNote                       | Overview video link                        | None                       | None                         |                                                                                                              |
| Sticky Note22             | stickyNote                       | Detailed setup video link                  | None                       | None                         |                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Bot and Credentials:**
   - Use BotFather to create a Telegram bot; obtain API token.
   - In n8n, create Telegram API credentials with this token.

2. **Create Telegram Trigger Node:**
   - Type: telegramTrigger
   - Configure to listen for "message" updates.
   - Assign Telegram API credentials.

3. **Add Topic Message Node (If):**
   - Check if `message.is_topic_message` exists and is true.
   - Check that `message.text` exists.
   - Connect from Telegram Trigger.
   - Outputs to Exit and Text Message nodes.

4. **Add Exit Node (If):**
   - Condition: `message.text` equals "exit".
   - Outputs to Close Topic and Forward Message nodes.

5. **Create Close Topic Node (HTTP Request):**
   - Method: POST
   - URL: `https://api.telegram.org/bot<BOT_TOKEN>/closeForumTopic`
   - Body parameters:
     - `chat_id` = `message.reply_to_message.chat.id`
     - `message_thread_id` = `message.reply_to_message.message_thread_id`
   - Connect from Exit node.

6. **Add Update Closed Topic Node (Data Table Update):**
   - Data Table: Temporary Last Message
   - Filter by `topic` = `message.reply_to_message.message_thread_id`
   - Update `status` to "closed"
   - Connect from Close Topic.

7. **Create Forward Message Node (HTTP Request):**
   - Method: POST
   - URL: `https://api.telegram.org/bot<BOT_TOKEN>/forwardMessage`
   - Body parameters:
     - `chat_id` = `message.reply_to_message.forum_topic_created.name`
     - `from_chat_id` = `message.reply_to_message.chat.id`
     - `message_id` = `message.message_id`
   - Connect from Exit node (fallback).

8. **Add Text Message Node (If):**
   - Condition: `message.text` exists
   - Outputs to Configuration or Stop Workflow.

9. **Add Stop Workflow Node (NoOp):**
   - Connect from Text Message (if no text).

10. **Create Configuration Node (Set):**
    - Assign variables:
      - `user` = `message.from.id`
      - `smtp` = your SMTP sender email (string)
      - `operator` = operator email address (string)
      - `personal` = your personal Telegram ID (optional)
      - `group` = Telegram group ID for support topics
    - Connect from Text Message (if text exists).

11. **Add Get Temporary Message Node (Data Table Get):**
    - Data Table: Temporary Last Message
    - Filter by `user` and `status` = "open"
    - Connect from Configuration node.

12. **Add Message Router Node (Switch):**
    - Conditions based on conversation `type`: "human", "ai", or empty.
    - Connect from Get Temporary Message.

13. **Create Forward Message To Group Node (HTTP Request):**
    - Forwards user messages to group topic.
    - Body parameters:
      - `chat_id` = group ID
      - `from_chat_id` = user ID
      - `message_id` = Telegram Trigger message ID
      - `message_thread_id` = temporary message topic ID
    - Connect from Message Router output "human".

14. **Set up AI Agent:**
    - Use Langchain Agent node.
    - Input text from Telegram message text.
    - System prompt instructs to call "Reply To User" tool or respond "Human" when human handover requested.
    - Enable fallback.

15. **Configure Language Models:**
    - OpenRouter Chat Model node or Azure OpenAI Chat Model node.
    - Connect to AI Agent node as language model input.

16. **Add Simple Memory Node (Langchain Memory Buffer Window):**
    - Session key by user ID.
    - Connect to AI Agent node as memory.

17. **Add Reply To User Node (Telegram Tool):**
    - Sends AI reply messages to user.
    - Connect from AI Agent node as AI tool output.

18. **Add Human Requested Node (If):**
    - Checks if AI Agent output equals "Human"
    - Connect from AI Agent node main output.

19. **Add Confirm Operator Node (Telegram):**
    - Sends "Confirm switching to operator?" message with double approval option.
    - Connect from Human Requested.

20. **Add User Approved Node (If):**
    - Checks if user approved (boolean true).
    - Connect from Confirm Operator.

21. **Add Alert Operator Node (Email Send):**
    - Sends email alert to operator with user info, 15-minute expiry.
    - Uses SMTP credentials.
    - Connect from User Approved.

22. **Add Operator Confirmed Node (If):**
    - Checks operator email approval (boolean true).
    - Connect from Alert Operator.

23. **Add Operator Attendance Node (Telegram):**
    - Sends "Operator will be with you shortly." message to user.
    - Connect from Operator Confirmed (true).

24. **Add Operator Declined Attendance Node (Telegram):**
    - Sends "Unfortunately, the operator is not free at the moment." message.
    - Connect from Operator Confirmed (false).

25. **Add Create Topic Node (HTTP Request):**
    - Creates Telegram forum topic using group ID and user ID as topic name.
    - Connect from Operator Attendance.

26. **Add Update Temporary Message Node (Data Table Update):**
    - Updates conversation row to type "human", sets topic ID from created topic.
    - Connect from Create Topic.

27. **Add Last Message Exists Node (Data Table Row Exists):**
    - Checks if open conversation exists.
    - Connect from Human Requested node (false branch).

28. **Add Row is Empty Node (If):**
    - Checks if data table result is empty.
    - Connect from Last Message Exists.

29. **Add Create Temporary Message Node (Data Table Create):**
    - Creates new conversation row with type "ai" and status "open".
    - Connect from Row is Empty (true).

30. **Add Update Last Message Node (Data Table Update):**
    - Updates existing conversation row.
    - Connect from Row is Empty (false).

31. **Add Personal Trigger Node (Telegram Trigger - Disabled):**
    - For setup only: capture personal and group IDs.
    - Connect to Personal Node (Set).

32. **Add Personal Node (Set):**
    - Extracts personal user ID and group ID for configuration/testing.

33. **Add Chat Admins Node (HTTP Request):**
    - Verifies bot admin permissions in group.

34. **Add Sticky Notes:**
    - Add documentation, setup instructions, and video links as sticky notes in the workflow canvas for user reference.

---

### 5. General Notes & Resources

| Note Content                                                                                                                               | Context or Link                                                                                           |
|--------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Telegram bot creation, group setup with Topics enabled, and adding bot as admin with permissions are prerequisites.                        | [Telegram Node Docs](https://docs.n8n.io/integrations/builtin/credentials/telegram/)                       |
| SMTP mail setup instructions for Gmail with 2FA and app password generation.                                                                | [SMTP Mail Docs](https://docs.n8n.io/integrations/builtin/credentials/sendemail/)                          |
| Data tables used to track conversation status and type; columns must be exactly named: user, type, topic, status.                          | n8n Data Tables section in n8n dashboard                                                                  |
| Workflow is text-only; file processing disabled to save tokens but can be modified if needed.                                                |                                                                                                          |
| AI Agent uses critical system prompt instructions to call "Reply To User" tool once or respond "Human" for handover requests.               |                                                                                                          |
| Video guides: 1-minute overview and detailed 10-minute setup available.                                                                     | [Overview Video](https://youtu.be/U1HBdilbvzc), [Setup Video](https://youtu.be/Rjj_g9HEuqw)                 |
| Consider replacing memory buffer with a database for production scalability and persistence.                                                |                                                                                                          |
| Telegram Extended community node recommended for easier forum topic operations.                                                              | https://www.npmjs.com/package/n8n-nodes-telegram-extended                                                  |
| To get group ID and personal ID, use the disabled Personal Trigger node and send messages in Telegram group.                                |                                                                                                          |
| Operator email approval messages expire after 15 minutes to avoid stale handovers.                                                          |                                                                                                          |
| Use consistent and secure management of BOT_TOKEN and credentials across HTTP Request nodes and credential settings.                      |                                                                                                          |

---

**Disclaimer:** The provided content originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.