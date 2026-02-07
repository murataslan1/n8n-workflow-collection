Auto-send DMs to LinkedIn keyword commenters with ConnectSafely.AI

https://n8nworkflows.xyz/workflows/auto-send-dms-to-linkedin-keyword-commenters-with-connectsafely-ai-11531


# Auto-send DMs to LinkedIn keyword commenters with ConnectSafely.AI

## 1. Workflow Overview

**Purpose:**  
This workflow automates LinkedIn direct messages (DMs) to people who comment on a specific LinkedIn post **with a trigger keyword**. It pulls all post comments, checks each comment for the keyword, verifies the commenter is a **1st-degree connection**, then sends a personalized DM containing a user-provided link. To reduce risk to the LinkedIn account, it **waits 15–30 minutes** between messages.

**Typical use cases:**
- Delivering a lead magnet/resource link to commenters who type a keyword (e.g., “code”, “template”).
- Semi-automated community engagement with rate limiting and safety checks.

### Logical blocks
**1.1 Input Reception (Form submission)**  
Collects the post URL, keyword, content link, and signature name.

**1.2 Comment Retrieval & Itemization**  
Fetches all comments for the post and converts the comments array into one item per comment.

**1.3 Iteration / Loop Control**  
Processes comments one-by-one using batching, returning to the loop after each message/skip.

**1.4 Keyword Detection & Routing**  
Runs a code-based case-insensitive keyword search, then routes matches forward.

**1.5 Relationship Verification (Connection gate)**  
Checks whether the commenter is a 1st-degree connection; only then DM is allowed.

**1.6 Message Delivery + Rate Limiting**  
Sends a personalized DM, then waits a random 900–1800 seconds before continuing.

**1.7 Skip Path & Completion**  
Skips non-matching/non-connected comments and finishes when all comments are processed.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception (Form submission)
**Overview:** Captures user inputs needed for the run: LinkedIn post URL, trigger keyword, content link to send, and signature name. This is the primary entry point.

**Nodes involved:**
- 📋 Workflow Overview (Sticky Note)
- 📥 Input (Sticky Note)
- 1️⃣ Form: Enter Post Details (Form Trigger)

#### Node: 📋 Workflow Overview
- **Type / role:** Sticky Note (documentation)
- **Configuration:** Contains high-level description + setup requirements + YouTube embed reference.
- **Connections:** None (non-executable).
- **Edge cases:** None.

#### Node: 📥 Input
- **Type / role:** Sticky Note (documentation)
- **Configuration:** Explains that the form captures post URL, keyword, and content link.
- **Connections:** None.
- **Edge cases:** None.

#### Node: 1️⃣ Form: Enter Post Details
- **Type / role:** `formTrigger` (manual start + data capture UI)
- **Key configuration choices:**
  - **Webhook/Form ID:** `linkedin-keyword-responder-v2`
  - **Form title/description:** Explains usage and tips.
  - **Fields (all required):**
    - `LinkedIn Post URL`
    - `Trigger Keyword`
    - `Content Link to Send`
    - `Your Name (for signature)`
- **Key variables produced (output JSON):**
  - `$json['LinkedIn Post URL']`
  - `$json['Trigger Keyword']`
  - `$json['Content Link to Send']`
  - `$json['Your Name (for signature)']`
- **Outputs:** Connects to **2️⃣ Fetch All Comments**
- **Version notes:** typeVersion `2.3` (form trigger behavior depends on n8n version; ensure your instance supports Form Trigger nodes).
- **Potential failures / edge cases:**
  - User pastes an invalid/unsupported LinkedIn URL → downstream API may fail.
  - Empty keyword/link/name prevented by required fields, but whitespace-only values can still pass unless validated elsewhere.

---

### 2.2 Comment Retrieval & Itemization
**Overview:** Fetches all comments from the specified LinkedIn post through ConnectSafely.AI, then splits the returned comments array into individual items.

**Nodes involved:**
- 🔍 Fetch Comments (Sticky Note)
- 2️⃣ Fetch All Comments (ConnectSafely LinkedIn)
- 3️⃣ Split Comments Array (Split Out)

#### Node: 🔍 Fetch Comments
- **Type / role:** Sticky Note (documentation)
- **Configuration:** Notes fetch + split behavior.
- **Connections:** None.

