Automate SDR Outreach: Source Wiza Leads and Personalize Emails with LLMs

https://n8nworkflows.xyz/workflows/automate-sdr-outreach--source-wiza-leads-and-personalize-emails-with-llms-12339


# Automate SDR Outreach: Source Wiza Leads and Personalize Emails with LLMs

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Workflow title:** Automate SDR Outreach: Source Wiza Leads and Personalize Emails with LLMs  
**Workflow internal name:** Full AI SDR

**Purpose:**  
End-to-end outbound automation that:
1) collects campaign + ICP inputs via a form,  
2) creates and configures a Smartlead campaign (including selecting the “best” sender account and building a multi-step sequence template),  
3) converts the ICP into Wiza search filters using an LLM,  
4) creates and polls a Wiza prospect list until enrichment is finished, then standardizes and stores leads in an n8n Data Table,  
5) loops through each lead to run web research (Perplexity), generate a personalized icebreaker and 3 follow-ups (LLMs + case study table),  
6) uploads each enriched, personalized lead into Smartlead so Smartlead can send emails using custom-field merge tags.

### 1.1 Input Reception & Campaign Parameters
- Entry via **Form Trigger** to collect: campaign name, ICP description, number of prospects, schedule start date.

### 1.2 Smartlead Campaign Provisioning (Infrastructure)
- Create campaign in Smartlead
- Fetch all email accounts
- Pick the “best” email account using a scoring algorithm
- Attach sender to campaign
- Create Smartlead sequence templates (merge tags pointing to custom fields)
- Update campaign stop settings
- Schedule campaign sending window

### 1.3 ICP → Wiza Filter Translation (LLM)
- Use OpenRouter LLM agent + structured output parser to convert ICP text into Wiza API parameters.

### 1.4 Wiza Lead Sourcing & Enrichment Polling
- Create Wiza prospect list
- Poll list status until `finished`
- Fetch contacts for the list
- Standardize contact schema
- Upsert/store into “Lead Database” Data Table

### 1.5 Per-Lead Personalization (Research + Copywriting)
- Loop per lead
- Research agent must call Perplexity tool
- Combine research + business context + case studies to generate:
  - Icebreaker email (structured JSON: subject + HTML body)
  - 3 follow-ups (structured JSON list)
- Aggregate into Smartlead lead upload payload with custom fields

### 1.6 Smartlead Lead Upload & Campaign Start
- Upload personalized lead payload into Smartlead campaign (per lead)
- Attempt to start campaign

---

## 2. Block-by-Block Analysis

### Block 1 — Input Reception & Normalization
**Overview:** Captures user inputs (campaign name, ICP, lead count, schedule date) and normalizes field names into consistent JSON keys used throughout the workflow.

**Nodes involved:**
- Campaign Generation Form
- Set Campaign Details

#### Node: Campaign Generation Form
- **Type / role:** `Form Trigger` — workflow entry point collecting campaign parameters.
- **Key configuration:**
  - Form title: “Campaign Generation Form”
  - Fields:
    - Campaign Name (required)
    - Ideal Client Description (textarea, required)
    - Number of Prospects to Add (number, required)
    - Schedule Campaign (date, required)
- **Outputs:** One item containing submitted form fields.
- **Connections:** Outputs to **Set Campaign Details**.
- **Edge cases / failures:**
  - Users may enter ambiguous ICP text; later LLM parsing can fail or produce broad filters.
  - Date formatting: form provides a date string; downstream Smartlead schedule expects a date/time string.

#### Node: Set Campaign Details
- **Type / role:** `Set` — rename/mapping node.
- **Key configuration:**
  - Creates:
    - `Campaign name` = `$json['Campaign Name']`
    - `Ideal Client Description` = `$json['Ideal Client Description']`
    - `Number of Prospects to Add` = `$json['Number of Prospects to Add']`
    - `Schedule Campaign` = `$json['Schedule Campaign']`
- **Connections:** to **Create Smartlead Campaign**.
- **Edge cases:**
  - If user edits form fields later (label changes), these mappings break.
  - Schedule stored as string; Smartlead may require ISO timestamp depending on API behavior.

---

### Block 2 — Smartlead Campaign Infrastructure Setup
**Overview:** Creates a Smartlead campaign, selects a high-deliverability sender account, attaches it, builds a 4-step sequence template using Smartlead merge tags, configures stop settings, and schedules the campaign.

**Nodes involved:**
- Create Smartlead Campaign
- Set Campaign id
- Fetch Email Accounts
- Find Least Used Account
- Add Email Account to Campaign
- Build Sequence Templates
- Save Sequence Templates
- Update Campaign Settings
- Schedule Campaign

#### Node: Create Smartlead Campaign
- **Type / role:** `HTTP Request` — Smartlead API “create campaign”.
- **Key configuration:**
  - POST `https://server.smartlead.ai/api/v1/campaigns/create`
  - JSON body: `{ "name": "{{ $json['Campaign name'] }}" }`
  - Auth: `httpQueryAuth` credential named **Smartlead** (query auth).
- **Connections:** to **Set Campaign id**.
- **Edge cases / failures:**
  - Auth failure (invalid API key/query params).
  - API rate limits.
  - If `Campaign name` missing, creates poorly named campaign or fails validation.

#### Node: Set Campaign id
- **Type / role:** `Set` — extracts the campaign id into `id`.
- **Key configuration:**
  - `id` = `{{ $json.id }}`
