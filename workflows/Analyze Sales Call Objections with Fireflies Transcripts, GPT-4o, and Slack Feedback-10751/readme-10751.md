Analyze Sales Call Objections with Fireflies Transcripts, GPT-4o, and Slack Feedback

https://n8nworkflows.xyz/workflows/analyze-sales-call-objections-with-fireflies-transcripts--gpt-4o--and-slack-feedback-10751


# Analyze Sales Call Objections with Fireflies Transcripts, GPT-4o, and Slack Feedback

### 1. Workflow Overview

This workflow, titled **"Analyze Sales Call Objections with Fireflies Transcripts, GPT-4o, and Slack Feedback"**, is designed to automate the analysis of sales call transcripts captured by Fireflies.ai. It targets sales operations and enablement teams aiming to gain actionable insights on objection handling during sales calls. The workflow ingests post-meeting data, processes it with AI to identify objection categories and call effectiveness, and then distributes structured feedback to sales representatives through Google Drive documents and Slack messages.

The workflow is logically divided into the following blocks:

- **1.1 Post-Meeting Trigger & Data Retrieval:** Listens for a webhook from Fireflies signaling the end of a call, then fetches transcript lists, the latest meeting details, summaries, and AI app outputs related to objections.
  
- **1.2 AI Analysis:** Prepares consolidated call data and invokes an AI agent (GPT-4o) to analyze objections, call effectiveness, and generate a summarized JSON output plus a Slack-friendly summary.

- **1.3 Formatting & Output Preparation:** Structures the AI output into readable formats, extracts key details for human consumption, and prepares content for feedback delivery.

- **1.4 Feedback Distribution:** Saves the analysis as a Google Drive document for record-keeping and sends immediate, formatted feedback to the sales rep via Slack.

---

### 2. Block-by-Block Analysis

#### 2.1 Post-Meeting Trigger & Data Retrieval

**Overview:**  
This block initiates when Fireflies.ai signals that a sales call has concluded. It waits briefly before retrieving the latest transcript list, then fetches detailed meeting information and AI-generated objection data from Fireflies.

**Nodes Involved:**  
- Fireflies Webhook Trigger  
- Wait  
- Get a list of transcripts  
- Gets Latest Meeting (code node)  
- Get AI App ID (HTTP Request)  
- Get a summary of a transcript  
- Get outputs of an AI app 1  
- Get outputs of an AI app 2

**Node Details:**

- **Fireflies Webhook Trigger**  
  - *Type:* Webhook Trigger (HTTP POST)  
  - *Purpose:* Listens for Fireflies webhook post-meeting event at path `/fireflies-call-completed`.  
  - *Config:* HTTP method POST; no auth.  
  - *Edge Cases:* Missing or malformed webhook payload; network issues.

- **Wait**  
  - *Type:* Wait node  
  - *Purpose:* Delays workflow execution by 8 minutes to ensure Fireflies AI processing completes.  
  - *Config:* Wait 8 minutes.  
  - *Edge Cases:* Delay too short may cause fetching incomplete data; too long increases latency.

- **Get a list of transcripts**  
  - *Type:* Fireflies API node (getTranscriptsList)  
  - *Purpose:* Retrieves the list of transcripts available via Fireflies API.  
  - *Config:* No filter parameters, retrieves all transcripts.  
  - *Credentials:* Fireflies API key required (AptAI Fireflies).  
  - *Edge Cases:* API rate limits, auth failures, empty transcript list.

- **Gets Latest Meeting (Code node)**  
  - *Type:* JavaScript Code node  
  - *Purpose:* Processes the transcripts list to find the most recent meeting, extracting its ID and metadata.  
  - *Key Logic:* Sorts by date descending, picks first item; extracts transcript ID, title, date, organizer email/link.  
  - *Edge Cases:* Empty input array; date parsing errors.

