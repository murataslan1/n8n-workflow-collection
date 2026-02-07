Automate commercial real estate monitoring with ScrapeGraphAI, Notion and Mailchimp

https://n8nworkflows.xyz/workflows/automate-commercial-real-estate-monitoring-with-scrapegraphai--notion-and-mailchimp-11927


# Automate commercial real estate monitoring with ScrapeGraphAI, Notion and Mailchimp

## 1. Workflow Overview

**Purpose:** Monitor commercial real-estate listing pages, extract structured listings using ScrapeGraphAI, validate/enrich each listing (including **price per sqft**), store qualifying opportunities in **Notion**, and send an immediate alert email via **Mailchimp**.

**Primary use cases**
- Ongoing deal flow monitoring across multiple broker/marketplace pages
- Building a searchable internal database (Notion) of listings that match criteria
- Automated subscriber alerts for newly discovered “affordable” properties

### 1.1 Trigger & URL Configuration
Manual start, define target listing-page URLs, then loop through them one by one.

### 1.2 AI Scraping & Normalization
Scrape each target page into a JSON array of listings, then flatten into one n8n item per listing and loop through them.

### 1.3 Validation, Enrichment & Filtering Rules
Validate critical fields, clean numeric values, compute `pricePerSqft`, route errors away, and filter by affordability threshold.

### 1.4 Storage (Notion) & Notification (Mailchimp)
Create a Notion entry for qualifying listings, then create + populate + send a Mailchimp campaign.

---

## 2. Block-by-Block Analysis

### Block 1 — Trigger & URL Configuration

**Overview:** Starts execution manually and produces a list of target URLs to scrape, then iterates through them using batching.

**Nodes involved:** Start Workflow, Prepare Target URLs, Loop URLs

#### Node: Start Workflow
- **Type / role:** Manual Trigger (`n8n-nodes-base.manualTrigger`) — entry point.
- **Config choices:** No parameters; user clicks *Execute workflow*.
- **I/O:** Outputs a single empty item to kick off downstream logic.
- **Edge cases:** None (manual trigger), except user expectations (it won’t run on a schedule).

#### Node: Prepare Target URLs
- **Type / role:** Code (`n8n-nodes-base.code`) — emits one item per target URL.
- **Configuration (interpreted):**
  - Returns an array of items like `{ json: { url: 'https://...' } }`.
  - Currently uses two placeholder URLs:
    - `https://example-commercial1.com/listings`
    - `https://example-commercial2.com/properties`
- **Key variables/expressions:** N/A (pure JS).
- **I/O:**
  - **Input:** From Manual Trigger.
  - **Output:** Multiple items with `json.url`.
- **Edge cases / failures:**
  - Invalid URL strings lead to downstream scraping failures.
  - Returning an empty array yields no scraping activity (workflow “does nothing” after this point).

#### Node: Loop URLs
- **Type / role:** Split In Batches (`n8n-nodes-base.splitInBatches`) — iterates over URL items.
- **Configuration (interpreted):**
  - Uses default options; batch size not explicitly set in the JSON.
- **I/O:**
  - **Input:** Items from Prepare Target URLs.
  - **Output:** Batched items to Scrape Listing Page.
- **Edge cases / failures:**
  - If batch size is large and sites rate-limit, scraping may fail intermittently.
  - If you later add delays/rate control, do it here (or between this node and scraping).

---

### Block 2 — AI Scraping & Normalization

**Overview:** Scrapes each URL using a natural-language extraction prompt, expecting a JSON object containing a `listings` array, then flattens the array into individual listing items and loops them.

**Nodes involved:** Scrape Listing Page, Flatten Listings, Loop Listings

#### Node: Scrape Listing Page
- **Type / role:** ScrapeGraphAI node (`n8n-nodes-scrapegraphai.scrapegraphAi`) — AI-driven structured extraction.
- **Configuration (interpreted):**
  - **websiteUrl:** `={{ $json.url }}` (from Loop URLs item)
  - **userPrompt:** Instructs the model to:
    - “Extract every commercial real-estate listing on this page”
    - Output an array called `"listings"`
    - For each listing include: `address, city, state, zip, price, size_sqft, availability_status, contact_name, phone, listing_url`
    - “Return ONLY valid JSON.”
