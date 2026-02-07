Auto-Publish YouTube Videos to Facebook & Instagram with AI-Generated Captions

https://n8nworkflows.xyz/workflows/auto-publish-youtube-videos-to-facebook---instagram-with-ai-generated-captions-4478


# Auto-Publish YouTube Videos to Facebook & Instagram with AI-Generated Captions

### 1. Workflow Overview

This workflow automates the publication of newly uploaded YouTube videos to Facebook and Instagram, including AI-generated engaging captions tailored for social media. It is designed for content creators or social media managers who want to streamline cross-platform promotion with minimal manual input.

The workflow logically divides into these functional blocks:

- **1.1 Input Reception**: Monitors a YouTube channel RSS feed for new videos.
- **1.2 AI Caption Generation**: Uses OpenAI GPT-4o-mini to craft social media captions based on video metadata.
- **1.3 Facebook Publishing**: Posts the generated caption and video link directly to a specified Facebook Page.
- **1.4 Instagram Publishing**: A three-step process that retrieves Instagram Business Account ID, creates a media container with the YouTube thumbnail and caption, then publishes the post.
- **1.5 Supporting Documentation and API Setup Notes**: Sticky notes providing references on setup, API permissions, and usage tips.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block monitors a YouTube channel’s RSS feed, polling every hour to detect new video uploads.

**Nodes Involved:**  
- Pull Youtube Video From Channel

**Node Details:**

- **Pull Youtube Video From Channel**  
  - Type: RSS Feed Read Trigger  
  - Role: Watches YouTube channel RSS feed for new videos, triggering workflow on new items.  
  - Configuration: Feed URL is `https://www.youtube.com/feeds/videos.xml?channel_id=UC2Tf8MGUzFX-GPkuBEBSKMg` (replace `channel_id` with your own channel ID). Polls every hour.  
  - Inputs: None (trigger node)  
  - Outputs: Emits new video metadata (title, link, etc.) on detection.  
  - Edge Cases: Invalid or expired RSS URL, channel ID errors, network timeouts.  
  - Notes: Sticky note “RSS Trigger Info” explains how to find channel ID and warns to replace placeholder.

---

#### 2.2 AI Caption Generation

**Overview:**  
Generates engaging social media captions using video metadata as input, employing OpenAI GPT-4o-mini. Captions include emojis and call-to-actions, customizable to brand voice and hashtags.

**Nodes Involved:**  
- AI Agent  
- OpenAI Chat Model

**Node Details:**

- **AI Agent**  
  - Type: Langchain Agent  
  - Role: Formats prompt for OpenAI using video metadata (title and URL) and defines the caption generation task.  
  - Configuration: Prompt asks to “Write a short, engaging social media post about this new YouTube video” including emojis and call to action. Uses expressions to inject video title and URL from trigger node.  
  - Inputs: Receives video metadata from RSS trigger node.  
  - Outputs: Sends prompt text to OpenAI Chat Model.  
  - Edge Cases: Expression errors if metadata missing; prompt customization needed for brand consistency.  
  - Notes: Sticky note “AI Caption Generation” details customization options and GPT model used.

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat Model Node  
  - Role: Runs GPT-4o-mini model to generate caption text from prompt.  
  - Configuration: Model set to “gpt-4o-mini” with default options. Requires OpenAI API credentials.  
  - Inputs: Prompt text from AI Agent.  
  - Outputs: Generated caption text.  
  - Edge Cases: API rate limits, invalid credentials, network downtime.  
  - Credentials: Requires OpenAI API key.  
  - Notes: Sticky note emphasizes usage of GPT-4o-mini.

---

#### 2.3 Facebook Publishing

**Overview:**  
Posts the AI-generated caption with video link directly to a Facebook Page feed using the Facebook Graph API.

**Nodes Involved:**  
- Post on Facebook

**Node Details:**

