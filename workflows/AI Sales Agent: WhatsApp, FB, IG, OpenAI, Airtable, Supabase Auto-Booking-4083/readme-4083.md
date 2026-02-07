AI Sales Agent: WhatsApp, FB, IG, OpenAI, Airtable, Supabase Auto-Booking

https://n8nworkflows.xyz/workflows/ai-sales-agent--whatsapp--fb--ig--openai--airtable--supabase-auto-booking-4083


# AI Sales Agent: WhatsApp, FB, IG, OpenAI, Airtable, Supabase Auto-Booking

### 1. Workflow Overview

This workflow automates AI-driven sales engagement across multiple messaging channels — WhatsApp, Facebook Messenger, Instagram DM, and an n8n chat interface — integrating AI conversational agents with CRM, knowledge base, and calendar services. It supports lead qualification, service information delivery, and consultation booking, leveraging OpenAI for AI interactions, Airtable for CRM data, Supabase for vector search knowledge base, and PostgreSQL for chat memory. The workflow handles different message types (text, audio), manages multi-channel inputs, and routes responses back appropriately.

**Logical Blocks:**

- **1.1 Triggers and Channel-Specific Input Reception:** Captures incoming messages or form submissions from WhatsApp, Facebook, Instagram, n8n Chat, and Airtable Form webhook.

- **1.2 WhatsApp Message Pre-processing:** Lead lookup, message type handling (text/audio/unsupported), transcription for audio.

- **1.3 Facebook Messenger Pre-processing:** Webhook verification, echo filtering, typing indicator, message preparation.

- **1.4 Instagram DM Pre-processing:** Webhook verification, echo filtering, message preparation.

- **1.5 n8n Chat Input Preparation:** Message and session data setup for AI consumption.

- **1.6 Input Aggregation:** Centralizes processed inputs for AI agent consumption.

- **1.7 AI Sales Agent and Tool Integration:** Conversational AI using OpenAI GPT-4o and chat memory; integrates CRM (Airtable), calendar booking, and knowledge base (Supabase vector store) tools.

- **1.8 Response Routing and Delivery:** Routes AI responses back to the original channel (WhatsApp, Facebook, Instagram, n8n Chat).

- **1.9 Airtable Form Submission Handling:** Processes new leads from form submissions, creates contacts, and sends WhatsApp confirmation.

---

### 2. Block-by-Block Analysis

#### 1.1 Triggers and Channel-Specific Input Reception

**Overview:**  
This block receives incoming user messages or form submissions via respective platform webhooks or triggers, initiating the workflow.

**Nodes Involved:**
- WhatsApp (WhatsApp Trigger)
- Facebook Trigger (Webhook)
- Instagram Trigger (Webhook)
- When chat message received (n8n Chat Trigger)
- Airtable Form Submitted (Webhook)

**Node Details:**

- **WhatsApp (WhatsApp Trigger)**
  - Type: Messaging platform trigger for WhatsApp.
  - Config: Listens for incoming WhatsApp messages.
  - Input: Incoming WhatsApp messages.
  - Output: Message object to "Get Lead" node.
  - Failure cases: Connectivity errors, webhook misconfiguration.

- **Facebook Trigger**
  - Type: Webhook node for Facebook Messenger.
  - Config: Receives webhook calls from Facebook.
  - Input: HTTP POST and GET requests.
  - Output: To Respond to Webhook nodes.
  - Failure cases: Invalid webhook tokens, Facebook rate limits.

- **Instagram Trigger**
  - Type: Webhook node for Instagram DM.
  - Config: Receives webhook calls from Instagram.
  - Input: HTTP POST and GET requests.
  - Output: To Respond to Webhook nodes.
  - Failure cases: Webhook verification failure, rate limits.

- **When chat message received**
  - Type: n8n Chat trigger.
  - Config: Listens for messages via n8n’s built-in chat interface.
  - Input: User chat messages.
  - Output: To Edit Fields - chat node.
  - Failure cases: n8n chat server down, session invalid.

- **Airtable Form Submitted**
  - Type: Webhook node.
  - Config: Trigger on form submissions in Airtable.
  - Input: Form submission payload.
  - Output: To Airtable node for record fetch.
  - Failure cases: Airtable webhook misconfiguration, authentication errors.

---

#### 1.2 WhatsApp Message Pre-processing

