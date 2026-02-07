AI Client Onboarding Agent: Auto Welcome Email Generator

https://n8nworkflows.xyz/workflows/ai-client-onboarding-agent--auto-welcome-email-generator-4377


# AI Client Onboarding Agent: Auto Welcome Email Generator

---

### 1. Workflow Overview

This workflow automates the client onboarding process by generating and sending a personalized welcome email based on new client data added to a Google Sheets document. It targets businesses that want to streamline communication with new clients by automatically creating onboarding emails tailored to each client’s information and required services.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Monitors a Google Sheets spreadsheet for new client entries.
- **1.2 Client Data Preparation:** Extracts and formats client details and onboarding checklist information.
- **1.3 AI-Powered Email Generation:** Uses a Large Language Model (LLM) to generate a customized welcome email.
- **1.4 Email Dispatch:** Sends the generated email to the client via Gmail.
- **1.5 Workflow Lifecycle Management:** Handles successful completion and error conditions.
- **1.6 Support and Documentation:** Provides contact details and support resources via a sticky note.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Listens for new rows added to a specified Google Sheets spreadsheet, triggering the workflow when a new client submits onboarding data.
- **Nodes Involved:** `Google Sheets Trigger`
- **Node Details:**

  - **Google Sheets Trigger**
    - Type: Trigger node specialized for Google Sheets
    - Configuration: Watches the sheet named "Form Responses 1" within a document titled "Onboarding"
    - Polls every minute for new rows added
    - Key Expressions: Sheet and document IDs linked to the specific Google Sheets document
    - Input Connections: None (trigger node)
    - Output Connections: Passes data to `Client Data`
    - Edge Cases: Potential Google API authentication errors, rate limits, or delays in data propagation
    - Version: n8n base node version 1

#### 1.2 Client Data Preparation

- **Overview:** Extracts client information from the spreadsheet data and constructs a formatted string for use in the email body. Additionally, sets a static onboarding checklist for reference.
- **Nodes Involved:** `Client Data`, `Client Checklist`
- **Node Details:**

  - **Client Data**
    - Type: Set node; prepares data for downstream use
    - Configuration: Creates a multiline string named `fields` concatenating client name, email, company, services needed, and other onboarding info using expressions referencing Google Sheets Trigger output
    - Key Expressions:  
      ```
      Name:  {{ $json['Client name'] }} 
      Email:  {{ $json[' email '] }}
      Company: {{ $json['  Company Name  '] }}
      Service Needed: {{ $json['  Services Needed  '] }}
      Other info: {{ $json['  Any other onboarding info  '] }}
      ```
    - Input Connections: From `Google Sheets Trigger`
    - Output Connections: To `Client Checklist`
    - Edge Cases: Missing or malformed client fields may result in incomplete or incorrect email content

  - **Client Checklist**
    - Type: Set node; holds static onboarding checklist data
    - Configuration: Creates a string named `Checklist` listing key onboarding steps
    - Checklist content:
      ```
      Checklist: 
      1. Account setup
      2. Welcome call scheduled
      3. Document collection
      4. Service configuration
      5. Onboarding session
      6. First milestone review
      ```
    - Input Connections: From `Client Data`
    - Output Connections: To `Basic LLM Chain`
    - Edge Cases: Static content, low risk of failure

#### 1.3 AI-Powered Email Generation

- **Overview:** Generates a personalized onboarding welcome email using an AI language model, incorporating client data and checklist.
- **Nodes Involved:** `Basic LLM Chain`, `Google Gemini Chat Model`
- **Node Details:**

  - **Basic LLM Chain**
    - Type: LangChain LLM Chain node; orchestrates prompt-based AI text generation
    - Configuration:
      - Prompt instructs AI to generate only the email body text starting with "Hi [Client Name]" and ending with a sign-off using the company name.
      - Incorporates `Checklist` and `fields` variables from previous nodes.
    - Key Expressions:
      ```
      Hi {{ $('Google Sheets Trigger').item.json['Client name'] }},
      ...
      Best regards,
      Your {{ $('Google Sheets Trigger').item.json['  Company Name  '] }} Team
      ```
    - Input Connections: From `Client Checklist`
    - Output Connections: To `Gmail` and `Execution Completed`
    - Version-specific: Uses LangChain integration version 1.5
    - Edge Cases: AI model failure, prompt formatting errors, network timeouts

  - **Google Gemini Chat Model**
    - Type: LangChain AI language model node connecting to Google Gemini 2.0
    - Configuration: Utilizes "models/gemini-2.0-flash" to provide AI model capabilities for LLM Chain
    - Input Connections: AI language model input from `Basic LLM Chain`
    - Output Connections: To `Basic LLM Chain` (bidirectional AI integration)
    - Edge Cases: API authentication issues, model unavailability, latency

