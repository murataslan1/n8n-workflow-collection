Auto-Send Vtiger Support Tickets to Telegram (with Status Update)

https://n8nworkflows.xyz/workflows/auto-send-vtiger-support-tickets-to-telegram--with-status-update--6329


# Auto-Send Vtiger Support Tickets to Telegram (with Status Update)

### 1. Workflow Overview

This workflow automates the process of monitoring new open support tickets in Vtiger CRM and sending real-time alerts to a Telegram chat. Upon detecting a new open ticket, it sends detailed ticket information to Telegram and updates the ticket status in Vtiger CRM to "In Progress" to prevent duplicate notifications. The workflow runs periodically every minute to ensure timely updates.

**Logical Blocks:**

- **1.1 Scheduled Trigger:** Periodically initiates the workflow every 1 minute.
- **1.2 Vtiger CRM Ticket Retrieval:** Queries Vtiger CRM for the most recent open support ticket.
- **1.3 Data Existence Check:** Evaluates if any ticket data was returned by the query.
- **1.4 Notification Dispatch:** Sends the ticket details to a specified Telegram chat.
- **1.5 Ticket Status Update:** Updates the ticket status in Vtiger CRM to "In Progress" to mark it as processed.
- **1.6 No Operation Branch:** Handles cases when no new open tickets are found by doing nothing.
- **1.7 Documentation Note:** Provides workflow explanation, usage notes, and installation instructions.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:**  
  Triggers the workflow to run automatically every 1 minute.

- **Nodes Involved:**  
  - Schedule Trigger Every n Minutes

- **Node Details:**  
  - **Type:** Schedule Trigger  
  - **Role:** Initiates workflow execution on a timed interval.  
  - **Configuration:** Interval set to every 1 minute.  
  - **Expressions/Variables:** None.  
  - **Input/Output:** No input; outputs trigger signal to next node (Vtiger CRM get Tickets).  
  - **Version Requirements:** n8n version supporting scheduleTrigger node v1.2 or later.  
  - **Edge Cases:**  
    - Workflow may be delayed if n8n is under heavy load.  
    - Scheduling misconfiguration could cause missed triggers.  

#### 1.2 Vtiger CRM Ticket Retrieval

- **Overview:**  
  Queries Vtiger CRM to fetch the most recent open support ticket from the HelpDesk module.

- **Nodes Involved:**  
  - VtigerCRM get Tickets

- **Node Details:**  
  - **Type:** Vtiger CRM Node (Community Node)  
  - **Role:** Executes a SQL-like query against Vtiger CRM data.  
  - **Configuration:**  
    - Query: `select * from HelpDesk where ticketstatus='Open' order by id desc limit 1;`  
    - Credentials: Authenticated with Vtiger CRM API via stored credential "SaadeddinTestCRM".  
  - **Expressions/Variables:** None beyond static query string.  
  - **Input/Output:** Receives trigger from schedule node; outputs query results for conditional check.  
  - **Version Requirements:** Requires community Vtiger CRM node installed in n8n environment.  
  - **Edge Cases:**  
    - API authentication failure or timeout.  
    - No tickets returned (empty result).  
    - API rate limits or query errors.  

#### 1.3 Data Existence Check

- **Overview:**  
  Checks if the Vtiger query returned any ticket data (i.e., if there is an open ticket).

- **Nodes Involved:**  
  - If there's a data returned

- **Node Details:**  
  - **Type:** If node (conditional branching)  
  - **Role:** Determines workflow path based on presence of data.  
  - **Configuration:**  
    - Condition: Checks if `{{$json.result[0].id}}` is not empty (i.e., at least one ticket record exists).  
  - **Expressions/Variables:** Uses expression to access first result's `id` field.  
  - **Input/Output:** Input from VtigerCRM get Tickets; outputs to two branches:  
    - True branch: Send to Telegram and update ticket status.  
    - False branch: No operation node.  
  - **Version Requirements:** Supports expression syntax and node version 2.2.  
  - **Edge Cases:**  
    - Expression evaluation failure if data structure changes.  
    - Empty or malformed response may cause errors.  

#### 1.4 Notification Dispatch

- **Overview:**  
  Sends a formatted message to a Telegram chat containing the ticket details.

- **Nodes Involved:**  
  - Send a Ticket detail to Telegram

