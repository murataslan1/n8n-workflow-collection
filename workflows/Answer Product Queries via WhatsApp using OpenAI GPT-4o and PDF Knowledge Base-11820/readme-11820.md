Answer Product Queries via WhatsApp using OpenAI GPT-4o and PDF Knowledge Base

https://n8nworkflows.xyz/workflows/answer-product-queries-via-whatsapp-using-openai-gpt-4o-and-pdf-knowledge-base-11820


# Answer Product Queries via WhatsApp using OpenAI GPT-4o and PDF Knowledge Base

---

### 1. Workflow Overview

This workflow automates an AI-powered WhatsApp sales assistant that answers customer queries about Yamaha Powered Loudspeakers using data extracted from a PDF product brochure. It integrates WhatsApp messaging, OpenAI GPT-4o language models, and an in-memory vector store built from the product brochure text to provide contextually relevant, factual responses.

The workflow is logically divided into these blocks:

- **1.1 Product Brochure Acquisition and Processing**: Download the PDF brochure, extract text, split it, and prepare embeddings.
- **1.2 Vector Store Creation**: Build an in-memory searchable vector store from the brochure embeddings to serve as a knowledge base.
- **1.3 WhatsApp Message Reception and Filtering**: Trigger on incoming WhatsApp messages, filtering to accept only text messages.
- **1.4 AI Sales Agent Query Processing**: Use OpenAI’s GPT-4o agent with conversation memory and vector store access to answer user queries.
- **1.5 User Response Delivery**: Send the AI-generated answer back to the user via WhatsApp.
- **1.6 Unsupported Message Handling**: Reply with a default message for non-text WhatsApp inputs.

---

### 2. Block-by-Block Analysis

#### 2.1 Product Brochure Acquisition and Processing

**Overview:**  
This block downloads the Yamaha loudspeaker brochure PDF, extracts its text contents, and processes the text for embedding generation to later build the vector store.

**Nodes Involved:**  
- `get Product Brochure` (HTTP Request)  
- `Extract from File` (File Extraction)  
- `Recursive Character Text Splitter` (Text Splitting)  
- `Default Data Loader` (Document Preparation)  
- `Embeddings OpenAI1` (Text Embedding)

**Node Details:**

- **get Product Brochure**  
  - Type: HTTP Request  
  - Role: Downloads the PDF brochure from a Yamaha URL.  
  - Config: Simple GET request to the brochure URL; no authentication.  
  - Input: Manual Trigger node (`When clicking ‘Test workflow’`) initiates this.  
  - Output: PDF binary content to `Extract from File`.  
  - Failure modes: Network errors, URL unreachable, timeouts.

- **Extract from File**  
  - Type: Extract from File  
  - Role: Extracts textual content from the downloaded PDF.  
  - Config: Operation set to PDF extraction, no special options.  
  - Input: PDF binary from HTTP Request node.  
  - Output: Extracted raw text passed to `Create Product Catalogue` block via splitting.  
  - Failures: Corrupt PDF, extraction errors.

- **Recursive Character Text Splitter**  
  - Type: Text Splitter  
  - Role: Splits long extracted text into manageable chunks (2000 characters) for embedding.  
  - Config: Chunk size 2000, no chunk overlap.  
  - Input: Text from `Default Data Loader`.  
  - Output: Chunks for embedding.  
  - Failures: Text too short or empty input.

- **Default Data Loader**  
  - Type: Document Data Loader  
  - Role: Prepares the extracted text as a document for embedding generation.  
  - Config: Takes JSON expression from the Extract from File node’s output text property.  
  - Input: Text from `Recursive Character Text Splitter`.  
  - Output: Document structure for embedding.  
  - Failures: Malformed text or expression errors.

- **Embeddings OpenAI1**  
  - Type: OpenAI Embeddings  
  - Role: Converts text chunks into vector embeddings using OpenAI’s `text-embedding-3-small` model.  
  - Config: Model set to `text-embedding-3-small`.  
  - Credentials: OpenAI API credential configured.  
  - Input: Document chunks from `Default Data Loader`.  
  - Output: Embeddings for vector store creation.  
  - Failures: API rate limits, auth failures, model unavailability.

