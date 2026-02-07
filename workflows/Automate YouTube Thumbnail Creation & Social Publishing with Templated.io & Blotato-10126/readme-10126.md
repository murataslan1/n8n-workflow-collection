Automate YouTube Thumbnail Creation & Social Publishing with Templated.io & Blotato

https://n8nworkflows.xyz/workflows/automate-youtube-thumbnail-creation---social-publishing-with-templated-io---blotato-10126


# Automate YouTube Thumbnail Creation & Social Publishing with Templated.io & Blotato

### 1. Workflow Overview

This workflow automates the creation of YouTube video thumbnails and the subsequent social media publishing process, triggered by receiving YouTube video links via Telegram messages. It is designed for content creators and social media managers who want to streamline thumbnail creation, storage, and promotion across multiple platforms.

**Logical blocks:**

- **1.1 Input Reception & Validation**  
  Receives YouTube URLs from Telegram messages and extracts video IDs.

- **1.2 YouTube Metadata Retrieval & Preparation**  
  Queries the YouTube API for video metadata and normalizes this data for further use.

- **1.3 Thumbnail Text Generation (AI)**  
  Uses OpenAI to create compelling French text elements for thumbnails.

- **1.4 Thumbnail Generation via Templated.io**  
  Sends text data to templated.io API to generate thumbnails and downloads the rendered image.

- **1.5 Storage & Logging**  
  Uploads thumbnails to Google Drive and logs activity in Google Sheets.

- **1.6 Notifications**  
  Sends email and Telegram notifications with thumbnail information and links.

- **1.7 Social Media Post Generation & Publishing**  
  Generates social media posts with OpenAI (in English) and publishes content to LinkedIn, Facebook, and Twitter via Blotato.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception & Validation

**Overview:**  
This block handles incoming Telegram messages, extracts YouTube video IDs from various URL formats, and validates input.

**Nodes Involved:**  
- Telegram Trigger  
- Workflow Configuration  
- Extract Video ID

**Node Details:**  

- **Telegram Trigger**  
  - *Type:* Trigger node for Telegram API  
  - *Role:* Listens for new Telegram messages containing YouTube URLs  
  - *Configuration:* Monitors "message" updates; uses Telegram API credentials named "Telegram - templated"  
  - *Inputs:* None (trigger)  
  - *Outputs:* Emits raw Telegram message JSON  
  - *Failure Cases:* Telegram API auth errors, webhook failures, malformed messages

- **Workflow Configuration**  
  - *Type:* Set node (static configuration)  
  - *Role:* Centralized storage for API keys and parameters such as YouTube API key, template IDs, Google Drive folder ID, Google Sheets ID, email recipient  
  - *Configuration:* Hardcoded string values placeholders for all credentials and IDs  
  - *Inputs:* From Telegram Trigger  
  - *Outputs:* Configuration JSON for downstream nodes  
  - *Failure Cases:* Missing or invalid credentials/keys cause failure downstream

- **Extract Video ID**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Parses Telegram message text to extract YouTube video ID from multiple URL formats (e.g., youtube.com/watch?v=, youtu.be/, shorts)  
  - *Key Expression:* Regex patterns matching 11-character YouTube video IDs  
  - *Input:* JSON with Telegram message text  
  - *Output:* JSON with extracted `videoId`, full `videoUrl`, or error flag if no valid URL found  
  - *Failure Cases:* No video ID found, malformed message text

---

#### 1.2 YouTube Metadata Retrieval & Preparation

**Overview:**  
Fetches video metadata from YouTube Data API and prepares a normalized dataset for thumbnail generation and social media posting.

**Nodes Involved:**  
- Fetch YouTube Info  
- Prepare Text Data

**Node Details:**  

