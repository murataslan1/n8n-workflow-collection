Auto-assign Support Tickets with JIRA, Supabase and AI

https://n8nworkflows.xyz/workflows/auto-assign-support-tickets-with-jira--supabase-and-ai-3395


# Auto-assign Support Tickets with JIRA, Supabase and AI

### 1. Workflow Overview

This workflow automates the management of JIRA support tickets to prevent unassigned issues from lingering beyond a week. It leverages AI-powered similarity search against a Supabase vector store of resolved issues to intelligently auto-assign stale, unassigned tickets to the most suitable team member based on historical resolution context and current workload.

The workflow is composed of two main continuous flows triggered by schedules:

- **1.1 Resolved Issues Ingestion Flow:**  
  Periodically fetches recently resolved JIRA issues, processes their content and metadata, and inserts them into a Supabase vector store to maintain an up-to-date searchable knowledge base.

- **1.2 Stale Unassigned Issues Auto-Assignment Flow:**  
  Periodically scans for unassigned JIRA issues older than 5 days, finds similar resolved issues via vector search, identifies candidate assignees, evaluates their current workload, and auto-assigns the issue to the team member with the most capacity, leaving a comment on the ticket.

---

### 2. Block-by-Block Analysis

#### 2.1 Resolved Issues Ingestion Flow

**Overview:**  
This block keeps the vector store current by importing resolved issues from JIRA daily. It extracts key metadata and issue descriptions, converts them into embeddings, and inserts them into Supabase for similarity search.

**Nodes Involved:**  
- Schedule Trigger  
- Last 50 Resolved (JIRA)  
- Remove Duplicates  
- Collect Fields (Set)  
- Recursive Character Text Splitter  
- Default Data Loader  
- Embeddings OpenAI  
- Issues Similarity Database (Supabase Vector Store)  
- Sticky Notes (explanatory)

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the flow periodically (default daily interval)  
  - Config: Default interval (can be customized)  
  - Connections: Triggers "Last 50 Resolved" node  
  - Edge Cases: Misconfiguration can cause missed runs or overload

- **Last 50 Resolved**  
  - Type: JIRA node  
  - Role: Retrieves resolved issues from JIRA in the last day with assignees  
  - Config: JQL filters by project, status "Done", assignee not empty, created within last day  
  - Credentials: JIRA Software Cloud OAuth2  
  - Connections: Outputs to "Remove Duplicates"  
  - Edge Cases: API rate limits, JQL errors, empty result sets

- **Remove Duplicates**  
  - Type: Remove Duplicates  
  - Role: Ensures only new issues are processed to avoid redundant vector inserts  
  - Config: Deduplication based on issue key, remembers seen items across executions  
  - Connections: Outputs to "Collect Fields"  
  - Edge Cases: Cache corruption or reset may cause duplicates

- **Collect Fields**  
  - Type: Set node  
  - Role: Extracts and maps JIRA issue fields into simplified metadata for embedding  
  - Config: Assigns project key, issue key, issue type, created/resolved dates, assignee id/name, title, description  
  - Connections: Outputs to "Issues Similarity Database" via text splitter and loader  
  - Edge Cases: Missing fields in JIRA data may cause expression failures

- **Recursive Character Text Splitter**  
  - Type: Langchain Text Splitter  
  - Role: Splits issue description text into manageable chunks for embedding  
  - Config: Default character-based recursive splitting  
  - Connections: Feeds into "Default Data Loader"  
  - Edge Cases: Very large text may cause performance issues

- **Default Data Loader**  
  - Type: Langchain Document Data Loader  
  - Role: Prepares documents with metadata for vector insertion  
  - Config: Uses JSON expression data including issue metadata and formatted text  
  - Connections: Outputs to "Embeddings OpenAI" for embedding generation  
  - Edge Cases: Incorrect metadata mapping may reduce search quality

- **Embeddings OpenAI**  
  - Type: Langchain OpenAI Embeddings  
  - Role: Generates vector embeddings from issue text chunks  
  - Config: Uses OpenAI API with default embedding model  
  - Credentials: OpenAI API key  
  - Connections: Outputs embeddings to "Issues Similarity Database"  
  - Edge Cases: API rate limits, auth errors, input size limits

