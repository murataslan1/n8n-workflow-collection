Audio Conversation Analysis & Visualization with DeepGram and GPT-4o

https://n8nworkflows.xyz/workflows/audio-conversation-analysis---visualization-with-deepgram-and-gpt-4o-3140


# Audio Conversation Analysis & Visualization with DeepGram and GPT-4o

### 1. Workflow Overview

**Transcript Evalu8r** is an advanced n8n workflow designed to automate the transcription, analysis, and visualization of audio conversations using AI technologies such as DeepGram for speech-to-text and GPT-4o for natural language understanding. It targets users who need actionable insights from recorded conversations, including customer support teams, legal professionals, researchers, and content creators.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Audio Upload**: Handles audio file uploads via Google Drive or webhook triggers.
- **1.2 Audio Transcription**: Sends audio files to DeepGram API for speech-to-text conversion.
- **1.3 Transcript Processing & AI Analysis**: Uses GPT-4o via LangChain nodes to analyze transcripts for sentiment, topics, intents, and key insights.
- **1.4 Output Generation & Storage**: Creates Google Docs and JSON files for transcripts and analysis results, uploads them to Google Drive, and optionally sends email notifications.
- **1.5 Webhook & UI Interaction**: Provides webhook endpoints for external triggers and responds with HTML or JSON for UI components.
- **1.6 Setup & Initialization**: Prepares necessary Google Drive folders and files for workflow operation.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Audio Upload

- **Overview:**  
  This block manages the reception of audio files either through Google Drive triggers or webhook endpoints, facilitating file uploads and downloads within Google Drive.

- **Nodes Involved:**  
  - Google Drive Trigger  
  - Webhook4  
  - Google Drive uploadAudio  
  - Respond to Webhook4  
  - Google Drive downloadUploaded

- **Node Details:**

  - **Google Drive Trigger**  
    - *Type:* Trigger node that listens for new or updated files in Google Drive.  
    - *Configuration:* Monitors a specific folder or drive for new audio files.  
    - *Connections:* Outputs to Google Drive Download Audio node.  
    - *Edge Cases:* Permissions errors, file format incompatibility, or delayed triggers.

  - **Webhook4**  
    - *Type:* Webhook node to receive audio file uploads via HTTP requests.  
    - *Configuration:* Exposes a webhook URL for external clients to POST audio files.  
    - *Connections:* Outputs to Google Drive uploadAudio node.  
    - *Edge Cases:* Invalid file uploads, large file size limits, authentication issues.

  - **Google Drive uploadAudio**  
    - *Type:* Google Drive node to upload received audio files to a designated folder.  
    - *Configuration:* Uploads files received from webhook or other nodes.  
    - *Connections:* Outputs to Respond to Webhook4 and Google Drive downloadUploaded nodes.  
    - *Edge Cases:* Upload failures due to quota limits or network issues.

  - **Respond to Webhook4**  
    - *Type:* Respond node to confirm successful upload back to the webhook caller.  
    - *Configuration:* Sends HTTP 200 response with success message.  
    - *Connections:* None (terminal node).  
    - *Edge Cases:* Response timeout if previous nodes fail.

  - **Google Drive downloadUploaded**  
    - *Type:* Google Drive node to download the uploaded audio file for processing.  
    - *Configuration:* Fetches the uploaded audio file content.  
    - *Connections:* Outputs to DeepGram node.  
    - *Edge Cases:* File not found or access denied errors.

---

#### 1.2 Audio Transcription

- **Overview:**  
  This block sends the audio file to DeepGram’s speech-to-text API and processes the transcription JSON response.

- **Nodes Involved:**  
  - DeepGram  
  - ProcessJSON  
  - SetJSONFields

