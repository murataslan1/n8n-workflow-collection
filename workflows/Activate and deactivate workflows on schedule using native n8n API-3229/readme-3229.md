Activate and deactivate workflows on schedule using native n8n API

https://n8nworkflows.xyz/workflows/activate-and-deactivate-workflows-on-schedule-using-native-n8n-api-3229


# Activate and deactivate workflows on schedule using native n8n API

### 1. Workflow Overview

This workflow automates the activation and deactivation of a specified n8n workflow on a scheduled basis using the native n8n API node. It is designed for DevOps or workflow management scenarios where workflows need to be enabled or disabled automatically according to business hours or other time-based policies.

**Target Use Cases:**  
- Automatically activate a workflow at the start of a business day (e.g., 08:00 AM).  
- Automatically deactivate the same workflow at the end of the business day (e.g., 08:00 PM).  
- Manage workflow availability without manual intervention.  
- Suitable for users with access to n8n API credentials (not available for trial users).

**Logical Blocks:**  
- **1.1 Schedule Triggers:** Two schedule trigger nodes set to fire at specific times (08:00 and 20:00 daily).  
- **1.2 Workflow ID Setup:** A node that sets the target workflow ID to be activated/deactivated.  
- **1.3 Merge Nodes:** Combine schedule trigger events with the workflow ID data to prepare for API calls.  
- **1.4 n8n API Calls:** Two n8n nodes that call the native n8n API to activate or deactivate the target workflow.  
- **1.5 Documentation & Instructions:** Sticky notes providing setup instructions, warnings, and references.

---

### 2. Block-by-Block Analysis

#### 1.1 Schedule Triggers

**Overview:**  
This block triggers the workflow at two scheduled times daily: one to activate and one to deactivate the target workflow.

**Nodes Involved:**  
- Activate at 08:00 daily  
- Deactivate at 20:00 daily

**Node Details:**

- **Activate at 08:00 daily**  
  - Type: Schedule Trigger  
  - Role: Fires the workflow at 08:00 AM every day.  
  - Configuration: Custom cron expression `0 8 * * *` (minute 0, hour 8, every day).  
  - Input: None (trigger node).  
  - Output: Triggers downstream nodes on schedule.  
  - Edge Cases: If the n8n instance is down or paused at trigger time, the event will be missed. Cron expression must be valid.  
  - Version: 1.2

- **Deactivate at 20:00 daily**  
  - Type: Schedule Trigger  
  - Role: Fires the workflow at 08:00 PM every day.  
  - Configuration: Custom cron expression `0 20 * * *` (minute 0, hour 20, every day).  
  - Input: None (trigger node).  
  - Output: Triggers downstream nodes on schedule.  
  - Edge Cases: Same as above.  
  - Version: 1.2

---

#### 1.2 Workflow ID Setup

**Overview:**  
This block sets the target workflow ID that will be activated or deactivated by the API calls.

**Nodes Involved:**  
- Workflow ID

**Node Details:**

- **Workflow ID**  
  - Type: Set  
  - Role: Defines a static string variable `workflowID` containing the ID of the workflow to manage.  
  - Configuration: Assigns `workflowID` = `"cGqPi5Uy2u1ShmoO"` (example workflow ID).  
  - Input: Receives trigger data from schedule nodes via merges.  
  - Output: Passes the `workflowID` in JSON format downstream.  
  - Edge Cases: If the workflow ID is incorrect or missing, the API calls will fail.  
  - Version: 3.4

---

#### 1.3 Merge Nodes

**Overview:**  
These nodes combine the schedule trigger data with the workflow ID data to prepare a single JSON object for the API nodes.

**Nodes Involved:**  
- Merge in Workflow ID for activation  
- Merge in Workflow ID for deactivation

**Node Details:**

- **Merge in Workflow ID for activation**  
  - Type: Merge  
  - Role: Combines data from the "Activate at 08:00 daily" trigger and the "Workflow ID" node.  
  - Configuration: Mode set to "combine" by position (combines inputs by their order).  
  - Input: Two inputs — schedule trigger and workflow ID.  
  - Output: Single combined JSON object containing trigger info and `workflowID`.  
  - Edge Cases: If inputs are out of sync or missing, merge may produce incomplete data.  
  - Version: 3

- **Merge in Workflow ID for deactivation**  
  - Type: Merge  
  - Role: Combines data from the "Deactivate at 20:00 daily" trigger and the "Workflow ID" node.  
  - Configuration: Same as above.  
  - Input: Two inputs — schedule trigger and workflow ID.  
  - Output: Combined JSON object for deactivation API call.  
  - Edge Cases: Same as above.  
  - Version: 3

---

#### 1.4 n8n API Calls

**Overview:**  
This block uses the native n8n API node to activate or deactivate the target workflow based on the combined input data.

**Nodes Involved:**  
- n8n Activate  
- n8n Deactivate

**Node Details:**

