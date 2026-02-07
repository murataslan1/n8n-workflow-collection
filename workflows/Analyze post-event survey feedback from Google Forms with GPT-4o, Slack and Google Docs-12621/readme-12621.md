Analyze post-event survey feedback from Google Forms with GPT-4o, Slack and Google Docs

https://n8nworkflows.xyz/workflows/analyze-post-event-survey-feedback-from-google-forms-with-gpt-4o--slack-and-google-docs-12621


# Analyze post-event survey feedback from Google Forms with GPT-4o, Slack and Google Docs

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:** This workflow analyzes post-event survey feedback (typically from Google Forms) using GPT models, then posts structured insights to **Slack** and logs them to a **Google Doc**. It supports two operating modes:
- **Individual (live) analysis:** runs per new response (Webhook or Google Sheets Trigger).
- **Aggregate analysis:** pulls *all* responses from a Google Sheet, computes average rating, and produces a consolidated AI summary.

**Target use cases:**
- Real-time monitoring of attendee sentiment and key themes during/after an event.
- Creating a running event feedback report in Google Docs.
- Generating periodic “executive summary + actions” from all responses.

### Logical blocks
1. **1.1 Trigger & Configuration**
2. **1.2 Mode Routing (Individual vs Aggregate)**
3. **1.3 Individual Response Normalization & AI Extraction**
4. **1.4 Individual Output: Slack + Google Docs + Error Handling**
5. **1.5 Aggregate Branch: Fetch → Aggregate → Average → AI Summary → Slack + Doc**
6. **1.6 In-Canvas Guidance (Sticky Notes)**

---

## 2. Block-by-Block Analysis

### 2.1 Trigger & Configuration

**Overview:** Receives new survey responses via either a webhook endpoint or a Google Sheets polling trigger, then sets shared configuration variables (event name, Slack channel, doc IDs, aggregation flag).

**Nodes involved:**
- Google Forms Webhook
- Google Sheets Trigger
- Workflow Configuration
- 📋 Setup Instructions
- Sticky Note
- 📋 Setup Instructions1

#### Node: Google Forms Webhook
- **Type / role:** `Webhook` — entry point for POST requests (e.g., Apps Script from Google Forms responses sheet).
- **Key config:**
  - Method: `POST`
  - Path: `survey-response` (n8n will expose a full URL based on environment)
- **Inputs/outputs:**
  - **Output →** Workflow Configuration
- **Expressions/variables:** none
- **Version notes:** typeVersion `2.1` (modern webhook node with options object).
- **Edge cases / failures:**
  - If Google Apps Script / Forms mapping doesn’t match expected fields, downstream normalization may produce empty strings/zeros.
  - Missing/invalid webhook calls (wrong URL, method mismatch) result in no workflow run.
  - Payload shape may differ (often nested), hence the normalization node checks `$json.body?.field`.

#### Node: Google Sheets Trigger
- **Type / role:** `Google Sheets Trigger` — polls a sheet for `rowAdded` events.
- **Key config:**
  - Event: `rowAdded`
  - Polling: every minute
  - Spreadsheet + sheet selected via UI list (configured to a specific spreadsheet and gid in JSON)
- **Inputs/outputs:**
  - **Output →** Workflow Configuration
- **Version notes:** typeVersion `1`
- **Edge cases / failures:**
  - Polling delay (not instant).
  - OAuth permission issues / expired refresh token.
  - Duplicate processing possible depending on trigger behavior and sheet edits.

#### Node: Workflow Configuration
- **Type / role:** `Set` — central configuration “constants” and a runtime flag.
- **Key config (assignments):**
  - `eventName` (string placeholder)
  - `slackChannel` (Slack channel ID placeholder)
  - `googleDocId` (Doc ID placeholder)
  - `spreadsheetId` (optional, for aggregate branch)
  - `aggregationMode` (boolean, default `false`)
  - `includeOtherFields: true` (keeps original trigger payload alongside config fields)
- **Inputs/outputs:**
  - Input: from either trigger
  - **Output →** Check Trigger Type
- **Version notes:** Set node typeVersion `3.4`
- **Edge cases / failures:**
  - If placeholders are not replaced, Slack/Docs/Sheets nodes will fail (invalid IDs).
  - `aggregationMode` is compared as a *string* later (see “Check Trigger Type”), which can cause routing issues if it remains boolean.

