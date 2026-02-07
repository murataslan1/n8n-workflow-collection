AI expense tracker: Telegram voice/photo/text to sheets

https://n8nworkflows.xyz/workflows/ai-expense-tracker--telegram-voice-photo-text-to-sheets-12006


# AI expense tracker: Telegram voice/photo/text to sheets

## 1. Workflow Overview

**Title:** AI expense tracker: Telegram voice/photo/text to sheets  
**Internal name:** `AI Multimodal Expense Tracker_Final_v2.2`

This workflow turns a Telegram chat into a multi-modal expense logger. Users can submit **text**, **voice notes**, or **receipt photos**; Google Gemini extracts structured expense data; the workflow normalizes/validates it; then logs it to **Google Sheets**. It also supports a **/add budget** command and an optional **debounced daily report** that triggers after 30 minutes of inactivity (per chat) using an n8n **Data Table** token mechanism.

### Logical blocks
1. **Input & Routing**
   - Telegram Trigger → load config → route budget command vs expense logging → route by modality (voice/photo/text)
2. **AI Extraction & Normalization**
   - Gemini (text chat / analyze audio / analyze image) → normalize AI output into a common shape → parse JSON robustly
3. **Validation, Logging & User Feedback**
   - Check if expenses exist → split items to rows → append to Google Sheets → reply to Telegram (success/error)
4. **Budget Top-up Command**
   - Parse “/add budget …” → validate → append budget row in Google Sheets → confirm/error in Telegram
5. **Smart Debounced Reporting (optional)**
   - After each successful logging: upsert token → wait 30 minutes → confirm token still latest → delete token → read dashboard range → build report → send to Telegram

---

## 2. Block-by-Block Analysis

### 2.1 Input & Routing

**Overview:** Receives Telegram messages, injects user configuration (sheet IDs, locale, currency), routes `/add budget` commands separately, and otherwise routes messages by modality (voice/photo/text). Also prevents duplicate processing using `update_id`.

**Nodes involved:**
- Telegram Trigger
- CONFIG - User Settings
- Switch (Command Router)
- Google Sheets: Get Rows (Dedup lookup)
- IF (Is Duplicate?)
- Code (Restore Telegram Payload)
- Switch (Voice/Photo/Text)

#### Node: Telegram Trigger
- **Type/role:** `telegramTrigger` — entry point for incoming Telegram updates.
- **Configuration:** Listens to `message` updates.
- **Outputs:** To **CONFIG - User Settings**.
- **Failure modes:** Invalid Telegram credential, webhook not set/reachable, bot not allowed in chat.

#### Node: CONFIG - User Settings
- **Type/role:** `set` — central configuration store.
- **Key fields set (placeholders in template):**
  - `spreadsheet_id`
  - `sheet_gid_log` (e.g. `gid=0`)
  - `sheet_gid_dashboard` (Dashboard sheet gid)
  - `sheet_gid_budget` (Budget Topups sheet gid)
  - `currency_code`, `currency_symbol`, `locale`, `timezone`
- **Expressions used elsewhere:** Many nodes reference `$('CONFIG - User Settings').item.json.<field>`.
- **Outputs:** To **Switch (Command Router)**.
- **Edge cases:** If IDs/timezone remain placeholders, downstream Google Sheets/date formatting will fail or produce wrong results.

#### Node: Switch (Command Router)
- **Type/role:** `switch` — routes Telegram text commands.
- **Rules:**
  - **AddBudget** if regex matches: `^\/add(?:@\w+)?\s+budget\b` (case-insensitive)
  - **Default** otherwise
- **Outputs:**
  - AddBudget → **Code (Parse Budget Amount)**
  - Default → **Google Sheets: Get Rows (Dedup lookup)**
- **Failure modes:** Non-text messages still go Default (since it checks `$json.message?.text || ''`), which is intended.

#### Node: Google Sheets: Get Rows (Dedup lookup)
- **Type/role:** `googleSheets` — reads log sheet to detect duplicates.
- **Operation:** Get rows with filter:
  - `Update_ID` equals `{{$json.update_id}}`
- **Sheet selection:** Uses config:
  - `documentId` = `spreadsheet_id`
  - `sheetName` = `sheet_gid_log`
- **Outputs:** To **IF (Is Duplicate?)**
- **Important config nuance:** `sheetName` uses “id mode” with a value like `gid=0`. Ensure this matches how your n8n Google Sheets node expects sheet identifiers (some setups require sheet name or numeric gid).
- **Failure modes:** OAuth scopes/permissions, sheet ID wrong, column header mismatch (`Update_ID` must exist), rate limits.
- **Node settings:** `alwaysOutputData: true` meaning it will pass an item even if no rows were found.

#### Node: IF (Is Duplicate?)
- **Type/role:** `if` — decides whether to continue.
- **Logic:** Checks `Message_ID` **not empty** on the returned sheet row.
  - In practice: if the lookup found an existing row, it will have `Message_ID`, so it’s considered duplicate.
- **Outputs:**
  - **True** branch: empty (stops processing)
  - **False** branch: → **Code (Restore Telegram Payload)**
