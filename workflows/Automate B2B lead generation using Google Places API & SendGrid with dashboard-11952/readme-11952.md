Automate B2B lead generation using Google Places API & SendGrid with dashboard

https://n8nworkflows.xyz/workflows/automate-b2b-lead-generation-using-google-places-api---sendgrid-with-dashboard-11952


# Automate B2B lead generation using Google Places API & SendGrid with dashboard

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

This workflow automates B2B lead generation by:
1) Generating and storing a location “grid” (lat/lng points) in Google Sheets (one-time setup).
2) Running daily Google Places “Nearby Search” queries over a randomized subset of grid points.
3) Fetching Google Place Details, extracting website/contact data, scraping websites to find emails, deduplicating, and appending qualified leads into a Leads sheet.
4) Running outbound email campaigns via SendGrid on a schedule (and optionally via a webhook), tracking sent status back in Google Sheets.
5) Maintaining a lightweight dashboard/operational state in Sheets (grid points marked “searched”, leads updated with sent status/template assignment, etc.).

### Logical Blocks
**1.1 One-time grid initialization (setup)**  
Generate a geographic grid and write it to Google Sheets, then disable those nodes.

**1.2 Daily grid batch selection & Places discovery**  
On a daily trigger, read grid points, choose a batch to process, call Google Places Nearby Search, and parse results.

**1.3 Place enrichment (Place Details) & contact extraction**  
For each place, request Place Details and extract website/metadata needed for downstream steps.

**1.4 Website scraping & email extraction pipeline**  
Filter for places with websites, deduplicate, rate-limit requests, scrape sites, extract emails, filter valid leads, and append to a Leads sheet.

**1.5 Grid state update (mark searched points)**  
After leads are appended, update the processed grid points as “searched” in the grid sheet.

**1.6 Scheduled email sending (campaign runner)**  
On a schedule, pull leads from Google Sheets, filter out fake emails, assign templates, rate-limit, send via SendGrid, and update each lead row with sending status.

**1.7 Webhook-based lead retrieval endpoint (dashboard/API)**  
Expose an HTTP endpoint that reads leads from Sheets, filters fake emails, and returns results to the caller.

---

## 2. Block-by-Block Analysis

### 2.1 One-time grid initialization (setup)

**Overview:**  
Creates a set of latitude/longitude “grid points” representing the target area and stores them in Google Sheets. This is intended to run once and then be disabled to prevent overwriting/recreating the grid.

**Nodes Involved:**  
- Generate Location Grid (ONE-TIME)  
- Save Grid to Sheet (ONE-TIME)

#### Node: Generate Location Grid (ONE-TIME)
- **Type / role:** `Code` node (JavaScript) — generates an array of grid points (lat/lng plus metadata like “searched” flags, ids, timestamps, etc.).
- **Configuration (interpreted):** Node is marked with a note: “RUN ONCE to generate grid, then disable”.
- **Key expressions/variables:** Not visible in JSON (parameters empty). Typically outputs items like:
  - `lat`, `lng`
  - `gridId` or `rowKey`
  - `searched = false`
- **Connections:** Outputs to **Save Grid to Sheet (ONE-TIME)**.
- **Potential failures / edge cases:**
  - Incorrect coordinate generation (wrong bounds/step).
  - Too many grid points causing large sheet writes or execution time.
  - Missing required fields expected by later “Read Grid Points” logic.

#### Node: Save Grid to Sheet (ONE-TIME)
- **Type / role:** `Google Sheets` — writes generated grid items to a sheet.
- **Configuration (interpreted):** Parameters not shown; likely “Append” or “Upsert” into a Grid sheet.
- **Credentials:** Google Sheets OAuth2/service account (n8n credential).
- **Connections:** Receives from **Generate Location Grid (ONE-TIME)**.
- **Potential failures / edge cases:**
  - Google auth issues, missing permissions.
  - Wrong spreadsheet ID/sheet name/range mapping.
  - Column mismatch (grid fields not aligned to sheet columns).

---

### 2.2 Daily grid batch selection & Places discovery

**Overview:**  
Runs daily, loads grid points from Sheets, selects a subset to process (filtering out already-searched points and randomizing), then queries Google Places Nearby Search using each point.

**Nodes Involved:**  
- Daily Trigger  
- Read Grid Points  
- Code in JavaScript  
- Read Grid Points1  
- Filter & Randomize Daily Batch  
- Google Nearby Search  
- Parse Nearby Results

