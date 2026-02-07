AI-Powered Post-Sales Call Automated Proposal Generator

https://n8nworkflows.xyz/workflows/ai-powered-post-sales-call-automated-proposal-generator-4359


# AI-Powered Post-Sales Call Automated Proposal Generator

### 1. Workflow Overview

This workflow automates the generation of customized post-sales proposals immediately after a sales call form submission. It is designed for automation/no-code agencies focusing on growth and revenue operations solutions. The workflow’s key purpose is to take structured sales call inputs, leverage AI to generate a detailed proposal in JSON format, populate a Google Slides template with this data, and then email the finished proposal to the prospect.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Captures sales call details via a form.
- **1.2 AI Proposal Generation**: Sends form data to OpenAI to generate a complete proposal in JSON.
- **1.3 Google Slides Template Handling**: Copies a Google Slides template and replaces placeholder text fields with AI-generated proposal content.
- **1.4 Email Dispatch**: Sends the finalized proposal link to the prospect via Gmail.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block captures input data about a sales call through a dedicated form trigger node. It collects structured information such as client name, company, problem description, proposed solutions, scope, cost, and timeline.

- **Nodes Involved:**  
  - On form submission  
  - Sticky Note (documentation aid)

- **Node Details:**

  - **On form submission**  
    - *Type:* Form Trigger  
    - *Role:* Entry point capturing sales call data.  
    - *Configuration:*  
      - Form titled “Sales Call Logging Form” with required fields: First Name, Last Name, Company Name, Email, Website, Problem, Solution, Scope, Cost, and How Soon?  
      - Collects form responses via webhook.  
    - *Input:* External form submission webhook.  
    - *Output:* JSON object containing all submitted form fields.  
    - *Edge Cases:*  
      - Missing required fields will block submission.  
      - Email field validated for proper format.  
      - Network/webhook failures could cause data loss or delays.  
    - *Sticky Note:* Present nearby describing the workflow’s purpose.

  - **Sticky Note**  
    - *Type:* Sticky Note  
    - *Role:* Provides high-level context for the workflow.  
    - *Content:* “Google Slides AI Proposal Generator — This flow generates proposals using AI and the free Google Slides solution.”  
    - *Input/Output:* None (informational only)

#### 2.2 AI Proposal Generation

- **Overview:**  
  This block sends the captured form data to OpenAI’s GPT-4o model with a detailed system prompt requesting a customized proposal returned as a JSON object with specific fields. The AI response is parsed and formatted to produce concise, professional proposal content.

- **Nodes Involved:**  
  - OpenAI

- **Node Details:**

  - **OpenAI**  
    - *Type:* n8n Langchain OpenAI Node  
    - *Role:* Generates a structured, custom proposal using AI based on input data.  
    - *Configuration:*  
      - Model: GPT-4o  
      - Messages:  
        - System message defines assistant role and output format as JSON with explicit fields for proposal sections.  
        - User messages include context about the agency, tone, style rules, and a sample input JSON structure.  
        - An expression assembles the current form submission data into a JSON-like object for the AI.  
      - Outputs JSON with fields like proposalTitle, descriptionName, problem summary, solution headings/descriptions, scope titles/descriptions, milestones, and their descriptions.  
    - *Input:* JSON data from form submission node.  
    - *Output:* JSON object with all required proposal fields.  
    - *Version:* Uses version 1.6 of the node, compatible with GPT-4o.  
    - *Edge Cases:*  
      - AI returning incomplete or malformed JSON (mitigated by prompt).  
      - API authentication errors or rate limits.  
      - Timeout or connectivity issues.  
      - Unexpected changes in API response format.  
    - *Note:* Critical node that must handle and validate AI output carefully for downstream processing.

#### 2.3 Google Slides Template Handling

- **Overview:**  
  This block copies a pre-existing Google Slides presentation template, then replaces placeholder text fields within the copy using values from the AI-generated proposal JSON object.

- **Nodes Involved:**  
  - Google Drive  
  - Replace Text (Google Slides)