- **Issues Similarity Database**  
  - Type: Langchain Supabase Vector Store  
  - Role: Inserts embeddings and metadata into Supabase table "documents"  
  - Config: Insert mode, default options  
  - Credentials: Supabase API key for vector store access  
  - Edge Cases: DB connectivity, schema mismatches, insertion errors

- **Sticky Notes**  
  - Provide contextual documentation and links for users about JIRA node usage, Supabase vector store, and workflow purpose.

---

#### 2.2 Stale Unassigned Issues Auto-Assignment Flow

**Overview:**  
This block identifies stale JIRA issues unassigned for more than 5 days, finds similar resolved issues to identify knowledgeable assignees, evaluates their current workload, and auto-assigns the issue to the team member with the least active assignments, leaving a comment on the issue.

**Nodes Involved:**  
- Schedule Trigger1  
- Get Unassigned Tickets more than 5 days (JIRA)  
- For Each Issue (Split in Batches)  
- Issue Ref (NoOp)  
- Find Similar Issues + Assignees (Langchain Agent)  
- Supabase Vector Store (Vector Search Tool)  
- OpenAI Chat Model (LLM)  
- To Structured Output (Information Extractor)  
- Issues to Items (Split Out)  
- If has Items? (If)  
- For Each User (Split in Batches)  
- Check User Workflow (JIRA)  
- Tally In-Progress Issues per User (Set)  
- Count Assigned Open Issues per User (Summarize)  
- Sort By Most Capacity (Sort)  
- Assign User to Ticket (JIRA)  
- Add Comment to Issue (JIRA)  
- Skip (NoOp)  
- Sticky Notes (explanatory)

**Node Details:**

- **Schedule Trigger1**  
  - Type: Schedule Trigger  
  - Role: Periodically triggers the auto-assignment flow (default interval)  
  - Connections: Triggers "Get Unassigned Tickets more than 5 days"  
  - Edge Cases: Misconfigured interval can cause delays or overload

- **Get Unassigned Tickets more than 5 days**  
  - Type: JIRA node  
  - Role: Queries JIRA for unassigned issues in "To Do" status older than 5 days  
  - Config: JQL filters project, status "To Do", assignee empty, assignee changed before 5 days ago  
  - Credentials: JIRA Software Cloud OAuth2  
  - Connections: Outputs to "For Each Issue"  
  - Edge Cases: Empty result sets, JQL errors, API limits

- **For Each Issue**  
  - Type: Split in Batches  
  - Role: Processes each stale issue individually for assignment logic  
  - Connections: Outputs to "Issue Ref" or ends if no issues  
  - Edge Cases: Large batch sizes may cause performance issues

- **Issue Ref**  
  - Type: NoOp  
  - Role: Pass-through node to mark current issue context  
  - Connections: Outputs to "Find Similar Issues + Assignees"  
  - Edge Cases: None

- **Find Similar Issues + Assignees**  
  - Type: Langchain Agent  
  - Role: Uses LLM and vector search to find resolved issues similar to the stale issue and extract assignee info  
  - Config: System prompt instructs to find similar resolved issues and list issue key, assignee id, and name  
  - Inputs: Issue summary and description from current issue  
  - Connections: Outputs to "To Structured Output"  
  - Edge Cases: LLM API errors, no similar issues found, ambiguous results

- **Supabase Vector Store**  
  - Type: Langchain Vector Store Tool  
  - Role: Performs vector similarity search in Supabase vector store for relevant resolved issues  
  - Config: Retrieve top 20 similar documents from "documents" table  
  - Credentials: Supabase API key  
  - Connections: Used internally by the Agent node  
  - Edge Cases: DB connectivity, empty search results

- **OpenAI Chat Model**  
  - Type: Langchain LLM Chat Model  
  - Role: Provides language model capabilities for the Agent node to interpret and respond  
  - Config: Model "gpt-4o-mini" with default options  
  - Credentials: OpenAI API key  
  - Connections: Used internally by Agent node  
  - Edge Cases: API limits, timeouts

- **To Structured Output**  
  - Type: Langchain Information Extractor  
  - Role: Parses the agent's textual output into structured JSON with required fields (issue_key, assignee_id, assignee_name)  
  - Config: Uses a manual JSON schema to validate and extract data  
  - Connections: Outputs to "Issues to Items"  
  - Edge Cases: Parsing failures, invalid or incomplete data

