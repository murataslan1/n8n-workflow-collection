Auto-Generate Platform-Optimized Social Media Posts from WordPress with Claude & Postiz

https://n8nworkflows.xyz/workflows/auto-generate-platform-optimized-social-media-posts-from-wordpress-with-claude---postiz-7046


# Auto-Generate Platform-Optimized Social Media Posts from WordPress with Claude & Postiz

### 1. Workflow Overview

This workflow automates the generation and publication of platform-optimized social media posts derived from WordPress blog content. It targets social media managers and marketers seeking to streamline content repurposing for multiple platforms (Twitter/X, Facebook, LinkedIn, Instagram) using AI-generated captions and images. The workflow integrates WordPress, Google Sheets, AI language models (Anthropic Claude and OpenAI), and the Postiz social media publishing platform.

The workflow is logically divided into these functional blocks:

- **1.1 Input Reception & Post Identification:** Manual trigger and retrieval of WordPress post ID from Google Sheets.
- **1.2 Content Retrieval:** Fetch the full WordPress post content based on the ID.
- **1.3 AI Processing for Social Media Content Generation:**
  - Generate platform-specific captions using Anthropic Claude LLM.
  - Parse AI structured output for different social networks.
- **1.4 AI-Generated Image Creation:** Generate images tailored for Instagram and Facebook/LinkedIn using OpenAI’s image model.
- **1.5 Image Upload to Postiz:** Upload generated images to Postiz for use in posts.
- **1.6 Social Media Posting via Postiz:** Create scheduled posts on Twitter/X, Facebook, LinkedIn, and Instagram through Postiz API.
- **1.7 Google Sheets Status Update:** Mark posts as published in the Google Sheet.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Post Identification

- **Overview:**  
  This block starts the workflow manually and reads the WordPress Post ID from a predefined Google Sheet. This ID serves as the key input for retrieving WordPress content.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Google Sheets (Read Post ID)  
  - Sticky Note (Instruction note)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point to manually start the workflow  
    - Config: No parameters, triggers workflow execution  
    - Inputs: None  
    - Outputs: Triggers Google Sheets node  
    - Edge Cases: None specific; workflow must be manually triggered

  - **Google Sheets**  
    - Type: Google Sheets node (read operation)  
    - Role: Reads the WordPress Post ID from a specific spreadsheet (sheet gid=0) and filters for the "TWITTER" column (used for row selection)  
    - Configuration: Uses OAuth2 credentials for Google Sheets access; configured to return first matching row  
    - Inputs: Triggered by Manual Trigger  
    - Outputs: Outputs JSON containing row data including POST ID  
    - Edge Cases:  
      - Google API auth failure  
      - Missing or invalid Post ID value  
      - Empty or corrupted spreadsheet row  
    - Sticky Note: "Get the Post ID of the Wordpress article on which you want to generate the caption for social media"

---

#### 2.2 Content Retrieval

- **Overview:**  
  This block retrieves the content of the WordPress post specified by the Post ID from the previous block, fetching title and content fields for AI processing.

- **Nodes Involved:**  
  - Get Post (WordPress)  
  - Sticky Note (Instruction on SMM Chain role)

- **Node Details:**

  - **Get Post**  
    - Type: WordPress node (get operation)  
    - Role: Fetches full content of WordPress post by ID  
    - Configuration: Uses WordPress API credentials; Post ID dynamically set via expression from Google Sheets node (`={{ $json['POST ID'] }}`)  
    - Inputs: Google Sheets node output  
    - Outputs: JSON containing post title and rendered HTML content  
    - Edge Cases:  
      - Post ID not found or invalid in WP  
      - WordPress API authentication or connectivity issues  
      - Empty or restricted content  
    - Sticky Note: "The SMM Chain analyses the content of the post and creates the most suitable caption based on the destination social network."

---

#### 2.3 AI Processing for Social Media Content Generation

- **Overview:**  
  This block uses Anthropic Claude LLM to generate social media captions tailored for each platform based on the WordPress post content. It then parses the structured JSON output for further use.

