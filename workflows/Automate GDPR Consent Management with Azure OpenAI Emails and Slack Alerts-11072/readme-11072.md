Automate GDPR Consent Management with Azure OpenAI Emails and Slack Alerts

https://n8nworkflows.xyz/workflows/automate-gdpr-consent-management-with-azure-openai-emails-and-slack-alerts-11072


# Automate GDPR Consent Management with Azure OpenAI Emails and Slack Alerts

### 1. Workflow Overview

This n8n workflow automates GDPR consent management by capturing user consent submissions via a webhook, securely storing the records in Google Sheets, generating personalized confirmation emails using Azure OpenAI, and notifying the internal team through Slack alerts. It is designed for organizations needing to streamline consent tracking, maintain compliance records, and enhance user communication with AI-generated emails.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Receive consent form submissions via webhook and prepare data fields.
- **1.2 Data Storage:** Append or update the consent records in a Google Sheet for audit purposes.
- **1.3 AI Email Generation:** Use Azure OpenAI to craft a professional, personalized HTML thank-you email.
- **1.4 Email Formatting & Sending:** Format the AI output and send the confirmation email via SMTP.
- **1.5 Slack Notification:** Convert the email contents into a Slack-friendly message and notify the internal team.

Supporting sticky notes provide setup instructions, security reminders, and overview explanations.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception Block

- **Overview:**  
  This block receives incoming consent form submissions via an HTTP POST webhook and extracts relevant user data (name, email, version of consent, and timestamp) into structured fields for downstream processing.

- **Nodes Involved:**  
  - Receive Consent Form  
  - Prepare Consent Record1

- **Node Details:**

  - **Receive Consent Form**  
    - Type: Webhook  
    - Role: Entry point capturing POST requests from the consent form.  
    - Configuration: Path set to a unique webhook ID; listens for POST method.  
    - Inputs: External HTTP POST request with JSON payload.  
    - Outputs: Raw JSON from request body.  
    - Failure modes: Invalid or malformed POST payloads; missing required fields.  
    - Version: 2.1  

  - **Prepare Consent Record1**  
    - Type: Set  
    - Role: Extracts and normalizes the user-submitted fields into named keys (`name`, `email`, `version`, `timestamp`).  
    - Configuration: Defines expressions to map fields from the webhook JSON body plus adds current timestamp (`$now`).  
    - Inputs: JSON from webhook node.  
    - Outputs: JSON with clean, structured data for storage.  
    - Failure modes: Missing or undefined fields in incoming data could lead to incomplete records.  
    - Version: 2

#### 2.2 Data Storage Block

- **Overview:**  
  This block appends or updates the consent data in a designated Google Sheet to maintain a centralized audit trail of consent submissions.

- **Nodes Involved:**  
  - Store Consent Record

- **Node Details:**

  - **Store Consent Record**  
    - Type: Google Sheets  
    - Role: Inserts or updates consent records in a specified Google Sheet and sheet tab.  
    - Configuration: Auto-maps input data fields (`name`, `email`, `version`, `timestamp`) to sheet columns; uses OAuth2 credentials for Google Sheets access; targets a specific spreadsheet ID and sheet tab (`gid=0`).  
    - Inputs: Structured JSON with consent data.  
    - Outputs: Confirmation of sheet write operation and passes stored data downstream.  
    - Failure modes: OAuth token expiry, insufficient permissions, sheet unavailability, quota limits, or malformed data.  
    - Version: 4.7  

#### 2.3 AI Email Generation Block

- **Overview:**  
  This block utilizes Azure OpenAI (via LangChain agent node) to generate a professional HTML confirmation email based on the user’s consent data.

- **Nodes Involved:**  
  - Generate Thank You Email  
  - Azure OpenAI Chat Model1 (auxiliary, not fully connected in this workflow)

