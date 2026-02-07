Auto-Generate & Post Social Media Content with GPT-4, Notion & Instagram API

https://n8nworkflows.xyz/workflows/auto-generate---post-social-media-content-with-gpt-4--notion---instagram-api-8553


# Auto-Generate & Post Social Media Content with GPT-4, Notion & Instagram API

### 1. Workflow Overview

This workflow automates the creation and posting of social media content by integrating GPT-4 AI, Notion for content management, and Instagram API for direct publishing. It is designed for content creators or marketers who want to streamline generating captions and blog drafts from raw text input and automatically post to Instagram, with drafts saved for Threads, X (formerly Twitter), and blog posts.

Logical blocks:

- **1.1 Input Reception and Storage:** Receives raw text input via webhook (e.g., from a LINE bot) and saves it as a new page in a Notion database.
- **1.2 AI-Driven Caption and Draft Generation:** Uses GPT-4 to generate platform-specific captions (Instagram, Threads, X) and a blog draft, saving all drafts back into the same Notion page.
- **1.3 Image Handling and Upload:** Retrieves book cover images from external APIs (not detailed in this export), uploads the chosen image to Cloudinary, and obtains a URL optimized for Instagram posting.
- **1.4 Instagram Media Creation and Publishing:** Creates a media container via Instagram Graph API using the Cloudinary image and generated caption, then publishes the post and verifies success.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Storage

- **Overview:**  
  This block receives raw text input through a webhook and immediately records it as a new entry in a Notion database. This ensures all incoming data is logged and used as the base for content generation.

- **Nodes Involved:**  
  - Webhook  
  - Notion Page Create  
  - Sticky Note: "Step 1: Input"

- **Node Details:**

  - **Webhook**  
    - Type: HTTP Webhook  
    - Role: Receives HTTP POST requests with raw text payload (e.g., from a LINE bot).  
    - Configuration: Path `/line-book-output`, POST method, immediate response mode.  
    - Input: External HTTP POST requests.  
    - Output: JSON containing the raw text input under `body.events[0].message.text`.  
    - Edge cases: Invalid payloads, unauthorized requests, webhook downtime.

  - **Notion Page Create**  
    - Type: Notion database page creation  
    - Role: Creates a new Notion page with the received text as the title.  
    - Configuration: Target Notion database ID (replace `<your_database_id>`), title property set to the input text extracted from webhook JSON.  
    - Input: JSON from Webhook.  
    - Output: Newly created Notion page metadata including URL.  
    - Edge cases: Notion authentication errors, database ID misconfiguration, rate limits.

  - **Sticky Note: Step 1: Input**  
    - Purpose: Describes this block’s function: receive raw text and save to Notion.

---

#### 2.2 AI-Driven Caption and Draft Generation

- **Overview:**  
  This block generates social media captions for Instagram, Threads, X, and a blog draft using GPT-4. Each generated text is saved back into the same Notion page, enabling tracking and reuse.

- **Nodes Involved:**  
  - Instagram Caption Generate (GPT-4)  
  - Instagram Caption Save (Notion update)  
  - Threads Caption Generate (GPT-4)  
  - Threads Caption Save (Notion update)  
  - X Caption Generate (GPT-4)  
  - X Caption Save (Notion update)  
  - Blog Draft Generate (GPT-4)  
  - Blog Draft Save (Notion update)  
  - Sticky Note: "Step 2: Generate Captions"

- **Node Details:**

  - **Instagram Caption Generate**  
    - Type: OpenAI GPT-4 (via Langchain node)  
    - Role: Generate Instagram-specific caption (max 1000 chars, includes hashtags).  
    - Configuration: Model `chatgpt-4o-latest`, prompt summarizes input text (`$json.name`) accordingly.  
    - Input: Notion page creation result (assumes input text in `$json.name`).  
    - Output: Generated caption text in `message.content`.  
    - Edge cases: OpenAI API errors, prompt errors, token limits.

  - **Instagram Caption Save**  
    - Type: Notion page update  
    - Role: Save generated Instagram caption to the Notion page under "Instagram Caption" rich text property.  
    - Configuration: Page URL from previous Notion create node, updates rich_text field.  
    - Input: Output from Instagram Caption Generate.  
    - Output: Confirmation of page update.  
    - Edge cases: Notion API errors, field name mismatches.

  - **Threads Caption Generate & Save**  
    - Similar to Instagram caption nodes but generates and saves captions optimized for Threads (max 500 chars).

  - **X Caption Generate & Save**  
    - Similar structure, creates X/Twitter captions (max 280 chars).

  - **Blog Draft Generate & Save**  
    - Generates a blog article draft (title, TOC, body) up to 1800 characters, saves as rich text in Notion.

  - **Sticky Note: Step 2: Generate Captions**  
    - Describes the AI generation and saving of captions/drafts for multiple platforms.

