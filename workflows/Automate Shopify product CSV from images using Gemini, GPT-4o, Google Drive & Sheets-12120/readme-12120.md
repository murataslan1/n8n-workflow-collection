Automate Shopify product CSV from images using Gemini, GPT-4o, Google Drive & Sheets

https://n8nworkflows.xyz/workflows/automate-shopify-product-csv-from-images-using-gemini--gpt-4o--google-drive---sheets-12120


# Automate Shopify product CSV from images using Gemini, GPT-4o, Google Drive & Sheets

## 1. Workflow Overview

**Purpose:** This workflow automates converting jewelry product images stored in Google Drive into **Shopify-ready product data** and a **Shopify CSV** (via a “final_product_data” Google Sheet). It uses **Gemini** for image understanding and category-specific content generation, stores intermediate state in **Google Sheets**, uploads images to **Shopify Files** via GraphQL staged uploads, then compiles final import rows.

**Target use cases**
- Bulk listing jewelry products on Shopify from image-only catalogs.
- Standardizing titles, HTML descriptions, tags, and Google Shopping categories.
- Reducing manual work for e-commerce agencies/teams.

### Logical blocks (high-level)
1.1 **Step-1: Drive → Sheet ingestion** (form input folder name → list images → parse SKU/color → append rows in `data_preparation`)  
1.2 **Step-2: Image analysis** (fetch “gathered data” rows → download image → Gemini vision analyze → write analysis text back to sheet)  
1.3 **Step-3: Categorization** (fetch “image analyzed” rows → AI Agent categorizes → update `category`, status “categorized”)  
1.4 **Step-4: Category-based content generation** (fetch “categorized” rows → Switch by category → dedicated content agent → convert to HTML → update sheet with tags, HTML, Product Category, status “content generated”)  
1.5 **Step-5: Upload image to Shopify & store CDN URL** (fetch “content generated” rows → stagedUploadsCreate → upload to GCS → fileCreate → poll node preview URL → update sheet with `image_url`, status “finalized”)  
1.6 **Step-6: Build final CSV rows** (fetch finalized rows → structure columns/body → append to `final_product_data` sheet)

---

## 2. Block-by-Block Analysis

### 2.1 Step-1 | Update image data from Drive to Sheet (Ingestion)

**Overview:** Accepts a folder name (vendor/brand), searches within a Drive “pending” folder, lists images, extracts SKU + color codes from filenames, assigns variant numbering per SKU, then appends prepared rows into the `data_preparation` sheet with `work_status = gathered data`.

**Nodes involved**
- `START` (Form Trigger)
- `query_folder_name1` (Set)
- `Search_folders1` (Google Drive)
- `image_within_folder1` (Google Drive)
- `sku_structuring1` (Code)
- `sku_sort` (Sort)
- `variant_numbering1` (Code)
- `looping1` (Split in Batches)
- `add_image_data2` (Google Sheets)
- Sticky notes: `Sticky Note6`, and global context notes `Sticky Note12`

#### Node details

**START**
- **Type/role:** `n8n-nodes-base.formTrigger` – public form/webhook entry point.
- **Config:** Form titled “Upload the folder/file details”, one required field `folder_name`.
- **Output:** `{ folder_name: "..." }`
- **Edge cases:** invalid vendor folder name → no Drive results downstream.

**query_folder_name1**
- **Type/role:** Set node to normalize input.
- **Config:** sets `folder_name = {{$json.folder_name}}`.
- **Edge cases:** none; if form field missing, downstream query empty.

**Search_folders1**
- **Type/role:** Google Drive “Search” (resource `fileFolder`, searching `folders`).
- **Config choices:**
  - Parent folder is a fixed Drive folder ID (cached name “pending”).
  - Query string is the vendor folder name.
  - `returnAll: true`, `alwaysOutputData: true` (prevents workflow stopping on zero results).
- **Output:** list of matching folders (expects one brand folder).
- **Failure modes:** OAuth issues; “pending” folder ID wrong; multiple folders with same name.

**image_within_folder1**
- **Type/role:** Google Drive list files within folder.
- **Config:** folderId from `Search_folders1` result (`{{$json.id}}`), returns all files.
- **Note:** queryString is `"="` (effectively no filter).
- **Failure modes:** folder empty → next code node gets no items.

**sku_structuring1**
- **Type/role:** Code node to parse filename into SKU and color codes.
- **Key logic:**
  - Removes file extension.
  - Extracts trailing `[A-Za-z-]+` as `colorPart`.
  - Splits `colorPart` into `colorCodes` by `-`.
  - Maps codes to full names via an internal `colorMap` (large mapping).
  - Extracts SKU as “everything before first letter”: `base.match(/^[^A-Za-z]+/)`.
  - Produces: `fileId`, `fileName`, `sku`, `colorCodes`, `colors`, `colorCombined`.
- **Edge cases:**
  - Filenames not matching `<SKU><ColorCode>` (e.g., missing trailing letters) → `sku` may be `""`, colors empty.
  - Multi-dash codes must match mapping; unmapped codes default to uppercase raw code.

**sku_sort**
- **Type/role:** Sort items by `sku` to group variants.
- **Failure modes:** if `sku` missing → sorting inconsistent.

**variant_numbering1**
- **Type/role:** Code node assigns `variant_no` per SKU.
- **Key logic:** resets counter when SKU changes (relies on prior sort).
- **Edge cases:** unsorted input → variant numbering wrong.

**looping1** (`SplitInBatches`)
- **Type/role:** batching loop.
- **Config:** default options (batch size not specified; n8n default typically 100).
- **Connections:** uses **second output** to `add_image_data2` (unusual but valid; output 0 is “done”, output 1 is “items”).
- **Edge cases:** incorrect output wiring can skip processing if changed.

**add_image_data2** (Google Sheets Append)
- **Type/role:** append image metadata row into `data_preparation`.
- **Config:**
  - Spreadsheet: `Jewel_E_Market`
  - Sheet: `data_preparation`
  - Writes: `sku`, `file_id`, `file_name`, `color_code`, `combine_color`, `variant_code`, `sku+color`, `vendor_name`, `work_status="gathered data"`.
  - `vendor_name` is folder name from `Search_folders1`.
  - **Important:** `sku+color` uses `{{ $json.sku }}{{ $('sku_structuring1').item.json.colorCodes[0] }}` (depends on the first color code).
- **Potential issue:** `matchingColumns` is set to `["unique_ID"]` but `unique_ID` is not in the schema → append is fine, but matching config is inconsistent (could confuse later maintenance).
- **Failure modes:** Sheets auth; schema mismatch; missing columns.

