Automated AI Media Creation with MagicHour AI and GPT-4 Prompt Optimization

https://n8nworkflows.xyz/workflows/automated-ai-media-creation-with-magichour-ai-and-gpt-4-prompt-optimization-9853


# Automated AI Media Creation with MagicHour AI and GPT-4 Prompt Optimization

### 1. Workflow Overview

This workflow automates the creation of AI-generated media assets (images or videos) by integrating MagicHour AI's media generation API with OpenAI's GPT-4 prompt optimization. It accepts HTTP POST requests containing structured parameters, dynamically generates detailed prompts optimized for AI generation, submits these to MagicHour AI's services, polls for completion, and finally downloads and returns the generated media.

Logical blocks:

- **1.1 Input Reception and Parameter Preparation**: Receives webhook POST requests and extracts relevant parameters for image or video generation.
- **1.2 Prompt Generation with GPT-4**: Uses OpenAI GPT-4 to generate detailed, structured prompts suitable for MagicHour AI’s image or video generation APIs.
- **1.3 Media Generation Request to MagicHour AI**: Sends requests to MagicHour AI’s image or video generation endpoints with the generated prompt and user parameters.
- **1.4 Status Polling and Completion Check**: Waits and queries the MagicHour API to check generation status until completion or error.
- **1.5 Media Download and Response**: Downloads the produced media files and responds to the original webhook caller.
- **1.6 Error Handling**: Captures and responds with error details from MagicHour AI or HTTP request failures.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Parameter Preparation

- **Overview**: Handles incoming webhook POST requests, extracts and normalizes user input parameters for downstream processing, and routes flow based on media type (image or video).
- **Nodes Involved**:  
  - Webhook  
  - If (checks media type)  
  - Get Data from Webhook (sets standardized fields for image generation)  
  - Edit Fields2 (sets standardized fields for video generation)

- **Node Details**:

  - **Webhook**  
    - Type: HTTP Webhook (Trigger)  
    - Configuration: Accepts POST requests on path `/generate-image`, allows all origins, synchronous response mode.  
    - Inputs: HTTP POST request from external client.  
    - Outputs: JSON payload with user parameters.  
    - Edge cases: Invalid or missing JSON body, unsupported HTTP methods.

  - **If (media type check)**  
    - Type: Conditional node  
    - Configuration: Checks if `body.type` equals `"image"`.  
    - Inputs: Webhook output.  
    - Outputs: Routes to image processing if true; else video processing.  
    - Edge cases: Missing or malformed `body.type` field.

  - **Get Data from Webhook**  
    - Type: Set node  
    - Configuration: Extracts and maps nested user input fields into normalized structure for image generation prompt.  
    - Inputs: From If node (image branch).  
    - Outputs: Standardized JSON for prompt generation with fields like `body.prompt`, `body.parameters.style.tool`, `body.parameters.image_count`.  
    - Key expressions: Accesses nested JSON via expressions like `{{$json.body.parameters.style.prompt}}`.  
    - Edge cases: Missing nested fields; no validation beyond presence.

  - **Edit Fields2**  
    - Type: Set node  
    - Configuration: Similar to above but normalizes parameters for video generation (e.g., duration, resolution).  
    - Inputs: From If node (video branch).  
    - Outputs: Standardized JSON for video prompt generation.  
    - Key expressions: Uses expressions to map inputs from webhook JSON.  
    - Edge cases: Missing or invalid video-specific fields.

#### 2.2 Prompt Generation with GPT-4

- **Overview**: Uses OpenAI GPT-4 to generate detailed, concise, and structured prompts from minimal user input for either image or video generation.
- **Nodes Involved**:  
  - Generate Image Prompt (OpenAI node)  
  - Generate video Prompt (OpenAI node)

