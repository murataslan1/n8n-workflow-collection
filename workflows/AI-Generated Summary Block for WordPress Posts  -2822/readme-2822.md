AI-Generated Summary Block for WordPress Posts  

https://n8nworkflows.xyz/workflows/ai-generated-summary-block-for-wordpress-posts---2822


# AI-Generated Summary Block for WordPress Posts  

### 1. Workflow Overview

This workflow automates the generation and insertion of AI-generated summary blocks at the top of WordPress posts. It is designed to run either on a scheduled interval or triggered via a webhook when new posts are published. The workflow fetches posts from WordPress, converts their content to Markdown for AI processing, generates concise summaries using OpenAI, updates the posts with these summaries, and logs the processed posts in Google Sheets while notifying a Slack channel.

The workflow is logically divided into the following blocks:

- **1.1 Trigger Block:** Initiates the workflow either manually, via schedule, or webhook.
- **1.2 Post Retrieval Block:** Fetches posts from WordPress based on trigger type and filters.
- **1.3 Post Processing Loop:** Iterates over each post to process individually.
- **1.4 Post Summary Check Block:** Checks if a post already has an AI summary using Google Sheets and AI classification.
- **1.5 AI Summary Generation Block:** Converts HTML to Markdown and generates an AI summary using OpenAI.
- **1.6 Post Update Block:** Updates the WordPress post content with the AI summary and preserves the excerpt.
- **1.7 Logging and Notification Block:** Logs the updated post in Google Sheets and sends a notification to Slack.
- **1.8 Utility and Setup Notes:** Sticky notes providing detailed instructions and customization tips.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger Block

- **Overview:** Starts the workflow either manually, on a schedule, or via webhook.
- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Schedule Trigger (disabled by default)  
  - Webhook (disabled by default)  
  - Set fields - From Webhook input  
  - Date & Time - Substract

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Allows manual testing of the workflow.  
    - Configuration: No parameters; triggers workflow on manual start.  
    - Connections: Outputs to "WordPress - Get All Posts".  
    - Edge cases: None; manual trigger.

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Runs workflow at defined intervals (e.g., every 5 minutes).  
    - Configuration: Interval set in seconds (default 30 seconds in example). Disabled by default.  
    - Connections: Outputs to "Date & Time - Substract".  
    - Edge cases: Time synchronization issues, overlapping runs if interval too short.

  - **Webhook**  
    - Type: Webhook Trigger  
    - Role: Triggers workflow on external HTTP POST with authentication header. Disabled by default.  
    - Configuration: Path set, HTTP method POST, header authentication with credentials.  
    - Connections: Outputs to "Set fields - From Webhook input".  
    - Edge cases: Authentication failure, malformed payload, multiple triggers on edits.

  - **Set fields - From Webhook input**  
    - Type: Set  
    - Role: Extracts `post_id` from webhook payload for downstream use.  
    - Configuration: Assigns `post_id` from `$json.body.post_id`.  
    - Connections: Outputs to "WordPress - Get Post1".  
    - Edge cases: Missing or invalid `post_id` in webhook data.

  - **Date & Time - Substract**  
    - Type: DateTime  
    - Role: Calculates the last execution timestamp minus interval to filter new posts.  
    - Configuration: Subtracts 30 seconds from current timestamp.  
    - Connections: Outputs to "WordPress - Get Last Posts".  
    - Edge cases: Incorrect time zone handling, negative durations.

---

#### 1.2 Post Retrieval Block

- **Overview:** Retrieves WordPress posts based on trigger type and filters to process only relevant posts.
- **Nodes Involved:**  
  - WordPress - Get All Posts  
  - WordPress - Get Last Posts  
  - WordPress - Get Post1  
  - WordPress - Get Post2

- **Node Details:**

  - **WordPress - Get All Posts**  
    - Type: WordPress API  
    - Role: Retrieves all posts (limited to 5 in example) for initial or manual runs.  
    - Configuration: Ordered descending by date, context set to "edit" for raw data.  
    - Connections: Outputs to "Loop Over Items".  
    - Edge cases: Large data sets causing timeouts, API rate limits.

  - **WordPress - Get Last Posts**  
    - Type: WordPress API  
    - Role: Retrieves posts published after last execution time (used with schedule trigger).  
    - Configuration: Uses `after` filter with timestamp from "Date & Time - Substract".  
    - Connections: No direct output connections shown (likely manual or for future use).  
    - Edge cases: Time filter inaccuracies, missing posts if clock skewed.

  - **WordPress - Get Post1**  
    - Type: WordPress API  
    - Role: Retrieves a single post by `post_id` (used with webhook trigger).  
    - Configuration: Context "edit" for raw data.  
    - Connections: No output connections shown (likely for validation or future use).  
    - Edge cases: Invalid post ID, post not found.

  - **WordPress - Get Post2**  
    - Type: WordPress API  
    - Role: Retrieves a single post by `id` from loop for processing.  
    - Configuration: Context "edit" to get raw content for update.  
    - Connections: Outputs to "HTML to Markdown".  
    - Edge cases: Post deleted or inaccessible, API errors.

