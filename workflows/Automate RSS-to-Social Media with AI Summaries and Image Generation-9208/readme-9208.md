Automate RSS-to-Social Media with AI Summaries and Image Generation

https://n8nworkflows.xyz/workflows/automate-rss-to-social-media-with-ai-summaries-and-image-generation-9208


# Automate RSS-to-Social Media with AI Summaries and Image Generation

### 1. Workflow Overview

This workflow automates publishing content from an RSS feed to Facebook and Instagram with AI-enhanced summaries and image generation. It targets social media managers or content creators who want to streamline sharing fresh articles by automatically summarizing content, creating engaging images, and posting them to social platforms while maintaining logs and sending reports.

The workflow is logically divided into these blocks:

- **1.1 RSS Input & Filtering**: Triggering on new RSS feed items and checking if they are already processed.
- **1.2 Article Content Extraction**: Retrieving and parsing the full article content from the RSS link.
- **1.3 AI Text Summarization & Prompt Generation**: Summarizing the article and generating an image prompt using AI language models.
- **1.4 AI Image Generation & Storage**: Creating a social media image with AI, processing the image file, and uploading it to Supabase storage.
- **1.5 Social Media Posting**: Posting the summarized text and generated image to Facebook and Instagram via their APIs.
- **1.6 Post-Processing & Logging**: Collecting post metadata, saving records in Google Sheets, and sending Telegram notifications.

---

### 2. Block-by-Block Analysis

#### 1.1 RSS Input & Filtering

**Overview:**  
This block triggers the workflow on new RSS feed items and filters out already processed articles by checking Google Sheets for existing URLs.

**Nodes Involved:**  
- RSS Feed Trigger  
- Get row(s) in sheet  
- If  
- Sticky Note (descriptive only)

**Node Details:**

- **RSS Feed Trigger**  
  - Type: RSS Feed Read Trigger  
  - Role: Polls the RSS feed URL every hour for new items.  
  - Config: User must insert their RSS channel URL. Poll frequency set to every hour.  
  - Input: None (trigger)  
  - Output: New RSS items  
  - Failure cases: Invalid feed URL, network timeouts, or malformed RSS.  
  - Sticky Note: "Paste a RSS channel URL here."

- **Get row(s) in sheet**  
  - Type: Google Sheets  
  - Role: Checks if the article URL from RSS feed already exists in Google Sheets to prevent duplicates.  
  - Config: Filters rows by 'URL' column matching the RSS item link. Sheet and document IDs must be set.  
  - Credentials: Google Sheets OAuth2  
  - Input: RSS feed item JSON  
  - Output: Matching rows or empty if none found  
  - Failure cases: Invalid credentials, API quota exceeded, or sheet name mismatches.  
  - Sticky Note: "If the URL has not been processed (row does not exist in Google Sheets), the workflow will proceed."

- **If**  
  - Type: Conditional node  
  - Role: Checks if the Google Sheets query returned empty (meaning the article is new).  
  - Config: Condition tests if the output of "Get row(s) in sheet" is empty.  
  - Input: Output from "Get row(s) in sheet"  
  - Output: Proceeds only if item is new.  
  - Failure cases: Expression evaluation errors if node names are changed.

---

#### 1.2 Article Content Extraction

**Overview:**  
Fetches the full article HTML content from the RSS item's link and extracts the main text, excluding links and images.

**Nodes Involved:**  
- HTTP Request  
- HTML  
- Sticky Note (descriptive)

**Node Details:**

- **HTTP Request**  
  - Type: HTTP Request  
  - Role: Downloads the article's full HTML content.  
  - Config: URL dynamically set from the RSS item's link. No authentication.  
  - Input: Passed from If node (new item)  
  - Output: Raw HTML content of the article  
  - Failure cases: HTTP errors, timeouts, invalid URLs.

