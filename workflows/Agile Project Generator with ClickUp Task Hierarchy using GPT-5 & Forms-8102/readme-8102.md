Agile Project Generator with ClickUp Task Hierarchy using GPT-5 & Forms

https://n8nworkflows.xyz/workflows/agile-project-generator-with-clickup-task-hierarchy-using-gpt-5---forms-8102


# Agile Project Generator with ClickUp Task Hierarchy using GPT-5 & Forms

### 1. Workflow Overview

This workflow automates the generation of an Agile project structure with ClickUp task hierarchies using AI-driven natural language processing (NLP) and a form input interface. It is designed for project managers and software architects who want to quickly convert high-level project ideas into detailed, actionable Agile tasks and sub-tasks, organized directly in ClickUp. The workflow leverages GPT-5 AI models to clean up project naming, generate Jira-style project keys, and produce detailed user-story formatted tasks with subtasks.

Logical blocks in the workflow:

- **1.1 Input Reception**: Captures project details from a web form or manual trigger.
- **1.2 Project Naming and Key Generation (AI Processing)**: Uses GPT-5 to clean inputs, generate a professional project name, description, and a random Jira-style project key.
- **1.3 Project List Creation in ClickUp**: Creates a new ClickUp list to represent the project.
- **1.4 Agile Task Generation (AI Processing)**: Generates detailed Agile user story tasks with subtasks based on the full project feature description.
- **1.5 Task and Sub-task Processing**: Splits the AI-generated tasks and subtasks to create corresponding ClickUp tasks and subtasks, invoking a sub-workflow for sub-task creation.
- **1.6 Notification**: Sends an email notification upon successful project and task creation.
- **1.7 Sub-workflow for Sub-task Creation**: Processes individual sub-task creation with proper parent-child relationships in ClickUp.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block captures project data either from a manual trigger (for testing) or a web form submission.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- On form submission (Form Trigger)  

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual initiation of the workflow for testing with sample input.  
  - Configuration: No parameters, triggers the workflow on click.  
  - Inputs: None  
  - Outputs: Project Name, Project Full Features fields as JSON  
  - Edge cases: Manual trigger may lack real user input; testing data must be valid.

- **On form submission**  
  - Type: Form Trigger (webhook)  
  - Role: Captures project name and full features from a web form titled "Jira Full Project Generator".  
  - Configuration: Form fields - Project Name (required), Project Full Features (textarea, required).  
  - Inputs: HTTP form submission  
  - Outputs: JSON with submitted form data  
  - Edge cases: Missing required fields, webhook misconfiguration, form changes affecting input schema.

---

#### 1.2 Project Naming and Key Generation (AI Processing)

**Overview:**  
Uses GPT-5 to refine raw project name and feature description, producing a professional project name, concise description, and a randomly generated 5-letter uppercase Jira-like project key.

**Nodes Involved:**  
- OpenAI Chat Model  
- Project Naming (Chain LLM)  
- Structured Output Parser1  

**Node Details:**

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat LLM  
  - Role: Serves as the AI engine for language model calls.  
  - Configuration: Model set to "gpt-5-mini" (simulated GPT-5 variant).  
  - Credentials: OpenAI API key configured.  
  - Inputs: Text prompt from subsequent nodes.  
  - Outputs: AI-generated raw response.  
  - Edge cases: API rate limits, invalid credentials, timeout, malformed prompts.

- **Project Naming**  
  - Type: Chain LLM node (text prompt)  
  - Role: Crafts prompt for AI to produce cleaned project name, description, and project key in JSON format.  
  - Configuration: Detailed prompt with instructions and input variables for raw project name and features; expects JSON output only.  
  - Inputs: JSON from form or manual trigger node with Project Name and Project Full Features.  
  - Outputs: JSON with fields: project_name, project_description, project_key.  
  - Edge cases: AI output might not match JSON schema, parsing errors.

- **Structured Output Parser1**  
  - Type: Langchain structured output parser  
  - Role: Parses AI response into structured JSON for further use.  
  - Configuration: JSON schema example with project_name, project_description, project_key.  
  - Inputs: Raw AI response from Project Naming.  
  - Outputs: Parsed JSON object with structured project data.  
  - Edge cases: Parsing failures, invalid or incomplete JSON from AI.

---

#### 1.3 Project List Creation in ClickUp

**Overview:**  
Creates the main project list in ClickUp workspace using the AI-generated project name.

**Nodes Involved:**  
- ClickUp Create List  
- Sticky Note3 (comment)  

**Node Details:**

