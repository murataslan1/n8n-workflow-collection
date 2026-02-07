AI Blog Post Generator with Scheduled or Prompt-based Content for WordPress

https://n8nworkflows.xyz/workflows/ai-blog-post-generator-with-scheduled-or-prompt-based-content-for-wordpress-10180


# AI Blog Post Generator with Scheduled or Prompt-based Content for WordPress

### 1. Workflow Overview

This workflow automates the generation and publication of SEO-optimized blog posts to a WordPress site using AI, specifically OpenAI models, and is triggered either on a schedule or by a chat prompt. It targets content creators or website owners who want to automate blog post creation based on existing site topics or custom prompts, while maintaining SEO relevance and internal link structure.

The workflow is logically divided into two main functional blocks:

- **1.1 Scheduled Auto Post Generation:**  
  Automatically triggers on a schedule to fetch the current blog sitemap, extract existing post slugs, generate a new blog topic using AI (avoiding duplicates), create a full blog post with deep content and SEO structure, review and edit the post via AI, and finally publish it to WordPress.

- **1.2 Chat-Based Auto Post Generation:**  
  Triggered manually via a chat interface/webhook, accepts user input or prompt, fetches the sitemap and existing slugs, then generates, reviews, and publishes a blog post based on the prompt.

Supporting logic includes sitemap fetching and parsing, slug extraction, content generation and review with strict formatting and SEO guidelines, and WordPress publishing.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Auto Post Generation

- **Overview:**  
  This block runs automatically on a schedule, fetching the blog sitemap to identify current topics, generating a new relevant blog post theme using AI, creating a detailed blog post, reviewing it, and publishing it to WordPress.

- **Nodes Involved:**  
  - Schedule Trigger  
  - [SCHEDULE] Get Sitemap  
  - [SCHEDULE] Sitemap to Json  
  - [SCHEDULE] Order Slugs  
  - [SCHEDULE] New Blog Post Theme  
  - Choose Right One  
  - Create Post  
  - Review Post  
  - Send to Wordpress

