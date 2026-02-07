Auto-send FireFlies meeting summaries via email using Gemini 2.5 Pro

https://n8nworkflows.xyz/workflows/auto-send-fireflies-meeting-summaries-via-email-using-gemini-2-5-pro-11497


# Auto-send FireFlies meeting summaries via email using Gemini 2.5 Pro

### 1. Workflow Overview

This workflow automates the process of receiving Fireflies.ai meeting recap emails, extracting meeting details, generating a professional meeting summary email using Google Gemini 2.5 Pro AI, and sending it to a specified recipient via Gmail. It is designed to streamline meeting recap handling, ensuring comprehensive, well-structured summaries are automatically delivered without manual intervention.

The workflow is logically divided into three main blocks:

- **1.1 Email Reception & Data Extraction:** Triggered by incoming Fireflies recap emails, extracts the meeting link, retrieves the meeting transcript and summary data.
- **1.2 AI Processing & Summary Generation:** Uses Google Gemini 2.5 Pro to generate a fully formatted meeting summary email with subject and body in JSON format.
- **1.3 Email Formatting & Sending:** Parses the AI output, converts Markdown summaries to HTML, and sends the final email via Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Email Reception & Data Extraction

**Overview:**  
This block listens for new Gmail messages matching Fireflies meeting recap emails, extracts the meeting recap URL from the email content, obtains the meeting ID, and fetches the full transcript and summary data from Fireflies.ai.

**Nodes Involved:**  
- Gmail Trigger  
- Get a message  
- Set email content  
- Information Extractor  
- Get Meeting Id  
- Get a transcript  
- Get meeting overview  
- OpenAI Chat Model (Note: connected but not core in this block)

**Node Details:**

- **Gmail Trigger**  
  - Type: Trigger node for Gmail  
  - Config: Filters emails with subject containing "Your meeting recap" and sender "fred@fireflies.ai", polling every hour at minute 1  
  - Inputs: None (trigger)  
  - Outputs: Message metadata (ID)  
  - Potential Failures: OAuth token expiration, Gmail API limits, filter mismatches  
  - Credentials: Gmail OAuth2 with configured account  

- **Get a message**  
  - Type: Gmail API node to fetch full email content  
  - Config: Retrieves full message by ID from trigger output, with full payload (not simple)  
  - Inputs: Message ID from Gmail Trigger  
  - Outputs: Full email raw data including body text  
  - Potential Failures: Message not found, API rate limits, auth errors  

- **Set email content**  
  - Type: Data preparation node  
  - Config: Assigns the extracted text of the email body to a field `text` for downstream processing  
  - Inputs: Full message data  
  - Outputs: JSON with `text` field containing email body content  

- **Information Extractor**  
  - Type: LangChain Information Extractor (AI-powered)  
  - Config: Uses system prompt to extract relevant info; specifically extracts attribute `meeting_notes` (meeting link) from the email text field  
  - Inputs: `text` field from Set email content  
  - Outputs: JSON with extracted `meeting_notes` (URL)  
  - Potential Failures: Extraction inaccuracies, incomplete data, AI service failures  

- **Get Meeting Id (Code Node)**  
  - Type: JavaScript code node  
  - Function: Parses the meeting ID from the extracted meeting link by substring operations between "::" and "?"  
  - Inputs: Extracted meeting link from Information Extractor output  
  - Outputs: JSON with `meetingId` only  
  - Edge Cases: Unexpected URL format, missing delimiters leading to incorrect parsing  

- **Get a transcript**  
  - Type: Fireflies.ai node (custom integration)  
  - Config: Uses `meetingId` to fetch full transcript and summary data from Fireflies API  
  - Inputs: `meetingId` from code node  
  - Outputs: Transcript data including summaries (`short_summary`, `short_overview`, `overview`)  
  - Potential Failures: Invalid meeting ID, API errors, credential expiration  
  - Credentials: Fireflies API key configured  

- **Get meeting overview (Set node)**  
  - Type: Data preparation  
  - Config: Extracts and assigns three summary fields from transcript data to individual JSON fields for AI consumption: `short_summary`, `short_overview`, `overview`  
  - Inputs: Transcript data from Fireflies node  
  - Outputs: JSON with separated summary fields  

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat (GPT-4.1-mini)  
  - Note: Connected to Information Extractor but not core to main data flow; possibly auxiliary or experimental  

---

#### 1.2 AI Processing & Summary Generation

**Overview:**  
This block uses Google Gemini 2.5 Pro model to generate a complete meeting summary email. It consumes the meeting summaries and outputs a JSON object with email subject and body text, strictly formatted as specified.

**Nodes Involved:**  
- Email Agent (Google Gemini 2.5 Pro)  
- Get valid json (Code node)

**Node Details:**

