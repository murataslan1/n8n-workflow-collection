Automate B2B sales research & email personalization with Sona and GPT-4

https://n8nworkflows.xyz/workflows/automate-b2b-sales-research---email-personalization-with-sona-and-gpt-4-12189


# Automate B2B sales research & email personalization with Sona and GPT-4

## 1. Workflow Overview

**Workflow name:** *Sona-Powered AI Sales Research & Personalized Email Automation*  
**Stated title:** *Automate B2B sales research & email personalization with Sona and GPT-4*

**Purpose:**  
This workflow reads B2B leads from Google Sheets, enriches each lead with company intelligence from Sona, uses GPT-4.1-mini to produce structured sales research (pain points, hooks, fit score), generates a personalized cold email (subject + body), and writes the results back to the same Google Sheet, including a one-click Gmail compose link.

**Primary use cases**
- Sales/BD teams needing scalable, semi-automated account research + first-touch personalization.
- Enrichment + copy generation pipeline driven by a spreadsheet queue.
- Producing consistent structured insights suitable for downstream automation/QA.

**Logical blocks (by dependency and function)**

### 1.1 Input Reception & Filtering (Google Sheets queue)
Reads all rows (leads) and keeps only those not yet processed (empty “Research Status”).

### 1.2 Lead Iteration (sequential processing)
Processes leads one-by-one (batch size 1) to avoid rate limits and to keep Sheet updates deterministic.

### 1.3 Company Data Enrichment via Sona + Smart Matching
Marks the row “Pending”, queries Sona for candidate companies, then uses a custom 5-tier matching algorithm to select the best company record.

### 1.4 AI Company Research (structured JSON)
Sends the chosen Sona company profile to GPT-4.1-mini to produce structured research insights.

### 1.5 Personalized Email Generation (structured JSON)
Uses the research output + lead contact fields to generate a short, personalized cold email (subject + body).

### 1.6 Output Formatting & Sync Back to Google Sheets
Builds a Gmail compose link, formats fields, updates the lead row as “Completed”, waits 2 seconds, then continues with the next lead.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception & Filtering (Google Sheets queue)

**Overview:**  
Loads leads from a spreadsheet and filters to only unprocessed leads where `Research Status` is empty.

**Nodes involved:**
- Start
- Read Leads from Google Sheets
- Filter

#### Node: **Start**
- **Type / role:** Manual Trigger (entry point)
- **Config:** No parameters; manually starts execution.
- **Outputs:** To **Read Leads from Google Sheets**
- **Failure modes:** None (except n8n runtime issues).

#### Node: **Read Leads from Google Sheets**
- **Type / role:** Google Sheets node (read rows)
- **Config choices (interpreted):**
- Uses OAuth2 credential `googleSheetsOAuth2Api Credential`.
- Reads from document ID `1qUir1c-_ScMnoYVoQ0W41nsv5IpLW6rjK8HUNqvNnAg`
- Target sheet/tab: internal ID `1626340606` (named in cached result as “AI-Powered Lead Research & Personalized Email Generation with Groq & Google Sheets”)
- Operation is not explicitly shown, but by placement and behavior it functions as **read all rows**.
- **Inputs:** From **Start**
- **Outputs:** To **Filter**
- **Edge cases / failures:**
- OAuth permission errors, expired refresh token.
- Sheet/tab mismatch (wrong sheet selected).
- Missing columns (workflow expects specific headers, see sticky notes).
- Large sheet can slow execution; consider pagination/limits.

#### Node: **Filter**
- **Type / role:** Filter node (row gating)
- **Config choices:**
- Condition: `Research Status` **is empty**
  - Expression: `={{ $json['Research Status'] }}`
  - Operator: “empty”
- **Inputs:** From **Read Leads from Google Sheets**
- **Outputs:** To **Loop Over Leads**
- **Edge cases / failures:**
- If “Research Status” contains whitespace (e.g., `" "`), it may not count as empty depending on strictness; here validation is “strict”.
- If the column name differs (e.g., `ResearchStatus`), the expression yields `undefined` which is treated as empty in many cases—could accidentally include rows.

