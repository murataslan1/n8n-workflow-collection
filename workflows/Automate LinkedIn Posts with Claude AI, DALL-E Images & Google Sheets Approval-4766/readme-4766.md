Automate LinkedIn Posts with Claude AI, DALL-E Images & Google Sheets Approval

https://n8nworkflows.xyz/workflows/automate-linkedin-posts-with-claude-ai--dall-e-images---google-sheets-approval-4766


# Automate LinkedIn Posts with Claude AI, DALL-E Images & Google Sheets Approval

### 1. Workflow Overview

This workflow automates the creation, approval, and posting of LinkedIn content using AI-generated ideas, images, and Google Sheets for review and status tracking. It is designed for content creators, marketers, and social media managers who want to streamline generating viral LinkedIn posts with AI assistance while maintaining manual approval control.

**Key Use Cases:**
- Generate new LinkedIn post ideas and full post content automatically using Claude AI.
- Create minimalistic branded images based on AI-generated descriptions via OpenAI's DALL-E.
- Store and track posts and images in Google Sheets and Google Drive.
- Allow manual approval of posts before automatic LinkedIn publishing.
- Schedule daily automation for content generation and posting.

**Logical Blocks:**

- **1.1 Scheduled Trigger and Past Ideas Aggregation**  
  Scheduled daily trigger to fetch previously used post ideas from Google Sheets and aggregate them for context.

- **1.2 AI Post Idea Generation**  
  Using Claude AI (Anthropic model) and LangChain agent to generate a new post idea, title, text, and image description based on past ideas.

- **1.3 Image Generation and Storage**  
  Download a brand-style reference image from Google Drive, then use OpenAI Image Edit API to generate a new post image in the same style. Save the generated image to Google Drive.

- **1.4 Save Post to Google Sheets**  
  Append the newly generated post content and image link to the Google Sheet with status "review" for manual approval.

- **1.5 Scheduled Posting of Approved Posts**  
  Trigger another schedule to fetch posts marked as "ready" in the sheet, pick one, download its image, publish the post with image to LinkedIn, and update the post status to "posted".

- **1.6 (Disabled) Twitter & Instagram Posting**  
  Nodes related to Instagram and Twitter posting are present but disabled.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger and Past Ideas Aggregation

- **Overview:**  
  Triggers daily at 5 AM, fetches all past post ideas from Google Sheets, and concatenates them into a single string to provide context for new AI-generated content.

- **Nodes Involved:**  
  - Schedule (Trigger at 5 AM)  
  - Get Past Ideas (Google Sheets read)  
  - Join Ideas (Code node to concatenate ideas)

- **Node Details:**  
  - **Schedule**  
    - Type: scheduleTrigger  
    - Configured to trigger daily at hour 5 (5 AM).  
    - No inputs, outputs to "Get Past Ideas".  
    - Failure points: n8n scheduling errors, time zone mismatches.

  - **Get Past Ideas**  
    - Type: Google Sheets Read  
    - Reads all rows from the "Posts" sheet in a specific Google Sheet document.  
    - Always outputs data.  
    - Output: Array of post ideas with fields like "idea".  
    - Potential failures: Credential issues, sheet not found, API quota.

  - **Join Ideas**  
    - Type: Code node (JavaScript)  
    - Input: All items from Get Past Ideas.  
    - Logic: Extracts the "idea" field from each item, joins them with commas into one string named "mergedText".  
    - Output: Single item with "mergedText" property.  
    - Failure cases: If input data missing or malformed, expression errors.

---

#### 1.2 AI Post Idea Generation

- **Overview:**  
  Uses LangChain agent with Claude AI to generate a new LinkedIn post idea, including name, idea, title, text, and image description based on existing ideas passed as context. Output is parsed as structured JSON.

- **Nodes Involved:**  
  - Idea Generator (LangChain Agent)  
  - Anthropic Chat Model (Claude AI)  
  - Perplexity Research (Web search sub-workflow tool)  
  - Structured Output Parser (LangChain JSON parser)

