Automate Meeting Summaries & Action Items with Google Meet, AssemblyAI & Claude AI

https://n8nworkflows.xyz/workflows/automate-meeting-summaries---action-items-with-google-meet--assemblyai---claude-ai-9284


# Automate Meeting Summaries & Action Items with Google Meet, AssemblyAI & Claude AI

---

### 1. Workflow Overview

This workflow automates the extraction of meeting summaries and action items from Google Meet recordings using Google Calendar, Google Drive, AssemblyAI transcription service, and Claude AI for natural language processing. It targets users who want to automatically process and analyze recent meetings to generate concise summaries, key action items, and sentiment insights, and then distribute these results via Slack and Notion.

The workflow is logically divided into five main blocks:

- **1.1 Fetch Meetings:** Retrieve recent Google Calendar events and filter for confirmed Google Meet meetings.
- **1.2 Retrieve and Download Recording:** Search Google Drive for meeting recordings and download the file if available.
- **1.3 Transcription:** Upload the audio recording to AssemblyAI, request transcription with enriched features, and poll for completion.
- **1.4 AI Analysis:** Use Claude AI to analyze the transcript to produce a meeting summary, extract action items, key dates, and sentiment.
- **1.5 Distribution:** Post the summary to Slack and create Notion tasks for each extracted action item.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Fetch Meetings

**Overview:**  
This block fetches recent Google Calendar events from the last 24 hours and filters them to include only confirmed Google Meet meetings. It extracts key meeting metadata required for subsequent processing.

**Nodes Involved:**  
- whenClickingTestWorkflow  
- getRecentMeetings  
- filterGoogleMeetEvents  
- extractMeetingData

**Node Details:**  

- **whenClickingTestWorkflow**  
  - *Type:* Manual Trigger  
  - *Role:* Entry point for manual workflow execution.  
  - *Configuration:* No parameters; triggers workflow on manual start.  
  - *Input/Output:* Outputs to `getRecentMeetings`.  
  - *Failures:* None expected; manual operation.

- **getRecentMeetings**  
  - *Type:* Google Calendar  
  - *Role:* Retrieves calendar events within the last 24 hours.  
  - *Configuration:*  
    - Limit: 10 events  
    - Time range: from now minus 24 hours to now  
    - Calendar: default calendar (empty value)  
    - Operation: getAll events  
  - *Expressions:* Uses `$now` to calculate time bounds.  
  - *Input/Output:* Input from manual trigger; output to filter node.  
  - *Failures:* API auth errors, rate limits, empty responses.

- **filterGoogleMeetEvents**  
  - *Type:* Filter  
  - *Role:* Filters events to include only those with Google Meet conference data and confirmed status.  
  - *Configuration:*  
    - Conditions:  
      1. `conferenceData` exists  
      2. `conferenceData.conferenceSolution.name` equals "Google Meet"  
      3. `status` equals "confirmed"  
  - *Input/Output:* Input from `getRecentMeetings`; output to `extractMeetingData`.  
  - *Failures:* Incorrect event data structure or missing conference data.

- **extractMeetingData**  
  - *Type:* Set  
  - *Role:* Extracts and formats relevant meeting details into custom fields.  
  - *Configuration:*  
    - meetingId: event's `id`  
    - meetingTitle: event's `summary`  
    - meetingStart: event's start dateTime  
    - participants: emails of attendees joined by commas or "No attendees"  
    - recordingUrl: first conference entry point URI or empty string  
  - *Input/Output:* Input from filtered events; output to `findRecordingInDrive`.  
  - *Failures:* Missing or undefined attendee list; handles with fallback.

---

#### 2.2 Retrieve and Download Recording

**Overview:**  
Searches Google Drive for the meeting's recording file. If found, downloads the recording for transcription; otherwise, triggers an error node.

**Nodes Involved:**  
- findRecordingInDrive  
- hasRecording  
- downloadRecording  
- noRecordingError

**Node Details:**  

- **findRecordingInDrive**  
  - *Type:* Google Drive  
  - *Role:* Searches Google Drive for files matching meeting criteria (implicit).  
  - *Configuration:* Operation set to "search" without explicit query parameters (likely defaults or dynamic).  
  - *Input/Output:* Input from `extractMeetingData`; output to `hasRecording`.  
  - *Failures:* API auth errors, no files found.

- **hasRecording**  
  - *Type:* If  
  - *Role:* Conditional check to determine if a recording file was found.  
  - *Configuration:* Checks existence of `id` field in the JSON (file ID).  
  - *Input/Output:* Input from `findRecordingInDrive`; if true, outputs to `downloadRecording`; else to `noRecordingError`.  
  - *Failures:* Logic errors if file ID is missing or malformed.

