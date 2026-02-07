Automate event registration and reminder emails with Forms, Sheets & Gmail

https://n8nworkflows.xyz/workflows/automate-event-registration-and-reminder-emails-with-forms--sheets---gmail-11944


# Automate event registration and reminder emails with Forms, Sheets & Gmail

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Workflow name:** *Event Registration And Reminder Automation (Pre-Event + Event Day)*  
**Provided title:** *Automate event registration and reminder emails with Forms, Sheets & Gmail*

This workflow automates an event registration lifecycle using an n8n Form, Google Sheets as the registration database, and Gmail for email notifications. It has **two entry points**: (1) a form submission path to register an attendee and send a welcome email, and (2) a scheduled daily run to send reminder emails (3-days-before and day-of-event) and update tracking flags in Sheets.

### 1.1 Input Reception & Routing (Form vs Schedule)
- Captures registrations from an n8n form trigger.
- Runs daily at a fixed time (9 AM) from a schedule trigger.
- Uses a `source` field plus a Switch node to route execution into the correct branch.

### 1.2 Registration Deduplication & Storage
- Reads existing registrations from Google Sheets.
- Checks whether the submitted email already exists (case-insensitive).
- Appends a new row only if not duplicate.

### 1.3 Confirmation, Welcome Email, and Tracking
- Adds status + event date + tracking flags.
- Sends a welcome email (if “confirmed”).
- Updates the corresponding row in Sheets to mark that the welcome email was sent.
- Sends an admin alert if confirmation fails (however, see edge cases—this branch is currently mis-wired).

### 1.4 Scheduled Reminder Candidate Selection
- Daily run fetches registrations from Sheets.
- Filters to confirmed registrations that need either a 3‑day reminder or event-day reminder, based on the `Event Date` and tracking flags.

### 1.5 Reminder Sending (Batching + Delays) & Status Updates
- Routes each candidate by reminder type (`3-day` or `event-day`).
- Sends emails in batches.
- Wait nodes add a delay (configured unit is seconds; duration not explicitly set in JSON).
- Updates per-attendee reminder flags in Sheets to prevent re-sending.

---

## 2. Block-by-Block Analysis

### Block 1 — Input Reception & Execution Routing
**Overview:** Establishes two entry points (form submission and scheduled trigger) and routes data through a single Switch based on a `source` field.

**Nodes involved:**
- Event Registration Form3
- Schedule Trigger2
- Edit Fields4
- Edit Fields5
- Switch2

#### Node: Event Registration Form3
- **Type / Role:** `Form Trigger` — collects user registration data via hosted n8n form endpoint.
- **Configuration (interpreted):**
  - Form title: “Event Registration”
  - Description: “Register for our upcoming event”
  - Fields (required): First Name, Last Name, Email (email field), Company, Interests (dropdown: n8n / automation / ai-agent / digital-worker)
  - Path/webhook: `530dbca7-33ec-4add-a37b-e44ee5fe7e41` (used to generate the form URL)
- **Key outputs:** JSON with keys matching labels: `First Name`, `Last Name`, `Email`, `Company`, `Interests`.
- **Connections:** → Edit Fields4
- **Edge cases / failures:**
  - Users can submit unexpected casing/spaces in email; later normalized in code.
  - If labels change, downstream expressions referencing exact field labels will break.

#### Node: Edit Fields4
- **Type / Role:** `Set` — tags execution as coming from the form.
- **Configuration:**
  - `includeOtherFields: true`
  - Assigns `source = "form"`
- **Connections:** → Switch2
- **Edge cases:** If `includeOtherFields` were disabled, original form fields would be lost.

#### Node: Schedule Trigger2
- **Type / Role:** `Schedule Trigger` — daily trigger.
- **Configuration:**
  - Interval rule: triggers at **09:00** (implicit daily schedule based on `triggerAtHour: 9`)
- **Connections:** → Edit Fields5
- **Edge cases:**
  - Timezone depends on n8n instance settings.
  - If you need “every day at 9 AM local time”, ensure instance timezone is correct.

#### Node: Edit Fields5
- **Type / Role:** `Set` — tags execution as coming from schedule.
- **Configuration:**
  - Assigns `source = "schedule"`
  - Does **not** explicitly preserve other fields (no `includeOtherFields: true` shown). For schedule runs this is typically fine.
