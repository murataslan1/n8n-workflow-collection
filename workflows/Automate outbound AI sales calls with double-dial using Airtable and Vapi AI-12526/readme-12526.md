Automate outbound AI sales calls with double-dial using Airtable and Vapi AI

https://n8nworkflows.xyz/workflows/automate-outbound-ai-sales-calls-with-double-dial-using-airtable-and-vapi-ai-12526


# Automate outbound AI sales calls with double-dial using Airtable and Vapi AI

## 1. Workflow Overview

**Purpose:** Automate outbound AI qualification calls by pulling “to be called” leads from Airtable, triggering calls via **Vapi AI**, receiving Vapi’s **end-of-call-report** via webhook, categorizing the outcome (answered / voicemail / failed), updating Airtable accordingly, and **retrying** voicemail calls using a “double-dial” style sequence.

**Target use cases:**
- Lead qualification / outbound SDR calls at scale
- Automated retry logic when calls go to voicemail
- Centralized call outcome logging back to Airtable

### 1.1 Outbound Scheduler (Section 1)
- Runs every minute
- Fetches Airtable leads with `Status = 'TBC'` (up to 10)
- Triggers a Vapi call for each lead
- Marks the lead as “In progress”

### 1.2 Results Callback + Classification (Section 2)
- Receives Vapi webhook callback
- Accepts only `type = 'end-of-call-report'`
- Logs recording + transcript (as configured)
- Branches:
  - Answered → mark as `Called`, attempt `#Success`, store summary
  - Not answered → check if voicemail
    - Voicemail → schedule retries (Attempt #2 after 1 minute, Attempt #3 next day at 4pm Sydney time)
    - Not voicemail → mark as `Failed`, store summary
- After voicemail Attempt #3, if still voicemail, mark lead `Voicemail` + `Unreachable`

---

## 2. Block-by-Block Analysis

### Block A — Documentation / Visual Sections (Sticky Notes)
**Overview:** Provides human guidance on setup and describes the two main sections of the canvas.  
**Nodes involved:** `Sticky Note3`, `Sticky Note4`, `Sticky Note5`

#### Node: Sticky Note3
- **Type / role:** Sticky Note (documentation)
- **What it says (important setup):**
  - Poll Airtable every minute for `Status = TBC`
  - Trigger call via Vapi
  - Webhook receives `end-of-call-report`
  - Categorize: Answered / Voicemail / Failed
  - Retry: Attempt #2 after 1 min; Attempt #3 after 24 hours (implemented as next day 4pm Sydney)
  - Airtable fields: `First Name`, `Mobile`, `Status`, `Attempt`, `Summary`
  - Vapi config: set `Assistant ID`, `Phone Number ID`
  - Auth: Header `Authorization: Bearer YOUR_VAPI_KEY`
- **Failure modes:** None (not executed)

#### Node: Sticky Note4
- **Type / role:** Sticky Note section label
- **Content:** “SECTION 1: OUTBOUND SCHEDULER”

#### Node: Sticky Note5
- **Type / role:** Sticky Note section label
- **Content:** “SECTION 2: RESULTS CALLBACK & RETRY LOGIC”

---

### Block B — Outbound Scheduler: Fetch leads and start Vapi calls
**Overview:** Every minute, pulls up to 10 Airtable records with `Status = 'TBC'`, prepares key fields, triggers a Vapi call, then updates the Airtable lead to “In progress”.  
**Nodes involved:** `Schedule Every Minute` → `Fetch TBC Leads` → `Prepare Call Metadata` → `POST: Trigger Vapi Call` → `Update Lead: In Progress`

#### Node: Schedule Every Minute
- **Type / role:** Schedule Trigger (entry point)
- **Config:** Runs every **1 minute**
- **Outputs to:** `Fetch TBC Leads`
- **Failure modes:** None typical; if n8n instance is paused/offline, runs are missed.

#### Node: Fetch TBC Leads
- **Type / role:** Airtable node (search)
- **Config choices:**
  - Operation: **Search**
  - Filter formula: `({Status} ='TBC')`
  - Limit: **10** (since `returnAll` is false)
  - Base/Table: placeholders `YOUR_BASE_ID`, `YOUR_TABLE_ID`
- **Outputs to:** `Prepare Call Metadata`
- **Edge cases / failures:**
  - Airtable auth/permission failures
  - Filter formula mismatch (field name `Status` must exist exactly)
  - Pagination not handled beyond 10 records per minute (intentional limit)

#### Node: Prepare Call Metadata
- **Type / role:** Set node (normalize fields for Vapi request)
- **Config choices (creates fields):**
  - `ID = {{$json.id}}` (Airtable record id)
  - `First Name = {{$json["First Name"]}}`
  - `Mobile = {{$json.Mobile}}`
- **Outputs to:** `POST: Trigger Vapi Call`
- **Edge cases:**
  - Missing `First Name` / `Mobile` fields will produce empty strings and may cause Vapi call failure.
  - Airtable schema mismatch (e.g., field named `Phone` instead of `Mobile`).

#### Node: POST: Trigger Vapi Call
- **Type / role:** HTTP Request (calls Vapi API to initiate a call)
- **Config choices:**
  - Method: **POST**
  - URL: `https://api.vapi.ai/call`
  - JSON body (templated):
    - `assistantId`: `YOUR_ASSISTANT_ID`
    - `customer.name`: `{{$json['First Name']}}`
    - `customer.number`: `{{$json.Mobile}}`
    - `phoneNumberId`: `YOUR_PHONE_ID`
  - Headers: `Authorization: Bearer YOUR_TOKEN_HERE`
- **Outputs to:** `Update Lead: In Progress`
- **Version-specific:** Uses HTTP Request node v4.2 style parameters (`specifyBody: json`)
- **Edge cases / failures:**
  - 401/403 if token invalid
  - 4xx if phone number format invalid (E.164 often required by telephony providers)
  - Missing `phoneNumberId` or wrong assistant ID
  - Rate limits / timeouts from Vapi

#### Node: Update Lead: In Progress
- **Type / role:** Airtable (update)
- **Config choices:**
  - Operation: **Update**
  - Record ID: `={{ $('Prepare Call Metadata').item.json.ID }}`
  - Sets `Status = "In progress"`
- **Input:** from `POST: Trigger Vapi Call`
- **Edge cases / failures:**
  - If the Airtable record ID is not correctly passed, update fails
  - Airtable auth/permissions
  - Potential race: lead could be changed by another process between fetch and update

---

### Block C — Webhook reception + validate event type
**Overview:** Receives Vapi callback events, then only continues if it’s an `end-of-call-report`.  
**Nodes involved:** `Vapi Callback Webhook` → `Is End Report?` → `Log Raw Call Data`

#### Node: Vapi Callback Webhook
- **Type / role:** Webhook Trigger (entry point for callbacks)
- **Config:**
  - Path: `POST /vapi-callback`
  - Method: POST
- **Outputs to:** `Is End Report?`
- **Edge cases / failures:**
  - Public URL must be reachable from Vapi
  - Vapi may retry callbacks; without idempotency controls you can process duplicates
  - No signature verification is configured (anyone who knows the URL could post)

#### Node: Is End Report?
- **Type / role:** IF node (filter callback type)
- **Condition:**
  - `{{$json.body.message.type}} == "end-of-call-report"`
- **True output connects to:** `Log Raw Call Data`
- **False output:** not connected (events are dropped)
- **Edge cases:**
  - If Vapi payload differs (path changes, field missing), condition errors or evaluates false.

#### Node: Log Raw Call Data
- **Type / role:** Airtable (create) — intended to store recording/transcript (but configuration is inconsistent)
- **Config as given:**
  - Operation: **Create**
  - Attempts to set:
    - `id = {{$json.body.message.call.id}}`
    - `recording = {{$json.body.message.recordingUrl}}`
    - `transcript = {{$json.body.message.transcript}}`
- **Outputs to:** `Filter: Was Answered?`
- **Important warning / likely design issue:**
  - Airtable “Create” does **not** accept setting the Airtable **record id** via an `id` field; `id` is typically the Airtable internal record identifier returned by Airtable, not a normal column.
  - If your table has a column literally named `id`, it could work—but then later nodes assume `$json.id` is the Airtable record id. This mismatch is a common failure point.
- **Edge cases / failures:**
  - If Airtable table doesn’t have fields `recording` and `transcript`, creation fails.
  - Duplicate creates for the same call (if webhook retries) will create multiple rows.

---

### Block D — Outcome classification: answered vs not answered; voicemail vs failed
**Overview:** Determines call outcome and routes to Airtable updates and/or retry logic.  
**Nodes involved:** `Filter: Was Answered?` → (`Get Lead ID #1` OR `Check: Is Voicemail?`) → (`Get Lead ID #2` / `Get Lead ID #3`)

#### Node: Filter: Was Answered?
- **Type / role:** IF node (answered vs no-answer)
- **Condition (as configured):**
  - `{{$json.fields['ended reason']}} != "customer-did-not-answer"`
- **True output →** `Get Lead ID #1` (treated as “answered” path)
- **False output →** `Check: Is Voicemail?`
- **Major inconsistency / likely bug:**
  - Upstream payload is Vapi webhook; the workflow earlier references `endedReason` at `body.message.endedReason`.
  - This node checks `$json.fields['ended reason']` which looks like an Airtable record shape, not the Vapi webhook.
  - Unless `Log Raw Call Data` outputs an object with `fields['ended reason']`, this will fail or always route incorrectly.
- **Edge cases:**
  - Expression error if `fields` undefined.
  - Vapi ended reasons are usually in `endedReason` or similar; confirm actual payload.

#### Node: Check: Is Voicemail?
- **Type / role:** IF node (voicemail vs other failure)
- **Condition:**
  - `{{ $('Is End Report?').item.json.body.message.endedReason }} == "voicemail"`
- **True output →** `Get Lead ID #2` (voicemail retry path)
- **False output →** `Get Lead ID #3` (failed path)
- **Edge cases:**
  - If endedReason missing, evaluates false and marks as failed.

#### Node: Get Lead ID #1
- **Type / role:** Airtable (search) — locate lead record by phone number
- **Config:**
  - Operation: Search
  - Formula: `=({Mobile} = '{{ $("Is End Report?").item.json.body.message.call.customer.number }}')`
- **Outputs to:** `Update: Call Connected`
- **Edge cases:**
  - If multiple leads share the same Mobile, you may update the wrong one or multiple results (n8n will output multiple items).
  - Phone formatting must match exactly (spaces, +country code).

#### Node: Get Lead ID #2
- **Type / role:** Airtable (search) — same lookup for voicemail branch
- **Config:** same Mobile formula as above
- **Outputs to:** `If First Call`
- **Edge cases:** same as Get Lead ID #1

#### Node: Get Lead ID #3
- **Type / role:** Airtable (search) — same lookup for failed branch
- **Config:** same Mobile formula as above
- **Outputs to:** `Update: Call Failed`
- **Edge cases:** same as Get Lead ID #1

---

### Block E — Final updates: success or failure
**Overview:** Updates the lead record in Airtable with final status and summary for answered/failed outcomes.  
**Nodes involved:** `Update: Call Connected`, `Update: Call Failed`

#### Node: Update: Call Connected
- **Type / role:** Airtable (update)
- **Config:**
  - Sets:
    - `id = {{$json.id}}`
    - `Status = "Called"`
    - `Attempt = "#Success"`
    - `Summary = {{ $('Is End Report?').item.json.body.message.analysis.summary }}`
- **Input:** from `Get Lead ID #1`
- **Edge cases / failures:**
  - `$json.id` must be the Airtable record id from the search output. If Airtable node returns differently (or returns multiple), updates may fail or partially update.
  - `analysis.summary` may not exist for all Vapi configurations.

#### Node: Update: Call Failed
- **Type / role:** Airtable (update)
- **Config:**
  - Sets:
    - `id = {{$json.id}}`
    - `Status = "Failed"`
    - `Summary = {{ $('Is End Report?').item.json.body.message.analysis.summary }}`
- **Input:** from `Get Lead ID #3`
- **Edge cases:** same as above.

---

### Block F — Voicemail retry ladder (Attempt #1 → wait 1 min → Attempt #2 → next day 4pm → Attempt #3 → unreachable)
**Overview:** If voicemail is detected, the workflow decides which attempt it is and schedules the next call. It records attempt markers in Airtable and triggers subsequent Vapi calls.  
**Nodes involved:** `If First Call` → `If Second Call` → `If Third Call` plus `Log: Voicemail Attempt 1/2/3`, `Wait: 1 Minute`, `Wait: Next Day 4pm`, `Retry: Call #2`, `Retry: Call #3`, `Update: Lead Unreachable`

#### Node: If First Call
- **Type / role:** IF node (detect attempt state)
- **Condition:** `{{$json.Attempt}}` **does not exist**
- **True output →** `Log: Voicemail Attempt 1`
- **False output →** `If Second Call`
- **Edge cases:**
  - Airtable search results usually present fields under `$json.fields.Attempt`, not `$json.Attempt`. If so, condition will misbehave.

#### Node: If Second Call
- **Type / role:** IF node
- **Condition:** `{{$json.Attempt}} == "#1"`
- **True output →** `Log: Voicemail Attempt 1` (this looks incorrect—should likely log Attempt 2)
- **False output →** `If Third Call`
- **Likely logic bug:** The “true” branch logs voicemail attempt **1** again, not attempt 2.

#### Node: If Third Call
- **Type / role:** IF node
- **Condition:** `{{$json.Attempt}} == "#2"`
- **True output →** `Wait: Next Day 4pm`
- **False output →** `Update: Lead Unreachable`
- **Interpretation:** If already at Attempt #2, schedule Attempt #3 next day; otherwise mark unreachable (meaning if Attempt is something else like #3 or “Unreachable”)

#### Node: Log: Voicemail Attempt 1
- **Type / role:** Airtable (update)
- **Config:** sets `Status = "Voicemail"`, `Attempt = "#1"`, record `id = {{$json.id}}`
- **Outputs to:** `Wait: 1 Minute`
- **Edge cases:** same record-id issues as other updates.

#### Node: Wait: 1 Minute
- **Type / role:** Wait node (delay)
- **Config:** wait **1 minute**
- **Outputs to:** `Retry: Call #2`
- **Edge cases:**
  - Wait nodes store execution state; if n8n restarts without persistent execution data, resumes can fail (depends on n8n settings).
  - Concurrency: many leads could create many waiting executions.

#### Node: Retry: Call #2
- **Type / role:** HTTP Request (Vapi call)
- **Config:**
  - POST `https://api.vapi.ai/call`
  - Body uses:
    - `assistantId: "YOUR_ID"`
    - `customer.name: {{ $json.fields['First Name'] }}`
    - `customer.number: {{ $json.fields.Mobile }}`
  - **No Authorization header shown** (unlike the first call node), so it may fail unless credentials/headers are set globally elsewhere.
- **Outputs to:** `Log: Voicemail Attempt 2`
- **Edge cases:**
  - Missing auth header → 401
  - Inconsistent field paths (`$json.fields...`) vs earlier nodes (`$json.First Name` / `$json.Mobile`)

#### Node: Log: Voicemail Attempt 2
- **Type / role:** Airtable (update)
- **Config:** sets `Status = "Voicemail"`, `Attempt = "#2"`
- **End:** no further connection from this node (the next scheduling is handled when the next webhook arrives)

#### Node: Wait: Next Day 4pm
- **Type / role:** Wait node (resume at specific time)
- **Config:** `={{ $now.plus(1, "day").setZone("Australia/Sydney").set({ hour: 16, minute: 0 }).toISO() }}`
- **Outputs to:** `Retry: Call #3`
- **Edge cases:**
  - Timezone correctness depends on n8n’s Luxon support (works in standard n8n expressions).
  - If it’s already past 4pm, it still schedules next day at 4pm (by design).

#### Node: Retry: Call #3
- **Type / role:** HTTP Request (Vapi call)
- **Config:**
  - POST `https://api.vapi.ai/call`
  - Body uses:
    - `assistantId: "YOUR_ID"`
    - `customer.name: {{ $json['First Name'] }}`
    - `customer.number: {{ $json.Mobile }}`
  - **No Authorization header shown** (risk of 401)
- **Outputs to:** `Log: Voicemail Attempt 3`
- **Edge cases:** similar to Retry #2 plus field-path mismatch.

#### Node: Log: Voicemail Attempt 3
- **Type / role:** Airtable (update)
- **Config:** sets `Status = "Voicemail"`, `Attempt = "#3"`
- **End:** not connected further.

#### Node: Update: Lead Unreachable
- **Type / role:** Airtable (update)
- **Config:** sets `Status = "Voicemail"`, `Attempt = "Unreachable"`
- **Input:** from `If Third Call` false branch
- **Edge cases:** record id issues.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Sticky Note3 | Sticky Note | Explains operation + setup requirements | — | — | ### How it works… Credentials/Header Auth details for Vapi; Airtable required fields. |
| Sticky Note4 | Sticky Note | Section label (Outbound scheduler) | — | — | ## SECTION 1: OUTBOUND SCHEDULER |
| Sticky Note5 | Sticky Note | Section label (Callback & retry logic) | — | — | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Schedule Every Minute | Schedule Trigger | Periodic trigger to start outbound calls | — | Fetch TBC Leads | ## SECTION 1: OUTBOUND SCHEDULER |
| Fetch TBC Leads | Airtable | Search leads where Status = TBC | Schedule Every Minute | Prepare Call Metadata | ## SECTION 1: OUTBOUND SCHEDULER |
| Prepare Call Metadata | Set | Normalize lead fields for call | Fetch TBC Leads | POST: Trigger Vapi Call | ## SECTION 1: OUTBOUND SCHEDULER |
| POST: Trigger Vapi Call | HTTP Request | Start Vapi call | Prepare Call Metadata | Update Lead: In Progress | ## SECTION 1: OUTBOUND SCHEDULER |
| Update Lead: In Progress | Airtable | Mark lead “In progress” | POST: Trigger Vapi Call | — | ## SECTION 1: OUTBOUND SCHEDULER |
| Vapi Callback Webhook | Webhook | Receive Vapi callback | — | Is End Report? | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Is End Report? | IF | Filter only end-of-call-report | Vapi Callback Webhook | Log Raw Call Data | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Log Raw Call Data | Airtable | Create/log recording + transcript (config inconsistent) | Is End Report? | Filter: Was Answered? | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Filter: Was Answered? | IF | Decide answered vs not answered (field path likely wrong) | Log Raw Call Data | Get Lead ID #1; Check: Is Voicemail? | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Get Lead ID #1 | Airtable | Find lead by Mobile for “answered” branch | Filter: Was Answered? (true) | Update: Call Connected | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Update: Call Connected | Airtable | Update lead to Called/#Success + summary | Get Lead ID #1 | — | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Check: Is Voicemail? | IF | If not answered, check voicemail | Filter: Was Answered? (false) | Get Lead ID #2; Get Lead ID #3 | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Get Lead ID #2 | Airtable | Find lead by Mobile for voicemail branch | Check: Is Voicemail? (true) | If First Call | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| If First Call | IF | Determine attempt state (missing Attempt) | Get Lead ID #2 | Log: Voicemail Attempt 1; If Second Call | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| If Second Call | IF | Check if Attempt == #1 (routes incorrectly to attempt 1 log) | If First Call (false) | Log: Voicemail Attempt 1; If Third Call | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| If Third Call | IF | Check if Attempt == #2 | If Second Call (false) | Wait: Next Day 4pm; Update: Lead Unreachable | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Log: Voicemail Attempt 1 | Airtable | Update lead Status Voicemail + Attempt #1 | If First Call (true) / If Second Call (true) | Wait: 1 Minute | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Wait: 1 Minute | Wait | Delay before retry #2 | Log: Voicemail Attempt 1 | Retry: Call #2 | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Retry: Call #2 | HTTP Request | Initiate second Vapi call (auth header missing in node) | Wait: 1 Minute | Log: Voicemail Attempt 2 | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Log: Voicemail Attempt 2 | Airtable | Update lead Attempt #2 | Retry: Call #2 | — | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Wait: Next Day 4pm | Wait | Schedule retry #3 at next day 4pm Sydney | If Third Call (true) | Retry: Call #3 | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Retry: Call #3 | HTTP Request | Initiate third Vapi call (auth header missing in node) | Wait: Next Day 4pm | Log: Voicemail Attempt 3 | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Log: Voicemail Attempt 3 | Airtable | Update lead Attempt #3 | Retry: Call #3 | — | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Update: Lead Unreachable | Airtable | Mark voicemail lead unreachable | If Third Call (false) | — | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Get Lead ID #3 | Airtable | Find lead by Mobile for failed branch | Check: Is Voicemail? (false) | Update: Call Failed | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |
| Update: Call Failed | Airtable | Update lead to Failed + summary | Get Lead ID #3 | — | ## SECTION 2: RESULTS CALLBACK & RETRY LOGIC |

---

## 4. Reproducing the Workflow from Scratch

1) **Create Airtable base/table**
   - Base: your choice
   - Table must include (at minimum): `First Name` (text), `Mobile` (text/phone), `Status` (single select/text), `Attempt` (text), `Summary` (long text)
   - Optional fields referenced by nodes: `recording`, `transcript`

