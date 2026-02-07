 Smart human takeover & auto pause AI-powered Facebook Messenger chatbot

https://n8nworkflows.xyz/workflows/-smart-human-takeover---auto-pause-ai-powered-facebook-messenger-chatbot-11920


#  Smart human takeover & auto pause AI-powered Facebook Messenger chatbot

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:**  
This workflow implements a **smart human takeover** mechanism for a Facebook Messenger chatbot. When a human (page admin/rep) replies in the conversation, the workflow **pauses AI replies** for that user for a period of time (or until conditions are met). When the pause expires, the workflow resumes AI automation, processes pending messages, and replies via an AI agent (Google Gemini through LangChain), while also maintaining conversation history and message-processing state in n8n Data Tables.

**Target use cases**
- Prevent AI from talking over a human agent during manual support.
- Ensure user messages received during human takeover are stored and processed later.
- Maintain a short conversation window (e.g., last 15 messages) for AI context.

**Logical blocks**
1.1 **Webhook reception & early acknowledgement**  
1.2 **Message qualification & basic context normalization**  
1.3 **Sender/page detection & human takeover detection**  
1.4 **Paused-list lookup + pause expiry decision**  
1.5 **State persistence (processed/unprocessed) + conversation history retrieval**  
1.6 **AI generation (Gemini via LangChain Agent)**  
1.7 **Facebook response formatting + sequential sending (loop + delay)**  
1.8 **Post-send bookkeeping / history cleanup**

---

## 2. Block-by-Block Analysis

### 2.1 Webhook reception & early acknowledgement

**Overview:** Receives Facebook webhook events and responds quickly to confirm receipt, while routing message events for processing.

**Nodes involved**
- **Facebook Webhook**
- **Confirm Webhook**
- **Is message**

**Node details**

#### Facebook Webhook
- **Type / role:** `Webhook` trigger; entry point for Facebook Messenger events.
- **Config (interpreted):** Uses n8n webhook endpoint; expects Facebook to POST events.
- **Connections:**  
  - Output 1 → **Confirm Webhook** (immediate ack path)  
  - Output 2 → **Confirm Webhook** and **Is message** (processing path)
- **Edge cases / failures:**
  - Facebook webhook verification/validation issues (token mismatch, wrong method).
  - High-volume bursts: webhook must respond fast to avoid Facebook retries.

#### Confirm Webhook
- **Type / role:** `Respond to Webhook`; returns an HTTP response to Facebook quickly.
- **Config:** Not shown in JSON; typically returns `200 OK` with minimal body.
- **Input:** Facebook Webhook
- **Output:** None (terminal response node)
- **Edge cases:** If response is delayed (because of long processing before it), Facebook may retry.

#### Is message
- **Type / role:** `IF`; filters only message events (vs delivery receipts, read events, etc.).
- **Config:** Not visible; typically checks if payload contains a `message.text` or message object.
- **Output:** True branch → **Set Context**
- **Edge cases:** Attachments-only messages; if condition checks only `text`, it may drop images/files.

---

### 2.2 Message qualification & basic context normalization

**Overview:** Normalizes inbound payload into a consistent internal structure used across the workflow.

**Nodes involved**
- **Set Context**
- **Is from page?**
- **User is Reciepient**
- **User is Sender**

**Node details**

#### Set Context
- **Type / role:** `Set`; prepares fields used downstream (senderId, recipientId, message text, timestamps, etc.).
- **Config:** Not provided; but must create variables referenced later by Data Table and HTTP nodes.
- **Input:** Is message
- **Output:** → **Is from page?**
- **Failure modes:** Expression errors if the webhook payload shape differs from expected (Facebook can vary event schema).

#### Is from page?
- **Type / role:** `IF`; decides whether the message originated from the page (human/page) or from the user.
- **Outputs:**
  - Branch 1 → **User is Reciepient**
  - Branch 2 → **User is Sender**