#### Node: 2️⃣ Fetch All Comments
- **Type / role:** `n8n-nodes-connectsafely-ai.connectSafelyLinkedIn` (LinkedIn API via ConnectSafely.AI)
- **Operation:** `getPostComments`
- **Key configuration choices:**
  - **Account ID:** `68ecc8f6ae3fb53989597a55` (ConnectSafely-managed LinkedIn account reference)
  - **Post URL expression:** `={{ $json['LinkedIn Post URL'] }}`
- **Inputs:** From **1️⃣ Form: Enter Post Details**
- **Outputs:** To **3️⃣ Split Comments Array**
- **Credentials required:** ConnectSafely.AI API credentials configured in n8n for the community node.
- **Potential failures / edge cases:**
  - Authentication / invalid API key in ConnectSafely credentials.
  - Post URL not accessible (private post, permissions, removed post).
  - Rate limiting or temporary blocks from LinkedIn/ConnectSafely.
  - Unexpected response shape (e.g., missing `comments` array) causing the split node to fail.

#### Node: 3️⃣ Split Comments Array
- **Type / role:** `splitOut` (convert an array field into multiple items)
- **Key configuration choices:**
  - **Field to split out:** `comments`
- **Inputs:** Output of **2️⃣ Fetch All Comments** (expects a `comments` array).
- **Outputs:** To **4️⃣ Loop: Process Each Comment**
- **Potential failures / edge cases:**
  - If `comments` is missing/null/not an array → node errors or yields no items.
  - Very large comment sets can lead to long workflow runs; consider pagination or limits if supported upstream.

---

### 2.3 Iteration / Loop Control
**Overview:** Ensures comments are processed one-by-one and provides a loopback so the workflow continues until all comments have been handled.

**Nodes involved:**
- 🔄 Loop (Sticky Note)
- 4️⃣ Loop: Process Each Comment (Split In Batches)
- ✅ All Comments Processed (NoOp)

#### Node: 🔄 Loop
- **Type / role:** Sticky Note (documentation)
- **Configuration:** Explains returning after each cycle.
- **Connections:** None.

#### Node: 4️⃣ Loop: Process Each Comment
- **Type / role:** `splitInBatches` (batch/loop controller)
- **Key configuration choices:**
  - **Reset:** `false` (keeps state within execution; normal for a single-pass loop)
  - Batch size is not explicitly set in JSON; in n8n this typically defaults to **1** unless configured otherwise (verify in UI).
- **Inputs:** From **3️⃣ Split Comments Array** and loopbacks from **🔟 Wait** and **⏭️ Skip**
- **Outputs:**
  - **Output 0 (main index 0):** To **✅ All Comments Processed** (signals completion when no more items)
  - **Output 1 (main index 1):** To **5️⃣ Detect Keyword Match** (current batch item)
- **Potential failures / edge cases:**
  - Misunderstanding outputs: Split In Batches uses separate outputs for “done” vs “items”; incorrect wiring can break the loop.
  - If upstream provides zero items, it will go directly to the “done” output.

#### Node: ✅ All Comments Processed
- **Type / role:** `noOp` (terminator/marker)
- **Configuration:** No parameters; used to clearly mark completion.
- **Inputs:** From **4️⃣ Loop: Process Each Comment** (done path).
- **Outputs:** None.
- **Edge cases:** None.

---

### 2.4 Keyword Detection & Routing
**Overview:** Checks whether each comment contains the trigger keyword (case-insensitive). Routes matching comments to the connection check, otherwise to skip.

**Nodes involved:**
- 🎯 Keyword Check (Sticky Note)
- 5️⃣ Detect Keyword Match (Code)
- 6️⃣ If: Keyword Found? (IF)

#### Node: 🎯 Keyword Check
- **Type / role:** Sticky Note (documentation)
- **Configuration:** Describes keyword scanning and routing.
- **Connections:** None.

#### Node: 5️⃣ Detect Keyword Match
- **Type / role:** `code` (custom JS logic)
- **Key configuration choices (interpreted):**
  - Reads comment text from the **current item**:  
    `const commentText = $input.first().json.commentText || "";`
  - Reads the keyword from the **form trigger** node (not from current item):  
    `const keyword = $('1️⃣ Form: Enter Post Details').first().json['Trigger Keyword'] || "";`
  - Case-insensitive containment:  
    `commentText.toLowerCase().includes(keyword.toLowerCase())`
  - Outputs a new item containing:
    - `isKeywordMatch` (boolean)
    - `commentText`, `searchedKeyword`, `matchDetails`
