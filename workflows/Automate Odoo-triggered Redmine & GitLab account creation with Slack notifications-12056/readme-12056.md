Automate Odoo-triggered Redmine & GitLab account creation with Slack notifications

https://n8nworkflows.xyz/workflows/automate-odoo-triggered-redmine---gitlab-account-creation-with-slack-notifications-12056


# Automate Odoo-triggered Redmine & GitLab account creation with Slack notifications

## 1. Workflow Overview

**Purpose:** This workflow is triggered by **Odoo 18** (via webhook) to automatically provision **Redmine** and/or **GitLab** accounts for onboarding/new-hire requests stored as **Odoo Approvals** (`approval.request`, category `14`, status `pending`). It also sends **Slack notifications** to the affected user and to a reporting channel.

**Target use cases:**
- HR/IT onboarding where account requests are raised in Odoo Approvals.
- Automated provisioning with basic deduplication (check existence before create).
- Slack-based status reporting to both user and operations channel.

### 1.1 Entry & Acknowledge (Webhook handling)
Odoo calls a secured webhook; n8n responds immediately, then continues asynchronously after a short wait.

### 1.2 Time window preparation
A Code node computes “today / yesterday / tomorrow” in `YYYY-MM-DD` format and day-of-week. Those values are used to build Odoo domain filters (create_date time window).

### 1.3 Query Odoo approvals (is there anything to do?)
An Odoo JSON-RPC request checks for any relevant approval requests (Redmine/GitLab keywords) within the time window. If none, the flow ends.

### 1.4 Slack directory preload
If there are requests, the workflow fetches Slack users (for mapping email → Slack member ID).

### 1.5 Branch A — Requests needing **both** Redmine + GitLab
- Query Odoo for “both” requests.
- Extract email/username parts.
- Check Redmine user existence by email.
- If Redmine exists → check GitLab existence; if GitLab exists, notify and stop; otherwise create GitLab and notify.
- If Redmine does not exist → create Redmine, then create GitLab, then notify (user + reporting channel).

### 1.6 Branch B — Requests needing **Redmine only**
- Query Odoo for Redmine-only requests.
- Extract email.
- Check Redmine existence; if missing, create Redmine + assign group; notify user + reporting channel.

### 1.7 Branch C — Requests needing **GitLab only**
- Query Odoo for GitLab-only requests.
- Extract email.
- (No GitLab existence check is implemented in this branch.) Create GitLab, set password, notify user + reporting channel.

---

## 2. Block-by-Block Analysis

### Block 1 — Webhook entry & immediate response
**Overview:** Receives the POST webhook from Odoo 18 with header authentication and immediately returns a response so Odoo doesn’t wait for downstream provisioning.

**Nodes involved:**
- `Step1: Odoo 18 called a webhook`
- `Step2: Respond to Webhook`
- `Step 3: Wait 5s`

#### Node: Step1: Odoo 18 called a webhook
- **Type/role:** Webhook trigger (`n8n-nodes-base.webhook`) – entry point.
- **Configuration:**
  - Method: `POST`
  - Path: `79db09d5-d242-42ff-9792-5840b41f9de6`
  - Auth: `headerAuth` (uses `httpHeaderAuth Credential`)
  - Response: `responseNode` (response handled by Step2)
- **Inputs/outputs:** No input; output to `Step2`.
- **Edge cases/failures:**
  - Wrong/missing auth header → request rejected.
  - Odoo timeout if response node misconfigured/disconnected.

#### Node: Step2: Respond to Webhook
- **Type/role:** Respond to Webhook (`n8n-nodes-base.respondToWebhook`) – returns HTTP response to caller.
- **Configuration:** default response (no custom body/status specified).
- **Inputs/outputs:** Receives from Step1; continues to `Step 3: Wait 5s`.
- **Edge cases:** If not executed (workflow error before this node), Odoo may retry.

#### Node: Step 3: Wait 5s
- **Type/role:** Wait (`n8n-nodes-base.wait`) – delays execution (helps Odoo finalize its transaction before querying).
- **Configuration:** default wait (node name suggests 5 seconds, but no explicit parameters are shown in JSON).
- **Special flags:** `executeOnce: true` (runs only once when testing; can be problematic in production if left enabled).
- **Outputs:** to `Step4: Set Variables`.
- **Edge cases:**
  - If `executeOnce` remains enabled, later executions may not wait as expected during repeated runs in the editor/testing context.

