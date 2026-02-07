Automate unified marketing reports with Google Analytics, Google Ads, Meta Ads & HubSpot

https://n8nworkflows.xyz/workflows/automate-unified-marketing-reports-with-google-analytics--google-ads--meta-ads---hubspot-12124


# Automate unified marketing reports with Google Analytics, Google Ads, Meta Ads & HubSpot

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Workflow name:** Unified Marketing Reporting Automation  
**Stated title/use case:** Automate unified marketing reports with Google Analytics, Google Ads, Meta Ads & HubSpot

This workflow automatically produces **weekly or monthly unified marketing performance reporting** across multiple websites by collecting data from:
- **Google Analytics (GA4)** for website traffic metrics,
- **Google Ads** and **Meta Ads** for paid campaign performance,
- **HubSpot** for CRM leads and funnel/lifecycle status,
then:
- computes KPIs (spend, conversions/leads, CTR, CPA/CPL, conversion rate),
- **emails** marketing reports via **Gmail**,
- logs data into **Google Sheets** for historical tracking.

### Logical blocks
**1.1 Trigger & run-type detection**  
Two schedules trigger the workflow; a code node determines whether this run is “weekly” or “monthly” based on date logic.

**1.2 Website loop + data collection (GA4, Google Ads, Meta Ads)**  
A website list is expanded into single items; the workflow loops each website and pulls channel data, filters ad campaigns per website, merges sources, and builds a unified dataset.

**1.3 KPI computation + unified marketing report generation**  
Computes KPIs and campaign insights per website; then compiles an overall report object and emails either weekly or monthly version.

**1.4 HubSpot lead analysis + CRM reporting/storage**  
Fetches HubSpot leads, filters them to weekly/monthly window, summarizes statuses and lifecycle stages, emails CRM summaries, and writes CRM rows to Google Sheets.

---

## 2. Block-by-Block Analysis

### 2.1 Trigger & Run-Type Detection

**Overview:**  
Starts on schedules (weekly + monthly) and sets flags (`isWeekly`, `isMonthly`, `runType`) used throughout downstream nodes to decide time windows and reporting type.

**Nodes involved:**  
- Schedule Trigger2  
- Schedule Trigger3  
- check month and week1  
- Set Websites and Campaings1

#### Node: Schedule Trigger2
- **Type / role:** `Schedule Trigger` — weekly entry point.
- **Config choices:** Runs **every week**, **Monday** (`triggerAtDay: 1`) at **09:00**.
- **Outputs:** Feeds `check month and week1`.
- **Edge cases / failures:**  
  - Timezone is instance-dependent; ensure n8n timezone matches business timezone.
  - If disabled workflow (`active:false`), triggers won’t fire.

#### Node: Schedule Trigger3
- **Type / role:** `Schedule Trigger` — monthly entry point.
- **Config choices:** Runs **every month** at **10:00**. (No explicit day-of-month in the node; the next code node enforces “1st of month”.)
- **Outputs:** Feeds `check month and week1`.
- **Edge cases:** Same timezone considerations.

#### Node: check month and week1
- **Type / role:** `Code` — determines run type.
- **Logic (interpreted):**
  - `isWeekly = (today.getDay() === 1)` i.e., Monday
  - `isMonthly = (today.getDate() === 1)` i.e., 1st day of month
  - `runType = "monthly"` if monthly else `"weekly"` if weekly else `"none"`
- **Key outputs:** `runType`, `isWeekly`, `isMonthly`, `today`.
- **Connections:** Outputs to **Set Websites and Campaings1** and **Fetch1 (HubSpot)**.
- **Edge cases / failures:**
  - If Schedule Trigger3 runs on a day other than the 1st, `runType` becomes `"none"`; downstream nodes still execute unless explicitly stopped (there is no stop node), potentially producing incorrect “Weekly” report fallback later.
  - Date logic relies on server time.

#### Node: Set Websites and Campaings1
- **Type / role:** `Set` — defines website mapping and carries run flags forward.
- **Config choices:**
  - Creates an array field `websites` containing objects like:
    - `{ name, siteId, campaigns[] }`
  - Passes through `isWeekly` and `isMonthly` from the previous node.
- **Key expressions:**
  - `isWeekly = {{ $json.isWeekly }}`
  - `isMonthly = {{ $json.isMonthly }}`
- **Connections:** Outputs to **Expand Websites1**.
- **Edge cases:**
  - `siteId` is used as GA4 property id later; values shown (`inboxplus.com`, etc.) do not match typical GA4 property IDs (numeric). If not corrected, GA node will fail.

