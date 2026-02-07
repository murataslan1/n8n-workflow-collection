AI-Powered Blog Post Promoter for Instagram, Facebook & X with GPT

https://n8nworkflows.xyz/workflows/ai-powered-blog-post-promoter-for-instagram--facebook---x-with-gpt-4033


# AI-Powered Blog Post Promoter for Instagram, Facebook & X with GPT

### 1. Workflow Overview

This workflow automates the promotion of new blog posts by generating and publishing tailored social media content on Instagram, Facebook, and X (formerly Twitter). It targets bloggers, content creators, and marketing teams seeking to streamline social sharing with AI-generated captions and images, ensuring consistent engagement without manual effort.

The workflow is organized into the following logical blocks:

- **1.1 Input Reception and Deduplication:** Detect new blog posts from an RSS feed and verify against Google Sheets history to avoid reposting.
- **1.2 AI Content Generation:** Use GPT-4 to create platform-specific captions and call GPT-Image to generate customized visuals.
- **1.3 Image Processing & Hosting:** Upload generated images to hosting services (ImgBB and Cloudinary) for accessibility in posts.
- **1.4 Social Media Publishing:** Publish posts on Instagram and Facebook via Meta Graph API and on X via Twitter API.
- **1.5 Logging and Notifications:** Log published posts in Google Sheets and send a summary email with previews to the user.
- **1.6 Control and Error Handling:** Conditional checks and code nodes ensure smooth flow and handle duplicates or failures.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Deduplication

**Overview:**  
This block monitors the RSS feed for new blog posts and prevents duplicate promotions by cross-referencing a Google Sheets log of previously posted content.

**Nodes Involved:**  
- RSS Feed Trigger  
- Edit Fields  
- History BLOG (Google Sheets)  
- Aggregate1  
- Code  
- If

**Node Details:**

- **RSS Feed Trigger**  
  - *Type:* RSS Feed Read Trigger  
  - *Role:* Watches the RSS feed URL for new blog post entries.  
  - *Configuration:* Set to poll the RSS feed URL (configured externally). Outputs new posts as they appear.  
  - *Connections:* Output to Edit Fields.  
  - *Edge Cases:* RSS feed downtime, malformed entries, or delays in feed updates might delay triggering.

- **Edit Fields**  
  - *Type:* Set Node  
  - *Role:* Prepares and formats fields from RSS data for further processing, possibly extracting title, link, date.  
  - *Connections:* Input from RSS Feed Trigger; output to History BLOG.  
  - *Edge Cases:* Missing or unexpected RSS fields might cause empty or incorrect data.

- **History BLOG**  
  - *Type:* Google Sheets  
  - *Role:* Reads the spreadsheet containing history of published blog posts.  
  - *Configuration:* Points to a Google Sheet ID and reads rows storing URLs or identifiers of posted blogs.  
  - *Connections:* Input from Edit Fields; output to Aggregate1.  
  - *Edge Cases:* Google API quota limits, auth failures.

- **Aggregate1**  
  - *Type:* Aggregate  
  - *Role:* Aggregates the sheet data to a convenient format for comparison.  
  - *Connections:* Input from History BLOG; output to Code node.

- **Code**  
  - *Type:* Code Node (JavaScript)  
  - *Role:* Checks if the current blog post URL is already in history to avoid duplicates.  
  - *Connections:* Input from Aggregate1; output to If node.

- **If**  
  - *Type:* Conditional Node  
  - *Role:* Routes workflow based on the duplicate check: proceeds if the post is new, stops otherwise.  
  - *Connections:* True branch to Social Media Content Creator node.

---

#### 2.2 AI Content Generation

**Overview:**  
This block uses GPT-4 via LangChain nodes to generate unique social media captions based on blog content and brand tone. It also parses AI output into structured formats.

**Nodes Involved:**  
- gpt-4.1 mini (LangChain LM Chat OpenAI)  
- Social Media Content (LangChain Output Parser Structured)  
- Social Media Content Creator (LangChain Agent)

**Node Details:**

