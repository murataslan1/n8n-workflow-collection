Analyze & Sort Suspicious Email Contents with ChatGPT

https://n8nworkflows.xyz/workflows/analyze---sort-suspicious-email-contents-with-chatgpt-2666


# Analyze & Sort Suspicious Email Contents with ChatGPT

### 1. Workflow Overview

This workflow automates the analysis and sorting of suspicious email contents using ChatGPT and Jira integration. It targets IT security teams, MSPs, and organizations that need to efficiently detect and report phishing emails by automating manual, error-prone processes.

The workflow is logically divided into the following blocks:

- **1.1 Email Integration & Data Extraction**  
  Captures incoming emails from Gmail or Microsoft Outlook and extracts key email data such as subject, recipients, body, and headers.

- **1.2 Email Content Preparation**  
  Structures extracted data into variables, converts the email body to a text file, and generates a visual screenshot of the email HTML body via an external API.

- **1.3 AI-Powered Email Analysis**  
  Uses ChatGPT (OpenAI) to analyze the email’s HTML body and headers for phishing indicators and generates a structured JSON response with classification and detailed summary.

- **1.4 Classification & Conditional Routing**  
  Evaluates the AI output to determine if the email is potentially malicious or benign, directing the workflow accordingly.

- **1.5 Automated Jira Ticketing & Attachments**  
  Creates Jira tickets for malicious or benign emails with AI analysis summaries. Uploads the email screenshot and text body as attachments for comprehensive reporting.

---

### 2. Block-by-Block Analysis

#### 2.1 Email Integration & Data Extraction

- **Overview:**  
  This block captures new emails from Gmail (active) or Microsoft Outlook (disabled by default) every minute. It extracts raw email fields such as subject, recipients, body, and headers to prepare for analysis.

- **Nodes Involved:**  
  - Gmail Trigger  
  - Microsoft Outlook Trigger (disabled)  
  - Retrieve Headers of Email (Outlook-specific)  
  - Format Headers (Outlook-specific)  
  - Set Gmail Variables  
  - Set Outlook Variables  

- **Node Details:**

  - **Gmail Trigger**  
    - *Type:* Trigger node, connects to Gmail via OAuth2.  
    - *Configuration:* Polls every minute for new emails.  
    - *Output:* Full email object with content, headers, recipients, subject, and body.  
    - *Edge Cases:* Authentication errors, Gmail API rate limits, missing email parts.  
    - *Connection:* Outputs to Set Gmail Variables.

  - **Microsoft Outlook Trigger** (Disabled)  
    - *Type:* Trigger node, connects to Outlook via OAuth2.  
    - *Configuration:* Polls every minute for new emails; outputs selected fields only.  
    - *Output:* Email fields including body, recipients, subject, and a body preview.  
    - *Edge Cases:* Disabled by default, requires Microsoft Graph API auth, rate limiting.  
    - *Connection:* Outputs to Retrieve Headers of Email.

  - **Retrieve Headers of Email**  
    - *Type:* HTTP Request to Microsoft Graph API.  
    - *Configuration:* Retrieves detailed internet message headers and full body in text format.  
    - *Edge Cases:* API request failures, expired tokens, malformed responses.  
    - *Connection:* Outputs to Format Headers.

  - **Format Headers**  
    - *Type:* Code node.  
    - *Configuration:* JavaScript consolidates headers into a dictionary with header names as keys and arrays of values.  
    - *Edge Cases:* Unexpected header formats, empty headers.  
    - *Connection:* Outputs to Set Outlook Variables.

  - **Set Gmail Variables**  
    - *Type:* Set node.  
    - *Configuration:* Extracts and assigns variables: htmlBody, headers, subject, recipient, textBody from Gmail email JSON.  
    - *Connection:* Outputs to Set Email Variables.

  - **Set Outlook Variables**  
    - *Type:* Set node.  
    - *Configuration:* Extracts and assigns htmlBody, headers (formatted), subject, recipient, textBody from Outlook email JSON.  
    - *Connection:* Outputs to Set Email Variables.

---

#### 2.2 Email Content Preparation

- **Overview:**  
  Organizes email data into a unified structure, converts the email body text into a downloadable file, and generates an HTML screenshot of the email body for visual clarity.