- **Email Agent**  
  - Type: LangChain Google Gemini AI node  
  - Config:  
    - Model: Gemini 2.5 Pro  
    - System prompt: Detailed instructions for generating a comprehensive meeting summary email with no placeholders, output strictly as JSON with `subject` and `text` fields  
    - Input messages: Combine `short_summary`, `short_overview`, and `overview` to provide context for email generation  
    - Output: JSON string with email subject and body  
  - Inputs: Summary fields from Get meeting overview node  
  - Outputs: AI-generated JSON string  
  - Potential Failures: API errors, malformed JSON output, rate limits  
  - Credentials: Google Palm API (Gemini) key configured  

- **Get valid json (Code node)**  
  - Type: JavaScript code node  
  - Function: Parses the raw AI response text (JSON string) into a JSON object for downstream use  
  - Inputs: AI JSON string output from Email Agent  
  - Outputs: Parsed JSON object with `subject` and `text` fields  
  - Edge Cases: AI output not valid JSON, parsing errors  

---

#### 1.3 Email Formatting & Sending

**Overview:**  
Parses the AI-generated email body (Markdown), converts it into HTML, and sends the email via Gmail with AI-generated subject and formatted HTML body.

**Nodes Involved:**  
- MD to HTML  
- Send email

**Node Details:**

- **MD to HTML**  
  - Type: Markdown node  
  - Config: Converts Markdown text (from AI email body) to HTML for proper email rendering  
  - Inputs: Parsed AI JSON's `text` field  
  - Outputs: Email content as HTML in `text` field  
  - Edge Cases: Incorrect Markdown syntax, empty content  

- **Send email**  
  - Type: Gmail node  
  - Config:  
    - Recipient email (hardcoded as "XXX" placeholder, requires user update)  
    - Subject from AI-generated JSON `subject` field  
    - Body as HTML from Markdown conversion  
    - Attribution disabled to avoid additional signatures  
  - Inputs: HTML email content and subject  
  - Outputs: Email sent confirmation  
  - Potential Failures: Invalid recipient email, Gmail API errors, OAuth token issues  
  - Credentials: Gmail OAuth2 configured  

---

### 3. Summary Table

| Node Name          | Node Type                               | Functional Role                          | Input Node(s)           | Output Node(s)         | Sticky Note                                                                                                                         |
|--------------------|----------------------------------------|----------------------------------------|-------------------------|------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| Gmail Trigger      | n8n-nodes-base.gmailTrigger             | Trigger on Fireflies recap emails      | —                       | Get a message          | —                                                                                                                                  |
| Get a message      | n8n-nodes-base.gmail                    | Fetch full email content by ID         | Gmail Trigger           | Set email content      | —                                                                                                                                  |
| Set email content  | n8n-nodes-base.set                      | Extract email body text                 | Get a message           | Information Extractor  | —                                                                                                                                  |
| Information Extractor | @n8n/n8n-nodes-langchain.informationExtractor | Extract meeting recap URL               | Set email content       | Get Meeting Id         | Covers steps 1 and 2: Extract meeting link, fetch transcript, generate summary email                                              |
| Get Meeting Id     | n8n-nodes-base.code                     | Parse meeting ID from meeting URL      | Information Extractor   | Get a transcript       | —                                                                                                                                  |
| Get a transcript   | @firefliesai/n8n-nodes-fireflies.fireflies | Retrieve meeting transcript & summary  | Get Meeting Id          | Get meeting overview   | —                                                                                                                                  |
| Get meeting overview | n8n-nodes-base.set                    | Prepare summary fields for AI input    | Get a transcript        | Email Agent            | —                                                                                                                                  |
| Email Agent        | @n8n/n8n-nodes-langchain.googleGemini  | Generate meeting summary email JSON    | Get meeting overview    | Get valid json         | Step 2: Use Gemini 2.5 Pro to create email subject and body in JSON format                                                       |
| Get valid json     | n8n-nodes-base.code                     | Parse AI JSON output                    | Email Agent             | MD to HTML             | —                                                                                                                                  |
| MD to HTML         | n8n-nodes-base.markdown                 | Convert Markdown email body to HTML    | Get valid json          | Send email             | —                                                                                                                                  |
| Send email         | n8n-nodes-base.gmail                    | Send the generated email via Gmail     | MD to HTML              | —                      | Step 3: Set recipient email and send the AI-generated summary email                                                              |
| OpenAI Chat Model  | @n8n/n8n-nodes-langchain.lmChatOpenAi  | Auxiliary AI processing (not core flow)| —                       | Information Extractor  | —                                                                                                                                  |
| Sticky Note1       | n8n-nodes-base.stickyNote               | Documentation note                     | —                       | —                      | Step 1: Workflow extracts meeting recap URL, retrieves transcript and summaries                                                   |
| Sticky Note2       | n8n-nodes-base.stickyNote               | Documentation note                     | —                       | —                      | Step 2: Google Gemini generates comprehensive meeting summary email                                                              |
| Sticky Note3       | n8n-nodes-base.stickyNote               | Documentation note                     | —                       | —                      | Step 3: Email sending configured with Gmail node                                                                                  |
| Sticky Note4       | n8n-nodes-base.stickyNote               | Documentation note                     | —                       | —                      | Overview and setup instructions with Fireflies, Gmail, OpenAI, Gemini integration details and links                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger node**  
   - Type: Gmail Trigger  
   - Configure OAuth2 credentials for Gmail  
   - Set filters: sender = "fred@fireflies.ai", subject contains "Your meeting recap"  
   - Polling schedule: every hour, minute 1  

