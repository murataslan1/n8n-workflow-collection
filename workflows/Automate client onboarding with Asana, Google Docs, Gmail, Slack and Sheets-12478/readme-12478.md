Automate client onboarding with Asana, Google Docs, Gmail, Slack and Sheets

https://n8nworkflows.xyz/workflows/automate-client-onboarding-with-asana--google-docs--gmail--slack-and-sheets-12478


# Automate client onboarding with Asana, Google Docs, Gmail, Slack and Sheets

## Disclaimer (as provided)
Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

# 1. Workflow Overview

**Purpose:** Automate a full client onboarding pipeline for service businesses. When a client submits an intake form, the workflow:
- Parses and normalizes intake data
- Creates a client-specific onboarding project in **Asana** (copying sections/tasks from a template)
- Generates a customized **Google Docs** agreement/contract, exports it as **PDF**
- Sends a welcome email with the PDF via **Gmail**
- Logs the full onboarding data into **Google Sheets**
- Creates a dedicated **Slack** channel for internal coordination

**Target use cases:**
- Agencies and service providers that need consistent onboarding structure
- Teams that require both internal execution (Asana/Slack) and external paperwork (Docs/PDF + email)
- Organizations needing centralized intake tracking (Sheets)

### 1.1 Input Reception & Data Normalization
Receives webhook POST payload and maps 70+ fields into top-level JSON keys for consistent downstream referencing.

### 1.2 Asana Project Setup (Template Copy)
Creates a new Asana project, pulls sections from a template project via Asana API, creates those sections in the new project, then pulls tasks from each template section and adds them to the corresponding new section.

### 1.3 Contract Generation (Google Docs → PDF)
Fetches a Google Docs template, replaces placeholders with client data, downloads the result as PDF.

### 1.4 Client Email (Gmail)
Emails the client a welcome message with the contract PDF attached.

### 1.5 Post-processing: Reset Template + Logging + Slack
Resets the Google Docs template placeholders for the next client, logs intake data to a Google Sheet, and creates a Slack channel.

---

# 2. Block-by-Block Analysis

## Block 1 — Input Reception & Data Processing
**Overview:** Accepts intake form submissions via webhook and standardizes the payload into explicit fields used across Asana/Docs/Gmail/Sheets.

**Nodes involved:**
- Receive Client Form
- Parse Client Data

### Node: Receive Client Form
- **Type / role:** `Webhook` — workflow trigger; receives client intake data.
- **Key configuration:**
  - HTTP Method: **POST**
  - Path: **/client-onboard**
- **Inputs / outputs:**
  - No inputs (trigger).
  - Output to **Parse Client Data**.
- **Version notes:** typeVersion **2.1** (Webhook node behavior differs slightly across versions regarding response handling/options).
- **Edge cases / failures:**
  - Missing/invalid JSON body (expecting `body.*` fields).
  - Intake form not configured to POST to the correct n8n webhook URL.
  - If webhook is used in “test” mode vs “production” URL mismatch.

### Node: Parse Client Data
- **Type / role:** `Set` — flattens and renames incoming `body` fields into top-level keys.
- **Key configuration choices:**
  - Creates many fields such as `legal_business_name`, `brand_name`, `primary_contact_email`, etc.
  - Uses expressions like: `={{ $json.body.primary_contact_email }}`
  - Includes array-typed fields (e.g., `services`, `api_integrations`, `notification_trigger_events`).
- **Inputs / outputs:**
  - Input: webhook payload.
  - Output: to **Create Asana Project**.
- **Version notes:** typeVersion **3.4**.
- **Edge cases / failures:**
  - Any missing `body.<field>` becomes `null`/empty → downstream expressions may break if assumed string/number.
  - Type mismatches: `next_3_months_gfe_forecast` set as **number** here, but later treated like a string in Docs replacements/Sheets schema.
  - If the intake form uses different field names, everything downstream will be blank.

**Sticky note coverage (context):**
- “## 📥 Webhook & Data Processing … parses 70+ fields …”

---

## Block 2 — Asana Project Setup (Template Sections + Tasks)
**Overview:** Builds a new onboarding project in Asana and replicates a standard structure from a template project (sections and tasks).

**Nodes involved:**
- Create Asana Project
- Get Template Sections
- Split Sections
- Loop Through Sections
- Create Section in New Project
- Get Tasks from Template Section
- Add Task to New Project
- Wait for All Tasks

