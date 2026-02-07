Auto-Generate & Publish SEO Articles to WordPress with GPT-4 + Postgres Tracking

https://n8nworkflows.xyz/workflows/auto-generate---publish-seo-articles-to-wordpress-with-gpt-4---postgres-tracking-3887


# Auto-Generate & Publish SEO Articles to WordPress with GPT-4 + Postgres Tracking

### 1. Workflow Overview

This workflow automates the generation and publication of SEO-optimized blog articles on a WordPress site using GPT-4 and PostgreSQL for category tracking. It is designed for content creators who want to automate content farming, affiliate blogging, micro-niche sites, or PBNs with category rotation to avoid duplication.

The workflow is logically divided into these main blocks:

- **1.1 Initialization & Scheduling:** Sets the WordPress domain and triggers the workflow on a schedule.
- **1.2 Category Management:** Loads WordPress categories, filters out excluded ones, fetches recent usage from PostgreSQL, and selects the least-used category for the next post.
- **1.3 Title Generation:** Retrieves recent article titles for the selected category and uses GPT to generate a unique, SEO-friendly article title.
- **1.4 Article Content Generation:** Uses GPT to write a fully formatted WordPress HTML article with headings, TOC, lists, CTA, and Yoast SEO blocks.
- **1.5 Image Creation & Upload:** Generates a placeholder cover image URL, downloads the image, and uploads it to WordPress media.
- **1.6 Post Preparation & Publishing:** Merges all post metadata (title, content, category, featured image), prepares the JSON payload, publishes the post to WordPress, and updates the PostgreSQL database with the used category and post info.

---

### 2. Block-by-Block Analysis

#### 1.1 Initialization & Scheduling

- **Overview:**  
  This block initializes the workflow by setting the WordPress domain and triggers the workflow execution every few hours.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Config (Set node)

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Starts the workflow automatically on a recurring schedule (hourly).  
    - Configuration: Triggers every hour (interval in hours, no specific minute set).  
    - Inputs: None (trigger node)  
    - Outputs: Connects to Config node.  
    - Edge Cases: If the workflow is disabled or scheduling conflicts occur, no execution.  
    - Notes: Sticky Note1 explains this triggers every few hours.

  - **Config**  
    - Type: Set  
    - Role: Defines the WordPress domain URL used in API calls.  
    - Configuration: Sets a single string variable `domain` with the WordPress site URL (default placeholder `https://yourdomain.com`).  
    - Inputs: From Schedule Trigger  
    - Outputs: Connects to Load Categories node.  
    - Edge Cases: If domain is not set correctly, API calls will fail.  
    - Notes: Sticky Note22 reminds to set your WordPress domain here.

---

#### 1.2 Category Management

- **Overview:**  
  Loads all WordPress categories via REST API, filters out excluded categories, queries PostgreSQL for recent category usage, and selects the least-used category for the next post.

- **Nodes Involved:**  
  - Load Categories (HTTP Request)  
  - Category Filter (Code)  
  - Selecting recent (PostgreSQL)  
  - Picks Less Used (Code)

- **Node Details:**

  - **Load Categories**  
    - Type: HTTP Request  
    - Role: Retrieves up to 100 WordPress categories from `/wp-json/wp/v2/categories`.  
    - Configuration: URL uses `domain` variable from Config node. No authentication needed (public endpoint).  
    - Inputs: From Config  
    - Outputs: Connects to Category Filter.  
    - Edge Cases: Fails if REST API is blocked or categories endpoint is inaccessible.  
    - Notes: Sticky Note20 explains requirements for public access and category existence.

  - **Category Filter**  
    - Type: Code  
    - Role: Filters out unwanted category IDs (e.g., 1, 11, 12, 13, 15, 17, 18, 36, 37, 38, 39) that are not suitable for AI-generated posts.  
    - Configuration: JavaScript filters input items by excluding specific IDs and returns simplified category objects (id, name, description, link).  
    - Inputs: From Load Categories  
    - Outputs: Connects to Selecting recent.  
    - Edge Cases: If no categories remain after filtering, downstream nodes may fail.  
    - Notes: Sticky Note3 explains filtering rationale.

  - **Selecting recent**  
    - Type: PostgreSQL  
    - Role: Queries the `used_categories` table to get the last usage timestamp per category, ordered ascending (least recently used first).  
    - Configuration: SQL query selects category_id and max(used_at), grouped by category_id.  
    - Inputs: From Category Filter  
    - Outputs: Connects to Picks Less Used.  
    - Edge Cases: DB connection failure, missing table, or empty results.  
    - Notes: Sticky Note21 reminds to create the table and configure credentials.

  - **Picks Less Used**  
    - Type: Code  
    - Role: Compares filtered categories with DB usage data to select the category least recently used. If no usage data, picks the first category.  
    - Configuration: JavaScript builds a map of used categories and timestamps, then selects the category with the oldest or no usage.  
    - Inputs: From Category Filter and Selecting recent (merged implicitly)  
    - Outputs: Connects to 10 latest headlines and Merge heading nodes.  
    - Edge Cases: Throws error if no categories available.  
    - Notes: Sticky Note5 explains this picks the least-used category.

