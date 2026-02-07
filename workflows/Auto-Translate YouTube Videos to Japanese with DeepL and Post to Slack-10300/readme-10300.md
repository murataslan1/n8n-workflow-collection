Auto-Translate YouTube Videos to Japanese with DeepL and Post to Slack

https://n8nworkflows.xyz/workflows/auto-translate-youtube-videos-to-japanese-with-deepl-and-post-to-slack-10300


# Auto-Translate YouTube Videos to Japanese with DeepL and Post to Slack

### 1. Workflow Overview

This workflow automates the process of monitoring a specific YouTube channel for new video uploads, translating the video titles and descriptions from English into Japanese using DeepL, and posting a formatted message with both original and translated content to a Slack channel. It is designed primarily for marketing, community, or internal communication teams targeting Japanese-speaking audiences who follow English-language YouTube content.

**Logical Blocks:**

- **1.1 Input Reception:** Detect new videos via the YouTube channel’s RSS feed.
- **1.2 Language Filtering:** Check if the video title is in English to determine if translation is needed.
- **1.3 Video Metadata Retrieval:** Fetch full video details (title, description) from YouTube API.
- **1.4 Data Formatting:** Prepare YouTube metadata into a single text block suitable for DeepL translation.
- **1.5 Translation:** Use DeepL API to translate the combined text into Japanese.
- **1.6 Data Merging and Output Formatting:** Combine original and translated data into a structured object and extract translated titles and descriptions cleanly.
- **1.7 Slack Posting:** Post the formatted message containing original and translated content to a Slack channel.
- **1.8 Skipped Video Notification:** If the video title is not in English, send a notification message to Slack indicating the video was skipped.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Watches the target YouTube channel's RSS feed to detect new video uploads and trigger workflow execution.

- **Nodes Involved:**  
  - RSS Trigger

- **Node Details:**  
  - **RSS Trigger**  
    - Type: RSS Feed Read Trigger  
    - Configuration: Watches the YouTube channel RSS feed URL `https://www.youtube.com/feeds/videos.xml?channel_id=UCYO_jab_esuFRV4b17AJtAw`  
    - Inputs: None (trigger node)  
    - Outputs: Passes new video items downstream  
    - Potential Failures: RSS feed unreachable, malformed feed, channel ID misconfiguration  
    - Version: 1  
    - Notes: Triggers workflow on new video detection automatically

#### 2.2 Language Filtering

- **Overview:**  
  Filters videos to process only those with English titles. Non-English titles are skipped and reported.

- **Nodes Involved:**  
  - Language Filter  
  - Send a message (Slack notification for skipped videos)

- **Node Details:**  
  - **Language Filter**  
    - Type: If node  
    - Configuration: Uses regex `^[A-Za-z0-9\s\W]+$` on the video title from the RSS feed item to detect English titles  
    - Inputs: RSS Trigger output  
    - Outputs:  
      - True branch: English title → proceed to fetch video details  
      - False branch: Non-English title → send Slack message about skip  
    - Potential Failures: Regex matching issues, missing title field  
    - Version: 2.2

  - **Send a message**  
    - Type: Slack node (Webhook)  
    - Configuration: Sends a message to Slack channel `CKUCBTG0H (general)` notifying that the video was skipped because the title is not English  
    - Inputs: Language Filter (false branch)  
    - Outputs: None (terminal for skipped videos)  
    - Credentials: Slack OAuth2  
    - Potential Failures: Slack API authentication, rate limits, webhook misconfiguration  
    - Version: 2.3

#### 2.3 Video Metadata Retrieval

- **Overview:**  
  Retrieves detailed video information such as full title and description using the YouTube API.

- **Nodes Involved:**  
  - Get a video

- **Node Details:**  
  - **Get a video**  
    - Type: YouTube node (API call)  
    - Configuration:  
      - Operation: `get` video snippet  
      - Video ID extracted from RSS feed item fields or link, with string manipulation to isolate ID  
    - Inputs: Language Filter (true branch)  
    - Outputs: Full video snippet JSON (title, description, etc.)  
    - Credentials: YouTube OAuth2  
    - Potential Failures: OAuth authentication failure, API rate limit, invalid video ID, network timeout  
    - Version: 1

#### 2.4 Data Formatting for Translation

- **Overview:**  
  Combines the video title and description into a single formatted string to be sent to DeepL for translation.

- **Nodes Involved:**  
  - Format YouTube Data for DeepL

