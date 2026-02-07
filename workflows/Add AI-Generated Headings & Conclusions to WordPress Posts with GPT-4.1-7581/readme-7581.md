Add AI-Generated Headings & Conclusions to WordPress Posts with GPT-4.1

https://n8nworkflows.xyz/workflows/add-ai-generated-headings---conclusions-to-wordpress-posts-with-gpt-4-1-7581


# Add AI-Generated Headings & Conclusions to WordPress Posts with GPT-4.1

### 1. Workflow Overview

This workflow automates the enhancement of existing WordPress articles by adding AI-generated headings and concluding paragraphs using GPT-4.1. It is designed for content managers, SEO specialists, and website owners seeking to enrich their posts with AI-driven summaries that improve user engagement, organic traffic, and branding.

The workflow consists of the following logical blocks:

- **1.1 Input Trigger**: Manual execution to start the workflow.
- **1.2 Article Retrieval**: Fetches existing WordPress posts in batches via REST API with authentication.
- **1.3 Article Content Preparation**: Extracts and cleans HTML content from posts for AI processing.
- **1.4 AI Content Generation**: Sends cleaned article content to GPT-4.1 model to generate a new heading and a concise summary paragraph.
- **1.5 Content Formatting**: Combines original content with AI-generated output into a single HTML update payload.
- **1.6 Article Update**: Updates the WordPress posts with the new content through authenticated API PATCH requests.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Trigger

- **Overview:**  
  This block initiates the workflow manually. It does not rely on external events or schedule.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’

- **Node Details:**  
  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Starts workflow execution upon user command.  
    - Configuration: Default manual trigger without parameters.  
    - Input: None (external manual start)  
    - Output: Triggers next node ("Fetch Article Content (API)").  
    - Failures: None expected under normal operation.

#### 2.2 Article Retrieval

- **Overview:**  
  Fetches up to 100 WordPress posts via REST API with HTTP Basic Authentication. Supports batch processing to handle multiple posts in a single execution.

- **Nodes Involved:**  
  - Fetch Article Content (API)

- **Node Details:**  
  - **Fetch Article Content (API)**  
    - Type: HTTP Request  
    - Role: Retrieves WordPress posts using REST API endpoint `/wp-json/wp/v2/posts`.  
    - Configuration:  
      - URL: `https://example.com/wp-json/wp/v2/posts?per_page=100` (replace with actual domain)  
      - Authentication: HTTP Basic Auth with stored credentials (`YOUR_API_KEY`)  
      - Batching enabled to handle multiple posts.  
    - Input: Trigger from manual node.  
    - Output: JSON array of posts with full content, including IDs, titles, and HTML-formatted content.  
    - Failures:  
      - Auth errors if credentials are invalid.  
      - Network errors or API downtime.  
      - Pagination limit exceeded (only first 100 posts fetched).  
    - Version: HTTP Request node version 4.2 required for batching.

#### 2.3 Article Content Preparation

- **Overview:**  
  Extracts relevant fields from the fetched posts and prepares a plain text version of the HTML content for AI consumption.

- **Nodes Involved:**  
  - Prepare Article Content Fields  
  - Format Article Content for Prompt

- **Node Details:**  
  - **Prepare Article Content Fields**  
    - Type: Set  
    - Role: Selects and renames fields (`id`, `title`, `content`, and duplicates `content` as `plainContent`) from the raw API response for clarity and further processing.  
    - Configuration: Uses expressions to map JSON fields, e.g., `{{$json["id"]}}`, `{{$json["title"]["rendered"]}}`.  
    - Input: From API node.  
    - Output: Cleaned JSON with selected fields.  
    - Failures: Expression errors if input JSON structure differs.  

  - **Format Article Content for Prompt**  
    - Type: Code (JavaScript)  
    - Role: Converts HTML content to plain text by stripping tags and normalizing whitespace, preparing it for the AI prompt.  
    - Configuration: Custom JS code removing HTML tags and trimming text.  
    - Key Variables: `item.json.content` (raw HTML), output `content` (plain text).  
    - Input: From Set node.  
    - Output: JSON with `id`, `title`, and cleaned `content`.  
    - Failures: JS runtime errors if `content` is missing or malformed.

#### 2.4 AI Content Generation

- **Overview:**  
  Sends the cleaned article content to GPT-4.1 to generate a suitable heading and a three-line concluding paragraph, following detailed content guidelines.

- **Nodes Involved:**  
  - Generate Heading & Summary Paragraph (AI)

