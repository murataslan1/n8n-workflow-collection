AI-Enhanced Telegram to WordPress Publishing with GPT-4 Rewriting and Media Upload

https://n8nworkflows.xyz/workflows/ai-enhanced-telegram-to-wordpress-publishing-with-gpt-4-rewriting-and-media-upload-10671


# AI-Enhanced Telegram to WordPress Publishing with GPT-4 Rewriting and Media Upload

### 1. Workflow Overview

This workflow automates the ingestion of news posts from multiple Telegram public channels via their RSS feeds, rewrites and enhances the articles using GPT-4 AI models tailored for American democratic audiences, and publishes the processed content to a WordPress site with appropriate media handling. It covers the full pipeline from content reception, AI rewriting and contextual enhancement, media detection and upload, to final WordPress publishing.

**Target Use Cases:**  
- News portals or media outlets aggregating Telegram channel content.  
- Automated content rewriting and contextualization for US/Western audiences.  
- Seamless media uploads (images/videos) alongside articles to WordPress.  
- Maintaining editorial standards, formatting, and SEO metadata automatically.

**Logical Blocks:**

- **1.1 Telegram RSS Input & Categorization:** Multiple RSS feed triggers for Telegram channels; assign categories and default images per channel.  
- **1.2 Article Preparation:** Extract and edit fields for further processing.  
- **1.3 AI Rewriting & Enhancement:** Two OpenAI GPT-4 nodes for rewriting the article with formatting and then adding relevant US-contextual enhancements.  
- **1.4 Media Handling:** Download media, detect media type (image/video), upload media to WordPress, assign media IDs (including defaults).  
- **1.5 Content Assembly & Publishing:** Merge all data, optionally insert video player HTML, and publish the final post to WordPress via REST API.  
- **1.6 Control Logic & Merging:** Routing and combining data streams for coherent downstream processing.

---

### 2. Block-by-Block Analysis

#### 1.1 Telegram RSS Input & Categorization

**Overview:**  
This block listens for new posts via RSS feeds from five different Telegram channels, then assigns WordPress categories and default images tailored to each source to maintain consistent categorization and fallback imagery.

**Nodes Involved:**  
- Telegram RSS Feed 1  
- Telegram RSS Feed 2  
- Telegram RSS Feed 3  
- Telegram RSS Feed 4  
- Telegram RSS Feed 5  
- Assign Category - News  
- Assign Category - External News  
- Assign Category - Social  
- Assign Category - Internal News  
- Assign Category - Sports

**Node Details:**

- **Telegram RSS Feed Nodes:**  
  - Type: RSS Feed Read Trigger  
  - Configuration: Each node polls a specific public Telegram channel’s RSS feed hourly.  
  - Key Expressions: None (uses RSS feed URLs like `https://tg.i-c-a.su/rss/CHANNEL_NAME`).  
  - Input/Output: No input; outputs new RSS items.  
  - Failure Modes: RSS feed downtime, network errors, or rate limiting.

- **Assign Category Nodes:**  
  - Type: Set  
  - Role: Assigns four key fields per post: `article` (from `contentSnippet`), `image` (from enclosure URL), `category_id` (WordPress category number), and `default_image_id` (fallback media ID).  
  - Inputs: RSS feed items  
  - Outputs: Enriched JSON with article text, media URL, category ID, and default media ID.  
  - Edge Cases: Missing enclosure URLs, incorrect category IDs, or default image IDs.

---

#### 1.2 Article Preparation

**Overview:**  
This block extracts and sets key fields from the assigned category nodes to standardize input for AI processing and media handling.

**Nodes Involved:**  
- Edit Fields  
- Default Image ID  
- Get Category ID

**Node Details:**

- **Edit Fields:**  
  - Type: Set  
  - Role: Copies and normalizes fields like `article`, `image`, `category_id`, and `default_image_id` for downstream nodes.  
  - Input: From category assignment nodes  
  - Output: JSON with standardized keys.

- **Default Image ID & Get Category ID:**  
  - Type: Set  
  - Role: Re-assert or prepare media and category identifiers.  
  - Inputs/Outputs: Pass-through or minor adjustments.

- **Edge Cases:** Missing or malformed article content or media URLs may propagate errors downstream.

