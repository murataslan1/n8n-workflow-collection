Auto-Generate SEO Blog Posts with Perplexity, GPT, Leonardo & WordPress

https://n8nworkflows.xyz/workflows/auto-generate-seo-blog-posts-with-perplexity--gpt--leonardo---wordpress-6067


# Auto-Generate SEO Blog Posts with Perplexity, GPT, Leonardo & WordPress

### 1. Workflow Overview

This workflow automates the creation and publishing of SEO-optimized blog posts in Spanish about technological startups. It combines AI-driven content generation, editorial image creation, and WordPress publishing with metadata tracking in Google Sheets. The workflow is designed to run weekly on Mondays at 6:00 AM, producing fresh, relevant articles enhanced with custom images.

The logic is structured in these main blocks:

- **1.1 Scheduled Trigger & Topic Research:** Weekly automatic start; generates a trend-based SEO article draft using Perplexity AI.
- **1.2 Content Parsing & Image Prompt Generation:** Extracts article data from AI response; crafts a descriptive prompt for image generation using OpenAI.
- **1.3 Editorial Image Creation (Leonardo AI):** Uses the prompt to asynchronously create an editorial-style image with Leonardo AI, including polling for completion.
- **1.4 Image Upload & Enhancement on WordPress:** Uploads generated image to WordPress media library and sets SEO-relevant ALT text.
- **1.5 Blog Post Creation on WordPress:** Posts the article with the uploaded image and assigns a category, publishing it immediately.
- **1.6 Post-Publishing Journal Update:** Logs published post details into a Google Sheets document for record-keeping.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Topic Research

- **Overview:** Initiates the workflow every Monday at 6:00 AM; uses Perplexity AI to create a detailed SEO article draft in Spanish about the most relevant startup trends.
- **Nodes Involved:** Schedule Trigger, Research Topic- Perplexity
- **Node Details:**

  - **Schedule Trigger**
    - Type: Schedule Trigger
    - Configuration: Cron expression set to `0 6 * * 1` (6 AM every Monday)
    - Input: None (trigger node)
    - Output: Triggers the next HTTP Request node
    - Potential Failures: Scheduler misconfiguration or n8n downtime

  - **Research Topic- Perplexity**
    - Type: HTTP Request
    - Role: Sends a POST request to Perplexity API’s chat completion endpoint
    - Key Configurations:
      - Model: "sonar-pro"
      - Payload instructs AI to generate a Spanish SEO article, between 1000-1500 words, with HTML formatting and specific SEO keywords
      - Authentication: Uses predefined Perplexity API credentials
      - Expects a strict JSON response with "title" and "content" fields
    - Input: Trigger from Schedule Trigger
    - Output: Raw AI response JSON forwarded to parsing node
    - Edge Cases:
      - API auth errors or rate limits
      - Malformed JSON response from AI (node "Get Title, Content, and Image FileName" sticky note warns about this)
      - Network errors or timeouts

#### 1.2 Content Parsing & Image Prompt Generation

- **Overview:** Parses JSON article from Perplexity; generates a clean SEO-friendly image filename; then prompts OpenAI GPT-4.1-mini to create an editorial image description prompt.
- **Nodes Involved:** Get Title, Content, and Image FileName, Message a model
- **Node Details:**

  - **Get Title, Content, and Image FileName**
    - Type: Code (JavaScript)
    - Role: Parses Perplexity response JSON; creates slug for image filename by normalizing title for SEO-friendliness
    - Key Expressions: Uses `JSON.parse()` on AI content; slugify function removes accents, special characters, and replaces spaces with hyphens; outputs title, content, and image filename as `.jpg`
    - Input: AI response from Perplexity node
    - Output: JSON object with `title`, `content`, and `image_filename`
    - Edge Cases:
      - Parsing failure if JSON invalid (common per sticky note)
      - Missing or malformed AI response content

  - **Message a model**
    - Type: OpenAI (LangChain integration)
    - Role: Crafts an English prompt for Leonardo AI to generate a cinematic editorial blog image
    - Configuration:
      - Model: GPT-4.1-mini
      - System message: Expert in image prompt crafting for editorial/news images, no text or logos allowed
      - User message: Includes article title and content to generate a single-line image prompt (1200x628 px ideal)
    - Input: Parsed article JSON from previous node
    - Output: Text prompt for image generation
    - Edge Cases:
      - OpenAI API errors or rate limits
      - Empty or inadequate prompt generation

