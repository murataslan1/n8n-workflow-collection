Add Project Tasks to Google Sheets with GPT-4.1-mini Chat Assistant

https://n8nworkflows.xyz/workflows/add-project-tasks-to-google-sheets-with-gpt-4-1-mini-chat-assistant-10230


# Add Project Tasks to Google Sheets with GPT-4.1-mini Chat Assistant

### 1. Workflow Overview

This workflow enables users to interact via chat to create new project tasks that are automatically appended or updated in a Google Sheets spreadsheet. It is designed for teams to easily manage project tasks through natural language conversations, leveraging GPT-4.1-mini AI models for understanding and structuring task information.

The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Captures user chat input via a webhook trigger node.
- **1.2 AI Task Management Agent:** Uses a LangChain Agent with GPT-4.1-mini to interactively gather necessary information about a new task or detect update requests.
- **1.3 Memory and Output Parsing:** Maintains chat context and parses AI outputs into structured JSON formats.
- **1.4 Decision Logic:** Checks if all required information to create a task has been gathered.
- **1.5 Task Writing to Google Sheets:** Appends or updates the task record in a specified Google Sheet.
- **1.6 User Response:** Sends confirmation messages back to the user.

Supporting this are various sticky notes providing setup instructions and project context.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Receives chat messages from users via a LangChain Chat Trigger node. Acts as the entry point to the workflow.
- **Nodes Involved:** `Chat Trigger`
- **Node Details:**

| Node Name   | Details                                                                                                                |
|-------------|------------------------------------------------------------------------------------------------------------------------|
| Chat Trigger| - Type: LangChain Chat Trigger (Webhook-based)<br>- Configured with responseMode "responseNodes" to control output<br>- Listens for incoming chat messages<br>- Output connects to the AI Task Management Agent node<br>- Potential failures: webhook misconfiguration, network errors, malformed inputs|

#### 2.2 AI Task Management Agent

- **Overview:** Interactively chats with the user to collect task information or detect update requests, following strict rules for output format and required fields.
- **Nodes Involved:** `Project Manager Agent`, `OpenAI Chat Model`, `Chat Memory`, `Structured Output Parser`
- **Node Details:**

| Node Name            | Details                                                                                                                             |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Project Manager Agent | - Type: LangChain Agent node<br>- System message defines behavior: only create new tasks, no updates yet<br>- Gathers fields: Task, Description, Status<br>- Outputs JSON with fields: "response", "info gathered" (with type, Task, Description, Status), "all Info" (Yes/No)<br>- Keeps chatting until all Info = Yes<br>- Input from Chat Trigger and AI memory<br>- Output parsed by Structured Output Parser<br>- Edge cases: incomplete user input, ambiguous commands, incorrect field responses, interruptions in chat flow, API rate limits|
| OpenAI Chat Model     | - Type: LangChain OpenAI Chat Model<br>- Model: GPT-4.1-mini<br>- Used as language model for Agent<br>- Credentials: OpenAI API key<br>- Can fail due to API limits, invalid keys, or connection issues|
| Chat Memory          | - Type: LangChain Memory Buffer Window<br>- Maintains conversation context to enable natural, continuous dialogues<br>- Connected as AI memory for Agent node|
| Structured Output Parser | - Type: LangChain Output Parser Structured<br>- Parses agent output JSON according to defined schema<br>- Configured with autoFix to correct minor JSON errors<br>- Ensures output compliance with required JSON format|

#### 2.3 Decision Logic: Check If All Info Gathered

- **Overview:** Determines if the agent has obtained all required information to proceed with task creation.
- **Nodes Involved:** `Have All Info?`
- **Node Details:**

| Node Name     | Details                                                                                                   |
|---------------|-----------------------------------------------------------------------------------------------------------|
| Have All Info?| - Type: n8n If node<br>- Condition: checks if `all Info` field in JSON output equals "Yes"<br>- Directs flow to either write task or request more info<br>- Edge cases: malformed JSON or missing fields could cause errors|

