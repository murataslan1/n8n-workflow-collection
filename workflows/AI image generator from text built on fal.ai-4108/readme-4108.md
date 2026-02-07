AI image generator from text built on fal.ai

https://n8nworkflows.xyz/workflows/ai-image-generator-from-text-built-on-fal-ai-4108


# AI image generator from text built on fal.ai

### 1. Workflow Overview

This workflow provides a secure API endpoint for developers and content creators to generate AI images from text prompts using the Fal.ai Flux image generation service. It is designed for integration into applications requiring on-demand, AI-powered image creation with built-in content moderation to prevent inappropriate or unsafe content.

The workflow can be logically divided into the following blocks:

- **1.1 Input Reception & Moderation:** Receives text prompts via a webhook and filters them for inappropriate content using OpenAI-based AI moderation.
- **1.2 Image Generation Request:** Submits validated prompts to Fal.ai’s Flux image generation API.
- **1.3 Polling & Retrieval:** Periodically polls Fal.ai’s API for generation status and fetches the resulting image once ready.
- **1.4 Response Delivery:** Returns either the generated image data or an error message back to the client.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Moderation

**Overview:**  
This block accepts incoming HTTP POST requests containing a text prompt, then applies AI moderation to ensure the prompt is safe for image generation. Unsafe prompts are rejected with an error.

**Nodes Involved:**  
- Webhook  
- OpenAI Chat Model  
- NSFW Filter  
- 400 Error

**Node Details:**

- **Webhook**  
  - *Type:* Webhook (HTTP POST endpoint)  
  - *Role:* Receives incoming prompt JSON payloads on path `/ai_text_to_image_generator`.  
  - *Config:* POST method, response mode set to respond via response nodes downstream.  
  - *Inputs/Outputs:* No inputs; outputs JSON with the request body including the prompt.  
  - *Edge Cases:* Malformed JSON or missing prompt field would cause downstream failures.  
  - *Notes:* Entry point for the workflow.

- **OpenAI Chat Model**  
  - *Type:* AI Language Model (OpenAI Chat)  
  - *Role:* Processes the prompt text to assist the NSFW filter node, possibly for classification or context refinement.  
  - *Config:* Uses OpenAI API credentials under the “Marketing OpenAI” credential set.  
  - *Inputs:* Receives webhook data.  
  - *Outputs:* Passes processed data to NSFW Filter.  
  - *Edge Cases:* API key invalid, rate limits, or network errors could fail this step.

- **NSFW Filter**  
  - *Type:* Text Classifier (Langchain Node)  
  - *Role:* Classifies the prompt text as “NSFW” (not safe for work) or “SFW” (safe for work).  
  - *Config:* Categories set explicitly to “NSFW” and “SFW”, fallback category “other”. Input text is the prompt from the webhook body.  
  - *Inputs:* Receives output from OpenAI Chat Model.  
  - *Outputs:* If “NSFW”, routes to 400 Error; if “SFW”, continues to Submit Request; fallback routes to 400 Error as well.  
  - *Edge Cases:* Misclassification, API errors, or empty prompt inputs.

- **400 Error**  
  - *Type:* Respond To Webhook  
  - *Role:* Returns HTTP 400 with JSON error indicating prompt violates terms of use.  
  - *Config:* Response code 400, fixed JSON error message.  
  - *Inputs:* Triggered from NSFW Filter on inappropriate content.  
  - *Outputs:* Ends workflow for invalid requests.

---

#### 1.2 Image Generation Request

**Overview:**  
Submits the validated prompt to the Fal.ai Flux image generation API to start the rendering process.

**Nodes Involved:**  
- Submit Request

**Node Details:**

- **Submit Request**  
  - *Type:* HTTP Request  
  - *Role:* Posts the prompt JSON to Fal.ai Flux API endpoint to initiate image generation.  
  - *Config:* POST to `https://queue.fal.run/fal-ai/flux/schnell` with JSON body: `{"prompt": "<user_prompt>"}`. Uses HTTP Header Auth with Fal.ai API key. Sets `Content-Type` to `application/json`.  
  - *Inputs:* Receives prompt data from NSFW filter’s safe output.  
  - *Outputs:* Outputs JSON containing a `request_id` for status polling.  
  - *Edge Cases:* API key invalid, network errors, prompt rejected by Fal.ai, malformed response.

---

#### 1.3 Polling & Retrieval

**Overview:**  
Periodically polls the Fal.ai API to check if image generation is complete, then fetches the final image result.

**Nodes Involved:**  
- Fetch Status  
- Is Ready?  
- Wait  
- Fetch Result