- **Connections:** → Switch2

#### Node: Switch2
- **Type / Role:** `Switch` — routes to registration branch or reminder branch.
- **Configuration:**
  - Rule 1: if `{{$json.source}} == "form"` → output 0
  - Rule 2: if `{{$json.source}} == "schedule"` → output 1
- **Connections:**
  - Output 0 → Read Existing Registrations2
  - Output 1 → Get Confirmed Aptitude Candidates2
- **Edge cases:**
  - If `source` missing, no outputs match and workflow stops.
  - Node name “Get Confirmed Aptitude Candidates2” is misleading; it actually reads all registrations.

**Sticky notes covering this block:**
- “Event Registration Automation with Email Workflow” (Sticky Note10)
- “Step 1: Capture and Process Registration” (Sticky Note11)
- “Step 3: Scheduled Trigger and Reminder Routing” (Sticky Note13)

---

### Block 2 — Registration Deduplication & Storage
**Overview:** Loads existing registrations from Google Sheets, checks for duplicate email, and appends the registration if it’s new.

**Nodes involved:**
- Read Existing Registrations2
- Check for Duplicate Email2
- If Not Duplicate2
- Store Registration (Google Sheets)3

#### Node: Read Existing Registrations2
- **Type / Role:** `Google Sheets` — reads rows from the registrations sheet.
- **Configuration:**
  - Document: “your-google-sheet”
  - Sheet/tab: `gid=0`
  - Operation appears to be **read/get all** (operation not explicitly shown; node is used as an input list).
- **Connections:** → Check for Duplicate Email2
- **Credentials:** Not shown in JSON, but requires Google Sheets OAuth2/service account in n8n.
- **Edge cases:**
  - Auth/permission errors to the spreadsheet.
  - Large sheets can slow executions and increase memory usage (reads all rows).

#### Node: Check for Duplicate Email2
- **Type / Role:** `Code` — compares submitted email to sheet emails.
- **Configuration highlights:**
  - Reads form data from `$('Event Registration Form3').first().json`
  - Normalizes: `submittedEmail = formData.Email.toLowerCase().trim()`
  - Loads all sheet items: `$('Read Existing Registrations2').all()`
  - Duplicate test: case-insensitive equality against `item.json.Email`
  - Outputs merged form data plus:
    - `isDuplicate` (boolean)
    - `duplicateCheckAt` (ISO timestamp)
- **Connections:** → If Not Duplicate2
- **Edge cases / failures:**
  - If the sheet column isn’t named exactly `Email`, duplicate checking fails silently (treated as non-duplicate).
  - If form field label changes from `Email`, `formData.Email` becomes undefined and `.toLowerCase()` will throw.

#### Node: If Not Duplicate2
- **Type / Role:** `If` — gates insert into Google Sheets.
- **Configuration:**
  - Condition: boolean `value1 = {{$json.isDuplicate}}`
  - Only **true output (index 0)** is connected to storage.
- **Important behavior note:** As configured, this node currently routes when `isDuplicate` is **true** (because there’s no “not” operator used). The node name suggests the intent is the opposite.
- **Connections:** (True output) → Store Registration (Google Sheets)3
- **Edge cases:**
  - Logic inversion causes storing duplicates and blocking new registrants. This is the most critical functional bug.

#### Node: Store Registration (Google Sheets)3
- **Type / Role:** `Google Sheets` — append new registration row.
- **Configuration:**
  - Operation: **append**
  - Maps columns:
    - First Name, Last Name, Email, Company, Interests
  - Matching columns: none (append always adds new row)
- **Connections:** → Add Status & Event Date3
- **Edge cases:**
  - Column names must match Sheet headers; spaces/case matter depending on node behavior.
  - If the sheet has additional required columns, append may fail.

**Sticky notes covering this block:**
- “Step 1: Capture and Process Registration” (Sticky Note11)

---

### Block 3 — Confirmation + Welcome Email + Tracking (and Admin Alert)
**Overview:** Enriches the registration record (status, event date, flags), sends welcome email, and updates the sheet to track email delivery. Includes an admin alert path intended for failures.

**Nodes involved:**
- Add Status & Event Date3
- Check Registration Success3
- Send Welcome Email3
- Code in JavaScript4
- Update Welcome Email Status3
- Send Admin Alert3