- **Node Details:**

  - **DeepGram**  
    - *Type:* HTTP Request node configured to call DeepGram API.  
    - *Configuration:* Sends audio file data, sets API key in headers, and requests transcription with speaker diarization and timestamps.  
    - *Connections:* Outputs to ProcessJSON and Merge nodes.  
    - *Edge Cases:* API authentication failure, request timeouts, or invalid audio format.

  - **ProcessJSON**  
    - *Type:* Code node that parses DeepGram’s JSON response.  
    - *Configuration:* Extracts transcript text, speaker labels, timestamps, and other metadata.  
    - *Connections:* Outputs to SetJSONFields node.  
    - *Edge Cases:* JSON parsing errors if API response format changes.

  - **SetJSONFields**  
    - *Type:* Set node to prepare structured data fields for AI analysis.  
    - *Configuration:* Sets variables such as full transcript text, speaker info, and metadata for downstream AI nodes.  
    - *Connections:* Outputs to AI Agent node.  
    - *Edge Cases:* Missing or incomplete data fields.

---

#### 1.3 Transcript Processing & AI Analysis

- **Overview:**  
  This block uses LangChain AI nodes to analyze the transcript for sentiment, topics, intents, and key insights, producing structured output.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  
  - Structured Output Parser  
  - Merge  
  - RenameAudio  
  - MoveAudio  
  - GetSpeakers

- **Node Details:**

  - **AI Agent**  
    - *Type:* LangChain Agent node that orchestrates AI calls.  
    - *Configuration:* Uses OpenAI Chat Model and Structured Output Parser as subcomponents.  
    - *Connections:* Inputs from SetJSONFields and Merge nodes; outputs to RenameAudio and MoveAudio.  
    - *Edge Cases:* API rate limits, prompt failures, or unexpected AI responses.

  - **OpenAI Chat Model**  
    - *Type:* Language model node using GPT-4o.  
    - *Configuration:* Configured with API credentials, temperature, and prompt templates for transcript analysis.  
    - *Connections:* Feeds AI Agent node.  
    - *Edge Cases:* Authentication errors, model unavailability.

  - **Structured Output Parser**  
    - *Type:* Output parser node to convert AI responses into structured JSON.  
    - *Configuration:* Defines expected JSON schema for sentiment, topics, intents, and insights.  
    - *Connections:* Feeds AI Agent node.  
    - *Edge Cases:* Parsing errors if AI output deviates from schema.

  - **Merge**  
    - *Type:* Merge node to combine data streams (e.g., AI analysis and DeepGram data).  
    - *Configuration:* Merges inputs by data index or key.  
    - *Connections:* Outputs to AI Agent and GetSpeakers nodes.  
    - *Edge Cases:* Data mismatch or missing inputs.

  - **RenameAudio**  
    - *Type:* Google Drive node to rename audio files post-processing.  
    - *Configuration:* Applies naming conventions based on analysis results or timestamps.  
    - *Connections:* Outputs to MoveAudio node.  
    - *Edge Cases:* Rename conflicts or permission issues.

  - **MoveAudio**  
    - *Type:* Google Drive node to move processed audio files to archive or completed folders.  
    - *Configuration:* Moves files to designated folders for organization.  
    - *Connections:* Outputs to Create Google Docs node.  
    - *Edge Cases:* Folder access errors.

  - **GetSpeakers**  
    - *Type:* Code node to extract and format speaker information from transcript data.  
    - *Configuration:* Processes speaker labels and talk-time metrics.  
    - *Connections:* Outputs to Convert to File1 node.  
    - *Edge Cases:* Missing speaker data or inconsistent labels.

---

#### 1.4 Output Generation & Storage

- **Overview:**  
  This block generates user-friendly output files (Google Docs and JSON), uploads them to Google Drive, and optionally sends email notifications.

- **Nodes Involved:**  
  - Create Google Docs  
  - Google Docs1  
  - Convert to File1  
  - Upload Json  
  - Merge1  
  - MoveTranscriptAnalysis  
  - Gmail