- **I/O:**
  - **Input:** One item with `url`.
  - **Output:** Expected: one item whose JSON includes `listings: [ ... ]`.
- **Version-specific notes:** Node `typeVersion: 1`; exact options depend on the installed ScrapeGraphAI community node version.
- **Edge cases / failures:**
  - Credential/API errors (missing/invalid ScrapeGraphAI API key).
  - Target page blocks bots/CAPTCHA; extraction returns empty or error.
  - Model returns JSON that is valid but doesn’t match expected structure (e.g., missing `listings`).
  - Timeout on slow pages.

#### Node: Flatten Listings
- **Type / role:** Code (`n8n-nodes-base.code`) — normalizes scraped output.
- **Configuration (interpreted):**
  - Reads all incoming items; for each, takes `item.json.listings || []`
  - Emits one item per listing, adding `scrapedAt` timestamp (ISO).
- **Key variables:**
  - `scrapedAt`: `new Date().toISOString()`
- **I/O:**
  - **Input:** Scrape result(s) containing `listings`.
  - **Output:** Many items: each is `{ ...listing, scrapedAt }`.
- **Edge cases / failures:**
  - If `listings` is missing or not an array, it becomes `[]` and silently outputs nothing.
  - If listing objects contain unexpected nested structures, later validation may fail.

#### Node: Loop Listings
- **Type / role:** Split In Batches (`n8n-nodes-base.splitInBatches`) — iterates property-by-property.
- **Configuration (interpreted):** Default options; batch size not explicitly set.
- **I/O:**
  - **Input:** Flattened listing items.
  - **Output:** One batch item at a time into validation.
- **Edge cases / failures:**
  - Large listing volumes may cause long execution; batching helps but you may still need rate control for downstream APIs.

---

### Block 3 — Validation, Enrichment & Filtering Rules

**Overview:** Ensures each listing has minimum required fields, cleans numeric values, calculates `pricePerSqft`, and routes invalid items into an error/log branch. Valid items are then filtered by affordability.

**Nodes involved:** Validate & Enrich, Has Error?, Log Error, Affordable?

#### Node: Validate & Enrich
- **Type / role:** Code (`n8n-nodes-base.code`) — validation + transformation.
- **Configuration (interpreted):**
  - Takes the first item (`$input.first().json`) from the current batch.
  - **Critical field check:** throws if missing `address` or `price` or `size_sqft`.
  - **Numeric cleanup:**
    - `price`: `parseFloat(String(item.price).replace(/[^0-9.]/g, ''))`
    - `size_sqft`: `parseFloat(String(item.size_sqft).replace(/[^0-9.]/g, ''))`
  - Computes:
    - `pricePerSqft = +(cleanPrice / cleanSize).toFixed(2)` when both are present
  - Sets `validated = true`
  - On exception: returns `{ error: true, message: e.message }`
- **I/O:**
  - **Input:** One listing item from Loop Listings.
  - **Output:** Either a validated listing item, or an error item.
- **Edge cases / failures:**
  - `parseFloat('')` becomes `NaN`; current logic does not explicitly guard `NaN` (it will propagate).
  - Prices like `"Call for price"` become `NaN` → may pass the “missing critical fields” check if the string exists, but computed values become `NaN`.
  - `size_sqft` could be ranges (“1,000–2,000”) → regex cleanup produces `10002000` and parseFloat yields misleading size.
  - Because it uses `$input.first()`, if a batch ever contains >1 item, only the first is processed.

#### Node: Has Error?
- **Type / role:** IF (`n8n-nodes-base.if`) — routes error items.
- **Configuration (interpreted):**
  - Condition: `{{ $json.error }}` is boolean true.
- **I/O:**
  - **Input:** Output from Validate & Enrich.
  - **Output:** In this workflow’s wiring, only the “true” path is connected (to Log Error).
