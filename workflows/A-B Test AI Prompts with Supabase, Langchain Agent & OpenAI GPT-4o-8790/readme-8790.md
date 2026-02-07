A/B Test AI Prompts with Supabase, Langchain Agent & OpenAI GPT-4o

https://n8nworkflows.xyz/workflows/a-b-test-ai-prompts-with-supabase--langchain-agent---openai-gpt-4o-8790


# A/B Test AI Prompts with Supabase, Langchain Agent & OpenAI GPT-4o

### 1. Workflow Overview

This workflow implements an A/B split testing mechanism for AI prompts using n8n integrations with Supabase, Langchain Agent, and OpenAI's GPT-4o model. It is designed to allocate chat sessions randomly to one of two distinct prompt variants (baseline or alternative) and maintain consistency across the session for prompt usage. The workflow facilitates evaluation of different prompt performances in a production-like environment by tracking session assignments and responses.

Logical blocks included:

- **1.1 Input Reception:** Capture incoming chat messages and extract session identifiers.
- **1.2 Session Management:** Check if a chat session already exists in Supabase and assign a prompt path if new.
- **1.3 Prompt Definition:** Define baseline and alternative prompt values and determine which to use per session.
- **1.4 AI Processing:** Use Langchain AI Agent configured with the selected prompt and OpenAI GPT-4o for response generation.
- **1.5 Memory Management:** Store and retrieve chat history in PostgreSQL to maintain conversation context.
- **1.6 Setup & Documentation:** Sticky notes providing guidance, instructions, and configuration notes.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Receives incoming chat messages via Langchain's chat trigger node, extracting user input and session information to initiate workflow processing.

- **Nodes Involved:**  
  - When chat message received

- **Node Details:**  
  - Type: `@n8n/n8n-nodes-langchain.chatTrigger`  
  - Role: Webhook listener for chat messages, initiating workflow on new input.  
  - Configuration: Default options; no additional parameters.  
  - Inputs: External webhook HTTP calls.  
  - Outputs: JSON containing `chatInput` (user message) and `sessionId` (chat session identifier).  
  - Edge Cases: Missing or malformed sessionId, webhook failures, or unexpected payloads.  
  - Version Requirements: Version 1.1 or higher recommended for stability.

#### 1.2 Session Management

- **Overview:**  
  Checks if the chat session already exists in Supabase. If not, assigns the session to one of two prompt paths randomly and stores this assignment for consistency.

- **Nodes Involved:**  
  - Define Path Values  
  - Check If Session Exists  
  - If Session Does Exist  
  - Assign Path To Session  

- **Node Details:**  
  - **Define Path Values**  
    - Type: `Set` node  
    - Role: Defines static prompt strings for baseline and alternative prompts.  
    - Configuration: Sets `baseline_value` to "The dog's name is Ben" and `alternative_value` to "The dog's name is Tom".  
    - Inputs: From chat trigger.  
    - Outputs: JSON with prompt variants.  
    - Edge Cases: None significant unless values are empty or invalid.  
    - Version: 3.4

  - **Check If Session Exists**  
    - Type: Supabase node  
    - Role: Queries `split_test_sessions` table in Supabase for a record matching the incoming `sessionId`.  
    - Configuration: Filter by `session_id` equals incoming sessionId.  
    - Credentials: Supabase API connected to `bsde.ai` project.  
    - Inputs: Output of Define Path Values.  
    - Outputs: Returns existing session record if found.  
    - Edge Cases: Supabase connection errors, no matching session found, empty results.  
    - Version: 1

  - **If Session Does Exist**  
    - Type: If node  
    - Role: Conditional branching based on whether session record exists (checks if `id` field exists).  
    - Configuration: Checks existence of `id` field in Supabase query result.  
    - Inputs: Output of Check If Session Exists.  
    - Outputs: True branch if session exists, False if it does not.  
    - Edge Cases: False positives if data structure changes, expression errors.  
    - Version: 2.2

  - **Assign Path To Session**  
    - Type: Supabase node  
    - Role: Inserts new session record with a randomly assigned boolean `show_alternative` value (true/false) indicating which prompt to show.  
    - Configuration: Fields set: `session_id` with current sessionId, `show_alternative` with random boolean (50% chance).  
    - Credentials: Same Supabase credentials.  
    - Inputs: False branch from If Session Does Exist (i.e., new session).  
    - Outputs: Confirmation of insertion.  
    - Edge Cases: Supabase write failures, duplicate keys if session id already exists.  
    - Version: 1

