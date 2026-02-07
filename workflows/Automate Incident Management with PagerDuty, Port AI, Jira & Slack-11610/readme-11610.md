Automate Incident Management with PagerDuty, Port AI, Jira & Slack

https://n8nworkflows.xyz/workflows/automate-incident-management-with-pagerduty--port-ai--jira---slack-11610


# Automate Incident Management with PagerDuty, Port AI, Jira & Slack

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:** This workflow automates an end-to-end incident lifecycle using **PagerDuty events** as the trigger, enriching incident context via **Port (catalog + AI agents)**, assessing severity with **OpenAI**, coordinating response via **Slack**, tracking work in **Jira**, and—on resolution—generating/scheduling a **post-mortem** and logging **MTTR metrics** back to Port.

**Target use cases:**
- Standardizing incident response notifications and escalation decisions.
- Auto-creating well-contextualized Jira incident tickets.
- Ensuring post-mortems are consistently created and scheduled after resolution.
- Capturing MTTR/incident metrics centrally in Port for reporting.

### Logical Blocks
**1.1 Event Intake & Routing (PagerDuty → Switch)**  
Receives PagerDuty webhook events and routes execution based on incident event type (triggered vs resolved).

**1.2 Triggered Incident Enrichment & Severity (Port → OpenAI → IF)**  
Uses Port AI to fetch service/on-call/change context, then OpenAI to assess severity and determine escalation needs.

**1.3 Triggered Notifications & Ticketing (Slack → Jira → Slack)**  
Notifies the team channel (and optionally leadership), creates a Jira issue containing incident + context + AI outputs, then posts the Jira key back to Slack.

**1.4 Resolved Incident Post-Mortem & Metrics (Port → OpenAI → Port Agent → Slack → Port)**  
On resolve, fetches resolution context (including incident duration), generates a post-mortem template, invokes a Port AI agent to create the document and schedule the meeting, notifies Slack, and logs MTTR metrics to Port.

---

## 2. Block-by-Block Analysis

### 2.1 Event Intake & Routing (PagerDuty → Switch)

**Overview:** Accepts PagerDuty incident webhooks, then branches by `event_type` into the “Incident Triggered” or “Incident Resolved” path.

**Nodes involved:**
- On PagerDuty Incident
- Check Event Type

#### Node: **On PagerDuty Incident**
- **Type / role:** `Webhook` (n8n-nodes-base.webhook). Entry point; receives HTTP POSTs from PagerDuty.
- **Configuration (interpreted):**
  - **HTTP Method:** POST  
  - **Path:** `pagerduty/incident`  
  - Produces a payload under `{{$json.body...}}` (as used later).
- **Inputs/Outputs:**
  - **Input:** external HTTP request from PagerDuty.
  - **Output:** to **Check Event Type**.
- **Version:** typeVersion 1.
- **Edge cases / failures:**
  - PagerDuty signature validation is **not configured** here (no auth/verification options shown). If your environment requires verification, add it.
  - Payload shape assumptions: subsequent nodes expect `body.event.event_type` and `body.event.data.*`. Any PagerDuty schema changes or different webhook event formats will break expressions.

#### Node: **Check Event Type**
- **Type / role:** `Switch` (n8n-nodes-base.switch). Routes based on incident lifecycle phase.
- **Configuration:**
  - Two rules comparing `{{$json.body.event.event_type}}`:
    - Equals `incident.triggered` → Output 0 (Triggered flow)
    - Equals `incident.resolved` → Output 1 (Resolved flow)
  - **Fallback:** Output 2 (not connected) — effectively drops unknown event types.
- **Connections:**
  - Output 0 → **Extract Context (New Incident)**
  - Output 1 → **Extract Context (Resolved)**
- **Version:** typeVersion 2.
- **Edge cases:**
  - Any other event type (acknowledged, reassigned, etc.) goes to fallback and is not handled (silent no-op unless n8n reports “no connection” depending on settings).

---

### 2.2 Triggered Incident Enrichment & Severity (Port → OpenAI → IF)

**Overview:** When an incident is triggered, the workflow queries Port for service/on-call/deploy context, then asks OpenAI to output a structured severity decision including escalation requirements.

**Nodes involved:**
- Extract Context (New Incident)
- Parse Context (New Incident)
- Assess Severity
- Needs Escalation?

