Automate Product Ad Creation with Telegram, Fal.AI & Facebook Posting

https://n8nworkflows.xyz/workflows/automate-product-ad-creation-with-telegram--fal-ai---facebook-posting-9561


# Automate Product Ad Creation with Telegram, Fal.AI & Facebook Posting

### 1. Workflow Overview

This workflow automates the creation of product advertising content by integrating Telegram messaging, AI-driven image analysis and generation (OpenAI and Fal.AI), and automated publishing on Facebook. It is designed for marketers or social media managers who want to streamline ad creation from product images submitted via Telegram, generate creative ad images, compose social media captions, and post automatically.

The workflow is logically divided into four main blocks:

- **1.1 Input Reception and Product Image Analysis**  
  Receive product images via Telegram, extract the actual image file, and analyze the product visually using OpenAI’s Vision API.

- **1.2 Advertising Prompt Creation and User Review**  
  Generate an AI-crafted advertising image prompt based on the analyzed product image plus user input, then get user approval or revision requests.

- **1.3 Ad Image Generation with Fal.AI and Confirmation**  
  Use the approved prompt to generate an ad image via Fal.AI, poll for completion, send the generated image back to Telegram for user approval.

- **1.4 Social Media Caption Creation and Facebook Posting**  
  Analyze the final approved ad image, generate a social media caption, get user approval, preview the post, and publish it to a Facebook page automatically.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Product Image Analysis

**Overview:**  
This block receives a product image from Telegram, retrieves the image file path, and analyzes the product details using AI vision to extract descriptive data about the product.

**Nodes Involved:**  
- Receive Product Image (Telegram Trigger)  
- Get Telegram File Path  
- Analyze Product Image (OpenAI Vision)  
- Generate Ad Prompt Draft (from Image Analysis)  

**Node Details:**  

- **Receive Product Image (Telegram Trigger)**  
  - Type: Telegram Trigger node  
  - Role: Entry point; listens for incoming Telegram messages with images  
  - Config: Triggers on "message" updates, uses Telegram Bot credentials  
  - Input: Telegram message with product photo  
  - Output: JSON containing Telegram message data, including photo file_ids  
  - Edge cases: Missing or invalid image attachments, Telegram API downtime

- **Get Telegram File Path**  
  - Type: HTTP Request  
  - Role: Calls Telegram API to get the actual file path for the product image from the file_id  
  - Config: HTTP GET to Telegram getFile endpoint with file_id extracted from trigger  
  - Input: file_id of photo (highest resolution index 2)  
  - Output: JSON object with file_path string for later download  
  - Edge cases: Invalid file_id, Telegram API errors, network timeouts

- **Analyze Product Image (OpenAI Vision)**  
  - Type: OpenAI (Langchain) Vision node  
  - Role: Sends product image URL to OpenAI Vision API for detailed product description  
  - Config: Model "gpt-4o-mini", operation "analyze", with a prompt to ignore background and focus on product  
  - Input: Image URL constructed from Telegram file_path  
  - Output: Text analysis describing brand, color, material, packaging, etc.  
  - Edge cases: Image analysis failures, API rate limits

- **Generate Ad Prompt Draft (from Image Analysis)**  
  - Type: Langchain Agent (OpenAI Chat Model)  
  - Role: Converts analyzed product description and user caption into a structured advertising image prompt JSON  
  - Config: System prompt instructs to generate distinct, production-ready ad prompts following a strict JSON schema  
  - Input: Product image URL, caption text from Telegram message, and analyzed description  
  - Output: JSON object with fields like image_url, caption, num_variations, and variations array  
  - Edge cases: Parsing errors, incomplete prompts, invalid JSON output

---

#### 2.2 Advertising Prompt Creation and User Review

**Overview:**  
This block extracts key prompt parameters, sends them back to the user for approval via Telegram, and handles revision requests.

