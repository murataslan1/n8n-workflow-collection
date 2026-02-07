Auto-Generate Social Media Videos with GPT-5 and Publish via Blotato

https://n8nworkflows.xyz/workflows/auto-generate-social-media-videos-with-gpt-5-and-publish-via-blotato-7348


# Auto-Generate Social Media Videos with GPT-5 and Publish via Blotato

### 1. Workflow Overview

This workflow automates the entire process of generating social media video content from video files received via Telegram, using AI-powered transcription and content generation (GPT-5), storing metadata in Google Sheets, uploading videos to Google Drive, and then publishing the final videos with generated titles and captions across nine social media platforms through Blotato.

Logical blocks are grouped as follows:

- **1.1 Input Reception**: Receives video ideas via Telegram and initiates data recording.
- **1.2 Video Processing and Storage**: Downloads the video, uploads it to Google Drive, and transcribes audio to text.
- **1.3 Data Management**: Saves and merges video metadata and transcription in Google Sheets.
- **1.4 AI Content Generation**: Uses GPT-5 to generate a concise title and caption from the transcription.
- **1.5 Content Publishing**: Uploads the video to Blotato and publishes it on multiple social media platforms.
- **1.6 Notifications and Status Updates**: Updates status in Google Sheets and notifies the Telegram user when posting is complete.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block captures incoming video ideas from Telegram, creates a new row in Google Sheets with the video file name, and triggers the workflow.

**Nodes Involved:**  
- Telegram - Receive Video Idea  
- Google Sheets - Create Row

**Node Details:**

- **Telegram - Receive Video Idea**  
  - Type: Telegram Trigger  
  - Role: Listens for new Telegram messages containing video input.  
  - Configuration: Watches for "message" updates.  
  - Credentials: Telegram API credentials.  
  - Input: Incoming Telegram messages.  
  - Output: JSON with video metadata (file name, file id, chat id).  
  - Edge cases: Telegram API connection issues, video missing in message.

- **Google Sheets - Create Row**  
  - Type: Google Sheets node  
  - Role: Append a new row with the video file name to a preconfigured Google Sheet.  
  - Configuration: Maps "NAME FILE" column to the Telegram video file name.  
  - Credentials: Google Sheets OAuth2 credentials.  
  - Input: Video file metadata from Telegram node.  
  - Output: Confirmation of row creation.  
  - Edge cases: API rate limits, Google Sheets permission issues.

---

#### 1.2 Video Processing and Storage

**Overview:**  
Downloads the video from Telegram, uploads the video file to Google Drive, transcribes the audio content to text using OpenAI Whisper, and stores the video metadata and transcription back into Google Sheets.

**Nodes Involved:**  
- Telegram - Download Video  
- Google Drive - Upload Video  
- OpenAI - Transcribe Video to Text  
- Google Sheets - Save Video Info  
- Google Sheets - Save Transcript  
- Merge - Join Video + Transcript  

**Node Details:**

- **Telegram - Download Video**  
  - Type: Telegram node  
  - Role: Downloads the video file from Telegram using the file ID.  
  - Configuration: Uses fileId from Telegram Receive Video Idea node.  
  - Credentials: Telegram API credentials.  
  - Input: Video file id from Telegram trigger.  
  - Output: Binary video data.  
  - Edge cases: File download failures, Telegram API errors.

- **Google Drive - Upload Video**  
  - Type: Google Drive node  
  - Role: Uploads the downloaded video file to a specific Google Drive folder.  
  - Configuration: Uses video file name and uploads to a specified folder ID.  
  - Credentials: Google Drive OAuth2 credentials.  
  - Input: Video binary data from Telegram download.  
  - Output: Metadata including Google Drive file ID and shareable link.  
  - Edge cases: Permission errors, quota limits.