#### 1.3 Prompt Definition

- **Overview:**  
  Determines which prompt (baseline or alternative) to use for the current session based on the stored assignment in Supabase.

- **Nodes Involved:**  
  - Get Correct Prompt  

- **Node Details:**  
  - Type: `Set` node  
  - Role: Selects prompt text conditional on `show_alternative` boolean from Supabase record.  
  - Configuration: Uses expression to select `alternative_value` if `show_alternative` is true; otherwise `baseline_value`.  
  - Inputs: True branch from If Session Does Exist or output of Assign Path To Session.  
  - Outputs: JSON with selected prompt under `prompt` property.  
  - Edge Cases: Missing `show_alternative` field or null values could cause expression failure.  
  - Version: 3.4

#### 1.4 AI Processing

- **Overview:**  
  Uses Langchain AI Agent configured with the selected prompt as system message and OpenAI GPT-4o as underlying language model to generate chat responses.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  

- **Node Details:**  
  - **AI Agent**  
    - Type: `@n8n/n8n-nodes-langchain.agent`  
    - Role: Acts as the main AI conversational agent receiving prompt and user input.  
    - Configuration:  
      - `text`: User chat input from "When chat message received".  
      - `systemMessage`: Set to the prompt selected in "Get Correct Prompt".  
      - `promptType`: “define” mode for prompt definition.  
    - Inputs: Output of Get Correct Prompt for prompt, chat input from initial trigger.  
    - Outputs: AI-generated chat response.  
    - Edge Cases: Model errors, prompt injection risks, API rate limits, authentication failures.  
    - Version: 1.7

  - **OpenAI Chat Model**  
    - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
    - Role: Underlying OpenAI GPT-4o model used by AI Agent for generating text.  
    - Configuration: Model set to `gpt-4o-mini`.  
    - Credentials: OpenAI API key required.  
    - Inputs: Connected as AI language model to "AI Agent".  
    - Outputs: Text generation results to AI Agent.  
    - Edge Cases: API timeouts, quota limits, invalid API key.  
    - Version: 1.2

#### 1.5 Memory Management

- **Overview:**  
  Stores and retrieves chat conversation history in PostgreSQL to provide context memory to the AI Agent.

- **Nodes Involved:**  
  - Postgres Chat Memory  

- **Node Details:**  
  - Type: `@n8n/n8n-nodes-langchain.memoryPostgresChat`  
  - Role: Manages chat memory persistence for sessions, linked by custom session key.  
  - Configuration:  
    - Table: `n8n_split_test_chat_histories`  
    - Session key: Session ID from "When chat message received" node.  
    - `sessionIdType`: Custom key to differentiate sessions.  
    - Credentials: PostgreSQL connection to Supabase Session Pooler database.  
  - Inputs: Connected as AI memory to "AI Agent".  
  - Outputs: Provides memory context for AI Agent input.  
  - Edge Cases: DB connection failures, missing chat history table, query errors.  
  - Version: 1.3

#### 1.6 Setup & Documentation

- **Overview:**  
  Provides sticky notes throughout the workflow with explanations, instructions, setup notes, and modification guidance.

- **Nodes Involved:**  
  - Sticky Note1 through Sticky Note8  

- **Node Details:**  
  - Type: `n8n-nodes-base.stickyNote`  
  - Role: Visual annotations for users, explaining blocks, providing instructions.  
  - Configuration: Content includes setup instructions, use case description, modification hints, and links to resources.  
  - Positioning: Strategically placed near related nodes for guidance.  
  - Edge Cases: None applicable.

---

### 3. Summary Table

