Access Control for AI Agents (RBAC) using Airtable and Telegram

https://n8nworkflows.xyz/workflows/access-control-for-ai-agents--rbac--using-airtable-and-telegram-3988


# Access Control for AI Agents (RBAC) using Airtable and Telegram

### 1. Workflow Overview

This workflow implements a **Role-Based Access Control (RBAC)** system to manage AI agent tool access via **Airtable** and **Telegram**. It is designed to securely control which AI tools an end-user (Telegram user) can access based on roles assigned in Airtable. The workflow can be applied to multi-agent AI setups requiring permission checks before tool invocation.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and User Verification**: Receives Telegram messages, extracts user info, and verifies user permissions via Airtable.
- **1.2 Permission Processing and Tool Filtering**: Uses LangChain code nodes to filter AI tools based on user permissions, replacing unauthorized tools with a fixed denial response.
- **1.3 Main AI Agent Interaction**: Runs the main AI agent with allowed tools, and manages session memory.
- **1.4 Sub-Agent Invocation for Specific Use Cases**: Calls a sub-agent (sub-workflow) dedicated to weather information, with its own permission checks and memory.
- **1.5 Response Delivery**: Sends AI-generated responses back to the Telegram user.
- **1.6 Error Handling and Unknown User Management**: Handles cases where the user is not found in Airtable and sends appropriate Telegram messages.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and User Verification

- **Overview:**  
  This block listens to incoming Telegram messages, extracts the username, and queries Airtable to retrieve the user's granted roles and allowed tools. It verifies if the user exists in the Airtable database.

- **Nodes Involved:**  
  - Telegram Trigger  
  - Get user permissions (Airtable)  
  - Unknown user (If)  
  - Reply: unknown user (Telegram)  

- **Node Details:**

  - **Telegram Trigger**  
    - *Type:* Telegram Trigger  
    - *Role:* Entry point; listens for incoming Telegram messages.  
    - *Configuration:* Listens to "message" updates; connected to Telegram bot credential.  
    - *Input/Output:* Outputs Telegram message JSON for downstream processing.  
    - *Edge cases:* Telegram API connectivity issues; invalid or missing message data.

  - **Get user permissions**  
    - *Type:* Airtable node  
    - *Role:* Queries "Users" table in Airtable for a record matching Telegram username.  
    - *Configuration:* Filters records where `{username} = '{{ $json.message.from.username }}'`; retrieves fields `granted_roles`, `allowed_tools`, and `name`.  
    - *Credentials:* Airtable read-only token credential.  
    - *Input/Output:* Input from Telegram Trigger; outputs user data or empty if not found.  
    - *Edge cases:* Airtable API errors, user not found (empty result).

  - **Unknown user**  
    - *Type:* If node  
    - *Role:* Checks if Airtable query returned empty (user unknown).  
    - *Configuration:* Condition: Checks if input JSON is empty (no user found).  
    - *Input/Output:* Input from Airtable node; two outputs: true (unknown) or false (known).  
    - *Edge cases:* Expression evaluation failure.

  - **Reply: unknown user**  
    - *Type:* Telegram node  
    - *Role:* Sends a message to Telegram chat informing that the user is unknown and should contact a supervisor.  
    - *Configuration:* Uses chat ID from Telegram Trigger; text includes username from input.  
    - *Credentials:* Telegram bot credential.  
    - *Input/Output:* Input from Unknown user node (true branch).  
    - *Edge cases:* Telegram API failures.

---

#### 2.2 Permission Processing and Tool Filtering

- **Overview:**  
  After user verification, this block formats user permissions data and applies a permission check on all connected AI tools. Tools not permitted are replaced by a dummy tool that returns an unauthorized message.

- **Nodes Involved:**  
  - Set input  
  - Check permissions (LangChain Code)  
  - list_granted_roles (toolCode)  
  - list_allowed_tools (toolCode)  
  - calculator (toolCalculator)  
  - Wikipedia (toolWikipedia)  
  - Sticky Note nodes 7, 8, 9 (for context)  

