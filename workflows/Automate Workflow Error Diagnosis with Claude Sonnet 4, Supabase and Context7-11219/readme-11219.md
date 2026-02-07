Automate Workflow Error Diagnosis with Claude Sonnet 4, Supabase and Context7

https://n8nworkflows.xyz/workflows/automate-workflow-error-diagnosis-with-claude-sonnet-4--supabase-and-context7-11219


# Automate Workflow Error Diagnosis with Claude Sonnet 4, Supabase and Context7

### 1. Workflow Overview

This workflow automates error monitoring, diagnosis, and notification for n8n workflows using AI-enhanced analysis. When any monitored workflow encounters an error, the system automatically captures detailed error and execution data, stores it in a Supabase database, analyzes the error by searching official n8n documentation through Context7 and Claude Sonnet 4 (via OpenRouter), and sends a styled email notification with root cause, fix, and prevention tips.

The workflow is logically divided into these blocks:

- **1.1 Error Capture:** Triggered on any workflow error; fetches workflow and execution details, structures error data.
- **1.2 Database Lookup & Logging:** Checks if the workflow is registered in Supabase; inserts error records or creates workflow entries; updates error statistics.
- **1.3 AI-Powered Analysis:** Uses Context7 and Claude Sonnet 4 to analyze the error in the context of official docs, producing actionable insights.
- **1.4 Notification Preparation & Delivery:** Formats analysis and error details into a professional HTML email, sends it via SMTP, and marks the error as notified.

Supporting nodes provide setup instructions, Supabase schema, and optional customization guidance.

---

### 2. Block-by-Block Analysis

#### 2.1 Error Capture

**Overview:**  
This block triggers when any workflow fails, fetches detailed workflow and execution data from n8n API, and structures this information for further processing.

**Nodes Involved:**  
- Workflow Error (Error Trigger)  
- Get Workflow (n8n API)  
- Get Execution (n8n API)  
- Structure Error Data (Code)

**Node Details:**

- **Workflow Error**  
  - Type: Error Trigger  
  - Role: Entry point; activates workflow on any n8n workflow failure  
  - Config: Default settings, no parameters  
  - Input: External error events  
  - Output: Raw error event JSON with workflow and execution IDs  
  - Edge Cases: May miss errors if API access is disabled or error data incomplete

- **Get Workflow**  
  - Type: n8n API node (n8n)  
  - Role: Retrieves the full workflow JSON structure for the failed workflow  
  - Config: Operation "get" with workflowId from error trigger output  
  - Input: Error trigger JSON  
  - Output: Workflow JSON object  
  - Edge Cases: API auth failure, missing workflow, network timeout

- **Get Execution**  
  - Type: n8n API node (n8n)  
  - Role: Fetches detailed execution data including error messages and stack trace  
  - Config: Operation "get" with executionId from error trigger output  
  - Input: Output of Get Workflow node  
  - Output: Execution JSON object  
  - Edge Cases: Execution might be missing or incomplete; API errors

- **Structure Error Data**  
  - Type: Code (JavaScript)  
  - Role: Consolidates relevant error, execution, and workflow data into a clean JSON object  
  - Config: Extracts key fields: workflow ID/name, error message, stack trace, failed node, execution id/url, serializes workflow and execution JSON  
  - Key variables: `$json.workflow.id`, `$json.execution.error.message`, `$json.execution.lastNodeExecuted`  
  - Input: Output from Get Execution node  
  - Output: Structured JSON for database and AI nodes  
  - Edge Cases: Missing fields fallback to defaults like "Unknown" or "manual"

---

#### 2.2 Database Lookup & Logging

**Overview:**  
Checks if the failed workflow is known in Supabase. If yes, logs the error; if not, creates a new workflow entry. Updates error count and last error timestamp.

**Nodes Involved:**  
- Find Workflow (Supabase)  
- Workflow Exists? (If)  
- Insert Error (Supabase)  
- Create Workflow (Supabase)  
- Update Statistics (Supabase)  
- Workflow Creation (SplitInBatches)

**Node Details:**

- **Find Workflow**  
  - Type: Supabase (getAll)  
  - Role: Queries "workflows" table for a record matching the n8n_workflow_id from structured error data  
  - Config: Filter by n8n_workflow_id equals structured error data’s workflow id; limit 1  
  - Input: Structured error data  
  - Output: Workflow record(s) if exists, else empty array  
  - Edge Cases: Supabase connection errors, empty results

