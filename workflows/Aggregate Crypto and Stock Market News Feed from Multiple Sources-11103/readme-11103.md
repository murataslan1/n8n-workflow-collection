Aggregate Crypto and Stock Market News Feed from Multiple Sources

https://n8nworkflows.xyz/workflows/aggregate-crypto-and-stock-market-news-feed-from-multiple-sources-11103


# Aggregate Crypto and Stock Market News Feed from Multiple Sources

### 1. Workflow Overview

This n8n workflow titled **"Crypto/Stocks News Watcher"** aggregates and processes news related to cryptocurrencies and stock markets from multiple sources. It is designed for users who want to monitor these markets by collecting relevant news articles and social media posts, filtering them based on topic-specific keywords, deduplicating entries, and sending curated data to a backend system for further use such as UI display or analytics.

The workflow logically divides into the following blocks:

- **1.1 Triggers & Run Configuration:** Determines how and when the workflow runs, and initializes the topic (crypto or stocks) and platforms to fetch news from.
- **1.2 Fetch & Tag News from Sources:** Fetches news feeds from multiple RSS sources and social media, tagging each item with a topic.
- **1.3 Merge and Normalize Items:** Consolidates news items from all sources into a unified stream with standardized metadata.
- **1.4 Filter, Deduplicate & Build Payload:** Filters items by keywords, removes duplicates across runs, compiles them into a structured payload.
- **1.5 Send to Backend:** Sends the final curated news payload to a configured backend endpoint.

---

### 2. Block-by-Block Analysis

#### 1.1 Triggers & Run Configuration

**Overview:**  
This block controls the workflow start points—either scheduled intervals or external webhook triggers—and initializes run-time configurations such as the news topic and data sources.

**Nodes Involved:**  
- Schedule Trigger  
- Webhook  
- Merge  
- Init RunConfig  
- IF Gate - Coindesk  
- IF Gate - Google news  
- IF Gate - CoinTelegraph  
- IF Gate - X  

**Node Details:**

- **Schedule Trigger**  
  - *Type:* Schedule Trigger  
  - *Role:* Periodically starts the workflow every 30 minutes.  
  - *Config:* Interval set to 30-minute intervals.  
  - *Input:* None (start node).  
  - *Output:* Merges into the "Merge" node.  
  - *Edge Cases:* Workflow may fail if schedule misconfigured or if external dependencies fail downstream.

- **Webhook**  
  - *Type:* Webhook Trigger  
  - *Role:* Allows external POST requests to trigger the workflow with parameters.  
  - *Config:* POST method on path "run-workflow".  
  - *Input:* External HTTP requests.  
  - *Output:* Connected to "Merge" node.  
  - *Edge Cases:* Requires correct webhook setup and authentication if enabled.

- **Merge**  
  - *Type:* Merge  
  - *Role:* Combines inputs from Schedule Trigger and Webhook to unify the trigger flow.  
  - *Input:* Schedule Trigger & Webhook.  
  - *Output:* Connects to "Init RunConfig".  
  - *Edge Cases:* Ensures proper synchronization of trigger inputs.

- **Init RunConfig**  
  - *Type:* Code  
  - *Role:* Initializes runtime configuration including topic (crypto/stocks), platforms to fetch news from, and query presets for each platform.  
  - *Config:* Reads incoming JSON body or defaults; sets platforms to coindesk, google, cointelegraph, x by default; sets topic default "crypto".  
  - *Input:* Merged trigger input.  
  - *Output:* Branches to multiple IF Gate nodes.  
  - *Expressions:* Uses JavaScript to parse and default parameters.  
  - *Edge Cases:* Missing or malformed input defaults properly; platform list must be an array.

- **IF Gate - Coindesk / Google news / CoinTelegraph / X**  
  - *Type:* If  
  - *Role:* Conditional branching to decide which platforms to query based on Init RunConfig output.  
  - *Config:* Evaluates if topic/platform is included in the platform list.  
  - *Input:* Init RunConfig output.  
  - *Output:* Respective RSS Feed or processing nodes per platform.  
  - *Edge Cases:* Empty platform list or unsupported platforms skip fetching.

---

