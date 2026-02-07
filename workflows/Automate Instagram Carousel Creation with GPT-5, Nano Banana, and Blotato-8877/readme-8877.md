Automate Instagram Carousel Creation with GPT-5, Nano Banana, and Blotato

https://n8nworkflows.xyz/workflows/automate-instagram-carousel-creation-with-gpt-5--nano-banana--and-blotato-8877


# Automate Instagram Carousel Creation with GPT-5, Nano Banana, and Blotato

### 1. Workflow Overview

This workflow automates the creation and publishing of Instagram carousel posts using AI-driven content generation and image creation tools. It targets social media marketers, content creators, and automation enthusiasts who want to generate engaging Instagram carousel images and captions on autopilot, reducing manual effort while maintaining viral content quality.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Listens for a chat message containing the Instagram carousel topic or idea.
- **1.2 Image Prompt Generation**: Uses GPT-5 to generate five image prompts based on a proven viral content framework.
- **1.3 Structured Output Parsing**: Parses the AI-generated text into a clean, structured JSON format for downstream processing.
- **1.4 Image Generation via Nano Banana**: Sends the prompts to the Nano Banana API to generate carousel images, waits for rendering, and retrieves the image URLs.
- **1.5 Media Upload and Data Logging**: Uploads generated images to Blotato for hosting, merges image URLs, and logs details into Google Sheets.
- **1.6 Caption Generation**: Uses GPT-5 to create a compelling, SEO-optimized Instagram caption based on the image prompts.
- **1.7 Post to Instagram**: Merges caption and image URLs, then automatically posts the carousel to Instagram via Blotato.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview**: This block triggers the entire workflow upon receiving a chat message containing the carousel topic or idea.
- **Nodes Involved**:  
  - When chat message received

- **Node Details**:  
  - **When chat message received**  
    - Type: Langchain Chat Trigger node  
    - Role: Starts the workflow when a chat message arrives, capturing the user’s input as the carousel topic (e.g., "best practices for podcast")  
    - Configuration: Default webhook trigger listening for chat input  
    - Input: External chat message webhook  
    - Output: JSON containing the 'IG Idea' field with the user's topic  
    - Edge Cases: Missing or empty input could cause downstream empty prompt generation  
    - Version: 1.3  
    - Sticky Note: "Chat Trigger"

#### 1.2 Image Prompt Generation

- **Overview**: Generates five structured image prompts for Nano Banana to create carousel images, using a proven viral 5-slide content framework (Hook, Problem, Insight, Solution, CTA).
- **Nodes Involved**:  
  - Image Prompt Generator  
  - OpenAI Chat Model  
  - Structured Output Parser  
  - Split Out

- **Node Details**:  
  - **Image Prompt Generator**  
    - Type: Langchain Agent node  
    - Role: Receives the user's topic and generates five detailed image prompts with header/subheader text based on the viral 5-framework  
    - Configuration: Uses a system message instructing the creation of 5 prompts formatted as a JSON array named 'prompts'; input pulls from `IG Idea` field  
    - Key Expressions: `={{ $json['IG Idea'] }}` to use the chat input  
    - Outputs a JSON object with 5 carousel image prompts  
    - Version: 2.2  
    - Edge Cases: Model errors, incomplete outputs, or invalid JSON; fallback or retries recommended  
    - Sticky Note: "Image Prompt Generation"

  - **OpenAI Chat Model**  
    - Type: Langchain OpenAI Chat Model  
    - Role: Executes GPT-5 model inference to produce text results for the Image Prompt Generator  
    - Configuration: Model set to "gpt-5"  
    - Input: Prompt from Image Prompt Generator  
    - Output: Raw AI text  
    - Edge Cases: API rate limits, auth failures, timeouts  
    - Version: 1.2

  - **Structured Output Parser**  
    - Type: Langchain Structured Output Parser  
    - Role: Parses raw text from GPT-5 into structured JSON, strictly validating the 'prompts' array format  
    - Configuration: JSON schema example with a 'prompts' array of strings  
    - Input: Text output from OpenAI Chat Model  
    - Output: JSON with parsed prompts  
    - Edge Cases: Parsing failures if output format deviates; should handle gracefully  
    - Version: 1.3

  - **Split Out**  
    - Type: Split Out node  
    - Role: Splits the parsed array of prompts into multiple individual items for parallel processing  
    - Configuration: Field to split out is `output.prompts`  
    - Input: Parsed JSON prompts  
    - Output: Each prompt as a separate item  
    - Version: 1

#### 1.3 Image Generation via Nano Banana

