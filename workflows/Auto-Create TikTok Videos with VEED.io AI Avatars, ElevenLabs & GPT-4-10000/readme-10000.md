Auto-Create TikTok Videos with VEED.io AI Avatars, ElevenLabs & GPT-4

https://n8nworkflows.xyz/workflows/auto-create-tiktok-videos-with-veed-io-ai-avatars--elevenlabs---gpt-4-10000


# Auto-Create TikTok Videos with VEED.io AI Avatars, ElevenLabs & GPT-4

---

## 1. Workflow Overview

This workflow automates the creation and publishing of viral TikTok videos using a photo and theme input sent via Telegram. It leverages AI technologies including Perplexity for trend research, GPT-4 for script and caption generation, ElevenLabs for voice synthesis, and FAL.ai (VEED.io) for video creation from images and audio. Finally, it publishes the generated content across multiple social platforms and logs the data in Google Sheets.

The workflow is logically grouped into these blocks:

- **1.1 Input Reception:** Receives photo and caption/theme via Telegram.
- **1.2 Trend Research:** Uses Perplexity API to identify trending topics related to the input theme.
- **1.3 Script Generation:** GPT-4 creates a short viral TikTok script based on trends.
- **1.4 Voice Synthesis:** ElevenLabs converts the script text to natural speech audio.
- **1.5 Audio and Image Upload:** Uploads audio and photo to public URLs for processing.
- **1.6 Video Generation:** FAL.ai generates a talking video using the photo and synthesized audio.
- **1.7 Caption Generation:** GPT-4 composes an engaging TikTok caption with hashtags.
- **1.8 Data Logging:** Saves all media URLs, captions, and status to Google Sheets for tracking.
- **1.9 Publishing:** Publishes the video and caption to TikTok and other social media using the Blotato node.
- **1.10 Status Update:** Marks the workflow run as DONE in the Google Sheet.
- **1.11 User Guidance:** Sticky notes provide setup instructions and explanations.

---

## 2. Block-by-Block Analysis

### 1.1 Input Reception

**Overview:**  
Starts the workflow by triggering on incoming Telegram messages containing a photo and optional caption/theme.

**Nodes Involved:**  
- Telegram Trigger  
- Workflow Configuration  
- Extract Photo and Theme  
- Get Photo File from Telegram

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger  
  - Role: Listens for new Telegram messages (photo with caption or text) to start workflow.  
  - Configuration: Triggers on "message" updates only. Uses Telegram API credentials.  
  - Inputs: Telegram messages  
  - Outputs: Message JSON including photo file IDs and captions  
  - Edge Cases: Missing photo or caption leads to empty variables; no trigger if message is not a photo or text.

- **Workflow Configuration**  
  - Type: Set  
  - Role: Sets essential API keys and configuration variables (ElevenLabs API key, voice ID, FAL.ai API key, script max duration, Perplexity model).  
  - Configuration: Static assignment of credentials and parameters to workflow context.  
  - Inputs: Trigger output  
  - Outputs: JSON with configuration variables  
  - Edge Cases: Missing or invalid API keys will cause downstream API calls to fail.

- **Extract Photo and Theme**  
  - Type: Set  
  - Role: Extracts the Telegram photo file ID and theme (caption or text) from the incoming message.  
  - Configuration:  
    - photoUrl: last photo file_id if any, else empty string  
    - theme: message caption or text or defaults to "viral content"  
  - Inputs: Workflow Configuration output  
  - Outputs: JSON with photoUrl and theme  
  - Edge Cases: No photo attached results in empty photoUrl; empty theme defaults to "viral content".

- **Get Photo File from Telegram**  
  - Type: Telegram  
  - Role: Downloads the actual photo file from Telegram servers using the file ID.  
  - Configuration: Uses photoUrl extracted above as fileId parameter.  
  - Inputs: Extract Photo and Theme output  
  - Outputs: Binary photo file data  
  - Edge Cases: Telegram API failures, invalid file ID, or missing photo cause download failure.

---

### 1.2 Trend Research

**Overview:**  
Queries Perplexity API to find top 3 current viral TikTok trends related to the photo caption/theme.