#### 1.2 Fetch & Tag News from Sources

**Overview:**  
This block fetches news items from each source's RSS feed or API, tagging each item with the topic for later filtering.

**Nodes Involved:**  
- RSS Read - Coindesk  
- RSS Read - Google news  
- RSS Read - CoinTelegraph  
- RSS Read - X Posts (via xcancel.com RSS)  
- Code - Tag topic - Coin desk  
- Code - Tag topic - Google news  
- Code - Tag topic - Coin telegraph  
- Code - Tag topic - X  
- Code - URL build - Google news  
- Code - URL Build - XCancel  
- Code - Reset X accumulator  
- Code - Accumulate X items  
- IF - More X batches?  
- X Batches  
- Loop back – X Batches  

**Node Details:**

- **RSS Read - Coindesk / Google news / CoinTelegraph**  
  - *Type:* RSS Feed Read  
  - *Role:* Fetches RSS feeds from respective URLs.  
  - *Config:* Static or dynamically built URLs for Google news and X posts; retries enabled for Google news & CoinTelegraph.  
  - *Input:* Conditional IF gates.  
  - *Output:* Flows to respective "Code - Tag topic" nodes.  
  - *Edge Cases:* Network issues, empty feeds, invalid URLs.

- **RSS Read - X Posts**  
  - *Type:* RSS Feed Read  
  - *Role:* Fetches X (Twitter) posts via xcancel.com RSS feed URLs generated dynamically.  
  - *Input:* Batches of URLs built by "Code - URL Build - XCancel".  
  - *Output:* Goes to "Code - Tag topic - X".  
  - *Edge Cases:* Rate limits, incomplete batches, API changes.

- **Code - Tag topic - [Source]**  
  - *Type:* Code  
  - *Role:* Adds a normalized "topic" field ("crypto" or "stocks") to each item based on run config or defaults.  
  - *Input:* RSS feed items.  
  - *Output:* Passes tagged items downstream for accumulation or source assignment.  
  - *Edge Cases:* Missing topic handled by defaulting; ensures uniform topic field.

- **Code - URL build - Google news**  
  - *Type:* Code  
  - *Role:* Builds the Google News RSS URL dynamically based on queries from Init RunConfig.  
  - *Output:* URL passed to "RSS Read - Google news".  
  - *Edge Cases:* Query construction errors or encoding issues.

- **Code - URL Build - XCancel**  
  - *Type:* Code  
  - *Role:* Constructs multiple batched RSS URLs for X posts with query terms tailored to the topic, splitting tickers and keywords to keep queries manageable.  
  - *Details:* Uses filters like minimum favorites and retweets; splits large query sets into batches; supports crypto and stocks topics.  
  - *Output:* Batch items with RSS URLs and metadata for splitting and looping.  
  - *Edge Cases:* Query length limits; batch size constraints.

- **Code - Reset X accumulator**  
  - *Type:* Code  
  - *Role:* Initializes or resets global static memory to accumulate X posts across batches.  
  - *Output:* Passes through to "X Batches".  
  - *Edge Cases:* Ensures fresh state per run.

- **Code - Accumulate X items**  
  - *Type:* Code  
  - *Role:* Appends current batch of X posts to global static memory; outputs control info about batches.  
  - *Output:* Controls looping via "IF - More X batches?".  
  - *Edge Cases:* Memory overflow mitigated by batch processing.

- **IF - More X batches?**  
  - *Type:* If  
  - *Role:* Decides if there are more batches of X posts to fetch; loops or finalizes accordingly.  
  - *Output:* Loops back to "X Batches" or proceeds to finalize.  
  - *Edge Cases:* Prevent infinite loops; batch count consistency.

- **X Batches**  
  - *Type:* Split In Batches  
  - *Role:* Splits X post queries into manageable batches for sequential processing.  
  - *Edge Cases:* Batch size tuning needed for performance.

- **Loop back – X Batches**  
  - *Type:* NoOp  
  - *Role:* Acts as a loop connector for batch processing of X posts.

- **Code - Finalize X batches (emit combined)**  
  - *Type:* Code  
  - *Role:* Emits accumulated X posts as a combined array to downstream nodes.  
  - *Output:* Connects to source assignment and merging.  
  - *Edge Cases:* Ensures full batch data emission.

