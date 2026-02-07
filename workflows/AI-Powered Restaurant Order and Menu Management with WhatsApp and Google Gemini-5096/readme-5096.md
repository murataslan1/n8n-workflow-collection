AI-Powered Restaurant Order and Menu Management with WhatsApp and Google Gemini

https://n8nworkflows.xyz/workflows/ai-powered-restaurant-order-and-menu-management-with-whatsapp-and-google-gemini-5096


# AI-Powered Restaurant Order and Menu Management with WhatsApp and Google Gemini

---

### 1. Workflow Overview

This workflow automates restaurant order and menu management leveraging AI-powered conversational capabilities integrated with WhatsApp and Google Gemini. It targets restaurants seeking an interactive, intelligent interface for order placement, menu updates, and delivery coordination using a conversational agent accessible via WhatsApp.

The workflow is logically divided into the following blocks:

- **1.1 WhatsApp Input Reception & User Management:** Handles incoming WhatsApp messages, verifies user existence in the database, and adds new users as needed.
- **1.2 AI Conversational Agent Processing:** Manages the AI agent’s memory, language model interaction (Google Gemini), outputs parsing, and decision branching based on user intent.
- **1.3 Order Handling and Delivery Notification:** Stores customer orders in the database and notifies the delivery personnel via WhatsApp.
- **1.4 Menu Item Management:** Provides a form-based interface to add new menu items, which are embedded and stored in a vector database to support semantic search.
- **1.5 Vector Store & Embeddings Integration:** Manages embedding generation of menu items and queries the vector store for menu retrieval.
- **1.6 Default Data Loading:** Loads initial menu data into the vector store to seed the knowledge base.

---

### 2. Block-by-Block Analysis

#### 1.1 WhatsApp Input Reception & User Management

- **Overview:**  
Receives WhatsApp messages, retrieves or creates user profiles in the Supabase database to maintain user context across conversations.

- **Nodes Involved:**  
  - WhatsApp Trigger  
  - Get user (Supabase)  
  - Check if user exists (If)  
  - Add user to db (Supabase)  

- **Node Details:**

  - **WhatsApp Trigger**  
    - *Type:* WhatsApp message webhook trigger  
    - *Role:* Entry point for inbound WhatsApp messages  
    - *Config:* Listens on a dedicated webhook; no parameters needed for basic operation  
    - *Connections:* Outputs to Get user node  
    - *Edge cases:* Webhook misconfiguration, WhatsApp API downtime, malformed messages

  - **Get user**  
    - *Type:* Supabase database query  
    - *Role:* Fetch user details based on incoming WhatsApp identifier (e.g., phone number)  
    - *Config:* Queries user table for matching contact  
    - *Inputs:* Data from WhatsApp Trigger  
    - *Outputs:* To Check if user exists node  
    - *Edge cases:* Database connectivity issues, missing or malformed identifiers

  - **Check if user exists**  
    - *Type:* Conditional (If) node  
    - *Role:* Branches workflow depending on user existence  
    - *Config:* Checks if data returned from Get user is empty or not  
    - *Inputs:* Output from Get user  
    - *Outputs:*  
      - True (user exists) → AI Agent  
      - False (user missing) → Add user to db  
    - *Edge cases:* Improper condition expression, empty results handling

  - **Add user to db**  
    - *Type:* Supabase insert operation  
    - *Role:* Inserts new user data into the database  
    - *Config:* Uses data from WhatsApp Trigger to create user record  
    - *Inputs:* From Check if user exists (false branch)  
    - *Outputs:* To AI Agent  
    - *Edge cases:* Database write failures, duplicate entries, validation errors

---

#### 1.2 AI Conversational Agent Processing

- **Overview:**  
Processes user interactions with an AI agent using Google Gemini chat model, manages conversation memory, parses structured outputs, and controls message sending.