2) **Create node: “Schedule Every Minute” (Schedule Trigger)**
   - Interval: every **1 minute**

3) **Create node: “Fetch TBC Leads” (Airtable → Search)**
   - Credentials: Airtable personal access token (or Airtable OAuth) with access to base
   - Base: `YOUR_BASE_ID`
   - Table: `YOUR_TABLE_ID`
   - Filter formula: `({Status} ='TBC')`
   - Limit: 10

4) **Create node: “Prepare Call Metadata” (Set)**
   - Add fields:
     - `ID` = `{{$json.id}}`
     - `First Name` = `{{$json["First Name"]}}`
     - `Mobile` = `{{$json.Mobile}}`

5) **Create node: “POST: Trigger Vapi Call” (HTTP Request)**
   - Method: POST
   - URL: `https://api.vapi.ai/call`
   - Body type: JSON
   - JSON body:
     - `assistantId`: your Vapi assistant id
     - `customer.name`: expression `{{$json['First Name']}}`
     - `customer.number`: expression `{{$json.Mobile}}`
     - `phoneNumberId`: your Vapi phone number id
   - Header:
     - `Authorization` = `Bearer <YOUR_VAPI_KEY>`
   - (Recommended) also set `Content-Type: application/json` if not automatic.

6) **Create node: “Update Lead: In Progress” (Airtable → Update)**
   - Record ID: `={{ $('Prepare Call Metadata').item.json.ID }}`
   - Set `Status` to `In progress`

