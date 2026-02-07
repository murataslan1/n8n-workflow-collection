Automate Meeting Transcription & Minutes Distribution with OpenAI and Google Drive

https://n8nworkflows.xyz/workflows/automate-meeting-transcription---minutes-distribution-with-openai-and-google-drive-10820


# Automate Meeting Transcription & Minutes Distribution with OpenAI and Google Drive

---
### 1. Workflow Overview

This workflow automates the entire lifecycle of meeting audio recordings: from detecting new audio files uploaded to Google Drive, transcribing them using OpenAI’s speech-to-text capabilities, generating structured meeting minutes, converting the minutes into a document file, uploading the file back to Google Drive, and finally notifying a team via Chatwork. It targets teams and organizations that require smooth, consistent, high-quality meeting documentation without manual intervention.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & File Download:** Detect new audio files in a specific Google Drive folder and download them.
- **1.2 AI Processing – Transcription & Summarization:** Send the audio to OpenAI for transcription, then process the transcript to generate structured, client-ready meeting minutes.
- **1.3 File Conversion & Upload:** Convert the generated meeting minutes text into a file (e.g., .txt or .docx) and upload it to a designated Google Drive folder.
- **1.4 Notification:** Send a formatted notification to a Chatwork room informing the team that the meeting minutes are ready.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & File Download

- **Overview:**  
  This block monitors a specific Google Drive folder for new audio files. Upon detection, it downloads the audio file in binary format, preparing it for transcription.

- **Nodes Involved:**  
  - Google Drive Trigger  
  - Google Drive (download node)  
  - Sticky Note (explaining this block)

- **Node Details:**

  - **Google Drive Trigger**  
    - *Type:* Trigger node, Google Drive Trigger  
    - *Configuration:* Watches for new files created in a specific folder (ID: `103izO2_it3aeyuqF6lo7lfIZhvOp7mbY`). Polling set to once every hour at minute 59.  
    - *Expressions:* Uses folder ID to restrict trigger scope.  
    - *Input/Output:* No input; output is data about the newly created file.  
    - *Edge Cases:*  
      - Delay due to polling interval (up to 1 hour lag)  
      - Permission or authentication errors for Google Drive API  
      - Files not being audio or unsupported formats  
    - *Credentials:* OAuth2 for Google Drive

  - **Google Drive (Download)**  
    - *Type:* Google Drive Node (File Download)  
    - *Configuration:* Uses the file ID from the trigger to download the file content into a binary property `data`.  
    - *Expressions:* File ID and original filename dynamically pulled from trigger output.  
    - *Input/Output:* Input from trigger; output includes binary data of audio file.  
    - *Edge Cases:*  
      - File not found if deleted or moved after trigger  
      - File access permission errors  
      - Large file size causing timeouts  
    - *Credentials:* OAuth2 for Google Drive  

  - **Sticky Note**  
    - Provides overview documentation for this block.

---

#### 2.2 AI Processing – Transcription & Summarization

- **Overview:**  
  Processes the downloaded audio by transcribing it with OpenAI’s audio-to-text model, then sends the transcript to another OpenAI instance configured for advanced summarization and structured meeting minutes generation in Japanese.

- **Nodes Involved:**  
  - OpenAI (transcription)  
  - OpenAI 2 (structured minutes generation)  
  - Sticky Note1 (explains AI processing)

- **Node Details:**

  - **OpenAI (Transcription)**  
    - *Type:* OpenAI Langchain node, resource: audio, operation: transcribe  
    - *Configuration:* Sends binary audio data to OpenAI’s transcription endpoint. No additional options set.  
    - *Input/Output:* Input binary audio from Google Drive download node; output JSON with `text` property containing the transcript.  
    - *Edge Cases:*  
      - Audio format unsupported or corrupted file  
      - API rate limits or authentication failure  
      - Partial or inaccurate transcription due to audio quality  
    - *Credentials:* OpenAI API key  

  - **OpenAI 2 (Minutes Generation)**  
    - *Type:* OpenAI Langchain node, resource: chat/completions, model "gpt-5"  
    - *Configuration:*  
      - Uses a multi-message system prompt structured in XML-like tags to instruct the model to generate client-ready meeting minutes in Japanese.  
      - The prompt defines roles, objectives, core skills (key point extraction, speaker/topic organization), workflow steps, error handling, feedback loops, ethical considerations, etc.  
      - The user message includes the current date/time and the transcribed text for contextual processing.  
    - *Input/Output:* Input from previous OpenAI transcription node; outputs a message object with structured meeting minute content.  
    - *Edge Cases:*  
      - Model response failures or API limits  
      - Timeout or incomplete output  
      - Unexpected formatting or missing parts if transcription is poor  
    - *Credentials:* OpenAI API key  

  - **Sticky Note1**  
    - Describes the transcription and summarization flow, and notes that OpenAI can be replaced by other LLMs if needed.  