#### Node: Daily Trigger
- **Type / role:** `Schedule Trigger` — starts daily pipeline.
- **Configuration:** Not provided (parameters empty); defaults typically mean “every day at a set time” depending on n8n UI setup.
- **Connections:** To **Read Grid Points**.
- **Edge cases:**
  - Timezone differences (n8n instance vs business timezone).
  - Overlapping runs if execution time exceeds schedule interval.

#### Node: Read Grid Points
- **Type / role:** `Google Sheets` — reads grid points sheet.
- **Configuration:** Not shown; expected to read all grid rows or a relevant range.
- **Connections:** To **Code in JavaScript**.
- **Failures:**
  - Incorrect range causing missing columns.
  - Large reads causing slow runs.

#### Node: Code in JavaScript
- **Type / role:** `Code` — orchestration/branching helper.
- **Configuration (interpreted):** Feeds into **Read Grid Points1** and **Update row in sheet1** (two outputs from same node).
- **Likely purpose:** Prepare data structures, normalize fields, maybe select “next grid points to process”, and/or update a “last run” marker.
- **Connections:**  
  - Output → **Read Grid Points1**  
  - Output → **Update row in sheet1**
- **Edge cases:**
  - If code expects certain columns and they’re missing/renamed, expressions throw errors.
  - Potentially outputs an empty array, causing downstream nodes to do nothing.

#### Node: Read Grid Points1
- **Type / role:** `Google Sheets` — second read of grid points (or another sheet/range).
- **Configuration:** Not visible; could read only unsearched points or read a “control” table.
- **Connections:** To **Filter & Randomize Daily Batch**.

#### Node: Update row in sheet1
- **Type / role:** `Google Sheets` — updates a row (likely run metadata, dashboard counters, last execution).
- **Configuration:** Not visible.
- **Connections:** Receives from **Code in JavaScript**.
- **Edge cases:** Wrong row lookup key → updates wrong row.

#### Node: Filter & Randomize Daily Batch
- **Type / role:** `Code` — selects daily subset of grid points.
- **Configuration (interpreted):** Likely:
  - Filter `searched != true`
  - Random shuffle
  - Take N points (daily quota)
- **Connections:** To **Google Nearby Search**.
- **Edge cases:**
  - N too high → hits Google API quotas.
  - If all points searched → no output.

#### Node: Google Nearby Search
- **Type / role:** `HTTP Request` — calls Google Places Nearby Search.
- **Notes:** “Uses lat/lng from grid”.
- **Configuration (interpreted):**
  - Method: GET
  - URL: Google Places API Nearby Search endpoint
  - Query params: `location={{$json.lat}},{{$json.lng}}`, `radius`, `keyword/type`, `key`
- **Connections:** To **Parse Nearby Results**.
- **Failure modes:**
  - 403/401 invalid API key
  - `OVER_QUERY_LIMIT`
  - Non-200 responses, retries needed
  - Lat/lng formatting issues

#### Node: Parse Nearby Results
- **Type / role:** `Code` — parses Nearby Search JSON and extracts place identifiers.
- **Likely outputs:** An array of places with `place_id`, name, vicinity, geometry, etc.
- **Connections:** To **Get Place Details2**.
- **Edge cases:**
  - Nearby Search returns `next_page_token` (pagination) — if not handled, results are incomplete.
  - Empty results for some grid points.

---

### 2.3 Place enrichment (Place Details) & contact extraction

**Overview:**  
For each discovered place, query Place Details to obtain website/phone/address and then extract the fields needed for scraping and lead qualification.

**Nodes Involved:**  
- Get Place Details2  
- Extract Contact Info2  
- Split Places Array2

#### Node: Get Place Details2
- **Type / role:** `HTTP Request` — calls Google Place Details API.
- **Configuration (interpreted):**
  - Method: GET
  - Endpoint: Place Details
  - Params: `place_id={{$json.place_id}}`, `fields=website,formatted_phone_number,name,...`, `key`
- **Connections:** To **Extract Contact Info2**.
- **Failure modes:**
  - Missing `place_id` from parsing step
  - Quota limit
  - Partial field availability (website often missing)

#### Node: Extract Contact Info2
- **Type / role:** `Code` — maps Place Details response to a normalized “lead candidate” object.
- **Likely fields produced:**
  - `placeId`, `businessName`, `website`, `phone`, `address`, `googleMapsUrl`