- **Edge cases:** Page-sent echoes and messaging types (e.g., `is_echo`) can confuse direction detection if not considered.

#### User is Reciepient
- **Type / role:** `Set`; maps IDs when the page is sender (so the “user” becomes the recipient).
- **Output:** → **Is from AI?**
- **Likely fields:** conversation user id, page id, direction flag.
- **Edge cases:** If IDs are swapped incorrectly, pause logic will apply to the wrong user.

#### User is Sender
- **Type / role:** `Set`; maps IDs when the user is sender (normal inbound user message).
- **Output:** → **Check Paused List**
- **Edge cases:** Same as above—ID normalization must be consistent.

---

### 2.3 Human takeover detection (page message not from AI)

**Overview:** If the page sends a message that is **not** produced by the AI, the workflow treats it as a **human rep takeover** and adds the user to a paused list.

**Nodes involved**
- **Is from AI?**
- **Insert to Paused List**
- **Insert human rep**

**Node details**

#### Is from AI?
- **Type / role:** `IF`; detects whether a page-sent message is AI-generated or human-generated.
- **Connections:**  
  - False/second output (based on wiring) → **Insert to Paused List**
- **Edge cases:**  
  - If AI messages are not tagged (metadata/marker), human takeover may be triggered incorrectly.
  - If the condition relies on specific text markers, those must be stable.

#### Insert to Paused List
- **Type / role:** `Data Table`; inserts/updates an entry indicating automation is paused for this user.
- **Input:** Is from AI? (human message path)
- **Output:** → **Insert human rep**
- **Potential config:** table name like `PausedList` with fields such as `userId`, `pausedAt`, `expiresAt`, `pageId`.
- **Failure modes:** Missing Data Table, schema mismatch, uniqueness constraints not handled.

#### Insert human rep
- **Type / role:** `Data Table`; stores which human rep/page identity took over (audit trail).
- **Input:** Insert to Paused List
- **Output:** none further shown (end of that branch)
- **Edge cases:** Multiple reps; race conditions if two human messages arrive close together.

---

### 2.4 Paused-list lookup + pause expiry decision

**Overview:** For inbound user messages, checks whether the user is currently paused; if paused, decides whether the pause is still active or expired.

**Nodes involved**
- **Check Paused List**
- **In Paused List?**
- **Comparison time**
- **Is still Pause?**
- **Remove from Paused List**
- **Insert To Processed**

**Node details**

#### Check Paused List
- **Type / role:** `Data Table`; looks up whether sender userId exists in paused list.
- **Output:** → **In Paused List?**
- **alwaysOutputData=true:** downstream nodes still run even if no rows are found (important for IF checks).
- **Failure modes:** Lookup returns empty and IF expressions must handle `undefined`.

#### In Paused List?
- **Type / role:** `IF`; branches based on lookup result.
- **Outputs (per connections):**
  - Output 1 → **Comparison time** (user *is paused*)
  - Output 2 → **Insert To Unprocessed** and **Seen** (user *not paused*, proceed to AI processing pipeline)
- **Edge cases:** If lookup returns multiple rows, IF condition should be explicit (e.g., `items.length > 0`).

#### Comparison time
- **Type / role:** `Set`; computes whether pause has expired (e.g., `now - pausedAt`).
- **Output:** → **Is still Pause?**
- **Edge cases:** Timezone/epoch format differences; string vs number comparisons.

#### Is still Pause?
- **Type / role:** `IF`; decides whether to keep pausing or to resume automation.
- **Outputs:**
  - Output 1 → **Insert To Processed** (still paused: mark as processed/ignored for AI)
  - Output 2 → **Remove from Paused List** (pause expired: remove and continue normal processing)
- **Edge cases:** Off-by-one expiry, missing `pausedAt/expiresAt` fields.

#### Insert To Processed
- **Type / role:** `Data Table`; records inbound messages that arrived while paused as “processed” (meaning: do not send AI response now).
- **Input:** Is still Pause? true
- **Output:** none shown
- **Integration note:** This is critical to avoid backlog replies while human is active.

