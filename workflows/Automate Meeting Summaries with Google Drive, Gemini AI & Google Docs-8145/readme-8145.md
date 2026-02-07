Automate Meeting Summaries with Google Drive, Gemini AI & Google Docs

https://n8nworkflows.xyz/workflows/automate-meeting-summaries-with-google-drive--gemini-ai---google-docs-8145


# Automate Meeting Summaries with Google Drive, Gemini AI & Google Docs

### 1. Workflow Overview

This workflow automates the generation of concise, structured meeting summaries from audio/video files uploaded to a specific Google Drive folder. It is designed for teams or organizations that record meetings and want to automatically transcribe, summarize, and document key discussion points and action items in Google Docs without manual effort.

The workflow is logically grouped into the following blocks:

- **1.1 Input Reception and File Download**  
  Watches a designated Google Drive folder for new meeting audio/video files and downloads them.

- **1.2 Audio Transcription with AI**  
  Uses Google Gemini AI to transcribe the downloaded audio/video file into text.

- **1.3 AI Summarization and Structured Output**  
  Processes the transcript with a Gemini Agent AI to produce a formatted meeting summary and generate or identify a Google Doc for storing the summary. The output is structured JSON.

- **1.4 Document Creation and Formatting**  
  Creates the Google Doc (if not existing), applies rich text formatting including bullets, bold, italics, and inserts the summary content.

- **1.5 Final Output Delivery**  
  Sends the formatted summary to the Google Doc via Google Docs API batchUpdate.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and File Download

- **Overview:**  
  This block detects when new meeting files (audio/video) are created in a specific Google Drive folder and downloads the file for further processing.

- **Nodes Involved:**  
  - Execute when new file created of meeting of audio/video (Google Drive Trigger)  
  - Download that crated meeting file (Google Drive)

- **Node Details:**

  1. **Execute when new file created of meeting of audio/video**  
     - Type: Google Drive Trigger  
     - Role: Watches a specific Google Drive folder for new files.  
     - Configuration:  
       - Trigger event: fileCreated  
       - Polling interval: every minute  
       - Folder watched: Folder ID "1EongmFhQf1avt1jamhV6aO6MIORrzNvT" (named “Speech of Meetings”)  
       - File type: all (audio/video files)  
     - Input: Triggered by file creation event  
     - Output: Metadata about the newly created file, including webViewLink  
     - Edge cases:  
       - Network or API rate limits could delay or miss triggers  
       - Files with unsupported formats might cause downstream errors  

  2. **Download that crated meeting file**  
     - Type: Google Drive (Download operation)  
     - Role: Downloads the file identified by the trigger node for transcription  
     - Configuration:  
       - fileId: dynamically set from the trigger node’s webViewLink URL (resolves to file ID)  
       - Operation: download  
     - Credentials: Google Drive OAuth2  
     - Input: File metadata from trigger  
     - Output: Binary file data (audio/video)  
     - Edge cases:  
       - File access permissions errors  
       - Large file download timeouts  

---

#### 2.2 Audio Transcription with AI

- **Overview:**  
  This block transcribes the downloaded meeting audio/video file into raw text using Google Gemini AI’s speech-to-text capabilities.

- **Nodes Involved:**  
  - Transcribe that file into text (Google Gemini Audio Model)

- **Node Details:**

  1. **Transcribe that file into text**  
     - Type: Langchain Google Gemini (Audio resource)  
     - Role: Converts audio/video binary into text transcript  
     - Configuration:  
       - Model: "models/gemini-2.5-flash" (Google Gemini voice transcription model)  
       - Resource type: audio  
       - Input type: binary (the downloaded file)  
     - Credentials: Google Palm API (Google Gemini)  
     - Input: Binary audio/video data from Download node  
     - Output: JSON containing transcript text in `content.parts[0].text`  
     - Edge cases:  
       - Audio quality affecting transcription accuracy  
       - API quota or throttling errors  
       - Unsupported audio codecs causing processing failure  

---

#### 2.3 AI Summarization and Structured Output

- **Overview:**  
  This block summarizes the raw transcript into clear, actionable meeting notes, structuring the output JSON with summary text and document ID.

