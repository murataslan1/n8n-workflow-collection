Automate RSS Content to Blog Posts with GPT-4o, WordPress & LinkedIn Publishing

https://n8nworkflows.xyz/workflows/automate-rss-content-to-blog-posts-with-gpt-4o--wordpress---linkedin-publishing-4226


# Automate RSS Content to Blog Posts with GPT-4o, WordPress & LinkedIn Publishing

### 1. Workflow Overview

This workflow automates the process of transforming fresh RSS feed articles into blog posts using GPT-4o AI, then publishing them on WordPress and LinkedIn, with review and approval steps integrated. It targets content creators and marketers seeking a fully automated pipeline for content curation, AI-assisted blog generation, and multi-channel publishing.

The workflow is logically divided into these main blocks:

- **1.1 Content Acquisition**: Scheduled daily trigger fetches multiple RSS feeds, merges them, and filters articles published within the last 24 hours.
- **1.2 Content Extraction & Formatting**: Extracts key article metadata, fetches full article content, extracts main body HTML, then converts it into Markdown.
- **1.3 AI Processing & SEO**: Uses OpenAI GPT models to generate SEO keywords and transform the content into a high-quality blog post.
- **1.4 Blog Post Preparation & Storage**: Sets metadata fields, formats the blog post for storage, adds featured images, then saves initial blog posts into Google Sheets.
- **1.5 Review & Approval Handling**: Sends notification emails for manual review, waits for approval or rejection via webhook, updates status accordingly.
- **1.6 Final Publishing & Notifications**: Publishes approved posts to WordPress and LinkedIn, updates publish status, sends completion notifications via Telegram, and limits posting rates with delays.

---

### 2. Block-by-Block Analysis

#### 1.1 Content Acquisition

- **Overview:**  
  This block triggers the workflow daily at 7 AM, reads articles from two RSS feeds (The Verge and TechCrunch), merges their results, and filters articles published within the last 24 hours.

- **Nodes Involved:**  
  Schedule Trigger, RSS TechCrunch, RSS TheVerge, Merge RSS Feeds, Date Filter

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates the workflow every day at 7 AM  
    - Config: Default daily schedule at 07:00  
    - Inputs: None  
    - Outputs: RSS TechCrunch, RSS TheVerge nodes  
    - Failures: Scheduling issues, time zone misconfigurations

  - **RSS TechCrunch**  
    - Type: RSS Feed Read  
    - Role: Reads latest articles from TechCrunch RSS feed  
    - Config: RSS URL for TechCrunch feed  
    - Inputs: From Schedule Trigger  
    - Outputs: Merge RSS Feeds (as second input)  
    - Failures: Feed unreachable, malformed RSS XML

  - **RSS TheVerge**  
    - Type: RSS Feed Read  
    - Role: Reads latest articles from The Verge RSS feed  
    - Config: RSS URL for The Verge feed  
    - Inputs: From Schedule Trigger  
    - Outputs: Merge RSS Feeds (as first input)  
    - Failures: Feed unreachable, malformed RSS XML

  - **Merge RSS Feeds**  
    - Type: Merge  
    - Role: Combines feed items from both RSS sources into a single stream  
    - Config: Default merging (append)  
    - Inputs: RSS TheVerge (primary), RSS TechCrunch (secondary)  
    - Outputs: Date Filter  
    - Failures: Merging with empty inputs, data inconsistency

  - **Date Filter**  
    - Type: If  
    - Role: Filters articles published within the last 24 hours using publish date  
    - Config: Expression comparing article date against current date minus 24h  
    - Inputs: Merge RSS Feeds  
    - Outputs: Limit Articles (true branch)  
    - Failures: Date parsing errors, missing publication dates

#### 1.2 Content Extraction & Formatting

- **Overview:**  
  Extracts important metadata from filtered articles, downloads full article HTML content, extracts main article body using CSS selectors, then converts HTML to Markdown for AI processing.

- **Nodes Involved:**  
  Limit Articles, Extract Content, Fetch Full Article, Extract Article Body, Convert to Markdown