#### Remove from Paused List
- **Type / role:** `Data Table`; removes/unpauses user when pause expires.
- **Output:** → **Insert To Unprocessed** and **Seen**
- **Edge cases:** Deleting non-existent row; ensuring idempotency.

---

### 2.5 State persistence + conversation history retrieval

**Overview:** Stores inbound user message as “unprocessed” (eligible for AI reply), marks it as seen, then fetches conversation history and merges it to create a single prompt/context for the AI agent.

**Nodes involved**
- **Seen**
- **Insert To Unprocessed**
- **Get MaxID and Merged Mess**
- **Get history message**
- **Get 15 newest rows**
- **Merge History and Find Min_ID**

**Node details**

#### Seen
- **Type / role:** `HTTP Request`; calls Facebook Graph API to mark conversation as seen.
- **onError=continueRegularOutput:** workflow continues even if Facebook call fails.
- **Input:** from In Paused List? (not paused) OR Remove from Paused List
- **Edge cases:** Token expiry, permissions missing (`pages_messaging`), rate limiting.

#### Insert To Unprocessed
- **Type / role:** `Data Table`; records the new inbound user message as pending AI processing.
- **Output:** → **Get MaxID and Merged Mess**
- **Edge cases:** Duplicate message IDs; ordering issues if Facebook re-sends events.

#### Get MaxID and Merged Mess
- **Type / role:** `Code`; likely:
  - finds the newest unprocessed message id (`MaxID`)
  - prepares an initial merged message payload for history fetch
- **Input:** Insert To Unprocessed
- **Output:** → **Get history message**
- **Failure modes:** Assumptions about Data Table row structure; missing fields.

#### Get history message
- **Type / role:** `Data Table`; fetches message history rows for that conversation/user.
- **alwaysOutputData=true:** downstream runs even if history empty.
- **Output:** → **Get 15 newest rows**
- **Edge cases:** Large history; performance; missing index.

#### Get 15 newest rows
- **Type / role:** `Code`; selects last 15 messages (rolling context window).
- **alwaysOutputData=true**
- **Output:** → **Merge History and Find Min_ID**
- **Edge cases:** Less than 15 rows; sorting by timestamp vs row id.

#### Merge History and Find Min_ID
- **Type / role:** `Code`; merges selected history into a format suitable for the AI agent, and finds the minimum ID used for cleanup later.
- **alwaysOutputData=true**
- **Outputs:** → **Send Typing** and **Process Merged Message**
- **Edge cases:** Incorrect merge order leads to incoherent context; non-text messages.

---

### 2.6 AI generation (Gemini via LangChain Agent)

**Overview:** Sends typing indicator, then runs a LangChain Agent using Google Gemini as the chat model to generate one or multiple reply messages.

**Nodes involved**
- **Send Typing**
- **Process Merged Message**
- **Google Gemini Chat Model**

**Node details**

#### Send Typing
- **Type / role:** `HTTP Request`; calls Facebook API to send “typing_on”.
- **onError=continueRegularOutput:** AI can still proceed if typing call fails.
- **Input:** Merge History and Find Min_ID
- **Edge cases:** Same auth/rate limiting issues as Seen.

#### Process Merged Message
- **Type / role:** `LangChain Agent` (`@n8n/...agent`); core reasoning/generation node.
- **Config:** Not visible; but it is wired to use the Gemini model via AI connection.
- **retryOnFail=true / waitBetweenTries=100:** retries transient failures quickly.
- **Input:** merged conversation/history
- **Output:** → **Format for Facebook Output**
- **Edge cases:** Model safety refusals, token limits, unexpected tool calls (if enabled), long context.