---

### 2.2 Step-2 | Analyze image and update the data to sheet

**Overview:** Periodically selects rows with `work_status = gathered data`, downloads each image from Drive, sends it to Gemini vision analysis, then stores the extracted description in `image_date` and sets `work_status = image analyzed`.

**Nodes involved**
- `Schedule Trigger`  
- `pending_image_to analyze` (Google Sheets get rows)
- `Loop Over Items1` (Split in Batches)
- `Download file1` (Google Drive download)
- `Analyze an image` (Google Gemini Vision analyze)
- `Wait`
- `Update row in sheet` (Google Sheets update)
- Sticky note: `Sticky Note2`

#### Node details

**Schedule Trigger**
- **Type/role:** timed entry.
- **Config:** interval is present but unspecified in JSON (`interval:[{}]`) → in UI it likely means “every X” but must be set.
- **Edge cases:** if interval not configured, won’t run reliably.

**pending_image_to analyze** (Google Sheets)
- **Type/role:** fetch rows to process.
- **Filter:** `work_status = "gathered data"`.
- **executeOnce:** true (only first run per workflow execution in manual mode; schedules still run per trigger execution).
- **Failure modes:** sheet permissions; filter column mismatch.

**Loop Over Items1**
- **Role:** batch processing of rows.

**Download file1** (Google Drive download)
- **Config:** `fileId = {{$json.file_id}}`
- **Output:** binary data typically under `binary.data`.
- **Failure modes:** file removed/moved; Drive permission.

**Analyze an image** (`@n8n/n8n-nodes-langchain.googleGemini`)
- **Role:** Gemini multimodal analysis on binary image.
- **Config:**
  - Model: `models/gemini-2.5-flash`
  - Resource: `image`, operation `analyze`, `inputType=binary`
  - Prompt text: “Extract all the available jewelry details and ingnore other distraction appart from it.”
  - `executeOnce: true`, `retryOnFail: true`, `waitBetweenTries: 5000`.
- **Output:** in practice the workflow uses `{{$json.candidates[0].content.parts[0].text}}`.
- **Edge cases:**
  - If Gemini returns a different structure (no `candidates`), update node fails.
  - Image too large/unsupported format (mimeType assumptions).
  - `executeOnce: true` can prevent per-item re-execution in some contexts—verify behavior in your n8n version.

**Wait**
- **Role:** throttling; waits 16 (seconds).
- **Purpose:** reduce rate limits / ensure Gemini response stability.
- **Edge cases:** long queues; unnecessary waiting slows throughput.

**Update row in sheet**
- **Type/role:** Google Sheets update row by `file_id`.
- **Writes:**
  - `image_date = {{$json.candidates[0].content.parts[0].text}}`
  - `work_status = "image analyzed"`
  - `file_id` re-set from downloaded item.
- **Matching:** `matchingColumns=["file_id"]`
- **Failure modes:** row not found by `file_id` (duplicates or missing); expression fails if Gemini output path missing.

---

### 2.3 Step-3 | Retrieving main category (AI categorization)

**Overview:** Fetches rows with `work_status = image analyzed`, uses an AI Agent (Gemini chat model + structured parser with autofix) to classify product into a strict category, then updates the row’s `category` and status to `categorized`.

**Nodes involved**
- `Schedule Trigger4`
- `Get row(s) in sheet2`
- `Loop Over Items4`
- `AI Agent2`
- `Google Gemini Chat Model2`
- `Simple Memory2`
- `Structured Output Parser`
- `Auto-fixing Output Parser`
- `OpenAI Chat Model1` (wired to autofix parser)
- `Wait1`
- `Update row in sheet3`
- Sticky note: `Sticky Note7`

#### Node details

**Get row(s) in sheet2**
- **Filter:** `work_status = "image analyzed"`.
- **Output:** includes `image_date` (the text description from Step-2).

**AI Agent2** (`@n8n/n8n-nodes-langchain.agent`)
- **Role:** categorization agent.
- **Input text:** `Image Data : {{$json.image_date}}`
- **System message:** extensive category priority list + guardrails + strict JSON-only format.
- **Output parser:** enabled (`hasOutputParser: true`), expects JSON with keys `p_category`, `p_reason`, `p_confidence`, etc.
- **Language model:** `Google Gemini Chat Model2` (models/gemini-3-flash-preview).
- **Memory:** `Simple Memory2` (session key = current minute).
- **Failure modes:**
  - Model returns non-JSON → parser needed.
  - Session key based on minute can collide across parallel runs (same minute) causing cross-talk in memory.

**Structured Output Parser**
- **Role:** defines the expected schema.
- **Schema:** manual JSON skeleton with confidence percentages.

**Auto-fixing Output Parser**
- **Role:** attempts to repair malformed JSON outputs.
- **Important wiring:** It uses `OpenAI Chat Model1` as the model to help autofix.

**OpenAI Chat Model1**
- **Role:** LLM for parser autofix.
- **Model:** `gpt-4o-mini`.
- **Failure modes:** OpenAI credential missing; added cost; network timeouts.

**Wait1**
- **Role:** wait 2 seconds before updating sheet (throttling).

**Update row in sheet3**
- **Writes:**
  - `category = {{$json.output.p_category}}`
  - `work_status = "categorized"`
  - matches by `file_id` from the loop item.
- **Failure modes:** parser output path differs (some n8n agent nodes output at `json.output` vs `json` depending on version); ensure the referenced path is correct in your runtime.

---

### 2.4 Step-4 | Retrieving category, generating content, Tags (Category-based content generation)

**Overview:** Reads categorized products, routes them by category using a Switch node, invokes a dedicated category content agent (Gemini + structured output), converts the text fields into Shopify-safe HTML, and updates the original row with `product_name`, `ai_description` (HTML), `tags`, `ai_ideal_for`, `Product Category`, and sets `work_status = content generated`. After each update, a central `Wait2` gates back into the batch loop.