**Overview:**  
Processes WhatsApp inbound messages by looking up lead info, handling message types (text, audio, unsupported), and preparing data for further AI processing.

**Nodes Involved:**
- Get Lead (Airtable lookup)
- Handle Message Types (Switch)
- Edit Fields - chat1
- WhatsApp Business Cloud (media URL retrieval)
- HTTP Request (download audio)
- OpenAI (Whisper transcription)
- Edit Fields - chat2
- Reply To User1 (unsupported message type notification)

**Node Details:**

- **Get Lead**
  - Type: Airtable node.
  - Role: Lookup lead by WhatsApp sender phone number.
  - Config: Search Contacts table using phone number key.
  - Inputs: WhatsApp trigger output.
  - Outputs: To Handle Message Types.
  - Failure: Airtable API errors, no matching record found (handled with continue).

- **Handle Message Types**
  - Type: Switch node.
  - Role: Routes based on message type (text, audio, unsupported).
  - Config: Checks message type field.
  - Inputs: Get Lead output.
  - Outputs: To "Edit Fields - chat1" (text), "WhatsApp Business Cloud" (audio), or "Reply To User1" (others).
  - Failure: Expression errors if message type missing.

- **Edit Fields - chat1**
  - Type: Set node.
  - Role: Prepares text message input and lead data for AI Agent.
  - Config: Sets fields like message text, lead info, channel metadata.
  - Inputs: Handle Message Types (text path).
  - Outputs: No Operation node.
  - Failure: Expression errors on missing data.

- **WhatsApp Business Cloud**
  - Type: WhatsApp node.
  - Role: Retrieves media URL for audio message.
  - Config: Uses message media ID to fetch URL.
  - Inputs: Handle Message Types (audio path).
  - Outputs: HTTP Request node.
  - Failure: API permission or rate limit errors.

- **HTTP Request**
  - Type: HTTP Request node.
  - Role: Downloads audio file from URL.
  - Config: Method GET, URL from previous node.
  - Inputs: WhatsApp Business Cloud.
  - Outputs: OpenAI transcription node.
  - Failure: Network timeout, invalid URL.

- **OpenAI**
  - Type: OpenAI Whisper transcription node.
  - Role: Transcribes audio to text.
  - Config: Whisper model selected.
  - Inputs: HTTP Request audio file.
  - Outputs: Edit Fields - chat2.
  - Failure: API quota, audio format unsupported.

- **Edit Fields - chat2**
  - Type: Set node.
  - Role: Prepares transcribed text and lead info for AI Agent.
  - Config: Sets fields similar to chat1 but with transcribed text.
  - Inputs: OpenAI transcription.
  - Outputs: No Operation node.
  - Failure: Expression errors.

- **Reply To User1**
  - Type: WhatsApp node.
  - Role: Sends notification for unsupported message types.
  - Config: Predefined template message.
  - Inputs: Handle Message Types unsupported path.
  - Outputs: None.
  - Failure: WhatsApp API errors.

---

#### 1.3 Facebook Messenger Pre-processing

**Overview:**  
Handles Facebook Messenger webhook verification, filters out page echo messages, sends typing indicator, and prepares input for the AI Agent.

**Nodes Involved:**
- Respond to Webhook - facebook get
- Respond to Webhook - facebook post
- If is not echo - facebook
- Sales Agent Demo - typing_on
- Edit Fields - facebook

**Node Details:**

- **Respond to Webhook - facebook get**
  - Type: Respond to Webhook node.
  - Role: Responds to Facebook webhook verification GET requests.
  - Inputs: Facebook Trigger GET requests.
  - Outputs: None.
  - Failure: Incorrect token leads to verification failure.

- **Respond to Webhook - facebook post**
  - Type: Respond to Webhook node.
  - Role: Acknowledges POST messages to Facebook webhook.
  - Inputs: Facebook Trigger POST requests.
  - Outputs: If is not echo - facebook node.
  - Failure: Misconfigured webhook URL.

- **If is not echo - facebook**
  - Type: If node.
  - Role: Filters out messages sent by the Facebook Page itself (echoes).
  - Config: Checks message sender ID vs page ID.
  - Inputs: Respond to Webhook - facebook post.
  - Outputs: Edit Fields - facebook and Sales Agent Demo - typing_on if not echo.
  - Failure: Expression errors if fields missing.

- **Sales Agent Demo - typing_on**
  - Type: Facebook Graph API node.
  - Role: Sends typing on indicator to user.
  - Inputs: If is not echo - facebook.
  - Outputs: None.
  - Failure: API permission errors.