**Sticky note coverage (applies to this block’s nodes):**  
- “## Unified Marketing Intelligence & Reporting Automation …”  
- “## Step 1: Trigger & Report Type Detection …”

---

### 2.2 Website & Ads Data Processing (Loop, Fetch, Filter, Merge)

**Overview:**  
Expands the website list into individual items, loops per website, retrieves GA4 + Google Ads + Meta Ads data, filters ads to the current website, and merges all sources.

**Nodes involved:**  
- Expand Websites1  
- Attach Run Flags1  
- Loop Websites1  
- Get a report (Google Analytics)  
- Get many campaigns (Google Ads)  
- Fetch Meta Ads (HTTP Request)  
- Filter Google Ads By Website1  
- Filter Meta Ads By Website1  
- Merge1  
- Build Website Dataset1

#### Node: Expand Websites1
- **Type / role:** `Split Out` — converts `websites[]` array into one item per website.
- **Config choices:** Splits field `websites`; keeps all other fields (`include: allOtherFields`).
- **Connections:** Output to **Attach Run Flags1**.
- **Edge cases:** If `websites` is missing/empty, no downstream website processing occurs.

#### Node: Attach Run Flags1
- **Type / role:** `Set` — normalizes per-website fields.
- **Config choices (interpreted):**
  - Reads flags from the original `check month and week1` node using `$items(...)`.
  - Extracts the per-website fields from the split object into top-level fields: `name`, `siteId`, `campaigns`.
- **Key expressions:**
  - `isWeekly = {{$items("check month and week1")[0].json.isWeekly}}`
  - `isMonthly = {{$items("check month and week1")[0].json.isMonthly}}`
  - `name = {{ $json.websites.name }}`
- **Connections:** Output to **Loop Websites1**.
- **Edge cases:**
  - Uses string types for `isWeekly`/`isMonthly` (“type”: string). This later forces boolean normalization logic in reporting code; keep consistent to avoid mis-detection.

#### Node: Loop Websites1
- **Type / role:** `Split In Batches` — iterates websites one-by-one.
- **Config choices:** `batchSize = 1`.
- **Connections (important):**
  - Output 1 goes to:
    - **Append or update row in sheet2** (currently connected but likely mis-ordered; see below),
    - **Get a report**, **Get many campaigns**, **Fetch Meta Ads** in parallel.
  - It also receives a loop-back connection later from **Calculate KPIs & Campaign Insights1** to continue batches.
- **Edge cases / failures:**
  - If the loop-back is misconfigured or node errors mid-way, remaining websites will not be processed.
  - Parallel fan-out means Sheets node may run before KPIs exist (as currently wired).

#### Node: Get a report
- **Type / role:** `Google Analytics` (GA4) — fetches GA4 metrics.
- **Config choices:**
  - GA4 propertyId is set to `={{$json.siteId}}`
  - Metrics include `sessions` and `screenPageViews` (plus an empty `{}` entry in JSON which is likely accidental).
- **Connections:** Output to **Merge1** input 0.
- **Edge cases / failures:**
  - **Property ID mismatch**: GA4 property IDs are numeric (e.g., `123456789`), not domains. This is the single most likely runtime failure here.
  - Missing date range: with `additionalFields` empty, GA node may default or fail depending on node defaults/version.
  - Auth issues: requires Google Analytics credentials with GA4 access.

#### Node: Get many campaigns
- **Type / role:** `Google Ads` — fetches campaign list/performance (details not configured).
- **Config choices:** No explicit customer ID, date range, or fields shown; defaults may not return metrics needed by later KPI logic.
- **Connections:** Output to **Filter Google Ads By Website1**.
- **Edge cases:**
  - Missing required Google Ads configuration (customer ID / query) can cause empty results or API errors.
  - Later KPI code expects fields like `costMicros`, `clicks`, `impressions`, `conversions`, and `name`.

#### Node: Fetch Meta Ads
- **Type / role:** `HTTP Request` — calls a Meta Ads endpoint.
- **Config choices:**
  - URL placeholder: `your-meta-ads-api-endpoint-here`
  - Query parameters: `fields=spend,clicks,impressions,actions`, `time_range=weekly or monthly` (literal placeholder)
  - Header: `Authorization: Bearer YOUR_TOKEN_HERE` (placeholder)