- **Node Details**:

  - **Generate Image Prompt**  
    - Type: OpenAI API node (LangChain wrapper)  
    - Configuration: Uses GPT-4.1 with temperature 0.5 and topP 1 for consistent, descriptive prompt generation.  
    - Inputs: Normalized image parameters from "Get Data from Webhook".  
    - Outputs: Single string prompt optimized for text-to-image models.  
    - Key expressions: Input prompt content dynamically built from user JSON fields.  
    - Version specifics: Requires OpenAI API v1.8+ nodes.  
    - Edge cases: Ambiguous or incomplete user inputs cause prompt generation to request clarification (per system prompt). API errors or rate limits possible.

  - **Generate video Prompt**  
    - Type: OpenAI API node (LangChain wrapper)  
    - Configuration: GPT-4.1 with temperature 0.6 and topP 1, tailored for video prompt generation.  
    - Inputs: Normalized video parameters from "Edit Fields2".  
    - Outputs: Single string prompt optimized for text-to-video models.  
    - Key expressions: Dynamically builds content from user inputs.  
    - Edge cases: Same as image prompt generation.

#### 2.3 Media Generation Request to MagicHour AI

- **Overview**: Sends the generated prompt and parameters to MagicHour AI’s image or video generation API endpoints, initiating media creation.
- **Nodes Involved**:  
  - ai-image-generator (HTTP Request)  
  - text-to-video (HTTP Request)

- **Node Details**:

  - **ai-image-generator**  
    - Type: HTTP Request  
    - Configuration: POST to `https://api.magichour.ai/v1/ai-image-generator` with JSON body including name, image count, orientation, style prompt, and tool. Authentication via HTTP Bearer token credential for MagicHour AI.  
    - Inputs: Prompt output from "Generate Image Prompt", parameters from "Get Data from Webhook".  
    - Outputs: JSON response containing generation job ID, credits charged, and estimated frame cost.  
    - OnError: Continues with error output to allow error handling downstream.  
    - Edge cases: API errors, auth failures, invalid parameter format.

  - **text-to-video**  
    - Type: HTTP Request  
    - Configuration: POST to `https://api.magichour.ai/v1/text-to-video` with JSON body including name, duration, orientation, resolution, and style prompt. Same authentication as above.  
    - Inputs: Prompt from "Generate video Prompt", parameters from "Edit Fields2".  
    - Outputs: Similar job ID and cost info.  
    - OnError: Continues with error output.  
    - Edge cases: Same as image generator.

#### 2.4 Status Polling and Completion Check

- **Overview**: Periodically polls MagicHour AI’s API to check the status of media generation jobs until they reach a terminal state (complete, error, or cancelled).
- **Nodes Involved**:  
  - Wait (Delay node)  
  - Get Image Details (HTTP Request)  
  - If1 (Check image status)  
  - Get Video Details (HTTP Request)  
  - If4 (Check video status)  
  - If2 (Check for valid job ID and credits charged)  
  - If3 (Branch based on media type to route polling)  
  - Wait1 (Delay for video polling)

- **Node Details**:

  - **Wait / Wait1**  
    - Type: Wait node  
    - Configuration: Delays execution between status polls.  
    - Inputs: From previous status check or media request nodes.  
    - Edge cases: No explicit timeout configured; potential infinite polling if API never returns terminal status.

  - **Get Image Details**  
    - Type: HTTP Request  
    - Configuration: GET request to MagicHour API to retrieve image generation status using job ID from `ai-image-generator`. Authenticated via bearer token.  
    - Outputs: JSON with status field (e.g., "queued", "rendering", "complete", "error", "cancelled").  
    - Edge cases: API errors, invalid IDs.

  - **If1**  
    - Type: Conditional  
    - Configuration: Checks if image status is one of `complete`, `error`, or `cancelled` to determine if polling should stop and proceed.  
    - Outputs: If true, proceeds to download; else waits and polls again.

  - **Get Video Details**  
    - Type: HTTP Request  
    - Configuration: Similar GET request for video job status.  
    - Inputs: From Wait1 after delay.  
    - Outputs: Status JSON.  
    - Edge cases: Same as image details.

  - **If4**  
    - Type: Conditional  
    - Configuration: Checks video status terminal states as above.  
    - Outputs: If complete, proceed; else poll again.

  - **If2**  
    - Type: Conditional  
    - Configuration: Validates that job ID is not empty and credits charged is greater than zero before proceeding.  
    - Outputs: Routes to success flow or error handling.  
    - Edge cases: Zero or empty job ID implies failed request.

  - **If3**  
    - Type: Conditional  
    - Configuration: Re-checks media type to route polling either to image or video wait nodes. This handles different polling loops for images vs videos.

