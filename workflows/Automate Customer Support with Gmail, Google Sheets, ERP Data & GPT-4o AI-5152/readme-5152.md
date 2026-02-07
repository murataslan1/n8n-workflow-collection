Automate Customer Support with Gmail, Google Sheets, ERP Data & GPT-4o AI

https://n8nworkflows.xyz/workflows/automate-customer-support-with-gmail--google-sheets--erp-data---gpt-4o-ai-5152


# Automate Customer Support with Gmail, Google Sheets, ERP Data & GPT-4o AI

### 1. Workflow Overview

This workflow automates customer support by integrating Gmail, Google Sheets, an ERP system, and GPT-4o AI models to process incoming customer requests, analyze them with AI, fetch relevant context, and generate draft responses for human agents to review and approve before sending.

**Target Use Cases:**
- Handling multi-channel customer support inquiries via email and chat
- Extracting structured insights from unstructured customer messages
- Leveraging historical support data, product manuals, and ERP data for contextual replies
- Automating response drafting while preserving human oversight to ensure quality

**Logical Blocks:**

- **1.1 Input Reception**  
  Handles incoming customer requests from Gmail emails and chat interface triggers.

- **1.2 AI Processing**  
  Extracts structured information from customer messages using AI language models.

- **1.3 Context Gathering**  
  Retrieves historical support cases from Google Sheets, product documentation from Google Drive (PDF manual), and customer/order info from an ERP API.

- **1.4 Response Generation**  
  Uses AI to generate professional German-language draft responses integrating all context.

- **1.5 Human Approval & Delivery**  
  Sends draft responses for human review and approval, then sends finalized messages back to customers by email or chat.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block captures incoming support requests from two channels — Gmail emails and chat interface messages — to initiate the workflow.

**Nodes Involved:**  
- 📧 Support Email Received (Gmail Trigger)  
- Chat Message Received (Langchain Chat Trigger)  
- 📧 Email Input (Sticky Note)  
- 💬 Chat Input (Sticky Note)  

**Node Details:**

- **📧 Support Email Received**  
  - Type: Gmail Trigger node  
  - Role: Polls Gmail inbox every minute for new emails that match criteria (default: all new emails)  
  - Config: Uses OAuth2 Gmail credentials for access; no filters configured by default  
  - Input: None (trigger node)  
  - Output: New email data including sender, subject, snippet  
  - Edge Cases: Auth failures, Gmail API limits, email parsing errors  

- **Chat Message Received**  
  - Type: Langchain Chat Trigger node  
  - Role: Listens for incoming chat messages via webhook URL for interactive testing  
  - Config: Default webhook, no specific options  
  - Input: Incoming chat messages  
  - Output: Chat message content  
  - Edge Cases: Webhook failures, malformed input messages  

- **📧 Email Input** and **💬 Chat Input** (Sticky Notes)  
  - Type: Sticky Notes for documentation only  
  - Role: Provide explanations of the email and chat triggers  
  - No functional role  

---

#### 1.2 AI Processing

**Overview:**  
Processes incoming messages to extract structured metadata such as category, urgency, sentiment, keywords, product identifiers, and required actions using an AI information extractor.

**Nodes Involved:**  
- AI Information Extractor (Langchain Information Extractor)  
- 🤖 OpenAI Model (Extractor)  
- 🧠 AI Analysis (Sticky Note)  

**Node Details:**

- **AI Information Extractor**  
  - Type: Langchain Information Extractor node  
  - Role: Extracts structured JSON data from incoming text (email snippet or chat input) based on a manual JSON schema  
  - Config:  
    - Input text is either chatInput or email snippet depending on execution  
    - Schema defines required fields like category (technical, billing, etc.), urgency, sentiment, keywords, product identifiers, customer info, and required action  
  - Input: Text from Chat Message Received or Support Email Received  
  - Output: Structured JSON with extracted data  
  - Edge Cases: Extraction failures due to ambiguous input, schema mismatches, API timeout  
  - Depends on: OpenAI GPT-4o-mini via linked 🤖 OpenAI Model (Extractor) node  

- **🤖 OpenAI Model (Extractor)**  
  - Type: Langchain OpenAI Chat node  
  - Role: AI language model providing the NLP capabilities to extract data  
  - Config: Uses GPT-4o-mini model, authorized with OpenAI API credentials  
  - Input: Text to analyze  
  - Output: Extracted structured data passed to AI Information Extractor  
  - Edge Cases: API rate limits, network issues, prompt failures  