#### 2.4 Task Writing to Google Sheets

- **Overview:** Converts gathered JSON fields into a Google Sheets row and appends or updates the sheet accordingly.
- **Nodes Involved:** `Write Json` (Agent node), `OpenAI Chat Model2`, `Structured Output Parser1`, `Add Task`
- **Node Details:**

| Node Name           | Details                                                                                                                   |
|---------------------|---------------------------------------------------------------------------------------------------------------------------|
| Write Json           | - Type: LangChain Agent<br>- Receives `info gathered` JSON from previous block<br>- Parses and formats info into JSON for sheet<br>- Uses GPT-4.1-mini to parse<br>- Output passed to Add Task node<br>- Edge cases: parsing errors, incomplete data|
| OpenAI Chat Model2   | - Type: LangChain OpenAI Chat Model<br>- Used by Write Json node<br>- Same model and credentials as before<br>- Possible API errors|
| Structured Output Parser1 | - Type: LangChain Output Parser Structured<br>- Parses JSON into fields: task, description, status<br>- Ensures data matches expected sheet columns|
| Add Task             | - Type: Google Sheets node (appendOrUpdate operation)<br>- Writes task data: Task, Description, Status to sheet<br>- Maps columns explicitly with expressions<br>- Requires Google Sheets OAuth2 credentials<br>- Target spreadsheet and sheet tab configured by ID and gid=0<br>- Edge cases: authentication errors, sheet access issues, schema mismatch|

#### 2.5 User Response

- **Overview:** Sends a confirmation message back to the user after the task has been added.
- **Nodes Involved:** `Respond Complete`
- **Node Details:**

| Node Name       | Details                                                                                   |
|-----------------|-------------------------------------------------------------------------------------------|
| Respond Complete | - Type: LangChain Chat node<br>- Sends a static message "Item Added" to user<br>- Does not wait for user reply<br>- Final node in success branch|

#### 2.6 Requesting More Info

- **Overview:** If not all info is gathered, sends the AI-generated follow-up question back to the user to continue the chat.
- **Nodes Involved:** `Get More Info`
- **Node Details:**

| Node Name   | Details                                                                                       |
|-------------|-----------------------------------------------------------------------------------------------|
| Get More Info | - Type: LangChain Chat node<br>- Sends the agent's response message back to user<br>- Continues conversation to gather remaining info<br>- WaitUserReply set to false (non-blocking)<br>- Edge cases: network or chat delivery failures|

---

### 3. Summary Table