---

#### 1.3 AI Rewriting & Enhancement

**Overview:**  
This block performs two-step AI processing: first, rewriting the article for an American editorial style with HTML formatting using GPT-4, then enhancing the rewritten article with relevant democratic context aligned with US interests.

**Nodes Involved:**  
- Message a model4 (AI Rewriting)  
- Message a model6 (AI Contextual Enhancement)  
- Enhanced Article  
- Article Meta

**Node Details:**

- **Message a model4:**  
  - Type: OpenAI GPT-4 (via LangChain node)  
  - Configuration: Uses GPT-4o model with a system prompt directing subtle pro-democracy framing, HTML formatting requirements, and article restructuring.  
  - Input: Raw article text from `article` field.  
  - Output: JSON response with keys: `headline`, `article_body` (HTML), `word_count`, `editors_notes`, `changes_summary`, `seo_meta`.  
  - Failure Modes: API rate limits, malformed prompts, network errors, JSON parse errors.

- **Message a model6:**  
  - Type: OpenAI GPT-4 (LangChain)  
  - Configuration: Takes rewritten article and applies contextual enhancement depending on focus keyword topic (e.g., democracy, rule of law).  
  - Input: Output JSON from model4 node.  
  - Output: Enhanced article JSON with added context sentences and metadata about enhancements made.  
  - Edge Cases: Missing or incompatible input JSON; API errors.

- **Enhanced Article & Article Meta:**  
  - Type: Set  
  - Role: Extract and assign enhanced article text and metadata fields for publishing.  
  - Inputs: Output from Message a model6.  
  - Outputs: Fields like `enhanced_article`, `title`, `seo_description`, etc.

---

#### 1.4 Media Handling

**Overview:**  
Downloads media files from Telegram URLs, detects whether the media is an image or video via AI, uploads the media to WordPress, and assigns appropriate media IDs for use in the post. If media is video, fallback default image is assigned.

**Nodes Involved:**  
- HTTP Request (Download media)  
- HTTP Request2 (Upload media to WordPress)  
- Message a model (Media format detection)  
- Switch (Route by media type)  
- Just Image (Set media IDs for image)  
- Assign Video (Set media IDs for video)  
- Merge2 (Combine media metadata)  
- Default Image ID  
- Merge (Final media IDs)

**Node Details:**

- **HTTP Request:**  
  - Downloads binary media file from Telegram enclosure URL.  
  - Configured for full response with file binary data.  
  - Retries allowed for robustness.

- **HTTP Request2:**  
  - Uploads the binary media file to WordPress media library API endpoint.  
  - Sets HTTP headers for content disposition and mime type dynamically.  
  - Uses WordPress credentials for authentication.  
  - Retries on failure with delay.

- **Message a model:**  
  - AI node to determine if uploaded media is image or video based on file metadata (`mime_type`, `media_type`).  
  - Returns JSON with `"type": "image"` or `"video"`.

- **Switch:**  
  - Routes flow based on media type detected.  
  - Image path goes to Just Image node; video path goes to Assign Video node.

- **Just Image:**  
  - Sets `image_id` to the uploaded media ID and `video_id` to "no" (indicating no video).  

- **Assign Video:**  
  - Sets `video_id` to uploaded media ID and `image_id` to default image ID (fallback).  

- **Merge2:**  
  - Combines output from media detection and setting nodes to unify media IDs for use downstream.

- **Merge:**  
  - Final combination of media IDs before article publishing.

- **Failures to Anticipate:**  
  - Media download failure (broken URL, network issues)  
  - Upload failure (auth, API limits)  
  - AI detection errors or ambiguous metadata  
  - Missing default images leading to incomplete posts

---

#### 1.5 Content Assembly & Publishing

**Overview:**  
Merges all enhanced article content, media IDs, and metadata; optionally inserts an HTML5 video player shortcode if the post includes video; then publishes the finalized post to WordPress via REST API.

**Nodes Involved:**  
- Merge4 (Combine article, media, categories)  
- If (Check if video ID present)  
- Insert HTML5 Video player  
- HTTP Request1 (Publish post)  
- HTTP Request3 (Alternative publish node)

**Node Details:**

