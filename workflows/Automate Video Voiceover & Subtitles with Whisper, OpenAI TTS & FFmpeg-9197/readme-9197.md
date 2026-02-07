Automate Video Voiceover & Subtitles with Whisper, OpenAI TTS & FFmpeg

https://n8nworkflows.xyz/workflows/automate-video-voiceover---subtitles-with-whisper--openai-tts---ffmpeg-9197


# Automate Video Voiceover & Subtitles with Whisper, OpenAI TTS & FFmpeg

### 1. Workflow Overview

This n8n workflow automates the process of generating video voiceovers and subtitles using a combination of Whisper (for transcription), OpenAI Text-to-Speech (TTS), and FFmpeg (for video/audio processing). It is designed to handle video input, transcribe audio, generate AI-based voiceovers in multiple languages, create subtitles, and produce finalized video files with embedded audio and subtitles. The workflow is well-suited for content creators, marketers, or automated media workflows requiring multilingual audio and subtitle generation.

The workflow is logically divided into the following blocks:

- **1.1 Initialization & Input Reception:** Folder setup and user input acquisition through form triggers.
- **1.2 Audio Extraction & Whisper Transcription:** Extract audio from video, upload it, and transcribe it with Whisper ASR (Automatic Speech Recognition).
- **1.3 AI Text Processing & TTS Generation:** Process transcription text with OpenAI, generate translated and/or summarized text, and convert it to speech audio files.
- **1.4 Video & Subtitle Synthesis:** Merge voiceover audio and subtitles into the original video using FFmpeg commands executed via SSH.
- **1.5 File Storage & Cleanup:** Upload final videos to Google Drive and clean temporary files on the server.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Initialization & Input Reception

**Overview:**  
This block initializes necessary folders on the server and receives video input parameters from users via web forms to trigger the workflow.

**Nodes Involved:**  
- Initialize Folders (Manual Trigger)  
- R (SSH)  
- CMF (SSH)  
- CS (SSH)  
- UV (Form Trigger)  
- C (Set)  

**Node Details:**  

- **Initialize Folders**  
  - Type: Manual Trigger  
  - Role: Starts the workflow manually for folder initialization.  
  - Connections: Outputs to node R.  
  - Failure points: SSH connection errors if server unreachable.

- **R**  
  - Type: SSH  
  - Role: Executes remote shell commands, likely to create or verify initial folders on the server.  
  - Connections: Input from Initialize Folders, output to CMF.  
  - Configuration: SSH credentials to the processing server.  
  - Failures: SSH auth failure, command execution errors.

- **CMF**  
  - Type: SSH  
  - Role: Continues folder setup or configuration on the server.  
  - Connections: Input from R, output to CS.  
  - Failures: Same as above.

- **CS**  
  - Type: SSH  
  - Role: Final step in folder initialization process.  
  - Connections: Input from CMF. Output not connected further in JSON, likely final setup.  
  - Failures: SSH issues.

- **UV**  
  - Type: Form Trigger (Webhook)  
  - Role: Receives user input for video processing, such as upload parameters or video URLs.  
  - Configuration: Webhook ID specified, executes once per form submission.  
  - Connections: Output to node C.  
  - Failures: Webhook errors, malformed input.

- **C**  
  - Type: Set  
  - Role: Prepares or sets variables/parameters from UV form data for subsequent processing.  
  - Connections: Out to FTP node SUV.  
  - Failures: Expression errors if inputs are missing or invalid.

---

#### 1.2 Audio Extraction & Whisper Transcription

**Overview:**  
This block handles uploading video, extracting audio, and transcribing speech to text with Whisper.

**Nodes Involved:**  
- SUV (FTP Upload)  
- EA (SSH)  
- SDA (FTP Download)  
- WT (HTTP Request)  
- WS (Code)  
- EF (SSH)  

**Node Details:**  

- **SUV**  
  - Type: FTP  
  - Role: Uploads video files from local to remote server.  
  - Configuration: FTP credentials and target remote directory.  
  - Input: Comes from Set node C, which holds file info.  
  - Output: To EA SSH node.  
  - Failures: FTP auth, file transfer errors.

- **EA**  
  - Type: SSH  
  - Role: Executes commands to extract audio from uploaded video (likely via FFmpeg).  
  - Input: From SUV FTP.  
  - Output: To SDA FTP.  
  - Failures: SSH or command execution errors.

- **SDA**  
  - Type: FTP  
  - Role: Downloads extracted audio back to local environment or accessible location.  
  - Input: From EA SSH.  
  - Output: To WT HTTP Request.  
  - Failures: FTP failures.