**Nodes Involved:**  
- Build Public Image URL  
- Search Trends with Perplexity

**Node Details:**

- **Build Public Image URL**  
  - Type: HTTP Request (POST multipart-form-data)  
  - Role: Uploads the downloaded photo binary to tmpfiles.org to get a public URL.  
  - Configuration: Uploads photo binary under "data" field.  
  - Inputs: Get Photo File from Telegram output (binary photo)  
  - Outputs: JSON containing public URL for the image  
  - Edge Cases: Upload failures or temporary URL downtime.

- **Search Trends with Perplexity**  
  - Type: Perplexity API  
  - Role: Performs AI-powered search for top 3 viral trends on TikTok related to the photo’s theme.  
  - Configuration:  
    - Model: dynamically set from Workflow Configuration (e.g., "sonar")  
    - Prompt: Finds top 3 viral trends, hashtags, content styles related to caption.  
  - Inputs: Build Public Image URL output (uses caption from Extract Photo and Theme)  
  - Outputs: JSON with trends as string content in response  
  - Edge Cases: API rate limits, invalid API key, or no relevant trends found.

---

### 1.3 Script Generation

**Overview:**  
Generates a concise, engaging TikTok script (max 30 seconds) based on the trends found.

**Nodes Involved:**  
- Generate Script with GPT-4

**Node Details:**

- **Generate Script with GPT-4**  
  - Type: OpenAI API (GPT-4) via LangChain node  
  - Role: Creates a viral TikTok script using the trend data and theme.  
  - Configuration:  
    - Model: "gpt-4o-mini" (GPT-4 optimized)  
    - Prompt instructs to create a max 30-second script with a hook, conversational style optimized for voice synthesis.  
  - Inputs: Search Trends with Perplexity output (trends content) and Extract Photo and Theme (theme)  
  - Outputs: JSON with generated script text  
  - Edge Cases: API quota exceeded, prompt failures, or nonsensical script output.

---

### 1.4 Voice Synthesis

**Overview:**  
Converts the generated script text into natural sounding speech audio (MP3) via ElevenLabs API.

**Nodes Involved:**  
- ElevenLabs Voice Synthesis  
- Convert .mpga to .mp3  
- Upload Audio to Public URL

**Node Details:**

- **ElevenLabs Voice Synthesis**  
  - Type: HTTP Request (POST)  
  - Role: Sends script text to ElevenLabs TTS API to generate voice audio.  
  - Configuration:  
    - URL composed dynamically with voice ID from Workflow Configuration  
    - JSON body includes text, model id "eleven_multilingual_v2", voice stability and similarity settings  
    - Headers include xi-api-key for authentication  
  - Inputs: Generate Script with GPT-4 output (script text)  
  - Outputs: Binary audio in MPGA format (audio/mpeg)  
  - Edge Cases: API key invalid, network timeout, audio format issues.

- **Convert .mpga to .mp3**  
  - Type: Code  
  - Role: Renames binary audio file extension from .mpga to .mp3 and sets MIME type.  
  - Configuration: JavaScript code updates binary property name and metadata.  
  - Inputs: ElevenLabs Voice Synthesis binary audio  
  - Outputs: Binary audio renamed as .mp3  
  - Edge Cases: Missing binary data causes no conversion.

- **Upload Audio to Public URL**  
  - Type: HTTP Request (POST multipart-form-data)  
  - Role: Uploads the mp3 audio file to tmpfiles.org to get a public URL.  
  - Configuration: Form data includes the mp3 binary under "file".  
  - Inputs: Convert .mpga to .mp3 output (binary audio_mp3)  
  - Outputs: JSON with public audio URL  
  - Edge Cases: Upload failure or URL expiration.

---

### 1.5 Video Generation

**Overview:**  
Generates a lip-synced talking video using the uploaded photo and audio via FAL.ai (VEED Fabric 1.0 model).

**Nodes Involved:**  
- FAL.ai Video Generation  
- Wait for VEED  
- Download VEED Video

**Node Details:**