- **Connections:** To **Split Places Array2**.
- **Edge cases:**
  - Website is absent or malformed (no protocol).
  - International phone/address formats.

#### Node: Split Places Array2
- **Type / role:** `Split Out` — splits an array of places into individual items.
- **Configuration:** Default behavior: take an array field from input and emit one item per element (exact field name not visible).
- **Connections:** To **Filter: Has Website2**.
- **Edge cases:**
  - Input is already itemized (no array) → may emit nothing depending on configuration.
  - Wrong array field path.

---

### 2.4 Website scraping & email extraction pipeline

**Overview:**  
Filters places with websites, deduplicates entries, scrapes site HTML (rate-limited), extracts emails, and appends valid leads to a Google Sheet.

**Nodes Involved:**  
- Filter: Has Website2  
- Remove Duplicates: Emails  
- Loop Over Items  
- Wait (Rate Limit)2  
- Scrape Website2  
- Extract Emails2  
- Filter: Has Email2  
- Append Leads (Dedupe by Place ID)1

#### Node: Filter: Has Website2
- **Type / role:** `Filter` — keeps only items with non-empty website.
- **Configuration:** Not shown; likely condition like `website exists AND website != ""`.
- **Connections:** To **Remove Duplicates: Emails**.
- **Edge cases:** Websites like `facebook.com/...` may be allowed but are poor for scraping.

#### Node: Remove Duplicates: Emails
- **Type / role:** `Code` — deduplication step.
- **Configuration (interpreted):** Despite name, placed right after “Has Website”; likely dedupes by `placeId` or website domain before scraping to reduce load.
- **Connections:** To **Loop Over Items**.
- **Edge cases:** If dedupe key missing, may collapse incorrectly or not dedupe at all.

#### Node: Loop Over Items
- **Type / role:** `Split In Batches` — iterates items one-by-one or in small batches.
- **Connections:**  
  - Main output 0 → **Extract Emails2** (this is unusual given scraping happens after Wait; see note below)  
  - Main output 1 → **Wait (Rate Limit)2**
- **Important behavior:** In n8n, `SplitInBatches` typically sends current batch on output 0 and “noItemsLeft” on output 1; but here output 1 is used to drive rate limiting + scraping. This indicates the node may be configured in a non-default way or the workflow relies on a specific routing pattern.
- **Edge cases:** Misconfiguration can cause scraping never to run or looping to stall.

#### Node: Wait (Rate Limit)2
- **Type / role:** `Wait` — throttling to respect rate limits (Google or website).
- **Configuration:** Not shown; usually “Wait for X seconds”.
- **Connections:** To **Scrape Website2**.
- **Failure modes:** If set to “Wait for webhook” accidentally, flow will hang.

#### Node: Scrape Website2
- **Type / role:** `HTTP Request` — fetches website HTML.
- **Special setting:** `continueOnFail: true` (explicit), so failures won’t stop the workflow.
- **Configuration (interpreted):**
  - GET request to `{{$json.website}}`
  - Follow redirects likely enabled
- **Connections:** To **Loop Over Items** (feeds back), indicating iterative scraping/extraction cycle.
- **Edge cases / failures:**
  - 403/406 bot protection, Cloudflare
  - Slow sites/timeouts
  - Non-HTML responses (PDF)
  - Redirect loops
  - Missing protocol (http/https)

#### Node: Extract Emails2
- **Type / role:** `Code` — parses HTML/text and extracts emails via regex, possibly also “contact@domain”, mailto links, etc.
- **Connections:** To **Filter: Has Email2**.
- **Edge cases:**
  - Obfuscated emails (e.g., “name [at] domain”)
  - False positives (images, scripts)
  - Large HTML causing memory usage

#### Node: Filter: Has Email2
- **Type / role:** `IF` — routes items depending on whether emails were found.
- **Connections:**  
  - True → **Append Leads (Dedupe by Place ID)1**  
  - False → (no connection; drops item)
- **Edge cases:** If code returns `emails` as string vs array, condition must match.

#### Node: Append Leads (Dedupe by Place ID)1
- **Type / role:** `Google Sheets` — appends leads while deduping by Google Place ID (implied by node name).
- **Configuration (interpreted):**
  - Append to Leads sheet
  - Before append, may search existing rows for `placeId` and skip if exists (depending on node configuration and/or sheet formulas; parameters not visible)
