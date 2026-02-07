Automate SEO research & content gap analysis with GPT-4o, SerpAPI, and Gmail

https://n8nworkflows.xyz/workflows/automate-seo-research---content-gap-analysis-with-gpt-4o--serpapi--and-gmail-11893


# Automate SEO research & content gap analysis with GPT-4o, SerpAPI, and Gmail

## 1. Workflow Overview

**Purpose:** This workflow automates SEO keyword research and content gap analysis by ingesting a keyword via webhook, fetching live Google SERP data (via SerpAPI, localized to India), using GPT‑4o to infer intent/competition/gaps/opportunities, then preparing outputs for UI use, logging to Google Sheets, and emailing a client-ready HTML report via Gmail. It also includes centralized error handling that posts failures to Slack.

**Primary use cases**
- Rapid keyword-level SEO opportunity assessment for marketers/SEO agencies  
- Consistent content gap identification based on real SERP evidence  
- Generating client-ready deliverables (HTML email) + audit trail (Sheets)

### 1.1 Input Reception & Keyword Intake
Receives a POST request containing a keyword and normalizes the incoming payload.

### 1.2 SERP Data Collection (India)
Queries SerpAPI for Google results, constrained to India (via `uule`).

### 1.3 SERP Normalization
Converts raw SerpAPI output into a structured dataset (organic results, videos, related searches).

### 1.4 AI SEO Opportunity & Gap Analysis (GPT‑4o)
Feeds the dataset into a LangChain Agent backed by GPT‑4o, forcing a structured JSON output via an output parser node.

### 1.5 Output Preparation for UI & Reporting
Flattens and maps AI output into UI-friendly fields (including a “confidence” binding), then fans out to email generation and Google Sheets logging.

### 1.6 Client-ready Email Generation & Delivery
Generates a polished HTML email (GPT‑4o) and sends it via Gmail.

### 1.7 Error Handling
Any workflow error triggers a Slack alert with node name, message, and timestamp.

---

## 2. Block-by-Block Analysis

### Block 1 — Input Reception & Keyword Intake
**Overview:** Accepts inbound requests and extracts the keyword into a consistent field used by the SERP query.  
**Nodes involved:**  
- Receive SEO Keyword Analysis Request  
- Extract Keyword from Request Payload

#### Node: Receive SEO Keyword Analysis Request
- **Type / Role:** `Webhook` (n8n-nodes-base.webhook) — entry point; receives the keyword request.
- **Configuration (interpreted):**
  - Method: **POST**
  - Path: `c8996569-9459-4976-bbdd-b800179b3dc7`
- **Key variables/expressions:** none
- **Input / Output:**
  - Input: external HTTP client
  - Output: passes request JSON to the Set node
- **Failure/edge cases:**
  - Missing `body.keyword` will break downstream logic (SERP query becomes empty).
  - If webhook is invoked with non-JSON or unexpected shape, `$json.body.keyword` expression may evaluate to `undefined`.

#### Node: Extract Keyword from Request Payload
- **Type / Role:** `Set` — extracts and standardizes keyword field.
- **Configuration (interpreted):**
  - Sets `body.keyword` to `{{$json.body.keyword}}` (effectively reassigning/ensuring presence)
- **Key expressions:**
  - `={{ $json.body.keyword }}`
- **Input / Output:**
  - Input: webhook payload
  - Output: item with `body.keyword` for SerpAPI node
- **Failure/edge cases:**
  - If `body.keyword` is absent, it will become `null/undefined`, resulting in low-quality or empty SERP results.

---

### Block 2 — Google SERP Data Collection (India)
**Overview:** Fetches live SERP results for the keyword using SerpAPI, localized to India.  
**Nodes involved:**  
- Run Google SERP Search for Keyword (India)

#### Node: Run Google SERP Search for Keyword (India)
- **Type / Role:** `SerpAPI` (n8n-nodes-serpapi.serpApi) — external SERP fetch.
- **Configuration (interpreted):**
  - Query (`q`): `{{$json.body.keyword}}`
  - Results count: `num = 10`
  - Location/localization: `uule = India` (note: SerpAPI’s `uule` is typically an encoded location; using plain “India” may or may not behave as intended depending on SerpAPI behavior)
