AI Audio Transcription & Google Docs Report Generator

https://n8nworkflows.xyz/workflows/ai-audio-transcription---google-docs-report-generator-5307


# AI Audio Transcription & Google Docs Report Generator

### 1. Workflow Overview

This workflow is designed to automate the transcription of audio files received via Gmail and generate professional, timestamped transcription reports in Google Docs. It targets use cases such as meeting recordings, voice memos, interviews, podcasts, journalism, and accessibility documentation.

The workflow is organized into five logical blocks:

- **1.1 Email Monitoring:** Continuously polls Gmail for new emails containing audio attachments, automatically downloading these files to initiate transcription processing.

- **1.2 AI Audio Transcription:** Sends audio attachments asynchronously to the VLM Run AI transcription service, which performs speech-to-text conversion with timestamped segments and metadata extraction.

- **1.3 Webhook Reception:** Handles asynchronous callback from VLM Run with completed transcription results, ensuring reliable processing of long audio files without workflow timeouts.

- **1.4 Google Docs Report Generation:** Creates and updates a Google Doc with formatted transcription text, including timestamps, duration, and professional styling.

- **1.5 Workflow Documentation:** Sticky notes throughout the workflow provide detailed explanations of each phase, configuration guidance, and context for users.

---

### 2. Block-by-Block Analysis

#### 2.1 Email Monitoring

- **Overview:**  
  Monitors Gmail inbox for incoming emails containing audio attachments. Downloads these attachments automatically and triggers the transcription process.

- **Nodes Involved:**  
  - Monitor Email Attachments (gmailTrigger)

- **Node Details:**  

  - **Monitor Email Attachments**  
    - Type: Gmail Trigger  
    - Role: Polls Gmail every minute for new emails with attachments.  
    - Configuration:  
      - Poll interval: every minute  
      - Attachment download enabled  
      - Filters: none (all emails monitored)  
    - Inputs: None (trigger node)  
    - Outputs: Passes downloaded audio attachments to the AI transcription node  
    - Credentials: Gmail OAuth2 account connected and authorized  
    - Edge Cases:  
      - No new emails → node idles until next poll  
      - Unsupported attachment formats ignored by downstream  
      - Gmail API rate limits or OAuth token expiry may cause failures  
    - Notes: Automatically downloads attachments in formats including MP3, WAV, M4A, AAC, OGG, FLAC

---

#### 2.2 AI Audio Transcription

- **Overview:**  
  Sends the downloaded audio files to VLM Run’s AI transcription service asynchronously, leveraging advanced speech recognition with punctuation and timestamps.

- **Nodes Involved:**  
  - VLM Run Audio Transcriber (vlmRun)

- **Node Details:**  

  - **VLM Run Audio Transcriber**  
    - Type: VLM Run custom node  
    - Role: Sends audio file to VLM Run API for transcription; asynchronous processing mode enabled  
    - Configuration:  
      - File: uses first attachment (`attachment_0`) from previous node  
      - Domain: "audio.transcription" to specify transcription service  
      - Operation: "audio" transcription  
      - Callback URL: webhook endpoint URL to receive transcription results  
      - Async processing: enabled (for long audio support and avoiding timeouts)  
    - Inputs: Receives audio attachment from Gmail trigger  
    - Outputs: None directly; transcription results come back via webhook  
    - Credentials: VLM Run API key configured  
    - Edge Cases:  
      - Network or API errors during submission  
      - Invalid audio format or corrupt file  
      - Callback URL misconfiguration causing failed result delivery  
    - Notes: Runs asynchronously to handle large files reliably

---

#### 2.3 Webhook Reception

- **Overview:**  
  Receives the transcription results asynchronously posted by VLM Run after transcription completes, including full transcript, timestamps, and metadata.

- **Nodes Involved:**  
  - Receive Transcription Results (webhook)

