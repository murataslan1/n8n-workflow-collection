Auto-Generate Social Media Posts from URLs with AI, Telegram & Multi-Platform Posting

https://n8nworkflows.xyz/workflows/auto-generate-social-media-posts-from-urls-with-ai--telegram---multi-platform-posting-9059


# Auto-Generate Social Media Posts from URLs with AI, Telegram & Multi-Platform Posting

### 1. Workflow Overview

This workflow automates the generation and multi-platform posting of social media content based on URLs shared via Telegram messages. It is designed to streamline content repurposing by extracting article content from URLs, summarizing and formatting it using AI, generating related images, and then publishing posts to Facebook, Instagram, and LinkedIn. It also updates a Google Sheet with post metadata and sends a confirmation back to the Telegram user.

**Target Use Cases:**  
- Social media managers who want to quickly create posts from shared articles.  
- Content creators automating multi-platform sharing.  
- Teams collaborating via Telegram to publish curated content.

**Logical Blocks:**

- **1.1 Input Reception & Validation:** Receiving Telegram messages and verifying they contain URLs.  
- **1.2 URL Extraction and Storage:** Extracting the URL from the message and appending it to Google Sheets.  
- **1.3 Content Fetching and Processing:** Downloading the URL content, extracting text, and preparing it for AI.  
- **1.4 AI Content Generation:** Using OpenAI GPT and Google Gemini models for generating social media posts and image prompts.  
- **1.5 Image Generation & Upload:** Creating an image via AI and uploading it to Supabase Storage.  
- **1.6 Multi-Platform Publishing:** Posting generated content and images to Facebook, Instagram, and LinkedIn using respective APIs.  
- **1.7 Post-Publishing Updates:** Fetching post URLs, updating Google Sheets with final post details, and sending confirmation to Telegram.  
- **1.8 Credentials & Configuration:** Managing credentials and configurable parameters for external services.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Validation

- **Overview:**  
  This block listens for Telegram messages via a bot trigger and checks if the message contains a URL. If no URL is found, it sends a Telegram warning message.

- **Nodes Involved:**  
  - Telegram Bot Trigger  
  - If message contains URL  
  - Telegram (send warning message)

- **Node Details:**

  - **Telegram Bot Trigger**  
    - *Type:* Trigger node (Telegram Trigger)  
    - *Role:* Listens for incoming Telegram messages.  
    - *Config:* Listens to "message" update type. Uses Telegram API credentials.  
    - *Input/Output:* Triggers workflow on new message. Outputs message JSON.  
    - *Failures:* Telegram API auth errors, webhook misconfiguration.  

  - **If message contains URL**  
    - *Type:* Conditional (If) node  
    - *Role:* Checks if the Telegram message text includes an HTTP/HTTPS URL using regex.  
    - *Config:* Expression checks existence of URL pattern in message text.  
    - *Input:* Message JSON from trigger node.  
    - *Output:* Two branches - true (URL found), false (no URL).  
    - *Failures:* Expression evaluation errors if message text missing.  

  - **Telegram (warning message)**  
    - *Type:* Action node (Telegram)  
    - *Role:* Sends a message warning the user to send a valid URL if none found.  
    - *Config:* Sends predefined text to the chat ID extracted from the incoming message.  
    - *Input:* From false branch of If node.  
    - *Failures:* Telegram API errors or invalid chat ID.  

---

#### 1.2 URL Extraction and Storage

- **Overview:**  
  Extracts the first URL from the Telegram message text and stores it with metadata to Google Sheets for tracking.

- **Nodes Involved:**  
  - Extract URL (Function)  
  - Append or update row in sheet (Google Sheets)

