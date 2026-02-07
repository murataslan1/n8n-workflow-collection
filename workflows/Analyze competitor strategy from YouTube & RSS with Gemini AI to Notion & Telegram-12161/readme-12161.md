Analyze competitor strategy from YouTube & RSS with Gemini AI to Notion & Telegram

https://n8nworkflows.xyz/workflows/analyze-competitor-strategy-from-youtube---rss-with-gemini-ai-to-notion---telegram-12161


# Analyze competitor strategy from YouTube & RSS with Gemini AI to Notion & Telegram

## 1. Workflow Overview

**Purpose:**  
This workflow monitors competitor activity from **YouTube channels** and **RSS feeds**, retrieves **full YouTube transcripts via Apify**, performs **daily competitor strategy analysis using Google Gemini**, then publishes:
- an **executive HTML briefing to Telegram**, and
- a **formatted archive report to Notion** (using Notion blocks and a toggle section).

**Target use cases:**
- Daily competitor intelligence briefs (marketing/product/strategy teams)
- Monitoring positioning shifts, messaging themes, and content angles
- Maintaining a searchable Notion knowledge base of competitor communications

### 1.1 Trigger & Source Collection
Runs every morning and pulls recent competitor videos + RSS posts.

### 1.2 YouTube Transcript Ingestion (Apify) + Normalization
Aggregates YouTube results, calls an Apify actor to fetch transcripts, then standardizes transcript items to a common schema.

### 1.3 RSS Aggregation
Reads multiple RSS feeds and merges them into the same downstream pipeline as YouTube items.

### 1.4 Data Preparation (Dedup + Token Budgeting)
Deduplicates items using n8n workflow static data (TTL-based), ranks RSS items by “hot score”, limits total items to control Gemini token usage, and builds a compact analysis context.

### 1.5 AI Analysis (Gemini) + Robust JSON Parsing
Gemini generates a strict JSON report; a parser node extracts/validates JSON and sanitizes Telegram HTML.

### 1.6 Reporting Outputs (Telegram + Notion)
Sends Telegram message, creates a Notion database page, and appends formatted Notion blocks (headings, toggle, sources).

---

## 2. Block-by-Block Analysis

### Block 1 — Trigger & Data Sources (User Config)
**Overview:** Runs on a schedule, pulls competitor content from YouTube (two channels) and RSS (two feeds).  
**Nodes involved:**  
- Schedule Trigger  
- YouTube (Competitor A): Search Video  
- YouTube (Competitor B): Search Video  
- RSS Feed (Competitor A): TechCrunch  
- RSS Feed (Competitor B): n8n Blog  

#### Node: Schedule Trigger
- **Type / role:** `scheduleTrigger` — starts workflow on a time schedule.
- **Config:** Runs daily at **08:00** (via `triggerAtHour: 8`).
- **Outputs:** Fan-out to 4 source nodes (2x YouTube, 2x RSS).
- **Failure modes:** n8n scheduling disabled; timezone misunderstandings (instance timezone).

#### Node: YouTube (Competitor A): Search Video
- **Type / role:** `youTube` (resource: video) — searches recent channel videos.
- **Config choices:**
  - `channelId`: placeholder (“input your competitor channel ID here”)
  - `publishedAfter`: expression for last 24h: `new Date(Date.now() - 24*60*60*1000).toISOString()`
  - `limit: 3`, `order: date`
- **Credentials:** YouTube OAuth2.
- **Input/Output:** Trigger → Merge (YouTube).
- **Failure modes:** OAuth scope/consent issues, quota limits, invalid channelId, API transient errors.

#### Node: YouTube (Competitor B): Search Video
- Same as competitor A, separate channelId, merged with A in the YouTube merge node.

#### Node: RSS Feed (Competitor A): TechCrunch
- **Type / role:** `rssFeedRead` — reads RSS entries.
- **Config:** `url` placeholder; `ignoreSSL: true`.
- **Output:** Merge (RSS) input 0.
- **Failure modes:** invalid feed URL, feed format deviations, SSL/network issues (even with ignoreSSL), rate limiting.

#### Node: RSS Feed (Competitor B): n8n Blog
- Same as above; output to Merge (RSS) input 1.

---

