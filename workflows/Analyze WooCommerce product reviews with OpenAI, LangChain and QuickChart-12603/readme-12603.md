Analyze WooCommerce product reviews with OpenAI, LangChain and QuickChart

https://n8nworkflows.xyz/workflows/analyze-woocommerce-product-reviews-with-openai--langchain-and-quickchart-12603


# Analyze WooCommerce product reviews with OpenAI, LangChain and QuickChart

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:** This workflow retrieves WooCommerce product reviews for a specific product, runs AI-based sentiment analysis per review, aggregates results, generates a visual chart (QuickChart), produces a structured “product insights” report using an AI agent, converts it to HTML, and emails it to stakeholders.

**Target use cases:**
- Product teams monitoring customer feedback trends per SKU
- Customer care summarizing review sentiment and extracting action items
- Lightweight “voice of customer” reporting from WooCommerce without BI setup

### 1.1 Logical Blocks
1. **Input & Target Setup**: Manual trigger + set `product_id` and site URL.
2. **WooCommerce Data Retrieval**: Fetch reviews + fetch product details.
3. **Per-Review AI Sentiment Analysis (batched loop)**: Iterate reviews, analyze sentiment via OpenAI.
4. **Normalization & Aggregation**: Reshape fields, aggregate all analyzed reviews.
5. **Visualization**: Build chart variables and call QuickChart.
6. **AI Report Generation + Delivery**: Merge product + reviews, generate report, convert to HTML, email.

---

## 2. Block-by-Block Analysis

### Block 1 — Input & Target Setup
**Overview:** Starts the workflow manually and defines which product/store to analyze via placeholder variables.

**Nodes involved:**
- When clicking ‘Execute workflow’
- Product ID

#### Node: When clicking ‘Execute workflow’
- **Type / role:** Manual Trigger (`n8n-nodes-base.manualTrigger`) — entry point.
- **Config:** No parameters.
- **Outputs:** To **Product ID**.
- **Failure modes:** None (manual start only).
- **Version notes:** v1.

#### Node: Product ID
- **Type / role:** Set (`n8n-nodes-base.set`) — defines variables used downstream.
- **Config choices:**
  - Sets `product_id` = `"PRODUCT_ID"` (placeholder)
  - Sets `woocommerce_url` = `"YOUR_WEBSITE"` (placeholder, expected domain)
- **Key expressions:** None; static placeholders.
- **Outputs:** Splits to:
  - **GET Product Reviews**
  - **Get a product**
- **Edge cases:**
  - Invalid/missing `product_id` leads to WooCommerce API errors later.
  - `woocommerce_url` should not include protocol in this workflow’s usage (it is interpolated into `https://{{$json.woocommerce_url}}/...`).
- **Version notes:** v3.4.

---

### Block 2 — WooCommerce Data Retrieval
**Overview:** Fetches product reviews via WooCommerce REST API (HTTP Request) and product details via the WooCommerce node.

**Nodes involved:**
- GET Product Reviews
- Get a product

#### Node: GET Product Reviews
- **Type / role:** HTTP Request (`n8n-nodes-base.httpRequest`) — calls WooCommerce REST endpoint for reviews.
- **Config choices:**
  - **URL expression:**
    - `https://{{$json.woocommerce_url}}/wp-json/wc/v3/products/reviews?product={{ $json.product_id }}`
  - **Authentication:** `httpBasicAuth` via “genericCredentialType”
- **Inputs:** From **Product ID**
- **Outputs:** To **Loop Over Items**
- **Edge cases / failures:**
  - 401/403 if credentials lack permissions or are incorrect.
  - 404 if `woocommerce_url` is wrong.
  - If reviews are paginated, this call may return only the first page depending on WooCommerce defaults (common integration gap). No pagination handling is implemented.
  - Rate limiting/timeouts on large stores.
- **Version notes:** v4.3.

#### Node: Get a product
- **Type / role:** WooCommerce (`n8n-nodes-base.wooCommerce`) — retrieves product metadata.
- **Config choices:**
  - Operation: **get**
  - `productId` from expression: `={{ $json.product_id }}`
  - Uses WooCommerce API credentials (separate from HTTP basic auth used for reviews).
- **Inputs:** From **Product ID**
- **Outputs:** To **Merge** (input 0)
- **Edge cases / failures:**
  - Credential mismatch (store URL differs from the HTTP node’s domain).
  - Product not found => error/empty data.
