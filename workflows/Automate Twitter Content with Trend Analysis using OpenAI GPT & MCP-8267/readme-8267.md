Automate Twitter Content with Trend Analysis using OpenAI GPT & MCP

https://n8nworkflows.xyz/workflows/automate-twitter-content-with-trend-analysis-using-openai-gpt---mcp-8267


# Automate Twitter Content with Trend Analysis using OpenAI GPT & MCP

---

## 1. Workflow Overview

The **"Automate Twitter Content with Trend Analysis using OpenAI GPT & MCP"** workflow is designed to automatically identify trending Twitter topics within the United States, generate concise and brand-safe summaries explaining why these topics are trending, and then publish summarized tweets while managing publishing cadence and data persistence.

The workflow targets use cases such as social media content automation, brand monitoring, and trend-driven marketing communications. It leverages Twitter trend data, OpenAI GPT models, and an MCP (Multi-Channel Processing) server to perform AI-powered analysis and synthesis.

The workflow is logically divided into these main blocks:

- **1.1 Scheduled Trigger & Recent Keywords Exclusion**: Periodic start with database query to exclude recently published trends to avoid repetition.
- **1.2 Trend Identification (AI Agent Preprocess)**: Fetch and filter Twitter trends for the US, scoring and selecting the top conversation-worthy trend not in the exclusion list.
- **1.3 Formatting & Iteration Over Trends**: Parse the AI agent output into separate trend names and loop over them for detailed processing.
- **1.4 Detailed AI Analysis per Trend (AI Agent)**: For each trend, call the MCP Twitter Search tool to find recent tweets and generate a concise summary explaining why the trend is active now.
- **1.5 Post-Processing & Storage**: Format the output for database insertion, insert or update keyword registry entries, and then wait before tweeting.
- **1.6 Posting to Twitter & Slack Notification**: Post the summarized message as a tweet and send a notification message to a Slack channel.
- **1.7 Wait Nodes for Rate Limiting and Timing Control**: Manage pacing between actions to avoid hitting API limits or flooding.

---

## 2. Block-by-Block Analysis

### 2.1 Scheduled Trigger & Recent Keywords Exclusion

- **Overview:**  
  This block initiates the workflow every two hours at 12 minutes past the hour. It queries the MySQL database to retrieve a JSON array of normalized trend keywords published recently (within a 3-day window) to exclude them from being picked again, preventing duplicate posts.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Execute a SQL query1 (select exclusion list)

- **Node Details:**  

  - **Schedule Trigger**  
    - *Type:* scheduleTrigger  
    - *Role:* Periodically triggers the workflow every 2 hours at minute 12.  
    - *Configuration:* Interval set to 2 hours, trigger at minute 12.  
    - *Input:* None (time-based trigger).  
    - *Output:* Triggers next node.  
    - *Edge cases:* Workflow will not run if n8n is offline; time drift or daylight savings changes may affect trigger time.

  - **Execute a SQL query1**  
    - *Type:* mySql  
    - *Role:* Queries database for normalized keywords recently published and still within their 3-day exclusion window.  
    - *Configuration:* SQL selects a JSON array of canonical keywords from `keyword_registry` table filtered by platform 'twitter', locale 'US', status 'published', and `next_eligible_at > NOW()`. Limits to 30 entries ordered by recent publish time.  
    - *Input:* Trigger from Schedule Trigger.  
    - *Output:* JSON array of excluded keywords as `exclude`.  
    - *Edge cases:* Database connectivity errors, malformed query results, empty result (no recent published keywords) which leads to empty exclude list.

---

### 2.2 Trend Identification (AI Agent Preprocess)

- **Overview:**  
  This block uses an AI agent to fetch current Twitter trends for the United States, normalizes and filters them against the exclusion list, scores them based on engagement potential and brand safety, and selects exactly one top trend to process further.

- **Nodes Involved:**  
  - MCP Client1  
  - OpenAI Chat Model1  
  - AI Agent Preprocess  
  - Format Results1

