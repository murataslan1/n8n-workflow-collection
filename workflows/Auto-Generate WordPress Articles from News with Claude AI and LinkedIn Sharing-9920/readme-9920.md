Auto-Generate WordPress Articles from News with Claude AI and LinkedIn Sharing

https://n8nworkflows.xyz/workflows/auto-generate-wordpress-articles-from-news-with-claude-ai-and-linkedin-sharing-9920


# Auto-Generate WordPress Articles from News with Claude AI and LinkedIn Sharing

### 1. Workflow Overview

This workflow automates the generation and publication of WordPress blog articles from the latest news, leveraging AI for content creation, human approval for quality control, and social media sharing on LinkedIn. It is designed for content teams or marketers seeking to streamline content pipelines by integrating news aggregation, AI drafting, approval workflows, content publishing, and logging.

The workflow can start manually or on a daily schedule and is logically divided into these main blocks:

- **1.1 Trigger & News Fetching:** Initiates workflow manually or on schedule and fetches news data from an external API.
- **1.2 AI Content Generation:** Processes the fetched news through an AI language model (Anthropic Claude) to draft a blog article with structured output.
- **1.3 Approval Process:** Sends the AI-generated article via Gmail for user approval with options to approve or decline.
- **1.4 Publishing & Sharing:** If approved, selects a featured image, publishes the article to WordPress, retrieves the post thumbnail, and shares the post on LinkedIn. Sends confirmation emails for published or declined articles.
- **1.5 Logging:** Independently logs all AI-generated content and metadata into a Google Sheet for audit and tracking purposes.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger & News Fetching

- **Overview:** This block starts the workflow either on a daily schedule at 10:30 AM or manually via UI trigger. It fetches the latest news articles from a configured news API using HTTP requests with header authentication.
- **Nodes Involved:**  
  - Schedule Trigger  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Fetching news (HTTP Request)  
  - JSON Parsing (Code Node)  

- **Node Details:**  

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Automatically initiates the workflow daily at 10:30 AM.  
    - Config: Interval set to trigger at 10:30 every day.  
    - Inputs: None  
    - Outputs: Connects to Fetching news node.  
    - Edge cases: Workflow may not trigger if n8n server is down or time zone mismatches occur.

  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Allows manual execution from the UI.  
    - Config: Default manual trigger parameters.  
    - Inputs: None  
    - Outputs: Connects to Fetching news node.  

  - **Fetching news (HTTP Request)**  
    - Type: HTTP Request  
    - Role: Retrieves news articles from the CurrentsAPI service.  
    - Config:  
      - URL: https://api.currentsapi.services/v1/search  
      - Auth: HTTP Header Auth with CurrentsAPI API key credential  
      - Query Parameters: Configurable search filters (keywords, language, etc.)  
      - Retry on failure enabled with 3-second intervals.  
    - Inputs: Trigger nodes  
    - Outputs: JSON news data to JSON Parsing node.  
    - Edge cases: API limit exceeded, invalid API key, network timeout, malformed response.

  - **JSON Parsing (Code Node)**  
    - Type: Code (JavaScript)  
    - Role: Converts raw API news JSON into a string property `userNews` for AI input.  
    - Config: Uses `JSON.stringify` on the first input item’s `news` property.  
    - Inputs: HTTP Request output  
    - Outputs: One JSON object containing `userNews` string for AI consumption.  
    - Edge cases: Empty news array, invalid JSON structure.

---

#### 2.2 AI Content Generation

- **Overview:** Feeds the formatted news string into an AI language model (Anthropic Claude) to draft a blog article with title and content, ensuring output is parsed into structured JSON.
- **Nodes Involved:**  
  - Anthropic Chat Model  
  - Structured Output Parser  
  - Basic LLM Chain  