#### Node: Add Status & Event Date3
- **Type / Role:** `Set` — standardizes and enriches data post-storage.
- **Configuration:**
  - Sets (string unless specified):
    - First Name, Last Name, Email, Company, Interests (copied through)
    - Status = `"confirmed"`
    - `preEventEmailSent ` = boolean `false` (**note trailing space in field name**)
    - `Event Date` = `"20-12-2025"` (DD-MM-YYYY)
- **Connections:** → Check Registration Success3
- **Edge cases:**
  - Trailing space in `preEventEmailSent ` creates a fragile field name used throughout reminders.
  - Hard-coded date means all registrants share the same event date unless you change it dynamically.

#### Node: Check Registration Success3
- **Type / Role:** `If` — checks confirmation status.
- **Configuration:** condition `{{$json.Status}} == "confirmed"`
- **Connections:**
  - True output → Send Welcome Email3
  - False output → Send Admin Alert3
- **Edge cases / failures:**
  - Since Status is always set to “confirmed” in the previous node, the false branch is effectively unreachable unless that node is changed or fails upstream.

#### Node: Send Welcome Email3
- **Type / Role:** `Gmail` — sends welcome email to attendee.
- **Configuration:**
  - To: `{{$json.Email}}`
  - Subject: “Welcome to the Event!”
  - HTML body: `Hello {{ First Name }}, your registration is confirmed.`
- **Credentials:** `gmailOAuth2` (must be configured)
- **Connections:** → Code in JavaScript4
- **Edge cases:**
  - Gmail API quota, auth expiry, or “from” restrictions.
  - Email sending failures should be handled; currently the downstream code assumes a result object.

#### Node: Code in JavaScript4
- **Type / Role:** `Code` — merges Gmail result with original registration record to update Sheets.
- **Configuration highlights:**
  - Pulls original registration from `$('Add Status & Event Date3').first().json`
  - Pulls Gmail send result from `$input.first().json` (expects `id`, `threadId`)
  - Outputs fields for sheet update, including:
    - `welcomeEmailSent: "True"` (string, not boolean)
    - `emailSentAt`, `emailId`, `emailThreadId`
    - Preserves `preEventEmailSent ` (with trailing space)
- **Connections:** → Update Welcome Email Status3
- **Edge cases:**
  - If Gmail node returns an error or different structure, `emailResult.id` may be undefined; code still sets welcomeEmailSent to True unconditionally.
  - Field types inconsistent (boolean vs string) may cause later comparisons to fail.

#### Node: Update Welcome Email Status3
- **Type / Role:** `Google Sheets` — update existing row matched by Email.
- **Configuration:**
  - Operation: **update**
  - Matching column: `Email`
  - Updates a broad set of columns, including:
    - `Status`, `Event Date`, `welcomeEmailSent`
    - `preEventEmailSent ` (note: the mapping references `$json["preEventEmailSent "]`)
  - **Potential mapping issue:** In the mapping, it uses `$json["preEventEmailSent "]` (with a trailing space inside the string), consistent with earlier nodes.
- **Connections:** none further
- **Edge cases:**
  - If multiple rows share the same Email (possible due to dedupe bug), update may affect an unexpected row.
  - Column header mismatches (including trailing spaces) can cause updates to silently fail or write into wrong columns.

#### Node: Send Admin Alert3
- **Type / Role:** `Gmail` — sends failure alert to admin.
- **Configuration:**
  - To: `user@example.com`
  - Subject includes `{{$json.firstName}} {{$json.lastName}}`
  - Body references `$json.firstName`, `$json.lastName`, `$json.email`
- **Connections:** none
- **Critical data mismatch:** The workflow uses `First Name`, `Last Name`, `Email` everywhere else. This node references `firstName/lastName/email` (different keys), so the alert email will likely contain blanks.
- **Also:** This node has **no Gmail credentials configured** in the JSON (unlike Send Welcome Email3), so it may fail unless credentials are set in UI.
- **Edge cases:** Auth issues, missing fields.

**Sticky notes covering this block:**
- “Step 2: Confirm Registration and Send Notifications” (Sticky Note12)

---

### Block 4 — Scheduled Reminder Candidate Selection & Routing
**Overview:** On schedule, retrieves all registrations, filters those needing reminders based on event date proximity and sent flags, and routes them into 3-day vs event-day reminder flows.

