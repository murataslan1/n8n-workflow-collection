Auto Meeting Summarizer with Google Drive, OpenAI Whisper & GPT-4 to Sheets

https://n8nworkflows.xyz/workflows/auto-meeting-summarizer-with-google-drive--openai-whisper---gpt-4-to-sheets-4370


# Auto Meeting Summarizer with Google Drive, OpenAI Whisper & GPT-4 to Sheets

### 1. Workflow Overview

This workflow automates the process of transcribing meeting audio files uploaded to a specific Google Drive folder, generating a concise summary with actionable items, and logging the summary along with the date into a Google Sheet. It is ideal for teams, project managers, salespeople, and consultants who want to convert meeting recordings into readable, actionable insights automatically.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Detects new audio file uploads in a designated Google Drive folder.
- **1.2 File Download:** Downloads the newly uploaded audio file for processing.
- **1.3 AI Transcription & Summarization:** Uses OpenAI Whisper to transcribe audio into text, then GPT-4 to generate a professional meeting summary and extract action items.
- **1.4 Date Handling:** Retrieves the current date and formats it for record-keeping.
- **1.5 Data Persistence:** Saves the generated summary and date into a Google Sheet for easy access and tracking.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
Monitors a specific Google Drive folder continuously to detect newly uploaded audio files and trigger the workflow.

- **Nodes Involved:**  
  - Looking for uploading file

- **Node Details:**

  - **Looking for uploading file**  
    - *Type & Role:* Google Drive Trigger node; listens for new files in a folder.  
    - *Configuration:* Watches folder ID `1Wjd0_fptBBBtLZySHt0qYPpZA_dBjyYi` with a polling interval of every minute. Triggers on the event `fileCreated`.  
    - *Expressions:* Uses dynamic file ID from event (`{{$json.id}}`) for downstream processing.  
    - *Input/Output:* No input; outputs file metadata to the next node.  
    - *Version Requirements:* Standard Google Drive Trigger node.  
    - *Potential Failures:* API rate limits, folder permission issues, or network timeouts.  
    - *Sticky Note:* Noted as part of the file download block.

#### 2.2 File Download

- **Overview:**  
Downloads the detected audio file from Google Drive to prepare it for transcription.

- **Nodes Involved:**  
  - Download file  
  - Sticky Note (for explanation)

- **Node Details:**

  - **Download file**  
    - *Type & Role:* Google Drive node with download operation; fetches the actual audio file binary content.  
    - *Configuration:* Uses the file ID from the trigger node (`={{ $json.id }}`). Operation set to `download`.  
    - *Expressions:* Dynamic file ID binding.  
    - *Input/Output:* Input from "Looking for uploading file" node; outputs file binary data for transcription.  
    - *Version Requirements:* Google Drive node version 3.  
    - *Failure Cases:* File not found, insufficient permissions, download errors, large file size issues.  
    - *Sticky Note Content:* "## Download the file\nThese two nodes are responsible for looking and downloading the uploaded file"

#### 2.3 AI Transcription & Summarization

- **Overview:**  
Transforms the downloaded audio into text using OpenAI Whisper, then summarizes the transcript with GPT-4 including action items extraction.

- **Nodes Involved:**  
  - Transcribe the file  
  - Create summary  
  - Sticky Note (for explanation)

- **Node Details:**

  - **Transcribe the file**  
    - *Type & Role:* OpenAI LangChain node configured for audio transcription.  
    - *Configuration:* Resource set to `audio`, operation `transcribe`. Uses OpenAI Whisper under the hood.  
    - *Expressions:* Receives binary audio from the previous node; outputs transcript text in JSON.  
    - *Input/Output:* Input: binary audio from "Download file" node; Output: transcript text for summary.  
    - *Version:* LangChain OpenAI node v1.8.  
    - *Edge Cases:* Unsupported audio format, transcription inaccuracies, API limits, slow response.  

  - **Create summary**  
    - *Type & Role:* OpenAI LangChain node for text completion.  
    - *Configuration:* Uses model `gpt-4.1`. System prompt guides the model to summarize key discussion points and extract action items with clear formatting and professional tone. Input is transcript text from transcription node.  
    - *Expressions:* Passes transcript (`{{$json.text}}`) as user message content.  
    - *Input/Output:* Input from "Transcribe the file"; output summary content as JSON message.  
    - *Version:* LangChain OpenAI node v1.8.  
    - *Failures:* API quota exhaustion, malformed input leading to response errors, slow generation times.  
    - *Sticky Note Content:* "## Generate Summary\nThese two nodes are responsible for looking and downloading the uploaded file" (likely miswritten, but contextually applies to transcription and summary generation).