#### 1.3 Editorial Image Creation (Leonardo AI)

- **Overview:** Sends the prompt to Leonardo AI to generate an editorial image asynchronously, then polls the API until the image is ready.
- **Nodes Involved:** Leonardo: Create Post Image, Get Leonardo Image Status, If, Wait, Get Leonardo Image
- **Node Details:**

  - **Leonardo: Create Post Image**
    - Type: HTTP Request
    - Role: Submits generation job to Leonardo AI with prompt from OpenAI
    - Configuration:
      - Model ID fixed
      - Image size 1280x720
      - Parameters like promptMagic, guidance scale set
      - Auth: Bearer token for Leonardo AI
    - Input: Image prompt from OpenAI node
    - Output: Job generation ID for polling
    - Edge Cases:
      - API auth failure
      - Rejection due to prompt content
      - Network issues

  - **Get Leonardo Image Status**
    - Type: HTTP Request
    - Role: Polls Leonardo AI generation status using job ID
    - Input: Generation job ID from previous node or Wait node
    - Output: Job status and generated image URLs if ready
    - Retry enabled on failure
    - Edge Cases:
      - API rate limits
      - Job failures or cancellations

  - **If**
    - Type: Conditional
    - Role: Checks if Leonardo AI generation status is "COMPLETE"
    - Input: Status response from Get Leonardo Image Status
    - Output:
      - If true: proceeds to download image
      - If false: triggers Wait node to retry after delay
    - Edge Cases:
      - Incorrect or missing status field

  - **Wait**
    - Type: Wait node
    - Role: Delays workflow to avoid excessive polling; webhook configured for asynchronous wait
    - Input: Negative condition from If node
    - Output: Feeds back to Get Leonardo Image Status
    - Edge Cases:
      - Delay too short may cause API blocking
      - Delay too long increases workflow runtime

  - **Get Leonardo Image**
    - Type: HTTP Request
    - Role: Downloads generated image binary from Leonardo AI URL
    - Input: URL from completed generation object
    - Output: Binary image data for upload
    - Edge Cases:
      - URL expiry or invalid URL
      - Network errors

#### 1.4 Image Upload & Enhancement on WordPress

- **Overview:** Uploads the downloaded image to WordPress media library, then updates its ALT text using the AI-generated prompt for SEO.
- **Nodes Involved:** Upload Image to Wordpress, Agregar ALT a la Imagen
- **Node Details:**

  - **Upload Image to Wordpress**
    - Type: HTTP Request
    - Role: Uploads binary image to WordPress via REST API media endpoint
    - Config:
      - Method: POST
      - Headers: Content-Disposition with filename, Content-Type set to image/jpeg
      - Auth: HTTP Basic Auth with WordPress credentials
    - Input: Binary image from Get Leonardo Image
    - Output: JSON with uploaded media ID and URLs
    - Retry enabled on failure
    - Edge Cases:
      - Auth errors
      - WordPress media upload limits or restrictions

  - **Agregar ALT a la Imagen**
    - Type: HTTP Request
    - Role: Updates WordPress media metadata to set ALT text for SEO
    - Config:
      - Method: PUT
      - URL includes media ID from upload node
      - Body param: alt_text set to AI-generated prompt (from "Message a model")
      - Auth: same as upload node
    - Input: Media ID and ALT text prompt
    - Output: Updated media metadata response
    - Edge Cases:
      - Auth or permission errors
      - Media ID not found

#### 1.5 Blog Post Creation on WordPress

- **Overview:** Creates and immediately publishes a WordPress blog post with the AI-generated title, content, assigned category, and featured image.
- **Nodes Involved:** Crear Post en Wordpress
- **Node Details:**

  - **Crear Post en Wordpress**
    - Type: HTTP Request
    - Role: Posts article content to WordPress posts API
    - Configuration:
      - Method: POST
      - Body includes title, HTML content, status as "publish"
      - Assigns category ID 916
      - Sets featured_media to uploaded image ID
      - Auth: HTTP Basic Auth
    - Input: Title and content from parsing node; image ID from ALT node
    - Output: JSON response with post details
    - Retry enabled on failure
    - Edge Cases:
      - Auth failures
      - WordPress post creation limits or errors
      - Category ID invalid or missing

