Automate WordPress & WooCommerce Content with OpenAI: Reviews, Comments & Updates

https://n8nworkflows.xyz/workflows/automate-wordpress---woocommerce-content-with-openai--reviews--comments---updates-7764


# Automate WordPress & WooCommerce Content with OpenAI: Reviews, Comments & Updates

### 1. Workflow Overview

This workflow automates content generation and updates for a WordPress site integrated with WooCommerce using OpenAI’s language models. It targets e-commerce and content managers aiming to enhance product reviews, article comments, article content, product descriptions, and product category information automatically.

The workflow is logically divided into five main blocks:

- **1.1 Fetch and Comment on WooCommerce Products:** Retrieves WooCommerce products, generates AI-based product comments/reviews, and posts them.
- **1.2 Fetch and Comment on WordPress Articles:** Retrieves WordPress articles, generates AI-based article comments, and posts them.
- **1.3 Fetch, Summarize, and Update WordPress Articles:** Fetches detailed article content, summarizes and creates headings with AI, then updates articles.
- **1.4 Fetch, Summarize, and Update WooCommerce Product Categories:** Retrieves product categories, generates summaries and headings with AI, then updates categories.
- **1.5 Fetch, Summarize, and Update WooCommerce Products:** Retrieves products for update, generates enhanced descriptions with AI, then updates products.

Each block consists of API requests, prompt building, AI generation, data formatting, and posting or updating content.

---

### 2. Block-by-Block Analysis

#### 2.1 Fetch and Comment on WooCommerce Products

- **Overview:** This block fetches WooCommerce products, generates AI-driven comments or reviews for each product, and posts these reviews back to WooCommerce.
- **Nodes Involved:**  
  - Fetch Products from WooCommerce  
  - Build Product Comment Prompt  
  - Generate Product Comment (AI)  
  - Extract AI Output  
  - Post Review to Product

- **Node Details:**

1. **Fetch Products from WooCommerce**  
   - Type: HTTP Request  
   - Role: Retrieves product list from WooCommerce REST API.  
   - Configuration: Custom URL with WooCommerce credentials (OAuth1 or API key), handles retries (max 5) with 2-second delays.  
   - Input: Manual trigger  
   - Output: JSON array of products  
   - Failure Modes: Network issues, auth errors, API rate limits.

2. **Build Product Comment Prompt**  
   - Type: Set  
   - Role: Prepares prompt text for AI based on product data, likely mapping product fields to the prompt template.  
   - Configuration: Uses expressions to build prompt string dynamically.  
   - Input: Products data  
   - Output: Prompt string for AI  
   - Failure Modes: Expression errors if product data missing fields.

3. **Generate Product Comment (AI)**  
   - Type: OpenAI (Langchain)  
   - Role: Sends prompt to OpenAI, generates product comment/review text.  
   - Configuration: Model selection, temperature, max tokens defined. Retries enabled.  
   - Input: Prompt from previous node  
   - Output: AI-generated text  
   - Failure Modes: API quota, connectivity, invalid prompts.

4. **Extract AI Output**  
   - Type: Set  
   - Role: Extracts the relevant AI response text from raw output, preparing it for posting.  
   - Input: AI response  
   - Output: Clean plain text comment  
   - Failure Modes: Malformed AI output.

5. **Post Review to Product**  
   - Type: HTTP Request  
   - Role: Posts generated review/comment to WooCommerce product reviews API endpoint.  
   - Configuration: Uses WooCommerce credentials, includes product ID, comment content. Retries up to 5 times with 5-second delay.  
   - Input: Extracted AI comment and product data  
   - Output: API response confirmation  
   - Failure Modes: Auth errors, validation errors, API limits.

---

#### 2.2 Fetch and Comment on WordPress Articles

- **Overview:** Fetches WordPress articles, generates AI comments, and posts these comments on the articles.
- **Nodes Involved:**  
  - Fetch Articles from WordPress  
  - Build Article Comment Prompt  
  - Generate Article Comment (AI)  
  - Extract AI Output1  
  - Post Comment to Article