---

#### 1.3 Merge and Normalize Items

**Overview:**  
This block assigns source metadata to each news item, merges all platform streams into a single unified dataset.

**Nodes Involved:**  
- Source set - Coindesk  
- Source set - Google news  
- Source set - Cointelegraph  
- Source set - X Posts  
- Merge - Coindesk + Google news  
- Merge - X posts + CoinTelegraph  
- Merge - Merge previous two merges  

**Node Details:**

- **Source set - [Source]**  
  - *Type:* Set  
  - *Role:* Adds metadata fields such as "source" (e.g., "CoinDesk"), "kind" (e.g., "Article / News" or "Tweet"), and "topic" to each item.  
  - *Input:* Tagged items from respective sources.  
  - *Output:* Passes normalized items to merge nodes.  
  - *Edge Cases:* Missing input fields handled by preserving other fields.

- **Merge Nodes**  
  - *Type:* Merge  
  - *Role:* Combines items from multiple sources stepwise to form a single stream:  
    - Merge Coindesk + Google news  
    - Merge X posts + CoinTelegraph  
    - Final merge of previous two merges into one stream for filtering  
  - *Output:* Connects to the keyword filter node.  
  - *Edge Cases:* Ensures no data loss or duplication during merges.

---

#### 1.4 Filter, Deduplicate & Build Payload

**Overview:**  
Filters news items based on keyword matching, removes duplicates across runs, and compiles the filtered items into a structured JSON payload.

**Nodes Involved:**  
- Code - Keywords Filter  
- Code - Array bind  

**Node Details:**

- **Code - Keywords Filter**  
  - *Type:* Code  
  - *Role:* Performs the core logic of filtering and deduplicating news items using keyword lists tuned to either crypto or stocks topics.  
  - *Features:*  
    - Keyword lists for crypto and stocks topics.  
    - Drop list for unwanted spam/giveaway content.  
    - Deduplication across runs using static workflow memory.  
    - Extraction of metadata such as matched keywords, normalized URLs, publication dates, media images.  
  - *Input:* Merged unified news stream.  
  - *Output:* Filtered and enriched items to "Code - Array bind".  
  - *Edge Cases:* Handles missing fields, malformed data, empty or duplicated items.

- **Code - Array bind**  
  - *Type:* Code  
  - *Role:* Binds all filtered items into a single JSON object structured as `{ topic, items: [...] }` for easy downstream consumption.  
  - *Output:* Connects to the HTTP request node for sending data.  
  - *Edge Cases:* Ensures topic field consistency.

---

#### 1.5 Send to Backend

**Overview:**  
Sends the curated, filtered news payload to a backend endpoint for storage, UI display, or other processing.

**Nodes Involved:**  
- HTTP Request - Send to your backend  

**Node Details:**

- **HTTP Request - Send to your backend**  
  - *Type:* HTTP Request  
  - *Role:* Sends HTTP POST request with JSON payload containing news items to a specified backend URL.  
  - *Config:*  
    - URL: `https://your-backend.example.com/api/hooks/news` (to be customized).  
    - Headers: Content-Type `application/json`, optional `x-webhook-secret` for authentication.  
    - Body: JSON object with `items` array from previous node.  
  - *Input:* Output of "Code - Array bind".  
  - *Output:* None (end of workflow).  
  - *Edge Cases:* Network errors, authentication failures, backend response errors.

---

### 3. Summary Table

