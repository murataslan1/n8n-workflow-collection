AI-Powered Lead Outreach & Tracking with Gmail, GPT-4 & Email Sequencing

https://n8nworkflows.xyz/workflows/ai-powered-lead-outreach---tracking-with-gmail--gpt-4---email-sequencing-10948


# AI-Powered Lead Outreach & Tracking with Gmail, GPT-4 & Email Sequencing

### 1. Workflow Overview

This workflow automates lead outreach and email tracking by integrating Google Sheets, OpenAI GPT-4, Gmail, and InboxPlus tracking APIs. It targets sales and marketing teams seeking to send personalized cold outreach emails at scale while monitoring engagement via email tracking.

The workflow is logically divided into three main blocks:

- **1.1 Data Retrieval & Iteration:** Periodically reads pending leads from a Google Sheet and processes each lead individually.
- **1.2 AI Email Generation & Tracking ID Creation:** Uses GPT-4 via Langchain to generate a personalized, warm outreach email subject and HTML body per lead, then requests a unique tracking ID from InboxPlus.
- **1.3 Email Sending, Message Fetching & Tracking Sequence Initiation:** Sends the generated email via Gmail, fetches the sent email details, initiates tracking on InboxPlus, and updates the Google Sheet row status to "Done".

---

### 2. Block-by-Block Analysis

#### 2.1 Data Retrieval & Iteration

- **Overview:**  
  This block triggers the workflow on a daily schedule, fetches all rows with Status = "Pending" from the specified Google Sheet, and splits them into individual items for sequential processing.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get row(s) in sheet  
  - Loop Over Items  

- **Node Details:**  

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates workflow execution once per day at 13:00 (1 PM).  
    - Configuration: Set to trigger daily at hour 13.  
    - Inputs: None (trigger node).  
    - Outputs: Connects to "Get row(s) in sheet".  
    - Edge cases: Workflow won't run if the n8n instance is offline or paused at trigger time.

  - **Get row(s) in sheet**  
    - Type: Google Sheets node  
    - Role: Reads rows where the "Status" column is "Pending".  
    - Configuration: Reads from documentId `16vN03K8d0zjNpmMORi26Bu_juodIDZdeujzVm0lvz0o`, sheet named `gid=0` (Sheet1), filter by `Status = Pending`.  
    - Inputs: Trigger from Schedule Trigger.  
    - Outputs: Rows meeting the filter condition, passed to "Loop Over Items".  
    - Credentials: Uses Google Sheets OAuth2 credentials named "Google Sheets account - (DEV)".  
    - Edge cases: No rows match filter → no items proceed; API rate limits or authentication failure.

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Iterates over each lead row individually for processing downstream.  
    - Configuration: Default batch size (process one item at a time).  
    - Inputs: Rows from Google Sheets node.  
    - Outputs: Each item sent one-by-one to "AI Agent".  
    - Edge cases: Batch processing errors, e.g., item malformed or empty fields.

---

#### 2.2 AI Email Generation & Tracking ID Creation

- **Overview:**  
  For each lead, generates a tailored outreach email subject and HTML body using OpenAI GPT-4 via Langchain, then requests a unique tracking ID from InboxPlus to embed in the email.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  
  - Structured Output Parser  
  - Generates Tracking ID  

- **Node Details:**  

  - **AI Agent**  
    - Type: Langchain Agent node  
    - Role: Creates personalized email content as a JSON object containing `subject` and `body`.  
    - Configuration:  
      - Prompt includes detailed instructions to produce a warm, professional, concise cold outreach email following strict HTML format rules with placeholders for lead data (`Name`, `Email`, `Number`).  
      - Output is a single-line JSON with keys `subject` and `body`.  
      - Connects to OpenAI Chat Model as the underlying language model.  
      - Parses output with Structured Output Parser to enforce JSON format.  
    - Inputs: Single lead item from Loop Over Items.  
    - Outputs: JSON email content passed to "Generates Tracking ID".  
    - Edge cases:  
      - GPT-4 API errors (rate limits, timeouts).  
      - Parsing errors if output is malformed or not JSON.  
      - Missing lead fields causing prompt issues.

  - **OpenAI Chat Model**  
    - Type: Langchain OpenAI Chat Model node  
    - Role: Provides GPT-4.1-mini as the language model for the AI Agent.  
    - Configuration: Model set to `gpt-4.1-mini`.  
    - Credentials: OpenAI API key configured with "OpenAi account".  
    - Inputs: Prompt from AI Agent.  
    - Outputs: Raw model response to AI Agent.  
    - Edge cases: Authentication failure, quota exhaustion, or connectivity issues.

  - **Structured Output Parser**  
    - Type: Langchain Output Parser Structured node  
    - Role: Parses AI Agent output to enforce JSON structure with keys `subject` and `body`.  
    - Configuration: JSON schema example enforces exact keys for subject and body.  
    - Inputs: Raw AI output from OpenAI Chat Model.  
    - Outputs: Structured JSON to AI Agent node.  
    - Edge cases: Parsing failures if output deviates from expected format.

  - **Generates Tracking ID**  
    - Type: HTTP Request node  
    - Role: Calls InboxPlus API to generate a unique tracking ID for the outgoing email.  
    - Configuration: POST request to `https://api.inboxpl.us/user-emails/n8n/tracking-id` with header `api_key` set to InboxPlus API key.  
    - Inputs: AI Agent output (email content).  
    - Outputs: Tracking ID JSON to "Send a message".  
    - Edge cases: API errors, invalid API key, network timeouts.