- **Workflow Exists?**  
  - Type: If (boolean)  
  - Role: Checks if a workflow record was found (workflow_id defined)  
  - Config: Condition checks if `workflow_id` in first input item is not undefined  
  - Input: Output of Find Workflow  
  - Output: Two branches: true → Insert Error, false → Create Workflow  
  - Edge Cases: Improper data structure causing false negatives

- **Insert Error**  
  - Type: Supabase (insert)  
  - Role: Inserts a new error record linked to the existing workflow  
  - Config: Maps error fields from structured data (error_message, error_stack, failed_node, execution data, etc.) and workflow_id from Find Workflow  
  - Input: True branch of Workflow Exists? node  
  - Output: Inserted error record with error_id  
  - Edge Cases: DB write errors, data type mismatches

- **Create Workflow**  
  - Type: Supabase (insert)  
  - Role: Creates new workflow record if not found previously  
  - Config: Inserts n8n_workflow_id and workflow_name from structured error data  
  - Input: False branch of Workflow Exists? node  
  - Output: New workflow record  
  - Edge Cases: Duplicate key errors if concurrent inserts, DB connectivity

- **Update Statistics**  
  - Type: Supabase (update)  
  - Role: Updates workflows table with incremented error_count and current timestamp for last_error_at  
  - Config: Filters by workflow_id from Find Workflow; error_count increments by 1 or defaults to 0 + 1; last_error_at set to current ISO timestamp  
  - Input: Output from Insert Error  
  - Output: Updated workflow record  
  - Edge Cases: Race conditions on error_count updates, DB write failures

- **Workflow Creation**  
  - Type: SplitInBatches  
  - Role: After creating workflow, triggers a search again for the new workflow to continue processing  
  - Config: Default batch options; executes once per workflow created  
  - Input: Output of Create Workflow  
  - Output: Feeds back into Find Workflow  
  - Edge Cases: Potential loops if not handled properly

---

#### 2.3 AI-Powered Analysis

**Overview:**  
Utilizes Context7 to search official n8n documentation for the failed node and error message, then runs Claude Sonnet 4 (via OpenRouter) to generate root cause, fix, and prevention tips. Saves AI analysis back to Supabase.

**Nodes Involved:**  
- AI Agent (Langchain agent)  
- OpenRouter (LM Chat)  
- Context7 (MCP Client Tool)  
- Save Analysis (Supabase update)

**Node Details:**

- **AI Agent**  
  - Type: Langchain Agent  
  - Role: Orchestrates AI analysis using Context7 as a documentation search tool, then Claude Sonnet 4 model for error diagnosis  
  - Config: Defines prompt with error context, instructs to use Context7 before answering, expects 3-part response (cause, fix, prevention) under 200 words  
  - Inputs: Structured error data, Context7 results, OpenRouter LM  
  - Outputs: AI-generated text analysis  
  - Edge Cases: API key limits, Context7 timeout (set to 60s), OpenRouter token limits, prompt errors

- **OpenRouter**  
  - Type: Langchain LM Chat  
  - Role: Provides AI language model access to Claude Sonnet 4 with controlled temperature and max tokens  
  - Config: Model "anthropic/claude-sonnet-4", maxTokens=1000, temperature=0.3  
  - Inputs: AI Agent node  
  - Outputs: Language model completions  
  - Edge Cases: Model availability, network errors, rate limiting

- **Context7**  
  - Type: Langchain MCP Client Tool  
  - Role: Searches the official n8n documentation libraries for relevant info about the failed node and error message  
  - Config: Endpoint URL https://mcp.context7.com/mcp, includes resolve-library-id and get-library-docs tools, 60 seconds timeout, header authentication with API key  
  - Inputs: AI Agent node requesting doc search  
  - Outputs: Documentation snippets for AI Agent to use  
  - Edge Cases: Authentication errors, API downtime, incomplete docs

- **Save Analysis**  
  - Type: Supabase (update)  
  - Role: Updates the error record with AI analysis text  
  - Config: Filters by error_id from Insert Error node, updates ai_analysis field with AI Agent output  
  - Inputs: AI Agent output, error record from Insert Error  
  - Outputs: Updated error record  
  - Edge Cases: DB update failures, missing error_id

---

#### 2.4 Notification Preparation & Delivery

**Overview:**  
Formats the error and AI analysis into a styled HTML email and sends it via SMTP. Marks the error as notified to avoid duplicate alerts.

**Nodes Involved:**  
- Format Notification (Code)  
- Build HTML (Code)  
- Send Error Email (SMTP)  
- Mark Notified (Supabase update)

**Node Details:**

