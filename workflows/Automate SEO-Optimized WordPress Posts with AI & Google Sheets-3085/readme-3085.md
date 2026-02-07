Automate SEO-Optimized WordPress Posts with AI & Google Sheets

https://n8nworkflows.xyz/workflows/automate-seo-optimized-wordpress-posts-with-ai---google-sheets-3085


# Automate SEO-Optimized WordPress Posts with AI & Google Sheets

### 1. Workflow Overview

This workflow automates the creation of SEO-optimized WordPress blog posts by integrating AI content generation, image creation, SEO meta tag optimization, and Google Sheets for data management. It is designed for content creators, marketers, and SEO specialists who want to streamline blog post production with minimal manual effort.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Context Fetching**: Manual trigger initiates the workflow and fetches blog post context from Google Sheets.
- **1.2 AI Content Generation**: Uses AI models (DeepSeek) to generate the article content and a compelling SEO-friendly title.
- **1.3 WordPress Draft Creation**: Creates a draft post in WordPress with the generated content and title.
- **1.4 Image Generation & Upload**: Generates a blog-appropriate image via OpenAI, uploads it to WordPress media, and sets it as the featured image.
- **1.5 SEO Meta Tag Optimization**: Analyzes the published draft using OpenRouter AI to generate optimized meta title and description.
- **1.6 Metadata Application & Sheet Update**: Applies the meta tags to the WordPress post and updates the Google Sheet with post details and metadata.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Context Fetching

- **Overview:**  
  This block starts the workflow manually and retrieves the blog post context (topic, keywords, etc.) from a Google Sheet to be used for AI content generation.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Get context (Google Sheets)  
  - Set context (Set node)  
  - Sticky Note (comment)

- **Node Details:**  

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Initiates the workflow on user command.  
    - Configuration: Default manual trigger, no parameters.  
    - Inputs: None  
    - Outputs: Triggers "Get context" node.  
    - Edge Cases: User must manually trigger; no automatic scheduling.  

  - **Get context**  
    - Type: Google Sheets  
    - Role: Fetches the blog post context row from a predefined Google Sheet.  
    - Configuration:  
      - Document ID and Sheet Name linked to a specific Google Sheet ("Complete Plan Blog post").  
      - Filters by "ID POST" column to return the first matching row.  
      - Uses Google Sheets OAuth2 credentials.  
    - Inputs: Trigger from Manual Trigger.  
    - Outputs: Passes data to "Set context".  
    - Edge Cases:  
      - Authentication failure with Google Sheets.  
      - No matching row found for the filter.  
      - Sheet structure changes may break lookup.  

  - **Set context**  
    - Type: Set  
    - Role: Extracts and assigns the "PROMPT" field from the Google Sheet row to a variable named "prompt" for AI input.  
    - Configuration: Assigns `prompt = {{$json.PROMPT}}`.  
    - Inputs: Data from "Get context".  
    - Outputs: Passes "prompt" to "Generate article".  
    - Edge Cases: Missing or empty PROMPT value may cause AI generation issues.  

  - **Sticky Note**  
    - Content: "Fetches the context of the article you want to generate via AI"  
    - Role: Documentation aid for users.

---

#### 2.2 AI Content Generation

- **Overview:**  
  Generates the SEO-friendly article content and a keyword-rich title using the DeepSeek AI model.

- **Nodes Involved:**  
  - Generate article (OpenAI via DeepSeek)  
  - Generate title (OpenAI via DeepSeek)  
  - Sticky Note1 (comment)

