AI-Powered WordPress Blog Generation with Research, Image Creation & Auto Publishing

https://n8nworkflows.xyz/workflows/ai-powered-wordpress-blog-generation-with-research--image-creation---auto-publishing-11358


# AI-Powered WordPress Blog Generation with Research, Image Creation & Auto Publishing

### 1. Workflow Overview

This workflow automates the end-to-end generation and publishing of WordPress blog posts powered by AI. It targets content creators and marketers aiming to automatically produce researched, well-structured blog articles enriched with AI-generated images, then publish them directly on WordPress.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Captures user input from a form trigger and initializes API keys.
- **1.2 Research Phase**: Uses AI agents and external tools to gather relevant information and URLs.
- **1.3 Content Generation**: Uses AI to compose the blog post content based on research.
- **1.4 Image Creation & Management**: Generates image prompts, creates images, downloads, edits, and uploads them for inclusion.
- **1.5 HTML Assembly & Publishing**: Embeds images in HTML content, saves blog drafts, and publishes posts on WordPress.
- **1.6 Control & Looping**: Manages conditional flows, loops over batches of images, and waits to handle asynchronous or delayed processes.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block initiates the workflow by receiving user inputs (e.g., blog topic or keywords) via a form and sets the necessary API keys for subsequent operations.

**Nodes Involved:**  
- On form submission  
- API Keys

**Node Details:**

- **On form submission**  
  - Type: Form Trigger  
  - Role: Entry point; triggers workflow on form data submission.  
  - Configuration: Listens for inbound webhook/form data.  
  - Connections: Outputs to API Keys node.  
  - Edge Cases: Missing or malformed form data; webhook downtime.

- **API Keys**  
  - Type: Set  
  - Role: Defines environment variables/credentials (API keys) needed for AI and HTTP requests.  
  - Configuration: Sets key-value pairs for APIs (e.g., OpenAI, Google Gemini).  
  - Connections: Outputs to RSS Read3 node (starting research phase).  
  - Edge Cases: Invalid or expired API keys causing authentication failures.

---

#### 1.2 Research Phase

**Overview:**  
This block gathers information and relevant content by querying AI models and external data sources (RSS feeds, HTTP requests) to fuel blog writing.

**Nodes Involved:**  
- RSS Read3  
- Aggregate  
- Code in JavaScript  
- Researcher Agent  
- OpenAI Chat Model1  
- Google Gemini Chat Model1  
- Message a model in Perplexity  
- URL Scraper  
- tavily search  
- If (conditional node)

**Node Details:**

- **RSS Read3**  
  - Type: RSS Feed Read  
  - Role: Retrieves RSS feed content for topic-related information.  
  - Configuration: RSS feed URL(s) provided; fetches latest entries.  
  - Connections: Outputs to Aggregate.  
  - Edge Cases: Unavailable or invalid RSS feed URL; malformed feed data.

- **Aggregate**  
  - Type: Aggregate  
  - Role: Aggregates multiple RSS entries into a consolidated dataset.  
  - Connections: Outputs to Code in JavaScript.

- **Code in JavaScript**  
  - Type: Code  
  - Role: Processes and formats aggregated data for AI input.  
  - Connections: Outputs to Researcher Agent.

- **Researcher Agent**  
  - Type: LangChain Agent  
  - Role: AI agent that performs research tasks by querying multiple AI models and tools.  
  - Configuration: Linked with OpenAI Chat Model1, Google Gemini Chat Model1, Perplexity tool, and URL Scraper.  
  - Connections: Outputs to If node.

- **OpenAI Chat Model1**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Provides AI language model support for research agent.  
  - Connections: Linked as AI language model input for Researcher Agent.

- **Google Gemini Chat Model1**  
  - Type: LangChain Google Gemini Chat Model  
  - Role: Additional AI language model for research.  
  - Connections: Linked as AI language model input for Researcher Agent.

- **Message a model in Perplexity**  
  - Type: Perplexity Tool  
  - Role: External AI tool used for querying knowledge and facts.  
  - Connections: Linked as AI tool input for Researcher Agent.

- **URL Scraper**  
  - Type: HTTP Request Tool  
  - Role: Scrapes URLs for content extraction to support research.  
  - Connections: Linked as AI tool input for Researcher Agent and Writer Agent.

