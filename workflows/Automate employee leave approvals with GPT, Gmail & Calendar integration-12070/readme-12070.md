Automate employee leave approvals with GPT, Gmail & Calendar integration

https://n8nworkflows.xyz/workflows/automate-employee-leave-approvals-with-gpt--gmail---calendar-integration-12070


# Automate employee leave approvals with GPT, Gmail & Calendar integration

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:** This workflow automates employee leave requests end-to-end: collecting leave details via an n8n Form, using GPT to generate a polished HR/manager-ready summary, sending an approval email that waits for a decision, then either (a) notifying the employee of approval or (b) scheduling a short discussion by finding the earliest available 10-minute slot the next day via Google Calendar and informing the employee.

**Primary use cases:**
- HR teams standardizing leave approval communications
- Managers approving/rejecting leave requests directly from email
- Automatic follow-up scheduling when clarification is needed

### 1.1 Input Reception (Form)
Captures leave request details from employees through an n8n-hosted form.

### 1.2 AI Summarization (GPT + Structured Output)
Transforms raw form fields into a professional email **subject** and **HTML body**, with rules for single-day vs multi-day leave.

### 1.3 Email Approval Gate (Gmail Send-and-Wait)
Sends the summarized request and pauses workflow execution until an approval decision is recorded.

### 1.4 Decision Routing
Branches based on approval outcome.

### 1.5 Approved Path: Employee Notification
Sends an “approved” email to the employee.

### 1.6 Not Approved Path: Calendar Slot Search (Agent + Calendar Tools)
Uses an agent with Google Calendar tools to find the earliest free 10-minute slot tomorrow between 09:00–18:00.

### 1.7 Discussion Email to Employee
Emails the scheduled discussion time to the employee.

---

## 2. Block-by-Block Analysis

### Block 1 — Input Reception (Form)

**Overview:** Collects leave request details via an n8n Form Trigger and starts the workflow with a structured payload.  
**Nodes involved:** `On form submission`

#### Node: On form submission
- **Type / role:** `n8n-nodes-base.formTrigger` — workflow entry point that generates an execution when the form is submitted.
- **Key configuration choices:**
  - **Form title:** “Leave Request Form”
  - **Confirmation text:** “You will be notified via email regarding the approval or rejection of your leave request.”
  - **Fields:**
    - Employee Name (required)
    - Email (required, email type)
    - From (required, date type)
    - To (optional, date type)
    - Reason for the Leave (required)
    - What Important tasks were you working on? (required; placeholder “Priorities”)
- **Input/Output:**
  - **Output:** One item containing the form fields as JSON (e.g., `$json['Employee Name']`, `$json.Email`, `$json.From`, `$json.To`, etc.)
  - **Next node:** `AI Agent`
- **Edge cases / failures:**
  - If the optional **To** field is empty, downstream logic must handle single-day leave (the AI prompt explicitly defines this rule).
  - Date formatting depends on n8n form date output; ensure consistent format for email and calendar expectations.
- **Version notes:** Node typeVersion `2.3` (behavior may differ from older Form Trigger versions regarding field naming and response options).

---

### Block 2 — AI Summarization (GPT + Structured Output)

**Overview:** Uses an LLM agent to generate a professional leave request summary (HTML only) plus an email subject, enforcing formatting and content constraints via a structured output parser.  
**Nodes involved:** `AI Agent`, `OpenAI Chat Model`, `Structured Output Parser`

#### Node: OpenAI Chat Model
- **Type / role:** `@n8n/n8n-nodes-langchain.lmChatOpenAi` — provides the chat model backing the agent.
- **Configuration choices:**
  - **Model:** `gpt-4o-mini`
  - Default options (no special temperature/limits shown).
- **Connections:**
  - Connected to `AI Agent` via **ai_languageModel**.
- **Edge cases / failures:**
  - Missing/invalid OpenAI credentials, quota exhaustion, model unavailability.
  - Potential output variability without stricter model params; mitigated by structured parser.
- **Version notes:** typeVersion `1.3`.

#### Node: Structured Output Parser
- **Type / role:** `@n8n/n8n-nodes-langchain.outputParserStructured` — enforces the agent output schema.
- **Configuration choices:**
  - Schema example:
    - `Subject` (string)
    - `Body` (string)
- **Connections:**
  - Connected to `AI Agent` via **ai_outputParser**.
- **Edge cases / failures:**
  - If the model returns keys not matching schema (`Subject`/`Body`) or invalid JSON-like structure, parsing can fail.
  - The agent prompt requests `subject` and `body` (lowercase), but the parser schema uses `Subject` and `Body` (capitalized). In practice, n8n structured parsers can be sensitive to key names—this mismatch is a common failure point and should be aligned.