- **Nodes Involved:**  
  - Opus 4.1 (Anthropic Claude LLM)  
  - Social Media Manager (Chain LLM node)  
  - Structured Output Parser

- **Node Details:**

  - **Opus 4.1**  
    - Type: LangChain Anthropic LLM node  
    - Role: Runs the Claude Opus 4.1 model for content generation  
    - Configuration: Model selected is "claude-opus-4-1-20250805" with default options  
    - Inputs: None directly; connected as AI language model to Social Media Manager node  
    - Outputs: AI-generated text  
    - Edge Cases:  
      - API key or Anthropic API errors  
      - Rate limiting or model unavailability

  - **Social Media Manager**  
    - Type: LangChain Chain LLM node  
    - Role: Constructs prompt with WordPress post title and content, sends to Anthropic Claude, requesting platform-specific captions per detailed style guide  
    - Configuration:  
      - Text prompt with embedded expressions for post title and content  
      - Multi-platform style and tone guidelines explicitly included in prompt  
      - Output is structured JSON for all four platforms  
    - Inputs: WordPress post content, Anthropic model connection  
    - Outputs: AI-generated multi-platform captions JSON  
    - Edge Cases:  
      - Expression evaluation failures if post content missing  
      - Model output inconsistent with schema

  - **Structured Output Parser**  
    - Type: LangChain structured output parser  
    - Role: Parses AI output against defined JSON schema with properties twitter, facebook, linkedin, instagram (all strings)  
    - Configuration: Manual schema defined for expected output format  
    - Inputs: AI output text from Social Media Manager  
    - Outputs: Parsed JSON with platform-specific texts  
    - Edge Cases:  
      - Parsing failure if AI output does not conform to schema  
      - Missing properties in output

---

#### 2.4 AI-Generated Image Creation

- **Overview:**  
  Generates images for Instagram and Facebook/LinkedIn posts using OpenAI image generation model, based on the caption content.

- **Nodes Involved:**  
  - Image Instagram (OpenAI image generation)  
  - Image Facebook e Linkedin (OpenAI image generation)  

- **Node Details:**

  - **Image Instagram**  
    - Type: LangChain OpenAI Image node  
    - Role: Creates 1024x1024 image based on Instagram caption text  
    - Configuration: Model "gpt-image-1" with prompt set to Instagram caption expression  
    - Inputs: Instagram caption from Structured Output Parser  
    - Outputs: Image data and metadata  
    - Credentials: OpenRouter account for OpenAI API  
    - Edge Cases:  
      - API quota exceeded  
      - Image generation failure or timeouts

  - **Image Facebook e Linkedin**  
    - Type: LangChain OpenAI Image node  
    - Role: Creates 1536x1024 image for Facebook and LinkedIn caption  
    - Configuration: Same model, prompt set to Facebook caption  
    - Inputs: Facebook caption from Structured Output Parser  
    - Outputs: Image data and metadata  
    - Credentials: OpenRouter account  
    - Edge Cases: Same as above

---

#### 2.5 Image Upload to Postiz

- **Overview:**  
  Upload generated images to Postiz platform to obtain media IDs for attaching images to social posts.

- **Nodes Involved:**  
  - Upload image (for Facebook and LinkedIn images)  
  - Upload IG Image (for Instagram image)  

- **Node Details:**

  - **Upload image**  
    - Type: HTTP Request (POST multipart/form-data)  
    - Role: Uploads Facebook/LinkedIn image binary to Postiz upload API  
    - Configuration:  
      - URL: https://api.postiz.com/public/v1/upload  
      - Authentication: HTTP header auth with Postiz API key  
      - Body: multipart form with binary image data  
    - Inputs: Image data from "Image Facebook e Linkedin" node  
    - Outputs: Uploaded image metadata including ID for Postiz  
    - Edge Cases:  
      - API key invalid or expired  
      - Network or upload errors

  - **Upload IG Image**  
    - Same as Upload image but for Instagram image data input

---

