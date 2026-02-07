Auto-Publish Content to 9 Social Platforms with Blotato & Airtable

https://n8nworkflows.xyz/workflows/auto-publish-content-to-9-social-platforms-with-blotato---airtable-7223


# Auto-Publish Content to 9 Social Platforms with Blotato & Airtable

### 1. Workflow Overview

This workflow automates the process of publishing video and image content to nine social media platforms using Blotato and Airtable as primary integrations. It targets social media managers and content creators who want to streamline multi-platform publishing, including scheduling, media uploads, and post status tracking. The workflow is structured into the following logical blocks:

- **1.1 Input Reception and Data Retrieval:** Receives new content via webhook and fetches detailed metadata from Airtable.
- **1.2 Content Preparation and Validation:** Enhances the YouTube title for virality and prepares all necessary IDs and texts for publishing.
- **1.3 Media Upload to Blotato:** Uploads images and videos to Blotato to obtain URLs for social posts.
- **1.4 Posting to Social Platforms via Blotato:** Creates posts on Instagram, YouTube, TikTok, Facebook, LinkedIn, Threads, Twitter/X, Pinterest, and BlueSky.
- **1.5 Post-Publish Status Update in Airtable:** Updates Airtable with success or failure logs for each platform.
- **1.6 Pinterest Board ID Extraction:** Provides a small subroutine for extracting Pinterest board IDs from URLs via a form and code node.
- **1.7 Reporting and Notifications:** Optional Telegram notification and internal agent update for workflow completion.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Data Retrieval

**Overview:**  
This block starts the workflow by receiving new content creation data through a webhook and retrieves detailed content metadata from Airtable.

**Nodes Involved:**  
- Webhook from Content Creation  
- Airtable Record ID  
- Airtable

**Node Details:**  
- **Webhook from Content Creation**  
  - Type: Webhook  
  - Role: Receives POST requests with new content data from external systems.  
  - Config: HTTP POST, fixed webhook path.  
  - Input: External trigger.  
  - Output: Provides data for subsequent nodes.  
  - Edge cases: Missing or malformed POST data, webhook authentication not configured (could be a risk).  
- **Airtable Record ID**  
  - Type: Set  
  - Role: Extracts and assigns the Airtable record ID from the webhook payload for use in the Airtable node.  
  - Config: Uses expression to set variable airtableID from webhook JSON body.  
  - Input: Webhook output.  
  - Output: Passes airtableID for Airtable query.  
  - Edge cases: Missing airtableID in payload.  
- **Airtable**  
  - Type: Airtable node  
  - Role: Retrieves record details from Airtable based on airtableID.  
  - Config: Uses Personal Access Token credentials; queries "Media Creation" table in "Social Media System" base by ID.  
  - Input: airtableID from previous node.  
  - Output: Full detailed JSON of content record.  
  - Edge cases: API auth failure, record not found, rate limits.

---

#### 1.2 Content Preparation and Validation

**Overview:**  
This block validates and enhances the content before publishing, specifically rewriting YouTube titles for virality and preparing all social platform IDs and post texts.

**Nodes Involved:**  
- Ensure Valid YouTube Title  
- Prepare for Publish

**Node Details:**  
- **Ensure Valid YouTube Title**  
  - Type: OpenAI (Langchain) node  
  - Role: Uses GPT-5-mini model to rewrite YouTube short video titles aiming for virality under 100 characters.  
  - Config: Sends prompt with current title, expects JSON output with 'youtube_title'.  
  - Input: Airtable record JSON.  
  - Output: JSON with improved title.  
  - Edge cases: OpenAI API failures, output parsing errors, rate limits.  
- **Prepare for Publish**  
  - Type: Set  
  - Role: Sets JSON object containing all social media account IDs (Instagram, YouTube, TikTok, Facebook, Facebook Page, Threads, Twitter, LinkedIn, Pinterest, Pinterest Board, BlueSky) and the final text for long and short formats extracted from Airtable fields.  
  - Config: Uses expressions to pull IDs and texts from Airtable node outputs.  
  - Input: Output of YouTube title rewrite node.  
  - Output: JSON object with all necessary publish parameters.  
  - Edge cases: Missing IDs, expression evaluation failures.