- **Issues to Items**  
  - Type: Split Out  
  - Role: Splits the array of similar issues into individual items for further processing  
  - Connections: Outputs to "If has Items?"  
  - Edge Cases: Empty arrays lead to skipping

- **If has Items?**  
  - Type: If node  
  - Role: Checks if any similar issues were found  
  - Config: Condition checks non-empty JSON input  
  - Connections: True → "For Each User", False → "Skip"  
  - Edge Cases: False negatives if data format is unexpected

- **For Each User**  
  - Type: Split in Batches  
  - Role: Iterates over each candidate assignee from similar issues  
  - Connections: Outputs to "Count Assigned Open Issues per User" and "Check User Workflow"  
  - Edge Cases: Large candidate sets may slow processing

- **Check User Workflow**  
  - Type: JIRA node  
  - Role: Queries JIRA for issues currently "In Progress" assigned to the candidate user  
  - Config: JQL filters by status "In Progress" and assignee id  
  - Credentials: JIRA Software Cloud OAuth2  
  - Connections: Outputs to "Tally In-Progress Issues per User"  
  - Edge Cases: API limits, empty results

- **Tally In-Progress Issues per User**  
  - Type: Set node  
  - Role: Sets a flag "in_progress" to 1 if user has issues, else 2 (likely a logic placeholder)  
  - Connections: Outputs to "For Each User" (loop back)  
  - Edge Cases: Logic might need refinement for accurate counting

- **Count Assigned Open Issues per User**  
  - Type: Summarize  
  - Role: Aggregates counts of in-progress issues grouped by assignee_id to quantify workload  
  - Connections: Outputs to "Sort By Most Capacity"  
  - Edge Cases: Summarize node limitations, missing data

- **Sort By Most Capacity**  
  - Type: Sort  
  - Role: Sorts users ascending by count of in-progress issues to find user with most capacity  
  - Connections: Outputs to "Assign User to Ticket"  
  - Edge Cases: Sorting errors if data malformed

- **Assign User to Ticket**  
  - Type: JIRA node  
  - Role: Updates the stale issue's assignee field to the selected user id  
  - Config: Uses issue key from "Issue Ref" and assignee_id from sorted list  
  - Credentials: JIRA Software Cloud OAuth2  
  - Connections: Outputs to "Add Comment to Issue"  
  - Edge Cases: Permission errors, JIRA API errors, race conditions

- **Add Comment to Issue**  
  - Type: JIRA node  
  - Role: Adds a comment to the issue notifying the assignee of auto-assignment due to issue age  
  - Config: Comment text references assignee name from previous steps  
  - Credentials: JIRA Software Cloud OAuth2  
  - Connections: Outputs to "For Each Issue" (loop to next issue)  
  - Edge Cases: API errors, comment formatting issues

- **Skip**  
  - Type: NoOp  
  - Role: Placeholder to skip issues with no similar resolved issues found  
  - Connections: Outputs to "For Each Issue" (continue loop)  
  - Edge Cases: None

- **Sticky Notes**  
  - Provide detailed explanations and links for scheduled triggers, AI agent usage, JIRA node usage, and workflow logic.

---

### 3. Summary Table

