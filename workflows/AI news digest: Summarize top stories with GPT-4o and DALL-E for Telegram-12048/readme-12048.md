AI news digest: Summarize top stories with GPT-4o and DALL-E for Telegram

https://n8nworkflows.xyz/workflows/ai-news-digest--summarize-top-stories-with-gpt-4o-and-dall-e-for-telegram-12048


# AI news digest: Summarize top stories with GPT-4o and DALL-E for Telegram

## 1. Workflow Overview

**Purpose:**  
This n8n workflow creates a **daily AI news digest**: it fetches AI-related headlines from three RSS sources, **deduplicates and ranks** them, uses an **OpenAI chat model** (via LangChain Agent) to generate **structured summaries + an image prompt**, generates a **cover image** (OpenAI image generation), and sends the result to **Telegram** as a photo with a Markdown caption.  
It also includes a separate **interactive chat mode** triggered by incoming Telegram messages, letting users discuss AI news through the n8n AI Agent chat interface.

### 1.1 Daily Digest Automation (Scheduled)
- Trigger at 8:00 AM
- Load configuration (RSS URLs + Telegram chat ID)
- Fetch RSS feeds (3 sources)
- Parse + dedupe + rank items → choose top 5
- Summarize top 5 + produce image prompt (structured)
- Generate image
- Format message + send photo to Telegram

### 1.2 Interactive Chat Mode (Telegram Trigger)
- Telegram incoming message triggers a chat agent
- Uses window buffer memory + OpenAI chat model
- Designed for conversation inside n8n’s Chat UI (separate from daily digest)

---

## 2. Block-by-Block Analysis

### Block 1 — Scheduling & Configuration
**Overview:** Runs once per day and prepares the configurable inputs (feed URLs and Telegram destination). This block fans out into the three HTTP requests.

**Nodes involved:**
- Daily 8 AM Trigger
- Workflow Configuration

#### Node: Daily 8 AM Trigger
- **Type / role:** Schedule Trigger (`n8n-nodes-base.scheduleTrigger`) — daily entry point.
- **Configuration:** Triggers at **08:00** (local instance timezone).
- **Connections:**
  - **Out:** `Workflow Configuration`
- **Edge cases / failures:**
  - Timezone differences can cause unexpected run time if instance TZ isn’t what you expect.
  - If the workflow is inactive, it won’t run (workflow is currently `active: false`).

#### Node: Workflow Configuration
- **Type / role:** Set node (`n8n-nodes-base.set`) — centralized configuration.
- **Configuration choices:**
  - Sets:
    - `newsSource1Url` = Google News RSS query for “artificial intelligence”
    - `newsSource2Url` = The Verge AI RSS
    - `newsSource3Url` = TechCrunch AI feed
    - `telegramChatId` = placeholder (must be replaced)
  - `includeOtherFields: true` keeps any incoming fields (though trigger items usually have none).
- **Key expressions used by downstream nodes:**
  - `{{ $('Workflow Configuration').first().json.newsSourceXUrl }}`
  - `{{ $('Workflow Configuration').first().json.telegramChatId }}`
- **Connections:**
  - **In:** `Daily 8 AM Trigger`
  - **Out (fan-out):** `Fetch AI News Source 1`, `Fetch AI News Source 2`, `Fetch AI News Source 3`
- **Edge cases / failures:**
  - If `telegramChatId` remains placeholder/empty, Telegram send will fail.
  - If feed URLs are invalid/unreachable, downstream aggregation may produce zero stories.

**Sticky note(s) affecting this block:**
- **フロー説明**
  - “## 1️⃣ Configuration … Start here! … set Telegram Chat ID … customize RSS feed URLs…”
- **設定ガイド**
  - Explains full workflow and setup, including `@userinfobot` to retrieve chat ID.

---

### Block 2 — Fetch RSS Feeds (3 sources)
**Overview:** Fetches content from three RSS endpoints in parallel. Each HTTP request is configured to avoid hard failures and continue even if one source is down.

**Nodes involved:**
- Fetch AI News Source 1
- Fetch AI News Source 2
- Fetch AI News Source 3

#### Node: Fetch AI News Source 1
- **Type / role:** HTTP Request (`n8n-nodes-base.httpRequest`) — retrieves RSS XML.
- **Configuration choices:**
  - `url` from configuration: `newsSource1Url`
  - Response option `neverError: true` (so non-2xx doesn’t automatically throw)
  - `continueOnFail: true` (workflow proceeds if this request fails)
