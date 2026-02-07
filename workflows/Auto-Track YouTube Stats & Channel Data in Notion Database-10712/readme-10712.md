Auto-Track YouTube Stats & Channel Data in Notion Database

https://n8nworkflows.xyz/workflows/auto-track-youtube-stats---channel-data-in-notion-database-10712


# Auto-Track YouTube Stats & Channel Data in Notion Database

### 1. Workflow Overview

This workflow automates the process of enriching YouTube video links added to a Notion database by fetching and updating detailed video and channel statistics. It is designed primarily for YouTube content creators, marketers, and analysts who want to maintain up-to-date performance data inside a Notion workspace.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Detect new YouTube video URLs added to a Notion database.
- **1.2 Video ID Extraction:** Extract the YouTube video ID from the URL provided in Notion.
- **1.3 YouTube Video Data Retrieval:** Fetch detailed video statistics using the YouTube Data API.
- **1.4 YouTube Channel Data Retrieval:** Fetch channel-related data, such as subscriber count, using the YouTube Data API.
- **1.5 Data Formatting:** Clean and structure the raw video and channel data into a consistent format.
- **1.6 Data Merging:** Combine video and channel data into a single payload.
- **1.7 Notion Update:** Update the original Notion page with all enriched video and channel information.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Triggers the workflow when a new YouTube video URL page is added in the specified Notion database.

- **Nodes Involved:**  
  - New Video URL (Notion Trigger)

- **Node Details:**

  - **New Video URL (Notion Trigger)**  
    - Type: Notion Trigger node  
    - Role: Monitors a specific Notion database for new pages added.  
    - Configuration: Polls every minute; connected to a Notion database identified by ID `2a71d9a7-7486-807a-9006-d048aa512d16` (a template for high-performing YouTube videos).  
    - Inputs: None (trigger node)  
    - Outputs: Emits the newly added page data including property fields like the YouTube link and a formula for video ID.  
    - Credentials: Uses Notion API credential (`n8n-srv`).  
    - Edge Cases:  
      - Notion API rate limits or auth failures.  
      - Delay in new page detection due to polling interval.  
    - Sticky Notes:  
      - Explains it triggers on new Notion pages and reads the YouTube link field.  
      - Includes setup and usage information for end users.

#### 1.2 Video ID Extraction

- **Overview:**  
  Extracts the YouTube video ID from the formula property in the Notion page, preparing it for API calls.

- **Nodes Involved:**  
  - Extract YouTube Video ID

- **Node Details:**

  - **Extract YouTube Video ID**  
    - Type: Set node  
    - Role: Assigns a new field `video_id` by reading the `Video ID` formula string from the Notion page JSON properties.  
    - Configuration: Uses an expression to extract the video ID string from `properties['Video ID'].formula.string`.  
    - Inputs: Notion Trigger node output  
    - Outputs: Adds `video_id` to the workflow data for downstream use.  
    - Edge Cases:  
      - If formula is missing or malformed, `video_id` may be empty or invalid.  
      - Expression failures if property paths change.  
    - Sticky Notes:  
      - Clarifies that this node extracts video ID for YouTube API calls.

#### 1.3 YouTube Video Data Retrieval

- **Overview:**  
  Uses YouTube Data API to fetch detailed video metrics such as title, views, likes, comments, and thumbnails.

- **Nodes Involved:**  
  - Fetch Video Data (YouTube API)

- **Node Details:**

  - **Fetch Video Data (YouTube API)**  
    - Type: YouTube node  
    - Role: Gets video details by video ID.  
    - Configuration: Operation `get` on resource `video` with `videoId` set via expression from `video_id`.  
    - Inputs: Output from Extract YouTube Video ID  
    - Outputs: Full video JSON metadata as returned by the YouTube API.  
    - Credentials: Uses YouTube OAuth2 credential (`AIChris`).  
    - Edge Cases:  
      - API quota limits or authorization errors.  
      - Invalid or private video IDs resulting in no data.  
      - Network timeouts.  
    - Sticky Notes:  
      - Notes that this node fetches key video details.  
      - Combined with channel info fetching in workflow.

