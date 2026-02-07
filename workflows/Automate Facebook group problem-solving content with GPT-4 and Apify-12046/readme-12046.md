Automate Facebook group problem-solving content with GPT-4 and Apify

https://n8nworkflows.xyz/workflows/automate-facebook-group-problem-solving-content-with-gpt-4-and-apify-12046


# Automate Facebook group problem-solving content with GPT-4 and Apify

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Automate Facebook group problem-solving content with GPT-4 and Apify

**Purpose:**  
This workflow automatically mines recent discussions from selected Facebook Groups, extracts recurring pain points, synthesizes community insights, generates “native-to-the-group” problem-solving post drafts using an LLM, and saves ready-to-post variations back into Google Sheets.

**Target use cases**
- Content teams or solo operators who want consistent, high-signal community-driven posts.
- Lead-gen via helpful posts (non-promotional), tuned to a group’s language and norms.
- Ongoing “voice of customer” mining from FB Groups.

**Logical blocks**
1. **Scrape Groups (Input + Data Collection)**  
   Reads a list of Facebook groups from Google Sheets and runs an Apify actor to scrape latest posts.
2. **Research & Insights (Problem extraction + aggregation + insight synthesis)**  
   An LLM summarizes/identifies problems per post, aggregates them, then another LLM derives recurring pain points, language, and category mapping.
3. **Draft & Save (Copy generation + persistence)**  
   A writer LLM produces two post variations per problem and writes results to Google Sheets.

---

## 2. Block-by-Block Analysis

### 2.1 Block 0 — Documentation / On-canvas guidance (Sticky Notes)
**Overview:** Provides human-readable context and setup instructions inside the n8n canvas. No runtime impact.

**Nodes involved:**
- Sticky Note3
- Sticky Note5
- Sticky Note1
- Sticky Note

**Node details**
- **Sticky Note3 (n8n-nodes-base.stickyNote)**
  - Role: Explains the end-to-end concept and setup steps.
  - Key content: Mentions required Google Sheet columns (`Group URL`, `Group Name`), Apify actor setup, OpenAI API keys, and customizing Writer tone. Includes credit/link:  
    “Neal J., CTK Industries | https://www.linkedin.com/in/nealjmcleod/”
  - Failure modes: None (non-executing).
- **Sticky Note5**
  - Role: Labels Block 1 “Scrape Groups”.
- **Sticky Note1**
  - Role: Labels Block 2 “Research & Insights”.
- **Sticky Note**
  - Role: Labels Block 3 “Draft & Save”.

---

### 2.2 Block 1 — Scrape Groups (Google Sheets → Apify)
**Overview:** Manually starts the workflow, fetches the target group list from Google Sheets, and triggers Apify to scrape recent posts/discussions.

**Nodes involved:**
- Start Mining FB Groups
- Fetch Your FB Groups List
- Scrape Latest Group Posts

#### Node: Start Mining FB Groups
- **Type / role:** `n8n-nodes-base.manualTrigger` — manual entry point.
- **Config choices:** No parameters; run on-demand.
- **Connections:**  
  Output → **Fetch Your FB Groups List**
- **Edge cases:** None; only available in editor/manual runs.

#### Node: Fetch Your FB Groups List
- **Type / role:** `n8n-nodes-base.googleSheets` — reads group rows from a spreadsheet tab.
- **Configuration (interpreted):**
  - Document: “Automated FB Communities” (Google Sheet ID provided).
  - Sheet tab: “Communities” (gid-like value `203420999`).
  - Operation: (Not explicitly shown in JSON, default for this node is typically “Read”/“Get Many”; behavior implies it outputs rows.)
- **Key fields used later:**
  - `Group Name` (referenced multiple times in LLM prompts)
  - `Group Niche` (used in Writer prompt)
  - Likely `Group URL` (mentioned in sticky note, presumably used by Apify actor input even if not mapped explicitly here)
- **Credentials:** Google Sheets OAuth2.
- **Connections:**  
  Output → **Scrape Latest Group Posts**
- **Failure modes / edge cases:**
  - OAuth token expiry / permission issues.
  - Sheet schema mismatch (missing `Group Name` / `Group Niche` columns causes expression failures downstream).
  - If multiple rows are returned, n8n will iterate items; Apify will be triggered per row unless actor itself handles batching.

