AI-Driven Lead Management and Inquiry Automation with ERPNext & n8n

https://n8nworkflows.xyz/workflows/ai-driven-lead-management-and-inquiry-automation-with-erpnext---n8n-2758


# AI-Driven Lead Management and Inquiry Automation with ERPNext & n8n

---

## 1. Workflow Overview

This workflow automates lead management and customer inquiry processing by integrating ERPNext, AI agents, Google Sheets, and email notifications via Microsoft Outlook. It captures new leads from ERPNext in real-time, analyzes the inquiry content using AI to classify and extract key details, assigns the inquiry to appropriate contacts based on a contact database, and sends professionally formatted email notifications to the responsible parties. Invalid or irrelevant leads are flagged to prevent unnecessary follow-up.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures new lead data via ERPNext webhook and filters leads based on source and status.
- **1.2 Lead Data Retrieval:** Fetches detailed lead information from ERPNext using the lead ID.
- **1.3 Inquiry Validation:** Checks if the inquiry contains notes and uses AI to analyze and classify the inquiry.
- **1.4 Contact Assignment & AI Processing:** Uses AI to extract relevant details, classify the inquiry, and identify responsible contacts from Google Sheets and Google Docs.
- **1.5 Email Preparation:** Extracts email fields from AI output, formats the email body into HTML.
- **1.6 Email Notification:** Sends the formatted email notification via Microsoft Outlook.
- **1.7 Invalid Lead Handling:** Flags invalid leads and stops further processing.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception

**Overview:**  
This block receives incoming lead data from ERPNext via a webhook, then filters leads to process only those originating from the website and with an "Open" status.

**Nodes Involved:**  
- Webhook  
- Source Website and Status Open  
- Lead Body

**Node Details:**

- **Webhook**  
  - Type: HTTP Webhook  
  - Role: Entry point triggered by ERPNext when a new lead is created.  
  - Configuration: Listens for POST requests at path `/new-lead-generated-in-erpnext`.  
  - Inputs: External HTTP POST from ERPNext webhook.  
  - Outputs: Passes raw lead data to the next node.  
  - Edge Cases: Missing or malformed webhook payload; network issues.

- **Source Website and Status Open**  
  - Type: If (Conditional)  
  - Role: Filters leads to only those with source = "Website" and status = "Open".  
  - Configuration: Checks `$json.body.source === "Website"` AND `$json.body.status === "Open"`.  
  - Inputs: Webhook output.  
  - Outputs: Passes filtered leads to Lead Body node.  
  - Edge Cases: Leads with other sources or statuses are ignored; case sensitivity enforced.

- **Lead Body**  
  - Type: Set  
  - Role: Extracts and assigns the lead body data for further processing.  
  - Configuration: Sets `body` field to the webhook's `body` JSON.  
  - Inputs: Filtered lead data.  
  - Outputs: Passes lead body to the ERPNext data retrieval node.  
  - Edge Cases: Empty or missing body data.

---

### 2.2 Lead Data Retrieval

**Overview:**  
Fetches detailed lead information from ERPNext using the lead ID obtained from the webhook payload.

**Nodes Involved:**  
- Get Lead Data from ERPNext

**Node Details:**

- **Get Lead Data from ERPNext**  
  - Type: HTTP Request  
  - Role: Retrieves full lead details from ERPNext REST API.  
  - Configuration:  
    - URL: `https://erpnext.syncbricks.com/api/resource/Lead/{{ $json.body.name }}` (dynamic lead name from webhook).  
    - Authentication: Uses predefined ERPNext API credentials.  
  - Inputs: Lead body containing lead ID/name.  
  - Outputs: Full lead data including notes, contact info, company, etc.  
  - Edge Cases: API authentication failure, lead not found, network timeout.

---

### 2.3 Inquiry Validation

**Overview:**  
Checks if the lead inquiry contains notes and proceeds only if notes exist.

**Nodes Involved:**  
- Inquiry has Notes

**Node Details:**

