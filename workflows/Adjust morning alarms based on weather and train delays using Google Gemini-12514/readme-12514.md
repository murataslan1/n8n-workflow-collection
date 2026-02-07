Adjust morning alarms based on weather and train delays using Google Gemini

https://n8nworkflows.xyz/workflows/adjust-morning-alarms-based-on-weather-and-train-delays-using-google-gemini-12514


# Adjust morning alarms based on weather and train delays using Google Gemini

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:** This workflow runs every morning at **5:00 AM** to check **local weather** and **train-delay news**, asks **Google Gemini** to decide whether the situation is **EMERGENCY** or **NORMAL**, then sends an email either **immediately** (emergency) or **after a 90-minute wait** (normal). An optional (disabled) SwitchBot call can also trigger smart-home actions in emergencies.

**Target use cases:**
- Commuters who need earlier warnings when **heavy rain/storm/snow** or **train delays/suspensions** occur.
- Users who want a daily, automated “morning briefing” email.

### Logical blocks
1. **1.1 Scheduled Trigger & Configuration**
2. **1.2 Data Collection (Weather + Train News)**
3. **1.3 AI Decision & Output Normalization (Gemini + Parse)**
4. **1.4 Routing & Notifications (Emergency vs Normal)**

---

## 2. Block-by-Block Analysis

### 2.1 Scheduled Trigger & Configuration

**Overview:** Starts the workflow daily at 5:00 AM and sets the core runtime variables (location, train line, email, OpenWeather key).

**Nodes involved:**
- **Wake Up Check (5:00 AM)** (Schedule Trigger)
- **Configuration** (Set)

#### Node: Wake Up Check (5:00 AM)
- **Type / role:** `Schedule Trigger` — entry point; triggers executions.
- **Configuration choices:** Runs on an interval rule at **triggerAtHour = 5** (daily at 05:00).
- **Inputs / outputs:** No input. Output flows to **Configuration**.
- **Version notes:** typeVersion **1.2**.
- **Potential failures / edge cases:**
  - Server timezone vs user expectation (5:00 AM is evaluated in the n8n instance timezone unless otherwise configured).
  - If n8n is stopped at trigger time, the execution won’t run.

#### Node: Configuration
- **Type / role:** `Set` — defines parameters used across nodes.
- **Configuration choices (interpreted):**
  - Adds (and keeps other fields) the following fields:
    - `location`: `"Tokyo,JP"`
    - `trainLine`: `"Yamanote Line"`
    - `userEmail`: `"user@example.com"`
    - `openWeatherApiKey`: `"placeholder_api_key"` (must be replaced)
- **Key expressions / variables:** Downstream nodes reference these via `$json.location`, `$json.openWeatherApiKey`, and `$('Configuration').first().json.userEmail`.
- **Inputs / outputs:** Input from trigger; outputs to both **Get Weather** and **Get Train News (RSS)**.
- **Version notes:** typeVersion **3.4**.
- **Potential failures / edge cases:**
  - If `openWeatherApiKey` is not valid, weather calls will fail.
  - If `userEmail` is invalid, Gmail node may error or silently bounce later.

---

### 2.2 Data Collection (Weather + Train News)

**Overview:** Fetches current weather from OpenWeatherMap and gathers train-delay headlines via Google News RSS for the configured train line.

**Nodes involved:**
- **Get Weather** (HTTP Request)
- **Get Train News (RSS)** (RSS Feed Read)

#### Node: Get Weather
- **Type / role:** `HTTP Request` — calls OpenWeatherMap current weather endpoint.
- **Configuration choices (interpreted):**
  - `GET https://api.openweathermap.org/data/2.5/weather`
  - Query parameters:
    - `q = {{$json.location}}`
    - `appid = {{$json.openWeatherApiKey}}`
    - `units = metric`
    - `lang = en`
- **Key expressions / variables:** Uses values created in **Configuration**.
- **Inputs / outputs:** Input from **Configuration**; output goes to **Gemini: Judge & Draft**.
- **Version notes:** typeVersion **4.3**.
- **Potential failures / edge cases:**
  - 401/403 if API key invalid.
  - 404/400 if location format not recognized.
  - Network timeouts/rate limits.
  - Output schema assumptions downstream: Gemini prompt expects `weather[0].description` and `main.temp`.