- **Get AI App ID (HTTP Request)**  
  - *Type:* HTTP Request (GraphQL)  
  - *Purpose:* Queries Fireflies GraphQL API for AI app outputs linked to the latest transcript ID.  
  - *Config:* POST to `https://api.fireflies.ai/graphql` with auth Bearer token (placeholder `YOUR_TOKEN_HERE`) and GraphQL query to fetch AI app outputs.  
  - *Edge Cases:* Invalid token, network errors, missing transcript ID.

- **Get a summary of a transcript**  
  - *Type:* Fireflies API node (getTranscriptSummary)  
  - *Purpose:* Fetches a summarized version of the transcript for AI input.  
  - *Config:* Transcript ID from latest meeting node.  
  - *Edge Cases:* Transcript not found, API errors.

- **Get outputs of an AI app 1 and 2**  
  - *Type:* Fireflies API nodes (aiApp outputs)  
  - *Purpose:* Fetches two separate AI app outputs related to key objections and objection handling reports from Fireflies.  
  - *Config:* Uses app IDs and transcript IDs from Get AI App ID node to retrieve detailed AI outputs.  
  - *Credentials:* Fireflies API credentials (AptAI Fireflies).  
  - *Edge Cases:* Missing app outputs, API errors, indexing errors if fewer than two apps.

---

#### 2.2 AI Analysis

**Overview:**  
This block consolidates the transcript summary and objection data, then runs an AI agent prompt to analyze objections, call effectiveness, and generate structured feedback including a Slack summary.

**Nodes Involved:**  
- Prepare Call Data  
- AI Call Analyzer  
- Call Analysis Output Structure  
- OpenAI Model  

**Node Details:**

- **Prepare Call Data**  
  - *Type:* Set node  
  - *Purpose:* Aggregates relevant data (transcript summary, rep name, call type, objection lists) into a single JSON object to feed the AI agent.  
  - *Config:* Assigns variables like `transcript`, `callType`, `repName`, `keyObjections`, and `objectionHandler` from prior nodes.  
  - *Edge Cases:* Missing or malformed input data; ensure all required fields are present.

- **AI Call Analyzer**  
  - *Type:* LangChain Agent node (AI prompt)  
  - *Purpose:* Runs a detailed AI prompt using GPT-4o that analyzes objections and call data, producing structured JSON output and a Slack summary text.  
  - *Config:* Custom prompt defines input variables, output JSON schema, objection categories, and summary rules; no hallucination allowed.  
  - *Credentials:* OpenAI API key required.  
  - *Edge Cases:* API rate limits, prompt parsing errors, unexpected AI output structure.

- **Call Analysis Output Structure**  
  - *Type:* LangChain Output Parser Structured  
  - *Purpose:* Parses the AI agent's JSON output according to a schema example to ensure structured data extraction.  
  - *Config:* JSON schema example includes metadata, objections array, summary with categories, and Slack summary.  
  - *Edge Cases:* Parsing failures if AI output deviates from schema.

- **OpenAI Model**  
  - *Type:* LangChain OpenAI Chat Model  
  - *Purpose:* Provides the GPT-4o model for the AI prompt execution.  
  - *Credentials:* Requires OpenAI API credentials.  
  - *Edge Cases:* API quota limits, connectivity issues.

---

#### 2.3 Formatting & Output Preparation

**Overview:**  
Transforms the AI output into a human-readable format, extracting call details, objections, and improvement points. Prepares variables for generating Google Docs and Slack messages.

**Nodes Involved:**  
- Format Analysis Results

**Node Details:**

- **Format Analysis Results**  
  - *Type:* Set node  
  - *Purpose:* Maps AI output fields into new variables for easy access downstream, such as `repName`, `callType`, `callDate`, formatted objections, and arrays for what went well, improvements, and next steps.  
  - *Config:* Uses JavaScript expressions to format objections and extract relevant arrays from AI output.  
  - *Edge Cases:* Missing or partial AI output; malformed arrays.

---

#### 2.4 Feedback Distribution

**Overview:**  
Distributes the analysis by creating a feedback document in Google Drive and sending an immediate Slack message to the sales representative, summarizing call insights.

**Nodes Involved:**  
- Create file from text (Google Drive)  
- Send Rep Feedback to Slack

**Node Details:**