- **Node Details:**

1. **Fetch Articles from WordPress**  
   - Type: HTTP Request  
   - Role: Retrieves articles/posts from WordPress REST API.  
   - Configuration: Uses WordPress credentials; retries enabled.  
   - Input: Manual trigger  
   - Output: JSON array of articles  
   - Failure Modes: Auth errors, network issues.

2. **Build Article Comment Prompt**  
   - Type: Set  
   - Role: Builds prompt text for AI using article data.  
   - Input: Articles data  
   - Output: Prompt string  
   - Failure Modes: Missing fields causing expression failures.

3. **Generate Article Comment (AI)**  
   - Type: OpenAI (Langchain)  
   - Role: Uses AI to generate comments for articles.  
   - Input: Prompt  
   - Output: AI-generated comment text  
   - Failure Modes: API limits, invalid prompt.

4. **Extract AI Output1**  
   - Type: Set  
   - Role: Extracts clean comment text from AI response.  
   - Input: AI output  
   - Output: Plain text comment  
   - Failure Modes: Malformed AI output.

5. **Post Comment to Article**  
   - Type: HTTP Request  
   - Role: Posts generated comment to WordPress article comments endpoint.  
   - Input: Comment text and article info  
   - Output: API response  
   - Failure Modes: Auth failures, validation errors.

---

#### 2.3 Fetch, Summarize, and Update WordPress Articles

- **Overview:** This block fetches full article content, formats it, generates headings and summaries with AI, formats AI output, then updates the article content on WordPress.
- **Nodes Involved:**  
  - Fetch Article Content (API)  
  - Prepare Article Content Fields  
  - Format Article Content for Prompt  
  - Generate Heading & Summary Paragraph (AI)  
  - Format AI Output for Update  
  - Update Article in WordPress

- **Node Details:**

1. **Fetch Article Content (API)**  
   - Type: HTTP Request  
   - Role: Retrieves detailed content of specific articles from WordPress.  
   - Configuration: Includes authentication and necessary query parameters.  
   - Input: Manual trigger  
   - Output: Full article JSON data  
   - Failure Modes: API rate limits, auth errors.

2. **Prepare Article Content Fields**  
   - Type: Set  
   - Role: Extracts and prepares fields from article JSON for AI prompt.  
   - Input: Article content JSON  
   - Output: Structured data for prompt  
   - Failure Modes: Missing expected fields.

3. **Format Article Content for Prompt**  
   - Type: Code  
   - Role: Custom JavaScript formats article content into a single prompt string suitable for AI input.  
   - Input: Prepared fields  
   - Output: Prompt string  
   - Failure Modes: JS errors, malformed input.

4. **Generate Heading & Summary Paragraph (AI)**  
   - Type: OpenAI (Langchain)  
   - Role: Generates a new heading and summary paragraph based on article content.  
   - Input: Formatted prompt  
   - Output: AI response with heading and summary  
   - Failure Modes: API connectivity, invalid prompts.

5. **Format AI Output for Update**  
   - Type: Code  
   - Role: Parses and formats AI output into the structure expected by WordPress update API.  
   - Input: AI output  
   - Output: Formatted update payload  
   - Failure Modes: Parsing errors.

6. **Update Article in WordPress**  
   - Type: HTTP Request  
   - Role: Makes PUT/PATCH request to WordPress API to update the article content.  
   - Input: Formatted update payload  
   - Output: API response  
   - Failure Modes: Auth issues, validation errors.

---

#### 2.4 Fetch, Summarize, and Update WooCommerce Product Categories

- **Overview:** Retrieves WooCommerce product categories, cleans descriptions, generates AI summaries and headings, formats AI output, and updates categories.
- **Nodes Involved:**  
  - Fetch Product Categories from WooCommerce  
  - Prepare Category Fields  
  - Clean Category Description  
  - Generate Category Heading & Summary  
  - Format AI Output for Category Update  
  - Update Product Category in WooCommerce

- **Node Details:**

