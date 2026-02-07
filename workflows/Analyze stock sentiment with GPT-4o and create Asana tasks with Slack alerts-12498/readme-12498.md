Analyze stock sentiment with GPT-4o and create Asana tasks with Slack alerts

https://n8nworkflows.xyz/workflows/analyze-stock-sentiment-with-gpt-4o-and-create-asana-tasks-with-slack-alerts-12498


# Analyze stock sentiment with GPT-4o and create Asana tasks with Slack alerts

## 1. Workflow Overview

**Purpose:** This workflow exposes an HTTP webhook that accepts a stock-market-related query, analyzes **public** social media discussions (Twitter/X and Instagram) with GPT-4o via an MCP social intelligence tool, converts findings into **operations-ready** outputs (an Asana task payload + an executive-style summary), then **creates an Asana task** and **posts an alert in Slack**. A separate error-trigger flow posts failures to Slack for rapid debugging.

**Target use cases:**
- Market research teams needing near-real-time awareness of retail sentiment shifts (fear/opportunity/buy/sell intent).
- Ops/management teams wanting structured tasks and concise alerts instead of raw social media noise.

### Logical blocks
1.1 **Webhook Intake & Query Preparation**  
Receives a POST request and normalizes the incoming query field.

1.2 **Social Market Signal Discovery (AI + social intelligence tool)**  
Uses an AI agent with GPT-4o and an MCP client tool to discover actionable intent signals from public social posts.

1.3 **Ops-Ready Insight Transformation (AI structuring)**  
A second AI agent converts the signals into strict JSON containing an Asana task payload, Slack-ready executive summary, key signals, and overall sentiment.

1.4 **Output Parsing & Validation**  
Parses the AI-produced JSON string into a structured object and fails fast if invalid.

1.5 **Distribution & Task Execution**  
Creates the Asana task and sends a Slack alert with the executive summary.

1.6 **Global Error Handling**  
Any workflow error triggers a Slack message containing node name, error message, and timestamp.

---

## 2. Block-by-Block Analysis

### 1.1 Webhook Intake & Query Preparation
**Overview:** Accepts external input and extracts `body.query` into a consistent field used downstream by the AI agent.

**Nodes involved:**
- Receive Stock Market Query Request (Webhook Trigger)
- Extract Stock Market Query from Request Payload

#### Node: Receive Stock Market Query Request (Webhook Trigger)
- **Type / role:** `Webhook` (Trigger). Entry point.
- **Configuration (interpreted):**
  - Method: **POST**
  - Path: `167f8f95-d055-4d26-9dcb-0a3fee135556` (also used as the webhookId)
- **Inputs/outputs:**
  - **Output →** “Extract Stock Market Query from Request Payload”
- **Key data expectations:**
  - Expects request JSON like: `{ "query": "..." }` inside `body` (n8n stores it at `$json.body.query`).
- **Edge cases / failures:**
  - Missing `body.query` → downstream AI prompt receives empty/undefined query.
  - If the webhook receives non-JSON or unexpected content-type, `$json.body` may not parse as expected.
- **Version notes:** Node typeVersion **2.1**; webhook behavior depends on n8n webhook settings (test vs production URL, authentication if later enabled).

#### Node: Extract Stock Market Query from Request Payload
- **Type / role:** `Set` node. Normalizes/keeps the query field.
- **Configuration (interpreted):**
  - Sets a field named **`body.query`** to `{{ $json.body.query }}`
  - No other transformations
- **Inputs/outputs:**
  - **Input:** Webhook payload item
  - **Output →** “Analyze Social Media for Stock Market Intent Signals (AI)”
- **Key expressions:**
  - `={{ $json.body.query }}`
- **Edge cases / failures:**
  - If `$json.body.query` is missing, the field becomes `null/undefined` and may degrade AI results.
- **Version notes:** typeVersion **3.4** (newer Set node with assignments model).

---

