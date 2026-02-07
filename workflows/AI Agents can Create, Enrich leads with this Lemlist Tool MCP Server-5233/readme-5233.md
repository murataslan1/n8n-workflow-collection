AI Agents can Create, Enrich leads with this Lemlist Tool MCP Server

https://n8nworkflows.xyz/workflows/ai-agents-can-create--enrich-leads-with-this-lemlist-tool-mcp-server-5233


# AI Agents can Create, Enrich leads with this Lemlist Tool MCP Server

### 1. Workflow Overview

This workflow, titled **"AI Agents can Create, Enrich leads with this Lemlist Tool MCP Server"**, is designed to interface with the Lemlist platform through its MCP (Multi-Channel Prospecting) Server integration. Its primary purpose is to enable AI-driven agents to manage and enrich sales leads and campaigns by leveraging Lemlist’s API capabilities within an automated workflow environment.

The workflow is logically divided into the following functional blocks:

- **1.1 Input Reception via MCP Trigger**: Listens for incoming requests or commands from AI agents or external systems through the MCP trigger node.
- **1.2 Campaign and Activity Management**: Retrieves multiple campaign and activity data such as campaign lists, campaign statistics, and user activities.
- **1.3 Lead Enrichment and Management**: Handles lead enrichment through email or LinkedIn URLs, fetching prior enrichment data, as well as creating, retrieving, deleting, and unsubscribing leads.
- **1.4 Team and Credit Information Management**: Manages team data and credits related to the Lemlist account.
- **1.5 Unsubscribe List Management**: Manages unsubscribe lists by adding or removing emails and retrieving unsubscribed emails.
- **1.6 Workflow Annotations**: Multiple sticky notes are used throughout the workflow as documentation or placeholders for additional information.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception via MCP Trigger

- **Overview**: This block serves as the entry point of the workflow, receiving commands or data from AI agents or external systems via the Lemlist MCP Trigger node.
- **Nodes Involved**:  
  - Lemlist Tool MCP Server

- **Node Details**:
  - **Lemlist Tool MCP Server**  
    - *Type*: MCP Trigger (Multi-Channel Prospecting Trigger)  
    - *Technical Role*: Listens for incoming MCP requests to initiate workflow actions.  
    - *Configuration*: Configured with a webhook ID to receive HTTP POST requests; no further parameters needed.  
    - *Inputs*: Triggers the workflow upon receiving external calls.  
    - *Outputs*: Forwards the request data to subsequent Lemlist Tool nodes.  
    - *Edge Cases*:  
      - Webhook authentication failure or invalid webhook calls.  
      - Timeout or connectivity issues with the MCP service.  
      - Malformed or incomplete request payloads.  
    - *Version Requirements*: Requires n8n version supporting MCP Trigger nodes and Lemlist integration.

#### 2.2 Campaign and Activity Management

- **Overview**: Retrieves and manages campaign-related data and user activities on Lemlist, providing insights and stats to AI agents.
- **Nodes Involved**:  
  - Get many activities  
  - Get many campaigns  
  - Get campaign stats  
  - Sticky Note 1 (near Get many activities)  
  - Sticky Note 2 (near Get many campaigns and Get campaign stats)

- **Node Details**:
  - **Get many activities**  
    - *Type*: Lemlist Tool  
    - *Role*: Fetches multiple user activities from Lemlist.  
    - *Configuration*: Uses default or empty parameters implying retrieval of all available activities or filtered by AI input.  
    - *Input*: Triggered from MCP node.  
    - *Output*: Activity data passed downstream or back to the MCP response.  
    - *Edge Cases*: API rate limits, empty activity list, authentication errors.

  - **Get many campaigns**  
    - *Type*: Lemlist Tool  
    - *Role*: Retrieves the list of campaigns associated with the Lemlist account.  
    - *Configuration*: Default parameters to get all campaigns.  
    - *Input*: Triggered from MCP node.  
    - *Output*: Campaign list data.  
    - *Edge Cases*: Large campaign lists causing timeouts, API limits.

  - **Get campaign stats**  
    - *Type*: Lemlist Tool  
    - *Role*: Obtains detailed statistics for a specific campaign.  
    - *Configuration*: Likely requires campaign ID input (passed from AI or previous node).  
    - *Input*: Triggered after campaign selection.  
    - *Output*: Campaign performance metrics.  
    - *Edge Cases*: Invalid campaign ID, API errors.

  - **Sticky Notes 1 & 2**  
    - *Role*: Provide contextual information or annotations for these nodes.  
    - *Content*: Empty in this export, potentially placeholders for user notes.

