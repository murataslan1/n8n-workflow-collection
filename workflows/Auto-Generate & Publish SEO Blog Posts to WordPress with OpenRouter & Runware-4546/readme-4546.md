Auto-Generate & Publish SEO Blog Posts to WordPress with OpenRouter & Runware

https://n8nworkflows.xyz/workflows/auto-generate---publish-seo-blog-posts-to-wordpress-with-openrouter---runware-4546


# Auto-Generate & Publish SEO Blog Posts to WordPress with OpenRouter & Runware

### 1. Workflow Overview

This n8n workflow, titled **"Auto-Generate & Publish SEO Blog Posts to WordPress with OpenRouter & Runware"**, automates the end-to-end creation and publication of SEO-optimized blog posts on a WordPress site. It is designed for content marketers, SEO specialists, and website managers who want to streamline blog content generation, metadata enrichment, image creation, and publishing, combined with optional notification steps.

The workflow consists of the following logical blocks:

- **1.1 Trigger & Initialization**: Automatically triggers every 3 hours to start the blog generation cycle.
- **1.2 Blog Metadata Generation**: Uses AI (via OpenRouter and LangChain nodes) to generate structured blog metadata necessary for SEO and content creation.
- **1.3 SEO Article Content Composition**: Leverages AI language models to compose the full SEO article content using the generated metadata.
- **1.4 WordPress Draft Post Creation**: Creates a draft post in WordPress using the composed content.
- **1.5 Yoast SEO Metadata Setting**: Sets Yoast SEO metadata for the created draft via HTTP requests.
- **1.6 Featured Image Generation & Attachment**: Generates a featured image using Runware, fetches it, uploads it to WordPress media, and attaches it to the post.
- **1.7 Notifications (Optional)**: Sends notifications about the new post to Discord and Telegram (currently disabled).

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger & Initialization

- **Overview:** Automatically triggers the workflow every 3 hours to initiate blog post generation.
- **Nodes Involved:**  
  - `⏱️ Auto Trigger (Every 3 Hours)`

- **Node Details:**

  - **Node:** `⏱️ Auto Trigger (Every 3 Hours)`  
    - **Type:** Schedule Trigger  
    - **Role:** Starts the workflow on a timer (every 3 hours)  
    - **Configuration:** Interval set to every 3 hours  
    - **Inputs:** None (trigger node)  
    - **Outputs:** Starts the chain toward generating blog metadata  
    - **Edge Cases:** Workflow may not start if n8n instance is down or scheduler misconfigured  
    - **Version Requirements:** n8n v0.151.0+ recommended for scheduleTrigger node stability

---

#### 2.2 Blog Metadata Generation

- **Overview:** Generates structured blog metadata using AI language models, including title, keywords, description, and tags. This metadata is parsed into a structured format for downstream use.
- **Nodes Involved:**  
  - `🔖 Metadata Generator (Nemotron)`  
  - `🔎 Parse Blog Metadata Output`  
  - `🔖 Generate Blog Metadata`

- **Node Details:**

  - **Node:** `🔖 Metadata Generator (Nemotron)`  
    - **Type:** LangChain Chat LLM (OpenRouter model)  
    - **Role:** Calls AI to generate initial blog metadata prompts  
    - **Configuration:** Uses OpenRouter credentials and model, configured with prompts tuned for metadata generation  
    - **Inputs:** Trigger from schedule or previous node  
    - **Outputs:** AI-generated raw metadata text

  - **Node:** `🔎 Parse Blog Metadata Output`  
    - **Type:** LangChain Output Parser (Structured)  
    - **Role:** Parses AI raw text output into structured JSON with fields like title, description, keywords  
    - **Inputs:** Output from metadata generator  
    - **Outputs:** Structured metadata JSON

  - **Node:** `🔖 Generate Blog Metadata`  
    - **Type:** LangChain Chain LLM  
    - **Role:** Receives parsed metadata and may do additional processing/formatting  
    - **Inputs:** Parsed metadata  
    - **Outputs:** Metadata passed forward for content composition

