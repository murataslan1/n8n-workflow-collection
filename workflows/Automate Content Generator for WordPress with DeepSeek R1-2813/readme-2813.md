Automate Content Generator for WordPress with DeepSeek R1

https://n8nworkflows.xyz/workflows/automate-content-generator-for-wordpress-with-deepseek-r1-2813


# Automate Content Generator for WordPress with DeepSeek R1

### 1. Workflow Overview

This workflow automates the generation and publishing of SEO-friendly blog content on a WordPress site using DeepSeek AI models and OpenAI’s image generation capabilities. It integrates Google Sheets as a content idea source and tracking tool, WordPress for content publishing, and AI services for content and image creation.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Data Fetching**  
  Starts manually and fetches content ideas from Google Sheets.

- **1.2 Prompt Preparation**  
  Extracts and sets the prompt for AI content generation.

- **1.3 AI Content Generation**  
  Generates the article and title using DeepSeek AI models.

- **1.4 WordPress Post Creation**  
  Creates a draft post on WordPress with the generated content.

- **1.5 AI Image Generation and Upload**  
  Generates a photorealistic cover image with OpenAI DALL-E, uploads it to WordPress, and sets it as the featured image.

- **1.6 Google Sheets Update**  
  Updates the original Google Sheets document with post metadata for tracking.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Data Fetching

- **Overview:**  
  This block initiates the workflow manually and retrieves content ideas from a Google Sheets document, filtering for entries that have not yet been processed.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Get Ideas (Google Sheets)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Starts the workflow on user command.  
    - Configuration: Default manual trigger with no parameters.  
    - Inputs: None  
    - Outputs: Triggers the next node.  
    - Edge Cases: None typical; user must manually trigger.

  - **Get Ideas**  
    - Type: Google Sheets  
    - Role: Reads rows from a specified Google Sheet to fetch content prompts.  
    - Configuration:  
      - Document ID and Sheet Name set to target the content ideas sheet.  
      - Filters rows where “ID POST” is empty or null to select unprocessed ideas.  
    - Key Expressions: Uses sheet name "Sheet1" and document ID placeholder.  
    - Inputs: Trigger from Manual Trigger node.  
    - Outputs: Returns the first matching row with content prompt and metadata.  
    - Edge Cases:  
      - Authentication errors if Google credentials are invalid.  
      - Empty or missing sheet/document ID.  
      - No matching rows found (workflow may halt or error).

---

#### 2.2 Prompt Preparation

- **Overview:**  
  Extracts the prompt text from the Google Sheets data and prepares it for AI content generation.

- **Nodes Involved:**  
  - Set your prompt (Set node)

- **Node Details:**

  - **Set your prompt**  
    - Type: Set  
    - Role: Assigns the `PROMPT` field from the Google Sheets data to a variable named `prompt`.  
    - Configuration:  
      - Sets `prompt` = `{{$json.PROMPT}}`  
    - Inputs: Data from "Get Ideas" node.  
    - Outputs: Passes the prompt variable downstream.  
    - Edge Cases:  
      - Missing or empty `PROMPT` field could cause AI generation to fail or produce irrelevant content.

---

#### 2.3 AI Content Generation

- **Overview:**  
  Generates the full article and a concise SEO-optimized title using DeepSeek AI models based on the prompt.

- **Nodes Involved:**  
  - Generate article with DeepSeek (OpenAI node)  
  - Generate title with DeepSeek (OpenAI node)

- **Node Details:**

  - **Generate article with DeepSeek**  
    - Type: OpenAI (LangChain)  
    - Role: Produces an SEO-friendly article in HTML format.  
    - Configuration:  
      - Model: `deepseek-reasoner`  
      - Max tokens: 2048  
      - Prompt instructions:  
        - Write introduction (~120 words), 4-5 logically flowing chapters, and conclusion (~120 words).  
        - Use HTML formatting (bold, italics, paragraphs, lists) without markdown or code blocks.  
        - Deep, non-superficial content.  
    - Inputs: `prompt` variable from "Set your prompt".  
    - Outputs: JSON with `message.content` containing the article HTML.  
    - Edge Cases:  
      - API rate limits or authentication errors.  
      - Model response truncation if content exceeds token limit.  
      - Unexpected formatting or missing HTML tags.

  - **Generate title with DeepSeek**  
    - Type: OpenAI (LangChain)  
    - Role: Creates a concise SEO title (max 60 characters) for the article.  
    - Configuration:  
      - Model: `deepseek-reasoner`  
      - Max tokens: 2048  
      - Prompt instructions:  
        - Use keywords from the article.  
        - No HTML or quotation marks; only ":" and "," allowed as special characters.  
    - Inputs: Article content from "Generate article with DeepSeek".  
    - Outputs: JSON with `message.content` containing the title string.  
    - Edge Cases:  
      - Title too long or empty if AI fails.  
      - API errors or timeouts.

