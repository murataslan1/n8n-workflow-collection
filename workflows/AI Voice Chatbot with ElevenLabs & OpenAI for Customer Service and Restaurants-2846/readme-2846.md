AI Voice Chatbot with ElevenLabs & OpenAI for Customer Service and Restaurants

https://n8nworkflows.xyz/workflows/ai-voice-chatbot-with-elevenlabs---openai-for-customer-service-and-restaurants-2846


# AI Voice Chatbot with ElevenLabs & OpenAI for Customer Service and Restaurants

### 1. Workflow Overview

This workflow, titled **"AI Voice Chatbot with ElevenLabs & OpenAI for Customer Service and Restaurants"**, implements a voice-interactive chatbot system designed for commercial environments such as shops and restaurants. It integrates voice input/output capabilities from ElevenLabs with advanced AI processing using OpenAI and a Qdrant vector database for knowledge retrieval. The system enables users to ask questions vocally and receive spoken answers generated through retrieval-augmented generation (RAG).

The workflow is logically divided into the following blocks:

- **1.1 Input Reception via Webhook**: Captures user voice queries from ElevenLabs through an n8n webhook.
- **1.2 AI Agent Processing and Memory Management**: Processes the input question using an AI Agent node, which utilizes context memory and tools.
- **1.3 Knowledge Base Retrieval with Vector Store**: Retrieves relevant documents from the Qdrant vector database based on the user query.
- **1.4 Text Generation with OpenAI Chat Model**: Generates a coherent textual response using OpenAI’s language model.
- **1.5 Response Delivery to ElevenLabs**: Sends the generated answer back to ElevenLabs for speech synthesis and playback.
- **1.6 Knowledge Base Setup and Document Vectorization**: Initializes and refreshes the Qdrant collection, fetches documents from Google Drive, processes them into embeddings, and inserts them into Qdrant.
- **1.7 Workflow Testing and Integration Instructions**: Provides manual triggers and sticky notes guiding setup, testing, and website integration.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception via Webhook

- **Overview:**  
  This block listens for incoming POST requests from the ElevenLabs voice agent, receiving user questions to initiate the chatbot interaction.

- **Nodes Involved:**  
  - Listen

- **Node Details:**  
  - **Listen**  
    - Type: Webhook  
    - Role: Entry point for voice queries from ElevenLabs.  
    - Configuration:  
      - HTTP Method: POST  
      - Path: `test_voice_message_elevenlabs`  
      - Response Mode: `responseNode` (responds via downstream node)  
    - Input: External HTTP POST request containing JSON with user question.  
    - Output: Passes JSON payload to the next node (AI Agent).  
    - Edge Cases:  
      - Missing or malformed POST body could cause failures.  
      - Network or webhook misconfiguration may prevent triggering.  
    - Version: n8n webhook node version 2.

---

#### 1.2 AI Agent Processing and Memory Management

- **Overview:**  
  Processes the incoming question using a LangChain AI Agent node, which uses a system prompt and tools to generate an answer. It also maintains conversational context using a window buffer memory.

- **Nodes Involved:**  
  - AI Agent  
  - Window Buffer Memory

- **Node Details:**  
  - **AI Agent**  
    - Type: LangChain Agent Node  
    - Role: Core AI processing node that receives the question, invokes tools, and generates a response.  
    - Configuration:  
      - Input text expression: `={{ $json.body.question }}` (extracts question from webhook body)  
      - Prompt Type: "define" (custom prompt defined in node)  
      - Connected Tools: Vector Store Tool  
      - Connected Memory: Window Buffer Memory  
    - Input: JSON with user question from Listen node.  
    - Output: Response text sent to Respond to ElevenLabs node.  
    - Edge Cases:  
      - If question field missing, node may fail or produce empty output.  
      - AI model errors or API limits could cause failures.  
    - Version: 1.7

  - **Window Buffer Memory**  
    - Type: LangChain Memory Buffer (Window)  
    - Role: Maintains recent conversation history to provide context for AI Agent.  
    - Configuration: Default (no parameters set)  
    - Input: Conversation data from AI Agent.  
    - Output: Context passed back to AI Agent.  
    - Edge Cases: Memory overflow or context truncation if conversation too long.  
    - Version: 1.3