---

#### 2.2 Vector Store Creation

**Overview:**  
Creates an in-memory vector store from the generated embeddings to enable semantic search over the product brochure content.

**Nodes Involved:**  
- `Create Product Catalogue` (Vector Store Insert)  
- `Product Catalogue` (Vector Store In-Memory)  
- `OpenAI Chat Model1` (GPT-4o model linked to Vector Store)  
- `Embeddings OpenAI` (Embeddings for Vector Store Tool)  
- `Vector Store Tool` (Vector Store Query Tool)

**Node Details:**

- **Create Product Catalogue**  
  - Type: Vector Store In-Memory (Insert Mode)  
  - Role: Inserts embeddings into an in-memory vector store keyed by session.  
  - Config: Clears existing store before insert; uses memory key `whatsapp-75`.  
  - Inputs: Embeddings from `Embeddings OpenAI1`, document data from `Default Data Loader`.  
  - Outputs: Vector store ready for querying.  
  - Failures: Memory limits, data corruption.

- **Product Catalogue**  
  - Type: Vector Store In-Memory  
  - Role: Provides the vector store interface used by the AI agent.  
  - Config: Memory key `whatsapp-75`.  
  - Input: Vector store data from `Create Product Catalogue`.  
  - Output: Vector store accessible as a tool.  
  - Failures: Memory persistence; volatility on workflow restart.

- **OpenAI Chat Model1**  
  - Type: OpenAI Chat Model  
  - Role: GPT-4o language model configured to assist vector store querying.  
  - Config: Model `gpt-4o-2024-08-06`.  
  - Credentials: OpenAI API.  
  - Input: Connected as language model node for `Vector Store Tool`.  
  - Failures: API errors, model deprecation.

- **Embeddings OpenAI**  
  - Type: OpenAI Embeddings  
  - Role: Provides embeddings to the vector store tool for similarity search.  
  - Config: Model `text-embedding-3-small`.  
  - Credentials: OpenAI API.  
  - Input: From AI agent query.  
  - Output: Embeddings for similarity matching.  
  - Failures: API limits.

- **Vector Store Tool**  
  - Type: Vector Store Tool  
  - Role: Enables AI agent to query the product brochure vector store to retrieve relevant info.  
  - Config: Named `query_product_brochure` with a description indicating it is valid for 2024.  
  - Inputs: Embeddings and chat model linked.  
  - Output: Results passed to AI agent.  
  - Failures: Query errors, empty results.

---

#### 2.3 WhatsApp Message Reception and Filtering

**Overview:**  
Receives incoming WhatsApp messages via a webhook, and filters out non-text messages, routing accordingly.

**Nodes Involved:**  
- `WhatsApp Trigger` (WhatsApp webhook trigger)  
- `Handle Message Types` (Switch node for message type)  
- `Reply To User1` (WhatsApp reply for unsupported messages)

**Node Details:**

- **WhatsApp Trigger**  
  - Type: WhatsApp Trigger  
  - Role: Webhook to receive incoming WhatsApp messages (specifically "messages" update type).  
  - Config: Default options, webhook ID set.  
  - Input: External WhatsApp user message.  
  - Output: Message JSON to `Handle Message Types`.  
  - Failures: Webhook setup errors, connectivity issues.

- **Handle Message Types**  
  - Type: Switch  
  - Role: Checks if the incoming WhatsApp message type equals "text".  
  - Config: Two outputs: "Supported" for text, "Not Supported" otherwise.  
  - Input: Message JSON from `WhatsApp Trigger`.  
  - Output: Routes text messages to AI agent, others to rejection reply.  
  - Failures: Unexpected message formats.