#### Google Gemini Chat Model
- **Type / role:** `lmChatGoogleGemini`; provides the LLM backend for the agent.
- **Connection:** AI language model output → Process Merged Message (as its model)
- **Requirements:** Google AI/Gemini credentials configured in n8n.
- **Edge cases:** API key restrictions, quota exceeded, region availability.

---

### 2.7 Facebook response formatting + sequential sending

**Overview:** Converts the agent output into Facebook Send API payload(s), then sends messages sequentially with a small delay to preserve order.

**Nodes involved**
- **Format for Facebook Output**
- **Loop Over Items**
- **Delay Between Messages**
- **Send Text**

**Node details**

#### Format for Facebook Output
- **Type / role:** `Code`; transforms AI output into one item per outbound message (text chunks, multi-message response).
- **Output:** → **Loop Over Items**
- **Edge cases:** If AI output is not in expected structure, formatting code may throw or produce empty array.

#### Loop Over Items
- **Type / role:** `Split in Batches`; enforces sequential processing of outbound messages.
- **Notes (sticky content):** “Loop tuần tự qua từng tin nhắn” (Loop sequentially through each message)
- **Outputs:**  
  - Main → **Update FALSE to TRUE** (bookkeeping) and **Delay Between Messages** (send path)
- **Edge cases:** If batch size not set properly, may send all at once; if empty items, loop ends immediately.

#### Delay Between Messages
- **Type / role:** `Wait`; delays between sends.
- **Notes:** “Delay 100ms giữa các tin nhắn để đảm bảo thứ tự” (Delay 100ms between messages to ensure order)
- **Output:** → **Send Text**
- **Edge cases:** Very short delay may still reorder under network jitter; very long delay slows UX.

#### Send Text
- **Type / role:** `HTTP Request`; calls Facebook Send API to send each message.
- **Output:** loops back to **Loop Over Items** (continue next message)
- **Edge cases:** Send API errors (recipient blocked, policy, invalid token), rate limiting, message length constraints.

---

### 2.8 Post-send bookkeeping / history cleanup

**Overview:** After sending begins (per item), updates Data Tables to mark pending messages as processed and cleans up old history.

**Nodes involved**
- **Update FALSE to TRUE**
- **Update Page Rep**
- **Clean History**

**Node details**

#### Update FALSE to TRUE
- **Type / role:** `Data Table`; likely flips a boolean flag on rows (e.g., `processed=false` → `true`) for messages up to MaxID.
- **alwaysOutputData=true**
- **Input:** Loop Over Items
- **Output:** → **Update Page Rep**
- **Edge cases:** Updating too broadly can skip messages; updating too narrowly can reprocess duplicates.

#### Update Page Rep
- **Type / role:** `Data Table`; likely records that the page/AI responded, or updates rep assignment/status.
- **alwaysOutputData=true**
- **Output:** → **Clean History**
- **Edge cases:** Concurrent conversations; ensuring correct conversation key.

