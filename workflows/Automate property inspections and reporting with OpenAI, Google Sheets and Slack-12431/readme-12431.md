Automate property inspections and reporting with OpenAI, Google Sheets and Slack

https://n8nworkflows.xyz/workflows/automate-property-inspections-and-reporting-with-openai--google-sheets-and-slack-12431


# Automate property inspections and reporting with OpenAI, Google Sheets and Slack

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Automate property inspections and reporting with OpenAI, Google Sheets and Slack  
**Workflow Name (n8n):** Property Inspection & Reporting Automation

This workflow automates recurring property inspections for property management teams. It (1) schedules inspections, (2) retrieves property/tenant data, (3) uses OpenAI to generate inspection checklists and emails them to inspectors, (4) collects inspection submissions via an n8n Form (notes + photos + condition), (5) uses OpenAI to analyze notes and assign a priority level, (6) notifies management via Slack (high) or email (medium), (7) logs results to Google Sheets, and (8) emails a weekly summary.

### Logical blocks
**1.1 Scheduled inspection assignment & checklist delivery**  
Schedule → config → fetch properties → normalize → OpenAI checklist → email inspector.

**1.2 Inspection intake & raw logging (form submission path)**  
Form submission → write raw submission into Sheets.

**1.3 AI analysis & prioritization**  
OpenAI analysis (expects JSON) → switch routing by priority.

**1.4 Notifications & results logging**  
Slack for HIGH, Gmail for MEDIUM → write results into Sheets.

**1.5 Weekly aggregation & summary email**  
Aggregate all logged results → summary email to manager.

---

## 2. Block-by-Block Analysis

### 2.1 Scheduled inspection assignment & checklist delivery

**Overview:** Runs on a schedule, loads property/tenant rows from Google Sheets, generates a property-specific inspection checklist using OpenAI, then emails the checklist to the assigned inspector.

**Nodes Involved:**  
- Schedule Inspections  
- Workflow Configuration  
- Fetch Property & Tenant Data  
- Normalize Property Data  
- Generate Inspection Checklist  
- Send Checklist to Inspector

#### Node: Schedule Inspections
- **Type / Role:** `Schedule Trigger` — time-based entry point.
- **Config choices:** Runs at **08:00** (interval rule with `triggerAtHour: 8`).
- **Connections:** Output → Workflow Configuration.
- **Edge cases / failures:**
  - Timezone differences (n8n instance timezone vs business timezone).
  - If you expect multiple runs/day, only hour is set (no minutes); confirm defaults.

#### Node: Workflow Configuration
- **Type / Role:** `Set` — centralizes environment variables / IDs for reuse.
- **Config choices:** Defines:
  - `propertySheetId` (Google Sheets doc ID holding property data)
  - `inspectionLogSheetId` (Google Sheets doc ID holding inspection logs)
  - `managerEmail`
  - `slackChannel` (Slack channel ID)
  Uses placeholder strings; must be replaced.
- **Key variables used downstream:** referenced via expressions like `$('Workflow Configuration').first().json.propertySheetId`.
- **Connections:** Output → Fetch Property & Tenant Data.
- **Edge cases / failures:**
  - Placeholders not replaced → Sheets/Gmail/Slack steps fail.
  - Using `.first()` assumes this node outputs at least one item (it does).

#### Node: Fetch Property & Tenant Data
- **Type / Role:** `Google Sheets` — reads property/tenant data.
- **Config choices:**
  - Targets Spreadsheet ID = `propertySheetId` from Workflow Configuration.
  - Sheet name = **“Properties”** (by name selection).
  - Operation is not explicitly shown in JSON; by default this node is typically configured to **read** rows (ensure it is set to “Read” / “Get All” in UI).
- **Credentials:** Google Sheets OAuth2 (“Google Sheets account 3”).
- **Connections:** Output → Normalize Property Data.
- **Edge cases / failures:**
  - Wrong sheet name (“Properties”) or missing headers.
  - OAuth token expired/insufficient permissions.
  - Large sheets may require pagination/limits depending on node settings.

