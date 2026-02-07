AI-powered Student Assistant for Course Information via Twilio SMS

https://n8nworkflows.xyz/workflows/ai-powered-student-assistant-for-course-information-via-twilio-sms-3499


# AI-powered Student Assistant for Course Information via Twilio SMS

### 1. Workflow Overview

This workflow implements an AI-powered student assistant that interacts with users via SMS to answer course-related inquiries for the Northvale Institute of Technology. It leverages Twilio for SMS communication, OpenAI for natural language understanding and autonomous agent behavior, and Airtable as the course database backend.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receives incoming SMS messages via Twilio webhook and extracts user message and session information.
- **1.2 AI Agent Processing:** Uses an OpenAI-powered LangChain agent to interpret the user's query, autonomously access relevant tools (Airtable queries), and generate a response.
- **1.3 Airtable Data Access Tools:** Provides the AI agent with multiple Airtable tools to:
  - Retrieve the course database schema
  - Search available courses with dynamic filters
  - Get lists of professors and departments
- **1.4 Logging and Response:** Logs the interaction (question and AI answer) into an Airtable "Call Log" table and sends the AI-generated response back to the user via Twilio SMS.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block captures incoming SMS messages from users via Twilio, extracts the message content and sender information, and prepares the data for AI processing.

- **Nodes Involved:**  
  - Twilio Trigger  
  - Get User Message (Set node)

- **Node Details:**

  - **Twilio Trigger**  
    - Type: Twilio Trigger (Webhook)  
    - Role: Listens for inbound SMS messages via Twilio webhook event `com.twilio.messaging.inbound-message.received`.  
    - Configuration: Uses Twilio credentials; webhook ID auto-generated.  
    - Inputs: External HTTP webhook from Twilio.  
    - Outputs: JSON containing SMS metadata including `Body` (message text) and `From` (sender phone number).  
    - Edge Cases: Webhook misconfiguration, Twilio auth errors, message format variations.

  - **Get User Message**  
    - Type: Set node  
    - Role: Extracts and assigns key variables from the incoming Twilio message JSON.  
    - Configuration:  
      - Assigns `message` from `$json.Body` or fallback `$json.chatInput`.  
      - Assigns `sessionId` from `$json.From` or fallback `$json.sessionId`.  
    - Inputs: Output from Twilio Trigger.  
    - Outputs: JSON with `message` and `sessionId` fields for downstream use.  
    - Edge Cases: Missing or malformed message or sender fields.

#### 2.2 AI Agent Processing

- **Overview:**  
  This block uses a LangChain AI agent powered by OpenAI GPT-4o-mini to understand the user's query, autonomously decide which Airtable tools to invoke, and generate a relevant answer based on the course database.

- **Nodes Involved:**  
  - Model (OpenAI Chat)  
  - Memory (Buffer Window)  
  - Course Assistant Agent

- **Node Details:**

  - **Model**  
    - Type: LangChain LM Chat OpenAI  
    - Role: Provides the language model backend (GPT-4o-mini) for the AI agent.  
    - Configuration: Model set to `gpt-4o-mini`; no additional options.  
    - Credentials: OpenAI API key required.  
    - Inputs: Receives prompt text from the agent node.  
    - Outputs: Language model completions.  
    - Edge Cases: API rate limits, network timeouts, model unavailability.

  - **Memory**  
    - Type: LangChain Memory Buffer Window  
    - Role: Maintains conversational context window for the AI agent to enable multi-turn dialogue.  
    - Configuration: Default buffer window; no parameters set.  
    - Inputs/Outputs: Connected to the agent node to store and retrieve conversation history.  
    - Edge Cases: Memory overflow if conversation too long; context loss.

  - **Course Assistant Agent**  
    - Type: LangChain Agent (AI Agent Node)  
    - Role: Central AI agent that interprets user queries, calls Airtable tools, and generates answers.  
    - Configuration:  
      - Input text from `Get User Message.message`.  
      - System message instructs the agent to:  
        * Act as a course enquiry assistant for Northvale Institute of Technology.  
        * Use the course database as the factual source.  
        * Avoid off-topic discussions, directing users to helpdesk email if needed.  
        * Always query the database schema before using tools.  
        * Use updated Airtable filter syntax with AND(), OR(), FIND(), and inclusive time comparisons.  
      - Prompt type: `define` (custom prompt).  
    - Inputs: User message and memory context.  
    - Outputs: JSON with `output` field containing the AI-generated answer.  
    - Edge Cases: Expression evaluation errors, tool invocation failures, incomplete schema data, ambiguous user queries.

#### 2.3 Airtable Data Access Tools