**Nodes involved:**
- Get Confirmed Aptitude Candidates2
- Filter Reminder Candidates2
- Switch Reminder Type2

#### Node: Get Confirmed Aptitude Candidates2
- **Type / Role:** `Google Sheets` — reads registrations for reminder processing.
- **Configuration:** reads from same doc/tab as other sheets nodes.
- **Connections:** → Filter Reminder Candidates2
- **Edge cases:**
  - Reads all rows; scaling concerns.
  - Despite node name, filtering is not done here.

#### Node: Filter Reminder Candidates2
- **Type / Role:** `Code` — selects rows that need reminders.
- **Key logic:**
  - Only `Status === 'confirmed'`
  - Parses `Event Date` in **DD-MM-YYYY** format.
  - Calculates `diffDays` between today (00:00) and event date (00:00).
  - Candidate conditions:
    - 3-day reminder: `diffDays === 3` AND `data['preEventEmailSent '] === false`
    - event-day reminder: `diffDays === 0` AND (`eventDayEmailSent ` missing OR false)
  - Adds:
    - `reminderType: '3-day' | 'event-day'`
    - `daysUntilEvent`
- **Connections:** → Switch Reminder Type2
- **Edge cases:**
  - If `Event Date` missing or malformed, `.split('-')` will throw and fail the run.
  - If Sheets stores booleans as strings (`"TRUE"/"FALSE"`), the strict comparisons to `false` will not work, causing duplicates or missed sends.
  - Trailing-space column names (`preEventEmailSent `, `eventDayEmailSent `) must match exactly.

#### Node: Switch Reminder Type2
- **Type / Role:** `Switch` — routes by `reminderType`.
- **Configuration:**
  - Output “3DayReminder” when `{{$json.reminderType}} == '3-day'`
  - Output “EventDayReminder” when `{{$json.reminderType}} == 'event-day'`
- **Connections:**
  - 3DayReminder → Loop 3-Day2
  - EventDayReminder → Loop Event-Day2
- **Edge cases:** If reminderType missing, item is dropped.

**Sticky notes covering this block:**
- “Step 3: Scheduled Trigger and Reminder Routing” (Sticky Note13)

---

### Block 5 — Reminder Sending, Throttling, and Sheet Updates
**Overview:** Sends reminder emails in batches, waits briefly, and updates reminder flags in Sheets.

**Nodes involved:**
- Loop 3-Day2
- Send 3-Day Reminder2
- Prepare 3-Day Update2
- Wait5
- Update 3-Day Status3
- Loop Event-Day2
- Send Event-Day Reminder2
- Prepare Event-Day Update2
- Wait6
- Update Event-Day Status2

#### Node: Loop 3-Day2
- **Type / Role:** `Split In Batches` — batch processing for 3-day reminders.
- **Configuration:** options empty (batch size not visible; n8n default is typically 1 unless set).
- **Connections:**
  - Output 1 (the “items” output) → Send 3-Day Reminder2
  - After update, the flow loops back via Update 3-Day Status3 → Loop 3-Day2
- **Edge cases:**
  - If batch size too high, Gmail rate limits may trigger.
  - If not configured, behavior depends on node defaults in your n8n version.

#### Node: Send 3-Day Reminder2
- **Type / Role:** `Gmail` — sends 3-day reminder.
- **Configuration:**
  - To: `{{$json.Email}}`
  - Subject: “Your Personalized Agenda for [Event Name]”
  - Body references `First Name` and `Interests`
- **Credentials:** not shown here; should be same Gmail OAuth2 configured in node UI.
- **Connections:** → Prepare 3-Day Update2
- **Edge cases:** same Gmail constraints as welcome email.

#### Node: Prepare 3-Day Update2
- **Type / Role:** `Code` — prepares a sheet update payload after email send.
- **Configuration highlights:**
  - Pulls registration data from `$('Loop 3-Day2').first().json`
  - Pulls Gmail result from `$input.first().json`
  - Outputs full record subset + flags:
    - `preEventEmailSent ` = true
    - `eventDayEmailSent ` = false
    - `emailId`, `sentAt`
- **Connections:** → Wait5
- **Edge cases:**
  - If Gmail result missing `id`, it still marks preEventEmailSent as true.

