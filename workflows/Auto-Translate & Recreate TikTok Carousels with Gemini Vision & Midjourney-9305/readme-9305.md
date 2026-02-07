Auto-Translate & Recreate TikTok Carousels with Gemini Vision & Midjourney

https://n8nworkflows.xyz/workflows/auto-translate---recreate-tiktok-carousels-with-gemini-vision---midjourney-9305


# Auto-Translate & Recreate TikTok Carousels with Gemini Vision & Midjourney

### 1. Workflow Overview

This workflow automates the process of monitoring TikTok accounts for new 3-image carousel posts, extracting the text and visual layout from those images using AI-powered vision analysis, translating the extracted text into English, and recreating the carousel images with translated overlays using AI image generation. The final output is organized into a Google Sheet for review, accompanied by an email notification with previews.

**Target use cases:**  
- Social media managers and content creators who need to adapt foreign language TikTok carousel posts into English quickly.  
- Marketing teams aiming to replicate and translate high-performing TikTok carousels with minimal manual effort.  
- Automating daily content monitoring and reproduction workflows to save hours of manual design and translation work.

**Logical blocks:**  
- **1.1 Monitor TikTok Account:** Scheduled feed fetching and filtering for relevant posts.  
- **1.2 Extract & Analyze Images:** Download images, analyze them with Google Gemini Vision for text and layout data.  
- **1.3 Translate Text:** Use OpenAI GPT-4 to translate extracted text to English.  
- **1.4 Generate New Images:** Create detailed Midjourney prompts and generate new images with translated text overlays.  
- **1.5 Review & Deliver:** Aggregate results, save to Google Sheets, and send notification emails with previews.

---

### 2. Block-by-Block Analysis

#### 1.1 Monitor TikTok Account

- **Overview:**  
Periodically triggers the workflow daily to fetch the TikTok RSS feed for a specified username and filters posts to only those containing exactly three images (carousel).

- **Nodes Involved:**  
  - Daily TikTok Check (Schedule Trigger)  
  - Fetch TikTok RSS Feed (HTTP Request)  
  - Parse RSS Feed (Convert JSON to binary)  
  - Filter: Only 3-Image Posts (If node)  
  - Split Images (Split array of images)

- **Node Details:**  

  - **Daily TikTok Check**  
    - Type: Schedule Trigger  
    - Configuration: Runs once daily at unspecified time (default interval).  
    - Inputs: None (trigger)  
    - Outputs: Triggers next node "Fetch TikTok RSS Feed"  
    - Failures: Network issues or scheduler misconfiguration.  
    - Notes: Controls daily execution of entire workflow.

  - **Fetch TikTok RSS Feed**  
    - Type: HTTP Request  
    - Configuration: Fetches RSS XML feed from `https://www.tiktok.com/@USERNAME/rss` (replace USERNAME). Response format set to text.  
    - Inputs: Trigger from schedule  
    - Outputs: Raw RSS feed text  
    - Failures: 404 if username invalid, rate limiting, network errors.  
    - Notes: Alternative option is TikTok API if available.

  - **Parse RSS Feed**  
    - Type: Move Binary Data  
    - Configuration: Converts RSS XML text to binary JSON for parsing.  
    - Inputs: Raw RSS feed text  
    - Outputs: JSON object for downstream filtering  
    - Failures: XML parsing errors if feed malformed.

  - **Filter: Only 3-Image Posts**  
    - Type: If node  
    - Configuration: Filters entries where `imageCount` equals 3.  
    - Inputs: Parsed RSS feed items  
    - Outputs: Pass filtered posts to image splitting  
    - Failures: Miscounting images if data incomplete or malformed.

  - **Split Images**  
    - Type: Split Out  
    - Configuration: Splits array field `images` into individual items for processing each image separately.  
    - Inputs: Filtered TikTok posts with 3 images  
    - Outputs: Each image item to next node "Download Image"  
    - Failures: Empty or missing image arrays.

---

#### 1.2 Extract & Analyze Images

- **Overview:**  
Downloads each individual image and performs detailed AI vision analysis to extract visible text overlays, layout attributes, image type, and style for prompt generation.

- **Nodes Involved:**  
  - Download Image (HTTP Request)  
  - Extract Text & Layout (Gemini Vision)

