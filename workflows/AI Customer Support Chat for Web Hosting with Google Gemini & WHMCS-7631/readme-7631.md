AI Customer Support Chat for Web Hosting with Google Gemini & WHMCS

https://n8nworkflows.xyz/workflows/ai-customer-support-chat-for-web-hosting-with-google-gemini---whmcs-7631


# AI Customer Support Chat for Web Hosting with Google Gemini & WHMCS

### 1. Workflow Overview

This workflow implements an AI-powered customer support chat system tailored for a web hosting company. It automates responses to customer inquiries about hosting plans, domain services, payment methods, and FAQs by integrating Google Gemini AI, Google Sheets knowledge bases, and a WHMCS domain availability API.

**Target Use Cases:**  
- 24/7 customer support for web hosting and domain registration services  
- Automated sales assistance with up-to-date product info  
- Customer self-service with intelligent, contextual AI replies  
- Storing and maintaining complete chat histories for analysis  
- Domain availability checking integrated with WHMCS API  

**Logical Blocks:**

- **1.1 Input Reception:** Receiving chat requests via webhook and preparing the session.  
- **1.2 Contextual Memory Management:** Maintaining session-specific conversation memory.  
- **1.3 AI Processing:** Natural language understanding and response generation using Google Gemini and LangChain AI agent.  
- **1.4 Knowledge Base Access:** Querying multiple Google Sheets tools as knowledge sources (Hosting Plans, Domain Prices, Features, FAQs, Payments, Offerings).  
- **1.5 Domain Availability Checking:** Calling WHMCS API to verify domain name availability.  
- **1.6 Chat History Management:** Saving and updating chat session data in a Google Sheet.  
- **1.7 Response Delivery:** Sending the AI-generated response back to the user via webhook response node.  
- **1.8 Documentation & Notes:** Sticky notes outlining purpose and operational logic.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Receives incoming HTTP POST requests containing customer messages and session data; serves as the entry point for chat interactions.  
- **Nodes Involved:**  
  - `Webhook`  
- **Node Details:**  
  - Type: Webhook (HTTP Endpoint)  
  - Configured to listen on POST at path `2636ab69-9b01-4d0a-9146-178947f0c5cf`  
  - Accepts JSON body containing `message`, `sessionId`, and other user data  
  - Triggers downstream processing on receiving a request  
  - Outputs JSON data to the AI Agent node  
  - Edge cases: Missing or malformed sessionId or message body, HTTP method other than POST, network issues  
  - Version: n8n Webhook v2  

#### 1.2 Contextual Memory Management

- **Overview:** Maintains a sliding window memory buffer per session to provide conversation context for the AI agent.  
- **Nodes Involved:**  
  - `Simple Memory`  
- **Node Details:**  
  - Type: LangChain Memory Buffer Window  
  - Uses custom session key derived from webhook’s `sessionId`  
  - Context window length set to 15 messages, ensuring recent conversation context is retained  
  - Input: receives sessionId from webhook node data  
  - Output: connected as AI memory to the AI Agent for context-aware responses  
  - Edge cases: Missing sessionId, memory overflow, session key collisions  
  - Version: LangChain Memory Buffer Window v1.3  

#### 1.3 AI Processing

- **Overview:** Processes user messages using an AI agent powered by Google Gemini (PaLM) and LangChain, generating context-aware, knowledge-based responses.  
- **Nodes Involved:**  
  - `AI Agent`  
  - `Google Gemini Chat Model`  
- **Node Details:**  
  - `AI Agent`:  
    - Type: LangChain Agent Node  
    - Receives user message from webhook and session context from Simple Memory  
    - Configured with detailed system prompt defining persona (“Matt”), responsibilities, tone, knowledge sources, and conversation rules  
    - Uses multiple Google Sheets tools and HTTP domain checker as integrated tools for fact verification  
    - Responses include step-by-step guidance, positive tone for unavailable domains, and proactive information offering  
    - Implements logic to first collect user name and email before replying to queries  
    - Ensures conversation history is appended, not overwritten  
    - Input: message text and context  
    - Output: structured AI reply JSON to Respond to Webhook node  
    - Edge cases: AI model timeouts, API quota limits, expression errors in prompt, missing knowledge base data  
    - Version: LangChain Agent v2.1  

  - `Google Gemini Chat Model`:  
    - Type: LangChain LM Chat Google Gemini  
    - Provides the underlying AI language model processing  
    - Connected as languageModel for AI Agent  
    - Uses Google Palm API credentials  
    - Edge cases: API authentication errors, network issues, model unavailability  
    - Version: v1  

