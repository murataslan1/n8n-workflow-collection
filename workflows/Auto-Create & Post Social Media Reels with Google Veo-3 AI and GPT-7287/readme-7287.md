Auto-Create & Post Social Media Reels with Google Veo-3 AI and GPT

https://n8nworkflows.xyz/workflows/auto-create---post-social-media-reels-with-google-veo-3-ai-and-gpt-7287


# Auto-Create & Post Social Media Reels with Google Veo-3 AI and GPT

### 1. Workflow Overview

This workflow automates the entire process of creating and posting short-form social media video reels (e.g., Instagram Reels, TikTok) using AI-powered tools. It is triggered by a chat message describing a video concept, which is then refined into a cinematic video prompt by GPT-5. This prompt feeds into the Google Veo-3 AI video generator (via Wavespeed API) to create a short video. Once the video is generated, GPT-5 crafts an engaging Instagram caption. The video is downloaded, uploaded to the Postiz platform, and posted automatically to Instagram. The workflow includes built-in wait and retry logic to ensure the video generation completes before posting.

**Target Use Cases:**  
- Content creators and social media managers seeking automated reel/video production and posting  
- Brands and agencies scaling short-form video content creation without manual editing  
- Event marketers and lifestyle brands needing fast turnaround on video posts

**Logical Blocks:**  
- **1.1 Input Reception & Prompt Generation:** Receives chat input and uses GPT-5 to create a detailed video prompt  
- **1.2 Video Generation & Status Polling:** Submits prompt to Veo-3 API, waits, and polls for video readiness  
- **1.3 Caption Generation:** Uses GPT-5 to generate an Instagram caption based on the video prompt  
- **1.4 Video Download & Upload:** Downloads the generated video and uploads it to Postiz  
- **1.5 Social Media Posting:** Posts the video and caption to Instagram via Postiz API  
- **1.6 Control Logic:** Wait nodes and If conditions manage timing and retries to handle asynchronous video generation  

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Prompt Generation

**Overview:**  
This block initiates the workflow by receiving a chat message describing the video idea, then uses GPT-5 to transform this into a detailed, cinematic video prompt optimized for Veo-3.

**Nodes Involved:**  
- When chat message received  
- GPT-5 AI Video Prompt Agent

**Node Details:**  

- **When chat message received**  
  - *Type:* LangChain Chat Trigger  
  - *Role:* Entry point triggered by a chat message input  
  - *Configuration:* Default chat trigger with no extra options  
  - *Input:* User chat message content  
  - *Output:* Passes chat input to next node  
  - *Failure Modes:* Trigger failure unlikely; depends on LangChain integration availability  

- **GPT-5 AI Video Prompt Agent**  
  - *Type:* OpenAI (LangChain) node  
  - *Role:* Converts user input into a visually descriptive video prompt  
  - *Configuration:*  
    - Model: GPT-5  
    - System prompt instructs to create a cinematic, visually rich video prompt under 150 words, suitable for Veo-3  
    - User message is the chat input from trigger  
  - *Key Expressions:* Uses `{{$json.chatInput}}` to inject user message  
  - *Input:* Chat message from trigger  
  - *Output:* JSON containing the generated video prompt text  
  - *Failure Modes:* API key or rate limit errors, malformed prompts, unexpected model response  

---

#### 1.2 Video Generation & Status Polling

**Overview:**  
This block sends the GPT-5 generated prompt to the Veo-3 video generation API, waits 30 seconds, then polls the API repeatedly until the video status changes from "processing" to ready.

**Nodes Involved:**  
- Veo3 Video Generator  
- 30 Wait  
- Veo3 GET  
- If  
- Wait 30 Secs

**Node Details:**  

- **Veo3 Video Generator**  
  - *Type:* HTTP Request  
  - *Role:* Sends the video prompt to Wavespeed Veo-3 API for video generation  
  - *Configuration:*  
    - URL: `https://api.wavespeed.ai/api/v3/google/veo3-fast`  
    - Method: POST  
    - Body: Includes prompt text, duration=8 seconds, prompt expansion enabled, audio generation enabled  
    - Authentication: Generic HTTP header-based (Wavespeed API key)  
    - Uses expression to inject prompt: `{{$json.message.content}}` from GPT-5 node  
  - *Input:* Video prompt text  
  - *Output:* JSON with prediction ID for subsequent polling  
  - *Failure Modes:* Authentication failure, API downtime, invalid prompt errors  

- **30 Wait**  
  - *Type:* Wait node  
  - *Role:* Pauses workflow for 30 seconds before polling status  
  - *Configuration:* Wait time = 30 seconds  

