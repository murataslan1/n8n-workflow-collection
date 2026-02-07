AI-powered RAG configuration assistant: From form to email recommendations

https://n8nworkflows.xyz/workflows/ai-powered-rag-configuration-assistant--from-form-to-email-recommendations-11990


# AI-powered RAG configuration assistant: From form to email recommendations

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** AI-powered RAG configuration assistant: From form to email recommendations  
**Workflow name (JSON):** Generate AI-powered RAG recommendations from form submission to email  
**Status:** Inactive (`active: false`)  
**Purpose:** Collects a user’s requirements via an n8n Form, optionally ingests an uploaded file, prepares a consolidated “requirements package”, sends it to an LLM agent (via OpenRouter) that decides a recommended RAG configuration, generates an n8n workflow artifact from those recommendations, formats an HTML report, and emails the results via Gmail.

### Logical blocks
**1.1 Input Reception (Form submission)**  
Entry point that receives form data.

**1.2 Input Normalization & Routing (detect file vs manual)**  
Parses/structures the incoming data and branches depending on whether a file was uploaded.

**1.3 Content Extraction & Consolidation (file text or manual text → merged)**  
Extracts file content (if present) or uses manual input, then merges into one unified object.

**1.4 AI Preparation (build prompt-ready payload)**  
Creates the fields needed by the agent (prompt context, constraints, recipient email, etc.).

**1.5 AI Decision Engine (LLM agent + OpenRouter model)**  
LLM agent determines the RAG configuration recommendations.

**1.6 Artifact Generation + Delivery (workflow attachment + HTML + Gmail)**  
Turns the agent’s output into an n8n workflow representation, creates an attachment, formats an HTML report, and emails it.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception (Form submission)

**Overview:** Receives user inputs from an n8n Form Trigger and starts the workflow execution.

**Nodes involved:**
- **Form Trigger**

#### Node details
**Form Trigger**
- **Type / role:** `n8n-nodes-base.formTrigger` — workflow entry point for n8n Forms.
- **Configuration (interpreted):** Parameters are empty in the JSON, so the form schema (fields, required inputs, file upload field) is not visible here. Typically this node defines:
  - Text fields (e.g., use case, data sources, constraints)
  - Optional file upload field (binary)
  - Email destination (often collected here)
- **Inputs/Outputs:**
  - **Output:** to **Analyze Input**
- **Edge cases / failures:**
  - Missing required form fields (if configured)
  - File upload size limits (n8n instance / reverse proxy)
  - Binary data not present even if user intended to upload

---

### 2.2 Input Normalization & Routing

**Overview:** Converts raw form submission into a structured representation and decides whether to process an uploaded file or fall back to manual text.

**Nodes involved:**
- **Analyze Input**
- **Check File Upload**

#### Node details
**Analyze Input**
- **Type / role:** `n8n-nodes-base.code` — custom parsing/normalization step.
- **Configuration (interpreted):** Code parameters are not included in JSON, but based on downstream logic it likely:
  - Extracts relevant form fields into a consistent JSON structure
  - Detects/standardizes the binary property name for uploaded files
  - Prepares fields for later prompt assembly
- **Connections:**
  - **Input:** from **Form Trigger**
  - **Output:** to **Check File Upload**
- **Edge cases / failures:**
  - JavaScript errors (undefined fields, unexpected form structure)
  - Assumes a specific binary property name that doesn’t match actual form field
  - Non-UTF8 content assumptions

**Check File Upload**
- **Type / role:** `n8n-nodes-base.if` — branching logic.
- **Configuration (interpreted):** Conditions are not shown. It likely checks whether:
  - A binary file exists (e.g., `{{$binary}}` has a key), or
  - A specific field like `file` / `upload` exists and has size > 0
- **Connections:**
  - **Input:** from **Analyze Input**
  - **True branch (index 0):** to **Extract File Content**
  - **False branch (index 1):** to **Manual Input Path**