---

### 2.2 Mode Routing (Individual vs Aggregate)

**Overview:** Decides whether to process an individual response (default) or run the aggregate branch.

**Nodes involved:**
- Check Trigger Type
- 📊 Aggregation Branch

#### Node: Check Trigger Type
- **Type / role:** `IF` — branch selection.
- **Key config:**
  - Condition: `{{ $json.aggregationMode }} equals "false"`
  - Output 1 (true): individual processing
  - Output 2 (false): aggregate processing
- **Inputs/outputs:**
  - Input: Workflow Configuration
  - **True →** Normalize Survey Response
  - **False →** Get All Responses
- **Version notes:** typeVersion `2.2`
- **Edge cases / failures (important):**
  - `aggregationMode` is set as a **boolean** in Workflow Configuration, but compared to string `"false"`.
    - If n8n does strict type validation (it is set to `typeValidation: "strict"`), this may route incorrectly.
    - Safer expression would be `{{ $json.aggregationMode === false }}` or compare to `false` as boolean.
  - If aggregate mode is intended to be triggered manually, this workflow currently has no explicit “manual trigger node”; it relies on changing the flag and executing.

---

### 2.3 Individual Response Normalization & AI Extraction

**Overview:** Normalizes incoming fields to a consistent schema, then runs an OpenAI chat model with an Information Extractor to produce structured sentiment and themes.

**Nodes involved:**
- Normalize Survey Response
- OpenAI Chat Model
- AI Sentiment Analysis
- 🔧 Field Mapping Guide
- 🤖 AI Prompt Customization
- 6981a65b Sticky note (“AI feedback extraction”)

#### Node: Normalize Survey Response
- **Type / role:** `Set` — maps raw webhook/sheets fields into canonical keys.
- **Key config (expressions):**
  - `rating` (number): `{{ $json.body?.rating || $json.rating || 0 }}`
  - `likedMost` (string): `{{ $json.body?.likedMost || $json.likedMost || "" }}`
  - `improvements` (string): `{{ $json.body?.improvements || $json.improvements || "" }}`
  - `jobRole` (string): default `"Not specified"`
  - `companySize` (string): default `"Not specified"`
  - `includeOtherFields: true`
- **Inputs/outputs:**
  - Input: Check Trigger Type (true branch)
  - **Output →** AI Sentiment Analysis
- **Version notes:** Set node typeVersion `3.4`
- **Edge cases / failures:**
  - If Google Sheets trigger outputs different column names (e.g., “Rating” vs “rating”), normalization will yield defaults.
  - `rating` can become non-numeric string; later Slack/Doc formatting assumes `/10`.
  - If webhook payload is nested differently than `$json.body`, fields may be empty.

#### Node: OpenAI Chat Model
- **Type / role:** `lmChatOpenAi` (LangChain) — provides the LLM backend for the extractor node.
- **Key config:**
  - Model: `gpt-4o-mini`
- **Inputs/outputs:**
  - This node connects via **ai_languageModel** output to **AI Sentiment Analysis** (it supplies the model).
- **Version notes:** typeVersion `1.3` (n8n LangChain OpenAI chat node)
- **Edge cases / failures:**
  - Invalid/expired OpenAI credentials.
  - Model availability / quota limits.
  - Latency/timeouts for large payloads (though individual payload is small).

#### Node: AI Sentiment Analysis
- **Type / role:** `informationExtractor` — prompts the model and extracts structured attributes.
- **Key config:**
  - Prompt uses normalized fields:
    - Rating, likedMost, improvements, jobRole, companySize
  - Extracted attributes:
    - `sentiment` (Positive/Neutral/Negative intended)
    - `keyPointsLiked` (list 1–2)
    - `improvementSuggestions` (list 1–2)
    - `testimonialQuote` (optional)
- **Inputs/outputs:**
  - Input: Normalize Survey Response
  - Model: from OpenAI Chat Model via ai_languageModel connection
  - **Output →** If (error check)
- **Version notes:** typeVersion `1.2`
- **Edge cases / failures:**
  - Extractor may return missing/empty fields if the model responds unexpectedly.
  - If `likedMost`/`improvements` are blank, output quality may degrade; might return generic suggestions.

---

### 2.4 Individual Output: Slack + Google Docs + Error Handling

**Overview:** Verifies AI output exists; if valid, posts a formatted Slack message and appends a formatted block into a Google Doc. If invalid, alerts Slack with raw payload.

