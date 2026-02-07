Analyze market demand using GPT-4o, XPOZ MCP, Notion and email reports

https://n8nworkflows.xyz/workflows/analyze-market-demand-using-gpt-4o--xpoz-mcp--notion-and-email-reports-12599


# Analyze market demand using GPT-4o, XPOZ MCP, Notion and email reports

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Workflow name:** Analyze Market Demand using GPT-4o and XPOZ MCP with Notion & Email Reports  
**Purpose:** Runs scheduled, automated market research for a predefined niche/topic by scanning public web + social sources (via XPOZ MCP), extracting high-signal demand insights with GPT‑4o, then producing (1) a Notion-ready summary saved to a Notion database and (2) a stakeholder email sent via Gmail. Includes an error-triggered alert email.

### 1.1 Scheduling & Research Context
Runs on a schedule and injects the niche, keyword query, and analyst notes that guide the research.

### 1.2 Market Demand Signal Discovery (AI + MCP tools)
An AI agent uses GPT‑4o plus an MCP client tool (XPOZ) to analyze public discussions and extract real demand signals (pain points, switching intent, competitor complaints).

### 1.3 Insight Conversion & Formatting (AI)
A second AI agent converts the extracted insights into structured JSON containing:
- a Notion-ready plain-text summary
- a customer-ready email subject + body

### 1.4 Output Parsing & Validation
Parses the AI’s JSON string into a clean JSON object and fails fast if invalid.

### 1.5 Distribution & Knowledge Storage
Writes the Notion summary to a Notion database and emails the stakeholder.

### 1.6 Error Handling
If any node errors, the workflow triggers an error handler that sends an alert email.

---

## 2. Block-by-Block Analysis

### Block 1 — Scheduling & Research Context
**Overview:** Initiates the workflow on a schedule and defines the research inputs (niche, query, notes) used by the AI agent downstream.  
**Nodes involved:**  
- Scheduled Market Research Trigger  
- Inject Niche, Query, and Research Notes  

#### Node: Scheduled Market Research Trigger
- **Type / role:** `Schedule Trigger` — entry point; runs workflow periodically.
- **Configuration choices:** Uses an interval rule (the JSON shows `interval:[{}]`, meaning it’s configured but the exact schedule is likely set in the UI; verify it).
- **Key variables/expressions:** None.
- **Connections:**  
  - **Output →** Inject Niche, Query, and Research Notes
- **Edge cases / failures:** Misconfigured schedule can cause no runs or unexpected frequency; timezone differences can shift run times.
- **Version notes:** typeVersion `1.3` (schedule UI/options can vary slightly across n8n versions).

#### Node: Inject Niche, Query, and Research Notes
- **Type / role:** `Set` — creates the research “request” payload.
- **Configuration choices (interpreted):** Adds three string fields under `body.*`:
  - `body.niche` = `n8n automations`
  - `body.query` = `Lead generation and CRM automation using n8n`
  - `body.notes` = guidance for what to focus on (pain points, templates, integrations, alternatives).
- **Key variables/expressions:** Literal expressions (`=`) used to set string values.
- **Connections:**  
  - **Input ←** Scheduled Market Research Trigger  
  - **Output →** Analyze Public Discussions for Market Demand Signals (AI)
- **Edge cases / failures:** If fields are renamed/removed, downstream prompt templating will break (empty variables reduce output quality).
- **Version notes:** typeVersion `3.4`.

**Sticky note covering this block:**  
- “## Scheduling & Research Context …”

---

### Block 2 — Market Demand Signal Discovery (AI + MCP tools)
**Overview:** An AI agent (GPT‑4o) queries public sources through an MCP tool (XPOZ) and returns a distilled set of high-signal market demand insights.  
**Nodes involved:**  
- Analyze Public Discussions for Market Demand Signals (AI)  
- OpenAI Reasoning Engine for Market Signal Extraction  
- Public Search & Social Intelligence Connector (MCP Client)

