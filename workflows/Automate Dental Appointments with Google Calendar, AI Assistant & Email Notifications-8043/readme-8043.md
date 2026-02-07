Automate Dental Appointments with Google Calendar, AI Assistant & Email Notifications

https://n8nworkflows.xyz/workflows/automate-dental-appointments-with-google-calendar--ai-assistant---email-notifications-8043


# Automate Dental Appointments with Google Calendar, AI Assistant & Email Notifications

### 1. Workflow Overview

This workflow automates the management of dental appointment bookings for Dr. Hakim’s clinic by integrating Google Calendar, AI-powered conversational agents, and email notifications. It is designed to handle input from patients via a webhook, interpret their requests using AI, check calendar availability, confirm bookings, update a Google Sheet, and notify both the doctor and the patient via email.

The workflow is divided into the following logical blocks:

- **1.1 Input Reception & Initial AI Processing:** Receives patient requests through a webhook and processes them with an AI agent specialized in appointment management.
- **1.2 Appointment Parsing & Validation:** Parses the AI agent's structured output to extract appointment and patient details in JSON format, validating and enriching data.
- **1.3 Calendar Availability Checking & Appointment Creation:** Checks Google Calendar availability for requested times and creates events upon explicit confirmation.
- **1.4 Data Recording & Notifications:** Records appointment details in Google Sheets and sends email notifications to both the doctor and the patient.
- **1.5 Contextual Memory Management:** Maintains conversation context for more coherent AI interactions.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Initial AI Processing

**Overview:**  
This block captures incoming HTTP POST requests containing appointment queries and uses an AI assistant to manage consultation scheduling logic according to clinic rules.

**Nodes Involved:**  
- Webhook  
- AI Agent  
- Window Buffer Memory  
- OpenRouter Chat Model  
- Respond to Webhook  

**Node Details:**  

- **Webhook**  
  - *Type:* HTTP Webhook (POST)  
  - *Role:* Receives patient appointment requests via HTTP POST at path `/getInput`.  
  - *Config:* Response mode set to respond via "Respond to Webhook" node.  
  - *Inputs:* External HTTP requests.  
  - *Outputs:* Forwards input data to "AI Agent".  
  - *Edge Cases:* Missing or malformed requests, network timeouts.

- **AI Agent**  
  - *Type:* LangChain Agent (OpenRouter GPT-4o-mini)  
  - *Role:* Acts as a virtual assistant specialized in appointment management, following strict office hours, booking rules, and communication protocols.  
  - *Config:* Receives patient query text from webhook; uses a detailed system prompt defining working hours, data requirements, booking rules, cancellation policies, and interaction style.  
  - *Inputs:* Patient query JSON from Webhook.  
  - *Outputs:* Text output with booking dialogue or availability responses.  
  - *Edge Cases:* AI model failures, incomplete patient data, unexpected input formats.

- **Window Buffer Memory**  
  - *Type:* LangChain Memory Buffer Window  
  - *Role:* Stores conversational context keyed by patient chat ID for context-aware interactions.  
  - *Config:* Uses `body.chatId` from webhook as session key; context window length of 100 messages.  
  - *Inputs/Outputs:* Connected as AI memory to AI Agent.  
  - *Edge Cases:* Session key missing, memory overflow.

- **OpenRouter Chat Model**  
  - *Type:* LangChain Chat Model (OpenRouter GPT-4o-mini)  
  - *Role:* Provides the language model backing for the AI Agent.  
  - *Config:* Model selected is `openai/gpt-4o-mini`.  
  - *Inputs/Outputs:* Linked as AI language model to AI Agent.  
  - *Edge Cases:* API rate limits, authentication errors.

- **Respond to Webhook**  
  - *Type:* Webhook response node  
  - *Role:* Sends the AI Agent’s reply back to the original HTTP requester.  
  - *Config:* Default response options.  
  - *Inputs:* AI Agent output.  
  - *Outputs:* HTTP response to client.  
  - *Edge Cases:* Response failures, client disconnects.

---

#### 2.2 Appointment Parsing & Validation

**Overview:**  
This block extracts structured appointment data from the AI Agent’s text output by parsing a JSON string, ensuring all required fields are present and supplementing missing appointment IDs.