**Nodes involved:**
- If
- Slack #event-feedback
- Append to Google Doc
- Error Slack:
- Sticky Note2 (Error Handling)
- Sticky Note3 (Slack digest)
- Sticky Note4 (Google Docs)

#### Node: If (AI output check)
- **Type / role:** `IF` — basic AI-output guardrail.
- **Key config:**
  - Condition (OR group) uses:
    - `leftValue: {{ !$json.sentiment }}`
    - Operator: `notEmpty`
  - Output routing:
    - **True branch →** Slack #event-feedback
    - **False branch →** Error Slack:
- **Inputs/outputs:**
  - Input: AI Sentiment Analysis
- **Version notes:** typeVersion `2.2`
- **Edge cases / failures (important):**
  - The condition logic is odd: it checks `notEmpty` on `!$json.sentiment` (a boolean).
    - If `sentiment` exists, `!sentiment` becomes `false` (boolean), and “notEmpty” may evaluate unexpectedly.
    - Intended logic likely: “if sentiment is not empty → success else → error”.
    - Safer condition: `{{ $json.sentiment }}` `notEmpty` (without negation).
  - As written, this may route successes to the error branch or vice versa depending on n8n’s coercion.

#### Node: Slack #event-feedback
- **Type / role:** `Slack` — posts individual analysis to a channel.
- **Key config:**
  - Auth: OAuth2
  - Channel: `{{ $('Workflow Configuration').first().json.slackChannel }}`
  - Message includes:
    - Rating, sentiment, bullet lists from `keyPointsLiked` and `improvementSuggestions`
    - Role/company size
    - Optional testimonial quote
    - Uses Slack emoji codes in text (note: message uses `:neutral_face:` etc.)
- **Inputs/outputs:**
  - Input: If (success branch)
  - **Output →** Append to Google Doc
- **Version notes:** typeVersion `2.3`
- **Edge cases / failures:**
  - If `keyPointsLiked` or `improvementSuggestions` are not arrays, `.map()` will throw expression errors.
  - Slack channel ID must be an ID (e.g., `C123...`), not `#name`.
  - OAuth scopes must allow posting to the channel.

#### Node: Append to Google Doc
- **Type / role:** `Google Docs` — appends a formatted entry for each response.
- **Key config:**
  - Operation: `update`
  - Action: `insert` with a formatted text block including:
    - Date (local server time)
    - Rating, sentiment, role, company size
    - Bulleted sections from arrays
    - Optional quote line
  - Document URL/ID expression:
    - `{{ $('Workflow Configuration').first().json.googleDocId }}`
- **Inputs/outputs:**
  - Input: Slack #event-feedback
- **Version notes:** typeVersion `2`
- **Edge cases / failures:**
  - If the doc ID is wrong or permissions missing, update fails.
  - Expression failures if `keyPointsLiked` / `improvementSuggestions` are not arrays.
  - Concurrent inserts can interleave when many responses arrive simultaneously.

#### Node: Error Slack:
- **Type / role:** `Slack` — posts an alert when AI analysis is missing/failed.
- **Key config:**
  - Text: “AI Analysis Failed”, includes `Raw: {{ $json }}` and timestamp `{{ $now }}`
  - Channel from Workflow Configuration
- **Inputs/outputs:**
  - Input: If (error branch)
- **Version notes:** typeVersion `2.3`
- **Edge cases / failures:**
  - Posting raw JSON can be large/noisy; Slack message length limits can truncate.

---

### 2.5 Aggregate Branch: Fetch → Aggregate → Average → AI Summary → Slack + Doc

**Overview:** When aggregate mode is enabled, pulls all responses from Google Sheets, aggregates ratings, computes average rating and total responses, sends full dataset to GPT-4o for an executive summary, then posts to Slack and appends to Google Docs.

**Nodes involved:**
- Get All Responses
- Aggregate Ratings
- Calculate Average Rating
- OpenAI Chat Model Aggregation
- AI Aggregate Summary
- Post Aggregate to Slack
- Append Aggregate to Doc
- 📊 Aggregation Branch
- 🤖 AI Prompt Customization

#### Node: Get All Responses
- **Type / role:** `Google Sheets` — reads rows from a “Form Responses 1” sheet.
- **Key config:**
  - DocumentId: `{{ $('Workflow Configuration').first().json.spreadsheetId }}`
  - Sheet name: `Form Responses 1`