- **Node Details:**

  - **Extract URL (Function)**  
    - *Type:* Function node  
    - *Role:* Parses the Telegram message to extract the first URL, chat ID, message ID, timestamp, and original message text.  
    - *Config:* Uses regex to extract URL, throws error if none found. Returns structured JSON with metadata.  
    - *Input:* Telegram message JSON.  
    - *Output:* JSON with keys: url, chatId, messageId, timestamp, originalMessage.  
    - *Failures:* Throws error if no URL found in message.  

  - **Append or update row in sheet (Google Sheets)**  
    - *Type:* Google Sheets node  
    - *Role:* Adds or updates a row in a Google Sheet with the extracted URL to track processing status.  
    - *Config:* Matches on "Source URL" column, appends if not found. Uses OAuth2 credentials. Spreadsheet and sheet ID are configured.  
    - *Input:* Extract URL output JSON.  
    - *Failures:* Google Sheets API auth issues, sheet ID or column misconfiguration.  

---

#### 1.3 Content Fetching and Processing

- **Overview:**  
  Downloads the webpage content from the extracted URL, extracts meaningful text, and prepares it for AI summarization.

- **Nodes Involved:**  
  - Fetch URL Content (HTTP Request)  
  - Extract Text Content (Function)

- **Node Details:**

  - **Fetch URL Content (HTTP Request)**  
    - *Type:* HTTP Request node  
    - *Role:* Fetches the full HTTP response content of the URL extracted earlier.  
    - *Config:* URL parameterized by previous Extract URL node. Follows redirects. Returns full HTTP response including body.  
    - *Input:* Extracted URL JSON.  
    - *Failures:* Network errors, invalid URL, HTTP errors, timeouts.  

  - **Extract Text Content (Function)**  
    - *Type:* Function node  
    - *Role:* Parses raw HTML content to remove scripts/styles and extract plain text and title. Limits content length to 8000 characters.  
    - *Config:* Regex-based HTML tag stripping, title extraction via regex, error if content too short (<100 chars).  
    - *Input:* HTTP response body from Fetch URL Content.  
    - *Output:* JSON with url, title, content, wordCount.  
    - *Failures:* Poorly formatted HTML, empty content, regex failure.  

---

#### 1.4 AI Content Generation

- **Overview:**  
  Generates social media posts tailored for Facebook, Instagram, and LinkedIn using OpenAI GPT models, and prepares prompts for image generation.

- **Nodes Involved:**  
  - Facebook Post (OpenAI GPT)  
  - Instagram Post (OpenAI GPT)  
  - LinkedIn Post (OpenAI GPT)  
  - Basic LLM Chain2 (Google Gemini Language Model)  
  - Generate an image1 (OpenAI Image Generation)

- **Node Details:**

  - **Facebook Post (OpenAI GPT)**  
    - *Type:* OpenAI GPT node (LangChain)  
    - *Role:* Creates a professional, engaging Facebook post of 100-200 words with light humor and a call to action based on article content.  
    - *Config:* Uses GPT-4.1-NANO model, message content dynamically injected from extracted text content.  
    - *Input:* Extract Text Content output.  
    - *Failures:* OpenAI API quota, malformed prompt, model errors.  

  - **Instagram Post (OpenAI GPT)**  
    - *Type:* OpenAI GPT node (LangChain)  
    - *Role:* Crafts a short, punchy Instagram post (50-80 words) with casual tone, emojis, hashtags, and wordplay.  
    - *Config:* Same model, prompt tailored for Instagram style.  
    - *Input:* Extract Text Content output.  
    - *Failures:* Same as Facebook Post.  

  - **LinkedIn Post (OpenAI GPT)**  
    - *Type:* OpenAI GPT node (LangChain)  
    - *Role:* Generates a professional LinkedIn post limited to 400 characters.  
    - *Config:* Uses GPT-4.1-NANO, prompt concise and professional.  
    - *Input:* Extract Text Content output.  
    - *Failures:* Same as above.  

  - **Basic LLM Chain2 (Google Gemini)**  
    - *Type:* Google Gemini LLM Chain node  
    - *Role:* Generates a detailed prompt for AI image generation aligned with the article's theme, style, and branding.  
    - *Config:* Custom prompt in Polish requesting professional, relevant images with branding text.  
    - *Input:* Output from LinkedIn Post (or other content).  
    - *Failures:* Google PaLM API errors, prompt generation issues.  

  - **Generate an image1 (OpenAI Image Generation)**  
    - *Type:* OpenAI Image generation node  
    - *Role:* Creates a high-quality 1024x1024 image based on the prompt from Gemini model.  
    - *Config:* Uses GPT-image-1 model, prompt taken from Basic LLM Chain2 output.  
    - *Input:* Prompt string from Basic LLM Chain2.  
    - *Failures:* API limits, image generation failures.  

