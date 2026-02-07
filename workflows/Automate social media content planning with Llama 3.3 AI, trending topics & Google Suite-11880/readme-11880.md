Automate social media content planning with Llama 3.3 AI, trending topics & Google Suite

https://n8nworkflows.xyz/workflows/automate-social-media-content-planning-with-llama-3-3-ai--trending-topics---google-suite-11880


# Automate social media content planning with Llama 3.3 AI, trending topics & Google Suite

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:** This workflow runs every day at **8:00 AM** to automatically generate **daily social media content ideas** for all **active campaigns** stored in Google Sheets. It enriches AI generation with **trending topics** (News RSS + Reddit), saves outputs into a “Daily Content Plan” Google Sheet, schedules posts as **Google Calendar events**, computes lightweight **quality metrics**, and emails a daily summary via **Gmail**.

**Target use cases**
- Marketing teams managing multiple concurrent campaigns and platforms
- Daily content ideation with trend-driven angles
- Centralized planning in Google Sheets + execution reminders in Google Calendar

### Logical blocks
1. **Trigger & Trend Collection**: schedule trigger → fetch RSS + Reddit → merge + format a trend summary.
2. **Campaign Processing**: read campaigns from Sheets → filter active → attach trend summary.
3. **AI Content Generation**: Groq (Llama 3.3) agent generates structured content per campaign.
4. **Save & Report**: write to Sheets + create Calendar event + compute metrics → aggregate → email summary.

---

## 2. Block-by-Block Analysis

### 2.1 Trigger & Trend Collection

**Overview:** Starts the workflow daily at 8 AM, pulls trending topics from two sources (RSS + Reddit), merges them, and converts them into a compact text summary for AI context.

**Nodes involved**
- `Daily 8 AM Trigger1`
- `Workflow Configuration1`
- `Fetch News RSS1`
- `Fetch Reddit Popular1`
- `Merge Trends1`
- `Format Trending Topics1`

#### Node: Daily 8 AM Trigger1
- **Type / role:** Schedule Trigger (entry point)
- **Config:** Runs daily at **08:00** (server/instance timezone).
- **Outputs:** One execution item triggers downstream configuration.
- **Failure/edge cases:** Timezone mismatch (n8n instance vs user expectation).

#### Node: Workflow Configuration1
- **Type / role:** Set node (central config variables)
- **Config (interpreted):**
  - `activeCampaignsSheet` = `"Active Campaigns"`
  - `dailyContentPlanSheet` = `"Daily Content Plan"`
  - `newsRssFeedUrl` = placeholder (must be replaced; e.g. Google News RSS)
  - `redditSubreddit` = `"popular"`
  - `gmailRecipient` = placeholder email recipient
  - **includeOtherFields = true** (keeps trigger fields if any)
- **Key expressions:** Later nodes reference this node via `$('Workflow Configuration1').first().json...`
- **Failure/edge cases:** If placeholders aren’t replaced, RSS/Gmail will fail or send nowhere.