- **Credentials:** SerpAPI credential required.
- **Input / Output:**
  - Input: item with `body.keyword`
  - Output: SerpAPI response containing `organic_results`, `inline_videos`, `related_searches`, `search_information`, `search_parameters`, etc.
- **Failure/edge cases:**
  - Auth/quota errors from SerpAPI (401/429).
  - If `q` is empty, SerpAPI may return an error or irrelevant default results.
  - Localization may be imperfect if `uule` is not properly formatted/encoded.

---

### Block 3 — SERP Normalization & Dataset Creation
**Overview:** Transforms the SerpAPI response into a smaller, analysis-oriented dataset used by the AI agent.  
**Nodes involved:**  
- Normalize SERP Results into SEO Dataset

#### Node: Normalize SERP Results into SEO Dataset
- **Type / Role:** `Code` — maps raw SERP JSON into a stable schema.
- **Configuration (interpreted):**
  - Extracts:
    - `keyword`: `search_parameters.q`
    - `country`: `search_parameters.uule`
    - `total_results`: `search_information.total_results`
    - `organic_results[]`: position/title/snippet/link/source/date
    - `videos[]`: title/platform/duration/link (from `inline_videos`)
    - `related_searches[]`: list of `query`
- **Key code behaviors:**
  - Defensive defaults: empty string or `null` if fields missing.
  - Always returns a single item with a `json` object.
- **Input / Output:**
  - Input: SerpAPI response
  - Output: normalized dataset consumed by AI analysis
- **Failure/edge cases:**
  - If SerpAPI schema changes (field names differ), mappings may yield empty arrays/fields.
  - If `inline_videos` is absent, `videos` becomes `[]` (safe).

---

### Block 4 — AI SEO Opportunity & Gap Analysis (GPT‑4o + Structured Output)
**Overview:** Uses GPT‑4o to infer intent, competition, gaps, and opportunities from SERP evidence, and enforces structured output via a schema-based parser.  
**Nodes involved:**  
- LLM Engine for Market Intelligence Analysis  
- Analyze Keyword SEO Opportunities (AI)  
- Parse Market Analysis Output JSON

#### Node: LLM Engine for Market Intelligence Analysis
- **Type / Role:** `OpenAI Chat Model` (LangChain) — provides GPT‑4o as the agent’s language model.
- **Configuration (interpreted):**
  - Model: `gpt-4o`
  - Responses API disabled
- **Credentials:** OpenAI API credential required.
- **Connections:**
  - Connected to **Analyze Keyword SEO Opportunities (AI)** via `ai_languageModel`.
- **Failure/edge cases:**
  - OpenAI auth errors, model access errors, rate limits (429), timeouts.
  - Output quality issues if input SERP data is thin or empty.

#### Node: Parse Market Analysis Output JSON
- **Type / Role:** `Structured Output Parser` (LangChain) — validates/forces a JSON shape.
- **Configuration (interpreted):**
  - Provides an example JSON schema (keyword, country, seo_summary, content_gaps, content_opportunities, recommended_content_types, confidence_score).
- **Connections:**
  - Connected into the agent as `ai_outputParser` (enforcing structure).
- **Important mismatch to note (integration risk):**
  - The agent prompt requests this JSON:
    ```json
    { "search_intent": "", "competition_level": "", "content_gaps": [], "top_opportunities": [], "recommended_content_types": [] }
    ```
    But the parser example expects a richer structure including:
    - `seo_summary.search_intent`, `seo_summary.competition_level`, `seo_summary.serp_features`
    - `content_opportunities` (not `top_opportunities`)
    - `confidence_score`
  - This mismatch can cause parser failures or inconsistent downstream mapping.
- **Failure/edge cases:**
  - Parser throws if the agent output is not valid JSON or doesn’t match expectations.
  - Even if parsing succeeds, downstream nodes expect fields like `seo_summary` and `confidence_score`.

#### Node: Analyze Keyword SEO Opportunities (AI)
- **Type / Role:** `LangChain Agent` — orchestrates prompt + model + output parser.
- **Configuration (interpreted):**
  - System message: SEO strategist; focus on gaps/opportunities; concise.
  - User message includes: keyword, country, total_results, full organic_results, related_searches, videos; asks for JSON output.
  - `hasOutputParser: true` so the parser is applied.