**Nodes involved**
- `Schedule Trigger1`
- `Get row(s) in sheet`
- `Wait2`
- `Loop Over Items2`
- `Switch`
- Category branches (for each category):
  - AI model nodes: `Gemini`, `Gemini1`, `Gemini2`, `Gemini3`, `Gemini5`, `Gemini6`, `Gemini7`, `Gemini8`, `Gemini9`, `Gemini10`, `Gemini11`, `Gemini12`, `Gemini13`
  - Memory nodes: `Memory`, `Memory1`…`Memory13`
  - Structured parsers: `Structured`, `Structured1`…`Structured13`
  - Agents: `Necklace item`, `Earrings item`, `Bangles item`, `Rings item`, `Combo item`, `Hair accessories item`, `Jewellery Accessories item`, `Pandents item`, `Bindi item`, `Rakhi item`, `Brooch item`, `Bridal item`, `Chain item`
  - HTML converter code nodes: `text to HTML`, `text to HTML1`, `text to HTML2`, `text to HTML3`, `text to HTML5`, `text to HTML6`, `text to HTML7`, `text to HTML8`, `text to HTML10`, `text to HTML11`, `text to HTML12`, `text to HTML13`, `text to HTML14`
  - Sheet updates: `update Necklace data`, `update Earrings data`, `update Bangles data`, `update Rings data`, `update Combo data`, `update Hair accessories data`, `update Jewellery Accessories data`, `update Pandents data`, `update Bindi data`, `update Rakhi data`, `update Brooch data`, `update bridal data`, `update chain data`
- Sticky notes: `Sticky Note4`, plus demo notes `Sticky Note9`, `Sticky Note10`

#### Node details (core routing)

**Get row(s) in sheet**
- **Filter:** `work_status = "categorized"` and `product_name` (second filter entry exists but unclear—likely “is not empty” in UI; JSON shows `{"lookupColumn":"product_name"}` without a value).
- **Risk:** if the second filter is misconfigured, it may return nothing.

**Loop Over Items2**
- **Role:** process each categorized row.

**Switch**
- **Role:** route by `{{$json.category}}`.
- **Outputs:** Necklace, Earrings, Bangles, Rings, Combo, Hair Accessories, Jewellery Accessories, “Pandents” (typo), Bindi, Rakhi, Brooch, Bridal, Chain.
- **Potential bug:** one rule checks `rightValue:"Pandents"` (typo) while earlier categorizer system message uses “Pendants”. If categorizer outputs “Pendants”, Switch route will fail and item won’t be processed.
- **Edge cases:** category capitalization mismatch; missing default route (no “fallback” output).

#### Node details (per category pattern)
Each category branch follows the same architecture:

1) **Category Agent** (e.g., `Necklace item`)
- `@n8n/n8n-nodes-langchain.agent`, promptType `define`, `hasOutputParser: true`
- Input: `Image Data : {{$json.image_date}}`
- Uses a connected `GeminiX` chat model and `MemoryX`.
- Output JSON keys: `product_name`, `description`, `ideal_for`, `final_tags`, `technical_specs` (schema differs per category).
- Failure modes: agent returns non-JSON; schema mismatch; hallucinated fields.

2) **Structured Parser** (e.g., `Structured13`)
- Enforces schema; `autoFix: true`.

3) **Gemini 2.5 flash** model (e.g., `Gemini 2.5flash13`)
- Provides the actual LLM behind schema parsing.

4) **text to HTML** Code node (e.g., `text to HTML14`)
- Converts `output` JSON to:
  - `<h2>product_name</h2>`
  - `<p>description` with sentence breaks as `<br><br>` (regex `.replace(/\.\s+/g, ".<br><br>")`)
  - `<table>` from non-null `technical_specs` entries
- Outputs combined `html_content` plus original fields.
- Failure modes: if `output` missing; if `technical_specs` not an object.

5) **update <Category> data** (Google Sheets update)
- Matches by `file_id = {{$('Switch').item.json.file_id}}`
- Writes:
  - `tags = {{$json.final_tags}}`
  - `ai_ideal_for = {{$json.ideal_for}}`
  - `product_name = {{$('Get row(s) in sheet').item.json.vendor_name}} {{$json.product_name}}` (prefixes vendor)
  - `ai_description = {{$json.html_content}}`
  - `Product Category = <Google Shopping category string>`
  - `work_status = "content generated"`

**Wait2**
- Wait 1 second then routes back to `Loop Over Items2` (keeps the loop moving).
- Failure modes: if Wait2 connection is broken, loop stops after first item.

---

### 2.5 Step-5 | Upload image to Shopify asset and update the image link to sheet

**Overview:** For sheet rows with `work_status = content generated`, downloads the image from Google Drive, creates a Shopify staged upload target, uploads the image to Shopify’s storage (GCS), creates a Shopify `File` object, queries for its CDN preview URL, then writes `image_url` and marks row as `finalized`.

**Nodes involved**
- `When clicking ‘Execute workflow’` (Manual Trigger) and/or scheduled execution via other triggers
- `get product data` (Google Sheets get rows)
- `Loop Over Items` (Split in Batches)
- `HTTP Request` (Shopify GraphQL stagedUploadsCreate)
- `Download file` (Google Drive download)
- `HTTP Request1` (multipart upload to staged target)
- `HTTP Request2` (Shopify GraphQL fileCreate)
- `HTTP Request3` (Shopify GraphQL query node preview URL)
- `Update row in sheet2` (Google Sheets update)
- Sticky note: `Sticky Note3`

#### Node details

**get product data**
- **Filter:** `work_status = "content generated"`.
- **executeOnce:** true.
- **Edge cases:** if Step-4 didn’t set status due to Switch mismatch, items never reach here.

**HTTP Request** (stagedUploadsCreate)
- **Type/role:** HTTP Request node calling Shopify GraphQL.
- **URL:** `https://1qzkpy-1s.myshopify.com/admin/api/2025-10/graphql.json`
- **Headers:** `X-Shopify-Access-Token: enter access token` (must be replaced with real token or credential-based header).
- **Body:** GraphQL mutation `stagedUploadsCreate` for `PRODUCT_IMAGE`
  - uses `filename: {{$json.file_name}}`
  - `mimeType: image/jpeg` (hardcoded)
- **Failure modes:**
  - Invalid token / insufficient scopes.
  - Wrong API version.
  - filename missing.
  - mimeType mismatch (PNG uploaded as JPEG declared).

**Download file** (Google Drive)
- **Config:** fileId from `Loop Over Items` item (`{{$('Loop Over Items').item.json.file_id}}`)
- Provides binary `data` for multipart upload.

**HTTP Request1** (POST to staged upload URL)
- **URL:** `https://shopify-staged-uploads.storage.googleapis.com` (Shopify’s staged upload endpoint)
- **Content-Type:** multipart/form-data
- **Body parameters:** uses `stagedTargets[0].parameters[n].value` from the previous GraphQL response to populate required form fields, plus:
  - `file` as binary from `inputDataFieldName: "data"`
- **Failure modes:**
  - Parameter order assumptions: it references indices `[0]..[8]`. If Shopify changes order, this breaks. Safer approach: map by parameter name.
  - Missing binary field name `data` (depends on Drive node output naming).