- **OpenAI - Transcribe Video to Text**  
  - Type: OpenAI (LangChain) node  
  - Role: Transcribes video audio into French text using OpenAI's audio transcription.  
  - Configuration: Language set to French, temperature 0 for deterministic output.  
  - Credentials: OpenAI API credentials.  
  - Input: Video binary/audio stream from Telegram download.  
  - Output: Transcribed text.  
  - Edge cases: Transcription errors, API rate limits.

- **Google Sheets - Save Video Info**  
  - Type: Google Sheets node  
  - Role: Saves video metadata (file name, Google Drive URL and ID) into the sheet, updating or appending based on file name.  
  - Credentials: Google Sheets OAuth2 credentials.  
  - Input: Output from Google Drive upload and Telegram video metadata.  
  - Output: Confirmation of data write.  
  - Edge cases: Update conflicts, API errors.

- **Google Sheets - Save Transcript**  
  - Type: Google Sheets node  
  - Role: Saves the transcription text linked to the video file name.  
  - Credentials: Google Sheets OAuth2 credentials.  
  - Input: Transcribed text and file name.  
  - Output: Confirmation of data write.  
  - Edge cases: Same as above.

- **Merge - Join Video + Transcript**  
  - Type: Merge node  
  - Role: Combines outputs from Google Sheets - Save Video Info and Save Transcript nodes to synchronize data for the next step.  
  - Configuration: Mode "chooseBranch" to merge matching data.  
  - Input: Two sources (video info and transcript).  
  - Output: Merged JSON containing complete video metadata and transcription.  
  - Edge cases: Mismatch or missing data from either input.

---

#### 1.3 Data Management

**Overview:**  
Reads the combined video metadata and transcription from Google Sheets to prepare the input for AI content generation.

**Nodes Involved:**  
- Google Sheets - Read Data for AI  
- AI Agent - Generate Title & Caption  
- OpenAI Model GPT-5  
- LangChain - Think Tool  
- Google Sheets - Update Title & Caption  

**Node Details:**

- **Google Sheets - Read Data for AI**  
  - Type: Google Sheets node  
  - Role: Reads the row matching the video file name to get transcription and other data for AI processing.  
  - Credentials: Google Sheets OAuth2 credentials.  
  - Input: Merged data from previous step.  
  - Output: Row data with transcription.  
  - Edge cases: Missing row, read permission.

- **AI Agent - Generate Title & Caption**  
  - Type: LangChain Agent node  
  - Role: Generates a concise title and caption purely from transcription text.  
  - Configuration: System message instructs generating output JSON with strict rules (no emojis, ≤70 chars title, ≤200 chars caption, language detection).  
  - Input: Transcription text from Google Sheets.  
  - Output: JSON with title and caption.  
  - Edge cases: Misinterpretation of transcription, output parsing errors.

- **OpenAI Model GPT-5**  
  - Type: LangChain LM Chat OpenAI node  
  - Role: GPT-5 model used as language model for AI Agent.  
  - Credentials: OpenAI API credentials.  
  - Configuration: Model selected as "gpt-5".  
  - Input: Passed text from AI Agent.  
  - Output: AI-generated text.  
  - Edge cases: API limits, model availability.

- **LangChain - Think Tool**  
  - Type: LangChain Tool node  
  - Role: Helper tool integrated with AI Agent for reasoning or additional processing.  
  - Input/Output: Internal to AI Agent workflow.  
  - Edge cases: Tool errors.

- **Google Sheets - Update Title & Caption**  
  - Type: Google Sheets Tool node  
  - Role: Updates the Google Sheets row to add the AI-generated title and caption for the video.  
  - Credentials: Google Sheets OAuth2 credentials.  
  - Input: AI-generated JSON fields and file name for matching.  
  - Output: Updated row confirmation.  
  - Edge cases: Update conflicts, API errors.

---

#### 1.4 Content Publishing

**Overview:**  
Extracts the Google Drive file ID from the URL, uploads the video to Blotato, and publishes the generated video post on nine social media platforms in parallel.