- **HTML**  
  - Type: HTML Extract  
  - Role: Extracts readable text content from the downloaded HTML, stripping out links (`a`) and images (`img`).  
  - Config: CSS selector '*' to get all content, skipping 'a' and 'img' tags.  
  - Input: HTML from HTTP Request  
  - Output: Cleaned article text  
  - Failure cases: Malformed HTML could lead to empty or partial extraction.  
  - Sticky Note: "The contents of the article gets extracted."

---

#### 1.3 AI Text Summarization & Prompt Generation

**Overview:**  
Summarizes the article into a concise social media post and generates an AI prompt for image creation based on the summary.

**Nodes Involved:**  
- Basic LLM Chain  
- Basic LLM Chain1  
- Anthropic Chat Model  
- Google Gemini Chat Model  
- Sticky Notes (descriptive)

**Node Details:**

- **Basic LLM Chain**  
  - Type: LangChain AI LLM Chain  
  - Role: Summarizes the article into a 5-sentence social media post with hashtags and emojis, encouraging engagement.  
  - Config: Prompt instructs AI to act as a technology blog editor. English language output.  
  - Input: Extracted article text from HTML node  
  - Output: Summarized post text  
  - AI Engines: Connected to Anthropic Chat Model (Claude) and Google Gemini Chat Model (PaLM), selectable.  
  - Failure cases: API quota limits, network errors, or prompt syntax issues.  
  - Sticky Note: "A summary of the article is written by Claude."

- **Basic LLM Chain1**  
  - Type: LangChain AI LLM Chain  
  - Role: Generates a prompt for AI image generation describing a professional and engaging image related to the article topic.  
  - Config: Prompt carefully crafted to avoid JSON-breaking characters, max 1000 characters.  
  - Input: Summary text from Basic LLM Chain  
  - Output: Text prompt for image generation  
  - AI Engines: Google Gemini Chat Model connected.  
  - Sticky Note: "A prompt for image generation is created based on the Claude's summary and an image is generated in the OpenAI Image Generator."

- **Anthropic Chat Model & Google Gemini Chat Model**  
  - Type: LangChain AI Models  
  - Role: Provide the underlying AI engines for text summarization and prompt generation.  
  - Config: Anthropic uses model "claude-sonnet-4-20250514"; Google Gemini uses default configurations.  
  - Credentials: Anthropic and Google Palm API accounts required.  
  - Failure cases: Authentication failure, API downtime.

---

#### 1.4 AI Image Generation & Storage

**Overview:**  
Generates an image from the prompt, processes the image file, and uploads it to Supabase storage for public access.

**Nodes Involved:**  
- Generate an image  
- Edit Fields  
- Supabase Config  
- Upload to Supabase (uses credentials)  
- Supabase Public URL  
- Sticky Notes (descriptive)

**Node Details:**

- **Generate an image**  
  - Type: LangChain OpenAI Image Generation  
  - Role: Uses OpenAI’s image generation API (DALL·E or similar) to create an image based on the prompt.  
  - Config: Model "gpt-image-1", 1024x1024 resolution, high quality.  
  - Input: Image prompt from Basic LLM Chain1  
  - Output: Binary image data and metadata  
  - Credentials: OpenAI API key required  
  - Failure cases: API limits, invalid prompts, network errors.

- **Edit Fields**  
  - Type: Set  
  - Role: Adds a filename property to the image data using a timestamp with .png extension.  
  - Config: Filename generated as current timestamp in milliseconds + ".png".  
  - Input: Image generation output  
  - Output: Image data with filename field

- **Supabase Config**  
  - Type: Set  
  - Role: Sets parameters for Supabase upload, including bucket name and base URL (user must insert these).  
  - Config: Bucket name and Supabase URL placeholders; TTL for links is 3600 seconds.  
  - Input: Image data with filename  
  - Output: JSON with configuration for upload  
  - Sticky Note: "Uploads the image to Supabase Storage. Set your bucket name in the Set node or via JSON."

- **Upload to Supabase (uses credentials)**  
  - Type: HTTP Request  
  - Role: Uploads the binary image data to Supabase storage bucket using Supabase API.  
  - Config: URL dynamically constructed from Supabase base URL, bucket, and filename. POST method with binary data.  
  - Credentials: Supabase API key required  
  - Failure cases: Authentication failure, network issues, invalid bucket or permissions.

