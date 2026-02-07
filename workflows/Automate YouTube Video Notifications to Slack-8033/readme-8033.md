Automate YouTube Video Notifications to Slack

https://n8nworkflows.xyz/workflows/automate-youtube-video-notifications-to-slack-8033


# Automate YouTube Video Notifications to Slack

### 1. Workflow Overview

This workflow automates the notification of new YouTube videos posted by a specific channel to a Slack channel. It periodically polls the YouTube channel’s RSS feed, extracts the latest video information, determines if the video is new (published within the last two hours), formats a rich Slack message, and posts it automatically to Slack.

The workflow is logically divided into these blocks:

- **1.1 Setup & Scheduling:** Configuration notes and a cron trigger to run the workflow every 30 minutes.
- **1.2 YouTube RSS Retrieval:** HTTP request node to fetch the YouTube channel’s RSS feed.
- **1.3 Video Parsing & New Video Check:** Custom JavaScript code parses the XML RSS feed, extracts video details, sorts by date, and filters to only new videos.
- **1.4 Slack Message Formatting:** Formats the video details into a Slack message with blocks and buttons.
- **1.5 Slack Posting:** Sends the formatted message to a specific Slack channel using OAuth2 authentication.

---

### 2. Block-by-Block Analysis

#### 1.1 Setup & Scheduling

**Overview:**  
This block provides user setup instructions and triggers the workflow every 30 minutes to check for new videos automatically.

**Nodes Involved:**  
- Setup Instructions (Sticky Note)  
- Check Every 30 Minutes (Cron Trigger)

**Node Details:**

- **Setup Instructions**  
  - Type: Sticky Note  
  - Role: Provides essential manual setup steps for the user, including how to obtain the YouTube RSS feed URL, connect Slack OAuth, and configure timing.  
  - Key content includes how to find the YouTube channel ID and replace it in the HTTP Request node, and notes about avoiding duplicate posts by tracking the last video.  
  - Input/Output: None (informational node)  
  - Edge cases: None (documentation only)

- **Check Every 30 Minutes**  
  - Type: Cron Trigger  
  - Role: Triggers the workflow every 30 minutes, ensuring regular polling of the YouTube RSS feed.  
  - Configuration: Cron expression set to `*/30 * * * *` (every 30 minutes).  
  - Input: None (trigger node)  
  - Output: Connected to "Fetch YouTube RSS" node.  
  - Edge cases: Cron misconfiguration could cause missed or excessive runs.

---

#### 1.2 YouTube RSS Retrieval

**Overview:**  
Fetches the YouTube channel’s RSS feed XML using an HTTP GET request.

**Nodes Involved:**  
- Fetch YouTube RSS (HTTP Request)

**Node Details:**

- **Fetch YouTube RSS**  
  - Type: HTTP Request  
  - Role: Retrieves the XML RSS feed from YouTube for the specified channel.  
  - Configuration:  
    - URL set to `https://www.youtube.com/feeds/videos.xml?channel_id=YOUR_CHANNEL_ID_HERE` (requires user replacement of `YOUR_CHANNEL_ID_HERE` with actual channel ID).  
    - No additional HTTP options configured.  
  - Input: Triggered by the cron node.  
  - Output: Raw XML RSS feed content passed to the next node for parsing.  
  - Edge cases:  
    - Invalid channel ID or malformed URL causes HTTP errors.  
    - Network issues or YouTube API changes may break retrieval.  
    - No caching or rate limiting implemented; frequent polling may lead to limits.

---

#### 1.3 Video Parsing & New Video Check

**Overview:**  
Parses the raw XML RSS feed to extract video entries, sorts them by publication date, and detects if there is a new video published within the last two hours.

**Nodes Involved:**  
- Parse RSS & Check for New Video (Code node)

**Node Details:**

- **Parse RSS & Check for New Video**  
  - Type: Code (JavaScript)  
  - Role:  
    - Parses XML RSS feed using regular expressions to extract video title, link, publish date, description, and video ID.  
    - Sorts videos descending by publish timestamp.  
    - Checks if the newest video was published within the last two hours.  
    - Returns normalized data for the latest new video or null if none.  
  - Key expressions/logic:  
    - Regex matches `<entry>...</entry>` blocks and extracts sub-elements.  
    - Computes `is_new_video` boolean comparing video publish time to current time minus two hours.  
    - Returns an object including `title`, `link`, `published`, `description` (truncated), `video_id`, `published_timestamp`, `is_new_video`, `channel_name` (hardcoded placeholder), and formatted date string.  
  - Input: Raw XML from HTTP Request node.  
  - Output: JSON with normalized video data or null if no new video.  
  - Edge cases and failure types:  
    - Invalid or changed XML format could break regex parsing.  
    - No videos in RSS feed returns early with null.  
    - Timezone differences may cause incorrect new video detection if system clock is off.  
    - Hardcoded channel name could be replaced with dynamic extraction for accuracy.  
    - If no new video, workflow stops here (no downstream Slack post).  