- **Merge4:**  
  - Combines four streams: article metadata, enhanced article, media info, and category IDs.

- **If:**  
  - Checks if `video_id` equals "no" or has a valid ID.  
  - Routes to Insert HTML5 Video player if video exists; else directly to publishing.

- **Insert HTML5 Video player:**  
  - Prepares the article content by prepending a WordPress video playlist shortcode referencing the video media ID.  
  - Passes along all metadata.

- **HTTP Request1 / HTTP Request3:**  
  - POST to WordPress posts endpoint to create and publish a new post.  
  - Payload includes title, formatted content, excerpt (SEO description), category IDs, featured media (image or fallback), tags (empty), format, and meta with timestamp.  
  - Uses predefined WordPress credentials.  
  - Failure cases: Authentication errors, API limits, malformed JSON payload, network failures.

---

#### 1.6 Control Logic & Merging

**Overview:**  
Handles data flow synchronization and error-tolerant merging of parallel streams to ensure all necessary data is combined before publishing.

**Nodes Involved:**  
- Merge2  
- Merge4

**Node Details:**

- **Merge2:** Combines media upload results and media type detection outputs.  
- **Merge4:** Final aggregate merge of all components (article text, AI enhancements, media IDs, categories) before publishing.  
- Includes options to include unpaired items to prevent data loss.

---

### 3. Summary Table

| Node Name                  | Node Type                      | Functional Role                                     | Input Node(s)                              | Output Node(s)                    | Sticky Note                                                                                          |
|----------------------------|--------------------------------|----------------------------------------------------|--------------------------------------------|----------------------------------|----------------------------------------------------------------------------------------------------|
| Telegram RSS Feed 1         | RSS Feed Read Trigger          | Input trigger for Telegram channel #1              | None                                       | Assign Category - News            |                                                                                                    |
| Telegram RSS Feed 2         | RSS Feed Read Trigger          | Input trigger for Telegram channel #2              | None                                       | Assign Category - External News   |                                                                                                    |
| Telegram RSS Feed 3         | RSS Feed Read Trigger          | Input trigger for Telegram channel #3              | None                                       | Assign Category - Social          |                                                                                                    |
| Telegram RSS Feed 4         | RSS Feed Read Trigger          | Input trigger for Telegram channel #4              | None                                       | Assign Category - Internal News   |                                                                                                    |
| Telegram RSS Feed 5         | RSS Feed Read Trigger          | Input trigger for Telegram channel #5              | None                                       | Assign Category - Sports          |                                                                                                    |
| Assign Category - News      | Set                           | Assigns category ID, default image, article, image | Telegram RSS Feed 1                         | Edit Fields                      | # 🗂️ Assign Category & Default Image - explains how to find category and image IDs, customization. |
| Assign Category - External News | Set                       | Same as above for external news                     | Telegram RSS Feed 2                         | Edit Fields                      | Same as above                                                                                      |
| Assign Category - Social    | Set                           | Same as above for social news                       | Telegram RSS Feed 3                         | Edit Fields                      | Same as above                                                                                      |
| Assign Category - Internal News | Set                       | Same as above for internal news                     | Telegram RSS Feed 4                         | Edit Fields                      | Same as above                                                                                      |
| Assign Category - Sports    | Set                           | Same as above for sports news                       | Telegram RSS Feed 5                         | Edit Fields                      | Same as above                                                                                      |
| Edit Fields                | Set                           | Normalize key fields for AI processing              | Assign Category nodes                      | Message a model4, HTTP Request   |                                                                                                    |
| Default Image ID           | Set                           | Ensure default image ID field present                | Edit Fields                                | Merge2                          |                                                                                                    |
| Get Category ID            | Set                           | Pass category ID forward                             | Edit Fields                                | Merge4                          |                                                                                                    |
| Message a model4           | OpenAI (LangChain)             | Rewrite article with GPT-4 and format HTML          | Edit Fields                                | Message a model6, Article Meta    | # 📝 OpenAI Article Editing Prompt - detailed rewriting instructions and formatting rules           |
| Message a model6           | OpenAI (LangChain)             | Add US-contextual democratic enhancements           | Message a model4                           | Enhanced Article                 |                                                                                                    |
| Enhanced Article           | Set                           | Extract enhanced article from AI response            | Message a model6                           | Merge4                          |                                                                                                    |
| Article Meta               | Set                           | Extract article title, SEO description, keywords    | Message a model4                           | Merge4                          |                                                                                                    |
| HTTP Request               | HTTP Request                  | Download media file from Telegram URL               | Edit Fields                                | HTTP Request2                   | # 📝 Telegram → WordPress Media Workflow - explains media download, detection, upload, and defaults |
| HTTP Request2              | HTTP Request                  | Upload media binary to WordPress media library       | HTTP Request                               | Message a model, Merge2          | Same as above                                                                                      |
| Message a model            | OpenAI (LangChain)             | Detect media type (image or video)                   | HTTP Request2                              | Switch                         | Same as above                                                                                      |
| Switch                    | Switch                        | Route based on media type                             | Merge2                                    | Just Image, Assign Video         | Same as above                                                                                      |
| Just Image                | Set                           | Assign WordPress media ID for images                  | Switch                                    | Merge                          | Same as above                                                                                      |
| Assign Video              | Set                           | Assign WordPress media ID for videos & default image | Switch                                    | Merge                          | Same as above                                                                                      |
| Merge2                    | Merge                         | Combine media upload and type detection outputs      | HTTP Request2, Message a model             | Switch                         |                                                                                                    |
| Merge                     | Set                           | Combine final media IDs                               | Just Image, Assign Video                    | Merge4                         |                                                                                                    |
| Merge4                    | Merge                         | Aggregate article, media, categories, meta for post  | Article Meta, Enhanced Article, Merge, Get Category ID | If                        |                                                                                                    |
| If                        | If                            | Check presence of video ID to branch publishing       | Merge4                                     | Insert HTML5 Video player, HTTP Request1 |                                                                                                    |
| Insert HTML5 Video player  | Set                           | Insert WordPress video shortcode into article content | If (video present)                         | HTTP Request3                  | # 📝 WordPress Publish Node - instructions on publishing with media                               |
| HTTP Request1              | HTTP Request                  | Publish post to WordPress via REST API                | If (no video)                              | None                          | Same as above                                                                                      |
| HTTP Request3             | HTTP Request                  | Publish post with video shortcode                      | Insert HTML5 Video player                   | None                          | Same as above                                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram RSS Feed Read Triggers (5 nodes):**  
   - Type: RSS Feed Read Trigger  
   - Set `feedUrl` to Telegram public channel RSS URLs (e.g., `https://tg.i-c-a.su/rss/maeiexplica`)  
   - Polling interval: every hour  
   - Enable “Only emit new items” to avoid duplicates