- **Edge cases:** If your sheet row does not contain `Message_ID` or column naming differs, duplicates may not be detected.

#### Node: Code (Restore Telegram Payload)
- **Type/role:** `code` — restores original Telegram trigger payload after the dedup lookup (since the Sheets node output is different).
- **Code:** `return [{ json: $node["Telegram Trigger"].json }];`
- **Outputs:** → **Switch (Voice/Photo/Text)**
- **Failure modes:** If the workflow changes and node name “Telegram Trigger” is renamed, this reference breaks.

#### Node: Switch (Voice/Photo/Text)
- **Type/role:** `switch` — chooses processing chain based on message content.
- **Rules (notEmpty checks):**
  - Voice: `$node["Telegram Trigger"].json.message.voice`
  - Photo: `$node["Telegram Trigger"].json.message.photo`
  - Text: `$node["Telegram Trigger"].json.message.text`
- **Outputs:**
  - Voice → **Set (Voice Context)**
  - Photo → **Set (Photo Context)**
  - Text → **Set (Text Context)**
- **Edge cases:** Messages containing both text and photo (caption) appear under `message.photo` with `message.caption`; the Photo branch wins if photo exists.

---

### 2.2 AI Extraction & Normalization (Text/Voice/Photo)

**Overview:** Builds a consistent “context payload” (chat/message IDs, now, raw_input), runs Gemini for the corresponding modality, and normalizes the Gemini response into a standardized structure that downstream parsing can handle uniformly.

**Nodes involved:**
- Set (Text Context)
- Google Gemini Chat (Text → JSON)
- Code (Normalize Gemini Text Output)
- Set (Voice Context)
- Telegram → Get Voice File
- Google Gemini (Analyze Audio)
- Code (Normalize Gemini Audio Output)
- Set (Photo Context)
- Code (Pick Best Photo)
- Telegram → Get Image File
- Google Gemini (Analyze Image)
- Code (Normalize Gemini Image Output)

#### Node: Set (Text Context)
- **Type/role:** `set` — creates context for text input.
- **Key fields:**
  - `raw_input` = `message.text`
  - `message_id`, `chat_id`, `update_id`
  - `source_type` = `"text"`
  - `now` = `$now.setZone('Asia/Ho_Chi_Minh').toFormat('yyyy-LL-dd HH:mm:ss')`
- **Outputs:** → **Google Gemini Chat (Text → JSON)**
- **Edge cases:** Timezone is hardcoded here (`Asia/Ho_Chi_Minh`) rather than config `timezone`.

#### Node: Google Gemini Chat (Text → JSON)
- **Type/role:** `@n8n/n8n-nodes-langchain.googleGemini` — Gemini chat completion for text.
- **Model:** `models/gemini-2.5-flash`
- **Prompt:** Instructs strict JSON output with:
  - `expenses[]` each containing `item, amount, currency, category, payment_method, date`
  - `summary_text`
  - Category constrained to `[Food, Transport, Bills, Shopping, Entertainment, Other]`
  - Normalization rules for `k/m` suffixes and integer amounts
  - Default currency from `CONFIG - User Settings.currency_code`
- **Input message:** the user’s raw text.
- **Outputs:** → **Code (Normalize Gemini Text Output)**
- **Failure modes:** Gemini API auth, quota, model availability, malformed output (non-JSON), latency/timeouts.

#### Node: Code (Normalize Gemini Text Output)
- **Type/role:** `code` — standardizes Gemini output into `{ content: { parts: [{text}] }, ...context }`.
- **Inputs:** Gemini response + `Set (Text Context)` via `$node[...]`.
- **Outputs:** → **Code (Parse Gemini JSON)**
- **Failure modes:** If node names change (“Set (Text Context)”), references break.

---

#### Node: Set (Voice Context)
- **Type/role:** `set` — context for voice processing.
- **Key fields:**
  - `file_id` = `message.voice.file_id`
  - `raw_input` = `"[voice]"`
  - `source_type` = `"voice"`
  - `now` formatted in `Asia/Ho_Chi_Minh`
- **Outputs:** → **Telegram → Get Voice File**
- **Edge cases:** Voice messages missing `message.voice` won’t reach here (handled by switch).

#### Node: Telegram → Get Voice File
- **Type/role:** `telegram` — downloads the voice file.
- **Operation:** `resource: file` with `fileId` from context.
- **MIME:** `audio/ogg`
- **Outputs:** binary audio → **Google Gemini (Analyze Audio)**
- **Failure modes:** Telegram file not found, bot permissions, large file download issues.

#### Node: Google Gemini (Analyze Audio)
- **Type/role:** `googleGemini` — analyzes binary audio: transcription + extraction.
- **Model:** `models/gemini-2.5-flash`
- **Resource/operation:** `audio` / `analyze`, `inputType: binary`
- **Prompt:** asks to transcribe and extract expenses in strict JSON.
- **Outputs:** → **Code (Normalize Gemini Audio Output)**

