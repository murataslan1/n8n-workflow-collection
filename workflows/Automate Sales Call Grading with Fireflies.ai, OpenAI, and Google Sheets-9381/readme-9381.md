Automate Sales Call Grading with Fireflies.ai, OpenAI, and Google Sheets

https://n8nworkflows.xyz/workflows/automate-sales-call-grading-with-fireflies-ai--openai--and-google-sheets-9381


# Automate Sales Call Grading with Fireflies.ai, OpenAI, and Google Sheets

### 1. Workflow Overview

This workflow automates the grading of sales/onboarding calls recorded and transcribed by Fireflies.ai, using OpenAI’s GPT-4O model to analyze transcripts and score calls based on predefined criteria. The analyzed data is then logged into a Google Sheet for tracking, and notifications are sent via Slack and Gmail for real-time alerts.

The workflow is organized into these logical blocks:

- **1.1 Input Reception:** Receives Fireflies.ai webhook POST requests containing meeting IDs.
- **1.2 Transcript Retrieval & Formatting:** Fetches the transcript from Fireflies.ai and formats it into speaker-labeled blocks with optional timestamps.
- **1.3 AI-based Transcript Analysis:** Sends the formatted transcript to OpenAI GPT-4O to extract facts, score call performance, and generate structured JSON output.
- **1.4 Post-Processing & Data Preparation:** Parses and validates the AI’s JSON output, ensures numerical scores are clamped within range, and prepares flat data for Google Sheets.
- **1.5 Data Storage:** Appends the graded call data and metadata into a Google Sheet.
- **1.6 Notifications:** Sends notification messages to Slack and Gmail indicating the Google Sheet update completion.
- **1.7 Setup and Documentation Notes:** Sticky notes provide guidance on required credentials, setup instructions, and workflow overview.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception

**Overview:**  
Starts the workflow by receiving a webhook POST request triggered by Fireflies.ai when a call transcript is ready. This node extracts the meetingId from the request body for further processing.

**Nodes Involved:**  
- Webhook

**Node Details:**  
- **Webhook**  
  - Type: n8n webhook node, HTTP POST method  
  - Configuration: Listens on path `66273cf2-950f-42e5-a386-60d643868985`  
  - Output: Passes the entire request JSON, particularly expecting `body.meetingId`  
  - Connection: Output connects to "Get a transcript" node  
  - Edge Cases: Missing or malformed webhook calls, invalid meetingId, unauthorized requests (no auth on webhook)  
  - Version: 2.1  

---

#### 1.2 Transcript Retrieval & Formatting

**Overview:**  
Retrieves the transcript data for the given meetingId from Fireflies.ai via its API. Then, processes the raw transcript sentences, grouping them by speaker and timing gaps into formatted text blocks with optional timestamps.

**Nodes Involved:**  
- Get a transcript  
- Code in JavaScript1

**Node Details:**  
- **Get a transcript**  
  - Type: Fireflies.ai API node  
  - Configuration: Uses the meetingId extracted from webhook input (`={{ $json.body.meetingId }}`)  
  - Credentials: Fireflies API key required  
  - Output: Raw transcript JSON including sentences array and speaker info  
  - Edge cases: API rate limits, invalid meetingId, network errors, missing transcript data  
  - Version: 1  

- **Code in JavaScript1**  
  - Type: Code node (JavaScript)  
  - Role: Parses transcript sentences, assigns speaker names (fallbacks if missing), sorts chronologically, groups sentences into blocks per speaker and time gaps (default gap >15s triggers new block)  
  - Formats output as formatted transcript (speaker + timestamp + paragraph) and plain transcript (speaker + paragraph)  
  - Produces metadata like title, meeting link, organizer email  
  - Key Variables: GAP_BREAK_SECONDS=15, INCLUDE_TIMESTAMPS=true, TIME_FORMAT="mm:ss"  
  - Edge cases: Missing speaker info, inconsistent timestamps, empty sentences  
  - Version: 2  

---

#### 1.3 AI-based Transcript Analysis

**Overview:**  
Passes the formatted transcript text to OpenAI GPT-4O model with a detailed system prompt to extract factual data, score the call on multiple criteria (discovery, clarity, objection handling, engagement, next steps), and produce a strict JSON response.

