Automate SEO Blog Creation + Social Media with GPT-4, Perplexity and WordPress

https://n8nworkflows.xyz/workflows/automate-seo-blog-creation---social-media-with-gpt-4--perplexity-and-wordpress-4082


# Automate SEO Blog Creation + Social Media with GPT-4, Perplexity and WordPress

### 1. Workflow Overview

This workflow automates the end-to-end creation and promotion of SEO-optimized blog posts using AI models and integration platforms. Designed primarily for marketers, agencies, and brands, it seamlessly generates blog topics, writes long-form SEO content, researches facts, creates or sources visuals, publishes to WordPress, and crafts tailored social media posts for Instagram, Facebook, and X (Twitter). It further logs progress and optionally sends email reports.

The workflow is logically divided into the following blocks:

- **1.1 Trigger & Input Reception:** Handles manual or scheduled execution triggers, and external workflow triggers.
- **1.2 Idea Generation & Brand Brief Retrieval:** Generates unique blog topic ideas aligned with brand data stored in Google Sheets and Notion.
- **1.3 Blog Content Creation & SEO Optimization:** Writes comprehensive blog posts with live research integration (Perplexity AI), content cleanup, and HTML formatting.
- **1.4 Visual Content Generation & Management:** Creates AI-generated featured images, downloads fallback images from Pexels, and uploads images to WordPress and Cloudinary.
- **1.5 WordPress Publishing:** Publishes the blog post with proper formatting, excerpt, meta description, categories, and sets featured images.
- **1.6 Social Media Content Creation & Scheduling:** Generates platform-specific social media posts and schedules publication on Instagram, Facebook, and X.
- **1.7 Logging & Reporting:** Updates Google Sheets logs and optionally sends publication reports via Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Input Reception

**Overview:**  
Initiates workflow execution either manually, on schedule, or triggered by another workflow. These entry points allow flexible activation depending on use case.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Schedule Trigger  
- When Executed by Another Workflow (Execute Workflow Trigger)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual activation for testing or ad-hoc executions.  
  - Inputs: None  
  - Outputs: Connects to Idea Creator node to start the blog generation process.  
  - Failure modes: None significant; manual trigger.

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Automatically triggers workflow based on configured intervals (daily, weekly, etc.)  
  - Inputs: None  
  - Outputs: Starts Idea Creator node for automated runs.  
  - Failure modes: Misconfiguration of schedule timing.

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Allows this workflow to be triggered from external workflows (e.g., from a master scheduler).  
  - Inputs: External workflow trigger  
  - Outputs: Connects to Notion node for data retrieval.  
  - Failure modes: Trigger failures if invoked workflow is not active or misconfigured.

---

#### 1.2 Idea Generation & Brand Brief Retrieval

**Overview:**  
Generates unique blog ideas based on brand brief data and content calendar, ensuring no topic duplication. Retrieves brand information from Google Sheets and Notion to tailor ideas.

**Nodes Involved:**  
- Google Sheets (content calendar input)  
- Simple Memory (AI memory buffer)  
- get brand brief (tool workflow)  
- Structured Output Parser1  
- Idea creator (LangChain agent)  
- Category rewrite (Code node)  
- Perplexity Research1 (HTTP Request)  
- Cleanup Links (Set node)

**Node Details:**

- **Google Sheets**  
  - Type: Google Sheets Tool  
  - Role: Reads content calendar data to avoid duplicate topics.  
  - Inputs: Trigger nodes  
  - Outputs: Provides existing topics to Idea Creator.  
  - Failure modes: Authentication errors, sheet not found.

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window  
  - Role: Stores conversational context to maintain continuity in AI interactions.  
  - Inputs: Brand brief data  
  - Outputs: Supplies memory context to Idea Creator.  
  - Failure modes: Memory overflow or misconfiguration.

- **get brand brief**  
  - Type: LangChain Tool Workflow  
  - Role: Retrieves detailed brand information for AI prompt context.  
  - Inputs: Trigger  
  - Outputs: Brand brief data.  
  - Failure modes: Workflow error or API failures.