---

#### 1.3 Knowledge Base Retrieval with Vector Store

- **Overview:**  
  Retrieves relevant documents or data from the Qdrant vector database based on the user’s query, enabling retrieval-augmented generation.

- **Nodes Involved:**  
  - Vector Store Tool  
  - Qdrant Vector Store  
  - Embeddings OpenAI

- **Node Details:**  
  - **Vector Store Tool**  
    - Type: LangChain Vector Store Tool  
    - Role: Acts as a tool for the AI Agent to query the vector store.  
    - Configuration:  
      - Name: "company"  
      - Description: "Risponde alle domande relative a ciò che ti viene chiesto" (Responds to questions asked)  
    - Input: Query text from AI Agent.  
    - Output: Retrieved documents or relevant data to AI Agent.  
    - Edge Cases: Empty or irrelevant results if vector store not populated or query malformed.  
    - Version: 1

  - **Qdrant Vector Store**  
    - Type: LangChain Vector Store Qdrant Node  
    - Role: Interfaces with Qdrant vector database to perform similarity search.  
    - Configuration:  
      - Collection: Dynamic value `=COLLECTION` (environment or workflow variable)  
      - Credentials: Qdrant API (Hetzner)  
    - Input: Embeddings or query vectors.  
    - Output: Search results to Vector Store Tool.  
    - Edge Cases:  
      - API authentication errors.  
      - Collection not found or empty.  
      - Network timeouts.  
    - Version: 1

  - **Embeddings OpenAI**  
    - Type: LangChain Embeddings OpenAI Node  
    - Role: Generates embeddings for text to be stored or queried in Qdrant.  
    - Configuration: Default options.  
    - Credentials: OpenAI API  
    - Input: Text data.  
    - Output: Embeddings vectors to Qdrant Vector Store.  
    - Edge Cases: API rate limits, invalid text input.  
    - Version: 1.1

---

#### 1.4 Text Generation with OpenAI Chat Model

- **Overview:**  
  Generates a natural language response using OpenAI’s chat model, based on the retrieved knowledge and conversation context.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - OpenAI (supporting node for AI Agent)

- **Node Details:**  
  - **OpenAI Chat Model**  
    - Type: LangChain LM Chat OpenAI Node  
    - Role: Generates chat-based responses from prompts and context.  
    - Configuration: Default options.  
    - Credentials: OpenAI API  
    - Input: Prompt and context from AI Agent and Vector Store Tool.  
    - Output: Text response to Vector Store Tool and AI Agent.  
    - Edge Cases: API errors, rate limits, malformed prompts.  
    - Version: 1

  - **OpenAI**  
    - Type: LangChain LM Chat OpenAI Node  
    - Role: Used as language model by AI Agent for processing.  
    - Configuration: Default options.  
    - Credentials: OpenAI API  
    - Input: Text from AI Agent.  
    - Output: Response text to AI Agent.  
    - Edge Cases: Same as above.  
    - Version: 1

---

#### 1.5 Response Delivery to ElevenLabs

- **Overview:**  
  Sends the generated textual response back to ElevenLabs via webhook response, enabling voice synthesis and playback to the user.

- **Nodes Involved:**  
  - Respond to ElevenLabs

- **Node Details:**  
  - **Respond to ElevenLabs**  
    - Type: Respond to Webhook Node  
    - Role: Sends HTTP response back to the ElevenLabs webhook caller.  
    - Configuration: Default (responds with data from AI Agent).  
    - Input: Response text from AI Agent.  
    - Output: HTTP response to ElevenLabs.  
    - Edge Cases: Network errors, response formatting issues.  
    - Version: 1.1

---

#### 1.6 Knowledge Base Setup and Document Vectorization

- **Overview:**  
  Prepares the Qdrant vector database by creating and refreshing collections, downloads documents from Google Drive, processes them into embeddings, and inserts them into Qdrant for retrieval.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Create collection (HTTP Request)  
  - Refresh collection (HTTP Request)  
  - Get folder (Google Drive)  
  - Download Files (Google Drive)  
  - Default Data Loader (LangChain Document Loader)  
  - Token Splitter (LangChain Text Splitter)  
  - Embeddings OpenAI1 (LangChain Embeddings OpenAI)  
  - Qdrant Vector Store1 (LangChain Vector Store Qdrant)