- **Inquiry has Notes**  
  - Type: If (Conditional)  
  - Role: Validates presence of notes in the lead data.  
  - Configuration: Checks if `$json.data.notes` exists and is not empty.  
  - Inputs: Lead data from ERPNext.  
  - Outputs: Passes leads with notes to AI processing; stops others.  
  - Edge Cases: Leads without notes are ignored.

---

### 2.4 Contact Assignment & AI Processing

**Overview:**  
Uses an AI agent to analyze the inquiry notes, extract key details, classify the inquiry as valid or invalid, and identify the responsible contacts from Google Sheets and Google Docs.

**Nodes Involved:**  
- Customer Lead AI Agent  
- OpenAI Chat Model  
- Abbriviations (Google Sheets)  
- Company Profile (Google Docs)  
- Company Policies (Google Docs)  
- Company Contact Database (Google Sheets)

**Node Details:**

- **Customer Lead AI Agent**  
  - Type: LangChain AI Agent  
  - Role: Core AI logic to analyze lead notes, classify inquiry, extract customer and inquiry details, and determine responsible contacts.  
  - Configuration:  
    - System prompt defines process flow: analyze notes, find contacts, generate email notification, handle invalid leads.  
    - Uses data from Google Sheets (contact database, abbreviations) and Google Docs (company profile, policies) as context.  
    - Output: Either a structured email notification text or invalid lead message.  
  - Inputs: Lead notes, contact database, company info.  
  - Outputs: AI-generated text with email addresses and message body or invalid lead flag.  
  - Version: LangChain agent v1.7.  
  - Edge Cases: AI misclassification, incomplete data, API rate limits, prompt failures.

- **OpenAI Chat Model**  
  - Type: Language Model (OpenAI GPT)  
  - Role: Provides the underlying AI language model for the AI agent.  
  - Configuration: Uses OpenAI API credentials.  
  - Inputs: Prompt from AI Agent node.  
  - Outputs: AI-generated text response.  
  - Edge Cases: API quota exceeded, network errors.

- **Abbriviations (Google Sheets)**  
  - Type: Google Sheets Tool  
  - Role: Provides abbreviation mappings to AI for better understanding of terms in inquiries.  
  - Configuration: Reads from a specific Google Sheet and sheet tab.  
  - Inputs: None (used as context).  
  - Outputs: Data fed into AI agent.  
  - Edge Cases: Sheet access errors, permission issues.

- **Company Profile (Google Docs)**  
  - Type: Google Docs Tool  
  - Role: Supplies company product and service descriptions to AI agent.  
  - Configuration: Retrieves document content by URL/ID.  
  - Inputs: None (used as context).  
  - Outputs: Data fed into AI agent.  
  - Edge Cases: Document access errors, missing document ID.

- **Company Policies (Google Docs)**  
  - Type: Google Docs Tool  
  - Role: Provides company policies to AI agent for context.  
  - Configuration: Retrieves document content by URL/ID.  
  - Inputs: None (used as context).  
  - Outputs: Data fed into AI agent.  
  - Edge Cases: Document access errors.

- **Company Contact Database (Google Sheets)**  
  - Type: Google Sheets Tool  
  - Role: Contains mapping of products/services to responsible contacts for AI to reference.  
  - Configuration: Reads from a Google Sheet named "Telephone Directory".  
  - Inputs: None (used as context).  
  - Outputs: Data fed into AI agent.  
  - Edge Cases: Sheet access errors, permission issues.

---

### 2.5 Email Preparation

**Overview:**  
Extracts structured email fields from the AI-generated text and converts the plain text email body into professional HTML format.

**Nodes Involved:**  
- Inquiry is Valid?  
- Fields for Outlook  
- Email Body Text Generated by AI  
- Email Body for Outlook

**Node Details:**

- **Inquiry is Valid?**  
  - Type: If (Conditional)  
  - Role: Checks if AI output indicates a valid inquiry or an invalid lead message.  
  - Configuration: Passes only if AI output is not equal to `"**Invalid Lead - Not related to products, services, or solutions.**"`.  
  - Inputs: AI agent output.  
  - Outputs: Valid inquiries proceed to email preparation; invalid leads are filtered out.  
  - Edge Cases: False negatives or positives in classification.