- **Connections:** to **Fetch Email Accounts**.
- **Note:** In this workflow, most later Smartlead calls reference `Create Smartlead Campaign`. This node is mostly redundant unless used elsewhere.
- **Edge cases:** If Smartlead response shape changes (id path differs), downstream steps fail.

#### Node: Fetch Email Accounts
- **Type / role:** `HTTP Request` — list Smartlead sender accounts.
- **Key configuration:**
  - GET `https://server.smartlead.ai/api/v1/email-accounts`
  - Auth: Smartlead query auth.
- **Connections:** to **Find Least Used Account**.
- **Edge cases:** empty list, pagination (if API paginates), unexpected fields.

#### Node: Find Least Used Account
- **Type / role:** `Code` — selects “best” email account using scoring.
- **Key logic (interpreted):**
  - Reads all incoming accounts: `$input.all()`
  - Filters accounts with `status` == `active` (case-insensitive). If none active, uses all.
  - Computes score (lower is better):
    - `campaign_count * 1000`
    - plus `(100 - warmup_reputation) * 10` (higher reputation → lower score)
    - plus `total_spam_count * 100`
  - Sorts by score ascending.
  - If all accounts have same score, chooses random among top scorers.
  - Outputs:
    - `email_account_id`
    - `email_account_email`
    - `campaign_count`, `warmup_reputation`, `total_spam_count`
- **Connections:** to **Add Email Account to Campaign**.
- **Edge cases / failures:**
  - If Smartlead returns accounts in a single array item (not individual items), `$input.all()` may not match expectations.
  - Missing `id` triggers error.
  - Warmup reputation missing → defaults to 0 in output, but scoring assumes default 50 in formula; minor inconsistency (formula uses `|| 50`, output uses `|| 0`).

#### Node: Add Email Account to Campaign
- **Type / role:** `HTTP Request` — attaches sender account to campaign.
- **Key configuration:**
  - POST `https://server.smartlead.ai/api/v1/campaigns/{{ campaignId }}/email-accounts`
  - Body: `{ "email_account_ids": ["{{ $json.email_account_id }}"] }`
  - campaignId read from **Create Smartlead Campaign** node output
- **Connections:** to **Build Sequence Templates**.
- **Edge cases:**
  - Smartlead may require numeric IDs; this uses string interpolation inside quotes.
  - If campaign creation failed or id is missing, URL becomes invalid.

#### Node: Build Sequence Templates
- **Type / role:** `Code` — constructs Smartlead sequences with merge tags.
- **Key configuration:**
  - Creates 4 steps with delays: 0, 3, 5, 7 days.
  - Subject/body are **literal Smartlead placeholders**:
    - `{{icebreaker_subject}}`, `{{icebreaker_body}}`, etc.
  - Output: `{ sequences: [...] }`
- **Connections:** to **Save Sequence Templates**.
- **Important behavior:** These are *not* n8n expressions; Smartlead will replace them using **custom_fields** provided when uploading leads.
- **Edge cases:**
  - If Smartlead uses a different merge tag syntax, emails will send with raw placeholders.
  - Delay strategy hard-coded.

#### Node: Save Sequence Templates
- **Type / role:** `HTTP Request` — saves sequences to Smartlead campaign.
- **Key configuration:**
  - POST `https://server.smartlead.ai/api/v1/campaigns/{{ campaignId }}/sequences`
  - Body: `{{ $json }}` (the sequences object from previous node)
- **Connections:** to **Update Campaign Settings**.
- **Edge cases:** Smartlead validation errors if the sequence schema differs.

#### Node: Update Campaign Settings
- **Type / role:** `HTTP Request` — sets stop lead behavior.
- **Key configuration:**
  - POST `https://server.smartlead.ai/api/v1/campaigns/{{ campaignId }}/settings`
  - Body: `{ "stop_lead_settings": "REPLY_TO_AN_EMAIL" }`
- **Connections:** to **Schedule Campaign**.
- **Edge cases:** enum mismatch if Smartlead changes accepted values.

#### Node: Schedule Campaign
- **Type / role:** `HTTP Request` — sets schedule window.
- **Key configuration:**
  - POST `https://server.smartlead.ai/api/v1/campaigns/{{ campaignId }}/schedule`
  - Parameters:
    - timezone: America/Los_Angeles
    - weekdays: Mon–Fri
    - start_hour 09:00, end_hour 18:00
    - min_time_btw_emails 10
    - max_new_leads_per_day 20
    - `schedule_start_time` from Set Campaign Details: `$('Set Campaign Details').first().json['Schedule Campaign']`
- **Connections:** to **Format Search Parameters**.
- **Edge cases:**
  - The form date may not include time; Smartlead may require timestamp.
  - Timezone mismatch with target audience.

---

### Block 3 — ICP to Wiza Search Parameter Generation (LLM)
**Overview:** Uses an LLM agent to transform natural language ICP into Wiza API filter JSON, enforced by a structured output schema.

**Nodes involved:**
- Format Search Parameters
- OpenRouter Chat Model7
- Simple Memory7
- Structured Output Parser9

#### Node: Format Search Parameters
- **Type / role:** `LangChain Agent` — prompt-driven structured generation.
- **Key configuration:**
  - Prompt includes:
    - Campaign Name
    - ICP description
    - max_profiles (lead count)
  - System message defines strict output format for Wiza parameters:
    - `{ filters: {...}, list: { name, max_profiles } }`
  - Has output parser enabled.
- **AI connections:**
  - **OpenRouter Chat Model7** as language model
  - **Simple Memory7** as memory
  - **Structured Output Parser9** enforces JSON schema