#### 2.4 Date Handling

- **Overview:**  
Obtains the current date and formats it to a readable string for recording alongside the meeting summary.

- **Nodes Involved:**  
  - Get date  
  - Format date  
  - Sticky Note (for explanation)

- **Node Details:**

  - **Get date**  
    - *Type & Role:* DateTime node; obtains current system date/time.  
    - *Configuration:* Default configuration to output current date-time in a JSON field named `Date`.  
    - *Input/Output:* Input from "Create summary"; output `Date` field to next node.  
    - *Version:* DateTime node v2.  
    - *Edge Cases:* System clock issues or timezone misalignment.

  - **Format date**  
    - *Type & Role:* DateTime node; formats the date to a specific string format as required by Google Sheets.  
    - *Configuration:* Formats input date field `Date` from previous node; exact format not specified but likely human-readable date string.  
    - *Input/Output:* Input: `Date` from previous node; output: `formattedDate` field.  
    - *Version:* DateTime node v2.  
    - *Failures:* Invalid date input, formatting errors.  
    - *Sticky Note Content:* "## Get date\nThese two nodes are responsible for getting and formatting date"

#### 2.5 Data Persistence

- **Overview:**  
Appends the formatted date and AI-generated meeting summary into a specified Google Sheets document for record-keeping and future reference.

- **Nodes Involved:**  
  - Save the summary

- **Node Details:**

  - **Save the summary**  
    - *Type & Role:* Google Sheets node to append a new row.  
    - *Configuration:* Appends data to sheet with ID `1JZnhAhr8x2UzzTQbT5l9PXguKkSM1NlznM8LX66-2Nc`, sheet `gid=0`. Columns mapped are `Date` and `Meeting Summary`.  
    - *Expressions:*  
      - `Date` mapped from `{{$json.formattedDate}}`  
      - `Meeting Summary` mapped from the content of the summary node (`{{$('Create summary').item.json.message.content}}`).  
    - *Input/Output:* Input from "Format date"; outputs append confirmation.  
    - *Version:* Google Sheets node v4.5.  
    - *Failure Cases:* Authentication failure, sheet access rights, quota limits, data mapping mismatch.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                         | Input Node(s)               | Output Node(s)            | Sticky Note                                                                                                     |
|-------------------------|----------------------------------|---------------------------------------|----------------------------|---------------------------|----------------------------------------------------------------------------------------------------------------|
| Looking for uploading file | Google Drive Trigger              | Detect new audio file uploads          | -                          | Download file             | Part of file download block                                                                                     |
| Download file           | Google Drive                     | Download uploaded audio file           | Looking for uploading file  | Transcribe the file       | ## Download the file<br>These two nodes are responsible for looking and downloading the uploaded file           |
| Transcribe the file     | OpenAI LangChain (Audio)          | Transcribe audio to text                | Download file              | Create summary            | ## Generate Summary<br>These two nodes are responsible for looking and downloading the uploaded file (miswritten)|
| Create summary          | OpenAI LangChain (Text Completion)| Generate meeting summary and actions  | Transcribe the file         | Get date                  | ## Generate Summary<br>These two nodes are responsible for looking and downloading the uploaded file (miswritten)|
| Get date                | DateTime                         | Retrieve current date                   | Create summary             | Format date               | ## Get date<br>These two nodes are responsible for getting and formatting date                                  |
| Format date             | DateTime                         | Format date string                     | Get date                   | Save the summary          | ## Get date<br>These two nodes are responsible for getting and formatting date                                  |
| Save the summary        | Google Sheets                    | Append summary and date to sheet       | Format date                | -                         |                                                                                                                |
| Sticky Note             | Sticky Note                     | Explanatory note                       | -                          | -                         | ## Download the file<br>These two nodes are responsible for looking and downloading the uploaded file           |
| Sticky Note1            | Sticky Note                     | Explanatory note                       | -                          | -                         | ## Generate Summary<br>These two nodes are responsible for looking and downloading the uploaded file (miswritten)|
| Sticky Note2            | Sticky Note                     | Explanatory note                       | -                          | -                         | ## Get date<br>These two nodes are responsible for getting and formatting date                                  |
| Sticky Note3            | Sticky Note                     | Full workflow overview and instructions | -                          | -                         | Detailed descriptive note on use cases, setup, and workflow steps (see Section 5)                               |
| Sticky Note9            | Sticky Note                     | Workflow assistance contact information| -                          | -                         | Contact info for support and links to YouTube and LinkedIn channels                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger node**  
   - Type: Google Drive Trigger  
   - Parameters:  
     - Event: `fileCreated`  
     - Folder to watch: Select or enter folder ID `1Wjd0_fptBBBtLZySHt0qYPpZA_dBjyYi`  
     - Poll interval: Every minute  
   - Purpose: Detect new audio files uploaded to the folder.

