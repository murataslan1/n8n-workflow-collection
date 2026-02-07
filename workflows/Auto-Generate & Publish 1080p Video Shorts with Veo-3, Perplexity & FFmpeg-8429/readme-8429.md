Auto-Generate & Publish 1080p Video Shorts with Veo-3, Perplexity & FFmpeg

https://n8nworkflows.xyz/workflows/auto-generate---publish-1080p-video-shorts-with-veo-3--perplexity---ffmpeg-8429


# Auto-Generate & Publish 1080p Video Shorts with Veo-3, Perplexity & FFmpeg

### 1. Workflow Overview

This workflow automates the generation and publishing of 1080p video shorts by orchestrating AI-powered content ideation, video generation, editing, and uploading to YouTube. It is designed for content creators or marketers looking to streamline short video production using advanced language models, video generation APIs, and multimedia processing tools.

The workflow’s logic is divided into the following blocks:

- **1.1 Scheduled Trigger & Topic Initialization:** Periodically triggers the workflow and sets initial parameters including filenames and video topics.
- **1.2 AI-Powered Video Idea Generation:** Uses the Perplexity node and Google Gemini language model to generate structured video ideas and prompts.
- **1.3 Video Generation API Integration:** Sends prompts to a video generation service, waits for completion, and retrieves the generated video.
- **1.4 Video Downloading & Editing:** Downloads the generated video, writes it to disk, edits it via FFmpeg command execution.
- **1.5 Notification & Upload:** Reads the final edited video, sends a Telegram notification, and uploads the video to YouTube.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Topic Initialization

**Overview:**  
This initial block triggers the workflow on a schedule and sets foundational variables such as filenames and video topic placeholders, preparing for content ideation.

**Nodes Involved:**  
- Schedule Trigger  
- Filenames + topic  

**Node Details:**  

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow at predefined intervals (configuration unspecified, assumed periodic).  
  - Inputs: None (trigger only)  
  - Outputs: Connects to "Filenames + topic" node.  
  - Edge Cases: Misconfigured schedule could cause missed runs or excessive triggering.

- **Filenames + topic**  
  - Type: Set Node  
  - Role: Defines and initializes variables including filenames and video topic for downstream use.  
  - Configuration: Presumably sets variables used for Perplexity query and video naming; exact parameters not detailed.  
  - Inputs: From Schedule Trigger  
  - Outputs: Connects to "Video Idea" node.  
  - Edge Cases: Missing or incorrect variable setup would propagate errors downstream.

---

#### 2.2 AI-Powered Video Idea Generation

**Overview:**  
Generates video ideas using Perplexity AI, then refines and structures the output via Google Gemini Chat Model and Structured Output Parser, culminating in a prompt for video generation.

**Nodes Involved:**  
- Video Idea (Perplexity)  
- Google Gemini Chat Model  
- Structured Output Parser1  
- Prompt & Text Agent  

**Node Details:**  

- **Video Idea**  
  - Type: Perplexity (AI Search & Content Generation)  
  - Role: Queries Perplexity AI to generate creative video ideas based on initialized topics.  
  - Configuration: Query parameters presumably utilize variables set in "Filenames + topic".  
  - Inputs: From "Filenames + topic"  
  - Outputs: Connects to "Prompt & Text Agent".  
  - Edge Cases: API rate limits, connectivity issues, or empty responses.

- **Google Gemini Chat Model**  
  - Type: Langchain AI Language Model Node  
  - Role: Processes AI-generated text further to create refined prompts.  
  - Configuration: Uses Google Gemini as the language model.  
  - Inputs: Connected as AI language model input to "Prompt & Text Agent".  
  - Outputs: Feeds AI processing to "Prompt & Text Agent".  
  - Edge Cases: Authentication errors, quota limits, model downtime.

- **Structured Output Parser1**  
  - Type: Langchain Output Parser  
  - Role: Parses AI responses to structured formats for reliable downstream processing.  
  - Configuration: Structured parser applied to output from Google Gemini to format prompt data.  
  - Inputs: AI output from Google Gemini.  
  - Outputs: Feeds parsed data to "Prompt & Text Agent".  
  - Edge Cases: Parsing failures if AI output format changes.

