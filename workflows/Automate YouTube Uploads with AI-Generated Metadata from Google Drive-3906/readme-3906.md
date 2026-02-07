Automate YouTube Uploads with AI-Generated Metadata from Google Drive

https://n8nworkflows.xyz/workflows/automate-youtube-uploads-with-ai-generated-metadata-from-google-drive-3906


# Automate YouTube Uploads with AI-Generated Metadata from Google Drive

---

## 1. Workflow Overview

This workflow automates the process of uploading new videos from a dedicated Google Drive folder to YouTube, while simultaneously generating optimized metadata using AI based on the video’s transcript. It targets content creators, marketing teams, and channel managers seeking a fully automated, hands-off approach to video publishing with SEO-friendly titles, descriptions, and tags.

The workflow is logically structured into the following functional blocks:

- **1.1 Google Drive Monitoring and Video Retrieval**  
  Detects new video files uploaded to a specified Google Drive folder and downloads them for processing.

- **1.2 YouTube Video Upload**  
  Uploads the downloaded video to YouTube with initial default settings (private visibility).

- **1.3 Transcript Retrieval and Formatting**  
  Uses an external API to extract the video transcript, then formats it into a plain text string suitable for AI prompts.

- **1.4 AI-Driven Metadata Generation**  
  Generates a detailed video description, SEO-optimized YouTube tags, and a compelling title using AI language models based on the transcript.

- **1.5 Metadata Application and Cleanup**  
  Updates the uploaded YouTube video’s metadata with the AI-generated content and optionally deletes the original video from Google Drive for housekeeping.

---

## 2. Block-by-Block Analysis

### 2.1 Google Drive Monitoring and Video Retrieval

**Overview:**  
This block continuously monitors a specific Google Drive folder for new video files, then downloads the detected video for further processing.

**Nodes Involved:**  
- New Video? (Google Drive Trigger)  
- Download New Video (Google Drive)

**Node Details:**

- **New Video?**  
  - *Type:* Google Drive Trigger  
  - *Role:* Watches a specific Google Drive folder for newly created files, polling every minute.  
  - *Configuration:* Folder ID is referenced via variable (not hard-coded). Trigger event is `fileCreated`.  
  - *Inputs:* None (trigger node).  
  - *Outputs:* Emits metadata about the newly created file, including file ID.  
  - *Potential Failures:* Google Drive API auth errors, folder access permission issues, polling delays.  
  - *Version:* v1  

- **Download New Video**  
  - *Type:* Google Drive Node (Download operation)  
  - *Role:* Downloads the video file identified by the file ID emitted from the trigger node.  
  - *Configuration:* File ID set dynamically from trigger output (`{{$json.id}}`). Uses OAuth2 credentials for authentication.  
  - *Inputs:* Receives file metadata from "New Video?" node.  
  - *Outputs:* Provides the binary video data for upload.  
  - *Potential Failures:* Download timeouts, permission denials, file not found errors.  
  - *Version:* v3  

---

### 2.2 YouTube Video Upload

**Overview:**  
Uploads the downloaded video to YouTube initially with basic properties such as private visibility and default category/region.

**Nodes Involved:**  
- Upload Video to Youtube

**Node Details:**

- **Upload Video to Youtube**  
  - *Type:* YouTube Node (Upload operation)  
  - *Role:* Uploads binary video data to YouTube.  
  - *Configuration:*  
    - Title initially set as placeholder `"adadada"` (later updated).  
    - Privacy status set to `private`.  
    - Category ID set to `25` (News & Politics).  
    - Region code set to `DE` (Germany).  
    - OAuth2 credentials configured for YouTube API.  
  - *Inputs:* Receives binary video from "Download New Video".  
  - *Outputs:* Outputs video upload metadata, including `uploadId` for subsequent metadata updates.  
  - *Potential Failures:* YouTube API quota limits, auth token expiration, upload timeouts, video format unsupported errors.  
  - *Version:* v1  

---

### 2.3 Transcript Retrieval and Formatting

**Overview:**  
Retrieves the video transcript using an external API and formats it into a clean text string suitable for AI prompt consumption.

**Nodes Involved:**  
- ApifyToken (Set node)  
- Get Transcript (HTTP Request)  
- Adjust Transcript Format (Code node)

**Node Details:**

- **ApifyToken**  
  - *Type:* Set Node  
  - *Role:* Assigns the API token required by the transcript scraper API.  
  - *Configuration:* Token value stored in node parameter (`YOURTOKENHERE` placeholder).  
  - *Inputs:* Receives video metadata (including video ID) from the upload node chain.  
  - *Outputs:* Passes token along with video ID for API call.  
  - *Potential Failures:* Missing or invalid token leads to API call failure.  
  - *Version:* v3.4  