- **Connections:**
  - **In:** `Workflow Configuration`
  - **Out:** `Aggregate and Rank News`
- **Edge cases / failures:**
  - RSS provider may block/ratelimit requests.
  - Response shape may differ (string vs object with `data`), but aggregator attempts to handle both.
  - If it returns HTML (captcha/consent page), parsing likely yields no `<item>` entries.

#### Node: Fetch AI News Source 2
- Same as source 1, but URL uses `newsSource2Url` (The Verge AI RSS).
- **Edge cases:** The Verge RSS formatting may differ; aggregator relies on `<item>` blocks.

#### Node: Fetch AI News Source 3
- Same as source 1, but URL uses `newsSource3Url` (TechCrunch AI feed).
- **Edge cases:** TechCrunch often uses `content:encoded`; aggregator explicitly tries it.

**Sticky note(s) affecting this block:**
- **ニュースソース一覧**
  - Describes parsing, dedupe, sorting, and selecting top 5.

---

### Block 3 — Aggregate, Parse, Deduplicate, Rank (Top 5)
**Overview:** Consolidates all incoming feed responses, parses RSS XML items, normalizes fields, removes duplicates by title, sorts by recency, and outputs the top 5 as individual items.

**Nodes involved:**
- Aggregate and Rank News

#### Node: Aggregate and Rank News
- **Type / role:** Code node (`n8n-nodes-base.code`) — custom parsing and ranking.
- **Core logic (interpreted):**
  1. Collect all incoming items via `$input.all()`.
  2. Skip responses marked as errors.
  3. Parse RSS/XML if content contains `<item>`:
     - Extract `title`, `description` (or `content:encoded`), `link` (or `guid` if URL), `pubDate`, `source`.
     - Strips CDATA and HTML tags.
     - Truncates description to 300 chars (+ ellipsis if longer).
  4. Also supports JSON formats (`data.articles[]`) or single article object as fallback.
  5. Deduplicate by `title.toLowerCase().trim()`.
  6. Sort descending by `publishedAt`.
  7. Return top 5 as **5 separate output items**.
- **Key variables / expressions:**
  - `$input.all()`
  - Custom helpers: `extractText()`, `extractLink()`
- **Connections:**
  - **In:** all three `Fetch AI News Source X` nodes
  - **Out:** `AI News Summarizer Agent`
- **Edge cases / failures:**
  - **Date parsing:** `new Date(pubDate)` can yield `Invalid Date` for some formats; sorting could behave unexpectedly (NaN comparisons).
  - **No `<item>` present:** Returns zero items → summarizer agent receives no stories.
  - **Duplicate detection:** Only title-based; different stories with same title collapse.
  - **Description missing:** Uses empty string; truncation still safe.
  - **Feed-specific tags:** Some feeds use `<atom:link>`; current parser doesn’t handle this.

---

### Block 4 — AI Summarization with Structured Output
**Overview:** A LangChain Agent uses an OpenAI chat model to turn the top 5 items into a structured response containing story summaries and an image prompt, enforced by a structured output parser (schema example).

**Nodes involved:**
- AI News Summarizer Agent
- OpenAI Chat Model
- Structured Output Parser

#### Node: AI News Summarizer Agent
- **Type / role:** LangChain Agent (`@n8n/n8n-nodes-langchain.agent`) — orchestrates LLM call and outputs structured JSON.
- **Configuration choices:**
  - Prompt (define mode): “Analyze the top 5 AI news stories … create concise, engaging summaries … Return data in structured format defined by output parser … Include titles, summaries, links.”
  - `hasOutputParser: true` (expects parser connection)
- **Inputs/Outputs:**
  - **Main input:** Items from `Aggregate and Rank News` (up to 5)
  - **AI language model input:** from `OpenAI Chat Model` (via `ai_languageModel` connection)
  - **AI output parser input:** from `Structured Output Parser` (via `ai_outputParser` connection)
  - **Main output:** to `Generate AI Image`
- **Edge cases / failures:**
  - If input items are empty, the agent may output empty/partial structure or fail schema constraints (depending on parser strictness).
  - Model may produce invalid JSON without strong enforcement; parser mitigates this but can still fail.
  - Token limits: 5 stories usually safe, but long RSS descriptions could inflate context.