---

#### 1.5 Image Generation & Upload

- **Overview:**  
  Prepares the generated image filename, uploads the image binary to Supabase Storage bucket, and generates a public URL.

- **Nodes Involved:**  
  - Edit Fields (Set)  
  - Supabase Config (Set)  
  - Upload to Supabase (HTTP Request)  
  - Supabase Public URL (Set)

- **Node Details:**

  - **Edit Fields (Set)**  
    - *Type:* Set node  
    - *Role:* Assigns a filename for the image using the current timestamp in milliseconds with .png extension.  
    - *Input:* Image binary data from Generate an image1.  
    - *Failures:* Timestamp generation failure unlikely.  

  - **Supabase Config (Set)**  
    - *Type:* Set node  
    - *Role:* Defines Supabase storage bucket name, filename, link TTL, and base API URL for upload.  
    - *Config:* Bucket named "social-media-ai-generated".  
    - *Input:* Output from Edit Fields.  

  - **Upload to Supabase (HTTP Request)**  
    - *Type:* HTTP Request node  
    - *Role:* Uploads the image binary to Supabase Storage using predefined Supabase API credentials.  
    - *Config:* POST request with binary data, content-type header set dynamically, x-upsert header true to overwrite if exists.  
    - *Input:* Binary image data and Supabase config.  
    - *Failures:* Network, auth errors, bucket permissions.  

  - **Supabase Public URL (Set)**  
    - *Type:* Set node  
    - *Role:* Constructs a public URL for the uploaded image to be used in social media posts.  
    - *Config:* Combines base URL, bucket, and filename with encoding.  
    - *Input:* Output from Upload to Supabase.  

---

#### 1.6 Multi-Platform Publishing

- **Overview:**  
  Posts the generated social media content and the uploaded image to Facebook, Instagram, and LinkedIn via their respective APIs. Retrieves post URLs for confirmation.

- **Nodes Involved:**  
  - Post to Facebook (HTTP Request)  
  - Post to Instagram (HTTP Request)  
  - Post to Instagram1 (HTTP Request)  
  - Get Post URL (HTTP Request)  
  - Facebook Post (Code)  
  - Code1 (Code)  
  - LinkedIn (LinkedIn node)  
  - Code2 (Code)  
  - Merge, Merge1, Merge2 (Merge nodes)