### 1.2 Social Market Signal Discovery (AI + social intelligence tool)
**Overview:** An AI agent uses a connected MCP tool to pull relevant public social data and returns up to 10 actionable “intent signals” strictly as JSON.

**Nodes involved:**
- Analyze Social Media for Stock Market Intent Signals (AI)
- OpenAI Reasoning Engine for Market Intent Analysis
- Social Intelligence Data Fetch Tool (MCP Client)

#### Node: OpenAI Reasoning Engine for Market Intent Analysis
- **Type / role:** `lmChatOpenAi` (LangChain chat model). Provides GPT-4o to the agent.
- **Configuration (interpreted):**
  - Model: **gpt-4o**
  - Responses API disabled (`responsesApiEnabled: false`)
- **Credentials:** OpenAI API credential “OpenAi account 2”
- **Connections:**
  - **Output (ai_languageModel) →** “Analyze Social Media for Stock Market Intent Signals (AI)”
- **Edge cases / failures:**
  - Invalid/expired OpenAI key, quota exhaustion, rate limits.
  - Model availability changes or org restrictions.
- **Version notes:** typeVersion **1.3**.

#### Node: Social Intelligence Data Fetch Tool (MCP Client)
- **Type / role:** `mcpClientTool` (LangChain tool). Lets the agent call an external social intelligence endpoint.
- **Configuration (interpreted):**
  - Endpoint URL: `https://mcp.xpoz.ai/mcp`
  - Auth: **Bearer token** (credential “saurabh xpoz”)
- **Connections:**
  - **Output (ai_tool) →** “Analyze Social Media for Stock Market Intent Signals (AI)” as an available tool
- **Edge cases / failures:**
  - Bearer token invalid/expired.
  - Endpoint downtime/timeouts.
  - Tool returns unexpected schema; agent may fail to format output as strict JSON.
- **Version notes:** typeVersion **1.2**.

#### Node: Analyze Social Media for Stock Market Intent Signals (AI)
- **Type / role:** `agent` (LangChain agent). Orchestrates reasoning + tool calls; outputs structured signals.
- **Configuration (interpreted):**
  - Prompt: injects the query: `"{{ $json.body.query }}"`
  - System message defines:
    - Scope: public Twitter/X + Instagram, recent discussions
    - Intent taxonomy: Buy/Sell/Fear/Opportunity/Research
    - Sentiment: Bullish/Bearish/Neutral/Confused
    - Strength: High/Medium/Low; urgency Yes/No
    - Strict output: **JSON array only**, max 10 items, empty `[]` if none
  - Max iterations: **30**
  - Output parser enabled (`hasOutputParser: true`) to enforce structure
- **Inputs/outputs:**
  - **Input:** normalized query item
  - **Output →** “Transform Market Intent Signals into Ops-Ready Actions (AI)”
  - Uses:
    - GPT-4o model node as language model
    - MCP client tool as retrieval tool
- **Key variables:**
  - `{{ $json.body.query }}`
- **Edge cases / failures:**
  - If the agent returns non-JSON (despite instructions), downstream node expects `$json.output` and may break.
  - Tool may fetch irrelevant/noisy data; prompt tries to filter.
  - Iteration limit hit → partial/failed reasoning.
- **Version notes:** typeVersion **3**.

---

### 1.3 Ops-Ready Insight Transformation (AI structuring)
**Overview:** Converts the discovered intent signals into a single strict JSON object containing an Asana task definition, an email/Slack summary, key signals, and an overall sentiment label.

**Nodes involved:**
- Transform Market Intent Signals into Ops-Ready Actions (AI)
- Azure OpenAI Reasoning Engine for Ops Structuring

#### Node: Azure OpenAI Reasoning Engine for Ops Structuring
- **Type / role:** `lmChatAzureOpenAi` (Azure-hosted chat model).
- **Configuration (interpreted):**
  - Model deployment name/value: **gpt-4o-mini**
- **Credentials:** “Azure Open AI account”
- **Connections:**
  - **Output (ai_languageModel) →** “Transform Market Intent Signals into Ops-Ready Actions (AI)”