- **Nodes Involved:**  
  - Simple Memory (Langchain memoryBufferWindow)  
  - Google Gemini Chat Model  
  - AI Agent (Langchain Agent)  
  - Structured Output Parser  
  - Google Gemini Chat Model1  
  - Send last message (WhatsApp)  
  - If (conditional on AI response)  

- **Node Details:**

  - **Simple Memory**  
    - *Type:* Langchain memory buffer window  
    - *Role:* Maintains recent conversational context for AI agent  
    - *Config:* Configured to hold a sliding window of messages (default size, e.g., last few interactions)  
    - *Inputs:* Connected from previous nodes or initial context  
    - *Outputs:* To AI Agent’s memory input  
    - *Edge cases:* Memory overflow or loss, improper state persistence

  - **Google Gemini Chat Model** (first instance)  
    - *Type:* Language model interface  
    - *Role:* Provides language understanding and generation capabilities for AI Agent  
    - *Config:* Uses Google Gemini credentials and settings  
    - *Inputs:* Memory and prompt data  
    - *Outputs:* To AI Agent node  
    - *Edge cases:* API quota limits, network errors, invalid credentials

  - **AI Agent**  
    - *Type:* Langchain conversational agent  
    - *Role:* Core component that integrates memory, language model, tool usage, and output parsing to generate responses  
    - *Config:* Configured with language model, memory, tools (e.g., database access), and output parser  
    - *Inputs:* From user data and memory nodes  
    - *Outputs:* To Send last message node  
    - *Edge cases:* Tool invocation errors, malformed AI responses, timeout

  - **Structured Output Parser**  
    - *Type:* Langchain output parser  
    - *Role:* Parses AI agent’s raw outputs into structured data formats for downstream processing  
    - *Config:* Defines output schema and parsing rules  
    - *Inputs:* From Google Gemini Chat Model1  
    - *Outputs:* To AI Agent node  
    - *Edge cases:* Parsing failures due to unexpected AI output formats

  - **Google Gemini Chat Model1** (second instance)  
    - *Type:* Language model interface  
    - *Role:* Used specifically for output parsing or secondary language model tasks  
    - *Config:* Similar to first instance, configured with Google Gemini credentials  
    - *Inputs:* From Structured Output Parser  
    - *Outputs:* To Structured Output Parser node  
    - *Edge cases:* Similar to first instance

  - **Send last message**  
    - *Type:* WhatsApp message sender  
    - *Role:* Sends AI-generated responses back to the user on WhatsApp  
    - *Config:* Utilizes WhatsApp API with configured webhook for outbound messages  
    - *Inputs:* From AI Agent  
    - *Outputs:* To If node for further decision branching  
    - *Edge cases:* WhatsApp API downtime, message format errors

  - **If** (after sending message)  
    - *Type:* Conditional node  
    - *Role:* Checks AI agent’s response or conversation state to decide next steps, e.g., whether to send order to delivery  
    - *Config:* Condition based on AI response content or flags  
    - *Inputs:* From Send last message  
    - *Outputs:*  
      - True → Send Order to delivery guy  
      - False → Ends or loops back  
    - *Edge cases:* Incorrect condition expressions, missing data

---

#### 1.3 Order Handling and Delivery Notification

- **Overview:**  
Creates new order entries in the database and notifies delivery personnel via WhatsApp upon confirmation.

- **Nodes Involved:**  
  - Create order in database (Supabase Tool)  
  - Send Order to delivery guy (WhatsApp)  

- **Node Details:**

  - **Create order in database**  
    - *Type:* Supabase Tool (database write)  
    - *Role:* Inserts new order details collected from AI Agent into orders table  
    - *Config:* Takes structured order data as input  
    - *Inputs:* From AI Agent’s tool output  
    - *Outputs:* To AI Agent (for confirmation or further processing)  
    - *Edge cases:* Write failures, data validation errors, concurrency conflicts

  - **Send Order to delivery guy**  
    - *Type:* WhatsApp message sender  
    - *Role:* Sends order details to delivery staff via WhatsApp for fulfillment  
    - *Config:* Uses delivery contact number and formatted message template  
    - *Inputs:* From If node (conditional branch)  
    - *Outputs:* None (endpoint)  
    - *Edge cases:* Delivery contact invalid, WhatsApp API errors