- **Connections:** Output to **Filter Meta Ads By Website1**.
- **Edge cases:**
  - Must replace placeholders with real Graph API endpoint and token.
  - Meta “actions” requires parsing to compute leads; current downstream expects `ad.leads` directly.
  - Pagination handling is not present.

#### Node: Filter Google Ads By Website1
- **Type / role:** `Code` — filters Google Ads results to current website by campaign name.
- **Logic:**
  - Gets current website from `Loop Websites1`.
  - Keeps items whose `name`/`campaign_name` contains the website name (case-insensitive).
  - Adds `websiteInfo` object to each filtered ad (name, siteId, campaigns, flags).
- **Connections:** Output to **Merge1** input 1.
- **Edge cases:**
  - If campaign naming doesn’t include website name substring, everything filters out.
  - If Google Ads node output uses different keys, filter may miss campaigns.

#### Node: Filter Meta Ads By Website1
- **Type / role:** `Code` — filters Meta Ads results similarly.
- **Logic:** Same pattern; checks `campaign` or `campaign_name`.
- **Connections:** Output to **Merge1** input 2.
- **Edge cases:** Same naming assumptions; also Meta output schema must match (campaign fields, leads field expected later).

#### Node: Merge1
- **Type / role:** `Merge` — combines GA, Google Ads, Meta Ads streams.
- **Config choices:** `numberInputs: 3` (expects exactly three inbound connections).
- **Connections:** Output to **Build Website Dataset1**.
- **Edge cases:**
  - If any upstream branch produces 0 items, merge behavior depends on merge mode defaults; may stall or output empty.
  - If Meta/Google Ads produce multiple items but GA produces 1, combined item alignment can be tricky.

#### Node: Build Website Dataset1
- **Type / role:** `Code` — consolidates merged data into a single website dataset.
- **Logic (interpreted):**
  - Reads website from `Loop Websites1`.
  - Reads GA data from node named **"Mock Google Analytics"** — but no such node exists in this workflow JSON.
  - Reads filtered Ads data via `$items("Filter Google Ads By Website1")` and `$items("Filter Meta Ads By Website1")`.
- **Outputs:** `{ website, siteId, flags, analytics, googleAds[], metaAds[] }`
- **Connections:** Output to **Calculate KPIs & Campaign Insights1**.
- **Critical issue:**  
  - The reference `$node["Mock Google Analytics"]` will throw an error at runtime because the node is actually named **"Get a report"**. This must be updated to `$node["Get a report"].json`.
- **Edge cases:**
  - If GA node outputs a different shape (e.g., nested response), direct `.json.sessions` may not exist later.

**Sticky note coverage (applies to this block’s nodes):**  
- “## Step 2: Website & Ads Data Processing …”

---

### 2.3 KPI Computation + Marketing Report Emailing + Website Sheets Logging

**Overview:**  
Computes per-website KPIs and campaign-level insights, then compiles the multi-website report and emails weekly/monthly versions. Also attempts to log per-website KPIs into Google Sheets.

**Nodes involved:**  
- Calculate KPIs & Campaign Insights1  
- Prepare Report Data2  
- Switch  
- Send Weekly Marketing report2  
- Send Monthly Marketing Report2  
- Append or update row in sheet2

#### Node: Calculate KPIs & Campaign Insights1
- **Type / role:** `Code` — KPI engine and insight tagging.
- **Key calculations:**
  - GA: `visits = sessions`, `users`, `pageViews`, `siteConversions`
  - Google Ads totals: spend (from `costMicros/1e6`), clicks, impressions, conversions; per-campaign CTR and CPA
  - Meta totals: spend, clicks, impressions, leads; per-campaign CTR and CPL
  - Overall: `totalSpend`, `totalConversions = googleConversions + metaLeads`, `overallCPL`, `conversionRate = siteConversions/visits`
- **Insight rules (examples):**
  - Google: high spend > 3000 and conversions < 30 → optimize; CTR < 1 → low CTR; conversions 0 → pause
  - Meta: spend > 7000 and leads < 50 → optimize; CTR < 0.8 → creatives; leads 0 → underperforming
- **Connections:**
  - Back to **Loop Websites1** (loop continuation)
  - To **Prepare Report Data2**
- **Edge cases:**
  - If `data.analytics.sessions` etc. missing, coerces to 0 (safe).
  - If Google Ads doesn’t provide `costMicros`, spend becomes 0 → misleading.
  - Meta “leads” may not exist unless derived from actions; then leads=0.