#### 1.4 YouTube Channel Data Retrieval

- **Overview:**  
  Retrieves channel metadata, including the channel name and subscriber count, associated with the video.

- **Nodes Involved:**  
  - Fetch Channel Info (YouTube API)

- **Node Details:**

  - **Fetch Channel Info (YouTube API)**  
    - Type: YouTube node  
    - Role: Requests channel details using the channel ID obtained from the video data snippet.  
    - Configuration: Operation `get` on channel resource, channelId set as `{{$json.snippet.channelId}}` from prior video data.  
    - Inputs: Output from Fetch Video Data (YouTube API) node  
    - Outputs: Channel metadata JSON.  
    - Credentials: Uses the same YouTube OAuth2 credential (`AIChris`).  
    - Edge Cases:  
      - Missing or invalid channel ID.  
      - API quota or auth issues.  
      - Private or deleted channels.  
    - Sticky Notes:  
      - Highlights this node fetches channel-level data like subscriber counts.

#### 1.5 Data Formatting

- **Overview:**  
  Cleans and restructures video and channel API data into simplified fields to facilitate merging and updating Notion.

- **Nodes Involved:**  
  - Format Video Data  
  - Format Channel Data

- **Node Details:**

  - **Format Video Data**  
    - Type: Set node  
    - Role: Extracts and assigns key video properties (title, thumbnail URL, channel name, view count, likes, comments, channel ID, video ID) into simple string fields.  
    - Configuration: Uses expressions to map from the video JSON response fields.  
    - Inputs: Output from Fetch Video Data (YouTube API)  
    - Outputs: Structured video data fields.  
    - Edge Cases:  
      - Missing fields if API response incomplete.  
      - String conversion issues.  
    - Sticky Notes:  
      - Explains this node structures video fields for Notion updates.

  - **Format Channel Data**  
    - Type: Set node  
    - Role: Extracts subscriber count and channel name from channel info response into string fields.  
    - Configuration: Expressions map from channel JSON fields.  
    - Inputs: Output from Fetch Channel Info (YouTube API)  
    - Outputs: Structured channel data fields.  
    - Edge Cases:  
      - Missing subscriber count or channel name due to API limits.  
    - Sticky Notes:  
      - Describes preparation of channel data for merging.

#### 1.6 Data Merging

- **Overview:**  
  Combines the structured video and channel data into a single data object keyed by `channel_name`.

- **Nodes Involved:**  
  - Merge Video + Channel Info

- **Node Details:**

  - **Merge Video + Channel Info**  
    - Type: Merge node  
    - Role: Combines two input streams (video data and channel data) into one by matching on the `channel_name` field.  
    - Configuration: Mode set to `combine` with matching on `channel_name` to ensure correct pairing.  
    - Inputs:  
      - Input 1: Formatted Video Data  
      - Input 2: Formatted Channel Data  
    - Outputs: Single merged JSON object containing all enriched fields.  
    - Edge Cases:  
      - Mismatch in `channel_name` causing merge failure.  
      - Empty inputs if prior nodes fail.  
    - Sticky Notes:  
      - Notes that this node merges all formatted data into one payload.

#### 1.7 Notion Update

- **Overview:**  
  Updates the original Notion page with all enriched video and channel statistics and sets the status to "Done".

- **Nodes Involved:**  
  - Update Notion Page