### Block 2 — Ingestion & Transcripts (YouTube + Apify)
**Overview:** Merges YouTube search outputs, calls Apify to fetch transcripts for each video, then normalizes transcript items into a consistent format for downstream analysis.  
**Nodes involved:**  
- Merge (YouTube) (Mode Append)  
- Apify - Run an Actor  
- Apify - Get Dataset Items  
- Code - Normalize Apify Items  

#### Node: Merge (YouTube) (Mode Append)
- **Type / role:** `merge` — appends items from Competitor A and B YouTube searches.
- **Config:** Default append behavior (no explicit params shown).
- **Inputs:** YouTube A (index 0), YouTube B (index 1).
- **Output:** Apify - Run an Actor.
- **Failure modes:** If additional competitors are added, merge inputs must be adjusted; empty input(s) produce fewer items.

#### Node: Apify - Run an Actor
- **Type / role:** `@apify/n8n-nodes-apify.apify` (resource: run actor) — runs transcript scraping actor per YouTube item.
- **Config choices:**
  - Actor: **Best Youtube Transcripts Scraper** (`scrape-creators/best-youtube-transcripts-scraper`, actor id `L57jETyu9qT6J7bs5`)
  - **customBody** builds `videoUrls` from the current YouTube item:  
    `https://www.youtube.com/watch?v={{ $json.id.videoId }}`
- **Credentials:** Apify OAuth2.
- **Output:** Apify - Get Dataset Items (uses actor run result).
- **Failure modes / edge cases:**
  - Missing `$json.id.videoId` (e.g., if YouTube node returns unexpected structure) → actor input invalid.
  - Actor run failures (rate limits, blocked videos, transcript unavailable).
  - Costs/quotas on Apify account.

#### Node: Apify - Get Dataset Items
- **Type / role:** Apify dataset fetch — retrieves results from actor’s dataset.
- **Config:** `datasetId` from previous node output: `{{ $json.defaultDatasetId }}`
- **Output:** Code - Normalize Apify Items.
- **Failure modes:** dataset not ready yet (timing), invalid datasetId, auth issues.

#### Node: Code - Normalize Apify Items
- **Type / role:** `code` — normalizes Apify transcript records and joins metadata from the merged YouTube results by **videoId**.
- **Key logic:**
  - Pulls original YouTube items via `$items("Merge (YouTube) (Mode Append)")`
  - Extracts videoId from multiple possible fields and from URLs
  - Matches Apify items to YouTube items by videoId (not by array index)
  - Builds normalized output schema:
    - `type: "YT_TRANSCRIPT"`
    - `videoId`, `title`, `url`, `publishedAt`
    - `content`: transcript text if available, else YouTube description (trimmed to 12k chars)
    - `hasTranscript` boolean
- **Output:** Merge (All Data) input 0.
- **Failure modes / edge cases:**
  - Node name dependency: hard-coded `"Merge (YouTube) (Mode Append)"` must match exactly.
  - Apify output variations: transcript field missing (`transcript_only_text`) → fallback to description.
  - Very long transcript trimmed; may reduce analysis fidelity.

---

### Block 3 — RSS Aggregation
**Overview:** Combines RSS items from multiple sources into a single stream.  
**Nodes involved:**  
- Merge (RSS): Mode Append  

#### Node: Merge (RSS): Mode Append
- **Type / role:** `merge` append — combines RSS feed entries.
- **Inputs:** RSS A (index 0), RSS B (index 1)
- **Output:** Merge (All Data) input 1.
- **Failure modes:** same as other merge—if adding feeds, inputs must be increased/rewired.

---

### Block 4 — Merge All + Data Prep (Dedup, Ranking, Token Control)
**Overview:** Combines normalized YouTube transcript items and RSS items, removes duplicates using workflow static data (7-day TTL), ranks RSS by “hot score”, caps total items to keep Gemini cost low, and generates a compact `competitorContext` string for prompting.  
**Nodes involved:**  
- Merge (All Data): Mode Append  
- Code (Data Prep)  

#### Node: Merge (All Data): Mode Append
- **Type / role:** `merge` append — combines:
  - YouTube transcript normalized items (input 0)
  - RSS merged items (input 1)
- **Output:** Code (Data Prep)
- **Failure modes:** missing one branch results in partial analysis; item shape differences handled downstream.

