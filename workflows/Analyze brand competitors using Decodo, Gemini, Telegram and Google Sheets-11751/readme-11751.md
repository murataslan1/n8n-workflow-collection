Analyze brand competitors using Decodo, Gemini, Telegram and Google Sheets

https://n8nworkflows.xyz/workflows/analyze-brand-competitors-using-decodo--gemini--telegram-and-google-sheets-11751


# Analyze brand competitors using Decodo, Gemini, Telegram and Google Sheets

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:** This workflow compares a brand and a competitor by searching the web for review pages, extracting the page content, cleaning it, having Gemini generate structured comparison insights (key points + takeaways), then saving results to Google Sheets and sending a short summary to Telegram.

**Typical use cases:** competitor research, market analysis, positioning insights, quick content intelligence without manual web browsing.

### Logical Blocks
1.1 **User Input (Form Trigger)** → collect “Brand” and “Brand Competitor”.  
1.2 **Search (Decodo Google Search)** → run two searches (brand + competitor) and pick top organic URLs.  
1.3 **Content Extraction (Decodo + HTML nodes)** → fetch both pages and extract readable body content.  
1.4 **Merge + Cleaning (Merge + Code)** → combine both texts and remove HTML/line breaks.  
1.5 **AI Comparison (LangChain Agent + Gemini + Structured Parser)** → generate structured keypoints and takeaways.  
1.6 **Persist + Notify (Google Sheets + Telegram)** → append a row and send a short message.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception
**Overview:** Collects the two required inputs from a hosted n8n form and starts the workflow.  
**Nodes involved:** `On form submission`

#### Node: On form submission
- **Type / role:** `n8n-nodes-base.formTrigger` — entry point via n8n Form.
- **Configuration choices:**
  - Form title: **Web Competitor Analysis**
  - Fields:
    - **Brand** (required)
    - **Brand Competitor** (required, placeholder “e.g samsung”)
  - Description: “Please input your brand competitor”
- **Key variables/fields produced:** `{{$json.Brand}}`, `{{$json["Brand Competitor"]}}`
- **Connections:**
  - **Output →** `Competitor Brand Search`
- **Failure/edge cases:**
  - Empty values prevented by required fields, but user can still submit low-quality/ambiguous brand names (e.g., “Apple”).
  - Spelling/locale can reduce search relevance.

---

### 2.2 Brand & Competitor Search
**Overview:** Uses Decodo Google Search twice (competitor first, then brand) and selects the first organic result URL for each query.  
**Nodes involved:** `Competitor Brand Search`, `Brand Google Search`, `Code in JavaScript`

#### Node: Competitor Brand Search
- **Type / role:** `@decodo/n8n-nodes-decodo.decodo` — Google search via Decodo.
- **Configuration choices:**
  - Operation: **google_search**
  - Query: `={{ $json['Brand Competitor'] }} reviews`
- **Connections:**
  - **Input ←** `On form submission`
  - **Output →** `Brand Google Search`
- **Credentials:** Decodo API credentials.
- **Failure/edge cases:**
  - Decodo auth failure / quota exceeded.
  - Google results structure changes (may affect downstream expressions if schema differs).
  - Searches can return irrelevant or non-content pages.

#### Node: Brand Google Search
- **Type / role:** `@decodo/n8n-nodes-decodo.decodo` — second Google search via Decodo.
- **Configuration choices:**
  - Operation: **google_search**
  - Query: `={{ $('On form submission').item.json.Brand }} reviews`
    - Note: explicitly references the trigger node item.
- **Connections:**
  - **Input ←** `Competitor Brand Search`
  - **Output →** `Code in JavaScript`
- **Credentials:** Decodo API credentials.
- **Failure/edge cases:**
  - Same as competitor search.
  - If the workflow is changed to run searches in parallel later, referencing `$('On form submission').item` is safer than relying on pass-through JSON.