---

### 2.2 Lead Iteration (sequential processing)

**Overview:**  
Iterates through filtered leads using batch processing (1 lead at a time) and provides a loop-back after completion.

**Nodes involved:**
- Loop Over Leads
- End

#### Node: **Loop Over Leads**
- **Type / role:** Split In Batches (batch loop controller)
- **Config choices:**
- Batch settings left default; practical behavior is driven by downstream loop-back.
- This node has **two outgoing connections**, typical for batch loops:
  - **Output 0:** goes to **End** (when no more items / done)
  - **Output 1:** goes to **Update Row Status** (for current batch item)
- **Inputs:** From **Filter**, and loop-back from **Wait**
- **Outputs:** To **End** and **Update Row Status**
- **Edge cases / failures:**
- If loop-back is broken, only the first item will process.
- If an upstream node emits no items, it immediately routes to End.
- If an error occurs downstream and stops execution (unless handled), remaining leads won’t process.

#### Node: **End**
- **Type / role:** NoOp (terminator)
- **Config:** None
- **Inputs:** From **Loop Over Leads**
- **Outputs:** None

---

### 2.3 Company Data Enrichment via Sona + Smart Matching

**Overview:**  
Marks the lead as pending, searches Sona for matching companies using domain/email-derived filters, then selects the best company match via a multi-tier matching script.

**Nodes involved:**
- Update Row Status
- Sona Company Search
- Code

#### Node: **Update Row Status**
- **Type / role:** Google Sheets node (update row)
- **Config choices:**
- Operation: **update**
- Matching column: `Email` (used to find the row to update)
- Sets:
  - `Email` = `{{ $('Loop Over Leads').first().json.Email }}`
  - `Research Status` = `"Pending"`
- **Inputs:** From **Loop Over Leads** (batch item)
- **Outputs:** To **Sona Company Search**
- **Edge cases / failures:**
- If emails are not unique, multiple rows may be impacted depending on Sheets node behavior; typically it updates the first match.
- If Email is missing/blank, match fails and update won’t happen.
- OAuth / permissions / sheet mismatch.

#### Node: **Sona Company Search**
- **Type / role:** HTTP Request (POST to Sona API)
- **Config choices:**
- URL: `https://api2.sonalabs.com/resource/companies/search`
- Method: `POST`
- Headers:
  - `x-api-key: <missing value in JSON>` (must be set)
  - `Content-Type: application/json`
  - `Accept: application/json`
- Body (JSON) uses a filter:
  - field `website` operator `contains`
  - value derived from either `Website Domain` or the email’s domain.
  - Expression strips protocol and common TLDs and paths.
- Error handling:
- `onError: continueRegularOutput`
- Response setting includes “neverError: true” (so non-2xx might still pass data through)
- Timeout: 50 seconds
- Batching: `batchSize: 1`, `batchInterval: 3000ms` (helps rate limits)
- **Inputs:** From **Update Row Status**
- **Outputs:** To **Code**
- **Edge cases / failures:**
- Missing/invalid `x-api-key` → auth failure; because of `neverError`/continue behavior, downstream may receive unexpected structure.
- Sona response shape changes (workflow expects `$json.data.list`).
- If `Website Domain` is empty and Email is malformed, the derived filter value may be wrong.
- Rate limiting: batching helps, but still possible on high volume.

#### Node: **Code**
- **Type / role:** Code node (JavaScript company record selection)
- **Config choices / key logic:**
- Reads:
  - Lead domain from: `$('Loop Over Leads').first().json['Website Domain']`
  - Candidate list from: `$input.first().json.data.list`
- Normalizes domains with `extractCompanyName()`:
  - Removes protocol, www, trailing slash
  - Removes many TLDs: com, net, org, io, co, ai, us, uk, biz, info, be
  - Lowercases