#### Node: Get Train News (RSS)
- **Type / role:** `RSS Feed Read` — reads Google News RSS results.
- **Configuration choices (interpreted):**
  - RSS URL is built dynamically:
    - Searches for: `"<trainLine> delay suspended"`
    - Uses `encodeURIComponent(...)`
    - Forces `hl=en-US&gl=US&ceid=US:en`
  - Expression used:
    - `{{ 'https://news.google.com/rss/search?q=' + encodeURIComponent($('Configuration').first().json.trainLine + ' delay suspended') + '&hl=en-US&gl=US&ceid=US:en' }}`
- **Key expressions / variables:** Pulls `trainLine` from the **Configuration** node directly (not from current item).
- **Inputs / outputs:** Input from **Configuration**; output goes to **Gemini: Judge & Draft**.
- **Version notes:** typeVersion **1.2**.
- **Potential failures / edge cases:**
  - RSS may return 0 items (Gemini still receives an empty title list).
  - Google News RSS may throttle or change format.
  - Using US locale (`gl=US`) may reduce relevance for a Japan train line; may need localization adjustments.

---

### 2.3 AI Decision & Output Normalization (Gemini + Parse)

**Overview:** Gemini evaluates weather + news titles, returns a strict JSON decision (EMERGENCY/NORMAL) and email draft; a Code node parses and sanitizes the model output to guarantee usable structured data.

**Nodes involved:**
- **Gemini: Judge & Draft** (Google Gemini / LangChain)
- **Parse JSON** (Code)

#### Node: Gemini: Judge & Draft
- **Type / role:** `@n8n/n8n-nodes-langchain.googleGemini` — LLM call to classify the morning situation and draft an email.
- **Configuration choices (interpreted):**
  - Model: `models/gemini-1.5-flash`
  - Single user message prompt that:
    - Defines EMERGENCY conditions:
      - Weather: heavy rain/snow/storm
      - Train: delays or suspension in news
    - Provides data fields:
      - Weather description: `$('Get Weather').first().json.weather[0].description`
      - Temperature: `$('Get Weather').first().json.main.temp`
      - News titles list: `$('Get Train News (RSS)').all().map(i => i.json.title).join(', ')`
    - Requires output: **ONLY valid JSON** with keys:
      - `status`, `reason`, `email_subject`, `email_body`
- **Inputs / outputs:** Takes combined upstream context (arrives after either data node, but references both nodes by name). Outputs to **Parse JSON**.
- **Credentials:** Google Gemini (PaLM) API credential is required.
- **Version notes:** typeVersion **1**.
- **Potential failures / edge cases:**
  - Model may return non-JSON, markdown fences, or extra text (handled by Parse JSON, but not perfectly).
  - If either upstream node fails, expressions referencing missing data can error at runtime (depending on n8n expression behavior/settings).
  - Token/quotas and 429 rate limiting.
  - Ambiguous news titles (false positives/negatives).

#### Node: Parse JSON
- **Type / role:** `Code` — converts Gemini text output into a stable JSON object for routing and emailing.
- **Configuration choices (interpreted):**
  - Reads: `$input.first().json.content.parts[0].text`
  - Removes markdown code fences (```json / ```)
  - Attempts `JSON.parse()`
  - On parse error, falls back to:
    - `status: "NORMAL"`
    - Reason and default subject/body
- **Inputs / outputs:** Input from Gemini; output to **Is Emergency?**.
- **Version notes:** typeVersion **2**.
- **Potential failures / edge cases:**
  - If Gemini node output schema changes (e.g., `content.parts[0].text` not present), code will throw before `try/catch` unless guarded; currently `text` assignment is outside the `try`.
  - Returning `return result;` (an object) relies on n8n Code node behavior to wrap into an item. If the instance expects `return [{json: result}]`, it may fail depending on Code node runtime/version settings. (Many setups still accept object return, but it’s a compatibility risk.)

---

### 2.4 Routing & Notifications (Emergency vs Normal)

**Overview:** Branches based on `status`. If EMERGENCY, optionally triggers SwitchBot (disabled) and sends an urgent email immediately. If NORMAL, waits 90 minutes and sends the normal email.

