Analyze Sales Calls & Route Leads with GPT-4o, Airtable and Trello

https://n8nworkflows.xyz/workflows/analyze-sales-calls---route-leads-with-gpt-4o--airtable-and-trello-11198


# Analyze Sales Calls & Route Leads with GPT-4o, Airtable and Trello

---

## 1. Workflow Overview

**Title:** Analyze Sales Calls & Route Leads with GPT-4o, Airtable and Trello  
**Internal Name:** AI Sales Analyst & Lead Router

This workflow automates post-sales-call processes by ingesting call recordings, transcribing them, extracting structured lead data with AI, and routing leads based on their budget and urgency. It integrates Google Drive, OpenAI GPT-4o, Airtable CRM, Trello task management, Gmail for outreach, and Slack for team notifications.

### Logical Blocks

- **1.1 Ingestion & AI Intelligence**: Detect and download new call recordings from Google Drive, transcribe audio to text, and extract structured sales lead data using GPT-4o.
- **1.2 Lead Classification & Routing**: Evaluate the extracted lead budget to classify leads as Hot (≥ $5,000) or Warm (< $5,000), then route accordingly:
  - Hot leads are logged in Airtable, a Trello card is created, and the sales team is instantly notified via Slack.
  - Warm leads receive a downsell email offer, are logged in Airtable, and a Trello card is created with lower priority.
- **1.3 Consolidation & System Logging**: Aggregate workflow data and log execution details and outcomes into Airtable for monitoring and debugging.

---

## 2. Block-by-Block Analysis

### 2.1 Ingestion & AI Intelligence

**Overview:**  
This block triggers on new call recordings uploaded to a specific Google Drive folder, downloads the audio file, transcribes it via OpenAI’s Whisper model, then sends the transcript to GPT-4o for structured data extraction.

**Nodes Involved:**  
- On new sales call upload (Google Drive Trigger)  
- Download file (Google Drive)  
- Transcribe a recording (OpenAI Whisper via Langchain)  
- Message a model (GPT-4o chat model via Langchain)

**Node Details:**

- **On new sales call upload**  
  - *Type:* Google Drive Trigger  
  - *Role:* Detects new files created in a specific Google Drive folder  
  - *Config:* Watches folder ID `1NqH02ZG-4TYtBcc88zQ4DlMXJFtQYg6U` every minute for any file creation  
  - *Input/Output:* Triggers on new file, outputs file metadata (including `id`)  
  - *Edge Cases:* Missing permissions on folder; delayed polling  
  - *Credentials:* GoogleDriveOAuth2Api (authenticated account "aiharvex@gmail.com")

- **Download file**  
  - *Type:* Google Drive node  
  - *Role:* Downloads the audio file from Google Drive using file ID from trigger  
  - *Config:* Uses dynamic expression `{{$json.id}}` for file ID  
  - *Input:* File metadata from trigger  
  - *Output:* Binary audio data for transcription  
  - *Edge Cases:* File not found, download failure, permission denied  
  - *Credentials:* GoogleDriveOAuth2Api

- **Transcribe a recording**  
  - *Type:* Langchain OpenAI audio node (Whisper)  
  - *Role:* Transcribes audio binary data to text transcript  
  - *Config:* Uses binary property `=data` containing audio file  
  - *Input:* Binary audio file from Download file  
  - *Output:* JSON containing transcription text  
  - *Edge Cases:* Unsupported audio format, transcription errors, API limits  
  - *Credentials:* OpenAiApi

- **Message a model**  
  - *Type:* Langchain OpenAI chat model node (GPT-4o)  
  - *Role:* Analyzes transcript text to extract structured lead data as JSON  
  - *Config:*  
    - Model: `chatgpt-4o-latest`  
    - System prompt enforces security rules and output format to produce structured JSON including name, budget, timeline, sentiment, and summary  
    - User message embeds transcript text dynamically  
    - Enables JSON output mode for direct parsing  
  - *Input:* Transcript text from previous node  
  - *Output:* JSON lead data with keys: `name`, `budget`, `timeline`, `sentiment`, `summary`  
  - *Error Handling:* On failure, continues error output for Slack notification  
  - *Edge Cases:* Model misinterpretation, invalid JSON output, API failures, prompt injection attempts  
  - *Credentials:* OpenAiApi