- **Supabase Public URL**  
  - Type: Set  
  - Role: Constructs the public URL to access the uploaded image from Supabase.  
  - Config: Combines base URL, bucket, and filename, encoding components for URL safety.  
  - Output: Public image URL string

---

#### 1.5 Social Media Posting

**Overview:**  
Posts the summarized text and generated image to Facebook and Instagram using Facebook Graph API, then retrieves post URLs.

**Nodes Involved:**  
- Post to Instagram  
- Post to Instagram1  
- Get Post URL  
- Post to Facebook  
- Build Facebook URL  
- Build Instagram URL  
- Merge  
- Sticky Notes (descriptive)

**Node Details:**

- **Post to Instagram**  
  - Type: HTTP Request  
  - Role: Posts the image and caption to Instagram media endpoint.  
  - Config: URL includes user’s Facebook site ID placeholder, method POST, form-urlencoded body with image URL and caption from summary text.  
  - Credentials: Facebook Graph API OAuth2 token  
  - Failure cases: API permission errors, invalid site ID, expired token.

- **Post to Instagram1**  
  - Type: HTTP Request  
  - Role: Publishes the Instagram media using media creation ID from previous node.  
  - Config: Similar POST to /media_publish endpoint with creation_id from prior response.  
  - Credentials: Facebook Graph API OAuth2 token

- **Get Post URL**  
  - Type: HTTP Request  
  - Role: Fetches the permalink URL of the published Instagram post.  
  - Config: GET request to Facebook Graph API, dynamic version and post ID parameters.  
  - Credentials: Facebook Graph API OAuth2 token

- **Post to Facebook**  
  - Type: HTTP Request  
  - Role: Posts the image and caption to Facebook page/photos endpoint.  
  - Config: POST with caption including summary and source URL, and image URL.  
  - Credentials: Facebook Graph API OAuth2 token  
  - Sticky Note: "Remember to paste your unique site ID."

- **Build Facebook URL**  
  - Type: Code (JavaScript)  
  - Role: Extracts Facebook post ID from response and builds permalink URL for the Facebook post.  
  - Config: Uses page username “SmartCampAI” (hardcoded), parses post ID.  
  - Output: Facebook post ID, URL, and published status boolean.

- **Build Instagram URL**  
  - Type: Code (JavaScript)  
  - Role: Extracts Instagram media ID and permalink URL from API response.  
  - Output: Instagram post ID, URL, and published status boolean.

- **Merge**  
  - Type: Merge  
  - Role: Combines Facebook and Instagram post data streams into one for downstream processing.

- Sticky Notes:  
  - "Posting to Facebook & Instagram. Remember to paste your unique site ID."

---

#### 1.6 Post-Processing & Logging

**Overview:**  
Gathers all relevant post data, appends it to Google Sheets for record-keeping, and sends notification messages through Telegram.

**Nodes Involved:**  
- Collect Important Data  
- Append row in sheet  
- Send a photo message  
- Send a text message  
- Sticky Notes (descriptive)

**Node Details:**

- **Collect Important Data**  
  - Type: Code (JavaScript)  
  - Role: Safely collects data from previous nodes—Facebook and Instagram post IDs, URLs, captions, titles, public image URL—for logging. Handles missing data gracefully.  
  - Input: Merged post data and other nodes  
  - Output: Structured JSON with all important fields

- **Append row in sheet**  
  - Type: Google Sheets  
  - Role: Appends a new row to the Google Sheet to log URL, post content, image URL, Facebook and Instagram post IDs and URLs.  
  - Config: Uses sheet and document IDs; columns are predefined; OAuth2 credentials required.  
  - Failure cases: API limits, invalid credentials.

- **Send a photo message**  
  - Type: Telegram  
  - Role: Sends a photo message to a Telegram chat including links to Facebook and Instagram posts.  
  - Config: Chat ID hardcoded; caption includes post URLs; credentials required.  
  - Failure cases: Invalid chat ID, bot token errors.