- **Inputs/outputs:**
  - Input: Check Trigger Type (false branch)
  - **Output →** Aggregate Ratings
- **Version notes:** typeVersion `4.7`
- **Edge cases / failures:**
  - If `spreadsheetId` is empty (it’s labeled optional), node fails in aggregate mode.
  - Sheet name must match exactly.
  - Large sheets can slow execution or exceed memory depending on n8n sizing.

#### Node: Aggregate Ratings
- **Type / role:** `Aggregate` — aggregates all item data into a single item (collects field arrays).
- **Key config:**
  - Mode: `aggregateAllItemData` (collects same fields across items)
- **Inputs/outputs:**
  - Input: Get All Responses
  - **Output →** Calculate Average Rating
- **Version notes:** typeVersion `1`
- **Edge cases / failures:**
  - If the sheet column is not named `rating`, downstream `Calculate Average Rating` will fail (expects `$json.rating` array).

#### Node: Calculate Average Rating
- **Type / role:** `Set` — computes statistics and prepares a combined payload for the LLM.
- **Key config (expressions):**
  - `averageRating`:
    - `{{ $json.rating.reduce((sum, val) => sum + parseFloat(val), 0) / $json.rating.length }}`
  - `totalResponses`: `{{ $json.rating.length }}`
  - `allFeedback`: `{{ JSON.stringify($input.all()) }}`
- **Inputs/outputs:**
  - Input: Aggregate Ratings
  - **Output →** AI Aggregate Summary
- **Version notes:** typeVersion `3.4`
- **Edge cases / failures (important):**
  - If `rating.length` is 0, division by zero yields `Infinity/NaN`.
  - If any rating is non-numeric, `parseFloat` may yield `NaN` affecting the mean.
  - `allFeedback` uses `$input.all()` which can be very large; token limits can be exceeded in the next AI call.

#### Node: OpenAI Chat Model Aggregation
- **Type / role:** `lmChatOpenAi` — model provider for aggregate summarization.
- **Key config:** Model `gpt-4o`
- **Connections:**
  - **ai_languageModel →** AI Aggregate Summary
- **Version notes:** typeVersion `1.3`
- **Edge cases:** quota/latency/token constraints more likely due to larger prompt.

#### Node: AI Aggregate Summary
- **Type / role:** `informationExtractor` — produces structured aggregate insights.
- **Key config:**
  - Prompt includes:
    - totalResponses, averageRating, and `allFeedback` blob
  - Extracted attributes:
    - `overallSentiment` (required)
    - `topThemes` (required, top 5)
    - `topActions` (required, top 5)
    - `summary` (required, 2–3 sentences)
- **Inputs/outputs:**
  - Input: Calculate Average Rating
  - Model: OpenAI Chat Model Aggregation
  - **Output →** Post Aggregate to Slack
- **Version notes:** typeVersion `1.2`
- **Edge cases / failures:**
  - If the prompt is too large, the model may truncate or fail.
  - Arrays might be returned as strings depending on extraction behavior; downstream `.map()` expects arrays.

#### Node: Post Aggregate to Slack
- **Type / role:** `Slack` — posts aggregate report to Slack.
- **Key config:**
  - Channel from Workflow Configuration
  - Message formats top themes/actions via `.map((x,i)=>...)`
- **Inputs/outputs:**
  - Input: AI Aggregate Summary
  - **Output →** Append Aggregate to Doc
- **Version notes:** typeVersion `2.3`
- **Edge cases / failures:**
  - If `topThemes` / `topActions` aren’t arrays, `.map()` expression fails.

#### Node: Append Aggregate to Doc
- **Type / role:** `Google Docs` — appends an “AGGREGATE ANALYSIS” section to the running report.
- **Key config:**
  - Operation: `update` → `insert`
  - Uses eventName from Workflow Configuration, plus AI fields
- **Inputs/outputs:**
  - Input: Post Aggregate to Slack
- **Version notes:** typeVersion `2`
- **Edge cases / failures:** same doc permission/ID issues; concurrency if multiple aggregate runs.

---

### 2.6 In-Canvas Guidance (Sticky Notes)

**Overview:** Sticky notes document setup choices, mapping expectations, and customization points.

