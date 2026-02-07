Automate Chinese Language Teaching Posts on Facebook with Gemini & Recraft.ai

https://n8nworkflows.xyz/workflows/automate-chinese-language-teaching-posts-on-facebook-with-gemini---recraft-ai-7533


# Automate Chinese Language Teaching Posts on Facebook with Gemini & Recraft.ai

### 1. Workflow Overview

This n8n workflow automates the creation and posting of engaging Chinese language teaching content on Facebook, targeting Thai-speaking audiences. It integrates AI language models (Google Gemini via OpenRouter) and the image generation API Recraft.ai to produce both textual and visual post content. The workflow is designed to take a Chinese word input, generate a well-structured social media post in Thai with Chinese and Pinyin, create a related image prompt, generate a styled image, and finally publish the post with image on Facebook via the Facebook Graph API.

Logical blocks in this workflow include:

- **1.1 Input Reception:** Receives chat input representing the Chinese word or phrase to be taught.
- **1.2 Text Content Generation:** Uses OpenRouter’s Gemini models to generate engaging Facebook post text in Thai with structured vocabulary teaching.
- **1.3 Image Prompt Creation:** Converts the generated text into a concise image description prompt using AI.
- **1.4 Image Generation:** Calls Recraft.ai API to generate a styled digital illustration based on the prompt.
- **1.5 Facebook Posting:** Publishes the generated text and image together as a Facebook post with the Graph API.
- **1.6 Utility and Parsing:** Uses code and output parsing nodes to manage data transformations and ensure API compatibility.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block captures the user input (Chinese word/phrase) from a chat message trigger and prepares it for further processing.

- **Nodes Involved:**  
  - When chat message received  
  - Code  
  - Sticky Note3 (comment)

- **Node Details:**  
  - **When chat message received**  
    - Type: Chat Trigger (LangChain)  
    - Role: Entry point for receiving input from chat interface.  
    - Configuration: Default webhook enabled with unique ID.  
    - Inputs: Chat messages from external interface.  
    - Outputs: JSON containing `chatInput` string.  
    - Edge cases: No input, invalid format, connection timeout.  
  - **Code**  
    - Type: Code (JavaScript)  
    - Role: Transforms chat input into structured JSON with keys `word` and `input`.  
    - Configuration: Extracts `chatInput` and returns as `{ word: value, input: value }` for next nodes.  
    - Expressions: `const value = $json.chatInput`  
    - Inputs: Output of chat trigger.  
    - Outputs: Structured JSON for downstream nodes.  
    - Edge cases: Missing input, empty string.  
  - **Sticky Note3**  
    - Role: Documentation comment explaining input source is chat but can be substituted with Google Sheets or Email.

#### 1.2 Text Content Generation

- **Overview:**  
  Generates engaging and structured Facebook post content teaching the Chinese word, primarily in Thai with Chinese and Pinyin, using AI.

- **Nodes Involved:**  
  - Create FB Post Content (LangChain Agent)  
  - Sticky Note5 (comment)  
  - OpenRouter Chat Model (Gemini 2.5 Pro)  

- **Node Details:**  
  - **Create FB Post Content**  
    - Type: LangChain Agent (AI text generation)  
    - Role: Produce viral, friendly, and educational Facebook post text based on the input word.  
    - Configuration:  
      - Text prompt includes the input word.  
      - System message defines persona as a friendly Chinese teacher targeting Thai audience.  
      - Output is a free-text social media post following a detailed format (hook, vocabulary, examples, tips, engagement question, hashtags).  
    - Inputs: JSON with `word` from Code node.  
    - Outputs: Text content for Facebook post.  
    - Edge cases: API timeout, generation errors, malformed prompt.  
  - **OpenRouter Chat Model**  
    - Type: Language Model node using OpenRouter API with Google Gemini 2.5 Pro model.  
    - Role: Executes the AI prompt for the text generation.  
    - Inputs: Connected via LangChain agent.  
    - Outputs: Raw AI text response.  
    - Credentials: Requires OpenRouter API key.  
  - **Sticky Note5**  
    - Comment explaining this node generates Facebook content from input word using OpenRouter.

