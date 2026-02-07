Auto-Generate WordPress Blog Posts from Reddit RSS with Groq AI & Pexels Images

https://n8nworkflows.xyz/workflows/auto-generate-wordpress-blog-posts-from-reddit-rss-with-groq-ai---pexels-images-6522


# Auto-Generate WordPress Blog Posts from Reddit RSS with Groq AI & Pexels Images

### 1. Workflow Overview

This workflow automates the generation and publication of WordPress blog posts based on Reddit RSS feeds using AI content generation, image retrieval from Pexels, and WordPress API integration. It is designed to monitor multiple Reddit subreddits related to AI and technology, transform new posts into engaging blog articles with AI assistance, fetch relevant images, and publish the content to a WordPress site with proper categorization and tagging.

Logical blocks included:

- **1.1 Input Reception (RSS Feed Triggers & Merge):** Watches multiple Reddit RSS feeds for new posts and merges them for processing.
- **1.2 AI Content Generation:** Uses Groq AI language model to generate structured blog post data (title, content, category, tags, image search keyword) from Reddit posts.
- **1.3 Image Retrieval from Pexels:** Queries the Pexels API to find an appropriate image using the AI-generated keyword, with fallback handling if no image is found.
- **1.4 WordPress Taxonomy Management (Categories & Tags):** Searches or creates WordPress categories and tags based on AI outputs, with conditional flows for existing entities.
- **1.5 Post Creation & Media Upload:** Creates the WordPress post as a draft with the gathered metadata, downloads the selected image, uploads it to WordPress media library, sets the image metadata, and associates it as the post’s featured image.
- **1.6 Post Publishing:** Updates the post status from draft to published after media association.
- **1.7 Utility Functions:** Slug generation for image file naming and data structuring nodes.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception (RSS Feed Triggers & Merge)

- **Overview:**  
  Listens to three Reddit RSS feeds (/r/artificial, /r/MachineLearning, /r/ArtificialInteligence) for new posts and merges their outputs into a single stream for unified processing.

- **Nodes Involved:**  
  - RSS Feed Trigger  
  - RSS Feed Trigger1  
  - RSS Feed Trigger2  
  - Triggers Merge

- **Node Details:**  
  - **RSS Feed Trigger / RSS Feed Trigger1 / RSS Feed Trigger2**  
    - Type: RSS Feed Read Trigger  
    - Role: Polls respective subreddit RSS URLs every minute for new posts.  
    - Config: Feed URLs set to Reddit subreddits; polling every minute.  
    - Inputs: None (trigger)  
    - Outputs: New RSS entries  
    - Edge cases: Network timeouts, feed unavailability, or malformed RSS.  
  - **Triggers Merge**  
    - Type: Merge  
    - Role: Combines feed outputs into a single stream (3 inputs).  
    - Inputs: Three RSS feed triggers  
    - Outputs: Unified feed items for AI processing  
    - Edge cases: Order of triggering, data duplication if feeds overlap.

#### 1.2 AI Content Generation

- **Overview:**  
  Converts Reddit posts into structured blog post data (title, content, category, tags, image search keyword) using Groq's Llama3-70B AI model with a custom prompt and output schema.

- **Nodes Involved:**  
  - Groq Chat Model  
  - AI  
  - Structured Output Parser  
  - Create Post Data From AI

- **Node Details:**  
  - **Groq Chat Model**  
    - Type: LangChain Groq LLM Chat Node  
    - Role: Invokes Groq AI model (llama3-70b-8192) with Reddit post data.  
    - Config: Model llama3-70b-8192, no special options.  
    - Inputs: Merged RSS feed data  
    - Outputs: Raw AI response (chat completion)  
    - Edge cases: API limits, model latency, malformed output.  
  - **AI**  
    - Type: LangChain Chain LLM Node  
    - Role: Processes merged feed items into AI prompt text, feeds prompt to Groq Chat Model.  
    - Config: Custom prompt with detailed instructions to generate a blog post with specific style and 5 output fields (title, content, category, tags array, image_search_keyword). Output parser enabled.  
    - Inputs: Merged RSS feed data  
    - Outputs: AI-generated JSON content  
  - **Structured Output Parser**  
    - Type: LangChain Structured Output Parser  
    - Role: Parses AI response JSON string into structured JSON with defined schema.  
    - Config: Schema with required fields (title, content, category, tag array, image_search_keyword).  
    - Inputs: AI node output  
    - Outputs: Clean structured JSON  
    - Edge cases: Parsing errors if AI output is malformed or incomplete.  
  - **Create Post Data From AI**  
    - Type: Set  
    - Role: Extracts and assigns AI output fields into individual JSON properties for downstream nodes.  
    - Config: Assigns title, content, category, tags, image_search_keyword from AI JSON output.  
    - Inputs: Structured Output Parser  
    - Outputs: JSON with separated post fields.

