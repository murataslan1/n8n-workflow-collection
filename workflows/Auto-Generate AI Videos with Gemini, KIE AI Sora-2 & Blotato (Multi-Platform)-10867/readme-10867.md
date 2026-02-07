Auto-Generate AI Videos with Gemini, KIE AI Sora-2 & Blotato (Multi-Platform)

https://n8nworkflows.xyz/workflows/auto-generate-ai-videos-with-gemini--kie-ai-sora-2---blotato--multi-platform--10867


# Auto-Generate AI Videos with Gemini, KIE AI Sora-2 & Blotato (Multi-Platform)

### 1. Workflow Overview

This workflow automates the generation and multi-platform publishing of short AI-generated videos featuring humorous home scenarios with pets and humans. It leverages Google Gemini for AI content creation, KIE AI for video synthesis, and Blotato for uploading and posting videos across social media.

**Target Use Cases:**  
- Content creators and marketers automating short video production.  
- Social media managers requiring scalable, regular posting across multiple platforms.  
- Automation builders integrating AI video generation into publishing pipelines.

**Logical Blocks:**

- **1.1 Script Video Generation:**  
  Initiates workflow on a schedule, selects a random video template, and uses Google Gemini AI to generate a structured video concept (title, description, prompt).

- **1.2 AI Video Creation (KIE AI):**  
  Sends the AI-generated prompt to KIE AI’s API to create the video, waits for rendering completion, and retrieves the final video URL.

- **1.3 Multi-Platform Auto-Posting (Blotato):**  
  Uploads the finished video to Blotato media storage and publishes the video with description and title across multiple social networks (YouTube, Facebook, Instagram, Bluesky, Twitter).

- **1.4 Supporting Configuration and Documentation:**  
  Sticky notes provide guidance on setup, customization, and operational tips.

---

### 2. Block-by-Block Analysis

#### 2.1 Script Video Generation

**Overview:**  
This block triggers the workflow periodically, randomly selects one of seven pet-related video templates, and uses Google Gemini AI (via the LangChain AI Agent node) to generate a JSON-formatted video concept comprising title, description, and prompt.

**Nodes Involved:**  
- Schedule Trigger  
- Code in JavaScript  
- AI Agent  
- Google Gemini Chat Model (linked as AI language model)  
- Structured Output Parser

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow every 12 hours to produce regular video content.  
  - Configuration: Interval set to every 12 hours.  
  - Connections: Outputs to "Code in JavaScript".  
  - Edge Cases: Possible scheduling misfires; ensure n8n instance uptime.

- **Code in JavaScript**  
  - Type: Code (JavaScript)  
  - Role: Generates a random integer (1–7) to select a video template.  
  - Configuration: `Math.floor(Math.random() * 7) + 1` stored as `randomNumber`.  
  - Connections: Input from Schedule Trigger; output to AI Agent.  
  - Edge Cases: None expected; random function is deterministic within range.

- **AI Agent**  
  - Type: LangChain AI Agent (with Google Gemini)  
  - Role: Passes prompt to Google Gemini to generate structured video metadata.  
  - Configuration:  
    - Prompt uses the random template number to generate title, description, prompt.  
    - System message enforces strict JSON structure, family-safe humor, realistic camera descriptions, no commentary.  
  - Key Expressions: Template number accessed via `{{ $json.randomNumber }}`; output parsed JSON available at `json.output`.  
  - Connections: Input from Code in JavaScript; outputs to "create video".  
  - Version: v3 of LangChain Agent node.  
  - Edge Cases: Potential AI response errors, malformed JSON output mitigated by structured parser.

- **Google Gemini Chat Model**  
  - Type: LangChain AI Language Model  
  - Role: Provides the underlying AI model for the AI Agent node.  
  - Configuration: Default options; no special parameters.  
  - Connections: Connected as the AI language model for AI Agent.  
  - Edge Cases: API key validity, rate limits, network timeouts.

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Role: Validates and auto-corrects the AI Agent’s JSON output to fit required schema (title, description, prompt).  
  - Configuration:  
    - JSON schema defines required string properties: title, description, prompt.  
    - AutoFix enabled to correct minor format errors.  
  - Connections: Linked to AI Agent as output parser.  
  - Edge Cases: Parser failure if AI output cannot be fixed; workflow depends on valid JSON for downstream nodes.

---

#### 2.2 AI Video Creation (KIE AI)

**Overview:**  
This block sends the AI-generated prompt to KIE AI’s API to create a video task, waits until the video rendering completes, and retrieves the final video URL.

**Nodes Involved:**  
- create video (HTTP Request)  
- Wait1 (Wait node with webhook)  
- Get (HTTP Request)

**Node Details:**

