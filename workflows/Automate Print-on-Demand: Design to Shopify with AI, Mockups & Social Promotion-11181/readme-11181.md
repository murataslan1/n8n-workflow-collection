Automate Print-on-Demand: Design to Shopify with AI, Mockups & Social Promotion

https://n8nworkflows.xyz/workflows/automate-print-on-demand--design-to-shopify-with-ai--mockups---social-promotion-11181


# Automate Print-on-Demand: Design to Shopify with AI, Mockups & Social Promotion

### 1. Workflow Overview

This workflow automates the end-to-end process of creating and publishing print-on-demand merchandise to a Shopify store, leveraging AI, image processing, and social media promotion. It is designed primarily for e-commerce store owners, print-on-demand businesses, and artists who want to streamline product creation from design files through AI analysis, mockup generation, and multi-channel publishing.

The workflow is logically divided into five main blocks:

- **1.1 Ingest & Configuration:** Watches a Google Drive folder for new design files and sets up global configuration variables.
- **1.2 Analyze & Process:** Uses OpenAI Vision to analyze the design image, removes the background using Remove.bg, and uploads the cleaned asset to Cloudinary.
- **1.3 Mockup Generation & Copywriting:** Creates realistic product mockups via Cloudinary transformations and generates SEO-friendly product titles and descriptions with OpenAI.
- **1.4 Human Approval:** Sends a Slack message with product details and mockups for human review and approval, then waits for a response.
- **1.5 Publish & Promote:** Upon approval, publishes the product draft on Shopify and promotes it on Instagram and Pinterest; if rejected, notifies via Slack.

---

### 2. Block-by-Block Analysis

#### 1.1 Ingest & Configuration

**Overview:**  
This block triggers the workflow when a new design file is uploaded to a specific Google Drive folder and sets all necessary configuration parameters for further processing.

**Nodes Involved:**  
- Google Drive Trigger - Design Upload1  
- Workflow Configuration1  

**Node Details:**

- **Google Drive Trigger - Design Upload1**  
  - Type: Google Drive Trigger  
  - Role: Monitors a specified Google Drive folder for new files (any file type).  
  - Config: Polls every minute; triggers on file creation in the configured folder.  
  - Input: None (trigger node)  
  - Output: Newly uploaded file metadata and binary data.  
  - Edge Cases: Folder ID misconfiguration, API rate limits, network issues.  
  - Credentials: Google Drive account with proper access.  

- **Workflow Configuration1**  
  - Type: Set node  
  - Role: Defines global variables for API keys, Cloudinary IDs, Slack channel ID, and social media credentials.  
  - Config: Stores values like Cloudinary cloud name, API keys, product base image public IDs, Slack channel ID, Instagram Business account ID and token, Pinterest access token and board ID.  
  - Input: Trigger output from Google Drive Trigger  
  - Output: Passes configuration data downstream as JSON.  
  - Edge Cases: Missing or incorrect API keys, invalid Cloudinary IDs.

---

#### 1.2 Analyze & Process

**Overview:**  
Analyzes the uploaded design image with AI to extract metadata and keywords, removes the background, and uploads the cleaned image to Cloudinary for further use.

**Nodes Involved:**  
- OpenAI Vision - Design Analysis1  
- Remove.bg - Background Removal1  
- Cloudinary - Upload Design1  

**Node Details:**

- **OpenAI Vision - Design Analysis1**  
  - Type: OpenAI Vision node (Langchain integration)  
  - Role: Performs AI-based image analysis to extract design subject, mood, copyright risk, recommended products, keywords, and color palette.  
  - Config: Uses GPT-4o model, input is base64 image data from the Google Drive file.  
  - Key Expression: Analyzes image and returns strictly valid JSON with specific fields.  
  - Input: Image binary converted to base64.  
  - Output: JSON analysis results.  
  - Edge Cases: API limits, invalid image format, JSON parsing errors.  
  - Credentials: OpenAI API key with GPT-4o access.

- **Remove.bg - Background Removal1**  
  - Type: HTTP Request  
  - Role: Sends the design image to Remove.bg API to remove the background automatically.  
  - Config: Multipart form data with base64 image; uses API key in header.  
  - Input: Image binary data from previous node.  
  - Output: Image file binary with background removed.  
  - Edge Cases: API key invalid, request timeouts, file size limits.  
  - Credentials: Remove.bg API key.