#### Clean History
- **Type / role:** `Data Table`; deletes/archives older history rows (possibly using `Min_ID` found earlier).
- **alwaysOutputData=true**
- **Edge cases:** Over-cleaning removes context; under-cleaning grows table indefinitely.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Facebook Webhook | Webhook Trigger | Receives Facebook events | — | Confirm Webhook, Is message |  |
| Confirm Webhook | Respond to Webhook | Immediate HTTP 200 acknowledgement | Facebook Webhook | — |  |
| Is message | IF | Filters message events | Facebook Webhook | Set Context |  |
| Set Context | Set | Normalizes payload into internal fields | Is message | Is from page? |  |
| Is from page? | IF | Determines direction (page vs user) | Set Context | User is Reciepient, User is Sender |  |
| User is Reciepient | Set | ID mapping when page is sender | Is from page? | Is from AI? |  |
| Is from AI? | IF | Detects if page message was AI-generated | User is Reciepient | Insert to Paused List |  |
| Insert to Paused List | Data Table | Adds user to pause list (human takeover) | Is from AI? | Insert human rep |  |
| Insert human rep | Data Table | Stores human rep/takeover info | Insert to Paused List | — |  |
| User is Sender | Set | ID mapping when user is sender | Is from page? | Check Paused List |  |
| Check Paused List | Data Table | Lookup user pause status | User is Sender | In Paused List? |  |
| In Paused List? | IF | Branch paused vs not paused | Check Paused List | Comparison time; Insert To Unprocessed, Seen |  |
| Comparison time | Set | Computes pause expiry | In Paused List? | Is still Pause? |  |
| Is still Pause? | IF | Still paused vs unpause | Comparison time | Insert To Processed; Remove from Paused List |  |
| Insert To Processed | Data Table | Records messages received during pause | Is still Pause? | — |  |
| Remove from Paused List | Data Table | Unpauses user | Is still Pause? | Insert To Unprocessed, Seen |  |
| Seen | HTTP Request | Mark conversation as seen | In Paused List? / Remove from Paused List | — |  |
| Insert To Unprocessed | Data Table | Stores message for AI processing | In Paused List? / Remove from Paused List | Get MaxID and Merged Mess |  |
| Get MaxID and Merged Mess | Code | Derives MaxID + builds merged payload seed | Insert To Unprocessed | Get history message |  |
| Get history message | Data Table | Fetch conversation history | Get MaxID and Merged Mess | Get 15 newest rows |  |
| Get 15 newest rows | Code | Keeps last 15 messages | Get history message | Merge History and Find Min_ID |  |
| Merge History and Find Min_ID | Code | Merges history + finds min id for cleanup | Get 15 newest rows | Send Typing, Process Merged Message |  |
| Send Typing | HTTP Request | Send typing indicator | Merge History and Find Min_ID | — |  |
| Process Merged Message | LangChain Agent | Generates response using LLM | Merge History and Find Min_ID (+ Gemini model) | Format for Facebook Output |  |
| Google Gemini Chat Model | Gemini Chat Model | LLM backend for agent | — | Process Merged Message (AI connection) |  |
| Format for Facebook Output | Code | Converts AI output to FB Send API items | Process Merged Message | Loop Over Items |  |
| Loop Over Items | Split in Batches | Sequentially iterates outbound messages | Format for Facebook Output / Send Text | Update FALSE to TRUE, Delay Between Messages | Loop tuần tự qua từng tin nhắn |
| Delay Between Messages | Wait | Adds per-message delay | Loop Over Items | Send Text | Delay 100ms giữa các tin nhắn để đảm bảo thứ tự |
| Send Text | HTTP Request | Sends each text message to FB | Delay Between Messages | Loop Over Items |  |
| Update FALSE to TRUE | Data Table | Marks pending rows processed | Loop Over Items | Update Page Rep |  |
| Update Page Rep | Data Table | Updates page/rep state after replying | Update FALSE to TRUE | Clean History |  |
| Clean History | Data Table | Deletes/archives old history rows | Update Page Rep | — |  |
| Sticky Note | Sticky Note | Comment container (empty) | — | — |  |
| Sticky Note1 | Sticky Note | Comment container (empty) | — | — |  |
| Sticky Note2 | Sticky Note | Comment container (empty) | — | — |  |
| Sticky Note3 | Sticky Note | Comment container (empty) | — | — |  |
| Sticky Note4 | Sticky Note | Comment container (empty) | — | — |  |
| Sticky Note5 | Sticky Note | Comment container (empty) | — | — |  |
| Sticky Note6 | Sticky Note | Comment container (empty) | — | — |  |
| Sticky Note7 | Sticky Note | Comment container (empty) | — | — |  |

> Note: All sticky notes in this JSON have empty content, except the notes embedded directly on **Loop Over Items** and **Delay Between Messages**.

---

## 4. Reproducing the Workflow from Scratch

1. **Create a Webhook trigger**
   - Add node: **Webhook** → name it **Facebook Webhook**
   - Set HTTP method to **POST**
   - Set response mode to “Using Respond to Webhook node” (so you can ack quickly)