#### Node: Normalize Property Data
- **Type / Role:** `Set` — maps sheet column names into consistent internal fields.
- **Config choices:** Creates normalized fields:
  - `propertyId` ← `$json.property_id`
  - `propertyAddress` ← `$json.address`
  - `unitNumber` ← `$json.unit`
  - `tenantName` ← `$json.tenant_name`
  - `inspectorEmail` ← `$json.inspector_email`
  - `propertyType` ← `$json.property_type`
  Keeps other fields.
- **Connections:** Output → Generate Inspection Checklist.
- **Edge cases / failures:**
  - If sheet headers differ (e.g., `property_id` vs `Property ID`), expressions yield empty values.
  - Missing inspector email → subsequent email send fails.

#### Node: Generate Inspection Checklist
- **Type / Role:** `OpenAI (LangChain)` — generates a detailed checklist from property context.
- **Config choices:**
  - Instruction prompt defines categories (exterior, interior, safety, HVAC, plumbing/electrical, property-type specifics) and formatting (numbered list with categories).
  - User content prompt injects:
    - `propertyAddress`, `unitNumber`, `propertyType`, `tenantName`
- **Output expectation:** A text checklist in `message.content` (as used by the next node).
- **Credentials:** OpenAI API (“n8n free OpenAI API credits”).
- **Connections:** Output → Send Checklist to Inspector.
- **Edge cases / failures:**
  - Model may return overly long output; email size constraints.
  - API rate limits / quota exhaustion.
  - If the node returns a different structure, the downstream `{{ $json.message.content }}` may break.

#### Node: Send Checklist to Inspector
- **Type / Role:** `Gmail` — emails the inspector the generated checklist and context.
- **Config choices:**
  - **To:** `Normalize Property Data` → `inspectorEmail`
  - **Subject:** “Property Inspection Required: {propertyAddress}”
  - **Body:** includes property context and `{{ $json.message.content }}` from OpenAI checklist node.
  - Mentions a form link placeholder: “[Form URL will be provided]” (not actually injected).
- **Connections:** Terminal for this path (no outgoing connection).
- **Edge cases / failures:**
  - Gmail OAuth not configured / token expired.
  - Invalid email address in sheet.
  - Missing actual form URL: inspectors may not know where to submit unless you add it.

---

### 2.2 Inspection intake & raw logging (form submission path)

**Overview:** Collects inspection results via n8n Form Trigger, then writes the raw submission (including metadata and file references) into a Google Sheet for recordkeeping.

**Nodes Involved:**  
- Receive Inspection Submission  
- Store Raw Inspection Data

#### Node: Receive Inspection Submission
- **Type / Role:** `Form Trigger` — public form endpoint entry point.
- **Config choices:**
  - Form title: “Property Inspection Submission”
  - Description: “Submit your property inspection findings, photos, and notes”
  - Fields:
    1. Property ID (text)
    2. Inspector Name (text)
    3. Inspection Notes (textarea)
    4. Inspection Photos (file upload)
    5. Overall Condition (dropdown: Excellent/Good/Fair/Poor)
  - Response text: “Thank you! Your inspection has been submitted successfully.”
  - Attribution disabled.
- **Connections:** Output → Store Raw Inspection Data.
- **Edge cases / failures:**
  - File upload handling: depending on n8n setup, uploaded files may be stored as binary data; downstream Sheets logging may not store binaries directly.
  - Public form access and authentication are not enforced here (consider restricting access).
  - Field naming consistency matters for downstream AI node prompts.

#### Node: Store Raw Inspection Data
- **Type / Role:** `Google Sheets` — persists raw form submissions.
- **Config choices:**
  - Spreadsheet ID = `inspectionLogSheetId` from Workflow Configuration.
  - Sheet name = **“RawInspections”**
  - Operation: `appendOrUpdate`
  - Column mapping: `autoMapInputData` (maps incoming JSON keys to columns).
