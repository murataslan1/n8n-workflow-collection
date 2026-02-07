Auto-Generate and Post Instagram Reels with Veo3, GPT-4, and Blotato

https://n8nworkflows.xyz/workflows/auto-generate-and-post-instagram-reels-with-veo3--gpt-4--and-blotato-5910


# Auto-Generate and Post Instagram Reels with Veo3, GPT-4, and Blotato

---

### 1. Workflow Overview

This workflow automates the generation and publishing of Instagram Reels leveraging AI and third-party APIs. It targets content creators, brands, and marketing teams aiming to scale short-form video content production and distribution without manual shooting or editing.

The logical flow is divided into the following blocks:

- **1.1 Input Reception:** Captures chat-triggered input messages to initiate the workflow.
- **1.2 AI Video Prompt Generation:** Uses GPT-4 to convert user input into a detailed video prompt tailored for Veo3 video creation.
- **1.3 Video Creation & Monitoring:** Sends the prompt to Veo3’s API to generate an 8-second vertical video, then polls the API until processing completes.
- **1.4 Caption Generation:** Employs GPT-4o to craft an engaging Instagram caption based on the generated video prompt.
- **1.5 Data Preparation & Logging:** Aggregates the video URL, prompt, and caption; writes these to a Google Sheet for tracking.
- **1.6 Upload & Auto-Publish:** Uploads the video to Blotato and publishes the post automatically to Instagram.
- **1.7 Post-Publish Logging:** Updates the Google Sheet with final posting status.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block listens for incoming chat messages to trigger the workflow. It serves as the entry point.
- **Nodes Involved:**  
  - When chat message received
- **Node Details:**

| Node Name               | Details                                                                                                            |
|-------------------------|--------------------------------------------------------------------------------------------------------------------|
| When chat message received | - Type: LangChain Chat Trigger Node; triggers workflow upon receiving a chat input.<br>- Configured with default options.<br>- Inputs: External chat message.<br>- Outputs: JSON containing chatInput.<br>- Edge cases: Missing or malformed chat input; webhook failures.<br>- No sub-workflow. |

---

#### 2.2 AI Video Prompt Generation

- **Overview:** Converts user chat input into a concise, visually descriptive video prompt optimized for Veo3 video generation.
- **Nodes Involved:**  
  - AI Video Prompt Agent
  - Veo3 Video Generator
- **Node Details:**

| Node Name          | Details                                                                                                                |
|--------------------|------------------------------------------------------------------------------------------------------------------------|
| AI Video Prompt Agent | - Type: OpenAI GPT-4 Node.<br>- Configured to use GPT-4 model with a system prompt instructing to generate a <100-word video prompt.<br>- Input: User chat input from trigger node.<br>- Output: A single prompt string describing video visuals, tone, and motion.<br>- Key expressions: Uses expression `{{$json.chatInput}}` to pass user input.<br>- Edge cases: API errors, rate limiting, unexpected model output.<br>- Credential: OpenAI API.<br>- No sub-workflow. |
| Veo3 Video Generator | - Type: HTTP Request Node.<br>- Sends POST request to Wavespeed API (Veo3) with prompt, 9:16 aspect ratio, 8-second duration, audio enabled.<br>- Input: Prompt string from AI Video Prompt Agent (`{{$json.message.content}}`).<br>- Output: JSON with video generation job ID.<br>- Edge cases: HTTP errors, authentication failure, API downtime.<br>- Credential: HTTP Header Auth for API key.<br>- No sub-workflow. |

---

#### 2.3 Video Creation & Monitoring

- **Overview:** Implements polling to wait for Veo3 video generation to complete by repeatedly checking the job status.
- **Nodes Involved:**  
  - 30 Wait  
  - HTTP Get Request  
  - If  
  - Wait 30 Secs
- **Node Details:**

