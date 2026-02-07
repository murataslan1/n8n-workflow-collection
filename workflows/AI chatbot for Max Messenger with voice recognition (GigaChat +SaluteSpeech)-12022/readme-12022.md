AI chatbot for Max Messenger with voice recognition (GigaChat +SaluteSpeech)

https://n8nworkflows.xyz/workflows/ai-chatbot-for-max-messenger-with-voice-recognition--gigachat--salutespeech--12022


# AI chatbot for Max Messenger with voice recognition (GigaChat +SaluteSpeech)

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:**  
A Max Messenger chatbot that can respond to **text** and **voice messages**. Voice messages are transcribed via **Sber SmartSpeech (SaluteSpeech)**, then the resulting text (or the original text message) is sent to a **GigaChat-powered AI Agent** with **conversation memory (last 10 messages)**. The reply is sent back to the user in Max.

**Target use cases:**
- Personal assistant bot inside Max messenger
- Russian-language AI assistant using GigaChat
- Voice-enabled chat: audio → transcription → AI response

### Logical Blocks
1. **1.1 Entry & Access Control**
   - Receives Max messages and allows only a specific user_id; others get blocked.
2. **1.2 Message Type Routing (Text vs Attachment)**
   - Detects whether the incoming message contains attachments.
3. **1.3 Voice Processing (Attachment download → token → transcription)**
   - Downloads audio, obtains Sber OAuth token, sends audio to SmartSpeech recognition, extracts recognized text as `prompt`.
4. **1.4 Text Processing (Text → prompt)**
   - Extracts message body text as `prompt`.
5. **1.5 AI Response Generation with Memory**
   - Merges prompts into a single stream, calls AI Agent with GigaChat model and buffer memory.
6. **1.6 Reply Delivery**
   - Sends AI output back to Max user.

---

## 2. Block-by-Block Analysis

### 2.1 Entry & Access Control

**Overview:**  
Triggers on incoming Max messages, then checks if the sender is authorized (hardcoded user_id). Unauthorized users receive an “Access Denied” message.

**Nodes involved:**  
- Max Trigger1  
- Check User  
- Access Denied

#### Node: Max Trigger1
- **Type / Role:** `n8n-nodes-max.maxTrigger` — webhook-like trigger for Max bot events.
- **Key configuration:**
  - Uses Max API credentials.
  - Receives message metadata (including `metadata.user_context.user_id`, `display_name`, message body, attachments).
- **Outputs / Connections:**  
  - Main output → **Check User**
- **Edge cases / failures:**
  - Invalid/expired Max credentials or webhook registration issues.
  - Payload shape differences depending on Max event type (this workflow assumes `message_created` format).

#### Node: Check User
- **Type / Role:** `n8n-nodes-base.if` — authorization gate.
- **Configuration choices:**
  - Condition: `{{$json.metadata.user_context.user_id}} == 50488534` (numeric equals)
- **Outputs / Connections:**
  - **True** → **Text/Attachment**
  - **False** → **Access Denied**
- **Edge cases / failures:**
  - If `metadata.user_context.user_id` is missing/non-numeric, condition may evaluate unexpectedly (loose validation enabled).
  - Hardcoded ID must be replaced for real deployment.

#### Node: Access Denied
- **Type / Role:** `n8n-nodes-max.max` — sends a Max message.
- **Configuration choices:**
  - `text`: static denial message with link: `https://www.youtube.com/@Aimaginelife`
  - `userId`: `{{ $('Max Trigger1').item.json.metadata.user_context.user_id }}`
- **Outputs / Connections:** none (terminal branch)
- **Edge cases / failures:**
  - If `Max Trigger1` item is not available (node renamed/changed execution context), expression will fail.
  - Max API auth errors.

---

### 2.2 Message Type Routing (Text vs Attachment)

**Overview:**  
Determines whether the incoming message includes an attachment. If yes, downloads it; otherwise routes to text prompt creation.

**Nodes involved:**  
- Text/Attachment  
- Download Attachment  
- Attachment Router

