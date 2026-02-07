Automate Zoom attendance follow-ups with recordings & Google Sheets tracking

https://n8nworkflows.xyz/workflows/automate-zoom-attendance-follow-ups-with-recordings---google-sheets-tracking-12050


# Automate Zoom attendance follow-ups with recordings & Google Sheets tracking

Disclaimer: Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:** This workflow runs **hourly** to detect attendance issues in recent Zoom meetings, then **sends follow-up emails** to impacted participants (no-show / early-leaver / partial attendance), includes **recording links** and **handout materials**, and finally **logs the follow-up activity to Google Sheets** for tracking.

**Typical use cases**
- Automated post-webinar follow-up for registrants who didn’t attend fully
- Training sessions where attendees need recordings/materials if they missed content
- Building an audit trail of follow-ups for operations or customer success

### 1.1 Scheduled Start
Runs on a schedule (every hour).

### 1.2 Zoom Meetings Retrieval & Iteration
Fetches a list of meetings, then iterates meeting-by-meeting.

### 1.3 Attendance Fetch & Participant Iteration
Pulls participant report data for a meeting and iterates participant-by-participant.

### 1.4 Attendance Evaluation & Branching
Classifies each participant (no-show/early-leaver/partial/full) and decides whether to follow up.

### 1.5 Enrichment (Recording + Handout) & Email Composition
Fetches recording info, fetches a handout file from Google Drive, prepares subject and data.

### 1.6 Notification & Logging
Sends email via SMTP and appends an entry to Google Sheets.

---

## 2. Block-by-Block Analysis

### Block 1.1 — Scheduled Start

**Overview:** Triggers workflow executions on a fixed interval so recent Zoom meetings can be checked continuously without manual intervention.

**Nodes involved:**
- Schedule Trigger
- Sticky Note - Start (documentation)

#### Node: Schedule Trigger
- **Type / role:** `n8n-nodes-base.scheduleTrigger` — time-based trigger (entry point).
- **Key configuration:**
  - Runs on an **interval of 1 hour** (`rule.interval.field = hours`).
- **Connections:**
  - **Output →** Get Recent Meetings
- **Version notes:** typeVersion **1.2**.
- **Edge cases / failures:**
  - If hourly is too frequent or too infrequent for your meeting cadence, you may miss desired windows or reprocess meetings repeatedly (there is no deduplication in this workflow).

#### Node: Sticky Note - Start
- **Type / role:** `stickyNote` — documentation only, no data flow.
- **Content highlights:** workflow runs hourly; advises adjusting schedule.
- **Covered nodes (intended):** Schedule Trigger.

---

### Block 1.2 — Zoom Meetings Retrieval & Iteration

**Overview:** Fetches meetings from Zoom and splits them into individual items so each meeting can be processed independently.

**Nodes involved:**
- Get Recent Meetings
- Split Meetings
- Sticky Note - Zoom (documentation)

#### Node: Get Recent Meetings
- **Type / role:** `n8n-nodes-base.zoom` — Zoom API wrapper to list meetings.
- **Key configuration:**
  - **Operation:** `getAll`
  - **Authentication:** OAuth2 (`zoomOAuth2Api`)
  - **Filters:** none configured in the node JSON (relies on Zoom defaults / node behavior).
- **Connections:**
  - **Input ←** Schedule Trigger
  - **Output →** Split Meetings
- **Version notes:** typeVersion **1**.
- **Edge cases / failures:**
  - OAuth scope issues (needs appropriate scopes depending on account and endpoint).
  - Pagination/large meeting lists: `getAll` can return many meetings; be mindful of execution time.
  - The sticky note claims “last 24 hours”, but the node configuration shown does not explicitly enforce that—verify the Zoom node behavior or add filters.

#### Node: Split Meetings
- **Type / role:** `n8n-nodes-base.itemLists` — transforms an array field into multiple items.
- **Key configuration:**
  - **Field to split out:** `meetings`
- **Connections:**
  - **Input ←** Get Recent Meetings
  - **Output →** Get Meeting Details
- **Version notes:** typeVersion **3**.
- **Edge cases / failures:**
  - If the input doesn’t contain a `meetings` array (or is empty), downstream nodes won’t run or may run with no items.
  - Data shape depends on Zoom node output; confirm the list field name is exactly `meetings`.

