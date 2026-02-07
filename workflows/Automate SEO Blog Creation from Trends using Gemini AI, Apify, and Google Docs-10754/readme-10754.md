Automate SEO Blog Creation from Trends using Gemini AI, Apify, and Google Docs

https://n8nworkflows.xyz/workflows/automate-seo-blog-creation-from-trends-using-gemini-ai--apify--and-google-docs-10754


# Automate SEO Blog Creation from Trends using Gemini AI, Apify, and Google Docs

### 1. Workflow Overview

This workflow automates the creation of SEO-optimized blog posts based on current trending topics in India. It uses Google Trends data fetched via Apify, generates comprehensive SEO blog content with LangChain agent enhanced by Google Gemini AI refinement, creates a blog image via KIE AI, and formats the output for publishing in Google Docs. The workflow is designed for digital marketers, SEO specialists, and content creators aiming to produce timely, high-quality blog content with minimal manual effort.

The workflow’s logic is divided into the following functional blocks:  
- **1.1 Scheduled Trigger & Trend Fetching:** Periodic trigger initiates the workflow, which fetches top trending search topics.  
- **1.2 SEO Blog Content Generation:** Generates a fully SEO-optimized blog post from the trending keywords using AI models.  
- **1.3 Blog Content Refinement:** Optional refinement of content with Google Gemini AI for enhanced quality and tone.  
- **1.4 Blog Image Generation & Polling:** Creates a blog image leveraging KIE AI and polls for completion status.  
- **1.5 Formatting & Publishing:** Converts AI output and image into Google Docs batch requests and updates the target Google Doc.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Trend Fetching

- **Overview:**  
This block triggers the workflow daily at 8 AM and fetches the latest trending search data for India from Google Trends using the Apify API.

- **Nodes Involved:**  
  - Daily Trigger 8AM  
  - Fetch Google Trends

- **Node Details:**  

  - **Daily Trigger 8AM**  
    - *Type:* Schedule Trigger  
    - *Role:* Initiates the workflow every day at 8 AM.  
    - *Configuration:* Set to trigger at hour 8 daily.  
    - *Inputs:* None  
    - *Outputs:* Connects to Fetch Google Trends  
    - *Failure Modes:* Misconfiguration of schedule, or n8n scheduling service issues.

  - **Fetch Google Trends**  
    - *Type:* HTTP Request  
    - *Role:* Calls Apify’s Google Trends Fast Scraper API to obtain trending searches in India for the past 24 hours.  
    - *Configuration:* POST request with JSON body specifying trending search parameters (country: IN, timeframe: 24h), uses Apify proxy.  
    - *Key Expressions:* API token placeholder `<YOUR-TOKEN>` must be replaced with a valid token.  
    - *Inputs:* From Daily Trigger 8AM  
    - *Outputs:* Passes trending searches JSON to Generate SEO Blog Content  
    - *Failure Modes:* API token invalid or missing, network issues, API rate limits, malformed JSON body.

- **Sticky Note:**  
  - "🚀 Fetch Google Trends: Fetches India’s top trending searches in the last 24h via Apify API."

---

#### 2.2 SEO Blog Content Generation

- **Overview:**  
Generates a detailed and SEO-optimized blog post based on the trending topics provided by the previous node.

- **Nodes Involved:**  
  - Generate SEO Blog Content  
  - Refine Content with Gemini AI (optional content enhancement)  
  - Parse Blog Output