- **WT**  
  - Type: HTTP Request  
  - Role: Sends audio file to Whisper ASR API or server for transcription.  
  - Configuration: API endpoint, likely to Whisper model.  
  - Input: From SDA FTP.  
  - Output: To WS Code node.  
  - Failures: API timeouts, authentication failure.

- **WS**  
  - Type: Code  
  - Role: Processes Whisper transcription output, parses JSON, cleans or formats transcription text.  
  - Input: From WT HTTP Request.  
  - Output: To EF SSH node.  
  - Failures: Code execution errors, malformed input.

- **EF**  
  - Type: SSH  
  - Role: Possibly performs additional processing or prepares transcription data for next steps.  
  - Input: From WS.  
  - Output: To M Merge node (Block 1.3).  
  - Failures: SSH or script errors.

---

#### 1.3 AI Text Processing & TTS Generation

**Overview:**  
This block merges transcription data, sends text to OpenAI for translation or enhancement, generates TTS audio files, and uploads them to FTP.

**Nodes Involved:**  
- M (Merge)  
- SDF (FTP)  
- AF (OpenAI)  
- RT (Code)  
- OS (HTTP Request)  
- CV (Code)  
- SUV1 (FTP)  
- M1 (Merge)  
- BC (Code)  
- SUV2 (FTP)  
- TM (SSH)  
- SDV (FTP)  

**Node Details:**  

- **M**  
  - Type: Merge  
  - Role: Combines multiple streams of data, e.g., transcription and metadata.  
  - Input: From EF SSH and WS Code nodes.  
  - Output: To SDF FTP and EF SSH nodes.  
  - Failures: Data mismatch or empty inputs.

- **SDF**  
  - Type: FTP  
  - Role: Uploads processed text or intermediate files to server.  
  - Input: From M.  
  - Output: To AF OpenAI node.  
  - Failures: FTP errors.

- **AF**  
  - Type: OpenAI (LangChain node)  
  - Role: Sends text for AI processing such as translation, summarization, or rephrasing.  
  - Configuration: Requires OpenAI API credentials and appropriate prompt setup.  
  - Input: From SDF.  
  - Output: To RT Code node.  
  - Failures: API quota, authentication, or response errors.

- **RT**  
  - Type: Code  
  - Role: Processes OpenAI output, formats text for TTS conversion.  
  - Input: From AF.  
  - Output: To M1 Merge and OS HTTP Request nodes.  
  - Failures: Code exceptions.

- **OS**  
  - Type: HTTP Request  
  - Role: Sends processed text to TTS service endpoint to generate speech audio files.  
  - Input: From RT.  
  - Output: To CV Code node.  
  - Failures: API errors, timeouts.

- **CV**  
  - Type: Code  
  - Role: Processes TTS response, handles audio file metadata.  
  - Input: From OS.  
  - Output: To SUV1 FTP.  
  - Failures: Code errors.

- **SUV1**  
  - Type: FTP  
  - Role: Uploads generated TTS audio files to remote server.  
  - Input: From CV.  
  - Output: To M1 Merge node.  
  - Failures: FTP upload failures.

- **M1**  
  - Type: Merge  
  - Role: Merges multiple streams, likely pairing TTS audio with other data for next processing.  
  - Input: From RT and SUV1.  
  - Output: To BC Code node.  
  - Failures: Data sync issues.

- **BC**  
  - Type: Code  
  - Role: Further processes merged data, prepares commands or metadata for video synthesis.  
  - Input: From M1.  
  - Output: To SUV2 FTP.  
  - Failures: Code errors.

- **SUV2**  
  - Type: FTP  
  - Role: Uploads additional files possibly subtitles or metadata files to the server.  
  - Input: From BC.  
  - Output: To TM SSH node.  
  - Failures: FTP failures.

- **TM**  
  - Type: SSH  
  - Role: Executes final preparation commands on server before video rendering.  
  - Input: From SUV2.  
  - Output: To SDV FTP node.  
  - Failures: SSH errors.

- **SDV**  
  - Type: FTP  
  - Role: Downloads or manages video files after processing steps.  
  - Input: From TM.  
  - Output: To StoreVideo node (Google Drive upload).  
  - Failures: FTP errors.

---

#### 1.4 Video & Subtitle Synthesis

**Overview:**  
This block incorporates voiceover audio and subtitles into the video via SSH commands running FFmpeg or similar tools.