- **Send a text message**  
  - Type: Telegram  
  - Role: Sends a text message with original article title and link plus the AI-generated post content.  
  - Config: Similar to photo message; chat ID and credentials required.

- Sticky Notes:  
  - "Collect and organize data. Information about generated posts gets saved to Google Sheets."  
  - "Send a report via Telegram. Information about published posts gets sent by a Telegram bot."

---

### 3. Summary Table

| Node Name                | Node Type                            | Functional Role                         | Input Node(s)               | Output Node(s)                       | Sticky Note                                                                                             |
|--------------------------|------------------------------------|---------------------------------------|----------------------------|------------------------------------|-------------------------------------------------------------------------------------------------------|
| RSS Feed Trigger          | RSS Feed Read Trigger               | Trigger on new RSS feed items          | -                          | Get row(s) in sheet                 | Paste a RSS channel URL here                                                                           |
| Get row(s) in sheet      | Google Sheets                      | Check if article URL already logged    | RSS Feed Trigger           | If                                 | If the URL has not been processed (row does not exist in Google Sheets), the workflow will proceed.   |
| If                       | If                                 | Filter to continue only new articles   | Get row(s) in sheet         | HTTP Request                       |                                                                                                       |
| HTTP Request             | HTTP Request                      | Download article HTML content          | If                         | HTML                              |                                                                                                       |
| HTML                     | HTML Extract                      | Extract main article text               | HTTP Request               | Basic LLM Chain                   | The contents of the article gets extracted.                                                           |
| Basic LLM Chain           | LangChain LLM Chain                | Summarize article into social post     | HTML                       | Basic LLM Chain1                  | A summary of the article is written by Claude.                                                        |
| Basic LLM Chain1          | LangChain LLM Chain                | Generate AI prompt for image generation | Basic LLM Chain             | Generate an image                 | A prompt for image generation is created based on the Claude's summary and an image is generated in the OpenAI Image Generator. |
| Anthropic Chat Model      | LangChain AI Model                 | AI engine for summarization            | Basic LLM Chain             | Basic LLM Chain                  |                                                                                                       |
| Google Gemini Chat Model  | LangChain AI Model                 | AI engine for prompt generation        | Basic LLM Chain1            | Basic LLM Chain1                 |                                                                                                       |
| Generate an image         | LangChain OpenAI Image Generation | Generate image from AI prompt          | Basic LLM Chain1            | Edit Fields                     |                                                                                                       |
| Edit Fields              | Set                               | Add filename to image data              | Generate an image           | Supabase Config                 |                                                                                                       |
| Supabase Config           | Set                               | Define Supabase upload parameters       | Edit Fields                | Upload to Supabase (uses credentials) | Uploads the image to Supabase Storage. Set your bucket name in the Set node or via JSON.               |
| Upload to Supabase (uses credentials) | HTTP Request                      | Upload image to Supabase storage       | Supabase Config            | Supabase Public URL             |                                                                                                       |
| Supabase Public URL       | Set                               | Generate public URL for uploaded image  | Upload to Supabase         | Post to Instagram, Post to Facebook |                                                                                                       |
| Post to Instagram         | HTTP Request                      | Create Instagram media object           | Supabase Public URL        | Post to Instagram1              |                                                                                                       |
| Post to Instagram1        | HTTP Request                      | Publish Instagram media                  | Post to Instagram          | Get Post URL                   |                                                                                                       |
| Get Post URL              | HTTP Request                      | Fetch Instagram post permalink           | Post to Instagram1         | Build Instagram URL            |                                                                                                       |
| Post to Facebook          | HTTP Request                      | Post image and caption to Facebook      | Supabase Public URL        | Build Facebook URL             | Remember to paste your unique site ID                                                                  |
| Build Facebook URL        | Code                              | Extract Facebook post ID and build URL  | Post to Facebook           | Merge                         |                                                                                                       |
| Build Instagram URL       | Code                              | Extract Instagram post ID and URL        | Get Post URL               | Merge                         |                                                                                                       |
| Merge                    | Merge                             | Combine Facebook and Instagram data      | Build Facebook URL, Build Instagram URL | Collect Important Data    |                                                                                                       |
| Collect Important Data    | Code                              | Aggregate post data for logging and messaging | Merge                    | Append row in sheet            |                                                                                                       |
| Append row in sheet       | Google Sheets                    | Log post data to Google Sheets           | Collect Important Data     | Send a photo message           |                                                                                                       |
| Send a photo message      | Telegram                         | Send photo message with post links       | Append row in sheet        | Send a text message            |                                                                                                       |
| Send a text message       | Telegram                         | Send text notification with post details | Send a photo message       | -                            |                                                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create RSS Feed Trigger node**  
   - Type: RSS Feed Read Trigger  
   - Parameters: Set `feedUrl` to your RSS channel URL.  
   - Poll interval: every hour.

