Automate Video Creation from Voice Input with HeyGen, GPT-5 & Social Publishing

https://n8nworkflows.xyz/workflows/automate-video-creation-from-voice-input-with-heygen--gpt-5---social-publishing-7772


# Automate Video Creation from Voice Input with HeyGen, GPT-5 & Social Publishing

### 1. Workflow Overview

This workflow automates the creation of social media videos from voice messages received on Telegram, leveraging AI transcription, content generation, AI avatar video creation, and multi-platform social publishing. It is designed to transform a user’s spoken idea into a fully produced video and distribute it across multiple social networks automatically.

The workflow is logically divided into four main blocks:

- **1.1 Input Reception & Transcription:** Captures voice messages from Telegram, downloads and uploads them to Google Drive, then transcribes the audio to text using OpenAI.
- **1.2 AI Content Generation:** Uses GPT-5 (via LangChain agent) to generate a video script, title, and caption from the transcription, then logs and updates these in Google Sheets.
- **1.3 AI Avatar Video Creation:** Selects avatar and voice configurations from Google Sheets, generates the video using HeyGen API, waits for rendering, checks status, downloads the final video, and uploads it to Google Drive.
- **1.4 Multi-Platform Publishing & Confirmation:** Uploads the video to Blotato for distribution across nine social media platforms and sends confirmation messages back to Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Transcription

**Overview:**  
This block listens for voice messages on Telegram, downloads the audio file, uploads it to Google Drive for storage, logs metadata, and transcribes the audio to text using OpenAI’s transcription model.

**Nodes Involved:**  
- Telegram Trigger: Receive Voice Message  
- Telegram: Download Voice  
- Google Drive: Upload Voice  
- Google Sheets: Log Voice Metadata  
- OpenAI - Transcribe Video to Text  
- Google Sheets: Read Avatar Config  

**Node Details:**  

- **Telegram Trigger: Receive Voice Message**  
  - Type: Trigger node listening for Telegram messages  
  - Config: Triggers on new messages (specifically voice messages)  
  - Input: Telegram voice message  
  - Output: Contains voice file metadata and chat info  
  - Potential Failures: Telegram API errors, webhook connectivity issues  

- **Telegram: Download Voice**  
  - Type: Telegram node to download voice file  
  - Config: Uses voice file ID from trigger to download audio file  
  - Input: Telegram message from trigger  
  - Output: Binary audio file  
  - Failures: File not found, Telegram API limits  

- **Google Drive: Upload Voice**  
  - Type: Google Drive upload node  
  - Config: Uploads downloaded voice file to specified Drive folder  
  - Input: Binary audio from Telegram node  
  - Output: Google Drive file metadata and public link  
  - Failures: Google Drive auth errors, upload limits  

- **Google Sheets: Log Voice Metadata**  
  - Type: Google Sheets node (appendOrUpdate operation)  
  - Config: Logs voice ID and Drive URL to a Google Sheet for tracking  
  - Input: Metadata from Google Drive upload and Telegram trigger  
  - Output: Sheet update confirmation  
  - Failures: Google Sheets API quota, incorrect sheet ID or permissions  

- **OpenAI - Transcribe Video to Text**  
  - Type: OpenAI audio transcription (LangChain)  
  - Config: Transcribes uploaded audio, language set to French, temperature 0  
  - Input: Binary audio from Telegram node  
  - Output: Transcribed text JSON  
  - Failures: OpenAI API quota, transcription errors  

- **Google Sheets: Read Avatar Config**  
  - Type: Google Sheets read node  
  - Config: Reads avatar and voice configuration data from a sheet  
  - Input: Triggered post-transcription  
  - Output: Avatar and voice IDs for video generation  
  - Failures: Sheet access errors  

---

#### 2.2 AI Content Generation

**Overview:**  
Generates a video script, title, and caption from the transcribed text using GPT-5 via LangChain agent, then updates the Google Sheet with the generated content.