- **n8n Activate**  
  - Type: n8n (native API node)  
  - Role: Sends an API request to activate the workflow with the ID from the merged input.  
  - Configuration:  
    - Operation: `activate`  
    - Workflow ID: Dynamically set via expression `={{ $json.workflowID }}`  
    - Request Options: Default (empty)  
    - Credentials: Uses stored n8n API credentials (OAuth2 or API key-based) named "n8n acc for Gitlab/hub sync of repos".  
  - Input: Receives combined JSON with `workflowID`.  
  - Output: API response confirming activation status.  
  - Edge Cases:  
    - Authentication failure if credentials are invalid.  
    - API errors if workflow ID does not exist or user lacks permission.  
    - Network or timeout errors.  
  - Version: 1

- **n8n Deactivate**  
  - Type: n8n (native API node)  
  - Role: Sends an API request to deactivate the workflow with the ID from the merged input.  
  - Configuration:  
    - Operation: `deactivate`  
    - Workflow ID: Dynamically set via expression `={{ $json.workflowID }}`  
    - Request Options: Default (empty)  
    - Credentials: Same as above.  
  - Input: Receives combined JSON with `workflowID`.  
  - Output: API response confirming deactivation status.  
  - Edge Cases: Same as above.  
  - Version: 1

---

#### 1.5 Documentation & Instructions (Sticky Notes)

**Overview:**  
Several sticky notes provide guidance on setup, warnings, and references to documentation.

**Nodes Involved:**  
- Sticky Note (Workflow ID instructions)  
- Sticky Note1 (Schedule instructions)  
- Sticky Note2 (API credentials instructions)  
- Sticky Note3 (Warning about trial users)  
- Sticky Note4 (General scheduling note)  
- Sticky Note5 (Reminder to activate this workflow)

**Details:**  
- Sticky notes contain URLs to official n8n documentation for API, schedule triggers, and credentials setup.  
- Warning that the workflow requires n8n API access, which is not available on trial accounts.  
- Visual aids for locating the workflow ID in the URL.  
- Encouragement to activate this workflow itself for it to run.

---

### 3. Summary Table

| Node Name                          | Node Type                 | Functional Role                             | Input Node(s)                      | Output Node(s)                     | Sticky Note                                                                                                  |
|-----------------------------------|---------------------------|---------------------------------------------|----------------------------------|----------------------------------|--------------------------------------------------------------------------------------------------------------|
| Activate at 08:00 daily            | Schedule Trigger          | Trigger activation at 08:00 daily           | None                             | Workflow ID                      | ## Set Activate/deactivate schedule [Custom (cron) interval](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/#custom-cron-interval) is a recommended approach. |
| Deactivate at 20:00 daily          | Schedule Trigger          | Trigger deactivation at 20:00 daily         | None                             | Workflow ID                      |                                                                                                              |
| Workflow ID                       | Set                      | Define target workflow ID                    | Activate at 08:00 daily, Deactivate at 20:00 daily (via merges) | Merge in Workflow ID for activation, Merge in Workflow ID for deactivation | ## Set targeted Workflow ID You will find it in the URL of the workflow you want to manage. ![img](https://community.n8n.io/uploads/default/original/3X/8/a/8aa6297de2cffb3de23c221aee62065610525f5f.png) |
| Merge in Workflow ID for activation | Merge                    | Combine activation trigger and workflow ID  | Workflow ID, Activate at 08:00 daily | n8n Activate                   |                                                                                                              |
| Merge in Workflow ID for deactivation | Merge                  | Combine deactivation trigger and workflow ID| Workflow ID, Deactivate at 20:00 daily | n8n Deactivate                 |                                                                                                              |
| n8n Activate                     | n8n (native API)          | Activate target workflow via API             | Merge in Workflow ID for activation | None                           | ## Set n8n API credentials 1. Create an API key: https://docs.n8n.io/api/authentication/ 2. Create n8n credentials using the API key This workflow uses **[n8n node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.n8n/)**. |
| n8n Deactivate                   | n8n (native API)          | Deactivate target workflow via API           | Merge in Workflow ID for deactivation | None                         |                                                                                                              |
| Sticky Note                     | Sticky Note               | Instruction: How to find Workflow ID         | None                             | None                             | ## Set targeted Workflow ID You will find it in the URL of the workflow you want to manage. ![img](https://community.n8n.io/uploads/default/original/3X/8/a/8aa6297de2cffb3de23c221aee62065610525f5f.png) |
| Sticky Note1                    | Sticky Note               | Instruction: Schedule setup                   | None                             | None                             | ## Set Activate/deactivate schedule [Custom (cron) interval](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/#custom-cron-interval) is a recommended approach. |
| Sticky Note2                    | Sticky Note               | Instruction: API credentials setup            | None                             | None                             | ## Set n8n API credentials 1. Create an API key: https://docs.n8n.io/api/authentication/ 2. Create n8n credentials using the API key This workflow uses **[n8n node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.n8n/)**. |
| Sticky Note3                    | Sticky Note               | Warning: Not for trial users                   | None                             | None                             | ## ⚠️ Warning! This approach **won't work for trial users** as it requires n8n API that is not available to trial users. See https://docs.n8n.io/api/ for details. |
| Sticky Note4                    | Sticky Note               | General note on scheduling workflow activity  | None                             | None                             | ## Scheduling workflow activity time Your workflow wants to work normal business hours? Maybe it is in its own right. |
| Sticky Note5                    | Sticky Note               | Reminder to activate this workflow             | None                             | None                             | ## Activate this workflow!                                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node for Activation:**  
   - Add a **Schedule Trigger** node named `Activate at 08:00 daily`.  
   - Set the trigger type to **Cron** with expression `0 8 * * *`.  
   - This node will initiate the activation process daily at 8 AM.