---

#### 1.4 Menu Item Management

- **Overview:**  
Allows adding new menu items via a form submission, embedding them into the vector store for semantic search and retrieval.

- **Nodes Involved:**  
  - Add menu item (Form Trigger)  
  - Insert Menu Item to Vector Store (Langchain vector store Supabase)  

- **Node Details:**

  - **Add menu item**  
    - *Type:* Form Trigger webhook  
    - *Role:* Entry point for manual menu item additions via web form  
    - *Config:* Configured webhook URL and expected form fields (e.g., item name, description, price)  
    - *Inputs:* External via form submission  
    - *Outputs:* To Insert Menu Item to Vector Store  
    - *Edge cases:* Invalid form data, missing fields, webhook access issues

  - **Insert Menu Item to Vector Store**  
    - *Type:* Langchain vector store integration (Supabase)  
    - *Role:* Embeds new menu item text using embeddings model and stores vector in Supabase vector store  
    - *Config:* Connected to embeddings node for vector creation  
    - *Inputs:* From Add menu item and Default Data Loader nodes  
    - *Outputs:* None (endpoint for vector storage)  
    - *Edge cases:* Embedding generation failures, database write errors

---

#### 1.5 Vector Store & Embeddings Integration

- **Overview:**  
Generates embeddings for menu items and queries the vector store to support intelligent retrieval during AI interactions.

- **Nodes Involved:**  
  - Embeddings Google Gemini  
  - Get Menu Items from Vector Store (Langchain vector store Supabase)  

- **Node Details:**

  - **Embeddings Google Gemini**  
    - *Type:* Embeddings generation via Google Gemini  
    - *Role:* Converts text inputs (menu items) into vector embeddings used for semantic search  
    - *Config:* Uses Google Gemini embedding API and credentials  
    - *Inputs:* From menu item data or Default Data Loader  
    - *Outputs:* To Insert Menu Item to Vector Store and Get Menu Items from Vector Store  
    - *Edge cases:* API limits, malformed inputs

  - **Get Menu Items from Vector Store**  
    - *Type:* Langchain vector store query  
    - *Role:* Retrieves relevant menu items by similarity search for AI Agent use  
    - *Config:* Queries Supabase vector store using user query embeddings  
    - *Inputs:* From Embeddings Google Gemini  
    - *Outputs:* To AI Agent as tool output  
    - *Edge cases:* No matching results, query timeouts

---

#### 1.6 Default Data Loading

- **Overview:**  
Preloads default menu data into the vector store on workflow initialization or trigger to seed the AI knowledge base.

- **Nodes Involved:**  
  - Default Data Loader  
  - Insert Menu Item to Vector Store  

- **Node Details:**

  - **Default Data Loader**  
    - *Type:* Langchain document loader (default data)  
    - *Role:* Loads predefined menu documents for embedding and storage  
    - *Config:* Points to static or configured data source (e.g., CSV, JSON)  
    - *Inputs:* Triggered manually or on startup  
    - *Outputs:* To Insert Menu Item to Vector Store  
    - *Edge cases:* Missing or corrupted data sources

---

### 3. Summary Table