- **Format Notification**  
  - Type: Code (JavaScript)  
  - Role: Prepares JSON object combining workflow info, error details, AI analysis, and error ID for email rendering  
  - Config: Extracts fields from Find/Create Workflow, Insert Error, and AI Agent nodes; truncates error message to 300 chars  
  - Input: Save Analysis output  
  - Output: JSON with email data (workflow_name, failed_node, error_message, execution_url, ai_analysis, error_id)  
  - Edge Cases: Missing fields fallback handled gracefully

- **Build HTML**  
  - Type: Code (JavaScript)  
  - Role: Generates clean, styled HTML email body with dynamic content and formatted AI analysis  
  - Config: Converts markdown bold to HTML, highlights code snippets, cleans AI preambles, styles sections (Root Cause, Fix, Prevention), produces full HTML email layout with call-to-action button linking to execution URL  
  - Input: Format Notification output  
  - Output: JSON with `html_body` field added  
  - Edge Cases: Malformed AI text, missing URLs

- **Send Error Email**  
  - Type: Email Send (SMTP)  
  - Role: Sends the formatted HTML email to configured recipients  
  - Config: Subject includes workflow name, HTML body from previous node, no attribution appended  
  - Credentials: SMTP server credentials configured externally  
  - Input: Build HTML output  
  - Output: Email sent confirmation  
  - Edge Cases: SMTP auth errors, network issues, email bounces

- **Mark Notified**  
  - Type: Supabase (update)  
  - Role: Marks the error record as notified to prevent repeated alerts  
  - Config: Filters by error_id from Insert Error, sets `notified` boolean to true  
  - Input: Send Error Email output  
  - Output: Updated error record  
  - Edge Cases: DB update failures, concurrency issues

---

### 3. Summary Table

| Node Name         | Node Type                        | Functional Role                           | Input Node(s)               | Output Node(s)               | Sticky Note                                                                                                         |
|-------------------|---------------------------------|-----------------------------------------|-----------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------------|
| Workflow Error    | Error Trigger                   | Entry point, triggers on workflow error | External                    | Get Workflow                | AI-Powered Error Monitor overview; Setup instructions node                                                       |
| Get Workflow      | n8n API                        | Fetch workflow JSON                      | Workflow Error              | Get Execution               | Step 1 - Capture Error overview                                                                                     |
| Get Execution     | n8n API                        | Fetch execution details                  | Get Workflow                | Structure Error Data        | Step 1 - Capture Error overview                                                                                     |
| Structure Error Data | Code (JS)                    | Consolidate error & execution data      | Get Execution               | Find Workflow               | Step 1 - Capture Error overview                                                                                     |
| Find Workflow     | Supabase                       | Check workflow in DB                     | Structure Error Data        | Workflow Exists?            | Step 2 - Check Database overview                                                                                    |
| Workflow Exists?  | If                            | Branch based on workflow presence       | Find Workflow               | Insert Error / Create Workflow | Step 2 - Check Database overview                                                                                   |
| Insert Error      | Supabase                       | Insert error record for existing workflow | Workflow Exists? (true)     | Update Statistics           | Step 2 - Check Database overview                                                                                    |
| Create Workflow   | Supabase                       | Create new workflow record               | Workflow Exists? (false)    | Workflow Creation           | Step 2 - Check Database overview                                                                                    |
| Workflow Creation | SplitInBatches                | Re-query newly created workflow          | Create Workflow             | Find Workflow (loop back)   | Step 2 - Check Database overview                                                                                    |
| Update Statistics | Supabase                       | Update workflow error stats              | Insert Error                | AI Agent                   | Step 2 - Check Database overview                                                                                    |
| AI Agent          | Langchain Agent                | Perform AI error analysis using Context7 and Claude Sonnet 4 | Update Statistics, Context7, OpenRouter | Save Analysis             | Step 3 - AI Analysis overview                                                                                       |
| OpenRouter        | Langchain LM Chat             | AI language model access (Claude Sonnet 4) | AI Agent                   | AI Agent (response)         | Step 3 - AI Analysis overview                                                                                       |
| Context7          | Langchain MCP Client Tool     | Search official n8n documentation       | AI Agent                    | AI Agent (docs)             | Step 3 - AI Analysis overview                                                                                       |
| Save Analysis     | Supabase                      | Store AI analysis in error record        | AI Agent                    | Format Notification         | Step 3 - AI Analysis overview                                                                                       |
| Format Notification | Code (JS)                   | Prepare data for email formatting         | Save Analysis               | Build HTML                  | Step 4 - Send Notification overview                                                                                 |
| Build HTML        | Code (JS)                    | Generate styled HTML email body           | Format Notification         | Send Error Email            | Step 4 - Send Notification overview                                                                                 |
| Send Error Email  | Email (SMTP)                 | Send error notification email             | Build HTML                  | Mark Notified               | Step 4 - Send Notification overview                                                                                 |
| Mark Notified     | Supabase                     | Flag error as notified                     | Send Error Email            | -                          | Step 4 - Send Notification overview                                                                                 |
| Main Overview     | Sticky Note                  | Workflow purpose & setup summary          | -                          | -                          | AI-Powered Error Monitor overview                                                                                   |
| Supabase Setup    | Sticky Note                  | SQL schema creation instructions          | -                          | -                          | Supabase Setup instructions                                                                                         |
| Setup Instructions | Sticky Note                 | Setup steps for credentials and activation | -                          | -                          | Setup Instructions for API, Supabase, OpenRouter, Context7, SMTP                                                     |
| Step 1            | Sticky Note                  | Describes Step 1 error capture             | -                          | -                          | Step 1: Capture Error                                                                                               |
| Step 2            | Sticky Note                  | Describes Step 2 database check and logging | -                          | -                          | Step 2: Check Database                                                                                              |
| Step 3            | Sticky Note                  | Describes Step 3 AI analysis                | -                          | -                          | Step 3: AI Analysis                                                                                                |
| Step 4            | Sticky Note                  | Describes Step 4 email notification         | -                          | -                          | Step 4: Send Notification                                                                                           |
| Quick Customization | Sticky Note                | Guidance on switching to Slack/Discord and cost reduction | -                          | -                          | Optional Customization instructions                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Error Trigger Node:**  
   - Type: Error Trigger  
   - Purpose: Trigger workflow on any n8n workflow failure  
   - No special parameters

