Analyze WooCommerce product reviews with GPT-4, Airtable & Slack summaries

https://n8nworkflows.xyz/workflows/analyze-woocommerce-product-reviews-with-gpt-4--airtable---slack-summaries-12066


# Analyze WooCommerce product reviews with GPT-4, Airtable & Slack summaries

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:** Automatically fetch WooCommerce product reviews on a schedule, analyze each review with GPT-4 for sentiment + short summary, store the enriched data in Airtable, then send a Slack message summarizing counts of positive/neutral/negative reviews.

**Target use cases:**
- Customer feedback monitoring for ecommerce teams
- Quick detection of negative/low-rated reviews
- Centralized logging of review + AI metadata (Airtable) plus team notification (Slack)

### 1.1 Scheduling & Initialization
Runs every 10 minutes and sets the WooCommerce domain used by subsequent API calls.

### 1.2 Fetch Reviews from WooCommerce
Calls WooCommerce REST API to retrieve latest product reviews.

### 1.3 Per-Review AI Analysis (Batch Loop)
Iterates reviews one-by-one, sends each review text to OpenAI (GPT-4 Turbo), and merges AI output with original review fields.

### 1.4 Persist + Aggregate + Notify
Stores each processed review in Airtable, merges all processed items back into a single stream, counts sentiments, and sends a Slack summary. The workflow loops until all reviews are processed.

---

## 2. Block-by-Block Analysis

### Block 1 — Scheduling & Initialization
**Overview:** Triggers the workflow every 10 minutes and defines the WooCommerce store domain as a variable (`wc_domain`) used by the HTTP request node.

**Nodes involved:**
- Every 10 min trigger
- Set WooCommerce Domain

#### Node: Every 10 min trigger
- **Type / role:** Schedule Trigger; entry point.
- **Configuration:** Runs every 10 minutes (`minutesInterval: 10`).
- **Connections:** Outputs to **Set WooCommerce Domain**.
- **Failure / edge cases:** n8n instance downtime will skip runs; overlapping executions can occur if processing takes longer than 10 minutes (depends on n8n concurrency settings).
- **Version notes:** typeVersion 1.2.

#### Node: Set WooCommerce Domain
- **Type / role:** Set node; provides a constant configuration value.
- **Configuration:** Sets `wc_domain = {{Your_Woocommerce_Domain}}` (placeholder to replace with your store domain, e.g., `example.com`).
- **Key expressions/variables:** Uses an expression only as a literal placeholder; downstream uses `$json.wc_domain`.
- **Connections:** Receives from trigger; outputs to **Get latest product reviews**.
- **Failure / edge cases:** If left as placeholder or malformed domain, HTTP Request URL becomes invalid.
- **Version notes:** typeVersion 3.4.

---

### Block 2 — Fetch Reviews from WooCommerce
**Overview:** Pulls product reviews from WooCommerce REST API using basic auth.

**Nodes involved:**
- Get latest product reviews

#### Node: Get latest product reviews
- **Type / role:** HTTP Request; calls WooCommerce API.
- **Configuration choices:**
  - **URL:** `https://{{ $json.wc_domain }}/wp-json/wc/v3/products/reviews`
  - **Auth:** Generic credential type → **HTTP Basic Auth**
  - **Headers:** `Content-Type: application/json`
- **Input/Output:**
  - Input: JSON containing `wc_domain`
  - Output: WooCommerce reviews response (typically an array of review objects)
- **Connections:** Outputs to **Process reviews in batches**.
- **Failure / edge cases:**
  - Wrong credentials → 401/403
  - Wrong domain / SSL issues → DNS/TLS errors
  - Pagination not handled: WooCommerce may return only a page of results (default per_page often 10). Without query params (`per_page`, `page`, `after`), you may miss older reviews or repeatedly process the same set.
  - “Latest” is not enforced: no filter for “since last run”; duplicates likely unless downstream deduplication exists (it doesn’t).
- **Version notes:** typeVersion 4.3.

---

### Block 3 — Per-Review AI Analysis (Batch Loop)
**Overview:** Iterates through reviews one at a time, requests sentiment classification from GPT-4 Turbo, then combines AI result JSON with original review details.

**Nodes involved:**
- Process reviews in batches
- Analyze Review Sentiment
- Merge Review & AI Data
- Combine Review & AI Results
- Check Sentiment Type