- **Edge cases / failures:**
  - Azure deployment name mismatch, region restrictions, quota/rate limits.
  - Azure content filtering or policy blocks if prompts/results trigger filters.
- **Version notes:** typeVersion **1**.

#### Node: Transform Market Intent Signals into Ops-Ready Actions (AI)
- **Type / role:** `agent` (LangChain agent). Converts raw signals into an operations payload.
- **Configuration (interpreted):**
  - Prompt references previous agent output via: `{{ $json.output }}`
  - Requires **exact JSON object** with:
    - `asana_task`: title/description/priority/recommended_owner/due_in_days
    - `email_summary`: subject/body
    - `key_signals`: array of normalized insights
    - `overall_market_sentiment`: Bullish/Bearish/Mixed/Uncertain
  - System rules:
    - Output only valid JSON, no markdown
    - Priority rules based on high intent strength + urgency
  - Max iterations: **30**
- **Inputs/outputs:**
  - **Input:** output from first AI agent (expected at `$json.output`)
  - **Output →** “Parse Structured Ops Payload from AI Output”
- **Edge cases / failures:**
  - If upstream AI didn’t produce `$json.output`, this prompt will be empty/malformed.
  - Agent might still output invalid JSON; next Code node will throw.
- **Version notes:** typeVersion **3**.

---

### 1.4 Output Parsing & Validation
**Overview:** Parses the AI output string into a JSON object for safe downstream field access. Explicitly fails if missing or invalid.

**Nodes involved:**
- Parse Structured Ops Payload from AI Output

#### Node: Parse Structured Ops Payload from AI Output
- **Type / role:** `Code` node (JavaScript). Validates presence of `output` and JSON.parse()s it.
- **Configuration (interpreted):**
  - Takes first input item: `const item = $input.first();`
  - Checks `item.json.output` exists; throws if not
  - `JSON.parse(item.json.output)` with try/catch; throws parse error details
  - Returns `{ json: parsed }`
- **Inputs/outputs:**
  - **Input:** AI structuring agent output (expected `output` string)
  - **Outputs →**
    - “Create Asana Task for Market Signal Review”
    - “Send Market Risk & Sentiment Alert to Slack”
- **Edge cases / failures:**
  - AI output contains trailing commentary, markdown, or invalid JSON → parsing fails.
  - AI output already object (not string) → JSON.parse fails unless it’s stringified upstream.
- **Version notes:** typeVersion **2**.

---

### 1.5 Distribution & Task Execution
**Overview:** Creates an Asana task with a formatted “notes” section and posts the manager summary to Slack.

**Nodes involved:**
- Create Asana Task for Market Signal Review
- Send Market Risk & Sentiment Alert to Slack

#### Node: Create Asana Task for Market Signal Review
- **Type / role:** `Asana` node. Creates a task in a workspace/project.
- **Configuration (interpreted):**
  - Authentication: OAuth2
  - Workspace: `1212551193156936`
  - Project: `1212565062132347`
  - Task name: `{{ $json.asana_task.title }}`
  - Due date: `{{ $now.plus({ days: 1 }).toISODate() }}` (note: ignores `due_in_days` field)
  - Notes field: multi-section template including:
    - Overall sentiment: `{{$json.overall_market_sentiment}}`
    - Highlights: references `key_signals[0]` and `key_signals[1]`
    - Full key signals via map/join
    - Owner/priority/timeline fields from `asana_task`
- **Inputs/outputs:**
  - **Input:** parsed structured payload
  - **No downstream nodes**
- **Key expressions / risks:**
  - Direct access: `$json.key_signals[1].market_context` will error if fewer than 2 signals exist.
  - `due_on` is hardcoded to +1 day; may conflict with `asana_task.due_in_days`.
- **Credentials:** Asana OAuth2 credential “saurabh Asana account 4”
- **Edge cases / failures:**
  - OAuth token expired/revoked.
  - Workspace/project IDs invalid or permission denied.
  - Notes field too long (Asana limits), especially if key_signals are verbose.
