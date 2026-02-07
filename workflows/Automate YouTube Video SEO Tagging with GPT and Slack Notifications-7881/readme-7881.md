Automate YouTube Video SEO Tagging with GPT and Slack Notifications

https://n8nworkflows.xyz/workflows/automate-youtube-video-seo-tagging-with-gpt-and-slack-notifications-7881


# Automate YouTube Video SEO Tagging with GPT and Slack Notifications

### 1. Workflow Overview

This workflow automates the generation and application of SEO-friendly tags for YouTube videos using AI, enhancing video discoverability and reach. It targets YouTube creators, channel managers, and marketing teams who want to streamline SEO tag management and receive real-time notifications on tagging outcomes.

The workflow logically divides into these functional blocks:

- **1.1 Scheduled Trigger & Setup:** Weekly initiation and channel ID configuration.
- **1.2 Video Retrieval:** Fetch all videos uploaded in the last week and get detailed metadata.
- **1.3 AI-Powered Tag Generation:** Use an AI agent (Large Language Model) to generate SEO-optimized tags based on video metadata.
- **1.4 Update YouTube Videos:** Apply the AI-generated tags to the respective videos via YouTube API.
- **1.5 Notification:** Send Slack messages confirming successful tagging for team awareness.

Supporting notes and optional Telegram notification node complement these core blocks.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Scheduled Trigger & Setup

**Overview:**  
This block triggers the workflow once per week and prepares the channel information needed for subsequent API calls.

**Nodes Involved:**  
- Weekly Schedule Trigger  
- Set Channel Information

**Node Details:**

- **Weekly Schedule Trigger**  
  - *Type:* Schedule Trigger  
  - *Role:* Initiates the workflow weekly.  
  - *Configuration:* Runs on a weekly interval (default day/time to be set by user).  
  - *Inputs:* None (trigger node).  
  - *Outputs:* Connects to Set Channel Information.  
  - *Edge Cases:* Misconfigured schedule could cause missed or repeated runs.

- **Set Channel Information**  
  - *Type:* Set  
  - *Role:* Assigns the YouTube Channel ID to a variable for filtering videos.  
  - *Configuration:* Hardcoded string assignment for `Channel_Id`.  
  - *Key Expression:* `Channel_Id` = `"UCOdDjEyCCUQECkzWHxTF5iw"` (example channel)  
  - *Inputs:* From Weekly Schedule Trigger.  
  - *Outputs:* Connects to Get all videos uploaded last week.  
  - *Edge Cases:* Incorrect Channel ID leads to no videos fetched.

---

#### 1.2 Video Retrieval

**Overview:**  
Fetches all videos uploaded in the last week for the configured channel, then retrieves detailed metadata for each video.

**Nodes Involved:**  
- Get all videos uploaded last week  
- Get video detail

**Node Details:**

- **Get all videos uploaded last week**  
  - *Type:* YouTube node (video resource)  
  - *Role:* Lists videos uploaded after a dynamic date (last 1 day in config, though note the sticky note suggests 7 days).  
  - *Configuration:*  
    - Filter: `channelId` set to `Channel_Id` from previous node  
    - `publishedAfter`: expression `={{ $today.minus(1, 'days') }}` (to be adjusted to 7 days for weekly runs)  
    - Order by date, return all results.  
  - *Inputs:* From Set Channel Information.  
  - *Outputs:* To Get video detail.  
  - *Credentials:* YouTube OAuth2 API with required scopes.  
  - *Edge Cases:* API quota limits, empty results if no videos uploaded, incorrect date filter.

- **Get video detail**  
  - *Type:* YouTube node (video resource, get operation)  
  - *Role:* Retrieves detailed info for each video ID obtained previously.  
  - *Configuration:* Maps videoId from `Get all videos uploaded last week` output.  
  - *Inputs:* From Get all videos uploaded last week.  
  - *Outputs:* To Youtube Video Auto Tagging Agent.  
  - *Credentials:* YouTube OAuth2 API.  
  - *Edge Cases:* API failures, missing video info, rate limiting.