- **Edit Fields - facebook**
  - Type: Set node.
  - Role: Prepares message text, sender ID, and Facebook context for AI Agent.
  - Inputs: If is not echo - facebook.
  - Outputs: No Operation node.
  - Failure: Missing data in expressions.

---

#### 1.4 Instagram DM Pre-processing

**Overview:**  
Handles Instagram webhook verification, filters out messages sent by the business account, and prepares message data for AI Agent processing.

**Nodes Involved:**
- Respond to Webhook - instagram get
- Respond to Webhook - instagram post
- If is not echo - instagram
- Edit Fields - instagram

**Node Details:**

- **Respond to Webhook - instagram get**
  - Type: Respond to Webhook node.
  - Role: Responds to Instagram webhook verification GET requests.
  - Inputs: Instagram Trigger GET requests.
  - Outputs: None.
  - Failure: Verification errors if token mismatched.

- **Respond to Webhook - instagram post**
  - Type: Respond to Webhook node.
  - Role: Acknowledges POST messages to Instagram webhook.
  - Inputs: Instagram Trigger POST requests.
  - Outputs: If is not echo - instagram node.
  - Failure: Webhook misconfiguration.

- **If is not echo - instagram**
  - Type: If node.
  - Role: Filters out messages sent by the business itself.
  - Inputs: Respond to Webhook - instagram post.
  - Outputs: Edit Fields - instagram if not echo.
  - Failure: Expression errors on missing fields.

- **Edit Fields - instagram**
  - Type: Set node.
  - Role: Prepares message text, sender ID, Instagram context for AI Agent.
  - Inputs: If is not echo - instagram.
  - Outputs: No Operation node.
  - Failure: Missing or invalid data.

---

#### 1.5 n8n Chat Input Preparation

**Overview:**  
Prepares user input and session context from n8n internal chat interface for AI processing.

**Nodes Involved:**
- When chat message received
- Edit Fields - chat

**Node Details:**

- **When chat message received**
  - Type: n8n Chat Trigger.
  - Role: Listens for incoming chat messages.
  - Outputs: Edit Fields - chat node.
  - Failure: Chat server offline.

- **Edit Fields - chat**
  - Type: Set node.
  - Role: Sets message text, session ID, and user data for AI Agent.
  - Outputs: No Operation node.
  - Failure: Expression issues if data missing.

---

#### 1.6 Input Aggregation

**Overview:**  
Central node for consolidating preprocessed messages from all channels and passing them to the main AI Agent.

**Nodes Involved:**
- No Operation, do nothing

**Node Details:**

- **No Operation, do nothing**
  - Type: NoOp node.
  - Role: Acts as a funnel/placeholder node.
  - Inputs: Edit Fields - chat1, chat2, facebook, instagram, chat.
  - Outputs: AI Agent.
  - Failure: None expected.

---

#### 1.7 AI Sales Agent and Tool Integration

**Overview:**  
Core conversational AI logic that interacts with users, uses CRM, calendar, and knowledge base tools, and maintains conversation state.

**Nodes Involved:**
- AI Agent (Langchain Agent node)
- Postgres Chat Memory
- sales_technique_knowledge (Supabase Vector Store tool)
- CRM Agent (ToolWorkflow sub-workflow)
- Calendar Agent (ToolWorkflow sub-workflow)
- Embeddings OpenAI
- OpenAI Chat Model (GPT-4o)

**Node Details:**

- **AI Agent**
  - Type: Langchain Agent node.
  - Role: Main conversational AI agent using GPT-4o.
  - Config: Uses Postgres chat memory, integrates tools (knowledge vector store, CRM, calendar).
  - Inputs: No Operation node.
  - Outputs: Switch node (response routing).
  - Failure: OpenAI API errors, memory DB connectivity issues.

- **Postgres Chat Memory**
  - Type: Langchain memory node.
  - Role: Stores conversation history in PostgreSQL.
  - Inputs: AI Agent.
  - Outputs: AI Agent.
  - Failure: DB connection errors.

- **sales_technique_knowledge**
  - Type: Vector Store tool node.
  - Role: Queries Supabase vector store for sales and technical knowledge.
  - Inputs: AI Agent tool input.
  - Outputs: AI Agent.
  - Failure: Supabase API errors, embedding failures.