- **Post on Facebook**  
  - Type: HTTP Request  
  - Role: Sends POST request to Facebook Graph API endpoint `/v22.0/<Facebook_PageID>/feed` to publish the post.  
  - Configuration:  
    - Method: POST  
    - Content Type: form-urlencoded  
    - Body Parameters: message (caption text), access_token (long-lived token)  
    - Authentication: Generic header authentication with configured credentials.  
  - Inputs: Receives caption text output from AI Agent node.  
  - Outputs: Facebook API response (success or error).  
  - Error Handling: On error, continues workflow without termination.  
  - Edge Cases: Invalid page ID or access token, API permission errors, rate limits.  
  - Notes: Sticky note “Facebook Publishing” warns to replace placeholders `<Facebook_PageID>` and `<Access_Token>` and mentions error handling.

---

#### 2.4 Instagram Publishing

**Overview:**  
A three-step process to post the YouTube video thumbnail and AI-generated caption to Instagram via Facebook Graph API, requiring a linked Instagram Business Account.

**Nodes Involved:**  
- Get IG Business Account ID  
- Create Media Container  
- Publish Post On Instagram

**Node Details:**

- **Get IG Business Account ID**  
  - Type: HTTP Request  
  - Role: Retrieves Instagram Business Account ID linked to the Facebook Page.  
  - Configuration:  
    - URL: `https://graph.facebook.com/v22.0/<Facebook_PageID>`  
    - Query Params: fields=instagram_business_account, access_token=<Access_Token>  
    - Method: GET (default for HTTP Request with query parameters)  
  - Inputs: Receives output from AI Agent (triggered after caption generation).  
  - Outputs: Business account JSON including `instagram_business_account.id`.  
  - Error Handling: Continues on error to avoid workflow halt.  
  - Edge Cases: Missing permissions, invalid tokens, no linked Instagram Business Account.  
  - Notes: Sticky note “Instagram Publishing Flow” explains requirement for linked IG Business Account.

- **Create Media Container**  
  - Type: HTTP Request  
  - Role: Uploads YouTube thumbnail image as Instagram media container with caption.  
  - Configuration:  
    - URL: `https://graph.facebook.com/v22.0/{{instagram_business_account.id}}/media`  
    - Method: POST  
    - Content-Type: form-urlencoded  
    - Body Parameters:  
      - image_url: YouTube thumbnail URL constructed from video ID parsed from YouTube video link.  
      - caption: Output from AI Agent node (caption text).  
      - access_token: Long-lived token.  
  - Inputs: Receives Instagram Business Account ID from previous node.  
  - Outputs: Media container ID used for publishing.  
  - Edge Cases: Invalid image URLs, token errors, API limits.  
  - Notes: Automatically uses YouTube max resolution thumbnail.

- **Publish Post On Instagram**  
  - Type: HTTP Request  
  - Role: Publishes the Instagram post using the media container ID.  
  - Configuration:  
    - URL: `https://graph.facebook.com/v22.0/{{instagram_business_account.id}}/media_publish`  
    - Method: POST  
    - Content-Type: form-urlencoded  
    - Body Parameters:  
      - creation_id: Media container ID from previous node.  
      - access_token: Long-lived token.  
  - Inputs: Receives media container ID from “Create Media Container.”  
  - Outputs: Instagram API response.  
  - Edge Cases: API errors, invalid container ID, token issues.  
  - Notes: Sticky note describes the 3-step Instagram publishing process.

---

#### 2.5 Supporting Documentation and API Setup Notes

**Overview:**  
Sticky notes provide essential contextual information and setup instructions.

**Nodes Involved:**  
- Workflow Overview (sticky note)  
- RSS Trigger Info (sticky note)  
- AI Caption Generation (sticky note)  
- Facebook Publishing (sticky note)  
- Instagram Publishing Flow (sticky note)  
- API Requirements (sticky note)

**Node Details:**

- Each sticky note includes color-coded, brief descriptions and warnings:  
  - Replace placeholders like `<Facebook_PageID>` and `<Access_Token>`.  
  - Permissions required for Meta API access (pages_manage_posts, pages_read_engagement, etc.).  
  - Instruction to obtain YouTube channel ID.  
  - Reminder of Instagram Business Account linkage.  
  - Overview of the AI caption generation customization.  
- No inputs or outputs; purely informational.

---

### 3. Summary Table