- **tavily search**  
  - Type: HTTP Request Tool  
  - Role: Performs external search queries for content gathering.  
  - Connections: Outputs to Researcher Agent or Writer Agent (indirect).  
  - Edge Cases: API rate limits, network timeouts.

- **If**  
  - Type: Conditional  
  - Role: Branches workflow based on Researcher Agent output (e.g., success or fail).  
  - Connections: Success path leads to Wait node, failure path to Writer Agent.

---

#### 1.3 Content Generation

**Overview:**  
Generates the blog post content using AI, parsing structured output, and saving drafts.

**Nodes Involved:**  
- Wait  
- Writer Agent  
- Google Gemini Chat Model2  
- Structured Output Parser  
- OpenAI Chat Model  
- save blog  
- Image Prompts Writer  
- Code  
- Loop Over Items

**Node Details:**

- **Wait**  
  - Type: Wait  
  - Role: Delays execution to manage rate limits or asynchronous processing.  
  - Connections: Outputs to Researcher Agent.

- **Writer Agent**  
  - Type: LangChain Agent  
  - Role: AI agent responsible for composing the blog text.  
  - Configuration: Uses OpenAI Chat Model and Google Gemini Chat Model2 and structured output parser.  
  - Connections: Outputs to If1 node.

- **Google Gemini Chat Model2**  
  - Type: LangChain Google Gemini Chat Model  
  - Role: AI model used for text generation.  
  - Connections: Feeds into Structured Output Parser.

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Role: Parses AI-generated structured content into usable format.  
  - Connections: Outputs to Writer Agent.

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Additional AI model input for Writer Agent.

- **save blog**  
  - Type: Data Table  
  - Role: Saves the generated blog content as draft or data entry.  
  - Connections: Outputs to Image Prompts Writer.

- **Image Prompts Writer**  
  - Type: LangChain Information Extractor  
  - Role: Extracts image prompt data from blog text for image generation.  
  - Connections: Outputs to Code node.

- **Code**  
  - Type: Code  
  - Role: Processes image prompts and prepares data for batch processing.  
  - Connections: Outputs to Loop Over Items.

- **Loop Over Items**  
  - Type: Split In Batches  
  - Role: Iterates over each image prompt to generate images.  
  - Connections: Outputs to all_images and image name writer nodes.

---

#### 1.4 Image Creation & Management

**Overview:**  
Generates images from prompts, downloads, edits (e.g., converts to PNG), uploads, and prepares final URLs.

**Nodes Involved:**  
- all_images  
- image name writer  
- Edit Fields (set image prompt and name)  
- nano banana  
- If2  
- download image  
- Edit Image (only for changing to png)  
- Upload image  
- final image url  
- Wait1  
- Wait3

**Node Details:**

- **all_images**  
  - Type: Code  
  - Role: Aggregates all generated images into a list for HTML embedding.  
  - Connections: Outputs to html_content.

- **image name writer**  
  - Type: LangChain OpenAI  
  - Role: Generates descriptive names for images.  
  - Connections: Outputs to Edit Fields.

- **Edit Fields (set image prompt and name)**  
  - Type: Set  
  - Role: Sets image-related fields (prompts and names) in the dataset.  
  - Connections: Outputs to nano banana.

- **nano banana**  
  - Type: HTTP Request  
  - Role: Likely an image generation API call.  
  - Connections: Outputs to If2.

- **If2**  
  - Type: Conditional  
  - Role: Checks if image generation/download was successful.  
  - True path: download image  
  - False path: Wait3.

- **download image**  
  - Type: HTTP Request  
  - Role: Downloads the generated image file.  
  - Connections: Outputs to Edit Image.

- **Edit Image (only for changing to png)**  
  - Type: Edit Image  
  - Role: Converts images to PNG format if needed.  
  - Connections: Outputs to Upload image.

- **Upload image**  
  - Type: HTTP Request  
  - Role: Uploads the edited image to hosting or WordPress media library.  
  - Retry: Enabled with wait between tries.  
  - Connections: Outputs to final image url.

- **final image url**  
  - Type: Set  
  - Role: Stores the final URL of uploaded image for embedding.  
  - Connections: Outputs to Wait1.