- **Node Details:**

  - **Limit Articles**  
    - Type: Limit  
    - Role: Limits the number of articles processed to 5 to avoid overload  
    - Config: Limit count = 5  
    - Inputs: Date Filter (true branch)  
    - Outputs: Extract Content  
    - Failures: None expected unless input empty

  - **Extract Content**  
    - Type: Function  
    - Role: Extracts article title, description, link, and publication date from RSS item  
    - Config: Custom JavaScript extracting these fields from item JSON  
    - Inputs: Limit Articles  
    - Outputs: Fetch Full Article  
    - Failures: Missing expected fields, malformed input data

  - **Fetch Full Article**  
    - Type: HTTP Request  
    - Role: Downloads full article HTML content from article URL  
    - Config: URL taken from extracted link field, GET request  
    - Inputs: Extract Content  
    - Outputs: Extract Article Body  
    - Failures: HTTP errors (404, 500), timeouts, redirects

  - **Extract Article Body**  
    - Type: HTML Extract  
    - Role: Parses HTML to extract main article content using CSS selector (configured per site specifics)  
    - Config: CSS selector targeting main content, always output data enabled  
    - Inputs: Fetch Full Article  
    - Outputs: Convert to Markdown  
    - Failures: Selector mismatch, empty content extraction

  - **Convert to Markdown**  
    - Type: Function  
    - Role: Converts extracted HTML content into Markdown for better AI understanding  
    - Config: Custom script using HTML-to-Markdown conversion library or regex  
    - Inputs: Extract Article Body  
    - Outputs: Generate SEO Keywords  
    - Failures: Conversion errors, malformed HTML input

#### 1.3 AI Processing & SEO

- **Overview:**  
  Calls OpenAI GPT models to generate SEO keywords and produce a comprehensive AI-written blog post based on Markdown content.

- **Nodes Involved:**  
  Generate SEO Keywords, Generate Blog Post, OpenAI Chat Model1

- **Node Details:**

  - **Generate SEO Keywords**  
    - Type: OpenAI Node  
    - Role: Requests SEO keyword suggestions from OpenAI based on article content  
    - Config: Model set to OpenAI GPT, prompt crafted for keyword generation  
    - Inputs: Convert to Markdown  
    - Outputs: Generate Blog Post  
    - Failures: API auth errors, rate limiting

  - **Generate Blog Post**  
    - Type: LangChain Agent  
    - Role: Uses GPT-4o to generate a full blog post from SEO keywords and article Markdown  
    - Config: Agent with prompt template for blog post creation  
    - Inputs: Generate SEO Keywords output via OpenAI Chat Model1  
    - Outputs: Set Blog Creation Date  
    - Failures: AI generation errors, timeout, malformed input data

  - **OpenAI Chat Model1**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Backend for Generate Blog Post node, handling GPT-4o chat requests  
    - Config: OpenAI credentials, model parameters  
    - Inputs: Generate Blog Post (ai_languageModel input)  
    - Outputs: Generate Blog Post (ai_languageModel output)  
    - Failures: API key invalid, network issues

#### 1.4 Blog Post Preparation & Storage

- **Overview:**  
  Sets blog post metadata fields including creation date, formats content for storage, adds featured image data, and stores initial posts in Google Sheets.

- **Nodes Involved:**  
  Set Blog Creation Date, Set Fields, Format Fields for Storage, Add Featured Image, Store Blog Posts Initial

