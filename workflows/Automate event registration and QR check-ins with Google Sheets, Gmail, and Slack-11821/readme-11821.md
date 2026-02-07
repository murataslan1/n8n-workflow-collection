Automate event registration and QR check-ins with Google Sheets, Gmail, and Slack

https://n8nworkflows.xyz/workflows/automate-event-registration-and-qr-check-ins-with-google-sheets--gmail--and-slack-11821


# Automate event registration and QR check-ins with Google Sheets, Gmail, and Slack

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Automate event registration and QR check-ins with Google Sheets, Gmail, and Slack

This workflow automates **event participant registration** and **on-site QR check-ins** using two webhook entry points. It generates a **unique ticket ID**, produces a **QR code**, stores participant records in **Google Sheets**, sends confirmation emails through **Gmail**, and manages check-ins by validating QR payloads, preventing duplicates, optionally notifying staff about **VIP arrivals** in **Slack**, and returning a JSON response to the scanner/client.

### 1.1 Registration Intake (Webhook → Normalize fields)
Receives participant registration data via HTTP POST, normalizes it, and generates a unique ticket ID.

### 1.2 Persistence + Ticket Delivery (Google Sheets → QR generation → Gmail)
Appends the participant record to a “Participants” sheet, generates a QR image via an external API, and emails it as an attachment.

### 1.3 Check-in Intake + QR Validation (Webhook → Decode → Gate)
Receives scanned QR data, base64-decodes it, validates format, and routes invalid scans to an error response.

### 1.4 Ticket Lookup + Duplicate Prevention (Sheets lookup → Validation)
Looks up the ticket in Google Sheets, verifies it exists, and blocks already checked-in tickets.

### 1.5 Check-in Commit + VIP Handling (Update sheet → Slack VIP alert)
Marks valid tickets as checked in, and if VIP, posts an alert in Slack.

### 1.6 Response Construction (Build JSON → Respond)
Builds a success/denied JSON payload and returns it to the requesting client.

---

## 2. Block-by-Block Analysis

### Block A — Workflow Context / On-canvas Documentation
**Overview:** Provides purpose, audience, and setup instructions directly in the canvas.  
**Nodes involved:** `Sticky Note`, `Sticky Note1`, `Sticky Note2`, `Sticky Note3`, `Sticky Note4`

#### Sticky Note (Sticky Note node)
- **Type / role:** Sticky Note; documentation only.
- **Configuration:** Describes the full workflow: registration + check-in, setup steps, and required services.
- **Connections:** None.
- **Failure modes:** None (non-executable).

#### Sticky Note1 / Sticky Note2 / Sticky Note3 / Sticky Note4
- **Type / role:** Sticky Note; block labels for steps 1–4.
- **Connections:** None.
- **Failure modes:** None.

---

### Block B — Registration: Receive → Create Ticket → Store in Sheets
**Overview:** Accepts registration payload, generates a ticket ID, and appends a participant row to Google Sheets.  
**Nodes involved:** `Registration Webhook`, `Create Ticket Data`, `Save to Participants Sheet`

#### Registration Webhook
- **Type / role:** `Webhook` (entry point). Receives registration POST requests.
- **Key configuration:**
  - **Path:** `event-register`
  - **Method:** `POST`
  - **Response mode:** `responseNode` (response is sent by a Respond to Webhook node later)
- **Expected input payload (body):** `eventId`, `name`, `email`, optional `ticketType`
- **Outputs:** To `Create Ticket Data`
- **Failure/edge cases:**
  - Missing body fields → later expressions may produce empty values.
  - If caller expects immediate response, note that response is produced at the end of the chain.

#### Create Ticket Data
- **Type / role:** `Set` node; normalizes and creates derived fields.
- **Key configuration choices:**
  - Generates **ticketId**:  
    `TKT-<eventId>-<HHmmssSSS>` using `$now.format('HHmmssSSS')`
  - Sets:
    - `eventId` from `body.eventId`
    - `participantName` from `body.name`
    - `email` from `body.email`
    - `ticketType` defaults to `'standard'` if missing
    - `registeredAt` as ISO timestamp
    - `checkedIn` as `"no"`
