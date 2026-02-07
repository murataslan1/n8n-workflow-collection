 AI Client Onboarding Agent: Auto Welcome Email Generator

https://n8nworkflows.xyz/workflows/-ai-client-onboarding-agent--auto-welcome-email-generator-4448


#  AI Client Onboarding Agent: Auto Welcome Email Generator

### 1. Workflow Overview

This workflow, **AI Client Onboarding Agent: Auto Welcome Email Generator**, automates the onboarding process for new clients by generating and sending a personalized welcome email with a tailored onboarding checklist. It is triggered each time a new client submission is received via a Google Form linked to a Google Sheet.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Triggered by new client data added to a Google Sheet.
- **1.2 Data Extraction:** Extracts and structures client information from the form submission.
- **1.3 Default Checklist Setup:** Defines a default onboarding checklist.
- **1.4 AI Personalization:** Uses Google Gemini AI to tailor the checklist and compose the email body.
- **1.5 Email Dispatch:** Sends the personalized onboarding email to the client.
- **1.6 Execution Signaling:** Marks successful completion or failure, with dedicated error handling.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Listens for new rows added to a specific Google Sheet (connected to a Google Form), triggering the workflow when a client submits their onboarding form.

- **Nodes Involved:**  
  - Trigger on New Client Form Submission

- **Node Details:**

  - **Trigger on New Client Form Submission**  
    - Type: Google Sheets Trigger  
    - Configuration: Watches the sheet "Form Responses 1" inside the document "Onboarding" for any new row added, polling every minute.  
    - Connections: Outputs to "Extract and Structure Client Data".  
    - Edge Cases: Google Sheets API quota limits, connectivity issues, incorrect sheet or document ID, or form column changes causing missing data.

---

#### 1.2 Data Extraction

- **Overview:**  
  Extracts and formats key client details from the incoming form data for use in subsequent steps.

- **Nodes Involved:**  
  - Extract and Structure Client Data

- **Node Details:**

  - **Extract and Structure Client Data**  
    - Type: Set (data transformation)  
    - Configuration: Concatenates form fields into a single string named `fields` containing: Client Name, Email, Company, Services Needed, Other Info. Uses template expressions to handle field extraction with trimming spaces.  
    - Inputs: From Trigger node  
    - Outputs: To "Client Checklist"  
    - Edge Cases: Missing or malformed form data fields, inconsistent field names or extra spaces in keys, which may cause expression failures.

---

#### 1.3 Default Checklist Setup

- **Overview:**  
  Defines a static, default checklist of onboarding steps, serving as a base for AI personalization.

- **Nodes Involved:**  
  - Client Checklist

- **Node Details:**

  - **Client Checklist**  
    - Type: Set  
    - Configuration: Assigns a multi-line string checklist with steps such as Account Setup, Welcome Call Scheduled, Document Collection, etc. Stored under the field `Checklist`.  
    - Inputs: From "Extract and Structure Client Data"  
    - Outputs: To "Personalize Using Gemini"  
    - Edge Cases: None significant; static content.

---

#### 1.4 AI Personalization

- **Overview:**  
  Sends a prompt to Google Gemini AI model to generate a customized onboarding email body based on the client’s details and the default checklist.

- **Nodes Involved:**  
  - Personalize Using Gemini  
  - Google Gemini Chat Model (configured as AI language model node)

- **Node Details:**

  - **Google Gemini Chat Model**  
    - Type: LangChain Google Gemini Chat Model  
    - Configuration: Uses Gemini 2.0 flash model, authenticated via Google Palm API credentials. It is linked as the AI model provider for the "Personalize Using Gemini" node.  
    - Inputs: From "Personalize Using Gemini" (ai_languageModel input)  
    - Edge Cases: API authentication errors, quota limits, model downtime, or unexpected output format.

  - **Personalize Using Gemini**  
    - Type: Chain LLM (LangChain node)  
    - Configuration:  
      - Prompt instructs the model to generate only the email body with a greeting, checklist from `Checklist` field, and personalized client fields.  
      - Uses expressions to inject: client name, company name, checklist, and extracted fields from previous nodes.  
      - Output: email text body only, no extra text.  
    - Inputs: From "Client Checklist"  
    - Outputs: To "Send Email to Client" and "Execution Completed"  
    - Edge Cases: Expression evaluation failures, malformed prompt, or AI generating unexpected text.

---

#### 1.5 Email Dispatch

- **Overview:**  
  Sends the personalized onboarding email to the client’s submitted email address using Gmail SMTP.

- **Nodes Involved:**  
  - Send Email to Client

- **Node Details:**

  - **Send Email to Client**  
    - Type: Gmail  
    - Configuration:  
      - Sends to email extracted from the form submission.  
      - Subject includes client name.  
      - Message body is the text generated by the Gemini AI node.  
      - Uses Gmail OAuth2 credentials for authentication.  
    - Inputs: From "Personalize Using Gemini"  
    - Outputs: None (end node)  
    - Edge Cases: Gmail API auth failures, invalid client email, email sending limits, network timeouts.