- **Node Details:**

  - **Create Google Docs**  
    - *Type:* Google Docs node to create a new document with transcript and analysis.  
    - *Configuration:* Formats text with speaker labels, timestamps, and highlights.  
    - *Connections:* Outputs to Google Docs1 node.  
    - *Edge Cases:* Document creation limits or formatting errors.

  - **Google Docs1**  
    - *Type:* Google Docs node to update or finalize the document.  
    - *Configuration:* Adds additional content or metadata.  
    - *Connections:* Outputs to MoveTranscriptAnalysis node.  
    - *Edge Cases:* API quota or permission errors.

  - **Convert to File1**  
    - *Type:* Convert to File node to transform JSON data into downloadable file format.  
    - *Configuration:* Converts structured AI analysis JSON into a file.  
    - *Connections:* Outputs to Upload Json node.  
    - *Edge Cases:* Conversion failures.

  - **Upload Json**  
    - *Type:* Google Drive node to upload JSON analysis files.  
    - *Configuration:* Uploads converted JSON files to designated folders.  
    - *Connections:* Outputs to Merge1 node.  
    - *Edge Cases:* Upload failures.

  - **Merge1**  
    - *Type:* Merge node to combine Google Docs and JSON upload results.  
    - *Configuration:* Merges outputs for final processing.  
    - *Connections:* Outputs to Gmail node.  
    - *Edge Cases:* Data synchronization issues.

  - **MoveTranscriptAnalysis**  
    - *Type:* Google Drive node to move transcript analysis files to final folders.  
    - *Configuration:* Organizes files for easy retrieval.  
    - *Connections:* Outputs to Merge1 node.  
    - *Edge Cases:* Folder access errors.

  - **Gmail**  
    - *Type:* Gmail node to send email notifications with links to transcripts or analysis.  
    - *Configuration:* Configured with OAuth2 credentials, recipient addresses, and message templates.  
    - *Connections:* Terminal node after Merge1.  
    - *Edge Cases:* Email sending failures or authentication issues.

---

#### 1.5 Webhook & UI Interaction

- **Overview:**  
  This block provides webhook endpoints for external triggers and responds with HTML or JSON to support UI components such as transcript viewers and dropdowns.

- **Nodes Involved:**  
  - Webhook1  
  - Webhook2  
  - Webhook3  
  - Respond to Webhook  
  - Respond to Webhook1  
  - Respond to Webhook2  
  - Respond to Webhook

- **Node Details:**

  - **Webhook1**  
    - *Type:* Webhook node for receiving UI requests (e.g., transcript selection).  
    - *Connections:* Outputs to HTML node.  
    - *Edge Cases:* Invalid requests or missing parameters.

  - **HTML**  
    - *Type:* HTML node to generate UI content such as transcript viewers with clickable words and timestamps.  
    - *Connections:* Outputs to Respond to Webhook2 node.  
    - *Edge Cases:* Rendering errors or malformed HTML.

  - **Respond to Webhook2**  
    - *Type:* Respond node to send HTML content back to the client.  
    - *Connections:* Terminal node.  
    - *Edge Cases:* Response timeouts.

  - **Webhook2**  
    - *Type:* Webhook node to fetch lists of JSON transcripts or metadata.  
    - *Connections:* Outputs to GetJSONs node.  
    - *Edge Cases:* Data retrieval errors.

  - **GetJSONs**  
    - *Type:* Google Drive node to list JSON transcript files.  
    - *Connections:* Outputs to Respond to Webhook1 node.  
    - *Edge Cases:* File listing errors.

  - **Respond to Webhook1**  
    - *Type:* Respond node to send JSON lists back to the client.  
    - *Connections:* Terminal node.  
    - *Edge Cases:* Response failures.

  - **Webhook3**  
    - *Type:* Webhook node to fetch individual JSON transcript files.  
    - *Connections:* Outputs to GetJSON node.  
    - *Edge Cases:* File not found.

  - **GetJSON**  
    - *Type:* Google Drive node to download a specific JSON transcript.  
    - *Connections:* Outputs to ExtractJSON node.  
    - *Edge Cases:* Download errors.

  - **ExtractJSON**  
    - *Type:* Extract from File node to parse JSON content.  
    - *Connections:* Outputs to Respond to Webhook node.  
    - *Edge Cases:* Parsing errors.

  - **Respond to Webhook**  
    - *Type:* Respond node to send JSON transcript content back to the client.  
    - *Connections:* Terminal node.  
    - *Edge Cases:* Response timeouts.

---

