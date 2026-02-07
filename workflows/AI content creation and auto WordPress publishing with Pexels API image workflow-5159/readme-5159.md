AI content creation and auto WordPress publishing with Pexels API image workflow

https://n8nworkflows.xyz/workflows/ai-content-creation-and-auto-wordpress-publishing-with-pexels-api-image-workflow-5159


# AI content creation and auto WordPress publishing with Pexels API image workflow

### 1. Workflow Overview

This workflow automates the entire process of generating SEO-optimized blog content and publishing it on a WordPress site, enhanced by relevant images sourced from the Pexels API. It targets content creators and marketers who want to streamline content ideation, article generation, image selection, and publishing without manual intervention.

The workflow is structured into two main functional branches triggered by a user form:

**1.1 Idea Generation and Addition to Google Sheets**  
- Users input a topic via a form.  
- The workflow generates 5 SEO-friendly blog topics using Google Gemini AI.  
- These topics are parsed and split, then appended as new ideas to a Google Sheet for later content creation.  
- Users can choose to add more ideas or end the process.

**1.2 Content Generation and Auto-Publishing to WordPress**  
- The workflow fetches unprocessed blog ideas from the Google Sheet.  
- For each idea, it generates a detailed SEO article using Google Gemini AI.  
- Simultaneously, it generates an image keyword to find a suitable graphic via the Pexels API.  
- The image is downloaded, uploaded to WordPress media, then set as the featured image of the newly created post.  
- The Google Sheet is updated to mark the idea as processed with post details.

Supporting the above are logical blocks for form interaction, AI processing (topic and article generation), image search and handling, WordPress publishing, and Google Sheets integration.

---

### 2. Block-by-Block Analysis

#### 2.1 User Interaction & Task Selection

- **Overview:**  
  This block handles the initial user interaction through a form that lets the user select whether to generate content or add new blog ideas.

- **Nodes Involved:**  
  - Form Trigger: Select Action  
  - If Generate Content

- **Node Details:**

  - **Form Trigger: Select Action**  
    - Type: Form Trigger (webhook)  
    - Configuration: Presents a dropdown with two options: "Generate Content" or "Add Ideas".  
    - Output: Triggers downstream nodes based on user selection.  
    - Inputs: External user form submission.  
    - Outputs: Connects to "If Generate Content" node.

  - **If Generate Content**  
    - Type: If (conditional logic)  
    - Configuration: Checks if user selected "Generate Content".  
    - Logic: Routes to content generation branch if true; otherwise to ideas addition branch.  
    - Inputs: From form trigger.  
    - Outputs: Two branches — one to "Fetch Unprocessed Ideas" for content generation, one to "Form: Enter Topic for Ideas" for adding ideas.

- **Edge Cases:**  
  - Invalid or empty form submission.  
  - Case sensitivity is loose, but unexpected values could cause no route.  
  - Network or webhook failures.

---

#### 2.2 Idea Generation and Addition to Google Sheets

- **Overview:**  
  Facilitates topic ideation by allowing users to add general topics, generating multiple blog topics via AI, parsing them, and appending them to a Google Sheet.

- **Nodes Involved:**  
  - Form: Enter Topic for Ideas  
  - Gemini Model for Topics  
  - Generate Blog Topics AI  
  - Parse AI Topic Output  
  - Split Topics  
  - Add Ideas to Sheet  
  - Form: Add More Topics?  
  - If Add More Topics  
  - Form: End Idea Generation