- **Veo3 GET**  
  - *Type:* HTTP Request  
  - *Role:* Polls Wavespeed API for video generation status and result URL  
  - *Configuration:*  
    - URL: `https://api.wavespeed.ai/api/v3/predictions/{{ $json.data.id }}/result` (uses prediction ID from previous node)  
    - Method: GET  
    - Authentication: Generic HTTP header-based  
  - *Input:* Prediction ID from Veo3 Video Generator  
  - *Output:* JSON containing status and output video URL  
  - *Failure Modes:* API failures, invalid ID, timeouts  

- **If**  
  - *Type:* If condition  
  - *Role:* Checks if video generation status equals "processing"  
  - *Configuration:* Expression: `{{$json.data.status}} == "processing"`  
  - *Flow:*  
    - If true: loops back to "Wait 30 Secs" to retry polling  
    - If false: proceeds to caption generation  

- **Wait 30 Secs**  
  - *Type:* Wait node  
  - *Role:* Waits 30 seconds before next polling attempt  
  - *Configuration:* Wait time = 30 seconds  

---

#### 1.3 Caption Generation

**Overview:**  
After the video is ready, this block uses GPT-5 to generate an engaging Instagram caption based on the video prompt previously created.

**Nodes Involved:**  
- GPT-5 Caption Agent

**Node Details:**  

- **GPT-5 Caption Agent**  
  - *Type:* OpenAI (LangChain) node  
  - *Role:* Creates an Instagram caption to accompany the generated reel video  
  - *Configuration:*  
    - Model: GPT-5  
    - System prompt instructs playful and impactful Instagram caption style  
    - User prompt includes the video prompt text from "GPT-5 AI Video Prompt Agent" node  
  - *Key Expressions:* Uses `{{ $('GPT-5 AI Video Prompt Agent').item.json.message.content }}` to access video prompt  
  - *Input:* Video prompt message  
  - *Output:* JSON with caption text  
  - *Failure Modes:* API failures, rate limits, malformed text  

---

#### 1.4 Video Download & Upload

**Overview:**  
Downloads the generated video file from Veo-3 output URL, then uploads it to Postiz for social media posting.

**Nodes Involved:**  
- Download Video  
- Upload to Postiz

**Node Details:**  

- **Download Video**  
  - *Type:* HTTP Request  
  - *Role:* Downloads the video file from Veo-3 output URL  
  - *Configuration:*  
    - URL dynamically set from `{{ $('Veo3 GET').item.json.data.outputs[0] }}` which contains the video file URL  
    - Response format: File (binary)  
  - *Input:* Video URL from Veo3 GET  
  - *Output:* Binary video data  
  - *Failure Modes:* File not found, network errors, large file download timeouts  

- **Upload to Postiz**  
  - *Type:* HTTP Request  
  - *Role:* Uploads the downloaded video file to Postiz platform  
  - *Configuration:*  
    - URL: `https://api.postiz.com/public/v1/upload`  
    - Method: POST  
    - Content-Type: multipart/form-data  
    - Body includes binary video data under "file" parameter  
    - Authentication: Generic HTTP header-based (Postiz API key)  
  - *Input:* Binary video data from Download Video  
  - *Output:* JSON containing uploaded media ID and path  
  - *Failure Modes:* Authentication failure, upload size limits, network errors  

---

#### 1.5 Social Media Posting

**Overview:**  
Posts the uploaded video to Instagram via Postiz API, using the caption generated by GPT-5 Caption Agent.

**Nodes Involved:**  
- POSTIZ Post to Socials (IG)

**Node Details:**  

- **POSTIZ Post to Socials (IG)**  
  - *Type:* HTTP Request  
  - *Role:* Creates a new Instagram post on Postiz platform with uploaded video and caption  
  - *Configuration:*  
    - URL: `https://api.postiz.com/public/v1/posts`  
    - Method: POST  
    - JSON body includes:  
      - Post type as "now" for immediate posting  
      - Current date/time as ISO string  
      - Caption content from `{{ $('GPT-5 Caption Agent').item.json.message.content }}`  
      - Video file info with ID and path from "Upload to Postiz" node  
      - Integration ID placeholder `{{ YOUR_POSTIZ_INTEGRATION_ID }}` to be replaced with actual integration  
    - Authentication: Generic HTTP header-based (Postiz API key)  
  - *Input:* Caption text and uploaded media info  
  - *Output:* JSON response from Postiz API about post creation  
  - *Failure Modes:* Authentication errors, invalid integration ID, API rate limits  