#### 1.6 Setup & Initialization

- **Overview:**  
  This block initializes the environment by creating necessary folders and setting up summary and transcript JSON files in Google Drive.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Setup - Create Transcript-Evalu8r Folder  
  - SETUP - TE Summaries  
  - SETUP - TE Completed Audio  
  - SETUP - TE Transcript_json

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - *Type:* Manual trigger node for testing or initializing the workflow.  
    - *Connections:* Outputs to Setup - Create Transcript-Evalu8r Folder node.  
    - *Edge Cases:* None.

  - **Setup - Create Transcript-Evalu8r Folder**  
    - *Type:* Google Drive node to create the main folder for the workflow.  
    - *Connections:* Outputs to SETUP - TE Summaries node.  
    - *Edge Cases:* Folder already exists or permission issues.

  - **SETUP - TE Summaries**  
    - *Type:* Google Drive node to create or verify the summaries folder.  
    - *Connections:* Outputs to SETUP - TE Completed Audio node.  
    - *Edge Cases:* Folder creation errors.

  - **SETUP - TE Completed Audio**  
    - *Type:* Google Drive node to create or verify the completed audio folder.  
    - *Connections:* Outputs to SETUP - TE Transcript_json node.  
    - *Edge Cases:* Folder creation errors.

  - **SETUP - TE Transcript_json**  
    - *Type:* Google Drive node to create or verify the transcript JSON folder.  
    - *Connections:* Terminal node.  
    - *Edge Cases:* Folder creation errors.

---

### 3. Summary Table