- **Structured Output Parser1**  
  - Type: LangChain Structured Output Parser  
  - Role: Parses AI output into structured format for further processing.  
  - Inputs: Idea Creator output  
  - Outputs: Clean, structured data for category rewrite.

- **Idea creator**  
  - Type: LangChain Agent  
  - Role: Generates blog post ideas based on inputs and memory context.  
  - Inputs: Brand brief, content calendar data  
  - Outputs: Proposed blog topic ideas.  
  - Failure modes: AI rate limits, prompt errors.

- **Category rewrite**  
  - Type: Code Node  
  - Role: Adjusts or rewrites blog post categories for WordPress taxonomy compliance.  
  - Inputs: Idea creator output  
  - Outputs: Reformatted categories.  
  - Failure modes: Code errors.

- **Perplexity Research1**  
  - Type: HTTP Request  
  - Role: Performs live research on blog topics to ensure factual accuracy.  
  - Inputs: Refined blog ideas and categories  
  - Outputs: Research data for content writer.  
  - Failure modes: API timeout, rate limits.

- **Cleanup Links**  
  - Type: Set Node  
  - Role: Cleans and normalizes research links and references before content generation.  
  - Inputs: Research output  
  - Outputs: Cleaned data for content writing.  
  - Failure modes: Expression errors.

---

#### 1.3 Blog Content Creation & SEO Optimization

**Overview:**  
Writes detailed, SEO-optimized blog content integrating live research, cleans up HTML output, and formats it for WordPress publishing.

**Nodes Involved:**  
- Content writer (LangChain chain LLM)  
- Cleanup HTML (Set node)  
- Wordpress (WordPress node)  
- Write prompt to create image (LangChain chain LLM)  
- OpenAI (LangChain OpenAI node)  

**Node Details:**

- **Content writer**  
  - Type: LangChain Chain LLM  
  - Role: Generates 2000–2500 word SEO-optimized blog articles using gathered research.  
  - Inputs: Cleaned research data, brand brief  
  - Outputs: Raw blog content (HTML)  
  - Failure modes: API rate limits, incomplete prompts.

- **Cleanup HTML**  
  - Type: Set Node  
  - Role: Cleans and formats HTML content to ensure proper WordPress compatibility.  
  - Inputs: Raw blog content  
  - Outputs: Cleaned HTML content  
  - Failure modes: Expression or formatting errors.

- **Wordpress**  
  - Type: WordPress node  
  - Role: Creates or updates WordPress posts with cleaned HTML content and metadata.  
  - Inputs: Cleaned blog content and meta info  
  - Outputs: WordPress post ID and URLs  
  - Failure modes: Authentication errors, API failures.

- **Write prompt to create image**  
  - Type: LangChain Chain LLM  
  - Role: Generates a prompt to create a featured image relevant to blog content.  
  - Inputs: Blog content summary  
  - Outputs: Image description prompt  
  - Failure modes: AI errors.

- **OpenAI (in this block)**  
  - Type: LangChain OpenAI  
  - Role: Processes image prompt to generate creative ideas or text for image creation.  
  - Inputs: Image prompt  
  - Outputs: Image generation input  
  - Failure modes: API limits, prompt errors.

---

#### 1.4 Visual Content Generation & Management

**Overview:**  
Generates AI images for blog posts or sources fallback images from Pexels, downloads them, and uploads to WordPress and Cloudinary for use as featured images.

**Nodes Involved:**  
- Write prompt to search image (LangChain chain LLM)  
- OpenAI 4.1 mini1 (LangChain LLM)  
- Get Image from Pexels (HTTP Request)  
- Download Image (HTTP Request)  
- Upload Image to Wordpress & Upload Image to Wordpress2 (HTTP Request)  
- Set Image on Wordpress Post & Set Image on Wordpress Post2 (HTTP Request)  
- Post image Cloudinary & Post image Cloudinary1 (HTTP Request)

**Node Details:**

- **Write prompt to search image**  
  - Type: LangChain Chain LLM  
  - Role: Creates search prompts for fallback image sourcing.  
  - Inputs: Blog content or image prompt  
  - Outputs: Search query strings.  
  - Failure modes: AI errors.

