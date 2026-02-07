AI-Powered Ticket Triage with Multi-Model Classification & Knowledge Base

https://n8nworkflows.xyz/workflows/ai-powered-ticket-triage-with-multi-model-classification---knowledge-base-11854


# AI-Powered Ticket Triage with Multi-Model Classification & Knowledge Base

### 1. Workflow Overview

This workflow automates IT helpdesk ticket triage by leveraging multiple AI models for classification, knowledge base search, and solution generation. It is designed to handle incoming tickets, classify them, search for existing solutions in a knowledge base, generate new solutions if none exist, update ticket statuses, notify engineers if necessary, and enrich the knowledge base with new resolved cases. The logical flow is segmented into the following blocks:

- **1.1 Input Reception & Configuration:** Receives incoming tickets via webhook and sets up configuration parameters.
- **1.2 Ticket Classification & Knowledge Base Search:** Classifies the ticket type using AI agents and searches the knowledge base for existing solutions.
- **1.3 Conditional Routing & Solution Generation:** Decides if an existing solution suffices or if AI needs to generate a new solution.
- **1.4 Post-Processing & Escalation:** Formats auto-resolutions, updates ticket status in the database, and determines if engineer notification is needed.
- **1.5 Knowledge Base Enrichment:** Prepares and inserts new resolved ticket data into the knowledge base for continuous learning.
- **1.6 Diagnostic Logging:** Creates detailed diagnostic logs for monitoring and quality assurance.

This end-to-end automation targets support operations teams and enterprises aiming to reduce manual ticket sorting, accelerate resolution times, and maintain high-quality, consistent support.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Configuration

**Overview:**  
This block receives incoming support tickets through a webhook and sets essential configuration parameters for downstream nodes, such as database connection details and notification channels.

**Nodes Involved:**  
- Incoming Ticket Webhook  
- Workflow Configuration

**Node Details:**

- **Incoming Ticket Webhook**  
  - *Type:* Webhook  
  - *Role:* Entry point capturing POST requests containing ticket data.  
  - *Configuration:*  
    - Path: `helpdesk-YOUR_OPENAI_KEY_HERE` (replace placeholder with actual path).  
    - HTTP Method: POST  
    - Response Mode: Last node’s output.  
  - *Inputs:* External HTTP POST request.  
  - *Outputs:* Ticket JSON forwarded downstream.  
  - *Failures:* Invalid/malformed requests, incorrect webhook path.  
  - *Notes:* Secure webhook path to prevent unauthorized access.

- **Workflow Configuration**  
  - *Type:* Set  
  - *Role:* Defines static configuration variables for the workflow such as PostgreSQL vector table name, host, database, and Slack channel ID.  
  - *Configuration:*  
    - `pgVectorTable`: "helpdesk_knowledge_base"  
    - `pgVectorHost`: Placeholder for PostgreSQL host  
    - `pgVectorDatabase`: Placeholder for DB name  
    - `slackChannel`: Placeholder Slack channel ID for engineer notifications  
  - *Inputs:* Ticket data from webhook  
  - *Outputs:* Passes ticket data enriched with configuration parameters  
  - *Failures:* Missing or incorrect configuration values may cause downstream failures.

---

#### 1.2 Ticket Classification & Knowledge Base Search

**Overview:**  
Classifies the ticket type using a LangChain AI agent that relies on OpenAI’s GPT-4.1-mini model. Simultaneously, it uses embedding-based search to find similar tickets in the knowledge base, enhancing classification accuracy and solution retrieval.

**Nodes Involved:**  
- Ticket Classifier Agent  
- OpenAI Chat Model - Classifier  
- Classification Output Parser  
- Knowledge Base Search  
- Embeddings OpenAI - Search  
- MCP Server Tools

**Node Details:**