| Node Name                      | Node Type                          | Functional Role                         | Input Node(s)                   | Output Node(s)                    | Sticky Note |
|--------------------------------|----------------------------------|---------------------------------------|---------------------------------|----------------------------------|-------------|
| Google Drive Trigger            | Google Drive Trigger              | Detect new audio files in Drive       | -                               | Google Drive Download Audio       |             |
| Webhook4                       | Webhook                          | Receive audio file uploads             | -                               | Google Drive uploadAudio          |             |
| Google Drive uploadAudio       | Google Drive                     | Upload audio files to Drive            | Webhook4                        | Respond to Webhook4, Google Drive downloadUploaded |             |
| Respond to Webhook4            | Respond to Webhook               | Confirm upload success                 | Google Drive uploadAudio        | -                                |             |
| Google Drive downloadUploaded  | Google Drive                     | Download uploaded audio for processing | Google Drive uploadAudio        | DeepGram                        |             |
| DeepGram                      | HTTP Request                    | Transcribe audio via DeepGram API      | Google Drive downloadUploaded   | ProcessJSON, Merge               |             |
| ProcessJSON                   | Code                            | Parse DeepGram transcription JSON     | DeepGram                       | SetJSONFields                   |             |
| SetJSONFields                 | Set                             | Prepare structured transcript data    | ProcessJSON                    | AI Agent                       |             |
| AI Agent                     | LangChain Agent                 | Orchestrate AI transcript analysis    | SetJSONFields, Merge           | RenameAudio, MoveAudio          |             |
| OpenAI Chat Model             | LangChain LM Chat OpenAI        | Provide GPT-4o language model          | -                             | AI Agent (ai_languageModel)     |             |
| Structured Output Parser      | LangChain Output Parser Structured | Parse AI output into structured JSON | -                             | AI Agent (ai_outputParser)      |             |
| Merge                        | Merge                           | Combine DeepGram and AI data streams   | DeepGram, AI Agent             | AI Agent, GetSpeakers           |             |
| RenameAudio                  | Google Drive                    | Rename processed audio files           | AI Agent                      | MoveAudio                      |             |
| MoveAudio                   | Google Drive                    | Move audio files to archive folder     | RenameAudio                   | Create Google Docs             |             |
| Create Google Docs           | Google Docs                     | Create transcript document              | MoveAudio                     | Google Docs1                   |             |
| Google Docs1                 | Google Docs                     | Update/finalize Google Docs document   | Create Google Docs             | MoveTranscriptAnalysis         |             |
| MoveTranscriptAnalysis       | Google Drive                    | Move transcript analysis files         | Google Docs1                  | Merge1                        |             |
| Convert to File1             | Convert to File                 | Convert AI JSON analysis to file       | GetSpeakers                   | Upload Json                   |             |
| Upload Json                 | Google Drive                    | Upload JSON analysis files              | Convert to File1              | Merge1                        |             |
| Merge1                      | Merge                          | Combine Google Docs and JSON uploads   | Upload Json, MoveTranscriptAnalysis | Gmail                      |             |
| Gmail                       | Gmail                          | Send email notifications                | Merge1                       | -                            |             |
| GetSpeakers                 | Code                           | Extract speaker info and metrics        | Merge                        | Convert to File1              |             |
| Webhook1                    | Webhook                       | UI transcript selection requests        | -                            | HTML                         |             |
| HTML                        | HTML                          | Generate interactive transcript viewer | Webhook1                     | Respond to Webhook2           |             |
| Respond to Webhook2          | Respond to Webhook             | Send HTML UI response                    | HTML                         | -                            |             |
| Webhook2                    | Webhook                       | Fetch list of JSON transcripts           | -                            | GetJSONs                     |             |
| GetJSONs                    | Google Drive                  | List JSON transcript files               | Webhook2                     | Respond to Webhook1           |             |
| Respond to Webhook1          | Respond to Webhook             | Send JSON list response                   | GetJSONs                     | -                            |             |
| Webhook3                    | Webhook                       | Fetch individual JSON transcript          | -                            | GetJSON                      |             |
| GetJSON                     | Google Drive                  | Download specific JSON transcript          | Webhook3                     | ExtractJSON                  |             |
| ExtractJSON                 | Extract from File             | Parse JSON transcript content              | GetJSON                      | Respond to Webhook            |             |
| Respond to Webhook           | Respond to Webhook             | Send JSON transcript content               | ExtractJSON                  | -                            |             |
| When clicking ‘Test workflow’ | Manual Trigger                | Manual start for setup/testing             | -                            | Setup - Create Transcript-Evalu8r Folder |             |
| Setup - Create Transcript-Evalu8r Folder | Google Drive        | Create main workflow folder                 | When clicking ‘Test workflow’ | SETUP - TE Summaries          |             |
| SETUP - TE Summaries         | Google Drive                  | Create summaries folder                      | Setup - Create Transcript-Evalu8r Folder | SETUP - TE Completed Audio |             |
| SETUP - TE Completed Audio  | Google Drive                  | Create completed audio folder                 | SETUP - TE Summaries         | SETUP - TE Transcript_json    |             |
| SETUP - TE Transcript_json  | Google Drive                  | Create transcript JSON folder                  | SETUP - TE Completed Audio   | -                            |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Input Reception Nodes:**
   - Add a **Google Drive Trigger** node configured to monitor a specific folder for new audio files.
   - Add a **Webhook** node (Webhook4) configured to receive audio file uploads via HTTP POST.
   - Connect Webhook4 to a **Google Drive** node (uploadAudio) configured to upload incoming audio files to a designated Drive folder.
   - Add a **Respond to Webhook** node (Respond to Webhook4) connected to uploadAudio to confirm successful upload.
   - Add a **Google Drive** node (downloadUploaded) connected to uploadAudio to download the uploaded audio file for processing.

2. **Set Up Audio Transcription:**
   - Add an **HTTP Request** node (DeepGram) configured to call the DeepGram Speech-to-Text API:
     - Set method to POST.
     - Attach audio file binary data.
     - Include API key in headers.
     - Request speaker diarization and timestamps.
   - Connect downloadUploaded to DeepGram.
   - Add a **Code** node (ProcessJSON) to parse DeepGram’s JSON response extracting transcript text, speakers, and timestamps.
   - Connect DeepGram to ProcessJSON.
   - Add a **Set** node (SetJSONFields) to structure the parsed data for AI analysis.
   - Connect ProcessJSON to SetJSONFields.

