Automate Reddit Replies with F5Bot Alerts & GPT-5 Personalized Comments

https://n8nworkflows.xyz/workflows/automate-reddit-replies-with-f5bot-alerts---gpt-5-personalized-comments-9371


# Automate Reddit Replies with F5Bot Alerts & GPT-5 Personalized Comments

---

### 1. Workflow Overview

This workflow automates replying to Reddit posts triggered by alerts from F5Bot, a keyword-monitoring service that sends emails with relevant Reddit URLs. It extracts Reddit post details, fetches subreddit metadata and rules, then uses an AI agent powered by GPT-5 to craft personalized, rule-compliant comments which may include product promotions retrieved from a Google Sheets list. Finally, it posts the generated comments on Reddit and evaluates their quality and compliance.

Logical blocks:

- **1.1 Input Reception**: Receive incoming emails from F5Bot alerts and delay processing to avoid Reddit anti-spam flags.
- **1.2 URL Extraction & Reddit Data Retrieval**: Parse Reddit post URLs from email text, fetch post and subreddit info, and filter out posts authored by the bot itself.
- **1.3 AI Comment Generation**: Prepare input for AI, retrieve product/service data from Google Sheets, and generate a personalized Reddit comment using GPT-5 with contextual prompts.
- **1.4 Posting & Evaluation**: Post the comment on Reddit, then evaluate the comment’s format, presence of links, and tool usage to ensure quality and compliance.
- **1.5 Workflow Metadata & Notes**: Sticky notes provide instructions, setup guides, and visual aids for users.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Listens for new emails from F5Bot containing Reddit URLs, then delays execution for 5 minutes to prevent Reddit spam detection.
- **Nodes Involved:** Gmail Trigger, Delay 5m, Edit Fields
- **Node Details:**

1. **Gmail Trigger**
   - Type: Trigger node for Gmail
   - Configuration: Listens for emails from sender "admin@f5bot.com", polling every minute
   - Input/Output: Trigger input; outputs email data including message text
   - Failure considerations: Gmail OAuth token expiry, API limits, network errors

2. **Delay 5m**
   - Type: Wait node
   - Configuration: Delay for 5 minutes before continuing workflow
   - Input: Email data from Gmail Trigger
   - Output: Delayed data forwarded to next node
   - Reason: Avoid Reddit anti-spam flags by slowing automation

3. **Edit Fields**
   - Type: Set node
   - Configuration: Extracts the "text" field from the incoming email JSON and sets it as a new field named "Text"
   - Input: Delayed email data
   - Output: JSON with "Text" field containing email content for further processing

#### 1.2 URL Extraction & Reddit Data Retrieval

- **Overview:** Extracts Reddit post URLs from email text, decodes and parses them, filters out posts by the bot user, and fetches detailed Reddit post and subreddit info including rules.
- **Nodes Involved:** Filter Subreddit URLs, Code in JavaScript1, Get a post, Filter Own Posts, Subreddit about, Subreddit rules, Edit Fields1, Merge
- **Node Details:**

1. **Filter Subreddit URLs**
   - Type: Code node (JavaScript)
   - Configuration: Parses the "Text" field for all URLs using regex, outputs an array named "urls"
   - Input: JSON with "Text" from Edit Fields
   - Output: JSON containing all extracted URLs

2. **Code in JavaScript1**
   - Type: Code node
   - Configuration: Scans "urls" to find encoded Reddit URLs from F5Bot format, decodes them, extracts subreddit and postId, removes duplicates, returns first unique Reddit post info
   - Key Logic: Regex to parse URLs, decodeURIComponent, filtering for reddit.com/r/ URLs
   - Input: URLs array from Filter Subreddit URLs
   - Output: JSON with subreddit, postId, and URL

3. **Get a post**
   - Type: Reddit node (OAuth2)
   - Configuration: Fetches Reddit post data by postId and subreddit from previous node
   - Input: postId and subreddit from Code in JavaScript1
   - Output: Reddit post JSON including title, selftext, author, etc.
   - Failure considerations: Reddit OAuth expiration, post not found, API limits

