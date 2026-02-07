Automate Blog Content Generation & Publishing with OpenAI and WordPress

https://n8nworkflows.xyz/workflows/automate-blog-content-generation---publishing-with-openai-and-wordpress-6658


# Automate Blog Content Generation & Publishing with OpenAI and WordPress

### 1. Workflow Overview

This workflow automates the creation and publishing of blog posts using OpenAI's language models and WordPress. Its primary use case is to generate engaging blog content from a defined topic and publish it directly on a WordPress site, streamlining content marketing or blogging efforts.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Define or receive the blog post topic.
- **1.2 AI Content Generation:** Use OpenAI to generate a blog post title and body based on the topic.
- **1.3 Content Preparation:** Format and map AI outputs for WordPress publishing.
- **1.4 Publishing:** Post the generated blog content on WordPress.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This initial block provides the blog topic input into the workflow. It supports testing with manual input and can be adapted for production triggers or external input sources.

**Nodes Involved:**  
- Manual Trigger  
- Set Blog Topic

**Node Details:**  

- **Manual Trigger**  
  - *Type & Role:* Trigger node; initiates the workflow manually.  
  - *Configuration:* No parameters; designed for manual execution via the 'Execute Workflow' button.  
  - *Expressions:* None.  
  - *Connections:* Output → Set Blog Topic.  
  - *Version Requirements:* Standard n8n.  
  - *Edge Cases:* None significant; manual trigger is fail-safe but not suitable for automated production without replacement.  
  - *Notes:* For production, replace with Cron (scheduled) or Webhook (external input) nodes.

- **Set Blog Topic**  
  - *Type & Role:* Data node; defines the blog topic as a JSON field `blogTopic`.  
  - *Configuration:* Fixed string value `"The Future of Remote Work: Trends and Challenges"` set in the 'Value' field. Can be replaced with dynamic expressions linking to external inputs.  
  - *Expressions:* Supports expressions such as `{{ $json.yourInputFieldName }}` for dynamic inputs.  
  - *Connections:* Input ← Manual Trigger; Output → Generate Title.  
  - *Edge Cases:* If dynamic input is malformed or missing, may cause downstream errors.

---

#### 1.2 AI Content Generation

**Overview:**  
This block generates AI-powered blog post titles and full body content using OpenAI’s GPT models, creating the core content for publishing.

**Nodes Involved:**  
- Generate Title  
- Generate Body

**Node Details:**  

- **Generate Title**  
  - *Type & Role:* OpenAI node; generates a blog post title based on the topic.  
  - *Configuration:*  
    - Model: `gpt-3.5-turbo` (default); user may switch to `gpt-4o` for higher quality.  
    - Messages: System prompt defines role; user prompt includes `blogTopic` from previous node.  
  - *Expressions:* Uses `{{ $json.blogTopic }}` from Set Blog Topic node.  
  - *Connections:* Input ← Set Blog Topic; Output → Generate Body.  
  - *Credentials:* Requires OpenAI API key credential with a valid API key starting with `sk-`.  
  - *Edge Cases:*  
    - API key invalid or expired causes auth errors.  
    - Rate limits or network timeouts.  
    - AI response format changes or empty content.  

- **Generate Body**  
  - *Type & Role:* OpenAI node; generates the detailed blog post body using the topic and generated title.  
  - *Configuration:*  
    - Model: Same as Generate Title, typically `gpt-3.5-turbo`.  
    - Messages: System prompt instructs detailed, structured blog content in Markdown; user prompt includes `blogTopic` and generated `title`.  
  - *Expressions:* Accesses `{{ $json.blogTopic }}` and title from `Generate Title` node output.  
  - *Connections:* Input ← Generate Title; Output → Prepare Content.  
  - *Credentials:* Uses the same OpenAI API credential as Generate Title.  
  - *Edge Cases:*  
    - Same as Generate Title, plus potential for incomplete or overly long responses.

---

#### 1.3 Content Preparation

**Overview:**  
This block reformats and consolidates the AI-generated content into clean, named fields suitable for WordPress publishing.

**Nodes Involved:**  
- Prepare Content

**Node Details:**  

- **Prepare Content**  
  - *Type & Role:* Set node; maps generated title and body into `blogPostTitle` and `blogPostBody` fields for clarity.  
  - *Configuration:*  
    - Fields set by expressions referencing previous AI nodes:  
      - `blogPostTitle` = `{{ $node["Generate Title"].json.choices[0].message.content }}`  
      - `blogPostBody` = `{{ $node["Generate Body"].json.choices[0].message.content }}`  
  - *Connections:* Input ← Generate Body; Output → Publish to WordPress.  
  - *Edge Cases:* If AI output is missing or malformed, mapped fields may be empty or invalid.

---

#### 1.4 Publishing

**Overview:**  
This final block publishes the prepared content as a new post on a WordPress site.

**Nodes Involved:**  
- Publish to WordPress

**Node Details:**  

- **Publish to WordPress**  
  - *Type & Role:* WordPress node; creates a new blog post using provided title and content.  
  - *Configuration:*  
    - Resource: `post`, Operation: `create`.  
    - Title: Expression pulling `blogPostTitle` from Prepare Content node.  
    - Content: Expression pulling `blogPostBody` from Prepare Content node.  
    - Status: Set to `publish` for immediate live posting; can be changed to `draft`.  
  - *Credentials:* WordPress API credential with:  
    - Authentication method: User & Password.  
    - WordPress URL, admin username, and password.  
  - *Connections:* Input ← Prepare Content.  
  - *Edge Cases:*  
    - Authentication failures due to wrong credentials.  
    - WordPress site unreachable or API disabled.  
    - Content rejection by WordPress (e.g., disallowed HTML).  
    - Rate limits or network errors.