- **Version notes:** v1.

---

### Block 3 — Per-Review AI Sentiment Analysis (batched loop)
**Overview:** Iterates through fetched reviews, applies OpenAI-based sentiment analysis to each, and produces structured sentiment fields.

**Nodes involved:**
- Loop Over Items
- Sentiment Analysis
- OpenAI Chat Model
- Set review

#### Node: Loop Over Items
- **Type / role:** Split In Batches (`n8n-nodes-base.splitInBatches`) — controls iteration over reviews.
- **Config choices:** Default options; batch size not explicitly set (n8n default applies).
- **Connections:**
  - **Output 0 (main, index 0):** to **Set vars for chart** and **Aggregate reviews**
  - **Output 1 (main, index 1):** to **Sentiment Analysis** (per item iteration)
- **Inputs:** From **GET Product Reviews**
- **Edge cases / failures:**
  - If the HTTP node returns a non-array structure, batching may behave unexpectedly.
  - Very large review volumes can cause long runtimes.
- **Version notes:** v3.

#### Node: OpenAI Chat Model
- **Type / role:** LangChain Chat Model (`@n8n/n8n-nodes-langchain.lmChatOpenAi`) — provides the LLM for sentiment analysis node.
- **Config choices:**
  - Model: `gpt-4.1-mini`
  - Uses OpenAI API credentials
- **Connections:** Feeds **Sentiment Analysis** via `ai_languageModel`.
- **Edge cases / failures:**
  - Invalid OpenAI key, insufficient quota, model not available in account/region.
  - Latency/timeouts during high volume.
- **Version notes:** v1.3.

#### Node: Sentiment Analysis
- **Type / role:** LangChain Sentiment Analysis (`@n8n/n8n-nodes-langchain.sentimentAnalysis`) — classifies each review.
- **Config choices:**
  - `inputText`: `={{ $json.review }}`
  - Options:
    - `enableAutoFixing: true` (tries to self-correct malformed outputs)
    - `includeDetailedResults: true` (richer output object)
- **Inputs:** From **Loop Over Items** (iteration output) + chat model from **OpenAI Chat Model**
- **Outputs:** Connected three times to **Set review** (same target). Functionally it still forwards results; the triple connection is redundant and can cause duplicate executions depending on n8n behavior/version.
- **Edge cases / failures:**
  - If review text contains HTML/noise, sentiment may be skewed.
  - Empty/null `review` causes weak results or errors.
- **Version notes:** v1.1.

#### Node: Set review
- **Type / role:** Set (`n8n-nodes-base.set`) — normalizes fields for downstream aggregation/reporting.
- **Config choices (assignments):**
  - `sentiment` = `{{$json.sentimentAnalysis.category}}`
  - `strenght` = `{{$json.sentimentAnalysis.strength}}` (typo: “strenght”)
  - `confidence` = `{{$json.sentimentAnalysis.confidence}}`
  - Pass-through: `review`, `reviewer`, `reviewer_email`
- **Inputs:** From **Sentiment Analysis**
- **Outputs:** To **Loop Over Items** (back into batching node, index 0)
- **Edge cases / failures:**
  - If sentimentAnalysis output structure differs, expressions fail.
  - Typo `strenght` is consistent later (AI agent expects `strength` per its prompt, but the JSON here uses `strenght`; this is an important mismatch unless later corrected—which it is not).
- **Version notes:** v3.4.

---

### Block 4 — Normalization & Aggregation
**Overview:** Aggregates all per-review sentiment objects into a single array field to be used for report generation.

**Nodes involved:**
- Aggregate reviews
- Merge

#### Node: Aggregate reviews
- **Type / role:** Aggregate (`n8n-nodes-base.aggregate`) — collects all items into one payload.
- **Config choices:**
  - Mode: `aggregateAllItemData`
  - Destination field: `sentiment` (stores the array of review objects)
- **Inputs:** From **Loop Over Items** (main output 0 path)
- **Outputs:** To **Merge** (input 1)
- **Edge cases / failures:**
  - If no reviews exist, the aggregated array may be empty (report should handle “0 reviews”).
- **Version notes:** v1.

#### Node: Merge
- **Type / role:** Merge (`n8n-nodes-base.merge`) — combines product data with aggregated sentiment array.
- **Config choices:**
  - Mode: **combine**
  - Combine by: **combineAll**