| Node Name                       | Node Type                              | Functional Role                                  | Input Node(s)                      | Output Node(s)                      | Sticky Note                                                                                                                                    |
|--------------------------------|--------------------------------------|-------------------------------------------------|----------------------------------|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger               | Schedule Trigger                     | Triggers resolved issues ingestion flow         |                                  | Last 50 Resolved                  |                                                                                                                                                |
| Last 50 Resolved              | JIRA                                | Fetches resolved JIRA issues from last day      | Schedule Trigger                 | Remove Duplicates                 | [Learn more about the JIRA node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.jira/)                                        |
| Remove Duplicates             | Remove Duplicates                    | Removes already processed issues to avoid dupes | Last 50 Resolved                | Collect Fields                   |                                                                                                                                                |
| Collect Fields                | Set                                 | Extracts and maps issue metadata                 | Remove Duplicates               | Recursive Character Text Splitter |                                                                                                                                                |
| Recursive Character Text Splitter | Langchain Text Splitter             | Splits issue text into chunks                     | Collect Fields                  | Default Data Loader              |                                                                                                                                                |
| Default Data Loader           | Langchain Document Data Loader       | Prepares documents with metadata                  | Recursive Character Text Splitter | Embeddings OpenAI               |                                                                                                                                                |
| Embeddings OpenAI             | Langchain OpenAI Embeddings          | Generates vector embeddings                        | Default Data Loader             | Issues Similarity Database       |                                                                                                                                                |
| Issues Similarity Database    | Langchain Supabase Vector Store      | Inserts embeddings into Supabase vector store     | Embeddings OpenAI               |                                  | [Learn more about the Supabase Vector Store](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoresupabase) |
| Schedule Trigger1             | Schedule Trigger                     | Triggers stale unassigned issues assignment flow |                                  | Get Unassigned Tickets more than 5 days |                                                                                                                                                |
| Get Unassigned Tickets more than 5 days | JIRA                                | Fetches unassigned stale issues (>5 days)         | Schedule Trigger1              | For Each Issue                  |                                                                                                                                                |
| For Each Issue               | Split in Batches                    | Processes each stale issue individually           | Get Unassigned Tickets more than 5 days | Issue Ref / Skip              |                                                                                                                                                |
| Issue Ref                    | NoOp                               | Pass-through for current issue context            | For Each Issue                 | Find Similar Issues + Assignees  |                                                                                                                                                |
| Find Similar Issues + Assignees | Langchain Agent                    | Finds similar resolved issues and assignees       | Issue Ref                     | To Structured Output             | [Learn more about AI Agents](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/)                       |
| Supabase Vector Store        | Langchain Supabase Vector Store      | Vector search tool for similar issues              | Used internally by Agent       |                                 |                                                                                                                                                |
| OpenAI Chat Model            | Langchain LLM Chat Model             | Provides LLM capabilities for Agent                | Used internally by Agent       |                                 |                                                                                                                                                |
| To Structured Output         | Langchain Information Extractor      | Parses agent output into structured JSON           | Find Similar Issues + Assignees | Issues to Items                 |                                                                                                                                                |
| Issues to Items              | Split Out                          | Splits array of similar issues into individual items | To Structured Output           | If has Items?                   |                                                                                                                                                |
| If has Items?                | If                                 | Checks if similar issues were found                | Issues to Items                | For Each User / Skip            |                                                                                                                                                |
| For Each User                | Split in Batches                    | Processes each candidate assignee                   | If has Items?                 | Count Assigned Open Issues per User, Check User Workflow |                                                                                                                                                |
| Check User Workflow          | JIRA                              | Queries in-progress issues assigned to candidate   | For Each User                 | Tally In-Progress Issues per User |                                                                                                                                                |
| Tally In-Progress Issues per User | Set                             | Flags if user has in-progress issues                | Check User Workflow           | For Each User                  |                                                                                                                                                |
| Count Assigned Open Issues per User | Summarize                      | Aggregates count of in-progress issues per user    | For Each User                 | Sort By Most Capacity          |                                                                                                                                                |
| Sort By Most Capacity        | Sort                              | Sorts users ascending by workload                    | Count Assigned Open Issues per User | Assign User to Ticket        |                                                                                                                                                |
| Assign User to Ticket        | JIRA                              | Assigns selected user to stale issue                 | Sort By Most Capacity         | Add Comment to Issue           | [Learn more about the JIRA node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.jira/)                                        |
| Add Comment to Issue         | JIRA                              | Adds comment notifying auto-assignment               | Assign User to Ticket         | For Each Issue                |                                                                                                                                                |
| Skip                        | NoOp                              | Skips issues with no similar resolved issues found | If has Items? (False branch)  | For Each Issue                | ### What if no similar issues are found? This is beyond the scope of this template so we'll skip the issue but consider escalation options.      |
| Sticky Notes                | Sticky Note                       | Provides explanatory notes and documentation links  |                                |                                 | Multiple notes provide context on JIRA usage, Supabase vector store, AI agent logic, scheduling, and workflow overview.                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Schedule Trigger" node**  
   - Type: Schedule Trigger  
   - Configure interval (e.g., daily)  
   - Connect output to "Last 50 Resolved"