- **Inputs:** From **4️⃣ Loop: Process Each Comment** (the current comment item).
- **Outputs:** To **6️⃣ If: Keyword Found?**
- **Important note:** The code contains multiple lines like `// YOUR_AWS_SECRET_KEY_HERE=============` which look like placeholders/comments. They do not affect execution but can confuse maintainers.
- **Potential failures / edge cases:**
  - If `commentText` field name differs from what ConnectSafely returns, matching will always be false (or empty).
  - If keyword is empty or whitespace, `.includes("")` returns `true` for all comments; required field reduces risk but does not prevent whitespace-only input.
  - Non-string comment values can cause `.toLowerCase()` issues (mitigated by defaulting to `""`).

#### Node: 6️⃣ If: Keyword Found?
- **Type / role:** `if` (branching)
- **Condition:** `={{ $json.isKeywordMatch }}` is `true`
- **Inputs:** From **5️⃣ Detect Keyword Match**
- **Outputs:**
  - **True path:** To **7️⃣ Check Connection Status**
  - **False path:** To **⏭️ Skip: No Match / Not Connected**
- **Potential failures / edge cases:**
  - If `isKeywordMatch` missing/not boolean, strict validation may fail or branch unexpectedly.

---

### 2.5 Relationship Verification (Connection gate)
**Overview:** Ensures the commenter is a 1st-degree connection before attempting to send a DM.

**Nodes involved:**
- 🔗 Connection Check (Sticky Note)
- 7️⃣ Check Connection Status (ConnectSafely LinkedIn)
- 8️⃣ If: Connected? (IF)

#### Node: 🔗 Connection Check
- **Type / role:** Sticky Note (documentation)
- **Configuration:** Notes only connected users can receive DMs.
- **Connections:** None.

#### Node: 7️⃣ Check Connection Status
- **Type / role:** `n8n-nodes-connectsafely-ai.connectSafelyLinkedIn`
- **Operation:** `checkRelationship`
- **Key configuration choices:**
  - **Account ID:** `68ecc8f6ae3fb53989597a55`
  - **Profile ID expression:**  
    `={{ $('4️⃣ Loop: Process Each Comment').item.json.publicIdentifier }}`
    - Uses the original comment item from the loop node (not the code node output).
- **Inputs:** From **6️⃣ If: Keyword Found?** (true branch)
- **Outputs:** To **8️⃣ If: Connected?**
- **Potential failures / edge cases:**
  - `publicIdentifier` missing for some commenters (e.g., deleted users, restricted profiles) → API call may fail.
  - Auth issues/rate limits.
  - Response shape changes (expects a boolean `connected` later).

#### Node: 8️⃣ If: Connected?
- **Type / role:** `if` (branching)
- **Condition:** `={{ $json.connected }}` is `true`
- **Inputs:** From **7️⃣ Check Connection Status**
- **Outputs:**
  - **True path:** To **9️⃣ Send DM with Link**
  - **False path:** To **⏭️ Skip: No Match / Not Connected**
- **Potential failures / edge cases:**
  - If `connected` is missing/not boolean, strict validation can misroute.

---

### 2.6 Message Delivery + Rate Limiting
**Overview:** Sends a personalized DM to the connected commenter and then waits a randomized delay (15–30 minutes) before processing the next comment.

**Nodes involved:**
- 📨 Send & Wait (Sticky Note)
- 9️⃣ Send DM with Link (ConnectSafely LinkedIn)
- 🔟 Wait: Rate Limiting (Wait)

#### Node: 📨 Send & Wait
- **Type / role:** Sticky Note (documentation)
- **Configuration:** Highlights DM + 15–30 minute waits.
- **Connections:** None.