2. **Add "Get Workflow" Node:**  
   - Type: n8n API node  
   - Operation: Get workflow by ID  
   - Parameter: Use expression `{{$json["workflow"]["id"]}}` to retrieve failed workflow ID  
   - Credentials: Configure n8n API credentials with your instance URL and API key  
   - Connect: Error Trigger → Get Workflow

3. **Add "Get Execution" Node:**  
   - Type: n8n API node  
   - Operation: Get execution by ID  
   - Parameter: Expression `{{$json["execution"]["id"]}}` from Get Workflow output  
   - Credentials: Same as above  
   - Connect: Get Workflow → Get Execution

4. **Add "Structure Error Data" Node (Code):**  
   - Type: Code (JavaScript)  
   - Purpose: Extract and consolidate error info, workflow JSON, and execution JSON  
   - Key code: Extract workflow id/name, error message, stack, failed node, execution id/url, stringify workflow and execution JSON  
   - Connect: Get Execution → Structure Error Data

5. **Add "Find Workflow" Node:**  
   - Type: Supabase (getAll)  
   - Parameters: Table = "workflows", filter where `n8n_workflow_id` equals `{{$json["n8n_workflow_id"]}}`, limit 1  
   - Credentials: Supabase API with service role key  
   - Connect: Structure Error Data → Find Workflow

6. **Add "Workflow Exists?" Node:**  
   - Type: If node (boolean)  
   - Condition: Check if `{{$input.first().json.workflow_id !== undefined}}` is true  
   - Connect: Find Workflow → Workflow Exists?

7. **Add "Insert Error" Node:**  
   - Type: Supabase (insert)  
   - Table: "errors"  
   - Map fields from Structure Error Data and Find Workflow output: workflow_id, error_message, error_stack, failed_node, execution_id, execution_url, workflow_json, execution_data  
   - Credentials: Supabase API  
   - Connect: Workflow Exists? (true) → Insert Error

8. **Add "Create Workflow" Node:**  
   - Type: Supabase (insert)  
   - Table: "workflows"  
   - Fields: n8n_workflow_id, workflow_name from Structure Error Data  
   - Credentials: Supabase API  
   - Connect: Workflow Exists? (false) → Create Workflow

9. **Add "Workflow Creation" Node:**  
   - Type: SplitInBatches  
   - Purpose: After creating workflow, re-query it to proceed  
   - Connect: Create Workflow → Workflow Creation

10. **Connect Workflow Creation's second output (empty batch) to Find Workflow**  
    - Connect: Workflow Creation → Find Workflow (loop back)

11. **Add "Update Statistics" Node:**  
    - Type: Supabase (update)  
    - Table: "workflows"  
    - Filter: workflow_id equals Find Workflow workflow_id  
    - Fields: error_count incremented by 1 or set to 1, last_error_at set to current timestamp (ISO format)  
    - Credentials: Supabase API  
    - Connect: Insert Error → Update Statistics

