Aggregate commercial property listings with ScrapeGraphAI, Baserow and Teams

https://n8nworkflows.xyz/workflows/aggregate-commercial-property-listings-with-scrapegraphai--baserow-and-teams-12233


# Aggregate commercial property listings with ScrapeGraphAI, Baserow and Teams

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Aggregate commercial property listings with ScrapeGraphAI, Baserow and Teams  
**Workflow name (internal):** Property Listing Aggregator with Microsoft Teams and Baserow

**Purpose:**  
Once per week, the workflow scrapes multiple commercial real-estate search pages, extracts structured listings via ScrapeGraphAI, normalizes them into a consistent schema, deduplicates against a Baserow table (create new rows or update changed rows), and posts notifications to a Microsoft Teams channel for new/updated listings.

**Target use cases:**
- Tracking new/changed office/commercial availability across multiple broker portals
- Maintaining a lightweight “listings database” in Baserow
- Pushing concise alerts to Teams for business stakeholders

### Logical blocks
1.1 **Trigger & URL Preparation**: weekly schedule + curated list of target search URLs  
1.2 **Parallel Scraping & Collection**: batch through URLs, scrape each page, merge results  
1.3 **Normalisation & Flattening**: standardize fields, output one item per listing  
1.4 **Per-Listing Deduplication & Storage**: check Baserow, decide create/update/skip, write rows  
1.5 **Teams Notifications**: format HTML messages and post for creates/updates

---

## 2. Block-by-Block Analysis

### 2.1 Trigger & URL Preparation

**Overview:**  
Starts the workflow weekly and produces one n8n item per target search URL to scrape.

**Nodes involved:**
- Weekly Trigger
- Prepare URL List

#### Node: Weekly Trigger
- **Type / role:** `Schedule Trigger` — entry point; time-based execution.
- **Configuration (interpreted):** Runs on an interval of **every 1 week**.
- **Inputs/outputs:** No input. Output triggers **Prepare URL List**.
- **Version notes:** Node typeVersion `1.1`.
- **Edge cases / failures:**
  - If n8n instance is down during the scheduled time, the run may be missed depending on hosting/queue settings.
  - Timezone behavior depends on n8n instance settings.

#### Node: Prepare URL List
- **Type / role:** `Code` — defines monitored URLs and returns them as items.
- **Configuration choices:**
  - JavaScript array `urls` is hardcoded with example sources.
  - Returns `[{ json: { url } }, ...]` so each downstream item contains a single `url`.
- **Key variables/expressions:**
  - Output field: `$json.url`
- **Inputs/outputs:**
  - Input: schedule trigger event (not used).
  - Output: goes to **Split URLs**.
- **Version notes:** Code node typeVersion `2`.
- **Edge cases / failures:**
  - Invalid URL formats or blocked pages will later fail scraping.
  - Very large URL lists can increase runtime/cost and can hit rate limits.

---

### 2.2 Parallel Scraping & Collection

**Overview:**  
Iterates through the URL items and scrapes each page using ScrapeGraphAI, then merges results into a consolidated stream.

**Nodes involved:**
- Split URLs
- Scrape Listings
- Collect Listings

#### Node: Split URLs
- **Type / role:** `Split In Batches` — controls iteration over URL items and enables concurrent/stream-like processing.
- **Configuration choices:**
  - Uses default options (batch size not explicitly set).
- **Inputs/outputs:**
  - Input: items from **Prepare URL List**
  - Output: connected to **Scrape Listings** and also to **Collect Listings** (second input index)
- **Version notes:** typeVersion `3`.
- **Edge cases / failures:**
  - If batch size defaults to 1, it may process sequentially; “parallelism” depends on n8n execution model and node behavior. Don’t assume true parallel runs unless configured in instance/execution settings.

#### Node: Scrape Listings
- **Type / role:** `ScrapeGraphAI` — fetches/renders page and extracts structured data using the prompt.
- **Configuration choices:**
  - `websiteUrl`: `={{ $json.url }}`
  - `userPrompt`: requests a top-level JSON key `"listings"` containing an array of listing objects with fields:
    `id, address, price, size_sqft, listing_url, broker_name, broker_phone, availability_date`
  - Prompt instructs: numeric values as numbers; dates ISO 8601.
