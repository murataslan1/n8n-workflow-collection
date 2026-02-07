Automate Twitter Sentiment Analysis with OpenAI, Google Sheets, and Slack Alerts

https://n8nworkflows.xyz/workflows/automate-twitter-sentiment-analysis-with-openai--google-sheets--and-slack-alerts-6119


# Automate Twitter Sentiment Analysis with OpenAI, Google Sheets, and Slack Alerts

### 1. Workflow Overview

This workflow automates Twitter sentiment monitoring using Apify, OpenAI, Google Sheets, and Slack. It fetches recent tweets containing a specific hashtag or keyword, analyzes their sentiment with AI models, generates friendly replies for positive sentiments, logs all results in a Google Sheet, and sends Slack alerts for negative tweets. The logical flow is divided into the following blocks:

- **1.1 Trigger and Data Collection:** Periodically trigger the workflow and fetch latest tweets via the Apify API.
- **1.2 Data Preparation and Looping:** Prepare tweet data for processing and iterate over each tweet individually.
- **1.3 Sentiment Analysis:** Use OpenAI-powered AI agents to classify tweet sentiment into Positive, Neutral, or Negative.
- **1.4 Conditional Actions:** Depending on sentiment, generate replies for positive tweets, notify Slack for negative ones, and always log results.
- **1.5 Data Logging:** Append or update processed tweet data and analysis results in Google Sheets for record-keeping.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger and Data Collection

- **Overview:** This block triggers the workflow every 6 hours to fetch the latest tweets matching a specified query using the Apify API.
- **Nodes Involved:** Schedule Trigger, Request for Twitter Post via Apify, Get Requested Post from Apify

**Node Details:**

- **Schedule Trigger**
  - Type: Schedule Trigger
  - Role: Initiates the workflow automatically every 6 hours.
  - Configuration: Interval set to 6 hours.
  - Inputs: None
  - Outputs: Connects to "Request for Twitter Post via Apify"
  - Failures: None typical, but n8n server downtime would prevent triggering.

- **Request for Twitter Post via Apify**
  - Type: HTTP Request
  - Role: Posts a request to Apify's Twitter scraper API to fetch the latest 5 tweets with the query "LaraconIn" in English.
  - Configuration:
    - Method: POST
    - URL: Apify API endpoint for scraper actor execution
    - Headers: Content-Type application/json
    - Body (JSON): Query "LaraconIn", resultsCount 5, searchType latest, lang en
    - API Token: Must be replaced with a valid Apify token (`api_key`)
  - Inputs: Trigger from Schedule Trigger
  - Outputs: Connects to "Get Requested Post from Apify"
  - Failures: Network issues, invalid API token, or API rate limits.

- **Get Requested Post from Apify**
  - Type: HTTP Request
  - Role: Retrieves the latest dataset items (tweets) from the last Apify run.
  - Configuration:
    - Method: GET
    - URL: Apify API endpoint for last run dataset items with token
  - Inputs: Output from "Request for Twitter Post via Apify"
  - Outputs: Connects to "Set Field for Loop"
  - Failures: Network issues, dataset not available, invalid token.

---

#### 1.2 Data Preparation and Looping

- **Overview:** Prepares and formats each tweet's essential data fields, then loops over individual tweets for sequential processing.
- **Nodes Involved:** Set Field for Loop, Loop Over Items, Get Post Data, If Duplicate (inactive)

**Node Details:**

- **Set Field for Loop**
  - Type: Set
  - Role: Extracts and renames tweet data fields (`postId` → `id`, `postUrl` → `tweet_url`, `postText` → `tweet_text`) for easier reference downstream.
  - Configuration: Assigns `id`, `tweet_url`, `tweet_text` from incoming JSON.
  - Inputs: Output from "Get Requested Post from Apify"
  - Outputs: Connects to "Loop Over Items"
  - Failures: Expression failures if incoming data missing expected fields.

- **Loop Over Items**
  - Type: Split In Batches
  - Role: Iterates over tweets one at a time to allow sequential processing and API calls.
  - Configuration: Default batch size (1), no special options.
  - Inputs: Output from "Set Field for Loop"
  - Outputs: Two outputs:
    - First: To "Get Post Data" (to check duplicates)
    - Second: Empty (unused)
  - Failures: If input is empty, no iteration occurs.

- **Get Post Data**
  - Type: Google Sheets
  - Role: Queries the Google Sheet to check if the tweet ID already exists (to avoid duplicates).
  - Configuration:
    - Document ID and Sheet Name fixed to a specific Google Sheet and tab.
    - Filter by the tweet ID column matching current tweet ID.
  - Inputs: Output from "Loop Over Items"
  - Outputs: Connects to inactive "If Duplicate"
  - Failures: Google Sheets auth errors, rate limits, or incorrect document/sheet IDs.