#### Node: Sticky Note - Zoom
- **Type / role:** `stickyNote` — documentation only.
- **Content highlights:** requires Zoom OAuth2; mentions “last 24 hours”.
- **Covered nodes (intended):** Get Recent Meetings.

---

### Block 1.3 — Attendance Fetch & Participant Iteration

**Overview:** For each meeting, fetches meeting metadata and then retrieves the attendance/participants report using the Zoom Reports API endpoint. Participants are split into per-person items.

**Nodes involved:**
- Get Meeting Details
- Get Attendance Report
- Split Participants
- Sticky Note - Attendance (documentation)

#### Node: Get Meeting Details
- **Type / role:** `n8n-nodes-base.zoom` — retrieves a specific meeting’s details.
- **Key configuration:**
  - **Operation:** `get`
  - **Meeting ID expression:** `={{ $json.id }}`
  - **Authentication:** OAuth2 (`zoomOAuth2Api`)
- **Connections:**
  - **Input ←** Split Meetings
  - **Output →** Get Attendance Report
- **Version notes:** typeVersion **1**.
- **Edge cases / failures:**
  - If `$json.id` is missing (unexpected meeting list shape), request fails.
  - Access restrictions: some meeting details may not be accessible depending on host/account permissions.

#### Node: Get Attendance Report
- **Type / role:** `n8n-nodes-base.httpRequest` — direct call to Zoom REST API (Reports endpoint).
- **Key configuration:**
  - **URL:** `https://api.zoom.us/v2/report/meetings/{{ $json.id }}/participants`
  - **Auth:** “predefinedCredentialType” using `zoomOAuth2Api` credential.
  - Redirect option object exists but has no meaningful custom behavior here.
- **Connections:**
  - **Input ←** Get Meeting Details
  - **Output →** Split Participants
- **Version notes:** typeVersion **4.2**.
- **Edge cases / failures:**
  - **Zoom Reports API constraints:** reports endpoints often require a **Pro/Business** plan and correct scopes (commonly `report:read:meeting`).
  - Reports may not be available immediately after meeting ends (processing delay).
  - If meeting is too old or not eligible, Zoom may return errors or empty participant lists.
  - Rate limits can occur if many meetings/participants are processed hourly.

#### Node: Split Participants
- **Type / role:** `n8n-nodes-base.itemLists` — splits `participants` array into items.
- **Key configuration:**
  - **Field to split out:** `participants`
- **Connections:**
  - **Input ←** Get Attendance Report
  - **Output →** Evaluate Attendance
- **Version notes:** typeVersion **3**.
- **Edge cases / failures:**
  - If the report response uses a different field name (e.g., `participants` missing), split will produce 0 items.
  - Large participant lists can increase execution time.

#### Node: Sticky Note - Attendance
- **Type / role:** `stickyNote` — documentation only.
- **Content highlights:** join/leave times, duration, registration info, email addresses.
- **Covered nodes (intended):** Get Attendance Report / Split Participants.

---

### Block 1.4 — Attendance Evaluation & Branching

**Overview:** Computes attendance status for each participant relative to meeting duration and flags whether a follow-up should be sent.

**Nodes involved:**
- Evaluate Attendance
- Needs Follow-up?
- Sticky Note - Logic (documentation)

#### Node: Evaluate Attendance
- **Type / role:** `n8n-nodes-base.code` — custom JS logic to classify attendance.
- **Key configuration (logic summary):**
  - Reads current **participant** from `$input.item.json`.
  - Reads **meeting duration** from `$('Get Meeting Details').item.json.duration` (defaults to 60 minutes if missing).
  - Reads **participant duration** from `participant.duration` (defaults to 0).
  - Classification:
    - `no-show` if duration == 0
    - `early-leaver` if duration < 50% of meeting duration
    - `partial-attendance` if duration < 80% of meeting duration
    - else `attended`
  - Adds computed fields:
    - `attendanceStatus`, `sendFollowUp`, `meetingTopic`, `meetingId`, `meetingDuration`,
    - `attendancePercentage = round(participantDuration / meetingDuration * 100)`
- **Connections:**
  - **Input ←** Split Participants
  - **Output →** Needs Follow-up?
