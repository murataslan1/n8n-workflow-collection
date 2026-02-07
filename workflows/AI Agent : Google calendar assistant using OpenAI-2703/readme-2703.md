AI Agent : Google calendar assistant using OpenAI

https://n8nworkflows.xyz/workflows/ai-agent---google-calendar-assistant-using-openai-2703


# AI Agent : Google calendar assistant using OpenAI

### 1. Workflow Overview

This workflow is a beginner-friendly AI Agent designed to assist users with managing their Google Calendar through natural language chat interactions. It leverages OpenAI’s GPT-4o model to interpret user requests and perform two primary calendar-related tasks:

- **Creating events** in Google Calendar  
- **Retrieving events** from Google Calendar within specified date ranges

The workflow is structured into logical blocks that handle input reception, AI processing with memory, and tool integration for calendar operations. It includes built-in guardrails and user guidance to ensure clarity and correctness in interactions.

**Logical Blocks:**

- **1.1 Input Reception:** Captures chat messages from users as the workflow trigger.  
- **1.2 AI Agent Processing:** Uses an AI agent node configured with system prompts and tools to interpret user intent and manage conversation context.  
- **1.3 Language Model & Memory:** Employs an OpenAI chat model and a window buffer memory node to maintain conversational context.  
- **1.4 Google Calendar Tools:** Two nodes that serve as callable tools for the AI agent to either create or retrieve calendar events based on user input.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block serves as the entry point of the workflow, triggering execution whenever a chat message is received from the user interface.

- **Nodes Involved:**  
  - When chat message received

- **Node Details:**  
  - **When chat message received**  
    - *Type:* Chat Trigger (LangChain)  
    - *Role:* Listens for incoming chat messages to start the workflow.  
    - *Configuration:* Default options, webhook ID assigned for external chat interface integration.  
    - *Expressions/Variables:* None.  
    - *Input:* External chat interface or webhook.  
    - *Output:* Passes user chat input to the AI Agent node.  
    - *Edge Cases:* Failure to receive messages if webhook misconfigured or network issues; no message content leads to no action.  
    - *Notes:* Sticky note explains alternative input options like Slack, Teams, or custom webhooks.

#### 2.2 AI Agent Processing

- **Overview:**  
  This block contains the core AI agent node that interprets user messages, manages dialogue flow, and decides when to invoke calendar tools. It uses a system prompt with date awareness and tool-calling capabilities.

- **Nodes Involved:**  
  - Calendar AI Agent  
  - Sticky Note1 (explains AI agent configuration)

- **Node Details:**  
  - **Calendar AI Agent**  
    - *Type:* LangChain Agent Node  
    - *Role:* Processes user input, applies system instructions, manages tool usage (event creation/retrieval), and handles dialogue logic.  
    - *Configuration:*  
      - Input text: `={{ $json.chatInput }}` (user message from trigger)  
      - System message: Detailed prompt instructing the agent to act as a Google Calendar assistant, including current date via `{{ DateTime.local().toFormat('cccc d LLLL yyyy') }}`, tool usage guidelines, and user interaction strategies (clarity, validation, proactivity).  
      - Tools defined: Event Creation and Event Retrieval with expected variables (`start_date`, `end_date`, `event_title`, `event_description`).  
      - Prompt type: Define (custom system prompt).  
    - *Input:* User chat message from trigger node.  
    - *Output:* Calls appropriate calendar tool nodes or returns messages to user.  
    - *Edge Cases:* Ambiguous user requests, missing date ranges, or incomplete event details trigger clarifying questions. Potential failures include expression errors if variables are missing or malformed, or tool call failures if credentials are invalid.  
    - *Notes:* Sticky note highlights the AI agent’s prompt design and guardrails.

#### 2.3 Language Model & Memory

- **Overview:**  
  This block supports the AI agent by providing the language model for generating responses and a temporary memory buffer to maintain recent conversation context.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - Window Buffer Memory  
  - Sticky Note2 (OpenAI model explanation)  
  - Sticky Note3 (Memory explanation)

- **Node Details:**  
  - **OpenAI Chat Model**  
    - *Type:* LangChain OpenAI Chat Model  
    - *Role:* Provides the underlying GPT-4o language model for the AI agent’s text generation.  
    - *Configuration:*  
      - Model: `gpt-4o` (high relevance, default)  
      - Credentials: OpenAI API key (user must configure)  
    - *Input:* Receives prompt and context from AI agent node.  
    - *Output:* Returns generated chat completions.  
    - *Edge Cases:* API key missing or invalid, rate limits, network timeouts, or exceeding token limits.  
    - *Notes:* Sticky note suggests alternative models and providers supporting tool-calling.  

  - **Window Buffer Memory**  
    - *Type:* LangChain Memory Buffer Window  
    - *Role:* Maintains a sliding window of the last 5 messages for context in the conversation.  
    - *Configuration:* Default window size of 5 messages.  
    - *Input:* Conversation messages from AI agent.  
    - *Output:* Provides context to AI agent for coherent dialogue.  
    - *Edge Cases:* Memory is temporary; conversation history lost on workflow restart. For persistent storage, external databases recommended.  
    - *Notes:* Sticky note references Supabase for persistent chat memory.

