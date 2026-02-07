 Trello to Slack Notification Trigger: Task/Card Move Alerts 

https://n8nworkflows.xyz/workflows/-trello-to-slack-notification-trigger--task-card-move-alerts--7616


#  Trello to Slack Notification Trigger: Task/Card Move Alerts 

### 1. Workflow Overview

This workflow automates notifications in Slack when a Trello card (task) is moved from one list to another within a specified Trello board. It is designed for teams using Trello to manage tasks, enabling real-time alerts in Slack channels or DMs to keep members informed about task progress through different stages.

The workflow logically divides into these blocks:

- **1.1 Manual Testing Trigger:** Allows manual execution mainly for testing or setup verification.
- **1.2 Trello Event Trigger:** Listens for card movement events on a specified Trello board.
- **1.3 Data Transformation:** Extracts relevant data from Trello's webhook payload and formats it.
- **1.4 Slack Notification:** Sends a formatted notification message to a Slack user.
- **1.5 Setup Instructions and Documentation:** Sticky notes provide detailed setup instructions and contextual information for users.

---

### 2. Block-by-Block Analysis

#### 1.1 Manual Testing Trigger

- **Overview:**  
  Enables manual execution of the workflow for testing or demonstration purposes without waiting for an actual Trello event.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’

- **Node Details:**  
  - **Node Name:** When clicking ‘Execute workflow’  
  - **Type:** Manual Trigger  
  - **Configuration:** No parameters, fires on manual activation  
  - **Inputs:** None  
  - **Outputs:** Connects to "Get Your Model ID" node  
  - **Version Requirements:** Standard, no special version constraints  
  - **Potential Failures:** None expected, manual trigger controlled  
  - **Sub-workflow:** None

---

#### 1.2 Trello Event Trigger

- **Overview:**  
  Listens for Trello card move events on a specific board by subscribing to Trello webhooks. Triggers workflow execution automatically when a card is moved between lists.

- **Nodes Involved:**  
  - Trello Trigger

- **Node Details:**  
  - **Node Name:** Trello Trigger  
  - **Type:** Trello Trigger (Webhook)  
  - **Configuration:**  
    - Board ID is set to the target board's ID (provided as a parameter).  
    - Webhook ID is preconfigured for persistent webhook subscription.  
  - **Credentials:** Uses Trello API credentials containing API Key and Token.  
  - **Inputs:** None  
  - **Outputs:** Connects to "Edit Fields" node  
  - **Version Requirements:** Version 1 (basic Trello node)  
  - **Potential Failures:**  
    - Authentication errors if API key/token invalid or expired  
    - Webhook delivery failures if Trello service issues occur  
    - Incorrect board ID will prevent triggering  
  - **Sub-workflow:** None

---

#### 1.3 Data Transformation

- **Overview:**  
  Processes the incoming Trello webhook JSON payload. Extracts the card name as "Task", and list names before and after the move ("Previous Step" and "New Step"). Prepares data for Slack notification.

- **Nodes Involved:**  
  - Edit Fields

- **Node Details:**  
  - **Node Name:** Edit Fields  
  - **Type:** Set Node (Data Transformation)  
  - **Configuration:**  
    - Creates three new fields:  
      - `Task` assigned from `json.action.data.card.name`  
      - `Previous Step` assigned from `json.action.data.listBefore.name`  
      - `New Step` assigned from `json.action.data.listAfter.name`  
  - **Inputs:** Receives raw Trello webhook JSON from Trello Trigger  
  - **Outputs:** Passes transformed data to "Send a message2" Slack node  
  - **Version Requirements:** Uses version 3.4 for Set node, supporting expressions  
  - **Potential Failures:**  
    - Expression failures if expected Trello webhook structure changes or missing fields  
    - Null or undefined data if move event lacks listBefore/listAfter (e.g., card creation)  
  - **Sub-workflow:** None

---

#### 1.4 Slack Notification

- **Overview:**  
  Sends a formatted Slack message notifying the user that a task was moved from one list to another, using data prepared in the previous node.

- **Nodes Involved:**  
  - Send a message2

- **Node Details:**  
  - **Node Name:** Send a message2  
  - **Type:** Slack Node (Messaging)  
  - **Configuration:**  
    - Message text template:  
      `Task: *{{ $json.Task }}* moved from *{{ $json['Previous Step'] }}* to *{{ $json['New Step'] }}*`  
    - Sends message directly to a specified Slack user (user ID: `U09ADJPB7QA`)  
    - Uses OAuth2 authentication for Slack API access  
  - **Credentials:** Slack OAuth2 API credentials with scopes including `chat:write` and `users:read`  
  - **Inputs:** Receives fields Task, Previous Step, New Step from Edit Fields node  
  - **Outputs:** None (terminal node)  
  - **Version Requirements:** Version 2.3 of Slack node; OAuth2 authentication enabled  
  - **Potential Failures:**  
    - Authentication failure if OAuth token invalid or expired  
    - Permission errors if OAuth token lacks required scopes  
    - Delivery failure if user ID invalid or user not in workspace  
    - API rate limits or network connectivity issues  
  - **Sub-workflow:** None

---

#### 1.5 Setup Instructions and Documentation

- **Overview:**  
  Several sticky notes provide detailed instructions and context for setting up the workflow, credentials, and understanding the notification format.

- **Nodes Involved:**  
  - Sticky Note3  
  - Sticky Note50  
  - Sticky Note51  
  - Sticky Note52