- **Credentials:** Google Sheets OAuth2 (“Google Sheets account 3”).
- **Connections:** Output → Analyze Inspection & Flag Issues.
- **Edge cases / failures:**
  - `appendOrUpdate` requires a matching key configuration in the sheet/node to decide update vs append; if not configured, behavior may be unexpected.
  - Auto-map requires sheet headers match incoming field keys (e.g., `propertyId`, `inspectorName`, etc.). If the Form Trigger outputs different key casing, mapping may fail or create blanks.
  - Binary photo data cannot be meaningfully stored in Sheets without transforming into URLs (e.g., uploading to Drive/S3 first).

---

### 2.3 AI analysis & prioritization

**Overview:** Uses OpenAI to parse inspection notes, extract issues, assign a priority, and route the workflow based on that priority.

**Nodes Involved:**  
- Analyze Inspection & Flag Issues  
- Route by Priority

#### Node: Analyze Inspection & Flag Issues
- **Type / Role:** `OpenAI (LangChain)` — converts unstructured notes into structured issue analysis.
- **Config choices:**
  - System instructions require an **exact JSON format**:
    ```json
    {
      "priority": "HIGH" or "MEDIUM" or "LOW",
      "issuesSummary": "...",
      "issuesList": ["..."],
      "recommendedActions": "..."
    }
    ```
  - User content injects:
    - `propertyId`, `inspectorName`, `overallCondition`, `inspectionNotes`
- **Downstream dependency:** The next Switch node expects to evaluate `{{ $json.message.content.priority }}`.
- **Important integration note (likely adjustment needed):**
  - Many OpenAI nodes return `message.content` as a **string**, not an already-parsed JSON object. If so, `message.content.priority` will be undefined and routing will fail.
  - Recommended fix: add a JSON parsing step (e.g., **“Parse JSON”** via Code node or “JSON Parse” pattern) before the Switch; or configure the OpenAI node (if supported) to return structured JSON.
- **Credentials:** OpenAI API.
- **Connections:** Output → Route by Priority.
- **Edge cases / failures:**
  - Model returns invalid JSON (extra text, trailing commas).
  - Notes are empty or extremely short.
  - Quota/rate limit/timeouts.

#### Node: Route by Priority
- **Type / Role:** `Switch` — routes execution based on priority.
- **Config choices:**
  - Rule 1 (output “High”): if `{{ $json.message.content.priority }}` equals `HIGH`
  - Rule 2 (output “Medium”): if equals `MEDIUM`
  - Fallback output renamed to “Low”
- **Connections:**
  - High → Notify Manager (High Priority)
  - Medium → Email Manager (Medium Priority)
  - Low → (no node connected; effectively ends)
- **Edge cases / failures:**
  - If `message.content` is a string JSON, rules won’t match.
  - Priority casing differences (“High” vs “HIGH”) won’t match due to strict equals.
  - Low path is unhandled (no logging/notification specific to low beyond later generic logging—however logging happens after notify nodes, so Low currently won’t reach logging either).

---

### 2.4 Notifications & results logging

**Overview:** Sends alerts to management depending on priority and logs analyzed inspection results into Google Sheets.

**Nodes Involved:**  
- Notify Manager (High Priority)  
- Email Manager (Medium Priority)  
- Log Inspection Results

#### Node: Notify Manager (High Priority)
- **Type / Role:** `Slack` — immediate alert for urgent issues.
- **Config choices:**
  - Posts to channel ID from `Workflow Configuration.slackChannel`.
  - Message includes property/inspector/condition and AI analysis fields:
    - `issuesSummary`
    - `issuesList` formatted with `join("\n• ")`
    - `recommendedActions`
- **Connections:** Output → Log Inspection Results.
- **Edge cases / failures:**
  - Slack credential/auth not configured (node uses Slack API, not incoming webhook despite having `webhookId` in export).
  - Invalid channel ID or missing bot permission to post.
  - If `issuesList` is not an array (due to JSON parsing problems), `.join()` fails.

#### Node: Email Manager (Medium Priority)
- **Type / Role:** `Gmail` — sends a medium priority alert to the manager.
- **Config choices:**
  - **To:** `managerEmail` from Workflow Configuration
  - Subject includes Property ID
  - Body includes the AI analysis and recommended actions; uses `issuesList.join(...)` similarly.