- **Node Details:**

  - **Set input**  
    - *Type:* Set node  
    - *Role:* Prepares and formats user data (name, roles, allowed tools) for downstream use.  
    - *Configuration:* Assigns three variables: `name`, `granted_roles` (array), and `allowed_tools` (array) from Airtable JSON or defaults empty array.  
    - *Input/Output:* Input from Unknown user node (false branch); outputs structured user info.

  - **Check permissions**  
    - *Type:* LangChain Code node  
    - *Role:* Filters AI tools dynamically based on allowed tools list. Unauthorized tools replaced by a dummy tool returning an unauthorized message.  
    - *Configuration:* Custom JS code uses `DynamicTool` from LangChain core; iterates over connected tools compares with `allowed_tools`.  
    - *Expressions:* Uses `$input.item.json.allowed_tools` for permission list; uses input connection data for connected tools.  
    - *Input/Output:* Input is connected AI tools; output is filtered AI tools.  
    - *Edge cases:* Code execution errors; missing or malformed tool data.  
    - *Sticky Note7:* "Uses list of allowed tools gathered from Airtable to check for permissions and replaces denied tools with a fixed instruction..."

  - **list_granted_roles**  
    - *Type:* toolCode (LangChain)  
    - *Role:* Tool that returns a string listing the roles granted to the user.  
    - *Configuration:* JS code concatenates roles array into a string response.  
    - *Input/Output:* Input expects roles array; output is a string message.

  - **list_allowed_tools**  
    - *Type:* toolCode (LangChain)  
    - *Role:* Tool that returns a string listing the tools the user has access to.  
    - *Configuration:* JS code concatenates allowed tools array into a string response.

  - **calculator**  
    - *Type:* toolCalculator (LangChain)  
    - *Role:* A calculator tool connected and permission-checked.

  - **Wikipedia**  
    - *Type:* toolWikipedia (LangChain)  
    - *Role:* Wikipedia knowledge tool connected and permission-checked.

---

#### 2.3 Main AI Agent Interaction

- **Overview:**  
  This block handles processing the user’s chat input with the main AI agent, using the filtered allowed tools and session memory to maintain context.

- **Nodes Involved:**  
  - Main Agent (LangChain agent)  
  - OpenAI Chat Model (lmChatOpenAi)  
  - Simple Memory (memoryBufferWindow)  
  - Reply with results (Telegram)  
  - Sticky Note4, Sticky Note5, Sticky Note6  

- **Node Details:**

  - **Main Agent**  
    - *Type:* LangChain Agent  
    - *Role:* Central AI agent that processes user input text and calls allowed tools.  
    - *Configuration:* System message instructs agent to only use provided tools, never general knowledge; includes user name in prompt. Returns intermediate steps for transparency.  
    - *Input/Output:* Inputs filtered AI tools (from Check permissions), chat input text, and memory; outputs answer to send back.  
    - *Sticky Note4:* "Main agent with the instruction to always use the connected tools instead of general knowledge."  
    - *Edge cases:* Model API errors, tool invocation failures.

  - **OpenAI Chat Model**  
    - *Type:* Language model node  
    - *Role:* Provides GPT-4o language model for the Main Agent.  
    - *Configuration:* Model set to "gpt-4o" with OpenAI credentials.  
    - *Input/Output:* Input from Main Agent’s language model input; output back to agent.  
    - *Edge cases:* API key issues, rate limits.

  - **Simple Memory**  
    - *Type:* memoryBufferWindow (LangChain)  
    - *Role:* Maintains chat history session keyed by Telegram user ID.  
    - *Configuration:* Session key is Telegram user ID; custom key type.  
    - *Input/Output:* Memory input/output wired to Main Agent.  
    - *Edge cases:* Memory buffer limits, session key mismatches.

  - **Reply with results**  
    - *Type:* Telegram  
    - *Role:* Sends the AI agent’s response text back to the Telegram chat.  
    - *Configuration:* Uses chat ID from Telegram Trigger and outputs agent answer.  
    - *Edge cases:* Telegram delivery failures.

---

#### 2.4 Sub-Agent Invocation for Specific Use Cases (Weather Agent)

- **Overview:**  
  Runs a dedicated sub-agent workflow for weather-related queries, applying the same permission checks and session memory concept, but isolated with a different session ID suffix.

- **Nodes Involved:**  
  - When Executed by Another Workflow (executeWorkflowTrigger)  
  - Settings (Set)  
  - Weather Agent (LangChain Agent)  
  - OpenAI Chat Model1 (lmChatOpenAi)  
  - Simple Memory1 (memoryBufferWindow)  
  - Check permissions1 (LangChain Code)  
  - get_coordinates (toolHttpRequest)  
  - get_weather (toolHttpRequest)  
  - weather_agent (toolWorkflow)  
  - Sticky Note8, Sticky Note9, Sticky Note10, Sticky Note7 (context)  

