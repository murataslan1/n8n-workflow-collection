AI Agent to chat with Airtable and analyze data

https://n8nworkflows.xyz/workflows/ai-agent-to-chat-with-airtable-and-analyze-data-2700


# AI Agent to chat with Airtable and analyze data

### 1. Workflow Overview

This workflow implements an AI-powered conversational agent designed to interact dynamically with Airtable data. It enables users to query, analyze, and visualize data stored in Airtable bases through natural language chat. The workflow is structured into several logical blocks that handle chat input reception, AI processing, dynamic data retrieval from Airtable, data aggregation and analysis, and response generation.

**Target Use Cases:**  
- Developers, data analysts, and business owners seeking conversational access to Airtable datasets.  
- Use cases involving retrieval of records, performing mathematical aggregations, and optionally generating map visualizations.  
- Enhancing user experience by managing conversational context and refining search/filter queries dynamically.

**Logical Blocks:**  
- **1.1 Input Reception & Memory Management**: Captures chat messages and manages conversational context.  
- **1.2 AI Agent Processing**: Processes user input with an AI agent that plans tool usage and orchestrates data retrieval and analysis.  
- **1.3 Tool Workflows for Airtable Interaction**: Sub-workflows and nodes that perform base listing, schema retrieval, record searching, and code-based data processing.  
- **1.4 Search Filter Generation**: Uses OpenAI to convert user filter descriptions into Airtable formula filters.  
- **1.5 Data Aggregation and Response Preparation**: Aggregates data from Airtable, handles conditional logic, and prepares final responses including file uploads and map image generation.  
- **1.6 Workflow Trigger & Command Routing**: Entry point for external commands that route to appropriate processing branches.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Memory Management

**Overview:**  
This block receives chat messages from users and maintains session-based conversational memory to provide context-aware AI responses.

**Nodes Involved:**  
- When chat message received  
- Window Buffer Memory

**Node Details:**  

- **When chat message received**  
  - Type: Chat Trigger  
  - Role: Entry point for chat messages, triggers workflow on new user input.  
  - Configuration: Uses webhook with unique ID; no special parameters.  
  - Inputs: External chat messages.  
  - Outputs: Passes chat input and session ID downstream.  
  - Edge Cases: Webhook failures, malformed input.  

- **Window Buffer Memory**  
  - Type: Memory Buffer (Langchain)  
  - Role: Stores and retrieves conversation history keyed by session ID for context retention.  
  - Configuration: Uses sessionId from chat message node as custom key.  
  - Inputs: Chat messages with session ID.  
  - Outputs: Provides memory context to AI Agent.  
  - Edge Cases: Memory overflow, session ID missing or invalid.

---

#### 2.2 AI Agent Processing

**Overview:**  
Processes user input using an AI agent configured with OpenAI chat model and orchestrates tool invocations to fulfill user requests.

**Nodes Involved:**  
- OpenAI Chat Model  
- AI Agent

**Node Details:**  

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat Model  
  - Role: Provides language model capabilities for AI Agent.  
  - Configuration: Uses OpenAI API credentials; default options.  
  - Inputs: Connected as language model for AI Agent.  
  - Outputs: Generates AI responses and tool invocation plans.  
  - Edge Cases: API rate limits, authentication errors.

- **AI Agent**  
  - Type: Langchain Agent  
  - Role: Core AI agent that interprets user input, plans tool usage, and executes workflows accordingly.  
  - Configuration:  
    - Text input from chat message node.  
    - Agent type: openAiFunctionsAgent.  
    - Max iterations: 10 (limits planning steps).  
    - System message instructs agent to:  
      - Act as Airtable assistant.  
      - Validate base/table IDs before queries.  
      - Use code function for math aggregations and graph generation.  
      - Retry searches without filters if filtered search fails.  
      - Confirm completeness and correctness before responding.  
      - Always include base and table names in responses.  
  - Inputs: Chat input text, memory context, OpenAI chat model.  
  - Outputs: Invokes tool workflows (search, code, map, base listing, schema retrieval).  
  - Edge Cases: Misinterpretation of user input, infinite loops (mitigated by max iterations), tool failures.

---

#### 2.3 Tool Workflows for Airtable Interaction