---

#### 1.3 Title Generation

- **Overview:**  
  Retrieves recent article titles for the selected category from PostgreSQL and uses GPT to generate a unique, SEO-optimized article title.

- **Nodes Involved:**  
  - 10 latest headlines (PostgreSQL)  
  - AI Agent SEO Headings (Langchain Agent)  
  - New article title (Code)  
  - Merge heading (Merge)  
  - Combines full post meta (Code)

- **Node Details:**

  - **10 latest headlines**  
    - Type: PostgreSQL  
    - Role: Fetches the 10 most recent article titles and descriptions for the selected category to avoid duplication.  
    - Configuration: SQL query with category_id filter and limit 10, ordered by used_at descending.  
    - Inputs: From Picks Less Used  
    - Outputs: Connects to AI Agent SEO Headings.  
    - Edge Cases: DB connection issues or empty results.  
    - Notes: Sticky Note6 describes loading latest titles.

  - **AI Agent SEO Headings**  
    - Type: Langchain Agent (OpenAI GPT)  
    - Role: Generates a new unique article title based on the selected category name, description, and recent article titles.  
    - Configuration: Prompt instructs GPT to produce a narrow, practical, clickable, professional title without duplicates or clickbait. Output is plain text only.  
    - Inputs: From 10 latest headlines and Picks Less Used (category info)  
    - Outputs: Connects to New article title.  
    - Credentials: OpenAI API (GPT-4-mini or better)  
    - Edge Cases: API rate limits, malformed prompt, or empty input data.  
    - Notes: Sticky Note7 explains GPT title generation.

  - **New article title**  
    - Type: Code  
    - Role: Extracts the generated title from GPT output and formats it as JSON with a `title` field.  
    - Inputs: From AI Agent SEO Headings  
    - Outputs: Connects to Merge heading.  
    - Edge Cases: Empty or malformed GPT output.  
    - Notes: Sticky Note8 describes title preparation.

  - **Merge heading**  
    - Type: Merge  
    - Role: Combines the selected category data and the new article title into one data stream.  
    - Inputs: From Picks Less Used and New article title  
    - Outputs: Connects to Combines full post meta.  
    - Edge Cases: Mismatched inputs or missing data.  
    - Notes: Sticky Note9 mentions merging category + title data.

  - **Combines full post meta**  
    - Type: Code  
    - Role: Aggregates all metadata from inputs into a single JSON object for downstream use.  
    - Inputs: From Merge heading and other nodes (later connections)  
    - Outputs: Connects to Updating posts DB.  
    - Edge Cases: Data overwrite if keys conflict.  
    - Notes: Sticky Note10 describes combining post metadata.

---

#### 1.4 Article Content Generation

- **Overview:**  
  Uses GPT to generate a fully formatted WordPress article with native HTML blocks, including paragraphs, headings, lists, table of contents, conclusion, and call-to-action.

- **Nodes Involved:**  
  - OpenAI Chat Model (GPT-4)  
  - AI Agent SEO writer (Langchain Agent)  
  - Extracting output (Code)  
  - Merge (Merge node)