2. **Add Assign Category Set Nodes (5 nodes):**  
   - For each RSS feed, create a Set node that:  
     - Assigns `article` = RSS `contentSnippet`  
     - Assigns `image` = RSS enclosure URL  
     - Assigns `category_id` = WordPress category ID (numeric) for that channel  
     - Assigns `default_image_id` = WordPress media ID (numeric) for fallback image

3. **Connect each Assign Category node to a common Edit Fields node:**  
   - Set node copies/normalizes fields: `article`, `image`, `category_id`, `default_image_id`

4. **Add Media Download Node (HTTP Request):**  
   - Method: GET  
   - URL: expression from `image` field  
   - Response: Full response, response format file  
   - Retry on fail enabled

5. **Add Media Upload Node (HTTP Request2):**  
   - Method: POST  
   - URL: `https://your-wordpress-domain.com/wp-json/wp/v2/media`  
   - Send body: binary data  
   - Headers:  
     - `Content-Disposition`: attachment; filename from binary data  
     - `Content-Type`: mime type from binary data  
   - Authentication: WordPress OAuth2 or API key credentials

6. **Add Media Type Detection Node (OpenAI LangChain):**  
   - Use GPT-4o model  
   - System prompt instructing to detect `image` or `video` based on mime type metadata  
   - Input: metadata fields from HTTP Request2 output

7. **Add Merge2 Node:**  
   - Combine outputs from HTTP Request2 and Media Type Detection nodes  
   - Mode: Combine by position, include unpaired