- **Inputs:** `Registration Webhook`
- **Outputs:** `Save to Participants Sheet`
- **Failure/edge cases:**
  - If `body.eventId` is missing, ticketId becomes `TKT-undefined-...`
  - `$now.format(...)` depends on n8n date/time support; ensure instance supports `$now` in expressions.

#### Save to Participants Sheet
- **Type / role:** `Google Sheets` append row; acts as the participant database.
- **Operation:** `append`
- **Sheet name:** `Participants`
- **Columns mapped (defined explicitly):**
  - `Name`, `Email`, `Event ID`, `Ticket ID`, `Checked In`, `Ticket Type`, `Check-in Time` (blank), `Registered At`
- **Credentials required:** Google Sheets OAuth2 / service account (depending on n8n setup).
- **Inputs:** `Create Ticket Data`
- **Outputs:** `Prepare QR Payload`
- **Failure/edge cases:**
  - **documentId is empty** in the workflow JSON; must be set or node will fail.
  - Column headers must match exactly (case and spacing) or data may map incorrectly.
  - Google API quota / auth errors; sheet permission errors.

---

### Block C — Registration Delivery: Build QR Payload → Generate QR → Email → Respond
**Overview:** Encodes ticket data into a base64 payload, generates a QR image from a third-party API, emails it via Gmail, and returns a JSON response to the registrant system.  
**Nodes involved:** `Prepare QR Payload`, `Generate QR Code`, `Send Ticket Email`, `Registration Success`

#### Prepare QR Payload
- **Type / role:** `Code` node; constructs QR content.
- **Logic:**
  - Builds JSON payload `{ t, e, n, ts }`:
    - `t`: ticketId
    - `e`: eventId
    - `n`: first 20 chars of participant name
    - `ts`: current epoch millis
  - Base64 encodes payload to `qrData`
  - Builds `qrContent` URL:  
    `https://event.company.com/checkin?code=<base64Payload>`
- **Inputs:** `Save to Participants Sheet` (but uses `$input.first().json` which is the current item)
- **Outputs:** `Generate QR Code`
- **Failure/edge cases:**
  - If `participantName` is missing, `.substring(0, 20)` throws; consider guarding nulls.
  - Base64 QR data is not signed; can be forged unless you add an HMAC/signature.

#### Generate QR Code
- **Type / role:** `HTTP Request` node; generates QR image via external service.
- **Request:** GET to `api.qrserver.com` with:
  - size 300x300
  - `data=` set to `encodeURIComponent($json.qrContent)`
- **Response format:** `file` (binary)
- **Inputs:** `Prepare QR Payload`
- **Outputs:** `Send Ticket Email`
- **Failure/edge cases:**
  - External dependency: downtime, rate limits, latency.
  - If the API returns non-image content, email attachment may be invalid.

#### Send Ticket Email
- **Type / role:** `Gmail` send message.
- **Key configuration:**
  - **To:** `{{$json.email}}`
  - **Subject:** `Your Ticket for {{ $json.eventId }}`
  - **Body:** includes ticketId and ticketType.
  - **Attachments:** configured via `attachmentsBinary`, but the attachment entry is empty (`[{}]`).
- **Inputs:** `Generate QR Code`
- **Outputs:** `Registration Success`
- **Credentials required:** Gmail OAuth2.
- **Critical issue / edge case:**
  - The workflow does not specify which **binary property** from `Generate QR Code` should be attached. In n8n, the HTTP Request node typically outputs binary as something like `data`. You must set the attachment binary property name (e.g., `data`) in the Gmail node; otherwise, the email may send without the QR attachment or fail validation.

#### Registration Success
- **Type / role:** `Respond to Webhook`; returns API response for registration.
- **Responds with:** JSON string like:
  - `{ success: true, ticketId, message: 'Ticket sent to <email>' }`
- **Inputs:** `Send Ticket Email`
- **Failure/edge cases:**
  - If earlier nodes fail and no error workflow exists, webhook call will error/timeout.
  - `responseBody` is manually stringified; many clients accept either JSON object or string—ensure consumers expect JSON.

