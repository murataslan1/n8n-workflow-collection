AI-Powered Social Media Amplifier

https://n8nworkflows.xyz/workflows/ai-powered-social-media-amplifier-2681


# AI-Powered Social Media Amplifier

### 1. Workflow Overview

This n8n workflow, named **AI-Powered Social Media Amplifier**, automates the process of curating trending GitHub-related discussions from Hacker News and sharing them as engaging posts on Twitter (X) and LinkedIn. It uses AI to generate platform-tailored social media posts, logs the posts in Airtable to avoid duplicates, and notifies the user via Telegram about the posted content. The workflow runs on a schedule (every 6 hours) and is designed to streamline social media content creation and distribution with minimal manual input.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Hacker News Crawling:** Periodically crawls the Hacker News homepage to fetch GitHub-related posts.
- **1.2 Metadata Extraction & Duplicate Filtering:** Parses the HTML to extract post metadata and filters out posts already processed.
- **1.3 GitHub Repository Details Enrichment:** Visits each GitHub URL to fetch the repository page content and converts it to markdown.
- **1.4 AI-Driven Content Generation:** Uses OpenAI GPT-4o-mini to generate customized posts for Twitter and LinkedIn.
- **1.5 Content Validation & Error Filtering:** Validates the AI output and filters out any errors.
- **1.6 Airtable Logging & Status Management:** Creates new records for posts in Airtable and updates their posting status.
- **1.7 Social Media Posting:** Posts the generated content to Twitter (X) and LinkedIn.
- **1.8 Telegram Notification & Wait:** Sends a notification with the generated posts via Telegram and waits for 5 minutes before final posting to allow manual intervention if needed.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Hacker News Crawling

- **Overview:**  
  This block triggers the workflow on a 6-hour interval and fetches the Hacker News homepage HTML to start the extraction process.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Crawl HN Home

- **Node Details:**  

  **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow execution every 6 hours (configurable interval).  
  - Configuration: Interval set to every 6 hours.  
  - Inputs: None (trigger node).  
  - Outputs: Initiates the next node.  
  - Failure Modes: None expected.  
  - Notes: Ensures automated periodic execution.

  **Crawl HN Home**  
  - Type: HTTP Request  
  - Role: Fetches the Hacker News homepage HTML content.  
  - Configuration: URL set to "https://news.ycombinator.com/"; response configured to not error on HTTP failure and returns full response.  
  - Inputs: Trigger from Schedule Trigger.  
  - Outputs: Passes response HTML to "Extract Meta" node.  
  - Failure Modes: Network errors, rate limiting, or site downtime could cause failure or empty data.  
  - Notes: Sticky Note1: "I crawl Hacker News and extract Github links."

#### 1.2 Metadata Extraction & Duplicate Filtering

- **Overview:**  
  Parses the Hacker News HTML to extract posts that link to GitHub repositories, constructs metadata objects, and filters out posts that have already been processed and posted.

- **Nodes Involved:**  
  - Extract Meta  
  - Search Item  
  - Merge  
  - Filter Unposted Items

- **Node Details:**  

  **Extract Meta**  
  - Type: Code (Python)  
  - Role: Parses HTML using BeautifulSoup to find GitHub-related posts and extract metadata (title, URL, score, author, age, comments, etc.). Outputs list of GitHub posts.  
  - Configuration: Uses Python code with packages `beautifulsoup4` and `simplejson` installed dynamically; extracts posts with URLs containing "github.com".  
  - Key Variables: `github_posts` list containing dictionaries with metadata per post.  
  - Inputs: HTML response from "Crawl HN Home".  
  - Outputs: List of GitHub posts metadata.  
  - Failure Modes: HTML structure changes on Hacker News; package installation failures; empty or malformed HTML.  
  - Notes: Sticky Note1 applies here.

  **Search Item**  
  - Type: Airtable (Search)  
  - Role: Searches Airtable "My Tweets" table for existing posts matching the current Post ID to prevent duplicates.  
  - Configuration: Filters by formula `={Post}= {{ $json.Post }}` to find existing records for the post.  
  - Inputs: Output from Extract Meta.  
  - Outputs: Search results for each post.  
  - Failure Modes: Airtable API errors, rate limits, or misconfiguration of base/table/fields.

  **Merge**  
  - Type: Merge  
  - Role: Combines outputs from Search Item (existing posts) and Extract Meta (all posts) for comparison.  
  - Configuration: Default merge (no special mode).  
  - Inputs: From Extract Meta and Search Item.  
  - Outputs: Merged data to pass to filtering.

  **Filter Unposted Items**  
  - Type: Code (JavaScript)  
  - Role: Filters out posts already existing in Airtable (thus posted); outputs only new posts to process further.  
  - Configuration: Custom JavaScript comparing Post IDs from both inputs to exclude duplicates.  
  - Inputs: Merged data.  
  - Outputs: Unposted GitHub posts metadata.  
  - Failure Modes: Logic errors could lead to missed or duplicate postings.  
  - Notes: Sticky Note6: "Make sure we don't post the same content again."