- **Output:** `output` object containing parsed JSON.
- **Connections:** to **Search Prospects [Wiza-API]**
- **Edge cases / failures:**
  - If LLM returns invalid JSON → output parser error.
  - If ICP is too broad → Wiza may return irrelevant leads or exceed max profiles constraints.
  - If multiple segments are detected, system message suggests separate objects, but downstream Wiza call appears to assume one object (risk).

#### Node: OpenRouter Chat Model7
- **Type / role:** `OpenRouter Chat Model` — LLM backend for ICP conversion.
- **Key configuration:** model `z-ai/glm-4.5`
- **Credentials:** OpenRouter account
- **Edge cases:** model availability changes; OpenRouter rate limits.

#### Node: Simple Memory7
- **Type / role:** `Memory Buffer Window` — conversational memory.
- **Key configuration:** `sessionKey=0` (static)
- **Edge cases:** Static session key can cause cross-run “memory bleed” if not isolated.

#### Node: Structured Output Parser9
- **Type / role:** `Structured Output Parser` — enforces Wiza filter schema.
- **Key configuration:** Example schema includes `filters` and `list`.
- **Edge cases:** Example mismatch with actual Wiza API accepted fields; parser can succeed but API can reject.

---

### Block 4 — Wiza List Creation, Polling, and Lead Standardization
**Overview:** Creates a Wiza list from generated parameters, polls until enrichment is finished, fetches contacts, transforms them into internal schema, and stores them into the Lead Database Data Table.

**Nodes involved:**
- Search Prospects [Wiza-API]
- Get Lists
- Check If Finished
- Wait
- Get Lists Contacts
- Standardize Data
- Update Leads
- Lead_info

#### Node: Search Prospects [Wiza-API]
- **Type / role:** `HTTP Request` — creates a Wiza prospect list.
- **Key configuration:**
  - POST `https://wiza.co/api/prospects/create_prospect_list`
  - Body: `={{ JSON.stringify($json.output) }}`
  - Auth: Bearer token credential **Wiza**
- **Connections:** to **Get Lists**
- **Edge cases / failures:**
  - Wiza may expect JSON object, but this node sends a JSON *string* inside a JSON body field due to `JSON.stringify(...)`. Depending on n8n HTTP settings, this can double-encode.
  - If list creation is async, subsequent polling must use correct id from response.

#### Node: Get Lists
- **Type / role:** `HTTP Request` — fetch list status/details by id.
- **Key configuration:**
  - GET `https://wiza.co/api/lists/{{ $json.data.id }}`
  - Auth: Wiza bearer
- **Connections:** to **Check If Finished**
- **Edge cases:** if response path is not `data.id`, URL becomes invalid.

#### Node: Check If Finished
- **Type / role:** `IF` — checks enrichment completion.
- **Condition:** `$json.data.status == 'finished'`
- **True branch:** to **Get Lists Contacts**
- **False branch:** to **Wait**
- **Edge cases:**
  - Status might be `complete` or other variant; strict equals may loop forever.
  - If Wiza returns errors or missing `data.status`, condition fails and goes to wait branch indefinitely.

#### Node: Wait
- **Type / role:** `Wait` — delay between polling attempts.
- **Key configuration:** unit minutes (value not specified in JSON; defaults may apply in UI)
- **Connections:** to **Get Lists**
- **Edge cases:** if wait time is too short, can hit rate limits; too long delays results.

#### Node: Get Lists Contacts
- **Type / role:** `HTTP Request` — retrieves contacts from list.
- **Key configuration:**
  - GET `https://wiza.co/api/lists/{{ $json.data.id }}/contacts`
  - Query param: `segment=people`
  - Auth: Wiza bearer
- **Connections:** to **Standardize Data**
- **Edge cases:** pagination (large lists), empty results, missing verified emails.

#### Node: Standardize Data
- **Type / role:** `Code` — maps Wiza contact fields to internal Lead Database schema.
- **Key logic:**
  - Flattens input:
    - If `item.json.data` is an array, uses it; else wraps object.
  - Produces for each lead:
    - `campaign_name`: `lead.list_name`
    - `name`: `lead.full_name`
    - `linkedin_profile_url`: `lead.linkedin_profile_url || lead.linkedin`
    - `email`, `title`, `location`
    - `company_*` mappings (domain, size range, revenue, industry, linkedin, location, type)
    - Initializes flags/fields: `email_sent=false`, `research=null`, `email_icebreaker=null`, `phone=null`
- **Connections:** to **Update Leads**
- **Edge cases / failures:**
  - If `data` includes nested structures or different naming, mapping yields nulls.
  - If `company_size_range` missing, falls back to `String(lead.company_size)` which may produce `"undefined"` if not guarded.

#### Node: Update Leads
- **Type / role:** `Data Table` — writes leads into “Lead Database”.
- **Key configuration:**
  - Data Table: **Lead Database**
  - Mapping mode: auto-map input data
  - Schema includes: campaign_name, name, linkedin_profile_url, email, title, location, phone, company fields, email_sent, research, email_icebreaker
- **Connections:** to **Lead_info**
- **Edge cases:**
  - No matching columns configured (empty `matchingColumns`) → likely inserts new rows rather than upserting; duplicates possible.
  - `email_sent` column is typed as `string` in schema though workflow sets boolean/false; could cause inconsistent data.

#### Node: Lead_info
- **Type / role:** `Set` — wraps current lead into `lead_info` object for downstream reference.
- **Key configuration:** `lead_info = {{ $json }}`
- **Connections:** to **Loop Over Items**
- **Edge cases:** naming overlap: later nodes reference `$('Lead_info').first().json.lead_info`.

