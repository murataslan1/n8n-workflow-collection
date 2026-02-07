Auto-Publish PR News Articles with Featured Images to WordPress from RSS

https://n8nworkflows.xyz/workflows/auto-publish-pr-news-articles-with-featured-images-to-wordpress-from-rss-4913


# Auto-Publish PR News Articles with Featured Images to WordPress from RSS

---

### 1. Workflow Overview

This workflow automates the process of ingesting PR news articles from an RSS feed, extracting their featured images, and publishing them as draft posts on a WordPress website (specifically for the Techeela site). It is designed for PR teams or content managers who want to streamline posting press releases with images automatically fetched and set as featured images.

The workflow consists of the following logical blocks:

- **1.1 RSS Feed Input and Content Extraction:** Polls an RSS feed for new PR news articles and extracts relevant information including the image URL embedded in the content.
- **1.2 WordPress Post Creation:** Creates a new WordPress post draft using the extracted title and content.
- **1.3 Image Handling and Upload:** Downloads the image from the extracted URL, uploads it to WordPress media, and associates it as the featured image of the newly created post.
- **1.4 Post Update with Featured Image:** Updates the WordPress post to set the uploaded media item as the featured image.

---

### 2. Block-by-Block Analysis

#### 2.1 RSS Feed Input and Content Extraction

- **Overview:**  
  This block triggers the workflow by polling an RSS feed (intended to be PR Newswire, though feed URL is empty in the current config). It extracts the article content and parses the first image URL embedded in the HTML content.

- **Nodes Involved:**  
  - RSS Feed Trigger  
  - Code

- **Node Details:**

  **RSS Feed Trigger**  
  - Type: RSS Feed Read Trigger  
  - Role: Polls the RSS feed for new items every minute.  
  - Configuration:  
    - `feedUrl` is currently empty and must be set to the PR news RSS URL.  
    - Polling: every minute (`pollTimes` set to everyMinute mode).  
  - Input: None (trigger node).  
  - Output: Emits new RSS feed items.  
  - Edge Cases:  
    - Empty or invalid feed URL will cause no triggers.  
    - Network errors or feed downtime may cause polling failures.  
    - Frequent polling might hit rate limits on RSS source.

  **Code**  
  - Type: Function (JavaScript)  
  - Role: Parses the content of each RSS item, extracts the first image URL from HTML `src` attribute, and saves it as `imageSrc` in the JSON.  
  - Configuration:  
    - Uses regex `/src=\"(.*?)\"/` to find image URLs in `content`.  
    - If no image is found, sets `imageSrc` to empty string.  
  - Input: RSS feed items JSON.  
  - Output: Modified items with `imageSrc` field.  
  - Edge Cases:  
    - If content is missing or malformed, regex may fail or return null.  
    - Multiple images only first is extracted.  
    - Does not validate image URL format.  
  - Version: Uses `typeVersion=2` for enhanced code node features.

---

#### 2.2 WordPress Post Creation

- **Overview:**  
  Creates a draft post in WordPress using the extracted title and content from the RSS feed item.

- **Nodes Involved:**  
  - Wordpress

- **Node Details:**

  **Wordpress**  
  - Type: WordPress node (API)  
  - Role: Creates a new WordPress post draft with specified metadata.  
  - Configuration:  
    - Title: set dynamically from RSS item’s `title`.  
    - Content: set dynamically from RSS item’s `content`.  
    - Format: standard post format.  
    - Status: draft (not immediately published).  
    - Author ID: 3 (predefined author on the WordPress site).  
    - Categories: array with category ID 1057 (must correspond to relevant category on target site).  
  - Credentials: Connects via WordPress API with credentials (not detailed here).  
  - Input: JSON with article data including title and content.  
  - Output: Returns created post details including post ID.  
  - Edge Cases:  
    - Auth errors if credentials invalid or expired.  
    - Category or author IDs must exist on WordPress or API will error.  
    - API rate limits or downtime can cause failures.

---

#### 2.3 Image Handling and Upload

- **Overview:**  
  Downloads the image from the extracted URL, uploads it to WordPress media library, and prepares to associate it as the post’s featured image.

- **Nodes Involved:**  
  - Set Image URL  
  - GET Image  
  - Upload Image to Wordpress