**Node Details:**

- **Fetch Status**  
  - *Type:* HTTP Request  
  - *Role:* Queries Fal.ai API with the current `request_id` to check job status.  
  - *Config:* GET request to `https://queue.fal.run/fal-ai/flux/requests/{{ request_id }}/status` with HTTP Header Auth.  
  - *Inputs:* Receives `request_id` from Submit Request or Wait node.  
  - *Outputs:* Returns status JSON including state (`COMPLETED` or others).  
  - *Edge Cases:* Network failure, invalid request_id, expired jobs.

- **Is Ready?**  
  - *Type:* If Node  
  - *Role:* Checks if the `status` field from Fetch Status equals `COMPLETED`.  
  - *Config:* Condition with strict string equals comparison to "COMPLETED".  
  - *Inputs:* Receives status JSON from Fetch Status.  
  - *Outputs:* If true, routes to Fetch Result; if false, routes to Wait.  
  - *Edge Cases:* Missing or malformed status field.

- **Wait**  
  - *Type:* Wait Node  
  - *Role:* Pauses workflow for 1 second before polling again.  
  - *Config:* Wait time set to 1 second.  
  - *Inputs:* Receives output from Is Ready? false branch.  
  - *Outputs:* Routes back to Fetch Status node for retry.  
  - *Edge Cases:* Long polling may cause delays or timeout in client expectations.

- **Fetch Result**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves the final generated image URL and metadata from Fal.ai once job is complete.  
  - *Config:* GET request to the URL provided in the previous response’s `response_url` field using HTTP Header Auth.  
  - *Inputs:* Receives the JSON containing `response_url` from Is Ready? true branch.  
  - *Outputs:* Returns image data JSON.  
  - *Edge Cases:* URL invalid, network failure, expired links.

---

#### 1.4 Response Delivery

**Overview:**  
Sends the final image data or error message back to the API client.

**Nodes Involved:**  
- Success (Respond to Webhook)  
- 400 Error (already described)

**Node Details:**

- **Success**  
  - *Type:* Respond To Webhook  
  - *Role:* Returns HTTP 200 with JSON containing the generated images array.  
  - *Config:* Responds with JSON: `{"error": null, "result": <images_array>}` where `images_array` is extracted from the Fetch Result node’s output.  
  - *Inputs:* Receives image data from Fetch Result.  
  - *Outputs:* Ends workflow with success response.  
  - *Edge Cases:* Empty or missing images array.

---

### 3. Summary Table

| Node Name        | Node Type                     | Functional Role                                | Input Node(s)            | Output Node(s)           | Sticky Note                                                                                                            |
|------------------|-------------------------------|-----------------------------------------------|--------------------------|--------------------------|------------------------------------------------------------------------------------------------------------------------|
| Webhook          | Webhook                       | Receives text prompt through HTTP POST       | -                        | OpenAI Chat Model, NSFW Filter | ## Receives text prompt through a webhook endpoint and filters the prompt for inappropriate content using AI moderation |
| OpenAI Chat Model| AI Language Model (OpenAI Chat)| Assists in prompt moderation                   | Webhook                  | NSFW Filter              |                                                                                                                        |
| NSFW Filter      | Text Classifier (Langchain)    | Classifies prompt as NSFW or SFW               | OpenAI Chat Model         | Submit Request, 400 Error |                                                                                                                        |
| 400 Error        | Respond To Webhook             | Returns error response for inappropriate prompts | NSFW Filter (NSFW branch) | -                        |                                                                                                                        |
| Submit Request   | HTTP Request                  | Submits prompt to Fal.ai Flux API              | NSFW Filter (SFW branch)  | Fetch Status             | ## Submits valid prompts to the Fal.ai and polls for completion status and retrieves the generated image when ready\n\nFal.ai is a model inference and finetuning service dedicated to AI image and video. It hosts many popular third party models including Flux by Black Forest Labs.\n\nSign up here - https://fal.ai - for an api key. |
| Fetch Status     | HTTP Request                  | Polls Fal.ai for generation status             | Submit Request, Wait      | Is Ready?                |                                                                                                                        |
| Is Ready?        | If                            | Checks if image generation is completed        | Fetch Status              | Fetch Result, Wait       |                                                                                                                        |
| Wait             | Wait                          | Waits 1 second before polling again             | Is Ready? (false branch)  | Fetch Status             |                                                                                                                        |
| Fetch Result     | HTTP Request                  | Retrieves generated image data                   | Is Ready? (true branch)   | Success                  |                                                                                                                        |
| Success          | Respond To Webhook             | Returns generated images to client              | Fetch Result              | -                        |                                                                                                                        |
| Sticky Note1     | Sticky Note                   | Overview of input reception and moderation      | -                        | -                        | ## Receives text prompt through a webhook endpoint and filters the prompt for inappropriate content using AI moderation |
| Sticky Note2     | Sticky Note                   | Overview of submission and polling to Fal.ai    | -                        | -                        | ## Submits valid prompts to the Fal.ai and polls for completion status and retrieves the generated image when ready\n\nFal.ai is a model inference and finetuning service dedicated to AI image and video. It hosts many popular third party models including Flux by Black Forest Labs.\n\nSign up here - https://fal.ai - for an api key. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Method: POST  
   - Path: `ai_text_to_image_generator`  
   - Response Mode: Use response nodes downstream  
   - No authentication required.