---

### 2.2 Lead Classification & Routing

**Overview:**  
Evaluates lead budget extracted by AI. If budget ≥ $5,000, routes as a Hot lead; otherwise, routes as a Warm lead with downsell options. Each path logs lead data into Airtable, creates Trello cards of appropriate priority, and either notifies Slack or sends a downsell email.

**Nodes Involved:**  
- If (budget check)  
- Create hot lead (Airtable)  
- Create high priority card (Trello)  
- Notify Slack channel (Slack)  
- Set Hot Status (Set)  
- "Downsell" prospect (Gmail)  
- Create warm lead (Airtable)  
- Create low priority card (Trello)  
- Set Warm Status (Set)  
- LLM Error (Slack)  
- Error in sending mail (Slack)

**Node Details:**

- **If**  
  - *Type:* If node  
  - *Role:* Branches workflow based on budget value extracted from GPT output  
  - *Config:* Condition checks if `budget` > 5000 (number, strict)  
  - *Input:* JSON from "Message a model" node  
  - *Output:* Two outputs: True (Hot lead), False (Warm lead)  
  - *Edge Cases:* Missing or malformed budget field causes false negative; expression evaluation errors

- **Create hot lead**  
  - *Type:* Airtable node  
  - *Role:* Creates a new record in the CRM Airtable base for hot leads  
  - *Config:* Maps extracted fields (Client Name, Budget, Timeline, Sentiment, Summary, Date) from AI output and trigger metadata  
  - *Input:* From If node (true path)  
  - *Output:* Airtable record data  
  - *Edge Cases:* Airtable API errors, invalid data types  
  - *Credentials:* Airtable Personal Access Token

- **Create high priority card**  
  - *Type:* Trello node  
  - *Role:* Creates a high-priority Trello card in a defined list for the hot lead  
  - *Config:* Card name includes client name, budget, timeline; description uses summary; due date 2 hours after creation; label applied for high priority  
  - *Input:* From Create hot lead  
  - *Output:* Trello card metadata  
  - *Edge Cases:* Trello API failures, invalid list or label IDs  
  - *Credentials:* Trello API

- **Notify Slack channel**  
  - *Type:* Slack node  
  - *Role:* Posts a notification message to a Slack channel about the hot lead  
  - *Config:* Posts lead details (Name, Budget, Timeline) without workflow link  
  - *Input:* From Create high priority card  
  - *Output:* Slack message confirmation  
  - *Edge Cases:* Slack API permissions, channel ID validity  
  - *Credentials:* Slack OAuth2

- **Set Hot Status**  
  - *Type:* Set node  
  - *Role:* Adds a log message for hot lead processing  
  - *Config:* Sets field `log_message` to "Processed Hot Lead - Sent to Slack"  
  - *Input:* From Notify Slack channel  
  - *Output:* Passes data forward  
  - *Edge Cases:* None significant

- **"Downsell" prospect**  
  - *Type:* Gmail node  
  - *Role:* Sends a personalized downsell email to the prospect when budget < 5000  
  - *Config:*  
    - Sends to the email address who last modified the Google Drive file  
    - Subject: "A different approach"  
    - Body: Explains cheaper alternative product matching budget and timeline extracted by AI  
    - Sender name set as "Hans"  
  - *Input:* From If node (false path)  
  - *Output:* Email send status  
  - *Error Handling:* Continues on error to Slack notification node  
  - *Edge Cases:* Incorrect email address, SMTP errors, quota limits  
  - *Credentials:* Gmail OAuth2

- **Create warm lead**  
  - *Type:* Airtable node  
  - *Role:* Creates a new record in CRM Airtable base for warm leads  
  - *Config:* Maps AI extracted data and trigger metadata similarly to hot lead node  
  - *Input:* From "Downsell" prospect (success path)  
  - *Output:* Airtable record data  
  - *Edge Cases:* Airtable API errors, data validation issues  
  - *Credentials:* Airtable Personal Access Token

- **Create low priority card**  
  - *Type:* Trello node  
  - *Role:* Creates a low-priority Trello card for warm leads  
  - *Config:* Similar card naming and description format, with due date 12 hours after creation; label set for low priority  
  - *Input:* From Create warm lead  
  - *Output:* Trello card metadata  
  - *Edge Cases:* Trello API errors, invalid IDs  
  - *Credentials:* Trello API

