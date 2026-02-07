Automated AI Music Generation with ElevenLabs, Google Sheets & Drive

https://n8nworkflows.xyz/workflows/automated-ai-music-generation-with-elevenlabs--google-sheets---drive-11047


# Automated AI Music Generation with ElevenLabs, Google Sheets & Drive

### 1. Workflow Overview

This workflow automates the generation, storage, and cataloging of AI-generated music tracks using the ElevenLabs Music API, integrated with Google Sheets and Google Drive. It targets creators, artists, and businesses who want to produce studio-quality music from natural language prompts without manual handling.

The workflow logically breaks down into these blocks:

- **1.1 Input Reception:** Reads music generation requests from a Google Sheet.
- **1.2 Batch Processing Loop:** Iterates over each music request one by one.
- **1.3 AI Music Generation:** Sends prompts and parameters to ElevenLabs Music API to generate music.
- **1.4 Storage & Cataloging:** Uploads generated MP3 files to Google Drive and updates the Google Sheet with the file URL.
- **1.5 Rate Limiting Delay:** Waits 1 minute between processing each request to comply with API rate limits.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** This block retrieves pending music generation requests from a Google Sheet, including columns like Title, Prompt, Duration, and URL.
- **Nodes Involved:**  
  - *Get tracks* (Google Sheets node)

- **Node Details:**

  - **Get tracks**  
    - *Type:* Google Sheets  
    - *Role:* Reads rows from the specified Google Sheet document and sheet tab.  
    - *Configuration:* Connects to a Google Sheet identified by document ID, reading from the first sheet tab (gid=0). Filters applied on the "URL" column to determine which tracks need processing (likely empty).  
    - *Expressions:* Uses sheet and document IDs hardcoded, but selectable from dropdown.  
    - *Input:* Triggered manually by the workflow start node.  
    - *Output:* Outputs an array of rows representing music generation requests.  
    - *Potential Failure:* Authentication errors with Google Sheets OAuth2, sheet not found, missing columns, network issues.

#### 1.2 Batch Processing Loop

- **Overview:** Splits the list of music requests into individual items to process sequentially, enabling controlled rate limiting.
- **Nodes Involved:**  
  - *Loop Over Items* (SplitInBatches node)

- **Node Details:**

  - **Loop Over Items**  
    - *Type:* SplitInBatches  
    - *Role:* Processes each music request row one at a time.  
    - *Configuration:* Default batch size 1 (not explicitly set, but inferred from connections).  
    - *Input:* Receives all music rows from *Get tracks*.  
    - *Output:* Sends single music request item downstream for generation.  
    - *Connections:* Two outputs: main output triggers the next block; secondary output for looping back after delay.  
    - *Edge Cases:* Empty input array, batch size misconfiguration, potential infinite loops if downstream fails.

#### 1.3 AI Music Generation

- **Overview:** Uses ElevenLabs Music API to generate music tracks based on the prompt and desired duration provided in each row.
- **Nodes Involved:**  
  - *Compose music* (HTTP Request node)

- **Node Details:**

  - **Compose music**  
    - *Type:* HTTP Request  
    - *Role:* Sends POST request to ElevenLabs API to generate music.  
    - *Configuration:*  
      - URL: `https://api.elevenlabs.io/v1/music`  
      - HTTP Method: POST  
      - Body (JSON):  
        ```json
        {
          "respect_sections_durations": true,
          "prompt": "{{ $json.PROMPT }}",
          "music_length_ms": {{ $json['DURATION (ms)'] }},
          "model_id": "music_v1"
        }
        ```  
      - Query parameter: `output_format=mp3_44100_128` (MP3 format, 44.1 kHz, 128 kbps)  
      - Authentication: HTTP Header Auth with header name `xi-api-key` and user’s ElevenLabs API key.  
    - *Input:* Receives one music request item with prompt and duration.  
    - *Output:* Returns binary MP3 music data.  
    - *Potential Failures:* API key invalid or missing, rate limits exceeded, malformed prompts, network timeouts, API errors.

#### 1.4 Storage & Cataloging

- **Overview:** Uploads the generated MP3 file to Google Drive, then updates the original Google Sheet with the shareable URL of the uploaded track.
- **Nodes Involved:**  
  - *Upload music* (Google Drive node)  
  - *Update Link tracks* (Google Sheets node)

