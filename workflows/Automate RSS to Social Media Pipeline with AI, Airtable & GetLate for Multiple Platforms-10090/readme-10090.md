Automate RSS to Social Media Pipeline with AI, Airtable & GetLate for Multiple Platforms

https://n8nworkflows.xyz/workflows/automate-rss-to-social-media-pipeline-with-ai--airtable---getlate-for-multiple-platforms-10090


# Automate RSS to Social Media Pipeline with AI, Airtable & GetLate for Multiple Platforms

### 1. Workflow Overview

This workflow, titled **"Automate RSS to Social Media Pipeline with AI, Airtable & GetLate for Multiple Platforms"**, automates the process of transforming RSS feed articles into optimized social media posts for multiple platforms (LinkedIn, Bluesky, Instagram). It leverages AI language models for content generation, uses Airtable as a content store, generates or handles images via AI and Imgbb, and posts content via the GetLate API.

The key logical blocks are:

- **1.1 Input Reception & Article Storage**: Multiple RSS feed triggers listen for new tagged articles per platform. Articles are normalized, converted from HTML to markdown, and stored in Airtable.
- **1.2 Content Filtering & Scheduling**: Scheduled triggers initiate the workflow to process unposted articles, filtering duplicates by platform, and setting AI content generation parameters.
- **1.3 AI Content Generation & Validation**: Platform-specific prompts are constructed and sent to AI language models (Groq Chat Model with Langchain). Responses are validated and corrected via code nodes.
- **1.4 Image Generation & Upload**: For posts requiring images, AI generates images via Hugging Face’s Stable Diffusion model. Images are resized (Bluesky only), converted to base64, then uploaded to Imgbb.
- **1.5 Post Publishing & Airtable Update**: Posts (with or without images) are published/drafted via the GetLate API. Corresponding Airtable records are updated to mark posts as published.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Article Storage

**Overview:**  
This block receives new articles from RSS feeds filtered by platform-specific tags, converts their content to markdown, and stores them in Airtable for further processing.

**Nodes Involved:**  
- RSS Feed Trigger: '#to-share-linkedin'  
- Set Platform (LinkedIn)  
- Markdown: Convert Article Content (LinkedIn)  
- Store Article Content (LinkedIn)  
- RSS Feed Trigger: '#to-share-bluesky'  
- Set Platform (Bluesky)  
- Markdown: Convert Article Content (Bluesky)  
- Store Article Content (Bluesky)  
- RSS Feed Trigger: '#to-share-instagram"'  
- Set Platform (Instagram)  
- Markdown: Convert Article Content (Instagram)  
- Store Article Content (Instagram)  

**Node Details:**  

- **RSS Feed Trigger Nodes**  
  - Type: RSS Feed Trigger  
  - Role: Poll RSS feeds every minute to detect new articles tagged for each platform.  
  - Config: Poll URL uses Wallabag feed URLs filtered by specific tags; polling interval set to every minute.  
  - Input: N/A (trigger node)  
  - Output: Emits new RSS feed items as JSON.  
  - Edge Cases: Feed unavailability, parsing errors, duplicate feeds.  
  - Credentials: None required for public RSS feed.  

- **Set Platform Nodes (LinkedIn, Bluesky, Instagram)**  
  - Type: Set  
  - Role: Assigns a `platform` field (string) to incoming articles to identify the destination platform.  
  - Config: Hardcoded platform string value, e.g., "linkedin", "bluesky", or "instagram".  
  - Input: RSS feed JSON  
  - Output: Original data plus the `platform` field.  
  - Edge Cases: None significant; ensure platform string matches downstream checks.  

- **Markdown: Convert Article Content Nodes**  
  - Type: Markdown  
  - Role: Converts article HTML content to markdown for AI processing.  
  - Config: Converts from HTML content field to markdown, output stored in `content_markdown`.  
  - Input: RSS feed article JSON with HTML content field.  
  - Output: Article JSON with added markdown field.  
  - Edge Cases: Complex HTML may convert imperfectly; empty or malformed content.  