---

#### 1.3 Media Upload to Blotato

**Overview:**  
Uploads media files (images and videos) from Airtable record URLs to Blotato's platform for use in social media posts.

**Nodes Involved:**  
- Blotato Image Upload  
- Blotato Video Upload

**Node Details:**  
- **Blotato Image Upload**  
  - Type: Blotato node (custom community node)  
  - Role: Uploads the image URL to Blotato media resource to get a media URL usable in posts.  
  - Config: Uses mediaUrl from Airtable 'Image URL' field, Blotato API credentials.  
  - Input: Prepared JSON with image URL.  
  - Output: JSON containing Blotato URL for the uploaded image.  
  - Edge cases: API key invalid, upload failure, bad URL, network issues.  
- **Blotato Video Upload**  
  - Type: Blotato node  
  - Role: Uploads video URL from Airtable to Blotato.  
  - Config: Uses mediaUrl from Airtable 'Video URL' field with Blotato credentials.  
  - Input: Output of Image Upload node.  
  - Output: Blotato video media URL.  
  - Edge cases: Similar to image upload, plus video format or size issues.

---

#### 1.4 Posting to Social Platforms via Blotato

**Overview:**  
Creates posts on 9 social media platforms by sending media URLs and appropriate text to Blotato's API for each platform.

**Nodes Involved:**  
- Instagram - Create post  
- Youtube - Create post  
- Facebook - Create post  
- LinkedIn - Create post  
- Threads - Create post  
- Twitter - Create post  
- Tiktok - Create post  
- Bluesky - Create post  
- Pinterest - Create post

**Node Details:**  
- All nodes:  
  - Type: Blotato node  
  - Role: Platform-specific post creation via Blotato API using account IDs and prepared content.  
  - Config:  
    - Uses account IDs stored in Prepare for Publish.  
    - Blotato API credentials used.  
    - Post text pulled from either long or short text prepared earlier.  
    - Media URLs come from Blotato upload nodes.  
    - Some platforms have additional parameters (e.g., YouTube uses validated title from AI node).  
  - Input: Media URL from media upload nodes, text from Prepare for Publish.  
  - Output: Success or error response from Blotato API.  
  - Edge cases: API request failures, auth errors, media unsupported, rate limits, platform-specific errors.  
  - On error: configured to continue error output for workflow robustness.

---

#### 1.5 Post-Publish Status Update in Airtable

**Overview:**  
Updates the Airtable record to log success or failure of posting to each social media platform, appending to a "Publishing Log" field.

**Nodes Involved:**  
- Airtable: Posted Instagram  
- Airtable: Posted Instagram - Fail  
- Airtable: Posted YouTube  
- Airtable: Posted YouTube - FAIL  
- Airtable: Posted FaceBook  
- Airtable: Posted FaceBook - FAIL  
- Airtable: Posted LinkedIn  
- Airtable: Posted LinkedIn - FAIL  
- Airtable: Posted Threads  
- Airtable: Posted Threads - FAIL  
- Airtable: Posted Twitter  
- Airtable: Posted Twitter - FAIL  
- Airtable: Posted TikTok  
- Airtable: Posted TikTok - FAIL  
- Airtable: Posted BlueSky  
- Airtable: Posted BlueSky - FAIL  
- Airtable: Posted Pinterest  
- Airtable: Posted Pinterest - FAIL

**Node Details:**  
- All nodes:  
  - Type: Airtable node (update operation)  
  - Role: Append success or failure status for each platform to the Publishing Log field in Airtable for traceability.  
  - Config: Uses record ID from main Airtable node, updates "Publishing Log" column with success/failure tags.  
  - Input: Result of platform post node (success or error).  
  - Output: Updated Airtable record confirmation.  
  - Edge cases: API failures, bad record IDs, concurrent update conflicts.

---

#### 1.6 Pinterest Board ID Extraction