- **FAL.ai Video Generation**  
  - Type: HTTP Request (POST)  
  - Role: Sends a request to FAL.ai endpoint to generate video with image and audio URLs.  
  - Configuration:  
    - JSON body includes public image and audio URLs (converted to tmpfiles.org download links), resolution set to 480p  
    - Authorization header uses FAL API key from Workflow Configuration  
  - Inputs: Upload Audio to Public URL output (audio URL) and Build Public Image URL (image URL)  
  - Outputs: JSON response with request_id for video generation  
  - Edge Cases: API errors, invalid URLs, or processing delays.

- **Wait for VEED**  
  - Type: Wait  
  - Role: Pauses workflow for 10 minutes to allow video processing to complete asynchronously.  
  - Configuration: Wait duration set to 10 minutes  
  - Inputs: FAL.ai Video Generation output  
  - Outputs: Passes data forward after delay  
  - Edge Cases: Fixed wait time may be inefficient if processing is faster/slower.

- **Download VEED Video**  
  - Type: HTTP Request (GET)  
  - Role: Retrieves the generated video file from FAL.ai using the request_id.  
  - Configuration:  
    - URL dynamically built with request_id from previous node  
    - Authorization header with FAL API key  
  - Inputs: Wait for VEED output  
  - Outputs: JSON containing video URL  
  - Edge Cases: Video not ready, 404 errors, or API failures.

---

### 1.6 Caption Generation

**Overview:**  
Creates an engaging TikTok caption optimized for algorithms, including trending hashtags.

**Nodes Involved:**  
- Generate Caption with GPT-4

**Node Details:**

- **Generate Caption with GPT-4**  
  - Type: OpenAI API (GPT-4) via LangChain node  
  - Role: Generates a catchy caption based on the theme and discovered trends.  
  - Configuration:  
    - Model: "gpt-4o-mini"  
    - Prompt requests a catchy hook, 5-8 trending hashtags, concise and engaging text optimized for TikTok.  
  - Inputs: Download VEED Video output (to confirm video is ready), Extract Photo and Theme, Search Trends with Perplexity (trends)  
  - Outputs: Caption text JSON  
  - Edge Cases: API quota, prompt failure, or irrelevant captions.

---

### 1.7 Data Logging

**Overview:**  
Saves the idea, caption, media URLs, and workflow status into a Google Sheets document for tracking.

**Nodes Involved:**  
- Save to Google Sheets  
- Update Status to "DONE"

**Node Details:**

- **Save to Google Sheets**  
  - Type: Google Sheets node  
  - Role: Appends new row with the TikTok idea (caption), generated caption text, audio/image/video URLs.  
  - Configuration:  
    - Document ID and Sheet Name dynamically set  
    - Mapping fields: IDEA, CAPTION, URL AUDIO, URL IMAGE, URL VIDEO  
  - Inputs: Generate Caption with GPT-4 output  
  - Outputs: Confirmation of row addition with data  
  - Edge Cases: Google API auth failures, quota exceeded, or invalid sheet format.

- **Update Status to "DONE"**  
  - Type: Google Sheets node  
  - Role: Updates the STATUS field to "DONE" for the processed video entry.  
  - Configuration:  
    - Matches rows based on URL VIDEO  
    - Appends or updates existing rows  
  - Inputs: Merge node output (after publishing)  
  - Outputs: Confirmation of update  
  - Edge Cases: Mismatched URL keys, Google API errors.

---

### 1.8 Publishing

**Overview:**  
Uploads the generated video and caption to TikTok and multiple other social media platforms via the Blotato community node.

**Nodes Involved:**  
- Send a video (Telegram)  
- Upload Video to BLOTATO  
- Tiktok  
- Linkedin  
- Facebook  
- Instagram  
- Twitter (X)  
- Youtube  
- Threads  
- Bluesky  
- Pinterest  
- Merge1

**Node Details:**

- **Send a video (Telegram)**  
  - Type: Telegram  
  - Role: Sends the generated video back to the user on Telegram chat.  
  - Configuration: Uses chat ID from Telegram Trigger node and video URL from Google Sheets data.  
  - Inputs: Save to Google Sheets output  
  - Outputs: Confirmation of video sent  
  - Edge Cases: Telegram API limits or invalid chat ID.

