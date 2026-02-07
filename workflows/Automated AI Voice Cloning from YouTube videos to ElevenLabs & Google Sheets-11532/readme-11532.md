Automated AI Voice Cloning from YouTube videos to ElevenLabs & Google Sheets

https://n8nworkflows.xyz/workflows/automated-ai-voice-cloning-from-youtube-videos-to-elevenlabs---google-sheets-11532


# Automated AI Voice Cloning from YouTube videos to ElevenLabs & Google Sheets

### 1. Workflow Overview

This workflow automates the process of cloning voices using ElevenLabs AI by extracting audio from YouTube videos listed in a Google Sheet. It is designed for users who want to streamline voice cloning from publicly available YouTube content, automating video audio extraction, voice creation, and updating tracking data in Google Sheets.

The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Manual trigger to start the workflow and retrieval of YouTube video data from Google Sheets.
- **1.2 Iteration Over Videos:** Batch processing each video entry to handle large datasets efficiently.
- **1.3 Video ID Extraction:** Parsing YouTube URLs to extract the video ID required for audio extraction.
- **1.4 Audio Extraction and Download:** Using RapidAPI to convert videos to audio and downloading the audio file.
- **1.5 Voice Creation in ElevenLabs:** Uploading the downloaded audio to ElevenLabs to create a cloned voice.
- **1.6 Updating Google Sheets:** Writing back the generated ElevenLabs voice IDs to the corresponding rows in the Google Sheet.
- **1.7 Documentation and Setup Guidance:** Sticky notes providing detailed instructions and links to required resources and setup steps.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block initiates the workflow manually and fetches the list of YouTube videos and voice names from Google Sheets.
- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Get videos (Google Sheets)

- **Node Details:**

  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Starts the workflow execution manually.  
    - Configuration: No parameters, triggers workflow on user command.  
    - Inputs: None  
    - Outputs: Trigger flow to "Get videos" node.  
    - Edge Cases: None significant, but workflow relies on manual start.

  - **Get videos**  
    - Type: Google Sheets  
    - Role: Reads rows from the Google Sheet containing YouTube video URLs and voice names.  
    - Configuration: Reads from sheet ID `1pZt5RZy6JkcnnxoSG1MFuIrNTLa0P4pVCptuk8uFJdI`, sheet tab with `gid=0`. No filters applied except a UI filter on "ELEVENLABS VOICE ID" column (likely to fetch rows missing that ID).  
    - Inputs: Trigger from manual node.  
    - Outputs: Sends rows to "Loop Over Items" for batch processing.  
    - Credentials: Google Sheets OAuth2 API  
    - Edge Cases: Authentication failures, empty rows, or missing columns may cause errors.

---

#### 2.2 Iteration Over Videos

- **Overview:** Processes each video entry individually in batches to avoid overloading APIs or causing timeouts.
- **Nodes Involved:**  
  - Loop Over Items (SplitInBatches)

- **Node Details:**

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Splits the list of videos into manageable batches, processing them sequentially.  
    - Configuration: Default options, no batch size specified (defaults to 1 item per batch).  
    - Inputs: Receives list from "Get videos".  
    - Outputs: First output triggers "Get Video ID" node; second output loops back to itself after updating Google Sheets.  
    - Edge Cases: Incorrect batch size or empty input list could stall processing.

---

#### 2.3 Video ID Extraction

- **Overview:** Extracts the YouTube video ID from the full URL string in each row.
- **Nodes Involved:**  
  - Get Video ID (Code node)

- **Node Details:**

  - **Get Video ID**  
    - Type: Code (JavaScript)  
    - Role: Parses YouTube video URLs via regex to isolate the unique video ID needed for API calls.  
    - Configuration: Custom JS code matches multiple YouTube URL formats; returns `video_id` or null if no match.  
    - Key Expression: Regex matching YouTube URL patterns.  
    - Inputs: Single video URL from batch item.  
    - Outputs: JSON object containing `video_id` for next steps.  
    - Edge Cases: Invalid or malformed URLs return null `video_id`, which may cause downstream failures if not handled.