- **Get Transcript**  
  - *Type:* HTTP Request Node  
  - *Role:* Calls the Apify YouTube transcript scraper API synchronously to retrieve transcript data.  
  - *Configuration:*  
    - POST method with JSON body containing YouTube video URL derived from video ID.  
    - Query parameter `token` set dynamically from "ApifyToken".  
  - *Inputs:* Video ID and token from "ApifyToken".  
  - *Outputs:* JSON data containing transcript segments.  
  - *Potential Failures:* API call failures, token invalidation, rate limits, no transcript available.  
  - *Version:* v4.2  

- **Adjust Transcript Format**  
  - *Type:* Code Node (JavaScript)  
  - *Role:* Processes raw transcript JSON segments into a concatenated plain text transcript string.  
  - *Configuration:* Custom JS code to extract `.text` from each segment, ignoring missing or malformed data.  
  - *Inputs:* JSON transcript data from "Get Transcript".  
  - *Outputs:* Single JSON object containing full transcript as a string under `transcript` key.  
  - *Potential Failures:* Malformed input data, empty transcript arrays.  
  - *Version:* v2  

---

### 2.4 AI-Driven Metadata Generation

**Overview:**  
Generates YouTube video metadata (description, tags, title) using AI language models based on the extracted transcript.

**Nodes Involved:**  
- Create Description (OpenAI Node)  
- YT Tags (Langchain Agent Node)  
- YT Title (OpenAI Node)  
- 2.5FlashPrev (Google Gemini LM node, auxiliary AI model)

**Node Details:**

- **Create Description**  
  - *Type:* OpenAI (Langchain) Node  
  - *Role:* Creates a detailed, confident, SEO-optimized video description from the transcript.  
  - *Configuration:*  
    - Model: `gpt-4.1-nano`.  
    - System prompt defines professional copywriter role focused on economics podcast content.  
    - Transcript passed as user message with template constraints on tone, style, and emoji use.  
  - *Inputs:* Transcript text from "Adjust Transcript Format".  
  - *Outputs:* AI-generated description text.  
  - *Potential Failures:* API quota limits, prompt formatting errors, incomplete transcript input.  
  - *Version:* v1.7  

- **YT Tags**  
  - *Type:* Langchain Agent Node  
  - *Role:* Generates relevant YouTube tags based on the transcript content.  
  - *Configuration:*  
    - Prompt includes system message describing video topic (future gold price and asset returns).  
    - Transcript passed dynamically from "Adjust Transcript Format".  
  - *Inputs:* Transcript from "Adjust Transcript Format", triggered by output from "Create Description".  
  - *Outputs:* List of tags as a string.  
  - *Potential Failures:* Ambiguous or inconsistent transcript data may reduce tag relevance.  
  - *Version:* v1.9  

- **YT Title**  
  - *Type:* OpenAI (Langchain) Node  
  - *Role:* Creates an SEO-optimized, concise YouTube video title from the transcript.  
  - *Configuration:*  
    - Model: `gpt-4.1-nano`.  
    - Prompt instructs for a short title max 100 characters.  
  - *Inputs:* Tags output from "YT Tags" node (chained).  
  - *Outputs:* Single title string.  
  - *Potential Failures:* Title length constraints, model hallucination.  
  - *Version:* v1.7  

- **2.5FlashPrev**  
  - *Type:* Langchain Google Gemini LM Node  
  - *Role:* Auxiliary AI language model connected to "YT Tags" for additional AI processing (unclear if used actively in this workflow).  
  - *Potential Failures:* API access issues.  
  - *Version:* v1  

---

### 2.5 Metadata Application and Cleanup

**Overview:**  
Updates the YouTube video metadata with the AI-generated title, description, and tags. Then optionally deletes the original video file from Google Drive.

**Nodes Involved:**  
- Update Video’s Metadata (YouTube Node)  
- Delete File from Upload Folder (Optional) (Google Drive Node)

**Node Details:**

- **Update Video’s Metadata**  
  - *Type:* YouTube Node (Update operation)  
  - *Role:* Applies the generated metadata (title, description, tags) to the uploaded YouTube video.  
  - *Configuration:*  
    - Video ID dynamically linked to upload response.  
    - Title from "YT Title".  
    - Description from "Create Description" (with appended note about AI generation in German).  
    - Tags from "YT Tags".  
    - Category ID and region code retained as before.  
    - On error, node continues workflow execution (prevents halting on partial failures).  
  - *Inputs:* Metadata from AI nodes and video ID from upload node.  
  - *Outputs:* Metadata update response.  
  - *Potential Failures:* YouTube API update limits, invalid metadata format, auth errors.  
  - *Version:* v1  