- **Nodes Involved:**  
  - Set Email Variables  
  - Convert Email Body to File  
  - Screenshot HTML  
  - Retrieve Screenshot  

- **Node Details:**

  - **Set Email Variables**  
    - *Type:* Set node.  
    - *Configuration:* Includes all previous fields, maintains other fields for downstream use.  
    - *Role:* Centralizes email data for all following steps.  
    - *Connection:* Outputs to Convert Email Body to File.

  - **Convert Email Body to File**  
    - *Type:* Convert To File node.  
    - *Configuration:* Converts `textBody` property into a `.txt` file named `emailBody.txt`.  
    - *Edge Cases:* Empty or malformed `textBody` can lead to empty files.  
    - *Connection:* Outputs to Screenshot HTML.

  - **Screenshot HTML**  
    - *Type:* HTTP Request node.  
    - *Configuration:* Posts the email’s HTML body to the `hcti.io` API to generate a screenshot image URL. Uses HTTP Basic Auth with `hcti.io` credentials.  
    - *Edge Cases:* API authentication failures, rate limits, invalid HTML input causing errors.  
    - *Connection:* Outputs to Retrieve Screenshot.

  - **Retrieve Screenshot**  
    - *Type:* HTTP Request node.  
    - *Configuration:* Downloads the screenshot image from the URL provided by the `Screenshot HTML` node using the same authentication.  
    - *Edge Cases:* Broken URLs, API downtime, auth errors.  
    - *Connection:* Outputs to Analyze Email with ChatGPT.

---

#### 2.3 AI-Powered Email Analysis

- **Overview:**  
  Uses ChatGPT (via LangChain OpenAI node) to analyze the email’s HTML body and headers, returning a structured JSON indicating if the email is malicious alongside a detailed summary.

- **Nodes Involved:**  
  - Analyze Email with ChatGPT  

- **Node Details:**

  - **Analyze Email with ChatGPT**  
    - *Type:* LangChain OpenAI node.  
    - *Configuration:*  
      - Model: GPT-4o  
      - Prompt instructs the AI to describe the email’s HTML body and headers, determine phishing likelihood, and output a structured JSON with boolean `malicious` and verbose `summary`.  
      - System message enforces JSON output and Jira wiki formatting.  
    - *Key Expressions:* Uses variables `htmlBody` and `headers` from `Set Email Variables`.  
    - *Edge Cases:* API rate limits, malformed prompt causing parsing errors, incomplete email data.  
    - *Connection:* Outputs to Check if Malicious.

---

#### 2.4 Classification & Conditional Routing

- **Overview:**  
  Evaluates AI output's `malicious` field to branch workflow to appropriate Jira ticket creation nodes.

- **Nodes Involved:**  
  - Check if Malicious  

- **Node Details:**

  - **Check if Malicious**  
    - *Type:* If node.  
    - *Configuration:* Checks if `message.content.malicious` from ChatGPT output is `true`.  
    - *Edge Cases:* Missing or malformed AI response JSON, false negatives/positives.  
    - *Output:*  
      - True branch: Create Potentially Malicious Ticket  
      - False branch: Create Potentially Benign Ticket

---

#### 2.5 Automated Jira Ticketing & Attachments

- **Overview:**  
  Creates Jira tickets (malicious or benign), stores the new ticket ID, renames attachments, and uploads the email screenshot and text body files to the Jira issue.

- **Nodes Involved:**  
  - Create Potentially Malicious Ticket  
  - Create Potentially Benign Ticket  
  - Set Jira ID  
  - Rename Screenshot  
  - Upload Screenshot of Email to Jira  
  - Rename Email Body Screenshot  
  - Upload Email Body to Jira  

