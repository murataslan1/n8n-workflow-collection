AI-powered LinkedIn Content Generator with OpenAI GPT-4 and DALL-E

https://n8nworkflows.xyz/workflows/ai-powered-linkedin-content-generator-with-openai-gpt-4-and-dall-e-7007


# AI-powered LinkedIn Content Generator with OpenAI GPT-4 and DALL-E

### 1. Workflow Overview

This workflow automates the creation of LinkedIn content using AI models from OpenAI, including GPT-4 and DALL-E. It is designed for content creators, marketers, and social media managers who want to generate LinkedIn topics, posts, related hashtags, and accompanying images programmatically with fine-grained user control. The workflow is structured into three main logical blocks representing distinct stages of content generation, each exposed via dedicated webhooks to enable integration with a UI or app builder (e.g., WeWeb):

- **1.1 Topic Generation:** Receives a prompt and OpenAI API key, generates 6 content topic ideas with titles, rationales, and hooks.
- **1.2 Post & Hashtag Generation:** Takes selected topic data (title, rationale, hook), generates a detailed LinkedIn post and optionally related hashtags.
- **1.3 Image Generation:** Creates an image based on a textual description for use alongside the LinkedIn post using DALL-E.

Each block uses OpenAI's GPT-4 models for text generation and OpenAI’s image generation endpoint for visuals. The workflow also includes structured output parsing to ensure AI responses adhere to expected JSON schemas, enabling clean and predictable data exchange with frontend components.

---

### 2. Block-by-Block Analysis

#### 2.1 Topic Generation Block

- **Overview:**  
Generates a list of 6 LinkedIn post topic ideas based on a user-provided prompt. Each topic includes a title, rationale, and hook to guide content creation.

- **Nodes Involved:**  
  - Generate 6 topics (Webhook)  
  - OpenAI Chat Model (GPT-4)  
  - Structured Output Parser  
  - Content topic generator (Langchain Agent)  
  - Respond to Webhook  

- **Node Details:**  

  - **Generate 6 topics**  
    - Type: Webhook  
    - Role: Entry point for topic generation requests; expects POST with `api_key` and `prompt`.  
    - Configuration: Path set, HTTP POST method, response mode set to the response node.  
    - Input/Output: Receives user input, outputs to OpenAI Chat Model.  
    - Edge cases: Missing/invalid API key or prompt; webhook connection errors.

  - **OpenAI Chat Model**  
    - Type: Language Model (GPT-4 variant "gpt-4o-mini")  
    - Role: Generates raw topic ideas text from the prompt.  
    - Configuration: Uses OpenAI API credentials; model set to GPT-4o-mini for cost-effective yet powerful generation.  
    - Input/Output: Input from webhook, output to structured parser.  
    - Edge cases: API key invalid/expired, rate limits, timeouts.

  - **Structured Output Parser**  
    - Type: Output Parser  
    - Role: Parses AI raw text output into structured JSON array with fields `title`, `rationale`, and `hook`.  
    - Configuration: JSON schema example provided to enforce output format.  
    - Input/Output: Input from OpenAI Chat Model, output to Content topic generator.  
    - Edge cases: Parsing failure if AI output deviates from schema.

  - **Content topic generator**  
    - Type: Langchain Agent  
    - Role: Coordinates AI text generation and parsing for topic generation.  
    - Configuration: Uses prompt from webhook body, linked to OpenAI Chat Model and Structured Output Parser.  
    - Input/Output: Input from parser, output to Respond to Webhook node.  
    - Edge cases: Expression evaluation errors in prompt, AI generation errors.

  - **Respond to Webhook**  
    - Type: Respond to Webhook  
    - Role: Sends back the generated list of topics to the API client.  
    - Input/Output: Input from Content topic generator, outputs JSON response.  

- **Additional Notes:**  
  - Sticky Note at position [-360, -800] explains the expected input format and example API call for this webhook.  
  - Sticky Note at position [-1260] explains the rationale for separating the workflow into three webhooks for user control.  
  - Sticky Note at position [-680] illustrates the output format with example screenshot.

---

#### 2.2 Post & Hashtag Generation Block

- **Overview:**  
Generates a detailed LinkedIn post text and optionally related hashtags based on a selected topic (title, rationale, hook). This block allows users to refine and publish posts with SEO-optimized hashtags.

- **Nodes Involved:**  
  - Generate post with hashtags (Webhook)  
  - OpenAI Chat Model1 (GPT-4)  
  - Structured Output Parser1  
  - Content creator (Langchain Chain LLM)  
  - Hashtag generator /SEO (Langchain Agent) [disabled]  
  - OpenAI Chat Model2 (GPT-4)  
  - Structured Output Parser2  
  - Respond to Webhook1  

