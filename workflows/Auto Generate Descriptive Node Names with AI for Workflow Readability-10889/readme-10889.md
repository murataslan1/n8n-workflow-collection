Auto Generate Descriptive Node Names with AI for Workflow Readability

https://n8nworkflows.xyz/workflows/auto-generate-descriptive-node-names-with-ai-for-workflow-readability-10889


# Auto Generate Descriptive Node Names with AI for Workflow Readability

### 1. Workflow Overview

This workflow automates the process of generating descriptive and clear node names for any given n8n workflow using AI, significantly improving workflow readability and maintainability. It is designed primarily for users who manage complex or copied workflows with generic or unclear node names, enabling them to rename every node uniquely based on its type, parameters, and connections.

The workflow is logically divided into the following blocks:

- **1.1 Trigger Input**: Accepts user input to select the target workflow either via a form trigger (dropdown selection) or manual trigger (direct workflow selection).
- **1.2 Fetch & Extract Workflow Data**: Retrieves the full JSON of the selected workflow and extracts its nodes and connections into a clean structure for processing.
- **1.3 AI Rename Generation**: Sends the extracted workflow JSON to an AI language model to generate a mapping of old node names to new descriptive names.
- **1.4 Validation and Application**: Validates that the AI output covers all nodes, then applies the new names to nodes, connections, and parameter references.
- **1.5 Save & Feedback**: Saves the updated workflow version, generates links to both new and previous versions, and displays results to the user.
- **1.6 Error Handling**: Stops execution with an error message if validation fails, prompting manual intervention or retry.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger Input

**Overview:**  
This block initiates the workflow execution, allowing a user to select which workflow to rename nodes for. It supports two entry points: a form-based selection for user-friendly input, and a manual trigger for quick testing.

**Nodes Involved:**  
- Form Trigger  
- Manual Trigger  
- Fetch All Workflows  
- Aggregate Workflow List  
- Form Dynamic Workflow List  
- Select a Workflow  
- Parse Selected Workflow Id  
- Set Target Workflow Id  

**Node Details:**

- **Form Trigger**  
  - Type: Form Trigger  
  - Role: Presents a form to the user with a dropdown to select a workflow.  
  - Configuration: Custom form title and description explaining the workflow.  
  - Outputs: Triggers next nodes on form submission.  
  - Edge Cases: User cancelling or timeout on form input.

- **Manual Trigger**  
  - Type: Manual Trigger  
  - Role: Allows direct execution for testing with pre-selected workflow.  
  - Outputs: Triggers next nodes immediately on manual start.  

- **Fetch All Workflows**  
  - Type: n8n node to list workflows  
  - Role: Retrieves all workflows from n8n instance to populate selection dropdown.  
  - Credentials: Requires n8n API account credentials.  
  - Edge Cases: API access errors, network failures.

- **Aggregate Workflow List**  
  - Type: Aggregate  
  - Role: Aggregates workflow IDs and names into a single array for the dropdown.  
  - Input: List of workflows from previous node.  
  - Output: Aggregated list named `workflows`.

- **Form Dynamic Workflow List**  
  - Type: Form  
  - Role: Dynamically builds a dropdown form field from aggregated workflows.  
  - Configuration: JSON defines dropdown options for workflows with label as "`name (#id)`".  
  - Outputs: User selection as JSON.

- **Select a Workflow**  
  - Type: n8n API node (get workflow)  
  - Role: Fetches the full JSON of the selected workflow by ID.  
  - Credentials: n8n API account.  
  - Input: Workflow ID parsed from form or manual trigger.  
  - Output: Full workflow JSON.

- **Parse Selected Workflow Id**  
  - Type: Set node  
  - Role: Extracts workflow ID string from dropdown selection text using regex.  
  - Output: Sets `id` field with workflow ID for further use.

- **Set Target Workflow Id**  
  - Type: Set node  
  - Role: Assigns workflow ID into `workflow_id` field, preparing for fetch node.  

---

#### 1.2 Fetch & Extract Workflow Data

**Overview:**  
Fetches the full workflow JSON and extracts its nodes and connections, preparing a clean and simplified object for AI processing.

**Nodes Involved:**  
- Fetch Target Workflow JSON  
- Extract Workflow Nodes Connections  

**Node Details:**

- **Fetch Target Workflow JSON**  
  - Type: n8n API node (get workflow)  
  - Role: Retrieves the raw JSON of the target workflow by ID.  
  - Credentials: n8n API account.  
  - Inputs: `workflow_id` from previous block.  
  - Outputs: Full workflow JSON including nodes and connections.

