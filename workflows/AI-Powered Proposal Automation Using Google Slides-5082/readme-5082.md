AI-Powered Proposal Automation Using Google Slides

https://n8nworkflows.xyz/workflows/ai-powered-proposal-automation-using-google-slides-5082


# AI-Powered Proposal Automation Using Google Slides

### 1. Workflow Overview

This workflow automates the generation of customized AI-powered business proposals by integrating client input collected via a form with AI-generated content, Google Slides templating, and automated email delivery. Targeted at small businesses seeking tailored AI automation solutions, it streamlines proposal creation from discovery call data to a polished presentation sent directly to the client.

The workflow is logically divided into four main blocks:

- **1.1 Input Reception:** Captures client data from a discovery form.
- **1.2 AI Processing:** Uses OpenAI GPT-4 to generate a detailed, JSON-structured proposal based on input.
- **1.3 Proposal Document Creation:** Copies a Google Slides template and replaces placeholders with AI-generated content.
- **1.4 Proposal Delivery:** Sends the finalized proposal link to the client via email.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Receives client discovery data through a web form, including company details, problems, desired solutions, project scope, cost, and timeline.
- **Nodes Involved:**  
  - On form submission

##### Node: On form submission

- **Type & Role:** Form Trigger node; entry point capturing user input.
- **Configuration:**  
  - Form titled "DaeX AI - Client Discovery Form" with required fields: First Name, Last Name, Company Name, Email, Website, Problem, Solution, Scope, Cost, How soon?  
  - Webhook URL auto-generated for receiving form data.
- **Key Expressions:** Accessed later via expressions like `$('On form submission').item.json.Email`.
- **Input/Output:**  
  - No input.  
  - Outputs form data JSON to OpenAI node.
- **Failure Cases:**  
  - Webhook misconfiguration or connectivity issues.  
  - Missing required fields (form validation handles this).  
- **Version:** 2.2
- **Notes:** This node is the trigger for the entire workflow.

#### 2.2 AI Processing

- **Overview:** Sends the client data to OpenAI GPT-4 to generate a comprehensive proposal, structured exactly as a JSON object to populate the proposal template.
- **Nodes Involved:**  
  - OpenAI

##### Node: OpenAI

- **Type & Role:** OpenAI node (GPT-4 model) generating the proposal content.
- **Configuration:**  
  - Model: GPT-4o (GPT-4 optimized).  
  - Messages include:  
    - System prompt defining persona as David Olusola, CEO, expert in AI automation for SMBs.  
    - Assistant prompt requesting a specific JSON output with named fields for proposal sections.  
    - User prompt injecting client discovery data dynamically and providing instructions on tone, conciseness, and content scope.  
  - JSON output enabled to parse AI response as JSON automatically.
- **Key Expressions:** Uses dynamic expressions to inject client data into the prompt.
- **Input/Output:**  
  - Input: JSON from form submission.  
  - Output: Structured proposal JSON passed to Google Drive node.
- **Failure Cases:**  
  - API authentication errors or quota limits.  
  - AI model response formatting issues (non-JSON or incomplete output).  
  - Network timeouts.
- **Version:** 1.6
- **Credentials:** Requires configured OpenAI API credentials.
- **Notes:** The core AI content generation engine driving the proposal customization.

#### 2.3 Proposal Document Creation

- **Overview:** Copies a Google Slides template file and replaces multiple placeholder text tokens with the AI-generated proposal content and client cost data.
- **Nodes Involved:**  
  - Google Drive  
  - Replace Text (Google Slides)

##### Node: Google Drive

- **Type & Role:** Google Drive node copying the proposal template to create a new presentation instance.
- **Configuration:**  
  - Operation: Copy file.  
  - Source file ID: Hardcoded template ID.  
  - New file name: Set dynamically to the proposal title from AI output.  
  - Copy permissions: Writer permission not required for others.
- **Key Expressions:** Filename is `={{ $json.message.content.proposalTitle }}` from AI node output.
- **Input/Output:**  
  - Input: AI output JSON.  
  - Output: New presentation file metadata including presentationId for Slides.