#### Node: Code (Data Prep)
- **Type / role:** `code` — central normalization + dedup + scoring + context building.
- **Key configuration choices (in code):**
  - Uses workflow static data (`getWorkflowStaticData("global")` or `$getWorkflowStaticData("global")`)
  - TTL for “seen items”: **7 days**
  - Token/cost controls:
    - `MAX_ITEMS_TOTAL = 8`
    - `MAX_YT_ITEMS = 2`
    - RSS selection pool: top 10 by hot score, then fill up to 8 total
    - Content clipping:
      - RSS content max 1400 chars
      - YT content max 1800 chars
- **Normalization rules:**
  - Detects RSS vs YouTube via presence of RSS-ish fields (`link`, `pubDate`, etc.)
  - For RSS: strips HTML, extracts date/link/title/content
  - Assigns `competitorTag` via URL heuristics:
    - techcrunch.com → `techcrunch`
    - n8n.io → `n8n`
    - else `unknown`
- **RSS hot score heuristic:** recency (48h window), keyword weights (AI, security, funding, big tech…), source boost, stale-year penalty.
- **Outputs:**
  - If no fresh items: returns a single item with `ITEMS=0` context and empty sources.
  - Else: returns one item with:
    - `competitorContext` (compact multi-line prompt text)
    - `sources` (final selected items array)
    - `stats`, `competitorTag` (“mixed” or single tag), `date`
- **Failure modes / edge cases:**
  - **Static data API availability:** throws hard error if not available in this runtime.
  - Date parsing issues (`Date.parse`) → treated as 0, can skew sorting/scoring.
  - Over-dedup: item IDs depend on `rss:${url||title}` and `yt:${videoId||url}`; if URLs change or are missing, duplicates may slip through.
  - Keyword scoring is domain-specific; may bias selection incorrectly.

---

### Block 5 — AI Strategy Core (Gemini) + Robust Parsing
**Overview:** Sends the prepared context to Gemini with strict JSON output requirements, then extracts and sanitizes the model output into reliable fields for Telegram and Notion.  
**Nodes involved:**  
- Google Gemini - Generate  
- Code - Robust Parser (Gemini JSON)  

#### Node: Google Gemini - Generate
- **Type / role:** `@n8n/n8n-nodes-langchain.googleGemini` — LLM generation.
- **Model:** `models/gemini-2.5-flash`
- **Config choices:**
  - `temperature: 0.3`
  - System message: “You are a Competitor Intelligence Analyst.”
  - Prompt injects: `{{ $json.competitorContext }}`
  - Requires **STRICT JSON only** with schema:
    - `report_title`, `summary`, `strategy_markdown`, `telegram_html`
  - Constraints for Telegram HTML:
    - < 4000 chars
    - no `<br>`, `<ul>`, `<li>`
    - allowed tags only: `<b> <i> <u> <s> <code> <pre>`
    - include source links at bottom
- **Output:** Code - Robust Parser
- **Failure modes:**
  - Model returns non-JSON / partial JSON / markdown fences → parser must recover.
  - Token limits if context grows unexpectedly (mitigated by Data Prep limits).
  - Credential/config issues with Google Palm/Gemini.

#### Node: Code - Robust Parser (Gemini JSON)
- **Type / role:** `code` — extracts JSON object from Gemini output, parses it, sanitizes Telegram HTML, truncates safely, attaches meta.
- **Key logic:**
  - Extracts text from multiple possible response shapes (including `candidates[0].content.parts[].text`)
  - `extractJsonObject`: takes substring from first `{` to last `}`
  - `JSON.parse` with explicit error reporting including raw JSON substring
  - Sanitizes Telegram HTML:
    - converts `<br>` to newline
    - converts `<li>` to `• `
    - strips all tags except Telegram-safe subset
    - if unbalanced `<b>/<i>/<u>` tags exist, strips all tags to prevent Telegram parse failure
  - Truncates to <= 4000 chars with newline-aware cut
  - Adds `meta`: `generatedAt`, `competitorTag`, `date` from Data Prep node
- **Outputs:** two branches:
  - Notion - Create Database Page
  - Telegram: Send Message
