Automate News Intelligence with Gemini AI for RSS Feeds to Notion and Slack

https://n8nworkflows.xyz/workflows/automate-news-intelligence-with-gemini-ai-for-rss-feeds-to-notion-and-slack-10168


# Automate News Intelligence with Gemini AI for RSS Feeds to Notion and Slack

### 1. Workflow Overview

This workflow automates the process of gathering news articles from specified RSS feeds, analyzing and tagging them using Google Gemini AI, storing summarized content in Notion, and delivering a prioritized daily digest to Slack. It is designed for teams that monitor multiple news sources and require an automated, tagged, and prioritized briefing each morning.

**Logical Blocks:**

- **1.1 Input Reception and Configuration**  
  Triggers the workflow daily, sets configuration parameters including RSS feeds, Notion database, and Slack channel.

- **1.2 Tag Dictionary Preparation**  
  Loads a tag dictionary from Google Sheets and aggregates it into a single usable object for AI tagging.

- **1.3 RSS Feed Processing**  
  Expands RSS feed URLs into individual items, reads articles from each feed.

- **1.4 AI Summarization and Tagging**  
  Uses the Google Gemini Chat Model via a LangChain AI agent to generate structured summaries, tags, priorities, and metadata for each article.

- **1.5 AI Output Parsing and Validation**  
  Cleans, parses, and validates the AI’s JSON output, preparing data for Notion insertion.

- **1.6 Notion Database Insertion and Sorting**  
  Writes each news item as a page in Notion, then sorts all items by priority.

- **1.7 Slack Digest Preparation and Posting**  
  Selects the top 3 prioritized headlines, formats a Slack message, and posts it to the configured Slack channel.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Configuration

**Overview:**  
Starts the workflow daily at 8 AM, sets key configuration data for RSS feeds, Notion database ID, and Slack channel.

**Nodes Involved:**  
- Daily Morning Trigger  
- Workflow Configuration

**Node Details:**

- **Daily Morning Trigger**  
  - Type: Schedule Trigger  
  - Configuration: Fires daily at 08:00 hours.  
  - Outputs: Triggers downstream nodes to start processing.  
  - Edge Cases: Misconfigured timezone or trigger time may delay execution.

- **Workflow Configuration**  
  - Type: Set Node  
  - Configuration: Defines three key variables: `rssFeeds` (array of RSS feed URLs), `notionDatabaseId` (Notion DB ID string), and `slackChannel` (Slack channel name or ID).  
  - Outputs: Provides configuration data for subsequent nodes.  
  - Edge Cases: Invalid or empty configuration values will cause downstream failures.

---

#### 1.2 Tag Dictionary Preparation

**Overview:**  
Loads tag definitions from a Google Sheets document and consolidates them into a single dictionary for AI tagging consistency.

**Nodes Involved:**  
- Get Tag Dictionary  
- Aggregate Tags

**Node Details:**

- **Get Tag Dictionary**  
  - Type: Google Sheets  
  - Configuration: Reads sheet named "Tags" from a specified Google Sheets document ID.  
  - Inputs: None (triggered from Workflow Configuration)  
  - Outputs: All rows from the sheet representing available tags.  
  - Edge Cases: Google Sheets credential issues or incorrect document ID may cause failures.

- **Aggregate Tags**  
  - Type: Code (JavaScript)  
  - Configuration: Combines all tag rows into a single array property `tagDictionary`.  
  - Inputs: Data from Google Sheets.  
  - Outputs: One item containing the full tag dictionary for AI usage.  
  - Edge Cases: Empty or malformed sheet data may affect downstream AI tagging.

---

#### 1.3 RSS Feed Processing

**Overview:**  
Splits the configured RSS feed URLs into individual items and reads articles from each feed.

**Nodes Involved:**  
- Code in JavaScript (RSS Feed Splitter)  
- Read RSS Feeds

**Node Details:**