- **Edge cases / failures:**
  - Misconfigured condition leading to wrong branch
  - Binary present but empty / unsupported MIME type

---

### 2.3 Content Extraction & Consolidation

**Overview:** Extracts content from an uploaded file (if present) or uses manual inputs, then merges both paths into a single unified data payload.

**Nodes involved:**
- **Extract File Content**
- **Manual Input Path**
- **Merge Analysis**

#### Node details
**Extract File Content**
- **Type / role:** `n8n-nodes-base.code` — converts uploaded binary into usable text.
- **Configuration (interpreted):** Not shown; commonly does one of the following:
  - Reads binary buffer and decodes to text
  - For PDFs/DOCX, might require additional parsing (not visible here—if it’s pure Code node, it must implement parsing or assume plain text)
  - Outputs a `content`/`documentText` field for prompt
- **Connections:**
  - **Input:** from **Check File Upload** (true path)
  - **Output:** to **Merge Analysis** (Input 0)
- **Edge cases / failures:**
  - Unsupported file type (PDF/DOCX) without proper parser
  - Large files causing memory/time issues
  - Encoding issues (UTF-16, etc.)

**Manual Input Path**
- **Type / role:** `n8n-nodes-base.code` — constructs an equivalent payload when no file is uploaded.
- **Configuration (interpreted):** Not shown; likely:
  - Takes form text area fields (requirements, sample data, constraints)
  - Produces a normalized `documentText` or `requirementsText`
- **Connections:**
  - **Input:** from **Check File Upload** (false path)
  - **Output:** to **Merge Analysis** (Input 1)
- **Edge cases / failures:**
  - Missing manual fields leading to empty context for the AI
  - Inconsistent output keys vs file path output (breaks merge/prompt)

**Merge Analysis**
- **Type / role:** `n8n-nodes-base.merge` — merges the two mutually exclusive paths.
- **Configuration (interpreted):** Parameters not shown. Given the wiring (file path into input 0, manual path into input 1), it likely uses a merge mode that:
  - Passes through whichever input arrives (common in “Append” or “Merge By Position” setups when one input is empty)
- **Connections:**
  - **Inputs:** from **Extract File Content** (0) and **Manual Input Path** (1)
  - **Output:** to **Prepare for AI**
- **Edge cases / failures:**
  - If merge mode expects both inputs, execution can stall waiting for the other branch
  - Conflicting field names and unexpected overwrite behavior

---

### 2.4 AI Preparation (build prompt-ready payload)

**Overview:** Shapes the merged content into a deterministic structure that the agent can consume reliably (prompt fields, metadata, email target).

**Nodes involved:**
- **Prepare for AI**

#### Node details
**Prepare for AI**
- **Type / role:** `n8n-nodes-base.set` — maps/renames fields, sets defaults.
- **Configuration (interpreted):** Parameters are empty in JSON. In a typical implementation it would:
  - Set `requirements`, `constraints`, `dataDescription`, `documentText`
  - Add flags like `hasFile`
  - Capture recipient email (used later by Gmail)
  - Possibly build a `prompt` field or structured “agent input”
- **Connections:**
  - **Input:** from **Merge Analysis**
  - **Output:** to **Configuration Decision Engine**
- **Edge cases / failures:**
  - Missing fields causing later expressions/prompts to be incomplete
  - Accidentally removing binary or needed metadata if “Keep Only Set” is enabled (unknown here)

---

### 2.5 AI Decision Engine (LLM agent + OpenRouter model)

**Overview:** Uses a LangChain Agent node configured with an OpenRouter chat model to produce RAG configuration recommendations and structured output suitable for downstream generation.

**Nodes involved:**
- **Configuration Decision Engine**
- **OpenRouter LLM**

#### Node details
**OpenRouter LLM**
- **Type / role:** `@n8n/n8n-nodes-langchain.lmChatOpenRouter` — provides a chat LLM via OpenRouter.
- **Configuration (interpreted):** Not shown; typically includes:
  - OpenRouter API credential
  - Model name (e.g., `openai/gpt-4o-mini`, `anthropic/claude-*`, etc.)
  - Temperature, max tokens