- **Fetch YouTube Info**  
  - *Type:* HTTP Request node  
  - *Role:* Calls YouTube Data API v3 `videos` endpoint with `snippet` part, using extracted video ID and YouTube API key  
  - *Configuration:* URL: `https://www.googleapis.com/youtube/v3/videos`, query params `part=snippet`, `id=videoId`, `key=apiKey`  
  - *Inputs:* From Extract Video ID  
  - *Outputs:* Raw YouTube API JSON response  
  - *Failure Cases:* API quota exceeded, invalid API key, video ID not found, network timeouts

- **Prepare Text Data**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Normalizes YouTube API response to extract key fields: title (trimmed to 60 chars), description, channel name, publish date, best available thumbnail URL  
  - *Key Logic:* Handles various response formats; ensures fallback empty values if data missing  
  - *Input:* YouTube API response JSON  
  - *Output:* Clean JSON with video metadata fields: `title`, `description`, `videoId`, `channelTitle`, `publishedAt`, `thumbnailUrl`  
  - *Failure Cases:* Malformed API response, missing snippet data

---

#### 1.3 Thumbnail Text Generation (AI)

**Overview:**  
Generates four concise French text elements optimized for YouTube thumbnails using OpenAI GPT-4o-mini.

**Nodes Involved:**  
- OpenAI Post Generation1

**Node Details:**  

- **OpenAI Post Generation1**  
  - *Type:* OpenAI Langchain node  
  - *Role:* Generates four thumbnail text components: main title, secondary title, bottom title, and label in French, based on video metadata  
  - *Configuration:* GPT-4o-mini model, system prompt instructs French copywriting style, message prompt with video title, description, and channel context; outputs JSON with text elements  
  - *Input:* From Prepare Text Data node JSON  
  - *Output:* JSON with keys: `main_title`, `center_title`, `bottom_title`, `label`  
  - *Failure Cases:* OpenAI API quota or auth failure, generation errors, malformed output JSON

---

#### 1.4 Thumbnail Generation via Templated.io

**Overview:**  
Uses templated.io API to generate a customized thumbnail image, then downloads the rendered file.

**Nodes Involved:**  
- Generate Thumbnail via Templated.io  
- Wait for Rendering  
- Download Thumbnail  
- Downloading files

**Node Details:**  

- **Generate Thumbnail via Templated.io**  
  - *Type:* Templated API node  
  - *Role:* Sends text layers (titles and label) to templated.io template identified by Template ID for thumbnail rendering  
  - *Configuration:* Uses template ID from workflow config, sets text layers with AI-generated phrase content  
  - *Input:* From OpenAI Post Generation1 node JSON  
  - *Output:* JSON with render ID for thumbnail  
  - *Failure Cases:* API key invalid, template ID wrong, network errors

- **Wait for Rendering**  
  - *Type:* Wait node  
  - *Role:* Pauses workflow for 2 minutes to allow templated.io rendering to complete  
  - *Input:* From Generate Thumbnail node  
  - *Output:* Passes render ID forward  
  - *Failure Cases:* Timing issues if rendering takes longer than wait time

- **Download Thumbnail**  
  - *Type:* Templated API node (retrieveRender operation)  
  - *Role:* Retrieves the generated thumbnail image file from templated.io using render ID  
  - *Input:* Render ID from Wait for Rendering node  
  - *Output:* Binary thumbnail data as file  
  - *Failure Cases:* Render not ready, network errors

- **Downloading files**  
  - *Type:* HTTP Request node  
  - *Role:* Downloads the thumbnail image file from URL provided by Download Thumbnail node, outputs binary data in field `thumbnail`  
  - *Input:* From Download Thumbnail JSON URL  
  - *Output:* Binary data of thumbnail image  
  - *Failure Cases:* Download failures, broken URL

---

#### 1.5 Storage & Logging

**Overview:**  
Stores the generated thumbnail in Google Drive and logs video and thumbnail info in a Google Sheet.

**Nodes Involved:**  
- Upload to Google Drive  
- Save to Google Sheets

**Node Details:**  