- **Version notes:** typeVersion **2**.
- **Edge cases / failures:**
  - **Cross-node item referencing risk:** `$('Get Meeting Details').item.json...` assumes a compatible item context. In n8n, mixing “current item” with `.item` from a different node can misalign if multiple items are in flight. You may need to use paired item linking or `.first()` patterns depending on n8n version and execution mode.
  - Division by zero is avoided via default meetingDuration=60, but if duration is explicitly 0, percentage becomes invalid (consider guarding).
  - Participant `duration` units must match meeting duration units (assumed minutes).

#### Node: Needs Follow-up?
- **Type / role:** `n8n-nodes-base.if` — conditional routing.
- **Key configuration:**
  - Condition: boolean check `={{ $json.sendFollowUp }}` equals `true`
- **Connections:**
  - **Input ←** Evaluate Attendance
  - **True output →** Get Recording Link
  - **False output:** not connected (participants with full attendance are ignored).
- **Version notes:** typeVersion **2**.
- **Edge cases / failures:**
  - If `sendFollowUp` is missing/null, condition evaluates false and no email is sent.

#### Node: Sticky Note - Logic
- **Type / role:** `stickyNote` — documentation only.
- **Content highlights:** describes thresholds and encourages adjustment.
- **Covered nodes (intended):** Evaluate Attendance / Needs Follow-up?

---

### Block 1.5 — Enrichment (Recording + Handout) & Email Composition

**Overview:** For participants needing follow-up, the workflow fetches the meeting’s recording information, fetches handout material from Google Drive, then prepares the email subject and URLs.

**Nodes involved:**
- Get Recording Link
- Get Handout Materials
- Prepare Email Data
- Sticky Note - Resources (documentation)

#### Node: Get Recording Link
- **Type / role:** `n8n-nodes-base.httpRequest` — calls Zoom recordings endpoint.
- **Key configuration:**
  - **URL:** `https://api.zoom.us/v2/meetings/{{ $json.meetingId }}/recordings`
  - **Auth:** predefined credential type `zoomOAuth2Api`
- **Connections:**
  - **Input ←** Needs Follow-up? (true branch)
  - **Output →** Get Handout Materials
- **Version notes:** typeVersion **4.2**.
- **Edge cases / failures:**
  - Recordings may not exist, may still be processing, or may require specific Zoom settings.
  - Required OAuth scopes typically include `recording:read`.
  - Response shape differs depending on account and cloud recording configuration (e.g., `recording_files` array).

#### Node: Get Handout Materials
- **Type / role:** `n8n-nodes-base.googleDrive` — retrieves a file from Google Drive.
- **Key configuration:**
  - **Operation:** `get`
  - **Important missing detail:** the node JSON does not show a **File ID** parameter being set, so this node as-is is likely incomplete and will fail until configured.
- **Connections:**
  - **Input ←** Get Recording Link
  - **Output →** Prepare Email Data
- **Credentials:** Google Drive OAuth2.
- **Version notes:** typeVersion **3**.
- **Edge cases / failures:**
  - Missing fileId or insufficient Drive permissions.
  - If binary download is not enabled/available, attachments may not be present for the Email node.

#### Node: Prepare Email Data
- **Type / role:** `n8n-nodes-base.code` — builds the final email metadata and URLs.
- **Key configuration (logic summary):**
  - Hard-coded placeholder:  
    `nextSessionLink = 'https://zoom.us/meeting/register/YOUR_NEXT_SESSION_ID'`
  - Constructs:
    - `recordingUrl` from:
      - `$('Get Recording Link').item.json.share_url` OR
      - first `recording_files[0].download_url` OR
      - `'Recording processing'`
    - `handoutUrl` from:
      - `$('Get Handout Materials').item.json.webContentLink` OR `'Materials URL'`
    - `emailSubject` based on meeting topic + attendance status
  - Merges data from `$('Evaluate Attendance').item.json`
- **Connections:**
  - **Input ←** Get Handout Materials
  - **Output →** Send Follow-up Email
- **Version notes:** typeVersion **2**.
- **Edge cases / failures:**
  - Same **cross-node item referencing** risk as above (`.item.json` from other nodes) if item pairing is not guaranteed.
  - `share_url` may not exist at top-level; often Zoom returns `share_url` per recording file or provides `share_url` depending on endpoint—validate with your Zoom account response.
  - Placeholder links must be replaced to avoid sending incorrect URLs.

#### Node: Sticky Note - Resources
- **Type / role:** `stickyNote` — documentation only.
- **Content highlights:** configure Drive file ID; suggests using a database for next session registration links.
- **Covered nodes (intended):** Get Handout Materials / Prepare Email Data.