**Nodes Involved:**  
- Google Sheets - Read Post Data  
- Get Google Drive ID  
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
- Merge  

**Node Details:**

- **Google Sheets - Read Post Data**  
  - Type: Google Sheets node  
  - Role: Reads the row by video file name to retrieve caption, title, and Google Drive URL for publishing.  
  - Credentials: Google Sheets OAuth2 credentials.  
  - Input: File name from AI Agent output.  
  - Output: Post data for each platform.  
  - Edge cases: Missing or incomplete data.

- **Get Google Drive ID**  
  - Type: Set node  
  - Role: Extracts the Google Drive file ID from the full shareable URL using regex.  
  - Input: Google Drive URL from Sheets.  
  - Output: Parsed file ID.  
  - Edge cases: Malformed URL.

- **Upload Video to BLOTATO**  
  - Type: Blotato node (verified community node)  
  - Role: Uploads the video media using the Google Drive direct download link to Blotato platform.  
  - Credentials: Blotato API credentials.  
  - Input: Google Drive file ID processed URL.  
  - Output: Media URL for posting.  
  - Edge cases: Upload failures, API key issues.

- **Tiktok, Linkedin, Facebook, Instagram, Twitter (X), Youtube, Threads, Bluesky, Pinterest**  
  - Type: Blotato nodes, one per platform  
  - Role: Publish the video post with caption and media URL on each platform.  
  - Credentials: Blotato API credentials with specific account IDs configured for each platform.  
  - Input: Caption from Google Sheets, media URL from upload, and platform-specific parameters (privacy, page IDs, board IDs).  
  - Output: Confirmation of post creation.  
  - Edge cases: Platform-specific API errors, rate limits, media format issues.

- **Merge**  
  - Type: Merge node  
  - Role: Collects all outputs from platform posting nodes to converge for status update.  
  - Configuration: Number of inputs set to 9 (one per platform).  
  - Edge cases: Partial failures among platforms.

---

#### 1.5 Notifications and Status Updates

**Overview:**  
Updates the posting status in Google Sheets and sends a Telegram notification confirming post completion.

**Nodes Involved:**  
- Google Sheets - Update Status  
- Telegram - Notify Post Done

**Node Details:**

- **Google Sheets - Update Status**  
  - Type: Google Sheets node  
  - Role: Updates the "Status" to "DONE" in the Google Sheet row matching the Google Drive ID.  
  - Credentials: Google Sheets OAuth2 credentials.  
  - Input: Google Drive ID and status update after successful merge.  
  - Output: Confirmation of update.  
  - Edge cases: Update conflicts.

- **Telegram - Notify Post Done**  
  - Type: Telegram node  
  - Role: Sends a "POST DONE" message back to the Telegram chat where video was originally received.  
  - Credentials: Telegram API credentials.  
  - Input: Chat ID from initial Telegram trigger.  
  - Output: Delivery confirmation.  
  - Edge cases: Telegram API failures.

---

### 3. Summary Table

