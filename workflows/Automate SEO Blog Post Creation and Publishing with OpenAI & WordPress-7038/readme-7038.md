Automate SEO Blog Post Creation and Publishing with OpenAI & WordPress

https://n8nworkflows.xyz/workflows/automate-seo-blog-post-creation-and-publishing-with-openai---wordpress-7038


# Automate SEO Blog Post Creation and Publishing with OpenAI & WordPress

### 1. Workflow Overview

This workflow automates the creation and publishing of SEO-optimized blog posts on a WordPress site using OpenAI’s language and image generation capabilities integrated into n8n. It targets content creators and marketers who want to automate blog topic ideation, content generation, metadata creation, and media handling, streamlining the entire blogging pipeline from ideation to publishing.

The workflow is logically divided into these main blocks:

- **1.1 Trigger and Input Reception:** Receives scheduling events or Telegram commands to start the automation.
- **1.2 Topic Ideation and Title Generation:** Uses AI to choose blog topics and generate SEO-friendly titles.
- **1.3 Content and Metadata Generation:** Generates the article content and metadata (like description, keywords) using OpenAI-powered language models.
- **1.4 Image Creation and Upload:** Generates a featured image via OpenAI, uploads it to WordPress, and assigns it as the post’s featured image.
- **1.5 Post Processing and Publishing:** Retrieves WordPress categories, maps categories, formats final post data, and publishes the post on WordPress.
- **1.6 Conditional Flow and Validation:** Includes conditional checks and category validation to ensure content quality and proper classification.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger and Input Reception

- **Overview:** This block initiates the workflow either on a schedule or via a Telegram bot command. It filters incoming Telegram messages to decide whether to proceed.
- **Nodes Involved:**  
  - Schedule Trigger  
  - Telegram Trigger  
  - If (conditional check)

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Automatically starts the workflow at defined intervals.  
    - Config: Default scheduling (not detailed in JSON).  
    - Inputs: None  
    - Outputs: Connects to "Topic Chooser and Title Maker" node.  
    - Edge Cases: Missed triggers if n8n is offline; cron misconfiguration.

  - **Telegram Trigger**  
    - Type: Telegram Trigger  
    - Role: Receives commands/messages from Telegram.  
    - Config: Uses a webhook with ID "a9b697dc-5b4e-418c-83ed-54966ce7ea34".  
    - Inputs: Telegram messages  
    - Outputs: Connects to "If" node for filtering.  
    - Edge Cases: Telegram API downtime, invalid webhook URL, malformed messages.

  - **If**  
    - Type: Conditional node  
    - Role: Filters Telegram messages to decide if the workflow continues.  
    - Config: Conditions not explicitly detailed but presumably checking message content or command.  
    - Inputs: Telegram Trigger  
    - Outputs: True branch connects to "Topic Chooser and Title Maker".  
    - Edge Cases: Misconfigured conditions causing false positives/negatives.

#### 2.2 Topic Ideation and Title Generation

- **Overview:** This block uses an AI language chain to select a blog topic and generate an SEO-optimized title.
- **Nodes Involved:**  
  - Topic Chooser and Title Maker  
  - Parser  
  - Metadata Generator

- **Node Details:**

  - **Topic Chooser and Title Maker**  
    - Type: Langchain LLM Chain  
    - Role: Generates blog topic ideas and titles using AI.  
    - Config: Uses a Langchain chain with AI output parsed by the "Parser" node.  
    - Inputs: From "If" node (triggered by schedule or Telegram).  
    - Outputs: Feeds into "Basic LLM Chain".  
    - Expressions: Uses AI prompt templates (not detailed).  
    - Edge Cases: API errors, output parsing failures.

  - **Parser**  
    - Type: Langchain Output Parser (Structured)  
    - Role: Parses the AI output from the "Topic Chooser and Title Maker" into structured data (title, topic).  
    - Inputs: AI output from "Topic Chooser and Title Maker".  
    - Outputs: Back to "Topic Chooser and Title Maker" as parsed data.  
    - Edge Cases: Parsing errors, unexpected output formats.

  - **Metadata Generator**  
    - Type: Langchain Chat Open Router  
    - Role: Generates metadata such as SEO description, keywords, or tags to enrich the blog post.  
    - Inputs: Connected AI language model from "Topic Chooser and Title Maker".  
    - Outputs: Linked to "Topic Chooser and Title Maker" AI language model input.  
    - Edge Cases: API errors, incomplete metadata.

