AI-powered productivity coach using Google Calendar, Todoist, Slack and Sheets

https://n8nworkflows.xyz/workflows/ai-powered-productivity-coach-using-google-calendar--todoist--slack-and-sheets-12018


# AI-powered productivity coach using Google Calendar, Todoist, Slack and Sheets

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:**  
This workflow acts as an AI-powered productivity coach. Every weekday morning it collects signals from **Google Calendar** (meetings), **Todoist** (tasks), and **Slack** (message activity), aggregates them into a daily snapshot, uses **OpenAI** to generate insights and summaries, logs key metrics to **Google Sheets**, and posts a daily summary to Slack. On **Fridays**, it additionally generates a weekly report from historical metrics.

**Target use cases:**
- Personal productivity tracking (meetings load, task backlog, chat distraction)
- Daily “morning briefing” in Slack
- Weekly review/retrospective for trends

### Logical Blocks
**1.1 Trigger & Date Normalization**  
Runs on weekdays at 08:00 and produces the current date in `yyyy-MM-dd`.

**1.2 Data Collection (Calendar, Todoist, Slack)**  
Fetches today’s calendar events, Todoist tasks due today/overdue, and Slack messages.

**1.3 Aggregation & AI Insight Generation**  
Consolidates all data into a structured object, then calls OpenAI to create analysis.

**1.4 Daily Metrics Logging & Slack Daily Summary**  
Appends key metrics into Google Sheets, generates a daily narrative summary via OpenAI, and sends it to Slack.

**1.5 Weekly Strategic Review (Friday only)**  
If the day is Friday, fetches historical rows from Sheets, computes weekly stats, generates an AI weekly report, and posts to Slack.

---

## 2. Block-by-Block Analysis

### 2.1 Trigger & Date Normalization
**Overview:** Triggers the workflow on weekdays at 08:00 and formats the date to drive “today” filters for downstream APIs.

**Nodes involved:**  
- Schedule Daily Execution  
- Get Current Date  

#### Node: Schedule Daily Execution
- **Type / Role:** Schedule Trigger (`n8n-nodes-base.scheduleTrigger`) — entry point.
- **Config:** Cron `0 8 * * 1-5` (08:00, Monday–Friday).
- **Outputs:** Emits an item containing a `timestamp` (used by next node).
- **Connections:** → Get Current Date
- **Edge cases / failures:**
  - Instance timezone vs intended timezone: cron execution uses n8n instance timezone; could shift “day” boundaries for Calendar/Slack/Todoist queries.

#### Node: Get Current Date
- **Type / Role:** Date & Time (`n8n-nodes-base.dateTime`) — normalizes date.
- **Config choices:**
  - Operation: **formatDate**
  - Input date: `={{ $json.timestamp }}`
  - Format: `yyyy-MM-dd`
  - Output field: `dateFormatted`
- **Output:** Same item with `dateFormatted` (e.g., `2026-01-07`).
- **Connections:** → Fetch Calendar Events
- **Edge cases / failures:**
  - If `timestamp` is missing/unexpected (rare with schedule trigger), expression evaluation fails.

---

### 2.2 Data Collection (Calendar, Todoist, Slack)
**Overview:** Collects today’s meetings, tasks, and Slack messages to create a behavioral snapshot.

**Nodes involved:**  
- Fetch Calendar Events  
- Fetch Todoist Tasks  
- Fetch Slack Messages  

#### Node: Fetch Calendar Events
- **Type / Role:** Google Calendar (`n8n-nodes-base.googleCalendar`) — pulls events for today.
- **Config choices:**
  - Operation: **getAll**
  - Calendar: `primary`
  - Time window:
    - `timeMin`: `={{ $json.dateFormatted }}T00:00:00Z`
    - `timeMax`: `={{ $json.dateFormatted }}T23:59:59Z`
  - Return all: true
- **Input:** Item containing `dateFormatted`.
- **Output:** Calendar response (commonly under `items`).
- **Connections:** → Fetch Todoist Tasks
- **Edge cases / failures:**
  - **Timezone mismatch:** uses `Z` (UTC). If your “day” is local time, events near midnight may be misattributed.
  - Google OAuth token expiration / insufficient scopes.
  - API pagination/limits (though `returnAll` handles pagination at the node level).