- **CRM Agent**
  - Type: Langchain ToolWorkflow node.
  - Role: Sub-workflow that manages Airtable contacts, updates opportunity status.
  - Inputs: AI Agent tool input.
  - Outputs: AI Agent.
  - Failure: Airtable API errors.

- **Calendar Agent**
  - Type: Langchain ToolWorkflow node.
  - Role: Sub-workflow to book consultations in calendar after CRM contact creation.
  - Inputs: AI Agent tool input.
  - Outputs: AI Agent.
  - Failure: Calendar API errors.

- **Embeddings OpenAI**
  - Type: Embeddings node.
  - Role: Generates embeddings for vector store queries.
  - Inputs: sales_technique_knowledge node.
  - Outputs: sales_technique_knowledge.
  - Failure: OpenAI quota errors.

- **OpenAI Chat Model**
  - Type: Language model node.
  - Role: GPT-4o chat model for AI Agent.
  - Inputs: AI Agent.
  - Outputs: AI Agent.
  - Failure: API quota, invalid prompt.

---

#### 1.8 Response Routing and Delivery

**Overview:**  
Routes the AI Agent’s textual response to the correct messaging platform node for delivery to the user.

**Nodes Involved:**
- Switch
- Reply To User (WhatsApp)
- Facebook Graph API - Sales Agent Demo
- Instagram Graph API - smb.sales.agent.demo
- Output - chat (n8n chat interface)

**Node Details:**

- **Switch**
  - Type: Switch node.
  - Role: Determines output channel based on metadata.
  - Inputs: AI Agent output.
  - Outputs: One of the four response sender nodes.
  - Failure: Missing routing metadata.

- **Reply To User**
  - Type: WhatsApp node.
  - Role: Sends text response back on WhatsApp.
  - Inputs: Switch node.
  - Failure: WhatsApp API errors.

- **Facebook Graph API - Sales Agent Demo**
  - Type: Facebook Graph API node.
  - Role: Sends text response on Facebook Messenger.
  - Inputs: Switch node.
  - Failure: Facebook API rate limits, permissions.

- **Instagram Graph API - smb.sales.agent.demo**
  - Type: HTTP Request node (Facebook Graph API for Instagram).
  - Role: Sends text response on Instagram DM.
  - Inputs: Switch node.
  - Failure: Instagram API errors.

- **Output - chat**
  - Type: Set node.
  - Role: Formats and outputs text to n8n chat interface.
  - Inputs: Switch node.
  - Failure: Chat interface offline.

---

#### 1.9 Airtable Form Submission Handling

**Overview:**  
Handles new lead data submitted via Airtable form, creates contact record, prepares notification message, and sends WhatsApp confirmation.

**Nodes Involved:**
- Airtable Form Submitted (Webhook)
- Airtable (Fetch full record)
- Create Contact (Airtable create record)
- Edit Fields - form
- WhatsApp Business Cloud2 (send confirmation message)

**Node Details:**

- **Airtable Form Submitted**
  - Type: Webhook node.
  - Role: Triggered by Airtable form submissions.
  - Outputs: Airtable node.
  - Failure: Webhook misconfiguration.

- **Airtable**
  - Type: Airtable node.
  - Role: Fetches full lead record using record ID.
  - Inputs: Airtable Form Submitted.
  - Outputs: Create Contact.
  - Failure: API errors, missing record.

- **Create Contact**
  - Type: Airtable node.
  - Role: Creates new contact in Contacts table.
  - Inputs: Airtable node.
  - Outputs: Edit Fields - form.
  - Failure: API permission errors.

- **Edit Fields - form**
  - Type: Set node.
  - Role: Prepares templated WhatsApp confirmation message.
  - Inputs: Create Contact.
  - Outputs: WhatsApp Business Cloud2.
  - Failure: Expression errors.

- **WhatsApp Business Cloud2**
  - Type: WhatsApp node.
  - Role: Sends confirmation message to lead.
  - Inputs: Edit Fields - form.
  - Failure: WhatsApp API errors.

---

### 3. Summary Table