---

#### 2.3 File Conversion & Upload

- **Overview:**  
  Converts the generated meeting minutes text into a file format suitable for archival or sharing (e.g., `.docx`), then uploads the file to a designated Google Drive folder with a timestamped filename.

- **Nodes Involved:**  
  - Convert to File  
  - Upload file (Google Drive)  
  - Sticky Note3 (conversion explanation)  
  - Sticky Note4 (upload explanation)

- **Node Details:**

  - **Convert to File**  
    - *Type:* ConvertToFile node  
    - *Configuration:* Converts the input text (from OpenAI 2 output at `message.content`) into a text-based file format; defaults to text or docx as per node settings.  
    - *Input/Output:* Input JSON content; output binary file data ready for upload.  
    - *Edge Cases:*  
      - Conversion failure if input is empty or malformed  
      - Unsupported output format settings  
    - *No credentials required*

  - **Upload file (Google Drive)**  
    - *Type:* Google Drive node (upload)  
    - *Configuration:*  
      - Uploads the converted file to a specific Google Drive folder (ID: `1u9Q0BevrGONjaiBKIhnW69rx5iMK27o8`).  
      - Filename is dynamically generated based on current datetime in `yyyy-MM-dd _hhmmss` format with `.docx` extension.  
      - Drive ID set to "My Drive".  
    - *Input/Output:* Input is binary file from Convert to File; output is metadata of uploaded file.  
    - *Edge Cases:*  
      - Upload failure due to network or permission issues  
      - Filename conflicts or folder access restrictions  
    - *Credentials:* OAuth2 Google Drive  

  - **Sticky Notes 3 & 4**  
    - Provide contextual explanations for conversion and upload steps.

---

#### 2.4 Notification

- **Overview:**  
  Sends an automated notification to a Chatwork room to inform the team that the meeting minutes are ready, including a summary snippet from the AI-generated content.

- **Nodes Involved:**  
  - Chatwork Notification  
  - Sticky Note2 (explains the notification step)

- **Node Details:**

  - **Chatwork Notification**  
    - *Type:* HTTP Request node  
    - *Configuration:*  
      - POST request with `form-urlencoded` content type to Chatwork API endpoint (URL not shown in JSON, set in credentials).  
      - Body includes formatted message with `[info][title]自動通知[/title]議事録の作成が完了しました。[/info]` plus the meeting minutes content from `OpenAI 2` node.  
      - Authentication via HTTP Header Auth credential with API token.  
    - *Input/Output:* Input is the uploaded file metadata; output is API response.  
    - *Edge Cases:*  
      - API authentication failure or expired token  
      - Network errors or rate limiting  
      - Message formatting issues causing rejection by Chatwork  
    - *Credentials:* HTTP Header Auth for Chatwork API  

  - **Sticky Note2**  
    - Explains the purpose of this notification step.

---

### 3. Summary Table

