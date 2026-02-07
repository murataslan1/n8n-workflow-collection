AI-Powered Web Form Responder with GPT-4o-mini, Outlook Email & Twilio SMS

https://n8nworkflows.xyz/workflows/ai-powered-web-form-responder-with-gpt-4o-mini--outlook-email---twilio-sms-6716


# AI-Powered Web Form Responder with GPT-4o-mini, Outlook Email & Twilio SMS

### 1. Workflow Overview

This workflow automates personalized responses to web form submissions using AI (GPT-4o-mini), sending replies via Outlook email and Twilio SMS. It is designed for solo consultants or small teams who want to instantly acknowledge and professionally engage new web leads without manual effort.

The workflow is structured into these logical blocks:

- **1.1 Input Reception:** Captures user entries through an embedded web form collecting name, email, phone, and question.
- **1.2 AI Processing:** Uses LangChain’s AI Agent node with GPT-4o-mini to generate a professional email and a friendly SMS based on the submission.
- **1.3 Response Delay:** Implements brief waits to simulate human response time for email and SMS separately.
- **1.4 Outbound Communication:** Sends the AI-generated email through Microsoft Outlook and the text message via Twilio SMS.
- **1.5 Documentation & Setup Notes:** Contains sticky notes with detailed instructions, links, and contact info for setup and customization.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block captures visitor input from a web-embedded form, gathering essential contact and query details.

**Nodes Involved:**  
- Form to be embedded on website

**Node Details:**  

- **Form to be embedded on website**  
  - Type: Form Trigger (n8n-nodes-base.formTrigger)  
  - Role: Web form endpoint, gathers Name, Email, Question, Phone fields from visitors.  
  - Configuration: Form titled "Web Contact Form" with four fields: Name, Email, Question, Phone (placeholder "+1 111-111-1111").  
  - Input/Output: Triggered by form submission; outputs JSON with submitted data.  
  - Edge cases: Missing or malformed input fields; no email or phone may cause downstream sending failures.  
  - Version: 2.2  
  - Notes: Webhook ID configured for inbound form posts; form can be embedded via iframe on website.

---

#### 2.2 AI Processing

**Overview:**  
Generates a structured AI response comprising a professional email and a casual SMS based on the form submission data.

**Nodes Involved:**  
- AI Agent  
- OpenAI Chat Model  
- Structured Output Parser

**Node Details:**  

- **AI Agent**  
  - Type: LangChain Agent Node (@n8n/n8n-nodes-langchain.agent)  
  - Role: Orchestrates prompt generation and response parsing.  
  - Configuration:  
    - Input prompt uses expressions to inject form fields: `Name` and `Question`.  
    - System message defines the assistant’s role and detailed instructions for crafting email and SMS responses with specified tone and content elements.  
    - Output is expected in JSON with "email" and "text" keys.  
  - Inputs: JSON from form node.  
  - Outputs: Parsed AI responses forwarded downstream.  
  - Edge cases: AI model timeout, malformed JSON output, prompt injection errors.  
  - Version: 2  
  - Sub-workflow: None.

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model Node (@n8n/n8n-nodes-langchain.lmChatOpenAi)  
  - Role: Provides the GPT-4o-mini AI model backend for language generation.  
  - Configuration: Model set to "gpt-4o-mini", empty options.  
  - Credentials: OpenAI API key configured.  
  - Inputs: Receives prompt from AI Agent.  
  - Outputs: Raw AI response to AI Agent.  
  - Edge cases: API key invalid, rate limits, network issues.  
  - Version: 1.2

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser (@n8n/n8n-nodes-langchain.outputParserStructured)  
  - Role: Ensures AI output conforms to expected JSON schema with "email" and "text" fields.  
  - Configuration: JSON schema example provided for validation.  
  - Inputs: AI raw output.  
  - Outputs: Validated and parsed JSON for downstream nodes.  
  - Edge cases: Parsing failure if AI output deviates from schema.  
  - Version: 1.2

---

#### 2.3 Response Delay

**Overview:**  
Simulates human response time by introducing 1-minute delays before sending email and SMS independently.

**Nodes Involved:**  
- Wait some time to write the email response  
- Wait some time to write the text response

**Node Details:**  

- **Wait some time to write the email response**  
  - Type: Wait node (n8n-nodes-base.wait)  
  - Role: Delays email sending by 1 minute.  
  - Configuration: Wait duration set to 1 minute.  
  - Inputs: AI Agent output.  
  - Outputs: Triggers "Send email to the submitter" node.  
  - Edge cases: Workflow pause issues or cancellation.  
  - Version: 1.1