---

### Block 2 — Variable provisioning & date window
**Overview:** Prepares base variables (URLs/limits) and calculates dates used for Odoo time-window filtering.

**Nodes involved:**
- `Step4: Set Variables` (disabled)
- `Step5: Handle get today`

#### Node: Step4: Set Variables (disabled)
- **Type/role:** Set (`n8n-nodes-base.set`) – intended to store constants (limit, Odoo endpoints, Redmine/GitLab base URLs).
- **Configuration (as provided):**
  - Raw JSON output includes: `limit`, `web_search_read_api`, `web_read_api`
  - **Important:** This node is **disabled** and the JSON shown does **not** include keys that later nodes reference (e.g., `web_search_read`, `redmine6_Url`, `gitlab_Url`).
- **Connections:** Receives from Wait; outputs to Step5.
- **Critical integration note:** Multiple downstream nodes reference:
  - `$node['Step4: Set Variables'].json.web_search_read`
  - `$node['Step4: Set Variables'].json.redmine6_Url`
  - `$node['Step4: Set Variables'].json.gitlab_Url`
  If Step4 stays disabled or doesn’t output those keys, many requests will fail with “Cannot read properties of undefined” or invalid URL errors.
- **Edge cases/failures:** Misconfigured/missing URLs; disabled node producing empty output.

#### Node: Step5: Handle get today
- **Type/role:** Code (`n8n-nodes-base.code`) – creates `date`, `lastday`, `tomorrow`, `dayOfWeek`.
- **Key logic:**
  - Formats dates as `YYYY-MM-DD`.
  - Uses `date.getDay()` but maps to an array starting at `"Monday"`; JavaScript `getDay()` returns 0 for Sunday → this mapping is off by one (Sunday will map to “Monday”, etc.). This value is not used elsewhere in the workflow, but it’s logically incorrect.
- **Outputs:** to Odoo query in Step6.
- **Edge cases:** Timezone is server-based here; Odoo queries use `Asia/Bangkok` in context but the computed dates depend on n8n server timezone.

---

### Block 3 — Initial Odoo approvals query (gate)
**Overview:** Checks whether there are any pending approval requests referencing Redmine/GitLab/RM within the time window; stops the workflow if none.

**Nodes involved:**
- `Step 6: Check if there's a requirement to create a Redmine or GitLab account on Odoo 18.`
- `Step7: If total_count is not equal to 0 = true`
- `End`

#### Node: Step 6: Check if there's a requirement to create a Redmine or GitLab account on Odoo 18.
- **Type/role:** HTTP Request (`n8n-nodes-base.httpRequest`) – Odoo JSON-RPC to `approval.request.web_search_read`.
- **Configuration choices:**
  - URL: expression `{{ $node['Step4: Set Variables'].json.web_search_read}}` (must be a full Odoo JSON-RPC endpoint)
  - Method: `POST`
  - Auth: generic credential type → `httpHeaderAuth` (likely session/cookie or API key header)
  - Body: JSON-RPC payload with:
    - model: `approval.request`
    - method: `web_search_read`
    - domain:
      - create_date between `lastday 17:10:01` and `today 16:55:01`
      - pending + category_id = 14
      - name/reason contains Redmine/Gitlab/RM keywords
    - limit uses `{{ $node['Step5: Handle get today'].json.limit }}` but Step5 does **not** output `limit` → likely a bug (should come from Step4 or be hardcoded).
- **Output:** expected Odoo `result.records` and/or `result.length` depending on Odoo version/response.
- **Edge cases/failures:**
  - Wrong URL variable name (`web_search_read` vs `web_search_read_api`) leads to invalid URL.
  - Missing/expired auth header.
  - Odoo may return `result.records` rather than `result.length`; logic depends on the exact response shape.
  - Time window might miss requests if server timezone differs.

#### Node: Step7: If total_count is not equal to 0 = true
- **Type/role:** IF (`n8n-nodes-base.if`) – decides whether to proceed.
- **Condition:** `{{ $json.result.length }} != 0`
- **Outputs:**
  - **True:** `Step8: Get many users`
  - **False:** `End`
- **Edge cases:**
  - If Odoo response doesn’t include `result.length`, this evaluates to `undefined != 0` (true) or expression error, depending on n8n strictness.

#### Node: End
- **Type/role:** NoOp – terminator.
- **Used when:** no relevant Odoo requests found.