#### Node: OpenAI Reasoning Engine for Market Signal Extraction
- **Type / role:** `lmChatOpenAi` — provides the LLM (GPT‑4o) used by the agent.
- **Configuration choices:** Model set to **gpt-4o**; Responses API disabled.
- **Credentials:** OpenAI API credential (“OpenAi account 2”).
- **Connections:**  
  - **LLM output (ai_languageModel) →** Analyze Public Discussions for Market Demand Signals (AI)
- **Edge cases / failures:** Invalid API key, quota/rate limits, model not available in account/region, network timeouts.
- **Version notes:** typeVersion `1.3` (LangChain node interface can evolve).

#### Node: Public Search & Social Intelligence Connector (MCP Client)
- **Type / role:** `mcpClientTool` — tool connector the agent can call to access XPOZ MCP search/social intelligence.
- **Configuration choices:**
  - Endpoint URL: `https://mcp.xpoz.ai/mcp`
  - Auth: Bearer token (HTTP Bearer Auth credential)
- **Credentials:** `httpBearerAuth` (“saurabh xpoz”).
- **Connections:**  
  - **Tool output (ai_tool) →** Analyze Public Discussions for Market Demand Signals (AI)
- **Edge cases / failures:** Invalid/expired bearer token, endpoint downtime, tool schema changes, request throttling, MCP incompatibility.
- **Version notes:** typeVersion `1.2`. Also has `rewireOutputLogTo: "ai_tool"` (logs routed as tool output).

#### Node: Analyze Public Discussions for Market Demand Signals (AI)
- **Type / role:** `langchain.agent` — orchestrates reasoning + tool usage to produce market insights.
- **Configuration choices:**
  - Prompt includes variables: `{{$json.body.niche}}`, `{{$json.body.query}}`, `{{$json.body.notes}}`
  - System message defines strict rules: high-signal only, public info only, no fluff, state if weak demand.
  - Max iterations: 30 (agent can make multiple tool calls).
  - Output parser enabled (`hasOutputParser: true`) to structure agent output (still treated as text in later steps).
- **Connections:**  
  - **Input ←** Inject Niche, Query, and Research Notes  
  - **LLM input ←** OpenAI Reasoning Engine for Market Signal Extraction (ai_languageModel)  
  - **Tool input ←** Public Search & Social Intelligence Connector (MCP Client) (ai_tool)  
  - **Output →** Convert Market Signals into Notion Summary and Customer Email (AI)
- **Edge cases / failures:** Tool returns irrelevant/noisy data; agent may output very long text; iteration limit reached; MCP tool errors; prompt-variable missing; output parser mismatch.
- **Version notes:** typeVersion `3` (agent node behavior may vary by n8n/LangChain versions).

**Sticky note covering this block:**  
- “## Market Demand Signal Discovery …”

---

### Block 3 — Insight Conversion & Formatting (AI)
**Overview:** A second AI agent transforms the raw insight text into strictly valid JSON with a Notion summary and an email draft.  
**Nodes involved:**  
- Convert Market Signals into Notion Summary and Customer Email (AI)  
- OpenAI Reasoning Engine for Insight Formatting

#### Node: OpenAI Reasoning Engine for Insight Formatting
- **Type / role:** `lmChatOpenAi` — GPT‑4o for formatting/rewriting.
- **Configuration choices:** Model **gpt-4o**; Responses API disabled.
- **Credentials:** OpenAI API credential (“OpenAi account 2”).
- **Connections:**  
  - **LLM output (ai_languageModel) →** Convert Market Signals into Notion Summary and Customer Email (AI)
- **Edge cases / failures:** Same as other OpenAI node (quota, auth, timeouts).
- **Version notes:** typeVersion `1.3`.