#### Node: OpenAI Chat Model
- **Type / role:** OpenAI Chat Model (`@n8n/n8n-nodes-langchain.lmChatOpenAi`) — LLM provider for the agent.
- **Configuration choices:**
  - Model: `gpt-4.1-mini`
- **Credentials:** `openAiApi`
- **Connections:**
  - **Out (ai_languageModel):** `AI News Summarizer Agent`
- **Edge cases / failures:**
  - OpenAI auth errors (invalid key, quota exceeded).
  - Transient timeouts; consider retries at infrastructure level.

#### Node: Structured Output Parser
- **Type / role:** Structured output parser (`@n8n/n8n-nodes-langchain.outputParserStructured`) — enforces response shape.
- **Configuration choices:**
  - Provides an example schema:
    - `stories[]: { title, summary, link }`
    - `imagePrompt: string`
- **Connections:**
  - **Out (ai_outputParser):** `AI News Summarizer Agent`
- **Edge cases / failures:**
  - If the agent returns missing fields/types, parsing can error.
  - The example schema is not a fully explicit JSON Schema; enforcement depends on node behavior/version.

**Sticky note(s) affecting this block:**
- **認証情報**
  - Explains that AI Agent summarizes top 5 and generates a DALL‑E prompt.

---

### Block 5 — Generate Cover Image (OpenAI Image)
**Overview:** Uses the `imagePrompt` from the agent’s structured output to generate a 1024×1024 image.

**Nodes involved:**
- Generate AI Image

#### Node: Generate AI Image
- **Type / role:** OpenAI Image generation (`@n8n/n8n-nodes-langchain.openAi`) — image resource call.
- **Configuration choices:**
  - `resource: image`
  - Prompt: `{{ $json.output.imagePrompt }}`
  - Size: `1024x1024`
  - Quality: `standard`
- **Credentials:** `openAiApi`
- **Connections:**
  - **In:** `AI News Summarizer Agent`
  - **Out:** `Format Telegram Message`
- **Edge cases / failures:**
  - If `output.imagePrompt` is missing, the request may fail or generate irrelevant output.
  - OpenAI content policy filters can reject prompts (rare for neutral news themes).
  - Response format: downstream assumes an array-like `data` with `[0].url`.

---

### Block 6 — Format and Send to Telegram
**Overview:** Builds a Markdown-formatted Telegram caption containing the 5 summaries and attaches the generated image URL as a photo.

**Nodes involved:**
- Format Telegram Message
- Send to Telegram

#### Node: Format Telegram Message
- **Type / role:** Code node (`n8n-nodes-base.code`) — message composition.
- **Configuration choices / logic:**
  - Reads structured output: `$('AI News Summarizer Agent').first().json.output`
  - Reads image response: `$input.first().json.data`
  - Creates message header and separators.
  - Iterates `agentOutput.stories` and assigns per-story emoji.
  - Adds link using Markdown: `[Read more](URL)`
  - Adds date using `toLocaleDateString('ja-JP', { year, month, day })`
  - Outputs:
    - `telegramMessage`
    - `imageUrl` = `imageData[0].url` (or `null`)
- **Connections:**
  - **In:** `Generate AI Image`
  - **Out:** `Send to Telegram`
- **Edge cases / failures:**
  - Telegram Markdown is picky: titles/summaries containing `*`, `_`, `[`, `]`, `(`, `)` may break formatting unless escaped (currently **not escaped**).
  - If `imageData` isn’t in expected shape, `imageUrl` becomes null → photo send may fail.
  - Locale `ja-JP` produces Japanese-style date formatting (intentional, but may surprise).

#### Node: Send to Telegram
- **Type / role:** Telegram node (`n8n-nodes-base.telegram`) — sends photo message.
- **Operation:** `sendPhoto`
- **Configuration choices:**
  - `chatId`: `{{ $('Workflow Configuration').first().json.telegramChatId }}`
  - Photo `file` via URL: `{{ $json.imageUrl }}`
  - Caption: `{{ $json.telegramMessage }}`
  - `parse_mode: Markdown`
- **Credentials:** `telegramApi`
- **Connections:**
  - **In:** `Format Telegram Message`