#### 2.3 Content and Metadata Generation

- **Overview:** Generates the main article content and prepares associated metadata for the post.
- **Nodes Involved:**  
  - Article Generator  
  - Basic LLM Chain  
  - Get (WordPress API node)

- **Node Details:**

  - **Article Generator**  
    - Type: Langchain LM Chat OpenAI  
    - Role: Uses OpenAI chat model to generate the full blog article based on the selected topic and title.  
    - Inputs: Linked to "Basic LLM Chain" AI language model input.  
    - Outputs: Main output to "Basic LLM Chain" for further processing.  
    - Edge Cases: Rate limits, incomplete content, API failures.

  - **Basic LLM Chain**  
    - Type: Langchain Chain LLM  
    - Role: Processes AI outputs, likely coordinating between article generation and WordPress API calls.  
    - Inputs: From "Topic Chooser and Title Maker" and "Article Generator".  
    - Outputs: Connects to "Get" node for WordPress interaction.  
    - Edge Cases: Coordination failures, API errors.

  - **Get (WordPress)**  
    - Type: WordPress node (read operation)  
    - Role: Retrieves data from WordPress, possibly categories or existing posts.  
    - Inputs: From "Basic LLM Chain".  
    - Outputs: To "OpenAI - Generate Image".  
    - Edge Cases: WordPress API errors, permissions issues.

#### 2.4 Image Creation and Upload

- **Overview:** Generates an AI image for the blog post, uploads it to WordPress media library, and sets it as the featured image.
- **Nodes Involved:**  
  - OpenAI - Generate Image  
  - Upload Image to WP  
  - Wordpress - Set Featured Image

- **Node Details:**

  - **OpenAI - Generate Image**  
    - Type: Langchain OpenAI node  
    - Role: Generates an image based on the blog topic or other prompts.  
    - Inputs: From "Get" (WordPress node providing context).  
    - Outputs: To "Upload Image to WP".  
    - Edge Cases: API image generation failures, quota limits.

  - **Upload Image to WP**  
    - Type: HTTP Request  
    - Role: Uploads generated image to WordPress media library via REST API.  
    - Inputs: Image data from "OpenAI - Generate Image".  
    - Outputs: To "Wordpress - Set Featured Image".  
    - Config: Uses WordPress HTTP endpoints, requires authentication credentials.  
    - Edge Cases: Auth failures, upload errors, file size limits.

  - **Wordpress - Set Featured Image**  
    - Type: HTTP Request  
    - Role: Sets the uploaded image as the featured image of the post.  
    - Inputs: Image upload response from "Upload Image to WP".  
    - Outputs: None (end of chain).  
    - Edge Cases: Post ID mismatches, permission issues.

#### 2.5 Post Processing and Publishing

- **Overview:** Finalizes post data including categories, formats the data, and publishes the post on WordPress.
- **Nodes Involved:**  
  - Get Categories (HTTP Request)  
  - Set Valid Category  
  - Category Mapping (Code node)  
  - 📦 Format Final Data  
  - 🚀 Publish (HTTP Request)

- **Node Details:**

  - **Get Categories**  
    - Type: HTTP Request  
    - Role: Retrieves all categories from WordPress to validate or assign one to the post.  
    - Inputs: None explicitly, likely triggered after content generation.  
    - Outputs: To "Set Valid Category".  
    - Edge Cases: API downtime, large category lists.

  - **Set Valid Category**  
    - Type: Set node  
    - Role: Sets or validates the category for the post based on retrieved categories and mapping.  
    - Inputs: From "Get Categories".  
    - Outputs: To "Category Mapping".  
    - Edge Cases: No valid category found, mapping errors.

  - **Category Mapping**  
    - Type: Code node  
    - Role: Runs JavaScript logic to map AI-generated or user-input categories to existing WordPress categories.  
    - Inputs: From "Set Valid Category".  
    - Outputs: To "📦 Format Final Data".  
    - Edge Cases: Logic errors, undefined categories.

  - **📦 Format Final Data**  
    - Type: Set node  
    - Role: Prepares the final post data payload, including title, content, metadata, categories, and featured image ID.  
    - Inputs: From "Category Mapping".  
    - Outputs: To "🚀 Publish".  
    - Edge Cases: Data formatting errors.

  - **🚀 Publish**  
    - Type: HTTP Request  
    - Role: Sends a POST request to WordPress to create and publish the new blog post.  
    - Inputs: From "📦 Format Final Data".  
    - Outputs: None (workflow end).  
    - Config: Retries on failure enabled to handle transient errors.  
    - Edge Cases: Authentication failure, publishing errors, HTTP timeouts.