#### 1.3 GitHub Repository Details Enrichment

- **Overview:**  
  Visits each GitHub repository URL to fetch detailed HTML content and converts that HTML to markdown format for use in AI prompt context.

- **Nodes Involved:**  
  - Visit GH Page  
  - Convert HTML To Markdown

- **Node Details:**  

  **Visit GH Page**  
  - Type: HTTP Request  
  - Role: Fetches the HTML content of the GitHub repository page using the URL from the filtered unposted items.  
  - Configuration: URL dynamically set from `{{$json.url}}`.  
  - Inputs: From "Filter Unposted Items".  
  - Outputs: HTML content of GitHub page.  
  - Failure Modes: Network errors, GitHub rate limiting, HTTP errors, or invalid URLs.

  **Convert HTML To Markdown**  
  - Type: Markdown  
  - Role: Converts fetched GitHub repository HTML to markdown format for cleaner and more readable content in AI prompts.  
  - Configuration: Input HTML from the "Visit GH Page" node's response data field.  
  - Inputs: From "Visit GH Page".  
  - Outputs: Markdown content.  
  - Failure Modes: Conversion errors if input HTML is malformed or empty.  
  - Notes: Sticky Note2: "This is where the magic happens..."

#### 1.4 AI-Driven Content Generation

- **Overview:**  
  Uses OpenAI's GPT-4o-mini to generate tailored Twitter and LinkedIn posts, following strict stylistic and structural guidelines, based on the enriched markdown description and other metadata.

- **Nodes Involved:**  
  - Generate Content

- **Node Details:**  

  **Generate Content**  
  - Type: OpenAI (LangChain)  
  - Role: Calls GPT-4o-mini model to generate JSON output containing separate "twitter" and "linkedin" post texts.  
  - Configuration: System prompt defines AI as a social media assistant with tone and output constraints; user prompt includes post title, markdown details, and repository link; output expected as JSON.  
  - Inputs: Markdown content from "Convert HTML To Markdown" and metadata from "Filter Unposted Items".  
  - Outputs: AI-generated JSON with "twitter" and "linkedin" post content.  
  - Failure Modes: API key or quota errors, prompt formatting issues, or malformed response.  
  - Notes: Sticky Note2 applies here.

#### 1.5 Content Validation & Error Filtering

- **Overview:**  
  Validates that AI-generated content includes both Twitter and LinkedIn posts correctly formatted; filters out any items with errors or missing fields.

- **Nodes Involved:**  
  - Validate Generate Content  
  - Filter Errored

- **Node Details:**  

  **Validate Generate Content**  
  - Type: Code (JavaScript)  
  - Role: Checks if AI output JSON contains both `twitter` and `linkedin` fields; attempts to parse if content is stringified JSON.  
  - Configuration: Runs once per item; returns valid JSON or empty object on failure.  
  - Inputs: AI-generated content from "Generate Content".  
  - Outputs: Validated content or empty items.  
  - Failure Modes: Parsing errors, missing fields, or unexpected AI output format.

  **Filter Errored**  
  - Type: Filter  
  - Role: Filters out items flagged with errors in the previous step (items with non-empty `error` field).  
  - Configuration: Condition checks if `$json.error` is empty.  
  - Inputs: From "Validate Generate Content".  
  - Outputs: Only error-free generated content.  
  - Failure Modes: Misconfiguration could block valid items.  
  - Notes: Sticky Note5: "CHORE".

#### 1.6 Airtable Logging & Status Management

- **Overview:**  
  Creates new Airtable entries for each generated post to log metadata and content, and updates posting status flags after social media posting.

- **Nodes Involved:**  
  - Create Item  
  - Update X Status  
  - Update L Status  
  - No Operation, do nothing