**Nodes Involved:**  
- Respond to Webhook (from previous block)  
- AI Agent1  
- OpenRouter Chat Model1  
- Code  
- If  

**Node Details:**  

- **Respond to Webhook**  
  - *Role:* Forwards AI Agent’s last response to the parsing AI Agent1.

- **AI Agent1**  
  - *Type:* LangChain Agent  
  - *Role:* Parses the free text output from the initial AI Agent into a strict JSON format containing patient and appointment details.  
  - *Config:* Uses a prompt enforcing a specific JSON schema with fields for full name, phone, email, date, time, and appointment ID. It requires appointment ID generation if missing.  
  - *Inputs:* Text output from initial AI Agent.  
  - *Outputs:* JSON string with appointment details.  
  - *Edge Cases:* Parsing errors, incomplete data, invalid JSON.

- **OpenRouter Chat Model1**  
  - *Type:* LangChain Chat Model  
  - *Role:* Language model for AI Agent1 with same configuration as initial AI Agent.  
  - *Inputs/Outputs:* Connected as AI language model for AI Agent1.

- **Code**  
  - *Type:* JavaScript code node  
  - *Role:* Parses AI Agent1’s JSON string output into JSON object; generates fallback Appointment ID if missing or null.  
  - *Inputs:* JSON string from AI Agent1.  
  - *Outputs:* Structured JSON with guaranteed appointment ID.  
  - *Edge Cases:* JSON parse errors, missing fields.

- **If**  
  - *Type:* Conditional node  
  - *Role:* Checks if the patient’s full name is not "null" before proceeding to record data and send notifications.  
  - *Inputs:* JSON from Code node.  
  - *Outputs:* Continues only if patient full name exists; otherwise halts workflow.  
  - *Edge Cases:* Missing patient name, malformed data.

---

#### 2.3 Calendar Availability Checking & Appointment Creation

**Overview:**  
This block verifies calendar availability for requested times and creates Google Calendar events only upon explicit confirmation.

**Nodes Involved:**  
- Check Availability  
- Creat event (Create Event)  

**Node Details:**  

- **Check Availability**  
  - *Type:* Google Calendar Tool (List Events)  
  - *Role:* Queries Google Calendar for events between requested start and end times to check slot availability.  
  - *Config:* Uses calendar ID for Dr. Hakim’s clinic group calendar; start and end times dynamically received from AI outputs.  
  - *Inputs:* AI Agent tool calls.  
  - *Outputs:* Availability data for AI Agent to decide on booking.  
  - *Edge Cases:* API authentication failure, rate limits, invalid time formats.

- **Creat event**  
  - *Type:* Google Calendar Tool (Create Event)  
  - *Role:* Creates an appointment event on Google Calendar after patient confirmation.  
  - *Config:* Calendar ID same as above; start and end times from AI output; event metadata includes patient name and phone number in title, and detailed description.  
  - *Inputs:* AI Agent tool calls post-confirmation.  
  - *Outputs:* Event creation confirmation.  
  - *Edge Cases:* Event conflicts, API errors, missing confirmation.

---

#### 2.4 Data Recording & Notifications

**Overview:**  
This block appends appointment details to a Google Sheets document and sends notification emails to Dr. Hakim and the patient.

**Nodes Involved:**  
- Append row in sheet  
- For Doctor  
- For User  

**Node Details:**  

- **Append row in sheet**  
  - *Type:* Google Sheets node (Append operation)  
  - *Role:* Records appointment details (patient info, date, time, appointment ID) in the spreadsheet for record-keeping.  
  - *Config:* Targets a specific Google Sheet by document ID and sheet name (gid=0). Columns mapped explicitly.  
  - *Inputs:* JSON from If node confirming valid data.  
  - *Outputs:* Writes data and passes it to email nodes.  
  - *Edge Cases:* API access errors, data mapping issues.

- **For Doctor**  
  - *Type:* Gmail node (Send Email)  
  - *Role:* Sends an appointment notification email to Dr. Hakim with patient and appointment details.  
  - *Config:* Sends to fixed email (mdsabirulislam8089@gmail.com); plain text email with appointment summary.  
  - *Inputs:* Data from Google Sheets append node.  
  - *Outputs:* Email sent event.  
  - *Edge Cases:* SMTP failures, authentication errors.