- **Edge cases / failures:**
  - If `telegramChatId` is wrong or bot isn’t allowed in the chat, Telegram API returns 403/400.
  - If the image URL is not publicly accessible or expires quickly, Telegram may fail fetching it.
  - Caption length limits: Telegram captions have size limits; 5 stories is usually safe, but long summaries can overflow.

---

### Block 7 — Interactive Chat Mode (Telegram → Agent)
**Overview:** A separate entry point listens for Telegram messages and routes them into a conversational agent with short-term memory.

**Nodes involved:**
- Telegram Trigger
- Chat AI Agent
- OpenAI Chat Model for Chat
- Window Buffer Memory

#### Node: Telegram Trigger
- **Type / role:** Telegram Trigger (`n8n-nodes-base.telegramTrigger`) — second entry point.
- **Configuration choices:**
  - Updates: `message`
- **Credentials:** `telegramApi`
- **Connections:**
  - **Out:** `Chat AI Agent`
- **Edge cases / failures:**
  - Webhook setup issues (if n8n public URL changes, Telegram webhook can break).
  - Bot permissions / privacy mode may prevent receiving some messages in groups.

#### Node: Chat AI Agent
- **Type / role:** LangChain Agent — conversational assistant.
- **Configuration choices:**
  - Prompt: helpful AI assistant discussing AI news; informative and engaging.
  - No structured output parser configured here.
- **Connections:**
  - **In (main):** `Telegram Trigger`
  - **In (ai_languageModel):** `OpenAI Chat Model for Chat`
  - **In (ai_memory):** `Window Buffer Memory`
- **Edge cases / failures:**
  - Without a “send message back to Telegram” node, this flow mainly serves **n8n Chat UI** usage; Telegram users won’t automatically get responses unless n8n’s chat handling is configured elsewhere.
  - If memory grows too large, context window truncation occurs (expected behavior).

#### Node: OpenAI Chat Model for Chat
- **Type / role:** OpenAI Chat Model — LLM for interactive chat.
- **Configuration choices:**
  - Model: `gpt-4.1-mini`
- **Credentials:** `openAiApi`
- **Connections:**
  - **Out (ai_languageModel):** `Chat AI Agent`
- **Edge cases:** Same OpenAI credential/quota concerns.

#### Node: Window Buffer Memory
- **Type / role:** Memory (`@n8n/n8n-nodes-langchain.memoryBufferWindow`) — maintains recent conversation context.
- **Configuration choices:**
  - `contextWindowLength: 40` (keeps last ~40 messages/turns depending on implementation)
- **Connections:**
  - **Out (ai_memory):** `Chat AI Agent`
- **Edge cases:**
  - If multiple users message the bot, memory scoping may not be per-user unless configured (depends on n8n/langchain node behavior and chat session handling).

**Sticky note(s) affecting this block:**
- **チャット説明**
  - Explains this is separate from daily automation and uses Window Buffer Memory.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Daily 8 AM Trigger | Schedule Trigger | Daily entry point at 08:00 | — | Workflow Configuration | ## 🤖 Daily AI News Digest + Chat … setup and explanation (設定ガイド) |
