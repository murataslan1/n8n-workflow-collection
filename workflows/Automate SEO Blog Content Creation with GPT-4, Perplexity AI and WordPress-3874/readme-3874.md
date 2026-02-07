Automate SEO Blog Content Creation with GPT-4, Perplexity AI and WordPress

https://n8nworkflows.xyz/workflows/automate-seo-blog-content-creation-with-gpt-4--perplexity-ai-and-wordpress-3874


# Automate SEO Blog Content Creation with GPT-4, Perplexity AI and WordPress

### 1. Workflow Overview

This workflow automates the entire process of creating, optimizing, and publishing SEO-friendly blog content on WordPress using AI technologies and integrations. It is designed for content creators, marketing teams, and agencies aiming to produce high-quality, long-form blog posts regularly without manual intervention.

The workflow is logically divided into the following blocks:

- **1.1 Trigger and Idea Generation:** Initiates the workflow manually or on a schedule, generates a new blog post idea, and checks for topic uniqueness.
- **1.2 Brand Brief and AI Content Creation:** Retrieves brand guidelines, performs AI-assisted content generation including research, article writing, and category refinement.
- **1.3 Content Cleanup and Formatting:** Cleans and formats the generated HTML content and links to prepare it for WordPress.
- **1.4 Image Acquisition and Upload:** Generates an image search prompt, retrieves a relevant image from Pexels, downloads it, and uploads it to WordPress as a featured image.
- **1.5 Publishing and Logging:** Publishes the blog post to WordPress, creates an excerpt, converts content to Markdown, and logs publication details in Google Sheets.
- **1.6 Auxiliary and Integration Nodes:** Includes memory buffers, sub-workflow triggers, and Notion integration for extended functionality.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger and Idea Generation

**Overview:**  
This block starts the workflow either manually or on a schedule, generates a new blog post idea using AI, and verifies if the topic has already been published by checking Google Sheets.

**Nodes Involved:**  
- Schedule Trigger  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Idea creator (AI Agent)  
- Check History (Google Sheets Tool)  
- Simple Memory (Memory Buffer)  
- get brand brief (Sub-workflow call)  
- Structured Output Parser (AI Output Parser)  
- OpenAI 4.1 mini3 (AI Language Model)  

**Node Details:**  

- **Schedule Trigger**  
  - Type: Trigger  
  - Role: Automatically starts the workflow on a defined schedule.  
  - Configuration: Standard scheduling parameters (e.g., daily).  
  - Inputs: None  
  - Outputs: Connects to Idea creator.  
  - Edge Cases: Scheduling misconfiguration may cause missed runs.

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual initiation for testing or on-demand runs.  
  - Inputs: None  
  - Outputs: Connects to Idea creator.  

- **Idea creator**  
  - Type: LangChain Agent (AI Agent)  
  - Role: Generates new blog post ideas using AI, incorporating brand brief and memory context.  
  - Configuration: Uses OpenAI 4.1 mini3 as language model, receives inputs from brand brief and memory buffer.  
  - Inputs: AI memory (Simple Memory), AI tool (brand brief), AI output parser (Structured Output Parser), AI language model (OpenAI 4.1 mini3).  
  - Outputs: Connects to Category rewrite.  
  - Edge Cases: AI response failures, parsing errors, or empty topic generation.

- **Check History**  
  - Type: Google Sheets Tool  
  - Role: Checks if the generated blog topic already exists in the publication log to avoid duplicates.  
  - Configuration: Connects to a Google Sheet with published topics.  
  - Inputs: Receives topic from Idea creator.  
  - Outputs: Connects back to Idea creator for further processing if topic is unique.  
  - Edge Cases: Google Sheets API errors, incorrect spreadsheet ID or tab name.

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window  
  - Role: Maintains conversational or contextual memory for AI agent to improve idea generation.  
  - Inputs: Connected to Idea creator as AI memory.  
  - Outputs: Provides memory context to Idea creator.  

- **get brand brief**  
  - Type: LangChain Tool Workflow (Sub-workflow)  
  - Role: Retrieves brand-specific writing style, tone, and blog goals to guide AI content generation.  
  - Inputs: Connected as AI tool input to Idea creator.  
  - Outputs: Provides brand brief data to Idea creator.  
  - Edge Cases: Sub-workflow errors or missing workflow ID configuration.

