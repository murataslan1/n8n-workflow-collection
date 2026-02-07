Automate Lead Intent Classification from Google Sheets to ClickUp with Azure GPT-4

https://n8nworkflows.xyz/workflows/automate-lead-intent-classification-from-google-sheets-to-clickup-with-azure-gpt-4-9346


# Automate Lead Intent Classification from Google Sheets to ClickUp with Azure GPT-4

### 1. Workflow Overview

This workflow automates the classification of lead replies collected in Google Sheets and generates corresponding follow-up tasks in ClickUp, leveraging Azure OpenAI GPT-4 for AI-based intent analysis. It is designed for sales or marketing teams to save time on manual lead qualification, ensure consistent follow-up, and streamline task creation based on lead intent.

**Logical Blocks:**

- **1.1 Input Reception & Trigger:** Scheduled polling of Google Sheets for new lead replies.
- **1.2 Data Preparation:** Normalization and extraction of lead data for AI processing.
- **1.3 AI Intent Classification:** Using Azure GPT-4 to classify lead intent and determine next steps.
- **1.4 Intent Routing:** Routing leads to different handlers based on classified intent.
- **1.5 Task Mapping:** Mapping intent to task details such as pipeline stage, due date, and description.
- **1.6 ClickUp Task Creation:** Creating tasks in ClickUp workspace with mapped details.
- **1.7 Checklist Processing:** Adding structured checklists and checklist items to tasks in ClickUp, handled with batch processing to respect API rate limits.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Trigger

- **Overview:**  
This block triggers the workflow every 15 minutes and reads new lead replies from a designated Google Sheet tab.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Google Sheets - Read New Replies

- **Node Details:**  
  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Configuration: Runs on a 15-minute interval.  
    - Inputs: None (trigger node)  
    - Outputs: Google Sheets node  
    - Edge Cases: Misconfigured schedule interval; workflow may process all existing rows on first run causing large data load.

  - **Google Sheets - Read New Replies**  
    - Type: Google Sheets  
    - Configuration: Reads from tab “GHL-Replies” in user’s Google Sheet (document ID must be replaced with actual sheet ID). Uses OAuth2 credentials.  
    - Inputs: Trigger from Schedule Trigger  
    - Outputs: Data passed to data preparation node  
    - Edge Cases: Sheet not shared with n8n, invalid sheet ID, empty or malformed data rows, API quota limits.  
    - Continue on Fail: Enabled, so downstream processing continues even if some read errors occur.

#### 2.2 Data Preparation

- **Overview:**  
Standardizes and normalizes lead data fields to prepare a clean JSON object for AI classification. Handles missing or incomplete data by falling back to previous data.

- **Nodes Involved:**  
  - Prepare Data for Classification

- **Node Details:**  
  - **Prepare Data for Classification**  
    - Type: Set  
    - Configuration: Extracts `leadId`, `leadName`, `replyMessage`, `email`, and `company` fields. Uses fallback expressions to handle missing fields from Google Sheets data.  
    - Inputs: Google Sheets output  
    - Outputs: Clean, normalized lead data for AI node  
    - Edge Cases: Missing fields in Google Sheets rows, malformed data, expression evaluation failures.

#### 2.3 AI Intent Classification

- **Overview:**  
Executes an AI agent that uses Azure GPT-4 to classify the lead’s reply message into predefined intent categories and determine appropriate next steps.

- **Nodes Involved:**  
  - Azure OpenAI Chat Model  
  - Simple Memory (contextual memory for AI agent)  
  - Structured Output Parser  
  - AI Intent Classification (Langchain agent node)

