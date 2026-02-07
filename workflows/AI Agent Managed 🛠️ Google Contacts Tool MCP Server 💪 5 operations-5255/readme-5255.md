AI Agent Managed 🛠️ Google Contacts Tool MCP Server 💪 5 operations

https://n8nworkflows.xyz/workflows/ai-agent-managed-----google-contacts-tool-mcp-server----5-operations-5255


# AI Agent Managed 🛠️ Google Contacts Tool MCP Server 💪 5 operations

### 1. Workflow Overview

This workflow, titled **Google Contacts Tool MCP Server**, is designed to manage Google Contacts via an AI-driven multi-command processing (MCP) server. It supports five core operations on Google Contacts: Create, Delete, Get one, Get many, and Update a contact. The workflow acts as a backend server triggered by incoming AI commands, routing requests to the appropriate Google Contacts operations.

**Logical Blocks:**

- **1.1 MCP AI Trigger Input:**  
  The entry point which receives AI-driven multi-command triggers for Google Contacts operations.

- **1.2 Google Contacts Operations:**  
  Five separate nodes performing distinct Google Contacts API operations:
  - Create a contact
  - Delete a contact
  - Get a contact
  - Get many contacts
  - Update a contact

Each of these nodes is directly connected as an AI tool output from the MCP trigger node, enabling the AI to invoke any of these operations based on the input command.

---

### 2. Block-by-Block Analysis

#### 1.1 MCP AI Trigger Input

- **Overview:**  
  This block is the starting point of the workflow. It listens for incoming AI-driven commands and interprets them as multi-command process triggers (MCP). It routes commands to the appropriate Google Contacts operation nodes.

- **Nodes Involved:**  
  - Google Contacts Tool MCP Server

- **Node Details:**  
  - **Node Name:** Google Contacts Tool MCP Server  
  - **Type:** MCP Trigger (from `@n8n/n8n-nodes-langchain` package)  
  - **Technical Role:** Receives external AI multi-command requests, acts as a webhook endpoint to initiate workflow execution.  
  - **Configuration:**  
    - No additional parameters configured.  
    - Webhook ID is set to uniquely identify the trigger endpoint.  
  - **Expressions/Variables:** None explicitly visible; it relies on incoming webhook payload.  
  - **Input Connections:** None (trigger node)  
  - **Output Connections:** Outputs to all five Google Contacts operation nodes.  
  - **Version Requirements:** Requires `@n8n/n8n-nodes-langchain` MCP Trigger node support.  
  - **Potential Failures:**  
    - Webhook connectivity issues or unauthorized requests.  
    - Payload parsing errors if input commands are malformed.  
  - **Sub-workflow Reference:** None.

---

#### 1.2 Google Contacts Operations

- **Overview:**  
  This block contains five nodes, each responsible for a specific Google Contacts API operation. These nodes execute the respective CRUD (Create, Read, Update, Delete) operations on Google Contacts data, as commanded by the AI trigger node.

- **Nodes Involved:**  
  - Create a contact  
  - Delete a contact  
  - Get a contact  
  - Get many contacts  
  - Update a contact

- **Node Details:**  

  1. **Create a contact**  
     - **Type:** Google Contacts Tool  
     - **Role:** Creates a new contact in Google Contacts.  
     - **Configuration:** Default operation set to "Create a contact" (assumed).  
     - **Input:** Receives AI tool output from MCP trigger node.  
     - **Output:** Returns the created contact data.  
     - **Potential Failures:**  
       - Authentication errors with Google OAuth2 credentials.  
       - Validation errors if required fields are missing.  
       - API rate limits or quota exceeded.  

  2. **Delete a contact**  
     - **Type:** Google Contacts Tool  
     - **Role:** Deletes a contact identified by a unique ID.  
     - **Configuration:** Operation set to "Delete a contact."  
     - **Input:** Receives contact ID from the MCP trigger node output.  
     - **Output:** Confirmation of deletion.  
     - **Potential Failures:**  
       - Invalid or non-existent contact ID.  
       - Authentication or permission errors.  
       - API throttling.  

  3. **Get a contact**  
     - **Type:** Google Contacts Tool  
     - **Role:** Retrieves details of a single contact by ID.  
     - **Configuration:** Operation "Get a contact."  
     - **Input:** Contact ID from MCP trigger.  
     - **Output:** Contact details.  
     - **Potential Failures:**  
       - Contact not found.  
       - Authentication issues.  

  4. **Get many contacts**  
     - **Type:** Google Contacts Tool  
     - **Role:** Retrieves multiple contacts, possibly with filters or pagination.  
     - **Configuration:** Operation "Get many contacts."  
     - **Input:** Parameters for filtering or pagination from MCP trigger.  
     - **Output:** List of contacts.  
     - **Potential Failures:**  
       - Large data volume causing timeouts.  
       - API limits exceeded.  

  5. **Update a contact**  
     - **Type:** Google Contacts Tool  
     - **Role:** Updates existing contact details.  
     - **Configuration:** Operation "Update a contact."  
     - **Input:** Contact ID and updated fields from MCP trigger.  
     - **Output:** Updated contact data.  
     - **Potential Failures:**  
       - Invalid contact ID.  
       - Field validation errors.  
       - Authentication errors.  