- **Node Details:**  
  - **Generate Heading & Summary Paragraph (AI)**  
    - Type: OpenAI (Langchain node)  
    - Role: Interacts with GPT-4.1-mini model to produce AI-generated text based on the article content.  
    - Configuration:  
      - Model: `gpt-4.1-mini`  
      - Prompt: Dynamically includes article text with detailed instructions emphasizing accuracy, user engagement, branding, and copywriting techniques.  
      - Credentials: OpenAI API key (`YOUR_API_KEY`).  
    - Key Expressions: Embeds `{{ $json.content }}` in prompt for article content.  
    - Input: Cleaned article text.  
    - Output: AI-generated message content with heading and summary paragraph.  
    - Failures:  
      - API quota exceeded or invalid API key.  
      - Timeout or rate limiting by OpenAI.  
      - Unexpected AI responses or empty outputs.  
    - Version: Requires Langchain OpenAI node v1.8 or compatible.

#### 2.5 Content Formatting

- **Overview:**  
  Combines the original article content with the AI-generated summary into a single HTML block suitable for updating the post.

- **Nodes Involved:**  
  - Format AI Output for Update

- **Node Details:**  
  - **Format AI Output for Update**  
    - Type: Code (JavaScript)  
    - Role: Concatenates the original HTML content with a horizontal rule `<hr />` and the AI-generated summary (including heading).  
    - Configuration: Extracts `id`, uses original `content` and appends AI-generated `message.content`.  
    - Input: AI output node.  
    - Output: JSON with updated `content` ready for API update and post `id`.  
    - Failures:  
      - Missing AI output or malformed message content.  
      - Null or undefined values causing concatenation errors.

#### 2.6 Article Update

- **Overview:**  
  Updates the WordPress posts with the new content by sending a PATCH request to the WordPress REST API, authenticated with HTTP Basic Auth.

- **Nodes Involved:**  
  - Update Article in WordPress

- **Node Details:**  
  - **Update Article in WordPress**  
    - Type: HTTP Request  
    - Role: Sends PATCH request to `/wp-json/wp/v2/posts` endpoint to update the post content.  
    - Configuration:  
      - URL: `https://example.com/wp-json/wp/v2/posts` (replace with actual domain)  
      - Method: PATCH  
      - Authentication: HTTP Basic Auth (`YOUR_API_KEY`)  
      - Body Parameters:  
        - `content`: updated HTML content including AI enhancements  
        - `post_id`: post identifier (expression referencing original post id)  
      - Batching enabled for multiple posts updates.  
    - Input: From formatting node.  
    - Output: API response confirming update success.  
    - Failures:  
      - Auth errors or permission issues.  
      - Validation errors if content is malformed.  
      - Network or API downtime.  
    - Version: HTTP Request node v4.2 for batching.

---

### 3. Summary Table

| Node Name                        | Node Type               | Functional Role                          | Input Node(s)                   | Output Node(s)                        | Sticky Note                                                                                                               |
|---------------------------------|-------------------------|----------------------------------------|--------------------------------|-------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger          | Start workflow manually                 | -                              | Fetch Article Content (API)          |                                                                                                                           |
| Fetch Article Content (API)      | HTTP Request            | Retrieve WordPress posts via API       | When clicking ‘Execute workflow’| Prepare Article Content Fields       |                                                                                                                           |
| Prepare Article Content Fields   | Set                     | Extract and rename relevant fields     | Fetch Article Content (API)     | Format Article Content for Prompt    |                                                                                                                           |
| Format Article Content for Prompt| Code (JavaScript)       | Clean HTML content to plain text       | Prepare Article Content Fields  | Generate Heading & Summary Paragraph (AI) |                                                                                                                           |
| Generate Heading & Summary Paragraph (AI) | OpenAI (Langchain)       | Generate AI heading and summary        | Format Article Content for Prompt| Format AI Output for Update          |                                                                                                                           |
| Format AI Output for Update      | Code (JavaScript)       | Combine original content with AI output| Generate Heading & Summary Paragraph (AI) | Update Article in WordPress          |                                                                                                                           |
| Update Article in WordPress      | HTTP Request            | Update WordPress posts with new content| Format AI Output for Update     | -                                   |                                                                                                                           |
| Sticky Note2                    | Sticky Note             | Explanation of workflow purpose        | -                              | -                                   | ## Article Content Enhancer with AI Summary  This workflow enhances existing articles by adding an AI-generated heading and a short summary paragraph at the end. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Node Type: Manual Trigger  
   - Name: `When clicking ‘Execute workflow’`  
   - Leave default parameters.

2. **Create HTTP Request Node to Fetch Articles**  
   - Node Type: HTTP Request  
   - Name: `Fetch Article Content (API)`  
   - HTTP Method: GET  
   - URL: `https://example.com/wp-json/wp/v2/posts?per_page=100` (replace domain)  
   - Authentication: HTTP Basic Auth  
     - Set credentials with API key (e.g., username and password or API token as password)  
   - Enable Batching if available (to handle multiple posts)  
   - Connect output of Manual Trigger to this node’s input.