- **Upload Video to BLOTATO**  
  - Type: Blotato Node (Community)  
  - Role: Uploads video to Blotato platform for social media publishing.  
  - Configuration: Uses video URL from Google Sheets data.  
  - Inputs: Save to Google Sheets output  
  - Outputs: Media ID for publishing nodes  
  - Edge Cases: Blotato API auth errors or upload failures.

- **Social Media Publishing Nodes (Tiktok, Linkedin, Facebook, Instagram, Twitter (X), Youtube, Threads, Bluesky, Pinterest)**  
  - Type: Blotato Node (Community)  
  - Role: Publishes the video with caption to respective platform using Blotato API.  
  - Configuration:  
    - Platform specified (e.g., "tiktok")  
    - Account ID selected from cached accounts  
    - Caption text from Google Sheets  
    - Media URL from Upload Video to BLOTATO node  
  - Inputs: Upload Video to BLOTATO output  
  - Outputs: Post confirmation  
  - Edge Cases: Credential expiry, platform posting limits, content policy rejection.

- **Merge1**  
  - Type: Merge  
  - Role: Combines outputs from all social media publishing nodes to continue workflow.  
  - Configuration: Choose branch mode with 9 inputs  
  - Inputs: All social publishing nodes  
  - Outputs: Combined data for status update  
  - Edge Cases: Partial publishing failures or node errors.

---

### 1.9 User Guidance

**Overview:**  
Sticky notes provide detailed setup instructions and explanations for each step of the workflow including API key configuration, Telegram bot setup, AI processing, voice/video generation, publishing, and usage flow.

**Nodes Involved:**  
- Setup Guide - Start Here  
- Step 1 - Telegram Setup  
- Step 2 - API Keys Configuration  
- Step 3 - AI Processing  
- Step 4 - Voice & Video Generation  
- Step 5 - Publishing  
- How It Works

**Node Details:**  
All are sticky note nodes with detailed textual instructions and helpful links for setting up the workflow and credentials. They guide users through:

- Creating Telegram bot and setting up trigger.  
- Configuring all required API keys (ElevenLabs, FAL.ai, OpenAI, Perplexity, Google Sheets).  
- AI nodes usage and models.  
- Voice and video generation details.  
- Publishing via Blotato node community plugin with supported platforms.  
- Overall workflow operation and expected results.

---

## 3. Summary Table