#### Node: **Extract Context (New Incident)**
- **Type / role:** `CUSTOM.portIo`. Invokes a Port AI agent to query the Port catalog for incident context.
- **Configuration:**
  - **Model:** `gpt-5` (as configured in the Port integration)
  - **Agent identifier:** `context_retriever_agent`
  - **Labels:** `source=n8n-workflow`, `use_case=incident-context-enrichment`
  - **Prompt:** Injects PagerDuty incident fields (ID/title/service/urgency/created_at) and requests a strict JSON schema including owners, on-call, recent deployments/changes, dependencies, runbook/dashboard URLs, similar incidents, Slack channel, Jira project key.
  - Explicit rule: “Only include data that exists in Port; use empty strings/arrays if not found.”
- **Connections:**
  - Output → **Parse Context (New Incident)**
- **Credentials:** `portIoApi`
- **Version:** typeVersion 1.
- **Edge cases / failures:**
  - Port auth/permission issues (401/403).
  - Agent not found / misnamed (`context_retriever_agent`).
  - The returned content may not match the requested JSON format (later nodes rely on parsing).
  - Latency/timeouts if Port AI agent execution is slow.

#### Node: **Parse Context (New Incident)**
- **Type / role:** `CUSTOM.portIo` operation `getInvocation`. Fetches the result of the prior Port AI invocation.
- **Configuration:**
  - **operation:** `getInvocation`
  - **invocationId:** `={{ $json.invocationIdentifier }}`
- **Connections:**
  - Output → **Assess Severity**
- **Credentials:** `portIoApi`
- **Edge cases / failures:**
  - `invocationIdentifier` missing if the previous node failed.
  - Invocation still running or returns partial data depending on Port behavior; downstream expects `result.message` to exist.

#### Node: **Assess Severity**
- **Type / role:** `OpenAI Chat` (n8n-nodes-base.openAi). Produces a structured JSON assessment and action plan.
- **Configuration:**
  - **Model:** `gpt-4o-mini`
  - **Prompt:** Includes incident title/service/urgency plus “Context from Port” (`{{ $json.result.message }}` from Parse Context). Requests strict JSON:
    - `severity_assessment` (critical/high/medium/low)
    - `needs_escalation` boolean
    - optional `escalation_reason`
    - `likely_cause`
    - `recommended_actions[]`
    - `investigation_checklist[]`
  - “Return ONLY the JSON object.”
- **Connections:**
  - Output → **Needs Escalation?**
- **Credentials:** `openAiApi`
- **Edge cases / failures:**
  - Model may return non-JSON or wrapped text; downstream uses `parseJson()` and will fail if invalid.
  - OpenAI auth/quota errors, timeouts.
  - If Port context is large, token limits could truncate output.

#### Node: **Needs Escalation?**
- **Type / role:** `IF` (n8n-nodes-base.if). Routes based on `needs_escalation`.
- **Configuration:**
  - Boolean condition:
    - `value1 = {{ $json.message.content.parseJson().needs_escalation }}`
    - compared to `true`
- **Connections:**
  - **True branch:** → **Notify Team Channel** AND **Escalate to Leadership** (both in parallel)
  - **False branch:** → **Notify Team Channel**
- **Edge cases / failures:**
  - `parseJson()` failure if OpenAI output is not valid JSON.
  - If `needs_escalation` is missing/null, comparison may behave unexpectedly (treated as false).

---

### 2.3 Triggered Notifications & Ticketing (Slack → Jira → Slack)

**Overview:** Posts an incident alert to the service/team Slack channel, optionally escalates to a leadership channel, creates a Jira ticket with the full context, and posts the Jira issue key back to Slack.

**Nodes involved:**
- Notify Team Channel
- Escalate to Leadership
- Create Jira Incident Ticket
- Notify Jira Created

#### Node: **Notify Team Channel**
- **Type / role:** `Slack` message (n8n-nodes-base.slack). Posts a formatted alert with context and action items.
- **Configuration highlights:**
  - **Channel:** `={{ Parse Context (New Incident).result.message.parseJson().slack_channel || '#incidents' }}`
  - Message includes:
    - Incident title, urgency, PagerDuty link
    - Service name/tier from Port context
    - Severity, likely cause, recommended actions from OpenAI JSON
    - On-call engineers list (fallback “Check PagerDuty”)
    - Recent deployments (first 3) (fallback “None in last 48h”)
    - Runbook/dashboard links when present