- **Inputs:**
  - Input 0: **Get a product**
  - Input 1: **Aggregate reviews**
- **Outputs:** To **Product Insights Analyst**
- **Edge cases / failures:**
  - If one branch errors or returns no items, merge behavior may produce empty output.
  - Field name collisions: product fields and aggregated fields could override if identical keys exist.
- **Version notes:** v3.2.

---

### Block 5 — Visualization (QuickChart)
**Overview:** Prepares label/color arrays for a pie chart and calls QuickChart to generate a sentiment distribution chart.

**Nodes involved:**
- Set vars for chart
- QuickChart

#### Node: Set vars for chart
- **Type / role:** Code (`n8n-nodes-base.code`) — transforms items into chart variables.
- **Config choices:**
  - Builds:
    - `labels`: `"<Sentiment> <index>"`
    - `data`: pushes `1` per item (so distribution is by count)
    - `colors`: green for Positive, red for Negative, amber otherwise
  - Returns one item containing `{ labels, data, colors }`
- **Inputs:** From **Loop Over Items** (main output 0 path)
- **Outputs:** To **QuickChart**
- **Edge cases / failures:**
  - Sentiment values must match `'Positive'` / `'Negative'` exactly; otherwise treated as neutral/other color.
- **Version notes:** v2.

#### Node: QuickChart
- **Type / role:** HTTP Request (`n8n-nodes-base.httpRequest`) — generates chart image via QuickChart.
- **Config choices:**
  - URL: `https://quickchart.io/chart`
  - Sends query parameter `c` containing chart JSON (pie chart).
  - **Important:** Dataset `data` is hard-coded as `[1,1,1]` in the query rather than using `{{$json.data}}`. Labels/colors are dynamic but data is not; chart may be incorrect if review count differs.
- **Inputs:** From **Set vars for chart**
- **Outputs:** Not connected further (chart is generated but not used in the emailed report in this workflow).
- **Edge cases / failures:**
  - URL length limits if chart config becomes large (unlikely here).
  - If QuickChart is down, this branch fails but does not block report delivery unless execution is set to stop on error.
- **Version notes:** v4.3.

---

### Block 6 — AI Report Generation + Delivery
**Overview:** Uses an AI agent to produce a structured report from product + review sentiment data, converts it to HTML, then emails it via Gmail.

**Nodes involved:**
- Product Insights Analyst
- OpenAI Chat Model1
- HTML Converter
- Send a message

#### Node: OpenAI Chat Model1
- **Type / role:** LangChain Chat Model (`@n8n/n8n-nodes-langchain.lmChatOpenAi`) — shared LLM for the agent and HTML conversion chain.
- **Config choices:**
  - Model: `gpt-4.1-mini`
- **Connections:** Provides `ai_languageModel` to:
  - **Product Insights Analyst**
  - **HTML Converter**
- **Edge cases / failures:** same as other OpenAI model node (quota/auth/latency).
- **Version notes:** v1.3.

#### Node: Product Insights Analyst
- **Type / role:** LangChain Agent (`@n8n/n8n-nodes-langchain.agent`) — generates the report content.
- **Config choices:**
  - **Input text composed from merged data:**
    - `Reviews: {{JSON.stringify($json.sentiment)}}`
    - `Product: {{ $json.name }} - {{ $json.description }}`
    - `Product Category: {{JSON.stringify($json.categories)}}`
  - **System message:** Strict multi-section report format with calculations and privacy constraints (mask emails, strip HTML).
- **Inputs:** From **Merge** + LLM from **OpenAI Chat Model1**
- **Outputs:** To **HTML Converter** (expects agent output in `$json.output`)
- **Edge cases / failures:**
  - **Schema mismatch risk:** agent prompt expects `strength`, but upstream field is `strenght`. The agent may state missing “strength” or mis-handle calculations.
  - Product `description` may contain HTML; agent is instructed to strip HTML only for reviews, not product description.
- **Version notes:** v3.1.

#### Node: HTML Converter
- **Type / role:** LangChain LLM Chain (`@n8n/n8n-nodes-langchain.chainLlm`) — converts report text into HTML.
- **Config choices:**
  - `text`: `={{ $json.output }}`
  - Prompt: “Translate into HTML… only need the HTML, not the opening tags "html\n and the closing \n.”
