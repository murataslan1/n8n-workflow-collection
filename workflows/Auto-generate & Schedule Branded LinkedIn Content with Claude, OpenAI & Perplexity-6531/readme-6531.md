Auto-generate & Schedule Branded LinkedIn Content with Claude, OpenAI & Perplexity

https://n8nworkflows.xyz/workflows/auto-generate---schedule-branded-linkedin-content-with-claude--openai---perplexity-6531


# Auto-generate & Schedule Branded LinkedIn Content with Claude, OpenAI & Perplexity

### 1. Workflow Overview

This workflow automates the entire process of generating, branding, scheduling, and posting LinkedIn content using advanced AI models (Claude by Anthropic, OpenAI), Perplexity AI for research, and Google Drive/Sheets for storage and management. It targets solo founders, marketers, and agencies who want to maintain a consistent, high-quality LinkedIn presence without manual writing or image design.

The workflow consists of two main logical blocks:

**1.1 Content Generation and Asset Creation**  
- Pulls past ideas from Google Sheets  
- Uses Perplexity AI to research new content topics  
- Combines ideas and generates a branded LinkedIn post with an image description using Claude (Anthropic) AI agent  
- Creates a branded image in the style of a reference image using OpenAI's image generation API  
- Saves the generated image to Google Drive and the post content to Google Sheets  

**1.2 Scheduling and Auto-Posting**  
- Scheduled triggers to create content twice weekly and to auto-post ready content every 3 days  
- Selects one ready post from Google Sheets  
- Downloads the associated image from Google Drive  
- Publishes the post with image on LinkedIn  
- Updates post status in Google Sheets to "posted"  

This structure enables a fully automated LinkedIn content pipeline from ideation and research to publishing, with configurable scheduling and brand style consistency.

---

### 2. Block-by-Block Analysis

#### 2.1 Content Generation and Asset Creation

**Overview:**  
This block generates new LinkedIn content ideas based on past content and current research, writes a post using a sophisticated AI prompt, creates a branded image matching a reference style, and saves everything in Google Drive/Sheets.

**Nodes Involved:**  
- Get Past Ideas  
- Join Ideas  
- Perplexity Research  
- Anthropic Chat Model  
- Structured Output Parser  
- LinkedIn Creator Agent  
- Image Style  
- OpenAI Image1  
- Convert to File  
- Save Image  
- Save Post  

**Node Details:**

- **Get Past Ideas**  
  - Type: Google Sheets  
  - Role: Retrieves previous LinkedIn post ideas from a configured Google Sheets document and sheet.  
  - Key config: Document ID and sheet "gid=0" specifying the "LinkedIn Posts" sheet.  
  - Inputs: None (triggered by schedule).  
  - Outputs: List of past idea items with text fields.  
  - Edge cases: Google Sheets auth errors, empty or malformed data.

- **Join Ideas**  
  - Type: Code (JavaScript)  
  - Role: Concatenates all retrieved past idea texts into a single string to pass to AI.  
  - Key code: Extracts "idea" fields from all inputs and joins them with commas.  
  - Inputs: Multiple items from Get Past Ideas.  
  - Outputs: Single item with mergedText property.  
  - Edge cases: Empty input array leads to empty mergedText.

- **Perplexity Research**  
  - Type: LangChain ToolWorkflow (Perplexity AI search)  
  - Role: Performs a web search to gather current relevant information on the merged past ideas or query.  
  - Key config: Uses external workflow "web_search" with a "query" input parameter.  
  - Inputs: Triggered with research query (likely from Join Ideas or LinkedIn Creator Agent).  
  - Outputs: Aggregated web search results.  
  - Edge cases: API rate limits, network errors.

- **Anthropic Chat Model**  
  - Type: LangChain Language Model (Claude 3.7 Sonnet)  
  - Role: Provides advanced chat completions for content generation.  
  - Config: Model set to "claude-3-7-sonnet-20250219" with Anthropic API credentials.  
  - Inputs: Prompts combining past ideas and research data.  
  - Outputs: AI-generated text content.  
  - Edge cases: API authentication failure, model timeouts.

