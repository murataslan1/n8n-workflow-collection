Auto-Generate Shopify Blog Related Articles with OpenAI text-embedding-3-small

https://n8nworkflows.xyz/workflows/auto-generate-shopify-blog-related-articles-with-openai-text-embedding-3-small-10542


# Auto-Generate Shopify Blog Related Articles with OpenAI text-embedding-3-small

### 1. Workflow Overview

This workflow automates the process of generating and updating internal related article links for a Shopify blog using semantic similarity computed from OpenAI embeddings. It targets Shopify store blogs to improve SEO and user engagement by dynamically linking related blog articles based on content similarity.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger and Configuration:** Initiates the workflow on a weekly schedule and sets up key parameters for Shopify API access and similarity threshold.

- **1.2 Fetch and Prepare Articles:** Retrieves published articles from a specified Shopify blog, cleans their HTML content, and prepares text for embedding generation.

- **1.3 Generate Embeddings and Save Articles:** Processes each article individually to generate semantic embeddings using OpenAI’s `text-embedding-3-small` model, and stores the article data along with embeddings in a Data Table.

- **1.4 Calculate Semantic Similarities:** Compares embeddings pairwise to calculate cosine similarity scores, filtering for pairs exceeding a configurable similarity threshold to identify related articles.

- **1.5 Manage Article Relations Data:** Saves the identified article relationships in a dedicated Data Table and computes the top 3 related articles per source article based on similarity scores.

- **1.6 Check Existing Related Links and Update:** For each source article, checks if the related articles have changed since last update, prepares HTML for related articles, and updates the Shopify article content accordingly via API.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger and Configuration

**Overview:**  
Starts the workflow on a weekly basis at a specified hour and defines configuration settings for Shopify API and similarity thresholds.

**Nodes Involved:**  
- Schedule Trigger  
- Workflow Configuration

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow every week at 20:00 hours.  
  - Configuration: Recurring weekly trigger, no timezone specified (uses default).  
  - Input: None  
  - Output: Triggers next node  
  - Edge Cases: If workflow disabled or scheduler error, workflow won't run.

