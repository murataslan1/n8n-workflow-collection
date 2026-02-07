AI Sales Agent: WhatsApp & Website Sales Agent with RAG 

https://n8nworkflows.xyz/workflows/ai-sales-agent--whatsapp---website-sales-agent-with-rag--4442


# AI Sales Agent: WhatsApp & Website Sales Agent with RAG 

---

## 1. Workflow Overview

This workflow implements an **AI-powered Sales Agent** designed to automate customer engagement and sales interactions through WhatsApp and website contact forms, leveraging Retrieval-Augmented Generation (RAG) with LangChain and advanced language models. It targets businesses seeking to optimize lead qualification, appointment scheduling, CRM updates, and billing interactions via conversational AI integrated with backend systems like PostgreSQL and Stripe.

The workflow is logically divided into the following main blocks:

- **1.1 Input Reception & Preprocessing**  
  Handles incoming WhatsApp messages and website form submissions, classifying message types and preparing data for AI processing.

- **1.2 AI Conversational Processing with LangChain Agents**  
  Uses multiple LangChain agents powered by Google Gemini and OpenAI models, incorporating memory stores and vector search for context-aware and knowledge-augmented conversations.

- **1.3 CRM & Calendar Integration**  
  Automates CRM contact and opportunity management, and calendar event handling, all via tool workflows and database operations.

- **1.4 Billing & Payment Handling**  
  Integrates Stripe for customer billing, charge creation, discount coupons, and card management, orchestrated through LangChain billing agents.

- **1.5 Message Response & Outbound Communication**  
  Sends personalized messages back to users on WhatsApp, handling various response types and fallback scenarios.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception & Preprocessing

**Overview:**  
Receives inbound user interactions from WhatsApp and website contact forms, classifies message types to route differently, and initiates lead retrieval from the database.

**Nodes Involved:**  
- WhatsApp (WhatsApp Trigger)  
- Contact Form (Form Trigger)  
- Handle Message Types (Switch)  
- Get Lead (Postgres)  

**Node Details:**

- **WhatsApp (WhatsApp Trigger)**  
  - Type: Trigger node for WhatsApp messages  
  - Config: Receives inbound WhatsApp messages via webhook  
  - Outputs message content and metadata  
  - Connects to: Get Lead  
  - Edge cases: Webhook misconfiguration, authentication failures  

- **Contact Form (Form Trigger)**  
  - Type: Trigger node for website forms  
  - Config: Listens to form submissions via webhook  
  - Connects to: Create Contact1  
  - Edge cases: Missing form fields, malformed submissions  

- **Handle Message Types (Switch)**  
  - Type: Switch to route messages by type  
  - Config: Evaluates message content or metadata to route  
  - Outputs: Edit Fields - chat1, WhatsApp Business Cloud, Reply To User1 branches  
  - Connects to: Different WhatsApp nodes or field editing nodes  
  - Edge cases: Unrecognized message types, routing errors  

- **Get Lead (Postgres)**  
  - Type: Database query node  
  - Config: Queries PostgreSQL to retrieve lead info by phone or user ID  
  - Connects to: Handle Message Types  
  - Edge cases: Database connection issues, no lead found  

---

### 2.2 AI Conversational Processing with LangChain Agents

**Overview:**  
Processes incoming messages using AI agents that integrate language models, knowledge bases, and memory to generate context-aware responses.

**Nodes Involved:**  
- AI Agent (@n8n/n8n-nodes-langchain.agent)  
- Personalised First Message (@n8n/n8n-nodes-langchain.agent)  
- Gemini (Google Gemini LM Chat)  
- OpenAI (@n8n/n8n-nodes-langchain.openAi)  
- Postgres Chat Memory (LangChain memory)  
- Window Buffer Memory (LangChain memory)  
- technical_and_sales_knowledge (Vector Store)  
- Google Gemini Chat Model (several instances)  
- CRM Agent (@n8n/n8n-nodes-langchain.toolWorkflow & agent)  
- Calendar Agent (@n8n/n8n-nodes-langchain.toolWorkflow & agent)  
- Billing Agent (@n8n/n8n-nodes-langchain.toolWorkflow & agent)  