- **Inputs:** From **Product Insights Analyst** + LLM from **OpenAI Chat Model1**
- **Outputs:** To **Send a message**
- **Edge cases / failures:**
  - If the agent output is not in `$json.output`, this will be empty.
  - Model may still include unwanted wrappers; downstream email will contain them.
- **Version notes:** v1.9.

#### Node: Send a message
- **Type / role:** Gmail (`n8n-nodes-base.gmail`) — emails the final HTML.
- **Config choices:**
  - To: `YOUR_EMAIL` (placeholder)
  - Subject: `Product review`
  - Message: `={{ $json.text }}` (expects HTML converter output in `$json.text`)
- **Inputs:** From **HTML Converter**
- **Outputs:** End of workflow.
- **Edge cases / failures:**
  - Gmail OAuth token expired/invalid.
  - If the node sends as plain text rather than HTML (depends on node option; not explicitly set), rendering may be incorrect.
- **Version notes:** v2.2.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| When clicking ‘Execute workflow’ | Manual Trigger | Manual entry point | — | Product ID | ## STEP 1 - Set the target / Sets the target WooCommerce product ID and store URL. |
| Product ID | Set | Define `product_id` and `woocommerce_url` variables | When clicking ‘Execute workflow’ | GET Product Reviews; Get a product | ## STEP 1 - Set the target / Sets the target WooCommerce product ID and store URL. |
| GET Product Reviews | HTTP Request | Retrieve product reviews from WooCommerce REST API | Product ID | Loop Over Items | ## STEP 2 - Data Retrieval from WooCommerce &  Set the target AI-Powered Sentiment Analysis / Fetches all reviews for the selected product via the WooCommerce REST API. / AI-Powered Sentiment Analysis... |
| Loop Over Items | Split In Batches | Iterate through reviews for per-item analysis + post-loop aggregation | GET Product Reviews; Set review | Set vars for chart; Aggregate reviews; Sentiment Analysis | ## STEP 2 - Data Retrieval from WooCommerce &  Set the target AI-Powered Sentiment Analysis / Fetches all reviews... / AI-Powered Sentiment Analysis... |
| OpenAI Chat Model | OpenAI Chat Model (LangChain) | LLM provider for sentiment analysis | — (AI linkage) | Sentiment Analysis | ## STEP 2 - Data Retrieval from WooCommerce &  Set the target AI-Powered Sentiment Analysis / Fetches all reviews... / AI-Powered Sentiment Analysis... |
| Sentiment Analysis | LangChain Sentiment Analysis | Compute sentiment category/strength/confidence per review | Loop Over Items (+ OpenAI Chat Model via AI port) | Set review | ## STEP 2 - Data Retrieval from WooCommerce &  Set the target AI-Powered Sentiment Analysis / Fetches all reviews... / AI-Powered Sentiment Analysis... |
| Set review | Set | Normalize sentiment fields per review | Sentiment Analysis | Loop Over Items | ## STEP 2 - Data Retrieval from WooCommerce &  Set the target AI-Powered Sentiment Analysis / Fetches all reviews... / AI-Powered Sentiment Analysis... |
| Aggregate reviews | Aggregate | Build array of all processed reviews into `sentiment` | Loop Over Items | Merge | ## STEP 2 - Data Retrieval from WooCommerce &  Set the target AI-Powered Sentiment Analysis / Fetches all reviews... / AI-Powered Sentiment Analysis... |
| Set vars for chart | Code | Build labels/colors arrays for chart | Loop Over Items | QuickChart | ## STEP 3 - Visual Sentiment Distribution / A pie chart is dynamically generated via QuickChart to visually represent sentiment distribution. |
| QuickChart | HTTP Request | Generate pie chart image via QuickChart | Set vars for chart | — | ## STEP 3 - Visual Sentiment Distribution / A pie chart is dynamically generated via QuickChart to visually represent sentiment distribution. |
| Get a product | WooCommerce | Retrieve product details | Product ID | Merge |  |
| Merge | Merge | Combine product details + aggregated reviews | Get a product; Aggregate reviews | Product Insights Analyst | ## STEP 4  Visual Sentiment Distribution / A specialized AI agent (“Product Insights Analyst”)... report... sent via email... |
| OpenAI Chat Model1 | OpenAI Chat Model (LangChain) | LLM provider for report + HTML conversion | — (AI linkage) | Product Insights Analyst; HTML Converter | ## STEP 4  Visual Sentiment Distribution / A specialized AI agent... |
| Product Insights Analyst | LangChain Agent | Generate structured insights report | Merge (+ OpenAI Chat Model1 via AI port) | HTML Converter | ## STEP 4  Visual Sentiment Distribution / A specialized AI agent... |
| HTML Converter | LangChain LLM Chain | Convert report text to HTML | Product Insights Analyst (+ OpenAI Chat Model1 via AI port) | Send a message | ## STEP 4  Visual Sentiment Distribution / A specialized AI agent... |
| Send a message | Gmail | Email the HTML report | HTML Converter | — | ## STEP 4  Visual Sentiment Distribution / ...sent via email... |
| Sticky Note | Sticky Note | Comment block | — | — | ## WooCommerce Product Review Sentiment Analysis and Detailed AI Report Generation for Improvement ... (full text in workflow) |
| Sticky Note1 | Sticky Note | Comment block | — | — | ## STEP 1 - Set the target / Sets the target WooCommerce product ID and store URL. |
| Sticky Note2 | Sticky Note | Comment block | — | — | ## STEP 2 - Data Retrieval from WooCommerce &  Set the target AI-Powered Sentiment Analysis ... |
| Sticky Note3 | Sticky Note | Comment block | — | — | ## STEP 3 - Visual Sentiment Distribution ... |
| Sticky Note4 | Sticky Note | Comment block | — | — | ## STEP 4  Visual Sentiment Distribution ... |
| Sticky Note8 | Sticky Note | Comment block | — | — | ## MY NEW YOUTUBE CHANNEL 👉 [Subscribe to my new **YouTube channel**](https://youtube.com/@n3witalia). ... [![image](https://n3wstorage.b-cdn.net/n3witalia/youtube-n8n-cover.jpg)](https://youtube.com/@n3witalia) |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n named: *Analyze WooCommerce product reviews sentiment*.
2. **Add Manual Trigger**
   - Node type: **Manual Trigger**