2. **Create Google Sheets node "Get row(s) in sheet"**  
   - Operation: Lookup rows in Google Sheet by "URL" column.  
   - Use OAuth2 Google Sheets credential.  
   - Set document ID and sheet name to your Google Sheet.  
   - Filter: `lookupValue` = `{{$json.link}}` (from RSS item).  
   - Connect RSS Feed Trigger → Get row(s) in sheet.

3. **Create If node**  
   - Condition: Check if output from "Get row(s) in sheet" is empty (no rows found).  
   - Connect Get row(s) in sheet → If true output continues workflow.

4. **Create HTTP Request node**  
   - Method: GET  
   - URL: `={{ $('RSS Feed Trigger').item.json.link }}`  
   - Connect If true → HTTP Request.

5. **Create HTML Extract node**  
   - Operation: Extract HTML content using CSS selector `*`, skipping `a, img`.  
   - Connect HTTP Request → HTML.

6. **Set up LangChain AI nodes**  
   - Create Anthropic Chat Model node with credentials.  
   - Create Google Gemini Chat Model node with credentials.

7. **Create Basic LLM Chain node**  
   - Text input: extracted article content from HTML node.  
   - Prompt: Summarize article as described (5 sentences, hashtags, emojis, source).  
   - Connect HTML → Basic LLM Chain.  
   - Configure to use Anthropic Chat Model as AI engine.

8. **Create Basic LLM Chain1 node**  
   - Text input: summary from Basic LLM Chain.  
   - Prompt: Generate image prompt based on summary (avoid quotes, <1000 chars).  
   - Connect Basic LLM Chain → Basic LLM Chain1.  
   - Configure to use Google Gemini Chat Model.

9. **Create Generate an image node**  
   - Model: OpenAI image generation model (gpt-image-1).  
   - Prompt: output from Basic LLM Chain1.  
   - Image size: 1024x1024, quality high.  
   - Connect Basic LLM Chain1 → Generate an image.  
   - Credentials: OpenAI API key.

10. **Create Edit Fields node**  
    - Add `filename` field: timestamp in ms + ".png".  
    - Connect Generate an image → Edit Fields.

11. **Create Supabase Config node (Set)**  
    - Define `bucket`, `filename`, `supabase_base_url`, and TTL.  
    - Replace placeholders with your Supabase project URL and bucket name.  
    - Connect Edit Fields → Supabase Config.

12. **Create Upload to Supabase node (HTTP Request)**  
    - Method: POST  
    - URL built from Supabase Config properties.  
    - Send binary image data with correct headers.  
    - Credentials: Supabase API key.  
    - Connect Supabase Config → Upload to Supabase.

13. **Create Supabase Public URL node (Set)**  
    - Construct public URL combining Supabase base URL, bucket, and filename.  
    - Connect Upload to Supabase → Supabase Public URL.

14. **Create Post to Instagram node (HTTP Request)**  
    - URL: `https://graph.facebook.com/v23.0/[YOUR_SITE_ID]/media`  
    - Method: POST, form-urlencoded body with `image_url` (public URL) and `caption` (summary).  
    - Credentials: Facebook Graph API OAuth2 token.  
    - Connect Supabase Public URL → Post to Instagram.