8. **Add Switch Node:**  
   - Condition: `$json.message.content.type == 'image'` → Just Image node  
   - Else if type == 'video' → Assign Video node

9. **Add Just Image Set Node:**  
   - Assign `image_id` = uploaded media ID  
   - Assign `video_id` = `"no"`

10. **Add Assign Video Set Node:**  
    - Assign `video_id` = uploaded media ID  
    - Assign `image_id` = `default_image_id` (from input)

11. **Add Merge Node:**  
    - Combine outputs from Just Image and Assign Video nodes

12. **Add AI Rewriting Node (Message a model4):**  
    - OpenAI GPT-4o via LangChain  
    - System prompt: detailed instructions to rewrite article with American democratic framing and HTML formatting  
    - Input: `article` text from Edit Fields node  
    - Set output to JSON (headline, article body, word count, SEO meta)

13. **Add AI Enhancement Node (Message a model6):**  
    - OpenAI GPT-4o  
    - System prompt: add relevant US-contextual democratic enhancements based on article topic  
    - Input: JSON output from rewriting node

14. **Add Article Meta and Enhanced Article Set Nodes:**  
    - Extract `headline`, `article_body`, SEO fields, and enhanced article version into separate fields for publishing

15. **Add Merge4 Node:**  
    - Combine Article Meta, Enhanced Article, Media IDs, and Category ID nodes  
    - Mode: Combine by position, include unpaired

16. **Add If Node:**  
    - Condition: If `video_id` equals `"no"` (no video)  
    - True branch: directly to HTTP Request1 (publish post)  
    - False branch: pass to Insert HTML5 Video player node

17. **Add Insert HTML5 Video player Set Node:**  
    - Prepend WordPress video shortcode `[playlist type="video" ids="{{ $json.video_id }}" tracklist="false"]` to article content  
    - Pass other metadata down

18. **Add HTTP Request1 and HTTP Request3 Nodes:**  
    - POST to WordPress posts endpoint `/wp-json/wp/v2/posts`  
    - Body: JSON including  
      - `title` (headline)  
      - `content` (enhanced article with or without video shortcode)  
      - `excerpt` (SEO description)  
      - `categories` (category IDs array)  
      - `featured_media` (image or default image ID)  
      - `format` set to "standard"  
      - `meta` with timestamp  
    - Authentication: WordPress credentials (API key or OAuth2)

19. **Connect nodes according to the flow:**  
    - RSS feeds → Assign Category nodes → Edit Fields → parallel to AI rewriting and media download → media upload → media type detection → switch → media ID assignment → merges → AI enhancement → metadata extraction → final merge → if video → video shortcode → publish → else direct publish

20. **Credentials Setup:**  
    - OpenAI API credentials with GPT-4 access  
    - WordPress API credentials with media and post publishing permissions

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                 |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Telegram RSS Trigger Setup: How to generate RSS feeds for public Telegram channels without API access, recommended polling intervals, and tips for monitoring multiple channels.                                                                                                                                                                                                                 | https://tg.i-c-a.su/, https://rsshub.app/telegram/channel/CHANNEL_NAME                          |
| Assign Category & Default Image: Instructions on finding WordPress category IDs and default image IDs for fallback media; customization per Telegram channel recommended to maintain consistency.                                                                                                                                                                                              | WordPress Admin UI                                                                              |
| Telegram → WordPress Media Workflow: Overview of media download from Telegram, AI-based media type detection, upload to WordPress media library, and fallback mechanisms for missing media.                                                                                                                                                                                                      | Inline sticky note within workflow                                                             |
| OpenAI Article Editing Prompt: Detailed instructions for GPT-4 on rewriting news articles with subtle pro-democracy framing, HTML formatting rules, and SEO metadata output.                                                                                                                                                                                                                   | Inline sticky note within workflow                                                             |
| WordPress Publish Node: Notes on publishing posts via REST API with media, categories, and metadata; includes tips for updating endpoint URLs and credentials.                                                                                                                                                                                                                                  | Inline sticky note within workflow                                                             |

---

**Disclaimer:**  
The provided documentation is based exclusively on an n8n workflow JSON export. It adheres strictly to content policies and contains no illegal, offensive, or copyrighted material. All data handled is legal and publicly accessible.