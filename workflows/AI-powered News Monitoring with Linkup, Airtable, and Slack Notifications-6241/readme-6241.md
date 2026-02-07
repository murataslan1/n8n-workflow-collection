AI-powered News Monitoring with Linkup, Airtable, and Slack Notifications

https://n8nworkflows.xyz/workflows/ai-powered-news-monitoring-with-linkup--airtable--and-slack-notifications-6241


# AI-powered News Monitoring with Linkup, Airtable, and Slack Notifications

### 1. Workflow Overview

This workflow automates the process of monitoring news related to specific topics by leveraging Linkup’s AI-powered news search API, storing the results in Airtable, and notifying a Slack channel once new news items are ready for review. It is designed for users who want a hands-off, scheduled news digest focusing on defined keywords, with an emphasis on recent and relevant news articles.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Parameter Setup:** Defines when the workflow runs and sets the search parameters (topics and date range).
- **1.2 News Retrieval via Linkup API:** Queries the Linkup AI API to fetch structured news data based on the parameters.
- **1.3 News Data Processing:** Splits the returned news array into individual items and loops over them to process individually.
- **1.4 Data Storage:** Stores each news item as a separate record in Airtable.
- **1.5 Post-Storage Aggregation and Notification:** Aggregates processed news items and sends a notification message to a Slack channel.
- **1.6 Rate Limiting Wait:** Inserts a wait period between storing individual news items to avoid hitting Airtable API rate limits.
- **1.7 Documentation and User Guidance:** Sticky note nodes provide extensive inline documentation and usage instructions.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Parameter Setup

- **Overview:** This block initiates the workflow on a recurring basis and sets the parameters that define the news search scope.
- **Nodes Involved:** `Schedule Trigger`, `Set news parameters`
- **Node Details:**

  - **Schedule Trigger**
    - *Type & Role:* Schedule trigger node to start the workflow automatically.
    - *Configuration:* Runs every 7 days at 17:30 (5:30 PM).
    - *Inputs:* None (trigger node).
    - *Outputs:* Initiates the `Set news parameters` node.
    - *Edge Cases:* Incorrect timezone or schedule misconfiguration could cause unwanted trigger times.
  
  - **Set news parameters**
    - *Type & Role:* Sets static parameters for the news query.
    - *Configuration:* 
      - `News topic(s)`: `"decarbonisation, net-zero and corporate sustainability"`
      - `News from last x days`: `7`
    - *Inputs:* From `Schedule Trigger`.
    - *Outputs:* Passes parameters to `Query Linkup for news`.
    - *Expressions:* Parameters are directly assigned; no dynamic expressions.
    - *Edge Cases:* User must update these to fit use case; stale parameters cause irrelevant news.
    - *Sticky Note:* Provides instructions to customize topics and freshness.

#### 2.2 News Retrieval via Linkup API

- **Overview:** Queries the Linkup API with the defined parameters to fetch structured news data.
- **Nodes Involved:** `Query Linkup for news`
- **Node Details:**

  - **Query Linkup for news**
    - *Type & Role:* HTTP Request node to call Linkup’s AI-powered news search API.
    - *Configuration:* 
      - Method: POST
      - URL: `https://api.linkup.so/v1/search`
      - Authentication: Bearer token via stored credential
      - Body parameters:
        - `q`: Dynamic query string incorporating `News topic(s)` from previous node.
        - `depth`: "standard"
        - `outputType`: "structured"
        - `structuredOutputSchema`: JSON schema defining expected structured response with news array containing title, url, content, date.
        - `fromDate`: Computed as current date minus `News from last x days` days, starting at day beginning.
        - `includeImages`: false
    - *Inputs:* From `Set news parameters`.
    - *Outputs:* Passes response JSON to `Split out news`.
    - *Expressions:* Uses n8n expressions to dynamically build query and date.
    - *Edge Cases:* 
      - API authentication errors (invalid or expired token).
      - API rate limiting or downtime.
      - Schema mismatch or unexpected response.
    - *Sticky Note:* Reminds to connect Linkup credential and provides link to API signup.