- **Connections:**
  - Connected via **ai_languageModel** output to the agent’s **ai_languageModel** input.
- **Edge cases / failures:**
  - Invalid/expired OpenRouter API key
  - Model not available on the account/region
  - Rate limits / token limits
  - Safety filters and refusal responses

**Configuration Decision Engine**
- **Type / role:** `@n8n/n8n-nodes-langchain.agent` — orchestrates prompting/tool use (if any) to decide the RAG configuration.
- **Configuration (interpreted):** Parameters not shown. Likely:
  - Uses the prepared fields as context
  - Produces structured recommendations (vector DB choice, chunking, embedding model, retrieval strategy, evaluation steps)
  - Possibly outputs both a human report and a machine JSON spec
- **Connections:**
  - **Main input:** from **Prepare for AI**
  - **Language model input:** from **OpenRouter LLM** (ai_languageModel)
  - **Main output:** to **Generate n8n Workflow**
- **Edge cases / failures:**
  - Prompt/format drift (outputs not in expected schema)
  - Missing deterministic formatting (JSON parsing issues later)
  - Increased latency/timeouts with large context

---

### 2.6 Artifact Generation + Delivery (workflow attachment + HTML + Gmail)

**Overview:** Turns the agent output into an n8n workflow artifact, creates an email attachment, builds an HTML report, and emails it via Gmail.

**Nodes involved:**
- **Generate n8n Workflow**
- **Create Workflow Attachment**
- **Format HTML Report**
- **Send Gmail**

#### Node details
**Generate n8n Workflow**
- **Type / role:** `n8n-nodes-base.code` — converts recommendations into a workflow definition or configuration snippet.
- **Configuration (interpreted):** Not shown. Common patterns:
  - Parses agent output (JSON) into a workflow-like object
  - Produces fields like `workflowJson`, `workflowName`, `explanation`
- **Connections:**
  - **Input:** from **Configuration Decision Engine**
  - **Output:** to **Create Workflow Attachment**
- **Edge cases / failures:**
  - Agent output not valid JSON / unexpected keys
  - Generates invalid n8n workflow structure
  - Missing required fields for attachment creation

**Create Workflow Attachment**
- **Type / role:** `n8n-nodes-base.code` — creates a binary attachment (e.g., `.json`) to email.
- **Configuration (interpreted):** Not shown; typically:
  - Takes `workflowJson` string/object
  - Serializes to JSON text
  - Creates binary data with a filename like `rag-workflow.json`
- **Connections:**
  - **Input:** from **Generate n8n Workflow**
  - **Output:** to **Format HTML Report**
- **Edge cases / failures:**
  - Incorrect binary creation (wrong binary property name)
  - Large attachment size
  - Invalid characters in filename

**Format HTML Report**
- **Type / role:** `n8n-nodes-base.code` — builds an HTML email body summarizing recommendations + instructions.
- **Configuration (interpreted):** Not shown; typically:
  - Produces `subject`, `html`, maybe `text`
  - References recommendations and includes the attached workflow file details
- **Connections:**
  - **Input:** from **Create Workflow Attachment**
  - **Output:** to **Send Gmail**
- **Edge cases / failures:**
  - Missing fields leading to broken template
  - HTML injection risk if user-provided fields are inserted unsafely (should escape)

**Send Gmail**
- **Type / role:** `n8n-nodes-base.gmail` — sends the final email.
- **Configuration (interpreted):** Not shown; typically includes:
  - OAuth2 credentials for Gmail
  - To/Subject/Body mapping
  - Attachments mapping from binary property
- **Connections:**
  - **Input:** from **Format HTML Report**
  - **Output:** none