#### Node: Scrape Latest Group Posts
- **Type / role:** `@apify/n8n-nodes-apify.apify` — runs an Apify actor and returns dataset items.
- **Configuration (interpreted):**
  - Operation: “Run actor and get dataset”
  - Actor ID: expression placeholder `=Enter the Apify Facebook Scraper iD here` (must be replaced)
  - Timeout: not set (uses defaults)
- **Inputs:** Items from Google Sheets (per group).
- **Outputs:** Dataset items representing scraped posts (each post becomes an item).
- **Credentials:** Apify (not shown explicitly as a credential object here; typically configured in node credentials UI).
- **Connections:**  
  Output → **Problem Analyzer**
- **Failure modes / edge cases:**
  - Missing/invalid actor ID.
  - Actor run failures (rate limits, login/cookie requirements, FB access restrictions).
  - Large datasets causing long execution time or memory pressure.
  - Schema mismatch: downstream expects fields like `caption`, `post_date`, `user_details.name`, `total_reaction.Like`, `total_comment_count`, `top_comments[...]`.

---

### 2.3 Block 2 — Research & Insights (LLM extraction + aggregation + synthesis)
**Overview:** Converts each scraped post into structured “problem evidence” via an LLM, aggregates all extracted findings into one combined text corpus, then synthesizes group-wide insights and categorization.

**Nodes involved:**
- Think
- Problem Analyzer
- Bundle All Problems Together
- Think2
- Community Insight Agent

#### Node: Think
- **Type / role:** `@n8n/n8n-nodes-langchain.toolThink` — “think tool” callable by an LLM agent.
- **Configuration:** empty; acts as a reasoning tool endpoint.
- **Connections:**  
  Tool output is connected as an AI tool to **Problem Analyzer** (`Think.ai_tool → Problem Analyzer`).
- **Failure modes:** Usually none; but if node missing/disconnected, prompts asking to “use the think tool” can reduce output quality.

#### Node: Problem Analyzer
- **Type / role:** `@n8n/n8n-nodes-langchain.openAi` — per-post problem identification and evidence extraction.
- **Model:** `o3-mini`
- **Error handling:** `onError: continueRegularOutput` (workflow continues even if the node errors; output may be partial/empty).
- **Prompting strategy (interpreted):**
  - Strong system instructions to produce:
    - Ranked problem list
    - Supporting evidence (likes/comments)
    - Language bank
    - Audience snapshot
    - Category map to 10 master categories
  - User content injects per-post fields (date, caption, user, likes, comments, top comments).
  - Mentions using the “think tool” for hard decisions (wired to the Think node).
- **Key expressions/variables:**
  - `{{ $('Fetch Your FB Groups List').item.json['Group Name'] }}` to tailor analysis per group.
  - Multiple `{{ $json... }}` references to scraped post fields, e.g.:
    - `$json.post_date`, `$json.caption`, `$json.user_details.name`
    - `$json.total_reaction.Like`, `$json.total_comment_count`
    - `$json.top_comments[1].comment_text`, `$json.top_comments[0].comment_text`
- **Input:** Apify dataset items (one per post).
- **Output:** LLM message object per post (stored in `message` field in n8n’s LangChain/OpenAI node output).
- **Connections:**  
  Output → **Bundle All Problems Together**
- **Failure modes / edge cases:**
  - If `top_comments[1]` doesn’t exist, expression may resolve to `null` (usually safe) but could error if structure differs.
  - Missing `total_reaction.Like` key (some posts may have different reactions schema).
  - Model refusal/format drift (no strict JSON required here, but later aggregation expects `message` exists).
  - Because `continueRegularOutput` is enabled, downstream nodes may receive items with missing `message`.

#### Node: Bundle All Problems Together
- **Type / role:** `n8n-nodes-base.aggregate` — merges multiple items into one aggregated item.
- **Configuration (interpreted):**
  - Aggregates the field `message` from each incoming item.
  - Renames aggregated output field to `content`.
  - `mergeLists: true` combines lists rather than nesting.