- **Prompt & Text Agent**  
  - Type: Langchain Agent  
  - Role: Orchestrates AI interactions, combines inputs, and produces final prompt for video generation API.  
  - Configuration: Receives AI model and parser inputs, produces formatted prompt.  
  - Inputs: From "Video Idea", "Google Gemini Chat Model", and "Structured Output Parser1".  
  - Outputs: Connects to "Start Videogeneration".  
  - Edge Cases: Expression or logic errors in prompt assembly.

---

#### 2.3 Video Generation API Integration

**Overview:**  
Starts the video generation job via HTTP request, waits asynchronously for completion, and polls for status until the video is ready.

**Nodes Involved:**  
- Start Videogeneration  
- Wait until Videogeneration  
- Get Videogeneration  
- Videogeneration finished (If)  

**Node Details:**  

- **Start Videogeneration**  
  - Type: HTTP Request  
  - Role: Submits the video generation job to an external API using the prompt from the agent.  
  - Configuration: POST request with body containing prompt and parameters; details unspecified.  
  - Inputs: From "Prompt & Text Agent"  
  - Outputs: Connects to "Wait until Videogeneration".  
  - Edge Cases: API errors, authentication failures, malformed requests.

- **Wait until Videogeneration**  
  - Type: Wait Node  
  - Role: Pauses workflow execution to allow video generation to process asynchronously.  
  - Configuration: Wait duration or webhook wait for status; uses a webhook ID indicating asynchronous continuation.  
  - Inputs: From "Start Videogeneration" and "Videogeneration finished" (fail branch).  
  - Outputs: Connects to "Get Videogeneration".  
  - Edge Cases: Timeout if video generation exceeds wait period.

- **Get Videogeneration**  
  - Type: HTTP Request  
  - Role: Polls the video generation API to check the current status of the job.  
  - Configuration: GET request to status endpoint with job ID.  
  - Inputs: From "Wait until Videogeneration"  
  - Outputs: Connects to "Videogeneration finished".  
  - Edge Cases: Network errors, inconsistent job status responses.

- **Videogeneration finished**  
  - Type: If Node  
  - Role: Conditional branching based on video generation completion status.  
  - Configuration: Checks if the job is finished; if yes, proceeds to downloading, else loops back to waiting.  
  - Inputs: From "Get Videogeneration"  
  - Outputs:  
    - True branch: "Download Video"  
    - False branch: "Wait until Videogeneration"  
  - Edge Cases: Incorrect status parsing, infinite loops if job never completes.

---

#### 2.4 Video Downloading & Editing

**Overview:**  
Downloads the completed video, writes it to disk, and applies video editing commands (likely via FFmpeg) for final formatting or trimming.

**Nodes Involved:**  
- Download Video  
- Write Video on Disk  
- Edit Video  
- Read finished Video  

**Node Details:**  

- **Download Video**  
  - Type: HTTP Request  
  - Role: Fetches the generated video file from the API endpoint.  
  - Configuration: GET request to the video file URL received from the generation API.  
  - Inputs: From "Videogeneration finished" (true branch)  
  - Outputs: Connects to "Write Video on Disk".  
  - Edge Cases: Download interruptions, file corruption.

- **Write Video on Disk**  
  - Type: Read/Write File  
  - Role: Saves the downloaded video binary data to local disk storage.  
  - Configuration: Writes to a specified file path; path likely uses variables for naming.  
  - Inputs: From "Download Video"  
  - Outputs: Connects to "Edit Video".  
  - Edge Cases: Disk write permission errors, storage full.

- **Edit Video**  
  - Type: Execute Command  
  - Role: Runs command-line tool (likely FFmpeg) to edit video (e.g., resizing, trimming).  
  - Configuration: Command and parameters for video processing; expected to produce final edited video file.  
  - Inputs: From "Write Video on Disk"  
  - Outputs: Connects to "Read finished Video".  
  - Edge Cases: Command failure, invalid parameters, missing FFmpeg installation.

- **Read finished Video**  
  - Type: Read/Write File  
  - Role: Reads the final edited video file from disk into the workflow for further use.  
  - Configuration: Reads the output file path from "Edit Video".  
  - Inputs: From "Edit Video"  
  - Outputs: Connects to "Send Notification" and "Upload a video".  
  - Edge Cases: File not found, read permission errors.