#### Node: Text/Attachment
- **Type / Role:** `n8n-nodes-base.switch` — routes based on whether an attachment URL exists.
- **Configuration choices:**
  - Rule output key **Attachment** when:
    - `{{ $json.message.body.attachments[0].payload.url }}` **exists**
  - Fallback output renamed to **Other** (used for text-only messages)
- **Outputs / Connections:**
  - **Attachment** → **Download Attachment**
  - **Other** → **Text to Prompt**
- **Edge cases / failures:**
  - If `attachments` is an empty array or missing, accessing `[0]` can evaluate to undefined; the “exists” operator generally handles this, but payload variations can break assumptions.
  - If attachments exist but structure differs (no `payload.url`), routing may go to fallback incorrectly.

#### Node: Download Attachment
- **Type / Role:** `n8n-nodes-base.httpRequest` — downloads attached file from provided URL.
- **Configuration choices:**
  - URL: `{{ $json.message.body.attachments[0].payload.url }}`
  - Response format: **file** (stores as binary)
- **Outputs / Connections:**
  - Main → **Attachment Router**
- **Edge cases / failures:**
  - URL may require auth or may expire.
  - Large files can exceed instance memory/timeouts.
  - If Max returns non-audio attachments, later steps may fail unless routed away.

#### Node: Attachment Router
- **Type / Role:** `n8n-nodes-base.switch` — detects attachment type (voice/audio vs other).
- **Configuration choices:**
  - Rule output key **Voice** when:
    - `{{ $json.message.body.attachments[0].type }}` equals `audio`
- **Outputs / Connections:**
  - **Voice** → **Get Access Token** and **Merge1 (index 1)**
- **Important note:**  
  The switch defines only a “Voice” rule; non-audio attachments will have no clear path forward (no explicit fallback configured here).
- **Edge cases / failures:**
  - If attachment type is not exactly `audio`, workflow may stop (no routed output).
  - If Max uses different type labels (e.g., `voice`, `audio/ogg`), the equals check will fail.

---

### 2.3 Voice Processing (Sber token + SmartSpeech recognition)

**Overview:**  
For voice attachments, obtains an OAuth token from Sber, then submits the audio binary to SmartSpeech for transcription, then maps the transcription into a unified `prompt` field.

**Nodes involved:**  
- Get Access Token  
- Merge1  
- Get Response  
- Voice to Prompt

#### Node: Get Access Token
- **Type / Role:** `n8n-nodes-base.httpRequest` — fetches Sber OAuth access token.
- **Configuration choices:**
  - POST `https://ngw.devices.sberbank.ru:9443/api/v2/oauth`
  - Body (form-urlencoded): `scope=SALUTE_SPEECH_PERS`
  - Headers:
    - `Accept: application/json`
    - `RqUID`: generated UUID-like value via JS expression
  - TLS: `allowUnauthorizedCerts: true` (less secure; may be used due to environment/cert chain issues)
  - Auth: **Generic Credential Type** using **httpHeaderAuth** (expects required Sber auth header(s) in credentials)
- **Outputs / Connections:**
  - Main → **Merge1 (index 0)**
- **Edge cases / failures:**
  - Wrong client credentials/headers → 401/403.
  - Token endpoint availability / TLS handshake issues.
  - The `RqUID` generation expression must be valid in n8n’s expression runtime.

#### Node: Merge1
- **Type / Role:** `n8n-nodes-base.merge` — combines token data + binary audio into one item.
- **Configuration choices:**
  - Mode: `combine`
  - Combine by: `position` (item 0 with item 0)
- **Inputs / Connections:**
  - Input 1 from **Get Access Token**
  - Input 2 from **Attachment Router** (the downloaded file item)
- **Outputs / Connections:**
  - Main → **Get Response**
- **Edge cases / failures:**
  - If one branch produces no item (e.g., token request failed), combine won’t match properly and may output nothing.
  - If multiple items appear on one side, pairing by position can mismatch.