| Node Name                        | Node Type              | Functional Role                                   | Input Node(s)                                  | Output Node(s)                                 | Sticky Note                                                                                              |
|---------------------------------|------------------------|-------------------------------------------------|-----------------------------------------------|-----------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Schedule Trigger                | Schedule Trigger       | Periodic trigger to start workflow               | None                                          | Merge                                         | See sticky note: "Section 1 – Triggers & Run Config"                                                    |
| Webhook                        | Webhook                | External HTTP POST trigger                        | None                                          | Merge                                         | See sticky note: "Section 1 – Triggers & Run Config"                                                    |
| Merge                         | Merge                  | Merges schedule and webhook triggers             | Schedule Trigger, Webhook                      | Init RunConfig                                |                                                                                                        |
| Init RunConfig                 | Code                   | Initializes topic, platforms, and query presets  | Merge                                         | IF Gate - Coindesk, IF Gate - Google news, IF Gate - CoinTelegraph, IF Gate - X | See sticky note: "CONFIG: Edit these places only for 90% of use cases"                                  |
| IF Gate - Coindesk             | If                     | Checks if Coindesk platform is enabled            | Init RunConfig                                | RSS Read - Coindesk                           |                                                                                                        |
| RSS Read - Coindesk            | RSS Feed Read          | Reads CoinDesk RSS feed                            | IF Gate - Coindesk                            | Code - Tag topic - Coin desk                   | See sticky note: "Section 2 – Fetch & Tag News from Sources"                                           |
| Code - Tag topic - Coin desk   | Code                   | Tags items with topic (crypto/stocks)             | RSS Read - Coindesk                           | Source set - Coindesk                         |                                                                                                        |
| Source set - Coindesk          | Set                    | Adds source and kind metadata                      | Code - Tag topic - Coin desk                   | Merge - Coindesk + Google news                | See sticky note: "Section 3 - Merge and normalize All Items"                                           |
| IF Gate - Google news          | If                     | Checks if Google news platform is enabled          | Init RunConfig                                | Code - URL build - Google news                |                                                                                                        |
| Code - URL build - Google news | Code                   | Builds Google News RSS URL                         | IF Gate - Google news                         | RSS Read - Google news                         |                                                                                                        |
| RSS Read - Google news         | RSS Feed Read          | Reads Google News RSS feed                         | Code - URL build - Google news                | Code - Tag topic - Google news                 | See sticky note: "Section 2 – Fetch & Tag News from Sources"                                           |
| Code - Tag topic - Google news | Code                   | Tags items with topic                              | RSS Read - Google news                        | Source set - Google news                       |                                                                                                        |
| Source set - Google news       | Set                    | Adds source and kind metadata                      | Code - Tag topic - Google news                 | Merge - Coindesk + Google news                |                                                                                                        |
| Merge - Coindesk + Google news | Merge                  | Merges CoinDesk and Google News items             | Source set - Coindesk, Source set - Google news | Merge - Merge previous two merges              |                                                                                                        |
| IF Gate - CoinTelegraph        | If                     | Checks if CoinTelegraph platform is enabled        | Init RunConfig                                | RSS Read - CoinTelegraph                       |                                                                                                        |
| RSS Read - CoinTelegraph       | RSS Feed Read          | Reads CoinTelegraph RSS feed                       | IF Gate - CoinTelegraph                       | Code - Tag topic - Coin telegraph              | See sticky note: "Section 2 – Fetch & Tag News from Sources"                                           |
| Code - Tag topic - Coin telegraph | Code                | Tags items with topic                              | RSS Read - CoinTelegraph                      | Source set - Cointelegraph                     |                                                                                                        |
| Source set - Cointelegraph     | Set                    | Adds source and kind metadata                      | Code - Tag topic - Coin telegraph              | Merge - X posts + CoinTelegraph                |                                                                                                        |
| IF Gate - X                   | If                     | Checks if X (Twitter) platform is enabled           | Init RunConfig                                | Code - URL Build - XCancel                     |                                                                                                        |
| Code - URL Build - XCancel     | Code                   | Builds batched RSS URLs for X posts               | IF Gate - X                                   | Code - Reset X accumulator                     |                                                                                                        |
| Code - Reset X accumulator     | Code                   | Resets accumulator for X posts                     | Code - URL Build - XCancel                    | X Batches                                     |                                                                                                        |
| X Batches                     | Split In Batches       | Splits X posts queries into batches                | Code - Reset X accumulator                    | RSS Read - X Posts, Loop back – X Batches     |                                                                                                        |
| RSS Read - X Posts             | RSS Feed Read          | Reads batched X posts RSS feeds                    | X Batches                                     | Code - Tag topic - X                           |                                                                                                        |
| Code - Tag topic - X           | Code                   | Tags X posts with topic                            | RSS Read - X Posts                            | Code - Accumulate X items                      |                                                                                                        |
| Code - Accumulate X items      | Code                   | Accumulates X posts across batches                 | Code - Tag topic - X                          | IF - More X batches?                           |                                                                                                        |
| IF - More X batches?           | If                     | Checks if more X batches remain                     | Code - Accumulate X items                     | X Batches (loop), Code - Finalize X batches   |                                                                                                        |
| Code - Finalize X batches      | Code                   | Emits combined X posts after all batches fetched  | IF - More X batches?                          | Source set - X Posts                           |                                                                                                        |
| Source set - X Posts           | Set                    | Adds source and kind metadata                      | Code - Finalize X batches                      | Merge - X posts + CoinTelegraph                |                                                                                                        |
| Merge - X posts + CoinTelegraph| Merge                  | Merges X posts and CoinTelegraph items             | Source set - X Posts, Source set - Cointelegraph | Merge - Merge previous two merges              |                                                                                                        |
| Merge - Merge previous two merges | Merge               | Merges news from all sources into one stream      | Merge - Coindesk + Google news, Merge - X posts + CoinTelegraph | Code - Keywords Filter                        | See sticky note: "Section 4 – Filter, Deduplicate & Build Payload → Send to Backend"                   |
| Code - Keywords Filter         | Code                   | Filters and deduplicates items by topic keywords  | Merge - Merge previous two merges             | Code - Array bind                             |                                                                                                        |
| Code - Array bind              | Code                   | Bundles filtered items into payload object         | Code - Keywords Filter                         | HTTP Request - Send to your backend           | See sticky note: "README – Crypto/Stocks News → UI workflow"                                          |
| HTTP Request - Send to your backend | HTTP Request       | Sends final news payload to backend API            | Code - Array bind                              | None                                          | See sticky note: "README – Crypto/Stocks News → UI workflow"                                          |
| Loop back – X Batches          | NoOp                   | Loop connector for X batch processing               | RSS Read - X Posts                            | X Batches                                     |                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**

   - **Schedule Trigger:**  
     - Type: Schedule Trigger  
     - Set interval to every 30 minutes.

   - **Webhook:**  
     - Type: Webhook  
     - HTTP Method: POST  
     - Path: "run-workflow"  
     - No authentication or set up HTTP Header Auth as needed for your use case.