- **Cloudinary - Upload Design1**  
  - Type: HTTP Request  
  - Role: Uploads the background-removed design image to Cloudinary cloud storage.  
  - Config: Uses multipart form data with base64 image data, API key, timestamp, and signature for authentication.  
  - Input: Processed image binary from Remove.bg node.  
  - Output: JSON response including public_id of uploaded image.  
  - Edge Cases: Authentication failure, upload errors, signature calculation issues.  
  - Credentials: Cloudinary API key and secret.

---

#### 1.3 Mockup Generation & Copywriting

**Overview:**  
Generates product mockup image URLs by overlaying the uploaded design onto base product images using Cloudinary transformations, and generates SEO-friendly product titles and descriptions via OpenAI.

**Nodes Involved:**  
- Code - Generate Mockup URLs1  
- OpenAI - SEO Copywriting1  
- Shopify - Create Draft Product1  

**Node Details:**

- **Code - Generate Mockup URLs1**  
  - Type: Code (JavaScript) node  
  - Role: Constructs Cloudinary URLs for mockups by overlaying design on white/black t-shirts and tote bags; chooses primary mockup based on AI analysis results (recommended products and color palette).  
  - Config: Uses configuration variables and outputs mockup URLs and analysis data.  
  - Input: Cloudinary upload response and AI analysis JSON.  
  - Output: JSON object with mockup URLs, primary mockup URL, design public ID, analysis data.  
  - Edge Cases: Missing base product IDs, malformed URLs, empty analysis results.

- **OpenAI - SEO Copywriting1**  
  - Type: OpenAI (Langchain) node  
  - Role: Generates product title, description, price, and SEO tags based on mockup and analysis data.  
  - Config: Message operation, likely with prompt templates (not visible in JSON).  
  - Input: Data from mockup generation node.  
  - Output: JSON with SEO text content and metadata.  
  - Edge Cases: API limits, output formatting issues.  
  - Credentials: OpenAI API key.

- **Shopify - Create Draft Product1**  
  - Type: Shopify node  
  - Role: Creates a draft product in Shopify using OpenAI-generated title, description, tags, and mockup image URL.  
  - Config: Sets vendor to "Visual Remix Engine", product type to "Apparel", and leaves `published_at` empty to keep draft status.  
  - Input: SEO copywriting JSON and primary mockup URL.  
  - Output: Shopify product JSON with product ID.  
  - Edge Cases: API authentication errors, invalid product data, Shopify API limits.  
  - Credentials: Shopify store credentials.

---

#### 1.4 Human Approval

**Overview:**  
Sends a Slack message with the draft product details and mockup for human review. Then waits for an approval or rejection action via Slack interactive buttons.

**Nodes Involved:**  
- Slack - Approval Request1  
- Wait - For Approval1  
- Switch - Approval Decision1  
- Slack - Rejection Notice1  

**Node Details:**

- **Slack - Approval Request1**  
  - Type: Slack node (message with interactive buttons)  
  - Role: Posts a formatted message to a Slack channel including AI analysis, product title, price, and mockup image, requesting approval to publish.  
  - Config: Uses Slack channel ID from configuration, message contains dynamic fields from previous nodes.  
  - Input: Shopify draft product info and mockup/analysis data.  
  - Output: Slack message with interactive buttons for approve/reject.  
  - Edge Cases: Slack API rate limits, invalid channel ID, user not responding.  
  - Credentials: Slack OAuth credentials.

- **Wait - For Approval1**  
  - Type: Wait node with webhook resume  
  - Role: Pauses workflow execution until a webhook is triggered by Slack button click (approval or rejection).  
  - Config: Waits for webhook with response message "Approval received".  
  - Input: Slack message response webhook.  
  - Output: JSON payload from Slack interactive message action.  
  - Edge Cases: Timeout if no response, webhook misconfiguration.

- **Switch - Approval Decision1**  
  - Type: Switch node  
  - Role: Routes workflow based on Slack button clicked: "approve" or "reject".  
  - Config: Checks if Slack action value is "approve" or "reject".  
  - Input: JSON from Wait node.  
  - Output: Branches to publish or rejection paths.  
  - Edge Cases: Unexpected Slack response values.

- **Slack - Rejection Notice1**  
  - Type: Slack node  
  - Role: Sends a notification message to Slack channel if the design is rejected.  
  - Config: Posts rejection notice with product title.  
  - Input: Switch node on rejection branch.  
  - Output: Slack message confirmation.  
  - Edge Cases: Slack API failures.

---

#### 1.5 Publish & Promote

**Overview:**  
If approved, publishes the draft product on Shopify by setting it active, then posts promotional content to Instagram and Pinterest using the generated mockup and SEO copy.