- **Code in JavaScript**  
  - Type: Code  
  - Configuration: Iterates over `rssFeeds` array, outputs one item per feed URL to allow independent processing.  
  - Inputs: Workflow Configuration output.  
  - Outputs: Multiple items, each with a single RSS feed URL.  
  - Edge Cases: Empty or malformed RSS feed array may cause no feeds to process.

- **Read RSS Feeds**  
  - Type: RSS Feed Read  
  - Configuration: Reads articles from each provided RSS feed URL.  
  - Inputs: Single RSS feed URL per item.  
  - Outputs: Article items containing fields like `title`, `content`, `link`, `pubDate`.  
  - Edge Cases: Feed URL down or malformed feed data can cause no articles or errors.

---

#### 1.4 AI Summarization and Tagging

**Overview:**  
Applies Google Gemini AI to analyze each article, producing a JSON-formatted summary, tags, priority, URL, and published date.

**Nodes Involved:**  
- AI Summarizer and Tagger  
- Google Gemini Chat Model

**Node Details:**

- **Google Gemini Chat Model**  
  - Type: LangChain Google Gemini LLM  
  - Configuration: Uses model `models/gemini-2.0-flash-lite`.  
  - Inputs: Receives text prompt from AI Summarizer and Tagger.  
  - Outputs: AI-generated JSON output.  
  - Edge Cases: API credential failure or quota exhaustion; response latency.

- **AI Summarizer and Tagger**  
  - Type: LangChain Agent  
  - Configuration: Prompt includes a tag dictionary and instructs the AI to output a strict JSON object with fields `title`, `summary` (max 3 lines), `tags` (array), `priority` (1–5), `url`, `publishedDate`.  
  - Inputs: RSS feed article content and aggregated tag dictionary.  
  - Outputs: Raw AI JSON output string per article.  
  - Edge Cases: AI may return malformed JSON or unexpected text; prompt updates may be needed with evolving taxonomy.

---

#### 1.5 AI Output Parsing and Validation

**Overview:**  
Cleans and parses the AI output JSON, ensures data integrity and compatibility with Notion's data requirements.

**Nodes Involved:**  
- Parse AI Output

**Node Details:**

- **Parse AI Output**  
  - Type: Code (JavaScript)  
  - Configuration: Extracts JSON from AI output string, parses it, fixes tag arrays, validates and converts `publishedDate` to ISO format or null. On failure returns a safe fallback object.  
  - Inputs: Raw AI output string.  
  - Outputs: Clean and validated JSON object with fields ready for Notion.  
  - Edge Cases: Parsing failures, invalid dates, empty tags arrays.  
  - Failure Handling: Returns error object with original AI output in summary for debugging.

---

#### 1.6 Notion Database Insertion and Sorting

**Overview:**  
Creates a page in the Notion database for each article with mapped properties, then sorts all inserted items by priority descending.

**Nodes Involved:**  
- Write to Notion Database  
- Sort by Priority

**Node Details:**

- **Write to Notion Database**  
  - Type: Notion  
  - Configuration: Uses configured Notion database ID from Workflow Configuration, maps properties: `summary` as rich text, `tags` as multi-select, `priority` as number, `url` as URL, `publishedDate` as date.  
  - Inputs: Parsed AI output JSON per article.  
  - Outputs: Notion page creation response.  
  - Edge Cases: Notion API rate limits, invalid DB ID, missing properties, credential issues.

- **Sort by Priority**  
  - Type: Sort  
  - Configuration: Sort items by property `priority` in descending order.  
  - Inputs: Items created in Notion.  
  - Outputs: Sorted list for downstream limiting.  
  - Edge Cases: Missing priority values defaulting to 1 may affect sorting accuracy.

---

#### 1.7 Slack Digest Preparation and Posting

**Overview:**  
Limits the sorted list to the top 3 headlines, formats a Slack-friendly message including title, summary, tags, and a "Read more" URL, then posts it to Slack.

**Nodes Involved:**  
- Top 3 Headlines  
- Format Slack Message  
- Post to Slack