#### Node: 9️⃣ Send DM with Link
- **Type / role:** `n8n-nodes-connectsafely-ai.connectSafelyLinkedIn`
- **Operation:** `sendMessage`
- **Key configuration choices:**
  - **Account ID:** `68ecc8f6ae3fb53989597a55`
  - **Recipient profile ID:**  
    `={{ $('4️⃣ Loop: Process Each Comment').item.json.publicIdentifier }}`
  - **Message template (expression-enabled):**
    - Greets: `authorName` from loop item  
      `{{ $('4️⃣ Loop: Process Each Comment').item.json.authorName }}`
    - Inserts content link + signature from form node:
      - `{{ $('1️⃣ Form: Enter Post Details').item.json['Content Link to Send'] }}`
      - `{{ $('1️⃣ Form: Enter Post Details').item.json['Your Name (for signature)'] }}`
- **Inputs:** From **8️⃣ If: Connected?** (true branch)
- **Outputs:** To **🔟 Wait: Rate Limiting**
- **Potential failures / edge cases:**
  - LinkedIn restrictions: message limits, suspected automation, account flags.
  - Missing `authorName` / `publicIdentifier` fields.
  - ConnectSafely API errors/timeouts.

#### Node: 🔟 Wait: Rate Limiting
- **Type / role:** `wait` (delay execution)
- **Key configuration choices:**
  - **Webhook ID:** `rate-limit-wait` (used if wait is resumable via webhook in some modes)
  - **Amount (seconds) randomized 900–1800:**  
    `={{ Math.floor(Math.random() * (1800 - 900 + 1)) + 900 }}`
- **Inputs:** From **9️⃣ Send DM with Link**
- **Outputs:** Loops back to **4️⃣ Loop: Process Each Comment**
- **Potential failures / edge cases:**
  - Long waits increase workflow execution time; ensure n8n instance allows long-running executions (or uses queue mode appropriately).
  - If n8n restarts during wait, behavior depends on execution persistence settings.

---

### 2.7 Skip Path & Completion
**Overview:** Handles any comment that doesn’t match the keyword or belongs to a non-connected user. It simply returns to the loop without waiting.

**Nodes involved:**
- ⏭️ Skip Path (Sticky Note)
- ⏭️ Skip: No Match / Not Connected (NoOp)

#### Node: ⏭️ Skip Path
- **Type / role:** Sticky Note (documentation)
- **Configuration:** Explains skip routing.
- **Connections:** None.

#### Node: ⏭️ Skip: No Match / Not Connected
- **Type / role:** `noOp` (pass-through marker)
- **Inputs:**
  - From **6️⃣ If: Keyword Found?** (false branch)
  - From **8️⃣ If: Connected?** (false branch)