- **Structured Output Parser**  
  - Type: LangChain Output Parser Structured  
  - Role: Parses AI-generated structured data from Idea creator for downstream processing.  
  - Inputs: AI output from Idea creator.  
  - Outputs: Feeds parsed data back to Idea creator.  

- **OpenAI 4.1 mini3**  
  - Type: LangChain Language Model (OpenAI GPT-4)  
  - Role: Provides AI language model capabilities for Idea creator.  
  - Inputs: Receives prompts from Idea creator.  
  - Outputs: Returns AI-generated content to Idea creator.  
  - Edge Cases: API rate limits, authentication errors.

---

#### 1.2 Brand Brief and AI Content Creation

**Overview:**  
This block refines the blog post category, performs research using Perplexity AI, and generates the full blog article content based on brand guidelines.

**Nodes Involved:**  
- Category rewrite (Code)  
- Perplexity Research (HTTP Request)  
- Cleanup Links (Set)  
- Content writer (LangChain Chain LLM)  
- OpenAI 4.1 mini (LangChain Language Model)  
- Cleanup HTML (Set)  
- Wordpress (WordPress node)  

**Node Details:**  

- **Category rewrite**  
  - Type: Code Node  
  - Role: Processes and refines the blog post category for SEO and WordPress taxonomy.  
  - Inputs: Receives category data from Idea creator.  
  - Outputs: Connects to Perplexity Research.  
  - Edge Cases: Code errors or unexpected input formats.

- **Perplexity Research**  
  - Type: HTTP Request  
  - Role: Queries Perplexity AI API to gather supporting research and context for the blog topic.  
  - Configuration: HTTP request with API key and query parameters.  
  - Inputs: Receives refined category and topic.  
  - Outputs: Connects to Cleanup Links.  
  - Edge Cases: API failures, rate limits, or malformed requests.

- **Cleanup Links**  
  - Type: Set Node  
  - Role: Cleans and formats links in the research data for proper HTML embedding.  
  - Inputs: Data from Perplexity Research.  
  - Outputs: Connects to Content writer.  

- **Content writer**  
  - Type: LangChain Chain LLM  
  - Role: Generates the full blog post content (2000–2500 words) in clean HTML, incorporating brand brief and research.  
  - Configuration: Uses OpenAI 4.1 mini as language model.  
  - Inputs: Receives cleaned research and brand guidelines.  
  - Outputs: Connects to Cleanup HTML.  
  - Edge Cases: AI generation errors, incomplete content.

- **OpenAI 4.1 mini**  
  - Type: LangChain Language Model  
  - Role: Provides language model for Content writer.  
  - Inputs: Receives prompts from Content writer node.  
  - Outputs: Returns generated content.  

- **Cleanup HTML**  
  - Type: Set Node  
  - Role: Final cleanup and formatting of the generated HTML content before publishing.  
  - Inputs: Content from Content writer.  
  - Outputs: Connects to Wordpress node.  

- **Wordpress**  
  - Type: WordPress Node  
  - Role: Prepares the content for publishing on WordPress, including title, meta description, and category.  
  - Inputs: Cleaned HTML content.  
  - Outputs: Connects to Write prompt to search image.  
  - Edge Cases: WordPress API authentication or endpoint errors.

---

#### 1.3 Content Cleanup and Formatting

**Overview:**  
This block creates a blog post excerpt, converts content to Markdown, and prepares data for logging and publishing.

**Nodes Involved:**  
- Excerpt creator (LangChain Chain LLM)  
- OpenAI 4.1 mini2 (LangChain Language Model)  
- WordPress excerpt add (HTTP Request)  
- Markdown (Markdown Node)  
- Update list of blog post (Google Sheets)  
- Update base post (Google Sheets)  

**Node Details:**  

- **Excerpt creator**  
  - Type: LangChain Chain LLM  
  - Role: Generates a concise excerpt or summary for the blog post.  
  - Configuration: Uses OpenAI 4.1 mini2 as language model.  
  - Inputs: Receives full blog content.  
  - Outputs: Connects to WordPress excerpt add.  
  - Edge Cases: AI generation errors.