- **🧠 AI Analysis** (Sticky Note)  
  - Documentation explaining the purpose and data extracted by the AI Information Extractor  

---

#### 1.3 Context Gathering

**Overview:**  
Collects relevant context from multiple sources including historical support cases (Google Sheets), product manuals (Google Drive PDF), and ERP system data to enrich AI-driven response generation.

**Nodes Involved:**  
- 📊 Historical Support Cases (Google Sheets node)  
- 📋 Aggregate Support Data (Aggregate node)  
- 📚 Download Product Manual (Google Drive node)  
- 📄 Extract PDF Content (Extract From File node)  
- 🏢 Check ERP System (HTTP Request node)  
- 🏢 ERP Integration (Sticky Note)  
- 📊 Context Data (Sticky Note)  
- 📚 Knowledge Base (Sticky Note)  

**Node Details:**

- **📊 Historical Support Cases**  
  - Type: Google Sheets node  
  - Role: Reads customer support history from a specific sheet in a Google Sheets document  
  - Config: Uses OAuth2 Google Sheets credentials; targets "zeiss_primotech_support" sheet  
  - Input: Triggered by AI Information Extractor output  
  - Output: Rows of historical Q&A data  
  - Edge Cases: Auth issues, sheet not found, empty data  

- **📋 Aggregate Support Data**  
  - Type: Aggregate node  
  - Role: Consolidates the historical support cases data into a single aggregated JSON or dataset  
  - Input: Data from Google Sheets node  
  - Output: Aggregated JSON string for AI input  
  - Edge Cases: Empty data, aggregation errors  

- **📚 Download Product Manual**  
  - Type: Google Drive node  
  - Role: Downloads the Primotech product manual PDF from Google Drive  
  - Config: OAuth2 Google Drive credentials; specified file ID pointing to Primotech_Manual.pdf  
  - Input: Triggered after aggregation of support data  
  - Output: PDF binary data for extraction  
  - Edge Cases: File not found, permission denied, download errors  

- **📄 Extract PDF Content**  
  - Type: Extract From File node  
  - Role: Extracts text content from the downloaded PDF manual for AI processing  
  - Config: Operation set to "pdf"  
  - Input: PDF file from Google Drive node  
  - Output: Extracted text content  
  - Edge Cases: PDF parsing errors, corrupted file  

- **🏢 Check ERP System**  
  - Type: HTTP Request node  
  - Role: Queries mocked ERP API to retrieve customer account, order history, inventory, pricing info  
  - Config: HTTP GET to mocky.io endpoint simulating ERP data  
  - Input: After PDF extraction  
  - Output: JSON ERP data  
  - Edge Cases: API downtime, malformed response, network errors  

- **🏢 ERP Integration** (Sticky Note)  
  - Documentation on ERP integration purpose and mock API usage  

- **📊 Context Data** and **📚 Knowledge Base** (Sticky Notes)  
  - Documentation describing the importance and content of historical data and product manuals  

---

#### 1.4 Response Generation

**Overview:**  
Combines extracted customer info, historical support data, product manual text, and ERP data to generate a professional, structured customer response in German, using GPT-4o-mini.

**Nodes Involved:**  
- 🤖 Generate Customer Response (Chain LLM node)  
- 🤖 OpenAI Model (Generator)  
- 🤖 AI Response Generation (Sticky Note)  

**Node Details:**

- **🤖 Generate Customer Response**  
  - Type: Langchain Chain LLM node  
  - Role: Composes a detailed prompt integrating all context to draft a customer support reply  
  - Configuration:  
    - Uses a complex prompt embedding: product manual text, historical support CSV, original query, ERP inventory/pricing data.  
    - The output is a German language professional email draft following company style and structure  
    - Output is a text string suitable for email or chat response  
  - Input: ERP data from HTTP Request, aggregated support data, extracted PDF text, original customer query  
  - Output: Draft response text  
  - Edge Cases: Missing context (manual placeholders inserted), partial knowledge, AI generation failures  