- **Node Details:**

  - **Generate Thank You Email**  
    - Type: LangChain Agent (Azure OpenAI)  
    - Role: Accepts user data as JSON and outputs a fully formatted HTML email thanking the user and reassuring them about data security.  
    - Configuration: Uses a system prompt enforcing HTML-only output, polite and professional tone, with inline CSS allowed; prompt dynamically inserts user data fields (`name`, `email`, `version`, `timestamp`).  
    - Inputs: JSON from Google Sheets node (stored consent record).  
    - Outputs: JSON with AI-generated HTML email content.  
    - Failure modes: API key issues, Azure OpenAI service limits, malformed prompt input, network timeouts.  
    - Version: 2.2  

  - **Azure OpenAI Chat Model1**  
    - Type: LangChain Chat Model (Azure OpenAI)  
    - Role: Appears to be a disconnected or auxiliary node configured with GPT-4o-mini model; no downstream connections in this workflow.  
    - Configuration: Uses Azure OpenAI credentials.  
    - Version: 1  

#### 2.4 Email Formatting & Sending Block

- **Overview:**  
  This block formats the AI-generated HTML and email subject line, then sends the email to the user using SMTP.

- **Nodes Involved:**  
  - Format Email Data  
  - Send Confirmation Email

- **Node Details:**

  - **Format Email Data**  
    - Type: Code (JavaScript)  
    - Role: Extracts the HTML output from the AI node, sets a fixed subject line, and structures the data for the email sending node.  
    - Configuration: JavaScript code that pulls `output` property (HTML), defines subject as "Thank You for Your Submission", and returns JSON with subject and HTML body.  
    - Inputs: AI-generated HTML data.  
    - Outputs: JSON with `subject` and `html_body`.  
    - Failure modes: Unexpected AI output format or missing fields.  
    - Version: 2  

  - **Send Confirmation Email**  
    - Type: Email Send  
    - Role: Sends the personalized HTML email to the consent submitter’s email address via SMTP.  
    - Configuration: Uses SMTP credentials; `fromEmail` is fixed (`noreply@example.com`); recipient email is dynamically obtained from Google Sheets node data; uses subject and HTML body from code node.  
    - Inputs: JSON with subject, HTML body, recipient email.  
    - Outputs: Email send status.  
    - Failure modes: SMTP authentication failures, invalid recipient addresses, network errors.  
    - Version: 2.1  

#### 2.5 Slack Notification Block

- **Overview:**  
  Converts the AI-generated HTML email into plain text, extracts key user details, and sends a formatted notification message to a Slack channel.

- **Nodes Involved:**  
  - Format Slack Message  
  - Notify Team on Slack

- **Node Details:**

  - **Format Slack Message**  
    - Type: Code (JavaScript)  
    - Role: Strips HTML tags from the email body, extracts name, email, and version using regex, and constructs a Slack-formatted message summarizing the form submission.  
    - Configuration: Regex patterns to extract fields; fallback values if missing; Slack message with Markdown formatting.  
    - Inputs: JSON with `html_body` from email formatting node.  
    - Outputs: JSON with `text` for Slack message.  
    - Failure modes: HTML format changes breaking regex extraction, missing fields leading to "Not Available" placeholders.  
    - Version: 2  

  - **Notify Team on Slack**  
    - Type: Slack node  
    - Role: Posts the formatted message to a specific Slack channel using Slack API credentials.  
    - Configuration: Channel ID fixed to `C09GNB90TED` (general-information); uses OAuth token for Slack API.  
    - Inputs: JSON with Slack message text.  
    - Outputs: Slack post confirmation.  
    - Failure modes: Slack API token expiry or permission errors, wrong channel ID, network issues.  
    - Version: 2.3  

---

### 3. Summary Table

