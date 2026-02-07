Auto-Start Tagged Workflows Using n8n API after Deployment

https://n8nworkflows.xyz/workflows/auto-start-tagged-workflows-using-n8n-api-after-deployment-3996


# Auto-Start Tagged Workflows Using n8n API after Deployment

### 1. Workflow Overview

This workflow automates the process of starting specific workflows in an n8n instance after they have been imported or after the n8n service restarts. Since n8n does not automatically activate imported workflows—even if a previous version was running—this workflow addresses that limitation by identifying workflows tagged with **"Auto start"** and activating them programmatically.

The workflow is designed to be triggered manually or automatically after n8n starts, making it suitable for integration into deployment pipelines or container startup scripts.

**Logical blocks:**

- **1.1 Input Reception:** Manual or automated trigger to start the process.
- **1.2 Retrieve Workflows:** Calls the n8n API to fetch all workflows currently present.
- **1.3 Filter Tagged Workflows:** Checks each workflow to see if it includes the tag "Auto start".
- **1.4 Activate Workflows:** Activates workflows that meet the tag criterion.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block starts the workflow execution either manually or via an automated trigger after n8n restarts.
- **Nodes Involved:**  
  - "When clicking ‘Test workflow’"
- **Node Details:**
  - **Node Name:** When clicking ‘Test workflow’  
  - **Type:** Manual Trigger  
  - **Role:** Provides a manual start point for the workflow execution.  
  - **Configuration:** No parameters; simply triggers the workflow when clicked.  
  - **Input/Output:** No input connections; outputs trigger execution to the next node ("n8n").  
  - **Version Requirements:** None special; standard manual trigger node.  
  - **Edge Cases:** Workflow will only start when manually triggered unless replaced by an automatic trigger (e.g., webhook or schedule).  
  - **Sub-workflow:** None.

---

#### 2.2 Retrieve Workflows

- **Overview:** Retrieves all workflows from the running n8n instance via the n8n API using configured credentials.
- **Nodes Involved:**  
  - "n8n"
- **Node Details:**
  - **Node Name:** n8n  
  - **Type:** n8n API node  
  - **Role:** Fetches all workflows using the "Get All Workflows" API call.  
  - **Configuration:**  
    - No filters applied; retrieves all workflows from the n8n instance.  
    - Uses n8n API credentials with an API key for authentication.  
  - **Key Expressions/Variables:** None beyond default API call.  
  - **Input/Output:**  
    - Input: Trigger from "When clicking ‘Test workflow’" node.  
    - Output: An array of workflows passed to the next node.  
  - **Version Requirements:** Requires n8n API key credentials setup prior.  
  - **Edge Cases:**  
    - API key missing or invalid → authentication failure.  
    - Network or API downtime → request timeout or failure.  
  - **Sub-workflow:** None.

---

#### 2.3 Filter Tagged Workflows

- **Overview:** Inspects each workflow’s tags to determine if it contains the "Auto start" tag.
- **Nodes Involved:**  
  - "TAG? Auto start"
- **Node Details:**
  - **Node Name:** TAG? Auto start  
  - **Type:** If (Conditional) node  
  - **Role:** Filters workflows to only those containing the "Auto start" tag.  
  - **Configuration:**  
    - Condition checks if the tags array of the current workflow includes the string "Auto start".  
    - Uses expression: `={{ $json.tags.map((obj) => obj.name) }}` to extract tag names.  
    - Applies a case-sensitive "array contains" operator.  
  - **Input/Output:**  
    - Input: Workflows from the "n8n" node.  
    - Output: Only workflows matching the tag condition are passed to the next node.  
  - **Version Requirements:** Uses version 2.2 of the If node for advanced condition options.  
  - **Edge Cases:**  
    - Workflows without a `tags` property → expression could error if not handled properly (assumed safe here).  
    - Case sensitivity may cause missed matches if tag capitalization differs.  
  - **Sub-workflow:** None.

---

#### 2.4 Activate Workflows

- **Overview:** Activates each workflow that passed the tag filter by calling the n8n API to change its status to active.
- **Nodes Involved:**  
  - "n8n1"
- **Node Details:**
  - **Node Name:** n8n1  
  - **Type:** n8n API node  
  - **Role:** Activates the workflow by its ID via the API.  
  - **Configuration:**  
    - Operation: "activate"  
    - Workflow ID dynamically set using expression: `={{ $json.id }}` from the filtered workflows.  
    - Uses the same n8n API key credentials.  
  - **Input/Output:**  
    - Input: Workflows filtered by "TAG? Auto start".  
    - Output: Activation responses (not connected further).  
  - **Version Requirements:** Requires n8n API key credentials and activation permission on the API.  
  - **Edge Cases:**  
    - Workflow may already be active (idempotent but API may return a specific status).  
    - Activation failure due to permissions or API errors.  
  - **Sub-workflow:** None.