### Node: Create Asana Project
- **Type / role:** `Asana` — creates a new project per client.
- **Configuration choices:**
  - Operation: **Project → Create**
  - Name: `={{ $json.primary_contact_name }} Onboarding`
  - Workspace: `[YOUR_WORKSPACE_ID]` (must be replaced)
  - Team: `[YOUR_TEAM_ID]` (must be replaced)
  - Authentication: **OAuth2**
- **Inputs / outputs:**
  - Input from **Parse Client Data**
  - Output to **Get Template Sections**
- **Edge cases / failures:**
  - Wrong workspace/team IDs → 403/404 errors.
  - OAuth token scopes insufficient (project creation).
  - Name field blank if `primary_contact_name` missing.

### Node: Get Template Sections
- **Type / role:** `HTTP Request` — calls Asana REST API directly to list sections in a template project.
- **Configuration choices:**
  - URL: `https://app.asana.com/api/1.0/projects/[TEMPLATE_PROJECT_ID]/sections`
  - Auth: `predefinedCredentialType` using `asanaOAuth2Api`
- **Inputs / outputs:**
  - Input from **Create Asana Project** (not used directly in URL here)
  - Output to **Split Sections**
- **Version notes:** typeVersion **4.2** (HTTP Request node has evolving auth/body options by version).
- **Edge cases / failures:**
  - Template project ID not replaced → 404.
  - Rate limiting from Asana (429) if many runs.
  - Credential mismatch (using Asana OAuth credential in HTTP node must be properly configured).

### Node: Split Sections
- **Type / role:** `Split Out` — iterates over returned `data[]` array from Asana sections endpoint.
- **Configuration:**
  - Field to split out: `data`
- **Inputs / outputs:**
  - Input from **Get Template Sections**
  - Output items to **Loop Through Sections**
- **Edge cases:**
  - If Asana returns no `data` array (auth failure or changed response), node produces no items.

### Node: Loop Through Sections
- **Type / role:** `Split In Batches` — controls iteration over sections.
- **Configuration choices:**
  - Options left default (batch size not explicitly set).
- **Inputs / outputs:**
  - Input from **Split Sections**
  - Output 1 → **Create Section in New Project**
  - Output 0 → **Wait for All Tasks** (used as the “done” path)
- **Version notes:** typeVersion **3**.
- **Edge cases / failures:**
  - If used without proper looping pattern, can prematurely hit “done” branch.
  - If batch size defaults to 1, it’s fine for sequential creation but can be slow.

### Node: Create Section in New Project
- **Type / role:** `HTTP Request` — creates a section in the newly created Asana project.
- **Configuration choices:**
  - Method: **POST**
  - URL uses new project gid from another node:
    - `https://app.asana.com/api/1.0/projects/{{ $('Create Asana Project').item.json.gid }}/sections`
  - JSON body:
    - `{ "data": { "name": "{{ $json.name }}" } }`
- **Inputs / outputs:**
  - Input from **Loop Through Sections** (each section item from template)
  - Output to **Get Tasks from Template Section**
- **Edge cases / failures:**
  - Expression dependency: if `Create Asana Project` output is missing `gid`, creation fails.
  - If `$json.name` absent (unexpected API response), section name may be blank.

### Node: Get Tasks from Template Section
- **Type / role:** `Asana` — lists tasks in the current template section.
- **Configuration choices:**
  - Operation: **Get All**
  - Filter `section`: `={{ $('Loop Through Sections').item.json.gid }}`
  - Authentication: **OAuth2**
- **Inputs / outputs:**
  - Input from **Create Section in New Project**
  - Output tasks to **Add Task to New Project**
- **Edge cases / failures:**
  - If template section has many tasks, pagination/limits may apply.
  - Using `Loop Through Sections` item reference assumes stable pairing between “created section” and “template section” in the current execution context.

### Node: Add Task to New Project
- **Type / role:** `Asana` — attaches each template task to the new project and places it into the newly created section.
- **Configuration choices:**
  - Resource: **taskProject** (task ↔ project association)
  - Task id: `={{ $json.gid }}`
  - Project: `={{ $('Create Section in New Project').item.json.data.project.gid }}`
  - Additional field `section`: `={{ $('Create Section in New Project').item.json.data.gid }}`
- **Inputs / outputs:**
  - Input: tasks from **Get Tasks from Template Section**
  - Output loops back to **Loop Through Sections** (to continue section batching)
