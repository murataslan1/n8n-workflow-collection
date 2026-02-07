Anthropic AI Agent: Claude Sonnet 4 and Opus 4 with Think and Web Search tool

https://n8nworkflows.xyz/workflows/anthropic-ai-agent--claude-sonnet-4-and-opus-4-with-think-and-web-search-tool-4399


# Anthropic AI Agent: Claude Sonnet 4 and Opus 4 with Think and Web Search tool

---
### 1. Workflow Overview

This workflow implements a dynamic AI agent system that intelligently routes user chat queries to the most appropriate Anthropic large language model—either **Claude Sonnet 4** or **Claude Opus 4**—based on the nature and complexity of the query. It is designed to optimize response quality by selecting the best model for each use case, leveraging web search and reasoning tools to enhance answers.

**Target Use Cases:**  
- Handling diverse user chat messages requiring AI-generated responses.  
- Dynamically choosing between different Anthropic models depending on query complexity.  
- Integrating external web search to provide up-to-date factual information.  
- Using internal reasoning tools (Think and Calculator) to aid complex queries.  

**Logical Blocks:**  
- **1.1 Input Reception:** Receiving user chat messages via webhook.  
- **1.2 Model Routing:** Analyzing the query to decide which Anthropic model to use.  
- **1.3 Output Parsing:** Parsing the routing agent’s JSON output to extract model choice and prompt.  
- **1.4 AI Agent Processing:** Sending the prompt to the selected Anthropic model with integrated tools (web search, Think, Calculator).  
- **1.5 Tools & Memory:** Supporting reasoning (Think), calculation (Calculator), web search (web_search), and session memory (Simple Memory1).

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Captures incoming chat messages from users and triggers the workflow.

- **Nodes Involved:**  
  - `When chat message received`

- **Node Details:**  
  - **Type:** LangChain Chat Trigger Node  
  - **Configuration:** Listens for incoming chat messages via webhook; no additional options configured.  
  - **Expressions/Variables:** Provides chat message JSON including a sessionId for context.  
  - **Connections:** Outputs to `Anthropic Routing Agent`.  
  - **Version Requirements:** v1.1+ for chat triggers.  
  - **Potential Failures:** Webhook unavailability, malformed input, missing sessionId.  
  - **Sub-workflow:** None.

#### 2.2 Model Routing

- **Overview:**  
  Determines which Anthropic model (Claude Sonnet 4 or Opus 4) should process the user query. Outputs structured JSON with the prompt and selected model.

- **Nodes Involved:**  
  - `Anthropic Routing Agent`  
  - `Structured Output Parser`  

- **Node Details:**  

  - **Anthropic Routing Agent**  
    - **Type:** LangChain Agent Node  
    - **Role:** Acts as a decision-making agent analyzing the user query to select the optimal model.  
    - **Configuration:**  
      - System message clearly describes the routing task, model options, strengths, and output JSON format.  
      - Requires output parsing enabled to produce structured JSON.  
    - **Input:** Receives raw user prompt from `When chat message received`.  
    - **Output:** JSON object with two fields: `"prompt"` (user query) and `"model"` (model name).  
    - **Potential Failures:** Output not in valid JSON, timeout on complex queries, unexpected user input format, Anthropic API errors.  
    - **Sub-workflow:** None.

  - **Structured Output Parser**  
    - **Type:** LangChain Structured Output Parser  
    - **Role:** Parses JSON output from routing agent to extract `prompt` and `model` fields.  
    - **Configuration:** Manual JSON schema defining required properties: `prompt` (string), `model` (string).  
    - **Input:** Raw text output from `Anthropic Routing Agent`.  
    - **Output:** Structured data for downstream use.  
    - **Potential Failures:** Parsing invalid JSON, mismatched schema, empty output.  
    - **Sub-workflow:** None.

#### 2.3 AI Agent Processing

- **Overview:**  
  Executes the user query by sending the prompt to the selected Anthropic model, integrating additional AI tools for enhanced responses.

- **Nodes Involved:**  
  - `AI Agent`  
  - `Sonnet 4 or Opus 4`  
  - `Think`  
  - `Calculator`  
  - `web_search`  
  - `Simple Memory1`