7) **Connect Section 1**
   - `Schedule Every Minute` → `Fetch TBC Leads` → `Prepare Call Metadata` → `POST: Trigger Vapi Call` → `Update Lead: In Progress`

8) **Create node: “Vapi Callback Webhook” (Webhook)**
   - Method: POST
   - Path: `vapi-callback`
   - Copy the production webhook URL into Vapi callback configuration (in Vapi, configure the assistant/call webhook destination as appropriate).

9) **Create node: “Is End Report?” (IF)**
   - Condition: `{{$json.body.message.type}}` equals `end-of-call-report`
   - Connect `Vapi Callback Webhook` → `Is End Report?` (true branch onward)

10) **Create node: “Log Raw Call Data” (Airtable)**
   - As in the workflow: operation “Create” with fields for recording/transcript
   - Strongly recommended adjustment for reproducibility:
     - Use **Update** instead of Create, after looking up the lead by phone (or store `call.id` in a dedicated column), to avoid duplicating rows and to ensure you update the correct lead record.
   - If you keep “Create”, ensure your table has columns that match the names you set (e.g., `recording`, `transcript`) and do not assume `id` maps to Airtable record id.

11) **Create node: “Filter: Was Answered?” (IF)**
   - Replicate current condition (but expect to fix it):
     - Not equals: `{{$json.fields['ended reason']}}` vs `customer-did-not-answer`
   - Recommended fix (if using Vapi payload directly):
     - Check: `{{ $('Is End Report?').item.json.body.message.endedReason }}` not equals `customer-did-not-answer`