---

#### 1.6 Execution Signaling & Error Handling

- **Overview:**  
  Indicates successful workflow completion or catches errors during execution for notification or logging purposes.

- **Nodes Involved:**  
  - Execution Completed  
  - Error Handler  
  - Execution Failure

- **Node Details:**

  - **Execution Completed**  
    - Type: No Operation (NoOp)  
    - Role: Marks successful end of workflow after email sent.  
    - Inputs: From "Personalize Using Gemini"  
    - Edge Cases: None.

  - **Error Handler**  
    - Type: Error Trigger  
    - Role: Listens globally for errors from any node above.  
    - Outputs: To "Execution Failure"  
    - Edge Cases: Triggered on any node failure including API errors, expression errors, or timeouts.

  - **Execution Failure**  
    - Type: No Operation (NoOp)  
    - Role: Placeholder for fallback or alerting actions (e.g., notifications).  
    - Inputs: From "Error Handler"  
    - Edge Cases: Can be extended to include alerts or retries.

---

### 3. Summary Table

| Node Name                         | Node Type                       | Functional Role                          | Input Node(s)                         | Output Node(s)                          | Sticky Note                                                                                   |
|----------------------------------|--------------------------------|----------------------------------------|-------------------------------------|----------------------------------------|------------------------------------------------------------------------------------------------|
| Trigger on New Client Form Submission | Google Sheets Trigger           | Initiates workflow on new form submission | Start                               | Extract and Structure Client Data       | ⏰ Trigger when a new row is added (Google Form response stored in Google Sheet)              |
| Extract and Structure Client Data | Set                            | Extracts and formats client info       | Trigger on New Client Form Submission | Client Checklist                       | 🧍 Extract client details: name, email, company, services                                   |
| Client Checklist                 | Set                            | Sets default onboarding checklist       | Extract and Structure Client Data   | Personalize Using Gemini                | 📋 Set the default onboarding checklist items                                               |
| Google Gemini Chat Model          | LangChain Google Gemini Chat Model | AI model for text generation            | — (used by Personalize Using Gemini) | Personalize Using Gemini (ai_languageModel) | 🧠 Send prompt to Gemini API to tailor checklist based on client data                      |
| Personalize Using Gemini          | Chain LLM (LangChain)          | Generates personalized email body       | Client Checklist                   | Send Email to Client, Execution Completed |                                                                                              |
| Send Email to Client             | Gmail                          | Sends customized onboarding email       | Personalize Using Gemini            | —                                      | 📤 Email the customized onboarding checklist to the client using their submitted email      |
| Execution Completed              | No Operation                   | Marks successful workflow completion     | Personalize Using Gemini            | —                                      | ✅ Indicates successful end of execution                                                    |
| Error Handler                   | Error Trigger                  | Captures errors from workflow nodes     | —                                 | Execution Failure                      | 🚨 Handles errors from any node above; can trigger notifications or log the failure         |
| Execution Failure                | No Operation                   | Placeholder for failure handling         | Error Handler                      | —                                      | ❌ Catch any errors during execution and take fallback or alerting action                   |
| Start                          | Start                         | Workflow entry point                      | —                                 | Trigger on New Client Form Submission  |                                                                                              |
| Sticky Note (various)            | Sticky Note                   | Documentation and comments                | —                                 | —                                      | See individual sticky notes below                                                           |
| Sticky Note1                    | Sticky Note                   | Workflow description                      | —                                 | —                                      | 📋 Client Onboarding Automation: trigger -> extract data -> Gemini AI personalization -> email |
| Sticky Note2                    | Sticky Note                   | Email sending explanation                  | —                                 | —                                      | 📤 Email the customized onboarding checklist to the client using their submitted email      |
| Sticky Note3                    | Sticky Note                   | Success indicator                          | —                                 | —                                      | ✅ Indicates successful end of execution                                                    |
| Sticky Note4                    | Sticky Note                   | Error handling explanation                 | —                                 | —                                      | 🚨 Handles errors from any node above; can trigger notifications or log the failure         |
| Sticky Note5                    | Sticky Note                   | Error catching explanation                 | —                                 | —                                      | ❌ Catch any errors during execution and take fallback or alerting action                   |
| Sticky Note6                    | Sticky Note                   | Gemini prompt explanation                   | —                                 | —                                      | 🧠 Send prompt to Gemini API to tailor checklist based on client name, company, and services |
| Sticky Note7                    | Sticky Note                   | Default checklist explanation               | —                                 | —                                      | 📋 Set the default onboarding checklist items                                               |
| Sticky Note8                    | Sticky Note                   | Client data extraction explanation          | —                                 | —                                      | 🧍 Extract client details: name, email, company, services                                   |
| Sticky Note9                    | Sticky Note                   | Trigger explanation                          | —                                 | —                                      | ⏰ Trigger when a new row is added (Google Form response stored in Google Sheet)             |
| Sticky Note                     | Sticky Note                   | Workflow assistance and contact info        | —                                 | —                                      | For questions or support contact Yaron@nofluff.online; links to YouTube and LinkedIn videos |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Start node:**  
   - Use n8n’s built-in Start node to initialize the workflow.