- **Inputs/outputs:**
  - Input: URL item from **Split URLs**
  - Output: to **Collect Listings** (input index 0)
- **Version notes:** typeVersion `1` (community node: `n8n-nodes-scrapegraphai.scrapegraphAi`).
- **Edge cases / failures:**
  - ScrapeGraphAI auth/credential errors.
  - Target site blocks bots, requires consent, or uses heavy anti-scraping.
  - Output may not match prompt (missing `listings`, strings instead of numbers, etc.).
  - Timeouts on slow pages or JS-heavy rendering.

#### Node: Collect Listings
- **Type / role:** `Merge` in **combine** mode — reunites streams so downstream sees consolidated results.
- **Configuration choices:**
  - Mode: `combine` (not “append”).
  - Connected with two inputs:
    - Input 0: scraped output from **Scrape Listings**
    - Input 1: passthrough items from **Split URLs**
- **Inputs/outputs:**
  - Output: to **Normalise Listings**
- **Version notes:** typeVersion `2`.
- **Edge cases / failures:**
  - **Important:** `Merge` “combine” pairs items by position across inputs. If item counts don’t match (e.g., scrape fails for one URL), you can get misaligned pairing or dropped/partial data depending on execution.
  - If the intent is “collect all results into one list”, `append` (or a different merge/aggregation pattern) is usually safer. As built, it relies on consistent 1:1 pairing.

---

### 2.3 Normalisation & Flattening

**Overview:**  
Transforms heterogeneous scrape results into a consistent listing schema and returns **one n8n item per listing**.

**Nodes involved:**
- Normalise Listings
- Loop Listings

#### Node: Normalise Listings
- **Type / role:** `Code` — flattens `listings[]` arrays and normalizes fields.
- **Configuration choices (logic):**
  - Reads all incoming items: `const items = $input.all()`
  - For each item:
    - `sourceUrl` derived from `item.json.url || item.json.source || ''`
    - `results` from `item.json.listings || []`
  - For each `entry` in `results`, outputs:
    - `listing_id`: `entry.id || entry.listing_id || entry.listing_url || entry.url`
    - `address`: default `''`
    - `price`: default `null`
    - `size_sqft`: default `null`
    - `listing_url`: `entry.listing_url || entry.url || ''`
    - broker fields default `''`
    - `availability_date`: default `null`
    - `source`: `sourceUrl`
    - `scraped_at`: current ISO timestamp
- **Inputs/outputs:**
  - Input: merged items from **Collect Listings**
  - Output: items to **Loop Listings**
- **Version notes:** Code node typeVersion `2`.
- **Edge cases / failures:**
  - If ScrapeGraphAI returns a different structure (e.g., nested under another key), `results` becomes empty and you silently output nothing.
  - If `listing_id` ends up empty (no id/url), deduplication will not work and Baserow checks may be ineffective.
  - Numeric coercion is *not enforced*: `entry.price || null` will keep strings (e.g., `"1,200"`) if provided. This can cause false “changed” comparisons later.

#### Node: Loop Listings
- **Type / role:** `Split In Batches` — iterates listing-by-listing for Baserow operations.
- **Configuration choices:**
  - Default options (batch sizing not explicitly configured).
- **Inputs/outputs:**
  - Output goes to:
    - **Check Existing (Baserow List)** (to query existing rows)
    - **Merge Listing & Result** (to provide listing payload for combine)
- **Version notes:** typeVersion `3`.
- **Edge cases / failures:**
  - Large listing volume can produce many Baserow API calls (rate limiting).
  - If default batch size is large, you may create heavy API bursts.

---

### 2.4 Deduplication & Storage (Baserow)

**Overview:**  
For each listing, queries Baserow to find an existing row, decides whether to create/update/skip, then writes changes.

**Nodes involved:**
- Check Existing (Baserow List)
- Merge Listing & Result
- Determine Action
- Need Create?
- Create Row
- Need Update?
- Update Row

#### Node: Check Existing (Baserow List)
- **Type / role:** `Baserow` — reads rows from the table (intended as “does listing exist?”).
- **Configuration choices:**
  - Operation: `list`
  - `tableId`: `={{ $env.BASEROW_TABLE_ID || '1' }}`
  - **No filters are configured** (no “filter by listing_id”).