#### 1.3 Image Prompt Creation

- **Overview:**  
  Transforms the generated Facebook post text into a concise, clear image prompt suitable for AI image generation.

- **Nodes Involved:**  
  - Create Image Prompt (LangChain Agent)  
  - Structured Output Parser2 (LangChain Output Parser)  
  - OpenRouter Chat Model1 (Gemini Flash 1.5)  
  - Sticky Note7 (comment)  

- **Node Details:**  
  - **Create Image Prompt**  
    - Type: LangChain Agent  
    - Role: Reads the Facebook post text and generates a brief descriptive sentence capturing the visual essence for image generation.  
    - Configuration:  
      - Takes previous post text as input.  
      - System message instructs to produce 2-3 simple English sentences without special characters.  
      - Output JSON contains key `image_prompt_brief`.  
    - Inputs: Text from `Create FB Post Content`.  
    - Outputs: JSON with image prompt.  
    - Edge cases: Parsing failures, malformed output.  
  - **Structured Output Parser2**  
    - Type: LangChain Structured Output Parser  
    - Role: Parses JSON from the agent to extract `image_prompt_brief`.  
    - Inputs: Raw AI output.  
    - Outputs: Parsed JSON for downstream use.  
  - **OpenRouter Chat Model1**  
    - Type: Language Model node with OpenRouter API using Gemini Flash 1.5 model.  
    - Role: Runs the image prompt generation task.  
    - Credentials: OpenRouter API.  
  - **Sticky Note7**  
    - Comment clarifies this step ensures structured prompt for image generation API call.

#### 1.4 Image Generation

- **Overview:**  
  Generates a themed digital illustration based on the AI-created image prompt using Recraft.ai API.

- **Nodes Involved:**  
  - Generate Image (Recraft.ai) (HTTP Request)  
  - Sticky Note8 (comment)  

- **Node Details:**  
  - **Generate Image (Recraft.ai)**  
    - Type: HTTP Request node  
    - Role: Calls Recraft.ai API to generate a 1024x1024 digital illustration image using the brief image prompt.  
    - Configuration:  
      - POST request to Recraft.ai images generation endpoint.  
      - JSON body includes prompt, style (`digital_illustration`), substyle (`young_adult_book_2`), and size.  
      - Authenticates via HTTP header with API key credential.  
    - Inputs: Receives prompt from previous parser node (`image_prompt_brief`).  
    - Outputs: JSON with image URL data.  
    - Edge cases: API errors, network failure, invalid prompt data, quota limits.  
  - **Sticky Note8**  
    - Explains that the image generation uses specific style parameters to maintain consistent visual theme.

#### 1.5 Facebook Posting

- **Overview:**  
  Posts the generated Facebook text content together with the generated image URL to a Facebook page using the Facebook Graph API.

- **Nodes Involved:**  
  - Facebook Graph API (Facebook pages photos endpoint)  
  - Sticky Note (comment)  

- **Node Details:**  
  - **Facebook Graph API**  
    - Type: Facebook Graph API node  
    - Role: Creates a photo post on the specified Facebook page with both image and message.  
    - Configuration:  
      - Endpoint: POST to `/{page-id}/photos` with parameters `message` (post text) and `url` (image URL).  
      - Host URL: `graph.facebook.com`  
      - API version: v22.0  
      - Credentials: Facebook OAuth2 token for page management.  
    - Inputs:  
      - Message from `Create FB Post Content` node output.  
      - Image URL from `Generate Image (Recraft.ai)` output.  
    - Outputs: Facebook API response with post details.  
    - Edge cases: Auth failure, permission issues, API rate limits, invalid image URL.  
  - **Sticky Note**  
    - Contains reference link to official Facebook Graph API documentation for publishing photos.

#### 1.6 Utility and Documentation