- **Node Details:**  

  - **Download Image**  
    - Type: HTTP Request  
    - Configuration: Downloads image from URL specified in `imageUrl` field; response set to file (binary).  
    - Inputs: Single image item from Split Images  
    - Outputs: Binary image data to Gemini Vision node  
    - Failures: Broken image URLs, download timeouts.

  - **Extract Text & Layout (Gemini Vision)**  
    - Type: Google Gemini Vision (Langchain)  
    - Configuration: Uses Gemini Vision API to analyze image for:  
      1. All visible text overlays (exact text)  
      2. Text position (top/center/bottom)  
      3. Text style (bold, relative font size)  
      4. Image type (emotional scene, product mockup, text excerpt)  
      5. Main visual elements  
      6. Color scheme  
    - Model: Gemini 2.5 Flash  
    - Inputs: Binary image data  
    - Outputs: Structured JSON with analysis data  
    - Failures: API quota limits, malformed images, recognition errors.  
    - Credentials: Google Palm API (Gemini)

---

#### 1.3 Translate Text

- **Overview:**  
Translates the extracted text overlay from the original language to English using OpenAI GPT-4.

- **Nodes Involved:**  
  - Translate to English (OpenAI GPT-4)

- **Node Details:**  

  - **Translate to English**  
    - Type: OpenAI (Langchain)  
    - Configuration: Sends extracted text JSON to GPT-4 with prompt to translate it to English preserving meaning.  
    - Model: GPT-4  
    - Inputs: Extracted text from Gemini Vision output  
    - Outputs: Translated text JSON for image prompt generation  
    - Failures: API rate limits, text formatting errors.  
    - Credentials: OpenAI API

---

#### 1.4 Generate New Images

- **Overview:**  
Creates detailed image generation prompts integrating the original layout and translated text, then requests Midjourney API to generate new carousel images.

- **Nodes Involved:**  
  - Create Midjourney Prompt (Langchain Agent)  
  - Generate New Image (Midjourney HTTP Request)  
  - Wait for Image Generation (Wait node)  

- **Node Details:**  

  - **Create Midjourney Prompt**  
    - Type: Langchain Agent  
    - Configuration: Constructs a Midjourney v6 prompt using:  
      - Original image analysis JSON  
      - Translated English text  
      - Image type (emotional/product/text)  
      - Instructions for composition, emotional tone, text overlay position  
    - Inputs: Gemini Vision analysis + translated text  
    - Outputs: JSON prompt for Midjourney  
    - Failures: Prompt formatting errors, Langchain service issues.

  - **Generate New Image (Midjourney)**  
    - Type: HTTP Request  
    - Configuration: POST to Midjourney API endpoint `/v1/imagine` with JSON body containing prompt and aspect ratio 9:16. Authenticated via HTTP header.  
    - Inputs: Prompt JSON from previous node  
    - Outputs: Generation job ID or immediate image URL depending on API behavior  
    - Failures: Authentication errors, API downtime, rate limits.

  - **Wait for Image Generation**  
    - Type: Wait (Webhook resume)  
    - Configuration: Waits for Midjourney webhook callback (or timeout after 5 minutes) for image generation completion.  
    - Inputs: Triggered after image generation request  
    - Outputs: Generated image URL to aggregator  
    - Failures: Webhook callback failures, timeout if image not ready.

---

#### 1.5 Review & Deliver

- **Overview:**  
Aggregates the three generated images and related metadata, saves the data into a Google Sheet for review, and sends an email notification with clickable previews.

- **Nodes Involved:**  
  - Combine 3 Images (Aggregate)  
  - Save to Review Sheet (Google Sheets)  
  - Send Review Notification (Gmail)

- **Node Details:**  

  - **Combine 3 Images**  
    - Type: Aggregate  
    - Configuration: Aggregates fields: `generatedImageUrl`, `originalImageUrl`, `translatedText`, `imageType` across the 3 images to create a single composite item.  
    - Inputs: Generated images and metadata from Wait node  
    - Outputs: Combined data for storage and notification  
    - Failures: Missing fields or inconsistent data.

  - **Save to Review Sheet**  
    - Type: Google Sheets  
    - Configuration: Appends new row with date, status, post URL, new and original image URLs, text overlays, and image types into a specified Google Sheet (`YOUR_GOOGLE_SHEET_ID`).  
    - Inputs: Aggregated carousel data  
    - Outputs: Confirmation of append operation  
    - Failures: Authentication errors, sheet access issues, invalid sheet ID.  
    - Credentials: Google Sheets OAuth2

  - **Send Review Notification**  
    - Type: Gmail  
    - Configuration: Sends an HTML email with preview thumbnails, translated text, and link to Google Sheets review dashboard. Subject: "🎨 New TikTok Carousel Ready for Review".  
    - Inputs: Data from Google Sheets output  
    - Outputs: Email sent status  
    - Failures: Mail server authentication, invalid recipient, network errors.  
    - Credentials: Gmail OAuth2

---

### 3. Summary Table