| Node Name           | Node Type                       | Functional Role                               | Input Node(s)          | Output Node(s)           | Sticky Note                                                                                                                        |
|---------------------|--------------------------------|-----------------------------------------------|-----------------------|--------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Google Drive Trigger | Google Drive Trigger            | Detects new audio files in Google Drive folder | —                     | Google Drive             | Triggering and Downloading the Audio File. This workflow uses Google Drive as the source. When an audio file is uploaded, the trigger activates immediately and downloads the file for processing. |
| Google Drive        | Google Drive (Download)         | Downloads the detected audio file              | Google Drive Trigger   | OpenAI                   |                                                                                                                                    |
| OpenAI              | OpenAI Langchain (Audio Transcribe) | Transcribes audio to text                       | Google Drive           | OpenAI 2                 | Transcription and Summarization with OpenAI. Once the file data is retrieved, it is sent to OpenAI for transcription. The transcribed text is then processed again by OpenAI to generate a summary and extract additional information. Although this workflow uses OpenAI, you can replace it with any other LLM as well. |
| OpenAI 2            | OpenAI Langchain (Chat Completion) | Generates structured, client-ready meeting minutes | OpenAI                 | Convert to File           |                                                                                                                                    |
| Convert to File     | ConvertToFile                   | Converts meeting minutes text to file format  | OpenAI 2               | Upload file               | Convert to File: Converts the summarized meeting notes into a text or docx file.                                                  |
| Upload file         | Google Drive (Upload)           | Uploads the meeting minutes file to Drive      | Convert to File        | Chatwork Notification     | Google Drive Upload: Uploads the generated meeting notes file to the specified Google Drive folder.                              |
| Chatwork Notification | HTTP Request                  | Sends notification to Chatwork room            | Upload file            | —                        | Chatwork Notification: Sends an automatic notification to Chatwork to inform that the meeting notes are ready.                  |
| Sticky Note         | Sticky Note                    | Documentation for trigger & download block     | —                     | —                        | Triggering and Downloading the Audio File. This workflow uses Google Drive as the source. When an audio file is uploaded, the trigger activates immediately and downloads the file for processing. |
| Sticky Note1        | Sticky Note                    | Documentation for transcription and summarization | —                     | —                        | Transcription and Summarization with OpenAI. Once the file data is retrieved, it is sent to OpenAI for transcription. The transcribed text is then processed again by OpenAI to generate a summary and extract additional information. Although this workflow uses OpenAI, you can replace it with any other LLM as well. |
| Sticky Note2        | Sticky Note                    | Documentation for Chatwork notification         | —                     | —                        | Chatwork Notification: Sends an automatic notification to Chatwork to inform that the meeting notes are ready.                  |
| Sticky Note3        | Sticky Note                    | Documentation for file conversion step          | —                     | —                        | Convert to File: Converts the summarized meeting notes into a text or docx file.                                                  |
| Sticky Note4        | Sticky Note                    | Documentation for Google Drive upload step      | —                     | —                        | Google Drive Upload: Uploads the generated meeting notes file to the specified Google Drive folder.                              |
| Sticky Note5        | Sticky Note                    | General overview and detailed workflow explanation | —                     | —                        | Automated Meeting Recording Transcription & Minutes Distribution Workflow. Managing meeting recordings manually—downloading audio, transcribing it, summarizing key points, saving documents, and notifying the team—quickly becomes repetitive and inefficient. This workflow eliminates all of those manual steps by automatically detecting new audio files uploaded to a designated Google Drive folder, converting them into high-quality transcripts using OpenAI, summarizing them into structured meeting minutes, transforming the content into a text file, uploading it back to Google Drive, and finally notifying a Chatwork room with the completed summary. What used to take hours can now be completed automatically within minutes, ensuring consistency, accuracy, and faster information sharing. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger Node:**  
   - Type: Google Drive Trigger  
   - Set event to `fileCreated`  
   - Select "Trigger on specific folder" and enter the folder ID to watch (e.g., `103izO2_it3aeyuqF6lo7lfIZhvOp7mbY`)  
   - Set polling interval to every hour at minute 59  
   - Attach Google Drive OAuth2 credentials  
   - Position: Leftmost, as the starting point

2. **Add Google Drive Node (Download):**  
   - Type: Google Drive  
   - Operation: Download  
   - File ID: Use expression to get `{{$json.id}}` from trigger output  
   - Binary Property Name: `data`  
   - Attach same Google Drive OAuth2 credentials  
   - Connect Google Drive Trigger → Google Drive (Download)

3. **Add OpenAI Node for Transcription:**  
   - Type: OpenAI Langchain Node  
   - Resource: Audio  
   - Operation: Transcribe  
   - Input: Connect from Google Drive (Download) node (binary data)  
   - Attach OpenAI API credential  
   - Position: Next in flow after download