#### 2.5 Media Download and Response

- **Overview**: After successful generation, downloads the media file(s) from MagicHour AI URLs and sends the file back in the webhook response.
- **Nodes Involved**:  
  - Download Image (HTTP Request)  
  - Download Video (HTTP Request)  
  - Respond to Webhook (Response node)

- **Node Details**:

  - **Download Image**  
    - Type: HTTP Request  
    - Configuration: GET request to URL provided in MagicHour image project downloads array (`downloads[0].url`).  
    - Inputs: From If1 terminal branch on complete status.  
    - Outputs: Binary media data to send back.  
    - Edge cases: Download failures, broken URLs.

  - **Download Video**  
    - Type: HTTP Request  
    - Configuration: Same as image but for video downloads.  
    - Inputs: From If4 terminal branch on complete status.

  - **Respond to Webhook**  
    - Type: Response node  
    - Configuration: Sends the downloaded media back as HTTP response to the original webhook caller.  
    - Inputs: Media file from download nodes or error details.  
    - Edge cases: Large file sizes may cause timeout or memory issues.

#### 2.6 Error Handling

- **Overview**: Captures error messages and codes from MagicHour API or HTTP request failures and returns structured error information to the webhook caller.
- **Nodes Involved**:  
  - Get Error Details (Set node)  
  - Respond to Webhook (Response node)  
  - Sticky Note4 (documentation)

- **Node Details**:

  - **Get Error Details**  
    - Type: Set node  
    - Configuration: Extracts error message, code, HTTP status, and finish reason from error output JSON.  
    - Inputs: From HTTP request nodes on error branch.  
    - Outputs: Structured error JSON.  
    - Edge cases: Missing or partial error info.

  - **Respond to Webhook**  
    - Sends error JSON back to the caller.

  - **Sticky Note4**  
    - Documentation explaining that this error capture only applies to HTTP request errors, not internal generation errors.

---

### 3. Summary Table

| Node Name            | Node Type                 | Functional Role                        | Input Node(s)                 | Output Node(s)                 | Sticky Note                                                                                          |
|----------------------|---------------------------|-------------------------------------|------------------------------|-------------------------------|----------------------------------------------------------------------------------------------------|
| Webhook              | HTTP Webhook              | Entry point, receives user requests | None                         | If                            |                                                                                                    |
| If                   | Conditional               | Routes flow by media type (image/video) | Webhook                      | Get Data from Webhook, Edit Fields2 |                                                                                                    |
| Get Data from Webhook | Set                       | Normalizes image input parameters    | If                           | Generate Image Prompt          |                                                                                                    |
| Edit Fields2         | Set                       | Normalizes video input parameters    | If                           | Generate video Prompt          |                                                                                                    |
| Generate Image Prompt | OpenAI API (LangChain)    | Generates detailed image prompt      | Get Data from Webhook         | ai-image-generator             |                                                                                                    |
| Generate video Prompt | OpenAI API (LangChain)    | Generates detailed video prompt      | Edit Fields2                 | text-to-video                 |                                                                                                    |
| ai-image-generator    | HTTP Request              | Sends image generation request       | Generate Image Prompt         | If2, Get Error Details         |                                                                                                    |
| text-to-video         | HTTP Request              | Sends video generation request       | Generate video Prompt         | If2, Get Error Details         |                                                                                                    |
| If2                   | Conditional               | Validates job ID & credits charged   | ai-image-generator, text-to-video | If3, (empty branch)           |                                                                                                    |
| If3                   | Conditional               | Routes to image or video wait nodes  | If2                          | Wait (image), Wait1 (video)    |                                                                                                    |
| Wait                  | Wait                      | Delay between image status polls     | If3                          | Get Image Details              |                                                                                                    |
| Wait1                 | Wait                      | Delay between video status polls     | If3                          | Get Video Details              |                                                                                                    |
| Get Image Details     | HTTP Request              | Retrieves image generation status    | Wait                         | If1                           |                                                                                                    |
| Get Video Details     | HTTP Request              | Retrieves video generation status    | Wait1                        | If4                           |                                                                                                    |
| If1                   | Conditional               | Checks image generation completion   | Get Image Details            | Download Image, Wait           | Sticky Note: Explains image statuses and polling logic                                             |
| If4                   | Conditional               | Checks video generation completion   | Get Video Details            | Download Video, Wait1          |                                                                                                    |
| Download Image        | HTTP Request              | Downloads generated image file       | If1                          | Respond to Webhook             | Sticky Note: GET request to download created image or video file                                   |
| Download Video        | HTTP Request              | Downloads generated video file       | If4                          | Respond to Webhook             |                                                                                                    |
| Respond to Webhook    | Respond Node              | Sends final media or error response  | Download Image, Download Video, Get Error Details | None                     |                                                                                                    |
| Get Error Details     | Set                       | Extracts error info from HTTP failures | ai-image-generator, text-to-video | Respond to Webhook             | Sticky Note: Captures HTTP request errors, not internal generation errors                         |
| Sticky Note           | Sticky Note               | Explains image status codes and polling | None                         | None                          |                                                                                                    |
| Sticky Note1          | Sticky Note               | POST request format and credential note | None                         | None                          | Explains required JSON request body format for MagicHour AI                                       |
| Sticky Note2          | Sticky Note               | Explains GET request to download media | None                         | None                          |                                                                                                    |
| Sticky Note3          | Sticky Note               | POST request response format example | None                         | None                          |                                                                                                    |
| Sticky Note4          | Sticky Note               | Captures HTTP error handling scope   | None                         | None                          |                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook node**  
   - Name: `Webhook`  
   - Path: `/generate-image`  
   - HTTP Method: POST  
   - Response Mode: `responseNode`  
   - Allowed Origins: `*`  
   - Purpose: Entry point to receive JSON requests from clients.