- **Node Details:**

  - **Post to Facebook (HTTP Request)**  
    - *Role:* Uploads photo post to Facebook Page using Graph API.  
    - *Config:* URL includes site/page ID (to be replaced). Sends caption and image URL. Uses Facebook Graph API credentials.  
    - *Input:* Caption from Facebook Post AI node, image URL from Supabase.  
    - *Failures:* Auth errors, API limits, invalid page ID.  

  - **Post to Instagram (HTTP Request)**  
    - *Role:* Creates Instagram media object (image + caption) via Facebook Graph API for Instagram Business.  
    - *Config:* Uses site/page ID, sends image_url and caption.  
    - *Input:* Caption from Instagram Post AI node, image URL from Supabase.  
    - *Failures:* Same as Facebook Post.  

  - **Post to Instagram1 (HTTP Request)**  
    - *Role:* Publishes the Instagram media object created in previous node.  
    - *Config:* Uses media creation ID, access token from credentials.  
    - *Input:* Media creation response from Post to Instagram node.  
    - *Failures:* Token expiration, API errors.  

  - **Get Post URL (HTTP Request)**  
    - *Role:* Fetches permalink URL of the Facebook post using Graph API.  
    - *Input:* Post ID from Post to Instagram1 or Facebook Post.  
    - *Failures:* Post not found, API errors.  

  - **Facebook Post (Code)**  
    - *Role:* Parses Facebook post ID and constructs user-friendly post URL for confirmation.  
    - *Input:* Facebook API post response.  
    - *Output:* JSON with post ID and URL.  

  - **Code1 (Code)**  
    - *Role:* Extracts Instagram post ID and permalink from API response.  
    - *Input:* Instagram API response after publishing.  
    - *Output:* JSON with Instagram post URL and ID.  

  - **LinkedIn (LinkedIn node)**  
    - *Role:* Shares generated LinkedIn post content with image to LinkedIn profile/page.  
    - *Config:* Uses OAuth2 credentials, image media category, and post text.  
    - *Input:* LinkedIn Post AI node content, image URL.  
    - *Failures:* OAuth token expiration, API errors.  

  - **Code2 (Code)**  
    - *Role:* Converts LinkedIn response URN to a standard LinkedIn post URL.  
    - *Input:* LinkedIn API response.  
    - *Output:* JSON with LinkedIn post URL and ID.  

  - **Merge, Merge1, Merge2 (Merge nodes)**  
    - *Role:* Combine outputs of Facebook, Instagram, and LinkedIn posting flows and image URL for final processing.  
    - *Config:* Merges by position or default to aggregate data.  

---

#### 1.7 Post-Publishing Updates

- **Overview:**  
  Updates the Google Sheet with all generated post URLs and contents, then sends a Telegram photo message confirming success with direct post links.

- **Nodes Involved:**  
  - Code3 (Code)  
  - Final Status Update (Google Sheets)  
  - Send a photo message (Telegram)

- **Node Details:**

  - **Code3 (Code)**  
    - *Role:* Merges all post data objects (Facebook, Instagram, LinkedIn, image URL, content) into a single JSON object.  
    - *Input:* Merged data from Merge3 node.  
    - *Output:* Combined JSON for updating records and messaging.  

  - **Final Status Update (Google Sheets)**  
    - *Role:* Updates the existing row in Google Sheets with final post URLs and contents for Facebook, Instagram, and LinkedIn, along with image URL and source URL.  
    - *Config:* Uses 'update' operation based on Source URL key.  
    - *Input:* Combined JSON from Code3.  
    - *Failures:* Google Sheets API errors, row not found.  

  - **Send a photo message (Telegram)**  
    - *Role:* Sends the generated image back to the Telegram chat with captions including links to the published posts for user confirmation.  
    - *Config:* Uses Telegram API credentials, constructs caption with post URLs.  
    - *Input:* Public image URL and chat ID from trigger.  
    - *Failures:* Telegram API errors, invalid chat ID, file download issues.  

---

#### 1.8 Credentials & Configuration

- **Overview:**  
  Contains sticky notes and configuration nodes to manage credentials and project notes.

- **Nodes Involved:**  
  - Credentials (Sticky Note)  
  - Workflow Overview (Sticky Note)  
  - Input (Sticky Note)  
  - Image pipeline (Sticky Note)  
  - Sheets mapping (Sticky Note)  
  - AI Processing (Sticky Note)  
  - Publishing Phase (Sticky Note)  
  - Publishing Phase1 & Phase2 (Sticky Notes)

- **Description:**  
  These nodes are documentation within the workflow UI, providing context about credentials required (OpenAI, Google Sheets OAuth2, Facebook/Instagram Graph API, Supabase, LinkedIn OAuth2), input assumptions, image pipeline explanations, and publishing details. They do not process data.