- **Node Details:**

  - **Form: Enter Topic for Ideas**  
    - Type: Form (webhook)  
    - Configuration: Single text field "Topic" for user input.  
    - Output: Sends topic to AI topic generation.

  - **Gemini Model for Topics**  
    - Type: Google Gemini Language Model  
    - Configuration: Uses Gemini 1.5 Flash Latest model to generate blog topics.  
    - Input: User-entered topic.  
    - Output: AI-generated raw response for blog topics.

  - **Generate Blog Topics AI**  
    - Type: LangChain Agent (AI prompt executor)  
    - Configuration: Custom prompt to generate 5 SEO-friendly blog topics in JSON format without markdown.  
    - Output: Structured JSON topics (example schema provided).

  - **Parse AI Topic Output**  
    - Type: Output Parser Structured  
    - Configuration: Parses AI JSON response into structured data for n8n.  
    - Handles: Invalid or malformed AI responses.

  - **Split Topics**  
    - Type: Split Out  
    - Configuration: Splits parsed topics into individual items to process independently.

  - **Add Ideas to Sheet**  
    - Type: Google Sheets (append operation)  
    - Configuration: Appends each topic as a new row with "Generated" flag set to "no". Columns: Title (blank), Prompt (topic), Generated (no).  
    - Input: Individual parsed topics.

  - **Form: Add More Topics?**  
    - Type: Form (webhook)  
    - Configuration: Dropdown asking user if they want to add more topics ("NEXT" or "END").  
    - Description dynamically lists current topics added.

  - **If Add More Topics**  
    - Type: If (conditional)  
    - Configuration: Checks user's choice to continue adding topics or end.  
    - Routes: Back to "Form: Enter Topic for Ideas" or to "Form: End Idea Generation".

  - **Form: End Idea Generation**  
    - Type: Form (completion)  
    - Configuration: Displays a completion message listing final topics generated.

- **Edge Cases:**  
  - AI model returning unexpected or malformed JSON.  
  - Google Sheets append failures due to permission or API limits.  
  - User abandoning form input mid-process.  
  - Race conditions if multiple users submit simultaneously.

---

#### 2.3 Content Generation and WordPress Publishing

- **Overview:**  
  Automates fetching unprocessed blog ideas, generating SEO-rich articles, finding relevant images, publishing posts on WordPress, and updating the Google Sheet accordingly.

- **Nodes Involved:**  
  - Fetch Unprocessed Ideas  
  - Set Prompt  
  - Gemini Model for Article  
  - Generate Article AI  
  - Gemini Model for Image Keyword  
  - Generate Image Keyword AI  
  - Search Pexels Image  
  - Create WordPress Post  
  - Download Pexels Image  
  - Upload Image  
  - Set Featured Image  
  - Update Google Sheet  
  - Form: End Post Generation

- **Node Details:**

  - **Fetch Unprocessed Ideas**  
    - Type: Google Sheets (read)  
    - Configuration: Reads rows where "Generated" = "no" to find ideas needing articles.  
    - Output: Rows with unprocessed blog idea data.

  - **Set Prompt**  
    - Type: Set  
    - Configuration: Sets "prompt" variable equal to the idea prompt for AI input.

  - **Gemini Model for Article**  
    - Type: Google Gemini Language Model  
    - Configuration: Uses Gemini 1.5 Flash Latest model for article generation.

  - **Generate Article AI**  
    - Type: LangChain Agent  
    - Configuration: Detailed prompt instructing AI to write an SEO article with introduction, 4-5 chapters, conclusion, and HTML formatting (limited tags).  
    - Input: Prompt from idea.  
    - Output: HTML-formatted article text.

  - **Gemini Model for Image Keyword**  
    - Type: Google Gemini Language Model  
    - Configuration: Same Gemini model, but focused on generating a concise keyword/expression for image search.

  - **Generate Image Keyword AI**  
    - Type: LangChain Agent  
    - Configuration: Prompt to produce a single expression string suited for Pexels image search.

  - **Search Pexels Image**  
    - Type: HTTP Request  
    - Configuration: Calls Pexels API's search endpoint with generated keyword, requesting 1 image.  
    - Headers: Authorization with Pexels API key.  
    - Output: JSON with photo metadata.

  - **Create WordPress Post**  
    - Type: WordPress node  
    - Configuration: Creates a published post with title from the prompt, content from AI article, and photo credit attribution from Pexels data.  
    - Output: WordPress post ID.

  - **Download Pexels Image**  
    - Type: HTTP Request (binary response)  
    - Configuration: Downloads the image file from Pexels URL.

  - **Upload Image**  
    - Type: HTTP Request  
    - Configuration: Uploads downloaded image to WordPress media library.  
    - Headers: Content-Disposition with filename referencing post ID.  
    - Authentication: WordPress credentials.  
    - Error Handling: Continues workflow on error.

  - **Set Featured Image**  
    - Type: HTTP Request  
    - Configuration: Sets the uploaded image as the featured media of the WordPress post using REST API.  
    - Authentication: WordPress credentials.  
    - Error Handling: Continues workflow on error.

  - **Update Google Sheet**  
    - Type: Google Sheets (update)  
    - Configuration: Updates the row corresponding to the processed idea by setting "Generated" to "yes", recording the post ID, title, and current date.

  - **Form: End Post Generation**  
    - Type: Form (completion)  
    - Configuration: Shows a completion message listing the titles of posts generated in this run.