#### Node: Code in JavaScript
- **Type / role:** `n8n-nodes-base.code` — extracts top organic URLs from both search responses.
- **Configuration choices (interpreted):**
  - Reads **brand** URL from *current input* (Brand Google Search output):
    - `results[0].content.results.results.organic[0].url`
  - Reads **competitor** URL from the named node `Competitor Brand Search`:
    - `$('Competitor Brand Search').first().json.results[0].content.results.results.organic[0].url`
  - Outputs an object: `{ brand: <url>, competitor: <url> }`
- **Connections:**
  - **Input ←** `Brand Google Search`
  - **Outputs →** `Brand Page Extractor` and `Competitor Page Extractor` (fan-out)
- **Failure/edge cases:**
  - If `organic[0]` is missing (no results / blocked / schema mismatch) this node errors.
  - If Decodo returns multiple items, `.first()` may not match intended item.
  - No URL validation: could pick PDFs, login pages, or blocked pages.

---

### 2.3 Content Extraction
**Overview:** Fetches both selected URLs via Decodo, then extracts `<body>` content using HTML nodes (without cleanup) to produce raw text-ish HTML for later cleaning.  
**Nodes involved:** `Brand Page Extractor`, `Competitor Page Extractor`, `Extract Brand Page HTML Content`, `Extract Competitor HTML Page Content`

#### Node: Brand Page Extractor
- **Type / role:** `@decodo/n8n-nodes-decodo.decodo` — fetch/extract page content from URL.
- **Configuration choices:**
  - URL: `={{ $json.brand }}`
- **Connections:**
  - **Input ←** `Code in JavaScript`
  - **Output →** `Extract Brand Page HTML Content`
- **Credentials:** Decodo API credentials.
- **Failure/edge cases:**
  - Target site blocks scraping or requires JS rendering (Decodo capabilities/plan dependent).
  - Timeouts/large pages.
  - If returned payload doesn’t contain `results[0].content`, downstream HTML node fails.

#### Node: Competitor Page Extractor
- **Type / role:** `@decodo/n8n-nodes-decodo.decodo` — fetch/extract competitor page.
- **Configuration choices:**
  - URL: `={{ $json.competitor }}`
- **Connections:**
  - **Input ←** `Code in JavaScript`
  - **Output →** `Extract Competitor HTML Page Content`
- **Credentials:** Decodo API credentials.
- **Failure/edge cases:** same as brand extractor.

#### Node: Extract Brand Page HTML Content
- **Type / role:** `n8n-nodes-base.html` — extract readable content from HTML.
- **Configuration choices:**
  - Operation: **Extract HTML Content**
  - Source property: `results[0].content`
  - Extract:
    - Key: `dataBrand`
    - Selector: `body`
    - Skip selectors: `img`
  - `cleanUpText: false` (keeps raw-ish formatting; later cleaned in Code node)
- **Connections:**
  - **Input ←** `Brand Page Extractor`
  - **Output →** `Merge` (input index 0)
- **Failure/edge cases:**
  - If `results[0].content` is not a string of HTML, extraction fails.
  - `body` can be huge; may exceed memory or later LLM context.

#### Node: Extract Competitor HTML Page Content
- **Type / role:** `n8n-nodes-base.html` — same extraction for competitor.
- **Configuration choices:** same as brand, but key `dataCompetitor`.
- **Connections:**
  - **Input ←** `Competitor Page Extractor`
  - **Output →** `Merge` (input index 1)
- **Failure/edge cases:** same as brand extraction.
- **Note:** `alwaysOutputData: false` means if extraction yields nothing, it may stop flow depending on n8n behavior/settings.

---

### 2.4 Merge + Cleaning
**Overview:** Combines brand and competitor extracted content into one item, then removes HTML tags and line breaks (basic sanitization) to prepare for LLM input.  
**Nodes involved:** `Merge`, `Construct Data`

#### Node: Merge
- **Type / role:** `n8n-nodes-base.merge` — combine two branches into one item.
- **Configuration choices:**
  - Mode: **combine**
  - Combine by: **position** (brand and competitor items must align by index)