| Node Name                  | Node Type                      | Functional Role                        | Input Node(s)                     | Output Node(s)                         | Sticky Note                                                                                                          |
|----------------------------|--------------------------------|-------------------------------------|----------------------------------|--------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger            | Telegram Trigger               | Start workflow on Telegram message  | -                                | Workflow Configuration                | # 📱 STEP 1: TELEGRAM BOT SETUP (detailed setup instructions)                                                         |
| Workflow Configuration     | Set                           | Stores API keys and config variables| Telegram Trigger                 | Extract Photo and Theme               | # 🔑 STEP 2: API KEYS CONFIGURATION (API keys setup instructions)                                                    |
| Extract Photo and Theme    | Set                           | Extract photo file ID and theme     | Workflow Configuration           | Get Photo File from Telegram          |                                                                                                                      |
| Get Photo File from Telegram| Telegram                      | Downloads photo from Telegram       | Extract Photo and Theme          | Build Public Image URL                |                                                                                                                      |
| Build Public Image URL     | HTTP Request                   | Uploads photo to public URL         | Get Photo File from Telegram     | Search Trends with Perplexity         |                                                                                                                      |
| Search Trends with Perplexity| Perplexity API               | Finds viral TikTok trends           | Build Public Image URL           | Generate Script with GPT-4            | # 🤖 STEP 3: AI PROCESSING SETUP (Perplexity and OpenAI details)                                                     |
| Generate Script with GPT-4 | OpenAI (LangChain)             | Creates TikTok script               | Search Trends with Perplexity    | ElevenLabs Voice Synthesis            |                                                                                                                      |
| ElevenLabs Voice Synthesis | HTTP Request                   | Converts script text to speech      | Generate Script with GPT-4       | Convert .mpga to .mp3                 | # 🎬 STEP 4: VOICE & VIDEO GENERATION (ElevenLabs and FAL.ai APIs explanation)                                        |
| Convert .mpga to .mp3      | Code                          | Renames audio binary to .mp3        | ElevenLabs Voice Synthesis       | Upload Audio to Public URL            |                                                                                                                      |
| Upload Audio to Public URL | HTTP Request                   | Uploads audio file to public URL    | Convert .mpga to .mp3            | FAL.ai Video Generation               |                                                                                                                      |
| FAL.ai Video Generation    | HTTP Request                   | Requests talking video generation   | Upload Audio to Public URL       | Wait for VEED                        |                                                                                                                      |
| Wait for VEED             | Wait                          | Waits for video processing          | FAL.ai Video Generation          | Download VEED Video                   |                                                                                                                      |
| Download VEED Video       | HTTP Request                   | Downloads generated video           | Wait for VEED                   | Generate Caption with GPT-4           |                                                                                                                      |
| Generate Caption with GPT-4| OpenAI (LangChain)             | Creates TikTok caption              | Download VEED Video             | Save to Google Sheets                 |                                                                                                                      |
| Save to Google Sheets     | Google Sheets                  | Logs idea, caption, media URLs      | Generate Caption with GPT-4      | Send a video, Upload Video to BLOTATO|                                                                                                                      |
| Send a video              | Telegram                      | Sends generated video on Telegram   | Save to Google Sheets            | Upload Video to BLOTATO               |                                                                                                                      |
| Upload Video to BLOTATO   | Blotato Node                  | Uploads video for social publishing | Save to Google Sheets            | Social media publishing nodes         | # 📤 STEP 5: PUBLISHING & TRACKING (Blotato installation and publishing instructions)                                |
| Tiktok                    | Blotato Node                  | Publishes video to TikTok           | Upload Video to BLOTATO          | Merge1                              |                                                                                                                      |
| Linkedin                  | Blotato Node                  | Publishes video to LinkedIn         | Upload Video to BLOTATO          | Merge1                              |                                                                                                                      |
| Facebook                  | Blotato Node                  | Publishes video to Facebook         | Upload Video to BLOTATO          | Merge1                              |                                                                                                                      |
| Instagram                 | Blotato Node                  | Publishes video to Instagram        | Upload Video to BLOTATO          | Merge1                              |                                                                                                                      |
| Twitter (X)               | Blotato Node                  | Publishes video to Twitter (X)      | Upload Video to BLOTATO          | Merge1                              |                                                                                                                      |
| Youtube                   | Blotato Node                  | Publishes video to YouTube          | Upload Video to BLOTATO          | Merge1                              |                                                                                                                      |
| Threads                   | Blotato Node                  | Publishes video to Threads          | Upload Video to BLOTATO          | Merge1                              |                                                                                                                      |
| Bluesky                   | Blotato Node                  | Publishes video to Bluesky          | Upload Video to BLOTATO          | Merge1                              |                                                                                                                      |
| Pinterest                 | Blotato Node                  | Publishes video to Pinterest        | Upload Video to BLOTATO          | Merge1                              |                                                                                                                      |
| Merge1                    | Merge                         | Combines all social publishing outputs| All social publishing nodes    | Update Status to "DONE"               |                                                                                                                      |
| Update Status to "DONE"   | Google Sheets                 | Updates Google Sheet status to DONE | Merge1                         | -                                    |                                                                                                                      |
| Setup Guide - Start Here  | Sticky Note                   | Provides full setup guide           | -                              | -                                    | Contains full setup guide, tutorial links, and contact info.                                                         |
| Step 1 - Telegram Setup   | Sticky Note                   | Telegram bot setup instructions     | -                              | -                                    | Detailed Telegram bot creation and trigger node instructions.                                                        |
| Step 2 - API Keys Configuration| Sticky Note              | API keys configuration instructions | -                              | -                                    | Instructions to set ElevenLabs, FAL.ai, and other API keys.                                                           |
| Step 3 - AI Processing    | Sticky Note                   | AI nodes setup guidance              | -                              | -                                    | Details on Perplexity, OpenAI, and FAL.ai API usage.                                                                  |
| Step 4 - Voice & Video Generation| Sticky Note             | Voice and video generation overview | -                              | -                                    | Explains ElevenLabs and FAL.ai nodes, no config needed.                                                               |
| Step 5 - Publishing       | Sticky Note                   | Publishing & tracking instructions   | -                              | -                                    | Blotato node installation and publishing setup instructions with links.                                               |
| How It Works              | Sticky Note                   | Workflow flow summary                | -                              | -                                    | Stepwise functional overview with timing and usage example.                                                           |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Set to trigger on "message" updates (photo or text).  
   - Add Telegram API credentials (Bot token).  
   - Activate webhook.