- **Node Details:**  

  - **Generate article**  
    - Type: OpenAI (LangChain node)  
    - Role: Creates an SEO-optimized article in HTML format based on the prompt.  
    - Configuration:  
      - Model: DeepSeek-chat  
      - Max tokens: 2048  
      - Prompt includes detailed instructions for introduction, chapters, conclusion, HTML formatting (bold, italics, paragraphs, lists), and SEO depth.  
    - Inputs: Receives "prompt" from "Set context".  
    - Outputs: Passes generated article content to "Generate title".  
    - Edge Cases:  
      - AI model timeout or rate limits.  
      - Output formatting errors if AI does not follow instructions.  
      - Token limit truncation.  

  - **Generate title**  
    - Type: OpenAI (LangChain node)  
    - Role: Produces a concise, SEO-friendly title (max 60 characters) using keywords from the article.  
    - Configuration:  
      - Model: DeepSeek-chat  
      - Max tokens: 2048  
      - Instructions to avoid HTML characters and quotes, output only the title string.  
    - Inputs: Receives article content from "Generate article".  
    - Outputs: Passes title to "Add draft to WP".  
    - Edge Cases:  
      - Title length exceeding 60 characters.  
      - AI generating invalid characters or formatting.  

  - **Sticky Note1**  
    - Content: "Create the draft post on Wordpress with the article text and the title that were previously generated"  
    - Role: Documentation for the next block.

---

#### 2.3 WordPress Draft Creation

- **Overview:**  
  Creates a draft WordPress post using the generated title and article content.

- **Nodes Involved:**  
  - Add draft to WP (WordPress node)  
  - Sticky Note1 (comment)

- **Node Details:**  

  - **Add draft to WP**  
    - Type: WordPress  
    - Role: Creates a new draft post on WordPress.  
    - Configuration:  
      - Title: Uses generated title from "Generate title".  
      - Content: Uses generated article content from "Generate article".  
      - Status: Draft  
      - Credentials: WordPress API credentials configured for the target site.  
    - Inputs: Title and content from "Generate title" and "Generate article".  
    - Outputs: Passes post ID and details to "Generate image".  
    - Edge Cases:  
      - WordPress API authentication failure.  
      - API rate limits or connectivity issues.  
      - Content size limits on WordPress.  

---

#### 2.4 Image Generation & Upload

- **Overview:**  
  Generates a realistic blog cover image using OpenAI, uploads it to WordPress media library, and sets it as the featured image for the draft post.

- **Nodes Involved:**  
  - Generate image (OpenAI)  
  - Upload image (HTTP Request)  
  - Set image (HTTP Request)  
  - Sticky Note2 (comment)