| Node Name                      | Node Type                           | Functional Role                                      | Input Node(s)                  | Output Node(s)                          | Sticky Note                       |
|-------------------------------|-----------------------------------|----------------------------------------------------|-------------------------------|---------------------------------------|----------------------------------|
| WhatsApp                      | WhatsApp Trigger                  | Receives incoming WhatsApp messages                 | -                             | Get Lead                              |                                  |
| Get Lead                      | Airtable                         | Looks up lead by phone number                        | WhatsApp                      | Handle Message Types                  |                                  |
| Handle Message Types          | Switch                          | Routes based on WhatsApp message type                | Get Lead                     | Edit Fields - chat1, WhatsApp Business Cloud, Reply To User1 |                                  |
| Edit Fields - chat1           | Set                             | Prepares WhatsApp text message + lead data           | Handle Message Types (text)    | No Operation                        |                                  |
| WhatsApp Business Cloud       | WhatsApp                        | Retrieves media URL for audio messages                | Handle Message Types (audio)   | HTTP Request                        |                                  |
| HTTP Request                 | HTTP Request                   | Downloads audio file                                  | WhatsApp Business Cloud       | OpenAI                              |                                  |
| OpenAI                       | OpenAI (Whisper)                | Transcribes audio to text                             | HTTP Request                  | Edit Fields - chat2                 |                                  |
| Edit Fields - chat2           | Set                             | Prepares transcribed audio text + lead data          | OpenAI                       | No Operation                       |                                  |
| Reply To User1                | WhatsApp                        | Sends unsupported message type notification          | Handle Message Types (others)  | -                                  |                                  |
| Facebook Trigger             | Webhook                        | Receives Facebook webhook calls                       | -                             | Respond to Webhook facebook get/post |                                  |
| Respond to Webhook - facebook get | Respond to Webhook             | Verifies Facebook webhook                             | Facebook Trigger (GET)         | -                                  |                                  |
| Respond to Webhook - facebook post | Respond to Webhook             | Acknowledges Facebook webhook POST                    | Facebook Trigger (POST)        | If is not echo - facebook           |                                  |
| If is not echo - facebook     | If                             | Filters out page echo messages                         | Respond to Webhook facebook post | Edit Fields - facebook, Sales Agent Demo - typing_on |                                  |
| Sales Agent Demo - typing_on  | Facebook Graph API              | Sends typing indicator                                | If is not echo - facebook      | -                                  |                                  |
| Edit Fields - facebook        | Set                             | Prepares Facebook message data                         | If is not echo - facebook      | No Operation                       |                                  |
| Instagram Trigger            | Webhook                        | Receives Instagram webhook calls                      | -                             | Respond to Webhook instagram get/post |                                  |
| Respond to Webhook - instagram get | Respond to Webhook             | Verifies Instagram webhook                            | Instagram Trigger (GET)        | -                                  |                                  |
| Respond to Webhook - instagram post | Respond to Webhook             | Acknowledges Instagram webhook POST                   | Instagram Trigger (POST)       | If is not echo - instagram          |                                  |
| If is not echo - instagram    | If                             | Filters out business account messages                 | Respond to Webhook instagram post | Edit Fields - instagram          |                                  |
| Edit Fields - instagram       | Set                             | Prepares Instagram message data                        | If is not echo - instagram     | No Operation                      |                                  |
| When chat message received    | n8n Chat Trigger               | Receives messages from n8n chat interface              | -                             | Edit Fields - chat                 |                                  |
| Edit Fields - chat            | Set                             | Prepares n8n chat message and session info            | When chat message received     | No Operation                      |                                  |
| No Operation, do nothing      | NoOp                           | Aggregates all channel inputs for AI Agent            | Edit Fields - chat1, chat2, facebook, instagram, chat | AI Agent                         |                                  |
| AI Agent                     | Langchain Agent                | Main AI conversational agent with memory and tools   | No Operation                  | Switch                           |                                  |
| Postgres Chat Memory          | Langchain Memory              | Manages conversation history in PostgreSQL            | AI Agent                     | AI Agent                        |                                  |
| sales_technique_knowledge     | Vector Store Tool             | Queries sales & technical knowledge via Supabase      | AI Agent tool                | AI Agent                        |                                  |
| CRM Agent                    | ToolWorkflow (Sub-workflow)    | Manages Airtable contacts and opportunities           | AI Agent tool                | AI Agent                        |                                  |
| Calendar Agent               | ToolWorkflow (Sub-workflow)    | Manages consultation booking                           | AI Agent tool                | AI Agent                        |                                  |
| Embeddings OpenAI            | Langchain Embeddings          | Generates embeddings for vector store queries         | sales_technique_knowledge    | sales_technique_knowledge      |                                  |
| OpenAI Chat Model            | Langchain LM Chat Model       | GPT-4o model for AI Agent                               | AI Agent                     | AI Agent                        |                                  |
| Switch                      | Switch                        | Routes AI response to correct output channel           | AI Agent                     | Reply To User, Facebook Graph API - Sales Agent Demo, Instagram Graph API - smb.sales.agent.demo, Output - chat |                                  |
| Reply To User               | WhatsApp                      | Sends AI response on WhatsApp                            | Switch                      | -                              |                                  |
| Facebook Graph API - Sales Agent Demo | Facebook Graph API          | Sends AI response on Facebook Messenger                 | Switch                      | -                              |                                  |
| Instagram Graph API - smb.sales.agent.demo | HTTP Request                | Sends AI response on Instagram DM                        | Switch                      | -                              |                                  |
| Output - chat               | Set                           | Sends AI response on n8n chat interface                  | Switch                      | -                              |                                  |
| Airtable Form Submitted    | Webhook                        | Trigger for new Airtable form submissions               | -                             | Airtable                        |                                  |
| Airtable                   | Airtable                      | Fetches full Airtable record for form submission        | Airtable Form Submitted       | Create Contact                 |                                  |
| Create Contact             | Airtable                      | Creates new contact record in Airtable                   | Airtable                     | Edit Fields - form             |                                  |
| Edit Fields - form         | Set                           | Prepares WhatsApp confirmation message                   | Create Contact               | WhatsApp Business Cloud2       |                                  |
| WhatsApp Business Cloud2   | WhatsApp                      | Sends WhatsApp confirmation message                      | Edit Fields - form           | -                              |                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Trigger Nodes:**

   - Create a **WhatsApp Trigger** node configured to receive messages from your WhatsApp Business Cloud account.
   - Create a **Webhook** node for **Facebook Trigger**, set URL and verify token per Facebook Messenger webhook requirements.
   - Create a **Webhook** node for **Instagram Trigger**, configure for Instagram DM webhook verification.
   - Create a **Chat Trigger** node for **When chat message received** for the n8n chat interface.
   - Create a **Webhook** node for **Airtable Form Submitted**, configure with Airtable form webhook URL.