---

### Block 1.6 — Notification & Logging

**Overview:** Sends the follow-up email (optionally with Drive file as attachment) and appends a log row to a Google Sheet for auditing.

**Nodes involved:**
- Send Follow-up Email
- Log to Google Sheets
- Sticky Note - Email (documentation)
- Sticky Note - Logging (documentation)

#### Node: Send Follow-up Email
- **Type / role:** `n8n-nodes-base.emailSend` — sends email through SMTP.
- **Key configuration:**
  - **Subject:** `={{ $json.emailSubject }}`
  - **Attachments:** `={{ $('Get Handout Materials').item.binary }}` (expects binary data output from Drive node)
  - SMTP credentials required.
  - **Email body / recipients:** not shown in the provided JSON; must be configured in node UI (critical).
- **Connections:**
  - **Input ←** Prepare Email Data
  - **Output →** Log to Google Sheets
- **Version notes:** typeVersion **2.1**.
- **Edge cases / failures:**
  - If no recipient email field is mapped, the node will fail or send nowhere.
  - Attachment expression will fail or be empty if Drive node does not output binary.
  - SMTP auth errors, provider throttling, spam rules, or invalid “from” configuration.

#### Node: Log to Google Sheets
- **Type / role:** `n8n-nodes-base.googleSheets` — appends a row to a sheet.
- **Key configuration:**
  - **Operation:** append
  - **Document ID:** `YOUR_GOOGLE_SHEET_ID` (placeholder)
  - **Sheet name:** `Attendance_Log`
  - **Mapping:** `autoMapInputData` (writes whatever fields exist in current JSON, matching columns by name when possible)
- **Connections:**
  - **Input ←** Send Follow-up Email
  - **Output:** none
- **Version notes:** typeVersion **4.5**.
- **Edge cases / failures:**
  - Sheet/tab name mismatch or missing spreadsheet ID.
  - Column mismatch: auto-map requires headers that match incoming keys, otherwise data may go into unexpected columns or be dropped.
  - Google API quota limits.

#### Node: Sticky Note - Email
- **Type / role:** `stickyNote` — documentation only.
- **Content highlights:** SMTP required; template adapts based on status and percentage.
- **Covered nodes (intended):** Send Follow-up Email / Prepare Email Data.

#### Node: Sticky Note - Logging
- **Type / role:** `stickyNote` — documentation only.
- **Content highlights:** set sheet ID; audit trail fields.
- **Covered nodes (intended):** Log to Google Sheets.

---

### Additional Documentation Node (Global Canvas Note)

#### Node: Sticky Note (large intro)
- **Type / role:** `stickyNote` — documentation only (no connections).
- **Content highlights:**
  - Describes workflow features and setup.
  - Mentions a **“Global Configuration” node (first node)**, but **no such node exists in the provided workflow**. This is an inconsistency: configuration must be done directly in nodes (Sheets documentId, Drive fileId, nextSessionLink, etc.).
  - States Zoom scopes: `report:read:meeting`, `recording:read`.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Schedule Trigger | scheduleTrigger | Hourly workflow start | — | Get Recent Meetings | ## Workflow Start; This workflow runs hourly to check recent Zoom meetings for attendance issues. Configure the schedule trigger based on when your meetings typically end. |