**Overview:**  
This block contains sub-workflows and nodes that perform specific Airtable-related tasks such as listing bases, retrieving schemas, searching records, and processing data with code.

**Nodes Involved:**  
- Get list of bases (toolWorkflow)  
- Get base schema (toolWorkflow)  
- Search records (toolWorkflow)  
- Process data with code (toolWorkflow)  
- Create map image (toolCode)

**Node Details:**  

- **Get list of bases**  
  - Type: Tool Workflow  
  - Role: Retrieves list of Airtable bases with IDs and names.  
  - Configuration: Calls sub-workflow "Airtable Agent Tools" with command "get_bases".  
  - Inputs: Command field set to "get_bases".  
  - Outputs: List of bases.  
  - Edge Cases: API auth errors, empty base list.

- **Get base schema**  
  - Type: Tool Workflow  
  - Role: Retrieves schema (tables and fields) for a specified base.  
  - Configuration: Calls sub-workflow with command "get_base_tables_schema" and base_id input.  
  - Inputs: base_id string.  
  - Outputs: Table schemas with field names and types.  
  - Edge Cases: Invalid base_id, API errors.

- **Search records**  
  - Type: Tool Workflow  
  - Role: Searches records in a specific base/table with optional filters, sorting, and field selection.  
  - Configuration: Calls sub-workflow with command "search" and parameters: base_id, table_id, limit, filter_desc, sort, fields.  
  - Inputs: Search parameters from AI Agent.  
  - Outputs: Matching records.  
  - Edge Cases: Filter formula errors, large result sets, API rate limits.

- **Process data with code**  
  - Type: Tool Workflow  
  - Role: Executes code-based data processing for math functions (count, sum, average) and image generation (graphs).  
  - Configuration: Calls sub-workflow with command "code" and inputs: request description and raw data string.  
  - Inputs: User request and data from previous steps.  
  - Outputs: Processed results or generated images.  
  - Edge Cases: Code execution errors, malformed data.

- **Create map image**  
  - Type: Tool Code  
  - Role: Generates a Mapbox static map image URL based on longitude/latitude markers.  
  - Configuration: JavaScript code constructs Mapbox API URL with markers and requires user to replace `<your_public_key>` with Mapbox public key.  
  - Inputs: Markers string with coordinates.  
  - Outputs: Map image URL.  
  - Edge Cases: Missing or invalid Mapbox key, malformed marker data.

---

#### 2.4 Search Filter Generation

**Overview:**  
Transforms user-provided natural language filter descriptions into Airtable formula filters using OpenAI GPT-4o-mini model.

**Nodes Involved:**  
- Execute Workflow Trigger  
- Switch  
- If filter description exists  
- Set schema and prompt  
- OpenAI - Generate search filter  
- Merge

**Node Details:**  

- **Execute Workflow Trigger**  
  - Type: Execute Workflow Trigger  
  - Role: Entry point for external commands with JSON payloads containing commands and queries.  
  - Outputs: Routes commands to Switch node.  
  - Edge Cases: Missing or invalid commands.

- **Switch**  
  - Type: Switch  
  - Role: Routes execution based on command field in incoming JSON (get_bases, get_base_tables_schema, search, code).  
  - Outputs: Directs flow to appropriate processing branch.  
  - Edge Cases: Unknown commands.

- **If filter description exists**  
  - Type: If  
  - Role: Checks if user provided a filter description in the query.  
  - Outputs:  
    - True: Proceeds to generate filter formula.  
    - False: Skips filter generation.  
  - Edge Cases: Empty or missing filter_desc.

- **Set schema and prompt**  
  - Type: Set  
  - Role: Defines system prompt and JSON schema for OpenAI filter generation.  
  - Configuration:  
    - Prompt instructs AI to build Airtable formula filters from user descriptions with best practices and examples.  
    - JSON schema expects an object with a "filter" string property.  
  - Outputs: Supplies prompt and schema to OpenAI node.  
  - Edge Cases: Prompt misinterpretation.

- **OpenAI - Generate search filter**  
  - Type: HTTP Request  
  - Role: Calls OpenAI chat completions API (model: gpt-4o-mini) to generate Airtable filter formula JSON.  
  - Inputs: System prompt and user filter description.  
  - Outputs: JSON with "filter" formula string.  
  - Edge Cases: API errors, invalid JSON response.