- **Upload to Google Drive**  
  - *Type:* Google Drive node  
  - *Role:* Uploads thumbnail image binary file to specified Google Drive folder with filename pattern including video ID and title  
  - *Configuration:* Uses Google Drive OAuth2 credentials, destination folder ID from workflow config  
  - *Input:* Binary thumbnail data from Downloading files node  
  - *Output:* JSON with file metadata including webViewLink  
  - *Failure Cases:* OAuth token errors, permission denied, quota exceeded

- **Save to Google Sheets**  
  - *Type:* Google Sheets node  
  - *Role:* Appends a new row to a Google Sheet with video ID, YouTube URL, title, Google Drive thumbnail link, and status "created"  
  - *Configuration:* Uses Google Sheets OAuth2 credentials, sheet name "YouTube", document ID from workflow config  
  - *Input:* From Upload to Google Drive node JSON  
  - *Output:* Confirmation JSON  
  - *Failure Cases:* Sheet not found, permission errors

---

#### 1.6 Notifications

**Overview:**  
Sends notifications via email and Telegram to confirm thumbnail generation and provide access links.

**Nodes Involved:**  
- Send Gmail  
- Send Telegram Notification

**Node Details:**  

- **Send Gmail**  
  - *Type:* Gmail node  
  - *Role:* Sends an email to configured recipient with video details, thumbnail attachment, and Google Drive link  
  - *Configuration:* Uses Gmail OAuth2 credentials, HTML formatted message with dynamic fields, subject includes video title  
  - *Input:* From Save to Google Sheets node (which is after Upload to Google Drive)  
  - *Output:* Confirmation JSON  
  - *Failure Cases:* SMTP or OAuth errors, invalid recipient address

- **Send Telegram Notification**  
  - *Type:* Telegram node  
  - *Role:* Sends the generated thumbnail as a photo with caption including video title and Google Drive link back to the Telegram chat that triggered the workflow  
  - *Configuration:* Uses Telegram credentials, sends to chat ID from initial trigger, caption uses video title and Google Drive link  
  - *Input:* Binary file from Downloading files node, chat ID from Telegram Trigger  
  - *Output:* Confirmation JSON  
  - *Failure Cases:* Telegram API failures, invalid chat ID

---

#### 1.7 Social Media Post Generation & Publishing

**Overview:**  
Creates AI-generated social media post captions and publishes them with media on LinkedIn, Facebook, and Twitter via Blotato integration.

**Nodes Involved:**  
- OpenAI Post Generation  
- Upload Video to BLOTATO  
- Linkedin  
- Facebook  
- Twitter (X)

**Node Details:**  

- **OpenAI Post Generation**  
  - *Type:* OpenAI Langchain node  
  - *Role:* Generates engaging, platform-optimized English captions for social media posts promoting the YouTube video  
  - *Configuration:* GPT-4o-mini, system prompt positions as social media expert, message prompt includes video title, description, video URL; output is text content with hashtags and call-to-action  
  - *Input:* From Send Telegram Notification node JSON  
  - *Output:* JSON with generated post content text  
  - *Failure Cases:* OpenAI API errors

- **Upload Video to BLOTATO**  
  - *Type:* Blotato node  
  - *Role:* Uploads thumbnail image URL as media resource to Blotato platform  
  - *Configuration:* Uses Blotato API credentials  
  - *Input:* Thumbnail URL from Downloading files node  
  - *Output:* Media URL used for posting  
  - *Failure Cases:* Blotato API auth errors, upload failures

- **Linkedin**  
  - *Type:* Blotato node  
  - *Role:* Publishes post to LinkedIn account with AI-generated caption and media URL  
  - *Configuration:* Account ID selected from Blotato cached accounts, uses generated post content and media URL  
  - *Input:* From Upload Video to BLOTATO node  
  - *Output:* Confirmation JSON  
  - *Failure Cases:* Posting errors, account auth failures

