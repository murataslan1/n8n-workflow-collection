AI Agent for project management and meetings with Airtable and Fireflies

https://n8nworkflows.xyz/workflows/ai-agent-for-project-management-and-meetings-with-airtable-and-fireflies-2683


# AI Agent for project management and meetings with Airtable and Fireflies

### 1. Workflow Overview

This workflow automates project management and meeting follow-up by integrating Fireflies meeting transcripts, AI-based task extraction, Airtable task creation, client notifications via email, and scheduling follow-up calls with Google Calendar. It targets project managers, team leaders, and business owners who want to convert meeting discussions into actionable tasks and streamline communication and scheduling.

The workflow is logically divided into these blocks:

- **1.1 Webhook Reception and Meeting Data Retrieval**  
  Captures meeting completion events from Fireflies via webhook and retrieves detailed meeting content including transcripts and participants through Fireflies’ GraphQL API.

- **1.2 AI Processing and Task Extraction**  
  Uses an AI agent (Langchain with OpenAI GPT-4o) to analyze the meeting transcript, identify actionable project tasks, generate task details, notify clients, and determine if follow-up calls are needed.

- **1.3 Task Creation in Airtable**  
  Creates structured task records in Airtable based on AI output, ensuring project-related tasks are properly logged.

- **1.4 Client Notification via Email**  
  Notifies meeting participants (except the user) about their respective tasks using Gmail.

- **1.5 Scheduling Follow-Up Calls in Google Calendar**  
  If the AI detects the need for a follow-up call, it creates a Google Calendar event with Google Meet conferencing.

---

### 2. Block-by-Block Analysis

#### 2.1 Webhook Reception and Meeting Data Retrieval

- **Overview:**  
  This block listens for meeting completion events from Fireflies and fetches detailed transcript and participant data to feed into the AI agent.

- **Nodes Involved:**  
  - Webhook  
  - Get Meeting Content

- **Node Details:**

  - **Webhook**  
    - Type: `webhook` (HTTP POST)  
    - Role: Entry point to capture meeting completion event from Fireflies.  
    - Config: Path set to unique ID; HTTP method POST.  
    - Inputs: Incoming POST request from Fireflies with meeting ID.  
    - Outputs: Passes meeting ID to next node.  
    - Edge Cases: Missing or malformed webhook payload, authentication errors if Fireflies blocks webhook, network timeouts.

  - **Get Meeting Content**  
    - Type: `httpRequest` (GraphQL POST request)  
    - Role: Retrieves meeting transcript, participants, speakers, and summary from Fireflies API.  
    - Config:  
      - URL: Fireflies GraphQL endpoint (`https://api.fireflies.ai/graphql`)  
      - Method: POST  
      - Body: GraphQL query with variable `transcriptId` from webhook JSON `meetingId`.  
      - Headers: Authorization with Bearer token (replace with valid Fireflies API key).  
    - Input: Meeting ID from webhook.  
    - Output: Detailed meeting data JSON for AI processing.  
    - Edge Cases: Invalid API key, API rate limits, network failures, missing transcript data.  
    - Sticky Note: Reminder to replace API key.

#### 2.2 AI Processing and Task Extraction

- **Overview:**  
  The AI agent analyzes the meeting transcript to extract project-related tasks, notify clients, and detect if a follow-up call should be scheduled.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  
  - Create Tasks (Tool Workflow)  
  - Notify Client About Tasks (Gmail Tool)  
  - Create Event (Google Calendar Tool)