- **OpenAI 4.1 mini1**  
  - Type: LangChain LLM  
  - Role: Refines image search prompts or generates captions.  
  - Inputs: Search prompts  
  - Outputs: Final search terms.  
  - Failure modes: API rate limits.

- **Get Image from Pexels**  
  - Type: HTTP Request  
  - Role: Queries Pexels API to source relevant stock images as fallback.  
  - Inputs: Search terms  
  - Outputs: Image URLs and metadata.  
  - Failure modes: API key expiry, quota limits.

- **Download Image**  
  - Type: HTTP Request  
  - Role: Downloads selected image from Pexels for upload to WordPress.  
  - Inputs: Image URL  
  - Outputs: Binary image data.  
  - Failure modes: Network errors, URL invalid.

- **Upload Image to Wordpress / Upload Image to Wordpress2**  
  - Type: HTTP Request  
  - Role: Uploads image binary data to WordPress media library. Two separate nodes suggest handling main and fallback images.  
  - Inputs: Image binary data  
  - Outputs: Media ID and URLs.  
  - Failure modes: WordPress permission errors.

- **Set Image on Wordpress Post / Set Image on Wordpress Post2**  
  - Type: HTTP Request  
  - Role: Assigns uploaded image as featured image on corresponding WordPress posts.  
  - Inputs: Media ID, Post ID  
  - Outputs: Confirmation of update.  
  - Failure modes: API errors, post not found.

- **Post image Cloudinary / Post image Cloudinary1**  
  - Type: HTTP Request  
  - Role: Uploads images to Cloudinary for CDN delivery or social media usage.  
  - Inputs: Image data from WordPress upload or direct generation.  
  - Outputs: Cloudinary URLs.  
  - Failure modes: API limits.

---

#### 1.5 WordPress Publishing

**Overview:**  
Finalizes blog post publishing by updating excerpts, metadata, and categorization on WordPress, and ensures content is fully formatted and live.

**Nodes Involved:**  
- WordPress excerpt add (HTTP Request)  
- Excerpt creator (LangChain chain LLM)  
- Markdown (Markdown node)  
- Update list of blog post (Google Sheets)  
- Update base post (Google Sheets)  
- Edit Fields3 (Set node)  

**Node Details:**

- **WordPress excerpt add**  
  - Type: HTTP Request  
  - Role: Adds SEO meta descriptions and excerpts to WordPress posts.  
  - Inputs: Generated excerpt text, post ID  
  - Outputs: Confirmation of excerpt update.  
  - Failure modes: API errors.

- **Excerpt creator**  
  - Type: LangChain Chain LLM  
  - Role: Generates meta description and excerpt text from blog content.  
  - Inputs: Blog content  
  - Outputs: Excerpt text  
  - Failure modes: AI output errors.

- **Markdown**  
  - Type: Markdown Node  
  - Role: Converts excerpt or content into Markdown format for Google Sheets logging.  
  - Inputs: Excerpt text  
  - Outputs: Markdown content  
  - Failure modes: Formatting errors.

- **Update list of blog post**  
  - Type: Google Sheets  
  - Role: Logs published posts into content calendar or tracking sheet to avoid duplicates.  
  - Inputs: Blog post metadata  
  - Outputs: Confirmation of update  
  - Failure modes: Google Sheets API errors.

- **Update base post**  
  - Type: Google Sheets  
  - Role: Updates base data related to blog posts (e.g., status, links).  
  - Inputs: Post metadata  
  - Outputs: Confirmation  
  - Failure modes: API errors.

- **Edit Fields3**  
  - Type: Set Node  
  - Role: Prepares or modifies data before social media content creation.  
  - Inputs: Post metadata  
  - Outputs: Data for downstream social media nodes.

---

#### 1.6 Social Media Content Creation & Scheduling

**Overview:**  
Generates engaging social media posts tailored for Instagram, Facebook, and X, uploads media, schedules posts, and merges outputs for final publishing.