- **Store Article Content Nodes (Airtable)**  
  - Type: Airtable  
  - Role: Stores new articles into Airtable content store, marking them as unposted.  
  - Config: Uses Airtable base and table for "RSS Feed - Content Store". Mappings include title, author, feed ID, platform, article URL, markdown content, and `is_posted=0`.  
  - Input: Article JSON with markdown and platform.  
  - Output: Airtable record creation confirmation.  
  - Edge Cases: Airtable API failures, schema mismatches, duplicate records.  
  - Credentials: Airtable Personal Access Token (PAT).  

---

#### 2.2 Content Filtering & Scheduling

**Overview:**  
Schedules regular runs to pick up unposted articles, filters to one article per platform at a time, and sets parameters for AI content generation.

**Nodes Involved:**  
- Set Post Schedule (Schedule Trigger)  
- Set SMCG Custom Parameters & Settings  
- Pull New Articles (Airtable Search)  
- Filter Platform Duplicates (Code)  
- Check Platform (Switch)  

**Node Details:**  

- **Set Post Schedule**  
  - Type: Schedule Trigger  
  - Role: Triggers workflow weekly on Monday at 12:00 PM (UTC-4) to start content generation.  
  - Config: Weekly interval, trigger day Monday, hour 12.  
  - Input: N/A  
  - Output: Timestamp trigger to start flow.  
  - Edge Cases: Timezone considerations; missed executions if n8n offline.  

- **Set SMCG Custom Parameters & Settings**  
  - Type: Set  
  - Role: Defines static AI generation parameters like niche, tone, goal, CTA, target audience, custom tags, image generation flags, and platform account IDs.  
  - Config: Hardcoded values such as niche "Sustainable fashion", tone "Friendly, witty, conversational", CTA "Leave a comment, visit newsletter", post as draft flag, and account IDs placeholders.  
  - Input: Trigger data from schedule  
  - Output: Parameters JSON for downstream prompt nodes.  
  - Edge Cases: Hardcoded values must be updated for real use; missing or invalid account IDs cause downstream errors.  

- **Pull New Articles**  
  - Type: Airtable (Search)  
  - Role: Queries Airtable content store for all articles with `is_posted=0` (unposted).  
  - Config: Uses Airtable base and table, filters by formula `is_posted=0`, fetches relevant fields for post generation.  
  - Input: Trigger data and parameters.  
  - Output: List of unposted articles.  
  - Edge Cases: Airtable API limits, empty results, malformed formula.  

- **Filter Platform Duplicates (Code Node)**  
  - Type: Code  
  - Role: Filters the list to only one unique article per platform to avoid posting duplicates in the same batch.  
  - Config: Uses a set to track seen platforms, returns first article per platform.  
  - Input: List of articles from Airtable.  
  - Output: Filtered list with unique platforms.  
  - Edge Cases: Multiple articles with missing or malformed platform field.  

- **Check Platform (Switch)**  
  - Type: Switch  
  - Role: Routes articles to platform-specific prompt generation branches based on the `platform` field.  
  - Config: Routes for `"linkedin"`, `"bluesky"`, `"instagram"`.  
  - Input: Filtered article items.  
  - Output: Branches to platform-specific prompt nodes.  
  - Edge Cases: Unsupported or unexpected platform strings cause no output branch; may need default error handling.  

---

#### 2.3 AI Content Generation & Validation

**Overview:**  
This block prepares platform-specific prompts, sends them to AI language models, and validates their JSON outputs for consistency and correctness.

**Nodes Involved:**  
- LinkedIn SMCG Prompt (Set)  
- Bluesky SMCG Prompt (Set)  
- Instagram SMCG Prompt (Set)  
- Groq Chat Model (LinkedIn)  
- Groq Chat Model (Bluesky)  
- Groq Chat Model (Instagram)  
- Validate JSON (LinkedIn)  
- Validate JSON (Bluesky)  
- Validate JSON (Instagram)  

**Node Details:**  