- **Node Details:**  

  - **AI Agent**  
    - **Type:** LangChain Agent Node  
    - **Role:** Main AI engine that processes the prompt using the chosen Anthropic model and AI tools.  
    - **Configuration:**  
      - Uses the `prompt` extracted from `Structured Output Parser`.  
      - System message instructs use of web_search tool, Think tool, and ethical guidelines.  
      - Connects with tools `Think`, `Calculator`, and `web_search`, and memory node `Simple Memory1`.  
    - **Input:** Prompt and model from parsed routing output.  
    - **Output:** Final AI response to user query.  
    - **Potential Failures:** API errors, tool invocation failures, memory session loss, improper prompt formatting.  
    - **Sub-workflow:** None.

  - **Sonnet 4 or Opus 4**  
    - **Type:** LangChain Anthropic LLM Chat Node  
    - **Role:** Executes the AI model request based on the dynamic model name passed from routing.  
    - **Configuration:**  
      - Model ID dynamically set to the `model` field from parsed output (`claude-sonnet-4-20250514` or `claude-opus-4-20250514`).  
      - Uses Anthropic API credentials.  
    - **Input:** Prompt and model name from `AI Agent`.  
    - **Output:** Model-generated response.  
    - **Potential Failures:** Authentication errors, rate limits, invalid model IDs, API downtime.  
    - **Sub-workflow:** None.

  - **Think**  
    - **Type:** LangChain Think Tool  
    - **Role:** Provides internal reasoning/logging to append thoughts during complex query processing.  
    - **Configuration:** Default; no parameters.  
    - **Input:** Invoked by `AI Agent`.  
    - **Output:** Appended reasoning logs.  
    - **Potential Failures:** Tool invocation errors, latency.  
    - **Sub-workflow:** None.

  - **Calculator**  
    - **Type:** LangChain Calculator Tool  
    - **Role:** Performs calculations or numeric reasoning for queries requiring math.  
    - **Configuration:** Default; no parameters.  
    - **Input:** Invoked by `AI Agent`.  
    - **Output:** Calculated results.  
    - **Potential Failures:** Parsing errors of math expressions, unexpected input formats.  
    - **Sub-workflow:** None.

  - **web_search**  
    - **Type:** HTTP Request Tool (custom for Anthropic web_search)  
    - **Role:** Queries the web for up-to-date information using Anthropic’s web_search tool.  
    - **Configuration:**  
      - POST to Anthropic API endpoint `/v1/messages` with JSON body including model, max tokens, user query, and tool config.  
      - Uses Anthropic API credentials.  
      - Headers specify API version and content-type.  
    - **Input:** Search query from `AI Agent`.  
    - **Output:** Web search results integrated into AI responses.  
    - **Potential Failures:** API authentication, network errors, malformed API request, exceeding max uses.  
    - **Sub-workflow:** None.

  - **Simple Memory1**  
    - **Type:** LangChain Memory Buffer Window  
    - **Role:** Maintains session-based memory history to provide context-aware responses.  
    - **Configuration:**  
      - Session key dynamically set from `When chat message received` node’s sessionId.  
      - Custom key type for session persistence.  
    - **Input:** Connected to `AI Agent` for context.  
    - **Output:** Memory buffer appended to AI interactions.  
    - **Potential Failures:** Session ID missing, memory overflow or loss, concurrency issues.  
    - **Sub-workflow:** None.

#### 2.4 Branding and Description Note

- **Overview:**  
  Provides an informational sticky note describing the workflow’s purpose.

- **Node Involved:**  
  - `Sticky Note`

- **Node Details:**  
  - **Type:** n8n Sticky Note  
  - **Configuration:**  
    - Text describing the dynamic model selection and AI optimization purpose.  
    - Positioned visually for user reference only.  
  - **Input/Output:** None.  
  - **Potential Failures:** None.

---

### 3. Summary Table

| Node Name                 | Node Type                                | Functional Role                         | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                                     |
|---------------------------|----------------------------------------|---------------------------------------|------------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------|
| When chat message received| LangChain Chat Trigger                  | Receives user chat messages            | -                            | Anthropic Routing Agent      |                                                                                                                |
| Anthropic Routing Agent    | LangChain Agent                        | Routes query to appropriate model      | When chat message received    | Structured Output Parser, AI Agent |                                                                                                                |
| Structured Output Parser   | LangChain Output Parser Structured     | Parses routing agent JSON output       | Anthropic Routing Agent       | Anthropic Routing Agent      |                                                                                                                |
| AI Agent                  | LangChain Agent                        | Main AI processor integrating tools   | Anthropic Routing Agent       | Sonnet 4 or Opus 4, Think, Calculator, web_search, Simple Memory1 |                                                                                                                |
| Sonnet 4 or Opus 4         | LangChain LLM Chat Anthropic           | Executes chosen Anthropic model        | AI Agent                     | AI Agent                    |                                                                                                                |
| Think                     | LangChain Tool Think                    | Supports internal reasoning            | AI Agent                     | AI Agent                    |                                                                                                                |
| Calculator                | LangChain Tool Calculator               | Performs calculations                   | AI Agent                     | AI Agent                    |                                                                                                                |
| web_search                | HTTP Request Tool (Anthropic API)      | Performs web search                     | AI Agent                     | AI Agent                    |                                                                                                                |
| Simple Memory1            | LangChain Memory Buffer Window          | Maintains session memory                | AI Agent                     | AI Agent                    |                                                                                                                |
| Sticky Note               | n8n Sticky Note                        | Documentation and description          | -                            | -                           | **Dynamic Model Selector for Optimal AI Responses**: The New Anthropic Agent Decisioner is a dynamic AI-powered routing system that automatically selects the most appropriate large language model (Anthropic Sonnet 4 or Opus 4) based on the query’s content and purpose. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Trigger Node:**  
   - Add **LangChain Chat Trigger** node named `When chat message received`.  
   - Configure webhook with default settings to receive chat messages.