- **Node Details:**  

  - **Anthropic Chat Model**  
    - Type: Langchain AI Model (Anthropic)  
    - Role: Processes prompts with Claude model (claude-sonnet-4-20250514) for content generation.  
    - Config: Uses a specific Claude model variant optimized for content creation.  
    - Inputs: Prompt text from Basic LLM Chain  
    - Outputs: Raw AI response to Structured Output Parser.  
    - Edge cases: API key invalid, rate limits, incomplete responses.

  - **Structured Output Parser**  
    - Type: Langchain Output Parser  
    - Role: Converts AI raw responses into JSON objects containing `title` and `content`.  
    - Config: JSON Schema example specifying required fields.  
    - Inputs: AI model output  
    - Outputs: Parsed structured JSON to Basic LLM Chain.  
    - Edge cases: Malformed AI output, parsing errors.

  - **Basic LLM Chain**  
    - Type: Langchain Chain  
    - Role: Orchestrates prompt sending and output processing combining prompt, AI, and parser.  
    - Config:  
      - Prompt uses detailed instructions and injected `userNews` string.  
      - Output parser enabled to receive structured JSON.  
    - Inputs: Formatted news from JSON Parsing, AI model & parser outputs.  
    - Outputs: AI-generated article with JSON fields `title` and `content` to Approval request and Wait nodes.  
    - Edge cases: Prompt syntax errors, incomplete AI output, parser failures.

---

#### 2.3 Approval Process

- **Overview:** Sends the AI-generated article draft to a specified Gmail address for human approval with email buttons for "Approve" or "Decline." The workflow pauses until a response is received.
- **Nodes Involved:**  
  - Approval request (Gmail)  
  - If  

- **Node Details:**  

  - **Approval request (Gmail)**  
    - Type: Gmail node with approval feature  
    - Role: Sends email containing article title and content, waits for approval interaction.  
    - Config:  
      - Recipient email configured with user email.  
      - Subject dynamically includes article title.  
      - Options for double approval buttons (approve/decline).  
    - Inputs: AI-generated article JSON  
    - Outputs: Approval response to If node.  
    - Edge cases: Email delivery failure, no response (timeout), button click failures.

  - **If**  
    - Type: Conditional node  
    - Role: Checks if the article is approved (`$json.data.approved === true`).  
    - Config: String equality condition on approval status.  
    - Inputs: Approval request output  
    - Outputs: Two branches: approved (true) and declined (false).  
    - Edge cases: Missing approval data, unexpected values.

---

#### 2.4 Publishing & Sharing

- **Overview:** If approved, randomly selects a featured image, publishes the article to WordPress site via API, retrieves the post thumbnail URL, shares the post on LinkedIn, and sends confirmation email. If declined, sends a decline notification email.
- **Nodes Involved:**  
  - Choose image from array (Code)  
  - Push article to WordPress (HTTP Request)  
  - GET Image for Linkedin (HTTP Request)  
  - Push to Linkedin Page (LinkedIn)  
  - Success message (Gmail)  
  - Failure message (Gmail)  

- **Node Details:**  

  - **Choose image from array (Code Node)**  
    - Type: Code  
    - Role: Randomly selects an image ID from a predefined array of WordPress media IDs.  
    - Config: Array hardcoded with image IDs (`["131", "130", "129", "70"]`).  
    - Inputs: If node approval branch (true)  
    - Outputs: Selected image ID as `choice` property.  
    - Edge cases: Empty array, invalid image IDs.

  - **Push article to WordPress (HTTP Request)**  
    - Type: HTTP Request  
    - Role: Posts new blog article with title, content, and featured image ID to WordPress REST API.  
    - Config:  
      - Endpoint URL with placeholder `<site_Id>` to be replaced with actual WordPress site ID.  
      - Method: POST  
      - Auth: OAuth2 with WordPress.com credentials  
      - Body parameters: title, content, featured_image (from previous node)  
    - Inputs: Image choice node  
    - Outputs: WordPress post response JSON to GET Image for Linkedin.  
    - Edge cases: Auth failures, invalid site ID, API errors, content length limits.

  - **GET Image for Linkedin (HTTP Request)**  
    - Type: HTTP Request  
    - Role: Fetches the thumbnail image URL of the newly published post.  
    - Config: URL dynamically set from the WordPress post thumbnail URL field.  
    - Inputs: WordPress post response  
    - Outputs: Binary image data (thumbnail) to Push to Linkedin Page.  
    - Edge cases: Missing thumbnail URL, network errors.

  - **Push to Linkedin Page (LinkedIn node)**  
    - Type: LinkedIn node  
    - Role: Shares the article on a LinkedIn organization page with title, URL, and thumbnail image.  
    - Config:  
      - Post as organization with configured Organization ID (`111111111` placeholder)  
      - Text set to article title  
      - Original URL and thumbnail binary assigned  
    - Inputs: Thumbnail image data  
    - Outputs: Confirmation to Success message.  
    - Edge cases: OAuth token expiration, organization ID errors, LinkedIn API limits.

  - **Success message (Gmail)**  
    - Type: Gmail node  
    - Role: Sends confirmation email upon successful publishing including article short URL.  
    - Config: Recipient email configured, subject fixed, message includes dynamic URL from WordPress post.  
    - Inputs: LinkedIn share output  
    - Outputs: End node  
    - Edge cases: Email delivery issues.

  - **Failure message (Gmail)**  
    - Type: Gmail node  
    - Role: Sends email notifying the user the article was declined.  
    - Config: Recipient email, fixed subject, message includes declined article content snippet.  
    - Inputs: If node declined branch  
    - Outputs: End node  
    - Edge cases: Email delivery issues.