2. **WhatsApp Message Pre-processing:**

   - Add an **Airtable** node named **Get Lead** to lookup contacts by incoming WhatsApp sender phone number.
     - Use Airtable credentials.
     - Configure to search Contacts table with phone number filter.
   - Connect WhatsApp Trigger → Get Lead.
   - Add a **Switch** node **Handle Message Types** to check message type (`text`, `audio`, or others).
   - Connect Get Lead → Handle Message Types.
   - For **text** path:
     - Add a **Set** node **Edit Fields - chat1** to prepare message text, lead info, and channel metadata.
     - Connect Handle Message Types (text) → Edit Fields - chat1.
   - For **audio** path:
     - Add a **WhatsApp** node **WhatsApp Business Cloud** to get media URL.
     - Connect Handle Message Types (audio) → WhatsApp Business Cloud.
     - Add an **HTTP Request** node configured to GET the media URL.
     - Connect WhatsApp Business Cloud → HTTP Request.
     - Add an **OpenAI** node configured with Whisper model for audio transcription.
     - Connect HTTP Request → OpenAI.
     - Add a **Set** node **Edit Fields - chat2** to prepare transcribed text and lead info.
     - Connect OpenAI → Edit Fields - chat2.
   - For unsupported message types:
     - Add a **WhatsApp** node **Reply To User1** with a template message notifying unsupported type.
     - Connect Handle Message Types (others) → Reply To User1.

3. **Facebook Messenger Pre-processing:**

   - Connect **Facebook Trigger** node to two **Respond to Webhook** nodes (one for GET verification, one for POST acknowledgment).
   - Connect Respond to Webhook POST → **If is not echo - facebook** (If node checking sender != page).
   - Connect true branch to:
     - **Edit Fields - facebook** (Set node) to prepare message text and metadata.
     - **Sales Agent Demo - typing_on** (Facebook Graph API node) to send typing indicator.

4. **Instagram DM Pre-processing:**

   - Connect **Instagram Trigger** node to **Respond to Webhook - instagram get** and **Respond to Webhook - instagram post** nodes.
   - Connect Respond to Webhook POST → **If is not echo - instagram** (If node filtering business messages).
   - Connect true branch → **Edit Fields - instagram** (Set node) to prepare message data.

