Analyze lost HubSpot deals and generate revival strategies with OpenAI

https://n8nworkflows.xyz/workflows/analyze-lost-hubspot-deals-and-generate-revival-strategies-with-openai-12328


# Analyze lost HubSpot deals and generate revival strategies with OpenAI

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:**  
This workflow periodically retrieves deals from HubSpot, isolates **Closed–Lost** deals, uses **OpenAI (via LangChain OpenAI node)** to (1) classify the loss reason and (2) generate a **revival / re-engagement strategy**, then distributes a consolidated report via **Gmail** and **Slack**, and finally writes an auditable record to **Google Sheets**.

**Target use cases:**
- Sales leadership weekly/daily lost-deal review with consistent categorization
- “Deal revival” pipeline generation with AI-assisted outreach plans
- Audit log of AI recommendations + communications sent

### Logical blocks
**1.1 Scheduled Input & Deal Retrieval (HubSpot)**  
Schedule Trigger → HubSpot “Get many deals” → Filter only closedlost

**1.2 Deal Standardization / Field Preparation**  
Set node normalizes fields used by AI prompts.

**1.3 AI Loss Analysis (classification + explanation)**  
OpenAI node creates loss JSON → Code parses JSON output into structured fields.

**1.4 Merge: Deal Data + Loss Insights → AI Revival Strategy**  
Merge combines original deal fields with loss analysis → OpenAI generates strategy JSON → Code parses strategy.

**1.5 Merge Final Dataset + Reporting (Email + Slack)**  
Merge combines enriched deal + revival strategy → build HTML email and Slack message → send.

**1.6 Data Persistence / Audit Logging (Google Sheets)**  
Because Gmail/Slack outputs don’t contain original items, a Code node re-pulls data from Merge1 → append/update Google Sheets.

---

## 2. Block-by-Block Analysis

### 2.1 Scheduled Input & Deal Retrieval (HubSpot)

**Overview:**  
Runs daily at a configured hour, fetches many deals from HubSpot with selected properties, and filters to keep only **Closed–Lost** deals.

**Nodes involved:**  
- Schedule Trigger  
- Get many deals (HubSpot)  
- If

#### Node: Schedule Trigger
- **Type / role:** `n8n-nodes-base.scheduleTrigger` — starts workflow on a schedule.
- **Configuration:** Runs at **09:00** (one interval rule with `triggerAtHour: 9`).
- **Inputs/Outputs:** No input; output triggers “Get many deals”.
- **Failure modes / edge cases:** Instance timezone matters; ensure n8n timezone aligns with business reporting expectations.

#### Node: Get many deals
- **Type / role:** `n8n-nodes-base.hubspot` — retrieves deal records.
- **Configuration choices:**
  - **Resource:** Deal
  - **Operation:** Get All
  - **Authentication:** App Token
  - **Properties requested:** `dealname, dealstage, dealtype, description, amount, createdate, closedate, hubspot_owner_id, hs_deal_stage_probability, hs_last_shared_message_create_date, num_associated_contacts`
- **Inputs/Outputs:** Trigger input; outputs a list of deals (items).
- **Important integration note:** Downstream nodes expect fields like `dealStage`, `dealName`, `lostReason`, etc. HubSpot commonly returns `dealstage` and `dealname`. If your HubSpot node outputs raw property names, you may need mapping/renaming before the IF/Set step.
- **Failure modes:**
  - Invalid/expired app token, missing scopes
  - Pagination/rate-limits for “getAll”
  - Properties missing or empty causing later expression resolution issues

#### Node: If
- **Type / role:** `n8n-nodes-base.if` — filters only closed-lost deals.
- **Configuration:**
  - Condition: `={{ $json.dealStage }}` **equals** `closedlost`
- **Inputs/Outputs:** Receives deal items; “true” branch continues to “Edit Fields”.
- **Edge cases / likely bug:** HubSpot deal stage often arrives as `dealstage` (lowercase) or nested inside `properties`. If `$json.dealStage` is undefined, **no items** pass. Validate the incoming JSON and adjust the expression accordingly (e.g., `$json.dealstage` or `$json.properties.dealstage` depending on HubSpot node output format).

---

### 2.2 Deal Standardization / Field Preparation

**Overview:**  
Normalizes the fields used by the AI prompts so the model sees consistent keys for each deal.

