Automate business card management with LINE, AI, and Google Sheets

https://n8nworkflows.xyz/workflows/automate-business-card-management-with-line--ai--and-google-sheets-12058


# Automate business card management with LINE, AI, and Google Sheets

Disclaimer: Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Workflow name:** *Extract business card info to Google Sheets with LINE and AI*  
**Stated title:** *Automate business card management with LINE, AI, and Google Sheets*

**Purpose:**  
This workflow receives a business card image sent to a LINE bot, downloads the image, uses Google Gemini to extract structured contact details, parses/normalizes the extracted output, stores the image in Google Drive, appends the extracted fields to Google Sheets, then sends a thank-you email (Gmail) and replies to the user on LINE. If extraction fails, it notifies the user via LINE.

**Primary use cases:**
- Automating lead/contact capture from business cards exchanged at events
- Reducing manual data entry into spreadsheets/CRM-like tracking
- Immediate follow-up to new contacts via email and chat confirmation

### 1.1 Input Reception & Configuration
- Receives a LINE webhook event.
- Loads tokens and Google IDs from a Config (Set) node.

### 1.2 Media Validation & Download
- Checks whether the incoming message is an image.
- Downloads the image binary from LINE’s content API.

### 1.3 AI Extraction (Gemini)
- Sends the image to Gemini via an LLM Chain node.
- Forces a strict “Key: Value” output format or “Extraction Failed”.

### 1.4 Validation, Parsing & Structuring
- If extraction succeeded, parses text into normalized fields (company, name, department, address, email, phone list).
- Preserves the original image binary for later upload.

### 1.5 Storage (Drive + Sheets)
- Uploads the image to Google Drive.
- Appends extracted fields to Google Sheets.

### 1.6 Notifications (Email + LINE)
- Sends a thank-you email to the extracted email address.
- Pushes a LINE message back to the user with the extracted details.
- If extraction failed, pushes an apology message asking for another image.

---

## 2. Block-by-Block Analysis

### Block 1 — Trigger & Config
**Overview:** Receives the LINE webhook call and sets required configuration values (LINE token, Sheets ID, Drive folder ID) used throughout the workflow.  
**Nodes involved:** `LINE Webhook`, `Config`

#### Node: LINE Webhook
- **Type / role:** `Webhook` (entry point). Accepts incoming LINE Messaging API webhook events.
- **Configuration (interpreted):**
  - Method: **POST**
  - Path: **/BusinessCard** (the URL segment to register in LINE Developer Console)
- **Key data used later:**
  - `body.events[0].message.type`
  - `body.events[0].message.id`
  - `body.events[0].source.userId`
- **Outputs:** Sends the raw webhook payload into `Config`.
- **Edge cases / failures:**
  - LINE signature validation is not implemented here (some LINE integrations validate `X-Line-Signature`; this workflow does not).
  - If LINE sends non-message events (follow/unfollow/join), `events[0].message` may not exist → later expressions can fail.

#### Node: Config
- **Type / role:** `Set` node used as a static configuration holder.
- **Configuration (interpreted):**
  - Creates 3 string fields:
    - `LINE_CHANNEL_ACCESS_TOKEN`
    - `GOOGLE_SHEETS_ID`
    - `GOOGLE_DRIVE_FOLDER_ID`
  - Values are placeholders and must be replaced.
- **Connections:**
  - Input: `LINE Webhook`
  - Output: `Check If Image`
- **Edge cases / failures:**
  - If placeholders are not replaced, LINE calls (download/push) will fail with 401/403, and Google nodes will fail (invalid IDs).

---

### Block 2 — Media Type Check & Image Download
**Overview:** Ensures the LINE message is an image, then downloads the image as binary data from LINE’s content endpoint.  
**Nodes involved:** `Check If Image`, `Download Image from LINE`