---

### Block D — Check-in: Receive → Decode QR → Validate Format
**Overview:** Receives scanned QR data and validates it is a decodable base64 JSON payload.  
**Nodes involved:** `Check-in Webhook`, `Decode QR Code`, `Is Valid QR?`, `Invalid QR Response`

#### Check-in Webhook
- **Type / role:** `Webhook` (second entry point) for check-ins.
- **Key configuration:**
  - **Path:** `event-checkin`
  - **Method:** `POST`
  - **Response mode:** `responseNode`
- **Expected input payload (body):**
  - `code` or `qrCode` containing the base64 payload
- **Outputs:** `Decode QR Code`

#### Decode QR Code
- **Type / role:** `Code` node; extracts and decodes QR payload.
- **Logic:**
  - Reads `input.body.code || input.body.qrCode`
  - If missing → `{ valid:false, error:'No QR code provided' }`
  - Else base64 decode → JSON parse → outputs:
    - `valid:true`, `ticketId`, `eventId`, `participantName`, `scanTime`
  - Catch parse/decode errors → `{ valid:false, error:'Invalid QR code format' }`
- **Inputs:** `Check-in Webhook`
- **Outputs:** `Is Valid QR?`
- **Edge cases:**
  - Non-base64 strings cause exception (handled).
  - Payload might be valid JSON but missing `t/e/n` keys; later nodes may fail silently or behave unexpectedly.

#### Is Valid QR?
- **Type / role:** `IF` gate.
- **Condition:** `$json.valid === true`
- **True branch →** `Lookup Ticket in DB`  
- **False branch →** `Invalid QR Response`
- **Edge cases:** If `valid` is undefined, goes to false branch.

#### Invalid QR Response
- **Type / role:** `Respond to Webhook`; returns error JSON.
- **Body:** `{ status:'error', error: $json.error }`
- **Inputs:** false branch from `Is Valid QR?`

---

### Block E — Check-in: Lookup Ticket → Validate Duplicate → Allow/Deny
**Overview:** Retrieves matching ticket records, ensures it exists, blocks duplicates, and shapes a normalized check-in object.  
**Nodes involved:** `Lookup Ticket in DB`, `Validate Check-in`, `Check-in Allowed?`, `Check-in Denied`

#### Lookup Ticket in DB
- **Type / role:** `Google Sheets` read operation for ticket record(s).
- **Operation:** `getMany`
- **Configuration gaps:**
  - `documentId` is empty (must be set).
  - No sheet name / filter is shown in the JSON excerpt for this node; as written, it is unlikely to return the specific ticket row unless configured in UI (range, filters, return all, etc.).
- **Inputs:** true branch from `Is Valid QR?`
- **Outputs:** `Validate Check-in`
- **Failure/edge cases:**
  - Without a filter on “Ticket ID”, this may return many rows; validation code takes only the first.
  - Permissions/quota errors.

#### Validate Check-in
- **Type / role:** `Code` node; enforces business rules.
- **Logic:**
  - Gets QR data from `$('Decode QR Code').first().json`
  - Reads all sheet records from `$input.all()`
  - If none → denied: “Ticket not found”
  - Takes first record as ticket
  - If `Checked In` is `yes` → denied with prior check-in time
  - Else allowed and returns:
    - ticketId, eventId, participantName, ticketType
    - `isVIP` = (`ticketType` lowercased === `vip`)
    - `checkInTime` from scanTime
- **Inputs:** `Lookup Ticket in DB`
- **Outputs:** `Check-in Allowed?`
- **Edge cases:**
  - Relies on exact column names: `Checked In`, `Check-in Time`, `Event ID`, `Ticket Type`, `Name`.
  - If sheet returns multiple matches, duplicates are not handled; it always uses the first row.
  - If `Ticket Type` is blank, `.toLowerCase()` can fail; optional chaining is used (`?.`) which helps.

#### Check-in Allowed?
- **Type / role:** `IF` gate.
- **Condition:** `$json.allowed === true`
- **True branch →** `Mark as Checked In`  
- **False branch →** `Check-in Denied`