#### Node: Get Response
- **Type / Role:** `n8n-nodes-base.httpRequest` — calls Sber SmartSpeech recognition.
- **Configuration choices:**
  - POST `https://smartspeech.sber.ru/rest/v1/speech:recognize`
  - Query:
    - `model=general`
    - `enable_profanity_filter=false`
  - Content type: `binaryData`
  - Input binary field name: `data`
  - Auth: **httpBearerAuth** credentials (expects Bearer token)
  - TLS: `allowUnauthorizedCerts: true`
- **Critical integration detail:**  
  This node uses **static Bearer credentials** (`httpBearerAuth`). However, the workflow also fetches an access token in **Get Access Token**. As configured, the fetched token is not explicitly mapped into this request’s Authorization header. If your credential is not dynamically updated elsewhere, this can be a mismatch.
- **Outputs / Connections:**
  - Main → **Voice to Prompt**
- **Edge cases / failures:**
  - Wrong/expired bearer token → 401.
  - Incorrect binary field name (must match what Download Attachment produced; often `data` but can differ).
  - Unsupported audio format, too long audio, or API response shape changes.

#### Node: Voice to Prompt
- **Type / Role:** `n8n-nodes-base.set` — normalizes transcription to `prompt`.
- **Configuration choices:**
  - Sets `prompt = {{ $json.result[0] }}`
- **Outputs / Connections:**
  - Main → **Combine (index 0)**
- **Edge cases / failures:**
  - If SmartSpeech returns no `result` array or empty, prompt becomes `undefined`, causing AI agent input issues.

---

### 2.4 Text Processing (Text → prompt)

**Overview:**  
Converts incoming text messages into the unified `prompt` field used downstream by the AI agent.

**Nodes involved:**  
- Text to Prompt

#### Node: Text to Prompt
- **Type / Role:** `n8n-nodes-base.set` — normalizes incoming text to `prompt`.
- **Configuration choices:**
  - Sets `prompt = {{ $json.message.body.text }}`
- **Outputs / Connections:**
  - Main → **Combine (index 1)**
- **Edge cases / failures:**
  - If message is not text (empty text but no attachment), prompt may be empty.
  - If Max payload uses different field naming for text in some event types.

---

### 2.5 AI Response Generation with Memory

**Overview:**  
Merges prompt streams (text or voice), sends prompt to an AI Agent configured with a GigaChat model and a windowed conversation memory keyed per Max user.

**Nodes involved:**  
- Combine  
- AI Agent1  
- GigaChat Model1  
- Simple Memory1

#### Node: Combine
- **Type / Role:** `n8n-nodes-base.merge` — merges the two alternative prompt branches into a single stream.
- **Configuration choices:** default merge (acts as a join point; inputs are connected from both branches).
- **Inputs / Connections:**
  - Input 1: **Voice to Prompt**
  - Input 2: **Text to Prompt**
- **Outputs / Connections:**
  - Main → **AI Agent1**
- **Edge cases / failures:**
  - Depending on merge behavior and timing, you may get items from whichever branch runs; typically only one branch produces output per message.
  - If both branches accidentally output (e.g., a message contains both text and an audio attachment), you could generate multiple replies.

#### Node: AI Agent1
- **Type / Role:** `@n8n/n8n-nodes-langchain.agent` — orchestrates LLM call with system instructions and memory.
- **Configuration choices:**
  - Prompt text: `{{ $json.prompt }}`
  - Prompt type: `define`
  - System message includes:
    - Persona: “ideal personal assistant”, name “Betsy”
    - Uses user display name: `{{ $('Max Trigger1').item.json.metadata.user_context.display_name }}`
    - Mentions developer links:
      - https://t.me/adept_ecommerce
      - https://www.youtube.com/@Aimaginelife
    - Includes current datetime: `{{ $now }}`
- **Model / Memory connections:**
  - Receives **ai_languageModel** from **GigaChat Model1**
  - Receives **ai_memory** from **Simple Memory1**
- **Outputs / Connections:**
  - Main → **Send Message**