- **Node Details:**

  - **OpenAI Chat Model**  
    - Type: Langchain OpenAI Chat Model  
    - Role: Provides GPT-4 (full version) for content generation.  
    - Configuration: Model set to `gpt-4.1-2025-04-14`.  
    - Inputs: From AI Agent SEO writer (ai_languageModel input)  
    - Outputs: Connects to AI Agent SEO writer.  
    - Credentials: OpenAI API  
    - Edge Cases: API limits, timeouts, or malformed prompts.

  - **AI Agent SEO writer**  
    - Type: Langchain Agent  
    - Role: Generates the full WordPress-style HTML article based on the selected category and title.  
    - Configuration: Prompt specifies strict WordPress block formatting, structure with TOC, headings, paragraphs, lists, conclusion, and CTA with dynamic link.  
    - Inputs: From Combines full post meta (category and title info)  
    - Outputs: Connects to Placeholder creator and Extracting output.  
    - Credentials: OpenAI API  
    - Edge Cases: GPT output not following strict block format, empty content.  
    - Notes: Sticky Note12 details writing instructions and block structure.

  - **Extracting output**  
    - Type: Code  
    - Role: Extracts the `output` field from GPT response as the article content.  
    - Inputs: From AI Agent SEO writer  
    - Outputs: Connects to Merge node.  
    - Edge Cases: Missing or malformed output field.  
    - Notes: Sticky Note13 describes content extraction.

  - **Merge**  
    - Type: Merge  
    - Role: Combines multiple inputs: updated post metadata, article content, and image info.  
    - Inputs: From Extracting output, Updating posts DB, and Media Upload to WP  
    - Outputs: Connects to Prepare Post JSON.  
    - Edge Cases: Data conflicts or missing inputs.

---

#### 1.5 Image Creation & Upload

- **Overview:**  
  Creates a placeholder cover image URL based on the post title, downloads the image, and uploads it to WordPress media library.

- **Nodes Involved:**  
  - Placeholder creator (Code)  
  - Download Image (HTTP Request)  
  - Media Upload to WP (HTTP Request)

- **Node Details:**

  - **Placeholder creator**  
    - Type: Code  
    - Role: Generates a placeholder image URL using `placehold.co` with the post title text encoded.  
    - Inputs: From Updating posts DB (post metadata)  
    - Outputs: Connects to Download Image.  
    - Edge Cases: Missing title or domain causes fallback to default text.  
    - Notes: Sticky Note14 explains placeholder image creation.

  - **Download Image**  
    - Type: HTTP Request  
    - Role: Downloads the placeholder image as binary data.  
    - Configuration: URL from Placeholder creator output, response format set to file.  
    - Inputs: From Placeholder creator  
    - Outputs: Connects to Media Upload to WP.  
    - Edge Cases: Network errors, invalid URL, or timeout.  
    - Notes: Sticky Note15 describes image download.

  - **Media Upload to WP**  
    - Type: HTTP Request  
    - Role: Uploads the downloaded image to WordPress media endpoint `/wp-json/wp/v2/media`.  
    - Configuration: POST method, binary data sent with headers for content disposition and type, uses WordPress credentials.  
    - Inputs: From Download Image  
    - Outputs: Connects to Merge node.  
    - Credentials: WordPress API credential with media upload scope.  
    - Edge Cases: Authentication failure, file size limits, or API errors.  
    - Notes: Sticky Note16 explains media upload.

---

#### 1.6 Post Preparation & Publishing

- **Overview:**  
  Prepares the final JSON payload for the WordPress post, publishes it via REST API, and updates the PostgreSQL database with the used category and post information.

- **Nodes Involved:**  
  - Prepare Post JSON (Code)  
  - Post to WP (HTTP Request)  
  - Updating posts DB (PostgreSQL)  
  - No Operation, do nothing (NoOp)  

