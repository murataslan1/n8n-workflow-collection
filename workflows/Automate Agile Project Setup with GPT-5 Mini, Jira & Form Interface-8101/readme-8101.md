Automate Agile Project Setup with GPT-5 Mini, Jira & Form Interface

https://n8nworkflows.xyz/workflows/automate-agile-project-setup-with-gpt-5-mini--jira---form-interface-8101


# Automate Agile Project Setup with GPT-5 Mini, Jira & Form Interface

### 1. Workflow Overview

This workflow automates the setup of an Agile software project in Jira using AI-powered enhancements and a user-friendly form interface. It targets Agile project managers and developers who want to streamline project initialization by generating professional project names, detailed user stories, subtasks, and configuring Jira projects automatically. The workflow also sends email notifications upon successful project creation.

Logical blocks:

- **1.1 Input Reception**: Captures project details via a manual trigger or a web form.
- **1.2 AI-Powered Project Naming**: Uses GPT-5 Mini to generate a polished project name, description, and a unique Jira project key.
- **1.3 Jira Project Creation**: Checks for project key uniqueness and creates a new Jira project with a Scrum software template.
- **1.4 AI-Driven User Story & Subtask Generation**: Generates detailed, structured user stories and subtasks following Agile best practices.
- **1.5 Jira Issue Types Retrieval and Mapping**: Retrieves Jira project metadata to map story and subtask issue types.
- **1.6 Jira Issue Creation**: Creates Jira stories and triggers a sub-workflow to create associated subtasks.
- **1.7 Notification and Completion**: Sends a notification email summarizing the created project with links.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
Collects raw project input either via a manual test trigger or a web form with fields for project name and detailed features.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- On form submission (Form Trigger)

**Node Details:**  

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Entry point for manual testing, allows triggering with sample data.  
  - Config: No parameters; provides sample input data for downstream nodes.  
  - Inputs: None  
  - Outputs: Connected to Project Naming node  
  - Edge cases: No input data if triggered without preset sample; manual trigger only for testing.

- **On form submission**  
  - Type: Form Trigger (Webhook)  
  - Role: Entry point to capture user-submitted project name and feature descriptions via a web form titled "Jira Full Project Generator".  
  - Configuration: Two required fields - "Project Name" (text), "Project Full Features" (textarea).  
  - Inputs: HTTP webhook request from form submission  
  - Outputs: Connected to Project Naming node  
  - Edge cases: Missing required fields will block submission; webhook must be exposed publicly; concurrency issues if multiple submissions at once.

---

#### 2.2 AI-Powered Project Naming

**Overview:**  
Transforms the raw input project name and features into a professional project name, concise descriptive paragraph, and generates a random 5-letter uppercase Jira project key. Parses AI output into structured JSON.

**Nodes Involved:**  
- OpenAI Chat Model  
- Project Naming (Langchain Chain LLM)  
- Structured Output Parser1  
- Set Jira URL

**Node Details:**  

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat Model  
  - Role: Provides GPT-5 Mini model for natural language processing tasks.  
  - Configuration: Model set to "gpt-5-mini", default options, uses OpenAI API credentials.  
  - Inputs: Receives prompt text from Project Naming node.  
  - Outputs: Feeds into Project Naming for language model execution.  
  - Edge cases: API limits, authentication errors, model latency, invalid prompt inputs.

- **Project Naming**  
  - Type: Langchain Chain LLM (Prompt + Output Parser)  
  - Role: Sends prompt to AI to clean and enhance project name and description, generate project key.  
  - Configuration: Custom prompt instructing to produce JSON with fields: project_name, project_description, project_key.  
  - Key expressions: Uses raw inputs from trigger nodes with expressions (e.g., `{{ $json['Project Name'] }}`)  
  - Inputs: Raw project name and description from form/manual trigger  
  - Outputs: JSON with cleaned project info, connected to Structured Output Parser1  
  - Edge cases: Malformed AI output, missing fields, rate limits, incomplete responses.

- **Structured Output Parser1**  
  - Type: Langchain Structured Output Parser  
  - Role: Validates and parses AI JSON output into usable JSON object for downstream nodes.  
  - Configuration: JSON schema example defining required fields project_name, project_description, project_key.  
  - Inputs: Raw AI response from Project Naming  
  - Outputs: Parsed JSON to Set Jira URL node  
  - Edge cases: Parsing failures if AI output does not match schema.