| Node Name                   | Node Type                            | Functional Role                         | Input Node(s)                  | Output Node(s)                    | Sticky Note                                                |
|-----------------------------|------------------------------------|---------------------------------------|-------------------------------|---------------------------------|------------------------------------------------------------|
| WhatsApp Trigger            | WhatsApp Trigger                   | Entry point for WhatsApp messages     | -                             | Get user                        |                                                            |
| Get user                   | Supabase                          | Retrieve user profile from DB         | WhatsApp Trigger              | Check if user exists            |                                                            |
| Check if user exists       | If                                | Branch based on user presence         | Get user                     | AI Agent, Add user to db        |                                                            |
| Add user to db             | Supabase                          | Insert new user in DB                  | Check if user exists          | AI Agent                       |                                                            |
| Simple Memory              | Langchain memoryBufferWindow      | Manage conversation context memory    | - (from workflow context)    | AI Agent (memory input)         |                                                            |
| Google Gemini Chat Model   | Langchain LM Chat Model           | AI language processing                 | Simple Memory                | AI Agent                       |                                                            |
| AI Agent                   | Langchain Agent                   | Core conversational AI agent          | Get user, Add user to db, Memory | Send last message             |                                                            |
| Structured Output Parser   | Langchain Output Parser           | Parse AI outputs into structured form | Google Gemini Chat Model1    | AI Agent                       |                                                            |
| Google Gemini Chat Model1  | Langchain LM Chat Model           | Secondary language model for parsing  | Structured Output Parser     | Structured Output Parser       |                                                            |
| Send last message          | WhatsApp                         | Send AI response to user via WhatsApp | AI Agent                     | If                            |                                                            |
| If                        | If                                | Branching based on AI response        | Send last message            | Send Order to delivery guy     |                                                            |
| Create order in database   | Supabase Tool                    | Store user order in DB                 | AI Agent                     | AI Agent                      |                                                            |
| Send Order to delivery guy | WhatsApp                         | Notify delivery personnel              | If                          | -                             |                                                            |
| Add menu item              | Form Trigger                    | Web form to add menu items             | External form submissions    | Insert Menu Item to Vector Store |                                                            |
| Insert Menu Item to Vector Store | Langchain vectorStoreSupabase | Store embedded menu items              | Add menu item, Default Data Loader | -                          |                                                            |
| Default Data Loader        | Langchain documentDefaultDataLoader | Load default menu data                  | -                           | Insert Menu Item to Vector Store |                                                            |
| Embeddings Google Gemini   | Langchain Embeddings Google Gemini | Generate embeddings for menu items     | Add menu item, Default Data Loader | Insert Menu Item to Vector Store, Get Menu Items from Vector Store |                                                            |
| Get Menu Items from Vector Store | Langchain vectorStoreSupabase | Retrieve menu items by similarity search | Embeddings Google Gemini     | AI Agent                      |                                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create WhatsApp Trigger node:**  
   - Type: WhatsApp Trigger  
   - Configure webhook for incoming WhatsApp messages  
   - No additional parameters needed

2. **Add Supabase ‘Get user’ node:**  
   - Type: Supabase  
   - Configure credentials for Supabase project  
   - Query users table filtering by phone number from WhatsApp Trigger data

3. **Add ‘Check if user exists’ If node:**  
   - Type: If  
   - Condition: Check if Supabase ‘Get user’ returned any records (e.g., length > 0)  
   - True branch: user exists  
   - False branch: user does not exist

4. **Add Supabase ‘Add user to db’ node:**  
   - Type: Supabase  
   - Configure insert operation into users table  
   - Use WhatsApp Trigger data for new user details  
   - Connect from ‘Check if user exists’ false branch

5. **Add Simple Memory node:**  
   - Type: Langchain memoryBufferWindow  
   - Use default window size or configure as needed for conversation history

6. **Add Google Gemini Chat Model node:**  
   - Type: Langchain LM Chat Google Gemini  
   - Configure Google Gemini credentials and parameters

7. **Add AI Agent node:**  
   - Type: Langchain Agent  
   - Configure with:  
     - Linked Language Model (Google Gemini Chat Model)  
     - Memory (Simple Memory node)  
     - Tools: Include ‘Create order in database’ and vector store query nodes  
     - Output parser (Structured Output Parser node)  
   - Connect inputs from Get user (true branch) and Add user to db (false branch)  
   - Connect memory and language model accordingly