- **Edge cases / failures:**
  - If tasks already belong to another project, Asana “add task to project” is valid, but permissions may differ.
  - If `Create Section in New Project` returns a different response shape (no `data.gid`), section assignment fails.

### Node: Wait for All Tasks
- **Type / role:** `Aggregate` — synchronizes/aggregates before moving to contract generation.
- **Configuration:**
  - Aggregates field `success` (though upstream nodes do not explicitly set `success`).
- **Inputs / outputs:**
  - Input from “done” output of **Loop Through Sections**
  - Output to **Get Contract Template**
- **Edge cases / failures:**
  - If nothing provides `success`, aggregation may produce empty or unexpected output. Practically, it’s being used as a “join” point rather than true success tracking.

**Sticky note coverage (context):**
- “## 📋 Asana Project Setup … copies sections … retrieves tasks … assigns them …”

---

## Block 3 — Contract Generation (Google Docs → PDF)
**Overview:** Personalizes a Google Docs template using replace operations, then downloads the contract as a PDF file.

**Nodes involved:**
- Get Contract Template
- Populate Contract with Client Data
- Download Contract as PDF

### Node: Get Contract Template
- **Type / role:** `Google Docs` — retrieves the template document metadata/content reference.
- **Configuration choices:**
  - Operation: **Get**
  - Document URL/ID: `[YOUR_TEMPLATE_DOCUMENT_ID]` (must be replaced)
  - `simple: false` (indicates non-simplified output)
- **Inputs / outputs:**
  - Input from **Wait for All Tasks**
  - Output to **Populate Contract with Client Data**
- **Edge cases / failures:**
  - Wrong doc ID or no permissions → 404/403.
  - If the doc is not a Google Doc (or shared drive permissions), retrieval fails.

### Node: Populate Contract with Client Data
- **Type / role:** `Google Docs` — performs multiple `replaceAll` actions on the template.
- **Configuration choices:**
  - Operation: **Update**
  - Uses a list of replace actions: replace placeholders like `Client-`, `Title-`, `$(one-time)`, etc.
  - Uses expressions referencing **Parse Client Data**, e.g.:
    - `Client: {{ $('Parse Client Data').item.json.primary_contact_name }}`
    - Fees: `${{ $('Parse Client Data').item.json.terms_fees }}`
    - Dates: `{{ $now.format('DD') }}`
- **Inputs / outputs:**
  - Input from **Get Contract Template**
  - Output to **Download Contract as PDF**
- **Important implementation issue (likely bug):**
  - Several expressions reference fields that do **not** exist in `Parse Client Data`:
    - `payment`, `pharmacy`, `asynchronous`, `synchronous_visit`, `synchronous`
  - If these fields are not present in the webhook payload and not set in “Parse Client Data”, replacements will insert blanks or cause expression errors depending on n8n evaluation.
- **Edge cases / failures:**
  - Placeholder text must match exactly (case/spacing sensitive). If template text differs, nothing is replaced.
  - Concurrent runs: multiple executions modifying the same template doc can collide (especially because the template is later “reset”).

### Node: Download Contract as PDF
- **Type / role:** `Google Drive` — downloads the Google Doc output as a binary file (PDF export by Drive download behavior).
- **Configuration choices:**
  - Operation: **Download**
  - File ID: `={{ $json.documentId }}`
- **Inputs / outputs:**
  - Input from **Populate Contract with Client Data**
  - Output to **Send Welcome Email with Contract**
- **Edge cases / failures:**
  - `documentId` must be present in the incoming item; if Google Docs node outputs a different property name, download fails.
  - Drive download returns binary data; must be attached correctly in Gmail node.

**Sticky note coverage (context):**
- “## 📄 Contract Generation … replaces placeholders … downloads PDF … resets template …”

---

## Block 4 — Email Client (Gmail)
**Overview:** Sends a welcome email to the primary contact, attaching the downloaded contract PDF.

**Nodes involved:**
- Send Welcome Email with Contract

### Node: Send Welcome Email with Contract
- **Type / role:** `Gmail` — sends an email to the client.
- **Configuration choices:**
  - To: `={{ $('Parse Client Data').item.json.primary_contact_email }}`
  - Subject includes contact name.
  - Body is plain text and includes placeholders for links:
    - `[YOUR_CALENDLY_LINK]`, `[YOUR_FORM_LINK]`
  - Attachments UI configured, but the actual binary property is not explicitly mapped in the JSON shown.
- **Inputs / outputs:**
  - Input from **Download Contract as PDF** (binary should come from here)
  - Output to **Reset Template to Blanks**