- **Important wiring note / functional impact:**
  - There is **no connected “false” branch**. As built, *validated items do not proceed to Affordable?*.
  - Additionally, the workflow connects **Log Error → Affordable?**, which means error items are currently pushed into the affordability filter.
- **Edge cases / failures:**
  - If `error` is absent, the IF condition is false and the item will stop here (due to missing connection).

#### Node: Log Error
- **Type / role:** Code (`n8n-nodes-base.code`) — logs validation failures.
- **Configuration (interpreted):**
  - `console.error('Listing failed validation', $json.message);`
  - Returns the same `items` onward.
- **I/O:**
  - **Input:** Error items from Has Error?.
  - **Output:** Passes items along to Affordable? (per current connections).
- **Edge cases / failures:**
  - This node does not “discard” items; it forwards them. If you intend to stop errors, return `[]` instead.
  - Logging only appears in n8n execution logs; it’s not persisted unless you add storage/alerting.

#### Node: Affordable?
- **Type / role:** IF (`n8n-nodes-base.if`) — filters by affordability threshold.
- **Configuration (interpreted):**
  - Condition: `{{ $json.pricePerSqft }}` is **smaller than** `30`
- **I/O:**
  - **Input:** Currently receives items from Log Error (not from validated path).
  - **Output:** “True” path connected to Save to Notion.
- **Edge cases / failures:**
  - If `pricePerSqft` is `NaN`/null/undefined, numeric comparison may evaluate unexpectedly (often false), so items will not pass.
  - Threshold is hard-coded; no config node/variable for markets/cities.

---

### Block 4 — Storage (Notion) & Notification (Mailchimp)

**Overview:** Stores qualifying listings in Notion and then emails subscribers via a Mailchimp campaign created per listing.

**Nodes involved:** Save to Notion, Prepare Mailchimp Content, Create Campaign, Set Campaign Content, Send Campaign

#### Node: Save to Notion
- **Type / role:** Notion (`n8n-nodes-base.notion`) — intended to create a database entry (but currently not fully configured).
- **Configuration (interpreted):**
  - `pageId` is present in “URL mode” but **empty**.
  - No database mapping fields are configured in the provided JSON.
- **I/O:**
  - **Input:** Items passing Affordable?
  - **Output:** Passes Notion API result to Prepare Mailchimp Content.
- **Version-specific notes:** `typeVersion: 2` (Notion node behavior varies across versions).
- **Edge cases / failures:**
  - Will fail until you configure credentials and a target (typically a **Database ID** for “Create database page” operation, or a parent page).
  - Schema mismatches (property types in Notion) cause API errors.
  - Rate limits if many items pass.

#### Node: Prepare Mailchimp Content
- **Type / role:** Set (`n8n-nodes-base.set`) — intended to build email content fields for Mailchimp.
- **Configuration (interpreted):**
  - No fields are defined in the JSON (node is effectively a pass-through right now).
- **I/O:**
  - **Input:** Notion response item.
  - **Output:** Sent to Create Campaign.
- **Edge cases / failures:**
  - Mailchimp content steps typically need `subject`, `from_name`, `reply_to`, `audience/list_id`, and HTML content fields; without them, downstream nodes will fail.

#### Node: Create Campaign
- **Type / role:** Mailchimp (`n8n-nodes-base.mailchimp`) — create an email campaign.
- **Configuration (interpreted):**
  - `resource: campaign`
  - `operation: create`
  - Missing required parameters in JSON (e.g., audience/list, settings) depending on node defaults and Mailchimp API requirements.
- **I/O:**
  - **Input:** From Prepare Mailchimp Content.
  - **Output:** Campaign object including `id` (used later).
- **Edge cases / failures:**
  - Missing Mailchimp credentials/API key.
  - Missing required campaign settings (subject/from/reply-to/list).
  - Compliance settings in Mailchimp account may prevent sends.

