Automate Real Estate Marketing with Llama AI, VAPI Calls & Gmail Campaigns

https://n8nworkflows.xyz/workflows/automate-real-estate-marketing-with-llama-ai--vapi-calls---gmail-campaigns-6630


# Automate Real Estate Marketing with Llama AI, VAPI Calls & Gmail Campaigns

### 1. Workflow Overview

This workflow automates real estate marketing by integrating AI-generated promotional content, voice call campaigns via VAPI, and client email campaigns through Gmail. It targets real estate agents and marketing teams seeking to streamline property offer promotions, lead generation, and follow-up management.

The workflow is logically divided into these blocks:

- **1.1 Offer Monitoring & Client Data Retrieval:** Watches for new or updated real estate offers in a Google Sheet and fetches client contact info.
- **1.2 AI-Powered Campaign Content Generation:** Uses Llama 3.2 AI to create personalized, engaging promotional messages based on offer details.
- **1.3 Campaign Execution:** Sends automated voice call campaigns via VAPI and personalized email campaigns via Gmail.
- **1.4 Lead Capture & CRM Update:** Receives lead responses from VAPI webhook, processes and saves leads to a CRM Google Sheet, and acknowledges lead receipt to VAPI.

---

### 2. Block-by-Block Analysis

#### 2.1 Offer Monitoring & Client Data Retrieval

**Overview:**  
This block triggers the workflow when a new or updated real estate offer is detected in a Google Sheet and retrieves client contact details to target for the marketing campaign.

**Nodes Involved:**  
- Watch Real Estate Offer Sheet  
- Get Client Contact List  
- Sticky Note (related notes on triggers and client data)

**Node Details:**

- **Watch Real Estate Offer Sheet**  
  - Type: Google Sheets Trigger  
  - Role: Monitors a specific Google Sheet document and sheet tab for changes every minute.  
  - Configuration: Polls sheet ID "1kRRDSoJNzVQAUbunYzAk-KUBcMjhuUw0PydGjLbbEVg", sheet tab ID 1574728929.  
  - Inputs: None (trigger node)  
  - Outputs: Outputs offer data JSON when a change is detected.  
  - Edge cases: Possible API rate limits; delay in polling can cause latency. OAuth token expiry.  
  - Sticky Note: "Triggers when a new offer is added/updated in Sheet 1. Starts the marketing campaign."

- **Get Client Contact List**  
  - Type: Google Sheets  
  - Role: Fetches email and phone contact info of clients from a second sheet within the same Google Sheet document.  
  - Configuration: Reads sheet tab "gid=0", uses service account authentication for access.  
  - Inputs: Triggered after the offer sheet update.  
  - Outputs: Client contact list records.  
  - Edge cases: Authentication failures, sheet access permissions, empty or malformed client data.  
  - Sticky Note: "Fetches email/phone info from Sheet 2 to target clients for this offer."

---

#### 2.2 AI-Powered Campaign Content Generation

**Overview:**  
Generates personalized marketing messages using Llama 3.2 AI based on the updated real estate offer data to drive lead inquiries and bookings.

**Nodes Involved:**  
- Llama 3.2 - Promo Content Model  
- Generate Promo Content with Llama (LangChain Agent)  
- Delay to Sync Data  
- Create Personalized Email Template (Code)  
- Sticky Notes on AI usage and formatting

**Node Details:**

- **Llama 3.2 - Promo Content Model**  
  - Type: LangChain LM Chat Ollama Node  
  - Role: Provides the Llama 3.2 model for generating AI content.  
  - Configuration: Model set to "llama3.2-16000:latest" with Ollama API credentials.  
  - Inputs: Connected as AI language model provider to "Generate Promo Content with Llama".  
  - Outputs: AI model response to prompt.  
  - Edge cases: API connectivity, rate limits, model loading errors, invalid credentials.

- **Generate Promo Content with Llama**  
  - Type: LangChain Agent Node  
  - Role: Sends a detailed prompt with property offer data to generate a promotional message.  
  - Configuration:  
    - Prompt includes property details: title, location, discount, validity, inclusions, pricing, bonus, CTA.  
    - Output format specified with emojis, HTML lists, bold hooks, urgency, and emotional tone.  
  - Inputs: Receives offer data from previous nodes and Llama model from "Llama 3.2" node.  
  - Outputs: AI-generated promotional content.  
  - Edge cases: Expression evaluation errors in prompt, AI output formatting issues, API timeouts.

