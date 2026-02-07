AI-Powered WhatsApp Support Bot with Ticket Creation for Google Sheets

https://n8nworkflows.xyz/workflows/ai-powered-whatsapp-support-bot-with-ticket-creation-for-google-sheets-7405


# AI-Powered WhatsApp Support Bot with Ticket Creation for Google Sheets

### 1. Workflow Overview

This workflow implements an **AI-powered WhatsApp support bot** that receives customer messages, processes them using AI, and creates support tickets stored in Google Sheets. It integrates several logical blocks: message reception, AI processing and memory management, document ingestion and indexing with Pinecone vector store, ticket management in Google Sheets, and notification via Gmail.

The main functional blocks are:

- **1.1 Input Reception**: Receives incoming WhatsApp messages and form submissions.
- **1.2 AI Processing and Memory**: Processes messages with an AI agent that uses language models, embeddings, and memory buffers.
- **1.3 Document Ingestion and Indexing**: Loads documents and web pages, extracts text, and stores embeddings in Pinecone for retrieval.
- **1.4 Ticket Management**: Retrieves and creates support tickets in Google Sheets.
- **1.5 Notification**: Sends email notifications using Gmail when tickets are created.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block captures inputs from WhatsApp chats and web form submissions, triggering the workflow to process support requests.

**Nodes Involved:**  
- WhatsApp Trigger  
- When chat message received  
- On form submission  

**Node Details:**

- **WhatsApp Trigger**  
  - Type: Trigger node for WhatsApp messages  
  - Configuration: Listens for incoming WhatsApp messages via webhook  
  - Inputs: External message via WhatsApp  
  - Outputs: Passes message data to “Company Info” node  
  - Edge cases: Message format errors, network/webhook failures  

- **When chat message received**  
  - Type: LangChain Chat Trigger node  
  - Configuration: Listens for chat messages to trigger AI processing  
  - Inputs: Incoming chat messages (possibly from other channels or integrated apps)  
  - Outputs: Forwards data to “Company Info” node  
  - Edge cases: Chat platform outages, message parsing errors  

- **On form submission**  
  - Type: Form Trigger node  
  - Configuration: Triggers when a form is submitted, e.g., support request form  
  - Inputs: Form data submitted by users  
  - Outputs: Passes data to “Switch1” node for branching logic  
  - Edge cases: Incomplete form data, webhook failures  

---

#### 2.2 AI Processing and Memory

**Overview:**  
This block uses AI to analyze input messages, manage conversation context with memory, and retrieve relevant information from vector stores.

**Nodes Involved:**  
- Company Info  
- AI Agent  
- Simple Memory  
- Pinecone (Retrieve Info)  
- OpenAI Chat Model  
- Embeddings OpenAI  

**Node Details:**

- **Company Info**  
  - Type: Set node  
  - Configuration: Sets company-related context variables for AI processing  
  - Inputs: From “WhatsApp Trigger” or “When chat message received”  
  - Outputs: Feeds enriched data to “AI Agent”  
  - Edge cases: Missing or incorrect context data  

- **AI Agent**  
  - Type: LangChain Agent node (v2.1)  
  - Configuration: Central AI processing node combining language model, memory, embeddings, and tools  
  - Inputs: Receives context and messages from “Company Info,” “Simple Memory,” “Get tickets,” “Create support tickets,” “Send a message in Gmail,” and vector store nodes  
  - Outputs: AI responses, commands for ticket creation and notifications  
  - Edge cases: API errors, model timeouts, invalid inputs  

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window  
  - Configuration: Maintains short-term conversation context to aid AI continuity  
  - Inputs: Conversation data  
  - Outputs: Feeds memory context to “AI Agent”  
  - Edge cases: Memory overflow, context loss, incorrect state management  

- **Pinecone (Retrieve Info)**  
  - Type: LangChain Pinecone vector store node  
  - Configuration: Retrieves relevant documents or info from Pinecone based on embeddings  
  - Inputs: Embeddings from “Embeddings OpenAI”  
  - Outputs: Sends retrieved documents to “AI Agent”  
  - Edge cases: Vector store downtime, invalid queries  

- **OpenAI Chat Model**  
  - Type: Language Model node using OpenAI GPT  
  - Configuration: Processes natural language inputs and generates responses  
  - Inputs: From “AI Agent” and “Company Info”  
  - Outputs: AI-generated chat messages to “AI Agent”  
  - Edge cases: API quota limits, network errors  