---

### Block 5 — Per-Lead Loop, Research, Copy Generation, and Payload Build
**Overview:** Iterates through leads, starts campaign (attempt), runs Perplexity-backed research, generates an icebreaker + follow-ups using case studies, and aggregates into Smartlead lead upload payload.

**Nodes involved:**
- Loop Over Items
- Start Campaign
- Research agent
- Perplexity Research Tool
- LLM
- Memory 1
- Business Context
- Ice Breaker Email Generator
- Get Case Studies
- LLM1
- Memory 2
- Structured Output Parser - 1
- Ice Breaker Email
- Follow-Up Sequence Generator
- Get Case Studies 2
- LLM2
- Memory 3
- Structured Output Parser - 2
- Follow-up Sequence Generator set
- Payload aggregator

#### Node: Loop Over Items
- **Type / role:** `Split In Batches` — batch iterator over leads.
- **Key configuration:** options empty (defaults; batch size likely default 1 unless set in UI).
- **Inputs:** from **Lead_info**.
- **Outputs:** two parallel connections:
  - to **Start Campaign**
  - to **Research agent**
- **Edge cases:**
  - If batch size > 1, downstream “first()” references in code may pick wrong item.
  - Parallel branch means “Start Campaign” may run repeatedly (per lead), not once.

#### Node: Start Campaign
- **Type / role:** `HTTP Request` — intended to start the Smartlead campaign.
- **Key configuration:**
  - POST `https://server.smartlead.ai/api/v1/campaigns//status`
  - Body: `{"status": "START"}`
  - Auth: Smartlead query auth
- **Critical issue:** URL contains `campaigns//status` (missing campaign id). This likely fails every time.
- **Connections:** none downstream.
- **Edge cases / failures:**
  - Guaranteed 404/validation unless Smartlead tolerates it (unlikely).
  - Also triggered per lead due to placement after the loop.

#### Node: Research agent
- **Type / role:** `LangChain Agent` — web research summarizer.
- **Key configuration:**
  - Requires using Perplexity tool (explicitly in instructions).
  - Produces a “report” with 1 sentence max per field; if nothing found → “No recent data found”.
  - `returnIntermediateSteps=true` (captures tool calls).
- **AI connections:**
  - **LLM** (openai/gpt-4o) as the language model
  - **Memory 1** sessionKey=1
  - **Perplexity Research Tool** as tool
- **Outputs:** used by **Business Context**.
- **Edge cases:**
  - If Perplexity tool fails (rate limit/auth), agent may error or produce incomplete output.
  - Model may still hallucinate if tool call fails; instructions attempt to prevent this but not guaranteed.

#### Node: Perplexity Research Tool
- **Type / role:** `Perplexity Tool` — external web search tool for the agent.
- **Key configuration:**
  - Parameters are AI-driven via `$fromAI(...)` placeholders.
  - Has optional batching settings.
- **Credentials:** Perplexity account.
- **Edge cases:** tool schema changes, quota limits, empty sources.

#### Node: LLM
- **Type / role:** OpenRouter chat model for Research agent.
- **Model:** `openai/gpt-4o`
- **Edge cases:** cost, rate limit, OpenRouter routing changes.

#### Node: Memory 1
- **Type / role:** Memory buffer window for Research agent.
- **Config:** `sessionKey=1` static.
- **Risk:** cross-execution memory bleed.

#### Node: Business Context
- **Type / role:** `Set` — injects offer and business positioning + passes research forward.
- **Key fields:**
  - `Our_Offer`: multi-offer text block
  - `Our Business Profile`: positioning + guarantee
  - `Lead's Research Report`: `{{ $json.output }}`
  - `=lead_info` (object): `={{ JSON.stringify($json) }}` (note: stringified)
- **Connections:** to **Ice Breaker Email Generator**
- **Edge cases:**
  - `Lead's Research Report` assumes research output stored in `$json.output`.
  - `lead_info` is saved as string, not object, which can confuse later processing.

#### Node: Ice Breaker Email Generator
- **Type / role:** `LangChain Agent` — generates personalized first-touch email.
- **Key configuration:**
  - Must call **Get Case Studies** tool and incorporate a metric if found.
  - Must follow “Anti-AI” style guide and output JSON (subject_line, email_body).
  - `returnIntermediateSteps=true`
  - Has output parser enabled.
- **AI connections:**
  - **LLM1** (openai/gpt-4o)
  - **Memory 2** sessionKey=2
  - **Get Case Studies** Data Table Tool
  - **Structured Output Parser - 1**
- **Connections:** to **Ice Breaker Email**
- **Edge cases:**
  - If case study tool returns many records, agent might pick irrelevant one without stronger retrieval logic.
  - Output must not contain curly braces; parser may pass JSON but body could contain forbidden characters or style violations.

#### Node: Get Case Studies
- **Type / role:** `Data Table Tool` — tool callable by agent to fetch case study rows.
- **Key configuration:** operation `get`, `returnAll=true`, table “Case Study Database”.
- **Edge cases:** large table → token bloat; better to filter but not configured.

#### Node: LLM1
- **Type / role:** OpenRouter chat model for Ice Breaker generator.
- **Model:** `openai/gpt-4o`

#### Node: Memory 2
- **Type / role:** Memory buffer for Ice Breaker generator.
- **Config:** sessionKey=2 static.