#### Node: Fetch Todoist Tasks
- **Type / Role:** HTTP Request (`n8n-nodes-base.httpRequest`) — calls Todoist REST API.
- **Config choices:**
  - URL: `https://api.todoist.com/rest/v2/tasks`
  - Authentication: **predefinedCredentialType** (`todoistApi`)
  - Query parameter: `filter = today | overdue`
  - sendQuery: true
- **Output:** Array of tasks (as returned by Todoist).
- **Connections:** → Fetch Slack Messages
- **Edge cases / failures:**
  - Credential misconfiguration (invalid token).
  - Todoist filter syntax or API changes.
  - Large task lists could affect execution time.

#### Node: Fetch Slack Messages
- **Type / Role:** Slack (`n8n-nodes-base.slack`) — retrieves messages.
- **Config choices:**
  - Operation: **getAll**
  - (No channel/user/time filters shown in parameters)
- **Output:** Expected to contain `messages` array (used later).
- **Connections:** → Aggregate Data
- **Edge cases / failures:**
  - Without specifying channel/conversation and time range, results may be unexpected or empty depending on Slack node defaults and permissions.
  - Slack rate limits, missing scopes (e.g., `channels:history`, `groups:history`, `im:history` depending on target).
  - Message timestamps: Slack `ts` is usually a string like `"1700000000.12345"`, not a pure number—this matters later in aggregation.

---

### 2.3 Aggregation & AI Insight Generation
**Overview:** Merges all collected data into a single structured payload and sends it to OpenAI for productivity insights.

**Nodes involved:**  
- Aggregate Data  
- AI Analysis - Productivity Insights  

#### Node: Aggregate Data
- **Type / Role:** Code (`n8n-nodes-base.code`) — transforms and aggregates multi-source input.
- **Config choices (interpreted):**
  - Pulls the date from the first input item and other sources via `$input.item(n)`:
    - `dateInfo = items[0].json`
    - `calendarEvents = $input.item(1).json.items || []`
    - `tasks = $input.item(2).json || []`
    - `slackMessages = $input.item(3).json.messages || []`
  - Classifies meetings as “today” by comparing `toDateString()` between event start and `dateFormatted`.
  - Splits tasks by `priority >= 3` into high/normal.
  - Builds `slackByHour` histogram from `msg.ts * 1000` and `getHours()`.
  - Returns a single object containing:
    - `date`, `weekday`
    - `meetingsToday`, `meetingsTomorrow` (empty placeholder)
    - `tasks.highPriority`, `tasks.normal`
    - `slackUsage.totalMessages`, `slackUsage.byHour`
- **Inputs / connections:** Receives from Fetch Slack Messages (but reads multiple inputs by index).
- **Outputs / connections:** → AI Analysis - Productivity Insights
- **Important implementation note:**  
  This code assumes **4 parallel input items** exist (date + calendar + todoist + slack) and are accessible via `$input.item(1..3)`. However, the workflow is connected **linearly** (Calendar → Todoist → Slack → Code). In a linear chain, the Code node typically receives only the immediate previous node’s items, not a merged multi-branch set. As written, `$input.item(1)` etc. is likely to be **undefined** and cause failures or empty arrays.
- **Edge cases / failures:**
  - **Input indexing mismatch** (most likely issue): `$input.item(1)` may not exist.
  - Slack `ts` type: often a string; `msg.ts * 1000` can become `NaN`. Prefer `parseFloat(msg.ts) * 1000`.
  - Calendar all-day events use `start.date` (handled), but timezone comparisons may still be off.
  - Meeting duration is not calculated; later “meetingHours” uses `count * 0.5`, which is an approximation.

#### Node: AI Analysis - Productivity Insights
- **Type / Role:** OpenAI (`n8n-nodes-base.openAi`) — produces AI insights based on aggregated data.
- **Config choices:**
  - Resource: **chat**
  - Operation: **message**
  - No prompt/system/user message configured in JSON excerpt (only `requestOptions` shown).
- **Inputs:** Output of Aggregate Data.
- **Outputs / connections:** → Log Daily Metrics
- **Edge cases / failures:**
  - Missing OpenAI credentials or model configuration.
  - If no prompt/messages are configured, the node may fail validation or produce no meaningful output depending on n8n node defaults.
  - Token limits if you later include full meeting/task/message content.

---

### 2.4 Daily Metrics Logging & Slack Daily Summary
**Overview:** Stores numeric metrics in Google Sheets, generates a daily narrative summary via OpenAI, then posts it to Slack.

**Nodes involved:**  
- Log Daily Metrics  
- Generate Daily Summary  
- Send Daily Summary to Slack  

