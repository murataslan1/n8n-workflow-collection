Auto Summarize YouTube Videos to Japanese with GPT-4o-mini & Post to Slack

https://n8nworkflows.xyz/workflows/auto-summarize-youtube-videos-to-japanese-with-gpt-4o-mini---post-to-slack-9847


# Auto Summarize YouTube Videos to Japanese with GPT-4o-mini & Post to Slack

### 1. Workflow Overview

This workflow automates the process of summarizing newly uploaded YouTube videos from a specific channel and posting the summary in Japanese to a designated Slack channel. It is designed for content managers, social media teams, or anyone needing quick digestible insights from video content in Japanese without manual effort. The workflow is structured into the following logical blocks:

- **1.1 Input Reception:** Detect new video uploads from a YouTube channel via RSS feed.
- **1.2 Transcript Retrieval:** Fetch the video's transcript text using an external API.
- **1.3 Transcript Processing:** Combine segmented transcript data into a single block of text.
- **1.4 AI Summarization:** Generate a concise, three-sentence summary in Japanese using GPT-4o-mini.
- **1.5 Slack Posting:** Automatically post the video details and summary to a Slack channel.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block monitors a YouTube channel RSS feed and triggers the workflow upon detecting new video uploads.

**Nodes Involved:**  
- YouTube RSS Trigger (Channel 1)  
- Sticky: HTTP Info1

**Node Details:**  

- **YouTube RSS Trigger (Channel 1)**  
  - Type: RSS Feed Read Trigger  
  - Role: Watches a specified YouTube channel’s RSS feed URL for new video uploads.  
  - Configuration: Polls every 1 minute to detect new entries. The feed URL is set as `https://www.youtube.com/feeds/videos.xml?channel_id=` (channel_id to be appended).  
  - Input: None (trigger node)  
  - Output: Emits new video metadata JSON upon detection.  
  - Edge Cases: If the feed URL is invalid or the channel ID is missing, the node will not trigger. Network or connectivity issues could cause missed triggers or delays.  
  - Sticky Note: Explains the node monitors new YouTube uploads automatically.

- **Sticky: HTTP Info1**  
  - Type: Sticky Note  
  - Role: Provides contextual information about the YouTube RSS trigger node.  
  - Content: Describes monitoring of the YouTube channel RSS feed for new videos.

---

#### 1.2 Transcript Retrieval

**Overview:**  
Fetches the transcript of the detected video using the “youtube-transcript3” API accessed through RapidAPI.

**Nodes Involved:**  
- Get YouTube Transcript via RapidAPI  
- Sticky: HTTP Info

**Node Details:**  

- **Get YouTube Transcript via RapidAPI**  
  - Type: HTTP Request  
  - Role: Calls the external RapidAPI service to retrieve video transcripts (captions/subtitles).  
  - Configuration:  
    - Dynamic URL built from the video ID extracted from the RSS trigger (`videoId={{$json["id"].replace("yt:video:", "")}}`).  
    - Headers include `x-rapidapi-key` and `x-rapidapi-host` for authentication.  
  - Input: Metadata from the RSS trigger node, specifically the video ID.  
  - Output: Returns transcript data as an array of time-stamped text segments.  
  - Edge Cases:  
    - API key invalid or missing leads to auth errors.  
    - Video may not have a transcript available, resulting in empty or error responses.  
    - Rate limiting or connectivity failures possible.  
  - Sticky Note: Describes use of “youtube-transcript3” API for subtitle retrieval supporting English and Japanese.

- **Sticky: HTTP Info**  
  - Type: Sticky Note  
  - Role: Explains the purpose and function of the HTTP request node for transcript retrieval.

---

#### 1.3 Transcript Processing

**Overview:**  
This block merges all segmented transcript pieces into a single plain text string to facilitate AI processing.

**Nodes Involved:**  
- Combine Transcript Text (Code)  
- Sticky: Code Info

**Node Details:**  

- **Combine Transcript Text (Code)**  
  - Type: Code (JavaScript)  
  - Role: Concatenates all transcript text segments into a single string and pairs this with video metadata (title and link).  
  - Configuration:  
    - Accesses RSS trigger data for video title and link.  
    - Maps over the transcript array to join all text fields with spaces.  
    - Returns a JSON object with keys: `title`, `link`, and `full_text`.  
  - Input: Transcript JSON from RapidAPI node and RSS trigger JSON as referenced.  
  - Output: Single JSON object with combined transcript text.  
  - Edge Cases: If transcript is empty or missing, output `full_text` will be empty string, which may affect downstream summarization.  
  - Sticky Note: Describes purpose of this node to combine transcript segments into a clean text block.