- 5-tier matching:
  1) Exact domain-derived “company name” match
  2) Match against `item.name` (cleaned alphanumeric), equality or containment
  3) Match LinkedIn URL slug (expects `linkedin.com/company/...`)
  4) Partial match where one starts with the other
  5) Fallback to first list entry
- Returns a **single company object** (not an array).
- **Inputs:** From **Sona Company Search**
- **Outputs:** To **Company Research AI**
- **Edge cases / failures:**
- If `$input.first().json.data.list` is missing/empty, `list.find(...)` will throw or `list[0]` will be undefined. This is a key fragility point.
- If `Website Domain` is empty, `extractCompanyName(loopDomain)` may error if `loopDomain` is `null/undefined` (it’s used as `domain.replace(...)`).
- LinkedIn parsing assumes a specific URL structure and might miss localized or full URLs (`https://www.linkedin.com/company/...`).

---

### 2.4 AI Company Research (structured JSON)

**Overview:**  
Uses GPT-4.1-mini to turn the chosen Sona company record into structured sales research (pain points, hooks, opportunities, fit).

**Nodes involved:**
- OpenAI Chat Model
- Structured Output Parser
- Company Research AI

#### Node: **OpenAI Chat Model**
- **Type / role:** LangChain OpenAI chat model provider
- **Config choices:**
- Model: `gpt-4.1-mini`
- Credentials: `openAiApi Credential`
- Connected via `ai_languageModel` to **Company Research AI**
- **Failure modes:**
- Invalid/expired OpenAI API key.
- Model availability changes.
- Rate limits / timeouts.

#### Node: **Structured Output Parser**
- **Type / role:** LangChain structured output parser
- **Config choices:**
- Provides a JSON schema example requiring keys:
  - `pain_points[]`, `growth_opportunities[]`, `personalization_hooks[]`,
  - `recommended_tone`, `key_value_proposition`, `suggested_cta`,
  - `fit_score`, `risk_factors[]`, `one_liner_insight`
- Connected via `ai_outputParser` to **Company Research AI**
- **Failure modes:**
- If the model outputs invalid JSON, parsing fails (may error the execution depending on node settings).

#### Node: **Company Research AI**
- **Type / role:** LangChain Agent (prompted analysis)
- **Config choices:**
- Prompt includes many fields from the selected Sona company object:
  - `name, website, industry, founded, employeesRange, city/state/country, estimatedAnnualRevenue, type, description, tech[], techCategories[], founderIdentifiers[], social URLs`
- System message: expert B2B sales research analyst.
- Requires output strictly as JSON matching the parser schema.
- Has Output Parser enabled (`hasOutputParser: true`).
- **Inputs:** From **Code** (company object)
- **Outputs:** To **Generate Personalized Email**
- **Edge cases / failures:**
- Missing fields from Sona record produce “undefined” insertions; usually okay but can degrade output quality.
- JSON-only requirement can still be violated by the model under stress; parser then fails.

---

### 2.5 Personalized Email Generation (structured JSON)

**Overview:**  
Uses lead fields + research insights to generate a concise, personalized cold email and subject line in structured JSON.

**Nodes involved:**
- OpenAI Chat Model1
- Structured Output Parser1
- Generate Personalized Email

#### Node: **OpenAI Chat Model1**
- **Type / role:** LangChain OpenAI chat model provider (second instance)
- **Config:**
- Model: `gpt-4.1-mini`
- Credentials: `openAiApi Credential`
- Connected via `ai_languageModel` to **Generate Personalized Email**
- **Failure modes:** Same as OpenAI Chat Model.

#### Node: **Structured Output Parser1**
- **Type / role:** Structured output parser for email JSON
- **Config:**
- Requires:
  - `subject_line`, `email_body`, `key_personalization_used`, `primary_pain_point_addressed`
- Connected via `ai_outputParser` to **Generate Personalized Email**
- **Failure modes:** Invalid JSON output.