- **gpt-4.1 mini**  
  - *Type:* LangChain LM Chat OpenAI  
  - *Role:* Calls GPT-4 to generate text content for social media posts.  
  - *Configuration:* Uses OpenAI credentials; prompt includes blog post content and style guidelines.  
  - *Connections:* AI output to Social Media Content parser, and as input for Social Media Content Creator agent.  
  - *Edge Cases:* API rate limits, prompt errors, or incomplete AI responses.

- **Social Media Content**  
  - *Type:* LangChain Output Parser Structured  
  - *Role:* Parses GPT output into structured JSON for easy downstream use (captions, hashtags, call-to-action).  
  - *Connections:* Output to Social Media Content Creator.

- **Social Media Content Creator**  
  - *Type:* LangChain Agent  
  - *Role:* Orchestrates AI tasks, manages prompt engineering, and splits content generation per platform (Instagram, Facebook, X).  
  - *Connections:* Receives parsed content; outputs structured captions and metadata for image generation and posting nodes.  
  - *RetryOnFail:* Enabled to handle transient AI failures.

---

#### 2.3 Image Processing & Hosting

**Overview:**  
Generates AI images using OpenAI Image API and uploads them to ImgBB and Cloudinary for hosting, ensuring accessible URLs for social media posting.

**Nodes Involved:**  
- Create image open ai  
- Save Image to imgbb.com  
- Get image from imgbb  
- Post image Cloudianry  
- Create image open ai2  
- Save Image to imgbb.com3  
- Get image from imgbb1  
- Post image Cloudianry1

**Node Details:**

- **Create image open ai / Create image open ai2**  
  - *Type:* HTTP Request  
  - *Role:* Calls OpenAI's Image Generation API with prompts derived from AI content creator. Different nodes may handle different image orientations or platforms.  
  - *Connections:* Output to respective image hosting nodes.  
  - *Edge Cases:* API quota, image generation failures, malformed requests.

- **Save Image to imgbb.com / Save Image to imgbb.com3**  
  - *Type:* HTTP Request  
  - *Role:* Uploads generated images to ImgBB for temporary hosting.  
  - *Connections:* Output to Get image from imgbb nodes.  
  - *Edge Cases:* Upload failures, ImgBB API limits.

- **Get image from imgbb / Get image from imgbb1**  
  - *Type:* HTTP Request  
  - *Role:* Extracts hosted image URLs or metadata from ImgBB response.  
  - *Connections:* Output to Post image Cloudinary nodes.

- **Post image Cloudianry / Post image Cloudianry1**  
  - *Type:* HTTP Request  
  - *Role:* Uploads images to Cloudinary for more permanent hosting or CDN delivery.  
  - *Connections:* Output to Merge nodes for social media posting.  
  - *Edge Cases:* Cloudinary auth failures, upload errors.

---

#### 2.4 Social Media Publishing

**Overview:**  
Uploads media and publishes posts on Instagram and Facebook via Meta Graph API, and posts tweets with images to X via Twitter API.

**Nodes Involved:**  
- Upload media to Instagram  
- Publish Post on IG  
- Facebook Post1  
- X

**Node Details:**

- **Upload media to Instagram**  
  - *Type:* Facebook Graph API Node  
  - *Role:* Uploads media file to Instagram Business account.  
  - *Connections:* Input from Merge3 (images and captions); output to Publish Post on IG.  
  - *Credential:* Meta Graph API OAuth2.  
  - *Edge Cases:* Token expiry, media upload limits.

- **Publish Post on IG**  
  - *Type:* Facebook Graph API Node  
  - *Role:* Creates the Instagram post using the uploaded media and caption.  
  - *Connections:* Input from Upload media to Instagram; output to Merge node.

- **Facebook Post1**  
  - *Type:* Facebook Graph API Node  
  - *Role:* Publishes Facebook post with generated caption and image.  
  - *Connections:* Input from Merge4; output to Merge node.  
  - *Error Handling:* On error, continues workflow output to avoid full stop.

