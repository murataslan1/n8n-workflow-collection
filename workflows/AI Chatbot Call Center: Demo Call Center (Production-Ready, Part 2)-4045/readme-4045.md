AI Chatbot Call Center: Demo Call Center (Production-Ready, Part 2)

https://n8nworkflows.xyz/workflows/ai-chatbot-call-center--demo-call-center--production-ready--part-2--4045


# AI Chatbot Call Center: Demo Call Center (Production-Ready, Part 2)

---
### 1. Workflow Overview

This workflow, titled **"☎️ Demo Call Center"**, serves as the main entry point for a multi-service chatbot designed for call center operations. Its primary purpose is to receive messages from an external “Call In” workflow or sub-workflows, apply rate limiting, manage session and user memory, and route conversations intelligently between AI chat agents and specific service handlers such as taxi booking. It is production-ready with features like queue mode scaling, rate limiting, long-term memory, multi-service handling, and robust error management.

The workflow logic is organized into the following functional blocks:

- **1.1 Input Reception & Rate Limiting:** Waits for incoming messages from a trigger workflow, sets initial parameters, and applies rate limiting per session.
- **1.2 Session & Memory Management:** Loads and manages session data from Redis cache and user memory from Postgres to maintain conversational context.
- **1.3 Channel Routing & Service Provider Selection:** Switches based on the session’s `channel_no` to route chats either to the AI agent for chit-chat or to service workflows like taxi booking.
- **1.4 AI Agent Interaction:** Processes chat messages with an AI agent node augmented by language models and memory nodes, enabling dynamic decision-making including service selection.
- **1.5 Service Execution & Sub-workflow Invocation:** Executes chosen service workflows (Taxi Service, Taxi Booking Worker) based on AI agent output and session state.
- **1.6 Output & Error Handling:** Sends responses back via a callback sub-workflow and manages error outputs gracefully.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Rate Limiting

- **Overview:**  
  This block receives incoming messages from an external workflow, initializes the session context, and enforces rate limiting to prevent abuse or overload.

- **Nodes Involved:**  
  - Flow Trigger  
  - Input (Set)  
  - Rate Limit (Redis)  
  - If Rated (If)  
  - Rated Output (Set)  

- **Node Details:**  

  - **Flow Trigger**  
    - *Type:* Execute Workflow Trigger  
    - *Role:* Listens for messages from external workflows (e.g., Telegram Call In Workflow).  
    - *Config:* Default trigger settings, waiting for execution calls.  
    - *Connections:* Outputs to Input node.  
    - *Edge cases:* Trigger failure if upstream workflow unavailable.

  - **Input (Set)**  
    - *Type:* Set  
    - *Role:* Initializes workflow variables, including timestamps and session IDs.  
    - *Config:* No parameters set explicitly here; serves as an initialization placeholder that may add timestamp and session context.  
    - *Connections:* Input -> Rate Limit  
    - *Edge cases:* Misconfiguration may lead to missing session identifiers.

  - **Rate Limit (Redis)**  
    - *Type:* Redis Node  
    - *Role:* Implements a rate limiting mechanism using Redis TTL (Time To Live) with a 90-second window per session ID key `{session_id}:hits`.  
    - *Config:* Reads or increments hit counts; on error continues normal output to avoid blocking flow.  
    - *Connections:* Input -> Rate Limit -> If Rated  
    - *Edge cases:* Redis connectivity or auth failure; rate limit key expiry mismanagement.

  - **If Rated (If)**  
    - *Type:* If  
    - *Role:* Checks if the rate limit threshold (e.g., 30 chats) has been exceeded.  
    - *Config:* Condition based on Redis hit count.  
    - *Connections:* Rate Limit -> If Rated  
      - True (rate limit exceeded) -> Rated Output  
      - False -> Session Node  
    - *Edge cases:* Expression failure if Redis data malformed.

  - **Rated Output (Set)**  
    - *Type:* Set  
    - *Role:* Prepares a "Please wait..." message to the user when rate limited.  
    - *Config:* Static message output.  
    - *Connections:* If Rated (True) -> Rated Output -> Call Back  
    - *Edge cases:* None significant.