---

### 3. Summary Table

| Node Name                 | Node Type                        | Functional Role                                   | Input Node(s)                 | Output Node(s)                | Sticky Note                                                                                              |
|---------------------------|---------------------------------|-------------------------------------------------|------------------------------|------------------------------|--------------------------------------------------------------------------------------------------------|
| Telegram Bot Trigger       | Telegram Trigger                | Receives Telegram messages                        |                              | If message contains URL       |                                                                                                        |
| If message contains URL    | If                             | Checks if message contains a URL                  | Telegram Bot Trigger          | Extract URL, Telegram          |                                                                                                        |
| Telegram                  | Telegram                       | Sends warning if no URL found                      | If message contains URL (false) |                              |                                                                                                        |
| Extract URL               | Function                      | Extracts first URL and metadata from message      | If message contains URL (true) | Append or update row in sheet |                                                                                                        |
| Append or update row in sheet | Google Sheets               | Adds URL record for tracking                       | Extract URL                  | Fetch URL Content             | 📊 Sheet mapping: Update Sheet ID and name; columns auto-created                                         |
| Fetch URL Content         | HTTP Request                  | Downloads webpage content from extracted URL      | Append or update row in sheet | Extract Text Content          |                                                                                                        |
| Extract Text Content      | Function                      | Extracts clean text and title from HTML            | Fetch URL Content            | Facebook Post, Instagram Post, LinkedIn Post |                                                                                                        |
| Facebook Post             | OpenAI GPT (LangChain)        | Generates Facebook post content                     | Extract Text Content         | Merge                        | # 🤖 AI Content Generation                                                                               |
| Instagram Post            | OpenAI GPT (LangChain)        | Generates Instagram post content                    | Extract Text Content         | Merge1                       |                                                                                                        |
| LinkedIn Post             | OpenAI GPT (LangChain)        | Generates LinkedIn post content                     | Extract Text Content         | Basic LLM Chain2, Merge2      |                                                                                                        |
| Basic LLM Chain2          | Google Gemini LLM Chain       | Creates prompt for image generation                 | LinkedIn Post               | Generate an image1            | 🖼️ Image handling                                                                                        |
| Generate an image1        | OpenAI Image Generation       | Generates image from prompt                          | Basic LLM Chain2             | Edit Fields                  |                                                                                                        |
| Edit Fields               | Set                           | Assigns filename for image                           | Generate an image1           | Supabase Config              |                                                                                                        |
| Supabase Config           | Set                           | Sets bucket and API details for Supabase upload    | Edit Fields                 | Upload to Supabase           |                                                                                                        |
| Upload to Supabase (uses credentials) | HTTP Request           | Uploads image binary to Supabase Storage            | Supabase Config             | Supabase Public URL          | 🔐 Credentials: Uses Supabase API key                                                                    |
| Supabase Public URL       | Set                           | Creates public URL for uploaded image               | Upload to Supabase           | Merge2, Merge1, Merge         |                                                                                                        |
| Merge2                    | Merge                         | Combines LinkedIn post, image URL                   | Supabase Public URL, LinkedIn Post | Binary File               |                                                                                                        |
| Merge1                    | Merge                         | Combines Instagram post and image URL               | Supabase Public URL, Instagram Post | Post to Instagram         |                                                                                                        |
| Merge                     | Merge                         | Combines Facebook post and image URL                | Supabase Public URL, Facebook Post | Post to Facebook           |                                                                                                        |
| Post to Facebook          | HTTP Request                  | Posts photo to Facebook Page via Graph API          | Merge                       | Code                        |                                                                                                        |
| Code                      | Code                          | Extracts Facebook post ID and constructs URL        | Post to Facebook            | Merge3                      |                                                                                                        |
| Post to Instagram         | HTTP Request                  | Creates Instagram media object                        | Merge1                      | Post to Instagram1           |                                                                                                        |
| Post to Instagram1        | HTTP Request                  | Publishes Instagram media object                     | Post to Instagram           | Get Post URL                 |                                                                                                        |
| Get Post URL              | HTTP Request                  | Retrieves Facebook post permalink                     | Post to Instagram1          | Code1                       |                                                                                                        |
| Code1                     | Code                          | Extracts Instagram post ID and permalink             | Get Post URL                | Merge3                      |                                                                                                        |
| Binary File               | HTTP Request                  | Downloads image file for LinkedIn post                | Merge2                      | LinkedIn                    |                                                                                                        |
| LinkedIn                  | LinkedIn                      | Posts image and text to LinkedIn                       | Binary File                 | Code2                       |                                                                                                        |
| Code2                     | Code                          | Extracts LinkedIn post ID and constructs URL          | LinkedIn                   | Merge3                      |                                                                                                        |
| Merge3                    | Merge                         | Combines Facebook, Instagram, LinkedIn post info      | Code, Code1, Code2          | Code3                       |                                                                                                        |
| Code3                     | Code                          | Merges all post data into single JSON                  | Merge3                     | Final Status Update          |                                                                                                        |
| Final Status Update       | Google Sheets                 | Updates Google Sheet with post URLs and content        | Code3                      | Send a photo message         |                                                                                                        |
| Send a photo message      | Telegram                      | Sends confirmation photo and post URLs back to user   | Final Status Update         |                              |                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Bot Trigger Node:**  
   - Type: Telegram Trigger  
   - Configure to listen for "message" updates.  
   - Add Telegram API credentials.