1. **Fetch Product Categories from WooCommerce**  
   - Type: HTTP Request  
   - Role: Fetches product category list from WooCommerce.  
   - Input: Manual trigger  
   - Output: Categories JSON array  
   - Failure Modes: Auth errors, API limits.

2. **Prepare Category Fields**  
   - Type: Set  
   - Role: Extracts necessary category data for prompt building.  
   - Input: Categories data  
   - Output: Prepared fields  
   - Failure Modes: Missing fields.

3. **Clean Category Description**  
   - Type: Code  
   - Role: Cleans or sanitizes category description text to prepare for AI input.  
   - Input: Category description  
   - Output: Cleaned text  
   - Failure Modes: JS errors.

4. **Generate Category Heading & Summary**  
   - Type: OpenAI (Langchain)  
   - Role: Generates updated heading and summary paragraph for category.  
   - Input: Cleaned description prompt  
   - Output: AI response  
   - Failure Modes: API errors.

5. **Format AI Output for Category Update**  
   - Type: Code  
   - Role: Parses AI output for integration into WooCommerce update API payload.  
   - Input: AI output  
   - Output: Formatted update data  
   - Failure Modes: Parsing issues.

6. **Update Product Category in WooCommerce**  
   - Type: HTTP Request  
   - Role: Sends update request to WooCommerce API for product categories.  
   - Input: Formatted update data  
   - Output: API response  
   - Failure Modes: Auth or validation errors.

---

#### 2.5 Fetch, Summarize, and Update WooCommerce Products

- **Overview:** Retrieves WooCommerce products for update, cleans descriptions, generates improved descriptions via AI, formats AI output, and updates products.
- **Nodes Involved:**  
  - Fetch Products from WooCommerce (for Update)  
  - Prepare Product Fields  
  - Clean Product Description & Short Description  
  - Generate Product Descriptions  
  - Format AI Output for Product Update  
  - Update Product in WooCommerce

- **Node Details:**

1. **Fetch Products from WooCommerce (for Update)**  
   - Type: HTTP Request  
   - Role: Retrieves products for the purpose of updating their descriptions.  
   - Input: Manual trigger  
   - Output: Products JSON array  
   - Failure Modes: API or auth issues.

2. **Prepare Product Fields**  
   - Type: Set  
   - Role: Extracts and prepares product fields relevant for AI prompt.  
   - Input: Products data  
   - Output: Prepared fields  
   - Failure Modes: Missing data fields.

3. **Clean Product Description & Short Description**  
   - Type: Code  
   - Role: Sanitizes existing product descriptions to prepare for AI.  
   - Input: Description fields  
   - Output: Clean text  
   - Failure Modes: Script errors.

4. **Generate Product Descriptions**  
   - Type: OpenAI (Langchain)  
   - Role: Generates improved product descriptions with AI.  
   - Input: Cleaned descriptions in prompt form  
   - Output: AI-generated descriptions  
   - Failure Modes: API errors.

5. **Format AI Output for Product Update**  
   - Type: Code  
   - Role: Parses AI response into WooCommerce update payload format.  
   - Input: AI output  
   - Output: Formatted update data  
   - Failure Modes: Parsing errors.

6. **Update Product in WooCommerce**  
   - Type: HTTP Request  
   - Role: Sends update request to WooCommerce API for products.  
   - Input: Formatted update data  
   - Output: API response  
   - Failure Modes: Auth or validation errors.

---

### 3. Summary Table