- **Merge**  
  - Type: Merge  
  - Role: Combines outputs from filter generation and other inputs to prepare final query for Airtable search.  
  - Edge Cases: Data mismatch.

---

#### 2.5 Data Aggregation and Response Preparation

**Overview:**  
Aggregates data from Airtable, handles conditional logic for file/image responses, uploads files if needed, and prepares final response objects.

**Nodes Involved:**  
- Get Bases (Airtable node)  
- Get Base/Tables schema (Airtable node)  
- Aggregate, Aggregate1, Aggregate2  
- Airtable - Search records (HTTP Request)  
- OpenAI - Create thread  
- OpenAI - Send message  
- OpenAI - Run assistant  
- OpenAI - Get messages  
- If1  
- OpenAI - Download File  
- Upload file to get link  
- Response, Response1  
- Merge

**Node Details:**  

- **Get Bases**  
  - Type: Airtable node  
  - Role: Fetches list of Airtable bases using Airtable API credentials.  
  - Inputs: Routed from Switch node.  
  - Outputs: List of bases to Aggregate node.  
  - Edge Cases: API auth failure.

- **Get Base/Tables schema**  
  - Type: Airtable node  
  - Role: Retrieves schema of tables for a given base.  
  - Inputs: base_id from Execute Workflow Trigger.  
  - Outputs: Schema data to Aggregate1 node.  
  - Edge Cases: Invalid base_id.

- **Aggregate, Aggregate1, Aggregate2**  
  - Type: Aggregate  
  - Role: Aggregates incoming data arrays into single objects for easier processing.  
  - Aggregate2 merges lists of records.  
  - Edge Cases: Empty data sets.

- **Airtable - Search records**  
  - Type: HTTP Request  
  - Role: Performs filtered search on Airtable records using API with pagination support.  
  - Configuration:  
    - URL constructed dynamically from base_id and table_id.  
    - POST method with JSON body containing sort, limit, fields, and filterByFormula (from generated filter).  
    - Authentication via Airtable API token.  
  - Outputs: Records to Aggregate2 and Response nodes.  
  - Edge Cases: Pagination errors, filter formula errors.

- **OpenAI - Create thread**  
  - Type: HTTP Request  
  - Role: Creates a new OpenAI assistant thread for conversational processing of code or complex queries.  
  - Outputs: Thread ID to Send message node.  
  - Edge Cases: API limits.

- **OpenAI - Send message**  
  - Type: HTTP Request  
  - Role: Sends user request and data to OpenAI assistant thread.  
  - Inputs: Request and data from Execute Workflow Trigger.  
  - Outputs: Triggers OpenAI - Run assistant.  
  - Edge Cases: API errors.

- **OpenAI - Run assistant**  
  - Type: HTTP Request  
  - Role: Runs assistant with code interpreter tool enabled for advanced processing.  
  - Outputs: Triggers OpenAI - Get messages.  
  - Edge Cases: Execution errors.

- **OpenAI - Get messages**  
  - Type: HTTP Request  
  - Role: Retrieves messages from assistant run.  
  - Outputs: Conditional branch If1.  
  - Edge Cases: Missing messages.

- **If1**  
  - Type: If  
  - Role: Checks if response contains file attachments or image files.  
  - Outputs:  
    - True: Sends file to OpenAI - Download File.  
    - False: Sends direct response.  
  - Edge Cases: Missing file IDs.

- **OpenAI - Download File**  
  - Type: HTTP Request  
  - Role: Downloads file content from OpenAI API.  
  - Outputs: Upload file to get link.  
  - Edge Cases: Download failures.

- **Upload file to get link**  
  - Type: HTTP Request  
  - Role: Uploads downloaded file to tmpfiles.org to get a public link.  
  - Outputs: Response1 node.  
  - Edge Cases: Upload failures.

- **Response, Response1**  
  - Type: Set  
  - Role: Sets final response object with data or file URL for returning to user.  
  - Edge Cases: Data formatting issues.

- **Merge**  
  - Type: Merge  
  - Role: Combines data streams for final processing and filtering.  
  - Edge Cases: Data mismatch.

---

### 3. Summary Table