| Node Name                    | Node Type                 | Functional Role                       | Input Node(s)                      | Output Node(s)                   | Sticky Note                                                                                                 |
|------------------------------|---------------------------|-------------------------------------|----------------------------------|---------------------------------|-------------------------------------------------------------------------------------------------------------|
| Daily TikTok Check            | Schedule Trigger          | Triggers daily workflow execution   | None                             | Fetch TikTok RSS Feed            | ## 📱 TikTok Monitor<br>Daily check for new carousel posts                                                  |
| Fetch TikTok RSS Feed         | HTTP Request             | Retrieves TikTok RSS feed            | Daily TikTok Check               | Parse RSS Feed                  | Replace USERNAME with target account. Alternative: use TikTok API if available                              |
| Parse RSS Feed               | Move Binary Data          | Converts feed text to JSON/binary   | Fetch TikTok RSS Feed            | Filter: Only 3-Image Posts      |                                                                                                             |
| Filter: Only 3-Image Posts   | If                       | Filters posts with exactly 3 images | Parse RSS Feed                  | Split Images                   |                                                                                                             |
| Split Images                | Split Out                 | Splits images array into single items | Filter: Only 3-Image Posts       | Download Image                 |                                                                                                             |
| Download Image              | HTTP Request             | Downloads each image file            | Split Images                    | Extract Text & Layout (Gemini Vision) |                                                                                                             |
| Extract Text & Layout (Gemini Vision) | Google Gemini Vision (Langchain) | Extracts text overlays and layout   | Download Image                  | Translate to English            | ## 🔍 Extract & Analyze<br>OCR + Vision AI to extract text overlays and layout                              |
| Translate to English         | OpenAI GPT-4 (Langchain) | Translates extracted text to English | Extract Text & Layout (Gemini Vision) | Create Midjourney Prompt       | ## 🌐 Translate<br>Automatic translation to English                                                        |
| Create Midjourney Prompt     | Langchain Agent           | Generates Midjourney prompts         | Translate to English + Gemini Vision | Generate New Image (Midjourney) | ## 🎨 Generate New Images<br>AI-powered recreation with translated text                                    |
| Generate New Image (Midjourney) | HTTP Request           | Sends prompt to Midjourney API       | Create Midjourney Prompt        | Wait for Image Generation       |                                                                                                             |
| Wait for Image Generation    | Wait (Webhook resume)     | Waits for Midjourney image generation | Generate New Image (Midjourney) | Combine 3 Images              |                                                                                                             |
| Combine 3 Images             | Aggregate                 | Aggregates results of 3 images       | Wait for Image Generation       | Save to Review Sheet            | ## ✅ Review & Deliver<br>Organize results for client approval                                              |
| Save to Review Sheet         | Google Sheets             | Saves carousel data for review       | Combine 3 Images                | Send Review Notification        |                                                                                                             |
| Send Review Notification     | Gmail                     | Sends email with previews and links  | Save to Review Sheet            | None                          |                                                                                                             |
| Monitor Section              | Sticky Note               | Visual block label                   | None                           | None                          | ## 📱 TikTok Monitor<br>Daily check for new carousel posts                                                  |
| Analysis Section             | Sticky Note               | Visual block label                   | None                           | None                          | ## 🔍 Extract & Analyze<br>OCR + Vision AI to extract text overlays and layout                              |
| Translation Section          | Sticky Note               | Visual block label                   | None                           | None                          | ## 🌐 Translate<br>Automatic translation to English                                                        |
| Generation Section           | Sticky Note               | Visual block label                   | None                           | None                          | ## 🎨 Generate New Images<br>AI-powered recreation with translated text                                    |
| Delivery Section             | Sticky Note               | Visual block label                   | None                           | None                          | ## ✅ Review & Deliver<br>Organize results for client approval                                              |
| Setup Guide                 | Sticky Note               | Workflow description and instructions | None                           | None                          | ## 🎨 TikTok Carousel Replicator & Translator<br>An end-to-end automation system that monitors TikTok...    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node named "Daily TikTok Check"**  
   - Set to trigger once daily (default interval). This triggers the workflow.

2. **Add an HTTP Request node "Fetch TikTok RSS Feed"**  
   - Connect from "Daily TikTok Check".  
   - Set URL to `https://www.tiktok.com/@USERNAME/rss` (replace USERNAME).  
   - Set Response Format to "Text".

3. **Add a Move Binary Data node "Parse RSS Feed"**  
   - Connect from "Fetch TikTok RSS Feed".  
   - Set mode to "jsonToBinary" to convert the RSS XML response into JSON for easier parsing.

4. **Add an If node "Filter: Only 3-Image Posts"**  
   - Connect from "Parse RSS Feed".  
   - Create condition: `$json.imageCount` equals `3`.  
   - This filters posts to only those with exactly three images.