- **Set Warm Status**  
  - *Type:* Set node  
  - *Role:* Adds a log message for warm lead processing  
  - *Config:* Sets field `log_message` to "Processed Warm Lead - Sent Downsell Email"  
  - *Input:* From Create low priority card  
  - *Output:* Passes data forward  
  - *Edge Cases:* None significant

- **LLM Error**  
  - *Type:* Slack node  
  - *Role:* Notifies Slack if the AI model ("Message a model") fails or returns an error  
  - *Config:* Posts error details including date, workflow name, and node name  
  - *Input:* Error output from "Message a model" node  
  - *Credentials:* Slack OAuth2

- **Error in sending mail**  
  - *Type:* Slack node  
  - *Role:* Notifies Slack if sending the downsell email fails  
  - *Config:* Message includes workflow name and client name from AI output, recommends manual follow-up  
  - *Input:* Error output from "Downsell" prospect node  
  - *Credentials:* Slack OAuth2

---

### 2.3 Consolidation & System Logging

**Overview:**  
Aggregates the workflow data and logs outcome and execution details into a dedicated Airtable table for monitoring and debugging.

**Nodes Involved:**  
- Aggregate (n8n Aggregate node)  
- Log in DB (Airtable)

**Node Details:**

- **Aggregate**  
  - *Type:* Aggregate node  
  - *Role:* Collects and aggregates all current execution data into a single item  
  - *Config:* Uses `aggregateAllItemData` option to combine all data passing through  
  - *Input:* From Set Hot Status and Set Warm Status nodes (both lead paths converge here)  
  - *Output:* Single aggregated JSON object with log message and lead data  
  - *Edge Cases:* Large data sets may cause performance issues

- **Log in DB**  
  - *Type:* Airtable node  
  - *Role:* Creates a log record in Airtable’s "n8n System Logs" table  
  - *Config:* Maps fields:  
    - Outcome: aggregated `log_message`  
    - Sentiment, Client_Name: from AI output  
    - Timestamp: current time  
    - Execution_Id: n8n execution identifier  
  - *Input:* Aggregated data from Aggregate node  
  - *Output:* Airtable record creation confirmation  
  - *Edge Cases:* Airtable API errors, data format mismatches  
  - *Credentials:* Airtable Personal Access Token

---

## 3. Summary Table