#### Check-in Denied
- **Type / role:** `Respond to Webhook`
- **Body:** `{ status:'denied', reason, ticketId }`
- **Inputs:** false branch from `Check-in Allowed?`

---

### Block F — Check-in Commit + VIP Alert + Success Response
**Overview:** Updates the participant record to checked-in, optionally sends a Slack message for VIPs, then returns a success response.  
**Nodes involved:** `Mark as Checked In`, `Is VIP?`, `Slack VIP Alert`, `Merge VIP Path`, `Build Success Response`, `Check-in Success`

#### Mark as Checked In
- **Type / role:** `Google Sheets` update operation.
- **Operation:** `update`
- **Sheet:** `Participants`
- **Columns set:**
  - `Ticket ID` = current ticketId
  - `Checked In` = `yes`
  - `Check-in Time` = checkInTime
- **Inputs:** true branch from `Check-in Allowed?`
- **Outputs:** `Is VIP?`
- **Critical edge case:**
  - Google Sheets “update” typically requires a **row identifier** (row number) or a configured “key column” mapping. Merely providing `Ticket ID` may not locate the row unless the node is configured in UI to match on a column. Verify the node is set to “update by key” (or equivalent) with “Ticket ID” as the key.
  - `documentId` is empty and must be set.

#### Is VIP?
- **Type / role:** `IF` gate.
- **Condition:** `$json.isVIP === true`
- **True branch →** `Slack VIP Alert`
- **False branch →** `Merge VIP Path` (index 1)

#### Slack VIP Alert
- **Type / role:** `Slack` message post for VIP arrival.
- **Configuration:**
  - Posts to channel `#event-vip`
  - Message includes participant name and ticketId
- **Inputs:** true branch from `Is VIP?`
- **Outputs:** `Merge VIP Path`
- **Credentials required:** Slack OAuth token (or bot token) with chat:write permissions.
- **Failure/edge cases:** channel not found, missing permission, Slack rate limiting.

#### Merge VIP Path
- **Type / role:** `Merge` (mode: chooseBranch) to unify VIP and non-VIP paths.
- **Inputs:** from Slack path or directly from non-VIP path.
- **Outputs:** `Build Success Response`
- **Edge cases:** “chooseBranch” depends on which input arrives; ensure both branches are connected exactly as in the workflow.

#### Build Success Response
- **Type / role:** `Code` node; constructs success JSON response.
- **Logic:**
  - Pulls canonical check-in data from `$('Validate Check-in').first().json`
  - Builds a success payload including attendance stats:
    - `mockAttendance = 245`, `capacity = 300`
    - `capacityPercent` computed
- **Inputs:** `Merge VIP Path`
- **Outputs:** `Check-in Success`
- **Edge cases:**
  - Attendance is mocked; not tied to sheet counts. If you want real counts, replace with Sheets aggregation.
  - Depends on `Validate Check-in` node output existing even after Slack branch (it should, but this is a cross-node reference).