**Node Details:**

- **Top 3 Headlines**  
  - Type: Limit  
  - Configuration: Restricts the list to maximum 3 items for digest brevity.  
  - Inputs: Sorted news items.  
  - Outputs: Top 3 prioritized headlines.  
  - Edge Cases: Less than 3 items available outputs fewer headlines.

- **Format Slack Message**  
  - Type: Code (JavaScript)  
  - Configuration: Constructs a formatted message string with numbered headlines, including tags and clickable URLs, suitable for Slack markdown. Uses Slack newline syntax `\n`.  
  - Inputs: Top 3 headlines.  
  - Outputs: Single JSON object with a `message` property.  
  - Edge Cases: Missing fields handled with fallback text.

- **Post to Slack**  
  - Type: Slack  
  - Configuration: Posts the message to the Slack channel specified in Workflow Configuration using OAuth2 authentication.  
  - Inputs: Formatted Slack message string.  
  - Outputs: Slack API response.  
  - Edge Cases: Slack API errors, invalid channel ID, OAuth token expiry.

---

### 3. Summary Table

| Node Name                 | Node Type                        | Functional Role                                | Input Node(s)              | Output Node(s)                   | Sticky Note                                                                                     |
|---------------------------|---------------------------------|------------------------------------------------|----------------------------|---------------------------------|--------------------------------------------------------------------------------------------------|
| Daily Morning Trigger      | Schedule Trigger                | Triggers workflow daily at 8 AM                 |                            | Workflow Configuration          | **Purpose:** Kicks off the workflow every morning. **Key setting:** Change trigger hour in the node options. **Tip:** Switch to weekdays only if you don't brief on weekends. |
| Workflow Configuration     | Set                            | Sets RSS feeds, Notion DB ID, Slack channel    | Daily Morning Trigger       | Get Tag Dictionary, Code in JavaScript | **Purpose:** Central config hub. **Fields:** `rssFeeds` (array), `notionDatabaseId` (string), `slackChannel` (string). **Tip:** Keep all user-editable values here.             |
| Get Tag Dictionary        | Google Sheets                   | Loads tag dictionary from Google Sheets         | Workflow Configuration      | Aggregate Tags                  | **Purpose:** Loads the Tag Dictionary from Google Sheets. **Note:** Reconnect your own Google Sheets credential in n8n.                 |
| Aggregate Tags            | Code (JavaScript)               | Combines sheet rows into a single tag dictionary | Get Tag Dictionary          | AI Summarizer and Tagger        | **Purpose:** Combines all sheet rows into `tagDictionary` (single item). **Downstream:** Used by the AI node to enforce consistent tagging.                       |
| Code in JavaScript        | Code (JavaScript)               | Splits RSS feed array into individual feed URLs | Workflow Configuration      | Read RSS Feeds                  | **Purpose:** Splits the `rssFeeds` array into one item per feed URL. **Why:** Lets downstream nodes process feeds independently.              |
| Read RSS Feeds            | RSS Feed Read                   | Reads articles from each RSS feed URL            | Code in JavaScript          | AI Summarizer and Tagger        | **Purpose:** Fetches articles for each feed URL. **Output:** Items with `title`, `content`, `link`, `pubDate`, etc.                            |
| AI Summarizer and Tagger  | LangChain Agent (AI Node)       | Analyzes article, generates summary and tags    | Read RSS Feeds, Aggregate Tags | Parse AI Output               | **Purpose:** Produces a strict JSON payload: title, summary (≤3 lines), tags[], priority (1–5), url, publishedDate. **Prompt tip:** Update wording and tag schema as your taxonomy evolves. |
| Google Gemini Chat Model  | LangChain Google Gemini Model   | Provides LLM runtime for AI agent                |                            | AI Summarizer and Tagger        | **Purpose:** Provides the LLM runtime for the AI agent. **Note:** Reconnect your own Gemini (PaLM) API credential in n8n.                   |
| Parse AI Output           | Code (JavaScript)               | Parses and normalizes AI JSON output              | AI Summarizer and Tagger    | Write to Notion Database        | **Purpose:** Validates and normalizes AI JSON. **Includes:** JSON-safe extraction, Notion date formatting, tag array fix.                   |
| Write to Notion Database  | Notion                         | Creates Notion pages for each article             | Parse AI Output             | Sort by Priority                | **Purpose:** Creates a Notion page per item. **Mapping:** summary→rich_text, tags→multi_select, priority→number, url→url, publishedDate→date. **Note:** Reconnect Notion credential. |
| Sort by Priority          | Sort                          | Sorts articles by priority descending             | Write to Notion Database    | Top 3 Headlines                | **Purpose:** Orders items by `priority` (desc). **Tip:** Change to `publishedDate` or hybrid scoring if preferred.                          |
| Top 3 Headlines           | Limit                         | Restricts to top 3 articles for Slack digest     | Sort by Priority            | Format Slack Message            | **Purpose:** Limits items to the top three for Slack brevity. **Tip:** Adjust `maxItems` for longer digests.                               |
| Format Slack Message      | Code (JavaScript)              | Formats Slack message with headlines and tags    | Top 3 Headlines             | Post to Slack                  | **Purpose:** Builds a readable Slack digest. **Includes:** Title, summary, tags, and `Read more` URL per item.                             |
| Post to Slack             | Slack                         | Sends formatted digest message to Slack channel  | Format Slack Message        |                             | **Purpose:** Sends the digest to your channel. **Config:** Uses `slackChannel` from the Set node. **Note:** Reconnect Slack OAuth2 credential. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node: "Daily Morning Trigger"**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 08:00 hours (changeable as needed).  

