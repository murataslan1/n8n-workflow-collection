AI Personal Assistant with GPT-4o: Email, Calendar, Search & CRM Integration

https://n8nworkflows.xyz/workflows/ai-personal-assistant-with-gpt-4o--email--calendar--search---crm-integration-5552


# AI Personal Assistant with GPT-4o: Email, Calendar, Search & CRM Integration

### 1. Workflow Overview

This workflow, named **"🤖 SUPERVISOR AVA"**, implements an AI Personal Assistant leveraging GPT-4o to orchestrate tasks related to Email, Calendar, Search, and CRM (Contacts) through integrated agents and tools. The assistant interacts with users via Telegram, interprets their requests using a GPT-4o-based AI Agent, and delegates specific subtasks to dedicated tool workflows (Calendar, Gmail, Contacts, LinkedIn Commenting), external APIs (Google Search via SerpAPI, Perplexity API), and internal utilities (Calculator, Simple Memory buffer). The assistant then compiles responses and returns them through Telegram.

The workflow is logically grouped into the following blocks:

- **1.1 Input Reception and Context Management**: Receiving user messages via Telegram and maintaining conversational context.
- **1.2 AI Processing and Orchestration**: The core AI Agent that interprets user input, calls other tools/workflows as needed, and generates the reply.
- **1.3 Specialized Tool Workflows and APIs**: Dedicated nodes for handling Calendar, Email (Gmail), Contacts, LinkedIn comments, Search (Google Search via SerpAPI), Perplexity API queries, and Calculator functions.
- **1.4 Output Delivery**: Sending the AI-generated response back to the Telegram user.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Context Management

**Overview:**  
This block captures incoming user messages from Telegram and preserves conversational context for the AI Agent to maintain continuity over multiple exchanges.

**Nodes Involved:**  
- `Telegram Trigger1`  
- `Simple Memory`

**Node Details:**

- **Telegram Trigger1**  
  - *Type & Role:* Telegram Trigger node; entry point for incoming Telegram messages.  
  - *Configuration:* Listens to new "message" updates. Downloads media if any.  
  - *Key Variables:* Accesses `message.text` and `message.chat.id` for input text and user identification.  
  - *Connections:* Output connects to `AI Agent` node.  
  - *Edge Cases:* Telegram API network issues, message format anomalies, missing text content.  

- **Simple Memory**  
  - *Type & Role:* LangChain Memory Buffer Window node; stores recent conversation for context.  
  - *Configuration:* Session key based on Telegram chat ID (`={{ $('Telegram Trigger1').item.json.message.chat.id }}`). Keeps last 7 messages.  
  - *Connections:* Provides memory context input to `AI Agent`.  
  - *Edge Cases:* Session key mismatches, memory overflow, data corruption.  

---

#### 1.2 AI Processing and Orchestration

**Overview:**  
Central AI Agent node interprets user input, decides which specialized tools to call, manages intermediate steps, and outputs the final response text.

**Nodes Involved:**  
- `AI Agent`  
- `OpenRouter Chat Model`

**Node Details:**

- **AI Agent**  
  - *Type & Role:* LangChain Agent node; orchestrates workflow by calling tools and generating responses using GPT-4o.  
  - *Configuration:*  
    - Input text from Telegram message.  
    - System prompt defines AI persona "Ava" and instructs to orchestrate tool calls rather than perform tasks directly.  
    - Tools available: Calendar, Contacts, Gmail, Google Search, Calculator.  
    - Current date/time and timezone (EST - Ottawa) injected dynamically.  
    - Returns intermediate steps for transparency/debugging.  
    - Error-handling mode: continue on errors.  
  - *Key Variables:* `={{ $('Telegram Trigger1').item.json.message.text }}`, current date/time with `$now.toString()`.  
  - *Connections:* Receives memory context input from `Simple Memory`, language model from `OpenRouter Chat Model`, and tool outputs from all specialized nodes via `ai_tool`. Outputs final response to `Response` node.  
  - *Edge Cases:* Misinterpretation of user input, failure in downstream tool nodes, API rate limits, incomplete tool chaining, expression evaluation errors.  