**Nodes Involved:**  
- UMV (Form Trigger)  
- S (Code)  
- SUV3 (FTP)  
- CO (Code)  
- MV (SSH)  
- EA1 (SSH)  
- SDA1 (FTP)  
- WT1 (HTTP Request)  
- PR (Code)  
- SUS (FTP)  
- AS (SSH)  
- SDV1 (FTP)  

**Node Details:**  

- **UMV**  
  - Type: Form Trigger (Webhook)  
  - Role: Receives user input related to video merging or final processing steps.  
  - Input: External trigger.  
  - Output: To S Code node.  
  - Failures: Webhook errors.

- **S**  
  - Type: Code  
  - Role: Processes form data, prepares parameters for video/audio merge.  
  - Input: From UMV.  
  - Output: To SUV3 FTP.  
  - Failures: Code runtime errors.

- **SUV3**  
  - Type: FTP  
  - Role: Uploads files necessary for video merging (e.g., audio, subtitle files).  
  - Input: From S.  
  - Output: To CO Code node.  
  - Failures: FTP issues.

- **CO**  
  - Type: Code  
  - Role: Prepares commands or scripts for merging process.  
  - Input: From SUV3.  
  - Output: To MV SSH node.  
  - Failures: Code exceptions.

- **MV**  
  - Type: SSH  
  - Role: Runs FFmpeg or similar commands to merge audio and subtitles into video.  
  - Input: From CO.  
  - Output: To EA1 SSH node.  
  - Failures: SSH or FFmpeg errors.

- **EA1**  
  - Type: SSH  
  - Role: Post-processing or final adjustments on merged video file.  
  - Input: From MV.  
  - Output: To SDA1 FTP node.  
  - Failures: SSH errors.

- **SDA1**  
  - Type: FTP  
  - Role: Downloads or moves the final video to accessible location.  
  - Input: From EA1.  
  - Output: To WT1 HTTP Request.  
  - Failures: FTP failures.

- **WT1**  
  - Type: HTTP Request  
  - Role: Calls external API or service to validate or further process final video.  
  - Input: From SDA1.  
  - Output: To PR Code node.  
  - Failures: API errors.

- **PR**  
  - Type: Code  
  - Role: Processes validation results or metadata updates.  
  - Input: From WT1.  
  - Output: To SUS FTP node.  
  - Failures: Code errors.

- **SUS**  
  - Type: FTP  
  - Role: Uploads the validated final video for storage or distribution.  
  - Input: From PR.  
  - Output: To AS SSH node.  
  - Failures: FTP failures.

- **AS**  
  - Type: SSH  
  - Role: Executes final server-side tasks, possibly permissions or cleanup triggers.  
  - Input: From SUS.  
  - Output: To SDV1 FTP node.  
  - Failures: SSH errors.

- **SDV1**  
  - Type: FTP  
  - Role: Final FTP step for video storage location or backup.  
  - Input: From AS.  
  - Output: To StoreVideo Google Drive node.  
  - Failures: FTP errors.

---

#### 1.5 File Storage & Cleanup

**Overview:**  
Uploads the final video to Google Drive and performs cleanup of temporary files on the server to maintain system hygiene.

**Nodes Involved:**  
- StoreVideo (Google Drive)  
- CleanUp (SSH)  

**Node Details:**  

- **StoreVideo**  
  - Type: Google Drive  
  - Role: Uploads the finalized video file to Google Drive for storage or sharing.  
  - Configuration: Requires Google Drive OAuth2 credentials.  
  - Input: From SDV and SDV1 FTP nodes (final video files).  
  - Output: To CleanUp SSH node.  
  - Failures: OAuth errors, API quota, upload size limits.

- **CleanUp**  
  - Type: SSH  
  - Role: Deletes temporary files and folders on the remote server to free up space.  
  - Input: From StoreVideo node.  
  - Output: None (end of workflow).  
  - Failures: SSH command errors, permissions.

---

### 3. Summary Table