- **Connections:**
  - Output → **Create Jira Incident Ticket**
- **Credentials:** `slackApi`
- **Edge cases / failures:**
  - Slack channel not found or bot not in channel.
  - `parseJson()` risks: if Port context isn’t valid JSON text.
  - Expressions like `.join(', ')` on undefined arrays can error if the parsed JSON doesn’t include arrays as expected.

#### Node: **Escalate to Leadership**
- **Type / role:** `Slack` message. Sends an escalation note to leadership.
- **Configuration:**
  - **Channel:** `#leadership-alerts` (static)
  - Includes escalation reason from OpenAI JSON and references team channel/on-call.
- **Connections:**
  - Output → **Create Jira Incident Ticket**
- **Credentials:** `slackApi`
- **Edge cases:**
  - Same Slack auth/channel membership issues.
  - Missing `escalation_reason` if OpenAI sets `needs_escalation=true` but forgets the reason; message will render blank.

#### Node: **Create Jira Incident Ticket**
- **Type / role:** `Jira Software Cloud` issue creation (n8n-nodes-base.jira).
- **Configuration:**
  - **Project:** dynamic: `jira_project_key` from Port context, else `'INC'`
    - Note: field is configured in “id” mode but value looks like a **key**; depending on node behavior, this may need to be “key” mode or true project ID.
  - **Issue type:** `Bug`
  - **Summary:** `[INC] <PagerDuty title>`
  - **Labels:** `incident`, `pagerduty`, `auto-generated`
  - **Priority mapping:** based on OpenAI `severity_assessment`:
    - critical → Highest
    - high → High
    - else → Medium
  - **Description:** rich markdown-like text including:
    - Incident details (IDs/URLs/timestamps/urgency)
    - Service context (tier, on-call, owners)
    - AI assessment (severity, likely cause)
    - Checklist and recommended actions
    - Recent deployments
    - Links to runbook/dashboard
    - Past incident summary
- **Connections:**
  - Output → **Notify Jira Created**
- **Credentials:** `jiraSoftwareCloudApi`
- **Edge cases / failures:**
  - Jira auth failures; missing permissions to create issues in the target project.
  - Project selector mismatch (“id mode” vs providing a key).
  - Priority names must match Jira instance configuration exactly (“Highest”, “High”, “Medium”).
  - Large descriptions could exceed Jira limits if context is very verbose.

#### Node: **Notify Jira Created**
- **Type / role:** `Slack` message. Confirms ticket creation.
- **Configuration:**
  - Text includes `{{ $json.key }}` from Jira response.
  - Posts to service Slack channel (same as Notify Team Channel).
- **Connections:** none beyond this.
- **Credentials:** `slackApi`
- **Edge cases:**
  - Jira response may not include `key` if creation failed; the node would not run if Jira node errors (unless error workflow/continue-on-fail is enabled elsewhere).

---

### 2.4 Resolved Incident Post-Mortem & Metrics (Port → OpenAI → Port Agent → Slack → Port)

**Overview:** When PagerDuty signals resolution, the workflow enriches resolution context (including duration/MTTR), generates a post-mortem template using OpenAI, delegates scheduling/document creation to a Port AI agent, notifies Slack, and logs MTTR metrics into Port.

**Nodes involved:**
- Extract Context (Resolved)
- Parse Context (Resolved)
- Generate Post-Mortem Template
- Schedule Post-Mortem via Port
- Parse Schedule Response
- Notify Incident Resolved
- Log MTTR to Port

#### Node: **Extract Context (Resolved)**
- **Type / role:** `CUSTOM.portIo`. Port AI agent retrieves post-incident context and computes duration.
- **Configuration:**
  - **Model:** `gpt-5`
  - **Agent:** `context_retriever_agent`
  - **Labels:** `use_case=incident-resolution-context`
  - **Prompt:** Provides created_at and resolved_at (fallback to “now” if missing) and asks Port to return JSON including:
    - service_name, owners, slack_channel
    - confluence_space, calendar_id
    - incident_duration_minutes (calculated)
    - changes_during_incident
    - stakeholders_to_invite
  - “Only include data that exists in Port.”
- **Connections:**
  - Output → **Parse Context (Resolved)**