- **Wait1 / Wait3**  
  - Type: Wait  
  - Role: Manages delay between image processing steps to avoid rate limits or errors.  
  - Connections: Wait1 outputs to Loop Over Items; Wait3 outputs to Edit Fields.

---

#### 1.5 HTML Assembly & Publishing

**Overview:**  
Embeds images in blog HTML content, saves the final blog post, and publishes it to WordPress.

**Nodes Involved:**  
- html_content  
- imbed images in html  
- save blog1  
- Create a post  
- Set Image

**Node Details:**

- **html_content**  
  - Type: Set  
  - Role: Prepares or sets the HTML content of the blog post including placeholders for images.  
  - Connections: Outputs to imbed images in html.

- **imbed images in html**  
  - Type: Code  
  - Role: Inserts image URLs into HTML content, finalizing the blog post body.  
  - Connections: Outputs to save blog1.

- **save blog1**  
  - Type: Data Table  
  - Role: Saves the final blog post content, ready for publishing.  
  - Connections: Outputs to Create a post.

- **Create a post**  
  - Type: WordPress  
  - Role: Publishes the blog post on WordPress site with title, content, and featured image.  
  - Connections: Outputs to Set Image.

- **Set Image**  
  - Type: HTTP Request  
  - Role: Sets or confirms the featured image on WordPress post.  
  - Connections: End of publishing flow.

---

#### 1.6 Control & Looping

**Overview:**  
Manages workflow synchronization, conditional branching, and batch processing to handle multiple images and asynchronous operations.

**Nodes Involved:**  
- If1  
- If  
- Wait  
- Wait1  
- Wait2  
- Wait3  
- Loop Over Items

**Node Details:**

- **If, If1, If2**  
  - Type: Conditional nodes  
  - Role: Branch workflow based on success/failure or data conditions in research, content, and image generation phases.

- **Wait, Wait1, Wait2, Wait3**  
  - Type: Wait  
  - Role: Introduce delays to handle rate limits, asynchronous API calls, or to pace batch processing.

- **Loop Over Items**  
  - Type: Split In Batches  
  - Role: Iterates over arrays, mainly image prompts, to process one item at a time for image generation and upload.

---

### 3. Summary Table