- **Node Details:**  
  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Starts the collection creation and refresh process manually.  
    - Output: Triggers Create collection and Refresh collection nodes.  
    - Version: 1

  - **Create collection**  
    - Type: HTTP Request  
    - Role: Creates a new collection in Qdrant.  
    - Configuration:  
      - URL: `https://QDRANTURL/collections/COLLECTION` (replace placeholders)  
      - Method: POST  
      - Body: JSON with empty filter `{ "filter": {} }`  
      - Headers: Content-Type application/json  
      - Authentication: HTTP Header Auth with Qdrant API credentials  
    - Output: Response from Qdrant API.  
    - Edge Cases: API errors, invalid URL or credentials.  
    - Version: 4.2

  - **Refresh collection**  
    - Type: HTTP Request  
    - Role: Deletes all points in the Qdrant collection to refresh data.  
    - Configuration:  
      - URL: `https://QDRANTURL/collections/COLLECTION/points/delete`  
      - Method: POST  
      - Body: JSON with empty filter `{ "filter": {} }`  
      - Headers and Auth same as Create collection.  
    - Output: Response from Qdrant API.  
    - Edge Cases: Same as above.  
    - Version: 4.2

  - **Get folder**  
    - Type: Google Drive Node  
    - Role: Lists files in a specified Google Drive folder.  
    - Configuration:  
      - Drive ID: "My Drive"  
      - Folder ID: `=test-whatsapp` (dynamic or fixed folder)  
      - Resource: fileFolder  
      - Credentials: Google Drive OAuth2  
    - Output: List of files metadata.  
    - Edge Cases: Permission errors, empty folder.  
    - Version: 3

  - **Download Files**  
    - Type: Google Drive Node  
    - Role: Downloads each file from Google Drive for processing.  
    - Configuration:  
      - File ID: `={{ $json.id }}` (from Get folder)  
      - Operation: download  
      - Conversion: Google Docs to plain text (`text/plain`)  
      - Credentials: Google Drive OAuth2  
    - Output: Binary file content.  
    - Edge Cases: Download failures, unsupported file types.  
    - Version: 3

  - **Default Data Loader**  
    - Type: LangChain Document Default Data Loader  
    - Role: Loads downloaded binary files as documents for embedding.  
    - Configuration: Data type set to binary.  
    - Input: Binary data from Download Files.  
    - Output: Document objects for splitting.  
    - Edge Cases: Unsupported file formats, corrupt files.  
    - Version: 1

  - **Token Splitter**  
    - Type: LangChain Text Splitter (Token Splitter)  
    - Role: Splits documents into chunks of 300 tokens with 30 tokens overlap for embedding.  
    - Configuration:  
      - Chunk Size: 300 tokens  
      - Chunk Overlap: 30 tokens  
    - Input: Documents from Default Data Loader.  
    - Output: Text chunks for embedding.  
    - Edge Cases: Very short documents may produce fewer chunks.  
    - Version: 1

  - **Embeddings OpenAI1**  
    - Type: LangChain Embeddings OpenAI  
    - Role: Generates embeddings for text chunks.  
    - Configuration: Default.  
    - Credentials: OpenAI API.  
    - Input: Text chunks from Token Splitter.  
    - Output: Embeddings vectors.  
    - Edge Cases: API limits, invalid text.  
    - Version: 1.1

  - **Qdrant Vector Store1**  
    - Type: LangChain Vector Store Qdrant  
    - Role: Inserts embeddings into the Qdrant collection.  
    - Configuration:  
      - Mode: Insert  
      - Collection: `=COLLECTION`  
      - Credentials: Qdrant API  
    - Input: Embeddings from Embeddings OpenAI1 and documents from Default Data Loader.  
    - Output: Confirmation of insertion.  
    - Edge Cases: API errors, collection not found.  
    - Version: 1

---

#### 1.7 Workflow Testing and Integration Instructions

- **Overview:**  
  Provides manual triggers and sticky notes with detailed instructions for setup, testing, and embedding the chatbot widget on a website.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Sticky Note (multiple)