**Nodes Involved:**  
- OpenAI Model GPT-5  
- LangChain - Think Tool  
- AI Agent - Generate Title & Caption & Script  
- Google Sheets - Update Title & Caption & Script  

**Node Details:**  

- **OpenAI Model GPT-5**  
  - Type: Language model node for GPT-5-mini  
  - Config: Processes transcription text to prepare for content generation  
  - Input: Transcription text from OpenAI transcription node  
  - Output: Passes text to AI Agent  
  - Failures: API errors, rate limits  

- **LangChain - Think Tool**  
  - Type: AI tool node to assist AI agent logic  
  - Config: No special parameters, used as intermediate AI thinking step  
  - Input: From GPT-5 model  
  - Output: To AI Agent  
  - Failures: Internal AI logic failures  

- **AI Agent - Generate Title & Caption & Script**  
  - Type: LangChain agent node  
  - Config:  
    - System message instructs creating a script (max 100 words), title (≤70 chars), and caption (≤200 chars) faithfully based on transcription.  
    - Language detection automatic, no emojis or hashtags.  
    - Outputs JSON line with script, title, caption.  
  - Input: Transcription text via GPT-5 and think tool  
  - Output: Generated script, title, caption  
  - Failures: Misinterpretation by AI, API errors  

- **Google Sheets - Update Title & Caption & Script**  
  - Type: Google Sheets Tool node (appendOrUpdate)  
  - Config: Updates the row matching the voice ID with generated content  
  - Input: AI-generated content plus voice ID  
  - Output: Sheet update confirmation  
  - Failures: Sheet permission issues, mismatches in voice ID  

---

#### 2.3 AI Avatar Video Creation

**Overview:**  
Fetches avatar and voice IDs from Google Sheets, generates an AI avatar video on HeyGen with the generated script, waits for completion, checks rendering status, downloads the video, uploads the final video to Google Drive, and saves the final video URL back in Google Sheets.

**Nodes Involved:**  
- ID Avatar (Set node)  
- Google Sheets: Read Avatar Config1  
- HeyGen: Generate Avatar Video  
- Wait for Rendering  
- HeyGen: Check Video Status  
- If: Video Completed?  
- HTTP: Download Final Video  
- Google Drive: Upload Final Video  
- Google Sheets: Save Final Video URL  
- Get Google Drive ID  
- Upload Video to BLOTATO  

**Node Details:**  

- **ID Avatar**  
  - Type: Set node to assign avatar and voice IDs from Google Sheets data  
  - Config: Extracts `id_avatar` and `id_voice` fields  
  - Input: Avatar config data  
  - Output: ID payload for HeyGen API  
  - Failures: Missing or invalid IDs  

- **Google Sheets: Read Avatar Config1**  
  - Type: Google Sheets read node  
  - Config: Reads avatar and voice configuration necessary for video generation  
  - Input: Triggered post AI content generation  
  - Output: Avatar and voice IDs  
  - Failures: Sheet reading errors  

- **HeyGen: Generate Avatar Video**  
  - Type: HTTP Request node (POST) to HeyGen API  
  - Config:  
    - Sends JSON body with avatar ID, voice ID, script text, video dimensions 1280x720  
    - Uses HTTP header auth with HeyGen credentials  
  - Input: IDs and script from previous nodes  
  - Output: Video generation job ID and data  
  - Failures: API auth errors, JSON syntax issues, network timeouts  

- **Wait for Rendering**  
  - Type: Wait node  
  - Config: Waits for a defined webhook callback or timeout before checking video status  
  - Input: After video generation request  
  - Output: Triggers status check  
  - Failures: Timeout issues if rendering delayed  

- **HeyGen: Check Video Status**  
  - Type: HTTP Request node (GET)  
  - Config: Polls HeyGen API using the video ID to check rendering status  
  - Input: Video ID from generate node  
  - Output: Status JSON including video URL if ready  
  - Failures: API errors, invalid video ID  