| Node Name                      | Node Type                          | Functional Role                          | Input Node(s)                      | Output Node(s)                  | Sticky Note                      |
|--------------------------------|----------------------------------|----------------------------------------|----------------------------------|-------------------------------|---------------------------------|
| On form submission             | Form Trigger                     | Workflow entry point                    |                                  | API Keys                      |                                 |
| API Keys                      | Set                             | Sets API credentials                    | On form submission               | RSS Read3                    |                                 |
| RSS Read3                     | RSS Feed Read                   | Fetches RSS feed content                | API Keys                        | Aggregate                    |                                 |
| Aggregate                    | Aggregate                      | Aggregates RSS items                    | RSS Read3                      | Code in JavaScript            |                                 |
| Code in JavaScript             | Code                           | Formats aggregated data                 | Aggregate                     | Researcher Agent              |                                 |
| Researcher Agent              | LangChain Agent                | Performs research with AI and tools    | Code in JavaScript              | If                           |                                 |
| OpenAI Chat Model1            | LangChain OpenAI Chat Model    | AI model input for Researcher Agent    |                                | Researcher Agent              |                                 |
| Google Gemini Chat Model1     | LangChain Google Gemini Chat Model | AI model input for Researcher Agent    |                                | Researcher Agent              |                                 |
| Message a model in Perplexity | Perplexity Tool                | External AI tool for research           |                                | Researcher Agent              |                                 |
| URL Scraper                  | HTTP Request Tool              | Scrapes URLs for content                |                                | Researcher Agent, Writer Agent |                                 |
| tavily search                | HTTP Request Tool              | External search queries                 |                                | Researcher Agent or Writer Agent |                                 |
| If                          | Conditional                   | Branch based on Researcher Agent output | Researcher Agent               | Wait, Writer Agent           |                                 |
| Wait                        | Wait                         | Delay for rate limiting/asynchronous   | If                            | Researcher Agent              |                                 |
| Writer Agent                | LangChain Agent              | Generates blog content                  | Wait, If                      | If1                         |                                 |
| Google Gemini Chat Model2   | LangChain Google Gemini Chat Model | AI model input for Writer Agent         |                                | Structured Output Parser      |                                 |
| Structured Output Parser    | LangChain Output Parser      | Parses generated content                | Google Gemini Chat Model2      | Writer Agent                 |                                 |
| OpenAI Chat Model           | LangChain OpenAI Chat Model  | AI model input for Writer Agent         |                                | Writer Agent                 |                                 |
| If1                         | Conditional                 | Branch after content generation         | Writer Agent                  | Wait2, save blog             |                                 |
| Wait2                       | Wait                       | Delay before next content step          | If1                          | Writer Agent                 |                                 |
| save blog                   | Data Table                 | Saves generated blog content draft      | If1                          | Image Prompts Writer         |                                 |
| Image Prompts Writer        | LangChain Information Extractor | Extracts image prompts from blog text   | save blog                   | Code                        |                                 |
| Code                       | Code                       | Processes image prompts                  | Image Prompts Writer         | Loop Over Items              |                                 |
| Loop Over Items             | Split In Batches           | Iterates over image prompts              | Code                        | all_images, image name writer |                                 |
| all_images                 | Code                       | Aggregates all images                     | Loop Over Items              | html_content                |                                 |
| image name writer          | LangChain OpenAI           | Generates image names                     | Loop Over Items              | Edit Fields (set image prompt and name) |                                 |
| Edit Fields (set image prompt and name) | Set                       | Sets image prompt and name fields         | image name writer            | nano banana                 |                                 |
| nano banana                | HTTP Request               | Calls image generation API                | Edit Fields                  | If2                        |                                 |
| If2                        | Conditional               | Checks if image generation succeeded     | nano banana                  | download image, Wait3       |                                 |
| download image             | HTTP Request               | Downloads generated image                 | If2 (true branch)            | Edit Image (only for changing to png) |                                 |
| Edit Image (only for changing to png) | Edit Image                | Converts images to PNG                      | download image              | Upload image                |                                 |
| Upload image               | HTTP Request               | Uploads image to hosting/WordPress         | Edit Image                  | final image url             |                                 |
| final image url            | Set                       | Stores final image URL                      | Upload image                | Wait1                      |                                 |
| Wait1                      | Wait                      | Delay after image upload                    | final image url             | Loop Over Items             |                                 |
| Wait3                      | Wait                      | Delay on image failure path                 | If2 (false branch)          | Edit Fields (set image prompt and name) |                                 |
| html_content               | Set                       | Prepares HTML content with placeholders     | all_images                  | imbed images in html        |                                 |
| imbed images in html       | Code                      | Embeds image URLs into HTML content          | html_content                | save blog1                 |                                 |
| save blog1                 | Data Table                | Saves final blog content                      | imbed images in html        | Create a post              |                                 |
| Create a post              | WordPress                 | Publishes blog post                           | save blog1                  | Set Image                  |                                 |
| Set Image                  | HTTP Request              | Sets featured image on WordPress post          | Create a post               |                             |                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger Node ("On form submission")**  
   - Configure webhook to receive blog topic/keywords input.

2. **Add a Set Node ("API Keys")**  
   - Define credentials and keys (OpenAI, Google Gemini, WordPress, image generation APIs).

3. **Add RSS Feed Read Node ("RSS Read3")**  
   - Provide RSS feed URL for relevant content to research.

4. **Add Aggregate Node ("Aggregate")**  
   - Aggregate RSS feed items.

5. **Add Code Node ("Code in JavaScript")**  
   - Process aggregated RSS data for AI input.

6. **Add LangChain Agent Node ("Researcher Agent")**  
   - Configure with OpenAI Chat Model1, Google Gemini Chat Model1, Perplexity Tool, URL Scraper, and external search HTTP requests (tavily search).  
   - Set retry on fail, max tries = 2.

7. **Add LangChain OpenAI Chat Model Node ("OpenAI Chat Model1")**  
   - Connect as AI language model input to Researcher Agent.

8. **Add LangChain Google Gemini Chat Model Node ("Google Gemini Chat Model1")**  
   - Connect as AI language model input to Researcher Agent.

9. **Add Perplexity Tool Node ("Message a model in Perplexity")**  
   - Connect as AI tool input to Researcher Agent.