**Nodes Involved:**  
- Assemble Prompt Parameters  
- User Review: Approve/Reject Ad Prompt  
- Check Prompt Approval (Yes/No)  
- Revise Prompt Based on Feedback  
- Send a text message  

**Node Details:**  

- **Assemble Prompt Parameters**  
  - Type: Set node  
  - Role: Extracts prompt details (caption, prompt text, style, scene, lighting, camera, composition, background, color mood, marketing angle) from the structured output JSON  
  - Config: Assigns JSON fields from Generate Ad Prompt Draft node’s output  
  - Input: JSON from prompt draft node  
  - Output: Separate parameters for message composition  
  - Edge cases: Missing fields, null values

- **User Review: Approve/Reject Ad Prompt**  
  - Type: Telegram node (sendAndWait)  
  - Role: Sends a formatted message with the prompt details to the user and waits for approval or rejection with optional comment  
  - Config: Custom form with radio buttons "Approve" or "Reject" and optional comment field  
  - Input: Prompt parameters from previous node  
  - Output: User response (approval and comment)  
  - Edge cases: User timeout, invalid response, Telegram connectivity

- **Check Prompt Approval (Yes/No)**  
  - Type: If node  
  - Role: Routes workflow based on user approval; if "Approve," proceeds; if "Reject," triggers prompt revision  
  - Config: Checks if Approval field equals "Approve"  
  - Input: User response data  
  - Output: Branches workflow accordingly  
  - Edge cases: Unexpected values, missing data

- **Revise Prompt Based on Feedback**  
  - Type: Langchain Agent (OpenAI Chat Model)  
  - Role: Generates a revised advertising prompt based on user comments and initial inputs  
  - Config: Similar to prompt draft generation but includes user feedback for revision  
  - Input: Product image URL, caption, analyzed description, and user comment  
  - Output: Revised prompt JSON  
  - Edge cases: Parsing errors, user comments that are vague or contradictory

- **Send a text message**  
  - Type: Telegram node  
  - Role: Sends text to inform user that the image ads are processing after prompt approval  
  - Config: Simple text message to Telegram chat ID  
  - Edge cases: Message delivery failures

---

#### 2.3 Ad Image Generation with Fal.AI and Confirmation

**Overview:**  
This block sends the approved prompt to Fal.AI’s API to generate the advertising image, polls for completion, sends the image back to Telegram, and requests user approval.

**Nodes Involved:**  
- Prepare Fal.AI Input Fields  
- Call Fal.AI API (nano-banana model)  
- Check Fal.AI Image Status  
- Verify Image Generation Completed  
- Retrieve Generated Image URL  
- Send Generated Image to Telegram  
- User Review: Approve/Reject Generated Image  
- Check Image Approval (Yes/No)  
- Wait  

**Node Details:**  

- **Prepare Fal.AI Input Fields**  
  - Type: Set node  
  - Role: Formats the prompt and image URL parameters into a single string payload for Fal.AI API  
  - Config: Combines all prompt parameters into multiline string format plus product image URL  
  - Input: Prompt parameters, Telegram photo file_id  
  - Output: Structured input for API call  
  - Edge cases: Incorrect URL formatting

- **Call Fal.AI API (nano-banana model)**  
  - Type: HTTP Request  
  - Role: Sends POST request to Fal.AI API to generate ad images based on prompt and input image  
  - Config: Uses HTTP Header Authentication (Fal AI credentials), sends JSON with prompt string and image URLs, requests JPEG output  
  - Input: Prepared prompt and image URL  
  - Output: JSON including request_id and status_url for polling  
  - Edge cases: API errors, network failures, invalid authentication

- **Check Fal.AI Image Status**  
  - Type: HTTP Request  
  - Role: Polls Fal.AI API status URL to check generation progress  
  - Config: Uses same authentication  
  - Input: status_url from previous API response  
  - Output: Status JSON including "COMPLETED" or other status  
  - Edge cases: Timeout, API errors

