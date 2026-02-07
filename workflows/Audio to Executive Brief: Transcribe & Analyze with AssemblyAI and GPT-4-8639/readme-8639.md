Audio to Executive Brief: Transcribe & Analyze with AssemblyAI and GPT-4

https://n8nworkflows.xyz/workflows/audio-to-executive-brief--transcribe---analyze-with-assemblyai-and-gpt-4-8639


# Audio to Executive Brief: Transcribe & Analyze with AssemblyAI and GPT-4

### 1. Workflow Overview

This workflow, titled **Audio to Executive Brief: Transcribe & Analyze with AssemblyAI and GPT-4**, automates the process of converting audio files into detailed executive summaries. It targets users who want to quickly generate actionable insights from meetings, lectures, or podcasts by transcribing audio and analyzing its content with AI.

The workflow supports two input methods:

- **1.1 Form Submission with Local Audio File Upload**  
- **1.2 Form Submission with Google Drive Audio Link**

After receiving audio input, the workflow proceeds through three main logical blocks:

- **2.1 Audio Upload and Transcription Request to AssemblyAI**: Upload audio files (either from local upload or Google Drive download) to AssemblyAI and request transcription.

- **2.2 Polling and Transcript Retrieval**: Uses a Wait + If loop to poll AssemblyAI until the transcription is marked as completed, then fetches the transcript text.

- **2.3 AI Analysis and Email Delivery**: Sends the transcript text to OpenAI GPT-4 for structured analysis including summary, sentiment, key points, action items, quotes, and topics. The results are then formatted into an HTML email and sent via Gmail.

Supporting elements include sticky notes for documentation, error handling through conditions, and a clean workflow termination node.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception: Form Submission and File Preparation

**Overview:**  
This block handles user input via web forms. It supports uploading a local audio file directly or submitting a Google Drive link to an audio file. The Google Drive link is parsed to extract the file ID, then the file is fetched for further processing.

**Nodes Involved:**  
- Audio_on form submission (Google Drive link form)  
- Extract File ID from Link  
- Fetch File from Google Drive  
- Audio_on form submission1 (Local file upload form)  

**Node Details:**

- **Audio_on form submission**  
  - Type: Form Trigger  
  - Role: Receives user input via form including audio file link on Google Drive and email address  
  - Config: Form fields include "Name of the Audio file", "Provide the URL/Link of the audio file", and "E-mail" (required)  
  - Input/Output: Starts workflow, outputs form data  
  - Edge Cases: Invalid or malformed Google Drive URL could cause failure downstream  

- **Extract File ID from Link**  
  - Type: Code (JavaScript)  
  - Role: Parses Google Drive URL to extract the file ID using regex  
  - Key Expression: Regex matching `/\/d\/|id=([A-Za-z0-9_-]{20,})/`  
  - Input: Form data from previous node  
  - Output: JSON with extracted `fileId`  
  - Edge Cases: Throws error if extraction fails, blocking workflow  

- **Fetch File from Google Drive**  
  - Type: Google Drive Node  
  - Role: Downloads audio file from Google Drive using extracted fileId  
  - Config: Operation "download", outputs binary file data  
  - Credentials: Requires configured Google Drive OAuth2 credentials  
  - Input: fileId from code node  
  - Output: Binary audio file ready for upload to AssemblyAI  
  - Edge Cases: Permission errors, file not found, expired tokens  

- **Audio_on form submission1**  
  - Type: Form Trigger  
  - Role: Receives user input via form including local audio file upload and email  
  - Config: Fields "Name of the Audio file", file upload field (accepts .MP4), and "E-mail" (all required)  
  - Output: Binary audio file plus metadata  
  - Edge Cases: Unsupported file formats or empty uploads  

---

#### 2.2 Audio Upload and Transcription Request to AssemblyAI

**Overview:**  
This block uploads the audio file data to AssemblyAI, then requests transcription generation with specific options (punctuation, auto-highlights).

**Nodes Involved:**  
- Upload File to AssemblyAI (used for Google Drive flow)  
- Upload Audio file to Assembly AI1 (used for local upload flow)  
- Request Transcript from AssemblyAI (Google Drive flow)  
- Request Transcript from AssemblyAI1 (local upload flow)  

**Node Details:**

- **Upload File to AssemblyAI**  
  - Type: HTTP Request (POST)  
  - Role: Uploads binary audio data from Google Drive download to AssemblyAI's upload endpoint  
  - Config: URL `https://api.assemblyai.com/v2/upload`, Authorization header with AssemblyAI API key, binary data in request body  
  - Input: Binary audio file from Google Drive fetch  
  - Output: JSON containing `upload_url` for the uploaded file  
  - Edge Cases: API key issues, network timeouts, large file upload failures  