---

### Block 4 — Slack user directory preload
**Overview:** Fetches Slack users so later steps can map requested email addresses to Slack member IDs.

**Nodes involved:**
- `Step8: Get many users`

#### Node: Step8: Get many users
- **Type/role:** Slack (`n8n-nodes-base.slack`) – fetch user list.
- **Operation:** `user.getAll`, limit `100`.
- **Credentials:** `slackApi Credential`.
- **Output shape:** `members` array (later referenced as `$node["Step8: Get many users"].json.members`).
- **Edge cases:**
  - Slack token missing `users:read` scope → auth error.
  - Large orgs may require pagination beyond 100; mapping may fail for users not included.
  - Some Slack users may not have `profile.email` depending on privacy settings.

---

### Block 5 — Branch A: “Both Redmine and GitLab” requests
**Overview:** Finds approvals that imply both accounts, extracts email, checks Redmine and GitLab existence, then either notifies that both exist or creates missing accounts and notifies.

**Nodes involved:**
- `Step 9: Find the record requesting both Redmine and Gitlab accounts on Odoo 18.`
- `Step10: If total_count is not equal to 0 = true`
- `Step 11.1: Find and extract the email from the request`
- `Step12.1: Get user info in RM6`
- `Step13.1: If total_count is not equal to 0 = true`
- `Step14.1: Get user information in Gitlab`
- `Step15.1:  Check if there is a record = true`
- `Step16.1: Send a message to channel`
- `Step 16.2: Create a new user in Gitlab`
- `Step 17.1: Send reset password`
- `Step18.1: Convert to text`
- `Step 19.1: Send a message to the member via Slack once their Gitlab account has been created.`
- `Step20.1: Send a message to channel REPORT`
- `Step 14.2: Create a new user in Redmine`
- `Step 15.2: Assign the user to a group in Redmine`
- `Step 16.3: Code`
- `Step 17.2: Create a new user in Gitlab`
- `Step 18.2: Send reset password`
- `Step19.2: Convert to text`
- `Step 20.2: Send a message to the member via Slack once their Gitlab and Redmine account has been created.`
- `Step21.1: Send a message to channel REPORT`

#### Node: Step 9: Find the record requesting both Redmine and Gitlab accounts on Odoo 18.
- **Type/role:** HTTP Request – Odoo JSON-RPC web_search_read with a domain requiring indicators of both services.
- **Key config:** URL from Step4 var; domain filters pending, time window, category 14, and combined conditions matching both “Redmine/RM” and “Gitlab/gitlab” in name/reason.
- **Failure risks:** same as Step6; also the domain logic is complex and may not match intended cases due to `|`/`&` nesting.

#### Node: Step10: If total_count is not equal to 0 = true
- **Type/role:** IF – checks `{{ $node['Step 9...'].json.result.length }} != 0`
- **True output:** goes to email extraction (Step 11.1)
- **False output:** goes to Redmine-only branch (Step 11.2)

#### Node: Step 11.1: Find and extract the email from the request
- **Type/role:** Code – parses emails out of Odoo approval `records`.
- **Logic:**
  - Regex email match in `rec.name` then `rec.reason`.
  - Outputs per record: `{ id, rawEmail, extracted, login }`
    - `login` = email local-part (e.g., `john.doe`)
    - `extracted` = substring before first dot of local-part (e.g., `john`)
- **Edge cases:**
  - If multiple records, it emits multiple items; downstream HTTP requests will run per item.
  - If email not found, outputs `{ result: "Email not found" }` and downstream nodes will likely build invalid URLs or create bad accounts.

#### Node: Step12.1: Get user info in RM6
- **Type/role:** HTTP Request – Redmine query: `users.json?mail=<rawEmail>`
- **URL:** `{{ redmine6_Url }}users.json?mail={{ rawEmail }}`
- **Auth:** `httpHeaderAuth` (typically Redmine API key header, e.g., `X-Redmine-API-Key`)
- **Output expectation:** Redmine returns `total_count` and `users[]` (depending on Redmine API version/plugins).
- **Edge cases:** Redmine may not support `mail` filter unless enabled; could return 403 if API key lacks admin rights.

#### Node: Step13.1: If total_count is not equal to 0 = true
- **Type/role:** IF – checks `{{ $json.total_count }} != 0`
- **True:** go to GitLab existence check (Step14.1)
- **False:** create Redmine (Step14.2)

