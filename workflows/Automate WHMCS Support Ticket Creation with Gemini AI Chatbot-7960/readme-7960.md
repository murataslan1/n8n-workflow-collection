Automate WHMCS Support Ticket Creation with Gemini AI Chatbot

https://n8nworkflows.xyz/workflows/automate-whmcs-support-ticket-creation-with-gemini-ai-chatbot-7960


# Automate WHMCS Support Ticket Creation with Gemini AI Chatbot

### 1. Workflow Overview

This workflow automates the creation of support tickets in WHMCS by leveraging an AI-powered chatbot built with Google Gemini (PaLM) language model and n8n LangChain integration. It targets hosting and domain service companies seeking to streamline customer support by transforming natural language chat messages into well-structured, professional support tickets within WHMCS.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Captures incoming user chat messages via a webhook-based chat trigger node.
- **1.2 AI Processing:** Uses an AI agent powered by Google Gemini with memory context to understand user requests, extract structured ticket data, and interact with the user to collect missing information.
- **1.3 WHMCS Integration:** Fetches valid support departments from WHMCS and creates support tickets through WHMCS API endpoints using HTTP requests.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
Receives incoming chat messages from users, initiating the workflow with real-time customer input.

**Nodes Involved:**  
- When chat message received

**Node Details:**

- **When chat message received**  
  - *Type & Role:* Chat trigger node that acts as the webhook entry point for user chat messages.  
  - *Configuration:* Uses a webhook ID to listen for incoming chat data.  
  - *Expressions/Variables:* None by default; triggers on any chat message event.  
  - *Input/Output:* No input; outputs the chat message data to downstream nodes.  
  - *Errors:* Possible webhook connection errors or missing payload.  
  - *Sub-workflow:* None.

---

#### 2.2 AI Processing

**Overview:**  
Processes user chat input through an AI agent that understands the request, extracts ticket information, maintains session memory for follow-ups, and ensures data completeness and professionalism.

**Nodes Involved:**  
- AI Agent  
- Google Gemini Chat Model  
- Simple Memory

**Node Details:**

- **AI Agent**  
  - *Type & Role:* LangChain AI agent node that coordinates conversation and data extraction.  
  - *Configuration:*  
    - System message sets the agent’s persona as a professional AI support assistant focused on converting chat to structured WHMCS tickets.  
    - Detailed instructions enforce strict guidelines on data extraction, tone, and interaction flow.  
    - Uses tools: calls WHMCS_GetSupportDepartments first to get valid departments, then WHMCS_OpenTicket to create tickets.  
    - Maintains session context until all required data is collected.  
  - *Expressions/Variables:*  
    - Uses dynamic expressions referencing AI-generated parameters for subject, message, name, email, priority, and department selection.  
  - *Input/Output:*  
    - Input from "When chat message received" node.  
    - Outputs structured ticket data and commands to create tickets.  
  - *Errors:*  
    - AI comprehension errors, incomplete data extraction, or failure to maintain context.  
    - Unexpected user inputs or ambiguous requests may cause fallback or repeated queries.  
  - *Sub-workflow:* None, but interacts with external HTTP request nodes as tools.

- **Google Gemini Chat Model**  
  - *Type & Role:* Language model node providing AI natural language understanding and generation.  
  - *Configuration:* Uses Google Gemini (PaLM) API credentials for chat completion.  
  - *Expressions/Variables:* No explicit expressions; acts as the language engine for the AI Agent.  
  - *Input/Output:*  
    - Input from AI Agent’s language model interface.  
    - Output back to AI Agent for further processing.  
  - *Errors:* API quota, authentication errors, network timeouts.

- **Simple Memory**  
  - *Type & Role:* Memory buffer node retaining conversation context for up to 15 previous messages.  
  - *Configuration:* Context window length set to 15 to maintain session state.  
  - *Input/Output:*  
    - Input from AI Agent’s memory interface to store conversation context.  
    - Output feeds back into AI Agent to preserve dialogue continuity.  
  - *Errors:* Memory overflow or loss if context exceeds limits.