#### Node: **Generate Personalized Email**
- **Type / role:** LangChain Agent (email copy generation)
- **Config choices:**
- Prompt pulls lead info from the current batch item:
  - `$('Loop Over Leads').first().json['Contact Name']`
  - `$('Loop Over Leads').first().json.Email`
  - `$('Loop Over Leads').first().json['Company Name']`
- Pulls research from upstream agent output (`$json.output.*`):
  - `one_liner_insight`, arrays for pain points/opps/hooks, plus tone/value prop/cta/fit score
- Strong constraints:
  - Subject max 8 words, body 120–150 words, avoid generic phrases, 2–3 sentence paragraphs, one pain point, low-friction CTA, sign-off template.
- Output: JSON only (enforced via parser).
- **Inputs:** From **Company Research AI**
- **Outputs:** To **Format Results**
- **Edge cases / failures:**
- If research arrays are empty or missing, the prompt’s `.map(...)` expressions can fail inside the template rendering (n8n expression evaluation) before the LLM is called.
- Contact Name missing reduces personalization quality.

---

### 2.6 Output Formatting & Sync Back to Google Sheets

**Overview:**  
Merges research + email results, builds a Gmail compose URL, writes everything back to the sheet, waits briefly, then continues the batch loop.

**Nodes involved:**
- Format Results
- Update Sheet with Results
- Wait

#### Node: **Format Results**
- **Type / role:** Code node (data shaping + Gmail link)
- **Key variables:**
- `emailData = $input.first().json.output` (from Generate Personalized Email)
- `researchData = $('Company Research AI').first().json.output`
- `leadData = $('Loop Over Leads').first().json`
- Builds Gmail compose link:
  - `https://mail.google.com/mail/?view=cm&fs=1&to=...&su=...&body=...`
  - Subject/body are URL-encoded.
- Returns a flattened object with:
  - Lead fields + `Pain Points` joined, `Key Insight`, `Email Subject`, `Email Body`, `Send Email Link`, `Generated Date`, `Sent Status`, and sets `Research Status: Completed`.
- **Inputs:** From **Generate Personalized Email**
- **Outputs:** To **Update Sheet with Results**
- **Edge cases / failures:**
- If `emailData` or `researchData` is missing (due to upstream parser failure), referencing fields throws.
- Gmail link length limits can be hit if body is long (less likely given 150-word constraint).

#### Node: **Update Sheet with Results**
- **Type / role:** Google Sheets node (update row with final results)
- **Config choices:**
- Operation: **update**
- Matching column: `Email`
- Writes columns using expressions:
  - `Email` from Loop Over Leads
  - `Email Body`, `Email Subject`, `Key Insight`, `Send Email Link`, `Generated Date`, `Sent Status`
  - `Pain Points` comes from Company Research output:  
    `{{ $('Company Research AI').first().json.output.pain_points.join('\n\n') }}`
  - Sets `Research Status` to `"Completed"`
- **Inputs:** From **Format Results**
- **Outputs:** To **Wait**
- **Edge cases / failures:**
- If `pain_points` is not an array, `.join()` fails.
- If matching by Email finds no row, update does nothing; you’ll silently lose output unless you monitor node results.