- **Node Details:**

  - **Upload music**  
    - *Type:* Google Drive  
    - *Role:* Uploads the generated MP3 to a specific Google Drive folder.  
    - *Configuration:*  
      - File name template: `"song_{{ $now.format('yyyyLLdd') }}.{{ $binary.data.fileExtension }}"`  
      - Target folder specified by Drive folder ID (`1tkCr7xdraoZwsHqeLm7FZ4aRWY94oLbZ`)  
      - Drive ID: "My Drive"  
    - *Input:* Binary MP3 data from *Compose music*.  
    - *Output:* Metadata about uploaded file including webViewLink (URL).  
    - *Potential Failures:* Authentication errors, insufficient permissions, file size limits, network issues.

  - **Update Link tracks**  
    - *Type:* Google Sheets  
    - *Role:* Updates the corresponding row in the Google Sheet with the new URL of the uploaded MP3.  
    - *Configuration:*  
      - Operation: Update row based on matching `row_number` column.  
      - Columns updated: 'URL' set to the `webViewLink` from the uploaded file metadata.  
      - Sheet and document IDs same as *Get tracks*.  
    - *Input:* Metadata from *Upload music*, plus the row number from *Loop Over Items*.  
    - *Output:* Confirmation of update.  
    - *Potential Failure:* Row not found, authentication issues, Google Sheets API limits.

#### 1.5 Rate Limiting Delay

- **Overview:** Introduces a 1-minute wait between processing each music request to avoid hitting API rate limits.
- **Nodes Involved:**  
  - *Wait* (Wait node)

- **Node Details:**

  - **Wait**  
    - *Type:* Wait  
    - *Role:* Pauses workflow execution for 1 minute after each music track is processed.  
    - *Configuration:* Wait set to 1 minute.  
    - *Input:* Triggered after updating Google Sheet.  
    - *Output:* Loops back to *Loop Over Items* to process next item.  
    - *Edge Cases:* Workflow idle time may affect execution quotas. If workflow is stopped during wait, current batch may be lost.

---

### 3. Summary Table

