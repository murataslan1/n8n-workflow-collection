Automate IT Support with Telegram Voice to JIRA Tickets Using Whisper & GPT-4.1 Mini

https://n8nworkflows.xyz/workflows/automate-it-support-with-telegram-voice-to-jira-tickets-using-whisper---gpt-4-1-mini-7137


# Automate IT Support with Telegram Voice to JIRA Tickets Using Whisper & GPT-4.1 Mini

### 1. Workflow Overview

This workflow automates IT support request handling by converting Telegram voice messages into structured JIRA tickets. It targets internal IT support teams and employees who prefer voice inputs for reporting issues or requests. The workflow leverages OpenAI Whisper for transcription and GPT-4.1 Mini for extracting structured ticket data, integrates with Google Drive for audio backup, creates tickets in JIRA, and notifies both the IT team (via Slack) and the requester (via Telegram).

The workflow is logically divided into these main blocks:

- **1.1 Input Reception & Validation:** Receive and validate incoming Telegram voice messages.
- **1.2 Audio Download, Transcription & Backup:** Download voice audio, transcribe it using Whisper, and back up the audio file to Google Drive.
- **1.3 Data Merging & Preprocessing:** Merge transcript with metadata and format for AI processing.
- **1.4 AI-Powered Transcript Analysis:** Use GPT-4.1 Mini to extract structured IT support request data from the transcript.
- **1.5 Ticket Creation & Internal Notification:** Create JIRA ticket and notify IT support team via Slack.
- **1.6 Requester Confirmation:** Send confirmation message with ticket details back to the requester on Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Validation

- **Overview:**  
  Listens for incoming Telegram messages, validates that the message contains an audio voice note, otherwise sends a polite rejection message.

- **Nodes Involved:**  
  - Telegram Voice Message Trigger  
  - Is audio message? (If node)  
  - Un-supported message type (Telegram node for rejection message)

- **Node Details:**

  - **Telegram Voice Message Trigger**  
    - Type: Telegram Trigger  
    - Role: Entry point that listens for new messages from Telegram bot webhook.  
    - Config: Triggers on "message" updates, downloads media with `download: true`.  
    - Connections: Output to "Is audio message?" node.  
    - Edge Cases: Telegram API downtime, webhook misconfiguration, unsupported message types.

  - **Is audio message?**  
    - Type: If node  
    - Role: Checks if incoming message contains audio data of type audio/ogg.  
    - Config: Checks if JSON string of message contains "audio/ogg".  
    - Connections: True → "Download audio message"; False → "Un-supported message type".  
    - Edge Cases: Message format changes, voice message missing or corrupted.

  - **Un-supported message type**  
    - Type: Telegram node  
    - Role: Sends a polite rejection message if input is not a voice message.  
    - Config: Sends fixed text message referencing chat ID from trigger node.  
    - Credentials: Telegram API credentials required.  
    - Edge Cases: Telegram sending errors or chat ID missing.

---

#### 2.2 Audio Download, Transcription & Backup

- **Overview:**  
  Downloads the audio file from Telegram, transcribes it using OpenAI Whisper, and backs up the original audio file to Google Drive.

- **Nodes Involved:**  
  - Download audio message (Telegram)  
  - Transcribe a recording (OpenAI Whisper)  
  - Backup Audio Message To Google Drive  
  - Merge (to combine transcript and backup metadata)

- **Node Details:**

  - **Download audio message**  
    - Type: Telegram node  
    - Role: Downloads the `.oga` audio file from Telegram using voice message file ID.  
    - Config: Uses `fileId` extracted from Telegram message JSON.  
    - Credentials: Telegram API credentials.  
    - Connections: Outputs to "Backup Audio Message To Google Drive" and "Transcribe a recording".  
    - Edge Cases: File missing or expired, download failures.

  - **Transcribe a recording**  
    - Type: OpenAI Whisper node  
    - Role: Transcribes the downloaded audio to text.  
    - Config: Operation set to "transcribe" audio resource.  
    - Credentials: OpenAI API credentials.  
    - Connections: Output to "Merge" node.  
    - Edge Cases: API rate limits, audio incompatibility, transcription errors.

  - **Backup Audio Message To Google Drive**  
    - Type: Google Drive node  
    - Role: Uploads the original audio file to a designated Google Drive folder for backup.  
    - Config: File name generated with timestamp and original file name, uploads to specific folder ID.  
    - Credentials: Google Drive OAuth2 credentials.  
    - Connections: Output to "Merge" node (second input).  
    - Edge Cases: Drive API limits, authentication errors, folder permissions.

  - **Merge**  
    - Type: Merge node  
    - Role: Combines the transcript data and Google Drive metadata into one JSON object.  
    - Config: Defaults, merges by index.  
    - Connections: Output to "Process output before feeding AI agent".  
    - Edge Cases: Mismatched input counts or timing issues.