- **Nodes Involved:**  
  - Multiple Sticky Notes (Sticky Note2, Sticky Note4, Sticky Note5, Sticky Note7, Sticky Note8, Sticky Note3)  
  - Text Over Image (disabled)  

- **Node Details:**  
  - Sticky Notes provide clarifying comments and references for various workflow parts.  
  - Text Over Image node is disabled and not used in main flow. It appears to be a legacy or optional step for overlaying text on images.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                                   | Input Node(s)          | Output Node(s)               | Sticky Note                                                                                     |
|-------------------------|----------------------------------|-------------------------------------------------|-----------------------|-----------------------------|------------------------------------------------------------------------------------------------|
| When chat message received | LangChain Chat Trigger           | Entry point for receiving user chat input       | -                     | Code                        | ## Input: The input here is from the chat message below but can be replaced by other sources.    |
| Code                    | Code (JavaScript)                 | Extracts and formats chat input                  | When chat message received | Create FB Post Content       | ## Copy it to words and input: split into two variables to avoid routing deletion.              |
| Create FB Post Content   | LangChain Agent                   | Generates Thai Facebook post text teaching a Chinese word | Code                  | Create Image Prompt          | ## Generate Text: Use OpenRouter to write Facebook content from the input word.                 |
| OpenRouter Chat Model    | LangChain Language Model          | Executes AI prompt for Facebook post text         | Create FB Post Content | Create FB Post Content       |                                                                                                |
| Create Image Prompt      | LangChain Agent                   | Creates brief image description prompt from text | Create FB Post Content | Structured Output Parser2    | ## Describe Image: Use AI to describe words for image generation with structured output.        |
| Structured Output Parser2 | LangChain Output Parser           | Parses JSON output from image prompt generation   | Create Image Prompt    | Generate Image (Recraft.ai) |                                                                                                |
| OpenRouter Chat Model1   | LangChain Language Model          | Executes AI prompt for image description          | Create Image Prompt    | Structured Output Parser2    |                                                                                                |
| Generate Image (Recraft.ai) | HTTP Request                    | Calls Recraft.ai API to generate styled image    | Structured Output Parser2 | Facebook Graph API           | ## Generate Image: Use Recraft.ai with specific style for consistent image theme.               |
| Facebook Graph API       | Facebook Graph API                | Posts Facebook post with image and text           | Generate Image (Recraft.ai), Create FB Post Content | -                           | ## Facebook Post: Use Facebook Graph API to post text and image together. https://developers.facebook.com/docs/pages-api/posts#publish-a-photo |
| Sticky Note2             | Sticky Note                      | Sample post reference image                       | -                     | -                           | ## Sample Post ![Source example](https://lh3.googleusercontent.com/d/1UZ3dlbpXx-tZz2I9oOzJDLg_xpPWjy37) |
| Sticky Note3             | Sticky Note                      | Notes about input origin                          | -                     | -                           | ## Input: The input here is from the chat message below but can be replaced by other sources.    |
| Sticky Note4             | Sticky Note                      | Notes about splitting input variables            | -                     | -                           | ## Copy it to words and input: split into two variables to avoid routing deletion.              |
| Sticky Note5             | Sticky Note                      | Notes on generating text content                   | -                     | -                           | ## Generate Text: Use OpenRouter to write Facebook content from the input word.                 |
| Sticky Note7             | Sticky Note                      | Notes on generating image description prompt      | -                     | -                           | ## Describe Image: Use AI to describe words for image generation with structured output.        |
| Sticky Note8             | Sticky Note                      | Notes on generating images with Recraft.ai        | -                     | -                           | ## Generate Image: Use Recraft.ai with specific style for consistent image theme.               |
| Sticky Note              | Sticky Note                      | Notes on Facebook posting with Graph API           | -                     | -                           | ## Facebook Post: Use Facebook Graph API to post text and image together. https://developers.facebook.com/docs/pages-api/posts#publish-a-photo |
| Text Over Image          | HTTP Request (disabled)          | Optional text overlay on image (disabled)          | -                     | -                           |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add **When chat message received** (LangChain chat trigger).  
   - Configure webhook with default settings to accept chat input.