- **Platform SMCG Prompt (Set Nodes)**  
  - Type: Set  
  - Role: Constructs detailed prompt strings for the AI language model, embedding static parameters and article content.  
  - Config: Each prompt is tailored per platform with specific post length, tone, structure, CTA integration, hashtag and image prompt instructions.  
  - Input: Article content, SMCG parameters, platform-specific logic.  
  - Output: JSON object with `chatInput` string for AI LLM.  
  - Edge Cases: Misalignment between parameters and article data; prompt length limits or formatting issues.  

- **Groq Chat Model (Langchain LLM Chain)**  
  - Type: Langchain LLM Chain (Groq Chat Model)  
  - Role: Sends the prompt to the Groq AI model "kimi-k2-instruct-0905" for content generation.  
  - Config: Model set to "moonshotai/kimi-k2-instruct-0905", no extra options.  
  - Input: `chatInput` prompt string from Set node.  
  - Output: AI response JSON text with generated post content.  
  - Credentials: Groq API credentials required.  
  - Edge Cases: API limits, timeouts, malformed AI output, authentication errors.  

- **Validate JSON (Code Nodes)**  
  - Type: Code  
  - Role: Parses and validates AI-generated JSON output, correcting common formatting issues, normalizing hashtags, verifying required fields, and enforcing constraints.  
  - Config: Checks presence and types of fields like `post_text`, `suggested_hashtags`, `platform`, and `image_prompt`; auto-fixes hashtags formatting and platform casing.  
  - Input: Raw AI text output.  
  - Output: Cleaned and validated JSON with corrected fields and character counts.  
  - Edge Cases: Invalid JSON, missing required fields, empty post text, empty hashtags, unsupported platforms. Throws errors if critical issues found.  

---

#### 2.4 Image Generation & Upload

**Overview:**  
For posts flagged to require images, this block generates images via Hugging Face's Stable Diffusion XL model, resizes images as needed (Bluesky), converts to base64, and uploads images to Imgbb for hosting.

**Nodes Involved:**  
- Check For Image Prompt (LinkedIn) (If)  
- Generate Post Image (LinkedIn) (HTTP Request)  
- Convert to Base64 (LinkedIn) (Code)  
- Store Image on Imgbb (LinkedIn) (HTTP Request)  
- Check For Image Prompt (Bluesky) (If)  
- Generate Post Image (Bluesky) (HTTP Request)  
- Resize Image (Bluesky) (Edit Image)  
- Convert to Base64 (Bluesky) (Code)  
- Store Image on Imgbb (Bluesky) (HTTP Request)  
- Generate Post Image (Instagram) (HTTP Request)  
- Convert to Base64 (Instagram) (Code)  
- Store Image on Imgbb (Instagram) (HTTP Request)  

**Node Details:**  

- **Check For Image Prompt (If Nodes)**  
  - Type: If  
  - Role: Checks if the generated post JSON contains a non-empty `image_prompt` to decide whether to generate an image.  
  - Config: Checks if `image_prompt` string is not empty.  
  - Input: Validated JSON post data.  
  - Outputs: True branch triggers image generation; false branch triggers no-image posting logic.  

- **Generate Post Image (HTTP Request Nodes)**  
  - Type: HTTP Request  
  - Role: Calls Hugging Face API for text-to-image generation using Stable Diffusion XL base model.  
  - Config: POST request to Hugging Face inference API with Bearer token authentication; sends `image_prompt` as input; expects image/png response.  
  - Input: `image_prompt` string.  
  - Output: Binary image data response (PNG format).  
  - Credentials: Hugging Face Bearer token.  
  - Edge Cases: API rate limits, invalid prompt, authentication failure, network errors.  

- **Resize Image (Bluesky only)**  
  - Type: Edit Image (Resize)  
  - Role: Resizes the generated image to 1080x1080 pixels and converts to webp format for Bluesky image requirements.  
  - Config: Resize operation with fixed dimensions and webp format.  
  - Input: Binary image data from generation node.  
  - Output: Resized image binary data.  
  - Edge Cases: Image corruption, unsupported formats.  