#### Node: Convert Market Signals into Notion Summary and Customer Email (AI)
- **Type / role:** `langchain.agent` — converts insights to a strict JSON structure.
- **Configuration choices:**
  - Prompt instructs: Notion-ready summary (plain text), plus professional email subject/body.
  - Enforces **JSON-only** output with schema:
    - `notion_summary` (text)
    - `email.subject`
    - `email.body`
  - System message rules: no markdown, no emojis, no hallucinations, simple language; summary “4–6 short bullet-style lines (plain text)”.
  - Input data injected from prior agent: `{{ $json.output }}`
  - Max iterations: 30
- **Connections:**  
  - **Input ←** Analyze Public Discussions for Market Demand Signals (AI)  
  - **LLM input ←** OpenAI Reasoning Engine for Insight Formatting (ai_languageModel)  
  - **Output →** Parse Structured Insight Output from AI
- **Edge cases / failures:** Model may still output non-JSON or trailing text → parse failure downstream; if `{{$json.output}}` is empty, output quality degrades.
- **Version notes:** typeVersion `3`.

**Sticky note covering this block:**  
- “## Insight Conversion & Formatting …”

---

### Block 4 — Output Parsing & Validation
**Overview:** Ensures the AI’s output is valid JSON before writing to Notion or emailing stakeholders.  
**Nodes involved:**  
- Parse Structured Insight Output from AI

#### Node: Parse Structured Insight Output from AI
- **Type / role:** `Code` — JSON parsing + validation gate.
- **Configuration choices (interpreted):**
  - Reads `const rawOutput = $json.output;`
  - Throws if missing/not a string
  - `JSON.parse(rawOutput)` with explicit error if parse fails
  - Returns parsed object as the new item JSON
- **Connections:**  
  - **Input ←** Convert Market Signals into Notion Summary and Customer Email (AI)  
  - **Output →** Save Market Research Insight to Notion Database  
  - **Output →** Send Market Insight Email to Stakeholder
- **Edge cases / failures:** Any non-JSON output breaks the workflow here (by design); large JSON strings are fine but may hit size limits depending on instance settings.
- **Version notes:** typeVersion `2`.

**Sticky note covering this block:**  
- “## Output Parsing & Validation …”

---

### Block 5 — Distribution & Knowledge Storage
**Overview:** Stores the Notion summary in a Notion database and sends the email draft to the stakeholder via Gmail.  
**Nodes involved:**  
- Save Market Research Insight to Notion Database  
- Send Market Insight Email to Stakeholder

#### Node: Save Market Research Insight to Notion Database
- **Type / role:** `Notion` — creates a database page to archive insights.
- **Configuration choices:**
  - Resource: **Database Page**
  - Target database: “keyword based research analysis summery” (ID `2da802b9-1fa0-80ae-b132-f6314abec640`)
  - Sets property `summery` (title-type) to `{{$json.notion_summary}}`
  - Title parameter is set to `data` (but the key property mapping is what matters for Notion DB entries).
- **Credentials:** Notion API credential (“Notion account 2”).
- **Connections:**  
  - **Input ←** Parse Structured Insight Output from AI  
  - **Output →** none
- **Edge cases / failures:** Wrong database ID, missing permission for integration, property name mismatch (`summery|title` must match the DB schema), Notion API rate limits.
- **Version notes:** typeVersion `2.2`.

#### Node: Send Market Insight Email to Stakeholder
- **Type / role:** `Gmail` — sends the formatted email to a stakeholder.
- **Configuration choices:**
  - `sendTo`: `user@example.com` (placeholder to replace)
  - `subject`: `{{$json.email.subject}}`
  - `message`: `{{$json.email.body}}`
  - Email type: text
- **Credentials:** Gmail OAuth2 credential (“Gmail credentials”).
- **Connections:**  
  - **Input ←** Parse Structured Insight Output from AI  
  - **Output →** none
- **Edge cases / failures:** OAuth token expired, Gmail API scopes insufficient, invalid recipient, sending limits, subject/body missing due to upstream formatting errors.
- **Version notes:** typeVersion `2.2`.

**Sticky note covering this block:**  
- “## Distribution & Knowledge Storage …”

---