- **Node Details:**

  - **Google Drive**  
    - *Type:* Google Drive Node  
    - *Role:* Creates a copy of the Google Slides presentation template to personalize per proposal.  
    - *Configuration:*  
      - Operation: Copy  
      - File ID: Set to the Google Slides template ID (must be replaced with the actual template file ID).  
      - Name: Uses the proposalTitle from AI response to name the new copy.  
      - Does not require writer permission to copy.  
    - *Input:* AI-generated JSON from OpenAI node.  
    - *Output:* JSON containing new presentation ID.  
    - *Edge Cases:*  
      - Invalid or missing Google Slides template ID causes failure.  
      - API rate limits or permission errors.  
      - Name conflicts or invalid characters in proposalTitle.  

  - **Replace Text**  
    - *Type:* Google Slides Node  
    - *Role:* Performs text replacement in the copied Google Slides document, substituting placeholders with AI-generated content.  
    - *Configuration:*  
      - Operation: Replace Text  
      - Presentation ID: Uses ID from Google Drive copy output.  
      - Text replacements: Maps multiple placeholders like {{proposalTitle}}, {{descriptionName}}, {{solutionHeadingOne}}, etc., to corresponding fields in the AI-generated proposal JSON.  
      - Also replaces {{cost}} placeholder with the cost value from form submission data.  
    - *Input:* Presentation ID from Google Drive node and AI JSON output.  
    - *Output:* Confirmation of text replacement success.  
    - *Edge Cases:*  
      - Placeholders missing or mismatched in the template cause incomplete replacements.  
      - Large text replacement may hit API limits.  
      - Errors in expression evaluation if AI output fields are missing or malformed.

#### 2.4 Email Dispatch

- **Overview:**  
  This block sends an email to the prospect containing a personalized message and a link to the newly generated proposal in Google Slides.

- **Nodes Involved:**  
  - Gmail

- **Node Details:**

  - **Gmail**  
    - *Type:* Gmail Node  
    - *Role:* Sends a notification email to the client with a link to the Google Slides proposal.  
    - *Configuration:*  
      - Send To: Email address from the form submission.  
      - Subject: Includes the company name from the form submission.  
      - Message Body: Personalized text referencing the prospect’s first name and containing a direct link to the Google Slides presentation using the presentation ID.  
      - Email type: Plain text, disables attribution footer.  
    - *Input:* Presentation ID from Replace Text node, form submission data for email and names.  
    - *Output:* Email send confirmation.  
    - *Edge Cases:*  
      - Invalid email address or missing recipient field.  
      - Gmail API authentication or quota issues.  
      - Presentation link broken if Google Slides copy failed.

---

### 3. Summary Table

| Node Name          | Node Type                  | Functional Role                 | Input Node(s)        | Output Node(s)     | Sticky Note                                                  |
|--------------------|----------------------------|--------------------------------|----------------------|--------------------|--------------------------------------------------------------|
| On form submission  | Form Trigger               | Capture sales call data         | None                 | OpenAI             | Google Slides AI Proposal Generator: generates proposals using AI and Google Slides. |
| Sticky Note        | Sticky Note                | Documentation note              | None                 | None               | Google Slides AI Proposal Generator — This flow generates proposals using AI and the free Google Slides solution. |
| OpenAI             | Langchain OpenAI           | Generate proposal JSON via AI   | On form submission   | Google Drive       |                                                              |
| Google Drive       | Google Drive               | Copy Google Slides template     | OpenAI               | Replace Text       |                                                              |
| Replace Text       | Google Slides              | Replace placeholders with AI data | Google Drive       | Gmail              |                                                              |
| Gmail              | Gmail                      | Send proposal email to prospect | Replace Text         | None               |                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create “On form submission” Node:**  
   - Type: Form Trigger  
   - Configure with form titled “Sales Call Logging Form”  
   - Add required fields: First Name, Last Name, Company Name, Email (email type), Website, Problem (textarea), Solution (textarea), Scope (textarea), Cost, How Soon?  
   - Set webhook URL to receive submissions.

2. **Add “Sticky Note” Node (Optional):**  
   - Content: “Google Slides AI Proposal Generator — This flow generates proposals using AI and the free Google Slides solution.”  
   - Position near form submission node for documentation.