- **Node Details:**  
  - **When clicking ‘Test workflow’**  
    - Manual trigger to start collection creation and refresh.  
  - **Sticky Notes**  
    - Provide stepwise instructions for:  
      - Creating ElevenLabs agent and webhook setup.  
      - Creating and refreshing Qdrant collections.  
      - Document vectorization process.  
      - Testing the RAG system end-to-end.  
      - Adding the chatbot widget to a website with the correct agent ID.  
    - Sticky notes contain important links and configuration reminders.  
    - Edge Cases: User misconfiguration or skipping steps may cause failures.

---

### 3. Summary Table

| Node Name               | Node Type                                  | Functional Role                                  | Input Node(s)                   | Output Node(s)               | Sticky Note                                                                                                    |
|-------------------------|--------------------------------------------|-------------------------------------------------|--------------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------|
| Listen                  | Webhook                                    | Receives voice queries from ElevenLabs          | (External HTTP POST)            | AI Agent                    |                                                                                                               |
| AI Agent                | LangChain Agent                            | Processes question, uses tools and memory        | Listen, Vector Store Tool, Window Buffer Memory, OpenAI | Respond to ElevenLabs        |                                                                                                               |
| Window Buffer Memory    | LangChain Memory Buffer Window             | Maintains conversation context                    | AI Agent                       | AI Agent                    |                                                                                                               |
| Vector Store Tool       | LangChain Vector Store Tool                 | Queries Qdrant vector store for relevant data    | OpenAI Chat Model              | AI Agent                    |                                                                                                               |
| Qdrant Vector Store     | LangChain Vector Store Qdrant               | Interfaces with Qdrant DB for similarity search  | Embeddings OpenAI              | Vector Store Tool           |                                                                                                               |
| Embeddings OpenAI       | LangChain Embeddings OpenAI                 | Generates embeddings for queries                  | (Documents or text)            | Qdrant Vector Store         |                                                                                                               |
| OpenAI Chat Model       | LangChain LM Chat OpenAI                     | Generates AI text responses                        | Vector Store Tool              | Vector Store Tool, AI Agent |                                                                                                               |
| OpenAI                  | LangChain LM Chat OpenAI                     | Language model for AI Agent                        | AI Agent                      | AI Agent                    |                                                                                                               |
| Respond to ElevenLabs   | Respond to Webhook                          | Sends AI response back to ElevenLabs              | AI Agent                      | (HTTP Response)             |                                                                                                               |
| When clicking ‘Test workflow’ | Manual Trigger                          | Starts collection creation and refresh            | -                             | Create collection, Refresh collection |                                                                                                               |
| Create collection       | HTTP Request                               | Creates Qdrant collection                          | When clicking ‘Test workflow’  | Refresh collection          | # STEP 2: Create Qdrant Collection. Change QDRANTURL and COLLECTION placeholders.                              |
| Refresh collection      | HTTP Request                               | Deletes all points in Qdrant collection           | Create collection             | Get folder                  | # STEP 2: Create Qdrant Collection. Change QDRANTURL and COLLECTION placeholders.                              |
| Get folder              | Google Drive                               | Lists files in Google Drive folder                 | Refresh collection            | Download Files              | # STEP 3: Documents vectorization with Qdrant and Google Drive. Change QDRANTURL and COLLECTION placeholders. |
| Download Files          | Google Drive                               | Downloads files from Google Drive                  | Get folder                   | Qdrant Vector Store1        | # STEP 3: Documents vectorization with Qdrant and Google Drive. Change QDRANTURL and COLLECTION placeholders. |
| Default Data Loader     | LangChain Document Default Data Loader      | Loads downloaded files as documents                | Token Splitter               | Qdrant Vector Store1        | # STEP 3: Documents vectorization with Qdrant and Google Drive. Change QDRANTURL and COLLECTION placeholders. |
| Token Splitter          | LangChain Text Splitter (Token Splitter)   | Splits documents into token chunks                 | Default Data Loader          | Default Data Loader         |                                                                                                               |
| Embeddings OpenAI1      | LangChain Embeddings OpenAI                 | Generates embeddings for document chunks           | Token Splitter               | Qdrant Vector Store1        | # STEP 3: Documents vectorization with Qdrant and Google Drive. Change QDRANTURL and COLLECTION placeholders. |
| Qdrant Vector Store1    | LangChain Vector Store Qdrant               | Inserts embeddings into Qdrant collection          | Embeddings OpenAI1, Default Data Loader | -                         | # STEP 3: Documents vectorization with Qdrant and Google Drive. Change QDRANTURL and COLLECTION placeholders. |
| Sticky Note             | Sticky Note                                | Setup instructions for ElevenLabs agent creation  | -                             | -                           | # STEP 1: Create an Agent on ElevenLabs with webhook and prompts.                                              |
| Sticky Note3            | Sticky Note                                | Instructions for Qdrant collection creation        | -                             | -                           | # STEP 2: Create Qdrant Collection. Change QDRANTURL and COLLECTION.                                           |
| Sticky Note4            | Sticky Note                                | Instructions for RAG system testing                 | -                             | -                           | # STEP 4: Test workflow and AI agent interaction with ElevenLabs.                                             |
| Sticky Note5            | Sticky Note                                | Instructions for document vectorization             | -                             | -                           | # STEP 3: Documents vectorization with Qdrant and Google Drive.                                               |
| Sticky Note6            | Sticky Note                                | Instructions for adding chatbot widget to website  | -                             | -                           | # STEP 5: Add widget to website replacing AGENT_ID with ElevenLabs agent id.                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Webhook Node (Listen):**  
   - Add a Webhook node named `Listen`.  
   - Set HTTP Method to `POST`.  
   - Set Path to `test_voice_message_elevenlabs`.  
   - Set Response Mode to `responseNode`.  
   - This node will receive JSON payloads containing a `question` field from ElevenLabs.