#### Node: Process reviews in batches
- **Type / role:** Split In Batches; creates a loop to process items incrementally.
- **Configuration:** `batchSize = 1` (one review at a time).
- **Connections:**
  - **Input:** from **Get latest product reviews**
  - **Output 0 (main):** used as the “continue” trigger (here it’s fed by Slack at the end)
  - **Output 1:** sends the current batch item to:
    - **Analyze Review Sentiment**
    - **Merge Review & AI Data** (input 0)
- **Failure / edge cases:**
  - If WooCommerce output is not an item list in the expected structure, batching may not iterate as intended.
  - With many reviews, execution time could exceed schedule interval.
- **Version notes:** typeVersion 3.

#### Node: Analyze Review Sentiment
- **Type / role:** LangChain OpenAI node; calls OpenAI model to classify sentiment.
- **Configuration choices:**
  - **Model:** `gpt-4-turbo`
  - **Prompt:** Asks for JSON-only output:
    - `sentiment`: positive | neutral | negative
    - `confidence`: number
    - `short_summary`: string
  - Review text injected: `{{$json["review"]}}`
- **Connections:** Output goes to **Merge Review & AI Data** (input 1).
- **Failure / edge cases:**
  - Auth/rate limits/insufficient quota → API errors
  - Model may return non-JSON or JSON wrapped in markdown fences; downstream Code node attempts to strip ```json fences.
  - Missing `review` field in WooCommerce response → poor prompt / empty analysis.
- **Version notes:** typeVersion 2; requires OpenAI credential configured in n8n.

#### Node: Merge Review & AI Data
- **Type / role:** Merge node; combines original review item stream with AI results stream.
- **Configuration:** Default merge behavior (not explicitly set in parameters).
- **Connections:**
  - Input 0: review item from **Process reviews in batches** (output 1)
  - Input 1: AI result from **Analyze Review Sentiment**
  - Output: to **Combine Review & AI Results**
- **Failure / edge cases:**
  - If merge mode doesn’t align items deterministically, pairing can break. The next Code node assumes the merge outputs exactly `2N` items: first N are reviews, second N are AI results.
- **Version notes:** typeVersion 3.2.

#### Node: Combine Review & AI Results
- **Type / role:** Code node; pairs review+AI items and normalizes output fields.
- **Configuration choices (logic):**
  - Assumes `items.length` is even; splits into two halves.
  - For each index `i`:
    - `review = items[i].json`
    - `ai = items[i+half].json`
  - Extracts AI text from: `ai.output?.[0]?.content?.[0]?.text`
  - Strips markdown fences and parses JSON.
  - On parse failure returns defaults:
    - sentiment: `"unscored"`
    - confidence: `null`
    - short_summary: `"AI failed"`
  - Outputs one normalized item per review:
    - `review_id`, `product_id`, `product_name`, `review_text`, `rating`, `created_at`, `sentiment`, `confidence`, `short_summary`
- **Connections:** Output to **Check Sentiment Type**.
- **Failure / edge cases:**
  - If merge ordering differs, reviews/AI responses mismatch (wrong sentiment attached to wrong review).
  - If AI node output structure changes (different path than `ai.output[0].content[0].text`), JSON extraction fails and everything becomes “unscored”.
  - Throws hard error if item count mismatch: `"Invalid input: reviews and AI results count mismatch"`.
- **Version notes:** typeVersion 2.

#### Node: Check Sentiment Type
- **Type / role:** IF node; routes items based on sentiment.
- **Configuration choices:**
  - Condition uses OR:
    - sentiment equals `"positive"`
    - sentiment equals `"natural"` (likely a typo for `"neutral"`)
  - Output 0 (true): goes to Airtable save
  - Output 1 (false): bypasses Airtable save and goes to merge summary
- **Connections:**
  - True → **Save Review in Airtable**
  - False → **Merge Summary with Workflow** (input 1)
- **Failure / edge cases:**
  - Typo `"natural"` means `"neutral"` reviews will fail this check and will not be saved to Airtable (unless AI returns the same typo).
  - Negative/unscored go to the “false” path and also won’t be saved (which contradicts the sticky-note description that “saves each review”).
- **Version notes:** typeVersion 2.2.

---

### Block 4 — Persist + Aggregate + Notify (and Loop)
**Overview:** Saves selected reviews in Airtable, merges all processed items into one stream, counts sentiment distribution, posts a Slack summary, then triggers the next batch until done.

**Nodes involved:**
- Save Review in Airtable
- Merge Summary with Workflow
- Summarize Sentiments
- Send Slack Summary

#### Node: Save Review in Airtable
- **Type / role:** Airtable node; creates a record per review.
- **Configuration choices:**
  - **Operation:** Create
  - **Base:** “n8n Demo” (ID: `appF2iYPgVqqyXDC1`)
  - **Table:** “Product Review” (ID: `tbl6sDESNiBIeyhpb`)
  - **Field mapping:**
    - Rating ← `$json.rating`
    - Review ID ← `$json.review_id`
    - Sentiment ← `$json.sentiment`
    - Product ID ← `$json.product_id`
    - Product Name ← `$json.product_name`
    - Review Summary AI ← `$json.short_summary`
- **Connections:** Output to **Merge Summary with Workflow** (input 0).
- **Failure / edge cases:**
  - Airtable auth errors (token invalid / missing scopes)
  - Schema mismatch: field names/types must match the Airtable table; number vs string conversions disabled.
  - Duplicates: “create” will insert duplicates every run unless you add a lookup/upsert strategy on “Review ID”.
- **Version notes:** typeVersion 2.1.

#### Node: Merge Summary with Workflow
- **Type / role:** Merge node; reunifies items from “saved” and “bypassed” branches.
- **Configuration:** Default merge behavior (not explicitly set).
- **Connections:**
  - Input 0: from **Save Review in Airtable**
  - Input 1: from **Check Sentiment Type** (false path)
  - Output: to **Summarize Sentiments**
- **Failure / edge cases:** If one branch produces no items, merge behavior can affect output shape/order depending on the node’s implicit mode.
- **Version notes:** typeVersion 3.2.

#### Node: Summarize Sentiments
- **Type / role:** Code node; aggregates sentiment counts across items.
- **Configuration choices (logic):**
  - Counts sentiments using either:
    - `item.json.sentiment` (from normalized output)
    - OR `item.json.fields?.Sentiment` (Airtable record format)
  - Treats `"neutral"` **or** `"natural"` as neutral.
  - If total count is 0 → returns `[]` which effectively stops downstream Slack.
  - Returns a single summary item with:
    - `positive_count`, `neutral_count`, `negative_count`, `total`
- **Connections:** Output to **Send Slack Summary**.
- **Failure / edge cases:**
  - If upstream items don’t contain `sentiment` or Airtable `fields.Sentiment`, nothing is counted and Slack won’t be sent.
  - If sentiment values are outside expected set (e.g., “unscored”), they’re ignored.
- **Version notes:** typeVersion 2.

#### Node: Send Slack Summary
- **Type / role:** Slack node; sends a message to a channel.
- **Configuration choices:**
  - Posts text with counts:
    - Positive Reviews, Neutral Reviews, Negative Reviews, Total Reviews Processed
  - Channel: `#n8n` (channelId `C09S57E2JQ2`)
  - “Include link to workflow”: false