- **Node Details:**  

  **Create Item**  
  - Type: Airtable (Create)  
  - Role: Creates a new record in Airtable "My Tweets" table with title, URL, Post ID, and generated Twitter and LinkedIn post content.  
  - Configuration: Maps fields from filtered content and AI output JSON.  
  - Inputs: From "Filter Errored".  
  - Outputs: Newly created record JSON, including Airtable record ID.  
  - Failure Modes: Airtable API errors, missing fields, rate limits.

  **Update X Status**  
  - Type: Airtable (Update)  
  - Role: Updates the `TDone` (Twitter Done) boolean flag to true in Airtable after successful posting to Twitter.  
  - Configuration: Uses record ID from "Create Item" node to update the status.  
  - Inputs: From "X" (Twitter posting node).  
  - Outputs: Airtable update response.  
  - Failure Modes: Airtable API errors, record ID mismatch.

  **Update L Status**  
  - Type: Airtable (Update)  
  - Role: Updates the `LDone` (LinkedIn Done) boolean flag to true after successful posting to LinkedIn.  
  - Configuration: Similar to "Update X Status" but for LinkedIn.  
  - Inputs: From "LinkedIn" node.  
  - Outputs: Airtable update response.  
  - Failure Modes: Same as above.

  **No Operation, do nothing**  
  - Type: NoOp  
  - Role: Placeholder node after status updates; does not perform any action.  
  - Inputs: From status update nodes.  
  - Outputs: None (end of chain).  
  - Failure Modes: None.

#### 1.7 Social Media Posting

- **Overview:**  
  Posts the generated Twitter and LinkedIn content to the respective platforms.

- **Nodes Involved:**  
  - X (Twitter)  
  - LinkedIn

- **Node Details:**  

  **X (Twitter)**  
  - Type: Twitter  
  - Role: Posts the Twitter message generated by AI to the Twitter (X) account.  
  - Configuration: Text field set dynamically from AI output's twitter content; OAuth2 credentials configured.  
  - Inputs: From "Wait for 5 mins before posting" node.  
  - Outputs: Posting response JSON.  
  - Failure Modes: Twitter API errors, token expiration, rate limits, posting errors.  
  - Error Handling: Configured to continue workflow on error to avoid blocking.

  **LinkedIn**  
  - Type: LinkedIn  
  - Role: Posts the LinkedIn message generated by AI to the LinkedIn account.  
  - Configuration: Text field set dynamically from AI output's linkedin content; OAuth2 credentials configured.  
  - Inputs: From "Wait for 5 mins before posting".  
  - Outputs: Posting response JSON.  
  - Failure Modes: LinkedIn API errors, token expiration, rate limits.  
  - Error Handling: Default.

  - Notes: Sticky Note3: "One last magic trick, Send the generated Tweet and the post to the respective platforms."

#### 1.8 Telegram Notification & Wait

- **Overview:**  
  Notifies the user via Telegram about the generated posts before final posting, waits 5 minutes to allow review or manual intervention, then proceeds to post.

- **Nodes Involved:**  
  - Create Item (starts chain)  
  - Ping Me  
  - Wait for 5 mins before posting

- **Node Details:**  

  **Ping Me**  
  - Type: Telegram  
  - Role: Sends chat message with the generated Twitter and LinkedIn posts to a configured Telegram chat ID.  
  - Configuration: Message text includes Tweet and LinkedIn content from Airtable record fields; chat ID must be set by user.  
  - Inputs: From "Create Item".  
  - Outputs: Message sent confirmation.  
  - Failure Modes: Telegram API errors, invalid chat ID, network issues.  
  - Notes: Sticky Note4: "Just pinging the owner that something is about to be posted and wait for 5 mins before final posting."

  **Wait for 5 mins before posting**  
  - Type: Wait  
  - Role: Pauses workflow for 5 minutes after notification before proceeding to social media posting.  
  - Configuration: Wait time set to 5 minutes.  
  - Inputs: From "Ping Me".  
  - Outputs: Triggers posting nodes ("X" and "LinkedIn").  
  - Failure Modes: None expected unless workflow is stopped or interrupted.

---

### 3. Summary Table