- **Node Details:**

  - **Set Blog Creation Date**  
    - Type: Code  
    - Role: Adds or formats the blog post creation date field  
    - Config: Custom JavaScript adding current date or formatting input date  
    - Inputs: Generate Blog Post  
    - Outputs: Set Fields  
    - Failures: Date formatting errors

  - **Set Fields**  
    - Type: Set  
    - Role: Sets or adjusts blog post fields such as title, content, author, status  
    - Config: Static and expression-based field assignments  
    - Inputs: Set Blog Creation Date  
    - Outputs: Format Fields for Storage  
    - Failures: Missing required fields

  - **Format Fields for Storage**  
    - Type: Code  
    - Role: Structures blog post data for storage in Google Sheets (e.g., flattening objects, setting cell order)  
    - Config: Custom JavaScript for data transformation  
    - Inputs: Set Fields  
    - Outputs: Add Featured Image  
    - Failures: Data structure mismatches

  - **Add Featured Image**  
    - Type: Code  
    - Role: Adds or generates featured image URLs or metadata for the blog post  
    - Config: Custom JavaScript to fetch or assign images  
    - Inputs: Format Fields for Storage  
    - Outputs: Store Blog Posts Initial  
    - Failures: Missing image URLs, external resource errors

  - **Store Blog Posts Initial**  
    - Type: Google Sheets  
    - Role: Stores the prepared blog posts with metadata in a Google Sheets document for tracking and review  
    - Config: Google Sheets credentials, target spreadsheet and sheet, write mode append/update  
    - Inputs: Add Featured Image  
    - Outputs: Prepare Fields For Notification  
    - Failures: Credential errors, API limits, sheet not found

#### 1.5 Review & Approval Handling

- **Overview:**  
  Prepares notification fields, sends review request emails, handles webhook-based approval or rejection, updates approval status in Google Sheets, and manages rejection notifications.

- **Nodes Involved:**  
  Prepare Fields Foor Notification, Notify for Review, Approval Webhook, Update Approve Status, Fetch Row, Check Status, Notify Rejection, Wait for Status Update

- **Node Details:**

  - **Prepare Fields Foor Notification**  
    - Type: Set  
    - Role: Prepares email content fields for the review notification  
    - Config: Sets subject, body, recipients etc. for Gmail node  
    - Inputs: Store Blog Posts Initial  
    - Outputs: Notify for Review  
    - Failures: Missing email addresses

  - **Notify for Review**  
    - Type: Gmail  
    - Role: Sends an email to reviewers asking for blog post approval  
    - Config: Gmail OAuth2 credentials, email parameters from previous node  
    - Inputs: Prepare Fields Foor Notification  
    - Outputs: None (end of this branch)  
    - Failures: Authentication errors, quota exceeded

  - **Approval Webhook**  
    - Type: Webhook  
    - Role: Receives approval or rejection responses from reviewers via HTTP POST  
    - Config: Public webhook URL with method POST  
    - Inputs: External HTTP requests  
    - Outputs: Update Approve Status  
    - Failures: Webhook unreachable, malformed payloads

  - **Update Approve Status**  
    - Type: Google Sheets  
    - Role: Updates approval status field in Google Sheets based on webhook input  
    - Config: Sheet ID, range, write mode update  
    - Inputs: Approval Webhook  
    - Outputs: None  
    - Failures: Permission errors, row not found

  - **Fetch Row**  
    - Type: Google Sheets Trigger  
    - Role: Triggered when a row is updated, fetches updated blog post data for status check  
    - Config: Google Sheets credentials, watch mode on approval sheet  
    - Inputs: None (trigger)  
    - Outputs: Check Status  
    - Failures: Failure to detect row changes

  - **Check Status**  
    - Type: Switch  
    - Role: Routes flow based on approval status: approved, rejected, or pending  
    - Config: Switch on status field value  
    - Inputs: Fetch Row  
    - Outputs:  
      - Approved → Check if Already Published  
      - Rejected → Notify Rejection  
      - Pending → Wait for Status Update  
    - Failures: Unexpected status values

  - **Notify Rejection**  
    - Type: Gmail  
    - Role: Sends notification email informing about rejection  
    - Config: Gmail OAuth2 credentials, email content  
    - Inputs: Check Status (rejected branch)  
    - Outputs: None  
    - Failures: Email sending errors

  - **Wait for Status Update**  
    - Type: Wait  
    - Role: Pauses workflow awaiting next status update (polling or delay)  
    - Config: Wait duration or webhook-based resume  
    - Inputs: Check Status (pending branch)  
    - Outputs: Check Status (loop)  
    - Failures: Timeout or missed event

