Auto-Generate Meeting Minutes with GPT and Share from Google Drive to Slack

https://n8nworkflows.xyz/workflows/auto-generate-meeting-minutes-with-gpt-and-share-from-google-drive-to-slack-7802


# Auto-Generate Meeting Minutes with GPT and Share from Google Drive to Slack

---
### 1. Workflow Overview

This workflow automates the generation and sharing of meeting minutes from transcripts stored in Google Drive. When a new transcript file appears in a specified Google Drive folder, the workflow downloads it, processes the transcript through an advanced GPT model to produce a structured summary of the meeting, and then posts the summary along with the generated Markdown minutes file to a designated Slack channel.

Logical blocks include:

- **1.1 Input Reception and File Download**: Watches a Google Drive folder for new files and downloads the transcript files.
- **1.2 Transcript Preparation**: Converts the downloaded binary file data into UTF-8 text and extracts metadata.
- **1.3 AI Processing and Summary Generation**: Sends the meeting transcript to OpenAI GPT-5 for summarization according to a strict prompt and formats the returned summary.
- **1.4 Slack Notification and Upload**: Posts a brief message to Slack announcing the generated minutes and uploads the Markdown file containing the full structured minutes.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and File Download

- **Overview:**  
  This block triggers the workflow upon file creation in a designated Google Drive folder and downloads the new transcript file for further processing.

- **Nodes Involved:**  
  - Google Drive Trigger  
  - Download file

- **Node Details:**

  - **Google Drive Trigger**  
    - *Type & Role:* Trigger node that listens for new files created in a specific Google Drive folder.  
    - *Configuration:* Watches a folder identified by a folder ID (`__GOOGLE_DRIVE_FOLDER_ID__`). Polls for new files.  
    - *Expressions/Variables:* Folder ID specified via credentials or environment variables.  
    - *Input:* None (trigger).  
    - *Output:* Metadata of the newly created file.  
    - *Edge Cases:*  
      - Folder ID misconfiguration or lack of permissions leads to trigger failure.  
      - Polling delay may cause latency in processing new files.  
      - Unsupported file types or large files may cause downstream failures.  
    - *Version:* n8n Google Drive Trigger node v1.

  - **Download file**  
    - *Type & Role:* Downloads the actual file content from Google Drive using file ID from the trigger.  
    - *Configuration:* Operation set to "download", file ID dynamically taken from trigger output (`{{$json.id || $json.fileId}}`).  
    - *Input:* File metadata from Google Drive Trigger.  
    - *Output:* Binary file content (`data`) with associated metadata.  
    - *Edge Cases:*  
      - File access revoked or deleted before download.  
      - Large files may cause timeouts or memory issues.  
    - *Version:* Google Drive node v3.

---

#### 1.2 Transcript Preparation

- **Overview:**  
  Converts the downloaded binary file content (expected to be text-based like .txt or .md) into UTF-8 text, extracts a title, and prepares the JSON and binary data for AI processing while preserving the original file for later Slack upload.

- **Nodes Involved:**  
  - Prep transcript (Code node)

- **Node Details:**

  - **Prep transcript**  
    - *Type & Role:* JavaScript code node that transforms binary data into usable text and extracts metadata.  
    - *Configuration:* Custom JS code:  
      - Extracts base64 binary data from input.  
      - Converts base64 to UTF-8 string as transcript text.  
      - Extracts a title from file name or defaults to "회의록" (Korean for "meeting minutes").  
      - Outputs JSON with `title` and `transcript`, and passes along original binary for Slack upload.  
    - *Input:* Downloaded file binary data.  
    - *Output:* JSON with `title` and `transcript`, plus binary file data unchanged.  
    - *Edge Cases:*  
      - Missing or corrupted binary data causes error.  
      - Non-text files will fail or produce unreadable output.  
    - *Version:* Code node v2.

---

#### 1.3 AI Processing and Summary Generation

- **Overview:**  
  Sends the transcript text to OpenAI GPT-5 via LangChain integration for summarization according to a detailed prompt specifying structure and quality checks. Then formats the AI response as a Markdown minutes file.

- **Nodes Involved:**  
  - Message a model (OpenAI GPT integration)  
  - Make Minutes (Code node)