**Overview:**  
Receives a Pinterest board URL from a form, fetches the board page HTML, and extracts the board ID and related metadata for use in Pinterest posting.

**Nodes Involved:**  
- Pinterest System (tm) (Form Trigger)  
- Grab Pinterest Board Page (HTTP Request)  
- Pinterest Page Sleuth (Code Node)

**Node Details:**  
- **Pinterest System (tm)**  
  - Type: Form Trigger  
  - Role: Accepts Pinterest board URL input from user.  
  - Config: Single required field for Pinterest Board URL.  
  - Input: User form submission.  
  - Output: Passes URL downstream.  
  - Edge cases: Invalid or malformed URLs.  
- **Grab Pinterest Board Page**  
  - Type: HTTP Request  
  - Role: Fetches the HTML content of the Pinterest board page using the URL from the form.  
  - Config: Custom headers to mimic a browser user-agent to avoid blocking.  
  - Input: Pinterest Board URL.  
  - Output: HTML content as text.  
  - Edge cases: Page not found, request blocked, rate limiting.  
- **Pinterest Page Sleuth**  
  - Type: Code Node (JavaScript)  
  - Role: Parses the HTML content to extract the JSON embedded in a script tag holding board data, then extracts board ID and metadata.  
  - Config: Robust error handling and logging within code.  
  - Input: HTML content string.  
  - Output: JSON object with boardId, name, description, follower count, owner info, or error info.  
  - Edge cases: Changes in Pinterest page structure, JSON parse errors, missing data.

---

#### 1.7 Reporting and Notifications

**Overview:**  
Optional notification to a Telegram user and an HTTP POST to managing agent webhook for reporting the completion of the publishing task.

**Nodes Involved:**  
- Telegram: User Update (disabled)  
- Update Managing Agent (disabled)  
- Finalize Transaction! (disabled)

**Node Details:**  
- These nodes are currently disabled but configured as follows:  
- **Telegram: User Update**  
  - Type: Telegram node  
  - Role: Sends a message to a Telegram chat ID confirming publishing completion.  
  - Config: Uses Telegram Bot credentials, chat ID from Airtable content entry.  
  - Edge cases: Telegram API errors, invalid chat IDs.  
- **Update Managing Agent**  
  - Type: HTTP Request  
  - Role: Sends a JSON message to an external webhook URL indicating workflow completion.  
  - Config: POST request with JSON body.  
  - Edge cases: Webhook not reachable, timeout, HTTP errors.  
- **Finalize Transaction!**  
  - Type: Airtable update node  
  - Role: Updates the Airtable record to mark the production status as "Published" with current timestamps.  
  - Edge cases: Airtable API failures.

---

### 3. Summary Table