- **Fields for Outlook**  
  - Type: Code (JavaScript)  
  - Role: Parses AI output text to extract email addresses, subject, and email body.  
  - Configuration: Uses regex to extract:  
    - Email Address(es) from `**Email Address(es):**` line  
    - Subject from `_Subject:` line  
    - Email body from the greeting "Dear ..." onwards  
  - Inputs: AI agent output text.  
  - Outputs: JSON object with `email_addresses`, `subject`, and `email_body` fields.  
  - Edge Cases: Parsing failures if AI output format changes.

- **Email Body Text Generated by AI**  
  - Type: Set  
  - Role: Assigns extracted email body text to a new field for further processing.  
  - Configuration: Sets `email_body` field to extracted email body string.  
  - Inputs: Parsed fields from previous node.  
  - Outputs: Passes email body to HTML formatter.  
  - Edge Cases: Empty or malformed email body.

- **Email Body for Outlook**  
  - Type: Code (JavaScript)  
  - Role: Converts plain text email body into formatted HTML for professional appearance.  
  - Configuration:  
    - Replaces markdown-like syntax (bold labels, paragraphs) with HTML tags.  
    - Wraps greetings, customer details, inquiry summary, and closing in appropriate HTML tags.  
  - Inputs: Plain text email body.  
  - Outputs: HTML-formatted email body.  
  - Edge Cases: Unexpected text formatting, incomplete sections.

---

### 2.6 Email Notification

**Overview:**  
Sends the formatted email notification to the assigned contacts via Microsoft Outlook.

**Nodes Involved:**  
- Microsoft Outlook

**Node Details:**

- **Microsoft Outlook**  
  - Type: Microsoft Outlook Node  
  - Role: Sends email notifications with subject, HTML body, and recipients as determined by AI.  
  - Configuration:  
    - Subject: From parsed AI output.  
    - Body content: HTML email body with appended link to ERPNext lead record.  
    - Recipients: Email addresses extracted by AI.  
    - Credentials: Uses OAuth2 credentials for Microsoft Outlook account.  
  - Inputs: Email fields and HTML body.  
  - Outputs: Email sent confirmation.  
  - Edge Cases: Authentication errors, invalid email addresses, sending limits.

---

### 2.7 Invalid Lead Handling

**Overview:**  
Handles leads classified as invalid by the AI agent by stopping further processing or optionally routing them for follow-up.

**Nodes Involved:**  
- Inquiry is Valid? (negative branch)  
- (Optional further nodes not included in this workflow)

**Node Details:**

- **Inquiry is Valid?** (negative branch)  
  - Leads with output `"**Invalid Lead - Not related to products, services, or solutions.**"` are filtered here.  
  - No further processing or email sending occurs.  
  - Edge Cases: Opportunity to add notifications or logging for invalid leads.

---

## 3. Summary Table