- **Reply To User1**  
  - Type: WhatsApp Message Send  
  - Role: Sends a default reply to users who send non-text messages.  
  - Config: Sends fixed text: "I'm unable to process non-text messages. Please send only text messages. Thanks!"  
  - Input: Triggered from "Not Supported" branch of `Handle Message Types` node.  
  - Output: None.  
  - Failures: WhatsApp API errors, message delivery issues.

---

#### 2.4 AI Sales Agent Query Processing

**Overview:**  
Processes supported text messages by querying the vector store and generating responses with GPT-4o, maintaining session context.

**Nodes Involved:**  
- `AI Sales Agent` (Langchain Agent node)  
- `Window Buffer Memory` (Conversation memory for session)  
- `OpenAI Chat Model` (GPT-4o language model)  
- `Vector Store Tool` (Vector store querying tool)

**Node Details:**

- **AI Sales Agent**  
  - Type: Langchain Agent  
  - Role: Acts as the conversational AI assistant that answers customer queries.  
  - Config:  
    - Input text is the message body from WhatsApp.  
    - System message instructs the agent to answer factually about Yamaha Powered Loudspeakers 2024 brochure and to direct users to official contacts if needed.  
  - Inputs: Text message from `Handle Message Types` (Supported output).  
  - Linked Nodes: Uses `OpenAI Chat Model`, `Window Buffer Memory` for session context, and `Vector Store Tool` for knowledge retrieval.  
  - Output: AI-generated answer passed to `Reply To User`.  
  - Failures: API errors, timeout, empty vector search results.

- **Window Buffer Memory**  
  - Type: Langchain Memory Buffer Window  
  - Role: Maintains conversational history per WhatsApp user session to provide context-aware responses.  
  - Config: Session key built dynamically using the sender’s phone number.  
  - Input/Output: Linked as memory to AI Sales Agent.  
  - Failures: Memory overflow, session key errors.

- **OpenAI Chat Model**  
  - Type: OpenAI Chat Model  
  - Role: GPT-4o language model used by AI Sales Agent for generating responses.  
  - Config: Model set to `gpt-4o-2024-08-06`.  
  - Credentials: OpenAI API.  
  - Failures: Rate limits, API errors.

- **Vector Store Tool**  
  - Type: Vector Store Tool  
  - Role: Provides relevant product brochure data for AI agent queries.  
  - Config: Connects AI Sales Agent to the in-memory vector store.  
  - Failures: Empty or stale data.

---

#### 2.5 User Response Delivery

**Overview:**  
Sends the AI-generated answers back to the customer via WhatsApp.

**Nodes Involved:**  
- `Reply To User` (WhatsApp send message)

**Node Details:**

- **Reply To User**  
  - Type: WhatsApp Message Send  
  - Role: Sends the AI agent’s output text to the user’s WhatsApp number.  
  - Config:  
    - Text body taken from AI Sales Agent output.  
    - Sends with no preview URL.  
    - Uses configured phone number ID for sending.  
    - Recipient phone number dynamically extracted from incoming message sender.  
  - Input: AI Sales Agent output.  
  - Failures: WhatsApp API errors, invalid phone numbers.

---

### 3. Summary Table