#### 2.3 News Data Processing

- **Overview:** Splits the array of news articles into individual items and processes each separately.
- **Nodes Involved:** `Split out news`, `Loop Over Items`
- **Node Details:**

  - **Split out news**
    - *Type & Role:* SplitOut node to extract `news` array from API response.
    - *Configuration:* Field to split out: `news`
    - *Inputs:* From `Query Linkup for news`.
    - *Outputs:* One item per news article.
    - *Edge Cases:* Empty or missing `news` field results in no output.
  
  - **Loop Over Items**
    - *Type & Role:* SplitInBatches node to iterate over news items, processing one at a time or in batches.
    - *Configuration:* Defaults; no batch size specified (default is 1).
    - *Inputs:* From `Split out news`.
    - *Outputs:* Two outputs:
      - Main output 0: To `Store one news` node (store individual news).
      - Main output 1: To `Aggregate in 1 item` (to collect all processed news).
    - *Edge Cases:* Large numbers of items may slow processing; batch size could be tuned.

#### 2.4 Data Storage

- **Overview:** Stores each individual news article as a record in Airtable.
- **Nodes Involved:** `Store one news`, `Wait`
- **Node Details:**

  - **Store one news**
    - *Type & Role:* Airtable node to create new record.
    - *Configuration:* 
      - Base: `app5DnGDQDIE9YZkV` ("News monitoring (N8N template)")
      - Table: `tblzZNOaLwby3lV5S` ("News")
      - Fields mapped:
        - Title ← news title
        - Date ← news date (ISO 8601)
        - Summary ← news content
        - URL ← news url
        - Status ← static value `"new"`
      - Options: typecast enabled
    - *Inputs:* From `Loop Over Items`.
    - *Outputs:* To `Wait`.
    - *Edge Cases:* 
      - Airtable API limits (rate limiting, quota issues).
      - Missing or malformed data fields.
      - Connectivity or credential errors.
    - *Sticky Note:* Explains how to set up Airtable with required fields.
  
  - **Wait**
    - *Type & Role:* Wait node to pause execution briefly.
    - *Configuration:* Wait for 2 seconds.
    - *Inputs:* From `Store one news`.
    - *Outputs:* Loops back to `Loop Over Items` to continue processing next item.
    - *Edge Cases:* 
      - If process interrupted here, partial data may be saved.
    - *Sticky Note:* Explains purpose is to avoid Airtable API rate limit breaches.

#### 2.5 Post-Storage Aggregation and Notification

- **Overview:** Aggregates all processed news items into a single item and sends a notification message to Slack.
- **Nodes Involved:** `Aggregate in 1 item`, `Notify in Slack`
- **Node Details:**

  - **Aggregate in 1 item**
    - *Type & Role:* Aggregate node to combine all individual news items into a single JSON object.
    - *Configuration:* Aggregate all item data into one.
    - *Inputs:* From `Loop Over Items` (main output 1).
    - *Outputs:* To `Notify in Slack`.
    - *Edge Cases:* No news items result in empty aggregation.
  
  - **Notify in Slack**
    - *Type & Role:* Slack node to send a notification message.
    - *Configuration:* 
      - Message text dynamically includes:
        - Number of days from `Set news parameters`
        - Number of news items found (`$json.data.length`)
      - Channel: `#général` (hardcoded channel ID)
      - Option: No link back to workflow included.
    - *Inputs:* From `Aggregate in 1 item`.
    - *Outputs:* Terminal node.
    - *Edge Cases:* 
      - Slack authentication errors.
      - Channel permissions or invalid channel ID.
    - *Sticky Note:* Advises setting Slack channel for notifications.

#### 2.6 Documentation and User Guidance