12. **Add "AI Agent" Node:**  
    - Type: Langchain Agent  
    - Text prompt: Includes instructions to use Context7 to search n8n docs for failed_node and error_message from structured data, then analyze error and suggest fix and prevention  
    - System Message: Enforce Context7 usage, require concise cause, fix, prevention output  
    - Connect: Update Statistics → AI Agent

13. **Add "OpenRouter" Node:**  
    - Type: Langchain LM Chat  
    - Model: "anthropic/claude-sonnet-4"  
    - Parameters: maxTokens 1000, temperature 0.3  
    - Credentials: OpenRouter API with your key  
    - Connect: AI Agent (ai_languageModel input) → OpenRouter

14. **Add "Context7" Node:**  
    - Type: Langchain MCP Client Tool  
    - Endpoint: https://mcp.context7.com/mcp  
    - Tools: resolve-library-id, get-library-docs  
    - Timeout: 60000 ms  
    - Credentials: HTTP Header Auth with Bearer token  
    - Connect: AI Agent (ai_tool input) → Context7

15. **Add "Save Analysis" Node:**  
    - Type: Supabase (update)  
    - Table: "errors"  
    - Filter: error_id equals Insert Error error_id  
    - Field: ai_analysis set to AI Agent output text  
    - Credentials: Supabase API  
    - Connect: AI Agent → Save Analysis

16. **Add "Format Notification" Node (Code):**  
    - Type: Code (JavaScript)  
    - Purpose: Prepare JSON for email including truncated error_message, workflow name, failed node, execution_url, AI analysis, error_id  
    - Connect: Save Analysis → Format Notification

17. **Add "Build HTML" Node (Code):**  
    - Type: Code (JavaScript)  
    - Purpose: Generate styled HTML email body with formatted AI analysis and error details  
    - Connect: Format Notification → Build HTML

18. **Add "Send Error Email" Node:**  
    - Type: Email Send (SMTP)  
    - Subject: "Workflow Error: {{ $json.workflow_name }}"  
    - HTML body: From Build HTML output  
    - Credentials: SMTP with your provider credentials  
    - Connect: Build HTML → Send Error Email

19. **Add "Mark Notified" Node:**  
    - Type: Supabase (update)  
    - Table: "errors"  
    - Filter: error_id equals Insert Error error_id  
    - Field: notified set to true  
    - Credentials: Supabase API  
    - Connect: Send Error Email → Mark Notified

20. **Add Sticky Notes:**  
    - "Main Overview" describing workflow purpose and blocks  
    - "Supabase Setup" with SQL schema for workflows and errors tables  
    - "Setup Instructions" with detailed steps for all credentials and activation  
    - Step-specific notes near related nodes  
    - Optional customization note for Slack/Discord switching and token optimization

21. **Activate Workflow**

22. **For each workflow to monitor:**  
    - Open workflow settings in n8n → Error Workflow → Select this AI-Powered Error Monitor workflow → Save

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                  | Context or Link                                            |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| SQL schema for Supabase creates `workflows` and `errors` tables with appropriate indexes and row-level security for secure and performant error tracking.                                                                    | Supabase Setup Sticky Note                                  |
| Setup requires enabling n8n API access with API key and base URL configured in n8n API credential node.                                                                                                                       | Setup Instructions Sticky Note                             |
| OpenRouter API key needed for Claude Sonnet 4 access; costs approximately $0.01 per error analysis.                                                                                                                           | Setup Instructions Sticky Note                             |
| Context7 API key required to search official n8n documentation before AI analysis is performed, ensuring accurate and up-to-date troubleshooting advice.                                                                      | Setup Instructions Sticky Note                             |
| SMTP credentials must be configured in the Send Error Email node for sending notifications.                                                                                                                                   | Setup Instructions Sticky Note                             |
| Optional customization allows replacing the email notification with Slack or Discord messages by removing the HTML build node and connecting to preferred communication node. Token cost can be reduced by omitting workflow and execution JSON from the AI prompt. | Quick Customization Sticky Note                            |
| Workflow error notification email includes clickable link to execution details, AI-generated root cause, fix, and prevention tips styled professionally for clarity.                                                           | Build HTML Node Code                                        |
| Workflow supports multiple monitored workflows; errors are tracked individually with statistics and unique error IDs for pattern analysis.                                                                                   | Main Overview Sticky Note                                  |

---

**Disclaimer:** The provided content is exclusively derived from an automated n8n workflow. All data processed is legal and publicly accessible. The workflow respects current content policies and does not include any illegal or protected information.