#### 1.4 Knowledge Base Access

- **Overview:** Provides real-time access to structured knowledge bases stored in Google Sheets, enabling accurate and up-to-date AI responses.  
- **Nodes Involved:**  
  - `Shared_Hosting_Plans`  
  - `Domain_Prices`  
  - `Hosting_Features`  
  - `FAQs`  
  - `Payment_Method_Details`  
  - `Offerings`  
- **Node Details (common for all):**  
  - Type: Google Sheets Tool (custom n8n node)  
  - Connects to specific sheets within a single Google Sheets document (`documentId`: `1SOFmoAm8uJ6bADAMH0OnX1NxDtG3DZs3wwt5Ojnr510`)  
  - Sheets represent distinct knowledge domains (hosting plans, domain prices, features, FAQs, payment methods, offerings)  
  - Credentials: Google Sheets OAuth2 API with account `m7KJWht6snJWUiJc`  
  - Each node provides data dynamically to AI Agent via ai_tool connection  
  - Edge cases: Permission errors, sheet renaming or deletion, API quota limits, stale data  
  - Versions: v4.6  

#### 1.5 Domain Availability Checking

- **Overview:** Checks domain name availability by invoking the WHMCS API, enabling the AI to provide accurate domain registration guidance.  
- **Nodes Involved:**  
  - `Domain_Availability_Checker`  
- **Node Details:**  
  - Type: HTTP Request Tool (POST)  
  - Makes form-urlencoded POST request to `https://your_whmcs_url.com/includes/api.php` (WHMCS API endpoint)  
  - Parameters include API identifier, secret, action `DomainWhois`, and domain name extracted dynamically from AI Agent input  
  - Headers: `Content-Type: application/x-www-form-urlencoded`  
  - Integrated as ai_tool for AI Agent to invoke for checking domain status before pricing info  
  - Edge cases: API authentication failure, network timeout, invalid domain input, WHMCS endpoint downtime  
  - Version: HTTP Request Tool v4.2  

#### 1.6 Chat History Management

- **Overview:** Appends or updates complete chat session data (including name, email, session ID, timestamps, and conversation messages) in a dedicated Google Sheet for record-keeping and analysis.  
- **Nodes Involved:**  
  - `Chat_Inquiries`  
- **Node Details:**  
  - Type: Google Sheets Tool  
  - Operates on a Google Sheet document (ID: `14ETwMLE0K_oigu-Xuu3exw6fVUP8rsWKZ4QlyGTsKwU`) and sheet `gid=0` (Sheet1)  
  - Performs appendOrUpdate operation matching on `Session Id` column  
  - Columns mapped: Session Id, Name, Email, Start Date, Start Time (Pak Time), Chat (conversation messages stored chronologically in columns starting from 4th)  
  - Uses dynamic values injected by AI Agent to append messages without overwriting previous data  
  - Credentials: Google Sheets OAuth2 API  
  - Edge cases: Data race conditions on concurrent sessions, spreadsheet permission errors, schema mismatch, API quota  
  - Version: v4.6  

#### 1.7 Response Delivery

- **Overview:** Sends the AI-generated response back to the user as an HTTP response to the original webhook request.  
- **Nodes Involved:**  
  - `Respond to Webhook1`  
- **Node Details:**  
  - Type: Respond to Webhook  
  - Configured to respond with `application/json` content-type and appropriate CORS headers (`Access-Control-Allow-Origin: *`, etc.)  
  - Receives AI Agent output as input  
  - Edge cases: Response formatting errors, client connection closed prematurely  
  - Version: v1  

#### 1.8 Documentation & Notes

- **Overview:** Provides contextual documentation and use case descriptions within the workflow for maintainers and users.  
- **Nodes Involved:**  
  - `Sticky Note`  
  - `Sticky Note1`  
- **Node Details:**  
  - Type: Sticky Note  
  - Contain detailed descriptions of the workflow purpose, target audience, and operational flow  
  - No active workflow logic, purely informational  
  - Positioned visibly for maintainers  
  - Version: v1  

---

### 3. Summary Table