- **Overview:** Provides embedded documentation and usage instructions throughout the workflow.
- **Nodes Involved:** `Sticky Note`, `Sticky Note1`, `Sticky Note2`, `Sticky Note3`, `Sticky Note4`, `Sticky Note5`, `Sticky Note6`
- **Node Details:**

  Each sticky note provides important guidance:

  - Workflow overview and usage instructions.
  - How to edit topics and date range.
  - Link to obtain Linkup API key: https://www.linkup.so/
  - Airtable table structure requirements.
  - Explanation of wait node purpose.
  - Slack notification channel setup advice.
  - Schedule configuration tips.

---

### 3. Summary Table

| Node Name            | Node Type             | Functional Role                     | Input Node(s)          | Output Node(s)              | Sticky Note                                                                                   |
|----------------------|-----------------------|-----------------------------------|-----------------------|-----------------------------|-----------------------------------------------------------------------------------------------|
| Schedule Trigger      | Schedule Trigger      | Initiates workflow on schedule    | -                     | Set news parameters          | Set the schedule frequence that you like!                                                    |
| Set news parameters   | Set                   | Defines news search parameters    | Schedule Trigger      | Query Linkup for news        | Edit this node to set the topic and freshness; match schedule frequency                      |
| Query Linkup for news | HTTP Request          | Calls Linkup API for news         | Set news parameters   | Split out news               | Connect your Linkup credential; get free API key: https://www.linkup.so/                     |
| Split out news        | SplitOut              | Splits news array into items      | Query Linkup for news | Loop Over Items              |                                                                                               |
| Loop Over Items       | SplitInBatches        | Iterates over news items          | Split out news        | Store one news, Aggregate in 1 item |                                                                                               |
| Store one news        | Airtable              | Saves individual news item        | Loop Over Items       | Wait                        | Connect your Airtable credential; ensure table with Title, Date, Summary, URL, Status fields |
| Wait                 | Wait                  | Pause to avoid API rate limits    | Store one news        | Loop Over Items              | We pause for a bit to let the Airtable API breathe... avoid hitting rate limits               |
| Aggregate in 1 item   | Aggregate             | Aggregates all news items         | Loop Over Items       | Notify in Slack              |                                                                                               |
| Notify in Slack       | Slack                 | Sends completion notification     | Aggregate in 1 item   | -                           | Connect the Slack channel where you'd like to receive the notification once it's ready!      |
| Sticky Note           | Sticky Note           | Workflow overview & instructions  | -                     | -                           | Automated News Monitoring System overview with steps and usage instructions                   |
| Sticky Note1          | Sticky Note           | Instructions for parameters       | -                     | -                           | Edit this node to set the topic and freshness; match schedule trigger                        |
| Sticky Note2          | Sticky Note           | Linkup API credential info        | -                     | -                           | Connect your Linkup credential; get API key at https://www.linkup.so/                        |
| Sticky Note3          | Sticky Note           | Airtable setup instructions       | -                     | -                           | Connect your Airtable credential; create table with required fields                          |
| Sticky Note4          | Sticky Note           | Explanation of Wait node           | -                     | -                           | We pause for a bit to let the Airtable API breathe... avoid hitting rate limits              |
| Sticky Note5          | Sticky Note           | Slack setup instructions          | -                     | -                           | Connect the Slack channel where you'd like to receive the notification                        |
| Sticky Note6          | Sticky Note           | Scheduling instructions           | -                     | -                           | Set the schedule frequence that you like!                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**
   - Type: Schedule Trigger
   - Set to run every 7 days at 17:30 (5:30 PM).
   - Configure timezone as needed.
   - This node starts the workflow.

2. **Add a Set node ("Set news parameters"):**
   - Define two parameters:
     - `News topic(s)` (String): e.g., `"decarbonisation, net-zero and corporate sustainability"`
     - `News from last x days` (Number): e.g., `7`
   - Connect Schedule Trigger output to this node.