- **Structured Output Parser**  
  - Type: LangChain Output Parser  
  - Role: Parses AI output into a structured JSON format with fields: about, copy, image.  
  - Config: JSON schema example for expected fields.  
  - Inputs: Raw AI text output.  
  - Outputs: Parsed JSON object for downstream use.  
  - Edge cases: Parsing errors if AI output format deviates.

- **LinkedIn Creator Agent**  
  - Type: LangChain Agent  
  - Role: Central AI agent with a detailed system prompt to generate a LinkedIn post (about, copy, image description).  
  - Config: Complex prompt defining tone, audience, content buckets, and style for content generation. Includes retry on fail.  
  - Inputs: Text prompt including merged past ideas and research data.  
  - Outputs: Structured content JSON parsed by Structured Output Parser.  
  - Edge cases: Prompt failures, exceeding token limits.

- **Image Style**  
  - Type: Google Drive (Download)  
  - Role: Downloads a brand reference image from Google Drive to guide image generation style.  
  - Config: File ID linked to a Google Drive file URL.  
  - Inputs: Triggered after LinkedIn Creator Agent outputs.  
  - Outputs: Binary image data.  
  - Edge cases: Google Drive permissions issues, file not found.

- **OpenAI Image1**  
  - Type: HTTP Request (OpenAI Image Generation)  
  - Role: Sends the brand reference image and AI-generated image description to OpenAI's image model to create a new branded image.  
  - Config: POST multipart/form-data with model "gpt-image-1", prompt including AI image description, sends "data" binary field.  
  - Inputs: Binary image from Image Style node.  
  - Outputs: Base64-encoded JSON image data.  
  - Edge cases: HTTP errors, API auth failures.

- **Convert to File**  
  - Type: Convert to File  
  - Role: Converts base64 JSON image data to binary file for upload.  
  - Inputs: Data from OpenAI Image1.  
  - Outputs: Binary file data for Google Drive upload.  
  - Edge cases: Conversion errors if input data malformed.

- **Save Image**  
  - Type: Google Drive (Upload)  
  - Role: Saves the generated image file to a specified folder in Google Drive for archival and linking.  
  - Config: Uses folder ID for "LinkedIn AI Posts" folder, file named as per LinkedIn Creator Agent output.  
  - Inputs: Binary image file from Convert to File.  
  - Outputs: File metadata including webViewLink for sharing.  
  - Edge cases: Permission issues, quota exceeded.

- **Save Post**  
  - Type: Google Sheets (Append)  
  - Role: Appends the generated post content (about, copy) plus image URL and status="review" to the Google Sheet database.  
  - Config: Uses same Google Sheet as Get Past Ideas, appends a new row.  
  - Inputs: Output JSON from LinkedIn Creator Agent and Google Drive image URL.  
  - Outputs: Confirmation of appended row.  
  - Edge cases: Sheet write errors, malformed fields.

---

#### 2.2 Scheduling and Auto-Posting

**Overview:**  
This block manages scheduling triggers to create new posts and to auto-publish posts marked as ready. It selects a ready post, downloads its image, publishes to LinkedIn, and updates the status in the sheet.

**Nodes Involved:**  
- Schedule  
- Schedule 2  
- Get Ready Posts  
- Pick One  
- Download Image  
- Publish Post  
- Update Status  

**Node Details:**

- **Schedule**  
  - Type: Schedule Trigger  
  - Role: Triggers content creation workflow daily at 5 AM (UTC or configured timezone).  
  - Config: Interval: triggerAtHour = 5.  
  - Outputs: Starts the content generation chain by triggering LinkedIn Creator Agent.  
  - Edge cases: Misconfigured timezone may cause unexpected trigger times.