---

#### 2.5 Logging

- **Overview:** Runs in parallel to the approval process, waiting briefly before appending the AI-generated article data into a Google Sheet for record-keeping.
- **Nodes Involved:**  
  - Wait  
  - Append log to sheet (Google Sheets)

- **Node Details:**  

  - **Wait**  
    - Type: Wait node  
    - Role: Provides a short pause before logging, ensuring data is ready.  
    - Config: Default wait parameters (unspecified duration).  
    - Inputs: Basic LLM Chain output (AI article)  
    - Outputs: Append log to sheet node.  
    - Edge cases: Misconfigured wait duration causing delays.

  - **Append log to sheet (Google Sheets)**  
    - Type: Google Sheets node  
    - Role: Appends a new row to a Google Sheet logging article ID, type, role, model, content, and other metadata.  
    - Config:  
      - Document ID and sheet name configured with a specific Google Sheet.  
      - Auto maps input data fields to columns.  
      - Auth: Google OAuth2 credentials.  
    - Inputs: Wait node output  
    - Outputs: None (end of branch)  
    - Edge cases: Auth expiration, sheet access permission issues, API quota limits.

---

### 3. Summary Table

| Node Name                 | Node Type                  | Functional Role                   | Input Node(s)                      | Output Node(s)                      | Sticky Note                                                                                                                   |
|---------------------------|----------------------------|---------------------------------|----------------------------------|-----------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger             | Manual workflow start            | None                             | Fetching news                     | ## TRIGGER The workflow can be initiated manually or on schedule.                                                             |
| Schedule Trigger          | Schedule Trigger           | Scheduled workflow start         | None                             | Fetching news                     | ## TRIGGER The workflow can be initiated manually or on schedule.                                                             |
| Fetching news             | HTTP Request              | Fetches latest news from API     | Schedule Trigger, Manual Trigger | JSON Parsing                     | ## CONTENT GENERATION Fetches news from an external API for AI drafting.                                                      |
| JSON Parsing              | Code                      | Formats news JSON to string      | Fetching news                    | Basic LLM Chain                  | ## CONTENT GENERATION Formats raw news data for AI prompt.                                                                    |
| Anthropic Chat Model      | Langchain AI Model        | AI model for text generation     | Basic LLM Chain (ai_languageModel) | Structured Output Parser         | ## CONTENT GENERATION Uses Claude AI to draft article.                                                                         |
| Structured Output Parser  | Langchain Output Parser   | Parses AI output to JSON         | Anthropic Chat Model             | Basic LLM Chain                  | ## CONTENT GENERATION Ensures AI output is structured with title and content.                                                  |
| Basic LLM Chain           | Langchain Chain           | Orchestrates AI prompt and output| JSON Parsing, Anthropic Chat Model, Structured Output Parser | Approval request, Wait          | ## CONTENT GENERATION Main AI drafting node with prompt and output parser.                                                    |
| Approval request          | Gmail                     | Sends article for approval       | Basic LLM Chain                 | If                              | ## HUMAN TOUCH Sends email with approve/decline buttons and waits for response.                                                |
| If                       | If                        | Checks approval result           | Approval request                | Choose image from array (approved), Failure message (declined) | ## PUBLISHING CONTENT Routes workflow based on approval decision.                                                              |
| Choose image from array   | Code                      | Selects featured image ID        | If (approved branch)            | Push article to WordPress        | ## PUBLISHING CONTENT Picks random image from predefined list for WordPress post.                                              |
| Push article to WordPress | HTTP Request              | Posts article to WordPress       | Choose image from array         | GET Image for Linkedin           | ## PUBLISHING CONTENT Publishes approved article via WordPress API.                                                            |
| GET Image for Linkedin    | HTTP Request              | Retrieves post thumbnail image   | Push article to WordPress       | Push to Linkedin Page            | ## PUBLISHING CONTENT Fetches thumbnail for LinkedIn sharing.                                                                   |
| Push to Linkedin Page     | LinkedIn                  | Shares article on LinkedIn       | GET Image for Linkedin          | Success message                 | ## PUBLISHING CONTENT Posts article on LinkedIn organization page.                                                             |
| Success message           | Gmail                     | Sends confirmation email         | Push to Linkedin Page           | None                           | ## PUBLISHING CONTENT Notifies user of successful publication.                                                                  |
| Failure message           | Gmail                     | Sends decline notification       | If (declined branch)            | None                           | ## PUBLISHING CONTENT Notifies user article was declined.                                                                       |
| Wait                      | Wait                      | Short pause before logging       | Basic LLM Chain                 | Append log to sheet             | ## LOGGING Waits shortly before appending log entry to Google Sheet.                                                            |
| Append log to sheet       | Google Sheets             | Logs generated article to sheet  | Wait                          | None                           | ## LOGGING Records all generated content for auditing regardless of approval.                                                   |
| Sticky Note               | Sticky Note               | Informational note               | None                           | None                           | ## LOGGING Describes logging process with Wait and Google Sheets logging nodes.                                                  |
| Sticky Note1              | Sticky Note               | Informational note               | None                           | None                           | ## CONTENT GENERATION Describes news fetching, formatting, AI drafting, and models used.                                        |
| Sticky Note2              | Sticky Note               | Informational note               | None                           | None                           | ## HUMAN TOUCH Describes approval email workflow.                                                                               |
| Sticky Note3              | Sticky Note               | Informational note               | None                           | None                           | ## PUBLISHING CONTENT Describes publishing, image selection, LinkedIn sharing, and email notifications.                        |
| Sticky Note4              | Sticky Note               | Informational note               | None                           | None                           | ## TRIGGER Describes manual and scheduled triggers.                                                                             |
| Sticky Note5              | Sticky Note               | Informational note               | None                           | None                           | ## AI-Powered Blog Automation Overview and setup instructions including credentials and config notes with external links.      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a **Schedule Trigger** node. Configure it to trigger daily at 10:30 AM.  
   - Add a **Manual Trigger** node for manual execution.