2. **Add an If Node to Check URL Presence:**  
   - Condition: Check if message text contains `https?://` URL using regex.  
   - True branch: Proceed to extract URL.  
   - False branch: Send warning message.

3. **Add Telegram Node to Send Warning:**  
   - Configure to send message: "You can't do this here. You need to upload a URL with an article." to chat ID from trigger.

4. **Add Function Node to Extract URL and Metadata:**  
   - Parse the first URL from message text using regex.  
   - Extract chat ID, message ID, timestamp, and original message text.

5. **Add Google Sheets Node (Append or Update):**  
   - Configure OAuth2 credentials.  
   - Set spreadsheet ID and sheet name.  
   - Match on "Source URL" column.  
   - Append or update with extracted URL and metadata.

6. **Add HTTP Request Node to Fetch URL Content:**  
   - URL set from extracted URL field.  
   - Enable redirects and full response.

7. **Add Function Node to Extract Text Content:**  
   - Strip HTML tags, scripts, styles.  
   - Extract title from `<title>` tag.  
   - Limit content to 8000 chars; error if content < 100 chars.

8. **Add OpenAI GPT Nodes for Social Media Posts:**  
   - Facebook Post: GPT-4.1-NANO model, prompt for professional Facebook post with light humor.  
   - Instagram Post: GPT-4.1-NANO, prompt for casual, emoji-rich Instagram post with hashtags.  
   - LinkedIn Post: GPT-4.1-NANO, prompt for concise professional LinkedIn post.

9. **Add Google Gemini LLM Chain Node:**  
   - Configure Google Palm API credentials.  
   - Prompt to generate an AI image prompt related to article theme.

10. **Add OpenAI Image Generation Node:**  
    - Model "gpt-image-1".  
    - Use prompt from Gemini node.  
    - Output is image binary data.

11. **Add Set Node to Assign Image Filename:**  
    - Filename = current timestamp in milliseconds + ".png".

12. **Add Set Node for Supabase Config:**  
    - Bucket name = "social-media-ai-generated".  
    - Include filename, link TTL (3600s), and Supabase base URL.

13. **Add HTTP Request Node to Upload Image to Supabase:**  
    - POST binary data to Supabase Storage endpoint.  
    - Headers: content-type from binary mime type, x-upsert=true.  
    - Use Supabase API credentials.