| Node Name                      | Node Type                     | Functional Role                      | Input Node(s)                          | Output Node(s)                       | Sticky Note                                                                                             |
|--------------------------------|-------------------------------|------------------------------------|--------------------------------------|------------------------------------|-------------------------------------------------------------------------------------------------------|
| Telegram - Receive Video Idea   | Telegram Trigger              | Receive new video idea via Telegram| -                                    | Google Sheets - Create Row          |                                                                                                       |
| Google Sheets - Create Row      | Google Sheets                 | Create initial row with video name | Telegram - Receive Video Idea         | Telegram - Download Video           |                                                                                                       |
| Telegram - Download Video       | Telegram                      | Download video file from Telegram   | Google Sheets - Create Row            | Google Drive - Upload Video; OpenAI - Transcribe Video to Text |                                                                                                       |
| Google Drive - Upload Video     | Google Drive                  | Upload video to Google Drive        | Telegram - Download Video             | Google Sheets - Save Video Info     |                                                                                                       |
| OpenAI - Transcribe Video to Text| OpenAI LangChain             | Transcribe video audio to text      | Telegram - Download Video             | Google Sheets - Save Transcript     |                                                                                                       |
| Google Sheets - Save Video Info | Google Sheets                 | Save video metadata                 | Google Drive - Upload Video           | Merge - Join Video + Transcript     |                                                                                                       |
| Google Sheets - Save Transcript | Google Sheets                 | Save transcription text             | OpenAI - Transcribe Video to Text    | Merge - Join Video + Transcript     |                                                                                                       |
| Merge - Join Video + Transcript | Merge                        | Combine video info and transcript   | Google Sheets - Save Video Info; Google Sheets - Save Transcript | Google Sheets - Read Data for AI      |                                                                                                       |
| Google Sheets - Read Data for AI| Google Sheets                 | Read transcription for AI input     | Merge - Join Video + Transcript       | AI Agent - Generate Title & Caption |                                                                                                       |
| AI Agent - Generate Title & Caption| LangChain Agent            | Generate title & caption with GPT-5| Google Sheets - Read Data for AI      | Google Sheets - Read Post Data; Google Sheets - Update Title & Caption |                                                                                                       |
| OpenAI Model GPT-5              | LangChain LM Chat OpenAI      | GPT-5 model backend for AI Agent    | AI Agent - Generate Title & Caption   | AI Agent - Generate Title & Caption |                                                                                                       |
| LangChain - Think Tool          | LangChain Tool               | Helper tool for AI Agent            | AI Agent - Generate Title & Caption   | AI Agent - Generate Title & Caption |                                                                                                       |
| Google Sheets - Update Title & Caption| Google Sheets Tool       | Update sheet with AI-generated title & caption | AI Agent - Generate Title & Caption | Google Sheets - Read Post Data       |                                                                                                       |
| Google Sheets - Read Post Data  | Google Sheets                 | Read title, caption, and URL for posting | AI Agent - Generate Title & Caption  | Get Google Drive ID                  |                                                                                                       |
| Get Google Drive ID             | Set                          | Extract Google Drive file ID from URL | Google Sheets - Read Post Data        | Upload Video to BLOTATO              |                                                                                                       |
| Upload Video to BLOTATO         | Blotato                      | Upload video to Blotato platform    | Get Google Drive ID                   | Tiktok, Linkedin, Facebook, Instagram, Twitter (X), Youtube, Threads, Bluesky, Pinterest |                                                                                                       |
| Tiktok                        | Blotato                       | Post video on TikTok                | Upload Video to BLOTATO               | Merge                              |                                                                                                       |
| Linkedin                      | Blotato                       | Post video on LinkedIn              | Upload Video to BLOTATO               | Merge                              |                                                                                                       |
| Facebook                      | Blotato                       | Post video on Facebook              | Upload Video to BLOTATO               | Merge                              |                                                                                                       |
| Instagram                    | Blotato                       | Post video as Instagram Reel        | Upload Video to BLOTATO               | Merge                              |                                                                                                       |
| Twitter (X)                  | Blotato                       | Post video on Twitter (X)           | Upload Video to BLOTATO               | Merge                              |                                                                                                       |
| Youtube                      | Blotato                       | Post video on YouTube (private)     | Upload Video to BLOTATO               | Merge                              |                                                                                                       |
| Threads                      | Blotato                       | Post video on Threads               | Upload Video to BLOTATO               | Merge                              |                                                                                                       |
| Bluesky                      | Blotato                       | Post video on Bluesky               | Upload Video to BLOTATO               | Merge                              |                                                                                                       |
| Pinterest                   | Blotato                       | Post video on Pinterest             | Upload Video to BLOTATO               | Merge                              |                                                                                                       |
| Merge                       | Merge                        | Aggregate all social platform posts | All platform nodes                    | Google Sheets - Update Status       |                                                                                                       |
| Google Sheets - Update Status  | Google Sheets                 | Mark post as DONE in sheet          | Merge                               | Telegram - Notify Post Done          |                                                                                                       |
| Telegram - Notify Post Done    | Telegram                      | Notify Telegram user post completed | Google Sheets - Update Status         | -                                  |                                                                                                       |
| Sticky Note2                 | Sticky Note                  | Workflow Step 1 description          | -                                    | -                                  | "# 🧠 Step 1 — Generate Title & Caption from a Video"                                                   |
| Sticky Note4                 | Sticky Note                  | Workflow Step 2 description          | -                                    | -                                  | "# 🚀 Step 2 — Auto-Publish to 9 Social Platforms"                                                     |
| Sticky Note                  | Sticky Note                  | Full workflow overview and instructions | -                                    | -                                  | Detailed workflow explanation, YouTube tutorial link, documentation, and setup instructions.          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure to trigger on "message" updates.  
   - Connect your Telegram API credentials.