2. **Add AI Agent Node:**  
   - Add LangChain Agent node named `AI Agent`.  
   - Set the input text to expression: `={{ $json.body.question }}` to extract the question from webhook body.  
   - Set Prompt Type to `define` and configure your custom system prompt (e.g., waiter at "Pizzeria da Michele").  
   - Connect AI Agent’s `ai_tool` input to the Vector Store Tool node (to be created).  
   - Connect AI Agent’s `ai_memory` input to the Window Buffer Memory node (to be created).  
   - Connect AI Agent’s `ai_languageModel` input to the OpenAI node (to be created).  
   - Connect output to Respond to ElevenLabs node.

3. **Add Window Buffer Memory Node:**  
   - Add LangChain Memory Buffer Window node named `Window Buffer Memory`.  
   - Use default settings.  
   - Connect output to AI Agent’s memory input.

4. **Add Vector Store Tool Node:**  
   - Add LangChain Vector Store Tool node named `Vector Store Tool`.  
   - Set Name to `"company"`.  
   - Set Description to `"Risponde alle domande relative a ciò che ti viene chiesto"`.  
   - Connect its `ai_vectorStore` input to Qdrant Vector Store node.  
   - Connect output to AI Agent’s tool input.

5. **Add Qdrant Vector Store Node:**  
   - Add LangChain Vector Store Qdrant node named `Qdrant Vector Store`.  
   - Set Collection to expression `=COLLECTION` (replace with your collection name or environment variable).  
   - Set credentials to your Qdrant API credentials.  
   - Connect input from Embeddings OpenAI node.  
   - Connect output to Vector Store Tool node.

6. **Add Embeddings OpenAI Node:**  
   - Add LangChain Embeddings OpenAI node named `Embeddings OpenAI`.  
   - Use default options.  
   - Set credentials to your OpenAI API credentials.  
   - Connect output to Qdrant Vector Store node.

7. **Add OpenAI Chat Model Node:**  
   - Add LangChain LM Chat OpenAI node named `OpenAI Chat Model`.  
   - Use default options.  
   - Set credentials to your OpenAI API credentials.  
   - Connect output to Vector Store Tool node’s `ai_languageModel` input.

8. **Add OpenAI Node (for AI Agent):**  
   - Add LangChain LM Chat OpenAI node named `OpenAI`.  
   - Use default options.  
   - Set credentials to your OpenAI API credentials.  
   - Connect output to AI Agent’s `ai_languageModel` input.