- **Credentials:** `portIoApi`
- **Edge cases:**
  - Resolved timestamp missing; prompt uses `new Date().toISOString()` but this is only in the prompt text—Port agent must implement the calculation reliably.
  - Same Port agent and JSON formatting risks as triggered flow.

#### Node: **Parse Context (Resolved)**
- **Type / role:** `CUSTOM.portIo` getInvocation.
- **Configuration:** `invocationId = {{ $json.invocationIdentifier }}`
- **Connections:** Output → **Generate Post-Mortem Template**
- **Credentials:** `portIoApi`
- **Edge cases:** invocation not ready/failed; missing `result.message`.

#### Node: **Generate Post-Mortem Template**
- **Type / role:** `OpenAI Chat`. Produces a structured post-mortem JSON template.
- **Configuration:**
  - **Model:** `gpt-4o-mini`
  - Uses parsed Port message fields such as service name and duration minutes.
  - Outputs strict JSON including summary, timeline, impact, RCA placeholder, action items, lessons learned, attendees.
- **Connections:** Output → **Schedule Post-Mortem via Port**
- **Credentials:** `openAiApi`
- **Edge cases:**
  - Non-JSON output causing downstream issues (although this node’s output is passed as text into the next prompt, not parsed immediately).
  - Token limits.

#### Node: **Schedule Post-Mortem via Port**
- **Type / role:** `CUSTOM.portIo`. Delegates document creation + calendar scheduling to a Port AI agent.
- **Configuration:**
  - **Model:** `gpt-5`
  - **Agent:** `post_mortem_scheduler_agent`
  - Prompt includes:
    - incident metadata
    - service name + duration
    - stakeholders list (stakeholders_to_invite else owners)
    - full post-mortem template from OpenAI
  - Required response JSON: document URL, meeting time, invited attendees, status, message.
- **Connections:** Output → **Parse Schedule Response**
- **Credentials:** `portIoApi`
- **Edge cases / failures:**
  - Agent must have access/integrations (Confluence/Notion/calendar) configured in Port; otherwise it may return partial/failed status.
  - Response may not match JSON format; next node expects to parse its `result.message`.

#### Node: **Parse Schedule Response**
- **Type / role:** `CUSTOM.portIo` getInvocation.
- **Configuration:** `invocationId = {{ $json.invocationIdentifier }}`
- **Connections:**
  - Output → **Notify Incident Resolved**
  - Output → **Log MTTR to Port**
- **Credentials:** `portIoApi`
- **Edge cases:** invocation missing/not completed; `result.message` absent.

#### Node: **Notify Incident Resolved**
- **Type / role:** `Slack` message. Posts resolution summary, MTTR, and post-mortem info.
- **Configuration highlights:**
  - **Channel:** `={{ Parse Context (Resolved).result.message.parseJson().slack_channel || '#incidents' }}`
  - Uses `incident_duration_minutes` to render MTTR hours/minutes.
  - Extracts from schedule response (`$json.result.message.parseJson()`):
    - `document_url`
    - `meeting_scheduled`, `meeting_time`
    - `attendees_invited`
    - `message`
- **Connections:** none beyond this.
- **Credentials:** `slackApi`
- **Edge cases:**
  - Multiple `parseJson()` calls: failure if Port agent response is not valid JSON.
  - `attendees_invited.length` will fail if the field is missing or not an array.

#### Node: **Log MTTR to Port**
- **Type / role:** `CUSTOM.portIo`. Logs metrics back to Port catalog via an AI agent.
- **Configuration:**
  - **Agent:** `metrics_logger_agent`
  - Prompt: update service entity with latest MTTR, increment incident count, set last incident timestamp.
  - Expects JSON confirmation: `metrics_logged`, `service_updated`, `message`.
- **Connections:** none beyond this.
- **Credentials:** `portIoApi`
- **Edge cases:**
  - Requires Port catalog write permissions and a known mapping from “service_name” to a service entity.
  - “Increment incident count” implies stateful update; concurrency/race conditions are possible if multiple incidents resolve close together.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| On PagerDuty Incident | Webhook | Receive PagerDuty incident events | (Trigger) | Check Event Type | ## Incident Lifecycle Management with Port… [Port.io](https://www.port.io) |