---

#### 2.3 Data Merging & Preprocessing

- **Overview:**  
  Merges transcript and metadata, then prepares a formatted object that includes transcript text, audio URL, chat ID, and first name for AI processing.

- **Nodes Involved:**  
  - Process output before feeding AI agent (Code node)

- **Node Details:**

  - **Process output before feeding AI agent**  
    - Type: Code (JavaScript) node  
    - Role: Extracts relevant fields from merged inputs, formats a simplified JSON object with transcript, audio URL, chat ID, and sender's first name.  
    - Key Expressions: Accesses `$input.all()` to get transcript and Google Drive metadata; accesses Telegram chat and sender info from trigger node.  
    - Connections: Outputs to "Transcript Processing Agent".  
    - Edge Cases: Missing or malformed data, undefined properties.

---

#### 2.4 AI-Powered Transcript Analysis

- **Overview:**  
  Uses GPT-4.1 Mini to analyze the transcript and extract structured IT support request data such as requester identity, request category, priority, title, description, and due date.

- **Nodes Involved:**  
  - OpenAI Chat Model (GPT-4.1 Mini)  
  - Structured Output Parser  
  - Transcript Processing Agent (LangChain Agent)

- **Node Details:**

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat node  
    - Role: Runs the GPT-4.1 Mini model to analyze input text and produce a structured response.  
    - Config: Model set to "gpt-4.1-mini", no extra options.  
    - Credentials: OpenAI API.  
    - Connections: Output to "Structured Output Parser".  
    - Edge Cases: API errors, prompt failures, response delays.

  - **Structured Output Parser**  
    - Type: LangChain Output Parser node  
    - Role: Parses GPT output into structured JSON according to a provided schema example (request ticket fields).  
    - Config: JSON schema example includes fields like chatid, requester, category, priority, title, description, due_date, audioUrl, etc.  
    - Connections: Output to "Transcript Processing Agent".  
    - Edge Cases: Malformed or incomplete GPT response, parse failures.

  - **Transcript Processing Agent**  
    - Type: LangChain Agent node  
    - Role: Orchestrates the chat model and output parser to extract required fields and produce final structured output.  
    - Config: System message instructs the agent to carefully read transcript, extract requester identity, category, priority, title, description, due date, and keep original transcript; no hallucination allowed; outputs clearly structured text converted by parser.  
    - Connections: Output to "Submit JIRA request ticket".  
    - Edge Cases: Incomplete or ambiguous transcripts, missing requester data, unexpected GPT outputs.

---

#### 2.5 Ticket Creation & Internal Notification

- **Overview:**  
  Creates a JIRA ticket with the extracted data and sends internal team notifications via Slack. Also sets up parameters such as JIRA base URL and Slack channel.

- **Nodes Involved:**  
  - Submit JIRA request ticket (JIRA node)  
  - Setup Jira, Slack, Email (Set node)  
  - Send message to IT Support team (Slack node)

- **Node Details:**

  - **Submit JIRA request ticket**  
    - Type: JIRA node  
    - Role: Creates a new issue in JIRA using extracted title, description, priority, assignee, etc.  
    - Config: Project ID set, issue type "Task", assignee fixed, description includes original message and audio URL.  
    - Credentials: JIRA Cloud API credentials.  
    - Connections: Outputs to "Setup Jira, Slack, Email".  
    - Edge Cases: API failures, missing fields, permission issues.

  - **Setup Jira, Slack, Email**  
    - Type: Set node  
    - Role: Defines variables like JIRA base URL, IT support email, and Slack channel for downstream use.  
    - Config: Hardcoded values for URLs, emails, and Slack channel names.  
    - Connections: Outputs to Slack and Telegram notification nodes.  
    - Edge Cases: Misconfiguration of URLs or channels.

  - **Send message to IT Support team**  
    - Type: Slack node  
    - Role: Sends a formatted notification to the IT support Slack channel with all ticket details and JIRA link.  
    - Config: Text uses expressions to access structured output fields and JIRA ticket key; channel is dynamically selected from workflow variables.  
    - Credentials: Slack OAuth2 credentials.  
    - Edge Cases: Slack API failures, channel permission errors.

---

#### 2.6 Requester Confirmation

- **Overview:**  
  Sends a personalized Telegram message confirming receipt of the request, summarizing the ticket, and providing a direct JIRA tracking link.

- **Nodes Involved:**  
  - Inform reporter via Telegram (Telegram node)

