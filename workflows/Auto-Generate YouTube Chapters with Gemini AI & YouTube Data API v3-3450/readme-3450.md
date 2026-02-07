Auto-Generate YouTube Chapters with Gemini AI & YouTube Data API v3

https://n8nworkflows.xyz/workflows/auto-generate-youtube-chapters-with-gemini-ai---youtube-data-api-v3-3450


# Auto-Generate YouTube Chapters with Gemini AI & YouTube Data API v3

### 1. Workflow Overview

This workflow automates the generation of timestamped YouTube video chapters by leveraging the YouTube Data API v3 and Google Gemini 1.5 Flash AI. It fetches video metadata and captions, processes the transcript to identify logical chapters, and updates the video description with these chapters to enhance viewer navigation and SEO.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Manual trigger and setting the target YouTube video ID.
- **1.2 Video Metadata Retrieval**: Fetching video details such as title and description.
- **1.3 Caption Acquisition**: Retrieving the caption track ID and downloading the SRT transcript.
- **1.4 Transcript Processing & Chapter Generation**: Extracting text from the SRT file, analyzing it with Google Gemini AI to generate structured chapters.
- **1.5 Description Update**: Appending the generated chapters to the video description via the YouTube API.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block initiates the workflow manually and sets the YouTube video ID to process.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Set Video ID

- **Node Details:**  

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Starts the workflow on user command.  
    - Configuration: No parameters; triggers workflow execution.  
    - Inputs: None  
    - Outputs: Triggers the next node.  
    - Edge Cases: None typical; user must trigger manually.

  - **Set Video ID**  
    - Type: Set  
    - Role: Defines the target YouTube video ID as a workflow variable.  
    - Configuration: Sets a string variable `video_id` with a hardcoded value (e.g., `r1wqsrW2vmE`).  
    - Inputs: Trigger from Manual Trigger node.  
    - Outputs: Passes `video_id` to downstream nodes.  
    - Edge Cases: Incorrect or missing video ID will cause downstream API calls to fail.

---

#### 1.2 Video Metadata Retrieval

- **Overview:**  
  Retrieves metadata for the specified video, including title and description, to use in later steps.

- **Nodes Involved:**  
  - Get Video Meta Data

- **Node Details:**  

  - **Get Video Meta Data**  
    - Type: YouTube API node  
    - Role: Fetches video details using the YouTube Data API v3.  
    - Configuration:  
      - Resource: `video`  
      - Operation: `get`  
      - Video ID: Uses expression `={{ $json.video_id }}` from Set Video ID node.  
    - Inputs: Receives `video_id` from Set Video ID node.  
    - Outputs: Video metadata JSON including snippet with title, description, category, etc.  
    - Credentials: Uses OAuth2 credentials for YouTube API.  
    - Edge Cases:  
      - Invalid video ID or permissions may cause 404 or auth errors.  
      - API quota limits may cause request failures.

---

#### 1.3 Caption Acquisition

- **Overview:**  
  Fetches the caption track ID for the video and downloads the corresponding SRT transcript.

- **Nodes Involved:**  
  - Get Caption ID  
  - Get Captions  
  - Extract Captions

- **Node Details:**  

  - **Get Caption ID**  
    - Type: HTTP Request  
    - Role: Calls YouTube Data API to list caption tracks for the video.  
    - Configuration:  
      - URL: `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId={{ $json.id }}`  
      - Authentication: Uses predefined YouTube OAuth2 credentials.  
    - Inputs: Receives video metadata JSON, extracts video ID from `$json.id`.  
    - Outputs: JSON containing caption track IDs and metadata.  
    - Edge Cases:  
      - Video may have no captions, resulting in empty items array.  
      - API errors or auth failures possible.

  - **Get Captions**  
    - Type: HTTP Request  
    - Role: Downloads the SRT caption file using the caption ID obtained.  
    - Configuration:  
      - URL: `https://www.googleapis.com/youtube/v3/captions/{{ $json.items[0].id }}?tfmt=srt`  
      - Authentication: YouTube OAuth2 credentials.  
    - Inputs: Caption ID from previous node’s output.  
    - Outputs: Raw SRT caption text.  
    - Edge Cases:  
      - Caption ID missing or invalid causes failure.  
      - Captions may not be in SRT format or may be empty.

  - **Extract Captions**  
    - Type: Extract From File  
    - Role: Extracts text content from the downloaded SRT file.  
    - Configuration: Operation set to `text` to extract raw text.  
    - Inputs: SRT file content from Get Captions node.  
    - Outputs: Plain text transcript for AI processing.  
    - Edge Cases:  
      - Malformed SRT files may cause extraction errors.

---

#### 1.4 Transcript Processing & Chapter Generation

- **Overview:**  
  Processes the extracted transcript with Google Gemini AI to classify and generate timestamped chapters, then parses the AI output into structured JSON.

- **Nodes Involved:**  
  - Tag Chapters in Description  
  - Google Gemini Chat Model  
  - Structured Captions