---

#### 1.4 Slack Message Formatting

**Overview:**  
Formats the video data into a rich Slack message with text, blocks, buttons, and context for posting.

**Nodes Involved:**  
- Format Slack Message (Code node)

**Node Details:**

- **Format Slack Message**  
  - Type: Code (JavaScript)  
  - Role: Converts video JSON data into a Slack message payload including:  
    - Text headline  
    - A section block with title, publish date, and truncated description  
    - An action block with a “Watch Now” button linking to the video URL  
    - A context block showing the channel name and video ID with a hyperlink  
  - Configuration:  
    - Hardcoded channel: `#general` (user must modify for target Slack channel)  
    - Username and icon emoji set to "YouTube Bot" and 📺 emoji respectively  
  - Input: JSON from the parsing node with video details  
  - Output: JSON Slack message object for posting  
  - Edge cases:  
    - If input JSON is null or missing fields, formatting may fail or produce incomplete message.  
    - Hardcoded channel requires user update to match their Slack workspace.  
    - Slack API message limits (block size, text length) must be respected; truncation applied on description.

---

#### 1.5 Slack Posting

**Overview:**  
Posts the formatted message to Slack using OAuth2 authentication.

**Nodes Involved:**  
- Post to Slack (Slack node)

**Node Details:**

- **Post to Slack**  
  - Type: Slack node  
  - Role: Sends a message to a Slack channel using OAuth2 credentials.  
  - Configuration:  
    - Text, channel, blocks, username, and icon emoji dynamically set using expressions from previous node’s output.  
    - Resource: message, Operation: post  
    - Authentication: OAuth2 (requires Slack app setup and connected OAuth credentials in n8n)  
  - Input: Slack message JSON from the formatting node  
  - Output: Slack API response confirming message sent  
  - Edge cases:  
    - Authentication failure if OAuth token invalid or expired.  
    - Slack API rate limits could throttle posting.  
    - Incorrect channel name results in message not posted or error.  
    - Network issues may cause posting failure.

---

### 3. Summary Table

| Node Name                   | Node Type           | Functional Role                         | Input Node(s)           | Output Node(s)            | Sticky Note                                                                                                     |
|-----------------------------|---------------------|---------------------------------------|-------------------------|---------------------------|-----------------------------------------------------------------------------------------------------------------|
| Setup Instructions          | Sticky Note         | User setup guidance                    | None                    | None                      | 🎬 **SETUP REQUIRED:** 1. Get YouTube Channel RSS URL. 2. Connect Slack OAuth. 3. Runs every 30 minutes. Tracks last video to avoid duplicates! |
| Check Every 30 Minutes       | Cron Trigger        | Periodic trigger every 30 minutes     | None                    | Fetch YouTube RSS         | 🎬 **SETUP REQUIRED:** 1. Get YouTube Channel RSS URL. 2. Connect Slack OAuth. 3. Runs every 30 minutes. Tracks last video to avoid duplicates! |
| Fetch YouTube RSS            | HTTP Request        | Retrieve YouTube channel RSS XML      | Check Every 30 Minutes  | Parse RSS & Check for New Video | 🎬 **SETUP REQUIRED:** 1. Get YouTube Channel RSS URL. 2. Connect Slack OAuth. 3. Runs every 30 minutes. Tracks last video to avoid duplicates! |
| Parse RSS & Check for New Video | Code (JavaScript) | Parse XML, extract video data, check new video | Fetch YouTube RSS       | Format Slack Message       | 🎬 **SETUP REQUIRED:** 1. Get YouTube Channel RSS URL. 2. Connect Slack OAuth. 3. Runs every 30 minutes. Tracks last video to avoid duplicates! |
| Format Slack Message         | Code (JavaScript)   | Format rich Slack message payload     | Parse RSS & Check for New Video | Post to Slack             | 🎬 **SETUP REQUIRED:** 1. Get YouTube Channel RSS URL. 2. Connect Slack OAuth. 3. Runs every 30 minutes. Tracks last video to avoid duplicates! |
| Post to Slack               | Slack               | Post message to Slack channel         | Format Slack Message    | None                      | 🎬 **SETUP REQUIRED:** 1. Get YouTube Channel RSS URL. 2. Connect Slack OAuth. 3. Runs every 30 minutes. Tracks last video to avoid duplicates! |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Sticky Note node named "Setup Instructions":**  
   - Content:  
     ```
     🎬 **SETUP REQUIRED:**

     1. Get YouTube Channel RSS:  
        - Go to the channel page, view page source  
        - Find `channel/UC[CHANNEL_ID]`  
        - Construct RSS URL: https://www.youtube.com/feeds/videos.xml?channel_id=[ID]  
        - Replace in HTTP Request node

     2. Slack Connection:  
        - Connect Slack OAuth credentials in n8n  
        - Update channel in the final Slack node

     3. Timing:  
        - Runs every 30 minutes (adjust cron expression as needed)

     ✨ Tracks last video to avoid duplicates!
     ```  
   - Position: Top-left area for clear visibility.