---

#### 2.5 Notification & Upload

**Overview:**  
Sends a Telegram notification about the video completion and uploads the final video short to YouTube.

**Nodes Involved:**  
- Send Notification  
- Upload a video  

**Node Details:**  

- **Send Notification**  
  - Type: Telegram Node  
  - Role: Sends a message to a configured Telegram chat or user notifying about the video readiness.  
  - Configuration: Uses Telegram credentials, message content likely includes video topic and status.  
  - Inputs: From "Read finished Video"  
  - Outputs: None (end of notification path).  
  - Edge Cases: Telegram API limits, chat ID misconfiguration.

- **Upload a video**  
  - Type: YouTube Node  
  - Role: Uploads the final video file to a YouTube channel.  
  - Configuration: Uses YouTube OAuth2 credentials, video metadata set by workflow variables (e.g., title, description).  
  - Inputs: From "Read finished Video"  
  - Outputs: None (terminal node).  
  - Edge Cases: Upload failures, quota exceeded, invalid video metadata.

---

### 3. Summary Table

| Node Name                | Node Type                        | Functional Role                     | Input Node(s)               | Output Node(s)                  | Sticky Note        |
|--------------------------|---------------------------------|-----------------------------------|-----------------------------|---------------------------------|--------------------|
| Schedule Trigger         | Schedule Trigger                 | Initiates workflow periodically   | -                           | Filenames + topic               |                    |
| Filenames + topic        | Set                             | Initializes filenames and topics  | Schedule Trigger            | Video Idea                     |                    |
| Video Idea               | Perplexity                      | Generates video ideas              | Filenames + topic           | Prompt & Text Agent            |                    |
| Google Gemini Chat Model | Langchain LM Chat               | Refines AI-generated text          | - (AI model input)          | Prompt & Text Agent (AI input) |                    |
| Structured Output Parser1| Langchain Output Parser         | Parses AI output to structured    | Google Gemini Chat Model    | Prompt & Text Agent (parser)   |                    |
| Prompt & Text Agent      | Langchain Agent                 | Combines AI inputs for prompt     | Video Idea, Google Gemini, Structured Output Parser1 | Start Videogeneration |                    |
| Start Videogeneration    | HTTP Request                   | Starts video generation job       | Prompt & Text Agent         | Wait until Videogeneration      |                    |
| Wait until Videogeneration| Wait                           | Waits asynchronously for video    | Start Videogeneration, Videogeneration finished (fail) | Get Videogeneration           |                    |
| Get Videogeneration      | HTTP Request                   | Polls video generation status     | Wait until Videogeneration  | Videogeneration finished        |                    |
| Videogeneration finished | If                             | Checks if video generation done   | Get Videogeneration         | Download Video (true), Wait until Videogeneration (false) |                    |
| Download Video           | HTTP Request                   | Downloads generated video         | Videogeneration finished    | Write Video on Disk             |                    |
| Write Video on Disk      | Read/Write File                | Saves video to local disk          | Download Video              | Edit Video                    |                    |
| Edit Video               | Execute Command                | Edits video via FFmpeg             | Write Video on Disk         | Read finished Video            |                    |
| Read finished Video      | Read/Write File                | Reads edited video from disk       | Edit Video                  | Send Notification, Upload a video |                    |
| Send Notification        | Telegram                       | Sends Telegram notification        | Read finished Video         | -                             |                    |
| Upload a video           | YouTube                       | Uploads final video to YouTube     | Read finished Video         | -                             |                    |
| Sticky Note2             | Sticky Note                   | (Empty content)                    | -                           | -                             |                    |
| Sticky Note3             | Sticky Note                   | (Empty content)                    | -                           | -                             |                    |
| Sticky Note4             | Sticky Note                   | (Empty content)                    | -                           | -                             |                    |
| Sticky Note5             | Sticky Note                   | (Empty content)                    | -                           | -                             |                    |
| Sticky Note6             | Sticky Note                   | (Empty content)                    | -                           | -                             |                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Configure scheduling parameters (e.g., daily, hourly) as desired.  
   - Position: Start of workflow.

2. **Add a Set node named "Filenames + topic"**  
   - Initialize variables such as video filenames and topic placeholders (e.g., `topic`, `filename`, `outputPath`).  
   - Connect "Schedule Trigger" output to this node.