| Workflow Configuration | Set | Stores RSS URLs and Telegram chat ID | Daily 8 AM Trigger | Fetch AI News Source 1; Fetch AI News Source 2; Fetch AI News Source 3 | ## 1️⃣ Configuration … set Telegram Chat ID … customize RSS URLs (フロー説明) |
| Fetch AI News Source 1 | HTTP Request | Fetch Google News RSS | Workflow Configuration | Aggregate and Rank News | ## 2️⃣ Fetch & Rank … parse XML/RSS … dedupe … sort … pick top 5 (ニュースソース一覧) |
| Fetch AI News Source 2 | HTTP Request | Fetch The Verge AI RSS | Workflow Configuration | Aggregate and Rank News | ## 2️⃣ Fetch & Rank … parse XML/RSS … dedupe … sort … pick top 5 (ニュースソース一覧) |
| Fetch AI News Source 3 | HTTP Request | Fetch TechCrunch AI RSS | Workflow Configuration | Aggregate and Rank News | ## 2️⃣ Fetch & Rank … parse XML/RSS … dedupe … sort … pick top 5 (ニュースソース一覧) |
| Aggregate and Rank News | Code | Parse RSS, normalize items, dedupe, rank, select top 5 | Fetch AI News Source 1; Fetch AI News Source 2; Fetch AI News Source 3 | AI News Summarizer Agent | ## 2️⃣ Fetch & Rank … parse XML/RSS … dedupe … sort … pick top 5 (ニュースソース一覧) |
| AI News Summarizer Agent | LangChain Agent | Summarize top 5 and produce image prompt (structured) | Aggregate and Rank News (main); OpenAI Chat Model (ai); Structured Output Parser (ai) | Generate AI Image | ## 3️⃣ AI Analysis & Art … summarizes and generates DALL-E prompt (認証情報) |
| OpenAI Chat Model | OpenAI Chat (LangChain) | LLM powering summarizer agent | — | AI News Summarizer Agent | ## 3️⃣ AI Analysis & Art … summarizes and generates DALL-E prompt (認証情報) |
| Structured Output Parser | LangChain Structured Parser | Enforces `stories[]` + `imagePrompt` output | — | AI News Summarizer Agent | ## 3️⃣ AI Analysis & Art … summarizes and generates DALL-E prompt (認証情報) |
| Generate AI Image | OpenAI Image (LangChain) | Generate 1024×1024 cover image from prompt | AI News Summarizer Agent | Format Telegram Message | ## 3️⃣ AI Analysis & Art … summarizes and generates DALL-E prompt (認証情報) |
| Format Telegram Message | Code | Build Markdown caption + extract image URL | Generate AI Image | Send to Telegram |  |
| Send to Telegram | Telegram | Send photo + caption to configured chat | Format Telegram Message | — |  |
| Telegram Trigger | Telegram Trigger | Entry point for interactive chat mode | — | Chat AI Agent | ## 💬 Interactive Chat Mode … talk via n8n Chat … uses memory (チャット説明) |
| Chat AI Agent | LangChain Agent | Conversational assistant about AI news | Telegram Trigger (main); OpenAI Chat Model for Chat (ai); Window Buffer Memory (ai) | — | ## 💬 Interactive Chat Mode … talk via n8n Chat … uses memory (チャット説明) |
| OpenAI Chat Model for Chat | OpenAI Chat (LangChain) | LLM for interactive chat agent | — | Chat AI Agent | ## 💬 Interactive Chat Mode … talk via n8n Chat … uses memory (チャット説明) |
| Window Buffer Memory | LangChain Memory | Keeps last 40 turns of chat context | — | Chat AI Agent | ## 💬 Interactive Chat Mode … talk via n8n Chat … uses memory (チャット説明) |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n named:  
   `Create daily AI news digest and send to Telegram`

2. **Add node: Schedule Trigger**
   - Node type: **Schedule Trigger**
   - Configure rule: **Every day at 08:00**
   - Name it: `Daily 8 AM Trigger`

3. **Add node: Set**
   - Node type: **Set**
   - Name: `Workflow Configuration`
   - Add string fields:
     - `newsSource1Url` = `https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en`
     - `newsSource2Url` = `https://www.theverge.com/rss/ai-artificial-intelligence/index.xml`
     - `newsSource3Url` = `https://techcrunch.com/category/artificial-intelligence/feed/`
     - `telegramChatId` = your Telegram chat ID (example: `123456789` or `-100...` for channels/supergroups)
   - Enable “Include Other Fields” (or keep defaults if equivalent).
   - Connect: `Daily 8 AM Trigger` → `Workflow Configuration`

4. **Create 3 HTTP Request nodes (RSS fetch)**
   - Node type: **HTTP Request**
   - Set each **URL** using an expression:
     - Node 1 name: `Fetch AI News Source 1`  
       URL: `{{ $('Workflow Configuration').first().json.newsSource1Url }}`
     - Node 2 name: `Fetch AI News Source 2`  
       URL: `{{ $('Workflow Configuration').first().json.newsSource2Url }}`
     - Node 3 name: `Fetch AI News Source 3`  
       URL: `{{ $('Workflow Configuration').first().json.newsSource3Url }}`
   - In each node:
     - Enable a “never error” / “ignore response code” style option (in this workflow: `neverError: true`)
     - Enable **Continue On Fail**
   - Connect `Workflow Configuration` to each HTTP node (fan-out).

5. **Add node: Code (aggregate and rank)**
   - Node type: **Code**
   - Name: `Aggregate and Rank News`
   - Paste/implement logic equivalent to:
     - Parse `<item>` blocks from RSS/XML
     - Extract `title`, `description`/`content:encoded`, `link`/`guid`, `pubDate`, `source`
     - Deduplicate by normalized title
     - Sort by published date descending
     - Output top 5 as separate items `{title, description, link, source, publishedAt}`
   - Connect each HTTP node → `Aggregate and Rank News` (3 inputs into same node).

