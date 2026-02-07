Automate Blog-to-Social Media with GPT-4 for LinkedIn, X, and Reddit

https://n8nworkflows.xyz/workflows/automate-blog-to-social-media-with-gpt-4-for-linkedin--x--and-reddit-10750


# Automate Blog-to-Social Media with GPT-4 for LinkedIn, X, and Reddit

### 1. Workflow Overview

This workflow automates transforming blog content into social media posts for LinkedIn, X (formerly Twitter), and Reddit using GPT-4. It extracts blog content from URLs or RSS feeds, uses AI to generate tailored social posts and images, and publishes them on social platforms. The workflow supports both scheduled automation and manual triggering.

Logical blocks:

- **1.1 Input Reception & Content Retrieval**  
  Receives blog URLs manually or via webhook, or triggers on schedule to read RSS feeds. Retrieves blog content as HTML.

- **1.2 Content Processing & AI Generation**  
  Extracts relevant text from HTML, sends it to GPT-4 for generating social media post text, and separately requests AI-generated images for LinkedIn and X.

- **1.3 Conditional and Batch Processing**  
  Uses a SQL query and conditional checks to filter posts, splits items into batches for processing, and iterates over the batch.

- **1.4 Social Media Posting**  
  Posts content to LinkedIn with generated image, to X with media upload, and to Reddit. Implements waits and retries for API rate limits.

- **1.5 Response Handling**  
  Collects results from social media posting nodes and responds to webhook or manual trigger with aggregated output.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Content Retrieval

- **Overview:**  
  Handles starting points from manual trigger, webhook URL input, or scheduled RSS feed reading. Retrieves blog content HTML for further processing.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’  
  - Pass URL (Webhook)  
  - Schedule Trigger  
  - RSS Read  
  - Execute a SQL query  
  - If  
  - Set Link  
  - HTTP Request

- **Node Details:**

1. **When clicking ‘Execute workflow’**  
   - Type: Manual Trigger  
   - Role: Manual start for testing or on-demand execution  
   - Connections: Outputs to Edit Fields node  
   - Edge cases: Manual trigger requires user action; no input data by default.

2. **Pass URL**  
   - Type: Webhook  
   - Role: Receives incoming URL via HTTP webhook  
   - Connections: Outputs to Set Link node  
   - Edge cases: Requires webhook URL setup and external calls; input validation needed.

3. **Schedule Trigger**  
   - Type: Schedule Trigger  
   - Role: Periodically triggers RSS feed reading  
   - Connections: Outputs to RSS Read node  
   - Edge cases: Scheduling configuration required; ensure time zone and frequency set correctly.

4. **RSS Read**  
   - Type: RSS Feed Read  
   - Role: Reads latest blog posts from RSS feed URL  
   - Connections: Outputs to Execute a SQL query node  
   - Edge cases: RSS feed availability and format compliance; network timeouts.

5. **Execute a SQL query**  
   - Type: Postgres  
   - Role: Queries database to filter or log posts (e.g., to avoid duplicates)  
   - Connections: Outputs to If node  
   - Configuration: Requires valid Postgres credentials and query setup  
   - Edge cases: SQL errors, connection failures, permission errors.

6. **If**  
   - Type: Conditional  
   - Role: Filters posts based on SQL query result or other criteria  
   - Connections: True branch to Loop Over Items, False branch ends flow  
   - Edge cases: Expression errors if data missing.

7. **Set Link**  
   - Type: Set (Data manipulation)  
   - Role: Sets or formats the blog URL for HTTP request  
   - Connections: Outputs to HTTP Request node  
   - Edge cases: Incorrect URL formatting.

8. **HTTP Request**  
   - Type: HTTP Request  
   - Role: Fetches blog HTML content from URL  
   - Connections: Outputs to HTML node  
   - Edge cases: HTTP errors (404, timeout), redirects, invalid URLs.

---

#### 1.2 Content Processing & AI Generation

- **Overview:**  
  Parses blog HTML, extracts content, and sends it to GPT-4 for generating social media post texts and AI-generated images.

- **Nodes Involved:**  
  - HTML  
  - Message a model (OpenAI GPT-4)  
  - Wait  
  - Wait 5s  
  - Generate an image for LinkedIn (OpenAI)  
  - Generate Image for X (OpenAI)

- **Node Details:**

1. **HTML**  
   - Type: HTML Extractor  
   - Role: Parses raw HTML, extracts relevant text (e.g., article body, title) using CSS selectors or XPath  
   - Connections: Outputs to Message a model node  
   - Edge cases: HTML structure changes, missing elements.