- **Edge cases / failures:**
  - If `prompt` is empty/undefined, model output may be generic or error depending on agent settings.
  - If `Max Trigger1` expression reference fails, system message rendering fails.
  - Token limits: memory window + system message + prompt may exceed model context.

#### Node: GigaChat Model1
- **Type / Role:** `n8n-nodes-gigachat.lmGigaChat` — provides the GigaChat LLM to the agent.
- **Configuration choices:**
  - Model: `GigaChat`
- **Outputs / Connections:**
  - ai_languageModel → **AI Agent1**
- **Edge cases / failures:**
  - Credential/auth issues with GigaChat.
  - Model availability/quotas.

#### Node: Simple Memory1
- **Type / Role:** `@n8n/n8n-nodes-langchain.memoryBufferWindow` — conversation memory store with window length.
- **Configuration choices:**
  - Session key: `{{ $('Max Trigger1').item.json.metadata.user_context.user_id }}`
  - Context window length: `10`
  - SessionId type: custom key
- **Outputs / Connections:**
  - ai_memory → **AI Agent1**
- **Edge cases / failures:**
  - If user_id missing, all users could share memory (bad) or memory might not work.
  - Memory persistence depends on n8n execution/memory backend configuration.

---

### 2.6 Reply Delivery

**Overview:**  
Sends the AI agent’s output back to the same Max user.

**Nodes involved:**  
- Send Message

#### Node: Send Message
- **Type / Role:** `n8n-nodes-max.max` — sends a Max message.
- **Configuration choices:**
  - `text`: `{{ $json.output }}`
  - `userId`: `{{ $('Max Trigger1').item.json.metadata.user_context.user_id }}`
- **Inputs / Connections:**
  - Input from **AI Agent1**
- **Edge cases / failures:**
  - If AI Agent output key differs (not `output`), message will be blank.
  - Max API errors, rate limiting.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Max Trigger1 | n8n-nodes-max.maxTrigger | Entry point: receive Max messages | — | Check User | ## Max AI Chatbot with Voice Recognition… (full note content applies) |