- **Version notes:** typeVersion `1.3`.

#### Node: AI Agent
- **Type / role:** `@n8n/n8n-nodes-langchain.agent` — generates a polished email subject/body from form input.
- **Configuration choices (interpreted):**
  - Prompt defines the agent as **HR Operations Assistant**
  - Receives input as an array with one object; references form values via expressions like:
    - `{{ $json['Employee Name'] }}`
    - `{{ $json.Email }}`
    - `{{ $json.From }}`, `{{ $json.To }}`
  - Business rules:
    - If **To** is empty/null → single-day leave on **From**
    - Else → inclusive date range
  - Output rules:
    - HTML only, limited allowed tags, no `<html>/<head>/<body>`
    - Exactly two outputs: subject + body
  - `hasOutputParser: true` meaning it is expected to produce structured output for the downstream parser.
- **Input/Output:**
  - **Input:** from `On form submission`
  - **Output:** an object typically stored under `$json.output` after parsing (as referenced later)
  - **Next node:** `Send message and wait for response`
- **Edge cases / failures:**
  - If the LLM includes disallowed tags or extra text, email formatting may break or parser may fail.
  - The example uses templating constructs like `{% if %}` which are not actually executed by n8n; the agent must produce final resolved text itself. If the model echoes template syntax, the email may contain raw `{% if ... %}`.
- **Version notes:** typeVersion `3`.

---

### Block 3 — Email Approval Gate (Send-and-Wait)

**Overview:** Emails the generated summary and waits for an approval/rejection response, enabling an asynchronous approval workflow.  
**Nodes involved:** `Send message and wait for response`

#### Node: Send message and wait for response
- **Type / role:** `n8n-nodes-base.gmail` with operation `sendAndWait` — sends an email and pauses until a recipient action/response is captured by n8n.
- **Configuration choices:**
  - **To:** employee email (!) via `={{ $('On form submission').item.json.Email }}`
  - **Subject:** `={{ $json.output.Subject }}`
  - **Body:** `={{ $json.output.Body }}`
  - **Approval options:**
    - approvalType: `double`
    - disapproveLabel: `Reject`
- **Input/Output:**
  - **Input:** output from `AI Agent` (expected to have `$json.output.Subject` and `$json.output.Body`)
  - **Output:** approval metadata under something like `$json.data.approved` (used by the next `If` node)
  - **Next node:** `If`
- **Important design note (logic issue):**
  - This “approval request” is being sent to the **employee** (the requester), not a manager/approver mailbox. In most approval processes, this should go to a manager/HR approver address, not the requestor.
- **Edge cases / failures:**
  - Gmail OAuth credential issues, blocked scopes, expired refresh token.
  - “Send and wait” depends on n8n’s approval mechanism; if no response arrives, execution remains waiting until timeout/retention rules apply.
  - If `$json.output.Subject/Body` don’t exist due to parser mismatch, message will fail.
- **Version notes:** typeVersion `2.2`.

---

### Block 4 — Decision Routing

**Overview:** Routes the workflow depending on whether the approval response indicates approved = true.  
**Nodes involved:** `If`

#### Node: If
- **Type / role:** `n8n-nodes-base.if` — conditional branch.
- **Configuration choices:**
  - Condition: boolean equals
    - `leftValue`: `={{ $json.data.approved }}`
    - `rightValue`: `true`
- **Input/Output:**
  - **Input:** from `Send message and wait for response`
  - **True output:** `Send a message` (approval email)
  - **False output:** `Booking Agent` (schedule discussion flow)
- **Edge cases / failures:**
  - If `$json.data.approved` is missing (unexpected response structure), the condition may evaluate false or error depending on strict validation.
- **Version notes:** typeVersion `2.3`.

---

### Block 5 — Approved Path: Employee Notification

**Overview:** Sends a confirmation email to the employee that the leave request has been approved.  
**Nodes involved:** `Send a message`

#### Node: Send a message
- **Type / role:** `n8n-nodes-base.gmail` — sends approval notification email.
- **Configuration choices:**
  - **To:** `={{ $('On form submission').item.json.Email }}`
  - **Subject:** “Leave Approval Status”
  - **HTML body:** templated with form values:
    - Employee name
    - Leave duration shown as `From - To`
    - Reason and a generic coverage acknowledgment
- **Input/Output:**
  - **Input:** from `If` (true branch)
  - **No downstream nodes** (end of branch)