#### Node: Log Daily Metrics
- **Type / Role:** Google Sheets (`n8n-nodes-base.googleSheets`) — append daily row.
- **Config choices:**
  - Operation: **append**
  - Sheet name: `Sheet1`
  - Document ID: **blank in workflow JSON** (must be set)
  - Mapping mode: defineBelow with columns:
    - `date = {{ $json.date }}`
    - `tasksCount = {{ $json.tasks.highPriority.length + $json.tasks.normal.length }}`
    - `meetingHours = {{ $json.meetingsToday.length * 0.5 }}`
    - `slackMessages = {{ $json.slackUsage.totalMessages }}`
- **Inputs:** Comes from AI Analysis - Productivity Insights, but its expressions expect the **aggregated metrics object** (date/tasks/meetings/slackUsage). If the OpenAI node changes the JSON structure, these fields may not exist.
- **Outputs / connections:** → Generate Daily Summary
- **Edge cases / failures:**
  - Missing/incorrect Google Sheets document ID or permissions.
  - Column headers must exist or mapping will not append as intended.
  - Potential data-shape mismatch due to upstream OpenAI node output (see note above).

#### Node: Generate Daily Summary
- **Type / Role:** OpenAI chat message — creates human-readable daily summary.
- **Config choices:** Resource chat / operation message; prompt/messages not shown (likely incomplete).
- **Outputs:** Expected `choices[0].message.content` (used by Slack node).
- **Connections:** → Send Daily Summary to Slack
- **Edge cases / failures:**
  - Same as other OpenAI node (credentials, prompt missing, rate limits).
  - Output shape differences if OpenAI node version changes (though `choices[0]...` is typical for OpenAI-style responses).

#### Node: Send Daily Summary to Slack
- **Type / Role:** Slack (`n8n-nodes-base.slack`) — posts daily summary.
- **Config choices:**
  - Text:
    ```
    📊 **Daily Productivity Summary** - {{ $node['Aggregate Data'].json.date }}

    {{ $json.choices[0].message.content }}
    ```
- **Inputs:** From Generate Daily Summary (for `$json.choices...`), and references Aggregate Data node for date.
- **Outputs / connections:** → Check if Friday
- **Edge cases / failures:**
  - Slack credentials/scopes or missing channel configuration (not shown).
  - If Aggregate Data didn’t run or has different structure, date reference may be empty.

---

### 2.5 Weekly Strategic Review (Friday only)
**Overview:** If it is Friday, fetches logged metrics (intended: last 7 days), computes weekly aggregates, gets an AI narrative report, and posts it to Slack tagging the channel.

**Nodes involved:**  
- Check if Friday  
- Fetch Last 7 Days Data  
- Calculate Weekly Stats  
- Generate Weekly Report  
- Send Weekly Report to Slack  

#### Node: Check if Friday
- **Type / Role:** IF (`n8n-nodes-base.if`) — conditional branching.
- **Config choices:**
  - Condition: `weekday == 5`
  - Left value: `={{ $json.weekday }}`
- **Input:** Comes from Send Daily Summary to Slack. That node does not output `weekday` unless it forwards upstream data; typically it outputs Slack API response. This likely breaks the Friday check.
- **Connections:** True branch → Fetch Last 7 Days Data (no false branch wired).
- **Edge cases / failures:**
  - **Data provenance issue:** `weekday` is created in Aggregate Data, but the IF node receives data after multiple nodes that may overwrite the item JSON.
  - If IF always evaluates false or errors, weekly report never runs.

#### Node: Fetch Last 7 Days Data
- **Type / Role:** Google Sheets getAll — retrieves rows for weekly calculation.
- **Config choices:**
  - Operation: **getAll**
  - Document ID: **blank in workflow JSON** (must be set)
  - No sheet name specified (will use node default or first sheet depending on n8n behavior)
  - No filter/limit to “last 7 days” configured (despite the node name)
- **Output:** All rows as items.
- **Connections:** → Calculate Weekly Stats
- **Edge cases / failures:**
  - Fetching the entire sheet can grow unbounded and slow down; should filter last 7 rows/dates.
  - Missing documentId or wrong sheet selection.

#### Node: Calculate Weekly Stats
- **Type / Role:** Code — computes weekly aggregates.
- **Config choices (interpreted):**
  - Treats `items` as the week’s rows.
  - Computes totals and averages for:
    - `meetingHours` (parsed as float)
    - `slackMessages`
    - `tasksCount`
  - Builds:
    - `weekRange = firstRow.date - lastRow.date`
    - `dailyMetrics = weeklyData.map(d => d.json)`
    - `weeklySummary` fields with fixed decimals