- **Outputs:** Loops back to **4️⃣ Loop: Process Each Comment**
- **Potential failures / edge cases:** None (but note there is **no delay** on skip path; the workflow can iterate quickly through many non-matches).

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| 📋 Workflow Overview | Sticky Note | High-level documentation |  |  | ## LinkedIn Keyword Auto-DM Responder… Setup required + @[youtube](8Pe0DB_pItY) |
| 📥 Input | Sticky Note | Documents form inputs |  |  | ## 📥 Input Form captures post URL, trigger keyword, and your content link. |
| 🔍 Fetch Comments | Sticky Note | Documents comment retrieval/splitting |  |  | ## 🔍 Fetch & Split Retrieves all comments… splits them for individual processing. |
| 🔄 Loop | Sticky Note | Documents loop mechanics |  |  | ## 🔄 Process Loop Handles each comment one by one… |
| 🎯 Keyword Check | Sticky Note | Documents keyword detection |  |  | ## 🎯 Keyword Detection Scans comment for trigger keyword… |
| 🔗 Connection Check | Sticky Note | Documents relationship gating |  |  | ## 🔗 Connection Check Verifies if commenter is a 1st connection… |
| 📨 Send & Wait | Sticky Note | Documents DM + rate limiting |  |  | ## 📨 Send & Rate Limit Sends personalized DM… Waits 15-30 min… |
| ⏭️ Skip Path | Sticky Note | Documents skip behavior |  |  | ## ⏭️ Skip Handles non-matches and non-connections… |
| 1️⃣ Form: Enter Post Details | Form Trigger | Entry point; capture post URL/keyword/link/name |  | 2️⃣ Fetch All Comments | ## 📥 Input Form captures post URL, trigger keyword, and your content link. |
| 2️⃣ Fetch All Comments | ConnectSafely LinkedIn | Pull comments for a post | 1️⃣ Form: Enter Post Details | 3️⃣ Split Comments Array | ## 🔍 Fetch & Split Retrieves all comments… splits them for individual processing. |
| 3️⃣ Split Comments Array | Split Out | Turn `comments[]` into items | 2️⃣ Fetch All Comments | 4️⃣ Loop: Process Each Comment | ## 🔍 Fetch & Split Retrieves all comments… splits them for individual processing. |
| 4️⃣ Loop: Process Each Comment | Split In Batches | Iterate comments sequentially | 3️⃣ Split Comments Array; 🔟 Wait: Rate Limiting; ⏭️ Skip: No Match / Not Connected | ✅ All Comments Processed; 5️⃣ Detect Keyword Match | ## 🔄 Process Loop Handles each comment one by one… |
| 5️⃣ Detect Keyword Match | Code | Case-insensitive keyword check | 4️⃣ Loop: Process Each Comment | 6️⃣ If: Keyword Found? | ## 🎯 Keyword Detection Scans comment for trigger keyword… |
| 6️⃣ If: Keyword Found? | IF | Branch on keyword match | 5️⃣ Detect Keyword Match | 7️⃣ Check Connection Status; ⏭️ Skip: No Match / Not Connected | ## 🎯 Keyword Detection Scans comment for trigger keyword… |
| 7️⃣ Check Connection Status | ConnectSafely LinkedIn | Verify 1st-degree relationship | 6️⃣ If: Keyword Found? (true) | 8️⃣ If: Connected? | ## 🔗 Connection Check Verifies if commenter is a 1st connection… |
| 8️⃣ If: Connected? | IF | Branch on connection status | 7️⃣ Check Connection Status | 9️⃣ Send DM with Link; ⏭️ Skip: No Match / Not Connected | ## 🔗 Connection Check Verifies if commenter is a 1st connection… |
| 9️⃣ Send DM with Link | ConnectSafely LinkedIn | Send personalized DM | 8️⃣ If: Connected? (true) | 🔟 Wait: Rate Limiting | ## 📨 Send & Rate Limit Sends personalized DM… Waits 15-30 min… |
| 🔟 Wait: Rate Limiting | Wait | Random delay 15–30 min | 9️⃣ Send DM with Link | 4️⃣ Loop: Process Each Comment | ## 📨 Send & Rate Limit Sends personalized DM… Waits 15-30 min… |
| ⏭️ Skip: No Match / Not Connected | NoOp | Skip and return to loop | 6️⃣ If: Keyword Found? (false); 8️⃣ If: Connected? (false) | 4️⃣ Loop: Process Each Comment | ## ⏭️ Skip Handles non-matches and non-connections… |
| ✅ All Comments Processed | NoOp | End marker | 4️⃣ Loop: Process Each Comment (done) |  |  |

---

## 4. Reproducing the Workflow from Scratch

1) **Install prerequisite community node**
   - In n8n: *Settings → Community nodes*  
   - Install: `n8n-nodes-connectsafely-ai`
   - Restart n8n if required.

2) **Create credentials for ConnectSafely.AI**
   - Add new credentials for the ConnectSafely community node (exact credential name depends on node package).
   - Paste your ConnectSafely.AI API key/token.
   - Confirm the LinkedIn account is connected in ConnectSafely and note the **Account ID** (here it is `68ecc8f6ae3fb53989597a55`).

3) **Add node: Form Trigger**
   - Node type: **Form Trigger**
   - Name: `1️⃣ Form: Enter Post Details`
   - Form settings:
     - Title: `🤖 LinkedIn Keyword Auto-Responder`
     - Add required fields:
       1. `LinkedIn Post URL` (required)
       2. `Trigger Keyword` (required)
       3. `Content Link to Send` (required)
       4. `Your Name (for signature)` (required)
   - (Optional) Paste the form description text from the workflow for user guidance.

4) **Add node: ConnectSafely LinkedIn – Get Post Comments**
   - Node type: **ConnectSafely LinkedIn** (from the community package)
   - Name: `2️⃣ Fetch All Comments`
   - Operation: `getPostComments`
   - Account ID: `68ecc8f6ae3fb53989597a55`
   - Post URL: Expression → `{{ $json['LinkedIn Post URL'] }}`
   - Connect **Form Trigger → Fetch All Comments**