| Node Name                 | Node Type                                | Functional Role                          | Input Node(s)             | Output Node(s)           | Sticky Note                                                                                           |
|---------------------------|-----------------------------------------|----------------------------------------|---------------------------|--------------------------|-----------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                         | Initiates product brochure download    |                           | get Product Brochure      |                                                                                                     |
| get Product Brochure       | HTTP Request                            | Downloads Yamaha product brochure PDF  | When clicking ‘Test workflow’ | Extract from File         | ## 1. Download Product Brochure PDF ... (see note content in Sticky Note)                            |
| Extract from File          | Extract from File                       | Extracts text from PDF                  | get Product Brochure       | Create Product Catalogue  |                                                                                                     |
| Recursive Character Text Splitter | Text Splitter                       | Splits extracted text into chunks      | Default Data Loader        | Default Data Loader       |                                                                                                     |
| Default Data Loader        | Document Data Loader                    | Prepares text document for embedding   | Recursive Character Text Splitter | Create Product Catalogue  |                                                                                                     |
| Embeddings OpenAI1         | OpenAI Embeddings                      | Generates embeddings from text chunks  | Default Data Loader        | Create Product Catalogue  |                                                                                                     |
| Create Product Catalogue   | Vector Store In-Memory (Insert Mode)   | Builds in-memory vector store           | Extract from File, Embeddings OpenAI1 | Product Catalogue        | ## 2. Create Product Brochure Vector Store ... (see Sticky Note content)                            |
| Product Catalogue          | Vector Store In-Memory                  | Holds vector store for querying        | Create Product Catalogue   | Vector Store Tool         |                                                                                                     |
| OpenAI Chat Model1         | OpenAI Chat Model                      | GPT-4o used for vector store queries   |                           | Vector Store Tool         |                                                                                                     |
| Embeddings OpenAI          | OpenAI Embeddings                      | Embedding generation for vector queries|                           | Vector Store Tool         |                                                                                                     |
| Vector Store Tool          | Vector Store Tool                      | Provides vector store search capability| Product Catalogue, OpenAI Chat Model1, Embeddings OpenAI | AI Sales Agent           |                                                                                                     |
| WhatsApp Trigger           | WhatsApp Trigger                       | Receives incoming WhatsApp messages    |                           | Handle Message Types      | ## 3. Use the WhatsApp Trigger ... (see Sticky Note content)                                        |
| Handle Message Types       | Switch                                | Filters messages by type (text/non-text)| WhatsApp Trigger           | AI Sales Agent, Reply To User1 |                                                                                                     |
| Reply To User1             | WhatsApp Message Send                  | Replies to unsupported message types   | Handle Message Types       |                          | ### 3a. Handle Unsupported Message Types (see Sticky Note)                                         |
| AI Sales Agent             | Langchain Agent                       | Processes user query with memory and vector store | Handle Message Types (Supported) | Reply To User             | ## 4. Sales AI Agent Responds To Customers ... (see Sticky Note)                                    |
| Window Buffer Memory       | Conversation Memory                   | Maintains user session context         |                           | AI Sales Agent            |                                                                                                     |
| OpenAI Chat Model          | OpenAI Chat Model                     | GPT-4o for AI Sales Agent responses    |                           | AI Sales Agent            |                                                                                                     |
| Reply To User              | WhatsApp Message Send                 | Sends AI-generated response to user   | AI Sales Agent             |                          | ## 5. Respond to WhatsApp User ... (see Sticky Note)                                                |
| Sticky Note1               | Sticky Note                          | Informational note on vector store creation |                           |                          | ## 2. Create Product Brochure Vector Store ...                                                      |
| Sticky Note2               | Sticky Note                          | Informational note on WhatsApp Trigger |                           |                          | ## 3. Use the WhatsApp Trigger ...                                                                  |
| Sticky Note4               | Sticky Note                          | Handling unsupported message types     |                           |                          | ### 3a. Handle Unsupported Message Types                                                            |
| Sticky Note5               | Sticky Note                          | AI agent explanation and design notes  |                           |                          | ## 4. Sales AI Agent Responds To Customers ...                                                      |
| Sticky Note6               | Sticky Note                          | WhatsApp reply node explanation         |                           |                          | ## 5. Respond to WhatsApp User                                                                      |
| Sticky Note7               | Sticky Note                          | Full workflow explanation and setup guide |                           |                          | ### How it works ...                                                                                 |
| Sticky Note8               | Sticky Note                          | One-time execution note for product catalog |                           |                          | ### You only have to run this part once! Run this step to populate our product catalogue vector...  |
| Sticky Note9               | Sticky Note                          | Workflow activation reminder            |                           |                          | ### Activate your workflow to use!                                                                  |
| Sticky Note                | Sticky Note                          | Product brochure download explanation  |                           |                          | ## 1. Download Product Brochure PDF ...                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: To manually start the brochure download process during setup/testing.

