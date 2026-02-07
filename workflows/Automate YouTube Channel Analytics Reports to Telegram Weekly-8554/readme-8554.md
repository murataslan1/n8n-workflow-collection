Automate YouTube Channel Analytics Reports to Telegram Weekly

https://n8nworkflows.xyz/workflows/automate-youtube-channel-analytics-reports-to-telegram-weekly-8554


# Automate YouTube Channel Analytics Reports to Telegram Weekly

### 1. Workflow Overview

This workflow automates the generation and delivery of weekly YouTube channel analytics reports via Telegram. It targets YouTube channel owners or managers who want to receive concise, data-rich summaries of their channel performance every Sunday at 6 AM. The workflow is structured into several logical blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow weekly on Sunday mornings.  
- **1.2 Data Acquisition:** Retrieves various analytics reports from YouTube Analytics API covering the last 7 days: channel summary, top videos, traffic sources, and audience demographics.  
- **1.3 Data Formatting:** Transforms raw API responses into structured, easily usable JSON objects.  
- **1.4 Data Enrichment:** Converts video IDs from the top videos report into detailed video information including titles and statistics.  
- **1.5 Data Merging:** Combines multiple sources of analytics data into a unified dataset for reporting.  
- **1.6 Message Construction:** Prepares a formatted Telegram message summarizing key metrics, top videos, traffic sources, and audience demographics.  
- **1.7 Message Delivery:** Sends the composed report as a text message to a specified Telegram channel.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:** Triggers the workflow execution weekly at Sunday 6 AM to ensure reports are sent consistently each week.  
- **Nodes Involved:** `Run Weekly on Sunday 6am`  
- **Node Details:**  
  - **Type:** Schedule Trigger  
  - **Configuration:** Set to trigger every week at hour 6 (6 AM), no specific day field but implied weekly interval.  
  - **Input:** None (trigger node)  
  - **Output:** Triggers parallel downstream API calls to gather YouTube data.  
  - **Potential Failures:** Scheduling misconfiguration or n8n instance downtime could delay execution.

#### 1.2 Data Acquisition

- **Overview:** Fetches multiple YouTube Analytics reports for the last 7 days, including channel summary, top videos, traffic sources, and audience demographics.  
- **Nodes Involved:** `Channel Summary`, `Top Videos Week`, `Traffic Source`, `Audience Demographics`  
- **Node Details:**

  - **Channel Summary**  
    - **Type:** HTTP Request  
    - **Role:** Fetches daily aggregated channel statistics (views, watch time, likes, comments, subscribers gained/lost) for the past week.  
    - **Parameters:** Uses Google OAuth2 credential named "YouTube Credential". Query params specify channel ID as "MINE", dynamic startDate (7 days ago), endDate (today), metrics, dimensions (day), and sorting by day ascending.  
    - **Input:** Trigger node  
    - **Output:** JSON response of daily metrics.  
    - **Failures:** API quota limits, invalid OAuth token, network issues.

  - **Top Videos Week**  
    - **Type:** HTTP Request  
    - **Role:** Retrieves top 5 videos by views over the last week with metrics like views, watch time, average duration.  
    - **Parameters:** Similar OAuth2 credential; query parameters include metrics, dimension "video" and sorting descending by views, maxResults=5.  
    - **Input:** Trigger node  
    - **Output:** JSON response with video IDs and analytics.  
    - **Failures:** Same as above plus possible empty data if no views.

  - **Traffic Source**  
    - **Type:** HTTP Request  
    - **Role:** Gathers views and watch time data broken down by traffic source types for the last week.  
    - **Parameters:** OAuth2 credentials; metrics and dimension set for insightTrafficSourceType, sorted by views.  
    - **Input:** Trigger node  
    - **Output:** JSON response with traffic source data.  
    - **Failures:** Same as above.

  - **Audience Demographics**  
    - **Type:** HTTP Request  
    - **Role:** Fetches viewer percentage broken down by age group and gender for the last week.  
    - **Parameters:** OAuth2 credentials; metrics "viewerPercentage", dimensions "ageGroup,gender".  
    - **Input:** Trigger node  
    - **Output:** JSON response with demographic data.  
    - **Failures:** Same as above.

#### 1.3 Data Formatting

- **Overview:** Converts raw API responses with columnHeaders and rows into arrays of objects keyed by column names for easier processing downstream.  
- **Nodes Involved:** `Channel Summary Formatter`, `Top Videos Week Formatter`, `Traffic Source Formatter`, `Audience Demographics Formatter`  
- **Node Details:**

  - Each formatter node is a **Code** node running JavaScript that:  
    - Extracts column headers from `columnHeaders` array  
    - Maps each row array into an object with keys from headers  
    - Returns an array of JSON objects, one per row.

  - **Top Videos Week Formatter** additionally:  
    - Renames "views" field to "views_weekly"  
    - Extracts video IDs into a CSV string for the next node  
    - Outputs combined object with parsed top videos and CSV string of video IDs.

  - **Input:** Corresponding HTTP Request node output  
  - **Output:** Structured JSON array or enriched object  
  - **Failures:** Code expression errors, unexpected API response structure.