- **Node Details:**

  - **AI Agent**  
    - Type: `@n8n/n8n-nodes-langchain.agent`  
    - Role: Central AI orchestrator interpreting transcript data and invoking tools.  
    - Config:  
      - Input text: Meeting title, participants, full transcript sentences, and bullet gist summary.  
      - Agent type: OpenAI Functions Agent using GPT-4o model.  
      - System message instructs agent to:  
        1. Analyze transcript if meeting title contains “project”.  
        2. Use “Create Tasks” tool for task creation.  
        3. Use “Notify Client About Tasks” tool for notifications.  
        4. Use “Create Event” tool if call scheduling is needed.  
      - Current date included dynamically.  
    - Inputs: Meeting content JSON from Get Meeting Content.  
    - Outputs: Calls tool workflows for task creation, notifications, and calendar events.  
    - Edge Cases: Model API failures, malformed input data, unexpected transcript content.  
    - Sticky Note: Describes AI agent scenario.

  - **OpenAI Chat Model**  
    - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
    - Role: Language model for AI Agent.  
    - Config: Uses GPT-4o model.  
    - Credentials: OpenAI API key required.  
    - Inputs: From AI Agent node.  
    - Outputs: AI Agent receives model responses.  
    - Edge Cases: API key limits, rate limiting, network issues.  
    - Sticky Note: Reminder to replace OpenAI connection.

  - **Create Tasks**  
    - Type: `@n8n/n8n-nodes-langchain.toolWorkflow`  
    - Role: Task creation tool called by AI agent to generate tasks.  
    - Config:  
      - Workflow ID points to a sub-workflow managing task creation in Airtable.  
      - Input schema requires an array of tasks with name, description, due date, priority, and optional project name.  
      - Instruction: Create tasks only for the user, exclude others.  
    - Inputs: From AI Agent tool invocation.  
    - Outputs: Triggers sub-workflow for task creation.  
    - Edge Cases: Schema validation errors, missing required fields.  
    - Sticky Note: Scenario 2 context.

  - **Notify Client About Tasks**  
    - Type: `gmailTool`  
    - Role: Sends email notifications to meeting participants about their tasks.  
    - Config:  
      - Email recipient dynamically set from AI output (`participant_email`).  
      - Message body contains meeting summary and participant-specific action items.  
      - Subject fixed as “Meeting Summary”.  
      - Instructions: Notify all participants except the user.  
    - Credentials: Gmail OAuth2 required.  
    - Inputs: From AI Agent tool invocation.  
    - Outputs: Sends notification emails.  
    - Edge Cases: Email sending failures, invalid email addresses, OAuth token expiration.  
    - Sticky Note: Reminder to replace Gmail connection.

  - **Create Event**  
    - Type: `googleCalendarTool`  
    - Role: Creates Google Calendar event with Google Meet link if AI detects follow-up call necessity.  
    - Config:  
      - Start and end times dynamically from AI output.  
      - Attendees set from client email from AI output.  
      - Event summary from AI.  
      - Conference data to enable Google Meet.  
    - Credentials: Google Calendar OAuth2 required.  
    - Inputs: From AI Agent tool invocation.  
    - Outputs: Creates calendar event.  
    - Edge Cases: Calendar API errors, invalid date formats, OAuth token issues.  
    - Sticky Note: Reminder to replace Google connection.

#### 2.3 Task Creation in Airtable

- **Overview:**  
  Converts AI-generated tasks into Airtable records in a designated base and table.

- **Nodes Involved:**  
  - Execute Workflow Trigger  
  - Split Out  
  - Create Task

- **Node Details:**

  - **Execute Workflow Trigger**  
    - Type: `executeWorkflowTrigger`  
    - Role: Invokes sub-workflow for task creation when triggered by AI agent tool.  
    - Inputs: Receives array of task objects.  
    - Outputs: Forwards to Split Out node.  
    - Edge Cases: Trigger invocation errors.

  - **Split Out**  
    - Type: `splitOut`  
    - Role: Splits array of tasks into individual items for processing.  
    - Config: Splits on `query.items` field (task array).  
    - Inputs: Task array from previous node.  
    - Outputs: Individual task objects to Create Task node.  
    - Edge Cases: Empty or malformed task arrays.

  - **Create Task**  
    - Type: `airtable`  
    - Role: Creates task records in Airtable “Tasks” table.  
    - Config:  
      - Airtable base and table IDs set for user’s environment.  
      - Columns mapped: Name, Project, Due Date, Priority, Description.  
      - Typecasting enabled for data consistency.  
    - Credentials: Airtable Personal Access Token required.  
    - Inputs: Individual task data from Split Out node.  
    - Outputs: Airtable record creation confirmation.  
    - Edge Cases: Invalid base/table IDs, API rate limits, data validation errors.  
    - Sticky Note: Reminder to replace Airtable connection.

#### 2.4 Client Notification via Email

- **Overview:**  
  Sends personalized meeting summary and task notifications to each participant except the user.