2. **Add HTTP Request Node: "get Product Brochure"**  
   - Set URL to: `https://usa.yamaha.com/files/download/brochure/1/1474881/Yamaha-Powered-Loudspeakers-brochure-2024-en-web.pdf`  
   - Method: GET  
   - No authentication needed.  
   - Connect Manual Trigger to this node.

3. **Add Extract from File Node: "Extract from File"**  
   - Operation: PDF extraction  
   - Input: Connect from HTTP Request node.  
   - Outputs extracted text.

4. **Add Recursive Character Text Splitter Node**  
   - Chunk Size: 2000 characters  
   - Chunk Overlap: 0  
   - Input: Connected to output of `Default Data Loader` (next step).

5. **Add Default Data Loader Node**  
   - JSON Data: Use expression to extract text from "Extract from File" node: `={{ $('Extract from File').item.json.text }}`  
   - JSON Mode: Expression Data  
   - Connect output of Text Splitter to this node.

6. **Add Embeddings OpenAI Node: "Embeddings OpenAI1"**  
   - Model: `text-embedding-3-small`  
   - Credentials: Configure OpenAI API credentials.  
   - Input: Connect from `Default Data Loader`.

7. **Add Vector Store In-Memory Node: "Create Product Catalogue"**  
   - Mode: Insert  
   - Memory Key: `whatsapp-75`  
   - Clear store: True (to reset on each run)  
   - Inputs: Embeddings from `Embeddings OpenAI1`, document from `Default Data Loader`.

8. **Add Vector Store In-Memory Node: "Product Catalogue"**  
   - Memory Key: `whatsapp-75`  
   - This node holds the vector store for querying.  
   - Input: Connect from `Create Product Catalogue`.

9. **Add OpenAI Chat Model Node: "OpenAI Chat Model1"**  
   - Model: `gpt-4o-2024-08-06`  
   - Credentials: Use OpenAI API.  
   - Connect as language model node for `Vector Store Tool`.

10. **Add Embeddings OpenAI Node: "Embeddings OpenAI"**  
    - Model: `text-embedding-3-small`  
    - Credentials: OpenAI API.  
    - Connect as embedding node for `Vector Store Tool`.

11. **Add Vector Store Tool Node: "Vector Store Tool"**  
    - Name: `query_product_brochure`  
    - Description: "Call this tool to query the product brochure. Valid for the year 2024."  
    - Inputs: Connect `Product Catalogue` vector store, `OpenAI Chat Model1`, and `Embeddings OpenAI`.

12. **Add WhatsApp Trigger Node: "WhatsApp Trigger"**  
    - Configure webhook to receive WhatsApp messages (updates: messages).  
    - Ensure WhatsApp Business API is properly connected and webhook URL is accessible.  

13. **Add Switch Node: "Handle Message Types"**  
    - Conditions: Check if incoming message type equals `"text"` (case-sensitive).  
    - Output 1 ("Supported"): For text messages.  
    - Output 2 ("Not Supported"): For all other message types.

14. **Add WhatsApp Node: "Reply To User1"**  
    - Operation: Send message  
    - Text: `"I'm unable to process non-text messages. Please send only text messages. Thanks!"`  
    - Phone Number ID: Set your WhatsApp phone number ID.  
    - Recipient: Use expression to get sender phone number: `={{ $('WhatsApp Trigger').item.json.messages[0].from }}`  
    - Connect from "Not Supported" output of `Handle Message Types`.

15. **Add Langchain Agent Node: "AI Sales Agent"**  
    - Text Input: `={{ $json.messages[0].text.body }}` from WhatsApp Trigger  
    - System Message:  
      ```
      You are an assistant working for a company who sells Yamaha Powered Loudspeakers and helping the user navigate the product catalog for the year 2024. Your goal is not to facilitate a sale but if the user enquires, direct them to the appropriate website, url or contact information.

      Do your best to answer any questions factually. If you don't know the answer or unable to obtain the information from the datastore, then tell the user so.
      ```  
    - Prompt Type: Define  
    - Connect as:  
      - Language model: `OpenAI Chat Model` (create one with model `gpt-4o-2024-08-06`)  
      - Memory: `Window Buffer Memory` (create one with session key expression `=whatsapp-75-{{ $json.messages[0].from }}`)  
      - Tool: `Vector Store Tool`  
    - Connect from "Supported" output of `Handle Message Types`.