---

#### 2.3 WHMCS Integration

**Overview:**  
Fetches valid support department data from WHMCS and submits the finalized support ticket using WHMCS API calls.

**Nodes Involved:**  
- WHMCS_GetSupportDepartments  
- WHMCS_OpenTicket

**Node Details:**

- **WHMCS_GetSupportDepartments**  
  - *Type & Role:* HTTP Request node to retrieve the list of valid support departments from WHMCS API.  
  - *Configuration:*  
    - POST to WHMCS API endpoint with action=GetSupportDepartments and responsetype=json.  
    - Uses form-urlencoded content-type.  
    - Authenticated with generic HTTP custom credentials (WHMCS_Query_Auth).  
  - *Expressions/Variables:* None directly; output used by AI Agent as a tool to validate department choices.  
  - *Input/Output:*  
    - Input: Called by AI Agent as a tool.  
    - Output: JSON list of departments.  
  - *Errors:* Authentication failure, API downtime, malformed response.

- **WHMCS_OpenTicket**  
  - *Type & Role:* HTTP Request node to create a new support ticket in WHMCS.  
  - *Configuration:*  
    - POST to WHMCS API endpoint with action=OpenTicket and other ticket fields dynamically filled from AI Agent parameters.  
    - Fields include deptid (hardcoded to 2 as a fallback), subject, message, name, email, priority.  
    - Uses form-urlencoded content-type and HTTP custom authentication (WHMCS_Query_Auth).  
  - *Expressions/Variables:*  
    - Subject, message, name, email, and priority are pulled from AI Agent’s outputs via expressions referencing AI-generated variables.  
  - *Input/Output:*  
    - Input: Receives structured ticket data from the AI Agent.  
    - Output: API response indicating success/failure of ticket creation.  
  - *Errors:*  
    - Authentication issues, invalid field values, network errors, or missing required fields.  
    - If department is not mapped correctly, ticket may be assigned to default deptid=2.

---

### 3. Summary Table

| Node Name                  | Node Type                              | Functional Role                                | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                                                       |
|----------------------------|--------------------------------------|------------------------------------------------|-----------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| When chat message received  | Chat Trigger                         | Entry point receiving user chat messages       |                             | AI Agent                    |                                                                                                                                  |
| AI Agent                   | LangChain AI Agent                   | Processes chat, extracts ticket info, manages conversation flow | When chat message received, Simple Memory, Google Gemini Chat Model, WHMCS_GetSupportDepartments, WHMCS_OpenTicket |                            |                                                                                                                                  |
| Google Gemini Chat Model    | Language Model (Google Gemini)       | Provides AI natural language understanding     | AI Agent (ai_languageModel) | AI Agent                    |                                                                                                                                  |
| Simple Memory              | Memory Buffer                        | Maintains chat session context over time       | AI Agent (ai_memory)         | AI Agent                    |                                                                                                                                  |
| WHMCS_GetSupportDepartments | HTTP Request Tool                   | Fetches valid WHMCS support departments         | AI Agent (ai_tool)           | AI Agent                    |                                                                                                                                  |
| WHMCS_OpenTicket            | HTTP Request Tool                   | Creates support ticket in WHMCS                  | AI Agent (ai_tool)           |                             |                                                                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Chat Trigger Node**  
   - Add node: *When chat message received* (LangChain chatTrigger)  
   - Configure webhook with a unique ID to listen for incoming chat messages.

2. **Add Google Gemini Chat Model Node**  
   - Add node: *Google Gemini Chat Model* (LangChain lmChatGoogleGemini)  
   - Configure credentials with Google PaLM API key (OAuth or API key).  
   - Leave options default.

3. **Add Simple Memory Node**  
   - Add node: *Simple Memory* (LangChain memoryBufferWindow)  
   - Set `contextWindowLength` to 15 messages.