- **Edge Cases:**  
  - API rate limits or failures on Google Sheets, WordPress, or Pexels API.  
  - AI model failures or nonsensical output.  
  - Image download or upload failures.  
  - Mismatched post IDs or inconsistent sheet updates.  
  - Authentication errors in WordPress API nodes.  
  - Missing or invalid Pexels API key or WordPress URL.

---

#### 2.4 Supporting and Instructional Nodes

- **Sticky Notes:**  
  Provide user instructions, explanations of blocks, and reminders about credential configurations and API key placement.

- **Workflow Instructions Sticky Note:**  
  Detailed setup, prerequisites, and a summary of how the workflow operates.

- **API Settings Note Sticky Note:**  
  Specifies where to input WordPress site URL and Pexels API key in respective nodes.

---

### 3. Summary Table

| Node Name                    | Node Type                         | Functional Role                                  | Input Node(s)                      | Output Node(s)                       | Sticky Note                                                                                              |
|------------------------------|----------------------------------|-------------------------------------------------|----------------------------------|------------------------------------|--------------------------------------------------------------------------------------------------------|
| Form Trigger: Select Action   | Form Trigger (webhook)            | User selects task: Generate Content or Add Ideas| -                                | If Generate Content                 |                                                                                                        |
| If Generate Content           | If                               | Routes based on task selection                   | Form Trigger: Select Action       | Fetch Unprocessed Ideas, Form: Enter Topic for Ideas |                                                                                                        |
| Fetch Unprocessed Ideas       | Google Sheets                    | Fetches blog ideas not yet generated             | If Generate Content               | Set Prompt                        |                                                                                                        |
| Set Prompt                   | Set                              | Sets prompt variable for article generation      | Fetch Unprocessed Ideas           | Generate Article AI                 |                                                                                                        |
| Gemini Model for Article      | LangChain Google Gemini LM       | AI model for article content generation           | Generate Article AI (behind scenes) | Generate Article AI               |                                                                                                        |
| Generate Article AI           | LangChain Agent                  | Generates detailed SEO article HTML               | Set Prompt                      | Generate Image Keyword AI           |                                                                                                        |
| Gemini Model for Image Keyword| LangChain Google Gemini LM       | AI model for image keyword generation             | Generate Image Keyword AI (behind scenes) | Generate Image Keyword AI       |                                                                                                        |
| Generate Image Keyword AI     | LangChain Agent                  | Generates keyword/expression for Pexels search   | Generate Article AI               | Search Pexels Image                |                                                                                                        |
| Search Pexels Image           | HTTP Request                    | Searches Pexels API for an image                   | Generate Image Keyword AI         | Create WordPress Post              | API Settings Note: Add Pexels API Key in Authorization header                                         |
| Create WordPress Post         | WordPress Node                  | Creates and publishes WordPress post with content| Search Pexels Image               | Download Pexels Image              | API Settings Note: Replace <YOUR_WORDPRESS_URL> with your site's URL                                   |
| Download Pexels Image         | HTTP Request                    | Downloads image file from Pexels                   | Create WordPress Post             | Upload Image                      |                                                                                                        |
| Upload Image                 | HTTP Request                    | Uploads image to WordPress media library           | Download Pexels Image             | Set Featured Image                | API Settings Note: Replace <YOUR_WORDPRESS_URL> with your site's URL                                   |
| Set Featured Image           | HTTP Request                    | Sets uploaded image as featured image for post    | Upload Image                     | Update Google Sheet               | API Settings Note: Replace <YOUR_WORDPRESS_URL> with your site's URL                                   |
| Update Google Sheet          | Google Sheets                   | Marks idea as generated and adds post details     | Set Featured Image               | Form: End Post Generation         |                                                                                                        |
| Form: End Post Generation    | Form (completion)               | Shows completion message listing generated posts  | Update Google Sheet              | -                               |                                                                                                        |
| Form: Enter Topic for Ideas  | Form (webhook)                  | User inputs general topic for idea generation      | If Generate Content (else branch)| Generate Blog Topics AI            |                                                                                                        |
| Gemini Model for Topics      | LangChain Google Gemini LM       | AI model to generate blog topics                   | Generate Blog Topics AI (behind scenes) | Generate Blog Topics AI         |                                                                                                        |
| Generate Blog Topics AI      | LangChain Agent                  | Generates 5 SEO-friendly blog topics in JSON      | Form: Enter Topic for Ideas       | Split Topics                    |                                                                                                        |
| Parse AI Topic Output        | Output Parser Structured        | Parses AI JSON output into structured data         | Generate Blog Topics AI           | Split Topics                    |                                                                                                        |
| Split Topics                | Split Out                      | Splits list of topics into individual entries       | Parse AI Topic Output             | Add Ideas to Sheet              |                                                                                                        |
| Add Ideas to Sheet          | Google Sheets                  | Appends new blog ideas to Google Sheet              | Split Topics                     | Form: Add More Topics?          | Sticky Note2, Sticky Note3: Add to Sheet and Add More? explanation                                   |
| Form: Add More Topics?      | Form (webhook)                 | Asks user whether to add more topics or end         | Add Ideas to Sheet               | If Add More Topics             | Sticky Note3: Add More? Select in the form to add another 5 topics                                   |
| If Add More Topics          | If                            | Checks user choice to continue or end idea adding   | Form: Add More Topics?           | Form: Enter Topic for Ideas, Form: End Idea Generation | Sticky Note4: Start Over or End                                                                      |
| Form: End Idea Generation   | Form (completion)              | Completion message listing generated topics         | If Add More Topics (end branch)  | -                             |                                                                                                        |
| Sticky Note1                | Sticky Note                   | Explains "Generate Topics" block                      | -                                | -                              | ## Generate Topics What topics should be generated?                                                  |
| Sticky Note2                | Sticky Note                   | Explains adding topics to sheet                        | -                                | -                              | ## Add to Sheet Add as topics for which posts have not yet been generated.                           |
| Sticky Note3                | Sticky Note                   | Explains the "Add More?" form                          | -                                | -                              | ## Add More? Select in the form to add another 5 topics.                                            |
| Sticky Note4                | Sticky Note                   | Explains the process to start over or end              | -                                | -                              | ## Start Over or End                                                                                |
| API Settings Note           | Sticky Note                   | Details API key and URL configuration instructions   | -                                | -                              | ## WordPress & Pexels API Settings Edit settings by entering your WordPress data and Pexels API key. |
| Workflow Instructions       | Sticky Note                   | Full workflow setup and operation instructions        | -                                | -                              | # Workflow Instructions Full detailed instructions and prerequisites                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger: Select Action**  
   - Type: Form Trigger  
   - Webhook path: `wpcontent`  
   - Form title: "Create Content"  
   - Form fields: Dropdown labeled "Task" with options "Generate Content" and "Add Ideas"  
   - Output: Connect to "If Generate Content" node