#### 1.4 Data Enrichment

- **Overview:** Translates video IDs from the top videos analytics into detailed video metadata including title, thumbnails, and all-time statistics via YouTube Data API.  
- **Nodes Involved:** `Turn Id to Title`  
- **Node Details:**  
  - **Type:** HTTP Request  
  - **Role:** Calls YouTube Data API v3 "videos" endpoint with "snippet,statistics" parts for given video IDs (CSV from previous formatter).  
  - **Parameters:** OAuth2 credentials; query includes video IDs CSV from formatter.  
  - **Input:** `Top Videos Week Formatter` output (videoIdsCsv)  
  - **Output:** Detailed video info JSON  
  - **Failures:** API quota, invalid video IDs, OAuth issues.

#### 1.5 Data Merging

- **Overview:** Combines multiple data streams into unified datasets to prepare for final formatting and message composition.  
- **Nodes Involved:** `Merger Views Weekly and Views All Time`, `Merger Node 1 2`, `Merger Node 1 2 3`, `Merger Node 1 2 3 4`  
- **Node Details:**

  - **Merger Views Weekly and Views All Time**  
    - Combines output of `Turn Id to Title` (all-time video stats) with `Top Videos Week Formatter` (weekly views).  
    - Mode: Combine by position to align items.

  - **Merger Node 1 2**  
    - Merges `Channel Summary Formatter` and output of previous merger (video views combined).  

  - **Merger Node 1 2 3**  
    - Merges output of `Merger Node 1 2` and `Traffic Source Formatter`.  

  - **Merger Node 1 2 3 4**  
    - Final merge adding `Audience Demographics Formatter` data.

  - **Input:** Outputs from formatting nodes and enrichment node  
  - **Output:** Combined array of all datasets  
  - **Failures:** Misaligned data structures, missing inputs.

#### 1.6 Message Construction

- **Overview:** Processes merged data into a human-readable Markdown-formatted text message suitable for Telegram, summarizing key stats, top videos, traffic sources, and audience demographics.  
- **Nodes Involved:** `All Output Formatter`, `Telegram Message Formatter`  
- **Node Details:**

  - **All Output Formatter** (Code node)  
    - Iterates over merged items, categorizes them into sections: overview, topVideos, trafficSources, audience.  
    - Joins video analytics with video metadata by matching IDs.  
    - Constructs a structured JSON object with arrays for each section.

  - **Telegram Message Formatter** (Code node)  
    - Extracts last 7 days from overview data.  
    - Calculates totals and averages for views, likes, comments, subscribers gained/lost, average view duration.  
    - Builds a multiline Markdown message string with channel summary, top 5 videos (weekly and all-time views, likes, comments), top 3 traffic sources sorted by views, and top 3 audience demographic segments sorted by viewer percentage.  
    - Returns JSON with `text` field for Telegram.

  - **Input:** Merged data array  
  - **Output:** Formatted message text JSON  
  - **Failures:** Missing data fields, empty arrays, division by zero.

#### 1.7 Message Delivery

- **Overview:** Sends the prepared analytics report as a text message to a Telegram channel or group.  
- **Nodes Involved:** `Send a text message`  
- **Node Details:**

  - **Type:** Telegram node  
  - **Role:** Uses Telegram Bot API to send message text to chat ID `-1001415788700` (a Telegram channel or supergroup).  
  - **Parameters:**  
    - Text set dynamically from `Telegram Message Formatter` output.  
    - Attribution disabled.  
    - Credential: Telegram Bot API credential named "abdulazizahwan_Bot".  
  - **Input:** Formatted message JSON  
  - **Output:** Telegram API response confirming message sent.  
  - **Failures:** Bot permissions, invalid chat ID, network errors.

---

### 3. Summary Table