### Block 6 — Error Handling
**Overview:** Catches workflow failures anywhere and emails an alert containing node name, error message, and timestamp.  
**Nodes involved:**  
- Workflow Error Handler  
- Send a message1

#### Node: Workflow Error Handler
- **Type / role:** `Error Trigger` — secondary entry point that runs only when the workflow errors.
- **Configuration choices:** Default (no parameters).
- **Connections:**  
  - **Output →** Send a message1
- **Edge cases / failures:** Only triggers on execution errors; it won’t catch “bad data” unless it causes a node to throw (e.g., Code node does).
- **Version notes:** typeVersion `1`.

#### Node: Send a message1
- **Type / role:** `Gmail` — sends an error alert email.
- **Configuration choices:**
  - `sendTo`: `user@example.com` (replace with ops/dev address)
  - Subject: “Workflow Error Alert”
  - Message uses expressions:
    - Error node: `{{ $json.node.name }}`
    - Error message: `{{ $json.error.message }}`
    - Timestamp: `{{ $now.toISO() }}`
  - Email type: text (message includes emoji + markdown-like formatting, but sent as plain text).
- **Credentials:** Gmail OAuth2 credential (“jyothi”).
- **Connections:**  
  - **Input ←** Workflow Error Handler  
  - **Output →** none
- **Edge cases / failures:** Same Gmail auth/sending limits as above; if error payload shape differs, expressions could render blank.
- **Version notes:** typeVersion `2.2`.