#### 1.6 Final Publishing & Notifications

- **Overview:**  
  Checks if posts are already published, applies blog templates, stores final posts, loops over each post to publish on WordPress and LinkedIn, updates publish status, and sends Telegram notification upon completion.

- **Nodes Involved:**  
  Check if Already Published, Apply Blog Template, Store Blog Posts Final, Loop Over Blog Posts, Delay Between Posts, Post to Wordpress, Post to LinkedIn, Copy of the RenderedBlog, Update Publish Status, NNotify Telegram on Completion

- **Node Details:**

  - **Check if Already Published**  
    - Type: If  
    - Role: Verifies if blog post has been published previously to avoid duplicates  
    - Config: Checks a published status field in Google Sheets  
    - Inputs: Check Status (approved branch)  
    - Outputs: Apply Blog Template (if not published)  
    - Failures: False negatives/positives due to sheet data inconsistencies

  - **Apply Blog Template**  
    - Type: Code  
    - Role: Applies formatting template to blog post content (HTML or Markdown) before publishing  
    - Config: Custom JavaScript template logic  
    - Inputs: Check if Already Published (true branch)  
    - Outputs: Store Blog Posts Final  
    - Failures: Template errors, malformed content

  - **Store Blog Posts Final**  
    - Type: Google Sheets  
    - Role: Stores finalized blog post data into Google Sheets for record keeping  
    - Config: Append or update mode  
    - Inputs: Apply Blog Template  
    - Outputs: Loop Over Blog Posts  
    - Failures: API quota or permissions

  - **Loop Over Blog Posts**  
    - Type: SplitInBatches  
    - Role: Processes blog posts one at a time for controlled publishing  
    - Config: Batch size = 1  
    - Inputs: Store Blog Posts Final  
    - Outputs: Delay Between Posts (main), NNotify Telegram on Completion (alternative branch)  
    - Failures: Loop control errors

  - **Delay Between Posts**  
    - Type: Wait  
    - Role: Adds delay between publishing posts to respect rate limits or pacing  
    - Config: Configured wait time (e.g., seconds or minutes)  
    - Inputs: Loop Over Blog Posts  
    - Outputs: Store Blog Posts Final (to continue loop), Post to LinkedIn, Post to Wordpress, Copy of the RenderedBlog  
    - Failures: Timeout or misconfiguration

  - **Post to Wordpress**  
    - Type: WordPress  
    - Role: Publishes finalized blog post to WordPress site  
    - Config: WordPress credentials (OAuth2 or API key), post parameters (title, content, status)  
    - Inputs: Delay Between Posts  
    - Outputs: None  
    - Failures: Auth errors, API failures, content validation issues

  - **Post to LinkedIn**  
    - Type: LinkedIn  
    - Role: Shares blog post on LinkedIn company or personal page  
    - Config: LinkedIn OAuth2 credentials, post message and URL  
    - Inputs: Delay Between Posts  
    - Outputs: None  
    - Failures: Token expiration, API limits

  - **Copy of the RenderedBlog**  
    - Type: Gmail  
    - Role: Sends an email copy of the published blog post for record or internal review  
    - Config: Gmail OAuth2 credentials, email content parameters  
    - Inputs: Delay Between Posts  
    - Outputs: Update Publish Status  
    - Failures: Email failures

  - **Update Publish Status**  
    - Type: Google Sheets  
    - Role: Updates publish status of blog post after successful publishing  
    - Config: Target spreadsheet and row update mode  
    - Inputs: Copy of the RenderedBlog  
    - Outputs: None  
    - Failures: Permissions, row not found

  - **NNotify Telegram on Completion**  
    - Type: Telegram  
    - Role: Sends Telegram notification confirming completion of batch publishing  
    - Config: Telegram bot credentials and chat ID  
    - Inputs: Loop Over Blog Posts  
    - Outputs: None  
    - Failures: Telegram API errors

---

### 3. Summary Table