4. **Add WHMCS_GetSupportDepartments Node**  
   - Add node: *HTTP Request* (HTTP Request Tool)  
   - Method: POST  
   - URL: `https://WHMCS_URL.com/includes/api.php` (replace WHMCS_URL.com with actual domain)  
   - Headers: Content-Type: application/x-www-form-urlencoded  
   - Body (form-urlencoded):  
     - action = GetSupportDepartments  
     - responsetype = json  
   - Authentication: HTTP Custom Auth with WHMCS API credentials.

5. **Add WHMCS_OpenTicket Node**  
   - Add node: *HTTP Request* (HTTP Request Tool)  
   - Method: POST  
   - URL: `https://WHMCS_URL.com/includes/api.php`  
   - Headers: Content-Type: application/x-www-form-urlencoded  
   - Body (form-urlencoded):  
     - action = OpenTicket  
     - deptid = dynamic (default `2`, but ideally mapped from AI output)  
     - subject = expression pulling AI Agent generated subject  
     - message = expression pulling AI Agent generated message  
     - name = expression pulling AI Agent generated name  
     - email = expression pulling AI Agent generated email  
     - priority = expression pulling AI Agent generated priority (Low/Medium/High)  
   - Authentication: HTTP Custom Auth with WHMCS API credentials.

6. **Add AI Agent Node**  
   - Add node: *LangChain Agent* (LangChain agent)  
   - Set System Message with the detailed prompt instructing it to:  
     - Act as AI-powered support assistant for hosting/domain company.  
     - Extract department, subject, message, name, email, priority from chat.  
     - Use WHMCS_GetSupportDepartments to get departments.  
     - Use WHMCS_OpenTicket to create tickets.  
     - Keep professional, polite tone.  
     - Ask user for missing info.  
     - Maintain session context until ticket creation.  
   - Connect the node interfaces:  
     - Language Model: connect to Google Gemini Chat Model node.  
     - Memory: connect to Simple Memory node.  
     - Tool 1: connect to WHMCS_GetSupportDepartments node.  
     - Tool 2: connect to WHMCS_OpenTicket node.  
   - Connect input to come from *When chat message received* node.

7. **Connect Nodes**  
   - Connect *When chat message received* → *AI Agent*.  
   - Connect *AI Agent*’s ai_languageModel → *Google Gemini Chat Model*.  
   - Connect *AI Agent*’s ai_memory → *Simple Memory*.  
   - Connect *AI Agent*’s ai_tool (first) → *WHMCS_GetSupportDepartments*.  
   - Connect *AI Agent*’s ai_tool (second) → *WHMCS_OpenTicket*.  

8. **Set Credentials**  
   - Configure WHMCS API credentials in HTTP Custom Auth for both WHMCS nodes.  
   - Configure Google PaLM API credentials in Google Gemini Chat Model node.

9. **Test the Workflow**  
   - Trigger via chat message webhook with sample inputs.  
   - Confirm AI Agent asks for missing info if needed.  
   - Confirm ticket creation in WHMCS with correct fields.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                       |
|-----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| The AI Agent system message includes detailed instructions and example dialogues to guide chatbot behavior precisely. | Embedded in AI Agent node configuration.                                                            |
| WHMCS API endpoints require authentication via HTTP Custom Auth; credentials must have API access rights.             | WHMCS official API documentation: https://developers.whmcs.com/api/                                  |
| Google Gemini (PaLM) API access requires Google Cloud account with PaLM enabled.                                      | https://cloud.google.com/palm/docs                                                                |
| The workflow’s timezone is set to Asia/Karachi, adjust as needed for deployment region.                               | n8n workflow settings.                                                                               |
| Maintain GDPR compliance and data privacy when processing user emails and personal info.                              | Recommended best practice for user data handling in chatbots.                                       |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated n8n workflow. All processing respects applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.