- **Convert to Base64 (Code Nodes)**  
  - Type: Code  
  - Role: Converts binary image data from previous node into base64 string format, preparing for upload.  
  - Config: Returns the raw input binary data as base64 string in `image_data`.  
  - Input: Binary image response.  
  - Output: JSON with base64 encoded image string.  
  - Edge Cases: Binary data missing or corrupted.  

- **Store Image on Imgbb (HTTP Request Nodes)**  
  - Type: HTTP Request  
  - Role: Uploads the base64-encoded image to Imgbb image hosting service via multipart/form-data POST.  
  - Config: Authenticated via API key; image base64 string sent in body; image named dynamically using article creation time, id, and platform; expects JSON response with image URL and ID.  
  - Input: Base64 image string and article metadata.  
  - Output: JSON with Imgbb image info including URL and image ID.  
  - Credentials: Imgbb API key.  
  - Edge Cases: Upload failures, API limits, invalid image data, authentication errors.  

---

#### 2.5 Post Publishing & Airtable Update

**Overview:**  
Finalizes the process by either posting or drafting the generated post (with or without image) to social media via GetLate API, then updates Airtable post records to mark them as published.

**Nodes Involved:**  
- Post/Draft via GetLate API (LinkedIn)3  
- Post/Draft via GetLate API (No Image, LinkedIn)  
- Post/Draft via GetLate API (Bluesky)  
- Post/Draft via GetLate API (No Image, Bluesky)  
- Post/Draft via GetLate API (Instagram)  
- Store Generated Post Content (LinkedIn)  
- Store Generated Post Content (No Image, LinkedIn)  
- Store Generated Post Content (Bluesky)  
- Store Generated Post Content (No Image, Bluesky)  
- Store Generated Post Content (Instagram)  

**Node Details:**  

- **Post/Draft via GetLate API Nodes**  
  - Type: HTTP Request or GetLate node  
  - Role: Publishes or drafts posts on the respective social media platform using GetLate API.  
  - Config:  
    - Includes content text, hashtags, scheduled publish time (immediate or draft), platform-specific account IDs, and media items if images exist.  
    - Uses Bearer authentication with GetLate API token.  
  - Input: Validated JSON post content, Imgbb image URLs if any, post-as-draft flag from settings.  
  - Output: API response confirming post creation or draft.  
  - Credentials: GetLate API token.  
  - Edge Cases: API limits, authentication failure, malformed content, media upload errors.  

- **Store Generated Post Content (Airtable)**  
  - Type: Airtable  
  - Role: Updates or upserts Airtable records for generated posts, marking them as posted (`is_posted=1`), storing post text, hashtags, image metadata, and other metadata.  
  - Config: Matches records by article ID; updates fields with AI-generated outputs and image info if present.  
  - Input: Post content JSON and image data.  
  - Output: Airtable record update confirmation.  
  - Credentials: Airtable Personal Access Token.  
  - Edge Cases: Airtable API limits, record mismatch, update conflicts.

---

### 3. Summary Table