**Nodes involved:**  
- Edit Fields

#### Node: Edit Fields
- **Type / role:** `n8n-nodes-base.set` — creates a clean, consistent schema.
- **Configuration choices:**
  - Assigns:
    - `dealName = {{$json.dealName}}`
    - `amount = {{$json.amount}}` (number)
    - `lostReason = {{$json.lostReason}}`
    - `salesNotes = {{$json.salesNotes}}`
    - `industry = {{$json.industry}}`
    - `ownerName = {{$json.ownerName}}`
    - `closeDate = {{$json.closeDate}}`
- **Inputs/Outputs:** Input from IF(true). Outputs standardized items to:
  - “Brief Explanation Creator”
  - Merge (input 2 via index 1)
- **Edge cases / likely bug:** Several fields referenced (`lostReason`, `salesNotes`, `industry`, `ownerName`, `closeDate`) are **not fetched** in “Get many deals” properties list. Unless HubSpot provides them elsewhere, these will be empty and weaken AI outputs. Add these properties in HubSpot node or map them from existing HubSpot fields.

---

### 2.3 AI Loss Analysis (classification + explanation)

**Overview:**  
Uses OpenAI to classify each deal into a single loss category, confidence, and brief explanation. Then parses the AI’s JSON string into fields.

**Nodes involved:**  
- Brief Explanation Creator (OpenAI)  
- Code in JavaScript (parser)

#### Node: Brief Explanation Creator
- **Type / role:** `@n8n/n8n-nodes-langchain.openAi` — LLM call for loss analysis.
- **Model:** `gpt-4o-mini`
- **Prompt design (interpreted):**
  - System: “senior sales operations analyst”
  - User: provides deal attributes and strict output schema
  - Output constraints: **ONLY valid JSON**, no markdown
  - Allowed categories: Price; Timing/Budget; Competitor; Feature Gap; Trust/Security; Complexity/Implementation; No Response/Ghosted; Internal Decision/Priority Shift
- **Inputs/Outputs:** Input is standardized deal item; output is an LLM response object (LangChain style) used by the parser node.
- **Failure modes:**
  - Model returns non-JSON or extra text → parser error
  - Token limits if sales notes are huge
  - Credential/model access issues

#### Node: Code in JavaScript
- **Type / role:** `n8n-nodes-base.code` — parses the LLM response JSON.
- **Key logic:**
  - Reads `currentItem.json?.output?.[0]?.content?.[0]?.text`
  - `JSON.parse(aiText)`
  - Extracts: `lossCategory`, `confidenceLevel`, `briefExplanation`
  - On error: defaults to `Other`, `Low`, `Could not parse AI response`
  - Adds `itemIndex` (position index) for potential alignment
- **Inputs/Outputs:** Input from “Brief Explanation Creator”; output to Merge (input 1 via index 0).
- **Edge cases:**
  - If the OpenAI node returns a different structure (`output_text` instead of `text`), parser may fail. (Your later strategy parser already supports `text || output_text`; consider aligning here too.)
  - `Other` category is not in the allowed list from the prompt; that’s fine operationally but may create reporting inconsistency.

---

### 2.4 Merge: Deal Data + Loss Insights → AI Revival Strategy

**Overview:**  
Combines the original standardized deal with the loss analysis, then asks OpenAI for a practical revival strategy and parses it.

**Nodes involved:**  
- Merge  
- Feedback Creator (OpenAI)  
- Code in JavaScript1 (strategy parser)

#### Node: Merge
- **Type / role:** `n8n-nodes-base.merge` — combines two streams by position.
- **Mode:** Combine → `combineByPosition`
- **Inputs:**
  - Input 1: parsed loss analysis (from “Code in JavaScript”)
  - Input 2: standardized deal fields (from “Edit Fields”)
- **Outputs:**
  - Main output → “Feedback Creator”
  - Also connects to “Merge1” input 2 (index 1), providing the pre-strategy enriched data stream for later final merging.
- **Edge cases:**
  - If any side produces fewer items (e.g., some deals fail AI call), combine-by-position can misalign data. Consider combine by a stable key (deal ID) if available.