**HTTP Request2** (fileCreate)
- **Role:** convert staged upload into a Shopify File object.
- **GraphQL:** mutation `fileCreate`
- **Variables:**
  - `alt` from sheet `product_name`
  - `originalSource` extracted from the XML response of upload: `{{$json.data.match(/<Location>(.*?)<\/Location>/)[1]}}`
- **Failure modes:**
  - If upload response is not XML or `<Location>` missing → regex throws.
  - Shopify userErrors in response not handled.

**HTTP Request3** (query file preview URL)
- **GraphQL query:** `node(id: "<file id>") { ... on File { fileStatus preview { image { url }}}}`
- **Failure modes:** file not ready yet; `preview.image.url` null. Usually needs polling/retry.

**Update row in sheet2**
- **Writes:**
  - `image_url = {{$json.data.node.preview.image.url}}`
  - `work_status = "finalized"`
- **Edge cases:** preview URL not present yet → writes blank and marks finalized incorrectly.

---

### 2.6 Step-6 | Prepare final CSV to upload (Final sheet compilation)

**Overview:** Reads “finalized” items (though the filter currently uses `work_status=ddrr`), builds Shopify CSV fields (handle/title/tags/type/category/HTML) and appends them into `final_product_data` sheet.

**Nodes involved**
- `Schedule Trigger2`
- `get finalized data`
- `Loop Over Items3`
- `nothing` (NoOp)
- `structuring columns` (Code)
- `structuring body content` (Code)
- `Append row in sheet` (Google Sheets append)
- Sticky note: `Sticky Note`, plus final guidance `Sticky Note13`

#### Node details

**get finalized data**
- **Filter:** `work_status = "ddrr"` (this appears wrong; expected “finalized”).
- **Impact:** Step-6 will never run correctly unless work_status is actually “ddrr”.
- **Fix:** set filter to `finalized`.

**structuring columns** (Code)
- **Role:** compute Shopify-friendly fields and enrich tags.
- **Key logic:**
  - `categoryMap` maps `data.category` to:
    - `gCat` (Google product category string)
    - `type` (Shopify type)
    - base tags array
  - Adds keyword-based tags from `product_name` + existing `tags`:
    - e.g., “kund” → “Kundan Sets”, “haram” → “Haram”, “ad” → “AD Necklaces”, etc.
  - Produces: `handle`, `title`, `vendor`, `product_category`, `type`, `tags`, `color`, `image_alt_text`, `seo_title`
- **Edge cases:**
  - If `data.category` mismatches map keys (pluralization, typos), fallback is used.
  - Tags concatenation can include `undefined` if `data.tags` missing.

**structuring body content** (Code)
- **Role:** constructs simplified HTML for Shopify body based on `ai_description` and `ai_ideal_for`.
- **Important:** It uses `$('get finalized data').first().json` rather than the current loop item → likely wrong when multiple items; it will reuse the first row for all outputs.
- **Fix:** use `$input.first().json` (or `$('Loop Over Items3').item.json`) instead.

**Append row in sheet** (Google Sheets append)
- **Writes:** a large set of Shopify import columns into `final_product_data`.
- **Key mappings:**
  - `Handle`, `Title`, `Vendor`, `Tags`, `Type`, `Product Category`
  - `Body (HTML)` from `$json.body_html`
  - `Image Src` and `Variant Image` from `image_url`
  - Variant fields: SKU from `sku+color`, inventory qty 20, tracker shopify, etc.
- **Edge cases:**
  - `Title` uses `{{$('Loop Over Items3').item.json.product_name}}` but `product_name` is already vendor-prefixed in earlier steps—could double-prefix depending on Step-4 behavior.
  - `Google Shopping / Google Product Category` uses `['Product Category']` column (not the computed one).

---

## 3. Summary Table (all nodes)