- **Verify Image Generation Completed**  
  - Type: If node  
  - Role: Checks if status equals "COMPLETED" to proceed or wait further  
  - Config: Condition on status field  
  - Edge cases: Stuck in other statuses

- **Wait**  
  - Type: Wait node  
  - Role: Delays workflow 10 seconds before retrying status check  
  - Config: Fixed wait time of 10 seconds

- **Retrieve Generated Image URL**  
  - Type: HTTP Request  
  - Role: Fetches final generated image data from Fal.AI using request_id  
  - Config: GET request with authentication  
  - Edge cases: Failures, retries on failure enabled

- **Send Generated Image to Telegram**  
  - Type: Telegram node  
  - Role: Sends generated advertising image as a photo message to user  
  - Config: Uses Telegram Bot credentials, sends photo by URL  
  - Edge cases: Telegram media restrictions, network errors

- **User Review: Approve/Reject Generated Image**  
  - Type: Telegram node (sendAndWait)  
  - Role: Sends approval form asking user to accept or reject generated image  
  - Config: Radio button form with "Approve" or "Reject"  
  - Edge cases: User inactivity, invalid input

- **Check Image Approval (Yes/No)**  
  - Type: If node  
  - Role: Proceeds if user approves; if rejected, loops back to prompt preparation for regeneration  
  - Edge cases: Unexpected responses

---

#### 2.4 Social Media Caption Creation and Facebook Posting

**Overview:**  
Analyzes the final approved ad image, generates a social media caption for Facebook/Instagram, gets user approval, previews the post, and publishes it to Facebook.

**Nodes Involved:**  
- Analyze Final Ad Image (OpenAI Vision)  
- Generate Social Media Caption  
- User Review: Approve/Reject Caption  
- Check Caption Approval (Yes/No)  
- Preview Post Image (Telegram)  
- Preview Post Caption (Telegram)  
- Publish Post to Facebook Page  

**Node Details:**  

- **Analyze Final Ad Image (OpenAI Vision)**  
  - Type: OpenAI Vision node  
  - Role: Analyzes the approved generated ad image for product features and visual description  
  - Input: Generated image URL from Fal.AI  
  - Output: Description text for caption generation  
  - Edge cases: API failures

- **Generate Social Media Caption**  
  - Type: Langchain Agent (OpenAI Chat Model)  
  - Role: Creates a social media post text with emojis and hashtags tailored to Facebook/Instagram, based on image analysis and original caption  
  - Config: System message instructs to write concise, engaging copy with emotional appeal and call-to-action  
  - Output: JSON with platform, campaign, post_text, hashtags array  
  - Edge cases: Parsing errors, irrelevant output

- **User Review: Approve/Reject Caption**  
  - Type: Telegram node (sendAndWait)  
  - Role: Sends generated caption to user and waits for approval via double approval option  
  - Edge cases: Approval timeouts

- **Check Caption Approval (Yes/No)**  
  - Type: If node  
  - Role: Continues if user approves; if not, loops back to regenerate caption  
  - Edge cases: Unexpected input

- **Preview Post Image (Telegram)**  
  - Type: Telegram node  
  - Role: Sends the final ad image preview to user  
  - Edge cases: Delivery failures

- **Preview Post Caption (Telegram)**  
  - Type: Telegram node  
  - Role: Sends the generated caption text to user for preview  
  - Edge cases: Delivery failures

- **Publish Post to Facebook Page**  
  - Type: Facebook Graph API node  
  - Role: Publishes the ad image and caption as a photo post to a Facebook page  
  - Config: Uses Facebook OAuth credentials, POST to /me/photos edge, parameters include image URL and message  
  - Edge cases: Authentication errors, API limits, permission issues

---

### 3. Summary Table