#### Node: Feedback Creator
- **Type / role:** `@n8n/n8n-nodes-langchain.openAi` — LLM call to generate re-engagement strategy.
- **Model:** `gpt-4o-mini`
- **Prompt design:**
  - System: “senior B2B sales strategist”
  - User: includes deal attributes + `lossCategory` + `briefExplanation`
  - Output constraints: JSON only, with fields:
    - `reengagementTiming`
    - `recommendedChannel`
    - `messageAngle`
    - `suggestedIncentive`
    - `salesActionStep`
- **Inputs/Outputs:** Input from Merge; output to “Code in JavaScript1”.
- **Failure modes:** Non-JSON responses, missing fields, token limits, credential issues.

#### Node: Code in JavaScript1
- **Type / role:** `n8n-nodes-base.code` — parses revival strategy JSON and applies defaults.
- **Key logic:**
  - Attempts to parse `item.json?.output?.[0]?.content?.[0]` with `text || output_text`
  - Defaults if missing:
    - timing: “30–60 days after loss”
    - channel: “Personalized Email”
    - message angle: uses template referencing `lossCategory`
    - incentive: “Educational content or limited trial”
    - next action: generic follow-up
- **Inputs/Outputs:** Input from “Feedback Creator”; output to “Merge1” input 1 (index 0).
- **Critical bug / edge case:** The code references `lossCategory` in:
  - `messageAngle = \`Re-engage focusing on value related to ${lossCategory || "their needs"}.\`;`
  but `lossCategory` is **not defined in this node’s scope** unless it was supposed to come from merged data. As written, this can throw a `ReferenceError` during fallback assignment. Fix by reading it from the item (e.g., `const lossCategory = item.json.lossCategory;`) or by merging lossCategory into the same item before this node.
- **Data merging limitation:** This node does **not** actually merge “previous deal data” despite the comment; it only returns strategy fields. The actual merge with deal data happens in “Merge1”.

---

### 2.5 Merge Final Dataset + Reporting (Email + Slack)

**Overview:**  
Combines (A) the strategy fields with (B) the enriched deal+loss dataset, then renders an HTML email and a Slack message summarizing all deals, and sends both.

**Nodes involved:**  
- Merge1  
- Code in JavaScript7 (HTML email builder)  
- Send a message2 (Gmail)  
- Code in JavaScript2 (Slack builder)  
- Send a message1 (Slack)

#### Node: Merge1
- **Type / role:** `n8n-nodes-base.merge` — combines deal+loss dataset with strategy dataset by position.
- **Mode:** Combine → `combineByPosition`
- **Inputs:**
  - Input 1: strategy fields (from “Code in JavaScript1”)
  - Input 2: enriched deal+loss dataset (from “Merge”)
- **Outputs:** Sends combined items to:
  - “Code in JavaScript7” (email)
  - “Code in JavaScript2” (Slack)
- **Edge cases:** Same alignment risk as Merge. If any upstream AI call fails for a subset, combine-by-position may mismatch deals and strategies.

#### Node: Code in JavaScript7
- **Type / role:** `n8n-nodes-base.code` — creates one consolidated HTML email for all items.
- **Key logic:** Iterates all incoming items, generates `<tr>` rows with:
  - dealName, industry, ownerName, lossCategory, lostReason, amount
  - reengagementTiming, recommendedChannel, messageAngle, suggestedIncentive, salesActionStep
- **Output:** Returns **one item** with `{ emailHtml }`.
- **Edge cases:**
  - If any fields contain HTML special chars, they aren’t escaped (risk of broken markup).
  - Uses “📌” in the header. Some email clients may render this inconsistently.

#### Node: Send a message2 (Gmail)
- **Type / role:** `n8n-nodes-base.gmail` — sends the consolidated HTML email.
- **Configuration:**
  - To: `sales-person-id` (placeholder)
  - Subject: “Lost Deals Re-engagement Strategy Summary”
  - Message body: `={{ $json.emailHtml }}`
- **Inputs/Outputs:** Receives the single-item HTML payload. Output goes to “Code in JavaScript4”.
- **Failure modes:**
  - OAuth2 token expired / wrong Gmail scopes
  - Gmail rate limits
  - If HTML must be explicitly marked as HTML depending on node options; verify Gmail node sends as HTML (n8n Gmail node typically supports HTML in message field, but configuration may vary).