- **Failure modes / edge cases:**
  - If Gemini returns no braces at all → “No JSON object found…”
  - If Gemini includes extra `{}` earlier/later → naive first/last brace extraction can capture invalid JSON.
  - Sanitization strips links inside `<a>` tags by converting to `text: url` (or url).

---

### Block 6 — Professional Reporting (Telegram + Notion)
**Overview:** Sends the Telegram briefing, and archives a structured report into Notion: create a DB page then append formatted blocks (headings, toggle details, sources).  
**Nodes involved:**  
- Telegram: Send Message  
- Notion - Create Database Page  
- Code (Build Notion Blocks)  
- HTTP Request (Notion Append Children)  

#### Node: Telegram: Send Message
- **Type / role:** `telegram` — sends message to a chat/channel.
- **Config:**
  - `chatId`: placeholder (“input your chat ID here”)
  - `text`: `{{ $json.telegram_html }}`
  - `parse_mode: HTML`
- **Input:** from robust parser output.
- **Failure modes:**
  - Invalid bot token, bot not in chat, insufficient rights (channels).
  - Telegram HTML parse errors (usually from unbalanced tags; mitigated by parser).
  - Message too long (>4096); workflow truncates to 4000.

#### Node: Notion - Create Database Page
- **Type / role:** `notion` (resource: databasePage) — creates a page in a Notion database.
- **Config:**
  - `databaseId`: placeholder `INPUT_DATABASE_ID_FROM_URL`
  - Properties:
    - `Name` (title) = `{{ $json.report_title }}`
    - `date` (date) = `{{ $json.meta.date }}` (no time)
  - `iconType: emoji` (icon itself not set here; just type enabled)
- **Input:** from robust parser output.
- **Output:** Code (Build Notion Blocks)
- **Failure modes:**
  - Database ID wrong; missing integration access to database.
  - Property keys must match exactly (`Name`, `date`) including type mapping.

#### Node: Code (Build Notion Blocks)
- **Type / role:** `code` — converts the parsed report into Notion block JSON (`children`) suitable for append.
- **Key dependencies:**
  - Reads parsed data from **`Code - Robust Parser (Gemini JSON)`** by node name.
- **Key transformations:**
  - Converts basic HTML tags to markdown-ish (`<b>`→`**`, `<i>`→`*`) then strips remaining HTML.
  - Parses inline markdown tokens into Notion rich_text:
    - `**bold**`, `*italic*`, `` `code` ``, and URLs → clickable links
  - Converts `strategy_markdown` into blocks:
    - `## ` → heading_2
    - `* ` / `- ` → bulleted_list_item
    - other lines → paragraph
  - Creates page content:
    - Heading “🧠 Summary” + summary paragraph
    - Heading “🧩 Strategy”
    - Toggle “👇 Open strategy details” containing strategy blocks
    - Heading “🔗 Sources” from URLs extracted out of telegram_html
- **Output:** HTTP Request (Notion Append Children)
- **Failure modes / edge cases:**
  - If strategy_markdown is empty or malformed, toggle may contain no children.
  - Notion limits: max children per request and block sizing; code caps sources to 30.
  - Node name coupling: if parser node renamed, this breaks.

#### Node: HTTP Request (Notion Append Children)
- **Type / role:** `httpRequest` — uses Notion API directly to append blocks.
- **Config:**
  - Method: `PATCH`
  - URL: `https://api.notion.com/v1/blocks/{pageId}/children` where `pageId` is from Notion create node: `{{$node["Notion - Create Database Page"].json.id}}`
  - JSON body: `{"children": <from Code (Build Notion Blocks)>}`
  - Headers:
    - `Notion-Version: 2022-06-28`
    - `Content-Type: application/json`
  - Auth: predefined credential type `notionApi`
- **Failure modes:**
  - Notion API errors (validation of block structure, rate limits).
  - If page creation failed, page ID missing → invalid URL.
  - Large payloads can fail; keep strategy concise.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Schedule Trigger | n8n-nodes-base.scheduleTrigger | Daily execution trigger | — | YouTube (Competitor A): Search Video; YouTube (Competitor B): Search Video; RSS Feed (Competitor A): TechCrunch; RSS Feed (Competitor B): n8n Blog | ## AI-Powered Intelligence Watchdog: YouTube & RSS to Telegram & Notion… (full note applies to workflow overview/setup) |
