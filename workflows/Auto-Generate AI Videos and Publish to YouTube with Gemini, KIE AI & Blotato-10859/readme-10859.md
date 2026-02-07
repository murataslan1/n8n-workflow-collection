Auto-Generate AI Videos and Publish to YouTube with Gemini, KIE AI & Blotato

https://n8nworkflows.xyz/workflows/auto-generate-ai-videos-and-publish-to-youtube-with-gemini--kie-ai---blotato-10859


# Auto-Generate AI Videos and Publish to YouTube with Gemini, KIE AI & Blotato

---

### 1. Workflow Overview

This workflow automates the creation and publication of AI-generated short videos to YouTube using a combination of Google Gemini for script generation, KIE AI for video rendering, and Blotato for media upload and publishing. It is designed for content creators, marketers, and automation enthusiasts who want to regularly publish videos without manual intervention.

The workflow is structured into the following logical blocks:

- **1.1 Scheduler and Random Template Selection**: Periodically triggers the workflow and selects a random video template.
- **1.2 AI Script Generation with Google Gemini**: Generates a structured video title, description, and prompt based on the selected template.
- **1.3 Video Creation via KIE AI**: Sends the AI-generated prompt to KIE AI for video rendering, waits for completion, and retrieves the finished video URL.
- **1.4 Media Upload and YouTube Publishing with Blotato**: Uploads the rendered video to Blotato and publishes it automatically to the connected YouTube channel.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduler and Random Template Selection

- **Overview:**  
  This block initiates the workflow execution every 12 hours and selects a random integer between 1 and 7 to choose a video template for AI content generation.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Code in JavaScript

- **Node Details:**

  1. **Schedule Trigger**  
     - *Type & Role:* n8n built-in trigger node that fires workflow executions on a schedule.  
     - *Configuration:* Set to trigger every 12 hours (`hoursInterval: 12`).  
     - *Input/Output:* No input; output triggers the next node.  
     - *Failure Modes:* Scheduler misconfiguration or system downtime may delay triggers.

  2. **Code in JavaScript**  
     - *Type & Role:* Executes JavaScript code to generate a random number between 1 and 7.  
     - *Configuration:* Code generates `randomNumber` variable, returned as JSON output.  
     - *Key Expression:* `Math.floor(Math.random() * 7) + 1` ensures uniform random integer in range.  
     - *Input:* Trigger from Schedule Trigger.  
     - *Output:* JSON object with `randomNumber` property.  
     - *Failure Modes:* JavaScript execution errors are minimal but could occur if environment issues arise.

---

#### 2.2 AI Script Generation with Google Gemini

- **Overview:**  
  Generates a structured JSON object containing a video title, description, and prompt text using Google Gemini AI, based on the random template number.

- **Nodes Involved:**  
  - Prompter (Langchain Agent)  
  - Google Gemini Chat Model  
  - Structured Output Parser

- **Node Details:**

  1. **Prompter**  
     - *Type & Role:* Langchain AI Agent node that manages the prompt to AI and applies an output parser.  
     - *Configuration:*  
       - Input prompt requests generation of `title`, `description`, and `prompt` for the selected template number.  
       - Uses a system message defining the AI's role as “AI that generates random video prompts”.  
       - Output parser enabled to ensure structured output.  
     - *Key Expressions:*  
       - Input prompt: `"Generate a (title, description, and prompt) for template number: {{ $json.randomNumber }}. Return only valid minified JSON that matches the required schema."`  
     - *Input:* Receives `randomNumber` from Code node.  
     - *Output:* AI-generated raw response passed to Google Gemini Chat Model.

  2. **Google Gemini Chat Model**  
     - *Type & Role:* Language Model node interfacing with Google Gemini API to generate chat completions.  
     - *Configuration:* Default options; relies on external Google Gemini credentials (API key).  
     - *Input:* Receives prompt text from Prompter.  
     - *Output:* Raw AI response forwarded to Structured Output Parser.  
     - *Failure Modes:* API authentication errors, rate limits, or network timeouts.

  3. **Structured Output Parser**  
     - *Type & Role:* Parses the AI response to enforce a JSON schema with fields `title`, `description`, and `prompt`.  
     - *Configuration:*  
       - Schema strictly requires `title`, `description`, and `prompt` as strings.  
       - Auto-fix enabled to correct formatting issues.  
     - *Input:* Raw text from Google Gemini.  
     - *Output:* Validated and parsed JSON object passed back to Prompter node as structured output.  
     - *Failure Modes:* Parsing failures if AI output is malformed beyond auto-fix capability.