- **Extract Workflow Nodes Connections**  
  - Type: Set node  
  - Role: Cleans up workflow JSON by removing unnecessary fields, and extracts three key fields:  
    - `old_workflow`: full workflow JSON without pinData/shared  
    - `nodes`: array of node objects  
    - `connections`: object mapping node connections  
  - Outputs: Prepared data for AI processing.

---

#### 1.3 AI Rename Generation

**Overview:**  
Sends the extracted workflow JSON to an AI language model (OpenRouter GPT) for generating a unique, descriptive name mapping for every node.

**Nodes Involved:**  
- Generate Node Rename Mapping  
- Parse LLM Mapping ToJson  

**Node Details:**

- **Generate Node Rename Mapping**  
  - Type: Langchain LLM Chain node  
  - Role: Sends the workflow JSON to the AI with instructions to rename all nodes uniquely and descriptively.  
  - Prompt:  
    - System message instructs to rename nodes based on type, parameters, and connections.  
    - Constraints: max 5 words, title case, uniqueness, technical accuracy, output array must match node count.  
  - Inputs: `old_workflow` JSON.  
  - Outputs: Raw AI response JSON.

- **Parse LLM Mapping ToJson**  
  - Type: Langchain output parser  
  - Role: Parses the AI JSON output into a structured array of objects with `old_name` and `new_name`.  
  - Schema: Array of objects, each with required string fields `old_name` and `new_name`.  
  - Edge Cases: Parsing errors if AI output is malformed.

---

#### 1.4 Validation and Application

**Overview:**  
Validates that the AI output mapping covers all original node names exactly, then applies the new names to the nodes array, connections, and parameter references.

**Nodes Involved:**  
- Prepare LLM Validation Data  
- Validate All Nodes Renamed  
- Apply Renamed Nodes Connections  
- new_workflow_without (Set node)  
- new_connections (Set node)  
- new_nodes (Set node)  
- Assemble New Workflow Object  
- Stop (Error node)

**Node Details:**

- **Prepare LLM Validation Data**  
  - Type: Set node  
  - Role: Prepares variables for validation:  
    - `old_workflow` (original workflow JSON)  
    - `nodes_name` (array of original node names)  
    - `connections_nodes_name_reference` (array of all node names referenced in connections)  
    - `parameters_names` (array of strings representing node name references inside parameters)  
    - `AI_output` (parsed AI mapping array)  

- **Validate All Nodes Renamed**  
  - Type: If node  
  - Role: Checks if sorted list of original node names matches sorted list of old names from AI output exactly.  
  - Pass: All nodes covered → proceed  
  - Fail: Missing or extra nodes → trigger error node.

- **Apply Renamed Nodes Connections**  
  - Type: Set node  
  - Role:  
    - Maps old node names to new names in nodes array (renaming nodes).  
    - Replaces references to old node names inside parameters with new names (in all parameter fields).  
    - Updates connections object keys and targets with new node names.

- **new_workflow_without**  
  - Type: Set node  
  - Role: Creates a copy of the original workflow object without `nodes` and `connections` fields for clean merge.

- **new_connections**  
  - Type: Set node (object)  
  - Role: Constructs the updated connections object with renamed node keys and target nodes.

- **new_nodes**  
  - Type: Set node (array)  
  - Role: Constructs the updated nodes array with renamed nodes and updated parameters.

- **Assemble New Workflow Object**  
  - Type: Set node  
  - Role: Combines cleaned workflow object with updated nodes and connections to form the new workflow JSON.

- **Stop**  
  - Type: Stop and Error node  
  - Role: Stops workflow execution with error message "Validation Error" if validation fails.  
  - Edge Cases: Triggered when AI output incomplete or mismatched.

---

#### 1.5 Save & Feedback

**Overview:**  
Saves the updated workflow as a new version, generates links to new and previous versions, and displays completion links or terminates workflow.

**Nodes Involved:**  
- Save Renamed Workflow Version  
- Build Workflow Version Links  
- Check Trigger Source Type  
- Display Workflow Version Links  
- Done  

**Node Details:**

- **Save Renamed Workflow Version**  
  - Type: n8n API node (update workflow)  
  - Role: Updates the target workflow with renamed nodes and connections, creating a new version.  
  - Credentials: n8n API account.  
  - Input: New workflow JSON from previous block.  
  - Output: New version metadata including versionId.