- **Input:** Multiple items from Problem Analyzer.
- **Output:** Likely a single item with a combined `content` field holding all `message` entries.
- **Connections:**  
  Output → **Community Insight Agent**
- **Failure modes / edge cases:**
  - If upstream outputs missing `message`, aggregation may yield incomplete `content`.
  - If message objects are large, combined content might exceed model context limits downstream.

#### Node: Think2
- **Type / role:** `toolThink` — callable reasoning tool for the Community Insight Agent.
- **Connections:**  
  `Think2.ai_tool → Community Insight Agent`
- **Failure modes:** same as Think.

#### Node: Community Insight Agent
- **Type / role:** `@n8n/n8n-nodes-langchain.openAi` — synthesizes group-wide patterns from the aggregated content.
- **Model:** `o3-mini`
- **Prompting strategy (interpreted):**
  - Instructs: list main topics, recurring pain points, commonly suggested solutions, common language, and map pain points to specified business categories (slightly different names than the analyzer’s numeric codes, but conceptually aligned).
  - Input: `{{ $json.content }}` (the aggregated analyzer messages).
- **Input:** Single aggregated item.
- **Output:** A consolidated insight text in `message.content`.
- **Connections:**  
  Output → **writer**
- **Failure modes / edge cases:**
  - Context overflow if `content` is too large; may require truncation or selecting top N posts.
  - If the aggregated `content` contains nested structures, the model may struggle unless it’s plain text; can reduce insight quality.

---

### 2.4 Block 3 — Draft & Save (LLM writing → Google Sheets)
**Overview:** Uses the insight summary plus group metadata to generate ready-to-post drafts in strict JSON, then saves selected fields to a Google Sheet.

**Nodes involved:**
- Think1
- writer
- Save Your Ready-to-Post Content

#### Node: Think1
- **Type / role:** `toolThink` — callable reasoning tool for the writer agent.
- **Connections:**  
  `Think1.ai_tool → writer`
- **Failure modes:** same as other Think nodes.

#### Node: writer
- **Type / role:** `@n8n/n8n-nodes-langchain.openAi` — generates the final Facebook post drafts.
- **Model:** `gpt-4.1`
- **Error handling:** `onError: continueRegularOutput`
- **Notable configuration:**
  - `jsonOutput: true` (expects JSON output)
- **Prompting strategy (interpreted):**
  - User message: instructs to write a “value packed FB Group Post” specifically for:
    - Group name: `{{ $('Fetch Your FB Groups List').item.json['Group Name'] }}`
    - Group niche: `{{ $('Fetch Your FB Groups List').item.json['Group Niche'] }}`
  - It injects the analysis: `{{ $json.message.content }}` (the Community Insight Agent output).
  - Requires output JSON schema: an array of objects with `problem`, `solution_summary`, `post_variation_1`, `post_variation_2`.
  - System message: detailed style/tone constraints + two template patterns (Personal Journey, Quick Tip).
- **Input:** Community Insight Agent output (single item).
- **Output:** Parsed JSON in `message.content` (structure expected by the Google Sheets mapping).
- **Connections:**  
  Output → **Save Your Ready-to-Post Content**
- **Failure modes / edge cases:**
  - JSON schema drift: if model outputs non-JSON or wraps in markdown, parsing may fail.
  - The downstream node assumes: `results[0]` exists under `message.content.results[0]` (see next node). If writer outputs a plain array (as instructed), there may be a structural mismatch unless n8n wraps it into `results`. This is a key integration risk.
  - If it returns multiple problems, only index `[0]` is saved.

#### Node: Save Your Ready-to-Post Content
- **Type / role:** `n8n-nodes-base.googleSheets` — persists the drafted content.
- **Operation:** `appendOrUpdate`
- **Target:**
  - Document: “Automated FB Communities”
  - Sheet tab: “High Ticket Coacing” (note spelling)
- **Column mappings (expressions):**
  - **Problem**: `={{ $json.message.content.results[0].problem }}`
  - **Solution Summary**: `={{ $json.message.content.results[0].solution_summary }}`
  - **Post Variation 1**: `={{ $json.message.content.results[0].post_variation_1 }}`
  - **Post Variation 2**: `={{ $json.message.content.results[0].post_variation_2 }}`
  - **Date created**: `={{ $now.format('yyyy-MM-dd') }}`