#### Node: Prepare Report Data2
- **Type / role:** `Code` — compiles unified multi-website report object.
- **Logic:**
  - Extracts all items with `json.website` into `websites[]`.
  - Normalizes `isWeekly`/`isMonthly` using `toBool`.
  - Sets `reportType`: `"Monthly"` if any website has `isMonthly`, else `"Weekly"`.
  - Attempts to attach HubSpot summary if present in `items` (but in this branch, HubSpot items are not merged in; so hubspot usually `{}` here).
- **Outputs:** `{ reportDate, reportType, websites[], hubspot }`
- **Connections:** Output to **Switch**.
- **Edge cases:**
  - If the runType was “none”, this still labels Weekly by fallback logic.
  - HubSpot data is not actually merged into this path; `hubspot` will typically be empty.

#### Node: Switch
- **Type / role:** `Switch` — chooses weekly vs monthly email template based on `reportType`.
- **Rules:**  
  - If `{{$json.reportType}} == "Weekly"` → weekly branch  
  - If `... == "Monthly"` → monthly branch
- **Connections:**  
  - Weekly → Send Weekly Marketing report2  
  - Monthly → Send Monthly Marketing Report2
- **Edge cases:** Any other value causes no output.

#### Node: Send Weekly Marketing report2
- **Type / role:** `Gmail` — sends weekly marketing performance report.
- **Config choices:**
  - `sendTo: example.com` (placeholder; must be an email address)
  - Subject uses `{{ $json.reportType }}` and date.
  - Body is a Markdown-like formatted message building sections by mapping over `$json.websites`.
- **Edge cases:**
  - Gmail credentials required (OAuth2).
  - If websites array is empty, email will contain empty sections.
  - Uses `₹` currency symbol; ensure correct currency expectations.

#### Node: Send Monthly Marketing Report2
- **Type / role:** `Gmail` — sends monthly marketing performance report (same structure as weekly).
- **Edge cases:** same as weekly.

#### Node: Append or update row in sheet2
- **Type / role:** `Google Sheets` — stores website KPI rows (append-or-update).
- **Config choices:**
  - Operation: `appendOrUpdate`
  - Matching column: `Website Name`
  - Writes fields like Users, Conversions, Spend, Clicks, etc.
- **Key expressions / potential issues:**
  - Uses `{{ $json.websiteKPIs.users }}` etc. → requires KPI output item.
  - Uses `{{ $json.metaAdsInsights[0].spend }}` and `{{ $json.googleAdsInsights[0].spend }}` → takes only first campaign, not totals.
- **Connections:** Currently connected directly from **Loop Websites1**, not from KPI node.
- **Critical wiring issue:**  
  - Because it’s triggered directly by **Loop Websites1**, it will execute **before** KPIs exist, so `$json.websiteKPIs` will be undefined and will likely fail or write blanks.
  - Recommended: connect **Calculate KPIs & Campaign Insights1 → Append or update row in sheet2**.
- **Edge cases:**
  - Google Sheets credentials required.
  - Document/sheet placeholders must be replaced.

**Sticky note coverage (applies to this block’s nodes):**  
- “## Step 2.1: Marketing Report Generation …”

---

### 2.4 HubSpot Lead Analysis + CRM Reporting & Storage

**Overview:**  
Fetches leads from HubSpot, filters them to last 7/30 days based on weekly/monthly flags, summarizes lead statuses and lifecycle stages, emails a CRM summary, and writes lead-level records to Google Sheets.

**Nodes involved:**  
- Fetch1  
- Filter Hubspot Leads  
- Summarize Hubspot Leads  
- Prepare Report Data3  
- Switch3  
- Send Weekly Marketing report3  
- Send Monthly Marketing Report3  
- Code in JavaScript1  
- Append or update row in sheet3

#### Node: Fetch1
- **Type / role:** `HubSpot` — retrieves CRM records.
- **Config choices:**
  - Operation: `getAll`
  - Limit: 250
- **Connections:** Output to **Filter Hubspot Leads**.
- **Edge cases:**
  - Pagination beyond 250 is not handled unless HubSpot node auto-paginates in this operation/version.
  - Auth permissions/scopes required.

#### Node: Filter Hubspot Leads
- **Type / role:** `Code` — filters leads by created date within weekly/monthly window.
- **Logic:**
  - Reads flags from `check month and week1`.
  - For each lead item, parses `created_date`.
  - Weekly: keep if `diffDays <= 7`; Monthly: `diffDays <= 30`.