| Node Name                         | Node Type                    | Functional Role                                    | Input Node(s)                    | Output Node(s)                                                    | Sticky Note                                                                                                                                                                                                                      |
|----------------------------------|------------------------------|---------------------------------------------------|---------------------------------|------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Webhook from Content Creation    | Webhook                      | Entry point: Receives new content POST data       | -                               | Airtable Record ID                                               |                                                                                                                                                                                                                                 |
| Airtable Record ID               | Set                          | Extract Airtable record ID from webhook payload   | Webhook from Content Creation   | Airtable                                                       |                                                                                                                                                                                                                                 |
| Airtable                        | Airtable                     | Retrieve content record details                     | Airtable Record ID              | Ensure Valid YouTube Title                                       |                                                                                                                                                                                                                                 |
| Ensure Valid YouTube Title       | OpenAI (Langchain)           | Rewrite YouTube title for virality                 | Airtable                       | Prepare for Publish                                            |                                                                                                                                                                                                                                 |
| Prepare for Publish             | Set                          | Prepare social platform IDs and texts              | Ensure Valid YouTube Title       | Blotato Image Upload                                           |                                                                                                                                                                                                                                 |
| Blotato Image Upload             | Blotato                      | Upload image media to Blotato                       | Prepare for Publish             | Blotato Video Upload                                          |                                                                                                                                                                                                                                 |
| Blotato Video Upload             | Blotato                      | Upload video media to Blotato                       | Blotato Image Upload            | Wait, Wait1, Telegram: User Update, Instagram - Create post, Youtube - Create post, LinkedIn - Create post, Twitter - Create post, Tiktok - Create post, Bluesky - Create post, Pinterest - Create post |                                                                                                                                                                                                                                 |
| Wait                           | Wait                         | Delay before Facebook post                          | Blotato Video Upload            | Facebook - Create post                                        |                                                                                                                                                                                                                                 |
| Wait1                          | Wait                         | Delay before Threads post                           | Blotato Video Upload            | Threads - Create post                                         |                                                                                                                                                                                                                                 |
| Telegram: User Update           | Telegram                     | Notify user content completed (disabled)           | Blotato Video Upload            | Update Managing Agent                                         |                                                                                                                                                                                                                                 |
| Instagram - Create post          | Blotato                      | Create Instagram post                               | Blotato Video Upload            | Airtable: Posted Instagram, Airtable: Posted Instagram - Fail |                                                                                                                                                                                                                                 |
| Youtube - Create post            | Blotato                      | Create YouTube post                                | Blotato Video Upload            | Airtable: Posted YouTube, Airtable: Posted YouTube - FAIL    |                                                                                                                                                                                                                                 |
| Facebook - Create post           | Blotato                      | Create Facebook post                               | Wait                          | Airtable: Posted FaceBook, Airtable: Posted FaceBook - FAIL  |                                                                                                                                                                                                                                 |
| LinkedIn - Create post           | Blotato                      | Create LinkedIn post                               | Blotato Video Upload            | Airtable: Posted LinkedIn, Airtable: Posted LinkedIn - FAIL  |                                                                                                                                                                                                                                 |
| Threads - Create post            | Blotato                      | Create Threads post                                | Wait1                         | Airtable: Posted Threads, Airtable: Posted Threads - FAIL    |                                                                                                                                                                                                                                 |
| Twitter - Create post            | Blotato                      | Create Twitter post                                | Blotato Video Upload            | Airtable: Posted Twitter, Airtable: Posted Twitter - FAIL    |                                                                                                                                                                                                                                 |
| Tiktok - Create post             | Blotato                      | Create TikTok post                                | Blotato Video Upload            | Airtable: Posted TikTok, Airtable: Posted TikTok - FAIL      |                                                                                                                                                                                                                                 |
| Bluesky - Create post            | Blotato                      | Create BlueSky post                               | Blotato Video Upload            | Airtable: Posted BlueSky, Airtable: Posted BlueSky - FAIL    |                                                                                                                                                                                                                                 |
| Pinterest - Create post          | Blotato                      | Create Pinterest post                             | Blotato Video Upload            | Airtable: Posted Pinterest, Airtable: Posted Pinterest - FAIL |                                                                                                                                                                                                                                 |
| Airtable: Posted Instagram       | Airtable                     | Log Instagram post success                         | Instagram - Create post         | -                                                              |                                                                                                                                                                                                                                 |
| Airtable: Posted Instagram - Fail| Airtable                     | Log Instagram post failure                         | Instagram - Create post         | -                                                              |                                                                                                                                                                                                                                 |
| Airtable: Posted YouTube         | Airtable                     | Log YouTube post success                           | Youtube - Create post           | -                                                              |                                                                                                                                                                                                                                 |
| Airtable: Posted YouTube - FAIL  | Airtable                     | Log YouTube post failure                           | Youtube - Create post           | -                                                              |                                                                                                                                                                                                                                 |
| Airtable: Posted FaceBook        | Airtable                     | Log Facebook post success                          | Facebook - Create post          | -                                                              |                                                                                                                                                                                                                                 |
| Airtable: Posted FaceBook - FAIL | Airtable                     | Log Facebook post failure                          | Facebook - Create post          | -                                                              |                                                                                                                                                                                                                                 |
| Airtable: Posted LinkedIn        | Airtable                     | Log LinkedIn post success                          | LinkedIn - Create post         