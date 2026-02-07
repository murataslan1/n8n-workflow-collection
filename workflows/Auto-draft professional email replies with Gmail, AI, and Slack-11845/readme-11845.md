Auto-draft professional email replies with Gmail, AI, and Slack

https://n8nworkflows.xyz/workflows/auto-draft-professional-email-replies-with-gmail--ai--and-slack-11845


# Auto-draft professional email replies with Gmail, AI, and Slack

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Auto-draft professional email replies with Gmail, AI, and Slack  
**Workflow name (internal):** Professional Email Automation Framework  
**Purpose:** Every 30 minutes, scan Gmail for unread inbox emails, generate a **polite Japanese business reply draft** using OpenAI, notify a Slack channel with the draft for **human review**, and label the email as processed to reduce repeated handling.  
**Important:** The workflow **does not send email replies** automatically; it only drafts and notifies.

### 1.1 Email Monitoring (Scheduled Intake)
Runs on a schedule, searches Gmail for candidate emails, and checks whether any results exist.

### 1.2 Email Selection & Fetching Full Content
Limits how many emails are handled per run and fetches full message details needed for body extraction.

### 1.3 AI Draft Generation
Extracts a safe plain-text body and asks OpenAI to draft a short, polite reply in Japanese with clarification questions when needed.

### 1.4 Notification & State Control
Posts the draft to Slack and labels the Gmail message as `AUTO_REPLIED` to prevent duplicate processing.

### 1.5 Optional Extension (Not Wired)
An unconnected “auto-send” gate exists as a placeholder for teams that want to extend the framework.

---

## 2. Block-by-Block Analysis

### Block 1 — Email Monitoring (Scheduled Intake)
**Overview:** Triggers every 30 minutes, searches Gmail for unread inbox emails, and proceeds only if at least one email was found.  
**Nodes involved:** Schedule Trigger; Search unreplied emails; Check if new emails exist

#### Node: Schedule Trigger
- **Type / role:** `Schedule Trigger` — starts executions on a fixed interval.
- **Key configuration:** Runs every **30 minutes**.
- **Inputs / outputs:** Entry node → outputs to **Search unreplied emails**.
- **Version notes:** Type version `1.3` (standard schedule trigger).
- **Failure / edge cases:** None typical beyond instance scheduling load; missed runs possible if n8n is down.

#### Node: Search unreplied emails
- **Type / role:** `Gmail` (operation: **getAll**) — lists emails that match a Gmail query.
- **Key configuration:**
  - Query: `in:inbox is:unread`
  - Limit: `10` messages returned per run (before later limiting).
- **Credentials:** Gmail OAuth2 required.
- **Inputs / outputs:** From **Schedule Trigger** → to **Check if new emails exist**.
- **Version notes:** Gmail node type version `2.2`.
- **Failure / edge cases:**
  - OAuth token expired / revoked.
  - Gmail API quota/rate limits.
  - Query returns unread messages that may have been handled previously unless they are marked/filtered (see “State Control” notes below).

#### Node: Check if new emails exist
- **Type / role:** `IF` — guards downstream processing when no items are returned.
- **Key configuration:** Condition checks `{{$items().length}} > 0`.
- **Inputs / outputs:** From **Search unreplied emails** → **true** path to **Limit - Max emails per run**. (False path is unused.)
- **Version notes:** IF node type version `2.3` with conditions “version 3” UI semantics.
- **Failure / edge cases:**
  - If upstream node returns no items, the IF still executes but routes to false path (unused), effectively ending the run.
  - Expression evaluation failures are unlikely here.

**Sticky note context:** “## Email Monitoring — Checks Gmail for new unreplied emails on a schedule.”

---

### Block 2 — Email Selection & Fetching Full Content
**Overview:** Restricts volume per execution and fetches full Gmail message payload for each selected email.  
**Nodes involved:** Limit - Max emails per run; Gmail - Get message details

#### Node: Limit - Max emails per run
- **Type / role:** `Limit` — caps the number of items processed.
- **Key configuration:** `maxItems: 5`.
- **Inputs / outputs:** From IF true path → to **Gmail - Get message details**.
- **Failure / edge cases:** None typical; it simply truncates items.

#### Node: Gmail - Get message details
- **Type / role:** `Gmail` (operation: **get**) — retrieves full message details for each Gmail message ID.
- **Key configuration:**
  - `messageId: {{$json.id}}` (expects each incoming item has `id` from Gmail search results)
