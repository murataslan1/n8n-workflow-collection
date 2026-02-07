Auto-clip long videos into viral short clips with Vizard AI and social publishing

https://n8nworkflows.xyz/workflows/auto-clip-long-videos-into-viral-short-clips-with-vizard-ai-and-social-publishing-12054


# Auto-clip long videos into viral short clips with Vizard AI and social publishing

## 1. Workflow Overview

**Purpose:** This workflow collects a long-form video URL (typically YouTube) and a “viral score threshold”, sends the URL to **Vizard AI** to auto-generate short clips, polls Vizard until processing completes, **filters returned clips by viral score**, then **publishes selected clips** (currently configured as “Post to Tiktok” via Vizard’s publish endpoint) and **logs success/failure** into **Google Sheets**.

**Target use cases:** content creators, social media managers, marketers automating repurposing long videos into short-form content at scale.

### 1.1 Input Reception (Form)
Receives user inputs (video URL + viral score threshold) through an n8n Form trigger.

### 1.2 Configuration / Normalization
Sets and derives configuration variables (API key, URL, language, thresholds) used by downstream nodes.

### 1.3 Vizard Project Creation
Creates a Vizard “clipping project” from the provided video URL.

### 1.4 Polling for Completion
Waits and repeatedly queries the project status until success or failure.

### 1.5 Clip Selection & Publishing
Splits the returned clips, filters by viral score, and publishes the remaining clips.

### 1.6 Logging to Google Sheets
Appends rows to a “Source” sheet for success/failure paths for traceability.

---

## 2. Block-by-Block Analysis

### Block 1 — Input Reception (Form)

**Overview:** Collects the video URL and desired viral threshold from a user-facing form and starts the workflow.

**Nodes involved:**
- **On form submission** (Form Trigger)

**Node details**

#### On form submission
- **Type / role:** `n8n-nodes-base.formTrigger` — Entry point; starts workflow when form is submitted.
- **Configuration (interpreted):**
  - Form title: **“AI Clipper Video”**
  - Fields:
    - **URL Youtube (Bisa di custom mau URL apapun)** (required)
    - **Skor Viral (0-100)** (number, required)
  - Custom CSS applied (dark theme).
  - Submit button label: “Generate Short Video”
- **Outputs:** Form submission data as JSON, e.g.:
  - `$json["URL Youtube (Bisa di custom mau URL apapun)"]`
  - `$json["Skor Viral (0-100)"]`
- **Connections:**
  - Output → **Configuration**
- **Edge cases / failures:**
  - User submits invalid URL format (not validated here).
  - Viral score outside 0–100 (not enforced beyond “number” field).
  - If form is embedded/exposed publicly, abuse/spam submissions can trigger unexpected API usage.

---

### Block 2 — Configuration / Normalization

**Overview:** Central place to set API key and compute reusable parameters like URL, language, and viral threshold.

**Nodes involved:**
- **Configuration** (Set)

**Node details**

#### Configuration
- **Type / role:** `n8n-nodes-base.set` — Creates standardized fields for downstream nodes.
- **Configuration choices:**
  - Sets:
    - `vizard_api_key`: `"API_KEY_HERE"` (placeholder)
    - `video_type`: `"2"` (string)
    - `video_length`: `"[0]"` (string; not used downstream)
    - `video_ratio`: `"1"` (string; not used downstream)
    - `video_url`: expression from the form field  
      `={{ $json['URL Youtube (Bisa di custom mau URL apapun)'] }}`
    - `video_lang`: `"=auto"` (note: stored literally with a leading `=`; not used downstream by AI Clipper node’s expression)
    - `viral_score`: number from form field  
      `={{ $json['Skor Viral (0-100)'] }}`
- **Key expressions / variables:**
  - `$('Configuration').item.json.vizard_api_key` used later in headers.
- **Connections:**
  - Input: **On form submission**
  - Output → **AI Clipper**
- **Edge cases / failures:**
  - Leaving `API_KEY_HERE` unchanged causes Vizard auth failures.
  - Some variables referenced later do **not exist** here (`keywords`, `project_name`) → will evaluate to `undefined` when logging to Sheets.
  - `video_lang` value includes a leading `=`; if used later, could be unintended.

---

### Block 3 — Vizard Project Creation

**Overview:** Calls Vizard AI to create a clipping project for the provided video URL.

**Nodes involved:**
- **AI Clipper** (HTTP Request)
- **Success?** (IF)

**Node details**