- **Node Details:**  
  - **Azure OpenAI Chat Model**  
    - Type: Langchain Azure OpenAI LM Chat  
    - Configuration: Uses GPT-4 deployment (`gpt-4o`). Requires Azure OpenAI API credentials.  
    - Inputs: Memory and AI Intent Classification node  
    - Outputs: AI generated text response  
    - Edge Cases: API key expiration, rate limits, timeouts, model unavailability.

  - **Simple Memory**  
    - Type: Langchain Memory Buffer Window  
    - Configuration: Maintains a session key `"lead_intent_classifier"` with a 7-message context window.  
    - Inputs: AI Intent Classification node (input messages)  
    - Outputs: Context passed to Azure OpenAI Chat Model  
    - Edge Cases: Session key collisions, memory overflow (unlikely).

  - **Structured Output Parser**  
    - Type: Langchain Structured Output Parser  
    - Configuration: Parses AI response JSON to extract structured fields such as intent, nextStep, pipelineStage, dueDateDaysFromNow, taskDescription, reasoning.  
    - Inputs: Azure OpenAI Chat Model output  
    - Outputs: Parsed JSON for AI Intent Classification node  
    - Edge Cases: Malformed JSON from AI, parsing errors.

  - **AI Intent Classification**  
    - Type: Langchain Agent  
    - Configuration: Uses a detailed system prompt instructing the AI to classify intent into one of five categories with strict JSON output.  
    - Inputs: Prepared lead data  
    - Outputs: Parsed intent result for routing  
    - Edge Cases: Ambiguous inputs, multiple intents present (priority defined), AI returning invalid format.

#### 2.4 Intent Routing

- **Overview:**  
Routes the classified lead data to corresponding handlers based on the intent string field.

- **Nodes Involved:**  
  - Extract Intent Result  
  - Switch - Intent Router

- **Node Details:**  
  - **Extract Intent Result**  
    - Type: Set  
    - Configuration: Extracts `intent` from AI output and preserves original lead data for downstream use.  
    - Inputs: AI Intent Classification output  
    - Outputs: Switch node  
    - Edge Cases: Missing or undefined intent field.

  - **Switch - Intent Router**  
    - Type: Switch  
    - Configuration: Routes based on exact, case-sensitive matching of the `intent` field to:  
      - DEMO_REQUEST  
      - PRICING_INQUIRY  
      - OBJECTION  
      - NOT_INTERESTED  
      - Default route for others including POSITIVE_INTEREST  
    - Inputs: Extract Intent Result  
    - Outputs: Four output branches corresponding to above intents  
    - Edge Cases: Unknown or unexpected intent strings, case sensitivity causing misrouting.

#### 2.5 Task Mapping

- **Overview:**  
Maps the routed intent to specific next steps, pipeline stages, due dates, and task descriptions for task creation.

- **Nodes Involved:**  
  - Map Demo Next Steps  
  - Map Pricing Next Steps  
  - Map Objection Next Steps  
  - Map Default Next Steps

- **Node Details:**  
  Each node is a **Set** node that assigns the following fields based on intent:  
    - `nextStep` (e.g., "Schedule Demo")  
    - `pipelineStage` (e.g., "Demo Scheduled")  
    - `dueDate` (calculated from current date plus days)  
    - `taskDescription` (customized message with lead name)  
    - `leadName` (for convenience)  

  - Due dates:  
    - Demo Requests: +2 days  
    - Pricing Inquiries: +1 day  
    - Objections: +1 day  
    - Default (positive interest or others): +3 days  
    - Not Interested: routed to default with appropriate pipeline stage ("Follow-up Required") - possibly needs manual closing  

  - Inputs: Switch node outputs  
  - Outputs: ClickUp Create Task node  
  - Edge Cases: Date formatting issues, missing lead names, incorrect field mapping.

#### 2.6 ClickUp Task Creation

- **Overview:**  
Creates ClickUp tasks with the mapped details and sets task priority.

- **Nodes Involved:**  
  - ClickUp - Create Task

- **Node Details:**  
  - **ClickUp - Create Task**  
    - Type: ClickUp  
    - Configuration:  
      - Requires user to input ClickUp workspace IDs: team, space, folder, list.  
      - Task name combines nextStep and leadName (e.g., "Schedule Demo - John Doe").  
      - Due date assigned from mapped field.  
      - Priority set to 3 (Normal) by default.  
      - Uses ClickUp API credentials.  
    - Inputs: Task mapping nodes (Set nodes)  
    - Outputs: Loop node for adding checklist items  
    - Edge Cases: Invalid workspace IDs, API failures, permission issues.

#### 2.7 Checklist Processing

- **Overview:**  
Sequentially adds checklists and checklist items to each created ClickUp task to support structured follow-up, with batch processing to respect ClickUp API rate limits.

- **Nodes Involved:**  
  - Loop Over Items (SplitInBatches)  
  - ClickUp - Add Checklist Subtasks (HTTP Request)  
  - HTTP Request - Add Checklist Item