- **Node Details:**

  - **Create Potentially Malicious Ticket**  
    - *Type:* Jira node.  
    - *Configuration:*  
      - Project: Support (ID 10001)  
      - Issue Type: Task (ID 10008)  
      - Summary includes email subject and flagged status.  
      - Description embeds recipient, subject, and ChatGPT’s detailed analysis in Jira wiki format.  
    - *Edge Cases:* Jira API auth failures, missing project/issue type, rate limits.  
    - *Connection:* Outputs to Set Jira ID.

  - **Create Potentially Benign Ticket**  
    - *Type:* Jira node, same configuration as malicious ticket, but summary indicates benign status.  
    - *Connection:* Outputs to Set Jira ID.

  - **Set Jira ID**  
    - *Type:* Set node.  
    - *Configuration:* Passes all fields, particularly capturing `key` from Jira response (issue key).  
    - *Connection:* Outputs to Rename Screenshot.

  - **Rename Screenshot**  
    - *Type:* Code node.  
    - *Configuration:* Renames the binary data filename of the screenshot to `emailScreenshot.png`.  
    - *Behavior:* Runs once per item.  
    - *Connection:* Outputs to Upload Screenshot of Email to Jira.

  - **Upload Screenshot of Email to Jira**  
    - *Type:* Jira node.  
    - *Configuration:* Uploads the file to the Jira issue identified by `Set Jira ID`.  
    - *Edge Cases:* Jira attachment size limits, auth failures.  
    - *Connection:* Outputs to Rename Email Body Screenshot.

  - **Rename Email Body Screenshot**  
    - *Type:* Code node.  
    - *Configuration:* Renames the email body text file to `emailBody.txt`.  
    - *Behavior:* Runs once per item.  
    - *Connection:* Outputs to Upload Email Body to Jira.

  - **Upload Email Body to Jira**  
    - *Type:* Jira node.  
    - *Configuration:* Uploads the `.txt` file to the Jira issue.  
    - *Edge Cases:* Same as screenshot upload.  

---

### 3. Summary Table

| Node Name                     | Node Type                   | Functional Role                                  | Input Node(s)                 | Output Node(s)                       | Sticky Note                                                                                                                     |
|-------------------------------|-----------------------------|-------------------------------------------------|------------------------------|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Gmail Trigger                 | Gmail Trigger               | Capture new Gmail emails                         | —                            | Set Gmail Variables                | Gmail integration and data extraction with 1-minute polling. See sticky note with Gmail logo.                                  |
| Microsoft Outlook Trigger     | Microsoft Outlook Trigger   | Capture new Outlook emails (disabled by default)| —                            | Retrieve Headers of Email         | Outlook integration and header processing. See sticky note with Outlook logo.                                                  |
| Retrieve Headers of Email     | HTTP Request                | Fetch detailed Outlook email headers and body   | Microsoft Outlook Trigger     | Format Headers                   | Part of Outlook email header processing.                                                                                       |
| Format Headers               | Code                        | Structure Outlook email headers                  | Retrieve Headers of Email     | Set Outlook Variables             | Organizes Outlook headers into dictionary form.                                                                                |
| Set Gmail Variables          | Set                         | Extract and assign Gmail email variables         | Gmail Trigger                | Set Email Variables              | Prepares Gmail email data for analysis.                                                                                        |
| Set Outlook Variables        | Set                         | Extract and assign Outlook email variables       | Format Headers               | Set Email Variables              | Prepares Outlook email data for analysis.                                                                                      |
| Set Email Variables          | Set                         | Centralize email fields from Gmail/Outlook       | Set Gmail Variables, Set Outlook Variables | Convert Email Body to File | Organizes all key email data for downstream use. See sticky note about email body conversion and processing.                    |
| Convert Email Body to File   | Convert To File             | Create text file from email body                  | Set Email Variables          | Screenshot HTML                 | Converts plain text email body to `.txt` for attachment.                                                                       |
| Screenshot HTML              | HTTP Request                | Generate email HTML body screenshot via hcti.io | Convert Email Body to File   | Retrieve Screenshot             | Sends HTML to hcti.io API to create screenshot. See sticky note with hcti.io logo.                                              |
| Retrieve Screenshot          | HTTP Request                | Download screenshot image                         | Screenshot HTML              | Analyze Email with ChatGPT      | Fetches screenshot for attachment and review.                                                                                   |
| Analyze Email with ChatGPT   | LangChain OpenAI            | AI analysis of email content and headers          | Retrieve Screenshot          | Check if Malicious              | Uses GPT-4o to classify email phishing risk and generate detailed summary. See sticky note with OpenAI logo.                    |
| Check if Malicious           | If                          | Branch based on AI phishing classification        | Analyze Email with ChatGPT   | Create Potentially Malicious Ticket, Create Potentially Benign Ticket | Routes workflow depending on email threat status.                                                                              |
| Create Potentially Malicious Ticket | Jira                      | Create Jira ticket for malicious emails           | Check if Malicious (true)    | Set Jira ID                    | Creates Jira issue with detailed AI analysis and email info. See sticky note with Jira logo.                                    |
| Create Potentially Benign Ticket  | Jira                      | Create Jira ticket for benign emails               | Check if Malicious (false)   | Set Jira ID                    | Similar to malicious ticket but for benign classification.                                                                     |
| Set Jira ID                  | Set                         | Store Jira issue key for attachment uploads       | Create Potentially Malicious Ticket, Create Potentially Benign Ticket | Rename Screenshot          | Tracks Jira issue key for downstream attachment nodes.                                                                        |
| Rename Screenshot            | Code                        | Rename screenshot file to emailScreenshot.png     | Set Jira ID                 | Upload Screenshot of Email to Jira | Prepares screenshot file for Jira upload.                                                                                      |
| Upload Screenshot of Email to Jira | Jira                      | Upload screenshot image to Jira issue              | Rename Screenshot           | Rename Email Body Screenshot    | Attaches screenshot to Jira ticket.                                                                                            |
| Rename Email Body Screenshot | Code                        | Rename email body text file to emailBody.txt      | Upload Screenshot of Email to Jira | Upload Email Body to Jira       | Prepares text file for Jira upload.                                                                                            |
| Upload Email Body to Jira    | Jira                        | Upload email body text file to Jira issue          | Rename Email Body Screenshot | —                              | Attaches email text body to Jira ticket.                                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger node**  
   - Type: Gmail Trigger  
   - Configure OAuth2 credentials for Gmail account.  
   - Set polling interval to every minute.  
   - Output all email data (do not use simple mode).  