| Node Name                         | Node Type           | Functional Role                          | Input Node(s)                            | Output Node(s)                        | Sticky Note                                         |
|----------------------------------|---------------------|----------------------------------------|-----------------------------------------|-------------------------------------|----------------------------------------------------|
| Run Weekly on Sunday 6am          | Schedule Trigger    | Weekly trigger to start workflow       | None                                    | Channel Summary, Top Videos Week, Traffic Source, Audience Demographics |                                                    |
| Channel Summary                  | HTTP Request       | Fetch channel daily summary data       | Run Weekly on Sunday 6am                 | Channel Summary Formatter            |                                                    |
| Top Videos Week                 | HTTP Request       | Fetch top 5 videos weekly data          | Run Weekly on Sunday 6am                 | Top Videos Week Formatter            |                                                    |
| Traffic Source                  | HTTP Request       | Retrieve traffic source stats           | Run Weekly on Sunday 6am                 | Traffic Source Formatter             |                                                    |
| Audience Demographics           | HTTP Request       | Get audience demographics data          | Run Weekly on Sunday 6am                 | Audience Demographics Formatter      |                                                    |
| Channel Summary Formatter       | Code               | Format channel summary API response     | Channel Summary                         | Merger Node 1 2                     |                                                    |
| Top Videos Week Formatter       | Code               | Format top videos API response, extract video IDs CSV | Top Videos Week                        | Turn Id to Title, Merger Views Weekly and Views All Time |                                                    |
| Traffic Source Formatter        | Code               | Format traffic source API response      | Traffic Source                        | Merger Node 1 2 3                   |                                                    |
| Audience Demographics Formatter | Code               | Format audience demographics API response | Audience Demographics               | Merger Node 1 2 3 4                 |                                                    |
| Turn Id to Title               | HTTP Request       | Enrich video IDs with titles & stats     | Top Videos Week Formatter              | Merger Views Weekly and Views All Time |                                                    |
| Merger Views Weekly and Views All Time | Merge              | Combine weekly and all-time video stats | Turn Id to Title, Top Videos Week Formatter | Merger Node 1 2                   |                                                    |
| Merger Node 1 2                | Merge              | Merge channel summary and video stats   | Channel Summary Formatter, Merger Views Weekly and Views All Time | Merger Node 1 2 3                 |                                                    |
| Merger Node 1 2 3              | Merge              | Add traffic source data                  | Merger Node 1 2, Traffic Source Formatter | Merger Node 1 2 3 4               |                                                    |
| Merger Node 1 2 3 4            | Merge              | Add audience demographics data           | Merger Node 1 2 3, Audience Demographics Formatter | All Output Formatter             |                                                    |
| All Output Formatter           | Code               | Consolidate and categorize all merged data | Merger Node 1 2 3 4                   | Telegram Message Formatter          |                                                    |
| Telegram Message Formatter     | Code               | Format final Telegram message text       | All Output Formatter                   | Send a text message                 |                                                    |
| Send a text message            | Telegram            | Send the analytics report to Telegram    | Telegram Message Formatter             | None                              |                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger:**  
   - Add a **Schedule Trigger** node named `Run Weekly on Sunday 6am`.  
   - Set interval to weekly and trigger at hour 6 (6 AM). No specific day setting needed if weekly interval is sufficient.

2. **Add HTTP Request Node - Channel Summary:**  
   - Name: `Channel Summary`  
   - Method: GET  
   - URL: `https://youtubeanalytics.googleapis.com/v2/reports`  
   - Authentication: Google OAuth2 (setup credential named "YouTube Credential")  
   - Query Parameters:  
     - `ids`: `channel==MINE`  
     - `startDate`: Expression `{{$now.minus({ weeks: 1 }).toISODate()}}`  
     - `endDate`: Expression `{{$now.toISODate()}}`  
     - `metrics`: `views,estimatedMinutesWatched,averageViewDuration,likes,comments,subscribersGained,subscribersLost`  
     - `dimensions`: `day`  
     - `sort`: `day`  
   - Connect input from the schedule trigger.

3. **Add HTTP Request Node - Top Videos Week:**  
   - Name: `Top Videos Week`  
   - Similar setup as Channel Summary with URL and OAuth2 credential.  
   - Query Parameters:  
     - `ids`: `channel==MINE`  
     - `startDate`, `endDate`: same expressions as above  
     - `metrics`: `views,estimatedMinutesWatched,averageViewDuration`  
     - `dimensions`: `video`  
     - `sort`: `-views` (descending)  
     - `maxResults`: `5`  
   - Connect input from the schedule trigger.

4. **Add HTTP Request Node - Traffic Source:**  
   - Name: `Traffic Source`  
   - URL and OAuth2 same as above.  
   - Query Parameters:  
     - `ids`: `channel==MINE`  
     - `startDate`, `endDate`: as above  
     - `metrics`: `views,estimatedMinutesWatched`  
     - `dimensions`: `insightTrafficSourceType`  
     - `sort`: `views`  
   - Connect input from the schedule trigger.

5. **Add HTTP Request Node - Audience Demographics:**  
   - Name: `Audience Demographics`  
   - URL and OAuth2 same as above.  
   - Query Parameters:  
     - `ids`: `channel==MINE`  
     - `startDate`, `endDate`: as above  
     - `metrics`: `viewerPercentage`  
     - `dimensions`: `ageGroup,gender`  
     - `sort`: `ageGroup,gender`  
   - Connect input from the schedule trigger.