- **Set Jira URL**  
  - Type: Set Node  
  - Role: Assigns the Jira instance URL as a static value for reuse in HTTP requests.  
  - Configuration: Hardcoded Jira URL string.  
  - Inputs: Parsed project details  
  - Outputs: Proceeds to check project key uniqueness  
  - Edge cases: Jira URL must be updated to user’s Jira instance.

---

#### 2.3 Jira Project Creation

**Overview:**  
Validates uniqueness of the generated Jira project key, then creates a new Jira software project using the Scrum template, assigning project lead and description.

**Nodes Involved:**  
- Check Project Key & Get Status ID (HTTP Request)  
- Create Project (HTTP Request)  
- Get Status ID (HTTP Request)  
- Split Out4 (SplitOut)  
- Filter (Filter)  
- Filter1 (Filter)  
- Limit2, Limit3 (Limit)  
- Jira Story Status ID (Set)  
- Jira Sub-task Status ID (Set)  
- Jira Issue ID (Merge)  

**Node Details:**  

- **Check Project Key & Get Status ID**  
  - Type: HTTP Request  
  - Role: Checks if the project key already exists in Jira by querying project info.  
  - Configuration: GET request to Jira REST API with project key from previous block.  
  - Inputs: Jira URL and project_key JSON value  
  - Outputs: On error, continues workflow (onError: continueRegularOutput) to allow project creation if key not found.  
  - Edge cases: HTTP 404 means key available; other errors may indicate issues.

- **Create Project**  
  - Type: HTTP Request  
  - Role: POST request to Jira API to create new project.  
  - Configuration: JSON body includes key, name, project type (software), Scrum template, description, project lead account ID, and assignee type.  
  - Inputs: Validated project key and name from structured data  
  - Outputs: Passes created project details to Get Status ID  
  - Edge cases: Jira permission errors, invalid lead account ID, duplicate key, network errors.

- **Get Status ID**  
  - Type: HTTP Request  
  - Role: Retrieves detailed project information including available issue types (story, subtask).  
  - Configuration: GET request to Jira API project endpoint using created project ID.  
  - Inputs: Created project JSON  
  - Outputs: Passes project info to Split Out4  
  - Edge cases: API failure if project creation failed.

- **Split Out4**  
  - Type: SplitOut  
  - Role: Extracts 'issueTypes' array from project metadata for filtering.  
  - Inputs: Project JSON with issueTypes array  
  - Outputs: Two branches filtered by issue type name "Story" and "Subtask" respectively.

- **Filter (For Stories)**  
  - Type: Filter  
  - Role: Selects issue type named "Story".  
  - Outputs: Passes filtered story issue type to Limit2.

- **Filter1 (For Subtasks)**  
  - Type: Filter  
  - Role: Selects issue type named "Subtask".  
  - Outputs: Passes filtered subtask issue type to Limit3.

- **Limit2 & Limit3**  
  - Type: Limit  
  - Role: Limits to one result each, for story and subtask issue type IDs.  
  - Outputs: Sets respective issue IDs in Jira Story Status ID and Jira Sub-task Status ID.

- **Jira Story Status ID & Jira Sub-task Status ID**  
  - Type: Set  
  - Role: Assigns filtered issue type IDs to variables "story id" and "task id" respectively for creating issues.

- **Jira Issue ID**  
  - Type: Merge  
  - Role: Combines story and subtask issue type IDs for use in the next AI story generation block.

---

#### 2.4 AI-Driven User Story & Subtask Generation

**Overview:**  
Uses AI to generate detailed user stories and subtasks in JSON format from the original project input, ready for Jira ticket creation.

**Nodes Involved:**  
- Jira Story Generator (Langchain Chain LLM)  
- Structured Output Parser (Langchain Structured Output Parser)  
- Split Out (SplitOut)  
- Limit  
- Loop Over Items  
- Set Array Sub Tasks

**Node Details:**  

- **Jira Story Generator**  
  - Type: Langchain Chain LLM (Prompt + Output Parser)  
  - Role: Sends a prompt to GPT-5 Mini to generate a list of user stories with sub-tasks adhering to Agile best practices.  
  - Configuration: Custom detailed prompt requesting stories as JSON array with fields: story_title, story_description, epic, and sub_tasks (title, description).  
  - Inputs: Raw project name and feature description from manual trigger node via expressions.  
  - Outputs: AI JSON response passed to Structured Output Parser.  
  - Edge cases: AI output format errors, incomplete data, token limits.