---

#### 2.3 Video Creation via KIE AI

- **Overview:**  
  Sends the AI-generated prompt to KIE AI’s video generation API, waits for rendering completion, then retrieves the resulting video URL.

- **Nodes Involved:**  
  - Create video (HTTP Request)  
  - Wait  
  - Get Video (HTTP Request)

- **Node Details:**

  1. **Create video**  
     - *Type & Role:* HTTP Request node that creates a video rendering job at KIE AI.  
     - *Configuration:*  
       - POST to `https://api.kie.ai/api/v1/jobs/createTask` with JSON body containing:  
         - Model: `sora-2-text-to-video`  
         - Callback URL (placeholder `https://example.com/callback`) — note: not used in this workflow.  
         - Input: prompt from AI, portrait aspect ratio, 10 frames, watermark removal enabled.  
       - Authentication: HTTP Header with generic credentials (requires KIE AI API key).  
     - *Input:* Receives parsed prompt JSON from Prompter output.  
     - *Output:* Task creation response including `taskId`.  
     - *Failure Modes:* Authentication errors, invalid prompt, API downtime.

  2. **Wait**  
     - *Type & Role:* Pauses workflow execution for 400 seconds (approx. 6.7 minutes) to allow video rendering.  
     - *Configuration:* Fixed wait time of 400 seconds.  
     - *Input:* Triggered after job creation.  
     - *Output:* Passes control to next node after wait.  
     - *Failure Modes:* Fixed wait may be inefficient; if rendering takes longer, subsequent steps may fail.

  3. **Get Video**  
     - *Type & Role:* HTTP Request node that polls KIE AI API to get video rendering status and URLs.  
     - *Configuration:*  
       - GET request to `https://api.kie.ai/api/v1/jobs/recordInfo` with query parameter `taskId` from previous job creation response.  
       - Same authentication as Create video.  
     - *Input:* Receives `taskId` from Create video node’s output.  
     - *Output:* JSON response including video URLs in `resultJson`.  
     - *Failure Modes:* If video is not ready, API may return incomplete data; no retry loop here.

---

#### 2.4 Media Upload and YouTube Publishing with Blotato

- **Overview:**  
  Uploads the finalized video media URL to Blotato and automatically publishes it as a YouTube post with the generated title and description.

- **Nodes Involved:**  
  - Upload media (Blotato node)  
  - Create post (Blotato node)

- **Node Details:**

  1. **Upload media**  
     - *Type & Role:* Blotato media upload node that takes a video URL and uploads it to the Blotato platform.  
     - *Configuration:*  
       - Media URL extracted by parsing `resultJson` from `Get Video` node output, taking the first result URL.  
       - Resource set to `media`.  
       - Uses Blotato credentials (API key or OAuth).  
     - *Input:* Video URL JSON data from Get Video node.  
     - *Output:* Upload response includes uploaded media URL passed to next node.  
     - *Failure Modes:* Invalid URL, network errors, authentication failures.

  2. **Create post**  
     - *Type & Role:* Blotato node to create and publish a post on YouTube.  
     - *Configuration:*  
       - Platform set to YouTube.  
       - Account ID must be set to user’s Blotato account for YouTube.  
       - Post content text uses AI-generated description from the Prompter node’s output.  
       - Media URLs set to uploaded media URL from Upload media node.  
       - Post title uses AI-generated title.  
       - Flags the post as containing synthetic media.  
     - *Input:* Media URL from Upload media; text from Prompter.  
     - *Output:* Confirmation or details of the published post.  
     - *Failure Modes:* Account ID missing or incorrect, authentication issues, API failures.

