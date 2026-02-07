Automate LinkedIn Posts with Google Gemini Content & DALL-E Images

https://n8nworkflows.xyz/workflows/automate-linkedin-posts-with-google-gemini-content---dall-e-images-5840


# Automate LinkedIn Posts with Google Gemini Content & DALL-E Images

### 1. Workflow Overview

This workflow automates the generation and publication of LinkedIn posts using AI-generated content and images. It targets marketing teams, content creators, and digital strategists who want to streamline producing high-quality, engaging LinkedIn posts focused on technical leadership in AI, DevOps, cloud engineering, and related fields.

The workflow is organized into the following logical blocks:

- **1.1 Scheduled Trigger:** Periodically initiates the content generation cycle every 6 hours.
- **1.2 Content Topic Generation:** Uses Google Gemini AI to generate fresh, unique LinkedIn content topic ideas targeted at engineering leaders.
- **1.3 Content Creation:** Expands the selected content topics into full LinkedIn posts using an AI copywriter persona.
- **1.4 Hashtag Generation:** Produces strategic hashtags for LinkedIn SEO and audience targeting based on the post content.
- **1.5 Image Generation:** Creates realistic LinkedIn-appropriate images using OpenAI’s DALL-E based on the image description from AI content.
- **1.6 Post Assembly & Publishing:** Merges text content, hashtags, and images and publishes the post on LinkedIn via OAuth2 credentials.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:** Initiates the workflow every 6 hours to automate regular content posting cadence.
- **Nodes Involved:** 
  - Schedule Trigger1
- **Node Details:**  
  - **Schedule Trigger1**
    - Type: Schedule Trigger (n8n-nodes-base.scheduleTrigger)
    - Configuration: Triggers every 6 hours using an interval timer.
    - Input: None (starting node)
    - Output: Triggers the "Content Topic Generator" node.
    - Failure Modes: Misconfiguration of timer, or n8n server downtime can delay runs.
    - Version: 1.2

#### 2.2 Content Topic Generation

- **Overview:** Generates unique LinkedIn content topics tailored for CTOs and engineering leaders, avoiding repeated themes.
- **Nodes Involved:** 
  - Google Gemini Chat Model1
  - Structured Output Parser6
  - Content Topic Generator
- **Node Details:**  
  - **Google Gemini Chat Model1**
    - Type: Google Gemini Chat Model (AI language model node)
    - Configuration: Uses model "models/gemini-2.0-flash" with temperature 0.8 for creative output.
    - Credentials: Gemini API key required.
    - Input: Triggered by Schedule Trigger1.
    - Output: Raw AI response for topic generation.
    - Failure Modes: API auth errors, rate limits, or network issues.
    - Version: 1
  - **Structured Output Parser6**
    - Type: Structured Output Parser (for AI JSON parsing)
    - Configuration: Parses AI response to extract JSON fields: title, rationale, hook.
    - Input: Output from Google Gemini Chat Model1.
    - Output: Clean structured JSON for next node.
    - Failure Modes: AI returning invalid JSON or schema mismatch.
    - Version: 1.2
  - **Content Topic Generator**
    - Type: LangChain agent node (agent with defined prompt)
    - Configuration: Prompt defines a detailed persona and strict instructions to generate fresh, unique content topics with rationale and hooks.
    - Input: Parsed JSON from Structured Output Parser6.
    - Output: Content topics for post creation.
    - Failure Modes: Prompt misinterpretation, output format errors.
    - Version: 1.8

#### 2.3 Content Creation

- **Overview:** Expands the generated topics into full LinkedIn posts with varied styles and tones, targeting technical leadership.
- **Nodes Involved:** 
  - Google Gemini Chat Model2
  - Structured Output Parser7
  - Content Creator
- **Node Details:**  
  - **Google Gemini Chat Model2**
    - Type: Google Gemini Chat Model
    - Configuration: Same model as above, temperature 0.8.
    - Credentials: Gemini API.
    - Input: Content Topic Generator output (selected topic, rationale, hook).
    - Output: Raw AI text content of the LinkedIn post.
    - Failure Modes: Same as previous AI node.
    - Version: 1
  - **Structured Output Parser7**
    - Type: Structured Output Parser
    - Configuration: Parses AI output into "post title", "post content", and "image description".
    - Input: Output from Google Gemini Chat Model2.
    - Output: Structured content for hashtags and image creation.
    - Failure Modes: Parsing errors if AI output deviates.
    - Version: 1.2
  - **Content Creator**
    - Type: LangChain chain LLM node (custom prompt-based text generation)
    - Configuration: Defines a detailed copywriter persona prompt with strict style and content rules to ensure varied, engaging posts.
    - Input: Structured topic data from Structured Output Parser7.
    - Output: Final LinkedIn post content.
    - Failure Modes: Prompt failures, repetitive output, or content not meeting style guidelines.
    - Version: 1.6