| Node Name                             | Node Type                          | Functional Role                                              | Input Node(s)                               | Output Node(s)                            | Sticky Note                                                                                                                         |
|-------------------------------------|----------------------------------|--------------------------------------------------------------|---------------------------------------------|------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| Receive Product Image (Telegram Trigger) | Telegram Trigger                 | Entry point: Receive product image from Telegram             | None                                        | Get Telegram File Path                    | 🟩 Zone 1: Product Image Analysis — Receive product image and start analysis                                                       |
| Get Telegram File Path               | HTTP Request                     | Get actual image file path from Telegram API                  | Receive Product Image (Telegram Trigger)    | Analyze Product Image (OpenAI Vision)    | 🟩 Zone 1                                                                                                                          |
| Analyze Product Image (OpenAI Vision) | OpenAI Vision                   | Analyze product image for detailed description                | Get Telegram File Path                       | Generate Ad Prompt Draft (from Image Analysis) | 🟩 Zone 1                                                                                                                          |
| Generate Ad Prompt Draft (from Image Analysis) | Langchain Agent (OpenAI Chat Model) | Generate initial advertising prompt JSON                      | Analyze Product Image (OpenAI Vision), OpenAI Chat Model | Assemble Prompt Parameters               | 🟩 Zone 1                                                                                                                          |
| Assemble Prompt Parameters           | Set                              | Extract prompt details for user review                        | Generate Ad Prompt Draft (from Image Analysis) | User Review: Approve/Reject Ad Prompt    | 🟥 Zone 2: Create Advertising Image Prompt                                                                                         |
| User Review: Approve/Reject Ad Prompt | Telegram (sendAndWait)          | Send prompt details for user approval or rejection           | Assemble Prompt Parameters                   | Check Prompt Approval (Yes/No)            | 🟥 Zone 2                                                                                                                          |
| Check Prompt Approval (Yes/No)       | If                               | Branch based on user approval                                 | User Review: Approve/Reject Ad Prompt       | Send a text message, Revise Prompt Based on Feedback | 🟥 Zone 2                                                                                                                          |
| Revise Prompt Based on Feedback      | Langchain Agent (OpenAI Chat Model) | Generate revised prompt if user requested revision           | Check Prompt Approval (Yes/No)               | Assemble Prompt Parameters               | 🟥 Zone 2                                                                                                                          |
| Send a text message                  | Telegram                         | Inform user image ads are processing                          | Check Prompt Approval (Yes/No)               | Prepare Fal.AI Input Fields               | 🟨 Zone 3: Generate & Confirm Ad Image (Fal.AI)                                                                                   |
| Prepare Fal.AI Input Fields          | Set                              | Format input for Fal.AI API call                              | Send a text message                         | Call Fal.AI API (nano-banana model)      | 🟨 Zone 3                                                                                                                          |
| Call Fal.AI API (nano-banana model) | HTTP Request                    | Request Fal.AI to generate ad image                           | Prepare Fal.AI Input Fields                  | Check Fal.AI Image Status                 | 🟨 Zone 3                                                                                                                          |
| Check Fal.AI Image Status            | HTTP Request                    | Poll Fal.AI for image generation status                       | Call Fal.AI API (nano-banana model)          | Verify Image Generation Completed         | 🟨 Zone 3                                                                                                                          |
| Verify Image Generation Completed    | If                               | Check if image generation is completed                        | Check Fal.AI Image Status                    | Retrieve Generated Image URL, Wait        | 🟨 Zone 3                                                                                                                          |
| Wait                               | Wait                             | Delay before re-checking generation status                   | Verify Image Generation Completed            | Check Fal.AI Image Status                 | 🟨 Zone 3                                                                                                                          |
| Retrieve Generated Image URL         | HTTP Request                    | Fetch final generated image URL                               | Verify Image Generation Completed            | Send Generated Image to Telegram          | 🟨 Zone 3                                                                                                                          |
| Send Generated Image to Telegram     | Telegram                         | Send generated ad image to user                              | Retrieve Generated Image URL                  | User Review: Approve/Reject Generated Image | 🟨 Zone 3                                                                                                                          |
| User Review: Approve/Reject Generated Image | Telegram (sendAndWait)          | Ask user to approve or reject generated image                | Send Generated Image to Telegram             | Check Image Approval (Yes/No)              | 🟨 Zone 3                                                                                                                          |
| Check Image Approval (Yes/No)         | If                               | Branch based on user approval                                  | User Review: Approve/Reject Generated Image | Analyze Final Ad Image (OpenAI Vision), Prepare Fal.AI Input Fields | 🟨 Zone 3                                                                                                                          |
| Analyze Final Ad Image (OpenAI Vision) | OpenAI Vision                   | Analyze the approved ad image for caption creation           | Check Image Approval (Yes/No)                 | Generate Social Media Caption             | 🟦 Zone 4: Create Social Media Caption & Post to Facebook                                                                         |
| Generate Social Media Caption        | Langchain Agent (OpenAI Chat Model) | Generate caption text for Facebook/Instagram post            | Analyze Final Ad Image (OpenAI Vision), OpenAI Chat Model1 | User Review: Approve/Reject Caption      | 🟦 Zone 4                                                                                                                          |
| User Review: Approve/Reject Caption  | Telegram (sendAndWait)          | Send generated caption for user approval                      | Generate Social Media Caption                 | Check Caption Approval (Yes/No)            | 🟦 Zone 4                                                                                                                          |
| Check Caption Approval (Yes/No)       | If                               | Branch based on caption approval                              | User Review: Approve/Reject Caption          | Preview Post Image (Telegram), Generate Social Media Caption | 🟦 Zone 4                                                                                                                          |
| Preview Post Image (Telegram)         | Telegram                         | Show preview of final ad image                                | Check Caption Approval (Yes/No)               | Preview Post Caption (Telegram)            | 🟦 Zone 4                                                                                                                          |
| Preview Post Caption (Telegram)       | Telegram                         | Show preview of final caption text                            | Preview Post Image (Telegram)                 | Publish Post to Facebook Page              | 🟦 Zone 4                                                                                                                          |
| Publish Post to Facebook Page         | Facebook Graph API              | Publish ad image and caption to Facebook page                | Preview Post Caption (Telegram)               | None                                     | 🟦 Zone 4                                                                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Bot & Credentials**  
   - Set up a Telegram Bot and connect it as a credential in n8n with OAuth token.

2. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Parameters: Listen to "message" updates (to receive product images)  
   - Credential: Use Telegram Bot credentials  

3. **Add HTTP Request Node "Get Telegram File Path"**  
   - Type: HTTP Request (GET)  
   - URL: `https://api.telegram.org/bot<YourBotToken>/getFile?file_id={{ $json.message.photo[2].file_id }}`  
   - Connect output of Telegram Trigger node  
   - No authentication needed  

4. **Add OpenAI Vision Node "Analyze Product Image"**  
   - Type: OpenAI (Langchain) Vision  
   - Model: gpt-4o-mini  
   - Operation: analyze image  
   - Image URL: `https://api.telegram.org/file/bot<YourBotToken>/{{ $json.result.file_path }}` from previous node  
   - Prompt: "Describe the product and brand in this image in full detail..."  
   - Credentials: OpenAI API key  

5. **Add Langchain Agent Node "Generate Ad Prompt Draft"**  
   - Type: Langchain Agent (OpenAI Chat Model)  
   - Model: gpt-4.1-mini  
   - System prompt: Advertising Image Prompt Designer instructions (see analysis)  
   - Input: product image URL, caption from Telegram message, analyzed description  
   - Enable structured output parser with JSON schema for prompt  

6. **Add Set Node "Assemble Prompt Parameters"**  
   - Extract prompt data fields from Langchain output (caption, prompt, style, scene, etc.)  

7. **Add Telegram Node "User Review: Approve/Reject Ad Prompt"**  
   - Type: Telegram (sendAndWait)  
   - Send message with prompt details (formatted from Set node fields)  
   - Add custom form with radio buttons for approval and optional comment  

