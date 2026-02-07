Auto-Send Welcome Messages to Vtiger CRM Leads via Evolution API WhatsApp

https://n8nworkflows.xyz/workflows/auto-send-welcome-messages-to-vtiger-crm-leads-via-evolution-api-whatsapp-6502


# Auto-Send Welcome Messages to Vtiger CRM Leads via Evolution API WhatsApp

### 1. Workflow Overview

This workflow automates the process of sending a personalized WhatsApp welcome message to new leads recorded in Vtiger CRM, using the Evolution API for WhatsApp messaging. It is designed for sales or support teams to ensure timely, automated engagement with new leads without sending duplicate messages.

**Target Use Cases:**  
- Automatically greet new leads via WhatsApp shortly after their creation in Vtiger CRM.  
- Avoid re-sending messages to leads already contacted by marking them in the CRM.  
- Operate on a regular schedule (every minute) to keep lead engagement timely.

**Logical Blocks:**  
- **1.1 Scheduled Trigger**: Periodically triggers the workflow every minute.  
- **1.2 Lead Retrieval from Vtiger CRM**: Queries the latest lead not yet contacted via WhatsApp.  
- **1.3 Conditional Check for Lead Data**: Validates if a new lead record was returned.  
- **1.4 WhatsApp Message Sending via Evolution API**: Sends a personalized welcome message to the lead’s WhatsApp number.  
- **1.5 Lead Record Update in Vtiger CRM**: Marks the lead as contacted to prevent duplicate messaging.  
- **1.6 No Operation**: Placeholder node when no new lead is found, doing nothing.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:**  
  Initiates the workflow execution every 1 minute to check for new leads continuously.

- **Nodes Involved:**  
  - Schedule Trigger Every n Minutes

- **Node Details:**  
  - **Type:** Schedule Trigger  
  - **Role:** Generates workflow execution events on a fixed interval.  
  - **Configuration:** Set to trigger every 1 minute.  
  - **Input/Output:** No input; outputs a trigger event to the next node.  
  - **Edge Cases:** If the n8n instance is down or overloaded, scheduled triggers may be delayed or missed.  
  - **Version:** Uses version 1.2 of the node.

---

#### 1.2 Lead Retrieval from Vtiger CRM

- **Overview:**  
  Queries the Vtiger CRM to fetch the most recent lead which has not yet been marked as contacted via WhatsApp (custom field `cf_1090` not equal to 1).

- **Nodes Involved:**  
  - VtigerCRM get Latest Lead

- **Node Details:**  
  - **Type:** Vtiger CRM Node (Community node)  
  - **Role:** Execute a custom SQL-like query on Leads object.  
  - **Configuration:** Runs `select * from Leads where cf_1090!=1 order by id desc limit 1;` to get the newest uncontacted lead.  
  - **Credentials:** Uses configured Vtiger API credentials named "SaadeddinTestCRM".  
  - **Input:** Trigger event from Schedule Trigger.  
  - **Output:** JSON data containing lead details or empty if no leads found.  
  - **Edge Cases:**  
    - No leads matching criteria results in empty data.  
    - API authentication failure or rate limiting.  
  - **Version:** Node version 1.

---

#### 1.3 Conditional Check for Lead Data

- **Overview:**  
  Checks if the previous node returned a lead by verifying that the lead `id` field is not empty.

- **Nodes Involved:**  
  - If there's a data returned

- **Node Details:**  
  - **Type:** If Node (Conditional logic)  
  - **Role:** Branch the workflow based on presence of lead data.  
  - **Configuration:** Condition verifies `{{$json.result[0].id}}` is not empty.  
  - **Input:** Lead data from VtigerCRM get Latest Lead node.  
  - **Output:**  
    - True branch: Lead data exists, proceed to send message and update lead.  
    - False branch: No lead data, proceed to No Operation node.  
  - **Edge Cases:** Expression failure if `result` path does not exist or malformed data.  
  - **Version:** Version 2.2.

---

#### 1.4 WhatsApp Message Sending via Evolution API

- **Overview:**  
  Sends a personalized WhatsApp message to the lead’s phone number using Evolution API.

- **Nodes Involved:**  
  - Enviar texto