- **Failure Cases:**  
  - Google Drive API quota or permission errors.  
  - Invalid template ID or missing file.
- **Version:** 3

##### Node: Replace Text

- **Type & Role:** Google Slides node replacing placeholder text variables in presentation slides.
- **Configuration:**  
  - Operation: ReplaceText.  
  - PresentationId: Pulled dynamically from Google Drive node output (`{{$json.id}}`).  
  - Multiple text replacement mappings where each placeholder (e.g., `{{proposalTitle}}`) is replaced by corresponding AI JSON field data (e.g., `={{ $('OpenAI').item.json.message.content.proposalTitle }}`).  
  - Includes all proposal sections: titles, descriptions, milestones, and cost.
- **Key Expressions:** Heavy use of expressions referencing AI node output fields to populate placeholders.
- **Input/Output:**  
  - Input: Google Drive output (presentation metadata).  
  - Output: Updated presentation metadata with replaced text.
- **Failure Cases:**  
  - Invalid presentation ID.  
  - Placeholder text not found in template causing no replacement.  
  - API rate limits or permission issues.
- **Version:** 2

#### 2.4 Proposal Delivery

- **Overview:** Sends the client an email with a link to the customized Google Slides proposal.
- **Nodes Involved:**  
  - Gmail

##### Node: Gmail

- **Type & Role:** Gmail node sending the final proposal email.
- **Configuration:**  
  - Recipient email dynamically set to client’s email from form submission.  
  - Subject: "Your Custom AI Automation Proposal - DaeX AI".  
  - Message body: Personalized greeting with client first name, company name, and direct link to the Google Slides presentation using presentationId.  
  - Email type: Plain text.  
  - Attribution disabled.
- **Key Expressions:** Uses expressions to embed client name and presentation link dynamically:  
  - `={{ $('On form submission').item.json.Email }}` for recipient.  
  - `https://docs.google.com/presentation/d/{{ $json.presentationId }}/edit` for the proposal link.
- **Input/Output:**  
  - Input: Google Slides node output for presentationId and form submission data for email address.  
  - Output: Email sent confirmation.
- **Failure Cases:**  
  - Authentication failure with Gmail.  
  - Invalid email address or missing field.  
  - Network or quota limits.
- **Version:** 2.1
- **Credentials:** Requires configured Gmail OAuth2 credentials.
- **Notes:** Final step in the customer communication flow.

#### 2.5 Auxiliary Nodes

##### Node: Sticky Note

- **Type & Role:** Documentation node providing setup instructions and overview.
- **Content:**  
  - Explains workflow purpose: automated AI proposals from client discovery calls.  
  - Setup instructions for OpenAI, Google Slides template, Gmail credentials.  
  - Testing and activation notes.
- **Position:** Top-left for visibility.
- **Failure Cases:** None (purely informational).

---

### 3. Summary Table

| Node Name          | Node Type                      | Functional Role                           | Input Node(s)          | Output Node(s)        | Sticky Note                                                                                              |
|--------------------|--------------------------------|-----------------------------------------|-----------------------|-----------------------|--------------------------------------------------------------------------------------------------------|
| Sticky Note        | Sticky Note                    | Documentation and setup instructions    |                       |                       | ## Automated Proposal Generator - Intelligent AI automation proposals generated from client discovery calls. Setup includes OpenAI, Google Slides template, Gmail credentials, and testing instructions. |
| On form submission | Form Trigger                   | Capture client discovery form data      |                       | OpenAI                |                                                                                                        |
| OpenAI             | OpenAI (GPT-4)                 | Generate structured AI proposal content | On form submission    | Google Drive          |                                                                                                        |
| Google Drive       | Google Drive                   | Copy proposal template file             | OpenAI                | Replace Text          |                                                                                                        |
| Replace Text       | Google Slides (Replace Text)  | Replace placeholders with AI content    | Google Drive          | Gmail                 |                                                                                                        |
| Gmail              | Gmail                         | Send proposal link email to client      | Replace Text          |                       |                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node**  
   - Type: Form Trigger  
   - Name: "On form submission"  
   - Configure form titled "DaeX AI - Client Discovery Form" with required fields:  
     *First Name, Last Name, Company Name, Email (email type), Website, Problem (textarea), Solution (textarea), Scope (textarea), Cost, How soon?*  
   - Ensure webhook is active and accessible.