- **Version notes:** typeVersion **1**.

#### Node: Send Market Risk & Sentiment Alert to Slack
- **Type / role:** `Slack` node. Posts a message to a channel.
- **Configuration (interpreted):**
  - Channel: `general-information` (ID `C09GNB90TED`)
  - Text:
    - Subject line: `{{ $json.email_summary.subject }}`
    - Body: `{{ $json.email_summary.body }}`
- **Inputs/outputs:**
  - **Input:** parsed structured payload
  - **No downstream nodes**
- **Credentials:** Slack API credential “Slack account vivek”
- **Edge cases / failures:**
  - Missing `email_summary` fields → Slack message renders blank.
  - Slack token scopes missing (e.g., chat:write), channel not accessible.
- **Version notes:** typeVersion **2.1**.

---

### 1.6 Global Error Handling
**Overview:** If any node fails during execution, an error trigger runs and posts a diagnostic Slack alert.

**Nodes involved:**
- Error Handler Trigger
- Slack: Send Error Alert

#### Node: Error Handler Trigger
- **Type / role:** `errorTrigger`. Runs on workflow errors (global handler path).
- **Configuration (interpreted):** default; no parameters.
- **Outputs:**
  - **Output →** “Slack: Send Error Alert”
- **Edge cases / failures:**
  - Only triggers if workflow error handling is enabled/used as designed in the environment.
- **Version notes:** typeVersion **1**.

#### Node: Slack: Send Error Alert
- **Type / role:** `Slack` node. Posts formatted error details to Slack.
- **Configuration (interpreted):**
  - Channel: `general-information` (ID `C09GNB90TED`)
  - Message template includes:
    - Node name: `{{ $json.node.name }}`
    - Error message: `{{ $json.error.message }}`
    - Timestamp: `{{ $json.timestamp }}`
- **Credentials:** “Slack account vivek”
- **Edge cases / failures:**
  - If Slack is down or token revoked, errors will not be delivered (and you may lose visibility).