#### Node: Structured Output Parser - 1
- **Type / role:** Structured parser enforcing icebreaker schema.
- **Schema example:** `{ subject_line: "...", email_body: "<p>...</p>" }`
- **Edge cases:** subject constraints (lowercase, no punctuation) are not strictly validated—only suggested.

#### Node: Ice Breaker Email
- **Type / role:** `Set` — extracts parsed fields into flat keys.
- **Fields:**
  - `subject_line = $json.output.subject_line`
  - `email_body = $json.output.email_body`
- **Connections:** to **Follow-Up Sequence Generator**
- **Edge cases:** if agent output differs (no `output` wrapper), expressions break.

#### Node: Follow-Up Sequence Generator
- **Type / role:** `LangChain Agent` — writes 3 follow-ups (steps 2–4).
- **Key configuration:**
  - Uses original outreach subject/body from **Ice Breaker Email**
  - Uses:
    - Lead: `$('Standardize Data').first().json` (note: first lead, not current item)
    - Research: `$('Research agent').item.json.output`
    - Offer: `$('Business Context').item.json.Our_Offer`
  - Requires “re:” subjects and a breakup subject.
  - Output parsed via structured output parser.
- **AI connections:**
  - **LLM2** (z-ai/glm-4.6)
  - **Memory 3**
  - **Get Case Studies 2** tool
  - **Structured Output Parser - 2**
- **Connections:** to **Follow-up Sequence Generator set**
- **Edge cases / failures:**
  - **Data mismatch bug:** referencing `$('Standardize Data').first()` inside a loop can pull the first lead from the earlier batch, not the current lead. This risks wrong names/company in follow-ups.
  - Similar risk with `$('Research agent').item` if items don’t align due to batching or parallel execution.

#### Node: Get Case Studies 2
- **Type / role:** Data Table Tool — same case study table, used for follow-ups.
- **Config:** `returnAll=true` again.

#### Node: LLM2
- **Type / role:** OpenRouter model for follow-ups.
- **Model:** `z-ai/glm-4.6`

#### Node: Memory 3
- **Type / role:** Memory buffer for follow-ups.
- **Config:** sessionKey=3 static.

#### Node: Structured Output Parser - 2
- **Type / role:** Structured parser enforcing follow-up array schema.

#### Node: Follow-up Sequence Generator set
- **Type / role:** `Set` — stores follow-up output object under `output`.
- **Field:** `output = $json.output`
- **Connections:** to **Payload aggregator**

#### Node: Payload aggregator
- **Type / role:** `Code` — constructs Smartlead lead upload payload with custom fields.
- **Key logic:**
  - Reads:
    - `lead = $('Lead_info').first().json.lead_info`
    - `iceBreaker = $('Ice Breaker Email').first().json`
    - `followUps = $('Follow-up Sequence Generator set').first().json.output.followups`
  - Builds `lead_list: [{ email, first_name, last_name, company_name, website, linkedin_profile, location, phone_number, custom_fields: {...}}]`
  - Maps:
    - icebreaker_subject/body
    - followup_1..3 subject/body using sequence_number 2/3/4
    - also sets `follow_up_3` and `follow_up_4` legacy names
- **Connections:** to **Upload Lead to Smartlead**
- **Edge cases / failures:**
  - Uses `.first()` everywhere → unsafe inside loops; may upload wrong email content to wrong lead if multiple items are in play.
  - If followups array missing sequence numbers, subjects/bodies become empty strings.
  - `lead.name` split assumes space-delimited; single names yield empty last_name.

---

### Block 6 — Upload to Smartlead (Per Lead)
**Overview:** Pushes the prepared lead payload into Smartlead so Smartlead can merge custom fields into the previously-created sequence templates.

**Nodes involved:**
- Upload Lead to Smartlead

#### Node: Upload Lead to Smartlead
- **Type / role:** `HTTP Request` — add leads to campaign.
- **Key configuration:**
  - POST `https://server.smartlead.ai/api/v1/campaigns/{{ campaignId }}/leads`
  - Body: `{{$json}}` (expects object containing `lead_list`)
  - Auth: Smartlead query auth
- **Connections:** loops back to **Loop Over Items** (to process next lead/batch).
- **Edge cases:**
  - Smartlead may reject leads without email or with invalid domains.
  - If custom field names don’t match Smartlead expectations, merge tags remain blank.
  - Without dedupe, repeated runs can re-upload leads.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Sticky Note | stickyNote | Documentation / overview panel |  |  | # Wiza Powered Full AI SDR Agent… Link: https://freemezie.notion.site/Full-AI-SDR-Workflow-285c8a2a63e0806f9561d4772525d087 |