- **Node Details:**  
  - **Idea Generator**  
    - Type: LangChain Agent node  
    - Inputs: "mergedText" from Join Ideas.  
    - System prompt sets role as expert in viral LinkedIn posts with 10 years experience, targeting marketers and business owners.  
    - Instructions to generate name, idea, title, text, and image description in JSON format including 4 buckets of content (timeless principles, case studies, growth hacks, controversial ads).  
    - Uses Perplexity Research as a tool for web search.  
    - Output routed to Structured Output Parser.  
    - Potential failures: AI API errors, malformed outputs, timeout, prompt misconfiguration.  
    - Version-specific: Uses LangChain integration with Anthropic Claude 3.7 Sonnet.

  - **Anthropic Chat Model**  
    - Type: LangChain Language Model  
    - Configured to use Claude 3.7 Sonnet.  
    - Connected as AI language model for Idea Generator.  
    - Requires valid Anthropic API credentials.  
    - Failure: Auth errors, rate limits.

  - **Perplexity Research**  
    - Type: LangChain Tool Workflow  
    - Calls external Perplexity AI web search sub-workflow to enrich AI responses.  
    - Requires Perplexity API key configured via Generic HTTP Header Auth.  
    - Failure: API key issues, network errors.

  - **Structured Output Parser**  
    - Type: LangChain Output Parser  
    - Parses AI output into JSON with keys: name, idea, title, text, image.  
    - Ensures downstream nodes receive structured data.  
    - Failure: Parsing errors if AI response is malformed.

---

#### 1.3 Image Generation and Storage

- **Overview:**  
  Downloads a brand style reference image from Google Drive and uses OpenAI Image Edit API to generate a new post image in the same style with instructions from AI image description. Saves the result back to Google Drive.

- **Nodes Involved:**  
  - Image Style (Google Drive Download)  
  - OpenAI Image (HTTP Request to OpenAI API)  
  - Convert to File (Convert base64 to binary)  
  - Save Image (Google Drive Upload)

- **Node Details:**  
  - **Image Style**  
    - Type: Google Drive node (download)  
    - Downloads a fixed reference image (URL provided) representing the brand style.  
    - Input: None, triggered by output of Idea Generator.  
    - Failure: Credential errors, file not accessible, invalid fileId.

  - **OpenAI Image**  
    - Type: HTTP Request node  
    - POST to OpenAI Images Edits endpoint.  
    - Sends the downloaded reference image as multipart-form-data with prompt to replicate style using black/dark grainy background, white and salad green colors, minimalistic vertical 3x4 image for LinkedIn.  
    - The prompt uses the image description generated by the Idea Generator.  
    - Requires Generic HTTP Header Auth credential with OpenAI API key.  
    - Failure: Invalid API key, request limits, malformed prompt, large payload errors.

  - **Convert to File**  
    - Type: Convert to File node  
    - Converts base64 image data returned by OpenAI to binary file format for Google Drive upload.  
    - Input: Response from OpenAI Image node.  
    - Failure: Conversion errors if base64 is corrupt.

  - **Save Image**  
    - Type: Google Drive Upload  
    - Saves the generated image binary to a specific Google Drive folder.  
    - Uses the post "name" from Idea Generator as file name.  
    - Folder ID is fixed and configured.  
    - Outputs file metadata including webViewLink.  
    - Failure: Permission errors, quota, file overwrite conflicts.

---

#### 1.4 Save Post to Google Sheets

- **Overview:**  
  Appends the new post data including idea text, name, full post text, image sharing link, and status "review" to the Google Sheet for manual review and approval.

- **Nodes Involved:**  
  - Save Post (Google Sheets Append)

- **Node Details:**  
  - **Save Post**  
    - Type: Google Sheets Append  
    - Appends new row to the "Posts" sheet with fields: idea, name, text, image (webViewLink), status = "review".  
    - Input uses output from Save Image node (for image link) and Idea Generator nodes.  
    - Failure: Credential problems, sheet locked, API limits.