- **Node Details:**  
  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Configuration: Processes one task at a time to avoid exceeding ClickUp API rate limits (100 req/min).  
    - Inputs: ClickUp task creation outputs  
    - Outputs: Checklist creation HTTP request  
    - Edge Cases: Large batch sizes causing delays, memory issues.

  - **ClickUp - Add Checklist Subtasks**  
    - Type: HTTP Request  
    - Configuration:  
      - POST to `/api/v2/task/{taskId}/checklist` endpoint.  
      - Creates a checklist named after the task name.  
      - Authentication via ClickUp credentials.  
    - Inputs: Loop node output  
    - Outputs: HTTP Request to add checklist item  
    - Edge Cases: API failures, invalid task IDs, auth errors.

  - **HTTP Request - Add Checklist Item**  
    - Type: HTTP Request  
    - Configuration:  
      - POST to `/api/v2/checklist/{checklistId}/checklist_item` endpoint.  
      - Adds a checklist item named “Follow-up” (can be customized).  
      - Authentication via ClickUp credentials.  
    - Inputs: Checklist creation response  
    - Outputs: Loops back to Loop Over Items node  
    - Edge Cases: API rate limits, missing checklist ID, malformed body.

---

### 3. Summary Table

| Node Name                     | Node Type                          | Functional Role                          | Input Node(s)                    | Output Node(s)                      | Sticky Note                                                                                                   |
|-------------------------------|----------------------------------|----------------------------------------|---------------------------------|-----------------------------------|--------------------------------------------------------------------------------------------------------------|
| Schedule Trigger               | Schedule Trigger                 | Triggers workflow every 15 minutes     | None                            | Google Sheets - Read New Replies  | ## ⏰ Trigger Configuration - Runs every 15 minutes to check for new lead replies. Adjust interval as needed. |
| Google Sheets - Read New Replies | Google Sheets                   | Reads new lead replies from sheet      | Schedule Trigger                | Prepare Data for Classification   | ## 📊 Google Sheets Setup - Required columns and OAuth2 credentials.                                          |
| Prepare Data for Classification | Set                            | Normalizes and extracts lead data      | Google Sheets - Read New Replies | AI Intent Classification         | ## 🔄 Data Preparation - Standardizes data for AI analysis.                                                  |
| Azure OpenAI Chat Model        | Langchain Azure OpenAI LM Chat  | Runs GPT-4 model for AI classification | Simple Memory                   | AI Intent Classification          | ## 🤖 AI Intent Classification - Uses GPT-4 with Azure OpenAI.                                               |
| Simple Memory                 | Langchain Memory Buffer Window   | Maintains AI session context           | AI Intent Classification        | Azure OpenAI Chat Model           |                                                                                                              |
| Structured Output Parser       | Langchain Structured Output Parser | Parses AI JSON output                   | Azure OpenAI Chat Model         | AI Intent Classification          |                                                                                                              |
| AI Intent Classification       | Langchain Agent                 | Main AI agent node for classification  | Prepare Data for Classification, Azure OpenAI Chat Model, Simple Memory, Structured Output Parser | Extract Intent Result             |                                                                                                              |
| Extract Intent Result          | Set                             | Extracts intent and original data      | AI Intent Classification        | Switch - Intent Router            | ## 📤 Extract AI Results - Pulls out classified intent and preserves lead data.                              |
| Switch - Intent Router         | Switch                         | Routes data based on classified intent | Extract Intent Result           | Map Demo Next Steps, Map Pricing Next Steps, Map Objection Next Steps, Map Default Next Steps | ## 🔀 Intent-Based Router - Routes leads to specialized handlers by intent.                                 |
| Map Demo Next Steps            | Set                             | Maps demo request intent to task details | Switch - Intent Router (output 0) | ClickUp - Create Task           | ## 🎯 Demo Request Handler - Creates demo scheduling task with +2 days due date.                             |
| Map Pricing Next Steps         | Set                             | Maps pricing inquiry intent to task details | Switch - Intent Router (output 1) | ClickUp - Create Task           | ## 💰 Pricing Handler - Creates pricing info task with +1 day due date.                                     |
| Map Objection Next Steps       | Set                             | Maps objection intent to task details  | Switch - Intent Router (output 2) | ClickUp - Create Task           | ## ⚠️ Objection Handler - Creates objection handling task with +1 day due date.                             |
| Map Default Next Steps         | Set                             | Maps default/other intents to task details | Switch - Intent Router (output 3) | ClickUp - Create Task           | ## 📋 Default Handler - Creates general follow-up task with +3 days due date.                               |
| ClickUp - Create Task          | ClickUp                        | Creates tasks in ClickUp workspace      | Map * Next Steps nodes          | Loop Over Items                  | ## ✅ ClickUp Task Creation - Requires workspace IDs and credentials.                                        |
| Loop Over Items               | SplitInBatches                 | Processes tasks one-by-one for checklist addition | ClickUp - Create Task           | ClickUp - Add Checklist Subtasks | ## 🔁 Batch Processing Loop - Avoids ClickUp API rate limits by processing sequentially.                     |
| ClickUp - Add Checklist Subtasks | HTTP Request                  | Creates checklist on ClickUp tasks      | Loop Over Items                 | HTTP Request - Add Checklist Item | ## 📝 Add Checklist to Task - Adds checklist named after task.                                              |
| HTTP Request - Add Checklist Item | HTTP Request                  | Adds checklist item named "Follow-up"  | ClickUp - Add Checklist Subtasks | Loop Over Items                  | ## ✔️ Add Checklist Item - Adds follow-up item to checklist.                                                |
| Sticky Note (multiple nodes)  | Sticky Note                    | Documentation and configuration notes  | None                          | None                            | See detailed sticky notes in node descriptions above.                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Set interval to every 15 minutes.