**Node Details:**

- **AI Agent**  
  - Role: Central LangChain agent orchestrating AI-driven conversation  
  - Config: Connects to memory stores, vector store, and sub-agents (CRM, Calendar, Billing) as tools  
  - Inputs: Edited chat fields or direct user input from WhatsApp  
  - Outputs: Switch node for response routing  
  - Edge cases: Model timeouts, API rate limits, memory retrieval failures  

- **Personalised First Message**  
  - Role: Generates personalized initial welcome messages using AI  
  - Connects: After contact creation or form submission  
  - Outputs: Send First Message node  
  - Edge cases: Model generation errors, incomplete input data  

- **Gemini**  
  - Role: Language model node using Google Gemini for chat completions  
  - Used by: Personalised First Message, AI Agent, and other sub-agents  
  - Edge cases: API quota issues, network failures  

- **OpenAI**  
  - Role: Alternative or supplementary language model node for response generation  
  - Connects: HTTP Request node output for chained processing  
  - Edge cases: API key problems, model unavailability  

- **Postgres Chat Memory**  
  - Role: Persistent chat memory stored in PostgreSQL for context continuity  
  - Connected as AI memory input to AI Agent  
  - Edge cases: DB connectivity, data consistency  

- **Window Buffer Memory**  
  - Role: Short-term conversational memory buffer for CRM Agent  
  - Edge cases: Memory overflow, loss of short-term context  

- **technical_and_sales_knowledge (Vector Store)**  
  - Role: Knowledge base vector store for RAG, providing technical and sales data references  
  - Connected to CRM Agent as vector store for answering queries  
  - Edge cases: Vector store indexing issues, stale data  

- **Google Gemini Chat Model (multiple instances)**  
  - Role: Multiple dedicated LM nodes configured for different agents (CRM, Calendar, Billing) to isolate workloads  
  - Edge cases: Model latency, cost management  

- **CRM Agent**  
  - Role: LangChain tool workflow agent managing CRM-related queries and commands  
  - Uses PostgresTool nodes for Create, Update, Delete operations on contacts and opportunities  
  - Edge cases: DB transaction failures, data validation errors  

- **Calendar Agent**  
  - Role: Manages Google Calendar events via tool workflow agent  
  - Uses Google Calendar Tool nodes for Create, Update, Delete, and Get Events  
  - Edge cases: Calendar API rate limits, permission errors  

- **Billing Agent**  
  - Role: Interfaces with Stripe via tool workflows to manage customers, charges, coupons  
  - Uses Stripe Tool nodes  
  - Edge cases: Payment failures, API key issues, invalid customer data  

---

### 2.3 CRM & Calendar Integration

**Overview:**  
Handles creation, update, deletion, and retrieval of CRM contacts and opportunities, and manages calendar event scheduling and attendee management.

**Nodes Involved:**  
- Create Contact, Update Contact, Delete Contact (PostgresTool)  
- Create Opportunity, Update Opportunity, Delete Opportunity (PostgresTool)  
- Create Event, Create Event with Attendee, Update Event, Delete Event, Get Events (Google Calendar Tool)  
- List Records (PostgresTool)  

**Node Details:**

- **Postgres Tool Nodes**  
  - Role: CRUD operations on PostgreSQL CRM data  
  - Config: SQL queries or parameterized commands to handle contact and opportunity records  
  - Edge cases: SQL injection risks if inputs not sanitized, deadlocks, missing records  

- **Google Calendar Tool Nodes**  
  - Role: Manage calendar events and attendees  
  - Config: OAuth2 credentials for Google Calendar API access  
  - Edge cases: Insufficient permissions, API quota exhaustion  

- **List Records**  
  - Role: Fetch lists of CRM records for agent queries or UI display  
  - Edge cases: Large datasets causing performance issues  