4. **Filter Own Posts**
   - Type: Filter node
   - Configuration: Filters out posts where the author equals the bot username "Altruistic-Brother37"
   - Input: Reddit post JSON
   - Output: Only posts not authored by bot proceed

5. **Subreddit about**
   - Type: Reddit node
   - Configuration: Retrieves subreddit metadata with "rules" content for the subreddit extracted earlier
   - Input: Subreddit from Code in JavaScript1
   - Output: Subreddit rules and metadata JSON

6. **Subreddit rules**
   - Type: Reddit node
   - Configuration: Also fetches subreddit rules with content "rules" for the same subreddit
   - Input: Subreddit from Code in JavaScript1
   - Output: Subreddit rules JSON

7. **Edit Fields1**
   - Type: Set node
   - Configuration: Combines subreddit metadata and rules into fields "subreddit_about" and "subreddit_rules" for later use
   - Input: Subreddit rules and about nodes
   - Output: JSON enriched with subreddit info

8. **Merge**
   - Type: Merge node
   - Configuration: Combines Reddit post data and subreddit info into a single JSON object by position
   - Inputs: From Edit Fields1 and Input for AI (next block)
   - Output: Unified JSON for AI input preparation

#### 1.3 AI Comment Generation

- **Overview:** Prepares input data for AI, fetches product/service list from Google Sheets, uses GPT-5 agent with custom prompt to generate personalized Reddit comment aligned with subreddit rules.
- **Nodes Involved:** Input for AI, Get Google Sheet, AI Agent, OpenAI Chat Model, Structured Output Parser
- **Node Details:**

1. **Input for AI**
   - Type: Set node
   - Configuration: Sets "Title" and "Text" fields from Reddit post JSON (title, selftext)
   - Input: Reddit post JSON after Filter Own Posts
   - Output: JSON with fields for AI prompt

2. **Get Google Sheet**
   - Type: Google Sheets Tool node
   - Configuration: Retrieves list of products and services from a specified Google Sheet (documentId and sheetName set)
   - Input: Triggered as AI tool input by AI Agent
   - Output: JSON array of products/services with URLs
   - Failure considerations: OAuth token expiration, sheet access permission, network errors

3. **AI Agent**
   - Type: LangChain Agent node
   - Configuration: 
     - Prompt instructs the AI to act as a Reddit marketing expert who writes first-person, casual comments.
     - Inputs include Reddit post title, text, subreddit rules, subreddit metadata, and products from Google Sheets.
     - Conditions: If promotion allowed, include product link; otherwise, write useful personal comment without links.
     - Output: Reddit comment text (max 255 chars), no markdown, no extra formatting.
   - Input: Unified JSON with post and subreddit data, plus Google Sheets output
   - Output: AI-generated comment text
   - Uses OpenAI Chat Model as underlying LM

4. **OpenAI Chat Model**
   - Type: LangChain LM Chat node
   - Configuration: Calls GPT-5 Nano model (latest generation) with prompt from AI Agent
   - Input: Prompt from AI Agent
   - Output: Generated text for AI Agent to parse
   - Credential: OpenAI API key required

5. **Structured Output Parser**
   - Type: LangChain Output Parser node
   - Configuration: Parses AI output JSON, extracting the "comment" string field
   - Input: Raw AI chat output
   - Output: Structured JSON with comment text
   - Failure considerations: Parsing errors if AI outputs malformed JSON

#### 1.4 Posting & Evaluation

- **Overview:** Posts the AI-generated comment on Reddit post, then evaluates comment content for formatting and compliance using several evaluation nodes, and logs results back to Google Sheets.
- **Nodes Involved:** Create a comment in a post, Evaluate text format, Evaluate link in text, Evaluation ghseet tool, Merge Evaluations, Set Evaluation Output
- **Node Details:**