- **Overview**: Sends each prompt to Nano Banana API to generate images, waits for rendering, then retrieves the final image URLs.
- **Nodes Involved**:  
  - Nano Banana  
  - Wait For Render  
  - Get Nano Banana Image Result

- **Node Details**:  
  - **Nano Banana**  
    - Type: HTTP Request node  
    - Role: Posts each prompt to the Wavespeed Nano Banana text-to-image API to start image generation  
    - Configuration:  
      - URL: `https://api.wavespeed.ai/api/v3/google/nano-banana/text-to-image`  
      - POST method with parameters: output_format=png, prompt text, sync_mode=false, base64_output=false  
      - Authentication: HTTP header with Wavespeed API key  
    - Input: Individual prompt strings  
    - Output: JSON with prediction job ID for image generation  
    - Edge Cases: API errors, connection timeouts, invalid prompt format  
    - Version: 4.2

  - **Wait For Render**  
    - Type: Wait node  
    - Role: Delays workflow execution for 60 seconds to allow image rendering to complete asynchronously  
    - Configuration: Wait time set to 60 seconds  
    - Input: Job ID from Nano Banana  
    - Output: Passes through after wait  
    - Edge Cases: Insufficient wait time could cause premature request for results  
    - Version: 1.1

  - **Get Nano Banana Image Result**  
    - Type: HTTP Request node  
    - Role: Fetches the completed image URL using the prediction job ID from Nano Banana API  
    - Configuration:  
      - URL templated as `https://api.wavespeed.ai/api/v3/predictions/{{ $json.data.id }}/result`  
      - GET method with authentication header  
    - Input: Job ID from previous nodes  
    - Output: JSON containing image URL and metadata  
    - Edge Cases: Job not ready, API errors, invalid job ID  
    - Version: 4.2

#### 1.4 Media Upload and Data Logging

- **Overview**: Uploads the generated images to Blotato for media hosting and scheduling, merges all image URLs for logging and posting, and appends metadata to Google Sheets.
- **Nodes Involved**:  
  - Upload media (Blotato)  
  - Code (JavaScript)  
  - Append row in sheet (Google Sheets)  
  - Merge Caption + Images (merge node)

- **Node Details**:  
  - **Upload media**  
    - Type: Blotato node  
    - Role: Uploads each image URL to Blotato media library for Instagram posting and hosting  
    - Configuration: Uses Blotato API key for authentication  
    - Input: Image URLs from Nano Banana result  
    - Output: Media upload confirmation and accessible URLs  
    - Edge Cases: Auth errors, upload failures, file size limits  
    - Version: 2

  - **Code**  
    - Type: Code node (JavaScript)  
    - Role: Combines all uploaded image URLs into a single array object for easy reference  
    - Configuration: Custom JS code:  
      ```js
      return [
        {
          json: {
            urls: items.map(item => item.json.url)
          }
        }
      ];
      ```  
    - Input: Multiple image URLs from Blotato upload  
    - Output: Single JSON with aggregated URLs array  
    - Edge Cases: Empty input, malformed URL fields  
    - Version: 2

  - **Append row in sheet**  
    - Type: Google Sheets node  
    - Role: Logs image URLs and metadata into a Google Sheet for record-keeping and tracking  
    - Configuration:  
      - Operation: Append  
      - Document ID and Sheet Name set via credentials or parameters (not hardcoded)  
    - Input: Merged image URLs and timestamp info  
    - Output: Confirmation of sheet append  
    - Edge Cases: Auth errors, sheet access permissions, rate limits  
    - Version: 4.7

  - **Merge Caption + Images**  
    - Type: Merge node  
    - Role: Combines caption text and image URLs into a single dataset for final posting  
    - Configuration: Mode set to "combine" merging all input data sets  
    - Inputs: Caption data and image URLs from previous nodes  
    - Output: Unified JSON object with all post elements  
    - Edge Cases: Mismatch in input array sizes, absent data from either input  
    - Version: 3.2  
    - Sticky Note: "Upload to Blotato and Merge Image Urls with Caption"

#### 1.5 Caption Generation

- **Overview**: Generates a professional, optimized Instagram caption based on the five image prompts to maximize engagement and reach.
- **Nodes Involved**:  
  - Caption Generator