| Node Name               | Node Type                      | Functional Role                       | Input Node(s)           | Output Node(s)                | Sticky Note                                                                                              |
|-------------------------|--------------------------------|-------------------------------------|------------------------|------------------------------|--------------------------------------------------------------------------------------------------------|
| Overview Sticky         | Sticky Note                   | Workflow overview and setup steps   | —                      | —                            | Describes overall workflow, setup instructions including Google Sheets OAuth2, Azure OpenAI, SMTP, Slack |
| Trigger Section Sticky  | Sticky Note                   | Explains webhook and data prep      | —                      | —                            | Describes webhook reception and data extraction                                                        |
| Storage Section Sticky  | Sticky Note                   | Explains Google Sheets storage      | —                      | —                            | Explains data appending/updating in Google Sheets                                                      |
| AI Section Sticky       | Sticky Note                   | Explains AI email generation        | —                      | —                            | Describes Azure OpenAI usage for HTML email generation                                                 |
| Notifications Section Sticky | Sticky Note               | Explains email and Slack delivery   | —                      | —                            | Describes sending emails and Slack notifications                                                       |
| Security Sticky         | Sticky Note                   | Credentials & security guidelines   | —                      | —                            | Advises on OAuth2 and API key use; remove personal data before sharing                                 |
| Receive Consent Form    | Webhook                      | Receives consent submissions        | —                      | Prepare Consent Record1       |                                                                                                        |
| Prepare Consent Record1 | Set                          | Normalizes input data fields         | Receive Consent Form    | Store Consent Record          |                                                                                                        |
| Store Consent Record    | Google Sheets                | Stores or updates consent data       | Prepare Consent Record1 | Generate Thank You Email      |                                                                                                        |
| Generate Thank You Email | LangChain Agent (Azure OpenAI) | Generates personalized HTML email   | Store Consent Record    | Format Email Data             |                                                                                                        |
| Format Email Data       | Code                         | Extracts HTML and sets subject       | Generate Thank You Email| Format Slack Message, Send Confirmation Email |                                                                                                        |
| Format Slack Message    | Code                         | Converts HTML to Slack message       | Format Email Data       | Notify Team on Slack          |                                                                                                        |
| Send Confirmation Email | Email Send                   | Sends confirmation email via SMTP   | Format Email Data       | —                            |                                                                                                        |
| Notify Team on Slack    | Slack                        | Posts notification to Slack channel | Format Slack Message    | —                            |                                                                                                        |
| Azure OpenAI Chat Model1 | LangChain Chat Model (Azure) | Configured with GPT-4o-mini but unused | —                      | —                            | Node present but not connected in workflow                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node "Receive Consent Form"**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Unique webhook ID (e.g., `88662151-4279-4a8e-903f-616e18310dc9`)  
   - Purpose: Receive consent form submissions as JSON payload.

2. **Add Set Node "Prepare Consent Record1"**  
   - Connect input from "Receive Consent Form"  
   - Set variables:  
     - `name` = Expression: `{{$json.body.name}}`  
     - `email` = Expression: `{{$json.body.email}}`  
     - `version` = Expression: `{{$json.body.version}}`  
     - `timestamp` = Expression: `{{$now}}` (current date-time)  
   - Keep only these fields.

3. **Add Google Sheets Node "Store Consent Record"**  
   - Connect input from "Prepare Consent Record1"  
   - Operation: Append or update  
   - Document ID: Your Google Spreadsheet ID  
   - Sheet Name: Use `gid=0` or your relevant sheet tab  
   - Columns to map: `name`, `email`, `version`, `timestamp`  
   - Credentials: Configure Google Sheets OAuth2 credentials with access to the spreadsheet.

4. **Add LangChain Agent Node "Generate Thank You Email"**  
   - Connect input from "Store Consent Record"  
   - Model: Azure OpenAI via LangChain agent  
   - System Prompt:  
     ```
     You are an AI email-generation assistant.
     Your job is to take user-provided JSON input and generate a clean, responsive HTML email.

     Rules you must follow:

     The email must be fully HTML formatted (inline CSS allowed).

     The tone should be professional, polite, and reassuring.

     Insert all dynamic data (name, email, version, timestamp) wherever appropriate.

     Do not hallucinate extra fields.

     Only output HTML. No markdown, no explanations.

     Keep the email short, clear, and user-friendly.

     Confirm that the user's data will be kept safe and used only for their intended purpose.

     Use <p>, <div>, <table>, <strong> etc. for structure—avoid external CSS.
     ```  
   - Prompt: Pass JSON user data formatted with fields `name`, `email`, `version`, `timestamp`.