12) **Create node: “Check: Is Voicemail?” (IF)**
   - Condition: `{{ $('Is End Report?').item.json.body.message.endedReason }}` equals `voicemail`

13) **Create 3 Airtable search nodes to locate the lead by Mobile**
   - `Get Lead ID #1`, `Get Lead ID #2`, `Get Lead ID #3`
   - Operation: Search
   - Formula (all three):  
     `=({Mobile} = '{{ $("Is End Report?").item.json.body.message.call.customer.number }}')`

14) **Create nodes for final status updates**
   - `Update: Call Connected` (Airtable Update)
     - Record id: `{{$json.id}}` (from Airtable search result)
     - Set `Status=Called`, `Attempt=#Success`, `Summary={{ $('Is End Report?').item.json.body.message.analysis.summary }}`
   - `Update: Call Failed` (Airtable Update)
     - Record id: `{{$json.id}}`
     - Set `Status=Failed`, `Summary=...`

15) **Create voicemail attempt branching**
   - `If First Call` (IF): `{{$json.Attempt}}` not exists (recommended: use `$json.fields.Attempt`)
   - `If Second Call` (IF): Attempt equals `#1`
   - `If Third Call` (IF): Attempt equals `#2`

16) **Create voicemail attempt update nodes**
   - `Log: Voicemail Attempt 1` (Airtable Update): `Status=Voicemail`, `Attempt=#1`
   - `Log: Voicemail Attempt 2` (Airtable Update): `Status=Voicemail`, `Attempt=#2`
   - `Log: Voicemail Attempt 3` (Airtable Update): `Status=Voicemail`, `Attempt=#3`
   - `Update: Lead Unreachable` (Airtable Update): `Status=Voicemail`, `Attempt=Unreachable`