2. **Add a Cron node named "Check Every 30 Minutes":**  
   - Set cron expression to `*/30 * * * *` (every 30 minutes).  
   - No additional parameters.  
   - Position it below the sticky note.

3. **Add an HTTP Request node named "Fetch YouTube RSS":**  
   - Method: GET  
   - URL: `https://www.youtube.com/feeds/videos.xml?channel_id=YOUR_CHANNEL_ID_HERE` (replace `YOUR_CHANNEL_ID_HERE` with actual channel ID).  
   - No authentication or extra HTTP options.  
   - Connect "Check Every 30 Minutes" node output to this node’s input.

4. **Add a Code node named "Parse RSS & Check for New Video":**  
   - Language: JavaScript  
   - Paste this logic to parse XML and check new video (simplified explanation):  
     - Extract `<entry>` elements from XML string.  
     - For each entry, extract title, link, published date, description, video ID.  
     - Sort entries by publish date descending.  
     - Determine if latest video published within last 2 hours.  
     - Return normalized JSON with video info and `is_new_video` flag.  
     - Return null if no new video detected.  
   - Connect "Fetch YouTube RSS" output to this node.

5. **Add a Code node named "Format Slack Message":**  
   - Language: JavaScript  
   - Use input JSON to build Slack message object with:  
     - Text headline  
     - Section block with title, formatted publish date, truncated description  
     - Action block with a "Watch Now" button linking to the video  
     - Context block with channel name and video ID link  
   - Set Slack channel name (default `#general`) as needed.  
   - Connect "Parse RSS & Check for New Video" output to this node.

6. **Add a Slack node named "Post to Slack":**  
   - Resource: Message  
   - Operation: Post  
   - Authentication: OAuth2 (set up Slack OAuth2 credentials in n8n)  
   - Parameters:  
     - Text: Expression `{{ $json.text }}`  
     - Channel: Expression `{{ $json.channel }}`  
     - Blocks: Set JSON string from `{{ JSON.stringify($json.blocks) }}`  
     - Username: Expression `{{ $json.username }}`  
     - Icon emoji: Expression `{{ $json.icon_emoji }}`  
   - Connect "Format Slack Message" output to this node.

7. **Set Node Connections:**  
   - Cron Trigger → Fetch YouTube RSS → Parse RSS & Check for New Video → Format Slack Message → Post to Slack.

8. **Configure Credentials:**  
   - Slack OAuth2 credentials must be created via Slack app with appropriate permissions (chat:write, channels:read etc.) and connected in n8n credentials.  
   - No credentials needed for HTTP Request node unless proxy or auth required.

9. **Adjust parameters:**  
   - Replace YouTube channel ID in HTTP Request URL.  
   - Replace Slack channel name in Slack message formatting code or Slack node.  
   - Adjust cron timing if needed.

10. **Activate workflow and test:**  
    - Run manually or wait for cron trigger.  
    - Verify that Slack messages post only for new videos published within last two hours.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                              |
|-----------------------------------------------------------------------------------------------------|----------------------------------------------|
| Workflow polls YouTube RSS feed every 30 minutes, which balances timely updates and API limits.     | Setup Instructions sticky note                |
| Slack OAuth2 app requires `chat:write` permission to post messages and must be authorized for target workspace. | Slack app creation documentation              |
| YouTube RSS feed URL format: `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`       | YouTube RSS feed standard                      |
| Video description truncated to 200 characters plus ellipsis to avoid Slack message length issues.   | Code node "Parse RSS & Check for New Video"   |
| Cron expression can be customized to adjust polling frequency.                                      | Cron node configuration                        |
| If YouTube changes RSS XML structure, regex parsing in code node may break and need updating.       | Potential maintenance note                      |
| To avoid duplicate notifications, workflow only announces videos published within last 2 hours.    | Prevents spamming Slack channel with repeats  |

---

**Disclaimer:** The provided text is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.