| Node Name                        | Node Type                        | Functional Role                          | Input Node(s)                       | Output Node(s)                          | Sticky Note |
|---------------------------------|---------------------------------|----------------------------------------|-----------------------------------|----------------------------------------|-------------|
| Execute workflow                | Manual Trigger                  | Entry point to start workflow           | -                                 | Fetch Products from WooCommerce, Fetch Articles from WordPress, Fetch Article Content (API), Fetch Product Categories from WooCommerce, Fetch Products from WooCommerce (for Update) |             |
| Fetch Products from WooCommerce  | HTTP Request                   | Fetch WooCommerce products              | Execute workflow                  | Build Product Comment Prompt            |             |
| Build Product Comment Prompt     | Set                            | Build AI prompt for product comments    | Fetch Products from WooCommerce   | Generate Product Comment (AI)           |             |
| Generate Product Comment (AI)    | OpenAI (Langchain)             | Generate product comment via AI         | Build Product Comment Prompt      | Extract AI Output                       |             |
| Extract AI Output                | Set                            | Extract comment text from AI response   | Generate Product Comment (AI)     | Post Review to Product                  |             |
| Post Review to Product           | HTTP Request                   | Post AI-generated review to WooCommerce| Extract AI Output                 | -                                      |             |
| Fetch Articles from WordPress    | HTTP Request                   | Fetch WordPress articles                 | Execute workflow                  | Build Article Comment Prompt            |             |
| Build Article Comment Prompt     | Set                            | Build AI prompt for article comments    | Fetch Articles from WordPress     | Generate Article Comment (AI)           |             |
| Generate Article Comment (AI)    | OpenAI (Langchain)             | Generate article comment via AI          | Build Article Comment Prompt      | Extract AI Output1                      |             |
| Extract AI Output1               | Set                            | Extract comment text from AI response   | Generate Article Comment (AI)     | Post Comment to Article                 |             |
| Post Comment to Article          | HTTP Request                   | Post AI-generated comment to WordPress  | Extract AI Output1                | -                                      |             |
| Fetch Article Content (API)      | HTTP Request                   | Fetch detailed article content           | Execute workflow                  | Prepare Article Content Fields          |             |
| Prepare Article Content Fields   | Set                            | Prepare article fields for AI prompt     | Fetch Article Content (API)       | Format Article Content for Prompt       |             |
| Format Article Content for Prompt| Code                           | Format article content into AI prompt    | Prepare Article Content Fields    | Generate Heading & Summary Paragraph (AI)|             |
| Generate Heading & Summary Paragraph (AI) | OpenAI (Langchain)       | Generate heading and summary for article| Format Article Content for Prompt | Format AI Output for Update             |             |
| Format AI Output for Update      | Code                           | Format AI output for WordPress update    | Generate Heading & Summary Paragraph (AI) | Update Article in WordPress         |             |
| Update Article in WordPress      | HTTP Request                   | Update article content on WordPress      | Format AI Output for Update       | -                                      |             |
| Fetch Product Categories from WooCommerce | HTTP Request             | Fetch WooCommerce product categories     | Execute workflow                  | Prepare Category Fields                 |             |
| Prepare Category Fields          | Set                            | Prepare category fields for AI prompt    | Fetch Product Categories from WooCommerce | Clean Category Description          |             |
| Clean Category Description       | Code                           | Clean category description text           | Prepare Category Fields           | Generate Category Heading & Summary     |             |
| Generate Category Heading & Summary | OpenAI (Langchain)           | Generate heading and summary for category| Clean Category Description        | Format AI Output for Category Update    |             |
| Format AI Output for Category Update | Code                        | Format AI output for WooCommerce update  | Generate Category Heading & Summary | Update Product Category in WooCommerce |             |
| Update Product Category in WooCommerce | HTTP Request               | Update product category info in WooCommerce | Format AI Output for Category Update | -                                   |             |
| Fetch Products from WooCommerce (for Update) | HTTP Request             | Fetch WooCommerce products for updating  | Execute workflow                  | Prepare Product Fields                  |             |
| Prepare Product Fields           | Set                            | Prepare product fields for AI prompt      | Fetch Products from WooCommerce (for Update) | Clean Product Description & Short Description |             |
| Clean Product Description & Short Description | Code                    | Clean product descriptions before AI use | Prepare Product Fields            | Generate Product Descriptions           |             |
| Generate Product Descriptions    | OpenAI (Langchain)             | Generate product descriptions via AI     | Clean Product Description & Short Description | Format AI Output for Product Update  |             |
| Format AI Output for Product Update | Code                        | Format AI output for WooCommerce product update | Generate Product Descriptions    | Update Product in WooCommerce           |             |
| Update Product in WooCommerce    | HTTP Request                   | Update product descriptions on WooCommerce| Format AI Output for Product Update | -                                   |             |
| Sticky Note, Sticky Note1, Sticky Note2, Sticky Note3, Sticky Note4, Sticky Note5, Sticky Note6 | Sticky Note                 | Visual notes in workflow editor           | -                                 | -                                      |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**  
   - Type: Manual Trigger  
   - Purpose: Entry point to start execution.