---

#### 2.4 WordPress Post Creation

- **Overview:**  
  Creates a new draft post on WordPress using the generated title and article content.

- **Nodes Involved:**  
  - Create post on Wordpress (WordPress node)

- **Node Details:**

  - **Create post on Wordpress**  
    - Type: WordPress  
    - Role: Creates a draft post with title and content.  
    - Configuration:  
      - Title: `{{$json.message.content}}` from "Generate title with DeepSeek".  
      - Content: `{{$node["Generate article with DeepSeek"].item.json.message.content}}` (HTML article).  
      - Status: Draft  
    - Inputs: Title from "Generate title with DeepSeek".  
    - Outputs: JSON with post metadata including post ID.  
    - Credentials: WordPress API credentials configured.  
    - Edge Cases:  
      - Authentication failure or permission issues.  
      - Content length or formatting issues rejected by WordPress.  
      - Network or API errors.

---

#### 2.5 AI Image Generation and Upload

- **Overview:**  
  Generates a photorealistic cover image using OpenAI DALL-E based on the article title, uploads it to WordPress media library, and sets it as the featured image for the post.

- **Nodes Involved:**  
  - Generate Image with DALL-E (OpenAI node)  
  - Upload image (HTTP Request node)  
  - Set Image (HTTP Request node)

- **Node Details:**

  - **Generate Image with DALL-E**  
    - Type: OpenAI (LangChain)  
    - Role: Creates a photographic image for the blog post cover.  
    - Configuration:  
      - Prompt: `"Generate a real photographic image used as a cover for a blog post: {{title}}, photography, realistic, sigma 85mm f/1.4"`  
      - Size: 1792x1024  
      - Style: Natural  
      - Quality: HD  
      - Resource: Image generation  
    - Inputs: Title from "Generate title with DeepSeek".  
    - Outputs: Binary image data.  
    - Credentials: OpenAI API credentials configured.  
    - Edge Cases:  
      - API rate limits or quota exceeded.  
      - Image generation failure or invalid prompt.

  - **Upload image**  
    - Type: HTTP Request  
    - Role: Uploads generated image to WordPress media endpoint.  
    - Configuration:  
      - URL: `https://YOURSITE.com/wp-json/wp/v2/media`  
      - Method: POST  
      - Content-Type: binaryData  
      - Headers: `Content-Disposition` with filename `copertina-<post_id>.jpg`  
      - Authentication: WordPress API credentials  
      - Input data field: binary image data from previous node  
    - Inputs: Image binary from "Generate Image with DALL-E" and post ID from "Create post on Wordpress".  
    - Outputs: JSON with media ID.  
    - Edge Cases:  
      - Authentication or permission errors.  
      - Upload size limits.  
      - Network failures.

  - **Set Image**  
    - Type: HTTP Request  
    - Role: Assigns uploaded media as featured image for the WordPress post.  
    - Configuration:  
      - URL: `https://wp.test.7hype.com/wp-json/wp/v2/posts/<post_id>`  
      - Method: POST  
      - Query parameter: `featured_media` = media ID from "Upload image"  
      - Authentication: WordPress API credentials  
    - Inputs: Post ID from "Create post on Wordpress", media ID from "Upload image".  
    - Outputs: Confirmation JSON.  
    - Edge Cases:  
      - API errors if post or media ID invalid.  
      - Permission issues.

---

#### 2.6 Google Sheets Update

- **Overview:**  
  Updates the original Google Sheets document row with the new post’s metadata: title, post ID, creation date, and row number.

- **Nodes Involved:**  
  - Update Sheet (Google Sheets node)

