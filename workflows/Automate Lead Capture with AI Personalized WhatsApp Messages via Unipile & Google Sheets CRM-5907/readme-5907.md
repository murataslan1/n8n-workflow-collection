Automate Lead Capture with AI Personalized WhatsApp Messages via Unipile & Google Sheets CRM

https://n8nworkflows.xyz/workflows/automate-lead-capture-with-ai-personalized-whatsapp-messages-via-unipile---google-sheets-crm-5907


# Automate Lead Capture with AI Personalized WhatsApp Messages via Unipile & Google Sheets CRM

### 1. Workflow Overview

This workflow automates the process of capturing new leads through a form, generating personalized WhatsApp messages using AI, sending these messages via the Unipile WhatsApp API, and logging the results in Google Sheets for CRM purposes. It is designed for businesses seeking to engage leads efficiently and personally, leveraging AI to craft outreach messages and track communication outcomes.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures incoming lead data via a web form trigger.
- **1.2 AI Message Generation:** Uses OpenAI GPT-4.1-mini to create personalized WhatsApp messages based on form inputs.
- **1.3 WhatsApp Message Dispatch:** Sends the AI-generated message through the Unipile WhatsApp API.
- **1.4 Outcome Evaluation:** Checks if the WhatsApp message was sent successfully or failed.
- **1.5 CRM Logging:** Logs the lead data and messaging outcome into separate Google Sheets tabs depending on success or failure.
- **1.6 Documentation and Setup Notes:** Provides user-facing sticky notes with instructions and resource links.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Input Reception

- **Overview:**  
Receives lead information submitted through an embedded or standalone inquiry form. This is the workflow entry point.

- **Nodes Involved:**  
  - Enquiry Form

- **Node Details:**

  **Enquiry Form**  
  - Type: Form Trigger  
  - Role: Captures user submissions with fields: Full Name (required), Email (required), Whatsapp, Company Name, and "How can we help you?"  
  - Configuration: Configured via webhook ID; form fields explicitly defined; serves as the starting point of the workflow upon form submission.  
  - Inputs: External user submission via webhook  
  - Outputs: Form data JSON object with user inputs  
  - Edge Cases: Missing required fields can prevent submission; malformed data inputs; webhook connectivity issues.  
  - Sub-workflows: None  

---

#### Block 1.2: AI Message Generation

- **Overview:**  
Processes the received form data through the OpenAI service to generate a friendly, personalized WhatsApp message aimed at engaging the lead.

- **Nodes Involved:**  
  - OpenAI

- **Node Details:**

  **OpenAI**  
  - Type: LangChain OpenAI Node  
  - Role: Uses GPT-4.1-mini to craft a message from “Alex,” a friendly assistant persona, addressing the lead by first name and referring to their inquiry context.  
  - Configuration:  
    - Model: GPT-4.1-mini  
    - Prompt: Dynamic prompt with embedded expressions to inject lead information (e.g., lead’s full name, inquiry context).  
    - Output: JSON with message content, including status and placeholders for WhatsApp chat and message IDs.  
  - Inputs: Data from Enquiry Form  
  - Outputs: Generated personalized message JSON  
  - Expressions: Uses expressions like `={{ $json['Full Name'] }}` and complex template strings to personalize the message dynamically.  
  - Edge Cases: OpenAI API limits, timeouts, or errors; prompt failures or incomplete responses; invalid or missing input data.  
  - Sub-workflows: None  

---

#### Block 1.3: WhatsApp Message Dispatch

- **Overview:**  
Sends the AI-generated message to the lead’s WhatsApp via the Unipile WhatsApp API and returns the send status.

- **Nodes Involved:**  
  - Whatsapp API

- **Node Details:**

  **Whatsapp API**  
  - Type: HTTP Request Tool  
  - Role: Posts message to Unipile WhatsApp API endpoint to send WhatsApp messages.  
  - Configuration:  
    - Method: POST  
    - URL: `https://<YOUR_DSN>/api/v1/chats` (placeholder to be replaced by user)  
    - Headers: Includes `X-API-KEY` and `accept: application/json`  
    - Body: Multipart-form-data with parameters: `attendees_ids` (recipient WhatsApp number), `text` (message body), and `account_id`.  
  - Inputs: AI-generated message content for text and recipient number from OpenAI output and form data respectively.  
  - Outputs: API response indicating success or failure, including chat and message IDs on success.  
  - Edge Cases: API authentication errors, network timeouts, invalid phone numbers, rate limiting, malformed requests.  
  - Sub-workflows: None  