**Nodes involved:**
- **Is Emergency?** (IF)
- **SwitchBot (Optional)** (HTTP Request, disabled)
- **Send Email (Urgent)** (Gmail)
- **Wait 90 mins** (Wait)
- **Send Email (Normal)** (Gmail)

#### Node: Is Emergency?
- **Type / role:** `IF` — conditional router.
- **Configuration choices (interpreted):**
  - Checks: `{{$json.status}} equals "EMERGENCY"`
  - Strict type validation enabled (as per node options).
- **Inputs / outputs:**
  - Input from **Parse JSON**
  - **True path (index 0):** SwitchBot (Optional) and Send Email (Urgent)
  - **False path (index 1):** Wait 90 mins
- **Version notes:** typeVersion **2.2**.
- **Potential failures / edge cases:**
  - If `status` missing or lowercase, it routes to NORMAL path.
  - If Parse JSON fallback triggers, it becomes NORMAL by design.

#### Node: SwitchBot (Optional) (disabled)
- **Type / role:** `HTTP Request` — smart home action (e.g., turn on lights/AC).
- **Configuration choices (interpreted):**
  - POST to `https://api.switch-bot.com/v1.0/devices/YOUR_DEVICE_ID/commands`
  - Header: `Authorization: YOUR_TOKEN`
  - Body parameter: `command = turnOn`
- **Notes:** “Enable this to turn on lights/AC in emergency”
- **Inputs / outputs:** Receives from IF true branch; no downstream connection (parallel with urgent email).
- **Version notes:** typeVersion **4.3**.
- **Potential failures / edge cases:**
  - Disabled by default; must be enabled and configured.
  - SwitchBot API typically requires additional headers/signature depending on API version; placeholder values will fail (401/403).

#### Node: Send Email (Urgent)
- **Type / role:** `Gmail` — immediate email dispatch on emergency.
- **Configuration choices (interpreted):**
  - To: `{{ $('Configuration').first().json.userEmail }}`
  - Subject: `{{ $json.email_subject }}`
  - Message: `{{ $json.email_body }}`
  - `emailType: text` (note: email_body prompt says HTML; sending as text may render raw HTML)
- **Credentials:** Gmail OAuth2 credential required.
- **Inputs / outputs:** Input from IF true branch; terminal action.
- **Version notes:** typeVersion **2.1**.
- **Potential failures / edge cases:**
  - OAuth token expiration / insufficient Gmail scopes.
  - If `email_body` contains HTML, it may not render as intended with `emailType=text`.
  - Gmail sending limits/quota.

#### Node: Wait 90 mins
- **Type / role:** `Wait` — delays sending for normal mornings.
- **Configuration choices:** `amount: 90`, `unit: minutes`.
- **Inputs / outputs:** Input from IF false branch; outputs to Send Email (Normal).
- **Version notes:** typeVersion **1.1**.
- **Potential failures / edge cases:**
  - If n8n restarts, waiting executions depend on n8n’s wait persistence configuration.
  - Large backlog could delay execution beyond intended wake-up time.

#### Node: Send Email (Normal)
- **Type / role:** `Gmail` — sends the calmer morning briefing after the wait.
- **Configuration choices (interpreted):** Same mapping as urgent email:
  - To: `{{ $('Configuration').first().json.userEmail }}`
  - Subject: `{{ $json.email_subject }}`
  - Message: `{{ $json.email_body }}`
  - `emailType: text`