- **Connections:** Output → Log Inspection Results.
- **Edge cases / failures:**
  - Same `.join()` risk if issuesList is not an array.
  - Gmail auth/token errors.
  - If priority routing fails, this node might never run.

#### Node: Log Inspection Results
- **Type / Role:** `Google Sheets` — logs the post-analysis result set.
- **Config choices:**
  - Spreadsheet ID = `inspectionLogSheetId`
  - Sheet name = **“InspectionResults”**
  - Operation: `appendOrUpdate`
  - Auto-map input data
- **Connections:** Output → Aggregate Weekly Inspections.
- **Edge cases / failures:**
  - If you want to store AI fields, ensure the incoming item actually contains them as top-level keys; currently they are referenced as `message.content.*` in messages, but not flattened into columns.
  - `appendOrUpdate` key behavior as noted earlier.

---

### 2.5 Weekly aggregation & summary email

**Overview:** Aggregates all items reaching this point and emails a single weekly summary to the manager.

**Nodes Involved:**  
- Aggregate Weekly Inspections  
- Send Summary Report

#### Node: Aggregate Weekly Inspections
- **Type / Role:** `Aggregate` — merges multiple items into one.
- **Config choices:** `aggregateAllItemData` (collects all item JSON into an array).
- **Connections:** Output → Send Summary Report.
- **Edge cases / failures:**
  - This only aggregates items from the current execution, not “the week” unless the workflow is run weekly and processes all relevant inspections in that run.
  - Large volumes could create very large aggregated payloads.

#### Node: Send Summary Report
- **Type / Role:** `Gmail` — sends manager a summary email.
- **Config choices:**
  - To = `managerEmail`
  - Subject: “Weekly Property Inspection Summary Report”
  - Body reports total inspections completed as `{{ $json.json.length }}` (length of aggregated array).
  - Mentions details are in the Google Sheet.
- **Connections:** Terminal.
- **Edge cases / failures:**
  - The expression `$json.json.length` depends on how Aggregate outputs data (often it outputs `{ json: [...] }`, but verify in your n8n version).
  - If no items reach aggregation (e.g., Low path not connected), summary may be 0 or node may not execute.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Schedule Inspections | scheduleTrigger | Scheduled entry point for generating checklists | — | Workflow Configuration | ## Schedule Inspections |
| Workflow Configuration | set | Central configuration (sheet IDs, manager email, Slack channel) | Schedule Inspections | Fetch Property & Tenant Data | ## Schedule Inspections |
| Fetch Property & Tenant Data | googleSheets | Load properties/tenants from “Properties” sheet | Workflow Configuration | Normalize Property Data | ## Get Data |
| Normalize Property Data | set | Map sheet columns into standard internal fields | Fetch Property & Tenant Data | Generate Inspection Checklist | ## Get Data |
| Generate Inspection Checklist | @n8n/n8n-nodes-langchain.openAi | Create property-specific inspection checklist text | Normalize Property Data | Send Checklist to Inspector | ## AI Email to Inspector |
| Send Checklist to Inspector | gmail | Email checklist and assignment details to inspector | Generate Inspection Checklist | — | ## AI Email to Inspector |
| Receive Inspection Submission | formTrigger | Collect inspection notes/photos/condition via form | — | Store Raw Inspection Data | ## Trigger, Log data |
| Store Raw Inspection Data | googleSheets | Write raw form submission to “RawInspections” | Receive Inspection Submission | Analyze Inspection & Flag Issues | ## Trigger, Log data |
| Analyze Inspection & Flag Issues | @n8n/n8n-nodes-langchain.openAi | Extract issues and priority as JSON | Store Raw Inspection Data | Route by Priority | ## AI Logic, Priority Level |
| Route by Priority | switch | Branch based on HIGH/MEDIUM/LOW | Analyze Inspection & Flag Issues | Notify Manager (High Priority); Email Manager (Medium Priority) | ## AI Logic, Priority Level |
| Notify Manager (High Priority) | slack | Slack alert for urgent inspections | Route by Priority (High) | Log Inspection Results | ## Notify |
| Email Manager (Medium Priority) | gmail | Email alert for medium-priority inspections | Route by Priority (Medium) | Log Inspection Results | ## Notify |
| Log Inspection Results | googleSheets | Store analyzed inspection outcomes in “InspectionResults” | Notify Manager (High Priority); Email Manager (Medium Priority) | Aggregate Weekly Inspections | ## Summary |
| Aggregate Weekly Inspections | aggregate | Aggregate results into one bundle | Log Inspection Results | Send Summary Report | ## Summary |
| Send Summary Report | gmail | Email weekly summary to manager | Aggregate Weekly Inspections | — | ## Summary |
| Sticky Note | stickyNote | Comment/metadata | — | — | ## Main (contains workflow description + setup steps) |
| Sticky Note1 | stickyNote | Comment/metadata | — | — | ## Trigger, Log data |
| Sticky Note2 | stickyNote | Comment/metadata | — | — | ## AI Logic, Priority Level |
| Sticky Note3 | stickyNote | Comment/metadata | — | — | ## Notify |
| Sticky Note4 | stickyNote | Comment/metadata | — | — | ## Summary |
| Sticky Note5 | stickyNote | Comment/metadata | — | — | ## Schedule Inspections |
| Sticky Note6 | stickyNote | Comment/metadata | — | — | ## Get Data |
| Sticky Note7 | stickyNote | Comment/metadata | — | — | ## AI Email to Inspector |