#### 1.4 Email Dispatch

- **Overview:** Sends the generated onboarding email to the client’s email address using Gmail integration.
- **Nodes Involved:** `Gmail`
- **Node Details:**

  - **Gmail**
    - Type: Gmail node for sending emails
    - Configuration:
      - Recipient address dynamically pulled from the Google Sheets Trigger (`email` field)
      - Email subject dynamically includes client name: "Welcome to Our Service, [Client Name]"
      - Email body set to the output text from `Basic LLM Chain`
    - Input Connections: From `Basic LLM Chain`
    - Output Connections: To `Execution Completed`
    - Credential Requirements: Configured Gmail OAuth2 credentials must be set up
    - Edge Cases: Authentication failure, sending limits, invalid recipient email addresses

#### 1.5 Workflow Lifecycle Management

- **Overview:** Manages workflow success and error completion paths.
- **Nodes Involved:** `Execution Completed`, `Error Handler`, `Execution Failure`
- **Node Details:**

  - **Execution Completed**
    - Type: No Operation node; marks successful workflow completion
    - Input Connections: From `Gmail`
    - Output Connections: None
    - Edge Cases: None

  - **Error Handler**
    - Type: Error Trigger node; activates on any workflow error
    - Input Connections: None (special trigger)
    - Output Connections: To `Execution Failure`
    - Edge Cases: Captures any unhandled errors in the workflow

  - **Execution Failure**
    - Type: No Operation node; marks workflow failure endpoint
    - Input Connections: From `Error Handler`
    - Output Connections: None
    - Edge Cases: None

#### 1.6 Support and Documentation

- **Overview:** Provides contact information, support resources, and author details as a sticky note within the workflow canvas.
- **Nodes Involved:** `Sticky Note`
- **Node Details:**

  - **Sticky Note**
    - Type: Informational note node
    - Content:
      ```
      =======================================
                  WORKFLOW ASSISTANCE
      =======================================
      For any questions or support, please contact:
          Yaron@nofluff.online

      Explore more tips and tutorials here:
         - YouTube: https://www.youtube.com/@YaronBeen/videos
         - LinkedIn: https://www.linkedin.com/in/yaronbeen/
      ======================================

      Author:
      Yaron Been
      ![Yaron Been](https://1.gravatar.com/avatar/a4e4dcaa1f76ff5266bbf80e8df86d22efda890474c68f7796e72fd82e3f2375?size=512&d=initials)
      ```
    - Position: Off to the side for reference
    - Edge Cases: None

---

### 3. Summary Table

| Node Name               | Node Type                     | Functional Role              | Input Node(s)           | Output Node(s)           | Sticky Note                                                                                                      |
|-------------------------|-------------------------------|-----------------------------|------------------------|--------------------------|-----------------------------------------------------------------------------------------------------------------|
| Sticky Note             | n8n-nodes-base.stickyNote      | Workflow assistance info     | None                   | None                     | For any questions or support, contact Yaron@nofluff.online. YouTube: https://www.youtube.com/@YaronBeen/videos LinkedIn: https://www.linkedin.com/in/yaronbeen/ |
| Start                   | n8n-nodes-base.start           | Workflow entry point         | None                   | Google Sheets Trigger     |                                                                                                                 |
| Google Sheets Trigger   | n8n-nodes-base.googleSheetsTrigger | Monitors new client data     | Start                  | Client Data               |                                                                                                                 |
| Client Data             | n8n-nodes-base.set             | Extracts and formats client data | Google Sheets Trigger  | Client Checklist          |                                                                                                                 |
| Client Checklist        | n8n-nodes-base.set             | Sets onboarding checklist    | Client Data             | Basic LLM Chain           |                                                                                                                 |
| Basic LLM Chain         | @n8n/n8n-nodes-langchain.chainLlm | Generates personalized email | Client Checklist        | Gmail, Execution Completed |                                                                                                                 |
| Google Gemini Chat Model| @n8n/n8n-nodes-langchain.lmChatGoogleGemini | Provides LLM model for AI   | Basic LLM Chain (AI LM) | Basic LLM Chain (AI LM)   |                                                                                                                 |
| Gmail                   | n8n-nodes-base.gmail           | Sends the onboarding email  | Basic LLM Chain         | Execution Completed       |                                                                                                                 |
| Execution Completed     | n8n-nodes-base.noOp            | Marks successful completion | Gmail                   | None                     |                                                                                                                 |
| Error Handler           | n8n-nodes-base.errorTrigger    | Captures workflow errors    | None                    | Execution Failure         |                                                                                                                 |
| Execution Failure       | n8n-nodes-base.noOp            | Marks workflow failure      | Error Handler            | None                     |                                                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Start Node**
   - Add an `n8n-nodes-base.start` node.
   - No special configuration needed.

