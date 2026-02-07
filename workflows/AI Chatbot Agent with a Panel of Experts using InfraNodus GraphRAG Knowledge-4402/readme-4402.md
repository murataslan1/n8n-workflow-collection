AI Chatbot Agent with a Panel of Experts using InfraNodus GraphRAG Knowledge

https://n8nworkflows.xyz/workflows/ai-chatbot-agent-with-a-panel-of-experts-using-infranodus-graphrag-knowledge-4402


# AI Chatbot Agent with a Panel of Experts using InfraNodus GraphRAG Knowledge

### 1. Workflow Overview

This n8n workflow implements an AI Chatbot Agent that leverages multiple specialized knowledge experts based on InfraNodus Graph RAG (Retrieval-Augmented Generation) technology. Its main purpose is to provide high-quality, context-aware answers by dynamically selecting and combining insights from different InfraNodus knowledge graphs ("experts") using an AI agent. It is designed for use cases such as support, product ideation, writing assistance, and complex problem-solving that benefit from diverse expert perspectives.

The workflow is logically divided into four main blocks:

- **1.1 Input Reception:** Captures user chat messages via a public or embedded chat interface.
- **1.2 Chat Memory:** Maintains conversation context to enable coherent multi-turn dialogue.
- **1.3 AI Agent & Experts:** Routes user queries to specialized InfraNodus graph experts (EightOS and Polysingularity) via HTTP API calls, and combines their responses intelligently.
- **1.4 Chat Response:** Sends the final AI-generated answer back to the user.

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception

**Overview:**  
This block triggers the workflow upon receiving a chat message from a user. It acts as the entry point for the conversation flow and sets initial parameters for the chatbot session.

**Nodes Involved:**  
- `When chat message received`

**Node Details:**

- **When chat message received**  
  - *Type:* `chatTrigger` (LangChain Chat Trigger)  
  - *Configuration:*  
    - Publicly accessible webhook for chat input.  
    - Options include a title "EightOS Polysingularity Consilium" and subtitle encouraging solution-finding.  
    - Previous session loading is manual, meaning the user or system triggers loading past context explicitly.  
    - Initial system messages instruct the user to ask questions with answers based on InfraNodus GraphRAG analysis.  
  - *Input connections:* None (trigger node)  
  - *Output connections:* Connected to `AI Agent` node  
  - *Potential failure modes:*  
    - Webhook connectivity issues  
    - Invalid or malformed chat input  
    - User session management errors  

---

#### 2.2 Chat Memory

**Overview:**  
Maintains the conversational context using a sliding window memory buffer, allowing the chatbot to reference prior messages for coherent dialogue flow.

**Nodes Involved:**  
- `Simple Memory`

**Node Details:**

- **Simple Memory**  
  - *Type:* `memoryBufferWindow` (LangChain Memory Buffer Window)  
  - *Configuration:* Default settings (no custom parameters specified)  
  - *Input connections:* Receives AI agent state/memory updates  
  - *Output connections:* Feeds updated memory back into the `AI Agent` node  
  - *Purpose:* Tracks conversation history to provide context for AI responses  
  - *Edge cases:*  
    - Memory overflow if too many messages accumulate  
    - Potential loss of context if memory window size is too small  
    - Errors in storing or retrieving conversation state  

---

#### 2.3 AI Agent & Experts

**Overview:**  
This block houses the core logic of the AI agent that selects which "expert" tool to invoke based on the user query. It uses two InfraNodus graph-based experts (EightOS and Polysingularity) accessed via HTTP API calls, and an OpenAI GPT-4o language model for generating or combining responses.

**Nodes Involved:**  
- `AI Agent`  
- `EightOS Expert` (HTTP Request)  
- `Polysingularity Expert` (HTTP Request)  
- `OpenAI Chat Model`

**Node Details:**

- **AI Agent**  
  - *Type:* `agent` (LangChain AI Agent)  
  - *Configuration:*  
    - System prompt instructs the agent to always use at least one of the two InfraNodus experts (EightOS or Polysingularity) before responding.  
    - If both experts provide input, the agent must combine their perspectives into a single actionable response.  
  - *Input connections:* From `When chat message received` node  
  - *Output connections:* To `Simple Memory` and back to the agent’s language model input  
  - *Edge cases:*  
    - Failure to select an appropriate expert  
    - Combining conflicting expert responses improperly  
    - Expression or prompt errors within the agent logic  