- **Delay to Sync Data**  
  - Type: Wait  
  - Role: Ensures all previous AI generation and data fetching operations complete before proceeding.  
  - Inputs: Output from AI content generation.  
  - Outputs: Triggers next node after delay.  
  - Edge cases: Excessive wait time, workflow timeout.

- **Create Personalized Email Template**  
  - Type: Code (JavaScript)  
  - Role: Combines client emails into a single string and pairs it with the generated promo content for sending.  
  - Configuration: Maps over client items to extract email addresses, joins them into a comma-separated list, and attaches AI output.  
  - Inputs: Receives client contact list and AI output.  
  - Outputs: JSON with allEmails and output content.  
  - Edge cases: Missing or malformed email fields, script runtime errors.  
  - Sticky Note: "Formats the AI output into HTML/text email ready for sending to clients."

---

#### 2.3 Campaign Execution

**Overview:**  
Sends the generated promotional messages to clients via automated voice calls (VAPI) and email campaigns (Gmail).

**Nodes Involved:**  
- Trigger Voice Campaign via VAPI (HTTP Request)  
- Email Promo to Clients (Gmail)  
- Sticky Notes on campaign sending and voice call initiation

**Node Details:**

- **Trigger Voice Campaign via VAPI**  
  - Type: HTTP Request  
  - Role: Initiates voice call campaigns to client phone numbers via VAPI API.  
  - Configuration:  
    - POST request to `https://api.vapi.ai/call` with JSON body including assistantId, phoneNumberId, and customer numbers.  
    - Authorization header required with token.  
  - Inputs: Triggered after client list retrieval.  
  - Outputs: HTTP response from VAPI.  
  - Edge cases: API authentication failure, invalid or missing phone numbers, network timeouts.  
  - Sticky Note: "Initiates automated voice call to clients with key offer details using VAPI API."

- **Email Promo to Clients (Gmail)**  
  - Type: Gmail Node  
  - Role: Sends personalized email campaigns to clients.  
  - Configuration:  
    - Sends email to all client emails combined, message body from AI output, subject "Offer", plain text format.  
    - Uses Gmail OAuth2 credentials.  
  - Inputs: Receives combined email list and message content from code node.  
  - Outputs: Email sent confirmation.  
  - Edge cases: OAuth token expiration, mail quota limits, invalid email addresses.  
  - Sticky Note: "Sends the personalized offer campaign to each client using Gmail or SMTP."

---

#### 2.4 Lead Capture & CRM Update

**Overview:**  
Handles inbound leads from VAPI voice campaigns, waits for payload processing, saves lead data into a CRM Google Sheet, and sends a success acknowledgment back to VAPI.

**Nodes Involved:**  
- Receive Lead Data from VAPI (Webhook)  
- Delay for Lead Parsing (Wait)  
- Save Lead to CRM Sheet (Google Sheets Append/Update)  
- Send Acknowledgement to VAPI (Respond to Webhook)  
- Sticky Notes on lead processing and acknowledgments

**Node Details:**

- **Receive Lead Data from VAPI**  
  - Type: Webhook  
  - Role: Endpoint to receive lead data POSTed by VAPI after voice campaign interaction.  
  - Configuration: HTTP POST on path `60d5fdeb-b5d8-4e71-90d0-182acc695404`, responds via response node.  
  - Inputs: External HTTP call from VAPI.  
  - Outputs: Lead data JSON payload.  
  - Edge cases: Invalid or malformed POST data, unauthorized access, webhook downtime.  
  - Sticky Note: "Captures lead info from VAPI voice call form (name, contact, interest, etc.)."

- **Delay for Lead Parsing**  
  - Type: Wait  
  - Role: Brief pause to ensure full payload is received and parsed before saving.  
  - Inputs: Webhook output.  
  - Outputs: Triggers save operation.  
  - Edge cases: Delay too short may cause incomplete data; too long delays workflow processing.  
  - Sticky Note: "Brief wait to ensure VAPI lead payload is fully captured and parsed."

- **Save Lead to CRM Sheet**  
  - Type: Google Sheets (Append or Update)  
  - Role: Saves or updates lead information in a CRM sheet for future follow-up.  
  - Configuration:  
    - Sheet ID: "1DCq5a_I2KyD0Tt5Z_TqluZOM1sq6KI05PaxmVVI7J4o"  
    - Sheet tab: "gid=0"  
    - Maps lead fields: Name, Company name, Company size from webhook JSON path.  
    - Uses service account authentication.  
  - Inputs: Processed lead data post delay.  
  - Outputs: Confirmation of sheet update.  
  - Edge cases: Mapping errors if fields missing, API quota limits, authentication failure.  
  - Sticky Note: "Adds qualified leads to Google Sheet CRM for future follow-up."

