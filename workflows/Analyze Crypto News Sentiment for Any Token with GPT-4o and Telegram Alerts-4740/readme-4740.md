Analyze Crypto News Sentiment for Any Token with GPT-4o and Telegram Alerts

https://n8nworkflows.xyz/workflows/analyze-crypto-news-sentiment-for-any-token-with-gpt-4o-and-telegram-alerts-4740


# Analyze Crypto News Sentiment for Any Token with GPT-4o and Telegram Alerts

---

# Analyze Crypto News Sentiment for Any Token with GPT-4o and Telegram Alerts  
**Workflow Name:** Binance SM News and Sentiment Analyst Webhook Tool

---

### 1. Workflow Overview

This workflow is designed to analyze the sentiment of cryptocurrency news articles related to any specified token symbol and deliver a summarized sentiment report formatted for Telegram. It serves users or automated agents who want quick, AI-driven insights into current market sentiment and relevant news headlines for a given cryptocurrency.

The workflow logically breaks down into the following functional blocks:

- **1.1 Webhook Input Reception:** Accepts HTTP POST requests containing the cryptocurrency symbol to analyze.
- **1.2 Keyword Extraction AI Agent:** Uses an AI agent to extract a single-word keyword (the token symbol) from the input message.
- **1.3 Crypto News Aggregation:** Pulls recent news articles from multiple major crypto RSS feeds.
- **1.4 News Merging and Filtering:** Combines all news articles and filters them based on the extracted token keyword to retain relevant news only.
- **1.5 Prompt Construction for GPT-4o:** Builds a natural-language prompt encapsulating filtered news titles and links for AI summarization.
- **1.6 Sentiment and News Summary via GPT-4o:** Runs the prompt through OpenAI GPT-4o to generate a concise summary, market sentiment, and reference links.
- **1.7 Telegram Message Preparation:** Formats the AI output into a Telegram-friendly message payload.
- **1.8 Response Delivery:** Sends the final formatted message back as a response to the original webhook caller.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Webhook Input Reception

- **Overview:**  
  This block receives incoming HTTP POST requests carrying the cryptocurrency token symbol to analyze. It triggers the entire workflow.

- **Nodes Involved:**  
  - `Webhook`

- **Node Details:**  
  - **Webhook**  
    - Type: HTTP Webhook Trigger  
    - Configuration: Listens for POST requests at a unique webhook path with no authentication.  
    - Input: Expects JSON body with structure `{ "message": "<token_symbol>" }`.  
    - Output: Passes the request JSON to the next node.  
    - Edge Cases: Missing or malformed JSON, empty or invalid token symbol could disrupt downstream logic.  
    - Sticky Note Content:  
      > Accepts incoming HTTP POST requests. Expected body format: `{ "message": "<symbol>" }`. Kicks off full news + sentiment analysis.

---

#### 2.2 Keyword Extraction AI Agent

- **Overview:**  
  Uses a GPT-powered agent to parse the incoming message and extract a single-word cryptocurrency keyword, ensuring accurate token identification.

- **Nodes Involved:**  
  - `Crypto News & Sentiment Agent`  
  - `OpenAI Chat Model` (used internally by the agent)  
  - `Set Query`

- **Node Details:**  
  - **Crypto News & Sentiment Agent**  
    - Type: AI Agent Node (LangChain Agent)  
    - Configuration: Receives the message text and uses a system prompt instructing it to extract a single crypto keyword.  
    - Input: JSON path `body.message` from the webhook.  
    - Output: Returns the extracted keyword as a single word in `.output`.  
    - Edge Cases: Ambiguous or slang inputs may cause extraction errors or irrelevant keywords.  
    - Sticky Note Content:  
      > Extract Keyword: Parses user input and returns a single cryptocurrency keyword.

  - **OpenAI Chat Model**  
    - Type: AI Language Model (LangChain OpenAI Chat)  
    - Configuration: Model set to `gpt-4o-mini` for efficient keyword extraction.  
    - Input/Output: Used internally by the agent node, no direct external connections.  
    - Credentials: Requires valid OpenAI API key.  
    - Edge Cases: API rate limits or failures impact keyword extraction.

  - **Set Query**  
    - Type: Set Node  
    - Configuration: Assigns the extracted keyword from agent output into a variable named `query` for filtering.  
    - Input: Output of `Crypto News & Sentiment Agent`.  
    - Output: Passes `query` downstream.  
    - Edge Cases: If keyword extraction fails, `query` may be empty or invalid.