- **Node Details:**  

  - **Generate post with hashtags**  
    - Type: Webhook  
    - Role: Entry point for post generation requests; expects POST with `api_key`, `title`, `rationale`, and `hook`.  
    - Configuration: HTTP POST, specific webhook path, response sent from response node.  
    - Input/Output: Input from user, outputs to Content creator node.  
    - Edge cases: Invalid keys or missing post data.

  - **OpenAI Chat Model1**  
    - Type: Language Model (GPT-4o-mini)  
    - Role: Generates detailed LinkedIn post text and image description from topic data.  
    - Configuration: Uses OpenAI API credentials; model set for advanced text generation.  
    - Input/Output: Input from Content creator, output to Structured Output Parser1.  
    - Edge cases: API issues, timeouts.

  - **Structured Output Parser1**  
    - Type: Output Parser  
    - Role: Converts AI output into structured JSON with `post title`, `post content`, and `image description`.  
    - Configuration: JSON schema example provided to ensure output consistency.  
    - Input/Output: Input from OpenAI Chat Model1, output to Content creator node.  
    - Edge cases: Parsing errors if output deviates.

  - **Content creator**  
    - Type: Langchain Chain LLM  
    - Role: Main AI content generation chain for post creation; constructs prompt including title, rationale, and hook.  
    - Configuration: Custom prompt template defining role as LinkedIn content creator and copywriter; outputs post text and image description.  
    - Input/Output: Input from Structured Output Parser1, output to Hashtag generator /SEO node.  
    - Edge cases: Expression evaluation errors, prompt context issues.

  - **Hashtag generator /SEO (disabled)**  
    - Type: Langchain Agent  
    - Role: Generates relevant SEO hashtags based on post content and title.  
    - Configuration: Disabled in current workflow; prompt asks for broad, niche, and trending hashtags in comma-separated format.  
    - Input/Output: Would receive input from Content creator, output to Respond to Webhook1.  
    - Edge cases: N/A (disabled).

  - **OpenAI Chat Model2**  
    - Type: Language Model (GPT-4o-mini)  
    - Role: Generates post content including hashtags (likely an alternative to the disabled hashtag generator).  
    - Configuration: OpenAI API credentials, GPT-4o-mini model.  
    - Input/Output: Input from Hashtag generator /SEO (or Content creator), output to Structured Output Parser2.  
    - Edge cases: API or model errors.

  - **Structured Output Parser2**  
    - Type: Output Parser  
    - Role: Parses AI output including `post title`, `post content`, `image description`, and `Hashtags` array.  
    - Configuration: JSON schema example includes hashtags array.  
    - Input/Output: Input from OpenAI Chat Model2, output to Respond to Webhook1.  
    - Edge cases: Parsing failures.

  - **Respond to Webhook1**  
    - Type: Respond to Webhook  
    - Role: Sends back the finalized post content, image description, and hashtags to the API client.  
    - Input/Output: Input from Structured Output Parser2.

- **Additional Notes:**  
  - Sticky Note at position [-20] describes expected API call format for post and hashtag generation.  
  - Sticky Note at position [140] shows example output structure with post title, content, and image description.

---

#### 2.3 Image Generation Block

- **Overview:**  
Generates an image based on a description generated from the LinkedIn post, using OpenAI’s DALL-E 3 model. Returns the image encoded in base64 for frontend rendering.

- **Nodes Involved:**  
  - Generate image (Webhook)  
  - HTTP Request (OpenAI Image Generation)  
  - Respond to Webhook2  

- **Node Details:**  

  - **Generate image**  
    - Type: Webhook  
    - Role: Entry point for image generation requests; expects POST with `api_key` and `imgDescription`.  
    - Configuration: Path set, HTTP POST, response mode set to response node.  
    - Input/Output: Input from user, output to HTTP Request node.  
    - Edge cases: Missing description or API key.

  - **HTTP Request**  
    - Type: HTTP Request  
    - Role: Calls OpenAI’s image generation API to generate an image from the description.  
    - Configuration: POST to `https://api.openai.com/v1/images/generations` using OpenAI credentials; body includes model `dall-e-3`, prompt from `imgDescription`, size `1024x1024`, and base64 JSON response format.  
    - Input/Output: Input from Generate image node, output to Respond to Webhook2.  
    - Edge cases: API authentication failure, rate limits, invalid prompt.

  - **Respond to Webhook2**  
    - Type: Respond to Webhook  
    - Role: Returns the base64 encoded image data to the client.  
    - Input/Output: Input from HTTP Request node.

- **Additional Notes:**  
  - Sticky Note at position [940] explains expected input format for image generation webhook.  
  - Sticky Note at position [960] explains output format including base64 image and frontend conversion to Blob.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                        | Input Node(s)             | Output Node(s)            | Sticky Note                                                                                              |