- **Nodes Involved:**  
  - Summerizer of that text (Langchain Gemini Agent)  
  - Structured Output Parser (Langchain Output Parser Structured)  
  - Crate a Summary Docs (Google Docs Tool)

- **Node Details:**

  1. **Summerizer of that text**  
     - Type: Langchain Agent (Google Gemini agent)  
     - Role: Reads transcript text, extracts key discussion points and action items, formats summary and generates or references a Google Doc ID  
     - Configuration:  
       - Text source: transcript text from Transcribe node (`{{$json.content.parts[0].text}}`)  
       - System message prompts the agent to:  
         - Extract main discussion points concisely  
         - Use bullet points (✦) for discussions and checkmarks (✓) for tasks  
         - Create a Google Doc if none exists  
         - Format title with current date and structured sections  
       - Output parser enabled for structured JSON response  
     - Input: Transcript text  
     - Output: JSON with keys `summary_text` and `doc_id`  
     - Edge cases:  
       - AI misunderstanding transcript context  
       - Missing or malformed output JSON  
       - API errors or latency  

  2. **Structured Output Parser**  
     - Type: Langchain Output Parser Structured  
     - Role: Validates and parses AI output into JSON schema ensuring presence of `summary_text` and `doc_id`  
     - Configuration:  
       - Schema example provided for validation  
     - Input: Raw AI output from Summerizer node  
     - Output: Parsed JSON object  
     - Edge cases:  
       - Parsing failure if AI output deviates from schema  
       - Missing keys or invalid types  

  3. **Crate a Summary Docs**  
     - Type: Google Docs Tool (creation)  
     - Role: Creates a new Google Doc titled after the meeting file name (removes .mp4 extension) if no existing doc is found  
     - Configuration:  
       - Title: derived from trigger file name (removes `.mp4` suffix)  
       - Folder: default (root or preset folder in Google Docs)  
     - Credentials: Google Docs OAuth2  
     - Input: Trigger node file metadata (for name)  
     - Output: Google Doc metadata (ID etc.)  
     - Edge cases:  
       - Permission errors creating docs  
       - Naming conflicts or invalid characters in title  

---

#### 2.4 Document Creation and Formatting

- **Overview:**  
  Formats the AI-generated summary text with rich text styles and bullets, preparing batch update requests for Google Docs API.

- **Nodes Involved:**  
  - Format Summary (Code node)

- **Node Details:**

  1. **Format Summary**  
     - Type: Code (JavaScript)  
     - Role: Parses summary text from AI, transforms markdown-like syntax to Google Docs API batchUpdate requests for formatting  
     - Configuration:  
       - Extracts bold (`**bold**`), italic (`*italic*`), bullet points (`✦`, `✓`, `-`)  
       - Builds an array of requests for:  
         - Inserting plain text  
         - Applying text styles (bold, italic)  
         - Creating paragraph bullets with circle/square style  
       - Normalizes line breaks and spacing  
     - Input: AI summary text from Summerizer node’s parsed output  
     - Output: JSON with `requests` array for Google Docs API  
     - Edge cases:  
       - Unexpected formatting characters causing parsing errors  
       - Large summaries hitting document size limits  

---

#### 2.5 Final Output Delivery

- **Overview:**  
  Sends the formatted summary to the created Google Doc using the Google Docs API batchUpdate method.

- **Nodes Involved:**  
  - Send Summary to created docs (HTTP Request)

- **Node Details:**

  1. **Send Summary to created docs**  
     - Type: HTTP Request  
     - Role: Calls Google Docs API to update the document with formatted summary content  
     - Configuration:  
       - URL: `https://docs.googleapis.com/v1/documents/{{ doc_id }}:batchUpdate` where `doc_id` comes from Summerizer output  
       - Method: POST  
       - Body parameters: JSON object containing `requests` array from Format Summary node  
       - Authentication: Google Docs OAuth2  
     - Credentials: Google Docs OAuth2  
     - Input: Formatted batchUpdate requests and doc ID  
     - Output: API response about document update  
     - Edge cases:  
       - API quota limits or authorization errors  
       - Batch update request malformed errors  
       - Document locked or deleted before update  

---

### 3. Summary Table