| Node Name                      | Node Type                      | Functional Role                                  | Input Node(s)                   | Output Node(s)                   | Sticky Note                                                                                                   |
|-------------------------------|--------------------------------|-------------------------------------------------|--------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------------------|
| Webhook                       | HTTP Webhook                   | Entry point receiving new lead from ERPNext     | -                              | Source Website and Status Open   | Once the Lead is generated in ERP: Create webhook in ERPNext for Lead DocType on_insert trigger.              |
| Source Website and Status Open | If                            | Filters leads with source=Website and status=Open | Webhook                        | Lead Body                       | Filter the Lead: Only process leads from Website source and Open status.                                      |
| Lead Body                    | Set                           | Extracts lead body data                           | Source Website and Status Open | Get Lead Data from ERPNext       | Get Details of Lead from ERPNext. Notes are most important.                                                   |
| Get Lead Data from ERPNext    | HTTP Request                  | Fetches detailed lead info from ERPNext          | Lead Body                      | Inquiry has Notes                | Get Lead ID from webhook payload to fetch full lead details.                                                  |
| Inquiry has Notes             | If                            | Checks if lead notes exist                        | Get Lead Data from ERPNext      | Customer Lead AI Agent           | Inquiry with Notes: Only proceed if notes exist.                                                              |
| Customer Lead AI Agent        | LangChain AI Agent            | Analyzes inquiry, classifies, finds contacts, generates email text | Inquiry has Notes              | Inquiry is Valid?                | Customer Experience Agent (AI): Uses company info and contact sheet to assign responsible contacts and draft email. |
| OpenAI Chat Model             | Language Model (OpenAI GPT)   | Provides AI language model for agent             | Customer Lead AI Agent (AI input) | Customer Lead AI Agent (AI output) |                                                                                                               |
| Abbriviations                | Google Sheets Tool            | Provides abbreviation mappings for AI context    | - (context for AI)             | Customer Lead AI Agent (AI input) |                                                                                                               |
| Company Profile              | Google Docs Tool              | Supplies company product/service info             | - (context for AI)             | Customer Lead AI Agent (AI input) |                                                                                                               |
| Company Policies             | Google Docs Tool              | Supplies company policies                          | - (context for AI)             | Customer Lead AI Agent (AI input) |                                                                                                               |
| Company Contact Database     | Google Sheets Tool            | Provides contact mapping for products/services   | - (context for AI)             | Customer Lead AI Agent (AI input) |                                                                                                               |
| Inquiry is Valid?             | If                            | Checks if AI output indicates valid inquiry      | Customer Lead AI Agent          | Fields for Outlook              | Output from AI Agent: Invalid leads are flagged and can be optionally handled.                                |
| Fields for Outlook            | Code (JavaScript)             | Extracts email addresses, subject, and body from AI output | Inquiry is Valid?              | Email Body Text Generated by AI  | Prepare for Email: Extract email fields for sending.                                                          |
| Email Body Text Generated by AI | Set                         | Assigns extracted email body text                 | Fields for Outlook             | Email Body for Outlook           | Email Body: Get only email body from previous node and convert to HTML.                                       |
| Email Body for Outlook        | Code (JavaScript)             | Converts plain text email body to HTML            | Email Body Text Generated by AI | Microsoft Outlook               | Send Email: Use AI-selected fields for email addresses, subject, and body. Optionally notify via WhatsApp.    |
| Microsoft Outlook             | Microsoft Outlook             | Sends email notification                          | Email Body for Outlook         | -                              |                                                                                                               |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: HTTP Webhook  
   - Path: `new-lead-generated-in-erpnext`  
   - HTTP Method: POST  
   - Purpose: Receive new lead data from ERPNext webhook.

2. **Add If Node "Source Website and Status Open"**  
   - Type: If  
   - Conditions:  
     - `$json.body.source` equals `"Website"`  
     - `$json.body.status` equals `"Open"`  
   - Connect Webhook output to this node.

3. **Add Set Node "Lead Body"**  
   - Type: Set  
   - Assign `body` field: `={{ $json.body }}`  
   - Connect "true" output of previous If node here.

4. **Add HTTP Request Node "Get Lead Data from ERPNext"**  
   - Type: HTTP Request  
   - URL: `https://erpnext.syncbricks.com/api/resource/Lead/{{ $json.body.name }}`  
   - Authentication: Use ERPNext API credentials (predefined credential type).  
   - Connect "Lead Body" output here.

5. **Add If Node "Inquiry has Notes"**  
   - Type: If  
   - Condition: Check if `$json.data.notes` exists and is not empty.  
   - Connect output of HTTP Request node here.

6. **Add LangChain AI Agent Node "Customer Lead AI Agent"**  
   - Type: LangChain AI Agent  
   - Configure system prompt with detailed instructions to:  
     - Analyze lead notes, extract customer and inquiry details.  
     - Classify inquiry as valid/invalid.  
     - Identify responsible contacts from Google Sheets and Docs.  
     - Generate email notification text or invalid lead message.  
   - Connect "true" output of "Inquiry has Notes" node here.

7. **Add OpenAI Chat Model Node**  
   - Type: LangChain OpenAI Chat Model  
   - Credentials: Provide OpenAI API key.  
   - Connect AI Agent node's AI language model input to this node.

8. **Add Google Sheets Nodes for Context**  
   - "Abbriviations": Google Sheets Tool reading abbreviation list.  
   - "Company Contact Database": Google Sheets Tool reading contact mapping sheet.  
   - Connect these as AI tool inputs to the AI Agent node.