- **Connections:** To **Prepare Grid Update**.
- **Failure modes:**
  - If dedupe is not truly implemented (just in naming), duplicates may accumulate.
  - Race conditions with parallel runs.

---

### 2.5 Grid state update (mark searched points)

**Overview:**  
After processing, marks the used grid points as “searched” to avoid re-querying the same coordinates repeatedly.

**Nodes Involved:**  
- Prepare Grid Update  
- Mark Grid Points as Searched

#### Node: Prepare Grid Update
- **Type / role:** `Code` — prepares payload for updating grid rows.
- **Configuration (interpreted):** Likely outputs `{ rowNumber/id, searched: true, searchedAt: now }`.
- **Connections:** To **Mark Grid Points as Searched**.
- **Edge cases:** If sheet row identifiers are not preserved from earlier steps, updates can’t target correct rows.

#### Node: Mark Grid Points as Searched
- **Type / role:** `Google Sheets` — updates rows in grid sheet.
- **Configuration:** Not shown; likely “Update” by row number or by a unique key.
- **Connections:** Terminal.
- **Failure modes:** Wrong key mapping → marks incorrect points searched.

---

### 2.6 Scheduled email sending (campaign runner)

**Overview:**  
Periodically pulls leads from the sheet, removes obviously fake emails, assigns alternating templates, then sends via SendGrid with a wait between sends, and updates each row as sent.

**Nodes Involved:**  
- Schedule Trigger  
- Get row(s) in sheet  
- Filter: Remove Fake Emails  
- Assign Alternating Templates  
- Loop Over Items1  
- Wait  
- Update row in sheet  
- Send an email

#### Node: Schedule Trigger
- **Type / role:** `Schedule Trigger` — entry point for the email campaign.
- **TypeVersion:** 1.3
- **Connections:** To **Get row(s) in sheet**.
- **Edge cases:** Overlapping runs can cause duplicate sends if “sent” flag isn’t checked.

#### Node: Get row(s) in sheet
- **Type / role:** `Google Sheets` — reads leads rows to email.
- **Configuration (interpreted):** Likely filters by “not sent” (either via sheet view/filter or range).
- **Connections:** To **Filter: Remove Fake Emails**.
- **Failures:** Reading too many rows; missing columns like email, sent status.

#### Node: Filter: Remove Fake Emails
- **Type / role:** `Filter` — removes invalid/disposable/placeholder patterns.
- **TypeVersion:** 2
- **Configuration:** Not visible; commonly excludes:
  - `example.com`, `test@`, `noreply@`, `no-reply@`
  - emails without valid TLD
- **Connections:** To **Assign Alternating Templates**.

#### Node: Assign Alternating Templates
- **Type / role:** `Code` — alternates email templates between leads (A/B).
- **Likely output fields:** `templateId`, `subject`, `body`, `variant = A/B`.
- **Connections:** To **Loop Over Items1**.
- **Edge cases:** If SendGrid uses dynamic templates, must ensure correct template IDs.

#### Node: Loop Over Items1
- **Type / role:** `Split In Batches` — iterates through leads to send.
- **Connections:**  
  - Output 1 → **Wait** (output 0 is empty in connections, indicating special loop wiring)
- **Edge cases:** If batch output wiring is wrong, it may never send.

#### Node: Wait
- **Type / role:** `Wait` — throttles sending pace to protect reputation and comply with rate limits.
- **TypeVersion:** 1.1
- **Connections:** To **Update row in sheet**.
- **Failure mode:** Mis-set to “wait for webhook” stalls run.

#### Node: Update row in sheet
- **Type / role:** `Google Sheets` — updates lead row (e.g., set `status=queued/sending/sent`, store template variant, timestamp).
- **Connections:** To **Send an email**.
- **Edge cases:** Update should happen either before send (mark “in progress”) or after send (mark “sent”). Here it’s before **Send an email**, so failed sends could still mark rows unless later corrected.

#### Node: Send an email
- **Type / role:** `SendGrid` — sends outbound email.
- **Credentials:** SendGrid API key credential.
- **Connections:** To **Loop Over Items1** (loop continuation).
- **Failure modes:**
  - SendGrid 401 invalid API key
  - Template not found
  - Suppression list blocks sending
  - Rate limiting (429)
  - If sender identity/domain not verified, delivery issues

---

### 2.7 Webhook-based lead retrieval endpoint (dashboard/API)

**Overview:**  
Exposes a webhook endpoint to fetch and return lead rows (likely for a dashboard), removing fake emails before responding.