| Node Name                          | Node Type                   | Functional Role                                | Input Node(s)                           | Output Node(s)                                 | Sticky Note                                                                                               |
|-----------------------------------|-----------------------------|-----------------------------------------------|---------------------------------------|------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| RSS Feed Trigger: '#to-share-linkedin' | RSS Feed Trigger           | Trigger new LinkedIn articles from RSS feed   | None                                  | Set Platform (LinkedIn)                        | ## ⚙️ Configure Feed Credentials & Social Media Platform                                                |
| Set Platform (LinkedIn)            | Set                         | Adds platform field "linkedin"                 | RSS Feed Trigger: '#to-share-linkedin' | Markdown: Convert Article Content (LinkedIn) | ## ⚙️ Configure Feed Credentials & Social Media Platform                                                |
| Markdown: Convert Article Content (LinkedIn) | Markdown                 | Converts HTML content to markdown              | Set Platform (LinkedIn)               | Store Article Content (LinkedIn)              |                                                                                                          |
| Store Article Content (LinkedIn)  | Airtable                    | Stores article in Airtable                      | Markdown: Convert Article Content (LinkedIn) | None                                         | ## ⚙️ Configure Airtable Credentials                                                                     |
| RSS Feed Trigger: '#to-share-bluesky' | RSS Feed Trigger           | Trigger new Bluesky articles from RSS feed     | None                                  | Set Platform (Bluesky)                        | ## ⚙️ Configure Feed Credentials & Social Media Platform                                                |
| Set Platform (Bluesky)             | Set                         | Adds platform field "bluesky"                   | RSS Feed Trigger: '#to-share-bluesky' | Markdown: Convert Article Content (Bluesky)  | ## ⚙️ Configure Feed Credentials & Social Media Platform                                                |
| Markdown: Convert Article Content (Bluesky) | Markdown                 | Converts HTML content to markdown              | Set Platform (Bluesky)                | Store Article Content (Bluesky)               |                                                                                                          |
| Store Article Content (Bluesky)   | Airtable                    | Stores article in Airtable                      | Markdown: Convert Article Content (Bluesky) | None                                         | ## ⚙️ Configure Airtable Credentials                                                                     |
| RSS Feed Trigger: '#to-share-instagram"' | RSS Feed Trigger           | Trigger new Instagram articles from RSS feed   | None                                  | Set Platform (Instagram)                      | ## ⚙️ Configure Feed Credentials & Social Media Platform                                                |
| Set Platform (Instagram)           | Set                         | Adds platform field "instagram"                 | RSS Feed Trigger: '#to-share-instagram"' | Markdown: Convert Article Content (Instagram) | ## ⚙️ Configure Feed Credentials & Social Media Platform                                                |
| Markdown: Convert Article Content (Instagram) | Markdown                 | Converts HTML content to markdown              | Set Platform (Instagram)              | Store Article Content (Instagram)             |                                                                                                          |
| Store Article Content (Instagram) | Airtable                    | Stores article in Airtable                      | Markdown: Convert Article Content (Instagram) | None                                         | ## ⚙️ Configure Airtable Credentials                                                                     |
| Set Post Schedule                 | Schedule Trigger            | Triggers workflow weekly for new post creation | None                                  | Set SMCG Custom Parameters & Settings         | ## ⚙️ Define Posting Schedule                                                                             |
| Set SMCG Custom Parameters & Settings | Set                      | Defines AI generation parameters & account IDs | Set Post Schedule                    | Pull New Articles                              | ## ⚙️ Set AI Content Generator Parameters & Settings                                                     |
| Pull New Articles                | Airtable (Search)           | Retrieves unposted articles                      | Set SMCG Custom Parameters & Settings | Filter Platform Duplicates                      | ## ⚙️ Configure Airtable Credentials                                                                     |
| Filter Platform Duplicates       | Code                       | Filters one article per platform                 | Pull New Articles                    | Check Platform                                 |                                                                                                          |
| Check Platform                  | Switch                     | Routes articles to platform-specific branches   | Filter Platform Duplicates            | LinkedIn SMCG Prompt, Bluesky SMCG Prompt, Instagram SMCG Prompt |                                                                                                          |
| LinkedIn SMCG Prompt             | Set                        | Constructs LinkedIn-specific AI prompt          | Check Platform                      | LinkedIn SMCG                                  | ## ⚙️ Configure LLM Credentials                                                                          |
| Bluesky SMCG Prompt              | Set                        | Constructs Bluesky-specific AI prompt            | Check Platform                      | Bluesky SMCG                                   | ## ⚙️ Configure LLM Credentials                                                                          |
| Instagram SMCG Prompt            | Set                        | Constructs Instagram-specific AI prompt          | Check Platform                      | Instagram SMCG                                 | ## ⚙️ Configure LLM Credentials                                                                          |
| LinkedIn SMCG                   | Langchain LLM Chain (Groq) | Generates LinkedIn post content                   | LinkedIn SMCG Prompt                | Validate JSON (LinkedIn)                       | ## ⚙️ Configure LLM Credentials                                                                          |
| Bluesky SMCG                    | Langchain LLM Chain (Groq) | Generates Bluesky post content                    | Bluesky SMCG Prompt                 | Validate JSON (Bluesky)                        | ## ⚙️ Configure LLM Credentials                                                                          |
| Instagram SMCG                  | Langchain LLM Chain (Groq) | Generates Instagram post content                  | Instagram SMCG Prompt               | Validate JSON (Instagram)                      | ## ⚙️ Configure LLM Credentials                                                                          |
| Validate JSON (LinkedIn)        | Code                       | Parses and validates LinkedIn AI output JSON     | LinkedIn SMCG                      | Check For Image Prompt (LinkedIn)              |                                                                                                          |
| Validate JSON (Bluesky)         | Code                       | Parses and validates Bluesky AI output JSON      | Bluesky SMCG                       | Check For Image Prompt (Bluesky)               |                                                                                                          |
| Validate JSON (Instagram)       | Code                       | Parses and validates Instagram AI output JSON    | Instagram SMCG                     | Generate Post Image (Instagram)                |                                                                                                          |
| Check For Image Prompt (LinkedIn) | If                        | Checks if LinkedIn post requires image generation | Validate JSON (LinkedIn)           | Generate Post Image (LinkedIn), Post/Draft via GetLate API (No Image, LinkedIn) |                                                                                                          |
| Check For Image Prompt (Bluesky) | If                         | Checks if Bluesky post requires image generation  | Validate JSON (Bluesky)            | Generate Post Image (Bluesky), Post/Draft via GetLate API (No Image, Bluesky) |                                                                                                          |
| Generate Post Image (LinkedIn)  | HTTP Request               | Calls AI image generation API for LinkedIn image | Check For Image Prompt (LinkedIn)  | Convert to Base64 (LinkedIn)                   | ## ⚙️ Configure Imgbb & Image Generation Service Credentials                                            |
| Generate Post Image (Bluesky)   | HTTP Request               | Calls AI image generation API for Bluesky image  | Check For Image Prompt (Bluesky)   | Resize Image (Bluesky)                         | ## ⚙️ Configure Imgbb & Image Generation Service Credentials                                            |
| Generate Post Image (Instagram) | HTTP Request               | Calls AI image generation API for Instagram image | Validate JSON (Instagram)          | Convert to Base64 (Instagram)                   | ## ⚙️ Configure Imgbb & Image Generation Service Credentials                                            |
| Resize Image (Bluesky)          | Edit Image                 | Resizes Bluesky image to 1080x1080, converts to webp | Generate Post Image (Bluesky)     | Convert to Base64 (Bluesky)                     | ## ⚙️ Configure Imgbb & Image Generation Service Credentials                                            |
| Convert to Base64 (LinkedIn)    | Code                       | Converts LinkedIn image binary to base64          | Generate Post Image (LinkedIn)     | Store Image on Imgbb (LinkedIn)                 | ## ⚙️ Configure Imgbb & Image Generation Service Credentials                                            |
| Convert to Base64 (Bluesky)     | Code                       | Converts Bluesky image binary to base64           | Resize Image (Bluesky)             | Store Image on Imgbb (Bluesky)                  | ## ⚙️ Configure Imgbb & Image Generation Service Credentials                                            |
| Convert to Base64 (Instagram)   | Code                       | Converts Instagram image binary to base64         | Generate Post Image (Instagram)    | Store Image on Imgbb (Instagram)                | ## ⚙️ Configure Imgbb & Image Generation Service Credentials                                            |
| Store Image on Imgbb (LinkedIn) | HTTP Request               | Uploads LinkedIn image to Imgbb hosting            | Convert to Base64 (LinkedIn)       | Post/Draft via GetLate API (LinkedIn)3          | ## ⚙️ Configure Imgbb & Image Generation Service Credentials                                            |
| Store Image on Imgbb (Bluesky)  | HTTP Request               | Uploads Bluesky image to Imgbb hosting             | Convert to Base64 (Bluesky)        | Post/Draft via GetLate API (Bluesky)             | ## ⚙️ Configure Imgbb & Image Generation Service Credentials                                            |
| Store Image on Imgbb (Instagram)| HTTP Request               | Uploads Instagram image to Imgbb hosting           | Convert to Base64 (Instagram)      | Post/Draft via GetLate API (Instagram)           | ## ⚙️ Configure Imgbb & Image Generation Service Credentials                                            |
| Post/Draft via GetLate API (LinkedIn)3 | GetLate API Node         | Publishes or drafts LinkedIn post                   | Store Image on Imgbb (LinkedIn)    | Store Generated Post Content (LinkedIn)          |                                                                                                          |
| Post/Draft via GetLate API (No Image, LinkedIn) | Airtable Node           | Publishes/drafts LinkedIn post without image       | Check For Image Prompt (LinkedIn)  | Store Generated Post Content (No Image, LinkedIn) |                                                                                                          |
| Post/Draft via GetLate API (Bluesky) | HTTP Request             | Publishes or drafts Bluesky post with image        | Store Image on Imgbb (Bluesky)     | Store Generated Post Content (Bluesky)            |                                                                                                          |
| Post/Draft via GetLate API (No Image, Bluesky) | HTTP Request             | Publishes/drafts Bluesky post without image         | Check For Image Prompt (Bluesky)   | Store Generated Post Content (No Image, Bluesky)  |                                                                                                          |
| Post/Draft via GetLate API (Instagram) | GetLate API Node          | Publishes or drafts Instagram post with image      | Store Image on Imgbb (Instagram)   | Store Generated Post Content (Instagram)           |                                                                                                          |
| Store Generated Post Content (LinkedIn) | Airtable                  | Updates Airtable record to mark LinkedIn post posted | Post/Draft via GetLate API (LinkedIn)3 | None                                         | ## ⚙️ Configure Airtable Credentials                                                                     |
| Store Generated Post Content (No Image, LinkedIn) | Airtable                  | Updates Airtable record to mark LinkedIn no-image post posted | Post/Draft via GetLate API (No Image, LinkedIn) | None                                         | ## ⚙️ Configure Airtable Credentials                                                                     |
| Store Generated Post Content (Bluesky) | Airtable                  | Updates Airtable record to mark Bluesky post posted | Post/Draft via GetLate API (Bluesky) | None                                         | ## ⚙️ Configure Airtable Credentials                                                                     |
| Store Generated Post Content (No Image, Bluesky) | Airtable                  | Updates Airtable record to mark Bluesky no-image post posted | Post/Draft via GetLate API (No Image, Bluesky) | None                                         | ## ⚙️ Configure Airtable Credentials                                                                     |
| Store Generated Post Content (Instagram) | Airtable                  | Updates Airtable record to mark Instagram post posted | Post/Draft via GetLate API (Instagram) | None                                         | ## ⚙️ Configure Airtable Credentials                                                                     |
| Sticky Note4                     | Sticky Note                | Notes to configure Imgbb & Image Generation credentials | Multiple image generation nodes    | Multiple image generation nodes                  | ## ⚙️ Configure Imgbb & Image Generation Service Credentials                                            |
| Sticky Note5                     | Sticky Note                | Notes on defining posting schedule                 | Set Post Schedule                  | Set SMCG Custom Parameters & Settings            | ## ⚙️ Define Posting Schedule                                                                             |
| Sticky Note6                     | Sticky Note                | Notes on setting AI content generator parameters   | Set SMCG Custom Parameters & Settings | Pull New Articles                              | ## ⚙️ Set AI Content Generator Parameters & Settings                                                     |
| Sticky Note7                     | Sticky Note                | Notes on configuring feed credentials & platform   | RSS Feed Trigger nodes             | Set Platform nodes                               | ## ⚙️ Configure Feed Credentials & Social Media Platform                                                |
| Sticky Note8                     | Sticky Note                | Notes on configuring Airtable credentials           | Airtable nodes                    | Airtable nodes                                   | ## ⚙️ Configure Airtable Credentials                                                                     |
| Sticky Note3                     | Sticky Note                | Notes on configuring LLM credentials                 | Groq Chat Model nodes             | Groq Chat Model nodes                            | ## ⚙️ Configure LLM Credentials                                                                          |
| Sticky Note11                    | Sticky Note                | Instagram requires image prompt for posts           | Instagram SMCG branch             | Instagram SMCG branch                            | # 💡 Note\nInstagram is an image-based platform and will always require an image prompt.                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create RSS Feed Trigger nodes** for each platform (LinkedIn, Bluesky, Instagram):  
   - Use the RSS Feed Trigger node.  
   - Set feed URL to your Wallabag instance filtered by platform tag.  
   - Poll every minute.  