**Sticky note covering this block:**  
- “## Error Handling …”

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Workflow Error Handler | n8n-nodes-base.errorTrigger | Triggers on workflow failure | (error event) | Send a message1 | ## Error Handling; Sends alerts when the workflow fails |
| Send a message1 | n8n-nodes-base.gmail | Sends error alert email | Workflow Error Handler | — | ## Error Handling; Sends alerts when the workflow fails |
| Sticky Note7 | n8n-nodes-base.stickyNote | Comment: Error handling | — | — | ## Error Handling; Sends alerts when the workflow fails |
| Scheduled Market Research Trigger | n8n-nodes-base.scheduleTrigger | Scheduled entry point | (schedule) | Inject Niche, Query, and Research Notes | ## Scheduling & Research Context; Controls when research runs and defines the niche, keywords, and analyst focus. |
| Inject Niche, Query, and Research Notes | n8n-nodes-base.set | Defines niche/query/notes payload | Scheduled Market Research Trigger | Analyze Public Discussions for Market Demand Signals (AI) | ## Scheduling & Research Context; Controls when research runs and defines the niche, keywords, and analyst focus. |
| Analyze Public Discussions for Market Demand Signals (AI) | @n8n/n8n-nodes-langchain.agent | Agent does market-demand extraction using tools | Inject Niche, Query, and Research Notes; OpenAI Reasoning Engine for Market Signal Extraction (ai_languageModel); Public Search & Social Intelligence Connector (MCP Client) (ai_tool) | Convert Market Signals into Notion Summary and Customer Email (AI) | ## Market Demand Signal Discovery; Analyzes public discussions to identify real problems, demand, and buying intent. |
| Public Search & Social Intelligence Connector (MCP Client) | @n8n/n8n-nodes-langchain.mcpClientTool | MCP tool access to XPOZ public intelligence | — | Analyze Public Discussions for Market Demand Signals (AI) (ai_tool) | ## Market Demand Signal Discovery; Analyzes public discussions to identify real problems, demand, and buying intent. |
| OpenAI Reasoning Engine for Market Signal Extraction | @n8n/n8n-nodes-langchain.lmChatOpenAi | GPT‑4o model for discovery agent | — | Analyze Public Discussions for Market Demand Signals (AI) (ai_languageModel) | ## Market Demand Signal Discovery; Analyzes public discussions to identify real problems, demand, and buying intent. |
| Convert Market Signals into Notion Summary and Customer Email (AI) | @n8n/n8n-nodes-langchain.agent | Agent formats insights into strict JSON | Analyze Public Discussions for Market Demand Signals (AI); OpenAI Reasoning Engine for Insight Formatting (ai_languageModel) | Parse Structured Insight Output from AI | ## Insight Conversion & Formatting; Transforms raw insights into Notion summaries and customer-ready emails. |
| OpenAI Reasoning Engine for Insight Formatting | @n8n/n8n-nodes-langchain.lmChatOpenAi | GPT‑4o model for formatting agent | — | Convert Market Signals into Notion Summary and Customer Email (AI) (ai_languageModel) | ## Insight Conversion & Formatting; Transforms raw insights into Notion summaries and customer-ready emails. |
| Parse Structured Insight Output from AI | n8n-nodes-base.code | Validates/parses AI JSON output | Convert Market Signals into Notion Summary and Customer Email (AI) | Save Market Research Insight to Notion Database; Send Market Insight Email to Stakeholder | ## Output Parsing & Validation; Parses and validates structured AI output for safe downstream use. |
| Save Market Research Insight to Notion Database | n8n-nodes-base.notion | Stores insight summary in Notion DB | Parse Structured Insight Output from AI | — | ## Distribution & Knowledge Storage; Stores insights in Notion and sends summaries to stakeholders. |
| Send Market Insight Email to Stakeholder | n8n-nodes-base.gmail | Emails stakeholder with insights | Parse Structured Insight Output from AI | — | ## Distribution & Knowledge Storage; Stores insights in Notion and sends summaries to stakeholders. |
| Sticky Note | n8n-nodes-base.stickyNote | Comment: overall workflow description/setup | — | — | ## 🔎 Analyze Market Demand using GPT-4o and XPOZ MCP with Notion & Email Reports (contains setup steps) |
| Sticky Note1 | n8n-nodes-base.stickyNote | Comment: scheduling/context | — | — | ## Scheduling & Research Context; Controls when research runs and defines the niche, keywords, and analyst focus. |
| Sticky Note2 | n8n-nodes-base.stickyNote | Comment: discovery | — | — | ## Market Demand Signal Discovery; Analyzes public discussions to identify real problems, demand, and buying intent. |
| Sticky Note3 | n8n-nodes-base.stickyNote | Comment: conversion/formatting | — | — | ## Insight Conversion & Formatting; Transforms raw insights into Notion summaries and customer-ready emails. |
| Sticky Note4 | n8n-nodes-base.stickyNote | Comment: parsing/validation | — | — | ## Output Parsing & Validation; Parses and validates structured AI output for safe downstream use. |
| Sticky Note5 | n8n-nodes-base.stickyNote | Comment: storage/distribution | — | — | ## Distribution & Knowledge Storage; Stores insights in Notion and sends summaries to stakeholders. |
| Sticky Note6 | n8n-nodes-base.stickyNote | Comment: demo video link | — | — | ## 🎥 Workflow Demo Video; https://www.youtube.com/watch?v=QnpauEj5Ck8 |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n named:  
   “Analyze Market Demand using GPT-4o and XPOZ MCP with Notion & Email Reports”.

2. **Add node: Schedule Trigger**
   - Node type: **Schedule Trigger**
   - Configure the desired run frequency (daily/weekly/etc.).
   - Connect it to the next node.

3. **Add node: Set**
   - Node name: “Inject Niche, Query, and Research Notes”
   - Add fields:
     - `body.niche` (string) → e.g. `n8n automations`
     - `body.query` (string) → e.g. `Lead generation and CRM automation using n8n`
     - `body.notes` (string) → your analyst focus guidance
   - Connect: **Schedule Trigger → Set**

4. **Add node: OpenAI Chat Model (LangChain)**
   - Node type: **OpenAI Chat Model** (`lmChatOpenAi`)
   - Model: **gpt-4o**
   - Credentials: configure **OpenAI API** credential (API key).
   - Name it: “OpenAI Reasoning Engine for Market Signal Extraction”.