> Sticky notes are duplicated for nodes visually belonging to those steps. Where coverage is uncertain from JSON alone, notes are applied to the most relevant nodes in that step.

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| When clicking ‘Execute workflow’ | manualTrigger | Manual entry point (Step-5 run) | — | get product data | # Step-5 \| Upload image to shopify asset and update the image link to sheet |
| Schedule Trigger | scheduleTrigger | Step-2 scheduler | — | pending_image_to analyze | # Step-2 \| Analyze image and update the data to sheet |
| pending_image_to analyze | googleSheets | Fetch rows where `work_status=gathered data` | Schedule Trigger | Loop Over Items1 | # Step-2 \| Analyze image and update the data to sheet |
| Loop Over Items1 | splitInBatches | Batch rows for analysis | pending_image_to analyze | Download file1 | # Step-2 \| Analyze image and update the data to sheet |
| Download file1 | googleDrive | Download image binary for Gemini | Loop Over Items1 | Analyze an image | # Step-2 \| Analyze image and update the data to sheet |
| Analyze an image | googleGemini (langchain) | Vision analysis of jewelry image | Download file1 | Wait | # Step-2 \| Analyze image and update the data to sheet |
| Wait | wait | Throttle before sheet update | Analyze an image | Update row in sheet | # Step-2 \| Analyze image and update the data to sheet |
| Update row in sheet | googleSheets | Write image analysis text + status | Wait | Loop Over Items1 | # Step-2 \| Analyze image and update the data to sheet |
| Schedule Trigger4 | scheduleTrigger | Step-3 scheduler | — | Get row(s) in sheet2 | # Step-3 \| Retreving main category |
| Get row(s) in sheet2 | googleSheets | Fetch rows where `work_status=image analyzed` | Schedule Trigger4 | Loop Over Items4 | # Step-3 \| Retreving main category |
| Loop Over Items4 | splitInBatches | Batch rows for categorization | Get row(s) in sheet2 | AI Agent2 | # Step-3 \| Retreving main category |
| Google Gemini Chat Model2 | lmChatGoogleGemini | LLM for categorization agent | — | AI Agent2 (ai_languageModel) | # Step-3 \| Retreving main category |
| Simple Memory2 | memoryBufferWindow | Agent memory | — | AI Agent2 (ai_memory) | # Step-3 \| Retreving main category |
| Structured Output Parser | outputParserStructured | Schema for categorization output | — | Auto-fixing Output Parser | # Step-3 \| Retreving main category |
| OpenAI Chat Model1 | lmChatOpenAi | LLM used to auto-fix parser output | — | Auto-fixing Output Parser | # Step-3 \| Retreving main category |
| Auto-fixing Output Parser | outputParserAutofixing | Fix non-JSON / malformed JSON | OpenAI Chat Model1, Structured Output Parser | AI Agent2 (ai_outputParser) | # Step-3 \| Retreving main category |
| AI Agent2 | langchain.agent | Categorize product from image analysis | Loop Over Items4 | Wait1 | # Step-3 \| Retreving main category |
| Wait1 | wait | Throttle before sheet update | AI Agent2 | Update row in sheet3 | # Step-3 \| Retreving main category |
| Update row in sheet3 | googleSheets | Write `category`, status categorized | Wait1 | Loop Over Items4 | # Step-3 \| Retreving main category |
| Schedule Trigger1 | scheduleTrigger | Step-4 scheduler | — | Get row(s) in sheet | # Step-4 \| Retreving category, generating content, Tags |
| Get row(s) in sheet | googleSheets | Fetch rows where `work_status=categorized` | Schedule Trigger1 | Loop Over Items2 | # Step-4 \| Retreving category, generating content, Tags |
| Wait2 | wait | Loop pacing for content generation | update* nodes | Loop Over Items2 | # Step-4 \| Retreving category, generating content, Tags |
| Loop Over Items2 | splitInBatches | Batch rows for content generation | Get row(s) in sheet, Wait2 | Switch | # Step-4 \| Retreving category, generating content, Tags |
| Switch | switch | Route by `category` | Loop Over Items2 | Category agent nodes | # Step-4 \| Retreving category, generating content, Tags |
| Gemini | lmChatGoogleGemini | LLM for Bridal agent branch | — | Bridal item (ai_languageModel) | # Step-4 \| Retreving category, generating content, Tags |
| Memory | memoryBufferWindow | Memory for Bridal agent | — | Bridal item (ai_memory) | # Step-4 \| Retreving category, generating content, Tags |
| Structured | outputParserStructured | Schema for Bridal output | — | Bridal item (ai_outputParser) | # Step-4 \| Retreving category, generating content, Tags |
| Bridal item | langchain.agent | Generate Bridal content JSON | Switch | text to HTML | # Step-4 \| Retreving category, generating content, Tags |
| text to HTML | code | Convert Bridal JSON to HTML | Bridal item | update bridal data | # Step-4 \| Retreving category, generating content, Tags |
| update bridal data | googleSheets | Update sheet with Bridal content | text to HTML | Wait2 | # Step-4 \| Retreving category, generating content, Tags |
| Gemini1 | lmChatGoogleGemini | LLM for Chain branch | — | Chain item (ai_languageModel) | # Step-4 \| Retreving category, generating content, Tags |
| Memory1 | memoryBufferWindow | Memory for Chain branch | — | Chain item (ai_memory) | # Step-4 \| Retreving category, generating content, Tags |
| Structured1 | outputParserStructured | Schema for Chain output | — | Chain item (ai_outputParser) | # Step-4 \| Retreving category, generating content, Tags |
| Chain item | langchain.agent | Generate Chain content JSON | Switch | text to HTML1 | # Step-4 \| Retreving category, generating content, Tags |
| text to HTML1 | code | Convert Chain JSON to HTML | Chain item | update chain data | # Step-4 \| Retreving category, generating content, Tags |
| update chain data | googleSheets | Update sheet with Chain content | text to HTML1 | Wait2 | # Step-4 \| Retreving category, generating content, Tags |
| Gemini13 | lmChatGoogleGemini | LLM for Necklace branch | — | Necklace item (ai_languageModel) | # Step-4 \| Retreving category, generating content, Tags |
| Memory13 | memoryBufferWindow | Memory for Necklace | — | Necklace item (ai_memory) | # Step-4 \| Retreving category, generating content, Tags |
| Structured13 | outputParserStructured | Schema for Necklace | — | Necklace item (ai_outputParser) | # Step-4 \| Retreving category, generating content, Tags |
| Necklace item | langchain.agent | Generate Necklace JSON | Switch | text to HTML14 | # Step-4 \| Retreving category, generating content, Tags |
| text to HTML14 | code | Necklace JSON → HTML | Necklace item | update Necklace data | # Step-4 \| Retreving category, generating content, Tags |
| update Necklace data | googleSheets | Update necklace content in sheet | text to HTML14 | Wait2 | # Step-4 \| Retreving category, generating content, Tags |
| Gemini11 | lmChatGoogleGemini | LLM for Earrings branch | — | Earrings item (ai_languageModel) | # Step-4 \| Retreving category, generating content, Tags |
| Memory11 | memoryBufferWindow | Memory for Earrings | — | Earrings item (ai_memory) | # Step-4 \| Retreving category, generating content, Tags |
| Structured11 | outputParserStructured | Schema for Earrings | — | Earrings item (ai_outputParser) | # Step-4 \| Retreving category, generating content, Tags |
| Earrings item | langchain.agent | Generate Earrings JSON | Switch | text to HTML12 | # Step-4 \| Retreving category, generating content, Tags |
| text to HTML12 | code | Earrings JSON → HTML | Earrings item | update Earrings data | # Step-4 \| Retreving category, generating content, Tags |
| update Earrings data | googleSheets | Update earrings content in sheet | text to HTML12 | Wait2 | # Step-4 \| Retreving category, generating content, Tags |
| Gemini12 | lmChatGoogleGemini | LLM for Bangles branch | — | Bangles item (ai_languageModel) | # Step-4 \| Retreving category, generating content, Tags |
| Memory12 | memoryBufferWindow | Memory for Bangles | — | Bangles item (ai_memory) | # Step-4 \| Retreving category, generating content, Tags |
| Structured12 | outputParserStructured | Schema for Bangles | — | Bangles item (ai_outputParser) | # Step-4 \| Retreving category, generating content, Tags |
| Bangles item | langchain.agent | Generate Bangles JSON | Switch | text to HTML13 | # Step-4 \| Retreving category, generating content, Tags |
| text to HTML13 | code | Bangles JSON → HTML | Bangles item | update Bangles data | # Step-4 \| Retreving category, generating content, Tags |
| update Bangles data | googleSheets | Update bangles content in sheet | text to HTML13 | Wait2 | # Step-4 \| Retreving category, generating content, Tags |
| Gemini9 | lmChatGoogleGemini | LLM for Rings branch | — | Rings item (ai_languageModel) | # Step-4 \| Retreving category, generating content, Tags |
| Memory9 | memoryBufferWindow | Memory for Rings | — | Rings item (ai_memory) | # Step-4 \| Retreving category, generating content, Tags |
| Structured9 | outputParserStructured | Schema for Rings | — | Rings item (ai_outputParser) | # Step-4 \| Retreving category, generating content, Tags |
| Rings item | langchain.agent | Generate Rings JSON | Switch | text to HTML10 | # Step-4 \| Retreving category, generating content, Tags |
| text to HTML10 | code | Rings JSON → HTML | Rings item | update Rings data | # Step-4 \| Retreving category, generating content, Tags |
| update Rings data | googleSheets | Update rings content in sheet | text to HTML10 | Wait2 | # Step-4 \| Retreving category, generating content, Tags |
| Gemini10 | lmChatGoogleGemini | LLM for Combo branch | — | Combo item (ai_languageModel) | # Step-4 \| Retreving category, generating content, Tags |
| Memory10 | memoryBufferWindow | Memory for Combo | — | Combo item (ai_memory) | # Step-4 \| Retreving category, generating content, Tags |
| Structured10 | outputParserStructured | Schema for Combo | — | Combo item (ai_outputParser) | # Step-4 \| Retreving category, generating content, Tags |
| Combo item | langchain.agent | Generate Combo JSON | Switch | text to HTML11 | # Step-4 \| Retreving category, generating content, Tags |
| text to HTML11 | code | Combo JSON → HTML | Combo item | update Combo data | # Step-4 \| Retreving category, generating content, Tags |
| update Combo data | googleSheets | Update combo content in sheet | text to HTML11 | Wait2 | # Step-4 \| Retreving category, generating content, Tags |
| Gemini8 | lmChatGoogleGemini | LLM for Hair Accessories | — | Hair accessories item (ai_languageModel) | # Step-4 \| Retreving category, generating content, Tags |
| Memory8 | memoryBufferWindow | Memory for Hair Accessories | — | Hair accessories item (ai_memory) | # Step-4 \| Retreving category, generating content, Tags |
| Structured8 | outputParserStructured | Schema for Hair Accessories | — | Hair accessories item (ai_outputParser) | # Step-4 \| Retreving category, generating content, Tags |
| Hair accessories item | langchain.agent | Generate Hair Accessories JSON | Switch | text to HTML8 | # Step-4 \| Retreving category, generating content, Tags |
| text to HTML8 | code | Hair Accessories JSON → HTML | Hair accessories item | update Hair accessories data | # Step-4 \| Retreving category, generating content, Tags |
| update Hair accessories data | googleSheets | Update hair accessories content | text to HTML8 | Wait2 | # Step-4 \| Retreving category, generating content, Tags |
| Gemini6 | lmChatGoogleGemini | LLM for Jewellery Accessories | — | Jewellery Accessories item (ai_languageModel) | # Step-4 \| Retreving category, generating content, Tags |
| Memory6 | memoryBufferWindow | Memory for Jewellery Accessories | — | Jewellery Accessories item (ai_memory) | # Step-4 \| Retreving category, generating content, Tags |
| Structured6 | outputParserStructured | Schema for Jewellery Accessories | — | Jewellery Accessories item (ai_outputParser) | # Step-4 \| Retreving category, generating content, Tags |
| Jewellery Accessories item | langchain.agent | Generate Accessories JSON | Switch | text to HTML6 | # Step-4 \| Retreving category, generating content, Tags |
| text to HTML6 | code | Accessories JSON → HTML | Jewellery Accessories item | update Jewellery Accessories data | # Step-4 \| Retreving category, generating content, Tags |
| update Jewellery Accessories data | googleSheets | Update accessories content | text to HTML6 | Wait2 | # Step-4 \| Retreving category, generating content, Tags |
| Gemini7 | lmChatGoogleGemini | LLM for “Pandents” | — | Pandents item (ai_languageModel) | # Step-4 \| Retreving category, generating content, Tags |
| Memory7 | memoryBufferWindow | Memory for “Pandents” | — | Pandents item (ai_memory) | # Step-4 \| Retreving category, generating content, Tags |
| Structured7 | outputParserStructured | Schema for “Pandents” | — | Pandents item (ai_outputParser) | # Step-4 \| Retreving category, generating content, Tags |
| Pandents item | langchain.agent | Generate Pendant JSON | Switch | text to HTML7 | # Step-4 \| Retreving category, generating content, Tags |
| text to HTML7 | code | Pendant JSON → HTML | Pandents item | update Pandents data | # Step-4 \| Retreving category, generating content, Tags |
| update Pandents data | googleSheets | Update pendant content | text to HTML7 | Wait2 | # Step-4 \| Retreving category, generating content, Tags |
| Gemini5 | lmChatGoogleGemini | LLM for Bindi | — | Bindi item (ai_languageModel) | # Step-4 \| Retreving category, generating content, Tags |
| Memory5 | memoryBufferWindow | Memory for Bindi | — | Bindi item (ai_memory) | # Step-4 \| Retreving category, generating content, Tags |
| Structured5 | outputParserStructured | Schema for Bindi | — | Bindi item (ai_outputParser) | # Step-4 \| Retreving category, generating content, Tags |
| Bindi item | langchain.agent | Generate Bindi JSON | Switch | text to HTML5 | # Step-4 \| Retreving category, generating content, Tags |
| text to HTML5 | code | Bindi JSON → HTML | Bindi item | update Bindi data | # Step-4 \| Retreving category, generating content, Tags |
| update Bindi data | googleSheets | Update Bindi content | text to HTML5 | Wait2 | # Step-4 \| Retreving category, generating content, Tags |
| Gemini2 | lmChatGoogleGemini | LLM for Rakhi | — | Rakhi item (ai_languageModel) | # Step-4 \| Retreving category, generating content, Tags |
| Memory2 | memoryBufferWindow | Memory for Rakhi | — | Rakhi item (ai_memory) | # Step-4 \| Retreving category, generating content, Tags |
| Structured2 | outputParserStructured | Schema for Rakhi | — | Rakhi item (ai_outputParser) | # Step-4 \| Retreving category, generating content, Tags |
| Rakhi item | langchain.agent | Generate Rakhi JSON | Switch | text to HTML2 | # Step-4 \| Retreving category, generating content, Tags |
| text to HTML2 | code | Rakhi JSON → HTML | Rakhi item | update Rakhi data | # Step-4 \| Retreving category, generating content, Tags |
| update Rakhi data | googleSheets | Update Rakhi content | text to HTML2 | Wait2 | # Step-4 \| Retreving category, generating content, Tags |
| Gemini3 | lmChatGoogleGemini | LLM for Brooch | — | Brooch item (ai_languageModel) | # Step-4 \| Retreving category, generating content, Tags |
| Memory3 | memoryBufferWindow | Memory for Brooch | — | Brooch item (ai_memory) | # Step-4 \| Retreving category, generating content, Tags |
| Structured3 | outputParserStructured | Schema for Brooch | — | Brooch item (ai_outputParser) | # Step-4 \| Retreving category, generating content, Tags |
| Brooch item | langchain.agent | Generate Brooch JSON | Switch | text to HTML3 | # Step-4 \| Retreving category, generating content, Tags |
| text to HTML3 | code | Brooch JSON → HTML | Brooch item | update Brooch data | # Step-4 \| Retreving category, generating content, Tags |
| update Brooch data | googleSheets | Update Brooch content | text to HTML3 | Wait2 | # Step-4 \| Retreving category, generating content, Tags |
| get product data | googleSheets | Fetch `content generated` rows for Shopify upload | When clicking ‘Execute workflow’ | Loop Over Items | # Step-5 \| Upload image to shopify asset and update the image link to sheet |
| Loop Over Items | splitInBatches | Batch rows for Shopify upload | get product data | HTTP Request | # Step-5 \| Upload image to shopify asset and update the image link to sheet |
| HTTP Request | httpRequest | Shopify stagedUploadsCreate | Loop Over Items | Download file | # Step-5 \| Upload image to shopify asset and update the image link to sheet |
| Download file | googleDrive | Download image binary | HTTP Request | HTTP Request1 | # Step-5 \| Upload image to shopify asset and update the image link to sheet |
| HTTP Request1 | httpRequest | Upload binary to staged GCS | Download file | HTTP Request2 | # Step-5 \| Upload image to shopify asset and update the image link to sheet |
| HTTP Request2 | httpRequest | Shopify fileCreate from staged upload | HTTP Request1 | HTTP Request3 | # Step-5 \| Upload image to shopify asset and update the image link to sheet |
| HTTP Request3 | httpRequest | Query file preview URL | HTTP Request2 | Update row in sheet2 | # Step-5 \| Upload image to shopify asset and update the image link to sheet |
| Update row in sheet2 | googleSheets | Write `image_url`, mark finalized | HTTP Request3 | Loop Over Items | # Step-5 \| Upload image to shopify asset and update the image link to sheet |
| Schedule Trigger2 | scheduleTrigger | Step-6 scheduler | — | get finalized data | # Step-6 \| Prepare final CSV to upload |
| get finalized data | googleSheets | Fetch finalized rows (currently misfiltered) | Schedule Trigger2 | Loop Over Items3 | # Step-6 \| Prepare final CSV to upload |
| Loop Over Items3 | splitInBatches | Batch rows for final output | get finalized data | nothing / structuring columns | # Step-6 \| Prepare final CSV to upload |
| nothing | noOp | Placeholder / branch output | Loop Over Items3 | — | # Step-6 \| Prepare final CSV to upload |
| structuring columns | code | Build Shopify fields + tags | Loop Over Items3 | structuring body content | # Step-6 \| Prepare final CSV to upload |
| structuring body content | code | Build HTML body | structuring columns | Append row in sheet | # Step-6 \| Prepare final CSV to upload |
| Append row in sheet | googleSheets | Append final Shopify-import columns | structuring body content | Loop Over Items3 | # Step-6 \| Prepare final CSV to upload |
| Schedule Trigger (top) | scheduleTrigger | (already listed) | — | pending_image_to analyze |  |
| Manual Trigger etc. | manualTrigger | (already listed) | — | get product data |  |
| Sticky Note* nodes | stickyNote | Documentation only | — | — | (See Notes section) |