---

#### 2.2 Session & Memory Management

- **Overview:**  
  This block loads and manages session information and chat memory from Redis and Postgres databases to maintain conversational state and long-term user memory.

- **Nodes Involved:**  
  - Session (Redis)  
  - Chat Memory (Set)  
  - Postgres Chat Memory  
  - Load User Memory (Postgres)  
  - Save User Memory (Postgres)  
  - New Session (Redis)  

- **Node Details:**  

  - **Session (Redis)**  
    - *Type:* Redis Node  
    - *Role:* Retrieves session data stored under `{session_id}:session`.  
    - *Config:* Continues normal output on error to avoid blocking flow if session data unavailable.  
    - *Connections:* If Rated (False) -> Session -> Chat Memory  
    - *Edge cases:* Redis unavailability; session key missing or expired.

  - **Chat Memory (Set)**  
    - *Type:* Set  
    - *Role:* Manages chat memory state with timestamp for recall or creation.  
    - *Config:* Uses `{timestamp}` to identify chat sessions uniquely.  
    - *Connections:* Session -> Chat Memory -> Channel Switch  
    - *Edge cases:* Missing or invalid timestamp may cause session mix-ups.

  - **Postgres Chat Memory**  
    - *Type:* Postgres Tool (Langchain Memory)  
    - *Role:* Stores and retrieves short-term chat memory in Postgres table `n8n_chat_memory`.  
    - *Config:* Keys formatted as `{session_id}:{timestamp}`, with expiry of 60 minutes and max 30 chats.  
    - *Connections:* Chat Memory -> Postgres Chat Memory -> AI Agent (memory input)  
    - *Edge cases:* Database connectivity issues; data consistency errors.

  - **Load User Memory (Postgres)**  
    - *Type:* Postgres Tool  
    - *Role:* Loads additional user memory from table `n8n_user_memory` for longer-term context.  
    - *Config:* Intended to supply AI agent with extended user context.  
    - *Connections:* Connected as AI tool input to AI Agent.  
    - *Edge cases:* Query failures; missing user memory data.

  - **Save User Memory (Postgres)**  
    - *Type:* Postgres Tool  
    - *Role:* Saves updated user memory back to Postgres.  
    - *Config:* Triggered by AI Agent output to persist context.  
    - *Connections:* AI Agent output to Save User Memory.  
    - *Edge cases:* Write failures; data corruption.

  - **New Session (Redis)**  
    - *Type:* Redis Node  
    - *Role:* Updates session data in Redis after AI Agent processing, stored under `{session_id}:session`.  
    - *Config:* Continues on error to avoid blocking.  
    - *Connections:* AI Agent -> New Session -> Chat Switch  
    - *Edge cases:* Redis write failures.

---

#### 2.3 Channel Routing & Service Provider Selection

- **Overview:**  
  Based on the session’s `channel_no` value, this block routes the conversation either to the AI Agent for general chat or to specific service workflows. It also manages the selection of service providers.

- **Nodes Involved:**  
  - Channel Switch (Switch)  
  - Provider (Redis)  
  - Code  
  - Provider Switch (Switch)  