| Node Name                | Node Type                                | Functional Role                           | Input Node(s)                 | Output Node(s)              | Sticky Note                                                                                                 |
|--------------------------|----------------------------------------|-----------------------------------------|------------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------|
| When chat message received | @n8n/n8n-nodes-langchain.chatTrigger  | Receive incoming chat messages           | External webhook              | Define Path Values           | ## 1. Receive Message                                                                                         |
| Define Path Values         | Set                                    | Define baseline and alternative prompts  | When chat message received    | Check If Session Exists      | ### Modification - Set the values of the baseline and alternative prompts                                    |
| Check If Session Exists    | Supabase                               | Check if session exists in Supabase      | Define Path Values            | If Session Does Exist        |                                                                                                             |
| If Session Does Exist      | If                                     | Branch based on session existence        | Check If Session Exists       | Get Correct Prompt, Assign Path To Session |                                                                                                             |
| Assign Path To Session     | Supabase                               | Assign prompt path randomly if new session | If Session Does Exist (false) | Get Correct Prompt           |                                                                                                             |
| Get Correct Prompt         | Set                                    | Select prompt based on session assignment | If Session Does Exist (true), Assign Path To Session | AI Agent                   |                                                                                                             |
| AI Agent                  | @n8n/n8n-nodes-langchain.agent         | Main AI conversational agent             | Get Correct Prompt, When chat message received |                             | ## 3. AI Agent                                                                                               |
| OpenAI Chat Model          | @n8n/n8n-nodes-langchain.lmChatOpenAi  | OpenAI GPT-4o language model             | AI Agent (ai_languageModel)  | AI Agent                    | ### Modification - Replace this sub-node to use a different language model                                   |
| Postgres Chat Memory       | @n8n/n8n-nodes-langchain.memoryPostgresChat | Manage chat session memory                | AI Agent (ai_memory)          | AI Agent                    |                                                                                                             |
| Sticky Note1               | Sticky Note                           | Workflow block annotation                 |                              |                             | ## 1. Receive Message                                                                                        |
| Sticky Note                | Sticky Note                           | Workflow block annotation                 |                              |                             | ## 2. Determine Prompt for LLM                                                                               |
| Sticky Note2               | Sticky Note                           | Workflow block annotation                 |                              |                             | ## 3. AI Agent                                                                                               |
| Sticky Note3               | Sticky Note                           | Workflow overview and use case notes     |                              |                             | ## Split Test Different Agent Prompts with Supabase and OpenAI (Detailed description and next steps)         |
| Sticky Note5               | Sticky Note                           | Setup instructions                        |                              |                             | 1. Create Supabase table `split_test_sessions` with `session_id` (text) and `show_alternative` (bool) columns 2. Add credentials 3. Modify prompts 4. Activate and test 5. Experiment with sessions |
| Sticky Note6               | Sticky Note                           | Modification hint                        |                              |                             | ### Modification - Set the values of the baseline and alternative prompts                                    |
| Sticky Note8               | Sticky Note                           | Modification hint                        |                              |                             | ### Modification - Replace this sub-node to use a different language model                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Incoming Chat Trigger Node**  
   - Add node: `@n8n/n8n-nodes-langchain.chatTrigger`  
   - Purpose: Receive chat messages via webhook.  
   - Configuration: Leave default options.  
   - Note webhook URL for external calls.

2. **Define Baseline and Alternative Prompt Values**  
   - Add node: `Set`  
   - Name: Define Path Values  
   - Assign two string variables:  
     - `baseline_value` = "The dog's name is Ben"  
     - `alternative_value` = "The dog's name is Tom"  
   - Connect output of chat trigger to this node.

3. **Configure Supabase Credentials**  
   - Set up Supabase API credentials with your Supabase project (e.g., `bsde.ai`).  
   - Ensure you have a table named `split_test_sessions` with columns:  
     - `session_id` (text)  
     - `show_alternative` (boolean)

4. **Check if Session Exists in Supabase**  
   - Add node: Supabase  
   - Name: Check If Session Exists  
   - Operation: Get  
   - Table: `split_test_sessions`  
   - Filter condition: `session_id` equals `{{$node["When chat message received"].json["sessionId"]}}`  
   - Connect output of Define Path Values node to this node.