---

#### 2.3 Image Handling and Upload

- **Overview:**  
  This block handles fetching the book cover image from external APIs (not included in the JSON but mentioned), uploads the selected image to Cloudinary for optimized delivery, and prepares the image URL for Instagram use.

- **Nodes Involved:**  
  - Upload to Cloudinary (HTTP Request)  
  - Sticky Note: "Step 3: Image Handling"

- **Node Details:**

  - **Upload to Cloudinary**  
    - Type: HTTP Request (POST)  
    - Role: Uploads the book cover image to Cloudinary cloud storage.  
    - Configuration:  
      - URL: `https://api.cloudinary.com/v1_1/<your_cloud_name>/image/upload`  
      - Method: POST, multipart-form-data  
      - Form parameters:  
        - `file`: binary data from previous nodes (input field `data1`)  
        - `folder`: `ig/books`  
        - `public_id`: dynamically generated using ISBN13 or timestamp (e.g., `ig_books_<isbn13>_cover`)  
        - `upload_preset`: your Cloudinary preset for unsigned upload  
    - Input: Binary image data from previous image fetching step (not shown).  
    - Output: JSON with secure URL of the uploaded image.  
    - Edge cases: Network errors, invalid credentials, Cloudinary limits.

  - **Sticky Note: Step 3: Image Handling**  
    - Describes the image fetching and upload workflow for Instagram.

---

#### 2.4 Instagram Media Creation and Publishing

- **Overview:**  
  This block creates an Instagram media container using the uploaded image URL and generated caption, then publishes the media on Instagram via the Graph API, verifying the post status.

- **Nodes Involved:**  
  - Instagram Media Container (HTTP Request)  
  - Instagram Publish (HTTP Request)  
  - Sticky Note: "Step 4: Instagram Publish"

- **Node Details:**

  - **Instagram Media Container**  
    - Type: HTTP Request (POST)  
    - Role: Creates a media container with Instagram Graph API for scheduled publishing.  
    - Configuration:  
      - URL: `https://graph.facebook.com/v23.0/17841458946648987/media` (Instagram Business Account ID hardcoded)  
      - Query parameters:  
        - `access_token`: from environment variable `$env.IG_ACCESS_TOKEN`  
        - `image_url`: secure URL from Cloudinary upload node  
        - `caption`: Instagram caption text extracted from Notion saved property  
    - Input: Outputs from Cloudinary upload and Instagram caption save nodes.  
    - Output: JSON containing `id` of media container.  
    - Edge cases: Token expiry, permission errors, invalid image URL, API limit.

  - **Instagram Publish**  
    - Type: HTTP Request (POST)  
    - Role: Publishes the media container on Instagram.  
    - Configuration:  
      - URL: `https://graph.facebook.com/v23.0/17841458946648987/media_publish`  
      - Query parameters:  
        - `creation_id`: media container ID from previous node  
        - `access_token`: environment variable  
    - Input: Media container ID from previous node.  
    - Output: JSON with publish status.  
    - Edge cases: Publish failures, token expiry, API throttling.

  - **Sticky Note: Step 4: Instagram Publish**  
    - Describes the creation and publishing process of Instagram media.

---

### 3. Summary Table