- **Node Details:**

  - **Update Notion Page**  
    - Type: Notion node  
    - Role: Updates properties on the original Notion database page including channel name, comments, likes, subscribers, thumbnail file, video title, views, and workflow status.  
    - Configuration:  
      - Page ID dynamically set as the current Notion page triggering the workflow.  
      - Updates include:  
        - Rich text fields (Channel Name, Video Title)  
        - Number fields (Comments, Likes, Subscribers, Views) parsed from strings to integers  
        - File field for Thumbnail with URL and extracted filename  
        - Status field set to "Done"  
    - Inputs: Output from Merge Video + Channel Info  
    - Outputs: Confirmation of page update (not used downstream)  
    - Credentials: Uses Notion API credential (`n8n-srv`)  
    - Edge Cases:  
      - Notion API rate limiting or auth failures.  
      - Invalid page IDs if workflow context lost.  
      - Data type mismatch errors if numbers not parsed properly.  
    - Sticky Notes:  
      - Describes final data update step into Notion page.

---

### 3. Summary Table

| Node Name                   | Node Type               | Functional Role                       | Input Node(s)                   | Output Node(s)                 | Sticky Note                                                                                                      |
|-----------------------------|-------------------------|------------------------------------|--------------------------------|-------------------------------|-----------------------------------------------------------------------------------------------------------------|
| New Video URL (Notion Trigger) | Notion Trigger          | Detect new YouTube URLs in Notion  | None                           | Extract YouTube Video ID       | Triggers when a new page is added; reads the YouTube link field                                                  |
| Extract YouTube Video ID      | Set                     | Extract video ID from Notion data  | New Video URL (Notion Trigger) | Fetch Video Data (YouTube API) | Extracts the video ID for YouTube API calls                                                                     |
| Fetch Video Data (YouTube API) | YouTube API             | Retrieve video stats from YouTube  | Extract YouTube Video ID        | Format Video Data, Fetch Channel Info | Fetches video details: title, views, likes, comments, thumbnail                                                |
| Fetch Channel Info (YouTube API) | YouTube API             | Retrieve channel info from YouTube | Fetch Video Data (YouTube API) | Format Channel Data            | Gets channel-level data including channel name, subscriber count                                               |
| Format Video Data            | Set                     | Structure video data for Notion    | Fetch Video Data (YouTube API) | Merge Video + Channel Info     | Cleans and structures video fields for updating Notion                                                         |
| Format Channel Data          | Set                     | Structure channel data for Notion  | Fetch Channel Info (YouTube API) | Merge Video + Channel Info     | Prepares channel-related fields for merging                                                                     |
| Merge Video + Channel Info   | Merge                   | Combine video and channel data     | Format Video Data, Format Channel Data | Update Notion Page            | Combines formatted video and channel data into a single payload                                                |
| Update Notion Page           | Notion                   | Update Notion page with enriched data | Merge Video + Channel Info     | None                          | Updates Notion page with title, views, likes, comments, thumbnail, subscribers, channel name, and status "Done" |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Notion Trigger node:**  
   - Type: Notion Trigger  
   - Poll interval: Every minute  
   - Database ID: Use your Notion database ID where YouTube URLs will be added.  
   - Credential: Connect your Notion API credential.  
   - Purpose: Trigger when a new page is added.

2. **Add a Set node to extract YouTube video ID:**  
   - Name: Extract YouTube Video ID  
   - Add a new field `video_id` of type string.  
   - Use expression: `{{$json.properties['Video ID'].formula.string}}` to extract the video ID from Notion page data.

3. **Add a YouTube node to fetch video data:**  
   - Name: Fetch Video Data (YouTube API)  
   - Resource: Video  
   - Operation: Get  
   - Video ID: Set expression to `{{$json.video_id}}`  
   - Credential: Connect YouTube OAuth2 credential (OAuth2 recommended for quota).  

4. **Add a YouTube node to fetch channel info:**  
   - Name: Fetch Channel Info (YouTube API)  
   - Resource: Channel  
   - Operation: Get  
   - Channel ID: Set expression to `{{$json.snippet.channelId}}` (from previous node output)  
   - Credential: Use same YouTube OAuth2 credentials.