14. **Add Set Node to Generate Public URL for Image:**  
    - Construct public URL from Supabase base URL, bucket, and filename.

15. **Add Merge Nodes to Combine Social Media Post Outputs and Image URL:**  
    - Merge Facebook post and image URL.  
    - Merge Instagram post and image URL.  
    - Merge LinkedIn post and image URL.

16. **Add HTTP Request Nodes to Post to Facebook and Instagram:**  
    - Facebook: POST to Graph API photos endpoint with caption and image URL.  
    - Instagram: POST media creation with image_url and caption.  
    - Instagram publish: POST media_publish with creation ID.

17. **Add HTTP Request Node to Get Facebook Post URL:**  
    - GET request to Graph API for post permalink.

18. **Add Code Nodes to Extract Post IDs and URLs:**  
    - Facebook: Extract post ID from response and construct URL.  
    - Instagram: Extract media ID and permalink.  
    - LinkedIn: Parse URN and build post URL.

19. **Add LinkedIn Node to Post Content:**  
    - Use OAuth2 credentials.  
    - Post text and image media category "IMAGE".

20. **Add Merge Node to Consolidate All Post Data:**  
    - Merge Facebook, Instagram, LinkedIn post info.

21. **Add Code Node to Combine All Data into Single JSON:**  
    - Merge arrays of post info into one object.

22. **Add Google Sheets Node to Update Final Post Details:**  
    - Update existing row by matching Source URL.  
    - Fill columns with Facebook, Instagram, LinkedIn URLs and contents, Image URL.

23. **Add Telegram Node to Send Photo Message:**  
    - Send uploaded image to Telegram chat ID.  
    - Caption includes confirmation and social media post URLs.

24. **Add Sticky Notes for Documentation:**  
    - Overview, credentials, input assumptions, AI processing, image handling, publishing phases.

25. **Configure all credentials:**  
    - Telegram API  
    - Google Sheets OAuth2  
    - OpenAI API key  
    - Google Palm API credentials  
    - Facebook/Instagram Graph API credentials  
    - Supabase API key  
    - LinkedIn OAuth2 credentials

---

### 5. General Notes & Resources

| Note Content                                                                                                           | Context or Link                                                                                     |
|------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Workflow assumes Telegram messages contain exactly one URL to process.                                                 | Input assumption sticky note                                                                        |
| Ensure Google Sheets document ID and sheet name (gid) are updated to your own.                                          | 📊 Sheet mapping sticky note                                                                       |
| Replace `[INSERT_YOUR_SITE_ID]` placeholders with your actual Facebook and Instagram Page IDs in HTTP Request nodes.   | Publishing Phase2 sticky note                                                                       |
| Credentials are managed securely via n8n Credentials system; no API keys stored in the workflow JSON.                  | Credentials sticky note                                                                             |
| For image generation, the prompt is crafted by Google Gemini model to produce professional social media imagery.       | Image pipeline sticky note                                                                          |
| Posts are published to Facebook Pages, Instagram Business accounts (via Facebook Graph API), and LinkedIn profiles.    | Publishing Phase sticky notes                                                                       |
| Confirmations with post URLs and images are sent back to the Telegram user who triggered the workflow.                 | Publishing Phase1 sticky note                                                                       |
| Facebook Graph API versions used: v19.0 for photos, v23.0 for Instagram media creation and publishing.                  | See Post to Facebook and Post to Instagram nodes configuration                                     |
| LinkedIn posts include images and require OAuth2 authentication with proper permissions.                                | LinkedIn node configuration                                                                         |
| Workflow timezone set to Europe/Warsaw; adjust if needed in settings.                                                  | Workflow settings                                                                                   |

---

**Disclaimer:** The provided description and analysis are based exclusively on the automated n8n workflow JSON content. All components comply with legal and content policies. No illegal or protected content is included.