2. **Create a Set node: "Workflow Configuration"**  
   - Define three variables:  
     - `rssFeeds` (array): e.g., `["https://techcrunch.com/feed/"]`  
     - `notionDatabaseId` (string): your Notion database ID  
     - `slackChannel` (string): Slack channel name or ID, e.g., `#general`  
   - Connect output of "Daily Morning Trigger" to this node.  

3. **Create a Google Sheets node: "Get Tag Dictionary"**  
   - Configure with your Google Sheets credential.  
   - Document ID: your tag dictionary sheet ID  
   - Sheet Name: "Tags" or your actual sheet name.  
   - Connect output of "Workflow Configuration" to this node.  

4. **Create a Code node: "Aggregate Tags"**  
   - Use JavaScript to combine all rows into one `tagDictionary` array.  
   ```js
   const allTags = $input.all().map(item => item.json);
   return [{ json: { tagDictionary: allTags } }];
   ```  
   - Connect output of "Get Tag Dictionary" to this node.  

5. **Create a Code node: "Code in JavaScript"**  
   - Split the `rssFeeds` array into individual items:  
   ```js
   const rssFeedsArray = $input.item.json.rssFeeds;
   const outputItems = [];
   for (const feedUrl of rssFeedsArray) {
     outputItems.push({ json: { rssFeeds: feedUrl } });
   }
   return outputItems;
   ```  
   - Connect output of "Workflow Configuration" to this node.  

6. **Create an RSS Feed Read node: "Read RSS Feeds"**  
   - Set URL parameter to use expression: `{{$json["rssFeeds"]}}`  
   - Connect output of "Code in JavaScript" to this node.  

7. **Create a LangChain Google Gemini Chat Model node: "Google Gemini Chat Model"**  
   - Configure with your Google Gemini (PaLM) API credential.  
   - Model: `models/gemini-2.0-flash-lite`.  

8. **Create a LangChain Agent node: "AI Summarizer and Tagger"**  
   - Type: LangChain Agent  
   - Prompt: Include a strict instruction to produce JSON with properties: `title`, `summary` (max 3 lines), `tags` (array), `priority` (1-5), `url`, `publishedDate`.  
   - Include tag dictionary via expression referencing output of "Aggregate Tags".  
   - Connect "Google Gemini Chat Model" as the language model for this node.  
   - Connect output of "Read RSS Feeds" and "Aggregate Tags" as inputs for this node.  