- **Upload Audio file to Assembly AI1**  
  - Type: HTTP Request (POST)  
  - Role: Uploads binary audio data from local file upload form to AssemblyAI  
  - Config: Same as above, with appropriate input binary property name  
  - Input: Binary audio file from form upload  
  - Output: JSON with `upload_url`  

- **Request Transcript from AssemblyAI**  
  - Type: HTTP Request (POST)  
  - Role: Initiates transcription request on AssemblyAI with uploaded audio URL  
  - Config: URL `https://api.assemblyai.com/v2/transcript`, JSON body includes audio_url, speaker_labels=false, auto_highlights=true, punctuate=true  
  - Input: `upload_url` from previous node  
  - Output: JSON with transcription job ID and status  
  - Edge Cases: API limit exceeded, invalid URL, request formatting errors  

- **Request Transcript from AssemblyAI1**  
  - Type: HTTP Request (POST)  
  - Role: Same as above but for local upload flow  
  - Input and Output as above  

---

#### 2.3 Polling and Transcript Retrieval

**Overview:**  
This block polls AssemblyAI to check if the transcription is completed. It uses a Wait node to delay between polls, then an If node to branch depending on status. Once completed, it retrieves the transcript text for analysis.

**Nodes Involved:**  
- Wait  
- Get Transcript  
- If  

**Node Details:**

- **Wait**  
  - Type: Wait  
  - Role: Pauses execution for 10 seconds between polling attempts to avoid rate limits and excessive API calls  
  - Config: Wait time set to 10 seconds  
  - Input: After transcription request nodes  
  - Output: Triggers next transcript retrieval request  

- **Get Transcript**  
  - Type: HTTP Request (GET)  
  - Role: Retrieves transcript details (including full text) from AssemblyAI using transcription job ID  
  - Config: URL templated with transcript ID, Authorization header with API key  
  - Input: Transcription job ID from previous request node or Wait node  
  - Output: JSON with transcript status and text  
  - Edge Cases: API errors, transcript not found, network issues  

- **If**  
  - Type: Conditional (If)  
  - Role: Checks if transcript status equals "completed"  
  - Config: Condition compares `$json.status` to "completed" (case sensitive)  
  - Input: Transcript data from Get Transcript  
  - Output:  
    - If true: Pass transcript to AI Analysis block  
    - If false: Loop back to Wait node to poll again  
  - Edge Cases: Unexpected status values, missing status field  

---

#### 2.4 AI Analysis and Email Delivery

**Overview:**  
Once the transcript is ready, this block sends the transcript text to OpenAI GPT-4 via LangChain node for structured analysis. The AI returns a JSON with summary, sentiment, key points, action items, quotes, and topics. The output is formatted as an HTML email and sent to the user.

**Nodes Involved:**  
- Transcript Analysis (AI)  
- Send Analysis Email  
- The End  

**Node Details:**

- **Transcript Analysis (AI)**  
  - Type: OpenAI Node (LangChain)  
  - Role: Sends transcript text to GPT-4 model for in-depth analysis and structured JSON output  
  - Config: Model GPT-4.1-mini, system prompt instructs strict JSON output with defined fields (summary, sentiment_label, sentiment_score, key_points, action_items, notable_quotes, topics)  
  - Input: Transcript text from Get Transcript node  
  - Output: JSON with analysis results  
  - Credentials: OpenAI API key configured  
  - Edge Cases: API rate limits, malformed transcript text, OpenAI service outages  

- **Send Analysis Email**  
  - Type: Gmail Node  
  - Role: Sends a formatted HTML email with AI analysis results to the provided email address  
  - Config:  
    - Recipient email taken from form submission (manual placeholder in JSON)  
    - Subject includes timestamp  
    - HTML body dynamically built with summary table, lists, and formatting  
  - Credentials: Gmail OAuth2 credentials configured  
  - Input: AI analysis JSON  
  - Edge Cases: Email sending errors, invalid recipient email, Gmail API limits  

- **The End**  
  - Type: NoOp (No Operation)  
  - Role: Marks end of workflow chain with no action  
  - Input: From Send Analysis Email node  

---

### 3. Summary Table

