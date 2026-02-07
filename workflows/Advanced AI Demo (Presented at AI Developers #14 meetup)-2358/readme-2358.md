Advanced AI Demo (Presented at AI Developers #14 meetup)

https://n8nworkflows.xyz/workflows/advanced-ai-demo--presented-at-ai-developers--14-meetup--2358


# Advanced AI Demo (Presented at AI Developers #14 meetup)

### 1. Workflow Overview

This workflow, titled **Advanced AI Demo (Presented at AI Developers #14 meetup)**, demonstrates advanced AI automation capabilities using n8n. It was presented at the AI Developers meetup in San Francisco on July 24, 2024. The workflow showcases three main AI-driven use cases:

- **1.1 Categorize Incoming Gmail Emails with AI:** Automatically classify incoming emails into categories (e.g., automation, music) using an AI text classifier, then apply custom Gmail labels accordingly.
- **1.2 Retrieval-Augmented Generation (RAG) with PDF Source:** Ingest a PDF document (e.g., BTC Whitepaper) into a Pinecone vector store using text embeddings, then enable chat interactions querying this indexed knowledge.
- **1.3 AI Agent for Google Calendar Appointment Booking:** An AI assistant that uses HTTP requests and Google Calendar API to check calendar availability and book 30-minute appointments.

The logical blocks correspond directly to these three examples and their supporting nodes:

- **Block 1: Email Categorization and Labeling**
- **Block 2: PDF Ingestion and Chat with Vector Store**
- **Block 3: AI Agent for Appointment Scheduling with Google Calendar**

Additionally, the workflow includes several sticky notes for presentation and documentation purposes.

---

### 2. Block-by-Block Analysis

#### Block 1: Email Categorization and Labeling

##### Overview
This block automates Gmail email categorization using AI and applies corresponding Gmail labels based on the classification results.

##### Nodes Involved
- Webhook
- Whether email contains n8n (If node)
- Execute JavaScript
- Send message (Slack)
- On new email to Nathan's inbox (Gmail Trigger, disabled)
- Assign label with AI (Text Classifier)
- Add automation label (Gmail)
- Add music label (Gmail)

##### Node Details

- **Webhook**
  - *Type:* Webhook (Entry point)
  - *Role:* Receives external requests with email query data.
  - *Config:* Path set to a unique webhook ID; public access enabled.
  - *Input:* External HTTP requests containing email data.
  - *Output:* Passes data to the "Whether email contains n8n" node.
  - *Failures:* Missing or malformed webhook requests.

- **Whether email contains n8n (If)**
  - *Type:* If node
  - *Role:* Checks if the incoming email address contains the substring "@n8n".
  - *Config:* Case-sensitive string contains condition on `{{$json.query.email}}`.
  - *Input:* Webhook output.
  - *Output:* On true, proceeds to Execute JavaScript and Send message.
  - *Failures:* Expression evaluation errors if `query.email` is missing.

- **Execute JavaScript**
  - *Type:* Code node
  - *Role:* Adds a new field `myNewField` with value `1` to all incoming items.
  - *Config:* Simple loop modifying JSON data.
  - *Input:* Output from If node.
  - *Output:* Modified JSON to Slack node.
  - *Failures:* Script runtime errors unlikely due to simple logic.

- **Send message (Slack)**
  - *Type:* Slack node
  - *Role:* Sends a message to a Slack channel with email data from webhook.
  - *Config:* OAuth2 authentication; channel ID set to "general".
  - *Input:* Modified JSON from Execute JavaScript.
  - *Output:* None (terminal).
  - *Failures:* Slack API errors, auth failures, channel permission issues.

- **On new email to Nathan's inbox (Gmail Trigger)**
  - *Type:* Gmail Trigger (Disabled)
  - *Role:* Listens for new emails in Nathan's Gmail inbox.
  - *Config:* Polls every minute, no filters.
  - *Input:* N/A (trigger).
  - *Output:* Feeds into Assign label with AI.
  - *Failures:* Gmail connection/auth issues if enabled.

- **Assign label with AI (Text Classifier)**
  - *Type:* AI Text Classifier node
  - *Role:* Classifies email text into categories ("automation" or "music").
  - *Config:* Input text from email body (`$json.text`); two categories with descriptions defined.
  - *Input:* Trigger or manual invocation.
  - *Output:* Routes to Add automation label or Add music label nodes.
  - *Failures:* AI model errors, API quota issues.

- **Add automation label (Gmail)**
  - *Type:* Gmail node
  - *Role:* Applies Gmail label "automation" to message ID.
  - *Config:* Label ID specific to automation label; message ID from `$json.id`.
  - *Input:* From Assign label with AI.
  - *Output:* None (terminal).
  - *Failures:* Gmail API errors, incorrect label ID.

- **Add music label (Gmail)**
  - *Type:* Gmail node
  - *Role:* Applies Gmail label "music" to message ID.
  - *Config:* Label ID specific to music label; message ID from `$json.id`.
  - *Input:* From Assign label with AI.
  - *Output:* None (terminal).
  - *Failures:* Gmail API errors, incorrect label ID.

---

#### Block 2: PDF Ingestion and Chat with Vector Store (RAG Example)

##### Overview
This block downloads a PDF document, splits its text into chunks, generates embeddings, stores them in Pinecone vector store, and allows chat-based querying of the document via GPT-4o.

##### Nodes Involved
- PDFs to download (NoOp)
- Download PDF (HTTP Request)
- Recursive Character Text Splitter
- Default Data Loader
- Embeddings OpenAI (first instance)
- Insert into Pinecone vector store
- Embeddings OpenAI2
- Read Pinecone Vector Store
- Vector Store Retriever
- Question and Answer Chain
- OpenAI Chat Model
- When chat message received

##### Node Details

- **PDFs to download (NoOp)**
  - *Type:* NoOp
  - *Role:* Holds metadata for BTC Whitepaper (title, author, year, file URL).
  - *Config:* Metadata stored in JSON for downstream use.
  - *Input:* None.
  - *Output:* Triggers Download PDF.
  - *Failures:* N/A (no processing).

- **Download PDF (HTTP Request)**
  - *Type:* HTTP Request
  - *Role:* Downloads the PDF binary from URL in JSON field `file_url`.
  - *Config:* URL dynamically set from incoming JSON.
  - *Input:* From PDFs to download.
  - *Output:* PDF binary data to Insert into Pinecone.
  - *Failures:* HTTP errors, URL invalid, download timeouts.

- **Recursive Character Text Splitter**
  - *Type:* Text Splitter
  - *Role:* Splits PDF text into chunks of 3000 characters with 200 character overlap.
  - *Input:* Text content from PDF.
  - *Output:* Chunks for embedding generation.
  - *Failures:* Malformed text, empty input.

- **Default Data Loader**
  - *Type:* Document Loader
  - *Role:* Loads PDF binary with metadata (title, author, year) for embedding.
  - *Config:* Uses PDF loader with metadata captured from PDFs to download node.
  - *Input:* Output from text splitter.
  - *Output:* Documents for embedding.
  - *Failures:* Loader errors, metadata missing.

- **Embeddings OpenAI (first)**
  - *Type:* Embeddings generator
  - *Role:* Creates text embeddings from document chunks using OpenAI embeddings.
  - *Input:* Documents from Default Data Loader.
  - *Output:* Embeddings for vector store insertion.
  - *Failures:* OpenAI API errors, quota limits.

- **Insert into Pinecone vector store**
  - *Type:* Pinecone Vector Store
  - *Role:* Inserts embeddings into Pinecone index "whitepapers", clearing namespace first.
  - *Config:* Clears namespace "whitepaper" before insert.
  - *Input:* Embeddings from OpenAI Embeddings node.
  - *Output:* Confirmation of insertion.
  - *Failures:* Pinecone API errors, network issues.

- **Embeddings OpenAI2**
  - *Type:* Embeddings generator (second instance)
  - *Role:* Generates embeddings from query text for retrieval.
  - *Input:* Chat input text.
  - *Output:* Embedding vectors for retrieval.
  - *Failures:* OpenAI API errors.

- **Read Pinecone Vector Store**
  - *Type:* Pinecone Vector Store
  - *Role:* Reads from Pinecone index "whitepapers" in namespace "whitepaper".
  - *Config:* Uses namespace "whitepaper".
  - *Input:* Embeddings from Embeddings OpenAI2.
  - *Output:* Retrieved relevant vectors.
  - *Failures:* Pinecone read failures.

- **Vector Store Retriever**
  - *Type:* Retriever node
  - *Role:* Retrieves relevant documents based on embeddings from Pinecone.
  - *Input:* Vector store read output.
  - *Output:* Documents passed to QA chain.
  - *Failures:* Retrieval errors.

- **Question and Answer Chain**
  - *Type:* Retrieval QA chain (LangChain)
  - *Role:* Answers user queries using only vector store knowledge with GPT-4o.
  - *Config:* Prompt instructs to use only vector store content and no hallucination.
  - *Input:* Chat input text and retrieved documents.
  - *Output:* Generated answer.
  - *Failures:* Language model errors, prompt failures.

- **OpenAI Chat Model**
  - *Type:* Language model (GPT-4o)
  - *Role:* Provides chat completions for QA chain.
  - *Config:* Temperature set to 0.3 for controlled responses.
  - *Input:* Query and context.
  - *Output:* Answers.
  - *Failures:* OpenAI API errors.

- **When chat message received**
  - *Type:* Chat Trigger node
  - *Role:* Public webhook for chat interaction with the RAG system.
  - *Config:* Initial greeting message prompting user for input.
  - *Input:* User chat messages.
  - *Output:* Triggers Question and Answer Chain.
  - *Failures:* Webhook access issues, malformed chat messages.

---

#### Block 3: AI Agent for Appointment Scheduling with Google Calendar

##### Overview
An AI assistant that manages appointment bookings with Max Tkacz by checking Google Calendar availability and booking slots using Google Calendar API via HTTP requests.

##### Nodes Involved
- When chat message received (Chat Trigger)
- Appointment booking agent (LangChain Agent)
- Window Buffer Memory
- Anthropic Chat Model
- Get calendar availability (HTTP Request tool)
- Book appointment (HTTP Request tool)
- Sticky Note1 (with Open Calendar link)

##### Node Details

- **When chat message received**
  - *Type:* Chat Trigger
  - *Role:* Entry webhook for appointment booking chat.
  - *Config:* Public, with initial prompt guiding user to select appointment day.
  - *Input:* User chat messages.
  - *Output:* Connected to Question and Answer Chain (in this example, triggers appointment agent).
  - *Failures:* Webhook issues.

- **Appointment booking agent (LangChain Agent)**
  - *Type:* AI Agent node
  - *Role:* Conversational AI assistant handling scheduling logic.
  - *Config:* System message defines assistant behavior:
    - Efficient and courteous.
    - Knows "Max" is the meeting target.
    - Uses tools to check and book calendar.
    - Appointments always 30 minutes.
    - Provides error feedback if tools fail.
  - *Input:* Chat messages, memory buffer, tool results.
  - *Output:* Responses with booking confirmations or guidance.
  - *Failures:* Agent model errors, tool failures.

- **Window Buffer Memory**
  - *Type:* Memory Buffer
  - *Role:* Retains last 10 conversational exchanges for context.
  - *Input:* Chat and agent messages.
  - *Output:* Context to Appointment booking agent.
  - *Failures:* Memory overflow unlikely; possible data truncation.

- **Anthropic Chat Model**
  - *Type:* Language Model (Anthropic)
  - *Role:* Provides assistant's conversational responses.
  - *Config:* Temperature 0.4 for balanced creativity.
  - *Input:* From agent node.
  - *Output:* Agent responses.
  - *Failures:* API errors.

- **Get calendar availability (HTTP Request tool)**
  - *Type:* HTTP Request (Google Calendar freeBusy API)
  - *Role:* Queries Max's calendar for free/busy slots.
  - *Config:* POST request with JSON body including dynamic `{timeMin}` and `{timeMax}` placeholders.
  - *Authentication:* Google Calendar OAuth2 API credential.
  - *Input:* Agent parameters for requested date/time window.
  - *Output:* Availability data indicating free or busy.
  - *Failures:* API errors, auth failures, invalid date range.

- **Book appointment (HTTP Request tool)**
  - *Type:* HTTP Request (Google Calendar API)
  - *Role:* Creates a calendar event for the appointment.
  - *Config:* POST with JSON body including:
    - Summary with user name
    - Start and end dateTime in Europe/Berlin timezone
    - Attendees: Max and user email
  - *Authentication:* Google Calendar OAuth2 API credential.
  - *Input:* Parameters from agent (userName, startTime, endTime, userEmail).
  - *Output:* Event confirmation.
  - *Failures:* API errors, time slot conflicts, auth issues.

- **Sticky Note1**
  - *Role:* Provides a clickable link to Max's Google Calendar for user reference.
  - *Content:* Image and link to calendar UI.
  - *Context:* Presentation aid.

---

### 3. Summary Table

| Node Name                     | Node Type                                | Functional Role                           | Input Node(s)                     | Output Node(s)                                   | Sticky Note                                                                                   |
|-------------------------------|-----------------------------------------|-----------------------------------------|----------------------------------|-------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Webhook                       | Webhook                                 | Entry point for email webhook data      | None                             | Whether email contains n8n                       |                                                                                               |
| Whether email contains n8n    | If                                      | Checks for "@n8n" substring in email    | Webhook                         | Execute JavaScript, Send message                  |                                                                                               |
| Execute JavaScript            | Code                                    | Adds field to JSON                       | Whether email contains n8n       | Send message                                     |                                                                                               |
| Send message                 | Slack                                   | Sends Slack notification                 | Execute JavaScript               | None                                            |                                                                                               |
| On new email to Nathan's inbox| Gmail Trigger (disabled)                 | Trigger on new Gmail email               | None                             | Assign label with AI                             |                                                                                               |
| Assign label with AI         | Text Classifier (AI)                     | Classifies emails into categories       | On new email, OpenAI Chat Model1 | Add automation label, Add music label            |                                                                                               |
| Add automation label         | Gmail                                   | Applies "automation" label               | Assign label with AI             | None                                            |                                                                                               |
| Add music label              | Gmail                                   | Applies "music" label                    | Assign label with AI             | None                                            |                                                                                               |
| PDFs to download             | NoOp                                    | Holds PDF metadata                      | None                             | Download PDF                                    | BTC Whitepaper + metadata                                                                     |
| Download PDF                 | HTTP Request                            | Downloads PDF binary                     | PDFs to download                | Insert into Pinecone vector store                |                                                                                               |
| Recursive Character Text Splitter | Text Splitter                      | Splits text into chunks                  | Default Data Loader or PDF content | Default Data Loader                              |                                                                                               |
| Default Data Loader          | Document Loader                         | Loads PDF binary with metadata          | Recursive Character Text Splitter | Embeddings OpenAI                               |                                                                                               |
| Embeddings OpenAI            | Embeddings Generator (OpenAI)           | Generates text embeddings                | Default Data Loader             | Insert into Pinecone vector store                |                                                                                               |
| Insert into Pinecone vector store | Pinecone Vector Store               | Inserts embeddings into Pinecone index  | Download PDF, Embeddings OpenAI | None                                            |                                                                                               |
| Embeddings OpenAI2           | Embeddings Generator (OpenAI)           | Embeds user query text                   | When chat message received      | Read Pinecone Vector Store                       |                                                                                               |
| Read Pinecone Vector Store   | Pinecone Vector Store                    | Reads vectors from Pinecone              | Embeddings OpenAI2              | Vector Store Retriever                           |                                                                                               |
| Vector Store Retriever       | Retriever                               | Retrieves relevant documents             | Read Pinecone Vector Store      | Question and Answer Chain                        |                                                                                               |
| Question and Answer Chain    | Retrieval QA Chain (LangChain)           | Answers questions using vector store    | When chat message received, Vector Store Retriever | OpenAI Chat Model                          |                                                                                               |
| OpenAI Chat Model            | Language Model (OpenAI GPT-4o)           | Generates answers                       | Question and Answer Chain       | Assign label with AI (emails), Question and Answer Chain |                                                                                               |
| When chat message received   | Chat Trigger                            | Entry for chat interactions              | None                           | Question and Answer Chain                        |                                                                                               |
| Anthropic Chat Model         | Language Model (Anthropic)                | Chat responses for appointment agent    | Appointment booking agent       | Appointment booking agent                        |                                                                                               |
| Appointment booking agent    | AI Agent                                | Manages appointment scheduling           | Anthropic Chat Model, Window Buffer Memory, Get calendar availability, Book appointment | Book appointment                            |                                                                                               |
| Window Buffer Memory         | Memory Buffer                           | Maintains conversational context         | Anthropic Chat Model            | Appointment booking agent                        |                                                                                               |
| Get calendar availability    | HTTP Request (Google Calendar freeBusy)  | Checks calendar availability             | Appointment booking agent       | Appointment booking agent                        |                                                                                               |
| Book appointment            | HTTP Request (Google Calendar events)    | Books appointment on calendar            | Appointment booking agent       | None                                            |                                                                                               |
| Sticky Note                  | Sticky Note                            | Presentation note                        | None                          | None                                            | "# What is n8n?\n### Low-code Automation Platform for technical teams"                        |
| Sticky Note1                 | Sticky Note                            | Link to Google Calendar                   | None                          | None                                            | ![h](https://i.imghippo.com/files/d9Bgv1721858679.png#full-width) [Open Calendar](https://calendar.google.com/calendar/u/0/r/day/2024/7/26) |
| Sticky Note2                 | Sticky Note                            | Presentation slide                        | None                          | None                                            | ![h](https://i.postimg.cc/9XLvL5dL/slide-sf-talk.png#full-width)                             |
| Sticky Note3                 | Sticky Note                            | Label for RAG example                     | None                          | None                                            | "# Example #2\n### RAG with PDF as source"                                                   |
| Sticky Note4                 | Sticky Note                            | Explains PDF ingestion step               | None                          | None                                            | "## A. Load PDF into Pinecone\nDownload the PDF, then text embeddings into Pincecone"        |
| Sticky Note5                 | Sticky Note                            | Explains chat with PDF step               | None                          | None                                            | "## B. Chat with PDF\nUse GPT4o to chat with Pinecone index"                                |
| Sticky Note6                 | Sticky Note                            | Notes on AI Assistant example             | None                          | None                                            | "# Example #3\n### AI Assistant that knows how to use predefined API endpoints "              |
| Sticky Note7                 | Sticky Note                            | Label for email categorization example    | None                          | None                                            | "# Example #1\n### Categorize incoming emails with AI"                                      |
| Sticky Note8                 | Sticky Note                            | BTC Whitepaper references                 | None                          | None                                            | ![h](https://i.postimg.cc/kXW9XrZt/Screenshot-2024-07-24-at-15-18-27.png#full-width)        |
| Sticky Note9                 | Sticky Note                            | Contact & demo exploration                 | None                          | None                                            | "### Connect with me or explore this demo 👇\n![QR](https://i.postimg.cc/VNkdCLQh/frame.png#full-width)" |
| Sticky Note10                | Sticky Note                            | Closing thank you note                     | None                          | None                                            | "# Thank you and happy flowgramming 🤘\n\n### Max Tkacz | Senior Developer Advocate @ n8n"    |
| Sticky Note11                | Sticky Note                            | Link to AI workflow templates              | None                          | None                                            | "### Explore 100+ AI Workflow templates on n8n.io\n[Open Templates Library](https://n8n.io/workflows)" |
| Sticky Note12                | Sticky Note                            | Link to n8n community                       | None                          | None                                            | "### Ask a question in our community (13k+ members)\n[Explore n8n community](https://community.n8n.io/)" |

---

### 4. Reproducing the Workflow from Scratch

#### Block 1: Email Categorization and Labeling

1. **Create a Webhook node**
   - Set path to a unique identifier (e.g., `74facfd7-0f51-4605-9724-2c300594fcf9`).
   - Publicly accessible.
2. **Add an If node ("Whether email contains n8n")**
   - Condition: Check if `{{$json.query.email}}` contains substring `@n8n` (case sensitive).
   - Connect Webhook → If node.
3. **Add a Code node ("Execute JavaScript")**
   - JavaScript: Loop over input items adding `myNewField: 1`.
   - Connect If node’s true output → Execute JavaScript.
4. **Add a Slack node ("Send message")**
   - OAuth2 authentication configured.
   - Channel set to "general".
   - Message text: `Data from webhook:  {{ $json.query.email }}`.
   - Connect Execute JavaScript → Slack node.
5. **Add a Gmail Trigger node ("On new email to Nathan's inbox") [Optional]**
   - Configure Gmail OAuth2 credential.
   - Poll every minute.
   - (Disabled in demo).
6. **Add a Text Classifier node ("Assign label with AI")**
   - Input text: `{{$json.text}}`.
   - Categories:
     - "automation": emails about workflows, automation.
     - "music": emails on music/artists.
   - Connect Gmail Trigger → Text Classifier.
   - Also connect OpenAI Chat Model node output (see below) → Text Classifier.
7. **Add Gmail nodes to add labels**
   - "Add automation label": set label ID for automation label.
   - "Add music label": set label ID for music label.
   - Use message ID from `{{$json.id}}`.
   - Connect Assign label with AI node outputs to respective Gmail nodes.

---

#### Block 2: PDF Ingestion and Chat with Vector Store

1. **Create a NoOp node ("PDFs to download")**
   - Store metadata: `whitepaper_title`, `publish_year`, `author`, `file_url`.
2. **Create an HTTP Request node ("Download PDF")**
   - URL: `{{$json.file_url}}`.
   - Method: GET.
   - Connect PDFs to download → Download PDF.
3. **Add a Recursive Character Text Splitter node**
   - Chunk size: 3000 characters.
   - Chunk overlap: 200 characters.
4. **Add a Default Data Loader node**
   - Loader: PDF Loader.
   - Metadata: map from PDFs to download node fields.
   - Connect Recursive Character Text Splitter → Default Data Loader.
5. **Add Embeddings OpenAI node**
   - Uses OpenAI credentials.
   - Connect Default Data Loader → Embeddings OpenAI.
6. **Add Pinecone vector store node ("Insert into Pinecone vector store")**
   - Mode: Insert.
   - Clear namespace: true.
   - Namespace: "whitepaper".
   - Pinecone index: select "whitepapers".
   - Connect Download PDF → Insert into Pinecone.
   - Connect Embeddings OpenAI → Insert into Pinecone (ai_embedding).
7. **For chat queries:**
   - Create Embeddings OpenAI2 node (same config).
   - Create Pinecone read node ("Read Pinecone Vector Store")
     - Namespace: "whitepaper".
     - Pinecone index: "whitepapers".
   - Create Vector Store Retriever node.
   - Create Question and Answer Chain node.
     - Prompt: instruct AI to only use vector store knowledge.
   - Create OpenAI Chat Model node (GPT-4o, temp 0.3).
   - Create Chat Trigger node ("When chat message received")
     - Public webhook.
     - Initial message greeting.
   - Connect nodes as per flow:
     - Chat Trigger → Question and Answer Chain.
     - Embeddings OpenAI2 → Read Pinecone Vector Store.
     - Read Pinecone Vector Store → Vector Store Retriever.
     - Vector Store Retriever → Question and Answer Chain.
     - Question and Answer Chain → OpenAI Chat Model.

---

#### Block 3: AI Agent for Appointment Scheduling

1. **Create Chat Trigger node ("When chat message received")**
   - Public webhook.
   - Initial message: "Hi there! 👋 I can help you schedule an appointment with Max Tkacz. On which day would you like to meet?"
2. **Add LangChain Agent node ("Appointment booking agent")**
   - System message defines:
     - Assistant role and goals.
     - Appointment length 30 minutes.
     - Use tools for calendar availability and booking.
     - Today's date dynamic.
   - Connect Chat Trigger → Appointment booking agent.
3. **Add Window Buffer Memory node**
   - Context window length: 10.
   - Connect Anthropic Chat Model → Window Buffer Memory → Appointment booking agent.
4. **Add Anthropic Chat Model node**
   - Temperature: 0.4.
   - Connect Appointment booking agent → Anthropic Chat Model.
5. **Add HTTP Request node ("Get calendar availability")**
   - URL: Google Calendar freeBusy API.
   - Method: POST.
   - JSON Body uses placeholders `{timeMin}`, `{timeMax}`.
   - Authentication: Google Calendar OAuth2.
   - Connect Appointment booking agent → Get calendar availability (ai_tool).
6. **Add HTTP Request node ("Book appointment")**
   - URL: Google Calendar events API.
   - Method: POST.
   - JSON Body includes summary, start/end times, attendees.
   - Authentication: Google Calendar OAuth2.
   - Connect Appointment booking agent → Book appointment (ai_tool).
7. **Add Sticky Note with calendar link** (optional for user reference).

---

### 5. General Notes & Resources

| Note Content                                                                                                                       | Context or Link                                                                                 |
|-----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow was presented at the AI Developers meetup in San Francisco on July 24, 2024.                                         | Workflow description.                                                                          |
| n8n is a low-code automation platform for technical teams.                                                                         | Sticky Note: "# What is n8n?\n### Low-code Automation Platform for technical teams"            |
| See 100+ AI Workflow templates on n8n.io.                                                                                         | [Open Templates Library](https://n8n.io/workflows)                                            |
| Join the n8n community of 13k+ members for questions and discussions.                                                              | [Explore n8n community](https://community.n8n.io/)                                           |
| Contact Max Tkacz, Senior Developer Advocate at n8n, via QR code or links in Sticky Note9.                                         | Sticky Note with QR code and contact info.                                                    |
| Open Calendar link for Max Tkacz’s schedule is provided for reference on Sticky Note1.                                            | [Google Calendar link](https://calendar.google.com/calendar/u/0/r/day/2024/7/26)               |
| BTC Whitepaper is used as example PDF for the RAG demo, metadata and references included in Sticky Note8.                         | Presentation note with screenshot and metadata.                                               |

---

This document fully covers the structure, logic, and configuration of the "Advanced AI Demo" workflow, enabling expert users or AI agents to understand, reproduce, and extend the automation with confidence.