---

#### 1.3 Post Processing Loop

- **Overview:** Processes each retrieved post individually to handle AI summary generation and updates.
- **Nodes Involved:**  
  - Loop Over Items

- **Node Details:**

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Iterates over posts one by one to optimize processing and API calls.  
    - Configuration: Default batch size (1 item per batch).  
    - Connections: Outputs to "No Operation, do nothing" (for skipping) and "Google Sheets - Get rows".  
    - Edge cases: Large batch sizes may cause rate limits; empty input.

---

#### 1.4 Post Summary Check Block

- **Overview:** Checks if a post already has an AI-generated summary to avoid duplicate processing.
- **Nodes Involved:**  
  - Google Sheets - Get rows  
  - If  
  - Text Classifier  
  - No Operation, do nothing

- **Node Details:**

  - **Google Sheets - Get rows**  
    - Type: Google Sheets  
    - Role: Queries Google Sheets to find if `post_id` exists (indicating prior summary).  
    - Configuration: Uses filter on `post_id` column matching current post's ID.  
    - Connections: Outputs to "If".  
    - Edge cases: Google API auth errors, sheet structure changes.

  - **If**  
    - Type: If  
    - Role: Checks if Google Sheets returned any rows (post already summarized).  
    - Configuration: Condition checks existence of `post_id`.  
    - Connections: True branch to "Loop Over Items" (skip processing), False branch to "WordPress - Get Post2".  
    - Edge cases: Expression errors, missing data.

  - **Text Classifier**  
    - Type: Langchain Text Classifier  
    - Role: Classifies post content as "summarized" or "not_summarized" based on presence of AI summary block.  
    - Configuration: Uses system prompt with strict JSON output, categories "summarized" and "not_summarized".  
    - Connections: True branch to "Loop Over Items" (skip), False branch to "OpenAI" (generate summary).  
    - Edge cases: AI API errors, classification ambiguity.

  - **No Operation, do nothing**  
    - Type: NoOp  
    - Role: Placeholder node for posts that do not require processing.  
    - Connections: None.  
    - Edge cases: None.

---

#### 1.5 AI Summary Generation Block

- **Overview:** Converts post HTML content to Markdown and generates an AI summary using OpenAI GPT-4o-mini.
- **Nodes Involved:**  
  - WordPress - Get Post2  
  - HTML to Markdown  
  - OpenAI

- **Node Details:**

  - **HTML to Markdown**  
    - Type: Markdown Converter  
    - Role: Converts post HTML content to Markdown for better AI processing.  
    - Configuration: Converts `$json.content.rendered`.  
    - Connections: Outputs to "Text Classifier".  
    - Edge cases: Malformed HTML, conversion errors.

  - **OpenAI**  
    - Type: Langchain OpenAI Node  
    - Role: Sends Markdown content to GPT-4o-mini to generate a concise HTML summary block.  
    - Configuration:  
      - Model: GPT-4o-mini  
      - System prompt instructs to generate a bullet-point summary in a specific HTML block format with strict output rules.  
      - Retry on failure enabled.  
    - Connections: Outputs to "Wordpress - Update Post".  
    - Edge cases: API rate limits, prompt misinterpretation, network timeouts.

---

#### 1.6 Post Update Block

- **Overview:** Updates the WordPress post content by inserting the AI summary at the top and preserves the original excerpt.
- **Nodes Involved:**  
  - Wordpress - Update Post  
  - Set fields - Prepare data for Gsheets & Slack

- **Node Details:**

  - **Wordpress - Update Post**  
    - Type: HTTP Request (WordPress API)  
    - Role: Updates the post content and excerpt via WordPress REST API.  
    - Configuration:  
      - URL: `https://<your-domain.com>/wp-json/wp/v2/posts/{{ post_id }}`  
      - Method: POST  
      - Body parameters:  
        - `content`: Concatenates AI summary HTML with original post content.  
        - `excerpt`: Preserves original excerpt.  
      - Authentication: WordPress API credentials.  
    - Connections: Outputs to "Set fields - Prepare data for Gsheets & Slack".  
    - Edge cases: API authentication failure, content update conflicts.

  - **Set fields - Prepare data for Gsheets & Slack**  
    - Type: Set  
    - Role: Prepares structured data fields for logging and notifications.  
    - Configuration: Sets fields like `post_id`, `title`, `post_link`, `edit_link`, `summary`, and `summary_date`.  
    - Connections: Outputs to "Google Sheets - Add Row".  
    - Edge cases: Missing data fields, expression errors.