- **Node Details:**  

  - **Generate SEO Blog Content**  
    - *Type:* LangChain Agent  
    - *Role:* Produces a blog post including title, meta description, and long-form content based on trending search terms.  
    - *Configuration:* Prompt dynamically includes trending terms, volumes, and related terms; system message instructs generation of SEO-optimized, human-like content with headings, lists, and call-to-action.  
    - *Key Expressions:* Uses expressions to extract first trending search term and related data from input JSON.  
    - *Inputs:* From Fetch Google Trends or Refine Content with Gemini AI  
    - *Outputs:* Blog content JSON to Format output for Google Docs and Generate Blog Image  
    - *Failure Modes:* AI service unavailability, malformed input JSON, prompt errors, rate limitations.

  - **Refine Content with Gemini AI**  
    - *Type:* Google Gemini AI Chat Node  
    - *Role:* Optionally refines or improves the AI-generated blog content for tone, style, or clarity.  
    - *Configuration:* Uses Google PaLM API credentials; no additional parameters specified.  
    - *Inputs:* AI output parser data from Generate SEO Blog Content  
    - *Outputs:* Refined content passed back to Generate SEO Blog Content for final generation.  
    - *Failure Modes:* API authentication errors, request timeouts, quota limits.

  - **Parse Blog Output**  
    - *Type:* LangChain Structured Output Parser  
    - *Role:* Parses AI blog output into a structured JSON object with title, meta description, and content fields.  
    - *Configuration:* Uses JSON schema example defining expected keys.  
    - *Inputs:* AI raw output from Generate SEO Blog Content  
    - *Outputs:* Structured blog data for formatting  
    - *Failure Modes:* Parsing errors if AI output deviates from schema, malformed JSON.

- **Sticky Note:**  
  - "📝 Generate SEO Blog Content: Generates a fully SEO-optimized, human-like blog post from trending topics; includes title, meta description, and structured content."  

---

#### 2.3 Blog Content Refinement (Optional/Linked)

- **Overview:**  
This node (Refine Content with Gemini AI) is an optional enhancement step that improves the initially generated blog content using Google Gemini AI.

- **Node Involved:**  
  - Refine Content with Gemini AI (already described above)

- **Sticky Note:**  
  - No separate sticky note, covered under SEO Blog Content Generation block.

---

#### 2.4 Blog Image Generation & Polling

- **Overview:**  
Generates a blog image using KIE AI based on the blog title and polls the API until the image is ready for download.

- **Nodes Involved:**  
  - Generate Blog Image  
  - Check Image Generation Status  
  - Is Image Ready? (If condition)  
  - Wait 5 Second Before Recheck  
  - Prepare Image URL for Insert  
  - Download Image

- **Node Details:**  

  - **Generate Blog Image**  
    - *Type:* HTTP Request  
    - *Role:* Initiates an image generation task on KIE AI with prompt set to blog title, requesting a 16:9 PNG.  
    - *Configuration:* POST JSON body includes model name, prompt from blog title, output format, and image size. Authorization header requires a bearer token `<YOUR-API-TOKEN>`.  
    - *Inputs:* From Generate SEO Blog Content output  
    - *Outputs:* Task ID for polling  
    - *Failure Modes:* API token missing or invalid, network errors, API limits.

  - **Check Image Generation Status**  
    - *Type:* HTTP Request  
    - *Role:* Polls KIE AI job status using taskId, checking if image generation is complete.  
    - *Configuration:* GET request with query param `taskId` from previous response, includes Authorization header.  
    - *Inputs:* From Generate Blog Image and Wait 5 Second Before Recheck  
    - *Outputs:* Status JSON to Is Image Ready?  
    - *Failure Modes:* Network errors, invalid taskId, API rate limiting.

  - **Is Image Ready?**  
    - *Type:* If node  
    - *Role:* Checks if the image generation result JSON is empty (image not ready) or filled (ready).  
    - *Configuration:* Condition tests if `data.resultJson` is empty string (not ready).  
    - *Inputs:* From Check Image Generation Status  
    - *Outputs:*  
      - If empty (false branch): loops back to Wait 5 Second Before Recheck (polling)  
      - If not empty (true branch): proceeds to Prepare Image URL for Insert  
    - *Failure Modes:* Logic errors if response format changes.

  - **Wait 5 Second Before Recheck**  
    - *Type:* Wait  
    - *Role:* Pauses workflow for 5 seconds before re-polling image status.  
    - *Inputs:* From Is Image Ready? (not ready branch)  
    - *Outputs:* Loops back to Check Image Generation Status  
    - *Failure Modes:* None significant; delay may be adjusted if needed.

  - **Prepare Image URL for Insert**  
    - *Type:* Set  
    - *Role:* Extracts and formats the blog image URL from the image generation result JSON for insertion later.  
    - *Configuration:* Sets JSON output to `data.resultJson` from previous node.  
    - *Inputs:* From Is Image Ready? (ready branch)  
    - *Outputs:* Passes URL to Download Image  
    - *Failure Modes:* Missing or malformed URL in result JSON.

  - **Download Image**  
    - *Type:* HTTP Request  
    - *Role:* Downloads the generated image using the prepared URL, preparing it for insertion into Google Docs.  
    - *Configuration:* GET request to the image URL.  
    - *Inputs:* From Prepare Image URL for Insert  
    - *Outputs:* Passes binary image data to Format output for Google Docs  
    - *Failure Modes:* Broken or expired image URL, network errors.