| Node Name              | Node Type                          | Functional Role                         | Input Node(s)           | Output Node(s)       | Sticky Note                                                                                          |
|------------------------|----------------------------------|---------------------------------------|------------------------|----------------------|----------------------------------------------------------------------------------------------------|
| Chat Trigger           | LangChain Chat Trigger           | Receive user chat input                | —                      | Project Manager Agent |                                                                                                    |
| Project Manager Agent  | LangChain Agent                  | Manage dialog, gather task info       | Chat Trigger, Chat Memory, OpenAI Chat Model, Structured Output Parser | Have All Info?        |                                                                                                    |
| OpenAI Chat Model      | LangChain OpenAI Chat Model      | Language model for Project Manager Agent | —                      | Project Manager Agent |                                                                                                    |
| Chat Memory            | LangChain Memory Buffer Window   | Store chat context                     | —                      | Project Manager Agent |                                                                                                    |
| Structured Output Parser| LangChain Output Parser Structured| Parse agent JSON output                | Project Manager Agent   | Project Manager Agent |                                                                                                    |
| Have All Info?         | If                              | Decision: all required info gathered? | Project Manager Agent   | Write Json, Get More Info |                                                                                                    |
| Write Json             | LangChain Agent                  | Format info JSON for Google Sheets    | Have All Info?          | Add Task              |                                                                                                    |
| OpenAI Chat Model2     | LangChain OpenAI Chat Model      | Language model for Write Json          | —                      | Write Json            |                                                                                                    |
| Structured Output Parser1| LangChain Output Parser Structured| Parse final JSON for sheet columns    | Write Json              | Add Task              |                                                                                                    |
| Add Task               | Google Sheets                   | Append or update task row in sheet    | Write Json              | Respond Complete      | Sticky Note: Setup instructions for Google Sheets OAuth2 with example spreadsheet link.            |
| Respond Complete       | LangChain Chat                  | Send confirmation message to user     | Add Task                | —                    |                                                                                                    |
| Get More Info          | LangChain Chat                  | Continue chat to gather more info     | Have All Info?          | Project Manager Agent |                                                                                                    |
| Sticky Note1           | Sticky Note                    | Project overview and general intro    | —                      | —                    | AI Project Manager — Add Tasks to Google Sheets from Chat.                                         |
| Sticky Note4           | Sticky Note                    | Setup instructions for OpenAI and Google Sheets connections | —                      | —                    | Detailed setup instructions with OpenAI API and Google Sheets OAuth2 credentials and test steps.   |
| Sticky Note64          | Sticky Note                    | Google Sheets OAuth2 credential setup reminder | —                      | —                    | Brief instructions on Google Sheets OAuth2 credential connection with example spreadsheet link.    |
| Sticky Note29          | Sticky Note                    | OpenAI connection setup reminder      | —                      | —                    | Steps to create and fund OpenAI API key credentials.                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Chat Trigger Node**
   - Type: LangChain Chat Trigger
   - Configure webhook with a unique ID
   - Set "responseMode" to "responseNodes"
   - Position: entry point

2. **Create Project Manager Agent Node**
   - Type: LangChain Agent
   - Connect input from Chat Trigger node
   - Configure System Message:
     ```
     Goal:
     You are only helping the user create new tasks in a Google Sheet. Do not handle updates yet.

     Process:
     Start by determining whether the user wants to create a new item or update an existing one.
     Continue chatting naturally with the user until:
     - You know that they want to update (stop and output that), or
     - You’ve gathered all required fields for a new task.

     Required fields for creating a new task:
     - Task
     - Description
     - Status

     The user can respond with “don’t know,” in which case that field is left blank.

     Output Format:
     {
       "response": "Your message back to the user",
       "info gathered": {
         "type": "create or update",
         "Task": "",
         "Description": "",
         "Status": ""
       },
       "all Info": "Yes or No"
     }

     Rules:
     "type" can only be "create" or "update".
     "all Info" can only be "Yes" or "No".
     Keep chatting until "all Info" = "Yes".
     ```
   - Enable Output Parser
   - Connect AI memory to a new Chat Memory node (see step 3)
   - Connect AI language model to OpenAI Chat Model node (see step 4)
   - Connect output parser to Structured Output Parser node (see step 5)

3. **Create Chat Memory Node**
   - Type: LangChain Memory Buffer Window
   - No special config needed
   - Connect as AI memory input to Project Manager Agent node

4. **Create OpenAI Chat Model Node**
   - Type: LangChain OpenAI Chat Model
   - Model: Select "gpt-4.1-mini"
   - Credentials: create/set OpenAI API credentials with valid API key
   - Connect as AI language model to Project Manager Agent node

5. **Create Structured Output Parser Node**
   - Type: LangChain Output Parser Structured
   - Configure with example JSON schema matching Project Manager Agent output:
     ```
     {
       "response": "what you want to say back to the user",
       "info gathered": {
         "type": "create or update",
         "Task": "",
         "Description": "",
         "Status": ""
       },
       "all Info": "Yes or No"
     }
     ```
   - Enable autoFix
   - Connect output parser to Project Manager Agent node

6. **Create Have All Info? If Node**
   - Type: If node
   - Condition: Check if `all Info` equals "Yes" in output JSON
   - Input: Project Manager Agent node output
   - True branch: Proceed to Write Json node (step 7)
   - False branch: Proceed to Get More Info node (step 11)