- **Key expressions:**
  - Uses `{{$json.keyword}}`, `{{$json.country}}`, `{{$json.total_results}}`
  - Embeds arrays via `JSON.stringify(...)`
- **Input / Output:**
  - Input: normalized SERP dataset
  - Output: typically `{"output": <parsed object>}` (LangChain nodes often put parsed result under `output`)
- **Failure/edge cases:**
  - Token size risk: stringifying top results + related searches + videos could grow; usually manageable at 10 results, but snippets can be long.
  - Model may output non-conforming JSON → parser error.
  - If SERP results are empty, analysis becomes speculative; consider adding guards.

---

### Block 5 — Output Preparation for UI & Reporting
**Overview:** Reshapes AI result into a flattened object and maps fields into UI/reporting keys; then fans out to logging + email generation.  
**Nodes involved:**  
- Flatten AI Output for Downstream Use  
- Map SEO Fields for UI & Reporting

#### Node: Flatten AI Output for Downstream Use
- **Type / Role:** `Code` — flattens LangChain agent result.
- **Configuration (interpreted):**
  - Returns `{ ...$json.output }` as the new item JSON.
- **Key code:**
  - `...$json.output`
- **Input / Output:**
  - Input: agent node output (expects `output` object)
  - Output: flattened object containing AI fields at top-level
- **Failure/edge cases:**
  - If agent output doesn’t contain `output` (e.g., parser failed or node changed behavior), this will produce `{}` or throw depending on runtime data.

#### Node: Map SEO Fields for UI & Reporting
- **Type / Role:** `Code` — remaps to UI-friendly keys and ensures “confidence” exists.
- **Configuration (interpreted):**
  - Expects:
    - `keyword`, `country`
    - `seo_summary.search_intent`, `seo_summary.competition_level`, `seo_summary.serp_features`
    - `content_gaps`, `content_opportunities`, `recommended_content_types`
    - `confidence_score`
  - Produces:
    - `search_intent`, `competition`, `serp_features`
    - `confidence` defaults to `"Not determined"`
- **Risk note (schema dependency):**
  - This mapping assumes the parser schema (with `seo_summary` and `confidence_score`) rather than the agent prompt’s simpler schema.
- **Input / Output:**
  - Input: flattened AI object
  - Output: mapped object used by both Sheets logging and email generation
- **Failure/edge cases:**
  - If AI output lacks `seo_summary`, `search_intent` and `competition` become empty strings.
  - If `content_opportunities` is missing (or named differently), downstream report/logs lose key content.

---

### Block 6 — Client-Ready Email Generation & Delivery
**Overview:** Generates an HTML email from the mapped SEO insights using GPT‑4o, then sends via Gmail.  
**Nodes involved:**  
- LLM Engine for Insight Formatting  
- Generate Client-Ready SEO Insights Email (AI)  
- Send SEO Opportunity Report via Email

#### Node: LLM Engine for Insight Formatting
- **Type / Role:** `OpenAI Chat Model` (LangChain) — GPT‑4o for email-quality writing.
- **Configuration:** model `gpt-4o`, Responses API disabled.
- **Connections:** feeds **Generate Client-Ready SEO Insights Email (AI)** via `ai_languageModel`.
- **Failure/edge cases:** same OpenAI risks (auth, rate limit, timeouts).

#### Node: Generate Client-Ready SEO Insights Email (AI)
- **Type / Role:** `LangChain Agent` — generates HTML email body.
- **Configuration (interpreted):**
  - Prompt: produce clean HTML with defined sections; do not include raw JSON; professional tone; no mention of AI.
  - Input data is the mapped JSON stringified.
- **Key expressions:**
  - `{{ JSON.stringify($json, null, 2) }}`
- **Input / Output:**
  - Input: mapped SEO object
  - Output: agent output typically under `$json.output` (HTML string)
- **Failure/edge cases:**
  - Model may output non-HTML or partially invalid HTML; Gmail usually tolerates minor issues but layout can break.
  - If upstream fields are empty, the email becomes vague.