- **If: Video Completed?**  
  - Type: If node  
  - Config: Branches workflow based on video status equals “completed”  
  - Input: Status JSON  
  - Output: If completed → download video; else → wait and poll again  
  - Failures: Logic errors, infinite loops if status unknown  

- **HTTP: Download Final Video**  
  - Type: HTTP Request node (GET)  
  - Config: Downloads the final rendered video file from HeyGen’s returned video URL  
  - Input: Video URL  
  - Output: Binary video data  
  - Failures: Download failures, broken URL  

- **Google Drive: Upload Final Video**  
  - Type: Google Drive upload node  
  - Config: Uploads the downloaded video to Google Drive for storage and sharing  
  - Input: Binary video from HTTP download  
  - Output: File metadata and public link  
  - Failures: Upload errors, permission issues  

- **Google Sheets: Save Final Video URL**  
  - Type: Google Sheets update node  
  - Config: Updates the row corresponding to voice ID with the final video URL and status  
  - Input: Drive file metadata, voice ID  
  - Output: Sheet update confirmation  
  - Failures: Sheet write permission errors  

- **Get Google Drive ID**  
  - Type: Set node  
  - Config: Extracts Google Drive file ID from the full video URL for further processing  
  - Input: Google Sheets read of post data  
  - Output: Drive file ID variable  
  - Failures: Regex extraction errors  

- **Upload Video to BLOTATO**  
  - Type: Blotato node for media upload  
  - Config: Uploads video to Blotato platform to prepare for multi-platform posting  
  - Input: Constructed download URL from Google Drive file ID  
  - Output: Media URL for social posts  
  - Failures: API auth errors, upload failures  

---

#### 2.4 Multi-Platform Publishing & Confirmation

**Overview:**  
Distributes the final video to multiple social media platforms using Blotato nodes and sends a confirmation message to the Telegram chat.

**Nodes Involved:**  
- Merge  
- Tiktok (disabled)  
- Linkedin (disabled)  
- Facebook (disabled)  
- Instagram (disabled)  
- Twitter (X) (disabled)  
- Youtube (disabled)  
- Threads (disabled)  
- Bluesky (disabled)  
- Pinterest (disabled)  
- Google Sheets - Update Status  
- Telegram: Send Post Confirmation  
- Telegram: Send Final Video  

**Node Details:**  

- **Merge**  
  - Type: Merge node (chooseBranch mode)  
  - Config: Consolidates outputs from all enabled social media Blotato nodes  
  - Input: Multiple social platform nodes (mostly disabled by default)  
  - Output: Single stream to status update  
  - Failures: Merging conflicts  

- **Social Media Blotato Nodes (Tiktok, Linkedin, Facebook, Instagram, Twitter (X), Youtube, Threads, Bluesky, Pinterest)**  
  - Type: Blotato nodes for respective platforms  
  - Config:  
    - Each configured with specific account ID and content parameters (caption, media URL, title for YouTube)  
    - Disabled by default, can be enabled as needed  
  - Input: Media URL from Blotato upload node and caption/title from Google Sheets  
  - Output: Post creation confirmation  
  - Failures: API limits, auth errors, platform-specific posting restrictions  

- **Google Sheets - Update Status**  
  - Type: Google Sheets appendOrUpdate node  
  - Config: Updates the status of the post in the sheet after publishing  
  - Input: Confirmation from merged posting results  
  - Output: Sheet update confirmation  
  - Failures: Sheet write errors  

- **Telegram: Send Post Confirmation**  
  - Type: Telegram node to send text message  
  - Config: Sends a confirmation message ("Posted") to the original Telegram chat  
  - Input: Original chat ID from Telegram trigger  
  - Output: Telegram message sent confirmation  
  - Failures: Telegram API errors, chat ID invalid  

- **Telegram: Send Final Video**  
  - Type: Telegram node to send video file  
  - Config: Sends the final video as a Telegram video message to the original chat  
  - Input: Video URL from Blotato upload node  
  - Output: Telegram video message sent confirmation  
  - Failures: File size limits, Telegram API errors  

---

### 3. Summary Table