---

#### 2.3 Email Sending, Message Fetching & Tracking Sequence Initiation

- **Overview:**  
  Sends the AI-generated email with the embedded tracking image via Gmail, fetches the sent message details, calls InboxPlus to start the tracking sequence, and updates the lead row status in the Google Sheet to "Done".

- **Nodes Involved:**  
  - Send a message  
  - Fetches Email Data  
  - Starts Sequence  
  - Append or update row in sheet  

- **Node Details:**  

  - **Send a message**  
    - Type: Gmail node  
    - Role: Sends the personalized email to the lead’s email address including the tracking image appended to the email body.  
    - Configuration:  
      - Recipient: Lead email from Loop Over Items  
      - Subject and message body: From AI Agent output (subject, body) plus tracking image URL from "Generates Tracking ID"  
      - Gmail OAuth2 credentials: "Gmail account 10 - (DEV)"  
      - Options: Append attribution disabled (no extra footer)  
    - Inputs: Tracking ID and AI-generated email from previous node.  
    - Outputs: Sent message data to "Fetches Email Data".  
    - Edge cases: Email sending errors, OAuth token expiration, invalid recipient email.

  - **Fetches Email Data**  
    - Type: Gmail node  
    - Role: Retrieves details of the sent email message by its message ID for tracking.  
    - Configuration: Uses `messageId` from the "Send a message" node output.  
    - Inputs: Sent message output from "Send a message".  
    - Outputs: Email metadata to "Starts Sequence".  
    - Edge cases: Message not found, API rate limits.

  - **Starts Sequence**  
    - Type: HTTP Request node  
    - Role: Calls InboxPlus API to start tracking the email sequence for the sent message.  
    - Configuration:  
      - POST to `https://api.inboxpl.us/user-emails/n8n`  
      - Body includes recipient email, subject, threadId, message_id, sender_email, tracking_id, and a fixed `sequenceId` ("Your_Sequence_ID").  
      - Header includes InboxPlus API key.  
    - Inputs: Email metadata from "Fetches Email Data" and tracking ID from "Generates Tracking ID".  
    - Outputs: Response to "Append or update row in sheet".  
    - Edge cases: API errors, invalid IDs, network issues.

  - **Append or update row in sheet**  
    - Type: Google Sheets node  
    - Role: Updates the lead row in Google Sheet to mark the outreach email as sent by setting `Status` to "Done" and saving relevant message info.  
    - Configuration:  
      - Document and sheet same as in data retrieval.  
      - Matching on `Email` column to update existing row.  
      - Updates columns: Email, Name, Number, Status ("Done"), and Message.  
      - Credentials: Google Sheets OAuth2 "Google Sheets account - (DEV)".  
    - Inputs: Data from "Starts Sequence".  
    - Outputs: Loops back to "Loop Over Items" to continue next lead.  
    - Edge cases: Sheet update failures, conflicts if sheet modified concurrently.

---

### 3. Summary Table