3. **Create Set Node to Prepare Fields**  
   - Node Type: Set  
   - Name: `Prepare Article Content Fields`  
   - Assign fields:  
     - `id` = `{{$json["id"]}}`  
     - `title` = `{{$json["title"]["rendered"]}}`  
     - `content` = `{{$json["content"]["rendered"]}}`  
     - `plainContent` = duplicate of `content` for safety  
   - Connect output of Fetch Article Content to this node.

4. **Create Code Node to Format Content for AI Prompt**  
   - Node Type: Code  
   - Name: `Format Article Content for Prompt`  
   - Language: JavaScript  
   - Code:  
     ```javascript
     return items.map(item => {
       const rawHtml = item.json.content;
       const plainText = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
       return {
         json: {
           id: item.json.id,
           title: item.json.title,
           content: plainText
         }
       };
     });
     ```  
   - Connect output of Set node to this node.

5. **Create OpenAI Node to Generate Heading and Summary**  
   - Node Type: OpenAI (Langchain)  
   - Name: `Generate Heading & Summary Paragraph (AI)`  
   - Model: `gpt-4.1-mini` (or appropriate GPT-4.1 model)  
   - Credentials: OpenAI API key  
   - Prompt Message (System or User message):  
     ```
     Acting as a specialized content writer for a [Your Topic] website,

     This is the text of a website article. Please write a suitable heading and a 3-line concluding paragraph (useful, experience-based, user-friendly content with high engagement) to add at the end of the article.
     Article text:
     {{ $json.content }}

     Please strictly follow these guidelines:
     - The information must be accurate, reliable, specialized, up-to-date, and original.
     - Pay special attention to user satisfaction and addressing their needs and questions.
     - The content should be useful and practical; it must offer significant value compared to other web content and be trustworthy and citable. It should also go beyond obvious facts.
     - Try to use copywriting and advertising techniques in the content; the brand name is [Your Brand].
     - The content should be structured with a clear outline, headings, paragraphs, etc., and must be clear and simple, not complicated.
     - Include detailed and precise information as much as possible.
     - The content must be comprehensive, covering various aspects of the user's questions and the topic, including points competitors have missed.
     - Preferably, include the content’s keyword (such as the article title) in the produced text.
     - The content aims to:
        1. Attract organic traffic
        2. Build branding
        3. Be visible in chatbots
        4. Increase conversion rate through copywriting
     - The tone should match the rest of the website’s content.
     ```
   - Connect output of Code node to this node.

6. **Create Code Node to Format AI Output for WordPress Update**  
   - Node Type: Code  
   - Name: `Format AI Output for Update`  
   - Language: JavaScript  
   - Code:  
     ```javascript
     return items.map(item => {
       const id = item.json.id;
       const htmlContent = item.json.content;
       const summary = item.json.message?.content || "";
       const newContent = htmlContent + "<hr />" + summary;
       return {
         json: {
           id,
           content: newContent
         }
       };
     });
     ```  
   - Connect output of AI node to this node.

7. **Create HTTP Request Node to Update WordPress Posts**  
   - Node Type: HTTP Request  
   - Name: `Update Article in WordPress`  
   - HTTP Method: PATCH  
   - URL: `https://example.com/wp-json/wp/v2/posts` (replace domain)  
   - Authentication: HTTP Basic Auth (same credentials as fetch node)  
   - Body Parameters (JSON):  
     - `content`: `={{ $json.content }}`  
     - `post_id`: `={{ $json.id }}` (or if needed, expression to get ID from previous node)  
   - Enable Batching if available  
   - Connect output of previous Code node to this node.

8. **Add Sticky Note (Optional)**  
   - Content:  
     ```
     ## Article Content Enhancer with AI Summary

     This workflow enhances existing articles by adding an AI-generated heading and a short summary paragraph at the end. It retrieves the article content, processes it for the AI prompt, and updates the post with the new section.
     ```
   - Position it prominently to describe the workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                       |
|----------------------------------------------------------------------------------------------|-------------------------------------|
| This workflow depends on valid API credentials for both WordPress REST API and OpenAI API.  | Credential setup in n8n credentials |
| Replace `https://example.com` with your actual WordPress site domain in HTTP Request nodes. | WordPress REST API documentation    |
| Use HTTP Basic Authentication for WordPress API with a user having edit permissions on posts.| WordPress user role management       |
| GPT-4.1-mini is a smaller variant of GPT-4 intended for cost-effective content generation.  | OpenAI API model naming conventions |
| The AI prompt emphasizes copywriting and branding with placeholders [Your Topic] and [Your Brand]. Replace accordingly.| Customizing AI prompts               |
| To handle more than 100 posts, consider adding pagination or looping logic in the workflow.  | WordPress API pagination             |

---

This detailed reference document enables users and automation agents to fully understand, reproduce, and maintain the "Add AI-Generated Headings & Conclusions to WordPress Posts with GPT-4.1" workflow without requiring the original JSON export.