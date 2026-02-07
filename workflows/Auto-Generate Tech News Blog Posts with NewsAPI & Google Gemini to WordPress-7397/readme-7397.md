Auto-Generate Tech News Blog Posts with NewsAPI & Google Gemini to WordPress

https://n8nworkflows.xyz/workflows/auto-generate-tech-news-blog-posts-with-newsapi---google-gemini-to-wordpress-7397


# Auto-Generate Tech News Blog Posts with NewsAPI & Google Gemini to WordPress

### 1. Workflow Overview

This workflow automates the daily generation and publication of tech news blog posts using the NewsAPI, Google Gemini AI, and WordPress. Scheduled to run every day at 8 AM, it fetches the top technology headlines, uses AI to create engaging summarized blog posts, and publishes them automatically to a WordPress site.

The workflow is logically divided into these blocks:

- **1.1 Scheduled Trigger:** Starts the workflow daily at a fixed time.
- **1.2 News Fetching:** Retrieves the latest top technology news articles using NewsAPI.
- **1.3 Article Preparation:** Filters and splits the news data into individual articles for processing.
- **1.4 AI Summarization:** Uses Google Gemini via an AI agent to generate detailed blog posts from each article.
- **1.5 Content Parsing:** Cleans and extracts the AI-generated JSON output into usable blog post content.
- **1.6 Publishing:** Automatically posts the summarized content to WordPress.
- **1.7 Iteration Control:** Loops through multiple articles to handle batch processing.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:** Initiates the workflow every day at 8 AM using a cron expression.
- **Nodes Involved:**  
  - Daily 8AM Trigger

- **Node Details:**

  - **Daily 8AM Trigger**  
    - Type: Schedule Trigger  
    - Configuration: Cron expression `0 8 * * *` triggers at 8:00 AM daily.  
    - Input: None (starts the workflow)  
    - Output: Triggers the next node `Fetch Tech News`  
    - Edge Cases: Workflow will not run if n8n instance is offline at trigger time. Cron expression must be valid to avoid misfires.  
    - Version: 1.2  

#### 2.2 News Fetching

- **Overview:** Retrieves the latest top headlines in technology from NewsAPI using an authenticated HTTP request.
- **Nodes Involved:**  
  - Fetch Tech News

- **Node Details:**

  - **Fetch Tech News**  
    - Type: HTTP Request  
    - Configuration:  
      - URL: `https://newsapi.org/v2/top-headlines` with query parameters for API key, country (us), category (technology), and pageSize (10).  
      - Authentication: HTTP Query Auth with a credential holding the API key.  
      - Method: GET (default implied)  
    - Input: Trigger from schedule node  
    - Output: JSON response containing an array of articles under `articles` key  
    - Edge Cases:  
      - API key missing or invalid returns authentication errors.  
      - Rate limits from NewsAPI can cause failures.  
      - Network timeouts or unexpected API response structures.  
    - Version: 4.1  

#### 2.3 Article Preparation

- **Overview:** Cleans, filters, and splits the fetched news articles into individual items for batch processing.
- **Nodes Involved:**  
  - Split Articles  
  - Loop Over Items

- **Node Details:**

  - **Split Articles**  
    - Type: Code (JavaScript)  
    - Configuration:  
      - Extracts `articles` array from input JSON.  
      - Filters out articles missing title, description, or content, or with content marked "[Removed]".  
      - Limits to top 5 articles to control API and processing load.  
      - Outputs each article as separate JSON item with selected fields (title, description, content, url, urlToImage, publishedAt, source).  
    - Input: Output from `Fetch Tech News` node  
    - Output: Multiple items, one per article  
    - Edge Cases: Empty or malformed articles array results in zero output items.  
    - Version: 2  

  - **Loop Over Items**  
    - Type: Split In Batches  
    - Configuration: Defaults, processes one article at a time by default.  
    - Input: Items from `Split Articles` node  
    - Output: Iteratively passes single article JSON to AI summarization  
    - Edge Cases: Batch size issues if large inputs, but limited by previous node to 5 items.  
    - Version: 3  

#### 2.4 AI Summarization

- **Overview:** Uses an AI agent powered by Google Gemini to generate a well-structured blog post based on each article's content.
- **Nodes Involved:**  
  - AI News Summarizer  
  - Google Gemini Chat Model

- **Node Details:**

  - **AI News Summarizer**  
    - Type: LangChain Agent (ai_languageModel)  
    - Configuration:  
      - Prompt instructs the AI to write an engaging 600-800 word blog post expanding on the article.  
      - The prompt requests output strictly in JSON format with `title` and `content` fields.  
      - Includes system message to style the post with headings, bullet points, and commentary.  
      - Uses dynamic expressions to insert article fields (`title`, `description`, `content`, `source`) from input JSON.  
    - Input: Single article JSON from `Loop Over Items`  
    - Output: AI-generated JSON string with blog post data (wrapped in markdown code block)  
    - Edge Cases:  
      - AI returning malformed JSON or unexpected formatting.  
      - API request failures or rate limits from Google Gemini API.  
      - Credential misconfiguration for AI access.  
    - Version: 2.2  
    - Sub-workflow: Uses Google Gemini Chat Model for language model backend.  

  - **Google Gemini Chat Model**  
    - Type: LangChain Google Gemini LM Chat  
    - Configuration: No special parameters; uses linked Google Palm API credentials.  
    - Input: Receives prompt and context from AI News Summarizer node.  
    - Output: AI-generated text response passed back to AI News Summarizer node.  
    - Credentials: Google Palm API OAuth2 configured (credential ID: TST API)  
    - Edge Cases: API quota exceeded, authentication errors, network delays.  
    - Version: 1  