**Nodes Involved:**  
- Social Media Content (LangChain Structured Output Parser)  
- gpt-4.1 mini (LangChain LLM)  
- Social Media Content Creator (LangChain Agent)  
- Edit Fields1, Edit Fields2 (Set nodes)  
- Merge, Merge3, Merge4 (Merge nodes)  
- Upload media to Instagram (Facebook Graph API)  
- Publish Post on IG (Facebook Graph API)  
- Facebook Post1 (Facebook Graph API)  
- X (Twitter node)

**Node Details:**

- **Social Media Content**  
  - Type: LangChain Structured Output Parser  
  - Role: Parses AI-generated social media content into structured format per platform.  
  - Inputs: Social Media Content Creator output  
  - Outputs: Ready-to-use posts per platform.

- **gpt-4.1 mini**  
  - Type: LangChain LLM  
  - Role: Generates engaging social media copy using GPT-4 capabilities.  
  - Inputs: Blog post data  
  - Outputs: Social media drafts.

- **Social Media Content Creator**  
  - Type: LangChain Agent  
  - Role: Oversees generation and distribution of social posts, including hashtags and CTAs.  
  - Inputs: Blog post metadata  
  - Outputs: Structured social media content.

- **Edit Fields1 & Edit Fields2**  
  - Type: Set Nodes  
  - Role: Prepare platform-specific data fields and metadata for posting.  
  - Inputs: Social media content  
  - Outputs: Modified data for API calls.

- **Merge, Merge3, Merge4**  
  - Type: Merge Nodes  
  - Role: Combine outputs from different social media branches to coordinate posting.  
  - Inputs: Social media posts and media upload confirmations  
  - Outputs: Consolidated workflow data.

- **Upload media to Instagram & Publish Post on IG**  
  - Type: Facebook Graph API nodes  
  - Role: Uploads images/videos and publishes posts on Instagram.  
  - Inputs: Media files, post content  
  - Outputs: Confirmation of post publication.

- **Facebook Post1**  
  - Type: Facebook Graph API  
  - Role: Posts content to Facebook page with automatic error continuation.  
  - Inputs: Facebook post data  
  - Outputs: Post confirmation or error.

- **X (Twitter node)**  
  - Type: Twitter API node  
  - Role: Posts tweets with media and content on X (formerly Twitter).  
  - Inputs: Tweet content and media  
  - Outputs: Tweet confirmation.

---

#### 1.7 Logging & Reporting

**Overview:**  
Logs all publication data into Google Sheets and sends optional email reports via Gmail for transparency and monitoring.

**Nodes Involved:**  
- Aggregate1 (Aggregate node)  
- Add too Data Bank (Google Sheets)  
- Gmail  
- Sticky Notes (various for instructions and reminders)

**Node Details:**

- **Aggregate1**  
  - Type: Aggregate Node  
  - Role: Combines social media posting results and blog post metadata for logging.  
  - Inputs: Merge outputs from social media and publishing nodes  
  - Outputs: Consolidated data for logging.

- **Add too Data Bank**  
  - Type: Google Sheets  
  - Role: Updates master data bank spreadsheet with final publication details.  
  - Inputs: Aggregated data  
  - Outputs: Confirmation of update.

- **Gmail**  
  - Type: Gmail node  
  - Role: Sends publication reports or notifications to designated email addresses.  
  - Inputs: Publication data, email templates  
  - Outputs: Email send confirmation.  
  - Failure modes: Email authentication errors.

- **Sticky Notes**  
  - Scattered throughout the workflow as user reminders, instructions, and links (not functional nodes).

---

### 3. Summary Table