- **Node Details:**

  **Set Image URL**  
  - Type: Set  
  - Role: Assigns the extracted image URL from the Code node to a new field `image-url`.  
  - Configuration:  
    - Sets `image-url` to the value of `imageSrc` from the Code node's JSON.  
  - Input: Post JSON with `imageSrc`.  
  - Output: JSON with `image-url` field for next node.  
  - Edge Cases:  
    - If `imageSrc` is empty, subsequent nodes may fail downloading image.

  **GET Image**  
  - Type: HTTP Request  
  - Role: Downloads the image binary data from the URL set in `image-url`.  
  - Configuration:  
    - URL set dynamically from `$json["image-url"]`.  
    - No special headers or authentication.  
    - Expects binary data output for upload.  
  - Input: JSON with `image-url`.  
  - Output: Binary image data.  
  - Edge Cases:  
    - Broken image URLs cause 404 or HTTP errors.  
    - Large images may cause timeouts or memory issues.  
    - Network errors or redirects not handled explicitly.

  **Upload Image to Wordpress**  
  - Type: HTTP Request  
  - Role: Uploads image binary data to WordPress media endpoint.  
  - Configuration:  
    - URL: `https://xyz.com/wp-json/wp/v2/media` (replace xyz.com with actual domain).  
    - Method: POST with binary data in body.  
    - Header `Content-Disposition`: sets filename dynamically as `cover-image-{postId}.jpeg` using WordPress post ID from previous node.  
    - Authentication: Uses predefined WordPress API credentials.  
    - Content-Type: binary data.  
  - Input: Binary image data from GET Image.  
  - Output: JSON response from WordPress media upload containing media ID.  
  - Edge Cases:  
    - Auth errors or permission denied if credentials insufficient.  
    - File size or type restrictions by WordPress server.  
    - Incorrect URL or domain misconfiguration.

---

#### 2.4 Post Update with Featured Image

- **Overview:**  
  Updates the WordPress post to set the uploaded media item as the featured image.

- **Nodes Involved:**  
  - Set Image on Wordpress Post

- **Node Details:**

  **Set Image on Wordpress Post**  
  - Type: HTTP Request  
  - Role: Updates the post's featured_media attribute with the uploaded media ID.  
  - Configuration:  
    - URL: `https://xyz.com/wp-json/wp/v2/posts/{postId}` - dynamically filled with WordPress post ID.  
    - Method: POST (WordPress REST API to update post).  
    - Query Parameter `featured_media` set to the media ID returned from Upload Image to Wordpress node.  
    - Authentication: uses WordPress API credentials.  
  - Input: JSON with media ID from upload node.  
  - Output: Updated post JSON confirming featured image set.  
  - Edge Cases:  
    - Auth errors or permissions issues.  
    - Invalid media ID or post ID.  
    - API errors if post is locked or deleted between steps.

---

### 3. Summary Table

| Node Name             | Node Type              | Functional Role                              | Input Node(s)           | Output Node(s)           | Sticky Note                                      |
|-----------------------|------------------------|----------------------------------------------|-------------------------|--------------------------|-------------------------------------------------|
| RSS Feed Trigger       | rssFeedReadTrigger     | Polls PR news RSS feed for new articles      | -                       | Code                     | ## Feed from PR Newswire                         |
| Code                  | Function (Code)        | Extracts image URL from article content      | RSS Feed Trigger         | Wordpress                |                                                 |
| Wordpress             | Wordpress API          | Creates draft WordPress post                  | Code                    | Set Image URL            |                                                 |
| Set Image URL          | Set                    | Assigns extracted image URL to `image-url`   | Wordpress                | GET Image                |                                                 |
| GET Image             | HTTP Request           | Downloads image binary data                    | Set Image URL            | Upload Image to Wordpress |                                                 |
| Upload Image to Wordpress | HTTP Request        | Uploads image to WordPress media library      | GET Image                | Set Image on Wordpress Post | ## Set Image and Content In Techeela Wordpress Post |
| Set Image on Wordpress Post | HTTP Request      | Sets uploaded image as featured media of post | Upload Image to Wordpress | -                       | ## Set Image and Content In Techeela Wordpress Post |
| Sticky Note1          | Sticky Note            | Visual block label for image & content setting | -                       | -                        | ## Set Image and Content In Techeela Wordpress Post |
| Sticky Note           | Sticky Note            | Visual label for feed source                   | -                       | -                        | ## Feed from PR Newswire                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "RSS Feed Trigger" node:**
   - Type: RSS Feed Read Trigger  
   - Parameters:  
     - Set `feedUrl` to your PR news RSS feed URL (e.g., PR Newswire feed).  
     - Configure polling: every minute (`pollTimes` -> mode: everyMinute).  
   - No credentials needed.  
   - Connect output to the next node.