2. **Add Workflow Configuration Node (Set)**  
   - Create a "Set" node to store:  
     - `elevenLabsApiKey` (string)  
     - `elevenLabsVoiceId` (string)  
     - `falApiKey` (string)  
     - `scriptMaxDuration` (number, default 30)  
     - `perplexityModel` (string, e.g., "sonar")  
   - No input required; connects from Telegram Trigger.

3. **Add Extract Photo and Theme Node (Set)**  
   - Extract last photo file_id from incoming message JSON: `{{$json.message.photo ? $json.message.photo[$json.message.photo.length - 1].file_id : ''}}`  
   - Extract theme from caption or text or default "viral content": `{{$json.message.caption || $json.message.text || 'viral content'}}`  
   - Connect from Workflow Configuration node.

4. **Add Get Photo File from Telegram Node**  
   - Type: Telegram  
   - Resource: File  
   - Parameter: `fileId` set to `{{$json.photoUrl}}`  
   - Use Telegram API credentials  
   - Connect from Extract Photo and Theme.

5. **Add Build Public Image URL Node (HTTP Request)**  
   - Method: POST  
   - URL: https://tmpfiles.org/api/v1/upload  
   - Body: multipart-form-data, field name "data" with binary photo file from previous node  
   - Response format: JSON expected  
   - Connect from Get Photo File from Telegram.

6. **Add Search Trends with Perplexity Node**  
   - Use Perplexity API node with API key credentials  
   - Model: set from Workflow Configuration node (e.g., `{{$node["Workflow Configuration"].json.perplexityModel}}`)  
   - Message prompt: "Find top 3 current viral trends related to: {{caption}}..." (use caption from Extract Photo and Theme)  
   - Connect from Build Public Image URL.

7. **Add Generate Script with GPT-4 Node (OpenAI)**  
   - Use OpenAI API credentials  
   - Model: "gpt-4o-mini"  
   - Prompt: Create viral 30-second TikTok script based on trends and theme, with hook and optimized for voice synthesis.  
   - Connect from Search Trends with Perplexity.

8. **Add ElevenLabs Voice Synthesis Node (HTTP Request)**  
   - POST to `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}` where voiceId from Workflow Configuration  
   - Body JSON: `{text: script text, model_id: "eleven_multilingual_v2", voice_settings: {...}}`  
   - Headers: xi-api-key from Workflow Configuration, Content-Type `application/json`, Accept `audio/mpeg`  
   - Connect from Generate Script with GPT-4.

9. **Add Convert .mpga to .mp3 Node (Code)**  
   - JavaScript code to rename binary audio file extension from .mpga to .mp3 and set MIME type  
   - Connect from ElevenLabs Voice Synthesis.

10. **Add Upload Audio to Public URL Node (HTTP Request)**  
    - POST to https://tmpfiles.org/api/v1/upload  
    - multipart-form-data with "file" field from previous node binary audio_mp3  
    - Response: JSON  
    - Connect from Convert .mpga to .mp3.

11. **Add FAL.ai Video Generation Node (HTTP Request)**  
    - POST to https://queue.fal.run/veed/fabric-1.0  
    - Header Authorization with FAL API key from Workflow Configuration  
    - Body JSON with:  
      - image_url: public image URL replacing tmpfiles.org link to download link  
      - audio_url: public audio URL replacing tmpfiles.org link to download link  
      - resolution: "480p"  
    - Connect from Upload Audio to Public URL.

12. **Add Wait for VEED Node (Wait)**  
    - Wait 10 minutes for video generation  
    - Connect from FAL.ai Video Generation.