#### 2.3 Lead Enrichment and Management

- **Overview**: Provides functionality to enrich lead data, fetch prior enrichments, create new leads, delete leads, get lead details, and unsubscribe leads.
- **Nodes Involved**:  
  - Fetches a previously completed enrichment  
  - Enrich a lead using an email or LinkedIn URL  
  - Enrich a person using an email or LinkedIn URL  
  - Create a lead  
  - Delete a lead  
  - Get a lead  
  - Unsubscribe a lead  
  - Sticky Note 3 (near enrichment nodes)  
  - Sticky Note 4 (near lead creation and deletion nodes)

- **Node Details**:
  - **Fetches a previously completed enrichment**  
    - *Type*: Lemlist Tool  
    - *Role*: Retrieves cached enrichment data for a lead to avoid redundant enrichment requests.  
    - *Input*: Email or LinkedIn URL identifier.  
    - *Output*: Enrichment data.  
    - *Edge Cases*: No prior enrichment found, API errors.

  - **Enrich a lead using an email or LinkedIn URL**  
    - *Type*: Lemlist Tool  
    - *Role*: Performs enrichment of lead information based on email or LinkedIn URL.  
    - *Input*: Lead identifier from AI or MCP trigger.  
    - *Output*: Enriched lead data.  
    - *Edge Cases*: Invalid identifiers, rate limits, incomplete data.

  - **Enrich a person using an email or LinkedIn URL**  
    - *Type*: Lemlist Tool  
    - *Role*: Similar to lead enrichment but possibly scoped differently by Lemlist API (person vs. lead).  
    - *Input/Output*: As above.  
    - *Edge Cases*: Same as above.

  - **Create a lead**  
    - *Type*: Lemlist Tool  
    - *Role*: Adds a new lead to the Lemlist system.  
    - *Input*: Lead details from AI or workflow input.  
    - *Output*: Confirmation or lead ID.  
    - *Edge Cases*: Duplicate leads, validation errors.

  - **Delete a lead**  
    - *Type*: Lemlist Tool  
    - *Role*: Removes a lead from Lemlist.  
    - *Input*: Lead ID.  
    - *Output*: Deletion confirmation.  
    - *Edge Cases*: Lead not found, permissions errors.

  - **Get a lead**  
    - *Type*: Lemlist Tool  
    - *Role*: Fetches lead details by ID.  
    - *Input*: Lead ID.  
    - *Output*: Lead data.  
    - *Edge Cases*: Lead missing or API errors.

  - **Unsubscribe a lead**  
    - *Type*: Lemlist Tool  
    - *Role*: Marks a lead as unsubscribed from campaigns.  
    - *Input*: Lead ID or email.  
    - *Output*: Confirmation status.  
    - *Edge Cases*: Lead already unsubscribed, invalid IDs.

  - **Sticky Notes 3 & 4**  
    - *Role*: Annotations near enrichment and lead management nodes.  
    - *Content*: Empty placeholders.

#### 2.4 Team and Credit Information Management

- **Overview**: Manages retrieval of team data and credit usage within Lemlist.
- **Nodes Involved**:  
  - Get a team  
  - Get team credits  
  - Sticky Note 5 (near team nodes)

- **Node Details**:
  - **Get a team**  
    - *Type*: Lemlist Tool  
    - *Role*: Retrieves team details associated with the Lemlist account.  
    - *Input*: Triggered from MCP.  
    - *Output*: Team member info.  
    - *Edge Cases*: Permissions errors, empty teams.

  - **Get team credits**  
    - *Type*: Lemlist Tool  
    - *Role*: Fetches current credit balances for the team.  
    - *Input/Output*: Team ID in, credits count out.  
    - *Edge Cases*: API errors, unauthorized access.

  - **Sticky Note 5**  
    - *Role*: Contextual notes near team information nodes.  
    - *Content*: Empty.