2. **Create Google Sheets - Create Row Node**  
   - Append mode.  
   - Map "NAME FILE" column to Telegram incoming video file name (`{{$json.message.video.file_name}}`).  
   - Connect to your Google Sheets OAuth2 credentials and specify the spreadsheet and sheet.

3. **Connect Telegram Trigger → Google Sheets Create Row**

4. **Create Telegram - Download Video Node**  
   - Set fileId to `{{$json.message.video.file_id}}` from Telegram trigger.  
   - Connect Telegram credentials.

5. **Connect Google Sheets Create Row → Telegram Download Video**

6. **Create Google Drive - Upload Video Node**  
   - Upload the video file from Telegram download's binary data.  
   - Set file name to `{{$json.message.video.file_name}}`.  
   - Choose the target Google Drive folder by folder ID.  
   - Connect Google Drive OAuth2 credentials.

7. **Connect Telegram Download Video → Google Drive Upload Video**

8. **Create OpenAI - Transcribe Video to Text Node**  
   - Set language to French (`fr`), temperature 0.  
   - Use the audio resource type.  
   - Connect OpenAI credentials.

9. **Connect Telegram Download Video → OpenAI Transcribe**

10. **Create Google Sheets - Save Video Info Node**  
    - Append or update mode, matching on "NAME FILE".  
    - Save file name, Google Drive webViewLink, and Drive file ID.  
    - Connect Google Sheets OAuth2 credentials.

11. **Connect Google Drive Upload Video → Google Sheets Save Video Info**

12. **Create Google Sheets - Save Transcript Node**  
    - Append or update mode, matching on "NAME FILE".  
    - Save transcription text from OpenAI node output.  
    - Connect Google Sheets OAuth2 credentials.

13. **Connect OpenAI Transcribe → Google Sheets Save Transcript**

14. **Create Merge Node (Join Video + Transcript)**  
    - Mode: Choose Branch  
    - Connect inputs from Google Sheets Save Video Info and Save Transcript.

15. **Connect Google Sheets Save Video Info and Save Transcript → Merge Join Video + Transcript**

16. **Create Google Sheets - Read Data for AI Node**  
    - Filter rows by "NAME FILE" matching video file name.  
    - Connect Google Sheets OAuth2 credentials.

17. **Connect Merge → Google Sheets Read Data for AI**

18. **Create AI Agent - Generate Title & Caption Node**  
    - Use the transcription text as input.  
    - Set system message with instructions to generate JSON containing title and caption (no emojis, language detection, length limits).  
    - Use GPT-5 model under the hood.  
    - Connect OpenAI API credentials.

19. **Connect Google Sheets Read Data for AI → AI Agent**

20. **Create Google Sheets - Read Post Data Node**  
    - Filter rows by "NAME FILE" for retrieving caption, title, and Google Drive URL.  
    - Connect Google Sheets OAuth2 credentials.

21. **Connect AI Agent → Google Sheets Read Post Data**