#### Node: Step14.1: Get user information in Gitlab
- **Type/role:** HTTP Request – GitLab search: `api/v4/users?search=<extracted>`
- **Auth:** `httpHeaderAuth` (typically `PRIVATE-TOKEN` or `Authorization: Bearer`)
- **Edge cases:**
  - Search by `extracted` (first name fragment) is not unique; may match unrelated users.
  - Response is an array; later IF checks are weak (see next).

#### Node: Step15.1: Check if there is a record = true
- **Type/role:** IF – attempts to detect if GitLab user exists.
- **Condition:** `object notEmpty` on `{{ $node['Step14.1...'].json }}`
- **Risk:** GitLab returns `[]` for no results; in n8n, `[]` may still count as “notEmpty” depending on type handling. This can invert logic.
- **True:** send Slack channel message “already available”
- **False:** create GitLab user

#### Node: Step16.1: Send a message to channel
- **Type/role:** Slack message to a channel.
- **Text:** “The email X is already available in Redmine and Gitlab.”
- **Configuration gap:** `channelId.value` is empty in JSON → must be set to a real channel, or it will fail.
- **Edge cases:** missing channel selection causes runtime error.

#### Node: Step 16.2: Create a new user in Gitlab
- **Type/role:** HTTP Request – GitLab Admin create user (`POST /api/v4/users`)
- **Body:** email, username, name = `extracted`, `reset_password: true`, `skip_confirmation: true`
- **Edge cases:**
  - Requires admin token.
  - Username collisions if `extracted` already used.
  - GitLab may ignore/forbid `skip_confirmation` depending on settings.

#### Node: Step 17.1: Send reset password
- **Type/role:** HTTP Request – GitLab update user (`PUT /api/v4/users/{{id}}`)
- **Body:** sets `password` to `Helloworld@123`
- **Security note:** Hardcoded password is unsafe; also conflicts with `reset_password: true` logic.
- **Edge cases:** GitLab may forbid setting password when `reset_password` is used; or require `admin` mode.

#### Node: Step18.1: Convert to text
- **Type/role:** Code – maps `rawEmail` to Slack member ID by scanning Slack `members`.
- **Output:** `{ memberID: matched.id || "Email not found" }`
- **Edge cases:** If `"Email not found"`, downstream Slack DM by user ID will fail.

#### Node: Step 19.1 / Step20.1
- **Type/role:** Slack DM to user + Slack message to report channel.
- **Config gaps:** Both report-channel nodes have empty `channelId.value` and must be configured.

#### Node: Step 14.2: Create a new user in Redmine
- **Type/role:** HTTP Request – Redmine create user (`POST users.json`)
- **Body:** creates user with `login`, `firstname`, `lastname`, `mail`, password `Helloworld@132`
- **Edge cases:** Redmine requires admin API key; password policy may reject.

#### Node: Step 15.2: Assign the user to a group in Redmine
- **Type/role:** HTTP Request – Redmine update user (`PUT users/{{user.id}}.json`)
- **Body:** `group_ids: [22]`
- **Edge cases:** Group 22 must exist; user must be visible; permissions needed.

#### Node: Step 16.3: Code
- **Type/role:** Code – returns `[{}]` (placeholder to continue the chain).
- **Purpose:** ensures a clean item continues to GitLab creation.

#### Nodes: Step 17.2 → Step21.1
- **Role:** Create GitLab user, set password, map Slack user, DM user with both credentials, then post report message.

---

### Block 6 — Branch B: Redmine-only requests
**Overview:** If no “both” requests exist, the workflow checks for Redmine-only requests and provisions Redmine if missing.

**Nodes involved:**
- `Step 11.2: Find the Redmine account request record on Odoo 18`
- `Step12.2: If total_count is not equal to 0 = true`
- `Step13.2: Find and extract the email from the request`
- `Step 14.3: Get user info in RM6`
- `Step 15.3: If total_count is not equal to 0 = true`
- `Step 16.3: Create a new user in Redmine`
- `Step 17.3: Assign the user to a group in Redmine`
- `Step18.3: Convert to text`
- `Step 19.3: Send a message to the member via Slack once their Redmine account has been created.`
- `Step20.3: Send a message to channel REPORT`

#### Key behavior
- Step15.3 routes:
  - **True** (exists): does nothing (true output unconnected).
  - **False** (doesn’t exist): create user + group assignment + Slack notifications.