2. **Create Get a message node**  
   - Type: Gmail  
   - Connect input from Gmail Trigger output  
   - Operation: Get message by ID  
   - Message ID: Expression `{{$json["id"]}}` from trigger  
   - Use OAuth2 credentials (same Gmail account)  
   - Enable full message retrieval (simple = false)  

3. **Create Set email content node**  
   - Type: Set  
   - Connect input from Get a message  
   - Assign a new field `text` with the email body text extracted from the incoming message JSON (`{{$json["text"]}}` or appropriate path)  

4. **Create Information Extractor node**  
   - Type: LangChain Information Extractor  
   - Connect input from Set email content  
   - Configure system prompt: instruct extraction of relevant info only  
   - Define attribute to extract: `meeting_notes` (description: extract meeting link)  
   - Use OpenAI or configured AI credentials if needed  

5. **Create Get Meeting Id (Code node)**  
   - Type: Code (JavaScript)  
   - Connect input from Information Extractor  
   - Paste code to parse meeting ID substring between "::" and "?" from the `meeting_notes` URL  
   - Output JSON with only `{ meetingId: string }`  

6. **Create Get a transcript node**  
   - Type: Fireflies.ai node  
   - Connect input from Get Meeting Id  
   - Set transcriptId parameter to `{{$json.meetingId}}`  
   - Configure Fireflies API credentials  

7. **Create Get meeting overview node**  
   - Type: Set  
   - Connect input from Get a transcript  
   - Map transcript summary fields `data.summary.short_summary`, `short_overview`, and `overview` to JSON fields `short_summary`, `short_overview`, `overview`  

8. **Create Email Agent node**  
   - Type: LangChain Google Gemini  
   - Connect input from Get meeting overview  
   - Set modelId to "models/gemini-2.5-pro"  
   - Configure system message prompt to instruct comprehensive meeting summary email generation, with output strictly JSON containing `subject` and `text`  
   - Provide input messages combining the three summary fields for context  
   - Configure Google Palm API credentials  

9. **Create Get valid json node (Code node)**  
   - Type: Code (JavaScript)  
   - Connect input from Email Agent  
   - Parse AI response text (JSON string) into JSON object  
   - Output parsed JSON for further nodes  

10. **Create MD to HTML node**  
    - Type: Markdown  
    - Connect input from Get valid json  
    - Convert Markdown content in `text` field to HTML format  

11. **Create Send email node**  
    - Type: Gmail  
    - Connect input from MD to HTML  
    - Configure recipient email address (replace "XXX" placeholder)  
    - Subject: Use expression from JSON `{{$json.subject}}`  
    - Message body: Use HTML from `{{$json.text}}`  
    - Disable append attribution/signature  
    - Use Gmail OAuth2 credentials  

12. **Activate workflow and test**  
    - Send a Fireflies meeting recap email to the Gmail account configured to verify end-to-end automation  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                 | Context or Link                                                                                               |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| This workflow automates processing of Fireflies.ai meeting recap emails, generating professional summary emails using Google Gemini 2.5 Pro AI, and sending them via Gmail.                                                                                  | Overview sticky note in workflow; see Fireflies.ai signup: https://app.fireflies.ai/login?referralCode=01K0V2Z1QHY76ZGY9450251C99 |
| Setup requires Gmail OAuth2 credentials for triggering and sending emails, Fireflies API credentials, and Google Palm API key for Gemini. OpenAI credentials are optional depending on Information Extractor usage.                                            | Setup instructions in Sticky Note4                                                                              |
| The AI prompt in the Email Agent node enforces strict JSON output format to ensure reliable parsing and email generation. Avoid modifying the format unless adapting downstream nodes accordingly.                                                            | Email Agent node parameters                                                                                    |
| Replace placeholder recipient email in Send email node before activating workflow to avoid sending to unintended addresses.                                                                                                                                    | Send email node configuration                                                                                   |
| Potential failure points include Gmail API limits, Fireflies API errors, malformed AI outputs, and credential expirations. Monitoring and error handling should be implemented in production environments.                                                     | General operational notes                                                                                         |

---

**Disclaimer:** The provided text is extracted solely from an automated n8n workflow. All content adheres to current content policies and contains no illegal or protected material. All data processed is legal and publicly accessible.