#### 2.6 Social Media Posting via Postiz

- **Overview:**  
  Schedules and publishes social media posts to each platform via Postiz API, attaching generated texts and images.

- **Nodes Involved:**  
  - X.com (Twitter/X post)  
  - Facebook  
  - Linkedin  
  - Instagram  

- **Node Details:**

  - **X.com**  
    - Type: Postiz node  
    - Role: Posts Twitter/X content from AI output  
    - Configuration:  
      - Date/time set to current time dynamically  
      - Content from Social Media Manager’s twitter output  
      - Integration ID set to platform-specific Postiz channel ID ("XXX" placeholder)  
      - Short link option enabled  
    - Inputs: AI-generated Twitter caption  
    - Outputs: Postiz API response  
    - Edge Cases:  
      - Invalid integration ID  
      - Postiz API errors

  - **Facebook**  
    - Similar to X.com but posts Facebook content  
    - Includes uploaded image ID attached to post content  
    - Integration ID for Facebook channel

  - **Linkedin**  
    - Posts LinkedIn content with image ID attachment  
    - Integration ID for LinkedIn channel

  - **Instagram**  
    - Posts Instagram content without image ID in content (image uploaded separately)  
    - Integration ID for Instagram channel

---

#### 2.7 Google Sheets Status Update

- **Overview:**  
  Updates the original Google Sheet row marking the post as published ("x") for each social platform to indicate successful processing.

- **Nodes Involved:**  
  - X OK  
  - Facebook Ok  
  - Linkedin OK  
  - Instagram OK  

- **Node Details:**

  - Each node:  
    - Type: Google Sheets (update operation)  
    - Role: Writes "x" in the corresponding platform column for the row number of the post  
    - Inputs: Postiz posting node outputs (used to confirm success, then update)  
    - Config: Uses OAuth2 Google Sheets credentials; matches row_number from initial read  
    - Edge Cases:  
      - Google API auth failures  
      - Row number mismatch or failure to update

---

### 3. Summary Table