- Same configuration caveats apply: URL variables from Step4, Slack channel IDs, email mapping reliability.

---

### Block 7 — Branch C: GitLab-only requests
**Overview:** If no Redmine-only requests exist, it checks for GitLab-only requests and creates GitLab accounts (without verifying existence).

**Nodes involved:**
- `Step 13.3: Find the Gitlab account request record on Odoo 18`
- `Step 14.4: If total_count is not equal to 0 = true`
- `Step15.4: Find and extract the email from the request`
- `Step 16.4: Code`
- `Step 17.4: Create a new user in Gitlab`
- `Step 18.4: Send reset password`
- `Step19.4: Convert to text`
- `Step 20.4: Send a message to the member via Gitlab once their Redmine account has been created.` (misnamed; it’s Slack)
- `Step21.2: Send a message to channel REPORT`

#### Notable issues
- Step 14.4 false output is empty; if there are no GitLab-only requests, the workflow ends silently.
- No GitLab “exists” check here → may fail on duplicates with 409/400 from GitLab.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Step1: Odoo 18 called a webhook | Webhook | Entry trigger from Odoo | — | Step2: Respond to Webhook | ## Odoo 18 called a webhook<br>- The flow will be triggered when the Odoo system activates an action. |
| Step2: Respond to Webhook | Respond to Webhook | Immediate HTTP response to Odoo | Step1: Odoo 18 called a webhook | Step 3: Wait 5s | ## Odoo 18 called a webhook<br>- The flow will be triggered when the Odoo system activates an action. |
| Step 3: Wait 5s | Wait | Delay execution after response | Step2: Respond to Webhook | Step4: Set Variables | ## Odoo 18 called a webhook<br>- The flow will be triggered when the Odoo system activates an action. |
| Step4: Set Variables (disabled) | Set | Store constants (URLs/limit) | Step 3: Wait 5s | Step5: Handle get today | ## Odoo 18 called a webhook<br>- The flow will be triggered when the Odoo system activates an action. |
| Step5: Handle get today | Code | Compute today/yesterday/tomorrow strings | Step4: Set Variables | Step 6: Check if there's a requirement… | ## Odoo 18 called a webhook<br>- The flow will be triggered when the Odoo system activates an action. |
| Step 6: Check if there's a requirement to create a Redmine or GitLab account on Odoo 18. | HTTP Request | Query Odoo approvals (gate) | Step5: Handle get today | Step7: If total_count… | ## Querying data in Odoo<br>- Check if there are any request records for creating Redmine or Gitlab accounts, or both?<br>- If there are no records, end the flow.<br>- If so, proceed to the next step for filtering. |
| Step7: If total_count is not equal to 0 = true | IF | Gate: proceed only if requests exist | Step 6: Check if there's a requirement… | Step8: Get many users; End | ## Querying data in Odoo<br>- Check if there are any request records for creating Redmine or Gitlab accounts, or both?<br>- If there are no records, end the flow.<br>- If so, proceed to the next step for filtering. |
| Step8: Get many users | Slack | Load Slack users for email→ID mapping | Step7: If total_count… (true) | Step 9: Find the record requesting both… | ## Querying data in Odoo<br>- Check if there are any request records for creating Redmine or Gitlab accounts, or both?<br>- If there are no records, end the flow.<br>- If so, proceed to the next step for filtering. |
| End | NoOp | End when no Odoo requests | Step7: If total_count… (false) | — | ## Querying data in Odoo<br>- Check if there are any request records for creating Redmine or Gitlab accounts, or both?<br>- If there are no records, end the flow.<br>- If so, proceed to the next step for filtering. |
| Step 9: Find the record requesting both Redmine and Gitlab accounts on Odoo 18. | HTTP Request | Query Odoo for “both” requests | Step8: Get many users | Step10: If total_count… | ## Find the record requesting both Redmine and Gitlab accounts on Odoo 18.<br>- If the data from Odoo includes both (Gitlab and Redmine account creation requests), then extract the "email" from the request record.<br>- If the data doesn't meet the requirements, branch to the subflow "Gitlab or Redmine account creation requests". |
| Step10: If total_count is not equal to 0 = true | IF | Branch: both vs single-service | Step 9: Find the record requesting both… | Step 11.1… ; Step 11.2… | ## Find the record requesting both Redmine and Gitlab accounts on Odoo 18.<br>- If the data from Odoo includes both (Gitlab and Redmine account creation requests), then extract the "email" from the request record.<br>- If the data doesn't meet the requirements, branch to the subflow "Gitlab or Redmine account creation requests". |
| Step 11.1: Find and extract the email from the request | Code | Extract email/login parts (both) | Step10 (true) | Step12.1: Get user info in RM6 | ## Check on Redmine if that user's account already exists (by email).<br>- If you already have a Redmine account, proceed to the GitLab account creation flow.<br>- If you don't have an account yet, proceed to the GitLab account creation flow. |
| Step12.1: Get user info in RM6 | HTTP Request | Redmine lookup by email (both) | Step 11.1… | Step13.1: If total_count… | ## Check on Redmine if that user's account already exists (by email).<br>- If you already have a Redmine account, proceed to the GitLab account creation flow.<br>- If you don't have an account yet, proceed to the GitLab account creation flow. |
| Step13.1: If total_count is not equal to 0 = true | IF | Branch: Redmine exists? (both) | Step12.1… | Step14.1… ; Step 14.2… | ## Check on Redmine if that user's account already exists (by email).<br>- If you already have a Redmine account, proceed to the GitLab account creation flow.<br>- If you don't have an account yet, proceed to the GitLab account creation flow. |
| Step14.1: Get user information in Gitlab | HTTP Request | GitLab lookup (both path) | Step13.1 (true) | Step15.1… | ## Check on Gitlab if that user's account already exists (by email).<br>- If you already have an account, the flow will end and send a notification via Slack.<br>- If you don't have an account yet, proceed to the GitLab account creation flow and send a notification via Slack. |
| Step15.1:  Check if there is a record = true | IF | Branch: GitLab exists? (both path) | Step14.1… | Step16.1… ; Step 16.2… | ## Check on Gitlab if that user's account already exists (by email).<br>- If you already have an account, the flow will end and send a notification via Slack.<br>- If you don't have an account yet, proceed to the GitLab account creation flow and send a notification via Slack. |
| Step16.1: Send a message to channel | Slack | Notify channel: already exists | Step15.1 (true) | — | ## Create a new user in Gitlab |
| Step 16.2: Create a new user in Gitlab | HTTP Request | Create GitLab user (both path) | Step15.1 (false) | Step 17.1: Send reset password | ## Create a new user in Gitlab |
| Step 17.1: Send reset password | HTTP Request | Set GitLab password (both path) | Step 16.2… | Step18.1: Convert to text | ## Create a new user in Gitlab |
| Step18.1: Convert to text | Code | Map email→Slack member ID | Step 17.1… | Step 19.1… | ## Create a new user in Gitlab |
| Step 19.1: Send a message to the member via Slack once their Gitlab account has been created. | Slack | DM user GitLab credentials | Step18.1… | Step20.1… | ## Create a new user in Gitlab |
| Step20.1: Send a message to channel REPORT | Slack | Report channel: GitLab created | Step 19.1… | — | ## Create a new user in Gitlab |
| Step 14.2: Create a new user in Redmine | HTTP Request | Create Redmine user (both path) | Step13.1 (false) | Step 15.2… | ## Create a new user in Gitlab and Redmine <br>- Then announce the results via Slack. |
| Step 15.2: Assign the user to a group in Redmine | HTTP Request | Add Redmine group_ids [22] | Step 14.2… | Step 16.3: Code | ## Create a new user and assign the user to a group in Redmine |
| Step 16.3: Code | Code | Placeholder pass-through | Step 15.2… | Step 17.2… | ## Create a new user and assign the user to a group in Redmine |
| Step 17.2: Create a new user in Gitlab | HTTP Request | Create GitLab user (after Redmine) | Step 16.3: Code | Step 18.2… | ## Create a new user and send reset password in Gitlab |
| Step 18.2: Send reset password | HTTP Request | Set GitLab password (after Redmine) | Step 17.2… | Step19.2… | ## Create a new user and send reset password in Gitlab |
| Step19.2: Convert to text | Code | Map email→Slack member ID | Step 18.2… | Step 20.2… | ## Create a new user and send reset password in Gitlab |
| Step 20.2: Send a message to the member via Slack once their Gitlab and Redmine account has been created. | Slack | DM user both credentials | Step19.2… | Step21.1… | ## Create a new user in Gitlab and Redmine <br>- Then announce the results via Slack. |
| Step21.1: Send a message to channel REPORT | Slack | Report channel: both created | Step 20.2… | — | ## Create a new user in Gitlab and Redmine <br>- Then announce the results via Slack. |
| Step 11.2: Find the Redmine account request record on Odoo 18 | HTTP Request | Query Odoo Redmine-only | Step10 (false) | Step12.2… | ## Find the Redmine account request record on Odoo 18 |
| Step12.2: If total_count is not equal to 0 = true | IF | Branch: Redmine-only vs GitLab-only | Step 11.2… | Step13.2… ; Step 13.3… | ## Find the Redmine account request record on Odoo 18 |
| Step13.2: Find and extract the email from the request | Code | Extract email/login parts (Redmine-only) | Step12.2 (true) | Step 14.3… |  |
| Step 14.3: Get user info in RM6 | HTTP Request | Redmine lookup by email | Step13.2… | Step 15.3… |  |
| Step 15.3: If total_count is not equal to 0 = true | IF | Branch: exists? create if missing | Step 14.3… | (false) Step 16.3: Create a new user in Redmine |  |
| Step 16.3: Create a new user in Redmine | HTTP Request | Create Redmine user (Redmine-only) | Step 15.3 (false) | Step 17.3… | ## Create a new user and assign the user to a group in Redmine |
| Step 17.3: Assign the user to a group in Redmine | HTTP Request | Add group_ids [22] | Step 16.3… | Step18.3… | ## Create a new user and assign the user to a group in Redmine |
| Step18.3: Convert to text | Code | Map email→Slack member ID | Step 17.3… | Step 19.3… |  |
| Step 19.3: Send a message to the member via Slack once their Redmine account has been created. | Slack | DM user Redmine credentials | Step18.3… | Step20.3… |  |
| Step20.3: Send a message to channel REPORT | Slack | Report channel: Redmine created | Step 19.3… | — |  |
| Step 13.3: Find the Gitlab account request record on Odoo 18 | HTTP Request | Query Odoo GitLab-only | Step12.2 (false) | Step 14.4… |  |
| Step 14.4: If total_count is not equal to 0 = true | IF | Branch: proceed if GitLab-only exists | Step 13.3… | Step15.4… |  |
| Step15.4: Find and extract the email from the request | Code | Extract email/login parts (GitLab-only) | Step 14.4 (true) | Step 16.4: Code |  |
| Step 16.4: Code | Code | Placeholder pass-through | Step15.4… | Step 17.4… |  |
| Step 17.4: Create a new user in Gitlab | HTTP Request | Create GitLab user (GitLab-only) | Step 16.4: Code | Step 18.4… | ## Create a new user and send reset password in Gitlab |
| Step 18.4: Send reset password | HTTP Request | Set GitLab password (GitLab-only) | Step 17.4… | Step19.4… | ## Create a new user and send reset password in Gitlab |
| Step19.4: Convert to text | Code | Map email→Slack member ID | Step 18.4… | Step 20.4… |  |
| Step 20.4: Send a message to the member via Gitlab once their Redmine account has been created. | Slack | DM user GitLab credentials | Step19.4… | Step21.2… | ## Create a new user in Gitlab |
| Step21.2: Send a message to channel REPORT | Slack | Report channel: GitLab created | Step 20.4… | — | ## Create a new user in Gitlab |
| Sticky Note | Sticky Note | Comment | — | — |  |
| Sticky Note1 | Sticky Note | Comment | — | — |  |
| Sticky Note2 | Sticky Note | Comment | — | — |  |
| Sticky Note3 | Sticky Note | Comment | — | — |  |
| Sticky Note4 | Sticky Note | Comment | — | — |  |
| Sticky Note5 | Sticky Note | Comment | — | — |  |
| Sticky Note6 | Sticky Note | Comment | — | — |  |
| Sticky Note7 | Sticky Note | Comment | — | — |  |
| Sticky Note8 | Sticky Note | Comment | — | — |  |
| Sticky Note9 | Sticky Note | Comment | — | — |  |
| Sticky Note10 | Sticky Note | Comment | — | — |  |