| Node Name               | Node Type                      | Functional Role                              | Input Node(s)             | Output Node(s)                 | Sticky Note                                                                                               |
|-------------------------|--------------------------------|----------------------------------------------|---------------------------|-------------------------------|----------------------------------------------------------------------------------------------------------|
| Step 1: Input           | Sticky Note                    | Describes input reception and Notion saving  |                           | Webhook                       | # Step 1: Input - Receive raw text via Webhook (e.g., LINE Bot); Save input automatically into Notion DB  |
| Webhook                 | HTTP Webhook                  | Receives raw text input POST                   |                           | Notion Page Create            | Receive text input (from LINE or other source).                                                          |
| Notion Page Create      | Notion (database page create) | Creates new Notion page with input text       | Webhook                   | Instagram Caption Generate    | Create a new Notion page with input text.                                                                |
| Step 2: Generate Captions| Sticky Note                   | Describes GPT-4 caption/draft generation      | Notion Page Create        | Instagram Caption Generate    | # Step 2: Generate Captions - GPT-4 generates captions for multiple platforms; saved in Notion           |
| Instagram Caption Generate | OpenAI GPT-4 (Langchain)     | Generates Instagram caption                    | Notion Page Create        | Instagram Caption Save        | Generate Instagram caption using GPT-4.                                                                  |
| Instagram Caption Save  | Notion (page update)           | Saves Instagram caption to Notion              | Instagram Caption Generate| Threads Caption Generate      |                                                                                                          |
| Threads Caption Generate| OpenAI GPT-4 (Langchain)       | Generates Threads caption                       | Instagram Caption Save    | Threads Caption Save          |                                                                                                          |
| Threads Caption Save    | Notion (page update)           | Saves Threads caption to Notion                 | Threads Caption Generate  | X Caption Generate            |                                                                                                          |
| X Caption Generate      | OpenAI GPT-4 (Langchain)       | Generates X/Twitter caption                     | Threads Caption Save      | X Caption Save                |                                                                                                          |
| X Caption Save          | Notion (page update)           | Saves X caption to Notion                        | X Caption Generate        | Blog Draft Generate           |                                                                                                          |
| Blog Draft Generate     | OpenAI GPT-4 (Langchain)       | Generates blog article draft                     | X Caption Save            | Blog Draft Save               |                                                                                                          |
| Blog Draft Save         | Notion (page update)           | Saves blog draft to Notion                        | Blog Draft Generate       | Upload to Cloudinary          |                                                                                                          |
| Step 3: Image Handling  | Sticky Note                    | Describes image fetching and upload             | Blog Draft Save           | Upload to Cloudinary          | # Step 3: Image Handling - Fetch cover images; upload to Cloudinary; generate optimized Instagram URL    |
| Upload to Cloudinary    | HTTP Request                   | Uploads image to Cloudinary                      | Blog Draft Save           | Instagram Media Container     |                                                                                                          |
| Step 4: Instagram Publish | Sticky Note                  | Describes Instagram media creation & publishing | Upload to Cloudinary      | Instagram Media Container     | # Step 4: Instagram Publish - Create media container; publish with caption + image; verify post          |
| Instagram Media Container| HTTP Request                  | Creates Instagram media container                | Upload to Cloudinary      | Instagram Publish             |                                                                                                          |
| Instagram Publish       | HTTP Request                   | Publishes media container on Instagram           | Instagram Media Container |                               |                                                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `line-book-output`  
   - Response Mode: onReceived  
   - Purpose: Receive raw text input (e.g., from LINE Bot).

2. **Create Notion Page Create Node**  
   - Type: Notion (database page create)  
   - Credentials: Set up Notion OAuth2 or API key with access to your database  
   - Database ID: `<your_database_id>` (replace with your Notion database ID)  
   - Property Mapping:  
     - Title property mapped to `{{$json.body.events[0].message.text}}` from Webhook output  
   - Connect Webhook output to this node.

3. **Create Instagram Caption Generate Node**  
   - Type: OpenAI GPT-4 (Langchain node)  
   - Credentials: OpenAI API key with GPT-4 access  
   - Model: `chatgpt-4o-latest`  
   - Messages:  
     - Prompt: `Summarize for Instagram (<=1000 chars, include hashtags): {{ $json.name }}`  
   - Connect output of Notion Page Create to this node.

4. **Create Instagram Caption Save Node**  
   - Type: Notion (database page update)  
   - Credentials: Same as Notion Create node  
   - Page ID: Use expression `={{ $('Notion Page Create').item.json.url }}`  
   - Update property:  
     - "Instagram Caption" (rich_text) set to `={{ $json.message.content }}`  
   - Connect Instagram Caption Generate output to this node.

5. **Create Threads Caption Generate Node**  
   - Same configuration as Instagram Caption Generate but with prompt:  
     `Summarize for Threads (<=500 chars, include hashtags): {{ $json.name }}`  
   - Connect Instagram Caption Save output to this node.