2. **(Optional) Create Microsoft Outlook Trigger node**  
   - Type: Microsoft Outlook Trigger  
   - Configure OAuth2 Outlook credentials.  
   - Select output fields: body, toRecipients, subject, bodyPreview.  
   - Set polling interval to every minute.  
   - Note: This node is disabled by default.

3. **Create HTTP Request node ‘Retrieve Headers of Email’ (Outlook)**  
   - URL: `https://graph.microsoft.com/v1.0/me/messages/{{ $json.id }}?$select=internetMessageHeaders,body`  
   - Headers: Accept = application/json, Prefer = outlook.body-content-type="text"  
   - Use Microsoft Outlook OAuth2 credentials.  

4. **Create Code node ‘Format Headers’**  
   - JavaScript code to transform `internetMessageHeaders` array to an object keyed by header names with arrays of values.

5. **Create Set node ‘Set Gmail Variables’**  
   - Assign:  
     - `htmlBody` = `{{$json.html}}`  
     - `headers` = `{{$json.headers}}`  
     - `subject` = `{{$json.subject}}`  
     - `recipient` = `{{$json.to.text}}`  
     - `textBody` = `{{$json.text}}`  

6. **Create Set node ‘Set Outlook Variables’**  
   - Assign:  
     - `htmlBody` = `{{$json.body.content}}` (from Outlook Trigger)  
     - `headers` = output from Format Headers node  
     - `subject` = `{{$json.subject}}`  
     - `recipient` = first email in `toRecipients`  
     - `textBody` = plain text body from Retrieve Headers of Email node  

7. **Create Set node ‘Set Email Variables’**  
   - Include all fields from previous step plus any additional fields needed.  

8. **Create Convert To File node ‘Convert Email Body to File’**  
   - Operation: toText  
   - Source Property: `textBody`  
   - File name: `emailBody.txt`  

9. **Create HTTP Request node ‘Screenshot HTML’**  
   - Method: POST  
   - URL: `https://hcti.io/v1/image`  
   - Body parameter: `html` = `={{$('Set Email Variables').item.json.htmlBody}}`  
   - Authentication: HTTP Basic Auth with `hcti.io` credentials.  

10. **Create HTTP Request node ‘Retrieve Screenshot’**  
    - Method: GET  
    - URL: `={{ $json.url }}` (from previous step)  
    - Authentication: same HTTP Basic Auth.  