- **Inputs/outputs:**
  - Input: each listing from **Loop Listings**
  - Output: to **Merge Listing & Result** (input index 1)
- **Version notes:** Baserow node typeVersion `1`.
- **Edge cases / failures:**
  - Missing/incorrect Baserow credentials, wrong table ID, permission errors.
  - **Major logic issue:** without filtering by `listing_id`, `list` returns the first page of rows, not the match for the current listing. Downstream “existing[0]” will refer to an arbitrary row and can trigger incorrect updates/skips.
  - Pagination: if table is large, the relevant row may not be in the first page even if it exists.

#### Node: Merge Listing & Result
- **Type / role:** `Merge` combine — pairs the current listing item with the Baserow list response.
- **Configuration choices:**
  - Mode: `combine`
  - Input 0: listing from **Loop Listings**
  - Input 1: Baserow response from **Check Existing (Baserow List)**
- **Inputs/outputs:** Output to **Determine Action**
- **Version notes:** typeVersion `2`.
- **Edge cases / failures:**
  - Same “combine pairing by position” risk as earlier. It works only if there is exactly one Baserow response item per listing item and ordering stays aligned.

#### Node: Determine Action
- **Type / role:** `Code` — decides create/update/skip and extracts row ID.
- **Configuration choices (logic):**
  - Reads both combined inputs: `const [listingData, baserowResponse] = $input.all().map(i => i.json);`
  - `existing` rows from `baserowResponse.results` else `[]`
  - Default action: `create`
  - If `existing.length > 0`:
    - `rowId = existing[0].id`
    - `changed` if `price`, `size_sqft`, or `availability_date` differ
    - action `update` if changed else `skip`
  - Output fields: merges listing + `_action` + `_rowId`
- **Inputs/outputs:** to **Need Create?**
- **Version notes:** Code node typeVersion `2`.
- **Edge cases / failures:**
  - If Baserow returns a different response shape, `baserowResponse.results` may be undefined.
  - Comparisons are strict `!==` and do not normalize types; `"1200"` vs `1200` will mark as changed.
  - Because upstream list query is unfiltered, `existing[0]` is likely not the matching listing.

#### Node: Need Create?
- **Type / role:** `IF` — routes creates vs “not create”.
- **Configuration choices:**
  - Condition: `$json._action == 'create'`
- **Outputs:**
  - **True** → **Create Row**
  - **False** → **Need Update?**
- **Version notes:** IF node typeVersion `2`.
- **Edge cases / failures:**
  - If `_action` missing, it routes to false branch (and then potentially “Need Update?” false ends the path).

#### Node: Create Row
- **Type / role:** `Baserow` — inserts a new row.
- **Configuration choices:**
  - Operation: `create`
  - `tableId`: `={{ $env.BASEROW_TABLE_ID || '1' }}`
  - **Field mapping is not configured in this workflow JSON** (node has no explicit fields set).
- **Inputs/outputs:** to **Create Message**
- **Version notes:** typeVersion `1`.
- **Edge cases / failures:**
  - Without field mappings, the create may insert blank/default rows (depending on node defaults/UI config not present here).
  - Schema mismatch: if Baserow requires non-null fields, create fails.
  - Rate limiting on frequent creates.

#### Node: Need Update?
- **Type / role:** `IF` — routes updates vs stop.
- **Configuration choices:**
  - Condition: `$json._action == 'update'`
- **Outputs:**
  - **True** → **Update Row**
  - **False** → (no further node; effectively skip)
- **Version notes:** typeVersion `2`.

#### Node: Update Row
- **Type / role:** `Baserow` — updates an existing row.
- **Configuration choices:**
  - Operation: `update`
  - `tableId`: `={{ $env.BASEROW_TABLE_ID || '1' }}`
  - `rowId`: `={{ $json._rowId }}`
  - **Field mapping is not configured in this workflow JSON** (node has no explicit fields set).
- **Inputs/outputs:** to **Update Message**
- **Version notes:** typeVersion `1`.
- **Edge cases / failures:**
  - `_rowId` null/undefined → update fails.
  - Without field mappings, update may do nothing or overwrite incorrectly depending on defaults.
  - Concurrency: if rows are edited manually, last-write wins.