#### Node: Check If Image
- **Type / role:** `Switch` node to route only image messages.
- **Configuration (interpreted):**
  - Condition: `{{ $('LINE Webhook').item.json.body.events[0].message.type }}` **equals** `"image"`
  - Only one rule is defined; other message types effectively have no handled route.
- **Connections:**
  - Input: `Config`
  - Output (true match): `Download Image from LINE`
- **Edge cases / failures:**
  - If `events[0].message` is missing, expression evaluation can error.
  - Non-image events are not handled (workflow will stop without notifying the user).

#### Node: Download Image from LINE
- **Type / role:** `HTTP Request` to fetch the binary image content from LINE.
- **Configuration (interpreted):**
  - URL: `https://api-data.line.me/v2/bot/message/{{message.id}}/content`
  - Response format: **File** (binary)
  - Header: `Authorization: Bearer {{ Config.LINE_CHANNEL_ACCESS_TOKEN }}`
- **Connections:**
  - Input: `Check If Image`
  - Outputs:
    - To `Merge` (Input 1 / index 0) — carries image binary for later Drive upload
    - To `Extract Card Info` — provides the image binary to the LLM chain
- **Edge cases / failures:**
  - 401/403 if token invalid or missing required LINE Messaging API permissions.
  - 404 if message content expired (LINE content has limited availability).
  - Large image sizes can increase execution time or memory usage.

---

### Block 3 — AI Processing (Gemini Extraction)
**Overview:** Uses Google Gemini to extract specific fields from the business card image, enforcing a strict output format.  
**Nodes involved:** `Google Gemini Chat Model`, `Extract Card Info`

#### Node: Google Gemini Chat Model
- **Type / role:** LangChain chat model connector for **Google Gemini**.
- **Configuration (interpreted):**
  - Uses Google PaLM/Gemini credentials (`googlePalmApi`).
  - Default options (no custom temperature/max tokens shown).
- **Connections:**
  - Provides the **AI languageModel** input to `Extract Card Info`.