- **ClickUp Create List**  
  - Type: ClickUp API node  
  - Role: Creates a new list (project container) in ClickUp under specified team and space.  
  - Configuration:  
    - Resource: list  
    - Operation: create  
    - Name: AI-generated project_name from previous node  
    - Team and Space IDs preconfigured (9014828465 and 90143504524)  
    - Folderless list creation  
  - Credentials: ClickUp API credential configured.  
  - Inputs: Project name JSON from Structured Output Parser1.  
  - Outputs: JSON with created list details including list ID.  
  - Edge cases: API authentication failure, invalid team/space IDs, network errors.

---

#### 1.4 Agile Task Generation (AI Processing)

**Overview:**  
Generates a detailed list of Agile tasks and subtasks formatted as user stories, using GPT-5 based on project feature descriptions.

**Nodes Involved:**  
- Clickup Project Task Generator (Chain LLM)  
- Structured Output Parser  
- Split Out  

**Node Details:**

- **Clickup Project Task Generator**  
  - Type: Chain LLM  
  - Role: Sends prompt to GPT-5 to create multiple user story tasks with subtasks in JSON array.  
  - Configuration:  
    - Prompt requests Agile user story formatted tasks with descriptions and subtasks.  
    - Input includes Project Name and Full Features (from manual trigger node, not form — note distinction).  
    - Output: JSON array of task objects with subtasks.  
  - Inputs: Project name and features from manual trigger node (note: this may be a testing data source; form data path differs).  
  - Outputs: Raw AI JSON response.  
  - Edge cases: AI output formatting errors, JSON parse failures, input mismatch if manual trigger is not used.

- **Structured Output Parser**  
  - Type: Langchain output parser  
  - Role: Parses the AI-generated JSON array into structured data for downstream processing.  
  - Inputs: Raw AI JSON from task generator.  
  - Outputs: Parsed array of task objects.  
  - Edge cases: Parsing errors due to malformed AI output.

- **Split Out**  
  - Type: Split Out node  
  - Role: Splits the array of task objects into individual items for batch processing.  
  - Inputs: Parsed array of tasks.  
  - Outputs: Individual task JSON objects.  
  - Edge cases: Empty input arrays, unexpected data shapes.

---

#### 1.5 Task and Sub-task Processing

**Overview:**  
Processes each main task and its subtasks to create ClickUp tasks and subtasks, using batch and loop nodes, and a sub-workflow for sub-tasks.

**Nodes Involved:**  
- Limit  
- Loop Over Items  
- ClickUp Create Task  
- Edit Fields  
- Split Out1  
- Merge  
- Execute Workflow  
- When Executed by Another Workflow (Sub-workflow trigger)  
- Loop Over Items1  
- ClickUp Create Sub-Task  

**Node Details:**

- **Limit**  
  - Type: Limit node  
  - Role: Controls the number of tasks processed per batch (default limit, no specific number set).  
  - Inputs: Tasks from Split Out.  
  - Outputs: Limited batch of tasks.  
  - Edge cases: No limit specified may process all tasks at once.

- **Loop Over Items**  
  - Type: Split in Batches  
  - Role: Iterates over tasks in batches to manage API calls and processing load.  
  - Inputs: Tasks from Limit node.  
  - Outputs: Single task per iteration to downstream nodes.  
  - Edge cases: Batch size default, potential for partial batch processing.

- **ClickUp Create Task**  
  - Type: ClickUp API node  
  - Role: Creates individual main tasks in ClickUp list with task title and description.  
  - Configuration:  
    - List ID from created project list  
    - Task name from "task_title" field  
    - Content from "description" field  
  - Inputs: Task JSON from Loop Over Items.  
  - Outputs: Created task details including task ID.  
  - Edge cases: API limits, invalid list ID, missing task fields.

- **Edit Fields**  
  - Type: Set node  
  - Role: Extracts and assigns the "sub_tasks" array from the current task JSON to a field for further splitting.  
  - Inputs: Output of ClickUp Create Task.  
  - Outputs: Task JSON augmented with sub_tasks array.  
  - Edge cases: Missing or empty sub_tasks field.

- **Split Out1**  
  - Type: Split Out node  
  - Role: Splits each sub-task from the "sub_tasks" array into individual items.  
  - Inputs: JSON with sub_tasks array.  
  - Outputs: Individual sub-task JSON objects.  
  - Edge cases: Empty sub_tasks arrays, malformed sub-task data.

- **Merge**  
  - Type: Merge node  
  - Role: Combines outputs from multiple inputs; here used to coordinate sub-task processing.  
  - Inputs: Sub-task JSON from Split Out1, and task info from ClickUp Create Task.  
  - Outputs: Merged JSON for sub-task creation.  
  - Edge cases: Incorrect merge mode or data mismatch.