---

## 4. Reproducing the Workflow from Scratch

1) **Create a new workflow** in n8n  
   - Name it: **Property Inspection & Reporting Automation**.

2) **Add node: “Schedule Trigger”** (Schedule Inspections)  
   - Configure to run at **08:00** (adjust timezone in instance settings if needed).  
   - Connect → Workflow Configuration.

3) **Add node: “Set”** (Workflow Configuration)  
   - Add string fields:
     - `propertySheetId` = your Google Sheet document ID (properties)
     - `inspectionLogSheetId` = your Google Sheet document ID (logs)
     - `managerEmail` = manager recipient email
     - `slackChannel` = Slack channel ID  
   - Enable “Include Other Fields” (default in this workflow).  
   - Connect → Fetch Property & Tenant Data.

4) **Add node: “Google Sheets”** (Fetch Property & Tenant Data)  
   - Credentials: connect Google Sheets OAuth2 credential.
   - Document ID: expression `{{ $('Workflow Configuration').first().json.propertySheetId }}`
   - Sheet: by name **Properties**
   - Operation: configure to **Read/Get All** rows (depending on node UI).  
   - Connect → Normalize Property Data.

5) **Add node: “Set”** (Normalize Property Data)  
   - Map fields from your sheet columns:
     - `propertyId` = `{{ $json.property_id }}`
     - `propertyAddress` = `{{ $json.address }}`
     - `unitNumber` = `{{ $json.unit }}`
     - `tenantName` = `{{ $json.tenant_name }}`
     - `inspectorEmail` = `{{ $json.inspector_email }}`
     - `propertyType` = `{{ $json.property_type }}`  
   - Adjust expressions to match your actual header names.  
   - Connect → Generate Inspection Checklist.

6) **Add node: “OpenAI” (LangChain OpenAI node)** (Generate Inspection Checklist)  
   - Credentials: connect OpenAI API key/credential.
   - Instructions: paste the checklist system instructions (exterior/interior/safety/etc.).
   - User message: include property variables in prompt (address/unit/type/tenant).  
   - Connect → Send Checklist to Inspector.

7) **Add node: “Gmail”** (Send Checklist to Inspector)  
   - Credentials: connect Gmail OAuth2.
   - To: `{{ $('Normalize Property Data').first().json.inspectorEmail }}`
   - Subject: `Property Inspection Required: {{ $('Normalize Property Data').first().json.propertyAddress }}`
   - Body: include the checklist using `{{ $json.message.content }}`.
   - Add your actual form URL (recommended): paste the Form Trigger URL here once created.