- **Schedule 2**  
  - Type: Schedule Trigger  
  - Role: Triggers the auto-posting workflow every 3 days at 14:00 (2 PM).  
  - Config: Interval: daysInterval=3, triggerAtHour=14.  
  - Outputs: Triggers Get Ready Posts node to fetch posts with status "ready".  
  - Edge cases: Same as Schedule.

- **Get Ready Posts**  
  - Type: Google Sheets  
  - Role: Retrieves posts from the sheet where status = "ready" for publishing.  
  - Config: Filter on "status" column with lookupValue "ready".  
  - Inputs: Triggered by Schedule 2.  
  - Outputs: List of ready posts with associated image URLs.  
  - Edge cases: No ready posts available leads to empty output.

- **Pick One**  
  - Type: Limit  
  - Role: Limits the number of posts to one for publishing per trigger to avoid multiple posts simultaneously.  
  - Inputs: Ready posts list from Get Ready Posts.  
  - Outputs: Single selected post item for publishing.  
  - Edge cases: Empty input leads to no output.

- **Download Image**  
  - Type: Google Drive (Download)  
  - Role: Downloads the image file from Google Drive using the image URL from the selected post.  
  - Inputs: "image" URL field from Pick One node.  
  - Outputs: Binary image data for LinkedIn API.  
  - Edge cases: Invalid URLs, permissions, or file not found.

- **Publish Post**  
  - Type: LinkedIn  
  - Role: Publishes the post text and image to LinkedIn on behalf of the configured user.  
  - Config: Uses OAuth2 credentials, posts as person ID "rBxbEv1ziJ", visibility set to PUBLIC, shares media category IMAGE.  
  - Inputs: Text from Pick One and binary image from Download Image.  
  - Outputs: Confirmation of LinkedIn post.  
  - Edge cases: LinkedIn API errors, auth expiration, rate limits.

- **Update Status**  
  - Type: Google Sheets (Update)  
  - Role: Updates the post's status from "ready" to "posted" in the Google Sheet after successful publishing.  
  - Config: Matches row by "about" field, updates "status" column.  
  - Inputs: Post info from Pick One.  
  - Outputs: Confirmation of sheet update.  
  - Edge cases: Sheet update conflicts, missing rows.

---

### 3. Summary Table