- **Structured Output Parser**  
  - Type: Langchain Structured Output Parser  
  - Role: Validates and parses AI JSON output into structured objects.  
  - Configuration: JSON example schema showing array of stories with sub_tasks.  
  - Inputs: Raw AI response from Jira Story Generator node  
  - Outputs: Passes stories array to Split Out.

- **Split Out**  
  - Type: SplitOut  
  - Role: Splits array of stories into individual items for processing.  
  - Outputs: Connects to Limit node.

- **Limit**  
  - Type: Limit  
  - Role: Controls flow of story items processed in batches (default limit).  
  - Outputs: Connects to Loop Over Items.

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Role: Iterates over each user story for sequential processing.  
  - Outputs: Two branches — one creates Jira Story, the other aggregates results.

- **Set Array Sub Tasks**  
  - Type: Set  
  - Role: Extracts sub_tasks array from current story JSON for subtask creation.  
  - Inputs: Current story JSON from Loop Over Items  
  - Outputs: Connects to Split Out1 to split subtasks.

---

#### 2.5 Jira Issue Creation & Subtask Workflow Execution

**Overview:**  
Creates Jira stories and for each story, triggers a sub-workflow to create all associated subtasks.

**Nodes Involved:**  
- Create Story (Jira node)  
- Split Out1 (SplitOut)  
- Limit (on subtasks)  
- Execute Sub-task creator Workflow (ExecuteWorkflow)  
- Loop Over Items1 (splitInBatches for subtasks)  
- Create Sub Task (Jira node)  
- When Executed by Another Workflow (ExecuteWorkflowTrigger)  

**Node Details:**  

- **Create Story**  
  - Type: Jira node  
  - Role: Creates a Jira story issue with summary, description, assigned issue type "Story", and project ID.  
  - Config: Uses project ID and story id issue type from previous nodes; summary and description from AI-generated story_title and story_description.  
  - Inputs: Iterated story item from Loop Over Items  
  - Outputs: Passes sub_tasks array to Set Array Sub Tasks and merges with created story info.  
  - Edge cases: Jira permission errors, invalid project or issue type IDs.

- **Split Out1**  
  - Type: SplitOut  
  - Role: Splits sub_tasks array for the current story into individual subtasks.

- **Limit (on subtasks)**  
  - Controls batch size for subtask processing.

- **Execute Sub-task creator Workflow**  
  - Type: Execute Workflow  
  - Role: Runs a dedicated sub-workflow to create all subtasks for the current story.  
  - Inputs: Passes keys such as story_id, project_id, subtask_title, subtask_description, subtask_type.  
  - Configuration: Workflow ID points to separate Jira Project Generator Template workflow (sub-workflow).  
  - Edge cases: Sub-workflow failure, parameter mapping errors.

- **Loop Over Items1**  
  - Type: SplitInBatches  
  - Role: Iterates over subtasks passed from sub-workflow trigger.

- **Create Sub Task**  
  - Type: Jira node  
  - Role: Creates Jira subtask issues linked to parent story.  
  - Config: Uses project ID, subtask issue type, summary, description, and parent issue key.  
  - Inputs: Subtask data from Loop Over Items1  
  - Outputs: None (end of subtask creation).  
  - Edge cases: Jira permission errors, invalid parent issue key, rate limits.

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Entry point for the sub-workflow creating subtasks.  
  - Inputs: Expects parameters like story_id, key, subtask_title, subtask_description, project_id, subtask_type.  
  - Outputs: Passes subtasks to Loop Over Items1 for creation.

---

#### 2.6 Notification and Completion

**Overview:**  
Aggregates completion data and sends an email notification with project details and direct Jira links.

**Nodes Involved:**  
- Aggregate  
- Gmail - Send Notification

**Node Details:**  

- **Aggregate**  
  - Type: Aggregate  
  - Role: Collects data from created stories and subtasks for summary.  
  - Inputs: From Loop Over Items (story creation branch)  
  - Outputs: Connects to Gmail node.