- **EightOS Expert**  
  - *Type:* `httpRequestTool`  
  - *Configuration:*  
    - POST request to InfraNodus API endpoint `/api/v1/graphAndAdvice` with parameters:  
      - `name`: "panarchy_eightos" (InfraNodus graph identifier)  
      - `requestMode`: "response"  
      - `prompt`: dynamically injected user query (overridden by AI if needed)  
      - `aiTopics`: true (request topic-based analysis)  
    - Authentication via HTTP Bearer token (InfraNodus API key)  
    - Tool description emphasizes expertise in variability, movement, adaptivity, resilience, and related themes.  
  - *Input connections:* From `AI Agent` node as an AI tool  
  - *Output connections:* Back to `AI Agent`  
  - *Potential failures:*  
    - API authentication errors (invalid or expired token)  
    - Network timeouts or outages  
    - Malformed API request or unexpected API response  
    - InfraNodus service downtime  

- **Polysingularity Expert**  
  - *Type:* `httpRequestTool`  
  - *Configuration:* Similar to EightOS Expert but uses `name`: "polysingularity_overview"  
    - Focus on multiplicity, networks, cognitive practice, community dynamics, and evolution  
  - *Input/Output connections:* Same pattern as EightOS Expert  
  - *Failure modes:* Same as EightOS Expert  

- **OpenAI Chat Model**  
  - *Type:* `lmChatOpenAi` (OpenAI GPT-4o)  
  - *Configuration:*  
    - Model set to GPT-4o for advanced language understanding and generation  
    - Uses stored OpenAI API credentials  
  - *Input connections:* Tied into the AI Agent’s language model input slot  
  - *Output connections:* Feeds into AI Agent for final response generation  
  - *Potential failures:*  
    - API key invalid or rate limits exceeded  
    - Model call timeouts or errors  
    - Unexpected output format or empty responses  

---

#### 2.4 Chat Response

**Overview:**  
Delivers the final response generated by the AI Agent back to the user through the chat interface. This could be enhanced to log conversations or export responses to external systems.

**Nodes Involved:**  
- Implicitly handled by the `When chat message received` node’s chat infrastructure (no dedicated explicit node for response sending in JSON)

**Node Details:**

- No explicit response node, as `When chat message received` node type manages the input/output of chat messages via webhook.

- Potential extensions might include: saving chat logs, forwarding answers to other platforms.

- Potential failures:  
  - Failure to deliver the chat response to the user interface  
  - User interface loading errors  

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                    | Input Node(s)                      | Output Node(s)           | Sticky Note                                                                                          |
|-------------------------|----------------------------------|----------------------------------|----------------------------------|--------------------------|----------------------------------------------------------------------------------------------------|
| When chat message received | LangChain Chat Trigger           | Input Reception (chat trigger)   | None                             | AI Agent                 | You can use this chat inside n8n or make it public or embeddable.                                  |
| AI Agent                | LangChain Agent                   | AI Agent & tool selector          | When chat message received       | Simple Memory, EightOS Expert, Polysingularity Expert, OpenAI Chat Model | Chooses which expert tool to use based on query; combine responses if both used.                    |
| Simple Memory           | LangChain Memory Buffer Window   | Chat Memory                      | AI Agent                        | AI Agent                 | Tracks conversation context for multi-turn dialogue coherence.                                    |
| EightOS Expert          | HTTP Request Tool                | InfraNodus Expert #1              | AI Agent (as ai_tool)            | AI Agent                 | Add your InfraNodus graph here via HTTP node; expert on variability, resilience, panarchy.         |
| Polysingularity Expert  | HTTP Request Tool                | InfraNodus Expert #2              | AI Agent (as ai_tool)            | AI Agent                 | Add your InfraNodus graph here; expert on multiplicity, networks, cognitive practice.              |
| OpenAI Chat Model       | LangChain Chat OpenAI Model      | Language Model for AI Agent      | AI Agent                        | AI Agent                 | GPT-4o used as base language model for generating or combining expert responses.                   |
| Sticky Note             | Sticky Note                     | Documentation / Comments          | None                            | None                     | Multiple notes explaining blocks, usage instructions, and links to InfraNodus resources and videos.|

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Chat Trigger Node:**
   - Add a `LangChain Chat Trigger` node named `When chat message received`.
   - Set it as public webhook.
   - Configure title as "EightOS Polysingularity Consilium".
   - Subtitle: "Let's find a solution to any issue you have".
   - Set initial messages to:  
     "Get an advice based on EightOS and Polysingularity frameworks. Ask your question and I will provide a response based on InfraNodus GraphRAG analysis of those discourses."
   - Set previous session loading to manual.
   - Save and note the generated webhook URL for testing.