#### Node: Wait5
- **Type / Role:** `Wait` — throttling delay before updating sheet (and looping).
- **Configuration:** unit = seconds; duration not specified in JSON (must be set in UI or defaults).
- **Connections:** → Update 3-Day Status3
- **Edge cases:** Misconfigured waits can stall executions unexpectedly.

#### Node: Update 3-Day Status3
- **Type / Role:** `Google Sheets` — updates flags for 3-day reminders.
- **Configuration:**
  - Operation: update
  - Match on `Email`
  - Writes:
    - `preEventEmailSent ` and `eventDayEmailSent `
- **Connections:** → Loop 3-Day2 (to continue batches)
- **Edge cases:** duplicates in sheet cause ambiguous match.

#### Node: Loop Event-Day2
- **Type / Role:** `Split In Batches` — batch processing for event-day reminders.
- **Connections:** Output 1 → Send Event-Day Reminder2; loopback from Update Event-Day Status2 → Loop Event-Day2

#### Node: Send Event-Day Reminder2
- **Type / Role:** `Gmail` — sends event-day email.
- **Configuration:**
  - To: `{{$json.Email}}`
  - Subject: “📅 Event Day Details & Check-in Info”
  - Body includes placeholders for location and details (and includes emoji characters in body text).
- **Connections:** → Prepare Event-Day Update2

#### Node: Prepare Event-Day Update2
- **Type / Role:** `Code` — prepares sheet update after event-day email.
- **Configuration:**
  - Reads from `$('Loop Event-Day2').first().json`
  - Sets `eventDayEmailSent ` = true
  - Preserves `preEventEmailSent `
  - Adds `emailId`
- **Connections:** → Wait6

#### Node: Wait6
- **Type / Role:** `Wait` — throttling delay.
- **Configuration:** unit = seconds; duration not specified in JSON.
- **Connections:** → Update Event-Day Status2

#### Node: Update Event-Day Status2
- **Type / Role:** `Google Sheets` — updates only `eventDayEmailSent ` matched by Email.
- **Configuration:** update with matching column Email.
- **Connections:** → Loop Event-Day2
- **Edge cases:** same as other sheet updates.