- **🤖 OpenAI Model (Generator)**  
  - Type: Langchain OpenAI Chat node  
  - Role: Executes the Chain LLM prompt with GPT-4o-mini to generate the response  
  - Input: Prompt from Generate Customer Response node  
  - Output: AI-generated response text  
  - Edge Cases: API limits, timeouts, prompt errors  

- **🤖 AI Response Generation** (Sticky Note)  
  - Documentation explaining the purpose and inputs of this generation step  

---

#### 1.5 Human Approval & Delivery

**Overview:**  
Implements a human-in-the-loop quality control step where support agents review and approve or modify AI-generated responses before sending to customers via email.

**Nodes Involved:**  
- 📧 Email or Chat? (If node)  
- 📧 Request Approval (Email node)  
- 📤 Send Response to Customer (Gmail node)  
- 📝 Format Chat Response (Set node)  
- 👥 Quality Control (Sticky Note)  

**Node Details:**

- **📧 Email or Chat?**  
  - Type: If node  
  - Role: Checks if the incoming request was an email (true) or chat (false) to route the response accordingly  
  - Input: Output from Generate Customer Response  
  - Output: Routes to email approval or chat formatting nodes  
  - Edge Cases: Inconsistent execution flags, missing input data  

- **📧 Request Approval (Email)**  
  - Type: Gmail node with sendAndWait operation  
  - Role: Sends the generated response to a support agent’s email for review and requires approval before sending  
  - Config:  
    - Sends to a configured approver email (dummy@mail.com)  
    - Includes customer query and generated response in email body  
    - Subject: "Customer Support Response - Approval Required"  
    - Approval type: double approval enabled  
  - Input: Generated response text and original query  
  - Output: Waits for agent decision (approve/reject)  
  - Edge Cases: Approval timeout, email delivery failures, miscommunication  

- **📤 Send Response to Customer**  
  - Type: Gmail node  
  - Role: Sends the approved response to the original customer email address  
  - Config: Uses OAuth2 Gmail credentials; subject prefixed with "Re:" and original subject  
  - Input: Approved response text and customer email  
  - Output: Email sent confirmation  
  - Edge Cases: Email sending failures, invalid recipient  

- **📝 Format Chat Response**  
  - Type: Set node  
  - Role: Formats the AI-generated text for chat response delivery  
  - Config: Sets a “text” property with the AI-generated response text  
  - Input: AI-generated response text (for chat path)  
  - Output: Formatted message for chat output  
  - Edge Cases: Missing or empty text  

- **👥 Quality Control** (Sticky Note)  
  - Documentation describing the purpose and benefits of human-in-the-loop approval  

---

### 3. Summary Table