#### 2.4 Hashtag Generation

- **Overview:** Creates a well-rounded, SEO-optimized set of hashtags categorized by industry, niche, audience, and branding.
- **Nodes Involved:** 
  - Google Gemini Chat Model3
  - Structured Output Parser3
  - Hashtag Generator / SEO
- **Node Details:**  
  - **Google Gemini Chat Model3**
    - Type: Google Gemini Chat Model
    - Configuration: Same model, temp 0.8.
    - Credentials: Gemini API.
    - Input: Post content from Content Creator.
    - Output: Raw hashtag suggestions.
    - Failure Modes: Auth or API limits.
    - Version: 1
  - **Structured Output Parser3**
    - Type: Structured Output Parser
    - Configuration: Parses AI output into JSON with post title, content, image description, and hashtag list.
    - Input: Output from Google Gemini Chat Model3.
    - Output: Parsed hashtags JSON.
    - Failure Modes: Parsing errors.
    - Version: 1.2
  - **Hashtag Generator / SEO**
    - Type: LangChain agent node
    - Configuration: Prompt instructs hashtag creation into 4 categories with relevance and branding focus.
    - Input: Parsed AI output.
    - Output: Hashtag list for post.
    - Failure Modes: Prompt or output errors.
    - Version: 1.8

#### 2.5 Image Generation

- **Overview:** Generates realistic images representing the post's theme suitable for LinkedIn posts using DALL-E.
- **Nodes Involved:** 
  - Generate an image
- **Node Details:**  
  - **Generate an image**
    - Type: OpenAI Image generation node
    - Configuration: Uses DALL-E with prompt derived from "image description" from the AI content, size 1024x1024.
    - Credentials: OpenAI API key.
    - Input: Image description from Hashtag Generator / SEO output.
    - Output: Generated image binary data.
    - Failure Modes: API key issues, quota limits, prompt quality affecting image relevance.
    - Version: 1.8

#### 2.6 Post Assembly & Publishing

- **Overview:** Combines text, hashtags, and image, then publishes the LinkedIn post using OAuth2 credentials.
- **Nodes Involved:** 
  - Merge
  - Create a post
- **Node Details:**  
  - **Merge**
    - Type: Merge node (combine mode)
    - Configuration: Combines outputs from Hashtag Generator / SEO and Generate an image by position.
    - Input: Outputs from the image and hashtag nodes.
    - Output: Combined data for posting.
    - Failure Modes: Data mismatch if inputs differ in count.
    - Version: 3.2
  - **Create a post**
    - Type: LinkedIn node (n8n-nodes-base.linkedIn)
    - Configuration: Posts the content combined from the "Content Creator" node’s post content plus hashtags on LinkedIn with attached image.
    - Credentials: LinkedIn OAuth2 API credential.
    - Input: Output from Merge node.
    - Output: Post success/failure confirmation.
    - Failure Modes: LinkedIn API rate limits, auth expiration, content policy restrictions.
    - Version: 1

---

### 3. Summary Table

| Node Name                 | Node Type                              | Functional Role                  | Input Node(s)                 | Output Node(s)                | Sticky Note                                  |
|---------------------------|--------------------------------------|--------------------------------|------------------------------|------------------------------|----------------------------------------------|
| Schedule Trigger1          | Schedule Trigger                     | Initiates workflow every 6 hrs | None                         | Content Topic Generator       |                                              |
| Google Gemini Chat Model1  | AI Language Model (Google Gemini)    | Generates content topics        | Schedule Trigger1             | Structured Output Parser6     |                                              |
| Structured Output Parser6  | Structured Output Parser             | Parses topic JSON output        | Google Gemini Chat Model1     | Content Topic Generator       |                                              |
| Content Topic Generator    | LangChain Agent                     | Generates fresh content topics  | Structured Output Parser6     | Content Creator              |                                              |
| Content Creator            | LangChain Chain LLM                 | Creates LinkedIn post content   | Content Topic Generator       | Hashtag Generator / SEO, Generate an image |                                              |
| Google Gemini Chat Model2  | AI Language Model (Google Gemini)    | Expands topics into posts       | Content Topic Generator       | Structured Output Parser7     |                                              |
| Structured Output Parser7  | Structured Output Parser             | Parses post content JSON        | Google Gemini Chat Model2     | Content Creator              |                                              |
| Hashtag Generator / SEO    | LangChain Agent                     | Generates LinkedIn hashtags     | Structured Output Parser3     | Merge                       |                                              |
| Google Gemini Chat Model3  | AI Language Model (Google Gemini)    | Generates hashtags              | Structured Output Parser7     | Structured Output Parser3     |                                              |
| Structured Output Parser3  | Structured Output Parser             | Parses hashtags JSON            | Google Gemini Chat Model3     | Hashtag Generator / SEO       |                                              |
| Generate an image          | OpenAI Image Generation (DALL-E)     | Creates post image              | Content Creator              | Merge                       |                                              |
| Merge                     | Merge Node                         | Combines hashtags and image    | Generate an image, Hashtag Generator / SEO | Create a post                |                                              |
| Create a post             | LinkedIn Node (OAuth2)               | Publishes post on LinkedIn      | Merge                        | None                        |                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**
   - Type: Schedule Trigger
   - Parameters: Interval every 6 hours
   - No credentials needed
   - Output to Content Topic Generator node