8. **Add Structured Output Parser node:**  
   - Type: Langchain outputParserStructured  
   - Define expected output schema (e.g., order details, intent flags)  
   - Connect output from secondary Google Gemini Chat Model1 node

9. **Add second Google Gemini Chat Model1 node:**  
   - Type: Langchain LM Chat Google Gemini  
   - Configure similarly to first instance  
   - Connect its output to Structured Output Parser node

10. **Add ‘Send last message’ WhatsApp node:**  
    - Type: WhatsApp  
    - Configure WhatsApp API credentials and webhook for outbound messages  
    - Connect input from AI Agent output

11. **Add If node (post message):**  
    - Type: If  
    - Condition: Based on AI response (e.g., order confirmed)  
    - True branch: Connect to ‘Send Order to delivery guy’ node  
    - False branch: No action or loop back

12. **Add ‘Create order in database’ Supabase Tool node:**  
    - Type: Supabase Tool  
    - Configure insert into orders table with order details from AI Agent  
    - Connect as AI Agent tool

13. **Add ‘Send Order to delivery guy’ WhatsApp node:**  
    - Type: WhatsApp  
    - Configure to send order notification message to delivery contact  
    - Connect from If node true branch

14. **Add ‘Add menu item’ Form Trigger node:**  
    - Type: Form Trigger (webhook)  
    - Define expected form fields (menu item name, description, price)  
    - Configure webhook URL

15. **Add ‘Embeddings Google Gemini’ node:**  
    - Type: Langchain Embeddings Google Gemini  
    - Configure embedding API credentials

16. **Add ‘Insert Menu Item to Vector Store’ node:**  
    - Type: Langchain vectorStoreSupabase  
    - Configure to insert embeddings into Supabase vector store  
    - Connect input from Add menu item and Default Data Loader nodes  
    - Connect embeddings input from Embeddings Google Gemini node

17. **Add ‘Get Menu Items from Vector Store’ node:**  
    - Type: Langchain vectorStoreSupabase  
    - Configure to perform similarity search queries  
    - Connect embeddings input from Embeddings Google Gemini node  
    - Connect output to AI Agent tool inputs

18. **Add ‘Default Data Loader’ node:**  
    - Type: Langchain documentDefaultDataLoader  
    - Configure to load initial menu data (static JSON, CSV, or other)  
    - Connect output to Insert Menu Item to Vector Store node

19. **Wire all nodes according to described connections:**  
    - WhatsApp Trigger → Get user → Check if user exists → (true) AI Agent; (false) Add user to db → AI Agent  
    - AI Agent → Send last message → If → Send Order to delivery guy (true)  
    - AI Agent tool → Create order in database  
    - Add menu item → Insert Menu Item to Vector Store (with embeddings)  
    - Default Data Loader → Insert Menu Item to Vector Store  
    - Embeddings Google Gemini → Insert Menu Item to Vector Store and Get Menu Items from Vector Store  
    - Get Menu Items from Vector Store → AI Agent tool  
    - AI Agent connected with language models, memory, and output parsers as described

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                   |
|----------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow leverages Google Gemini model for both chat and embeddings, requiring Google Cloud credentials setup. | See Google Gemini API documentation for authentication and usage guidelines.                      |
| Supabase is used as both primary database and vector store backend, ensure Supabase project is properly configured with vector extensions enabled. | Supabase docs: https://supabase.com/docs                                                        |
| WhatsApp integration requires proper API setup including webhooks for inbound and outbound message handling.   | WhatsApp Business API documentation: https://developers.facebook.com/docs/whatsapp/              |
| The AI Agent node depends on Langchain capabilities, ensure n8n version supports Langchain nodes v1.3 or higher.| Langchain n8n nodes: https://docs.n8n.io/nodes/official-nodes/langchain/                         |
| For managing conversational memory, the sliding window approach is used to keep context manageable.             | Consider memory size settings to balance context richness and performance.                       |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---