2. **Add Chat Memory Node:**
   - Add a `LangChain Memory Buffer Window` node named `Simple Memory`.
   - Use default parameters.
   - This node will keep track of conversation context.

3. **Add AI Agent Node:**
   - Add a `LangChain Agent` node named `AI Agent`.
   - Configure system prompt:  
     "Always use either EightOS or Polysingularity tool before sending a response to the model. You have to use at least one of them, the one that think is more suitable. Or both if both can provide some help. If you used both tools and received responses from both of them, combine them in one response making sure you merge both perspectives. Ask for specific, actionable advice."
   - Connect output of `When chat message received` to this node's main input.
   - Connect `Simple Memory` node to the agent’s AI memory input/output slots.

4. **Add InfraNodus Experts as HTTP Request Tools:**

   - **EightOS Expert**:  
     - Add an `HTTP Request Tool` node named `EightOS Expert`.
     - Set method to POST.
     - Set URL to: `https://infranodus.com/api/v1/graphAndAdvice?doNotSave=true&addStats=true&optimize=develop&includeStatements=true&includeGraphSummary=true&includeGraph=false`.
     - Set body parameters as JSON with fields:  
       - `name`: "panarchy_eightos"  
       - `requestMode`: "response"  
       - `prompt`: Use expression to get user query, e.g., `{{$fromAI('parameters2_Value', 'User query to send to the expert', 'string')}}`  
       - `aiTopics`: true  
     - Set authentication to HTTP Bearer with an InfraNodus API key credential.
     - Add a descriptive tool description explaining the expert’s domain of knowledge.
     - Connect this node as an AI tool input to the `AI Agent` node.

   - **Polysingularity Expert**:  
     - Similar setup as EightOS Expert but set `name` field to "polysingularity_overview".
     - Provide a description focused on multiplicity, networks, and cognitive practice.
     - Connect as second AI tool input to the `AI Agent` node.

5. **Add OpenAI Chat Model:**
   - Add a `LangChain OpenAI Chat Model` node named `OpenAI Chat Model`.
   - Select model "gpt-4o".
   - Provide OpenAI API credentials.
   - Connect this node as the AI language model input to the `AI Agent` node.

6. **Configure Connections:**
   - Connect `When chat message received` node main output to `AI Agent` main input.
   - Connect `AI Agent` AI memory output to `Simple Memory` input and vice versa.
   - Connect `EightOS Expert` and `Polysingularity Expert` as AI tools inputs to `AI Agent`.
   - Connect `OpenAI Chat Model` as AI language model input to `AI Agent`.

7. **Testing and Validation:**
   - Test the webhook URL by sending chat messages.
   - Verify the AI agent invokes InfraNodus experts correctly and combines responses.
   - Validate that chat memory maintains context across multiple messages.
   - Confirm final answers are returned to user via the chat interface.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                   | Context or Link                                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Use your InfraNodus graph as the knowledge base for your AI chatbot. Upload any data to InfraNodus, generate separate knowledge graphs, then connect them as tools to the agent, so it can decide which "expert" to use. InfraNodus' Graph RAG provides high-quality augmented responses. | https://infranodus.com                                                                                               |
| Video demo of the workflow in action: [https://www.youtube.com/watch?v=kS0QTUvcH6E](https://www.youtube.com/watch?v=kS0QTUvcH6E)                                                                                               | Video demonstration link                                                                                             |
| Detailed description and support portal for using InfraNodus Knowledge Graphs as experts in n8n agents: [https://support.noduslabs.com/hc/en-us/articles/20174217658396-Using-InfraNodus-Knowledge-Graphs-as-Experts-for-AI-Chatbot-Agents-in-n8n](https://support.noduslabs.com/hc/en-us/articles/20174217658396-Using-InfraNodus-Knowledge-Graphs-as-Experts-for-AI-Chatbot-Agents-in-n8n) | Official support documentation                                                                                       |
| Ensure that expert nodes have descriptive names and tool descriptions to assist the AI agent in selecting the best expert for the user’s question.                                                                             | Workflow design best practice                                                                                        |
| InfraNodus API key required; can be obtained at [InfraNodus.Com](https://infranodus.com/use-case/ai-knowledge-graphs)                                                                                                          | InfraNodus API key acquisition                                                                                        |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.