---

#### 1.6 Control Logic

**Overview:**  
Manages timing and conditional logic to ensure smooth asynchronous processing of video generation and posting.

**Nodes Involved:**  
- 30 Wait  
- If  
- Wait 30 Secs

**Node Details:**  

- **30 Wait**  
  - Waits fixed 30 seconds after initial video generation request before polling status.

- **If**  
  - Checks if video generation is still in "processing" state to decide whether to continue polling or proceed.

- **Wait 30 Secs**  
  - Additional 30-second wait between polling attempts to avoid flooding the API.

---

### 3. Summary Table

| Node Name                 | Node Type                  | Functional Role                            | Input Node(s)               | Output Node(s)                    | Sticky Note                                               |
|---------------------------|----------------------------|--------------------------------------------|-----------------------------|----------------------------------|-----------------------------------------------------------|
| When chat message received| LangChain Chat Trigger     | Entry trigger receiving chat input          | -                           | GPT-5 AI Video Prompt Agent      |                                                           |
| GPT-5 AI Video Prompt Agent| OpenAI (LangChain)         | Generates cinematic video prompt             | When chat message received   | Veo3 Video Generator             |                                                           |
| Veo3 Video Generator       | HTTP Request               | Sends prompt to Veo-3 API to generate video | GPT-5 AI Video Prompt Agent  | 30 Wait                         | Sticky Note: "Video Generation"                            |
| 30 Wait                   | Wait                       | Wait 30 seconds before polling status       | Veo3 Video Generator         | Veo3 GET                       | Sticky Note: "Video Generation"                            |
| Veo3 GET                  | HTTP Request               | Polls Veo-3 API for video generation status | 30 Wait                     | If                             | Sticky Note: "Video Generation"                            |
| If                        | If condition               | Checks if video status is "processing"       | Veo3 GET                    | Wait 30 Secs (if true), GPT-5 Caption Agent (if false) | Sticky Note: "Video Generation"                            |
| Wait 30 Secs              | Wait                       | Wait 30 seconds between polling attempts     | If (true branch)            | Veo3 GET                       | Sticky Note: "Video Generation"                            |
| GPT-5 Caption Agent       | OpenAI (LangChain)         | Generates Instagram caption                   | If (false branch)           | Download Video                 | Sticky Note: "Caption Agent"                               |
| Download Video            | HTTP Request               | Downloads the generated video file            | GPT-5 Caption Agent          | Upload to Postiz               | Sticky Note: "Caption Agent"                               |
| Upload to Postiz          | HTTP Request               | Uploads video file to Postiz platform          | Download Video               | POSTIZ Post to Socials (IG)    | Sticky Note: "Postiz - Post to Social Channels"            |
| POSTIZ Post to Socials (IG)| HTTP Request              | Posts video and caption to Instagram via Postiz | Upload to Postiz            | -                              | Sticky Note: "Postiz - Post to Social Channels"            |
| Sticky Note               | Sticky Note                | Visual note: "Video Generation"                | -                           | -                              | "Video Generation"                                         |
| Sticky Note1              | Sticky Note                | Visual note: "Caption Agent"                    | -                           | -                              | "Caption Agent"                                           |
| Sticky Note2              | Sticky Note                | Visual note: "Postiz - Post to Social Channels" | -                           | -                              | "Postiz - Post to Social Channels"                        |
| Sticky Note3              | Sticky Note                | Workflow description and overview              | -                           | -                              | Contains detailed description, use cases, and setup notes |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Node Type: LangChain Chat Trigger  
   - Purpose: Receive chat input describing video idea  
   - Default configuration; no special parameters  

2. **Create GPT-5 AI Video Prompt Agent:**  
   - Node Type: OpenAI (LangChain)  
   - Model: GPT-5  
   - System Prompt: Instruct it to create a cinematic, visually descriptive video prompt under 150 words for Veo-3 API input  
   - User Message: `{{$json.chatInput}}` (from trigger)  
   - Connect output of Chat Trigger → Input of this node  

3. **Create Veo3 Video Generator Node:**  
   - Node Type: HTTP Request  
   - URL: `https://api.wavespeed.ai/api/v3/google/veo3-fast`  
   - Method: POST  
   - Body Parameters:  
     - duration: 8  
     - enable_prompt_expansion: true  
     - generate_audio: true  
     - prompt: `={{ $json.message.content }}` (from GPT-5 Video Prompt Agent)  
   - Authentication: Generic HTTP Header (configure with Wavespeed API key)  
   - Connect output of GPT-5 Video Prompt Agent → Input of this node  