2. **Add immediate acknowledgement**
   - Add node: **Respond to Webhook** → **Confirm Webhook**
   - Configure it to return **200** quickly (simple JSON body is fine)
   - Connect **Facebook Webhook → Confirm Webhook**

3. **Filter only message events**
   - Add node: **IF** → **Is message**
   - Condition: check the incoming body contains a message object (e.g., `message` exists; include attachments if needed)
   - Connect **Facebook Webhook → Is message** (in parallel with Confirm Webhook)

4. **Normalize payload**
   - Add node: **Set** → **Set Context**
   - Map fields you’ll need downstream, typically:
     - `pageId`, `senderId`, `recipientId`
     - `messageText`, `messageId`
     - `timestamp`
     - optional flags: `isEcho`, `fromPage`
   - Connect **Is message → Set Context**

5. **Detect message direction**
   - Add node: **IF** → **Is from page?**
   - Condition: determine if the sender is the page (often via `is_echo` or by comparing senderId to pageId)
   - Connect **Set Context → Is from page?**

6. **Branch: page-sent vs user-sent**
   - Add node: **Set** → **User is Reciepient**
     - Set normalized `userId` to the *recipient* when the page is sender
   - Add node: **Set** → **User is Sender**
     - Set normalized `userId` to the *sender* when the user is sender
   - Connect **Is from page? → User is Reciepient** (true)  
   - Connect **Is from page? → User is Sender** (false)

7. **Human takeover detection (page messages)**
   - Add node: **IF** → **Is from AI?**
   - Implement a robust marker strategy, e.g.:
     - store AI-sent message IDs in a table and check membership; or
     - include a hidden metadata tag (preferred where possible)
   - Connect **User is Reciepient → Is from AI?**
   - Add node: **Data Table** → **Insert to Paused List**
     - Table (example): `paused_list` with `userId`, `pausedAt`, `expiresAt`, `pageId`
     - Upsert by `userId` recommended
   - Connect **Is from AI? (human branch) → Insert to Paused List**
   - Add node: **Data Table** → **Insert human rep**
     - Table (example): `human_takeovers` with `userId`, `repId/pageId`, `timestamp`
   - Connect **Insert to Paused List → Insert human rep**

8. **Paused list lookup (user messages)**
   - Add node: **Data Table** → **Check Paused List**
     - Lookup by `userId`
     - Ensure it outputs empty results safely (equivalent to `alwaysOutputData`)
   - Connect **User is Sender → Check Paused List**
   - Add node: **IF** → **In Paused List?**
     - True if a row exists for this `userId`
   - Connect **Check Paused List → In Paused List?**

9. **If paused: compute expiry and decide**
   - Add node: **Set** → **Comparison time**
     - Create `isStillPaused` based on `expiresAt > now` (or `now - pausedAt < pauseWindow`)
   - Connect **In Paused List? (paused) → Comparison time**
   - Add node: **IF** → **Is still Pause?**
     - Condition on `isStillPaused`
   - Connect **Comparison time → Is still Pause?**
   - Add node: **Data Table** → **Insert To Processed**
     - Store message with status processed/ignored due to pause
   - Connect **Is still Pause? (still paused) → Insert To Processed**
   - Add node: **Data Table** → **Remove from Paused List**
     - Delete row by `userId` (or set active=false)
   - Connect **Is still Pause? (expired) → Remove from Paused List**

10. **If not paused (or pause expired): persist message + mark seen**
   - Add node: **Data Table** → **Insert To Unprocessed**
     - Store inbound message with `processed=false`
   - Add node: **HTTP Request** → **Seen**
     - Call Facebook Send API with `sender_action=mark_seen` (or Graph endpoint used for Messenger)
     - Set **Continue On Fail** (matches `onError: continueRegularOutput`)
   - Connect **In Paused List? (not paused) → Insert To Unprocessed** and **Seen**
   - Connect **Remove from Paused List → Insert To Unprocessed** and **Seen**