#### Node: Set Campaign Content
- **Type / role:** Mailchimp — set HTML/content for the campaign.
- **Configuration (interpreted):**
  - `resource: campaign`
  - `operation: setContent`
  - Campaign ID likely comes from previous node output (exact field mapping not shown in JSON).
- **I/O:**
  - **Input:** Created campaign.
  - **Output:** Confirmation/updated campaign content result.
- **Edge cases / failures:**
  - Content payload missing (because Prepare Mailchimp Content is empty).
  - Campaign ID not found if create step failed or returned unexpected structure.

#### Node: Send Campaign
- **Type / role:** Mailchimp — send the campaign.
- **Configuration (interpreted):**
  - `resource: campaign`
  - `operation: send`
  - `campaignId: ={{ $json.id }}`
- **I/O:**
  - **Input:** Must contain `id` of the campaign.
  - **Output:** Send confirmation.
- **Edge cases / failures:**
  - Attempting to send without required campaign settings/content.
  - Mailchimp may block sending if audience is empty or account is not authorized to send.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Start Workflow | Manual Trigger | Entry point (manual run) | — | Prepare Target URLs | ## Trigger & Configuration … (content about Start Workflow/Prepare Target URLs/Loop URLs) |
| Prepare Target URLs | Code | Defines monitored listing-page URLs | Start Workflow | Loop URLs | ## Trigger & Configuration … |
| Loop URLs | Split In Batches | Iterates through target URLs | Prepare Target URLs | Scrape Listing Page | ## Trigger & Configuration … |
| Scrape Listing Page | ScrapeGraphAI | AI extraction of listings from each URL | Loop URLs | Flatten Listings | ## Smart Scraping … |
| Flatten Listings | Code | Converts `listings[]` into individual items + adds `scrapedAt` | Scrape Listing Page | Loop Listings | ## Smart Scraping … |
| Loop Listings | Split In Batches | Iterates through listings | Flatten Listings | Validate & Enrich | ## Smart Scraping … |
| Validate & Enrich | Code | Validates critical fields, cleans numbers, computes `pricePerSqft` | Loop Listings | Has Error? | ## Data Validation & Filtering … |
| Has Error? | IF | Routes invalid listings | Validate & Enrich | Log Error | ## Data Validation & Filtering … |
| Log Error | Code | Logs validation errors | Has Error? | Affordable? | ## Data Validation & Filtering … |
| Affordable? | IF | Filters by `pricePerSqft < 30` | Log Error | Save to Notion | ## Data Validation & Filtering … |
| Save to Notion | Notion | Store qualifying listing | Affordable? | Prepare Mailchimp Content | ## Storage & Alerts … |
| Prepare Mailchimp Content | Set | Build email fields/content | Save to Notion | Create Campaign | ## Storage & Alerts … |
| Create Campaign | Mailchimp | Create a Mailchimp campaign | Prepare Mailchimp Content | Set Campaign Content | ## Storage & Alerts … |
| Set Campaign Content | Mailchimp | Inject campaign HTML/content | Create Campaign | Send Campaign | ## Storage & Alerts … |
| Send Campaign | Mailchimp | Send the campaign to subscribers | Set Campaign Content | — | ## Storage & Alerts … |
| Workflow Overview | Sticky Note | Global explanation + setup checklist | — | — | ## How it works … (full overview and setup steps) |
| Section – Trigger & Config | Sticky Note | Comment cluster | — | — | (same content as node) |
| Section – Scraping | Sticky Note | Comment cluster | — | — | (same content as node) |
| Section – Validation & Rules | Sticky Note | Comment cluster | — | — | (same content as node) |
| Section – Storage & Notification | Sticky Note | Comment cluster | — | — | (same content as node) |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n.
2. **Add node: Manual Trigger**
   - Name: **Start Workflow**
3. **Add node: Code**
   - Name: **Prepare Target URLs**
   - Code: return an array of items, each with `json.url` (replace placeholders with real listing pages).
4. **Add node: Split In Batches**
   - Name: **Loop URLs**
   - Batch size: choose `1` initially (safe for rate limiting); adjust later.