| Node Name                 | Node Type                              | Functional Role                                  | Input Node(s)                   | Output Node(s)                   | Sticky Note                                                                                   |
|---------------------------|--------------------------------------|-------------------------------------------------|--------------------------------|---------------------------------|----------------------------------------------------------------------------------------------|
| When chat message received | @n8n/n8n-nodes-langchain.chatTrigger| Entry point for chat messages                    | External webhook               | AI Agent                       |                                                                                              |
| Window Buffer Memory       | @n8n/n8n-nodes-langchain.memoryBufferWindow | Manages conversation memory                      | When chat message received     | AI Agent                       |                                                                                              |
| OpenAI Chat Model          | @n8n/n8n-nodes-langchain.lmChatOpenAi| Provides language model for AI Agent             | -                              | AI Agent                       | ### Replace OpenAI connection                                                                |
| AI Agent                  | @n8n/n8n-nodes-langchain.agent       | Core AI agent processing user input              | When chat message received, Window Buffer Memory, OpenAI Chat Model | Tool workflows (search, code, map, base listing, schema) |                                                                                              |
| Get list of bases          | @n8n/n8n-nodes-langchain.toolWorkflow| Retrieves Airtable bases list                     | AI Agent                      | Get Bases                     |                                                                                              |
| Get base schema            | @n8n/n8n-nodes-langchain.toolWorkflow| Retrieves schema of tables in base                | AI Agent                      | Get Base/Tables schema         |                                                                                              |
| Search records             | @n8n/n8n-nodes-langchain.toolWorkflow| Searches records with filters                      | AI Agent                      | Airtable - Search records      |                                                                                              |
| Process data with code     | @n8n/n8n-nodes-langchain.toolWorkflow| Executes math and image generation code           | AI Agent                      | AI Agent                      |                                                                                              |
| Create map image           | @n8n/n8n-nodes-langchain.toolCode    | Generates Mapbox map image URL                     | AI Agent                      | AI Agent                      | ### Replace Mapbox public key - <your_public_key>                                           |
| Execute Workflow Trigger   | n8n-nodes-base.executeWorkflowTrigger| Entry point for external commands                  | External                      | Switch                       |                                                                                              |
| Switch                    | n8n-nodes-base.switch                 | Routes commands to appropriate processing branch | Execute Workflow Trigger       | Get Bases, Get Base/Tables schema, If filter description exists, OpenAI - Create thread |                                                                                              |
| If filter description exists| n8n-nodes-base.if                    | Checks if filter description exists               | Switch                       | Merge (true), Set schema and prompt (false) |                                                                                              |
| Set schema and prompt      | n8n-nodes-base.set                   | Defines prompt and JSON schema for filter generation | If filter description exists  | OpenAI - Generate search filter |                                                                                              |
| OpenAI - Generate search filter | n8n-nodes-base.httpRequest         | Calls OpenAI to generate Airtable filter formula  | Set schema and prompt          | Merge                        |                                                                                              |
| Merge                     | n8n-nodes-base.merge                  | Combines filter and other query data              | If filter description exists, OpenAI - Generate search filter | Airtable - Search records      |                                                                                              |
| Get Bases                  | n8n-nodes-base.airtable               | Fetches Airtable bases list                        | Switch                       | Aggregate                    | ### Replace Airtable connection                                                             |
| Get Base/Tables schema     | n8n-nodes-base.airtable               | Fetches schema of tables in base                   | Switch                       | Aggregate1                   | ### Replace Airtable connection                                                             |
| Aggregate                 | n8n-nodes-base.aggregate              | Aggregates bases list                              | Get Bases                    | Response                     |                                                                                              |
| Aggregate1                | n8n-nodes-base.aggregate              | Aggregates base schema data                        | Get Base/Tables schema       | Response                     |                                                                                              |
| Airtable - Search records  | n8n-nodes-base.httpRequest            | Performs filtered search on Airtable records       | Merge                        | Aggregate2, Response          |                                                                                              |
| Aggregate2                | n8n-nodes-base.aggregate              | Aggregates search results                          | Airtable - Search records    | Response                     |                                                                                              |
| OpenAI - Create thread     | n8n-nodes-base.httpRequest            | Creates OpenAI assistant thread                    | Switch                       | OpenAI - Send message        | ### Replace OpenAI connection                                                               |
| OpenAI - Send message      | n8n-nodes-base.httpRequest            | Sends user request and data to assistant thread   | OpenAI - Create thread       | OpenAI - Run assistant       | ### Replace OpenAI connection                                                               |
| OpenAI - Run assistant     | n8n-nodes-base.httpRequest            | Runs assistant with code interpreter tool          | OpenAI - Send message        | OpenAI - Get messages        | ### Replace OpenAI connection                                                               |
| OpenAI - Get messages      | n8n-nodes-base.httpRequest            | Retrieves messages from assistant run              | OpenAI - Run assistant       | If1                         | ### Replace OpenAI connection                                                               |
| If1                       | n8n-nodes-base.if                    | Checks if response contains file/image             | OpenAI - Get messages        | Response (no file), OpenAI - Download File (file) |                                                                                              |
| OpenAI - Download File     | n8n-nodes-base.httpRequest            | Downloads file content from OpenAI                  | If1                         | Upload file to get link      | ### Replace OpenAI connection                                                               |
| Upload file to get link    | n8n-nodes-base.httpRequest            | Uploads file to tmpfiles.org for public link       | OpenAI - Download File       | Response1                   |                                                                                              |
| Response                   | n8n-nodes-base.set                   | Sets final response object                          | Aggregate, If1               | -                           |                                                                                              |
| Response1                  | n8n-nodes-base.set                   | Sets final response with uploaded file link        | Upload file to get link      | -                           |                                                                                              |
| Sticky Note                | n8n-nodes-base.stickyNote             | Various notes for credential replacement and setup | -                           | -                           | See sticky notes section below                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Chat Trigger Node**  
   - Type: `@n8n/n8n-nodes-langchain.chatTrigger`  
   - Configure webhook ID (auto-generated).  
   - No special parameters.