---

### 3. Summary Table

| Node Name           | Node Type           | Functional Role                 | Input Node(s)    | Output Node(s)       | Sticky Note                                                                                                          |
|---------------------|---------------------|--------------------------------|------------------|----------------------|----------------------------------------------------------------------------------------------------------------------|
| Manual Trigger      | Manual Trigger      | Starts the workflow manually   | None             | Set Blog Topic        | For easy testing. Replace with Cron or Webhook for production triggers.                                               |
| Set Blog Topic      | Set                 | Defines blog topic input       | Manual Trigger   | Generate Title        | Edit 'Value' for testing or replace with expression for dynamic input.                                               |
| Generate Title      | OpenAI               | Generates blog post title      | Set Blog Topic   | Generate Body         | Requires OpenAI API key. Model default `gpt-3.5-turbo`. Output: generated title.                                      |
| Generate Body       | OpenAI               | Generates blog post body       | Generate Title   | Prepare Content       | Uses same OpenAI credential. Produces detailed Markdown blog content.                                                |
| Prepare Content     | Set                  | Maps AI outputs for publishing | Generate Body    | Publish to WordPress  | Maps title and body into `blogPostTitle` and `blogPostBody` fields.                                                  |
| Publish to WordPress | WordPress            | Publishes post on WordPress    | Prepare Content  | None                 | Requires WordPress User & Password credential. Publishes post with status `publish` by default.                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add a **Manual Trigger** node named "Manual Trigger".  
   - This node requires no configuration but enables manual execution.

2. **Define Blog Topic Node:**  
   - Add a **Set** node named "Set Blog Topic".  
   - Add a field named `blogTopic` with the value:  
     `"The Future of Remote Work: Trends and Challenges"` (or use an expression for dynamic input).  
   - Connect output of "Manual Trigger" → "Set Blog Topic".

3. **Generate Title Node:**  
   - Add an **OpenAI** node named "Generate Title".  
   - Configure:  
     - Model: `gpt-3.5-turbo` (or update as preferred).  
     - Messages:  
       - System: "You are a professional blogger. Your task is to generate concise and engaging blog post titles."  
       - User: `Generate a blog post title for the topic: {{ $json.blogTopic }}`  
   - Set credentials: Create or select an OpenAI API credential with your API key.  
   - Connect "Set Blog Topic" → "Generate Title".

4. **Generate Body Node:**  
   - Add another **OpenAI** node named "Generate Body".  
   - Configure:  
     - Model: same as "Generate Title".  
     - Messages:  
       - System: "You are a professional blogger. Write a detailed, well-structured blog post with an introduction, several body paragraphs, and a clear conclusion. Use Markdown for headings, bold text, and lists. Ensure the content is engaging and informative for a general audience."  
       - User:  
         ```
         Write a blog post about: {{ $json.blogTopic }}

         Use the title: {{ $node["Generate Title"].json.choices[0].message.content }}
         ```  
   - Use the same OpenAI credential.  
   - Connect "Generate Title" → "Generate Body".

5. **Prepare Content Node:**  
   - Add a **Set** node named "Prepare Content".  
   - Add two fields:  
     - `blogPostTitle` → Expression: `{{ $node["Generate Title"].json.choices[0].message.content }}`  
     - `blogPostBody` → Expression: `{{ $node["Generate Body"].json.choices[0].message.content }}`  
   - Connect "Generate Body" → "Prepare Content".

6. **Publish to WordPress Node:**  
   - Add a **WordPress** node named "Publish to WordPress".  
   - Configure:  
     - Resource: `post`  
     - Operation: `create`  
     - Title: Expression: `{{ $json.blogPostTitle }}`  
     - Content: Expression: `{{ $json.blogPostBody }}`  
     - Status: `publish` (or `draft` as preferred)  
   - Credentials: Create or select WordPress credential with:  
     - Authentication: User & Password  
     - WordPress URL (your site’s full URL)  
     - Username and password of a WordPress user with post publishing rights  
   - Connect "Prepare Content" → "Publish to WordPress".

7. **Save and Test:**  
   - Save the workflow.  
   - Execute manually to test.  
   - Check your WordPress site to confirm the new post appears.

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                                                                                  |
|------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| For manual testing, use the Manual Trigger; for production, replace with Cron (scheduled) or Webhook nodes.      | Workflow Block 1.1 Input Reception                                                             |
| OpenAI credential API key should be kept secure and must have sufficient quota for content generation.           | OpenAI nodes (Generate Title, Generate Body)                                                   |
| WordPress credential requires admin or editor user with API access enabled.                                      | Publish to WordPress node                                                                      |
| The workflow outputs content in Markdown format; ensure WordPress supports Markdown or converts it appropriately. | Generate Body node and WordPress publishing                                                    |
| For improved AI results, consider upgrading to GPT-4 models but monitor costs.                                   | OpenAI nodes configuration                                                                     |
| Reference for WordPress REST API: https://developer.wordpress.org/rest-api/reference/posts/#create-a-post        | WordPress node documentation                                                                   |

---

Disclaimer: The text provided is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.