11. **Prepare history + merged prompt**
   - Add node: **Code** → **Get MaxID and Merged Mess**
     - Determine newest pending message ID (`maxId`)
     - Prepare conversation key and any metadata needed
   - Connect **Insert To Unprocessed → Get MaxID and Merged Mess**
   - Add node: **Data Table** → **Get history message**
     - Fetch conversation rows by `userId`/conversationId
   - Connect **Get MaxID and Merged Mess → Get history message**
   - Add node: **Code** → **Get 15 newest rows**
     - Sort and slice last 15 messages
   - Connect **Get history message → Get 15 newest rows**
   - Add node: **Code** → **Merge History and Find Min_ID**
     - Merge into chat format (role/user/assistant)
     - Compute `minIdToKeep` for cleanup
   - Connect **Get 15 newest rows → Merge History and Find Min_ID**

12. **Typing indicator + AI agent**
   - Add node: **HTTP Request** → **Send Typing**
     - Facebook API `sender_action=typing_on`
     - Continue on fail enabled
   - Connect **Merge History and Find Min_ID → Send Typing**
   - Add node: **Google Gemini Chat Model** → **Google Gemini Chat Model**
     - Configure credentials (Gemini API key / Google AI credentials)
     - Choose model (e.g., Gemini 1.5/2.0 depending on availability)
   - Add node: **LangChain Agent** → **Process Merged Message**
     - Set prompt/instructions to produce Messenger-ready outputs (optionally multi-part)
     - Connect **Google Gemini Chat Model** to the agent via the AI model connection
   - Connect **Merge History and Find Min_ID → Process Merged Message**

13. **Format AI output for Messenger**
   - Add node: **Code** → **Format for Facebook Output**
     - Convert agent result into an array of items, each with `recipient` + `message.text`
   - Connect **Process Merged Message → Format for Facebook Output**

14. **Send sequentially with delay**
   - Add node: **Split in Batches** → **Loop Over Items**
     - Batch size: 1 (to ensure strict ordering)
   - Connect **Format for Facebook Output → Loop Over Items**
   - Add node: **Wait** → **Delay Between Messages**
     - 100 ms
   - Connect **Loop Over Items → Delay Between Messages**
   - Add node: **HTTP Request** → **Send Text**
     - Call Facebook Send API to send message for current item
   - Connect **Delay Between Messages → Send Text**
   - Connect **Send Text → Loop Over Items** (to continue loop)

15. **Bookkeeping after sending starts**
   - Add node: **Data Table** → **Update FALSE to TRUE**
     - Mark relevant unprocessed rows as processed (use `maxId` or message ids)
   - Connect **Loop Over Items → Update FALSE to TRUE**
   - Add node: **Data Table** → **Update Page Rep**
     - Update rep/page response state if required
   - Connect **Update FALSE to TRUE → Update Page Rep**
   - Add node: **Data Table** → **Clean History**
     - Delete/archive rows older than `minIdToKeep`
   - Connect **Update Page Rep → Clean History**

**Credentials you must configure**
- **Facebook Graph / Messenger Send API**: Page access token (and correct permissions).
- **Google Gemini**: Gemini API key / Google AI credentials in n8n.
- **n8n Data Tables**: ensure tables exist with consistent schema (paused list, history, unprocessed, processed, human reps, etc.).

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Loop tuần tự qua từng tin nhắn” | Comment on **Loop Over Items** node: sequential sending to preserve order |
| “Delay 100ms giữa các tin nhắn để đảm bảo thứ tự” | Comment on **Delay Between Messages** node: spacing between sends to keep ordering |

If you want, paste the **parameters** for the Data Table and HTTP Request nodes (they’re empty in the JSON you provided). With that, I can document the exact table names/fields and the exact Facebook API endpoints/payloads used.