- **If Duplicate**
  - Type: If Node
  - Role: Intended to check if the tweet already exists in the sheet and branch accordingly.
  - Configuration: Checks if the Google Sheets query returned an existing ID.
  - Inputs: Output from "Get Post Data"
  - Outputs: Two branches (true/false) but node is inactive.
  - Note: This node is currently inactive, so duplicate checking is effectively bypassed.

---

#### 1.3 Sentiment Analysis

- **Overview:** Analyzes tweet sentiment using AI models and generates a short reply for positive tweets.
- **Nodes Involved:** Sentiment Analyst, Structured Output Parser, Switch According Analyst, OpenAI, OpenAI Chat Model

**Node Details:**

- **Sentiment Analyst**
  - Type: Langchain Agent Node (AI agent)
  - Role: Classifies the sentiment of the tweet text into one word: Positive, Neutral, or Negative.
  - Configuration:
    - Input Text: Gets `tweet_text` from current loop item.
    - System Message: Defines the assistant's role to classify sentiment strictly into one word.
    - Output Parser: Enabled for structured output.
  - Inputs: Output from "Loop Over Items" (via "OpenAI Chat Model")
  - Outputs: Connects to "Switch According Analyst"
  - Failures: AI service downtime, malformed input, or parsing errors.

- **Structured Output Parser**
  - Type: Langchain Output Parser
  - Role: Parses AI output into structured JSON, expecting a "category" field.
  - Configuration: JSON schema example with category string.
  - Inputs: AI response
  - Outputs: Connects back to "Sentiment Analyst" for parsing.
  - Failures: Output not matching schema leads to parsing errors.

- **OpenAI Chat Model**
  - Type: Langchain Chat Model Node
  - Role: Provides the AI language model used by Sentiment Analyst for sentiment classification.
  - Configuration:
    - Model: GPT-4O-mini
  - Inputs: None direct, triggered internally.
  - Outputs: Connects to Sentiment Analyst's AI Language Model input.
  - Failures: OpenAI API failures, quota limits.

- **Switch According Analyst**
  - Type: Switch
  - Role: Routes workflow based on sentiment category: Positive → generate reply, Negative → send Slack alert, Neutral → just log.
  - Configuration: Conditions check the `output.category` field for "Positive", "Negative", or "Neutral".
  - Inputs: Output from "Sentiment Analyst"
  - Outputs:
    - Positive: Connects to "OpenAI" node to generate reply
    - Negative: Connects to Slack notification node
    - Neutral: Connects directly to logging (Google Sheets)
  - Failures: Misclassification, typos in category values (note "Nagative" typo in rules, but mapped correctly).

- **OpenAI**
  - Type: Langchain OpenAI Node
  - Role: Generates a friendly, thoughtful reply from a user's perspective for positive tweets.
  - Configuration:
    - Model: GPT-4O-mini
    - System message instructs to write a friendly, intelligent reply under 160 characters, no emojis, addressing the poster directly.
    - Uses tweet text from Set Field for Loop.
  - Inputs: From "Switch According Analyst" positive branch
  - Outputs: Connects to "Add Post Data"
  - Failures: OpenAI API errors, malformed input.

---

#### 1.4 Conditional Actions

- **Overview:** Depending on sentiment, the workflow sends Slack alerts for negative tweets and logs all processed tweets.
- **Nodes Involved:** Send negative post message on slack

**Node Details:**

- **Send negative post message on slack**
  - Type: Slack Node
  - Role: Sends a Slack message alerting about a negative tweet with its URL.
  - Configuration:
    - Channel: Fixed channel ID `C090F70N52M` (e.g., "website-uptime" channel)
    - Message: Includes tweet URL from "Check Duplicate" (note: node "Check Duplicate" not present, likely a labeling inconsistency; actually receives from "Switch According Analyst")
    - Authentication: Uses OAuth2 Slack credentials.
  - Inputs: From "Switch According Analyst" negative branch
  - Outputs: Connects to "Add Post Data"
  - Failures: Slack API rate limits, auth token expiration.

---

#### 1.5 Data Logging

- **Overview:** Appends or updates the Google Sheet with tweet ID, URL, text, sentiment, and post reply (if any).
- **Nodes Involved:** Add Post Data

**Node Details:**