- **Node Details:**  

  - **Generate image**  
    - Type: OpenAI (LangChain node)  
    - Role: Generates a realistic photo image for blog post cover based on the generated title.  
    - Configuration:  
      - Prompt: "Generate a real photo image used as a blog post cover: [title], photography, realistic, sigma 85mm f/1.4"  
      - Image size: 1024x1024  
      - Style: Natural  
      - Quality: HD  
      - Credentials: OpenAI API credentials.  
    - Inputs: Title from "Add draft to WP".  
    - Outputs: Passes image binary data to "Upload image".  
    - Edge Cases:  
      - OpenAI image generation quota exceeded.  
      - Image generation latency or failure.  

  - **Upload image**  
    - Type: HTTP Request  
    - Role: Uploads generated image to WordPress media endpoint.  
    - Configuration:  
      - URL: WordPress REST API media endpoint (e.g., https://URL/wp-json/wp/v2/media)  
      - Method: POST  
      - Content-Type: binary data  
      - Header: Content-Disposition with filename "copertina-[postID].jpg"  
      - Authentication: WordPress API credentials  
      - Input data field: binary image data from "Generate image"  
    - Inputs: Image binary from "Generate image".  
    - Outputs: Passes uploaded media ID to "Set image".  
    - Edge Cases:  
      - Authentication failure.  
      - Upload size limits.  
      - API errors or timeouts.  

  - **Set image**  
    - Type: HTTP Request  
    - Role: Associates the uploaded image as the featured image of the WordPress post.  
    - Configuration:  
      - URL: WordPress REST API posts endpoint with post ID  
      - Method: POST  
      - Query parameter: featured_media set to uploaded media ID  
      - Authentication: WordPress API credentials  
    - Inputs: Media ID from "Upload image" and post ID from "Add draft to WP".  
    - Outputs: Passes control to "Update Sheet".  
    - Edge Cases:  
      - API update failure.  
      - Incorrect media ID or post ID.  

  - **Sticky Note2**  
    - Content: "Upload the generated image to Wordpress media and then associate it with the newly created article"  

---

#### 2.5 SEO Meta Tag Optimization

- **Overview:**  
  Uses an AI SEO expert model (OpenRouter) to analyze the published draft and generate optimized meta title and meta description tags.

- **Nodes Involved:**  
  - Update Sheet (Google Sheets)  
  - SEO Expert (LangChain chain LLM)  
  - OpenRouter Chat Model (AI model)  
  - Structured Output Parser (Output parser)  
  - Set metatag (HTTP Request)  
  - Sticky Note3, Sticky Note4 (comments)

- **Node Details:**  

  - **Update Sheet**  
    - Type: Google Sheets  
    - Role: Updates the Google Sheet with the WordPress post URL, title, ID, and current date.  
    - Configuration:  
      - Matches row by "row_number" from "Get context".  
      - Updates columns: URL, DATA (current date), TITLE, ID POST.  
      - Uses Google Sheets OAuth2 credentials.  
    - Inputs: Post details from "Add draft to WP" and "Set image".  
    - Outputs: Passes data to "SEO Expert".  
    - Edge Cases:  
      - Google Sheets API errors.  
      - Row matching failure.  

  - **SEO Expert**  
    - Type: LangChain chain LLM  
    - Role: Generates meta title and meta description based on post content, title, and excerpt.  
    - Configuration:  
      - Text input includes title, content, and excerpt from WordPress post.  
      - Detailed instructions for meta tag requirements, analysis process, optimization strategy, output format, validation checklist, and best practices.  
      - Output parser enabled for structured JSON with "metatitle" and "metadescription".  
    - Inputs: Post data from "Update Sheet".  
    - Outputs: Passes structured meta tags to "Set metatag".  
    - Edge Cases:  
      - AI model errors or incomplete output.  
      - Output parsing failures.  

  - **OpenRouter Chat Model**  
    - Type: LangChain OpenRouter model  
    - Role: Provides the AI model backend for "SEO Expert".  
    - Configuration:  
      - Model: google/gemini-2.0-flash-exp:free  
      - Credentials: OpenRouter API credentials.  
    - Inputs: Receives prompt from "SEO Expert".  
    - Outputs: Returns AI response to "SEO Expert".  
    - Edge Cases:  
      - API rate limits or downtime.  

  - **Structured Output Parser**  
    - Type: LangChain output parser  
    - Role: Parses AI output into structured JSON with "metatitle" and "metadescription" fields.  
    - Configuration: JSON schema defining required string fields.  
    - Inputs: AI raw output from "OpenRouter Chat Model".  
    - Outputs: Parsed JSON to "SEO Expert".  
    - Edge Cases:  
      - Parsing errors if AI output is malformed.  

  - **Set metatag**  
    - Type: HTTP Request  
    - Role: Updates WordPress post meta fields (_yoast_wpseo_title and _yoast_wpseo_metadesc) with generated meta tags.  
    - Configuration:  
      - URL: WordPress REST API posts endpoint with post ID  
      - Method: PUT  
      - JSON body with meta fields populated from parsed AI output.  
      - Authentication: HTTP Basic Auth with WordPress credentials.  
      - Headers: Content-Type application/json  
    - Inputs: Meta tags from "SEO Expert".  
    - Outputs: Passes control to "Finish work".  
    - Edge Cases:  
      - Authentication failure.  
      - API update errors.  

  - **Sticky Note3**  
    - Content: "The SEO expert analyzes the created article and generates the appropriate meta title and meta description"  

  - **Sticky Note4**  
    - Content: "The generated metadata is associated with the post"  

---

#### 2.6 Metadata Application & Sheet Update

- **Overview:**  
  Finalizes the workflow by updating the Google Sheet with the generated meta title and meta description.

- **Nodes Involved:**  
  - Finish work (Google Sheets)  

- **Node Details:**  

  - **Finish work**  
    - Type: Google Sheets  
    - Role: Updates the Google Sheet row with the generated meta title and meta description.  
    - Configuration:  
      - Matches row by "row_number" from "Update Sheet".  
      - Updates columns: METATITLE, METADESCRIPTION.  
      - Uses Google Sheets OAuth2 credentials.  
    - Inputs: Meta tags from "SEO Expert".  
    - Outputs: Workflow ends here.  
    - Edge Cases:  
      - Google Sheets API errors.  
      - Row matching failure.  

---

### 3. Summary Table

| Node Name                 | Node Type                      | Functional Role                                  | Input Node(s)                 | Output Node(s)                | Sticky Note                                                                                         |
|---------------------------|--------------------------------|-------------------------------------------------|------------------------------|------------------------------|---------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                | Starts the workflow manually                     | None                         | Get context                  |                                                                                                   |
| Get context               | Google Sheets                  | Fetches blog post context from Google Sheets    | When clicking ‘Test workflow’ | Set context                  | Fetches the context of the article you want to generate via AI                                    |
| Set context               | Set                           | Assigns prompt variable for AI input             | Get context                  | Generate article             |                                                                                                   |
| Generate article          | OpenAI (LangChain)             | Generates SEO-friendly article content           | Set context                  | Generate title               |                                                                                                   |
| Generate title            | OpenAI (LangChain)             | Creates SEO-optimized title                       | Generate article             | Add draft to WP              | Create the draft post on Wordpress with the article text and the title that were previously generated |
| Add draft to WP           | WordPress                     | Creates draft post in WordPress                   | Generate title               | Generate image               | Create the draft post on Wordpress with the article text and the title that were previously generated |
| Generate image            | OpenAI (LangChain)             | Generates blog cover image                        | Add draft to WP              | Upload image                | Upload the generated image to Wordpress media and then associate it with the newly created article |
| Upload image              | HTTP Request                  | Uploads image to WordPress media library          | Generate image               | Set image                   | Upload the generated image to Wordpress media and then associate it with the newly created article |
| Set image                 | HTTP Request                  | Sets uploaded image as featured image on post    | Upload image                 | Update Sheet                | Upload the generated image to Wordpress media and then associate it with the newly created article |
| Update Sheet              | Google Sheets                  | Updates Google Sheet with post URL and details   | Set image                   | SEO Expert                  |                                                                                                   |
| SEO Expert               | LangChain chain LLM            | Generates optimized meta title and description   | Update Sheet                | Set metatag                 | The SEO expert analyzes the created article and generates the appropriate meta title and meta description |
| OpenRouter Chat Model     | LangChain OpenRouter model     | AI model backend for SEO Expert                   | SEO Expert (ai_languageModel) | SEO Expert (ai_outputParser) |                                                                                                   |
| Structured Output Parser  | LangChain output parser        | Parses AI output into structured meta tags       | OpenRouter Chat Model        | SEO Expert                  |                                                                                                   |
| Set metatag               | HTTP Request                  | Updates WordPress post meta tags                  | SEO Expert                  | Finish work                 | The generated metadata is associated with the post                                                |
| Finish work               | Google Sheets                  | Updates Google Sheet with meta tags               | Set metatag                 | None                        |                                                                                                   |
| Sticky Note               | Sticky Note                   | Documentation                                    | None                        | None                        | Fetches the context of the article you want to generate via AI                                    |
| Sticky Note1              | Sticky Note                   | Documentation                                    | None                        | None                        | Create the draft post on Wordpress with the article text and the title that were previously generated |
| Sticky Note2              | Sticky Note                   | Documentation                                    | None                        | None                        | Upload the generated image to Wordpress media and then associate it with the newly created article |
| Sticky Note3              | Sticky Note                   | Documentation                                    | None                        | None                        | The SEO expert analyzes the created article and generates the appropriate meta title and meta description |
| Sticky Note4              | Sticky Note                   | Documentation                                    | None                        | None                        | The generated metadata is associated with the post                                                |
| Sticky Note5              | Sticky Note                   | Documentation                                    | None                        | None                        | ## Optimize WordPress Blog Posts with AI\n\nThis is a powerful tool for automating the creation and optimization of blog posts, saving time and ensuring high-quality, SEO-friendly content for Wordpress with Yoast plugin. \n\n[Clone this Sheet](https://docs.google.com/spreadsheets/d/1WlmjnObleBuHRno_axjc-GjV7Wg9gCoIsOK1PD4TxGU/edit?usp=sharing) and in the "Prompt" column write the topic that will then be developed by the AI |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Start workflow manually.

2. **Add Google Sheets Node "Get context"**  
   - Operation: Read  
   - Document ID: Link to your Google Sheet containing blog post data.  
   - Sheet Name: Specify the sheet (e.g., "Foglio1").  
   - Filters: Set to lookup by "ID POST" column, returning the first matching row.  
   - Credentials: Configure Google Sheets OAuth2 credentials.

3. **Add Set Node "Set context"**  
   - Assign variable "prompt" with expression: `{{$json.PROMPT}}`  
   - Connect from "Get context".

4. **Add OpenAI Node "Generate article"**  
   - Model: DeepSeek-chat (or equivalent)  
   - Max tokens: 2048  
   - Prompt: Use detailed instructions to generate SEO-friendly article in HTML format, including intro, chapters, conclusion, and formatting constraints.  
   - Credentials: DeepSeek/OpenAI API credentials.  
   - Connect from "Set context".

5. **Add OpenAI Node "Generate title"**  
   - Model: DeepSeek-chat  
   - Max tokens: 2048  
   - Prompt: Generate SEO-optimized title (max 60 chars) using keywords from article content.  
   - Credentials: DeepSeek/OpenAI API credentials.  
   - Connect from "Generate article".

6. **Add WordPress Node "Add draft to WP"**  
   - Operation: Create post  
   - Title: Use output from "Generate title".  
   - Content: Use article content from "Generate article".  
   - Status: Draft  
   - Credentials: WordPress API credentials.  
   - Connect from "Generate title".

7. **Add OpenAI Node "Generate image"**  
   - Resource: Image generation  
   - Prompt: "Generate a real photo image used as a blog post cover: [title], photography, realistic, sigma 85mm f/1.4"  
   - Size: 1024x1024  
   - Style: Natural  
   - Quality: HD  
   - Credentials: OpenAI API credentials.  
   - Connect from "Add draft to WP".

8. **Add HTTP Request Node "Upload image"**  
   - Method: POST  
   - URL: `https://[your-wordpress-site]/wp-json/wp/v2/media`  
   - Content-Type: binary data  
   - Headers: `Content-Disposition: attachment; filename="copertina-[postID].jpg"` (replace [postID] dynamically)  
   - Authentication: WordPress API credentials  
   - Input: Binary image data from "Generate image".  
   - Connect from "Generate image".

9. **Add HTTP Request Node "Set image"**  
   - Method: POST  
   - URL: `https://[your-wordpress-site]/wp-json/wp/v2/posts/[postID]`  
   - Query parameter: `featured_media` set to uploaded media ID from "Upload image".  
   - Authentication: WordPress API credentials  
   - Connect from "Upload image".

10. **Add Google Sheets Node "Update Sheet"**  
    - Operation: Update row  
    - Document ID and Sheet Name: Same as "Get context".  
    - Matching column: "row_number" from "Get context".  
    - Columns to update: URL (post URL), DATA (current date), TITLE, ID POST.  
    - Credentials: Google Sheets OAuth2 credentials.  
    - Connect from "Set image".

11. **Add LangChain Chain LLM Node "SEO Expert"**  
    - Text input: Include post title, content, and excerpt from WordPress post.  
    - Instructions: Detailed SEO meta tag generation guidelines (meta title max 60 chars, meta description max 160 chars, keyword usage, call-to-action, etc.).  
    - Output parser enabled with JSON schema for "metatitle" and "metadescription".  
    - Credentials: OpenRouter API credentials.  
    - Connect from "Update Sheet".

12. **Add LangChain OpenRouter Model Node "OpenRouter Chat Model"**  
    - Model: google/gemini-2.0-flash-exp:free  
    - Credentials: OpenRouter API credentials.  
    - Connect as AI model backend for "SEO Expert".

13. **Add LangChain Output Parser Node "Structured Output Parser"**  
    - Schema: JSON object with "metatitle" and "metadescription" strings.  
    - Connect as output parser for "SEO Expert".

14. **Add HTTP Request Node "Set metatag"**  
    - Method: PUT  
    - URL: `https://[your-wordpress-site]/wp-json/wp/v2/posts/[postID]`  
    - Body (JSON):  
      ```json
      {
        "meta": {
          "_yoast_wpseo_title": "{{ $json.output.metatitle }}",
          "_yoast_wpseo_metadesc": "{{ $json.output.metadescription }}"
        }
      }
      ```  
    - Headers: Content-Type application/json  
    - Authentication: HTTP Basic Auth with WordPress credentials  
    - Connect from "SEO Expert".

15. **Add Google Sheets Node "Finish work"**  
    - Operation: Update row  
    - Document ID and Sheet Name: Same as above.  
    - Matching column: "row_number" from "Update Sheet".  
    - Columns to update: METATITLE, METADESCRIPTION.  
    - Credentials: Google Sheets OAuth2 credentials.  
    - Connect from "Set metatag".

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                         | Context or Link                                                                                                           |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| This workflow automates high-quality, SEO-friendly WordPress blog post creation using AI and Google Sheets integration, optimized for Yoast SEO plugin.                                                                                              | Workflow purpose                                                                                                          |
| Clone the Google Sheet used in this workflow here: [Clone this Sheet](https://docs.google.com/spreadsheets/d/1WlmjnObleBuHRno_axjc-GjV7Wg9gCoIsOK1PD4TxGU/edit?usp=sharing)                                                                           | Google Sheets template                                                                                                    |
| Ensure WordPress REST API is accessible and credentials have appropriate permissions for post creation, media upload, and meta field updates.                                                                                                        | WordPress integration requirement                                                                                         |
| AI models used: DeepSeek for content and title generation; OpenRouter (Google Gemini 2.0) for SEO meta tag optimization; OpenAI for image generation.                                                                                                | AI model usage                                                                                                            |
| Meta tags generated comply with SEO best practices: character limits, keyword placement, call-to-action, and mobile snippet optimization.                                                                                                           | SEO optimization details                                                                                                  |
| Potential failure points include API authentication errors, rate limits, AI generation timeouts, and data mismatches in Google Sheets. Proper error handling and credential validation are recommended before production use.                         | Error and edge case considerations                                                                                        |
| Optional enhancements: add internal linking, keyword density analysis, or social media sharing nodes to extend SEO capabilities.                                                                                                                    | Suggested workflow customization                                                                                          |

---

This documentation provides a detailed, structured reference for understanding, reproducing, and maintaining the "Automate SEO-Optimized WordPress Posts with AI & Google Sheets" workflow. It covers all nodes, their configurations, and integration points to ensure smooth operation and easy modification.