| Node Name                     | Node Type                      | Functional Role                   | Input Node(s)                | Output Node(s)                   | Sticky Note                                                                                     |
|-------------------------------|--------------------------------|---------------------------------|------------------------------|---------------------------------|------------------------------------------------------------------------------------------------|
| Workflow Overview              | Sticky Note                    | Workflow purpose & setup overview| None                         | None                            | Purpose: Auto-publish YouTube videos to Facebook & Instagram; update all placeholders          |
| RSS Trigger Info               | Sticky Note                    | YouTube RSS feed monitoring info | None                         | None                            | How to find YouTube channel ID; replace channel_id in RSS URL                                 |
| AI Caption Generation          | Sticky Note                    | AI caption generation description| None                         | None                            | Uses GPT-4o-mini; customize prompt for brand voice, hashtags, and audience                    |
| Facebook Publishing            | Sticky Note                    | Facebook posting instructions    | None                         | None                            | Replace `<Facebook_PageID>` and `<Access_Token>`; handles errors gracefully                    |
| Instagram Publishing Flow      | Sticky Note                    | Instagram post publishing guide  | None                         | None                            | 3-step process for Instagram, requires Business Account linked to Facebook                    |
| API Requirements              | Sticky Note                    | Meta API permissions & token info| None                         | None                            | Lists required permissions; requires long-lived token; API v22.0                              |
| Pull Youtube Video From Channel| RSS Feed Read Trigger          | Trigger on new YouTube videos    | None                         | AI Agent                       | Replace channel_id in RSS URL                                                                |
| AI Agent                      | Langchain Agent                | Formats caption prompt for AI    | Pull Youtube Video From Channel| Get IG Business Account ID, Post on Facebook | Formats social media post prompt with emojis and CTA                                           |
| OpenAI Chat Model             | Langchain OpenAI Chat Model   | Generates caption from prompt    | AI Agent                     | AI Agent                       | Uses GPT-4o-mini; requires OpenAI API key                                                    |
| Get IG Business Account ID    | HTTP Request                  | Retrieves Instagram Business ID  | AI Agent                     | Create Media Container          | Requires Facebook Page ID and access token                                                   |
| Post on Facebook              | HTTP Request                  | Posts caption on Facebook Page   | Get IG Business Account ID (via AI Agent) | None                     | Replace placeholders; error handling to continue workflow                                    |
| Create Media Container        | HTTP Request                  | Uploads thumbnail & caption for IG post| Get IG Business Account ID | Publish Post On Instagram       | Uses YouTube thumbnail URL and AI-generated caption                                         |
| Publish Post On Instagram     | HTTP Request                  | Publishes Instagram post         | Create Media Container        | None                           | Posts to Instagram feed using media container ID                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create RSS Feed Read Trigger Node**  
   - Type: RSS Feed Read Trigger  
   - Name: `Pull Youtube Video From Channel`  
   - Feed URL: `https://www.youtube.com/feeds/videos.xml?channel_id=YOUR_CHANNEL_ID` (replace with actual)  
   - Polling: Every hour  
   - This node triggers on new YouTube uploads.

2. **Create Langchain Agent Node**  
   - Type: Langchain Agent  
   - Name: `AI Agent`  
   - Input: Connect from `Pull Youtube Video From Channel`  
   - Prompt:  
     ```
     Write a short, engaging social media post about this new YouTube video:

     Title: {{ $json.title }}
     URL: {{ $json.link }}

     Include emojis and a call to action.
     ```
   - Output: To OpenAI Chat Model and also forward to Facebook and Instagram flow.

3. **Create Langchain OpenAI Chat Model Node**  
   - Type: Langchain OpenAI Chat Model  
   - Name: `OpenAI Chat Model`  
   - Connect input from `AI Agent`  
   - Set model to `gpt-4o-mini`  
   - Credentials: Set with OpenAI API key  
   - Output: Returns AI-generated caption to `AI Agent`

4. **Connect AI Agent Outputs to Two Paths:**  
   - Path 1: Facebook Publishing  
   - Path 2: Instagram Publishing

5. **Create HTTP Request Node for Facebook Publishing**  
   - Type: HTTP Request  
   - Name: `Post on Facebook`  
   - URL: `https://graph.facebook.com/v22.0/<Facebook_PageID>/feed` (replace `<Facebook_PageID>`)  
   - Method: POST  
   - Content-Type: form-urlencoded  
   - Body Parameters:  
     - `message`: `={{ $json.output }}` (caption from AI Agent)  
     - `access_token`: `<Access_Token>` (replace with actual long-lived token)  
   - Authentication: Generic HTTP Header Auth with Facebook token credentials  
   - Error Handling: Set to continue on error  
   - Input: Connect from `AI Agent`