2. **Add Code Node:**  
   - Connect trigger node output to a **Code** node.  
   - Add JavaScript code to extract `chatInput` from JSON and return `{ word: value, input: value }`.  
   - This prepares data for AI processing.

3. **Add LangChain Agent for Facebook Post Content:**  
   - Add **Create FB Post Content** node of type LangChain Agent.  
   - Connect Code node output to this node.  
   - Configure prompt:  
     - Text: `=the word: {{ $json.word }}`  
     - System message: Define persona as friendly Chinese teacher for Thai audience. Include detailed instructions for post structure (see overview).  
   - Set model to **OpenRouter Chat Model** (Google Gemini 2.5 Pro) using OpenRouter API credentials.

4. **Add LangChain Agent for Image Prompt:**  
   - Add **Create Image Prompt** node (LangChain Agent).  
   - Connect output of Create FB Post Content node to this node.  
   - Configure prompt to read Facebook post text and generate a brief English description for image generation.  
   - Use system message to instruct simple descriptive sentences without special characters.  
   - Set model to **OpenRouter Chat Model1** (Google Gemini Flash 1.5) with same OpenRouter credentials.

5. **Add Structured Output Parser Node:**  
   - Add **Structured Output Parser2** node.  
   - Connect output of Create Image Prompt to this parser.  
   - Configure to parse JSON output extracting `image_prompt_brief` key.

6. **Add HTTP Request Node to Generate Image:**  
   - Add **Generate Image (Recraft.ai)** node (HTTP Request).  
   - Connect Structured Output Parser2 output to this node.  
   - Configure POST request to `https://external.api.recraft.ai/v1/images/generations` with JSON body:  
     ```json
     {
       "prompt": "{{ $json.output.image_prompt_brief }}",
       "style": "digital_illustration",
       "substyle": "young_adult_book_2",
       "size": "1024x1024"
     }
     ```  
   - Add HTTP header `Content-Type: application/json`.  
   - Use HTTP Header Auth credentials for Recraft.ai API key.

7. **Add Facebook Graph API Node:**  
   - Add **Facebook Graph API** node.  
   - Configure to POST to `/photos` edge for your Facebook Page node ID.  
   - Set query parameters:  
     - `message`: Use the Facebook post text from `Create FB Post Content` node.  
     - `url`: Use the image URL from `Generate Image (Recraft.ai)` node output.  
   - Use Facebook OAuth2 credential with permissions to post photos on page.

8. **Connect Nodes:**  
   - Connect nodes in flow:  
     `When chat message received` → `Code` → `Create FB Post Content` → `Create Image Prompt` → `Structured Output Parser2` → `Generate Image (Recraft.ai)` → `Facebook Graph API`.

9. **Add Sticky Notes (Optional):**  
   - Add Sticky Notes with the provided comments at relevant nodes for documentation clarity.

10. **Test Workflow:**  
    - Trigger with sample chat input (Chinese word).  
    - Verify generated Facebook post text, image prompt, image generation, and final Facebook post.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                      |
|-------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Sample Facebook post example image used for reference                                           | ![Source example](https://lh3.googleusercontent.com/d/1UZ3dlbpXx-tZz2I9oOzJDLg_xpPWjy37)           |
| Official Facebook Graph API docs for publishing photos                                           | https://developers.facebook.com/docs/pages-api/posts#publish-a-photo                                |
| This workflow can be adapted to accept inputs from other sources such as Google Sheets or Email | Input node comment in Sticky Note3                                                                  |
| OpenRouter API credentials are required for both Gemini 2.5 Pro and Gemini Flash 1.5 models      | Credentials setup for OpenRouter API                                                                |
| Recraft.ai API key is required for image generation                                             | Credential setup for Recraft.ai HTTP Header Auth                                                    |

---

**Disclaimer:**  
The provided text is extracted from an automated n8n workflow for lawful and public data processing. It complies with content policies, contains no illegal or offensive material, and respects all API usage terms.