---

#### 2.5 Documentation Node (Sticky Note)

- **Node Name:** Sticky Note4  
- **Type:** Sticky Note  
- **Role:** Contains detailed explanation and instructions for the workflow usage and configuration.  
- **Content Highlights:**  
  - Explains the problem with imported workflows not auto-starting.  
  - Describes how the workflow solves this by using tags.  
  - Notes the requirement for n8n API key credentials.  
- **Position:** Isolated, purely for informational purposes, no connections.

---

### 3. Summary Table

| Node Name               | Node Type           | Functional Role                     | Input Node(s)                  | Output Node(s)          | Sticky Note                                                                                          |
|-------------------------|---------------------|-----------------------------------|-------------------------------|------------------------|----------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger      | Starts the workflow execution      | -                             | n8n                    |                                                                                                    |
| n8n                     | n8n API             | Retrieves all workflows            | When clicking ‘Test workflow’ | TAG? Auto start          |                                                                                                    |
| TAG? Auto start          | If (Conditional)     | Filters workflows with "Auto start" tag | n8n                           | n8n1                   |                                                                                                    |
| n8n1                    | n8n API             | Activates workflows by ID          | TAG? Auto start               | -                      |                                                                                                    |
| Sticky Note4            | Sticky Note         | Provides detailed workflow info    | -                             | -                      | # Auto Starter<br>On importing workflows these will not be auto started...<br>**Configuration**<br>- You need a a **n8n api key** configured. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: `When clicking ‘Test workflow’`  
   - Type: Manual Trigger  
   - Leave default configuration. No inputs required.  

2. **Create n8n API Node to Get Workflows**  
   - Name: `n8n`  
   - Type: n8n API (n8n-nodes-base.n8n)  
   - Credentials: Select or create n8n API credentials with a valid API key.  
   - Parameters:  
     - Operation: Get All Workflows  
     - Filters: Leave empty to retrieve all workflows.  
   - Connect output of `When clicking ‘Test workflow’` → input of this node.  

3. **Create If Node to Check for "Auto start" Tag**  
   - Name: `TAG? Auto start`  
   - Type: If (Conditional)  
   - Parameters:  
     - Use Version 2 condition options.  
     - Condition:  
       - Left Value (Expression): `{{$json.tags.map(obj => obj.name)}}`  
       - Operator: Array Contains  
       - Right Value: `Auto start`  
     - Case Sensitive: Enabled (true)  
   - Connect output of `n8n` node → input of this node.  

4. **Create n8n API Node to Activate Workflow**  
   - Name: `n8n1`  
   - Type: n8n API  
   - Credentials: Use the same n8n API key credentials as before.  
   - Parameters:  
     - Operation: Activate workflow  
     - Workflow ID: Expression `{{$json.id}}` (uses ID from the filtered workflow)  
   - Connect "true" output of `TAG? Auto start` → input of this node.  

5. **(Optional) Add Sticky Note**  
   - Add a Sticky Note node with content explaining the workflow purpose and configuration.  
   - Position for clarity, no connections needed.

6. **Save the Workflow**  
   - Name it appropriately, e.g., "Auto-Start Tagged Workflows Using n8n API after Deployment."  

7. **Credential Setup**  
   - Configure n8n API credentials with a valid API key that has permission to list and activate workflows.  

8. **Execution**  
   - Trigger manually or integrate this workflow into the startup sequence of your n8n deployment to auto-activate tagged workflows.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                                           |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| This workflow is part of an automated deployment pipeline where n8n containers import workflows and then start those tagged with "Auto start." It fixes the common issue where imported workflows remain inactive after deployment.                                                                              | Workflow description and usage notes.                                                                                      |
| To use this workflow, you must have an n8n API key credential configured with proper permissions to list and activate workflows via the n8n API.                                                                                                                                                              | Credential configuration requirement.                                                                                      |
| Check also the "Export workflows with readable names" workflow for complementary functionality related to exporting and auto-starting workflows after deployment.                                                                                                                                             | Related workflow mentioned in the description.                                                                              |

---

This documentation provides a comprehensive understanding, detailed analysis, and stepwise reconstruction instructions for the "Auto-Start Tagged Workflows Using n8n API after Deployment" workflow. It is suitable for both advanced users and automation agents to reproduce, modify, or integrate this workflow within larger automation systems.