#### Node: Send SEO Opportunity Report via Email
- **Type / Role:** `Gmail` — sends final report.
- **Configuration (interpreted):**
  - To: `user@example.com` (static)
  - Subject: `SEO Content Opportunity Analyzer`
  - HTML body: `{{$json.output}}`
  - `includeHtml: true`
- **Credentials:** Gmail OAuth2 credential required.
- **Input / Output:**
  - Input: output from email generation agent (expects `output` HTML)
  - Output: Gmail send result metadata
- **Failure/edge cases:**
  - OAuth token expiration / insufficient scopes.
  - Sending limits, spam policies, invalid recipient.
  - If `$json.output` is missing, email will be blank or node may error.

---

### Block 7 — Distribution & Audit Logging (Google Sheets)
**Overview:** Appends a record of each analysis to a Google Sheet for tracking and audits.  
**Nodes involved:**  
- Log SEO Analysis Result to Google Sheets

#### Node: Log SEO Analysis Result to Google Sheets
- **Type / Role:** `Google Sheets` — audit log append.
- **Configuration (interpreted):**
  - Operation: **Append**
  - Document: `sample_leads_50` (ID: `17rcNd_ZpUQLm0uWEVbD-NY6GyFUkrD4BglvawlyBygM`)
  - Sheet tab: `SEO Content Opportunity log` (gid `843782431`)
  - Columns appended:
    - Country, Keyword, Timestamp (`{{$now}}`), Confidence, Competition, Content Gaps, Opportunities, Search Intent
- **Credentials:** Google Sheets OAuth2 credential required.
- **Input / Output:**
  - Input: mapped SEO object
  - Output: append result
- **Failure/edge cases:**
  - OAuth/scopes issues (`spreadsheets` scope), permission denied to the doc.
  - Column type expectations: arrays/objects (`content_gaps`, `content_opportunities`) may be written as `[object Object]` or JSON-ish depending on n8n settings. Here, “convertFieldsToString” is false; consider explicit `JSON.stringify` for consistent logging.
  - Sheet/tab renamed or deleted → runtime failure.

---

### Block 8 — Error Handling (Slack)
**Overview:** Catches any unhandled workflow error and posts a diagnostic message to Slack.  
**Nodes involved:**  
- Error Handler Trigger  
- Slack: Send Error Alert

#### Node: Error Handler Trigger
- **Type / Role:** `Error Trigger` — secondary entrypoint fired on workflow errors.
- **Configuration:** default.
- **Input / Output:**
  - Input: n8n error event payload
  - Output: passed to Slack node
- **Failure/edge cases:**
  - Only triggers for workflow-level failures where error trigger is supported/enabled in n8n environment.

#### Node: Slack: Send Error Alert
- **Type / Role:** `Slack` — posts error alert to a channel.
- **Configuration (interpreted):**
  - Channel: `general-information` (ID `C09GNB90TED`)
  - Message text includes:
    - Node name: `{{$json.node.name}}`
    - Error message: `{{$json.error.message}}`
    - Timestamp: `{{$json.timestamp}}`