- **Connections:**
  - **Inputs ←** `Extract Brand Page HTML Content` and `Extract Competitor HTML Page Content`
  - **Output →** `Construct Data`
- **Failure/edge cases:**
  - If one branch returns 0 items, combine-by-position can yield no output or mismatched merges.
  - If either branch yields multiple items, you may get unexpected pairings.

#### Node: Construct Data
- **Type / role:** `n8n-nodes-base.code` — cleans extracted HTML and prepares LLM fields.
- **Configuration choices (interpreted):**
  - Removes HTML tags: `/(<([^>]+)>)/gi`
  - Removes line breaks: `/(\r\n|\n|\r)/gm`
  - Produces:
    - `strCompetitor` from `dataBrand`
    - `brand` from `dataCompetitor`
- **Connections:**
  - **Input ←** `Merge`
  - **Output →** `Summarizer & Reviewer Agent`
- **Failure/edge cases / important note:**
  - **Field swap bug:** `strCompetitor` is built from `dataBrand`, and `brand` is built from `dataCompetitor`. This appears reversed relative to names and later prompt (“Article Brand: {{ $json.brand }}”). If unintended, swap the assignments.
  - Basic regex cleaning can remove meaningful structure (headings, bullets). Consider preserving some separators.
  - Very large pages may produce extremely long strings → LLM token limit issues.

---

### 2.5 AI Processing (Gemini + Agent + Structured Output)
**Overview:** A LangChain agent uses the Gemini chat model to generate structured “keypoints” and “takeaways”, enforced by a structured output parser.  
**Nodes involved:** `Google Gemini Chat Model`, `Structured Output Parser`, `Summarizer & Reviewer Agent`

#### Node: Google Gemini Chat Model
- **Type / role:** `@n8n/n8n-nodes-langchain.lmChatGoogleGemini` — LLM backend.
- **Configuration choices:** default options (no explicit temperature/max tokens visible).
- **Connections:**
  - **AI output →** `Summarizer & Reviewer Agent` (as `ai_languageModel`)
- **Credentials:** Google Gemini (PaLM) API credential in n8n.
- **Failure/edge cases:**
  - Invalid API key/project setup, quota, safety blocks.
  - Token/context too large from long scraped pages.

#### Node: Structured Output Parser
- **Type / role:** `@n8n/n8n-nodes-langchain.outputParserStructured` — enforces JSON schema-like output.
- **Configuration choices:**
  - Expected output example schema:
    - `keypoints`: string (numbered list)
    - `takeaways`: string (numbered list)
- **Connections:**
  - **AI output parser →** `Summarizer & Reviewer Agent` (as `ai_outputParser`)
- **Failure/edge cases:**
  - If model output doesn’t conform, parsing fails (unless agent retries, depending on node behavior/version).

#### Node: Summarizer & Reviewer Agent
- **Type / role:** `@n8n/n8n-nodes-langchain.agent` — orchestrates prompt + model + parser.
- **Configuration choices:**
  - Prompt type: **define**
  - Input text:
    - `Article Brand: {{ $json.brand }}`
    - `Article Competitor: {{ $json.strCompetitor }}`
  - System message:
    - Role: expert summarizer and reviewer
    - Extract keypoints per section
    - Generate **4–6** comparison takeaways
    - “all the string should return fit for google sheets”
  - Output parser enabled (`hasOutputParser: true`)
- **Connections:**
  - **Input ←** `Construct Data`
  - **Output →** `Append row in sheet`
  - **Dependencies:** receives model from `Google Gemini Chat Model` and parser from `Structured Output Parser` via AI connections.
- **Failure/edge cases:**
  - If `brand/strCompetitor` are swapped (earlier bug), analysis will be mislabeled.
  - Large content can exceed LLM context; consider truncation or summarizing each page separately first.

---