2. **Create OpenAI Chat Model Node**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Connect input from Webhook node main output  
   - Credentials: Configure with valid OpenAI API key (e.g., "Marketing OpenAI")  
   - Use default options.

3. **Create NSFW Filter Node**  
   - Type: `@n8n/n8n-nodes-langchain.textClassifier`  
   - Input Text: Expression `{{$json.body.prompt}}`  
   - Categories:  
     - NSFW: "text is NSFW"  
     - SFW: "text is SFW"  
   - Fallback Category: "other"  
   - Connect input from OpenAI Chat Model node.  
   - On NSFW or fallback output, connect to 400 Error node.  
   - On SFW output, connect to Submit Request node.

4. **Create 400 Error Node**  
   - Type: Respond To Webhook  
   - Response Code: 400  
   - Response Body (JSON):  
     ```json
     {
       "error": "Prompt is in violation of terms of use. Please try again.",
       "result": []
     }
     ```
   - Connect inputs from NSFW Filter NSFW and fallback outputs.

5. **Create Submit Request Node**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://queue.fal.run/fal-ai/flux/schnell`  
   - Authentication: HTTP Header Auth with Fal.ai API key credential  
   - Headers: `Content-Type: application/json`  
   - Body: JSON, send body enabled, expression:  
     ```json
     {"prompt": "{{$json.body.prompt}}"}
     ```
   - Connect input from NSFW Filter SFW output.

6. **Create Fetch Status Node**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: Expression:  
     ```
     https://queue.fal.run/fal-ai/flux/requests/{{$json.request_id}}/status
     ```  
   - Authentication: HTTP Header Auth with Fal.ai API key credential  
   - Connect input from Submit Request node output and from Wait node (for retries).

7. **Create Is Ready? Node**  
   - Type: If  
   - Condition: Check if `{{$json.status}}` equals `COMPLETED` (case sensitive, strict)  
   - Connect input from Fetch Status node output.  
   - True branch connects to Fetch Result node.  
   - False branch connects to Wait node.

8. **Create Wait Node**  
   - Type: Wait  
   - Duration: 1 second  
   - Connect input from Is Ready? false branch.  
   - Output connects back to Fetch Status node for polling.

9. **Create Fetch Result Node**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: Expression `{{$json.response_url}}` (from Is Ready? true branch output)  
   - Authentication: HTTP Header Auth with Fal.ai API key credential  
   - Connect input from Is Ready? true branch.

10. **Create Success Node**  
    - Type: Respond To Webhook  
    - Response Body (JSON):  
      ```json
      {
        "error": null,
        "result": {{$json.images}}
      }
      ```
    - Connect input from Fetch Result node output.

11. **Set Credentials**  
    - Configure OpenAI API credentials for OpenAI Chat Model node.  
    - Configure HTTP Header Auth credentials with Fal.ai API key for Submit Request, Fetch Status, and Fetch Result nodes.

12. **Deploy Workflow and Note Webhook URL**  
    - Deploy and use the webhook URL for client POST requests with JSON body containing `prompt`.

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                          |
|----------------------------------------------------------------------------------------------------------------|-----------------------------------------|
| Fal.ai is a dedicated AI model inference and finetuning service for image and video generation.                 | https://fal.ai                          |
| Sign up for Fal.ai API key to enable integration with this workflow.                                           | https://fal.ai                          |
| This workflow uses OpenAI for content moderation to ensure safe and compliant prompt inputs.                   | Requires OpenAI API key configured in n8n |
| The workflow includes a 1-second polling interval for status checks, adjustable based on performance needs.    | Polling interval configurable in Wait node |
| Prompt JSON example for testing: `{"prompt": "A person sitting under a moonlit sky"}`                           | Example test payload                   |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.