| Node Name          | Node Type               | Functional Role                         | Input Node(s)           | Output Node(s)        | Sticky Note |
|--------------------|-------------------------|---------------------------------------|------------------------|-----------------------|-------------|
| Initialize Folders  | Manual Trigger          | Start workflow, folder setup          |                        | R                     |             |
| R                  | SSH                     | Executes folder creation commands     | Initialize Folders      | CMF                   |             |
| CMF                | SSH                     | Continued folder setup                 | R                      | CS                    |             |
| CS                 | SSH                     | Final folder initialization step      | CMF                    |                       |             |
| UV                 | Form Trigger            | Receives user video input              |                        | C                     |             |
| C                  | Set                     | Prepares input parameters              | UV                     | SUV                   |             |
| SUV                | FTP                     | Uploads video files                    | C                      | EA                    |             |
| EA                 | SSH                     | Extracts audio from video              | SUV                    | SDA                   |             |
| SDA                | FTP                     | Downloads extracted audio              | EA                     | WT                    |             |
| WT                 | HTTP Request            | Sends audio to Whisper for transcription | SDA                  | WS                    |             |
| WS                 | Code                    | Processes Whisper transcription output | WT                    | EF                    |             |
| EF                 | SSH                     | Prepares transcription data           | WS                     | M                     |             |
| M                  | Merge                   | Combines data streams                  | EF, WS                  | SDF                   |             |
| SDF                | FTP                     | Uploads transcription/intermediate files | M                    | AF                    |             |
| AF                 | OpenAI (LangChain)      | AI text processing (translation, etc.) | SDF                    | RT                    |             |
| RT                 | Code                    | Processes OpenAI output                | AF                     | M1, OS                |             |
| OS                 | HTTP Request            | Sends text to TTS service              | RT                     | CV                    |             |
| CV                 | Code                    | Processes TTS response                 | OS                     | SUV1                  |             |
| SUV1               | FTP                     | Uploads TTS audio files                | CV                     | M1                    |             |
| M1                 | Merge                   | Combines TTS audio and text data      | RT, SUV1                | BC                    |             |
| BC                 | Code                    | Prepares data for video synthesis     | M1                     | SUV2                  |             |
| SUV2               | FTP                     | Uploads files for video synthesis     | BC                     | TM                    |             |
| TM                 | SSH                     | Executes preparation commands         | SUV2                    | SDV                   |             |
| SDV                | FTP                     | Downloads/handles processed video files | TM                    | StoreVideo            |             |
| UMV                | Form Trigger            | Receives user input for merging       |                        | S                     |             |
| S                  | Code                    | Processes merging parameters          | UMV                    | SUV3                  |             |
| SUV3               | FTP                     | Uploads merging files                  | S                      | CO                    |             |
| CO                 | Code                    | Prepares merge commands                | SUV3                    | MV                    |             |
| MV                 | SSH                     | Runs FFmpeg merge commands             | CO                     | EA1                   |             |
| EA1                | SSH                     | Post-processing on merged video       | MV                     | SDA1                  |             |
| SDA1               | FTP                     | Downloads final merged video           | EA1                    | WT1                   |             |
| WT1                | HTTP Request            | Validates/processes final video        | SDA1                    | PR                    |             |
| PR                 | Code                    | Processes validation results          | WT1                    | SUS                   |             |
| SUS                | FTP                     | Uploads validated video                | PR                     | AS                    |             |
| AS                 | SSH                     | Final server tasks                    | SUS                    | SDV1                  |             |
| SDV1               | FTP                     | Final FTP step before storage          | AS                     | StoreVideo            |             |
| StoreVideo         | Google Drive            | Uploads final video to cloud           | SDV, SDV1               | CleanUp               |             |
| CleanUp            | SSH                     | Deletes temporary files on server      | StoreVideo              |                       |             |
| Sticky Note        | Sticky Note             |                                       |                        |                       |             |
| Sticky Note1       | Sticky Note             |                                       |                        |                       |             |
| Sticky Note2       | Sticky Note             |                                       |                        |                       |             |
| Sticky Note3       | Sticky Note             |                                       |                        |                       |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger node:**  
   - Name: "Initialize Folders"  
   - Purpose: Manual start for folder initialization.

2. **Add SSH node "R":**  
   - Connect "Initialize Folders" to "R".  
   - Configure SSH credentials for the remote processing server.  
   - Set commands to create or verify folders.

3. **Add SSH node "CMF":**  
   - Connect "R" to "CMF".  
   - Commands for further folder setup.

4. **Add SSH node "CS":**  
   - Connect "CMF" to "CS".  
   - Final initialization commands.

5. **Add Form Trigger node "UV":**  
   - Configure webhook for user input of video parameters.  
   - Connect output to next Set node.

6. **Add Set node "C":**  
   - Connect "UV" to "C".  
   - Set variables from form data for later FTP upload.

7. **Add FTP node "SUV":**  
   - Configure FTP credentials to upload videos to server.  
   - Connect "C" to "SUV".

8. **Add SSH node "EA":**  
   - Connect "SUV" to "EA".  
   - Commands to extract audio from uploaded video (e.g., FFmpeg command).