- **Node Details:**

  - **When Executed by Another Workflow**  
    - *Type:* Execute Workflow Trigger  
    - *Role:* Entry trigger when called as sub-workflow by main workflow.  
    - *Inputs:* Parameters `chatInput`, `sessionId`, and `allowed_tools`.  
    - *Output:* Passes inputs downstream for processing.

  - **Settings**  
    - *Type:* Set node  
    - *Role:* Formats inputs received from parent workflow for sub-agent processing.  
    - *Parameters:* Assigns `chatInput`, `sessionId`, and `allowed_tools` from triggering workflow inputs.

  - **Weather Agent**  
    - *Type:* LangChain Agent  
    - *Role:* AI agent specialized for weather queries; uses only connected tools and session memory.  
    - *Configuration:* System message instructs strict use of connected tools only.  
    - *Input/Output:* Receives filtered tools from Check permissions1 and produces output answer.

  - **OpenAI Chat Model1**  
    - *Type:* Language model node  
    - *Role:* Provides GPT-4o-mini model for Weather Agent.  
    - *Edge cases:* Same as main model node.

  - **Simple Memory1**  
    - *Type:* memoryBufferWindow  
    - *Role:* Maintains weather agent session memory using session ID with suffix `_weather_check`.  
    - *Sticky Note10:* "Uses different session ID (suffix), since every agent needs its own memory."

  - **Check permissions1**  
    - *Type:* LangChain Code node  
    - *Role:* Filters AI tools for Weather Agent based on allowed tools. Logic same as Check permissions node.

  - **get_coordinates**  
    - *Type:* toolHttpRequest  
    - *Role:* Tool to retrieve geolocation coordinates by city name from Open-Meteo geocoding API.  
    - *Parameters:* URL with city placeholder; returns latitude and longitude.

  - **get_weather**  
    - *Type:* toolHttpRequest  
    - *Role:* Tool to get current weather from Open-Meteo API using geo coordinates.

  - **weather_agent**  
    - *Type:* toolWorkflow  
    - *Role:* Calls the weather sub-agent workflow as a tool from the main agent.  
    - *Parameters:* Passes chatInput, sessionId, allowed_tools to sub-workflow with defined schema.  
    - *Sticky Note1:* "Select the current workflow as the workflow that should be called."

---

#### 2.5 Response Delivery

- **Overview:**  
  Sends back responses generated by both main and sub-agents to the same Telegram conversation.

- **Nodes Involved:**  
  - Reply with results (Telegram)  
  - Reply: unknown user (Telegram, in error block)

- **Node Details:**

  - **Reply with results**  
    - *Covered in 2.3.*

  - **Reply: unknown user**  
    - *Covered in 2.1.*

---

#### 2.6 Error Handling and Unknown User Management

- **Overview:**  
  Ensures users not found in Airtable receive a clear message and prevents unauthorized access.

- **Nodes Involved:**  
  - Unknown user (If)  
  - Reply: unknown user

- **Covered in 2.1.**

---

### 3. Summary Table