| Node Name         | Details                                                                                                                   |
|-------------------|---------------------------------------------------------------------------------------------------------------------------|
| 30 Wait           | - Type: Wait Node.<br>- Pauses workflow for 30 seconds before polling.<br>- Input: Job creation output.<br>- Output: Triggers HTTP Get Request.<br>- Edge cases: Delays, stuck waiting if API never finishes.<br>- No credentials needed. |
| HTTP Get Request  | - Type: HTTP Request Node.<br>- GET request to Wavespeed API endpoint to retrieve video generation status using job ID.<br>- Input: Job ID from Veo3 Video Generator.<br>- Output: Job status JSON.<br>- Credential: HTTP Header Auth.<br>- Edge cases: API errors, connection timeouts. |
| If                | - Type: If Node.<br>- Checks if job status equals "processing".<br>- If true, loops back to Wait 30 Secs node.<br>- If false, proceeds to caption generation.<br>- Edge cases: Unexpected or missing status values.<br>- Version 2.2. |
| Wait 30 Secs      | - Type: Wait Node.<br>- Pauses 30 seconds before retrying status check.<br>- Input: If node's true branch.<br>- Output: Loops to HTTP Get Request.<br>- Edge cases: Same as 30 Wait. |

---

#### 2.4 Caption Generation

- **Overview:** Uses GPT-4o to generate a playful and impactful Instagram caption inspired by the video prompt.
- **Nodes Involved:**  
  - Caption Agent
- **Node Details:**

| Node Name    | Details                                                                                                                         |
|--------------|---------------------------------------------------------------------------------------------------------------------------------|
| Caption Agent| - Type: OpenAI GPT-4o Node.<br>- System prompt sets style as playful and impactful Instagram caption writer.<br>- Input: Video prompt from AI Video Prompt Agent.<br>- Output: Caption text.<br>- Credential: OpenAI API.<br>- Edge cases: API errors, inappropriate content handling.<br>- Key expression: Uses `{{ $('AI Video Prompt Agent').item.json.message.content }}`. |

---

#### 2.5 Data Preparation & Logging

- **Overview:** Aggregates video URL, prompt, and caption; appends new record with status “Ready to Post” to Google Sheet.
- **Nodes Involved:**  
  - Google Sheet Ready To Post  
  - Edit Fields
- **Node Details:**

| Node Name             | Details                                                                                                                              |
|-----------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Google Sheet Ready To Post | - Type: Google Sheets Node.<br>- Appends new row with fields: Status = “Ready to Post”, Caption, Video URL from API output, Prompt.<br>- Inputs: Caption from Caption Agent; Video URL from If node; Prompt from AI Video Prompt Agent.<br>- Credential: Google Sheets OAuth2.<br>- Edge cases: Authentication failure, quota limits, invalid sheet ID.<br>- Mapping mode: Define below schema.<br>- No matching columns specified (append only). |
| Edit Fields           | - Type: Set Node.<br>- Currently set to output empty JSON (likely a placeholder or for cleanup).<br>- Input: Google Sheet Ready To Post.<br>- Output: Forwards data to upload node.<br>- Edge cases: Data loss if misconfigured.<br>- No credentials required. |

---

#### 2.6 Upload & Auto-Publish

- **Overview:** Uploads the video file URL to Blotato media endpoint, then posts it to Instagram via Blotato’s posting API.
- **Nodes Involved:**  
  - Upload Bloatato  
  - Publish to IG  
  - Google Sheets1
- **Node Details:**

| Node Name       | Details                                                                                                                              |
|-----------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Upload Bloatato | - Type: HTTP Request Node.<br>- POSTs to Blotato media API with video URL from Google Sheet.<br>- Input: Video URL.<br>- Output: JSON with uploaded media URL.<br>- Credential: HTTP Header Auth.<br>- Edge cases: Upload failure, auth errors, invalid URL. |
| Publish to IG   | - Type: HTTP Request Node.<br>- POSTs to Blotato posts API with Instagram target, caption text, media URL, and Instagram account ID.<br>- Inputs: Caption from Google Sheet Ready To Post; Media URL from Upload Bloatato output.<br>- Output: Post confirmation.<br>- Credential: HTTP Header Auth.<br>- Edge cases: Posting failures, invalid account ID, quota issues. |
| Google Sheets1  | - Type: Google Sheets Node.<br>- Updates Google Sheet record to set Status = “Posted” and saves the video URL.<br>- Inputs: Post confirmation from Publish to IG.<br>- Credential: Google Sheets OAuth2.<br>- Edge cases: Sync issues, API quota. |

---

#### 2.7 Documentation & Notes (Sticky Notes)