- **Node Details:**  

  - **MCP Client1**  
    - *Type:* MCP client tool (custom LangChain integration)  
    - *Role:* Calls the MCP Twitter trends tool `get-trends-near-location` with WOEID=23424977 (US).  
    - *Configuration:* Endpoint URL for MCP server; header authentication; server transport set to httpStreamable.  
    - *Credentials:* HTTP header authentication with stored credentials.  
    - *Input:* Receives initial inputs from workflow and exclusion list.  
    - *Output:* Passes data to AI Agent Preprocess for trend filtering and scoring.  
    - *Edge Cases:* Network issues, auth failures, server response errors.

  - **OpenAI Chat Model1**  
    - *Type:* OpenAI GPT chat model (gpt-4.1-mini)  
    - *Role:* Provides language model support to the AI Agent preprocess logic.  
    - *Credentials:* OpenAI API with OAuth credentials.  
    - *Input/Output:* Connected as AI language model to AI Agent Preprocess.  
    - *Edge Cases:* API rate limits, credential expiration, incomplete response.

  - **AI Agent Preprocess**  
    - *Type:* LangChain AI Agent  
    - *Role:* Logic to process the list of US trends, normalize names, exclude recent keywords, score remaining trends by engagement potential, and pick one top trend or empty list if none.  
    - *Prompt:* Detailed instructions specifying input, filtering, scoring heuristics, and output format (JSON array of strings).  
    - *Input:* MCP Client1 output + exclusion list from DB.  
    - *Output:* JSON array of trend names.  
    - *Edge Cases:* Empty input, no viable trends found, tool call failures.

  - **Format Results1**  
    - *Type:* Function node  
    - *Role:* Parses AI Agent Preprocess output (array/string) and returns individual trend items as separate JSON objects for further looping.  
    - *Key Code:* Parses & validates array; returns one item per trend name.  
    - *Input:* AI Agent Preprocess JSON output.  
    - *Output:* Multiple items with `{ name }`.  
    - *Edge Cases:* Malformed JSON, empty array output.

---

### 2.3 Formatting & Iteration Over Trends

- **Overview:**  
  This block splits the list of trend names into batches (one per batch) for sequential processing, enabling independent calls to the detailed AI analysis for each trend.

- **Nodes Involved:**  
  - Loop Over Items

- **Node Details:**  

  - **Loop Over Items**  
    - *Type:* splitInBatches  
    - *Role:* Splits incoming items (trend names) into individual batches (default batch size = 1) to process trends one at a time.  
    - *Input:* List of trend names from Format Results1.  
    - *Output:* Batches sent sequentially to AI Agent for detailed analysis.  
    - *Edge Cases:* Empty input list leads to no batches; batch processing errors.

---

### 2.4 Detailed AI Analysis per Trend (AI Agent)

- **Overview:**  
  For each selected trend, this block uses an AI agent connected to the MCP Twitter Search tool to fetch recent tweets and generate a concise, brand-safe summary explaining why the trend is currently active.

- **Nodes Involved:**  
  - MCP Client  
  - OpenAI Chat Model  
  - AI Agent  
  - Send a message  
  - keyword_formatter