- **Node Details**:  
  - **Caption Generator**  
    - Type: Langchain OpenAI node  
    - Role: Uses GPT-5 to craft a post-ready Instagram caption with SEO keywords, hooks, CTAs, and hashtags based on the image prompts  
    - Configuration:  
      - Model: gpt-5  
      - Messages include system instructions to write a high-hook, engaging caption and user message concatenating all five prompts  
    - Input: JSON object with the five prompts from Structured Output Parser  
    - Output: Caption text only, no explanation  
    - Edge Cases: API failures, content filtering issues, model hallucinations  
    - Version: 1.8  
    - Sticky Note: "Nano Banana & Caption Generator"

#### 1.6 Post to Instagram

- **Overview**: Uploads the finalized carousel post (images + caption) to Instagram via Blotato automation.
- **Nodes Involved**:  
  - Post to Instagram

- **Node Details**:  
  - **Post to Instagram**  
    - Type: Blotato node  
    - Role: Posts the merged images and caption to connected Instagram account automatically  
    - Configuration: Requires Blotato OAuth2 credentials with Instagram posting permissions  
    - Input: Combined image URLs and caption text from Merge node  
    - Output: Confirmation of post success or failure  
    - Edge Cases: Instagram API limits, auth token expiration, content policy rejection  
    - Version: 2  
    - Sticky Note: "Post To Instagram"

---

### 3. Summary Table

| Node Name                  | Node Type                              | Functional Role                               | Input Node(s)                | Output Node(s)              | Sticky Note                              |
|----------------------------|--------------------------------------|----------------------------------------------|------------------------------|-----------------------------|-----------------------------------------|
| When chat message received  | Langchain Chat Trigger (@n8n)         | Workflow entry point, receive topic input    | —                            | Image Prompt Generator       | Chat Trigger                           |
| Image Prompt Generator      | Langchain Agent (@n8n)                 | Generate 5 image prompts using viral framework | When chat message received    | Split Out, Caption Generator | Image Prompt Generation                |
| OpenAI Chat Model           | Langchain OpenAI Chat Model (@n8n)    | GPT-5 inference for prompt generation        | Image Prompt Generator        | Structured Output Parser     |                                         |
| Structured Output Parser    | Langchain Output Parser (@n8n)         | Parse GPT-5 output into JSON array            | OpenAI Chat Model             | Image Prompt Generator       |                                         |
| Split Out                  | Split Out (n8n)                        | Split prompts array to individual items       | Image Prompt Generator        | Nano Banana                 |                                         |
| Nano Banana                | HTTP Request (n8n)                     | Send prompt to Nano Banana API for image gen | Split Out                    | Wait For Render             |                                         |
| Wait For Render            | Wait (n8n)                            | Wait 60 seconds for image rendering           | Nano Banana                  | Get Nano Banana Image Result |                                         |
| Get Nano Banana Image Result| HTTP Request (n8n)                    | Retrieve generated image URL                   | Wait For Render              | Upload media                |                                         |
| Upload media               | Blotato node (@blotato/n8n-nodes)    | Upload images to Blotato for hosting           | Get Nano Banana Image Result | Code                        | Upload to Blotato and Merge Image Urls with Caption |
| Code                      | Code (n8n)                           | Merge all image URLs into one array            | Upload media                 | Append row in sheet          | Upload to Blotato and Merge Image Urls with Caption |
| Append row in sheet        | Google Sheets (n8n)                   | Log image URLs and metadata                     | Code                        | Merge Caption + Images       | Upload to Blotato and Merge Image Urls with Caption |
| Caption Generator          | Langchain OpenAI (@n8n)                | Generate Instagram caption based on prompts   | Image Prompt Generator        | Merge Caption + Images       | Nano Banana & Caption Generator        |
| Merge Caption + Images     | Merge (n8n)                          | Combine images and caption into one payload    | Caption Generator, Append row in sheet | Post to Instagram     | Upload to Blotato and Merge Image Urls with Caption |
| Post to Instagram          | Blotato node (@blotato/n8n-nodes)    | Auto-post carousel to Instagram                | Merge Caption + Images        | —                           | Post To Instagram                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Chat Trigger Node**  
   - Type: Langchain Chat Trigger  
   - Configure webhook to listen for chat messages  
   - Output: Capture user input as `IG Idea` for carousel topic

2. **Add OpenAI Chat Model Node**  
   - Type: Langchain OpenAI Chat Model  
   - Model: gpt-5  
   - Purpose: Generate text prompts for image ideas

3. **Add Image Prompt Generator Node**  
   - Type: Langchain Agent  
   - Input: `={{ $json['IG Idea'] }}` from Chat Trigger  
   - System Message: Provide viral 5-framework instructions to generate 5 detailed image prompts plus header/subheader text  
   - Output: JSON with field `prompts` as an array of 5 strings