#### AI Clipper
- **Type / role:** `n8n-nodes-base.httpRequest` — Creates Vizard project.
- **Request:**
  - **POST** `https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/create`
  - Header: `VIZARDAI_API_KEY: {{$json.vizard_api_key}}`
  - JSON body (hard-coded + expression):
    - `videoUrl`: `{{ $json.video_url }}`
    - `videoType`: `2` (hard-coded; ignores `video_type`)
    - `preferLength`: `[1,2]` (hard-coded; ignores `video_length`)
    - `projectName`: `"test"` (hard-coded; ignores any `project_name`)
    - `lang`: `"auto"` (hard-coded; ignores `video_lang`)
- **Connections:**
  - Input: **Configuration**
  - Output → **Success?**
- **Edge cases / failures:**
  - 401/403 if API key invalid.
  - 400 if `videoUrl` is invalid/unreachable.
  - Timeouts / transient 5xx from Vizard.
  - Response schema changes (node assumes a numeric `code` field and a `projectId` in downstream nodes).

#### Success?
- **Type / role:** `n8n-nodes-base.if` — Branches based on Vizard create response.
- **Condition:** `{{$json.code}} == 2000`
  - True → proceed to polling
  - False → log failure immediately
- **Connections:**
  - **true** → **Wait**
  - **false** → **Append Source (Failed)**
- **Edge cases / failures:**
  - If Vizard returns non-numeric `code` or missing `code`, strict comparison may fail and route to “false”.
  - If response contains error details in a different field than `errMsg`, failure logs may be incomplete.

---

### Block 4 — Polling for Completion

**Overview:** Waits, checks project status, loops until status is success, still processing, or failed.

**Nodes involved:**
- **Wait**
- **Get Status**
- **Check Status** (Switch)

**Node details**

#### Wait
- **Type / role:** `n8n-nodes-base.wait` — Pauses execution before polling again.
- **Configuration:** Default wait configuration (no explicit duration shown in parameters).
  - Despite the sticky note implying “every 5 seconds”, **this node is not configured in JSON with an interval**. In n8n, Wait can be configured in UI; if not, it may wait indefinitely until resumed or until webhook resume is triggered (depending on mode).
- **Connections:**
  - Input: **Success?** (true branch) and **Check Status** (“Processing” branch)
  - Output → **Get Status**
- **Edge cases / failures:**
  - Misconfiguration can cause:
    - immediate continuation (too fast → rate limits),
    - indefinite waiting (workflow appears stuck),
    - accumulation of waiting executions (resource usage).

#### Get Status
- **Type / role:** `n8n-nodes-base.httpRequest` — Queries Vizard project status.
- **Request:**
  - **GET** `https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/query/{{ $json.projectId }}`
  - Header: `VIZARDAI_API_KEY: {{ $('Configuration').item.json.vizard_api_key }}`
- **Dependencies:**
  - Requires `projectId` to be present in current item (from the create response and preserved through loop).
- **Connections:**
  - Output → **Check Status**
- **Edge cases / failures:**
  - If `projectId` missing (e.g., create response changed), URL becomes invalid.
  - Auth errors or 429 rate limits if polled too frequently.
  - Network timeouts.

#### Check Status
- **Type / role:** `n8n-nodes-base.switch` — Routes based on status code.
- **Rules:**
  - Output **Success** if `{{$json.code}} == 2000`
  - Output **Processing** if `{{$json.code}} == 1000`
  - Fallback renamed to **Failed**
- **Connections:**
  - **Success** → **Append Source (Success)** AND **Split Clips** (parallel fan-out)
  - **Processing** → **Wait** (loop)
  - **Failed** → **Append Source (Failed) 2**
- **Edge cases / failures:**
  - If Vizard uses other “processing” codes, these will fall into “Failed”.
  - If response doesn’t include expected `videos` field on success, downstream Split will fail.

---

### Block 5 — Clip Selection & Publishing

**Overview:** On successful processing, splits returned clips into items, filters by viral score threshold, and publishes each passing clip.

**Nodes involved:**
- **Split Clips**
- **Filter by Viral Score**
- **Post to Tiktok**

**Node details**

#### Split Clips
- **Type / role:** `n8n-nodes-base.splitOut` — Converts an array of clips into one item per clip.
- **Configuration:** Split out field `videos`
- **Connections:**
  - Input: **Check Status** (Success branch)
  - Output → **Filter by Viral Score**
- **Edge cases / failures:**
  - If `videos` is missing, not an array, or empty → no items or error.
  - If clip objects don’t include fields expected later (e.g., `viralScore`, `videoId`) filtering/publishing fails.