- **Connections:** Output to **Summarize Hubspot Leads**.
- **Edge cases:**
  - If HubSpot fields differ (`createdAt` vs `created_date`), parsing fails and item drops.
  - If runType is “none”, returns empty (no lead reporting).

#### Node: Summarize Hubspot Leads
- **Type / role:** `Code` — aggregates lead funnel stats.
- **Outputs:** `hubspotSummary` including:
  - `totalLeads`
  - `statusBreakdown` (new/contacted/qualified/followup/unqualified/converted/lost)
  - `lifecycleBreakdown` (lead/mql/sql/opportunity/customer)
  - `conversionRate` = converted/totalLeads
- **Connections:** Output to **Prepare Report Data3**.
- **Edge cases:**
  - Relies on fields `status` and `lifecycle_stage`; if missing, counts remain low.

#### Node: Prepare Report Data3
- **Type / role:** `Code` — builds CRM report payload.
- **Logic:**
  - Finds hubspot summary item among incoming items.
  - If not found, returns `[]` (stops branch).
  - Sets `reportType: "Monthly"` (hard-coded fallback).
- **Connections:** Output to **Switch3**.
- **Edge cases / correctness:**
  - **reportType is always “Monthly”** here, regardless of run flags. That means Switch3 will always choose the monthly branch unless changed.

#### Node: Switch3
- **Type / role:** `Switch` — routes weekly vs monthly CRM emails.
- **Rules:** Weekly vs Monthly based on `reportType`.
- **Connections:**  
  - Weekly → Send Weekly Marketing report3  
  - Monthly → Send Monthly Marketing Report3
- **Edge cases:** With current Prepare Report Data3 hard-coding Monthly, weekly path is effectively unused.

#### Node: Send Weekly Marketing report3
- **Type / role:** `Gmail` — appears to send the *marketing* multi-website report template again (not HubSpot-specific).
- **Connections:** none shown after it.
- **Potential issue:** This template expects `$json.websites` etc., but CRM branch payload contains `hubspotSummary` only. If this node is ever hit, it will likely render empty/undefined fields.

#### Node: Send Monthly Marketing Report3
- **Type / role:** `Gmail` — sends **HubSpot Lead Performance Report** (HTML).
- **Config choices:** References `{{$json.hubspotSummary...}}`.
- **Connections:** Output to **Code in JavaScript1**.
- **Edge cases:** Gmail HTML formatting ok; requires valid recipient.

#### Node: Code in JavaScript1
- **Type / role:** `Code` — transforms *filtered HubSpot leads* into row-wise sheet records.
- **Logic:** For each item, outputs fields like Lead ID, name, email, lifecycle, etc.
- **Major dataflow issue:**
  - This node runs **after Send Monthly Marketing Report3**, which outputs a single report object, not the list of leads.
  - Therefore `items` here will not be the individual leads; it will likely be just the summary payload, so the produced sheet rows will be wrong or empty.
  - Also references `lead.is_weekly` (not present in earlier nodes).
- **Connections:** Output to **Append or update row in sheet3**.

#### Node: Append or update row in sheet3
- **Type / role:** `Google Sheets` — stores CRM summary/lead data.
- **Config choices:** appendOrUpdate, schema includes many summary fields.
- **Critical config gap:** `columns.value` is empty `{}`. Unless mapping is set elsewhere, nothing will be written.
- **Edge cases:** Placeholder document/sheet IDs.