2. **Message a model**  
   - Type: LangChain OpenAI node (GPT-4)  
   - Role: Sends extracted blog text to GPT-4 to generate social media post content tailored for different platforms  
   - Configuration: Uses prompt templates; includes variables for blog content, tone, and platform context  
   - Connections: Outputs to Wait and Wait 5s nodes, then to Post Reddit  
   - Edge cases: API rate limits, timeouts, malformed prompts.

3. **Wait**  
   - Type: Wait node  
   - Role: Pauses workflow to manage rate limits or timing between calls  
   - Connections: Outputs to Generate Image for X node  
   - Edge cases: Overlong waits may delay flow; insufficient waits risk API throttling.

4. **Wait 5s**  
   - Type: Wait node  
   - Role: Additional pause before LinkedIn image generation  
   - Connections: Outputs to Generate an image for LinkedIn node  
   - Edge cases: Same as above.

5. **Generate an image for LinkedIn**  
   - Type: LangChain OpenAI node (image generation)  
   - Role: Requests AI-generated image tailored for LinkedIn post  
   - Configuration: Prompt includes post context and style instructions  
   - Connections: Outputs to Create a post (LinkedIn) node  
   - Edge cases: Image generation failure, retries enabled.

6. **Generate Image for X**  
   - Type: LangChain OpenAI node (image generation)  
   - Role: Requests image generation for X (Twitter) post  
   - Configuration: Similar to LinkedIn image generation, with platform-specific style  
   - Connections: Outputs to Twitter Post Media node  
   - Edge cases: Same as above.

---

#### 1.3 Conditional and Batch Processing

- **Overview:**  
  Handles logic branching based on content filtering and processes posts in batches to respect API limits and improve throughput.

- **Nodes Involved:**  
  - If  
  - Loop Over Items (SplitInBatches)  
  - Call Post Social (HTTP Request)

- **Node Details:**

1. **If** (See above in block 1.1)  
   - Conditional to proceed only if post passes criteria.

2. **Loop Over Items**  
   - Type: SplitInBatches  
   - Role: Splits array of posts into manageable batches (default batch size can be configured)  
   - Connections: True branch leads to Call Post Social node, False branch ends flow  
   - Edge cases: Batch size misconfiguration, memory issues with large arrays.

3. **Call Post Social**  
   - Type: HTTP Request  
   - Role: Calls internal or external API for posting social content; can be used for chaining or modular calls  
   - Connections: Loops back to Loop Over Items node for next batch  
   - Edge cases: API failures, network errors.

---

#### 1.4 Social Media Posting

- **Overview:**  
  Posts the generated content and images to LinkedIn, X (Twitter), and Reddit, including media upload and retry logic.

- **Nodes Involved:**  
  - Create a post (LinkedIn)  
  - Create Tweet (Twitter)  
  - Twitter Post Media (HTTP Request)  
  - Post Reddit  
  - Wait (for timing control)

- **Node Details:**

1. **Create a post**  
   - Type: LinkedIn node  
   - Role: Posts text and generated image to LinkedIn feed  
   - Configuration: Uses OAuth2 credentials, inputs from AI-generated content and image node  
   - Edge cases: OAuth token expiration, API rate limits.

2. **Create Tweet**  
   - Type: Twitter node  
   - Role: Posts tweet text with media attachment to X (Twitter)  
   - Configuration: OAuth1 credentials, retry on failure enabled  
   - Edge cases: API rate limits, media upload failures.

3. **Twitter Post Media**  
   - Type: HTTP Request  
   - Role: Uploads media to Twitter API to get media ID for tweet  
   - Connections: Feeds into Create Tweet node  
   - Edge cases: Media upload size limits, network issues.

4. **Post Reddit**  
   - Type: Reddit node  
   - Role: Posts content to a specified subreddit  
   - Configuration: OAuth2 or personal token credentials, subreddit and post type set  
   - Edge cases: Reddit API limits, subreddit posting restrictions.

5. **Wait** (See above)  
   - Used to control timing between posting steps to avoid throttling.

---

#### 1.5 Response Handling

- **Overview:**  
  Aggregates results from all social platform posts and sends a response back to the webhook caller or manual trigger user.

- **Nodes Involved:**  
  - Merge Results For Response  
  - Respond to Webhook

- **Node Details:**