| Node Name              | Node Type                            | Functional Role                               | Input Node(s)            | Output Node(s)          | Sticky Note                                                                                           |
|------------------------|------------------------------------|-----------------------------------------------|--------------------------|--------------------------|-----------------------------------------------------------------------------------------------------|
| Sticky Note             | Sticky Note                        | Documentation overview                         |                          |                          | # Create and auto-post branded LinkedIn content with AI and Perplexity ... (full overview content)   |
| Get Past Ideas          | Google Sheets                     | Retrieve past LinkedIn post ideas              | Schedule                 | Join Ideas               |                                                                                                     |
| Join Ideas              | Code                             | Concatenate past ideas into one string         | Get Past Ideas            | Perplexity Research      |                                                                                                     |
| Perplexity Research     | LangChain ToolWorkflow            | Research current topic online                   | Join Ideas, LinkedIn Creator Agent | LinkedIn Creator Agent |                                                                                                     |
| Anthropic Chat Model    | LangChain Language Model (Claude) | AI chat completions for content generation     |                          | LinkedIn Creator Agent   |                                                                                                     |
| Structured Output Parser| LangChain Output Parser           | Parse AI text output into structured JSON      | LinkedIn Creator Agent    | LinkedIn Creator Agent   |                                                                                                     |
| LinkedIn Creator Agent  | LangChain Agent                  | Generate LinkedIn post (copy, about, image desc) | Schedule, Perplexity Research, Anthropic Chat Model, Structured Output Parser | Image Style            |                                                                                                     |
| Image Style             | Google Drive                     | Download brand reference image                  | LinkedIn Creator Agent    | OpenAI Image1            |                                                                                                     |
| OpenAI Image1           | HTTP Request                    | Generate branded image from description         | Image Style               | Convert to File          |                                                                                                     |
| Convert to File         | Convert to File                 | Convert base64 image data to binary file        | OpenAI Image1             | Save Image               |                                                                                                     |
| Save Image              | Google Drive                    | Upload generated image to Google Drive          | Convert to File           | Save Post                |                                                                                                     |
| Save Post               | Google Sheets                   | Append generated post content and image URL     | Save Image                |                          |                                                                                                     |
| Schedule                | Schedule Trigger                | Trigger content creation daily                   |                          | LinkedIn Creator Agent   |                                                                                                     |
| Schedule 2              | Schedule Trigger                | Trigger auto-posting every 3 days                |                          | Get Ready Posts          |                                                                                                     |
| Get Ready Posts         | Google Sheets                  | Retrieve posts with status "ready"               | Schedule 2                | Pick One                 |                                                                                                     |
| Pick One                | Limit                         | Limit to one post for publishing                 | Get Ready Posts           | Download Image           |                                                                                                     |
| Download Image          | Google Drive                   | Download post image from Drive                    | Pick One                  | Publish Post             |                                                                                                     |
| Publish Post            | LinkedIn                      | Publish post with image to LinkedIn               | Download Image            | Update Status            |                                                                                                     |
| Update Status           | Google Sheets                 | Update post status to "posted"                    | Publish Post              |                          |                                                                                                     |
| Sticky Note7            | Sticky Note                   | Generate a New Post Idea and All Materials       |                          |                          |                                                                                                     |
| Sticky Note8            | Sticky Note                   | Generate an Image and Save                        |                          |                          |                                                                                                     |
| Sticky Note1            | Sticky Note                   | Auto Posting                                      |                          |                          |                                                                                                     |
| Sticky Note4            | Sticky Note                   | Author/Contact Info                               |                          |                          | ## Hey, I'm Abdul 👋 … https://www.builtbyabdul.com/ … builtbyabdul@gmail.com                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule node (Schedule)**  
   - Type: Schedule Trigger  
   - Parameters: Interval to trigger daily at 5 AM  
   - Purpose: To initiate content generation workflow.

2. **Create Google Sheets node (Get Past Ideas)**  
   - Type: Google Sheets  
   - Configure with your Google Sheets credentials  
   - Document ID: Your LinkedIn Posts Google Sheet  
   - Sheet: gid=0 (or your main sheet)  
   - Operation: Read rows  
   - Output: Fetch existing post ideas.

3. **Create Code node (Join Ideas)**  
   - Type: Code (JavaScript)  
   - Input: All items from Get Past Ideas  
   - Code: Concatenate "idea" field values joined by commas into one string output "mergedText".

4. **Create LangChain ToolWorkflow node (Perplexity Research)**  
   - Type: LangChain ToolWorkflow  
   - Link to a Perplexity AI web_search workflow  
   - Input: Accepts a "query" string parameter  
   - Output: Aggregated web search results.

5. **Create LangChain Anthropic Chat Model node (Anthropic Chat Model)**  
   - Type: Language Model (Claude 3.7 Sonnet)  
   - Credentials: Anthropic API key  
   - Purpose: Provide chat completions for content generation.

6. **Create LangChain Output Parser node (Structured Output Parser)**  
   - Type: Output Parser  
   - Configure JSON schema with "about", "copy", and "image" fields.

7. **Create LangChain Agent node (LinkedIn Creator Agent)**  
   - Type: LangChain Agent  
   - Set prompt with detailed system message defining tone, audience, content buckets, and objectives.  
   - Enable output parser as Structured Output Parser.  
   - Link inputs from Schedule, Perplexity Research, Anthropic Chat Model, and Structured Output Parser.

8. **Create Google Drive node (Image Style)**  
   - Type: Google Drive (Download)  
   - Credential: Google Drive OAuth2  
   - Configure to download your brand style reference image by File ID.