---

### 3. Summary Table

| Node Name               | Node Type                                 | Functional Role                           | Input Node(s)           | Output Node(s)         | Sticky Note                                                                                          |
|-------------------------|------------------------------------------|-----------------------------------------|-------------------------|------------------------|----------------------------------------------------------------------------------------------------|
| Schedule Trigger        | n8n-nodes-base.scheduleTrigger           | Triggers workflow every 12 hours        | -                       | Code in JavaScript      | ## Script Builder: Scheduler triggers execution and random template selection.                     |
| Code in JavaScript      | n8n-nodes-base.code                      | Generates random template number (1-7) | Schedule Trigger         | Prompter               | ## Script Builder: Scheduler triggers execution and random template selection.                     |
| Prompter               | @n8n/n8n-nodes-langchain.agent           | Generates video title, description, prompt | Code in JavaScript      | Create video           | ## Script Builder: Generates title, description, and prompt; uses Gemini AI.                       |
| Google Gemini Chat Model | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | AI model to create chat completions     | Prompter (ai_languageModel) | Structured Output Parser | ## Script Builder: Generates title, description, and prompt; uses Gemini AI.                       |
| Structured Output Parser | @n8n/n8n-nodes-langchain.outputParserStructured | Parses AI output into structured JSON   | Google Gemini Chat Model (ai_outputParser) | Prompter (ai_outputParser) | ## Script Builder: Generates title, description, and prompt; uses Gemini AI.                       |
| Create video           | n8n-nodes-base.httpRequest               | Sends prompt to KIE AI for video creation | Prompter               | Wait                   | ## Video Generator: Sends prompt to KIE AI, waits for rendering, retrieves video URL.              |
| Wait                   | n8n-nodes-base.wait                      | Pauses workflow to allow video rendering | Create video            | Get Video              | ## Video Generator: Sends prompt to KIE AI, waits for rendering, retrieves video URL.              |
| Get Video              | n8n-nodes-base.httpRequest               | Retrieves video rendering result from KIE AI | Wait                   | Upload media           | ## Video Generator: Sends prompt to KIE AI, waits for rendering, retrieves video URL.              |
| Upload media           | @blotato/n8n-nodes-blotato.blotato       | Uploads video to Blotato platform       | Get Video               | Create post            | ## Auto-Publisher (YouTube): Uploads rendered video to Blotato and publishes to YouTube.           |
| Create post            | @blotato/n8n-nodes-blotato.blotato       | Publishes video post to YouTube         | Upload media            | -                      | ## Auto-Publisher (YouTube): Uploads rendered video to Blotato and publishes to YouTube.           |
| Sticky Note - Community Warning1 | n8n-nodes-base.stickyNote          | Documentation note                      | -                       | -                      | ## Auto-Publisher (YouTube): Uploads the rendered video to Blotato and publishes to YouTube.       |
| Sticky Note - Community Warning2 | n8n-nodes-base.stickyNote          | Documentation note                      | -                       | -                      | ## Video Generator: Sends the prompt to KIE AI and manages video retrieval.                         |
| Sticky Note - Community Warning3 | n8n-nodes-base.stickyNote          | Documentation note                      | -                       | -                      | ## Script Builder: Scheduler triggers execution and Gemini generates structured JSON.              |
| Sticky Note2            | n8n-nodes-base.stickyNote                 | Workflow overview and setup instructions | -                       | -                      | ## Overview: Describes workflow purpose, requirements, and setup instructions in detail.           |
| Sticky Note             | n8n-nodes-base.stickyNote                 | Pre-run checklist                      | -                       | -                      | ## Before running: Add API keys, set Blotato account ID, adjust video settings if needed.          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set interval: Every 12 hours

2. **Create Code Node (JavaScript)**  
   - Type: Code  
   - Code:  
     ```javascript
     const randomNumber = Math.floor(Math.random() * 7) + 1;
     return { json: { randomNumber } };
     ```  
   - Connect Schedule Trigger → Code node