8. **Add If Node "Check Prompt Approval"**  
   - Condition: If user response is "Approve"  
   - True branch: Send Telegram text message "Waiting image ads on process..."  
   - False branch: Langchain Agent node "Revise Prompt Based on Feedback" with user comment input  

9. **Add Langchain Agent Node "Revise Prompt Based on Feedback"**  
   - Similar to prompt draft node but includes user comment for revision  
   - Connect back to "Assemble Prompt Parameters" node  

10. **Add Telegram Node "Send a text message"**  
    - Inform user that image ads are being processed  

11. **Add Set Node "Prepare Fal.AI Input Fields"**  
    - Format prompt parameters and product image URL for Fal.AI API call  

12. **Add HTTP Request Node "Call Fal.AI API (nano-banana model)"**  
    - POST to `https://queue.fal.run/fal-ai/nano-banana/edit`  
    - JSON body includes prompt and image URLs  
    - Use HTTP Header Auth with Fal.AI credentials  

13. **Add HTTP Request Node "Check Fal.AI Image Status"**  
    - Poll status URL from previous response with same auth  

14. **Add If Node "Verify Image Generation Completed"**  
    - Check if status == "COMPLETED"  
    - True: Continue  
    - False: Wait node for 10 seconds, then loop back to status check  

15. **Add HTTP Request Node "Retrieve Generated Image URL"**  
    - GET final image data by request_id with auth  

16. **Add Telegram Node "Send Generated Image to Telegram"**  
    - Send photo message with generated image URL to user  

17. **Add Telegram Node "User Review: Approve/Reject Generated Image"**  
    - Send approval form with radio buttons  

18. **Add If Node "Check Image Approval"**  
    - If approved, proceed to next block  
    - If rejected, loop back to "Prepare Fal.AI Input Fields" to regenerate image  

19. **Add OpenAI Vision Node "Analyze Final Ad Image"**  
    - Analyze generated image for caption creation  

20. **Add Langchain Agent Node "Generate Social Media Caption"**  
    - Create Facebook/Instagram post text with emojis and hashtags  
    - Use analyzed description and platform input  

21. **Add Telegram Node "User Review: Approve/Reject Caption"**  
    - Send caption text for approval (double approval option enabled)  

22. **Add If Node "Check Caption Approval"**  
    - If approved, continue  
    - If rejected, loop back to "Generate Social Media Caption"  

23. **Add Telegram Node "Preview Post Image"**  
    - Show final ad image preview  

24. **Add Telegram Node "Preview Post Caption"**  
    - Show final caption preview text  

25. **Add Facebook Graph API Node "Publish Post to Facebook Page"**  
    - POST to `/me/photos` edge  
    - Parameters: image URL and message text  
    - Use Facebook OAuth credentials  

---

### 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                                                                           |
|---------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| The workflow uses OpenAI GPT-4o-mini and GPT-4.1-mini models for vision analysis and chat completion respectively.              | OpenAI official models                                                                                     |
| Fal.AI API is used for AI image generation with the "nano-banana" model, requiring HTTP Header Authentication.                  | [Fal.AI API documentation](https://fal.ai)                                                               |
| Telegram Bot integration uses sendAndWait operation to collect user approvals and feedback interactively.                       | Telegram Bot API and n8n Telegram node docs                                                              |
| Facebook Graph API node posts images with captions to Facebook pages, requiring proper OAuth2 credentials.                      | [Facebook Graph API](https://developers.facebook.com/docs/graph-api)                                      |
| This workflow enforces strict JSON schema compliance for AI-generated prompts and captions to ensure seamless API integrations. | Strict JSON schema usage reduces parsing errors and automation failures                                   |
| User input validations and retries are implemented with conditional checks and wait nodes to handle asynchronous API processes. | Common pattern for handling slow image generation and user interaction                                   |

---

_Disclaimer: This document is an automated analysis of an n8n workflow and respects all content policies. All data and integrations used are legal and public._