| Node Name                | Node Type                           | Functional Role                           | Input Node(s)                | Output Node(s)                     | Sticky Note                                                                                                                                        |
|--------------------------|-----------------------------------|-----------------------------------------|-----------------------------|-----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| On new sales call upload  | Google Drive Trigger               | Detects new call recording uploads      | -                           | Download file                     | See Sticky Note4 for overall workflow summary and instructions                                                                                     |
| Download file            | Google Drive                      | Downloads call recording audio           | On new sales call upload     | Transcribe a recording            | See Sticky Note4                                                                                                                                     |
| Transcribe a recording    | Langchain OpenAI Audio Node       | Transcribes audio to text                 | Download file                | Message a model                   | See Sticky Note (Phase 1 Ingestion & AI Intelligence)                                                                                              |
| Message a model           | Langchain OpenAI Chat Node        | Extracts structured lead data from text | Transcribe a recording       | If, LLM Error                    | See Sticky Note (Phase 1 Ingestion & AI Intelligence)                                                                                              |
| If                       | If Node                          | Decides lead routing based on budget     | Message a model              | Create hot lead, "Downsell" prospect | See Sticky Note1 (Phase 2A: Hot Lead Routing), Sticky Note2 (Phase 2B: Warm Lead Routing)                                                         |
| Create hot lead           | Airtable                         | Logs hot lead data in CRM                 | If (true)                   | Create high priority card        | See Sticky Note1                                                                                                                                     |
| Create high priority card | Trello                          | Creates high priority Trello card         | Create hot lead             | Notify Slack channel             | See Sticky Note1                                                                                                                                     |
| Notify Slack channel      | Slack                           | Notifies team of hot lead                  | Create high priority card    | Set Hot Status                  | See Sticky Note1                                                                                                                                     |
| Set Hot Status            | Set                             | Adds log message for hot lead processing | Notify Slack channel         | Aggregate                      | See Sticky Note3 (Phase 3 Consolidation & System Logging)                                                                                           |
| "Downsell" prospect       | Gmail                           | Sends downsell email to warm lead         | If (false)                  | Create warm lead, Error in sending mail | See Sticky Note2                                                                                                                                     |
| Error in sending mail     | Slack                           | Alerts on email sending failure            | "Downsell" prospect         | -                             | See Sticky Note2                                                                                                                                     |
| Create warm lead          | Airtable                        | Logs warm lead data in CRM                 | "Downsell" prospect          | Create low priority card         | See Sticky Note2                                                                                                                                     |
| Create low priority card  | Trello                         | Creates low priority Trello card           | Create warm lead            | Set Warm Status                 | See Sticky Note2                                                                                                                                     |
| Set Warm Status           | Set                             | Adds log message for warm lead processing | Create low priority card      | Aggregate                      | See Sticky Note3                                                                                                                                     |
| Aggregate                 | Aggregate                      | Consolidates execution data for logging   | Set Hot Status, Set Warm Status | Log in DB                    | See Sticky Note3                                                                                                                                     |
| Log in DB                 | Airtable                       | Logs execution and outcome details         | Aggregate                   | -                             | See Sticky Note3                                                                                                                                     |
| LLM Error                 | Slack                          | Notifies on AI model processing errors    | Message a model (error)      | -                             | See Sticky Note2 (Error handling)                                                                                                                  |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a Google Drive Trigger node**:  
   - Name: `On new sales call upload`  
   - Event: `fileCreated`  
   - Poll interval: every minute  
   - Trigger on: Specific folder (set folder ID of your call recordings storage)  
   - Credentials: GoogleDriveOAuth2Api (OAuth2 with access to folder)

2. **Add Google Drive node to download file**:  
   - Name: `Download file`  
   - Operation: `download`  
   - File ID: Expression `{{$json.id}}` from trigger output  
   - Credentials: Same GoogleDriveOAuth2Api

3. **Add Langchain OpenAI Audio node for transcription**:  
   - Name: `Transcribe a recording`  
   - Resource: `audio`  
   - Operation: `transcribe`  
   - Binary Property Name: `=data` (binary audio input from Download file)  
   - Credentials: OpenAiApi (API key for OpenAI)

4. **Add Langchain OpenAI Chat node for structured data extraction**:  
   - Name: `Message a model`  
   - Model: `chatgpt-4o-latest`  
   - Messages:  
     - System prompt with security and extraction schema (copy from workflow)  
     - User prompt embedding transcript text `={{ $json.text }}`  
   - JSON Output: enabled  
   - Credentials: OpenAiApi  
   - Error handling: continue on error

5. **Add If node to branch on budget**:  
   - Name: `If`  
   - Condition: `{{$json.choices[0].message.content.budget}} > 5000` (strict number)  
   - Output True: Hot lead path  
   - Output False: Warm lead path

---

### Hot Lead Path (If True)

6. **Airtable node to create hot lead record**:  
   - Name: `Create hot lead`  
   - Base: Your Airtable CRM base  
   - Table: CRM Table (e.g., Leads)  
   - Map fields: Date, Budget, Summary, Timeline, Sentiment, Client Name from AI output and trigger metadata  
   - Credentials: Airtable Personal Access Token

7. **Trello node to create high priority card**:  
   - Name: `Create high priority card`  
   - List ID: Your Trello list for high priority leads  
   - Card Name: Include client name, budget, timeline (use expressions)  
   - Description: Use summary from Airtable record  
   - Due Date: 2 hours after creation (use date-time expression)  
   - Label ID: high priority label in Trello  
   - Credentials: Trello API

8. **Slack node to notify sales channel**:  
   - Name: `Notify Slack channel`  
   - Channel ID: Your Slack channel for lead alerts  
   - Message: Hot lead details with client name, budget, timeline  
   - Credentials: Slack OAuth2

9. **Set node to add hot lead log message**:  
   - Name: `Set Hot Status`  
   - Set `log_message` to `"Processed Hot Lead - Sent to Slack"`