- **OpenRouter Chat Model**  
  - *Type & Role:* Language Model node; provides GPT-4o model for AI Agent.  
  - *Configuration:* Uses OpenRouter API with GPT-4o model. No special options configured.  
  - *Connections:* Provides language model interface to `AI Agent`.  
  - *Edge Cases:* API key expiration, network issues, model version deprecation.  

---

#### 1.3 Specialized Tool Workflows and APIs

**Overview:**  
Nodes in this block represent specialized agents or direct API integrations that perform domain-specific tasks as requested by the AI Agent.

**Nodes Involved:**  
- `Calendar`  
- `Gmail`  
- `Contacts`  
- `LinkedIn Comment Agent`  
- `Google Search`  
- `Perplexity`  
- `Calculator`

**Node Details:**

- **Calendar**  
  - *Type & Role:* Tool Workflow node; delegates calendar-related actions to a sub-workflow named "🤖 Calendar Agent".  
  - *Configuration:* Calls external workflow by ID with no input parameters defined here.  
  - *Connections:* Output back to `AI Agent`.  
  - *Edge Cases:* Sub-workflow downtime, invalid calendar requests, authentication errors.  

- **Gmail**  
  - *Type & Role:* Tool Workflow node; handles email-related tasks via "🤖 Gmail Agent" sub-workflow.  
  - *Configuration:* Calls Gmail agent workflow with no direct inputs here.  
  - *Connections:* Output back to `AI Agent`.  
  - *Edge Cases:* OAuth token expiration, Gmail API quota limits, malformed email request data.  

- **Contacts**  
  - *Type & Role:* Tool Workflow node; manages contact-related actions through "🤖 Contacts Agent".  
  - *Configuration:* Accepts parameters `query` (string) and `aNumber` (number, default 0).  
  - *Connections:* Output back to `AI Agent`.  
  - *Edge Cases:* Contact data inconsistency, sub-workflow errors, invalid query parameters.  

- **LinkedIn Comment Agent**  
  - *Type & Role:* Tool Workflow node; performs LinkedIn commenting tasks via a specialized sub-workflow.  
  - *Configuration:* Accepts `query` parameter as string input; `aNumber` is deprecated/removed.  
  - *Connections:* Output back to `AI Agent`.  
  - *Edge Cases:* LinkedIn API restrictions, comment formatting issues, rate limits.  

- **Google Search**  
  - *Type & Role:* SerpAPI node; performs Google Search queries.  
  - *Configuration:* Uses SerpAPI credentials. No additional parameters configured here (assumed search query passed dynamically).  
  - *Connections:* Output back to `AI Agent`.  
  - *Edge Cases:* API key limits, incorrect query formation, no results returned.  

- **Perplexity**  
  - *Type & Role:* Perplexity API integration node; uses "sonar" model for question answering/search.  
  - *Configuration:* Message payload set to Telegram message text; uses Perplexity API credentials.  
  - *Connections:* Output back to `AI Agent`.  
  - *Edge Cases:* API downtime, malformed input, rate limiting.  

- **Calculator**  
  - *Type & Role:* LangChain Calculator tool node; evaluates mathematical expressions.  
  - *Configuration:* No parameters configured here; the AI Agent passes expressions as needed.  
  - *Connections:* Output back to `AI Agent`.  
  - *Edge Cases:* Invalid math expressions, calculation errors, timeout on complex calculations.  

---

#### 1.4 Output Delivery

**Overview:**  
This block sends the AI Agent's final textual response back to the Telegram user.

**Nodes Involved:**  
- `Response`

**Node Details:**

- **Response**  
  - *Type & Role:* Telegram node; sends messages to users.  
  - *Configuration:*  
    - Sends text from AI Agent output (`={{ $json.output }}`).  
    - Targets chat ID from original Telegram message (`={{ $('Telegram Trigger1').item.json.message.chat.id }}`).  
    - Attribution disabled to avoid extra text appended.  
  - *Connections:* Receives input only from `AI Agent`.  
  - *Edge Cases:* Telegram API send failures, invalid chat ID, message length limits.  

---

### 3. Summary Table