| Node Name                | Node Type                         | Functional Role                                          | Input Node(s)          | Output Node(s)          | Sticky Note                                                                                                         |
|--------------------------|----------------------------------|----------------------------------------------------------|------------------------|-------------------------|---------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger         | Schedule Trigger                 | Triggers workflow daily at 13:00                          | —                      | Get row(s) in sheet     |                                                                                                                     |
| Get row(s) in sheet       | Google Sheets                   | Reads rows with Status = "Pending"                        | Schedule Trigger        | Loop Over Items          |                                                                                                                     |
| Loop Over Items           | SplitInBatches                  | Iterates over each lead to process individually           | Get row(s) in sheet     | AI Agent                 | ## Step 1: Get rows & Loop  Reads rows with Status = "Pending" from Google Sheets and splits them into individual items to process one-by-one. |
| AI Agent                 | Langchain Agent                 | Generates personalized email subject and HTML body       | Loop Over Items         | Generates Tracking ID    | ## Step 2: AI Email & Tracking ID  AI Agent (with OpenAI + parser) creates the subject and HTML body. A tracking ID is generated via InboxPlus and attached to the outgoing message. |
| OpenAI Chat Model         | Langchain OpenAI Chat Model     | Provides GPT-4 language model for AI Agent                | AI Agent (ai_languageModel) | AI Agent (ai_outputParser) |                                                                                                                     |
| Structured Output Parser  | Langchain Output Parser         | Parses AI output to structured JSON                        | OpenAI Chat Model       | AI Agent                 |                                                                                                                     |
| Generates Tracking ID     | HTTP Request                   | Requests a tracking ID from InboxPlus                      | AI Agent                | Send a message           |                                                                                                                     |
| Send a message            | Gmail                          | Sends the personalized email with tracking image          | Generates Tracking ID   | Fetches Email Data       | ## Step 3: Send, Fetch & Start Tracking  Sends email with Gmail, fetches the sent message details, then calls InboxPlus to start the tracking sequence and updates the sheet row to "Done". |
| Fetches Email Data        | Gmail                          | Retrieves sent message details                             | Send a message          | Starts Sequence          |                                                                                                                     |
| Starts Sequence           | HTTP Request                   | Initiates tracking sequence on InboxPlus                   | Fetches Email Data      | Append or update row in sheet |                                                                                                                     |
| Append or update row in sheet | Google Sheets               | Updates lead status to "Done" and stores message info      | Starts Sequence         | Loop Over Items          |                                                                                                                     |
| Sticky Note               | Sticky Note                    | Overview of Step 1: Get rows & Loop                        | —                      | —                       | ## Step 1: Get rows & Loop  Reads rows with Status = "Pending" from Google Sheets and splits them into individual items to process one-by-one. |
| Sticky Note1              | Sticky Note                    | Overview of Step 2: AI Email & Tracking ID                 | —                      | —                       | ## Step 2: AI Email & Tracking ID  AI Agent (with OpenAI + parser) creates the subject and HTML body. A tracking ID is generated via InboxPlus and attached to the outgoing message. |
| Sticky Note2              | Sticky Note                    | Overview of Step 3: Send, Fetch & Start Tracking           | —                      | —                       | ## Step 3: Send, Fetch & Start Tracking  Sends email with Gmail, fetches the sent message details, then calls InboxPlus to start the tracking sequence and updates the sheet row to "Done". |
| Sticky Note3              | Sticky Note                    | High-level workflow overview                               | —                      | —                       | ## Automated Outreach & Email Tracking – Overview  This workflow runs daily and sends friendly outreach emails from your spreadsheet. It picks up rows marked "Pending", loops through each contact, uses an AI agent to generate a short subject and clean HTML email body, creates a tracking ID, and sends the email via Gmail. After sending, it fetches the sent message details and tells InboxPlus to start the tracking sequence. Finally, the workflow updates the sheet to mark the row as done. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger**  
   - Node Type: Schedule Trigger  
   - Set to trigger daily at 13:00 (hour 13).  
   - Connect output to next node.

2. **Add Google Sheets Node "Get row(s) in sheet"**  
   - Operation: Read rows  
   - Document ID: Your Google Sheet ID (e.g., `16vN03K8d0zjNpmMORi26Bu_juodIDZdeujzVm0lvz0o`)  
   - Sheet Name: `gid=0` or your sheet name  
   - Filter: Status column equals "Pending"  
   - Credentials: Google Sheets OAuth2 with access to your spreadsheet  
   - Connect input from Schedule Trigger.

3. **Add SplitInBatches Node "Loop Over Items"**  
   - Default batch size (1) to process each lead individually  
   - Connect input from Google Sheets node.

4. **Add Langchain OpenAI Chat Model Node "OpenAI Chat Model"**  
   - Model: `gpt-4.1-mini` or GPT-4 equivalent  
   - Credentials: OpenAI API key  
   - No additional parameters required.