6. **Add nodes for AI summarization (LangChain)**
   1) **LangChain Agent**
   - Node type: **AI Agent (LangChain)**
   - Name: `AI News Summarizer Agent`
   - Prompt mode: “Define”
   - Prompt text: instruct to summarize top 5 stories and return structured output (titles, summaries, links) + image prompt.
   - Enable/attach output parser (has output parser).
   - Connect: `Aggregate and Rank News` → `AI News Summarizer Agent` (main)

   2) **OpenAI Chat Model**
   - Node type: **OpenAI Chat Model (LangChain)**
   - Name: `OpenAI Chat Model`
   - Model: `gpt-4.1-mini`
   - Credentials: configure **OpenAI API** credential in n8n and select it.
   - Connect: `OpenAI Chat Model` → `AI News Summarizer Agent` via the **AI Language Model** connection type.

   3) **Structured Output Parser**
   - Node type: **Structured Output Parser (LangChain)**
   - Name: `Structured Output Parser`
   - Provide an example structure like:
     - `stories: [{title, summary, link}, ...]`
     - `imagePrompt: "..."`  
   - Connect: `Structured Output Parser` → `AI News Summarizer Agent` via the **AI Output Parser** connection type.

7. **Add node: OpenAI Image generation**
   - Node type: **OpenAI (LangChain)** with **resource = image**
   - Name: `Generate AI Image`
   - Prompt expression: `{{ $json.output.imagePrompt }}`
   - Size: `1024x1024`
   - Quality: `standard`
   - Credentials: same **OpenAI API** credential
   - Connect: `AI News Summarizer Agent` → `Generate AI Image`

8. **Add node: Code (format Telegram message)**
   - Node type: **Code**
   - Name: `Format Telegram Message`
   - Build output fields:
     - `telegramMessage` (Markdown formatted digest)
     - `imageUrl` extracted from image generation response (commonly `data[0].url`)
   - Connect: `Generate AI Image` → `Format Telegram Message`

9. **Add node: Telegram (sendPhoto)**
   - Node type: **Telegram**
   - Name: `Send to Telegram`
   - Operation: `sendPhoto`
   - Chat ID expression: `{{ $('Workflow Configuration').first().json.telegramChatId }}`
   - Photo/File: by URL: `{{ $json.imageUrl }}`
   - Caption: `{{ $json.telegramMessage }}`
   - Parse mode: `Markdown`
   - Credentials: configure **Telegram API** credential (Bot token) and select it.
   - Connect: `Format Telegram Message` → `Send to Telegram`

10. **(Optional) Add interactive chat mode**
   1) Add **Telegram Trigger**
   - Updates: `message`
   - Connect to bot credential

   2) Add **Window Buffer Memory**
   - Context window length: `40`

   3) Add **OpenAI Chat Model** (second instance)
   - Model: `gpt-4.1-mini`
   - Same OpenAI credentials

   4) Add **LangChain Agent** (chat)
   - Prompt: assistant that discusses latest AI news
   - Connect:
     - `Telegram Trigger` → `Chat AI Agent` (main)
     - `OpenAI Chat Model for Chat` → `Chat AI Agent` (ai_languageModel)
     - `Window Buffer Memory` → `Chat AI Agent` (ai_memory)

   **Note:** If you want responses sent back to Telegram, add a Telegram “Send Message” node wired to the agent’s output (this workflow does not include that node).

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “This workflow acts as your personal AI news editor… delivers a briefing to Telegram every morning… Chat section allows follow-up questions via n8n Chat interface.” | Sticky note: 設定ガイド |
| “To get Telegram chat ID: Message `@userinfobot` on Telegram.” | Sticky note: 設定ガイド |
| “AI Agent summarizes top 5 stories and generates a descriptive prompt for DALL-E 3.” | Sticky note: 認証情報 |
| “Fetch & Rank: parse XML/RSS, remove duplicates, sort by most recent, pick top 5.” | Sticky note: ニュースソース一覧 |
| “Interactive Chat Mode is separate; uses Window Buffer Memory for conversation context.” | Sticky note: チャット説明 |