- **Build Workflow Version Links**  
  - Type: Set node  
  - Role: Constructs URLs linking to the new workflow version and previous version in n8n UI history.  
  - Uses execution resume URL and workflow id/versionId fields.

- **Check Trigger Source Type**  
  - Type: If node  
  - Role: Determines if the workflow was triggered via form trigger or manual trigger.  
  - If form trigger: display completion form with links.  
  - Else: end workflow with done node.

- **Display Workflow Version Links**  
  - Type: Form node (completion)  
  - Role: Shows clickable links to new and previous workflow versions after completion.  
  - Webhook: Form completion webhook id.

- **Done**  
  - Type: Set node  
  - Role: Marks workflow completion with any final data included.

---

#### 1.6 Error Handling

**Overview:**  
Handles stopped executions due to validation errors.

**Nodes Involved:**  
- Stop  

**Node Details:**

- **Stop**  
  - Type: Stop and Error node  
  - Role: Stops workflow with an error message if AI output mapping validation fails.  
  - Suggestion: User can modify error handling to retry or loop back to AI node.

---

### 3. Summary Table

| Node Name                      | Node Type                          | Functional Role                                 | Input Node(s)                    | Output Node(s)                   | Sticky Note                                                                                                                              |
|--------------------------------|----------------------------------|-----------------------------------------------|---------------------------------|---------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| Form Trigger                   | Form Trigger                     | User selects workflow via form                 | -                               | Fetch All Workflows              | ## Form Trigger Launch a form where you can select from a dropdown of all available workflows.                                           |
| Manual Trigger                 | Manual Trigger                   | Manual start for quick testing                  | -                               | Select a Workflow               | ## Manual Trigger Select workflow directly from the n8n node, then execute manually for quick testing.                                  |
| Fetch All Workflows            | n8n API node (list workflows)    | Retrieves all workflows list                    | Form Trigger                   | Aggregate Workflow List          |                                                                                                                                         |
| Aggregate Workflow List        | Aggregate                       | Aggregates workflows for dropdown               | Fetch All Workflows             | Form Dynamic Workflow List       |                                                                                                                                         |
| Form Dynamic Workflow List     | Form                           | Builds form dropdown dynamically                 | Aggregate Workflow List         | Parse Selected Workflow Id       |                                                                                                                                         |
| Select a Workflow              | n8n API node (get workflow)      | Fetches full JSON of selected workflow          | Manual Trigger, Parse Selected Workflow Id | Set Target Workflow Id      | ### Select a workflow                                                                                                                    |
| Parse Selected Workflow Id     | Set                            | Extracts workflow ID from dropdown text          | Form Dynamic Workflow List      | Set Target Workflow Id           |                                                                                                                                         |
| Set Target Workflow Id         | Set                            | Sets workflow ID for fetching                     | Select a Workflow, Parse Selected Workflow Id | Fetch Target Workflow JSON   |                                                                                                                                         |
| Fetch Target Workflow JSON     | n8n API node (get workflow)      | Fetches full workflow JSON                        | Set Target Workflow Id          | Extract Workflow Nodes Connections |                                                                                                                                         |
| Extract Workflow Nodes Connections | Set                      | Extracts nodes and connections from workflow JSON | Fetch Target Workflow JSON      | Generate Node Rename Mapping     | ## Get & Prepare Workflow Get target workflow JSON, extract nodes and connections, prepare clean structure for processing.               |
| Generate Node Rename Mapping   | Langchain Chain LLM             | Sends workflow JSON to AI for rename mapping     | Extract Workflow Nodes Connections | Prepare LLM Validation Data     | ## AI Rename Generation Send workflow to the AI, generate rename mapping for every node, parse structured JSON output.                  |
| Parse LLM Mapping ToJson       | Langchain Output Parser Structured | Parses AI JSON output to structured array         | Generate Node Rename Mapping    | Prepare LLM Validation Data      |                                                                                                                                         |
| Prepare LLM Validation Data    | Set                            | Prepares variables to validate AI output          | Generate Node Rename Mapping    | Validate All Nodes Renamed       |                                                                                                                                         |
| Validate All Nodes Renamed     | If                             | Checks if AI mapping covers all nodes exactly     | Prepare LLM Validation Data     | Apply Renamed Nodes Connections / Stop | ## Validate & Apply Renames Verify all nodes are covered, update node names in nodes array, connections object, and parameter references.|
| Apply Renamed Nodes Connections| Set                            | Applies new node names to nodes, connections, parameters | Validate All Nodes Renamed (pass) | Assemble New Workflow Object   |                                                                                                                                         |
| new_workflow_without           | Set                            | Workflow object without nodes and connections     | Prepare LLM Validation Data     | Assemble New Workflow Object     |                                                                                                                                         |
| new_connections               | Set                            | Updated connections object with renamed nodes    | Prepare LLM Validation Data     | Assemble New Workflow Object     |                                                                                                                                         |
| new_nodes                    | Set                            | Updated nodes array with new names and parameters | Prepare LLM Validation Data     | Assemble New Workflow Object     |                                                                                                                                         |
| Assemble New Workflow Object   | Set                            | Combines updated nodes and connections into workflow JSON | Apply Renamed Nodes Connections | Save Renamed Workflow Version  |                                                                                                                                         |
| Save Renamed Workflow Version | n8n API node (update workflow)  | Saves updated workflow as new version             | Assemble New Workflow Object    | Build Workflow Version Links     | ## Save & Display Results Publish updated workflow version, generate history links, show completion form or end execution.              |
| Build Workflow Version Links   | Set                            | Generates URLs to new and previous workflow versions | Save Renamed Workflow Version   | Check Trigger Source Type        |                                                                                                                                         |
| Check Trigger Source Type      | If                             | Determines trigger type and routes accordingly    | Build Workflow Version Links    | Display Workflow Version Links / Done |                                                                                                                                         |
| Display Workflow Version Links | Form                           | Shows links to new and previous versions           | Check Trigger Source Type       | -                              |                                                                                                                                         |
| Done                         | Set                            | Marks end of workflow for manual trigger           | Check Trigger Source Type       | -                              |                                                                                                                                         |
| Stop                         | Stop and Error                 | Stops workflow with validation error               | Validate All Nodes Renamed (fail) | -                            | ### Stop workflow You can modify the error handling to retry or loop back to the AI node.                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**

   - Add a **Form Trigger** node. Configure with:  
     - Form Title: "⚡Auto Rename n8n Workflow Nodes with AI✨"  
     - Form Description: Brief workflow explanation.  
     - Button Label: "Select a Workflow"

   - Add a **Manual Trigger** node for quick testing.