- **Nodes Involved:**  
  - Notify Client About Tasks (already described in AI Processing).  
  - No additional nodes beyond AI agent tool call.

- **Node Details:**  
  - See Node “Notify Client About Tasks” in 2.2 for details.

#### 2.5 Scheduling Follow-Up Calls in Google Calendar

- **Overview:**  
  If a follow-up call is identified by AI, this block creates a Google Calendar event with a Google Meet link for all relevant attendees.

- **Nodes Involved:**  
  - Create Event (already described in AI Processing).  
  - No additional nodes beyond AI agent tool call.

- **Node Details:**  
  - See Node “Create Event” in 2.2 for details.

---

### 3. Summary Table

| Node Name               | Node Type                                       | Functional Role                                   | Input Node(s)              | Output Node(s)            | Sticky Note                                                     |
|-------------------------|------------------------------------------------|-------------------------------------------------|----------------------------|---------------------------|----------------------------------------------------------------|
| Webhook                 | n8n-nodes-base.webhook                         | Entry point; receives meeting completion event  | -                          | Get Meeting Content        |                                                                |
| Get Meeting Content      | n8n-nodes-base.httpRequest                      | Fetches meeting transcript and participants     | Webhook                    | AI Agent                  | Replace API key for Fireflies                                  |
| AI Agent                | @n8n/n8n-nodes-langchain.agent                  | AI orchestrator; analyzes transcript, triggers tools | Get Meeting Content         | Create Tasks, Notify Client About Tasks, Create Event | Scenario 1 - AI agent; Replace OpenAI connection               |
| OpenAI Chat Model        | @n8n/n8n-nodes-langchain.lmChatOpenAi           | Provides AI language model for AI Agent          | AI Agent (lmChat)          | AI Agent (ai_languageModel) | Replace OpenAI connection                                      |
| Create Tasks            | @n8n/n8n-nodes-langchain.toolWorkflow           | Sub-workflow tool to create tasks                | AI Agent (ai_tool)         | AI Agent (ai_tool)         | Scenario 2 - Create Tasks tool                                 |
| Notify Client About Tasks| n8n-nodes-base.gmailTool                         | Sends email notifications to meeting participants | AI Agent (ai_tool)         | AI Agent (ai_tool)         | Replace connections for Airtable and Google                   |
| Create Event            | n8n-nodes-base.googleCalendarTool                | Creates Google Calendar event with Meet link    | AI Agent (ai_tool)         | AI Agent (ai_tool)         | Replace connections for Airtable and Google                   |
| Execute Workflow Trigger | n8n-nodes-base.executeWorkflowTrigger            | Triggers sub-workflow for task creation          | Create Tasks (sub-workflow) | Split Out                  | Scenario 2 - Create Tasks tool                                 |
| Split Out               | n8n-nodes-base.splitOut                           | Splits array of tasks into individual items      | Execute Workflow Trigger   | Create Task                | Scenario 2 - Create Tasks tool                                 |
| Create Task             | n8n-nodes-base.airtable                           | Creates individual task record in Airtable       | Split Out                  | -                         | Replace connections for Airtable and Google                   |
| Sticky Note             | n8n-nodes-base.stickyNote                        | Provides configuration and setup reminders       | -                          | -                         | Multiple sticky notes provide setup instructions and links   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: `webhook`  
   - HTTP Method: POST  
   - Path: Unique identifier (e.g., `df852a9f-5ea3-43f2-bd49-d045aba5e9c9`)  
   - Purpose: Receive meeting completion event from Fireflies.

2. **Add HTTP Request Node (Get Meeting Content)**  
   - Type: `httpRequest`  
   - Method: POST  
   - URL: `https://api.fireflies.ai/graphql`  
   - Headers: Add `Authorization` with `Bearer [YOUR FIREPLIES API KEY]`  
   - Body: JSON with GraphQL query to fetch transcript by ID. Use expression to pass meeting ID from webhook:  
     ```json
     {
       "query": "query Transcript($transcriptId: String!) { transcript(id: $transcriptId) { title participants speakers { id name } sentences { speaker_name text } summary { bullet_gist } } }",
       "variables": { "transcriptId": "={{ $json.meetingId }}" }
     }
     ```
   - Output: Meeting transcript JSON.