| Node Name               | Node Type           | Functional Role                     | Input Node(s)               | Output Node(s)           | Sticky Note                                                                                                                             |
|-------------------------|---------------------|-----------------------------------|-----------------------------|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger      | Starts the workflow manually       | —                           | Get tracks                |                                                                                                                                         |
| Get tracks              | Google Sheets       | Reads music generation requests    | When clicking ‘Execute workflow’ | Loop Over Items           | Please clone [this sheet](https://docs.google.com/spreadsheets/d/10yDGf9Xyx2l-zdd5S1orxZaKbW3_vnONVgRBk_CLrpg/edit?usp=sharing) and fill the columns "Title", "Prompt" and "Duration (ms)" |
| Loop Over Items         | SplitInBatches      | Processes each request item one by one | Get tracks                  | Compose music, Loop Over Items |                                                                                                                                         |
| Compose music           | HTTP Request        | Calls ElevenLabs API to generate music | Loop Over Items             | Upload music              | Go to Developers, create API Key. Set Music Generation from "No Access" to "Access". Set Header Auth (Name: xi-api-key, Value: YOUR_API_KEY) |
| Upload music            | Google Drive        | Uploads generated MP3 to Drive     | Compose music                | Update Link tracks        | Upload the music generated with ElevenLabs on Google Drive and update the Sheet with the URL of the MP3 track                           |
| Update Link tracks      | Google Sheets       | Updates Google Sheet with MP3 URL  | Upload music                 | Wait                     | Upload the music generated with ElevenLabs on Google Drive and update the Sheet with the URL of the MP3 track                           |
| Wait                    | Wait                | Waits 1 minute before next iteration | Update Link tracks           | Loop Over Items           |                                                                                                                                         |
| Sticky Note             | Sticky Note         | Documentation and instructions     | —                           | —                        | ## Automated AI Music Generation with ElevenLabs & Google Drive… (Full content as per node)                                             |
| Sticky Note1            | Sticky Note         | ElevenLabs API setup instructions  | —                           | —                        | ### Compose music with ElevenLabs… (Full content as per node)                                                                           |
| Sticky Note2            | Sticky Note         | Google Sheets setup instructions   | —                           | —                        | ### Setup tracks… (Full content as per node)                                                                                            |
| Sticky Note3            | Sticky Note         | Upload and update documentation    | —                           | —                        | ### Upload music and update Sheet… (Full content as per node)                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Start workflow manually.

2. **Add Google Sheets Node "Get tracks"**  
   - Type: Google Sheets  
   - Operation: Read rows from sheet.  
   - Document ID: Set to your music requests sheet ID (e.g., `10yDGf9Xyx2l-zdd5S1orxZaKbW3_vnONVgRBk_CLrpg`).  
   - Sheet Name / GID: Set to the sheet tab ID (usually `gid=0`).  
   - Filter: Configure to select rows where the "URL" column is empty to identify pending requests.  
   - Credentials: Connect your Google Sheets OAuth2 credentials.

3. **Add SplitInBatches Node "Loop Over Items"**  
   - Type: SplitInBatches  
   - Batch Size: 1 (default)  
   - Connect "Get tracks" output to "Loop Over Items" input.

4. **Add HTTP Request Node "Compose music"**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.elevenlabs.io/v1/music`  
   - Authentication: HTTP Header Auth  
     - Header Name: `xi-api-key`  
     - Header Value: Your ElevenLabs API key  
   - Body (JSON):  
     ```json
     {
       "respect_sections_durations": true,
       "prompt": "{{ $json.PROMPT }}",
       "music_length_ms": {{ $json['DURATION (ms)'] }},
       "model_id": "music_v1"
     }
     ```  
   - Query Parameters: `output_format=mp3_44100_128`  
   - Connect "Loop Over Items" main output to this node.

5. **Add Google Drive Node "Upload music"**  
   - Type: Google Drive  
   - Operation: Upload file  
   - File Name: Use expression `song_{{$now.format('yyyyLLdd')}}.{{ $binary.data.fileExtension }}`  
   - Folder ID: Set to your target Drive folder where MP3s will be stored (e.g., `1tkCr7xdraoZwsHqeLm7FZ4aRWY94oLbZ`)  
   - Credentials: Connect Google Drive OAuth2 credentials.  
   - Connect "Compose music" output to this node.

6. **Add Google Sheets Node "Update Link tracks"**  
   - Type: Google Sheets  
   - Operation: Update row  
   - Document ID and Sheet Name: Same as "Get tracks" node.  
   - Match rows by: `row_number` column  
   - Columns to update: Set "URL" column to `{{ $json.webViewLink }}` from upload response.  
   - Connect "Upload music" output to this node.

7. **Add Wait Node "Wait"**  
   - Type: Wait  
   - Duration: 1 minute  
   - Connect "Update Link tracks" output to this node.

8. **Connect "Wait" Node Back to "Loop Over Items"**  
   - Use the second output of "Loop Over Items" to receive control after delay and process the next batch.

9. **Set up Credentials**  
   - Google Sheets OAuth2: Authenticate with access to your music request sheet.  
   - Google Drive OAuth2: Authenticate with access to your target Drive folder.  
   - ElevenLabs API Key: Obtain from ElevenLabs developer portal, enable Music API access, and enter in HTTP Header Auth.

10. **Test and Execute**  
    - Populate your Google Sheet with columns: Title, Prompt, Duration (ms), URL (empty initially).  
    - Run the manual trigger node.  
    - Monitor logs and outputs for errors, confirm MP3 files upload and URLs update.

---

### 5. General Notes & Resources

| Note Content                                                                                                            | Context or Link                                                                                                                  |
|-------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| This workflow uses ElevenLabs Music API which requires a paid plan.                                                     | ElevenLabs Music API website: https://try.elevenlabs.io/ahkbf00hocnu                                                             |
| Please clone the shared Google Sheet template to set up your music requests.                                            | Sheet link: https://docs.google.com/spreadsheets/d/10yDGf9Xyx2l-zdd5S1orxZaKbW3_vnONVgRBk_CLrpg/edit?usp=sharing                  |
| ElevenLabs API key setup requires enabling Music Generation access and using HTTP Header authentication with `xi-api-key`. | ElevenLabs developer docs (sign-in required): https://developers.elevenlabs.io/                                                    |
| Generated music duration constraints: minimum 10 seconds, maximum 5 minutes.                                            | Mentioned in workflow sticky notes                                                                                            |
| To avoid rate limits, the workflow waits 1 minute between generating each music track.                                  | Rate limiting strategy implemented with Wait node                                                                              |

---

*Disclaimer: The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. All data is legal and public, and the workflow complies with content policies.*