2. **Configure Google Sheets Trigger**
   - Add `n8n-nodes-base.googleSheetsTrigger` node.
   - Set event to "rowAdded".
   - Configure to poll every minute.
   - Select the Google Sheets document by its ID: `19Hvti1sX6SvjP1Kj8dWFEiksiqn1FJVBoMToP2X6xBw`.
   - Select the sheet named "Form Responses 1".
   - Connect `Start` node output to this trigger.

3. **Add Client Data Preparation Node**
   - Add `n8n-nodes-base.set` node named `Client Data`.
   - Create a string field `fields` with the value:
     ```
     Name:  {{ $json['Client name'] }} 
     Email:  {{ $json[' email '] }}
     Company: {{ $json['  Company Name  '] }}
     Service Needed: {{ $json['  Services Needed  '] }}
     Other info: {{ $json['  Any other onboarding info  '] }}
     ```
   - Connect `Google Sheets Trigger` output to this node.

4. **Add Client Checklist Node**
   - Add another `n8n-nodes-base.set` node named `Client Checklist`.
   - Create a string field `Checklist` with content:
     ```
     Checklist: 
     1. Account setup
     2. Welcome call scheduled
     3. Document collection
     4. Service configuration
     5. Onboarding session
     6. First milestone review
     ```
   - Connect `Client Data` output to this node.

5. **Add AI Language Model Nodes**

   - Add `@n8n/n8n-nodes-langchain.lmChatGoogleGemini` node named `Google Gemini Chat Model`.
     - Set modelName to `models/gemini-2.0-flash`.
     - No additional parameters unless required for authentication.
   
   - Add `@n8n/n8n-nodes-langchain.chainLlm` node named `Basic LLM Chain`.
     - Set prompt type to "define".
     - Set prompt text to:
       ```
       Give me an onboarding check list for an email to the client, give me only email body and don't generate extra text like "Okay, here's an email template ..." and start and end on new lines
       start with:
       Hi {{ $('Google Sheets Trigger').item.json['Client name'] }}, 
       and end with 
       Best regards,
       Your {{ $('Google Sheets Trigger').item.json['  Company Name  '] }} Team

       :
       Also use information from checklist and Fields below
       {{ $json.Checklist }}

       Fields: {{ $('Client Data').item.json.fields }}
       ```
     - Connect `Client Checklist` output to `Basic LLM Chain`.
     - Connect the AI language model input of `Basic LLM Chain` to output of `Google Gemini Chat Model`.

6. **Add Gmail Node to Send Email**
   - Add `n8n-nodes-base.gmail` node named `Gmail`.
   - Configure credentials for Gmail OAuth2.
   - Set "Send To" as:
     ```
     ={{ $('Google Sheets Trigger').item.json[' email '] }}
     ```
   - Set "Subject" as:
     ```
     =Welcome to Our Service,  {{ $('Google Sheets Trigger').item.json['Client name'] }}
     ```
   - Set "Message" as:
     ```
     ={{ $json.text }}
     ```
   - Connect `Basic LLM Chain` main output to this node.

7. **Add Execution Completed Node**
   - Add `n8n-nodes-base.noOp` node named `Execution Completed`.
   - Connect output of `Gmail` node to this.

8. **Add Error Handling**
   - Add `n8n-nodes-base.errorTrigger` node named `Error Handler`.
   - Connect its output to an `n8n-nodes-base.noOp` node named `Execution Failure`.

9. **Add Sticky Note for Support**
   - Add `n8n-nodes-base.stickyNote` node.
   - Paste the following content:
     ```
     =======================================
                 WORKFLOW ASSISTANCE
     =======================================
     For any questions or support, please contact:
         Yaron@nofluff.online

     Explore more tips and tutorials here:
        - YouTube: https://www.youtube.com/@YaronBeen/videos
        - LinkedIn: https://www.linkedin.com/in/yaronbeen/
     ======================================

     Author:
     Yaron Been
     ![Yaron Been](https://1.gravatar.com/avatar/a4e4dcaa1f76ff5266bbf80e8df86d22efda890474c68f7796e72fd82e3f2375?size=512&d=initials)
     ```
   - Position it visibly on the canvas for easy reference.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                              |
|--------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| For workflow assistance, contact: Yaron@nofluff.online                                          | Contact email                                                |
| Explore more tips and tutorials on YouTube: https://www.youtube.com/@YaronBeen/videos            | YouTube channel                                              |
| LinkedIn profile of author: https://www.linkedin.com/in/yaronbeen/                               | Professional profile                                         |
| AI model used: Google Gemini 2.0 Flash model via LangChain integration                           | AI model integration details                                |
| Workflow designed for real-time onboarding email automation triggered by Google Sheets submissions | Use case and automation scope                               |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.

---