- **Node Details:**

  - **Prepare Post JSON**  
    - Type: Code  
    - Role: Consolidates all inputs (image info, content, category, title) into the final JSON structure required by WordPress `/posts` endpoint.  
    - Inputs: From Merge node (combined content, image, category)  
    - Outputs: Connects to Post to WP.  
    - Edge Cases: Missing required fields like title or content cause failure.  
    - Notes: Sticky Note18 describes JSON preparation.

  - **Post to WP**  
    - Type: HTTP Request  
    - Role: Publishes the post to WordPress via `/wp-json/wp/v2/posts`.  
    - Configuration: POST method, body parameters include title, content, status (publish), featured_media (image ID), and categories array. Uses WordPress credentials.  
    - Inputs: From Prepare Post JSON  
    - Outputs: Connects to No Operation, do nothing.  
    - Credentials: WordPress API credential with post creation scope.  
    - Edge Cases: Authentication failure, invalid post data, or API errors.  
    - Notes: Sticky Note19 explains publishing step.

  - **Updating posts DB**  
    - Type: PostgreSQL  
    - Role: Upserts the used category and post metadata into the `used_categories` table to track usage and avoid duplicates.  
    - Configuration: Upsert operation with matching on `category_id`, updates name, title, description, and timestamp.  
    - Inputs: From Combines full post meta  
    - Outputs: Connects to AI Agent SEO writer and Merge node.  
    - Credentials: PostgreSQL credential with insert/update rights.  
    - Edge Cases: DB connection failure or constraint violations.  
    - Notes: Sticky Note11 describes saving used category and title.

  - **No Operation, do nothing**  
    - Type: NoOp  
    - Role: Terminal node after publishing, no further action.  
    - Inputs: From Post to WP  
    - Outputs: None  
    - Edge Cases: None.

---

### 3. Summary Table

| Node Name              | Node Type                      | Functional Role                         | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                                                  |
|------------------------|--------------------------------|---------------------------------------|-------------------------------|-------------------------------|----------------------------------------------------------------------------------------------|
| Schedule Trigger       | Schedule Trigger               | Triggers workflow on schedule         | None                          | Config                        | ⏰ Triggers this workflow every few hours.                                                   |
| Config                 | Set                           | Sets WordPress domain variable        | Schedule Trigger              | Load Categories               | ! Set your WordPress domain inside the “Config” Set node.                                  |
| Load Categories        | HTTP Request                  | Loads all WordPress categories        | Config                       | Category Filter               | 📥 Loads all WordPress categories.                                                          |
| Category Filter        | Code                          | Filters out excluded categories       | Load Categories              | Selecting recent             | 🧹 Filters out excluded category IDs.                                                       |
| Selecting recent       | PostgreSQL                    | Queries recent category usage          | Category Filter              | Picks Less Used              | 🗃 Loads recently used categories from DB.                                                  |
| Picks Less Used        | Code                          | Selects least-used category            | Selecting recent             | 10 latest headlines, Merge heading | 🎯 Picks least-used category for next post.                                                  |
| 10 latest headlines    | PostgreSQL                    | Fetches recent article titles          | Picks Less Used              | AI Agent SEO Headings        | 📄 Loads 10 latest article titles for the selected category.                                |
| AI Agent SEO Headings  | Langchain Agent (OpenAI)      | Generates unique article title          | 10 latest headlines, Picks Less Used | New article title            | 🧠 Generates a unique article title with GPT.                                               |
| New article title      | Code                          | Extracts GPT-generated title           | AI Agent SEO Headings        | Merge heading                | 🧾 Prepares the new article title.                                                          |
| Merge heading          | Merge                         | Merges category and title data         | Picks Less Used, New article title | Combines full post meta      | 🔀 Merges category + title data.                                                            |
| Combines full post meta| Code                          | Combines all post metadata             | Merge heading, others        | Updating posts DB            | 📦 Combines all post metadata into one object.                                             |
| Updating posts DB      | PostgreSQL                    | Upserts used category and title to DB | Combines full post meta      | AI Agent SEO writer, Merge   | 📝 Saves used category and title to DB.                                                    |
| AI Agent SEO writer    | Langchain Agent (OpenAI)      | Generates full WordPress HTML article  | Updating posts DB, Combines full post meta | Placeholder creator, Extracting output | ✍️ Writes full WordPress-style HTML article.                                               |
| Extracting output      | Code                          | Extracts article content from GPT output | AI Agent SEO writer          | Merge                       | 🧾 Extracts content block from AI output.                                                  |
| Placeholder creator    | Code                          | Creates placeholder image URL          | Updating posts DB            | Download Image              | 🖼 Prepares a placeholder cover image URL.                                                 |
| Download Image         | HTTP Request                  | Downloads placeholder image            | Placeholder creator          | Media Upload to WP          | ⬇️ Downloads the cover image.                                                              |
| Media Upload to WP     | HTTP Request                  | Uploads image to WordPress media       | Download Image               | Merge                       | 📤 Uploads image to WordPress media.                                                      |
| Merge                  | Merge                         | Merges image, content, and category info | Extracting output, Updating posts DB, Media Upload to WP | Prepare Post JSON           | 🔗 Merges image + content + category info.                                                |
| Prepare Post JSON      | Code                          | Prepares final JSON for WordPress post | Merge                       | Post to WP                  | 📬 Prepares final JSON body for the WP post.                                              |
| Post to WP             | HTTP Request                  | Publishes post to WordPress            | Prepare Post JSON            | No Operation, do nothing    | 🚀 Publishes post to your WordPress site.                                                |
| No Operation, do nothing| NoOp                         | Terminal node after publishing         | Post to WP                  | None                       |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Set to trigger every hour (interval: hours, no specific minute).  
   - This node starts the workflow automatically.