1. **Merge Results For Response**  
   - Type: Merge  
   - Role: Combines outputs from Create Tweet, Create a post (LinkedIn), and Post Reddit nodes into single array/object  
   - Edge cases: Mismatched data shapes; ensures all posts have returned before responding.

2. **Respond to Webhook**  
   - Type: Respond to Webhook  
   - Role: Sends aggregated success or failure status back to the external caller of the webhook  
   - Edge cases: Timeout if upstream nodes delayed; ensure proper HTTP status codes.

---

### 3. Summary Table

| Node Name                  | Node Type                      | Functional Role                             | Input Node(s)                       | Output Node(s)                      | Sticky Note |
|----------------------------|--------------------------------|--------------------------------------------|-----------------------------------|-----------------------------------|-------------|
| When clicking ‘Execute workflow’ | Manual Trigger                | Manual start trigger                         |                                   | Edit Fields                       |             |
| Pass URL                   | Webhook                        | Receives blog URL input                       |                                   | Set Link                         |             |
| Schedule Trigger           | Schedule Trigger               | Periodic workflow trigger                     |                                   | RSS Read                        |             |
| RSS Read                   | RSS Feed Read                 | Reads blog posts from RSS feed                | Schedule Trigger                 | Execute a SQL query               |             |
| Execute a SQL query        | Postgres                      | Filters posts using SQL                         | RSS Read                        | If                              |             |
| If                        | Conditional                   | Filters posts based on criteria                 | Execute a SQL query              | Loop Over Items (true branch)    |             |
| Set Link                  | Set                          | Prepares URL for HTTP request                    | Pass URL                        | HTTP Request                    |             |
| HTTP Request              | HTTP Request                 | Fetches blog HTML content                         | Set Link                        | HTML                           |             |
| HTML                      | HTML Extractor               | Extracts blog content from HTML                   | HTTP Request                   | Message a model                |             |
| Message a model           | LangChain OpenAI (GPT-4)      | Generates post text from blog content            | HTML                           | Wait, Wait 5s, Post Reddit     |             |
| Wait                      | Wait                         | Controls pacing before image generation           | Message a model                | Generate Image for X            |             |
| Wait 5s                   | Wait                         | Controls pacing before LinkedIn image generation | Message a model                | Generate an image for LinkedIn |             |
| Generate Image for X       | LangChain OpenAI (Image)       | Generates image for X post                        | Wait                          | Twitter Post Media             |             |
| Generate an image for LinkedIn | LangChain OpenAI (Image)       | Generates image for LinkedIn post                   | Wait 5s                       | Create a post                 |             |
| Twitter Post Media         | HTTP Request                 | Uploads media to Twitter API                        | Generate Image for X           | Create Tweet                 |             |
| Create Tweet              | Twitter                      | Posts tweet with media                             | Twitter Post Media             | Merge Results For Response      |             |
| Create a post             | LinkedIn                     | Posts content + image to LinkedIn                   | Generate an image for LinkedIn | Merge Results For Response      |             |
| Post Reddit               | Reddit                       | Posts content to subreddit                          | Message a model                | Merge Results For Response      |             |
| Loop Over Items           | SplitInBatches               | Processes posts in batches                         | If                            | Call Post Social                |             |
| Call Post Social          | HTTP Request                 | Posts social content, loops over batches           | Loop Over Items               | Loop Over Items                |             |
| Merge Results For Response | Merge                        | Aggregates social post results                      | Create Tweet, Create a post, Post Reddit | Respond to Webhook         |             |
| Respond to Webhook        | Respond to Webhook           | Sends response back to caller                       | Merge Results For Response    |                               |             |
| Edit Fields               | Set                          | Prepares data for manual post trigger                | When clicking ‘Execute workflow’ | Post Social Manual           |             |
| Post Social Manual        | HTTP Request                 | Posts social content manually triggered               | Edit Fields                   |                               |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger node**  
   - Name: When clicking ‘Execute workflow’  
   - Purpose: Start workflow manually.

2. **Create Webhook node**  
   - Name: Pass URL  
   - Configure webhook URL for receiving blog URLs  
   - Output to a Set node.

3. **Create Set node**  
   - Name: Set Link  
   - Configure to format input URL for HTTP request  
   - Connect output of Pass URL to Set Link.

4. **Create HTTP Request node**  
   - Name: HTTP Request  
   - Configure to GET the blog URL from Set Link  
   - Connect Set Link output to HTTP Request.

5. **Create HTML node**  
   - Name: HTML  
   - Configure to extract blog text (using CSS selectors or XPath) from HTTP Request output  
   - Connect HTTP Request to HTML.