#### 1.6 Post-Publishing Journal Update

- **Overview:** Logs the new blog post’s essential metadata into a Google Sheets spreadsheet for tracking published posts.
- **Nodes Involved:** Publicaciones Wordpress Startups y Tecnología
- **Node Details:**

  - **Publicaciones Wordpress Startups y Tecnología**
    - Type: Google Sheets
    - Role: Appends or updates a row in a specific Google Sheets document and sheet (gid=0)
    - Data written: Post URL, Type ("Post WP"), Topic (post title), Status ("Posted"), Image URL, AI content, Post date
    - Auth: OAuth2 Google Sheets API credentials
    - Input: Post JSON from WordPress post creation node and image upload node
    - Output: Confirmation of sheet update
    - Edge Cases:
      - Google API quota or auth errors
      - Sheet or document not found

---

### 3. Summary Table

| Node Name                            | Node Type                           | Functional Role                             | Input Node(s)                   | Output Node(s)                      | Sticky Note                                                                                                         |
|------------------------------------|-----------------------------------|---------------------------------------------|--------------------------------|-----------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger                   | Schedule Trigger                  | Initiates workflow weekly at 6 AM Mondays   | None                           | Research Topic- Perplexity         |                                                                                                                     |
| Research Topic- Perplexity         | HTTP Request                     | Generates SEO article draft with Perplexity | Schedule Trigger               | Get Title, Content, and Image FileName |                                                                                                                     |
| Get Title, Content, and Image FileName | Code                            | Parses AI JSON, creates SEO-friendly slug   | Research Topic- Perplexity     | Message a model                   | ## Problem in node ‘Get Title, Content, and Image FileName‘: If issues occur, Perplexity JSON may be malformed.       |
| Message a model                   | OpenAI (LangChain)                | Creates image prompt for Leonardo AI         | Get Title, Content, and Image FileName | Leonardo: Create Post Image       | ## Image Prompt: Uses OpenAI to generate cost-effective image prompt for Leonardo AI.                                |
| Leonardo: Create Post Image       | HTTP Request                     | Submits image generation job to Leonardo AI | Message a model               | Get Leonardo Image Status          | ## Generación de Imagen con LeonardoAI: Async process requires polling to check completion status.                   |
| Get Leonardo Image Status         | HTTP Request                     | Polls Leonardo AI for generation status      | Leonardo: Create Post Image, Wait | If                              |                                                                                                                     |
| If                               | If                              | Checks if image generation is complete       | Get Leonardo Image Status      | Get Leonardo Image (if complete), Wait (if not) |                                                                                                                     |
| Wait                             | Wait                            | Delays workflow to avoid API blocking       | If (not complete)              | Get Leonardo Image Status          |                                                                                                                     |
| Get Leonardo Image               | HTTP Request                     | Downloads generated image from Leonardo AI  | If (complete)                  | Upload Image to Wordpress          |                                                                                                                     |
| Upload Image to Wordpress         | HTTP Request                     | Uploads image binary to WordPress media      | Get Leonardo Image             | Agregar ALT a la Imagen            | ## ALT Images: ALT text remains a key SEO feature alongside image filename.                                         |
| Agregar ALT a la Imagen           | HTTP Request                     | Sets SEO ALT text on WordPress image         | Upload Image to Wordpress      | Crear Post en Wordpress            |                                                                                                                     |
| Crear Post en Wordpress            | HTTP Request                     | Creates and publishes the WordPress post     | Agregar ALT a la Imagen        | Publicaciones Wordpress Startups y Tecnología | ## Publicamos: Posts include image and category; published immediately.                                             |
| Publicaciones Wordpress Startups y Tecnología | Google Sheets                   | Logs post metadata into Google Sheets        | Crear Post en Wordpress        | None                             | ## Journal: Maintains record of posts created by the workflow.                                                      |
| Sticky Note                      | Sticky Note                     | Provides troubleshooting note                 | None                          | None                             | ## Problem in node ‘Get Title, Content, and Image FileName‘: If this happens, JSON was not created successfully.     |
| Sticky Note1                     | Sticky Note                     | Explains importance of ALT text for SEO       | None                          | None                             | ## ALT Images: ALT remains important SEO feature with image filename.                                               |
| Sticky Note2                     | Sticky Note                     | Describes asynchronous image generation process | None                          | None                             | ## Generación de Imagen con LeonardoAI: Polling interval prevents API blocking.                                     |
| Sticky Note3                     | Sticky Note                     | Notes use of ChatGPT to generate Leonardo AI prompt | None                          | None                             | ## Image Prompt: Leonardo AI prompt is cost-efficient compared to OpenAI-generated images.                          |
| Sticky Note4                     | Sticky Note                     | Notes publishing step                          | None                          | None                             | ## Publicamos: Post includes image and category, published directly.                                               |
| Sticky Note5                     | Sticky Note                     | Notes journal logging                          | None                          | None                             | ## Journal: Logs all posts published through this workflow.                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**
   - Type: Schedule Trigger
   - Cron Expression: `0 6 * * 1` (run every Monday at 6 AM)
   - Purpose: Start the workflow weekly