- **Node Details:**

  - **Message a model**  
    - *Type & Role:* LangChain OpenAI node that sends a structured prompt and transcript to GPT-5, requesting a concise, structured summary.  
    - *Configuration:*  
      - Model set to "gpt-5" (latest GPT model).  
      - System message includes detailed instructions on output format (Markdown), content sections (overview, decisions, tasks), and self-check rules.  
      - User message contains the transcript text from the previous node (`{{$json.transcript}}`).  
    - *Credentials:* OpenAI API key required.  
    - *Input:* JSON with transcript text.  
    - *Output:* JSON containing GPT's Markdown summary.  
    - *Edge Cases:*  
      - API authentication failure, rate limits, or timeouts.  
      - GPT hallucination or incomplete output if transcript is ambiguous.  
    - *Version:* LangChain OpenAI node v1.8.

  - **Make Minutes**  
    - *Type & Role:* Code node that extracts the Markdown summary text from GPT response and converts it into a base64-encoded binary file named `<title>.md`.  
    - *Configuration:*  
      - Parses multiple possible GPT response formats to find summary text.  
      - Sets output binary with MIME type `text/markdown`.  
      - Uses meeting title as filename.  
    - *Input:* GPT output.  
    - *Output:* JSON with filename/title and binary Markdown file.  
    - *Edge Cases:*  
      - Missing or malformed GPT output leads to empty file.  
      - Filename fallback to "회의록.md" if title missing.  
    - *Version:* Code node v2.

---

#### 1.4 Slack Notification and Upload

- **Overview:**  
  Posts a notification message announcing the auto-generated minutes and uploads the Markdown file to a specific Slack channel.

- **Nodes Involved:**  
  - Send a message (Slack)  
  - Upload a file (Slack)

- **Node Details:**

  - **Send a message**  
    - *Type & Role:* Slack node that posts a text message to a channel.  
    - *Configuration:*  
      - Message text built dynamically: `"*Auto-generated minutes:* " + title`.  
      - Channel ID specified by environment variable (`___SLACK_CHANNEL_ID___`).  
      - Requires authorized Slack bot with access to channel.  
    - *Input:* JSON with title from Make Minutes.  
    - *Output:* Slack message metadata.  
    - *Edge Cases:*  
      - `not_in_channel` error if bot is not member of channel.  
      - Invalid channel ID or token causes failure.  
    - *Version:* Slack node v2.3.

  - **Upload a file**  
    - *Type & Role:* Slack node that uploads the Markdown minutes file to the same channel.  
    - *Configuration:*  
      - Uses binary property `minutes` containing the Markdown file.  
      - File name and channel ID configured similarly to message node.  
    - *Input:* Binary Markdown file from Make Minutes.  
    - *Output:* Slack file upload metadata.  
    - *Edge Cases:*  
      - Large files or network issues may cause failures.  
      - Slack rate limits on file uploads.  
    - *Version:* Slack node v2.3.

---

### 3. Summary Table

| Node Name           | Node Type                      | Functional Role                     | Input Node(s)          | Output Node(s)                       | Sticky Note                                                                                      |
|---------------------|--------------------------------|-----------------------------------|-----------------------|------------------------------------|-------------------------------------------------------------------------------------------------|
| Google Drive Trigger | n8n-nodes-base.googleDriveTrigger | Watches folder for new transcript files | None                  | Download file                      | See overview note on setup, file types, Slack bot permissions                                   |
| Download file       | n8n-nodes-base.googleDrive      | Downloads transcript file content | Google Drive Trigger  | Prep transcript                    |                                                                                                 |
| Prep transcript     | n8n-nodes-base.code             | Converts binary to text transcript | Download file         | Message a model                    |                                                                                                 |
| Message a model     | @n8n/n8n-nodes-langchain.openAi | Summarizes transcript with GPT-5  | Prep transcript       | Make Minutes                      |                                                                                                 |
| Make Minutes        | n8n-nodes-base.code             | Formats GPT output as Markdown file | Message a model       | Send a message, Upload a file     |                                                                                                 |
| Send a message      | n8n-nodes-base.slack            | Sends Slack notification message  | Make Minutes          | Upload a file                     | Bot must be in Slack channel to avoid `not_in_channel` error                                   |
| Upload a file       | n8n-nodes-base.slack            | Uploads Markdown minutes file to Slack | Make Minutes          | None                             |                                                                                                 |
| Sticky Note         | n8n-nodes-base.stickyNote       | Provides overview and setup notes  | None                  | None                             | **Minutes generator (overview):** Watches Drive folder, downloads transcript, summarizes via GPT, posts message and uploads markdown to Slack. Setup steps and notes included.|

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger node**  
   - Type: Google Drive Trigger  
   - Event: `fileCreated`  
   - Trigger on: `specificFolder`  
   - Folder ID: Set to your target Google Drive folder ID (replace `__GOOGLE_DRIVE_FOLDER_ID__`)  
   - Polling: Default or as needed