---

#### 1.7 Logging and Notification Block

- **Overview:** Logs the processed post in Google Sheets and sends a notification message to a Slack channel.
- **Nodes Involved:**  
  - Google Sheets - Add Row  
  - Slack - Notify Channel

- **Node Details:**

  - **Google Sheets - Add Row**  
    - Type: Google Sheets  
    - Role: Appends a new row with post summary data to a Google Sheet.  
    - Configuration:  
      - Document: AI Summary WordPress Posts  
      - Sheet: AI-Summarized Posts  
      - Auto-mapping columns based on field names.  
      - Authentication: Service account.  
    - Connections: Outputs to "Slack - Notify Channel".  
    - Edge cases: API quota exceeded, sheet permission errors.

  - **Slack - Notify Channel**  
    - Type: Slack  
    - Role: Sends a notification message to a Slack channel about the updated post.  
    - Configuration:  
      - Channel: `wp-posts-ai` (configurable)  
      - Message: Includes post title, links, and IDs with markdown formatting.  
      - Authentication: OAuth2 Slack credentials.  
    - Connections: None.  
    - Edge cases: Slack API rate limits, invalid channel ID.

---

#### 1.8 Utility and Setup Notes

- **Overview:** Sticky notes provide detailed instructions, setup tips, and customization guidance.
- **Nodes Involved:**  
  - Multiple Sticky Note nodes (9 total) scattered throughout the workflow.

- **Node Details:**  
  - Provide explanations on trigger options, WordPress post retrieval, looping logic, Google Sheets integration, AI prompt customization, WordPress update nuances, and Slack notification best practices.  
  - Include links to Google Sheets templates and example images.  
  - Edge cases: None (informational only).

---

### 3. Summary Table