#### 2.6 Conditional Flow and Validation (Supporting)

- **Overview:** Handles decision making to control workflow execution and ensures valid category assignment.
- **Nodes Involved:**  
  - If (described above)  
  - Set Valid Category  
  - Category Mapping

- **Node Details:** See previous blocks for "If", "Set Valid Category" and "Category Mapping".

---

### 3. Summary Table

| Node Name                  | Node Type                             | Functional Role                              | Input Node(s)                      | Output Node(s)                   | Sticky Note                   |
|----------------------------|-------------------------------------|----------------------------------------------|----------------------------------|---------------------------------|------------------------------|
| Schedule Trigger            | Schedule Trigger                    | Starts workflow on schedule                   | None                             | Topic Chooser and Title Maker    |                              |
| Telegram Trigger            | Telegram Trigger                   | Starts workflow on Telegram message           | None                             | If                              |                              |
| If                         | If                                | Filters Telegram messages to proceed          | Telegram Trigger                 | Topic Chooser and Title Maker    |                              |
| Topic Chooser and Title Maker | Langchain Chain LLM               | Generates blog topic and title                 | If, Schedule Trigger, Parser     | Basic LLM Chain                 |                              |
| Parser                     | Langchain Output Parser Structured | Parses AI output to structured data           | Topic Chooser and Title Maker    | Topic Chooser and Title Maker    |                              |
| Metadata Generator          | Langchain Chat Open Router         | Generates post metadata                         | Topic Chooser and Title Maker    | Topic Chooser and Title Maker    |                              |
| Article Generator           | Langchain LM Chat OpenAI           | Generates blog article content                  | Basic LLM Chain                  | Basic LLM Chain                 |                              |
| Basic LLM Chain             | Langchain Chain LLM                | Coordinates AI output and WordPress interaction | Topic Chooser and Title Maker, Article Generator | Get (WordPress)                 |                              |
| Get                        | WordPress                         | Retrieves WordPress data (e.g. categories)     | Basic LLM Chain                  | OpenAI - Generate Image         |                              |
| OpenAI - Generate Image     | Langchain OpenAI                   | Generates featured image                        | Get                            | Upload Image to WP              |                              |
| Upload Image to WP          | HTTP Request                      | Uploads image to WordPress media library       | OpenAI - Generate Image          | Wordpress - Set Featured Image  |                              |
| Wordpress - Set Featured Image | HTTP Request                    | Assigns uploaded image as post featured image   | Upload Image to WP               | None                          |                              |
| Get Categories             | HTTP Request                      | Fetches WordPress categories                    | None (triggered later)           | Set Valid Category             |                              |
| Set Valid Category          | Set                              | Validates and sets category for post            | Get Categories                  | Category Mapping               |                              |
| Category Mapping            | Code                             | Maps AI categories to WordPress categories      | Set Valid Category              | 📦 Format Final Data           |                              |
| 📦 Format Final Data         | Set                              | Formats final post data for publishing          | Category Mapping                | 🚀 Publish                    |                              |
| 🚀 Publish                 | HTTP Request                      | Publishes the post to WordPress                  | 📦 Format Final Data            | None                          | Retry enabled for fail cases |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a **Schedule Trigger** node with your desired schedule to start automated runs.  
   - Add a **Telegram Trigger** node configured with your Telegram bot credentials and webhook URL.

2. **Add Conditional Check (If node):**  
   - Connect Telegram Trigger output to an **If** node.  
   - Configure its condition to filter for specific Telegram commands or messages to trigger the workflow.

3. **Add Topic Ideation Node:**  
   - Add a **Langchain Chain LLM** node named "Topic Chooser and Title Maker".  
   - Configure prompts to generate a blog topic and SEO-friendly title.  
   - Connect **Schedule Trigger** and **If** node (true branch) to this node.

