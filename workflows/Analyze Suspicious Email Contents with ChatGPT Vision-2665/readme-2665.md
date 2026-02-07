Analyze Suspicious Email Contents with ChatGPT Vision

https://n8nworkflows.xyz/workflows/analyze-suspicious-email-contents-with-chatgpt-vision-2665


# Analyze Suspicious Email Contents with ChatGPT Vision

### 1. Workflow Overview

This workflow automates the detection, analysis, and reporting of suspicious phishing emails using n8n. It integrates email services (Gmail and Microsoft Outlook) as triggers to capture incoming emails, extracts and processes their content and metadata, generates a visual screenshot of the email body, applies AI analysis via ChatGPT to detect phishing indicators, and finally reports suspicious emails by creating detailed Jira tickets with attached screenshots.

The workflow is logically divided into these blocks:

- **1.1 Email Input Reception**: Captures incoming emails from Gmail and Microsoft Outlook.
- **1.2 Email Content and Header Extraction**: Extracts and structures email body content, headers, and metadata.
- **1.3 Email Visualization**: Converts email HTML content into a screenshot using the hcti.io API.
- **1.4 AI Phishing Detection**: Uses ChatGPT to analyze the email screenshot and metadata to detect phishing attempts.
- **1.5 Automated Incident Reporting**: Creates Jira tickets summarizing the suspicious email, attaches the screenshot, and logs the incident for security teams.

---

### 2. Block-by-Block Analysis

#### 2.1 Email Input Reception

**Overview:**  
This block captures incoming emails in real-time from Gmail and Microsoft Outlook, triggering the workflow when new emails arrive.

**Nodes Involved:**  
- Gmail Trigger  
- Microsoft Outlook Trigger (disabled by default)

**Node Details:**

- **Gmail Trigger**  
  - Type: Trigger node connecting to Gmail via OAuth2.  
  - Configuration: Polls every minute for new emails without specific filters, capturing full email data.  
  - Inputs: None (trigger).  
  - Outputs: Full email JSON data including body, headers, subject, recipients.  
  - Edge Cases: Authentication failure (OAuth token expiration), Gmail API rate limits, empty or malformed emails.

- **Microsoft Outlook Trigger** (disabled)  
  - Type: Trigger node for Microsoft Outlook via OAuth2.  
  - Configuration: Polls every minute for new emails, outputs selected fields (body, toRecipients, subject, bodyPreview).  
  - Inputs: None (trigger).  
  - Outputs: Selected email fields.  
  - Edge Cases: OAuth token expiration, Microsoft Graph API limits, disabled by default to avoid conflict if only Gmail is used.

---

#### 2.2 Email Content and Header Extraction

**Overview:**  
This block extracts and formats the email body, headers, and metadata to prepare data for analysis and visualization.

**Nodes Involved:**  
- Set Gmail Variables  
- Retrieve Headers of Email (Outlook)  
- Format Headers (Code node)  
- Set Outlook Variables  
- Set Email Variables

**Node Details:**

- **Set Gmail Variables**  
  - Type: Set node to assign variables from Gmail email data.  
  - Configuration: Extracts `htmlBody`, `headers`, `subject`, `recipient`, `textBody` from Gmail's JSON payload, assigning them to variables for downstream use.  
  - Inputs: Output from Gmail Trigger.  
  - Outputs: Structured email variables.  
  - Edge Cases: Missing fields in Gmail data, malformed HTML body.

- **Retrieve Headers of Email**  
  - Type: HTTP Request node calling Microsoft Graph API to get detailed message headers and body for Outlook emails.  
  - Configuration: Uses Outlook OAuth2 credentials, requests `internetMessageHeaders` and `body` with "text" content preference.  
  - Inputs: Output from Microsoft Outlook Trigger.  
  - Outputs: JSON with detailed headers and body content.  
  - Edge Cases: API failures, permission issues, missing headers.