15. **Create Post to Instagram1 node (HTTP Request)**  
    - URL: `https://graph.facebook.com/v23.0/[YOUR_SITE_ID]/media_publish`  
    - Method: POST, with `creation_id` from previous response.  
    - Credentials: Facebook Graph API OAuth2 token.  
    - Connect Post to Instagram → Post to Instagram1.

16. **Create Get Post URL node (HTTP Request)**  
    - URL: Facebook Graph API endpoint for post permalink, using media ID.  
    - Credentials: Facebook Graph API OAuth2 token.  
    - Connect Post to Instagram1 → Get Post URL.

17. **Create Post to Facebook node (HTTP Request)**  
    - URL: `https://graph.facebook.com/v19.0/[YOUR_SITE_ID]/photos`  
    - Method: POST, form-urlencoded body with `caption` (summary + source) and image URL.  
    - Credentials: Facebook Graph API OAuth2 token.  
    - Connect Supabase Public URL → Post to Facebook.

18. **Create Build Facebook URL node (Code)**  
    - JavaScript extracts post ID from Post to Facebook response and builds permalink.  
    - Connect Post to Facebook → Build Facebook URL.

19. **Create Build Instagram URL node (Code)**  
    - JavaScript extracts Instagram media ID and permalink URL.  
    - Connect Get Post URL → Build Instagram URL.

20. **Create Merge node**  
    - Merge Build Facebook URL and Build Instagram URL outputs.  
    - Connect Build Facebook URL and Build Instagram URL → Merge.

21. **Create Collect Important Data node (Code)**  
    - Safely collect all relevant data (post IDs, URLs, captions, image URLs, titles).  
    - Connect Merge → Collect Important Data.

22. **Create Append row in sheet node (Google Sheets)**  
    - Append new row with all collected data (URL, post content, image URL, Facebook and Instagram post IDs and URLs).  
    - Connect Collect Important Data → Append row in sheet.

23. **Create Send a photo message node (Telegram)**  
    - Chat ID and bot credentials set.  
    - Caption includes Facebook and Instagram post URLs.  
    - Sends photo from image URL.  
    - Connect Append row in sheet → Send a photo message.

24. **Create Send a text message node (Telegram)**  
    - Sends text message with original article title, link, and post content.  
    - Connect Send a photo message → Send a text message.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                   |
|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Paste your RSS channel URL in the RSS Feed Trigger node to start automatic polling.           | Sticky Note on "RSS Feed Trigger" node.                                                         |
| Set your Google Sheets document and sheet IDs correctly to enable URL filtering and logging. | Google Sheets nodes "Get row(s) in sheet" and "Append row in sheet".                             |
| Insert your Supabase URL and bucket name in the "Supabase Config" node to enable image upload.| Sticky Note on "Supabase Config" node: "Uploads the image to Supabase Storage."                  |
| Paste your unique Facebook Page/site ID in all Facebook API request URLs.                     | Sticky Note on "Post to Facebook" and "Post to Instagram" nodes.                                |
| Use valid API credentials for OpenAI, Anthropic, Google Gemini (PaLM), Facebook Graph API, Telegram Bot, Google Sheets, and Supabase. | Credential setup required for AI models, Facebook Graph API, Telegram, Google Sheets, Supabase. |
| Telegram bot sends notifications to chat ID 1187348254; change as needed for your environment. | Telegram nodes "Send a photo message" and "Send a text message".                               |
| For AI summarization, two models are connected: Anthropic Claude 4 and Google Gemini (PaLM).  | Allows fallback or selection of AI engines.                                                    |
| Facebook post URLs are constructed using a hardcoded username "SmartCampAI" - modify as needed.| Code node "Build Facebook URL".                                                                 |

---

This structured documentation enables a developer or AI agent to understand, reproduce, and maintain the workflow effectively, including handling potential errors and integration nuances.