---

#### Block 1.4: Outcome Evaluation

- **Overview:**  
Determines if the WhatsApp message send operation succeeded or failed and routes the workflow accordingly.

- **Nodes Involved:**  
  - If

- **Node Details:**

  **If**  
  - Type: Conditional Branching (If)  
  - Role: Checks the `Status` field in the OpenAI node’s JSON response message content for the string "Fail".  
  - Configuration: Case-sensitive string contains condition  
  - Inputs: Output from OpenAI node (which includes WhatsApp API response embedded)  
  - Outputs: Two branches:  
    - TRUE branch if status contains "Fail" (failure path)  
    - FALSE branch if no failure detected (success path)  
  - Edge Cases: Misformatted status field; unexpected status values; downstream errors if condition is wrong.  
  - Sub-workflows: None  

---

#### Block 1.5: CRM Logging

- **Overview:**  
Updates Google Sheets CRM to record lead information and message outcomes in separate tabs for failed and successful sends.

- **Nodes Involved:**  
  - Google Sheets (Failure logging)  
  - Google Sheets3 (Success logging)

- **Node Details:**

  **Google Sheets (Failure logging)**  
  - Type: Google Sheets Node  
  - Role: Appends or updates lead data into the "Failed" sheet tab when WhatsApp message sending fails.  
  - Configuration:  
    - Document ID and sheet name linked to a specific Google Sheet  
    - Columns mapped with data from Enquiry Form and OpenAI failure response (including error reason)  
    - Matching rows by `Submitted_at` timestamp for update or append  
  - Inputs: Output from If node TRUE branch (failure)  
  - Outputs: None (terminal for failure path)  
  - Edge Cases: Google Sheets API auth errors; sheet not found; data write conflicts; rate limits.  

  **Google Sheets3 (Success logging)**  
  - Type: Google Sheets Node  
  - Role: Appends or updates lead data into the "Successful" sheet tab when WhatsApp message sending succeeds.  
  - Configuration:  
    - Document ID and sheet name linked to same Google Sheet, different tab  
    - Columns mapped with data from Enquiry Form and OpenAI success response (including chat and message IDs)  
    - Matching rows by `Submitted_at` timestamp for update or append  
  - Inputs: Output from If node FALSE branch (success)  
  - Outputs: None (terminal for success path)  
  - Edge Cases: Same as failure logging node  

---

#### Block 1.6: Documentation and Setup Notes

- **Overview:**  
Provides contextual information, setup instructions, and resource links for users deploying or editing the workflow.

- **Nodes Involved:**  
  - Sticky Note (Lead Capture Agent)  
  - Sticky Note1 (Why Unipile?)  
  - Sticky Note2 (Setup Resources and Help)

- **Node Details:**

  **Sticky Note**  
  - Type: Sticky Note  
  - Role: Title for the Lead Capture Agent block; purely informational.  
  - Inputs/Outputs: None  

  **Sticky Note1**  
  - Type: Sticky Note  
  - Role: Explains why Unipile is used (no prior chat history required, personal WhatsApp connection).  
  - Inputs/Outputs: None  

  **Sticky Note2**  
  - Type: Sticky Note  
  - Role: Provides links for Unipile trial, Google Sheets template, detailed setup guide, and contact email for help.  
  - Inputs/Outputs: None  

---

### 3. Summary Table