22. **Create Google Sheets - Update Title & Caption Node**  
    - Update mode matching on "NAME FILE".  
    - Update "Title" and "Caption" columns with AI output.  
    - Connect Google Sheets OAuth2 credentials.

23. **Connect AI Agent (ai_tool output) → Google Sheets Update Title & Caption**

24. **Create Set Node - Get Google Drive ID**  
    - Parse Google Drive file ID from URL using regex expression on the URL from Google Sheets Read Post Data.  
    - Variable `final_google_drive_url` holds the extracted ID.

25. **Connect Google Sheets Read Post Data → Get Google Drive ID**

26. **Create Blotato - Upload Video to BLOTATO Node**  
    - Upload video using the direct Google Drive download URL constructed with `https://drive.google.com/uc?export=download&id={{final_google_drive_url}}`.  
    - Set resource to "media".  
    - Connect Blotato API credentials.

27. **Connect Get Google Drive ID → Upload Video to BLOTATO**

28. **Create Blotato Nodes for Each Social Platform (9 total):**  
    - TikTok, LinkedIn, Facebook, Instagram, Twitter (X), YouTube, Threads, Bluesky, Pinterest.  
    - Use platform-specific parameters: account IDs, page/board IDs as required.  
    - Use caption from Google Sheets post data.  
    - Use media URL from the Blotato upload output.  
    - Connect Blotato API credentials.

29. **Connect Upload Video to BLOTATO → Each Platform Node**

30. **Create Merge Node (numberInputs: 9) to collect all platform posting outputs**

31. **Connect all platform nodes → Merge**

32. **Create Google Sheets - Update Status Node**  
    - Append or update mode matching on Google Drive file ID.  
    - Update "Status" column to "DONE".  
    - Connect Google Sheets OAuth2 credentials.

33. **Connect Merge → Google Sheets Update Status**

34. **Create Telegram - Notify Post Done Node**  
    - Send "POST DONE" message to Telegram chat ID from initial Telegram trigger.  
    - Connect Telegram API credentials.

35. **Connect Google Sheets Update Status → Telegram Notify Post Done**

36. **Add Sticky Notes** at appropriate workflow sections to document step 1 (Title & Caption generation) and step 2 (Publishing to social platforms), plus the comprehensive overview with instructions and links.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                        | Context or Link                                                                                                  |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Full video tutorial available on YouTube demonstrating the entire workflow from setup to execution.                                                                                                                                                                                                                                                                                                                              | https://youtu.be/E9NhhUDK42g                                                                                    |
| Detailed documentation including setup instructions, API configuration, and platform connection guides provided on Notion.                                                                                                                                                                                                                                                                                                       | https://automatisation.notion.site/Blotato-2473d6550fd980e19983f69611a80a0d?source=copy_link                     |
| Requirements: Blotato Pro account for API access, enable verified community nodes in n8n, install Blotato node, Google Sheet template duplication, Google Drive folder must be public.                                                                                                                                                                                                                                           | Included in Sticky Note content inside the workflow                                                             |
| The workflow uses the new GPT-5 model and LangChain integration for advanced AI processing. Ensure your OpenAI API credentials support GPT-5.                                                                                                                                                                                                                                                                                     | OpenAI account setup required                                                                                   |
| The Google Drive URLs used for direct download are parsed carefully to avoid broken links in Blotato uploads.                                                                                                                                                                                                                                                                                                                    | Regex extraction in "Get Google Drive ID" node                                                                  |
| The Blotato nodes require correct account IDs per platform and may need adjustments if accounts change or new platforms are added.                                                                                                                                                                                                                                                                                               | Managed via JSON cachedResultUrl properties in node config                                                      |
| Telegram API credentials must have sufficient permissions to send and receive messages and download videos.                                                                                                                                                                                                                                                                                                                      | Telegram Bot API setup                                                                                           |

---

**Disclaimer:**  
The provided content originates exclusively from an automated workflow created with n8n integration and automation tool. The processing complies strictly with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.