- **Node Details:**  

  - **Channel Switch (Switch)**  
    - *Type:* Switch  
    - *Role:* Routes based on `channel_no` session variable; default 'chat' routes to AI Agent, other values like 'taxi' route to corresponding service providers.  
    - *Config:* Conditions on `channel_no` session field.  
    - *Connections:* Chat Memory -> Channel Switch ->  
      - 'chat' -> AI Agent  
      - other -> Provider Redis Node  
    - *Edge cases:* Missing or unexpected `channel_no` values.

  - **Provider (Redis)**  
    - *Type:* Redis Node  
    - *Role:* Retrieves the list of service providers for the session `{session_id}:service:providers`.  
    - *Config:* Continues output on error; always outputs data.  
    - *Connections:* Channel Switch (non-chat) -> Provider -> Code  
    - *Edge cases:* Redis connection issues; missing provider data.

  - **Code (Code)**  
    - *Type:* Code  
    - *Role:* Processes provider data to select or format provider info for routing.  
    - *Config:* Custom JavaScript code interpreting Redis data and preparing output.  
    - *Connections:* Provider -> Code -> Provider Switch  
    - *Edge cases:* Script errors if provider data malformed.

  - **Provider Switch (Switch)**  
    - *Type:* Switch  
    - *Role:* Routes to specific service workflows based on processed provider data, such as Taxi Booking Worker or Taxi Service Redirect.  
    - *Config:* Switch conditions on selected provider.  
    - *Connections:* Code -> Provider Switch ->  
      - Taxi Booking Worker  
      - Taxi Service Redirect  
    - *Edge cases:* Unknown or missing provider names.

---

#### 2.4 AI Agent Interaction

- **Overview:**  
  The AI Agent block uses language models and memory nodes to interpret chat messages, decide on next actions (including service selection), and update session/context accordingly.

- **Nodes Involved:**  
  - AI Agent (Langchain Agent)  
  - xAI @grok-2-1212 (Langchain LM)  
  - Postgres Chat Memory (memory node)  
  - Load User Memory (memory input)  
  - Save User Memory (memory output)  
  - New Session (Redis)  
  - Error Output (Set)  

- **Node Details:**  

  - **AI Agent**  
    - *Type:* Langchain Agent Node  
    - *Role:* Core NLP agent that processes input chat, leverages language model and memory nodes to decide next steps.  
    - *Config:* Uses `xAI @grok-2-1212` as language model, connects to memory nodes for chat and user memory, and has error output configured to continue with error handling.  
    - *Connections:*  
      - Inputs from Postgres Chat Memory, Load User Memory, and Taxi Service tool workflow.  
      - Outputs to New Session (success) and Error Output node (on error).  
    - *Edge cases:* AI model timeouts, API authentication errors, prompt failures, incomplete memory data.

  - **xAI @grok-2-1212**  
    - *Type:* Langchain Language Model Node  
    - *Role:* Provides language model capabilities to AI Agent.  
    - *Config:* Connected as language model input to AI Agent.  
    - *Edge cases:* Model API latency or outages.

  - **Postgres Chat Memory** (see above)  
  - **Load User Memory** (see above)  
  - **Save User Memory** (see above)  
  - **New Session** (see above)  

  - **Error Output**  
    - *Type:* Set  
    - *Role:* Prepares a retry message when AI Agent errors occur.  
    - *Config:* Static message "Please retry."  
    - *Connections:* AI Agent error output -> Error Output -> Call Back  
    - *Edge cases:* None significant.

---

#### 2.5 Service Execution & Sub-workflow Invocation

- **Overview:**  
  This block handles execution of selected service workflows such as taxi booking and manages callback responses.

- **Nodes Involved:**  
  - Taxi Service (Tool Workflow)  
  - Taxi Booking Worker (Execute Workflow)  
  - Taxi Service Redirect (Execute Workflow)  
  - Call Back (Execute Workflow)  
  - Output (Set)  
  - Chat Switch (Switch)  
  - Test Output (Set)  