- **Format Headers**  
  - Type: Code node (JavaScript).  
  - Configuration: Processes raw `internetMessageHeaders` array into a dictionary mapping header names to arrays of values for easier readability.  
  - Inputs: Output from Retrieve Headers of Email.  
  - Outputs: Structured header object.  
  - Edge Cases: Unexpected header formats, empty header arrays.

- **Set Outlook Variables**  
  - Type: Set node to assign variables from Outlook email data and formatted headers.  
  - Configuration: Extracts `htmlBody`, `headers`, `subject`, `recipient`, `textBody` from Outlook data and formatted headers.  
  - Inputs: Output from Format Headers.  
  - Outputs: Structured email variables consistent with Gmail variables.  
  - Edge Cases: Missing fields, inconsistent data formats.

- **Set Email Variables**  
  - Type: Set node including other fields and passing through existing data.  
  - Configuration: Captures all relevant email data (headers, body, subject, recipient) from either Gmail or Outlook sets to unify input for downstream processing.  
  - Inputs: From Set Gmail Variables or Set Outlook Variables.  
  - Outputs: Unified email data for screenshot and AI analysis.  
  - Edge Cases: Data inconsistencies between Gmail and Outlook schemas.

---

#### 2.3 Email Visualization

**Overview:**  
Transforms the email's HTML body into an image screenshot using the hcti.io API, preserving the email's visual layout for easier review.

**Nodes Involved:**  
- Screenshot HTML  
- Retrieve Screenshot

**Node Details:**

- **Screenshot HTML**  
  - Type: HTTP Request node calling hcti.io API.  
  - Configuration: Sends HTML content of the email (`htmlBody`) in POST body, authenticates with HTTP Basic Auth using hcti.io credentials.  
  - Inputs: Output from Set Email Variables.  
  - Outputs: JSON response containing the URL of the generated screenshot image.  
  - Edge Cases: API authentication failure, HTML content too large or malformed, network timeouts, privacy concerns due to third-party processing.

- **Retrieve Screenshot**  
  - Type: HTTP Request node to fetch the actual screenshot image from URL provided by previous node.  
  - Configuration: Authenticates with hcti.io, retrieves binary image data for attachment.  
  - Inputs: Output from Screenshot HTML.  
  - Outputs: Binary image data of the email screenshot.  
  - Edge Cases: Invalid URL, request failure, authentication issues.

---

#### 2.4 AI Phishing Detection

**Overview:**  
Uses ChatGPT-4 to analyze the email screenshot along with message headers to detect phishing indicators and generate a formatted report.

**Nodes Involved:**  
- ChatGPT Analysis

**Node Details:**

- **ChatGPT Analysis**  
  - Type: LangChain OpenAI node invoking ChatGPT API.  
  - Configuration:  
    - Model: ChatGPT-4o-latest  
    - Input: Base64 encoded screenshot image (binary data from Retrieve Screenshot node) with prompt including message headers variable from Set Email Variables node.  
    - Prompt: Asks ChatGPT to describe the image and determine if the email could be a phishing attempt, formatting response for Jira's wiki renderer without markdown code blocks.  
    - Max tokens: 1500  
  - Inputs: Binary screenshot image, headers from Set Email Variables.  
  - Outputs: Text analysis with phishing assessment.  
  - Edge Cases: API rate limits, prompt failures, long response truncation, interpretation errors.

---

#### 2.5 Automated Incident Reporting

**Overview:**  
Creates a Jira ticket with detailed phishing analysis and attaches the email screenshot to facilitate security team review and tracking.

**Nodes Involved:**  
- Create Jira Ticket  
- Rename Screenshot (Code node)  
- Upload Screenshot of Email to Jira

**Node Details:**