| Node Name                  | Node Type                         | Functional Role                              | Input Node(s)                | Output Node(s)               | Sticky Note                                                                                                  |
|----------------------------|----------------------------------|----------------------------------------------|------------------------------|------------------------------|--------------------------------------------------------------------------------------------------------------|
| Webhook                    | Webhook                          | Receive incoming chat requests               |                              | AI Agent                     |                                                                                                              |
| Simple Memory              | LangChain Memory Buffer Window   | Maintain session conversation context       | Webhook                      | AI Agent                     |                                                                                                              |
| Google Gemini Chat Model   | LangChain LM Chat Model          | Provide AI language model for chat           |                              | AI Agent                     |                                                                                                              |
| AI Agent                  | LangChain Agent                  | Process user message and generate response  | Webhook, Simple Memory, Google Gemini Chat Model, Knowledge Bases, Domain Availability Checker, Chat_Inquiries | Respond to Webhook1          |                                                                                                              |
| Shared_Hosting_Plans       | Google Sheets Tool               | Provide hosting plan info                     |                              | AI Agent (ai_tool)           |                                                                                                              |
| Domain_Prices              | Google Sheets Tool               | Provide domain pricing info                    |                              | AI Agent (ai_tool)           |                                                                                                              |
| Hosting_Features           | Google Sheets Tool               | Provide hosting features info                  |                              | AI Agent (ai_tool)           |                                                                                                              |
| FAQs                      | Google Sheets Tool               | Provide FAQ data                              |                              | AI Agent (ai_tool)           |                                                                                                              |
| Payment_Method_Details     | Google Sheets Tool               | Provide payment methods info                   |                              | AI Agent (ai_tool)           |                                                                                                              |
| Offerings                 | Google Sheets Tool               | Provide company offerings info                  |                              | AI Agent (ai_tool)           |                                                                                                              |
| Domain_Availability_Checker | HTTP Request Tool                | Check domain availability via WHMCS API       |                              | AI Agent (ai_tool)           |                                                                                                              |
| Chat_Inquiries             | Google Sheets Tool               | Append/update chat session history             | AI Agent                     |                              |                                                                                                              |
| Respond to Webhook1        | Respond to Webhook               | Return AI response to user                      | AI Agent                     |                              |                                                                                                              |
| Sticky Note                | Sticky Note                     | Documentation: Workflow purpose and use cases |                              |                              | Customer Support Chat Agent for Web Hosting Companies: Designed for web hosting and domain registration support automation |
| Sticky Note1               | Sticky Note                     | Documentation: Workflow operational logic     |                              |                              | How it works: AI-powered customer support chatbot integrating Google Gemini AI, Google Sheets, WHMCS API     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `2636ab69-9b01-4d0a-9146-178947f0c5cf`  
   - Purpose: Entry point to receive chat messages with JSON body containing `message` and `sessionId`  

2. **Add Simple Memory node**  
   - Type: LangChain Memory Buffer Window  
   - Session Key: `={{ $('Webhook').item.json.body.sessionId }}`  
   - Session Id Type: Custom Key  
   - Context Window Length: 15  
   - Connect input from Webhook node  
   - Purpose: Maintain session-based memory for conversational context  

3. **Add Google Gemini Chat Model node**  
   - Type: LangChain LM Chat Google Gemini  
   - Credentials: Configure with Google Palm API account  
   - Purpose: Provide AI language model backend for chat processing  

4. **Add Knowledge Base Google Sheets Tool nodes**  
   For each knowledge base:  
   - Type: Google Sheets Tool  
   - Document ID: `1SOFmoAm8uJ6bADAMH0OnX1NxDtG3DZs3wwt5Ojnr510`  
   - Credential: Google Sheets OAuth2 API (set up and link your Google account)  
   - Sheet Name and ID as below:  
     - `Shared_Hosting_Plans`: Sheet ID `2043456934`  
     - `Domain_Prices`: Sheet ID `105151249`  
     - `Hosting_Features`: Sheet ID `1112678828`  
     - `FAQs`: Sheet ID `335311410`  
     - `Payment_Method_Details`: Sheet ID `499178757`  
     - `Offerings`: Sheet ID `1058340463`  
   - Purpose: Serve as real-time knowledge sources for AI agent  

5. **Add Domain Availability Checker node**  
   - Type: HTTP Request Tool  
   - Method: POST  
   - URL: `https://your_whmcs_url.com/includes/api.php` (replace with real URL)  
   - Content-Type: `application/x-www-form-urlencoded`  
   - Body Parameters:  
     - `identifier`: Your WHMCS API identifier  
     - `secret`: Your WHMCS API secret  
     - `action`: `DomainWhois`  
     - `domain`: Dynamic value from AI Agent input  
   - Header Parameters: Set `Content-Type` accordingly  
   - Purpose: Check if domain name is available before providing pricing  

