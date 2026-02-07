Answer Questions with Factual Web Search using Telegram, Tavily and GPT-5

https://n8nworkflows.xyz/workflows/answer-questions-with-factual-web-search-using-telegram--tavily-and-gpt-5-8673


# Answer Questions with Factual Web Search using Telegram, Tavily and GPT-5

### 1. Workflow Overview

This workflow implements a **Telegram Search Assistant** bot designed to provide fast, concise, and factually grounded answers to user questions submitted via Telegram. It leverages a web search API (Tavily) and an advanced AI language model (GPT-5 via AIMLAPI) to find and summarize accurate information, then replies directly in the Telegram chat.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures incoming Telegram messages and acknowledges user input with a typing indicator.
- **1.2 Web Search Processing:** Sends the user's question to Tavily web search API and retrieves raw search results.
- **1.3 AI Summarization:** Passes the search results and user query to GPT-5, prompting it to extract only factual answers, summarized in 3-4 sentences with strict no-fabrication guardrails.
- **1.4 Telegram Reply:** Sends the generated concise answer back to the Telegram chat, replying to the original message.

Additional logical considerations include error handling, command routing (e.g., `/help`, `/sources`), and potential customizations such as rate limiting and caching mentioned in sticky notes but not implemented in this version.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block triggers the workflow upon receiving a Telegram message, captures essential metadata for replying, and signals to the user that the bot is processing the request by sending a "typing" chat action.

- **Nodes Involved:**  
  - Telegram Trigger  
  - Send a chat action

- **Node Details:**

  - **Telegram Trigger**  
    - Type: Telegram Trigger  
    - Role: Entry point for incoming Telegram messages; listens for `message` updates.  
    - Configuration: Uses Telegram API credentials; triggers on any incoming message.  
    - Inputs: Telegram incoming message event.  
    - Outputs: JSON object including `message.text`, `chat.id`, and `message_id` for reply referencing.  
    - Edge cases: No message text or non-text messages may require filtering in future enhancements.  
    - Version: v1.2  
    - Sub-workflow: None

  - **Send a chat action**  
    - Type: Telegram node - Send Chat Action  
    - Role: Sends "typing" indicator to Telegram chat to inform user of processing.  
    - Configuration: Uses chat ID from incoming Telegram message JSON; operation set to `sendChatAction`.  
    - Inputs: Output from Telegram Trigger.  
    - Outputs: Passes data downstream unchanged.  
    - Edge cases: Network or Telegram API failures; chat ID absent or invalid.  
    - Version: v1.2  
    - Sub-workflow: None

#### 2.2 Web Search Processing

- **Overview:**  
  Uses the Tavily API to perform a web search based on the user's question text, providing raw JSON search results for further processing.

- **Nodes Involved:**  
  - Search

- **Node Details:**

  - **Search**  
    - Type: Tavily API Node  
    - Role: Executes web search with user's query text.  
    - Configuration: Query expression set dynamically from Telegram Trigger's message text; no additional options configured.  
    - Inputs: Receives JSON with `message.text` from Send a chat action node.  
    - Outputs: Raw Tavily JSON search results under `results`.  
    - Credentials: Tavily API key stored securely.  
    - Edge cases: Empty query, API rate limits, no results found, network errors.  
    - Version: v1  
    - Sub-workflow: None

#### 2.3 AI Summarization

- **Overview:**  
  Summarizes the Tavily search results into a concise, factual answer using GPT-5 via AIMLAPI, following strict prompt guardrails to avoid hallucinations and limit output length.

- **Nodes Involved:**  
  - AI/ML Chat Completion

- **Node Details:**

  - **AI/ML Chat Completion**  
    - Type: AIMLAPI Chat Completion Node  
    - Role: Invokes GPT-5 chat model to generate a concise factual answer.  
    - Configuration:  
      - Model: `openai/gpt-5-chat-latest`  
      - Prompt: Dynamically constructed prompt embedding user question and full Tavily JSON results.  
      - Response format: Plain text  
      - Key prompt instructions: Extract only facts, 3-4 sentences max, no fabrication, state if data is insufficient.  
    - Inputs: JSON containing `query` (user question), `results` (Tavily JSON).  
    - Outputs: Plain text answer in `content`.  
    - Credentials: AIMLAPI key configured.  
    - Edge cases: Model timeouts, over-length responses, prompt injection risks, incomplete or malformed search results.  
    - Version: v1  
    - Sub-workflow: None

#### 2.4 Telegram Reply

- **Overview:**  
  Sends the AI-generated concise answer back to the Telegram chat, replying to the original user message to maintain context.