#### Check-in Success
- **Type / role:** `Respond to Webhook`
- **Body:** `JSON.stringify($json)` returning the success object.
- **Inputs:** `Build Success Response`

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Sticky Note | Sticky Note | Canvas documentation |  |  | ## Manage event participants and process QR code check-ins… (setup + requirements: Google Sheets, Gmail, Slack) |
| Sticky Note1 | Sticky Note | Step label |  |  | **Step 1: Registration** Receive participant data, create ticket ID, and save to Google Sheets. |
| Sticky Note2 | Sticky Note | Step label |  |  | **Step 2: QR Code & Email** Generate QR code with ticket data and send confirmation email with attachment. |
| Sticky Note3 | Sticky Note | Step label |  |  | **Step 3: Check-in Validation** Decode QR, validate ticket, and check for duplicate entries. |
| Sticky Note4 | Sticky Note | Step label |  |  | **Step 4: VIP Handling** Detect VIP tickets and send Slack notification to event staff. |
| Registration Webhook | Webhook | Registration API entry point |  | Create Ticket Data | **Step 1: Registration** Receive participant data, create ticket ID, and save to Google Sheets. |
| Create Ticket Data | Set | Normalize inputs + generate ticketId | Registration Webhook | Save to Participants Sheet | **Step 1: Registration** Receive participant data, create ticket ID, and save to Google Sheets. |
| Save to Participants Sheet | Google Sheets | Append participant record | Create Ticket Data | Prepare QR Payload | **Step 1: Registration** Receive participant data, create ticket ID, and save to Google Sheets. |
| Prepare QR Payload | Code | Build base64 QR payload + check-in URL | Save to Participants Sheet | Generate QR Code | **Step 2: QR Code & Email** Generate QR code with ticket data and send confirmation email with attachment. |
| Generate QR Code | HTTP Request | Generate QR image from external API | Prepare QR Payload | Send Ticket Email | **Step 2: QR Code & Email** Generate QR code with ticket data and send confirmation email with attachment. |
| Send Ticket Email | Gmail | Email ticket + QR attachment | Generate QR Code | Registration Success | **Step 2: QR Code & Email** Generate QR code with ticket data and send confirmation email with attachment. |
| Registration Success | Respond to Webhook | Return registration result JSON | Send Ticket Email |  | **Step 2: QR Code & Email** Generate QR code with ticket data and send confirmation email with attachment. |
| Check-in Webhook | Webhook | Check-in API entry point |  | Decode QR Code | **Step 3: Check-in Validation** Decode QR, validate ticket, and check for duplicate entries. |
| Decode QR Code | Code | Decode base64 QR payload | Check-in Webhook | Is Valid QR? | **Step 3: Check-in Validation** Decode QR, validate ticket, and check for duplicate entries. |
| Is Valid QR? | IF | Route valid vs invalid scans | Decode QR Code | Lookup Ticket in DB; Invalid QR Response | **Step 3: Check-in Validation** Decode QR, validate ticket, and check for duplicate entries. |
| Invalid QR Response | Respond to Webhook | Return invalid QR error JSON | Is Valid QR? (false) |  | **Step 3: Check-in Validation** Decode QR, validate ticket, and check for duplicate entries. |
| Lookup Ticket in DB | Google Sheets | Retrieve ticket record(s) | Is Valid QR? (true) | Validate Check-in | **Step 3: Check-in Validation** Decode QR, validate ticket, and check for duplicate entries. |
| Validate Check-in | Code | Enforce “exists” + “not already checked in” | Lookup Ticket in DB | Check-in Allowed? | **Step 3: Check-in Validation** Decode QR, validate ticket, and check for duplicate entries. |
| Check-in Allowed? | IF | Route allow vs deny | Validate Check-in | Mark as Checked In; Check-in Denied | **Step 3: Check-in Validation** Decode QR, validate ticket, and check for duplicate entries. |
| Check-in Denied | Respond to Webhook | Return denied JSON | Check-in Allowed? (false) |  | **Step 3: Check-in Validation** Decode QR, validate ticket, and check for duplicate entries. |
| Mark as Checked In | Google Sheets | Update participant row as checked in | Check-in Allowed? (true) | Is VIP? | **Step 4: VIP Handling** Detect VIP tickets and send Slack notification to event staff. |
| Is VIP? | IF | Route VIP vs non-VIP | Mark as Checked In | Slack VIP Alert; Merge VIP Path | **Step 4: VIP Handling** Detect VIP tickets and send Slack notification to event staff. |
| Slack VIP Alert | Slack | Notify staff of VIP arrival | Is VIP? (true) | Merge VIP Path | **Step 4: VIP Handling** Detect VIP tickets and send Slack notification to event staff. |
| Merge VIP Path | Merge | Re-join VIP/non-VIP paths | Slack VIP Alert; Is VIP? (false) | Build Success Response | **Step 4: VIP Handling** Detect VIP tickets and send Slack notification to event staff. |
| Build Success Response | Code | Build final success JSON | Merge VIP Path | Check-in Success | **Step 4: VIP Handling** Detect VIP tickets and send Slack notification to event staff. |
| Check-in Success | Respond to Webhook | Return success JSON | Build Success Response |  | **Step 4: VIP Handling** Detect VIP tickets and send Slack notification to event staff. |