**Nodes Involved:**  
- Shopify - Publish Product1  
- Instagram - Post Product1  
- Pinterest - Create Pin1  

**Node Details:**

- **Shopify - Publish Product1**  
  - Type: Shopify node  
  - Role: Updates the draft product by setting the `published_at` timestamp, making it live on the store.  
  - Config: Uses product ID from draft creation node; sets current date/time as publish date.  
  - Input: Approval branch from Switch node.  
  - Output: Updated product JSON.  
  - Edge Cases: Shopify API errors, invalid product ID.

- **Instagram - Post Product1**  
  - Type: HTTP Request node  
  - Role: Creates a media post on Instagram Business account with product mockup image and caption containing truncated description and hashtags.  
  - Config: Sends POST request with image URL, caption, and access token.  
  - Input: Published product info and mockup URL.  
  - Output: Instagram API response.  
  - Edge Cases: Token expiration, API limits, invalid Instagram Business ID.  
  - Credentials: Instagram Business access token.

- **Pinterest - Create Pin1**  
  - Type: HTTP Request node  
  - Role: Creates a new Pin on a specified Pinterest board with the product mockup, title, description, and a link to the Shopify product.  
  - Config: Sends JSON body with board ID, image URL, title, description, and product link; uses Bearer token in header.  
  - Input: Published product info and mockup URL.  
  - Output: Pinterest API response.  
  - Edge Cases: Invalid access token, API errors, incorrect board ID.  
  - Credentials: Pinterest API access token.

---

### 3. Summary Table

| Node Name                      | Node Type                      | Functional Role                                      | Input Node(s)                   | Output Node(s)                         | Sticky Note                                                                                                                           |
|--------------------------------|--------------------------------|-----------------------------------------------------|---------------------------------|---------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Template Description            | Sticky Note                   | Overview and instructions for the workflow          | None                            | None                                  | # Create and publish merchandise from designs to Shopify... Setup details and requirements.                                           |
| Step 1                         | Sticky Note                   | Block 1: Ingest & Config                             | None                            | None                                  | 1. Ingest & Config: Get file from Drive and set global variables.                                                                     |
| Step 2                         | Sticky Note                   | Block 2: Analyze & Process                           | None                            | None                                  | 2. Analyze & Process: Analyze image with AI, remove background, upload to Cloudinary.                                                  |
| Step 3                         | Sticky Note                   | Block 3: Mockup & Copywriting                        | None                            | None                                  | 3. Mockup & Copywriting: Generate mockups via Cloudinary and SEO text via OpenAI.                                                     |
| Step 4                         | Sticky Note                   | Block 4: Human Approval                              | None                            | None                                  | 4. Human Approval: Send draft to Slack. Wait for button click.                                                                         |
| Step 5                         | Sticky Note                   | Block 5: Publish & Promote                           | None                            | None                                  | 5. Publish & Promote: Set product to active. Post to Social Media.                                                                     |
| Google Drive Trigger - Design Upload1 | Google Drive Trigger          | Watches Google Drive folder for new design files     | None                            | Workflow Configuration1               |                                                                                                                                         |
| Workflow Configuration1        | Set                          | Stores API keys and IDs for external services       | Google Drive Trigger - Design Upload1 | OpenAI Vision - Design Analysis1       |                                                                                                                                         |
| OpenAI Vision - Design Analysis1 | OpenAI Vision                | Analyzes design image to extract metadata and keywords | Workflow Configuration1          | Remove.bg - Background Removal1        |                                                                                                                                         |
| Remove.bg - Background Removal1 | HTTP Request                 | Removes background from design images                | OpenAI Vision - Design Analysis1 | Cloudinary - Upload Design1            |                                                                                                                                         |
| Cloudinary - Upload Design1    | HTTP Request                 | Uploads cleaned design image to Cloudinary           | Remove.bg - Background Removal1  | Code - Generate Mockup URLs1           |                                                                                                                                         |
| Code - Generate Mockup URLs1   | Code (JavaScript)             | Generates Cloudinary URLs for product mockups        | Cloudinary - Upload Design1       | OpenAI - SEO Copywriting1              |                                                                                                                                         |
| OpenAI - SEO Copywriting1      | OpenAI                       | Generates SEO-friendly product titles and descriptions | Code - Generate Mockup URLs1      | Shopify - Create Draft Product1        |                                                                                                                                         |
| Shopify - Create Draft Product1 | Shopify                      | Creates draft product in Shopify                      | OpenAI - SEO Copywriting1         | Slack - Approval Request1              |                                                                                                                                         |
| Slack - Approval Request1      | Slack                        | Sends product draft and mockups to Slack for approval | Shopify - Create Draft Product1  | Wait - For Approval1                   |                                                                                                                                         |
| Wait - For Approval1           | Wait                         | Waits for Slack button click to resume workflow      | Slack - Approval Request1         | Switch - Approval Decision1            |                                                                                                                                         |
| Switch - Approval Decision1    | Switch                       | Routes workflow based on approval or rejection       | Wait - For Approval1              | Shopify - Publish Product1, Slack - Rejection Notice1 |                                                                                                                                         |
| Slack - Rejection Notice1      | Slack                        | Sends rejection notification to Slack channel        | Switch - Approval Decision1       | None                                  |                                                                                                                                         |
| Shopify - Publish Product1     | Shopify                      | Publishes draft product to Shopify                    | Switch - Approval Decision1       | Instagram - Post Product1              |                                                                                                                                         |
| Instagram - Post Product1      | HTTP Request                 | Posts product mockup and description to Instagram    | Shopify - Publish Product1        | Pinterest - Create Pin1                |                                                                                                                                         |
| Pinterest - Create Pin1        | HTTP Request                 | Creates a new Pin on Pinterest board for product     | Instagram - Post Product1         | None                                  |                                                                                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n and name it appropriately.