- **Edge cases / failures:**
  - Attachment may not be included if the node is not configured to reference the correct **binary property name** (commonly `data` or similar).
  - Gmail OAuth scopes must allow sending email + attachments.
  - Invalid email address → Gmail API error/bounce.

**Sticky note coverage (context):**
- “## 📧 Client Communication … sends personalized welcome email … contract attached …”

---

## Block 5 — Reset Template, Logging, and Slack Setup
**Overview:** Resets the Google Docs template back to placeholders, logs client data to a Google Sheet, then creates a Slack channel.

**Nodes involved:**
- Reset Template to Blanks
- Log to Tracking Sheet
- Create Slack Channel

### Node: Reset Template to Blanks
- **Type / role:** `Google Docs` — reverses the replacement operations so the template can be reused.
- **Configuration choices:**
  - Operation: **Update**
  - ReplaceAll actions attempt to replace the filled values back to placeholders.
- **Important implementation issues (likely bugs):**
  - The “text to replace” strings include expressions like:
    - `=Client: {{ $('Parse Client Data').item.json.Client_name }}`
  - But **Parse Client Data** defines `primary_contact_name`, not `Client_name`, plus several other referenced keys (`Title `, `Signature`, `Date`, `onboarding`, `wizlo_platform`) do not exist.
  - This means the reset may not find exact matches and will fail to reset, leaving the template “dirty” for the next run.
- **Concurrency risk:**
  - Using one shared template doc for all executions is prone to race conditions. Two onboardings at the same time can overwrite each other’s contract content and resets.

### Node: Log to Tracking Sheet
- **Type / role:** `Google Sheets` — appends or updates a row with the client’s onboarding data.
- **Configuration choices:**
  - Operation: **Append or Update**
  - Spreadsheet: `[YOUR_TRACKING_SPREADSHEET_ID]` (must be replaced)
  - Sheet: `Sheet1` (gid=0)
  - Matching column: `legal_business_name`
  - A very large column mapping using `={{ $('Parse Client Data').item.json.<field> }}`
- **Inputs / outputs:**
  - Input from **Reset Template to Blanks**
  - Output to **Create Slack Channel**
- **Edge cases / failures:**
  - If `legal_business_name` is missing/empty, append-or-update may misbehave (duplicate rows or failed matching).
  - Data types: arrays (e.g., `services`) may need conversion to string depending on your Sheet formatting.
  - Permissions / shared drive restrictions.
  - “additional_notes” column is mapped to `operations_lead_name` (likely a mapping mistake).

### Node: Create Slack Channel
- **Type / role:** `Slack` — creates/configures a channel for onboarding communication.
- **Configuration choices:**
  - Resource: **channel**
  - `channelId: onboarding` (this appears to reference an existing channel ID/name rather than creating a unique per-client channel)
- **Inputs / outputs:**
  - Input from **Log to Tracking Sheet**
  - No downstream nodes.
- **Edge cases / failures:**
  - If the intention is “create a dedicated channel per client”, this configuration does not do that (it targets `onboarding`).
  - Slack permissions: token must allow channel management.
  - Name collisions if it actually tries to create a channel named `onboarding` repeatedly.

**Sticky note coverage (context):**
- “## 💾 Data Logging & Team Setup … logs to Google Sheets … creates a dedicated Slack channel …”
- “## 🔐 Credentials & Security … Required: Asana OAuth2, Google Docs/Drive/Sheets OAuth2, Gmail OAuth2, Slack API token … Replace IDs …”

---