- **Overview:**  
  These nodes provide the AI agent with direct access to the Airtable course database and related metadata, enabling autonomous querying and data retrieval.

- **Nodes Involved:**  
  - Get Course Database Schema  
  - Search Available Courses  
  - Get List of Professors  
  - Get List of Departments

- **Node Details:**

  - **Get Course Database Schema**  
    - Type: Airtable Tool (Get Schema)  
    - Role: Retrieves the schema of the Airtable base to inform the agent about table structure and fields.  
    - Configuration:  
      - Base: Northvale Institute of Technology Courses 2025-2026 (Airtable app ID `appO5xvP1aUBYKyJ7`).  
      - Operation: `getSchema` on the base resource.  
      - Tool description: "Call this tool to get the course database schema."  
    - Credentials: Airtable Personal Access Token.  
    - Inputs: Invoked by AI agent as needed.  
    - Outputs: Schema JSON describing tables and fields.  
    - Edge Cases: API rate limits, schema changes, token expiration.

  - **Search Available Courses**  
    - Type: Airtable Tool (Search)  
    - Role: Searches the courses table with a dynamic filter formula generated by the AI agent.  
    - Configuration:  
      - Base and Table: Same as above, table ID `tblRfh0t0KNSJYJVw`.  
      - Limit: 5 records max.  
      - Operation: `search` with `filterByFormula` dynamically set by AI agent expression `$fromAI('Filter_By_Formula', '', 'string')`.  
      - Tool description: "Call this tool to access the course database. Ensure you have the course database schema before using this tool."  
    - Credentials: Airtable Personal Access Token.  
    - Inputs: Filter formula generated by AI agent.  
    - Outputs: Matching course records.  
    - Edge Cases: Invalid formula syntax, no matching records, API errors.

  - **Get List of Professors**  
    - Type: Airtable Tool (Search)  
    - Role: Retrieves a list of active professors from the courses table.  
    - Configuration:  
      - Base and Table: Same as above.  
      - Operation: `search` with fields limited to `Instructor`.  
      - Tool description: "Call this tool to get a list of active professors."  
    - Credentials: Airtable Personal Access Token.  
    - Inputs: Invoked by AI agent.  
    - Outputs: List of instructors.  
    - Edge Cases: Empty results, API errors.

  - **Get List of Departments**  
    - Type: Airtable Tool (Search)  
    - Role: Retrieves a list of departments from the courses table.  
    - Configuration:  
      - Base and Table: Same as above.  
      - Operation: `search` with fields limited to `Department`.  
      - Tool description: "Call this tool to get a list of departments."  
    - Credentials: Airtable Personal Access Token.  
    - Inputs: Invoked by AI agent.  
    - Outputs: List of departments.  
    - Edge Cases: Empty results, API errors.

#### 2.4 Logging and Response

- **Overview:**  
  This block logs the question and AI-generated answer into an Airtable "Call Log" table for analysis and lead generation, then sends the response back to the user via SMS.

- **Nodes Involved:**  
  - Append to Call Log (Airtable)  
  - Send SMS reply (Twilio)

- **Node Details:**

  - **Append to Call Log**  
    - Type: Airtable (Create Record)  
    - Role: Logs each interaction with fields: `from` (sessionId), `question` (user message), and `answer` (AI response).  
    - Configuration:  
      - Base: Same Airtable base.  
      - Table: `Call Log` table (`tblRFuaayw0En6T0c`).  
      - Columns mapped:  
        * `from` = `Get User Message.sessionId`  
        * `question` = `Get User Message.message`  
        * `answer` = `Course Assistant Agent.output`  
      - Operation: Create new record.  
    - Credentials: Airtable Personal Access Token.  
    - Inputs: AI agent output and user message/session info.  
    - Outputs: Confirmation of record creation.  
    - Edge Cases: API failures, data type mismatches.

  - **Send SMS reply**  
    - Type: Twilio (Send SMS)  
    - Role: Sends the AI-generated answer back to the user via SMS.  
    - Configuration:  
      - `to`: User phone number from logged `from` field.  
      - `from`: Twilio number from the trigger node's `To` field.  
      - `message`: AI agent's output text.  
    - Credentials: Twilio API credentials.  
    - Inputs: Output of Append to Call Log node.  
    - Outputs: SMS send confirmation.  
    - Edge Cases: Invalid phone numbers, Twilio API errors, message length limits.

---

### 3. Summary Table