1. **Create a comment in a post**
   - Type: Reddit node (OAuth2)
   - Configuration: Posts comment text generated by AI on the target Reddit post (postId from Get a post)
   - Input: AI Agent’s output comment
   - Output: Confirmation of posted comment
   - Failure considerations: Reddit API limits, OAuth expiration, posting restrictions

2. **Evaluate text format**
   - Type: Evaluation node
   - Configuration: Checks if the AI-generated comment contains a dash ("—") which may indicate robotic formatting
   - Input: Comment text
   - Output: Boolean metric "contains dash"
   
3. **Evaluate link in text**
   - Type: Evaluation node
   - Configuration: Checks if comment contains a "https://" link when promotion is allowed
   - Input: Comment text
   - Output: Boolean metric "contains link"

4. **Evaluation ghseet tool**
   - Type: Evaluation node
   - Configuration: Checks if the Google Sheets tool was used as an intermediate step by the AI Agent, ensuring product data was accessed
   - Input: AI Agent intermediate steps
   - Output: Metric "Tools Used"

5. **Merge Evaluations**
   - Type: Merge node
   - Configuration: Combines results from the three evaluation nodes into one JSON object

6. **Set Evaluation Output**
   - Type: Evaluation node
   - Configuration: Writes evaluation results (comment text, contains dash, contains link, tools used) into a Google Sheet for logging and analysis
   - Input: Merged evaluation JSON
   - Output: Logs data to Google Sheets document

#### 1.5 Workflow Metadata & Notes

- **Overview:** Several sticky note nodes provide visual guidance, setup instructions, and screenshots to help users understand and configure the workflow.
- **Nodes Involved:** Sticky Note, Sticky Note1, Sticky Note2, Sticky Note3, Sticky Note4, Sticky Note5, Sticky Note6, Sticky Note7
- **Details:** These notes cover:
  - Setup of F5Bot keyword alerts and email triggers
  - How Reddit post and subreddit data is fetched and filtered
  - Use of Google Sheets for product/service management
  - Posting comments on Reddit
  - Evaluation screenshots and guidance on prompt tuning for compliance

---

### 3. Summary Table