- **Embeddings OpenAI**  
  - Type: Embeddings generator using OpenAI  
  - Configuration: Converts text data into vector embeddings for Pinecone  
  - Inputs: Text from various sources including tickets and documents  
  - Outputs: Embeddings sent to “Pinecone (Retrieve Info)” or “Pinecone Vector Store”  
  - Edge cases: API failures, bad input text  

---

#### 2.3 Document Ingestion and Indexing

**Overview:**  
This block handles fetching, parsing, and indexing documents and web pages to keep the AI’s knowledge base up to date.

**Nodes Involved:**  
- On form submission  
- Switch1  
- HTTP Request  
- XML  
- Code (multiple)  
- Merge  
- Remove Duplicates  
- Loop Over Pages  
- Fetch Page HTML  
- Wait  
- HTML  
- Loop Over Files  
- PDF or TXT (Switch)  
- Extract PDF  
- Extract Text  
- Select Text  
- Split Pages URLs  
- Split_Binary  
- Pinecone Vector Store  
- Default Data Loader  
- Embeddings OpenAI1  

**Node Details:**

- **Switch1**  
  - Type: Switch node to branch based on input type  
  - Configuration: Routes form submissions to different processing paths (e.g., URLs, HTTP requests, or binary files)  
  - Inputs: From “On form submission”  
  - Outputs: To “Split Pages URLs,” “HTTP Request,” or “Split_Binary” nodes  
  - Edge cases: Unexpected input types, routing errors  

- **HTTP Request**  
  - Type: HTTP Request node  
  - Configuration: Fetches XML data or web content based on input URLs  
  - Inputs: From “Switch1”  
  - Outputs: Passes data to “XML” node  
  - Edge cases: Connection timeouts, invalid URLs, HTTP errors  

- **XML**  
  - Type: XML parser node  
  - Configuration: Parses XML responses into usable data format  
  - Inputs: From “HTTP Request”  
  - Outputs: To “Code” node for further processing  
  - Edge cases: Malformed XML, parsing failures  

- **Code**  
  - Type: Code node (JavaScript)  
  - Configuration: Processes parsed XML or other data transformations  
  - Inputs: From “XML” or other nodes  
  - Outputs: To “Merge” or “Split Pages URLs” nodes  
  - Edge cases: Script errors, data format mismatches  

- **Merge**  
  - Type: Merge node  
  - Configuration: Combines multiple data streams into one  
  - Inputs: From “Code” and “Split Pages URLs”  
  - Outputs: To “Remove Duplicates”  
  - Edge cases: Conflicting data or empty inputs  

- **Remove Duplicates**  
  - Type: Remove Duplicates node  
  - Configuration: Ensures no duplicate URLs or documents are processed  
  - Inputs: From “Merge”  
  - Outputs: To “Loop Over Pages”  
  - Edge cases: False duplicates, empty results  

- **Loop Over Pages**  
  - Type: Split In Batches node  
  - Configuration: Iterates over URLs/pages for processing  
  - Inputs: From “Remove Duplicates”  
  - Outputs: To “HTML” and “Fetch Page HTML” nodes  
  - Edge cases: Large batch sizes causing performance issues  

- **Fetch Page HTML**  
  - Type: HTTP Request node to fetch page HTML content  
  - Inputs: From “Loop Over Pages”  
  - Outputs: To “Wait” node  
  - Edge cases: HTTP errors, slow responses  

- **Wait**  
  - Type: Wait node  
  - Configuration: Delays workflow to respect rate limits or pacing  
  - Inputs: From “Fetch Page HTML”  
  - Outputs: Loops back to “Loop Over Pages” for next URL  
  - Edge cases: Excessive delays leading to timeouts  

- **HTML**  
  - Type: HTML parser node  
  - Configuration: Extracts relevant text or data from page HTML  
  - Inputs: From “Loop Over Pages”  
  - Outputs: To “Pinecone Vector Store”  
  - Edge cases: Parsing errors, empty pages  

- **Loop Over Files**  
  - Type: Split In Batches for processing multiple files  
  - Inputs: From “Select Text” or “Extract Text” and “Split_Binary”  
  - Outputs: To “Pinecone Vector Store” and “PDF or TXT” nodes  
  - Edge cases: Large files, unsupported file types  

- **PDF or TXT**  
  - Type: Switch node to distinguish file types  
  - Inputs: From “Loop Over Files”  
  - Outputs: To “Extract PDF” or “Extract Text”  
  - Edge cases: Unsupported formats, errors in detection  

- **Extract PDF**  
  - Type: Extract Text from PDF node  
  - Outputs: To “Select Text” node  
  - Edge cases: Corrupted PDFs, extraction failures  