11. **Create LangChain OpenAI node ‘Analyze Email with ChatGPT’**  
    - Model: GPT-4o  
    - Prompt: Provide the email HTML body and headers, instruct to classify phishing likelihood, output JSON with `malicious` boolean and `summary`.  
    - Set system message to require Jira wiki formatting and verbose explanation.  
    - Credentials: OpenAI API key.  

12. **Create If node ‘Check if Malicious’**  
    - Condition: `{{$json.message.content.malicious}}` equals `true`.  

13. **Create Jira node ‘Create Potentially Malicious Ticket’**  
    - Project: Support (ID 10001)  
    - Issue Type: Task (ID 10008)  
    - Summary template: `Potentially Malicious - Phishing Email Reported: "{{ $json.subject }}"`  
    - Description: Includes recipient, subject, and ChatGPT analysis summary in Jira wiki style.  
    - Credentials: Jira API credentials.  

14. **Create Jira node ‘Create Potentially Benign Ticket’**  
    - Same as above but summary starts with `Potentially Benign`.  

15. **Create Set node ‘Set Jira ID’**  
    - Save Jira issue key from ticket creation response for attachment upload.  

16. **Create Code node ‘Rename Screenshot’**  
    - Rename binary file name to `emailScreenshot.png`.  

17. **Create Jira node ‘Upload Screenshot of Email to Jira’**  
    - Upload file to Jira issue key from ‘Set Jira ID’.  

18. **Create Code node ‘Rename Email Body Screenshot’**  
    - Rename text file name to `emailBody.txt`.  

19. **Create Jira node ‘Upload Email Body to Jira’**  
    - Upload `.txt` file to Jira issue key.  

20. **Connect nodes as per the logical flow:**  
    - Gmail Trigger → Set Gmail Variables → Set Email Variables → Convert Email Body to File → Screenshot HTML → Retrieve Screenshot → Analyze Email with ChatGPT → Check if Malicious → Create Ticket (Malicious or Benign) → Set Jira ID → Rename Screenshot → Upload Screenshot → Rename Email Body Screenshot → Upload Email Body  

21. **Configure credentials:**  
    - Gmail OAuth2 for Gmail Trigger  
    - Microsoft Outlook OAuth2 for Outlook Trigger and HTTP Request nodes (if used)  
    - HTTP Basic Auth for `hcti.io` nodes  
    - OpenAI API for ChatGPT node  
    - Jira Cloud API credentials for Jira nodes  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                         | Context or Link                                                                                             |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| Workflow tailored for IT security teams and MSPs to automate phishing email detection and reporting.                                                                                                                                  | Description section                                                                                         |
| Gmail and Outlook integration nodes used depending on preferred email service; only Gmail enabled by default.                                                                                                                        | Sticky notes with Gmail and Outlook logos                                                                  |
| Email body screenshots generated via [hcti.io](https://hcti.io/) API for visual context in reports.                                                                                                                                 | Sticky note with hcti.io logo: https://uploads.n8n.io/templates/hctiapi2.png                                 |
| AI analysis leverages OpenAI GPT-4o model via LangChain for deep phishing detection with structured JSON output formatted for Jira.                                                                                                | Sticky note with OpenAI logo: https://uploads.n8n.io/templates/openai.png                                   |
| Jira tickets created with detailed summaries; attachments include email screenshot and text body for comprehensive incident reports.                                                                                              | Sticky note with Jira logo: https://uploads.n8n.io/templates/jira.png                                        |
| Customization tips: adjust email trigger filters, refine AI prompts, modify Jira ticket fields to suit organizational policies and workflows.                                                                                      | Description section                                                                                         |
| Potential failure points to monitor include API rate limits (Gmail, Outlook, hcti.io, OpenAI, Jira), authentication errors, malformed email content, and unexpected AI responses.                                                    | General best practices                                                                                      |
| The workflow uses explicit variable passing and node sequencing to ensure clarity, error handling should be added externally for production environments.                                                                          | Best practice recommendation                                                                                 |

---

This documentation provides a comprehensive and detailed reference to understand, reproduce, and maintain the "Analyze & Sort Suspicious Email Contents with ChatGPT" workflow, enabling automation of phishing email detection and reporting using n8n.