| Campaign Generation Form | formTrigger | Entry point: collect campaign inputs |  | Set Campaign Details | # Stage 1: Campaign Infrastructure Setup… |
| Set Campaign Details | set | Normalize form fields | Campaign Generation Form | Create Smartlead Campaign | # Stage 1: Campaign Infrastructure Setup… |
| Create Smartlead Campaign | httpRequest | Create Smartlead campaign | Set Campaign Details | Set Campaign id | # Stage 1: Campaign Infrastructure Setup… |
| Set Campaign id | set | Store campaign id | Create Smartlead Campaign | Fetch Email Accounts | # Stage 1: Campaign Infrastructure Setup… |
| Fetch Email Accounts | httpRequest | Retrieve Smartlead sender accounts | Set Campaign id | Find Least Used Account | # Stage 1: Campaign Infrastructure Setup… |
| Find Least Used Account | code | Pick best sender account by scoring | Fetch Email Accounts | Add Email Account to Campaign | # Stage 1: Campaign Infrastructure Setup… |
| Add Email Account to Campaign | httpRequest | Attach sender to campaign | Find Least Used Account | Build Sequence Templates | # Stage 1: Campaign Infrastructure Setup… |
| Build Sequence Templates | code | Build 4-step Smartlead sequence templates | Add Email Account to Campaign | Save Sequence Templates | # Stage 1: Campaign Infrastructure Setup… |
| Save Sequence Templates | httpRequest | Save sequences in Smartlead | Build Sequence Templates | Update Campaign Settings | # Stage 1: Campaign Infrastructure Setup… |
| Update Campaign Settings | httpRequest | Configure stop-on-reply settings | Save Sequence Templates | Schedule Campaign | # Stage 1: Campaign Infrastructure Setup… |
| Schedule Campaign | httpRequest | Set campaign schedule window | Update Campaign Settings | Format Search Parameters | # Stage 1: Campaign Infrastructure Setup… |
| Format Search Parameters | langchain agent | Convert ICP to Wiza filter JSON | Schedule Campaign | Search Prospects [Wiza-API] | # Stage 2: Lead Sourcing via Wiza… |
| OpenRouter Chat Model7 | OpenRouter chat model | LLM for ICP→Wiza conversion |  | Format Search Parameters (ai_languageModel) | # Stage 2: Lead Sourcing via Wiza… |
| Simple Memory7 | memoryBufferWindow | Memory for ICP conversion agent |  | Format Search Parameters (ai_memory) | # Stage 2: Lead Sourcing via Wiza… |
| Structured Output Parser9 | structured output parser | Enforce Wiza filter JSON schema |  | Format Search Parameters (ai_outputParser) | # Stage 2: Lead Sourcing via Wiza… |
| Search Prospects [Wiza-API] | httpRequest | Create Wiza prospect list | Format Search Parameters | Get Lists | # Stage 2: Lead Sourcing via Wiza… |
| Get Lists | httpRequest | Poll list status/details | Search Prospects [Wiza-API] / Wait | Check If Finished | # Stage 2: Lead Sourcing via Wiza… |
| Check If Finished | if | Branch on list status finished | Get Lists | Get Lists Contacts / Wait | # Stage 2: Lead Sourcing via Wiza… |
| Wait | wait | Delay before polling again | Check If Finished | Get Lists | # Stage 2: Lead Sourcing via Wiza… |
| Get Lists Contacts | httpRequest | Fetch contacts from Wiza list | Check If Finished (true) | Standardize Data | # Stage 2: Lead Sourcing via Wiza… |
| Standardize Data | code | Map Wiza contacts to internal schema | Get Lists Contacts | Update Leads | # Stage 2: Lead Sourcing via Wiza… |
| Update Leads | dataTable | Store leads in Lead Database | Standardize Data | Lead_info | # Stage 2: Lead Sourcing via Wiza… |
| Lead_info | set | Wrap current lead for loop | Update Leads | Loop Over Items | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Loop Over Items | splitInBatches | Iterate through leads | Lead_info / Upload Lead to Smartlead | Start Campaign / Research agent | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Start Campaign | httpRequest | Start Smartlead campaign (misconfigured URL) | Loop Over Items |  | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Research agent | langchain agent | Per-lead web research via Perplexity | Loop Over Items | Business Context | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Perplexity Research Tool | perplexityTool | Tool used by Research agent |  | Research agent (ai_tool) | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| LLM | OpenRouter chat model | LLM for Research agent |  | Research agent (ai_languageModel) | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Memory 1 | memoryBufferWindow | Memory for Research agent |  | Research agent (ai_memory) | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Business Context | set | Inject offer + business context + research | Research agent | Ice Breaker Email Generator | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Ice Breaker Email Generator | langchain agent | Generate personalized first email | Business Context | Ice Breaker Email | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Get Case Studies | dataTableTool | Case study retrieval tool (icebreaker) |  | Ice Breaker Email Generator (ai_tool) | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| LLM1 | OpenRouter chat model | LLM for Ice Breaker generator |  | Ice Breaker Email Generator (ai_languageModel) | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Memory 2 | memoryBufferWindow | Memory for Ice Breaker generator |  | Ice Breaker Email Generator (ai_memory) | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Structured Output Parser - 1 | structured output parser | Enforce icebreaker JSON schema |  | Ice Breaker Email Generator (ai_outputParser) | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Ice Breaker Email | set | Extract subject/body fields | Ice Breaker Email Generator | Follow-Up Sequence Generator | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Follow-Up Sequence Generator | langchain agent | Create 3 follow-ups | Ice Breaker Email | Follow-up Sequence Generator set | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Get Case Studies 2 | dataTableTool | Case study retrieval tool (follow-ups) |  | Follow-Up Sequence Generator (ai_tool) | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| LLM2 | OpenRouter chat model | LLM for Follow-up generator |  | Follow-Up Sequence Generator (ai_languageModel) | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Memory 3 | memoryBufferWindow | Memory for Follow-up generator |  | Follow-Up Sequence Generator (ai_memory) | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Structured Output Parser - 2 | structured output parser | Enforce follow-up JSON schema |  | Follow-Up Sequence Generator (ai_outputParser) | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Follow-up Sequence Generator set | set | Store follow-up output object | Follow-Up Sequence Generator | Payload aggregator | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Payload aggregator | code | Build Smartlead lead_list payload + custom_fields | Follow-up Sequence Generator set | Upload Lead to Smartlead | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Upload Lead to Smartlead | httpRequest | Upload personalized lead to Smartlead | Payload aggregator | Loop Over Items | # Stage 3: AI Copywriting (Hyper-Personalization)… |
| Sticky Note9 | stickyNote | Stage comment |  |  | # Stage 1: Campaign Infrastructure Setup… |
| Sticky Note7 | stickyNote | Stage comment |  |  | # Stage 2: Lead Sourcing via Wiza… |
| Sticky Note13 | stickyNote | Stage comment |  |  | # Stage 3: AI Copywriting (Hyper-Personalization)… |