- **Extract Text**  
  - Type: Extract Text from file node (e.g., TXT)  
  - Outputs: To “Loop Over Files” for batching  
  - Edge cases: Encoding issues  

- **Select Text**  
  - Type: Set node to filter or select relevant extracted text  
  - Outputs: To “Loop Over Files”  
  - Edge cases: Empty or irrelevant text  

- **Split Pages URLs**  
  - Type: Code node to process page URLs into a list  
  - Outputs: To “Merge” node  
  - Edge cases: Malformed URLs  

- **Split_Binary**  
  - Type: Code node to split binary files for processing  
  - Outputs: To “Loop Over Files”  
  - Edge cases: Binary data corruption  

- **Pinecone Vector Store**  
  - Type: LangChain Pinecone vector store (v1.3)  
  - Configuration: Stores embeddings for documents and web page content  
  - Inputs: From “HTML,” “Loop Over Files,” “Embeddings OpenAI1,” and “Default Data Loader”  
  - Outputs: To AI agent or retrieval nodes  
  - Edge cases: Pinecone service downtime, API quota limits  

- **Default Data Loader**  
  - Type: Document loader for default data ingestion  
  - Outputs: To “Pinecone Vector Store”  
  - Edge cases: Loading failures, unsupported formats  

- **Embeddings OpenAI1**  
  - Type: Embeddings generator node  
  - Inputs: Document text for embedding  
  - Outputs: To “Pinecone Vector Store”  
  - Edge cases: API errors  

---

#### 2.4 Ticket Management

**Overview:**  
Manages support tickets by retrieving existing tickets and creating new ones in Google Sheets.

**Nodes Involved:**  
- Get tickets (Google Sheets)  
- Create support tickets (Google Sheets)  
- AI Agent (interacts with ticket nodes)  

**Node Details:**

- **Get tickets**  
  - Type: Google Sheets Tool node (v4.6)  
  - Configuration: Reads existing tickets from a specified Google Sheet  
  - Inputs: Called by “AI Agent” to check ticket status or history  
  - Outputs: Ticket data to “AI Agent”  
  - Edge cases: Google API auth errors, sheet access issues  

- **Create support tickets**  
  - Type: Google Sheets Tool node (v4.6)  
  - Configuration: Adds new support tickets as rows in Google Sheets  
  - Inputs: Triggered by “AI Agent” commands based on incoming requests  
  - Outputs: Confirmation or ticket ID back to “AI Agent”  
  - Edge cases: Write permission errors, quota limits  

---

#### 2.5 Notification

**Overview:**  
Sends email notifications via Gmail when support tickets are created or updated.

**Nodes Involved:**  
- Send a message in Gmail  
- AI Agent (invokes Gmail notifications)  

**Node Details:**

- **Send a message in Gmail**  
  - Type: Gmail Tool node (v2.1)  
  - Configuration: Sends email notifications related to support tickets or responses  
  - Inputs: Commands from “AI Agent” to send notification emails  
  - Outputs: Email delivery confirmation  
  - Edge cases: OAuth token expiry, sending limits, incorrect recipient addresses  

---

### 3. Summary Table