5. **Add Code Node "Format Email Data"**  
   - Connect input from "Generate Thank You Email"  
   - JavaScript code to:  
     - Extract `output` property as `html_body`  
     - Define `subject` as `"Thank You for Your Submission"`  
     - Return JSON with `subject` and `html_body`.

6. **Add Code Node "Format Slack Message"**  
   - Connect input from "Format Email Data"  
   - JavaScript code to:  
     - Strip HTML tags from `html_body` to generate plain text  
     - Extract `name`, `email`, `version` via regex from text  
     - Construct Slack message with Markdown formatting summarizing submission.

7. **Add Slack Node "Notify Team on Slack"**  
   - Connect input from "Format Slack Message"  
   - Select Slack channel (e.g., `general-information`)  
   - Use Slack API credentials (OAuth token with chat:write permissions)  
   - Post the formatted message.

8. **Add Email Send Node "Send Confirmation Email"**  
   - Connect input from "Format Email Data"  
   - Set:  
     - To Email: Expression from Google Sheets node `email` field  
     - From Email: Fixed, e.g., `noreply@example.com`  
     - Subject: From input `subject`  
     - HTML Body: From input `html_body`  
   - Use configured SMTP credentials.

9. **(Optional) Add LangChain Chat Model Node "Azure OpenAI Chat Model1"**  
   - Configure with Azure OpenAI credentials and model `gpt-4o-mini`  
   - Note: This node is not connected within the provided workflow; can be omitted or integrated as needed.

10. **Configure Credentials:**  
    - Google Sheets OAuth2 with access rights to your target spreadsheet.  
    - Azure OpenAI API key with permissions for the deployed model.  
    - SMTP credentials for sending emails (host, port, username, password).  
    - Slack OAuth token with channel post permissions.

11. **Activate Workflow and Use Webhook URL**  
    - Copy webhook URL from "Receive Consent Form" node.  
    - Integrate this URL as the POST action target in your GDPR consent form.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                 | Context or Link                                                                                     |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Workflow automates GDPR consent with multi-channel notification and AI-generated emails. Setup requires connecting Google Sheets OAuth2, Azure OpenAI, SMTP, and Slack API credentials.                                                    | Overview Sticky Note                                                                              |
| Ensure OAuth2 credentials for Google Sheets are correctly configured and have edit permissions on the target spreadsheet.                                                                                                                   | Security Sticky Note                                                                              |
| Use the LangChain agent node with Azure OpenAI for custom prompt control and HTML email generation. Keep prompts concise and strictly instruct for HTML output.                                                                             | AI Section Sticky Note                                                                            |
| Slack notifications provide immediate internal visibility of new consent submissions, improving team responsiveness.                                                                                                                      | Notifications Section Sticky Note                                                                |
| Remove or anonymize personal identifiers from exported workflows before sharing.                                                                                                                                                            | Security Sticky Note                                                                              |
| Replace placeholder emails (`noreply@example.com`) and Slack channel IDs with your organization's actual addresses and channels.                                                                                                           | Overview Sticky Note                                                                              |
| For detailed Google Sheets setup, refer to: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/                                                                                                               | Official n8n Google Sheets Node Documentation                                                   |
| For Azure OpenAI setup and API usage: https://learn.microsoft.com/en-us/azure/cognitive-services/openai/                                                                                                                                    | Microsoft Azure OpenAI Documentation                                                            |
| For SMTP email sending configuration: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.email-send/                                                                                                                       | Official n8n Email Send Node Documentation                                                      |
| For Slack integration and API setup: https://api.slack.com/authentication/oauth-v2                                                                                                                                                           | Slack API OAuth2 Documentation                                                                   |

---

**Disclaimer:** The text provided stems exclusively from an automated n8n workflow. It adheres strictly to content policies and contains no illegal, offensive, or protected elements. All processed data are legal and public.