- **Ticket Classifier Agent**  
  - *Type:* LangChain AI Agent  
  - *Role:* Uses structured prompt to analyze ticket details, classify ticket type, search knowledge base, and decide if new solution generation is required.  
  - *Configuration:*  
    - Input text: Ticket details including title, description, priority, reporter.  
    - System message defines detailed classification and solution search instructions.  
    - Output parser enabled for structured JSON response.  
  - *Inputs:* Ticket data + knowledge base search results via AI tool inputs.  
  - *Outputs:* Parsed classification results including ticket type, solutionFound flag, confidence score.  
  - *Failures:* AI model timeout, API quota limits, malformed input data.  
  - *Version:* Requires LangChain agent version 3+.  
  - *Sub-workflow:* Integrates with OpenAI Chat Model - Classifier and Knowledge Base Search as AI tools.

- **OpenAI Chat Model - Classifier**  
  - *Type:* LangChain OpenAI Chat Model  
  - *Role:* Provides GPT-4.1-mini language model inference for classification agent.  
  - *Configuration:*  
    - Model: GPT-4.1-mini  
    - Credentials: OpenAI API key configured externally.  
  - *Inputs:* Text from Ticket Classifier Agent.  
  - *Outputs:* Raw AI response forwarded to output parser.  
  - *Failures:* API authorization errors, timeouts.

- **Classification Output Parser**  
  - *Type:* LangChain Structured Output Parser  
  - *Role:* Parses AI textual output into structured JSON fields like ticketType, category, solutionFound, solution, confidence, reasoning.  
  - *Configuration:* JSON schema example provided for expected fields.  
  - *Inputs:* AI raw output from OpenAI Chat Model - Classifier.  
  - *Outputs:* Structured classification JSON for routing decisions.

- **Knowledge Base Search**  
  - *Type:* LangChain vectorStorePGVector (PostgreSQL vector search)  
  - *Role:* Searches the IT helpdesk knowledge base using vector embeddings to find similar resolved tickets.  
  - *Configuration:*  
    - Retrieval mode: "retrieve-as-tool"  
    - Table name from workflow configuration (`helpdesk_knowledge_base`)  
    - Tool description explains its purpose for AI agents.  
  - *Inputs:* Embeddings from Embeddings OpenAI - Search node.  
  - *Outputs:* Search results as AI tool input for classifier.  
  - *Failures:* DB connection errors, missing table, malformed queries.

- **Embeddings OpenAI - Search**  
  - *Type:* LangChain Embeddings OpenAI node  
  - *Role:* Generates embeddings from incoming ticket data for vector search.  
  - *Configuration:* Uses OpenAI API credentials.  
  - *Inputs:* Ticket data text.  
  - *Outputs:* Embedding vector for Knowledge Base Search.  
  - *Failures:* API limits, network issues.

- **MCP Server Tools**  
  - *Type:* LangChain MCP Client Tool  
  - *Role:* Provides additional AI tools/endpoints integrated into classification agent for diagnostic or data gathering purposes.  
  - *Configuration:* Endpoint URL placeholder for MCP server.  
  - *Inputs:* Connected as AI tool input for Ticket Classifier Agent.  
  - *Outputs:* Diagnostic data or tool results.  
  - *Failures:* Endpoint unavailability, authentication errors.

---

#### 1.3 Conditional Routing & Solution Generation

**Overview:**  
Decides if the ticket can be auto-resolved with an existing solution or requires AI-generated solution creation. When no solution is found, the AI Solution Generator agent produces a detailed resolution plan.

**Nodes Involved:**  
- Check If Solution Found (If node)  
- Format Auto-Resolution  
- AI Solution Generator  
- OpenAI Chat Model - Solution  
- Solution Output Parser  
- MCP Server Tools1

**Node Details:**

- **Check If Solution Found**  
  - *Type:* If  
  - *Role:* Evaluates the boolean field `solutionFound` from classification output to branch the workflow.  
  - *Configuration:* Condition checks if `solutionFound` is true.  
  - *Inputs:* Classification results JSON.  
  - *Outputs:*  
    - True branch → Format Auto-Resolution  
    - False branch → AI Solution Generator  
  - *Failures:* Missing or malformed `solutionFound` field.