- **Add Post Data**
  - Type: Google Sheets Node
  - Role: Writes or updates the tweet data and sentiment analysis results into the Google Sheet.
  - Configuration:
    - Document and Sheet same as "Get Post Data"
    - Columns mapped: ID, TweetUrl, TweetText, Sentiment, Post Reply
    - Operation: Append or Update based on matching ID
  - Inputs: From "OpenAI", "Send negative post message on slack", and "Switch According Analyst" neutral branch
  - Outputs: Connects back to "Loop Over Items" for processing next tweet
  - Failures: Google Sheets API errors, malformed data, permission issues.

---

### 3. Summary Table

| Node Name                        | Node Type                   | Functional Role                                    | Input Node(s)                   | Output Node(s)                          | Sticky Note                                                                                         |
|---------------------------------|-----------------------------|---------------------------------------------------|--------------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------|
| Schedule Trigger                | Schedule Trigger            | Triggers workflow every 6 hours                    | None                           | Request for Twitter Post via Apify    |                                                                                                  |
| Request for Twitter Post via Apify | HTTP Request               | Fetches latest tweets from Apify                    | Schedule Trigger               | Get Requested Post from Apify          |                                                                                                  |
| Get Requested Post from Apify  | HTTP Request               | Retrieves tweet data from Apify dataset              | Request for Twitter Post via Apify | Set Field for Loop                    |                                                                                                  |
| Set Field for Loop             | Set                         | Formats tweet fields for processing                  | Get Requested Post from Apify  | Loop Over Items                       |                                                                                                  |
| Loop Over Items               | Split In Batches             | Iterates over tweets one by one                      | Set Field for Loop             | Get Post Data (primary), empty output |                                                                                                  |
| Get Post Data                 | Google Sheets                | Checks for duplicates in Google Sheets               | Loop Over Items               | If Duplicate                         |                                                                                                  |
| If Duplicate                 | If                          | Intended to branch based on duplicates (inactive)   | Get Post Data                 | Loop Over Items (true), Sentiment Analyst (false) |                                                                                                  |
| Sentiment Analyst             | Langchain Agent Node         | Classifies tweet sentiment                            | Loop Over Items (via OpenAI Chat Model) | Switch According Analyst              |                                                                                                  |
| Structured Output Parser      | Langchain Output Parser      | Parses AI output into structured JSON                 | Sentiment Analyst             | Sentiment Analyst (parser output)     |                                                                                                  |
| OpenAI Chat Model             | Langchain Chat Model         | Provides AI model for sentiment classification       | None                         | Sentiment Analyst (AI model input)    |                                                                                                  |
| Switch According Analyst      | Switch                      | Routes workflow based on sentiment category          | Sentiment Analyst             | OpenAI (Positive), Slack (Negative), Add Post Data (Neutral) |                                                                                                  |
| OpenAI                      | Langchain OpenAI Node        | Generates friendly replies for positive tweets       | Switch According Analyst       | Add Post Data                       |                                                                                                  |
| Send negative post message on slack | Slack Node                | Sends Slack alert for negative tweets                 | Switch According Analyst       | Add Post Data                       |                                                                                                  |
| Add Post Data                | Google Sheets                | Logs or updates tweet data and analysis results       | OpenAI, Slack, Switch According Analyst | Loop Over Items                   |                                                                                                  |
| Sticky Note                  | Sticky Note                 | Provides workflow summary and usage notes             | None                         | None                               | [Sample Output Sheet and Workflow Summary](https://docs.google.com/spreadsheets/d/1sOxYQtX-O6p35FCNSRsovKEHL4w4GsfF-ylMVcwpb_E/edit?usp=sharing) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**
   - Set the trigger interval to every 6 hours.
   - This will start the workflow automatically.

2. **Create an HTTP Request node ("Request for Twitter Post via Apify")**
   - Method: POST
   - URL: `https://api.apify.com/v2/acts/scraper_one~x-posts-search/run-sync?token=YOUR_API_TOKEN`
   - Headers: Add `Content-Type: application/json`
   - Body Type: JSON
   - Body:
     ```json
     {
       "query": "LaraconIn",
       "resultsCount": 5,
       "searchType": "latest",
       "lang": "en"
     }
     ```
   - Connect Schedule Trigger output to this node.

3. **Create a second HTTP Request node ("Get Requested Post from Apify")**
   - Method: GET
   - URL: `https://api.apify.com/v2/acts/scraper_one~x-posts-search/runs/last/dataset/items?token=YOUR_API_TOKEN`
   - Connect output of previous HTTP Request node to this node.

4. **Create a Set node ("Set Field for Loop")**
   - Add three fields with expressions:
     - `id` = `{{$json.postId}}`
     - `tweet_url` = `{{$json.postUrl}}`
     - `tweet_text` = `{{$json.postText}}`
   - Connect output of "Get Requested Post from Apify" to this node.

5. **Create a Split In Batches node ("Loop Over Items")**
   - Default batch size 1.
   - Connect output of "Set Field for Loop" to this node.

6. **Create a Google Sheets node ("Get Post Data")**
   - Set operation to read rows filtered by the `ID` column matching `{{$json.id}}`.
   - Configure Google Sheets credentials.
   - Use the specific document ID and sheet name for Twitter data.
   - Connect primary output of "Loop Over Items" to this node.

7. **(Optional) Create an If node ("If Duplicate")**
   - Condition: Check if the `ID` field exists in data from Google Sheets.
   - Connect "Get Post Data" output here.
   - (Note: This node is inactive in original workflow.)

8. **Create Langchain Chat Model node ("OpenAI Chat Model")**
   - Model: GPT-4O-mini
   - Configure OpenAI API credentials.
   - No inputs; prepare for use by Sentiment Analyst.

9. **Create Langchain Agent node ("Sentiment Analyst")**
   - Text input: `{{$json.tweet_text}}` from current loop item.
   - System Message: "You are a helpful AI assistant.Perfectly analyze the sentiment of this tweet_text and tell me in one word it is Positive, Neutral, or Negative."
   - Enable Structured Output Parser.
   - Connect "Loop Over Items" output to this node.
   - Link "OpenAI Chat Model" as AI language model input.

10. **Create Langchain Output Parser node ("Structured Output Parser")**
    - JSON Schema example: `{"category": "neutral"}`
    - Connect AI output from "Sentiment Analyst" to this parser node.

11. **Create a Switch node ("Switch According Analyst")**
    - Add rules for `{{$json.output.category}}` equal to "Positive", "Negative", or "Neutral".
    - Connect output of "Sentiment Analyst" to this node.

12. **Create Langchain OpenAI node ("OpenAI")**
    - Model: GPT-4O-mini
    - System message instructs to write a positive reply:
      - Friendly, intelligent, under 160 characters, no emojis, address original poster.
    - Message content: `{{$json.tweet_text}}` from "Set Field for Loop"
    - Connect "Switch According Analyst" positive branch to this node.

13. **Create Slack node ("Send negative post message on slack")**
    - Use Slack OAuth2 credentials.
    - Channel: Use appropriate Slack channel ID (e.g., `C090F70N52M`).
    - Message: "Received a Negative retweet on {{$json.TweetUrl}}. Consider if a response or clarification is needed."
    - Connect "Switch According Analyst" negative branch to this node.

14. **Create Google Sheets node ("Add Post Data")**
    - Operation: Append or Update
    - Match by `ID`
    - Columns:
      - ID: `{{$json.id}}`
      - TweetUrl: `{{$json.tweet_url}}`
      - TweetText: `{{$json.tweet_text}}`
      - Sentiment: `{{$json.output.category}}` from Switch node
      - Post Reply: `{{$json.message.content}}` from OpenAI node (if applicable)
    - Connect outputs of:
      - "OpenAI"
      - "Send negative post message on slack"
      - "Switch According Analyst" neutral branch
      to this node.

15. **Connect "Add Post Data" output back to "Loop Over Items" to process next tweet.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                             | Context or Link                                                                                                                        |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Sample Output Sheet: https://docs.google.com/spreadsheets/d/1sOxYQtX-O6p35FCNSRsovKEHL4w4GsfF-ylMVcwpb_E/edit?usp=sharing                                                                                                                                                                                                  | Google Sheet used for storing tweets and sentiment results                                                                            |
| This workflow uses Apify's Twitter Scraper API to fetch trending Twitter content programmatically. Replace `YOUR_API_TOKEN` with your actual Apify API token.                                                                                                                                                            | https://apify.com/                                                                                                                      |
| The OpenAI GPT-4O-mini model is used for both sentiment classification and reply generation, ensuring cohesive AI interactions.                                                                                                                                                                                           | Requires OpenAI API credentials                                                                                                        |
| Slack channel ID and Google Sheets document IDs are hardcoded and need to be replaced or configured per user environment.                                                                                                                                                                                                 | Slack OAuth2 and Google Sheets OAuth2 credentials required                                                                             |
| Duplicate checking is implemented but currently disabled (If Duplicate node inactive). This may cause repeated processing of the same tweets.                                                                                                                                                                            | Consider enabling this node for production use                                                                                         |
| Slack alerts are sent only for negative sentiment tweets to encourage manual review or response. Positive tweets get AI-generated replies, and neutral tweets are logged without further action.                                                                                                                          |                                                                                                                                        |

---

**Disclaimer:** The provided text is derived exclusively from an n8n automated workflow. All data processed is legal and public, and the workflow complies with content policies.