3. **Add “OpenAI” Node:**  
   - Type: Langchain OpenAI Node  
   - Set model to GPT-4o or equivalent advanced GPT-4 variant.  
   - Configure messages:  
     - System prompt: Define assistant role as intelligent writing assistant, specify JSON output format with all proposal fields, tone and style rules.  
     - User prompt: Provide context about the agency and example JSON input.  
     - Include an expression that maps form data to a JSON object for AI input, using expressions like `{{ $json['Company Name'] }}`, `{{ $now.toLocaleString({ dateStyle: 'medium' }) }}`, etc.  
   - Enable JSON output.

4. **Add “Google Drive” Node:**  
   - Type: Google Drive  
   - Operation: Copy  
   - File ID: Enter your Google Slides proposal template ID (replace placeholder).  
   - Name: Use expression to name the copy with `proposalTitle` from OpenAI output, e.g., `={{ $json.message.content.proposalTitle }}`.  
   - Allow copying without requiring writer permission.

5. **Add “Replace Text” Node (Google Slides):**  
   - Operation: Replace Text  
   - Presentation ID: Use the ID output from Google Drive copy.  
   - Define multiple text replacements mapping placeholders like `{{proposalTitle}}`, `{{descriptionName}}`, `{{solutionHeadingOne}}`, `{{cost}}`, etc., to the respective fields from OpenAI output JSON and form submission JSON (for cost).  
   - Use expressions to reference these fields, e.g., `={{ $('OpenAI').item.json.message.content.proposalTitle }}`.

6. **Add “Gmail” Node:**  
   - Configure to send email:  
     - To: Email from form submission `={{ $('On form submission').item.json.Email }}`  
     - Subject: Include company name dynamically, e.g., `=Re: Proposal for {{ $('On form submission').item.json['Company Name'] }}`  
     - Message: Personalized email body referencing first name and including the Google Slides link with presentation ID from Replace Text node:  
       ```
       Hey {{ $('On form submission').item.json['First Name'] }},

       Thanks for the great call earlier. I had a moment after our chat to put together a detailed proposal for you—please take a look at your earliest convenience and let me know your thoughts.

       You'll find it here: https://docs.google.com/presentation/d/{{ $json.presentationId }}/edit

       If you have any questions, just ask. I've also sent over an invoice for the project (just to keep things convenient) and we can get started anytime that's sorted.

       Thanks,
       [YOUR NAME]
       ```
   - Set sending options, disable attribution.

7. **Connect Workflow Nodes:**  
   - Connect “On form submission” → “OpenAI”  
   - Connect “OpenAI” → “Google Drive”  
   - Connect “Google Drive” → “Replace Text”  
   - Connect “Replace Text” → “Gmail”

8. **Credential Setup:**  
   - Configure OpenAI credentials for GPT-4o access.  
   - Set up Google Drive credentials with permissions to copy and edit Google Slides files.  
   - Authenticate Gmail node using OAuth2 with send email permissions.

9. **Testing and Validation:**  
   - Submit a test form entry with realistic data.  
   - Confirm AI generates complete JSON proposal.  
   - Validate Google Slides copy and text replacements occur correctly.  
   - Verify email sends with correct personalized content and working link.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                       |
|-----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| This workflow leverages the free Google Slides API for templated proposal generation combined with OpenAI’s GPT-4o.    | Core technical approach for AI-assisted document generation.                                        |
| Replace the Google Slides template ID placeholder with your actual slide deck template ID before running the workflow. | Important step to avoid runtime failures in Google Drive node.                                       |
| For detailed instructions on setting up Google Drive OAuth2 credentials in n8n, refer to: https://docs.n8n.io/integrations/n8n-nodes-base.google-drive/ | Official n8n Google Drive node documentation.                                                       |
| Ensure your OpenAI API key has access to GPT-4o or the GPT-4 variant you plan to use.                                  | OpenAI API access prerequisite for the Langchain OpenAI node.                                       |
| Gmail OAuth2 setup is required with “Send Email” scope enabled for the Gmail node to function.                         | Google account and permissions configuration for email dispatch.                                    |

---

**Disclaimer:**  
The provided content originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly follows current content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.