2. **Add an If node to check media type**  
   - Name: `If`  
   - Condition: Check if `{{$json.body.type}}` equals `"image"`  
   - Routes: True branch for images, False branch for videos.

3. **For Image branch: Create a Set node**  
   - Name: `Get Data from Webhook`  
   - Purpose: Normalize the incoming webhook JSON into a structured format for image prompt generation.  
   - Assignments: Copy fields like `body.prompt = $json.body.parameters.style.prompt`, `body.parameters.style.tool`, `body.parameters.image_count`, `body.parameters.orientation`, `body.parameters.name`, `body.type`, and `body.action`.

4. **For Video branch: Create a Set node**  
   - Name: `Edit Fields2`  
   - Purpose: Normalize webhook parameters for video prompt generation.  
   - Assignments: Map fields such as `body.prompt` from style prompt, `body.parameters.name`, `body.parameters.end_seconds`, `body.parameters.orientation`, and `body.parameters.resolution`.

5. **Create OpenAI node for image prompt generation**  
   - Name: `Generate Image Prompt`  
   - Type: OpenAI (LangChain wrapper)  
   - Model: GPT-4.1  
   - Temperature: 0.5, TopP: 1  
   - Input: Use structured JSON from `Get Data from Webhook` to craft a system prompt and user message that instruct GPT to generate a detailed image prompt.  
   - Credentials: OpenAI API credentials configured.

6. **Create OpenAI node for video prompt generation**  
   - Name: `Generate video Prompt`  
   - Type: OpenAI (LangChain wrapper)  
   - Model: GPT-4.1  
   - Temperature: 0.6, TopP: 1  
   - Input: Use structured JSON from `Edit Fields2` for prompt generation similarly.  
   - Credentials: Same OpenAI API credentials.

7. **Create HTTP Request node for MagicHour AI image generation**  
   - Name: `ai-image-generator`  
   - Method: POST  
   - URL: `https://api.magichour.ai/v1/ai-image-generator`  
   - Authentication: HTTP Bearer Auth with MagicHour AI token  
   - JSON Body: Include `name`, `image_count`, `orientation`, `style` with `prompt` from `Generate Image Prompt` output, and `tool` from input.  
   - OnError: Continue with error output to capture errors downstream.

8. **Create HTTP Request node for MagicHour AI video generation**  
   - Name: `text-to-video`  
   - Method: POST  
   - URL: `https://api.magichour.ai/v1/text-to-video`  
   - Authentication: HTTP Bearer Auth with MagicHour AI token  
   - JSON Body: Include `name`, `end_seconds`, `orientation`, `resolution`, and style prompt from `Generate video Prompt`.  
   - OnError: Continue with error output.