2. **Create Google Drive node for file download**  
   - Type: Google Drive  
   - Operation: `download`  
   - File ID: Set to `={{ $json.id }}` (output from trigger)  
   - Connect input to Google Drive Trigger node.

3. **Create OpenAI LangChain node for audio transcription**  
   - Type: OpenAI LangChain  
   - Resource: `audio`  
   - Operation: `transcribe`  
   - Input: Binary data from Google Drive download node  
   - Credentials: Configure OpenAI API key with access to Whisper endpoints.

4. **Create OpenAI LangChain node for summary generation**  
   - Type: OpenAI LangChain  
   - Model ID: Select `gpt-4.1`  
   - Operation: `chat completion` with messages:  
     - System prompt specifying instructions to summarize and extract action items professionally.  
     - User message: transcript text from previous node (`={{ $json.text }}`).  
   - Input: Transcript output from transcription node.

5. **Create DateTime node to get current date**  
   - Type: DateTime  
   - Operation: Get current date/time (default)  
   - Input: Output from summary node.

6. **Create DateTime node to format date**  
   - Type: DateTime  
   - Operation: Format Date  
   - Date input: `={{ $json.Date }}` from previous node  
   - Specify desired date format (e.g., `YYYY-MM-DD` or human-readable).  
   - Input: Output from Get date node.

7. **Create Google Sheets node to save summary**  
   - Type: Google Sheets  
   - Operation: Append  
   - Document ID: `1JZnhAhr8x2UzzTQbT5l9PXguKkSM1NlznM8LX66-2Nc`  
   - Sheet: `gid=0` or "Sheet1"  
   - Columns to append:  
     - `Date` → `={{ $json.formattedDate }}` from Format date node  
     - `Meeting Summary` → `={{ $('Create summary').item.json.message.content }}`  
   - Connect input from Format date node.

8. **Connect nodes sequentially:**  
   - Google Drive Trigger → Download file → Transcribe the file → Create summary → Get date → Format date → Save the summary.

9. **Credential setup:**  
   - Google Drive OAuth2 credentials for Drive Trigger and Download nodes.  
   - OpenAI API key for transcription and summary nodes.  
   - Google Sheets OAuth2 credentials for appending summary.

10. **Testing & Validation:**  
    - Upload sample audio files (MP3, WAV, M4A) under 100MB to the watched Drive folder.  
    - Monitor workflow execution logs for transcription and summary accuracy.  
    - Verify appended rows in Google Sheets.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Context or Link                                                                                  |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| 🎤 Meeting Audio to Summary in Google Sheets: Automatically transcribe, summarize with AI, and log into Google Sheets. Use cases include team syncs, client calls, knowledge management. Setup requires Google Drive, OpenAI (Whisper & GPT-4), and Google Sheets credentials. Upload audio files (MP3, WAV, M4A, <100MB recommended). Workflow steps: detect upload → download → transcribe → summarize → date → save. Tips include adding speaker labels, customizing prompts, scheduling, Slack integration. | Full workflow explanation from Sticky Note3 node content                                        |
| Workflow assistance and support contact: Yaron@nofluff.online. Additional tips and tutorials available on YouTube (https://www.youtube.com/@YaronBeen/videos) and LinkedIn (https://www.linkedin.com/in/yaronbeen/).                                                                                                                                                                                                                                                                                                                     | Sticky Note9 node contact info and links                                                        |
| Sticky notes clarify each major block: file download, summary generation, and date processing, helping maintain and extend the workflow.                                                                                                                                                                                                                                                                                                                                                                                                | Sticky Note, Sticky Note1, Sticky Note2                                                         |

---

This detailed documentation enables understanding, reproduction, and customization of the meeting summarization workflow fully within n8n, supporting advanced users and automation agents alike.