| Check User | n8n-nodes-base.if | Access control by user_id | Max Trigger1 | Text/Attachment; Access Denied | ## Access Control<br>Checks if user is authorized and blocks strangers. Use your ID instead of 50488534 |
| Access Denied | n8n-nodes-max.max | Sends rejection message to unauthorized users | Check User (false) | — | ## Access Control<br>Checks if user is authorized and blocks strangers. Use your ID instead of 50488534 |
| Text/Attachment | n8n-nodes-base.switch | Route text vs attachments | Check User (true) | Download Attachment; Text to Prompt | ## Message Router<br>Separates text messages from attachments (text/files). |
| Download Attachment | n8n-nodes-base.httpRequest | Download attached file as binary | Text/Attachment (Attachment) | Attachment Router | ## Message Router<br>Separates text messages from attachments (text/files). |
| Attachment Router | n8n-nodes-base.switch | Route attachment types (audio vs other) | Download Attachment | Get Access Token; Merge1 | ## Attachment Router<br>Separates text messages from attachments (voice/files). |
| Get Access Token | n8n-nodes-base.httpRequest | Get Sber OAuth token | Attachment Router (Voice) | Merge1 | ## Voice Processing<br>Downloads voice, gets Sber token, transcribes audio to text. |
| Merge1 | n8n-nodes-base.merge | Combine token + audio item | Get Access Token; Attachment Router | Get Response | ## Voice Processing<br>Downloads voice, gets Sber token, transcribes audio to text. |
| Get Response | n8n-nodes-base.httpRequest | Send audio to SmartSpeech recognition | Merge1 | Voice to Prompt | ## Voice Processing<br>Downloads voice, gets Sber token, transcribes audio to text. |
| Voice to Prompt | n8n-nodes-base.set | Map transcription into `prompt` | Get Response | Combine | ## Voice Processing<br>Downloads voice, gets Sber token, transcribes audio to text. |
| Text to Prompt | n8n-nodes-base.set | Map text into `prompt` | Text/Attachment (Other) | Combine | ## Message Router<br>Separates text messages from attachments (text/files). |
| Combine | n8n-nodes-base.merge | Join text-prompt and voice-prompt paths | Voice to Prompt; Text to Prompt | AI Agent1 | ## AI Response<br>GigaChat generates replies with 10-message conversation memory. |
| GigaChat Model1 | n8n-nodes-gigachat.lmGigaChat | LLM backend for agent | — | AI Agent1 (ai_languageModel) | ## AI Response<br>GigaChat generates replies with 10-message conversation memory. |
| Simple Memory1 | @n8n/n8n-nodes-langchain.memoryBufferWindow | Conversation memory (10 items) keyed by user_id | — | AI Agent1 (ai_memory) | ## AI Response<br>GigaChat generates replies with 10-message conversation memory. |
| AI Agent1 | @n8n/n8n-nodes-langchain.agent | Generates assistant response from prompt + memory | Combine; GigaChat Model1; Simple Memory1 | Send Message | ## AI Response<br>GigaChat generates replies with 10-message conversation memory. |
| Send Message | n8n-nodes-max.max | Send AI response back to Max | AI Agent1 | — | ## AI Response<br>GigaChat generates replies with 10-message conversation memory. |
| Sticky Note1 | n8n-nodes-base.stickyNote | Comment: overall workflow description | — | — | ## Max AI Chatbot with Voice Recognition … (contains setup steps and notes) |
| Sticky Note2 | n8n-nodes-base.stickyNote | Comment: access control | — | — | ## Access Control… |
| Sticky Note3 | n8n-nodes-base.stickyNote | Comment: attachment router | — | — | ## Attachment Router… |
| Sticky Note4 | n8n-nodes-base.stickyNote | Comment: message router | — | — | ## Message Router… |
| Sticky Note5 | n8n-nodes-base.stickyNote | Comment: voice processing | — | — | ## Voice Processing… |
| Sticky Note6 | n8n-nodes-base.stickyNote | Comment: AI response block | — | — | ## AI Response… |
| Sticky Note14 | n8n-nodes-base.stickyNote | Comment/link | — | — | @[youtube](Mrf5TmlXkyI) |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Trigger**
   1) Add node **Max Trigger** (`n8n-nodes-max.maxTrigger`).  
   2) Configure Max API credentials (from https://business.max.ru/).  
   3) Leave additional fields default.

2. **Add Access Control**
   1) Add **IF** node named **Check User**.  
   2) Condition: Number equals  
      - Left: `{{$json.metadata.user_context.user_id}}`  
      - Right: your Max user ID (replace `50488534`)  
   3) True output goes to routing; False output goes to denial.

3. **Unauthorized Reply**
   1) Add **Max** node named **Access Denied**.  
   2) Text: a denial message (optionally include your link).  
   3) `userId`: `{{ $('Max Trigger1').item.json.metadata.user_context.user_id }}` (adapt if your trigger node has a different name).  
   4) Connect **Check User (false)** → **Access Denied**.

4. **Route Text vs Attachments**
   1) Add **Switch** node named **Text/Attachment**.  
   2) Create rule “Attachment” checking **exists**:  
      - Value: `{{ $json.message.body.attachments[0].payload.url }}`  
   3) Set fallback output name to **Other**.  
   4) Connect **Check User (true)** → **Text/Attachment**.

5. **Text → Prompt**
   1) Add **Set** node named **Text to Prompt**.  
   2) Add field `prompt` (string) = `{{ $json.message.body.text }}`  
   3) Connect **Text/Attachment (Other)** → **Text to Prompt**.

6. **Download Attachment**
   1) Add **HTTP Request** node named **Download Attachment**.  
   2) URL: `{{ $json.message.body.attachments[0].payload.url }}`  
   3) Response format: **File** (so output becomes binary).  
   4) Connect **Text/Attachment (Attachment)** → **Download Attachment**.