- **Credentials:** Gmail OAuth2 required.
- **Inputs / outputs:**
  - Input from **Limit - Max emails per run**
  - Output is split to:
    - **Extract email body for AI**
    - **Mark email as AUTO_REPLIED** (runs in parallel from the same message details)
- **Version notes:** Gmail node type version `2.2`.
- **Failure / edge cases:**
  - Missing `id` in upstream items (would break the expression).
  - Gmail API auth/quota issues.
  - Message deleted/moved between search and get.

---

### Block 3 — AI Draft Generation
**Overview:** Extracts plain text safely from the Gmail payload (handles multipart), then generates a short professional Japanese reply draft using OpenAI with “ask questions if unclear” constraint.  
**Nodes involved:** Extract email body for AI; AI - Draft professional email reply

#### Node: Extract email body for AI
- **Type / role:** `Code` — transforms Gmail’s message payload into a clean text input for the LLM.
- **Key configuration choices (interpreted):**
  - Decodes base64-encoded body parts.
  - Prefers:
    1) `payload.body.data` (simple emails),
    2) multipart `text/plain` part,
    3) fallback to `snippet`.
  - Emits a simplified object:
    - `emailText`: trimmed body text
    - `subject`: set to `$json.snippet` (note: this is not the real subject header)
    - `threadId`
    - `receivedAt`: derived from `internalDate`
- **Inputs / outputs:** From **Gmail - Get message details** → to **AI - Draft professional email reply**.
- **Version notes:** Code node type version `2`.
- **Failure / edge cases:**
  - Gmail uses **base64url** encoding; `Buffer.from(str, 'base64')` often works but can fail on certain characters (`-`, `_`) in strict cases. If you see decoding issues, convert base64url to base64 (`-`→`+`, `_`→`/`, pad with `=`).
  - If the email is HTML-only and no `text/plain` part exists, fallback is `snippet`, which may be incomplete.
  - `subject` is incorrectly mapped to snippet; if you need real subject, parse headers (`payload.headers`).

#### Node: AI - Draft professional email reply
- **Type / role:** `OpenAI (LangChain)` — generates the reply draft.
- **Key configuration choices:**
  - Model: `gpt-4.1-mini`
  - System message: “professional assistant who writes polite Japanese business emails… do not assume; ask questions to confirm unclear facts.”
  - User prompt: requests a **polite and short reply** with:
    - opening greeting
    - thanks
    - address purpose (ask questions if unclear)
    - propose next actions (dates/info)
    - closing greeting
    - **no signature**
  - Injects email body via `{{ $json.emailText }}`
- **Credentials:** OpenAI API credential required.
- **Inputs / outputs:** From **Extract email body for AI** → to **Notify draft reply in Slack**.
- **Version notes:** Node type version `2.1` (`@n8n/n8n-nodes-langchain.openAi`).
- **Failure / edge cases:**
  - OpenAI credential missing/invalid; model not available in region/account.
  - Rate limits / timeouts.
  - Output schema changes: this workflow later reads `json.output[0].content[0].text`; if node output format differs, Slack message may break.

**Sticky note context:** “## AI Draft Generation — Creates a professional email reply draft using AI. Human review required.”

---

### Block 4 — Notification & State Control
**Overview:** Posts the AI draft into Slack for review and applies a Gmail label to mark the message as processed.  
**Nodes involved:** Notify draft reply in Slack; Mark email as AUTO_REPLIED

#### Node: Notify draft reply in Slack
- **Type / role:** `Slack` — sends a channel message containing the AI draft.
- **Key configuration:**
  - Post to a specific channel (`channelId` selected in UI; cached name `all-kota`)
  - Message text includes:
    - Intro line: “There is an email that needs to be replied to”
    - Draft: `{{ $node["AI - Draft professional email reply"].json.output[0].content[0].text }}`
    - Footer: “(This message is automatically generated.)”
- **Credentials:** Slack API credential required.
- **Inputs / outputs:** From **AI - Draft professional email reply** → workflow ends.
- **Version notes:** Slack node type version `2.4`.
- **Failure / edge cases:**
  - Channel not accessible to the token, or channel ID invalid.
  - Slack rate limits.
  - If the OpenAI output path is wrong/empty, the Slack message may be blank or expression may fail.

**Sticky note context:** “## 📬 Notification & State Control — Sends AI-generated draft to Slack • Marks email as AUTO_REPLIED • Prevents duplicate processing”