3. **Create Langchain Agent Node (Prompter)**  
   - Type: Langchain Agent  
   - Text prompt:  
     `Generate a (title, description, and prompt) for template number: {{ $json.randomNumber }}.\nReturn only valid minified JSON that matches the required schema.`  
   - System message: "You are an AI that generates random video prompts..."  
   - Enable output parser  
   - Connect Code node → Prompter

4. **Create Google Gemini Chat Model Node**  
   - Type: Google Gemini Chat Model node (Langchain)  
   - Use default options  
   - Provide Google Gemini API credentials in n8n credentials manager  
   - Connect Prompter (ai_languageModel) → Google Gemini Chat Model  
   - Connect Google Gemini Chat Model (ai_outputParser) → Structured Output Parser

5. **Create Structured Output Parser Node**  
   - Type: Structured Output Parser (Langchain)  
   - Schema:  
     ```json
     {
       "type": "object",
       "properties": {
         "title": { "type": "string" },
         "description": { "type": "string" },
         "prompt": { "type": "string" }
       },
       "required": ["title", "description", "prompt"],
       "additionalProperties": false
     }
     ```  
   - Auto-fix enabled  
   - Connect to Prompter (ai_outputParser)

6. **Create HTTP Request Node for Video Creation**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.kie.ai/api/v1/jobs/createTask`  
   - Body type: JSON  
   - Body:  
     ```json
     {
       "model": "sora-2-text-to-video",
       "callBackUrl": "https://example.com/callback",
       "input": {
         "prompt": "{{ $json.output.prompt }}",
         "aspect_ratio": "portrait",
         "n_frames": "10",
         "remove_watermark": true
       }
     }
     ```  
   - Authentication: HTTP Header (Generic Credential) using KIE AI API key  
   - Connect Prompter → Create video

7. **Create Wait Node**  
   - Type: Wait  
   - Wait time: 400 seconds  
   - Connect Create video → Wait

8. **Create HTTP Request Node for Video Retrieval**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.kie.ai/api/v1/jobs/recordInfo`  
   - Query Parameter: `taskId` = `={{ $json.data.taskId }}`  
   - Authentication: Same Generic Credential as Create video  
   - Connect Wait → Get Video

9. **Create Blotato Upload Media Node**  
   - Type: Blotato node (media upload)  
   - Media URL: `={{ JSON.parse($json.data.resultJson).resultUrls[0] }}`  
   - Resource: media  
   - Provide Blotato API credentials in n8n  
   - Connect Get Video → Upload media

10. **Create Blotato Create Post Node**  
    - Type: Blotato node (create post)  
    - Platform: YouTube  
    - Account ID: Replace with your Blotato YouTube account ID  
    - Post content text: `={{ $('Prompter').item.json.output.description }}`  
    - Post media URLs: `={{ $json.url }}` from Upload media output  
    - Post title: `={{ $('Prompter').item.json.output.title }}`  
    - Set flag "Contains Synthetic Media" to true  
    - Connect Upload media → Create post

11. **Verify all API credentials and account IDs are correctly configured.**

12. **Activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                    | Context or Link                                                        |
|---------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| This workflow combines Google Gemini, KIE AI, and Blotato for fully automated video creation and YouTube publishing.           | Overview section in Sticky Note2 node                                |
| Replace the placeholder `YOUR_BLOTATO_ACCOUNT_ID` in the Create post node with your actual Blotato YouTube account ID.         | Sticky Note - Community Warning1 node                                |
| The callback URL in the KIE AI Create video node is a placeholder and not used here; consider implementing a webhook for better status tracking. | KIE AI API documentation (external)                                 |
| Blotato nodes require authentication; ensure credentials are set up in n8n under Blotato API credentials.                       | Blotato official documentation                                      |
| For smoother video retrieval, consider enhancing the workflow with polling or webhook-based status instead of fixed wait.       | Workflow optimization recommendation                                |

---

*Disclaimer: The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.*