---

### 2.5 Teams Notifications

**Overview:**  
Formats HTML messages for new and updated listings and posts them to Microsoft Teams.

**Nodes involved:**
- Create Message
- Teams – New Listing
- Update Message
- Teams – Update

#### Node: Create Message
- **Type / role:** `Set` — should build `$json.message` HTML for new listings.
- **Configuration choices:**
  - Node has default/empty parameters; **no fields are defined** in JSON.
- **Inputs/outputs:** to **Teams – New Listing**
- **Version notes:** Set node typeVersion `3`.
- **Edge cases / failures:**
  - As configured here, `$json.message` will not exist, so Teams message expression will resolve to empty/undefined.

#### Node: Teams – New Listing
- **Type / role:** `Microsoft Teams` — posts an HTML chat message.
- **Configuration choices:**
  - Resource: `chatMessage`
  - `contentType`: `html`
  - `message`: `={{ $json.message }}`
  - `chatId`: configured as list mode but **value is empty** in JSON.
- **Inputs/outputs:** terminal node for create notifications.
- **Version notes:** typeVersion `2`.
- **Edge cases / failures:**
  - Missing OAuth2 credentials / consent / tenant policy blocks.
  - Empty `chatId` means it cannot post anywhere until configured.
  - HTML content limitations in Teams: some tags may be stripped.

#### Node: Update Message
- **Type / role:** `Set` — should build `$json.message` HTML for updated listings.
- **Configuration choices:**
  - Node has default/empty parameters; **no fields are defined** in JSON.
- **Inputs/outputs:** to **Teams – Update**
- **Version notes:** Set node typeVersion `3`.
- **Edge cases / failures:**
  - Same as Create Message: message likely empty.

#### Node: Teams – Update
- **Type / role:** `Microsoft Teams` — posts an HTML chat message.
- **Configuration choices:**
  - Resource: `chatMessage`
  - `contentType`: `html`
  - `message`: `={{ $json.message }}`
  - `chatId`: list mode but **value is empty** in JSON.
- **Inputs/outputs:** terminal node for update notifications.
- **Version notes:** typeVersion `2`.
- **Edge cases / failures:** same as Teams – New Listing.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Workflow Overview | Sticky Note | Documentation / context | — | — | ## How it works … (full note about weekly scrape, normalize, Baserow create/update, Teams alerts) + Setup steps 1–7 |
| Section – Trigger & URL Prep | Sticky Note | Documentation / section header | — | — | ## Trigger & URL Preparation … (weekly trigger + edit URL list in code; rate limit/quota note) |
| Weekly Trigger | Schedule Trigger | Weekly entry point | — | Prepare URL List | ## Trigger & URL Preparation … |
| Prepare URL List | Code | Defines target portal search URLs | Weekly Trigger | Split URLs | ## Trigger & URL Preparation … |
| Section – Parallel Scraping | Sticky Note | Documentation / section header | — | — | ## Parallel Scraping … (Split in Batches + ScrapeGraphAI + Merge) |
| Split URLs | Split In Batches | Iterate through URL items | Prepare URL List | Scrape Listings; Collect Listings | ## Parallel Scraping … |
| Scrape Listings | ScrapeGraphAI | Extract listings JSON from each page | Split URLs | Collect Listings | ## Parallel Scraping … |
| Collect Listings | Merge | Combine scrape results for downstream | Scrape Listings; Split URLs | Normalise Listings | ## Parallel Scraping … |
| Section – Normalisation & Flattening | Sticky Note | Documentation / section header | — | — | ## Normalisation & Flattening … (schema standardization, null handling, source stamping) |
| Normalise Listings | Code | Flatten/normalize each listing | Collect Listings | Loop Listings | ## Normalisation & Flattening … |
| Loop Listings | Split In Batches | Iterate listing-by-listing | Normalise Listings | Check Existing (Baserow List); Merge Listing & Result | ## Normalisation & Flattening … |
| Section – Deduplication & Storage | Sticky Note | Documentation / section header | — | — | ## Deduplication & Storage … (check listing_id, create/update, compare fields) |
| Check Existing (Baserow List) | Baserow | Query existing rows (intended by listing_id) | Loop Listings | Merge Listing & Result | ## Deduplication & Storage … |
| Merge Listing & Result | Merge | Pair listing with Baserow query result | Loop Listings; Check Existing (Baserow List) | Determine Action | ## Deduplication & Storage … |
| Determine Action | Code | Decide create/update/skip and set rowId | Merge Listing & Result | Need Create? | ## Deduplication & Storage … |
| Need Create? | IF | Route create vs update/skip | Determine Action | Create Row; Need Update? | ## Deduplication & Storage … |
| Create Row | Baserow | Insert listing row | Need Create? | Create Message | ## Deduplication & Storage … |
| Need Update? | IF | Route update vs skip | Need Create? | Update Row | ## Deduplication & Storage … |
| Update Row | Baserow | Update existing row | Need Update? | Update Message | ## Deduplication & Storage … |
| Section – Teams Notifications | Sticky Note | Documentation / section header | — | — | ## Teams Notifications … (Set HTML message + post to channel; can disable notifications) |
| Create Message | Set | Build HTML message for new listing | Create Row | Teams – New Listing | ## Teams Notifications … |
| Teams – New Listing | Microsoft Teams | Post “new listing” message | Create Message | — | ## Teams Notifications … |
| Update Message | Set | Build HTML message for updated listing | Update Row | Teams – Update | ## Teams Notifications … |
| Teams – Update | Microsoft Teams | Post “update listing” message | Update Message | — | ## Teams Notifications … |