- **Facebook**  
  - *Type:* Blotato node  
  - *Role:* Publishes post to Facebook page with AI-generated caption and media URL  
  - *Configuration:* Facebook page ID from Blotato cached accounts, uses generated post content and media URL  
  - *Input:* From Upload Video to BLOTATO node  
  - *Output:* Confirmation JSON  
  - *Failure Cases:* API errors, page permissions

- **Twitter (X)**  
  - *Type:* Blotato node  
  - *Role:* Publishes post to Twitter account with AI-generated caption and media URL  
  - *Configuration:* Twitter account ID from Blotato cached accounts, uses generated post content and media URL  
  - *Input:* From Upload Video to BLOTATO node  
  - *Output:* Confirmation JSON  
  - *Failure Cases:* API rate limits, auth errors

---

### 3. Summary Table

| Node Name                  | Node Type                   | Functional Role                                          | Input Node(s)                | Output Node(s)                                     | Sticky Note                                                                                                                |
|----------------------------|-----------------------------|----------------------------------------------------------|------------------------------|---------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger            | telegramTrigger             | Receives YouTube URLs via Telegram                        | None                         | Workflow Configuration                            | STEP 1: Telegram Trigger: Receives YouTube URLs from users; Workflow Configuration holds API keys and settings             |
| Workflow Configuration      | set                         | Central API keys and settings storage                    | Telegram Trigger             | Extract Video ID                                  | STEP 1: Telegram Trigger: Receives YouTube URLs from users; Workflow Configuration holds API keys and settings             |
| Extract Video ID            | code                        | Extracts YouTube video ID from Telegram message          | Workflow Configuration       | Fetch YouTube Info                               | STEP 1: Telegram Trigger: Receives YouTube URLs from users                                                                   |
| Fetch YouTube Info          | httpRequest                 | Fetches video metadata from YouTube API                  | Extract Video ID             | Prepare Text Data                                |                                                                                                                            |
| Prepare Text Data           | code                        | Normalizes YouTube response, extracts metadata           | Fetch YouTube Info           | OpenAI Post Generation1                          |                                                                                                                            |
| OpenAI Post Generation1     | openAi                      | Generates French thumbnail text elements                  | Prepare Text Data            | Generate Thumbnail via Templated.io              | STEP 3: Thumbnail Generation via templated.io API                                                                            |
| Generate Thumbnail via Templated.io | templated           | Sends thumbnail text to templated.io API for rendering   | OpenAI Post Generation1      | Wait for Rendering                               | STEP 3: Thumbnail Generation via templated.io API                                                                            |
| Wait for Rendering          | wait                        | Pauses workflow to wait for thumbnail rendering          | Generate Thumbnail via Templated.io | Download Thumbnail                           | STEP 3: Thumbnail Generation via templated.io API                                                                            |
| Download Thumbnail          | templated                   | Retrieves rendered thumbnail image                        | Wait for Rendering           | Downloading files                                | STEP 3: Thumbnail Generation via templated.io API                                                                            |
| Downloading files          | httpRequest                 | Downloads thumbnail image as binary data                  | Download Thumbnail           | Upload to Google Drive                           | STEP 5: Notifications: Uploads to Drive and sends notifications                                                             |
| Upload to Google Drive      | googleDrive                 | Uploads thumbnail image to Google Drive                   | Downloading files            | Save to Google Sheets                            | STEP 5: Notifications: Uploads to Drive and sends notifications                                                             |
| Save to Google Sheets       | googleSheets                | Logs video and thumbnail info in Google Sheets            | Upload to Google Drive       | Send Gmail                                      | STEP 5: Notifications: Sends email and Telegram notifications                                                               |
| Send Gmail                  | gmail                       | Sends email notification with thumbnail info              | Save to Google Sheets        | Send Telegram Notification                       | STEP 5: Notifications: Sends email and Telegram notifications                                                               |
| Send Telegram Notification  | telegram                    | Sends thumbnail photo and message to Telegram chat        | Send Gmail                  | OpenAI Post Generation                           | STEP 5: Notifications: Sends email and Telegram notifications                                                               |
| OpenAI Post Generation      | openAi                      | Generates English social media post captions              | Send Telegram Notification   | Upload Video to BLOTATO                          | STEP 4: Publishing via Blotato                                                                                              |
| Upload Video to BLOTATO     | blotato                     | Uploads thumbnail media to Blotato platform                | OpenAI Post Generation       | Linkedin, Facebook, Twitter (X)                  | STEP 4: Publishing via Blotato                                                                                              |
| Linkedin                   | blotato                     | Publishes post to LinkedIn                                 | Upload Video to BLOTATO      | None                                            | STEP 4: Publishing via Blotato                                                                                              |
| Facebook                   | blotato                     | Publishes post to Facebook                                 | Upload Video to BLOTATO      | None                                            | STEP 4: Publishing via Blotato                                                                                              |
| Twitter (X)                | blotato                     | Publishes post to Twitter                                  | Upload Video to BLOTATO      | None                                            | STEP 4: Publishing via Blotato                                                                                              |
| 📋 WORKFLOW OVERVIEW       | stickyNote                  | Overview description and tutorial link                     | None                         | None                                            | Overview of entire automation with tutorial link                                                                            |
| 🔧 STEP 1: Configuration   | stickyNote                  | Explains Telegram trigger and configuration parameters     | None                         | None                                            | Describes first step configuration and required keys                                                                        |
| 🎨 STEP 3: Thumbnail Generation | stickyNote              | Explains thumbnail generation and wait steps               | None                         | None                                            | Explains templated.io thumbnail generation process                                                                           |
| 📢 STEP 5: Notifications   | stickyNote                  | Explains email and Telegram notifications                   | None                         | None                                            | Explains notification steps after thumbnail generation                                                                       |
| ⚙️ INSTALLATION GUIDE       | stickyNote                  | Installation checklist and setup instructions               | None                         | None                                            | Detailed installation checklist with links for setup and support                                                            |
| Step 5 - Publishing        | stickyNote                  | Instructions on installing and configuring Blotato node    | None                         | None                                            | Instructions for installing Blotato community node and API credentials                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Listen for "message" updates  
   - Use Telegram API credentials linked to your bot  
   - Position: starting point for the workflow