- **Node Details:**  
  - **Format YouTube Data for DeepL**  
    - Type: Code node (JavaScript)  
    - Configuration: Extracts title, description, videoId, and constructs a text block as:  
      ```
      【Title】
      {title}

      【Description】
      {description}
      ```  
    - Inputs: Get a video node output  
    - Outputs: Object containing original title, description, videoId, link, and textToTranslate string  
    - Potential Failures: Missing fields in input JSON, code errors  
    - Version: 2

#### 2.5 Translation

- **Overview:**  
  Calls the DeepL API to translate the prepared text into Japanese.

- **Nodes Involved:**  
  - Translate a language

- **Node Details:**  
  - **Translate a language**  
    - Type: DeepL node  
    - Configuration:  
      - Text: expression referencing `textToTranslate` field from previous node  
      - Target language: Japanese (`JA`)  
    - Inputs: Format YouTube Data for DeepL  
    - Outputs: JSON response from DeepL with translated text  
    - Credentials: DeepL API (stored securely, no hardcoded keys)  
    - Potential Failures: API key invalid or expired, network issues, API quota exceeded  
    - Version: 1

#### 2.6 Data Merging and Output Formatting

- **Overview:**  
  Merges the original YouTube metadata and DeepL translation results into a single object, then extracts the translated title and description for Slack posting.

- **Nodes Involved:**  
  - Merge YouTube + DeepL Results1  
  - Format Translated Output

- **Node Details:**  
  - **Merge YouTube + DeepL Results1**  
    - Type: Merge node  
    - Configuration: Combine mode, combining all inputs into one object  
    - Inputs: Translate a language and Format YouTube Data for DeepL outputs  
    - Outputs: Single merged JSON object with original and translated data  
    - Potential Failures: Mismatched inputs, empty data sets  
    - Version: 3.2

  - **Format Translated Output**  
    - Type: Code node (JavaScript)  
    - Configuration: Parses DeepL translated text to extract translated title and description lines using regexes, then builds a clean JSON object for Slack consumption  
    - Inputs: Merge YouTube + DeepL Results1 output  
    - Outputs: JSON with `title` and `description` fields containing translated text  
    - Potential Failures: Unexpected DeepL response format, regex failures  
    - Version: 2

#### 2.7 Slack Posting

- **Overview:**  
  Posts a well-formatted message to Slack including both original and translated titles and descriptions, and a link to the video.

- **Nodes Involved:**  
  - Send to Slack

- **Node Details:**  
  - **Send to Slack**  
    - Type: Slack node  
    - Configuration:  
      - Posts to channel `#general`  
      - Message includes:  
        - Japanese title and description (translated)  
        - Original title and description  
        - Clickable YouTube link  
      - Uses Slack OAuth2 credentials  
    - Inputs: Format Translated Output  
    - Outputs: None (terminal node)  
    - Potential Failures: Slack API authentication or rate limits, formatting errors  
    - Version: 1

---

### 3. Summary Table

| Node Name                    | Node Type            | Functional Role                          | Input Node(s)                     | Output Node(s)                         | Sticky Note                                                                                                                              |
|------------------------------|----------------------|----------------------------------------|----------------------------------|---------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| RSS Trigger                  | RSS Feed Read Trigger | Detect new YouTube videos via RSS      | None                             | Language Filter                       | Overview of RSS Trigger function: triggers on new YouTube uploads                                                                         |
| Language Filter              | If                   | Filter English titles only              | RSS Trigger                     | Get a video (true), Send a message (false) | Language Filter notes: regex-based English title detection, skip non-English                                                        |
| Get a video                 | YouTube API           | Retrieve detailed video metadata        | Language Filter (true)            | Format YouTube Data for DeepL          | Retrieves full video details including title and description                                                                              |
| Format YouTube Data for DeepL | Code (JavaScript)    | Format title & description for translation | Get a video                    | Translate a language, Merge YouTube + DeepL Results1 | Prepares translation input for DeepL                                                                                                      |
| Translate a language         | DeepL API             | Translate text into Japanese            | Format YouTube Data for DeepL    | Merge YouTube + DeepL Results1         | DeepL translation API call                                                                                                                |
| Merge YouTube + DeepL Results1 | Merge               | Combine original and translated data   | Translate a language, Format YouTube Data for DeepL | Format Translated Output               | Combines original YouTube metadata with DeepL translation results                                                                        |
| Format Translated Output     | Code (JavaScript)     | Extract and clean translated text      | Merge YouTube + DeepL Results1   | Send to Slack                         | Formats DeepL output for Slack posting                                                                                                   |
| Send to Slack                | Slack                 | Post final formatted message           | Format Translated Output          | None                                  | Posts translated and original content to Slack channel                                                                                   |
| Send a message               | Slack (Webhook)       | Notify skipped videos (non-English)    | Language Filter (false)           | None                                  | Sends Slack message for skipped videos due to non-English title                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create RSS Trigger node**  
   - Type: RSS Feed Read Trigger  
   - URL: `https://www.youtube.com/feeds/videos.xml?channel_id=YOUR_CHANNEL_ID` (replace `YOUR_CHANNEL_ID`)  
   - Purpose: Trigger on new video uploads