| YouTube (Competitor A): Search Video | n8n-nodes-base.youTube | Fetch recent videos for competitor A | Schedule Trigger | Merge (YouTube) (Mode Append) | ## 1. Data Sources (User Config) … |
| YouTube (Competitor B): Search Video | n8n-nodes-base.youTube | Fetch recent videos for competitor B | Schedule Trigger | Merge (YouTube) (Mode Append) | ## 1. Data Sources (User Config) … |
| RSS Feed (Competitor A): TechCrunch | n8n-nodes-base.rssFeedRead | Read competitor RSS feed A | Schedule Trigger | Merge (RSS): Mode Append | ## 1. Data Sources (User Config) … |
| RSS Feed (Competitor B): n8n Blog | n8n-nodes-base.rssFeedRead | Read competitor RSS feed B | Schedule Trigger | Merge (RSS): Mode Append | ## 1. Data Sources (User Config) … |
| Merge (YouTube) (Mode Append) | n8n-nodes-base.merge | Aggregate YouTube items | YouTube (Competitor A): Search Video; YouTube (Competitor B): Search Video | Apify - Run an Actor | ## 2. Ingestion & Transcripts … |
| Apify - Run an Actor | @apify/n8n-nodes-apify.apify | Run transcript scraper per video | Merge (YouTube) (Mode Append) | Apify - Get Dataset Items | ## 2. Ingestion & Transcripts … |
| Apify - Get Dataset Items | @apify/n8n-nodes-apify.apify | Fetch transcript dataset items | Apify - Run an Actor | Code - Normalize Apify Items | ## 2. Ingestion & Transcripts … |
| Code - Normalize Apify Items | n8n-nodes-base.code | Normalize transcripts and match with YouTube metadata | Apify - Get Dataset Items | Merge (All Data): Mode Append | ## 2. Ingestion & Transcripts … |
| Merge (RSS): Mode Append | n8n-nodes-base.merge | Aggregate RSS items | RSS Feed (Competitor A): TechCrunch; RSS Feed (Competitor B): n8n Blog | Merge (All Data): Mode Append | ## 2. Ingestion & Transcripts … |
| Merge (All Data): Mode Append | n8n-nodes-base.merge | Combine YouTube transcripts + RSS into one stream | Code - Normalize Apify Items; Merge (RSS): Mode Append | Code (Data Prep) | ## 3. AI Strategy Core … |
| Code (Data Prep) | n8n-nodes-base.code | Dedup, rank RSS, cap items, build LLM context | Merge (All Data): Mode Append | Google Gemini - Generate | ## 3. AI Strategy Core … |
| Google Gemini - Generate | @n8n/n8n-nodes-langchain.googleGemini | Generate strategy report JSON | Code (Data Prep) | Code - Robust Parser (Gemini JSON) | ## 3. AI Strategy Core … |
| Code - Robust Parser (Gemini JSON) | n8n-nodes-base.code | Extract/parse JSON, sanitize Telegram HTML, add meta | Google Gemini - Generate | Notion - Create Database Page; Telegram: Send Message | ## 4. Professional Reporting … |
| Telegram: Send Message | n8n-nodes-base.telegram | Send executive briefing to Telegram | Code - Robust Parser (Gemini JSON) | — | ## 4. Professional Reporting … |
| Notion - Create Database Page | n8n-nodes-base.notion | Create daily report page in Notion DB | Code - Robust Parser (Gemini JSON) | Code (Build Notion Blocks) | ## 4. Professional Reporting … |
| Code (Build Notion Blocks) | n8n-nodes-base.code | Convert report into Notion block children | Notion - Create Database Page | HTTP Request (Notion Append Children) | ## 4. Professional Reporting … |
| HTTP Request (Notion Append Children) | n8n-nodes-base.httpRequest | Append formatted blocks to Notion page | Code (Build Notion Blocks) | — | ## 4. Professional Reporting … |
| Sticky Note | n8n-nodes-base.stickyNote | Documentation (canvas note) | — | — | ## AI-Powered Intelligence Watchdog: YouTube & RSS to Telegram & Notion… |
| Sticky Note1 | n8n-nodes-base.stickyNote | Documentation (data source setup) | — | — | ## 1. Data Sources (User Config)… |
| Sticky Note2 | n8n-nodes-base.stickyNote | Documentation (ingestion/transcripts) | — | — | ## 2. Ingestion & Transcripts… |
| Sticky Note3 | n8n-nodes-base.stickyNote | Documentation (AI strategy core) | — | — | ## 3. AI Strategy Core… |
| Sticky Note4 | n8n-nodes-base.stickyNote | Documentation (reporting outputs) | — | — | ## 4. Professional Reporting… |