**Nodes Involved:**  
- Webhook  
- Get row(s) in sheet1  
- Filter: Remove Fake Emails1  
- Respond to Webhook

#### Node: Webhook
- **Type / role:** `Webhook` — HTTP entry point.
- **TypeVersion:** 2.1
- **Configuration:** Not shown; typically includes path, method (GET/POST), authentication.
- **Connections:** To **Get row(s) in sheet1**.
- **Edge cases:** If public and unauthenticated, leaks lead data.

#### Node: Get row(s) in sheet1
- **Type / role:** `Google Sheets` — reads leads (or a subset) to return.
- **Connections:** To **Filter: Remove Fake Emails1**.

#### Node: Filter: Remove Fake Emails1
- **Type / role:** `Filter` — same function as scheduled path, for webhook response.
- **Connections:** To **Respond to Webhook**.

#### Node: Respond to Webhook
- **Type / role:** `Respond to Webhook` — returns JSON response to caller.
- **TypeVersion:** 1.4
- **Edge cases:** Large payloads; consider pagination.

---

### 2.8 Sticky Notes (documentation placeholders)

**Overview:**  
There are multiple Sticky Note nodes, but their `content` fields are empty in the provided JSON, so no actionable comments can be captured.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1  
- Sticky Note2  
- Sticky Note3  
- Sticky Note4  
- Sticky Note5

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Generate Location Grid (ONE-TIME) | Code | Create lat/lng grid points | — | Save Grid to Sheet (ONE-TIME) |  |
| Save Grid to Sheet (ONE-TIME) | Google Sheets | Persist grid points to Sheets | Generate Location Grid (ONE-TIME) | — |  |
| Daily Trigger | Schedule Trigger | Start daily Places discovery | — | Read Grid Points |  |
| Read Grid Points | Google Sheets | Load grid points | Daily Trigger | Code in JavaScript |  |
| Code in JavaScript | Code | Orchestrate grid read + metadata update | Read Grid Points | Read Grid Points1; Update row in sheet1 |  |
| Read Grid Points1 | Google Sheets | Load/refresh grid points dataset | Code in JavaScript | Filter & Randomize Daily Batch |  |
| Update row in sheet1 | Google Sheets | Update control/dashboard row | Code in JavaScript | — |  |
| Filter & Randomize Daily Batch | Code | Select unsearched/random daily batch | Read Grid Points1 | Google Nearby Search |  |
| Google Nearby Search | HTTP Request | Query Google Places Nearby Search | Filter & Randomize Daily Batch | Parse Nearby Results |  |
| Parse Nearby Results | Code | Extract place IDs/results | Google Nearby Search | Get Place Details2 |  |
| Get Place Details2 | HTTP Request | Query Google Place Details | Parse Nearby Results | Extract Contact Info2 |  |
| Extract Contact Info2 | Code | Normalize details (website, etc.) | Get Place Details2 | Split Places Array2 |  |
| Split Places Array2 | Split Out | Split array into per-place items | Extract Contact Info2 | Filter: Has Website2 |  |
| Filter: Has Website2 | Filter | Keep places with website | Split Places Array2 | Remove Duplicates: Emails |  |
| Remove Duplicates: Emails | Code | Deduplicate before scraping | Filter: Has Website2 | Loop Over Items |  |
| Loop Over Items | Split In Batches | Iterate through places for scraping | Remove Duplicates: Emails; Scrape Website2 | Extract Emails2; Wait (Rate Limit)2 |  |
| Wait (Rate Limit)2 | Wait | Throttle scraping | Loop Over Items | Scrape Website2 |  |
| Scrape Website2 | HTTP Request | Fetch website HTML | Wait (Rate Limit)2 | Loop Over Items |  |
| Extract Emails2 | Code | Extract emails from HTML/content | Loop Over Items | Filter: Has Email2 |  |
| Filter: Has Email2 | IF | Route only items with emails | Extract Emails2 | Append Leads (Dedupe by Place ID)1 |  |
| Append Leads (Dedupe by Place ID)1 | Google Sheets | Append qualified leads to Leads sheet | Filter: Has Email2 (true) | Prepare Grid Update |  |
| Prepare Grid Update | Code | Build grid row updates (searched=true) | Append Leads (Dedupe by Place ID)1 | Mark Grid Points as Searched |  |
| Mark Grid Points as Searched | Google Sheets | Update grid points as searched | Prepare Grid Update | — |  |
| Schedule Trigger | Schedule Trigger | Start email campaign run | — | Get row(s) in sheet |  |
| Get row(s) in sheet | Google Sheets | Read leads to email | Schedule Trigger | Filter: Remove Fake Emails |  |
| Filter: Remove Fake Emails | Filter | Exclude invalid/fake emails | Get row(s) in sheet | Assign Alternating Templates |  |
| Assign Alternating Templates | Code | Choose template A/B | Filter: Remove Fake Emails | Loop Over Items1 |  |
| Loop Over Items1 | Split In Batches | Iterate sending | Assign Alternating Templates; Send an email | Wait |  |
| Wait | Wait | Throttle sending | Loop Over Items1 | Update row in sheet |  |
| Update row in sheet | Google Sheets | Mark lead row status/template | Wait | Send an email |  |
| Send an email | SendGrid | Send outbound email | Update row in sheet | Loop Over Items1 |  |
| Webhook | Webhook | HTTP endpoint to fetch leads | — | Get row(s) in sheet1 |  |
| Get row(s) in sheet1 | Google Sheets | Read leads for webhook response | Webhook | Filter: Remove Fake Emails1 |  |
| Filter: Remove Fake Emails1 | Filter | Exclude invalid/fake emails | Get row(s) in sheet1 | Respond to Webhook |  |
| Respond to Webhook | Respond to Webhook | Return response payload | Filter: Remove Fake Emails1 | — |  |
| Sticky Note | Sticky Note | Comment container | — | — |  |
| Sticky Note1 | Sticky Note | Comment container | — | — |  |
| Sticky Note2 | Sticky Note | Comment container | — | — |  |
| Sticky Note3 | Sticky Note | Comment container | — | — |  |
| Sticky Note4 | Sticky Note | Comment container | — | — |  |
| Sticky Note5 | Sticky Note | Comment container | — | — |  |