#### Node: Fetch News RSS1
- **Type / role:** RSS Feed Read (trend source #1)
- **Config:** URL expression:
  - `={{ $('Workflow Configuration1').first().json.newsRssFeedUrl }}`
- **Inputs:** From `Workflow Configuration1`
- **Outputs:** RSS items (each item typically has `title`, `link`, etc.)
- **Failure/edge cases:** Invalid URL, feed blocked, transient HTTP errors, empty feed.

#### Node: Fetch Reddit Popular1
- **Type / role:** Reddit node (trend source #2)
- **Config:**
  - Operation: `getAll`
  - `subreddit` from config (`popular` by default)
  - `limit` = 10
- **Inputs:** From `Workflow Configuration1`
- **Outputs:** Reddit post objects (commonly nested under `data`)
- **Failure/edge cases:** Reddit credentials missing/invalid, rate limits, subreddit restrictions.

#### Node: Merge Trends1
- **Type / role:** Merge node (combine parallel sources)
- **Config:** `mode = combine`, `combineBy = combineAll` (effectively concatenates both streams)
- **Inputs:** RSS items + Reddit items
- **Outputs:** Single combined list passed onward
- **Failure/edge cases:** If one branch returns 0 items, merge still proceeds; if a node errors upstream, execution stops unless error handling is added.

#### Node: Format Trending Topics1
- **Type / role:** Code node (normalize/format trend data)
- **Config (logic):**
  - Iterates all merged items.
  - If an item has `title` and `link`, treats it as **News**.
  - Else if it has `data.title`, treats it as **Reddit** and builds URL as `https://reddit.com` + `permalink`.
  - Produces:
    - `trends`: array of `{ source, title, url }`
    - `trendingSummary`: numbered list like `1. [News] ...`
    - `totalTrends`
- **Outputs:** Exactly **one item** containing the summary and structured list.
- **Failure/edge cases:** Unexpected RSS/Reddit response shape could lead to missing trends; still returns an item but may be empty.

---

### 2.2 Campaign Processing

**Overview:** Reads campaign rows from Google Sheets, filters for `status = active`, and enriches each active campaign with the trend summary.

**Nodes involved**
- `Read Active Campaigns1`
- `Check Campaign Status1`
- `Enrich with Trends1`

#### Node: Read Active Campaigns1
- **Type / role:** Google Sheets (read campaign data)
- **Config:**
  - Document ID: placeholder (must be set)
  - Sheet name by **name** from config: `activeCampaignsSheet`
  - `returnFirstMatch: false` (returns all rows)
- **Inputs:** From `Workflow Configuration1`
- **Outputs:** One item per row (campaign)
- **Failure/edge cases:** OAuth not configured, wrong document ID, wrong sheet name, header mismatch, permission issues.

#### Node: Check Campaign Status1
- **Type / role:** IF node (filter active campaigns)
- **Config:** Condition: `{{$json.status}} equals "active"` (case-insensitive behavior depends on node settings; configured with `caseSensitive: false`)
- **Outputs:**
  - **True path** → active campaigns only
  - False path is unused (inactive campaigns are dropped from downstream flow)
- **Failure/edge cases:** Missing `status` column yields false and silently filters out everything.

#### Node: Enrich with Trends1
- **Type / role:** Set node (attach trend context to each campaign)
- **Config:**
  - Adds `trendingTopics`:
    - `={{ $('Format Trending Topics1').first().json.trendingSummary || 'No trends available' }}`
  - `includeOtherFields: true` so original campaign fields remain (e.g., `projectName`, `platform`, `theme`, etc.)
- **Inputs:** From IF (true path). Also depends on `Format Trending Topics1` via expression lookup.
- **Failure/edge cases:** If trend formatting node produced no item (due to upstream hard error), expression access may fail; typically it exists but summary might be empty.

---

### 2.3 AI Content Generation

**Overview:** For each active campaign item (now enriched with trends), an AI agent (Groq + Llama 3.3) generates a structured response: caption, creative direction, hashtags, and best posting time.

**Nodes involved**
- `Groq Chat Model1`
- `Structured Output Parser1`
- `Generate Content Ideas1`

#### Node: Groq Chat Model1
- **Type / role:** LangChain Groq Chat Model (LLM provider)
- **Config:** Model = `llama-3.3-70b-versatile`
- **Connections:** Provides the **AI language model** input to the agent node.
- **Credentials:** Groq API key required in n8n credentials for Groq.
- **Failure/edge cases:** Invalid API key, model unavailable, rate limits, request timeouts.

#### Node: Structured Output Parser1
- **Type / role:** Structured output parser (forces JSON shape)
- **Config:** Manual JSON schema:
  - `postCaption` (string)
  - `creativeDirection` (string)
  - `hashtags` (string)
  - `bestPostingTime` (string)
- **Connections:** Supplies the **output parser** to the agent node.
- **Failure/edge cases:** If the LLM responds with non-conforming output, parsing fails and stops execution.

#### Node: Generate Content Ideas1
- **Type / role:** LangChain Agent (prompt + tool-less generation)
- **Config:**
  - **Input text:** `={{ $json }}` (passes the entire campaign item JSON, including `trendingTopics`)
  - **System message:** Social media strategist instructions; explicitly asks to incorporate trending topics when available.
  - `promptType: define`
  - `hasOutputParser: true` (connected to Structured Output Parser)
- **Inputs:** Items from `Enrich with Trends1` (one per active campaign)
- **Outputs:** A field typically shaped as:
  - `$json.output.postCaption`, `$json.output.creativeDirection`, `$json.output.hashtags`, `$json.output.bestPostingTime`
- **Failure/edge cases:**
  - Missing key campaign fields (e.g., `platform`, `targetAudience`) reduces output quality.
  - Model may output ambiguous posting times; later Calendar formatting expects a time-like string.

---

### 2.4 Save & Report

**Overview:** Normalizes AI output for storage, appends it to a Daily Plan sheet, schedules a calendar event per campaign, computes simple quality metrics, aggregates to a daily summary, and emails it.

**Nodes involved**
- `Format for Sheets1`
- `Append to Daily Content Plan1`
- `Format for Calendar1`
- `Create Calendar Event1`
- `Calculate Performance Metrics1`
- `Aggregate Daily Summary1`
- `Format Email Content1`
- `Send Gmail Summary1`

#### Node: Format for Sheets1
- **Type / role:** Set node (map AI output → flat columns)
- **Config (key fields):**
  - `date` = `{{$now.format('yyyy-MM-dd')}}`
  - `postCaption` = `{{$json.output.postCaption}}`
  - `creativeDirection` = `{{$json.output.creativeDirection}}`
  - `hashtags` = `{{$json.output.hashtags}}`
  - `bestPostingTime` = `{{$json.output.bestPostingTime}}`
  - `includeOtherFields: true` (keeps campaign fields like `projectName`, `platform`)
- **Inputs:** From `Generate Content Ideas1`
- **Outputs:** One item per campaign with normalized fields
- **Failure/edge cases:** If the parser failed upstream, `output.*` won’t exist and expressions may error.

#### Node: Append to Daily Content Plan1
- **Type / role:** Google Sheets (append/update)
- **Config:**
  - Operation: `appendOrUpdate`
  - Document ID: placeholder
  - Sheet name from config: `dailyContentPlanSheet`
  - Mapping: `autoMapInputData`
- **Inputs:** From `Format for Sheets1`
- **Outputs:** Confirmation per row operation
- **Failure/edge cases:** Column headers in sheet must match incoming keys (or auto-mapping may misalign); OAuth/permissions; appendOrUpdate may require a key column depending on sheet setup.

#### Node: Format for Calendar1
- **Type / role:** Set node (calendar event payload)
- **Config:**
  - `summary` = `{{$json.projectName + ' - ' + $json.platform}}`
  - `description` = concatenation of caption + creative direction + hashtags
  - `start` = `{{$json.date + 'T' + $json.bestPostingTime}}`
  - `end` = same as start (zero-duration event)
- **Inputs:** From `Format for Sheets1`
- **Failure/edge cases:**
  - If `bestPostingTime` is not ISO-time compatible (e.g., “evening”), Calendar creation may fail.
  - No timezone specified; relies on calendar defaults and Google interpretation.

#### Node: Create Calendar Event1
- **Type / role:** Google Calendar (create event)
- **Config:**
  - Calendar ID: placeholder (e.g., `primary`)
  - Start/End from previous node
  - Additional fields: `summary`, `description`
- **Inputs:** From `Format for Calendar1`
- **Failure/edge cases:** OAuth, invalid calendar ID, invalid datetime format, API quotas.

#### Node: Calculate Performance Metrics1
- **Type / role:** Code node (compute quality indicators)
- **Config (logic per campaign item):**
  - `captionLength`
  - `hashtagCount` (counts `#` occurrences)
  - `hasCreativeDirection` (creativeDirection length > 50)
  - `qualityScore` baseline 5, adds:
    - +2 if caption length 100–300
    - +2 if hashtag count 5–10
    - +1 if creative direction sufficiently detailed
  - Adds `generatedAt` ISO timestamp
- **Inputs:** From `Format for Sheets1`
- **Outputs:** One item per campaign with metrics added
- **Failure/edge cases:** If hashtags don’t contain `#` (plain words), `hashtagCount` becomes 0 and scoring drops.

#### Node: Aggregate Daily Summary1
- **Type / role:** Aggregate node (aggregateAllItemData)
- **Config:** Aggregates all item data into a single item.
- **Important integration note:** The next node expects fields like `campaigns`, `qualityScores`, `platforms`. This Aggregate node’s exact output structure depends on n8n Aggregate behavior/version. If it does not explicitly build these arrays, the email formatting expressions will fail.
- **Failure/edge cases:** Mismatch between aggregated output shape and email template expectations.

#### Node: Format Email Content1
- **Type / role:** Set node (HTML email composition)
- **Config:**
  - `emailSubject` = `"📊 Daily Content Plan Summary - " + formatted date`
  - `emailBody` = HTML with dynamic expressions:
    - `{{$json.campaigns.length}}`
    - average score: `($json.qualityScores.reduce(...) / $json.qualityScores.length).toFixed(1)`
    - lists: `platforms.map(...)`, `campaigns.map(...)`
- **Inputs:** From `Aggregate Daily Summary1`
- **Failure/edge cases:** If `campaigns` / `qualityScores` / `platforms` arrays don’t exist, the expressions will throw and block sending.

#### Node: Send Gmail Summary1
- **Type / role:** Gmail node (send email)
- **Config:**
  - To: `={{ $('Workflow Configuration1').first().json.gmailRecipient }}`
  - Subject/body from previous node
- **Credentials:** Gmail OAuth2 in n8n
- **Failure/edge cases:** OAuth expired, recipient placeholder not replaced, Gmail API quotas, HTML rendering quirks if not set as HTML (depends on node behavior/options).

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Sticky Note | Sticky Note | Author/contact information | — | — | ## Author  ![Digimetalab](https://gravatar.com/avatar/8238cf8143845ac216cad8b70057892b?size=256?r=pg&d=retro&size=100)  ## Digimetalab  Automation consultant from Bali, with 3+ years helping Sales & Marketing streamline processes. We offer custom n8n solutions to boost efficiency. Book an initial consultation via our link for tailored automation.  For business inquiries, email we at digimetalab@gmail.com  Or message me on [Telegram](https://t.me/digimetalab) for a faster response.  ### Check out my other templates  ### 👉 https://n8n.io/creators/digimetalab/ |
| Main Overview1 | Sticky Note | Workflow overview & setup checklist | — | — | ## Daily Content Planner for social media campaigns  (contains setup/customize instructions) |
| Section  | Sticky Note | Block header | — | — | ## 1. Trigger & Trend Collection Fetches trending topics from RSS feeds and Reddit, then formats them for AI context. |
| Daily 8 AM Trigger1 | Schedule Trigger | Daily workflow entry point | — | Workflow Configuration1 | ## 1. Trigger & Trend Collection Fetches trending topics from RSS feeds and Reddit, then formats them for AI context. |
| Workflow Configuration1 | Set | Central configuration variables | Daily 8 AM Trigger1 | Fetch News RSS1; Fetch Reddit Popular1; Read Active Campaigns1 | ## 1. Trigger & Trend Collection Fetches trending topics from RSS feeds and Reddit, then formats them for AI context. |
| Fetch News RSS1 | RSS Feed Read | Pull trending news | Workflow Configuration1 | Merge Trends1 | ## 1. Trigger & Trend Collection Fetches trending topics from RSS feeds and Reddit, then formats them for AI context. |
| Fetch Reddit Popular1 | Reddit | Pull trending Reddit posts | Workflow Configuration1 | Merge Trends1 | ## 1. Trigger & Trend Collection Fetches trending topics from RSS feeds and Reddit, then formats them for AI context. |
| Merge Trends1 | Merge | Combine RSS + Reddit items | Fetch News RSS1; Fetch Reddit Popular1 | Format Trending Topics1 | ## 1. Trigger & Trend Collection Fetches trending topics from RSS feeds and Reddit, then formats them for AI context. |
| Format Trending Topics1 | Code | Normalize + summarize trends | Merge Trends1 | Enrich with Trends1 | ## 1. Trigger & Trend Collection Fetches trending topics from RSS feeds and Reddit, then formats them for AI context. |
| Section 5 | Sticky Note | Block header | — | — | ## 2. Campaign Processing Reads active campaigns from Google Sheets and enriches with trending topics. |
| Read Active Campaigns1 | Google Sheets | Read campaigns table | Workflow Configuration1 | Check Campaign Status1 | ## 2. Campaign Processing Reads active campaigns from Google Sheets and enriches with trending topics. |
| Check Campaign Status1 | IF | Filter active campaigns | Read Active Campaigns1 | Enrich with Trends1 | ## 2. Campaign Processing Reads active campaigns from Google Sheets and enriches with trending topics. |
| Enrich with Trends1 | Set | Attach trend summary to campaign item | Check Campaign Status1; (expression uses Format Trending Topics1) | Generate Content Ideas1 | ## 2. Campaign Processing Reads active campaigns from Google Sheets and enriches with trending topics. |
| Section 6 | Sticky Note | Block header | — | — | ## 3. AI Content Generation Groq AI creates captions, hashtags, creative direction, and posting times. |
| Groq Chat Model1 | Groq Chat Model (LangChain) | LLM backend | — | Generate Content Ideas1 (ai_languageModel) | ## 3. AI Content Generation Groq AI creates captions, hashtags, creative direction, and posting times. |
| Structured Output Parser1 | Structured Output Parser (LangChain) | Enforce schema on AI output | — | Generate Content Ideas1 (ai_outputParser) | ## 3. AI Content Generation Groq AI creates captions, hashtags, creative direction, and posting times. |
| Generate Content Ideas1 | Agent (LangChain) | Generate structured content per campaign | Enrich with Trends1 (+ Groq model + parser) | Format for Sheets1 | ## 3. AI Content Generation Groq AI creates captions, hashtags, creative direction, and posting times. |
| Section 7 | Sticky Note | Block header | — | — | ## 4. Save & Report Saves to Sheets, creates Calendar events, and sends email summary. |
| Format for Sheets1 | Set | Flatten AI output + add date | Generate Content Ideas1 | Append to Daily Content Plan1; Format for Calendar1; Calculate Performance Metrics1 | ## 4. Save & Report Saves to Sheets, creates Calendar events, and sends email summary. |
| Append to Daily Content Plan1 | Google Sheets | Write daily plan rows | Format for Sheets1 | — | ## 4. Save & Report Saves to Sheets, creates Calendar events, and sends email summary. |
| Format for Calendar1 | Set | Build calendar event payload | Format for Sheets1 | Create Calendar Event1 | ## 4. Save & Report Saves to Sheets, creates Calendar events, and sends email summary. |
| Create Calendar Event1 | Google Calendar | Schedule post reminder | Format for Calendar1 | — | ## 4. Save & Report Saves to Sheets, creates Calendar events, and sends email summary. |
| Calculate Performance Metrics1 | Code | Compute quality metrics | Format for Sheets1 | Aggregate Daily Summary1 | ## 4. Save & Report Saves to Sheets, creates Calendar events, and sends email summary. |
| Aggregate Daily Summary1 | Aggregate | Collapse campaign metrics into one summary item | Calculate Performance Metrics1 | Format Email Content1 | ## 4. Save & Report Saves to Sheets, creates Calendar events, and sends email summary. |
| Format Email Content1 | Set | Build HTML email subject/body | Aggregate Daily Summary1 | Send Gmail Summary1 | ## 4. Save & Report Saves to Sheets, creates Calendar events, and sends email summary. |
| Send Gmail Summary1 | Gmail | Send daily report email | Format Email Content1 | — | ## 4. Save & Report Saves to Sheets, creates Calendar events, and sends email summary. |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n and name it:  
   `Automate social media content planning with Llama 3.3 AI, trending topics & Google Suite`

2. **Add Schedule Trigger**
   - Node: **Schedule Trigger**
   - Name: `Daily 8 AM Trigger1`
   - Configure: run **daily** at **08:00**

3. **Add configuration Set node**
   - Node: **Set**
   - Name: `Workflow Configuration1`
   - Enable **Include Other Fields**
   - Add string fields:
     - `activeCampaignsSheet` = `Active Campaigns`
     - `dailyContentPlanSheet` = `Daily Content Plan`
     - `newsRssFeedUrl` = (your RSS URL, e.g. `https://news.google.com/rss`)
     - `redditSubreddit` = `popular` (or any subreddit)
     - `gmailRecipient` = (recipient email)
   - Connect: `Daily 8 AM Trigger1` → `Workflow Configuration1`

4. **Trend collection (RSS)**
   - Node: **RSS Feed Read**
   - Name: `Fetch News RSS1`
   - URL: expression  
     `{{$('Workflow Configuration1').first().json.newsRssFeedUrl}}`
   - Connect: `Workflow Configuration1` → `Fetch News RSS1`

5. **Trend collection (Reddit)**
   - Node: **Reddit**
   - Name: `Fetch Reddit Popular1`
   - Operation: **Get All**
   - Subreddit: expression  
     `{{$('Workflow Configuration1').first().json.redditSubreddit}}`
   - Limit: `10`
   - Configure Reddit credentials (per your n8n Reddit node requirements)
   - Connect: `Workflow Configuration1` → `Fetch Reddit Popular1`

6. **Merge RSS + Reddit**
   - Node: **Merge**
   - Name: `Merge Trends1`
   - Mode: **Combine**
   - Combine by: **Combine All**
   - Connect:
     - `Fetch News RSS1` → `Merge Trends1` (Input 1)
     - `Fetch Reddit Popular1` → `Merge Trends1` (Input 2)

7. **Format trends**
   - Node: **Code**
   - Name: `Format Trending Topics1`
   - Paste logic equivalent to:
     - detect RSS items by `title/link`
     - detect Reddit items by `data.title`
     - output one item with `trendingSummary`, `trends`, `totalTrends`
   - Connect: `Merge Trends1` → `Format Trending Topics1`

8. **Read campaigns from Google Sheets**
   - Node: **Google Sheets**
   - Name: `Read Active Campaigns1`
   - Operation: **Read** (return all rows)
   - Document ID: your Google Sheet file ID
   - Sheet name: expression  
     `{{$('Workflow Configuration1').first().json.activeCampaignsSheet}}`
   - Configure **Google Sheets OAuth2** credentials
   - Connect: `Workflow Configuration1` → `Read Active Campaigns1`

9. **Filter active campaigns**
   - Node: **IF**
   - Name: `Check Campaign Status1`
   - Condition: `{{$json.status}}` **equals** `active` (case-insensitive)
   - Connect: `Read Active Campaigns1` → `Check Campaign Status1` (main)

10. **Enrich campaign items with trend summary**
    - Node: **Set**
    - Name: `Enrich with Trends1`
    - Include Other Fields: **true**
    - Add field `trendingTopics` (string) with expression:  
      `{{$('Format Trending Topics1').first().json.trendingSummary || 'No trends available'}}`
    - Connect: `Check Campaign Status1` (true output) → `Enrich with Trends1`

11. **Add Groq chat model**
    - Node: **Groq Chat Model** (LangChain)
    - Name: `Groq Chat Model1`
    - Model: `llama-3.3-70b-versatile`
    - Configure **Groq API credential**

12. **Add structured output parser**
    - Node: **Structured Output Parser** (LangChain)
    - Name: `Structured Output Parser1`
    - Schema (manual): object with string fields:
      - `postCaption`, `creativeDirection`, `hashtags`, `bestPostingTime`

13. **Add AI agent**
    - Node: **Agent** (LangChain)
    - Name: `Generate Content Ideas1`
    - Input text: `{{$json}}`
    - System message: social media strategist prompt that requests caption, creative direction, hashtags, best posting time and to incorporate `trendingTopics`.
    - Connect AI ports:
      - `Groq Chat Model1` → `Generate Content Ideas1` (AI Language Model connection)
      - `Structured Output Parser1` → `Generate Content Ideas1` (AI Output Parser connection)
    - Connect main flow: `Enrich with Trends1` → `Generate Content Ideas1`

14. **Format for storage**
    - Node: **Set**
    - Name: `Format for Sheets1`
    - Include Other Fields: **true**
    - Fields:
      - `date` = `{{$now.format('yyyy-MM-dd')}}`
      - `postCaption` = `{{$json.output.postCaption}}`
      - `creativeDirection` = `{{$json.output.creativeDirection}}`
      - `hashtags` = `{{$json.output.hashtags}}`
      - `bestPostingTime` = `{{$json.output.bestPostingTime}}`
    - Connect: `Generate Content Ideas1` → `Format for Sheets1`

15. **Append/update Daily Content Plan sheet**
    - Node: **Google Sheets**
    - Name: `Append to Daily Content Plan1`
    - Operation: **Append or Update**
    - Document ID: same or another sheet ID
    - Sheet name expression:  
      `{{$('Workflow Configuration1').first().json.dailyContentPlanSheet}}`
    - Columns mapping: **Auto-map input data**
    - Connect: `Format for Sheets1` → `Append to Daily Content Plan1`

16. **Create calendar event payload**
    - Node: **Set**
    - Name: `Format for Calendar1`
    - Fields:
      - `summary` = `{{$json.projectName + ' - ' + $json.platform}}`
      - `description` = `'Post Caption: ' + ...` (caption, creativeDirection, hashtags)
      - `start` = `{{$json.date + 'T' + $json.bestPostingTime}}`
      - `end` = same as start
    - Connect: `Format for Sheets1` → `Format for Calendar1`

17. **Create Google Calendar event**
    - Node: **Google Calendar**
    - Name: `Create Calendar Event1`
    - Operation: **Create**
    - Calendar ID: `primary` (or your calendar ID)
    - Start/End expressions: `{{$json.start}}` / `{{$json.end}}`
    - Summary/Description expressions: `{{$json.summary}}` / `{{$json.description}}`
    - Configure **Google Calendar OAuth2**
    - Connect: `Format for Calendar1` → `Create Calendar Event1`

18. **Compute performance metrics**
    - Node: **Code**
    - Name: `Calculate Performance Metrics1`
    - Implement:
      - caption length, hashtag count, creative direction length check
      - compute `qualityScore`
      - add `generatedAt`
    - Connect: `Format for Sheets1` → `Calculate Performance Metrics1`

19. **Aggregate daily summary**
    - Node: **Aggregate**
    - Name: `Aggregate Daily Summary1`
    - Mode: **Aggregate all item data**
    - Connect: `Calculate Performance Metrics1` → `Aggregate Daily Summary1`
    - Important: ensure the aggregate output provides what your email template expects (e.g., build arrays `campaigns`, `platforms`, `qualityScores`). If not, add a Code node here to shape the summary.

20. **Format email**
    - Node: **Set**
    - Name: `Format Email Content1`
    - Fields:
      - `emailSubject` = `📊 Daily Content Plan Summary - {{$now.format('MMMM dd, yyyy')}}`
      - `emailBody` = HTML using aggregated fields
    - Connect: `Aggregate Daily Summary1` → `Format Email Content1`

21. **Send Gmail**
    - Node: **Gmail**
    - Name: `Send Gmail Summary1`
    - To: `{{$('Workflow Configuration1').first().json.gmailRecipient}}`
    - Subject: `{{$json.emailSubject}}`
    - Message: `{{$json.emailBody}}`
    - Configure **Gmail OAuth2**
    - Connect: `Format Email Content1` → `Send Gmail Summary1`

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Author: Digimetalab (Automation consultant) | Email: digimetalab@gmail.com |
| Telegram contact | https://t.me/digimetalab |
| Other templates by the author | https://n8n.io/creators/digimetalab/ |
| Setup checklist included in workflow notes | Google Sheets OAuth, Google Calendar OAuth, Gmail OAuth, Groq API key, RSS URL, enable schedule trigger |