2. **Add Set Node for Workflow Configuration**  
   - Type: Set  
   - Add string fields for: `youtubeApiKey`, `templatedTemplateId`, `googleDriveFolderId`, `googleSheetsId`, `emailRecipient`  
   - Fill with your API keys and IDs  
   - Connect output of Telegram Trigger to this node

3. **Add Code Node "Extract Video ID"**  
   - Paste JavaScript code to extract YouTube video ID from Telegram message text using regex for multiple URL patterns  
   - Output JSON with `videoId`, `videoUrl`, or error  
   - Connect from Workflow Configuration node

4. **Add HTTP Request Node "Fetch YouTube Info"**  
   - Request type: GET  
   - URL: `https://www.googleapis.com/youtube/v3/videos`  
   - Query parameters: `part=snippet`, `id={{$json.videoId}}`, `key={{$('Workflow Configuration').first().json.youtubeApiKey}}`  
   - Connect from Extract Video ID node

5. **Add Code Node "Prepare Text Data"**  
   - Paste JavaScript code to normalize YouTube API response and extract title, description, channel title, publishedAt, thumbnail URL  
   - Trim title to 60 characters max  
   - Connect from Fetch YouTube Info node

6. **Add OpenAI Node "OpenAI Post Generation1"**  
   - Model: GPT-4o-mini  
   - System prompt: French expert copywriter creating thumbnail texts  
   - Message prompt: JSON with video title, description, channel title, instruct to generate four text elements in French  
   - JSON output enabled  
   - Connect from Prepare Text Data node

7. **Add Templated.io Node "Generate Thumbnail via Templated.io"**  
   - Operation: Render template with layers for `main_title`, `center_title`, `label`, `bottom_title` from OpenAI output  
   - Template ID: Use your templated.io thumbnail template ID  
   - Connect from OpenAI Post Generation1 node