3. **Add Set node “Product ID”**
   - Node type: **Set**
   - Add fields:
     - `product_id` (String) = `PRODUCT_ID` (replace with real ID later)
     - `woocommerce_url` (String) = `YOUR_WEBSITE` (example: `store.example.com`)
   - Connect: **Manual Trigger → Product ID**
4. **Add HTTP Request node “GET Product Reviews”**
   - Node type: **HTTP Request**
   - Method: GET
   - URL (expression):
     - `https://{{$json.woocommerce_url}}/wp-json/wc/v3/products/reviews?product={{ $json.product_id }}`
   - Authentication:
     - Select **Generic Credential Type**
     - Type: **HTTP Basic Auth**
     - Create credentials with WooCommerce REST API consumer key/secret (or WordPress basic auth if enabled to proxy).
   - Connect: **Product ID → GET Product Reviews**
5. **Add WooCommerce node “Get a product”**
   - Node type: **WooCommerce**
   - Operation: **Get**
   - Product ID (expression): `{{$json.product_id}}`
   - Credentials: **WooCommerce API** (store URL + consumer key/secret)
   - Connect: **Product ID → Get a product**
6. **Add Split In Batches node “Loop Over Items”**
   - Node type: **Split In Batches**
   - Keep defaults (or set a batch size suitable for your volume).
   - Connect: **GET Product Reviews → Loop Over Items**
7. **Add OpenAI Chat Model node “OpenAI Chat Model”**
   - Node type: **OpenAI Chat Model (LangChain)**
   - Model: `gpt-4.1-mini`
   - Credentials: **OpenAI API**
8. **Add Sentiment Analysis node “Sentiment Analysis”**
   - Node type: **Sentiment Analysis (LangChain)**
   - Input text (expression): `{{$json.review}}`
   - Options:
     - Enable auto fixing: ON
     - Include detailed results: ON
   - Connect AI model: **OpenAI Chat Model (ai_languageModel) → Sentiment Analysis**
   - Connect main: **Loop Over Items (output 1) → Sentiment Analysis**