10. **Add HTTP Request Tool Node ("URL Scraper")**  
    - Connect as AI tool input to Researcher Agent and Writer Agent.

11. **Add HTTP Request Tool Node ("tavily search")**  
    - Connect output to Researcher Agent or Writer Agent as needed.

12. **Add Conditional Node ("If")**  
    - Branch workflow based on Researcher Agent success: output true to Wait, false to Writer Agent.

13. **Add Wait Node ("Wait")**  
    - Wait before invoking Researcher Agent again.

14. **Add LangChain Agent Node ("Writer Agent")**  
    - Configure with OpenAI Chat Model and Google Gemini Chat Model2 and Structured Output Parser.  
    - Set retry on fail, max tries = 2.

15. **Add LangChain Google Gemini Chat Model Node ("Google Gemini Chat Model2")**  
    - Connect to Structured Output Parser.

16. **Add LangChain Structured Output Parser Node ("Structured Output Parser")**  
    - Connect output to Writer Agent.

17. **Add LangChain OpenAI Chat Model Node ("OpenAI Chat Model")**  
    - Connect to Writer Agent.

18. **Add Conditional Node ("If1")**  
    - Branch Writer Agent output to Wait2 or save blog.

19. **Add Wait Node ("Wait2")**  
    - Wait before next AI writing iteration.

20. **Add Data Table Node ("save blog")**  
    - Save blog content draft.

21. **Add LangChain Information Extractor Node ("Image Prompts Writer")**  
    - Extract image prompts from blog content.

22. **Add Code Node ("Code")**  
    - Process image prompts into data array.

23. **Add Split In Batches Node ("Loop Over Items")**  
    - Iterate over image prompts.

24. **Add Code Node ("all_images")**  
    - Aggregate generated images.

25. **Add LangChain OpenAI Node ("image name writer")**  
    - Generate descriptive image names.

26. **Add Set Node ("Edit Fields (set image prompt and name)")**  
    - Set image prompt and name fields.

27. **Add HTTP Request Node ("nano banana")**  
    - Call image generation API.

28. **Add Conditional Node ("If2")**  
    - Check image generation success; true path to download image, false path to Wait3.

29. **Add HTTP Request Node ("download image")**  
    - Download generated image.

30. **Add Edit Image Node ("Edit Image (only for changing to png)")**  
    - Convert image to PNG.

31. **Add HTTP Request Node ("Upload image")**  
    - Upload image to hosting or WordPress media library. Enable retries with wait.

32. **Add Set Node ("final image url")**  
    - Store URL of uploaded image.

33. **Add Wait Node ("Wait1")**  
    - Wait before next batch iteration.

34. **Add Wait Node ("Wait3")**  
    - Wait on failure path before retrying image prompt setting.

35. **Add Set Node ("html_content")**  
    - Prepare HTML content with placeholders.

36. **Add Code Node ("imbed images in html")**  
    - Replace placeholders with uploaded image URLs.

37. **Add Data Table Node ("save blog1")**  
    - Save finalized blog post content.

38. **Add WordPress Node ("Create a post")**  
    - Configure credentials and parameters to publish post.

39. **Add HTTP Request Node ("Set Image")**  
    - Set the featured image on the WordPress post.

40. **Connect all nodes as per the logical flow described, ensuring conditional branches and waits are properly linked.**

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                   |
|--------------------------------------------------------------------------------------------------|--------------------------------------------------|
| Workflow uses multiple AI language models (OpenAI and Google Gemini) and AI agents with retry logic. | Ensures robust content generation and research. |
| Image generation involves batch processing with error handling and retries to mitigate API limits. | Critical for scalability and reliability.        |
| WordPress node requires OAuth2 or API credentials for publishing and media management.           | Credential setup needed prior to deployment.     |
| Perplexity and external HTTP tools augment AI research capability with real-time info retrieval. | Enhances blog factual accuracy.                   |
| Proper wait nodes handle rate limits and asynchronous API responses gracefully.                   | Avoids workflow failures due to API throttling.  |

---

**Disclaimer:** This document is derived exclusively from an n8n workflow JSON export. It complies fully with content policies and contains no illegal or protected material. All data processed is legal and public.