#### Node: **Wait**
- **Type / role:** Wait node (rate control + loop pacing)
- **Config:**
- `amount: 2` (default unit in n8n Wait is typically seconds unless configured otherwise)
- Has a `webhookId` (used internally for resuming waits)
- **Inputs:** From **Update Sheet with Results**
- **Outputs:** Loops back to **Loop Over Leads**
- **Edge cases / failures:**
- If n8n execution data is pruned or the instance restarts, waits can be interrupted depending on n8n configuration.
- If the wait unit is not seconds (environment/version differences), pacing may be off.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Start | Manual Trigger | Entry point (manual run) | — | Read Leads from Google Sheets | # Step 1: Data Input & Filtering\n\nWhat happens here:\n- Reads all leads from Google Sheets\n- Filters out already-processed leads\n- Prepares leads for sequential batch processing |
| Read Leads from Google Sheets | Google Sheets | Load lead rows from sheet | Start | Filter | # Step 1: Data Input & Filtering\n\nWhat happens here:\n- Reads all leads from Google Sheets\n- Filters out already-processed leads\n- Prepares leads for sequential batch processing |
| Filter | Filter | Keep only unprocessed rows | Read Leads from Google Sheets | Loop Over Leads | # Step 1: Data Input & Filtering\n\nWhat happens here:\n- Reads all leads from Google Sheets\n- Filters out already-processed leads\n- Prepares leads for sequential batch processing |
| Loop Over Leads | Split In Batches | Process leads sequentially / loop controller | Filter, Wait | End; Update Row Status | # Step 1: Data Input & Filtering\n\nWhat happens here:\n- Reads all leads from Google Sheets\n- Filters out already-processed leads\n- Prepares leads for sequential batch processing |
| Update Row Status | Google Sheets | Mark current lead as Pending | Loop Over Leads | Sona Company Search | ## Step 2: Company Data Enrichment\n\nWhat happens here:\n- Updates status to "Pending" in Google Sheets\n- Searches Sona database for company information\n- Smart matching algorithm finds best company match\n- Retrieves: industry, tech stack, revenue, employee count, social links |
| Sona Company Search | HTTP Request | Query Sona for company candidates | Update Row Status | Code | ## Step 2: Company Data Enrichment\n\nWhat happens here:\n- Updates status to "Pending" in Google Sheets\n- Searches Sona database for company information\n- Smart matching algorithm finds best company match\n- Retrieves: industry, tech stack, revenue, employee count, social links |
| Code | Code | Pick best-matching company from Sona list | Sona Company Search | Company Research AI | ## Step 2: Company Data Enrichment\n\nWhat happens here:\n- Updates status to "Pending" in Google Sheets\n- Searches Sona database for company information\n- Smart matching algorithm finds best company match\n- Retrieves: industry, tech stack, revenue, employee count, social links |
| OpenAI Chat Model | OpenAI Chat Model (LangChain) | LLM provider for research agent | — (AI connection) | Company Research AI (ai_languageModel) | ## Step 3: AI Company Research & Analysis\n\nWhat happens here:\n- Analyzes company data using GPT-4.1-mini\n- Identifies pain points, growth opportunities, and personalization hooks\n- Determines fit score and generates one-liner insight |
| Structured Output Parser | Structured Output Parser (LangChain) | Enforce JSON schema for research | — (AI connection) | Company Research AI (ai_outputParser) | ## Step 3: AI Company Research & Analysis\n\nWhat happens here:\n- Analyzes company data using GPT-4.1-mini\n- Identifies pain points, growth opportunities, and personalization hooks\n- Determines fit score and generates one-liner insight |
| Company Research AI | LangChain Agent | Generate structured sales research JSON | Code | Generate Personalized Email | ## Step 3: AI Company Research & Analysis\n\nWhat happens here:\n- Analyzes company data using GPT-4.1-mini\n- Identifies pain points, growth opportunities, and personalization hooks\n- Determines fit score and generates one-liner insight |
| OpenAI Chat Model1 | OpenAI Chat Model (LangChain) | LLM provider for email agent | — (AI connection) | Generate Personalized Email (ai_languageModel) | ## Step 4: Personalized Email Generation\n\nWhat happens here:\n- Crafts personalized cold email using research insights\n- Creates subject line (max 8 words) and email body (120-150 words)\n- Focuses on one main pain point with tangible outcomes |
| Structured Output Parser1 | Structured Output Parser (LangChain) | Enforce JSON schema for email | — (AI connection) | Generate Personalized Email (ai_outputParser) | ## Step 4: Personalized Email Generation\n\nWhat happens here:\n- Crafts personalized cold email using research insights\n- Creates subject line (max 8 words) and email body (120-150 words)\n- Focuses on one main pain point with tangible outcomes |
| Generate Personalized Email | LangChain Agent | Produce subject + email body JSON | Company Research AI | Format Results | ## Step 4: Personalized Email Generation\n\nWhat happens here:\n- Crafts personalized cold email using research insights\n- Creates subject line (max 8 words) and email body (120-150 words)\n- Focuses on one main pain point with tangible outcomes |
| Format Results | Code | Merge outputs + create Gmail compose link | Generate Personalized Email | Update Sheet with Results | ## Step 5: Data Output & Sync to Google Sheets\n\nWhat happens here:\n- Formats all research and email data\n- Creates Gmail compose link with pre-filled content\n- Updates sheet with results and sets status to "Completed"\n- Waits 2 seconds before processing next lead |
| Update Sheet with Results | Google Sheets | Write research + email back to sheet | Format Results | Wait | ## Step 5: Data Output & Sync to Google Sheets\n\nWhat happens here:\n- Formats all research and email data\n- Creates Gmail compose link with pre-filled content\n- Updates sheet with results and sets status to "Completed"\n- Waits 2 seconds before processing next lead |
| Wait | Wait | Delay then loop to next lead | Update Sheet with Results | Loop Over Leads | ## Step 5: Data Output & Sync to Google Sheets\n\nWhat happens here:\n- Formats all research and email data\n- Creates Gmail compose link with pre-filled content\n- Updates sheet with results and sets status to "Completed"\n- Waits 2 seconds before processing next lead |
| End | NoOp | End of workflow | Loop Over Leads | — |  |