---

#### 2.4 Audio Extraction and Download

- **Overview:** Converts YouTube videos to audio files using a third-party API, then downloads the audio.
- **Nodes Involved:**  
  - From video to audio (HTTP Request)  
  - Download audio (HTTP Request)

- **Node Details:**

  - **From video to audio**  
    - Type: HTTP Request  
    - Role: Sends POST request to RapidAPI YouTube-to-MP3 service with extracted `video_id`.  
    - Configuration:  
      - URL: `https://youtube-mp3-2025.p.rapidapi.com/v1/social/youtube/audio`  
      - Method: POST  
      - Headers: Includes `x-rapidapi-host` and `x-rapidapi-key` (user must provide their RapidAPI key).  
      - Body: JSON containing video ID.  
    - Inputs: Receives `video_id` from previous code node.  
    - Outputs: JSON response including download link (`linkDownload`).  
    - Edge Cases: API key invalid or quota exceeded; video not found; service timeout.

  - **Download audio**  
    - Type: HTTP Request  
    - Role: Downloads the audio file from the URL provided by the previous node.  
    - Configuration:  
      - URL: Dynamic, from `linkDownload` field in JSON.  
      - Response format: File  
    - Inputs: URL from "From video to audio".  
    - Outputs: Binary audio file data for upload to ElevenLabs.  
    - Edge Cases: Download failures, broken URLs, network issues.

---

#### 2.5 Voice Creation in ElevenLabs

- **Overview:** Uploads the downloaded audio file to ElevenLabs API to create a cloned voice.
- **Nodes Involved:**  
  - Create voice (HTTP Request)

- **Node Details:**

  - **Create voice**  
    - Type: HTTP Request  
    - Role: Sends POST request to ElevenLabs `/v1/voices/add` endpoint with audio data and voice name.  
    - Configuration:  
      - URL: `https://api.elevenlabs.io/v1/voices/add`  
      - Method: POST  
      - Content-Type: multipart/form-data  
      - Body parameters:  
        - `name`: Hardcoded as `"Teresa Mannino"` (can be replaced with dynamic voice name from sheet)  
        - `files`: Binary audio data from previous node  
      - Authentication: HTTP Header Auth with header name `xi-api-key` containing ElevenLabs API key.  
    - Inputs: Binary audio data.  
    - Outputs: JSON including new `voice_id`.  
    - Credentials: ElevenLabs API key in HTTP Header Auth.  
    - Edge Cases: Auth failures, invalid audio format, API downtime, exceeding rate limits.

---

#### 2.6 Updating Google Sheets

- **Overview:** Updates the Google Sheet row with the newly generated ElevenLabs voice ID.
- **Nodes Involved:**  
  - Update row in sheet (Google Sheets)

- **Node Details:**

  - **Update row in sheet**  
    - Type: Google Sheets  
    - Role: Updates the corresponding row’s "ELEVENLABS VOICE ID" column with the new voice ID.  
    - Configuration:  
      - Target document and sheet ID same as initial read node.  
      - Matching column: `row_number` to identify correct row.  
      - Updated columns: `ELEVENLABS VOICE ID` set to value from `voice_id` in JSON.  
    - Inputs: Receives updated voice ID and row number from "Create voice" and "Loop Over Items".  
    - Outputs: Sends to second output of "Loop Over Items" to continue processing next batch.  
    - Credentials: Google Sheets OAuth2 API  
    - Edge Cases: Write permission errors, concurrency issues, invalid row references.

---

#### 2.7 Documentation and Setup Guidance (Sticky Notes)

- **Overview:** Contains important instructions, links, and setup information for users to configure the workflow properly.
- **Nodes Involved:**  
  - Multiple Sticky Note nodes containing setup steps and workflow description.