---

#### 2.3 Crypto News Aggregation

- **Overview:**  
  Collects the latest cryptocurrency news articles from nine major crypto news RSS feeds.

- **Nodes Involved:**  
  - `RSS Cointelegraph`  
  - `RSS Bitcoinmagazine`  
  - `RSS Coindesk`  
  - `RSS Bitcoinist`  
  - `RSS Newsbtc`  
  - `RSS Cryptopotato`  
  - `RSS 99bitcoins`  
  - `RSS Cryptobriefing`  
  - `RSS Crypto.news`

- **Node Details (Representative for each RSS node):**  
  - Type: RSS Feed Read  
  - Configuration: URL set to respective RSS feed URL for each source.  
  - Input: Triggered by `Set Query` node (runs after keyword is set).  
  - Output: Emits an array of news articles with fields like `title`, `link`, `contentSnippet`, `description`, and `content`.  
  - Edge Cases: Feed downtime, malformed RSS, or network issues may cause empty or failed fetches. No authentication needed.  
  - Sticky Note Content (covering all RSS nodes):  
    > News Aggregators: Pulls articles from major crypto news sources. You can add more RSS feeds here to expand coverage.

---

#### 2.4 News Merging and Filtering

- **Overview:**  
  Merges all incoming articles from all RSS feeds into a single stream, then filters articles to only those mentioning the specified token keyword.

- **Nodes Involved:**  
  - `Merge All Articles`  
  - `Filter by Query`

- **Node Details:**  
  - **Merge All Articles**  
    - Type: Merge Node  
    - Configuration: Set to combine 10 inputs (all RSS feeds) into a single unified list.  
    - Input: All RSS feed nodes.  
    - Output: Passes combined article list downstream.  
    - Edge Cases: If any RSS feed fails, may have fewer inputs; merge still proceeds.

  - **Filter by Query**  
    - Type: Code Node (JavaScript)  
    - Configuration: Filters merged articles by checking if the token keyword (lowercased) appears in title, snippet, description, or full content fields.  
    - Input: Combined articles from merge node, plus `query` variable from `Set Query`.  
    - Output: Only articles relevant to the token keyword proceed.  
    - Edge Cases: Articles without textual content fields may be skipped; keyword case sensitivity handled.  
    - Sticky Note Content:  
      > Merge & Filter News: Combines all RSS articles and filters them using the extracted keyword to match only relevant results.

---

#### 2.5 Prompt Construction for GPT-4o

- **Overview:**  
  Builds a detailed natural-language prompt containing filtered article titles and links, instructing GPT-4o to summarize news and sentiment.

- **Nodes Involved:**  
  - `Build Prompt`

- **Node Details:**  
  - Type: Code Node (JavaScript)  
  - Configuration:  
    - Takes filtered articles and the token keyword.  
    - Creates a bullet list of article titles with links.  
    - Constructs a prompt requesting a summary divided into three parts: news summary, market sentiment, and article references.  
  - Input: Filtered articles and `query`.  
  - Output: JSON with a `prompt` property containing the full AI prompt string.  
  - Edge Cases: If no articles remain after filtering, prompt will list zero articles—may cause weak AI responses.  
  - Sticky Note Content:  
    > Prepare AI Prompt: Constructs the input prompt for GPT-4o with a list of filtered articles. Output includes summary, sentiment, and article links.

---

#### 2.6 Sentiment and News Summary via GPT-4o

- **Overview:**  
  Sends the constructed prompt to OpenAI GPT-4o to generate a concise summary of the news, analyze market sentiment, and provide links to reference articles.

- **Nodes Involved:**  
  - `Summarize News & Sentiment (GPT-4o)`