- **Format Auto-Resolution**  
  - *Type:* Set  
  - *Role:* Formats ticket status, resolution text, resolver identity, and resolution timestamp for database update.  
  - *Configuration:* Sets:  
    - `status`: "resolved"  
    - `resolution`: solution text from classification  
    - `resolvedBy`: "AI Auto-Resolver"  
    - `resolvedAt`: current ISO timestamp  
  - *Inputs:* Classification with solution.  
  - *Outputs:* Formatted ticket update data.  
  - *Failures:* Timestamp generation errors.

- **AI Solution Generator**  
  - *Type:* LangChain AI Agent  
  - *Role:* Generates a detailed step-by-step solution for unresolved tickets using AI.  
  - *Configuration:*  
    - Input text includes ticket details and category.  
    - System message instructs expert-level IT support resolution generation with MCP tool usage.  
    - Output parser enabled for structured solution JSON.  
  - *Inputs:* Ticket data from classification + MCP Server Tools1 as AI tool input.  
  - *Outputs:* Structured solution JSON including steps, complexity, estimated time, diagnostics.  
  - *Failures:* API timeouts, endpoint errors.

- **OpenAI Chat Model - Solution**  
  - *Type:* LangChain OpenAI Chat Model  
  - *Role:* Provides GPT-4.1-mini inference to AI Solution Generator agent.  
  - *Configuration:* Same as classifier model, with OpenAI credentials.  
  - *Inputs:* AI prompt from solution generator.  
  - *Outputs:* Raw AI solution text.  
  - *Failures:* Same as classifier model.

- **Solution Output Parser**  
  - *Type:* LangChain Structured Output Parser  
  - *Role:* Parses solution text into structured JSON containing solution, steps, complexity, estimated time, requiresEngineer flag, and diagnostic info.  
  - *Inputs:* AI raw solution text.  
  - *Outputs:* Structured solution data for downstream use.  
  - *Failures:* Parsing errors if AI response does not conform.

- **MCP Server Tools1**  
  - *Type:* LangChain MCP Client Tool  
  - *Role:* Provides diagnostic tools for AI Solution Generator agent (similar to MCP Server Tools).  
  - *Configuration:* MCP server endpoint URL placeholder.  
  - *Inputs:* AI tool input for solution generator.  
  - *Outputs:* Diagnostic data.  
  - *Failures:* Same as MCP Server Tools.

---

#### 1.4 Post-Processing & Escalation

**Overview:**  
Generates diagnostic logs, updates the ticket status in the database, and decides if engineer notification is necessary based on AI-generated solution complexity or flags.

**Nodes Involved:**  
- Create Diagnostic Logs  
- Check If Engineer Needed (If node)  
- Update Ticket Status  
- Notify Engineer  
- Prepare KB Entry

**Node Details:**

- **Create Diagnostic Logs**  
  - *Type:* Code (JavaScript)  
  - *Role:* Constructs detailed diagnostic log objects with ticket ID, classification, solution, confidence scores, AI metrics, and metadata.  
  - *Configuration:* Runs once per item, extracts key fields from input JSON, adds timestamp and workflow execution metadata.  
  - *Inputs:* Solution or resolution data from AI solution generator or classification path.  
  - *Outputs:* Enriches data with diagnosticLog field.  
  - *Failures:* JS errors if input fields missing or malformed.

- **Check If Engineer Needed**  
  - *Type:* If  
  - *Role:* Evaluates `requiresEngineer` boolean field from solution JSON to decide if escalation is required.  
  - *Configuration:* Condition checks if `requiresEngineer` is true.  
  - *Inputs:* Diagnostic logs with solution data.  
  - *Outputs:*  
    - True branch → Notify Engineer  
    - False branch → Prepare KB Entry  
  - *Failures:* Missing field or type mismatch.

- **Update Ticket Status**  
  - *Type:* PostgreSQL node  
  - *Role:* Executes SQL query to update ticket status, resolution, resolver, and resolution time in the tickets database table.  
  - *Configuration:*  
    - SQL: `UPDATE tickets SET status = '{{ $json.status }}', resolution = '{{ $json.resolution }}', resolved_by = '{{ $json.resolvedBy }}', resolved_at = '{{ $json.resolvedAt }}' WHERE id = {{ $json.ticketId }}`  
    - Operation: executeQuery  
  - *Inputs:* Formatted resolution data from Format Auto-Resolution or Prepare KB Entry.  
  - *Outputs:* Passes data forward for KB enrichment.  
  - *Failures:* DB connection/authentication errors, SQL injection risks if input not sanitized.