- **Node Details:**  

  - **Taxi Service**  
    - *Type:* Langchain Tool Workflow  
    - *Role:* Represents the Taxi Service sub-workflow that can be invoked by AI Agent as an external tool.  
    - *Config:* Connected as an AI tool input to AI Agent.  
    - *Edge cases:* Sub-workflow failures or unavailability.

  - **Taxi Booking Worker**  
    - *Type:* Execute Workflow  
    - *Role:* Executes the Taxi Booking Worker sub-workflow for booking handling.  
    - *Config:* Invoked via Provider Switch node.  
    - *Edge cases:* Sub-workflow execution errors.

  - **Taxi Service Redirect**  
    - *Type:* Execute Workflow  
    - *Role:* Redirects to Taxi Service sub-workflow for service execution.  
    - *Config:* Invoked via Provider Switch node.  
    - *Edge cases:* Sub-workflow errors.

  - **Call Back**  
    - *Type:* Execute Workflow  
    - *Role:* Sends back responses or error messages to calling workflows or users.  
    - *Config:* Invoked from multiple nodes including Rated Output, Error Output, and Output nodes.  
    - *Edge cases:* Callback failure or communication errors.

  - **Output (Set)**  
    - *Type:* Set  
    - *Role:* Prepares final output data before callback.  
    - *Connections:* Chat Switch -> Output -> Call Back  
    - *Edge cases:* Missing data may result in empty responses.

  - **Chat Switch (Switch)**  
    - *Type:* Switch  
    - *Role:* Routes new session outputs to appropriate output nodes or test outputs.  
    - *Config:* Conditions based on chat state or testing flags.  
    - *Edge cases:* Incorrect routing if conditions misconfigured.

  - **Test Output (Set)**  
    - *Type:* Set  
    - *Role:* Used for testing outputs independently.  
    - *Edge cases:* None significant.

---

#### 2.6 Ancillary Nodes and Sticky Notes

- **Sticky Notes:**  
  Multiple sticky notes are present throughout the workflow; most contain brief annotations such as language context ("香港繁體中文"), TTL info ("TTL 90s"), or reminders. None contain actionable configuration details but assist documentation in the editor.

---

### 3. Summary Table

| Node Name           | Node Type                        | Functional Role                               | Input Node(s)                 | Output Node(s)                  | Sticky Note                  |
|---------------------|---------------------------------|----------------------------------------------|------------------------------|--------------------------------|------------------------------|
| Flow Trigger        | Execute Workflow Trigger          | Entry point listening for incoming messages | —                            | Input                          |                              |
| Input               | Set                             | Initialize parameters such as timestamp      | Flow Trigger                 | Rate Limit                     |                              |
| Rate Limit          | Redis                           | Apply rate limiting per session               | Input                        | If Rated                      | TTL 90s; {session_id}:hits   |
| If Rated            | If                              | Check if rate limit exceeded                  | Rate Limit                   | Rated Output (True), Session (False) | 30 CHATS                     |
| Rated Output        | Set                             | Output rate limit message                      | If Rated                    | Call Back                     | Please wait...               |
| Session             | Redis                           | Load session data                              | If Rated (False)             | Chat Memory                   | {session_id}:session         |
| Chat Memory         | Set                             | Manage chat memory with timestamp             | Session                      | Channel Switch                | Recall/Create {timestamp}    |
| Channel Switch      | Switch                         | Route by channel_no (chat, taxi, etc.)        | Chat Memory                  | Provider (non-chat), AI Agent (chat) |                              |
| Provider            | Redis                           | Get service providers list                     | Channel Switch (non-chat)    | Code                         | {session_id}:service:providers |
| Code                | Code                            | Process provider data                          | Provider                     | Provider Switch               |                              |
| Provider Switch     | Switch                         | Route to service workflows                     | Code                        | Taxi Booking Worker, Taxi Service Redirect |                              |
| AI Agent            | Langchain Agent                 | AI chatbot processing and decision making     | Channel Switch (chat), Postgres Chat Memory, Load User Memory, Taxi Service | New Session (success), Error Output (error) |                              |
| xAI @grok-2-1212    | Langchain Language Model         | Language model for AI Agent                    | —                            | AI Agent                     |                              |
| Postgres Chat Memory| Postgres Tool (Langchain Memory) | Chat memory storage and retrieval              | Chat Memory                  | AI Agent                     | n8n_chat_memory, 30 CHAT, EXPIRY 60m |
| Load User Memory    | Postgres Tool                   | Load long-term user memory                      | —                            | AI Agent                     | n8n_user_memory              |
| Save User Memory    | Postgres Tool                   | Save updated user memory                        | AI Agent                     | —                           |                              |
| New Session         | Redis                           | Save updated session data                       | AI Agent                     | Chat Switch                  | {session_id}:session         |
| Error Output        | Set                             | Prepare retry message on AI error              | AI Agent (error)             | Call Back                   | Please retry.                |
| Taxi Service        | Langchain Tool Workflow         | Taxi service sub-workflow tool                  | AI Agent (tool)              | AI Agent                     | Demo Taxi Service            |
| Taxi Booking Worker | Execute Workflow               | Taxi booking handling workflow                  | Provider Switch              | —                           | Test Taxi Booking Worker     |
| Taxi Service Redirect| Execute Workflow               | Redirect to Taxi Service workflow               | Provider Switch              | —                           | Demo Taxi Service            |
| Call Back           | Execute Workflow               | Send response or error to calling workflow/user| Rated Output, Output, Error Output | —                     | Demo Call Back               |
| Output              | Set                             | Prepare final output data                        | Chat Switch                  | Call Back                   |                              |
| Chat Switch         | Switch                         | Route new session outputs                        | New Session                  | Output, Test Output          |                              |
| Test Output         | Set                             | Testing output node                              | Chat Switch                  | —                           |                              |
| Test Trigger        | Langchain Chat Trigger          | (Testing) Chat trigger for input                 | —                            | Test Fields                 |                              |
| Test Fields         | Set                             | (Testing) Set test fields                         | Test Trigger                 | Input                       | 香港繁體中文                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Flow Trigger Node**  
   - Type: Execute Workflow Trigger  
   - Role: Entry point for incoming messages from external workflows (e.g., Telegram Call In)  
   - No special parameters; default webhook trigger.