#### 2.5 Content Parsing

- **Overview:** Parses the AI-generated JSON output, sanitizing it from markdown markers and extracting blog post title and content for WordPress publishing.
- **Nodes Involved:**  
  - Title and Content

- **Node Details:**

  - **Title and Content**  
    - Type: Code (JavaScript)  
    - Configuration:  
      - Iterates over all AI outputs.  
      - Strips markdown code block markers (```json ... ```) from the AI string.  
      - Parses the cleaned string as JSON.  
      - Extracts `title` and `content` fields, and retains original article metadata for reference.  
      - Outputs simplified JSON ready for publishing.  
    - Input: AI News Summarizer output  
    - Output: Clean JSON with blog post title and content  
    - Edge Cases:  
      - JSON parse errors if AI output malformed.  
      - Missing fields in AI output.  
    - Version: 2  

#### 2.6 Publishing

- **Overview:** Publishes the generated blog posts automatically to a WordPress site with predefined tags and status.
- **Nodes Involved:**  
  - Publish to WordPress

- **Node Details:**

  - **Publish to WordPress**  
    - Type: WordPress node  
    - Configuration:  
      - Uses dynamic expressions for post `title` and `content` fields from parsed JSON.  
      - Adds fixed tags: `technology`, `news`, `daily`, `automation`.  
      - Post status set to `publish` (auto-publish).  
    - Input: Parsed blog post JSON from `Title and Content`  
    - Output: WordPress API response confirming post creation  
    - Credentials: WordPress OAuth2 or Basic Auth configured externally.  
    - Edge Cases:  
      - Authentication failure with WordPress.  
      - API rate limits or server errors.  
      - Content exceeding size or formatting issues.  
    - Version: 1  

#### 2.7 Iteration Control

- **Overview:** Controls flow of processing multiple articles by cycling back to `Loop Over Items` after publishing each post, until all are processed.
- **Nodes Involved:**  
  - Loop Over Items (as batch splitter and controller)

- **Node Details:**

  - After publishing a post, the workflow loops back to `Loop Over Items` to process the next article, ensuring sequential processing of up to 5 articles per run.  
  - Edge Cases: Loop could cause infinite cycling if not managed properly; however, batch splitting logic limits this.  

---

### 3. Summary Table

| Node Name           | Node Type                         | Functional Role                    | Input Node(s)           | Output Node(s)          | Sticky Note                                                                                                                              |
|---------------------|----------------------------------|----------------------------------|------------------------|-------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Sticky Note         | Sticky Note                      | Workflow overview and instructions| None                   | None                    | ## Daily News Digest Automation... Setup Required, Customization, and Help instructions including contact email for coaching.           |
| Daily 8AM Trigger    | Schedule Trigger                 | Triggers workflow daily at 8 AM  | None                   | Fetch Tech News          |                                                                                                                                          |
| Fetch Tech News      | HTTP Request                    | Fetches top tech news from NewsAPI| Daily 8AM Trigger      | Split Articles           | Requires NewsAPI key setup; replace YOUR_API_KEY in URL with actual key.                                                                 |
| Split Articles       | Code                            | Filters and splits articles       | Fetch Tech News         | Loop Over Items          |                                                                                                                                          |
| Loop Over Items      | Split In Batches                | Processes each article individually| Split Articles          | AI News Summarizer, Loop Over Items (post-publish) | Controls batch processing loop to handle multiple articles sequentially.                                                                |
| AI News Summarizer   | LangChain Agent (AI Language Model) | Generates blog post content from article | Loop Over Items          | Title and Content        | Uses Google Gemini API; prompt defines JSON output format.                                                                                |
| Google Gemini Chat Model | LangChain Google Gemini LM Chat | AI backend for text generation    | AI News Summarizer      | AI News Summarizer       | Requires Google Palm API credentials.                                                                                                    |
| Title and Content    | Code                            | Parses AI JSON output              | AI News Summarizer      | Publish to WordPress     | Cleans markdown and extracts JSON fields for publishing.                                                                                 |
| Publish to WordPress | WordPress                       | Publishes blog post to WordPress  | Title and Content       | Loop Over Items          | Requires WordPress credentials; posts auto-published with tags and status "publish".                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Cron expression set to `0 8 * * *` to run daily at 8 AM.