- **Node Details:**  

  - **Receive Transcription Results**  
    - Type: Webhook  
    - Role: Endpoint to accept POST requests from VLM Run with transcription data  
    - Configuration:  
      - HTTP Method: POST  
      - Path: "audio-transcription" (matches callback URL)  
      - No additional options configured  
    - Inputs: External POST request from VLM Run  
    - Outputs: Passes transcription data to Google Docs generation node  
    - Credentials: None (webhook publicly accessible, secured by obscurity and URL)  
    - Edge Cases:  
      - Missed or delayed webhook calls  
      - Malformed or partial transcription data  
      - Potential security concerns if webhook URL is leaked  
    - Notes: Essential for async workflow completion

---

#### 2.4 Google Docs Report Generation

- **Overview:**  
  Generates a professional Google Docs report incorporating the transcription text, timestamps for each segment, total duration, and formatting for readability.

- **Nodes Involved:**  
  - Generate Transcription Report (googleDocs)

- **Node Details:**  

  - **Generate Transcription Report**  
    - Type: Google Docs node  
    - Role: Updates a specified Google Doc by appending formatted transcription data  
    - Configuration:  
      - Operation: "update" to append to existing document  
      - Document URL: fixed Google Docs document link for storing reports  
      - Text inserted includes:  
        - Report header with date/time (formatted in US English locale)  
        - Total audio duration in seconds  
        - Each transcription segment with segment number, start/end timestamps (to two decimals), and trimmed transcript text  
      - Uses JavaScript expressions to map over segments and format text dynamically  
    - Inputs: Receives transcription JSON from webhook node  
    - Outputs: None (final output)  
    - Credentials: Google Docs OAuth2 credentials configured  
    - Edge Cases:  
      - Google Docs API quota limits or authorization expiry  
      - Document access or permission errors  
      - Unexpected transcription data structures causing expression failures  
    - Notes: Maintains formatting and appends to the same document for consolidated reports

---

#### 2.5 Workflow Documentation (Sticky Notes)

- **Overview:**  
  Provides detailed commentary and explanations for each phase of the workflow to aid understanding and maintenance.

- **Nodes Involved:**  
  - 🎙️ Workflow Overview  
  - 📧 Email Monitoring  
  - 🤖 AI Transcription  
  - 🔗 Async Processing  
  - 📄 Document Generation

- **Node Details:**  

  Each sticky note contains a focused explanation including:

  - Workflow purpose and high-level steps  
  - Supported audio formats and Gmail polling behavior  
  - Features and benefits of VLM Run transcription AI  
  - Explanation of asynchronous processing and webhook callback mechanism  
  - Description of final Google Docs report formatting and output location

  These notes serve as in-editor documentation and do not participate in the data flow.

---

### 3. Summary Table

| Node Name                   | Node Type                  | Functional Role                           | Input Node(s)               | Output Node(s)               | Sticky Note                                                                                   |
|-----------------------------|----------------------------|-----------------------------------------|-----------------------------|-----------------------------|-----------------------------------------------------------------------------------------------|
| 🎙️ Workflow Overview         | Sticky Note                | Documentation overview                   | None                        | None                        | Provides high-level workflow purpose and logical blocks overview                              |
| 📧 Email Monitoring           | Sticky Note                | Documentation of email monitoring block | None                        | None                        | Explains Gmail polling, supported audio formats, and attachment download process               |
| 🤖 AI Transcription           | Sticky Note                | Documentation of AI transcription block | None                        | None                        | Details VLM Run transcription features and output                                            |
| 🔗 Async Processing           | Sticky Note                | Documentation of webhook async flow     | None                        | None                        | Describes asynchronous transcription and webhook callback steps                              |
| 📄 Document Generation        | Sticky Note                | Documentation of Google Docs report     | None                        | None                        | Details formatting and Google Docs output                                                    |
| Monitor Email Attachments     | Gmail Trigger              | Poll Gmail and download audio files     | None                        | VLM Run Audio Transcriber    | Continuously monitors Gmail for new emails with audio attachments. Automatically downloads all attachments and triggers the transcription workflow. |
| VLM Run Audio Transcriber     | VLM Run Node               | Send audio to VLM Run for transcription | Monitor Email Attachments    | None (async)                 | Processes audio files using VLM AI to generate accurate transcriptions with timestamps. Runs asynchronously for large audio files. |
| Receive Transcription Results | Webhook                    | Receive transcription results callback  | External POST (VLM Run)      | Generate Transcription Report | Receives the completed transcription from VLM AI when asynchronous processing is finished. Contains full transcript with timestamps. |
| Generate Transcription Report | Google Docs                | Generate formatted transcription report | Receive Transcription Results | None                        | Creates a professionally formatted Google Doc with the transcription results, including timestamps and metadata. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Monitor Email Attachments" Node**  
   - Type: Gmail Trigger  
   - Set polling mode to “Every Minute”  
   - Enable attachment downloads  
   - Connect Gmail OAuth2 credentials  
   - Leave filters empty (monitor all emails)  