| Node Name                     | Node Type                       | Functional Role                           | Input Node(s)                          | Output Node(s)                         | Sticky Note                                                  |
|-------------------------------|---------------------------------|-----------------------------------------|--------------------------------------|--------------------------------------|--------------------------------------------------------------|
| When clicking ‘Test workflow’  | Manual Trigger                  | Manual workflow start                    | None                                 | Idea creator                         |                                                              |
| Schedule Trigger               | Schedule Trigger                | Scheduled workflow start                 | None                                 | Idea creator                         |                                                              |
| When Executed by Another Workflow | Execute Workflow Trigger        | External workflow start                  | None                                 | Notion                              |                                                              |
| Google Sheets                 | Google Sheets Tool              | Reads content calendar                   | Trigger nodes                        | Idea creator                         |                                                              |
| Simple Memory                 | LangChain Memory Buffer         | Maintains AI conversation context       | Brand brief                        | Idea creator                         |                                                              |
| get brand brief               | LangChain Tool Workflow         | Retrieves brand data                     | Trigger                             | Idea creator                         |                                                              |
| Structured Output Parser1     | LangChain Output Parser         | Parses AI output                         | Idea creator                       | Category rewrite                     |                                                              |
| Idea creator                 | LangChain Agent                 | Generates blog topic ideas               | Google Sheets, Brand brief, Memory  | Category rewrite                     |                                                              |
| Category rewrite             | Code Node                      | Adjusts blog categories                  | Idea creator                       | Perplexity Research1                 |                                                              |
| Perplexity Research1         | HTTP Request                   | Fact-check and research                  | Category rewrite                   | Cleanup Links                       |                                                              |
| Cleanup Links               | Set Node                      | Cleans research URLs                     | Perplexity Research1               | Content writer                     |                                                              |
| Content writer             | LangChain Chain LLM             | Generates full blog content              | Cleanup Links                     | Cleanup HTML                      |                                                              |
| Cleanup HTML               | Set Node                      | Cleans HTML content                      | Content writer                   | Wordpress                        |                                                              |
| Wordpress                 | WordPress Node                 | Publishes blog post                      | Cleanup HTML                    | Write prompt to create image        |                                                              |
| Write prompt to create image | LangChain Chain LLM             | Creates image prompt                      | Wordpress                       | OpenAI 4.1 mini4                   |                                                              |
| OpenAI 4.1 mini4           | LangChain OpenAI               | Processes image prompt                    | Write prompt to create image      | Upload Image to Wordpress2, Write prompt to search image |                                                              |
| Upload Image to Wordpress2 | HTTP Request                   | Uploads image to WordPress                | OpenAI 4.1 mini4                | Set Image on Wordpress Post2        |                                                              |
| Set Image on Wordpress Post2 | HTTP Request                   | Sets featured image on post               | Upload Image to Wordpress2       | Excerpt creator                    |                                                              |
| Write prompt to search image | LangChain Chain LLM             | Creates fallback image search prompt      | OpenAI                        | Get Image from Pexels             |                                                              |
| OpenAI 4.1 mini1           | LangChain OpenAI               | Refines search prompt                      | Write prompt to search image     | Get Image from Pexels             |                                                              |
| Get Image from Pexels       | HTTP Request                   | Queries Pexels for fallback image         | OpenAI 4.1 mini1                | Download Image                   |                                                              |
| Download Image             | HTTP Request                   | Downloads fallback image                   | Get Image from Pexels            | Upload Image to Wordpress          |                                                              |
| Upload Image to Wordpress   | HTTP Request                   | Uploads fallback image to WordPress        | Download Image                  | Set Image on Wordpress Post        |                                                              |
| Set Image on Wordpress Post | HTTP Request                   | Sets fallback image as featured image      | Upload Image to Wordpress       | Excerpt creator                    |                                                              |
| Excerpt creator            | LangChain Chain LLM             | Creates post excerpt/meta description      | Set Image on Wordpress Post(2) or (1) | WordPress excerpt add           |                                                              |
| WordPress excerpt add       | HTTP Request                   | Adds excerpt to WordPress post              | Excerpt creator                 | Markdown                         |                                                              |
| Markdown                   | Markdown Node                  | Converts excerpt to Markdown                 | WordPress excerpt add           | Update list of blog post           |                                                              |
| Update list of blog post   | Google Sheets                  | Logs published blog post                     | Markdown                       | Update base post                 |                                                              |
| Update base post           | Google Sheets                  | Updates base blog post data                   | Update list of blog post        | Edit Fields3                    |                                                              |
| Edit Fields3               | Set Node                      | Prepares data for social media content       | Update base post               | Social Media Content Creator       |                                                              |
| Social Media Content       | LangChain Output Parser         | Parses social media content                   | Social Media Content Creator    | Social Media Content Creator       |                                                              |
| gpt-4.1 mini               | LangChain OpenAI               | Generates social media copy                    | Social Media Content Creator    | Social Media Content Creator       |                                                              |
| Social Media Content Creator | LangChain Agent               | Creates & orchestrates social media posts     | Edit Fields3                   | Edit Fields2, Edit Fields1, X, OpenAI1, OpenAI2 |                                                              |
| Edit Fields1               | Set Node                      | Prepares Facebook post data                     | Social Media Content Creator    | Merge4                          |                                                              |
| Edit Fields2               | Set Node                      | Prepares Instagram post data                    | Social Media Content Creator    | Merge3                          |                                                              |
| Merge3                     | Merge Node                    | Combines Instagram media upload & post          | Edit Fields1, Upload media to Instagram | Upload media to Instagram       |                                                              |
| Merge4                     | Merge Node                    | Combines Facebook post data                       | Edit Fields2, Facebook Post1   | Facebook Post1                   |                                                              |
| Upload media to Instagram  | Facebook Graph API            | Uploads media to Instagram                       | Merge3                        | Publish Post on IG              |                                                              |
| Publish Post on IG         | Facebook Graph API            | Publishes Instagram post                         | Upload media to Instagram       | Merge                         |                                                              |
| Facebook Post1             | Facebook Graph API            | Posts content to Facebook                         | Merge4                        | Merge                         |                                                              |
| X                         | Twitter Node                  | Posts content to X (Twitter)                       | Social Media Content Creator    | Merge                         |                                                              |
| Merge                      | Merge Node                    | Merges social media posting results               | Publish Post on IG, Facebook Post1, X | Aggregate1                    |                                                              |
| Aggregate1                 | Aggregate Node                | Aggregates final publication data                  | Merge                         | Add too Data Bank               |                                                              |
| Add too Data Bank          | Google Sheets                 | Logs publication data in master sheet             | Aggregate1                    | Gmail                        |                                                              |
| Gmail                      | Gmail Node                   | Sends email report notifications                   | Add too Data Bank             | None                        |                                                              |
| Notion                    | Notion Node                   | Retrieves additional brand data                      | When Executed by Another Workflow | Aggregate                      |                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a Manual Trigger node named “When clicking ‘Test workflow’”.  
   - Add a Schedule Trigger node with desired interval.  
   - Add an Execute Workflow Trigger node named “When Executed by Another Workflow”.