- **Node Details:**

  - **Sticky Note (Step 1)**  
    - Content: Instructions to clone the Google Sheet template and fill required columns.  
    - Link: [Google Sheets template](https://docs.google.com/spreadsheets/d/1pZt5RZy6JkcnnxoSG1MFuIrNTLa0P4pVCptuk8uFJdI/edit?usp=sharing)

  - **Sticky Note1 (Step 2)**  
    - Content: Instructions to set RapidAPI key with a free trial and enter it in the HTTP Request node.  
    - Link: [RapidAPI YouTube MP3 API](https://rapidapi.com/nguyenmanhict-MuTUtGWD7K/api/youtube-mp3-2025)

  - **Sticky Note2 (Step 3)**  
    - Content: Instructions to obtain and configure ElevenLabs API key in HTTP Header Auth.  
    - Link: [ElevenLabs API Key](https://try.elevenlabs.io/ahkbf00hocnu)

  - **Sticky Note3 (Overview)**  
    - Content: Detailed explanation of the entire workflow, its purpose, stepwise functioning, and setup summary.  
    - Notes ElevenLabs plan requirements (Starter, Creator, Pro plans only).

---

### 3. Summary Table

| Node Name                 | Node Type           | Functional Role                         | Input Node(s)                   | Output Node(s)            | Sticky Note                                                                                      |
|---------------------------|---------------------|---------------------------------------|--------------------------------|---------------------------|------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger      | Start workflow execution               | None                           | Get videos                |                                                                                                |
| Get videos                | Google Sheets       | Retrieve YouTube video data            | When clicking ‘Execute workflow’ | Loop Over Items            |                                                                                                |
| Loop Over Items           | SplitInBatches      | Batch processing of each video row     | Get videos                    | Get Video ID, Update row in sheet (second output) |                                                                                                |
| Get Video ID              | Code                | Extract YouTube video ID from URL      | Loop Over Items               | From video to audio       |                                                                                                |
| From video to audio       | HTTP Request        | Convert YouTube video to audio via RapidAPI | Get Video ID                | Download audio            | Step 2: Set RapidAPI key with free trial: https://rapidapi.com/nguyenmanhict-MuTUtGWD7K/api/youtube-mp3-2025 |
| Download audio            | HTTP Request        | Download audio file                    | From video to audio            | Create voice              |                                                                                                |
| Create voice              | HTTP Request        | Upload audio to ElevenLabs to create voice | Download audio             | Update row in sheet        | Step 3: Setup ElevenLabs API key: https://try.elevenlabs.io/ahkbf00hocnu                           |
| Update row in sheet       | Google Sheets       | Write ElevenLabs voice ID back to sheet | Create voice                 | Loop Over Items (second output) |                                                                                                |
| Sticky Note               | Sticky Note         | Workflow setup step 1 instructions    | None                         | None                      | Step 1: Clone Sheet and fill YouTube Video and Voice Name columns: https://docs.google.com/spreadsheets/d/1pZt5RZy6JkcnnxoSG1MFuIrNTLa0P4pVCptuk8uFJdI/edit?usp=sharing |
| Sticky Note1              | Sticky Note         | Workflow setup step 2 instructions    | None                         | None                      | Step 2: Set RapidAPI key with free trial: https://rapidapi.com/nguyenmanhict-MuTUtGWD7K/api/youtube-mp3-2025  |
| Sticky Note2              | Sticky Note         | Workflow setup step 3 instructions    | None                         | None                      | Step 3: Setup ElevenLabs API key: https://try.elevenlabs.io/ahkbf00hocnu                           |
| Sticky Note3              | Sticky Note         | Workflow overview and detailed instructions | None                     | None                      | Comprehensive workflow explanation and setup guide                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**
   - Type: Manual Trigger  
   - Purpose: To start the workflow manually.

2. **Add Google Sheets Node (Get videos)**
   - Type: Google Sheets (Read)  
   - Configure credentials with a valid Google Sheets OAuth2 account.  
   - Set Document ID: `1pZt5RZy6JkcnnxoSG1MFuIrNTLa0P4pVCptuk8uFJdI`  
   - Set Sheet Name or GID: `gid=0`  
   - Read all rows, optionally filter rows missing “ELEVENLABS VOICE ID” (or all rows).  
   - Connect Manual Trigger node → Get videos node.

3. **Add SplitInBatches Node (Loop Over Items)**
   - Type: SplitInBatches  
   - Default batch size (1) is acceptable; adjust if needed.  
   - Connect Get videos → Loop Over Items.

4. **Add Code Node (Get Video ID)**
   - Type: Code (JavaScript)  
   - Paste following code to extract YouTube video ID from URL:
     ```javascript
     const url = $json['YOUTUBE VIDEO'];
     const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([^&?/]+)/;
     let match = url.match(regex);
     let video_id = match ? match[1] : null;
     return [{ json: { video_id } }];
     ```
   - Connect Loop Over Items → Get Video ID.

5. **Add HTTP Request Node (From video to audio)**
   - Type: HTTP Request (POST)  
   - URL: `https://youtube-mp3-2025.p.rapidapi.com/v1/social/youtube/audio`  
   - Headers:  
     - `x-rapidapi-host`: `youtube-mp3-2025.p.rapidapi.com`  
     - `x-rapidapi-key`: *Your RapidAPI Key* (replace `"XXX"` with actual key)  
   - Body Type: JSON / Form parameters  
   - Body Parameters: `{ "id": {{ $json.video_id }} }`  
   - Connect Get Video ID → From video to audio.

6. **Add HTTP Request Node (Download audio)**
   - Type: HTTP Request (GET)  
   - URL: `{{ $json.linkDownload }}` (dynamic from previous response)  
   - Response Format: File (binary)  
   - Connect From video to audio → Download audio.

7. **Add HTTP Request Node (Create voice)**
   - Type: HTTP Request (POST)  
   - URL: `https://api.elevenlabs.io/v1/voices/add`  
   - Authentication: HTTP Header Auth with header `xi-api-key` containing your ElevenLabs API key  
   - Body Type: Multipart Form Data  
   - Parameters:  
     - `name`: *Voice name* (currently hardcoded as "Teresa Mannino", replace with dynamic value if desired)  
     - `files`: Binary data from "Download audio" (field `data`)  
   - Connect Download audio → Create voice.

8. **Add Google Sheets Node (Update row in sheet)**
   - Type: Google Sheets (Update)  
   - Credentials: Same Google Sheets OAuth2 account  
   - Document ID and Sheet same as "Get videos" node  
   - Matching Column: `row_number` to ensure correct row update  
   - Columns to update: `ELEVENLABS VOICE ID` set to `{{ $json.voice_id }}` from Create voice node output  
   - Connect Create voice → Update row in sheet.

9. **Connect Update row in sheet to Loop Over Items (Second Output)**
   - This enables batch continuation until all rows processed.

10. **Add Sticky Note nodes (optional)**
    - Add notes with setup instructions and links to help users configure API keys and Google Sheets.

---

### 5. General Notes & Resources

| Note Content                                                                                                                               | Context or Link                                                                                              |
|--------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Clone this Google Sheet template and fill columns “YOUTUBE VIDEO” and “VOICE NAME” to start.                                               | https://docs.google.com/spreadsheets/d/1pZt5RZy6JkcnnxoSG1MFuIrNTLa0P4pVCptuk8uFJdI/edit?usp=sharing         |
| Obtain a free trial RapidAPI key for YouTube-to-MP3 conversion and add it to the HTTP Request node headers.                                | https://rapidapi.com/nguyenmanhict-MuTUtGWD7K/api/youtube-mp3-2025                                           |
| Create an ElevenLabs API key and configure it in HTTP Header Auth for voice creation requests.                                             | https://try.elevenlabs.io/ahkbf00hocnu                                                                       |
| This workflow requires ElevenLabs Starter, Creator, or Pro plans for voice cloning API access.                                             | ElevenLabs plan requirements                                                                                  |
| The voice name in the Create voice node is currently hardcoded and can be replaced with dynamic data from Google Sheets (“VOICE NAME”).    | Modify HTTP Request body parameters for dynamic voice naming                                                 |

---

This comprehensive documentation enables both users and automation systems to understand, reproduce, and maintain the workflow effectively.