16. **Add OpenAI Chat Model Node: "OpenAI Chat Model"**  
    - Model: `gpt-4o-2024-08-06`  
    - Credentials: OpenAI API  
    - Connect to AI Sales Agent node.

17. **Add Window Buffer Memory Node: "Window Buffer Memory"**  
    - Session Key: `=whatsapp-75-{{ $json.messages[0].from }}`  
    - Session ID Type: Custom Key  
    - Connect memory to AI Sales Agent.

18. **Add WhatsApp Node: "Reply To User"**  
    - Operation: Send message  
    - Text: `={{ $json.output }}` (output from AI Sales Agent)  
    - Phone Number ID: Your WhatsApp phone number ID  
    - Recipient: `={{ $('WhatsApp Trigger').item.json.messages[0].from }}`  
    - Connect from AI Sales Agent output.

19. **Connect Flow**  
    - `WhatsApp Trigger` → `Handle Message Types`  
    - `Handle Message Types` (Supported) → `AI Sales Agent`  
    - `Handle Message Types` (Not Supported) → `Reply To User1`  
    - `AI Sales Agent` → `Reply To User`

20. **Activate Workflow**  
    - Ensure WhatsApp webhook is publicly accessible and properly configured.  
    - Enable OpenAI API credentials.  
    - Activate workflow in n8n.  
    - Run the manual trigger node once to populate the vector store.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Vector stores are powerful databases that link user questions to relevant document parts. For production, consider scalable vector stores like [Qdrant](https://qdrant.tech) or [Pinecone](https://pinecone.io) instead of in-memory vector stores.                                                                                                         | Sticky Note1                                                                                   |
| WhatsApp Trigger setup requires proper webhook configuration; it can receive various message types. This demo only supports text messages, rejecting others with a polite notice.                                                                                                                                                                         | Sticky Note2                                                                                   |
| Non-text messages (audio, video, images) are filtered out and replied to with a fixed message informing users to send text only.                                                                                                                                                                                                                          | Sticky Note4                                                                                   |
| The AI Sales Agent uses OpenAI GPT-4o and Langchain memory to maintain session context and access product brochure data from the vector store for factual answers.                                                                                                                                                                                         | Sticky Note5                                                                                   |
| The WhatsApp node is used to send text replies back to users, supporting media messages and templates for more advanced use cases.                                                                                                                                                                                                                         | Sticky Note6                                                                                   |
| This workflow automates a WhatsApp-based AI Sales Agent integrating OpenAI GPT-4o and a PDF knowledge base vector store to provide quick, factual customer support. Setup steps and operation details are documented in the workflow notes.                                                                                                                | Sticky Note7                                                                                   |
| The product catalogue vector store must be populated once or whenever the brochure is updated. Run the manual trigger node to refresh data.                                                                                                                                                                                                              | Sticky Note8                                                                                   |
| Activate the workflow and ensure WhatsApp is connected to your server to start live customer interaction.                                                                                                                                                                                                                                                  | Sticky Note9                                                                                   |
| Source brochure PDF: Yamaha Powered Loudspeakers 2024, available at https://usa.yamaha.com/files/download/brochure/1/1474881/Yamaha-Powered-Loudspeakers-brochure-2024-en-web.pdf                                                                                                                                                                             | Referenced in Sticky Note and HTTP Request node                                               |

---

# Disclaimer

The provided text and analysis derive exclusively from an n8n automation workflow. All data handled is legal, public, and the workflow complies with content policies. No illegal or protected content is contained herein.