- **Create file from text**  
  - *Type:* Google Drive node (createFromText)  
  - *Purpose:* Saves the analysis summary as a text file named with rep name, call type, and date into a specific Google Drive folder dedicated to sales rep feedback.  
  - *Config:* File content uses templated variables to include call summary, objections, what went well, and next steps.  
  - *Credentials:* Google Drive OAuth2 credentials required.  
  - *Edge Cases:* Permissions errors, folder not found, API limits.

- **Send Rep Feedback to Slack**  
  - *Type:* Slack node (chat.postMessage)  
  - *Purpose:* Sends a formatted Slack message to the rep's Slack user ID summarizing the call analysis, objections, and recommendations.  
  - *Config:* Uses OAuth2 credentials, targets specific user ID, message text built from analysis results.  
  - *Credentials:* Slack OAuth2 with chat.write scope.  
  - *Edge Cases:* Slack API rate limits, invalid user ID, network errors.

---

### 3. Summary Table

| Node Name                  | Node Type                            | Functional Role                              | Input Node(s)                    | Output Node(s)                 | Sticky Note                                                                          |
|----------------------------|------------------------------------|----------------------------------------------|---------------------------------|-------------------------------|--------------------------------------------------------------------------------------|
| Fireflies Webhook Trigger   | Webhook Trigger                    | Starts workflow on Fireflies call completion | —                               | Wait                          | ## Post-Meeting Trigger                                                             |
| Wait                       | Wait                               | Delays to allow Fireflies AI processing      | Fireflies Webhook Trigger        | Get a list of transcripts      |                                                                                      |
| Get a list of transcripts   | Fireflies API                      | Retrieves all transcripts                      | Wait                           | Gets Latest Meeting            | ## Meeting Intelligence \n**Transcripts** \n**Meeting Summaries**\n**Objection Lists**\n**AI Apps** |
| Gets Latest Meeting         | Code                              | Selects latest transcript from transcript list | Get a list of transcripts       | Get AI App ID                 |                                                                                      |
| Get AI App ID              | HTTP Request (GraphQL)             | Fetches AI app outputs for transcript         | Gets Latest Meeting             | Get a summary of a transcript  |                                                                                      |
| Get a summary of a transcript | Fireflies API                    | Fetches transcript summary                     | Get AI App ID                  | Get outputs of an AI app 1     |                                                                                      |
| Get outputs of an AI app 1 | Fireflies AI App API               | Retrieves key objections list                   | Get a summary of a transcript   | Get outputs of an AI app 2     |                                                                                      |
| Get outputs of an AI app 2 | Fireflies AI App API               | Retrieves objection handler report              | Get outputs of an AI app 1      | Prepare Call Data             |                                                                                      |
| Prepare Call Data           | Set                               | Aggregates transcript summary and objections  | Get outputs of an AI app 2      | AI Call Analyzer              |                                                                                      |
| AI Call Analyzer            | LangChain Agent                   | Analyzes objections and call effectiveness    | Prepare Call Data               | Format Analysis Results       | ## Sales Call Analyst\n**Analyzes Objection Handling, Call Effectiveness and constructs rep feedback** |
| Call Analysis Output Structure | LangChain Output Parser Structured | Parses AI JSON output into structured data     | AI Call Analyzer               | AI Call Analyzer (outputParser) |                                                                                      |
| Format Analysis Results     | Set                               | Formats AI output for human readability        | AI Call Analyzer               | Send Rep Feedback to Slack    |                                                                                      |
| Send Rep Feedback to Slack  | Slack                             | Sends call feedback message to rep            | Format Analysis Results        | Create file from text          | ## Send Feedback\n**Publishes to Google Docs Folder and instantly sends feedback to reps** |
| Create file from text       | Google Drive                      | Saves analysis document in Google Drive        | Send Rep Feedback to Slack     | —                             |                                                                                      |
| When clicking ‘Execute workflow’ | Manual Trigger               | Allows manual workflow execution for testing   | —                             | Get a list of transcripts      |                                                                                      |
| OpenAI Model                | LangChain OpenAI Model            | Provides GPT-4o model for AI prompt            | —                             | AI Call Analyzer              |                                                                                      |
| Sticky Note1               | Sticky Note                      | Post-Meeting Trigger description                | —                             | —                             | ## Post-Meeting Trigger                                                             |
| Sticky Note2               | Sticky Note                      | Meeting Intelligence description                 | —                             | —                             | ## Meeting Intelligence \n**Transcripts** \n**Meeting Summaries**\n**Objection Lists**\n**AI Apps** |
| Sticky Note3               | Sticky Note                      | Sales Call Analyst description                    | —                             | —                             | ## Sales Call Analyst\n**Analyzes Objection Handling, Call Effectiveness and constructs rep feedback** |
| Sticky Note4               | Sticky Note                      | Feedback distribution description                 | —                             | —                             | ## Send Feedback\n**Publishes to Google Docs Folder and instantly sends feedback to reps** |
| Sticky Note5               | Sticky Note                      | Workflow title and summary                        | —                             | —                             | # AI Sales Call Analyst\n**Analyzes Sales Calls, Objection Handling and Provides Rep Feedback** |
| Sticky Note                | Sticky Note                      | Workflow overview and setup instructions          | —                             | —                             | # AI Sales Call Analyst\n**Analyzes Sales Calls, Objection Handling and Provides Rep Feedback**\n\n## How it works\n1. **Post-Meeting Trigger**: Fireflies webhook triggers workflow after call ends\n2. **Meeting Intelligence**: Retrieves transcript, meeting summary, and objection lists from Fireflies\n3. **Sales Call Analyst**: AI analyzes objection handling, call effectiveness, and constructs rep feedback using OpenAI\n4. **Send Feedback**: Publishes analysis to Google Docs folder and sends feedback to rep via Slack\n\n## How to set up\n- **Connect Fireflies**: Set up webhook trigger for post-meeting events\n- **Add OpenAI key**: Configure your OpenAI API credentials\n- **Connect Slack**: Authorize Slack integration for sending feedback\n- **Connect Google Drive**: Set up folder for storing analysis documents\n\n## (Optional) Customization\n- **Analysis criteria**: Modify the AI prompts to focus on specific sales metrics or objection types\n- **Feedback format**: Customize the output structure and level of detail in rep feedback\n- **Distribution**: Add additional channels (email, CRM updates) for sharing insights |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Fireflies Webhook Trigger**  
   - Node Type: Webhook Trigger  
   - HTTP Method: POST  
   - Path: `fireflies-call-completed`  
   - Purpose: Trigger on Fireflies call completion event.