2. **Create a Set node named "Config":**  
   - Add a string variable `domain` with your WordPress site URL (e.g., `https://yourdomain.com`).  
   - Connect Schedule Trigger → Config.

3. **Create an HTTP Request node "Load Categories":**  
   - Method: GET  
   - URL: `={{ $json.domain }}/wp-json/wp/v2/categories?per_page=100`  
   - No authentication required.  
   - Connect Config → Load Categories.

4. **Create a Code node "Category Filter":**  
   - JavaScript to exclude categories by IDs `[1, 11, 12, 13, 15, 17, 18, 36, 37, 38, 39]`.  
   - Return filtered categories with fields: id, name, description, link.  
   - Connect Load Categories → Category Filter.

5. **Create a PostgreSQL node "Selecting recent":**  
   - Credentials: YOUR_POSTGRES_CREDENTIAL (configured with DB access).  
   - Query:  
     ```sql
     SELECT category_id, MAX(used_at) AS last_used_at
     FROM used_categories
     GROUP BY category_id
     ORDER BY last_used_at ASC;
     ```  
   - Connect Category Filter → Selecting recent.

6. **Create a Code node "Picks Less Used":**  
   - JavaScript to select the category with the oldest or no usage timestamp.  
   - Throws error if no categories available.  
   - Connect Selecting recent → Picks Less Used.

7. **Create a PostgreSQL node "10 latest headlines":**  
   - Credentials: YOUR_POSTGRES_CREDENTIAL.  
   - Query:  
     ```sql
     SELECT name, description
     FROM used_categories
     WHERE category_id = {{ $json.id }}
     ORDER BY used_at DESC
     LIMIT 10;
     ```  
   - Connect Picks Less Used → 10 latest headlines.

8. **Create a Langchain Agent node "AI Agent SEO Headings":**  
   - Credentials: YOUR_OPENAI_CREDENTIAL.  
   - Prompt: Instruct GPT to generate a unique, practical, clickable article title based on category info and recent titles. Output plain text only.  
   - Connect 10 latest headlines and Picks Less Used → AI Agent SEO Headings.

9. **Create a Code node "New article title":**  
   - Extract GPT output as `title` JSON field.  
   - Connect AI Agent SEO Headings → New article title.

10. **Create a Merge node "Merge heading":**  
    - Merge Picks Less Used and New article title outputs.  
    - Connect Picks Less Used and New article title → Merge heading.

11. **Create a Code node "Combines full post meta":**  
    - Combine all incoming JSON data into one object.  
    - Connect Merge heading → Combines full post meta.

12. **Create a PostgreSQL node "Updating posts DB":**  
    - Credentials: YOUR_POSTGRES_CREDENTIAL.  
    - Operation: Upsert into `used_categories` table matching on `category_id`.  
    - Columns: name, title, used_at (current timestamp), category_id, description.  
    - Connect Combines full post meta → Updating posts DB.