- **Delete File from Upload Folder (Optional)**  
  - *Type:* Google Drive Node (Delete operation)  
  - *Role:* Deletes the video file from Google Drive after successful upload and metadata update to free space and avoid duplication.  
  - *Configuration:* File ID from original downloaded file.  
  - *Inputs:* Video metadata from "Download New Video".  
  - *Outputs:* File deletion confirmation.  
  - *Potential Failures:* File already deleted, permission errors, accidental deletions if misconfigured.  
  - *Version:* v3  

---

## 3. Summary Table

| Node Name                          | Node Type                          | Functional Role                           | Input Node(s)                     | Output Node(s)                      | Sticky Note                                                                                           |
|-----------------------------------|----------------------------------|-----------------------------------------|----------------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------|
| New Video?                        | Google Drive Trigger             | Monitor Google Drive Folder for New Videos | None                            | Download New Video                 | # Upload New Video to Youtube 🎥⬆️                                                                 |
| Download New Video                | Google Drive Node (Download)     | Download new video file                   | New Video?                      | Upload Video to Youtube            | # Upload New Video to Youtube 🎥⬆️                                                                 |
| Upload Video to Youtube           | YouTube Node (Upload)            | Upload video to YouTube                   | Download New Video              | ApifyToken                       | # Upload New Video to Youtube 🎥⬆️                                                                 |
| ApifyToken                      | Set Node                        | Set API token for transcript retrieval    | Upload Video to Youtube         | Get Transcript                   |                                                                                                     |
| Get Transcript                   | HTTP Request Node                | Retrieve video transcript from API        | ApifyToken                     | Adjust Transcript Format           | # Get Transcript for Context and Generate Metadata from It 📝🔍                                     |
| Adjust Transcript Format          | Code Node                       | Format raw transcript into plain text     | Get Transcript                 | Create Description                | # Get Transcript for Context and Generate Metadata from It 📝🔍                                     |
| Create Description               | OpenAI Node (Langchain)          | Generate detailed YouTube description     | Adjust Transcript Format       | YT Tags                         | # Get Transcript for Context and Generate Metadata from It 📝🔍                                     |
| YT Tags                         | Langchain Agent Node             | Generate relevant YouTube tags            | Create Description             | YT Title                       | # Get Transcript for Context and Generate Metadata from It 📝🔍                                     |
| 2.5FlashPrev                    | Google Gemini LM Node            | Auxiliary AI model connected to YT Tags  | YT Tags                       | YT Tags                         | # Get Transcript for Context and Generate Metadata from It 📝🔍                                     |
| YT Title                       | OpenAI Node (Langchain)          | Generate SEO-optimized YouTube title     | YT Tags                       | Update Video's Metadata           | # Get Transcript for Context and Generate Metadata from It 📝🔍                                     |
| Update Video's Metadata          | YouTube Node (Update)            | Apply AI-generated metadata to video      | YT Title                      | Delete File from Upload Folder (Optional) |                                                                                                     |
| Delete File from Upload Folder (Optional) | Google Drive Node (Delete)    | Delete original video file from Google Drive | Update Video's Metadata        | None                            |                                                                                                     |
| Sticky Note                     | Sticky Note                     | Visual note                              | None                          | None                            | # Upload New Video to Youtube 🎥⬆️                                                                 |
| Sticky Note1                    | Sticky Note                     | Visual note                              | None                          | None                            | # Get Transcript for Context and Generate Metadata from It 📝🔍                                     |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a Google Drive Trigger Node ("New Video?")**  
   - Type: Google Drive Trigger  
   - Event: `fileCreated`  
   - Poll Interval: Every minute  
   - Folder to Watch: Set to your target Google Drive folder ID via n8n variable, not hard-coded  
   - Credentials: Select your Google Drive OAuth2 credentials  

2. **Add Google Drive Node ("Download New Video")**  
   - Type: Google Drive Node  
   - Operation: Download  
   - File ID: Set to `{{$json.id}}` from "New Video?" node output  
   - Credentials: Same as above  

3. **Add YouTube Upload Node ("Upload Video to Youtube")**  
   - Type: YouTube Node  
   - Operation: Upload  
   - Title: Placeholder (e.g., `"adadada"`, will update later)  
   - Privacy Status: `private`  
   - Category ID: `25` (News & Politics)  
   - Region Code: `DE`  
   - Credentials: YouTube OAuth2 credentials with upload permissions  
   - Connect input to "Download New Video" output (binary video data)  

4. **Add Set Node ("ApifyToken")**  
   - Type: Set  
   - Set a string variable `token` with your Apify API token for the transcript scraper  
   - Connect input from "Upload Video to Youtube" output  