| Node Name                 | Node Type                | Functional Role                              | Input Node(s)                 | Output Node(s)                                    | Sticky Note |
|---------------------------|--------------------------|----------------------------------------------|------------------------------|--------------------------------------------------|-------------|
| Schedule Trigger           | Schedule Trigger         | Triggers workflow daily at 7 AM              | None                         | RSS TechCrunch, RSS TheVerge                      |             |
| RSS TechCrunch            | RSS Feed Read            | Reads TechCrunch RSS feed                     | Schedule Trigger              | Merge RSS Feeds                                  |             |
| RSS TheVerge              | RSS Feed Read            | Reads The Verge RSS feed                      | Schedule Trigger              | Merge RSS Feeds                                  |             |
| Merge RSS Feeds           | Merge                    | Combines articles from both feeds            | RSS TechCrunch, RSS TheVerge  | Date Filter                                      |             |
| Date Filter               | If                       | Filters articles published in last 24 hours | Merge RSS Feeds               | Limit Articles                                   |             |
| Limit Articles            | Limit                    | Limits to 5 articles                          | Date Filter                  | Extract Content                                  |             |
| Extract Content           | Function                 | Extracts title, desc, link, pubDate          | Limit Articles               | Fetch Full Article                               |             |
| Fetch Full Article        | HTTP Request             | Fetches full article HTML content            | Extract Content              | Extract Article Body                             |             |
| Extract Article Body      | HTML Extract             | Extracts main article content via CSS selector | Fetch Full Article          | Convert to Markdown                              |             |
| Convert to Markdown       | Function                 | Converts HTML to Markdown                      | Extract Article Body         | Generate SEO Keywords                            |             |
| Generate SEO Keywords     | OpenAI                   | Generates SEO keywords from content           | Convert to Markdown          | Generate Blog Post                               |             |
| Generate Blog Post        | LangChain Agent          | Generates AI blog post using GPT-4o           | Generate SEO Keywords        | Set Blog Creation Date                           |             |
| OpenAI Chat Model1        | LangChain OpenAI Chat    | GPT-4o chat model backend                      | Generate Blog Post (ai input)| Generate Blog Post (ai output)                   |             |
| Set Blog Creation Date    | Code                     | Adds/formats blog creation date                | Generate Blog Post           | Set Fields                                       |             |
| Set Fields                | Set                      | Sets blog post metadata fields                  | Set Blog Creation Date       | Format Fields for Storage                        |             |
| Format Fields for Storage | Code                     | Prepares fields for Google Sheets storage       | Set Fields                  | Add Featured Image                              |             |
| Add Featured Image        | Code                     | Adds featured image data to blog post           | Format Fields for Storage    | Store Blog Posts Initial                         |             |
| Store Blog Posts Initial  | Google Sheets            | Saves initial blog posts for review             | Add Featured Image           | Prepare Fields Foor Notification                 |             |
| Prepare Fields Foor Notification | Set                 | Prepares email notification fields             | Store Blog Posts Initial     | Notify for Review                               |             |
| Notify for Review         | Gmail                    | Sends review request email                       | Prepare Fields Foor Notification | None                                       |             |
| Approval Webhook          | Webhook                  | Receives approval/rejection via webhook         | External HTTP Request        | Update Approve Status                            |             |
| Update Approve Status     | Google Sheets            | Updates approval status in sheet                 | Approval Webhook             | None                                            |             |
| Fetch Row                 | Google Sheets Trigger    | Triggers on row update for status check          | None (trigger)               | Check Status                                    |             |
| Check Status              | Switch                   | Routes flow based on approval status             | Fetch Row                   | Check if Already Published, Notify Rejection, Wait for Status Update |             |
| Notify Rejection          | Gmail                    | Sends rejection notification email               | Check Status (rejected)      | None                                            |             |
| Wait for Status Update    | Wait                     | Waits for approval status update                  | Check Status (pending)       | Check Status                                    |             |
| Check if Already Published| If                       | Checks if post was already published               | Check Status (approved)      | Apply Blog Template                             |             |
| Apply Blog Template       | Code                     | Applies blog post template before publishing       | Check if Already Published   | Store Blog Posts Final                          |             |
| Store Blog Posts Final    | Google Sheets            | Stores finalized blog posts                         | Apply Blog Template          | Loop Over Blog Posts                            |             |
| Loop Over Blog Posts      | SplitInBatches           | Processes posts one at a time                       | Store Blog Posts Final       | Delay Between Posts, NNotify Telegram on Completion |             |
| Delay Between Posts       | Wait                     | Delays between publishing posts                      | Loop Over Blog Posts         | Store Blog Posts Final, Post to LinkedIn, Post to Wordpress, Copy of the RenderedBlog |             |
| Post to Wordpress         | WordPress                | Publishes post on WordPress site                     | Delay Between Posts          | None                                            |             |
| Post to LinkedIn          | LinkedIn                 | Shares post on LinkedIn                               | Delay Between Posts          | None                                            |             |
| Copy of the RenderedBlog  | Gmail                    | Sends email copy of published blog                   | Delay Between Posts          | Update Publish Status                           |             |
| Update Publish Status     | Google Sheets            | Updates publish status after posting                  | Copy of the RenderedBlog     | None                                            |             |
| NNotify Telegram on Completion | Telegram             | Sends Telegram notification upon batch completion    | Loop Over Blog Posts         | None                                            |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Set to run daily at 07:00  
   - Connect output to two RSS Feed Read nodes.