- **Input Connections:** Each receives input from the MCP Trigger node as an AI tool output.  
- **Output Connections:** None (end nodes).  
- **Version Requirements:** Requires Google Contacts Tool node support compatible with n8n version used.  
- **Sub-workflow Reference:** None.

---

### 3. Summary Table

| Node Name                      | Node Type                              | Functional Role                               | Input Node(s)                   | Output Node(s)          | Sticky Note             |
|--------------------------------|-------------------------------------|----------------------------------------------|---------------------------------|-------------------------|-------------------------|
| Workflow Overview 0            | Sticky Note                         | Informational (empty content)                 | None                            | None                    |                         |
| Google Contacts Tool MCP Server| MCP Trigger (Langchain)              | AI-driven multi-command trigger for contacts | None                            | Create, Delete, Get (1), Get (many), Update |                         |
| Create a contact               | Google Contacts Tool                 | Creates a new Google contact                   | Google Contacts Tool MCP Server | None                    |                         |
| Delete a contact               | Google Contacts Tool                 | Deletes an existing Google contact             | Google Contacts Tool MCP Server | None                    |                         |
| Get a contact                 | Google Contacts Tool                 | Retrieves a single Google contact's details   | Google Contacts Tool MCP Server | None                    |                         |
| Get many contacts             | Google Contacts Tool                 | Retrieves multiple Google contacts             | Google Contacts Tool MCP Server | None                    |                         |
| Update a contact              | Google Contacts Tool                 | Updates details of an existing Google contact | Google Contacts Tool MCP Server | None                    |                         |
| Sticky Note 1                 | Sticky Note                         | Informational (empty content)                   | None                            | None                    |                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Trigger Node**  
   - Add an **MCP Trigger** node (from `@n8n/n8n-nodes-langchain`) called `Google Contacts Tool MCP Server`.  
   - Configure it to listen on a webhook path (automatically assigned or manually set).  
   - No additional parameters needed.  
   - This node will receive AI-driven multi-command inputs.

2. **Add Google Contacts Operation Nodes**  
   For each operation, add a **Google Contacts Tool** node and configure as follows:

   - **Create a contact**  
     - Set operation to "Create a contact".  
     - Configure required fields according to Google Contacts API (e.g., name, email).  
     - Connect input from `Google Contacts Tool MCP Server` node’s AI tool output.  

   - **Delete a contact**  
     - Set operation to "Delete a contact".  
     - Configure to accept a contact ID parameter.  
     - Connect input from MCP trigger node AI tool output.  

   - **Get a contact**  
     - Set operation to "Get a contact".  
     - Configure to accept a contact ID parameter.  
     - Connect input from MCP trigger node AI tool output.  

   - **Get many contacts**  
     - Set operation to "Get many contacts".  
     - Optionally configure filters or pagination parameters.  
     - Connect input from MCP trigger node AI tool output.  

   - **Update a contact**  
     - Set operation to "Update a contact".  
     - Configure to accept contact ID and fields to update.  
     - Connect input from MCP trigger node AI tool output.  

3. **Set Credentials**  
   - For all Google Contacts Tool nodes, configure Google OAuth2 credentials with adequate scopes to manage contacts.  
   - For the MCP Trigger node, ensure webhook permissions and any authentication needed for external AI integrations.

4. **Connect Nodes**  
   - From the `Google Contacts Tool MCP Server` node, connect the AI tool output to each of the five Google Contacts operation nodes respectively.  
   - No further downstream connections needed as these are terminal operation nodes.

5. **Optional Sticky Notes**  
   - Add sticky notes as needed for documentation or instructions within the workflow canvas.

6. **Save and Activate**  
   - Review all credentials and configurations.  
   - Save the workflow.  
   - Activate to enable listening for AI-driven contact management commands.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                  |
|--------------------------------------------------------------------------------------------------|-------------------------------------------------|
| This workflow integrates AI multi-command triggers with Google Contacts API for flexible contact management. | Workflow description and design context          |
| Ensure Google OAuth2 credentials have the `https://www.googleapis.com/auth/contacts` scope enabled. | Google Contacts API OAuth2 requirements          |
| MCP Trigger node requires `@n8n/n8n-nodes-langchain` package support in your n8n environment.      | n8n official node documentation                   |
| Consider adding error handling logic or retry mechanisms for production deployments.               | Best practices for robust automation workflows   |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing fully complies with current content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.