- **downloadRecording**  
  - *Type:* Google Drive  
  - *Role:* Downloads the identified recording file using its file ID.  
  - *Configuration:*  
    - Operation: download  
    - File ID: dynamically set from search result's ID  
  - *Input/Output:* Input from `hasRecording` true branch; output to `uploadToAssemblyAI`.  
  - *Failures:* File access permissions, download timeouts.

- **noRecordingError**  
  - *Type:* Stop and Error  
  - *Role:* Stops workflow execution with a descriptive error message if no recording is found.  
  - *Configuration:*  
    - Error message: "No recording found for this meeting. Please ensure the meeting was recorded and saved to Google Drive."  
  - *Input/Output:* Input from `hasRecording` false branch.  
  - *Failures:* Execution halt; no further nodes triggered.

---

#### 2.3 Transcription

**Overview:**  
Uploads the downloaded audio file to AssemblyAI, requests transcription with speaker labels, highlights, and sentiment analysis, then polls for transcription completion.

**Nodes Involved:**  
- uploadToAssemblyAI  
- requestTranscription  
- pollTranscriptionStatus  
- formatTranscript

**Node Details:**  

- **uploadToAssemblyAI**  
  - *Type:* HTTP Request  
  - *Role:* Uploads audio file to AssemblyAI for processing.  
  - *Configuration:* Uses default HTTP request parameters; expects file input from previous node.  
  - *Input/Output:* Input from `downloadRecording`; outputs upload URL to `requestTranscription`.  
  - *Failures:* Network issues, authentication errors with AssemblyAI API.

- **requestTranscription**  
  - *Type:* HTTP Request  
  - *Role:* Sends transcription request to AssemblyAI API.  
  - *Configuration:*  
    - URL: https://api.assemblyai.com/v2/transcript  
    - Method: POST  
    - Body (JSON): includes  
      - `audio_url`: dynamic AssemblyAI upload URL  
      - `speaker_labels`: true  
      - `auto_highlights`: true  
      - `sentiment_analysis`: true  
  - *Input/Output:* Input from `uploadToAssemblyAI`; output to `pollTranscriptionStatus`.  
  - *Failures:* Invalid JSON or API rate limits.

- **pollTranscriptionStatus**  
  - *Type:* HTTP Request  
  - *Role:* Polls AssemblyAI to check transcription status until complete or timeout (5 minutes).  
  - *Configuration:*  
    - URL: dynamic transcription ID endpoint  
    - Timeout: 300,000 ms (5 minutes)  
  - *Input/Output:* Input from `requestTranscription`; output to `formatTranscript`.  
  - *Failures:* Timeout, transcription errors, network errors.

- **formatTranscript**  
  - *Type:* Set  
  - *Role:* Extracts and formats the transcript text, speaker utterances, and highlights from transcription result.  
  - *Configuration:*  
    - `transcript`: raw transcript text  
    - `speakers`: formatted speaker-labeled utterances or transcript fallback  
    - `highlights`: concatenated auto highlights text  
  - *Input/Output:* Input from `pollTranscriptionStatus`; output to `analyzeMeetingWithAI`.  
  - *Failures:* Missing transcript data, unexpected JSON structure.

---

#### 2.4 AI Analysis

**Overview:**  
Uses Anthropic Claude AI via LangChain nodes to analyze the formatted transcript. It summarizes the meeting, extracts action items with assignees and due dates, identifies key dates, and determines overall sentiment.

**Nodes Involved:**  
- claudeChatModel  
- analyzeMeetingWithAI  
- parseAIOutput

**Node Details:**  

- **claudeChatModel**  
  - *Type:* LangChain Chat Model (Anthropic Claude)  
  - *Role:* Language model configured to process chat input; used as a backend for the agent.  
  - *Configuration:* Model set to "claude-3-5-sonnet-20241022" (version-specific, requires Anthropic API credentials).  
  - *Input/Output:* Input from `analyzeMeetingWithAI` via ai_languageModel connection; output not directly connected.  
  - *Failures:* API auth errors, model availability.

- **analyzeMeetingWithAI**  
  - *Type:* LangChain Agent  
  - *Role:* Defines the AI prompt and task for analyzing the meeting transcript.  
  - *Configuration:*  
    - Text prompt includes meeting details (title, date, participants) and full transcript with speaker labels.  
    - Tasks requested: summary, action items extraction, key dates, sentiment.  
    - Response format explicitly defined for easy parsing.  
    - Agent type: conversationalAgent.  
  - *Input/Output:* Input from `formatTranscript`; output to `parseAIOutput`.  
  - *Failures:* Prompt errors, AI response format deviation.

