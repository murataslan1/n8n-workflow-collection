Automate RSS Content with AI: Summarize, Notify & Archive

https://n8nworkflows.xyz/workflows/automate-rss-content-with-ai--summarize--notify---archive-4503


# Automate RSS Content with AI: Summarize, Notify & Archive

### 1. Workflow Overview

This workflow automates the processing of RSS feed content using AI to summarize news items, notify via Discord, and archive the results in Google Sheets. It is intended for users who want to monitor technical news feeds regularly, generate concise summaries using AI, and distribute these summaries efficiently while maintaining an archive for reference.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger and RSS Feed Setup:** Initiates the workflow on a schedule and defines the RSS feeds to process.
- **1.2 RSS Feed Reading and Item Splitting:** Reads the RSS feeds and splits news items into manageable batches for processing.
- **1.3 Data Mapping and Filtering:** Maps RSS fields to a standard format and filters news items to include only recent (yesterday's) news.
- **1.4 Aggregation and AI Summarization:** Aggregates filtered news items and uses an AI agent (via OpenAI) to generate summaries.
- **1.5 Formatting and Archiving:** Converts summaries to Markdown, saves them to Google Sheets, and implements a waiting period.
- **1.6 Notification:** Sends the AI-generated summaries to Discord channels.
- **1.7 Loop Control and Error Handling:** Manages batch processing loops and continues workflow execution on errors.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger and RSS Feed Setup

- **Overview:** This block triggers the workflow on a schedule and initializes the list of RSS feeds to be processed.
- **Nodes Involved:** `Schedule Trigger`, `Set Tech News RSS Feeds`, `Split Out`
  
##### Nodes:

- **Schedule Trigger**
  - Type: Trigger node to start workflow on a schedule.
  - Config: No custom parameters; default schedule (assumed daily).
  - Inputs: None (start node).
  - Outputs: Connects to `Set Tech News RSS Feeds`.
  - Edge Cases: Can fail if n8n instance not running or misconfigured.
  
- **Set Tech News RSS Feeds**
  - Type: Set node used to define RSS feed URLs.
  - Config: Contains an array or list of RSS feed URLs for tech news.
  - Inputs: From `Schedule Trigger`.
  - Outputs: Connects to `Split Out`.
  - Edge Cases: If feed URLs are empty or malformed, subsequent RSS reading will fail.
  
- **Split Out**
  - Type: Split Out node to split the array of RSS feeds into individual items.
  - Config: Default splitting behavior.
  - Inputs: From `Set Tech News RSS Feeds`.
  - Outputs: Connects to `Loop Over Items1`.
  - Edge Cases: Empty input array results in no output; must handle gracefully.

---

#### 1.2 RSS Feed Reading and Item Splitting

- **Overview:** This block reads each RSS feed URL and splits the returned news entries into individual batches for processing.
- **Nodes Involved:** `Loop Over Items1`, `RSS`, `Map Fields`, `filterYesterdayNews`

##### Nodes:

- **Loop Over Items1**
  - Type: SplitInBatches node to process RSS feeds one at a time.
  - Config: Default batch size (likely 1).
  - Inputs: From `Split Out`.
  - Outputs: Two outputs:
    - First to `Map Fields` for processing RSS feed data.
    - Second back to `RSS` node (likely for looping control).
  - Edge Cases: Large number of feeds may cause delay or rate limits.
  
- **RSS**
  - Type: RSS Feed Read node.
  - Config: Reads feed URLs passed from batch iteration.
  - Inputs: From `Loop Over Items1` (second output).
  - Outputs: News items to `Loop Over Items1` (first output).
  - Edge Cases: Failed RSS fetch due to network errors, invalid URLs, or feed format changes.
  
- **Map Fields**
  - Type: Set node used to normalize and map RSS item fields (e.g., title, link, date).
  - Config: Sets standardized fields for downstream nodes.
  - Inputs: From `Loop Over Items1` (first output).
  - Outputs: Passes mapped data to `filterYesterdayNews`.
  - Edge Cases: Missing expected RSS fields can cause mapping issues.
  
- **filterYesterdayNews**
  - Type: Code node that filters news items to include only those published yesterday.
  - Config: Custom JavaScript code compares item dates to yesterday's date.
  - Inputs: From `Map Fields`.
  - Outputs: Two outputs:
    - To `Aggregate` for grouping filtered news.
    - To `Loop Over Items` for further batch processing.
  - Edge Cases: Date parsing errors, timezone discrepancies.

---

#### 1.3 Aggregation and AI Summarization

- **Overview:** Aggregates filtered news items and sends them to an AI agent for summarization.
- **Nodes Involved:** `Aggregate`, `aggregateNews`, `AI Agent`, `OpenAI Chat Model`

##### Nodes:

- **Aggregate**
  - Type: Aggregate node to collect and group filtered news items.
  - Config: Groups news items, possibly concatenating summaries or combining fields.
  - Inputs: From `filterYesterdayNews`.
  - Outputs: To `aggregateNews`.
  - Edge Cases: Large datasets could cause performance issues.
  
- **aggregateNews**
  - Type: Code node that further processes aggregated news, likely preparing prompt for AI.
  - Config: Custom JavaScript to format aggregation into AI input.
  - Inputs: From `Aggregate`.
  - Outputs: To `AI Agent`.
  - Edge Cases: Formatting errors or empty input.
  
- **AI Agent**
  - Type: LangChain AI Agent node.
  - Config: Uses AI model (OpenAI Chat Model) to summarize news.
  - Inputs:
    - Main from `aggregateNews`.
    - AI model input from `OpenAI Chat Model`.
    - AI tool input from `Discord`.
  - Outputs: None (final output or triggers notification).
  - Edge Cases: AI API errors, rate limits, authentication failures.
  
- **OpenAI Chat Model**
  - Type: LangChain OpenAI Chat Model node.
  - Config: OpenAI credentials and model parameters (temperature, max tokens).
  - Inputs: From `AI Agent` (ai_languageModel).
  - Outputs: To `AI Agent`.
  - Edge Cases: API quota exceedance, invalid API key.

---

#### 1.4 Formatting and Archiving

- **Overview:** Converts AI summaries to Markdown, saves them in Google Sheets, then waits before continuing.
- **Nodes Involved:** `Loop Over Items`, `Markdown`, `Save News`, `Wait`

##### Nodes:

- **Loop Over Items**
  - Type: SplitInBatches node to process each summarized item individually.
  - Config: Default batch size.
  - Inputs: From `filterYesterdayNews` (second output).
  - Outputs: Two outputs:
    - First to `Markdown`.
    - Second unused or for error continuation.
  - Edge Cases: Large number of items may slow processing.
  
- **Markdown**
  - Type: Markdown node that formats the AI-generated summary into Markdown syntax.
  - Config: Default or custom markdown formatting.
  - Inputs: From `Loop Over Items`.
  - Outputs: To `Save News`.
  - Edge Cases: Malformed text causing rendering issues.
  
- **Save News**
  - Type: Google Sheets node.
  - Config: Append mode to save news summaries in a configured Google Sheet.
  - Inputs: From `Markdown`.
  - Outputs: To `Wait`.
  - Edge Cases: Google API authentication errors, quota limits.
  
- **Wait**
  - Type: Wait node.
  - Config: Introduces delay or wait for external events.
  - Inputs: From `Save News`.
  - Outputs: To `Loop Over Items`.
  - Edge Cases: Timeout or unexpected webhook failures.

---

#### 1.5 Notification

- **Overview:** Sends the AI-generated summaries as notifications to a Discord channel.
- **Nodes Involved:** `Discord`

##### Nodes:

- **Discord**
  - Type: Discord Tool node.
  - Config: Uses Discord webhook or bot token for posting messages.
  - Inputs: AI tool input from `AI Agent`.
  - Outputs: None.
  - Edge Cases: Discord API rate limits, invalid webhook URLs, message size limits.

---

#### 1.6 Loop Control and Error Handling

- **Overview:** Manages batch processing loops and ensures workflow continues on errors.
- **Nodes Involved:** `Loop Over Items`, `Loop Over Items1`, `Wait`

##### Notes:

- Both `Loop Over Items` and `Loop Over Items1` use "continueRegularOutput" on error to avoid workflow halting.
- The `Wait` node has `alwaysOutputData` enabled to ensure subsequent nodes run even if waiting is interrupted.

---

### 3. Summary Table

| Node Name               | Node Type                    | Functional Role               | Input Node(s)               | Output Node(s)              | Sticky Note                         |
|-------------------------|------------------------------|------------------------------|-----------------------------|-----------------------------|-----------------------------------|
| Schedule Trigger        | Schedule Trigger             | Starts workflow on schedule  | None                        | Set Tech News RSS Feeds      |                                   |
| Set Tech News RSS Feeds | Set                         | Defines RSS feed URLs        | Schedule Trigger            | Split Out                   |                                   |
| Split Out              | Split Out                   | Splits RSS feed list         | Set Tech News RSS Feeds     | Loop Over Items1            |                                   |
| Loop Over Items1        | SplitInBatches              | Iterates over feed URLs      | Split Out                  | Map Fields, RSS             |                                   |
| RSS                    | RSS Feed Read               | Reads RSS feed entries       | Loop Over Items1            | Loop Over Items1            |                                   |
| Map Fields             | Set                         | Normalizes RSS item fields   | Loop Over Items1            | filterYesterdayNews         |                                   |
| filterYesterdayNews     | Code                        | Filters news from yesterday  | Map Fields                 | Aggregate, Loop Over Items  |                                   |
| Aggregate              | Aggregate                   | Aggregates filtered news     | filterYesterdayNews         | aggregateNews               |                                   |
| aggregateNews          | Code                        | Formats aggregated news for AI | Aggregate                  | AI Agent                   |                                   |
| AI Agent               | LangChain AI Agent          | Generates AI summaries       | aggregateNews, OpenAI Chat Model, Discord | None (final)           |                                   |
| OpenAI Chat Model      | LangChain LM Chat OpenAI    | Provides AI model            | AI Agent                   | AI Agent                   |                                   |
| Loop Over Items        | SplitInBatches              | Splits summarized items      | filterYesterdayNews         | Markdown                   |                                   |
| Markdown               | Markdown                    | Formats summary to Markdown  | Loop Over Items             | Save News                  |                                   |
| Save News              | Google Sheets               | Archives summaries           | Markdown                   | Wait                       |                                   |
| Wait                   | Wait                        | Delays workflow continuation | Save News                  | Loop Over Items            |                                   |
| Discord                | Discord Tool                | Sends notifications          | AI Agent (ai_tool)          | None                       |                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**
   - Type: Schedule Trigger
   - Configuration: Set to desired interval (e.g., daily)
   - Connect output to next node.

2. **Create Set Node (Set Tech News RSS Feeds)**
   - Type: Set
   - Parameters: Define a list/array of RSS feed URLs (e.g., tech news sources)
   - Connect input from Schedule Trigger node.
   - Connect output to Split Out node.

3. **Create Split Out Node**
   - Type: Split Out
   - Default settings to split array into single items.
   - Connect input from Set Tech News RSS Feeds.
   - Connect output to Loop Over Items1 node.

4. **Create SplitInBatches Node (Loop Over Items1)**
   - Type: SplitInBatches
   - Batch size: 1 (default)
   - Connect input from Split Out.
   - First output connects to Map Fields node.
   - Second output connects to RSS node.

5. **Create RSS Feed Read Node**
   - Type: RSS Feed Read
   - Parameter: Set feed URL from batch input.
   - Connect input from Loop Over Items1 (second output).
   - Connect output back to Loop Over Items1 (first output).

6. **Create Set Node (Map Fields)**
   - Type: Set
   - Map RSS fields (title, link, date, content) into standardized fields.
   - Connect input from Loop Over Items1 (first output).
   - Connect output to filterYesterdayNews node.

7. **Create Code Node (filterYesterdayNews)**
   - Type: Code (JavaScript)
   - Function: Filter items published yesterday using date comparison.
   - Connect input from Map Fields.
   - First output connects to Aggregate node.
   - Second output connects to Loop Over Items node.

8. **Create Aggregate Node**
   - Type: Aggregate
   - Function: Group filtered news items for AI processing.
   - Connect input from filterYesterdayNews (first output).
   - Connect output to aggregateNews node.

9. **Create Code Node (aggregateNews)**
   - Type: Code (JavaScript)
   - Function: Format aggregated news into prompt for AI Agent.
   - Connect input from Aggregate.
   - Connect output to AI Agent node.

10. **Create LangChain AI Agent Node**
    - Type: AI Agent (LangChain)
    - Connect main input from aggregateNews.
    - Connect ai_languageModel input from OpenAI Chat Model.
    - Connect ai_tool input from Discord node.
    - No output connections.

11. **Create LangChain OpenAI Chat Model Node**
    - Type: LM Chat OpenAI
    - Configure OpenAI credentials (API key).
    - Set model parameters (e.g., temperature, max tokens).
    - Connect input from AI Agent (ai_languageModel).
    - Connect output to AI Agent.

12. **Create SplitInBatches Node (Loop Over Items)**
    - Type: SplitInBatches
    - Batch size: default.
    - Connect input from filterYesterdayNews (second output).
    - First output connects to Markdown node.
    - Second output unused or error handling.

13. **Create Markdown Node**
    - Type: Markdown
    - Converts AI summaries to Markdown format.
    - Connect input from Loop Over Items.
    - Connect output to Save News node.

14. **Create Google Sheets Node (Save News)**
    - Type: Google Sheets
    - Configure OAuth2 credentials for Google Sheets.
    - Set operation to append rows to target sheet.
    - Connect input from Markdown.
    - Connect output to Wait node.

15. **Create Wait Node**
    - Type: Wait
    - Configure wait time or webhook ID for external event.
    - Enable `alwaysOutputData`.
    - Connect input from Save News.
    - Connect output back to Loop Over Items.

16. **Create Discord Node**
    - Type: Discord Tool
    - Configure with Discord webhook URL or bot token.
    - Connect input from AI Agent (ai_tool).
    - No output.

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                                             |
|----------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| This workflow uses LangChain AI Agent nodes integrated with OpenAI for advanced summarization. | n8n documentation on LangChain nodes: https://docs.n8n.io/integrations/builtin/nodes/langchain/ |
| Google Sheets OAuth2 credentials must be configured and authorized for data archiving.       | Google API console instructions: https://console.cloud.google.com/apis/credentials |
| Discord webhook setup is required for notification delivery.                                 | Discord developer portal: https://discord.com/developers/applications        |
| The workflow uses error continuation on key nodes to ensure robustness during feed processing.| n8n error handling best practices: https://docs.n8n.io/nodes/advanced/error-handling/ |

---

**Disclaimer:** The text provided is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to content policies and contains no illegal, offensive, or protected elements. All data processed are legal and public.