| Check Event Type | Switch | Route triggered vs resolved | On PagerDuty Incident | Extract Context (New Incident); Extract Context (Resolved) | ## Incident Lifecycle Management with Port… [Port.io](https://www.port.io) |
| Extract Context (New Incident) | CUSTOM.portIo | Port AI: fetch service/on-call/deploy context | Check Event Type | Parse Context (New Incident) | ## Incident Triggered Flow — Port context enrichment + AI severity assessment + intelligent routing + Jira creation |
| Parse Context (New Incident) | CUSTOM.portIo (getInvocation) | Retrieve Port invocation result | Extract Context (New Incident) | Assess Severity | ## Incident Triggered Flow — Port context enrichment + AI severity assessment + intelligent routing + Jira creation |
| Assess Severity | OpenAI (Chat) | AI severity + escalation decision (JSON) | Parse Context (New Incident) | Needs Escalation? | ## Incident Triggered Flow — Port context enrichment + AI severity assessment + intelligent routing + Jira creation |
| Needs Escalation? | IF | Branch: escalate leadership or not | Assess Severity | Notify Team Channel; Escalate to Leadership | ## Incident Triggered Flow — Port context enrichment + AI severity assessment + intelligent routing + Jira creation |
| Notify Team Channel | Slack | Post incident alert to team channel | Needs Escalation? | Create Jira Incident Ticket | ## Incident Triggered Flow — Port context enrichment + AI severity assessment + intelligent routing + Jira creation |
| Escalate to Leadership | Slack | Post escalation to leadership channel | Needs Escalation? | Create Jira Incident Ticket | ## Incident Triggered Flow — Port context enrichment + AI severity assessment + intelligent routing + Jira creation |
| Create Jira Incident Ticket | Jira | Create incident issue with context | Notify Team Channel; Escalate to Leadership | Notify Jira Created | ## Incident Triggered Flow — Port context enrichment + AI severity assessment + intelligent routing + Jira creation |
| Notify Jira Created | Slack | Confirm Jira key in Slack | Create Jira Incident Ticket | (none) | ## Incident Triggered Flow — Port context enrichment + AI severity assessment + intelligent routing + Jira creation |
| Extract Context (Resolved) | CUSTOM.portIo | Port AI: fetch resolution context + duration | Check Event Type | Parse Context (Resolved) | ## Incident Resolved Flow — MTTR calculation + Post-mortem generation + Port AI Agent schedules meeting + Document creation + Metrics logging |
| Parse Context (Resolved) | CUSTOM.portIo (getInvocation) | Retrieve Port invocation result | Extract Context (Resolved) | Generate Post-Mortem Template | ## Incident Resolved Flow — MTTR calculation + Post-mortem generation + Port AI Agent schedules meeting + Document creation + Metrics logging |
| Generate Post-Mortem Template | OpenAI (Chat) | Generate post-mortem JSON template | Parse Context (Resolved) | Schedule Post-Mortem via Port | ## Incident Resolved Flow — MTTR calculation + Post-mortem generation + Port AI Agent schedules meeting + Document creation + Metrics logging |
| Schedule Post-Mortem via Port | CUSTOM.portIo | Port AI Agent: create doc + schedule meeting | Generate Post-Mortem Template | Parse Schedule Response | ## Port AI Agent — Schedules post-mortem meeting: creates document, invites stakeholders, sets time, links to incident |
| Parse Schedule Response | CUSTOM.portIo (getInvocation) | Retrieve scheduling invocation result | Schedule Post-Mortem via Port | Notify Incident Resolved; Log MTTR to Port | ## Port AI Agent — Schedules post-mortem meeting: creates document, invites stakeholders, sets time, links to incident |
| Notify Incident Resolved | Slack | Post resolution + post-mortem links | Parse Schedule Response | (none) | ## Incident Resolved Flow — MTTR calculation + Post-mortem generation + Port AI Agent schedules meeting + Document creation + Metrics logging |
| Log MTTR to Port | CUSTOM.portIo | Port AI Agent: log MTTR/metrics to catalog | Parse Schedule Response | (none) | ## Incident Resolved Flow — MTTR calculation + Post-mortem generation + Port AI Agent schedules meeting + Document creation + Metrics logging |
| Sticky Note | Sticky Note | Annotation | (none) | (none) | ## Incident Lifecycle Management with Port… [Port.io](https://www.port.io) |
| Sticky Note1 | Sticky Note | Annotation | (none) | (none) | ## Incident Triggered Flow — Port context enrichment + AI severity assessment + intelligent routing + Jira creation |
| Sticky Note2 | Sticky Note | Annotation | (none) | (none) | ## Incident Resolved Flow — MTTR calculation + Post-mortem generation + Port AI Agent schedules meeting + Document creation + Metrics logging |
| Sticky Note3 | Sticky Note | Annotation | (none) | (none) | ## Port AI Agent — Schedules post-mortem meeting: creates document, invites stakeholders, sets time, links to incident |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n  
   - Name: *Incident Lifecycle Management with Port* (or your preferred name)
   - Ensure workflow setting **Execution Order** is compatible (this one uses `v1`).