2. **Add If Generate Content**  
   - Type: If  
   - Condition: Check if `Task` contains "Generate Content" (case-insensitive)  
   - True branch: Connect to "Fetch Unprocessed Ideas"  
   - False branch: Connect to "Form: Enter Topic for Ideas"

3. **Add Fetch Unprocessed Ideas**  
   - Type: Google Sheets (Read)  
   - Document ID: [Your Google Sheet ID]  
   - Sheet Name: `gid=0` or your sheet name  
   - Filter: Only rows where `Generated` equals `no`  
   - Output: Connect to "Set Prompt"

4. **Add Set Prompt**  
   - Type: Set  
   - Assign variable `prompt` to `={{ $json.Prompt }}` (from fetched sheet row)  
   - Output: Connect to "Generate Article AI"

5. **Add Gemini Model for Article**  
   - Type: LangChain Google Gemini LM  
   - Model Name: `models/gemini-1.5-flash-latest`  
   - Connect as language model for "Generate Article AI"

6. **Add Generate Article AI**  
   - Type: LangChain Agent  
   - Prompt: Provide detailed instructions to write an SEO article based on `prompt` variable in HTML format (see node configuration above)  
   - Output: Connect to "Generate Image Keyword AI"

7. **Add Gemini Model for Image Keyword**  
   - Type: LangChain Google Gemini LM  
   - Model Name: `models/gemini-1.5-flash-latest`  
   - Connect as language model for "Generate Image Keyword AI"