2. **Create Input Node (Set)**  
   - Type: Set  
   - Purpose: Initialize variables, add timestamp and session ID.  
   - Parameters: Add current timestamp and generate or map `session_id` for unique session.

3. **Create Rate Limit Node (Redis)**  
   - Type: Redis  
   - Credentials: Configure Redis credentials for cache access.  
   - Parameters: Use key pattern `{session_id}:hits` with TTL 90 seconds to count hits.  
   - On Error: Continue regular output (do not block flow).

4. **Create If Rated Node (If)**  
   - Type: If  
   - Condition: Check if hit count exceeds 30 chats.  
   - True output connects to Rated Output node; False continues to Session node.

5. **Create Rated Output Node (Set)**  
   - Type: Set  
   - Parameters: Set message "Please wait..." for rate-limited users.  
   - Connect output to Call Back node.

6. **Create Session Node (Redis)**  
   - Type: Redis  
   - Parameters: Retrieve session data from `{session_id}:session`.  
   - On Error: Continue regular output.

7. **Create Chat Memory Node (Set)**  
   - Type: Set  
   - Purpose: Manage chat session data with `{timestamp}`.  
   - Connect Session output to Chat Memory.

8. **Create Postgres Chat Memory Node**  
   - Type: Postgres Tool (Langchain Memory)  
   - Credentials: Configure Postgres credentials.  
   - Parameters: Use table `n8n_chat_memory` with keys `{session_id}:{timestamp}`, expiry 60 minutes, max 30 chats.

9. **Create Load User Memory Node (Postgres)**  
   - Type: Postgres Tool  
   - Parameters: Query user memory from `n8n_user_memory` table.

10. **Create Save User Memory Node (Postgres)**  
    - Type: Postgres Tool  
    - Parameters: Save user memory updates post AI processing.

11. **Create Channel Switch Node (Switch)**  
    - Type: Switch  
    - Condition: Based on session variable `channel_no`.  
    - Route 'chat' to AI Agent, others to Provider Redis node.