| Node Name                     | Node Type               | Functional Role                                  | Input Node(s)                        | Output Node(s)                     | Sticky Note                                                                                                          |
|-------------------------------|-------------------------|-------------------------------------------------|------------------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Audio_on form submission       | Form Trigger            | Receive Google Drive link input & email         | N/A                                | Extract File ID from Link          | ### Execution flow Form submission + Google Drive link<br>#### Receive Google Drive Link                              |
| Extract File ID from Link      | Code                    | Extract Google Drive file ID from URL            | Audio_on form submission            | Fetch File from Google Drive       |                                                                                                                      |
| Fetch File from Google Drive   | Google Drive            | Download audio file binary from Drive            | Extract File ID from Link           | Upload File to AssemblyAI          | ### Assembly AI                                                                                                       |
| Upload File to AssemblyAI      | HTTP Request            | Upload binary audio to AssemblyAI                 | Fetch File from Google Drive        | Request Transcript from AssemblyAI | ### Assembly AI                                                                                                       |
| Request Transcript from AssemblyAI | HTTP Request        | Request transcription generation on AssemblyAI   | Upload File to AssemblyAI           | Wait                             |                                                                                                                      |
| Audio_on form submission1      | Form Trigger            | Receive local file upload & email                 | N/A                                | Upload Audio file to Assembly AI1  | ### Execution flow Form submission + Local file<br>#### Upload an audio file                                         |
| Upload Audio file to Assembly AI1 | HTTP Request         | Upload local audio file to AssemblyAI             | Audio_on form submission1           | Request Transcript from AssemblyAI1 | ### Assembly AI                                                                                                       |
| Request Transcript from AssemblyAI1 | HTTP Request        | Request transcription for local upload            | Upload Audio file to Assembly AI1   | Wait                             |                                                                                                                      |
| Wait                          | Wait                    | Wait 10 seconds between polling attempts          | Request Transcript from AssemblyAI / Request Transcript from AssemblyAI1 | Get Transcript                   | ### Generate Transcript from Voice to text                                                                            |
| Get Transcript                | HTTP Request            | Retrieve transcript details from AssemblyAI       | Wait                              | If                               | ### Assembly AI                                                                                                       |
| If                           | If                      | Check if transcription status is completed        | Get Transcript                    | Transcript Analysis (AI) / Wait   | ### Generate summary, Sentiment Analysis and send E-mail                                                             |
| Transcript Analysis (AI)       | OpenAI (LangChain)      | Analyze transcript and produce structured summary | If (status=completed)               | Send Analysis Email               |                                                                                                                      |
| Send Analysis Email           | Gmail                   | Send formatted analysis email to user             | Transcript Analysis (AI)            | The End                         |                                                                                                                      |
| The End                      | NoOp                    | End of workflow                                     | Send Analysis Email                | N/A                             |                                                                                                                      |
| Sticky Note1                  | Sticky Note             | Documentation for local file upload flow           | N/A                                | N/A                             | ### Execution flow Form submission + Local file<br>#### Upload an audio file                                         |
| Sticky Note2                  | Sticky Note             | Documentation for transcription generation         | N/A                                | N/A                             | ### Generate Transcript from Voice to text                                                                            |
| Sticky Note3                  | Sticky Note             | Documentation for AI analysis and email delivery   | N/A                                | N/A                             | ### Generate summary, Sentiment Analysis and send E-mail                                                             |
| Sticky Note4                  | Sticky Note             | Assembly AI explanation                             | N/A                                | N/A                             | ### Assembly AI                                                                                                       |
| Sticky Note6                  | Sticky Note             | Assembly AI explanation                             | N/A                                | N/A                             | ### Assembly AI                                                                                                       |
| Sticky Note7                  | Sticky Note             | Documentation for Google Drive link flow            | N/A                                | N/A                             | ### Execution flow Form submission + Google Drive link<br>#### Receive Google Drive Link                              |
| Sticky Note8                  | Sticky Note             | Assembly AI explanation                             | N/A                                | N/A                             | ### Assembly AI                                                                                                       |
| Sticky Note                   | Sticky Note             | General introduction and detailed instructions      | N/A                                | N/A                             | See section 5 below                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Two Form Trigger Nodes:**

   - **Google Drive Link Form:**  
     - Type: Form Trigger  
     - Title: "Upload your Audio file"  
     - Fields:  
       - "Name of the Audio file" (required)  
       - "Provide the URL/Link of the audio file" (required)  
       - "E-mail" (required, email type)  

   - **Local File Upload Form:**  
     - Type: Form Trigger  
     - Title: "Upload your Audio file"  
     - Fields:  
       - "Name of the Audio file" (required)  
       - File upload field (accepts .MP4, required)  
       - "E-mail" (required, email type)  