4. **Add OpenAI Node for Minutes Generation:**  
   - Type: OpenAI Langchain Node  
   - Model: Select model `gpt-5` or newer capable of chat completions  
   - Resource: Chat Completion  
   - Set up system prompt with detailed XML-like instructions to produce structured meeting minutes in Japanese, including roles, objectives, workflow steps, error handling, and ethical considerations (copy the prompt content from the original workflow)  
   - User message: Include current date/time and transcription text from previous node (`$('OpenAI').item.json.text`)  
   - Attach OpenAI API credential  
   - Connect OpenAI (Transcription) → OpenAI 2 (Minutes Generation)

5. **Add Convert to File Node:**  
   - Type: ConvertToFile  
   - Operation: To Text or Docx (choose based on desired output format)  
   - Source Property: `message.content` from OpenAI 2 output  
   - Connect OpenAI 2 → Convert to File

6. **Add Google Drive Node (Upload):**  
   - Type: Google Drive  
   - Operation: Upload  
   - Folder ID: Set to target folder for finished minutes (e.g., `1u9Q0BevrGONjaiBKIhnW69rx5iMK27o8`)  
   - Filename: Use expression to generate timestamped filename, e.g., `{{$now.format('yyyy-MM-dd _hhmmss')}}.docx`  
   - Attach Google Drive OAuth2 credentials  
   - Connect Convert to File → Upload file

7. **Add HTTP Request Node for Chatwork Notification:**  
   - Type: HTTP Request  
   - Method: POST  
   - Content Type: `application/x-www-form-urlencoded` (form-urlencoded)  
   - Body Parameter: `body` with value formatted as:  
     ```
     =[info][title]自動通知[/title]議事録の作成が完了しました。[/info]

     {{ $('OpenAI 2').item.json.message.content }}
     ```  
   - Authentication: Set HTTP Header Auth credentials with Chatwork API token and endpoint URL configured in credentials  
   - Connect Upload file → Chatwork Notification

8. **Add Sticky Notes:**  
   - Add explanatory sticky notes for each logical block as needed, copying content from the original workflow for documentation and clarity.

9. **Activate Workflow:**  
   - Ensure all credentials are valid and tested:  
     - Google Drive OAuth2 with permissions to read/write the specified folders  
     - OpenAI API keys for transcription and chat completion  
     - Chatwork API token with permissions to post in the designated room  
   - Test by uploading a sample audio file to the monitored Google Drive folder and verify end-to-end execution, including transcription, minutes generation, file upload, and notification.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Context or Link                                                            |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| This workflow was designed to eliminate manual effort in meeting recording processing by automating transcription, summarization, file management, and team notification, thereby improving efficiency and consistency. It is suitable for teams using Google Drive for recording storage and Chatwork for communication. Supports Japanese language output by default. The meeting minutes generation system is sophisticated, supporting key point extraction, topic organization, review processes, and ethical considerations like confidentiality and transparency. The system prompt for OpenAI is highly detailed and modular, allowing easy customization to fit organizational needs. | Workflow overview and purpose                                              |
| For customization, users can modify the OpenAI system prompt to adjust output language, format, or content style; add other notification channels (Slack, Teams, Discord); implement revision loops with user feedback; or integrate with additional systems like Google Sheets or vector databases for semantic search.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Customization advice                                                       |
| References to Chatwork API authentication require an HTTP Header Auth credential with token and the correct API endpoint URL. Google Drive credentials need folder access rights for both monitoring and uploading. OpenAI requires API keys with access to transcription and GPT-4 or GPT-5 models for chat completions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Credential setup                                                          |
| Supported audio formats depend on OpenAI's transcription model capabilities (e.g., mp3, wav, m4a). Audio quality impacts transcription accuracy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Input data considerations                                                 |
| The workflow uses polling trigger due to Google Drive limitations; this may introduce up to 1-hour delay between file upload and processing start. For real-time or near real-time processing, consider alternative triggers or Google Drive Push notifications if available.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Performance and latency note                                              |
| Ethical considerations include ensuring confidentiality of meeting data, anonymizing sensitive information, and maintaining transparency by allowing users to track and review AI-generated summaries. The system prompt embeds these principles to enforce responsible AI usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Ethical usage and compliance notes                                        |

---

**Disclaimer:**  
The provided text is extracted exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.

---