| Sticky Note - Start | stickyNote | Documentation | — | — | ## Workflow Start; This workflow runs hourly to check recent Zoom meetings for attendance issues. Configure the schedule trigger based on when your meetings typically end. |
| Get Recent Meetings | zoom | List recent meetings | Schedule Trigger | Split Meetings | ## Zoom Connection Required; Connect your Zoom OAuth2 credentials here to fetch meeting data. This node retrieves meetings from the last 24 hours. |
| Sticky Note - Zoom | stickyNote | Documentation | — | — | ## Zoom Connection Required; Connect your Zoom OAuth2 credentials here to fetch meeting data. This node retrieves meetings from the last 24 hours. |
| Split Meetings | itemLists | Split meetings array into items | Get Recent Meetings | Get Meeting Details |  |
| Get Meeting Details | zoom | Fetch per-meeting metadata | Split Meetings | Get Attendance Report |  |
| Get Attendance Report | httpRequest | Fetch meeting participants report | Get Meeting Details | Split Participants | ## Attendance Data; Fetches participant data including: Join/leave times; Duration; Registration info; Email addresses |
| Sticky Note - Attendance | stickyNote | Documentation | — | — | ## Attendance Data; Fetches participant data including: Join/leave times; Duration; Registration info; Email addresses |
| Split Participants | itemLists | Split participants array into items | Get Attendance Report | Evaluate Attendance |  |
| Evaluate Attendance | code | Compute attendance classification + follow-up flag | Split Participants | Needs Follow-up? | ## Attendance Logic; Classifies participants as: No-show(0); Early-leaver(<50%); Partial(50-80%); Full(>80%). Adjust thresholds in the code as needed. |
| Sticky Note - Logic | stickyNote | Documentation | — | — | ## Attendance Logic; Classifies participants as: No-show(0); Early-leaver(<50%); Partial(50-80%); Full(>80%). Adjust thresholds in the code as needed. |
| Needs Follow-up? | if | Branch on sendFollowUp | Evaluate Attendance | Get Recording Link (true) |  |
| Get Recording Link | httpRequest | Fetch meeting recording info | Needs Follow-up? | Get Handout Materials |  |
| Get Handout Materials | googleDrive | Fetch handout file | Get Recording Link | Prepare Email Data | ## Configure Resources; Google Drive: Add the file ID of your handout materials. Database: Store your next session registration links in a database or configure them here |
| Sticky Note - Resources | stickyNote | Documentation | — | — | ## Configure Resources; Google Drive: Add the file ID of your handout materials. Database: Store your next session registration links in a database or configure them here |
| Prepare Email Data | code | Build recording/handout/next session URLs + subject | Get Handout Materials | Send Follow-up Email |  |
| Send Follow-up Email | emailSend | Send SMTP follow-up email (with attachment) | Prepare Email Data | Log to Google Sheets | ## Email Configuration; SMTP Credentials Required. The email template automatically adapts based on: No-show vs early-leaver status; Attendance percentage; Meeting details |
| Sticky Note - Email | stickyNote | Documentation | — | — | ## Email Configuration; SMTP Credentials Required. The email template automatically adapts based on: No-show vs early-leaver status; Attendance percentage; Meeting details |
| Log to Google Sheets | googleSheets | Append follow-up log row | Send Follow-up Email | — | ## Tracking & Analytics; Google Sheets: Configure the sheet ID to log all follow-ups sent. Creates an audit trail of who received follow-ups, status, when sent, meeting details |
| Sticky Note - Logging | stickyNote | Documentation | — | — | ## Tracking & Analytics; Google Sheets: Configure the sheet ID to log all follow-ups sent. Creates an audit trail of who received follow-ups, status, when sent, meeting details |
| Sticky Note | stickyNote | Canvas overview / setup notes | — | — | # 🚀 Zoom Attendance Evaluator with Auto Follow-up; Monitors meetings; Calculates attendance; Fetches recordings/handouts; Sends emails; Logs to Sheets; Mentions “Global Configuration” node (not present). |

---

## 4. Reproducing the Workflow from Scratch

1) **Create “Schedule Trigger” (Schedule Trigger node)**
   - Set **Interval** to **every 1 hour**.
   - Set workflow timezone as needed (example in workflow: `America/New_York`).

2) **Create “Get Recent Meetings” (Zoom node)**
   - Operation: **Get All** (meetings).
   - Authentication: **OAuth2**.
   - Configure **Zoom OAuth2 credentials**:
     - Ensure scopes include at least: `report:read:meeting`, `recording:read` (and any others required by your Zoom app type/account).
   - Connect: **Schedule Trigger → Get Recent Meetings**.
   - (Recommended) Add filters/time window if you want “last 24 hours” explicitly (depends on node capability).

3) **Create “Split Meetings” (Item Lists node)**
   - Operation mode: **Split Out Items** (field to split).
   - Field to split out: `meetings`.
   - Connect: **Get Recent Meetings → Split Meetings**.

4) **Create “Get Meeting Details” (Zoom node)**
   - Operation: **Get** meeting.
   - Meeting ID: expression `={{ $json.id }}`.
   - Connect: **Split Meetings → Get Meeting Details**.