2. **Create "VLM Run Audio Transcriber" Node**  
   - Type: VLM Run node (`@vlm-run/n8n-nodes-vlmrun.vlmRun`)  
   - Set operation to “audio” and domain to “audio.transcription”  
   - Set file input to `attachment_0` from previous node  
   - Enable “processAsynchronously” flag  
   - Configure callback URL to your public webhook endpoint (e.g., `https://yourdomain/webhook/audio-transcription`)  
   - Connect VLM Run API credentials  

3. **Connect "Monitor Email Attachments" output to "VLM Run Audio Transcriber" input**  

4. **Create "Receive Transcription Results" Webhook Node**  
   - Type: Webhook  
   - Set HTTP Method to POST  
   - Set path to “audio-transcription”  
   - No authentication required, but secure your endpoint (optional)  

5. **Create "Generate Transcription Report" Node**  
   - Type: Google Docs  
   - Operation: “update” (to append to existing document)  
   - Enter Google Docs document URL where reports are stored  
   - Set "Actions" to insert text with the following content using expressions:  
     ```
     =📄 Audio Transcription Report

     🗓️ Date: {{ new Date($json.body.completed_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) }}  
     ⏱️ Total Duration: {{ $json.body.response.metadata.duration }} seconds  
     {{ 
       $json.body.response.segments.map((segment, index) => 
         `\n` +
         `🔹 Segment ${index + 1}\n` +
         `⏰ Time: ${segment.start_time.toFixed(2)}s → ${segment.end_time.toFixed(2)}s\n` +
         `📝 Transcript: "${segment.content.trim()}"\n`
       ).join('\n')
     }}
     ```  
   - Connect Google Docs OAuth2 credentials  

6. **Connect "Receive Transcription Results" output to "Generate Transcription Report" input**  

7. **Add Sticky Notes for Documentation (Optional)**  
   - Create sticky notes at appropriate positions describing each block: overview, email monitoring, AI transcription, async webhook flow, and report generation.  
   - Use markdown formatting to explain purpose, process, and requirements.  

8. **Test Workflow**  
   - Send test email with supported audio attachment (e.g., MP3) to monitored Gmail  
   - Confirm audio is downloaded and sent to VLM Run  
   - Confirm webhook receives transcription results  
   - Verify Google Docs report is updated with formatted transcription  

---

### 5. General Notes & Resources

| Note Content                                                                                                               | Context or Link                                                                                              |
|----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Workflow requires OAuth2 credentials for Gmail and Google Docs to function.                                                 | Credential setup within n8n credentials management                                                           |
| VLM Run API access and account required; asynchronous processing recommended for long audio files.                         | https://vlm.run                                                                                              |
| Webhook endpoint must be publicly accessible and match callback URL set in VLM Run node configuration.                      | Ensure URL is reachable and secured appropriately                                                           |
| Supported audio formats include MP3, WAV, M4A, AAC, OGG, FLAC; ensures wide compatibility with mobile and professional audio recordings. | Documentation sticky notes within the workflow                                                                |
| Google Docs output document URL must have edit permissions granted to connected OAuth2 account.                              | Maintain document permissions and monitor API quotas                                                         |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.