- **Edge Cases:**  
  - AI generating malformed or incomplete metadata  
  - Parsing failures due to unexpected AI output format  
  - API request timeouts or auth errors with OpenRouter

---

#### 2.3 SEO Article Content Composition

- **Overview:** Uses AI models to generate the full SEO article content based on the structured blog metadata.
- **Nodes Involved:**  
  - `🧠 Article Writer (LLaMA)` (active)  
  - `🧠 Article Writer (Gemini)` (disabled)  
  - `🧠 Article Writer (GPT-4 mini)` (disabled)  
  - `✍️ Compose SEO Article Content`

- **Node Details:**

  - **Node:** `🧠 Article Writer (LLaMA)`  
    - **Type:** LangChain Chat LLM (OpenRouter LLaMA model)  
    - **Role:** Generates article content text from metadata  
    - **Configuration:** Configured with OpenRouter LLaMA credentials and prompts designed for SEO-optimized content generation  
    - **Inputs:** Metadata from `🔖 Generate Blog Metadata`  
    - **Outputs:** AI-generated article content text  
    - **Edge Cases:** AI hallucination, incomplete responses, or rate limits from OpenRouter

  - **Node:** `✍️ Compose SEO Article Content`  
    - **Type:** LangChain Chain LLM  
    - **Role:** Compiles and formats the article content for WordPress post creation  
    - **Inputs:** Content from `🧠 Article Writer (LLaMA)`  
    - **Outputs:** Final article content passed to WordPress node

- **Note:** Alternative AI writer nodes (`Gemini`, `GPT-4 mini`) are present but disabled, allowing easy switching of AI backends.

---

#### 2.4 WordPress Draft Post Creation

- **Overview:** Creates a new draft blog post in WordPress using the generated article content.
- **Nodes Involved:**  
  - `📝 Create WordPress Draft Post`

- **Node Details:**

  - **Node:** `📝 Create WordPress Draft Post`  
    - **Type:** WordPress node (API integration)  
    - **Role:** Creates a draft post with content and metadata  
    - **Configuration:** Connected to WordPress via API credentials, configured to create posts with fields like title, content, status=draft  
    - **Inputs:** Article content from `✍️ Compose SEO Article Content`  
    - **Outputs:** Post ID and details for further processing  
    - **Edge Cases:** Authentication errors, site connectivity issues, API limits, malformed content rejection

---

#### 2.5 Yoast SEO Metadata Setting

- **Overview:** Sets Yoast SEO metadata on the newly created draft post via an HTTP request to WordPress REST API.
- **Nodes Involved:**  
  - `🔍 Set Yoast SEO Metadata`

- **Node Details:**

  - **Node:** `🔍 Set Yoast SEO Metadata`  
    - **Type:** HTTP Request  
    - **Role:** Sends POST or PATCH request to WordPress REST API endpoint for Yoast SEO metadata  
    - **Configuration:** Contains HTTP headers with authentication, endpoint URL constructed dynamically using post ID, payload includes Yoast SEO fields (focus keyword, meta description, etc.)  
    - **Inputs:** Post ID from WordPress draft creation  
    - **Outputs:** Response confirmation for metadata update  
    - **Edge Cases:** API endpoint unavailability, permission denied, malformed JSON payload

---

#### 2.6 Featured Image Generation & Attachment

- **Overview:** Generates a featured image using Runware API, fetches the generated image, uploads it to WordPress media library, and attaches it to the post as the featured image.
- **Nodes Involved:**  
  - `🖼️ Generate Featured Image (Runware)`  
  - `📥 Fetch Generated Image`  
  - `📤 Upload Image to WordPress Media`  
  - `📎 Attach Image to Post`