- **Wait some time to write the text response**  
  - Type: Wait node (n8n-nodes-base.wait)  
  - Role: Delays SMS sending by 1 minute separately.  
  - Configuration: Wait duration set to 1 minute.  
  - Inputs: AI Agent output.  
  - Outputs: Triggers "Send text to the submitter" node.  
  - Edge cases: Same as above.  
  - Version: 1.1

---

#### 2.4 Outbound Communication

**Overview:**  
Sends the AI-generated email and SMS messages to the user via Microsoft Outlook and Twilio respectively.

**Nodes Involved:**  
- Send email to the submitter  
- Send text to the submitter

**Node Details:**  

- **Send email to the submitter**  
  - Type: Microsoft Outlook node (n8n-nodes-base.microsoftOutlook)  
  - Role: Sends personalized email response.  
  - Configuration:  
    - Subject fixed as "Web form - How can we help?"  
    - Body content dynamically set from AI Agent’s "email" output.  
    - Recipient dynamically set from form submission’s Email field.  
  - Credentials: Microsoft Outlook OAuth2 account with send-mail permissions.  
  - Inputs: Output from wait node after delay.  
  - Outputs: None connected (end node).  
  - Edge cases: Email sending failure (auth, connectivity), invalid recipient email.  
  - Version: 2

- **Send text to the submitter**  
  - Type: Twilio node (n8n-nodes-base.twilio)  
  - Role: Sends the SMS response.  
  - Configuration:  
    - "To" number dynamically set from form submission’s Phone field.  
    - "From" number must be set to a verified Twilio number (user to update manually).  
    - Message content dynamically set from AI Agent’s "text" output.  
  - Credentials: Twilio API credentials (Account SID, Auth Token).  
  - Inputs: Output from wait node after delay.  
  - Outputs: None connected (end node).  
  - Edge cases: Invalid phone number, Twilio API errors, unverified sender number.  
  - Version: 1

---

#### 2.5 Documentation & Setup Notes

**Overview:**  
Provides detailed instructions, setup guidance, and contact details via sticky notes in the workflow editor for user reference.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1

**Node Details:**  

- **Sticky Note**  
  - Type: Sticky Note (n8n-nodes-base.stickyNote)  
  - Role: Displays author contact info and LinkedIn link.  
  - Content: Name and LinkedIn URL for Robert Breen, email address.  
  - Position: Top left for easy visibility.

- **Sticky Note1**  
  - Type: Sticky Note  
  - Role: Extensive readme-style instructions on workflow purpose, setup, customization tips, and contact info.  
  - Content:  
    - Workflow description  
    - Setup instructions including credential acquisition and node configuration  
    - Embedding the form instructions  
    - Customization ideas (integration with CRM, alerts, calendar links, language detection)  
    - Contact and social media links  
  - Positioned on far left to remain visible during edits.

---

### 3. Summary Table

| Node Name                          | Node Type                           | Functional Role                      | Input Node(s)                     | Output Node(s)                             | Sticky Note                                                                                                        |
|-----------------------------------|-----------------------------------|------------------------------------|----------------------------------|--------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| Form to be embedded on website    | Form Trigger                      | Input Reception - captures form data | None (trigger)                   | AI Agent                                  | See Sticky Note1 for setup instructions and description                                                           |
| AI Agent                         | LangChain Agent                   | AI Processing - generate email & text | Form to be embedded on website  | Wait some time to write the text response, Wait some time to write the email response | See Sticky Note1 for prompt details and customization options                                                       |
| OpenAI Chat Model                | LangChain OpenAI Chat Model       | AI model backend for generation    | AI Agent (ai_languageModel)      | AI Agent                                  |                                                                                                                    |
| Structured Output Parser         | LangChain Output Parser Structured | Parse AI output to JSON            | OpenAI Chat Model (ai_outputParser) | AI Agent                                  |                                                                                                                    |
| Wait some time to write the email response | Wait Node                         | Delay email sending by 1 min       | AI Agent                        | Send email to the submitter                 |                                                                                                                    |
| Wait some time to write the text response | Wait Node                         | Delay SMS sending by 1 min         | AI Agent                        | Send text to the submitter                   |                                                                                                                    |
| Send email to the submitter      | Microsoft Outlook                 | Send generated email to submitter  | Wait some time to write the email response | None                                    |                                                                                                                    |
| Send text to the submitter       | Twilio                           | Send generated SMS to submitter    | Wait some time to write the text response | None                                    | Note: Set your verified Twilio “From” number in node parameters                                                    |
| Sticky Note                      | Sticky Note                      | Author contact info                 | None                            | None                                       | LinkedIn: https://www.linkedin.com/in/robertbreen Email: rbreen@ynteractive.com                                    |
| Sticky Note1                     | Sticky Note                      | Workflow overview, instructions, customization tips | None                            | None                                       | Extensive setup and usage instructions, credential links, embedding tips, customization ideas, contact and socials |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Web Form Trigger node:**  
   - Add a Form Trigger node named "Form to be embedded on website".  
   - Configure form title as "Web Contact Form".  
   - Add fields: Name, Email, Question, Phone (with placeholder "+1 111-111-1111").  
   - Save and note the webhook URL for embedding.