- **Sticky Notes:**  
  - "🖼️ Generate Blog Image: Creates a blog post image using KIE AI based on the blog title in 16:9 PNG format."  
  - "⏳ Check Image Generation Status: Polls KIE AI to see if the blog image task is complete before downloading."  
  - "✅ Is Image Ready?: Checks if the generated blog image is complete; routes workflow based on readiness."  
  - "⏱️ Wait 5 Seconds Before Recheck: Pauses workflow briefly before checking the blog image status again."  
  - "🔗 Prepare Image URL for Insert: Extracts the generated blog image URL to use in the Google Docs insertion step."  
  - "⬇️ Download Image: Downloads the generated blog image from the URL for insertion into Google Docs."

---

#### 2.5 Formatting & Publishing

- **Overview:**  
Transforms the AI-generated blog content and image into Google Docs batchUpdate requests with proper formatting and sends the update to the Google Docs API.

- **Nodes Involved:**  
  - Format output for Google Docs  
  - Update Google Doc

- **Node Details:**  

  - **Format output for Google Docs**  
    - *Type:* Code (JavaScript)  
    - *Role:* Converts blog content markdown and image URL into a series of Google Docs API requests, including:  
      - Inserting the image inline with size constraints  
      - Adding the blog title as Heading 1  
      - Parsing markdown headings (H2, H3, H4) and paragraphs to apply correct paragraph styles  
      - Removing duplicate markdown titles  
    - *Configuration:* Uses input JSON with blog content and image URLs; constructs `requests` array for batchUpdate.  
    - *Inputs:* Receives blog content JSON and image data from Download Image node  
    - *Outputs:* JSON object with Google Docs API request array  
    - *Failure Modes:* Errors in markdown parsing, invalid or missing image URL, Google Docs API request formatting errors.

  - **Update Google Doc**  
    - *Type:* HTTP Request  
    - *Role:* Sends the batchUpdate request to Google Docs API to update the target document with new blog content and image.  
    - *Configuration:* POST request to Google Docs API endpoint for batchUpdate on a specific document ID (hardcoded in URL), uses OAuth2 credentials. Body parameter includes the `requests` array from previous node.  
    - *Inputs:* From Format output for Google Docs  
    - *Outputs:* Finalizes workflow  
    - *Failure Modes:* OAuth token expiration, insufficient permissions, document ID invalid, API quota exceeded.

- **Sticky Notes:**  
  - "📄 Format Output for Google Docs: Converts AI-generated blog content and images into Google Docs requests with proper headings and formatting."  
  - "📝 Update Google Doc: Sends formatted blog content and images to Google Docs using batchUpdate API."

---

### 3. Summary Table