2. **Create Schedule Trigger Node for Deactivation:**  
   - Add another **Schedule Trigger** node named `Deactivate at 20:00 daily`.  
   - Set the trigger type to **Cron** with expression `0 20 * * *`.  
   - This node will initiate the deactivation process daily at 8 PM.

3. **Create a Set Node for Workflow ID:**  
   - Add a **Set** node named `Workflow ID`.  
   - Add a string field named `workflowID`.  
   - Set its value to the target workflow’s ID (found in the URL of the workflow you want to control).  
   - Example: `cGqPi5Uy2u1ShmoO`.

4. **Create Merge Node for Activation:**  
   - Add a **Merge** node named `Merge in Workflow ID for activation`.  
   - Set mode to **Combine**.  
   - Set combine by to **Position**.  
   - Connect the `Activate at 08:00 daily` node to input 1.  
   - Connect the `Workflow ID` node to input 2.

5. **Create Merge Node for Deactivation:**  
   - Add a **Merge** node named `Merge in Workflow ID for deactivation`.  
   - Set mode to **Combine**.  
   - Set combine by to **Position**.  
   - Connect the `Deactivate at 20:00 daily` node to input 1.  
   - Connect the `Workflow ID` node to input 2.

6. **Create n8n API Node to Activate Workflow:**  
   - Add an **n8n** node named `n8n Activate`.  
   - Set **Operation** to `activate`.  
   - Set **Workflow ID** to expression: `={{ $json.workflowID }}`.  
   - Leave Request Options empty (default).  
   - Under Credentials, select or create **n8n API credentials** with an API key that has permission to activate workflows.

7. **Create n8n API Node to Deactivate Workflow:**  
   - Add an **n8n** node named `n8n Deactivate`.  
   - Set **Operation** to `deactivate`.  
   - Set **Workflow ID** to expression: `={{ $json.workflowID }}`.  
   - Leave Request Options empty (default).  
   - Use the same **n8n API credentials** as above.

8. **Connect Nodes:**  
   - Connect `Merge in Workflow ID for activation` output to `n8n Activate` input.  
   - Connect `Merge in Workflow ID for deactivation` output to `n8n Deactivate` input.  
   - Connect `Workflow ID` output to input 2 of both merge nodes.  
   - Connect `Activate at 08:00 daily` output to input 1 of `Merge in Workflow ID for activation`.  
   - Connect `Deactivate at 20:00 daily` output to input 1 of `Merge in Workflow ID for deactivation`.

9. **Save and Activate the Workflow:**  
   - Ensure the workflow itself is activated to allow scheduled triggers to fire.

10. **Set Up Credentials:**  
    - Create an API key in your n8n instance following [n8n API authentication docs](https://docs.n8n.io/api/authentication/).  
    - Create n8n API credentials in n8n using this API key.  
    - Assign these credentials to both `n8n Activate` and `n8n Deactivate` nodes.

---

### 5. General Notes & Resources

| Note Content                                                                                                                      | Context or Link                                                                                   |
|-----------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This approach **won't work for trial users** as it requires n8n API access not available on trial plans.                          | https://docs.n8n.io/api/                                                                         |
| How to find the workflow ID: It is visible in the URL when editing a workflow.                                                    | ![Workflow ID location](https://community.n8n.io/uploads/default/original/3X/8/a/8aa6297de2cffb3de23c221aee62065610525f5f.png) |
| Recommended to use custom cron intervals for schedule triggers for flexibility.                                                   | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/#custom-cron-interval |
| How to create API keys and credentials for n8n API node usage.                                                                    | https://docs.n8n.io/api/authentication/ and https://docs.n8n.io/credentials/add-edit-credentials/#create-a-credential |
| For error handling best practices, consider using a universal error workflow to catch execution and trigger errors.              | https://n8n.io/workflows/3075-error-handling-send-email-via-gmail-on-execution-or-trigger-level-errors/ |
| Backup your workflows regularly by automating backups.                                                                            | https://n8n.io/workflows/?q=Backup                                                               |
| This workflow is part of a DevOps toolkit for workflow management automation.                                                     | Tag: #DevOps #workflow-management                                                                |

---

This documentation provides a complete understanding of the workflow structure, node configuration, and setup instructions to reproduce or modify the workflow as needed. It also highlights potential failure points and external dependencies such as API credentials and scheduling constraints.