### 2.6 Save & Notify
**Overview:** Appends the structured results to Google Sheets, then sends a short excerpt to Telegram.  
**Nodes involved:** `Append row in sheet`, `Notify Group`

#### Node: Append row in sheet
- **Type / role:** `n8n-nodes-base.googleSheets` — persistence layer.
- **Configuration choices:**
  - Operation: **append**
  - Document ID: set via URL selector (currently empty in the JSON)
  - Sheet name: selected from list (currently empty in the JSON)
  - (No explicit column mapping shown; likely relies on incoming JSON keys matching columns or configured in UI.)
- **Connections:**
  - **Input ←** `Summarizer & Reviewer Agent`
  - **Output →** `Notify Group`
- **Credentials:** Google Sheets OAuth2.
- **Failure/edge cases:**
  - Missing documentId/sheetName will prevent execution until configured.
  - Column mismatch: if sheet headers don’t match incoming fields, data may go into wrong columns or fail.
  - Google API quota / permission errors.

#### Node: Notify Group
- **Type / role:** `n8n-nodes-base.telegram` — sends a message to a Telegram chat/group.
- **Configuration choices:**
  - Text template:
    - `{{ $json.title }}`
    - `Keypoints: {{ $json.keypoints.slice(0,300) }}`
    - `Takeaways: {{ $json['key takeways'].slice(0,300) }}`
- **Connections:**
  - **Input ←** `Append row in sheet`
  - **Output:** none
- **Credentials:** Telegram Bot API credentials.
- **Failure/edge cases / important notes:**
  - **Likely field name bug:** parser defines `takeaways`, but Telegram references `$json['key takeways']` (misspelled and different key). This will evaluate to `undefined` and may error when calling `.slice`.
  - `$json.title` is not produced anywhere in this workflow as shown; may be undefined.
  - Telegram message length limits; slicing helps, but ensure fields exist before slicing.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| On form submission | n8n-nodes-base.formTrigger | Collect brand + competitor from user | — | Competitor Brand Search | ## Analyze brand competitors using Decodo, Gemini, Telegram, and Google Sheets; This workflow helps you compare a brand and its competitor by automatically finding, extracting, and analyzing relevant web content. It is designed for competitor research, market analysis, and content intelligence without manual browsing or copy-pasting.; How it works…; Setup steps… |