- **Version-specific notes:**
  - Node type: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini` (requires the LangChain nodes package enabled in your n8n).
- **Edge cases / failures:**
  - Auth/billing errors from Google API.
  - Model may return output deviating from strict format; downstream parser expects `Key: Value` lines.

#### Node: Extract Card Info
- **Type / role:** LangChain `chainLlm` node that sends a prompt + image to the model and returns extracted text.
- **Configuration (interpreted):**
  - Prompt instructs:
    - Exact keys (Company Name, Contact Person, Department, Address, Email, Phone)
    - Output format `Key: Value`, one per line
    - Use `ー` if unknown
    - Return only `Extraction Failed` if nothing can be extracted
  - Message input includes `imageBinary` (so it consumes binary from `Download Image from LINE`).
- **Connections:**
  - Input: `Download Image from LINE` (main) + `Google Gemini Chat Model` (ai_languageModel)
  - Output: `If`
- **Edge cases / failures:**
  - If binary property name is not what the node expects, image may not be passed correctly.
  - Gemini may output localized keys or extra text; parsing relies on colon-delimited lines.

---

### Block 4 — Success/Failure Routing + Parsing
**Overview:** Checks if extraction succeeded. If yes, parses into normalized JSON fields while preserving the original binary for storage; if not, notifies the user in LINE.  
**Nodes involved:** `If`, `Parse Data`, `Notify Analysis Failed`

#### Node: If
- **Type / role:** Conditional routing based on extraction result string.
- **Configuration (interpreted):**
  - Condition: `{{ $json.text }}` **not equals** `"Extraction Failed"`
- **Connections:**
  - True branch → `Parse Data`
  - False branch → `Notify Analysis Failed`
- **Edge cases / failures:**
  - If the LLM node returns the text under a different field name than `text`, this condition may evaluate incorrectly (or as empty).
  - If Gemini returns `"Extraction failed"` (different casing) it will be treated as success.

#### Node: Parse Data
- **Type / role:** `Code` node to normalize and map extracted lines into structured fields.
- **Key logic (interpreted):**
  - Reads candidate text from several possible paths:
    - `$json.text`, `$json.data.text`, `$input.first().json.text`
  - Normalizes punctuation/spacing and colon variants.
  - Uses alias mapping to resolve keys in English and Japanese.
  - Extracts phone numbers with a regex and builds `phoneList` and a joined `phone`.
  - Lowercases email.
  - Removes empty strings and empty arrays.
  - Returns:
    - `json`: `{ company, name, department, address, email, phone, phoneList }` (some may be omitted if empty)
    - `binary`: passes through the first input binary (keeps the image for Drive upload).
- **Connections:**
  - Output → `Merge` (Input 2 / index 1)
- **Edge cases / failures:**
  - If LLM output does not contain `:` delimiters, nothing will parse.
  - If phone formats are non-Japanese or include country codes, regex may miss them.
  - If the LLM outputs `ー`, those are treated as literal values (not automatically removed).

#### Node: Notify Analysis Failed
- **Type / role:** `HTTP Request` to LINE push message endpoint (failure path).
- **Configuration (interpreted):**
  - POST `https://api.line.me/v2/bot/message/push`
  - JSON body sends a text message to `events[0].source.userId`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer {{LINE token}}`
- **Connections:** Terminal node (no outgoing connection).
- **Edge cases / failures:**
  - Push messages require the bot to have permission and the user to have added the bot.
  - If `userId` missing (e.g., group contexts) push may fail or require different handling.

---

### Block 5 — Combine Binary + Parsed Data
**Overview:** Recombines the image binary (from download) with the parsed JSON (from parsing) so subsequent nodes can both upload the file and write extracted fields.  
**Nodes involved:** `Merge`

#### Node: Merge
- **Type / role:** `Merge` node in **combine** mode by position.
- **Configuration (interpreted):**
  - Mode: **combine**
  - Combine by: **position**
  - Input 1: from `Download Image from LINE`
  - Input 2: from `Parse Data`
- **Connections:**
  - Output → `Upload to Google Drive`
- **Edge cases / failures:**
  - If one branch produces 0 items, combine-by-position yields no output.
  - If multiple items occur unexpectedly, pairing may mismatch.

---

### Block 6 — Data Storage (Drive + Sheets)
**Overview:** Uploads the business card image to Google Drive and appends the extracted fields to a Google Sheet.  
**Nodes involved:** `Upload to Google Drive`, `Save to Google Sheets`

#### Node: Upload to Google Drive
- **Type / role:** `Google Drive` file upload.
- **Configuration (interpreted):**
  - File name: `BusinessCard_YYYYMMDD_HHmmss.jpg` using `$now.format('yyyyMMdd_HHmmss')`
  - Drive: “My Drive”
  - Folder ID: from `Config.GOOGLE_DRIVE_FOLDER_ID`
  - Expects binary input from the merged item.
- **Connections:**
  - Input: `Merge`
  - Output: `Save to Google Sheets`
- **Credentials:** Google Drive OAuth2.
- **Edge cases / failures:**
  - Folder ID invalid or not shared with the OAuth account.
  - Binary property missing → upload fails.
  - Always uses `.jpg` extension even if the original is PNG; usually fine but can confuse downstream usage.

#### Node: Save to Google Sheets
- **Type / role:** `Google Sheets` append row.
- **Configuration (interpreted):**
  - Operation: **Append**
  - Document ID: `Config.GOOGLE_SHEETS_ID`
  - Sheet/tab selection: `gid=0` (first sheet)
  - Column mapping (Japanese headers expected in the sheet):
    - `会社名` ← `Parse Data.company`
    - `担当者名` ← `Parse Data.name`
    - `担当者の所属部署名` ← `Parse Data.department`
    - `住所` ← `Parse Data.address`
    - `メールアドレス` ← `Parse Data.email`
    - `電話番号` ← `Parse Data.phoneList.join("/")`
- **Connections:**
  - Input: `Upload to Google Drive`
  - Output: `Send Thank You Email`
- **Credentials:** Google Sheets OAuth2.
- **Edge cases / failures:**
  - If the sheet does not have these exact column headers, mapping may fail or write empty cells.
  - If `phoneList` is missing, `.join("/")` can error unless `phoneList` exists; the code tries to delete empty arrays, so this can become a runtime expression error. (A safer expression would guard with `?.` or default `[]`.)

---

### Block 7 — Notification (Email + LINE Reply)
**Overview:** Sends a thank-you email to the extracted email address, then sends a LINE message confirming extracted details.  
**Nodes involved:** `Send Thank You Email`, `Reply to LINE`

#### Node: Send Thank You Email
- **Type / role:** `Gmail` send message.
- **Configuration (interpreted):**
  - To: `{{ $json['メールアドレス'] }}`
  - Subject: “Thank You for the Opportunity to Meet”
  - Body: templated plain text using `{{ $json['担当者名'] }}`
- **Connections:**
  - Input: `Save to Google Sheets` (so `$json` here is the Sheets node output item)
  - Output: `Reply to LINE`
- **Credentials:** Gmail OAuth2.
- **Edge cases / failures:**
  - If Sheets node output does not include those fields (depends on node output structure), email “To” may be empty → Gmail node fails.
  - If extracted email is `ー` or invalid, sending fails.
  - Consider validating email before sending.

#### Node: Reply to LINE
- **Type / role:** `HTTP Request` to LINE push message endpoint (success path).
- **Configuration (interpreted):**
  - POST `https://api.line.me/v2/bot/message/push`
  - Sends a text block containing extracted fields from `Parse Data`:
    - company, name, department, address, email, phoneList joined
  - Headers: JSON content-type + Bearer token