2. **Add Wait Node**  
   - Node Type: Wait  
   - Duration: 8 minutes  
   - Purpose: Delay to allow Fireflies AI apps to complete processing.

3. **Add Fireflies Node to Get Transcript List**  
   - Node Type: Fireflies API (getTranscriptsList)  
   - Credentials: Fireflies API key (AptAI Fireflies)  
   - No filters applied.

4. **Add Code Node "Gets Latest Meeting"**  
   - Input: Transcript list from previous node  
   - Logic: Sort transcripts by date descending and pick latest  
   - Output: JSON with `transcript_id`, `title`, `meeting_date`, `organizer_email`, `meeting_link`.

5. **Add HTTP Request Node "Get AI App ID"**  
   - Method: POST  
   - URL: `https://api.fireflies.ai/graphql`  
   - Headers: Authorization Bearer token (replace `YOUR_TOKEN_HERE`)  
   - Body (JSON): GraphQL query to get AI apps outputs using `transcript_id` from previous step.

6. **Add Fireflies Node "Get a summary of a transcript"**  
   - Operation: getTranscriptSummary  
   - Transcript ID: From "Gets Latest Meeting" node.

7. **Add Fireflies Node "Get outputs of an AI app 1"**  
   - Operation: aiApp outputs  
   - App ID and Transcript ID: From "Get AI App ID" node outputs (first AI app).