---

## 4. Reproducing the Workflow from Scratch

1) **Create a new workflow**
- Name it (e.g.) “Property Listing Aggregator with Microsoft Teams and Baserow”.
- Ensure **Settings → Execution Order** is set to `v1` (to match JSON), if you need parity.

2) **Add trigger**
- Add node: **Schedule Trigger**
- Set interval: **Every 1 week**
- Connect it to the next node.

3) **Add URL preparation**
- Add node: **Code** named “Prepare URL List”
- Paste logic that returns one item per URL, e.g.:
  - Create `const urls = [...]`
  - `return urls.map(url => ({ json: { url } }));`
- Put your real portal/search URLs into this array.
- Connect **Weekly Trigger → Prepare URL List**.

4) **Add URL batching**
- Add node: **Split In Batches** named “Split URLs”
- Keep defaults or set a batch size (commonly 1–5 depending on quotas).
- Connect **Prepare URL List → Split URLs**.

5) **Add scraping**
- Add node: **ScrapeGraphAI** named “Scrape Listings”
- Configure credentials: **ScrapeGraphAI API** credential in n8n.
- Set:
  - Website URL: expression `{{$json.url}}`
  - User prompt to request JSON `{ listings: [...] }` with your desired fields.
- Connect **Split URLs → Scrape Listings**.

6) **Merge per-URL results**
- Add node: **Merge** named “Collect Listings”
- Set mode: **Combine**
- Connect:
  - **Scrape Listings → Collect Listings (Input 1 / index 0)**
  - **Split URLs → Collect Listings (Input 2 / index 1)**

7) **Normalize / flatten**
- Add node: **Code** named “Normalise Listings”
- Implement logic to:
  - Read all inputs
  - Extract `item.json.listings` arrays
  - Output one item per listing with stable keys (listing_id, address, price, size_sqft, listing_url, broker_name, broker_phone, availability_date, source, scraped_at)
- Connect **Collect Listings → Normalise Listings**.

8) **Loop listings**
- Add node: **Split In Batches** named “Loop Listings”
- Connect **Normalise Listings → Loop Listings**.

9) **Configure Baserow credentials and table**
- In n8n, create a **Baserow credential** (API token + base URL if needed).
- Decide how you will supply table ID:
  - Option A (as in JSON): environment variable `BASEROW_TABLE_ID`
  - Option B: hardcode the table ID in nodes

10) **Check existing listing in Baserow**
- Add node: **Baserow** named “Check Existing (Baserow List)”
- Operation: **List**
- Table ID: `{{$env.BASEROW_TABLE_ID || '1'}}` (or your real ID)
- **Important to make it correct:** configure a **filter** to match your schema, typically:
  - Filter where `listing_id` equals `{{$json.listing_id}}`
- Connect **Loop Listings → Check Existing (Baserow List)**.