| Node Name                   | Node Type                                   | Functional Role                                                | Input Node(s)                   | Output Node(s)                   | Sticky Note                                                                                         |
|-----------------------------|---------------------------------------------|----------------------------------------------------------------|--------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------|
| Daily Trigger 8AM            | Schedule Trigger                            | Starts workflow daily at 8 AM                                  | None                           | Fetch Google Trends              | 🚀 Fetch Google Trends: Fetches India’s top trending searches in the last 24h via Apify API       |
| Fetch Google Trends          | HTTP Request                               | Fetches trending searches from Apify API                      | Daily Trigger 8AM              | Generate SEO Blog Content        | 🚀 Fetch Google Trends: Fetches India’s top trending searches in the last 24h via Apify API       |
| Generate SEO Blog Content    | LangChain Agent                            | Generates SEO blog content from trending topics               | Fetch Google Trends, Refine Content with Gemini AI | Format output for Google Docs, Generate Blog Image | 📝 Generate SEO Blog Content: Generates a fully SEO-optimized, human-like blog post from trending topics; includes title, meta description, and structured content. |
| Refine Content with Gemini AI| Google Gemini AI Chat                      | Refines AI-generated blog content for improved quality        | Generate SEO Blog Content (ai_outputParser) | Generate SEO Blog Content       |                                                                                                   |
| Parse Blog Output            | LangChain Output Parser Structured         | Parses AI output into structured JSON (title, meta, content)  | Generate SEO Blog Content      | Generate SEO Blog Content        |                                                                                                   |
| Format output for Google Docs| Code (JavaScript)                          | Formats blog content and image into Google Docs API requests  | Download Image                 | Update Google Doc                | 📄 Format Output for Google Docs: Converts AI-generated blog content and images into Google Docs requests with proper headings and formatting. |
| Update Google Doc            | HTTP Request                              | Updates Google Doc with formatted blog content and image      | Format output for Google Docs  | None                           | 📝 Update Google Doc: Sends formatted blog content and images to Google Docs using batchUpdate API.|
| Generate Blog Image          | HTTP Request                              | Initiates blog image generation on KIE AI                      | Generate SEO Blog Content      | Check Image Generation Status    | 🖼️ Generate Blog Image: Creates a blog post image using KIE AI based on the blog title in 16:9 PNG format. |
| Check Image Generation Status| HTTP Request                              | Polls KIE AI for image generation status                       | Generate Blog Image, Wait 5 Second Before Recheck | Is Image Ready?              | ⏳ Check Image Generation Status: Polls KIE AI to see if the blog image task is complete before downloading. |
| Is Image Ready?              | If Node                                   | Checks if image is ready, routes workflow accordingly          | Check Image Generation Status  | Wait 5 Second Before Recheck, Prepare Image URL for Insert | ✅ Is Image Ready?: Checks if the generated blog image is complete; routes workflow based on readiness. |
| Wait 5 Second Before Recheck | Wait                                      | Waits 5 seconds before rechecking image status                 | Is Image Ready? (not ready)    | Check Image Generation Status    | ⏱️ Wait 5 Seconds Before Recheck: Pauses workflow briefly before checking the blog image status again. |
| Prepare Image URL for Insert | Set                                       | Extracts generated image URL for insertion                     | Is Image Ready? (ready)        | Download Image                  | 🔗 Prepare Image URL for Insert: Extracts the generated blog image URL to use in the Google Docs insertion step. |
| Download Image              | HTTP Request                               | Downloads blog image for Google Docs insertion                 | Prepare Image URL for Insert   | Format output for Google Docs    | ⬇️ Download Image: Downloads the generated blog image from the URL for insertion into Google Docs. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Parameters: Trigger every day at 8:00 AM  
   - Connect its output to the Google Trends fetch node.

2. **Create an HTTP Request node to fetch Google Trends**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.apify.com/v2/acts/data_xplorer~google-trends-fast-scraper/run-sync-get-dataset-items?token=<YOUR-TOKEN>` (replace `<YOUR-TOKEN>` with your Apify API token)  
   - Body: JSON with parameters to enable trending searches for India in last 24 hours, using Apify proxy.  
   - Connect output to the Generate SEO Blog Content node.

3. **Create a LangChain Agent node for SEO Blog Content**  
   - Type: LangChain Agent  
   - Input: Use expressions to pass trending topic term, volume, and related terms from previous node JSON.  
   - System message: Instruct the AI to write an SEO-optimized blog post including title (<70 chars), meta description (<160 chars), long-form content (600-1200 words), headings, lists, and call-to-action; avoid AI-like phrasing or keyword stuffing.  
   - Connect output to two downstream nodes:  
     - Format output for Google Docs  
     - Generate Blog Image

4. **Create a Google Gemini AI Chat node (optional refinement)**  
   - Type: Google Gemini AI Chat  
   - Credentials: Configure with Google PaLM API credentials  
   - Connect its output back to the Generate SEO Blog Content node’s ai_languageModel input for refinement.

5. **Create a LangChain Output Parser node**  
   - Type: LangChain Output Parser Structured  
   - JSON schema example: Expect keys `title`, `meta_description`, `content`  
   - Connect input from Generate SEO Blog Content’s ai_outputParser output.

6. **Create HTTP Request node to generate blog image (KIE AI)**  
   - Method: POST  
   - URL: `https://api.kie.ai/api/v1/jobs/createTask`  
   - Headers: Authorization Bearer token `<YOUR-API-TOKEN>` (replace with your KIE AI token)  
   - Body: JSON containing model `google/nano-banana`, prompt set to blog title, output format PNG, size 16:9.  
   - Connect output to Check Image Generation Status.