2. **Add Routing Agent:**  
   - Add **LangChain Agent** node named `Anthropic Routing Agent`.  
   - Configure system message with instructions describing the routing logic between models `claude-sonnet-4-20250514` and `claude-opus-4-20250514`, including their strengths and output JSON format.  
   - Enable output parsing.  
   - Connect output of `When chat message received` to input of `Anthropic Routing Agent`.

3. **Add Structured Output Parser:**  
   - Add **LangChain Output Parser Structured** node named `Structured Output Parser`.  
   - Manually define JSON schema expecting an object with string properties `prompt` and `model`.  
   - Connect output of `Anthropic Routing Agent` to input of `Structured Output Parser`.

4. **Add Main AI Agent:**  
   - Add **LangChain Agent** node named `AI Agent`.  
   - Set the prompt to reference: `={{ $json.output.prompt }}` to use parsed prompt.  
   - Configure system message explaining use of web_search, Think, and Calculator tools, ethical guidelines, and output formatting rules.  
   - Connect output of `Structured Output Parser` to input of `AI Agent`.

5. **Add Anthropic LLM Node for Dynamic Model:**  
   - Add **LangChain LLM Chat Anthropic** node named `Sonnet 4 or Opus 4`.  
   - Set model to dynamic value referencing: `={{ $json.output.model }}` (model name from parsed output).  
   - Assign Anthropic API credentials for authentication.  
   - Connect `AI Agent` to this node as language model sub-node.

6. **Add Think Tool Node:**  
   - Add **LangChain Tool Think** node named `Think`.  
   - Connect as AI tool node input to `AI Agent`.

7. **Add Calculator Tool Node:**  
   - Add **LangChain Tool Calculator** node named `Calculator`.  
   - Connect as AI tool node input to `AI Agent`.

8. **Add Web Search Tool Node:**  
   - Add **HTTP Request** node named `web_search`.  
   - Configure:  
     - Method: POST  
     - URL: `https://api.anthropic.com/v1/messages`  
     - Headers: `anthropic-version: 2023-06-01`, `content-type: application/json`  
     - Body (JSON): Include dynamic fields `model` and `web_search_question` per Anthropic API spec for web_search tool.  
     - Authentication: use Anthropic API credentials.  
     - Tool description: “Use this tool to search on the web.”  
   - Connect as AI tool node input to `AI Agent`.

9. **Add Session Memory Node:**  
   - Add **LangChain Memory Buffer Window** node named `Simple Memory1`.  
   - Set session key to reference session ID: `={{ $('When chat message received').item.json.sessionId }}`  
   - Configure sessionIdType as `customKey`.  
   - Connect as AI memory input to `AI Agent`.

10. **Connect Output Flow:**  
    - From `When chat message received` → `Anthropic Routing Agent`.  
    - `Anthropic Routing Agent` → `Structured Output Parser`.  
    - `Structured Output Parser` → `AI Agent`.  
    - `AI Agent` connects to tools: `Sonnet 4 or Opus 4`, `Think`, `Calculator`, `web_search`, and memory node `Simple Memory1`.

11. **Add Sticky Note (Optional):**  
    - Add a sticky note with the description explaining the workflow’s purpose as a dynamic model selector between Claude Sonnet 4 and Opus 4.

12. **Credentials Setup:**  
    - Configure Anthropic API credentials named `Anthropic account` with valid API key.  
    - Assign these credentials to all Anthropic-related nodes (`Sonnet 4 or Opus 4`, `Anthropic Routing Agent`, `web_search`).

13. **Test & Validate:**  
    - Deploy the workflow inactive or active as needed.  
    - Send test chat messages to the webhook URL.  
    - Verify routing decisions, model responses, and web search tool integration.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                     | Context or Link                                       |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------|
| The workflow dynamically selects between Anthropic's Claude Sonnet 4 and Opus 4 models based on query complexity and use case, optimizing AI responses. This improves accuracy and efficiency in multi-model AI deployments.                        | Overview and design rationale                         |
| The AI Agent is configured to use a web_search tool for real-time information retrieval, Think tool for internal reasoning, and Calculator for mathematical operations, enhancing response capabilities beyond static knowledge.                  | AI Agent system message instructions                  |
| Ethical guidelines are embedded in the AI Agent system message to ensure privacy, factuality, and neutrality in responses.                                                                                                                     | AI Agent system message                               |
| Anthropic API version used for web_search is `2023-06-01`. Correct header configuration is crucial for tool functionality.                                                                                                                    | HTTP Request node headers                             |
| Session memory uses a custom key derived from the chat session ID to maintain conversation context and improve interaction continuity.                                                                                                         | Simple Memory1 configuration                          |
| For detailed Anthropic API documentation, see: https://console.anthropic.com/docs/api/reference                                                                                                                                               | External resource                                    |
| The sticky note in the workflow provides high-level documentation directly within n8n for user reference.                                                                                                                                       | Sticky Note content in workflow                       |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly accessible.