- **Node Details:**  
  - Type: OpenAI Node (LangChain OpenAI)  
  - Configuration:  
    - Model set to `gpt-4o` for high-quality summarization.  
    - Sends prompt from `Build Prompt` node as input message content.  
    - Adds assistant role context reinforcing analysis task.  
  - Input: Prompt JSON.  
  - Output: AI-generated structured text with summary, sentiment, and links.  
  - Credentials: Requires valid OpenAI API key.  
  - Edge Cases: API failures, rate limits, or prompt size limitations may disrupt generation.  
  - Sticky Note Content:  
    > Summarize News & Sentiment (GPT-4o): Uses OpenAI GPT-4o to generate a concise summary of the news, analyze market sentiment, and return formatted results.

---

#### 2.7 Telegram Message Preparation

- **Overview:**  
  Extracts the AI-generated message content and formats it into a clean, Telegram-readable string.

- **Nodes Involved:**  
  - `Prepare Telegram Message`

- **Node Details:**  
  - Type: Set Node  
  - Configuration:  
    - Assigns the AI output message content to a `summary` field.  
    - Can be altered to include other data if needed.  
  - Input: Output from GPT node.  
  - Output: Prepared message JSON ready for transmission.  
  - Edge Cases: If AI output is empty or malformed, message may be blank or inaccurate.  
  - Sticky Note Content:  
    > Format for Telegram: Extracts the AI summary and prepares it for Telegram delivery. Change the variable if you want to include other data.

---

#### 2.8 Response Delivery

- **Overview:**  
  Sends the final formatted summary message back as a response to the original webhook caller.

- **Nodes Involved:**  
  - `Respond to Webhook`

- **Node Details:**  
  - Type: Respond to Webhook Node  
  - Configuration: Configured to respond with all incoming items, effectively returning the formatted Telegram message to the caller.  
  - Input: Output from message preparation node.  
  - Output: HTTP response to the webhook request.  
  - Edge Cases: Network failures or timeouts may cause response failure.  
  - Sticky Note Content:  
    > Return Results to Caller: Sends the final formatted message back to the parent workflow that triggered the call.

---

### 3. Summary Table