13. **Create a Langchain Agent node "AI Agent SEO writer":**  
    - Credentials: YOUR_OPENAI_CREDENTIAL.  
    - Prompt: Generate a full WordPress HTML article with strict block formatting, TOC, headings, lists, conclusion, and CTA with dynamic link.  
    - Connect Updating posts DB → AI Agent SEO writer.

14. **Create a Code node "Extracting output":**  
    - Extract GPT output content as `content` JSON field.  
    - Connect AI Agent SEO writer → Extracting output.

15. **Create a Code node "Placeholder creator":**  
    - Generate a placeholder image URL using `placehold.co` with encoded post title text.  
    - Connect Updating posts DB → Placeholder creator.

16. **Create an HTTP Request node "Download Image":**  
    - Method: GET  
    - URL: `={{ $json.image_url }}` from Placeholder creator.  
    - Response Format: File (binary).  
    - Connect Placeholder creator → Download Image.

17. **Create an HTTP Request node "Media Upload to WP":**  
    - Method: POST  
    - URL: `={{ $('Config').first().json.domain }}/wp-json/wp/v2/media`  
    - Send Body: Binary data from Download Image.  
    - Headers:  
      - Content-Disposition: attachment; filename=crypto.webp  
      - Content-Type: image/png  
    - Authentication: Use WordPress API credential (`YOUR_WORDPRESS_CREDENTIAL`).  
    - Connect Download Image → Media Upload to WP.

18. **Create a Merge node "Merge":**  
    - Merge Extracting output, Updating posts DB, and Media Upload to WP outputs.  
    - Connect Extracting output, Updating posts DB, Media Upload to WP → Merge.

19. **Create a Code node "Prepare Post JSON":**  
    - Consolidate merged data into final JSON for WordPress post:  
      - title  
      - content  
      - status: "publish"  
      - categories: array with category ID  
      - featured_media: image ID from media upload  
    - Connect Merge → Prepare Post JSON.

20. **Create an HTTP Request node "Post to WP":**  
    - Method: POST  
    - URL: `={{ $('Config').first().json.domain }}/wp-json/wp/v2/posts`  
    - Body Parameters: title, content, status, featured_media, categories[0]  
    - Authentication: WordPress API credential.  
    - Connect Prepare Post JSON → Post to WP.

21. **Create a No Operation node "No Operation, do nothing":**  
    - Terminal node after publishing.  
    - Connect Post to WP → No Operation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| # 🤖 WordPress Blog Automation Workflow Setup Instructions: Includes domain setup, credential creation, PostgreSQL bootstrap SQL, and first test instructions. Keep credential names exactly as referenced.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Sticky Note on workflow start (Sticky Note)                                                        |
| This workflow requires three credentials in n8n: YOUR_WORDPRESS_CREDENTIAL (for media and posts API), YOUR_POSTGRES_CREDENTIAL (for category tracking), and YOUR_OPENAI_CREDENTIAL (GPT-4-mini or better).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Credential setup instructions                                                                       |
| PostgreSQL setup SQL to create database, user, and `used_categories` table with appropriate permissions is provided in the workflow notes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | PostgreSQL bootstrap SQL                                                                           |
| Ensure your WordPress site allows public access to `/wp-json/wp/v2/categories` and that no security plugins block REST API calls. At least one category must exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Sticky Note20                                                                                      |
| The AI prompts are carefully crafted to generate unique, professional, and SEO-friendly titles and articles, strictly formatted with WordPress HTML blocks compatible with Yoast SEO plugin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Sticky Notes7, 12                                                                                  |
| Placeholder images use `https://placehold.co` service with dynamic text based on post title, ensuring a consistent cover image for each post.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Sticky Note14                                                                                     |
| The workflow is designed to avoid duplicate category usage by tracking usage timestamps in PostgreSQL and selecting the least recently used category for new posts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Sticky Notes5, 21                                                                                  |
| Manual testing of the first 3-5 nodes is recommended before enabling the schedule trigger to verify WordPress authentication, OpenAI responses, and database connectivity.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Setup instructions in Sticky Note                                                                 |

---

This document fully describes the workflow’s structure, logic, nodes, and configuration, enabling advanced users or AI agents to understand, reproduce, and maintain the workflow effectively.