6. **Add AI Agent node**  
   - Type: LangChain Agent  
   - Parameters:  
     - Text input bound to `={{ $json.body.message }}` from Webhook  
     - System message prompt: Detailed persona and operational instructions (copy from original prompt)  
     - Language Model: Connect Google Gemini Chat Model node  
     - Memory: Connect Simple Memory node  
     - Tools: Add all Google Sheets nodes and Domain Availability Checker as tools available for AI queries  
   - Purpose: Process incoming messages, use knowledge base tools and API calls, generate contextual responses  

7. **Add Chat Inquiries node**  
   - Type: Google Sheets Tool  
   - Document ID: `14ETwMLE0K_oigu-Xuu3exw6fVUP8rsWKZ4QlyGTsKwU`  
   - Sheet Name: `gid=0` (Sheet1)  
   - Operation: Append or Update  
   - Matching Columns: `Session Id`  
   - Columns Mapping: Map session info (Session Id, Name, Email, Start Date, Start Time, Chat messages) from AI Agent output  
   - Purpose: Save full chat session history  

8. **Add Respond to Webhook node**  
   - Type: Respond to Webhook  
   - Response Headers:  
     - Content-Type: application/json  
     - Access-Control-Allow-Origin: `*`  
     - Access-Control-Allow-Headers: `Content-Type, x-api-key`  
     - Access-Control-Allow-Methods: `POST, OPTIONS`  
   - Connect input from AI Agent node’s main output  
   - Purpose: Return AI-generated response to the user’s HTTP request  

9. **Connect nodes in order:**  
   - Webhook → Simple Memory → AI Agent  
   - AI Agent → Respond to Webhook (main output)  
   - AI Agent → Chat_Inquiries (ai_tool)  
   - AI Agent → Google Sheets tools (Shared_Hosting_Plans, Domain_Prices, Hosting_Features, FAQs, Payment_Method_Details, Offerings) and Domain_Availability_Checker (ai_tool input)  
   - Google Gemini Chat Model → AI Agent (languageModel)  
   - Simple Memory → AI Agent (ai_memory)  

10. **Add Sticky Note nodes** (optional but recommended)  
    - Add informational sticky notes describing workflow purpose and operation for future maintainers  

11. **Credentials Setup:**  
    - Google Sheets OAuth2 API: Configure with Google account authorized to access all knowledge base sheets  
    - Google Palm API: Configure with valid Google Gemini (PaLM) API credentials  
    - WHMCS API: Obtain and configure API identifier and secret for domain availability checks  

12. **Testing and validation:**  
    - Send test POST requests to webhook endpoint with JSON body including `sessionId`, `message`, name, and email fields as per conversational flow  
    - Verify AI responses and chat history saving in Google Sheet  
    - Confirm domain availability checks trigger correctly and response tone matches defined persona  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                  | Context or Link                                                                                   |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Customer Support Chat Agent for Web Hosting Companies: Designed for web hosting and domain registration support automation, ideal for IT service providers.                                                                  | Sticky Note content within workflow                                                             |
| How it works: AI-powered customer support chatbot integrating Google Gemini AI, Google Sheets knowledge bases, and WHMCS API for domain availability checking.                                                                | Sticky Note content summarizing workflow logic                                                  |
| Workflow uses Google Gemini (PaLM) API via LangChain integration inside n8n for natural language understanding and generation.                                                                                               | Google Gemini Chat Model node                                                                    |
| Google Sheets are used as dynamic knowledge bases to ensure accurate, up-to-date responses without hardcoding product or pricing data.                                                                                        | Multiple Google Sheets Tool nodes                                                                |
| WHMCS API integration enables live domain availability checking to enhance user experience and accuracy, avoiding guessing domain status.                                                                                     | Domain Availability Checker HTTP Request Tool node                                              |
| Chat history is maintained in a dedicated Google Sheet, storing session-wise conversation chronologically, supporting customer support analysis and follow-up.                                                                | Chat_Inquiries Google Sheets Tool node                                                          |
| AI agent’s system prompt includes detailed interaction rules, tone guidance, proactive help offers, and strict fact verification instructions to ensure professional and customer-focused communication without AI disclaimers. | AI Agent node systemMessage prompt                                                              |
| Delay in sending responses is implemented to mimic human typing behavior, improving user experience.                                                                                                                          | Included in AI Agent prompt instructions                                                        |
| Avoids overwriting chat history by appending new messages in next available columns to maintain complete session logs.                                                                                                       | AI Agent and Chat_Inquiries node logic                                                          |

---

**Disclaimer:** The provided text and workflow are generated from a fully automated n8n workflow designed for legal, public, and ethical use cases. All data access and processing comply with relevant content policies.