- **Node Details:**

  - **Node:** `🖼️ Generate Featured Image (Runware)`  
    - **Type:** HTTP Request  
    - **Role:** Sends request to Runware image generation API with prompts derived from article metadata or content  
    - **Configuration:** API endpoint, authentication headers, prompt and parameters in request body  
    - **Inputs:** Post metadata  
    - **Outputs:** Job or image generation ID for fetching image  
    - **Edge Cases:** API rate limits, generation failures, network errors

  - **Node:** `📥 Fetch Generated Image`  
    - **Type:** HTTP Request  
    - **Role:** Polls or fetches the generated image file from Runware once ready  
    - **Configuration:** Uses job ID, may handle retries or wait logic  
    - **Inputs:** Response from image generation node  
    - **Outputs:** Image binary or URL  
    - **Edge Cases:** Image not ready, timeouts, API errors

  - **Node:** `📤 Upload Image to WordPress Media`  
    - **Type:** HTTP Request  
    - **Role:** Uploads the fetched image file to WordPress media library via REST API  
    - **Configuration:** Multipart/form-data upload with authentication  
    - **Inputs:** Image data from fetch node  
    - **Outputs:** Media item ID and URL  
    - **Edge Cases:** Upload size limits, auth errors, malformed data

  - **Node:** `📎 Attach Image to Post`  
    - **Type:** HTTP Request  
    - **Role:** Updates the WordPress post to set the uploaded image as the featured image  
    - **Configuration:** PATCH request to post endpoint with featured_media field set to media ID  
    - **Inputs:** Post ID and media ID  
    - **Outputs:** Confirmation response  
    - **Edge Cases:** Post or media ID mismatch, permission issues

---

#### 2.7 Notifications (Optional)

- **Overview:** Sends notifications about the new post to Discord and Telegram channels.
- **Nodes Involved:**  
  - `📣 Send Notification to Discord` (disabled)  
  - `📨 Send Notification to Telegram` (disabled)

- **Node Details:**

  - **Node:** `📣 Send Notification to Discord`  
    - **Type:** Discord node  
    - **Role:** Posts a notification message in a configured Discord channel  
    - **Configuration:** Discord webhook or bot credentials, message content dynamically generated  
    - **Inputs:** Output from image attachment node  
    - **Outputs:** Confirmation of message sent  
    - **Edge Cases:** Disabled; if enabled, possible webhook failures or permission errors

  - **Node:** `📨 Send Notification to Telegram`  
    - **Type:** Telegram node  
    - **Role:** Sends a message to a Telegram chat or channel  
    - **Configuration:** Telegram bot token, chat ID, message content  
    - **Inputs:** Output from image attachment node  
    - **Outputs:** Confirmation of message sent  
    - **Edge Cases:** Disabled; if enabled, possible bot permission or network issues

---

### 3. Summary Table