- **Execute Workflow**  
  - Type: Execute Workflow node  
  - Role: Invokes the sub-workflow responsible for creating sub-tasks in ClickUp.  
  - Configuration:  
    - References sub-workflow "ClickUp Project Generator Template Workflow" by ID.  
    - Maps inputs: list_id, task_id, subtask_title, subtask_description.  
  - Inputs: Merged sub-task JSON and task info.  
  - Outputs: Sub-workflow execution results.  
  - Edge cases: Incorrect sub-workflow ID, missing input parameters, sub-workflow failures.

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger (sub-workflow entry)  
  - Role: Entry node for sub-workflow that processes sub-task creation.  
  - Inputs: Workflow inputs list_id, task_id, subtask_title, subtask_description.  
  - Outputs: Sub-task JSON.

- **Loop Over Items1**  
  - Type: Split in Batches  
  - Role: Processes individual sub-task creation in batches.  
  - Inputs: Sub-task JSON array.  
  - Outputs: Single sub-task JSON per iteration.

- **ClickUp Create Sub-Task**  
  - Type: ClickUp API node  
  - Role: Creates sub-tasks under parent tasks in ClickUp.  
  - Configuration:  
    - List ID, parent task ID (parentId), subtask title and description from inputs.  
    - Uses team and space IDs as in main list creation.  
  - Inputs: Single sub-task JSON from Loop Over Items1.  
  - Outputs: Created sub-task details.  
  - Edge cases: Invalid parent task ID, API limits, missing fields.

---

#### 1.6 Notification

**Overview:**  
Sends an email notification confirming successful project and task creation with ClickUp links.

**Nodes Involved:**  
- Aggregate  
- Gmail  

**Node Details:**

- **Aggregate**  
  - Type: Aggregate node  
  - Role: Aggregates data from batch processing to prepare for notification.  
  - Inputs: Data from Loop Over Items.  
  - Outputs: Aggregated data for email content.  
  - Edge cases: Empty aggregation, data mismatches.

- **Gmail**  
  - Type: Gmail node (OAuth2)  
  - Role: Sends notification email on project creation success.  
  - Configuration:  
    - Recipient email (default placeholder: n8n_test_result_replace_me@yopmail.com, must be updated)  
    - Subject: "Project successfully generated"  
    - Message body includes project name, ClickUp list ID, and direct project link.  
  - Credentials: Gmail OAuth2.  
  - Inputs: Aggregated data with project info.  
  - Edge cases: Invalid recipient email, Gmail API auth failure, rate limits.

---

#### 1.7 Sub-workflow for Sub-task Creation

**Overview:**  
Handles creation of sub-tasks under parent tasks in ClickUp, maintaining proper task hierarchy.

**Nodes Involved:**  
- When Executed by Another Workflow (trigger)  
- Loop Over Items1  
- ClickUp Create Sub-Task  
- Sticky Note9 (comment)  

**Node Details:**

- **When Executed by Another Workflow**  
  - Entry point for sub-workflow, receives inputs for sub-task creation.

- **Loop Over Items1**  
  - Processes each sub-task separately in batches.

- **ClickUp Create Sub-Task**  
  - Creates sub-task in ClickUp linked to parent task.

- **Sticky Note9**  
  - Comment indicating this is the sub-task creator workflow.

- Edge cases: Sub-workflow execution failures, input mismatches, API errors.

---

### 3. Summary Table