2. **Add Set nodes to assign platform strings** ("linkedin", "bluesky", "instagram") respectively to each RSS trigger output.  

3. **Add Markdown nodes** to convert HTML article content to markdown:  
   - Input: `content` field from RSS trigger.  
   - Output key: `content_markdown`.  

4. **Add Airtable nodes to store new articles**:  
   - Configure Airtable base and "RSS Feed - Content Store" table.  
   - Map fields: title, author, feed_id, platform, article_url, content_markdown, is_posted=0.  
   - Use a valid Airtable Personal Access Token (PAT) credential.  

5. **Add a Schedule Trigger node** to run weekly (e.g., every Monday at noon) to kick off content generation.  

6. **Add a Set node to define AI generation parameters** (niche, tone, goal, CTA, target audience, custom tags, image flags, account IDs).  

7. **Add Airtable Search node to pull unposted articles** (`is_posted=0`) from the content store.  

8. **Add a Code node to filter duplicates by platform**, so only one article per platform proceeds per run.  

9. **Add a Switch node to route items by platform** to platform-specific prompt branches.  

10. **For each platform branch (LinkedIn, Bluesky, Instagram):**  
    - Add a Set node to build the platform-specific AI prompt string using parameters and article content.  
    - Add a Langchain Groq Chat Model node configured with model "kimi-k2-instruct-0905" and Groq API credentials.  
    - Connect to a Code node that validates and cleans the AI JSON output (implement JSON parsing, validation, auto-fixing).  