9. **Add Respond to Webhook Node:**  
   - Add Respond to Webhook node named `Respond to ElevenLabs`.  
   - Use default settings to send response back to ElevenLabs.  
   - Connect input from AI Agent node.

10. **Set up Knowledge Base Initialization:**

    - **Manual Trigger:**  
      - Add Manual Trigger node named `When clicking ‘Test workflow’`.  
      - Connect output to `Create collection` and `Refresh collection` nodes.

    - **Create Collection:**  
      - Add HTTP Request node named `Create collection`.  
      - Set Method to POST.  
      - URL: `https://QDRANTURL/collections/COLLECTION` (replace placeholders).  
      - Body: JSON `{ "filter": {} }`.  
      - Headers: Content-Type `application/json`.  
      - Authentication: HTTP Header Auth with Qdrant API credentials.

    - **Refresh Collection:**  
      - Add HTTP Request node named `Refresh collection`.  
      - Set Method to POST.  
      - URL: `https://QDRANTURL/collections/COLLECTION/points/delete`.  
      - Body: JSON `{ "filter": {} }`.  
      - Headers and Auth same as Create collection.

11. **Add Google Drive Nodes for Document Vectorization:**

    - **Get Folder:**  
      - Add Google Drive node named `Get folder`.  
      - Set Resource to `fileFolder`.  
      - Set Drive ID to `"My Drive"`.  
      - Set Folder ID to your target folder (e.g., `test-whatsapp`).  
      - Set credentials to your Google Drive OAuth2 account.  
      - Connect output from `Refresh collection`.

    - **Download Files:**  
      - Add Google Drive node named `Download Files`.  
      - Set Operation to `download`.  
      - Set File ID to expression `={{ $json.id }}` from `Get folder`.  
      - Enable Google Docs conversion to `text/plain`.  
      - Set credentials to Google Drive OAuth2.  
      - Connect output from `Get folder`.

12. **Add Document Processing Nodes:**

    - **Default Data Loader:**  
      - Add LangChain Document Default Data Loader node named `Default Data Loader`.  
      - Set Data Type to `binary`.  
      - Connect output from `Token Splitter`.

    - **Token Splitter:**  
      - Add LangChain Text Splitter Token Splitter node named `Token Splitter`.  
      - Set Chunk Size to 300 tokens.  
      - Set Chunk Overlap to 30 tokens.  
      - Connect output from `Default Data Loader`.

    - **Embeddings OpenAI1:**  
      - Add LangChain Embeddings OpenAI node named `Embeddings OpenAI1`.  
      - Use default options.  
      - Set credentials to OpenAI API.  
      - Connect output from `Token Splitter`.

    - **Qdrant Vector Store1:**  
      - Add LangChain Vector Store Qdrant node named `Qdrant Vector Store1`.  
      - Set Mode to `insert`.  
      - Set Collection to expression `=COLLECTION`.  
      - Set credentials to Qdrant API.  
      - Connect inputs from `Embeddings OpenAI1` and `Default Data Loader`.

13. **Connect Knowledge Base Setup Flow:**  
    - Connect `When clicking ‘Test workflow’` to `Create collection` and `Refresh collection`.  
    - Connect `Refresh collection` to `Get folder`.  
    - Connect `Get folder` to `Download Files`.  
    - Connect `Download Files` to `Qdrant Vector Store1` (via `Default Data Loader`, `Token Splitter`, and `Embeddings OpenAI1` as above).

14. **Testing and Integration:**  
    - Use the manual trigger `When clicking ‘Test workflow’` to initialize and refresh your Qdrant collection.  
    - Use ElevenLabs interface to test the voice agent, which triggers the webhook and starts the AI processing.  
    - Monitor logs and outputs for errors.  
    - Add the chatbot widget to your website by embedding the provided HTML snippet, replacing `AGENT_ID` with your ElevenLabs agent ID:  
      ```html
      <elevenlabs-convai agent-id="AGENT_ID"></elevenlabs-convai>
      <script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"></script>
      ```

---

This detailed reference document enables advanced users and AI agents to fully understand, reproduce, and modify the "AI Voice Chatbot with ElevenLabs & OpenAI" workflow, anticipate potential issues, and integrate it effectively into customer service or restaurant environments.