- **Notify Engineer**  
  - *Type:* Slack node  
  - *Role:* Sends Slack message to a configured channel notifying engineers of tickets requiring attention.  
  - *Configuration:*  
    - Text: Detailed message with ticket info, AI-generated solution, diagnostic info.  
    - Channel ID from workflow configuration.  
    - Authentication: OAuth2 Slack credentials.  
  - *Inputs:* Diagnostic logs and solution details from Check If Engineer Needed (true branch).  
  - *Outputs:* Passes data for KB entry preparation.  
  - *Failures:* Slack API errors, invalid channel ID, auth token expiration.

- **Prepare KB Entry**  
  - *Type:* Set  
  - *Role:* Formats ticket and solution data into a single knowledge base entry string.  
  - *Configuration:* Combines ticket type, issue title, description, solution, steps, complexity, and resolution timestamp into a multiline string.  
  - *Inputs:* Ticket data enriched with solution details and resolution time.  
  - *Outputs:* Passes formatted kbEntry string downstream.  
  - *Failures:* Missing fields causing incomplete entries.

---

#### 1.5 Knowledge Base Enrichment

**Overview:**  
Adds newly resolved ticket entries into the PostgreSQL-based knowledge base, enabling continuous learning and improved future search results.

**Nodes Involved:**  
- Add to Knowledge Base  
- Embeddings OpenAI - Insert  
- Document Loader

**Node Details:**

- **Add to Knowledge Base**  
  - *Type:* LangChain vectorStorePGVector  
  - *Role:* Inserts new knowledge base entries as vector embeddings into PostgreSQL table.  
  - *Configuration:*  
    - Mode: insert  
    - Table name from workflow configuration (`helpdesk_knowledge_base`)  
  - *Inputs:* Document Loader output (processed kbEntry) and embeddings from Embeddings OpenAI - Insert.  
  - *Outputs:* Confirmation or metadata of insertion.  
  - *Failures:* DB connectivity issues, insertion errors.

- **Embeddings OpenAI - Insert**  
  - *Type:* LangChain Embeddings OpenAI  
  - *Role:* Generates vector embeddings for the new knowledge base entry text.  
  - *Configuration:* Uses OpenAI API credentials.  
  - *Inputs:* Formatted kbEntry string from Prepare KB Entry node.  
  - *Outputs:* Embeddings passed to Add to Knowledge Base.  
  - *Failures:* API limits, malformed input.

- **Document Loader**  
  - *Type:* LangChain Document Default Data Loader  
  - *Role:* Converts kbEntry string into document format acceptable by vector store insert node.  
  - *Configuration:* Uses JSON mode with expression data from kbEntry.  
  - *Inputs:* kbEntry string from Prepare KB Entry.  
  - *Outputs:* Document formatted for vector insertion.  
  - *Failures:* Data formatting errors.

---

#### 1.6 Diagnostic Logging

**Overview:**  
Creates structured diagnostic logs to capture AI decision metrics, confidence scores, timestamps, and workflow metadata for auditing and monitoring.

**Nodes Involved:**  
- Create Diagnostic Logs (already described in 1.4)

---

### 3. Summary Table