- **Create Jira Ticket**  
  - Type: Jira node for issue creation.  
  - Configuration:  
    - Project: Configured Jira project (ID 10001, e.g., "Support")  
    - Issue Type: Task (ID 10008)  
    - Summary: Includes email subject line dynamically.  
    - Description: Combines recipient, subject, email text body, and ChatGPT analysis formatted for Jira wiki style.  
    - Credentials: Jira Cloud API OAuth2.  
  - Inputs: Output from ChatGPT Analysis (phishing report) and Set Email Variables (email data).  
  - Outputs: Jira issue JSON including issue key.  
  - Edge Cases: Jira API errors, permission issues, field validation failures.

- **Rename Screenshot**  
  - Type: Code node to rename binary file before upload.  
  - Configuration: Renames binary file field to `emailScreenshot.png` for clarity in Jira.  
  - Inputs: Screenshot binary from Retrieve Screenshot node.  
  - Outputs: Binary data with updated filename.  
  - Edge Cases: Missing binary data, code execution errors.

- **Upload Screenshot of Email to Jira**  
  - Type: Jira node to upload attachments.  
  - Configuration:  
    - Issue Key: Dynamically set from Jira ticket creation result.  
    - Resource: issueAttachment endpoint.  
    - Credentials: Jira Cloud API OAuth2.  
  - Inputs: Renamed screenshot binary data.  
  - Outputs: Confirmation of attachment upload.  
  - Edge Cases: Attachment size limits, upload failures, permissions.

---

### 3. Summary Table

| Node Name                   | Node Type                          | Functional Role                              | Input Node(s)                   | Output Node(s)                   | Sticky Note                                                                                                     |
|-----------------------------|----------------------------------|----------------------------------------------|---------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------------------|
| Gmail Trigger               | Gmail Trigger                    | Capture incoming Gmail emails                | None                            | Set Gmail Variables             | Gmail Integration and Data Extraction: real-time email capture, variable assignment for Gmail data            |
| Microsoft Outlook Trigger   | Microsoft Outlook Trigger (disabled) | Capture incoming Outlook emails              | None                            | Retrieve Headers of Email       | Microsoft Outlook Integration and Email Header Processing: capture emails, retrieve headers, prepare variables |
| Set Gmail Variables         | Set                             | Extract Gmail email fields to variables      | Gmail Trigger                  | Set Email Variables            |                                                                                                               |
| Retrieve Headers of Email   | HTTP Request                    | Retrieve full headers and body from Outlook  | Microsoft Outlook Trigger       | Format Headers                 |                                                                                                               |
| Format Headers             | Code                            | Format Outlook headers into structured object | Retrieve Headers of Email       | Set Outlook Variables          |                                                                                                               |
| Set Outlook Variables       | Set                             | Extract Outlook email fields to variables    | Format Headers                 | Set Email Variables            |                                                                                                               |
| Set Email Variables         | Set                             | Unify email data from Gmail or Outlook       | Set Gmail Variables, Set Outlook Variables | Screenshot HTML              | HTML Screenshot Generation and Email Visualization: prepares email HTML for screenshot generation             |
| Screenshot HTML            | HTTP Request                    | Submit email HTML to hcti.io for screenshot  | Set Email Variables            | Retrieve Screenshot            |                                                                                                               |
| Retrieve Screenshot        | HTTP Request                    | Retrieve screenshot image from hcti.io       | Screenshot HTML                | ChatGPT Analysis              |                                                                                                               |
| ChatGPT Analysis           | LangChain OpenAI (ChatGPT)      | Analyze email screenshot and headers for phishing indicators | Retrieve Screenshot           | Create Jira Ticket            | AI-Powered Email Analysis with ChatGPT: phishing detection and report generation                              |
| Create Jira Ticket          | Jira                            | Create Jira ticket with email and AI analysis | ChatGPT Analysis               | Rename Screenshot             | Automated Jira Ticket Creation for Phishing Reports: auto-create detailed Jira issues                          |
| Rename Screenshot           | Code                            | Rename screenshot binary file for Jira upload | Create Jira Ticket             | Upload Screenshot of Email to Jira |                                                                                                               |
| Upload Screenshot of Email to Jira | Jira                       | Attach email screenshot to Jira ticket       | Rename Screenshot              | None                          |                                                                                                               |
| Sticky Note                 | Sticky Note                    | Documentation for Gmail integration           | None                          | None                          | Gmail Integration and Data Extraction                                                                        |
| Sticky Note1                | Sticky Note                    | Documentation for Outlook integration          | None                          | None                          | Microsoft Outlook Integration and Email Header Processing                                                    |
| Sticky Note2                | Sticky Note                    | Documentation for HTML screenshot generation   | None                          | None                          | HTML Screenshot Generation and Email Visualization                                                           |
| Sticky Note3                | Sticky Note                    | Documentation for AI phishing analysis         | None                          | None                          | AI-Powered Email Analysis with ChatGPT                                                                        |
| Sticky Note4                | Sticky Note                    | Documentation for Jira ticket automation        | None                          | None                          | Automated Jira Ticket Creation for Phishing Reports                                                          |