2. **Add an HTTP Request node named "Research Topic- Perplexity"**
   - Method: POST
   - URL: `https://api.perplexity.ai/chat/completions`
   - Authentication: Use Perplexity API credentials (predefined credential type)
   - Body (JSON):
     ```json
     {
       "model": "sonar-pro",
       "messages": [
         {
           "role": "system",
           "content": "Eres un asistente experto en generar artículos SEO en español neutro sobre startups tecnológicas. El tono debe ser educativo, práctico, reflexivo e inspirador."
         },
         {
           "role": "user",
           "content": "Redacta un artículo basado en la tendencia más relevante del ecosistema de startups tecnológicas hispanohablantes del día. Devuelve la respuesta estrictamente en formato JSON con esta estructura: {\"title\": \"[titulo]\", \"content\": \"[contenido HTML]\"}..."
         }
       ]
     }
     ```
   - Connect Schedule Trigger output to this node input.

3. **Add a Code node named "Get Title, Content, and Image FileName"**
   - Purpose: Parse JSON from Perplexity and generate SEO-friendly image filename
   - Code:
     ```javascript
     const data = JSON.parse($input.first().json.choices[0].message.content);

     function toSlug(text) {
       return text.toLowerCase()
         .normalize("NFD")
         .replace(/[\u0300-\u036f]/g, "")
         .replace(/[^a-z0-9\s-]/g, "")
         .replace(/\s+/g, "-")
         .replace(/-+/g, "-")
         .replace(/^-|-$/g, "");
     }

     const imageName = toSlug(data.title) + ".jpg";

     return [{
       json: {
         title: data.title,
         content: data.content,
         image_filename: imageName
       }
     }];
     ```
   - Connect "Research Topic- Perplexity" node output to this node input.

4. **Add an OpenAI node named "Message a model"**
   - Integration: LangChain OpenAI node
   - Model: GPT-4.1-mini
   - Messages:
     - System: Expert in crafting AI image generation prompts for editorial/news images; no text or logos.
     - User: Generate a single-line English description for an editorial image representing the article with given title and content; output prompt only.
   - Connect output of "Get Title, Content, and Image FileName" node to this node.

5. **Add HTTP Request node "Leonardo: Create Post Image"**
   - Method: POST
   - URL: `https://cloud.leonardo.ai/api/rest/v1/generations`
   - Auth: Bearer token with Leonardo AI credentials
   - Body (JSON):
     ```json
     {
       "prompt": "{{ $json.message.content }}",
       "modelId": "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3",
       "width": 1280,
       "height": 720,
       "sd_version": "v2",
       "num_images": 1,
       "promptMagic": true,
       "promptMagicStrength": 0.5,
       "public": false,
       "scheduler": "LEONARDO",
       "guidance_scale": 7
     }
     ```
   - Connect "Message a model" output here.