4. **Add Output Parser:**  
   - Add a **Langchain Output Parser Structured** node called "Parser".  
   - Configure to parse AI outputs to structured JSON (title, topic).  
   - Connect "Topic Chooser and Title Maker" AI output to this parser node, then feed parsed data back into "Topic Chooser and Title Maker" for next steps.

5. **Add Metadata Generator:**  
   - Add a **Langchain Chat Open Router** node named "Metadata Generator".  
   - Configure to generate metadata such as descriptions, tags, keywords based on the topic/title.  
   - Link its AI language model input/output to "Topic Chooser and Title Maker" accordingly.

6. **Add Article Generator:**  
   - Add a **Langchain LM Chat OpenAI** node named "Article Generator".  
   - Configure prompt templates for generating full article content.  
   - Connect its output to feed into "Basic LLM Chain".

7. **Add Basic LLM Chain:**  
   - Add another **Langchain Chain LLM** node named "Basic LLM Chain".  
   - Configure to combine AI outputs and prepare data for WordPress interactions.  
   - Connect "Topic Chooser and Title Maker" and "Article Generator" outputs to this node.

8. **Add WordPress Get Node:**  
   - Add a **WordPress** node configured to perform GET requests to retrieve existing data (e.g., categories).  
   - Connect "Basic LLM Chain" output to this node.

9. **Add OpenAI Image Generation:**  
   - Add a **Langchain OpenAI** node named "OpenAI - Generate Image".  
   - Configure with prompts to generate featured images based on blog content.  
   - Connect the WordPress "Get" node output to this node.

10. **Add HTTP Request to Upload Image:**  
    - Add an **HTTP Request** node named "Upload Image to WP".  
    - Configure it to upload images to WordPress media endpoint with proper authentication (OAuth2 or Basic Auth).  
    - Connect "OpenAI - Generate Image" output here.

11. **Set Featured Image via HTTP Request:**  
    - Add an **HTTP Request** node named "Wordpress - Set Featured Image".  
    - Configure to assign the uploaded image as the post’s featured image using WordPress REST API.  
    - Connect "Upload Image to WP" output.

12. **Fetch WordPress Categories:**  
    - Add an **HTTP Request** node named "Get Categories".  
    - Configure to GET categories from WordPress REST API.  
    - This node triggers post content finalization.

13. **Validate Category (Set Node):**  
    - Add a **Set** node named "Set Valid Category".  
    - Use it to select or validate the post category from the retrieved list.

14. **Category Mapping (Code Node):**  
    - Add a **Code** node named "Category Mapping".  
    - Write JavaScript to map AI-generated categories to WordPress categories.

15. **Format Final Post Data (Set Node):**  
    - Add a **Set** node named "📦 Format Final Data".  
    - Assemble post title, content, metadata, categories, featured image ID into the final payload.

16. **Publish Post (HTTP Request):**  
    - Add an **HTTP Request** node named "🚀 Publish".  
    - Configure it to POST the new blog post to WordPress via REST API with authentication.  
    - Enable retry on failure for robustness.

17. **Connect all nodes following the sequence above**, ensuring proper data flow.  
18. **Set credentials** for OpenAI (API key), WordPress (OAuth2 or Basic Auth), and Telegram bot.  
19. **Test each block individually** to ensure API calls succeed and data passes correctly.  
20. **Deploy workflow** for scheduled or on-demand blog post creation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                       | Context or Link                                                       |
|-----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| The workflow leverages Langchain nodes in n8n for AI prompt chaining and parsing, enabling modular AI interactions.               | n8n official Langchain docs                                          |
| Retry on fail is enabled on the WordPress publish node to improve reliability in case of transient network or API errors.        | Best practice for API integrations                                   |
| Telegram Trigger uses a webhook mechanism; ensure your n8n instance is publicly accessible or use n8n cloud for webhook routing.  | Telegram Bot API webhook setup                                       |
| WordPress REST API credentials need proper permissions to create posts, upload media, and modify post metadata.                   | WordPress developer REST API documentation                           |
| Image generation via OpenAI may consume significant quota; monitor usage to avoid unexpected costs.                               | OpenAI Image API pricing                                             |
| API rate limits and timeouts should be handled gracefully; consider adding error handling or delay/retry logic if high volume.    | General API integration best practices                               |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and publicly accessible.