**Sticky note coverage (applies to this block’s nodes):**  
- “## Step 3: HubSpot Lead Analysis …”  
- “## Step 3.1: CRM Reporting & Storage …”

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Schedule Trigger2 | Schedule Trigger | Weekly schedule entry point | — | check month and week1 | ## Unified Marketing Intelligence & Reporting Automation… |
| Schedule Trigger2 | Schedule Trigger | Weekly schedule entry point | — | check month and week1 | ## Step 1: Trigger & Report Type Detection |
| Schedule Trigger3 | Schedule Trigger | Monthly schedule entry point | — | check month and week1 | ## Unified Marketing Intelligence & Reporting Automation… |
| Schedule Trigger3 | Schedule Trigger | Monthly schedule entry point | — | check month and week1 | ## Step 1: Trigger & Report Type Detection |
| check month and week1 | Code | Compute weekly/monthly flags | Schedule Trigger2, Schedule Trigger3 | Set Websites and Campaings1; Fetch1 | ## Unified Marketing Intelligence & Reporting Automation… |
| check month and week1 | Code | Compute weekly/monthly flags | Schedule Trigger2, Schedule Trigger3 | Set Websites and Campaings1; Fetch1 | ## Step 1: Trigger & Report Type Detection |
| Set Websites and Campaings1 | Set | Define websites list and pass flags | check month and week1 | Expand Websites1 | ## Unified Marketing Intelligence & Reporting Automation… |
| Set Websites and Campaings1 | Set | Define websites list and pass flags | check month and week1 | Expand Websites1 | ## Step 1: Trigger & Report Type Detection |
| Expand Websites1 | Split Out | Expand websites array into items | Set Websites and Campaings1 | Attach Run Flags1 | ## Step 2: Website & Ads Data Processing |
| Attach Run Flags1 | Set | Flatten website fields and attach flags | Expand Websites1 | Loop Websites1 | ## Step 2: Website & Ads Data Processing |
| Loop Websites1 | Split In Batches | Iterate through websites | Attach Run Flags1; (loop-back) Calculate KPIs & Campaign Insights1 | Append or update row in sheet2; Get a report; Get many campaigns; Fetch Meta Ads | ## Step 2: Website & Ads Data Processing |
| Get a report | Google Analytics (GA4) | Fetch GA4 metrics per site | Loop Websites1 | Merge1 | ## Step 2: Website & Ads Data Processing |
| Get many campaigns | Google Ads | Fetch Google Ads campaigns/metrics | Loop Websites1 | Filter Google Ads By Website1 | ## Step 2: Website & Ads Data Processing |
| Fetch Meta Ads | HTTP Request | Fetch Meta Ads metrics | Loop Websites1 | Filter Meta Ads By Website1 | ## Step 2: Website & Ads Data Processing |
| Filter Google Ads By Website1 | Code | Filter Google Ads rows to the website | Get many campaigns | Merge1 | ## Step 2: Website & Ads Data Processing |
| Filter Meta Ads By Website1 | Code | Filter Meta Ads rows to the website | Fetch Meta Ads | Merge1 | ## Step 2: Website & Ads Data Processing |
| Merge1 | Merge | Merge GA + Google Ads + Meta Ads | Get a report; Filter Google Ads By Website1; Filter Meta Ads By Website1 | Build Website Dataset1 | ## Step 2: Website & Ads Data Processing |
| Build Website Dataset1 | Code | Consolidate merged data into website dataset | Merge1 | Calculate KPIs & Campaign Insights1 | ## Step 2: Website & Ads Data Processing |
| Calculate KPIs & Campaign Insights1 | Code | Compute KPIs + insights per website | Build Website Dataset1 | Loop Websites1; Prepare Report Data2 | ## Step 2: Website & Ads Data Processing |
| Prepare Report Data2 | Code | Build unified marketing report payload | Calculate KPIs & Campaign Insights1 | Switch | ## Step 2.1: Marketing Report Generation |
| Switch | Switch | Route weekly vs monthly marketing report | Prepare Report Data2 | Send Weekly Marketing report2; Send Monthly Marketing Report2 | ## Step 2.1: Marketing Report Generation |
| Send Weekly Marketing report2 | Gmail | Email weekly marketing report | Switch | — | ## Step 2.1: Marketing Report Generation |
| Send Monthly Marketing Report2 | Gmail | Email monthly marketing report | Switch | — | ## Step 2.1: Marketing Report Generation |
| Append or update row in sheet2 | Google Sheets | Store per-website KPI row | Loop Websites1 | — | ## Step 2: Website & Ads Data Processing |
| Fetch1 | HubSpot | Fetch all leads | check month and week1 | Filter Hubspot Leads | ## Step 3: HubSpot Lead Analysis |
| Filter Hubspot Leads | Code | Filter leads by weekly/monthly window | Fetch1 | Summarize Hubspot Leads | ## Step 3: HubSpot Lead Analysis |
| Summarize Hubspot Leads | Code | Aggregate lead statuses + lifecycle | Filter Hubspot Leads | Prepare Report Data3 | ## Step 3: HubSpot Lead Analysis |
| Prepare Report Data3 | Code | Build CRM report payload | Summarize Hubspot Leads | Switch3 | ## Step 3.1: CRM Reporting & Storage |
| Switch3 | Switch | Route weekly vs monthly CRM email | Prepare Report Data3 | Send Weekly Marketing report3; Send Monthly Marketing Report3 | ## Step 3.1: CRM Reporting & Storage |
| Send Weekly Marketing report3 | Gmail | (Template mismatch risk) marketing template | Switch3 | — | ## Step 3.1: CRM Reporting & Storage |
| Send Monthly Marketing Report3 | Gmail | Email HubSpot lead summary (HTML) | Switch3 | Code in JavaScript1 | ## Step 3.1: CRM Reporting & Storage |
| Code in JavaScript1 | Code | Transform lead items for Google Sheets | Send Monthly Marketing Report3 | Append or update row in sheet3 | ## Step 3.1: CRM Reporting & Storage |
| Append or update row in sheet3 | Google Sheets | Store CRM rows (mapping incomplete) | Code in JavaScript1 | — | ## Step 3.1: CRM Reporting & Storage |
| Sticky Note6 | Sticky Note | Documentation | — | — |  |
| Sticky Note7 | Sticky Note | Documentation | — | — |  |
| Sticky Note8 | Sticky Note | Documentation | — | — |  |
| Sticky Note9 | Sticky Note | Documentation | — | — |  |
| Sticky Note10 | Sticky Note | Documentation | — | — |  |
| Sticky Note11 | Sticky Note | Documentation | — | — |  |