- **X**  
  - *Type:* Twitter Node  
  - *Role:* Posts tweet with text and image URL.  
  - *Connections:* Receives input from Social Media Content Creator and Merge nodes.  
  - *Credential:* Twitter OAuth2.  
  - *Edge Cases:* Twitter API rate limits, media upload restrictions.

---

#### 2.5 Logging and Notifications

**Overview:**  
Logs successful post data in Google Sheets and sends an email summary with posts preview and analytics.

**Nodes Involved:**  
- Aggregate  
- Update Blog History (Google Sheets)  
- Add too Data Bank (Google Sheets)  
- Gmail

**Node Details:**

- **Aggregate**  
  - *Type:* Aggregate  
  - *Role:* Consolidates data from social media post responses for logging.  
  - *Connections:* Input from Merge; output to Update Blog History.

- **Update Blog History**  
  - *Type:* Google Sheets  
  - *Role:* Records published blog post metadata and posting dates to prevent duplicates.  
  - *Connections:* Input from Aggregate; output to Add too Data Bank.

- **Add too Data Bank**  
  - *Type:* Google Sheets  
  - *Role:* Adds detailed analytics or post metadata to a secondary sheet for data tracking.  
  - *Connections:* Input from Update Blog History; output to Gmail.

- **Gmail**  
  - *Type:* Gmail Node  
  - *Role:* Sends a formatted email summary including post previews and image thumbnails.  
  - *Connections:* Input from Add too Data Bank.  
  - *Credential:* Gmail OAuth2.  
  - *Edge Cases:* Email quota, invalid email addresses.

---

#### 2.6 Control and Error Handling

**Overview:**  
Ensures the workflow processes only new posts and gracefully handles errors or retries during AI content generation.

**Nodes Involved:**  
- Code  
- If  
- Social Media Content Creator (retry enabled)

**Details:**  
- The Code node implements logic to detect duplicates.  
- The If node directs flow based on that result.  
- Social Media Content Creator retries on failure to handle transient AI issues.

---

### 3. Summary Table