- **parseAIOutput**  
  - *Type:* Code (JavaScript)  
  - *Role:* Parses AI output string into structured JSON fields (summary, action items, key dates, sentiment).  
  - *Configuration:*  
    - Splits AI output by "**" markers to identify sections.  
    - Extracts tasks with regex parsing for assignee and due date.  
    - Fallbacks for unassigned tasks and missing dates.  
  - *Input/Output:* Input from `analyzeMeetingWithAI`; output to `postToSlack` and `hasActionItems`.  
  - *Failures:* Parsing errors if AI output structure changes.

---

#### 2.5 Distribution

**Overview:**  
Posts the meeting summary to Slack and creates Notion tasks for each extracted action item, enabling team visibility and task tracking.

**Nodes Involved:**  
- postToSlack  
- hasActionItems  
- splitActionItems  
- createNotionTask

**Node Details:**  

- **postToSlack**  
  - *Type:* Slack  
  - *Role:* Sends meeting summary notification to a Slack channel.  
  - *Configuration:*  
    - Channel: selected from Slack channels list (e.g., "general")  
    - Message content: implicit from input JSON (summary, or raw AI output expected)  
  - *Input/Output:* Input from `parseAIOutput`.  
  - *Failures:* Slack API token/auth errors, channel permission issues.

- **hasActionItems**  
  - *Type:* If  
  - *Role:* Checks if the AI output includes any action items.  
  - *Configuration:* Condition checks if `actionItems` array is not empty.  
  - *Input/Output:* Input from `parseAIOutput`; if true, outputs to `splitActionItems`.  
  - *Failures:* Incorrect JSON structure.

- **splitActionItems**  
  - *Type:* Split Out  
  - *Role:* Splits the array of action items into individual items for processing.  
  - *Configuration:* Field to split: `actionItems`.  
  - *Input/Output:* Input from `hasActionItems`; output to `createNotionTask`.  
  - *Failures:* Empty or malformed array.

- **createNotionTask**  
  - *Type:* Notion  
  - *Role:* Creates a page (task) in Notion for each action item.  
  - *Configuration:*  
    - Title: mapped dynamically from each action item's task description  
    - Page ID: configured with a Notion page URL or ID as parent container  
    - Credentials: Notion API credentials required  
  - *Input/Output:* Input from `splitActionItems`.  
  - *Failures:* Notion API auth errors, invalid page ID, rate limits.

---

### 3. Summary Table