2. **Set Up Brand & Content Calendar Inputs:**  
   - Add a Google Sheets node to read the content calendar spreadsheet (configure credentials and sheet ID).  
   - Add a Notion node to retrieve brand data if applicable.

3. **Add AI Memory Node:**  
   - Add a LangChain Memory Buffer node (“Simple Memory”) to maintain context.

4. **Add Brand Brief Retrieval Workflow:**  
   - Create or import a LangChain Tool Workflow node (“get brand brief”) to fetch brand info.  
   - Connect Google Sheets and brand brief data into “Idea creator”.

5. **Configure Idea Creator:**  
   - Add a LangChain Agent node (“Idea creator”) to generate blog topics.  
   - Configure with appropriate AI model (OpenAI GPT-4), prompt, and memory.

6. **Add Output Parser:**  
   - Add LangChain Structured Output Parser (“Structured Output Parser1”) to parse ideas.

7. **Add Category Rewrite:**  
   - Add a Code node (“Category rewrite”) to refine categories per WordPress taxonomy.

8. **Add Research Node:**  
   - Add HTTP Request node (“Perplexity Research1”) to query Perplexity AI for fact-checking.

9. **Clean Research Links:**  
   - Add a Set node (“Cleanup Links”) to clean and normalize URLs.

10. **Add Content Writer:**  
    - Add a LangChain Chain LLM node (“Content writer”) configured with GPT-4 to write full articles.

11. **Clean HTML Output:**  
    - Add a Set node (“Cleanup HTML”) to sanitize HTML for WordPress.

12. **Configure WordPress Node:**  
    - Add WordPress node (“Wordpress”) to create posts. Configure with WordPress credentials and site URL.

13. **Write Prompt for Image Creation:**  
    - Add LangChain Chain LLM node (“Write prompt to create image”) to generate image descriptions.