- **Edge cases / failures:**
  - OAuth token expired/invalid
  - Gmail API scope insufficient (send permission)
  - Attachment mapping incorrect (email sent without attachment)
  - Daily sending limits / rate limits

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Form Trigger | n8n-nodes-base.formTrigger | Entry point: receives form submission | — | Analyze Input |  |
| Analyze Input | n8n-nodes-base.code | Normalize/parse incoming form data | Form Trigger | Check File Upload |  |
| Check File Upload | n8n-nodes-base.if | Branch: file upload present vs not | Analyze Input | Extract File Content; Manual Input Path |  |
| Extract File Content | n8n-nodes-base.code | Decode/parse uploaded file into text | Check File Upload | Merge Analysis |  |
| Manual Input Path | n8n-nodes-base.code | Build text context from manual fields | Check File Upload | Merge Analysis |  |
| Merge Analysis | n8n-nodes-base.merge | Consolidate file/manual paths | Extract File Content; Manual Input Path | Prepare for AI |  |
| Prepare for AI | n8n-nodes-base.set | Shape payload for agent/LLM | Merge Analysis | Configuration Decision Engine |  |
| Configuration Decision Engine | @n8n/n8n-nodes-langchain.agent | Produce RAG recommendations via agent | Prepare for AI; (LLM via ai_languageModel) | Generate n8n Workflow |  |
| OpenRouter LLM | @n8n/n8n-nodes-langchain.lmChatOpenRouter | Chat LLM provider for agent | — | Configuration Decision Engine (ai_languageModel) |  |
| Generate n8n Workflow | n8n-nodes-base.code | Convert recommendations to workflow artifact | Configuration Decision Engine | Create Workflow Attachment |  |
| Create Workflow Attachment | n8n-nodes-base.code | Create binary file attachment (workflow JSON) | Generate n8n Workflow | Format HTML Report |  |
| Format HTML Report | n8n-nodes-base.code | Build HTML email content | Create Workflow Attachment | Send Gmail |  |
| Send Gmail | n8n-nodes-base.gmail | Send email with HTML + attachment | Format HTML Report | — |  |
| Sticky Note | n8n-nodes-base.stickyNote | Canvas note (empty) | — | — |  |
| Sticky Note1 | n8n-nodes-base.stickyNote | Canvas note (empty) | — | — |  |
| Sticky Note2 | n8n-nodes-base.stickyNote | Canvas note (empty) | — | — |  |
| Sticky Note3 | n8n-nodes-base.stickyNote | Canvas note (empty) | — | — |  |
| Sticky Note4 | n8n-nodes-base.stickyNote | Canvas note (empty) | — | — |  |
| Sticky Note5 | n8n-nodes-base.stickyNote | Canvas note (empty) | — | — |  |
| Sticky Note6 | n8n-nodes-base.stickyNote | Canvas note (empty) | — | — |  |
| Sticky Note7 | n8n-nodes-base.stickyNote | Canvas note (empty) | — | — |  |

> Note: All sticky notes have empty content in the provided JSON, so no comments can be attributed to nodes.

---

## 4. Reproducing the Workflow from Scratch

1) **Create a new workflow**
   - Name it: **Generate AI-powered RAG recommendations from form submission to email**
   - (Optional) Set execution order to **v1** (Workflow settings → Execution order).

2) **Add “Form Trigger” (Form)**
   - Node: **Form Trigger**
   - Configure an n8n Form with fields such as:
     - Recipient email (or requester email)
     - Use case description
     - Data/source description
     - Optional file upload field (ensure “Allow file upload” enabled)
   - Ensure the form produces:
     - Standard JSON fields in `$json`
     - Uploaded file in `$binary` under a known key (e.g., `upload`)

3) **Add “Analyze Input” (Code)**
   - Node type: **Code**
   - Implement logic to normalize:
     - `emailTo`
     - `requirementsText`
     - `fileBinaryKey` (if any)
     - Any additional metadata (company, domain, constraints)
   - Connect: **Form Trigger → Analyze Input**

4) **Add “Check File Upload” (IF)**
   - Node type: **IF**
   - Condition example (adapt to your form):
     - Check that `$binary.upload` exists (or the correct binary key)
   - Connect: **Analyze Input → Check File Upload**
   - True output → file path; False output → manual path.