---

## 4. Reproducing the Workflow from Scratch (step-by-step)

1) **Create Google Sheets structure**
   1. Create spreadsheet `Jewel_E_Market`.
   2. Create sheet `data_preparation` with columns at least:  
      `file_id, file_name, vendor_name, sku, color_code, combine_color, sku+color, variant_code, image_date, image_url, product_name, category, Product Category, tags, ai_description, ai_ideal_for, work_status`
   3. Create sheet `final_product_data` with Shopify import columns used in “Append row in sheet” (Handle, Title, Body (HTML), Vendor, Type, Tags, Image Src, Variant SKU, etc.).

2) **Set up Google Drive folder structure**
   - Have a parent folder `pending` (keep its folderId).
   - Inside: `pending/<brand_name>/All_Images` (or similar; workflow searches vendor folder under pending).
   - Ensure filenames follow `<SKU><ColorCode>` (example in note: `12345GR`), with optional `-` separated color codes.

3) **Create credentials in n8n**
   - Google Drive OAuth2 credential.
   - Google Sheets OAuth2 credential.
   - Google Gemini / PaLM credential (for langchain Gemini nodes).
   - OpenAI API credential (used by the auto-fixing parser).
   - Shopify Admin API Access Token (custom header) or use an HTTP credential mechanism; ensure scopes for `write_files`/relevant GraphQL permissions.