---

### Warm Lead Path (If False)

10. **Gmail node to send downsell email**:  
    - Name: `"Downsell" prospect`  
    - Send To: Email of the last modifier of the Google Drive file (expression from trigger metadata)  
    - Subject: `"A different approach"`  
    - Body: Personalized downsell email referencing extracted budget and timeline  
    - Sender Name: `"Hans"`  
    - Credentials: Gmail OAuth2  
    - Error handling: continue on error

11. **Slack node for email sending error notification**:  
    - Name: `Error in sending mail`  
    - Channel ID: Slack error channel  
    - Message: Workflow name, client name, and manual follow-up instruction  
    - Credentials: Slack OAuth2

12. **Airtable node to create warm lead record**:  
    - Name: `Create warm lead`  
    - Same base and table as hot lead  
    - Map fields as with hot lead node  
    - Credentials: Airtable Personal Access Token

13. **Trello node to create low priority card**:  
    - Name: `Create low priority card`  
    - List ID: Trello list for warm leads  
    - Card Name and Description: similar format, with due date 12 hours after creation  
    - Label ID: low priority label  
    - Credentials: Trello API

14. **Set node to add warm lead log message**:  
    - Name: `Set Warm Status`  
    - Set `log_message` to `"Processed Warm Lead - Sent Downsell Email"`

---

### Consolidation & Logging

15. **Aggregate node to consolidate data**:  
    - Name: `Aggregate`  
    - Aggregate: aggregate all item data  
    - Inputs: both `Set Hot Status` and `Set Warm Status` nodes converge here

16. **Airtable node to log execution**:  
    - Name: `Log in DB`  
    - Base: Airtable logging base  
    - Table: System Logs  
    - Map fields:  
      - Outcome = `log_message` from Aggregate  
      - Sentiment, Client_Name from AI output  
      - Timestamp = now  
      - Execution_Id = n8n execution ID  
    - Credentials: Airtable Personal Access Token

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Context or Link                                                                                                                                                                                                                                                              |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This workflow automates post-call sales lead processing by transcribing calls, extracting structured data securely with GPT-4o, and routing leads based on budget thresholds. It supports hot lead alerts, warm lead downsell offers, and comprehensive logging for monitoring.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Workflow high-level description and use case summary.                                                                                                                                                                                                                        |
| The AI extraction prompt includes strict security protocols to ignore any transcript instructions or manipulations, ensuring trustworthy data extraction. Output is strictly JSON with fields: name, budget, timeline, sentiment, and summary.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | System prompt for GPT-4o in "Message a model" node.                                                                                                                                                                                                                          |
| Budget threshold is configurable in the If node (currently set at $5,000). Adjust this to filter leads as per your business rules.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Node configuration instruction.                                                                                                                                                                                                                                              |
| Airtable base requires tables for CRM leads and system logs with appropriate fields matching the mapped data (Client Name, Budget, Timeline, Sentiment, Summary, Date, Outcome, Execution Id).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Database schema requirements.                                                                                                                                                                                                                                               |
| Trello requires lists for high and low priority leads and labels set for prioritization. Configure IDs accordingly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Trello setup requirements.                                                                                                                                                                                                                                                   |
| Slack channels for notifications and error alerts must be pre-configured; ensure OAuth2 credentials have posting rights.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Slack integration notes.                                                                                                                                                                                                                                                     |
| Gmail OAuth2 credentials must allow sending email on behalf of the configured sender. Customize the downsell email content in the "Downsell" prospect node to suit your offerings.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Email configuration and customization tips.                                                                                                                                                                                                                                 |
| For testing, upload sample audio files to the monitored Google Drive folder to trigger the workflow end-to-end.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Testing instructions.                                                                                                                                                                                                                                                        |
| [OpenAI API Documentation](https://platform.openai.com/docs/) for model usage and limits.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | External resource link.                                                                                                                                                                                                                                                      |
| [n8n Airtable Node Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.airtable/) for detailed configuration options.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | External resource link.                                                                                                                                                                                                                                                      |
| [Trello API Documentation](https://developer.atlassian.com/cloud/trello/rest/api-group-cards/) for card creation and labels.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | External resource link.                                                                                                                                                                                                                                                      |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---