2. **Add Window Buffer Memory Node**  
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
   - Set `sessionKey` to expression: `={{ $('When chat message received').item.json.sessionId }}`  
   - Set `sessionIdType` to `customKey`.

3. **Add OpenAI Chat Model Node**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Assign OpenAI API credentials.  
   - Use default options.

4. **Add AI Agent Node**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Set `text` parameter to expression: `={{ $('When chat message received').item.json.chatInput }}`  
   - Set `agent` to `openAiFunctionsAgent`.  
   - Set `maxIterations` to 10.  
   - Paste system message instructing the agent on Airtable assistant behavior (see overview).  
   - Connect inputs: chat trigger, memory buffer, OpenAI chat model.

5. **Create Tool Workflows for Airtable Interaction**  
   - Import or create sub-workflow named "Airtable Agent Tools" with commands:  
     - `get_bases` (list bases)  
     - `get_base_tables_schema` (retrieve schema)  
     - `search` (search records)  
     - `code` (process data with code)  
   - Add toolWorkflow nodes for each command, referencing the sub-workflow and setting the `command` field accordingly.

6. **Add Create Map Image Node**  
   - Type: `@n8n/n8n-nodes-langchain.toolCode`  
   - Paste JavaScript code to generate Mapbox static map URL using markers.  
   - Replace `<your_public_key>` with your Mapbox public key.

7. **Add Execute Workflow Trigger Node**  
   - Type: `n8n-nodes-base.executeWorkflowTrigger`  
   - No parameters.

8. **Add Switch Node**  
   - Type: `n8n-nodes-base.switch`  
   - Configure rules to route based on `command` field in incoming JSON:  
     - `get_bases` → Get Bases node  
     - `get_base_tables_schema` → Get Base/Tables schema node  
     - `search` → If filter description exists node  
     - `code` → OpenAI - Create thread node

9. **Add If Filter Description Exists Node**  
   - Type: `n8n-nodes-base.if`  
   - Condition: Check if `filter_desc` exists and is not empty in incoming JSON.  
   - True branch → Set schema and prompt node.  
   - False branch → Merge node.

10. **Add Set Schema and Prompt Node**  
    - Type: `n8n-nodes-base.set`  
    - Assign two fields:  
      - `prompt`: Detailed instructions and best practices for generating Airtable filter formulas.  
      - `schema`: JSON schema defining expected output with a `filter` string property.