- **create video**  
  - Type: HTTP Request  
  - Role: Sends a POST request to KIE AI’s `/createTask` endpoint to initiate video generation using the prompt.  
  - Configuration:  
    - URL: `https://api.kie.ai/api/v1/jobs/createTask`  
    - Method: POST  
    - Authentication: Generic HTTP Header (KIE API Key)  
    - Body: JSON payload including prompt and callback URL (for webhook) configured in node parameters.  
  - Connections: Input from AI Agent; output to Wait1.  
  - Edge Cases: API failures, authentication errors, invalid prompt data, network timeouts.

- **Wait1**  
  - Type: Wait (Webhook)  
  - Role: Pauses workflow until KIE AI signals rendering completion via webhook callback.  
  - Configuration: Webhook ID set to receive KIE AI callback.  
  - Connections: Input from create video; output to Get node.  
  - Edge Cases: Missed callbacks, webhook misconfiguration, timeout if video rendering takes too long.

- **Get**  
  - Type: HTTP Request  
  - Role: Queries KIE AI’s `/recordInfo` endpoint with recordId and taskId from the create video response to fetch the rendered video URL and metadata.  
  - Configuration:  
    - URL: `https://api.kie.ai/api/v1/jobs/recordInfo`  
    - Method: GET  
    - Query Parameters: `recordId` and `taskId` dynamically extracted from previous step.  
    - Authentication: Generic HTTP Header (KIE API Key)  
  - Connections: Input from Wait1; output to Upload media1.  
  - Edge Cases: Missing or invalid IDs, API failure, authentication errors.

---

#### 2.3 Multi-Platform Auto-Posting (Blotato)

**Overview:**  
Uploads the video URL obtained from KIE AI to Blotato, then posts the video with AI-generated description and title on multiple social media platforms supported by Blotato.

**Nodes Involved:**  
- Upload media1  
- Create post1  
- Youtube  
- Facebook  
- Instagram  
- Bluesky  
- LinkedIn2 (Twitter)

**Node Details:**

- **Upload media1**  
  - Type: Blotato Media Upload  
  - Role: Uploads the video file to Blotato’s media resource using URL from KIE AI’s video data.  
  - Configuration:  
    - Media URL parsed from `JSON.parse($json.data.resultJson).resultUrls[0]` (first result URL).  
    - Resource type set to “media”.  
  - Connections: Input from Get; output to Create post1.  
  - Edge Cases: Upload failures, invalid media URLs, Blotato API errors.

- **Create post1**  
  - Type: Blotato Post Creation  
  - Role: Creates a YouTube post with video title and description from AI Agent output and uploaded media URL from Upload media1.  
  - Configuration:  
    - Platform: YouTube  
    - Account ID: Placeholder `"YOUR_ACCOUNT_ID"` (must be replaced)  
    - Post content text from AI Agent’s description  
    - Post media URLs from Upload media node  
    - YouTube-specific options: title, synthetic media flag enabled  
  - Connections: Input from Upload media1; outputs to multiple social platform post nodes (Youtube, Facebook, Instagram, Bluesky, LinkedIn2).  
  - Edge Cases: Authentication errors, account misconfiguration, quota limits.

- **Youtube**  
  - Type: Blotato Post Creation  
  - Role: Publishes the video to YouTube channel.  
  - Configuration: Same as Create post1 parameters for YouTube.  
  - Connections: Input from Create post1; no outputs.  
  - Edge Cases: Same as Create post1.

- **Facebook**  
  - Type: Blotato Post Creation  
  - Role: Publishes the video to Facebook page.  
  - Configuration:  
    - Platform: Facebook  
    - Account ID and Facebook Page ID placeholders  
    - Content text and media URL from AI Agent and Upload media1  
  - Connections: Input from Create post1; no outputs.  
  - Edge Cases: Facebook API changes, permission scope errors.

- **Instagram**  
  - Type: Blotato Post Creation  
  - Role: Publishes the video to Instagram account.  
  - Configuration: Account ID placeholder, post text and media URL as above.  
  - Connections: Input from Create post1; no outputs.  
  - Edge Cases: Instagram API limits, media format restrictions.

- **Bluesky**  
  - Type: Blotato Post Creation  
  - Role: Publishes the video to Bluesky social platform.  
  - Configuration: Account ID placeholder, post text and media URL as above.  
  - Connections: Input from Create post1; no outputs.  
  - Edge Cases: Bluesky API availability.

- **LinkedIn2**  
  - Type: Blotato Post Creation  
  - Role: Publishes the video to Twitter (platform labeled as “twitter” in Blotato).  
  - Configuration: Account ID placeholder, post text and media URL as above.  
  - Connections: Input from Create post1; no outputs.  
  - Edge Cases: Twitter API restrictions, rate limits.