- **Credentials:** Slack API credential required.
- **Failure/edge cases:**
  - Slack auth/token revoked.
  - Channel not accessible by the app/bot.
  - Message formatting: text starts with `=❌ ...` (the leading `=` is unusual for Slack text; if it’s intended as an n8n expression marker, it is already in a field that supports expressions—verify it renders as expected).

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Receive SEO Keyword Analysis Request | Webhook | Entry point: receive keyword request | — | Extract Keyword from Request Payload | ## 📥 SEO Keyword Intake<br>Receives and prepares the keyword for analysis.<br><br>• Receive SEO Keyword Analysis Request<br>Accepts a POST webhook containing the target keyword.<br><br>• Extract Keyword from Request Payload<br>Cleans and isolates the keyword field for SERP analysis. |
| Extract Keyword from Request Payload | Set | Extract/standardize `body.keyword` | Receive SEO Keyword Analysis Request | Run Google SERP Search for Keyword (India) | ## 📥 SEO Keyword Intake<br>Receives and prepares the keyword for analysis.<br><br>• Receive SEO Keyword Analysis Request<br>Accepts a POST webhook containing the target keyword.<br><br>• Extract Keyword from Request Payload<br>Cleans and isolates the keyword field for SERP analysis. |
| Run Google SERP Search for Keyword (India) | SerpAPI | Fetch Google SERP results localized to India | Extract Keyword from Request Payload | Normalize SERP Results into SEO Dataset | ## 🌐 Google SERP Data Collection (India)<br>Fetches real-time search engine results.<br><br>• Run Google SERP Search for Keyword (India)<br>Executes a Google search via SerpAPI, returning organic results,<br>related searches, and video signals. |
| Normalize SERP Results into SEO Dataset | Code | Normalize SERP payload into analysis dataset | Run Google SERP Search for Keyword (India) | Analyze Keyword SEO Opportunities (AI) | ## 🧹 SERP Normalization & SEO Dataset Creation<br>Transforms raw SERP data into an analysis-ready format.<br><br>• Normalize SERP Results into SEO Dataset<br>Extracts organic rankings, snippets, sources, videos, and<br>related searches into a structured SEO dataset. |
| LLM Engine for Market Intelligence Analysis | OpenAI Chat Model (LangChain) | Provides GPT‑4o model to analysis agent | — | Analyze Keyword SEO Opportunities (AI) (ai_languageModel) | ## 🧠 AI SEO Opportunity & Gap Analysis<br>Analyzes keyword competitiveness and content gaps.<br><br>• Analyze Keyword SEO Opportunities (AI)<br>Uses GPT-4o to determine:<br>- Search intent<br>- Competition level<br>- Content gaps<br>- High-impact content opportunities<br>- Recommended content formats<br><br>• Parse Market Analysis Output JSON<br>Validates and enforces structured AI output schema. |
| Parse Market Analysis Output JSON | Structured Output Parser (LangChain) | Enforce/validate structured JSON output | — | Analyze Keyword SEO Opportunities (AI) (ai_outputParser) | ## 🧠 AI SEO Opportunity & Gap Analysis<br>Analyzes keyword competitiveness and content gaps.<br><br>• Analyze Keyword SEO Opportunities (AI)<br>Uses GPT-4o to determine:<br>- Search intent<br>- Competition level<br>- Content gaps<br>- High-impact content opportunities<br>- Recommended content formats<br><br>• Parse Market Analysis Output JSON<br>Validates and enforces structured AI output schema. |
| Analyze Keyword SEO Opportunities (AI) | Agent (LangChain) | AI inference over SERP dataset | Normalize SERP Results into SEO Dataset | Flatten AI Output for Downstream Use | ## 🧠 AI SEO Opportunity & Gap Analysis<br>Analyzes keyword competitiveness and content gaps.<br><br>• Analyze Keyword SEO Opportunities (AI)<br>Uses GPT-4o to determine:<br>- Search intent<br>- Competition level<br>- Content gaps<br>- High-impact content opportunities<br>- Recommended content formats<br><br>• Parse Market Analysis Output JSON<br>Validates and enforces structured AI output schema. |
| Flatten AI Output for Downstream Use | Code | Flatten agent `output` to top-level JSON | Analyze Keyword SEO Opportunities (AI) | Map SEO Fields for UI & Reporting | ## 🔄 Output Preparation for UI & Reporting<br>Prepares AI results for downstream systems.<br><br>• Flatten AI Output for Downstream Use<br>Removes nested structures from AI output.<br><br>• Map SEO Fields for UI & Reporting<br>Aligns SEO fields to UI-friendly keys and reporting requirements,<br>including confidence scoring. |
| Map SEO Fields for UI & Reporting | Code | Map fields to UI/reporting schema | Flatten AI Output for Downstream Use | Generate Client-Ready SEO Insights Email (AI); Log SEO Analysis Result to Google Sheets | ## 🔄 Output Preparation for UI & Reporting<br>Prepares AI results for downstream systems.<br><br>• Flatten AI Output for Downstream Use<br>Removes nested structures from AI output.<br><br>• Map SEO Fields for UI & Reporting<br>Aligns SEO fields to UI-friendly keys and reporting requirements,<br>including confidence scoring. |
| LLM Engine for Insight Formatting | OpenAI Chat Model (LangChain) | Provides GPT‑4o model to email agent | — | Generate Client-Ready SEO Insights Email (AI) (ai_languageModel) | ## 📧 Client-Ready SEO Insight Report<br>Creates professional, presentation-ready summaries.<br><br>• Generate Client-Ready SEO Insights Email (AI)<br>Converts SEO insights into a clean HTML email with:<br>- Search intent<br>- Competition<br>- Content gaps<br>- Opportunities<br>- Recommended formats<br><br>• LLM Engine for Insight Formatting<br>Provides GPT-4o for professional email-quality output. |
| Generate Client-Ready SEO Insights Email (AI) | Agent (LangChain) | Generate HTML report email body | Map SEO Fields for UI & Reporting | Send SEO Opportunity Report via Email | ## 📧 Client-Ready SEO Insight Report<br>Creates professional, presentation-ready summaries.<br><br>• Generate Client-Ready SEO Insights Email (AI)<br>Converts SEO insights into a clean HTML email with:<br>- Search intent<br>- Competition<br>- Content gaps<br>- Opportunities<br>- Recommended formats<br><br>• LLM Engine for Insight Formatting<br>Provides GPT-4o for professional email-quality output. |
| Send SEO Opportunity Report via Email | Gmail | Send HTML email to recipient | Generate Client-Ready SEO Insights Email (AI) | — | ## 📤 Distribution & Audit Logging<br>Delivers and stores SEO insights.<br><br>• Send SEO Opportunity Report via Email<br>Sends the final SEO opportunity report to the configured recipient.<br><br>• Log SEO Analysis Result to Google Sheets<br>Stores keyword, intent, competition, confidence, and opportunities<br>for tracking, audits, and historical analysis. |
| Log SEO Analysis Result to Google Sheets | Google Sheets | Append audit record | Map SEO Fields for UI & Reporting | — | ## 📤 Distribution & Audit Logging<br>Delivers and stores SEO insights.<br><br>• Send SEO Opportunity Report via Email<br>Sends the final SEO opportunity report to the configured recipient.<br><br>• Log SEO Analysis Result to Google Sheets<br>Stores keyword, intent, competition, confidence, and opportunities<br>for tracking, audits, and historical analysis. |
| Error Handler Trigger | Error Trigger | Secondary entrypoint for failures | — | Slack: Send Error Alert | ## 🚨 Error Handling<br><br>Catches any workflow failure and posts an alert to Slack.<br>Includes node name, error message, and timestamp for quick debugging. |
| Slack: Send Error Alert | Slack | Post error alert to Slack channel | Error Handler Trigger | — | ## 🚨 Error Handling<br><br>Catches any workflow failure and posts an alert to Slack.<br>Includes node name, error message, and timestamp for quick debugging. |
| Sticky Note | Sticky Note | Documentation/annotation | — | — | ## 🔍 SEO Keyword & Content Gap Analysis Workflow (Loveable UI)<br>This workflow automates keyword-level SEO research and content opportunity<br>analysis using live Google SERP data and AI-driven insights.<br><br>The workflow starts by receiving a keyword via webhook → performs a<br>Google SERP search focused on India → normalizes raw SERP results into a<br>clean SEO dataset → uses GPT-4o to analyze search intent, competition level,<br>content gaps, and high-impact content opportunities.<br><br>The analyzed output is then reshaped for UI consumption, logged into<br>Google Sheets for tracking and audits, converted into a client-ready<br>HTML email report, and delivered via Gmail.<br><br>This system eliminates manual SEO research, ensures consistent analysis,<br>and produces actionable, presentation-ready insights for marketers,<br>content teams, and clients. |
| Sticky Note1 | Sticky Note | Documentation/annotation | — | — | ## 📥 SEO Keyword Intake<br>Receives and prepares the keyword for analysis.<br><br>• Receive SEO Keyword Analysis Request<br>Accepts a POST webhook containing the target keyword.<br><br>• Extract Keyword from Request Payload<br>Cleans and isolates the keyword field for SERP analysis. |
| Sticky Note2 | Sticky Note | Documentation/annotation | — | — | ## 🌐 Google SERP Data Collection (India)<br>Fetches real-time search engine results.<br><br>• Run Google SERP Search for Keyword (India)<br>Executes a Google search via SerpAPI, returning organic results,<br>related searches, and video signals. |
| Sticky Note3 | Sticky Note | Documentation/annotation | — | — | ## 🧹 SERP Normalization & SEO Dataset Creation<br>Transforms raw SERP data into an analysis-ready format.<br><br>• Normalize SERP Results into SEO Dataset<br>Extracts organic rankings, snippets, sources, videos, and<br>related searches into a structured SEO dataset. |
| Sticky Note4 | Sticky Note | Documentation/annotation | — | — | ## 🧠 AI SEO Opportunity & Gap Analysis<br>Analyzes keyword competitiveness and content gaps.<br><br>• Analyze Keyword SEO Opportunities (AI)<br>Uses GPT-4o to determine:<br>- Search intent<br>- Competition level<br>- Content gaps<br>- High-impact content opportunities<br>- Recommended content formats<br><br>• Parse Market Analysis Output JSON<br>Validates and enforces structured AI output schema. |
| Sticky Note5 | Sticky Note | Documentation/annotation | — | — | ## 🔄 Output Preparation for UI & Reporting<br>Prepares AI results for downstream systems.<br><br>• Flatten AI Output for Downstream Use<br>Removes nested structures from AI output.<br><br>• Map SEO Fields for UI & Reporting<br>Aligns SEO fields to UI-friendly keys and reporting requirements,<br>including confidence scoring. |
| Sticky Note6 | Sticky Note | Documentation/annotation | — | — | ## 📧 Client-Ready SEO Insight Report<br>Creates professional, presentation-ready summaries.<br><br>• Generate Client-Ready SEO Insights Email (AI)<br>Converts SEO insights into a clean HTML email with:<br>- Search intent<br>- Competition<br>- Content gaps<br>- Opportunities<br>- Recommended formats<br><br>• LLM Engine for Insight Formatting<br>Provides GPT-4o for professional email-quality output. |
| Sticky Note7 | Sticky Note | Documentation/annotation | — | — | ## 📤 Distribution & Audit Logging<br>Delivers and stores SEO insights.<br><br>• Send SEO Opportunity Report via Email<br>Sends the final SEO opportunity report to the configured recipient.<br><br>• Log SEO Analysis Result to Google Sheets<br>Stores keyword, intent, competition, confidence, and opportunities<br>for tracking, audits, and historical analysis. |
| Sticky Note8 | Sticky Note | Documentation/annotation | — | — | ## 🚨 Error Handling<br><br>Catches any workflow failure and posts an alert to Slack.<br>Includes node name, error message, and timestamp for quick debugging. |