2. **Create Download file node**  
   - Type: Google Drive  
   - Operation: `download`  
   - File ID: Expression `={{$json.id || $json.fileId}}` to take from trigger output  
   - Connect output of Google Drive Trigger to input of Download file

3. **Create Prep transcript node (Code node)**  
   - Type: Code (JavaScript)  
   - Code (copy and paste):  
     ```javascript
     const out = [];
     for (const it of $input.all()) {
       const b64 = it.binary?.data?.data;
       if (!b64) throw new Error('No binary "data". Use Download for txt/md');
       const text = Buffer.from(b64, 'base64').toString('utf8');
       const title = it.json?.name || it.json?.fileName || '회의록';

       out.push({
         json: { title, transcript: text },
         binary: it.binary
       });
     }
     return out;
     ```  
   - Connect output of Download file to input of Prep transcript

4. **Create Message a model node (OpenAI LangChain)**  
   - Type: `@n8n/n8n-nodes-langchain.openAi`  
   - Model ID: Select or enter `gpt-5` (ensure your OpenAI account supports this model)  
   - Messages:  
     - System role with detailed prompt (copy from workflow; includes instructions for summarization, output format, and self-check)  
     - User role with message content: Expression `={{$json.transcript}}`  
   - Credentials: Add or select OpenAI API credentials  
   - Connect output of Prep transcript to input of Message a model

5. **Create Make Minutes node (Code node)**  
   - Type: Code (JavaScript)  
   - Code:  
     ```javascript
     const it = $input.first();

     const md =
       it.json?.message?.content ??
       it.json?.output_text ??
       it.json?.data?.choices?.[0]?.message?.content ??
       it.json?.choices?.[0]?.message?.content ??
       '';

     const title = it.json?.title || '회의록';
     const filename = `${title}.md`;
     const data = Buffer.from(md, 'utf8').toString('base64');

     return [{
       json: { filename, title },
       binary: { minutes: { data, fileName: filename, mimeType: 'text/markdown' } }
     }];
     ```  
   - Connect output of Message a model to input of Make Minutes

6. **Create Send a message node (Slack)**  
   - Type: Slack  
   - Operation: Send Message  
   - Text: Expression `={{"*Auto-generated minutes:* " + ($json.title || $json.name || "Minutes")}}`  
   - Channel: Set channel ID to your Slack channel (`___SLACK_CHANNEL_ID___`)  
   - Credentials: Add or select Slack OAuth2 credentials with bot membership in target channel  
   - Connect output of Make Minutes to input of Send a message

7. **Create Upload a file node (Slack)**  
   - Type: Slack  
   - Operation: Upload File  
   - File Name: Expression `={{$json.filename}}`  
   - Channel: Same as Send a message node (`___SLACK_CHANNEL_ID___`)  
   - Binary Property Name: `minutes`  
   - Credentials: Same as Send a message  
   - Connect output of Make Minutes to input of Upload a file

8. **Set connections**  
   - Google Drive Trigger → Download file  
   - Download file → Prep transcript  
   - Prep transcript → Message a model  
   - Message a model → Make Minutes  
   - Make Minutes → Send a message  
   - Make Minutes → Upload a file

9. **Optional: Add Sticky Note node**  
   - Type: Sticky Note  
   - Content: Include overview, setup instructions, and notes about file types and Slack bot permissions  
   - Position near workflow start for clarity

10. **Activate and test**  
    - Ensure all credentials are valid and have correct permissions.  
    - Upload a text transcript file to the watched Google Drive folder to trigger the workflow.  
    - Verify Slack channel receives notification message and Markdown file upload.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                    | Context or Link                                                            |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| Files must be text-based (.txt or .md) unless a converter is added to handle other formats.                                                                    | Workflow note on file format requirements                                 |
| Slack bot must be a member of the target channel to avoid `not_in_channel` errors when posting messages or uploading files.                                    | Slack API usage note                                                      |
| GPT prompt includes instructions to ask up to 3 clarification questions if transcript is unclear before summarizing, ensuring accuracy and completeness.       | Embedded in Message a model node system message                           |
| The workflow uses LangChain integration for OpenAI GPT calls, enabling advanced prompt and message structuring.                                                | Node type `@n8n/n8n-nodes-langchain.openAi`                             |
| The title fallback "회의록" is Korean for "meeting minutes," reflecting original workflow context but can be replaced.                                          | Code node default title                                                   |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.