#### 2.5 Unsubscribe List Management

- **Overview**: Manages the unsubscribe email list by adding, deleting, or retrieving unsubscribed emails.
- **Nodes Involved**:  
  - Add an email to an unsubscribe list  
  - Delete an email from an unsubscribe list  
  - Get many unsubscribed emails  
  - Sticky Note 6 (near unsubscribe list nodes)

- **Node Details**:
  - **Add an email to an unsubscribe list**  
    - *Type*: Lemlist Tool  
    - *Role*: Inserts an email address into the unsubscribe list to stop receiving campaigns.  
    - *Input*: Email address.  
    - *Output*: Confirmation of addition.  
    - *Edge Cases*: Email already unsubscribed, invalid email format.

  - **Delete an email from an unsubscribe list**  
    - *Type*: Lemlist Tool  
    - *Role*: Removes an email from the unsubscribe list.  
    - *Input*: Email address.  
    - *Output*: Confirmation of removal.  
    - *Edge Cases*: Email not found in list.

  - **Get many unsubscribed emails**  
    - *Type*: Lemlist Tool  
    - *Role*: Retrieves a list of all unsubscribed emails.  
    - *Input/Output*: Typically no input required.  
    - *Edge Cases*: Large lists causing delays.

  - **Sticky Note 6**  
    - *Role*: Annotation near unsubscribe management nodes.  
    - *Content*: Empty.

---

### 3. Summary Table

| Node Name                               | Node Type                        | Functional Role                          | Input Node(s)          | Output Node(s)        | Sticky Note          |
|----------------------------------------|---------------------------------|----------------------------------------|-----------------------|-----------------------|----------------------|
| Workflow Overview 0                    | Sticky Note                     | General overview placeholder            |                       |                       |                      |
| Lemlist Tool MCP Server                | MCP Trigger                    | Entry point, receives MCP requests      |                       | All Lemlist Tool nodes |                      |
| Get many activities                    | Lemlist Tool                   | Retrieves multiple user activities      | Lemlist Tool MCP Server |                       |                      |
| Sticky Note 1                         | Sticky Note                    | Context for activities node             |                       |                       |                      |
| Get many campaigns                    | Lemlist Tool                   | Retrieves campaign list                  | Lemlist Tool MCP Server | Get campaign stats     |                      |
| Get campaign stats                    | Lemlist Tool                   | Retrieves stats for a campaign           | Get many campaigns     |                       |                      |
| Sticky Note 2                         | Sticky Note                    | Context for campaign nodes               |                       |                       |                      |
| Fetches a previously completed enrichment | Lemlist Tool               | Gets prior lead enrichment data         | Lemlist Tool MCP Server |                       |                      |
| Enrich a lead using an email or LinkedIn URL | Lemlist Tool             | Enriches lead data via email/LinkedIn   | Fetches a previously completed enrichment | Enrich a person using email or LinkedIn URL |                      |
| Enrich a person using an email or LinkedIn URL | Lemlist Tool             | Enriches person data via email/LinkedIn | Enrich a lead using email or LinkedIn URL |                       |                      |
| Sticky Note 3                         | Sticky Note                    | Context for enrichment nodes             |                       |                       |                      |
| Create a lead                        | Lemlist Tool                   | Creates a new lead                       | Lemlist Tool MCP Server |                       |                      |
| Delete a lead                        | Lemlist Tool                   | Deletes a lead                          | Lemlist Tool MCP Server |                       |                      |
| Get a lead                          | Lemlist Tool                   | Retrieves lead details                   | Lemlist Tool MCP Server |                       |                      |
| Unsubscribe a lead                  | Lemlist Tool                   | Unsubscribes a lead                      | Lemlist Tool MCP Server |                       |                      |
| Sticky Note 4                       | Sticky Note                    | Context for lead management nodes       |                       |                       |                      |
| Get a team                         | Lemlist Tool                   | Retrieves team data                      | Lemlist Tool MCP Server | Get team credits       |                      |
| Get team credits                   | Lemlist Tool                   | Retrieves credit info for team           | Get a team             |                       |                      |
| Sticky Note 5                      | Sticky Note                    | Context for team nodes                   |                       |                       |                      |
| Add an email to an unsubscribe list | Lemlist Tool                  | Adds email to unsubscribe list          | Lemlist Tool MCP Server |                       |                      |
| Delete an email from an unsubscribe list | Lemlist Tool               | Removes email from unsubscribe list     | Lemlist Tool MCP Server |                       |                      |
| Get many unsubscribed emails        | Lemlist Tool                   | Retrieves all unsubscribed emails        | Lemlist Tool MCP Server |                       |                      |
| Sticky Note 6                      | Sticky Note                    | Context for unsubscribe list nodes      |                       |                       |                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create MCP Trigger Node**  
   - Add a node of type **MCP Trigger** (`@n8n/n8n-nodes-langchain.mcpTrigger`).  
   - Configure with a unique webhook ID (auto-generated or specify one).  
   - This node listens for incoming MCP server requests to trigger the workflow.