---

## 4. Reproducing the Workflow from Scratch

1) **Create Webhook Trigger**
   1. Add node: **Webhook**
   2. Method: `POST`
   3. Authentication: **Header Auth**
      - Create credential **HTTP Header Auth** (set expected header name/value shared with Odoo).
   4. Response: **Respond with “Respond to Webhook” node**.

2) **Add Respond to Webhook**
   1. Add node: **Respond to Webhook**
   2. Keep default response (or set JSON `{ "status": "accepted" }`).
   3. Connect: Webhook → Respond to Webhook.

3) **Add Wait**
   1. Add node: **Wait**
   2. Configure a 5-second delay (explicitly set wait duration).
   3. Connect: Respond to Webhook → Wait.

4) **Add Set Variables (fix required)**
   1. Add node: **Set**
   2. Enable it (do **not** leave disabled).
   3. Use “Raw JSON” and include at least:
      - `limit`: `100`
      - `web_search_read`: your Odoo JSON-RPC endpoint (e.g., `https://odoo.example.com/web/dataset/call_kw` or your specific RPC proxy used)
      - `redmine6_Url`: e.g., `https://redmine.example.com/`
      - `gitlab_Url`: e.g., `https://gitlab.example.com/`
   4. Connect: Wait → Set.

5) **Add Date Computation**
   1. Add node: **Code**
   2. Paste the provided date JS (optionally fix dayOfWeek mapping).
   3. Connect: Set Variables → Code.