3. **Add a Perplexity node named "Video Idea"**  
   - Configure to query Perplexity AI with the topic variable for video idea generation.  
   - Input: Connect from "Filenames + topic".  
   - Ensure API credentials are set up in n8n.

4. **Add a Langchain Google Gemini Chat Model node**  
   - Configure with valid Google Gemini credentials.  
   - No direct input connections; it will be used as AI language model input for the agent.

5. **Add a Langchain Structured Output Parser node named "Structured Output Parser1"**  
   - Configure to parse expected AI outputs into structured JSON or defined format.

6. **Add a Langchain Agent node named "Prompt & Text Agent"**  
   - Connect AI language model input from "Google Gemini Chat Model".  
   - Connect AI output parser input from "Structured Output Parser1".  
   - Connect data input from "Video Idea".  
   - Configure to combine inputs and output a prompt suitable for video generation API.

7. **Add an HTTP Request node named "Start Videogeneration"**  
   - Configure POST request to video generation API endpoint.  
   - Body includes prompt from "Prompt & Text Agent".  
   - Set authentication as required by API.

8. **Add a Wait node named "Wait until Videogeneration"**  
   - Configure wait duration or webhook wait with a webhook ID to pause until the video generation completes asynchronously.  
   - Connect from "Start Videogeneration".

9. **Add an HTTP Request node named "Get Videogeneration"**  
   - Configure GET request to poll video generation status using job ID returned by "Start Videogeneration".  
   - Connect from "Wait until Videogeneration".

10. **Add an If node named "Videogeneration finished"**  
    - Configure condition to check if video generation status equals finished.  
    - Connect from "Get Videogeneration".  
    - True branch connects to "Download Video".  
    - False branch loops back to "Wait until Videogeneration".

11. **Add an HTTP Request node named "Download Video"**  
    - Configure GET request to download video file URL obtained from video generation API.  
    - Connect from "Videogeneration finished" (true branch).

12. **Add a Read/Write File node named "Write Video on Disk"**  
    - Configure to write binary data of downloaded video to disk path (e.g., `/tmp/{{filename}}.mp4`).  
    - Connect from "Download Video".

13. **Add an Execute Command node named "Edit Video"**  
    - Configure command line to run FFmpeg for video editing, e.g.:  
      ```
      ffmpeg -i /tmp/{{filename}}.mp4 -vf scale=1920:1080 -c:a copy /tmp/{{filename}}_edited.mp4
      ```  
    - Connect from "Write Video on Disk".  
    - Ensure FFmpeg is installed on the host system.

14. **Add a Read/Write File node named "Read finished Video"**  
    - Configure to read the edited video file from disk.  
    - Connect from "Edit Video".

15. **Add a Telegram node named "Send Notification"**  
    - Configure Telegram bot credentials.  
    - Set message content to notify about video readiness (e.g., "Your video '{{topic}}' is ready.").  
    - Connect from "Read finished Video".

16. **Add a YouTube node named "Upload a video"**  
    - Configure OAuth2 credentials for YouTube channel.  
    - Set video title, description, tags using workflow variables.  
    - Connect from "Read finished Video".

17. **Verify node connections and credentials**  
    - Make sure all external APIs have valid credentials configured in n8n.  
    - Test each block independently for error handling.

---

### 5. General Notes & Resources

| Note Content                                                                                                                  | Context or Link                              |
|-------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------|
| Workflow leverages FFmpeg for video editing; ensure FFmpeg is installed and accessible on n8n execution environment.          | FFmpeg: https://ffmpeg.org/                   |
| Uses Google Gemini language model via Langchain nodes for advanced AI prompt refinement.                                       | Google Gemini API documentation               |
| Perplexity node serves as content idea generation AI, requires Perplexity API credentials.                                     | Perplexity AI API                             |
| Telegram notifications require bot token and chat ID configuration.                                                           | Telegram Bot API: https://core.telegram.org/bots/api |
| YouTube node requires OAuth2 credentials with upload scope enabled.                                                           | YouTube Data API v3: https://developers.google.com/youtube/v3 |
| Workflow is designed to handle asynchronous video generation via polling and wait nodes to avoid premature downloads.         | n8n Wait node documentation                    |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.