- **Node Details:**  

  - **MCP Client**  
    - *Type:* MCP client tool  
    - *Role:* Calls MCP Twitter Search tool `search_tweets` with the trend name as the query.  
    - *Configuration:* Same endpoint as MCP Client1; header auth; server transport httpStreamable.  
    - *Credentials:* Header Authentication.  
    - *Input:* Trend name from Loop Over Items forwarded to AI Agent.  
    - *Output:* Passes data to AI Agent for summary generation.  
    - *Edge Cases:* API/network failure, auth issues.

  - **OpenAI Chat Model**  
    - *Type:* OpenAI GPT chat model (gpt-5-mini)  
    - *Role:* Language model for AI Agent to synthesize tweet search results into a concise explanation.  
    - *Credentials:* OpenAI API OAuth2.  
    - *Input/Output:* Connected as AI language model to AI Agent.  
    - *Edge Cases:* Rate limits, API errors.

  - **AI Agent**  
    - *Type:* LangChain AI Agent  
    - *Role:* Coordinates tool call to MCP Twitter Search and synthesizes output into a JSON object including trend name, summary, search URL, and placeholders for images.  
    - *Prompt:* Detailed instructions constrain output format, limit to one tool call, avoid fabricated info.  
    - *Input:* Single trend name from batch.  
    - *Output:* JSON with trend, summary, search_url, image_url=null, image_prompt=null, aspect_ratio "16:9".  
    - *Edge Cases:* Empty input, no search results, tool failure.

  - **Send a message**  
    - *Type:* Slack node  
    - *Role:* Posts the AI Agent summary output as a message to Slack channel `#mcp-hub-test` for monitoring and review.  
    - *Configuration:* OAuth2 authentication for Slack; message text taken from AI Agent output.  
    - *Input:* AI Agent output JSON.  
    - *Output:* Triggers downstream wait node.  
    - *Edge Cases:* Slack API rate limits, connectivity errors.

  - **keyword_formatter**  
    - *Type:* Code node  
    - *Role:* Processes AI Agent output to normalize the trend keyword (`canon`), merges fields, and prepares JSON for database insertion and tweet publishing.  
    - *Key Code:* Normalizes trend name (lowercase, strip hashtags, trim spaces), passes through other fields.  
    - *Input:* AI Agent output JSON.  
    - *Output:* Single JSON object with platform, locale, trend info, and canonical form.  
    - *Edge Cases:* Malformed input JSON, normalization errors.

---

### 2.5 Post-Processing & Storage

- **Overview:**  
  This block inserts or updates the keyword registry database table with the new trend data including summary and Slack message metadata, then waits before posting to Twitter.

- **Nodes Involved:**  
  - Execute a SQL query  
  - Wait1

- **Node Details:**  

  - **Execute a SQL query**  
    - *Type:* mySql  
    - *Role:* Inserts or updates the `keyword_registry` table with the new trend keyword, summary, timestamps, and Slack message details. It manages deduplication via `ON DUPLICATE KEY UPDATE`.  
    - *Configuration:* Parameterized query with platform='twitter', locale='US', normalized keyword, status='published', and JSON payload with trend info.  
    - *Input:* Output from keyword_formatter.  
    - *Output:* Triggers Wait1 node.  
    - *Edge Cases:* DB connection errors, query syntax errors, constraint violations.

  - **Wait1**  
    - *Type:* wait  
    - *Role:* Delay to pace operations before proceeding to tweet creation.  
    - *Input:* From DB insertion.  
    - *Output:* Triggers Create Tweet node.  
    - *Edge Cases:* None specific, but long delays may affect workflow timing.

---

### 2.6 Posting to Twitter & Slack Notification

- **Overview:**  
  This block publishes the finalized trend summary as a tweet and then triggers a wait node to ensure controlled pacing of outgoing posts.

- **Nodes Involved:**  
  - Create Tweet  
  - Wait

- **Node Details:**  

  - **Create Tweet**  
    - *Type:* Twitter node (OAuth2)  
    - *Role:* Posts a tweet composed of the trend name and its summary.  
    - *Configuration:* Text template: `{{trend}}: {{summary}}`.  
    - *Credentials:* Twitter OAuth2 with appropriate account.  
    - *Input:* From Wait1 after DB insertion.  
    - *Output:* Triggers Wait node.  
    - *Edge Cases:* Twitter API rate limits, auth token expiry, tweet content policy violations.

  - **Wait**  
    - *Type:* wait  
    - *Role:* Final pacing delay to avoid flooding Twitter API or subsequent workflow steps.  
    - *Input:* From Create Tweet and Send a message nodes.  
    - *Output:* No downstream connections (end of workflow).  
    - *Edge Cases:* None specific.

---

## 3. Summary Table