---

## 4. Reproducing the Workflow from Scratch

1) **Create workflow**
   - Name: `Unified Marketing Reporting Automation`
   - Set execution order: `v1` (Workflow settings → Execution order)

2) **Add triggers**
   1. Add **Schedule Trigger** named `Schedule Trigger2`
      - Interval: `weeks`
      - Day: Monday
      - Time: 09:00
   2. Add **Schedule Trigger** named `Schedule Trigger3`
      - Interval: `months`
      - Time: 10:00

3) **Add run-type computation**
   - Add **Code** node `check month and week1`
   - Paste logic that sets:
     - `isWeekly` (Monday)
     - `isMonthly` (day 1)
     - `runType` (`monthly` > `weekly` > `none`)
   - Connect both schedule triggers → `check month and week1`

4) **Define website mapping**
   - Add **Set** node `Set Websites and Campaings1`
   - Create fields:
     - `websites` (Array) containing objects `{name, siteId, campaigns[]}`
     - `isWeekly` (Boolean) = `{{$json.isWeekly}}`
     - `isMonthly` (Boolean) = `{{$json.isMonthly}}`
   - Connect `check month and week1` → `Set Websites and Campaings1`

5) **Expand and normalize website items**
   1. Add **Split Out** node `Expand Websites1`
      - Field to split: `websites`
      - Include: all other fields
   2. Add **Set** node `Attach Run Flags1`
      - Fields:
        - `isWeekly` = `{{$items("check month and week1")[0].json.isWeekly}}`
        - `isMonthly` = `{{$items("check month and week1")[0].json.isMonthly}}`
        - `name` = `{{$json.websites.name}}`
        - `siteId` = `{{$json.websites.siteId}}`
        - `campaigns` = `{{$json.websites.campaigns}}`
   - Connect: `Set Websites...` → `Expand Websites1` → `Attach Run Flags1`

6) **Loop websites**
   - Add **Split In Batches** node `Loop Websites1`
   - Batch size: `1`
   - Connect `Attach Run Flags1` → `Loop Websites1`

7) **Add channel data fetch nodes (per website)**
   1. **Google Analytics** node `Get a report`
      - Configure GA4 property id expression: `{{$json.siteId}}`  
        (In a real build, replace `siteId` with an actual GA4 property id field.)
      - Select metrics: sessions, users, pageViews/conversions as needed
      - Configure date range consistent with weekly/monthly flags (recommended via expressions)
      - Credentials: Google OAuth2 / service account with GA4 access
   2. **Google Ads** node `Get many campaigns`
      - Configure customer ID and query/fields so the output contains:
        `name`, `costMicros`, `clicks`, `impressions`, `conversions`
      - Credentials: Google Ads OAuth2
   3. **HTTP Request** node `Fetch Meta Ads`
      - Method: GET
      - URL: Meta Graph API insights endpoint (replace placeholder)
      - Add auth header `Authorization: Bearer <token>` (or use Facebook app token approach)
      - Ensure response provides campaign name and metrics; if “leads” is in actions, add parsing later
   - Connect `Loop Websites1` → each fetch node in parallel.