- **Node Details:**

  1. **Schedule Trigger**  
     - *Type:* Schedule Trigger  
     - *Role:* Initiates workflow execution on a configured interval (default: every minute)  
     - *Config:* Default interval with no custom rule set (must adjust for actual schedule)  
     - *Connections:* Output to [SCHEDULE] Get Sitemap  
     - *Edge Cases:* If schedule misconfigured or disabled, workflow won’t run automatically.

  2. **[SCHEDULE] Get Sitemap**  
     - *Type:* HTTP Request  
     - *Role:* Retrieves the sitemap XML from the blog’s URL (https://bruzzi.online/sitemap.xml by default)  
     - *Config:* GET request to sitemap URL, no authentication  
     - *Connections:* Output to [SCHEDULE] Sitemap to Json  
     - *Edge Cases:* HTTP failures, sitemap URL incorrect or inaccessible.

  3. **[SCHEDULE] Sitemap to Json**  
     - *Type:* XML Node  
     - *Role:* Converts sitemap XML to JSON for easier processing  
     - *Config:* Default XML parsing  
     - *Connections:* Output to [SCHEDULE] Order Slugs  
     - *Edge Cases:* Malformed XML, empty sitemap.

  4. **[SCHEDULE] Order Slugs**  
     - *Type:* Code (JavaScript)  
     - *Role:* Extracts slugs (last part of URL paths) from sitemap JSON  
     - *Config:* Parses URLs, splits by '/' and extracts last segment as slug array  
     - *Connections:* Output to [SCHEDULE] New Blog Post Theme  
     - *Expressions:* Uses items[0].json.urlset.url to access URLs array  
     - *Edge Cases:* Empty or malformed URL list, unexpected JSON structure.

  5. **[SCHEDULE] New Blog Post Theme**  
     - *Type:* OpenAI (Langchain OpenAI node)  
     - *Role:* Uses GPT-5-Nano model to generate a new, relevant blog topic not currently in slugs  
     - *Config:* Prompt instructs AI to avoid duplicating existing slugs, return one sentence topic only  
     - *Expressions:* Injects slugs array into prompt to guide topic generation  
     - *Credentials:* OpenAI API key required  
     - *Connections:* Output to Choose Right One  
     - *Edge Cases:* API errors, prompt formulation errors, rate limits.

  6. **Choose Right One**  
     - *Type:* Code (JavaScript)  
     - *Role:* Determines which input text to use (handles different input shapes between schedule and chat routes)  
     - *Config:* Checks for presence of `chatInput` or `message.content` fields; defaults if none found  
     - *Connections:* Output to Create Post  
     - *Edge Cases:* Missing input fields, unexpected JSON format.

  7. **Create Post**  
     - *Type:* OpenAI (Langchain OpenAI node)  
     - *Role:* Generates a complete, SEO-optimized blog post with title, content, and slug based on the chosen topic  
     - *Config:* GPT-4o-mini-search-preview model; complex prompt specifying structure (HTML tags, SEO, internal/external links, length 3,000-7,000 words)  
     - *Expressions:* Injects topic and slugs from previous nodes  
     - *Credentials:* OpenAI API key required  
     - *Connections:* Output to Review Post  
     - *Edge Cases:* API errors, content generation failures, prompt misinterpretation.

  8. **Review Post**  
     - *Type:* OpenAI (Langchain OpenAI node)  
     - *Role:* Acts as editor to refine blog post, ensure grammar, SEO, link placement, and professional tone  
     - *Config:* GPT-5-mini model; prompt directs content polishing with minimum internal/external links, strict formatting  
     - *Expressions:* Injects generated post content and slugs  
     - *Credentials:* OpenAI API key required  
     - *Connections:* Output to Send to Wordpress  
     - *Edge Cases:* API errors, prompt failure, output formatting issues.

  9. **Send to Wordpress**  
     - *Type:* WordPress node  
     - *Role:* Publishes the final blog post on WordPress site with title, slug, content, and status=publish  
     - *Config:* Uses WordPress API credentials with user API key; dynamic mapping of title, slug, and content from Review Post output  
     - *Connections:* Terminal node, no output  
     - *Credentials:* WordPress API key required  
     - *Edge Cases:* Authentication failures, API errors, invalid post data.

---

#### 2.2 Chat-Based Auto Post Generation

- **Overview:**  
  This block triggers via a chat webhook, accepts user input to define blog post content, fetches the sitemap to get existing post slugs, then generates, reviews, and publishes a blog post accordingly.

- **Nodes Involved:**  
  - Chat Message  
  - [CHAT] Get Sitemap  
  - [CHAT] Sitemap to Json  
  - [CHAT] Order Slugs  
  - Choose Right One  
  - Create Post  
  - Review Post  
  - Send to Wordpress

- **Node Details:**

  1. **Chat Message**  
     - *Type:* Langchain Chat Trigger (Webhook)  
     - *Role:* Receives manual chat input as trigger with optional message content  
     - *Config:* Webhook ID configured, file uploads disabled  
     - *Connections:* Output to [CHAT] Get Sitemap  
     - *Edge Cases:* Webhook not reachable, malformed input, empty chat message.

  2. **[CHAT] Get Sitemap**  
     - *Type:* HTTP Request  
     - *Role:* Fetches sitemap XML same as scheduled block (default https://bruzzi.online/sitemap.xml)  
     - *Config:* GET request  
     - *Connections:* Output to [CHAT] Sitemap to Json  
     - *Edge Cases:* Same as scheduled sitemap request.

  3. **[CHAT] Sitemap to Json**  
     - *Type:* XML Node  
     - *Role:* Parses sitemap XML to JSON  
     - *Config:* Default  
     - *Connections:* Output to [CHAT] Order Slugs  
     - *Edge Cases:* Malformed XML.

  4. **[CHAT] Order Slugs**  
     - *Type:* Code (JavaScript)  
     - *Role:* Extracts slugs array from sitemap JSON data  
     - *Config:* Same slug extraction as scheduled block  
     - *Connections:* Output to Choose Right One  
     - *Edge Cases:* Same as scheduled slug extraction.

  5. **Choose Right One**  
     - *Same as in scheduled block* (decides between chatInput and message.content)

  6. **Create Post**  
     - *Same as in scheduled block* (creates blog post based on chosen input)

  7. **Review Post**  
     - *Same as in scheduled block* (edits and polishes the post)

  8. **Send to Wordpress**  
     - *Same as in scheduled block* (publishes post)

---

### 3. Summary Table

| Node Name               | Node Type                     | Functional Role                                  | Input Node(s)          | Output Node(s)           | Sticky Note                                                                                                 |
|-------------------------|-------------------------------|-------------------------------------------------|------------------------|--------------------------|-------------------------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger              | Triggers workflow on schedule                    | —                      | [SCHEDULE] Get Sitemap   |                                                                                                             |
| [SCHEDULE] Get Sitemap  | HTTP Request                 | Fetches sitemap XML                              | Schedule Trigger       | [SCHEDULE] Sitemap to Json | "Always change the sitemap URL to your own, so it'll work properly." (Sticky Note4)                        |
| [SCHEDULE] Sitemap to Json | XML Node                    | Parses sitemap XML to JSON                        | [SCHEDULE] Get Sitemap | [SCHEDULE] Order Slugs   |                                                                                                             |
| [SCHEDULE] Order Slugs  | Code                        | Extracts slugs from sitemap JSON                  | [SCHEDULE] Sitemap to Json | [SCHEDULE] New Blog Post Theme |                                                                                                             |
| [SCHEDULE] New Blog Post Theme | OpenAI (Langchain)       | Generates new blog post topic avoiding duplicates | [SCHEDULE] Order Slugs | Choose Right One         | "⬅️ Scheduled Auto Post Generator - Remember to change [area] and [your persona] on OpenAI node" (Sticky Note1) |
| Chat Message            | Langchain Chat Trigger       | Receives manual chat input                        | —                      | [CHAT] Get Sitemap       | "⬅️ Chat-Based Auto Post Generator" (Sticky Note2)                                                          |
| [CHAT] Get Sitemap      | HTTP Request                 | Fetches sitemap XML                              | Chat Message           | [CHAT] Sitemap to Json   | "Always change the sitemap URL to your own, so it'll work properly." (Sticky Note4)                        |
| [CHAT] Sitemap to Json  | XML Node                    | Parses sitemap XML to JSON                        | [CHAT] Get Sitemap     | [CHAT] Order Slugs       |                                                                                                             |
| [CHAT] Order Slugs      | Code                        | Extracts slugs from sitemap JSON                  | [CHAT] Sitemap to Json | Choose Right One         |                                                                                                             |
| Choose Right One        | Code                        | Selects input text from chat or schedule paths   | [SCHEDULE] New Blog Post Theme, [CHAT] Order Slugs | Create Post             |                                                                                                             |
| Create Post             | OpenAI (Langchain)           | Generates full blog post (title, content, slug) | Choose Right One       | Review Post              | "Important! Change every OpenAI interaction, replacing [area], [your persona], and blog URL." (Sticky Note3) |
| Review Post             | OpenAI (Langchain)           | Edits and polishes generated blog post           | Create Post            | Send to Wordpress        |                                                                                                             |
| Send to Wordpress       | WordPress Node               | Publishes final post to WordPress                 | Review Post            | —                        |                                                                                                             |
| Sticky Note             | Sticky Note                 | Workflow usage and setup instructions             | —                      | —                        | "On this template, you can easily get all your posts from WordPress and create new ones based on them..." (Sticky Note) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Schedule Trigger" node:**  
   - Type: Schedule Trigger  
   - Configure interval as desired (e.g., daily, weekly)  
   - Connect output to "[SCHEDULE] Get Sitemap"

2. **Create "[SCHEDULE] Get Sitemap" node:**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: Your blog sitemap URL (e.g., https://yourblog.com/sitemap.xml)  
   - Connect output to "[SCHEDULE] Sitemap to Json"

3. **Create "[SCHEDULE] Sitemap to Json" node:**  
   - Type: XML  
   - Default parsing options  
   - Connect output to "[SCHEDULE] Order Slugs"

4. **Create "[SCHEDULE] Order Slugs" node:**  
   - Type: Code  
   - JavaScript code to extract slugs from JSON:  
     ```javascript
     const urls = items[0].json.urlset.url;
     const slugs = urls.map(url => {
       const urlString = url.loc;
       const slug = urlString.split('/').filter(Boolean).pop();
       return slug;
     });
     return [{ json: { slugs } }];
     ```  
   - Connect output to "[SCHEDULE] New Blog Post Theme"

5. **Create "[SCHEDULE] New Blog Post Theme" node:**  
   - Type: OpenAI (Langchain OpenAI node)  
   - Model: GPT-5-Nano  
   - Prompt: Request a relevant new blog topic, avoiding duplicates in `{{ $json.slugs }}`  
   - Credentials: Configure OpenAI API key  
   - Connect output to "Choose Right One"

6. **Create "Chat Message" node:**  
   - Type: Langchain Chat Trigger  
   - Configure webhook ID and disable file uploads  
   - Connect output to "[CHAT] Get Sitemap"

7. **Create "[CHAT] Get Sitemap" node:**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: Your sitemap URL (same as scheduled)  
   - Connect output to "[CHAT] Sitemap to Json"

8. **Create "[CHAT] Sitemap to Json" node:**  
   - Type: XML  
   - Default options  
   - Connect output to "[CHAT] Order Slugs"

9. **Create "[CHAT] Order Slugs" node:**  
   - Type: Code  
   - Same JavaScript code as "[SCHEDULE] Order Slugs"  
   - Connect output to "Choose Right One"

10. **Create "Choose Right One" node:**  
    - Type: Code  
    - JavaScript code:  
      ```javascript
      if ($json.chatInput) {
        return [{ json: { result: $json.chatInput } }];
      } else if ($json.message && $json.message.content) {
        return [{ json: { result: $json.message.content } }];
      } else {
        return [{ json: { result: 'Nenhuma entrada encontrada' } }];
      }
      ```  
    - Connect output to "Create Post"

11. **Create "Create Post" node:**  
    - Type: OpenAI (Langchain OpenAI node)  
    - Model: GPT-4o-mini-search-preview  
    - Prompt: Detailed instructions to generate SEO-friendly blog post (title, content, slug) as HTML, referencing slugs and blog URL  
    - Credentials: OpenAI API key  
    - Connect output to "Review Post"

12. **Create "Review Post" node:**  
    - Type: OpenAI (Langchain OpenAI node)  
    - Model: GPT-5-mini  
    - Prompt: Editorial review to correct grammar, SEO, internal/external links, and polish post  
    - Credentials: OpenAI API key  
    - Connect output to "Send to Wordpress"

13. **Create "Send to Wordpress" node:**  
    - Type: WordPress node  
    - Parameters:  
      - Title: `={{ $json.message.content.title }}`  
      - Slug: `={{ $json.message.content.slug }}`  
      - Content: `={{ $json.message.content.content }}`  
      - Status: publish  
    - Credentials: WordPress API user key  
    - No output connections

14. **Connect nodes accordingly:**  
    - Schedule Trigger → [SCHEDULE] Get Sitemap → [SCHEDULE] Sitemap to Json → [SCHEDULE] Order Slugs → [SCHEDULE] New Blog Post Theme → Choose Right One → Create Post → Review Post → Send to Wordpress  
    - Chat Message → [CHAT] Get Sitemap → [CHAT] Sitemap to Json → [CHAT] Order Slugs → Choose Right One → Create Post → Review Post → Send to Wordpress

15. **Credential Setup:**  
    - OpenAI API key with permissions for GPT-4o-mini and GPT-5 models  
    - WordPress API credentials (API user key with post publishing rights)

16. **Parameter Adjustments:**  
    - Replace placeholder `[area]` and `[your persona]` in OpenAI prompts with your actual blog niche and target audience  
    - Replace sitemap URL with your site’s actual sitemap URL  
    - Replace blog base URL in prompts with your real blog URL for internal link generation

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                  | Context or Link                                  |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| This workflow is designed for users who want to save time writing blog posts while preserving SEO power. It syncs OpenAI and WordPress to schedule or manually generate posts.                                                               | Sticky Note near start                            |
| Always change the sitemap URL to your own in the "Get Sitemap" HTTP Request nodes to ensure proper operation.                                                                                                                                | Sticky Note4                                     |
| Remember to edit every OpenAI prompt, replacing `[area]` and `[your persona]` with your actual blog theme and audience to receive relevant content and internal links.                                                                       | Sticky Note1, Sticky Note3                        |
| You can schedule the workflow or trigger it manually via chat input.                                                                                                                                                                         | Sticky Note                                      |
| Internal blog post URLs should be consistent and SEO-friendly slugs without accents or special characters to avoid browser issues.                                                                                                          | Prompt instructions in Create Post node          |
| OpenAI models used here include GPT-5-Nano for topic generation, GPT-4o-mini for post creation, and GPT-5-mini for content review/editing. Ensure your API access supports these models or adjust accordingly.                                | Node configurations                              |
| WordPress publishing requires API credentials with rights to create and publish posts. Ensure API endpoint and user permissions are correctly configured.                                                                                   | Send to Wordpress node                           |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.