- **Connections:** Terminal node.
- **Edge cases / failures:**
  - Uses **push** API, not **reply** API. Push requires userId and may be subject to plan/limits.
  - If expressions reference fields deleted by `Parse Data` (missing), text will render as blank.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Workflow Overview | Sticky Note | Documentation / overview | — | — | ## How it works… (includes setup steps and limitation: one image per execution) |
| Step 1 Note | Sticky Note | Documentation for trigger/config block | — | — | ## Trigger & Config Receives LINE webhook events and loads configuration settings. |
| Step 2 Note | Sticky Note | Documentation for AI block | — | — | ## AI Processing Downloads image from LINE and extracts business card info using Gemini. |
| Step 3 Note | Sticky Note | Documentation for storage block | — | — | ## Data Storage Parses extracted text, uploads image to Drive, and saves data to Sheets. |
| Step 4 Note | Sticky Note | Documentation for notification block | — | — | ## Notification Sends thank-you email and replies to LINE with extracted info. |
| LINE Webhook | Webhook | Entry point for LINE events | — | Config | ## Trigger & Config Receives LINE webhook events and loads configuration settings. |
| Config | Set | Stores tokens/IDs for later use | LINE Webhook | Check If Image | ## Trigger & Config Receives LINE webhook events and loads configuration settings. |
| Check If Image | Switch | Ensures message is an image | Config | Download Image from LINE | ## Trigger & Config Receives LINE webhook events and loads configuration settings. |
| Download Image from LINE | HTTP Request | Fetches image binary from LINE | Check If Image | Merge; Extract Card Info | ## AI Processing Downloads image from LINE and extracts business card info using Gemini. |
| Google Gemini Chat Model | LangChain Chat Model (Google Gemini) | LLM provider for extraction | — | Extract Card Info (ai_languageModel) | ## AI Processing Downloads image from LINE and extracts business card info using Gemini. |
| Extract Card Info | LangChain LLM Chain | Prompts Gemini with image; returns structured text | Download Image from LINE; Google Gemini Chat Model | If | ## AI Processing Downloads image from LINE and extracts business card info using Gemini. |
| If | If | Routes on “Extraction Failed” vs success | Extract Card Info | Parse Data; Notify Analysis Failed | ## AI Processing Downloads image from LINE and extracts business card info using Gemini. |
| Parse Data | Code | Normalizes/parses extracted text into fields | If (true) | Merge | ## Data Storage Parses extracted text, uploads image to Drive, and saves data to Sheets. |
| Merge | Merge | Recombines binary + parsed JSON | Download Image from LINE; Parse Data | Upload to Google Drive | ## Data Storage Parses extracted text, uploads image to Drive, and saves data to Sheets. |
| Upload to Google Drive | Google Drive | Uploads business card image to folder | Merge | Save to Google Sheets | ## Data Storage Parses extracted text, uploads image to Drive, and saves data to Sheets. |
| Save to Google Sheets | Google Sheets | Appends extracted data into sheet | Upload to Google Drive | Send Thank You Email | ## Data Storage Parses extracted text, uploads image to Drive, and saves data to Sheets. |
| Send Thank You Email | Gmail | Sends follow-up email | Save to Google Sheets | Reply to LINE | ## Notification Sends thank-you email and replies to LINE with extracted info. |
| Reply to LINE | HTTP Request | Pushes extracted info to LINE user | Send Thank You Email | — | ## Notification Sends thank-you email and replies to LINE with extracted info. |
| Notify Analysis Failed | HTTP Request | Pushes failure message to LINE user | If (false) | — | ## AI Processing Downloads image from LINE and extracts business card info using Gemini. |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n.
2. **Add Webhook node** (`LINE Webhook`)
   - Method: `POST`
   - Path: `/BusinessCard`
   - Save the node to get the full production webhook URL.
   - In LINE Developer Console, set the Messaging API webhook URL to this endpoint.