8) **Filter ads by current website**
   1. Add **Code** `Filter Google Ads By Website1`
      - Filter by campaign name containing `Loop Websites1.json.name` (case-insensitive)
      - Attach `websiteInfo` to each ad row
   2. Add **Code** `Filter Meta Ads By Website1`
      - Similar logic for Meta
   - Connect: Google Ads → filter Google; Meta request → filter Meta

9) **Merge sources**
   - Add **Merge** node `Merge1`
   - Set number of inputs to `3`
   - Connect:
     - GA → Merge input 0
     - Filter Google → Merge input 1
     - Filter Meta → Merge input 2

10) **Build website dataset**
   - Add **Code** node `Build Website Dataset1`
   - IMPORTANT: reference the real GA node name (`Get a report`), not “Mock Google Analytics”.
   - Output a single JSON object containing:
     - website info, flags
     - `analytics` object
     - `googleAds[]` array
     - `metaAds[]` array
   - Connect `Merge1` → `Build Website Dataset1`

11) **Compute KPIs and insights**
   - Add **Code** node `Calculate KPIs & Campaign Insights1`
   - Implement:
     - totals and derived metrics (CTR/CPA/CPL, overallCPL, conversion rate)
     - “insight” tagging rules
   - Connect `Build Website Dataset1` → `Calculate KPIs & Campaign Insights1`

12) **Loop continuation**
   - Connect `Calculate KPIs & Campaign Insights1` back to `Loop Websites1` (so batches continue).

13) **Prepare unified marketing report + send email**
   1. Add **Code** node `Prepare Report Data2`
      - Collect all website KPI items into `websites[]`
      - Determine `reportType` from flags
   2. Add **Switch** node `Switch`
      - Rule 1: `reportType == Weekly`
      - Rule 2: `reportType == Monthly`
   3. Add two **Gmail** nodes:
      - `Send Weekly Marketing report2`
      - `Send Monthly Marketing Report2`
      - Configure recipients, subject, and body templates
      - Credentials: Gmail OAuth2
   - Connect: `Calculate KPIs...` → `Prepare Report Data2` → `Switch` → (weekly/monthly Gmail nodes)

14) **Log website KPI data to Google Sheets**
   - Add **Google Sheets** node `Append or update row in sheet2`
   - Operation: Append or update
   - Choose document + sheet
   - Map columns from KPI output (`website`, `websiteKPIs`, etc.)
   - Credentials: Google Sheets OAuth2 / service account
   - Recommended connection: **Calculate KPIs & Campaign Insights1 → Append or update row in sheet2** (not from Loop Websites1).

15) **HubSpot lead retrieval**
   1. Add **HubSpot** node `Fetch1` (getAll, limit 250 or enable pagination if available)
      - Credentials: HubSpot Private App token or OAuth
   2. Add **Code** node `Filter Hubspot Leads`
      - Filter by last 7/30 days using flags from `check month and week1`
   3. Add **Code** node `Summarize Hubspot Leads`
      - Produce `hubspotSummary`
   - Connect `check month and week1` → `Fetch1` → `Filter Hubspot Leads` → `Summarize Hubspot Leads`

16) **CRM report + storage**
   1. Add **Code** node `Prepare Report Data3`
      - Set `reportType` based on flags (recommended; don’t hardcode “Monthly”)
   2. Add **Switch** node `Switch3` for weekly/monthly
   3. Add Gmail nodes for CRM summary (at least one)
   4. Add **Code** node `Code in JavaScript1` to transform *lead-level* items for Sheets
      - Ensure this node is connected from the filtered leads stream, not from the email summary output.
   5. Add **Google Sheets** node `Append or update row in sheet3`
      - Configure column mappings (don’t leave empty)
   - Connect in correct order:
     - Filtered leads → transform → sheet write
     - Summary → prepare → switch → email

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Unified Marketing Intelligence & Reporting Automation … Setup steps … Customization tips …” | Sticky Note: overview and setup guidance embedded in the canvas |
| “Step 1: Trigger & Report Type Detection …” | Sticky Note: documents the trigger/run-type block |
| “Step 2: Website & Ads Data Processing …” | Sticky Note: documents the website loop and channel fetching |
| “Step 2.1: Marketing Report Generation …” | Sticky Note: documents marketing report compilation + emailing |
| “Step 3: HubSpot Lead Analysis …” | Sticky Note: documents HubSpot lead filtering + summarization |
| “Step 3.1: CRM Reporting & Storage …” | Sticky Note: documents CRM emailing + Sheets storage |