- **Gmail - Send Notification**  
  - Type: Gmail node  
  - Role: Sends an email notification to configured recipient with project name, ID, key, and Jira project link.  
  - Configuration: Email subject and body customizable; recipient email must be updated by user.  
  - Inputs: Aggregated project and story data  
  - Credentials: Gmail OAuth2 credentials required.  
  - Edge cases: Email send failures, invalid recipient address, OAuth token expiry.

---

### 3. Summary Table

| Node Name                       | Node Type                      | Functional Role                           | Input Node(s)                         | Output Node(s)                         | Sticky Note                                                                                                                           |
|--------------------------------|--------------------------------|-----------------------------------------|-------------------------------------|---------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’   | Manual Trigger                 | Manual test trigger for input data      | None                                | Project Naming                        |                                                                                                                                        |
| On form submission             | Form Trigger                  | Web form input trigger                   | None                                | Project Naming                        |                                                                                                                                        |
| OpenAI Chat Model              | Langchain OpenAI Chat Model    | Provides GPT-5 Mini model for AI tasks  | Project Naming                      | Project Naming, Jira Story Generator |                                                                                                                                        |
| Project Naming                 | Langchain Chain LLM            | AI cleans/enhances project name & key   | On form submission, Manual Trigger  | Structured Output Parser1             |                                                                                                                                        |
| Structured Output Parser1      | Langchain Output Parser        | Parses AI JSON output for project naming| Project Naming                     | Set Jira URL                         |                                                                                                                                        |
| Set Jira URL                  | Set                           | Sets Jira instance URL                   | Structured Output Parser1            | Check Project Key & Get Status ID     | Update the Jira URL with your Jira instance URL (example: https://testproject.atlassian.net)                                            |
| Check Project Key & Get Status ID | HTTP Request               | Checks project key uniqueness in Jira   | Set Jira URL                       | Create Project                       |                                                                                                                                        |
| Create Project                | HTTP Request                  | Creates Jira project                     | Check Project Key & Get Status ID    | Get Status ID                       | Update the Jira credentials with yours.                                                                                              |
| Get Status ID                | HTTP Request                  | Retrieves project metadata               | Create Project                    | Split Out4                          |                                                                                                                                        |
| Split Out4                   | SplitOut                      | Splits issueTypes array                  | Get Status ID                     | Filter, Filter1                     |                                                                                                                                        |
| Filter                      | Filter                         | Filters issue types for "Story"          | Split Out4                      | Limit2                            |                                                                                                                                        |
| Filter1                     | Filter                         | Filters issue types for "Subtask"        | Split Out4                      | Limit3                            |                                                                                                                                        |
| Limit2                      | Limit                          | Limits to one story issue type           | Filter                          | Jira Story Status ID              |                                                                                                                                        |
| Limit3                      | Limit                          | Limits to one subtask issue type         | Filter1                         | Jira Sub-task Status ID          |                                                                                                                                        |
| Jira Story Status ID         | Set                            | Stores story issue type ID                | Limit2                          | Jira Issue ID                    |                                                                                                                                        |
| Jira Sub-task Status ID      | Set                            | Stores subtask issue type ID              | Limit3                          | Jira Issue ID                    |                                                                                                                                        |
| Jira Issue ID               | Merge                         | Merges story and subtask issue type IDs | Jira Story Status ID, Jira Sub-task Status ID | Jira Story Generator          |                                                                                                                                        |
| Jira Story Generator         | Langchain Chain LLM            | AI generates user stories & subtasks     | OpenAI Chat Model, Jira Issue ID  | Structured Output Parser           | This is where the story is generated. You can adjust the model & prompt based on your use case.                                        |
| Structured Output Parser     | Langchain Output Parser        | Parses AI JSON output for stories        | Jira Story Generator             | Split Out                        |                                                                                                                                        |
| Split Out                   | SplitOut                      | Splits stories array into individual items | Structured Output Parser        | Limit                           |                                                                                                                                        |
| Limit                       | Limit                          | Controls batch size of stories            | Split Out                      | Loop Over Items                 |                                                                                                                                        |
| Loop Over Items             | SplitInBatches                | Iterates over user stories                | Limit                         | Aggregate, Create Story          |                                                                                                                                        |
| Set Array Sub Tasks         | Set                            | Extracts subtasks array from story JSON  | Loop Over Items                | Split Out1                     |                                                                                                                                        |
| Split Out1                 | SplitOut                      | Splits subtasks array into individual items | Set Array Sub Tasks            | Limit3 (on subtasks)            |                                                                                                                                        |
| Create Story               | Jira                         | Creates Jira story issues                  | Loop Over Items                | Set Array Sub Tasks, Merge       |                                                                                                                                        |
| Execute Sub-task creator Workflow | Execute Workflow           | Calls sub-workflow to create subtasks     | Loop Over Items                | None                           | Sub-task creator workflow                                                                                                             |
| Loop Over Items1           | SplitInBatches                | Iterates over subtasks in sub-workflow    | When Executed by Another Workflow | Create Sub Task                |                                                                                                                                        |
| Create Sub Task            | Jira                         | Creates Jira subtasks                       | Loop Over Items1               | None                           |                                                                                                                                        |
| When Executed by Another Workflow | Execute Workflow Trigger    | Entry point of sub-task creation workflow | None                           | Loop Over Items1               |                                                                                                                                        |
| Aggregate                 | Aggregate                    | Collects data for notification            | Loop Over Items                | Gmail - Send Notification      |                                                                                                                                        |
| Gmail - Send Notification | Gmail                        | Sends completion email notification        | Aggregate                    | None                           | You can adjust the subject & body of the notification here. Also, update the recipient email.                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Input Nodes**  
   - Add a **Manual Trigger** node named "When clicking ‘Test workflow’" for manual test inputs.  
   - Add a **Form Trigger** node named "On form submission" with webhook enabled. Configure form fields:  
     - "Project Name" (required text)  
     - "Project Full Features" (required textarea)

2. **Add OpenAI Chat Model Node**  
   - Add Langchain OpenAI Chat Model node named "OpenAI Chat Model".  
   - Configure with credential using OpenAI API key.  
   - Set model to "gpt-5-mini".

3. **Add Project Naming Node (Langchain Chain LLM)**  
   - Add node "Project Naming".  
   - Set prompt to instruct AI to generate a cleaned project name, description, and random 5-letter uppercase project key in JSON format.  
   - Use expressions to pass "Project Name" and "Project Full Features" fields from input triggers.  
   - Enable output parser.

4. **Add Structured Output Parser1**  
   - Add Langchain Structured Output Parser node named "Structured Output Parser1".  
   - Provide JSON schema example with "project_name", "project_description", and "project_key".  
   - Connect output of "Project Naming" to this node.

5. **Add Set Jira URL Node**  
   - Add Set node "Set Jira URL".  
   - Assign your Jira instance URL as a string variable (e.g., https://yourcompany.atlassian.net).

6. **Add Check Project Key & Get Status ID HTTP Request Node**  
   - Add HTTP Request node "Check Project Key & Get Status ID".  
   - Set method to GET.  
   - URL: `https://your_jira_url/rest/api/3/project/{{ $json['project_key'] }}` replacing with expression to project_key.  
   - Use Jira Software Cloud API credentials.  
   - Set onError to "continueRegularOutput" to allow continuation if key not found.

7. **Add Create Project HTTP Request Node**  
   - Add HTTP Request node "Create Project".  
   - Method: POST, URL: `https://your_jira_url/rest/api/3/project`  
   - JSON body including:  
     - key: from parsed project_key  
     - name: from parsed project_name  
     - projectTypeKey: "software"  
     - projectTemplateKey: "com.pyxis.greenhopper.jira:gh-simplified-agility-scrum"  
     - description: "Project created via n8n" or parsed description  
     - leadAccountId: Jira user ID for project lead (update accordingly)  
     - assigneeType: "PROJECT_LEAD"  
   - Use Jira Software Cloud API credentials.

8. **Add Get Status ID HTTP Request Node**  
   - Add HTTP Request node "Get Status ID".  
   - Method: GET, URL: `https://your_jira_url/rest/api/3/project/{{ $json.id }}`  
   - Use Jira credentials.

9. **Add Split Out4 Node**  
   - Add SplitOut node "Split Out4" to split issueTypes array from project info.

10. **Add Filter Nodes**  
    - Add Filter node "Filter" for issueTypes with name equals "Story".  
    - Add Filter node "Filter1" for issueTypes with name equals "Subtask".

11. **Add Limit Nodes**  
    - Add Limit nodes "Limit2" and "Limit3" to limit filtered story and subtask issue types to one.

12. **Add Jira Story Status ID and Jira Sub-task Status ID Set Nodes**  
    - Add Set nodes to assign story and subtask issue type IDs respectively.

13. **Add Jira Issue ID Merge Node**  
    - Merge the outputs of Set nodes to provide combined issue IDs.

14. **Add Jira Story Generator Node (Langchain Chain LLM)**  
    - Add Langchain Chain LLM node "Jira Story Generator".  
    - Use prompt to instruct GPT-5 to generate Agile user stories and subtasks in JSON array format.  
    - Input raw project name and features from initial trigger nodes.

15. **Add Structured Output Parser Node**  
    - Add Langchain Structured Output Parser node "Structured Output Parser".  
    - Provide example JSON schema for stories and subtasks.

16. **Add Split Out Node**  
    - Split out user stories array individually.

17. **Add Limit Node**  
    - Add Limit node to control batch size.

18. **Add Loop Over Items Node**  
    - Add SplitInBatches node to iterate over stories.

19. **Add Create Story Jira Node**  
    - Add Jira node "Create Story".  
    - Configure with project ID, story issue type ID, summary, description from AI-generated story data.

20. **Add Set Array Sub Tasks Node**  
    - Set node to extract sub_tasks array from each story.

21. **Add Split Out1 Node**  
    - Split subtasks array for each story.

22. **Add Execute Sub-task creator Workflow Node**  
    - Add Execute Workflow node to call sub-workflow for subtask creation.  
    - Map inputs: story_id, project_id, subtask_title, subtask_description, subtask_type, key.

23. **Sub-workflow Setup:**  
    - Create a workflow triggered by "Execute Workflow Trigger" node named "When Executed by Another Workflow".  
    - Input parameters: story_id, key, subtask_title, subtask_description, project_id, subtask_type.  
    - Add SplitInBatches node "Loop Over Items1" to iterate subtasks.  
    - Add Jira node "Create Sub Task" to create each subtask linked to parent story.

24. **Add Aggregate Node**  
    - Aggregate node to gather creation results.

25. **Add Gmail - Send Notification Node**  
    - Add Gmail node to send notification email.  
    - Configure recipient email, subject, and message body with project details and Jira links.  
    - Use Gmail OAuth2 credentials.

26. **Wire connections following the workflow logic** as detailed in the overview and block sections, ensuring correct input-output flow.

27. **Update all placeholders:**  
    - Jira instance URL in Set Jira URL node.  
    - Jira credentials in HTTP Request and Jira nodes.  
    - Jira lead account ID in project creation node.  
    - Recipient email in Gmail node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                              | Context or Link                                                 |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| Hi, I’m Billy. I help businesses build n8n workflows & AI automation projects. Contact me at billychartanto@gmail.com. Check my n8n creator profile: https://n8n.io/creators/billy and projects: https://www.billychristi.com/n8n          | Workflow author contact & credits                               |
| SETUP REQUIRED: Configure Jira instance URL, update email address, modify user account ID for project lead, adjust JSON schema examples, and provide required credentials (Jira Software Cloud API, OpenAI API Key, Gmail OAuth2).          | Workflow setup instructions                                     |
| This workflow accepts inputs via web form or manual trigger, uses GPT-5 to generate project naming and Agile user stories with subtasks, creates Jira project and issues, and sends email notifications upon completion.                | Workflow process overview                                       |
| Jira Project Generator & Story Creator with Form Interface using GPT-5. Supports Scrum template and Agile best practices.                                                                                                               | High-level workflow description                                |
| Jira Ticket Generator section is customizable to adapt prompt and model for your use case.                                                                                                                                               | AI prompt customization note                                   |
| Gmail notification node’s subject, body, and recipient email can be customized as needed.                                                                                                                                                 | Email notification customization note                          |
| Jira URL must be updated to your actual Jira instance URL (example: https://testproject.atlassian.net)                                                                                                                                    | Jira instance URL update instruction                           |
| Sub-task creator workflow is a separate workflow triggered within this main workflow to handle creation of Jira subtasks linked to stories.                                                                                            | Sub-workflow explanation                                       |

---

This document provides a full, detailed understanding of the "Automate Agile Project Setup with GPT-5 Mini, Jira & Form Interface" workflow, enabling reproduction, modification, and integration with Jira and OpenAI systems.