| Competitor Brand Search | @decodo/n8n-nodes-decodo.decodo | Google search for competitor review pages | On form submission | Brand Google Search | ### Brand & Competitor Search; - Uses Decodo Google Search… - Runs separate searches… - Selects the most relevant organic result… - Outputs clean URLs… |
| Brand Google Search | @decodo/n8n-nodes-decodo.decodo | Google search for brand review pages | Competitor Brand Search | Code in JavaScript | ### Brand & Competitor Search; - Uses Decodo Google Search… - Runs separate searches… - Selects the most relevant organic result… - Outputs clean URLs… |
| Code in JavaScript | n8n-nodes-base.code | Extract top organic URLs for both searches | Brand Google Search | Brand Page Extractor; Competitor Page Extractor | ### Brand & Competitor Search; - Uses Decodo Google Search… - Runs separate searches… - Selects the most relevant organic result… - Outputs clean URLs… |
| Brand Page Extractor | @decodo/n8n-nodes-decodo.decodo | Fetch brand page HTML/content | Code in JavaScript | Extract Brand Page HTML Content | ### Content Extraction; - Decodo fetches the page… - HTML node extracts readable text… - Merge… - JavaScript cleans… |
| Competitor Page Extractor | @decodo/n8n-nodes-decodo.decodo | Fetch competitor page HTML/content | Code in JavaScript | Extract Competitor HTML Page Content | ### Content Extraction; - Decodo fetches the page… - HTML node extracts readable text… - Merge… - JavaScript cleans… |
| Extract Brand Page HTML Content | n8n-nodes-base.html | Extract `<body>` into `dataBrand` | Brand Page Extractor | Merge | ### Content Extraction; - Decodo fetches the page… - HTML node extracts readable text… - Merge… - JavaScript cleans… |
| Extract Competitor HTML Page Content | n8n-nodes-base.html | Extract `<body>` into `dataCompetitor` | Competitor Page Extractor | Merge | ### Content Extraction; - Decodo fetches the page… - HTML node extracts readable text… - Merge… - JavaScript cleans… |
| Merge | n8n-nodes-base.merge | Combine brand + competitor extracted texts | Extract Brand Page HTML Content; Extract Competitor HTML Page Content | Construct Data | ### Content Extraction; - Decodo fetches the page… - HTML node extracts readable text… - Merge… - JavaScript cleans… |
| Construct Data | n8n-nodes-base.code | Clean HTML/tags and prep LLM inputs | Merge | Summarizer & Reviewer Agent | ### Content Extraction; - Decodo fetches the page… - HTML node extracts readable text… - Merge… - JavaScript cleans… |
| Google Gemini Chat Model | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | LLM engine for analysis | — (AI connection) | Summarizer & Reviewer Agent (AI language model) | ### AI Analysis; - Gemini generates key points… - Structured Output Parser ensures… |
| Structured Output Parser | @n8n/n8n-nodes-langchain.outputParserStructured | Enforce structured output (`keypoints`, `takeaways`) | — (AI connection) | Summarizer & Reviewer Agent (AI output parser) | ### AI Analysis; - Gemini generates key points… - Structured Output Parser ensures… |
| Summarizer & Reviewer Agent | @n8n/n8n-nodes-langchain.agent | Compare both articles and generate structured insights | Construct Data | Append row in sheet | ### AI Analysis; - Gemini generates key points… - Structured Output Parser ensures… |
| Append row in sheet | n8n-nodes-base.googleSheets | Store results in Google Sheets | Summarizer & Reviewer Agent | Notify Group | ### Save & Notify; - Results are saved… - A short summary is sent… |
| Notify Group | n8n-nodes-base.telegram | Send summary to Telegram | Append row in sheet | — | ### Save & Notify; - Results are saved… - A short summary is sent… |
| Sticky Note2 | n8n-nodes-base.stickyNote | Documentation / canvas note | — | — | ## Analyze brand competitors using Decodo, Gemini, Telegram, and Google Sheets; … |
| Sticky Note3 | n8n-nodes-base.stickyNote | Documentation / canvas note | — | — | ### Brand & Competitor Search… |
| Sticky Note4 | n8n-nodes-base.stickyNote | Documentation / canvas note | — | — | ### Content Extraction… |
| Sticky Note1 | n8n-nodes-base.stickyNote | Documentation / canvas note | — | — | ### AI Analysis… |
| Sticky Note | n8n-nodes-base.stickyNote | Documentation / canvas note | — | — | ### Save & Notify… |

---

## 4. Reproducing the Workflow from Scratch

1) **Create Trigger**
1. Add **Form Trigger** node named **On form submission**.
2. Set:
   - Form Title: `Web Competitor Analysis`
   - Description: `Please input your brand competitor`
   - Fields:
     - `Brand` (required)
     - `Brand Competitor` (required; placeholder `e.g samsung`)

2) **Add Decodo searches**
3. Add **Decodo** node named **Competitor Brand Search**:
   - Operation: `google_search`
   - Query: `{{$json["Brand Competitor"]}} reviews`
   - Select/attach **Decodo API credentials**.
4. Add **Decodo** node named **Brand Google Search**:
   - Operation: `google_search`
   - Query: `{{$('On form submission').item.json.Brand}} reviews`
   - Credentials: same Decodo credential.
5. Connect: **On form submission → Competitor Brand Search → Brand Google Search**.

3) **Extract top organic URLs**
6. Add **Code** node named **Code in JavaScript** (JavaScript mode) with logic equivalent to:
   - Read brand URL from the Brand search result item
   - Read competitor URL from `Competitor Brand Search` node output
   - Output `{ brand: <url>, competitor: <url> }`