#### 2.4 Google Calendar Tools

- **Overview:**  
  These nodes are external tool integrations that the AI agent calls to perform calendar operations: retrieving events or creating new events based on user instructions.

- **Nodes Involved:**  
  - Google Calendar - Get Events  
  - Google Calendar - Create events  
  - Sticky Note4 (Get Events explanation)  
  - Sticky Note5 (Create Events explanation)

- **Node Details:**  
  - **Google Calendar - Get Events**  
    - *Type:* Google Calendar Tool Node  
    - *Role:* Retrieves calendar events within a specified date range.  
    - *Configuration:*  
      - Operation: `getAll` (fetch all events)  
      - Time range: `timeMin` and `timeMax` dynamically set from AI variables `{{ $fromAI('start_date') }}` and `{{ $fromAI('end_date') }}`  
      - Calendar: User-selectable list (default empty, requires user credential setup)  
      - Tool description: Used only when date range is provided.  
    - *Input:* Called by AI agent with date range variables.  
    - *Output:* Returns event data to AI agent.  
    - *Edge Cases:* Missing or invalid date range, invalid calendar credentials, API quota limits, or no events found.  
    - *Notes:* Sticky note clarifies usage and dynamic variable injection.

  - **Google Calendar - Create events**  
    - *Type:* Google Calendar Tool Node  
    - *Role:* Creates a new calendar event with specified details.  
    - *Configuration:*  
      - Operation: Create event with start and end times from AI variables  
      - Additional fields: Summary (event title), description, attendees (empty by default), no default reminders  
      - Calendar: User-selectable list (requires OAuth2 credentials)  
      - Tool description: Used only when date range and event details are confirmed.  
    - *Input:* Called by AI agent with event details variables (`start_date`, `end_date`, `event_title`, `event_description`).  
    - *Output:* Confirmation of event creation.  
    - *Edge Cases:* Missing or invalid event details, calendar access errors, API limits, or user cancellation during confirmation.  
    - *Notes:* Sticky note explains confirmation step and variable usage.

---

### 3. Summary Table

| Node Name                   | Node Type                          | Functional Role                     | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                          |
|-----------------------------|----------------------------------|-----------------------------------|-----------------------------|----------------------------|----------------------------------------------------------------------------------------------------|
| When chat message received   | Chat Trigger (LangChain)          | Entry point, receives user input  | —                           | Calendar AI Agent           | Explains entry point and alternative input options (Slack, Teams, webhooks, etc.)                  |
| Calendar AI Agent            | LangChain Agent                   | Core AI processing and tool calls | When chat message received   | Google Calendar - Get Events, Google Calendar - Create events | Explains AI agent setup, system prompt, tool usage, and guardrails                                  |
| OpenAI Chat Model            | LangChain OpenAI Chat Model       | Language model for AI agent       | Calendar AI Agent (ai_languageModel) | Calendar AI Agent           | Describes model choice (gpt-4o), alternatives, and tool-calling support                            |
| Window Buffer Memory         | LangChain Memory Buffer Window    | Maintains recent conversation context | Calendar AI Agent (ai_memory) | Calendar AI Agent           | Explains temporary memory and suggests persistent storage options                                 |
| Google Calendar - Get Events | Google Calendar Tool Node         | Retrieves events from calendar    | Calendar AI Agent (ai_tool)  | Calendar AI Agent           | Details usage for event retrieval with date range variables                                       |
| Google Calendar - Create events | Google Calendar Tool Node       | Creates new calendar events       | Calendar AI Agent (ai_tool)  | Calendar AI Agent           | Details usage for event creation, confirmation, and variables                                     |
| Sticky Note                  | Sticky Note                      | Documentation and guidance        | —                           | —                          | See individual sticky notes for detailed explanations                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add a **LangChain Chat Trigger** node named `When chat message received`.  
   - Configure it with default options and assign a webhook ID for chat interface integration.