| Node Name                   | Node Type                             | Functional Role                         | Input Node(s)              | Output Node(s)                    | Sticky Note                                   |
|-----------------------------|-------------------------------------|---------------------------------------|----------------------------|---------------------------------|-----------------------------------------------|
| RSS Feed Trigger            | RSS Feed Read Trigger                | Detect new blog posts                  |                            | Edit Fields                     |                                               |
| Edit Fields                | Set                                 | Format and prepare RSS data            | RSS Feed Trigger            | History BLOG                    |                                               |
| History BLOG               | Google Sheets                       | Read posted blog history               | Edit Fields                 | Aggregate1                     |                                               |
| Aggregate1                 | Aggregate                           | Aggregate history data                 | History BLOG                | Code                          |                                               |
| Code                       | Code                               | Check for duplicate posts              | Aggregate1                  | If                            |                                               |
| If                         | If                                 | Conditional flow for duplicates        | Code                       | Social Media Content Creator    |                                               |
| gpt-4.1 mini               | LangChain LM Chat OpenAI            | Generate AI captions                   | Social Media Content (AI parser) | Social Media Content Creator    |                                               |
| Social Media Content       | LangChain Output Parser Structured  | Parse AI output into structured data  | gpt-4.1 mini (AI output)    | Social Media Content Creator    |                                               |
| Social Media Content Creator| LangChain Agent                    | Orchestrate AI generation per platform | If                         | Edit Fields2, Create image open ai2, Edit Fields1, Create image open ai, X |                                               |
| Create image open ai       | HTTP Request                       | Generate AI image (1st set)            | Social Media Content Creator | Save Image to imgbb.com         |                                               |
| Save Image to imgbb.com    | HTTP Request                       | Upload image to ImgBB                   | Create image open ai        | Get image from imgbb1           |                                               |
| Get image from imgbb1      | HTTP Request                       | Retrieve ImgBB hosted image URL        | Save Image to imgbb.com     | Post image Cloudianry1          |                                               |
| Post image Cloudianry1     | HTTP Request                       | Upload image to Cloudinary              | Get image from imgbb1       | Merge4                        |                                               |
| Create image open ai2      | HTTP Request                       | Generate AI image (2nd set)             | Social Media Content Creator | Save Image to imgbb.com3        |                                               |
| Save Image to imgbb.com3   | HTTP Request                       | Upload image to ImgBB                   | Create image open ai2       | Get image from imgbb            |                                               |
| Get image from imgbb       | HTTP Request                       | Retrieve ImgBB hosted image URL        | Save Image to imgbb.com3    | Post image Cloudianry           |                                               |
| Post image Cloudianry      | HTTP Request                       | Upload image to Cloudinary              | Get image from imgbb        | Merge3                        |                                               |
| Merge3                     | Merge                              | Combine Instagram image & caption data | Post image Cloudianry       | Upload media to Instagram       |                                               |
| Upload media to Instagram  | Facebook Graph API                 | Upload media to Instagram               | Merge3                      | Publish Post on IG              |                                               |
| Publish Post on IG         | Facebook Graph API                 | Publish Instagram post                  | Upload media to Instagram   | Merge                         |                                               |
| Merge4                     | Merge                              | Combine Facebook post data              | Post image Cloudianry1      | Facebook Post1                 |                                               |
| Facebook Post1             | Facebook Graph API                 | Publish Facebook post                   | Merge4                      | Merge                         |                                               |
| Merge                      | Merge                              | Combine posts for logging               | Facebook Post1, Publish Post on IG, X | Aggregate                   |                                               |
| Aggregate                  | Aggregate                         | Aggregate post data for logging         | Merge                      | Update Blog History            |                                               |
| Update Blog History        | Google Sheets                     | Log published post metadata             | Aggregate                   | Add too Data Bank              |                                               |
| Add too Data Bank          | Google Sheets                     | Add detailed analytics                   | Update Blog History         | Gmail                         |                                               |
| Gmail                     | Gmail                             | Send email summary with previews        | Add too Data Bank           |                               |                                               |
| X                         | Twitter                          | Publish tweet with caption and image    | Social Media Content Creator | Merge                         |                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create RSS Feed Trigger Node**  
   - Type: RSS Feed Read Trigger  
   - Set the RSS feed URL for your blog.  
   - Configure polling frequency or manual execution.

2. **Add Set Node "Edit Fields"**  
   - Extract and format fields from RSS feed items (e.g., title, link, date).  
   - Connect output of RSS Feed Trigger to this node.

3. **Add Google Sheets Node "History BLOG"**  
   - Connect to your Google Sheets containing blog post history (spreadsheet ID required).  
   - Configure to read rows from the sheet.  
   - Connect output of Edit Fields node here.

4. **Add Aggregate Node "Aggregate1"**  
   - Aggregate the list of URLs or identifiers from Google Sheets to a list.  
   - Connect from History BLOG.

5. **Add Code Node "Code"**  
   - Write JavaScript to check if current blog post URL exists in the history list aggregated.  
   - Output a boolean for conditional logic.  
   - Connect from Aggregate1.

6. **Add If Node "If"**  
   - Add condition checking the boolean output from Code node.  
   - True branch proceeds, false branch ends or stops.

7. **Add LangChain LM Chat OpenAI Node "gpt-4.1 mini"**  
   - Configure OpenAI credentials.  
   - Configure prompt to generate captions based on blog post content and brand tone.  
   - Connect to output of Social Media Content parser node (see below).

8. **Add LangChain Output Parser Structured Node "Social Media Content"**  
   - Parse GPT output into JSON object separating captions for Instagram, Facebook, and X.  
   - Connect output of gpt-4.1 mini here.

9. **Add LangChain Agent Node "Social Media Content Creator"**  
   - Orchestrate AI calls and generate platform-specific content.  
   - Enable retry on fail.  
   - Connect from If node (true branch) and from Social Media Content parser.