2. **Add trigger: Webhook**
   - Node: **Webhook** named **On PagerDuty Incident**
   - Method: **POST**
   - Path: `pagerduty/incident`
   - In PagerDuty, configure a webhook subscription targeting:
     - `https://<your-n8n-host>/webhook/pagerduty/incident` (or test URL while testing)

3. **Add routing: Switch**
   - Node: **Switch** named **Check Event Type**
   - Value to evaluate: `{{$json.body.event.event_type}}`
   - Rules:
     - equals `incident.triggered` → Output 0
     - equals `incident.resolved` → Output 1
   - (Optional) handle fallback by connecting Output 2 to a logging node.

4. **Triggered flow: Port context invocation**
   - Add **CUSTOM.portIo** node named **Extract Context (New Incident)**
   - Configure Port credentials (**portIoApi**) in n8n.
   - Set:
     - Model: `gpt-5`
     - Agent identifier: `context_retriever_agent`
     - Labels: `source=n8n-workflow`, `use_case=incident-context-enrichment`
     - Prompt: include incident fields and request the JSON schema (service tier, SLA, owners, on-call, slack channel, recent deployments/changes, dependencies, runbook/dashboard, similar incidents, known issues, jira_project_key).
   - Connect: **Check Event Type (triggered output)** → **Extract Context (New Incident)**

5. **Triggered flow: Fetch Port invocation result**
   - Add **CUSTOM.portIo** node named **Parse Context (New Incident)**
   - Operation: `getInvocation`
   - Invocation ID: `{{$json.invocationIdentifier}}`
   - Connect: **Extract Context (New Incident)** → **Parse Context (New Incident)**

6. **Triggered flow: OpenAI severity assessment**
   - Add **OpenAI** node (Chat) named **Assess Severity**
   - Configure OpenAI credentials (**openAiApi**).
   - Model: `gpt-4o-mini`
   - Prompt: include PagerDuty title/service/urgency and Port context (`{{$json.result.message}}`), request strict JSON output.
   - Connect: **Parse Context (New Incident)** → **Assess Severity**

7. **Triggered flow: IF escalation decision**
   - Add **IF** node named **Needs Escalation?**
   - Condition (Boolean):
     - Left: `{{$json.message.content.parseJson().needs_escalation}}`
     - Right: `true`
   - Connect: **Assess Severity** → **Needs Escalation?**

8. **Triggered flow: Slack notifications**
   - Add **Slack** node named **Notify Team Channel**
     - Channel: `{{ $('Parse Context (New Incident)').item.json.result.message.parseJson().slack_channel || '#incidents' }}`
     - Message: include incident summary, on-call, likely cause, recommended actions, runbook/dashboard, PagerDuty URL.
   - Add **Slack** node named **Escalate to Leadership**
     - Channel: `#leadership-alerts`
     - Message: include escalation reason, team channel, on-call, PagerDuty URL.
   - Connect:
     - IF **true** branch → both **Notify Team Channel** and **Escalate to Leadership**
     - IF **false** branch → **Notify Team Channel** only
   - Configure Slack credentials (**slackApi**) and ensure the bot is in the target channels.

9. **Triggered flow: Jira issue creation**
   - Add **Jira** node named **Create Jira Incident Ticket**
   - Credentials: **jiraSoftwareCloudApi**
   - Resource: **Issue** → **Create**
   - Project: use Port-provided key (or ID) with fallback:
     - `{{ $('Parse Context (New Incident)').item.json.result.message.parseJson().jira_project_key || 'INC' }}`
     - Ensure the selector mode matches (Project Key vs Project ID) in your Jira node UI.
   - Issue Type: `Bug`
   - Summary: `[INC] {{ <PagerDuty title> }}`
   - Description: include PagerDuty IDs/URLs, Port context, AI assessment, checklist, recommended actions.
   - Priority mapping based on AI severity.
   - Connect:
     - **Notify Team Channel** → **Create Jira Incident Ticket**
     - **Escalate to Leadership** → **Create Jira Incident Ticket**