- **Workflow Configuration**  
  - Type: Set  
  - Role: Stores key configuration variables such as Shopify Blog ID, domain, store name, API version, and minimum similarity percentage (default 70%).  
  - Key Variables:  
    - `shopifyBlogId`: Shopify blog identifier (must be set before running)  
    - `shopifyBlogDomain`: Base URL for blog articles (e.g., https://example.com/blogs/)  
    - `shopifyStoreName`: Shopify store name prefix for API calls  
    - `shopApiVersion`: Shopify API version, e.g., "2025-07"  
    - `percent_minimum_similarity`: Similarity threshold for related articles (70%)  
  - Input: Trigger from Schedule Trigger  
  - Output: Passes config to next node  
  - Edge Cases: Missing or incorrect config values will cause API call failures or logic errors.

---

#### 2.2 Fetch and Prepare Articles

**Overview:**  
Retrieves published articles from Shopify blog, cleans HTML content (removing scripts, styles, and previous related articles sections), and prepares a text string for embedding generation.

**Nodes Involved:**  
- Get articles from shopify  
- Clean & Prepare Text

**Node Details:**

- **Get articles from shopify**  
  - Type: HTTP Request  
  - Role: Calls Shopify Admin API to fetch all published articles for the configured blog.  
  - Configuration:  
    - URL constructed dynamically using store name, API version, and blog ID.  
    - Query parameter: `published_status=published`  
    - Authentication: Shopify Access Token (OAuth or private app token)  
  - Input: Workflow Configuration output  
  - Output: JSON array of articles  
  - Edge Cases:  
    - API rate limits or auth failure may cause errors.  
    - Empty blog or no published articles returns empty list.  
    - Version-specific Shopify API changes could break endpoint.

- **Clean & Prepare Text**  
  - Type: Code (JavaScript)  
  - Role:  
    - Strips HTML tags, scripts, styles, and removes old related articles sections from article content and summary.  
    - Constructs a combined text string including title, summary, and truncated content (up to 15000 characters) for embeddings.  
    - Returns cleaned article data with metadata and word count.  
  - Key Expressions:  
    - Uses regex to clean HTML and special characters.  
    - Builds `text_for_embedding` field.  
  - Input: JSON array of articles  
  - Output: Array of cleaned, prepared articles  
  - Edge Cases:  
    - Missing or malformed article HTML might cause empty text.  
    - Large content truncated to 15000 chars to fit model limits.

---

#### 2.3 Generate Embeddings and Save Articles

**Overview:**  
Loops over each article, generates semantic embeddings using OpenAI API, enriches article data with embedding, then upserts (inserts or updates) each article into the “articles” Data Table.

**Nodes Involved:**  
- Loop Over Items  
- Set article fields  
- OpenAI Get Embeddings  
- Upsert articles

**Node Details:**

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Role: Processes articles one at a time for embedding generation due to API constraints.  
  - Input: Cleaned articles array  
  - Output: Individual article items per iteration  
  - Edge Cases: Batch size defaults to 1; large datasets increase runtime.

- **Set article fields**  
  - Type: Set  
  - Role: Maps article properties and sets `embedding` field with prepared text for embedding input.  
  - Includes current ISO timestamp as `analyzed_at`.  
  - Input: Single article item  
  - Output: Article JSON with fields ready for embedding API call  
  - Edge Cases: Expression errors if input JSON missing fields.

- **OpenAI Get Embeddings**  
  - Type: HTTP Request  
  - Role: Calls OpenAI embeddings endpoint with `text-embedding-3-small` model using prepared text.  
  - Auth: OpenAI API key credential configured.  
  - Input: Article’s `embedding` text field  
  - Output: Embedding vector JSON from OpenAI  
  - Edge Cases: API rate limits, auth failure, or input too long cause errors.

- **Upsert articles**  
  - Type: Data Table  
  - Role: Inserts or updates article records in Data Table “articles” with full article info and embedding JSON string.  
  - Matching on `shopify_id`.  
  - Input: Article data with embedding vector  
  - Output: Stored article record  
  - Edge Cases: Data Table schema must match; failures if schema missing fields.

**Sticky Note:**  
- Explains the embedding generation and saving process for each article.

---

#### 2.4 Calculate Semantic Similarities

**Overview:**  
Calculates pairwise cosine similarity between article embeddings to find semantically related articles above the configured similarity threshold.

**Nodes Involved:**  
- Calculate similarities  
- Upsert article_relations

**Node Details:**

- **Calculate similarities**  
  - Type: Code (JavaScript)  
  - Role:  
    - Retrieves all articles with embeddings from previous loop.  
    - Parses embedding JSON strings to vectors.  
    - Computes cosine similarity for every distinct pair of articles.  
    - Only keeps pairs with similarity >= configured minimum (default 70%).  
    - Returns list of related article pairs with similarity scores.  
  - Key Functions: `cosineSimilarity(vecA, vecB)`  
  - Throws errors if fewer than 2 articles or if all articles have same ID.  
  - Edge Cases: Handling invalid or mismatched embedding vectors, zero articles, or no relations found.  
  - Output: Array of article relation objects.

- **Upsert article_relations**  
  - Type: Data Table  
  - Role: Saves or updates article relation records in Data Table “article_relations”.  
  - Matching on `source_shopify_id` and `related_shopify_id`.  
  - Input: Relation objects from similarity calculation.  
  - Edge Cases: Schema must include all required fields; concurrency issues if multiple workflows run simultaneously.

**Sticky Note:**  
- Describes core logic for semantic comparison and similarity threshold.

---

#### 2.5 Manage Article Relations Data

**Overview:**  
For each source article, finds the top 3 related articles by similarity, fetches previous related articles snapshot, compares if update is required, and prepares HTML content for related article links.

**Nodes Involved:**  
- Top 3 related articles  
- Loop for source articles  
- Get previous related_articles  
- Check if article already has related  
- Check if related articles are the same  
- Upsert relations  
- Split Related IDs  
- Get related article details  
- Prepare HTML for related articles

**Node Details:**

- **Top 3 related articles**  
  - Type: Code (JavaScript)  
  - Role: Groups relations by source article, sorts related articles by descending similarity, and selects top 3 related article IDs.  
  - Output: Items with `source_shopify_id` and array of top 3 related IDs.

- **Loop for source articles**  
  - Type: SplitInBatches  
  - Role: Processes each source article and its top related IDs one at a time for subsequent operations.

- **Get previous related_articles**  
  - Type: Data Table (Get)  
  - Role: Retrieves previously saved related article IDs snapshot for the source article from Data Table “article_related_links_snapshot”.

- **Check if article already has related**  
  - Type: If  
  - Role: Checks if the current source article exists in the previous snapshot; used to decide update necessity.

- **Check if related articles are the same**  
  - Type: If  
  - Role: Compares current related article IDs with previous snapshot to detect changes.

- **Upsert relations**  
  - Type: Data Table  
  - Role: Updates “article_related_links_snapshot” Data Table with up-to-date related article IDs for the source article.

- **Split Related IDs**  
  - Type: Code (JavaScript)  
  - Role: Splits the comma-separated related article IDs into individual records for detailed fetching.

- **Get related article details**  
  - Type: Data Table (Get)  
  - Role: Retrieves full article details for each related article ID from “articles” Data Table.

- **Prepare HTML for related articles**  
  - Type: Code (JavaScript)  
  - Role: Constructs an HTML block listing related articles as links, styled for embedding in Shopify article content.

**Sticky Notes:**  
- Describes checking and updating relations only if changed.  
- Notes on configuration requirements for Data Tables.

---

#### 2.6 Update Shopify Articles with Related Links

**Overview:**  
Removes old related articles section from article content, appends new related articles HTML, and updates the Shopify article via API.

**Nodes Involved:**  
- Insert Related in Article  
- Update article with related

**Node Details:**

- **Insert Related in Article**  
  - Type: Code (JavaScript)  
  - Role:  
    - Finds the original article content from Shopify fetched data.  
    - Removes any existing `<div class="related-articles">` section.  
    - Appends newly generated related articles HTML.  
    - Outputs updated article object for API update.  
  - Edge Cases: If original article content missing or malformed, update might fail.

- **Update article with related**  
  - Type: HTTP Request  
  - Role: Sends a PUT request to Shopify API to update the article’s `body_html` with new related articles content.  
  - Uses same Shopify API credentials as before.  
  - Edge Cases: API errors, rate limits, permission issues could prevent update.

---

### 3. Summary Table

| Node Name                     | Node Type           | Functional Role                                        | Input Node(s)                 | Output Node(s)                    | Sticky Note                                                                                     |
|-------------------------------|---------------------|--------------------------------------------------------|------------------------------|----------------------------------|------------------------------------------------------------------------------------------------|
| Schedule Trigger              | Schedule Trigger    | Triggers workflow weekly                              | None                         | Workflow Configuration           | ## Set up * **Workflow Configuration node need to be updated with your info**                |
| Workflow Configuration        | Set                 | Holds configuration parameters                        | Schedule Trigger             | Get articles from shopify         | ## Set up * **Workflow Configuration node need to be updated with your info**                |
| Get articles from shopify     | HTTP Request        | Fetches published articles from Shopify blog         | Workflow Configuration       | Clean & Prepare Text              | ## Set up * **Workflow Configuration node need to be updated with your info**                |
| Clean & Prepare Text          | Code                | Cleans HTML content and prepares text for embeddings | Get articles from shopify    | Loop Over Items                  | ## Analyze each article with "text-embedding-3-small" model and save to Data Table            |
| Loop Over Items               | SplitInBatches      | Processes each article individually                    | Clean & Prepare Text         | Set article fields, Calculate similarities | ## Analyze each article with "text-embedding-3-small" model and save to Data Table            |
| Set article fields            | Set                 | Maps article fields and prepares embedding input      | Loop Over Items              | OpenAI Get Embeddings             | ## Analyze each article with "text-embedding-3-small" model and save to Data Table            |
| OpenAI Get Embeddings         | HTTP Request        | Calls OpenAI to get embeddings for article text       | Set article fields           | Upsert articles                  | ## Analyze each article with "text-embedding-3-small" model and save to Data Table            |
| Upsert articles              | Data Table          | Saves or updates article data with embeddings         | OpenAI Get Embeddings        | Loop Over Items                  | ## Analyze each article with "text-embedding-3-small" model and save to Data Table            |
| Calculate similarities        | Code                | Computes cosine similarity between article embeddings | Loop Over Items              | Upsert article_relations          | ## Core process * Compares articles to find semantic similarity > threshold                   |
| Upsert article_relations      | Data Table          | Stores article similarity relations                    | Calculate similarities       | Top 3 related articles           | ## Core process * Compares articles to find semantic similarity > threshold                   |
| Top 3 related articles        | Code                | Selects top 3 related articles per source article     | Upsert article_relations     | Loop for source articles         | ## Core process * Compares articles to find semantic similarity > threshold                   |
| Loop for source articles      | SplitInBatches      | Iterates over source articles and their top related   | Top 3 related articles       | Get previous related_articles, (else branch) | ## Core process * Compares articles to find semantic similarity > threshold                   |
| Get previous related_articles | Data Table (Get)    | Gets previously saved related articles snapshot       | Loop for source articles     | Check if article already has related | ## Core process * Compares articles to find semantic similarity > threshold                   |
| Check if article already has related | If          | Determines if article has previous related links      | Get previous related_articles | Check if related articles are the same, Upsert relations | ## Core process * Compares articles to find semantic similarity > threshold                   |
| Check if related articles are the same | If         | Compares current related list with previous snapshot  | Check if article already has related | No need to change the related section, Upsert relations | ## Core process * Compares articles to find semantic similarity > threshold                   |
| No need to change the related section | NoOp          | Skips update if related articles unchanged            | Check if related articles are the same | Loop for source articles         | ## Core process * Compares articles to find semantic similarity > threshold                   |
| Upsert relations              | Data Table          | Updates related articles snapshot with current data   | Check if related articles are the same, Check if article already has related | Split Related IDs              | ## Core process * Compares articles to find semantic similarity > threshold                   |
| Split Related IDs             | Code                | Splits related article IDs into individual items      | Upsert relations             | Get related article details       | ## Core process * Compares articles to find semantic similarity > threshold                   |
| Get related article details   | Data Table (Get)    | Retrieves full data for each related article           | Split Related IDs            | Prepare HTML for related articles | ## Core process * Compares articles to find semantic similarity > threshold                   |
| Prepare HTML for related articles | Code            | Builds HTML block with related article links          | Get related article details  | Insert Related in Article         | ## Core process * Compares articles to find semantic similarity > threshold                   |
| Insert Related in Article     | Code                | Updates article content with new related articles HTML | Prepare HTML for related articles | Update article with related      | ## Core process * Compares articles to find semantic similarity > threshold                   |
| Update article with related   | HTTP Request        | PUT request to Shopify API to update article content  | Insert Related in Article    | Loop for source articles          | ## Core process * Compares articles to find semantic similarity > threshold                   |
| Sticky Note                  | Sticky Note         | Explains embedding generation and saving process     | —                            | —                                | See section 2.3 for details                                                                   |
| Sticky Note1                 | Sticky Note         | Explains core similarity calculation and update logic | —                            | —                                | See section 2.4 and 2.5 for details                                                           |
| Sticky Note2                 | Sticky Note         | Notes setup requirement for Workflow Configuration    | —                            | —                                | See section 2.1 for details                                                                    |
| Sticky Note4                 | Sticky Note         | Lists required Data Tables and schema before launching | —                            | —                                | See section 5 for details                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Data Tables** (outside n8n, e.g., n8n Data Tables feature) with the following schemas:

   - **articles:**  
     - `shopify_id` (number), `shopify_handle` (string), `title` (string), `content` (string), `summary` (string),  
     - `url` (string), `published_at` (datetime), `embedding` (string), `last_analyzed_at` (datetime), `word_count` (number), `blog_id` (number)

   - **article_relations:**  
     - `source_shopify_id` (number), `source_blog_id` (number), `source_title` (string),  
     - `related_shopify_id` (number), `related_title` (string), `related_url` (string), `similarity_score` (number)

   - **article_related_links_snapshot:**  
     - `source_shopify_id` (number), `related_shopify_ids` (string)

2. **Add a Schedule Trigger node** configured to trigger weekly at the desired hour (e.g., 20:00).

3. **Add a Set node ("Workflow Configuration")** with variables:

   - `shopifyBlogId`: Your Shopify blog ID (string)  
   - `shopifyBlogDomain`: Your blog base URL, e.g. `https://example.com/blogs/`  
   - `shopifyStoreName`: Your Shopify store name (domain part before `.myshopify.com`)  
   - `shopApiVersion`: Shopify API version, e.g. `2025-07`  
   - `percent_minimum_similarity`: Number threshold for similarity (default 70)

4. **Add HTTP Request node ("Get articles from shopify")** to fetch articles:

   - Method: GET  
   - URL: `https://{{shopifyStoreName}}.myshopify.com/admin/api/{{shopApiVersion}}/blogs/{{shopifyBlogId}}/articles.json`  
   - Query Parameter: `published_status=published`  
   - Authentication: Shopify Access Token (set credentials)  
   - Connect Workflow Configuration output to this node.

5. **Add a Code node ("Clean & Prepare Text")**:

   - JavaScript code to strip HTML tags, remove previous related articles section, and prepare text for embeddings.  
   - Input: JSON array from previous node.  
   - Output: Array of cleaned article objects with fields for embedding input.

6. **Add SplitInBatches node ("Loop Over Items")**:

   - Processes one article at a time. Default batch size 1.

7. **Add Set node ("Set article fields")**:

   - Map article fields: `shopify_id`, `blog_id`, `shopify_handle`, `title`, `content`, `summary`, `url`, `published_at`  
   - Set `embedding` field to the cleaned text prepared for embeddings.  
   - Set `analyzed_at` to current ISO timestamp.  
   - Set `word_count` to count of words in cleaned content.

8. **Add HTTP Request node ("OpenAI Get Embeddings")**:

   - Method: POST  
   - URL: `https://api.openai.com/v1/embeddings`  
   - Body JSON: `{ "model": "text-embedding-3-small", "input": "{{ $json.embedding }}" }`  
   - Headers: `Content-Type: application/json`  
   - Authentication: OpenAI API key credential.

9. **Add Data Table node ("Upsert articles")**:

   - Data Table: `articles`  
   - Operation: Upsert by `shopify_id`  
   - Map all article fields and OpenAI embedding result (stringify embedding JSON).

10. **Connect "Upsert articles" output back to "Loop Over Items" input** to continue processing all articles.

11. **Add a Code node ("Calculate similarities")**:

    - Retrieve all processed articles and embeddings.  
    - Parse embeddings and compute cosine similarity for each pair (excluding self-comparisons).  
    - Keep relations with similarity >= `percent_minimum_similarity`.  
    - Output list of relation objects.

12. **Add Data Table node ("Upsert article_relations")**:

    - Data Table: `article_relations`  
    - Upsert operation matching on `source_shopify_id` and `related_shopify_id`.

13. **Add Code node ("Top 3 related articles")**:

    - Group relations by source article.  
    - For each source, sort related by similarity desc, pick top 3 related IDs.

14. **Add SplitInBatches node ("Loop for source articles")** to process each source article and related IDs.

15. **Add Data Table node ("Get previous related_articles")**:

    - Data Table: `article_related_links_snapshot`  
    - Get existing related IDs for source article.

16. **Add If node ("Check if article already has related")**:

    - Condition: Checks if source article exists in previous snapshot.

17. **Add If node ("Check if related articles are the same")**:

    - Compares current related IDs with previous snapshot string.

18. **Add Data Table node ("Upsert relations")**:

    - Updates `article_related_links_snapshot` Data Table with current related IDs.

19. **Add Code node ("Split Related IDs")**:

    - Splits related IDs string into individual records for fetching details.

20. **Add Data Table node ("Get related article details")**:

    - Fetch full article info for each related article ID from `articles`.

21. **Add Code node ("Prepare HTML for related articles")**:

    - Build HTML block with links to related articles.

22. **Add Code node ("Insert Related in Article")**:

    - Remove old related articles section from original article content.  
    - Append new related articles HTML.

23. **Add HTTP Request node ("Update article with related")**:

    - Method: PUT  
    - URL: `https://{{shopifyStoreName}}.myshopify.com/admin/api/{{shopApiVersion}}/blogs/{{shopifyBlogId}}/articles/{{ $json.article.id }}.json`  
    - Body: Updated article JSON with new `body_html`.  
    - Auth: Shopify Access Token.

24. **Connect the update node output back to "Loop for source articles"** to continue until all source articles are updated.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                                                                           |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| **IMPORTANT:** Before running this workflow, you must create three Data Tables with exact schemas as required: `articles`, `article_relations`, and `article_related_links_snapshot`. This is essential for storing article data and relations.                                                                                                                       | Sticky Note4 in the workflow                                                                              |
| The `Workflow Configuration` node must be updated with your specific Shopify blog ID, store name, domain, API version, and desired similarity threshold before use.                                                                                                                                                                                                     | Sticky Note2 in the workflow                                                                              |
| The core semantic similarity calculation is performed using cosine similarity of OpenAI text embeddings (`text-embedding-3-small` model). You can adjust the similarity threshold in the configuration node.                                                                                                                                                            | Sticky Note1 in the workflow                                                                              |
| For best results, ensure your Shopify API credentials have permissions to read and update blog articles. Also, OpenAI API key should have access to embeddings endpoint.                                                                                                                                                                                                  | Shopify and OpenAI API documentation                                                                      |
| This workflow periodically (weekly) updates related article links, improving SEO and user navigation automatically without manual intervention.                                                                                                                                                                                                                         | Workflow Overview                                                                                          |
| Refer to official Shopify API documentation for any API version-specific changes: https://shopify.dev/api/admin-rest                                                                                                                                                                                                                                                     | https://shopify.dev/api/admin-rest                                                                         |
| For OpenAI embedding API details: https://platform.openai.com/docs/api-reference/embeddings                                                                                                                                                                                                                                                                               | https://platform.openai.com/docs/api-reference/embeddings                                                 |

---

This completes the comprehensive structured analysis and documentation of the Shopify internal linking workflow powered by OpenAI semantic embeddings.