- **Node Details:**  
  - **Type:** Telegram node  
  - **Role:** Sends a text message to Telegram chat using bot API.  
  - **Configuration:**  
    - Text message includes ticket number, title, status, priority, severity, category, and description using expressions from query result fields.  
    - Chat ID specified as `6885236190`.  
    - Attribution disabled to keep message clean.  
    - Credentials: Telegram account credential "Telegram account".  
  - **Expressions/Variables:** Multiple expressions referencing `{{$json.result[0].field_name}}`.  
  - **Input/Output:** Input from If node true branch; output ends the chain for this branch.  
  - **Version Requirements:** Telegram API support v1.2 or newer.  
  - **Edge Cases:**  
    - Telegram API errors (invalid chat ID, revoked bot token, network issues).  
    - Empty or undefined ticket fields resulting in incomplete messages.  

#### 1.5 Ticket Status Update

- **Overview:**  
  Updates the status of the notified ticket in Vtiger CRM to "In Progress" to mark it as handled.

- **Nodes Involved:**  
  - VtigerCRM Update Ticket Status

- **Node Details:**  
  - **Type:** Vtiger CRM Node  
  - **Role:** Performs an update operation on a specific ticket record.  
  - **Configuration:**  
    - Operation: Update  
    - Fields: Sets `"ticketstatus"` to `"In Progress"`.  
    - Target: Uses `{{$json.result[0].id}}` to identify the ticket.  
    - Credentials: Same "SaadeddinTestCRM".  
  - **Expressions/Variables:** Expression referencing ticket ID for update.  
  - **Input/Output:** Input from If node true branch; no output connections (end of chain).  
  - **Version Requirements:** Community Vtiger CRM node installed.  
  - **Edge Cases:**  
    - Update failure due to API errors or permission issues.  
    - Race conditions if ticket status changes externally.  

#### 1.6 No Operation Branch

- **Overview:**  
  Acts as a placeholder node to gracefully handle situations where no open tickets were found, performing no actions.

- **Nodes Involved:**  
  - No Operation, do nothing

- **Node Details:**  
  - **Type:** NoOp node  
  - **Role:** Does nothing; terminates the false path from the conditional.  
  - **Configuration:** Default empty.  
  - **Expressions/Variables:** None.  
  - **Input/Output:** Input from If node false branch; no output connections.  
  - **Version Requirements:** Standard node, no special requirements.  
  - **Edge Cases:** None.  

#### 1.7 Documentation Note

- **Overview:**  
  Provides detailed documentation and usage instructions as a sticky note within the workflow canvas.

- **Nodes Involved:**  
  - Sticky Note

- **Node Details:**  
  - **Type:** Sticky Note  
  - **Role:** Displays workflow purpose, usage notes, and node installation instructions.  
  - **Configuration:** Contains markdown-formatted text explaining:  
    - Workflow function and trigger interval  
    - Stepwise description of actions performed  
    - Instructions for installing the Vtiger CRM community node in self-hosted n8n  
    - Use case suggestions for support teams  
  - **Expressions/Variables:** Static content.  
  - **Input/Output:** None; purely informational.  
  - **Version Requirements:** None.  
  - **Edge Cases:** None.  

---

### 3. Summary Table

| Node Name                     | Node Type                  | Functional Role                            | Input Node(s)                  | Output Node(s)                             | Sticky Note                                                                                                         |
|-------------------------------|----------------------------|--------------------------------------------|-------------------------------|--------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger Every n Minutes | Schedule Trigger           | Periodically triggers workflow every 1 min | None                          | VtigerCRM get Tickets                      |                                                                                                                     |
| VtigerCRM get Tickets           | Vtiger CRM Node            | Fetches latest open ticket from Vtiger CRM | Schedule Trigger Every n Minutes | If there's a data returned                  |                                                                                                                     |
| If there's a data returned      | If Node                   | Checks if ticket data exists                 | VtigerCRM get Tickets          | Send a Ticket detail to Telegram, VtigerCRM Update Ticket Status, No Operation, do nothing |                                                                                                                     |
| Send a Ticket detail to Telegram | Telegram Node              | Sends ticket details message to Telegram    | If there's a data returned (true) | None                                       |                                                                                                                     |
| VtigerCRM Update Ticket Status  | Vtiger CRM Node            | Updates ticket status to "In Progress"      | If there's a data returned (true) | None                                       |                                                                                                                     |
| No Operation, do nothing        | NoOp Node                  | Does nothing when no open tickets found     | If there's a data returned (false) | None                                       |                                                                                                                     |
| Sticky Note                    | Sticky Note                | Provides workflow description and notes     | None                          | None                                       | 🎟️ Auto-Send Vtiger Tickets to Telegram (Real-time alerts + CRM update). Runs every 1 minute. Uses community node. Installation instructions included. Ideal for support teams. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node:**  
   - Type: Schedule Trigger  
   - Name: "Schedule Trigger Every n Minutes"  
   - Set interval to every 1 minute under the "Rule" section.