14. **Add OpenAI Image Prompt Processing:**  
    - Add LangChain OpenAI node (“OpenAI 4.1 mini4”) to process image prompts.

15. **Upload Featured Images:**  
    - Add HTTP Request nodes (“Upload Image to Wordpress2” and “Set Image on Wordpress Post2”) to upload and assign images.

16. **Fallback Image Search:**  
    - Add Chain LLM node (“Write prompt to search image”) and OpenAI LLM (“OpenAI 4.1 mini1”) to generate fallback search queries.  
    - Add HTTP Request node (“Get Image from Pexels”) to query Pexels API.  
    - Add HTTP Request node (“Download Image”) to get image.  
    - Add HTTP Request nodes (“Upload Image to Wordpress” and “Set Image on Wordpress Post”) for fallback images.

17. **Create Post Excerpts:**  
    - Add Chain LLM node (“Excerpt creator”) to generate post excerpts.  
    - Add HTTP Request node (“WordPress excerpt add”) to update WordPress.  
    - Add Markdown node to convert excerpts for logging.

18. **Update Google Sheets Logs:**  
    - Add Google Sheets nodes (“Update list of blog post” and “Update base post”) to maintain records.

19. **Setup Social Media Content Creation:**  
    - Add LangChain Output Parser node (“Social Media Content”) and LangChain Agent node (“Social Media Content Creator”) to generate social media posts.  
    - Add LangChain OpenAI node (“gpt-4.1 mini”) to assist generation.

20. **Prepare Social Media Data:**  
    - Add Set nodes (“Edit Fields1”, “Edit Fields2”, “Edit Fields3”) to format platform-specific data.

21. **Add Social Media Publishing Nodes:**  
    - Add Facebook Graph API nodes (“Upload media to Instagram”, “Publish Post on IG”, “Facebook Post1”) for Instagram and Facebook posting.  
    - Add Twitter node (“X”) for posting tweets.

22. **Merge Social Media Outputs:**  
    - Add Merge nodes (“Merge”, “Merge3”, “Merge4”) to synchronize social media posting steps.

23. **Add Aggregation & Reporting:**  
    - Add Aggregate node (“Aggregate1”) to combine all final data.  
    - Add Google Sheets node (“Add too Data Bank”) for master logging.  
    - Add Gmail node (“Gmail”) for sending email reports.

24. **Add Sticky Notes:**  
    - Add sticky notes throughout the workflow for instructions and placeholders.

25. **Connect All Nodes:**  
    - Connect nodes following the outlined logical flow: triggers → brand inputs → idea generation → research → content creation → image generation → WordPress publishing → social media content generation → social media posting → logging and reporting.

26. **Configure Credentials:**  
    - OpenAI API with GPT-4 access  
    - WordPress OAuth2/API credentials  
    - Google Sheets API credentials  
    - Gmail OAuth2 credentials  
    - Facebook Graph API credentials for Instagram and Facebook pages  
    - Twitter API credentials  
    - Pexels API key  
    - Cloudinary API credentials (optional)

27. **Test Workflow:**  
    - Use manual trigger to validate each step and fix errors.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                         | Context or Link                                                                                          |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Modular design allows easy customization of AI prompts, social media platforms, or publishing schedules.                                                                                            | Workflow description                                                                                     |
| Replace all placeholder values such as WordPress URLs, Google Sheets IDs, API keys before live execution.                                                                                             | Setup instructions                                                                                       |
| See included Markdown and PDF setup guides for detailed credential configuration and prompt editing.                                                                                                | Documentation provided with workflow                                                                     |
| Bonus: Sticky Notes contain quick-edit instructions and reference placeholders for user ease.                                                                                                        | Sticky Notes scattered in workflow                                                                        |
| Project credited as an AI-powered end-to-end blog and social media automation solution integrating GPT-4, Perplexity AI, WordPress, and social platforms.                                           | Workflow description                                                                                     |
| Useful for agencies and brands to save time and resources by automating content production and promotion without manual intervention.                                                               | Workflow description                                                                                     |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a low-code integration and automation platform. This process strictly adheres to content policies and contains no illegal, offensive, or protected elements. All data processed is lawful and publicly accessible.