- **OpenAI 4.1 mini2**  
  - Type: LangChain Language Model  
  - Role: Provides language model for Excerpt creator.  
  - Inputs: Receives prompts from Excerpt creator.  
  - Outputs: Returns excerpt text.  

- **WordPress excerpt add**  
  - Type: HTTP Request  
  - Role: Adds the generated excerpt to the WordPress post via API.  
  - Inputs: Excerpt text.  
  - Outputs: Connects to Markdown node.  
  - Edge Cases: API errors, authentication issues.

- **Markdown**  
  - Type: Markdown Node  
  - Role: Converts content to Markdown format for logging or other uses.  
  - Inputs: Data from WordPress excerpt add.  
  - Outputs: Connects to Update list of blog post.  

- **Update list of blog post**  
  - Type: Google Sheets Node  
  - Role: Logs the published blog post details (title, link, date) into a Google Sheet for archiving.  
  - Inputs: Markdown content and metadata.  
  - Outputs: Connects to Update base post.  
  - Edge Cases: Google Sheets API errors.

- **Update base post**  
  - Type: Google Sheets Node  
  - Role: Updates base post data or summary in Google Sheets.  
  - Inputs: Data from Update list of blog post.  
  - Outputs: None.  

---

#### 1.4 Image Acquisition and Upload

**Overview:**  
This block generates an AI prompt to search for a relevant image, fetches the image from Pexels, downloads it, uploads it to WordPress, and sets it as the featured image.

**Nodes Involved:**  
- Write prompt to search image (LangChain Chain LLM)  
- OpenAI 4.1 mini1 (LangChain Language Model)  
- Get Image from Pexcel (HTTP Request)  
- Download Image (HTTP Request)  
- Upload Image to Wordpress (HTTP Request)  
- Set Image on Wordpress Post (HTTP Request)  

**Node Details:**  

- **Write prompt to search image**  
  - Type: LangChain Chain LLM  
  - Role: Creates a search prompt for Pexels based on blog content or topic.  
  - Configuration: Uses OpenAI 4.1 mini1 as language model.  
  - Inputs: Data from Wordpress node.  
  - Outputs: Connects to Get Image from Pexcel.  
  - Edge Cases: AI prompt generation errors.

- **OpenAI 4.1 mini1**  
  - Type: LangChain Language Model  
  - Role: Provides language model for image search prompt generation.  
  - Inputs: Receives prompt from Write prompt to search image.  
  - Outputs: Returns search prompt.  

- **Get Image from Pexcel**  
  - Type: HTTP Request  
  - Role: Queries Pexels API to retrieve images matching the search prompt.  
  - Inputs: Search prompt.  
  - Outputs: Connects to Download Image.  
  - Edge Cases: API key issues, rate limits, no image found.

- **Download Image**  
  - Type: HTTP Request  
  - Role: Downloads the selected image from Pexels.  
  - Inputs: Image URL from Pexels response.  
  - Outputs: Connects to Upload Image to Wordpress.  
  - Edge Cases: Download failures, invalid URLs.

- **Upload Image to Wordpress**  
  - Type: HTTP Request  
  - Role: Uploads the downloaded image to WordPress media library.  
  - Inputs: Image binary data.  
  - Outputs: Connects to Set Image on Wordpress Post.  
  - Edge Cases: WordPress API upload errors, authentication.

- **Set Image on Wordpress Post**  
  - Type: HTTP Request  
  - Role: Sets the uploaded image as the featured image for the blog post.  
  - Inputs: Media ID from upload response.  
  - Outputs: Connects to Excerpt creator.  
  - Edge Cases: API errors, invalid media ID.

---

#### 1.5 Publishing and Logging

**Overview:**  
Finalizes the blog post publication on WordPress and logs all relevant data into Google Sheets for record-keeping.

**Nodes Involved:**  
- Wordpress (WordPress Node)  
- Update list of blog post (Google Sheets)  
- Update base post (Google Sheets)  

**Node Details:**  

- **Wordpress**  
  - Type: WordPress Node  
  - Role: Publishes the blog post with all content, metadata, and featured image.  
  - Inputs: Cleaned HTML content and metadata.  
  - Outputs: Connects to Write prompt to search image and logging nodes.  
  - Edge Cases: API errors, authentication failures.