10. **Triggered flow: Slack confirmation**
   - Add **Slack** node named **Notify Jira Created**
   - Channel: same as team channel expression
   - Text: include `{{$json.key}}`
   - Connect: **Create Jira Incident Ticket** → **Notify Jira Created**

11. **Resolved flow: Port resolution context invocation**
   - Add **CUSTOM.portIo** node named **Extract Context (Resolved)**
   - Model: `gpt-5`
   - Agent: `context_retriever_agent`
   - Labels: `use_case=incident-resolution-context`
   - Prompt: request JSON with duration minutes, owners, slack_channel, confluence_space, calendar_id, changes during incident, stakeholders.
   - Connect: **Check Event Type (resolved output)** → **Extract Context (Resolved)**

12. **Resolved flow: Fetch Port invocation result**
   - Add **CUSTOM.portIo** node named **Parse Context (Resolved)**
   - Operation: `getInvocation`
   - Invocation ID: `{{$json.invocationIdentifier}}`
   - Connect: **Extract Context (Resolved)** → **Parse Context (Resolved)**

13. **Resolved flow: Generate post-mortem template (OpenAI)**
   - Add **OpenAI** node named **Generate Post-Mortem Template**
   - Model: `gpt-4o-mini`
   - Prompt: include incident metadata and duration, request strict JSON template.
   - Connect: **Parse Context (Resolved)** → **Generate Post-Mortem Template**

14. **Resolved flow: Schedule post-mortem via Port AI agent**
   - Add **CUSTOM.portIo** node named **Schedule Post-Mortem via Port**
   - Model: `gpt-5`
   - Agent: `post_mortem_scheduler_agent`
   - Prompt: instruct to create doc (Confluence/Notion if available), schedule meeting 2–3 business days out, invite stakeholders; require JSON response.
   - Connect: **Generate Post-Mortem Template** → **Schedule Post-Mortem via Port**

15. **Resolved flow: Fetch scheduling invocation result**
   - Add **CUSTOM.portIo** node named **Parse Schedule Response**
   - Operation: `getInvocation`
   - Invocation ID: `{{$json.invocationIdentifier}}`
   - Connect: **Schedule Post-Mortem via Port** → **Parse Schedule Response**

16. **Resolved flow: Notify Slack of resolution**
   - Add **Slack** node named **Notify Incident Resolved**
   - Channel: `{{ $('Parse Context (Resolved)').item.json.result.message.parseJson().slack_channel || '#incidents' }}`
   - Message: include duration/MTTR formatting and schedule response fields (`document_url`, `meeting_time`, `attendees_invited`, `message`).
   - Connect: **Parse Schedule Response** → **Notify Incident Resolved**

17. **Resolved flow: Log MTTR to Port**
   - Add **CUSTOM.portIo** node named **Log MTTR to Port**
   - Model: `gpt-5`
   - Agent: `metrics_logger_agent`
   - Prompt: update service entity metrics (latest MTTR, increment count, last incident timestamp).
   - Connect: **Parse Schedule Response** → **Log MTTR to Port**

18. **(Optional but recommended) Add hardening**
   - Add “try/catch” style branching with **Error Trigger** workflow or node-level “Continue On Fail”.
   - Add a JSON validation step (Code node) between AI outputs and `parseJson()` usage.

**Required credentials/integrations**
- **Port.io API credential** (plus configured AI agents: `context_retriever_agent`, `post_mortem_scheduler_agent`, `metrics_logger_agent`)
- **OpenAI API credential**
- **Slack API credential** (bot token; bot invited to channels)
- **Jira Software Cloud credential** (OAuth2/API token depending on n8n setup)
- **PagerDuty webhook** configured to POST incident events to n8n

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Register for free at Port.io” | https://www.port.io |
| Setup checklist included in the workflow sticky note (Port config, agents, PagerDuty webhook, Jira project, Slack channels, OpenAI creds, test incident) | From the “Incident Lifecycle Management with Port” sticky note |
| Port AI Agent responsibilities: schedule post-mortem meeting, create document, invite stakeholders, link to incident | From the “Port AI Agent” sticky note |