**Nodes involved (all Sticky Notes):**
- 📋 Setup Instructions
- 🔧 Field Mapping Guide
- 🤖 AI Prompt Customization
- 📊 Aggregation Branch
- Sticky Note (webhook hint)
- Sticky Note1 (AI extraction hint)
- Sticky Note2 (error handling hint)
- Sticky Note3 (Slack digest hint)
- Sticky Note4 (Google Docs hint)
- 📋 Setup Instructions1

**Edge cases:** none (documentation only).

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| 📋 Setup Instructions | Sticky Note | Setup guidance | — | — | ## 🎯 GOOGLE FORMS TRIGGER; **Choose**: • **Webhook**: Instant (Forms → Sheets → Webhook URL) • **Sheets Trigger**: Polls responses sheet; **Google Forms Setup**: 1. Responses → New spreadsheet 2. Tools → Script editor → Webhook code 3. Copy Webhook URL from n8n; **Fields expected**: rating, likedMost, improvements, jobRole |
| 🔧 Field Mapping Guide | Sticky Note | Field mapping guidance | — | — | 🔧 FIELD MAPPING GUIDE; Map your survey fields in the "Normalize Survey Response" node… (required/optional fields list) |
| 🤖 AI Prompt Customization | Sticky Note | Prompt/schema customization guidance | — | — | 🤖 AI PROMPT CUSTOMIZATION; Customize AI analysis in the Information Extractor nodes… |
| 📊 Aggregation Branch | Sticky Note | Explains aggregate mode | — | — | 📊 AGGREGATION BRANCH; This branch is triggered when you want to analyze ALL responses… |
| Google Sheets Trigger | Google Sheets Trigger | Entry point (poll new rows) | — | Workflow Configuration | 🎯 GOOGLE FORMS WEBHOOK; Connect: Forms → Responses → Sheets → Webhook URL |
| Workflow Configuration | Set | Stores IDs + flags | Google Forms Webhook; Google Sheets Trigger | Check Trigger Type | 📋 SETUP INSTRUCTIONS; 1. Choose your trigger… 2. Configure Workflow Configuration… 3. Set up credentials… 4. Test with sample data… |
| Check Trigger Type | IF | Routes individual vs aggregate | Workflow Configuration | Normalize Survey Response; Get All Responses | 📊 AGGREGATION BRANCH; This branch is triggered when you want to analyze ALL responses… |
| Normalize Survey Response | Set | Canonicalizes survey fields | Check Trigger Type | AI Sentiment Analysis | 🔧 FIELD MAPPING GUIDE; Map your survey fields in the "Normalize Survey Response" node… |
| OpenAI Chat Model | OpenAI Chat Model (LangChain) | LLM provider (individual) | — (model connection) | AI Sentiment Analysis (ai_languageModel) | ## 🧠  AI FEEDBACK EXTRACTION; LLM → Sentiment, likes/improvements, testimonial JSON |
| AI Sentiment Analysis | Information Extractor (LangChain) | Structured extraction (individual) | Normalize Survey Response (+ model) | If | 🤖 AI PROMPT CUSTOMIZATION; Customize AI analysis in the Information Extractor nodes… |
| If | IF | Validates AI output / routes error | AI Sentiment Analysis | Slack #event-feedback; Error Slack: | ## 🛡️ ERROR HANDLING; Checks AI output exists. . IF no AI output → Slack alert + skip |
| Slack #event-feedback | Slack | Posts individual insight | If | Append to Google Doc | 📢 SLACK DIGEST; Posts live summary |
| Append to Google Doc | Google Docs | Appends individual entry | Slack #event-feedback | — | 📄 GOOGLE DOCS; Logs full feedback → Running event report |
| Error Slack: | Slack | Alerts on AI failure | If | — | ## 🛡️ ERROR HANDLING; Checks AI output exists. . IF no AI output → Slack alert + skip |
| Get All Responses | Google Sheets | Fetches all responses for aggregation | Check Trigger Type | Aggregate Ratings | 📊 AGGREGATION BRANCH; This branch is triggered when you want to analyze ALL responses… |
| Aggregate Ratings | Aggregate | Collapses rows into arrays | Get All Responses | Calculate Average Rating | 📊 AGGREGATION BRANCH; This branch is triggered when you want to analyze ALL responses… |
| Calculate Average Rating | Set | Computes mean + totals + payload | Aggregate Ratings | AI Aggregate Summary | 📊 AGGREGATION BRANCH; This branch is triggered when you want to analyze ALL responses… |
| OpenAI Chat Model Aggregation | OpenAI Chat Model (LangChain) | LLM provider (aggregate) | — (model connection) | AI Aggregate Summary (ai_languageModel) | 🤖 AI PROMPT CUSTOMIZATION; Customize AI analysis in the Information Extractor nodes… |
| AI Aggregate Summary | Information Extractor (LangChain) | Structured extraction (aggregate) | Calculate Average Rating (+ model) | Post Aggregate to Slack | 🤖 AI PROMPT CUSTOMIZATION; Customize AI analysis in the Information Extractor nodes… |
| Post Aggregate to Slack | Slack | Posts aggregate report | AI Aggregate Summary | Append Aggregate to Doc | 📊 AGGREGATION BRANCH; This branch is triggered when you want to analyze ALL responses… |
| Append Aggregate to Doc | Google Docs | Appends aggregate section | Post Aggregate to Slack | — | 📄 GOOGLE DOCS; Logs full feedback → Running event report |
| Sticky Note | Sticky Note | Webhook hint | — | — | 🎯 GOOGLE FORMS WEBHOOK; Connect: Forms → Responses → Sheets → Webhook URL |
| Sticky Note1 | Sticky Note | AI extraction hint | — | — | ## 🧠  AI FEEDBACK EXTRACTION; LLM → Sentiment, likes/improvements, testimonial JSON |
| Sticky Note2 | Sticky Note | Error handling hint | — | — | ## 🛡️ ERROR HANDLING; Checks AI output exists. . IF no AI output → Slack alert + skip |
| Sticky Note3 | Sticky Note | Slack note | — | — | 📢 SLACK DIGEST; Posts live summary |
| Sticky Note4 | Sticky Note | Docs note | — | — | 📄 GOOGLE DOCS; Logs full feedback → Running event report |
| 📋 Setup Instructions1 | Sticky Note | Full setup checklist | — | — | 📋 SETUP INSTRUCTIONS; 1. Choose your trigger… 2. Configure Workflow Configuration… 3. Set up credentials… 4. Test… |
| Google Forms Webhook | Webhook | Entry point (instant) | — | Workflow Configuration | 🎯 GOOGLE FORMS TRIGGER; Choose Webhook or Sheets Trigger… (see setup note) |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** named **“Post-Event Survey AI Analyzer”** (or your preferred name).
2. **Add trigger (option A): Webhook**
   1. Add **Webhook** node.
   2. Set **HTTP Method** = `POST`.
   3. Set **Path** = `survey-response`.
   4. Copy the **Test/Production URL** for use in Google Apps Script / Forms integration.