|-------------------------|----------------------------------|-------------------------------------|---------------------------|---------------------------|--------------------------------------------------------------------------------------------------------|
| Generate 6 topics        | Webhook                          | Topic generation API entry point     | —                         | Content topic generator    | Explains expected input with example API call (image).                                                 |
| OpenAI Chat Model        | Langchain LM Chat OpenAI         | Generates raw topic ideas text       | Generate 6 topics          | Structured Output Parser   |                                                                                                        |
| Structured Output Parser | Langchain Output Parser           | Parses AI output to structured JSON  | OpenAI Chat Model          | Content topic generator    |                                                                                                        |
| Content topic generator  | Langchain Agent                  | Controls topic generation chain      | Structured Output Parser   | Respond to Webhook         |                                                                                                        |
| Respond to Webhook       | Respond to Webhook               | Sends topics list response           | Content topic generator    | —                         | Explains output format with example screenshot (image).                                                |
| Generate post with hashtags | Webhook                       | Post and hashtag generation entry    | —                         | Content creator           | Explains expected input with example API call (image).                                                 |
| OpenAI Chat Model1       | Langchain LM Chat OpenAI         | Generates detailed post text         | Content creator            | Structured Output Parser1  |                                                                                                        |
| Structured Output Parser1| Langchain Output Parser           | Parses post content and image desc   | OpenAI Chat Model1         | Content creator            |                                                                                                        |
| Content creator          | Langchain Chain LLM              | Generates LinkedIn post and image description | Structured Output Parser1  | Hashtag generator /SEO (disabled) | Explains post generation step with example API call (image).                                            |
| Hashtag generator /SEO   | Langchain Agent (disabled)        | Generates relevant hashtags          | Content creator            | Respond to Webhook1        |                                                                                                        |
| OpenAI Chat Model2       | Langchain LM Chat OpenAI         | Generates post with hashtags         | Hashtag generator /SEO     | Structured Output Parser2  |                                                                                                        |
| Structured Output Parser2| Langchain Output Parser           | Parses post content, image desc, hashtags | OpenAI Chat Model2         | Respond to Webhook1        |                                                                                                        |
| Respond to Webhook1      | Respond to Webhook               | Sends post content response          | Structured Output Parser2  | —                         | Explains output format with example screenshot (image).                                                |
| Generate image           | Webhook                          | Image generation API entry point     | —                         | HTTP Request              | Explains expected input with example API call (image).                                                 |
| HTTP Request             | HTTP Request                    | Calls OpenAI DALL-E image generation | Generate image             | Respond to Webhook2        |                                                                                                        |
| Respond to Webhook2      | Respond to Webhook               | Sends base64 image response          | HTTP Request               | —                         | Explains image output format and frontend conversion to Blob (image).                                  |
| Sticky Note              | Sticky Note                     | Documentation and explanations       | —                         | —                         | Various notes explaining inputs, outputs, and workflow rationale with embedded screenshots and links. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node "Generate 6 topics"**  
   - Type: Webhook  
   - Path: `4aebedf5-666f-40a8-925c-5ce8a5a6b967`  
   - HTTP Method: POST  
   - Response Mode: Response Node  
   - Purpose: Accepts JSON body with `api_key` (OpenAI key) and `prompt` (detailed user prompt).  

2. **Create OpenAI Chat Model Node "OpenAI Chat Model"**  
   - Type: Langchain LM Chat OpenAI  
   - Model: `gpt-4o-mini`  
   - Credentials: OpenAI API (set to use incoming `api_key` from webhook or configured credential)  
   - Connect input from "Generate 6 topics" webhook.  

3. **Create Structured Output Parser Node "Structured Output Parser"**  
   - Type: Langchain Output Parser Structured  
   - JSON Schema Example: Array of objects with keys: `title`, `rationale`, `hook`  
   - Connect input from "OpenAI Chat Model".  

4. **Create Langchain Agent Node "Content topic generator"**  
   - Type: Langchain Agent  
   - Prompt: Use expression `{{$json.body.prompt}}` from webhook input  
   - Connect AI Language Model input from "OpenAI Chat Model"  
   - Connect AI Output Parser input from "Structured Output Parser"  
   - Connect main input from "Structured Output Parser" output.  

5. **Create Respond to Webhook Node "Respond to Webhook"**  
   - Type: Respond to Webhook  
   - Response Body: Expression `{{$json.output}}`  
   - Connect input from "Content topic generator".  

---

6. **Create Webhook Node "Generate post with hashtags"**  
   - Type: Webhook  
   - Path: `691a4b8d-542c-4d58-af2d-6851c2ba0edf`  
   - HTTP Method: POST  
   - Response Mode: Response Node  
   - Purpose: Accepts JSON with `api_key`, `title`, `rationale`, and `hook` for post generation.  