#### 1.3 Image Retrieval from Pexels

- **Overview:**  
  Uses the AI-provided image search keyword to query Pexels API for a relevant photo; handles cases with empty results by defaulting to "ai" keyword.

- **Nodes Involved:**  
  - Pexels HTTP Request image  
  - Pexel Err If  
  - Pexels HTTP Request on Empty  
  - Pexel Merge  
  - Pexel Image Url

- **Node Details:**  
  - **Pexels HTTP Request image**  
    - Type: HTTP Request  
    - Role: Calls Pexels API `/v1/search` with AI image search keyword, fetches 1 image.  
    - Config: Query param `query` set dynamically from image_search_keyword, `per_page=1`. Uses HTTP Header Auth credential for Pexels API key.  
    - Inputs: Create Post Data From AI  
    - Outputs: Pexels search result JSON  
    - Edge cases: API quota exceeded, zero results, network errors.  
  - **Pexel Err If**  
    - Type: If  
    - Role: Checks if the photos array from Pexels response is empty.  
    - Config: Condition tests if `photos` array is empty.  
    - Inputs: Pexels HTTP Request image  
    - Outputs: If true (empty), triggers fallback query; else continues.  
  - **Pexels HTTP Request on Empty**  
    - Type: HTTP Request  
    - Role: Fallback to query Pexels with keyword "ai" if no images found initially.  
    - Config: Fixed query `ai`, `per_page=1`, same authentication.  
    - Inputs: Pexel Err If (true branch)  
    - Outputs: Fallback Pexels response  
  - **Pexel Merge**  
    - Type: Merge  
    - Role: Merges fallback and original Pexels responses into one output stream.  
    - Inputs: Pexel Err If (false and true branches)  
    - Outputs: Unified Pexels response  
  - **Pexel Image Url**  
    - Type: Set  
    - Role: Extracts the landscape URL of the first photo from Pexels response for download.  
    - Config: Sets property "Photo Landscape" to `photos[0].src.landscape`.  
    - Inputs: Pexel Merge  
    - Outputs: JSON with image URL.

#### 1.4 WordPress Taxonomy Management (Categories & Tags)

- **Overview:**  
  Ensures WordPress categories and tags exist for the post by searching existing terms and creating them if absent. This block handles one category and up to four tags, all with conditional logic.

- **Nodes Involved:**  
  - WP Make Category  
  - Category Search  
  - Category Filter  
  - Category Switch  
  - Category Merge  
  - Category ID  
  - WP Make Tag 1, 2, 3, 4  
  - Tag 1 Search, 2 Search, 3 Search, 4 Search  
  - Tag 1 Filter, 2 Filter, 3 Filter, 4 Filter  
  - Tag 1 Switch, 2 Switch, 3 Switch, 4 Switch  
  - Tag 1 Merge, 2 Merge, 3 Merge, 4 Merge  
  - Tag 1 ID, 2 ID, 3 ID, 4 ID

- **Node Details:**  
  - **Category Search**  
    - HTTP GET to WordPress `/categories?search=...` with AI category name.  
    - Searches for existing category.  
  - **Category Filter**  
    - Filters search results to exact name match with AI category.  
  - **Category Switch**  
    - Switch node checks if a category ID exists in filtered results.  
    - If exists, proceeds with found category; else triggers **WP Make Category**.  
  - **WP Make Category**  
    - HTTP POST creates new WordPress category with AI category name.  
    - On error continues (handles duplicate or API errors gracefully).  
  - **Category Merge**  
    - Merges results from search and create flows to unify category data.  
  - **Category ID**  
    - Sets JSON property `category id` to category's WordPress ID for post creation.  
  - For each tag (1 to 4), the workflow repeats similar steps:  
    - Search tag by name  
    - Filter exact match  
    - Switch: if tag exists use it, else create new tag with **WP Make Tag X**  
    - Merge results  
    - Set tag ID for post assignment  
  - Each **WP Make Tag X** is an HTTP POST to WordPress `/tags` endpoint with tag name, continuing on error.  
  - Switch nodes use existence of `id` to decide create/search flow.