- **Credentials:** Google Sheets OAuth2.
- **Connections:** terminal node (no outgoing connections).
- **Failure modes / edge cases:**
  - **Likely bug:** references `message.content.results[0]` but the writer prompt demands a top-level JSON array. Depending on n8n’s LangChain node behavior, you may actually need:
    - `$json.message.content[0].problem` (if content is parsed as array), or
    - `$json.output[0]...` (if node stores parsed JSON elsewhere), or
    - adjust writer to return `{ "results": [ ... ] }`.
  - Append/Update requires matching columns logic; here `matchingColumns` is empty, so behavior is closer to append (or may attempt update with no match logic depending on node version).
  - Sheet columns must exist exactly as specified: `Problem`, `Solution Summary`, `Post Variation 1`, `Post Variation 2`, `Date created`.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Sticky Note3 | Sticky Note | Canvas documentation + setup instructions | — | — | # 🧠 FB Group Problem Solver… (includes setup steps + credit/link: https://www.linkedin.com/in/nealjmcleod/) |
| Start Mining FB Groups | Manual Trigger | Manual workflow start | — | Fetch Your FB Groups List | ## 1. Scrape Groups… |
| Fetch Your FB Groups List | Google Sheets | Load FB group list (name/niche/URL) | Start Mining FB Groups | Scrape Latest Group Posts | ## 1. Scrape Groups… |
| Scrape Latest Group Posts | Apify | Run FB group scraper actor + return dataset items | Fetch Your FB Groups List | Problem Analyzer | ## 1. Scrape Groups… |
| Sticky Note5 | Sticky Note | Block label: scraping | — | — | ## 1. Scrape Groups… |
| Think | LangChain Think Tool | Reasoning tool for analyzer | — | (tool to) Problem Analyzer | ## 2. Research & Insights… |
| Problem Analyzer | OpenAI (LangChain) | Extract per-post problems/evidence/language | Scrape Latest Group Posts | Bundle All Problems Together | ## 2. Research & Insights… |
| Bundle All Problems Together | Aggregate | Merge all analyzer messages into one `content` | Problem Analyzer | Community Insight Agent | ## 2. Research & Insights… |
| Think2 | LangChain Think Tool | Reasoning tool for insight agent | — | (tool to) Community Insight Agent | ## 2. Research & Insights… |
| Community Insight Agent | OpenAI (LangChain) | Synthesize recurring topics/pain points/language/categories | Bundle All Problems Together | writer | ## 2. Research & Insights… |
| Sticky Note1 | Sticky Note | Block label: research/insights | — | — | ## 2. Research & Insights… |
| Think1 | LangChain Think Tool | Reasoning tool for writer | — | (tool to) writer | ## 3. Draft & Save… |
| writer | OpenAI (LangChain) | Generate FB post drafts in JSON | Community Insight Agent | Save Your Ready-to-Post Content | ## 3. Draft & Save… |
| Save Your Ready-to-Post Content | Google Sheets | Save final drafts back to sheet | writer | — | ## 3. Draft & Save… |
| Sticky Note | Sticky Note | Block label: drafting/saving | — | — | ## 3. Draft & Save… |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n.
2. **Add Manual Trigger**
   - Node: **Manual Trigger**
   - Name: `Start Mining FB Groups`

3. **Add Google Sheets node to read groups**
   - Node: **Google Sheets**
   - Name: `Fetch Your FB Groups List`
   - Credentials: configure **Google Sheets OAuth2** (Google account with access to the sheet).
   - Document: select your spreadsheet (e.g., “Automated FB Communities”).
   - Sheet: select the tab containing your groups (e.g., “Communities”).
   - Ensure your sheet has at least these columns:
     - `Group URL`
     - `Group Name`
     - `Group Niche` (used later by the writer)
   - Connect: `Start Mining FB Groups` → `Fetch Your FB Groups List`

4. **Add Apify node to scrape posts**
   - Node: **Apify**
   - Name: `Scrape Latest Group Posts`
   - Credentials: configure Apify API token in n8n.
   - Operation: **Run actor and get dataset**
   - Actor ID: set to your **Facebook Groups Scraper** actor ID in Apify.
   - (Important) Configure actor input mapping so it uses the current item’s `Group URL` (this workflow’s JSON doesn’t show the input mapping; you must set it in the node UI if the actor expects it).
   - Connect: `Fetch Your FB Groups List` → `Scrape Latest Group Posts`