- **Connections:** → Generate Weekly Report
- **Edge cases / failures:**
  - If sheet rows are not sorted chronologically, `weekRange` may be incorrect.
  - If items include headers/empty rows, numeric parsing may yield `NaN`.
  - If fewer than 1 row, indexing `[0]` / `[length-1]` fails.

#### Node: Generate Weekly Report
- **Type / Role:** OpenAI chat message — produces narrative weekly report.
- **Config choices:** Resource chat / operation message; prompt not shown.
- **Connections:** → Send Weekly Report to Slack
- **Edge cases / failures:** Same OpenAI risks (missing prompt/credentials, token limits).

#### Node: Send Weekly Report to Slack
- **Type / Role:** Slack — posts weekly report and tags channel.
- **Config choices:**
  - Text:
    ```
    📈 **Weekly Productivity Report** - {{ $node['Calculate Weekly Stats'].json.weekRange }}

    {{ $json.choices[0].message.content }}

    @channel
    ```
- **Connections:** End.
- **Edge cases / failures:**
  - Slack channel posting permissions.
  - If AI output missing `choices[0]...`, message will be blank.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Schedule Daily Execution | Schedule Trigger | Weekday 08:00 entry point | — | Get Current Date | ## 1. Trigger & Data Collection<br>Runs every weekday at 8 AM. <br>Fetches data from Calendar, Todoist, and Slack to build a productivity snapshot. |