3. **Add AI Agent Node**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Parameters:  
     - Text input includes meeting title, participants, full transcript sentences, and bullet gist from previous node output.  
     - Agent: `openAiFunctionsAgent`  
     - System Message: Instruct agent to analyze transcript if title contains “project”, create tasks via “Create Tasks” tool, notify clients via “Notify Client About Tasks” tool, and schedule calls via “Create Event” tool if needed.  
     - Include current date dynamically.  
   - Connect input from Get Meeting Content.

4. **Add OpenAI Chat Model Node**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Model: `gpt-4o`  
   - Credentials: Provide valid OpenAI API key.  
   - Connect this node to AI Agent’s language model input.

5. **Add Create Tasks Tool Workflow Node**  
   - Type: `@n8n/n8n-nodes-langchain.toolWorkflow`  
   - Workflow ID: Reference sub-workflow that creates tasks in Airtable.  
   - Input Schema: Array of tasks with fields name, description, due_date, priority, optional project_name.  
   - Connect as AI Agent’s tool for task creation.

6. **Add Notify Client About Tasks Node**  
   - Type: `gmailTool`  
   - Email recipient: Dynamic from AI output `participant_email`.  
   - Message: Includes meeting summary and participant-specific action items.  
   - Subject: “Meeting Summary”  
   - Credentials: Gmail OAuth2 account.  
   - Connect as AI Agent’s tool for notifications.

7. **Add Create Event Node**  
   - Type: `googleCalendarTool`  
   - Start and End times: Dynamic from AI output.  
   - Calendar: Select appropriate Google Calendar email.  
   - Attendees: From AI output emails.  
   - Summary: Meeting name from AI output.  
   - Conference: Enable Google Meet.  
   - Credentials: Google Calendar OAuth2 account.  
   - Connect as AI Agent’s tool for event creation.

8. **Build Task Creation Sub-Workflow:**  
   - Add Execute Workflow Trigger node as entry point.  
   - Connect to Split Out node configured to split array on `query.items`.  
   - Add Airtable node configured to create records in user’s base and “Tasks” table.  
     - Map fields: Name, Project (array), Due Date, Priority, Description.  
     - Enable typecasting.  
     - Use Airtable Personal Access Token credentials.  
   - Connect Split Out to Airtable node.

9. **Connect AI Agent Tool Calls:**  
   - From AI Agent, connect `Create Tasks` tool to sub-workflow (Execute Workflow Trigger).  
   - Connect `Notify Client About Tasks` and `Create Event` tools back to AI Agent node as per agent’s tool interface.

10. **Replace all placeholders:**  
    - Fireflies API key in HTTP Request node.  
    - OpenAI API key in OpenAI Chat Model node.  
    - Gmail OAuth2 credentials in Notify Client node.  
    - Airtable Personal Access Token and base/table IDs in Airtable node.  
    - Google Calendar OAuth2 credentials in Create Event node.  

11. **Test Workflow:**  
    - Trigger webhook with sample Fireflies meeting completion data including meetingId.  
    - Verify transcript retrieval, AI processing, task creation in Airtable, email notifications, and event creation if applicable.

---

### 5. General Notes & Resources

| Note Content                                                                                                                       | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Comprehensive video guide detailing setup and usage of this workflow.                                                             | [YouTube Setup Video](https://www.youtube.com/watch?v=0TyX7G00x3A)                             |
| Workflow created by Philipp Bekher from 5minAI community.                                                                          | [Philipp Bekher LinkedIn](https://www.linkedin.com/in/philipp-bekher-5437171a4/), [5minAI](https://www.skool.com/5minai-2861) |
| Preparation steps include creating accounts for n8n, Airtable, and Fireflies, and configuring OAuth2 credentials for Gmail and Google Calendar. | Sticky Note with setup instructions in workflow.                                              |
| Ensure all API keys and OAuth credentials are current and have necessary scopes for the operations performed.                      | Security best practices for API keys and OAuth tokens.                                         |
| AI agent logic depends on meeting title containing the word “project” to trigger task creation flow.                               | Adjust system message if different criteria are needed.                                        |

---

This document fully describes the workflow structure, logic, node configurations, and setup instructions, enabling advanced users and AI agents to understand, reproduce, and maintain the workflow efficiently.