9. **Create a Code node: "Parse AI Output"**  
   - JavaScript code to extract JSON safely, parse it, validate tags and date formats, fallback on errors.  
   - Connect output of "AI Summarizer and Tagger" to this node.  

10. **Create a Notion node: "Write to Notion Database"**  
    - Configure with your Notion credentials.  
    - Resource: databasePage  
    - Database ID: expression from `Workflow Configuration` node.  
    - Map properties:  
      - summary → rich_text  
      - tags → multi_select  
      - priority → number  
      - url → url  
      - publishedDate → date  
    - Connect output of "Parse AI Output" to this node.  

11. **Create a Sort node: "Sort by Priority"**  
    - Sort by `priority` property descending.  
    - Connect output of "Write to Notion Database" to this node.  

12. **Create a Limit node: "Top 3 Headlines"**  
    - Limit to 3 items.  
    - Connect output of "Sort by Priority" to this node.  

13. **Create a Code node: "Format Slack Message"**  
    - JavaScript code to format Slack digest message with title, summary, tags, and URL for each item.  
    - Connect output of "Top 3 Headlines" to this node.  

14. **Create a Slack node: "Post to Slack"**  
    - Configure Slack OAuth2 credentials with chat:write permission.  
    - Channel: expression from `Workflow Configuration` (e.g., `{{$node["Workflow Configuration"].json.slackChannel}}`).  
    - Text: use message from "Format Slack Message".  
    - Connect output of "Format Slack Message" to this node.  

15. **Connect nodes in the order described above**, ensuring all expressions correctly reference upstream nodes.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                           |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| This workflow targets teams (PMM, PR/Comms, Sales, founders) tracking multiple news sources needing an automated, tagged, prioritized daily briefing in Slack.                                                                                                                                                                                | Workflow purpose summary                                                                                   |
| Change trigger hour in "Daily Morning Trigger" node options to customize briefing time; optionally limit to weekdays only.                                                                                                                                                                                                                   | Scheduling customization                                                                                   |
| Edit `rssFeeds`, `notionDatabaseId`, and `slackChannel` in "Workflow Configuration" node to fit your environment.                                                                                                                                                                                                                            | Core configuration                                                                                         |
| Use your own Google Sheets credential for the "Get Tag Dictionary" node; ensure sheet contains tags for AI classification.                                                                                                                                                                                                                  | Google Sheets setup                                                                                        |
| Connect your own Notion credential and ensure target database has properties: `summary` (rich_text), `tags` (multi_select), `priority` (number), `url` (url), `publishedDate` (date).                                                                                                                                                            | Notion database requirements                                                                               |
| Connect your own Slack OAuth2 credential with chat:write permission to the desired channel.                                                                                                                                                                                                                                                  | Slack app setup                                                                                            |
| Connect your own Google Gemini (PaLM) API credential for AI summarization/tagging.                                                                                                                                                                                                                                                           | AI credential setup                                                                                        |
| The AI prompt and tag dictionary can be customized to evolve with your taxonomy and content requirements.                                                                                                                                                                                                                                    | AI prompt customization                                                                                    |
| Sorting by `priority` is default; consider sorting by `publishedDate` or a hybrid score for different briefing priorities.                                                                                                                                                                                                                   | Sorting customization                                                                                       |
| Slack message format uses Slack markdown with newline `\n` and includes tags and "Read more" links per headline.                                                                                                                                                                                                                              | Slack formatting details                                                                                   |
| For troubleshooting, AI output parsing node returns error info in the summary field to avoid Notion API errors.                                                                                                                                                                                                                              | Error handling in AI output parsing                                                                        |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This treatment strictly respects applicable content policies and contains no illegal, offensive, or protected material. All processed data is legal and publicly accessible.