2. **Create Google Gemini Chat Model1 Node**
   - Type: Google Gemini Chat Model (LangChain)
   - Model: "models/gemini-2.0-flash"
   - Temperature: 0.8
   - Connect to Schedule Trigger output
   - Credentials: Google Palm API (Gemini API key)

3. **Create Structured Output Parser6 Node**
   - Type: Structured Output Parser
   - JSON Schema: Example with fields "title", "rationale", "hook"
   - Connect input from Google Gemini Chat Model1 output

4. **Create Content Topic Generator Node**
   - Type: LangChain Agent
   - Prompt: Detailed instructions for generating unique LinkedIn content topics targeting engineering leaders as per provided prompt text
   - Connect input from Structured Output Parser6 output

5. **Create Google Gemini Chat Model2 Node**
   - Type: Google Gemini Chat Model
   - Same model and temperature as Model1
   - Connect input from Content Topic Generator output
   - Credentials: Same Gemini API

6. **Create Structured Output Parser7 Node**
   - Type: Structured Output Parser
   - JSON Schema includes "post title", "post content", "image description"
   - Connect input from Google Gemini Chat Model2 output

7. **Create Content Creator Node**
   - Type: LangChain Chain LLM
   - Prompt: Detailed copywriter persona prompt defining style and content rules for LinkedIn posts (as provided)
   - Connect input from Structured Output Parser7 output

8. **Create Google Gemini Chat Model3 Node**
   - Type: Google Gemini Chat Model
   - Same model and temperature
   - Connect input from Content Creator output
   - Credentials: Gemini API

9. **Create Structured Output Parser3 Node**
   - Type: Structured Output Parser
   - JSON Schema example includes "post title", "post content", "image description", and "Hashtags" array
   - Connect input from Google Gemini Chat Model3 output

10. **Create Hashtag Generator / SEO Node**
    - Type: LangChain Agent
    - Prompt to generate 4 categories of hashtags based on post content: broad industry, niche topic, target audience, branded
    - Connect input from Structured Output Parser3 output

11. **Create Generate an Image Node**
    - Type: OpenAI Image Generation (DALL-E)
    - Prompt: Dynamic prompt using "image description" from Content Creator output
    - Image size: 1024x1024
    - Credentials: OpenAI API key
    - Connect input from Content Creator node output

12. **Create Merge Node**
    - Type: Merge (combine mode)
    - Connect inputs from Generate an Image and Hashtag Generator / SEO outputs

13. **Create Create a post Node**
    - Type: LinkedIn Node
    - Parameters: Text built from Content Creator’s post content plus concatenated hashtags from Hashtag Generator
    - Share media type: IMAGE (attach image from Merge node)
    - Credentials: LinkedIn OAuth2 API with valid LinkedIn account
    - Connect input from Merge node output

14. **Connect all nodes sequentially as per above to complete data flow.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| The workflow uses Google Gemini API for advanced AI language tasks requiring valid API credentials from Google Palm API.    | Google Gemini API Documentation                                                                     |
| OpenAI DALL-E is used for image generation; ensure you have an active OpenAI API key with image generation quota.           | OpenAI Image Generation API                                                                         |
| LinkedIn node requires OAuth2 authentication; ensure the LinkedIn app has permissions for posting on behalf of the user.     | LinkedIn Developer Portal                                                                           |
| Prompts are carefully crafted to avoid repetitive content and enforce style consistency; modifications should preserve intent.| Workflow prompt texts embedded in LangChain nodes                                                  |
| This workflow runs every 6 hours; adjust Schedule Trigger interval to fit your posting frequency and LinkedIn API rate limits.|                                                                                                    |
| For troubleshooting parsing errors, verify AI output matches expected JSON schemas; consider adding error handling nodes.   | n8n documentation on JSON parsing and error workflows                                              |

---

*Disclaimer:* The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.