2. **Add a Google Sheets Trigger node:**  
   - Name: "Trigger on New Client Form Submission"  
   - Set event to "rowAdded".  
   - Specify the Google Sheet document by its ID and sheet name ("Form Responses 1").  
   - Set polling interval to once every minute.  
   - Configure Google Sheets Trigger OAuth2 credentials.  
   - Connect the Start node output to this trigger.

3. **Add a Set node to extract client data:**  
   - Name: "Extract and Structure Client Data"  
   - Assign a single string field `fields` concatenating:  
     ```
     Name:  {{ $json['Client name'] }} 
     Email:  {{ $json[' email '] }}
     Company: {{ $json['  Company Name  '] }}
     Service Needed: {{ $json['  Services Needed  '] }}
     Other info: {{ $json['  Any other onboarding info  '] }}
     ```  
   - Connect "Trigger on New Client Form Submission" output to this node.

4. **Add another Set node to define default checklist:**  
   - Name: "Client Checklist"  
   - Assign a string field `Checklist` with the value:  
     ```
     "Checklist": "
     1. Account setup
     2. Welcome call scheduled
     3. Document collection
     4. Service configuration
     5. Onboarding session
     6. First milestone review"
     ```  
   - Connect "Extract and Structure Client Data" output to this node.

5. **Add a LangChain Google Gemini Chat Model node:**  
   - Name: "Google Gemini Chat Model"  
   - Choose model "models/gemini-2.0-flash".  
   - Authenticate using Google Palm API credentials.  
   - This node is not directly connected but will be used as the AI language model for the next node.

6. **Add a Chain LLM node for AI personalization:**  
   - Name: "Personalize Using Gemini"  
   - Set prompt type to "define".  
   - Enter prompt:  
     ```
     Give me an onboarding check list for an email to the client, give me only email body and don't generate extra text like "Okay, here's an email template ..." and start and end on new lines
     start with:
     Hi {{ $('Trigger on New Client Form Submission').item.json['Client name'] }},
     and end with 
     Best regards,
     Your {{ $('Trigger on New Client Form Submission').item.json['  Company Name  '] }} Team

     :
     Also use information from checklist and Fields below
     {{ $json.Checklist }}

     Fields: {{ $('Extract and Structure Client Data').item.json.fields }}
     ```  
   - Link this node’s AI language model input to the "Google Gemini Chat Model" node.  
   - Connect "Client Checklist" output to this node.

7. **Add a Gmail node to send the email:**  
   - Name: "Send Email to Client"  
   - Set "Send To" field to `={{ $('Trigger on New Client Form Submission').item.json[' email '] }}`  
   - Set Subject to `=Welcome to Our Service,  {{ $('Trigger on New Client Form Submission').item.json['Client name'] }}`  
   - Set Message body to `={{ $json.text }}` (the AI generated text)  
   - Use Gmail OAuth2 credentials configured for your Gmail account.  
   - Connect "Personalize Using Gemini" output to this node.

8. **Add a NoOp node for successful execution:**  
   - Name: "Execution Completed"  
   - Connect "Personalize Using Gemini" output to this node as well (parallel to email node) to mark successful completion.

9. **Add an Error Trigger node:**  
   - Name: "Error Handler"  
   - Set it to listen for any errors in the workflow globally.

10. **Add a NoOp node for failure handling:**  
    - Name: "Execution Failure"  
    - Connect "Error Handler" output to this node to handle errors (expandable for alerts).

11. **Add Sticky Notes for documentation:**  
    - Create notes explaining each major step as per the sticky note contents in the workflow for clarity and maintenance.

---

### 5. General Notes & Resources

| Note Content                                                                                                                      | Context or Link                                                                                                                        |
|-----------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| For any questions or support, contact: Yaron@nofluff.online                                                                       | Author contact                                                                                                                        |
| Explore more tips and tutorials here:                                                                                             | YouTube: https://www.youtube.com/@YaronBeen/videos                                                                                   |
|                                                                                                                                   | LinkedIn: https://www.linkedin.com/in/yaronbeen/                                                                                    |
| Workflow automates client onboarding by integrating Google Forms, Google Sheets, Google Gemini AI, and Gmail for seamless communication. | Project overview                                                                                                                     |
| Error handling is implemented to catch failures and can be extended with notifications or alerts.                                  | Error management                                                                                                                     |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data are legal and public.