- **Update list of blog post**  
  - Type: Google Sheets Node  
  - Role: Logs the blog post details (title, URL, publish date) into a Google Sheet.  
  - Inputs: Post metadata.  
  - Outputs: Connects to Update base post.  

- **Update base post**  
  - Type: Google Sheets Node  
  - Role: Updates or maintains a base record of posts in Google Sheets.  
  - Inputs: Data from Update list of blog post.  
  - Outputs: None.  

---

#### 1.6 Auxiliary and Integration Nodes

**Overview:**  
Additional nodes for extended functionality, including Notion integration, aggregation, and sub-workflow execution.

**Nodes Involved:**  
- When Executed by Another Workflow (Execute Workflow Trigger)  
- Notion (Notion Node)  
- Aggregate (Aggregate Node)  
- Edit Fields (Set Node)  

**Node Details:**  

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Allows this workflow to be triggered by other workflows.  
  - Inputs: External workflow trigger.  
  - Outputs: Connects to Notion node.  

- **Notion**  
  - Type: Notion Node  
  - Role: Integrates with Notion for content or data management.  
  - Inputs: Triggered by Execute Workflow Trigger.  
  - Outputs: Connects to Aggregate node.  

- **Aggregate**  
  - Type: Aggregate Node  
  - Role: Aggregates data from Notion or other sources.  
  - Inputs: Data from Notion node.  
  - Outputs: Connects to Edit Fields.  

- **Edit Fields**  
  - Type: Set Node  
  - Role: Edits or formats fields for downstream use.  
  - Inputs: Aggregated data.  
  - Outputs: None.  

---

### 3. Summary Table

| Node Name                   | Node Type                          | Functional Role                                | Input Node(s)                  | Output Node(s)                      | Sticky Note |
|-----------------------------|----------------------------------|-----------------------------------------------|--------------------------------|------------------------------------|-------------|
| Schedule Trigger             | Schedule Trigger                 | Starts workflow on schedule                    | None                           | Idea creator                       |             |
| When clicking ‘Test workflow’| Manual Trigger                  | Manual workflow start                          | None                           | Idea creator                       |             |
| Idea creator                | LangChain Agent                  | Generates blog post idea                        | Check History, Simple Memory, get brand brief, Structured Output Parser, OpenAI 4.1 mini3 | Category rewrite                  |             |
| Check History               | Google Sheets Tool               | Checks if topic already published              | Idea creator                   | Idea creator                      |             |
| Simple Memory              | LangChain Memory Buffer          | Provides memory context                         | None                           | Idea creator                      |             |
| get brand brief            | LangChain Tool Workflow          | Retrieves brand guidelines                      | None                           | Idea creator                      |             |
| Structured Output Parser   | LangChain Output Parser          | Parses AI output                                | Idea creator                   | Idea creator                      |             |
| OpenAI 4.1 mini3           | LangChain Language Model         | AI model for idea generation                    | Idea creator                   | Idea creator                      |             |
| Category rewrite           | Code Node                       | Refines blog category                           | Idea creator                   | Perplexity Research               |             |
| Perplexity Research        | HTTP Request                    | Gathers research data                           | Category rewrite               | Cleanup Links                    |             |
| Cleanup Links              | Set Node                       | Cleans research links                           | Perplexity Research            | Content writer                   |             |
| Content writer             | LangChain Chain LLM             | Generates full blog article                     | Cleanup Links                  | Cleanup HTML                    |             |
| OpenAI 4.1 mini            | LangChain Language Model         | AI model for content writing                    | Content writer                 | Content writer                   |             |
| Cleanup HTML               | Set Node                       | Cleans and formats HTML                         | Content writer                 | Wordpress                      |             |
| Wordpress                  | WordPress Node                  | Prepares and publishes post                     | Cleanup HTML                  | Write prompt to search image, logging nodes |             |
| Write prompt to search image| LangChain Chain LLM             | Creates image search prompt                      | Wordpress                     | Get Image from Pexcel           |             |
| OpenAI 4.1 mini1           | LangChain Language Model         | AI model for image prompt                        | Write prompt to search image   | Write prompt to search image    |             |
| Get Image from Pexcel      | HTTP Request                    | Retrieves images from Pexels                     | Write prompt to search image   | Download Image                  |             |
| Download Image             | HTTP Request                    | Downloads image                                  | Get Image from Pexcel          | Upload Image to Wordpress       |             |
| Upload Image to Wordpress  | HTTP Request                    | Uploads image to WordPress media library         | Download Image                | Set Image on Wordpress Post     |             |
| Set Image on Wordpress Post| HTTP Request                    | Sets featured image on post                      | Upload Image to Wordpress      | Excerpt creator                |             |
| Excerpt creator            | LangChain Chain LLM             | Generates post excerpt                           | Set Image on Wordpress Post    | WordPress excerpt add           |             |
| OpenAI 4.1 mini2           | LangChain Language Model         | AI model for excerpt generation                  | Excerpt creator               | Excerpt creator                |             |
| WordPress excerpt add      | HTTP Request                    | Adds excerpt to WordPress post                   | Excerpt creator               | Markdown                      |             |
| Markdown                   | Markdown Node                  | Converts content to Markdown                      | WordPress excerpt add          | Update list of blog post       |             |
| Update list of blog post   | Google Sheets Node             | Logs published post details                       | Markdown                     | Update base post               |             |
| Update base post           | Google Sheets Node             | Updates base post record                          | Update list of blog post       | None                          |             |
| When Executed by Another Workflow | Execute Workflow Trigger    | Allows external workflow trigger                  | None                         | Notion                       |             |
| Notion                     | Notion Node                   | Integrates with Notion                            | When Executed by Another Workflow | Aggregate                  |             |
| Aggregate                  | Aggregate Node                | Aggregates data                                  | Notion                       | Edit Fields                  |             |
| Edit Fields                | Set Node                     | Edits and formats fields                          | Aggregate                    | None                          |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a **Schedule Trigger** node configured to run at desired intervals (e.g., daily).  
   - Add a **Manual Trigger** node named "When clicking ‘Test workflow’" for manual execution.