---

### 4. Reproducing the Workflow from Scratch

**Step 1:** Create **Gmail Trigger** node  
- Type: Gmail Trigger  
- Credentials: Connect Gmail OAuth2 credentials  
- Polling: Set to trigger every minute  
- Filters: None (capture all incoming emails)

**Step 2 (optional):** Create **Microsoft Outlook Trigger** node (disabled by default)  
- Type: Microsoft Outlook Trigger  
- Credentials: Outlook OAuth2 credentials  
- Polling: Every minute  
- Fields to output: body, toRecipients, subject, bodyPreview  
- Disable if not using Outlook

**Step 3:** Create **Set Gmail Variables** node  
- Type: Set  
- Input: Connect from Gmail Trigger  
- Assign variables:  
  - htmlBody: `{{$json.html}}`  
  - headers: `{{$json.headers}}`  
  - subject: `{{$json.subject}}`  
  - recipient: `{{$json.to.text}}`  
  - textBody: `{{$json.text}}`

**Step 4 (for Outlook):** Create **Retrieve Headers of Email** node  
- Type: HTTP Request  
- Credentials: Outlook OAuth2  
- Method: GET  
- URL: `https://graph.microsoft.com/v1.0/me/messages/{{$json.id}}?$select=internetMessageHeaders,body`  
- Headers: Accept: application/json, Prefer: outlook.body-content-type="text"  
- Input: Connect from Microsoft Outlook Trigger

**Step 5:** Create **Format Headers** node  
- Type: Code (JavaScript)  
- Input: Connect from Retrieve Headers of Email  
- Code:  
  ```javascript
  const input = $('Retrieve Headers of Email').item.json.internetMessageHeaders;
  const result = input.reduce((acc, { name, value }) => {
    if (!acc[name]) acc[name] = [];
    acc[name].push(value);
    return acc;
  }, {});
  return result;
  ```

**Step 6:** Create **Set Outlook Variables** node  
- Type: Set  
- Input: Connect from Format Headers  
- Assign variables:  
  - htmlBody: `{{$json.body.content}}`  
  - headers: `{{$json}}` (formatted headers)  
  - subject: `{{$json.subject}}`  
  - recipient: `{{$json.toRecipients[0].emailAddress.address}}`  
  - textBody: `{{$json.body.content}}` (or from headers retrieval)

**Step 7:** Create **Set Email Variables** node  
- Type: Set  
- Input: Connect from either Set Gmail Variables or Set Outlook Variables  
- Include other fields: true (pass through all incoming data)  
- No custom assignments needed here, but ensures unified data payload

**Step 8:** Create **Screenshot HTML** node  
- Type: HTTP Request  
- Credentials: HTTP Basic Auth with hcti.io API credentials  
- Method: POST  
- URL: `https://hcti.io/v1/image`  
- Body parameters: `html` = `={{ $json.htmlBody }}`  
- Input: Connect from Set Email Variables