9. **Create If node to validate job ID and credits charged**  
   - Name: `If2`  
   - Conditions: `id` field not empty AND `credits_charged` > 0, else error branch.

10. **Create If node to branch polling by media type**  
    - Name: `If3`  
    - Condition: Check if original input type is image or video.

11. **Create Wait node for image polling**  
    - Name: `Wait`  
    - Default wait duration (e.g., 5-10 seconds).

12. **Create Wait node for video polling**  
    - Name: `Wait1`  
    - Default wait duration (e.g., 5-10 seconds).

13. **Create HTTP Request for getting image status**  
    - Name: `Get Image Details`  
    - Method: GET  
    - URL: `https://api.magichour.ai/v1/image-projects/{{job_id}}` (replace `{{job_id}}` dynamically from `ai-image-generator` output)  
    - Authentication: Same bearer token.

14. **Create HTTP Request for getting video status**  
    - Name: `Get Video Details`  
    - Method: GET  
    - URL: `https://api.magichour.ai/v1/video-projects/{{job_id}}`  
    - Authentication: Same bearer token.

15. **Create If node to check image status terminal states**  
    - Name: `If1`  
    - Conditions: status equals `complete`, `error`, or `cancelled`.

16. **Create If node to check video status terminal states**  
    - Name: `If4`  
    - Conditions: status equals `complete`, `error`, or `cancelled`.

17. **Create HTTP Request node to download image**  
    - Name: `Download Image`  
    - Method: GET  
    - URL: Use first download URL from `Get Image Details` response (`downloads[0].url`).

18. **Create HTTP Request node to download video**  
    - Name: `Download Video`  
    - Method: GET  
    - URL: Use first download URL from `Get Video Details` response.

19. **Create Set node to extract error details**  
    - Name: `Get Error Details`  
    - Extract fields: `error.message`, `error.code`, `error.status`, `finish_reason` from error output.

20. **Create Respond to Webhook node**  
    - Name: `Respond to Webhook`  
    - Sends the final binary media file or error JSON response back to the original caller.

21. **Connect nodes as per logical flow**:  
    - Webhook → If (image/video) →  
      - Image: Get Data from Webhook → Generate Image Prompt → ai-image-generator → If2 → If3 → Wait → Get Image Details → If1 → Download Image → Respond to Webhook  
      - Video: Edit Fields2 → Generate video Prompt → text-to-video → If2 → If3 → Wait1 → Get Video Details → If4 → Download Video → Respond to Webhook  
    - Error branches from ai-image-generator and text-to-video → Get Error Details → Respond to Webhook

22. **Add sticky notes** to document request formats and status codes for maintainability.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                   | Context or Link                                                                                     |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| POST request body must follow JSON structure with fields: `name` (string), `image_count` (number), `orientation` (string), and `style` object including `prompt` (string) and `tool` (string).                                                   | Sticky Note1                                                                                      |
| MagicHour AI image status can be: `queued`, `rendering`, `complete`, `error`, or `cancelled`. Polling loop waits until terminal status before proceeding to download.                                                                          | Sticky Note (near If1)                                                                            |
| GET requests are used to download generated media files after completion.                                                                                                                                                                     | Sticky Note2                                                                                      |
| POST response from MagicHour AI includes job `id`, `estimated_frame_cost`, and `credits_charged`.                                                                                                                                               | Sticky Note3                                                                                      |
| HTTP request error handling captures errors occurring during HTTP calls, but does not capture internal generation errors from MagicHour AI API responses.                                                                                     | Sticky Note4                                                                                      |
| OpenAI GPT-4 prompt generation enforces strict constraints to avoid hallucinations, emotional tone, or content outside user input.                                                                                                           | System prompt in OpenAI nodes                                                                     |
| Credentials required: OpenAI API key and MagicHour AI Bearer token. Both must be configured and securely stored in n8n credentials.                                                                                                          | Credential references in HTTP Request and OpenAI nodes                                           |
| This workflow is designed to be extensible to other media types or AI services by following the modular blocks and prompt generation approach.                                                                                               | General recommendation                                                                            |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.