---

### 2.4 Billing & Payment Handling

**Overview:**  
Manages customer billing lifecycle including creation, updates, charges, discount coupons, and payment methods using Stripe integration.

**Nodes Involved:**  
- Create Customer, Update Customer, Delete Customer (Stripe Tool)  
- Get Customer, Get Customer Card (Stripe Tool)  
- Create Charge, Create Discount Coupon (Stripe Tool)  
- Billing Agent (LangChain tool workflow and agent)  

**Node Details:**

- **Stripe Tool Nodes**  
  - Role: Perform Stripe API operations for customer and payment management  
  - Config: Stripe API credentials and operation-specific parameters  
  - Edge cases: Invalid card info, declined charges, API limits, network failures  

- **Billing Agent**  
  - Role: LangChain agent that uses Stripe tool workflow to answer billing-related queries and execute payment operations  
  - Edge cases: Billing disputes, insufficient funds, concurrency conflicts  

---

### 2.5 Message Response & Outbound Communication

**Overview:**  
Sends AI-generated and personalized messages back to users via WhatsApp and manages fallback scenarios with retry mechanisms.

**Nodes Involved:**  
- Send First Message (WhatsApp)  
- Reply To User, Reply To User1 (WhatsApp)  
- WhatsApp Business Cloud (WhatsApp)  
- No Operation, do nothing (NoOp)  
- Edit Fields - chat1, Edit Fields - chat2 (Set nodes)  
- Response, Try Again, Success, Try Again1, Try Again2 (Set nodes)  
- Output - chat (Set node)  

**Node Details:**

- **WhatsApp Nodes (Send First Message, Reply To User, etc.)**  
  - Role: Send outbound WhatsApp messages using configured WhatsApp API credentials  
  - Edge cases: Message delivery failures, rate limits, user blocking bot  

- **No Operation, do nothing (NoOp)**  
  - Role: Placeholder node to allow workflow continuation without action  
  - Used for branches that do not require response or further processing  

- **Set Nodes (Edit Fields, Response, Try Again, Success, Output - chat)**  
  - Role: Data transformation and setting variables to control flow or prepare message content  
  - Edge cases: Expression evaluation errors, missing data fields  

- **Retry Logic (Try Again, Try Again1, Try Again2)**  
  - Role: Store messages or flags for retrying operations after failures  
  - Edge cases: Infinite retry loops if not managed carefully  

---

## 3. Summary Table