5. **Add a Split Out node "Split Images"**  
   - Connect from the true output of the If node.  
   - Set `fieldToSplitOut` to `images` to process each image individually.

6. **Add an HTTP Request node "Download Image"**  
   - Connect from "Split Images".  
   - Set URL to `{{$json.imageUrl}}` (dynamic field).  
   - Set Response Format to "File".

7. **Add a Google Gemini Vision node "Extract Text & Layout (Gemini Vision)"**  
   - Connect from "Download Image".  
   - Set operation to "analyze" on binary input (image).  
   - Provide a prompt requesting: text overlays, text position, style, image type, main elements, color scheme.  
   - Select model "gemini-2.5-flash".  
   - Authenticate with Google Palm API credentials.

8. **Add an OpenAI node "Translate to English"**  
   - Connect from "Extract Text & Layout (Gemini Vision)".  
   - Use GPT-4 model.  
   - Send prompt to translate the extracted text JSON to English.  
   - Authenticate with OpenAI API credentials.

9. **Add a Langchain Agent node "Create Midjourney Prompt"**  
   - Connect from "Translate to English".  
   - Use system message to instruct generation of a detailed Midjourney v6 prompt recreating the original layout, emotional tone, and including translated text overlays.  
   - Use outputs from Gemini Vision analysis and translated text in the prompt.

10. **Add an HTTP Request node "Generate New Image (Midjourney)"**  
    - Connect from "Create Midjourney Prompt".  
    - POST to `https://api.midjourney.com/v1/imagine`.  
    - Body JSON includes prompt and aspect ratio `9:16`.  
    - Use HTTP Header authentication with Midjourney API credentials.

11. **Add a Wait node "Wait for Image Generation"**  
    - Connect from "Generate New Image (Midjourney)".  
    - Configure webhook-based resume with a timeout of 5 minutes.  
    - Set up webhook endpoint to receive Midjourney generation callback.

12. **Add an Aggregate node "Combine 3 Images"**  
    - Connect from "Wait for Image Generation".  
    - Aggregate fields: `generatedImageUrl`, `originalImageUrl`, `translatedText`, `imageType` from the three images.

13. **Add a Google Sheets node "Save to Review Sheet"**  
    - Connect from "Combine 3 Images".  
    - Append row to a specified Google Sheet with columns for date, status, post URL, new images URLs, translated text, image types, and original images.  
    - Authenticate with Google Sheets OAuth2 credentials.  
    - Set sheet ID to your target sheet.

14. **Add a Gmail node "Send Review Notification"**  
    - Connect from "Save to Review Sheet".  
    - Compose an HTML email summarizing the new carousel with clickable image previews and link to the Google Sheets dashboard.  
    - Authenticate with Gmail OAuth2 credentials.

15. **Add Sticky Notes** to visually group the workflow blocks:  
    - "Monitor Section" near nodes 1-5.  
    - "Analysis Section" near nodes 6-7.  
    - "Translation Section" near node 8.  
    - "Generation Section" near nodes 9-11.  
    - "Delivery Section" near nodes 12-14.  
    - Add a large "Setup Guide" sticky note with workflow description and instructions.

16. **Configure credentials:**  
    - Google Palm API for Gemini Vision node.  
    - OpenAI API for translation and prompt generation nodes.  
    - Midjourney API credentials for image generation node.  
    - Google Sheets OAuth2 for review storage.  
    - Gmail OAuth2 for email notifications.

17. **Final testing:**  
    - Replace placeholders (TikTok username, Google Sheet ID, email addresses).  
    - Test with a single carousel post before enabling daily schedule trigger.

---

### 5. General Notes & Resources

| Note Content                                                                                                                          | Context or Link                                                                                                    |
|----------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| This workflow reduces 3+ hours of manual TikTok carousel translation and recreation work to approximately 2 minutes of review time.    | Workflow efficiency and time-saving potential.                                                                    |
| Alternative APIs: TikTok API can replace RSS feed; Canva API can replace Midjourney for image generation; Airtable can enhance review. | Scalability and integration options.                                                                               |
| Setup requires valid API credentials for Google Gemini Vision, Midjourney, OpenAI, Google Sheets, and Gmail OAuth2.                    | Credential and API preparation.                                                                                    |
| Workflow designed for TikTok carousel posts with exactly 3 images.                                                                     | Content type constraint and filtering logic.                                                                       |
| Review dashboard link placeholder: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID                                                 | Update with actual Google Sheet ID for review.                                                                     |

---

**Disclaimer:** The provided text originates exclusively from an automation workflow created with n8n, adhering strictly to current content policies without illegal, offensive, or protected elements. All processed data is legal and public.