---

## 4. Reproducing the Workflow from Scratch (n8n)

1) **Create a new workflow** named **“Full AI SDR”** (or your preferred name).  
2) **Add Form Trigger** node:
   - Title: *Campaign Generation Form*
   - Fields (required):
     - Campaign Name (text)
     - Ideal Client Description (textarea)
     - Number of Prospects to Add (number)
     - Schedule Campaign (date)
3) **Add Set node** “Set Campaign Details”:
   - Map:
     - `Campaign name` ← `Campaign Name`
     - `Ideal Client Description` ← `Ideal Client Description`
     - `Number of Prospects to Add` ← `Number of Prospects to Add`
     - `Schedule Campaign` ← `Schedule Campaign`
   - Connect: Form Trigger → Set.

### Smartlead setup
4) **Create Smartlead credential**:
   - Credential type: **HTTP Query Auth** (as used by nodes)
   - Store Smartlead API key/query params as required by Smartlead.
5) **Add HTTP Request** “Create Smartlead Campaign”:
   - POST `https://server.smartlead.ai/api/v1/campaigns/create`
   - JSON body: `{ "name": "{{ $json['Campaign name'] }}" }`
   - Authentication: Generic → HTTP Query Auth → select Smartlead credential
   - Connect: Set Campaign Details → Create Smartlead Campaign
6) **Add Set** “Set Campaign id”:
   - `id` ← `{{$json.id}}`
   - Connect: Create Smartlead Campaign → Set Campaign id
7) **Add HTTP Request** “Fetch Email Accounts”:
   - GET `https://server.smartlead.ai/api/v1/email-accounts`
   - Auth: Smartlead query auth
   - Connect: Set Campaign id → Fetch Email Accounts
8) **Add Code** “Find Least Used Account”:
   - Paste the scoring code (campaign_count/warmup_reputation/spam_count)
   - Connect: Fetch Email Accounts → Find Least Used Account
9) **Add HTTP Request** “Add Email Account to Campaign”:
   - POST `https://server.smartlead.ai/api/v1/campaigns/{{ $node["Create Smartlead Campaign"].json.id }}/email-accounts`
   - JSON body: `{ "email_account_ids": ["{{ $json.email_account_id }}"] }`
   - Auth: Smartlead query auth
   - Connect: Find Least Used Account → Add Email Account to Campaign
10) **Add Code** “Build Sequence Templates”:
   - Create 4 sequences using Smartlead placeholders:
     - Step1: subject `{{icebreaker_subject}}` body `{{icebreaker_body}}`
     - Step2: `{{followup_1_subject}}` / `{{followup_1_body}}` delay 3
     - Step3: `{{followup_2_subject}}` / `{{followup_2_body}}` delay 5
     - Step4: `{{followup_3_subject}}` / `{{followup_3_body}}` delay 7
   - Output `{ sequences: [...] }`
   - Connect: Add Email Account to Campaign → Build Sequence Templates
11) **Add HTTP Request** “Save Sequence Templates”:
   - POST `https://server.smartlead.ai/api/v1/campaigns/{{ $node["Create Smartlead Campaign"].json.id }}/sequences`
   - Body: `{{$json}}`
   - Auth: Smartlead
   - Connect: Build Sequence Templates → Save Sequence Templates
12) **Add HTTP Request** “Update Campaign Settings”:
   - POST `https://server.smartlead.ai/api/v1/campaigns/{{ $node["Create Smartlead Campaign"].json.id }}/settings`
   - Body: `{ "stop_lead_settings": "REPLY_TO_AN_EMAIL" }`
   - Connect: Save Sequence Templates → Update Campaign Settings
13) **Add HTTP Request** “Schedule Campaign”:
   - POST `https://server.smartlead.ai/api/v1/campaigns/{{ $node["Create Smartlead Campaign"].json.id }}/schedule`
   - Body includes:
     - timezone, weekdays, hours
     - `schedule_start_time` from Set Campaign Details
   - Connect: Update Campaign Settings → Schedule Campaign

### Wiza + ICP parsing
14) **Create OpenRouter credential** (API key).  
15) **Add OpenRouter Chat Model** “OpenRouter Chat Model7”:
   - Model: `z-ai/glm-4.5`
16) **Add Memory Buffer Window** “Simple Memory7”:
   - sessionKey: `0` (or better: dynamic per execution)
17) **Add Structured Output Parser** “Structured Output Parser9”:
   - Schema example matching Wiza filters/list.
18) **Add LangChain Agent** “Format Search Parameters”:
   - Prompt: include campaign name, ICP description, max_profiles.
   - System message: the ICP→Wiza mapping rules.
   - Enable output parser.
   - Wire AI:
     - Language model: OpenRouter Chat Model7
     - Memory: Simple Memory7
     - Output parser: Structured Output Parser9
   - Connect: Schedule Campaign → Format Search Parameters
19) **Create Wiza credential**:
   - Credential type: HTTP Bearer Auth
   - Token from Wiza