- **Node Details:**

  - **Update Sheet**  
    - Type: Google Sheets  
    - Role: Updates the row corresponding to the processed prompt with new post details.  
    - Configuration:  
      - Document ID and Sheet Name targeting the same sheet as "Get Ideas".  
      - Operation: Update  
      - Matching column: `row_number` to identify the correct row.  
      - Columns updated:  
        - DATA: current date (`{{$now.format('dd/LL/yyyy')}}`)  
        - TITOLO: title from "Generate title with DeepSeek"  
        - ID POST: post ID from "Create post on Wordpress"  
        - row_number: from "Get Ideas"  
    - Inputs: Data from previous nodes.  
    - Outputs: Confirmation of update.  
    - Edge Cases:  
      - Authentication errors.  
      - Row not found or mismatch in `row_number`.  
      - API quota limits.

---

### 3. Summary Table

| Node Name                   | Node Type                  | Functional Role                              | Input Node(s)                   | Output Node(s)                  | Sticky Note                                                                                                    |
|-----------------------------|----------------------------|----------------------------------------------|--------------------------------|--------------------------------|---------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’| Manual Trigger             | Starts workflow manually                      | None                           | Get Ideas                      |                                                                                                               |
| Get Ideas                   | Google Sheets              | Fetches unprocessed content ideas             | When clicking ‘Test workflow’  | Set your prompt                | Connect with your Google Sheet. This node select only rows for which no content has been generated yet in WordPress |
| Set your prompt             | Set                        | Extracts prompt from Google Sheets data       | Get Ideas                     | Generate article with DeepSeek |                                                                                                               |
| Generate article with DeepSeek | OpenAI (LangChain)       | Generates SEO-friendly article in HTML        | Set your prompt               | Generate title with DeepSeek   | Add your DeepSeek API credential. If you want you can change the model with "deepseek-chat"                    |
| Generate title with DeepSeek | OpenAI (LangChain)         | Generates SEO-optimized title                  | Generate article with DeepSeek | Create post on Wordpress       | Add your DeepSeek API credential. If you want you can change the model with "deepseek-chat"                    |
| Create post on Wordpress    | WordPress                  | Creates draft post with generated content     | Generate title with DeepSeek   | Generate Image with DALL-E     | Add your WordPress API credential                                                                              |
| Generate Image with DALL-E  | OpenAI (LangChain)         | Generates photorealistic cover image           | Create post on Wordpress       | Upload image                  | Add your OpenAI API credential                                                                                 |
| Upload image                | HTTP Request               | Uploads generated image to WordPress media    | Generate Image with DALL-E     | Set Image                    | Upload the image on your WordPress via APIs                                                                   |
| Set Image                   | HTTP Request               | Sets uploaded image as featured image on post | Upload image                  | Update Sheet                 | Set the uploaded image with the newly created article                                                         |
| Update Sheet                | Google Sheets              | Updates Google Sheets with post metadata       | Set Image                    | None                         |                                                                                                               |
| Sticky Note                 | Sticky Note                | Documentation and instructions                 | None                         | None                         | Target: Automate SEO content generation with DeepSeek and OpenAI DALL-E. Create Google Sheet with columns Date, Prompt, Title, Post ID. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add a Manual Trigger node named "When clicking ‘Test workflow’". No parameters needed.

2. **Add Google Sheets Node "Get Ideas"**  
   - Connect from Manual Trigger.  
   - Configure credentials with Google Sheets OAuth2.  
   - Set Document ID to your Google Sheets document containing content ideas.  
   - Set Sheet Name to "Sheet1" or your target sheet.  
   - Configure to read rows where "ID POST" is empty (filter for unprocessed rows).  
   - Set to return the first matching row.

3. **Add Set Node "Set your prompt"**  
   - Connect from "Get Ideas".  
   - Add an assignment: set variable `prompt` to `{{$json.PROMPT}}`.

4. **Add OpenAI Node "Generate article with DeepSeek"**  
   - Connect from "Set your prompt".  
   - Use LangChain OpenAI node type.  
   - Configure credentials with DeepSeek API key.  
   - Set model ID to `deepseek-reasoner` (or `deepseek-chat` if preferred).  
   - Set max tokens to 2048.  
   - Set message content with detailed instructions to generate an SEO article in HTML format based on `{{$json.prompt}}`.  
   - Ensure output is plain text with HTML tags (no markdown).

5. **Add OpenAI Node "Generate title with DeepSeek"**  
   - Connect from "Generate article with DeepSeek".  
   - Use same DeepSeek credentials and model.  
   - Max tokens 2048.  
   - Prompt instructs to generate a concise SEO title (max 60 characters) from the article content `{{$json.message.content}}`.  
   - Output is plain string without HTML or quotes.