2. **Add Lemlist Tool Nodes for Campaign and Activity Management**  
   - Add **Get many activities** node (Lemlist Tool type). Leave parameters empty for default fetch.  
   - Add **Get many campaigns** node (Lemlist Tool type). Leave parameters empty.  
   - Add **Get campaign stats** node (Lemlist Tool type). Configure to accept campaign ID as input.  
   - Connect these nodes’ inputs from the MCP Trigger node output (ai_tool connection).

3. **Add Lemlist Tool Nodes for Lead Enrichment and Management**  
   - Add **Fetches a previously completed enrichment** node (Lemlist Tool).  
   - Add **Enrich a lead using an email or LinkedIn URL** node.  
   - Add **Enrich a person using an email or LinkedIn URL** node.  
   - Add **Create a lead** node.  
   - Add **Delete a lead** node.  
   - Add **Get a lead** node.  
   - Add **Unsubscribe a lead** node.  
   - Connect all these nodes’ inputs to the MCP Trigger node output.

4. **Add Lemlist Tool Nodes for Team and Credit Info**  
   - Add **Get a team** node.  
   - Add **Get team credits** node, connected after **Get a team** node.  
   - Connect **Get a team** node input from MCP Trigger output.

5. **Add Lemlist Tool Nodes for Unsubscribe List Management**  
   - Add **Add an email to an unsubscribe list** node.  
   - Add **Delete an email from an unsubscribe list** node.  
   - Add **Get many unsubscribed emails** node.  
   - Connect all to MCP Trigger output.

6. **Add Sticky Notes for Documentation**  
   - Place sticky notes near nodes as needed to annotate logical blocks or provide documentation.  
   - Use empty content or add descriptive text as desired.

7. **Configure Credentials**  
   - For all Lemlist Tool nodes, configure Lemlist API credentials with proper OAuth2 or API Key access to your Lemlist account.  
   - For MCP Trigger node, ensure webhook is correctly exposed and secure.

8. **Connect MCP Trigger Node to All Lemlist Tool Nodes**  
   - Ensure the MCP Trigger node’s "ai_tool" output connects to each Lemlist Tool node’s input to allow them to respond to MCP requests.

9. **Set Workflow Settings**  
   - Set timezone (e.g., America/New_York).  
   - Save and activate the workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                       |
|-----------------------------------------------------------------------------------------------|------------------------------------------------------|
| The workflow integrates Lemlist’s Multi-Channel Prospecting Server (MCP) for AI agent control. | Lemlist MCP Server documentation.                     |
| Lemlist Tool nodes require valid API credentials configured in n8n.                           | https://developers.lemlist.com/                       |
| MCP Trigger node requires webhook exposure and secure configuration for external access.      | n8n MCP Trigger node documentation.                   |
| Sticky notes are used as placeholders; users can add comments for better workflow clarity.     | n8n sticky notes feature.                              |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.