- **Connections:**
  - Output goes back to **Process reviews in batches** (input 0), enabling the batch loop to continue with next review.
- **Failure / edge cases:**
  - Slack auth errors / missing permission to post to channel
  - Rate limiting if this executes too frequently (note: with current wiring it will post once per batch, i.e., per review processed, not once per run—see below).
- **Version notes:** typeVersion 2.3.

**Important behavior note (loop + messaging):** Because **Send Slack Summary** is inside the batch loop (it feeds back into **Process reviews in batches**), this design will typically send **a Slack message per processed review** (each iteration summarizes only the current merged items available at that time), not a single end-of-run summary—unless the merge/summarize nodes are effectively accumulating across iterations (they usually don’t without explicit accumulation). If the intended behavior is “one Slack summary per run”, the aggregation and Slack send should occur after the batching loop completes.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Every 10 min trigger | Schedule Trigger | Scheduled entry point | — | Set WooCommerce Domain | This node runs the workflow every 10 minutes automatically. |
| Set WooCommerce Domain | Set | Defines `wc_domain` used to build WooCommerce API URL | Every 10 min trigger | Get latest product reviews | ## Fetch WooCommerce Reviews<br><br>This process sets your WooCommerce store address and then fetches all the latest product reviews using your store credentials, so the workflow knows which reviews to process next. |
| Get latest product reviews | HTTP Request | Fetch reviews from WooCommerce REST API | Set WooCommerce Domain | Process reviews in batches | ## Fetch WooCommerce Reviews<br><br>This process sets your WooCommerce store address and then fetches all the latest product reviews using your store credentials, so the workflow knows which reviews to process next. |
| Process reviews in batches | Split In Batches | Iterates reviews one-by-one (loop driver) | Get latest product reviews; Send Slack Summary (loop back) | Analyze Review Sentiment; Merge Review & AI Data | ## Analyze Reviews with AI<br><br>This process breaks reviews into smaller groups, sends each review to AI to determine its sentiment and create a short summary, and then combines the AI results with the original review data so everything is ready for the next steps in the workflow. |
| Analyze Review Sentiment | OpenAI (LangChain) | Sentiment classification + short summary | Process reviews in batches | Merge Review & AI Data | ## Analyze Reviews with AI<br><br>This process breaks reviews into smaller groups, sends each review to AI to determine its sentiment and create a short summary, and then combines the AI results with the original review data so everything is ready for the next steps in the workflow. |
| Merge Review & AI Data | Merge | Combine original review item + AI result | Process reviews in batches; Analyze Review Sentiment | Combine Review & AI Results | ## Analyze Reviews with AI<br><br>This process breaks reviews into smaller groups, sends each review to AI to determine its sentiment and create a short summary, and then combines the AI results with the original review data so everything is ready for the next steps in the workflow. |
| Combine Review & AI Results | Code | Parse AI JSON and output normalized enriched review object | Merge Review & AI Data | Check Sentiment Type | ## Analyze Reviews with AI<br><br>This process breaks reviews into smaller groups, sends each review to AI to determine its sentiment and create a short summary, and then combines the AI results with the original review data so everything is ready for the next steps in the workflow. |
| Check Sentiment Type | IF | Route items (save only some sentiments) | Combine Review & AI Results | Save Review in Airtable; Merge Summary with Workflow | ## Save and Share Review Insights<br><br>This part of the workflow saves each review and its sentiment in Airtable, merges all the data together, counts how many reviews are positive, neutral, or negative, and then sends a clear summary to your Slack channel so the team can quickly see the overall feedback. |
| Save Review in Airtable | Airtable | Persist review + AI fields | Check Sentiment Type (true) | Merge Summary with Workflow | ## Save and Share Review Insights<br><br>This part of the workflow saves each review and its sentiment in Airtable, merges all the data together, counts how many reviews are positive, neutral, or negative, and then sends a clear summary to your Slack channel so the team can quickly see the overall feedback. |
| Merge Summary with Workflow | Merge | Re-merge saved and bypassed items | Save Review in Airtable; Check Sentiment Type (false) | Summarize Sentiments | ## Save and Share Review Insights<br><br>This part of the workflow saves each review and its sentiment in Airtable, merges all the data together, counts how many reviews are positive, neutral, or negative, and then sends a clear summary to your Slack channel so the team can quickly see the overall feedback. |
| Summarize Sentiments | Code | Count positive/neutral/negative across items | Merge Summary with Workflow | Send Slack Summary | ## Save and Share Review Insights<br><br>This part of the workflow saves each review and its sentiment in Airtable, merges all the data together, counts how many reviews are positive, neutral, or negative, and then sends a clear summary to your Slack channel so the team can quickly see the overall feedback. |
| Send Slack Summary | Slack | Post sentiment count summary to Slack | Summarize Sentiments | Process reviews in batches (loop back) | ## Save and Share Review Insights<br><br>This part of the workflow saves each review and its sentiment in Airtable, merges all the data together, counts how many reviews are positive, neutral, or negative, and then sends a clear summary to your Slack channel so the team can quickly see the overall feedback. |