- **Node Details:**

  - **Inform reporter via Telegram**  
    - Type: Telegram node  
    - Role: Sends confirmation message with ticket summary and link back to the requester’s Telegram chat ID.  
    - Config: Message text includes requester name, title, description, and JIRA ticket key with hyperlink; chat ID dynamically obtained from AI output.  
    - Credentials: Telegram API credentials.  
    - Edge Cases: Telegram message sending errors, invalid chat IDs.

---

### 3. Summary Table

| Node Name                     | Node Type                          | Functional Role                                | Input Node(s)                   | Output Node(s)                          | Sticky Note                                                                                     |
|-------------------------------|----------------------------------|------------------------------------------------|---------------------------------|---------------------------------------|------------------------------------------------------------------------------------------------|
| Telegram Voice Message Trigger | Telegram Trigger                 | Entry point, listens for Telegram messages     | -                               | Is audio message?                      | ## 📥 1. Telegram Voice Input & Validation                                                     |
| Is audio message?              | If                              | Checks if message has audio content             | Telegram Voice Message Trigger  | Download audio message, Un-supported message type | ## 📥 1. Telegram Voice Input & Validation                                                     |
| Un-supported message type      | Telegram                        | Sends rejection if not audio message            | Is audio message? (False branch)| -                                     | ## 📥 1. Telegram Voice Input & Validation                                                     |
| Download audio message         | Telegram                        | Downloads the voice audio file                   | Is audio message? (True branch) | Backup Audio Message To Google Drive, Transcribe a recording | ## 🎙️ 2. Audio Handling & Transcription                                                       |
| Backup Audio Message To Google Drive | Google Drive               | Uploads original audio to Google Drive           | Download audio message           | Merge                                 | ## 🎙️ 2. Audio Handling & Transcription                                                       |
| Transcribe a recording         | OpenAI Whisper                 | Transcribes audio to text                         | Download audio message           | Merge                                 | ## 🎙️ 2. Audio Handling & Transcription                                                       |
| Merge                         | Merge                           | Combines transcript and backup metadata         | Transcribe a recording, Backup Audio Message To Google Drive | Process output before feeding AI agent | ## 🔀 3. Merge & Preprocess Data                                                               |
| Process output before feeding AI agent | Code                     | Formats merged data for AI agent input           | Merge                          | Transcript Processing Agent            | ## 🔀 3. Merge & Preprocess Data                                                               |
| OpenAI Chat Model              | LangChain OpenAI Chat           | GPT-4.1 Mini model for transcript analysis       | Transcript Processing Agent     | Structured Output Parser               | ## 🧠 4. AI-Powered Transcript Analysis                                                       |
| Structured Output Parser       | LangChain Output Parser         | Parses GPT output into structured JSON           | OpenAI Chat Model              | Transcript Processing Agent            | ## 🧠 4. AI-Powered Transcript Analysis                                                       |
| Transcript Processing Agent    | LangChain Agent                 | Orchestrates AI analysis and structured parsing | Process output before feeding AI agent, Structured Output Parser | Submit JIRA request ticket            | ## 🧠 4. AI-Powered Transcript Analysis                                                       |
| Submit JIRA request ticket     | JIRA                           | Creates JIRA issue with extracted data           | Transcript Processing Agent     | Setup Jira, Slack, Email               | ## 🛠️ 5. Ticket Submission & Internal Notification                                           |
| Setup Jira, Slack, Email       | Set                            | Defines URLs, emails, and channels for notifications | Submit JIRA request ticket      | Send message to IT Support team, Inform reporter via Telegram | ## 🛠️ 5. Ticket Submission & Internal Notification                                           |
| Send message to IT Support team| Slack                          | Notifies IT team with ticket details             | Setup Jira, Slack, Email        | -                                     | ## 🛠️ 5. Ticket Submission & Internal Notification                                           |
| Inform reporter via Telegram   | Telegram                       | Sends confirmation with ticket link to requester | Setup Jira, Slack, Email        | -                                     | ## 📬 6. User Confirmation                                                                    |
| Sticky Notes (various)         | Sticky Note                    | Documentation, diagrams, branding                | -                             | -                                     | See sticky note content in sections above                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Voice Message Trigger node:**  
   - Type: Telegram Trigger  
   - Configure webhook to listen for "message" updates.  
   - Enable media download (`download: true`).  
   - Provide Telegram API credentials.

2. **Add If node named "Is audio message?":**  
   - Condition: Check if message JSON string contains `"audio/ogg"`.  
   - If true, proceed to audio download; if false, send rejection.

3. **Add Telegram node "Un-supported message type":**  
   - Sends a message: “Sorry, I can’t read your input right now. Please send me a voice message, and I’ll help you transcribe and track it! 🎙️💬”.  
   - Chat ID from trigger node message.  
   - Telegram credentials.