5) **Add “Extract File Content” (Code)**
   - Node type: **Code**
   - Read binary and produce a text field, e.g.:
     - `documentText`
     - `documentName`, `mimeType`
   - If you need PDF/DOCX parsing, implement parsing here (or replace this node with dedicated extractor nodes).
   - Connect: **Check File Upload (true) → Extract File Content**

6) **Add “Manual Input Path” (Code)**
   - Node type: **Code**
   - Build equivalent output when no file:
     - `documentText = requirementsText` (or composed from form fields)
   - Connect: **Check File Upload (false) → Manual Input Path**

7) **Add “Merge Analysis” (Merge)**
   - Node type: **Merge**
   - Configure merge mode so it does not wait forever for both branches (typical: pass-through/append behavior where one branch runs).
   - Connect:
     - **Extract File Content → Merge Analysis (Input 0)**
     - **Manual Input Path → Merge Analysis (Input 1)**

8) **Add “Prepare for AI” (Set)**
   - Node type: **Set**
   - Map final fields used by the agent, for example:
     - `user_requirements`
     - `documentText`
     - `constraints`
     - `output_format` (instruct agent to return JSON)
     - `emailTo`
   - Connect: **Merge Analysis → Prepare for AI**

9) **Add “OpenRouter LLM” (OpenRouter Chat Model)**
   - Node type: **OpenRouter Chat Model** (`lmChatOpenRouter`)
   - Credentials:
     - Create **OpenRouter API** credential (API key)
   - Set model + parameters (temperature/tokens) according to needs.

10) **Add “Configuration Decision Engine” (LangChain Agent)**
   - Node type: **Agent** (`@n8n/n8n-nodes-langchain.agent`)
   - Configure:
     - System instructions: produce RAG configuration recommendations (chunking, embeddings, vector store, retrieval, evaluation).
     - Output schema: strongly recommend forcing JSON with fixed keys (to reduce downstream parse failures).
   - Connect:
     - **Prepare for AI → Configuration Decision Engine (main)**
     - **OpenRouter LLM → Configuration Decision Engine (ai_languageModel)**

11) **Add “Generate n8n Workflow” (Code)**
   - Node type: **Code**
   - Parse agent output and generate:
     - `workflowJson` (stringified JSON)
     - `workflowFilename` (e.g., `rag-recommended-workflow.json`)
     - Any additional fields used in the email report
   - Connect: **Configuration Decision Engine → Generate n8n Workflow**

12) **Add “Create Workflow Attachment” (Code)**
   - Node type: **Code**
   - Convert `workflowJson` into a **binary** property for Gmail attachments (set a filename + mime type `application/json`).
   - Connect: **Generate n8n Workflow → Create Workflow Attachment**

13) **Add “Format HTML Report” (Code)**
   - Node type: **Code**
   - Create:
     - `subject`
     - `html` (recommendations + next steps)
     - Optionally `text`
   - Connect: **Create Workflow Attachment → Format HTML Report**

14) **Add “Send Gmail” (Gmail)**
   - Node type: **Gmail**
   - Credentials:
     - Gmail OAuth2 with scope to send email
   - Map fields:
     - **To:** from `emailTo`
     - **Subject:** from `subject`
     - **Body (HTML):** from `html`
     - **Attachments:** map from the binary property created earlier
   - Connect: **Format HTML Report → Send Gmail**

15) **Test**
   - Submit the form once with **no file** and once **with a file**.
   - Validate:
     - Merge behavior does not stall
     - Agent output parses correctly
     - Email includes attachment and renders HTML

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Sticky notes exist but contain no text in the provided workflow JSON. | n8n canvas notes were empty. |
| Several nodes (Code/IF/Set/Agent/LLM/Gmail) have empty `parameters` in the JSON excerpt, so exact field names, conditions, prompts, and attachment mapping must be defined when rebuilding. | Applies across normalization, branching condition, prompt schema, and email formatting. |