2. **Add a Google Drive Trigger node**:  
   - Name: `Google Drive Trigger - Design Upload1`  
   - Event: `fileCreated`  
   - File Type: `all`  
   - Poll every minute  
   - Trigger on a specific folder: Set your Google Drive folder ID for design uploads.  
   - Connect your Google Drive credentials.

3. **Add a Set node**:  
   - Name: `Workflow Configuration1`  
   - Define the following string variables with your actual API keys and IDs:  
     - Cloudinary: `cloudinaryCloudName`, `cloudinaryApiKey`, `cloudinaryApiSecret`  
     - Remove.bg: `removeBgApiKey`  
     - Base product image public IDs on Cloudinary: `tshirtWhitePublicId`, `tshirtBlackPublicId`, `toteBagPublicId`  
     - Slack: `slackChannelId`  
     - Instagram: `instagramBusinessAccountId`, `instagramAccessToken`  
     - Pinterest: `pinterestAccessToken`, `pinterestBoardId`  
   - Connect Google Drive Trigger output to this Set node.

4. **Add OpenAI Vision node (Langchain OpenAI)**:  
   - Name: `OpenAI Vision - Design Analysis1`  
   - Operation: `analyze`  
   - Resource: `image`  
   - Input Type: `base64`  
   - Model: `gpt-4o` or equivalent capable of vision analysis  
   - Text prompt: Request JSON output with fields: subject, mood, copyrightRisk, recommendedProducts, keywords, colorPalette.  
   - Input: Base64 image data from Google Drive Trigger or configuration node.  
   - Connect Workflow Configuration1 to this node.

5. **Add HTTP Request node for Remove.bg**:  
   - Name: `Remove.bg - Background Removal1`  
   - Method: `POST`  
   - URL: `https://api.remove.bg/v1.0/removebg`  
   - Authentication: Custom header with your Remove.bg API key (`X-Api-Key`)  
   - Body Type: `multipart/form-data`  
   - Include `image_file_b64` parameter with base64 image data from previous node.  
   - Set response to file download (for image).  
   - Connect OpenAI Vision node output to this node.

6. **Add HTTP Request node for Cloudinary upload**:  
   - Name: `Cloudinary - Upload Design1`  
   - Method: `POST`  
   - URL: `https://api.cloudinary.com/v1_1/{cloud_name}/image/upload` (replace `{cloud_name}` with config variable)  
   - Body: multipart/form-data with `file` (base64 image), `api_key`, `timestamp`, and `signature` (signature generation logic needs external or manual computation if required).  
   - Connect Remove.bg output to this node.

7. **Add Code node to generate mockup URLs**:  
   - Name: `Code - Generate Mockup URLs1`  
   - JavaScript: Use configuration variables and Cloudinary upload response to build URLs for white/black T-shirts and tote bag mockups by layering design images.  
   - Determine primary mockup based on AI analysis (recommended products and color palette).  
   - Output includes mockups object, primary mockup URL, and analysis data.  
   - Connect Cloudinary upload node to this node.