**Step 9:** Create **Retrieve Screenshot** node  
- Type: HTTP Request  
- Credentials: HTTP Basic Auth (hcti.io)  
- Method: GET  
- URL: `={{ $json.url }}` (URL from Screenshot HTML response)  
- Input: Connect from Screenshot HTML

**Step 10:** Create **ChatGPT Analysis** node  
- Type: LangChain OpenAI (ChatGPT)  
- Credentials: OpenAI API key  
- Model: chatgpt-4o-latest  
- Operation: Analyze image  
- Input type: base64 (binary screenshot image)  
- Text prompt:  
  ```
  Describe this image. Determine if the email could be a phishing email. The message headers are as follows:
  {{ $('Set Email Variables').item.json.headers }}

  Format the response for Jira who uses a wiki-style renderer. Do not include ``` around your response.
  ```  
- Input: Connect from Retrieve Screenshot

**Step 11:** Create **Create Jira Ticket** node  
- Type: Jira  
- Credentials: Jira Software Cloud OAuth2  
- Project: Select your Jira project (e.g., ID 10001)  
- Issue Type: Select issue type (e.g., Task, ID 10008)  
- Summary:  
  `Phishing Email Reported: "{{ $('Set Email Variables').item.json.subject }}"`  
- Description:  
  ```
  A phishing email was reported by {{ $('Set Email Variables').item.json.recipient }} with the subject line "{{ $('Set Email Variables').item.json.subject }}" and body:
  {{ $('Set Email Variables').item.json.textBody }}

  h2. Here is ChatGPT's analysis of the email:
  {{ $json.content }}
  ```  
- Input: Connect from ChatGPT Analysis

**Step 12:** Create **Rename Screenshot** node  
- Type: Code  
- Input: Connect from Create Jira Ticket  
- Code:  
  ```javascript
  $('Retrieve Screenshot').item.binary.data.fileName = 'emailScreenshot.png';
  return $('Retrieve Screenshot').item;
  ```  
- Purpose: Rename binary file for Jira upload

**Step 13:** Create **Upload Screenshot of Email to Jira** node  
- Type: Jira (issueAttachment)  
- Credentials: Jira Software Cloud OAuth2  
- Issue Key: `={{ $('Create Jira Ticket').item.json.key }}`  
- Attach binary: From Rename Screenshot node  
- Input: Connect from Rename Screenshot

**Step 14:** Connect all nodes accordingly:  
- Gmail Trigger → Set Gmail Variables → Set Email Variables → Screenshot HTML → Retrieve Screenshot → ChatGPT Analysis → Create Jira Ticket → Rename Screenshot → Upload Screenshot  
- Microsoft Outlook Trigger (if enabled) → Retrieve Headers of Email → Format Headers → Set Outlook Variables → Set Email Variables → ... (same as above)

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                                          |
|-----------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Gmail Integration and Data Extraction: Real-time capture every minute; variables extracted for consistent downstream use. | Sticky Note on Gmail Trigger and Set Gmail Variables nodes.                                                              |
| Microsoft Outlook Integration and Email Header Processing: Retrieves detailed headers and formats them for analysis.   | Sticky Note on Microsoft Outlook Trigger and related nodes.                                                              |
| HTML Screenshot Generation and Email Visualization: Visualizes email content using hcti.io API; exposes email content to third party; local rasterization possible when self-hosting. | Sticky Note on Screenshot and related nodes. [hcti.io](https://hcti.io)                                                  |
| AI-Powered Email Analysis with ChatGPT: Uses ChatGPT-4 to detect phishing, formats output for Jira wiki style.          | Sticky Note on ChatGPT Analysis node. [OpenAI](https://openai.com)                                                       |
| Automated Jira Ticket Creation for Phishing Reports: Automates Jira ticket creation and attachment upload for incidents. | Sticky Note on Jira nodes. [Jira Cloud API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)           |

---

This completes the detailed documentation of the "Analyze Suspicious Email Contents with ChatGPT Vision" workflow, providing a comprehensive understanding for users and developers to reproduce, modify, or extend its capabilities.