| Node Name                      | Node Type                          | Functional Role                           | Input Node(s)                     | Output Node(s)                    | Sticky Note                             |
|--------------------------------|----------------------------------|-----------------------------------------|----------------------------------|---------------------------------|----------------------------------------|
| Send First Message             | WhatsApp                         | Sends initial WhatsApp message           | Personalised First Message        | -                               |                                        |
| Personalised First Message     | LangChain Agent                  | Generates personalized welcome message   | Create Contact1                  | Send First Message               |                                        |
| Gemini                        | LangChain LM Chat Google Gemini | Language model node for chat generation  | -                                | Personalised First Message       |                                        |
| Contact Form                  | Form Trigger                    | Receives website contact form submissions| -                                | Create Contact1                 |                                        |
| Sticky Note                   | Sticky Note                    | Annotation/Comment                        | -                                | -                               |                                        |
| AI Agent                     | LangChain Agent                | Core AI conversational agent             | Edit Fields - chat2, No Operation| Switch                         |                                        |
| No Operation, do nothing      | NoOp                          | Pass-through or no action node           | Edit Fields - chat1, When chat message received | AI Agent                     |                                        |
| Calendar Agent               | LangChain Tool Workflow        | Calendar operations agent                 | Get Events, Create Event, etc.   | Success, Try Again1              |                                        |
| CRM Agent                   | LangChain Tool Workflow        | CRM operations agent                      | Create Contact, Update Contact, etc.| AI Agent                     |                                        |
| Postgres Chat Memory         | LangChain Memory Postgres       | Persistent chat memory                    | -                                | AI Agent                       |                                        |
| Handle Message Types          | Switch                        | Routes messages by type                   | Get Lead                       | Edit Fields - chat1, WhatsApp Business Cloud, Reply To User1 |                                        |
| Reply To User1               | WhatsApp                      | Sends WhatsApp reply                      | Handle Message Types             | -                               |                                        |
| Edit Fields - chat1           | Set                           | Prepares fields for chat1 branch          | Handle Message Types             | No Operation, do nothing        |                                        |
| Reply To User                | WhatsApp                      | Sends WhatsApp reply                      | Switch                        | -                               |                                        |
| WhatsApp                    | WhatsApp Trigger              | Receives WhatsApp messages                | -                                | Get Lead                       |                                        |
| WhatsApp Business Cloud       | WhatsApp                      | Sends messages via WhatsApp Business Cloud| Handle Message Types             | HTTP Request                   |                                        |
| HTTP Request                | HTTP Request                  | Calls OpenAI API                          | WhatsApp Business Cloud          | OpenAI                        |                                        |
| OpenAI                      | LangChain OpenAI               | Language model node                        | HTTP Request                   | Edit Fields - chat2             |                                        |
| Edit Fields - chat2           | Set                           | Prepares fields for AI Agent              | OpenAI                        | No Operation, do nothing        |                                        |
| Output - chat                | Set                           | Prepares output data                       | Switch                        | -                               |                                        |
| Postgres PGVector Store       | LangChain Vector Store PGVector | Vector store for RAG knowledge base       | Embeddings Google Gemini1       | technical_and_sales_knowledge   |                                        |
| Get Lead                    | Postgres                      | Retrieves lead information                 | WhatsApp                      | Handle Message Types            |                                        |
| Switch                      | Switch                        | Routes AI Agent output                     | AI Agent                      | Reply To User, Output - chat    |                                        |
| When chat message received   | LangChain Chat Trigger         | Trigger on chat message reception          | -                                | No Operation, do nothing        |                                        |
| Google Gemini Chat Model (x5) | LangChain LM Chat Google Gemini| Multiple LM nodes for different agents    | Various tool workflows          | AI Agents, CRM Agent2, Calendar Agent1, Billing Agent1 |                                        |
| Embeddings Google Gemini1     | LangChain Embeddings Google Gemini | Embedding generation for vector store      | -                                | Postgres PGVector Store         |                                        |
| Response                    | Set                           | Prepares success response                   | CRM Agent2                    | -                               |                                        |
| Try Again                   | Set                           | Prepares retry response                     | CRM Agent2                    | -                               |                                        |
| When Executed by Another Workflow | Execute Workflow Trigger       | Receives execution calls from other workflows | -                                | CRM Agent2                    |                                        |
| Window Buffer Memory         | LangChain Memory Buffer Window | Short term memory for CRM Agent             | -                                | CRM Agent2                    |                                        |
| Create Event with Attendee    | Google Calendar Tool          | Creates event with attendee                  | Calendar Agent1               | -                               |                                        |
| Create Event                | Google Calendar Tool          | Creates calendar event                      | Calendar Agent1               | -                               |                                        |
| Get Events                   | Google Calendar Tool          | Retrieves calendar events                    | Calendar Agent1               | -                               |                                        |
| Delete Event                | Google Calendar Tool          | Deletes calendar event                      | Calendar Agent1               | -                               |                                        |
| Update Event                | Google Calendar Tool          | Updates calendar event                      | Calendar Agent1               | -                               |                                        |
| Try Again1                  | Set                           | Retry response for Calendar Agent            | Calendar Agent1               | -                               |                                        |
| Success                    | Set                           | Success indicator for Calendar Agent          | Calendar Agent1               | -                               |                                        |
| Calendar Agent1             | LangChain Agent              | Calendar management LangChain agent          | Get Events, Create Event, etc. | Success, Try Again1            |                                        |
| Sticky Note1                | Sticky Note                  | Annotation/Comment                          | -                                | -                               |                                        |
| Create Opportunity           | Postgres Tool                | Creates sales opportunity                    | CRM Agent2                    | -                               |                                        |
| List Records                | Postgres Tool                | Lists CRM records                            | CRM Agent2                    | -                               |                                        |
| Update Contact              | Postgres Tool                | Updates contact                              | CRM Agent2                    | -                               |                                        |
| Delete Contact              | Postgres Tool                | Deletes contact                              | CRM Agent2                    | -                               |                                        |
| Delete Opportunity          | Postgres Tool                | Deletes opportunity                          | CRM Agent2                    | -                               |                                        |
| Update Opportunity          | Postgres Tool                | Updates opportunity                          | CRM Agent2                    | -                               |                                        |
| Create Contact              | Postgres Tool                | Creates contact                              | CRM Agent2                    | -                               |                                        |
| Sticky Note3                | Sticky Note                  | Annotation/Comment                          | -                                | -                               |                                        |
| Sticky Note4                | Sticky Note                  | Annotation/Comment                          | -                                | -                               |                                        |
| CRM Agent2                  | LangChain Agent              | CRM LangChain agent                          | List Records, Create Contact, etc.| Response, Try Again           |                                        |
| Simple Memory               | LangChain Memory Buffer Window | Short term memory for Billing Agent           | -                                | Billing Agent1                |                                        |
| Create Charge              | Stripe Tool                  | Creates payment charge                       | Billing Agent1                | -                               |                                        |
| Create Discount Coupon     | Stripe Tool                  | Creates discount coupon                      | Billing Agent1                | -                               |                                        |
| Get Customer Card          | Stripe Tool                  | Gets customer card info                      | Billing Agent1                | -                               |                                        |
| Get Customer               | Stripe Tool                  | Retrieves customer info                      | Billing Agent1                | -                               |                                        |
| Create Customer            | Stripe Tool                  | Creates Stripe customer                      | Billing Agent1                | -                               |                                        |
| Update Customer            | Stripe Tool                  | Updates Stripe customer                      | Billing Agent1                | -                               |                                        |
| Delete Customer            | Stripe Tool                  | Deletes Stripe customer                      | Billing Agent1                | -                               |                                        |
| Google Gemini Chat Model4   | LangChain LM Chat Google Gemini| Billing Agent LM node                        | Billing Agent1                | Response1, Try Again2          |                                        |
| Response1                  | Set                           | Billing success response                      | Billing Agent1                | -                               |                                        |
| Try Again2                 | Set                           | Billing retry response                        | Billing Agent1                | -                               |                                        |
| Billing Agent              | LangChain Tool Workflow       | Billing operations workflow                   | AI Agent                      | -                               |                                        |
| Billing Agent1             | LangChain Agent              | Billing LangChain agent                       | Stripe Tools, Simple Memory   | Response1, Try Again2          |                                        |
| Sticky Note2                | Sticky Note                  | Annotation/Comment                          | -                                | -                               |                                        |
| Sticky Note5                | Sticky Note                  | Annotation/Comment                          | -                                | -                               |                                        |
| Create Contact1            | Postgres                     | Creates contact from form submission          | Contact Form                 | Personalised First Message     |                                        |
| When Executed by Another Workflow | Execute Workflow Trigger       | Entry point for external workflow executions | -                                | CRM Agent2                    |                                        |