3. **Add Set node** (`Config`)
   - Add fields:
     - `LINE_CHANNEL_ACCESS_TOKEN` (string)
     - `GOOGLE_SHEETS_ID` (string)
     - `GOOGLE_DRIVE_FOLDER_ID` (string)
   - Fill them with your real values.
   - Connect: `LINE Webhook` → `Config`
4. **Add Switch node** (`Check If Image`)
   - Create rule: String equals
   - Value 1 (expression): `{{ $('LINE Webhook').item.json.body.events[0].message.type }}`
   - Value 2: `image`
   - Connect: `Config` → `Check If Image`
5. **Add HTTP Request node** (`Download Image from LINE`)
   - Method: `GET` (default is fine if URL only; in this JSON it’s implicit GET)
   - URL (expression):  
     `https://api-data.line.me/v2/bot/message/{{ $('LINE Webhook').item.json.body.events[0].message.id }}/content`
   - Response: set to **File** (binary)
   - Headers:
     - `Authorization`: `Bearer {{ $('Config').item.json.LINE_CHANNEL_ACCESS_TOKEN }}`
   - Connect: `Check If Image` (image route) → `Download Image from LINE`
6. **Add Google Gemini Chat Model node** (`Google Gemini Chat Model`)
   - Set up **Google PaLM/Gemini** credentials (API key / project as required by your node version).
   - Keep default model options unless you need tuning.
7. **Add LangChain LLM Chain node** (`Extract Card Info`)
   - Configure it to use an input **Human message of type `imageBinary`** (so it consumes the binary from the HTTP Request).
   - Prompt text (exact keys):
     - Company Name
     - Contact Person
     - Department
     - Address
     - Email
     - Phone
     - With the “Extraction Failed” rule as in the workflow.
   - Connect:
     - `Google Gemini Chat Model` → `Extract Card Info` (AI languageModel connection)
     - `Download Image from LINE` → `Extract Card Info` (main)
8. **Add If node** (`If`)
   - Condition: String `{{ $json.text }}` not equals `Extraction Failed`
   - Connect: `Extract Card Info` → `If`