17) **Create wait + retry call nodes**
   - `Wait: 1 Minute` (Wait): 1 minute
   - `Retry: Call #2` (HTTP Request POST to `https://api.vapi.ai/call`)
     - Ensure you include the same Authorization header as the first call
   - `Wait: Next Day 4pm` (Wait → specific time):
     - `{{$now.plus(1, "day").setZone("Australia/Sydney").set({ hour: 16, minute: 0 }).toISO()}}`
   - `Retry: Call #3` (HTTP Request POST) with Authorization header

18) **Connect Section 2**
   - `Vapi Callback Webhook` → `Is End Report?` → `Log Raw Call Data` → `Filter: Was Answered?`
   - Answered (true) → `Get Lead ID #1` → `Update: Call Connected`
   - Not answered (false) → `Check: Is Voicemail?`
     - Voicemail (true) → `Get Lead ID #2` → `If First Call` → (true) `Log: Voicemail Attempt 1` → `Wait: 1 Minute` → `Retry: Call #2` → `Log: Voicemail Attempt 2`
     - From `If First Call` false → `If Second Call` → (true) currently logs attempt 1 again (recommended: connect to attempt 2 logic instead)
     - Then → `If Third Call` → (true) `Wait: Next Day 4pm` → `Retry: Call #3` → `Log: Voicemail Attempt 3`
     - `If Third Call` false → `Update: Lead Unreachable`
     - Not voicemail (false) → `Get Lead ID #3` → `Update: Call Failed`

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Vapi authentication expected as Header Auth: `Authorization: Bearer YOUR_VAPI_KEY` | Mentioned in Sticky Note3; ensure applied to **all** Vapi HTTP Request nodes (initial + retries). |
| Airtable required fields: `First Name`, `Mobile`, `Status`, `Attempt`, `Summary` | Mentioned in Sticky Note3; workflow expressions assume these exact names. |
| Retry timing: Attempt #2 after 1 minute; Attempt #3 next day at 4pm (Australia/Sydney) | Sticky Note3 describes “24 hours”; implementation uses fixed next-day 4pm Sydney time. |