2. **Google Drive Link Flow:**

   - Connect Google Drive form node output to a **Code node** named "Extract File ID from Link" with this JavaScript:  
     ```javascript
     const link = $json['Provide the URL/Link of the audio file'] || $json.drive_link || '';
     const m = link.match(/(?:\/d\/|id=)([A-Za-z0-9_-]{20,})/);
     if (!m) throw new Error('Could not extract Google Drive file ID from the form field.');
     return [{ fileId: m[1] }];
     ```
   - Connect code node to **Google Drive node** configured to:  
     - Operation: download  
     - File ID: `{{$json.fileId}}` (expression)  
     - Credentials: Your Google Drive OAuth2 credentials  
     - Output: Binary file property  

   - Connect Google Drive node to **HTTP Request node** named "Upload File to AssemblyAI":  
     - Method: POST  
     - URL: `https://api.assemblyai.com/v2/upload`  
     - Content Type: binaryData  
     - Input Data Field Name: binary data from Google Drive node  
     - Headers:  
       - Authorization: Your AssemblyAI API key  
     - Output: JSON with `upload_url`  

   - Connect to **HTTP Request node** named "Request Transcript from AssemblyAI":  
     - Method: POST  
     - URL: `https://api.assemblyai.com/v2/transcript`  
     - Body Type: JSON  
     - Body:  
       ```json
       {
         "audio_url": "{{$json.upload_url}}",
         "speaker_labels": false,
         "auto_highlights": true,
         "punctuate": true
       }
       ```  
     - Headers: Authorization with AssemblyAI API key  

3. **Local File Upload Flow:**

   - Connect local file upload form node to **HTTP Request node** "Upload Audio file to Assembly AI1":  
     - Method: POST  
     - URL: `https://api.assemblyai.com/v2/upload`  
     - Content Type: binaryData  
     - Input Data Field Name: binary file from form upload  
     - Headers: Authorization with AssemblyAI API key  

   - Connect to **HTTP Request node** "Request Transcript from AssemblyAI1":  
     - Method: POST  
     - URL: `https://api.assemblyai.com/v2/transcript`  
     - Body: audio_url from upload node output  
     - Headers: Authorization with AssemblyAI API key  

4. **Polling for Transcript Completion:**

   - From both transcription request nodes, connect to a **Wait node**:  
     - Duration: 10 seconds  

   - Connect Wait node to **HTTP Request node** "Get Transcript":  
     - Method: GET  
     - URL: `https://api.assemblyai.com/v2/transcript/{{ $json.id }}`  
     - Headers: Authorization with AssemblyAI API key  

   - Connect "Get Transcript" node to an **If node**:  
     - Condition: `$json.status` equals "completed" (string, case sensitive)  

   - If false: loop back to Wait node to poll again  
   - If true: proceed to AI analysis  

5. **AI Analysis:**

   - Add an **OpenAI LangChain node** named "Transcript Analysis (AI)":  
     - Model: GPT-4.1-mini  
     - System prompt: Instructions to parse transcript text and return strict JSON with keys: summary, sentiment_label, sentiment_score, key_points, action_items, notable_quotes, topics  
     - Input: Transcript text from Get Transcript node  
     - Credentials: OpenAI API key  

6. **Email Delivery:**

   - Add a **Gmail node** "Send Analysis Email":  
     - Send To: Email address collected from form submission (replace placeholder)  
     - Subject: Include timestamp `Transcript summary & sentiment – {{ $now.toISO() }}`  
     - Message (HTML): Use JavaScript expression to build a styled HTML table with AI analysis JSON content (summary, sentiment, key points, action items, quotes, topics)  
     - Credentials: Gmail OAuth2 credentials  

7. **Workflow End:**

   - Connect Gmail node to a **NoOp node** "The End" to mark completion  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                               | Context or Link                                    |
|------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| This n8n template demonstrates AI-powered transformation of audio files into actionable insights, supporting both local uploads and Google Drive links.   | General workflow introduction                      |
| For help, join the [n8n Forum](https://community.n8n.io) or the n8n Discord community.                                                                      | Community support links                            |
| Ensure AssemblyAI, OpenAI, Google Drive, and Gmail credentials are properly set up in n8n before running this workflow.                                    | Credential setup reminder                          |
| The AI prompt enforces strict JSON output for predictable parsing and downstream processing.                                                              | Important for integration robustness               |
| The workflow uses a polling loop with a 10-second delay to avoid rate limits when waiting for transcription completion.                                    | Performance and cost optimization note             |
| Email formatting uses inline CSS and dynamic HTML generation for professional report delivery.                                                             | Email rendering best practices                      |

---

**Disclaimer:**  
The provided workflow text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.