9. **Add Code node** (`Parse Data`) on the **true** branch
   - Paste logic equivalent to the provided parsing behavior:
     - Normalize text
     - Parse `Key: Value` lines
     - Map aliases to canonical keys: company/name/department/address/email/phone
     - Extract phone numbers into `phoneList`
     - Lowercase email
     - Return `{ json: out, binary: $input.first().binary }`
   - Connect: `If` (true) → `Parse Data`
10. **Add HTTP Request node** (`Notify Analysis Failed`) on the **false** branch
    - Method: `POST`
    - URL: `https://api.line.me/v2/bot/message/push`
    - Body type: JSON
    - JSON body (expression) to push to: `events[0].source.userId`
    - Headers:
      - `Content-Type: application/json`
      - `Authorization: Bearer {{ Config.LINE_CHANNEL_ACCESS_TOKEN }}`
    - Connect: `If` (false) → `Notify Analysis Failed`
11. **Add Merge node** (`Merge`)
    - Mode: **Combine**
    - Combine by: **Position**
    - Connect:
      - `Download Image from LINE` → `Merge` (Input 1)
      - `Parse Data` → `Merge` (Input 2)
12. **Add Google Drive node** (`Upload to Google Drive`)
    - Operation: upload (file upload)
    - Folder ID: `{{ $('Config').item.json.GOOGLE_DRIVE_FOLDER_ID }}`
    - File name: `BusinessCard_{{$now.format('yyyyMMdd_HHmmss')}}.jpg`
    - Credentials: Google Drive OAuth2 (account must have access to folder)
    - Connect: `Merge` → `Upload to Google Drive`
13. **Add Google Sheets node** (`Save to Google Sheets`)
    - Operation: **Append**
    - Document ID: `{{ $('Config').item.json.GOOGLE_SHEETS_ID }}`
    - Sheet: select the target tab (the example uses `gid=0`)
    - Map columns to parsed fields (ensure your sheet headers match), e.g.:
      - `会社名` → `{{ $('Parse Data').item.json.company }}`
      - `担当者名` → `{{ $('Parse Data').item.json.name }}`
      - `担当者の所属部署名` → `{{ $('Parse Data').item.json.department }}`
      - `住所` → `{{ $('Parse Data').item.json.address }}`
      - `メールアドレス` → `{{ $('Parse Data').item.json.email }}`
      - `電話番号` → `{{ ($('Parse Data').item.json.phoneList ?? []).join('/') }}`
    - Credentials: Google Sheets OAuth2
    - Connect: `Upload to Google Drive` → `Save to Google Sheets`
14. **Add Gmail node** (`Send Thank You Email`)
    - To: use the email value available at this point. If using Sheets output is unreliable, prefer referencing `Parse Data` directly.
    - Subject/body as desired (plain text in this workflow).
    - Credentials: Gmail OAuth2
    - Connect: `Save to Google Sheets` → `Send Thank You Email`
15. **Add HTTP Request node** (`Reply to LINE`)
    - Method: `POST`
    - URL: `https://api.line.me/v2/bot/message/push`
    - JSON body includes a summary text referencing `Parse Data` fields
    - Headers: `Content-Type` + `Authorization: Bearer {{LINE token}}`
    - Connect: `Send Thank You Email` → `Reply to LINE`
16. **Activate the workflow**
    - Ensure LINE webhook is enabled and the bot is allowed to send push messages.
    - Test by sending a single business card image to the LINE bot (one image per execution, as noted).

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Processes one image per execution. Multiple images in one message are not supported. | Limitation stated in workflow sticky note (“Workflow Overview”). |
| Google Sheets must include columns: Company Name, Contact Person, Department, Address, Email, Phone Number (workflow actually maps to Japanese headers). | Setup guidance in sticky note; verify header names match your sheet. |
| You must create a LINE Messaging API channel and set the webhook URL in LINE Developer Console. | Setup guidance in sticky note (“Workflow Overview”). |
| Configure a Google Drive folder for image storage and use its folder ID. | Setup guidance in sticky note (“Workflow Overview”). |