9. **Add Google Docs Nodes for Context**  
   - "Company Profile" and "Company Policies": Google Docs Tool nodes retrieving company info and policies.  
   - Connect these as AI tool inputs to the AI Agent node.

10. **Add If Node "Inquiry is Valid?"**  
    - Type: If  
    - Condition: AI output not equal to `"**Invalid Lead - Not related to products, services, or solutions.**"`  
    - Connect AI Agent output here.

11. **Add Code Node "Fields for Outlook"**  
    - Type: Code (JavaScript)  
    - Paste code to extract email addresses, subject, and email body from AI output using regex.  
    - Connect "true" output of "Inquiry is Valid?" node here.

12. **Add Set Node "Email Body Text Generated by AI"**  
    - Type: Set  
    - Assign `email_body` field from extracted fields.  
    - Connect output of "Fields for Outlook" node here.

13. **Add Code Node "Email Body for Outlook"**  
    - Type: Code (JavaScript)  
    - Paste code to convert plain text email body into HTML format.  
    - Connect output of previous Set node here.

14. **Add Microsoft Outlook Node**  
    - Type: Microsoft Outlook  
    - Configure with OAuth2 credentials for your Outlook account.  
    - Set:  
      - Subject: `={{ $('Fields for Outlook').item.json.subject }}`  
      - Body Content: `={{ $json.html }}<a href="https://erpnext.syncbricks.com/app/lead/{{ $('Source Website and Status Open').item.json.body.name }}" target="_blank" rel="noopener noreferrer">Here is Lead {{ $('Source Website and Status Open').item.json.body.name }}</a>`  
      - To Recipients: `={{ $('Fields for Outlook').item.json.email_addresses }}`  
      - Body Content Type: HTML  
    - Connect output of "Email Body for Outlook" node here.

15. **Optional: Handle Invalid Leads**  
    - Connect "false" output of "Inquiry is Valid?" node to any custom handling or stop node.

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Once the Lead is generated in ERP: Create an inquiry web form in ERPNext and configure a webhook on the Lead DocType with trigger `on_insert` to start this workflow.                                                                                                                                                                                               | ERPNext webhook setup instructions.                                                             |
| Customer Experience Agent (AI): This AI agent uses company information from Google Docs and contact mappings from Google Sheets to analyze inquiries and assign responsible contacts. Ensure to provide accurate company data and contact sheets.                                                                                                                  | AI Agent design and data context.                                                               |
| Filter the Lead: This workflow filters leads to only those with source "Website" and status "Open". You can remove this filter to process all leads if desired.                                                                                                                                                                                                     | Lead filtering logic.                                                                            |
| Output from AI Agent: Invalid leads are flagged with a specific message and can be optionally routed for follow-up or dismissal.                                                                                                                                                                                                                                    | Invalid lead handling.                                                                           |
| Email Body: The plain text email generated by AI is converted into HTML for professional formatting before sending.                                                                                                                                                                                                                                                | Email formatting details.                                                                        |
| Send Email: Email addresses, subject, and body are dynamically selected by the AI agent. You can extend notifications to WhatsApp or SMS for urgent inquiries.                                                                                                                                                                                                     | Email sending and notification options.                                                        |
| Developed by Amjid Ali. Support and training resources are available at SyncBricks. Consider supporting the author via PayPal or accessing full courses on ERPNext and AI automation.                                                                                                                                                                              | Author credits and support links.                                                               |
| YouTube Tutorial: Full step-by-step video available at [SyncBricks YouTube Channel](https://youtube.com/@syncbricks)                                                                                                                                                                                                                                               | Video tutorial link.                                                                            |
| Courses and Training: Learn more at [SyncBricks LMS](http://lms.syncbricks.com)                                                                                                                                                                                                                                                                                      | Training platform link.                                                                         |
| Support Contact: Email amjid@amjidali.com, Website [SyncBricks](https://syncbricks.com), LinkedIn [Amjid Ali](https://linkedin.com/in/amjidali)                                                                                                                                                                                                                      | Contact information.                                                                            |

---

# End of Document