| Node Name           | Node Type                         | Functional Role                                   | Input Node(s)               | Output Node(s)               | Sticky Note                             |
|---------------------|----------------------------------|-------------------------------------------------|-----------------------------|-----------------------------|---------------------------------------|
| Schedule Trigger     | scheduleTrigger                  | Initiates workflow every 2 hours                 |                             | Execute a SQL query1         |                                       |
| Execute a SQL query1 | mySql                           | Retrieves recent published keywords (exclusions)| Schedule Trigger             | AI Agent Preprocess          |                                       |
| MCP Client1          | MCP client tool                 | Calls MCP Twitter trends tool                     |                             | AI Agent Preprocess          |                                       |
| OpenAI Chat Model1   | OpenAI GPT chat model           | Provides language model for trend preprocessing  |                             | AI Agent Preprocess          |                                       |
| AI Agent Preprocess  | LangChain AI Agent              | Selects top US trend excluding recent keywords   | MCP Client1, Execute a SQL query1 | Format Results1           |                                       |
| Format Results1      | Function node                   | Parses AI output into individual trend items     | AI Agent Preprocess          | Loop Over Items              |                                       |
| Loop Over Items      | splitInBatches                  | Processes each trend individually                  | Format Results1             | AI Agent                    |                                       |
| MCP Client           | MCP client tool                 | Calls MCP Twitter Search tool                      |                             | AI Agent                    |                                       |
| OpenAI Chat Model    | OpenAI GPT chat model           | Provides language model for detailed analysis     |                             | AI Agent                    |                                       |
| AI Agent             | LangChain AI Agent              | Generates concise summary explaining trend        | Loop Over Items, MCP Client | Send a message, keyword_formatter |                               |
| Send a message       | Slack                          | Posts summary to Slack channel                      | AI Agent                    | Wait                        |                                       |
| keyword_formatter    | Code                           | Normalizes trend data and prepares for DB insert  | AI Agent                    | Wait1, Execute a SQL query  |                                       |
| Execute a SQL query  | mySql                          | Inserts/updates keyword registry with trend data  | keyword_formatter           | Wait                        |                                       |
| Wait1                | wait                           | Delays to pace workflow before tweeting            | Execute a SQL query         | Create Tweet                |                                       |
| Create Tweet         | Twitter                        | Publishes summary as tweet                          | Wait1                       | Wait                        |                                       |
| Wait                 | wait                           | Final delay to control API usage                    | Create Tweet, Send a message|                             |                                       |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: scheduleTrigger  
   - Set to trigger every 2 hours at minute 12.

2. **Create a MySQL node (Execute a SQL query1)**  
   - Type: mySql  
   - Configure connection to your MySQL database.  
   - SQL Query: Select JSON array of recent published keywords for exclusion, filtered by platform='twitter' and locale='US'. Use the provided parameterized query with appropriate replacements.  
   - Connect Schedule Trigger → Execute a SQL query1.

3. **Create MCP Client1 node**  
   - Type: MCP client tool (LangChain MCP Client)  
   - Endpoint URL: `https://amber.mcpreview.com/slug/aigeon-ai-twitter154`  
   - Authentication: Header Auth (set up credentials accordingly)  
   - Server Transport: httpStreamable  
   - Connect Execute a SQL query1 → MCP Client1.

4. **Create OpenAI Chat Model1 node**  
   - Type: LangChain OpenAI Chat Model  
   - Model: Select `gpt-4.1-mini` or equivalent  
   - Credentials: OpenAI API OAuth2 credentials  
   - Connect MCP Client1 → OpenAI Chat Model1 as AI Language Model input.

5. **Create AI Agent Preprocess node**  
   - Type: LangChain AI Agent  
   - Configure prompt per instructions to:  
     - Use MCP tool `get-trends-near-location` with WOEID=23424977  
     - Normalize and exclude recent trends from exclusion list  
     - Score and select one top trend  
     - Output JSON array of strings  
   - Connect MCP Client1 → AI Agent Preprocess (ai_tool input)  
   - Connect OpenAI Chat Model1 → AI Agent Preprocess (ai_languageModel input)  
   - Connect Execute a SQL query1 → AI Agent Preprocess (input for exclusion)  
   - Connect AI Agent Preprocess → Format Results1.