---

#### 1.3 AI-Powered Tag Generation

**Overview:**  
Leverages an AI agent with a system prompt designed as an expert YouTube SEO strategist to generate 15–20 relevant, SEO-friendly tags for each video.

**Nodes Involved:**  
- Youtube Video Auto Tagging Agent  
- OpenAI Chat Model

**Node Details:**

- **Youtube Video Auto Tagging Agent**  
  - *Type:* Langchain Agent Node  
  - *Role:* Generates a comma-separated list of SEO tags based on video title, description, and channel name.  
  - *Configuration:*  
    - User prompt template includes video title, description, channel name dynamically inserted.  
    - System prompt defines strict SEO tag generation rules (avoid duplicates, hashtags, 15–20 tags, diverse keywords).  
    - Uses GPT-4.1-mini model (via linked OpenAI Chat Model node).  
  - *Inputs:* From Get video detail (for video metadata), and from OpenAI Chat Model (language model).  
  - *Outputs:* To Update video with AI generated tags.  
  - *Edge Cases:* AI generating irrelevant or malformed tags, API rate limits, prompt failures.  
  - *Version:* 2.1  

- **OpenAI Chat Model**  
  - *Type:* Langchain Chat Model Node  
  - *Role:* Provides GPT-4.1-mini LLM to the Agent node.  
  - *Configuration:* Model set to GPT-4.1-mini, no special options.  
  - *Credentials:* OpenAI API key.  
  - *Inputs:* None directly; outputs to Agent as language model.  
  - *Outputs:* To Youtube Video Auto Tagging Agent.  
  - *Edge Cases:* API key expiration, quota exhaustion, network timeouts.

---

#### 1.4 Update YouTube Videos

**Overview:**  
Writes the AI-generated tags back to the corresponding videos on YouTube, updating the video metadata to improve SEO.

**Nodes Involved:**  
- Update video with AI generated tags

**Node Details:**

- **Update video with AI generated tags**  
  - *Type:* YouTube node (video resource, update operation)  
  - *Role:* Updates video tags and description using AI output.  
  - *Configuration:*  
    - Video ID and title sourced from “Get video detail” node.  
    - Tags set to AI-generated output from Agent node.  
    - Category and region code set to fixed values (CategoryId: 28, RegionCode: VN).  
  - *Inputs:* From Youtube Video Auto Tagging Agent.  
  - *Outputs:* To Inform via slack message and optionally to Telegram node.  
  - *Credentials:* YouTube OAuth2 API.  
  - *Edge Cases:* API quota limits, update conflicts, malformed tag strings, missing video ID.

---

#### 1.5 Notification

**Overview:**  
Sends confirmation messages to Slack (and optionally Telegram) with details of the tagging operation for team visibility.

**Nodes Involved:**  
- Inform via slack message  
- Alternative channel to inform (disabled)  

**Node Details:**

- **Inform via slack message**  
  - *Type:* Slack node (message posting)  
  - *Role:* Posts a message to Slack indicating successful tagging with video title, ID, and tags.  
  - *Configuration:*  
    - Message text includes dynamic references to video title, video ID, and AI-generated tags.  
    - Sends message as specific Slack user `@trung.tran`.  
    - Uses OAuth2 authentication.  
  - *Inputs:* From Update video with AI generated tags.  
  - *Outputs:* None.  
  - *Credentials:* Slack OAuth2 API with `chat:write` scope.  
  - *Edge Cases:* Slack API rate limits, authentication failures, message formatting errors.

- **Alternative channel to inform** (disabled)  
  - *Type:* Telegram node  
  - *Role:* Optional alternative notification channel.  
  - *Configuration:* Similar message format as Slack.  
  - *Disabled:* Not active in the workflow.  
  - *Edge Cases:* If enabled, Telegram API issues, invalid chat ID.

---

### 3. Summary Table