3. **Configure AI Analysis:**
   - Add a **LangChain OpenAI Chat Model** node configured with GPT-4o credentials and parameters (temperature, max tokens).
   - Add a **LangChain Structured Output Parser** node defining the expected JSON schema for sentiment, topics, intents, and insights.
   - Add a **LangChain AI Agent** node that uses the Chat Model and Output Parser nodes.
   - Connect SetJSONFields and a **Merge** node (to combine DeepGram and AI data) to the AI Agent.
   - Connect AI Agent output to **Google Drive** nodes for renaming (RenameAudio) and moving (MoveAudio) audio files.
   - Connect RenameAudio to MoveAudio.

4. **Generate and Store Outputs:**
   - Add a **Google Docs** node (Create Google Docs) to create a transcript document with formatted text.
   - Connect MoveAudio to Create Google Docs.
   - Add another **Google Docs** node (Google Docs1) to update or finalize the document.
   - Connect Create Google Docs to Google Docs1.
   - Add a **Google Drive** node (MoveTranscriptAnalysis) to move transcript analysis files to a final folder.
   - Connect Google Docs1 to MoveTranscriptAnalysis.
   - Add a **Code** node (GetSpeakers) to extract speaker metrics.
   - Connect Merge node output to GetSpeakers.
   - Add a **Convert to File** node (Convert to File1) to convert AI JSON analysis to a file.
   - Connect GetSpeakers to Convert to File1.
   - Add a **Google Drive** node (Upload Json) to upload JSON files.
   - Connect Convert to File1 to Upload Json.
   - Add a **Merge** node (Merge1) to combine Google Docs and JSON upload results.
   - Connect Upload Json and MoveTranscriptAnalysis to Merge1.
   - Add a **Gmail** node configured with OAuth2 credentials to send notification emails.
   - Connect Merge1 to Gmail.

5. **Set Up Webhook & UI Interaction:**
   - Add **Webhook** nodes (Webhook1, Webhook2, Webhook3) to handle UI requests for transcript selection, listing, and fetching.
   - Connect Webhook1 to an **HTML** node that generates interactive transcript viewers with clickable words and timestamps.
   - Connect HTML to a **Respond to Webhook** node (Respond to Webhook2).
   - Connect Webhook2 to a **Google Drive** node (GetJSONs) that lists JSON transcripts.
   - Connect GetJSONs to a **Respond to Webhook** node (Respond to Webhook1).
   - Connect Webhook3 to a **Google Drive** node (GetJSON) that downloads specific JSON transcripts.
   - Connect GetJSON to an **Extract from File** node (ExtractJSON) to parse JSON content.
   - Connect ExtractJSON to a **Respond to Webhook** node (Respond to Webhook).

6. **Initialize Setup & Folder Structure:**
   - Add a **Manual Trigger** node (When clicking ‘Test workflow’) for manual workflow start.
   - Connect it to a **Google Drive** node (Setup - Create Transcript-Evalu8r Folder) to create the main workflow folder.
   - Chain subsequent **Google Drive** nodes to create subfolders:
     - SETUP - TE Summaries
     - SETUP - TE Completed Audio
     - SETUP - TE Transcript_json

7. **Credentials Setup:**
   - Configure Google Drive credentials with appropriate OAuth2 scopes for file read/write.
   - Configure DeepGram API credentials (API key) in the HTTP Request node.
   - Configure OpenAI API credentials in LangChain OpenAI Chat Model node.
   - Configure Gmail OAuth2 credentials for sending emails.

8. **Parameter Configuration:**
   - Set transcription parameters in DeepGram node (language, diarization, etc.).
   - Define AI prompt templates and output schemas in LangChain nodes.
   - Set folder IDs and naming conventions in Google Drive nodes.
   - Configure webhook URLs and security settings.

9. **Testing & Validation:**
   - Use the manual trigger to initialize folders.
   - Upload test audio files via webhook or Google Drive.
   - Verify transcription and AI analysis outputs.
   - Test UI endpoints for transcript viewing.
   - Confirm email notifications are sent correctly.

---

This detailed documentation enables both human developers and AI agents to fully understand, reproduce, and extend the Transcript Evalu8r workflow with confidence, anticipating potential failure points and integration requirements.