| Node Name                          | Node Type                      | Functional Role                              | Input Node(s)                      | Output Node(s)                         | Sticky Note                                                                                             |
|-----------------------------------|--------------------------------|----------------------------------------------|----------------------------------|--------------------------------------|-------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’      | Manual Trigger                 | Manual start trigger                          | -                                | WordPress - Get All Posts             | See Sticky Note: Trigger options including manual, schedule, webhook                                  |
| Schedule Trigger                   | Schedule Trigger               | Scheduled interval trigger                    | -                                | Date & Time - Substract               | See Sticky Note: Trigger options including schedule and webhook                                       |
| Webhook                          | Webhook                       | Webhook trigger for new posts                 | -                                | Set fields - From Webhook input       | See Sticky Note: Trigger options including webhook setup and security                                 |
| Set fields - From Webhook input   | Set                           | Extracts post_id from webhook payload         | Webhook                         | WordPress - Get Post1                 |                                                                                                       |
| Date & Time - Substract           | DateTime                      | Calculates last execution time minus interval | Schedule Trigger                | WordPress - Get Last Posts            |                                                                                                       |
| WordPress - Get All Posts         | WordPress API                 | Retrieves all posts (limited for testing)     | When clicking ‘Test workflow’    | Loop Over Items                      | See Sticky Note: Used for initial/test run, limited to 5 posts                                       |
| WordPress - Get Last Posts        | WordPress API                 | Retrieves posts after last execution time     | Date & Time - Substract          | -                                    |                                                                                                       |
| WordPress - Get Post1             | WordPress API                 | Retrieves single post by post_id (webhook)    | Set fields - From Webhook input  | -                                    |                                                                                                       |
| Loop Over Items                   | SplitInBatches                | Processes posts one by one                      | WordPress - Get All Posts        | No Operation, do nothing; Google Sheets - Get rows | See Sticky Note: Looping logic for batch processing                                                  |
| Google Sheets - Get rows          | Google Sheets                 | Checks if post_id exists in Google Sheets      | Loop Over Items                 | If                                   | See Sticky Note: Google Sheets & IF node logic                                                       |
| If                               | If                           | Branches based on Google Sheets lookup         | Google Sheets - Get rows         | Loop Over Items (skip); WordPress - Get Post2 |                                                                                                       |
| WordPress - Get Post2             | WordPress API                 | Retrieves post content for processing          | If (false branch)               | HTML to Markdown                     | See Sticky Note: Retrieves raw post content for AI processing                                        |
| HTML to Markdown                 | Markdown Converter            | Converts HTML content to Markdown               | WordPress - Get Post2            | Text Classifier                      | See Sticky Note: Prepares content for AI processing                                                  |
| Text Classifier                  | Langchain Text Classifier     | Classifies if post already summarized           | HTML to Markdown                | OpenAI (if not summarized); Loop Over Items (if summarized) | See Sticky Note: Classifies posts to avoid duplicate summaries                                       |
| OpenAI                          | Langchain OpenAI              | Generates AI summary in HTML format             | Text Classifier                 | Wordpress - Update Post              | See Sticky Note: AI prompt customization and output format                                          |
| Wordpress - Update Post          | HTTP Request (WordPress API) | Updates post content and excerpt with summary   | OpenAI                         | Set fields - Prepare data for Gsheets & Slack | See Sticky Note: Updates WordPress post preserving excerpt                                          |
| Set fields - Prepare data for Gsheets & Slack | Set                           | Prepares data fields for logging and notification | Wordpress - Update Post         | Google Sheets - Add Row              | See Sticky Note: Prepares fields for Google Sheets and Slack                                        |
| Google Sheets - Add Row          | Google Sheets                 | Logs post summary data in Google Sheets          | Set fields - Prepare data for Gsheets & Slack | Slack - Notify Channel              | See Sticky Note: Logs data and auto-maps columns                                                   |
| Slack - Notify Channel           | Slack                        | Sends notification to Slack channel              | Google Sheets - Add Row          | -                                    | See Sticky Note: Sends notification message to Slack channel                                        |
| No Operation, do nothing         | NoOp                         | Placeholder for skipping processing              | Loop Over Items                 | -                                    |                                                                                                       |
| Sticky Note (multiple)           | Sticky Note                  | Documentation and setup instructions             | -                                | -                                    | Multiple sticky notes provide detailed explanations and setup guidance                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**
   - Add a **Manual Trigger** node named "When clicking ‘Test workflow’" for manual runs.
   - Add a **Schedule Trigger** node (disabled by default) configured to run at your desired interval (e.g., every 5 minutes).
   - Add a **Webhook** node (disabled by default) configured with:
     - HTTP Method: POST
     - Path: custom path (e.g., `4946fc26-bea4-4244-b37c-203c39537246`)
     - Authentication: Header Auth with credentials.

2. **Set Fields from Webhook Input:**
   - Add a **Set** node named "Set fields - From Webhook input".
   - Assign `post_id` from expression: `{{$json.body.post_id}}`.
   - Connect Webhook node output to this node.

3. **Date & Time Calculation:**
   - Add a **Date & Time** node named "Date & Time - Substract".
   - Configure to subtract 30 seconds (or your schedule interval) from current timestamp.
   - Connect Schedule Trigger output to this node.

4. **Retrieve WordPress Posts:**
   - Add a **WordPress** node named "WordPress - Get All Posts".
     - Operation: Get All
     - Options: Limit to 5 posts (for testing)
     - Context: Edit
   - Connect Manual Trigger output to this node.

   - Add a **WordPress** node named "WordPress - Get Last Posts".
     - Operation: Get All
     - Options: Filter posts published after `{{$json.last_execution_date}}`
     - Context: Edit
   - Connect Date & Time - Substract output to this node.

   - Add a **WordPress** node named "WordPress - Get Post1".
     - Operation: Get
     - Post ID: `{{$json.post_id}}`
     - Context: Edit
   - Connect "Set fields - From Webhook input" output to this node.

5. **Loop Over Posts:**
   - Add a **SplitInBatches** node named "Loop Over Items".
   - Connect "WordPress - Get All Posts" output to this node.

6. **Check for Existing Summary in Google Sheets:**
   - Add a **Google Sheets** node named "Google Sheets - Get rows".
     - Operation: Lookup rows
     - Filter: `post_id` equals current post ID
     - Document and Sheet: Use your Google Sheets document and sheet for logging.
     - Authentication: Service Account.
   - Connect "Loop Over Items" output to this node.

   - Add an **If** node named "If".
     - Condition: Check if `post_id` exists in Google Sheets response.
   - Connect "Google Sheets - Get rows" output to this node.
   - True branch connects back to "Loop Over Items" (skip processing).
   - False branch connects to "WordPress - Get Post2".

7. **Retrieve Post Content for Processing:**
   - Add a **WordPress** node named "WordPress - Get Post2".
     - Operation: Get
     - Post ID: `{{$json.id}}` from loop
     - Context: Edit
   - Connect "If" false branch to this node.