| Node Name                      | Node Type               | Functional Role                                  | Input Node(s)                | Output Node(s)                  | Sticky Note                                         |
|-------------------------------|------------------------|-------------------------------------------------|------------------------------|--------------------------------|-----------------------------------------------------|
| Schedule Trigger               | Schedule Trigger       | Periodic trigger every 6 hours                   | None                         | Crawl HN Home                  |                                                     |
| Crawl HN Home                 | HTTP Request           | Fetch Hacker News homepage HTML                   | Schedule Trigger             | Extract Meta                  | "I crawl Hacker News and extract Github links."    |
| Extract Meta                  | Code (Python)          | Parse HN HTML, extract GitHub posts metadata     | Crawl HN Home                | Search Item, Merge             | See above                                           |
| Search Item                   | Airtable (Search)      | Search Airtable for existing posts to avoid duplicates | Extract Meta                 | Merge                         | "Make sure we don't post the same content again."  |
| Merge                        | Merge                  | Combine extracted and existing posts              | Extract Meta, Search Item    | Filter Unposted Items          |                                                     |
| Filter Unposted Items         | Code (JavaScript)      | Filter out posts already posted                    | Merge                        | Visit GH Page                 | "Make sure we don't post the same content again."  |
| Visit GH Page                | HTTP Request           | Fetch HTML content of GitHub repository            | Filter Unposted Items        | Convert HTML To Markdown       | "This is where the magic happens..."                |
| Convert HTML To Markdown      | Markdown               | Convert GitHub page HTML to markdown               | Visit GH Page                | Generate Content              | "This is where the magic happens..."                |
| Generate Content              | OpenAI (LangChain)     | Generate tailored Twitter and LinkedIn posts      | Convert HTML To Markdown     | Validate Generate Content      | "This is where the magic happens..."                |
| Validate Generate Content     | Code (JavaScript)      | Validate AI-generated content format               | Generate Content             | Filter Errored                |                                                     |
| Filter Errored               | Filter                 | Filter out items with generation errors            | Validate Generate Content    | Create Item                   | "CHORE"                                             |
| Create Item                  | Airtable (Create)      | Log new post data and generated content in Airtable | Filter Errored              | Ping Me                      |                                                     |
| Ping Me                      | Telegram               | Notify user with generated posts before final post | Create Item                  | Wait for 5 mins before posting | "Just pinging the owner that something is about to be posted and wait for 5 mins before final posting." |
| Wait for 5 mins before posting | Wait                  | Delay before posting to social media                | Ping Me                     | X, LinkedIn                  |                                                     |
| X                           | Twitter                | Post generated tweet to Twitter (X)                 | Wait for 5 mins before posting | Update X Status              | "One last magic trick, Send the generated Tweet and the post to the respective platforms." |
| LinkedIn                    | LinkedIn               | Post generated LinkedIn content                      | Wait for 5 mins before posting | Update L Status              | "One last magic trick, Send the generated Tweet and the post to the respective platforms." |
| Update X Status             | Airtable (Update)      | Mark Twitter post as done in Airtable               | X                           | No Operation, do nothing      |                                                     |
| Update L Status            | Airtable (Update)      | Mark LinkedIn post as done in Airtable              | LinkedIn                    | No Operation, do nothing      |                                                     |
| No Operation, do nothing    | NoOp                   | Placeholder after status updates                     | Update X Status, Update L Status | None                     |                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Set interval to every 6 hours.

2. **Create an HTTP Request node named "Crawl HN Home"**  
   - URL: `https://news.ycombinator.com/`  
   - Configure to never error on HTTP failure and return full response.  
   - Connect the Schedule Trigger output to this node.

3. **Create a Code node named "Extract Meta"**  
   - Language: Python  
   - Paste the provided Python code that installs `beautifulsoup4` and `simplejson`, parses the HTML, and extracts GitHub posts metadata (title, url, score, author, comments, etc.).  
   - Input: Connect from "Crawl HN Home".  
   - Output: List of dictionaries per GitHub post.

4. **Create an Airtable node named "Search Item"**  
   - Operation: Search  
   - Base: Select or enter your Airtable base containing the "My Tweets" table.  
   - Table: Select "My Tweets".  
   - Fields: Title, Url, Tweet, Date, Post  
   - Filter formula: `={Post}= {{ $json.Post }}`  
   - Credentials: Airtable Personal Access Token (configured).  
   - Connect from "Extract Meta".

5. **Create a Merge node**  
   - Connect "Extract Meta" to input 1 and "Search Item" to input 2.  
   - Default merge mode.