- **Edge cases:**  
  - API errors or rate limits on WordPress requests  
  - Categories or tags with similar names causing ambiguity  
  - Empty or malformed AI-generated category/tag fields  
  - Handling of fewer than 4 tags gracefully.

#### 1.5 Post Creation & Media Upload

- **Overview:**  
  Creates the WordPress post as a draft with the generated content and taxonomy, downloads the selected image, uploads it to WordPress media library, updates image metadata, and assigns it as the post’s featured image.

- **Nodes Involved:**  
  - Create Post Data  
  - Create a post  
  - Post ID  
  - Slug Generator  
  - Pexel Image Download  
  - Image Upload To Wordpress  
  - Set alt text and description to image  
  - HTTP Request (set featured_media)  
  - Update a post

- **Node Details:**  
  - **Create Post Data**  
    - Set node collecting final data for post creation, including title, content, category id, and tag ids from previous blocks.  
  - **Create a post**  
    - WordPress node creates draft post with title, content, authorId=1, category and tag IDs.  
  - **Post ID**  
    - Sets `Post id` JSON property from newly created post ID for further operations.  
  - **Slug Generator**  
    - Code node generates a sanitized slug from post title; used to name the image file.  
    - Removes special characters, lowercases, replaces spaces with hyphens.  
  - **Pexel Image Download**  
    - HTTP Request downloads the image from Pexels URL (landscape).  
    - Outputs binary image data.  
  - **Image Upload To Wordpress**  
    - HTTP Request POST to WordPress `/media` endpoint to upload image binary data.  
    - Sets Content-Disposition header with filename derived from slug.  
    - Uses WordPress API credential.  
  - **Set alt text and description to image**  
    - HTTP POST to WordPress `/media/{id}` to update alt text and description with post title.  
  - **HTTP Request (set featured_media)**  
    - HTTP POST to WordPress `/posts/{postId}` with query parameter featured_media set to uploaded media ID.  
  - **Update a post**  
    - WordPress node updates post status from draft to published by post ID.

- **Edge cases:**  
  - Image download failure or invalid URL  
  - Upload errors due to file size or API limits  
  - WordPress API authentication or permission errors  
  - Failure to update post or media metadata  
  - Slug conflicts or invalid characters (slug generation mitigates this).

#### 1.6 Post Publishing

- **Overview:**  
  Final step ensures the post status is set to published after all content and media is associated.

- **Nodes involved:**  
  - Update a post

- **Node details:**  
  - Updates post status to "publish" using WordPress API with post ID.  
  - Inputs: Post ID node output  
  - Edge cases: API errors, race conditions if post is already published.

#### 1.7 Utility Functions

- **Overview:**  
  Contains minor nodes for data formatting and flow control.

- **Nodes involved:**  
  - Set nodes (Create Post Data From AI, Pexel Image Url, Category ID, Tag ID nodes)  
  - Merge nodes (Category Merge, Tag Merge nodes)  
  - Switch and Filter nodes for conditional branching  
  - Slug Generator (Code node)

- **Node details:**  
  - Mostly handle data extraction, transformation, and routing.  
  - Slug generator uses JavaScript code to produce URL-safe slugs.  
  - Merge nodes unify parallel branches.  
  - Switch nodes handle whether to create or use existing taxonomy.

---

### 3. Summary Table