- **Send Acknowledgement to VAPI**  
  - Type: Respond to Webhook  
  - Role: Sends a success response back to VAPI confirming lead was saved.  
  - Inputs: Output from Google Sheets node.  
  - Outputs: HTTP 200 success response to VAPI.  
  - Edge cases: Failures if lead save failed; webhook timeouts.  
  - Sticky Note: "Sends success response back to VAPI confirming lead was saved."

---

### 3. Summary Table

| Node Name                       | Node Type                        | Functional Role                             | Input Node(s)                       | Output Node(s)                        | Sticky Note                                                                                  |
|--------------------------------|---------------------------------|---------------------------------------------|-----------------------------------|-------------------------------------|----------------------------------------------------------------------------------------------|
| Watch Real Estate Offer Sheet   | Google Sheets Trigger            | Triggers workflow on new/updated offers     | None                              | Get Client Contact List              | Triggers when a new offer is added/updated in Sheet 1. Starts the marketing campaign.       |
| Get Client Contact List         | Google Sheets                   | Fetches client contact info                   | Watch Real Estate Offer Sheet     | Trigger Voice Campaign via VAPI, Generate Promo Content with Llama | Fetches email/phone info from Sheet 2 to target clients for this offer.                      |
| Trigger Voice Campaign via VAPI | HTTP Request                    | Initiates voice call marketing campaign      | Get Client Contact List           | None                                | Initiates automated voice call to clients with key offer details using VAPI API.              |
| Llama 3.2 - Promo Content Model | LangChain LM Chat Ollama       | Provides Llama 3.2 AI model for content gen | None (AI model provider)          | Generate Promo Content with Llama    |                                                                                              |
| Generate Promo Content with Llama| LangChain Agent                | Generates AI marketing promo content         | Get Client Contact List, Llama 3.2 - Promo Content Model | Delay to Sync Data                  | Uses AI to create personalized marketing content based on updated offer.                     |
| Delay to Sync Data              | Wait                           | Ensures AI and data fetching completion      | Generate Promo Content with Llama | Create Personalized Email Template   | Adds a pause to ensure all prior operations (API, sheets, AI) are complete.                  |
| Create Personalized Email Template | Code                        | Formats AI output and client emails for email | Delay to Sync Data               | Email Promo to Clients (Gmail)       | Formats the AI output into HTML/text email ready for sending to clients.                     |
| Email Promo to Clients (Gmail) | Gmail                          | Sends personalized email campaign             | Create Personalized Email Template| None                                | Sends the personalized offer campaign to each client using Gmail or SMTP.                    |
| Receive Lead Data from VAPI     | Webhook                        | Receives inbound leads from VAPI calls        | None                              | Delay for Lead Parsing               | Captures lead info from VAPI voice call form (name, contact, interest, etc.).                |
| Delay for Lead Parsing          | Wait                           | Waits to ensure full lead payload reception   | Receive Lead Data from VAPI       | Save Lead to CRM Sheet               | Brief wait to ensure VAPI lead payload is fully captured and parsed.                         |
| Save Lead to CRM Sheet          | Google Sheets (Append/Update)  | Saves leads to CRM Google Sheet                | Delay for Lead Parsing            | Send Acknowledgement to VAPI         | Adds qualified leads to Google Sheet CRM for future follow-up.                              |
| Send Acknowledgement to VAPI    | Respond to Webhook             | Sends success response back to VAPI            | Save Lead to CRM Sheet            | None                                | Sends success response back to VAPI confirming lead was saved.                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Google Sheets Trigger node: "Watch Real Estate Offer Sheet"**  
   - Type: Google Sheets Trigger  
   - Credentials: OAuth2 with Google Sheets access  
   - Document ID: `1kRRDSoJNzVQAUbunYzAk-KUBcMjhuUw0PydGjLbbEVg`  
   - Sheet Name: Use sheet ID `1574728929`  
   - Polling: Every minute