- **Version notes:** typeVersion **2.3**.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Receive Stock Market Query Request (Webhook Trigger) | Webhook | Entry point (POST endpoint) | — | Extract Stock Market Query from Request Payload | ## Webhook Intake & Query Preparation; Receives external stock market queries and normalizes input for analysis. |
| Extract Stock Market Query from Request Payload | Set | Normalizes query field | Receive Stock Market Query Request (Webhook Trigger) | Analyze Social Media for Stock Market Intent Signals (AI) | ## Webhook Intake & Query Preparation; Receives external stock market queries and normalizes input for analysis. |
| Analyze Social Media for Stock Market Intent Signals (AI) | LangChain Agent | Discovers actionable intent signals from public social posts | Extract Stock Market Query from Request Payload; (uses model + tool connections) | Transform Market Intent Signals into Ops-Ready Actions (AI) | ## Social Market Signal Discovery; Analyzes public social media discussions to extract stock market intent, sentiment, and urgency signals. |
| OpenAI Reasoning Engine for Market Intent Analysis | OpenAI Chat Model (LangChain) | LLM for first agent (GPT-4o) | — | Analyze Social Media for Stock Market Intent Signals (AI) (ai_languageModel) | ## Social Market Signal Discovery; Analyzes public social media discussions to extract stock market intent, sentiment, and urgency signals. |
| Social Intelligence Data Fetch Tool (MCP Client) | MCP Client Tool (LangChain) | Tool for fetching social intelligence data | — | Analyze Social Media for Stock Market Intent Signals (AI) (ai_tool) | ## Social Market Signal Discovery; Analyzes public social media discussions to extract stock market intent, sentiment, and urgency signals. |
| Transform Market Intent Signals into Ops-Ready Actions (AI) | LangChain Agent | Structures results into Asana payload + exec summary | Analyze Social Media for Stock Market Intent Signals (AI); (uses Azure model connection) | Parse Structured Ops Payload from AI Output | ## Ops-Ready Insight Transformation; Converts raw market signals into structured actions, priorities, and summaries for operations teams. |
| Azure OpenAI Reasoning Engine for Ops Structuring | Azure OpenAI Chat Model (LangChain) | LLM for second agent (gpt-4o-mini) | — | Transform Market Intent Signals into Ops-Ready Actions (AI) (ai_languageModel) | ## Ops-Ready Insight Transformation; Converts raw market signals into structured actions, priorities, and summaries for operations teams. |
| Parse Structured Ops Payload from AI Output | Code | Validates/parses AI JSON string | Transform Market Intent Signals into Ops-Ready Actions (AI) | Create Asana Task for Market Signal Review; Send Market Risk & Sentiment Alert to Slack | ## Output Parsing & Validation; Safely parses and validates AI-generated structured JSON for downstream use. |
| Create Asana Task for Market Signal Review | Asana | Creates task for market signal review | Parse Structured Ops Payload from AI Output | — | ## Distribution & Task Execution; Creates actionable Asana tasks and sends executive alerts to Slack. |
| Send Market Risk & Sentiment Alert to Slack | Slack | Sends exec summary to Slack channel | Parse Structured Ops Payload from AI Output | — | ## Distribution & Task Execution; Creates actionable Asana tasks and sends executive alerts to Slack. |
| Error Handler Trigger | Error Trigger | Catches workflow failures | — | Slack: Send Error Alert | ## 🚨 Error Handling; Catches any workflow failure and posts an alert to Slack. Includes node name, error message, and timestamp for quick debugging. |
| Slack: Send Error Alert | Slack | Posts error details to Slack | Error Handler Trigger | — | ## 🚨 Error Handling; Catches any workflow failure and posts an alert to Slack. Includes node name, error message, and timestamp for quick debugging. |
| Sticky Note | Sticky Note | Workspace annotation | — | — | ## 📊 Analyze Stock Market Social Media Sentiment using GPT-4o and Create Asana Tasks with Slack Alerts; (contains overview, setup steps, customization) |
| Sticky Note1 | Sticky Note | Workspace annotation | — | — | ## Webhook Intake & Query Preparation; Receives external stock market queries and normalizes input for analysis. |
| Sticky Note2 | Sticky Note | Workspace annotation | — | — | ## Social Market Signal Discovery; Analyzes public social media discussions to extract stock market intent, sentiment, and urgency signals. |
| Sticky Note3 | Sticky Note | Workspace annotation | — | — | ## Ops-Ready Insight Transformation; Converts raw market signals into structured actions, priorities, and summaries for operations teams. |
| Sticky Note4 | Sticky Note | Workspace annotation | — | — | ## Output Parsing & Validation; Safely parses and validates AI-generated structured JSON for downstream use. |
| Sticky Note5 | Sticky Note | Workspace annotation | — | — | ## Distribution & Task Execution; Creates actionable Asana tasks and sends executive alerts to Slack. |
| Sticky Note8 | Sticky Note | Workspace annotation | — | — | ## 🚨 Error Handling; Catches any workflow failure and posts an alert to Slack. Includes node name, error message, and timestamp for quick debugging. |

---

## 4. Reproducing the Workflow from Scratch

1) **Create a new workflow** in n8n. Set **Execution Order** to `v1` (Workflow settings).

2) **Add Webhook Trigger**
   - Node: **Webhook**
   - Method: **POST**
   - Path: `167f8f95-d055-4d26-9dcb-0a3fee135556`
   - Save.

3) **Add Set node to extract/normalize query**
   - Node: **Set**
   - Add field assignment:
     - Name: `body.query`
     - Value (expression): `{{$json.body.query}}`
   - Connect: **Webhook → Set**

4) **Add OpenAI chat model node (GPT-4o)**
   - Node: **OpenAI Chat Model** (LangChain `lmChatOpenAi`)
   - Model: `gpt-4o`
   - Credentials: configure OpenAI API key credential.
   - Keep other options default.