8. **Add OpenAI node for SEO copywriting**:  
   - Name: `OpenAI - SEO Copywriting1`  
   - Operation: `message`  
   - Configure prompt to generate SEO-friendly product title, description, price, and tags based on mockup and analysis data.  
   - Connect Code node output to this node.

9. **Add Shopify node to create draft product**:  
   - Name: `Shopify - Create Draft Product1`  
   - Resource: `product`  
   - Operation: `create` (default)  
   - Set product title, body_html (description), tags (comma-separated), vendor `"Visual Remix Engine"`, product_type `"Apparel"`, images array with primary mockup URL.  
   - Leave `published_at` empty to keep draft status.  
   - Connect OpenAI SEO node to this node.  
   - Connect Shopify credentials.

10. **Add Slack node to send approval request**:  
    - Name: `Slack - Approval Request1`  
    - Message text includes AI analysis summary, product title, price, and mockup image URL.  
    - Post in configured Slack channel with interactive buttons for approve/reject.  
    - Connect Shopify draft product node to this node.  
    - Connect Slack credentials.

11. **Add Wait node**:  
    - Name: `Wait - For Approval1`  
    - Set to wait for webhook resume triggered by Slack button click.  
    - Connect Slack Approval Request node to this node.

12. **Add Switch node for approval decision**:  
    - Name: `Switch - Approval Decision1`  
    - Condition on webhook JSON: if action value equals `"approve"` or `"reject"`.  
    - Connect Wait node to this node.

13. **Add Slack node for rejection notice**:  
    - Name: `Slack - Rejection Notice1`  
    - Sends rejection message with product title to Slack channel.  
    - Connect Switch node rejection output to this node.

14. **Add Shopify node to publish product**:  
    - Name: `Shopify - Publish Product1`  
    - Resource: `product`  
    - Operation: `update`  
    - Update field: set `published_at` to current ISO timestamp to publish product.  
    - Connect Switch node approval output to this node.

15. **Add HTTP Request node to post on Instagram**:  
    - Name: `Instagram - Post Product1`  
    - POST request to Instagram Graph API endpoint `/media` of Instagram Business Account.  
    - Query parameters include image URL, caption built from short description and hashtags, and access token.  
    - Connect Shopify publish node to this node.

16. **Add HTTP Request node to create Pinterest Pin**:  
    - Name: `Pinterest - Create Pin1`  
    - POST to `https://api.pinterest.com/v5/pins`  
    - JSON body with board ID, media source with image URL, title, description, and Shopify product link.  
    - Header with Bearer token from Pinterest API access token.  
    - Connect Instagram post node to this node.

17. **Test workflow end-to-end**, ensuring all credentials and API keys are valid, and that all placeholder values are replaced.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                        | Context or Link                                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Workflow designed to automate print-on-demand merchandise creation from design files through AI analysis, product mockups, Shopify draft creation, Slack-based human approval, and social media promotion.            | See sticky note "Template Description" for detailed overview and setup instructions.                           |
| Requires setting up multiple API credentials: Google Drive, OpenAI (preferably GPT-4o), Remove.bg, Cloudinary, Shopify, Slack, Instagram Business, and Pinterest.                                                  | Credential setup is critical for workflow operation.                                                           |
| Cloudinary base product images (blank white/black T-shirts, tote bags) must be uploaded in advance and their public IDs configured in the workflow.                                                               | This allows dynamic mockup generation with design overlays.                                                    |
| Slack interactive messages require properly configured Slack app with permissions for message buttons and webhooks.                                                                                               | Slack webhook IDs and channel IDs must be set correctly.                                                       |
| Instagram Business and Pinterest APIs require valid access tokens and proper permissions for posting media.                                                                                                        | Refer to Instagram Graph API and Pinterest API documentation for token generation and usage.                    |
| The OpenAI Vision node expects base64 image input to generate a structured JSON analysis; this requires GPT-4o or equivalent model supporting vision input.                                                        | https://platform.openai.com/docs/models/gpt-4o                                                                    |
| Remove.bg API has limits on image size and number of calls per month; ensure your plan matches expected volume.                                                                                                   | https://www.remove.bg/api                                                                                       |
| Cloudinary signature generation may require implementing a server-side signature if not using unsigned uploads. The workflow as-is assumes signature is provided or handled externally.                           | https://cloudinary.com/documentation/upload_images#generating_authentication_signatures                        |

---

This document fully captures the logic, node configurations, and operational flow of the "Automate Print-on-Demand: Design to Shopify with AI, Mockups & Social Promotion" workflow, enabling reproduction, modification, and troubleshooting by both humans and automation agents.