2. **Create HTTP Request Node "Fetch Products from WooCommerce":**  
   - Method: GET  
   - URL: WooCommerce API endpoint for products (e.g., `/wp-json/wc/v3/products`)  
   - Authentication: WooCommerce credentials (OAuth1 or API key)  
   - Retry: Enable with 5 max tries, 2000ms wait between tries  
   - Connect output from Manual Trigger.

3. **Create Set Node "Build Product Comment Prompt":**  
   - Use expressions to construct prompt text from product fields (e.g., name, description).  
   - Connect input from "Fetch Products from WooCommerce".

4. **Create OpenAI Node "Generate Product Comment (AI)":**  
   - Credentials: OpenAI API key  
   - Model: Select appropriate model (e.g., GPT-4 or GPT-3.5)  
   - Input: Pass prompt from previous node  
   - Retry: Enable with 2-second wait  
   - Connect input from "Build Product Comment Prompt".

5. **Create Set Node "Extract AI Output":**  
   - Extract the text content from AI response JSON (e.g., `{{$json.choices[0].message.content}}`).  
   - Connect input from "Generate Product Comment (AI)".

6. **Create HTTP Request Node "Post Review to Product":**  
   - Method: POST  
   - URL: WooCommerce API endpoint for product reviews/comments (e.g., `/wp-json/wc/v3/products/<product_id>/reviews`)  
   - Authentication: WooCommerce credentials  
   - Body: Include product ID and AI-generated comment text  
   - Retry: 5 tries, 5000ms wait  
   - Connect input from "Extract AI Output".

7. **Create HTTP Request Node "Fetch Articles from WordPress":**  
   - Method: GET  
   - URL: WordPress REST API endpoint for posts (e.g., `/wp-json/wp/v2/posts`)  
   - Authentication: WordPress OAuth2 or Basic Auth  
   - Retry enabled  
   - Connect input from Manual Trigger.

8. **Create Set Node "Build Article Comment Prompt":**  
   - Build prompt for AI from article title and excerpt fields.  
   - Connect input from "Fetch Articles from WordPress".

9. **Create OpenAI Node "Generate Article Comment (AI)":**  
   - Same config as product comment generation.  
   - Connect input from "Build Article Comment Prompt".

10. **Create Set Node "Extract AI Output1":**  
    - Extract AI comment text as before.  
    - Connect input from "Generate Article Comment (AI)".

11. **Create HTTP Request Node "Post Comment to Article":**  
    - POST to WordPress comments endpoint (e.g., `/wp-json/wp/v2/comments`)  
    - Include post ID and comment content  
    - Retry enabled  
    - Connect input from "Extract AI Output1".

12. **Create HTTP Request Node "Fetch Article Content (API)":**  
    - GET detailed content for articles (e.g., `/wp-json/wp/v2/posts/<id>`)  
    - Connect input from Manual Trigger.

13. **Create Set Node "Prepare Article Content Fields":**  
    - Extract content fields (title, content, excerpt) for AI prompt  
    - Connect input from "Fetch Article Content (API)".

14. **Create Code Node "Format Article Content for Prompt":**  
    - JavaScript code to prepare a detailed prompt string for AI  
    - Connect input from "Prepare Article Content Fields".

15. **Create OpenAI Node "Generate Heading & Summary Paragraph (AI)":**  
    - Configure model, temperature, max tokens  
    - Connect input from "Format Article Content for Prompt".