| Node Name                  | Node Type                           | Functional Role                                         | Input Node(s)              | Output Node(s)                  | Sticky Note                                                                                      |
|----------------------------|-----------------------------------|---------------------------------------------------------|----------------------------|-------------------------------|------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                    | Start workflow manually                                 | None                       | Google Sheets                  |                                                                                                |
| Google Sheets              | Google Sheets (read)               | Read WordPress Post ID from sheet                       | When clicking ‘Test workflow’ | Get Post                      | Get the Post ID of the Wordpress article on which you want to generate the caption for social media |
| Get Post                  | WordPress node                    | Retrieve full WordPress post content                    | Google Sheets              | Social Media Manager           | The SMM Chain analyses the content of the post and creates the most suitable caption based on the destination social network. |
| Opus 4.1                  | LangChain Anthropic LLM           | AI language model (Claude) for caption generation       | - (linked as model)        | Social Media Manager           |                                                                                                |
| Social Media Manager      | LangChain Chain LLM               | Generate platform-specific social media captions        | Get Post, Opus 4.1         | Structured Output Parser, Image Facebook e Linkedin, Image Instagram, X.com |                                                                                                |
| Structured Output Parser  | LangChain Output Parser Structured | Parse AI output JSON for platform captions              | Social Media Manager       | Social Media Manager           |                                                                                                |
| Image Instagram           | LangChain OpenAI Image            | Generate Instagram post image                           | Social Media Manager (Instagram caption) | Upload IG Image               |                                                                                                |
| Image Facebook e Linkedin | LangChain OpenAI Image            | Generate Facebook and LinkedIn post image                | Social Media Manager (Facebook caption) | Upload image                 |                                                                                                |
| Upload image              | HTTP Request (POST)               | Upload image to Postiz for Facebook/LinkedIn             | Image Facebook e Linkedin  | Linkedin, Facebook             |                                                                                                |
| Upload IG Image           | HTTP Request (POST)               | Upload Instagram image to Postiz                          | Image Instagram            | Instagram                     |                                                                                                |
| X.com                     | Postiz node                      | Publish Twitter/X post via Postiz                         | Social Media Manager       | X OK                          |                                                                                                |
| Facebook                  | Postiz node                      | Publish Facebook post via Postiz                          | Upload image               | Facebook Ok                   |                                                                                                |
| Linkedin                  | Postiz node                      | Publish LinkedIn post via Postiz                          | Upload image               | Linkedin OK                   |                                                                                                |
| Instagram                 | Postiz node                      | Publish Instagram post via Postiz                         | Upload IG Image            | Instagram OK                  |                                                                                                |
| X OK                      | Google Sheets (update)            | Mark Twitter post as published in Google Sheets          | X.com                      | -                             |                                                                                                |
| Facebook Ok               | Google Sheets (update)            | Mark Facebook post as published in Google Sheets         | Facebook                   | -                             |                                                                                                |
| Linkedin OK               | Google Sheets (update)            | Mark LinkedIn post as published in Google Sheets         | Linkedin                   | -                             |                                                                                                |
| Instagram OK              | Google Sheets (update)            | Mark Instagram post as published in Google Sheets        | Instagram                  | -                             |                                                                                                |
| Sticky Note               | Sticky Note                      | Instruction: Get Post ID                                  | -                          | -                             | Get the Post ID of the Wordpress article on which you want to generate the caption for social media |
| Sticky Note1              | Sticky Note                      | Instruction: SMM Chain role                              | -                          | -                             | The SMM Chain analyses the content of the post and creates the most suitable caption based on the destination social network. |
| Sticky Note2              | Sticky Note                      | Workflow usage instructions and Postiz setup            | -                          | -                             | ## STEP 1\n\nThis workflow automates the process of creating and publishing social media posts across multiple platforms (Twitter/X, Facebook, LinkedIn, and Instagram) based on content from a WordPress post... |
| Sticky Note3              | Sticky Note                      | Google Sheet setup instruction                           | -                          | -                             | ## STEP 2\nClone [this Sheet](https://docs.google.com/spreadsheets/d/1suPQNdgoAzrklleN4ok2mZnsq0GK1dt59oIHv8JWX5U/edit?usp=sharing) and set ONLY the WordPress Post ID id in the right column |
| Sticky Note4              | Sticky Note                      | Workflow description and notes                           | -                          | -                             | ## AI Social Media Publisher from WordPress with Postiz\n\nThis workflow automates the process of **generating and scheduling social media posts using content from a WordPress blog**... |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**  
   - Name: "When clicking ‘Test workflow’"  
   - Type: Manual Trigger (no parameters)  

2. **Create Google Sheets Node (Read):**  
   - Name: "Google Sheets"  
   - Operation: Read data from Google Sheet  
   - Document ID: Use your Google Sheet containing post info  
   - Sheet Name: gid=0 or your main sheet  
   - Filter: Lookup column "TWITTER" with appropriate filter to select target post row  
   - Credentials: Set Google Sheets OAuth2 credentials  
   - Connect output of Manual Trigger to this node  

3. **Create WordPress Node (Get Post):**  
   - Name: "Get Post"  
   - Operation: Get post by ID  
   - Post ID: Set expression from Google Sheets output: `{{$json["POST ID"]}}`  
   - Credentials: WordPress API credentials  
   - Connect Google Sheets output to this node  

4. **Create Anthropic Claude LLM Node:**  
   - Name: "Opus 4.1"  
   - Model: Select "claude-opus-4-1-20250805" or latest available  
   - Credentials: Anthropic API key  
   - No direct input connection (used as AI language model reference)  

5. **Create LangChain Chain LLM Node:**  
   - Name: "Social Media Manager"  
   - Role: Generate multi-platform social media captions  
   - Text prompt: Include WordPress post title and content expressions  
   - Messages: Detailed instructions on tone, style, hashtags per platform  
   - Model node: Set to Anthropic Claude node ("Opus 4.1")  
   - Enable output parser with JSON schema for twitter, facebook, linkedin, instagram  
   - Connect WordPress node output to this node  
   - Connect Anthropic LLM node as AI model  