4. **Add Structured Output Parser Node**  
   - Type: Langchain Structured Output Parser  
   - JSON Schema: Expect `prompts` array with 5 prompt strings  
   - Input: Output from OpenAI Chat Model  
   - Output: Parsed JSON prompts

5. **Connect Image Prompt Generator to Split Out Node**  
   - Type: Split Out  
   - Field to split: `output.prompts`  
   - Purpose: Split the array into individual prompt items

6. **Add Nano Banana HTTP Request Node**  
   - URL: `https://api.wavespeed.ai/api/v3/google/nano-banana/text-to-image`  
   - Method: POST  
   - Body Parameters:  
     - `prompt` set to individual prompt text  
     - `output_format`: png  
     - `enable_base64_output`: false  
     - `enable_sync_mode`: false  
   - Authentication: HTTP header with Wavespeed API Key

7. **Add Wait Node**  
   - Wait time: 60 seconds  
   - Purpose: Allow asynchronous image rendering to complete

8. **Add HTTP Request Node to Retrieve Image Result**  
   - URL template: `https://api.wavespeed.ai/api/v3/predictions/{{ $json.data.id }}/result`  
   - Method: GET  
   - Auth: Wavespeed HTTP header

9. **Add Blotato Upload Media Node**  
   - Purpose: Upload generated images to Blotato media library  
   - Configure with Blotato API Key credentials

10. **Add Code Node to Aggregate Image URLs**  
    - JavaScript code to merge all image URLs into one JSON array

11. **Add Google Sheets Append Row Node**  
    - Operation: Append  
    - Configure with Google Sheets OAuth credentials  
    - Specify Document ID and Sheet Name for logging image URLs and timestamps

12. **Add Caption Generator Node**  
    - Type: Langchain OpenAI  
    - Model: gpt-5  
    - System prompt: Expert Instagram Caption Agent instructions for high-hook, SEO-optimized caption  
    - User prompt: Concatenate all 5 image prompts as input

13. **Add Merge Node**  
    - Mode: Combine  
    - Input 1: Output from Caption Generator  
    - Input 2: Output from Google Sheets Append Row (with image URLs)  
    - Purpose: Combine caption text with image URLs

14. **Add Blotato Post to Instagram Node**  
    - Configure with Blotato Instagram OAuth credentials  
    - Input: Merged caption and images payload  
    - Output: Post confirmation

15. **Connect all nodes as per the described flow**:  
    - Start with Chat Trigger → Image Prompt Generator → OpenAI Chat Model → Structured Output Parser → Split Out → Nano Banana → Wait → Get Image Result → Upload to Blotato → Code → Append row in Google Sheets → Merge Caption + Images → Post to Instagram

16. **Credential Setup**:  
    - OpenAI API Key for GPT-5 nodes  
    - Wavespeed API Key for Nano Banana HTTP Requests  
    - Blotato API Key with permissions for media upload and Instagram posting  
    - Google Sheets OAuth2 credentials with write access

17. **Validation and Testing**  
    - Test chat trigger with sample prompt (e.g., "best practices for podcast")  
    - Verify 5 image prompts generated  
    - Confirm images generated and uploaded correctly  
    - Check caption quality  
    - Confirm Instagram post is published

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                | Context or Link                               |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------|
| 🎨 Instagram Carousel & Caption Generator on Autopilot (GPT-5 + Nano Banana + Blotato + Google Sheets). Turn ideas into viral-ready carousels automatically, combining AI image generation, caption writing, and auto-posting. | Workflow overview sticky note                  |
| Watch the full step-by-step tutorial on YouTube: https://youtu.be/id22R7iBTjo                                                                                                                                                | Video tutorial link (official workflow demo) |
| Use Wavespeed’s Nano Banana API for high-quality, consistent Instagram carousel visuals.                                                                                                                                   | Nano Banana API reference                       |
| Proven viral 5-framework content structure: Hook → Problem → Insight → Solution → CTA.                                                                                                                                      | Content strategy embedded in prompt generation |
| Requires API keys for OpenAI GPT-5, Wavespeed Nano Banana, Blotato, and Google Sheets OAuth.                                                                                                                                 | Credential requirements                        |
| Error handling recommendations: Implement retries and fallback for API rate limits, auth failures, and parsing errors to ensure smooth automation.                                                                          | Best practices note                            |

---

**Disclaimer:** The provided text and analysis originate exclusively from an automated workflow created with n8n, adhering strictly to content policies without illegal, offensive, or protected elements. All data processed is legal and public.