| Node Name                   | Node Type                         | Functional Role                    | Input Node(s)                 | Output Node(s)                  | Sticky Note                                                                                  |
|-----------------------------|----------------------------------|----------------------------------|------------------------------|-------------------------------|----------------------------------------------------------------------------------------------|
| 📋 Workflow Overview         | Sticky Note                      | Documentation overview            | None                         | None                          | # 🌐 AI Customer Support Assistant - Cloud Version ... (Full overview and demo instructions) |
| 📧 Email Input               | Sticky Note                      | Email trigger explanation         | None                         | 📧 Support Email Received      | ## 📧 Email Trigger ... (Purpose and demo tips)                                              |
| 📧 Support Email Received    | Gmail Trigger                   | Gmail email trigger               | None                         | AI Information Extractor       |                                                                                            |
| 💬 Chat Input               | Sticky Note                      | Chat trigger explanation          | None                         | Chat Message Received          | ## 💬 Chat Trigger ... (Purpose and demo tips)                                              |
| Chat Message Received        | Langchain Chat Trigger          | Chat input trigger                | None                         | AI Information Extractor       |                                                                                            |
| 🧠 AI Analysis              | Sticky Note                      | AI structured data extraction info| None                         | None                          | ## 🧠 AI Information Extractor ... (Purpose and extracted fields)                            |
| AI Information Extractor     | Langchain Information Extractor | Extracts structured customer info | 📧 Support Email Received, Chat Message Received | 📊 Historical Support Cases |                                                                                            |
| 🤖 OpenAI Model (Extractor)  | Langchain OpenAI Chat           | AI NLP model for extraction      | AI Information Extractor (linked) | AI Information Extractor       |                                                                                            |
| 📊 Historical Support Cases  | Google Sheets                   | Reads historical support data    | AI Information Extractor      | 📋 Aggregate Support Data      |                                                                                            |
| 📋 Aggregate Support Data    | Aggregate                      | Aggregates historical data       | 📊 Historical Support Cases   | 📚 Download Product Manual     |                                                                                            |
| 📚 Download Product Manual   | Google Drive                   | Downloads product manual PDF     | 📋 Aggregate Support Data     | 📄 Extract PDF Content         |                                                                                            |
| 📄 Extract PDF Content       | Extract From File              | Extracts text from PDF           | 📚 Download Product Manual    | 🏢 Check ERP System            |                                                                                            |
| 🏢 Check ERP System          | HTTP Request                   | Calls ERP API for customer data  | 📄 Extract PDF Content        | 🤖 Generate Customer Response  |                                                                                            |
| 🏢 ERP Integration           | Sticky Note                    | Explains ERP integration         | None                         | None                          | ## 🏢 ERP System Integration ... (Purpose and mock API details)                             |
| 📊 Context Data             | Sticky Note                    | Explains historical support data | None                         | None                          | ## 📊 Historical Support Data ...                                                        |
| 📚 Knowledge Base           | Sticky Note                    | Explains product knowledge base  | None                         | None                          | ## 📚 Product Knowledge Base ...                                                           |
| 🤖 Generate Customer Response| Langchain Chain LLM            | Drafts customer response         | 🏢 Check ERP System           | 📧 Email or Chat?              |                                                                                            |
| 🤖 OpenAI Model (Generator)  | Langchain OpenAI Chat           | AI model generating response     | 🤖 Generate Customer Response | 🤖 Generate Customer Response  |                                                                                            |
| 👥 Quality Control          | Sticky Note                    | Describes human approval process | None                         | None                          | ## 👥 Human-in-the-Loop Approval ... (Purpose and benefits)                                |
| 📧 Email or Chat?            | If                            | Routes response by input channel | 🤖 Generate Customer Response | 📧 Request Approval (Email), 📝 Format Chat Response |                                                                                            |
| 📧 Request Approval (Email)  | Gmail (sendAndWait)            | Sends response for agent approval| 📧 Email or Chat?             | 📤 Send Response to Customer   |                                                                                            |
| 📤 Send Response to Customer | Gmail                         | Sends final approved response    | 📧 Request Approval (Email)   | None                          |                                                                                            |
| 📝 Format Chat Response      | Set                           | Formats AI response for chat     | 📧 Email or Chat?             | None                          |                                                                                            |
| Sticky Note (Demo tips)      | Sticky Note                   | Demo instructions                | None                         | None                          | ## How to run a demo ... (Add credentials, approver email)                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Sticky Notes for Documentation:**  
   - Add a sticky note named "📋 Workflow Overview" at workflow start explaining overall workflow purpose and demo tips.  
   - Add sticky notes "📧 Email Input", "💬 Chat Input", "🧠 AI Analysis", "📊 Context Data", "📚 Knowledge Base", "🏢 ERP Integration", and "👥 Quality Control" at appropriate sections with their respective descriptions.

2. **Set Up Input Triggers:**  
   - Add **Gmail Trigger** node named "📧 Support Email Received":  
     - Use Gmail OAuth2 credentials.  
     - Set to poll every minute without filters (customize as needed).  
   - Add **Langchain Chat Trigger** node named "Chat Message Received":  
     - Create webhook for chat input.  
   - Connect both to the next AI extraction step.

3. **Add AI Information Extractor:**  
   - Add **Langchain Information Extractor** node named "AI Information Extractor":  
     - Set input text expression to: `{{$json.chatInput ? $json.chatInput : $json.snippet}}`  
     - Paste the manual JSON schema defining fields: category, urgency, sentiment, keywords, productIdentifiers, customerInfo, requiredAction.  
   - Add **Langchain OpenAI Chat** node "🤖 OpenAI Model (Extractor)" with GPT-4o-mini model and link it as AI languageModel for the extractor node.  
   - Connect both triggers (email and chat) to this extractor.

4. **Retrieve Historical Support Data:**  
   - Add **Google Sheets** node "📊 Historical Support Cases":  
     - Link with Google Sheets OAuth2 credentials.  
     - Configure document ID and sheet name pointing to support cases data.  
   - Add **Aggregate** node "📋 Aggregate Support Data" to combine sheet rows.  
   - Connect AI Information Extractor output to Google Sheets, then to Aggregate node.