- **Edge cases / failures:**
  - If **To** is empty (single-day), the email will show `From - ` (trailing dash). Consider adding conditional text or reuse the agent logic.
  - Gmail auth failures.
- **Version notes:** typeVersion `2.2`.

---

### Block 6 — Not Approved Path: Calendar Slot Search (Agent + Calendar Tools)

**Overview:** When not approved (rejected or needs clarification), an LLM agent uses Google Calendar tools to find the earliest free 10-minute slot tomorrow (09:00–18:00, Asia/Kolkata).  
**Nodes involved:** `Booking Agent`, `OpenAI`, `Get Events`, `Check Availability`, `Output Parser`

#### Node: OpenAI
- **Type / role:** `@n8n/n8n-nodes-langchain.lmChatOpenAi` — chat model for the booking agent.
- **Configuration choices:**
  - Model: `gpt-4o-mini`
- **Connections:**
  - Feeds `Booking Agent` via **ai_languageModel**
- **Edge cases:** Same as other OpenAI node (credentials/quota/model).
- **Version notes:** typeVersion `1.2` (slightly different from the other OpenAI node version).

#### Node: Get Events
- **Type / role:** `n8n-nodes-base.googleCalendarTool` — LangChain tool wrapper to fetch events.
- **Configuration choices:**
  - **Operation:** `getAll`, `returnAll: true`
  - **Calendar:** `user@example.com` (placeholder)
  - **timeMin/timeMax:** expressions intended to represent **tomorrow 09:00:00 → 18:00:00**
- **Connections:**
  - Available to `Booking Agent` via **ai_tool**
- **Edge cases / failures:**
  - Google Calendar OAuth/permissions issues.
  - The timeMin/timeMax expressions are overly complex and potentially incorrect:
    - They use `setHours(...) && new Date(...).toISOString()...` which returns the second operand, not the date object.
    - They also format as `"YYYY-MM-DD HH:MM:SS"` (space-separated), while many Calendar APIs expect RFC3339 timestamps (`YYYY-MM-DDTHH:MM:SSZ`) unless the tool specifically accepts this format.
  - “Tomorrow” is always calendar day +1; it does not skip weekends/holidays despite prompt saying “next business day”.
- **Version notes:** typeVersion `1.3`.

#### Node: Check Availability
- **Type / role:** `n8n-nodes-base.googleCalendarTool` — tool to compute free/busy (availability output).
- **Configuration choices:**
  - **Timezone:** Asia/Kolkata
  - **outputFormat:** availability
  - Same **calendar** and **timeMin/timeMax** expressions as above
- **Connections:** available to `Booking Agent` via **ai_tool**
- **Edge cases:** Same timestamp-format risk and calendar auth issues.
- **Version notes:** typeVersion `1.3`.

#### Node: Output Parser
- **Type / role:** `@n8n/n8n-nodes-langchain.outputParserStructured` — enforces a strict JSON output: `{ "start_time": "" }`.
- **Connections:** to `Booking Agent` via **ai_outputParser**
- **Edge cases:**
  - Agent must output JSON exactly; any extra text breaks parsing.
- **Version notes:** typeVersion `1.3`.

#### Node: Booking Agent
- **Type / role:** `@n8n/n8n-nodes-langchain.agent` — orchestrates tool calls to find the earliest available slot.
- **Configuration choices:**
  - Prompt enforces:
    - Must call **Get Events** first
    - Only call **Check Availability** if events exist
    - Find earliest free 10-minute slot from 09:00 to 18:00 tomorrow
    - Output exactly one JSON object: `{"start_time":"YYYY-MM-DD HH:MM:SS"}`
    - If none: `{"start_time":"No available slots found"}`
- **Input/Output:**
  - **Input:** from `If` false branch
  - **Output:** parsed structured output under `$json.output.start_time` (as referenced downstream)
  - **Next node:** `Send a message1`
- **Edge cases / failures:**
  - Prompt says “next business day”, but logic/timeMin/timeMax are hardcoded to “tomorrow” only.
  - The agent depends on tool output correctness; if timeMin/timeMax formatting is wrong, the tool might return errors or unexpected results and the agent may fail to comply with output format.
- **Version notes:** typeVersion `2.2`.

---

### Block 7 — Discussion Email to Employee

**Overview:** Sends an email to the employee with the scheduled discussion time when leave cannot be approved immediately.  
**Nodes involved:** `Send a message1`