---

## 4. Reproducing the Workflow from Scratch

1) **Create the Google Sheet**
   1. Create a spreadsheet and a worksheet named **Participants**.
   2. Add headers (exactly):  
      `Name`, `Email`, `Event ID`, `Ticket ID`, `Checked In`, `Ticket Type`, `Check-in Time`, `Registered At`

2) **Add Node: Registration Webhook (Webhook)**
   1. Path: `event-register`
   2. Method: `POST`
   3. Response mode: **Using “Respond to Webhook” node** (responseNode)
   4. Save the node to obtain the production/test URL.

3) **Add Node: Create Ticket Data (Set)**
   1. Add fields:
      - `ticketId` (string): `={{ 'TKT-' + $json.body.eventId + '-' + $now.format('HHmmssSSS') }}`
      - `eventId`: `={{ $json.body.eventId }}`
      - `participantName`: `={{ $json.body.name }}`
      - `email`: `={{ $json.body.email }}`
      - `ticketType`: `={{ $json.body.ticketType || 'standard' }}`
      - `registeredAt`: `={{ $now.toISO() }}`
      - `checkedIn`: `no`
   2. Connect: **Registration Webhook → Create Ticket Data**

4) **Add Node: Save to Participants Sheet (Google Sheets)**
   1. Credentials: connect a Google account with access to the spreadsheet.
   2. Document: select your spreadsheet (**set Document ID**).
   3. Operation: **Append**
   4. Sheet: `Participants`
   5. Map columns:
      - Name = `{{$json.participantName}}`
      - Email = `{{$json.email}}`
      - Event ID = `{{$json.eventId}}`
      - Ticket ID = `{{$json.ticketId}}`
      - Checked In = `{{$json.checkedIn}}`
      - Ticket Type = `{{$json.ticketType}}`
      - Check-in Time = *(empty string)*
      - Registered At = `{{$json.registeredAt}}`
   6. Connect: **Create Ticket Data → Save to Participants Sheet**

5) **Add Node: Prepare QR Payload (Code)**
   1. Paste the provided code (adapt domain if needed): build base64 payload and `qrContent`.
   2. Connect: **Save to Participants Sheet → Prepare QR Payload**