- **Node Details:**  

  - **Tag Chapters in Description**  
    - Type: Chain LLM (Language Model Chain)  
    - Role: Sends the transcript text to the AI model with a prompt to classify it into chapters.  
    - Configuration:  
      - Prompt includes instructions to classify SRT data into chapters with timestamps.  
      - Uses expression to insert transcript text `{{ $json.data }}`.  
      - Output parser enabled to handle structured response.  
    - Inputs: Transcript text from Extract Captions node.  
    - Outputs: AI-generated chapter data in JSON format.  
    - Edge Cases:  
      - AI may produce malformed or incomplete chapter data.  
      - Prompt sensitivity may affect output quality.

  - **Google Gemini Chat Model**  
    - Type: Google Gemini Chat Model (Langchain)  
    - Role: Language model node that processes the prompt and transcript to generate chapters.  
    - Configuration:  
      - Model: `models/gemini-1.5-flash-8b-exp-0924`  
      - Credentials: Google Palm API key for Gemini access.  
    - Inputs: Receives prompt and transcript from Tag Chapters in Description node.  
    - Outputs: Raw AI response passed to output parser.  
    - Edge Cases:  
      - API key or quota issues may cause failures.  
      - Latency or timeouts possible.

  - **Structured Captions**  
    - Type: Output Parser Structured (Langchain)  
    - Role: Parses AI output into a structured JSON schema for chapters.  
    - Configuration: Example JSON schema provided to guide parsing.  
    - Inputs: AI raw output from Google Gemini Chat Model.  
    - Outputs: Clean JSON with chapter timestamps and titles.  
    - Edge Cases:  
      - Parsing errors if AI output deviates from expected format.

---

#### 1.5 Description Update

- **Overview:**  
  Updates the YouTube video description by appending the generated chapters to improve navigation and SEO.

- **Nodes Involved:**  
  - Update Chapters

- **Node Details:**  

  - **Update Chapters**  
    - Type: YouTube API node  
    - Role: Updates the video’s description field with appended chapter information.  
    - Configuration:  
      - Resource: `video`  
      - Operation: `update`  
      - Video ID: Extracted from the caption data JSON path.  
      - Title: Pulled from video metadata node to preserve original title.  
      - Category ID and Region Code set (e.g., categoryId: 22, regionCode: US).  
      - Description field updated by appending AI-generated chapters.  
    - Inputs: Receives structured chapter JSON from Tag Chapters in Description node.  
    - Outputs: Confirmation of update or error response.  
    - Credentials: YouTube OAuth2 credentials.  
    - Edge Cases:  
      - API quota limits or permission errors may block update.  
      - Description length limits may truncate content.

---

### 3. Summary Table

| Node Name                  | Node Type                          | Functional Role                       | Input Node(s)               | Output Node(s)               | Sticky Note                                                                 |
|----------------------------|----------------------------------|------------------------------------|-----------------------------|-----------------------------|----------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                   | Initiates workflow manually         |                             | Set Video ID                 |                                                                            |
| Set Video ID               | Set                              | Sets target YouTube video ID        | When clicking ‘Test workflow’ | Get Video Meta Data          |                                                                            |
| Get Video Meta Data        | YouTube API                      | Fetches video metadata               | Set Video ID                 | Get Caption ID               |                                                                            |
| Get Caption ID             | HTTP Request                    | Retrieves caption track ID           | Get Video Meta Data          | Get Captions                | ## Get Captions                                                             |
| Get Captions               | HTTP Request                    | Downloads SRT captions               | Get Caption ID               | Extract Captions             | ## Get Captions                                                             |
| Extract Captions           | Extract From File                | Extracts text from SRT file          | Get Captions                 | Tag Chapters in Description  | ## Get Captions                                                             |
| Tag Chapters in Description | Chain LLM                      | Generates chapters from transcript   | Extract Captions             | Update Chapters              | ## Generate Chapters                                                        |
| Google Gemini Chat Model   | Google Gemini Chat Model (Langchain) | AI model processing transcript       | Tag Chapters in Description  | Tag Chapters in Description (ai_languageModel) | ## Generate Chapters                                                        |
| Structured Captions        | Output Parser Structured (Langchain) | Parses AI output into structured JSON | Google Gemini Chat Model     | Tag Chapters in Description (ai_outputParser) | ## Generate Chapters                                                        |
| Update Chapters            | YouTube API                      | Updates video description with chapters | Tag Chapters in Description  |                             | ## Update Description                                                       |
| Sticky Note                | Sticky Note                     | Visual note for Get Captions block  |                             |                             | ## Get Captions                                                             |
| Sticky Note1               | Sticky Note                     | Visual note for Generate Chapters block |                             |                             | ## Generate Chapters                                                        |
| Sticky Note2               | Sticky Note                     | Visual note for Update Description block |                             |                             | ## Update Description                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add a **Manual Trigger** node named `When clicking ‘Test workflow’`. No parameters needed.

2. **Add Set Node to Define Video ID**  
   - Add a **Set** node named `Set Video ID`.  
   - Configure to assign a string variable `video_id` with the YouTube video ID (e.g., `r1wqsrW2vmE`).  
   - Connect output of Manual Trigger to this node.