2. **Fetch News:**  
   - Add an **HTTP Request** node named "Fetching news".  
   - Set URL to `https://api.currentsapi.services/v1/search`.  
   - Use HTTP Header Auth credentials for the CurrentsAPI.  
   - Configure query parameters as needed (e.g., keywords, language).  
   - Enable retry on fail with 3-second interval.

3. **Parse JSON News:**  
   - Add a **Code** node named "JSON Parsing".  
   - Code: stringifies the incoming news JSON into a single string `userNews`.

4. **AI Content Generation Setup:**  
   - Add **Basic LLM Chain** node.  
   - Create a prompt that instructs the AI to generate a blog article from `userNews`.  
   - Add **Anthropic Chat Model** node configured with the Claude model `claude-sonnet-4-20250514`.  
   - Connect Anthropic node to Basic LLM Chain as AI model.  
   - Add **Structured Output Parser** node with JSON schema example `{ "title": "Title of the article", "content": "content of the article" }`.  
   - Connect parser to Basic LLM Chain.  
   - Connect JSON Parsing output to Basic LLM Chain input.

5. **Approval Request:**  
   - Add **Gmail** node named "Approval request".  
   - Configure to send to your email with subject "Article approval: {{ $json.output.title }}".  
   - Message body includes article content `{{ $json.output.content }}`.  
   - Enable "send and wait" with double approval buttons.  
   - Connect Basic LLM Chain output to this node.