| Node Name                   | Node Type                             | Functional Role                                 | Input Node(s)                | Output Node(s)                  | Sticky Note                                                                                                                        |
|-----------------------------|-------------------------------------|------------------------------------------------|------------------------------|--------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Incoming Ticket Webhook      | Webhook                             | Receives incoming tickets                       |                              | Workflow Configuration          | How It Works: Automates ticket management combining AI classification and knowledge base search.                                   |
| Workflow Configuration       | Set                                 | Defines workflow static parameters              | Incoming Ticket Webhook       | Ticket Classifier Agent         | See above.                                                                                                                        |
| Ticket Classifier Agent      | LangChain AI Agent                  | Classifies tickets and searches knowledge base | Workflow Configuration        | Check If Solution Found         | Multi-model classification block improves accuracy and solution discovery.                                                       |
| OpenAI Chat Model - Classifier | LangChain LM Chat OpenAI          | Provides GPT-4.1-mini inference for classifier | Ticket Classifier Agent       | Classification Output Parser    |                                                                                                                                   |
| Classification Output Parser | LangChain Output Parser Structured | Parses classifier AI output                      | OpenAI Chat Model - Classifier| Ticket Classifier Agent         |                                                                                                                                   |
| Knowledge Base Search        | LangChain vectorStorePGVector       | Searches knowledge base using embeddings        | Embeddings OpenAI - Search    | Ticket Classifier Agent         |                                                                                                                                   |
| Embeddings OpenAI - Search   | LangChain Embeddings OpenAI          | Generates embeddings for search                  | Ticket Classifier Agent       | Knowledge Base Search           |                                                                                                                                   |
| MCP Server Tools             | LangChain MCP Client Tool            | Provides AI diagnostic tools to classifier      |                              | Ticket Classifier Agent         |                                                                                                                                   |
| Check If Solution Found      | If                                  | Routes based on presence of existing solution   | Ticket Classifier Agent       | Format Auto-Resolution, AI Solution Generator  | Conditional Routing & Escalation: Optimizes resource allocation.                                                                |
| Format Auto-Resolution       | Set                                 | Formats auto-resolution ticket update data      | Check If Solution Found       | Update Ticket Status            |                                                                                                                                   |
| AI Solution Generator        | LangChain AI Agent                  | Generates AI solution for unresolved tickets    | Check If Solution Found (false) | Create Diagnostic Logs         | Solution Generation block automates response drafting with AI.                                                                   |
| OpenAI Chat Model - Solution | LangChain LM Chat OpenAI            | GPT-4.1-mini inference for solution generation  | AI Solution Generator         | Solution Output Parser          |                                                                                                                                   |
| Solution Output Parser       | LangChain Output Parser Structured  | Parses AI-generated solution into structured JSON | OpenAI Chat Model - Solution  | AI Solution Generator           |                                                                                                                                   |
| MCP Server Tools1            | LangChain MCP Client Tool            | Provides diagnostic tools to solution generator |                              | AI Solution Generator           |                                                                                                                                   |
| Create Diagnostic Logs       | Code                                | Builds detailed diagnostic log entries          | AI Solution Generator, Format Auto-Resolution | Check If Engineer Needed       |                                                                                                                                   |
| Check If Engineer Needed     | If                                  | Determines if engineer notification is needed   | Create Diagnostic Logs        | Notify Engineer, Prepare KB Entry | See 1.4 block for escalation rationale.                                                                                          |
| Update Ticket Status         | PostgreSQL                          | Updates ticket status and resolution in DB      | Format Auto-Resolution        | Prepare KB Entry                |                                                                                                                                   |
| Notify Engineer             | Slack                               | Sends Slack notifications to engineers          | Check If Engineer Needed      | Prepare KB Entry                |                                                                                                                                   |
| Prepare KB Entry             | Set                                 | Formats resolved ticket data for knowledge base | Check If Engineer Needed, Update Ticket Status, Notify Engineer | Document Loader, Add to Knowledge Base | Knowledge Base Enrichment block builds institutional knowledge.                                                                |
| Add to Knowledge Base       | LangChain vectorStorePGVector       | Inserts new KB entries into PostgreSQL vector DB | Document Loader, Embeddings OpenAI - Insert |                              |                                                                                                                                   |
| Embeddings OpenAI - Insert  | LangChain Embeddings OpenAI          | Generates embeddings for new KB entries          | Prepare KB Entry              | Add to Knowledge Base           |                                                                                                                                   |
| Document Loader             | LangChain Document Default Data Loader | Prepares KB entry document format                 | Prepare KB Entry              | Add to Knowledge Base           |                                                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Incoming Ticket Webhook Node**  
   - Type: Webhook  
   - Path: `helpdesk-YOUR_OPENAI_KEY_HERE` (replace with your secure path)  
   - HTTP Method: POST  
   - Response Mode: Last node's output