2. **Add OpenAI Node**  
   - Type: OpenAI (GPT-4)  
   - Name: "OpenAI"  
   - Credentials: Configure OpenAI API credentials.  
   - Model: GPT-4o (GPT-4 optimized).  
   - Messages:  
     - System role defining persona as David Olusola, CEO, AI automation expert.  
     - Assistant prompt requesting JSON structured proposal fields with exact keys.  
     - User prompt injecting client data dynamically via expressions referencing form submission JSON fields (Company Name, Problem, Solution, Scope, Cost, How soon?).  
     - Enable JSON output parsing.  
   - Connect output from "On form submission" node to this OpenAI node.

3. **Add Google Drive Node**  
   - Type: Google Drive  
   - Name: "Google Drive"  
   - Credentials: Set Google Drive OAuth2 credentials with file copy permissions.  
   - Operation: Copy file.  
   - File ID: Use Google Slides proposal template file ID (update to your own template).  
   - Set new filename dynamically using expression: `={{ $json.message.content.proposalTitle }}` from OpenAI output.  
   - Connect output from "OpenAI" node to this node.

4. **Add Google Slides Replace Text Node**  
   - Type: Google Slides  
   - Name: "Replace Text"  
   - Credentials: Same Google OAuth2 as Google Drive.  
   - Operation: ReplaceText  
   - Presentation ID: Use expression to get new presentation ID from Google Drive node output `={{ $json.id }}`.  
   - Configure multiple text replacement pairs mapping placeholders (e.g., `{{proposalTitle}}`) to corresponding OpenAI JSON content fields (e.g., `={{ $('OpenAI').item.json.message.content.proposalTitle }}`), including all proposal title, description, milestones, and cost fields.  
   - Connect output from "Google Drive" node to this node.

5. **Add Gmail Node**  
   - Type: Gmail  
   - Name: "Gmail"  
   - Credentials: Setup OAuth2 Gmail credentials for sending email.  
   - Parameters:  
     - Send To: `={{ $('On form submission').item.json.Email }}`  
     - Subject: "Your Custom AI Automation Proposal - DaeX AI"  
     - Message: Plain text including personalized greeting with client first name, company name, and Google Slides link using `https://docs.google.com/presentation/d/{{ $json.presentationId }}/edit`.  
     - Disable attribution.  
   - Connect output from "Replace Text" node to this Gmail node.

6. **Optional: Add Sticky Note for Documentation**  
   - Add a Sticky Note node at the top left for workflow description and setup instructions.

7. **Activate Workflow**  
   - Test with sample form submissions before going live.  
   - Confirm OpenAI responses generate valid JSON.  
   - Verify Google Slides template placeholders match those used in Replace Text node.  
   - Check emails are sent correctly with proper links.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                   |
|----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow built and maintained by David Olusola, CEO of DaeX AI, expert in AI automation for SMBs                      | Internal project credit                                                                          |
| Ensure Google Slides proposal template includes all placeholders exactly as coded (`{{proposalTitle}}`, etc.)          | Template must be pre-created with placeholders for text replacement                             |
| OpenAI API usage requires valid subscription and quota management                                                     | https://platform.openai.com/account/api-keys                                                    |
| Gmail node requires OAuth2 setup with "Send email" permission                                                          | https://developers.google.com/gmail/api/auth/scopes                                             |
| Testing recommended with sample data to validate AI JSON output and correct text replacements                          | Use n8n manual execution and debug mode                                                          |

---

This document fully describes the "Automated Proposal Generator" workflow, enabling reproduction, modification, and troubleshooting.