5. **Create Conditional Branch to Detect Existing Sessions**  
   - Add node: If  
   - Name: If Session Does Exist  
   - Condition: Check if the Supabase query returned a record (field `id` exists)  
   - Connect output of Check If Session Exists to this node.

6. **Assign Prompt Path for New Sessions**  
   - Add node: Supabase  
   - Name: Assign Path To Session  
   - Operation: Insert or Upsert into `split_test_sessions` table  
   - Fields:  
     - `session_id` = `{{$node["When chat message received"].json["sessionId"]}}`  
     - `show_alternative` = `{{ Math.random() < 0.5 }}` (random boolean)  
   - Connect the False output (session does not exist) of If node to this node.

7. **Determine Which Prompt to Use**  
   - Add node: Set  
   - Name: Get Correct Prompt  
   - Assign variable `prompt` with expression:  
     ```  
     {{$json.show_alternative ? $node["Define Path Values"].json.alternative_value : $node["Define Path Values"].json.baseline_value}}  
     ```  
   - Connect the True output (session exists) of If node and output of Assign Path To Session to this node.

8. **Configure OpenAI Chat Model Node**  
   - Add node: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Name: OpenAI Chat Model  
   - Model: `gpt-4o-mini`  
   - Credentials: Configure OpenAI API key.  
   - Connect this node as AI language model to the AI Agent node.

9. **Add AI Agent Node**  
   - Add node: `@n8n/n8n-nodes-langchain.agent`  
   - Name: AI Agent  
   - Parameters:  
     - `text`: `{{$node["When chat message received"].json.chatInput}}`  
     - `systemMessage`: `{{$json.prompt}}` (from Get Correct Prompt node)  
     - `promptType`: "define"  
   - Connect output of Get Correct Prompt node to this node’s parameters, and also connect OpenAI Chat Model node as AI language model.  
   - Connect chat input from chat trigger as user input.

10. **Set Up Postgres Chat Memory Node**  
    - Add node: `@n8n/n8n-nodes-langchain.memoryPostgresChat`  
    - Name: Postgres Chat Memory  
    - Table name: `n8n_split_test_chat_histories` (must exist in your PostgreSQL instance)  
    - Session key: `{{$node["When chat message received"].json.sessionId}}`  
    - Session ID type: `customKey`  
    - Credentials: PostgreSQL database connection (e.g., Supabase Session Pooler)  
    - Connect this node as AI memory to AI Agent node.

11. **Connect Nodes for Execution Flow**  
    - When chat message received → Define Path Values → Check If Session Exists → If Session Does Exist  
    - If true → Get Correct Prompt → AI Agent  
    - If false → Assign Path To Session → Get Correct Prompt → AI Agent  
    - AI Agent connects to OpenAI Chat Model (ai_languageModel) and Postgres Chat Memory (ai_memory).

12. **Add Sticky Notes (Optional but Recommended)**  
    - Add sticky notes near logical blocks to document purpose and instructions.

13. **Activate Workflow and Test**  
    - Activate the workflow.  
    - Send chat messages with unique session IDs to test split assignment and AI responses.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                  | Context or Link                                                                                                        |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Setup instructions: Create Supabase table `split_test_sessions` with `session_id` (text) and `show_alternative` (bool). Add your Supabase, OpenAI, and PostgreSQL credentials before activation.                               | Sticky Note5                                                                                                          |
| Workflow demonstrates effective A/B testing of prompt variations with persistent session-level prompt assignment for consistent user experience.                                                                            | Sticky Note3                                                                                                          |
| To test different language models or parameters (e.g., temperature), replace or modify the OpenAI Chat Model node accordingly.                                                                                              | Sticky Note8                                                                                                          |
| Modify baseline and alternative prompt values in the 'Define Path Values' node to experiment with different prompt content.                                                                                                  | Sticky Note6                                                                                                          |
| For further improvement, consider adding metrics collection to measure prompt efficacy and expand testing capabilities.                                                                                                     | Sticky Note3 (Next Steps section)                                                                                      |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to content policies and contains no illegal, offensive, or protected material. All manipulated data is legal and public.