4) **Build Step-1 nodes (Drive → Sheet ingestion)**
   1. Add **Form Trigger** node named `START` with one required field `folder_name`.
   2. Add **Set** node `query_folder_name1`: set `folder_name = {{$json.folder_name}}`. Connect `START → query_folder_name1`.
   3. Add **Google Drive** node `Search_folders1` (File/Folder resource):
      - Search within folderId = your `pending` folder
      - Search for folders
      - Query string = `{{$json.folder_name}}`
      - Return all = true
      - Always output data = true
      Connect `query_folder_name1 → Search_folders1`.
   4. Add **Google Drive** node `image_within_folder1`:
      - List files within folderId = `{{$json.id}}`
      - Return all = true
      Connect `Search_folders1 → image_within_folder1`.
   5. Add **Code** node `sku_structuring1`: paste the filename parsing + colorMap code (as in workflow).
   6. Add **Sort** node `sku_sort` sorting by `sku`.
   7. Add **Code** node `variant_numbering1` to assign `variant_no` (reset per sku).
   8. Add **Split in Batches** node `looping1`.
   9. Add **Google Sheets** node `add_image_data2` (Append) targeting `data_preparation`:
      - Map fields (`file_id`, `file_name`, `sku`, `color_code`, `combine_color`, `variant_code`, `sku+color`, `vendor_name`, `work_status="gathered data"`).
      - Match/update not needed; use append.
   10. Wire: `image_within_folder1 → sku_structuring1 → sku_sort → variant_numbering1 → looping1 (items output) → add_image_data2 → looping1 (continue)`.