| Node Name              | Node Type                         | Functional Role                         | Input Node(s)          | Output Node(s)       | Sticky Note                               |
|------------------------|----------------------------------|---------------------------------------|-----------------------|----------------------|-------------------------------------------|
| Telegram Trigger1       | telegramTrigger                  | Entry point: receives Telegram input  | —                     | AI Agent             |                                           |
| Simple Memory           | memoryBufferWindow               | Maintains chat context for AI Agent   | —                     | AI Agent             |                                           |
| OpenRouter Chat Model   | lmChatOpenRouter                 | Provides GPT-4o language model        | —                     | AI Agent             |                                           |
| AI Agent               | langchain.agent                  | Orchestrates tools, generates response| Telegram Trigger1, Simple Memory, OpenRouter Chat Model, all tools | Response             |                                           |
| Calculator             | langchain.toolCalculator         | Calculates math expressions            | AI Agent (ai_tool)     | AI Agent             |                                           |
| Calendar               | langchain.toolWorkflow           | Handles calendar-related actions       | AI Agent (ai_tool)     | AI Agent             |                                           |
| Gmail                  | langchain.toolWorkflow           | Handles email-related actions          | AI Agent (ai_tool)     | AI Agent             |                                           |
| Contacts               | langchain.toolWorkflow           | Manages contacts                       | AI Agent (ai_tool)     | AI Agent             |                                           |
| LinkedIn Comment Agent | langchain.toolWorkflow           | Manages LinkedIn comments              | AI Agent (ai_tool)     | AI Agent             |                                           |
| Google Search          | toolSerpApi                     | Performs web search via SerpAPI        | AI Agent (ai_tool)     | AI Agent             |                                           |
| Perplexity             | perplexityTool                  | Performs Q&A/search via Perplexity API| AI Agent (ai_tool)     | AI Agent             |                                           |
| Response               | telegram                        | Sends response message to Telegram user| AI Agent              | —                    |                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node ("Telegram Trigger1")**  
   - Node Type: Telegram Trigger  
   - Parameters: Listen for "message" updates, enable media download.  
   - Credentials: Connect with Telegram Bot API credentials.  
   - Position: Top-left area in canvas.  

2. **Create Simple Memory Node ("Simple Memory")**  
   - Node Type: LangChain Memory Buffer Window  
   - Parameters:  
     - Session Key: `={{ $('Telegram Trigger1').item.json.message.chat.id }}`  
     - Session ID Type: Custom Key  
     - Context Window Length: 7 messages  
   - Connect input: None (standalone)  
   - Connect output: To `AI Agent` node as memory input  

3. **Create OpenRouter Chat Model Node ("OpenRouter Chat Model")**  
   - Node Type: LangChain LM Chat OpenRouter  
   - Parameters:  
     - Model: `openai/gpt-4o` (GPT-4o)  
     - Options: Leave blank/default  
   - Credentials: OpenRouter API credentials with valid API key  
   - Connect output: To `AI Agent` node as language model input  

4. **Create AI Agent Node ("AI Agent")**  
   - Node Type: LangChain Agent  
   - Parameters:  
     - Text input: `={{ $('Telegram Trigger1').item.json.message.text }}`  
     - System Message:  
       ```
       # ROLE

       You are an AI agent called Ava.

       Your job is an orchestrator to call other tools/workflows (Calendar, Contacts, Gmail, Google Search, Calculator). Do not perform tasks yourself.

       You are talking to Jordan.

       Current date/time: {{ $now.toString() }}, Timezone: EST (Ottawa).
       ```  
     - Return intermediate steps: Enabled  
     - On Error: Continue on error  
   - Connect inputs:  
     - From `Telegram Trigger1` (main input)  
     - From `Simple Memory` (ai_memory input)  
     - From `OpenRouter Chat Model` (ai_languageModel input)  
     - From all tool nodes as ai_tool inputs (see below)  
   - Connect output: To `Response` node  

5. **Create Calculator Node ("Calculator")**  
   - Node Type: LangChain Calculator Tool  
   - Parameters: None (accepts expressions dynamically)  
   - Connect output: To `AI Agent` (ai_tool input)  

6. **Create Calendar Node ("Calendar")**  
   - Node Type: LangChain Tool Workflow  
   - Parameters:  
     - Name: "Calendar"  
     - Workflow ID: Select or create a sub-workflow that handles calendar actions ("🤖 Calendar Agent")  
     - Description: For calendar-related actions  
     - Workflow Inputs: Empty object (no inputs mapped here)  
   - Connect output: To `AI Agent` (ai_tool input)  