6. **Create a Code node named "Filter Unposted Items"**  
   - Language: JavaScript  
   - Paste the provided JS code that filters out posts already found in Airtable.  
   - Input: Connect from "Merge".

7. **Create an HTTP Request node named "Visit GH Page"**  
   - URL: `={{ $json.url }}` (dynamic from item)  
   - Connect from "Filter Unposted Items".

8. **Create a Markdown node named "Convert HTML To Markdown"**  
   - Input: HTML field set to `={{ $json.data }}` from "Visit GH Page" output.  
   - Connect from "Visit GH Page".

9. **Create an OpenAI node named "Generate Content"**  
   - Model: GPT-4o-mini (or equivalent available)  
   - Configure system prompt as social media assistant with guidelines.  
   - User prompt includes title, markdown details, and repo link (dynamic expressions).  
   - Enable JSON output parsing.  
   - Credentials: OpenAI API key configured.  
   - Connect from "Convert HTML To Markdown".

10. **Create a Code node named "Validate Generate Content"**  
    - Language: JavaScript  
    - Paste the JS code that validates AI output contains twitter and linkedin fields, parsing JSON if necessary.  
    - Connect from "Generate Content".  
    - Set "On Error" to continue workflow.

11. **Create a Filter node named "Filter Errored"**  
    - Condition: `$json.error` is empty (string empty)  
    - Connect from "Validate Generate Content".

12. **Create an Airtable node named "Create Item"**  
    - Operation: Create  
    - Base and Table same as before.  
    - Map fields: Title, Url, Post, Tweet, LinkedIn from input data and AI output JSON.  
    - Credentials: Airtable token configured.  
    - Connect from "Filter Errored".

13. **Create a Telegram node named "Ping Me"**  
    - Message Text: Include Tweet and LinkedIn post fields (Airtable fields).  
    - Chat ID: Your Telegram chat ID.  
    - Credentials: Telegram API configured.  
    - Connect from "Create Item".

14. **Create a Wait node named "Wait for 5 mins before posting"**  
    - Wait time: 5 minutes.  
    - Connect from "Ping Me".

15. **Create a Twitter node named "X"**  
    - Text: From AI output twitter post field.  
    - Credentials: Twitter OAuth2 configured.  
    - Connect from "Wait for 5 mins before posting".

16. **Create a LinkedIn node named "LinkedIn"**  
    - Text: From AI output linkedin post field.  
    - Credentials: LinkedIn OAuth2 configured.  
    - Connect from "Wait for 5 mins before posting".

17. **Create Airtable Update nodes named "Update X Status" and "Update L Status"**  
    - Operation: Update  
    - Base/Table same as before.  
    - Update `TDone` to true for "Update X Status" and `LDone` to true for "Update L Status".  
    - Use record ID from "Create Item".  
    - Connect "Update X Status" from "X" node output.  
    - Connect "Update L Status" from "LinkedIn" node output.

18. **Create No Operation nodes "No Operation, do nothing"**  
    - Connect from both Airtable Update nodes as final steps.

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                                                                                                      |
|---------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Automate the curation and sharing of trending GitHub discussions from Hacker News to Twitter and LinkedIn.     | Workflow purpose summary.                                                                                           |
| Set up your Airtable Base with fields Title, URL, Post Content, Status, and Timestamp for tracking posts.      | Airtable setup reference: https://airtable.com/invite/r/sk9yE4mh                                                     |
| Ensure you have API credentials for LinkedIn, Twitter, Airtable, OpenAI, and Telegram before running workflow. | Credential requirements.                                                                                            |
| Telegram node requires your chat ID for notifications.                                                         | Telegram chat ID must be configured in "Ping Me" node.                                                              |
| AI prompt can be tweaked to adjust tone or style of generated posts.                                           | As noted in system prompt for OpenAI node.                                                                          |
| Workflow inspired by n8n AI agentic workflows and community examples.                                          | https://blog.n8n.io/ai-agentic-workflows/ and https://community.n8n.io/t/how-to-build-a-telegram-ai-bot-with-n8n-step-by-step-tutorial/39748 |

---

This completes the detailed analysis and reproduction guide for the **AI-Powered Social Media Amplifier** workflow. The documentation enables a developer or AI agent to fully understand, modify, and rebuild the workflow without access to the original JSON.