2. **Create two RSS Feed Read nodes**  
   - RSS TechCrunch: Enter TechCrunch RSS feed URL  
   - RSS TheVerge: Enter The Verge RSS feed URL  
   - Connect both outputs to a Merge node.

3. **Create a Merge node**  
   - Use default merge mode (append)  
   - Connect RSS feeds to Merge node inputs  
   - Connect output to an If node for date filtering.

4. **Create a Date Filter (If) node**  
   - Configure expression to check if article publication date is within the last 24 hours  
   - Connect true output to a Limit node.

5. **Create a Limit node**  
   - Set limit to 5 items  
   - Connect output to a Function node to extract content fields.

6. **Create a Function node (Extract Content)**  
   - Write JavaScript to extract title, description, link, and pubDate from each RSS item  
   - Connect output to an HTTP Request node.

7. **Create HTTP Request node (Fetch Full Article)**  
   - Use GET method with URL from extracted article link  
   - Connect output to HTML Extract node.

8. **Create HTML Extract node (Extract Article Body)**  
   - Configure CSS selector targeting main content of article (site-specific)  
   - Enable "Always Output Data"  
   - Connect output to Function node.

9. **Create Function node (Convert to Markdown)**  
   - Use JavaScript to convert extracted HTML to Markdown format  
   - Connect output to OpenAI node for SEO keywords generation.

10. **Create OpenAI node (Generate SEO Keywords)**  
    - Configure with OpenAI credentials, prompt for SEO keyword generation based on Markdown content  
    - Connect output to LangChain Agent node.

11. **Create LangChain Agent node (Generate Blog Post)**  
    - Configure prompt for AI blog post generation using GPT-4o  
    - Connect ai_languageModel output to OpenAI Chat Model node.

12. **Create LangChain OpenAI Chat Model node (OpenAI Chat Model1)**  
    - Configure with OpenAI API key and GPT-4o model  
    - Connect output back to Generate Blog Post node's ai_languageModel input  
    - Connect main output to Code node for setting blog creation date.

13. **Create Code node (Set Blog Creation Date)**  
    - JavaScript to add or format creation date field  
    - Connect output to Set node.

14. **Create Set node (Set Fields)**  
    - Define blog post metadata fields (title, author, status, etc.)  
    - Connect output to Code node for formatting fields.

15. **Create Code node (Format Fields for Storage)**  
    - JavaScript to prepare data for Google Sheets storage  
    - Connect output to Code node for adding featured image.