6) **Add Node: Generate QR Code (HTTP Request)**
   1. Method: GET
   2. URL:  
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={{ encodeURIComponent($json.qrContent) }}`
   3. Response: **File** (binary)
   4. Connect: **Prepare QR Payload → Generate QR Code**

7) **Add Node: Send Ticket Email (Gmail)**
   1. Credentials: Gmail OAuth2.
   2. To: `{{$json.email}}`
   3. Subject: `Your Ticket for {{$json.eventId}}`
   4. Message: include ticketId and ticketType (as in workflow).
   5. Attachments:
      - Set attachment to the binary property created by the HTTP Request node (commonly `data`).  
        In the Gmail node UI, choose **Binary Property** = the QR binary field.
   6. Connect: **Generate QR Code → Send Ticket Email**

8) **Add Node: Registration Success (Respond to Webhook)**
   1. Respond with: JSON
   2. Body (expression):  
      `={{ JSON.stringify({ success: true, ticketId: $json.ticketId, message: 'Ticket sent to ' + $json.email }) }}`
   3. Connect: **Send Ticket Email → Registration Success**
   4. In **Registration Webhook**, ensure it points to this response node via responseNode mode.

9) **Add Node: Check-in Webhook (Webhook)**
   1. Path: `event-checkin`
   2. Method: `POST`
   3. Response mode: `responseNode`

10) **Add Node: Decode QR Code (Code)**
   1. Use the provided decoding code.
   2. Connect: **Check-in Webhook → Decode QR Code**

11) **Add Node: Is Valid QR? (IF)**
   1. Condition: boolean `{{$json.valid}}` is true
   2. True output → next lookup node
   3. False output → invalid response node
   4. Connect: **Decode QR Code → Is Valid QR?**

12) **Add Node: Invalid QR Response (Respond to Webhook)**
   1. Respond JSON body:  
      `={{ JSON.stringify({ status: 'error', error: $json.error }) }}`
   2. Connect: **Is Valid QR? (false) → Invalid QR Response**

13) **Add Node: Lookup Ticket in DB (Google Sheets)**
   1. Credentials: same Google Sheets credentials.
   2. Document: select the spreadsheet (**set Document ID**).
   3. Operation: **Get Many**
   4. Configure it to return the row where **Ticket ID equals** `{{$('Decode QR Code').first().json.ticketId}}` (exact UI varies by n8n version; use filters/options available in the Google Sheets node).
   5. Connect: **Is Valid QR? (true) → Lookup Ticket in DB**

14) **Add Node: Validate Check-in (Code)**
   1. Paste the provided validation code.
   2. Connect: **Lookup Ticket in DB → Validate Check-in**

15) **Add Node: Check-in Allowed? (IF)**
   1. Condition: `{{$json.allowed}}` is true
   2. True → update sheet
   3. False → denied response
   4. Connect: **Validate Check-in → Check-in Allowed?**

16) **Add Node: Check-in Denied (Respond to Webhook)**
   1. Body:  
      `={{ JSON.stringify({ status: 'denied', reason: $json.reason, ticketId: $json.ticketId }) }}`
   2. Connect: **Check-in Allowed? (false) → Check-in Denied**

17) **Add Node: Mark as Checked In (Google Sheets)**
   1. Operation: **Update**
   2. Sheet: `Participants`
   3. Configure update targeting:
      - Prefer “update by key/lookup column” with key column **Ticket ID** = `{{$json.ticketId}}`
   4. Set fields:
      - Checked In = `yes`
      - Check-in Time = `{{$json.checkInTime}}`
   5. Connect: **Check-in Allowed? (true) → Mark as Checked In**

18) **Add Node: Is VIP? (IF)**
   1. Condition: `{{$json.isVIP}}` is true
   2. True → Slack alert
   3. False → merge
   4. Connect: **Mark as Checked In → Is VIP?**

19) **Add Node: Slack VIP Alert (Slack)**
   1. Credentials: Slack bot/token with permission to post messages.
   2. Channel: `#event-vip`
   3. Text:  
      `:star: *VIP Arrival*\n{{$json.participantName}} has arrived!\nTicket: {{$json.ticketId}}`
   4. Connect: **Is VIP? (true) → Slack VIP Alert**

20) **Add Node: Merge VIP Path (Merge)**
   1. Mode: **Choose Branch**
   2. Inputs:
      - Input 1 from **Slack VIP Alert**
      - Input 2 from **Is VIP? (false)**
   3. Output to success builder.

21) **Add Node: Build Success Response (Code)**
   1. Paste the provided code (replace mock attendance if desired).
   2. Connect: **Merge VIP Path → Build Success Response**

22) **Add Node: Check-in Success (Respond to Webhook)**
   1. Body: `={{ JSON.stringify($json) }}`
   2. Connect: **Build Success Response → Check-in Success**
   3. Ensure **Check-in Webhook** uses responseNode mode and returns via this node.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Manage event participants and process QR code check-ins” + setup requirements (Google Sheets, Gmail, Slack) | On-canvas sticky note (workflow purpose and setup checklist) |
| Registration Flow: webhook → ticket ID/QR → Sheets → email | On-canvas description |
| Check-in Flow: decode QR → validate/avoid duplicates → VIP Slack → attendance stats | On-canvas description |
| QR content uses `https://event.company.com/checkin?code=...` | Replace `event.company.com` with your real domain/landing page |
| QR payload is base64 JSON without signature | Consider adding HMAC/signing to prevent forged tickets |
| Gmail attachment configuration is incomplete in the provided workflow | Ensure Gmail node references the correct binary property from the QR HTTP Request node |
| Google Sheets nodes have empty `documentId` in JSON | Must be set to the target spreadsheet for both registration and check-in paths |