8. **Add Generate Image Keyword AI**  
   - Type: LangChain Agent  
   - Prompt: Generate a concise expression keyword for Pexels image search based on the prompt  
   - Output: Connect to "Search Pexels Image"

9. **Add Search Pexels Image**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.pexels.com/v1/search?query={{ encodeURIComponent($('Generate Image Keyword AI').item.json.output) }}&per_page=1`  
   - Headers: Authorization: `YOUR_PEXELS_API_KEY`  
   - Output: Connect to "Create WordPress Post"

10. **Add Create WordPress Post**  
    - Type: WordPress node  
    - Title: `={{ $('Fetch Unprocessed Ideas').item.json.Prompt }}`  
    - Content: AI-generated article + photo credit formatted with HTML  
    - Status: Publish  
    - Output: Connect to "Download Pexels Image"

11. **Add Download Pexels Image**  
    - Type: HTTP Request  
    - Method: GET  
    - URL: `={{ $('Search Pexels Image').item.json.photos[0].src.large2x }}`  
    - Response format: File (binary)  
    - Output: Connect to "Upload Image"

12. **Add Upload Image**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: `https://<YOUR_WORDPRESS_URL>/wp-json/wp/v2/media`  
    - Headers: `Content-Disposition: attachment; filename="cover-{{ $('Create WordPress Post').item.json.id }}.jpg"`  
    - Content type: binaryData  
    - Authentication: WordPress OAuth2 or API credentials  
    - Input field: binary data from downloaded image  
    - Output: Connect to "Set Featured Image"

13. **Add Set Featured Image**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: `https://<YOUR_WORDPRESS_URL>/wp-json/wp/v2/posts/{{ $('Create WordPress Post').item.json.id }}`  
    - Query Parameter: `featured_media={{ $json.id }}` (ID from uploaded media)  
    - Authentication: WordPress OAuth2 or API credentials  
    - Output: Connect to "Update Google Sheet"

14. **Add Update Google Sheet**  
    - Type: Google Sheets (Update)  
    - Document ID & Sheet Name: same as in Fetch node  
    - Matching column: `row_number` from fetched idea  
    - Update columns:  
      - Date: current date (`{{ $now.format('dd/LL/yyyy') }}`)  
      - Title: post title  
      - Post ID: WordPress post ID  
      - Generated: "yes"  
    - Output: Connect to "Form: End Post Generation"

15. **Add Form: End Post Generation**  
    - Type: Form (completion)  
    - Completion message: List titles of generated posts  
    - Output: End