5. **n8n Chat Input Preparation:**

   - Connect **When chat message received** → **Edit Fields - chat** (Set node) to prepare chat message and session context.

6. **Input Aggregation:**

   - Connect outputs of:
     - Edit Fields - chat1
     - Edit Fields - chat2
     - Edit Fields - facebook
     - Edit Fields - instagram
     - Edit Fields - chat
   - All connect to a **No Operation, do nothing** node to funnel inputs.

7. **AI Sales Agent Setup:**

   - Create **Postgres Chat Memory** node configured with your PostgreSQL DB to store conversation history.
   - Create **Embeddings OpenAI** node for vector embeddings.
   - Create **Demo Supabase** vector store node connected to your Supabase vector DB.
   - Create **OpenAI Chat Model** node configured with GPT-4o.
   - Create **sales_technique_knowledge** tool node (Vector Store Tool) connected to Embeddings and Demo Supabase nodes.
   - Create **CRM Agent** and **Calendar Agent** ToolWorkflow nodes; configure sub-workflows to manage Airtable CRM and calendar booking.
   - Create **AI Agent** (Langchain Agent node):
     - Configure to use Postgres Chat Memory.
     - Attach tools: sales_technique_knowledge, CRM Agent, Calendar Agent.
     - Use OpenAI Chat Model as language model.
   - Connect No Operation node → AI Agent.

8. **Response Routing and Delivery:**

   - Add a **Switch** node to examine output metadata for channel.
   - Create:
     - **Reply To User** WhatsApp node.
     - **Facebook Graph API - Sales Agent Demo** node.
     - **Instagram Graph API - smb.sales.agent.demo** HTTP Request node.
     - **Output - chat** Set node for n8n chat.
   - Connect AI Agent → Switch.
   - Connect Switch outputs to respective response nodes.

9. **Airtable Form Submission Handling:**

   - Connect **Airtable Form Submitted** webhook → **Airtable** node to fetch full record.
   - Connect Airtable → **Create Contact** Airtable node to insert new contact.
   - Connect Create Contact → **Edit Fields - form** Set node to prepare WhatsApp confirmation message.
   - Connect Edit Fields - form → **WhatsApp Business Cloud2** node to send confirmation message.

10. **Credentials Setup:**

    - Configure Airtable credentials with API key and base ID.
    - Configure WhatsApp Business Cloud credentials with access token.
    - Configure Facebook Graph API credentials.
    - Configure OpenAI credentials with API key.
    - Configure PostgreSQL credentials for chat memory.
    - Configure Supabase credentials for vector store.

11. **Testing and Validation:**

    - Test each channel trigger independently.
    - Verify lead lookup and message handling.
    - Validate AI Agent responses and tool integrations.
    - Confirm response delivery on all platforms.
    - Test Airtable form submission and WhatsApp confirmation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                    | Context or Link                                                                                      |
|-------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| The workflow uses Langchain community nodes in n8n for AI agent orchestration, enabling advanced tool integration and memory management.       | n8n Langchain nodes documentation                                                                   |
| OpenAI GPT-4o model is used for main AI sales agent logic; Whisper model used for audio transcription.                                           | https://platform.openai.com/docs/models/whisper                                                     |
| The knowledge base vector store is implemented with Supabase; embeddings generated via OpenAI Embeddings API.                                  | https://supabase.com/docs/guides/vector-search                                                     |
| CRM and calendar operations are modularized into sub-workflows (CRM Agent and Calendar Agent) for maintainability and reuse.                   | Sub-workflows managed inside n8n                                                                     |
| Facebook and Instagram webhooks require proper verification tokens and permission scopes for message reading and sending.                       | Facebook Developer documentation                                                                    |
| WhatsApp Business Cloud requires media permissions and API credentials for audio download and message sending.                                  | https://developers.facebook.com/docs/whatsapp/business-api/                                        |
| PostgreSQL is used for chat memory, enabling context retention across conversations. Ensure database access is stable and credentials secure.    | PostgreSQL official documentation                                                                   |
| This workflow is designed for self-hosted n8n environments to ensure control over sensitive keys and data flow.                                | https://docs.n8n.io/self-hosted/                                                                    |

---

**Disclaimer:** The provided text and workflow description are exclusively derived from an automated workflow built with n8n, adhering strictly to current content policies and legal considerations. All data processed is legal and publicly accessible.