| Node Name                         | Node Type                      | Functional Role                              | Input Node(s)                            | Output Node(s)                          | Sticky Note                                                                                     |
|----------------------------------|--------------------------------|----------------------------------------------|-----------------------------------------|----------------------------------------|------------------------------------------------------------------------------------------------|
| Telegram Trigger: Receive Voice Message | telegramTrigger                | Entry point; receives voice messages          | —                                       | Telegram: Download Voice                | Step 1 — Capture & Transcribe Voice Input                                                     |
| Telegram: Download Voice          | telegram                      | Downloads voice message audio                  | Telegram Trigger                        | Google Drive: Upload Voice, OpenAI Transcribe, Google Sheets: Read Avatar Config | Step 1 — Capture & Transcribe Voice Input                                                     |
| Google Drive: Upload Voice        | googleDrive                   | Uploads voice audio to Google Drive            | Telegram: Download Voice                | Google Sheets: Log Voice Metadata       | Step 1 — Capture & Transcribe Voice Input                                                     |
| Google Sheets: Log Voice Metadata | googleSheets                  | Logs voice metadata to Google Sheets           | Google Drive: Upload Voice              | —                                      | Step 1 — Capture & Transcribe Voice Input                                                     |
| OpenAI - Transcribe Video to Text | openAi                       | Transcribes voice audio to text                 | Telegram: Download Voice                | OpenAI Model GPT-5                     | Step 1 — Capture & Transcribe Voice Input                                                     |
| Google Sheets: Read Avatar Config | googleSheets                  | Reads avatar and voice configuration           | Telegram: Download Voice                | ID Avatar                             | Step 1 — Capture & Transcribe Voice Input                                                     |
| ID Avatar                        | set                          | Sets avatar and voice IDs for video generation | Google Sheets: Read Avatar Config       | Google Sheets: Read Avatar Config1     | Step 3 — Create AI Avatar Video                                                              |
| Google Sheets: Read Avatar Config1 | googleSheets                  | Reads avatar config for video generation       | ID Avatar                              | HeyGen: Generate Avatar Video          | Step 3 — Create AI Avatar Video                                                              |
| OpenAI Model GPT-5               | lmChatOpenAi                 | Processes transcription text for AI generation | OpenAI - Transcribe Video to Text       | LangChain - Think Tool                 | Step 2 — Generate Title & Caption & Script with GPT‑5                                       |
| LangChain - Think Tool           | toolThink                    | AI intermediate thinking tool                   | OpenAI Model GPT-5                     | AI Agent - Generate Title & Caption & Script | Step 2 — Generate Title & Caption & Script with GPT‑5                                       |
| AI Agent - Generate Title & Caption & Script | agent                        | Generates script, title, caption from transcription | LangChain - Think Tool, OpenAI Model GPT-5 | Google Sheets - Update Title & Caption & Script | Step 2 — Generate Title & Caption & Script with GPT‑5                                       |
| Google Sheets - Update Title & Caption & Script | googleSheetsTool             | Updates Google Sheet with AI-generated content | AI Agent - Generate Title & Caption & Script | Google Sheets: Read Avatar Config1     | Step 2 — Generate Title & Caption & Script with GPT‑5                                       |
| HeyGen: Generate Avatar Video    | httpRequest                  | Sends video generation request to HeyGen API   | Google Sheets: Read Avatar Config1     | Wait for Rendering                    | Step 3 — Create AI Avatar Video                                                              |
| Wait for Rendering               | wait                         | Waits for HeyGen video rendering completion    | HeyGen: Generate Avatar Video          | HeyGen: Check Video Status             | Step 3 — Create AI Avatar Video                                                              |
| HeyGen: Check Video Status       | httpRequest                  | Checks if HeyGen video rendering is completed  | Wait for Rendering                    | If: Video Completed?                  | Step 3 — Create AI Avatar Video                                                              |
| If: Video Completed?             | if                           | Branches based on video status                   | HeyGen: Check Video Status             | HTTP: Download Final Video, Wait for Rendering | Step 3 — Create AI Avatar Video                                                              |
| HTTP: Download Final Video       | httpRequest                  | Downloads final rendered video                   | If: Video Completed?                   | Google Drive: Upload Final Video       | Step 3 — Create AI Avatar Video                                                              |
| Google Drive: Upload Final Video | googleDrive                  | Uploads final video to Google Drive              | HTTP: Download Final Video             | Google Sheets: Save Final Video URL    | Step 3 — Create AI Avatar Video                                                              |
| Google Sheets: Save Final Video URL | googleSheets                 | Saves final video URL and status in Google Sheets | Google Drive: Upload Final Video       | Google Sheets - Read Post Data          | Step 3 — Create AI Avatar Video                                                              |
| Google Sheets - Read Post Data   | googleSheets                  | Reads post data including captions and titles   | Google Sheets: Save Final Video URL    | Get Google Drive ID                   | Step 4 — Auto-Publish to 9 Social Platforms                                                  |
| Get Google Drive ID              | set                          | Extracts Google Drive file ID from URL           | Google Sheets - Read Post Data          | Upload Video to BLOTATO                | Step 4 — Auto-Publish to 9 Social Platforms                                                  |
| Upload Video to BLOTATO          | blotato                      | Uploads video to Blotato platform for social posting | Get Google Drive ID                    | Multiple social platform nodes (disabled by default) | Step 4 — Auto-Publish to 9 Social Platforms                                                  |
| Merge                           | merge                        | Merges outputs from multiple social platform posts | Multiple social platform nodes         | Google Sheets - Update Status          | Step 4 — Auto-Publish to 9 Social Platforms                                                  |
| Google Sheets - Update Status   | googleSheets                 | Updates post publishing status                    | Merge                                | Telegram: Send Post Confirmation       | Step 4 — Auto-Publish to 9 Social Platforms                                                  |
| Telegram: Send Post Confirmation | telegram                     | Sends confirmation text message on Telegram      | Google Sheets - Update Status          | Telegram: Send Final Video             | Step 4 — Auto-Publish to 9 Social Platforms                                                  |
| Telegram: Send Final Video       | telegram                     | Sends final video to Telegram chat                | Telegram: Send Post Confirmation       | —                                      | Step 4 — Auto-Publish to 9 Social Platforms                                                  |
| Sticky Notes                   | stickyNote                   | Documentation and instructions                     | —                                     | —                                      | Multiple sticky notes provide step titles, tutorial links, and setup instructions             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Set to listen for new voice messages only  
   - Configure credentials for your Telegram bot  