| Node Name            | Node Type                           | Functional Role                             | Input Node(s)              | Output Node(s)                | Sticky Note                                                                                                      |
|----------------------|-----------------------------------|---------------------------------------------|----------------------------|------------------------------|------------------------------------------------------------------------------------------------------------------|
| whenClickingTestWorkflow | Manual Trigger                   | Entry point to start workflow manually     |                            | getRecentMeetings             |                                                                                                                  |
| getRecentMeetings     | Google Calendar                   | Fetches recent calendar events              | whenClickingTestWorkflow    | filterGoogleMeetEvents        | ## 📥 Step 1: Fetch Meetings Retrieves Google Calendar events from the last 24 hours and filters for confirmed Google Meet events. |
| filterGoogleMeetEvents| Filter                           | Filters Google Meet confirmed events        | getRecentMeetings           | extractMeetingData            |                                                                                                                  |
| extractMeetingData    | Set                              | Extracts meeting metadata fields             | filterGoogleMeetEvents      | findRecordingInDrive          |                                                                                                                  |
| findRecordingInDrive  | Google Drive                     | Searches Drive for meeting recording         | extractMeetingData          | hasRecording                 | ## 🎥 Step 2: Get Recording Searches Google Drive for the meeting recording and downloads it for transcription.  |
| hasRecording          | If                               | Checks if recording file was found           | findRecordingInDrive        | downloadRecording, noRecordingError |                                                                                                                  |
| downloadRecording     | Google Drive                     | Downloads recording file                      | hasRecording (true branch)  | uploadToAssemblyAI            |                                                                                                                  |
| noRecordingError      | Stop and Error                   | Stops workflow if no recording found         | hasRecording (false branch) |                              |                                                                                                                  |
| uploadToAssemblyAI    | HTTP Request                    | Uploads audio to AssemblyAI                   | downloadRecording           | requestTranscription          | ## 🎤 Step 3: Transcribe Uses AssemblyAI to transcribe the recording with speaker labels, highlights, and sentiment analysis. |
| requestTranscription  | HTTP Request                    | Requests transcription from AssemblyAI       | uploadToAssemblyAI          | pollTranscriptionStatus       |                                                                                                                  |
| pollTranscriptionStatus| HTTP Request                   | Polls transcription status until done        | requestTranscription        | formatTranscript             |                                                                                                                  |
| formatTranscript      | Set                              | Formats transcript and extracts highlights   | pollTranscriptionStatus     | analyzeMeetingWithAI          |                                                                                                                  |
| claudeChatModel       | LangChain Chat Model (Anthropic) | Provides AI language model for analysis      | analyzeMeetingWithAI (ai_languageModel) |                              | ## 🤖 Step 4: AI Analysis Claude analyzes the transcript to extract summary, action items, key dates, and sentiment. |
| analyzeMeetingWithAI  | LangChain Agent                  | AI prompt to analyze meeting transcript      | formatTranscript            | parseAIOutput                |                                                                                                                  |
| parseAIOutput         | Code                             | Parses AI output into structured data         | analyzeMeetingWithAI        | postToSlack, hasActionItems   |                                                                                                                  |
| postToSlack           | Slack                            | Posts meeting summary to Slack channel        | parseAIOutput               | hasActionItems               | ## 📤 Step 5: Distribute Posts summary to Slack and creates tasks in Notion for all action items.                |
| hasActionItems        | If                               | Checks if action items exist                   | parseAIOutput               | splitActionItems             |                                                                                                                  |
| splitActionItems      | Split Out                       | Splits action items array into single items   | hasActionItems              | createNotionTask             |                                                                                                                  |
| createNotionTask      | Notion                           | Creates individual tasks in Notion             | splitActionItems            |                              |                                                                                                                  |
| stickyNoteOverview    | Sticky Note                     | Describes overall workflow overview            |                            |                              | ## 🎯 Workflow Overview This workflow provides intelligent meeting analysis using Google Calendar, Drive, AssemblyAI, Claude AI, Slack and Notion. For questions, contact: https://www.linkedin.com/in/dominicsaraum/ |
| stickyNoteStep1       | Sticky Note                     | Explains step 1: fetching meetings             |                            |                              | ## 📥 Step 1: Fetch Meetings Retrieves Google Calendar events from the last 24 hours and filters for confirmed Google Meet events. |
| stickyNoteStep2       | Sticky Note                     | Explains step 2: recording retrieval           |                            |                              | ## 🎥 Step 2: Get Recording Searches Google Drive for the meeting recording and downloads it for transcription.  |
| stickyNoteStep3       | Sticky Note                     | Explains step 3: transcription                  |                            |                              | ## 🎤 Step 3: Transcribe Uses AssemblyAI to transcribe the recording with speaker labels, highlights, and sentiment analysis. |
| stickyNoteStep4       | Sticky Note                     | Explains step 4: AI analysis                     |                            |                              | ## 🤖 Step 4: AI Analysis Claude analyzes the transcript to extract summary, action items, key dates, and sentiment. |
| stickyNoteStep5       | Sticky Note                     | Explains step 5: distribution                     |                            |                              | ## 📤 Step 5: Distribute Posts summary to Slack and creates tasks in Notion for all action items.                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - No parameters needed. This serves as the workflow entry point.

2. **Add Google Calendar Node (getRecentMeetings)**  
   - Operation: Get All Events  
   - Limit: 10  
   - Time Range:  
     - `timeMin`: `={{ $now.minus({ hours: 24 }).toISO() }}`  
     - `timeMax`: `={{ $now.toISO() }}`  
   - Calendar: default (leave empty or select as needed)  
   - Connect output from Manual Trigger.

3. **Add Filter Node (filterGoogleMeetEvents)**  
   - Conditions (AND):  
     - `conferenceData` exists  
     - `conferenceData.conferenceSolution.name` equals "Google Meet"  
     - `status` equals "confirmed"  
   - Connect input from `getRecentMeetings`.

4. **Add Set Node (extractMeetingData)**  
   - Assign the following fields:  
     - `meetingId` = `={{ $json.id }}`  
     - `meetingTitle` = `={{ $json.summary }}`  
     - `meetingStart` = `={{ $json.start.dateTime }}`  
     - `participants` = `={{ $json.attendees ? $json.attendees.map(a => a.email).join(', ') : 'No attendees' }}`  
     - `recordingUrl` = `={{ $json.conferenceData?.entryPoints?.[0]?.uri || '' }}`  
   - Connect input from `filterGoogleMeetEvents`.

5. **Add Google Drive Node (findRecordingInDrive)**  
   - Operation: Search  
   - Connect input from `extractMeetingData`.

6. **Add If Node (hasRecording)**  
   - Condition: Check if `id` field exists in input JSON.  
   - Connect input from `findRecordingInDrive`.