7. **Create Gmail Node ("Gmail")**  
   - Node Type: LangChain Tool Workflow  
   - Parameters:  
     - Name: "Gmail"  
     - Workflow ID: Sub-workflow for email handling ("🤖 Gmail Agent")  
     - Description: For email-related actions  
     - Workflow Inputs: Empty object  
   - Connect output: To `AI Agent` (ai_tool input)  

8. **Create Contacts Node ("Contacts")**  
   - Node Type: LangChain Tool Workflow  
   - Parameters:  
     - Name: "Contacts"  
     - Workflow ID: Sub-workflow for contacts ("🤖 Contacts Agent")  
     - Description: Contacts-related actions  
     - Workflow Inputs:  
       - `query` (string)  
       - `aNumber` (number, default 0)  
   - Connect output: To `AI Agent` (ai_tool input)  

9. **Create LinkedIn Comment Agent Node ("LinkedIn Comment Agent")**  
   - Node Type: LangChain Tool Workflow  
   - Parameters:  
     - Workflow ID: Sub-workflow for LinkedIn commenting  
     - Description: LinkedIn Comment actions  
     - Workflow Inputs:  
       - `query` (string)  
   - Connect output: To `AI Agent` (ai_tool input)  

10. **Create Google Search Node ("Google Search")**  
    - Node Type: SerpApi node  
    - Parameters: No fixed options, but expects query passed dynamically by AI Agent  
    - Credentials: SerpAPI account with valid API key  
    - Connect output: To `AI Agent` (ai_tool input)  

11. **Create Perplexity Node ("Perplexity")**  
    - Node Type: Perplexity API node  
    - Parameters:  
      - Model: "sonar"  
      - Messages: Pass Telegram message text dynamically  
    - Credentials: Valid Perplexity API credentials  
    - Connect output: To `AI Agent` (ai_tool input)  

12. **Create Response Node ("Response")**  
    - Node Type: Telegram node  
    - Parameters:  
      - Text: `={{ $json.output }}` (output from AI Agent)  
      - Chat ID: `={{ $('Telegram Trigger1').item.json.message.chat.id }}`  
      - Disable "append attribution"  
    - Credentials: Telegram Bot API  
    - Connect input: From `AI Agent` main output  

13. **Connect all nodes according to data flows:**  
    - `Telegram Trigger1` main output → `AI Agent` main input  
    - `Simple Memory` → `AI Agent` ai_memory input  
    - `OpenRouter Chat Model` → `AI Agent` ai_languageModel input  
    - All tool nodes (Calculator, Calendar, Gmail, Contacts, LinkedIn Comment Agent, Google Search, Perplexity) → `AI Agent` ai_tool inputs  
    - `AI Agent` main output → `Response` node input  

14. **Activate and test the workflow** ensuring credentials are valid and all sub-workflows (Calendar, Gmail, Contacts, LinkedIn) exist and are operational.

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The AI Agent is designed as an orchestrator: it does not create emails, calendar events, or contacts directly, but calls dedicated tools/sub-workflows to handle those tasks. | This design promotes modularity and easier maintenance.                                         |
| Timezone is fixed to EST (Ottawa) and current date/time is injected dynamically into the system prompt for contextual awareness by the AI agent. | Important for time-sensitive calendar operations and user clarity.                              |
| Telegram Bot API credentials must support both receiving and sending messages, including media download. | Telegram Bot setup documentation: https://core.telegram.org/bots/api                            |
| SerpAPI and Perplexity API require valid API keys with sufficient quota for search and Q&A capabilities. | SerpAPI docs: https://serpapi.com/ , Perplexity API details (private)                           |
| Sub-workflows ("🤖 Calendar Agent", "🤖 Gmail Agent", "🤖 Contacts Agent", "LinkedIn Comment Agent") must be implemented and linked by workflow IDs. | Ensure these sub-workflows handle inputs and outputs as expected by the AI Agent.               |
| The workflow uses LangChain integration nodes extensively, requiring n8n version 0.210.0 or higher for full compatibility. | Verify n8n version to avoid node compatibility issues.                                          |
| Error handling in AI Agent node is set to continue on errors, meaning partial failures in tool calls won't abort the workflow but might affect response completeness. | Monitor logs for failures and adjust error handling policies if necessary.                      |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.