#### Node: Code in JavaScript2
- **Type / role:** `n8n-nodes-base.code` — builds a Slack-friendly text summary.
- **Key logic:** Reads items via `$items("Merge1")` (not `$input.all()`), formats a multi-deal message and adds “Email Sent” + timestamp.
- **Output:** `{ slackMessage }`
- **Edge cases:**
  - Slack message length limits: many deals can exceed Slack’s max payload size.
  - Formatting uses `*bold*` and separators; OK for Slack mrkdwn.

#### Node: Send a message1 (Slack)
- **Type / role:** `n8n-nodes-base.slack` — posts to a channel.
- **Configuration:**
  - Auth: OAuth2
  - Channel: `C0925HJ9BPU` (cached name: `all-devs-workspace`)
  - Text: `={{ $json.slackMessage }}`
- **Outputs:** Continues to “Code in JavaScript4”.
- **Failure modes:**
  - Channel ID invalid for workspace
  - Token scopes missing (`chat:write`)
  - Message too long

---

### 2.6 Data Persistence / Audit Logging (Google Sheets)

**Overview:**  
Reconstructs the per-deal dataset after notifications (because Gmail/Slack don’t forward original deal arrays), then appends/updates rows in Google Sheets with an “Email Sent” status and timestamps.

**Nodes involved:**  
- Code in JavaScript4  
- Append or update row in sheet1 (Google Sheets)

#### Node: Code in JavaScript4
- **Type / role:** `n8n-nodes-base.code` — restores deal dataset for logging.
- **Key logic:**
  - Pulls items from `$items("Merge1")`
  - Throws error if empty (prevents silent data loss)
  - Maps each deal into a logging schema with friendly column names:
    - Deal Name, Industry, Owner, Loss Category, Lost Reason, Amount, Re-engagement Timing, Recommended Channel, Message Angle, Suggested Incentive, Sales Action Step
    - Status = “Email Sent”
    - Email Sent Date = now ISO
    - Timestamp = now ISO
- **Edge cases:**
  - If “Merge1” did not run (due to earlier node failure), this node hard-fails.
  - Uses the same timestamp for both “Email Sent Date” and “Timestamp”; acceptable but redundant.

#### Node: Append or update row in sheet1
- **Type / role:** `n8n-nodes-base.googleSheets` — persists rows.
- **Operation:** `appendOrUpdate`
- **Document/Sheet:** placeholders: `your-google-sheet-value`, `gid=0`
- **Columns mapped:** All fields produced by Code in JavaScript4.
- **Matching columns:** Empty (`matchingColumns: []`). This effectively behaves like **append**, unless n8n defaults to a key internally (generally it needs a matching column to update reliably).
- **Failure modes:**
  - OAuth/Service account credential issues
  - Sheet permissions / wrong documentId
  - Schema mismatch if sheet headers differ