| Get Current Date | Date & Time | Format timestamp to `yyyy-MM-dd` | Schedule Daily Execution | Fetch Calendar Events | ## 1. Trigger & Data Collection<br>Runs every weekday at 8 AM. <br>Fetches data from Calendar, Todoist, and Slack to build a productivity snapshot. |
| Fetch Calendar Events | Google Calendar | Pull today’s events | Get Current Date | Fetch Todoist Tasks | ## 1. Trigger & Data Collection<br>Runs every weekday at 8 AM. <br>Fetches data from Calendar, Todoist, and Slack to build a productivity snapshot. |
| Fetch Todoist Tasks | HTTP Request | Pull today/overdue tasks from Todoist | Fetch Calendar Events | Fetch Slack Messages | ## 1. Trigger & Data Collection<br>Runs every weekday at 8 AM. <br>Fetches data from Calendar, Todoist, and Slack to build a productivity snapshot. |
| Fetch Slack Messages | Slack | Retrieve Slack messages | Fetch Todoist Tasks | Aggregate Data | ## 1. Trigger & Data Collection<br>Runs every weekday at 8 AM. <br>Fetches data from Calendar, Todoist, and Slack to build a productivity snapshot. |
| Aggregate Data | Code | Merge sources; compute metrics | Fetch Slack Messages | AI Analysis - Productivity Insights | ## 2. Aggregation & AI Analysis<br>Consolidates data points and uses OpenAI to analyze patterns and generate actionable insights. |
| AI Analysis - Productivity Insights | OpenAI | Generate AI insight text (intended) | Aggregate Data | Log Daily Metrics | ## 2. Aggregation & AI Analysis<br>Consolidates data points and uses OpenAI to analyze patterns and generate actionable insights. |
| Log Daily Metrics | Google Sheets | Append daily numeric metrics | AI Analysis - Productivity Insights | Generate Daily Summary | ## 3. Daily Logging & Reporting<br>Saves metrics to Google Sheets for historical tracking and sends today's summary to Slack. |
| Generate Daily Summary | OpenAI | Generate daily narrative summary | Log Daily Metrics | Send Daily Summary to Slack | ## 3. Daily Logging & Reporting<br>Saves metrics to Google Sheets for historical tracking and sends today's summary to Slack. |
| Send Daily Summary to Slack | Slack | Post daily summary to Slack | Generate Daily Summary | Check if Friday | ## 3. Daily Logging & Reporting<br>Saves metrics to Google Sheets for historical tracking and sends today's summary to Slack. |
| Check if Friday | IF | Gate weekly flow on Fridays | Send Daily Summary to Slack | Fetch Last 7 Days Data | ## 4. Weekly Strategic Review<br>Checks if it's Friday. If so, fetches the last 7 days of data to generate a broader weekly report. |
| Fetch Last 7 Days Data | Google Sheets | Retrieve historical metrics (currently unfiltered) | Check if Friday | Calculate Weekly Stats | ## 4. Weekly Strategic Review<br>Checks if it's Friday. If so, fetches the last 7 days of data to generate a broader weekly report. |
| Calculate Weekly Stats | Code | Compute weekly totals/averages | Fetch Last 7 Days Data | Generate Weekly Report | ## 4. Weekly Strategic Review<br>Checks if it's Friday. If so, fetches the last 7 days of data to generate a broader weekly report. |
| Generate Weekly Report | OpenAI | Generate weekly narrative report | Calculate Weekly Stats | Send Weekly Report to Slack | ## 4. Weekly Strategic Review<br>Checks if it's Friday. If so, fetches the last 7 days of data to generate a broader weekly report. |
| Send Weekly Report to Slack | Slack | Post weekly report to Slack | Generate Weekly Report | — | ## 4. Weekly Strategic Review<br>Checks if it's Friday. If so, fetches the last 7 days of data to generate a broader weekly report. |
| Main Description | Sticky Note | Documentation / requirements | — | — | ## 🤖 Productivity Analyst AI<br>This workflow acts as a productivity coach, tracking your work habits and using AI to provide daily and weekly insights.<br><br>### ⚙️ How it works<br>1. **Collects Data**: Fetches meetings (Google Calendar), tasks (Todoist), and chat activity (Slack).<br>2. **AI Analysis**: Analyzes time usage to find focus blocks and overload risks.<br>3. **Daily Report**: Sends a morning briefing to Slack with specific advice.<br>4. **Weekly Review**: On Fridays, generates a comprehensive strategic review based on historical data.<br><br>### 📝 Requirements<br>- **Services**: Google Calendar, Todoist, Slack, Google Sheets<br>- **AI**: OpenAI API Key (GPT-4 recommended)<br><br>### 🛠 Setup<br>1. Configure credentials for all services in n8n.<br>2. Set up a **Google Sheet** with columns: `date`, `meetingHours`, `tasksCount`, `slackMessages`.<br>3. Update the **Sheet ID** in the "Log Daily Metrics" and "Fetch Last 7 Days Data" nodes.<br>4. Activate the workflow. |
| Step 1 | Sticky Note | Section header | — | — | ## 1. Trigger & Data Collection<br>Runs every weekday at 8 AM. <br>Fetches data from Calendar, Todoist, and Slack to build a productivity snapshot. |
| Step 2 | Sticky Note | Section header | — | — | ## 2. Aggregation & AI Analysis<br>Consolidates data points and uses OpenAI to analyze patterns and generate actionable insights. |
| Step 3 | Sticky Note | Section header | — | — | ## 3. Daily Logging & Reporting<br>Saves metrics to Google Sheets for historical tracking and sends today's summary to Slack. |
| Step 4 | Sticky Note | Section header | — | — | ## 4. Weekly Strategic Review<br>Checks if it's Friday. If so, fetches the last 7 days of data to generate a broader weekly report. |

---

## 4. Reproducing the Workflow from Scratch

1) **Create “Schedule Daily Execution” (Schedule Trigger)**
- Add node: *Schedule Trigger*
- Configure cron: `0 8 * * 1-5`
- Ensure instance timezone matches your expectation.

2) **Create “Get Current Date” (Date & Time)**
- Operation: *Format Date*
- Date: `{{$json.timestamp}}`
- Format: `yyyy-MM-dd`
- Output field: `dateFormatted`
- Connect: Schedule Daily Execution → Get Current Date

3) **Create “Fetch Calendar Events” (Google Calendar)**
- Credential: Google OAuth2 with Calendar access
- Operation: *Get All*
- Calendar: `primary`
- Options:
  - timeMin: `{{$json.dateFormatted}}T00:00:00Z`
  - timeMax: `{{$json.dateFormatted}}T23:59:59Z`
- Return all: enabled
- Connect: Get Current Date → Fetch Calendar Events

4) **Create “Fetch Todoist Tasks” (HTTP Request)**
- Credential: Todoist API token (predefined credential type in n8n)
- Method: GET
- URL: `https://api.todoist.com/rest/v2/tasks`
- Send Query Parameters: enabled
- Add query parameter: `filter` = `today | overdue`
- Connect: Fetch Calendar Events → Fetch Todoist Tasks

5) **Create “Fetch Slack Messages” (Slack)**
- Credential: Slack OAuth2 (ensure proper scopes for reading history)
- Operation: *Get All*
- (Strongly recommended) Configure which channel/conversation and time range you want.
- Connect: Fetch Todoist Tasks → Fetch Slack Messages