---

## 4. Reproducing the Workflow from Scratch

1) **Create Webhook trigger**
   - Add node: **Webhook**
   - Method: **POST**
   - Path: `c8996569-9459-4976-bbdd-b800179b3dc7`
   - Keep response settings default (or configure as needed for your UI/client).

2) **Extract the keyword**
   - Add node: **Set** named “Extract Keyword from Request Payload”
   - Add field assignment:
     - Name: `body.keyword`
     - Value (expression): `{{$json.body.keyword}}`
   - Connect: Webhook → Set

3) **Run SERP query via SerpAPI**
   - Add node: **SerpAPI**
   - Set `q` to expression: `{{$json.body.keyword}}`
   - Additional fields:
     - `num`: `10`
     - `uule`: `India`
   - Configure **SerpAPI credentials** (API key).
   - Connect: Set → SerpAPI

4) **Normalize SERP output**
   - Add node: **Code** named “Normalize SERP Results into SEO Dataset”
   - Paste logic equivalent to:
     - Extract `search_parameters.q`, `search_parameters.uule`, `search_information.total_results`
     - Map `organic_results` to `{position,title,snippet,link,source,date}`
     - Map `inline_videos` to `{title,platform,duration,link}`
     - Map `related_searches` to array of queries
   - Connect: SerpAPI → Code