5) **Add node: Split Out**
   - Node type: **Split Out**
   - Name: `3️⃣ Split Comments Array`
   - Field to split out: `comments`
   - Connect **Fetch All Comments → Split Comments Array**

6) **Add node: Split In Batches**
   - Node type: **Split In Batches**
   - Name: `4️⃣ Loop: Process Each Comment`
   - Keep default batch size (commonly 1) and set **Reset = false**
   - Connect **Split Comments Array → Loop**
   - You will later wire:
     - Loop “done” output → completion node
     - Loop “items” output → keyword detection

7) **Add node: NoOp (completion)**
   - Node type: **No Operation**
   - Name: `✅ All Comments Processed`
   - Connect **Loop (done output) → All Comments Processed**

8) **Add node: Code (keyword detection)**
   - Node type: **Code**
   - Name: `5️⃣ Detect Keyword Match`
   - Paste logic (adapt as needed):
     - Read `commentText` from the current comment item.
     - Read keyword from the Form Trigger node.
     - Set `isKeywordMatch` boolean with case-insensitive `.includes()`.
     - Output `{ isKeywordMatch, commentText, searchedKeyword, matchDetails }`
   - Connect **Loop (items output) → Detect Keyword Match**

9) **Add node: IF (keyword found)**
   - Node type: **IF**
   - Name: `6️⃣ If: Keyword Found?`
   - Condition: Boolean true for `{{ $json.isKeywordMatch }}`
   - Connect **Detect Keyword Match → If: Keyword Found?**

10) **Add node: NoOp (skip path)**
   - Node type: **No Operation**
   - Name: `⏭️ Skip: No Match / Not Connected`
   - Connect **If: Keyword Found? (false) → Skip**

11) **Add node: ConnectSafely LinkedIn – Check Relationship**
   - Node type: **ConnectSafely LinkedIn**
   - Name: `7️⃣ Check Connection Status`
   - Operation: `checkRelationship`
   - Account ID: `68ecc8f6ae3fb53989597a55`
   - Profile ID expression:  
     `{{ $('4️⃣ Loop: Process Each Comment').item.json.publicIdentifier }}`
   - Connect **If: Keyword Found? (true) → Check Connection Status**

12) **Add node: IF (connected?)**
   - Node type: **IF**
   - Name: `8️⃣ If: Connected?`
   - Condition: Boolean true for `{{ $json.connected }}`
   - Connect **Check Connection Status → If: Connected?**
   - Connect **If: Connected? (false) → Skip**

13) **Add node: ConnectSafely LinkedIn – Send Message**
   - Node type: **ConnectSafely LinkedIn**
   - Name: `9️⃣ Send DM with Link`
   - Operation: `sendMessage`
   - Account ID: `68ecc8f6ae3fb53989597a55`
   - Recipient Profile ID:  
     `{{ $('4️⃣ Loop: Process Each Comment').item.json.publicIdentifier }}`
   - Message: use an expression template, e.g.
     - author name from loop item
     - content link + signature from form fields
   - Connect **If: Connected? (true) → Send DM with Link**

14) **Add node: Wait (rate limiting)**
   - Node type: **Wait**
   - Name: `🔟 Wait: Rate Limiting`
   - Time amount (seconds) expression:  
     `{{ Math.floor(Math.random() * (1800 - 900 + 1)) + 900 }}`
   - Connect **Send DM with Link → Wait**

15) **Close the loop**
   - Connect **Wait → 4️⃣ Loop: Process Each Comment** (to continue after delay)
   - Connect **Skip → 4️⃣ Loop: Process Each Comment** (to continue immediately)

16) **(Optional) Add Sticky Notes**
   - Add sticky notes mirroring the workflow’s documentation blocks (overview, input, fetch, loop, keyword check, connection check, send & wait, skip path).

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| LinkedIn Keyword Auto-DM Responder — overview, setup required, and customization note (“Customize DM template in node 9️⃣”). | Embedded reference: `@[youtube](8Pe0DB_pItY)` |
| Setup required: Install `n8n-nodes-connectsafely-ai` community node; add ConnectSafely.AI API credentials. | Applies before running the workflow |
| DM safety: waits 15–30 minutes between messages. | Implemented by `🔟 Wait: Rate Limiting` |

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.