9. **Add FTP node "SDA":**  
   - Connect "EA" to "SDA".  
   - Download extracted audio.

10. **Add HTTP Request node "WT":**  
    - Connect "SDA" to "WT".  
    - Configure to call Whisper ASR API with audio file.

11. **Add Code node "WS":**  
    - Connect "WT" to "WS".  
    - Parse and format Whisper transcription results.

12. **Add SSH node "EF":**  
    - Connect "WS" to "EF".  
    - Additional processing on transcription data.

13. **Add Merge node "M":**  
    - Connect "EF" and "WS" outputs to "M".  
    - Combine transcription and metadata.

14. **Add FTP node "SDF":**  
    - Connect "M" to "SDF".  
    - Upload transcription files for AI processing.

15. **Add OpenAI (LangChain) node "AF":**  
    - Connect "SDF" to "AF".  
    - Configure with OpenAI API credentials.  
    - Set prompts for translation or summarization.

16. **Add Code node "RT":**  
    - Connect "AF" to "RT".  
    - Prepare text for TTS conversion.

17. **Add HTTP Request node "OS":**  
    - Connect "RT" to "OS".  
    - Configure to call TTS API endpoint.

18. **Add Code node "CV":**  
    - Connect "OS" to "CV".  
    - Handle TTS response and audio metadata.

19. **Add FTP node "SUV1":**  
    - Connect "CV" to "SUV1".  
    - Upload generated voiceover audio.

20. **Add Merge node "M1":**  
    - Connect "RT" and "SUV1" to "M1".  
    - Merge audio and text data.

21. **Add Code node "BC":**  
    - Connect "M1" to "BC".  
    - Prepare final data for video synthesis.

22. **Add FTP node "SUV2":**  
    - Connect "BC" to "SUV2".  
    - Upload files needed for video synthesis.

23. **Add SSH node "TM":**  
    - Connect "SUV2" to "TM".  
    - Runs commands to prepare video files.

24. **Add FTP node "SDV":**  
    - Connect "TM" to "SDV".  
    - Manage synthesized video files.

25. **Add Form Trigger node "UMV":**  
    - Configure webhook for user input related to final video merge.  
    - Connect to Code node "S".

26. **Add Code node "S":**  
    - Connect "UMV" to "S".  
    - Prepare video merging parameters.

27. **Add FTP node "SUV3":**  
    - Connect "S" to "SUV3".  
    - Upload merge-related files.

28. **Add Code node "CO":**  
    - Connect "SUV3" to "CO".  
    - Prepare merge commands.

29. **Add SSH node "MV":**  
    - Connect "CO" to "MV".  
    - Execute FFmpeg to merge audio/subtitles.

30. **Add SSH node "EA1":**  
    - Connect "MV" to "EA1".  
    - Post-processing on merged video.

31. **Add FTP node "SDA1":**  
    - Connect "EA1" to "SDA1".  
    - Download merged video.

32. **Add HTTP Request node "WT1":**  
    - Connect "SDA1" to "WT1".  
    - Validate or process the final video.

33. **Add Code node "PR":**  
    - Connect "WT1" to "PR".  
    - Process validation results.

34. **Add FTP node "SUS":**  
    - Connect "PR" to "SUS".  
    - Upload validated video.

35. **Add SSH node "AS":**  
    - Connect "SUS" to "AS".  
    - Final server tasks.

36. **Add FTP node "SDV1":**  
    - Connect "AS" to "SDV1".  
    - Final FTP before cloud upload.

37. **Add Google Drive node "StoreVideo":**  
    - Connect "SDV" and "SDV1" to "StoreVideo".  
    - Configure Google OAuth2 credentials.

38. **Add SSH node "CleanUp":**  
    - Connect "StoreVideo" to "CleanUp".  
    - Cleanup temporary files on server.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                   | Context or Link                                      |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| The workflow integrates Whisper ASR for accurate speech-to-text transcription, OpenAI for text generation and translation, and FFmpeg via SSH for video editing. | Core technology stack                                |
| Requires proper SSH access and credentials to the remote server where video processing commands execute.                                                       | Server setup requirement                             |
| Google Drive node requires OAuth2 credentials for file storage and sharing.                                                                                     | Cloud file storage setup                             |
| OpenAI LangChain node usage implies subscription and API key management for text processing capabilities.                                                      | OpenAI API subscription                             |
| FTP nodes require reliable FTP server access with proper directory permissions.                                                                                 | FTP server requirement                              |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.