5) **Create “Get Attendance Report” (HTTP Request node)**
   - Method: GET
   - URL: `https://api.zoom.us/v2/report/meetings/{{ $json.id }}/participants`
   - Authentication: **Predefined Credential Type**
   - Credential Type: **Zoom OAuth2 API** (select same Zoom OAuth2 credential)
   - Connect: **Get Meeting Details → Get Attendance Report**.

6) **Create “Split Participants” (Item Lists node)**
   - Field to split out: `participants`
   - Connect: **Get Attendance Report → Split Participants**.

7) **Create “Evaluate Attendance” (Code node)**
   - Paste logic equivalent to:
     - Read participant duration
     - Read meeting duration from “Get Meeting Details”
     - Compute `attendanceStatus`, `sendFollowUp`, `attendancePercentage`, and include `meetingTopic`, `meetingId`.
   - Connect: **Split Participants → Evaluate Attendance**.
   - (Recommended hardening) Ensure meeting/participant item pairing is correct; if not, adapt to use the current meeting item context more safely (e.g., merge meeting data into each participant before evaluating).

8) **Create “Needs Follow-up?” (IF node)**
   - Condition: Boolean `={{ $json.sendFollowUp }}` is **true**
   - Connect: **Evaluate Attendance → Needs Follow-up?**
   - Use the **true** output path for follow-up steps.

9) **Create “Get Recording Link” (HTTP Request node)**
   - Method: GET
   - URL: `https://api.zoom.us/v2/meetings/{{ $json.meetingId }}/recordings`
   - Auth: Predefined credential type → **Zoom OAuth2**
   - Connect: **Needs Follow-up? (true) → Get Recording Link**.

10) **Create “Get Handout Materials” (Google Drive node)**
   - Operation: **Get**
   - Configure:
     - **File ID**: set your handout file ID (this is required; it’s not defined in the provided JSON).
     - If you want to attach it to email, ensure the node is configured to **download file content** / output **binary** (depending on node options).
   - Credentials: **Google Drive OAuth2**
   - Connect: **Get Recording Link → Get Handout Materials**.

11) **Create “Prepare Email Data” (Code node)**
   - Build:
     - `recordingUrl` from recording response (choose correct field(s) based on real Zoom response)
     - `handoutUrl` from Drive response (e.g., `webContentLink`)
     - `nextSessionLink` (replace placeholder with your real source: DB/Sheet/Calendar)
     - `emailSubject`
   - Connect: **Get Handout Materials → Prepare Email Data**.

12) **Create “Send Follow-up Email” (Email Send node)**
   - Configure **SMTP credentials** (Gmail/SendGrid/custom SMTP).
   - Set:
     - **To:** map from participant email field (commonly `={{ $json.email }}` depending on Zoom report payload)
     - **Subject:** `={{ $json.emailSubject }}`
     - **Body:** compose with fields like `attendanceStatus`, `attendancePercentage`, `recordingUrl`, `handoutUrl`, `nextSessionLink`
     - **Attachments:** expression `={{ $('Get Handout Materials').item.binary }}` (only works if Drive node outputs binary)
   - Connect: **Prepare Email Data → Send Follow-up Email**.

13) **Create “Log to Google Sheets” (Google Sheets node)**
   - Operation: **Append**
   - Spreadsheet ID: set your real **Google Sheet ID**
   - Sheet/Tab name: `Attendance_Log` (create it in the spreadsheet)
   - Mapping: **Auto-map input data** (ensure header columns match your JSON keys), or manually map.
   - Credentials: **Google Sheets OAuth2**
   - Connect: **Send Follow-up Email → Log to Google Sheets**.

14) **(Optional but recommended) Add deduplication**
   - Store processed meeting IDs + participant emails + date in a datastore (Sheets/DB) to avoid re-emailing every hour.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| The large canvas note mentions a “Global Configuration” node, but it is not present in this workflow JSON. Configuration must be done directly in nodes (Sheet ID, Drive File ID, nextSessionLink, etc.). | Applies to overall setup |
| Zoom OAuth2 scopes suggested: `report:read:meeting`, `recording:read`. | Zoom app configuration |
| Placeholders must be replaced: `YOUR_GOOGLE_SHEET_ID`, `YOUR_NEXT_SESSION_ID`, and missing Google Drive file ID. | Prevent runtime failures / wrong emails |
| Consider Zoom report availability delays (meeting reports may appear minutes/hours after end). | Avoid false “no-show” follow-ups |