- **Node Details:**  
  - **Type:** Evolution API Node (Community node for WhatsApp messaging)  
  - **Role:** Sends a WhatsApp text message.  
  - **Configuration:**  
    - Resource: messages-api  
    - `remoteJid`: The lead’s phone number extracted as `{{$json.result[0].phone}}`.  
    - `messageText`: Personalized greeting with lead’s first and last name, e.g.,  
      `"Hi {{firstname}} {{lastname}} 😊,\n\nWe have received your interest with our services and we will contact you soon.\n\nHave a nice day 🙏💐"`  
    - Instance name: "Ahmed560" (refers to the Evolution API instance configured).  
  - **Credentials:** Evolution API credentials named "Evolution account".  
  - **Input:** Lead data from conditional node.  
  - **Output:** Confirmation or error message from API.  
  - **Edge Cases:**  
    - Invalid or missing phone number format may cause failures.  
    - API authentication errors, message quota limits, or network timeouts.  
  - **Version:** 1.

---

#### 1.5 Lead Record Update in Vtiger CRM

- **Overview:**  
  Updates the lead record in Vtiger CRM to mark that the WhatsApp welcome message has been sent by setting custom field `cf_1090` to "1".

- **Nodes Involved:**  
  - VtigerCRM Update Lead to Mark as Whatsapp Sent

- **Node Details:**  
  - **Type:** Vtiger CRM Node  
  - **Role:** Update operation on the lead record.  
  - **Configuration:**  
    - Operation: Update  
    - Fields to update: `{"cf_1090":"1"}`  
    - Target element identified by `webservice_id_field` set to lead’s `id`  
  - **Credentials:** Same Vtiger API credentials as lead retrieval.  
  - **Input:** True branch from conditional node.  
  - **Output:** Confirmation of update.  
  - **Edge Cases:**  
    - Failure to update due to API errors or CRM permission issues.  
    - Race conditions if lead updated elsewhere simultaneously.  
  - **Version:** 1.

---

#### 1.6 No Operation

- **Overview:**  
  Executes when no new lead data is found; acts as a placeholder to avoid workflow errors or unnecessary processing.

- **Nodes Involved:**  
  - No Operation, do nothing

- **Node Details:**  
  - **Type:** No Operation Node  
  - **Role:** Ends the workflow branch gracefully without side effects.  
  - **Input:** False branch from conditional node.  
  - **Output:** None.  
  - **Edge Cases:** None, safe fallback.  
  - **Version:** 1.

---

### 3. Summary Table

| Node Name                              | Node Type                    | Functional Role                                  | Input Node(s)                   | Output Node(s)                                  | Sticky Note                                                                                              |
|--------------------------------------|------------------------------|-------------------------------------------------|--------------------------------|------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Schedule Trigger Every n Minutes     | Schedule Trigger             | Periodically triggers workflow every 1 minute  | None                           | VtigerCRM get Latest Lead                        | ### 🤖 Auto-Send Welcome WhatsApp Message to New Vtiger Leads  \n**(Vtiger CRM + Evolution API)**\nThis workflow runs **every 1 minute** to:\n- 📥 Get the latest lead from Vtiger CRM (not yet marked as contacted)\n- 💬 Send a **personalized welcome WhatsApp message** using Evolution API\n- ✅ Update the lead record with a custom field to mark that the message was sent\n\n> 💡 Requires:\n> - Evolution API (self-hosted or cloud)\n> - Community vtiger-crm and evolution-api nodes (install via Community Nodes)\n\n> 📲 Ideal for sales or support teams who want to automatically greet new leads on WhatsApp and avoid duplicates. |
| VtigerCRM get Latest Lead            | Vtiger CRM Node              | Fetch latest uncontacted lead                    | Schedule Trigger Every n Minutes | If there's a data returned                       |                                                                                                        |
| If there's a data returned            | If Node                     | Check if lead data exists                         | VtigerCRM get Latest Lead       | VtigerCRM Update Lead..., Enviar texto, No Operation |                                                                                                        |
| VtigerCRM Update Lead to  Mark as Whatsapp Sent | Vtiger CRM Node             | Mark lead as contacted in CRM                     | If there's a data returned (true) | None                                           |                                                                                                        |
| Enviar texto                         | Evolution API Node           | Send welcome WhatsApp message                     | If there's a data returned (true) | None                                           |                                                                                                        |
| No Operation, do nothing             | No Operation Node            | Graceful exit if no lead found                    | If there's a data returned (false) | None                                           |                                                                                                        |
| Sticky Note                         | Sticky Note                  | Workflow description and instructions             | None                           | None                                           | See "Schedule Trigger Every n Minutes" node row                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node:**  
   - Type: Schedule Trigger  
   - Set to trigger every 1 minute interval.  
   - No credentials required.