- **Sticky: Code Info**  
  - Type: Sticky Note  
  - Role: Provides contextual explanation of the code node’s function.

---

#### 1.4 AI Summarization

**Overview:**  
Uses OpenAI GPT-4o-mini model to generate a concise, three-sentence summary of the YouTube video transcript in Japanese.

**Nodes Involved:**  
- Generate Japanese Summary (OpenAI)  
- Sticky: OpenAI Info

**Node Details:**  

- **Generate Japanese Summary (OpenAI)**  
  - Type: OpenAI (Langchain) Node  
  - Role: Sends combined transcript text to GPT-4o-mini to produce a Japanese summary.  
  - Configuration:  
    - Model: `gpt-4o-mini`  
    - Prompt: "Summarize the following YouTube video transcript into **3 concise sentences in Japanese.**" followed by the transcript text.  
  - Input: JSON with `full_text` from the code node.  
  - Output: JSON containing the generated summary text under `message.content`.  
  - Credential: OpenAI API key required with sufficient quota.  
  - Edge Cases:  
    - API key invalid or quota exceeded leads to errors.  
    - Very short or empty transcripts may produce irrelevant or empty summaries.  
    - Network timeouts or API failures possible.  
  - Sticky Note: Notes the function is to generate a 3-line Japanese summary for Slack posting.

- **Sticky: OpenAI Info**  
  - Type: Sticky Note  
  - Role: Explains the summarization purpose and model choice.

---

#### 1.5 Slack Posting

**Overview:**  
Posts the video metadata and generated Japanese summary to a specified Slack channel for team visibility.