5. **Add Langchain Output Parser Node "Structured Output Parser"**  
   - JSON schema example:  
     ```json
     {
       "subject": "",
       "body": ""
     }
     ```  
   - Connect input from OpenAI Chat Model node.

6. **Add Langchain Agent Node "AI Agent"**  
   - Prompt Definition:  
     - Instruct agent to write a warm, professional cold outreach email with:  
       - Subject: concise 5-8 words  
       - HTML body with `<p>`, `<br>` tags only  
       - Personalized greeting using lead name  
       - Specific opening and closing lines as per instructions  
       - Return single-line JSON with keys `subject` and `body`  
   - Connect:  
     - AI languageModel input from "OpenAI Chat Model"  
     - ai_outputParser input from "Structured Output Parser"  
     - Main input from "Loop Over Items"  
   - Outputs to next node.

7. **Add HTTP Request Node "Generates Tracking ID"**  
   - Method: POST  
   - URL: `https://api.inboxpl.us/user-emails/n8n/tracking-id`  
   - Headers: `api_key` with your InboxPlus API key  
   - Connect input from "AI Agent" output.

8. **Add Gmail Node "Send a message"**  
   - Operation: Send email  
   - Recipient: `={{ $('Loop Over Items').item.json.Email }}`  
   - Subject: `={{ $('AI Agent').item.json.output.subject }}`  
   - Message: `={{ $('AI Agent').item.json.output.body }}\n{{ $json.trackingImage }}` (append tracking image)  
   - Credentials: Gmail OAuth2 account with sending rights  
   - Connect input from "Generates Tracking ID".

9. **Add Gmail Node "Fetches Email Data"**  
   - Operation: Get message  
   - Message ID: `={{ $json.id }}` from "Send a message" output  
   - Credentials: Same Gmail OAuth2 account  
   - Connect input from "Send a message".

10. **Add HTTP Request Node "Starts Sequence"**  
    - Method: POST  
    - URL: `https://api.inboxpl.us/user-emails/n8n`  
    - Headers: `api_key` with InboxPlus API key  
    - Body parameters:  
      - recipient_email: `={{ $json.To }}`  
      - subject: `={{ $json.Subject }}`  
      - threadId: `={{ $json.threadId }}`  
      - message_id: `={{ $json.id }}`  
      - sender_email: `={{ $json.From }}`  
      - tracking_id: `={{ $('Generates Tracking ID').item.json.trackingId }}`  
      - sequenceId: `"Your_Sequence_ID"` (replace with your actual sequence ID)  
    - Connect input from "Fetches Email Data".

11. **Add Google Sheets Node "Append or update row in sheet"**  
    - Operation: Append or update row  
    - Document ID and Sheet Name: same as initial Google Sheets node  
    - Matching columns: Email  
    - Columns to update: Email, Name, Number, Status (`Done`), Message  
    - Credentials: Google Sheets OAuth2 account  
    - Connect input from "Starts Sequence".  
    - Connect output back to "Loop Over Items" to continue processing next lead.

12. **(Optional) Add Sticky Notes** to document each major step visually inside n8n for clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                 | Context or Link                                                                                                           |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| This workflow is designed to run daily, sending personalized outreach emails and tracking engagement automatically.                                                                                                                          | Sticky Note3 content overview                                                                                            |
| InboxPlus API requires a valid API key and sequence ID. Replace `"Your_Sequence_ID"` with your actual sequence identifier for email tracking.                                                                                               | InboxPlus API documentation (https://api.inboxpl.us)                                                                      |
| OpenAI GPT-4 usage requires an API key with sufficient quota; adjust model version as needed depending on your subscription.                                                                                                               | OpenAI API documentation (https://platform.openai.com/docs)                                                                |
| Gmail OAuth2 credentials must be configured with the "Send email" scope for sending messages and "Read email" scope for fetching sent message details.                                                                                      | Google OAuth2 setup guides                                                                                                |
| Google Sheets must contain columns: Email, Name, Number, Status, Message. Status "Pending" rows are processed; updated to "Done" after email sent and tracking started.                                                                       | Sheet setup details                                                                                                       |
| The AI prompt instructs strict JSON output with no extra formatting to ensure parsing reliability. Malformed outputs will cause workflow errors downstream.                                                                                  | Prompt design best practices                                                                                                |

---

*Disclaimer: The text provided is exclusively derived from an automated n8n workflow. The processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.*