2. **Add an HTTP Request node named "Fetch Tech News":**  
   - URL: `https://newsapi.org/v2/top-headlines`  
   - Query Parameters:  
     - `apiKey`: Your NewsAPI key (set via HTTP Query Auth credentials).  
     - `country`: `us`  
     - `category`: `technology`  
     - `pageSize`: `10`  
   - Authentication: Configure HTTP Query Auth credential with your NewsAPI key.  
   - Connect output of Schedule Trigger to this node.

3. **Add a Code node named "Split Articles":**  
   - Paste the following JavaScript code to filter and split articles:  
     ```js
     const articles = $input.first().json.articles;

     const validArticles = articles
       .filter(article => 
         article.title && 
         article.description && 
         article.content && 
         article.content !== "[Removed]"
       )
       .slice(0, 5);

     return validArticles.map(article => ({
       json: {
         title: article.title,
         description: article.description,
         content: article.content,
         url: article.url,
         urlToImage: article.urlToImage,
         publishedAt: article.publishedAt,
         source: article.source.name
       }
     }));
     ```  
   - Connect output of `Fetch Tech News` node to this node.

4. **Add a Split In Batches node named "Loop Over Items":**  
   - Default settings (process one item per batch).  
   - Connect output of `Split Articles` to this node.

5. **Add a LangChain Agent node named "AI News Summarizer":**  
   - Type: `ai_languageModel` (LangChain agent)  
   - Set the prompt using an expression like:  
     ```
     You are a tech news writer. Based on the article provided, write an engaging blog post.

     Return ONLY valid JSON in this exact format:
     {
       "title": "Your catchy headline here",
       "content": "Full blog post content with proper formatting"
     }

     Article details:
     - Title: {{ $json.title }}
     - Description: {{ $json.description }}
     - Content: {{ $json.content }}
     - Source: {{ $json.source }}

     Write a 600-800 word blog post expanding on this article.
     ```  
   - Add system message:  
     ```
     You are a tech news curator. Create a compelling blog post that summarizes the top tech news stories. Format it with proper headings, bullet points, and include brief commentary on each story's significance. Make it engaging and informative for a general tech audience.
     ```  
   - Connect output of `Loop Over Items` (first output) to this node.

6. **Add a LangChain Google Gemini LM Chat node named "Google Gemini Chat Model":**  
   - No special parameters needed.  
   - Link Google Palm API credentials (OAuth2) with valid API key.  
   - Connect this node as the language model backend for "AI News Summarizer".

7. **Add a Code node named "Title and Content":**  
   - Paste this JavaScript code to clean and parse AI output:  
     ```js
     const items = $input.all();

     return items.map(item => {
       let aiOutput = item.json.output;
       
       aiOutput = aiOutput.replace(/```json\s*/, '').replace(/```\s*$/, '');
       
       const parsedOutput = JSON.parse(aiOutput.trim());
       
       return {
         json: {
           title: parsedOutput.title,
           content: parsedOutput.content,
           originalTitle: item.json.title,
           source: item.json.source,
           url: item.json.url
         }
       };
     });
     ```  
   - Connect output of `AI News Summarizer` to this node.

8. **Add a WordPress node named "Publish to WordPress":**  
   - Set `title` field expression: `={{ $json.title }}`  
   - Set `content` field expression: `={{ $json.content }}`  
   - Add additional fields:  
     - Tags: `technology`, `news`, `daily`, `automation`  
     - Status: `publish`  
   - Configure WordPress credentials with proper OAuth2 or Basic Auth.  
   - Connect output of `Title and Content` to this node.

9. **Connect "Publish to WordPress" output back to the second output of "Loop Over Items":**  
   - This closes the batch loop to process all articles sequentially.

10. **Add a Sticky Note node with workflow overview and setup instructions:**  
    - Document API keys, credential setup, scheduling, and customization tips.  
    - Position for clarity in canvas.

---

### 5. General Notes & Resources

| Note Content                                                                                                                            | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow automates daily tech news blog posts by combining NewsAPI, Google Gemini AI, and WordPress publishing.                         | Overview and purpose                                                                                 |
| Requires a free API key from https://newsapi.org/ to be added in HTTP Request node credentials.                                          | NewsAPI setup                                                                                       |
| Google Gemini API credentials must be configured for AI agent usage.                                                                     | Google Palm API credential setup                                                                    |
| WordPress credentials must be configured with required permissions to post content automatically.                                        | WordPress OAuth2 or Basic Auth configuration                                                       |
| Customize schedule by editing cron expression in "Daily 8AM Trigger" node.                                                               | Scheduling customization                                                                            |
| Modify AI prompt in "AI News Summarizer" node to change blog post style or length.                                                       | AI prompt customization                                                                             |
| Post status can be changed from "publish" to "draft" in WordPress node for manual review before publishing.                             | Publishing workflow control                                                                         |
| For personalized help or coaching with n8n workflows, contact: [david@daexai.com](mailto:david@daexai.com)                              | Support contact                                                                                      |

---

**Disclaimer:** This document is based solely on an automated n8n workflow. It adheres to all content policies and contains only legal and public data.