10. **Create Image Generation HTTP Request Nodes**  
    - "Create image open ai" and "Create image open ai2"  
    - Configure HTTP POST calls to OpenAI Image generation API with prompts from AI content creator.  
    - Connect outputs from Social Media Content Creator to these nodes.

11. **Create ImgBB HTTP Request Nodes**  
    - "Save Image to imgbb.com" and "Save Image to imgbb.com3"  
    - Configure HTTP POST to ImgBB API using image data from OpenAI response.  
    - Connect from respective Create image nodes.

12. **Create ImgBB Retrieval HTTP Request Nodes**  
    - "Get image from imgbb" and "Get image from imgbb1"  
    - Extract hosted image URLs from ImgBB API responses.  
    - Connect from ImgBB save nodes.

13. **Create Cloudinary Upload HTTP Request Nodes**  
    - "Post image Cloudianry" and "Post image Cloudianry1"  
    - Upload images to Cloudinary via API call.  
    - Connect from Get image from imgbb nodes.

14. **Add Merge Nodes "Merge3" and "Merge4"**  
    - Combine image URLs and captions for Instagram (Merge3) and Facebook (Merge4).  
    - Connect from respective Cloudinary upload nodes.

15. **Add Facebook Graph API Nodes**  
    - "Upload media to Instagram" (upload image) connected from Merge3.  
    - "Publish Post on IG" connected from Upload media.  
    - "Facebook Post1" connected from Merge4 for Facebook posting.  
    - Configure Meta OAuth2 credentials.

16. **Add Twitter Node "X"**  
    - Configure Twitter OAuth2 credentials.  
    - Connect from Social Media Content Creator (caption and image URL).  
    - Connect output to Merge node.

17. **Add Merge Node "Merge"**  
    - Combine outputs from Publish Post on IG, Facebook Post1, and X node.  
    - Connect output to Aggregate node.

18. **Add Aggregate Node "Aggregate"**  
    - Aggregate post results for logging.  
    - Connect from Merge.

19. **Add Google Sheets Node "Update Blog History"**  
    - Log new post metadata (URL, date) to blog history sheet.  
    - Connect from Aggregate.

20. **Add Google Sheets Node "Add too Data Bank"**  
    - Log detailed analytics or secondary data.  
    - Connect from Update Blog History.

21. **Add Gmail Node "Gmail"**  
    - Configure Gmail OAuth2 credentials.  
    - Send formatted email with post previews and images.  
    - Connect from Add too Data Bank.

22. **Configure Error Handling and Retries**  
    - Enable retry on fail for Social Media Content Creator node.  
    - Configure error output handling in Facebook Post1 to continue on error.

23. **Add any additional Set nodes** ("Edit Fields1", "Edit Fields2") and Merge nodes as needed  
    - For formatting data before image generation or posting.

24. **Test entire workflow manually before scheduling**  
    - Validate each step, especially API calls and credentials.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                          |
|----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Connect required APIs: OpenAI (text & images), ImgBB or Cloudinary, Meta (IG/FB), X (Twitter), Google Sheets, Gmail. | Essential setup instruction before running the workflow.                                                 |
| Customize AI prompts with your blog name, tone of voice, and preferred call-to-action.              | Personalization for better brand alignment.                                                             |
| Workflow supports scheduling via n8n's Schedule Trigger to automate daily checks.                   | Enables full automation without manual runs.                                                           |
| Meta Graph API requires Instagram Business account linked to Facebook Page with appropriate permissions. | Required for Instagram and Facebook posting nodes.                                                      |
| Twitter API requires OAuth2 with media upload permissions for posting tweets with images.            | Credential setup required for X node.                                                                    |
| Google Sheets quota limits may affect logging frequency; consider batch updates if necessary.       | To avoid API rate limits on Google Sheets integration.                                                  |
| Gmail API quota limits apply; ensure sending limits are not exceeded.                               | For email notification node.                                                                             |

---

This comprehensive reference enables understanding, modification, and full reproduction of the AI-Powered Blog Post Promoter workflow in n8n. It anticipates integration points, error cases, and provides a clear path to rebuild or extend the automation.