| Node Name                           | Node Type                          | Functional Role                         | Input Node(s)                       | Output Node(s)                       | Sticky Note                              |
|-----------------------------------|----------------------------------|---------------------------------------|-----------------------------------|------------------------------------|-----------------------------------------|
| ⚙️ Setup Guide                    | Sticky Note                      | Documentation / Setup instructions    |                                   |                                    |                                         |
| 🧠 Overview - What This Workflow Does | Sticky Note                      | Documentation / Overview               |                                   |                                    |                                         |
| ⏱️ Auto Trigger (Every 3 Hours)   | Schedule Trigger                 | Starts workflow every 3 hours          |                                   | 🔖 Metadata Generator (Nemotron)   |                                         |
| 🔖 Metadata Generator (Nemotron)  | LangChain LLM (OpenRouter)       | Generates blog metadata                 | ⏱️ Auto Trigger                   | 🔎 Parse Blog Metadata Output       |                                         |
| 🔎 Parse Blog Metadata Output      | LangChain Output Parser Structured | Parses AI metadata output               | 🔖 Metadata Generator             | 🔖 Generate Blog Metadata           |                                         |
| 🔖 Generate Blog Metadata          | LangChain Chain LLM              | Processes structured metadata           | 🔎 Parse Blog Metadata Output     | 🧠 Article Writer (LLaMA), 🔖 Generate Blog Metadata |                                         |
| 🧠 Article Writer (LLaMA)          | LangChain Chat LLM (OpenRouter)  | Generates SEO article content           | 🔖 Generate Blog Metadata         | ✍️ Compose SEO Article Content      |                                         |
| 🧠 Article Writer (Gemini)         | LangChain Chat LLM (Google Gemini) (disabled) | Alternative AI writer (disabled)       |                                   |                                    |                                         |
| 🧠 Article Writer (GPT-4 mini)     | LangChain Chat LLM (OpenAI) (disabled) | Alternative AI writer (disabled)       |                                   |                                    |                                         |
| ✍️ Compose SEO Article Content     | LangChain Chain LLM              | Formats article content for WordPress  | 🧠 Article Writer (LLaMA)         | 📝 Create WordPress Draft Post      |                                         |
| 📝 Create WordPress Draft Post     | WordPress node                  | Creates draft post                      | ✍️ Compose SEO Article Content    | 🔍 Set Yoast SEO Metadata           |                                         |
| 🔍 Set Yoast SEO Metadata          | HTTP Request                    | Updates Yoast SEO metadata on post     | 📝 Create WordPress Draft Post    | 🖼️ Generate Featured Image (Runware) |                                         |
| 🖼️ Generate Featured Image (Runware) | HTTP Request                    | Requests featured image generation      | 🔍 Set Yoast SEO Metadata         | 📥 Fetch Generated Image            |                                         |
| 📥 Fetch Generated Image           | HTTP Request                    | Fetches generated image                 | 🖼️ Generate Featured Image        | 📤 Upload Image to WordPress Media  |                                         |
| 📤 Upload Image to WordPress Media | HTTP Request                    | Uploads image to WordPress media library | 📥 Fetch Generated Image          | 📎 Attach Image to Post             |                                         |
| 📎 Attach Image to Post            | HTTP Request                    | Attaches featured image to post         | 📤 Upload Image to WordPress Media | 📣 Send Notification to Discord, 📨 Send Notification to Telegram |                                         |
| 📣 Send Notification to Discord    | Discord node (disabled)          | Sends Discord notification (disabled)  | 📎 Attach Image to Post            |                                    | Disabled by default                      |
| 📨 Send Notification to Telegram   | Telegram node (disabled)          | Sends Telegram notification (disabled) | 📎 Attach Image to Post            |                                    | Disabled by default                      |
| ⚙️ Setup Guide1                   | Sticky Note                     | Documentation / Setup instructions     |                                   |                                    |                                         |
| ⚙️ Setup Guide2                   | Sticky Note                     | Documentation / Setup instructions     |                                   |                                    |                                         |
| ⚙️ Setup Guide3                   | Sticky Note                     | Documentation / Setup instructions     |                                   |                                    |                                         |
| ⚙️ Setup Guide4                   | Sticky Note                     | Documentation / Setup instructions     |                                   |                                    |                                         |
| ⚙️ Setup Guide5                   | Sticky Note                     | Documentation / Setup instructions     |                                   |                                    |                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add a **Schedule Trigger** node named `⏱️ Auto Trigger (Every 3 Hours)`  
   - Set it to run every 3 hours.

2. **Add Blog Metadata Generator:**  
   - Add a **LangChain LLM** node named `🔖 Metadata Generator (Nemotron)`  
   - Configure with OpenRouter credentials (model: Nemotron or equivalent)  
   - Set prompt to generate SEO blog metadata (title, description, keywords, tags).  
   - Connect output of trigger node to this node’s input.

3. **Add Metadata Output Parser:**  
   - Add a **LangChain Output Parser Structured** node named `🔎 Parse Blog Metadata Output`  
   - Configure to parse the raw text into structured JSON fields.  
   - Connect output of metadata generator node to this parser node.

4. **Add Metadata Processing Chain:**  
   - Add a **LangChain Chain LLM** node named `🔖 Generate Blog Metadata`  
   - Connect the output of the parser node as its input.  
   - This node prepares metadata for article writing.