8. **Add Fireflies Node "Get outputs of an AI app 2"**  
   - Operation: aiApp outputs  
   - App ID and Transcript ID: From "Get AI App ID" node outputs (second AI app).

9. **Add Set Node "Prepare Call Data"**  
   - Assign variables:  
     - `transcript`: Transcript summary short summary  
     - `callType`: Set to `"Sales Call / Consultation"`  
     - `repName`: Set to `"Avi"` (replace with actual rep name dynamic source if available)  
     - `keyObjections`: Response from AI App 1 output  
     - `objectionHandler`: Response from AI App 2 output

10. **Add LangChain OpenAI Model Node**  
    - Model: `gpt-4o`  
    - Credentials: OpenAI API key configured.

11. **Add LangChain Agent Node "AI Call Analyzer"**  
    - Input: Variables from "Prepare Call Data"  
    - Prompt: Custom prompt (as defined in the workflow) to analyze objections and generate JSON + Slack summary.  
    - Use OpenAI Model node as language model.

12. **Add LangChain Output Parser Structured Node "Call Analysis Output Structure"**  
    - JSON schema as per example in workflow  
    - Connected as output parser for AI Call Analyzer node.

13. **Add Set Node "Format Analysis Results"**  
    - Map AI output fields for use in Slack and document generation:  
      - `repName`, `callType`, `callDate`, formatted objections list, `whatWentWell`, `improvements_opportunities`, `nextSteps`.

14. **Add Slack Node "Send Rep Feedback to Slack"**  
    - Authentication: Slack OAuth2 with chat.write scope  
    - User: Slack user ID of the sales rep (dynamic or static)  
    - Text: Use variables from Format Analysis Results to compose message.

15. **Add Google Drive Node "Create file from text"**  
    - Operation: createFromText  
    - Folder: Google Drive folder ID for storing feedback documents  
    - File Name: Use template with rep name, call type, call date  
    - Content: Compose text with call summary, objections, improvements, next steps  
    - Credentials: Google Drive OAuth2 configured.

16. **Connect nodes sequentially as per the workflow connections:**  
    - Fireflies Webhook Trigger → Wait → Get a list of transcripts → Gets Latest Meeting → Get AI App ID → Get a summary of a transcript → Get outputs of an AI app 1 → Get outputs of an AI app 2 → Prepare Call Data → AI Call Analyzer → Format Analysis Results → Send Rep Feedback to Slack → Create file from text.

17. **Optional: Add Manual Trigger** for testing the workflow manually by initiating from "Get a list of transcripts".

---

### 5. General Notes & Resources

| Note Content                                                                                                            | Context or Link                                                                                                  |
|-------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Workflow analyzes sales calls focusing on objection handling and rep feedback using Fireflies transcripts and GPT-4o.    | Workflow purpose summary.                                                                                         |
| Requires Fireflies API access with appropriate token and configured webhook in Fireflies.                                | Fireflies API docs: https://developers.fireflies.ai                                                             |
| OpenAI GPT-4o model used for advanced natural language understanding and JSON output formatting.                        | OpenAI API: https://platform.openai.com/docs/models/gpt-4o                                                       |
| Slack OAuth2 integration requires user ID to send direct messages with call feedback.                                    | Slack API: https://api.slack.com/authentication/oauth-v2                                                        |
| Google Drive OAuth2 integration stores call analysis documents in a dedicated folder for record-keeping.                 | Google Drive API: https://developers.google.com/drive/api                                                        |
| The workflow includes detailed sticky notes describing each major block and setup instructions for easier maintenance. | Sticky notes provide helpful context to users inside the n8n editor.                                             |
| Customize AI prompt and objection categories within the "AI Call Analyzer" node to tailor analysis to specific metrics. | Modify prompt or add new objection categories if sales strategy evolves.                                         |
| Recommended to monitor API usage quotas (OpenAI, Fireflies, Slack, Google Drive) to avoid interruptions.                 | Monitor usage dashboards and set alerts where possible.                                                         |

---

**Disclaimer:**  
The provided content is fully derived from an n8n automation workflow with no illegal, offensive, or protected data. All processed data is lawful and public.