16. **Add Form: Enter Topic for Ideas**  
    - Type: Form (webhook)  
    - Field: Text input labeled "Topic"  
    - Output: Connect to "Generate Blog Topics AI"

17. **Add Gemini Model for Topics**  
    - Type: LangChain Google Gemini LM  
    - Model Name: `models/gemini-1.5-flash-latest`  
    - Connect as language model for "Generate Blog Topics AI"

18. **Add Generate Blog Topics AI**  
    - Type: LangChain Agent  
    - Prompt: Generate 5 SEO-friendly blog topics in JSON format based on input topic  
    - Output: Connect to "Parse AI Topic Output"

19. **Add Parse AI Topic Output**  
    - Type: Output Parser Structured  
    - JSON Schema Example: Array of objects with "Topic" string  
    - Output: Connect to "Split Topics"

20. **Add Split Topics**  
    - Type: Split Out  
    - Field to split: `output` (parsed topics list)  
    - Output: Connect to "Add Ideas to Sheet"

21. **Add Add Ideas to Sheet**  
    - Type: Google Sheets (append)  
    - Document ID & Sheet Name: same sheet  
    - Append columns:  
      - Title: blank  
      - Prompt: topic string  
      - Generated: "no"  
    - Output: Connect to "Form: Add More Topics?"

22. **Add Form: Add More Topics?**  
    - Type: Form (webhook)  
    - Dropdown: "What next?" with options "END" and "NEXT"  
    - Description: current added topics listed dynamically  
    - Output: Connect to "If Add More Topics"

23. **Add If Add More Topics**  
    - Type: If  
    - Condition: "What next?" equals "NEXT"  
    - True: connect back to "Form: Enter Topic for Ideas"  
    - False: connect to "Form: End Idea Generation"

24. **Add Form: End Idea Generation**  
    - Type: Form (completion)  
    - Completion message: Lists all generated topics  
    - Output: End

25. **Add Sticky Notes**  
    - Add relevant sticky notes at logical workflow positions for user guidance about generating topics, adding to sheet, adding more, API settings, and workflow instructions.

---

### 5. General Notes & Resources

| Note Content                                                                                                                    | Context or Link                                                                                                           |
|--------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| This workflow automates content creation, from idea generation to publishing on WordPress.                                     | Workflow Instructions sticky note                                                                                         |
| Prerequisites include Google Sheets with specific columns, WordPress REST API enabled, Google Gemini API key, and Pexels API key.| Workflow Instructions sticky note                                                                                         |
| Configure credentials in n8n for Google Sheets, WordPress, Google Gemini, and set Pexels API key in HTTP request headers.      | Workflow Instructions and API Settings Note sticky notes                                                                  |
| Replace `<YOUR_WORDPRESS_URL>` in WordPress API HTTP Request nodes with your actual WordPress site URL.                         | API Settings Note sticky note                                                                                             |
| Add your Pexels API key to the Authorization header in the "Search Pexels Image" HTTP Request node.                            | API Settings Note sticky note                                                                                             |
| Use Google Gemini 1.5 Flash Latest model for all AI generation nodes for best performance.                                     | All LangChain Gemini model nodes                                                                                          |
| The workflow handles errors gracefully on image upload/download nodes by continuing the workflow on failure.                   | Upload Image and Download Pexels Image nodes                                                                              |
| HTML content generated avoids markdown and code blocks to better fit WordPress post content formatting.                        | Generate Article AI node prompt instructions                                                                              |
| The Google Sheet must include columns: Date, Prompt, Title, Post ID, Generated, row_number (read-only)                         | Google Sheets nodes configuration                                                                                         |
| Blog topics generated by AI are output in JSON format and parsed to ensure robust processing.                                  | Parse AI Topic Output node                                                                                                |

---

**Disclaimer:**  
This document is derived exclusively from an n8n workflow. All integrations comply with content policies and legality. The workflow is intended for lawful and public data.