---

#### 1.5 Scheduled Posting of Approved Posts

- **Overview:**  
  Scheduled daily at 4 PM, selects one post from the sheet with status "ready" (approved), downloads the associated image, publishes the post with image to LinkedIn, and updates the post status to "posted".

- **Nodes Involved:**  
  - Schedule 2 (Trigger at 4 PM)  
  - Get Ready Posts (Google Sheets read with filter status="ready")  
  - Pick One (Limit to 1)  
  - Download Image (Google Drive download by file ID from post)  
  - Publish Post (LinkedIn Post)  
  - Update Status (Google Sheets update)

- **Node Details:**  
  - **Schedule 2**  
    - Type: scheduleTrigger  
    - Triggers daily at 16:00 (4 PM).  
    - Failure: Scheduling issues, time zones.

  - **Get Ready Posts**  
    - Type: Google Sheets Read with filter  
    - Reads rows where status = "ready" indicating posts approved for publishing.  
    - Failure: Credential, filter syntax errors.

  - **Pick One**  
    - Type: Limit node  
    - Limits to one item to post per run.  
    - Failure: Empty input results in no posts.

  - **Download Image**  
    - Type: Google Drive Download  
    - Downloads image file referenced in the post's "image" field (URL) for LinkedIn publishing.  
    - Failure: Invalid file ID, permissions.

  - **Publish Post**  
    - Type: LinkedIn node  
    - Posts the text and image to LinkedIn on the specified personal account.  
    - ShareMediaCategory set to IMAGE.  
    - Requires LinkedIn OAuth2 credentials.  
    - Failure: Auth errors, API limits, media upload errors.

  - **Update Status**  
    - Type: Google Sheets Update  
    - Updates the post row in the sheet, setting status = "posted" to mark completion.  
    - Uses "name" as key for match.  
    - Failure: Row not found, concurrency issues.

---

#### 1.6 Disabled Twitter & Instagram Posting Nodes

- **Overview:**  
  Nodes for Twitter and Instagram posting exist but are disabled and not part of the active workflow.

- **Nodes Involved:**  
  - X (Twitter)  
  - Prepare Data for Instagram API  
  - Create Instagram Media Container (Facebook Graph API)  
  - Wait for Container Processing  
  - Publish Post to Instagram

- **Status:** Disabled.

---

### 3. Summary Table