5. **Add a Set node to format video data:**  
   - Name: Format Video Data  
   - Add fields with string values mapped from the video API response:  
     - `title`: `{{$json.snippet.title}}`  
     - `thumbnails`: `{{$json.snippet.thumbnails.standard.url}}`  
     - `channel_name`: `{{$json.snippet.channelTitle}}`  
     - `viewCount`: `{{$json.statistics.viewCount}}`  
     - `likeCount`: `{{$json.statistics.likeCount}}`  
     - `commentCount`: `{{$json.statistics.commentCount}}`  
     - `channelId`: `{{$json.snippet.channelId}}`  
     - `video_id`: `{{$json.id}}`  

6. **Add a Set node to format channel data:**  
   - Name: Format Channel Data  
   - Add fields:  
     - `subscriberCount`: `{{$json.statistics.subscriberCount}}`  
     - `channel_name`: `{{$json.snippet.title}}`  

7. **Add a Merge node to combine video and channel data:**  
   - Name: Merge Video + Channel Info  
   - Mode: Combine  
   - Match fields on: `channel_name`  
   - Inputs:  
     - Input 1 from Format Video Data  
     - Input 2 from Format Channel Data  

8. **Add a Notion node to update the original page:**  
   - Name: Update Notion Page  
   - Operation: Update Database Page  
   - Page ID: Set dynamically using expression referencing the Notion Trigger node's page id, e.g., `={{ $('New Video URL (Notion Trigger)').item.json.id }}`  
   - Properties to update:  
     - `Channel Name`: rich_text from merged data's `channel_name`  
     - `Comments`: number parsed from `commentCount`  
     - `Likes`: number parsed from `likeCount`  
     - `Subscribers`: number parsed from `subscriberCount`  
     - `Thumbnail`: file URL from `thumbnails` (use filename extracted from URL)  
     - `Video Title`: rich_text from `title`  
     - `Views`: number parsed from `viewCount`  
     - `Status`: status set to "Done"  
   - Credential: Use your Notion API credential.

9. **Connect nodes in sequence:**  
   - New Video URL (Notion Trigger) → Extract YouTube Video ID → Fetch Video Data (YouTube API) →  
     - Fetch Channel Info (YouTube API) (from Fetch Video Data)  
     - Format Video Data (from Fetch Video Data)  
   - Format Channel Data (from Fetch Channel Info)  
   - Merge Video + Channel Info (with inputs Format Video Data and Format Channel Data)  
   - Update Notion Page (from Merge node)

10. **Credential Setup:**  
    - Configure Notion API credentials with appropriate access to your database.  
    - Create and configure YouTube OAuth2 credentials with access to YouTube Data API v3.

11. **Testing:**  
    - Add a new page with a YouTube URL in your Notion database.  
    - Execute the workflow manually or wait for the trigger to fire.  
    - Verify that the Notion page updates with video and channel stats.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                  | Context or Link                                                                                         |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| This workflow is designed for YouTube creators and marketers to automatically enrich YouTube links in Notion with detailed stats.                                                                                                                            | Sticky Note at workflow start                                                                            |
| Use the provided Notion template to ensure all required fields exist: https://lunar-curler-d17.notion.site/2a71d9a77486807a9006d048aa512d16?v=2a71d9a7748680eda620000ca9c112a4                                                                                 | Mentioned in workflow information sticky note                                                           |
| YouTube Data API requires OAuth2 credentials for higher quota; create and assign these credentials to YouTube API nodes.                                                                                                                                      | Credential setup section                                                                                   |
| Watch a detailed video walkthrough here: [YouTube Walkthrough](https://www.youtube.com/watch?v=pAuKTI-n8G4)                                                                                                                                                    | Sticky Note4 with embedded YouTube link and thumbnail image                                             |
| The workflow uses Notion formula properties to extract video IDs; maintain the formula field in Notion for smooth operation.                                                                                                                                  | Important for video ID extraction reliability                                                           |
| API rate limits and timeouts can occur; monitor and handle errors if scaling beyond light usage.                                                                                                                                                               | General integration notes                                                                                |

---

**Disclaimer:**  
The text provided is derived exclusively from an automated n8n workflow. The processing strictly complies with content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.