#### Node: Send a message1
- **Type / role:** `n8n-nodes-base.gmail` — sends follow-up email.
- **Configuration choices:**
  - **To:** employee email from form
  - **Subject:** “Discussion Required Regarding Leave Request”
  - **Body:** includes scheduled time from `{{ $json.output.start_time }}`
- **Input/Output:**
  - **Input:** from `Booking Agent`
  - **End of branch**
- **Edge cases / failures:**
  - If booking agent returns “No available slots found”, email still sends that literal string—consider alternative messaging.
  - Gmail auth failures.
- **Version notes:** typeVersion `2.2`.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| On form submission | n8n-nodes-base.formTrigger | Entry point: collect leave request | — | AI Agent | ## Leave Request Approval Automation with AI & Calendar Scheduling… (full note applies) / ## Step 1: Capture, summarize, and request approval |
| AI Agent | @n8n/n8n-nodes-langchain.agent | Generate professional summary + subject | On form submission; OpenAI Chat Model (ai); Structured Output Parser (ai) | Send message and wait for response | ## Leave Request Approval Automation… / ## Step 1: Capture, summarize, and request approval |
| OpenAI Chat Model | @n8n/n8n-nodes-langchain.lmChatOpenAi | LLM for summary agent | — | AI Agent (ai_languageModel) | ## Leave Request Approval Automation… / ## Step 1: Capture, summarize, and request approval |
| Structured Output Parser | @n8n/n8n-nodes-langchain.outputParserStructured | Enforce Subject/Body schema | — | AI Agent (ai_outputParser) | ## Leave Request Approval Automation… / ## Step 1: Capture, summarize, and request approval |
| Send message and wait for response | n8n-nodes-base.gmail | Send approval request email + wait | AI Agent | If | ## Leave Request Approval Automation… / ## Step 1: Capture, summarize, and request approval |
| If | n8n-nodes-base.if | Route by approval result | Send message and wait for response | Send a message (true); Booking Agent (false) | ## Leave Request Approval Automation… / ## Step 2: Notify or schedule discussion |
| Send a message | n8n-nodes-base.gmail | Notify employee of approval | If (true) | — | ## Leave Request Approval Automation… / ## Step 2: Notify or schedule discussion |
| Booking Agent | @n8n/n8n-nodes-langchain.agent | Find earliest free 10-min slot tomorrow | If (false); OpenAI (ai); Get Events (ai tool); Check Availability (ai tool); Output Parser (ai) | Send a message1 | ## Leave Request Approval Automation… / ## Step 2: Notify or schedule discussion |
| OpenAI | @n8n/n8n-nodes-langchain.lmChatOpenAi | LLM for booking agent | — | Booking Agent (ai_languageModel) | ## Leave Request Approval Automation… / ## Step 2: Notify or schedule discussion |
| Get Events | n8n-nodes-base.googleCalendarTool | Tool: fetch tomorrow’s events | — | Booking Agent (ai_tool) | ## Leave Request Approval Automation… / ## Step 2: Notify or schedule discussion |
| Check Availability | n8n-nodes-base.googleCalendarTool | Tool: compute availability | — | Booking Agent (ai_tool) | ## Leave Request Approval Automation… / ## Step 2: Notify or schedule discussion |
| Output Parser | @n8n/n8n-nodes-langchain.outputParserStructured | Enforce start_time JSON | — | Booking Agent (ai_outputParser) | ## Leave Request Approval Automation… / ## Step 2: Notify or schedule discussion |
| Send a message1 | n8n-nodes-base.gmail | Email discussion time to employee | Booking Agent | — | ## Leave Request Approval Automation… / ## Step 2: Notify or schedule discussion |
| Sticky Note | n8n-nodes-base.stickyNote | Documentation | — | — | ## Leave Request Approval Automation with AI & Calendar Scheduling… |
| Sticky Note1 | n8n-nodes-base.stickyNote | Documentation | — | — | ## Step 1: Capture, summarize, and request approval |
| Sticky Note2 | n8n-nodes-base.stickyNote | Documentation | — | — | ## Step 2: Notify or schedule discussion |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow**
   - Name it: **Employee Leave Approval System**
   - (Optional) Set workflow setting **Execution Order** to `v1` to match the original.

2. **Add “On form submission” (Form Trigger)**
   - Node: **Form Trigger**
   - Title: `Leave Request Form`
   - Description: “Please fill every detail properly…”
   - Add fields (ensure labels match exactly):
     1) `Employee Name` (required, text)  
     2) `Email` (required, type: email)  
     3) `From` (required, type: date)  
     4) `To` (optional, type: date)  
     5) `Reason for the Leave` (required, text)  
     6) `What Important tasks were you working on?` (required, text; placeholder `Priorities`)
   - Form confirmation message: “You will be notified via email regarding the approval or rejection of your leave request.”
   - Disable attribution append (if available in options).