9. **Add Set node “Set review”**
   - Node type: **Set**
   - Fields (expressions):
     - `sentiment` = `{{$json.sentimentAnalysis.category}}`
     - `strenght` = `{{$json.sentimentAnalysis.strength}}` (keep as-is to match workflow; ideally rename to `strength`)
     - `confidence` = `{{$json.sentimentAnalysis.confidence}}`
     - `review` = `{{$json.review}}`
     - `reviewer` = `{{$json.reviewer}}`
     - `reviewer_email` = `{{$json.reviewer_email}}`
   - Connect: **Sentiment Analysis → Set review**
10. **Close the loop**
    - Connect: **Set review → Loop Over Items** (to continue batching)
11. **Add Aggregate node “Aggregate reviews”**
    - Node type: **Aggregate**
    - Mode: **Aggregate All Item Data**
    - Destination field name: `sentiment`
    - Connect: **Loop Over Items (output 0) → Aggregate reviews**
12. **Add Code node “Set vars for chart”**
    - Node type: **Code**
    - Paste the JS that builds `labels`, `data`, `colors` based on `item.json.sentiment`.
    - Connect: **Loop Over Items (output 0) → Set vars for chart**
13. **Add HTTP Request node “QuickChart”**
    - Node type: **HTTP Request**
    - URL: `https://quickchart.io/chart`
    - Enable “Send Query Parameters”
    - Add query parameter `c` containing the chart JSON, using:
      - `labels`: `{{ JSON.stringify($json.labels) }}`
      - `backgroundColor`: `{{ JSON.stringify($json.colors) }}`
      - (Optional fix recommended: set dataset `data` to `{{ JSON.stringify($json.data) }}` instead of `[1,1,1]`)
    - Connect: **Set vars for chart → QuickChart**
14. **Add Merge node “Merge”**
    - Node type: **Merge**
    - Mode: **Combine**
    - Combine by: **Combine All**
    - Connect:
      - **Get a product → Merge (input 0)**
      - **Aggregate reviews → Merge (input 1)**
15. **Add OpenAI Chat Model node “OpenAI Chat Model1”**
    - Node type: **OpenAI Chat Model (LangChain)**
    - Model: `gpt-4.1-mini`
    - Credentials: **OpenAI API**
16. **Add Agent node “Product Insights Analyst”**
    - Node type: **AI Agent (LangChain)**
    - Prompt (text) should include:
      - `Reviews: {{JSON.stringify($json.sentiment)}}`
      - `Product: {{ $json.name }} - {{ $json.description }}`
      - `Product Category: {{JSON.stringify($json.categories)}}`
    - System message: use the provided structured report constraints (mask emails, compute stats, fixed headings).
    - Connect:
      - **Merge → Product Insights Analyst**
      - **OpenAI Chat Model1 (ai_languageModel) → Product Insights Analyst**
17. **Add LLM Chain node “HTML Converter”**
    - Node type: **Chain LLM (LangChain)**
    - Input text: `{{$json.output}}`
    - Prompt: convert content to HTML only (no `<html>` wrapper).
    - Connect:
      - **Product Insights Analyst → HTML Converter**
      - **OpenAI Chat Model1 (ai_languageModel) → HTML Converter**
18. **Add Gmail node “Send a message”**
    - Node type: **Gmail**
    - Operation: **Send**
    - To: replace `YOUR_EMAIL`
    - Subject: `Product review`
    - Message: `{{$json.text}}`
    - Credentials: **Gmail OAuth2**
    - Connect: **HTML Converter → Send a message**
19. **Credentials checklist**
    - WooCommerce (HTTP Basic or equivalent) for reviews endpoint
    - WooCommerce API credentials for the WooCommerce node
    - OpenAI API key
    - Gmail OAuth2 connection
20. **Replace placeholders**
    - `PRODUCT_ID`, `YOUR_WEBSITE`, `YOUR_EMAIL`
21. **Run via Manual Trigger** and verify:
    - Reviews are returned (and not paginated away)
    - Agent report includes correct strength/confidence fields (consider renaming `strenght` → `strength`)

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| WooCommerce Product Review Sentiment Analysis and Detailed AI Report Generation for Improvement (overview + setup guidance embedded in workflow) | Sticky note content in workflow canvas |
| “MY NEW YOUTUBE CHANNEL” + subscription link and banner image | https://youtube.com/@n3witalia ; Image: https://n3wstorage.b-cdn.net/n3witalia/youtube-n8n-cover.jpg |
| QuickChart endpoint used for chart rendering | https://quickchart.io/chart |