| Node Name               | Node Type                         | Functional Role                       | Input Node(s)          | Output Node(s)          | Sticky Note                                                                                      |
|-------------------------|----------------------------------|-------------------------------------|------------------------|-------------------------|------------------------------------------------------------------------------------------------|
| Twilio Trigger          | Twilio Trigger                   | Receive inbound SMS via webhook     | (Webhook)              | Get User Message        |                                                                                                |
| Get User Message        | Set                             | Extract user message and session ID | Twilio Trigger         | Course Assistant Agent   |                                                                                                |
| Model                   | LangChain LM Chat OpenAI         | Provide GPT-4o-mini language model  | (Internal to Agent)    | Course Assistant Agent   |                                                                                                |
| Memory                  | LangChain Memory Buffer Window   | Maintain conversation context       | (Internal to Agent)    | Course Assistant Agent   |                                                                                                |
| Course Assistant Agent  | LangChain Agent                  | Interpret query, call tools, generate answer | Get User Message, Model, Memory, Airtable Tools | Append to Call Log       |                                                                                                |
| Get Course Database Schema | Airtable Tool (Get Schema)     | Provide database schema to agent    | (Invoked by Agent)     | Course Assistant Agent   |                                                                                                |
| Search Available Courses | Airtable Tool (Search)           | Search courses with dynamic filters | (Invoked by Agent)     | Course Assistant Agent   |                                                                                                |
| Get List of Professors  | Airtable Tool (Search)           | Retrieve list of professors          | (Invoked by Agent)     | Course Assistant Agent   |                                                                                                |
| Get List of Departments | Airtable Tool (Search)           | Retrieve list of departments         | (Invoked by Agent)     | Course Assistant Agent   |                                                                                                |
| Append to Call Log      | Airtable (Create Record)          | Log Q&A interaction                  | Course Assistant Agent | Send SMS reply           |                                                                                                |
| Send SMS reply          | Twilio (Send SMS)                | Send AI response back to user       | Append to Call Log     |                         |                                                                                                |
| Sticky Note             | Sticky Note                     | Documentation and instructions      |                        |                         | ## Try It Out! ... [Discord](https://discord.com/invite/XPKeKXeB7d), [Forum](https://community.n8n.io/) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Twilio Trigger Node**  
   - Type: Twilio Trigger  
   - Configure to listen for event: `com.twilio.messaging.inbound-message.received`  
   - Set credentials with your Twilio account API key and secret.  
   - This node will receive incoming SMS messages via webhook.

2. **Create Set Node "Get User Message"**  
   - Type: Set  
   - Add two fields:  
     - `message` (string): Expression `{{$json.Body || $json.chatInput}}`  
     - `sessionId` (string): Expression `{{$json.From || $json.sessionId}}`  
   - Connect input from Twilio Trigger.

3. **Create LangChain LM Chat OpenAI Node "Model"**  
   - Type: LangChain LM Chat OpenAI  
   - Select model: `gpt-4o-mini`  
   - Configure OpenAI API credentials.  
   - No additional options needed.

4. **Create LangChain Memory Buffer Window Node "Memory"**  
   - Type: LangChain Memory Buffer Window  
   - Use default settings (empty).  
   - No credentials needed.

5. **Create LangChain Agent Node "Course Assistant Agent"**  
   - Type: LangChain Agent  
   - Set input text: Expression `{{$json.message}}` from "Get User Message" node.  
   - Configure system message with instructions:  
     ```
     You are a course enquiry assistant for the Northvale Institute of Technology helping students with various questions about the available courses for the year.
     * Answer factually and source the information from the course database to ensure you have updated information.
     * Avoid answering or engaging in any discussion not related to the Northvale Institute of Technology courses and instead, direct the student to contact helpdesk@northvale.edu.
     * always query the course database schema before using tools.

     Note: The airtable filter by query syntax was updated
     * Wrap your query in AND() or OR() to join parameters.
     * To filter select or multiple select finds, use the FIND() operation. eg. AND({Schedule_from}>=900, FIND('Wed', {Schedule_day}))
     * times should be inclusive unless otherwise stated. Use the >= or <= operators.
     ```  
   - Set prompt type to `define`.  
   - Connect the Model node as the language model.  
   - Connect the Memory node as the memory source.  
   - Add the following Airtable tools as AI tools (see next steps).  
   - Connect input from "Get User Message".

6. **Create Airtable Tool Node "Get Course Database Schema"**  
   - Type: Airtable Tool  
   - Operation: `getSchema` on base resource.  
   - Base: Select or enter Airtable base ID `appO5xvP1aUBYKyJ7` (Northvale Institute of Technology Courses 2025-2026).  
   - Credentials: Airtable Personal Access Token.  
   - Add description: "Call this tool to get the course database schema."  
   - Connect as AI tool input to "Course Assistant Agent".