#### Node: Mark email as AUTO_REPLIED
- **Type / role:** `Gmail` (operation: **addLabels**) — adds a label to the message to indicate it was handled.
- **Key configuration:**
  - `messageId: {{$json.id}}`
  - `labelIds: ["Label_5043339914715829876"]` (this corresponds to the Gmail label “AUTO_REPLIED”)
- **Credentials:** Gmail OAuth2 required.
- **Inputs / outputs:** Runs in parallel from **Gmail - Get message details**; no downstream nodes.
- **Version notes:** Gmail node type version `2.2`.
- **Failure / edge cases:**
  - Label ID missing/wrong (common when moving between accounts).
  - Permission/quota issues.
  - **Duplicate processing risk remains** unless the search query excludes already-labeled emails; currently it searches only `in:inbox is:unread`. If the email stays unread, it may be found again even after labeling.

**Sticky note context:** Same “Notification & State Control” note.

---

### Block 5 — Optional Extension (Not Wired)
**Overview:** Placeholder gate for implementing auto-send behavior; currently unconnected and configured with an empty equals condition (always false / invalid intent).  
**Nodes involved:** OPTIONAL – Auto-send reply

#### Node: OPTIONAL – Auto-send reply
- **Type / role:** `IF` — intended as a switch to enable/disable auto-sending downstream actions.
- **Key configuration:** Currently compares empty string to empty string (as configured: leftValue `""`, rightValue `""`), which is not meaningful as-is.
- **Inputs / outputs:** No connections (intentionally left unconnected).
- **Version notes:** IF node type version `2.3`.
- **Failure / edge cases:** None currently (it never runs). If connected, you must set a real condition (e.g., an environment variable, a config flag, a Slack approval signal, etc.).

**Sticky note context:** “How to customize this framework — Optional nodes are intentionally left unconnected…”

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Schedule Trigger | Schedule Trigger | Periodic execution (every 30 minutes) | — | Search unreplied emails | ## Email Monitoring\nChecks Gmail for new unreplied emails on a schedule. |
| Search unreplied emails | Gmail | Search unread inbox emails | Schedule Trigger | Check if new emails exist | ## Email Monitoring\nChecks Gmail for new unreplied emails on a schedule. |
| Check if new emails exist | IF | Proceed only when search returned items | Search unreplied emails | Limit - Max emails per run (true path) | ## Email Monitoring\nChecks Gmail for new unreplied emails on a schedule. |
| Limit - Max emails per run | Limit | Cap items processed per run (5) | Check if new emails exist | Gmail - Get message details |  |
| Gmail - Get message details | Gmail | Fetch full message payload by ID | Limit - Max emails per run | Extract email body for AI; Mark email as AUTO_REPLIED |  |
| Extract email body for AI | Code | Decode/extract plain text body from Gmail payload | Gmail - Get message details | AI - Draft professional email reply | ## AI Draft Generation\nCreates a professional email reply draft using AI.\nHuman review required. |
| AI - Draft professional email reply | OpenAI (LangChain) | Generate Japanese business email reply draft | Extract email body for AI | Notify draft reply in Slack | ## AI Draft Generation\nCreates a professional email reply draft using AI.\nHuman review required. |
| Notify draft reply in Slack | Slack | Send draft to Slack channel for review | AI - Draft professional email reply | — | ## 📬 Notification & State Control\n \n• Sends AI-generated draft to Slack\n• Marks email as AUTO_REPLIED\n• Prevents duplicate processing |
| Mark email as AUTO_REPLIED | Gmail | Add Gmail label to mark processed | Gmail - Get message details | — | ## 📬 Notification & State Control\n \n• Sends AI-generated draft to Slack\n• Marks email as AUTO_REPLIED\n• Prevents duplicate processing |
| OPTIONAL – Auto-send reply | IF | Placeholder gate for future auto-send logic (unused) | — | — | ## How to customize this framework\nOptional nodes are intentionally left unconnected.\nUsers can plug them into the flow depending on their use case. |
| Sticky Note | Sticky Note | Comment node | — | — |  |
| Sticky Note1 | Sticky Note (disabled) | Comment node | — | — |  |
| Sticky Note2 | Sticky Note | Comment node | — | — |  |
| Sticky Note3 | Sticky Note | Comment node | — | — |  |
| Sticky Note4 | Sticky Note | Comment node | — | — |  |
| Sticky Note5 | Sticky Note | Comment node | — | — |  |

> Note: Sticky Notes are included as nodes by n8n, but they do not participate in execution.

---