| Node Name       | Node Type                     | Functional Role                         | Input Node(s)   | Output Node(s)     | Sticky Note                                                                                                                                                |
|-----------------|-------------------------------|---------------------------------------|-----------------|--------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Sticky Note     | Sticky Note                   | Workflow block title                   | —               | —                  | ## Lead Capture Agent                                                                                                                                      |
| Enquiry Form    | Form Trigger                  | Capture lead input from form submission | —               | OpenAI             |                                                                                                                                                            |
| OpenAI          | OpenAI LangChain Node         | Generate personalized WhatsApp message | Enquiry Form    | If                 |                                                                                                                                                            |
| If              | Conditional (If)              | Evaluate WhatsApp send outcome         | OpenAI          | Google Sheets (Fail), Google Sheets3 (Success) |                                                                                                                                                            |
| Whatsapp API    | HTTP Request Tool             | Send WhatsApp message via Unipile API | OpenAI (ai_tool) | OpenAI (ai_tool)    | It Access the whatsapp api and sends the message                                                                                                          |
| Google Sheets   | Google Sheets Node            | Log failed sends in "Failed" tab       | If (True)       | —                  |                                                                                                                                                            |
| Google Sheets3  | Google Sheets Node            | Log successful sends in "Successful" tab | If (False)      | —                  |                                                                                                                                                            |
| Sticky Note1    | Sticky Note                   | Explain Unipile benefits                | —               | —                  | ## Why Unipile? because it lets you send messages without any prior chat history and also lets you connect your personal whatsapp.                         |
| Sticky Note2    | Sticky Note                   | Setup resources and help instructions  | —               | —                  | ## 1. Resources  \n### Sign up & get 7 days free trial by clicking on the link below.\n- ### [Unipile](https://www.unipile.com/)\n### Copy this Google Sheet Template\n- ### [Template](https://docs.google.com/spreadsheets/d/1YjGBau9aHueh8xCo8HlM1rg6S_qgOVyiDEP_W-ZdNN4/edit?usp=sharing)\n## 2. Setup Guide\n- ### Connect your Open AI credentials.\n- ### Setup the Google Sheet and select it in the workflow\n- ### Replace all the placeholders in Whatsapp API tool with your Unipile Credentials.\n- ### Embed the form on your site or share as it is however, I recommend using your own form and connect it using webhook.\n## 3. Help\n- ### Read This [Detailed Setup Guide](https://drive.google.com/file/d/1ofDtmxYJ46ca50ELkrvfR45SMKQ84Jaj/view?usp=sharing) if need help\n- ### Reach out to us via [Email](mailto:info.gainflow@gmail.com) if need help\n- ### Find more real world use workflows by clicking [HERE](https://docs.google.com/document/d/1RACo90h-QwKA4hEZSlOQZsyw4iB5-43JM2l0s4lpuoY/edit?usp=sharing) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Form Trigger Node**  
   - Add a **Form Trigger** node named "Enquiry Form".  
   - Configure webhook or form URL.  
   - Define form fields:  
     - Full Name (required)  
     - Email (required)  
     - Whatsapp  
     - Company Name  
     - How can we help you?  
   - Save the node.

2. **Add OpenAI LangChain Node**  
   - Add an **OpenAI** LangChain node named "OpenAI".  
   - Connect input from "Enquiry Form".  
   - Select model: GPT-4.1-mini.  
   - In the messages parameter, add a prompt including:  
     - Instructions to act as Alex (friendly human assistant).  
     - Use expressions to insert lead’s full name, inquiry context, and WhatsApp number dynamically.  
     - Output JSON indicating either success or failure, including message text and chat/message IDs.  
   - Configure credentials with your OpenAI API key.

3. **Add HTTP Request Tool Node for WhatsApp API**  
   - Add an **HTTP Request Tool** node named "Whatsapp API".  
   - Configure to POST to `https://<YOUR_DSN>/api/v1/chats` (replace `<YOUR_DSN>`).  
   - Headers:  
     - `X-API-KEY: <YOUR_API_KEY>` (replace with your key)  
     - `accept: application/json`  
   - Body (multipart-form-data):  
     - `attendees_ids`: value from form WhatsApp field (dynamic from Enquiry Form node).  
     - `text`: value from OpenAI generated message.  
     - `account_id`: your Unipile account ID.  
   - Connect this node as an "ai_tool" input from the OpenAI node.  
   - Save credentials and test connectivity.