5) **Build Step-2 nodes (image analysis)**
   1. Add **Schedule Trigger** `Schedule Trigger` (configure interval).
   2. Add **Google Sheets** `pending_image_to analyze` (Get Many) filter `work_status = gathered data`.
   3. Add **Split in Batches** `Loop Over Items1`.
   4. Add **Google Drive** `Download file1` (Download) with `fileId={{$json.file_id}}`.
   5. Add **Google Gemini Vision** `Analyze an image`:
      - Operation Analyze Image, binary input
      - Model `gemini-2.5-flash`
      - Prompt for extracting jewelry details
      - Enable retry if desired
   6. Add **Wait** node `Wait` (e.g., 16 seconds).
   7. Add **Google Sheets** `Update row in sheet` (Update) matching on `file_id`:
      - `image_date = {{$json.candidates[0].content.parts[0].text}}`
      - `work_status = image analyzed`
   8. Wire: `Schedule Trigger → pending_image_to analyze → Loop Over Items1 (items) → Download file1 → Analyze an image → Wait → Update row in sheet → Loop Over Items1`.

6) **Build Step-3 nodes (categorization)**
   1. Add **Schedule Trigger** `Schedule Trigger4`.
   2. Add **Google Sheets** `Get row(s) in sheet2` filtering `work_status=image analyzed`.
   3. Add **Split in Batches** `Loop Over Items4`.
   4. Add **LangChain Chat Model (Gemini)** `Google Gemini Chat Model2` (e.g., `gemini-3-flash-preview`).
   5. Add **Structured Output Parser** with the schema fields for p/s/t categories and confidences.
   6. Add **OpenAI Chat Model** `OpenAI Chat Model1` with `gpt-4o-mini`.
   7. Add **Auto-fixing Output Parser** and connect it to OpenAI model + structured parser.
   8. Add **Memory Buffer Window** `Simple Memory2` (be careful using `$now.minute`; consider a better sessionKey).
   9. Add **AI Agent** `AI Agent2` with the long “jewelry categorization expert” system message and input `Image Data: {{$json.image_date}}`.
   10. Add **Wait** `Wait1` (2 seconds).
   11. Add **Google Sheets Update** `Update row in sheet3`:
       - `category = {{$json.output.p_category}}`
       - `work_status = categorized`
       - match on `file_id`
   12. Wire: `Schedule Trigger4 → Get row(s) in sheet2 → Loop Over Items4 → AI Agent2 → Wait1 → Update row in sheet3 → Loop Over Items4`.  
      Connect `Google Gemini Chat Model2` + `Simple Memory2` + `Auto-fixing Output Parser` into `AI Agent2` via AI connections.

7) **Build Step-4 nodes (content generation by category)**
   1. Add **Schedule Trigger** `Schedule Trigger1`.
   2. Add **Google Sheets** `Get row(s) in sheet` filtering `work_status=categorized`.
   3. Add **Split in Batches** `Loop Over Items2`.
   4. Add **Switch** node `Switch` with rules matching `{{$json.category}}` to categories (ensure spelling aligns with categorizer; fix “Pandents” vs “Pendants”).
   5. For each category branch:
      - Add **Gemini chat model** node (or reuse one) and a **Memory** node.
      - Add **Structured output parser** for that category schema (autoFix enabled).
      - Add **AI Agent** with the category-specific system message (Necklace, Earrings, etc.).
      - Add **Code** node “text to HTML…” to create `html_content`.
      - Add **Google Sheets Update** node to write `tags`, `product_name`, `ai_description`, `ai_ideal_for`, `Product Category`, `work_status=content generated`.
   6. Add **Wait** node `Wait2` and connect all update nodes → `Wait2 → Loop Over Items2` to keep processing.
   7. Wire: `Schedule Trigger1 → Get row(s) in sheet → Loop Over Items2 → Switch → (branches…) → Wait2 → Loop Over Items2`.

8) **Build Step-5 nodes (Shopify image upload + CDN URL)**
   1. Add **Manual Trigger** (or a schedule trigger) for this step.
   2. Add **Google Sheets** `get product data` filter `work_status=content generated`.
   3. Add **Split in Batches** `Loop Over Items`.
   4. Add **HTTP Request** `HTTP Request`:
      - POST to `/admin/api/2025-10/graphql.json`
      - Header `X-Shopify-Access-Token`
      - Body mutation `stagedUploadsCreate` with filename and resource PRODUCT_IMAGE.
   5. Add **Google Drive Download** `Download file` for `file_id`.
   6. Add **HTTP Request** `HTTP Request1` multipart/form-data POST to staged upload URL:
      - Use returned parameters from stagedUploadsCreate
      - Attach binary file field from Drive download.
   7. Add **HTTP Request** `HTTP Request2` GraphQL `fileCreate`, using `<Location>` extracted from upload response.
   8. Add **HTTP Request** `HTTP Request3` GraphQL query node preview URL.
   9. Add **Google Sheets Update** `Update row in sheet2`:
      - set `image_url`, `work_status=finalized`
   10. Wire: `trigger → get product data → Loop Over Items → HTTP Request → Download file → HTTP Request1 → HTTP Request2 → HTTP Request3 → Update row in sheet2 → Loop Over Items`.

9) **Build Step-6 nodes (final Shopify CSV sheet rows)**
   1. Add **Schedule Trigger** `Schedule Trigger2`.
   2. Add **Google Sheets** `get finalized data` filter should be `work_status=finalized` (fix from `ddrr`).
   3. Add **Split in Batches** `Loop Over Items3`.
   4. Add **Code** `structuring columns` to compute handle/title/tags/type/category.
   5. Add **Code** `structuring body content` but change it to use the current item (not `.first()` from the get node).
   6. Add **Google Sheets Append** `Append row in sheet` targeting `final_product_data` with Shopify import columns mapping.
   7. Wire: `Schedule Trigger2 → get finalized data → Loop Over Items3 → structuring columns → structuring body content → Append row in sheet → Loop Over Items3`.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Shopify AI Image → Product CSV Automation” prerequisites, folder naming, required credentials, and workflow explanation | Sticky Note: Step overview (contains operational requirements) |
| Author details: Manish Kumar (email + phone) | `mailto:manipritraj@gmail.com` |
| Input (Original Image) example | https://i.ibb.co/SLmbmSS/113114608-RG-51ee9788-6b5e-41c9-8fdd-019f6a7888cf.jpg |
| Output (Live Shopify Product) example | https://i.ibb.co/Bbf580T/chain-07-Delicate-Heartbeat-Link-Chain-Necklace-My-Store-12-25-2025-01-50-AM.png |
| Final step instructions: download `final_product_data` as CSV then upload to Shopify | Sticky Note “Final Step” |

--- 

If you want, I can also list the **most critical fixes** to make this run end-to-end reliably (e.g., `ddrr` filter, “Pandents” typo, Shopify staged upload parameter indexing, preview polling).