#### Filter by Viral Score
- **Type / role:** `n8n-nodes-base.filter` — Keeps only clips meeting threshold.
- **Condition:** `{{$json.viralScore}} >= {{ $('Configuration').item.json.viral_score }}`
- **Connections:**
  - Output → **Post to Tiktok**
- **Edge cases / failures:**
  - If `viralScore` is string/null, loose validation is enabled, but comparisons may be inconsistent.
  - If user sets threshold too high, no clips pass → publishing step receives zero items.

#### Post to Tiktok
- **Type / role:** `n8n-nodes-base.httpRequest` — Calls Vizard publish endpoint for each clip.
- **Request:**
  - **POST** `https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/publish`
  - Header: `VIZARDAI_API_KEY: {{ $('Configuration').item.json.vizard_api_key }}`
  - Body parameter: `finalVideoId = {{ $json.videoId }}`
- **Connections:**
  - Input: **Filter by Viral Score**
  - Output: none (end of this branch)
- **Edge cases / failures:**
  - Missing/invalid `videoId` causes publish failure.
  - “Publish to TikTok” here is via Vizard’s API; if Vizard requires connected social accounts, publishing can fail server-side.
  - No retry/backoff is implemented; transient failures will stop that item unless workflow error settings are adjusted.

---

### Block 6 — Logging to Google Sheets

**Overview:** Appends a row to Google Sheets for success or failure. Success is logged upon completion; failures are logged either after create-project failure or status-query failure.

**Nodes involved:**
- **Append Source (Success)**
- **Append Source (Failed)**
- **Append Source (Failed) 2**

**Node details**

#### Append Source (Success)
- **Type / role:** `n8n-nodes-base.googleSheets` — Append a “Success” record.
- **Operation:** Append row into Spreadsheet “Auto Clipping Video with Vizard AI”, sheet “Source” (gid=0).
- **Columns written (defined mapping):**
  - Status = `"Success"`
  - Keywords = `{{ $('Configuration').item.json.keywords }}` (**not set anywhere**)
  - Language = `{{ $('Configuration').item.json.video_lang }}` (currently `"=auto"`)
  - Project ID = `{{ $json.projectId }}`
  - Source URL = `{{ $('Configuration').item.json.video_url }}`
  - Project Name = `{{ $('Configuration').item.json.project_name }}` (**not set anywhere**)
- **Credentials:** Google Sheets OAuth2 credential required.
- **Connections:**
  - Input: **Check Status** (Success)
  - Output: none
- **Edge cases / failures:**
  - Missing spreadsheet access / OAuth expired.
  - Column mapping mismatches if sheet headers differ.
  - `keywords` and `project_name` will be appended as blank/undefined unless added upstream.

#### Append Source (Failed)
- **Type / role:** Google Sheets append — logs create-project failure (from **Success?** false branch).
- **Columns written:**
  - Status = `"Failed"`
  - Keywords = `{{ $('Configuration').item.json.keywords }}` (**missing**)
  - Language = `{{ $('Configuration').item.json.video_lang }}`
  - Source URL = `{{ $('Configuration').item.json.video_url }}`
  - Error Message = `{{ $json.errMsg }}`
  - (Project Name / Project ID columns are marked removed in schema for this node)
- **Connections:**
  - Input: **Success?** (false)
- **Edge cases / failures:**
  - If error field isn’t `errMsg`, the logged message may be empty.

#### Append Source (Failed) 2
- **Type / role:** Google Sheets append — logs status-query failure (from **Check Status** fallback).
- **Columns written:**
  - Status = `"Failed"`
  - Keywords = `{{ $('Configuration').item.json.keywords }}` (**missing**)
  - Language = `{{ $('Configuration').item.json.video_lang }}`
  - Project ID = `{{ $json.projectId }}`
  - Source URL = `{{ $('Configuration').item.json.video_url }}`
  - Project Name = `{{ $('Configuration').item.json.project_name }}` (**missing**)
  - Error Message = `{{ $json.errMsg }}`
- **Connections:**
  - Input: **Check Status** (Failed)