2. **Fetch All Workflows:**

   - Add an **n8n API node** (type: n8n) configured to list all workflows (`operation: getAll`).  
   - Connect output of Form Trigger to this node.  
   - Attach your n8n API credentials.

3. **Aggregate Workflows:**

   - Add an **Aggregate** node to aggregate all workflows into a single field:  
     - Include fields: id, name  
     - Destination field: `workflows`

   - Connect output of Fetch All Workflows to this node.

4. **Build Dynamic Form:**

   - Add a **Form** node to build a dropdown list dynamically:  
     - Define form as JSON with a dropdown field labeled "Select a Workflow:"  
     - Populate dropdown options from `workflows` array aggregated previously.

   - Connect output of Aggregate node to Form node.

5. **Parse Selected Workflow ID:**

   - Add a **Set** node to extract workflow ID from the dropdown string using regex:  
     - Assign `id = {{ $json["Select a Workflow:"].match(/\(#([^)]+)\)/)[1] }}`

   - Connect output of Form node to this node.

6. **Select a Workflow Node:**

   - Add an **n8n API node** (get workflow by ID) to fetch the selected workflow JSON:  
     - Set operation to "get" with workflow ID from previous node.  
     - Use n8n API credentials.

   - Connect output of Manual Trigger and Parse Selected Workflow Id node to this node (to handle both manual and form triggers).

7. **Set Target Workflow ID:**

   - Add a **Set** node to assign `workflow_id` field from `id`.

   - Connect output of Select a Workflow node and Parse Selected Workflow Id node to this node.

8. **Fetch Full Workflow JSON:**

   - Add an **n8n API node** to get full workflow JSON by `workflow_id`.

   - Connect output of Set Target Workflow Id to this node.

9. **Extract Nodes and Connections:**

   - Add a **Set** node to extract and clean the workflow JSON:  
     - Remove unnecessary fields like `pinData` and `shared`.  
     - Assign fields:  
       - `old_workflow`: cleaned full workflow JSON  
       - `nodes`: array of nodes  
       - `connections`: connections object

   - Connect output of Fetch Target Workflow JSON node to this node.