## 4. Reproducing the Workflow from Scratch

1) **Create workflow**
- Name: `Professional Email Automation Framework` (or your preferred name)
- Keep workflow **inactive** until credentials and label are ready.

2) **Add Schedule Trigger**
- Node: **Schedule Trigger**
- Interval: every **30 minutes**
- Connect to next node.

3) **Add Gmail search**
- Node: **Gmail**
- Operation: **Get Many (getAll)**
- Filters / Query (`q`): `in:inbox is:unread`
- Limit: `10`
- **Credentials:** create/select **Gmail OAuth2** credential (Google project + OAuth consent; grant Gmail permissions).
- Connect to IF node.

4) **Add IF “Check if new emails exist”**
- Node: **IF**
- Condition: **Number** → `{{$items().length}}` **greater than** `0`
- Use the **true** output to continue.

5) **Add Limit**
- Node: **Limit**
- Max items: `5`
- Connect from IF true path.

6) **Add Gmail “Get message details”**
- Node: **Gmail**
- Operation: **Get**
- Message ID: `{{$json.id}}`
- Same Gmail OAuth2 credential
- Connect its output to **two** nodes in parallel:
  - **Extract email body for AI**
  - **Mark email as AUTO_REPLIED**

7) **Add Code node “Extract email body for AI”**
- Node: **Code**
- Paste logic that:
  - decodes base64 payload body or multipart `text/plain`
  - falls back to snippet
  - returns `{ emailText, subject, threadId, receivedAt }`
- Connect to OpenAI node.

8) **Add OpenAI node to generate draft**
- Node: **OpenAI (LangChain)** (the `@n8n/n8n-nodes-langchain.openAi` node)
- Credentials: create/select **OpenAI API** credential (API key)
- Model: `gpt-4.1-mini`
- Messages:
  - System: professional assistant writing polite Japanese business emails; ask clarifying questions if facts unclear.
  - User: request short reply with greeting/thanks/answer + questions/next actions/closing/no signature; include `{{ $json.emailText }}`.
- Connect to Slack node.

9) **Add Slack notification**
- Node: **Slack**
- Operation: **Post message** (send text to channel)
- Select: `channel`
- Channel: choose your target channel
- Text: include the AI output; ensure the expression matches your node’s actual output schema. (In this workflow it is: `{{$node["AI - Draft professional email reply"].json.output[0].content[0].text}}`.)
- Credentials: create/select **Slack API** credential (OAuth token with chat:write and channel access).

10) **Add Gmail label node “Mark email as AUTO_REPLIED”**
- Before configuring the node, **create a Gmail label** in Gmail named: `AUTO_REPLIED`.
- Node: **Gmail**
- Operation: **Add Labels**
- Message ID: `{{$json.id}}`
- Label IDs: select the `AUTO_REPLIED` label (n8n will store it as a label ID like `Label_...`)
- Connect from **Gmail - Get message details** in parallel with the extraction branch.

11) **(Optional) Add the placeholder “OPTIONAL – Auto-send reply”**
- Node: **IF**
- Leave unconnected as a future extension point (or wire it after AI generation if you plan to implement auto-send after approval).
- If you do connect it, replace the empty condition with a real flag/approval mechanism.

12) **Activate workflow**
- Run a manual test first.
- Then set workflow to **Active**.

**Recommended adjustment (to truly prevent duplicates):**
- Modify the Gmail search query to exclude labeled messages, e.g.:
  - `in:inbox is:unread -label:AUTO_REPLIED`
This aligns with the stated intention “prevents duplicate processing.”

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| This is a professional email automation framework… monitors Gmail, retrieves full content, extracts plain text safely, generates AI draft, sends to Slack, labels email to prevent duplicate processing. Does NOT send emails automatically; only creates drafts for review. Setup: connect Gmail; create label AUTO_REPLIED; connect OpenAI; connect Slack; adjust schedule. | Sticky note content (“I’m a note”) embedded in the workflow canvas. |
| Email Monitoring: checks Gmail for new unreplied emails on a schedule. | Sticky note near monitoring block. |
| AI Draft Generation: creates a professional email reply draft using AI; human review required. | Sticky note near AI block (disabled in workflow but still informative). |
| Notification & State Control: sends AI draft to Slack; marks email as AUTO_REPLIED; prevents duplicate processing. | Sticky notes near Slack/label nodes. |
| How to customize: optional nodes intentionally left unconnected; users can plug them depending on use case. | Sticky note near optional extension area. |