| Node Name               | Node Type                            | Functional Role                                  | Input Node(s)            | Output Node(s)         | Sticky Note                                          |
|-------------------------|------------------------------------|-------------------------------------------------|--------------------------|------------------------|------------------------------------------------------|
| Schedule                | scheduleTrigger                    | Trigger daily at 5 AM                            |                          | Get Past Ideas          |                                                      |
| Get Past Ideas          | Google Sheets                     | Read past post ideas from sheet                  | Schedule                 | Join Ideas              |                                                      |
| Join Ideas              | Code                             | Concatenate all past ideas into single string   | Get Past Ideas            | Idea Generator          |                                                      |
| Idea Generator          | LangChain Agent                  | Generate new LinkedIn post idea & content        | Join Ideas                | Image Style             | # Generate a New Post Idea and All Materials          |
| Anthropic Chat Model    | LangChain LM                     | Claude AI model for Idea Generator               |                          | Idea Generator (AI LM)  |                                                      |
| Perplexity Research     | LangChain Tool Workflow          | Web search tool for Idea Generator                |                          | Idea Generator (Tool)   |                                                      |
| Structured Output Parser| LangChain Output Parser          | Parse AI JSON output into structured data         | Idea Generator            | Idea Generator          |                                                      |
| Image Style             | Google Drive                     | Download reference image for style                 | Idea Generator            | OpenAI Image            | # Generate an Image and Save                          |
| OpenAI Image            | HTTP Request                    | Generate new image in brand style                  | Image Style               | Convert to File         |                                                      |
| Convert to File         | Convert To File                  | Convert base64 image to binary                      | OpenAI Image              | Save Image              |                                                      |
| Save Image              | Google Drive                     | Upload generated image to Drive                      | Convert to File           | Save Post               |                                                      |
| Save Post               | Google Sheets Append            | Save new post and image link with status "review" | Save Image                |                        |                                                      |
| Schedule 2              | scheduleTrigger                    | Trigger daily at 4 PM to post approved content    |                          | Get Ready Posts         |                                                      |
| Get Ready Posts         | Google Sheets Read               | Retrieve posts with status "ready" for posting     | Schedule 2                | Pick One                |                                                      |
| Pick One                | Limit                           | Select one post to publish                          | Get Ready Posts           | Download Image          |                                                      |
| Download Image          | Google Drive                     | Download post's image for LinkedIn posting          | Pick One                  | Publish Post            |                                                      |
| Publish Post            | LinkedIn                        | Publish post with image on LinkedIn                 | Download Image            | Update Status           |                                                      |
| Update Status           | Google Sheets Update            | Mark post as "posted" after publishing              | Publish Post              |                        |                                                      |
| X                       | Twitter (disabled)               | (Disabled) Twitter posting                          |                          |                        |                                                      |
| Prepare Data for Instagram API | Set (disabled)                   | (Disabled) Prepare Instagram post data               |                          |                        |                                                      |
| Create Instagram Media Container | Facebook Graph API (disabled)     | (Disabled) Create Instagram media container          |                          |                        |                                                      |
| Wait for Container Processing | Wait (disabled)                  | (Disabled) Wait for Instagram media processing        |                          |                        |                                                      |
| Publish Post to Instagram | Facebook Graph API (disabled)     | (Disabled) Publish Instagram post                      |                          |                        |                                                      |
| Sticky Note1            | Sticky Note                     | Label for Auto Posting block                         |                          |                        | # Auto Posting                                        |
| Sticky Note7            | Sticky Note                     | Label for idea generation block                      |                          |                        | # Generate a New Post Idea and All Materials          |
| Sticky Note8            | Sticky Note                     | Label for image generation and saving block          |                          |                        | # Generate an Image and Save                          |
| Sticky Note             | Sticky Note                     | Label for Twitter & Instagram block                   |                          |                        | ## Twitter & Instagram                               |
| Sticky Note6            | Sticky Note                     | Setup guide and author info with detailed instructions |                          |                        | # 🛠️ Setup Guide  \n**Author:** [Usman Liaqat](https://www.linkedin.com/in/usmanliaqat404) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node** ("Schedule")  
   - Type: scheduleTrigger  
   - Set to trigger every day at 5:00 AM.

2. **Add Google Sheets Node** ("Get Past Ideas")  
   - Operation: Read rows  
   - Sheet: "Posts" (gid=0) in specified Google Sheet document (ID provided)  
   - Output all data.

3. **Add Code Node** ("Join Ideas")  
   - JavaScript code: Extract all "idea" fields and join them as a comma-separated string into a single JSON property "mergedText".  
   - Connect "Get Past Ideas" output to this node.

4. **Add LangChain Agent Node** ("Idea Generator")  
   - Set the prompt as per system message in workflow: expert viral LinkedIn post creator with 4 content buckets.  
   - Use input: "mergedText" from "Join Ideas".  
   - Configure AI tool to call Perplexity Research sub-workflow for web search.  
   - Use Anthropic Chat Model (Claude 3.7 Sonnet) as language model.  
   - Enable output parser with LangChain Structured Output Parser node expecting JSON keys: name, idea, title, text, image.

5. **Add Google Drive Node** ("Image Style")  
   - Operation: Download  
   - File ID: Use the shared Google Drive file link of the brand style reference image.