4. **Add Conditional If Node**  
   - Add an **If** node named "If".  
   - Connect input from OpenAI node main output.  
   - Configure condition to check if JSON path `message.content.Status` contains the string "Fail" (case-sensitive).  
   - This splits workflow into two branches: failure and success.

5. **Add Google Sheets Node for Failure Logging**  
   - Add a **Google Sheets** node named "Google Sheets".  
   - Connect it to the TRUE output of the If node.  
   - Configure operation as "Append or Update".  
   - Set Document ID to your Google Sheet ID.  
   - Set Sheet Name to the "Failed" tab (gid 352770436 in example).  
   - Map columns:  
     - Name, Email, Phone, Company, Notes from Enquiry Form.  
     - Message and Error from OpenAI failure response.  
     - Submitted_at from Enquiry Form timestamp.  
   - Use Google Sheets OAuth2 credentials.

6. **Add Google Sheets Node for Success Logging**  
   - Add a **Google Sheets** node named "Google Sheets3".  
   - Connect it to the FALSE output of the If node.  
   - Configure operation as "Append or Update".  
   - Set Document ID to the same Google Sheet.  
   - Set Sheet Name to "Successful" tab (gid=0).  
   - Map columns:  
     - Name, Email, Phone, Company, Notes from Enquiry Form.  
     - Message, Chat_id, Message_id from OpenAI success response.  
     - Submitted_at timestamp.  
   - Use Google Sheets OAuth2 credentials.

7. **Add Sticky Notes for Documentation**  
   - Add three **Sticky Note** nodes for clarity and help:  
     - "Sticky Note": Label block as “Lead Capture Agent”.  
     - "Sticky Note1": Explain Unipile benefits.  
     - "Sticky Note2": Provide resource links and setup instructions, including:  
       - Unipile signup link  
       - Google Sheets template link  
       - Detailed setup guide link  
       - Contact email  
       - Link to workflow examples

8. **Connect All Nodes Appropriately**  
   - "Enquiry Form" → "OpenAI"  
   - "OpenAI" main output → "If"  
   - "OpenAI" ai_tool output → "Whatsapp API" (ai_tool input)  
   - "If" TRUE output → "Google Sheets" (Failure)  
   - "If" FALSE output → "Google Sheets3" (Success)

9. **Credentials Setup**  
   - Configure Google Sheets OAuth2 credentials with access to your target spreadsheet.  
   - Configure OpenAI API credentials with your API key.  
   - Replace placeholders in WhatsApp API node with your Unipile DSN, API key, and account ID.

10. **Testing and Validation**  
    - Submit test entries via the form.  
    - Verify message generation, sending, and logging in the Google Sheets tabs.  
    - Monitor for errors and adjust API credentials or query expressions accordingly.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                                              |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Sign up & get 7 days free trial by clicking on the link below.                                                                                                                                                                                                                                                                                                                                                                                                                                       | [Unipile](https://www.unipile.com/)                                                                                          |
| Copy this Google Sheet Template                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | [Google Sheets Template](https://docs.google.com/spreadsheets/d/1YjGBau9aHueh8xCo8HlM1rg6S_qgOVyiDEP_W-ZdNN4/edit?usp=sharing) |
| Detailed Setup Guide available if help is needed                                                                                                                                                                                                                                                                                                                                                                                                                                                     | [Detailed Setup Guide PDF](https://drive.google.com/file/d/1ofDtmxYJ46ca50ELkrvfR45SMKQ84Jaj/view?usp=sharing)                 |
| Contact via email for assistance                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | info.gainflow@gmail.com                                                                                                      |
| More real-world workflows for reference                                                                                                                                                                                                                                                                                                                                                                                                                                                             | [Workflow Collection](https://docs.google.com/document/d/1RACo90h-QwKA4hEZSlOQZsyw4iB5-43JM2l0s4lpuoY/edit?usp=sharing)       |
| Why Unipile? It lets you send messages without any prior chat history and allows connection to your personal WhatsApp number.                                                                                                                                                                                                                                                                                                                                                                       | Sticky Note1 content                                                                                                         |

---

This documentation fully captures the workflow’s structure, logic, and configuration, enabling reproduction, modification, and error anticipation by users and automation agents alike.