6. **Create Format Results1 node (Function)**  
   - Type: Function  
   - Paste JavaScript code to parse AI Agent Preprocess output into array of items with `{name}`.  
   - Connect AI Agent Preprocess → Format Results1.

7. **Create Loop Over Items node**  
   - Type: splitInBatches  
   - No special configuration needed (default batch size = 1).  
   - Connect Format Results1 → Loop Over Items.

8. **Create MCP Client node**  
   - Same MCP client tool as MCP Client1, connected to MCP Twitter Search tool.  
   - Endpoint URL and credentials same as MCP Client1.  
   - Connect Loop Over Items (ai_tool) → MCP Client.

9. **Create OpenAI Chat Model node**  
   - Type: LangChain OpenAI Chat Model  
   - Model: `gpt-5-mini` or equivalent  
   - Credentials: OpenAI API OAuth2.  
   - Connect MCP Client → OpenAI Chat Model (ai_languageModel).

10. **Create AI Agent node**  
    - Type: LangChain AI Agent  
    - Prompt configured to:  
      - Use MCP Twitter Search tool `search_tweets` with trend name query  
      - Generate concise 30–60 word summary explaining why the trend is current  
      - Output JSON object with `trend`, `summary`, `search_url`, etc.  
    - Connect Loop Over Items (main) → AI Agent  
    - Connect MCP Client → AI Agent (ai_tool)  
    - Connect OpenAI Chat Model → AI Agent (ai_languageModel).

11. **Create Send a message node (Slack)**  
    - Type: Slack node  
    - Use OAuth2 credentials for Slack account  
    - Set message text to `={{ $json.output }}`  
    - Channel: `#mcp-hub-test` (or your channel)  
    - Connect AI Agent → Send a message.

12. **Create keyword_formatter node (Code)**  
    - Type: Code  
    - Paste JavaScript code to normalize trend keyword and merge data for DB insertion.  
    - Connect AI Agent → keyword_formatter.

13. **Create Execute a SQL query node**  
    - Type: mySql  
    - Same DB credentials as before  
    - Insert or update `keyword_registry` table using parameterized query including platform, locale, canon, summary, Slack info, and timestamps.  
    - Connect keyword_formatter → Execute a SQL query.

14. **Create Wait1 node**  
    - Type: wait  
    - No parameters needed (default delay or configure as preferred).  
    - Connect Execute a SQL query → Wait1.

15. **Create Create Tweet node (Twitter)**  
    - Type: Twitter node (OAuth2)  
    - Use OAuth2 credentials for Twitter account  
    - Compose text: `={{ $json.trend }}: {{ $json.summary }}`  
    - Connect Wait1 → Create Tweet.

16. **Create Wait node**  
    - Type: wait  
    - Final pacing delay (optional duration).  
    - Connect Create Tweet → Wait  
    - Connect Send a message → Wait (parallel connection).

---

## 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                     |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| MCP (Multi-Channel Processing) server endpoint URL: https://amber.mcpreview.com/slug/aigeon-ai-twitter154 | Used for Twitter Search and Trends tools integration              |
| OpenAI GPT models used: gpt-4.1-mini for preprocessing, gpt-5-mini for detailed summarization   | Model selection affects summarization quality and cost            |
| Slack notification channel: #mcp-hub-test                                                       | Used for monitoring generated summaries and workflow operation    |
| Twitter OAuth2 account credential configured for automated tweets                               | Ensure Twitter app permissions include posting tweets             |
| Database table `keyword_registry` schema assumed to include fields: platform, locale, canon, status, published_at, publish_payload, next_eligible_at | Critical for managing trend lifecycle and avoiding duplicates     |
| Trend normalization involves lowercasing, trimming, removing hashtags, and collapsing spaces    | Important to ensure consistent matching and exclusion             |
| Workflow pacing controlled with wait nodes to respect API rate limits and avoid flooding        | Adjust wait durations as needed based on API limits               |

---

*Disclaimer: The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.*

---