11. **Add OpenAI - Generate Search Filter Node**  
    - Type: `n8n-nodes-base.httpRequest`  
    - Configure POST request to OpenAI chat completions API with model `gpt-4o-mini`.  
    - Pass system prompt and user filter description as messages.  
    - Set `response_format` to JSON schema defined above.  
    - Assign OpenAI API credentials.

12. **Add Merge Node**  
    - Type: `n8n-nodes-base.merge`  
    - Merge outputs from If node (false branch) and OpenAI filter generation (true branch).  
    - Output to Airtable - Search records node.

13. **Add Airtable Nodes**  
    - **Get Bases**: Airtable node, resource `base`, no operation.  
    - **Get Base/Tables schema**: Airtable node, resource `base`, operation `getSchema`, input base_id from trigger.  
    - Assign Airtable API credentials to both.

14. **Add Aggregate Nodes**  
    - Add three aggregate nodes to consolidate data from Get Bases, Get Base/Tables schema, and Airtable search results.  
    - Configure Aggregate2 to merge lists of records.

15. **Add Airtable - Search Records Node**  
    - Type: HTTP Request  
    - POST to Airtable API endpoint `/v0/{base_id}/{table_id}/listRecords`.  
    - Include pagination with offset.  
    - JSON body includes sort, limit, fields, and filterByFormula from merged filter.  
    - Use Airtable API token credentials.

16. **Add OpenAI Assistant Thread Nodes**  
    - Create thread (POST to `/v1/threads`)  
    - Send message (POST to `/v1/threads/{id}/messages`) with user request and data.  
    - Run assistant (POST to `/v1/threads/{id}/runs`) with code interpreter tool enabled.  
    - Get messages (GET `/v1/threads/{id}/messages`) to retrieve results.  
    - Assign OpenAI API credentials to all.

17. **Add If1 Node**  
    - Checks if response contains file attachments or image files.  
    - True branch → OpenAI - Download File node.  
    - False branch → Response node.

18. **Add OpenAI - Download File Node**  
    - Downloads file content from OpenAI API.  
    - Assign OpenAI API credentials.

19. **Add Upload File to Get Link Node**  
    - POST to `https://tmpfiles.org/api/v1/upload` with multipart form data.  
    - Uploads downloaded file to get public URL.

20. **Add Response and Response1 Nodes**  
    - Set final response JSON with either direct data or uploaded file URL.

21. **Add Sticky Notes**  
    - Add notes reminding to replace OpenAI and Airtable credentials and Mapbox public key.  
    - Add branding and video guide notes as per original workflow.

22. **Connect Nodes According to Workflow Connections**  
    - Follow the detailed connections in the JSON to wire nodes correctly.  
    - Ensure error handling paths (e.g., continue on error for HTTP requests).  
    - Validate all expressions and parameter mappings.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Video guide showing the entire process of building this AI agent integrating Airtable data in n8n. Covers data preparation and advanced configurations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | [YouTube Video](https://youtu.be/SotqsAZEhdc)                                                      |
| Workflow designed for developers, data analysts, and business owners to create AI-powered conversational agents over Airtable datasets.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |                                                                                                    |
| Enables conversational data retrieval, mathematical analysis, and optional geographic visualization with maps.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |                                                                                                    |
| Important setup steps: separate workflows (move Workflow 2 to another workflow), replace all credentials (OpenAI, Airtable, Mapbox), and start chat by mentioning required base name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |                                                                                                    |
| Branding and credits: Made by Mark Shcherbakov from community 5minAI. Includes banner and detailed instructions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | [Mark Shcherbakov LinkedIn](https://www.linkedin.com/in/marklowcoding/), [5minAI Community](https://www.skool.com/5minai) |
| Replace Mapbox public key placeholder `<your_public_key>` in "Create map image" node JavaScript code with your actual Mapbox public key.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |                                                                                                    |
| Replace OpenAI API connections in all nodes using OpenAI services (chat completions, assistant threads, file downloads).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |                                                                                                    |
| Replace Airtable API token credentials in all Airtable nodes and HTTP requests interacting with Airtable API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |                                                                                                    |

---

This documentation provides a detailed, structured reference for understanding, reproducing, and modifying the "AI Agent to chat with Airtable and analyze data" workflow in n8n. It covers all nodes, their roles, configurations, and interconnections, enabling advanced users and AI agents to work effectively with this workflow.