2. **Add Vtiger CRM Node to Get Tickets:**  
   - Type: Vtiger CRM Node (Community Node)  
   - Name: "VtigerCRM get Tickets"  
   - Configure Credentials: Select or create Vtiger API credentials ("SaadeddinTestCRM").  
   - Set Query field to: `select * from HelpDesk where ticketstatus='Open' order by id desc limit 1;`  
   - Connect output of Schedule Trigger node to this node.

3. **Add If Node to Check Data Existence:**  
   - Type: If Node  
   - Name: "If there's a data returned"  
   - Condition Type: String, operation "notEmpty"  
   - Left Value expression: `{{$json.result[0].id}}`  
   - Connect output of VtigerCRM get Tickets node to this If node.

4. **Add Telegram Node to Send Ticket Details:**  
   - Type: Telegram Node  
   - Name: "Send a Ticket detail to Telegram"  
   - Configure Credentials: Telegram API credentials ("Telegram account").  
   - Set Chat ID to: `6885236190`  
   - Set Text to (use expression editor):  
     ```
     New ticket with the following details:
     Ticketid: {{$json.result[0].ticket_no}}
     Title: {{$json.result[0].ticket_title}}
     Status: {{$json.result[0].ticketstatus}}
     Priority: {{$json.result[0].ticketpriorities}}
     Severity: {{$json.result[0].ticketseverities}}
     Category: {{$json.result[0].ticketcategories}}
     Description: {{$json.result[0].description}}
     ```  
   - Disable "Append Attribution".  
   - Connect the true output branch of the If node to this Telegram node.

5. **Add Vtiger CRM Node to Update Ticket Status:**  
   - Type: Vtiger CRM Node  
   - Name: "VtigerCRM Update Ticket Status"  
   - Configure Credentials: Use same Vtiger API credential as before.  
   - Set Operation to "Update".  
   - Set "Element Field" to JSON:  
     ```json
     {
       "ticketstatus": "In Progress"
     }
     ```  
   - Set "Webservice ID Field" to expression: `{{$json.result[0].id}}`  
   - Connect the true output branch of the If node also to this node (parallel to Telegram node).

6. **Add No Operation Node for False Branch:**  
   - Type: NoOp Node  
   - Name: "No Operation, do nothing"  
   - Connect the false output branch of the If node to this node.

7. **Add Sticky Note for Documentation:**  
   - Type: Sticky Note  
   - Name: "Sticky Note"  
   - Content:  
     ```
     ### 🎟️ Auto-Send Vtiger Tickets to Telegram  
     **(Real-time alerts + CRM update)**  
     This workflow runs **every 1 minute** to:  
     - 📥 Fetch the most recent **open ticket** from Vtiger HelpDesk  
     - 📲 Send a detailed message to **Telegram**  
     - 🔁 Update the ticket status to **"In Progress"** to avoid duplicate alerts  
     ---  
     > 💡 **Note:**   
     > This workflow uses a custom **Vtiger CRM** node from the **Community Nodes** registry.  
     > To install it in self-hosted n8n:  
     > 1. Go to `Settings` → `Community Nodes`  
     > 2. Click **Install Node** and enter:  
     > ```bash  
     > n8n-nodes-vtiger-crm  
     > ```  
     ---  
     > ✅ Ideal for support teams that need **real-time alerts** and want to sync ticket progress across tools.
     ```  
   - Place it visibly near trigger and Vtiger CRM nodes for clarity.

8. **Validate Credentials:**  
   - Ensure the Vtiger API credentials have correct API access and permissions.  
   - Ensure Telegram bot token is valid and the bot has access to the specified chat ID.

9. **Activate the Workflow:**  
   - Save and activate the workflow.  
   - Monitor logs for any errors or failures during automatic runs.

---

### 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow relies on the community-contributed Vtiger CRM node, which must be installed separately in self-hosted n8n.       | Installation instructions included in the Sticky Note node; Community Nodes feature in n8n Settings |
| Telegram chat ID is hardcoded; adjust it to your target chat or channel ID where notifications should be sent.                   | Telegram Bot API documentation: https://core.telegram.org/bots/api                                  |
| The workflow updates ticket status to "In Progress" to avoid repeated alerts; ensure this status exists in your Vtiger setup.   | Vtiger HelpDesk module documentation for ticket statuses                                           |
| The workflow runs every 1 minute, which is suitable for real-time alerting but may need adjustment to reduce API load.           | Adjust schedule trigger interval as needed                                                         |
| Error handling is minimal; consider adding error workflows or notifications for API failures or connectivity issues.            | n8n error workflow and notification best practices                                                 |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.