- **For User**  
  - *Type:* Gmail node (Send Email)  
  - *Role:* Sends an appointment confirmation email to the patient with all relevant details and appointment ID.  
  - *Config:* Recipient email dynamically taken from appended sheet data; plain text format; polite and clear message.  
  - *Inputs:* Data from Google Sheets append node.  
  - *Outputs:* Email sent event.  
  - *Edge Cases:* Invalid patient email, SMTP errors.

---

#### 2.5 Contextual Memory Management

**Overview:**  
Maintains session-based conversation context to enable coherent multi-turn dialog with the AI assistant.

**Nodes Involved:**  
- Window Buffer Memory  

**Node Details:**  

- (Described in 2.1)  
- Keeps track of recent conversation history per patient session for better AI understanding.  
- Edge cases involve memory key mismatches or excessive memory growth.

---

### 3. Summary Table

| Node Name             | Node Type                          | Functional Role                                  | Input Node(s)             | Output Node(s)           | Sticky Note                              |
|-----------------------|----------------------------------|-------------------------------------------------|---------------------------|--------------------------|-----------------------------------------|
| Webhook               | HTTP Webhook                     | Receives patient appointment requests           | External HTTP              | AI Agent                 |                                         |
| AI Agent              | LangChain Agent                  | Virtual assistant managing appointment logic    | Webhook                   | Respond to Webhook       |                                         |
| Window Buffer Memory  | LangChain Memory Buffer Window   | Stores conversation context by session key      | -                         | AI Agent                 |                                         |
| OpenRouter Chat Model | LangChain Chat Model             | Language model for AI Agent                      | -                         | AI Agent                 |                                         |
| Respond to Webhook    | Webhook Response                 | Sends AI reply back to requester                  | AI Agent                  | AI Agent1                |                                         |
| AI Agent1             | LangChain Agent                  | Parses AI text output into structured JSON       | Respond to Webhook         | Code                     |                                         |
| OpenRouter Chat Model1| LangChain Chat Model             | Language model for AI Agent1                      | -                         | AI Agent1                |                                         |
| Code                  | JavaScript Code                  | Parses JSON string, generates fallback Appointment ID | AI Agent1                  | If                       |                                         |
| If                    | Conditional                     | Checks if patient full name is valid              | Code                      | Append row in sheet      |                                         |
| Append row in sheet   | Google Sheets Append             | Records appointment data in spreadsheet           | If                        | For Doctor               |                                         |
| For Doctor            | Gmail (Send Email)               | Notifies Dr. Hakim of new appointment             | Append row in sheet        | For User                 |                                         |
| For User              | Gmail (Send Email)               | Sends confirmation email to patient               | For Doctor                 | -                        |                                         |
| Check Availability    | Google Calendar Tool (List)      | Checks calendar availability for requested slot  | AI Agent (tool call)       | AI Agent (tool response) |                                         |
| Creat event           | Google Calendar Tool (Create)    | Creates calendar event after confirmation         | AI Agent (tool call)       | AI Agent (tool response) |                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: HTTP Webhook  
   - Method: POST  
   - Path: `getInput`  
   - Response Mode: `responseNode` (to send response via Respond to Webhook node)  

2. **Create AI Agent Node**  
   - Type: LangChain Agent  
   - Text Input: `={{ $json.body.query }}` (extract query from webhook JSON body)  
   - Options System Message: Paste the detailed assistant prompt describing office hours, booking rules, communication style, tools ("Check Availability", "Create Event") and cancellation policy.  
   - Prompt Type: `define`  
   - Connect Webhook output to AI Agent input.

3. **Create Window Buffer Memory Node**  
   - Type: LangChain Memory Buffer Window  
   - Session Key: `={{ $json.body.chatId }}` (to track conversation per patient)  
   - Session ID Type: `customKey`  
   - Context Window Length: 100  
   - Connect memory to AI Agent as AI memory.

4. **Create OpenRouter Chat Model Node**  
   - Type: LangChain Chat Model  
   - Model: `openai/gpt-4o-mini`  
   - Connect as AI language model to AI Agent.

5. **Create Respond to Webhook Node**  
   - Type: Webhook Response  
   - Connect AI Agent output to Respond to Webhook input.  
   - Connect Respond to Webhook output to next parsing AI Agent node.