4. **Add Wait Node:**  
   - Node Type: Wait  
   - Duration: 30 seconds  
   - Connect output of Veo3 Video Generator → Input of Wait node  

5. **Create Veo3 GET Node (Poll Status):**  
   - Node Type: HTTP Request  
   - URL: `=https://api.wavespeed.ai/api/v3/predictions/{{ $json.data.id }}/result`  
   - Method: GET  
   - Authentication: Generic HTTP Header (Wavespeed API key)  
   - Connect output of Wait node → Input of this node  

6. **Create If Node:**  
   - Node Type: If Condition  
   - Condition: Check if `{{$json.data.status}} == "processing"`  
   - Connect output of Veo3 GET → Input of If node  

7. **Add Wait 30 Secs Node:**  
   - Node Type: Wait  
   - Duration: 30 seconds  
   - Connect If node's *true* output → Wait 30 Secs node  
   - Connect Wait 30 Secs node → Veo3 GET node (loop for polling)  

8. **Create GPT-5 Caption Agent:**  
   - Node Type: OpenAI (LangChain)  
   - Model: GPT-5  
   - System Prompt: Write playful, impactful Instagram captions  
   - User Message: `Based on this video generation prompt, create an impactful accompanying caption for the Instagram Post: {{ $('GPT-5 AI Video Prompt Agent').item.json.message.content }}`  
   - Connect If node's *false* output → GPT-5 Caption Agent node  

9. **Create Download Video Node:**  
   - Node Type: HTTP Request  
   - URL: `={{ $('Veo3 GET').item.json.data.outputs[0] }}` (video file URL)  
   - Response Format: File (binary)  
   - Connect output of GPT-5 Caption Agent → Input of this node  

10. **Create Upload to Postiz Node:**  
    - Node Type: HTTP Request  
    - URL: `https://api.postiz.com/public/v1/upload`  
    - Method: POST  
    - Content-Type: multipart/form-data  
    - Body Parameters: file as binary data from Download Video node  
    - Authentication: Generic HTTP Header (Postiz API key)  
    - Connect output of Download Video → Input of this node  

11. **Create POSTIZ Post to Socials (IG) Node:**  
    - Node Type: HTTP Request  
    - URL: `https://api.postiz.com/public/v1/posts`  
    - Method: POST  
    - Authentication: Generic HTTP Header (Postiz API key)  
    - JSON Body:  
      ```json
      {
        "type": "now",
        "shortLink": false,
        "date": "{{ $now.toISO() }}",
        "tags": [],
        "posts": [
          {
            "integration": { "id": "{{ YOUR_POSTIZ_INTEGRATION_ID }}" },
            "value": [
              {
                "content": "{{ $('GPT-5 Caption Agent').item.json.message.content }}",
                "image": [
                  {
                    "id": "{{ $node['Upload to Postiz'].json.id }}",
                    "path": "{{ $node['Upload to Postiz'].json.path }}.mp4"
                  }
                ]
              }
            ],
            "settings": { "post_type": "post" }
          }
        ]
      }
      ```
    - Replace `YOUR_POSTIZ_INTEGRATION_ID` with actual ID from Postiz  
    - Connect output of Upload to Postiz → Input of this node  

12. **Optional: Add Sticky Notes for clarity**  
    - Add visual sticky notes in n8n canvas to group related nodes: "Video Generation", "Caption Agent", "Postiz - Post to Social Channels", and an overview note describing workflow purpose and instructions  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                         |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| This workflow is a fully automated short-form video content engine combining GPT-5 for prompt and caption generation, Google Veo-3 for AI video creation, and Postiz for multi-platform social media posting. Ideal for creators and brands to scale daily Instagram reels without manual editing or posting.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Workflow Description (Sticky Note3)                     |
| Watch a step-by-step build and demo of this workflow on YouTube: www.youtube.com/@automatewithmarc                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Video Tutorial Link                                     |
| Requires API keys and credentials setup for OpenAI (GPT-5), Wavespeed (Google Veo-3), and Postiz platform. Ensure proper OAuth or API key configuration in n8n credentials.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Credential Setup Instructions                            |
| Postiz integration ID must be obtained from your Postiz account and correctly inserted in the final posting node JSON body to enable posting to Instagram.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Postiz API Integration Details                           |
| The workflow uses wait and polling logic to handle asynchronous video generation, avoiding premature posting attempts. Adjust wait durations if needed based on API response times.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Timing and retry logic notes                             |

---

*Disclaimer:*  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.