10. **Add AI Model Node:**

    - Add a **Langchain LLM Chain** node using OpenRouter GPT or similar AI:  
      - Model: `openai/gpt-5.1-codex-mini` or preferred.  
      - Prompt: Include instructions to rename every node uniquely (max 5 words, title case, etc.).  
      - Input: Pass the cleaned `old_workflow` JSON.

    - Connect output of Extract Workflow Nodes Connections node to this node.

11. **Parse AI Output:**

    - Add a **Langchain Output Parser Structured** node:  
      - Define schema to parse AI JSON output as array of `{ old_name, new_name }`.

    - Connect AI model output to this node.

12. **Prepare Validation Data:**

    - Add a **Set** node to prepare arrays for validation:  
      - `old_workflow` from extraction step  
      - `nodes_name`: list of original node names  
      - `connections_nodes_name_reference`: all referenced node names in connections  
      - `parameters_names`: node name references in parameters  
      - `AI_output`: parsed AI mapping array

    - Connect output of Parse LLM Mapping node here.

13. **Validate AI Output Completeness:**

    - Add an **If** node to check that sorted original node names equal sorted AI output old names.

    - On success: proceed to apply renames.  
    - On failure: route to error stop node.

14. **Apply Renamed Nodes:**

    - Add a **Set** node to:  
      - Rename nodes in the nodes array based on AI mapping.  
      - Replace all node name references inside parameters.  
      - Rename keys and targets in the connections object.

    - Create additional **Set** nodes for:  
      - `new_workflow_without` (original workflow without nodes and connections)  
      - `new_nodes` (updated nodes array)  
      - `new_connections` (updated connections object)

    - Connect outputs accordingly.

15. **Assemble New Workflow Object:**

    - Add a **Set** node to combine `new_workflow_without` with `new_nodes` and `new_connections` into a complete workflow JSON.

    - Connect output of Apply Renamed Nodes node here.

16. **Save Renamed Workflow:**

    - Add an **n8n API node** (update workflow) to save the updated workflow JSON:  
      - Operation: update  
      - Workflow ID from target ID  
      - Workflow Object: new assembled workflow JSON  
      - Credentials: n8n API account

    - Connect output of Assemble New Workflow Object node here.

17. **Build Version Links:**

    - Add a **Set** node to build URLs to new and previous workflow versions using execution URL and version IDs.

    - Connect Save Renamed Workflow Version output here.

18. **Check Trigger Source & Output Results:**

    - Add an **If** node to detect if trigger was Form Trigger or Manual Trigger.

    - If Form Trigger:  
      - Add a **Form** node with completion message including clickable links to new and previous versions.

    - If Manual Trigger:  
      - Add a **Set** node for done status.

    - Connect accordingly.

19. **Error Handling:**

    - Add a **Stop and Error** node with message "Validation Error" connected to the failed branch of validation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                               | Context or Link                                                                                                                                                                                                                                                                                                |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This workflow uses AI to generate descriptive node names for better readability, saving significant manual effort. It requires configured n8n API credentials and AI provider credentials (OpenRouter or similar).                                                                                                                                                                                           | Workflow purpose and requirements.                                                                                                                                                                                                                                                                            |
| If renaming the currently open workflow, reload the n8n editor page after execution to see updated node names, as n8n does not auto-refresh canvas after version updates via API.                                                                                                                                                                                                                            | Important usage note.                                                                                                                                                                                                                                                                                          |
| The AI model prompt enforces strict output format: unique, descriptive names, max 5 words, title case, matching node count. Validation step ensures AI output completeness before applying renames.                                                                                                                                                                                                           | AI model interaction details.                                                                                                                                                                                                                                                                                |
| Error handling node stops workflow if validation fails, allowing users to retry or adjust AI prompt/output parsing.                                                                                                                                                                                                                                                                                        | Error handling guidance.                                                                                                                                                                                                                                                                                       |
| Workflow author: Mohamed Anan - [n8n community profile](https://community.n8n.io/u/mohamed3nan/summary), [LinkedIn](https://link.anan.dev/Linkedin), [n8n Workflows](https://n8n.io/creators/mohamed3nan/)                                                                                                                                                                                                     | Author credits and resources.                                                                                                                                                                                                                                                                                  |

---

**Disclaimer:** The provided text is sourced exclusively from an automated n8n workflow, fully compliant with content policies and containing only legal and public data.