**Sticky notes covering this block:**
- “Step 4: Send Reminders and Update Event Communication Status” (Sticky Note14)

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Event Registration Form3 | Form Trigger | Entry point: attendee registration form | — | Edit Fields4 | ## Event Registration Automation with Email Workflow… (Sticky Note10) |
| Event Registration Form3 | Form Trigger | Entry point: attendee registration form | — | Edit Fields4 | ## Step 1: Capture and Process Registration… (Sticky Note11) |
| Edit Fields4 | Set | Tag run source as `form` | Event Registration Form3 | Switch2 | ## Step 1: Capture and Process Registration… |
| Switch2 | Switch | Route to registration vs scheduled reminder branch | Edit Fields4, Edit Fields5 | Read Existing Registrations2; Get Confirmed Aptitude Candidates2 | ## Step 1: Capture and Process Registration… |
| Switch2 | Switch | Route to registration vs scheduled reminder branch | Edit Fields4, Edit Fields5 | Read Existing Registrations2; Get Confirmed Aptitude Candidates2 | ## Step 3: Scheduled Trigger and Reminder Routing… (Sticky Note13) |
| Read Existing Registrations2 | Google Sheets | Load existing registrations for dedupe | Switch2 | Check for Duplicate Email2 | ## Step 1: Capture and Process Registration… |
| Check for Duplicate Email2 | Code | Detect duplicate Email vs Sheet | Read Existing Registrations2 | If Not Duplicate2 | ## Step 1: Capture and Process Registration… |
| If Not Duplicate2 | If | Gate new registration insert | Check for Duplicate Email2 | Store Registration (Google Sheets)3 | ## Step 1: Capture and Process Registration… |
| Store Registration (Google Sheets)3 | Google Sheets | Append registration row | If Not Duplicate2 | Add Status & Event Date3 | ## Step 1: Capture and Process Registration… |
| Add Status & Event Date3 | Set | Add Status, Event Date, tracking flags | Store Registration (Google Sheets)3 | Check Registration Success3 | ## Step 2: Confirm Registration and Send Notifications… (Sticky Note12) |
| Check Registration Success3 | If | Route confirmed vs failure | Add Status & Event Date3 | Send Welcome Email3; Send Admin Alert3 | ## Step 2: Confirm Registration and Send Notifications… |
| Send Welcome Email3 | Gmail | Send welcome email to attendee | Check Registration Success3 | Code in JavaScript4 | ## Step 2: Confirm Registration and Send Notifications… |
| Code in JavaScript4 | Code | Merge email result + registration for sheet update | Send Welcome Email3 | Update Welcome Email Status3 | ## Step 2: Confirm Registration and Send Notifications… |
| Update Welcome Email Status3 | Google Sheets | Update row with welcome email tracking | Code in JavaScript4 | — | ## Step 2: Confirm Registration and Send Notifications… |
| Send Admin Alert3 | Gmail | Notify admin on registration failure | Check Registration Success3 | — | ## Step 2: Confirm Registration and Send Notifications… |
| Schedule Trigger2 | Schedule Trigger | Entry point: daily reminder run | — | Edit Fields5 | ## Event Registration Automation with Email Workflow… (Sticky Note10) |
| Schedule Trigger2 | Schedule Trigger | Entry point: daily reminder run | — | Edit Fields5 | ## Step 3: Scheduled Trigger and Reminder Routing… |
| Edit Fields5 | Set | Tag run source as `schedule` | Schedule Trigger2 | Switch2 | ## Step 3: Scheduled Trigger and Reminder Routing… |
| Get Confirmed Aptitude Candidates2 | Google Sheets | Read registrations for reminder evaluation | Switch2 | Filter Reminder Candidates2 | ## Step 3: Scheduled Trigger and Reminder Routing… |
| Filter Reminder Candidates2 | Code | Select + label reminder candidates | Get Confirmed Aptitude Candidates2 | Switch Reminder Type2 | ## Step 3: Scheduled Trigger and Reminder Routing… |
| Switch Reminder Type2 | Switch | Route to 3-day vs event-day reminder | Filter Reminder Candidates2 | Loop 3-Day2; Loop Event-Day2 | ## Step 4: Send Reminders and Update Event Communication Status… (Sticky Note14) |
| Loop 3-Day2 | Split In Batches | Batch processing of 3-day reminders | Switch Reminder Type2; Update 3-Day Status3 | Send 3-Day Reminder2 | ## Step 4: Send Reminders and Update Event Communication Status… |
| Send 3-Day Reminder2 | Gmail | Send 3-day reminder email | Loop 3-Day2 | Prepare 3-Day Update2 | ## Step 4: Send Reminders and Update Event Communication Status… |
| Prepare 3-Day Update2 | Code | Prepare sheet update payload post-send | Send 3-Day Reminder2 | Wait5 | ## Step 4: Send Reminders and Update Event Communication Status… |
| Wait5 | Wait | Throttle between sends/updates | Prepare 3-Day Update2 | Update 3-Day Status3 | ## Step 4: Send Reminders and Update Event Communication Status… |
| Update 3-Day Status3 | Google Sheets | Update preEventEmailSent / flags | Wait5 | Loop 3-Day2 | ## Step 4: Send Reminders and Update Event Communication Status… |
| Loop Event-Day2 | Split In Batches | Batch processing of event-day reminders | Switch Reminder Type2; Update Event-Day Status2 | Send Event-Day Reminder2 | ## Step 4: Send Reminders and Update Event Communication Status… |
| Send Event-Day Reminder2 | Gmail | Send event-day reminder email | Loop Event-Day2 | Prepare Event-Day Update2 | ## Step 4: Send Reminders and Update Event Communication Status… |
| Prepare Event-Day Update2 | Code | Prepare sheet update payload post-send | Send Event-Day Reminder2 | Wait6 | ## Step 4: Send Reminders and Update Event Communication Status… |
| Wait6 | Wait | Throttle between sends/updates | Prepare Event-Day Update2 | Update Event-Day Status2 | ## Step 4: Send Reminders and Update Event Communication Status… |
| Update Event-Day Status2 | Google Sheets | Update eventDayEmailSent flag | Wait6 | Loop Event-Day2 | ## Step 4: Send Reminders and Update Event Communication Status… |
| Sticky Note10 | Sticky Note | Documentation / setup guidance | — | — |  |
| Sticky Note11 | Sticky Note | Documentation | — | — |  |
| Sticky Note12 | Sticky Note | Documentation | — | — |  |
| Sticky Note13 | Sticky Note | Documentation | — | — |  |
| Sticky Note14 | Sticky Note | Documentation | — | — |  |