6. **Add HTTP Request Node** ("OpenAI Image")  
   - Method: POST  
   - URL: https://api.openai.com/v1/images/edits  
   - Authentication: Generic HTTP Header Auth with OpenAI API key (Bearer token in header).  
   - Content-Type: multipart-form-data  
   - Body parameters: model "gpt-image-1", image (binary from "Image Style" node), prompt with instructions to replicate style using the image description from "Idea Generator".  
   - Connect "Image Style" output to this node.

7. **Add Convert to File Node** ("Convert to File")  
   - Operation: toBinary  
   - Source property: base64 image data from OpenAI Image response.

8. **Add Google Drive Node** ("Save Image")  
   - Operation: Upload file  
   - Folder ID: The folder where to save images (fixed)  
   - File name: Use "name" from Idea Generator output.  
   - File content: Binary data from Convert to File.

9. **Add Google Sheets Append Node** ("Save Post")  
   - Append new row to "Posts" sheet with columns: idea, name, text, image (Drive webViewLink), status = "review".

10. **Create Second Schedule Trigger Node** ("Schedule 2")  
    - Type: scheduleTrigger  
    - Set to trigger every day at 4:00 PM.

11. **Add Google Sheets Node** ("Get Ready Posts")  
    - Read rows with filter: status = "ready"  
    - From the same "Posts" sheet.

12. **Add Limit Node** ("Pick One")  
    - Limit to 1 item.

13. **Add Google Drive Node** ("Download Image")  
    - Download file from "image" URL in selected post.

14. **Add LinkedIn Node** ("Publish Post")  
    - Post text: Use "text" from selected post  
    - Person: Use LinkedIn account ID  
    - Media: Image from "Download Image" node  
    - Requires LinkedIn OAuth2 credentials.

15. **Add Google Sheets Update Node** ("Update Status")  
    - Update row matching "name" of the posted item  
    - Set status = "posted".

16. **Connect nodes in order:**  
    - Schedule → Get Past Ideas → Join Ideas → Idea Generator → Image Style → OpenAI Image → Convert to File → Save Image → Save Post  
    - Schedule 2 → Get Ready Posts → Pick One → Download Image → Publish Post → Update Status

17. **Configure credentials:**  
    - Google Sheets (read/write)  
    - Google Drive (download/upload)  
    - Anthropic (Claude AI)  
    - OpenAI (image generation)  
    - Perplexity AI (web search)  
    - LinkedIn (OAuth2 for posting)

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                | Context or Link                                                                                                          |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| # 🛠️ Setup Guide  \n**Author:** [Usman Liaqat](https://www.linkedin.com/in/usmanliaqat404)\n\nThis guide walks through 7 setup steps: Google Sheets, Google Drive, Anthropic, OpenAI, Perplexity AI, LinkedIn credential setup, and customization of prompts and folders.                      | Sticky Note covering entire setup instructions in workflow.                                                             |
| Google Sheets used for content storage and status tracking: [Google Sheet Link](https://docs.google.com/spreadsheets/d/1-F3ZioIs3oWOKMyDPMuquaH-qiuaZs6qdZXP-yNeRbs/edit?usp=sharing)                                                                                                            | Referenced in multiple Google Sheets nodes.                                                                              |
| Brand style reference image stored in Google Drive: https://drive.google.com/file/d/1wm4anhC6ygXl4ZJAjJryWfEXTG-VeH8s/view?usp=sharing                                                                                                                                                      | Used in "Image Style" node for consistent image generation style.                                                        |
| AI prompt design emphasizes viral LinkedIn posts with hooks, retention, reward, and marketing/sales insights, categorized into 4 content buckets for diversity. Output must be JSON for structured parsing.                                                                                   | Core logic in "Idea Generator" system message.                                                                            |
| Disabled nodes indicate potential extension to Twitter and Instagram posting workflows but are not active.                                                                                                                                                                                 | Present but disabled for future use.                                                                                      |

---

This analysis and reconstruction guide allows developers and AI agents to fully understand, reproduce, and maintain the automated LinkedIn posting workflow with AI-generated posts and images, ensuring robust error handling and clear integration points.