---

## 4. Reproducing the Workflow from Scratch

1) **Create a new workflow** named:  
   “Analyze competitor strategy from YouTube and RSS to Notion & Telegram”

2) **Add Trigger**
   1. Add node: **Schedule Trigger**
   2. Set it to run **daily at 08:00** (interval rule with trigger hour = 8).

3) **Add YouTube source nodes (2 competitors)**
   1. Add node: **YouTube** → Resource: **Video** → Operation: search/list (as per node default for “video”).
   2. Configure:
      - `Limit = 3`
      - Filters:
        - `Channel ID = <competitor A channel id>`
        - `Published After = {{ new Date(Date.now() - 24*60*60*1000).toISOString() }}`
      - Options: `Order = date`
   3. Duplicate this node for competitor B, set its Channel ID.

   **Credentials:** Create/attach **YouTube OAuth2** credential (YouTube Data API enabled in Google Cloud).

4) **Merge YouTube results**
   1. Add node: **Merge**
   2. Set mode to **Append** (or keep defaults if it behaves as append).
   3. Connect:
      - YouTube A → Merge input 1
      - YouTube B → Merge input 2  
   4. If you add more competitors later, ensure the Merge node is configured/wired to accept them.

5) **Add Apify transcript scraping**
   1. Add node: **Apify** → “Run an Actor”
   2. Select actor: **Best Youtube Transcripts Scraper (scrape-creators/best-youtube-transcripts-scraper)**
   3. Set custom input body to:
      - `videoUrls` = `["https://www.youtube.com/watch?v={{$json.id.videoId}}"]`
   4. Connect Merge (YouTube) → Apify Run Actor

   **Credentials:** Create/attach **Apify OAuth2** credential.

6) **Fetch Apify dataset items**
   1. Add node: **Apify** → “Get Dataset Items”
   2. Dataset ID expression: `{{ $json.defaultDatasetId }}`
   3. Connect Apify Run Actor → Apify Get Dataset Items

7) **Normalize Apify transcript items**
   1. Add node: **Code** named `Code - Normalize Apify Items`
   2. Paste logic equivalent to:
      - read `$items("Merge (YouTube) (Mode Append)")`
      - build lookup by videoId
      - for each Apify dataset item create:
        - `type = YT_TRANSCRIPT`
        - `videoId`, `title`, `url`, `publishedAt`
        - `content = transcript_only_text OR yt.description` (clip to ~12000)
   3. Connect Apify Get Dataset Items → Code - Normalize Apify Items

8) **Add RSS sources (2 competitors)**
   1. Add node: **RSS Feed Read** (Competitor A) with:
      - URL = competitor RSS feed URL
      - Options: `Ignore SSL Issues = true` (if needed)
   2. Duplicate for Competitor B and set its URL.
   3. Connect Schedule Trigger → both RSS nodes.

9) **Merge RSS**
   1. Add node: **Merge** named `Merge (RSS): Mode Append`
   2. Mode: **Append**
   3. Connect:
      - RSS A → Merge input 1
      - RSS B → Merge input 2

10) **Merge All Data**
   1. Add node: **Merge** named `Merge (All Data): Mode Append`
   2. Mode: **Append**
   3. Connect:
      - Code - Normalize Apify Items → Merge (All Data) input 1
      - Merge (RSS) → Merge (All Data) input 2

11) **Prepare data + dedup + token limits**
   1. Add node: **Code** named `Code (Data Prep)`
   2. Implement:
      - HTML stripping for RSS
      - Unified schema `{id, competitorTag, sourceType, title, url, publishedAt, content}`
      - Workflow static data dedup with 7-day TTL
      - Selection caps: total 8 items, max 2 YouTube, RSS hot score top 10 pool
      - Create `competitorContext` text block
      - Output single item with `{ competitorContext, sources, stats, competitorTag, date }`
   3. Connect Merge (All Data) → Code (Data Prep)