7. **Create Airtable Tool Node "Search Available Courses"**  
   - Type: Airtable Tool  
   - Operation: `search` on table resource.  
   - Base: Same as above.  
   - Table: Use table ID `tblRfh0t0KNSJYJVw` (Imported table).  
   - Limit: 5 records.  
   - Filter by formula: Use expression `={{ $fromAI('Filter_By_Formula', '', 'string') }}` to allow AI agent to generate filter dynamically.  
   - Credentials: Airtable Personal Access Token.  
   - Add description: "Call this tool to access the course database. Ensure you have the course database schema before using this tool."  
   - Connect as AI tool input to "Course Assistant Agent".

8. **Create Airtable Tool Node "Get List of Professors"**  
   - Type: Airtable Tool  
   - Operation: `search` on table resource.  
   - Base and Table: Same as above.  
   - Fields: Limit to `Instructor` field.  
   - Credentials: Airtable Personal Access Token.  
   - Add description: "Call this tool to get a list of active professors."  
   - Connect as AI tool input to "Course Assistant Agent".

9. **Create Airtable Tool Node "Get List of Departments"**  
   - Type: Airtable Tool  
   - Operation: `search` on table resource.  
   - Base and Table: Same as above.  
   - Fields: Limit to `Department` field.  
   - Credentials: Airtable Personal Access Token.  
   - Add description: "Call this tool to get a list of departments."  
   - Connect as AI tool input to "Course Assistant Agent".

10. **Create Airtable Node "Append to Call Log"**  
    - Type: Airtable (Create Record)  
    - Base: Same Airtable base.  
    - Table: `Call Log` table with ID `tblRFuaayw0En6T0c`.  
    - Map columns:  
      - `from` = Expression `{{$node["Get User Message"].json.sessionId}}`  
      - `question` = Expression `{{$node["Get User Message"].json.message}}`  
      - `answer` = Expression `{{$json.output}}` from "Course Assistant Agent".  
    - Credentials: Airtable Personal Access Token.  
    - Connect input from "Course Assistant Agent".

11. **Create Twilio Node "Send SMS reply"**  
    - Type: Twilio (Send SMS)  
    - `To`: Expression `{{$json.fields.from}}` from "Append to Call Log".  
    - `From`: Expression `{{$node["Twilio Trigger"].json.To}}` (your Twilio number).  
    - `Message`: Expression `{{$node["Course Assistant Agent"].json.output}}`.  
    - Credentials: Twilio API credentials.  
    - Connect input from "Append to Call Log".

12. **Add Sticky Note (Optional)**  
    - Add a sticky note with the workflow overview, instructions, and useful links such as:  
      - Example Airtable database: https://airtable.com/appO5xvP1aUBYKyJ7/shr8jSFDaghubDOrw  
      - Discord: https://discord.com/invite/XPKeKXeB7d  
      - n8n Community Forum: https://community.n8n.io/

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                         | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow demonstrates autonomous AI agent usage with dynamic Airtable queries for conversational assistants.                                                                                                                 | Workflow concept                                                                                 |
| Example Airtable course database used: Northvale Institute of Technology Courses 2025-2026.                                                                                                                                         | https://airtable.com/appO5xvP1aUBYKyJ7/shr8jSFDaghubDOrw                                         |
| Twilio is used both for receiving inbound SMS (via webhook) and sending outbound SMS replies.                                                                                                                                      | Twilio SMS integration                                                                           |
| OpenAI GPT-4o-mini model powers the AI agent with LangChain integration.                                                                                                                                                            | OpenAI model                                                                                     |
| Airtable Personal Access Token is required with read/write access to the course database and call log tables.                                                                                                                      | Airtable API credentials                                                                         |
| Airtable filter formula syntax updated: use AND(), OR(), FIND() for multi-criteria filtering; times inclusive with >= and <= operators.                                                                                            | Agent instructions in system prompt                                                             |
| For help and community support, join the n8n Discord or Forum.                                                                                                                                                                     | Discord: https://discord.com/invite/XPKeKXeB7d, Forum: https://community.n8n.io/                   |
| This workflow can be customized for other domains by swapping Airtable base and tables, or adapting the AI agent prompt and tools.                                                                                                | Customization note                                                                              |
| The AI agent autonomously decides which Airtable tool to invoke based on user queries, enabling flexible and complex question answering without manual query construction.                                                          | AI agent autonomy                                                                               |

---

This documentation provides a detailed, structured reference for understanding, reproducing, and extending the AI-powered student assistant workflow using n8n, Twilio, OpenAI, and Airtable.