---

## 4. Reproducing the Workflow from Scratch

1) **Create Google Sheets assets**
   1. Create a Spreadsheet with at least:
      - **Grid** sheet: columns such as `gridId`, `lat`, `lng`, `searched`, `searchedAt` (and optionally `lastResultCount`).
      - **Leads** sheet: columns such as `placeId`, `businessName`, `website`, `email(s)`, `phone`, `address`, `status`, `templateVariant`, `sentAt`.
   2. Prepare one “control” row/sheet if you want to store run metadata (used by “Update row in sheet1”).

2) **One-time grid setup**
   1. Add **Code** node: **Generate Location Grid (ONE-TIME)**  
      - Implement JS to output one item per grid point (lat/lng).  
      - Include `searched=false`.
   2. Add **Google Sheets** node: **Save Grid to Sheet (ONE-TIME)**  
      - Operation: Append (recommended).  
      - Map fields to Grid columns.
      - Configure Google Sheets credentials.
   3. Connect **Generate Location Grid (ONE-TIME)** → **Save Grid to Sheet (ONE-TIME)**.
   4. Execute once; then **disable both nodes**.

3) **Daily Places discovery pipeline**
   1. Add **Schedule Trigger**: **Daily Trigger** (set to daily, choose timezone).
   2. Add **Google Sheets**: **Read Grid Points** (read Grid sheet).
   3. Add **Code**: **Code in JavaScript**  
      - Normalize rows, decide what to read next, optionally prepare metadata.
   4. Add **Google Sheets**: **Read Grid Points1** (if needed; otherwise you can merge this into the first read).
   5. Add **Google Sheets**: **Update row in sheet1** (optional dashboard/control row update).
   6. Connect: **Daily Trigger** → **Read Grid Points** → **Code in JavaScript** → **Read Grid Points1**.
   7. Connect: **Code in JavaScript** → **Update row in sheet1**.
   8. Add **Code**: **Filter & Randomize Daily Batch**  
      - Filter out `searched=true`, randomize, take N.
   9. Connect **Read Grid Points1** → **Filter & Randomize Daily Batch**.