12) **Gemini analysis**
   1. Add node: **Google Gemini - Generate**
   2. Model: `models/gemini-2.5-flash`
   3. Set:
      - Temperature `0.3`
      - System message: “You are a Competitor Intelligence Analyst.”
      - User prompt that injects `{{ $json.competitorContext }}` and demands **STRICT JSON** with fields:
        - `report_title`, `summary`, `strategy_markdown`, `telegram_html`
      - Enable JSON output in node settings if available (`jsonOutput: true`)
   4. Connect Code (Data Prep) → Gemini

   **Credentials:** Create/attach **Google Gemini/PaLM** credential.

13) **Robust JSON parsing + Telegram HTML sanitization**
   1. Add node: **Code** named `Code - Robust Parser (Gemini JSON)`
   2. Implement:
      - Extract the JSON object substring from Gemini output
      - `JSON.parse`
      - Sanitize Telegram HTML: remove unsupported tags, convert lists to bullets, ensure balanced tags or strip
      - Truncate to under 4000 chars
      - Add `meta.generatedAt`, `meta.competitorTag`, `meta.date`
   3. Connect Gemini → Robust Parser

14) **Telegram output**
   1. Add node: **Telegram** → “Send Message”
   2. Set:
      - `Chat ID = <your chat/channel id>`
      - `Text = {{ $json.telegram_html }}`
      - Parse mode: `HTML`
   3. Connect Robust Parser → Telegram

   **Credentials:** Create/attach **Telegram Bot API** credential.

15) **Notion page creation**
   1. Add node: **Notion** → Resource: **Database Page** → “Create”
   2. Set Database ID from your Notion database URL.
   3. Ensure the database has properties:
      - `Name` (Title)
      - `date` (Date)
   4. Map properties:
      - Name = `{{ $json.report_title }}`
      - date = `{{ $json.meta.date }}` (no time)
   5. Connect Robust Parser → Notion Create Page

   **Credentials:** Create/attach **Notion API** credential and share the database with the integration.

16) **Build Notion blocks**
   1. Add node: **Code** named `Code (Build Notion Blocks)`
   2. Build `children` blocks:
      - Heading “🧠 Summary” + summary paragraph
      - Heading “🧩 Strategy” + toggle “👇 Open strategy details” with markdown-to-block conversion
      - Heading “🔗 Sources” extracted from telegram_html URLs
   3. Important: reference the robust parser node by name to fetch `summary`, `strategy_markdown`, `telegram_html`.
   4. Connect Notion Create Page → Code (Build Notion Blocks)

17) **Append blocks to the created Notion page**
   1. Add node: **HTTP Request** named `HTTP Request (Notion Append Children)`
   2. Method: `PATCH`
   3. URL:
      - `https://api.notion.com/v1/blocks/{{ $node["Notion - Create Database Page"].json.id }}/children`
   4. Authentication: use **Notion API credential** (predefined credential type).
   5. Headers:
      - `Notion-Version: 2022-06-28`
      - `Content-Type: application/json`
   6. Body (JSON): `{"children": <children array>}` coming from Code (Build Notion Blocks).
   7. Connect Code (Build Notion Blocks) → HTTP Request

18) **Activate the workflow** once credentials, channel IDs, RSS URLs, Notion DB ID, and Telegram chat ID are set.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “AI-Powered Intelligence Watchdog: YouTube & RSS to Telegram & Notion” — explains capabilities, setup steps (credentials, Apify, Notion DB properties), and customization tips (Gemini lens, token controls in Data Prep). | Sticky note on canvas (overview/setup guidance). |
| Add more competitors by duplicating YouTube/RSS nodes and wiring to merge nodes; remember to increase merge inputs accordingly. | Sticky note: “1. Data Sources (User Config)”. |
| Apify is used to fetch full transcripts for deeper analysis; normalization unifies blog + video data. | Sticky note: “2. Ingestion & Transcripts”. |
| Data prep deduplicates via static data, then Gemini extracts strategy/tone/counter-tactics. | Sticky note: “3. AI Strategy Core”. |
| Telegram delivers fast executive HTML briefing; Notion archives formatted report with headings/toggles. | Sticky note: “4. Professional Reporting”. |