16. **Create Code node (Add Featured Image)**  
    - JavaScript to assign or fetch featured image URL  
    - Connect output to Google Sheets node.

17. **Create Google Sheets node (Store Blog Posts Initial)**  
    - Configure with Google Sheets credentials and target spreadsheet/sheet  
    - Set to append or update mode  
    - Connect output to Set node for notification.

18. **Create Set node (Prepare Fields Foor Notification)**  
    - Prepare email subject, body, recipients for review notification  
    - Connect output to Gmail node.

19. **Create Gmail node (Notify for Review)**  
    - Configure with Gmail OAuth2 credentials  
    - Connect input from notification fields node

20. **Create Webhook node (Approval Webhook)**  
    - Configure public POST webhook to receive approval/rejection  
    - Connect output to Google Sheets node.

21. **Create Google Sheets node (Update Approve Status)**  
    - Update approval status column based on webhook data  
    - Connect output to none (end of branch).

22. **Create Google Sheets Trigger node (Fetch Row)**  
    - Watches for row changes in approval sheet  
    - Connect output to Switch node.

23. **Create Switch node (Check Status)**  
    - Switch on approval status field (approved, rejected, pending)  
    - Connect approved to If node for published check  
    - Connect rejected to Gmail node (Notify Rejection)  
    - Connect pending to Wait node.

24. **Create Gmail node (Notify Rejection)**  
    - Email rejection notification  
    - Connect from Switch node rejected branch.

25. **Create Wait node (Wait for Status Update)**  
    - Pause and loop back to Switch node for status polling.

26. **Create If node (Check if Already Published)**  
    - Checks published status flag in sheet  
    - True branch connects to Code node for blog template application.

27. **Create Code node (Apply Blog Template)**  
    - Formats blog content for publishing  
    - Connect output to Google Sheets node.

28. **Create Google Sheets node (Store Blog Posts Final)**  
    - Stores finalized blog posts  
    - Connect output to SplitInBatches node.

29. **Create SplitInBatches node (Loop Over Blog Posts)**  
    - Batch size 1  
    - Connect main output to Wait node for delay.

30. **Create Wait node (Delay Between Posts)**  
    - Configure delay duration (seconds or minutes)  
    - Connect outputs to WordPress, LinkedIn, Gmail (copy email), and Google Sheets nodes.

31. **Create WordPress node (Post to Wordpress)**  
    - Configure WordPress credentials and post parameters  
    - Connect from Delay Between Posts.

32. **Create LinkedIn node (Post to LinkedIn)**  
    - Configure LinkedIn OAuth2 credentials and post content  
    - Connect from Delay Between Posts.

33. **Create Gmail node (Copy of the RenderedBlog)**  
    - Sends email copy of published post  
    - Connect output to Google Sheets node.

34. **Create Google Sheets node (Update Publish Status)**  
    - Updates the published status flag  
    - Connect from Gmail node.

35. **Create Telegram node (NNotify Telegram on Completion)**  
    - Configure Telegram bot credentials and chat ID  
    - Connect from SplitInBatches node (alternate output for completion notification).

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                        |
|-----------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| The workflow uses GPT-4o model via LangChain integration for advanced AI content generation.        | OpenAI API and LangChain documentation                |
| WordPress and LinkedIn nodes require OAuth2 credentials setup for API access.                        | n8n credential configuration guides                    |
| Google Sheets nodes require API access and permission scopes for reading and writing spreadsheet data.| Google Sheets API and OAuth2 setup                     |
| The workflow includes email notifications via Gmail using OAuth2 for secure authentication.         | Gmail API & OAuth2 setup                               |
| Telegram notifications require a bot token and chat ID configured in credentials.                   | Telegram Bot API documentation                          |
| CSS selectors used in HTML Extract node must be adapted if source site structure changes.           | Site-specific CSS selectors must be maintained          |

---

This document fully describes the workflow "Automate RSS Content to Blog Posts with GPT-4o, WordPress & LinkedIn Publishing" and provides comprehensive details to understand, reproduce, and maintain it effectively.