> Note: The large “AI-Powered Lead Research & Personalized Email Generation” sticky note is a global setup note; it is not visually tied to specific nodes in the JSON coordinates, so it is included in Section 5.

---

## 4. Reproducing the Workflow from Scratch

1) **Create a new workflow**
- Name it: *Sona-Powered AI Sales Research & Personalized Email Automation* (or your preferred name).
- Ensure n8n has the LangChain nodes available (`@n8n/n8n-nodes-langchain`).

2) **Add trigger**
- Add **Manual Trigger** node named **Start**.

3) **Google Sheets: read leads**
- Add **Google Sheets** node named **Read Leads from Google Sheets**.
- Credentials: create/select **Google Sheets OAuth2** with access to spreadsheets.
- Operation: **Read** (read rows from a sheet).
- Select your Spreadsheet (Document) and the target Sheet/Tab.
- Ensure your sheet contains at least these columns (headers):
  - `Website Domain`, `Company Name`, `Contact Name`, `Email`, `Industry`, `Research Status`
  - Output columns to be filled later: `Pain Points`, `Key Insight`, `Email Subject`, `Email Body`, `Send Email Link`, `Generated Date`, `Sent Status`
- Connect **Start → Read Leads from Google Sheets**.

4) **Filter unprocessed leads**
- Add **Filter** node named **Filter**.
- Condition: `Research Status` **is empty**
  - Left value expression: `{{$json["Research Status"]}}`
  - Operator: *empty*
- Connect **Read Leads from Google Sheets → Filter**.

5) **Batch loop**
- Add **Split In Batches** node named **Loop Over Leads**.
- Set **Batch Size = 1** (recommended; defaults may vary—explicitly set it).
- Connect **Filter → Loop Over Leads**.
- Add **NoOp** node named **End**.
- Connect **Loop Over Leads (Output 0 / done) → End**.

6) **Mark row as pending**
- Add **Google Sheets** node named **Update Row Status**.
- Operation: **Update**
- Matching column: `Email`
- Map fields:
  - `Email` = `{{ $('Loop Over Leads').first().json.Email }}`
  - `Research Status` = `Pending`
- Connect **Loop Over Leads (Output 1 / current item) → Update Row Status**.

7) **Sona company search (HTTP)**
- Add **HTTP Request** node named **Sona Company Search**.
- Method: `POST`
- URL: `https://api2.sonalabs.com/resource/companies/search`
- Headers:
  - `x-api-key: YOUR_SONA_API_KEY`
  - `Content-Type: application/json`
  - `Accept: application/json`