- **Edge cases / failures:**
  - If failure response doesn’t include `projectId` or `errMsg`, those cells will be blank.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| On form submission | Form Trigger | Collect URL + viral threshold | — | Configuration | ## Auto-clip long videos into viral short clips using Vizard AI\n\nThis workflow turns long-form YouTube or video URLs into short, high-viral-potential clips, then automatically publishes them to social platforms and logs results in Google Sheets.\n\n## Who’s it for?\nContent creators, social media managers, and marketers who want to scale short-form video production automatically.\n\n## How it works\n1. Collect a video URL and viral score via form or schedule.\n2. Create a clipping project in Vizard AI.\n3. Poll project status until processing is complete.\n4. Filter clips by viral score and limit quantity.\n5. Publish selected clips and log results to Google Sheets.\n\n## How to set up\nConnect Vizard AI, Google Sheets, and social credentials. Configure thresholds and limits in the Set Configuration node, then activate the workflow. |
| Configuration | Set | Store API key and derived parameters | On form submission | AI Clipper | ## Put your Vizard AI API Key Here |
| AI Clipper | HTTP Request | Create Vizard clipping project | Configuration | Success? | ## Video Generation Logic using Vizard AI\nIt calls Vizard AI to generate the short clips and for every 5 seconds it will check \nif the process succeeded or fail |
| Success? | IF | Branch on create-project response | AI Clipper | Wait; Append Source (Failed)  | ## Video Generation Logic using Vizard AI\nIt calls Vizard AI to generate the short clips and for every 5 seconds it will check \nif the process succeeded or fail |
| Wait | Wait | Pause between polls | Success?; Check Status (Processing) | Get Status | ## Video Generation Logic using Vizard AI\nIt calls Vizard AI to generate the short clips and for every 5 seconds it will check \nif the process succeeded or fail |
| Get Status | HTTP Request | Query Vizard project status | Wait | Check Status | ## Video Generation Logic using Vizard AI\nIt calls Vizard AI to generate the short clips and for every 5 seconds it will check \nif the process succeeded or fail |
| Check Status | Switch | Route success/processing/failure | Get Status | Append Source (Success); Split Clips; Wait; Append Source (Failed) 2 | ## Video Generation Logic using Vizard AI\nIt calls Vizard AI to generate the short clips and for every 5 seconds it will check \nif the process succeeded or fail |
| Split Clips | Split Out | One item per returned clip | Check Status (Success) | Filter by Viral Score | ## Upload to social media (Customizable) |
| Filter by Viral Score | Filter | Keep only clips meeting threshold | Split Clips | Post to Tiktok | ## Upload to social media (Customizable) |
| Post to Tiktok | HTTP Request | Publish clip via Vizard endpoint | Filter by Viral Score | — | ## Upload to social media (Customizable) |
| Append Source (Success) | Google Sheets | Log successful project creation/completion | Check Status (Success) | — | ## Track Everything in Google Sheet |
| Append Source (Failed)  | Google Sheets | Log failure on project creation | Success? (false) | — | ## Track Everything in Google Sheet |
| Append Source (Failed) 2 | Google Sheets | Log failure during status polling | Check Status (Failed) | — | ## Track Everything in Google Sheet |
| Sticky Note | Sticky Note | Comment | — | — |  |
| Sticky Note1 | Sticky Note | Comment | — | — |  |
| Sticky Note2 | Sticky Note | Comment | — | — |  |
| Sticky Note3 | Sticky Note | Comment | — | — |  |
| Sticky Note4 | Sticky Note | Comment | — | — |  |

---

## 4. Reproducing the Workflow from Scratch

1) **Create a new workflow** in n8n.

2) **Add trigger: “On form submission” (Form Trigger)**
   - Form title: `AI Clipper Video`
   - Add fields:
     - Text: `URL Youtube (Bisa di custom mau URL apapun)` (Required)
     - Number: `Skor Viral (0-100)` (Required)
   - Options:
     - Button label: `Generate Short Video`
     - (Optional) paste the provided custom CSS if you want the same styling.

3) **Add “Configuration” (Set node)**
   - Add fields (Assignments):
     - `vizard_api_key` (String): put your Vizard key
     - `video_url` (String, expression):  
       `{{ $json['URL Youtube (Bisa di custom mau URL apapun)'] }}`
     - `viral_score` (Number, expression):  
       `{{ $json['Skor Viral (0-100)'] }}`
     - (Optional but recommended to avoid blanks in Sheets)
       - `project_name` (String) e.g. `={{$json['URL Youtube (Bisa di custom mau URL apapun)']}}` or a custom name
       - `keywords` (String) e.g. empty or derived from user input
     - (If you want language): `video_lang` (String) set to `auto` (without a leading `=`).
   - Connect: **On form submission → Configuration**