- **Recommendation:** Configure at least one stable matching column (e.g., HubSpot Deal ID) to prevent duplicates on re-runs.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Sticky Note | n8n-nodes-base.stickyNote | Documentation / overview |  |  | Intelligent Lost Deal Analyzer + Revival Strategy Engine Workflow (full description + setup steps) |
| Sticky Note1 | n8n-nodes-base.stickyNote | Documentation (Step 1) |  |  | Step 1: Lost Deal Identification & Data Preparation |
| Sticky Note2 | n8n-nodes-base.stickyNote | Documentation (Step 2) |  |  | Step 2: AI Loss Analysis & Revival Strategy Generation |
| Sticky Note3 | n8n-nodes-base.stickyNote | Documentation (Step 3) |  |  | Step 3: Multi-Channel Reporting, Audit Logging & Data Persistence |
| Schedule Trigger | n8n-nodes-base.scheduleTrigger | Scheduled entry point | — | Get many deals | Step 1: Lost Deal Identification & Data Preparation |
| Get many deals | n8n-nodes-base.hubspot | Fetch deals from HubSpot | Schedule Trigger | If | Step 1: Lost Deal Identification & Data Preparation |
| If | n8n-nodes-base.if | Filter closed-lost deals | Get many deals | Edit Fields | Step 1: Lost Deal Identification & Data Preparation |
| Edit Fields | n8n-nodes-base.set | Standardize deal fields | If | Brief Explanation Creator; Merge | Step 1: Lost Deal Identification & Data Preparation |
| Brief Explanation Creator | @n8n/n8n-nodes-langchain.openAi | AI loss classification JSON | Edit Fields | Code in JavaScript | Step 2: AI Loss Analysis & Revival Strategy Generation |
| Code in JavaScript | n8n-nodes-base.code | Parse loss JSON | Brief Explanation Creator | Merge | Step 2: AI Loss Analysis & Revival Strategy Generation |
| Merge | n8n-nodes-base.merge | Combine deal fields + loss insights | Code in JavaScript; Edit Fields | Feedback Creator; Merge1 | Step 2: AI Loss Analysis & Revival Strategy Generation |
| Feedback Creator | @n8n/n8n-nodes-langchain.openAi | AI revival strategy JSON | Merge | Code in JavaScript1 | Step 2: AI Loss Analysis & Revival Strategy Generation |
| Code in JavaScript1 | n8n-nodes-base.code | Parse strategy JSON + defaults | Feedback Creator | Merge1 | Step 2: AI Loss Analysis & Revival Strategy Generation |
| Merge1 | n8n-nodes-base.merge | Combine strategy + deal/loss dataset | Code in JavaScript1; Merge | Code in JavaScript7; Code in JavaScript2 | Step 3: Multi-Channel Reporting, Audit Logging & Data Persistence |
| Code in JavaScript7 | n8n-nodes-base.code | Build consolidated HTML email | Merge1 | Send a message2 | Step 3: Multi-Channel Reporting, Audit Logging & Data Persistence |
| Send a message2 | n8n-nodes-base.gmail | Send email report | Code in JavaScript7 | Code in JavaScript4 | Step 3: Multi-Channel Reporting, Audit Logging & Data Persistence |
| Code in JavaScript2 | n8n-nodes-base.code | Build Slack summary message | Merge1 (via $items) | Send a message1 | Step 3: Multi-Channel Reporting, Audit Logging & Data Persistence |
| Send a message1 | n8n-nodes-base.slack | Post Slack report | Code in JavaScript2 | Code in JavaScript4 | Step 3: Multi-Channel Reporting, Audit Logging & Data Persistence |
| Code in JavaScript4 | n8n-nodes-base.code | Restore Merge1 data after email/slack and format for Sheets | Send a message2; Send a message1 | Append or update row in sheet1 | Step 3: Multi-Channel Reporting, Audit Logging & Data Persistence |
| Append or update row in sheet1 | n8n-nodes-base.googleSheets | Persist audit rows | Code in JavaScript4 | — | Step 3: Multi-Channel Reporting, Audit Logging & Data Persistence |

---

## 4. Reproducing the Workflow from Scratch

1) **Create a new workflow**  
   - Name: “Intelligent Lost Deal Analyzer + Revival Strategy Engine” (or your preferred name)

2) **Add Schedule Trigger** (`Schedule Trigger`)  
   - Set schedule to run daily at **09:00** (adjust timezone/settings as needed).

3) **Add HubSpot node** (`HubSpot` → “Get All Deals”)  
   - Resource: **Deal**  
   - Operation: **Get All**  
   - Auth: **App Token** (configure HubSpot private app token credential)  
   - Properties: include at least:
     - `dealname`, `dealstage`, `amount`, `closedate`
     - Plus whatever you want to reference later (recommended to also include the real HubSpot properties for loss reason, notes, industry, owner fields, and deal ID for matching).
   - Connect: **Schedule Trigger → HubSpot**

4) **Add IF node** (`If`) to filter Closed–Lost  
   - Condition: deal stage equals `closedlost`
   - Important: use the correct field path as produced by your HubSpot node (often `dealstage` or `properties.dealstage`).  
   - Connect: **HubSpot → If**

5) **Add Set node** (`Edit Fields`)  
   - Create standardized fields used by prompts: `dealName, amount, lostReason, salesNotes, industry, ownerName, closeDate`  
   - Map them from your HubSpot output (adjust expressions accordingly).  
   - Connect: **If (true) → Edit Fields**

6) **Add OpenAI (LangChain) node** (`Brief Explanation Creator`)  
   - Node type: `OpenAI` (LangChain)  
   - Model: `gpt-4o-mini`  
   - Credentials: configure OpenAI API key in n8n  
   - Prompt:  
     - System: sales ops analyst  
     - User: include the deal fields and request JSON-only output with:
       - `lossCategory`, `confidenceLevel`, `briefExplanation`
   - Connect: **Edit Fields → Brief Explanation Creator**