| Node Name                 | Node Type                       | Functional Role                                           | Input Node(s)                 | Output Node(s)                 | Sticky Note                                                                                                                          |
|---------------------------|--------------------------------|-----------------------------------------------------------|------------------------------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Gmail Trigger             | Gmail Trigger                  | Receive emails from F5Bot alerts                           | (Trigger)                    | Delay 5m                      | Get message from f5 bot: Setup F5Bot account and keywords, delay 5m to avoid Reddit flags, see screenshot                           |
| Delay 5m                  | Wait                          | Delay workflow execution for 5 minutes                     | Gmail Trigger               | Edit Fields                   | Same as Gmail Trigger                                                                                                               |
| Edit Fields               | Set                           | Extract email text into "Text" field                       | Delay 5m                    | Filter Subreddit URLs          | Same as Gmail Trigger                                                                                                               |
| Filter Subreddit URLs     | Code                          | Extract all URLs from email text                           | Edit Fields                 | Code in JavaScript1            | Get data from Reddit: fetch post, subreddit info, filter own posts, see screenshots                                                 |
| Code in JavaScript1       | Code                          | Parse and decode Reddit URLs, extract subreddit/postId    | Filter Subreddit URLs       | Subreddit about, Get a post    | Same as Filter Subreddit URLs                                                                                                      |
| Get a post                | Reddit                        | Fetch Reddit post details                                  | Code in JavaScript1         | Filter Own Posts               | Same as Filter Subreddit URLs                                                                                                      |
| Filter Own Posts          | Filter                        | Filter out posts authored by the bot                       | Get a post                  | Input for AI                  | Same as Filter Subreddit URLs                                                                                                      |
| Subreddit about           | Reddit                        | Fetch subreddit metadata including rules                   | Code in JavaScript1         | Subreddit rules               | Same as Filter Subreddit URLs                                                                                                      |
| Subreddit rules           | Reddit                        | Fetch subreddit rules                                      | Subreddit about             | Edit Fields1                  | Same as Filter Subreddit URLs                                                                                                      |
| Edit Fields1              | Set                           | Combine subreddit metadata and rules into fields           | Subreddit rules             | Merge                        | Same as Filter Subreddit URLs                                                                                                      |
| Input for AI              | Set                           | Prepare title and text fields for AI prompt                | Filter Own Posts            | Merge                        | Same as Filter Subreddit URLs                                                                                                      |
| Merge                    | Merge                         | Combine Reddit post and subreddit info for AI input        | Edit Fields1, Input for AI  | AI Agent                    | Same as Filter Subreddit URLs                                                                                                      |
| Get Google Sheet          | Google Sheets Tool            | Retrieve product/service list for AI promotions            | AI Agent (ai_tool input)    | AI Agent (ai_tool output)      | Get Product and services: Google Sheets contains products/services to use in AI replies, see screenshot                            |
| AI Agent                  | LangChain Agent               | Generate Reddit comment using GPT-5 and product data       | Merge, Get Google Sheet     | Create a comment in a post     | Same as Get Google Sheet                                                                                                           |
| OpenAI Chat Model         | LangChain LM Chat             | Underlying GPT-5 Nano model used by AI Agent               | AI Agent                   | AI Agent                     | Same as Get Google Sheet                                                                                                           |
| Structured Output Parser  | LangChain Output Parser       | Parse AI output JSON to extract comment text               | OpenAI Chat Model          | AI Agent                     | Same as Get Google Sheet                                                                                                           |
| Create a comment in a post| Reddit                        | Post AI-generated comment on Reddit post                    | AI Agent                   | Evaluate text format, Evaluate link in text, Evaluation ghseet tool | Post on Reddit: Posting comment screenshot                                                                                        |
| Evaluate text format      | Evaluation                    | Check comment for robotic dash ("—")                        | Create a comment in a post | Merge Evaluations             | Evaluations: AI comment quality checks, see screenshot                                                                           |
| Evaluate link in text     | Evaluation                    | Check if comment contains a link                             | Create a comment in a post | Merge Evaluations             | Same as Evaluate text format                                                                                                       |
| Evaluation ghseet tool    | Evaluation                    | Check if Google Sheets tool was used during AI generation  | Create a comment in a post | Merge Evaluations             | Same as Evaluate text format                                                                                                       |
| Merge Evaluations         | Merge                         | Combine evaluation metrics into one JSON                    | Evaluate text format, Evaluate link in text, Evaluation ghseet tool | Set Evaluation Output | Same as Evaluate text format                                                                                                       |
| Set Evaluation Output     | Evaluation                    | Write evaluation results back to a Google Sheet             | Merge Evaluations           | (End)                        | Same as Evaluate text format                                                                                                       |
| Sticky Note               | Sticky Note                   | Workflow setup and instructional notes                      | (None)                     | (None)                       | See detailed notes below                                                                                                           |
| Sticky Note1              | Sticky Note                   | Blank note - reserved                                        | (None)                     | (None)                       |                                                                                                                                    |
| Sticky Note2              | Sticky Note                   | F5Bot keyword setup visual                                   | (None)                     | (None)                       |                                                                                                                                    |
| Sticky Note3              | Sticky Note                   | Reddit post and subreddit data explanation                   | (None)                     | (None)                       |                                                                                                                                    |
| Sticky Note4              | Sticky Note                   | Google Sheets product/service explanation                    | (None)                     | (None)                       |                                                                                                                                    |
| Sticky Note5              | Sticky Note                   | Posting comment on Reddit explanation                        | (None)                     | (None)                       |                                                                                                                                    |
| Sticky Note6              | Sticky Note                   | Evaluation node visual guide                                 | (None)                     | (None)                       |                                                                                                                                    |
| Sticky Note7              | Sticky Note                   | Evaluation explanation and tips                              | (None)                     | (None)                       |                                                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger**
   - Node type: Gmail Trigger
   - Configure to poll every minute
   - Filter: sender equals "admin@f5bot.com"
   - Connect output to Delay 5m