**Nodes Involved:**  
- Message a model

**Node Details:**  
- **Message a model**  
  - Type: OpenAI API node (LangChain wrapper)  
  - Model: GPT-4O (OpenAI GPT-4 variant)  
  - Input: The formatted transcript from previous node (`{{ $json.Transcript }}`) embedded in prompt message  
  - Prompt: Detailed system and assistant instructions enforcing strict JSON output, no hallucinations, scoring rules, string formatting rules, etc.  
  - Output: Raw LLM response expected to be JSON with fields like meeting_invitees_name, scores, pain_points, what_to_improve, etc.  
  - Credentials: OpenAI API key required  
  - Edge cases: Rate limits, malformed JSON output, hallucination, timeouts, partial responses  
  - Version: 1.8  

---

#### 1.4 Post-Processing & Data Preparation

**Overview:**  
Parses and validates the JSON output from the AI. It removes markdown fences, clamps scores to 1–5, ensures all text fields are strings, recalculates overall scores, and flattens the data structure for insertion into Google Sheets.

**Nodes Involved:**  
- Code in JavaScript

**Node Details:**  
- **Code in JavaScript**  
  - Type: JavaScript code node  
  - Key operations:  
    - Extract JSON object from raw LLM text (removing ```json fences)  
    - Validate and parse JSON, throwing errors if invalid  
    - Clamp numerical scores between 1 and 5  
    - Ensure text fields are non-null strings, trimmed  
    - Recalculate overall_score_25 and overall_score_percent (percentage of 25 max)  
    - Flatten nested scores into flat properties (e.g. scores_discovery)  
  - Edge cases: Missing or invalid JSON, parsing errors, missing fields, numeric conversion errors  
  - Version: 2  

---

#### 1.5 Data Storage

**Overview:**  
Appends the cleaned and structured call grading data into a predefined Google Sheet, mapping each field to corresponding columns for easy tracking and analysis.

**Nodes Involved:**  
- Append row in sheet

**Node Details:**  
- **Append row in sheet**  
  - Type: Google Sheets node  
  - Operation: Append row to sheet named "Sheet1" (gid=0) in document ID `1TcWkY4KVQfl7n5n9UyjiV590GdzgbCOrLvfb8d6FreA`  
  - Columns mapped include meeting invitee name/email, transcript URL, call duration, CRM used, pain points, feature requested, scores per category, overall score, notes, etc.  
  - Data sources: mixes output from AI parsing node and transcript node  
  - Credential: Google Sheets OAuth2 (ClickLessAI Google Sheets)  
  - Edge cases: API quota exceeded, invalid sheet ID, connectivity issues, data type mismatches  
  - Version: 4.7  

---

#### 1.6 Notifications

**Overview:**  
Sends a notification message to a Slack channel and an email to management to alert that the Google Sheet has been updated with the latest graded call data.

**Nodes Involved:**  
- Send a message1 (Slack)  
- Send a message (Gmail)

**Node Details:**  
- **Send a message1 (Slack)**  
  - Type: Slack node (OAuth2 authentication)  
  - Sends a simple text notification "Hey, your google sheet is ready! Go check it out!" to channel ID `C09HKQVAKB7`  
  - Credential: Slack OAuth2 API  
  - Edge cases: Token expiration, permission errors, channel not found  
  - Version: 2.3  

- **Send a message (Gmail)**  
  - Type: Gmail node (OAuth2)  
  - Sends a plain text email with subject "Grading Call System" to managment@clicklessai.de with the same notification message  
  - Credential: Gmail OAuth2  
  - Edge cases: Invalid credentials, quota limits, invalid recipient address  
  - Version: 2.1  

---

#### 1.7 Setup and Documentation Notes

**Overview:**  
Sticky notes provide setup instructions and context for the user on configuring Fireflies.ai, OpenAI credentials, Slack app, Gmail API, and a high-level workflow explanation with value proposition.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1  
- Sticky Note2  
- Sticky Note3  
- Sticky Note4  
- Sticky Note5

**Node Details:**  
- Each Sticky Note contains textual setup instructions or explanations about:  
  - Fireflies.ai API and webhook setup  
  - OpenAI API key creation and usage  
  - Slack app creation and OAuth token generation  
  - Gmail API enablement and OAuth client creation  
  - Workflow operational overview  
  - Business value and benefits of the automation  

---

### 3. Summary Table

| Node Name           | Node Type                         | Functional Role                       | Input Node(s)         | Output Node(s)                             | Sticky Note                                                                                       |
|---------------------|----------------------------------|------------------------------------|-----------------------|--------------------------------------------|-------------------------------------------------------------------------------------------------|
| Webhook             | n8n-nodes-base.webhook            | Receive Fireflies.ai webhook        | —                     | Get a transcript                           |                                                                                                 |
| Get a transcript    | @firefliesai/n8n-nodes-fireflies | Fetch transcript from Fireflies.ai  | Webhook               | Code in JavaScript1                        |                                                                                                 |
| Code in JavaScript1  | n8n-nodes-base.code               | Format transcript into speaker blocks| Get a transcript      | Message a model                            |                                                                                                 |
| Message a model      | @n8n/n8n-nodes-langchain.openAi  | Send transcript to OpenAI GPT-4O for analysis | Code in JavaScript1 | Code in JavaScript                         |                                                                                                 |
| Code in JavaScript   | n8n-nodes-base.code               | Parse and validate AI JSON output   | Message a model        | Append row in sheet                        |                                                                                                 |
| Append row in sheet  | n8n-nodes-base.googleSheets       | Append graded call data to Google Sheets | Code in JavaScript  | Send a message, Send a message1           |                                                                                                 |
| Send a message       | n8n-nodes-base.gmail              | Send email notification             | Append row in sheet    | —                                          |                                                                                                 |
| Send a message1      | n8n-nodes-base.slack              | Send Slack notification             | Append row in sheet    | —                                          |                                                                                                 |
| Sticky Note          | n8n-nodes-base.stickyNote         | Setup instructions Fireflies.ai    | —                     | —                                          | ## Setup fireflies.ai - Create an Account - Setup a Webhook in fireflies.ai - API Section: https://app.fireflies.ai/integrations/custom/n8n |
| Sticky Note1         | n8n-nodes-base.stickyNote         | Setup instructions OpenAI           | —                     | —                                          | ## Connect Open AI Credential - Go to https://platform.openai.com and log in. - Create API key etc. |
| Sticky Note2         | n8n-nodes-base.stickyNote         | Setup instructions Slack            | —                     | —                                          | ## Setup Slack - Slack API Credentials - Step-by-step app creation and token setup              |
| Sticky Note3         | n8n-nodes-base.stickyNote         | Setup instructions Gmail            | —                     | —                                          | ## Setup Gmail - Enable API and OAuth credentials creation steps                                |
| Sticky Note4         | n8n-nodes-base.stickyNote         | Workflow overview                   | —                     | —                                          | ## How it Works - Trigger via Webhook - Transcript Analysis - Lead Data Logging - Notifications  |
| Sticky Note5         | n8n-nodes-base.stickyNote         | Business value summary              | —                     | —                                          | ## Why its Valuable - Automated Reviews - Consistent Scoring - Centralized Data - Instant Alerts |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Configure HTTP Method: POST  
   - Path: `66273cf2-950f-42e5-a386-60d643868985` (or custom)  
   - Purpose: Receives Fireflies.ai webhook calls containing meetingId.

2. **Create Fireflies Transcript Retrieval Node**  
   - Type: Fireflies.ai node (custom integration)  
   - Parameter: `transcriptId` set to `={{ $json.body.meetingId }}` to get meeting transcript  
   - Credentials: Connect Fireflies API credentials  
   - Connect Webhook output to this node.

3. **Create JavaScript Code Node for Transcript Formatting**  
   - Type: Code  
   - Paste provided JavaScript to:  
     - Group sentences by speaker and timing gaps (>15s)  
     - Format transcript as speaker-labeled paragraphs with timestamps (mm:ss)  
   - Connect Fireflies transcript output to this node.

4. **Create OpenAI Model Node (Message a model)**  
   - Type: OpenAI (LangChain) node  
   - Model: GPT-4O (select from the list)  
   - Messages input:  
     - Pass formatted transcript as user content: `"=Transcript (raw):\n{{ $json.transcript_formatted }}\n\nTask: ..."` (full detailed prompt as in original)  
     - System and assistant messages with detailed instructions for JSON output and scoring rules  
   - Credentials: OpenAI API key setup required  
   - Connect transcript formatting node output to this node.

5. **Create JavaScript Code Node for AI Output Parsing**  
   - Type: Code  
   - Paste JS code that extracts JSON from LLM output, parses it, clamps scores, and flattens for sheet insertion  
   - Connect OpenAI node output to this node.

6. **Create Google Sheets Append Row Node**  
   - Type: Google Sheets  
   - Operation: Append  
   - Document ID: `1TcWkY4KVQfl7n5n9UyjiV590GdzgbCOrLvfb8d6FreA` (replace with your own)  
   - Sheet Name: Sheet1 (gid=0)  
   - Map columns to fields: meeting_invitees_name, meeting_invitees_email, pain_points, feature_requested, scores, notes, recording URL, duration, CRM used, etc. Use expressions to get data from current and prior nodes as needed.  
   - Credentials: Google Sheets OAuth2  
   - Connect AI output parsing node output to this node.

7. **Create Slack Notification Node**  
   - Type: Slack  
   - Authentication: OAuth2  
   - Channel: Select your notification channel (e.g., "demo" or specific channel ID)  
   - Message: "Hey, your google sheet is ready! Go check it out!"  
   - Connect Google Sheets append node output to this node.

8. **Create Gmail Notification Node**  
   - Type: Gmail  
   - Authentication: OAuth2  
   - Recipient: `managment@clicklessai.de` (replace with your email)  
   - Subject: "Grading Call System"  
   - Message: "Hey, your google sheet is ready! Go check it out!"  
   - Connect Google Sheets append node output to this node.

9. **Add Sticky Notes**  
   - Add nodes of type Sticky Note with content for:  
     - Fireflies.ai setup (account, webhook, API)  
     - OpenAI API key generation  
     - Slack app creation and token setup  
     - Gmail API enablement and OAuth credentials  
     - Workflow overview and value proposition  

10. **Test and Deploy**  
    - Activate the workflow.  
    - Configure Fireflies.ai webhook to call your n8n webhook URL.  
    - Ensure credentials are valid and tokens have correct scopes.  
    - Test with a sample meetingId webhook from Fireflies.ai.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                               | Context or Link                                                   |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| Setup Fireflies.ai Account and Webhook. API Section: https://app.fireflies.ai/integrations/custom/n8n                                                                                                                                                                                     | Fireflies.ai setup instructions                                  |
| Create OpenAI API key at https://platform.openai.com → Profile → View API keys → Create new secret key. Save securely.                                                                                                                                                                    | OpenAI API credential setup                                      |
| Slack API credentials setup: https://api.slack.com/apps - Create app, add OAuth scopes, install to workspace, copy Bot User OAuth Token (xoxb-...)                                                                                                                                         | Slack app creation guide                                         |
| Gmail API enablement: https://console.cloud.google.com/ - Enable Gmail API, create OAuth client ID and secret, configure consent screen, download credentials.json                                                                                                                         | Gmail API and OAuth setup                                        |
| Workflow Logic: Trigger on Fireflies.ai webhook → Retrieve & format transcript → Send to OpenAI for scoring → Parse & validate AI response → Append to Google Sheets → Notify via Slack & Gmail.                                                                                             | Workflow overview sticky note                                   |
| Value Proposition: Automated call reviews, consistent AI scoring, centralized data, instant alerts, scalable for sales/onboarding/support teams                                                                                                                                           | Business value sticky note                                       |

---

This document fully describes the "OnBoarding Call Grading System" workflow, enabling understanding, reproduction, and troubleshooting for users and automation agents alike.

---

**Disclaimer:** The text provided is exclusively from an automated workflow created with n8n, complying strictly with content policies and containing no illegal, offensive, or protected material. All handled data is legal and public.