2. **Create Workflow Configuration Node (Set)**  
   - Define variables:  
     - `pgVectorTable` = "helpdesk_knowledge_base"  
     - `pgVectorHost` = PostgreSQL host (placeholder to real value)  
     - `pgVectorDatabase` = PostgreSQL database name  
     - `slackChannel` = Slack channel ID for notifications  
   - Connect Incoming Ticket Webhook → Workflow Configuration

3. **Create Ticket Classifier Agent (LangChain Agent)**  
   - Text input: Template with ticket details (title, description, priority, reporter)  
   - System message: Explains classification and knowledge base search tasks  
   - Prompt type: "define"  
   - Enable output parser  
   - Connect Workflow Configuration → Ticket Classifier Agent

4. **Create OpenAI Chat Model - Classifier**  
   - Model: GPT-4.1-mini  
   - Credentials: OpenAI API key  
   - Connect as AI languageModel input to Ticket Classifier Agent

5. **Create Classification Output Parser**  
   - Use JSON schema example for ticket classification results  
   - Connect AI outputParser input from OpenAI Chat Model - Classifier

6. **Create Embeddings OpenAI - Search**  
   - Credentials: OpenAI API key  
   - Generates embeddings from ticket data  
   - Connect Ticket Classifier Agent → Embeddings OpenAI - Search

7. **Create Knowledge Base Search (vectorStorePGVector)**  
   - Mode: retrieve-as-tool  
   - Table name: from workflow configuration variable  
   - Connect Embeddings OpenAI - Search embeddings output → Knowledge Base Search  
   - Connect Knowledge Base Search as AI tool input to Ticket Classifier Agent

8. **Create MCP Server Tools**  
   - Endpoint URL: MCP server endpoint (replace placeholder)  
   - Connect as AI tool input to Ticket Classifier Agent

9. **Create Check If Solution Found (If node)**  
   - Condition: `{{$json.solutionFound}}` is true  
   - Connect Ticket Classifier Agent → Check If Solution Found

10. **Create Format Auto-Resolution (Set node)**  
    - Set:  
      - `status` = "resolved"  
      - `resolution` = solution text from classification  
      - `resolvedBy` = "AI Auto-Resolver"  
      - `resolvedAt` = current timestamp (`{{$now.toISO()}}`)  
    - Connect Check If Solution Found (true) → Format Auto-Resolution

11. **Create AI Solution Generator (LangChain Agent)**  
    - Input text: Ticket details plus category and priority  
    - System message: Instructions for expert IT support solution generation with MCP tools  
    - Enable output parser  
    - Connect Check If Solution Found (false) → AI Solution Generator

12. **Create OpenAI Chat Model - Solution**  
    - Model: GPT-4.1-mini  
    - Credentials: OpenAI API key  
    - Connect as AI languageModel input to AI Solution Generator

13. **Create Solution Output Parser**  
    - Define schema for solution, steps, complexity, estimatedTime, requiresEngineer, diagnosticInfo  
    - Connect AI outputParser input from OpenAI Chat Model - Solution

14. **Create MCP Server Tools1**  
    - Endpoint URL: Same MCP server or another as needed  
    - Connect as AI tool input to AI Solution Generator

15. **Create Create Diagnostic Logs (Code node)**  
    - JavaScript code to assemble diagnostic log object with timestamps, confidence, and metadata  
    - Connect AI Solution Generator (main) and Format Auto-Resolution → Create Diagnostic Logs

16. **Create Check If Engineer Needed (If node)**  
    - Condition: `{{$json.requiresEngineer}}` is true  
    - Connect Create Diagnostic Logs → Check If Engineer Needed