2. **Add a Google Sheets node**  
   - Type: Google Sheets (Read operation)  
   - Configure with OAuth2 credentials for Google Sheets  
   - Set document ID to your Google Sheets file ID  
   - Set sheet/tab name to "GHL-Replies"  
   - Connect Schedule Trigger output to this node input.

3. **Add a Set node named "Prepare Data for Classification"**  
   - Extract fields:  
     - `leadId` = `{{$json.id || $json.leadId}}`  
     - `leadName` = `{{$json.name}}`  
     - `replyMessage` = `{{$json.lastMessage || $json.reply}}`  
     - `email` = `{{$json.email}}`  
     - `company` = `{{$json.company}}` (optional)  
   - Connect Google Sheets output to this node.

4. **Add Langchain nodes for AI classification:**  
   - Create a Simple Memory node:  
     - Set `sessionKey` to `"lead_intent_classifier"`  
     - Set `contextWindowLength` to 7  
   - Create an Azure OpenAI Chat Model node:  
     - Use GPT-4 deployment (`gpt-4o`)  
     - Configure with Azure OpenAI API credentials  
   - Create a Structured Output Parser node:  
     - Provide JSON schema matching lead intent classification output fields.  
   - Create an AI Intent Classification (Langchain Agent) node:  
     - Set input text prompt to include lead details and reply message.  
     - Use the provided system message prompt to classify intent into categories and produce JSON output.  
     - Link the nodes as follows:  
       - Prepare Data for Classification → AI Intent Classification  
       - AI Intent Classification → Simple Memory (ai_memory)  
       - Simple Memory → Azure OpenAI Chat Model (ai_languageModel)  
       - Azure OpenAI Chat Model → Structured Output Parser (ai_outputParser)  
       - Structured Output Parser feeds back into AI Intent Classification node.

5. **Add a Set node "Extract Intent Result"**  
   - Extract `intent` from AI output JSON (`$json.output.intent`)  
   - Preserve original lead data from "Prepare Data for Classification" node.  
   - Connect AI Intent Classification output to this node.

6. **Add a Switch node "Switch - Intent Router"**  
   - Route based on `intent` field with exact string matching:  
     - DEMO_REQUEST → output 0  
     - PRICING_INQUIRY → output 1  
     - OBJECTION → output 2  
     - NOT_INTERESTED → output 3  
     - Default branch for others such as POSITIVE_INTEREST.