7. **Create Langchain Chain LLM Node "Content creator"**  
   - Type: Langchain Chain LLM  
   - Prompt:  
     ```
     You are a linkedin content creator and copywriter. Given the title {{ $json.body.title }}, the rationale {{ $json.body.rationale }}, and suggested hook: {{ $json.body.hook }}. Generate text content for a linkedin post. Also describe a suitable image for the post.
     ```  
   - Enable output parser.  
   - Connect AI Language Model input from "OpenAI Chat Model1" (created next).  

8. **Create OpenAI Chat Model Node "OpenAI Chat Model1"**  
   - Type: Langchain LM Chat OpenAI  
   - Model: `gpt-4o-mini`  
   - Credentials: OpenAI API (use `api_key` or configured credential)  
   - Connect input from "Content creator".  

9. **Create Structured Output Parser Node "Structured Output Parser1"**  
   - Type: Langchain Output Parser Structured  
   - JSON Schema Example: Object with keys `post title`, `post content`, `image description`  
   - Connect input from "OpenAI Chat Model1".  

10. **Connect "Structured Output Parser1" output to "Content creator" node input**  
    - This forms the chain for content generation with parsing.  

11. **Create OpenAI Chat Model Node "OpenAI Chat Model2"**  
    - Type: Langchain LM Chat OpenAI  
    - Model: `gpt-4o-mini`  
    - Credentials: OpenAI API  
    - Connect input from "Hashtag generator /SEO" (optional, see below).  

12. **Create Structured Output Parser Node "Structured Output Parser2"**  
    - Type: Langchain Output Parser Structured  
    - JSON Schema Example includes keys: `post title`, `post content`, `image description`, and `Hashtags` array.  
    - Connect input from "OpenAI Chat Model2".  

13. **Create Langchain Agent Node "Hashtag generator /SEO" (Optional - disabled in original)**  
    - Type: Langchain Agent  
    - Prompt: Generate SEO hashtags based on post title and content.  
    - Connect AI Language Model input from "OpenAI Chat Model2".  
    - Connect AI Output Parser input from "Structured Output Parser2".  
    - Connect main input from "Content creator" output.  
    - Disable this node if not needed.  

14. **Create Respond to Webhook Node "Respond to Webhook1"**  
    - Type: Respond to Webhook  
    - Response Body: default (all incoming items)  
    - Connect input from "Structured Output Parser2" (or from "Hashtag generator /SEO" if enabled).  

---

15. **Create Webhook Node "Generate image"**  
    - Type: Webhook  
    - Path: `61b02992-5fde-4dd6-a7f9-8edc50e1f6c6`  
    - HTTP Method: POST  
    - Response Mode: Response Node  
    - Purpose: Accepts `api_key` and `imgDescription` in request body.  

16. **Create HTTP Request Node "HTTP Request"**  
    - Type: HTTP Request  
    - URL: `https://api.openai.com/v1/images/generations`  
    - Method: POST  
    - Authentication: Use OpenAI API credentials with bearer token (linked to webhook's `api_key` or configured credential).  
    - Body Parameters (JSON):  
      - `model`: `"dall-e-3"`  
      - `prompt`: Expression `{{$json.body.imgDescription}}`  
      - `size`: `"1024x1024"`  
      - `response_format`: `"b64_json"`  
    - Connect input from "Generate image" webhook.  

17. **Create Respond to Webhook Node "Respond to Webhook2"**  
    - Type: Respond to Webhook  
    - Response Body: default (all incoming items)  
    - Connect input from "HTTP Request".  

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| The workflow uses three dedicated webhooks to separate concerns: topic creation, post & hashtag generation, and image generation. This design ensures end-users have full control over each step of the content creation pipeline. | Sticky Note at position [-1260]; [WeWeb Template Link](https://go.weweb.io/zoYeg5g) |
| Each webhook expects an OpenAI API key (`api_key`) to be passed in the request body, allowing dynamic credential use per request. | Sticky Notes at positions [-800], [-20], [940] |
| Structured output parsers enforce strict JSON schemas on AI outputs, preventing unexpected data formats and easing frontend integration. | Multiple nodes; JSON schema examples embedded in nodes |
| The image generation webhook returns base64-encoded images which must be converted to Blob objects on the frontend to be displayed properly. | Sticky Note at position [960] |
| Hashtag generation node is present but disabled, possibly for future extension or customization. | Node "Hashtag generator /SEO" disabled |
| Workflow is tagged "weweb-version" and designed to integrate seamlessly with WeWeb UI builder for no-code frontends. | Workflow tags and sticky notes |

---

**Disclaimer:**  
The text and content described originate exclusively from an automated n8n workflow integrating OpenAI APIs, respecting all content policies. No illegal or offensive material is included. All processed data is legal and public.