- **Credentials:** Gmail OAuth2 (same credential as urgent node).
- **Inputs / outputs:** Input from Wait node; terminal action.
- **Version notes:** typeVersion **2.1**.
- **Potential failures / edge cases:** Same as urgent email (auth, quotas, HTML rendering mismatch).

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Sticky Note Main | Sticky Note | Documentation / canvas annotation | — | — | # Smart Morning Guard / How it works / Setup steps (Credentials, Configuration node, optional SwitchBot) |
| Sticky Note Config | Sticky Note | Documentation / configuration guidance | — | — | ## 1. Configuration Set your target location, train line to monitor, and email address here. |
| Sticky Note Data | Sticky Note | Documentation / data collection guidance | — | — | ## 2. Data Collection Fetches weather data and searches for specific train line delays via Google News RSS. |
| Sticky Note AI | Sticky Note | Documentation / AI analysis guidance | — | — | ## 3. AI Analysis Gemini reads the weather and news, decides if you need to wake up early, and drafts the email. |
| Sticky Note Routing | Sticky Note | Documentation / routing guidance | — | — | ## 4. Emergency Routing If Emergency: Send immediately & trigger SwitchBot. If Normal: Wait 90 mins then send. |
| Wake Up Check (5:00 AM) | Schedule Trigger | Daily trigger at 05:00 | — | Configuration | # Smart Morning Guard / How it works / Setup steps (Credentials, Configuration node, optional SwitchBot) |
| Configuration | Set | Defines location/trainLine/userEmail/API key | Wake Up Check (5:00 AM) | Get Weather; Get Train News (RSS) | ## 1. Configuration Set your target location, train line to monitor, and email address here. |
| Get Weather | HTTP Request | Fetch OpenWeatherMap current conditions | Configuration | Gemini: Judge & Draft | ## 2. Data Collection Fetches weather data and searches for specific train line delays via Google News RSS. |
| Get Train News (RSS) | RSS Feed Read | Fetch train-delay headlines from Google News RSS | Configuration | Gemini: Judge & Draft | ## 2. Data Collection Fetches weather data and searches for specific train line delays via Google News RSS. |
| Gemini: Judge & Draft | Google Gemini (LangChain) | Classify EMERGENCY/NORMAL and draft email JSON | Get Weather; Get Train News (RSS) | Parse JSON | ## 3. AI Analysis Gemini reads the weather and news, decides if you need to wake up early, and drafts the email. |
| Parse JSON | Code | Parse/sanitize Gemini output into JSON fields | Gemini: Judge & Draft | Is Emergency? | ## 3. AI Analysis Gemini reads the weather and news, decides if you need to wake up early, and drafts the email. |
| Is Emergency? | IF | Route based on `$json.status` | Parse JSON | (true) SwitchBot (Optional), Send Email (Urgent); (false) Wait 90 mins | ## 4. Emergency Routing If Emergency: Send immediately & trigger SwitchBot. If Normal: Wait 90 mins then send. |
| SwitchBot (Optional) | HTTP Request | (Optional) trigger smart home device | Is Emergency? (true) | — | ## 4. Emergency Routing If Emergency: Send immediately & trigger SwitchBot. If Normal: Wait 90 mins then send. |
| Send Email (Urgent) | Gmail | Send immediate emergency email | Is Emergency? (true) | — | ## 4. Emergency Routing If Emergency: Send immediately & trigger SwitchBot. If Normal: Wait 90 mins then send. |
| Wait 90 mins | Wait | Delay normal email sending | Is Emergency? (false) | Send Email (Normal) | ## 4. Emergency Routing If Emergency: Send immediately & trigger SwitchBot. If Normal: Wait 90 mins then send. |
| Send Email (Normal) | Gmail | Send normal briefing email after wait | Wait 90 mins | — | ## 4. Emergency Routing If Emergency: Send immediately & trigger SwitchBot. If Normal: Wait 90 mins then send. |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow**
   - Name: *Monitor morning weather and traffic to trigger alarms using Google Gemini* (or your preferred name).

2. **Add Trigger**
   - Add node: **Schedule Trigger**
   - Configure: run daily at **05:00** (set `triggerAtHour = 5`).

3. **Add Configuration node**
   - Add node: **Set** (name it **Configuration**)
   - Add fields:
     - `location` (string): e.g., `Tokyo,JP`
     - `trainLine` (string): e.g., `Yamanote Line`
     - `userEmail` (string): your email destination
     - `openWeatherApiKey` (string): your OpenWeatherMap API key
   - Ensure it **keeps other fields** (include other fields).

4. **Connect Trigger → Configuration**

5. **Add Weather fetch**
   - Add node: **HTTP Request** (name: **Get Weather**)
   - Method: GET
   - URL: `https://api.openweathermap.org/data/2.5/weather`
   - Enable **Send Query Parameters**
   - Add query params:
     - `q` = `{{$json.location}}`
     - `appid` = `{{$json.openWeatherApiKey}}`
     - `units` = `metric`
     - `lang` = `en`
   - Connect **Configuration → Get Weather**.