6. **Add WordPress Node "Create post on Wordpress"**  
   - Connect from "Generate title with DeepSeek".  
   - Configure WordPress API credentials.  
   - Set post title to `{{$json.message.content}}` (title from previous node).  
   - Set post content to `{{$node["Generate article with DeepSeek"].item.json.message.content}}` (HTML article).  
   - Set post status to "draft".

7. **Add OpenAI Node "Generate Image with DALL-E"**  
   - Connect from "Create post on Wordpress".  
   - Configure OpenAI credentials (standard OpenAI account).  
   - Set prompt to generate a photorealistic image using the post title:  
     `"Generate a real photographic image used as a cover for a blog post: {{ $json.message.content }}, photography, realistic, sigma 85mm f/1.4"`  
   - Set image size to 1792x1024, style natural, quality HD.  
   - Resource type: image.

8. **Add HTTP Request Node "Upload image"**  
   - Connect from "Generate Image with DALL-E".  
   - Configure WordPress API credentials.  
   - Set URL to `https://YOURSITE.com/wp-json/wp/v2/media` (replace YOURSITE.com).  
   - Method: POST.  
   - Content-Type: binaryData.  
   - Header: `Content-Disposition` with value `attachment; filename="copertina-{{ $node["Create post on Wordpress"].item.json.id }}.jpg"`.  
   - Input data field: binary image data from previous node.

9. **Add HTTP Request Node "Set Image"**  
   - Connect from "Upload image".  
   - Configure WordPress API credentials.  
   - URL: `https://wp.test.7hype.com/wp-json/wp/v2/posts/{{ $node["Create post on Wordpress"].item.json.id }}` (replace domain).  
   - Method: POST.  
   - Query parameter: `featured_media` = `{{$json.id}}` (media ID from upload).  
   - This sets the featured image for the post.

10. **Add Google Sheets Node "Update Sheet"**  
    - Connect from "Set Image".  
    - Configure Google Sheets OAuth2 credentials.  
    - Document ID and Sheet Name same as "Get Ideas".  
    - Operation: Update.  
    - Matching column: `row_number` (from "Get Ideas").  
    - Update columns:  
      - DATA: current date `{{$now.format('dd/LL/yyyy')}}`  
      - TITOLO: title from "Generate title with DeepSeek"  
      - ID POST: post ID from "Create post on Wordpress"  
      - row_number: from "Get Ideas".

11. **Test the workflow manually** by clicking the manual trigger. Verify each step completes successfully.

12. **Activate the workflow** for scheduled or automated runs as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                           | Context or Link                                                                                         |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| This workflow is designed to automatically generate SEO-friendly content for WordPress through DeepSeek R1 by providing input ideas on how to structure the article. A cover image is generated and uploaded with OpenAI DALL-E 3.      | Sticky Note at workflow start                                                                           |
| Create a Google Sheet with columns: Date, Prompt, Title, Post ID. Fill only the "Prompt" column with ideas for DeepSeek to generate content.                                                                                         | Sticky Note at workflow start                                                                           |
| Connect with your Google Sheet. The "Get Ideas" node selects only rows for which no content has been generated yet in WordPress.                                                                                                      | Sticky Note near "Get Ideas" node                                                                       |
| Add your DeepSeek API credential. Optionally, change the model to "deepseek-chat" if preferred.                                                                                                                                       | Sticky Note near DeepSeek AI nodes                                                                     |
| Add your WordPress API credential to enable post creation and media upload.                                                                                                                                                            | Sticky Note near "Create post on Wordpress" node                                                      |
| Add your OpenAI API credential for image generation with DALL-E.                                                                                                                                                                      | Sticky Note near "Generate Image with DALL-E" node                                                    |
| Upload the image on your WordPress via APIs using the HTTP Request node.                                                                                                                                                              | Sticky Note near "Upload image" node                                                                   |
| Set the uploaded image as the featured image for the newly created article.                                                                                                                                                            | Sticky Note near "Set Image" node                                                                      |

---

This documentation provides a detailed, structured reference to understand, reproduce, and maintain the "Automate Content Generator for WordPress with DeepSeek R1" workflow, including potential failure points and configuration notes for all nodes.