5. **Download and Extract Product Manual:**  
   - Add **Google Drive** node "📚 Download Product Manual":  
     - Use Google Drive OAuth2 credentials.  
     - Set file ID to Primotech manual PDF.  
     - Connect output of Aggregate node to this node.  
   - Add **Extract From File** node "📄 Extract PDF Content":  
     - Set operation to PDF extraction.  
     - Connect to Google Drive node output.

6. **ERP System Query:**  
   - Add **HTTP Request** node "🏢 Check ERP System":  
     - Set URL to mock ERP API endpoint.  
     - Connect from PDF Extract node output.

7. **Generate AI Response:**  
   - Add **Langchain Chain LLM** node "🤖 Generate Customer Response":  
     - Configure prompt embedding: pass extracted manual text, aggregated historical data (as CSV or JSON), original customer query, and ERP data.  
   - Add **Langchain OpenAI Chat** node "🤖 OpenAI Model (Generator)" with GPT-4o-mini and link it as AI languageModel for generation node.  
   - Connect HTTP Request node output to this generator node.

8. **Route by Input Channel:**  
   - Add **If** node "📧 Email or Chat?":  
     - Check if "📧 Support Email Received" was executed (boolean true).  
     - If true, route to email approval; else route to chat formatting.

9. **Email Approval and Sending:**  
   - Add **Gmail** node "📧 Request Approval (Email)":  
     - Use Gmail OAuth2 credentials.  
     - Operation: sendAndWait (for approval).  
     - Configure recipient to support agent email.  
     - Include customer query and generated response in message body.  
   - Add **Gmail** node "📤 Send Response to Customer":  
     - Use Gmail OAuth2 credentials.  
     - Send to original customer email extracted from incoming message.  
     - Subject prefixed with "Re:".  
   - Connect approval node output to sending node.

10. **Chat Response Formatting:**  
    - Add **Set** node "📝 Format Chat Response":  
      - Assign "text" field to the AI-generated response text.  
    - Connect chat path from If node to this node.

11. **Final Connections:**  
    - Connect triggers through AI extractor to context retrieval, AI generation, and then to approval or chat formatting nodes as described.

12. **Credentials Setup:**  
    - Configure Gmail OAuth2 credentials with appropriate scopes for reading and sending emails.  
    - Configure Google Sheets OAuth2 with read access to support data sheet.  
    - Configure Google Drive OAuth2 with read access to product manual file.  
    - Configure OpenAI API credentials with GPT-4o-mini access.  

13. **Test Workflow:**  
    - Send test emails or chat messages to validate triggers.  
    - Verify AI extraction outputs structured data.  
    - Confirm context retrieval from Google Sheets and Drive.  
    - Review generated responses and complete approval cycles.  
    - Ensure final responses are delivered correctly.

---

### 5. General Notes & Resources

| Note Content                                                                                               | Context or Link                                        |
|------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| This is a cloud-based version integrating OpenAI GPT-4o-mini with Google services for real-time AI support. | Workflow Overview sticky note                          |
| Demo instructions: Use chat interface for instant tests or send test emails to trigger email workflow.     | 📋 Workflow Overview, 📧 Email Input, 💬 Chat Input    |
| Human-in-the-loop approval is critical to maintain response quality and customer trust.                     | 👥 Quality Control sticky note                          |
| The ERP system integration uses a mock API endpoint; replace with real ERP API for production use.          | 🏢 ERP Integration sticky note                          |
| Product manual is sourced from Google Drive as PDF, dynamically extracted for AI context.                   | 📚 Knowledge Base sticky note                           |
| OpenAI GPT-4o-mini is the core AI model used for both extraction and response generation.                   | 🧠 AI Analysis and 🤖 AI Response Generation sticky notes |
| Approval emails are sent with double approval option enabled for enhanced security.                         | 📧 Request Approval (Email) node parameters             |
| Response format includes polite salutation and closing in German as per company standards.                  | 🤖 Generate Customer Response prompt description       |
| Workflow requires setting up Google and OpenAI credentials and updating approver email to accessible account.| Sticky Note near workflow start for demo instructions  |

---

**Disclaimer:** The text provided is exclusively derived from an automated n8n workflow. It strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.