5. **Connect**: Start Workflow → Prepare Target URLs → Loop URLs
6. **Add node: ScrapeGraphAI**
   - Name: **Scrape Listing Page**
   - Credentials: configure **ScrapeGraphAI API credentials** in n8n.
   - Website URL: expression `{{ $json.url }}`
   - Prompt: request a JSON object containing a `listings` array with the required fields.
7. **Connect**: Loop URLs → Scrape Listing Page
8. **Add node: Code**
   - Name: **Flatten Listings**
   - Implement flattening of `json.listings[]` into one item per listing; add `scrapedAt`.
9. **Add node: Split In Batches**
   - Name: **Loop Listings**
   - Batch size: typically `1` (simplifies validation and downstream API calls).
10. **Connect**: Scrape Listing Page → Flatten Listings → Loop Listings
11. **Add node: Code**
   - Name: **Validate & Enrich**
   - Validate `address`, `price`, `size_sqft`
   - Clean numbers and compute `pricePerSqft`
   - On failure, output `{ error: true, message: '...' }`
12. **Add node: IF**
   - Name: **Has Error?**
   - Condition: `{{ $json.error }}` is true
13. **Add node: Code**
   - Name: **Log Error**
   - Log message and decide whether to stop errors (recommended: return `[]`) or route elsewhere.
14. **Add node: IF**
   - Name: **Affordable?**
   - Condition: `{{ $json.pricePerSqft }}` smaller than `30` (adjust threshold).
15. **Connect (recommended wiring)**
   - Loop Listings → Validate & Enrich → Has Error?
   - Has Error? **true** → Log Error (and end)
   - Has Error? **false** → Affordable?
   - (In the provided JSON, this is miswired; correct it as above to make the workflow function as intended.)
16. **Add node: Notion**
   - Name: **Save to Notion**
   - Credentials: configure **Notion OAuth2 / token** in n8n.
   - Operation: create a new page in a **Database** (select your database; map fields like address, price, size, url, scrapedAt, pricePerSqft).
17. **Connect**: Affordable? (true) → Save to Notion
18. **Add node: Set**
   - Name: **Prepare Mailchimp Content**
   - Create fields required by Mailchimp campaign creation and content:
     - audience/list id
     - subject line (e.g., `New affordable listing: {{ $json.address }}`)
     - from name / reply-to
     - HTML content (include address/price/size/link)
19. **Add node: Mailchimp**
   - Name: **Create Campaign**
   - Credentials: configure **Mailchimp API credentials** in n8n.
   - Resource: `campaign`, Operation: `create`
   - Map required fields (audience/list + settings) from the Set node.
20. **Add node: Mailchimp**
   - Name: **Set Campaign Content**
   - Resource: `campaign`, Operation: `setContent`
   - Use the campaign id from Create Campaign and the HTML content from Set.
21. **Add node: Mailchimp**
   - Name: **Send Campaign**
   - Resource: `campaign`, Operation: `send`
   - Campaign ID: `{{ $json.id }}` (ensure the incoming item at this step contains the campaign `id`).
22. **Connect**: Save to Notion → Prepare Mailchimp Content → Create Campaign → Set Campaign Content → Send Campaign
23. **Test execution**
   - Run with one known listing page.
   - Confirm ScrapeGraphAI returns `listings[]`.
   - Confirm Notion database page is created.
   - Confirm Mailchimp campaign is created, populated, and sent.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “This workflow lets you keep an eye on commercial real-estate opportunities without manual searching…” plus setup checklist (ScrapeGraphAI creds, replace URLs, Notion database ID, Mailchimp list + creds, adjust threshold, test, share signup form). | From sticky note **Workflow Overview** (embedded in workflow) |
| Current workflow wiring routes **only error items** forward (Has Error? only connected to Log Error, and Log Error connected to Affordable?). To match the described intent, connect Has Error? **false** output to **Affordable?**, and prevent error items from reaching affordability/storage/email. | Structural issue visible in workflow connections vs. sticky-note description |

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.