---

#### 2.4 Supporting Configuration and Documentation

**Overview:**  
Sticky notes provide detailed instructions, overview, setup requirements, and tips for users before running or modifying the workflow.

**Nodes Involved:**  
- Sticky Note1 (AI Video Generation KIE AI section)  
- Sticky Note2 (Auto-Post multi-platform publishing)  
- Sticky Note3 (Workflow overview and use cases)  
- Sticky Note4 (Mandatory configuration fields)  
- Sticky Note5 (Operational tips and best practices)

**Node Details:**  
Sticky notes contain no logic but important contextual information and must be reviewed before deployment.

---

### 3. Summary Table

| Node Name            | Node Type                            | Functional Role                           | Input Node(s)                  | Output Node(s)                                            | Sticky Note                                                                                                    |
|----------------------|------------------------------------|-----------------------------------------|-------------------------------|-----------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Schedule Trigger      | Schedule Trigger                   | Initiates workflow every 12 hours       | -                             | Code in JavaScript                                         | See Sticky Note4 for mandatory configuration before running.                                                  |
| Code in JavaScript    | Code                              | Generates random template number (1–7) | Schedule Trigger              | AI Agent                                                  |                                                                                                               |
| AI Agent             | LangChain AI Agent                 | Generates video concept JSON via Gemini | Code in JavaScript            | create video                                              | See Sticky Note4 for mandatory configuration and Sticky Note3 for overview.                                   |
| Google Gemini Chat Model | LangChain AI Language Model       | Underlying AI model for AI Agent         | -                             | AI Agent (languageModel input)                            |                                                                                                               |
| Structured Output Parser | LangChain Output Parser Structured | Validates and fixes AI JSON output       | Google Gemini Chat Model      | AI Agent (outputParser input)                             |                                                                                                               |
| create video          | HTTP Request                      | Sends prompt to KIE AI to create video  | AI Agent                     | Wait1                                                     | See Sticky Note1 for AI video generation instructions.                                                        |
| Wait1                 | Wait (Webhook)                    | Waits for video rendering completion    | create video                 | Get                                                       | See Sticky Note1 for AI video generation instructions.                                                        |
| Get                   | HTTP Request                      | Retrieves final video URL from KIE AI   | Wait1                        | Upload media1                                             | See Sticky Note1 for AI video generation instructions.                                                        |
| Upload media1         | Blotato Media Upload              | Uploads video to Blotato media storage  | Get                          | Create post1                                             | See Sticky Note2 for auto-posting guidelines.                                                                 |
| Create post1          | Blotato Post Creation             | Creates YouTube post                     | Upload media1                | Youtube, Facebook, Instagram, Bluesky, LinkedIn2          | See Sticky Note2 for auto-posting guidelines.                                                                 |
| Youtube               | Blotato Post Creation             | Publishes video on YouTube               | Create post1                 | -                                                         | See Sticky Note2 for auto-posting guidelines.                                                                 |
| Facebook              | Blotato Post Creation             | Publishes video on Facebook page         | Create post1                 | -                                                         | See Sticky Note2 for auto-posting guidelines.                                                                 |
| Instagram             | Blotato Post Creation             | Publishes video on Instagram             | Create post1                 | -                                                         | See Sticky Note2 for auto-posting guidelines.                                                                 |
| Bluesky               | Blotato Post Creation             | Publishes video on Bluesky                | Create post1                 | -                                                         | See Sticky Note2 for auto-posting guidelines.                                                                 |
| LinkedIn2 (Twitter)   | Blotato Post Creation             | Publishes video on Twitter                | Create post1                 | -                                                         | See Sticky Note2 for auto-posting guidelines.                                                                 |
| Sticky Note1          | Sticky Note                      | AI Video generation instructions         | -                             | -                                                         | # Create Video section: KIE AI integration info.                                                              |
| Sticky Note2          | Sticky Note                      | Multi-platform posting instructions      | -                             | -                                                         | # Auto-Post section: Blotato multi-platform publishing info.                                                  |
| Sticky Note3          | Sticky Note                      | Workflow overview and use case summary   | -                             | -                                                         | # Overview and target users.                                                                                   |
| Sticky Note4          | Sticky Note                      | Mandatory configuration before running   | -                             | -                                                         | # Fields to configure: API keys, Blotato accounts, KIE AI settings, schedule.                                  |
| Sticky Note5          | Sticky Note                      | Operational tips for best results        | -                             | -                                                         | # Tips: test manually, verify uploads, keep KIE AI credits topped, add logging if needed.                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node:**  
   - Type: Schedule Trigger  
   - Set interval to every 12 hours.