3. **Add an HTTP Request node ("Query Linkup for news"):**
   - Method: POST
   - URL: `https://api.linkup.so/v1/search`
   - Authentication: HTTP Bearer with Linkup API key credential.
   - Body Parameters (as form-data or JSON):
     - `q`: Expression string using `News topic(s)`, e.g.:
       ```
       Find news related to "{{ $json['News topic(s)'] }}".
       Only pick news, no opinion or evergreen articles.
       Ideally between 10 and 15 news.
       ```
     - `depth`: `"standard"`
     - `outputType`: `"structured"`
     - `structuredOutputSchema`: Paste the full JSON schema defining news array with title, url, content, date.
     - `fromDate`: Use expression:
       ```
       {{$now.minus($json['News from last x days'], 'days').startOf('day').toISO()}}
       ```
     - `includeImages`: `"false"`
   - Connect "Set news parameters" node output to this node.

4. **Add a SplitOut node ("Split out news"):**
   - Field to split out: `news`
   - Connect output of HTTP Request node to this node.

5. **Add a SplitInBatches node ("Loop Over Items"):**
   - Default batch size (1).
   - Connect output of SplitOut node to this node.

6. **Add an Airtable node ("Store one news"):**
   - Operation: Create
   - Base: Select or paste your Airtable base ID.
   - Table: Select or paste your Airtable table name.
   - Map fields:
     - Title ← `{{$json["title"]}}`
     - Date ← `{{$json["date"]}}`
     - Summary ← `{{$json["content"]}}`
     - URL ← `{{$json["url"]}}`
     - Status ← `"new"` (static)
   - Enable typecast option.
   - Connect first output of "Loop Over Items" to this node.

7. **Add a Wait node ("Wait"):**
   - Set to wait for 2 seconds.
   - Connect output of Airtable node to this node.
   - Connect output of Wait node back to "Loop Over Items" node input, completing the batch loop.

8. **Add an Aggregate node ("Aggregate in 1 item"):**
   - Aggregate all item data into one single item.
   - Connect second output of "Loop Over Items" node to this aggregate node.

9. **Add a Slack node ("Notify in Slack"):**
   - Operation: Send Message
   - Channel: Select your Slack channel (e.g., #general).
   - Message text:
     ```
     The News of the past {{ $('Set news parameters').item.json['News from last x days'] }} days are ready for review!

     {{ $json.data.length }} news were found!
     ```
   - Disable "Include link to workflow".
   - Connect output of Aggregate node to this Slack node.

10. **Optional: Add Sticky Note nodes for documentation:**
    - Create sticky notes with workflow description, parameter instructions, credential setup links, and explanations near relevant nodes.

11. **Credentials Setup:**
    - Create and connect credentials for:
      - Linkup API (Bearer token)
      - Airtable (API key with access to base and table)
      - Slack (OAuth2 or token with permission to post messages)

12. **Activate the workflow:**
    - Save and activate.
    - Verify the scheduled trigger runs and processes news as expected.

---

### 5. General Notes & Resources

| Note Content                                                                                                                      | Context or Link                                      |
|-----------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| Get a free Linkup API key at: https://www.linkup.so/                                                                             | Linkup API credential setup                          |
| Airtable table must contain fields: Title (string), Date (date/time), Summary (string), URL (string), Status (options: new/reviewed) | Data storage schema                                  |
| Wait node is included to avoid hitting Airtable API rate limits (2 seconds delay between inserts)                                | Rate limiting best practice                          |
| Slack notification posts to the #général channel by default; modify channel ID as needed                                          | Slack notification setup                             |
| Schedule trigger defaults to every 7 days at 17:30; adjust per user requirement                                                   | Scheduling control                                  |
| Workflow automates news monitoring for specified topics, saving results and notifying user                                       | General workflow purpose                             |

---

This structured documentation fully explains the workflow’s logic, node configurations, dependencies, and operational guidance, enabling both advanced users and automation agents to understand, reproduce, and maintain the solution effectively.