7. Connect: **Brand Google Search → Code in JavaScript**.

4) **Fetch pages (Decodo)**
8. Add **Decodo** node **Brand Page Extractor**:
   - URL: `{{$json.brand}}`
9. Add **Decodo** node **Competitor Page Extractor**:
   - URL: `{{$json.competitor}}`
10. Connect: **Code in JavaScript → Brand Page Extractor** and **Code in JavaScript → Competitor Page Extractor**.

5) **Extract `<body>` HTML content**
11. Add **HTML** node **Extract Brand Page HTML Content**:
   - Operation: Extract HTML Content
   - Source property: `results[0].content`
   - Extraction: key `dataBrand`, selector `body`, skip `img`
   - Disable “Clean up text” (set to false).
12. Add **HTML** node **Extract Competitor HTML Page Content** similarly:
   - key `dataCompetitor`, selector `body`, skip `img`
13. Connect:
   - **Brand Page Extractor → Extract Brand Page HTML Content**
   - **Competitor Page Extractor → Extract Competitor HTML Page Content**

6) **Merge + clean**
14. Add **Merge** node named **Merge**:
   - Mode: `combine`
   - Combine by: `position`
15. Connect:
   - **Extract Brand Page HTML Content → Merge (Input 1)**
   - **Extract Competitor HTML Page Content → Merge (Input 2)**
16. Add **Code** node named **Construct Data** to:
   - Strip HTML tags and line breaks from `dataBrand` and `dataCompetitor`
   - Output two strings for the LLM prompt
   - (Recommended) ensure naming matches content (brand text → `brandText`, competitor text → `competitorText`) to avoid swaps.
17. Connect: **Merge → Construct Data**.

7) **Gemini + structured agent**
18. Add **Google Gemini Chat Model** node:
   - Configure **Gemini/PaLM credentials**.
19. Add **Structured Output Parser** node:
   - Define schema with two string fields: `keypoints`, `takeaways`.
20. Add **AI Agent** node named **Summarizer & Reviewer Agent**:
   - Prompt type: `define`
   - Text input referencing your cleaned fields (brand + competitor)
   - System instructions: summarizer/reviewer; extract key points; generate 4–6 takeaways; output strings suitable for Sheets
   - Enable output parser
21. Connect:
   - **Construct Data → Summarizer & Reviewer Agent**
   - AI connections:
     - **Google Gemini Chat Model → Summarizer & Reviewer Agent** (language model)
     - **Structured Output Parser → Summarizer & Reviewer Agent** (output parser)

8) **Save to Google Sheets**
22. Add **Google Sheets** node **Append row in sheet**:
   - Operation: `Append`
   - Configure **Google Sheets OAuth2 credentials**
   - Set **Document** (Spreadsheet) and **Sheet name**
   - Map columns to fields from agent output (at least `keypoints`, `takeaways`; optionally brand/competitor URLs/inputs).
23. Connect: **Summarizer & Reviewer Agent → Append row in sheet**.

9) **Notify via Telegram**
24. Add **Telegram** node **Notify Group**:
   - Configure **Telegram Bot** credentials
   - Choose Chat ID / target group
   - Message template using existing output keys (recommended):
     - use `{{$json.keypoints}}` and `{{$json.takeaways}}`
     - apply slicing only if fields exist
25. Connect: **Append row in sheet → Notify Group**.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Analyze brand competitors using Decodo, Gemini, Telegram, and Google Sheets” (workflow description + setup steps embedded in canvas) | Documented in the large sticky note on the left side of the canvas |
| AI output is intended to be “sheet-ready” and constrained by a structured parser | AI Analysis sticky note and agent system instructions |
| Potential data-label mismatch and Telegram field mismatch should be reviewed before production use | Construct Data node swaps fields; Telegram references `key takeways` instead of `takeaways` and uses `$json.title` which is not produced |