7. **Create Write Json Node**
   - Type: LangChain Agent
   - Input: output of Have All Info? node (true branch)
   - Configure System Message: "take in this info and parse it into this json."
   - Provide input text expression: `={{ $json.output['info gathered'] }}`
   - Enable output parser
   - Connect AI language model to a new OpenAI Chat Model node (step 8)
   - Connect output parser to Structured Output Parser1 node (step 9)

8. **Create OpenAI Chat Model2 Node**
   - Type: LangChain OpenAI Chat Model
   - Model: GPT-4.1-mini
   - Credentials: same OpenAI API credentials
   - Connect as AI language model to Write Json node

9. **Create Structured Output Parser1 Node**
   - Type: LangChain Output Parser Structured
   - Configure with example JSON schema:
     ```
     {
       "task": "task",
       "description": "description",
       "status": "status"
     }
     ```
   - Connect output parser to Write Json node
   - Connect output to Add Task node (step 10)

10. **Create Add Task Node**
    - Type: Google Sheets node
    - Operation: appendOrUpdate
    - Configure Google Sheets OAuth2 credentials (create/set with Google account)
    - Document ID: Spreadsheet ID (e.g., `1pbK-B-Q9p8fVjxJIsjEVrAfRgqEPCeYw8rZojZPAb84`)
    - Sheet Name: Use GID or tab name (e.g., `gid=0`)
    - Columns mapping:
      - Task: `={{ $json.output.task }}`
      - Description: `={{ $json.output.description }}`
      - Status: `={{ $json.output.status }}`
    - Connect input from Structured Output Parser1 node
    - Connect output to Respond Complete node (step 12)

11. **Create Get More Info Node**
    - Type: LangChain Chat
    - Message expression: `={{ $json.output.response }}`
    - WaitUserReply: false (non-blocking)
    - Input: Have All Info? node (false branch)
    - Output: connect back to Project Manager Agent node for continued chat flow

12. **Create Respond Complete Node**
    - Type: LangChain Chat
    - Message: Static text "Item Added"
    - WaitUserReply: false
    - Input: Add Task node
    - End of workflow

13. **Add Sticky Notes** (optional but recommended)
    - Add project overview, setup instructions for OpenAI and Google Sheets OAuth2, and testing steps as in the provided sticky notes for user guidance.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                         |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Let your team create, track, and manage project tasks through natural conversation. This workflow uses an AI Project Manager Agent that chats with users, gathers the task details it needs, and automatically adds them to a Google Sheet.                                                                                                                   | Project overview sticky note                                                                             |
| Setup steps for OpenAI: Obtain API key at https://platform.openai.com/api-keys, ensure billing is active https://platform.openai.com/settings/organization/billing/overview, and create OpenAI credentials in n8n.                                                                                                                                           | Sticky Note with OpenAI setup instructions                                                              |
| Setup steps for Google Sheets OAuth2: Create credentials in n8n, sign in with Google account, grant access, and select your spreadsheet and tab. Example: https://docs.google.com/spreadsheets/d/1pbK-B-Q9p8fVjxJIsjEVrAfRgqEPCeYw8rZojZPAb84/edit                                                                                                         | Sticky Note with Google Sheets OAuth2 setup instructions                                               |
| To test: Execute the workflow, then type a chat message like “Add a task for reviewing the project report tomorrow.” The agent will ask clarifying questions if needed, then add the record to your sheet.                                                                                                                                                      | Setup and test instructions included in sticky notes                                                   |
| Contact for customization or help: robert@ynteractive.com, LinkedIn https://www.linkedin.com/in/robert-breen-29429625/, Website https://ynteractive.com                                                                                                                                                                                                     | Contact info from sticky notes                                                                          |

---

**Disclaimer:** The text provided is extracted exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected material. All manipulated data are legal and public.