2. **Add AI Agent Node:**  
   - Add a **LangChain Agent** node named `Calendar AI Agent`.  
   - Set the input text to `={{ $json.chatInput }}` to receive user messages.  
   - Configure the system message with the detailed prompt instructing the AI to act as a Google Calendar assistant, including the current date variable:  
     ```
     You are a Google Calendar assistant.
     Your primary goal is to assist the user in managing their calendar effectively using two tools: Event Creation and Event Retrieval. Always base your responses on the current date: 
     {{ DateTime.local().toFormat('cccc d LLLL yyyy') }}.
     ...
     ```
   - Define two tools within this agent:  
     - **Event Creation:** expects `start_date`, `end_date`, `event_title`, `event_description`  
     - **Event Retrieval:** expects `start_date`, `end_date`  
   - Set prompt type to "define".

3. **Connect Trigger to AI Agent:**  
   - Link the output of `When chat message received` to the input of `Calendar AI Agent`.

4. **Add OpenAI Chat Model Node:**  
   - Add a **LangChain OpenAI Chat Model** node named `OpenAI Chat Model`.  
   - Set the model to `gpt-4o` (or alternative like `gpt-4o-mini` for cost-saving).  
   - Configure credentials with a valid OpenAI API key.  
   - Connect the AI Agent node’s `ai_languageModel` input to this node’s output.

5. **Add Window Buffer Memory Node:**  
   - Add a **LangChain Memory Buffer Window** node named `Window Buffer Memory`.  
   - Use default settings (window size = 5 messages).  
   - Connect the AI Agent node’s `ai_memory` input to this node’s output.

6. **Add Google Calendar - Get Events Node:**  
   - Add a **Google Calendar Tool** node named `Google Calendar - Get Events`.  
   - Set operation to `getAll`.  
   - Configure `timeMin` and `timeMax` with expressions:  
     - `timeMin`: `={{ $fromAI('start_date') }}`  
     - `timeMax`: `={{ $fromAI('end_date') }}`  
   - Set calendar to user-selectable list (empty by default).  
   - Connect the AI Agent node’s `ai_tool` input to this node’s output.

7. **Add Google Calendar - Create events Node:**  
   - Add a **Google Calendar Tool** node named `Google Calendar - Create events`.  
   - Configure start and end times with expressions:  
     - `start`: `={{ $fromAI('start_date') }}`  
     - `end`: `={{ $fromAI('end_date') }}`  
   - Add additional fields:  
     - Summary: `={{ $fromAI('event_title') }}` (uppercase recommended)  
     - Description: `={{ $fromAI('event_description') }}`  
     - Attendees: empty array  
     - Disable default reminders  
   - Set calendar to user-selectable list (empty by default).  
   - Connect the AI Agent node’s `ai_tool` input to this node’s output.

8. **Connect Nodes Appropriately:**  
   - Ensure `When chat message received` → `Calendar AI Agent`  
   - `Calendar AI Agent` → `OpenAI Chat Model` (ai_languageModel)  
   - `Calendar AI Agent` → `Window Buffer Memory` (ai_memory)  
   - `Calendar AI Agent` → `Google Calendar - Get Events` (ai_tool)  
   - `Calendar AI Agent` → `Google Calendar - Create events` (ai_tool)

9. **Configure Credentials:**  
   - For OpenAI Chat Model, add OpenAI API credentials.  
   - For both Google Calendar nodes, add Google OAuth2 credentials with calendar access permissions.

10. **Test the Workflow:**  
    - Deploy and activate the workflow.  
    - Use the chat interface or webhook to send messages like:  
      - "Create an event called 'Team Meeting' next Monday from 10 AM to 11 AM."  
      - "Show me my events for last week."  
    - Confirm the AI agent asks for missing details and performs calendar operations accordingly.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                       |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| This workflow is designed as a simple AI Agent template for beginners to understand AI agent concepts, tool calling, and OpenAI usage costs.                                                                                                                                                                                                               | Workflow description                                                                                 |
| Sticky notes within the workflow provide detailed explanations of each node’s role, configuration, and usage tips.                                                                                                                                                                                                                                           | Embedded in workflow                                                                                 |
| For persistent chat memory beyond the temporary window buffer, consider integrating with databases like Supabase.                                                                                                                                                                                                                                           | https://supabase.com/                                                                                |
| Alternative input methods include using webhook nodes to connect with interfaces such as Streamlit or OpenWebUI, or communication platforms like Slack, Teams, or Discord.                                                                                                                                                                                  | https://docs.streamlit.io/develop/tutorials/llms/build-conversational-apps, https://docs.openwebui.com/ |
| To enhance the AI agent, explore additional Google Calendar node options (e.g., adding attendees), multi-user calendar support, and expanding tool capabilities.                                                                                                                                                                                            | Sticky Note6 in workflow                                                                            |

---

This documentation provides a comprehensive understanding of the AI Agent Google Calendar assistant workflow, enabling users and developers to reproduce, modify, and troubleshoot it effectively.