#### Node: Code (Normalize Gemini Audio Output)
- **Type/role:** `code` — same normalization strategy as text.
- **Context source:** `$node["Set (Voice Context)"].json`
- **Outputs:** → **Code (Parse Gemini JSON)**

---

#### Node: Set (Photo Context)
- **Type/role:** `set` — context for photo/receipt processing.
- **Key fields:**
  - `caption` and `raw_input` = `message.caption || "[photo]"`
  - `source_type` = `"photo"`
  - `now` formatted in `Asia/Ho_Chi_Minh`
  - `update_id`, `message_id`, `chat_id`
- **includeOtherFields:** true (keeps original payload, including `message.photo[]`)
- **Outputs:** → **Code (Pick Best Photo)**

#### Node: Code (Pick Best Photo)
- **Type/role:** `code` — selects best photo variant.
- **Logic:** sorts `message.photo[]` by `file_size` and picks largest.
- **Adds fields:** `file_id`, width/height/file_size.
- **Outputs:** → **Telegram → Get Image File**
- **Failure modes:** If `message.photo` is empty, throws `No message.photo found`.

#### Node: Telegram → Get Image File
- **Type/role:** `telegram` — downloads the image.
- **MIME:** `image/jpeg`
- **Outputs:** binary image → **Google Gemini (Analyze Image)**
- **Failure modes:** Telegram download failures, image too large, wrong MIME.

#### Node: Google Gemini (Analyze Image)
- **Type/role:** `googleGemini` — analyzes receipt image for items.
- **Model:** `models/gemini-2.5-flash`
- **Resource/operation:** `image` / `analyze`, binary input.
- **Prompt:** return ONLY raw JSON, schema same as others; includes default currency from config.
- **Outputs:** → **Code (Normalize Gemini Image Output)**

#### Node: Code (Normalize Gemini Image Output)
- **Type/role:** `code` — standardizes output and injects context from `Set (Photo Context)`.
- **Outputs:** → **Code (Parse Gemini JSON)**

---

### 2.3 Validation, Logging & Feedback

**Overview:** Robustly parses the AI output into JSON, validates whether expenses exist, splits multiple expenses into separate items, appends to Google Sheets, and responds to the user. Then schedules the debounced report token.

**Nodes involved:**
- Code (Parse Gemini JSON)
- IF (Has expenses?)
- Code (Split expenses to items)
- Google Sheets → Append row(s)
- Telegram → Send Final Message
- Telegram → Send Error Message and wait for response
- Code (Schedule Report Token)