2. **Set Up Idea Generation:**  
   - Add a **LangChain Agent** node named "Idea creator".  
   - Connect both triggers to this node.  
   - Configure it to use OpenAI GPT-4 (OpenAI 4.1 mini3) as the language model.  
   - Connect a **LangChain Memory Buffer Window** node ("Simple Memory") as AI memory input.  
   - Add a **LangChain Tool Workflow** node ("get brand brief") to provide brand guidelines; configure with your brand brief sub-workflow ID.  
   - Add a **LangChain Output Parser Structured** node ("Structured Output Parser") to parse AI output.  
   - Connect these nodes appropriately to "Idea creator".

3. **Check Topic Uniqueness:**  
   - Add a **Google Sheets Tool** node ("Check History").  
   - Configure it with your Google Sheets spreadsheet ID and tab containing published topics.  
   - Connect "Idea creator" output to "Check History" input, and "Check History" output back to "Idea creator" to loop if topic exists.

4. **Category Refinement and Research:**  
   - Add a **Code** node ("Category rewrite") to process the blog category.  
   - Connect "Idea creator" output to this node.  
   - Add an **HTTP Request** node ("Perplexity Research") configured to call Perplexity AI API with the refined category/topic.  
   - Connect "Category rewrite" to "Perplexity Research".

5. **Clean Research Links:**  
   - Add a **Set** node ("Cleanup Links") to clean and format links from research data.  
   - Connect "Perplexity Research" to "Cleanup Links".

6. **Content Generation:**  
   - Add a **LangChain Chain LLM** node ("Content writer") configured to generate a 2000–2500 word blog post in HTML.  
   - Use OpenAI GPT-4 (OpenAI 4.1 mini) as the language model.  
   - Connect "Cleanup Links" to "Content writer".

7. **HTML Cleanup:**  
   - Add a **Set** node ("Cleanup HTML") to finalize HTML formatting.  
   - Connect "Content writer" to "Cleanup HTML".

8. **WordPress Preparation:**  
   - Add a **WordPress** node ("Wordpress") configured with your WordPress credentials and site URL.  
   - Connect "Cleanup HTML" to "Wordpress".