---

## 4. Reproducing the Workflow from Scratch

1. **Create trigger nodes for inputs:**
   - Add **WhatsApp Trigger** node, configure webhook to receive inbound WhatsApp messages.
   - Add **Form Trigger** node for website contact form submissions with webhook.

2. **Set up lead lookup and message classification:**
   - Add **Postgres** node ("Get Lead") configured to query leads by phone or user ID.
   - Add **Switch** node ("Handle Message Types") to route messages into three branches:
     - Prepare chat fields for AI processing  
     - Send business cloud WhatsApp messages  
     - Send immediate replies for specific messages

3. **Prepare chat fields:**
   - Add two **Set** nodes ("Edit Fields - chat1" and "Edit Fields - chat2") to prepare message data for AI agents.
   - Connect "Edit Fields - chat1" to a **No Operation** node for empty branch.
   - Connect "Edit Fields - chat2" to the **AI Agent** node.

4. **Create AI conversational agents:**
   - Add **LangChain Agent** node ("AI Agent") connected to:
     - **Postgres Chat Memory** node for persistent chat context.
     - **Postgres PGVector Store** node linked to **Embeddings Google Gemini1** for RAG knowledge.
     - Tool workflows for CRM, Calendar, and Billing agents.
   - Add supporting **LangChain LM Chat Google Gemini** nodes for language model processing.