2. **Add Telegram Download Voice Node**  
   - Download the voice message file using Telegram API  
   - Use file ID from trigger node  
   - Connect output of Telegram Trigger to this node  

3. **Add Google Drive Upload Node (Voice)**  
   - Upload the downloaded audio file to a public Google Drive folder  
   - Configure Google Drive OAuth2 credentials  
   - Connect Telegram Download Voice node output to this node  

4. **Add Google Sheets Node to Log Voice Metadata**  
   - Append or update a Google Sheet row with voice file unique ID and Drive URL  
   - Configure Google Sheets OAuth2 credentials and target sheet ID  

5. **Add OpenAI Transcription Node**  
   - Use LangChain OpenAI node with audio transcription operation  
   - Set language to French, temperature to 0  
   - Input: binary audio from Telegram Download Voice node  

6. **Add Google Sheets Node to Read Avatar Config**  
   - Read avatar and voice configuration from Google Sheet  
   - Configure sheet and document IDs  

7. **Add Set Node (ID Avatar)**  
   - Extract `id_avatar` and `id_voice` from previous Google Sheets output  
   - Configure assignment expressions accordingly  

8. **Add Google Sheets Node (Read Avatar Config1)**  
   - Read more detailed avatar config as needed for HeyGen video generation  

9. **Add OpenAI GPT-5 Model Node**  
   - Use GPT-5-mini model via LangChain  
   - Input transcription text from OpenAI transcription node  