16. **Create Code Node "Format AI Output for Update":**  
    - Parse AI response to extract heading and summary  
    - Format as payload for WordPress update API  
    - Connect input from "Generate Heading & Summary Paragraph (AI)".

17. **Create HTTP Request Node "Update Article in WordPress":**  
    - PUT or PATCH to `/wp-json/wp/v2/posts/<id>`  
    - Include updated title and summary in body  
    - Authentication via WordPress credentials  
    - Connect input from "Format AI Output for Update".

18. **Create HTTP Request Node "Fetch Product Categories from WooCommerce":**  
    - GET `/wp-json/wc/v3/products/categories`  
    - WooCommerce authentication, retry enabled  
    - Connect input from Manual Trigger.

19. **Create Set Node "Prepare Category Fields":**  
    - Extract relevant fields for AI prompt from categories  
    - Connect input from "Fetch Product Categories from WooCommerce".

20. **Create Code Node "Clean Category Description":**  
    - Sanitize category description for AI prompt  
    - Connect input from "Prepare Category Fields".

21. **Create OpenAI Node "Generate Category Heading & Summary":**  
    - Generate category headings and summaries  
    - Connect input from "Clean Category Description".

22. **Create Code Node "Format AI Output for Category Update":**  
    - Format AI output into WooCommerce category update payload  
    - Connect input from "Generate Category Heading & Summary".

23. **Create HTTP Request Node "Update Product Category in WooCommerce":**  
    - PUT/PATCH to WooCommerce category update endpoint  
    - Use WooCommerce credentials  
    - Connect input from "Format AI Output for Category Update".

24. **Create HTTP Request Node "Fetch Products from WooCommerce (for Update)":**  
    - GET `/wp-json/wc/v3/products` for update purposes  
    - Connect input from Manual Trigger.

25. **Create Set Node "Prepare Product Fields":**  
    - Extract product fields for update prompt  
    - Connect input from "Fetch Products from WooCommerce (for Update)".

26. **Create Code Node "Clean Product Description & Short Description":**  
    - Sanitize descriptions for AI prompt  
    - Connect input from "Prepare Product Fields".

27. **Create OpenAI Node "Generate Product Descriptions":**  
    - Generate enhanced descriptions  
    - Connect input from "Clean Product Description & Short Description".

28. **Create Code Node "Format AI Output for Product Update":**  
    - Format output for WooCommerce product update payload  
    - Connect input from "Generate Product Descriptions".

29. **Create HTTP Request Node "Update Product in WooCommerce":**  
    - PUT/PATCH to WooCommerce product update endpoint  
    - Connect input from "Format AI Output for Product Update".

**Credentials Required:**  
- WooCommerce API keys or OAuth1 credentials  
- WordPress OAuth2 or Basic Auth credentials  
- OpenAI API key

**Default Values and Constraints:**  
- Retry settings as specified to handle intermittent failures  
- Model parameters tuned for content generation (temperature, max tokens)  
- API rate limits must be respected, consider adding delays if necessary.

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                           |
|------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| The workflow is currently configured with a manual trigger; a schedule trigger is present but disabled, allowing manual or scheduled execution. | Scheduling can be enabled for full automation.           |
| Sticky Notes nodes are used as visual markers and contain no content but can be used to add documentation visually inside n8n. | Useful for workflow documentation and clarity.           |
| OpenAI nodes use Langchain integration; ensure you have the correct n8n Langchain OpenAI node installed and configured. | https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-langchain.openai/ |
| WooCommerce API endpoints require appropriate permissions; ensure API keys have read/write access for products, categories, and comments. | WooCommerce REST API documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/ |
| WordPress REST API requires authentication with sufficient privileges to post comments and update posts. | WordPress REST API docs: https://developer.wordpress.org/rest-api/ |
| For error handling, the retry mechanism is set on HTTP and AI nodes to mitigate transient failures. Consider adding additional error handling or notifications for production use. |                                                          |

---

This reference document enables thorough understanding, reproduction, and modification of the workflow by both advanced users and automation agents.