---

## 4. Reproducing the Workflow from Scratch

1) **Create Trigger**
   1. Add **Schedule Trigger** node named **Every 10 min trigger**.
   2. Set interval: **Every 10 minutes**.

2) **Add WooCommerce domain constant**
   1. Add **Set** node named **Set WooCommerce Domain**.
   2. Add a field:
      - Name: `wc_domain` (String)
      - Value: your domain, e.g. `example.com` (no protocol).
   3. Connect **Every 10 min trigger → Set WooCommerce Domain**.

3) **Fetch reviews from WooCommerce**
   1. Add **HTTP Request** node named **Get latest product reviews**.
   2. Method: GET (default).
   3. URL: `https://{{$json.wc_domain}}/wp-json/wc/v3/products/reviews`
   4. Authentication:
      - Select **Generic Credential Type**
      - Type: **HTTP Basic Auth**
      - Create credentials with WooCommerce REST API **Consumer Key** as username and **Consumer Secret** as password (or your site’s configured basic auth proxy setup).
   5. Headers: `Content-Type: application/json`
   6. Connect **Set WooCommerce Domain → Get latest product reviews**.

4) **Batch loop over reviews**
   1. Add **Split In Batches** node named **Process reviews in batches**.
   2. Batch Size: `1`.
   3. Connect **Get latest product reviews → Process reviews in batches**.