| Node Name                               | Node Type                           | Functional Role                               | Input Node(s)                               | Output Node(s)                              | Sticky Note                                                                                      |
|----------------------------------------|-----------------------------------|----------------------------------------------|---------------------------------------------|---------------------------------------------|------------------------------------------------------------------------------------------------|
| Execute when new file created of meeting of audio/video | Google Drive Trigger               | Detects new meeting files in Drive folder    | -                                           | Download that crated meeting file            | ### Summary Generation                                                                           |
| Download that crated meeting file       | Google Drive                      | Downloads triggered meeting audio/video file | Execute when new file created of meeting... | Transcribe that file into text                | ### Summary Generation                                                                           |
| Transcribe that file into text           | Langchain Google Gemini (Audio)  | Transcribes audio/video to text               | Download that crated meeting file            | Summerizer of that text                       | ### Summary Generation                                                                           |
| Summerizer of that text                  | Langchain Agent (Google Gemini)  | Summarizes transcript, generates summary + doc ID | Transcribe that file into text; Structured Output Parser; Google Gemini Chat Model | Format Summary                                | ### Summary Generation                                                                           |
| Structured Output Parser                 | Langchain Output Parser Structured | Parses AI output JSON structure               | Summerizer of that text                       | Summerizer of that text                       | ### Summary Generation                                                                           |
| Google Gemini Chat Model                 | Langchain LM Chat Google Gemini  | (Connected as language model for summarizer) | -                                           | Summerizer of that text                       | ### Summary Generation                                                                           |
| Crate a Summary Docs                     | Google Docs Tool                 | Creates Google Doc for meeting summary        | Execute when new file created of meeting... | Summerizer of that text                       | ### Summary Generation                                                                           |
| Format Summary                          | Code                             | Applies rich text formatting to summary      | Summerizer of that text                       | Send Summary to created docs                  | ### Docs Formatter & Sender                                                                     |
| Send Summary to created docs             | HTTP Request                    | Sends formatted summary to Google Doc API    | Format Summary                                | -                                           | ### Docs Formatter & Sender                                                                     |
| Sticky Note                             | Sticky Note                      | Visual grouping for summary generation block | -                                           | -                                           | ### Summary Generation                                                                           |
| Sticky Note1                            | Sticky Note                      | Visual grouping for Docs formatting & sending | -                                           | -                                           | ### Docs Formatter & Sender                                                                     |
| Sticky Note2                            | Sticky Note                      | Project overview, configuration, and features | -                                           | -                                           | # 🎤 AI Meeting Summary Generator with Google Docs Integration (Full description block)         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger Node**  
   - Type: Google Drive Trigger  
   - Configure:  
     - Event: `fileCreated`  
     - Polling: every minute  
     - Folder to watch: specify folder ID for meeting audio/video files (e.g., “Speech of Meetings” folder)  
     - File type: all  
   - Credentials: Google Drive OAuth2

2. **Add Google Drive Node to Download File**  
   - Type: Google Drive  
   - Operation: `download`  
   - File ID: set dynamically from trigger node’s `webViewLink` URL (extract file ID)  
   - Credentials: Google Drive OAuth2  
   - Connect from Trigger node

3. **Add Langchain Google Gemini Node for Transcription**  
   - Type: Langchain Google Gemini (Audio resource)  
   - Model ID: `models/gemini-2.5-flash`  
   - Resource: audio  
   - Input Type: binary (connect from download node binary output)  
   - Credentials: Google Palm API (Google Gemini)  

4. **Create Google Docs Tool Node to Create Summary Doc**  
   - Type: Google Docs Tool  
   - Title: Extract from trigger node file name, strip `.mp4` extension (e.g., expression: `{{$node["Execute when new file created of meeting of audio/video"].item.json.name.replace(/\.mp4$/, '')}}`)  
   - Folder: default or specify folder if needed  
   - Credentials: Google Docs OAuth2  
   - Connect from Drive Trigger node (for file name)

5. **Create Langchain Structured Output Parser Node**  
   - Type: Langchain Output Parser Structured  
   - JSON Schema Example: Provide example JSON with keys `summary_text` and `doc_id` (as per the AI output)  
   - Connect from Summerizer node output (to parse AI output)