4. **Add Telegram node "Download audio message":**  
   - Use `fileId` from voice message JSON to download `.oga` file.  
   - Telegram credentials.

5. **Add Google Drive node "Backup Audio Message To Google Drive":**  
   - Upload downloaded audio file.  
   - File name: `audio-<timestamp>-<original_file_name>`.  
   - Target folder ID for backups.  
   - Google Drive OAuth2 credentials.

6. **Add OpenAI Whisper node "Transcribe a recording":**  
   - Operation: Transcribe audio resource.  
   - Use OpenAI API credentials.

7. **Add Merge node:**  
   - Merge inputs from "Transcribe a recording" and "Backup Audio Message To Google Drive" nodes.  
   - Combine transcript and backup metadata.

8. **Add Code node "Process output before feeding AI agent":**  
   - JavaScript code to extract transcript text, Google Drive URL, Telegram chat ID, and first name from inputs.  
   - Output a structured JSON object.

9. **Add LangChain Agent node "Transcript Processing Agent":**  
   - System message instructs GPT to extract requester name, department, category, priority, title, description, due date, and original transcript.  
   - Must output clearly structured text for parsing.  
   - Connect output from the Code node as input text.

10. **Add LangChain OpenAI Chat node "OpenAI Chat Model":**  
    - Model: GPT-4.1 Mini.  
    - Connect as language model for the agent node.

11. **Add LangChain Output Parser node "Structured Output Parser":**  
    - Provide JSON schema example matching required fields (chatid, requested_by, category, priority, title, description, due_date, created_at, original_message, audioUrl).  
    - Connect output of OpenAI Chat Model to this parser.  
    - Connect parser output to Agent node.

12. **Add JIRA node "Submit JIRA request ticket":**  
    - Set project ID, issue type "Task", assignee.  
    - Summary and description mapped from AI output fields.  
    - Include original transcript and audio URL in description.  
    - Use JIRA Cloud API credentials.

13. **Add Set node "Setup Jira, Slack, Email":**  
    - Create variables: "Jira base URL", "IT support email", "IT support slack channel".  
    - Hardcode values or use environment variables.

14. **Add Slack node "Send message to IT Support team":**  
    - Compose message with requester info, category, priority, title, description, and JIRA link.  
    - Use Slack OAuth2 credentials.  
    - Channel dynamically set from workflow variables.

15. **Add Telegram node "Inform reporter via Telegram":**  
    - Send confirmation to requester’s chat ID.  
    - Include request summary and JIRA ticket tracking link.  
    - Telegram API credentials.

16. **Connect nodes following the logical flow described in section 1:**  
    - Telegram Trigger → If (audio check) → Download audio → [Backup + Transcribe] → Merge → Preprocess → AI Agent → Submit JIRA → Setup variables → Slack notification + Telegram confirmation.  
    - If non-audio → send rejection message.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                        | Context or Link                                                 |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| Built with ❤️ using [n8n](https://n8n.io) - an automation and integration platform.                                                                                                                                                                                 | Workflow platform                                               |
| This workflow integrates Telegram, OpenAI Whisper & GPT, Google Drive, JIRA Cloud, and Slack to automate IT support voice ticketing.                                                                                                                             | Integration overview                                            |
| Sticky notes in the workflow provide detailed explanations and visual aids (images) for each logical block.                                                                                                                                                         | Embedded documentation within workflow                          |
| Setup instructions require API credentials for Telegram Bot, OpenAI, Google Drive (OAuth2), JIRA Cloud API, and Slack OAuth2.                                                                                                                                       | Prerequisites for running workflow                              |
| Customization options include replacing JIRA with other ticketing systems (Zendesk, GitHub Issues), changing Slack to Microsoft Teams or Email, and enhancing AI agent capabilities.                                                                                 | Extension suggestions                                          |
| Slack and Telegram notification templates use dynamic expressions to personalize messages with requester and ticket info.                                                                                                                                          | Messaging customization                                        |
| The AI-powered agent explicitly avoids hallucination by returning only data present in the transcript; missing fields are left blank or marked "Not specified".                                                                                                     | AI extraction behavior                                          |
| Google Drive backup folder ID and JIRA project/assignee IDs are hardcoded and must be updated to match your environment.                                                                                                                                           | Environment-specific configuration                              |
| For best results, test Telegram bot webhook connectivity and OpenAI API key validity before deploying.                                                                                                                                                              | Deployment tips                                                |
| Workflow is designed to handle errors gracefully by rejecting unsupported message types and retrying node executions where applicable.                                                                                                                              | Error handling notes                                           |

---

**Disclaimer:**  
The provided description and analysis are based solely on the n8n workflow JSON exported configuration. All data processed respects legal and ethical guidelines. No illegal or offensive content is included.