3. **Add AI summarization agent**
   - Node: **AI Agent** (LangChain Agent)
   - Set **Prompt Type** to “Define”
   - Paste the HR assistant instructions (role, rules, HTML-only constraint).
   - Ensure it outputs exactly two fields (subject/body).
   - **Add an OpenAI Chat Model node**
     - Model: `gpt-4o-mini`
     - Configure **OpenAI credentials** in n8n (OpenAI API key).
   - Connect **OpenAI Chat Model → AI Agent** via *AI Language Model* connection.
   - **Add a Structured Output Parser node**
     - Schema example with keys you want to enforce.
     - Recommended: make schema keys match what downstream nodes reference (either adjust schema to `Subject/Body` consistently or update expressions to `subject/body` consistently).
   - Connect **Structured Output Parser → AI Agent** via *AI Output Parser* connection.

4. **Add Gmail “Send and wait” approval email**
   - Node: **Gmail**
   - Operation: **Send and Wait for Response** (`sendAndWait`)
   - Credentials: connect Gmail OAuth2 with required scopes.
   - **To:** set to the approver email address (recommended) or keep employee email as in the original:
     - Original: `={{ $('On form submission').item.json.Email }}`
   - **Subject:** `={{ $json.output.Subject }}`
   - **Message:** `={{ $json.output.Body }}`
   - Approval options:
     - Approval type: `double`
     - Disapprove label: `Reject`
   - Connect **AI Agent → Send message and wait for response**

5. **Add decision node**
   - Node: **If**
   - Condition:
     - Left value: `={{ $json.data.approved }}`
     - Operator: boolean `equals`
     - Right value: `true`
   - Connect **Send message and wait for response → If**

6. **Approved branch: send approval email**
   - Node: **Gmail** (send)
   - To: `={{ $('On form submission').item.json.Email }}`
   - Subject: `Leave Approval Status`
   - Message: approval HTML template using form fields.
   - Connect **If (true) → Send a message**

7. **Not-approved branch: create booking agent + calendar tools**
   - Add **Booking Agent** (LangChain Agent)
     - Prompt Type: “Define”
     - Paste the availability-checking instructions.
   - Add **OpenAI Chat Model** for this agent (can reuse the same model/credentials)
     - Model: `gpt-4o-mini`
   - Connect **OpenAI → Booking Agent** via *AI Language Model*.
   - Add **Google Calendar Tool** nodes:
     - **Get Events**
       - Operation: `getAll`, returnAll enabled
       - Calendar: select the manager’s calendar (replace `user@example.com`)
       - timeMin/timeMax: configure for tomorrow 09:00–18:00 in your preferred accepted format (ensure the node/tool accepts your timestamp format).
     - **Check Availability**
       - Resource: calendar
       - Output format: availability
       - Timezone: `Asia/Kolkata`
       - Same timeMin/timeMax window
   - Connect **Get Events → Booking Agent** via *AI Tool*
   - Connect **Check Availability → Booking Agent** via *AI Tool*
   - Add **Structured Output Parser** for booking output
     - Schema: `{ "start_time": "" }`
   - Connect **Output Parser → Booking Agent** via *AI Output Parser*
   - Connect **If (false) → Booking Agent**

8. **Send discussion email**
   - Node: **Gmail** (send)
   - To: `={{ $('On form submission').item.json.Email }}`
   - Subject: `Discussion Required Regarding Leave Request`
   - Body: include `{{ $json.output.start_time }}`
   - Connect **Booking Agent → Send a message1**

9. **Activate and test**
   - Turn workflow **ON**
   - Submit the form with:
     - To empty (single-day) and To filled (multi-day)
   - Verify:
     - AI outputs map correctly into `$json.output.Subject` and `$json.output.Body`
     - Approval step routes properly
     - Calendar tools return expected results and formatted `start_time`

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Leave Request Approval Automation with AI & Calendar Scheduling” + detailed description and setup checklist | Sticky note: overall workflow intent and setup guidance |
| “Step 1: Capture, summarize, and request approval” | Sticky note: first half of flow |
| “Step 2: Notify or schedule discussion” | Sticky note: second half of flow |
| Replace `user@example.com` with the real manager/approver calendar ID | Google Calendar Tool nodes configuration |
| Consider sending the approval email to a manager/HR approver, not the employee requestor | Current workflow sends “send-and-wait” to the employee email |