# 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Workflow Overview | Sticky Note | Documentation / overview |  |  | ## 🚀 Client Onboarding Automation … (setup steps 1–6) |
| Section: Intake | Sticky Note | Documentation / block header |  |  | ## 📥 Webhook & Data Processing … parses 70+ fields … |
| Section: Project | Sticky Note | Documentation / block header |  |  | ## 📋 Asana Project Setup … copies sections … assigns tasks … |
| Section: Contract | Sticky Note | Documentation / block header |  |  | ## 📄 Contract Generation … replaces placeholders … downloads PDF … resets template … |
| Section: Email | Sticky Note | Documentation / block header |  |  | ## 📧 Client Communication … welcome email + contract … |
| Section: Logging | Sticky Note | Documentation / block header |  |  | ## 💾 Data Logging & Team Setup … Sheets + Slack channel … |
| Credentials Note | Sticky Note | Documentation / security |  |  | ## 🔐 Credentials & Security … Replace all template IDs … |
| Receive Client Form | Webhook | Entry point; receives intake POST | — | Parse Client Data | ## 📥 Webhook & Data Processing … |
| Parse Client Data | Set | Normalize/flatten intake data | Receive Client Form | Create Asana Project | ## 📥 Webhook & Data Processing … |
| Create Asana Project | Asana | Create new client onboarding project | Parse Client Data | Get Template Sections | ## 📋 Asana Project Setup … |
| Get Template Sections | HTTP Request | Fetch template project sections (Asana API) | Create Asana Project | Split Sections | ## 📋 Asana Project Setup … |
| Split Sections | Split Out | Split `data[]` sections into items | Get Template Sections | Loop Through Sections | ## 📋 Asana Project Setup … |
| Loop Through Sections | Split In Batches | Iterate sections; join when done | Split Sections; Add Task to New Project | Wait for All Tasks; Create Section in New Project | ## 📋 Asana Project Setup … |
| Create Section in New Project | HTTP Request | Create section in new project | Loop Through Sections | Get Tasks from Template Section | ## 📋 Asana Project Setup … |
| Get Tasks from Template Section | Asana | List tasks in current template section | Create Section in New Project | Add Task to New Project | ## 📋 Asana Project Setup … |
| Add Task to New Project | Asana | Add each task to new project/section | Get Tasks from Template Section | Loop Through Sections | ## 📋 Asana Project Setup … |
| Wait for All Tasks | Aggregate | Synchronization/join before contract | Loop Through Sections (done path) | Get Contract Template | ## 📋 Asana Project Setup … |
| Get Contract Template | Google Docs | Retrieve contract template doc | Wait for All Tasks | Populate Contract with Client Data | ## 📄 Contract Generation … |
| Populate Contract with Client Data | Google Docs | Replace placeholders with client values | Get Contract Template | Download Contract as PDF | ## 📄 Contract Generation … |
| Download Contract as PDF | Google Drive | Download doc as PDF (binary) | Populate Contract with Client Data | Send Welcome Email with Contract | ## 📄 Contract Generation … |
| Send Welcome Email with Contract | Gmail | Email client + attach PDF | Download Contract as PDF | Reset Template to Blanks | ## 📧 Client Communication … |
| Reset Template to Blanks | Google Docs | Revert template placeholders | Send Welcome Email with Contract | Log to Tracking Sheet | ## 📄 Contract Generation … / ## 💾 Data Logging & Team Setup … |
| Log to Tracking Sheet | Google Sheets | Append/update client row | Reset Template to Blanks | Create Slack Channel | ## 💾 Data Logging & Team Setup … |
| Create Slack Channel | Slack | Create/manage onboarding channel | Log to Tracking Sheet | — | ## 💾 Data Logging & Team Setup … / ## 🔐 Credentials & Security … |

---

# 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n.
2. **Add Webhook node** named **Receive Client Form**
   - Method: **POST**
   - Path: `client-onboard`
   - Use the production URL in your intake form tool.
3. **Add Set node** named **Parse Client Data**
   - Add fields mapping from `{{$json.body.<field>}}` to top-level keys (at minimum):
     - `primary_contact_name`, `primary_contact_email`, `primary_contact_role`
     - `legal_business_name`, `brand_name`, `terms_fees`, `status`, etc.
   - Ensure any fields used later in Docs replacements exist here (or update the Docs replacements accordingly).
4. **Connect:** Receive Client Form → Parse Client Data

## Asana project creation and template copy
5. **Add Asana node** named **Create Asana Project**
   - Resource: **Project**
   - Operation: **Create**
   - Name: `{{$json.primary_contact_name}} Onboarding`
   - Workspace: your Asana workspace ID
   - Team: your Asana team ID
   - Credentials: **Asana OAuth2**
6. **Add HTTP Request node** named **Get Template Sections**
   - Method: **GET**
   - URL: `https://app.asana.com/api/1.0/projects/<TEMPLATE_PROJECT_ID>/sections`
   - Authentication: **Asana OAuth2** credential (predefined credential type)
7. **Add Split Out node** named **Split Sections**
   - Field to split out: `data`
8. **Add Split In Batches node** named **Loop Through Sections**
   - Keep default batch settings (or set batch size to 1 for strict ordering).