| Node Name                  | Node Type                      | Functional Role                                   | Input Node(s)                         | Output Node(s)                         | Sticky Note                              |
|----------------------------|--------------------------------|-------------------------------------------------|-------------------------------------|---------------------------------------|----------------------------------------|
| RSS Feed Trigger            | RSS Feed Read Trigger          | Watches /r/artificial Reddit RSS feed            | None                                | Triggers Merge                        |                                        |
| RSS Feed Trigger1           | RSS Feed Read Trigger          | Watches /r/MachineLearning Reddit RSS feed       | None                                | Triggers Merge                        |                                        |
| RSS Feed Trigger2           | RSS Feed Read Trigger          | Watches /r/ArtificialInteligence Reddit RSS feed | None                                | Triggers Merge                        |                                        |
| Triggers Merge             | Merge                         | Merges incoming RSS feed triggers                 | RSS Feed Trigger, RSS Feed Trigger1, RSS Feed Trigger2 | AI                                  |                                        |
| Groq Chat Model            | LangChain LLM Chat             | Calls Groq AI to generate blog post data          | AI                                  | AI                                   |                                        |
| AI                         | LangChain Chain LLM            | Prepares prompt and invokes Groq AI                | Triggers Merge                      | Create Post Data From AI              |                                        |
| Structured Output Parser    | LangChain Structured Parser    | Parses AI JSON output into structured data         | AI                                 | Create Post Data From AI              |                                        |
| Create Post Data From AI    | Set                           | Extracts AI output properties for workflow         | Structured Output Parser            | Pexels HTTP Request image             |                                        |
| Pexels HTTP Request image  | HTTP Request                  | Queries Pexels API with AI keyword                 | Create Post Data From AI            | Pexel Err If                        |                                        |
| Pexel Err If               | If                            | Checks if Pexels returned images                    | Pexels HTTP Request image           | Pexels HTTP Request on Empty (if true), Pexel Merge (if false) |                                        |
| Pexels HTTP Request on Empty | HTTP Request                | Fallback Pexels query with keyword "ai"            | Pexel Err If (true branch)          | Pexel Merge                         |                                        |
| Pexel Merge                | Merge                         | Merges original and fallback Pexels responses      | Pexel Err If (both branches)        | Pexel Image Url                     |                                        |
| Pexel Image Url            | Set                           | Extracts landscape photo URL                         | Pexel Merge                        | WP Make Category                    |                                        |
| WP Make Category           | HTTP Request                  | Creates WP category if not found                     | Category Switch                   | Category Merge                     |                                        |
| Category Search            | HTTP Request                  | Searches WP categories by AI category name          | Category Switch                   | Category Filter                   |                                        |
| Category Filter            | Filter                        | Filters exact category name match                    | Category Search                  | Category Merge                    |                                        |
| Category Switch            | Switch                        | Decides to use found category or create new          | WP Make Category, Category Filter | Category Merge, Category Search     |                                        |
| Category Merge             | Merge                         | Merges category search and creation results          | Category Switch                   | Category ID                      |                                        |
| Category ID                | Set                           | Sets final category ID property                       | Category Merge                   | WP Make Tag 1                    |                                        |
| WP Make Tag 1              | HTTP Request                  | Creates first tag if not found                        | Tag 1 Switch                    | Tag 1 Switch                    |                                        |
| Tag 1 Search               | HTTP Request                  | Searches WP tags for first tag                        | Tag 1 Switch                    | Tag 1 Filter                   |                                        |
| Tag 1 Filter               | Filter                        | Filters exact match for first tag                      | Tag 1 Search                   | Tag 1 Merge                    |                                        |
| Tag 1 Switch               | Switch                        | Decides create or use existing first tag               | WP Make Tag 1, Tag 1 Filter      | Tag 1 Merge, Tag 1 Search        |                                        |
| Tag 1 Merge                | Merge                         | Merges create and search results for first tag         | Tag 1 Switch                   | Tag 1 ID                      |                                        |
| Tag 1 ID                   | Set                           | Sets first tag id property                             | Tag 1 Merge                   | WP Make Tag 2                  |                                        |
| WP Make Tag 2              | HTTP Request                  | Creates second tag if not found                         | Tag 2 Switch                   | Tag 2 Switch                  |                                        |
| Tag 2 Search               | HTTP Request                  | Searches WP tags for second tag                         | Tag 2 Switch                   | Tag 2 Filter                 |                                        |
| Tag 2 Filter               | Filter                        | Filters exact match for second tag                       | Tag 2 Search                  | Tag 2 Merge                  |                                        |
| Tag 2 Switch               | Switch                        | Decides create or use existing second tag                | WP Make Tag 2, Tag 2 Filter     | Tag 2 Merge, Tag 2 Search      |                                        |
| Tag 2 Merge                | Merge                         | Merges create and search results for second tag          | Tag 2 Switch                  | Tag 2 ID                    |                                        |
| Tag 2 ID                   | Set                           | Sets second tag id property                              | Tag 2 Merge                  | WP Make Tag 3                |                                        |
| WP Make Tag 3              | HTTP Request                  | Creates third tag if not found                          | Tag 3 Switch                  | Tag 3 Switch                |                                        |
| Tag 3 Search               | HTTP Request                  | Searches WP tags for third tag                          | Tag 3 Switch                  | Tag 3 Filter               |                                        |
| Tag 3 Filter               | Filter                        | Filters exact match for third tag                        | Tag 3 Search                 | Tag 3 Merge                |                                        |
| Tag 3 Switch               | Switch                        | Decides create or use existing third tag                 | WP Make Tag 3, Tag 3 Filter    | Tag 3 Merge, Tag 3 Search    |                                        |
| Tag 3 Merge                | Merge                         | Merges create and search results for third tag            | Tag 3 Switch                 | Tag 3 ID                  |                                        |
| Tag 3 ID                   | Set                           | Sets third tag id property                               | Tag 3 Merge                 | WP Make Tag 4              |                                        |
| WP Make Tag 4              | HTTP Request                  | Creates fourth tag if not found                          | Tag 4 Switch                 | Tag 4 Switch               |                                        |
| Tag 4 Search               | HTTP Request                  | Searches WP tags for fourth tag                          | Tag 4 Switch                 | Tag 4 Filter              |                                        |
| Tag 4 Filter               | Filter                        | Filters exact match for fourth tag                        | Tag 4 Search                | Tag 4 Merge               |                                        |
| Tag 4 Switch               | Switch                        | Decides create or use existing fourth tag                 | WP Make Tag 4, Tag 4 Filter   | Tag 4 Merge, Tag 4 Search   |                                        |
| Tag 4 Merge                | Merge                         | Merges create and search results for fourth tag            | Tag 4 Switch                | Tag 4 ID                 |                                        |
| Tag 4 ID                   | Set                           | Sets fourth tag id property                              | Tag 4 Merge                | Create Post Data           |                                        |
| Create Post Data           | Set                           | Combines final post data including taxonomy IDs          | Tag 4 ID                    | Create a post              |                                        |
| Create a post              | WordPress                     | Creates draft post on WordPress                            | Create Post Data            | Post ID                   |                                        |
| Post ID                   | Set                           | Stores created post ID for subsequent operations          | Create a post              | Slug Generator            |                                        |
| Slug Generator             | Code                          | Generates URL-safe slug from post title for image file    | Post ID                    | Pexel Image Download      |                                        |
| Pexel Image Download       | HTTP Request                  | Downloads image binary from Pexels                         | Pexel Image Url            | Image Upload To Wordpress |                                        |
| Image Upload To Wordpress  | HTTP Request                  | Uploads image binary to WordPress media library            | Pexel Image Download       | Set alt text and description to image |                                        |
| Set alt text and description to image | HTTP Request        | Updates image alt text and description with post title     | Image Upload To Wordpress  | HTTP Request (set featured_media) |                                        |
| HTTP Request (set featured_media) | HTTP Request            | Sets uploaded image as featured media for the post        | Set alt text and description to image | Update a post            |                                        |
| Update a post              | WordPress                     | Publishes the post by updating status                      | HTTP Request (set featured_media) | None                    |                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create RSS Feed Trigger nodes (3 total):**  
   - Type: RSS Feed Read Trigger  
   - Parameters:  
     - Feed URLs:  
       - https://www.reddit.com/r/artificial/.rss  
       - https://www.reddit.com/r/MachineLearning/.rss  
       - https://www.reddit.com/r/ArtificialInteligence/.rss  
     - Polling interval: every minute (set in pollTimes)