2. **Merge Trigger Inputs:**

   - Add a **Merge** node to combine the Schedule Trigger and Webhook outputs.

3. **Add Run Configuration Node:**

   - Add a **Code** node named "Init RunConfig" with JavaScript to:  
     - Parse incoming JSON body or input for `topic` and `platforms`.  
     - Default `topic` to "crypto".  
     - Default `platforms` to `['coindesk','google','cointelegraph','x']`.  
     - Define query presets for Google and X platforms based on topic.

4. **Add IF Gates for Each Platform:**

   - Add four **If** nodes named for each platform (Coindesk, Google news, CoinTelegraph, X).  
   - Each checks if its platform is enabled in the `platforms` array and if the `topic` matches where applicable.

5. **Add RSS Feed Read Nodes for Each Source:**

   - **RSS Read - Coindesk:** URL: `https://www.coindesk.com/arc/outboundfeeds/rss/`  
   - **RSS Read - Google news:** URL built dynamically via a Code node (see next step).  
   - **RSS Read - CoinTelegraph:** URL: `https://cointelegraph.com/rss`  
   - **RSS Read - X Posts:** URLs built dynamically in batches (see below).

6. **Build URLs for Google News and X:**

   - **Code - URL build - Google news:**  
     - Build Google News RSS search URL with query from Init RunConfig.

   - **Code - URL Build - XCancel:**  
     - Build multiple batched RSS URLs for X posts using tickers and keywords.  
     - Split queries into manageable batches.  
     - Annotate batches with index metadata.