- **Node Details:**  
  - **Sticky Note3:** Comprehensive setup instructions for Trello API key/token, Slack OAuth2 app creation, obtaining Trello board ID, and contact information.  
  - **Sticky Note50:** High-level description of workflow purpose and Slack message format example.  
  - **Sticky Note51:** Detailed Slack API app setup instructions focusing on OAuth scopes and credential linking.  
  - **Sticky Note52:** Trello API key and token acquisition instructions with URLs.  
  - **Type:** Sticky Note nodes purely informational; no inputs or outputs.  
  - **Potential Failures:** None; purely documentation.

---

### 3. Summary Table

| Node Name                 | Node Type          | Functional Role                | Input Node(s)              | Output Node(s)   | Sticky Note                                                                                                  |
|---------------------------|--------------------|-------------------------------|----------------------------|------------------|--------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger     | Manual workflow execution      | None                       | Get Your Model ID |                                                                                                              |
| Get Your Model ID          | HTTP Request       | Obtain Trello board ID (manual)| When clicking ‘Execute workflow’ | None             |                                                                                                              |
| Trello Trigger            | Trello Trigger     | Listen for Trello card move events | None                       | Edit Fields      |                                                                                                              |
| Edit Fields               | Set                | Extract and prepare data       | Trello Trigger             | Send a message2  |                                                                                                              |
| Send a message2           | Slack              | Send Slack notification        | Edit Fields                | None             |                                                                                                              |
| Sticky Note3              | Sticky Note        | Full setup instructions        | None                       | None             | Full setup instructions for Trello API and Slack app, plus contact info                                      |
| Sticky Note50             | Sticky Note        | Workflow description and message format | None                 | None             | Describes purpose: Slack notification for Trello card moves with example message                             |
| Sticky Note51             | Sticky Note        | Slack API connection instructions | None                     | None             | Details Slack OAuth2 app setup and scopes                                                                   |
| Sticky Note52             | Sticky Note        | Trello API key/token instructions | None                     | None             | Instructions to get Trello API key and token                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**  
   - Add a Manual Trigger node named "When clicking ‘Execute workflow’" with default configuration.

2. **Create HTTP Request Node (Optional for manual board ID retrieval):**  
   - Add HTTP Request node named "Get Your Model ID"  
   - Method: GET  
   - URL template: `https://api.trello.com/1/boards/{BOARD_SHORTLINK}?fields=id&key={YOUR_TRELLO_KEY}&token={YOUR_TRELLO_TOKEN}`  
   - No authentication; use parameters in URL  
   - Connect "When clicking ‘Execute workflow’" output to this node's input.

3. **Create Trello Trigger Node:**  
   - Add Trello Trigger node named "Trello Trigger"  
   - Set board ID to your target Trello board's ID (found from previous step or Trello UI)  
   - Authenticate using Trello API credentials: API Key and Token (must be created in n8n credentials)  
   - Set this node to listen for card move events on that board.

4. **Create Set Node for Data Transformation:**  
   - Add Set node named "Edit Fields"  
   - Configure fields:  
     - `Task`: Expression `{{$json["action"]["data"]["card"]["name"]}}`  
     - `Previous Step`: Expression `{{$json["action"]["data"]["listBefore"]["name"]}}`  
     - `New Step`: Expression `{{$json["action"]["data"]["listAfter"]["name"]}}`  
   - Connect "Trello Trigger" output to this node's input.

5. **Create Slack Node for Notification:**  
   - Add Slack node named "Send a message2"  
   - Authentication: Select Slack OAuth2 API credentials with proper scopes (at least `chat:write` and `users:read`)  
   - Message Text:  
     `Task: *{{ $json.Task }}* moved from *{{ $json['Previous Step'] }}* to *{{ $json['New Step'] }}*`  
   - Set recipient as a Slack user by user ID (e.g., `U09ADJPB7QA`) or choose channel as needed  
   - Connect "Edit Fields" output to this node's input.

6. **(Optional) Add Sticky Notes for Documentation:**  
   - Add sticky notes with setup instructions, credential steps, and message format as per original workflow for team reference.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                      | Context or Link                                                                                   |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Trello API key and token setup instructions: get your API key at https://trello.com/app-key and generate a token on the same page.                                                                                                                                                                                                                              | Trello App Key page                                                                              |
| Slack API app creation guide: Create a Slack app at https://api.slack.com/apps, add OAuth scopes `chat:write` and `users:read`, install the app and copy the Bot User OAuth Token to n8n credentials.                                                                                                                                                              | Slack API Apps                                                                                   |
| For retrieving Trello board ID, use the HTTP request node with URL format `https://api.trello.com/1/boards/{BOARD_SHORTLINK}?fields=id&key={YOUR_TRELLO_KEY}&token={YOUR_TRELLO_TOKEN}` and extract the "id" from the response.                                                                                                                                   | Trello API documentation                                                                        |
| Message format: `Task: *Task Name* moved from *Previous List* to *New List*` uses markdown for bold emphasis in Slack messages.                                                                                                                                                                                                                                | Slack message formatting                                                                         |
| Contact info for workflow customization or support: Robert Breen, robert@ynteractive.com, LinkedIn https://www.linkedin.com/in/robert-breen-29429625/, website https://ynteractive.com                                                                                                                                                                            | Workflow author and support contact                                                             |

---

**Disclaimer:** This document is based exclusively on an n8n automated workflow and complies with all content policies. It contains no illegal or offensive material. All data handled is public and legal.