13. **Add Download VEED Video Node (HTTP Request)**  
    - GET to `https://queue.fal.run/veed/fabric-1.0/requests/{request_id}` from previous node response  
    - Header Authorization with FAL API key  
    - Connect from Wait for VEED.

14. **Add Generate Caption with GPT-4 Node (OpenAI)**  
    - Use OpenAI API credentials  
    - Model: "gpt-4o-mini"  
    - Prompt: Create engaging caption with trending hashtags based on theme and trends  
    - Connect from Download VEED Video.

15. **Add Save to Google Sheets Node**  
    - Google Sheets OAuth2 credential setup  
    - Document ID and Sheet Name configured  
    - Append row with columns: IDEA (caption), CAPTION (generated caption), URL AUDIO, URL IMAGE, URL VIDEO  
    - Connect from Generate Caption with GPT-4.

16. **Add Send a video Node (Telegram)**  
    - Operation: Send Video  
    - Chat ID from Telegram Trigger message chat id  
    - File URL from Google Sheets URL VIDEO column  
    - Connect from Save to Google Sheets.

17. **Add Upload Video to BLOTATO Node**  
    - Use Blotato API credentials  
    - Upload video URL from Google Sheets URL VIDEO  
    - Connect from Save to Google Sheets.

18. **Add Social Media Publishing Nodes (Tiktok, Linkedin, Facebook, Instagram, Twitter (X), Youtube, Threads, Bluesky, Pinterest)**  
    - Use Blotato API credentials  
    - Platform set accordingly  
    - Account IDs selected from dashboard  
    - Caption text from Google Sheets CAPTION  
    - Media URL from Upload Video to BLOTATO  
    - All connect from Upload Video to BLOTATO node.

19. **Add Merge Node (Merge1)**  
    - Mode: Choose Branch  
    - Inputs: all social publishing nodes (9 inputs)  
    - Connect all social publishing nodes outputs to Merge1.

20. **Add Update Status to "DONE" Node (Google Sheets)**  
    - Google Sheets OAuth2 configured  
    - Append or update row matching on URL VIDEO column  
    - Set STATUS field to "DONE"  
    - Connect from Merge1 output.

21. **Add Sticky Notes**  
    - Add multiple sticky notes for guidance:  
      - Setup Guide - Start Here  
      - Step 1 - Telegram Setup  
      - Step 2 - API Keys Configuration  
      - Step 3 - AI Processing Setup  
      - Step 4 - Voice & Video Generation  
      - Step 5 - Publishing & Tracking  
      - How It Works (workflow summary)

---

## 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                                                                         |
|------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Workflow transforms photo + theme sent via Telegram into viral TikTok videos automatically.          | General workflow purpose.                                                                              |
| Setup guide video on YouTube: [https://youtu.be/YykmUeGVb9U](https://youtu.be/YykmUeGVb9U)             | Setup Guide sticky note.                                                                               |
| Google Sheets setup tutorial: [https://youtu.be/fDzVmdw7bNU](https://youtu.be/fDzVmdw7bNU)             | API keys and credentials configuration instructions.                                                  |
| Sample Google Sheets data template: [Sheet Link](https://docs.google.com/spreadsheets/d/1G1hS5pEJb4PdPYuChl_ZLNCQNH8CaG6iSa-Ip9W1cTI/edit?usp=sharing/copy) | Google Sheets data format for logging.                                                                |
| Blotato node and API: [https://blotato.com/?ref=firas](https://blotato.com/?ref=firas)                 | Used for multi-platform social media publishing.                                                      |
| Contact for support and consulting: LinkedIn - [https://www.linkedin.com/in/dr-firas/](https://www.linkedin.com/in/dr-firas/) | Support channels provided in sticky notes.                                                            |
| Contact for support and consulting: YouTube - [https://www.youtube.com/@DRFIRASS](https://www.youtube.com/@DRFIRASS) | Support channels provided in sticky notes.                                                            |

---

**Disclaimer:**  
The text provided is exclusively extracted from an automated workflow created with n8n, complying strictly with content policies and containing no illegal, offensive, or protected elements. All processed data is legal and public.

---