6. **Create Langchain Agent Node for Summarization**  
   - Type: Langchain Agent (Google Gemini Agent)  
   - Text input: transcript text from transcription node (expression: `{{$node["Transcribe that file into text"].json.content.parts[0].text}}`)  
   - System Message: instruct AI to:  
     - Extract key discussion points and action items concisely and clearly  
     - Format output with title including current date, bold headers, bullet points (✦), checkmarks (✓), short sentences  
     - Return summary text and Google Doc ID separately  
   - Enable Output Parser (connected to Structured Output Parser node)  
   - Connect AI language model (Google Gemini Chat Model node) for LM backend  

7. **Add Google Gemini Chat Model Node**  
   - Type: Langchain LM Chat Google Gemini  
   - Credentials: Google Palm API (Google Gemini)  
   - Connect as AI language model for Summarizer node

8. **Add Code Node to Format Summary**  
   - Type: Code (JavaScript)  
   - Paste the provided JS code that:  
     - Reads AI summary text  
     - Parses markdown-like syntax (`**bold**`, `*italic*`, bullets)  
     - Constructs Google Docs API batchUpdate `requests` array for formatting  
   - Input: parsed AI summary text from Summerizer node’s output  
   - Connect from Summerizer node

9. **Add HTTP Request Node to Send Summary to Google Docs**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://docs.googleapis.com/v1/documents/{{ $json.requests[0]?.doc_id || $node["Summerizer of that text"].json.output.doc_id }}:batchUpdate` (use doc_id from summarizer output)  
   - Body Parameters: JSON with key `requests` set to requests array from Format Summary node  
   - Authentication: Google Docs OAuth2 (predefined credential)  
   - Connect from Format Summary node

10. **Set Credentials:**
    - Google Drive OAuth2: For trigger and download  
    - Google Docs OAuth2: For creating and updating docs  
    - Google Palm API (Google Gemini): For transcription and summarization  

11. **Test the Workflow:**
    - Upload an audio/video meeting file to the specified Google Drive folder  
    - Confirm trigger starts workflow  
    - Confirm transcription, summarization, doc creation, formatting, and insertion happen successfully  
    - Verify final Google Doc contains formatted meeting summary with bullets and styles  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                   |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Automated system converting meeting audio/video files into concise Google Doc summaries with AI transcription and formatting. Uses Google Drive for file storage, Google Gemini AI for transcription and summarization, and Google Docs API for document creation and formatting.                                                                                                      | Overview of the project                                                                           |
| Workflow triggers on new files in the “Speech of Meetings” Google Drive folder (ID: 1EongmFhQf1avt1jamhV6aO6MIORrzNvT).                                                                                                                                                                                                                                                               | Folder watched for input files                                                                   |
| AI summarization instructions enforce consistent formatting: bold headers, bullet points (✦) for discussions, checkmarks (✓) for tasks, short clear sentences, blank lines for readability.                                                                                                                                                                                             | Summarizer system message                                                                        |
| Uses Google Docs API `batchUpdate` method for advanced formatting: insertText, updateTextStyle (bold, italic), createParagraphBullets.                                                                                                                                                                                                                                                | Docs formatting method                                                                           |
| Requires OAuth2 credentials for Google Drive and Google Docs, and API key/credentials for Google Gemini (PaLM) AI.                                                                                                                                                                                                                                                                     | Required credentials                                                                             |
| The workflow handles both audio and video meeting files as input.                                                                                                                                                                                                                                                                                                                     | Supported input types                                                                            |
| The JavaScript formatting code normalizes line breaks, parses markdown-like syntax to Google Docs requests, and handles bullets distinctly.                                                                                                                                                                                                                                          | Code node logic                                                                                  |
| Summary titles are set dynamically based on the original file name with `.mp4` extension removed.                                                                                                                                                                                                                                                                                      | Doc naming convention                                                                            |
| Notes on limitations: API quota, transcription accuracy dependent on audio quality, potential parsing errors if AI output deviates from expected JSON schema.                                                                                                                                                                                                                          | Potential failure modes                                                                          |
| Project credit and detailed description included in a large sticky note node for user reference.                                                                                                                                                                                                                                                                                      | Project description embedded in workflow sticky note                                           |

---

**Disclaimer:** The provided text and workflow originate exclusively from an automated n8n workflow process. It complies fully with content policies and contains no illegal or protected content. All data handled is legal and publicly accessible.