7) **Add Code node** (`Code in JavaScript`) to parse loss JSON  
   - Parse the OpenAI output text into `lossCategory`, `confidenceLevel`, `briefExplanation`.  
   - Add safe fallbacks on parse errors.  
   - Connect: **Brief Explanation Creator → Code in JavaScript**

8) **Add Merge node** (`Merge`) to combine deal fields + loss output  
   - Mode: **Combine by position**  
   - Connect:
     - **Code in JavaScript → Merge (Input 1)**
     - **Edit Fields → Merge (Input 2)**

9) **Add OpenAI (LangChain) node** (`Feedback Creator`) for revival strategy  
   - Model: `gpt-4o-mini`  
   - Prompt includes: deal fields + `lossCategory` + `briefExplanation`  
   - Output JSON-only with:
     - `reengagementTiming`, `recommendedChannel`, `messageAngle`, `suggestedIncentive`, `salesActionStep`
   - Connect: **Merge → Feedback Creator**

10) **Add Code node** (`Code in JavaScript1`) to parse strategy JSON  
   - Parse OpenAI response.
   - Add defaults if missing.  
   - Fix the variable scope bug by reading `lossCategory` from item JSON before using it in fallback text.  
   - Connect: **Feedback Creator → Code in JavaScript1**

11) **Add Merge node** (`Merge1`) to combine strategy + enriched deal/loss dataset  
   - Mode: **Combine by position**  
   - Connect:
     - **Code in JavaScript1 → Merge1 (Input 1)**
     - **Merge → Merge1 (Input 2)**

12) **Build Email HTML** (`Code in JavaScript7`)  
   - Create one HTML table containing all items from Merge1.
   - Output one item `{ emailHtml }`.
   - Connect: **Merge1 → Code in JavaScript7**

13) **Send Gmail** (`Send a message2`)  
   - Configure Gmail OAuth2 credentials
   - To: sales leadership address(es)
   - Subject: “Lost Deals Re-engagement Strategy Summary”
   - Body: `{{$json.emailHtml}}`
   - Connect: **Code in JavaScript7 → Gmail**

14) **Build Slack message** (`Code in JavaScript2`)  
   - Create a text summary. Optionally source items using `$input.all()` (or `$items("Merge1")` as in the workflow).
   - Output `{ slackMessage }`.
   - Connect: **Merge1 → Code in JavaScript2**

15) **Send Slack** (`Send a message1`)  
   - Configure Slack OAuth2 credential with `chat:write`
   - Choose channel
   - Text: `{{$json.slackMessage}}`
   - Connect: **Code in JavaScript2 → Slack**

16) **Restore data for logging** (`Code in JavaScript4`)  
   - Pull items from `$items("Merge1")` because Gmail/Slack nodes won’t carry the full dataset forward.
   - Map to Google Sheets column names and add timestamps/status.
   - Connect:
     - **Gmail → Code in JavaScript4**
     - **Slack → Code in JavaScript4**
     (Either can trigger logging depending on execution path; keep both if you want logging after each.)

17) **Google Sheets logging** (`Append or update row in sheet1`)  
   - Configure Google Sheets OAuth2/service account credential
   - Select Spreadsheet + Sheet
   - Operation: Append or Update
   - Map columns from Code in JavaScript4
   - Strongly recommended: add a stable **matching column** (e.g., Deal ID) to prevent duplicates.
   - Connect: **Code in JavaScript4 → Google Sheets**

18) **Add sticky notes (optional)**  
   - Copy the step notes into Sticky Note nodes to document the workflow visually.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Intelligent Lost Deal Analyzer + Revival Strategy Engine Workflow…” (full overview + setup steps) | Embedded in the workflow’s main Sticky Note |
| Step 1 note: Lost Deal Identification & Data Preparation | Sticky Note “Step 1” |
| Step 2 note: AI Loss Analysis & Revival Strategy Generation | Sticky Note “Step 2” |
| Step 3 note: Multi-Channel Reporting, Audit Logging & Data Persistence | Sticky Note “Step 3” |