6) **Odoo Gate Query**
   1. Add node: **HTTP Request**
   2. Method: `POST`
   3. URL: `{{$node["Step4: Set Variables"].json.web_search_read}}`
   4. Auth: **Generic Credential Type** → `httpHeaderAuth` (same or another credential, depending on Odoo auth scheme).
   5. Body: JSON (Odoo JSON-RPC) with:
      - model `approval.request`
      - method `web_search_read`
      - domain: pending, category 14, date window, keyword match (Redmine/GitLab/RM)
      - limit: use `{{$node["Step4: Set Variables"].json.limit}}` (recommended; avoid Step5 limit reference)
   6. Connect: Date Code → Odoo Gate Query.

7) **Gate IF**
   1. Add node: **IF**
   2. Condition: check count properly based on your Odoo response.
      - If your response is `result.records`, use: `{{$json.result.records.length}} != 0`
   3. Connect: Odoo Gate Query → IF.
   4. False branch → **NoOp** (End).

8) **Slack: Load users**
   1. Add node: **Slack**
   2. Resource: `User`
   3. Operation: `Get All`
   4. Credentials: Slack API (OAuth/token) with `users:read`.
   5. Connect IF(true) → Slack Get All.

9) **Branch A: Both**
   1. Add Odoo HTTP Request to fetch “both” requests (same endpoint; domain tuned for both).
   2. IF node to check non-empty results.
   3. Code node to extract email (`rawEmail`, `login`, `extracted`).
   4. Redmine lookup HTTP Request: `GET {{$redmine6_Url}}users.json?mail={{$json.rawEmail}}`
   5. IF on `total_count != 0`.
      - If true: GitLab lookup and IF to determine existing user.
      - If false: Redmine create (`POST users.json`) → assign group (`PUT users/{id}.json`) → GitLab create → GitLab set password → Slack DM + Slack report.