9. **Add HTTP Request node** named **Create Section in New Project**
   - Method: **POST**
   - URL: `https://app.asana.com/api/1.0/projects/{{ $('Create Asana Project').item.json.gid }}/sections`
   - Body type: **JSON**
   - Body: `{ "data": { "name": "{{ $json.name }}" } }`
   - Authentication: Asana OAuth2 credential
10. **Add Asana node** named **Get Tasks from Template Section**
    - Operation: **Get All** (Tasks)
    - Filter section: `{{ $('Loop Through Sections').item.json.gid }}`
11. **Add Asana node** named **Add Task to New Project**
    - Resource: **Task-Project association** (taskProject)
    - Task ID: `{{$json.gid}}`
    - Project: `{{ $('Create Section in New Project').item.json.data.project.gid }}`
    - Additional field: Section = `{{ $('Create Section in New Project').item.json.data.gid }}`
12. **Add Aggregate node** named **Wait for All Tasks**
    - Use as a join point (you can also replace with a simpler merge/join pattern if desired).
13. **Connect nodes in this order:**
    - Parse Client Data → Create Asana Project → Get Template Sections → Split Sections → Loop Through Sections
    - Loop Through Sections (main output) → Create Section in New Project → Get Tasks from Template Section → Add Task to New Project → back to Loop Through Sections
    - Loop Through Sections (done output) → Wait for All Tasks

## Google Docs contract creation and PDF export
14. **Add Google Docs node** named **Get Contract Template**
    - Operation: **Get**
    - Document: your template document ID/URL
    - Credentials: **Google OAuth2** (Docs)
15. **Add Google Docs node** named **Populate Contract with Client Data**
    - Operation: **Update**
    - Add multiple **Replace All** actions matching your template placeholders (e.g., `Client-` → `Client: <name>`)
    - Ensure every referenced field exists in Parse Client Data.
16. **Add Google Drive node** named **Download Contract as PDF**
    - Operation: **Download**
    - File ID: map from Google Docs output (commonly `documentId`)
    - Credentials: **Google OAuth2** (Drive)

## Email sending with attachment
17. **Add Gmail node** named **Send Welcome Email with Contract**
    - To: `{{ $('Parse Client Data').item.json.primary_contact_email }}`
    - Subject/body: customize; replace `[YOUR_CALENDLY_LINK]` and `[YOUR_FORM_LINK]`
    - Attachments: configure to attach the binary from **Download Contract as PDF** (select the correct binary property).
    - Credentials: **Gmail OAuth2**
18. **Connect:** Wait for All Tasks → Get Contract Template → Populate Contract with Client Data → Download Contract as PDF → Send Welcome Email with Contract

## Reset template, log to Sheets, create Slack channel
19. **Add Google Docs node** named **Reset Template to Blanks**
    - Operation: **Update**
    - Replace the filled text back to placeholders.
    - Prefer stable placeholders (e.g., `{{CLIENT_NAME}}`) to avoid needing exact-match “filled text”.
20. **Add Google Sheets node** named **Log to Tracking Sheet**
    - Operation: **Append or Update**
    - Spreadsheet ID + Sheet tab
    - Matching column: `legal_business_name` (or a unique client ID/email)
    - Map fields from Parse Client Data into columns
    - Credentials: **Google OAuth2** (Sheets)
21. **Add Slack node** named **Create Slack Channel**
    - Configure channel creation (prefer unique name like `onboarding-{{brand_name}}`)
    - Credentials: **Slack API token / OAuth**
22. **Connect:** Send Welcome Email with Contract → Reset Template to Blanks → Log to Tracking Sheet → Create Slack Channel

---

# 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Connect your Asana, Google Docs, Google Drive, Gmail, Google Sheets, and Slack accounts… Update template IDs and workspace references… Test with sample data…” | From sticky note “Workflow Overview” |
| Required credentials: Asana OAuth2, Google Docs/Drive/Sheets OAuth2, Gmail OAuth2, Slack API token. Replace template IDs, workspace numbers, email addresses before publishing. | From sticky note “Credentials & Security” |
| **Concurrency warning:** This design edits a single shared Google Docs template and then resets it. Parallel onboardings can overwrite each other. Consider copying the template per client instead. | Inferred from contract block behavior |
| **Data/field integrity:** Docs “Populate” and “Reset” actions reference fields not present in Parse Client Data; align field names or update expressions/placeholders. | Inferred from node configs |
| **Slack channel behavior:** Node is configured with `channelId: onboarding`, which may not create a per-client channel. | Inferred from Slack node config |