| Node Name                   | Node Type                               | Functional Role                                   | Input Node(s)                         | Output Node(s)                          | Sticky Note                                                                                           |
|-----------------------------|---------------------------------------|-------------------------------------------------|-------------------------------------|---------------------------------------|-----------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’| Manual Trigger                        | Manual trigger for testing workflow              | None                                | Project Naming                        |                                                                                                     |
| On form submission          | Form Trigger                         | Captures project data via web form               | None                                | Project Naming                        |                                                                                                     |
| OpenAI Chat Model           | Langchain OpenAI Chat Model          | AI engine for language model prompts             | Project Naming, Clickup Project Task Generator | Project Naming, Clickup Project Task Generator |                                                                                                     |
| Project Naming              | Chain LLM                           | AI project name, description, and key generation | When clicking ‘Test workflow’, On form submission | ClickUp Create List                  |                                                                                                     |
| Structured Output Parser1   | Langchain Output Parser              | Parses AI output for project naming              | Project Naming                      | ClickUp Create List                   |                                                                                                     |
| ClickUp Create List         | ClickUp API Node                    | Creates project list in ClickUp                   | Structured Output Parser1           | Clickup Project Task Generator        | ## Create List Configuration: Update ClickUp credentials with yours.                                |
| Clickup Project Task Generator | Chain LLM                        | AI generates Agile tasks and subtasks             | ClickUp Create List                 | Split Out                           |                                                                                                     |
| Structured Output Parser    | Langchain Output Parser              | Parses AI task generation output                  | Clickup Project Task Generator      | Split Out                           |                                                                                                     |
| Split Out                  | Split Out                           | Splits task array into individual tasks           | Structured Output Parser            | Limit                              |                                                                                                     |
| Limit                      | Limit                               | Limits number of tasks processed                   | Split Out                         | Loop Over Items                    |                                                                                                     |
| Loop Over Items            | Split in Batches                    | Iterates over main tasks batch-wise                | Limit                             | Aggregate, ClickUp Create Task      |                                                                                                     |
| ClickUp Create Task        | ClickUp API Node                    | Creates main ClickUp tasks                          | Loop Over Items                   | Edit Fields, Merge                 |                                                                                                     |
| Edit Fields                | Set Node                            | Extracts sub_tasks from task JSON                   | ClickUp Create Task               | Split Out1                        |                                                                                                     |
| Split Out1                 | Split Out                           | Splits subtasks array into individual sub-tasks    | Edit Fields                      | Merge                             |                                                                                                     |
| Merge                      | Merge Node                         | Combines sub-task and task info for sub-workflow   | Split Out1, ClickUp Create Task   | Execute Workflow                  |                                                                                                     |
| Execute Workflow           | Execute Workflow                   | Invokes sub-workflow for sub-task creation         | Merge                            | Loop Over Items                   |                                                                                                     |
| When Executed by Another Workflow | Execute Workflow Trigger     | Entry point for sub-workflow creating sub-tasks    | Execute Workflow                 | Loop Over Items1                  | ## Sub-task creator workflow                                                                        |
| Loop Over Items1           | Split in Batches                   | Processes sub-tasks batch-wise                       | When Executed by Another Workflow | ClickUp Create Sub-Task           |                                                                                                     |
| ClickUp Create Sub-Task    | ClickUp API Node                  | Creates sub-tasks in ClickUp                         | Loop Over Items1                 | Loop Over Items1                 |                                                                                                     |
| Aggregate                  | Aggregate                         | Aggregates data for notification                     | Loop Over Items                  | Gmail                           |                                                                                                     |
| Gmail                      | Gmail Node                       | Sends email notification of project creation        | Aggregate                       | None                            | ## Gmail - Send Notification You can adjust subject & body here. Update recipient email accordingly. |
| Sticky Notes (various)     | Sticky Note                      | Documentation and configuration notes               | N/A                              | N/A                             | Multiple notes with setup instructions, process overview, contact info, and reminders.              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**

   - Create a **Manual Trigger** node named "When clicking ‘Test workflow’" for testing purposes.
   - Create a **Form Trigger** node named "On form submission" with:
     - Form Title: "Jira Full Project Generator"
     - Fields:
       - Project Name (required)
       - Project Full Features (textarea, required)
   - Configure webhook and enable.

2. **Add OpenAI Chat Model Node:**

   - Add a **Langchain OpenAI Chat Model** node named "OpenAI Chat Model".
   - Set model to "gpt-5-mini".
   - Set credentials with your OpenAI API key.

3. **Create Project Naming Node:**

   - Add a **Chain LLM** node named "Project Naming".
   - Set prompt type to "define".
   - Use the detailed prompt that cleans project name, creates concise description, and generates a random 5-letter uppercase Jira key.
   - Use expressions to inject inputs:  
     - `{{ $json['Project Name'] }}`  
     - `{{ $json['Project Full Features'] }}`  
   - Connect the node's AI input to "OpenAI Chat Model".
   - Enable output parser.

4. **Add Structured Output Parser1:**

   - Add a **Structured Output Parser** node.
   - Use JSON schema with fields: project_name, project_description, project_key.
   - Connect the output parser of "Project Naming" node to this parser.

5. **Create ClickUp Create List Node:**

   - Add a **ClickUp** node named "ClickUp Create List".
   - Set resource: list, operation: create, folderless: true.
   - For List Name, use expression: `{{ $json.output.project_name }}`.
   - Set team and space IDs as per your ClickUp workspace.
   - Configure ClickUp API credentials.