7. **Add Batch Processing and Accumulation for X Posts:**

   - **Code - Reset X accumulator:** Clears static memory for batches.  
   - **Split In Batches (X Batches):** Splits X queries into batches.  
   - **RSS Read - X Posts:** Reads each batch RSS feed.  
   - **Code - Tag topic - X:** Tags each X post with topic.  
   - **Code - Accumulate X items:** Appends batch items to memory.  
   - **If - More X batches?:** Loops back if more batches remain, else finalizes.  
   - **Code - Finalize X batches:** Emits all accumulated X posts as a combined array.  
   - **Loop back – X Batches:** NoOp node to facilitate looping.

8. **Add Code Nodes to Tag Topic for Other Sources:**

   - Add **Code - Tag topic - Coin desk**, **Code - Tag topic - Google news**, **Code - Tag topic - Coin telegraph** nodes immediately after their respective RSS Read nodes.

9. **Add Set Nodes to Assign Source Metadata:**

   - For each source, add a **Set** node assigning:  
     - `source` (e.g., "CoinDesk")  
     - `kind` (e.g., "Article / News" or "Tweet")  
     - `topic` (passed along from tagging nodes)  
     - Include all other existing fields.

10. **Merge Sources Stepwise:**

    - Merge Coindesk + Google news outputs.  
    - Merge X posts + CoinTelegraph outputs.  
    - Merge the two merged streams into a single flow.

11. **Add Code Node for Keyword Filtering and Deduplication:**

    - Add **Code - Keywords Filter** node with JavaScript implementing:  
      - Keyword lists for crypto and stocks filtering.  
      - Drop list for spam/giveaway detection.  
      - Deduplication logic using static workflow memory.  
      - Metadata extraction (matched keywords, canonical URL, images, etc.).

12. **Add Code Node to Bind Array:**

    - Add **Code - Array bind** node that bundles filtered items into a JSON object `{ topic, items }`.

13. **Add HTTP Request Node to Send Data:**

    - Add **HTTP Request - Send to your backend** node:  
      - Method: POST  
      - URL: set to your backend API endpoint.  
      - Headers: `Content-Type: application/json` and optionally `x-webhook-secret`.  
      - Body: JSON with the `items` array from previous node.

14. **Connect the Nodes:**

    - Connect triggers to Merge → Init RunConfig → IF Gates → RSS Reads → Tag topic codes → Source set nodes → Merges → Keywords Filter → Array bind → HTTP Request.

15. **Configure Credentials:**

    - No external credentials explicitly required unless webhook authentication or HTTP Request requires it.

16. **Test and Validate:**

    - Run manual tests via webhook or wait for scheduled trigger.  
    - Validate outputs and adjust keyword lists or platform selections as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                              | Context or Link                                                                                           |
|---------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| README – Crypto/Stocks News → UI workflow: Explains workflow purpose, usage, and customization points.                     | Sticky Note node attached near HTTP Request node.                                                       |
| Configuration points for most use cases: Init RunConfig, URL build nodes, Keywords Filter lists, HTTP Request URL/headers. | Sticky Note near Init RunConfig and related config nodes.                                               |
| Sections clearly marked in sticky notes: Section 1 (Triggers), Section 2 (Fetch & Tag), Section 3 (Merge), Section 4 (Filter). | Multiple sticky notes distributed across the workflow layout.                                           |
| Workflow uses static workflow memory for deduplication across runs to avoid duplicate news items.                          | Code - Keywords Filter node.                                                                             |
| X (Twitter) RSS feed is fetched in batches due to query complexity and API limits using xcancel.com as RSS provider.       | Code - URL Build - XCancel and batch processing nodes.                                                  |
| To customize keyword filtering, modify the lists inside "Code - Keywords Filter" node.                                     | Code node with JavaScript for keyword matching and drop terms.                                          |
| To change backend endpoint, update URL and headers in "HTTP Request - Send to your backend".                               | HTTP Request node.                                                                                       |
| The workflow supports both scheduled and webhook-triggered executions for flexible integration.                           | Trigger nodes and Merge node.                                                                            |
| For local testing, webhook authentication can be disabled or a dummy header configured.                                    | Webhook and HTTP Request node configurations.                                                           |

---

This comprehensive documentation enables advanced users and automation agents to fully understand, reproduce, and customize the "Crypto/Stocks News Watcher" workflow. It outlines the logical blocks, node configurations, data flow, and key operational details.