9. **Create HTTP Request node (OpenAI Image1)**  
   - Type: HTTP Request (POST)  
   - Endpoint: OpenAI image generation API  
   - Authentication: HTTP header with OpenAI API key  
   - Body: multipart/form-data including:  
     - model: "gpt-image-1"  
     - image: binary data from Image Style node  
     - prompt: dynamic prompt with image description from LinkedIn Creator Agent output  
   - Output: Base64 encoded image JSON.

10. **Create Convert to File node (Convert to File)**  
    - Type: Convert to File  
    - Input: Base64 image data from OpenAI Image1  
    - Output: Binary file for upload.

11. **Create Google Drive node (Save Image)**  
    - Type: Google Drive (Upload)  
    - Credential: Google Drive OAuth2  
    - Configure to upload to a specific folder ("LinkedIn AI Posts")  
    - Filename: Use LinkedIn Creator Agent output name.

12. **Create Google Sheets node (Save Post)**  
    - Type: Google Sheets (Append)  
    - Credential: Google Sheets OAuth2  
    - Document and Sheet same as Get Past Ideas  
    - Columns: about, text, image (Google Drive URL), status="review"  
    - Input: From LinkedIn Creator Agent and Save Image outputs.

13. **Create Schedule node (Schedule 2)**  
    - Type: Schedule Trigger  
    - Parameters: Interval every 3 days at 2 PM  
    - Purpose: To trigger auto-posting workflow.

14. **Create Google Sheets node (Get Ready Posts)**  
    - Type: Google Sheets  
    - Credential: Google Sheets OAuth2  
    - Filter rows where "status" = "ready"  
    - Document and Sheet same as above.

15. **Create Limit node (Pick One)**  
    - Type: Limit  
    - Parameters: Limit output to 1 item  
    - Input: Ready posts from Get Ready Posts.

16. **Create Google Drive node (Download Image)**  
    - Type: Google Drive (Download)  
    - Credential: Google Drive OAuth2  
    - File ID: from Pick One node "image" URL field.

17. **Create LinkedIn node (Publish Post)**  
    - Type: LinkedIn  
    - Credential: OAuth2 LinkedIn account  
    - Parameters:  
      - Text: from Pick One "text" field  
      - Person: your LinkedIn person ID  
      - Visibility: PUBLIC  
      - Share media category: IMAGE  
    - Input: Post text and downloaded image binary.

18. **Create Google Sheets node (Update Status)**  
    - Type: Google Sheets (Update)  
    - Credential: Google Sheets OAuth2  
    - Match row by "about" field from Pick One post  
    - Update "status" to "posted".

19. **Add Sticky Notes for documentation and context**  
    - Include workflow overview, author contact, and block explanations at strategic positions.

---

### 5. General Notes & Resources

| Note Content                                                                                                                             | Context or Link                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Automate your entire LinkedIn content machine — from research and image generation to scheduling and posting — with this AI-powered workflow. | Workflow overview sticky note at start of workflow.                                               |
| For help automating your business or building growth systems, visit: https://www.builtbyabdul.com/ or email builtbyabdul@gmail.com      | Author contact sticky note inside workflow (Sticky Note4).                                        |
| This workflow uses Perplexity AI for multi-site web research: https://www.perplexity.ai/                                                  | Referenced in Perplexity Research node description.                                               |
| AI content generation powered by Claude (Anthropic) and OpenAI image generation model "gpt-image-1".                                     | See Anthropic Chat Model and OpenAI Image1 nodes.                                                 |
| Google Sheets and Drive are used as content and asset management backend.                                                                | Credential requirements: Google Sheets OAuth2 and Google Drive OAuth2.                            |
| LinkedIn OAuth2 credentials required for auto-publishing posts.                                                                           | LinkedIn node configuration.                                                                      |

---

**Disclaimer:** This document is generated from an n8n workflow automation and complies with all applicable content policies. All data handled are legal and publicly accessible.