4) **Google Places API calls**
   1. Add **HTTP Request**: **Google Nearby Search**  
      - Configure Google API key (as credential or header/query param).  
      - Use `location={{$json.lat}},{{$json.lng}}`, plus `radius` and `keyword/type`.
   2. Add **Code**: **Parse Nearby Results** to extract `place_id` list.
   3. Add **HTTP Request**: **Get Place Details2**  
      - Use `place_id={{$json.place_id}}` and request fields including `website`.
   4. Add **Code**: **Extract Contact Info2** to map to lead candidate schema.
   5. Add **Split Out**: **Split Places Array2** (split candidate array to items).
   6. Connect in order:
      - Filter & Randomize Daily Batch → Google Nearby Search → Parse Nearby Results → Get Place Details2 → Extract Contact Info2 → Split Places Array2

5) **Scrape websites and extract emails**
   1. Add **Filter**: **Filter: Has Website2** (keep only items with website).
   2. Add **Code**: **Remove Duplicates: Emails** (dedupe by `placeId` and/or `website`).
   3. Add **Split In Batches**: **Loop Over Items** (batch size 1 recommended).
   4. Add **Wait**: **Wait (Rate Limit)2** (e.g., 1–3 seconds).
   5. Add **HTTP Request**: **Scrape Website2**
      - URL: `{{$json.website}}`
      - Enable follow redirects
      - Set timeout
      - Turn on **Continue On Fail**
   6. Add **Code**: **Extract Emails2** (regex extraction, return `emails` field).
   7. Add **IF**: **Filter: Has Email2** (true if at least one email).
   8. Add **Google Sheets**: **Append Leads (Dedupe by Place ID)1**
      - Append to Leads sheet
      - Implement dedupe either:
        - by checking existing `placeId` rows first (preferred), or
        - by using sheet-level unique constraints/scripts.
   9. Wire:
      - Split Places Array2 → Filter: Has Website2 → Remove Duplicates: Emails → Loop Over Items
      - Loop Over Items → Wait (Rate Limit)2 → Scrape Website2 → Loop Over Items (loop)
      - Loop Over Items → Extract Emails2 → Filter: Has Email2 (true) → Append Leads (Dedupe by Place ID)1

6) **Mark grid points as searched**
   1. Add **Code**: **Prepare Grid Update** (build update payload for the specific grid points processed).
   2. Add **Google Sheets**: **Mark Grid Points as Searched** (update operation).
   3. Connect: **Append Leads (Dedupe by Place ID)1** → **Prepare Grid Update** → **Mark Grid Points as Searched**.

7) **Scheduled email sending via SendGrid**
   1. Add **Schedule Trigger**: **Schedule Trigger** (e.g., every weekday/hourly).
   2. Add **Google Sheets**: **Get row(s) in sheet** (read Leads where `status != sent`).
   3. Add **Filter**: **Filter: Remove Fake Emails** (exclude bad patterns).
   4. Add **Code**: **Assign Alternating Templates** (set template fields / A-B variant).
   5. Add **Split In Batches**: **Loop Over Items1** (batch size 1).
   6. Add **Wait**: **Wait** (delay between sends).
   7. Add **Google Sheets**: **Update row in sheet** (set `status`, `templateVariant`, `sentAt` or “queued”).
   8. Add **SendGrid**: **Send an email**
      - Configure SendGrid API key credential.
      - Use dynamic template ID or raw subject/body from prior node.
   9. Connect: Schedule Trigger → Get row(s) in sheet → Filter → Assign Alternating Templates → Loop Over Items1 → Wait → Update row in sheet → Send an email → Loop Over Items1 (continue loop).

8) **Webhook endpoint (optional dashboard/API)**
   1. Add **Webhook** node: **Webhook** (choose path and method; add auth if needed).
   2. Add **Google Sheets**: **Get row(s) in sheet1** (read Leads subset).
   3. Add **Filter**: **Filter: Remove Fake Emails1**.
   4. Add **Respond to Webhook**: **Respond to Webhook** (return JSON).
   5. Connect: Webhook → Get row(s) in sheet1 → Filter → Respond to Webhook.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Several sticky notes exist but contain no text in the provided workflow JSON. | Sticky Note nodes have empty `content`. |
| One-time nodes should be executed once and disabled to avoid regenerating/rewriting grid data. | “Generate Location Grid (ONE-TIME)”, “Save Grid to Sheet (ONE-TIME)” node notes. |
| Scraping node is configured to continue on failure to prevent the run from stopping on blocked/time-out websites. | “Scrape Website2” has `continueOnFail=true`. |

If you want, paste the missing node parameters (Google Sheets ranges, HTTP URLs, Code content). With that, I can document the exact field mappings, expressions, and the precise loop behavior (the current SplitInBatches wiring is atypical and depends heavily on its internal configuration).