2. **Create a Merge node "Triggers Merge":**  
   - Type: Merge  
   - Number of inputs: 3  
   - Connect all three RSS Feed Triggers to this node.

3. **Add Groq Chat Model node:**  
   - Type: LangChain LLM Chat (Groq)  
   - Model: llama3-70b-8192  
   - Credential: Groq API credential  
   - Connect output of "AI" node (next step) to this node.

4. **Add AI node (LangChain Chain LLM):**  
   - Type: LangChain Chain LLM  
   - Prompt: Custom prompt as detailed in workflow, describing task to convert Reddit post to blog post with specific style and output fields (title, content, category, tag array, image_search_keyword).  
   - Enable JSON output parser with schema specifying required fields.  
   - Connect "Triggers Merge" output to this node input.  
   - Link this node’s AI output to "Groq Chat Model".

5. **Add Structured Output Parser node:**  
   - Type: LangChain Structured Output Parser  
   - Input schema matching AI output JSON structure.  
   - Connect "Groq Chat Model" output to this node.

6. **Add Set node "Create Post Data From AI":**  
   - Assign extracted AI fields to JSON properties: title, content, category, tags array, image_search_keyword.  
   - Connect Structured Output Parser output to this node.

7. **Add HTTP Request node "Pexels HTTP Request image":**  
   - Method: GET  
   - URL: https://api.pexels.com/v1/search  
   - Query parameters:  
     - query: `={{ $json.image_search_keyword }}`  
     - per_page: 1  
   - Authentication: HTTP Header Auth with Pexels API key credential.  
   - Connect "Create Post Data From AI" output to this node.