2. **Add LangChain AI Agent node:**  
   - Add node "AI Agent" (LangChain Agent).  
   - Set the prompt text to:  
     ```
     =Name: {{ $json.Name }}
     Question: {{ $json.Question }}
     ```  
   - Configure the system message with instructions for crafting an email and SMS as specified, including greeting by name, referencing question, asking clarifying questions, urgency query, and sign-off.  
   - Set promptType to "define" and enable output parser.  
   - Connect "Form to be embedded on website" output to "AI Agent" input.

3. **Add OpenAI Chat Model node:**  
   - Add "OpenAI Chat Model" node.  
   - Set model to "gpt-4o-mini".  
   - Add OpenAI API credentials (get API key from https://platform.openai.com).  
   - Connect "OpenAI Chat Model" output to "AI Agent" AI language model input.

4. **Add Structured Output Parser node:**  
   - Add "Structured Output Parser" node.  
   - Provide JSON schema example:  
     ```json
     {
       "email": "response",
       "text": "response"
     }
     ```  
   - Connect output parser to AI Agent output parser input.

5. **Add two Wait nodes:**  
   - "Wait some time to write the email response"  
     - Set wait to 1 minute.  
     - Connect from "AI Agent" main output.  
   - "Wait some time to write the text response"  
     - Set wait to 1 minute.  
     - Connect from "AI Agent" main output.

6. **Add Microsoft Outlook node for email sending:**  
   - Add "Send email to the submitter" node.  
   - Configure:  
     - Subject: "Web form - How can we help?"  
     - Body content: `={{ $json.output.email }}`  
     - To recipients: `={{ $('Form to be embedded on website').item.json.Email }}`  
   - Add Microsoft Outlook OAuth2 credentials (must have email send permission).  
   - Connect from "Wait some time to write the email response".

7. **Add Twilio node for SMS sending:**  
   - Add "Send text to the submitter" node.  
   - Configure:  
     - To: `={{ $('Form to be embedded on website').item.json.Phone }}`  
     - From: your verified Twilio phone number (must replace placeholder).  
     - Message: `={{ $json.output.text }}`  
   - Add Twilio credentials (Account SID, Auth Token).  
   - Connect from "Wait some time to write the text response".

8. **Add Sticky Notes:**  
   - Add one sticky note with author contact info and LinkedIn link.  
   - Add a second sticky note with full workflow description, setup instructions, credential acquisition links, embedding instructions, customization ideas, and contact info.

9. **Test the workflow:**  
   - Activate the form node to generate a public URL.  
   - Submit test data via the form.  
   - Confirm email and SMS received after ~1 minute delay.

10. **Deploy and activate:**  
    - Ensure all nodes are active.  
    - Embed form iframe in your website contact page.  
    - Adjust wait times or AI prompt as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                | Context or Link                                                                                     |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Workflow created by Robert Breen, expert in n8n automation and AI integration.                                                                                                                                                                                                                              | LinkedIn: https://www.linkedin.com/in/robertbreen                                               |
| Comprehensive setup instructions, credential sourcing guidance, and customization ideas embedded in sticky notes within the workflow.                                                                                                                                                                      | See Sticky Note1 content in workflow                                                             |
| Recommended to use Microsoft Outlook OAuth2 with appropriate permissions and Twilio verified phone number for smooth operations.                                                                                                                                                                           | Microsoft Azure/M365 & Twilio official portals                                                   |
| Embed the web form on your website using the Form Trigger node’s iframe embed code for seamless visitor interaction.                                                                                                                                                                                      | n8n Form Trigger documentation                                                                   |
| Customization suggestions include CRM integration (Pipedrive, HubSpot, Airtable), team notifications (Slack, Teams), calendar booking links, and multi-language support.                                                                                                                                   | Included in Sticky Note1                                                                          |
| For advanced users: consider monitoring API usage and handling AI output errors gracefully to improve reliability.                                                                                                                                                                                         | n8n error handling best practices                                                                |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All manipulated data are legal and public.