2. **Create Delay 5m**
   - Node type: Wait (Delay)
   - Set delay to 5 minutes
   - Connect output to Edit Fields

3. **Create Edit Fields**
   - Node type: Set
   - Create field "Text" with value: `={{ $json.text }}`
   - Connect output to Filter Subreddit URLs (Code node)

4. **Create Filter Subreddit URLs**
   - Node type: Code (JavaScript)
   - Code snippet:
     ```javascript
     const text = $json.Text || '';
     const urls = Array.from(text.matchAll(/https?:\/\/[^\n\s]+/g)).map(match => match[0]);
     return [{ urls }];
     ```
   - Connect output to Code in JavaScript1

5. **Create Code in JavaScript1**
   - Node type: Code (JavaScript)
   - Code snippet:
     ```javascript
     let posts = [];
     const input = JSON.stringify($input.first().json.urls);
     const regex = /https:\/\/f5bot\.com\/url\?u=([^&\s>]+)/g;
     let match;
     while ((match = regex.exec(input)) !== null) {
       try {
         const decoded = decodeURIComponent(match[1]);
         if (decoded.includes("reddit.com/r/")) {
           const redditMatch = decoded.match(/reddit\.com\/r\/([^/]+)\/comments\/([^/]+)/);
           if (redditMatch) {
             const subreddit = redditMatch[1];
             const postId = redditMatch[2];
             posts.push({ subreddit, postId, url: decoded });
           }
         }
       } catch (e) {}
     }
     // Remove duplicates
     const uniquePosts = [];
     const seen = new Set();
     for (const p of posts) {
       if (!seen.has(p.url)) {
         seen.add(p.url);
         uniquePosts.push(p);
       }
     }
     return { json: uniquePosts[0] };
     ```
   - Connect output to two parallel nodes: Subreddit about and Get a post

6. **Create Subreddit about**
   - Node type: Reddit
   - Operation: Get subreddit info with content = "rules"
   - Subreddit: `={{ $json.subreddit }}`
   - OAuth2 credentials for Reddit
   - Connect output to Subreddit rules

7. **Create Subreddit rules**
   - Node type: Reddit
   - Operation: Get subreddit rules
   - Subreddit: `={{ $('Code in JavaScript1').item.json.subreddit }}`
   - Connect output to Edit Fields1

8. **Create Get a post**
   - Node type: Reddit
   - Operation: Get post by ID
   - Post ID: `={{ $json.postId }}`
   - Subreddit: `={{ $json.subreddit }}`
   - Connect output to Filter Own Posts

9. **Create Filter Own Posts**
   - Node type: Filter
   - Condition: Discard if author equals "Altruistic-Brother37" (bot username)
   - Connect output to Input for AI

10. **Create Edit Fields1**
    - Node type: Set
    - Assign:
      - subreddit_about = `={{ $('Subreddit about').first().json }}`
      - subreddit_rules = `={{ $json }}`
    - Connect output to Merge node (input 0)

11. **Create Input for AI**
    - Node type: Set
    - Assign:
      - Title = `={{ $json.title }}`
      - Text = `={{ $json.selftext }}`
    - Connect output to Merge node (input 1)

12. **Create Merge**
    - Node type: Merge
    - Mode: Combine by position
    - Input 0: Edit Fields1
    - Input 1: Input for AI
    - Connect output to AI Agent node

13. **Create Get Google Sheet**
    - Node type: Google Sheets Tool
    - Configure with your Google Sheets OAuth2 credentials
    - Document ID and Sheet Name: point to your product/service list sheet
    - Connect as ai_tool input to AI Agent node