5) **Add OpenAI chat model for analysis**
   - Add node: **OpenAI Chat Model (LangChain)** named “LLM Engine for Market Intelligence Analysis”
   - Model: `gpt-4o`
   - Configure **OpenAI credentials** (API key).

6) **Add structured output parser**
   - Add node: **Structured Output Parser (LangChain)**
   - Provide a schema/example matching what you want downstream (the workflow uses an example containing `seo_summary`, `content_opportunities`, `confidence_score`, etc.).
   - Important: ensure the agent prompt and this parser schema match.

7) **AI analysis agent**
   - Add node: **Agent (LangChain)** named “Analyze Keyword SEO Opportunities (AI)”
   - Prompt type: “Define”
   - System message: SEO strategist; focus on intent, competition, gaps, opportunities; concise.
   - User message: include keyword/country/total_results and JSON.stringify of organic results, related searches, and videos; request JSON output.
   - Enable “Has Output Parser”.
   - Connect model + parser into the agent:
     - LLM Engine → Agent (`ai_languageModel`)
     - Output Parser → Agent (`ai_outputParser`)
   - Connect: Normalize Code → Agent (main)

8) **Flatten agent output**
   - Add node: **Code** named “Flatten AI Output for Downstream Use”
   - Logic: return `{...$json.output}` as the new JSON.
   - Connect: Agent → Flatten Code