3. **Add YouTube API Node to Get Video Metadata**  
   - Add a **YouTube** node named `Get Video Meta Data`.  
   - Set resource to `video` and operation to `get`.  
   - Set `videoId` parameter to expression `={{ $json.video_id }}`.  
   - Connect output of `Set Video ID` to this node.  
   - Configure YouTube OAuth2 credentials.

4. **Add HTTP Request Node to Get Caption ID**  
   - Add an **HTTP Request** node named `Get Caption ID`.  
   - Set URL to:  
     `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId={{ $json.id }}`  
   - Use YouTube OAuth2 credentials.  
   - Connect output of `Get Video Meta Data` to this node.

5. **Add HTTP Request Node to Download Captions**  
   - Add an **HTTP Request** node named `Get Captions`.  
   - Set URL to:  
     `https://www.googleapis.com/youtube/v3/captions/{{ $json.items[0].id }}?tfmt=srt`  
   - Use YouTube OAuth2 credentials.  
   - Connect output of `Get Caption ID` to this node.

6. **Add Extract From File Node to Extract Text**  
   - Add an **Extract From File** node named `Extract Captions`.  
   - Set operation to `text` to extract raw transcript text.  
   - Connect output of `Get Captions` to this node.

7. **Add Chain LLM Node for Chapter Tagging**  
   - Add a **Chain LLM** node named `Tag Chapters in Description`.  
   - Configure prompt to instruct AI to classify the SRT transcript into timestamped chapters, e.g.:  
     ```
     This is an srt format data. please classify this data into chapters
     based upon this transcript 
     {{ $json.data }}
     {
     "description":"00:00 Introduction
     02:15 Topic One
     05:30 Topic Two
     10:45 Conclusion"
     }
     ```  
   - Enable output parser.  
   - Connect output of `Extract Captions` to this node.

8. **Add Google Gemini Chat Model Node**  
   - Add a **Google Gemini Chat Model** node named `Google Gemini Chat Model`.  
   - Set model name to `models/gemini-1.5-flash-8b-exp-0924`.  
   - Configure Google Palm API credentials for Gemini access.  
   - Connect `Tag Chapters in Description` node’s AI language model input to this node.

9. **Add Output Parser Structured Node**  
   - Add an **Output Parser Structured** node named `Structured Captions`.  
   - Provide a JSON schema example to parse AI output into structured chapters.  
   - Connect AI output from `Google Gemini Chat Model` to this node’s AI output parser input.

10. **Connect Structured Captions Output Back to Chain LLM Node**  
    - Connect output parser node back to `Tag Chapters in Description` node’s AI output parser input to complete the chain.

11. **Add YouTube API Node to Update Video Description**  
    - Add a **YouTube** node named `Update Chapters`.  
    - Set resource to `video` and operation to `update`.  
    - Set `videoId` to expression referencing caption data video ID: `={{ $('Get Captions').item.json.items[0].snippet.videoId }}`.  
    - Set `title` to original video title from `Get Video Meta Data` node: `={{ $('Get Video Meta Data').item.json.snippet.title }}`.  
    - Set `categoryId` to `22` and `regionCode` to `US`.  
    - Update description field by appending AI-generated chapters:  
      ```
      ={{ $json.output.description }}
      Chapters
      {{ $json.output.description }}
      ```  
    - Connect output of `Tag Chapters in Description` to this node.  
    - Use YouTube OAuth2 credentials.

12. **Add Sticky Notes for Visual Grouping (Optional)**  
    - Add sticky notes to group nodes visually:  
      - "Get Captions" covering `Get Caption ID`, `Get Captions`, `Extract Captions`.  
      - "Generate Chapters" covering `Tag Chapters in Description`, `Google Gemini Chat Model`, `Structured Captions`.  
      - "Update Description" covering `Update Chapters`.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow uses YouTube Data API v3 and Google Gemini 1.5 Flash AI for transcript analysis and chapter generation. | Workflow description and prerequisites section.                                                |
| YouTube API OAuth2 setup requires creating a Google Cloud Project, enabling API, and configuring OAuth consent. | https://console.cloud.google.com/                                                              |
| Google Gemini API access requires API key for model `gemini-1.5-flash-8b-exp-0924`.                  | API key must be configured in n8n credentials for Google Palm API.                             |
| Chapters improve viewer navigation, reduce drop-off, and enhance SEO by structuring video descriptions. | Value proposition section of the workflow description.                                         |
| Workflow assumes captions exist and are accessible in SRT format for the target video.               | Edge cases include missing captions or unsupported formats.                                    |
| YouTube API quota limits and permission scopes may affect workflow execution success.                | Consider quota monitoring and error handling in production use.                                |
| For detailed YouTube API documentation, refer to:                                                  | https://developers.google.com/youtube/v3                                                        |
| For Google Gemini API and Langchain integration details, refer to:                                  | https://developers.generativeai.google/                                                        |

---

This document fully describes the workflow structure, node configurations, and reproduction steps to enable advanced users or AI agents to understand, modify, or recreate the workflow without access to the original JSON.