5) **AI sentiment analysis**
   1. Add **OpenAI (LangChain)** node named **Analyze Review Sentiment**.
   2. Credentials: configure **OpenAI API** credential (API key).
   3. Model: **gpt-4-turbo**.
   4. Prompt/message content (ensure it requests JSON-only) and insert review text with expression:
      - `Review: {{$json["review"]}}`
   5. Connect **Process reviews in batches (output 1) → Analyze Review Sentiment**.

6) **Merge original review + AI response**
   1. Add **Merge** node named **Merge Review & AI Data**.
   2. Connect:
      - **Process reviews in batches (output 1) → Merge Review & AI Data (input 0)**
      - **Analyze Review Sentiment → Merge Review & AI Data (input 1)**

7) **Normalize and parse AI JSON**
   1. Add **Code** node named **Combine Review & AI Results**.
   2. Paste logic that:
      - pairs review + AI items
      - parses AI JSON (strip markdown fences)
      - outputs normalized fields (review/product/rating/sentiment/summary)
   3. Connect **Merge Review & AI Data → Combine Review & AI Results**.

8) **Route by sentiment**
   1. Add **IF** node named **Check Sentiment Type**.
   2. Condition: `{{$json.sentiment}} equals "positive"` OR `{{$json.sentiment}} equals "natural"` (replicating the workflow exactly).
      - If you want correct neutral handling, use `"neutral"` instead of `"natural"`.
   3. Connect **Combine Review & AI Results → Check Sentiment Type**.

9) **Persist to Airtable (for the “true” branch)**
   1. Add **Airtable** node named **Save Review in Airtable**.
   2. Credentials: configure Airtable Personal Access Token with access to the base.
   3. Operation: **Create** record.
   4. Select Base and Table (or create your own) with fields at least:
      - Product Name (text), Product ID (number), Sentiment (text),
      - Review Summary AI (text), Review ID (number), Rating (number)
   5. Map fields using expressions:
      - Rating ← `{{$json.rating}}`
      - Review ID ← `{{$json.review_id}}`
      - Sentiment ← `{{$json.sentiment}}`
      - Product ID ← `{{$json.product_id}}`
      - Product Name ← `{{$json.product_name}}`
      - Review Summary AI ← `{{$json.short_summary}}`
   6. Connect **Check Sentiment Type (true) → Save Review in Airtable**.

10) **Merge the two branches back**
   1. Add **Merge** node named **Merge Summary with Workflow**.
   2. Connect:
      - **Save Review in Airtable → Merge Summary with Workflow (input 0)**
      - **Check Sentiment Type (false) → Merge Summary with Workflow (input 1)**

11) **Aggregate sentiment counts**
   1. Add **Code** node named **Summarize Sentiments**.
   2. Implement counting for positive/neutral/negative using:
      - `item.json.sentiment` or `item.json.fields.Sentiment`
   3. Return a single item: `{ positive_count, neutral_count, negative_count, total }`
   4. Connect **Merge Summary with Workflow → Summarize Sentiments**.

12) **Send Slack message**
   1. Add **Slack** node named **Send Slack Summary**.
   2. Credentials: configure Slack (OAuth) with permission to post messages.
   3. Resource/Operation: “Post message” (Message).
   4. Channel: pick your channel (e.g. `#n8n`).
   5. Message text with expressions:
      - Positive Reviews: `{{$json.positive_count}}`, etc.
   6. Connect **Summarize Sentiments → Send Slack Summary**.

13) **Close the batch loop**
   1. Connect **Send Slack Summary → Process reviews in batches (input/main)** to trigger the next batch.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “This workflow automatically fetches new product reviews from WooCommerce every 10 minutes… stores in Airtable… sends a Slack message…” plus setup steps (WooCommerce creds, OpenAI key, Airtable creds, Slack creds, activate, adjust schedule). | Sticky note “How it works / Setup steps” (applies to the overall workflow). |
| Design caveat: current wiring typically posts Slack once per batch iteration (often once per review) rather than once per full run; adjust loop/aggregation placement if you need a single periodic summary. | Implementation behavior derived from node connections (Slack node loops back into SplitInBatches). |
| Neutral typo risk: IF node checks `"natural"`; neutral reviews may bypass Airtable saving. | Node logic: **Check Sentiment Type** and **Summarize Sentiments**. |
| No deduplication: repeated runs may re-save the same reviews to Airtable unless you implement lookup/upsert keyed by “Review ID”. | Airtable “create” operation + WooCommerce fetch without `after`/pagination logic. |