6. **Create LangChain OpenAI node**  
   - Name: Message a model  
   - Credential: OpenAI API key with GPT-4 access  
   - Configure prompt to generate social post text based on extracted blog content  
   - Connect HTML output to this node.

7. **Create Wait nodes**  
   - Name: Wait and Wait 5s  
   - Configure appropriate delay times (e.g., seconds)  
   - Connect Message a model output to both Wait nodes.

8. **Create two LangChain OpenAI image generation nodes**  
   - Names: Generate an image for LinkedIn, Generate Image for X  
   - Credential: OpenAI API key  
   - Configure prompts tailored for each platform’s image style  
   - Connect Wait 5s to LinkedIn image node, Wait to X image node.

9. **Create HTTP Request node**  
   - Name: Twitter Post Media  
   - Configure for Twitter media upload endpoint with OAuth1 credentials  
   - Connect Generate Image for X output to this node.

10. **Create Twitter node**  
    - Name: Create Tweet  
    - Configure OAuth1 credentials  
    - Use media ID from Twitter Post Media node  
    - Connect Twitter Post Media output to Create Tweet.

11. **Create LinkedIn node**  
    - Name: Create a post  
    - Configure OAuth2 credentials for LinkedIn  
    - Include text from Message a model and image from LinkedIn image node  
    - Connect Generate an image for LinkedIn output to Create a post.

12. **Create Reddit node**  
    - Name: Post Reddit  
    - Configure OAuth2 or personal token credentials  
    - Set subreddit and post type  
    - Connect Message a model output to Post Reddit.

13. **Create Merge node**  
    - Name: Merge Results For Response  
    - Configure to combine results from Create Tweet, Create a post, and Post Reddit nodes  
    - Connect all three outputs to Merge.

14. **Create Respond to Webhook node**  
    - Name: Respond to Webhook  
    - Connect Merge output to Respond node output  
    - Configure to send back success/failure JSON.

15. **Create Schedule Trigger node**  
    - Name: Schedule Trigger  
    - Set to desired frequency (e.g., daily)  
    - Connect to RSS Read node.

16. **Create RSS Feed Read node**  
    - Name: RSS Read  
    - Configure RSS feed URL  
    - Connect Schedule Trigger output to RSS Read.

17. **Create Postgres node**  
    - Name: Execute a SQL query  
    - Configure DB credentials and query to filter new posts  
    - Connect RSS Read to this node.

18. **Create If node**  
    - Name: If  
    - Configure condition to check SQL query results  
    - True branch to SplitInBatches node.

19. **Create SplitInBatches node**  
    - Name: Loop Over Items  
    - Configure batch size (e.g., 1-5)  
    - Connect If true branch to this node.

20. **Create HTTP Request node**  
    - Name: Call Post Social  
    - Configure to post social content (internal API or modular call)  
    - Connect Loop Over Items to Call Post Social, and Call Post Social back to Loop Over Items for iteration.

21. **Create Set node**  
    - Name: Edit Fields  
    - Configure for manual trigger data preparation  
    - Connect When clicking ‘Execute workflow’ to Edit Fields, then to Post Social Manual HTTP Request node.

22. **Create HTTP Request node**  
    - Name: Post Social Manual  
    - Configure for manual social posting API  
    - Connect Edit Fields output to Post Social Manual.

---

### 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                        |
|------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| The workflow uses GPT-4 via LangChain OpenAI nodes for text and image generation.                      | OpenAI API documentation: https://openai.com/docs    |
| OAuth2 credentials required for LinkedIn, Reddit; OAuth1 for Twitter (X).                             | n8n credential setup docs: https://docs.n8n.io/       |
| Wait nodes included to avoid API rate limits and throttling issues.                                   | n8n documentation on rate limiting                     |
| SQL query node expects Postgres database with posts tracking for deduplication or filtering.          | Ensure database credentials and queries are secure    |
| The workflow supports both manual and scheduled execution via webhook and schedule triggers.          | Webhook URL must be publicly accessible for external calls |
| Media upload for Twitter requires separate HTTP Request node before tweet creation.                    | Twitter API media upload docs: https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media |
| The workflow merges results from all social posts to send a consolidated response to the caller.     | Useful for monitoring multi-platform posting success  |
| Sticky Notes in the original workflow are placeholders without content; no additional comments noted. |                                                       |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created with n8n, a workflow automation tool. The processing strictly complies with content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.