| Node Name               | Node Type                                | Functional Role                       | Input Node(s)                            | Output Node(s)                          | Sticky Note                        |
|-------------------------|----------------------------------------|-------------------------------------|----------------------------------------|---------------------------------------|----------------------------------|
| WhatsApp Trigger        | WhatsApp Trigger (Webhook)              | Receives WhatsApp messages           | External                               | Company Info                          |                                  |
| When chat message received | LangChain Chat Trigger                  | Receives chat messages               | External                               | Company Info                          |                                  |
| On form submission      | Form Trigger                           | Receives form submissions            | External                               | Switch1                              |                                  |
| Switch1                 | Switch                                | Routes form inputs                   | On form submission                    | Split Pages URLs, HTTP Request, Split_Binary |                                  |
| Split Pages URLs        | Code                                  | Processes page URLs                  | Switch1                               | Merge                               |                                  |
| HTTP Request            | HTTP Request                          | Fetches XML/web data                 | Switch1                               | XML                                 |                                  |
| XML                     | XML Parser                           | Parses XML data                      | HTTP Request                         | Code                                |                                  |
| Code                    | Code                                  | Processes parsed data                | XML, XML                             | Merge                               |                                  |
| Merge                   | Merge                                 | Combines multiple data streams      | Code, Split Pages URLs                | Remove Duplicates                   |                                  |
| Remove Duplicates       | Remove Duplicates                      | Removes duplicate URLs/documents    | Merge                               | Loop Over Pages                    |                                  |
| Loop Over Pages         | Split In Batches                      | Iterates over pages                  | Remove Duplicates                   | HTML, Fetch Page HTML              |                                  |
| Fetch Page HTML         | HTTP Request                         | Fetches page HTML                   | Loop Over Pages                   | Wait                              |                                  |
| Wait                    | Wait                                  | Delays execution                    | Fetch Page HTML                   | Loop Over Pages                   |                                  |
| HTML                    | HTML Parser                          | Extracts text from HTML             | Loop Over Pages                   | Pinecone Vector Store             |                                  |
| Loop Over Files         | Split In Batches                     | Processes files in batches          | Select Text, Extract Text, Split_Binary | Pinecone Vector Store, PDF or TXT |                                  |
| PDF or TXT              | Switch                               | Branches based on file type         | Loop Over Files                   | Extract PDF, Extract Text          |                                  |
| Extract PDF             | Extract Text from PDF                 | Extracts text from PDFs             | PDF or TXT                        | Select Text                      |                                  |
| Extract Text            | Extract Text from files               | Extracts text from text files       | PDF or TXT, Loop Over Files       | Loop Over Files                  |                                  |
| Select Text             | Set                                  | Selects relevant text               | Extract PDF                       | Loop Over Files                  |                                  |
| Split_Binary            | Code                                 | Splits binary files                 | Switch1                            | Loop Over Files                  |                                  |
| Pinecone Vector Store   | LangChain Pinecone Vector Store      | Stores document embeddings          | HTML, Loop Over Files, Embeddings OpenAI1, Default Data Loader | AI Agent, Pinecone (Retrieve Info) |                                  |
| Default Data Loader     | LangChain Document Data Loader       | Loads default documents             | -                                  | Pinecone Vector Store            |                                  |
| Embeddings OpenAI1      | OpenAI Embeddings                    | Creates embeddings for documents    | Documents                        | Pinecone Vector Store            |                                  |
| Company Info            | Set                                  | Sets company context info           | WhatsApp Trigger, When chat message received | AI Agent                        |                                  |
| AI Agent                | LangChain Agent                     | AI processing core                  | Company Info, Simple Memory, Pinecone (Retrieve Info), Get tickets, Create support tickets, Send a message in Gmail | Various outputs                 |                                  |
| Simple Memory           | LangChain Memory Buffer Window       | Maintains conversation context      | Conversation data                | AI Agent                        |                                  |
| Pinecone (Retrieve Info) | LangChain Pinecone Vector Store      | Retrieves relevant info             | Embeddings OpenAI               | AI Agent                        |                                  |
| OpenAI Chat Model       | LangChain OpenAI Chat Model           | Generates AI chat responses         | AI Agent inputs                 | AI Agent                        |                                  |
| Embeddings OpenAI       | OpenAI Embeddings                    | Generates embeddings                | Ticket text                     | Pinecone (Retrieve Info)        |                                  |
| Get tickets             | Google Sheets Tool                   | Retrieves tickets                   | AI Agent                      | AI Agent                        |                                  |
| Create support tickets  | Google Sheets Tool                   | Creates new tickets                 | AI Agent                      | AI Agent                        |                                  |
| Send a message in Gmail | Gmail Tool                         | Sends email notifications          | AI Agent                      | AI Agent                        |                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create WhatsApp Trigger node**  
   - Type: WhatsApp Trigger  
   - Configure webhook to receive messages from WhatsApp Business API or integration  
   - Position: Input start node for chat messages  

2. **Create When chat message received node**  
   - Type: LangChain Chat Trigger (v1.1)  
   - Configure webhook to receive chat messages from integrated sources  

3. **Create On form submission node**  
   - Type: Form Trigger (v2.2)  
   - Configure webhook to receive form submissions for support requests  

4. **Create Company Info node**  
   - Type: Set  
   - Configure to add static or dynamic company-related context variables (e.g., company name, support info)  
   - Connect WhatsApp Trigger and When chat message received nodes to this node  

5. **Create AI Agent node**  
   - Type: LangChain Agent (v2.1)  
   - Configure with your OpenAI credentials and any other API keys needed (Pinecone, Gmail)  
   - Set up AI tools and language model integration  
   - Connect input from Company Info, Simple Memory, Pinecone (Retrieve Info), Get tickets, Create support tickets, and Send a message in Gmail nodes  