17. **Create Update Ticket Status (PostgreSQL node)**  
    - Query:  
      ```
      UPDATE tickets SET status = '{{ $json.status }}', resolution = '{{ $json.resolution }}', resolved_by = '{{ $json.resolvedBy }}', resolved_at = '{{ $json.resolvedAt }}' WHERE id = {{ $json.ticketId }}
      ```  
    - Connect Format Auto-Resolution (main) → Update Ticket Status

18. **Create Notify Engineer (Slack node)**  
    - Text includes ticket info, AI solution, diagnostic info  
    - Channel ID from workflow configuration  
    - Authenticate with Slack OAuth2 credentials  
    - Connect Check If Engineer Needed (true) → Notify Engineer

19. **Create Prepare KB Entry (Set node)**  
    - Format a multiline string combining ticket category, title, description, solution, steps, complexity, resolved timestamp  
    - Connect Notify Engineer (main), Update Ticket Status (main), and Check If Engineer Needed (false) → Prepare KB Entry

20. **Create Document Loader**  
    - Input: kbEntry string  
    - Mode: JSON expression data  
    - Connect Prepare KB Entry → Document Loader

21. **Create Embeddings OpenAI - Insert**  
    - Credentials: OpenAI API key  
    - Connect Prepare KB Entry → Embeddings OpenAI - Insert

22. **Create Add to Knowledge Base (vectorStorePGVector)**  
    - Mode: insert  
    - Table name: from workflow configuration  
    - Connect Document Loader and Embeddings OpenAI - Insert → Add to Knowledge Base

23. **Connect nodes as per above workflow connections** to complete the flow.

**Credential Setup:**  
- OpenAI API key with GPT-4 access configured for all OpenAI nodes.  
- Slack OAuth2 credentials for Slack notification node.  
- PostgreSQL credentials for ticket status update and vector store nodes.  
- MCP Server API endpoint and credentials for diagnostic tools.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                      | Context or Link                                                                                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This workflow automates enterprise ticket management by combining AI-powered classification with knowledge base retrieval, reducing manual sorting by 70-80% and accelerating resolution times. Targeted at support operations teams and enterprises managing high-volume ticket queues.                                                                           | Sticky Note near Incoming Ticket Webhook                                                                                                                           |
| Customization options include swapping OpenAI models for Claude or Anthropic APIs and replacing Google Sheets with databases like PostgreSQL or Airtable.                                                                                                                                                                                                       | Sticky Note near Knowledge Base nodes                                                                                                                             |
| Prerequisites include OpenAI API with GPT access, NVIDIA API credentials for embeddings and classification, Google Sheets or equivalent for knowledge base, and a ticketing system with webhook capability.                                                                                                                                                         | Sticky Note near Workflow Configuration                                                                                                                           |
| Setup instructions recommend configuring OpenAI API keys, NVIDIA credentials, integrating ticketing and notification systems (like Slack or Gmail), and mapping custom fields to ticket schemas.                                                                                                                                                                 | Sticky Note near classification nodes                                                                                                                            |
| Conditional routing prevents unnecessary engineer notifications, optimizing resource allocation.                                                                                                                                                                                                                                                                | Sticky Note near Conditional Routing nodes                                                                                                                        |
| Solution generation automates high-quality AI-crafted resolutions with step-by-step instructions and complexity estimates.                                                                                                                                                                                                                                     | Sticky Note near AI Solution Generator                                                                                                                            |
| Knowledge base enrichment builds institutional knowledge from resolved tickets, enabling continuous improvement of AI triage quality.                                                                                                                                                                                                                           | Sticky Note near Knowledge Base nodes                                                                                                                             |
| Slack notifications use OAuth2 authentication and require correct channel IDs for engineer alerts on complex tickets.                                                                                                                                                                                                                                          | Notify Engineer node notes                                                                                                                                          |
| Diagnostic logs include AI confidence metrics and workflow metadata, essential for auditing and monitoring AI performance and support quality.                                                                                                                                                                                                                  | Create Diagnostic Logs node                                                                                                                                       |

---

This detailed reference fully describes the workflow architecture, node roles, configurations, and operational logic enabling developers or AI agents to understand, reproduce, and maintain the automated AI-powered ticket triage system.