6. **Add HTTP Request node "Get Leonardo Image Status"**
   - Method: GET
   - URL: `https://cloud.leonardo.ai/api/rest/v1/generations/{{ $json.sdGenerationJob.generationId }}`
   - Auth: Bearer token Leonardo AI
   - Connect output of "Leonardo: Create Post Image" to this node.

7. **Add If node "If"**
   - Condition: Check if `{{ $json.generations_by_pk.status }}` equals "COMPLETE"
   - Connect "Get Leonardo Image Status" output to this node.

8. **Add Wait node "Wait"**
   - Purpose: Delay for a few seconds before rechecking
   - Connect "If" node’s false output here.

9. **Connect "Wait" node output back to "Get Leonardo Image Status"**  
   This creates a polling loop.

10. **Add HTTP Request node "Get Leonardo Image"**
    - Method: GET
    - URL: `{{ $json.generations_by_pk.generated_images[0].url }}`
    - Connect "If" node’s true output here.

11. **Add HTTP Request node "Upload Image to Wordpress"**
    - Method: POST
    - URL: `https://cristiantala.com/wp-json/wp/v2/media`
    - Auth: HTTP Basic Auth with WordPress credentials
    - Content-Type: binaryData
    - Headers:
      - Content-Disposition: `attachment; filename="{{ $('Get Title, Content, and Image FileName').item.json.image_filename }}"`
      - Content-Type: image/jpeg
    - Input data field name: `data` (binary)
    - Connect "Get Leonardo Image" output here.

12. **Add HTTP Request node "Agregar ALT a la Imagen"**
    - Method: PUT
    - URL: `https://cristiantala.com/wp-json/wp/v2/media/{{ $json.id }}`
    - Auth: HTTP Basic Auth (WordPress)
    - Body parameter: `alt_text` with value from "Message a model" node’s prompt text
    - Connect "Upload Image to Wordpress" output here.

13. **Add HTTP Request node "Crear Post en Wordpress"**
    - Method: POST
    - URL: `https://cristiantala.com/wp-json/wp/v2/posts`
    - Auth: HTTP Basic Auth (WordPress)
    - Body JSON:
      ```json
      {
        "title": "{{ $('Get Title, Content, and Image FileName').item.json.title }}",
        "content": "{{ $('Get Title, Content, and Image FileName').item.json.content }}",
        "status": "publish",
        "categories": [916],
        "featured_media": {{ $('Upload Image to Wordpress').item.json.id }}
      }
      ```
    - Connect "Agregar ALT a la Imagen" output here.

14. **Add Google Sheets node "Publicaciones Wordpress Startups y Tecnología"**
    - Operation: Append or Update
    - Document ID: `1s3HKV8M3U8NvOp1CxERz8tnC9ibYmnB4Pztgv1ZjkOQ`
    - Sheet Name / GID: `gid=0`
    - Mapping columns: Topic, Tipo, Status, Contenido AI, Fecha del Posteo, URL, URL Imagen
    - Input values from WordPress post creation and image upload nodes
    - Connect "Crear Post en Wordpress" output here.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                     | Context or Link                                                    |
|--------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| Problem in node ‘Get Title, Content, and Image FileName’: If this happens, it means Perplexity AI did not generate proper JSON output.           | Troubleshooting AI JSON parsing                                   |
| ALT Images: ALT remains a crucial SEO feature alongside the image filename.                                                                       | SEO best practices                                                |
| Generación de Imagen con LeonardoAI: The image generation is asynchronous; polling every few seconds prevents API blocking.                      | Leonardo AI image generation process                              |
| Image Prompt: OpenAI is used to generate cost-effective, high-quality prompts for Leonardo AI image generation.                                   | Cost optimization for AI image generation                         |
| Publicamos: Posts are published immediately including assigned category and featured image.                                                       | WordPress publishing step                                         |
| Journal: Keeps a log of all posts created by this workflow in Google Sheets for auditing and tracking.                                           | Workflow post-publishing record keeping                           |

---

**Disclaimer:** The provided text is exclusively from an automated workflow created with n8n, respecting all applicable content policies and handling only legal, public data.