7. **Add Google Drive Node (downloadRecording)**  
   - Operation: Download  
   - File ID: `={{ $json.id }}` from `hasRecording` true branch.  
   - Connect input from `hasRecording` true.

8. **Add Stop and Error Node (noRecordingError)**  
   - Error Message: "No recording found for this meeting. Please ensure the meeting was recorded and saved to Google Drive."  
   - Connect input from `hasRecording` false.

9. **Add HTTP Request Node (uploadToAssemblyAI)**  
   - Purpose: Upload audio file to AssemblyAI.  
   - Configure to send the file content from `downloadRecording`.  
   - Connect input from `downloadRecording`.

10. **Add HTTP Request Node (requestTranscription)**  
    - URL: `https://api.assemblyai.com/v2/transcript`  
    - Method: POST  
    - Body (JSON):  
      ```json
      {
        "audio_url": "{{ $json.upload_url }}",
        "speaker_labels": true,
        "auto_highlights": true,
        "sentiment_analysis": true
      }
      ```  
    - Connect input from `uploadToAssemblyAI`.

11. **Add HTTP Request Node (pollTranscriptionStatus)**  
    - URL: `https://api.assemblyai.com/v2/transcript/{{ $json.id }}`  
    - Configure with a timeout of 300,000 ms (5 minutes) to wait for transcription.  
    - Connect input from `requestTranscription`.

12. **Add Set Node (formatTranscript)**  
    - Assign fields:  
      - `transcript` = `={{ $json.text }}`  
      - `speakers` = `={{ $json.utterances ? $json.utterances.map(u => \`Speaker \${u.speaker}: \${u.text}\`).join('\\n') : $json.text }}`  
      - `highlights` = `={{ $json.auto_highlights_result ? $json.auto_highlights_result.results.map(h => h.text).join(', ') : '' }}`  
    - Connect input from `pollTranscriptionStatus`.

13. **Add LangChain Chat Model Node (claudeChatModel)**  
    - Model: `claude-3-5-sonnet-20241022`  
    - Requires Anthropic API credentials.  
    - This node serves as the AI model backend.

14. **Add LangChain Agent Node (analyzeMeetingWithAI)**  
    - Text prompt: Use the detailed prompt that includes meeting details and transcript, requesting summary, action items, key dates, and sentiment, formatted for parsing.  
    - Agent: conversationalAgent  
    - Connect input from `formatTranscript`.  
    - Connect AI language model input to `claudeChatModel` node.

15. **Add Code Node (parseAIOutput)**  
    - JavaScript code to parse AI output into structured JSON with fields: summary, action items (array of task, assignee, due date), key dates, sentiment, raw output.  
    - Connect input from `analyzeMeetingWithAI`.

16. **Add Slack Node (postToSlack)**  
    - Configure Slack credentials and select target channel (e.g., "general").  
    - Use parsed meeting summary or formatted message as content.  
    - Connect input from `parseAIOutput`.

17. **Add If Node (hasActionItems)**  
    - Condition: Check if `actionItems` array is not empty.  
    - Connect input from `parseAIOutput`.

18. **Add Split Out Node (splitActionItems)**  
    - Field to split: `actionItems` array.  
    - Connect input from `hasActionItems` true branch.

19. **Add Notion Node (createNotionTask)**  
    - Configure Notion API credentials.  
    - Page ID: specify Notion parent page or database where tasks will be created.  
    - Title: map from each split action item’s `task` field.  
    - Connect input from `splitActionItems`.

---

### 5. General Notes & Resources

| Note Content                                                                                                             | Context or Link                                                                                 |
|--------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| For any questions or support, contact the workflow author on LinkedIn: https://www.linkedin.com/in/dominicsaraum/       | Workflow author contact information                                                           |
| Workflow uses AssemblyAI API for transcription requiring API key and proper permissions.                                 | AssemblyAI API documentation: https://www.assemblyai.com/docs                                  |
| Anthropic Claude model requires Anthropic API credentials and model availability as specified ("claude-3-5-sonnet-20241022"). | Anthropic API documentation: https://anthropic.com/docs                                      |
| Google Drive and Google Calendar nodes require OAuth2 credentials with sufficient scopes to read calendar events and files. | Google API credential setup instructions: https://developers.google.com/workspace/guides/create-credentials |
| Slack node requires Slack app credentials with permission to post messages to target channels.                           | Slack API: https://api.slack.com/                                                              |
| Notion node requires integration token with write access to the selected workspace and page.                             | Notion API documentation: https://developers.notion.com/docs/getting-started                    |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---