2. **Create Code Node (JavaScript):**  
   - Type: Code  
   - Paste code:  
     ```js
     const randomNumber = Math.floor(Math.random() * 7) + 1;
     return { json: { randomNumber } };
     ```  
   - Connect Schedule Trigger output to this node.

3. **Create AI Agent Node (LangChain Agent):**  
   - Type: LangChain AI Agent  
   - Set prompt with expression:  
     ```
     Generate a (title, description, and prompt) for template number: {{ $json.randomNumber }}.  
     Return only valid minified JSON that matches the required schema.
     ```  
   - Configure system message to enforce JSON output with fields: title, description, prompt.  
   - Connect Code node output to AI Agent input.

4. **Create Google Gemini Chat Model Node:**  
   - Type: LangChain LM Chat Google Gemini  
   - Default settings, connect as AI language model node for AI Agent.

5. **Create Structured Output Parser Node:**  
   - Type: LangChain Output Parser Structured  
   - Configure JSON schema with required properties: title, description, prompt (all strings).  
   - Enable AutoFix.  
   - Link parser output to AI Agent output parser input.

6. **Create HTTP Request Node (“create video”):**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.kie.ai/api/v1/jobs/createTask`  
   - Authentication: Generic HTTP Header with KIE AI API key.  
   - Body: JSON with video prompt and callback webhook URL.  
   - Connect AI Agent output to this node.

7. **Create Wait Node (“Wait1”):**  
   - Type: Wait (Webhook)  
   - Configure webhook to receive KIE AI rendering completion callbacks.  
   - Connect “create video” output to Wait node.

8. **Create HTTP Request Node (“Get”):**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.kie.ai/api/v1/jobs/recordInfo`  
   - Query parameters: recordId and taskId from “create video” response.  
   - Authentication: Generic HTTP Header with KIE AI API key.  
   - Connect Wait node output to this node.

9. **Create Blotato Media Upload Node (“Upload media1”):**  
   - Type: Blotato Media Upload  
   - Media URL: Extract first result URL from JSON in “Get” node response.  
   - Resource: media  
   - Connect “Get” node output to this node.

10. **Create Blotato Post Creation Node (“Create post1”):**  
    - Type: Blotato Post Creation  
    - Platform: YouTube (initially)  
    - Account ID: Replace `"YOUR_ACCOUNT_ID"` with your real account ID  
    - Post content text: AI Agent description output  
    - Post media URLs: Output URL from “Upload media1”  
    - YouTube options: Set title from AI Agent title output; enable synthetic media flag.  
    - Connect “Upload media1” output to this node.

11. **Create Social Posting Nodes (YouTube, Facebook, Instagram, Bluesky, Twitter):**  
    - Duplicate “Create post1” node for each platform.  
    - Adjust platform and account credentials accordingly (replace placeholder IDs).  
    - Connect output of “Create post1” to each of these nodes.

12. **Add Sticky Notes for Documentation:**  
    - Insert sticky notes with content matching the original workflow to provide user guidance on setup, configuration fields, and operational tips.

13. **Credential Setup:**  
    - Add Google Gemini API key credential.  
    - Add KIE AI API key credential.  
    - Add Blotato API credential.  
    - Set credentials in respective nodes.

14. **Testing and Validation:**  
    - Test each step manually before enabling schedule trigger.  
    - Confirm video generation, upload, and posting.  
    - Adjust KIE AI parameters (aspect ratio, frame count, model) inside “create video” node as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                | Context or Link                                                        |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| This workflow requires a self-hosted n8n instance due to the use of community nodes like Blotato.                                                          | Important for deployment                                                |
| You can customize the schedule frequency by editing the Schedule Trigger node interval.                                                                     | Workflow customization                                                |
| Add more video templates or modify AI prompt templates in the AI Agent node for richer content variety.                                                    | Customization ideas                                                   |
| Blotato supports many platforms: YouTube, Instagram, LinkedIn, TikTok, Facebook, X (Twitter), Bluesky. To add more platforms, duplicate post nodes.         | Multi-platform publishing flexibility                                 |
| Keep your KIE AI credits topped up to avoid interruptions in video generation.                                                                               | Operational tip                                                      |
| Add notifications (Telegram, Discord, Slack) or logging (Google Sheets, Notion) by extending the workflow.                                                  | Advanced customization                                                |
| Official Blotato node documentation and setup guides: https://github.com/blotato/n8n-nodes-blotato                                                          | External resource                                                    |
| Google Gemini API keys and usage details: Refer to Google Cloud AI platform documentation.                                                                  | External resource                                                    |
| KIE AI API documentation: https://api.kie.ai/docs                                                                                                          | External resource                                                    |

---

**Disclaimer:**  
The provided text and workflow are generated exclusively from an automated n8n workflow. This processing strictly respects content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.