- **Nodes Involved:**  
  - Send a text message

- **Node Details:**

  - **Send a text message**  
    - Type: Telegram node - Send Message  
    - Role: Posts the AI answer as a reply in the original Telegram chat.  
    - Configuration:  
      - Text content: Dynamic expression mapping to AI node's output `content`.  
      - Chat ID: extracted from the original Telegram Trigger message.  
      - Reply to message ID: references the original message to thread the answer.  
      - No attribution appended.  
    - Inputs: AI/ML Chat Completion output.  
    - Outputs: Message sent confirmation.  
    - Credentials: Telegram API credentials used.  
    - Edge cases: Chat ID or message ID missing, Telegram API failures, message length limits.  
    - Version: v1.2  
    - Sub-workflow: None

---

### 3. Summary Table

| Node Name             | Node Type                  | Functional Role                  | Input Node(s)          | Output Node(s)          | Sticky Note                                                                                                                                                        |
|-----------------------|----------------------------|---------------------------------|-----------------------|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger       | Telegram Trigger           | Receive Telegram message         | —                     | Send a chat action      | —                                                                                                                                                                |
| Send a chat action     | Telegram                   | Show "typing" indicator          | Telegram Trigger       | Search                 | —                                                                                                                                                                |
| Search                | Tavily API Node             | Perform web search with query    | Send a chat action     | AI/ML Chat Completion  | ## 🔎 Web Search Query = user message. Pass raw JSON downstream.                                                                                                |
| AI/ML Chat Completion  | AIMLAPI Chat Completion    | Summarize search results         | Search                | Send a text message     | ## 🧠 LLM Summarize Input: full search JSON. Output: concise factual answer.                                                                                      |
| Send a text message    | Telegram                   | Reply with answer in Telegram    | AI/ML Chat Completion  | —                      | ## 📤 Reply to Telegram Reply to same chat, referencing original message.                                                                                         |
| Sticky Note — Overview | Sticky Note                | Workflow purpose & summary       | —                     | —                      | # 🔍 Telegram Search Assistant Minimal bot that: 1) Receives a question in Telegram 2) Searches the web (Tavily) 3) Summarizes facts with AIMLAPI (openai/gpt-5-chat-latest) 4) Replies concisely (3–4 sentences), grounded in sources Goal: fast, factual answers without hallucinations. |
| Sticky Note — LLM Prompt | Sticky Note              | Instructions for LLM prompt      | —                     | —                      | ## 🧠 LLM Prompt (Guardrails) * Extract only facts that answer the question * 3–4 sentences max * If data is thin → say so clearly * No fabrication — use provided results only Inputs: - `query = user message` - `results = full Tavily JSON` |
| Sticky Note — Testing  | Sticky Note                | Testing & fallback guidance      | —                     | —                      | ## 🧪 Testing & Fallbacks * Test from Telegram (not only “Execute Node”) * Add `Switch` for commands and empty text * If no results → reply: “I couldn’t find enough reliable info.” * Catch errors: send friendly message, log details |
| Sticky Note — Customization | Sticky Note           | Suggestions for enhancements     | —                     | —                      | ## 🛠 Customization * `/help` → usage & examples * `/sources` → list top URLs from results * `/news` or `/wiki` routing via keywords * Add NSFW/profanity filter pre-search * Rate-limit per user (Set → Wait → Redis/DB) * Optional: cache recent answers (key = normalized query) |
| Sticky Note — Reply    | Sticky Note                | Explanation of reply node        | —                     | —                      | ## 📤 Reply to Telegram Reply to same chat, referencing original message.                                                                                        |
| Sticky Note — LLM      | Sticky Note                | Explanation of LLM summarization | —                     | —                      | ## 🧠 LLM Summarize Input: full search JSON. Output: concise factual answer.                                                                                      |
| Sticky Note — Search   | Sticky Note                | Explanation of search node       | —                     | —                      | ## 🔎 Web Search Query = user message. Pass raw JSON downstream.                                                                                                |
| Sticky Note — Typing   | Sticky Note                | Explanation of typing indicator  | —                     | —                      | ## ⌨️ Typing Indicator Send "typing" to show progress.                                                                                                          |
| Sticky Note — Receive  | Sticky Note                | Explanation of Telegram trigger  | —                     | —                      | ## 📩 Receive Telegram Message Handle incoming text. Use chat.id + message_id for reply.                                                                         |
| Sticky Note — LLM Prompt1 | Sticky Note             | Setup instructions               | —                     | —                      | ## ⚙️ Setup 1. Telegram: create bot via @BotFather → add token in Credentials → Telegram API 2. Tavily: create API key → add Tavily account credentials 3. AIMLAPI: add AI/ML API credentials (base URL https://api.aimlapi.com/v1) 4. Environment: set TELEGRAM_BOT_TOKEN, TAVILY_API_KEY, AIML_API_KEY in n8n (if using env). |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure with your Telegram Bot API credentials (token from @BotFather).  
   - Set to listen for `message` updates only.  
   - Position as the workflow start node.