5. **Configure CRM tool workflow:**
   - Create a sub-workflow or use PostgresTool nodes for:
     - Create, update, delete contacts and opportunities.
     - List CRM records.
   - Connect these to CRM Agent LangChain tool workflow nodes.

6. **Configure Calendar tool workflow:**
   - Add Google Calendar Tool nodes for event management:
     - Create event, create event with attendee, update, delete, and get events.
   - Connect these to Calendar Agent LangChain tool workflow nodes.

7. **Configure Billing tool workflow:**
   - Use Stripe Tool nodes for:
     - Customer management (create, update, delete).
     - Charges and discount coupons.
     - Retrieve customer cards.
   - Connect these to Billing Agent LangChain tool workflow nodes.

8. **Set up message sending nodes:**
   - Add WhatsApp nodes for sending messages:
     - "Send First Message" for initial contact.
     - "Reply To User" and "Reply To User1" for responses.
     - "WhatsApp Business Cloud" node for business API messages.
   - Configure with appropriate WhatsApp API credentials.

9. **Add fallback and response handling nodes:**
   - Use **Set** nodes for "Response", "Try Again", "Success", and variants to manage flow control and retry logic.
   - Use **No Operation** nodes to allow branches with no action.

10. **Link all nodes according to the connections:**
    - Ensure outputs flow correctly from input triggers to AI processing, CRM/calendar/billing operations, and finally to message sending nodes.
    - Include error-handling or retry branches where applicable.

11. **Configure credentials:**
    - Set up credentials for:
      - WhatsApp API (including Business Cloud if used)
      - PostgreSQL database access
      - Google API OAuth2 for Calendar
      - Stripe API keys
      - OpenAI or Google Gemini API keys

12. **Test the workflow:**
    - Simulate inbound WhatsApp messages and form submissions.
    - Verify lead lookup, AI response generation, CRM and calendar updates, and message replies.
    - Monitor logs for errors such as API failures or database errors.

---

## 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                   |
|-----------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow uses advanced LangChain agents with Google Gemini and OpenAI models for conversation. | LangChain official docs: https://docs.langchain.com/                                            |
| Uses PostgreSQL for persistent chat memory and CRM data storage.                                    | PostgreSQL: https://www.postgresql.org/                                                         |
| Integrates Stripe for billing and payment management.                                               | Stripe API docs: https://stripe.com/docs/api                                                    |
| Google Calendar integration requires OAuth2 credentials with appropriate scopes.                    | Google Calendar API docs: https://developers.google.com/calendar                                  |
| WhatsApp integration uses both standard and Business Cloud API nodes for messaging.                 | WhatsApp Business API docs: https://developers.facebook.com/docs/whatsapp                        |
| Retrieval-Augmented Generation (RAG) implemented using PGVector vector store for technical and sales knowledge. | PGVector: https://pgvector.com/                                                                  |

---

**Disclaimer:** The text above is exclusively generated from an automated workflow designed with n8n integration automation tools. It strictly adheres to current content policies and contains no illegal, offensive, or protected content. All handled data is publicly available and legal.