9) **Map fields for UI/reporting**
   - Add node: **Code** named “Map SEO Fields for UI & Reporting”
   - Produce:
     - `keyword`, `country`
     - `search_intent` from `seo_summary.search_intent`
     - `competition` from `seo_summary.competition_level`
     - `serp_features` from `seo_summary.serp_features`
     - `content_gaps`, `content_opportunities`, `recommended_content_types`
     - `confidence` from `confidence_score` defaulting to “Not determined”
   - Connect: Flatten Code → Map Code

10) **Google Sheets logging**
   - Add node: **Google Sheets**
   - Operation: **Append**
   - Select the target spreadsheet + sheet tab
   - Map columns:
     - Timestamp: `{{$now}}`
     - Keyword/Country/Search Intent/Competition/Confidence from mapped fields
     - Content Gaps / Opportunities from mapped fields (consider `JSON.stringify` if you want stable text)
   - Configure **Google Sheets OAuth2 credentials** with access to the spreadsheet.
   - Connect: Map Code → Google Sheets

11) **OpenAI chat model for email formatting**
   - Add node: **OpenAI Chat Model (LangChain)** named “LLM Engine for Insight Formatting”
   - Model: `gpt-4o`
   - Configure OpenAI credentials (can reuse the same).

12) **Generate HTML email**
   - Add node: **Agent (LangChain)** named “Generate Client-Ready SEO Insights Email (AI)”
   - System message: professional SEO consultant; valid HTML; do not mention AI; no raw JSON.
   - User message: request sections (keyword/country, intent, competition, gaps, opportunities with difficulty, formats, confidence) and provide `JSON.stringify($json, null, 2)` of mapped data.
   - Connect: Map Code → Email Agent (main)
   - Connect: LLM Engine for Insight Formatting → Email Agent (`ai_languageModel`)

13) **Send email via Gmail**
   - Add node: **Gmail**
   - Resource: Message → Send
   - To: your recipient(s)
   - Subject: “SEO Content Opportunity Analyzer”
   - HTML body: `{{$json.output}}`
   - Enable HTML
   - Configure **Gmail OAuth2 credentials**.
   - Connect: Email Agent → Gmail

14) **Add error handling**
   - Add node: **Error Trigger**
   - Add node: **Slack**
     - Post to chosen channel
     - Text includes `{{$json.node.name}}`, `{{$json.error.message}}`, `{{$json.timestamp}}`
   - Configure **Slack credentials**.
   - Connect: Error Trigger → Slack

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques. | Provided disclaimer (project-wide context) |
| Potential schema mismatch: analysis agent prompt requests `competition_level` / `top_opportunities`, while downstream mapping expects `seo_summary.competition_level` and `content_opportunities` plus `confidence_score`. Align prompt + parser + mapping to prevent parser/mapping failures. | Integration reliability note (applies to AI block + mapping block) |
| SerpAPI localization: `uule` often expects an encoded location; using `India` may not strictly localize as intended. Consider SerpAPI’s recommended localization parameters (e.g., `location`) if available in your node version. | SERP accuracy note |