6. **Approval Conditional:**  
   - Add an **If** node.  
   - Condition: `$json.data.approved` equals `"true"`.  
   - Connect Approval request output to If node input.

7. **If Approved Branch:**  
   - Add **Code** node "Choose image from array".  
   - Code picks a random image ID from an array, e.g., `["131", "130", "129", "70"]`.  
   - Connect If node (true) to this node.

   - Add **HTTP Request** node "Push article to WordPress".  
   - URL: `https://public-api.wordpress.com/rest/v1.1/sites/<site_Id>/posts/new` (replace `<site_Id>`).  
   - Method: POST.  
   - OAuth2 credentials for WordPress.  
   - Body params: title and content from Basic LLM Chain output, featured_image from previous code node.  
   - Connect image selector output to this node.

   - Add **HTTP Request** node "GET Image for Linkedin".  
   - URL sourced dynamically from WordPress post thumbnail URL.  
   - Connect WordPress post output to this node.

   - Add **LinkedIn** node "Push to Linkedin Page".  
   - Configure with your LinkedIn Organization ID.  
   - Text set to article title, originalUrl to WordPress post URL, thumbnail image binary from previous node.  
   - Connect GET Image node output to LinkedIn.

   - Add **Gmail** node "Success message".  
   - Sends confirmation email with published article short URL.  
   - Connect LinkedIn node output to this node.

8. **If Declined Branch:**  
   - Add **Gmail** node "Failure message".  
   - Sends notification email that article was declined, including article content snippet.  
   - Connect If node (false) to this node.

9. **Logging Branch (Parallel):**  
   - Add **Wait** node after Basic LLM Chain output to delay slightly.  
   - Add **Google Sheets** node "Append log to sheet".  
   - Configure with your Google Sheets document and target sheet.  
   - Map fields to log article metadata and content.  
   - OAuth2 credentials for Google Sheets.  
   - Connect Wait node output to Google Sheets node.

10. **Connect Triggers:**  
    - Connect Schedule Trigger and Manual Trigger nodes to "Fetching news".

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Context or Link                                                                                     |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| This workflow automates content creation from news sources to WordPress publishing and LinkedIn sharing, including human approval and logging. Requires API keys and OAuth credentials for CurrentsAPI, Anthropic Claude, Google (Gmail & Sheets), WordPress, and LinkedIn. Customize prompts and parameters to fit tone, style, and content preferences.                                                                                                                                                                                                                                                   | Workflow overview and usage notes.                                                                 |
| Anthropic Claude API key can be obtained from [Anthropic](https://www.anthropic.com/). CurrentsAPI for news is available at [CurrentsAPI](https://currentsapi.services/). WordPress REST API documentation: [WordPress Developer Docs](https://developer.wordpress.com/docs/api/).                                                                                                                                                                                                                                                                                                                      | API providers and documentation links.                                                             |
| Setup instructions include replacing placeholders `<site_Id>` in WordPress node and LinkedIn Organization ID, as well as configuring Google Sheet IDs and Gmail recipient emails. The image selection array should be updated with valid WordPress media IDs from your library.                                                                                                                                                                                                                                                                                                                                 | Setup instructions and credential requirements.                                                   |
| Demo video link: YouTube video with ID `AfcYxTdSr9g` demonstrates workflow usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | https://youtube.com/watch?v=AfcYxTdSr9g                                                           |
| Approval emails support double approval buttons (Approve/Decline) integrated into Gmail node, pausing workflow until user interaction.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Gmail node approval feature.                                                                       |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created with n8n, a powerful integration and automation tool. It strictly adheres to content policies and contains no illegal, offensive, or protected material. All processed data is legal and publicly accessible.