5) **Add MCP Client Tool node (Xpoz MCP)**
   - Node: **MCP Client Tool**
   - Endpoint URL: `https://mcp.xpoz.ai/mcp`
   - Authentication: **Bearer**
   - Credentials: create/use an HTTP Bearer Auth credential with the token.

6) **Add AI Agent for social signal discovery**
   - Node: **AI Agent** (LangChain agent)
   - Prompt text (expression) referencing query:
     - Include: `"{{$json.body.query}}"`
   - System message: paste the workflow’s system message defining scope, intent classes, and **strict JSON array output**.
   - Max iterations: `30`
   - Enable output parsing (if UI exposes it as “Structured Output/Output Parser”, ensure it’s enabled).
   - Connect:
     - **Set → Agent** (main)
     - **OpenAI model → Agent** (as `ai_languageModel`)
     - **MCP tool → Agent** (as `ai_tool`)

7) **Add Azure OpenAI chat model node**
   - Node: **Azure OpenAI Chat Model** (LangChain `lmChatAzureOpenAi`)
   - Model/deployment: `gpt-4o-mini`
   - Credentials: configure Azure OpenAI credential (endpoint, api key, deployment as required by your n8n credential UI).

8) **Add AI Agent for ops structuring**
   - Node: **AI Agent**
   - Prompt text references previous output:
     - `{{$json.output}}`
   - Require strict JSON object with fields:
     - `asana_task`, `email_summary`, `key_signals`, `overall_market_sentiment`
   - Include the priority logic rules in system message.
   - Max iterations: `30`
   - Connect:
     - **Signal discovery Agent → Ops structuring Agent** (main)
     - **Azure model → Ops structuring Agent** (as `ai_languageModel`)

9) **Add Code node to parse AI JSON**
   - Node: **Code**
   - Paste logic:
     - Check `item.json.output` exists
     - `JSON.parse(item.json.output)`
     - Return parsed object as `{ json: parsed }`
   - Connect: **Ops structuring Agent → Code**

10) **Add Asana node to create task**
   - Node: **Asana**
   - Operation: **Create Task**
   - Auth: **OAuth2**
   - Credentials: connect Asana OAuth2.
   - Workspace ID: `1212551193156936`
   - Project ID: `1212565062132347`
   - Name: `{{$json.asana_task.title}}`
   - Notes: use the formatted template referencing:
     - `{{$json.overall_market_sentiment}}`
     - `{{$json.key_signals}}` map/join
     - `{{$json.asana_task.*}}`
   - Due date: `{{$now.plus({ days: 1 }).toISODate()}}`
   - Connect: **Code → Asana**

11) **Add Slack node for market alert**
   - Node: **Slack**
   - Operation: **Post Message** (send text to channel)
   - Credentials: connect Slack API credential with `chat:write`
   - Channel: `general-information` (or your target channel)
   - Text:
     - `{{$json.email_summary.subject}}` + newline + `{{$json.email_summary.body}}`
   - Connect: **Code → Slack**

12) **Add global error handling**
   - Add node: **Error Trigger**
   - Add node: **Slack** (post message)
     - Channel: same or dedicated alerts channel
     - Text include expressions:
       - `{{$json.node.name}}`, `{{$json.error.message}}`, `{{$json.timestamp}}`
   - Connect: **Error Trigger → Slack (error alert)**

13) **Test**
   - Call the webhook (test/production URL) with JSON body:
     - `{ "query": "What are people saying about NVDA and the Nasdaq today?" }`
   - Verify:
     - Slack receives a structured summary
     - Asana task created in the specified project
     - On forced failure (e.g., invalid credential), Slack error alert fires.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Analyze Stock Market Social Media Sentiment using GPT-4o and Create Asana Tasks with Slack Alerts” overview + setup/customization guidance | From the large sticky note in the canvas (no external link included). |
| Error handling: posts node name, error message, timestamp to Slack | From the Error Handling sticky note. |
| Social intelligence tool endpoint | `https://mcp.xpoz.ai/mcp` (MCP Client Tool configuration). |