8. **Add If node "Pexel Err If":**  
   - Condition: Check if photos array in Pexels response is empty.  
   - Connect "Pexels HTTP Request image" output to this node.

9. **Add fallback HTTP Request node "Pexels HTTP Request on Empty":**  
   - Same as Pexels HTTP Request image but fixed query = "ai".  
   - Connect If node’s true branch (empty) to this node.

10. **Add Merge node "Pexel Merge":**  
    - Merge both Pexels HTTP Request image (false branch) and Pexels HTTP Request on Empty (true branch) outputs.

11. **Add Set node "Pexel Image Url":**  
    - Assign `Photo Landscape` to the first photo’s `src.landscape` URL.  
    - Connect "Pexel Merge" output here.

12. **Category management:**  
    - Add HTTP Request node "Category Search": GET request to WordPress `/categories?search={{ category }}` using WordPress API credentials.  
    - Add Filter node "Category Filter": filters exact match on name.  
    - Add Switch node "Category Switch": branch if category found or not.  
    - Add HTTP Request node "WP Make Category": POST to WordPress `/categories` to create category if needed, continue on error.  
    - Add Merge node "Category Merge": merges search and create results.  
    - Add Set node "Category ID": extract category id from merged result.

13. **Tag management (repeat for 4 tags):**  
    For each tag index (1 to 4):  
    - HTTP Request node "Tag X Search": GET `/tags?search={{ tag }}`  
    - Filter node "Tag X Filter": exact match  
    - Switch node "Tag X Switch": exists or create  
    - HTTP Request node "WP Make Tag X": POST `/tags`, continue on error  
    - Merge node "Tag X Merge"  
    - Set node "Tag X ID": extract tag id

14. **Add Set node "Create Post Data":**  
    - Collect title, content, category id, tag ids into one JSON object.  
    - Connect all Tag ID nodes and Category ID node outputs merged into this node.

15. **Add WordPress node "Create a post":**  
    - Operation: Create post  
    - Title, content from Create Post Data  
    - Categories and tags assigned via IDs  
    - Status: draft  
    - AuthorId: 1 (or as configured)  
    - Connect "Create Post Data" output here.

16. **Add Set node "Post ID":**  
    - Extract post ID from created post for later use.

17. **Add Code node "Slug Generator":**  
    - JavaScript to generate slug from post title for image filename.  
    - Connect "Post ID" output here.

18. **Add HTTP Request node "Pexel Image Download":**  
    - Downloads image binary from Pexel Image Url node.  
    - Connect "Pexel Image Url" output to this node.

19. **Add HTTP Request node "Image Upload To Wordpress":**  
    - POST to WordPress `/media` endpoint with binary data from image download.  
    - Content-Disposition header with filename from slug.  
    - Connect image download output here.

20. **Add HTTP Request node "Set alt text and description to image":**  
    - POST to WordPress `/media/{id}` with alt_text and description set to post title.  
    - Connect image upload output here.

21. **Add HTTP Request node "Set featured media on post":**  
    - POST to WordPress `/posts/{postId}` with query parameter featured_media set to media ID.  
    - Connect previous node output here.

22. **Add WordPress node "Update a post":**  
    - Operation: Update post  
    - Post ID from Post ID node  
    - Status set to publish  
    - Final step in workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                    | Context or Link                                                                                      |
|-------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| The AI prompt and output schema are tailored to produce a friendly, natural blog post with structured JSON fields to facilitate automated parsing. | AI Content Generation Block                                                                          |
| Pexels API key must be configured as HTTP Header Auth credential with the API key in the header `Authorization`                                | Pexels HTTP Request nodes                                                                           |
| WordPress API credentials require OAuth2 or application password setup with appropriate permissions for posts, categories, tags, media.       | WordPress HTTP Request and WordPress nodes                                                         |
| Slug generation code sanitizes titles for safe filename usage, preventing upload errors.                                                        | Slug Generator Node                                                                                  |
| Workflow gracefully handles missing categories or tags by creating them, avoiding post creation errors.                                        | WordPress Taxonomy Management Block                                                                 |
| The workflow assumes 4 tags maximum; if fewer tags are provided, nodes might handle empty or undefined values, but verifying AI output is recommended. | Tag management block                                                                                |
| Post status is initially draft to allow media upload and association before publishing.                                                        | Post Creation & Publishing Block                                                                    |
| Workflow polls