7. **Route Attachment Type (Voice)**
   1) Add **Switch** node named **Attachment Router**.  
   2) Add rule “Voice”:  
      - Left: `{{ $json.message.body.attachments[0].type }}`  
      - Equals: `audio`  
   3) Connect **Download Attachment** → **Attachment Router**.  
   4) (Recommended) Add a fallback path for non-audio attachments (e.g., reply “unsupported file type”) to avoid silent stops.

8. **Sber OAuth Token**
   1) Add **HTTP Request** node named **Get Access Token**.  
   2) Method: POST  
   3) URL: `https://ngw.devices.sberbank.ru:9443/api/v2/oauth`  
   4) Body: `application/x-www-form-urlencoded` with parameter `scope = SALUTE_SPEECH_PERS`  
   5) Headers:
      - `Accept: application/json`
      - `RqUID`: generate a UUID-like string (same expression as workflow or your own UUID generator).
   6) Auth: use **Header Auth** credentials containing required Sber auth header(s).  
   7) Connect **Attachment Router (Voice)** → **Get Access Token**.

9. **Combine Token + Audio**
   1) Add **Merge** node named **Merge1**.  
   2) Mode: **Combine**, “By Position”.  
   3) Connect **Get Access Token** → **Merge1 input 1**.  
   4) Also connect **Attachment Router (Voice)** → **Merge1 input 2** (this path carries the downloaded binary).

10. **Speech Recognition Request**
   1) Add **HTTP Request** node named **Get Response**.  
   2) Method: POST  
   3) URL: `https://smartspeech.sber.ru/rest/v1/speech:recognize`  
   4) Query params:
      - `model=general`
      - `enable_profanity_filter=false`
   5) Send body as **binaryData**, binary property name: `data` (must match your downloaded binary field).  
   6) Auth: **Bearer Auth** credentials (or map the token dynamically—recommended).  
   7) Connect **Merge1** → **Get Response**.

11. **Voice → Prompt**
   1) Add **Set** node named **Voice to Prompt**.  
   2) Field `prompt` = `{{ $json.result[0] }}`  
   3) Connect **Get Response** → **Voice to Prompt**.

12. **Join Prompt Paths**
   1) Add **Merge** node named **Combine** (acts as a join point).  
   2) Connect **Voice to Prompt** → **Combine input 1**.  
   3) Connect **Text to Prompt** → **Combine input 2**.

13. **AI Model + Memory**
   1) Add **GigaChat Model** node named **GigaChat Model1** and set model to **GigaChat**. Configure GigaChat API credentials.  
   2) Add **Memory Buffer Window** node named **Simple Memory1**:
      - Session key: `{{ $('Max Trigger1').item.json.metadata.user_context.user_id }}`
      - Window length: 10
   3) Add **AI Agent** node named **AI Agent1**:
      - Text: `{{ $json.prompt }}`
      - System message: define assistant persona; you can include:
        - `{{ $('Max Trigger1').item.json.metadata.user_context.display_name }}`
        - `{{ $now }}`
   4) Connect:
      - **Combine** → **AI Agent1 (main)**
      - **GigaChat Model1** → **AI Agent1 (ai_languageModel)**
      - **Simple Memory1** → **AI Agent1 (ai_memory)**

14. **Send Response to Max**
   1) Add **Max** node named **Send Message**.  
   2) Text: `{{ $json.output }}`  
   3) userId: `{{ $('Max Trigger1').item.json.metadata.user_context.user_id }}`  
   4) Connect **AI Agent1** → **Send Message**.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Max bot credentials are obtained via Max Business portal | https://business.max.ru/ |
| Developer telegram channel mentioned in system message | https://t.me/adept_ecommerce |
| YouTube channel referenced in denial/system message | https://www.youtube.com/@Aimaginelife |
| Sticky video link | @[youtube](Mrf5TmlXkyI) |
| Important: replace hardcoded allowed user ID (50488534) | In **Check User** node |
| This design uses Russian AI services: GigaChat (chat) + Sber SmartSpeech (voice recognition) | Per Sticky Note1 |