3. **Add trigger (option B): Google Sheets Trigger**
   1. Add **Google Sheets Trigger** node.
   2. Event: `Row added`.
   3. Poll time: every minute.
   4. Select your Spreadsheet and the responses sheet tab.
   5. Connect Google OAuth2 credentials with access to that sheet.
4. **Add a Set node** named **Workflow Configuration**
   1. Add fields:
      - `eventName` (string)
      - `slackChannel` (string; channel ID like `C012ABCDEF`)
      - `googleDocId` (string; doc ID)
      - `spreadsheetId` (string; only needed for aggregate mode)
      - `aggregationMode` (boolean; default `false`)
   2. Enable **Include Other Fields**.
   3. Connect both triggers → **Workflow Configuration**.
5. **Add an IF node** named **Check Trigger Type**
   1. Condition should route based on `aggregationMode`.
   2. Recommended robust condition (to avoid string/boolean mismatch):
      - “Boolean is false”: `{{ $json.aggregationMode === false }}`
   3. Connect **Workflow Configuration → Check Trigger Type**.
6. **Individual branch (Check Trigger Type = false aggregation / “individual” path)**
   1. Add **Set** node **Normalize Survey Response**:
      - Map fields using expressions similar to:
        - `rating`: `{{ $json.body?.rating || $json.rating || 0 }}`
        - `likedMost`: `{{ $json.body?.likedMost || $json.likedMost || "" }}`
        - `improvements`: `{{ $json.body?.improvements || $json.improvements || "" }}`
        - `jobRole`: default `"Not specified"`
        - `companySize`: default `"Not specified"`
      - Keep **Include Other Fields** on.
   2. Add **OpenAI Chat Model** node (LangChain):
      - Model: `gpt-4o-mini`
      - Configure **OpenAI API credentials**.
   3. Add **Information Extractor** node **AI Sentiment Analysis**:
      - Text prompt using normalized fields.
      - Define attributes: `sentiment`, `keyPointsLiked`, `improvementSuggestions`, `testimonialQuote`.
      - Connect **OpenAI Chat Model** to **AI Sentiment Analysis** via **ai_languageModel** connection.
      - Connect **Normalize Survey Response → AI Sentiment Analysis**.
   4. Add **IF** node (e.g., “AI output exists”):
      - Recommended condition: `{{ $json.sentiment }}` **is not empty**.
      - True branch = success, False branch = error.
   5. Add **Slack** node **Slack #event-feedback**:
      - Auth: **OAuth2**
      - Channel: expression referencing configuration, e.g. `{{ $('Workflow Configuration').first().json.slackChannel }}`
      - Message: format rating, sentiment, bullet lists using `.map()`.
   6. Add **Google Docs** node **Append to Google Doc**:
      - Operation: `Update` → Action `Insert`
      - Document: `{{ $('Workflow Configuration').first().json.googleDocId }}`
      - Insert the formatted response block (date, rating, sentiment, bullets, optional quote).
   7. Add **Slack** node **Error Slack:**:
      - Posts “AI Analysis Failed” and raw payload to the configured channel.
   8. Wire:
      - Success IF → Slack #event-feedback → Append to Google Doc
      - Error IF → Error Slack:
7. **Aggregate branch (Check Trigger Type = true aggregation)**
   1. Add **Google Sheets** node **Get All Responses**:
      - Spreadsheet ID: `{{ $('Workflow Configuration').first().json.spreadsheetId }}`
      - Sheet name: `Form Responses 1` (or your actual responses tab name)
      - Google OAuth2 credentials with read access.
   2. Add **Aggregate** node **Aggregate Ratings**:
      - Mode: aggregate all item data (collect arrays of fields).
   3. Add **Set** node **Calculate Average Rating**:
      - `averageRating`: compute mean from `$json.rating` array
      - `totalResponses`: `$json.rating.length`
      - `allFeedback`: `{{ JSON.stringify($input.all()) }}`
      - (Recommended) add guards for empty arrays and non-numeric ratings.
   4. Add **OpenAI Chat Model** node **OpenAI Chat Model Aggregation**:
      - Model: `gpt-4o`
   5. Add **Information Extractor** node **AI Aggregate Summary**:
      - Prompt includes totalResponses, averageRating, and allFeedback.
      - Attributes: `overallSentiment`, `topThemes`, `topActions`, `summary`.
      - Connect model via **ai_languageModel**.
   6. Add **Slack** node **Post Aggregate to Slack**:
      - Formats aggregate summary, uses `.map()` for themes/actions.
   7. Add **Google Docs** node **Append Aggregate to Doc**:
      - Inserts an “AGGREGATE ANALYSIS” block into the same doc.
   8. Wire:
      - Check Trigger Type (aggregate branch) → Get All Responses → Aggregate Ratings → Calculate Average Rating → AI Aggregate Summary → Post Aggregate to Slack → Append Aggregate to Doc
8. **Credentials to configure**
   - **OpenAI API**: for both Chat Model nodes.
   - **Slack OAuth2**: must allow posting to the target channel.
   - **Google Docs OAuth2**: must have edit access to the destination doc.
   - **Google Sheets OAuth2** and/or **Google Sheets Trigger OAuth2**: access to response spreadsheet.
9. **Operational setup**
   - For Webhook approach, implement Google Apps Script to forward new form responses to the webhook URL.
   - For aggregate mode, set `aggregationMode = true` (and provide `spreadsheetId`) before executing.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Choose: Webhook (instant) or Sheets Trigger (polling)” | Triggering strategy notes embedded in sticky notes |
| “Map your survey fields in ‘Normalize Survey Response’ node” | Field Mapping Guide sticky note |
| “Customize AI analysis in the Information Extractor nodes; modify schema in both AI nodes” | AI Prompt Customization sticky note |
| “Aggregation branch analyzes ALL responses; triggered by a manual flag” | Aggregation Branch sticky note |
| “Error handling checks AI output exists; if no output → Slack alert + skip” | Error Handling sticky note |