2. **Create Vtiger CRM Node for Lead Retrieval:**  
   - Type: Vtiger CRM Node (Community node)  
   - Operation: Custom Query  
   - Query field: `select * from Leads where cf_1090!=1 order by id desc limit 1;`  
   - Credentials: Configure with your Vtiger API credentials (OAuth2 or API key) named e.g. "SaadeddinTestCRM".  
   - Connect Schedule Trigger output to this node’s input.

3. **Create If Node for Lead Data Check:**  
   - Type: If Node  
   - Condition: Check if expression `{{$json.result[0].id}}` is not empty (string operation: notEmpty).  
   - Connect Vtiger CRM Lead Retrieval node output to this node’s input.

4. **Create Vtiger CRM Node for Lead Update:**  
   - Type: Vtiger CRM Node  
   - Operation: Update  
   - Element field (update data): `{"cf_1090": "1"}`  
   - Webservice ID field: `{{$json.result[0].id}}` (to target the lead)  
   - Credentials: Same as lead retrieval node.  
   - Connect If node’s **true** output to this node.

5. **Create Evolution API Node to Send WhatsApp Message:**  
   - Type: Evolution API Node (Community node)  
   - Resource: messages-api  
   - Remote JID: `{{$json.result[0].phone}}` (lead’s phone)  
   - Message Text:  
     ```
     Hi {{$json.result[0].firstname}} {{$json.result[0].lastname}} 😊,

     We have received your interest with our services and we will contact you soon.

     Have a nice day 🙏💐
     ```  
   - Instance Name: Set to your Evolution API instance, e.g., "Ahmed560".  
   - Credentials: Configure Evolution API credentials ("Evolution account").  
   - Connect If node’s **true** output to this node in parallel with the lead update node (both run after If node true branch).

6. **Create No Operation Node:**  
   - Type: No Operation  
   - Connect If node’s **false** output to this node, to handle cases where no lead is found.

7. **Connect the nodes according to the following order:**  
   - Schedule Trigger → VtigerCRM get Latest Lead → If there's a data returned  
   - If true branch → VtigerCRM Update Lead to Mark as Whatsapp Sent  
   - If true branch → Enviar texto  
   - If false branch → No Operation

8. **Add a Sticky Note (optional):**  
   - Content: Describe the workflow purpose, requirements, and usage as in the original sticky note for documentation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow requires installation of community nodes for Vtiger CRM and Evolution API to enable CRM queries and WhatsApp messaging respectively.                                                                                                                                                                                                             | n8n Community Nodes Marketplace                                                                 |
| Evolution API can be self-hosted or cloud-based. Ensure credentials and instance name are configured properly for message sending.                                                                                                                                                                                                                          | https://evolutionapi.com/                                                                        |
| Custom field `cf_1090` in Vtiger CRM is used as a flag to mark leads that have already been sent WhatsApp messages, avoid duplicates by setting to "1" after message sent. Make sure this custom field is created and accessible.                                                                                                                               | Vtiger CRM Custom Fields Documentation                                                          |
| The workflow runs every minute, which may be adjusted as needed to reduce load or fit business requirements.                                                                                                                                                                                                                                                | n8n Schedule Trigger Documentation                                                              |
| Personalized messages use lead’s first and last name, ensure these fields exist and are populated in Vtiger leads to avoid empty placeholders.                                                                                                                                                                                                             | Vtiger CRM Leads Field Setup                                                                     |
| For troubleshooting, monitor Evolution API response logs and Vtiger CRM API call results for errors such as invalid phone numbers, API authentication failures, or rate limits.                                                                                                                                                                            | n8n Execution Logs, Evolution API Logs                                                          |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. All processing strictly complies with relevant content policies and contains no illegal, offensive, or protected elements. All data handled is lawful and publicly accessible.