- Sticky notes are used throughout the canvas to annotate blocks such as:
  - Chat Trigger
  - Video Prompt Agent
  - Veo3 Get Request Loop
  - Caption Agent
  - Upload to Google Sheet, Blotato and Post
  - Update Google Sheet
  - Full workflow overview with description and YouTube tutorial link:  
    https://www.youtube.com/@Automatewithmarc

---

### 3. Summary Table

| Node Name               | Node Type                             | Functional Role                                   | Input Node(s)              | Output Node(s)              | Sticky Note                                                                                         |
|-------------------------|-------------------------------------|--------------------------------------------------|----------------------------|-----------------------------|---------------------------------------------------------------------------------------------------|
| When chat message received | LangChain Chat Trigger              | Entry trigger on chat message                     | -                          | AI Video Prompt Agent        | Chat Trigger                                                                                      |
| AI Video Prompt Agent    | OpenAI GPT-4                        | Generate detailed video prompt                     | When chat message received  | Veo3 Video Generator         | Video Prompt Agent                                                                                |
| Veo3 Video Generator     | HTTP Request                       | Submit prompt for video generation to Veo3 API    | AI Video Prompt Agent       | 30 Wait                     | Video Prompt Agent                                                                                |
| 30 Wait                 | Wait                              | Wait 30 seconds before polling                     | Veo3 Video Generator        | HTTP Get Request            | Veo3 Get Request Loop                                                                             |
| HTTP Get Request        | HTTP Request                       | Poll Veo3 API for video generation status          | 30 Wait                    | If                         | Veo3 Get Request Loop                                                                             |
| If                      | If                                | Check if video is still processing                  | HTTP Get Request            | Wait 30 Secs / Caption Agent | Veo3 Get Request Loop                                                                             |
| Wait 30 Secs             | Wait                              | Wait 30 seconds before next poll                    | If                         | HTTP Get Request            | Veo3 Get Request Loop                                                                             |
| Caption Agent            | OpenAI GPT-4o                     | Generate Instagram caption from video prompt       | If                         | Google Sheet Ready To Post  | Caption Agent                                                                                     |
| Google Sheet Ready To Post | Google Sheets                     | Append new video record with status “Ready to Post”| Caption Agent               | Edit Fields                 | Upload to Google Sheet, Blotato and Post                                                         |
| Edit Fields              | Set Node                         | Prepare or clean data before upload                 | Google Sheet Ready To Post  | Upload Bloatato             | Upload to Google Sheet, Blotato and Post                                                         |
| Upload Bloatato          | HTTP Request                     | Upload video URL to Blotato media library           | Edit Fields                 | Publish to IG               | Upload to Google Sheet, Blotato and Post                                                         |
| Publish to IG            | HTTP Request                     | Publish video + caption to Instagram via Blotato    | Upload Bloatato             | Google Sheets1              | Upload to Google Sheet, Blotato and Post                                                         |
| Google Sheets1           | Google Sheets                   | Update Google Sheet with post status “Posted”       | Publish to IG               | -                          | Update Google Sheet                                                                              |
| Sticky Note (various)    | Sticky Note                      | Annotative notes for workflow blocks and overview   | -                          | -                           | See detailed notes in section 5                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Node: *When chat message received* (LangChain Chat Trigger)  
   - Configure default webhook to start workflow on chat input.

2. **Add AI Video Prompt Agent:**  
   - Node: OpenAI (GPT-4)  
   - Model: GPT-4  
   - System prompt: Instruct to create a concise, visually descriptive video prompt under 100 words, no extra commentary.  
   - Input message: Pass `{{$json.chatInput}}` from trigger node.  
   - Connect trigger output to this node input.  
   - Credential: Link valid OpenAI API key.

3. **Add Veo3 Video Generator:**  
   - Node: HTTP Request (POST)  
   - URL: `https://api.wavespeed.ai/api/v3/google/veo3-fast`  
   - Body (form parameters):  
     - aspect_ratio: "9:16"  
     - duration: "8"  
     - enable_prompt_expansion: "true"  
     - generate_audio: "true"  
     - prompt: use output from AI Video Prompt Agent (`{{$json.message.content}}`)  
   - Authentication: HTTP Header Auth with API key for Wavespeed.  
   - Connect AI Video Prompt Agent output to this node input.

4. **Add Wait Node (30 Wait):**  
   - Node: Wait  
   - Duration: 30 seconds  
   - Connect Veo3 Video Generator output to this node.