9. **Image Search Prompt:**  
   - Add a **LangChain Chain LLM** node ("Write prompt to search image") to generate an image search prompt.  
   - Use OpenAI GPT-4 (OpenAI 4.1 mini1) as the language model.  
   - Connect "Wordpress" to this node.

10. **Image Retrieval:**  
    - Add an **HTTP Request** node ("Get Image from Pexcel") configured to query Pexels API with the search prompt.  
    - Connect "Write prompt to search image" to this node.

11. **Download Image:**  
    - Add an **HTTP Request** node ("Download Image") to download the selected image.  
    - Connect "Get Image from Pexcel" to "Download Image".

12. **Upload Image to WordPress:**  
    - Add an **HTTP Request** node ("Upload Image to Wordpress") to upload the image to WordPress media library.  
    - Connect "Download Image" to this node.

13. **Set Featured Image:**  
    - Add an **HTTP Request** node ("Set Image on Wordpress Post") to assign the uploaded image as the featured image.  
    - Connect "Upload Image to Wordpress" to this node.

14. **Excerpt Creation:**  
    - Add a **LangChain Chain LLM** node ("Excerpt creator") to generate a post excerpt.  
    - Use OpenAI GPT-4 (OpenAI 4.1 mini2) as the language model.  
    - Connect "Set Image on Wordpress Post" to "Excerpt creator".

15. **Add Excerpt to WordPress:**  
    - Add an **HTTP Request** node ("WordPress excerpt add") to add the excerpt via WordPress API.  
    - Connect "Excerpt creator" to this node.

16. **Convert to Markdown:**  
    - Add a **Markdown** node to convert content to Markdown format.  
    - Connect "WordPress excerpt add" to this node.

17. **Logging in Google Sheets:**  
    - Add two **Google Sheets** nodes:  
      - "Update list of blog post" to log post details.  
      - "Update base post" to update base records.  
    - Connect "Markdown" to "Update list of blog post", then to "Update base post".  
    - Configure both with your spreadsheet ID and tab names.

18. **Auxiliary Integration (Optional):**  
    - Add an **Execute Workflow Trigger** node ("When Executed by Another Workflow") to allow external triggers.  
    - Add a **Notion** node for Notion integration.  
    - Add **Aggregate** and **Set** nodes ("Edit Fields") for data processing.  
    - Connect these nodes as per your integration needs.

19. **Credentials Setup:**  
    - Configure credentials for:  
      - OpenAI (GPT-4)  
      - WordPress (OAuth2 or Application Password)  
      - Google Sheets (OAuth2)  
      - Pexels API (API Key)  

20. **Final Connections and Testing:**  
    - Ensure all nodes are connected as per the described flow.  
    - Replace placeholder URLs and IDs with your actual data.  
    - Test the workflow manually using the manual trigger.  
    - Schedule the workflow as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                         |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Replace placeholder URLs in HTTP Request nodes with your actual WordPress site URL.             | Setup instructions                                                                                     |
| Insert your Google Sheets spreadsheet ID and tab names in Google Sheets nodes.                   | Setup instructions                                                                                     |
| Insert your brand brief sub-workflow ID in the "get brand brief" node.                           | Setup instructions                                                                                     |
| Personalize AI prompts with your blog name, company name, and call-to-action for tailored voice.| Setup instructions                                                                                     |
| The workflow can be triggered manually or scheduled for full automation.                         | Workflow usage                                                                                         |
| Uses OpenAI GPT-4 for AI content generation and Perplexity AI for research data.                 | Technology stack                                                                                       |
| Pexels API is used for fetching featured images.                                                | Image sourcing                                                                                        |
| Google Sheets is used for logging and archiving published blog posts.                            | Data logging                                                                                          |
| WordPress API is used for publishing posts and uploading media.                                 | CMS integration                                                                                       |
| For more details on n8n LangChain nodes, visit: https://docs.n8n.io/integrations/builtin/nodes/langchain/ | Documentation link                                                                                     |

---

This document provides a detailed, structured reference for understanding, reproducing, and modifying the "Automate SEO Blog Content Creation with GPT-4, Perplexity AI and WordPress" workflow. It covers all nodes, their roles, configurations, and integration points to ensure smooth operation and extensibility.