**Nodes Involved:**  
- Send Summary to Slack (#youtube-summary)  
- Sticky: Slack Info

**Node Details:**  

- **Send Summary to Slack (#youtube-summary)**  
  - Type: Slack Node  
  - Role: Sends a formatted message containing video publish date, title, link, and AI summary to Slack channel `#youtube-summary`.  
  - Configuration:  
    - Text composed using expressions referencing the RSS trigger for date, title, and link, plus the OpenAI node for the summary content.  
    - Channel ID set to “C09LVUG4S5U” (specific Slack channel).  
    - Authentication: OAuth2 with a connected Slack user account.  
  - Input: Output of the OpenAI summarizer node.  
  - Output: Slack message post confirmation.  
  - Edge Cases:  
    - Slack authentication errors or permission issues can block posting.  
    - Channel ID must be valid and accessible by the OAuth2 user.  
    - Message formatting errors or rate limits could cause failures.  
  - Sticky Note: Details the automatic posting of video summaries to Slack.

- **Sticky: Slack Info**  
  - Type: Sticky Note  
  - Role: Provides context for Slack node usage.

---

### 3. Summary Table

| Node Name                      | Node Type                     | Functional Role                        | Input Node(s)                  | Output Node(s)                    | Sticky Note                                                                                   |
|-------------------------------|-------------------------------|-------------------------------------|-------------------------------|----------------------------------|----------------------------------------------------------------------------------------------|
| YouTube RSS Trigger (Channel 1) | RSS Feed Read Trigger          | Detect new YouTube video uploads    | None                          | Get YouTube Transcript via RapidAPI | Explains monitoring of YouTube uploads via RSS feed                                         |
| Get YouTube Transcript via RapidAPI | HTTP Request                  | Retrieve video transcript via API   | YouTube RSS Trigger (Channel 1) | Combine Transcript Text (Code)   | Uses “youtube-transcript3” API via RapidAPI for subtitle retrieval in English/Japanese      |
| Combine Transcript Text (Code) | Code                          | Merge transcript segments into text | Get YouTube Transcript via RapidAPI | Generate Japanese Summary (OpenAI) | Combines transcript text segments for AI processing                                         |
| Generate Japanese Summary (OpenAI) | OpenAI (Langchain) Node        | Generate 3-sentence Japanese summary | Combine Transcript Text (Code) | Send Summary to Slack (#youtube-summary) | Summarizes video transcript into Japanese for Slack posting                                 |
| Send Summary to Slack (#youtube-summary) | Slack                         | Post summary and video info to Slack | Generate Japanese Summary (OpenAI) | None                            | Auto-posts video title, link, and Japanese summary to #youtube-summary Slack channel        |
| Sticky: HTTP Info1             | Sticky Note                   | Info on YouTube RSS trigger          | None                          | None                             | Describes detection of new YouTube uploads via RSS                                          |
| Sticky: HTTP Info              | Sticky Note                   | Info on HTTP request for transcript  | None                          | None                             | Details use of YouTube transcript API via RapidAPI                                         |
| Sticky: Code Info              | Sticky Note                   | Info on code node merging transcripts | None                          | None                             | Explains combining transcript text segments                                                |
| Sticky: OpenAI Info            | Sticky Note                   | Info on OpenAI summarization          | None                          | None                             | Describes summarization of video captions into Japanese                                    |
| Sticky: Slack Info             | Sticky Note                   | Info on Slack posting                 | None                          | None                             | Explains posting summary and video info to Slack                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create RSS Feed Trigger Node**  
   - Type: RSS Feed Read Trigger  
   - Name: `YouTube RSS Trigger (Channel 1)`  
   - Parameters:  
     - Feed URL: `https://www.youtube.com/feeds/videos.xml?channel_id=<YOUR_CHANNEL_ID>` (replace `<YOUR_CHANNEL_ID>` with your target YouTube channel ID)  
     - Poll times: Every 1 minute  

2. **Create HTTP Request Node to Fetch Transcript**  
   - Type: HTTP Request  
   - Name: `Get YouTube Transcript via RapidAPI`  
   - Parameters:  
     - URL: `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId={{$json["id"].replace("yt:video:", "")}}`  
     - Headers:  
       - `x-rapidapi-key`: set to your RapidAPI key  
       - `x-rapidapi-host`: `youtube-transcript3.p.rapidapi.com`  
     - Enable sending headers  
   - Connect input from `YouTube RSS Trigger (Channel 1)` node  

3. **Create Code Node to Combine Transcript Segments**  
   - Type: Code (JavaScript)  
   - Name: `Combine Transcript Text (Code)`  
   - Code:  
     ```javascript
     const rss = $item(0, 0).$node["YouTube RSS Trigger (Channel 1)"].json;
     const transcript = $json.transcript || [];

     return {
       json: {
         title: rss.title,
         link: rss.link,
         full_text: transcript.map(t => t.text).join(' '),
       },
     };
     ```  
   - Connect input from `Get YouTube Transcript via RapidAPI` node  

4. **Create OpenAI Node for Japanese Summary**  
   - Type: OpenAI (Langchain) Node  
   - Name: `Generate Japanese Summary (OpenAI)`  
   - Parameters:  
     - Model ID: `gpt-4o-mini`  
     - Messages:  
       - Content:  
         ``` 
         Summarize the following YouTube video transcript into **3 concise sentences in Japanese.**  
         {{$json["full_text"]}}  
         ```  
   - Credentials: Configure OpenAI API credential with valid API key  
   - Connect input from `Combine Transcript Text (Code)` node  

5. **Create Slack Node to Post Summary**  
   - Type: Slack  
   - Name: `Send Summary to Slack (#youtube-summary)`  
   - Parameters:  
     - Text:  
       ```
       🎥 *New YouTube Video Summary*

       🕒 Posted: {{ $('YouTube RSS Trigger (Channel 1)').item.json.pubDate }}
       🧩 Title: {{ $('YouTube RSS Trigger (Channel 1)').item.json.title }}
       🔗 Link: {{ $('YouTube RSS Trigger (Channel 1)').item.json.link }}
       📝 Summary: {{$json["message"]["content"]}}
       ```  
     - Channel: Select or enter channel ID `C09LVUG4S5U` (adjust to your Slack channel)  
     - Authentication: OAuth2 with Slack account connected  
   - Connect input from `Generate Japanese Summary (OpenAI)` node  

6. **Verify all connections:**  
   - `YouTube RSS Trigger (Channel 1)` → `Get YouTube Transcript via RapidAPI` → `Combine Transcript Text (Code)` → `Generate Japanese Summary (OpenAI)` → `Send Summary to Slack (#youtube-summary)`

7. **Set up required credentials:**  
   - RapidAPI key for the YouTube transcript API  
   - OpenAI API key for GPT-4o-mini access  
   - Slack OAuth2 credentials with proper permissions to post messages in your desired Slack channel  

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                 |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Uses “youtube-transcript3” API via RapidAPI for transcript retrieval supporting English and Japanese videos. | https://rapidapi.com/ (for API key setup and documentation)                                    |
| GPT-4o-mini model employed for efficient and cost-effective summarization in Japanese.           | OpenAI official docs: https://platform.openai.com/docs/models/gpt-4o-mini                      |
| Slack OAuth2 authentication required with permission to post to the specified channel.           | Slack API docs: https://api.slack.com/authentication/oauth-v2                                |
| The workflow polls YouTube RSS feed every minute; adjust polling frequency to balance timeliness and API limits. | YouTube RSS feeds: https://developers.google.com/youtube/v3/guides/implementation/rss-feeds    |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.