---

## 4. Reproducing the Workflow from Scratch

1) **Create the Google Sheet**
   1. Create a spreadsheet (e.g., “Event Registrations”), first row headers at minimum:
      - `First Name`, `Last Name`, `Email`, `Company`, `Interests`, `Status`, `Event Date`, `welcomeEmailSent`, `preEventEmailSent `, `eventDayEmailSent `
   2. Important: this workflow uses **trailing spaces** in two headers: `preEventEmailSent ` and `eventDayEmailSent `. Keep them exactly as-is if you want to reproduce behavior; otherwise rename everywhere and fix code/expressions.

2) **Create credentials in n8n**
   1. **Google Sheets OAuth2** credential with access to the spreadsheet.
   2. **Gmail OAuth2** credential authorized to send emails.

3) **Create Entry Point A (Form submission)**
   1. Add **Form Trigger** node named **“Event Registration Form3”**
      - Title: “Event Registration”
      - Description: “Register for our upcoming event”
      - Add fields:
        - First Name (required)
        - Last Name (required)
        - Email (type email, required)
        - Company (required)
        - Interests (dropdown required; options: n8n, automation, ai-agent, digital-worker)
   2. Add **Set** node named **“Edit Fields4”**
      - Include Other Fields: ON
      - Add field: `source` (string) = `form`
   3. Connect **Form Trigger → Edit Fields4**

4) **Create Entry Point B (Scheduled daily run)**
   1. Add **Schedule Trigger** node named **“Schedule Trigger2”**
      - Set it to run daily at **09:00** (or “every day at 9” depending on UI).
   2. Add **Set** node named **“Edit Fields5”**
      - Add field: `source` (string) = `schedule`
   3. Connect **Schedule Trigger2 → Edit Fields5**

5) **Add routing switch**
   1. Add **Switch** node named **“Switch2”**
      - Rule 1: `{{$json.source}} equals "form"`
      - Rule 2: `{{$json.source}} equals "schedule"`
   2. Connect **Edit Fields4 → Switch2** and **Edit Fields5 → Switch2**

6) **Build the registration dedupe + append path**
   1. Add **Google Sheets** node “Read Existing Registrations2”
      - Document: your spreadsheet
      - Sheet: the registrations tab
      - Operation: read/get all rows
   2. Add **Code** node “Check for Duplicate Email2” with logic:
      - Read form data from the form node, normalize email, compare with all sheet rows, output `isDuplicate`.
   3. Add **If** node “If Not Duplicate2”
      - Condition: boolean `{{$json.isDuplicate}}`
      - To match the node name intent, configure it so that **it continues only when NOT duplicate** (e.g., “isDuplicate is false”). In the provided JSON it’s currently the opposite; reproduce that only if you want identical behavior.
   4. Add **Google Sheets** node “Store Registration (Google Sheets)3”
      - Operation: Append
      - Map columns: First Name, Last Name, Email, Company, Interests
   5. Connect: **Switch2(form) → Read Existing Registrations2 → Check for Duplicate Email2 → If Not Duplicate2 → Store Registration**

7) **Add confirmation enrichment and welcome email**
   1. Add **Set** node “Add Status & Event Date3”
      - Set:
        - Status = `confirmed`
        - `Event Date` = `20-12-2025` (DD-MM-YYYY)
        - `preEventEmailSent ` (boolean) = false
      - Copy through other form fields.
   2. Add **If** node “Check Registration Success3”
      - Condition: `{{$json.Status}} equals "confirmed"`
   3. Add **Gmail** node “Send Welcome Email3”
      - Credential: your Gmail OAuth2
      - To: `{{$json.Email}}`
      - Subject: `Welcome to the Event!`
      - HTML body referencing `{{$json['First Name']}}`
   4. Add **Code** node “Code in JavaScript4”
      - Merge original registration data from “Add Status & Event Date3” + Gmail response and set `welcomeEmailSent = "True"`, plus timestamps and ids.
   5. Add **Google Sheets** node “Update Welcome Email Status3”
      - Operation: Update
      - Match on column: `Email`
      - Update columns including Status, Event Date, welcomeEmailSent, preEventEmailSent , etc.
   6. Connect: **Store Registration → Add Status & Event Date3 → Check Registration Success3 → Send Welcome Email3 → Code in JavaScript4 → Update Welcome Email Status3**