5. **Add LLM “Problem Analyzer”**
   - Node: **OpenAI (LangChain)** (n8n LangChain OpenAI node)
   - Name: `Problem Analyzer`
   - Credentials: OpenAI API key
   - Model: `o3-mini`
   - Error handling: set **On Error → Continue (regular output)** (optional but matches workflow)
   - Prompt: include the per-post fields (caption, date, likes/comments, top comments) and the system instructions to output:
     - ranked problems, evidence, language bank, audience snapshot, category map.
   - Add **Think Tool**:
     - Add node **Tool Think** named `Think`
     - In the Problem Analyzer node, enable/attach the tool so the model can call it.
   - Connect: `Scrape Latest Group Posts` → `Problem Analyzer`

6. **Aggregate all analyzer outputs**
   - Node: **Aggregate**
   - Name: `Bundle All Problems Together`
   - Field to aggregate: `message`
   - Output field name: `content`
   - Option: enable **Merge Lists**
   - Connect: `Problem Analyzer` → `Bundle All Problems Together`

7. **Add “Community Insight Agent”**
   - Node: **OpenAI (LangChain)**
   - Name: `Community Insight Agent`
   - Credentials: OpenAI API key
   - Model: `o3-mini`
   - Prompt: take `{{$json.content}}` and ask for:
     - main topics, recurring pain points, recommended solutions/tools, common language/acronyms, mapping to business categories.
   - Add **Think Tool**:
     - Add node **Tool Think** named `Think2`
     - Attach it to the Community Insight Agent.
   - Connect: `Bundle All Problems Together` → `Community Insight Agent`

8. **Add “writer” node**
   - Node: **OpenAI (LangChain)**
   - Name: `writer`
   - Credentials: OpenAI API key
   - Model: `gpt-4.1`
   - Enable **JSON output**.
   - Prompt: instruct it to write 2 post variations tailored to:
     - `{{ $('Fetch Your FB Groups List').item.json['Group Name'] }}`
     - `{{ $('Fetch Your FB Groups List').item.json['Group Niche'] }}`
     - plus the insight text from `{{ $json.message.content }}`
   - Add **Think Tool**:
     - Add node **Tool Think** named `Think1`
     - Attach it to `writer`.
   - Connect: `Community Insight Agent` → `writer`

9. **Add Google Sheets node to save content**
   - Node: **Google Sheets**
   - Name: `Save Your Ready-to-Post Content`
   - Credentials: same Google Sheets OAuth2 (or another with edit access).
   - Operation: **Append or Update**
   - Document: your target spreadsheet
   - Sheet: your output tab (e.g., “High Ticket Coacing”)
   - Create columns in the output sheet:
     - `Problem`, `Solution Summary`, `Post Variation 1`, `Post Variation 2`, `Date created` (and optionally `Date Posted`)
   - Map values from the writer output.
   - **Important:** Align your expressions with the writer’s actual JSON structure. If writer outputs an array, use something like:
     - `={{ $json.message.content[0].problem }}`
     - (rather than `.results[0]`) unless you change writer to return `{ "results": [ ... ] }`.
   - Connect: `writer` → `Save Your Ready-to-Post Content`

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Happy Money Making Neal J., CTK Industries” | Attribution contained in canvas note |
| LinkedIn: https://www.linkedin.com/in/nealjmcleod/ | Included in Sticky Note3 |
| Sheet requirements: columns `Group URL` and `Group Name` | Mentioned in Sticky Note3 setup steps |
| Apify requirement: set up “Facebook Groups Scraper” actor | Mentioned in Sticky Note3 setup steps |
| OpenAI requirement: API key for Analyzer, Insight Agent, Writer | Mentioned in Sticky Note3 setup steps |
| Customize Writer system prompt for tone of voice | Mentioned in Sticky Note3 setup steps |
| Integration risk: writer JSON vs Google Sheets mapping (`results[0]`) | Observed from node expressions; should be reconciled during setup |