2. **Create "Code" node:**
   - Type: Function (Code)  
   - Position it after RSS Feed Trigger.  
   - Set JavaScript code to:  
     ```javascript
     const items = $input.all();
     const updatedItems = items.map((item) => {
       const content = item?.json?.content;
       const srcMatch = content.match(/src=\"(.*?)\"/);
       item.json.imageSrc = srcMatch ? srcMatch[1] : "";
       return item;
     });
     return updatedItems;
     ```  
   - Connect RSS Feed Trigger output to this node input.

3. **Create "Wordpress" node:**
   - Type: Wordpress (API) node.  
   - Configure credentials with your WordPress API credentials (OAuth2 or Application Password).  
   - Parameters:  
     - Title: `={{ $json.title }}`  
     - Content: `={{ $json.content }}`  
     - Status: draft  
     - Format: standard  
     - Author ID: 3 (adjust if needed)  
     - Categories: [1057] (adjust category ID to your site)  
   - Connect Code node output to this node input.

4. **Create "Set Image URL" node:**
   - Type: Set  
   - Parameters:  
     - Assign `image-url` to `={{ $('Code').item.json.imageSrc }}`  
   - Connect Wordpress node output to this node input.

5. **Create "GET Image" node:**
   - Type: HTTP Request  
   - Parameters:  
     - Method: GET (default)  
     - URL: `={{ $json["image-url"] }}`  
     - No authentication.  
   - Connect Set Image URL node output to this node input.

6. **Create "Upload Image to Wordpress" node:**
   - Type: HTTP Request  
   - Configure credentials with WordPress API credentials.  
   - Parameters:  
     - URL: `https://xyz.com/wp-json/wp/v2/media` (replace xyz.com with your WordPress domain).  
     - Method: POST  
     - Content-Type: binary data (to send image)  
     - Header: `Content-Disposition: attachment; filename="cover-image-{{ $('Wordpress').item.json.id }}.jpeg"`  
     - Enable sending binary data from previous node.  
   - Connect GET Image node output to this node input.

7. **Create "Set Image on Wordpress Post" node:**
   - Type: HTTP Request  
   - Configure credentials with WordPress API credentials.  
   - Parameters:  
     - URL: `https://xyz.com/wp-json/wp/v2/posts/{{ $('Wordpress').item.json.id }}` (replace domain)  
     - Method: POST  
     - Query Parameter: `featured_media` = `={{ $json.id }}` (media ID from Upload Image node)  
   - Connect Upload Image to Wordpress node output to this node input.

8. **Add Sticky Notes for clarity (optional):**
   - Create sticky note near RSS Feed Trigger with content: "## Feed from PR Newswire"  
   - Create sticky note near Upload Image and Set Image on Wordpress Post nodes with content: "## Set Image and Content In Techeela Wordpress Post"

9. **Link all nodes in this order:**
   - RSS Feed Trigger → Code → Wordpress → Set Image URL → GET Image → Upload Image to Wordpress → Set Image on Wordpress Post

10. **Activate the workflow:**
    - Ensure all credentials are valid and tested.  
    - Enable the workflow to start polling and processing automatically.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                             |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| The WordPress API endpoints require correct domain substitution from `xyz.com` to your live site | Replace all `https://xyz.com` URLs with your WordPress site URL before deployment. |
| Author ID and Category ID must exist on your WordPress site; adjust accordingly                   | WordPress Admin Panel → Users and Categories to find IDs    |
| PR Newswire RSS feed URL must be set in the RSS Feed Trigger node for the workflow to function   | Example PR News RSS feed: https://www.prnewswire.com/rss   |
| WordPress media upload endpoint requires appropriate permissions (usually via OAuth2 or Application Password) | WordPress REST API documentation: https://developer.wordpress.org/rest-api/ |

---

**disclaimer** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.