6) **Create “Aggregate Data” (Code)**
- Add node: *Code*
- Paste the aggregation logic.
- **Important:** To make the current code work, you should redesign the flow to truly provide multiple inputs (Calendar + Todoist + Slack + Date) into this Code node using a merge pattern:
  - Either add **Merge** nodes (by position) to combine branches, or
  - Keep a single item and attach data to it at each step (e.g., store calendar under `json.calendar`, tasks under `json.tasks`, etc.), and update the code accordingly.
- Connect: Fetch Slack Messages → Aggregate Data

7) **Create “AI Analysis - Productivity Insights” (OpenAI)**
- Credential: OpenAI API key
- Resource: Chat, Operation: Message
- Configure model (e.g., GPT-4 class model) and provide a prompt that uses the aggregated JSON (for example: “Given this JSON, identify risks and propose 3 actions…”).
- Connect: Aggregate Data → AI Analysis - Productivity Insights

8) **Create Google Sheet for logging**
- In Google Sheets, create headers: `date`, `meetingHours`, `tasksCount`, `slackMessages`
- Note the Spreadsheet ID.

9) **Create “Log Daily Metrics” (Google Sheets)**
- Credential: Google Sheets OAuth2
- Operation: Append
- Document ID: set your spreadsheet ID
- Sheet name: `Sheet1` (or your sheet)
- Map fields:
  - date: `{{$json.date}}`
  - tasksCount: `{{$json.tasks.highPriority.length + $json.tasks.normal.length}}`
  - meetingHours: `{{$json.meetingsToday.length * 0.5}}`
  - slackMessages: `{{$json.slackUsage.totalMessages}}`
- Connect: AI Analysis - Productivity Insights → Log Daily Metrics

10) **Create “Generate Daily Summary” (OpenAI)**
- Resource: Chat, Operation: Message
- Provide a prompt that summarizes the day (and optionally incorporates AI analysis output).
- Connect: Log Daily Metrics → Generate Daily Summary

11) **Create “Send Daily Summary to Slack” (Slack)**
- Operation: Post message (or the Slack node equivalent)
- Text:
  - Title + date from Aggregate Data: `{{$node["Aggregate Data"].json.date}}`
  - Body from OpenAI: `{{$json.choices[0].message.content}}`
- Configure target channel.
- Connect: Generate Daily Summary → Send Daily Summary to Slack

12) **Create “Check if Friday” (IF)**
- Condition: number equals
- Left: `{{$json.weekday}}`
- Right: `5`
- Connect: Send Daily Summary to Slack → Check if Friday
- **Recommended fix:** Ensure the incoming item still contains `weekday` (e.g., pass-through data, or reference `{{$node["Aggregate Data"].json.weekday}}` instead).

13) **Create “Fetch Last 7 Days Data” (Google Sheets)**
- Operation: Get All
- Document ID: same spreadsheet ID
- (Recommended) Add filtering/limiting to only last 7 days (by date or last 7 rows) to match the node name.
- Connect (IF true): Check if Friday → Fetch Last 7 Days Data

14) **Create “Calculate Weekly Stats” (Code)**
- Paste weekly aggregation code.
- Connect: Fetch Last 7 Days Data → Calculate Weekly Stats

15) **Create “Generate Weekly Report” (OpenAI)**
- Resource: Chat, Operation: Message
- Prompt should reference `weeklySummary` and `dailyMetrics`.
- Connect: Calculate Weekly Stats → Generate Weekly Report

16) **Create “Send Weekly Report to Slack” (Slack)**
- Text includes:
  - Week range: `{{$node["Calculate Weekly Stats"].json.weekRange}}`
  - AI content: `{{$json.choices[0].message.content}}`
  - `@channel`
- Connect: Generate Weekly Report → Send Weekly Report to Slack

17) **Add sticky notes (optional)**
- Add sticky notes with the provided section texts to document the canvas.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Productivity Analyst AI” description, requirements, and setup steps (Google Calendar, Todoist, Slack, Google Sheets; OpenAI GPT-4 recommended; create sheet columns; set Sheet ID; activate workflow). | From sticky note “Main Description”. |
| Block labels and explanations for Steps 1–4 (Trigger/Data collection, Aggregation/AI, Daily logging/reporting, Weekly review). | From sticky notes “Step 1–Step 4”. |