| Node Name                     | Node Type                        | Functional Role                              | Input Node(s)                     | Output Node(s)                            | Sticky Note                                                                                                                     |
|-------------------------------|---------------------------------|----------------------------------------------|----------------------------------|-------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Weekly Schedule Trigger        | Schedule Trigger                 | Initiates workflow weekly                     | None                             | Set Channel Information                    | ### 1. Weekly Schedule Trigger The workflow starts automatically once per week, ensuring newly uploaded videos are processed on schedule. |
| Set Channel Information        | Set                             | Assigns YouTube Channel ID                    | Weekly Schedule Trigger          | Get all videos uploaded last week         | ### 2. Get All Videos Uploaded Last Week Fetches a list of all videos uploaded to the channel in the past 7 days.                |
| Get all videos uploaded last week | YouTube (list videos)          | Fetches videos published within last week    | Set Channel Information          | Get video detail                          |                                                                                                                                |
| Get video detail               | YouTube (get video)             | Retrieves detailed video metadata             | Get all videos uploaded last week | Youtube Video Auto Tagging Agent          | ### 3. Get Video Detail Retrieves each video’s title, description, and ID to prepare for SEO tag generation.                    |
| OpenAI Chat Model              | Langchain Chat Model            | Provides GPT-4.1-mini LLM                     | None                             | Youtube Video Auto Tagging Agent           |                                                                                                                                |
| Youtube Video Auto Tagging Agent | Langchain Agent                | Generates SEO-friendly tags using AI          | Get video detail, OpenAI Chat Model | Update video with AI generated tags        | ### 4. YouTube Video Auto Tagging Agent Uses an AI SEO expert prompt to generate 15–20 relevant, comma-separated tags based on the video title, description, and channel name. |
| Update video with AI generated tags | YouTube (update video)        | Updates YouTube video tags with AI output     | Youtube Video Auto Tagging Agent | Inform via slack message, Alternative channel to inform | ### 5. Update Video with AI-Generated Tags Updates each video in YouTube with the newly generated SEO-friendly tags.            |
| Inform via slack message       | Slack                          | Sends Slack notification on tagging success  | Update video with AI generated tags | None                                    | ### 6. Inform via Slack Message Sends a confirmation message to Slack with the video title, ID, and the tags applied, keeping the team informed. |
| Alternative channel to inform  | Telegram (disabled)             | Optional notification via Telegram            | Update video with AI generated tags | None                                    | (Optional) Customize this node to send message via Telegram, in case you're not using Slack                                        |
| Sticky Note                   | Sticky Note                    | Visual notes                                 | None                             | None                                      | ![](https://s3.ap-southeast-1.amazonaws.com/automatewith.me/Screenshot+2025-08-26+at+1.19.18%E2%80%AFPM.png)                  |
| Sticky Note1                  | Sticky Note                    | Visual notes                                 | None                             | None                                      | ![](https://s3.ap-southeast-1.amazonaws.com/automatewith.me/Screenshot+2025-08-26+at+1.21.47%E2%80%AFPM.png)                  |
| Sticky Note2                  | Sticky Note                    | Workflow detailed description and setup instructions | None                             | None                                      | # AI-Powered YouTube Auto-Tagging Workflow (SEO Automation) ... (full content in section 5)                                      |
| Sticky Note3                  | Sticky Note                    | Notes on Weekly Schedule Trigger              | None                             | None                                      | ### 1. Weekly Schedule Trigger The workflow starts automatically once per week, ensuring newly uploaded videos are processed on schedule. |
| Sticky Note4                  | Sticky Note                    | Notes on Get All Videos Uploaded Last Week    | None                             | None                                      | ### 2. Get All Videos Uploaded Last Week Fetches a list of all videos uploaded to the channel in the past 7 days.                |
| Sticky Note5                  | Sticky Note                    | Notes on Get Video Detail                      | None                             | None                                      | ### 3. Get Video Detail Retrieves each video’s title, description, and ID to prepare for SEO tag generation.                    |
| Sticky Note6                  | Sticky Note                    | Notes on YouTube Video Auto Tagging Agent     | None                             | None                                      | ### 4. YouTube Video Auto Tagging Agent Uses an AI SEO expert prompt to generate 15–20 relevant, comma-separated tags based on the video title, description, and channel name. |
| Sticky Note7                  | Sticky Note                    | Notes on Update Video with AI-Generated Tags  | None                             | None                                      | ### 5. Update Video with AI-Generated Tags Updates each video in YouTube with the newly generated SEO-friendly tags.            |
| Sticky Note8                  | Sticky Note                    | Notes on Inform via Slack Message              | None                             | None                                      | ### 6. Inform via Slack Message Sends a confirmation message to Slack with the video title, ID, and the tags applied, keeping the team informed. |
| Sticky Note9                  | Sticky Note                    | Optional Telegram notification note            | None                             | None                                      | (Optional) Customize this node to send message via Telegram, in case you're not using Slack                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n.

2. **Add a `Schedule Trigger` node** (Weekly Schedule Trigger):  
   - Set to trigger weekly at your preferred day/time.

3. **Add a `Set` node** (Set Channel Information):  
   - Add a string field named `Channel_Id`.  
   - Assign your YouTube channel ID as the value (e.g., `"UCOdDjEyCCUQECkzWHxTF5iw"`).  
   - Connect Schedule Trigger → Set Channel Information.

4. **Add a `YouTube` node** (Get all videos uploaded last week):  
   - Operation: List Videos (`video` resource).  
   - Filters:  
     - `channelId`: set to expression `{{ $json.Channel_Id }}` from Set node.  
     - `publishedAfter`: expression `{{ $today.minus(7, 'days') }}` for 7-day lookback.  
   - Options: Order by date, return all.  
   - Credentials: Configure YouTube OAuth2 with scopes `youtube.readonly`.  
   - Connect Set Channel Information → Get all videos uploaded last week.

5. **Add another `YouTube` node** (Get video detail):  
   - Operation: Get Video.  
   - Video ID: map from `Get all videos uploaded last week` node, e.g., `{{ $json.id.videoId }}`.  
   - Credentials: Same YouTube OAuth2.  
   - Connect Get all videos uploaded last week → Get video detail.

6. **Add an `OpenAI Chat Model` node:**  
   - Select Langchain Chat Model node.  
   - Model: Set to GPT-4.1-mini or equivalent.  
   - Credentials: Provide OpenAI API key.  
   - No additional options needed.  
   - This node has no input connection.

7. **Add a `Langchain Agent` node** (Youtube Video Auto Tagging Agent):  
   - Prompt Type: Define.  
   - System Message (SEO Expert Prompt):  
     ```
     You are an expert YouTube SEO strategist.
     Your goal is to generate a list of highly relevant, diverse, and SEO-friendly tags for a YouTube video based on its title, description, and channel name.
     The tags should:
     - Improve discoverability and ranking on YouTube search and recommendations
     - Cover both specific keywords (directly related to the video) and broader categories (general niche)
     - Include variations (short-tail and long-tail keywords)
     - Avoid duplicates, irrelevant terms, or hashtags (#)
     - Be limited to 15–20 tags, formatted as a clean comma-separated list
     - Prioritize high-search-intent keywords that align with the channel’s theme
     ```
   - User Prompt:  
     ```
     Here is my YouTube video information:

     Title: {{ $json.snippet.title }}
     Description: {{ $json.snippet.description }}
     Channel Name: {{ $json.snippet.channelTitle }}

     Please analyze this information and provide me with the most relevant and SEO-friendly tags (15–20, comma-separated).
     Focus on tags that increase reach, match viewer search intent, and balance between trending keywords and niche keywords.
     ```
   - Connect `Get video detail` → Agent node (main input).  
   - Connect `OpenAI Chat Model` → Agent node (ai_languageModel input).  
   - Version: 2.1 or latest supported.

8. **Add a `YouTube` node** (Update video with AI generated tags):  
   - Operation: Update Video.  
   - Video ID: `{{ $('Get video detail').item.json.id }}`  
   - Title: `{{ $('Get video detail').item.json.snippet.title }}`  
   - CategoryId: `28` (preset)  
   - RegionCode: `VN` (preset)  
   - Update Fields:  
     - `tags`: `{{ $json.output }}` (AI-generated tags from Agent node)  
     - `description`: preserve existing `{{ $('Get video detail').item.json.snippet.description }}`  
   - Credentials: YouTube OAuth2 with `youtube` or `youtube.force-ssl` scope for write access.  
   - Connect Agent node → Update video with AI generated tags.

9. **Add a `Slack` node** (Inform via slack message):  
   - Authentication: OAuth2 with Slack Bot Token having `chat:write` scope.  
   - Text:  
     ```
     The video "{{ $json.snippet.title }} - {{ $json.id }}" has been auto-tagged successfully with the following tags: {{ $('Youtube Video Auto Tagging Agent').item.json.output }}
     ```  
   - User: set mode to username, value `@trung.tran` or your preferred Slack user.  
   - Connect Update video with AI generated tags → Slack node.

10. *(Optional)* Add a `Telegram` node for alternative notifications:  
    - Configure with Telegram Bot API credentials.  
    - Disabled by default.  
    - Connect Update video with AI generated tags → Telegram node if enabled.

11. **Set proper credentials** for YouTube, OpenAI, Slack (and Telegram if used).

12. **Test run:**  
    - Manually trigger the workflow with a recent video.  
    - Verify tags appear in YouTube Studio and Slack message posts.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                                                                                      |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| # AI-Powered YouTube Auto-Tagging Workflow (SEO Automation)  Supercharge your YouTube SEO with this AI-powered workflow that automatically generates and applies smart, SEO-friendly tags to your new videos every week. No more manual tagging, just better discoverability, improved reach, and consistent optimization. Plus, get instant Slack notifications so your team stays updated on every video’s SEO boost.  Who’s it for: YouTube creators, agencies, marketing teams. How it works: Weekly schedule, video fetch, AI tag generation, update, notification. Setup includes YouTube and Slack credentials. Requirements include API scopes, rate limits, and prompt tuning options. | Full detailed description embedded in Sticky Note2 node content within the workflow JSON.                         |
| See screenshots for UI and node configuration examples:  ![](https://s3.ap-southeast-1.amazonaws.com/automatewith.me/Screenshot+2025-08-26+at+1.19.18%E2%80%AFPM.png) and ![](https://s3.ap-southeast-1.amazonaws.com/automatewith.me/Screenshot+2025-08-26+at+1.21.47%E2%80%AFPM.png)                                                                                                                                                                                                                                                                                                                                                          | Sticky Note and Sticky Note1 nodes in workflow.                                                                     |
| YouTube API scopes: `youtube.readonly` (for fetching), `youtube` or `youtube.force-ssl` (for updating). Slack Bot Token scopes: `chat:write`. Ensure OAuth2 credentials are set up correctly with required permissions.                                                                                                                                                                                                                                                                                                                                                                                              | Setup requirements summary from Sticky Note2.                                                                       |
| Potential customizations: Change schedule frequency, filter videos by title or tags before processing, tune prompt to add brand keywords, enforce tag length limits, add safety checks for tags, implement human approval steps, multi-channel support, error reporting in Slack.                                                                                                                                                                                                                                                                                                                                                                   | Suggestions from Sticky Note2 for extending or customizing workflow.                                                 |
| Rate limit considerations: YouTube API quotas can be consumed quickly when updating tags. Consider throttling updates to 1–2 per second. Validate AI output to avoid malformed tags causing API errors.                                                                                                                                                                                                                                                                                                                                                                                                        | Best practice notes from Sticky Note2 related to API limits and quality control.                                     |
| Slack message format example:  ```
The video "*{{video_title}} - {{video_id}}*" has been auto-tagged successfully.
Tags: {{tags}}
```                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | From Sticky Note2 and Slack message node configuration.                                                             |

---

**Disclaimer:** The content provided is exclusively derived from an n8n automated workflow. It adheres strictly to content policies and contains no illegal, offensive, or protected elements. All processed data is legal and publicly accessible.