2. **Create a Google Sheets node: "Get Client Contact List"**  
   - Type: Google Sheets  
   - Credentials: Service Account with access to the same document  
   - Document ID: Same as above  
   - Sheet Name: `gid=0` (client contacts sheet)  
   - Operation: Read rows (default)

3. **Connect "Watch Real Estate Offer Sheet" main output to "Get Client Contact List" input**

4. **Create HTTP Request node: "Trigger Voice Campaign via VAPI"**  
   - Method: POST  
   - URL: `https://api.vapi.ai/call`  
   - Headers: Add `Authorization` header with your VAPI token  
   - Body (JSON):  
     ```json
     {
       "assistantId": "add_id_here",
       "phoneNumberId": "add_phone_number_id_here",
       "customers": [
         { "number": "add_vapi_agent_phonenumber_here" }
       ]
     }
     ```  
   - Set to send JSON body and headers  
   - Connect "Get Client Contact List" to this node

5. **Create LangChain LM Chat Ollama node: "Llama 3.2 - Promo Content Model"**  
   - Select model: `llama3.2-16000:latest`  
   - Credentials: Configure Ollama API key/credentials

6. **Create LangChain Agent node: "Generate Promo Content with Llama"**  
   - Use detailed prompt to generate promo content as per property offer fields (title, location, discount, etc.)  
   - Configure to use "Llama 3.2 - Promo Content Model" as AI model  
   - Connect "Get Client Contact List" and "Llama 3.2 - Promo Content Model" to this node

7. **Create Wait node: "Delay to Sync Data"**  
   - Default delay (optional or small pause)  
   - Connect output of "Generate Promo Content with Llama" to this node

8. **Create Code node: "Create Personalized Email Template"**  
   - JavaScript to extract emails from client list and pair with AI output:  
     ```javascript
     const emails = items.map(item => item.json.Emial); // Note: confirm correct field name spelling (likely 'Email')
     return [{
       json: {
         allEmails: emails.join(", "),
         output: $('Generate Promo Content with Llama').first().json.output
       }
     }];
     ```  
   - Connect "Delay to Sync Data" to this node

9. **Create Gmail node: "Email Promo to Clients (Gmail)"**  
   - Credentials: Gmail OAuth2 with send email scope  
   - To: `={{ $json.allEmails }}`  
   - Subject: "Offer"  
   - Message: `={{ $json.output }}` (text or HTML as per AI output)  
   - Connect "Create Personalized Email Template" to this node

---

10. **Create Webhook node: "Receive Lead Data from VAPI"**  
    - HTTP Method: POST  
    - Path: unique path (e.g., `60d5fdeb-b5d8-4e71-90d0-182acc695404`)  
    - Response Mode: Respond using node

11. **Create Wait node: "Delay for Lead Parsing"**  
    - Default short wait  
    - Connect "Receive Lead Data from VAPI" to this node

12. **Create Google Sheets node: "Save Lead to CRM Sheet"**  
    - Credentials: Google Service Account with access to CRM sheet  
    - Document ID: `1DCq5a_I2KyD0Tt5Z_TqluZOM1sq6KI05PaxmVVI7J4o`  
    - Sheet Name: `gid=0`  
    - Operation: Append or Update  
    - Column mapping:  
      - Name: `={{ $json.body.message.toolCallList[0].function.arguments.name }}`  
      - Company name: `={{ $json.body.message.toolCallList[0].function.arguments.company_name }}`  
      - Company size: `={{ $json.body.message.toolCallList[0].function.arguments.company_size }}`  
    - Connect "Delay for Lead Parsing" to this node

13. **Create Respond to Webhook node: "Send Acknowledgement to VAPI"**  
    - Default success response  
    - Connect "Save Lead to CRM Sheet" to this node

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                              |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Workflow automates real estate marketing with AI content generation, voice call campaigns, and email outreach | Main project purpose                                                                                         |
| Uses Ollama API for Llama 3.2 model integration                                                               | https://ollama.com                                                                                           |
| VAPI API used for voice call campaigns                                                                         | https://api.vapi.ai                                                                                          |
| Gmail OAuth2 credentials required for sending emails                                                           | Ensure Gmail API enabled and OAuth consent configured                                                       |
| Google Sheets service account authentication for secure sheet access                                           | https://developers.google.com/identity/protocols/oauth2/service-account                                       |
| Sticky notes in workflow provide additional context and instructions                                          | Inline in workflow editor                                                                                    |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. All data processed is legal and public, and the workflow complies fully with content policies. No illegal, offensive, or protected elements are included.