6. **Create Clickup Project Task Generator Node:**

   - Add a **Chain LLM** node named "Clickup Project Task Generator".
   - Use prompt requesting Agile user story tasks and subtasks in JSON array format.
   - Inject inputs for Project Name and Full Features from either the manual trigger or form submission node (match your data source).
   - Connect AI input to "OpenAI Chat Model".
   - Enable output parser.

7. **Add Structured Output Parser for Tasks:**

   - Add a **Structured Output Parser** node.
   - Parse AI JSON array of tasks.
   - Connect from "Clickup Project Task Generator".

8. **Split Tasks and Process in Batches:**

   - Add **Split Out** node to split tasks array.
   - Add **Limit** node (optional) to limit number of tasks processed.
   - Add **Split In Batches** node named "Loop Over Items".
   - Connect nodes in sequence: Structured Output Parser → Split Out → Limit → Loop Over Items.

9. **Create ClickUp Main Tasks:**

   - Add **ClickUp Create Task** node.
   - Configure to create tasks under the list created earlier.
   - Use task_title and description fields from Loop Over Items.
   - Connect Loop Over Items output to this node.

10. **Extract and Split Sub-tasks:**

    - Add a **Set** node "Edit Fields" to assign sub_tasks array from current task JSON.
    - Add **Split Out** node "Split Out1" to split sub_tasks into individual items.
    - Connect "ClickUp Create Task" → "Edit Fields" → "Split Out1".

11. **Merge and Trigger Sub-workflow for Sub-task Creation:**

    - Add a **Merge** node to combine sub-task data with parent task info.
    - Add **Execute Workflow** node.
      - Configure to call the sub-workflow for sub-task creation.
      - Map inputs: list_id, task_id, subtask_title, subtask_description.
    - Connect Split Out1 and ClickUp Create Task outputs to Merge, then Merge to Execute Workflow.

12. **Create Sub-workflow for Sub-task Creation:**

    - Create new workflow with:
      - Trigger: Execute Workflow Trigger ("When Executed by Another Workflow")
      - Add **Split In Batches** node "Loop Over Items1"
      - Add **ClickUp Create Sub-Task** node
        - Configure to create sub-task under parent task using provided inputs.
      - Connect nodes as: Trigger → Loop Over Items1 → ClickUp Create Sub-Task.

13. **Aggregate and Send Email Notification:**

    - Add **Aggregate** node to collect task creation results.
    - Add **Gmail** node:
      - Configure recipient email (update from default placeholder).
      - Set subject and body to include project name, list ID, and ClickUp link.
      - Configure Gmail OAuth2 credentials.
    - Connect Loop Over Items → Aggregate → Gmail.

14. **Add Sticky Notes:**

    - Add sticky notes for documentation, contact info, setup instructions, and process overview as per original workflow.

15. **Test Workflow:**

    - Use manual trigger or submit form to test entire flow.
    - Verify ClickUp list, tasks, subtasks creation, and email notification.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                 | Context or Link                                                                                          |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Hi, I’m Billy. I help businesses build n8n workflows & AI automation projects. Contact via billychartanto@gmail.com.                                        | Contact info and n8n creator profile: [n8n.io/creators/billy](https://n8n.io/creators/billy/)          |
| Workflow overview: Captures form data, uses GPT-5 for naming and task generation, creates ClickUp lists/tasks/subtasks, sends email notification.             | Sticky Note1 in workflow                                                                              |
| Setup Required: Update Gmail recipient, ClickUp team/space IDs, OpenAI/ClickUp/Gmail credentials, and sub-workflow references accordingly.                   | Sticky Note2                                                                                          |
| Gmail node note: Adjust subject, body, and recipient email as needed for notifications.                                                                        | Sticky Note6                                                                                          |
| Sub-task creator workflow is a separate workflow triggered to create subtasks under parent tasks in ClickUp.                                                 | Sticky Note9                                                                                          |
| Project List creation requires valid ClickUp API credentials and workspace information (team and space IDs).                                                 | Sticky Note3                                                                                          |
| This template uses GPT-5 model variant "gpt-5-mini" via Langchain nodes; ensure OpenAI API access is enabled and credentials are valid.                      | General note from AI nodes                                                                             |
| The workflow uses Agile best practices for task formatting: "As a [user], I want to [goal], so that [benefit]" with detailed but concise descriptions.         | Task generation prompt                                                                                 |
| For best results, verify API rate limits and error handling for OpenAI, ClickUp, and Gmail integrations in your environment.                                 | General integration note                                                                               |

---

**Disclaimer:**  
The text provided is generated exclusively from an automated workflow created with n8n, respecting all current content policies and containing no illegal, offensive, or protected elements. All data processed is legal and public.