| Node Name                      | Node Type                          | Functional Role                             | Input Node(s)                            | Output Node(s)                          | Sticky Note                                                                                                    |
|--------------------------------|----------------------------------|---------------------------------------------|-----------------------------------------|----------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Webhook                        | HTTP Webhook                     | Trigger workflow on HTTP POST with token    | —                                       | Crypto News & Sentiment Agent          | Accepts incoming HTTP POST requests. Expected body format: `{ "message": "<symbol>" }`. Kicks off full news + sentiment analysis. |
| Crypto News & Sentiment Agent  | LangChain AI Agent               | Extract single-word crypto keyword          | Webhook, OpenAI Chat Model               | Set Query                              | Extract Keyword: Parses user input and returns a single cryptocurrency keyword.                              |
| OpenAI Chat Model              | LangChain OpenAI Chat Model      | Supports AI agent for keyword extraction    | — (used internally by agent)             | Crypto News & Sentiment Agent          |                                                                                                              |
| Set Query                     | Set                            | Store extracted keyword for filtering       | Crypto News & Sentiment Agent            | All RSS Feed Nodes                     |                                                                                                              |
| RSS Cointelegraph             | RSS Feed Read                   | Fetch news from Cointelegraph RSS            | Set Query                               | Merge All Articles                     | News Aggregators: Pulls articles from major crypto news sources. You can add more RSS feeds here to expand coverage. |
| RSS Bitcoinmagazine           | RSS Feed Read                   | Fetch news from Bitcoinmagazine RSS          | Set Query                               | Merge All Articles                     |                                                                                                              |
| RSS Coindesk                 | RSS Feed Read                   | Fetch news from Coindesk RSS                  | Set Query                               | Merge All Articles                     |                                                                                                              |
| RSS Bitcoinist               | RSS Feed Read                   | Fetch news from Bitcoinist RSS                | Set Query                               | Merge All Articles                     |                                                                                                              |
| RSS Newsbtc                  | RSS Feed Read                   | Fetch news from Newsbtc RSS                   | Set Query                               | Merge All Articles                     |                                                                                                              |
| RSS Cryptopotato             | RSS Feed Read                   | Fetch news from Cryptopotato RSS              | Set Query                               | Merge All Articles                     |                                                                                                              |
| RSS 99bitcoins              | RSS Feed Read                   | Fetch news from 99bitcoins RSS               | Set Query                               | Merge All Articles                     |                                                                                                              |
| RSS Cryptobriefing          | RSS Feed Read                   | Fetch news from Cryptobriefing RSS            | Set Query                               | Merge All Articles                     |                                                                                                              |
| RSS Crypto.news             | RSS Feed Read                   | Fetch news from Crypto.news RSS               | Set Query                               | Merge All Articles                     |                                                                                                              |
| Merge All Articles           | Merge                          | Combine all RSS feed articles                 | RSS Cointelegraph, ..., RSS Crypto.news | Filter by Query                       | Merge & Filter News: Combines all RSS articles and filters them using the extracted keyword to match only relevant results. |
| Filter by Query              | Code (JavaScript)              | Filter merged articles by token keyword      | Merge All Articles, Set Query            | Build Prompt                         |                                                                                                              |
| Build Prompt                | Code (JavaScript)              | Construct GPT-4o prompt with filtered news   | Filter by Query                         | Summarize News & Sentiment (GPT-4o) | Prepare AI Prompt: Constructs the input prompt for GPT-4o with a list of filtered articles. Output includes summary, sentiment, and article links. |
| Summarize News & Sentiment (GPT-4o) | OpenAI (LangChain)           | Generate news summary and sentiment analysis | Build Prompt                           | Prepare Telegram Message             | Summarize News & Sentiment (GPT-4o): Uses OpenAI GPT-4o to generate a concise summary of the news, analyze market sentiment, and return formatted results. |
| Prepare Telegram Message    | Set                            | Format AI output for Telegram messaging       | Summarize News & Sentiment (GPT-4o)     | Respond to Webhook                   | Format for Telegram: Extracts the AI summary and prepares it for Telegram delivery. Change the variable if you want to include other data. |
| Respond to Webhook          | Respond to Webhook             | Return final formatted message to caller      | Prepare Telegram Message                 | —                                    | Return Results to Caller: Sends the final formatted message back to the parent workflow that triggered the call. |

---

### 4. Reproducing the Workflow from Scratch

Follow these steps to manually rebuild the workflow in n8n:

1. **Create Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Use a unique path (e.g., `a41af97d-6bd6-44d2-b79e-dca6df1e6e7e`)  
   - No authentication required  
   - Purpose: Accept JSON input with structure `{ "message": "<token_symbol>" }`.

2. **Create Crypto News & Sentiment Agent Node**  
   - Type: LangChain AI Agent  
   - Parameters:  
     - Input Text: `{{$json.body.message}}` (from webhook)  
     - System Message: "Your job is to analyze the keyword of the question and output it as a single word. The keyword will always be the name of a cryptocurrency."  
     - Prompt Type: "define"  
   - Connect Webhook output to this node.

3. **Create OpenAI Chat Model Node (for Agent)**  
   - Type: LangChain OpenAI Chat  
   - Model: `gpt-4o-mini` (efficient for keyword extraction)  
   - Credentials: Configure with your OpenAI API key  
   - Connect this node as the AI language model for the agent node.

4. **Create Set Query Node**  
   - Type: Set  
   - Purpose: Assign `query` variable with the keyword extracted from agent output:  
     - Expression: `={{ $json.output }}`  
   - Connect Crypto News & Sentiment Agent output to this node.

5. **Create Nine RSS Feed Read Nodes**  
   - Type: RSS Feed Read  
   - URLs:  
     - Cointelegraph: `https://cointelegraph.com/rss`  
     - Bitcoinmagazine: `https://bitcoinmagazine.com/.rss/full/`  
     - Coindesk: `https://www.coindesk.com/arc/outboundfeeds/rss/`  
     - Bitcoinist: `https://bitcoinist.com/feed/`  
     - Newsbtc: `https://www.newsbtc.com/feed/`  
     - Cryptopotato: `https://cryptopotato.com/feed/`  
     - 99bitcoins: `https://99bitcoins.com/feed/`  
     - Cryptobriefing: `https://cryptobriefing.com/feed/`  
     - Crypto.news: `https://crypto.news/feed/`  
   - Connect Set Query node output to each RSS node input (parallel triggers).