5. **Add node: MCP Client Tool (LangChain)**
   - Node type: **MCP Client Tool** (`mcpClientTool`)
   - Endpoint: `https://mcp.xpoz.ai/mcp`
   - Authentication: **Bearer Auth**
   - Credentials: create **HTTP Bearer Auth** credential with your XPOZ token.
   - Name it: “Public Search & Social Intelligence Connector (MCP Client)”.

6. **Add node: AI Agent (LangChain) for discovery**
   - Node type: **AI Agent** (`langchain.agent`)
   - Name: “Analyze Public Discussions for Market Demand Signals (AI)”
   - Prompt: include the niche/query/notes fields via expressions:
     - `{{$json.body.niche}}`, `{{$json.body.query}}`, `{{$json.body.notes}}`
   - System message: set rules for high-signal-only, public data only, no fluff, state if demand is weak.
   - Max iterations: `30`
   - Enable output parser if available (optional but matches the original setup).
   - Wire connections:
     - **Set → Agent** (main)
     - **OpenAI model → Agent** via **ai_languageModel**
     - **MCP tool → Agent** via **ai_tool**

7. **Add node: OpenAI Chat Model (LangChain) for formatting**
   - Node type: `lmChatOpenAi`
   - Model: **gpt-4o**
   - Credentials: same OpenAI credential (or another)
   - Name: “OpenAI Reasoning Engine for Insight Formatting”.

8. **Add node: AI Agent (LangChain) for JSON formatting**
   - Node name: “Convert Market Signals into Notion Summary and Customer Email (AI)”
   - Prompt requirements:
     - Must return **JSON only** with keys: `notion_summary`, `email.subject`, `email.body`
     - “No markdown, no emojis”
     - Inject input as `{{$json.output}}` from the previous agent
   - Max iterations: `30`
   - Wire:
     - **Discovery Agent → Formatting Agent** (main)
     - **Formatting OpenAI model → Formatting Agent** (ai_languageModel)

9. **Add node: Code**
   - Node name: “Parse Structured Insight Output from AI”
   - Paste logic equivalent to:
     - Read `$json.output`
     - Throw if missing
     - `JSON.parse`
     - Return parsed object as `json`
   - Connect: **Formatting Agent → Code**

10. **Add node: Notion**
   - Node type: **Notion**
   - Resource: **Database Page**
   - Credentials: configure Notion integration credential and share the target database with the integration.
   - Database: select your database (create one if needed).
   - Map properties:
     - Set the database “Title” property (named `summery` in the original) to `{{$json.notion_summary}}`
   - Connect: **Code → Notion**

11. **Add node: Gmail (send email)**
   - Node type: **Gmail**
   - Credentials: Gmail OAuth2 (connect Google account, grant send scope).
   - To: stakeholder email (replace placeholder)
   - Subject: `{{$json.email.subject}}`
   - Message: `{{$json.email.body}}`
   - Email type: Text
   - Connect: **Code → Gmail** (in parallel with Notion)

12. **Add error handling**
   - Add node: **Error Trigger** named “Workflow Error Handler”.
   - Add node: **Gmail** named “Send a message1”.
     - To: your ops/dev email
     - Subject: “Workflow Error Alert”
     - Body includes:
       - `{{$json.node.name}}`
       - `{{$json.error.message}}`
       - `{{$now.toISO()}}`
   - Connect: **Error Trigger → Gmail**

13. **Test**
   - Execute workflow manually once.
   - Confirm:
     - Discovery agent returns meaningful content in `output`
     - Formatting agent returns **strict JSON** in `output`
     - Code node parses successfully
     - Notion page is created and Gmail is sent

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “## 🔎 Analyze Market Demand using GPT-4o and XPOZ MCP with Notion & Email Reports” + included setup steps (schedule, inputs, OpenAI creds, MCP creds, Notion DB access, stakeholder email) | Workflow-wide sticky note (overview and setup guidance) |
| “## 🎥 Workflow Demo Video … @[youtube](QnpauEj5Ck8)” | https://www.youtube.com/watch?v=QnpauEj5Ck8 |