8. **Add Wait Node "Wait for Rendering"**  
   - Duration: 2 minutes (adjust if necessary)  
   - Connect from Generate Thumbnail node

9. **Add Templated.io Node "Download Thumbnail"**  
   - Operation: retrieveRender with render ID from previous node  
   - Connect from Wait node

10. **Add HTTP Request Node "Downloading files"**  
    - URL: thumbnail URL from Download Thumbnail node  
    - Response type: file, output binary data in `thumbnail` field  
    - Connect from Download Thumbnail node

11. **Add Google Drive Node "Upload to Google Drive"**  
    - Upload binary data `thumbnail`  
    - Filename pattern: `{{ $json.videoId }}_thumbnail_{{ $json.title }}.png`  
    - Destination folder ID from Workflow Configuration  
    - Use Google Drive OAuth2 credentials  
    - Connect from Downloading files node

12. **Add Google Sheets Node "Save to Google Sheets"**  
    - Operation: Append row  
    - Document ID: from Workflow Configuration  
    - Sheet name: "YouTube"  
    - Columns: `STATUS` = "created", `ID VIDEO`, `YOUTUBE URL`, `YOUTUBE TITLE`, `GOOGLE DRIVE URL` (from previous nodes)  
    - Use Google Sheets OAuth2 credentials  
    - Connect from Upload to Google Drive node

13. **Add Gmail Node "Send Gmail"**  
    - Send to email recipient from Workflow Configuration  
    - Subject: includes video title  
    - HTML body with video details and Google Drive link  
    - Use Gmail OAuth2 credentials  
    - Connect from Save to Google Sheets node

14. **Add Telegram Node "Send Telegram Notification"**  
    - Send photo operation with `thumbnail` binary  
    - Chat ID: from Telegram Trigger message chat ID  
    - Caption: success message with video title and Google Drive link  
    - Use Telegram API credentials  
    - Connect from Send Gmail node

15. **Add OpenAI Node "OpenAI Post Generation"**  
    - Model: GPT-4o-mini  
    - System prompt: social media expert creating viral English posts for YouTube  
    - Message prompt: includes video title, description, video URL, requirements for hook, points, CTA, hashtags  
    - Connect from Send Telegram Notification node

16. **Add Blotato Node "Upload Video to BLOTATO"**  
    - Upload thumbnail media URL  
    - Use Blotato API credentials  
    - Connect from OpenAI Post Generation node

17. **Add Blotato Nodes for LinkedIn, Facebook, Twitter (X)**  
    - Each configured with respective platform, account IDs from Blotato cached accounts  
    - Use post content text from OpenAI Post Generation output  
    - Use media URL from Upload Video to BLOTATO node  
    - Connect all from Upload Video to BLOTATO node outputs

---

### 5. General Notes & Resources

| Note Content                                                                                                                               | Context or Link                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| Tutorial video linked in sticky note for workflow overview: YouTube video ID: CenAtzPceQU                                                  | https://www.youtube.com/watch?v=CenAtzPceQU                        |
| Templated.io recommended for thumbnail generation; adjust wait times based on template complexity                                           | https://templated.io/?utm_campaign=drfiras                         |
| Blotato community node installation instructions included for social media publishing                                                     | https://blotato.com/?ref=firas                                      |
| Installation checklist includes setup for YouTube Data API, Telegram Bot (@BotFather), Google Drive & Sheets, Blotato API, and credentials | See sticky note "⚙️ INSTALLATION GUIDE"                            |
| For support and consulting, contact Dr. Firas on LinkedIn, YouTube, or n8n workshops                                                       | LinkedIn: https://www.linkedin.com/in/dr-firas/                    |
|                                                                                                                                             | YouTube: https://www.youtube.com/@DRFIRASS                         |
|                                                                                                                                             | n8n workshops: https://hotm.art/formation-n8n                      |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.