- Body (JSON) with an expression that derives a domain token from Website Domain or Email domain. Use the workflow’s current logic, or simpler:
  - If `Website Domain` exists use it; else parse from Email.
- Timeout: ~50s
- (Optional) Rate control: enable batching (batch size 1 + interval 3000ms).
- Set error behavior to continue (optional, but then you must handle empty results safely).
- Connect **Update Row Status → Sona Company Search**.

8) **Select best company match (Code)**
- Add **Code** node named **Code** (JavaScript).
- Implement the 5-tier matching logic:
  - Normalize candidate websites + lead domain
  - Try exact match, name match, LinkedIn match, startsWith match, fallback.
- Critically: add guards for missing `Website Domain` and empty `data.list` to prevent crashes.
- Connect **Sona Company Search → Code**.

9) **Company research agent (LangChain)**
- Add **OpenAI Chat Model** node named **OpenAI Chat Model**.
- Credentials: OpenAI API key (`openAiApi`).
- Model: `gpt-4.1-mini` (or equivalent available model).
- Add **Structured Output Parser** node named **Structured Output Parser**.
- Provide the JSON schema example for research (pain_points, opportunities, hooks, tone, etc.).
- Add **AI Agent** node named **Company Research AI**.
- Configure:
  - System message: B2B sales research analyst persona.
  - User prompt: include company fields (name, website, industry, tech stack, social links, etc.).
  - Require “JSON only”.
  - Attach the **OpenAI Chat Model** to the agent via the agent’s language model connection.
  - Attach **Structured Output Parser** via output parser connection.
- Connect **Code → Company Research AI**.

10) **Email generation agent (LangChain)**
- Add **OpenAI Chat Model** node named **OpenAI Chat Model1** (second instance).
- Model: `gpt-4.1-mini`.
- Add **Structured Output Parser** node named **Structured Output Parser1** with email JSON schema.
- Add **AI Agent** node named **Generate Personalized Email**.
- Prompt:
  - Use lead fields from `Loop Over Leads` (Contact Name, Email, Company Name).
  - Use research fields from Company Research AI output.
  - Enforce constraints (8-word subject, 120–150 word body, one pain point, etc.).
  - Require JSON only.
- Connect **Company Research AI → Generate Personalized Email**.
- Connect model and parser to the agent via AI connections.

11) **Format output (Code)**
- Add **Code** node named **Format Results**.
- Build:
  - `Send Email Link` as Gmail compose URL using `encodeURIComponent`.
  - `Generated Date` as `YYYY-MM-DD`
  - `Sent Status = Not Sent`, `Research Status = Completed`
- Merge lead + research + email outputs into a single object.
- Connect **Generate Personalized Email → Format Results**.

12) **Write results back to Google Sheets**
- Add **Google Sheets** node named **Update Sheet with Results**.
- Operation: **Update**
- Matching column: `Email`
- Map fields to your sheet columns:
  - `Pain Points`, `Key Insight`, `Email Subject`, `Email Body`, `Send Email Link`, `Generated Date`, `Sent Status`, `Research Status`
- Connect **Format Results → Update Sheet with Results**.

13) **Wait + loop-back**
- Add **Wait** node named **Wait**.
- Set to **2 seconds** (or desired pacing).
- Connect **Update Sheet with Results → Wait**.
- Connect **Wait → Loop Over Leads** (this is the loop-back that triggers the next batch).

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “AI-Powered Lead Research & Personalized Email Generation” setup requirements: Google Sheets columns; Sona API key header `x-api-key`; OpenAI API key; enable Google Sheets API + OAuth2; outputs include Gmail compose links; estimated 30–60s per lead. | Sona: https://sonalabs.com  • OpenAI: https://platform.openai.com |
| Disclaimer (provided): Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n… | Compliance/context statement included by requester |