6. **Create AI Agent1 Node**  
   - Type: LangChain Agent  
   - Text Input: `={{$input.first().json.output}}`  
   - Options System Message: Paste the Appointment Parsing Agent prompt specifying strict JSON output with patient and appointment fields and appointment ID generation rules.  
   - Prompt Type: `define`  
   - Connect Respond to Webhook output to AI Agent1 input.

7. **Create OpenRouter Chat Model1 Node**  
   - Type: LangChain Chat Model  
   - Model: `openai/gpt-4o-mini`  
   - Connect as AI language model to AI Agent1.

8. **Create Code Node**  
   - Type: JavaScript code  
   - Paste code that parses AI Agent1 output JSON string, throws error if invalid, and generates a fallback appointment ID if missing.  
   - Connect AI Agent1 output to Code input.

9. **Create If Node**  
   - Type: Conditional  
   - Condition: Check that `{{ $json.patient.full_name }}` is not equal to `"null"`  
   - Connect Code output to If input.

10. **Create Append row in sheet Node**  
    - Type: Google Sheets Append  
    - Spreadsheet ID: Use your Google Sheet ID (e.g., `13HOoBmWcxkL8cUZtWFU1-BSY47v486qkfGCA3gE8PKw`)  
    - Sheet Name: `gid=0` or appropriate sheet tab  
    - Columns: Map fields from JSON (`Time`, `Date `, `Email`, `Name `, `Phone Number`, `Appointment ID`)  
    - Connect If node’s true branch to this node.  
    - Set up Google Sheets OAuth2 credentials.

11. **Create For Doctor Node**  
    - Type: Gmail Send Email  
    - Recipient: `mdsabirulislam8089@gmail.com`  
    - Subject: `New Appointment Scheduled`  
    - Message: Template with patient and appointment details from appended sheet data.  
    - Connect Append row in sheet output to this node.  
    - Set up Gmail OAuth2 credentials.

12. **Create For User Node**  
    - Type: Gmail Send Email  
    - Recipient: Dynamic: `={{ $('Append row in sheet').item.json.Email }}`  
    - Subject: `Appointment Confirmation – Dr. Hakim`  
    - Message: Template confirming appointment details and appointment ID.  
    - Connect For Doctor output to this node.  
    - Use same Gmail credentials.

13. **Create Check Availability Node**  
    - Type: Google Calendar Tool (List Events)  
    - Calendar ID: Use clinic calendar ID  
    - TimeMin and TimeMax: Use expressions from AI agent outputs (`Start_Time`, `End_Time`)  
    - Connect AI Agent tool call input to this node as required.  
    - Set up Google Calendar OAuth2 credentials.

14. **Create Creat event Node**  
    - Type: Google Calendar Tool (Create Event)  
    - Calendar ID: Same as above  
    - Start and End times: Expressions from AI agent outputs (`Start`, `End`)  
    - Connect AI Agent tool call input to this node for confirmed bookings.  
    - Set up Google Calendar OAuth2 credentials.

15. **Connect all nodes according to the flow:**  
    - Webhook → AI Agent → Respond to Webhook → AI Agent1 → Code → If → Append row → For Doctor → For User  
    - AI Agent tool calls → Check Availability & Creat event nodes  
    - Window Buffer Memory and OpenRouter Chat Models connected as AI memory and language models respectively.

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                                       |
|----------------------------------------------------------------------------------------------------------------|------------------------------------------------------|
| This workflow uses OpenRouter API with GPT-4o-mini model for conversational AI.                                | OpenRouter: https://openrouter.ai                    |
| Google Calendar and Sheets OAuth2 credentials must be properly configured with required scopes.                | Google API Console                                    |
| Appointment ID format is `APT-YYYYMMDD-XXXXXX` where XXXXXX is 6 random alphanumeric characters.                | Defined in AI Agent prompt and code node             |
| Email templates are plain text and dynamically populated from Google Sheets appended data.                      | Inside Gmail nodes                                    |
| The workflow respects office hours and enforces explicit confirmation before booking an appointment.           | Defined in AI Agent system message                    |
| For troubleshooting, monitor API usage quotas and check n8n logs for errors related to JSON parsing or auth.    | n8n documentation and logs                            |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation platform. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and publicly accessible.