| Node Name                | Node Type                      | Functional Role                                      | Input Node(s)         | Output Node(s)            | Sticky Note                                                                                  |
|--------------------------|--------------------------------|-----------------------------------------------------|-----------------------|---------------------------|----------------------------------------------------------------------------------------------|
| Telegram Trigger          | Telegram Trigger                | Entry point; listens for Telegram messages          |                       | Get user permissions       | Listens to messages directly sent to the bot                                                |
| Get user permissions      | Airtable                       | Fetches user roles and allowed tools from Airtable  | Telegram Trigger      | Unknown user               | Choose Base: Copy Airtable Template and select base here                                    |
| Unknown user             | If                             | Checks if user exists in Airtable                     | Get user permissions  | Reply: unknown user, Set input | Checks if the user was found in Airtable                                                   |
| Reply: unknown user       | Telegram                       | Sends message to unknown users                        | Unknown user          |                           |                                                                                              |
| Set input                 | Set                            | Formats user data for downstream nodes                | Unknown user (false)  | Main Agent                 | Collects input and formats it using required keys                                            |
| Check permissions         | LangChain Code                 | Filters AI tools based on user permissions            | Calculator, Wikipedia, list_granted_roles, list_allowed_tools, weather_agent | Main Agent                 | Uses list of allowed tools gathered from Airtable to check for permissions                   |
| list_granted_roles        | LangChain toolCode             | Returns string of user roles                           | Check permissions     | Check permissions          |                                                                                              |
| list_allowed_tools        | LangChain toolCode             | Returns string of allowed tools                        | Check permissions     | Check permissions          |                                                                                              |
| calculator                | LangChain toolCalculator       | Calculator tool                                       | Check permissions     | Check permissions          | Tools can also be connected without a permission check                                      |
| Wikipedia                 | LangChain toolWikipedia        | Wikipedia tool                                       | Check permissions     | Check permissions          |                                                                                              |
| Main Agent                | LangChain Agent                | Central AI agent processing chat input                | Set input, Check permissions, Simple Memory, OpenAI Chat Model | Reply with results          | Main agent with instruction to always use connected tools; See Sticky Note4                 |
| OpenAI Chat Model         | LangChain lmChatOpenAi         | Language model for Main Agent                         | Main Agent            | Main Agent                 |                                                                                              |
| Simple Memory             | LangChain memoryBufferWindow   | Session memory for Main Agent                         |                         | Main Agent                 |                                                                                              |
| Reply with results        | Telegram                       | Sends AI response back to Telegram                    | Main Agent            |                           |                                                                                              |
| weather_agent             | LangChain toolWorkflow         | Calls weather sub-agent workflow                      | Check permissions     | Check permissions          | Select the current workflow as the workflow that should be called                            |
| When Executed by Another Workflow | Execute Workflow Trigger | Entry point for sub-agent workflow                    |                       | Settings                   |                                                                                              |
| Settings                  | Set                            | Formats inputs for sub-agent                          | When Executed         | Weather Agent              | Collects and formats input from parent workflow / agent                                     |
| Weather Agent             | LangChain Agent                | Sub-agent specialized for weather queries             | Settings, Check permissions1, Simple Memory1, OpenAI Chat Model1 |                           | Sub-agent with specific role to handle weather information; See Sticky Note9                |
| OpenAI Chat Model1        | LangChain lmChatOpenAi         | Language model for Weather Agent                      | Weather Agent         | Weather Agent              |                                                                                              |
| Simple Memory1            | LangChain memoryBufferWindow   | Session memory for Weather Agent                      | Weather Agent         | Weather Agent              | Uses different session ID suffix for separate memory                                        |
| Check permissions1        | LangChain Code                 | Filters AI tools for Weather Agent based on permissions | get_weather, get_coordinates | Weather Agent              | Uses same technique as main agent to check permissions                                      |
| get_coordinates           | LangChain toolHttpRequest      | Obtains geolocation for weather queries               | Check permissions1    | Check permissions1         |                                                                                              |
| get_weather               | LangChain toolHttpRequest      | Obtains current weather data                           | Check permissions1    | Check permissions1         |                                                                                              |
| Sticky Note               | Sticky Note                   | Instructional notes                                   |                       |                           | Choose Base: Copy Airtable Template                                                         |
| Sticky Note1              | Sticky Note                   | Instructional notes                                   |                       |                           | Select the current workflow to be called                                                    |
| Sticky Note2              | Sticky Note                   | Instructional notes                                   |                       |                           | Explains permission check logic in code node                                               |
| Sticky Note3              | Sticky Note                   | Instructional notes                                   |                       |                           | Notes tools can be connected without permission check                                      |
| Sticky Note4              | Sticky Note                   | Instructional notes                                   |                       |                           | Main agent instruction to always use connected tools                                       |
| Sticky Note5              | Sticky Note                   | Instructional notes                                   |                       |                           | Collects input and formats using required keys                                             |
| Sticky Note6              | Sticky Note                   | Instructional notes                                   |                       |                           | Warning about chat memory retaining prior responses                                        |
| Sticky Note7              | Sticky Note                   | Instructional notes                                   |                       |                           | Permission check replaces unauthorized tools with denial message                           |
| Sticky Note8              | Sticky Note                   | Instructional notes                                   |                       |                           | Sub-agent uses same permission technique                                                   |
| Sticky Note9              | Sticky Note                   | Instructional notes                                   |                       |                           | Sub-agent dedicated to weather information                                                |
| Sticky Note10             | Sticky Note                   | Instructional notes                                   |                       |                           | Uses different session ID suffix for separate agent memory                                |
| Sticky Note11             | Sticky Note                   | Instructional notes                                   |                       |                           | Telegram Trigger listens to messages sent directly to bot                                 |
| Sticky Note12             | Sticky Note                   | Instructional notes                                   |                       |                           | Unknown user check after Airtable query                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger**  
   - Node type: Telegram Trigger  
   - Configure to listen for `"message"` updates.  
   - Set Telegram bot credential.  
   - Position as workflow entry.

2. **Add Airtable Node "Get user permissions"**  
   - Node type: Airtable  
   - Configure to search "Users" table in your Airtable base.  
   - Set filter formula: `={username} = '{{ $json.message.from.username }}'`.  
   - Retrieve fields: `granted_roles`, `allowed_tools`, `name`.  
   - Use an Airtable read-only API credential.

3. **Add If Node "Unknown user"**  
   - Node type: If  
   - Condition: Check if Airtable output is empty (no user found).  
   - Expression: `{{$json}}` empty.