5. **Add HTTP Request Node ("Get Transcript")**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.apify.com/v2/acts/pintostudio~youtube-transcript-scraper/run-sync-get-dataset-items`  
   - Query Parameter: `token` set dynamically from "ApifyToken" (`{{$json.token}}`)  
   - Request Body (JSON):  
     ```json
     {
       "videoUrl": "https://www.youtube.com/watch?v={{$json.id}}"
     }
     ```  
   - Send body as JSON, include query parameters  
   - Connect input from "ApifyToken" output  

6. **Add Code Node ("Adjust Transcript Format")**  
   - Type: Code (JavaScript)  
   - Paste the provided JS code that concatenates transcript text segments into one string  
   - Connect input from "Get Transcript" output  

7. **Add OpenAI Node ("Create Description")**  
   - Type: OpenAI (Langchain) Node  
   - Model: `gpt-4.1-nano`  
   - System Prompt: Professional copywriter instructions focused on economics, confident tone, emoji usage, hashtags  
   - User Message: Template that injects `{{ $json.transcript }}` from previous node  
   - Credentials: Your OpenAI API credentials  
   - Connect input from "Adjust Transcript Format" output  

8. **Add Langchain Agent Node ("YT Tags")**  
   - Type: Langchain Agent  
   - Prompt: "Now follows the actual topic/transcript. Give me the YouTube tags for it:\n\n{{ $('Adjust Transcript Format').item.json.transcript }}"  
   - System Message: Detailed description of video topic (gold price, asset returns, etc.)  
   - Connect input from "Create Description" output  

9. **Add Google Gemini LM Node ("2.5FlashPrev")**  
   - Type: Langchain Google Gemini LM  
   - Model: `models/gemini-2.5-flash-preview-04-17`  
   - Credentials: Google Palm API credentials  
   - Connect AI language model interface to "YT Tags" node  

10. **Add OpenAI Node ("YT Title")**  
    - Type: OpenAI (Langchain) Node  
    - Model: `gpt-4.1-nano`  
    - Prompt: Generate SEO-optimized title max 100 characters from transcript  
    - Credentials: OpenAI API credentials  
    - Connect input from "YT Tags" output  

11. **Add YouTube Node ("Update Video's Metadata")**  
    - Type: YouTube Node  
    - Operation: Update  
    - Video ID: From "Upload Video to Youtube" output `uploadId`  
    - Title: From "YT Title" output `title`  
    - Description: From "Create Description" output, append German note about AI generation  
    - Tags: From "YT Tags" output  
    - Category ID: `25`  
    - Region Code: `DE`  
    - Credentials: YouTube OAuth2 credentials  
    - Set error mode to continue on error  
    - Connect input from "YT Title" output  

12. **Add Google Drive Node ("Delete File from Upload Folder (Optional)")**  
    - Type: Google Drive Node  
    - Operation: Delete File  
    - File ID: From "Download New Video" output `id`  
    - Credentials: Same Google Drive OAuth2 credentials  
    - Connect input from "Update Video's Metadata" output  

13. **Add Sticky Notes** (for documentation clarity)  
    - Place one near the Google Drive and YouTube upload nodes titled: "# Upload New Video to Youtube 🎥⬆️"  
    - Place one near the transcript and AI metadata nodes titled: "# Get Transcript for Context and Generate Metadata from It 📝🔍"  

---

## 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                         |
|----------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| Video quality is preserved through the upload process.                                                                           | Important operational note                              |
| Consider YouTube API quota limits when processing multiple uploads to avoid throttling.                                          | Operational guideline                                   |
| Transcript quality directly impacts the quality of generated metadata; ensure transcripts are accurate and complete.             | Quality assurance                                       |
| Videos are initially uploaded as private; adjust visibility manually or extend workflow for automatic visibility changes.         | Workflow behavior detail                                |
| Store all API credentials and folder IDs securely as n8n credentials or variables; avoid hard-coding any sensitive information.  | Security best practice                                  |
| Temporary video files are not stored permanently in the workflow to maintain privacy and storage efficiency.                      | Privacy and storage management                           |
| Google Drive folder access should be limited to trusted users to prevent unauthorized uploads or deletions.                      | Security best practice                                  |
| YouTube upload permissions should be managed carefully, preferably using OAuth2 or service accounts with limited scopes.         | Security best practice                                  |
| The workflow can be customized by modifying AI prompt templates, adding conditional logic, or integrating notifications and social media sharing nodes. | Customization ideas                                    |
| Workflow tested with GPT-4.1-nano and Google Gemini 2.5 flash preview models for text generation tasks.                           | AI model versioning                                     |

---

This documentation should fully enable advanced users and AI agents to understand, reproduce, customize, and troubleshoot the workflow without referring back to the original JSON configuration.