6. **Create Structured Output Parser Node:**  
   - Name: "Structured Output Parser"  
   - Input schema: JSON object with string properties for twitter, facebook, linkedin, instagram  
   - Connect output of Social Media Manager to this node's input parser  

7. **Create OpenAI Image Generation Nodes:**  
   - Name: "Image Instagram"  
     - Model: "gpt-image-1"  
     - Prompt: Expression to use Instagram caption text from parsed output  
     - Image size: 1024x1024  
     - Credentials: OpenRouter/OpenAI API key  

   - Name: "Image Facebook e Linkedin"  
     - Same model  
     - Prompt: Facebook caption text  
     - Image size: 1536x1024  
     - Credentials: OpenRouter/OpenAI API key  

   - Connect Structured Output Parser outputs to respective image generation nodes  

8. **Create HTTP Request Nodes to Upload Images to Postiz:**  
   - Name: "Upload image" (Facebook and LinkedIn)  
     - Method: POST  
     - URL: https://api.postiz.com/public/v1/upload  
     - Content type: multipart/form-data  
     - Authentication: HTTP Header Auth with Postiz API key  
     - Body parameter: file (binary image data from previous node)  
   - Name: "Upload IG Image" (Instagram) same config  
   - Connect respective image generation outputs to these nodes  

9. **Create Postiz Nodes to Publish Posts:**  
   - Name: "X.com" (Twitter/X)  
     - Date: Current date/time expression  
     - Post content: Twitter caption from AI output  
     - Integration ID: Your Twitter channel ID in Postiz (replace "XXX")  
     - Enable short links  
   - Name: "Facebook"  
     - Date: Current date/time  
     - Content: Facebook caption  
     - Attach uploaded image ID from "Upload image" node  
     - Integration ID: Facebook channel ID  
   - Name: "Linkedin"  
     - Same as Facebook but for LinkedIn caption and image  
   - Name: "Instagram"  
     - Date: Current date/time  
     - Content: Instagram caption  
     - Integration ID: Instagram channel ID  
     - Attach uploaded IG image  
   - Connect image upload nodes outputs to respective Postiz nodes  
   - Connect Social Media Manager outputs to X.com node  

10. **Create Google Sheets Nodes to Update Status:**  
    - For each platform (X OK, Facebook Ok, Linkedin OK, Instagram OK):  
      - Operation: Update  
      - Sheet and document ID same as read node  
      - Columns to update: Set platform column to "x" for the matching row_number from initial read  
      - Credentials: Google Sheets OAuth2  
      - Connect respective Postiz node output to update node  

11. **Add Sticky Notes for Instructions:**  
    - Add contextual sticky notes as per the original workflow for clarity  

12. **Set Execution Order:**  
    - Manual Trigger → Google Sheets read → Get Post → Social Media Manager (with Opus 4.1) → Structured Output Parser → Image generation nodes → Image upload nodes → Postiz posting nodes → Google Sheets update nodes  

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                           |
|------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Create an account on [Postiz](https://postiz.com/?ref=n3witalia) FREE 7 days-trial; obtain API key and connect social channels      | Postiz platform setup for social media API integration                                                  |
| Clone [this Google Sheet](https://docs.google.com/spreadsheets/d/1suPQNdgoAzrklleN4ok2mZnsq0GK1dt59oIHv8JWX5U/edit?usp=sharing) and set WordPress Post IDs | Required input for specifying posts to process                                                          |
| Workflow uses community nodes only compatible with self-hosted n8n versions                                                        | Compatibility note                                                                                       |
| Detailed style and tone guidelines embedded in AI prompt ensure platform-specific optimization for engagement and SEO             | Best practice for multi-platform content generation                                                     |

---

This documentation enables developers and AI agents to fully understand, reproduce, and modify the workflow with clear guidance on node roles, configurations, and external dependencies. It also highlights potential failure points for robust operation.