6. **Create Simple Memory node**  
   - Type: LangChain Memory Buffer Window (v1.3)  
   - Configure size of memory window for conversation context  
   - Connect output to AI Agent’s ai_memory input  

7. **Create Pinecone (Retrieve Info) node**  
   - Type: LangChain Pinecone Vector Store (v1.3)  
   - Configure Pinecone API key, environment, and index name  
   - Connect input from Embeddings OpenAI node  
   - Connect output to AI Agent’s ai_tool input  

8. **Create OpenAI Chat Model node**  
   - Type: LangChain OpenAI Chat Model (v1.2)  
   - Configure OpenAI API credentials and model parameters (e.g., GPT-4)  
   - Connect output to AI Agent’s ai_languageModel input  

9. **Create Embeddings OpenAI node**  
   - Type: LangChain Embeddings OpenAI (v1.2)  
   - Configure OpenAI API key  
   - Connect to Pinecone (Retrieve Info) and Pinecone Vector Store nodes as needed  

10. **Set up Document Ingestion Flow:**  
    - Create Switch1 node (Switch) to route form submissions by type  
    - Connect On form submission node to Switch1  
    - Create HTTP Request node to fetch URLs, connect from Switch1 branch  
    - Create XML node to parse HTTP Request output  
    - Create Code nodes to process XML and split URLs  
    - Create Merge node to combine data streams  
    - Create Remove Duplicates node to filter URLs  
    - Create Loop Over Pages node (Split In Batches) to iterate over URLs  
    - Create Fetch Page HTML (HTTP Request) and Wait nodes for pacing  
    - Create HTML parser node to extract page text  
    - Create Loop Over Files node (Split In Batches) for file processing  
    - Create PDF or TXT Switch node to branch on file type  
    - Create Extract PDF and Extract Text nodes accordingly  
    - Create Select Text node to filter extracted text  
    - Create Split_Binary code node to handle binary file splits  
    - Create Pinecone Vector Store node to store embeddings  
    - Create Embeddings OpenAI1 node for embedding generation  
    - Create Default Data Loader node for initial data load  
    - Connect nodes according to logical flow detailed in section 2.3  

11. **Create Ticket Management Nodes:**  
    - Create Get tickets node (Google Sheets Tool v4.6)  
    - Configure Google Sheets credentials with appropriate scope  
    - Set sheet and range to retrieve existing tickets  
    - Create Create support tickets node (Google Sheets Tool v4.6)  
    - Configure with write access to the tickets sheet  
    - Connect both nodes to AI Agent’s ai_tool input for ticket operations  

12. **Create Notification Node:**  
    - Create Send a message in Gmail node (v2.1)  
    - Configure Gmail OAuth2 credentials with send email scope  
    - Connect to AI Agent’s ai_tool input for sending notifications  

13. **Connect Flow:**  
    - Connect WhatsApp Trigger and When chat message received → Company Info → AI Agent  
    - Connect Simple Memory → AI Agent  
    - Connect Pinecone (Retrieve Info) and Embeddings OpenAI → AI Agent  
    - Connect Get tickets, Create support tickets, Send a message in Gmail → AI Agent  
    - Connect On form submission → Switch1 → Document ingestion flow nodes → Pinecone Vector Store  
    - Ensure all nodes have proper credentials configured (OpenAI, Pinecone, Google Sheets, Gmail)  

14. **Configure Credentials:**  
    - OpenAI API key for language models and embeddings  
    - Pinecone API key and index configuration  
    - Google Sheets OAuth2 credentials with read/write access  
    - Gmail OAuth2 credentials for email sending  
    - WhatsApp API or integration credentials for the WhatsApp Trigger  

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                                                                                  |
|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The AI Agent node integrates multiple AI components including language model, memory, and tools for workflows. | n8n LangChain Agent documentation                                                                |
| Pinecone vector store is used for semantic document retrieval to enhance AI responses with knowledge base data. | https://www.pinecone.io/docs/                                                                   |
| Google Sheets nodes require OAuth2 credentials with proper scopes to read and write support ticket data.       | https://developers.google.com/sheets/api                                                        |
| Gmail node uses OAuth2 for sending notifications. Token refresh handling is required for long running workflows.| https://developers.google.com/gmail/api                                                         |
| Rate limiting and pacing are handled by Wait nodes to avoid API throttling during document ingestion.          | n8n Wait node documentation                                                                     |
| This workflow is suitable for customer support scenarios requiring automated ticket creation and AI assistance.|                                                                                                 |

---

**Disclaimer:**  
The text provided derives exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects valid content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.