2. **Add Send a chat action Node**  
   - Type: Telegram (Send Chat Action)  
   - Credentials: same Telegram API credentials.  
   - Set `chatId` to `={{ $json.message.chat.id }}` from the Telegram Trigger.  
   - Set operation to `sendChatAction` (default sends "typing").  
   - Connect Telegram Trigger output to this node input.

3. **Add Search Node (Tavily API)**  
   - Type: Tavily API node (install `@tavily/n8n-nodes-tavily` if needed).  
   - Credentials: configure Tavily API key.  
   - Set query parameter to `={{ $('Telegram Trigger').item.json.message.text }}` to use the user's message text dynamically.  
   - Connect Send a chat action output to this node input.

4. **Add AI/ML Chat Completion Node (AIMLAPI)**  
   - Type: AIMLAPI Chat Completion node (install `n8n-nodes-aimlapi`).  
   - Credentials: configure AIMLAPI key.  
   - Set model to `openai/gpt-5-chat-latest`.  
   - Configure prompt with the following template (use expression mode):  
     ```
     You are an AI assistant.  
     You have search results from Google in JSON or text format.  
     Your task is:  
     1. Extract only the facts that directly answer the user’s question.  
     2. Provide a clear, concise answer in 3–4 sentences maximum.  
     3. If the information is limited, state that clearly.  
     4. Never make things up — base your answer only on the provided results.  
     
     User question: "{{ $json.query }}"  
     Search results:  
     {{ JSON.stringify($json.results) }}
     
     Generate the final answer in plain, simple English.
     ```  
   - Ensure inputs include `query` from Telegram message text and `results` from Tavily output. (Use a Set node if necessary to create this structure.)  
   - Connect Search node output to this node input.

5. **Add Send a text message Node (Telegram)**  
   - Type: Telegram (Send Message)  
   - Credentials: same Telegram API credentials.  
   - Set `text` to `={{ $json.content }}` from AI/ML Chat Completion output.  
   - Set `chatId` to `={{ $('Telegram Trigger').item.json.message.chat.id }}`.  
   - Set `reply_to_message_id` to `={{ $('Telegram Trigger').item.json.message.message_id }}` to reply inline.  
   - Connect AI/ML Chat Completion output to this node input.

6. **(Optional) Add Sticky Notes for Documentation**  
   - Add sticky notes describing overview, prompt guardrails, testing, customization, and node explanation as per original workflow for reference.

7. **Credential Setup Summary:**  
   - Telegram API: Bot token from @BotFather saved in n8n credentials.  
   - Tavily API: API key saved in n8n credentials.  
   - AIMLAPI: API key saved in n8n credentials with base URL `https://api.aimlapi.com/v1`.

8. **Testing:**  
   - Deploy the workflow.  
   - Test by sending questions to your Telegram bot.  
   - Verify the "typing" indicator appears, followed by a concise factual answer referencing web search results.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                        | Context or Link                                                                                          |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Workflow goal is to provide fast, factual answers without hallucinations by grounding responses in web search results.                                                             | Sticky Note — Overview                                                                                   |
| LLM prompt guardrails strictly limit output to facts found in search results, maximum 3–4 sentences, with clear statements if data is insufficient.                                | Sticky Note — LLM Prompt                                                                                 |
| Testing recommendations include running tests through Telegram interface, handling empty inputs and commands with Switch nodes, and providing fallback replies if no data found. | Sticky Note — Testing                                                                                     |
| Suggested customizations include command routing (/help, /sources), NSFW filtering, rate limiting per user, and caching recent answers with normalized queries.                     | Sticky Note — Customization                                                                              |
| Setup instructions: create Telegram bot with @BotFather, configure Tavily and AIMLAPI credentials, optionally use environment variables for keys.                                | Sticky Note — LLM Prompt1                                                                                 |
| Tavily API documentation and AIMLAPI usage details should be consulted for advanced options and error handling strategies.                                                        | See Tavily and AIMLAPI official docs (external to workflow)                                            |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.