11. **Add If nodes to check if the post requires image generation** (`image_prompt` not empty).  

12. **For posts requiring images:**  
    - Add HTTP Request nodes to call Hugging Face Stable Diffusion XL model API with Bearer token.  
    - For Bluesky, add Edit Image node to resize image to 1080x1080 webp format.  
    - Add Code nodes to convert image binary data to base64 strings.  
    - Add HTTP Request nodes to upload images to Imgbb with API key authentication.  

13. **For posts without images:**  
    - Skip image generation/upload steps.  

14. **Add GetLate API nodes or HTTP Request nodes** to post or draft content on each platform:  
    - Include content, hashtags, media items (if any), account IDs, draft/publish flags.  
    - Use GetLate API Bearer token credentials.  

15. **Add Airtable nodes to upsert generated post content records**:  
    - Mark articles as posted (`is_posted=1`).  
    - Store generated post text, hashtags, image info, and metadata.  

16. **Add Sticky Notes to document credential setup and configuration details** for ease of future reference.  

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                 |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Instagram always requires an image prompt because it is an image-based platform.                 | Sticky Note11                                                                                   |
| Configure Imgbb and Hugging Face API credentials carefully for image generation and hosting.    | Sticky Note4                                                                                   |
| Set posting schedule appropriately to avoid rate limits or spamming social media platforms.     | Sticky Note5                                                                                   |
| Define AI content generator parameters (niche, tone, CTA) to align content with branding goals. | Sticky Note6                                                                                   |
| Configure RSS feed URLs and social media platform settings carefully for accurate content flow. | Sticky Note7                                                                                   |
| Ensure Airtable credentials have sufficient permissions for reading and writing content records. | Sticky Note8                                                                                   |
| Configure and secure LLM credentials (Groq API) to avoid unauthorized access or quota issues.   | Sticky Note3                                                                                   |

---

**Disclaimer:**  
The provided content originates exclusively from an automated workflow created with n8n, respecting current content policies. It contains no illegal, offensive, or protected elements. All data processed is legal and public.