2. **Create "Last 50 Resolved" node**  
   - Type: JIRA  
   - Operation: getAll  
   - JQL: `project = "My Kanban Project" AND status = "Done" AND assignee IS NOT EMPTY AND created >= -1d`  
   - Credentials: Configure JIRA Software Cloud OAuth2  
   - Connect output to "Remove Duplicates"

3. **Create "Remove Duplicates" node**  
   - Type: Remove Duplicates  
   - Operation: removeItemsSeenInPreviousExecutions  
   - Dedupe value: `{{$json.key}}`  
   - Connect output to "Collect Fields"

4. **Create "Collect Fields" node**  
   - Type: Set  
   - Assign variables:  
     - project_key = `{{$json.fields.project.key}}`  
     - issue_key = `{{$json.key}}`  
     - issue_type = `{{$json.fields.issuetype.name}}`  
     - created_date = `{{$json.fields.created}}`  
     - resolution_date = `{{$json.fields.resolutiondate}}`  
     - assignee_id = `{{$json.fields.assignee.accountId}}`  
     - assignee_name = `{{$json.fields.assignee.displayName}}`  
     - title = `{{$json.fields.summary}}`  
     - description = `{{$json.fields.description}}`  
   - Connect output to "Recursive Character Text Splitter"

5. **Create "Recursive Character Text Splitter" node**  
   - Type: Langchain Text Splitter  
   - Use default options  
   - Connect output to "Default Data Loader"

6. **Create "Default Data Loader" node**  
   - Type: Langchain Document Data Loader  
   - Set JSON data expression:  
     ```
     # {{$json.title}}
     - created {{$json.created_date}}
     - resolved {{$json.resolution_date}}

     ## description
     {{$json.description}}
     ```  
   - Add metadata fields as per collected fields  
   - Connect output to "Embeddings OpenAI"

7. **Create "Embeddings OpenAI" node**  
   - Type: Langchain OpenAI Embeddings  
   - Credentials: OpenAI API key  
   - Connect output to "Issues Similarity Database"

8. **Create "Issues Similarity Database" node**  
   - Type: Langchain Supabase Vector Store  
   - Mode: insert  
   - Table name: "documents"  
   - Credentials: Supabase API key  
   - Connect output to end of flow

9. **Create "Schedule Trigger1" node**  
   - Type: Schedule Trigger  
   - Configure interval (e.g., hourly or daily)  
   - Connect output to "Get Unassigned Tickets more than 5 days"

10. **Create "Get Unassigned Tickets more than 5 days" node**  
    - Type: JIRA  
    - Operation: getAll  
    - JQL: `project = "My Kanban Project" AND status = "To Do" AND assignee IS EMPTY AND assignee CHANGED BEFORE -5d`  
    - Credentials: JIRA Software Cloud OAuth2  
    - Connect output to "For Each Issue"

11. **Create "For Each Issue" node**  
    - Type: Split in Batches  
    - Connect output to "Issue Ref" and "Skip" (false path)

12. **Create "Issue Ref" node**  
    - Type: NoOp  
    - Connect output to "Find Similar Issues + Assignees"

13. **Create "Find Similar Issues + Assignees" node**  
    - Type: Langchain Agent  
    - Parameters:  
      - Text input: `{{$json.fields.summary}}\n\n## description\n{{$json.fields.description}}`  
      - System message: instruct to find similar resolved issues and list issue_key, assignee_id, assignee_name  
    - Connect output to "To Structured Output"  
    - Configure with OpenAI Chat Model and Supabase Vector Store as tools

14. **Create "Supabase Vector Store" node**  
    - Type: Langchain Supabase Vector Store  
    - Mode: retrieve-as-tool  
    - Table name: "documents"  
    - TopK: 20  
    - Credentials: Supabase API key  
    - Used internally by Agent node

15. **Create "OpenAI Chat Model" node**  
    - Type: Langchain LLM Chat Model  
    - Model: "gpt-4o-mini"  
    - Credentials: OpenAI API key  
    - Used internally by Agent node