7. **Add four Set nodes for mapping next steps:**  
   - **Map Demo Next Steps:**  
     - `nextStep`: "Schedule Demo"  
     - `pipelineStage`: "Demo Scheduled"  
     - `dueDate`: current date + 2 days, formatted yyyy-MM-dd  
     - `taskDescription`: "Contact {{leadName}} to schedule product demo"  
     - `leadName`: from original data  
   - **Map Pricing Next Steps:**  
     - `nextStep`: "Send Pricing Information"  
     - `pipelineStage`: "Pricing Sent"  
     - `dueDate`: current date + 1 day  
     - `taskDescription`: "Send pricing details to {{leadName}}"  
     - `leadName`: from original data  
   - **Map Objection Next Steps:**  
     - `nextStep`: "Address Objections"  
     - `pipelineStage`: "Objection Handling"  
     - `dueDate`: current date + 1 day  
     - `taskDescription`: "Follow up with {{leadName}} to handle objections"  
     - `leadName`: from original data  
   - **Map Default Next Steps:**  
     - `nextStep`: "General Follow-up"  
     - `pipelineStage`: "Follow-up Required"  
     - `dueDate`: current date + 3 days  
     - `taskDescription`: "General follow-up with {{leadName}}"  
     - `leadName`: from original data  
   - Connect respective Switch outputs to these Set nodes.

8. **Add a ClickUp node "ClickUp - Create Task"**  
   - Configure with your ClickUp workspace IDs: `team`, `space`, `folder`, `list`.  
   - Task `name` field: combine nextStep and leadName (`={{ $json.nextStep }} - {{ $json.leadName }}`)  
   - Set `dueDate` from mapped `dueDate` field.  
   - Set priority to 3 (normal).  
   - Use ClickUp API credentials.  
   - Connect all four mapping nodes' outputs to this node.

9. **Add a SplitInBatches node "Loop Over Items"**  
   - Split tasks one by one to avoid API rate limits.  
   - Connect ClickUp Create Task output to this node.

10. **Add an HTTP Request node "ClickUp - Add Checklist Subtasks"**  
    - Method: POST  
    - URL: `https://api.clickup.com/api/v2/task/{{$json.id}}/checklist`  
    - JSON Body: `{"name": "{{$json.name}}"}`  
    - Use ClickUp API credentials.  
    - Connect Loop Over Items output to this node.

11. **Add an HTTP Request node "HTTP Request - Add Checklist Item"**  
    - Method: POST  
    - URL: `https://api.clickup.com/api/v2/checklist/{{$json.checklist.id}}/checklist_item`  
    - JSON Body: `{"name": "Follow-up"}` (customizable)  
    - Use ClickUp API credentials.  
    - Connect ClickUp Add Checklist Subtasks output to this node.

12. **Loop back HTTP Request - Add Checklist Item output to Loop Over Items node**  
    - This creates a loop processing checklist items sequentially.

13. **Test entire workflow with sample data.**  
    - Verify Google Sheets data access, AI classification accuracy, intent routing, task creation, and checklist additions.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                  | Context or Link                                                                                           |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| The workflow saves 2-3 hours daily on manual lead qualification and ensures standardized, actionable follow-ups for sales teams.                              | Sticky Note (Node: Sticky Note)                                                                          |
| First workflow run processes all existing rows; subsequent runs handle only new entries. Adjust trigger interval based on lead volume (recommended 15 min).  | Sticky Note1                                                                                              |
| Google Sheets must have a tab named "GHL-Replies" with columns: leadId, name, email, reply, company (optional). Share the sheet with n8n service account.     | Sticky Note2                                                                                              |
| Azure OpenAI GPT-4 deployment must be configured and active for this workflow to work. Check and test with sample leads first.                                | Sticky Note4                                                                                              |
| ClickUp API rate limits (100 requests/min) require batch processing when adding checklist items to tasks.                                                    | Sticky Note12                                                                                            |
| ClickUp workspace IDs (team, space, folder, list) must be obtained from ClickUp API integration settings; replace placeholders in ClickUp node parameters.   | Sticky Note11                                                                                            |
| Customize checklist items by modifying the JSON body in the HTTP Request node adding checklist items.                                                        | Sticky Note14                                                                                            |
| Learn more about sales lead qualification workflows integrating AI: [n8n Blog](https://n8n.io/blog/automating-lead-management) (example resource, not linked in workflow) | External resource suggestion for broader context                                                         |

---

**Disclaimer:** The provided text is exclusively derived from an n8n automated workflow. It complies strictly with content policies and contains no illegal or offensive material. All data processed is legal and public.