7. **Create HTTP Request node to check image status**  
   - Method: GET  
   - URL: `https://api.kie.ai/api/v1/jobs/recordInfo`  
   - Query parameter: `taskId` from previous node JSON  
   - Headers: Authorization Bearer token (same as above)  
   - Connect output to If node “Is Image Ready?”

8. **Create If node “Is Image Ready?”**  
   - Condition: Check if `data.resultJson` is empty string  
   - True branch (image ready): Connect to Prepare Image URL for Insert node.  
   - False branch (image not ready): Connect to Wait node.

9. **Create Wait node “Wait 5 Second Before Recheck”**  
   - Duration: 5 seconds  
   - Connect output back to Check Image Generation Status (polling loop).

10. **Create Set node “Prepare Image URL for Insert”**  
    - Mode: Raw JSON output  
    - Set JSON to `={{ $json.data.resultJson }}` to extract image URL  
    - Connect output to Download Image node.

11. **Create HTTP Request node “Download Image”**  
    - Method: GET  
    - URL: `={{ $json.resultUrls[0] }}` (image URL from previous node)  
    - Connect output to Format output for Google Docs node.

12. **Create Code node “Format output for Google Docs”**  
    - JavaScript code processes blog content and image URL into Google Docs API batchUpdate requests:  
      - Inserts image inline (height 200pt)  
      - Inserts blog title as Heading 1  
      - Parses markdown headings (H2, H3, H4) for formatting  
      - Inserts paragraphs  
    - Connect output to Update Google Doc node.

13. **Create HTTP Request node “Update Google Doc”**  
    - Method: POST  
    - URL: `https://docs.googleapis.com/v1/documents/<DOCUMENT_ID>:batchUpdate` (replace `<DOCUMENT_ID>` with your Google Doc ID)  
    - Authentication: OAuth2, Google Docs credentials  
    - Body: JSON parameter “requests” from previous node output  
    - Final node in workflow.

14. **Configure Credentials**  
    - Apify API token in Fetch Google Trends node  
    - Google PaLM API credentials in Google Gemini node  
    - KIE AI API token in Generate Blog Image and Check Status nodes  
    - Google Docs OAuth2 credentials in Update Google Doc node

15. **Connect all nodes as per the above flow.**  
    - Daily Trigger → Fetch Google Trends → Generate SEO Blog Content  
    - Generate SEO Blog Content → (optional) Refine Content with Gemini AI → Generate SEO Blog Content  
    - Generate SEO Blog Content → Format output for Google Docs; Generate Blog Image  
    - Generate Blog Image → Check Image Generation Status → Is Image Ready?  
    - Is Image Ready? (No) → Wait 5 Second Before Recheck → Check Image Generation Status  
    - Is Image Ready? (Yes) → Prepare Image URL for Insert → Download Image → Format output for Google Docs → Update Google Doc

---

### 5. General Notes & Resources

| Note Content                                                                                                               | Context or Link                                   |
|----------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| The workflow leverages advanced AI models including LangChain and Google Gemini for SEO content creation and refinement.     | Workflow AI integration details                   |
| Requires valid API tokens for Apify, KIE AI, and Google PaLM APIs; Google Docs OAuth2 credentials must have editing rights.  | Credential setup instructions                      |
| Blog image generation is performed asynchronously with polling to handle latency in image creation.                         | KIE AI image generation API documentation         |
| Google Docs batchUpdate API is used for granular insertion and formatting of text and images.                               | https://developers.google.com/docs/api/reference/rest/v1/documents/batchUpdate |
| Markdown parsing logic in the Code node supports headings H2-H4, paragraphs, and removes duplicate titles.                  | Custom JavaScript formatting logic                 |

---

**Disclaimer:** The provided text is derived exclusively from an automated n8n workflow and adheres strictly to content policies. It contains no illegal or protected elements. All data processed is public and lawful.