6. **Add Train news fetch**
   - Add node: **RSS Feed Read** (name: **Get Train News (RSS)**)
   - URL expression:
     - `{{ 'https://news.google.com/rss/search?q=' + encodeURIComponent($('Configuration').first().json.trainLine + ' delay suspended') + '&hl=en-US&gl=US&ceid=US:en' }}`
   - Connect **Configuration → Get Train News (RSS)**.

7. **Add Gemini analysis**
   - Add node: **Google Gemini** (the LangChain Gemini node; name: **Gemini: Judge & Draft**)
   - Credentials: configure **Google Gemini (PaLM) API** credential in n8n and select it in the node.
   - Model: `models/gemini-1.5-flash`
   - Add a single message instructing it to output **ONLY JSON** with:
     - `status` (`EMERGENCY`/`NORMAL`)
     - `reason`
     - `email_subject`
     - `email_body`
   - In the prompt, reference:
     - `$('Get Weather').first().json.weather[0].description`
     - `$('Get Weather').first().json.main.temp`
     - `$('Get Train News (RSS)').all().map(i => i.json.title).join(', ')`
   - Connect **Get Weather → Gemini: Judge & Draft**
   - Connect **Get Train News (RSS) → Gemini: Judge & Draft**
   - (This ensures Gemini runs after both branches have produced data in typical n8n merge-by-reference style using node-name lookups.)

8. **Add Parse step**
   - Add node: **Code** (name: **Parse JSON**)
   - Paste logic to:
     - Read Gemini output text (from `content.parts[0].text`)
     - Strip ```json fences
     - `JSON.parse()`
     - Fallback to NORMAL on parsing error
   - Connect **Gemini: Judge & Draft → Parse JSON**.

9. **Add emergency router**
   - Add node: **IF** (name: **Is Emergency?**)
   - Condition:
     - Left: `{{$json.status}}`
     - Operation: equals
     - Right: `EMERGENCY`
   - Connect **Parse JSON → Is Emergency?**.

10. **Emergency actions**
   - (Optional) Add **HTTP Request** node named **SwitchBot (Optional)**:
     - Method: POST
     - URL: `https://api.switch-bot.com/v1.0/devices/<DEVICE_ID>/commands`
     - Header: `Authorization: <TOKEN>`
     - Body: `command=turnOn`
     - Leave **disabled** until configured and tested.
   - Add **Gmail** node named **Send Email (Urgent)**:
     - Credentials: configure **Gmail OAuth2** in n8n and select it.
     - To: `{{ $('Configuration').first().json.userEmail }}`
     - Subject: `{{ $json.email_subject }}`
     - Message: `{{ $json.email_body }}`
     - Consider setting email type to HTML if you want HTML rendering (the workflow currently uses text).
   - Connect **Is Emergency? (true)** → **SwitchBot (Optional)**
   - Connect **Is Emergency? (true)** → **Send Email (Urgent)**

11. **Normal path**
   - Add **Wait** node named **Wait 90 mins**
     - Unit: minutes
     - Amount: 90
   - Add **Gmail** node named **Send Email (Normal)** with same mappings as urgent.
   - Connect **Is Emergency? (false)** → **Wait 90 mins**
   - Connect **Wait 90 mins → Send Email (Normal)**

12. **Activate workflow**
   - Validate credentials (OpenWeather key, Gemini key, Gmail OAuth2).
   - Run a manual execution once (with pinned data if needed), then activate.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Smart Morning Guard” description: runs at 5:00 AM; collects OpenWeatherMap + Google News RSS; Gemini decides emergency/normal; sends immediate alert + optional smart home; otherwise waits and sends calm briefing. | From “Sticky Note Main” |
| Setup guidance: configure OpenWeatherMap, Google Gemini, Gmail; edit the “Configuration” node for location/trainLine/email; optionally enable SwitchBot automation. | From “Sticky Note Main” |
| The Gemini prompt requests HTML email body, but Gmail nodes are set to `emailType: text`. | Integration note (rendering may be plain text) |
| Google News RSS locale is forced to `en-US` / `US`; may not match the configured train line region. | Data relevance note |