6. **Create Merge All Articles Node**  
   - Type: Merge  
   - Configuration: Number of inputs = 10 (all RSS feed nodes)  
   - Connect outputs of all RSS feed nodes to this merge node.

7. **Create Filter by Query Node (Code)**  
   - Type: Code  
   - JavaScript code to filter articles by keyword:  
     ```js
     const term = $node["Set Query"].json.query.toLowerCase();
     return items.filter(item => {
       const j = item.json;
       const title = (j.title || "").toLowerCase();
       const snippet = (j.contentSnippet || j.description || "").toLowerCase();
       const fullContent = (j.content || "").toLowerCase();
       return title.includes(term) || snippet.includes(term) || fullContent.includes(term);
     });
     ```
   - Connect Merge All Articles output to this node.

8. **Create Build Prompt Node (Code)**  
   - Type: Code  
   - JavaScript code to create prompt for GPT-4o:  
     ```js
     const q = $node["Set Query"].json.query;
     const list = items
       .map(i => `- ${i.json.title} (${i.json.link})`)
       .join("\n");
     const prompt = `
     You are a crypto-industry news analyst.
     Summarize current news and market sentiment for **${q}** based on these articles:
     ${list}
     
     Answer in 3 parts:
     1. Summary of News
     2. Market Sentiment
     3. Links to reference news articles
     `;
     return [{ json: { prompt } }];
     ```
   - Connect Filter by Query output to this node.

9. **Create Summarize News & Sentiment (GPT-4o) Node**  
   - Type: LangChain OpenAI  
   - Model: `gpt-4o`  
   - Messages:  
     - Content: `={{ $node["Build Prompt"].json.prompt }}`  
     - Assistant Role Message: "You are a crypto‐industry news analyst. Summarize sentiment clearly and concisely."  
   - Credentials: Use the same OpenAI API key.  
   - Connect Build Prompt output to this node.

10. **Create Prepare Telegram Message Node (Set)**  
    - Type: Set  
    - Assign a field `summary` with value: `={{ $json.message.content }}` (output from GPT node)  
    - Connect Summarize News & Sentiment output to this node.

11. **Create Respond to Webhook Node**  
    - Type: Respond to Webhook  
    - Respond With: All incoming items (to send back the final message)  
    - Connect Prepare Telegram Message output to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                               | Context or Link                                             |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| A sentiment intelligence sub-agent that aggregates crypto news from top-tier RSS feeds, filters it based on a given token, and generates a market sentiment summary + headline list formatted for Telegram.                                                                                                                                                                                   | Workflow purpose summary                                     |
| Webhook Input expects a JSON POST with `{ "message": "ETH" }` to trigger analysis.                                                                                                                                                                                                                                                                                                         | Webhook input format                                        |
| Sample output format includes a sentiment flag followed by bullet points of relevant headlines and their sources, e.g.: `📣 ETH Sentiment: Neutral` followed by news items.                                                                                                                                                                                                                  | Output formatting example                                   |
| Use cases include daily sentiment summaries, enhancing technical analysis with emotional context, and instant Telegram bot responses on demand.                                                                                                                                                                                                                                          | Use cases overview                                          |
| Installation instructions: Import the workflow JSON into n8n, enable the webhook, set OpenAI API credentials, and connect to parent workflows or external callers via HTTP request nodes.                                                                                                                                                                                                  | Installation and integration guidelines                     |
| Requires a valid OpenAI API key with access to GPT-4o and GPT-4o-mini models. No authentication needed for RSS sources.                                                                                                                                                                                                                                                                    | Credential requirements                                    |
| Workflow and components are copyrighted by Treasurium Capital Limited Company, with author Don Jayamaha (LinkedIn: http://linkedin.com/in/donjayamahajr). Unauthorized use is prohibited.                                                                                                                                                                                                   | Licensing & support information                             |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, complying strictly with content policies. It contains no illegal, offensive, or protected material. All data handled is legal and public.

---