20) **Add HTTP Request** “Search Prospects [Wiza-API]”:
   - POST `https://wiza.co/api/prospects/create_prospect_list`
   - Body: the parsed JSON from agent (prefer sending the object directly; avoid double-stringifying)
   - Auth: Wiza bearer
   - Connect: Format Search Parameters → Search Prospects [Wiza-API]
21) **Add HTTP Request** “Get Lists”:
   - GET `https://wiza.co/api/lists/{{ $json.data.id }}`
   - Auth: Wiza bearer
   - Connect: Search Prospects → Get Lists
22) **Add IF** “Check If Finished”:
   - Condition: `$json.data.status` equals `finished`
   - True → Get Lists Contacts
   - False → Wait
23) **Add Wait** node:
   - Unit: minutes (choose a value, e.g., 1–5)
   - Connect: Wait → Get Lists
24) **Add HTTP Request** “Get Lists Contacts”:
   - GET `https://wiza.co/api/lists/{{ $json.data.id }}/contacts?segment=people`
   - Auth: Wiza bearer
   - Connect: Check If Finished (true) → Get Lists Contacts
25) **Add Code** “Standardize Data”:
   - Map Wiza contact fields into your internal schema (campaign_name, name, email, company fields, etc.)
   - Connect: Get Lists Contacts → Standardize Data

### Data tables
26) **Create n8n Data Table** “Lead Database” with columns matching:
   - campaign_name, name, linkedin_profile_url, email, title, location, phone,
   - company_name, company_size, company_type, company_industry, company_revenue_range,
   - company_linkedin, company_location, company_domain,
   - email_sent, research, email_icebreaker
27) **Add Data Table node** “Update Leads”:
   - Operation: insert/update as desired (configure matching columns like email to avoid duplicates)
   - Connect: Standardize Data → Update Leads
28) **Add Set** “Lead_info”:
   - `lead_info` ← `{{$json}}`
   - Connect: Update Leads → Lead_info

### Research + copywriting + upload loop
29) **Add Split In Batches** “Loop Over Items”:
   - Batch size: 1 (recommended)
   - Connect: Lead_info → Loop Over Items
30) **(Fix recommended) Add Start Campaign HTTP Request**:
   - POST `https://server.smartlead.ai/api/v1/campaigns/{{ $node["Create Smartlead Campaign"].json.id }}/status`
   - Body: `{ "status": "START" }`
   - Place it **before** the loop if you only want to start once.
31) **Create Perplexity credential** (API key).
32) **Add Perplexity Tool** node and connect as tool to a research agent.
33) **Add OpenRouter Chat Model** “LLM” model `openai/gpt-4o` + **Memory 1** sessionKey=1.
34) **Add LangChain Agent** “Research agent”:
   - Instructions require Perplexity tool usage
   - Connect: Loop Over Items → Research agent
35) **Add Set** “Business Context”:
   - Add `Our_Offer`, `Our Business Profile`
   - Pass through research report as `Lead's Research Report`
   - Connect: Research agent → Business Context
36) **Create Data Table** “Case Study Database” and fill with case studies.
37) **Add Data Table Tool** “Get Case Studies” (returnAll=true).
38) **Add OpenRouter Chat Model** “LLM1” model `openai/gpt-4o` + **Memory 2**.
39) **Add Structured Output Parser - 1** for `{subject_line, email_body}`.
40) **Add LangChain Agent** “Ice Breaker Email Generator”:
   - Must call Get Case Studies tool
   - Output JSON enforced by parser
   - Connect: Business Context → Ice Breaker Email Generator
41) **Add Set** “Ice Breaker Email”:
   - `subject_line` ← `$json.output.subject_line`
   - `email_body` ← `$json.output.email_body`
   - Connect: Ice Breaker Email Generator → Ice Breaker Email
42) **Add Data Table Tool** “Get Case Studies 2”, **LLM2** model `z-ai/glm-4.6`, **Memory 3**, **Structured Output Parser - 2** (followups array).
43) **Add LangChain Agent** “Follow-Up Sequence Generator”:
   - Inputs: Ice Breaker email, lead data, research, offer
   - Connect: Ice Breaker Email → Follow-Up Sequence Generator
44) **Add Set** “Follow-up Sequence Generator set”:
   - `output` ← `$json.output`
   - Connect: Follow-Up Sequence Generator → set node
45) **Add Code** “Payload aggregator”:
   - Build `lead_list` payload and `custom_fields` for Smartlead using icebreaker + followups.
   - Connect: Follow-up set → Payload aggregator
46) **Add HTTP Request** “Upload Lead to Smartlead”:
   - POST `https://server.smartlead.ai/api/v1/campaigns/{{ $node["Create Smartlead Campaign"].json.id }}/leads`
   - Body: `{{$json}}`
   - Auth: Smartlead
   - Connect: Payload aggregator → Upload Lead to Smartlead
47) **Connect Upload Lead to Smartlead → Loop Over Items** to continue batching until complete.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Wiza Powered Full AI SDR Agent” video reference | YouTube reference embedded in sticky note: `@[youtube](1o4oREHQgLS)` |
| Downloadable resources + database CSV template | https://freemezie.notion.site/Full-AI-SDR-Workflow-285c8a2a63e0806f9561d4772525d087 |
| Required integrations | Smartlead: https://www.smartlead.ai/ ; Wiza: https://wiza.co/auth/login ; OpenRouter: https://openrouter.ai/ ; Perplexity: https://www.perplexity.ai/ |