4) **Add “AI Clipper” (HTTP Request)**
   - Method: `POST`
   - URL: `https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/create`
   - Headers:
     - `VIZARDAI_API_KEY`: `{{ $json.vizard_api_key }}`
   - Body type: JSON
   - JSON body (as configured in the workflow):
     - `videoUrl`: `{{ $json.video_url }}`
     - `videoType`: `2`
     - `preferLength`: `[1,2]`
     - `projectName`: `test` (or use `{{ $json.project_name }}`)
     - `lang`: `auto`
   - Connect: **Configuration → AI Clipper**

5) **Add “Success?” (IF node)**
   - Condition: Number equals
     - Left: `{{ $json.code }}`
     - Right: `2000`
   - Connect: **AI Clipper → Success?**

6) **Add “Append Source (Failed)” (Google Sheets)**
   - Credentials: Google Sheets OAuth2
   - Operation: Append
   - Document: your spreadsheet
   - Sheet: `Source`
   - Map columns similar to:
     - Status = `Failed`
     - Source URL = `{{ $('Configuration').item.json.video_url }}`
     - Language = `{{ $('Configuration').item.json.video_lang }}`
     - Keywords = `{{ $('Configuration').item.json.keywords }}`
     - Error Message = `{{ $json.errMsg }}`
   - Connect: **Success? (false) → Append Source (Failed)**

7) **Add “Wait” (Wait node)**
   - Configure an actual polling delay (recommended):
     - Wait for: e.g. **5 seconds** (or 10–30 seconds to reduce rate limits)
   - Connect: **Success? (true) → Wait**

8) **Add “Get Status” (HTTP Request)**
   - Method: `GET`
   - URL: `https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/query/{{ $json.projectId }}`
   - Headers:
     - `VIZARDAI_API_KEY`: `{{ $('Configuration').item.json.vizard_api_key }}`
   - Connect: **Wait → Get Status**

9) **Add “Check Status” (Switch node)**
   - Rule 1 (rename output “Success”): `{{ $json.code }}` equals `2000`
   - Rule 2 (rename output “Processing”): `{{ $json.code }}` equals `1000`
   - Fallback output name: “Failed”
   - Connect: **Get Status → Check Status**
   - Loop connection: **Check Status (Processing) → Wait**

10) **Add “Append Source (Success)” (Google Sheets)**
   - Operation: Append to same sheet
   - Map:
     - Status = `Success`
     - Project ID = `{{ $json.projectId }}`
     - Source URL = `{{ $('Configuration').item.json.video_url }}`
     - Project Name = `{{ $('Configuration').item.json.project_name }}`
     - Language = `{{ $('Configuration').item.json.video_lang }}`
     - Keywords = `{{ $('Configuration').item.json.keywords }}`
   - Connect: **Check Status (Success) → Append Source (Success)**

11) **Add “Append Source (Failed) 2” (Google Sheets)**
   - Append row for failures during query/polling
   - Map similar fields + `Error Message = {{ $json.errMsg }}`
   - Connect: **Check Status (Failed) → Append Source (Failed) 2**

12) **Add “Split Clips” (Split Out node)**
   - Field to split out: `videos`
   - Connect: **Check Status (Success) → Split Clips**
     - (This runs in parallel with the success logging, matching the provided workflow.)

13) **Add “Filter by Viral Score” (Filter node)**
   - Condition: `{{ $json.viralScore }}` **gte** `{{ $('Configuration').item.json.viral_score }}`
   - Connect: **Split Clips → Filter by Viral Score**

14) **Add “Post to Tiktok” (HTTP Request)**
   - Method: `POST`
   - URL: `https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/publish`
   - Headers:
     - `VIZARDAI_API_KEY`: `{{ $('Configuration').item.json.vizard_api_key }}`
   - Body (form/body parameters):
     - `finalVideoId`: `{{ $json.videoId }}`
   - Connect: **Filter by Viral Score → Post to Tiktok**

15) **Activate workflow** after credentials are valid and sheets are accessible.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Auto-clip long videos into viral short clips using Vizard AI… publish selected clips and log results in Google Sheets.” | Sticky note describing end-to-end intent (overview) |
| “Video Generation Logic using Vizard AI… for every 5 seconds it will check if the process succeeded or fail” | Polling block note; ensure the Wait node is actually configured to 5 seconds in UI |
| “Track Everything in Google Sheet” | Logging block note |
| “Upload to social media (Customizable)” | Publishing block note; can be extended to other platforms by adding/branching publish nodes |
| “Put your Vizard AI API Key Here” | Configuration note; replace placeholder with real Vizard API key |

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.