6. **Add Code Node - Channel Summary Formatter:**  
   - Name: `Channel Summary Formatter`  
   - JavaScript code to parse API response into array of objects keyed by column names.  
   - Input: connect from `Channel Summary`.

7. **Add Code Node - Top Videos Week Formatter:**  
   - Name: `Top Videos Week Formatter`  
   - Code to parse rows, rename `views` to `views_weekly`, create CSV of video IDs. Output combined object with parsed topVideos and videoIdsCsv.  
   - Input: connect from `Top Videos Week`.

8. **Add Code Node - Traffic Source Formatter:**  
   - Name: `Traffic Source Formatter`  
   - Similar parsing code as Channel Summary formatter.  
   - Input: connect from `Traffic Source`.

9. **Add Code Node - Audience Demographics Formatter:**  
   - Name: `Audience Demographics Formatter`  
   - Similar parsing code as above.  
   - Input: connect from `Audience Demographics`.

10. **Add HTTP Request Node - Turn Id to Title:**  
    - Name: `Turn Id to Title`  
    - Call YouTube Data API v3 endpoint `https://www.googleapis.com/youtube/v3/videos`  
    - Query Parameters:  
      - `part`: `snippet,statistics`  
      - `id`: Expression from `Top Videos Week Formatter` output `${{ $json.videoIdsCsv }}`  
    - OAuth2 credential: same as above.  
    - Input: connect from `Top Videos Week Formatter`.

11. **Add Merge Node - Merger Views Weekly and Views All Time:**  
    - Name: `Merger Views Weekly and Views All Time`  
    - Mode: Combine  
    - Combine By Position  
    - Inputs:  
      - Input 1: from `Turn Id to Title` (video details)  
      - Input 2: from `Top Videos Week Formatter` (weekly analytics)  

12. **Add Merge Node - Merger Node 1 2:**  
    - Name: `Merger Node 1 2`  
    - Mode: Default (Append)  
    - Inputs:  
      - Input 1: from `Channel Summary Formatter`  
      - Input 2: from `Merger Views Weekly and Views All Time`  

13. **Add Merge Node - Merger Node 1 2 3:**  
    - Name: `Merger Node 1 2 3`  
    - Mode: Default (Append)  
    - Inputs:  
      - Input 1: from `Merger Node 1 2`  
      - Input 2: from `Traffic Source Formatter`  

14. **Add Merge Node - Merger Node 1 2 3 4:**  
    - Name: `Merger Node 1 2 3 4`  
    - Mode: Default (Append)  
    - Inputs:  
      - Input 1: from `Merger Node 1 2 3`  
      - Input 2: from `Audience Demographics Formatter`  

15. **Add Code Node - All Output Formatter:**  
    - Name: `All Output Formatter`  
    - JavaScript code to categorize merged data into overview, topVideos, trafficSources, and audience arrays.  
    - Enrich topVideos with detailed titles and stats by matching IDs.  
    - Input: from `Merger Node 1 2 3 4`.

16. **Add Code Node - Telegram Message Formatter:**  
    - Name: `Telegram Message Formatter`  
    - JavaScript to build a Markdown message summarizing channel stats (7-day totals/averages), top 5 videos, top 3 traffic sources, and top 3 audience demographics.  
    - Input: from `All Output Formatter`.

17. **Add Telegram Node - Send a text message:**  
    - Name: `Send a text message`  
    - Chat ID: `-1001415788700` (Telegram channel/supergroup)  
    - Text: Expression `{{$json.text}}` from previous node  
    - Disable attribution  
    - Credential: Telegram Bot API credential (named "abdulazizahwan_Bot")  
    - Input: from `Telegram Message Formatter`.

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                            |
|----------------------------------------------------------------------------------------------|------------------------------------------------------------|
| Uses Google OAuth2 credentials to access YouTube Analytics and Data APIs for channel data.  | Requires setup of Google API project with YouTube Analytics enabled. |
| Telegram bot must have permission to post messages in the target chat (chat ID shown).      | Telegram Bot API documentation for bot setup and chat permissions. |
| Workflow runs every Sunday at 6 AM to deliver weekly summaries.                              | Scheduling node configured accordingly.                    |
| Video data enrichment step merges YouTube Data API video details with analytics metrics.    | Improves report readability with video titles and thumbnails. |
| Code nodes handle parsing and formatting to transform API responses into usable formats.    | Custom JavaScript used for flexible data manipulation.     |
| Markdown formatting used in Telegram messages for clear presentation.                        | Telegram Markdown v2 or standard supported formatting styles. |

---

Disclaimer: The text provided is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.