6. **Create HTTP Request Node to Get Instagram Business Account ID**  
   - Type: HTTP Request  
   - Name: `Get IG Business Account ID`  
   - URL: `https://graph.facebook.com/v22.0/<Facebook_PageID>` (replace `<Facebook_PageID>`)  
   - Query Parameters:  
     - `fields`: `instagram_business_account`  
     - `access_token`: `<Access_Token>`  
   - Method: GET (with query parameters)  
   - Error Handling: Continue on error  
   - Input: Connect from `AI Agent`

7. **Create HTTP Request Node to Create Media Container**  
   - Type: HTTP Request  
   - Name: `Create Media Container`  
   - URL: `https://graph.facebook.com/v22.0/{{ $json.instagram_business_account.id }}/media`  
   - Method: POST  
   - Content-Type: form-urlencoded  
   - Body Parameters:  
     - `image_url`: `=https://img.youtube.com/vi/{{ $('Pull Youtube Video From Channel').item.json.link.split("=")[1] }}/maxresdefault.jpg` (extract video ID)  
     - `caption`: `={{ $('AI Agent').item.json.output }}`  
     - `access_token`: `<Access_Token>`  
   - Input: Connect from `Get IG Business Account ID`

8. **Create HTTP Request Node to Publish Post on Instagram**  
   - Type: HTTP Request  
   - Name: `Publish Post On Instagram`  
   - URL: `https://graph.facebook.com/v22.0/{{ $('Get IG Business Account ID').item.json.instagram_business_account.id }}/media_publish`  
   - Method: POST  
   - Content-Type: form-urlencoded  
   - Body Parameters:  
     - `creation_id`: `={{ $json.id }}` (media container ID)  
     - `access_token`: `<Access_Token>`  
   - Input: Connect from `Create Media Container`

9. **Add Sticky Notes for Documentation:**  
   - Workflow Overview: Purpose, schedule, required setup  
   - RSS Trigger Info: How to find YouTube channel ID  
   - AI Caption Generation: GPT-4o-mini details and prompt customization  
   - Facebook Publishing: Placeholders and error handling  
   - Instagram Publishing Flow: 3-step process and account requirements  
   - API Requirements: Required Meta permissions and token type  

10. **Credentials Setup:**  
    - OpenAI API Key (OpenAI Chat Model node)  
    - Facebook Generic HTTP Header Auth with long-lived access token (for Facebook and Instagram HTTP Request nodes)  

11. **Replace all placeholders:**  
    - `<Facebook_PageID>` with actual Facebook Page ID  
    - `<Access_Token>` with long-lived access token having required scopes

12. **Activate workflow and test with a new YouTube upload**

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                          |
|----------------------------------------------------------------------------------------------------------------|-----------------------------------------|
| Replace all `<Access_Token>` and `<Facebook_PageID>` placeholders before running the workflow.                 | Workflow Overview sticky note            |
| To find YouTube Channel ID, view page source of channel URL and search for "channelId".                        | RSS Trigger Info sticky note             |
| Required Meta API permissions: pages_manage_posts, pages_read_engagement, pages_show_list, instagram_content_publish, instagram_basic | API Requirements sticky note             |
| Instagram posting requires Instagram Business Account linked to Facebook Page.                                 | Instagram Publishing Flow sticky note    |
| AI captions generated with GPT-4o-mini, customizable prompt to match brand voice and include hashtags.         | AI Caption Generation sticky note        |
| Facebook posting node includes error handling to continue workflow even if posting fails (e.g., token expired).| Facebook Publishing sticky note          |
| YouTube thumbnail URL built dynamically from video ID for Instagram media container upload.                    | Instagram Publishing Flow sticky note    |

---

This detailed documentation enables both human operators and AI agents to fully understand, reproduce, and adapt the workflow, anticipate potential issues, and maintain the integration between YouTube, OpenAI, Facebook, and Instagram APIs.