12. **Create Provider Node (Redis)**  
    - Type: Redis  
    - Parameters: Read `{session_id}:service:providers`.  
    - On Error: Continue output.

13. **Create Code Node (Code)**  
    - Type: Code  
    - Write JavaScript to parse provider data and prepare routing keys or flags.

14. **Create Provider Switch Node (Switch)**  
    - Type: Switch  
    - Conditions: Route to Taxi Booking Worker or Taxi Service Redirect workflows based on provider selection.

15. **Create AI Agent Node (Langchain Agent)**  
    - Configure AI model input with `xAI @grok-2-1212` language model.  
    - Connect memory nodes to AI Agent (Postgres Chat Memory, Load User Memory).  
    - Configure AI Agent output: success to New Session node, error to Error Output node.  
    - Set error handling to continue error output.

16. **Create Language Model Node (xAI @grok-2-1212)**  
    - Type: Langchain Language Model  
    - Connect as language model input to AI Agent.

17. **Create New Session Node (Redis)**  
    - Type: Redis  
    - Save updated session data under `{session_id}:session`.  
    - On Error: Continue output.

18. **Create Error Output Node (Set)**  
    - Type: Set  
    - Set static retry message "Please retry."  
    - Connect AI Agent error output to this node, then to Call Back.

19. **Create Taxi Service Node (Langchain Tool Workflow)**  
    - Type: Tool Workflow  
    - Link to Taxi Service sub-workflow.  
    - Connect as AI tool input to AI Agent.

20. **Create Taxi Booking Worker Node (Execute Workflow)**  
    - Link to Taxi Booking Worker sub-workflow.  
    - Connect from Provider Switch.

21. **Create Taxi Service Redirect Node (Execute Workflow)**  
    - Link to Taxi Service sub-workflow for direct invocation.  
    - Connect from Provider Switch.

22. **Create Call Back Node (Execute Workflow)**  
    - Link to Demo Call Back sub-workflow.  
    - Connect outputs from Rated Output, Output, and Error Output nodes.

23. **Create Output Node (Set)**  
    - Prepare final output data before callback.  
    - Connect from Chat Switch.

24. **Create Chat Switch Node (Switch)**  
    - Use to route new session outputs to Output or Test Output nodes.

25. **Create Test Output Node (Set)**  
    - Used for testing purposes.

26. **(Optional) Create Test Trigger and Test Fields Nodes**  
    - For testing input flows.

**Credentials to configure:**  
- Redis credentials (used by Rate Limit, Session, Provider, New Session nodes)  
- Postgres credentials (used by Postgres Chat Memory, Load User Memory, Save User Memory)  
- AI Model credentials as needed for language model node (API keys, OAuth, etc.)

**Sub-workflows required:**  
- Telegram Call In Workflow (or your own trigger workflow)  
- Taxi Service sub-workflow  
- Taxi Booking Worker sub-workflow  
- Demo Call Back sub-workflow  

Ensure these workflows are imported or created and accessible.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                                                                                      |
|--------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Pull and Set up required SQL from GitHub repository                                              | https://github.com/ChatPayLabs/n8n-chatbot-core                                                                    |
| Create Redis credentials following n8n integration docs                                          | https://docs.n8n.io/integrations/builtin/credentials/slack/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal |
| Create Postgres credentials following n8n integration docs                                      | https://docs.n8n.io/integrations/builtin/credentials/slack/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal |
| Workflow designed with scaling and queue mode in mind for production                            |                                                                                                                     |
| Supports optional rate limiting, long-term memory, multi-service design and error management    |                                                                                                                     |
| Timestamp is used with session ID to create unique sessions, important for platforms without unique chat IDs like Telegram |                                                                                                                     |
| AI Agent prompt is customizable to fit specific use cases                                      |                                                                                                                     |

---

**Disclaimer:** The provided documentation is based exclusively on an n8n automated workflow. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.