8) **Add a second entry point: “Form Trigger”** (Receive Inspection Submission)  
   - Title: Property Inspection Submission
   - Fields:
     - Property ID (text)
     - Inspector Name (text)
     - Inspection Notes (textarea)
     - Inspection Photos (file)
     - Overall Condition (dropdown: Excellent/Good/Fair/Poor)
   - Connect → Store Raw Inspection Data.
   - Copy the public form URL and update the email body in step 7.

9) **Add node: “Google Sheets”** (Store Raw Inspection Data)  
   - Credentials: Google Sheets OAuth2.
   - Document ID: `{{ $('Workflow Configuration').first().json.inspectionLogSheetId }}`
   - Sheet name: **RawInspections**
   - Operation: **Append** (or `appendOrUpdate` if you configure a key column intentionally)
   - Mapping: Auto-map input data; ensure headers match incoming field keys.  
   - Connect → Analyze Inspection & Flag Issues.

10) **Add node: “OpenAI” (LangChain OpenAI node)** (Analyze Inspection & Flag Issues)  
   - Instructions: require exact JSON with `priority`, `issuesSummary`, `issuesList`, `recommendedActions`.
   - User prompt: inject propertyId/inspectorName/overallCondition/inspectionNotes.  
   - Connect → Route by Priority.

11) **(Recommended) Add a JSON parsing step** between analysis and switch  
   - If your OpenAI node returns JSON as text in `message.content`, add a **Code** node to parse it and set top-level fields (priority/issuesSummary/issuesList/recommendedActions).  
   - Then point the Switch to `{{ $json.priority }}` etc.  
   *(This workflow JSON does not include this node, but it is commonly required for reliability.)*

12) **Add node: “Switch”** (Route by Priority)  
   - Condition for High: equals `HIGH`
   - Condition for Medium: equals `MEDIUM`
   - Fallback: Low  
   - Connect:
     - High output → Notify Manager (High Priority)
     - Medium output → Email Manager (Medium Priority)
     - (Optional) Low output → Log Inspection Results (so low results still log and count)

13) **Add node: “Slack”** (Notify Manager (High Priority))  
   - Credentials: Slack OAuth/bot token with permission to post.
   - Channel: `{{ $('Workflow Configuration').first().json.slackChannel }}`
   - Message: include issuesSummary, issuesList, recommendedActions.  
   - Connect → Log Inspection Results.

14) **Add node: “Gmail”** (Email Manager (Medium Priority))  
   - To: `{{ $('Workflow Configuration').first().json.managerEmail }}`
   - Subject: include propertyId
   - Body: include issuesSummary, issuesList, recommendedActions  
   - Connect → Log Inspection Results.

15) **Add node: “Google Sheets”** (Log Inspection Results)  
   - Document ID: `{{ $('Workflow Configuration').first().json.inspectionLogSheetId }}`
   - Sheet: **InspectionResults**
   - Operation: Append (or appendOrUpdate with a defined key)
   - Ensure columns exist for what you want to store (including AI fields).  
   - Connect → Aggregate Weekly Inspections.

16) **Add node: “Aggregate”** (Aggregate Weekly Inspections)  
   - Mode: aggregate all item data.
   - Connect → Send Summary Report.

17) **Add node: “Gmail”** (Send Summary Report)  
   - To: `{{ $('Workflow Configuration').first().json.managerEmail }}`
   - Subject: Weekly Property Inspection Summary Report
   - Body: total count referencing the Aggregate output (verify the correct path in your n8n version).  

18) **Credentials checklist**
   - Google Sheets OAuth2: access to both spreadsheets.
   - Gmail OAuth2: permission to send emails as the configured account.
   - Slack: bot token/oauth with `chat:write` and channel access.
   - OpenAI: valid API key and sufficient quota.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “This workflow automates property inspections… schedules recurring inspections, generates AI-based checklists, collects photos and notes, flags potential issues, and notifies management and tenants… logs all inspection data for reporting and compliance purposes.” | Sticky note “Main” overview |
| Setup checklist: Cron frequency; Google Sheets/CRM property data; OpenAI credentials and prompts; inspector/manager contact fields; connect form/app; Slack channels; logging sheet configuration; summary email recipients. | Sticky note “Main” setup section |