5. **Add AI Article Writer:**  
   - Add a **LangChain Chat LLM** node named `🧠 Article Writer (LLaMA)`  
   - Configure with OpenRouter LLaMA model credentials.  
   - Set prompt to generate SEO-optimized article content based on metadata.  
   - Connect output of metadata generator chain to this node.

6. **Add Article Composer:**  
   - Add a **LangChain Chain LLM** node named `✍️ Compose SEO Article Content`  
   - Use it to format and finalize article content for WordPress.  
   - Connect output of Article Writer node here.

7. **Add WordPress Draft Post Node:**  
   - Add a **WordPress** node named `📝 Create WordPress Draft Post`  
   - Configure credentials for WordPress REST API with write access.  
   - Set to create a new post with status "draft", title, and content sourced from composer node.  
   - Connect output of Article Composer to this node.

8. **Add Yoast SEO Metadata Setter:**  
   - Add an **HTTP Request** node named `🔍 Set Yoast SEO Metadata`  
   - Configure to send POST/PATCH to WordPress Yoast SEO REST API endpoint: `/wp-json/yoast/v1/posts/{post_id}`  
   - Use authentication headers (usually Basic Auth or OAuth2 as per WordPress setup).  
   - Payload includes SEO metadata fields (focus keyword, meta description).  
   - Connect output of WordPress draft post node to this node.

9. **Add Featured Image Generation Node:**  
   - Add an **HTTP Request** node named `🖼️ Generate Featured Image (Runware)`  
   - Configure with Runware API credentials and endpoint for image generation.  
   - Include prompts derived from blog metadata or content.  
   - Connect output of Yoast metadata node here.

10. **Add Fetch Generated Image Node:**  
    - Add an **HTTP Request** node named `📥 Fetch Generated Image`  
    - Poll or fetch image from Runware API using generation job ID.  
    - Connect output of image generation node here.

11. **Add Upload Image to WordPress Media Node:**  
    - Add an **HTTP Request** node named `📤 Upload Image to WordPress Media`  
    - Configure to upload image as multipart/form-data to WordPress media endpoint: `/wp-json/wp/v2/media`  
    - Use WordPress credentials.  
    - Connect output of image fetch node here.

12. **Add Attach Image to Post Node:**  
    - Add an **HTTP Request** node named `📎 Attach Image to Post`  
    - Configure to PATCH the post endpoint `/wp-json/wp/v2/posts/{post_id}`  
    - Set the `featured_media` field to the media ID from upload response.  
    - Connect output of upload media node here.

13. **(Optional) Add Discord Notification Node:**  
    - Add a **Discord** node named `📣 Send Notification to Discord`  
    - Configure with Discord webhook or bot token.  
    - Connect output of attach image node.  
    - (Disabled by default)

14. **(Optional) Add Telegram Notification Node:**  
    - Add a **Telegram** node named `📨 Send Notification to Telegram`  
    - Configure with Telegram bot token and chat ID.  
    - Connect output of attach image node.  
    - (Disabled by default)

15. **Test the workflow end-to-end** ensuring each node executes without error and the blog post appears as a draft in WordPress with SEO metadata and featured image attached.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow includes multiple sticky notes titled "⚙️ Setup Guide" positioned near key nodes for user help. | These sticky notes likely contain detailed setup instructions and credential configurations.    |
| The workflow uses OpenRouter as the primary AI backend for generating metadata and article content.           | OpenRouter offers a multi-model platform, enabling model flexibility (e.g., LLaMA, Nemotron).    |
| Runware is used for AI-generated featured images, integrated via HTTP API calls.                              | Runware API documentation: https://runware.ai/docs (hypothetical example, verify actual source) |
| Yoast SEO metadata is set via HTTP requests to WordPress REST API, assuming Yoast plugin REST endpoints are enabled. | Ensure Yoast SEO plugin and REST API access are configured on WordPress site.                    |
| Notifications to Discord and Telegram are included but disabled by default, allowing optional integration.    | Enable and configure these if social notifications are desired.                                 |

---

**Disclaimer:**  
The provided content is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.