11) **Merge listing with query response**
- Add node: **Merge** named “Merge Listing & Result”
- Mode: **Combine**
- Connect:
  - **Loop Listings → Merge Listing & Result (Input 1 / index 0)**
  - **Check Existing (Baserow List) → Merge Listing & Result (Input 2 / index 1)**

12) **Determine create/update/skip**
- Add node: **Code** named “Determine Action”
- Logic:
  - If no matching rows → `_action='create'`
  - If one match:
    - Compare fields (price/size/availability_date) to decide `_action='update'` or `_action='skip'`
    - Set `_rowId` to matched row id
- Connect **Merge Listing & Result → Determine Action**.

13) **Route create vs update**
- Add node: **IF** named “Need Create?”
- Condition: String equals: `{{$json._action}}` equals `create`
- Connect **Determine Action → Need Create?**

14) **Create row path**
- Add node: **Baserow** named “Create Row”
- Operation: **Create**
- Table ID: same as above
- Map Baserow fields to listing fields (example):
  - `listing_id` ← `{{$json.listing_id}}`
  - `address` ← `{{$json.address}}`
  - `price` ← `{{$json.price}}`
  - etc.
- Connect **Need Create? (true) → Create Row**

15) **Update row path**
- Add node: **IF** named “Need Update?”
- Condition: `{{$json._action}}` equals `update`
- Connect **Need Create? (false) → Need Update?**
- Add node: **Baserow** named “Update Row”
  - Operation: **Update**
  - Row ID: `{{$json._rowId}}`
  - Map the same fields as in create
- Connect **Need Update? (true) → Update Row**

16) **Teams credentials**
- Create Microsoft Teams OAuth2 credentials in n8n (Microsoft Graph).
- Ensure required scopes for posting messages to the target context (chat/channel) are granted per your tenant policy.

17) **Create Teams message for new listings**
- Add node: **Set** named “Create Message”
- Add a field `message` (string) containing HTML, e.g. include:
  - address, price, size, and a link to `listing_url`
- Connect **Create Row → Create Message**
- Add node: **Microsoft Teams** named “Teams – New Listing”
  - Resource: `chatMessage`
  - Content type: `html`
  - Chat/Channel targeting: select the correct Team/Channel or Chat ID in the node UI
  - Message: `{{$json.message}}`
- Connect **Create Message → Teams – New Listing**

18) **Create Teams message for updates**
- Add node: **Set** named “Update Message”
- Add field `message` (HTML) indicating the listing was updated and what key values are now.
- Connect **Update Row → Update Message**
- Add node: **Microsoft Teams** named “Teams – Update”
  - Same configuration style as above, same destination
  - Message: `{{$json.message}}`
- Connect **Update Message → Teams – Update**

19) **Test run**
- Run once manually.
- Verify:
  - ScrapeGraphAI returns `listings[]`
  - Normalized items have `listing_id`
  - Baserow filter finds exact matches
  - Create/update correctly maps fields
  - Teams posts messages to the intended destination

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| This workflow checks multiple commercial-real-estate portals once a week, scrapes listings via ScrapeGraphAI, normalizes them, upserts into Baserow, and posts alerts into Microsoft Teams. | From sticky note “Workflow Overview” |
| Setup steps: add ScrapeGraphAI credential; edit URL list; create Baserow base/table and map fields; connect Teams OAuth2 and set Team/Channel IDs; run once to seed; leave enabled for weekly alerts. | From sticky note “Workflow Overview” |
| Keep URL list focused to avoid rate limits and ScrapeGraphAI quota exhaustion; prefer broad search pages over many paginated links. | From sticky note “Trigger & URL Preparation” |
| AI semantic scraping is more resilient than brittle selectors; ScrapeGraphAI expected output includes a `listings` array. | From sticky note “Parallel Scraping” |
| Normalization stamps `source` and `scraped_at`, converts invalid/missing numeric values to null for easier filtering. | From sticky note “Normalisation & Flattening” |
| Storage block intends exact-match deduplication by `listing_id` and updates only on meaningful changes to avoid noisy alerts. | From sticky note “Deduplication & Storage” |
| Teams notifications are separated from storage so you can disable alerts without stopping data collection. | From sticky note “Teams Notifications” |