10. **Add LangChain Think Tool Node**  
    - Use as intermediate AI processing step  
    - Connect GPT-5 output to this node  

11. **Add AI Agent Node for Title, Caption, Script Generation**  
    - Configure system prompt to generate script (≤100 words), title (≤70 chars), caption (≤200 chars) based on transcription  
    - Input from Think Tool and GPT-5 nodes  

12. **Add Google Sheets Tool Node to Update Title, Caption, Script**  
    - Append or update generated content in Google Sheet by matching voice ID  

13. **Add HeyGen Generate Avatar Video HTTP Request Node**  
    - POST request to HeyGen API with JSON body including avatar ID, voice ID, script text, and video dimensions (1280x720)  
    - Use HTTP header auth with HeyGen API credentials  

14. **Add Wait Node**  
    - Wait for a defined period or webhook callback before polling video status  

15. **Add HeyGen Check Video Status HTTP Request Node**  
    - GET request to HeyGen API querying video rendering status by video ID  

16. **Add If Node to Check if Video Status is "completed"**  
    - Branch: if completed → proceed; else → wait and poll again  

17. **Add HTTP Request Node to Download Final Video**  
    - Download video file from HeyGen provided URL  

18. **Add Google Drive Upload Node (Final Video)**  
    - Upload downloaded video to Google Drive public folder  

19. **Add Google Sheets Node to Save Final Video URL**  
    - Update Google Sheet row with final video URL and status  

20. **Add Google Sheets Node to Read Post Data**  
    - Read data including title, caption, video URL for publishing  

21. **Add Set Node to Extract Google Drive ID from Video URL**  
    - Use regex to parse file ID from URL  

22. **Add Blotato Upload Node**  
    - Upload video to Blotato platform using constructed Google Drive download URL  
    - Configure Blotato API credentials  

23. **Add Social Media Nodes (Blotato for YouTube, TikTok, LinkedIn, etc.)**  
    - Configure each with respective platform account ID, text, and media URLs  
    - (By default, these nodes are disabled; enable as needed)  

24. **Add Merge Node**  
    - Combine outputs of all social platform nodes into a single stream  

25. **Add Google Sheets Node to Update Post Status**  
    - Update Google Sheet with post publishing status after merge  

26. **Add Telegram Node to Send Post Confirmation**  
    - Send text "Posted" message to the original Telegram chat ID  

27. **Add Telegram Node to Send Final Video**  
    - Send the final video file back to Telegram chat via video message  

28. **Add Sticky Notes**  
    - Create notes for workflow documentation, instructions, and tutorial links per original workflow for user guidance  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                      | Context or Link                                                                                          |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Full video tutorial: [Watch on YouTube](https://youtu.be/6Pzw_NC2GfY)                                                                                                                                                            | Step-by-step video walkthrough of the entire workflow                                                   |
| Detailed documentation and setup instructions: [Open the full documentation on Notion](https://automatisation.notion.site/Blotato-2473d6550fd980e19983f69611a80a0d?source=copy_link)                                                    | Includes API configurations, platform connection guides, and customization tips                         |
| Requirements include creating a Blotato Pro account, generating API keys, enabling Verified Community Nodes in n8n, and duplicating the provided Google Sheet template.                                                         | Essential for ensuring workflow functionality and permissions                                           |
| Google Drive folder must be public for video sharing and downloading.                                                                                                                                                            | Important for Blotato and social platform access                                                       |
| Several social media posting nodes are disabled by default; enable and configure as per your target platforms.                                                                                                                  | Allows workflow flexibility for multi-platform publishing                                              |
| The workflow uses GPT-5-mini via LangChain, HeyGen API for avatar video creation, and Blotato for social posting.                                                                                                              | Key integrated services                                                                                 |

---

This structured reference document enables deep understanding, reproduction, and modification of the “Automate Video Creation from Voice Input with HeyGen, GPT-5 & Social Publishing” workflow without requiring access to the original JSON.