6. **Create Threads Caption Save Node**  
   - Same as Instagram Caption Save but updates "Threads Caption" property  
   - Connect Threads Caption Generate output to this node.

7. **Create X Caption Generate Node**  
   - Same as above, prompt:  
     `Summarize for X/Twitter (<=280 chars, include hashtags): {{ $json.name }}`  
   - Connect Threads Caption Save output to this node.

8. **Create X Caption Save Node**  
   - Same as other Save nodes, update "X Caption" property  
   - Connect X Caption Generate output to this node.

9. **Create Blog Draft Generate Node**  
   - GPT-4 node with prompt:  
     `Rewrite into blog article (<=1800 chars, include Title, TOC, Body): {{ $json.name }}`  
   - Connect X Caption Save output to this node.

10. **Create Blog Draft Save Node**  
    - Notion update node updating "Blog Draft" property  
    - Connect Blog Draft Generate output to this node.

11. **Create Upload to Cloudinary HTTP Request Node**  
    - URL: `https://api.cloudinary.com/v1_1/<your_cloud_name>/image/upload`  
    - Method: POST  
    - Content-Type: multipart-form-data  
    - Body parameters:  
      - `file`: binary data input field named `data1` (ensure you have an upstream image fetch node providing this)  
      - `folder`: `ig/books`  
      - `public_id`: expression `=ig_books_{{ $json.isbn13 || Date.now() }}_cover`  
      - `upload_preset`: your configured Cloudinary upload preset  
    - Connect Blog Draft Save output (or previous binary image node) to this node.

12. **Create Instagram Media Container HTTP Request Node**  
    - URL: `https://graph.facebook.com/v23.0/<instagram_business_account_id>/media`  
    - Method: POST  
    - Query parameters:  
      - `access_token`: from environment variable `IG_ACCESS_TOKEN`  
      - `image_url`: `={{$('Upload to Cloudinary').item.json.secure_url}}`  
      - `caption`: `={{ $('Instagram Caption Save').item.json["Instagram Caption|rich_text"][0].plain_text }}`  
    - Connect Upload to Cloudinary output to this node.

13. **Create Instagram Publish HTTP Request Node**  
    - URL: `https://graph.facebook.com/v23.0/<instagram_business_account_id>/media_publish`  
    - Method: POST  
    - Query parameters:  
      - `creation_id`: `={{ $('Instagram Media Container').item.json.id }}`  
      - `access_token`: environment variable  
    - Connect Instagram Media Container output to this node.

**Notes:**  
- Replace placeholders `<your_database_id>`, `<your_cloud_name>`, `<your_upload_preset>`, and `<instagram_business_account_id>` with your actual credentials and IDs.  
- Ensure environment variable `IG_ACCESS_TOKEN` is set with a valid Instagram Graph API token with publish permissions.  
- The workflow assumes an image fetch step before Cloudinary upload (not included in provided JSON), so implement that accordingly.  
- Proper error handling and retries should be implemented as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                               | Context or Link                                                                                      |
|------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow designed to auto-generate social content drafts and post automatically to Instagram.              | Workflow title and usage context.                                                                   |
| Uses GPT-4 model `chatgpt-4o-latest` via Langchain node for advanced text generation.                       | OpenAI GPT-4 integration.                                                                           |
| Requires Notion database for storing input and generated content drafts to maintain content workflow.      | Notion API integration.                                                                             |
| Cloudinary used for image hosting and optimization before Instagram upload.                                | Cloudinary API integration.                                                                         |
| Instagram Graph API v23.0 used for media container creation and publishing.                                 | Instagram Graph API documentation: https://developers.facebook.com/docs/instagram-api                   |
| Input webhook path: `/line-book-output` designed to connect with LINE messaging bot or similar services.  | Webhook integration entry point.                                                                    |
| Environment variable `IG_ACCESS_TOKEN` is mandatory for Instagram API authentication.                       | Instagram OAuth2 credentials management.                                                            |
| The workflow does not include external image-fetch nodes but references APIs such as Google Books, OpenBD. | External image API integration is to be added as needed.                                           |

---

**Disclaimer:** The provided text is exclusively sourced from an automated n8n workflow. It strictly adheres to content policies and contains no illegal or offensive elements. All data handled is legal and public.