#### Node: Code (Parse Gemini JSON)
- **Type/role:** `code` — extracts/validates JSON from Gemini text.
- **Key behaviors:**
  - Removes ``` fences if present.
  - Tries `JSON.parse` directly; fallback extracts first `{...}` block via regex.
  - Throws an error if parsing fails: `Gemini output is not valid JSON...`
  - Ensures `expenses` is an array; `summary_text` is a string.
  - Builds context fields (`update_id`, `raw_input`, `message_id`, `chat_id`, `source_type`, `now`)
    - `update_id` falls back to Telegram Trigger’s `update_id`.
    - Supports `now` typo key `"now "` in addition to `now`.
  - Outputs unified object containing:
    - `expenses`, `summary_text`
    - `_ai_raw_text`, `_ai_clean_json_text`
    - context fields
- **Outputs:** → **IF (Has expenses?)**
- **Failure modes:** Upstream Gemini returns non-JSON; regex grabs wrong block; node name changes break `$node["Telegram Trigger"]`.

#### Node: IF (Has expenses?)
- **Type/role:** `if` — routes success vs “no expenses detected”.
- **Condition:** `={{ ($json.expenses || []).length > 0 }}`
  - Implemented as “string notEmpty” check on a boolean expression; it works but is fragile.
- **Outputs:**
  - True → **Code (Split expenses to items)** AND **Telegram → Send Final Message** (in parallel)
  - False → **Telegram → Send Error Message and wait for response**
- **Edge cases:** If expenses is empty but summary_text exists, user gets error message anyway.

#### Node: Code (Split expenses to items)
- **Type/role:** `code` — fan-out each expense into its own n8n item for row appending.
- **Key logic:**
  - Reads config timezone/currency:
    - `timeZone = config.timezone || 'Asia/Ho_Chi_Minh'`
    - `defaultCurrency = config.currency_code || 'USD'`
  - Formats fallback datetime in timezone (Intl.DateTimeFormat).
  - For each expense:
    - Ensures `date` is present; else uses fallback.
    - Coerces `amount` to `Number`.
    - Defaults: `currency` to config, `category` to `'Other'`, `payment_method` to `'Cash'`.
  - Uses `update_id` from `Telegram Trigger` (not from parsed payload), ensuring dedup consistency.
- **Outputs:** → **Google Sheets → Append row(s)**
- **Failure modes:** Invalid timezone string in config may cause Intl formatting errors in some environments.

#### Node: Google Sheets → Append row(s)
- **Type/role:** `googleSheets` — logs each expense row.
- **Operation:** `append`
- **Target:** log sheet (`sheet_gid_log`) in spreadsheet (`spreadsheet_id`)
- **Columns written:**
  - Date, Item, Amount, Category, Currency, Raw_Input, Update_ID, Message_ID, Payment_Method
- **Outputs:** → **Code (Schedule Report Token)**
- **Failure modes:** Sheet headers must match; permission issues; append quotas; wrong gid reference format.

#### Node: Telegram → Send Final Message
- **Type/role:** `telegram` — confirmation to user.
- **Text:** `{{$json.summary_text}}`
- **Reply-to:** `message_id`
- **Chat:** `chat_id` from context
- **Connected from:** True branch of **IF (Has expenses?)** (runs in parallel with logging)
- **Failure modes:** Telegram send failures, invalid chat/message ids.

#### Node: Telegram → Send Error Message and wait for response
- **Type/role:** `telegram` — informs user AI couldn’t parse expenses.
- **Text:** `⚠️ Could not understand expenses in: "raw_input" ...`
- **Chat:** from Telegram Trigger’s chat id
- **Reply-to:** `message_id`
- **Failure modes:** Same as above. (Despite its name, it does not actually “wait”; it only sends a message.)

#### Node: Code (Schedule Report Token)
- **Type/role:** `code` — creates a per-chat token for debounce reporting.
- **Logic:**
  - `chat_id` from Telegram Trigger
  - `report_token` = `${Date.now()}_${randomHex}`
- **Outputs:** → **ReportTokens** (Data Table upsert)
- **Failure modes:** Missing chat id (non-message update types), though trigger is message-only.

---

### 2.4 Budget Top-up Command (/add budget)

**Overview:** When user sends `/add budget ...`, the workflow parses the amount (supports k/m and Vietnamese “tr/triệu”), validates it, appends a row to a Budget sheet, and replies with confirmation/error.

**Nodes involved:**
- Code (Parse Budget Amount)
- IF (Budget ok?)
- Google Sheets → Append or update row in sheet
- Telegram → Budget Updated
- Telegram → Budget Error

#### Node: Code (Parse Budget Amount)
- **Type/role:** `code` — parses amount from command text.
- **Parsing details:**
  - Removes `/add budget` or `/add@Bot budget`
  - Removes commas
  - Extracts first number (supports decimals) then applies multipliers:
    - `k`/`grand` → ×1000
    - `m`/`mil`/`million` → ×1,000,000
    - `tr`/`triệu`/`trieu` → ×1,000,000
  - Rounds to integer
- **Output fields:**
  - `ok` boolean, `amount`, `chat_id`, `message_id`, `raw_text`
  - `formatted_amount` = localized number + currency symbol from config
- **Outputs:** → **IF (Budget ok?)**
- **Failure modes:** If user types ambiguous strings with multiple numbers, it always uses the first.

#### Node: IF (Budget ok?)
- **Type/role:** `if` — validates parsed amount.
- **Condition:** `$json.ok` is true.
- **Outputs:**
  - True → **Google Sheets → Append or update row in sheet**
  - False → **Telegram → Budget Error**

#### Node: Google Sheets → Append or update row in sheet
- **Type/role:** `googleSheets` — appends a budget top-up entry.
- **Operation:** `append` (despite node name containing “update”)
- **Sheet:** `sheet_gid_budget` (cast to Number)
- **Columns written:**
  - `ts` = `new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })`
  - `amount`, `raw_text`
- **Outputs:** → **Telegram → Budget Updated**
- **Failure modes:** Timestamp timezone is hardcoded; sheet headers must match.

#### Node: Telegram → Budget Updated
- **Type/role:** `telegram` — confirmation message.
- **Text:** `✅ Budget updated to: formatted_amount`
- **Chat/message IDs:** taken from `$('IF (Budget ok?)').item.json...`
- **Failure modes:** Node name dependency; Telegram send failures.

#### Node: Telegram → Budget Error
- **Type/role:** `telegram` — invalid command format message.
- **Text:** includes usage examples and echoes input.
- **Reply-to:** original message.

---

### 2.5 Smart Debounced Reporting (optional)

**Overview:** After each successful expense logging, the workflow stores a token per chat in an n8n Data Table, waits 30 minutes, and only sends the daily report if no newer token replaced it (meaning no newer expenses were logged). It then clears the token and reads a dashboard range from Google Sheets to compose a formatted report.

**Nodes involved:**
- ReportTokens (Data Table upsert)
- Wait
- Data table → Get row(s)
- Code - Check Latest Token
- If
- Data table → Delete row(s)
- GS - Get Daily Report Range
- Code - Build Daily Report
- TG - Send Daily Report

#### Node: ReportTokens
- **Type/role:** `dataTable` — upsert token for the chat.
- **Operation:** `upsert`
- **Data table:** `ReportTokens` (ID `QvSW24TWoTE0N3cH`)
- **Filter/match:** `chat_id == {{$json.chat_id}}`
- **Columns written:** `chat_id`, `report_token`, `updated_at` (Asia/Ho_Chi_Minh formatted)
- **Outputs:** → **Wait**
- **Failure modes:** Data Table not created; wrong DataTable ID; permission/project mismatch.

#### Node: Wait
- **Type/role:** `wait` — debounce delay.
- **Config:** 30 minutes.
- **Outputs:** → **Data table → Get row(s)**
- **Failure modes:** Workflow execution retention settings; if n8n restarts, wait resumes depending on queue/execution mode.

#### Node: Data table → Get row(s)
- **Type/role:** `dataTable` — reads token rows for the chat after wait.
- **Filter:** `chat_id == {{$node["Wait"].json.chat_id}}`
- **Outputs:** → **Code - Check Latest Token**

#### Node: Code - Check Latest Token
- **Type/role:** `code` — decides whether this execution should send report.
- **Logic:**
  - `scheduledToken` = token from the Wait execution context
  - Reads all returned rows via `$input.all()`
  - Sorts by `updatedAt/createdAt` (fallback to `id`) to find latest
  - `shouldSend = (latest.report_token === scheduledToken)`
- **Outputs:** → **If**
- **Failure modes:** If Data Table returns multiple rows unexpectedly, sorting may still select wrong one; relies on row metadata fields (`updatedAt`, `createdAt`, `id`) existing.

#### Node: If
- **Type/role:** `if` — gate report sending.
- **Condition:** `$json.shouldSend` true.
- **Outputs:**
  - True → **Data table → Delete row(s)**
  - False → stops (no report)

#### Node: Data table → Delete row(s)
- **Type/role:** `dataTable` — cleans token(s) for chat to prevent repeated reports.
- **Operation:** `deleteRows`
- **Filter:** chat_id == Wait.chat_id
- **Outputs:** → **GS - Get Daily Report Range**

#### Node: GS - Get Daily Report Range
- **Type/role:** `googleSheets` — reads dashboard summary values.
- **Range:** `D1:I2` (A1 notation), “specifyRangeA1”
- **Sheet:** `sheet_gid_dashboard`
- **Outputs:** → **Code - Build Daily Report**
- **Failure modes:** Range mismatch; sheet gid wrong; values not in expected cells.

#### Node: Code - Build Daily Report
- **Type/role:** `code` — formats a Telegram message from dashboard fields.
- **Expected input fields from sheet read:** `date`, `total_budget`, `total_spent`, `remaining`, `monthly_rate`, `note`
- **Formatting:**
  - Locale and currency symbol from config
  - Strips non-numeric chars before converting to number
  - Produces Markdown-like text with `*bold*`
- **Outputs:** → **TG - Send Daily Report**
- **Edge cases:** Telegram node here does not explicitly set parse mode; asterisks may appear literally unless Telegram parse mode defaults to Markdown in your node/version.

#### Node: TG - Send Daily Report
- **Type/role:** `telegram` — sends daily report to the chat.
- **Chat:** Telegram Trigger chat id
- **Text:** from build node
- **Failure modes:** Telegram send failures; mismatch between Markdown formatting and parse mode.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Telegram Trigger | telegramTrigger | Entry point (incoming Telegram messages) | — | CONFIG - User Settings | ## 1. Input & Routing |
| CONFIG - User Settings | set | Central configuration (Sheet IDs, locale, currency, timezone) | Telegram Trigger | Switch (Command Router) | ### ⚠️ CRITICAL SETUP REQUIRED<br>1. **Google Sheet:** You must use the Template provided in the description.<br>2. **Data Table (optional):** You must create a `ReportTokens` table in n8n for the reporting feature to work. <br>Check the Template Description for the setup guide! |
| Switch (Command Router) | switch | Route `/add budget` vs default expense flow | CONFIG - User Settings | Code (Parse Budget Amount); Google Sheets: Get Rows (Dedup lookup) | ## 1. Input & Routing |
| Code (Parse Budget Amount) | code | Extract numeric budget top-up amount from command | Switch (Command Router) | IF (Budget ok?) | ## 4. Logging & Budget Logic |
| IF (Budget ok?) | if | Validate parsed budget amount | Code (Parse Budget Amount) | Google Sheets → Append or update row in sheet; Telegram → Budget Error | ## 4. Logging & Budget Logic |
| Google Sheets → Append or update row in sheet | googleSheets | Append budget top-up row | IF (Budget ok?) | Telegram → Budget Updated | ## 4. Logging & Budget Logic |
| Telegram → Budget Updated | telegram | Confirm budget update | Google Sheets → Append or update row in sheet | — | ## 4. Logging & Budget Logic |
| Telegram → Budget Error | telegram | Inform user budget command format is invalid | IF (Budget ok?) (false) | — | ## 4. Logging & Budget Logic |
| Google Sheets: Get Rows (Dedup lookup) | googleSheets | Deduplicate by `update_id` in log sheet | Switch (Command Router) | IF (Is Duplicate?) | ## 1. Input & Routing |
| IF (Is Duplicate?) | if | Stop if update already logged | Google Sheets: Get Rows (Dedup lookup) | Code (Restore Telegram Payload) (false) | ## 1. Input & Routing |
| Code (Restore Telegram Payload) | code | Restore original Telegram JSON after Sheets lookup | IF (Is Duplicate?) | Switch (Voice/Photo/Text) | ## 1. Input & Routing |
| Switch (Voice/Photo/Text) | switch | Route to voice/photo/text processing | Code (Restore Telegram Payload) | Set (Voice Context); Set (Photo Context); Set (Text Context) | ## 1. Input & Routing |
| Set (Voice Context) | set | Build context for voice pipeline | Switch (Voice/Photo/Text) | Telegram → Get Voice File | ## 2. AI Extraction & Normalization |
| Telegram → Get Voice File | telegram | Download voice note audio binary | Set (Voice Context) | Google Gemini (Analyze Audio) | ## 2. AI Extraction & Normalization |
| Google Gemini (Analyze Audio) | googleGemini | Transcribe + extract expenses from audio | Telegram → Get Voice File | Code (Normalize Gemini Audio Output) | ## 2. AI Extraction & Normalization |
| Code (Normalize Gemini Audio Output) | code | Normalize Gemini audio output to common shape | Google Gemini (Analyze Audio) | Code (Parse Gemini JSON) | ## 2. AI Extraction & Normalization |
| Set (Photo Context) | set | Build context for photo pipeline | Switch (Voice/Photo/Text) | Code (Pick Best Photo) | ## 2. AI Extraction & Normalization |
| Code (Pick Best Photo) | code | Choose largest photo variant, extract file_id | Set (Photo Context) | Telegram → Get Image File | ## 2. AI Extraction & Normalization |
| Telegram → Get Image File | telegram | Download receipt image binary | Code (Pick Best Photo) | Google Gemini (Analyze Image) | ## 2. AI Extraction & Normalization |
| Google Gemini (Analyze Image) | googleGemini | Extract expenses from receipt image | Telegram → Get Image File | Code (Normalize Gemini Image Output) | ## 2. AI Extraction & Normalization |
| Code (Normalize Gemini Image Output) | code | Normalize Gemini image output to common shape | Google Gemini (Analyze Image) | Code (Parse Gemini JSON) | ## 2. AI Extraction & Normalization |
| Set (Text Context) | set | Build context for text pipeline | Switch (Voice/Photo/Text) | Google Gemini Chat (Text → JSON) | ## 2. AI Extraction & Normalization |
| Google Gemini Chat (Text → JSON) | googleGemini | Extract expenses from text input | Set (Text Context) | Code (Normalize Gemini Text Output) | ## 2. AI Extraction & Normalization |
| Code (Normalize Gemini Text Output) | code | Normalize Gemini text output to common shape | Google Gemini Chat (Text → JSON) | Code (Parse Gemini JSON) | ## 2. AI Extraction & Normalization |
| Code (Parse Gemini JSON) | code | Robust JSON extraction + validation + context merge | Normalize nodes (text/audio/image) | IF (Has expenses?) | ## 3. Logging & Feedback |
| IF (Has expenses?) | if | Route success vs “no expenses found” | Code (Parse Gemini JSON) | Code (Split expenses to items) + Telegram → Send Final Message; Telegram → Send Error Message and wait for response | ## 3. Logging & Feedback |
| Code (Split expenses to items) | code | Fan-out expenses array into per-row items | IF (Has expenses?) (true) | Google Sheets → Append row(s) | ## 4. Logging & Budget Logic |
| Google Sheets → Append row(s) | googleSheets | Append each expense row into log sheet | Code (Split expenses to items) | Code (Schedule Report Token) | ## 3. Logging & Feedback |
| Telegram → Send Final Message | telegram | Send summary confirmation to user | IF (Has expenses?) (true) | — | ## 3. Logging & Feedback |
| Telegram → Send Error Message and wait for response | telegram | Ask user to reformat when extraction fails | IF (Has expenses?) (false) | — | ## 3. Logging & Feedback |
| Code (Schedule Report Token) | code | Create token used for debounced reporting | Google Sheets → Append row(s) | ReportTokens | ## 5. Smart Debounced Reporting (optional) |
| ReportTokens | dataTable | Upsert per-chat report token | Code (Schedule Report Token) | Wait | ## 5. Smart Debounced Reporting (optional) |
| Wait | wait | Wait 30 minutes before sending report | ReportTokens | Data table → Get row(s) | ## 5. Smart Debounced Reporting (optional) |
| Data table → Get row(s) | dataTable | Read latest token row(s) for chat | Wait | Code - Check Latest Token | ## 5. Smart Debounced Reporting (optional) |
| Code - Check Latest Token | code | Compare scheduled token vs latest token to decide send | Data table → Get row(s) | If | ## 5. Smart Debounced Reporting (optional) |
| If | if | Gate whether to send report | Code - Check Latest Token | Data table → Delete row(s) | ## 5. Smart Debounced Reporting (optional) |
| Data table → Delete row(s) | dataTable | Cleanup token(s) then proceed | If (true) | GS - Get Daily Report Range | ## 5. Smart Debounced Reporting (optional) |
| GS - Get Daily Report Range | googleSheets | Read dashboard range D1:I2 | Data table → Delete row(s) | Code - Build Daily Report | ## 5. Smart Debounced Reporting (optional) |
| Code - Build Daily Report | code | Build formatted daily report text | GS - Get Daily Report Range | TG - Send Daily Report | ## 5. Smart Debounced Reporting (optional) |
| TG - Send Daily Report | telegram | Send daily report to Telegram chat | Code - Build Daily Report | — | ## 5. Smart Debounced Reporting (optional) |
| Sticky Note | stickyNote | Comment block | — | — | # AI Multimodal Expense Tracker<br>**Global, Multi-Currency Expense Logger via Telegram (Text, Voice, Photo).**<br><br>This workflow turns Telegram into a frictionless finance assistant using Gemini AI. It supports receipt scanning, voice logging, budget management, and smart daily reporting.<br><br>### How it works<br>1.  **Router:** Routes incoming messages (Text, Audio, Photo) to the specific Gemini AI agent.<br>2.  **AI Extraction:** Gemini analyzes the input to extract structured data (Item, Amount, Category).<br>3.  **Normalization:** Javascript logic normalizes numbers (k/m suffixes) and handles global currency formatting based on your Locale config.<br>4.  **Logging:** Data is appended to Google Sheets.<br>5.  **Smart Report:** A "debounce" logic waits for 30 minutes of inactivity before sending a daily summary to avoid spamming.<br><br>### Setup steps<br>1.  **Prerequisites:** You **MUST** copy the provided Google Sheet Template and create a "ReportTokens" Data Table in n8n (See Template Description).<br>2.  **Config:** Open the `CONFIG - User Settings` node to set your Sheet ID, Currency (USD/VND), and Locale.<br>3.  **Credentials:** Connect Telegram, Google Sheets, and Google Gemini (PaLM) accounts. |
| Sticky Note1 | stickyNote | Comment block | — | — | ## 1. Input & Routing<br>Initializes configuration, handles credentials, and routes inputs to the appropriate processing chain (Command, Voice, Photo, or Text). |
| Sticky Note2 | stickyNote | Comment block | — | — | ## 2. AI Extraction & Normalization<br>Gemini AI analyzes multimodal inputs to extract structured JSON. Code nodes normalize currency formats and parse the AI response. |
| Sticky Note3 | stickyNote | Comment block | — | — | ## 5. Smart Debounced Reporting (optional)<br>Uses n8n Data Table to wait for 30 minutes of inactivity before generating and sending a daily financial summary. |
| Sticky Note4 | stickyNote | Comment block | — | — | ## 4. Logging & Budget Logic<br>Splits multiple items into separate rows, handles "/add budget" commands, and writes clean data to Google Sheets. |
| Sticky Note5 | stickyNote | Comment block | — | — | ### ⚠️ CRITICAL SETUP REQUIRED<br>1. **Google Sheet:** You must use the Template provided in the description.<br>2. **Data Table (optional):** You must create a `ReportTokens` table in n8n for the reporting feature to work. <br>Check the Template Description for the setup guide! |
| Sticky Note6 | stickyNote | Comment block | — | — | ## 3. Logging & Feedback<br>Validates AI output, splits multiple items, logs to Google Sheets, and sends success/error feedback to Telegram. |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n.
2. **Add credentials**
   1. **Telegram API** credential for your bot token.
   2. **Google Sheets OAuth2** credential with access to the target spreadsheet.
   3. **Google Gemini / PaLM** credential (as required by `@n8n/n8n-nodes-langchain.googleGemini`).
3. **Prepare external resources**
   1. Copy the Google Sheets template referenced by your project description and ensure it contains:
      - A **Log** sheet with headers: `Date, Item, Amount, Category, Currency, Raw_Input, Update_ID, Message_ID, Payment_Method`
      - A **Budget Topups** sheet with headers: `ts, amount, raw_text`
      - A **Dashboard** sheet where `D1:I2` contains the fields expected by the report builder (date, totals, etc.).
   2. (Optional reporting) Create an n8n **Data Table** named `ReportTokens` with columns:
      - `chat_id` (string)
      - `report_token` (string)
      - `updated_at` (string)
4. **Add nodes and configure in this order (with connections):**
   1. **Telegram Trigger** (`telegramTrigger`)
      - Updates: `message`
      - Credential: Telegram
      - Connect to **CONFIG - User Settings**
   2. **CONFIG - User Settings** (`set`)
      - Add fields: `spreadsheet_id, sheet_gid_log, sheet_gid_dashboard, sheet_gid_budget, currency_code, currency_symbol, locale, timezone`
      - Fill in real values (IDs/timezone)
      - Connect to **Switch (Command Router)**
   3. **Switch (Command Router)** (`switch`)
      - Rule 1 output `AddBudget`: boolean expression regex match on message.text: `^/add(@\w+)?\s+budget\b`
      - Rule 2 output `Default`: negation of above
      - Connect AddBudget → **Code (Parse Budget Amount)**
      - Connect Default → **Google Sheets: Get Rows (Dedup lookup)**
   4. **Budget branch**
      1. **Code (Parse Budget Amount)** (`code`) — paste parsing script from workflow
      2. **IF (Budget ok?)** (`if`) — condition `$json.ok` is true
      3. **Google Sheets → Append or update row in sheet** (`googleSheets`)
         - Operation: append
         - Document: `spreadsheet_id`
         - Sheet: `sheet_gid_budget` (ensure correct sheet reference format)
         - Map `ts, amount, raw_text`
      4. **Telegram → Budget Updated** (`telegram`) — send confirmation, reply-to message_id
      5. **Telegram → Budget Error** (`telegram`) — send usage instructions
   5. **Default expense branch (dedup + modality routing)**
      1. **Google Sheets: Get Rows (Dedup lookup)** (`googleSheets`)
         - Operation: get rows
         - Filter: `Update_ID = {{$json.update_id}}`
         - Sheet: `sheet_gid_log`
      2. **IF (Is Duplicate?)** (`if`)
         - Condition: `$json.Message_ID` “not empty”
         - False branch → **Code (Restore Telegram Payload)**
      3. **Code (Restore Telegram Payload)** (`code`)
         - Return Telegram Trigger JSON
      4. **Switch (Voice/Photo/Text)** (`switch`)
         - Voice when `message.voice` not empty
         - Photo when `message.photo` not empty
         - Text when `message.text` not empty
   6. **Text processing chain**
      1. **Set (Text Context)** (`set`) — set `raw_input, message_id, chat_id, source_type=text, now, update_id`
      2. **Google Gemini Chat (Text → JSON)** (`googleGemini`)
         - Model: `gemini-2.5-flash`
         - Provide prompt and user message as in workflow
      3. **Code (Normalize Gemini Text Output)** (`code`) — standardize to `content.parts[0].text` and attach context
      4. Connect to **Code (Parse Gemini JSON)** (shared)
   7. **Voice processing chain**
      1. **Set (Voice Context)** (`set`) — includes `file_id = message.voice.file_id`
      2. **Telegram → Get Voice File** (`telegram`) — resource file, mime `audio/ogg`
      3. **Google Gemini (Analyze Audio)** (`googleGemini`) — resource audio analyze, binary input, prompt as in workflow
      4. **Code (Normalize Gemini Audio Output)** (`code`)
      5. Connect to **Code (Parse Gemini JSON)**
   8. **Photo processing chain**
      1. **Set (Photo Context)** (`set`) — includeOtherFields = true; set caption/raw_input
      2. **Code (Pick Best Photo)** (`code`) — choose largest `message.photo[]`
      3. **Telegram → Get Image File** (`telegram`) — resource file, mime `image/jpeg`
      4. **Google Gemini (Analyze Image)** (`googleGemini`) — resource image analyze, binary input, prompt as in workflow
      5. **Code (Normalize Gemini Image Output)** (`code`)
      6. Connect to **Code (Parse Gemini JSON)**
   9. **Shared parse + validate + log + feedback**
      1. **Code (Parse Gemini JSON)** (`code`) — robust JSON extraction and context merge
      2. **IF (Has expenses?)** (`if`) — condition `(expenses.length > 0)`
         - True branch → **Code (Split expenses to items)** and **Telegram → Send Final Message**
         - False branch → **Telegram → Send Error Message and wait for response**
      3. **Code (Split expenses to items)** (`code`) — fan-out expenses array, defaults, timezone formatting
      4. **Google Sheets → Append row(s)** (`googleSheets`)
         - Operation: append
         - Sheet: `sheet_gid_log`
         - Map required columns
      5. **Telegram → Send Final Message** (`telegram`) — send `summary_text`
      6. **Telegram → Send Error Message and wait for response** (`telegram`) — send retry format hint
5. **Optional: Debounced daily reporting**
   1. After **Google Sheets → Append row(s)** connect to **Code (Schedule Report Token)** (`code`)
   2. **ReportTokens** (`dataTable`)
      - Operation: upsert
      - Filter: `chat_id` equals current chat_id
      - Write `chat_id, report_token, updated_at`
   3. **Wait** (`wait`) — 30 minutes
   4. **Data table → Get row(s)** (`dataTable`) — get by `chat_id`
   5. **Code - Check Latest Token** (`code`) — compute `shouldSend`
   6. **If** (`if`) — only proceed if `shouldSend`
   7. **Data table → Delete row(s)** (`dataTable`) — delete by `chat_id`
   8. **GS - Get Daily Report Range** (`googleSheets`) — read `D1:I2` from dashboard sheet
   9. **Code - Build Daily Report** (`code`) — format text using locale/symbol
   10. **TG - Send Daily Report** (`telegram`) — send to chat

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques. | Disclaimer provided by user |
| “You MUST copy the provided Google Sheet Template and create a `ReportTokens` Data Table in n8n (See Template Description).” | From workflow sticky notes (critical setup prerequisite) |
| Debounce reporting logic waits 30 minutes of inactivity to avoid spamming. | From workflow sticky notes |