10) **Branch B: Redmine-only**
   1. Odoo query for Redmine-only.
   2. IF non-empty → Code extract email → Redmine lookup → IF exists?
   3. If missing: create Redmine → assign group → Slack DM → Slack report.

11) **Branch C: GitLab-only**
   1. Odoo query for GitLab-only.
   2. IF non-empty → Code extract email → GitLab create → GitLab set password → Slack DM → Slack report.

12) **Slack messaging configuration**
   - For all “send to channel REPORT” nodes: select a real channel ID.
   - For DMs: ensure email→Slack mapping works; if not found, decide fallback behavior (e.g., notify ops channel with the email).

13) **Credentials**
   - **Odoo:** header-based auth as implemented (or replace with cookie/session flow if needed).
   - **Redmine:** `X-Redmine-API-Key` header (admin key recommended for user creation/group assignment).
   - **GitLab:** admin token header (e.g., `PRIVATE-TOKEN: <token>`).
   - **Slack:** token with `users:read`, `chat:write`, and DM permissions.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques. | Disclaimer (provided) |
| Contact / consulting: Linkedin / Website | [Linkedin](https://www.linkedin.com/company/bac-ha-software/posts/?feedView=all) / [Website](https://bachasoftware.com/bhsoft-contacts) |
| Workflow description, problem statement, setup ideas, and “take it further” suggestions | Contained in the large header Sticky Note (“Automate Redmine & GitLab Account Creation…”) |