8. **Convert HTML to Markdown:**
   - Add a **Markdown** node named "HTML to Markdown".
     - Input: `{{$json.content.rendered}}`
   - Connect "WordPress - Get Post2" output to this node.

9. **Classify Post Content:**
   - Add a **Langchain Text Classifier** node named "Text Classifier".
     - System prompt instructs classification into "summarized" or "not_summarized" based on presence of AI summary block.
     - Input text: `{{$json.data}}` from Markdown node.
     - Categories: "not_summarized" and "summarized".
   - Connect "HTML to Markdown" output to this node.

10. **Branch Based on Classification:**
    - True branch (summarized): Connect to "Loop Over Items" (skip).
    - False branch (not summarized): Connect to "OpenAI" node.

11. **Generate AI Summary:**
    - Add a **Langchain OpenAI** node named "OpenAI".
      - Model: GPT-4o-mini
      - System prompt: Detailed instructions to generate a bullet-point HTML summary block with strict formatting.
      - Input: Markdown content from previous node.
      - Retry on failure enabled.
    - Connect "Text Classifier" false branch to this node.

12. **Update WordPress Post:**
    - Add an **HTTP Request** node named "Wordpress - Update Post".
      - Method: POST
      - URL: `https://<your-domain.com>/wp-json/wp/v2/posts/{{ $json.id }}`
      - Body parameters:
        - `content`: Concatenate AI summary HTML with original post content.
        - `excerpt`: Preserve original excerpt.
      - Authentication: WordPress API credentials.
    - Connect "OpenAI" output to this node.

13. **Prepare Data for Logging and Notification:**
    - Add a **Set** node named "Set fields - Prepare data for Gsheets & Slack".
      - Assign fields: `post_id`, `title`, `post_link`, `edit_link`, `summary`, `summary_date`.
      - Use expressions to extract values from previous nodes.
    - Connect "Wordpress - Update Post" output to this node.

14. **Log to Google Sheets:**
    - Add a **Google Sheets** node named "Google Sheets - Add Row".
      - Operation: Append row
      - Document and Sheet: Same as "Get rows"
      - Auto-map columns based on field names.
      - Authentication: Service Account.
    - Connect "Set fields - Prepare data for Gsheets & Slack" output to this node.

15. **Send Slack Notification:**
    - Add a **Slack** node named "Slack - Notify Channel".
      - Channel: `wp-posts-ai` or your choice.
      - Message: Includes post title, links, and IDs with markdown formatting.
      - Authentication: Slack OAuth2 credentials.
    - Connect "Google Sheets - Add Row" output to this node.

16. **Add No Operation Node:**
    - Add a **No Operation** node named "No Operation, do nothing".
    - Connect "Loop Over Items" first output (skip branch) to this node.

17. **Add Sticky Notes:**
    - Add sticky notes at appropriate positions with setup instructions, customization tips, and links as per the original workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                              |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| This workflow automates AI-generated summaries for WordPress posts without requiring a plugin, keeping the site lightweight and flexible.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Workflow purpose                                                                                             |
| Example AI Summary Section image: ![Example](https://i.imgur.com/XkNKJsJ.png)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Visual example of AI summary block                                                                           |
| Google Sheets template for logging summarized posts: [Make a copy here](https://docs.google.com/spreadsheets/d/1uO0zaNc5UrLhtdcvETFcZGln_qij-nqpYP06n9GxJUk/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Google Sheets template                                                                                        |
| Slack channel used for notifications: `wp-posts-ai` (configurable)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Slack channel setup                                                                                           |
| AI model used: GPT-4o-mini for cost-effective and efficient summarization. Customize system prompt to match your website theme and desired output format.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | AI model and prompt customization                                                                             |
| Recommended trigger options: Schedule Trigger for periodic checks or Webhook for event-driven updates. Manual trigger available for testing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Trigger options                                                                                               |
| Preserve original post excerpt when updating content to maintain user experience on article listing pages.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Post update best practice                                                                                      |
| Consider disabling Slack notifications on first run if processing many posts to avoid notification overload.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Slack notification best practice                                                                               |
| Ensure Google Sheets column names match the field names used in the workflow for auto-mapping to work correctly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Google Sheets integration tip                                                                                  |
| Customize AI summary HTML styling (background color, font weight, section title) in the OpenAI system prompt to match your WordPress theme.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | AI summary styling customization                                                                               |

---

This comprehensive documentation enables users and AI agents to fully understand, reproduce, and customize the AI-generated summary workflow for WordPress posts using n8n.