14. **Create AI Agent**
    - Node type: LangChain Agent
    - Prompt: Custom prompt instructing GPT-5 to generate Reddit comments following subreddit rules and optionally promoting products
    - Inputs include Title, Text, subreddit_rules, subreddit_about, and Google Sheets data
    - Connect output to Create a comment in a post

15. **Create OpenAI Chat Model**
    - Node type: LangChain LM Chat OpenAI
    - Model: gpt-5-nano
    - Provide OpenAI API credentials
    - Connect as ai_languageModel to AI Agent

16. **Create Structured Output Parser**
    - Node type: LangChain Output Parser Structured
    - Schema: JSON object with "comment" string property
    - Connect as ai_outputParser to AI Agent

17. **Create Create a comment in a post**
    - Node type: Reddit
    - Operation: postComment on Reddit post
    - Post ID: `={{ $('Get a post').item.json.id }}`
    - Comment Text: `={{ $json.output.comment }}`
    - Connect output to Evaluate text format, Evaluate link in text, and Evaluation ghseet tool

18. **Create Evaluate text format**
    - Node type: Evaluation
    - Metric: categorization "contains dash"
    - Actual Answer: `={{ $('AI Agent').first().json.output.comment.includes("—") }}`
    - Expected Answer: false
    - Connect output to Merge Evaluations (input 0)

19. **Create Evaluate link in text**
    - Node type: Evaluation
    - Metric: categorization "contains link"
    - Actual Answer: `={{ $('AI Agent').first().json.output.comment.includes("https://") }}`
    - Expected Answer: true
    - Connect output to Merge Evaluations (input 1)

20. **Create Evaluation ghseet tool**
    - Node type: Evaluation
    - Metric: toolsUsed
    - Expected Tools: "Get Google Sheet"
    - Intermediate Steps: `={{ $('AI Agent').first().json.intermediateSteps }}`
    - Connect output to Merge Evaluations (input 2)

21. **Create Merge Evaluations**
    - Node type: Merge
    - Mode: Combine by position
    - Number of inputs: 3
    - Inputs: Evaluate text format, Evaluate link in text, Evaluation ghseet tool
    - Connect output to Set Evaluation Output

22. **Create Set Evaluation Output**
    - Node type: Evaluation
    - Output the evaluation metrics and comment text to a Google Sheet for logging
    - Configure with the same Google Sheet document and sheet name as used for evaluations
    - Connect output to nothing (end of workflow)

23. **Add Sticky Notes**
    - Add informational sticky notes at relevant workflow points with setup instructions and screenshots for user guidance

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                 |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Get message from f5 bot: You must set up an F5Bot account at [https://f5bot.com/](https://f5bot.com/) and configure your keyword niche to receive emails with relevant Reddit URLs. A 5-minute delay is added because Reddit flags automatic messages. Screenshot included.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | https://f5bot.com/                                                                              |
| Get data from Reddit: Workflow fetches Reddit post, subreddit description, and rules. Filters out the bot’s own posts to avoid self-replying. Screenshot included.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | https://articles.emp0.com/wp-content/uploads/2025/10/reddit-automation-get-post.png             |
| Get Product and services: Retrieves product/service list from Google Sheets used by AI to occasionally insert promotions in Reddit replies. Screenshot included.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | https://articles.emp0.com/wp-content/uploads/2025/10/reddit-automation-gsheet-promo.png         |
| Post on Reddit: Final step posting AI-generated Reddit comments. Screenshot included.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | https://articles.emp0.com/wp-content/uploads/2025/10/reddit-automation-reddit-comment.png       |
| Evaluations: Checks AI comment quality by verifying dash usage, link presence, and tool usage. Helps tune prompts to ensure comments comply with Reddit and subreddit rules. Screenshot included.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | https://articles.emp0.com/wp-content/uploads/2025/10/reddit-automation-evaluations.png           |
| F5Bot Keywords setup visual guide screenshot.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | https://articles.emp0.com/wp-content/uploads/2025/10/reddit-automation-f5bot-setup.png          |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and publicly accessible.