5. **Add HTTP Get Request Node:**  
   - Node: HTTP Request (GET)  
   - URL: `https://api.wavespeed.ai/api/v3/predictions/{{ $json.data.id }}/result` (inject job ID dynamically)  
   - Authentication: HTTP Header Auth with Wavespeed API key.  
   - Connect 30 Wait output to this node.

6. **Add If Node:**  
   - Condition: Check if `{{$json.data.status}}` equals `"processing"`  
   - If True: Loop to next Wait node (Wait 30 Secs)  
   - If False: Continue to Caption Agent  
   - Connect HTTP Get Request output to If node.

7. **Add Wait 30 Secs Node:**  
   - Node: Wait  
   - Duration: 30 seconds  
   - Connect If true branch output back to HTTP Get Request node to poll again.

8. **Add Caption Agent:**  
   - Node: OpenAI (GPT-4o)  
   - System prompt: Instagram caption copywriter, playful and impactful style.  
   - Input: Video prompt from AI Video Prompt Agent (`{{ $('AI Video Prompt Agent').item.json.message.content }}`).  
   - Credential: OpenAI API key.  
   - Connect If false branch output to this node.

9. **Add Google Sheet Ready To Post:**  
   - Node: Google Sheets (Append)  
   - Document/Sheet: Configure target spreadsheet and sheet name.  
   - Columns: Status (“Ready to Post”), Caption, Video URL (from If node output), Video Description / Prompt (from AI Video Prompt Agent).  
   - Credential: Google Sheets OAuth2.  
   - Connect Caption Agent output to this node.

10. **Add Edit Fields Node:**  
    - Node: Set (mode: raw)  
    - Configure as needed (currently empty JSON in original).  
    - Connect Google Sheet Ready To Post output to this node.

11. **Add Upload Bloatato:**  
    - Node: HTTP Request (POST)  
    - URL: https://backend.blotato.com/v2/media  
    - Body parameters: URL of video from Google Sheet (“Video URL (google drive)”).  
    - Authentication: HTTP Header Auth with Blotato API key.  
    - Connect Edit Fields output to this node.

12. **Add Publish to IG:**  
    - Node: HTTP Request (POST)  
    - URL: https://backend.blotato.com/v2/posts  
    - JSON body:  
      ```json
      {
        "post": {
          "target": { "targetType": "instagram" },
          "content": {
            "text": "{{ $('Google Sheet Ready To Post').item.json.Caption.toJsonString() }}",
            "platform": "instagram",
            "mediaUrls": ["{{ $json.url }}"]
          },
          "accountId": "{{ YOUR_INSTAGRAM_ID }}"
        }
      }
      ```  
    - Authentication: HTTP Header Auth with Blotato API key.  
    - Connect Upload Bloatato output to this node.

13. **Add Google Sheets1:**  
    - Node: Google Sheets (Append or Update)  
    - Update Status to “Posted” and Video URL.  
    - Credential: Google Sheets OAuth2.  
    - Connect Publish to IG output to this node.

14. **Add Sticky Notes:**  
    - For documentation, add sticky notes describing each block.  
    - Include overview with link to tutorial video: https://www.youtube.com/@Automatewithmarc

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                               | Context or Link                                         |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| Full workflow automates Instagram Reel creation and posting using AI and Veo3 API, ideal for creators/brands scaling content.                                                                                                             | Workflow purpose                                        |
| YouTube step-by-step tutorial for building this workflow is available: https://www.youtube.com/@Automatewithmarc                                                                                                                           | Tutorial video link                                     |
| Uses OpenAI GPT-4 for prompt generation and GPT-4o for captioning, Wavespeed API (Veo3) for video generation, Google Sheets for tracking, and Blotato for posting.                                                                          | Technology stack                                        |
| Rate limits and API failures should be monitored, especially for polling loops and OpenAI requests. Add error handling as needed for production robustness.                                                                                | Operational note                                        |
| Ensure all API credentials (OpenAI, Wavespeed, Google Sheets OAuth2, Blotato) are securely configured before running.                                                                                                                       | Credential management                                  |

---

*Disclaimer: The text provided is exclusively derived from an automated n8n workflow. It complies with all applicable content policies and contains no illegal or offensive elements. All processed data is legal and public.*