2. **Add Language Filter node (If node)**  
   - Condition: Check if `{{ $json.title }}` matches regex `^[A-Za-z0-9\s\W]+$` (English title detection)  
   - Connect `RSS Trigger` output to this node’s input

3. **Add Slack node ("Send a message") for skipped videos**  
   - Type: Slack (Webhook)  
   - Slack Channel: set to your desired channel (e.g., `#general`) or channel ID  
   - Message Text: Japanese message notifying video skipped due to non-English title  
   - Connect Language Filter false branch to this node

4. **Add "Get a video" YouTube node**  
   - Operation: `get` video snippet  
   - Video ID: Extract from RSS feed item using expression and string manipulation to isolate video ID  
   - Connect Language Filter true branch to this node  
   - Configure YouTube OAuth2 credentials

5. **Add "Format YouTube Data for DeepL" Code node**  
   - JavaScript code: Extract title, description, videoId, and construct translation input string as specified  
   - Connect `Get a video` output to this node

6. **Add DeepL node ("Translate a language")**  
   - Text input: `={{ $json.textToTranslate }}` from previous node  
   - Translate to language: Japanese (`JA`)  
   - Configure DeepL credentials (API key stored securely)  
   - Connect `Format YouTube Data for DeepL` node output to this node

7. **Add Merge node ("Merge YouTube + DeepL Results1")**  
   - Mode: Combine  
   - Connect two inputs: one from `Translate a language` and one from `Format YouTube Data for DeepL` (second output)  
   - Purpose: Combine original and translated data

8. **Add Code node ("Format Translated Output")**  
   - JavaScript code: Parses translated text to extract clean title and description text for Slack  
   - Connect output of Merge node to this node

9. **Add Slack node ("Send to Slack")**  
   - Channel: `#general` or configured channel  
   - Message Text: Formatted message including Japanese title, description, original title, original description, and clickable YouTube link using expressions from merged data  
   - Connect `Format Translated Output` output to this node  
   - Configure Slack OAuth2 credentials

10. **Test the workflow**  
    - Run manually or wait for new YouTube video detected by RSS  
    - Verify Slack message contains both original and translated content properly formatted

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                       |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| This workflow is ideal for marketing or community teams sharing English-speaking YouTube content with Japanese audiences, internal comms teams, or language learners.                                                                                                                                                                                         | Workflow Overview sticky note                                                                        |
| Replace `YT_CHANNEL_ID`, `TARGET_LANG` (currently Japanese), and `SLACK_CHANNEL` parameters as needed in a dedicated configuration node or environment variables.                                                                                                                                                                                              | Setup checklist sticky note                                                                          |
| DeepL API keys should never be hardcoded in HTTP request nodes; use n8n credentials to store API keys securely and avoid exposure.                                                                                                                                                                                                                              | DeepL Translation sticky note                                                                        |
| Slack message format uses simple text; consider upgrading to Slack Block Kit for richer formatting or threading.                                                                                                                                                                                                                                               | Slack Posting sticky note                                                                            |
| YouTube and Slack APIs enforce rate limits; consider adding error handling or retry logic for production workload.                                                                                                                                                                                                                                             | General operational notes                                                                            |
| Optional: Add filters to exclude Shorts or videos with titles/descriptions under a certain length to reduce noise.                                                                                                                                                                                                                                             | Customization suggestions in overview sticky note                                                  |
| Useful video demo or Loom links can be embedded in Slack notifications or documentation for team onboarding.                                                                                                                                                                                                                                                  | Send a message sticky note                                                                           |
| Keep credentials updated and rotate keys if accidental exposure occurs. Avoid committing keys in version control.                                                                                                                                                                                                                                              | Security best practices                                                                              |

---

**Disclaimer:**  
The content above is strictly derived from an n8n automated workflow. All data processed is legal and publicly available, adhering to content policies.