16. **Create "To Structured Output" node**  
    - Type: Langchain Information Extractor  
    - Text input: `{{$json.output}}`  
    - Schema: array of objects with required fields issue_key, assignee_id, assignee_name  
    - Connect output to "Issues to Items"

17. **Create "Issues to Items" node**  
    - Type: Split Out  
    - Field to split out: "output"  
    - Connect output to "If has Items?"

18. **Create "If has Items?" node**  
    - Type: If  
    - Condition: JSON not empty  
    - True branch to "For Each User"  
    - False branch to "Skip"

19. **Create "For Each User" node**  
    - Type: Split in Batches  
    - Connect outputs to "Count Assigned Open Issues per User" and "Check User Workflow"

20. **Create "Check User Workflow" node**  
    - Type: JIRA  
    - Operation: getAll  
    - JQL: `status = "In Progress" AND assignee = "{{$json.assignee_id}}"`  
    - Credentials: JIRA Software Cloud OAuth2  
    - Connect output to "Tally In-Progress Issues per User"

21. **Create "Tally In-Progress Issues per User" node**  
    - Type: Set  
    - Assign:  
      - assignee_id = `{{$json.assignee_id}}`  
      - in_progress = `{{$json.isNotEmpty() ? 1 : 2}}` (logic flag)  
    - Connect output back to "For Each User" (loop)

22. **Create "Count Assigned Open Issues per User" node**  
    - Type: Summarize  
    - Group by: assignee_id  
    - Summarize field: count of in_progress  
    - Connect output to "Sort By Most Capacity"

23. **Create "Sort By Most Capacity" node**  
    - Type: Sort  
    - Sort by: count_in_progress ascending (lowest workload first)  
    - Connect output to "Assign User to Ticket"

24. **Create "Assign User to Ticket" node**  
    - Type: JIRA  
    - Operation: update  
    - Issue Key: `{{$node["Issue Ref"].json.key}}`  
    - Update fields: assignee = selected assignee_id  
    - Credentials: JIRA Software Cloud OAuth2  
    - Connect output to "Add Comment to Issue"

25. **Create "Add Comment to Issue" node**  
    - Type: JIRA  
    - Operation: create comment  
    - Issue Key: `{{$node["Issue Ref"].json.key}}`  
    - Comment: `Auto-assigned to {{$json.assignee_name}} due to no assignee within past 5 days.`  
    - Credentials: JIRA Software Cloud OAuth2  
    - Connect output to "For Each Issue" (continue loop)

26. **Create "Skip" node**  
    - Type: NoOp  
    - Connect output to "For Each Issue" (continue loop)

27. **Add Sticky Notes** at appropriate places with provided content and links for user guidance.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                 | Context or Link                                                                                                          |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| This workflow template automates JIRA ticket assignment using AI and vector search to reduce manual backlog management.                                                                                                      | Workflow overview section                                                                                                |
| Learn more about the JIRA node in n8n: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.jira/                                                                                                               | Sticky Notes for JIRA nodes                                                                                              |
| Supabase supports vector databases via Pg-Vector extension; see Langchain quickstart: https://supabase.com/docs/guides/ai/langchain?database-method=sql                                                                       | Sticky Note on Supabase vector store                                                                                     |
| Scheduled Trigger documentation: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/                                                                                                          | Sticky Note on scheduling                                                                                                 |
| AI Agents documentation: https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/                                                                                                         | Sticky Note on AI agent usage                                                                                            |
| For help and community support, join n8n Discord: https://discord.com/invite/XPKeKXeB7d or n8n Forum: https://community.n8n.io/                                                                                                | General support and community resources                                                                                  |
| If no similar issues are found during assignment, escalation to a project manager or manual intervention is recommended.                                                                                                      | Sticky Note near "Skip" node                                                                                              |
| This template can be customized for other issue trackers (e.g., Linear) or vector stores (e.g., Qdrant) by replacing JIRA and Supabase nodes accordingly.                                                                     | Customization notes in description                                                                                       |
| Consider extending assignment logic with additional criteria such as department, team availability, or HR leave data to improve accuracy and fairness.                                                                         | Customization notes in description                                                                                       |

---

This structured documentation provides a complete understanding of the workflow’s architecture, node configurations, logic flow, and guidance for reproduction or modification by developers and AI agents.