4. **Add Telegram Node "Reply: unknown user"**  
   - Node type: Telegram  
   - Configure to send message:  
     `Unknown user '{{ $json.message.from.username }}'. Please contact your supervisor.`  
   - Use chat ID from Telegram Trigger.  
   - Connect from Unknown user (true branch).

5. **Add Set Node "Set input"**  
   - Node type: Set  
   - Assign variables:  
     - `name`: `={{ $json.name }}`  
     - `granted_roles`: `={{ $json.granted_roles || [] }}`  
     - `allowed_tools`: `={{ $json.allowed_tools || [] }}`  
   - Connect from Unknown user (false branch).

6. **Add AI Tool Nodes for capabilities**  
   - Add tools such as Wikipedia (toolWikipedia), Calculator (toolCalculator), and toolCode nodes for listing roles and tools (list_granted_roles, list_allowed_tools).  
   - Configure toolCode nodes with JS code to output role/tool lists.

7. **Add LangChain Code Node "Check permissions"**  
   - Node type: LangChain Code  
   - Paste provided JS code that filters connected tools by allowed tools list.  
   - Connect all AI tools as inputs to this node.  
   - Connect "Set input" node to this node for permissions data.

8. **Add LangChain Agent Node "Main Agent"**  
   - Node type: LangChain Agent  
   - Configure prompt to include user name and instruction to only use connected tools.  
   - Connect output of "Check permissions" as ai_tool input.  
   - Connect a language model node (OpenAI Chat Model) using GPT-4o with OpenAI credentials.  
   - Connect a memory node (Simple Memory) using Telegram user ID as session key.  
   - Connect input text from "Set input" (name/chatInput).  
   - Enable returning intermediate steps.

9. **Add Telegram Node "Reply with results"**  
   - Node type: Telegram  
   - Send text output from Main Agent.  
   - Use chat ID from Telegram Trigger.

10. **Create Sub-Workflow for Weather Agent**  
    - Build a new workflow with the nodes: executeWorkflowTrigger (When Executed by Another Workflow), Set (Settings), LangChain Agent (Weather Agent), LangChain Code (Check permissions1), OpenAI Chat Model (OpenAI Chat Model1), Simple Memory (Simple Memory1), and tools get_coordinates and get_weather (toolHttpRequest).  
    - Use a different session ID suffix for memory.  
    - Configure Weather Agent with system message to only use connected tools.  
    - Use OpenAI GPT-4o-mini model.  
    - Connect tools through permission check node (Check permissions1).  
    - Save and note workflow ID.

11. **Add toolWorkflow Node "weather_agent" in main workflow**  
    - Configure to call the weather sub-workflow by ID.  
    - Pass parameters: `chatInput`, `sessionId`, and `allowed_tools`.  
    - Connect as ai_tool input to "Check permissions" node.

12. **Connect all nodes as per the original workflow connections**  
    - Telegram Trigger → Get user permissions → Unknown user  
    - Unknown user (false) → Set input → Check permissions → Main Agent → Reply with results  
    - Unknown user (true) → Reply: unknown user  
    - AI tools → Check permissions  
    - Sub-workflow nodes linked accordingly.

13. **Activate workflow**  
    - Ensure all credentials (Telegram, OpenAI, Airtable) are set up and tested.  
    - Clone Airtable template and configure base ID and table names.  
    - Test with Telegram messages and role assignments in Airtable.

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                                                                                  |
|------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Demo & Explanation Video                                                                                         | https://youtu.be/eNgik9NR0wg (YouTube demo video)                                              |
| Airtable Template for User and Role Management                                                                   | https://airtable.com/appi5nijuvzQbZLJJ/shr8OkLysG1VtlCiz                                        |
| Telegram Credential Documentation                                                                                 | https://docs.n8n.io/integrations/builtin/credentials/telegram/                                  |
| Disclaimer: LangChain Code Node requires self-hosted n8n instance                                                | Workflow only runs on self-hosted n8n due to LangChain Code node dependency                    |
| Warning about chat memory persistence after permission changes                                                    | Sticky Note6: Previous responses may still exist after permission changes                      |
| Role and Tool Lists are dynamically reported via LangChain toolCode nodes                                         | Enables user queries about their current permissions                                          |
| Sub-agent session memory uses unique session key suffix to isolate context                                        | Sticky Note10: Different memory key for sub-agent sessions                                    |

---

This completes the detailed, structured documentation of the "Access Control for AI Agents (RBAC) using Airtable and Telegram" workflow. It enables full understanding, reproduction, and modification of the workflow while anticipating common edge cases and integration points.