8) **Add admin alert path**
   1. Add **Gmail** node “Send Admin Alert3”
      - Credential: Gmail OAuth2
      - To: admin email (replace `user@example.com`)
      - Use subject/body; ensure it references correct keys (`First Name`, `Last Name`, `Email`) if you want it to be populated.
   2. Connect: **Check Registration Success3 (false output) → Send Admin Alert3**

9) **Build the scheduled reminder selection path**
   1. Add **Google Sheets** node “Get Confirmed Aptitude Candidates2”
      - Read all rows from the registrations sheet.
   2. Add **Code** node “Filter Reminder Candidates2”
      - Parse `Event Date` DD-MM-YYYY
      - Compute diffDays
      - Filter:
        - 3-day: diffDays == 3 AND preEventEmailSent  == false
        - event-day: diffDays == 0 AND (eventDayEmailSent  missing/false)
      - Add `reminderType`
   3. Add **Switch** node “Switch Reminder Type2”
      - If `reminderType == "3-day"` route to 3-day path
      - If `reminderType == "event-day"` route to event-day path
   4. Connect: **Switch2(schedule) → Get Confirmed Aptitude Candidates2 → Filter Reminder Candidates2 → Switch Reminder Type2**

10) **3-day reminder flow (batched)**
   1. Add **Split In Batches** “Loop 3-Day2” (set batch size as desired, e.g., 10)
   2. Add **Gmail** “Send 3-Day Reminder2” (To: Email, personalize body)
   3. Add **Code** “Prepare 3-Day Update2” to set `preEventEmailSent ` = true (and keep Email for matching)
   4. Add **Wait** “Wait5” (configure e.g. 1–5 seconds)
   5. Add **Google Sheets** “Update 3-Day Status3”
      - Operation: Update, match on Email, write `preEventEmailSent ` and `eventDayEmailSent `
   6. Connect: **Switch Reminder Type2(3-day) → Loop 3-Day2 → Send 3-Day Reminder2 → Prepare 3-Day Update2 → Wait5 → Update 3-Day Status3 → Loop 3-Day2**

11) **event-day reminder flow (batched)**
   1. Add **Split In Batches** “Loop Event-Day2”
   2. Add **Gmail** “Send Event-Day Reminder2”
   3. Add **Code** “Prepare Event-Day Update2” to set `eventDayEmailSent ` = true
   4. Add **Wait** “Wait6”
   5. Add **Google Sheets** “Update Event-Day Status2” (update eventDayEmailSent  by matching Email)
   6. Connect: **Switch Reminder Type2(event-day) → Loop Event-Day2 → Send Event-Day Reminder2 → Prepare Event-Day Update2 → Wait6 → Update Event-Day Status2 → Loop Event-Day2**

12) **Activate workflow and test**
   - Test form submission: confirm append + welcome email + updated flags.
   - Test schedule branch: set Event Date to today+3 and today to validate both reminder types.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Event Registration Automation with Email Workflow…” including setup steps 1–10 | Sticky Note10 (embedded in workflow canvas) |
| Step 1 explanation (capture, switch validation, dedupe, store) | Sticky Note11 |
| Step 2 explanation (confirm, welcome email, status update, admin alert) | Sticky Note12 |
| Step 3 explanation (schedule trigger, fetch, compute days, route) | Sticky Note13 |
| Step 4 explanation (batch sending, reminders, update flags) | Sticky Note14 |

**Key implementation cautions (cross-cutting):**
- The workflow relies on **exact column names**, including **trailing spaces** (`preEventEmailSent `, `eventDayEmailSent `). Normalize these if possible to avoid subtle bugs.
- `If Not Duplicate2` is currently configured in a way that likely **inverts** the intended logic (it proceeds when `isDuplicate` is true). Adjust to “isDuplicate is false” to prevent duplicates.
- Admin alert node references `firstName/lastName/email` but upstream fields are `First Name/Last Name/Email`; update expressions to match.
- Reminder filter assumes boolean flags are real booleans; Google Sheets often returns strings. Consider coercion in code (e.g., treat `"TRUE"`/`"FALSE"`).