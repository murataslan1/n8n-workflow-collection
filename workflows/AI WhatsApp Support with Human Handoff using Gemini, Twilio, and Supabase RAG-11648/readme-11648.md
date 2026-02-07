AI WhatsApp Support with Human Handoff using Gemini, Twilio, and Supabase RAG

https://n8nworkflows.xyz/workflows/ai-whatsapp-support-with-human-handoff-using-gemini--twilio--and-supabase-rag-11648


# AI WhatsApp Support with Human Handoff using Gemini, Twilio, and Supabase RAG

---

### 1. Workflow Overview

This workflow implements an **AI-powered WhatsApp support system with human handoff**, integrating Google Gemini (PaLM) for AI language understanding, Twilio for WhatsApp messaging, and Supabase as a vector store for retrieval-augmented generation (RAG) knowledgebase. It supports seamless collaboration between AI and human agents: the AI handles customer queries autonomously but defers to a human agent when available, resuming AI support if the human is inactive for over two hours.

Key use cases include automated customer support on WhatsApp for businesses leveraging AI with human oversight, dynamic knowledgebase updates from Google Drive documents, and maintaining conversation context and CRM integration for enriched responses.

The workflow logic is grouped into these main blocks:

- **1.1 WhatsApp Message Reception & Human-in-the-Loop Check**: Incoming WhatsApp messages via Twilio trigger a human activity check and filter to decide AI or human response.
- **1.2 AI Support Agent with Tools Integration**: The AI agent processes validated messages using Google Gemini, Supabase knowledgebase retrieval, OpenAI embeddings, calculator, and Airtable CRM tools.
- **1.3 Knowledgebase Management via Google Drive & Supabase**: Google Drive triggers on file creation/update initiate data ingestion, text splitting, embedding, and vector store updates.
- **1.4 WhatsApp Reply Dispatch**: The AI-generated response is sent back to the user through Twilio WhatsApp API.
- **1.5 Conversation Memory Buffer**: The workflow maintains conversation context per user session to improve response relevance.

---

### 2. Block-by-Block Analysis

#### 1.1 WhatsApp Message Reception & Human-in-the-Loop Check

**Overview:**  
Receives inbound WhatsApp messages through Twilio, checks if a human agent is currently active in the conversation, and filters messages to determine whether AI should respond based on a 2-hour inactivity window.

**Nodes Involved:**  
- Twilio (whatsapp) Trigger  
- human in the loop  
- 2hour Filter  
- Validate text input

**Node Details:**

- **Twilio (whatsapp) Trigger**  
  - Type: Twilio Trigger (Webhook)  
  - Role: Entry point for incoming WhatsApp messages via Twilio. Triggers on inbound message events.  
  - Configuration: Listens to `com.twilio.messaging.inbound-message.received` updates; uses Twilio API credentials.  
  - Input: WhatsApp inbound message JSON data.  
  - Output: Message metadata including sender and message text.  
  - Edge cases: Network/webhook failures, Twilio API rate limits.

- **human in the loop**  
  - Type: HTTP Request  
  - Role: Queries an external API to check if a human agent is active for the phone number that sent the message.  
  - Configuration: Sends GET request to `https://customcx-whatsap.netlify.app/api/check-human?phone=...` with phone number from inbound message.  
  - Input: Phone number extracted from Twilio trigger.  
  - Output: JSON indicating human active status and last human response time.  
  - Edge cases: HTTP request failures, API downtime, invalid phone numbers.

- **2hour Filter**  
  - Type: Filter  
  - Role: Allows messages to proceed to AI only if no human is active OR if last human response was more than 2 hours ago.  
  - Configuration: Conditions check humanActive flag (false) OR lastHumanResponseTime older than 2 hours from now.  
  - Input: Output from human in the loop node.  
  - Output: Passes valid messages; blocks others.  
  - Edge cases: Missing or malformed timestamps, timezone issues.

- **Validate text input**  
  - Type: If (Conditional)  
  - Role: Ensures text input is valid (non-empty, etc.) before passing to AI agent.  
  - Configuration: Checks if message body is non-empty string (though the condition seems currently empty and may require refinement).  
  - Input: Filtered messages from 2hour Filter node.  
  - Output: Validated messages or discarded invalid inputs.  
  - Edge cases: Empty or whitespace-only messages, invalid formats.

---

#### 1.2 AI Support Agent with Tools Integration

**Overview:**  
Processes validated WhatsApp messages through an AI agent (Google Gemini) enhanced with knowledge retrieval, calculation, CRM lookup, and session memory to generate context-aware responses.

**Nodes Involved:**  
- Whatsapp Support Agent  
- Google Gemini (the brain)  
- Knowledgebase (Supabase retrieval)  
- Embeddings OpenAI  
- Airtable CRM  
- Think (tool)  
- Calculator (tool)  
- conversation buffer  

**Node Details:**

- **Whatsapp Support Agent**  
  - Type: LangChain Agent  
  - Role: Central AI agent that receives user messages, calls language model, uses multiple tools and memory for response generation.  
  - Configuration:  
    - Input text: Incoming WhatsApp message body.  
    - System message: Defines assistant role as CustomCX virtual assistant with strict boundaries (e.g., no political, medical topics), instructions to use knowledgebase tool and calculator.  
    - Tools linked: Knowledgebase, Think, Calculator, Airtable CRM.  
    - Memory: Uses conversation buffer keyed by phone number.  
    - Prompt constraints: Limit output to 14,000 characters for WhatsApp compatibility.  
  - Input: Validated message text.  
  - Output: AI-generated response text.  
  - Edge cases: Language model latency, API quota, tool invocation errors, memory session issues.

- **Google Gemini (the brain)**  
  - Type: LangChain LM Chat Google Gemini (PaLM)  
  - Role: Language model used by AI agent to generate responses.  
  - Configuration: Uses Google PaLM API with appropriate credentials.  
  - Input: Prompt from AI agent node.  
  - Output: Text completion for agent.  
  - Edge cases: API limits, network errors, unexpected response formats.

- **Knowledgebase**  
  - Type: Supabase Vector Store (retrieve-as-tool)  
  - Role: Retrieval tool to answer queries by matching documents from Supabase vector DB.  
  - Configuration: Queries "documents" table, uses "match_documents" query, and provides tool description for AI agent.  
  - Input: Query text from AI agent.  
  - Output: Retrieved documents relevant to query.  
  - Edge cases: Empty or stale knowledgebase, Supabase API errors.

- **Embeddings OpenAI**  
  - Type: OpenAI Embeddings Node  
  - Role: Generates embeddings for documents/text to update Supabase vector store and for query matching.  
  - Configuration: Embedding dimension set to 1536 to match Supabase vector size.  
  - Input: Text segments from document loader.  
  - Output: Embedding vectors.  
  - Edge cases: API rate limits, embedding quality issues.

- **Airtable CRM**  
  - Type: Airtable Tool  
  - Role: Provides customer data lookup or CRM integration for agent context enrichment.  
  - Configuration: Uses Airtable OAuth2 credentials; queries specific base and table.  
  - Input: Possibly record IDs or query parameters from AI agent.  
  - Output: CRM data for agent.  
  - Edge cases: Airtable API limits, authentication issues.

- **Think**  
  - Type: LangChain ToolThink  
  - Role: Helper tool invoked by agent for logical reasoning or multi-step thinking.  
  - Configuration: No special parameters; integrated with agent.  
  - Input/Output: Internal to agent’s logic.  
  - Edge cases: Tool failure or timeout.

- **Calculator**  
  - Type: LangChain ToolCalculator  
  - Role: Performs arithmetic calculations requested by agent or user.  
  - Configuration: None special.  
  - Edge cases: Invalid math expressions.

- **conversation buffer**  
  - Type: LangChain MemoryBufferWindow  
  - Role: Maintains recent conversation history per phone number session, limited to last 20 messages for context.  
  - Configuration: Uses custom session key `$json.phoneNumber`.  
  - Edge cases: Memory overflow, session key mismatch.

---

#### 1.3 Knowledgebase Management via Google Drive & Supabase

**Overview:**  
Automates ingestion and update of knowledgebase documents stored in a Google Drive folder. When new or updated files are detected, the workflow downloads, processes, splits, embeds, and stores them in Supabase vector tables for retrieval.

**Nodes Involved:**  
- Google Drive Trigger  
- Google Drive Trigger1  
- Set the fields for mapping  
- Deletes old records  
- Loop Over Items  
- Download file  
- Recursive Character Text Splitter  
- Default Data Loader  
- Embeddings OpenAI  
- Supabase Vector Store  

**Node Details:**

- **Google Drive Trigger & Google Drive Trigger1**  
  - Type: Google Drive Trigger  
  - Role: Listens for file creation and file updates respectively in a specific folder (`1-IwC1Zsn5MB0-EjsRYkZ5EpfvWrOtpV-`).  
  - Configuration: Polls every minute to detect changes.  
  - Output: File metadata for changed files.  
  - Edge cases: API quota limits, missed triggers due to polling delay.

- **Set the fields for mapping**  
  - Type: Set Node  
  - Role: Extracts and maps file ID and original filename for downstream processing.  
  - Configuration: Assigns `file_id` and `file_name` from Google Drive trigger data.  
  - Edge cases: Missing file metadata.

- **Deletes old records**  
  - Type: Supabase Delete Operation  
  - Role: Deletes existing vector embeddings in Supabase for the document being updated to avoid duplication.  
  - Configuration: Deletes from "documents" table where `metadata->>file_id` equals current file ID.  
  - Edge cases: Deletion failures, partial deletes.

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Role: Iterates over files to process them individually.  
  - Configuration: Default batch size.  
  - Edge cases: Large batch sizes causing timeouts.

- **Download file**  
  - Type: Google Drive Node (download)  
  - Role: Downloads the actual document content binary for processing.  
  - Input: File ID from mapping node.  
  - Edge cases: File not found, permission errors.

- **Recursive Character Text Splitter**  
  - Type: Text Splitter  
  - Role: Splits large document text into manageable chunks for embedding.  
  - Configuration: Default character splitting parameters.  
  - Edge cases: Poor splitting causing context loss.

- **Default Data Loader**  
  - Type: Document Loader (docx)  
  - Role: Loads document in binary format, attaches metadata (file_id), and prepares text for embedding.  
  - Configuration: Uses docxLoader.  
  - Edge cases: Unsupported file formats.

- **Embeddings OpenAI**  
  - (Described above in 1.2) Used here to embed document chunks.

- **Supabase Vector Store**  
  - Type: Vector Store Insert  
  - Role: Inserts newly embedded document vectors into Supabase "documents" table for future retrieval.  
  - Edge cases: Insert failures, data consistency issues.

---

#### 1.4 WhatsApp Reply Dispatch

**Overview:**  
Sends the AI-generated response back to the user via Twilio WhatsApp API.

**Nodes Involved:**  
- Send an SMS/MMS/WhatsApp message

**Node Details:**

- **Send an SMS/MMS/WhatsApp message**  
  - Type: Twilio Node  
  - Role: Sends outbound WhatsApp messages replying to the user.  
  - Configuration:  
    - `to`: Extracted from inbound message sender phone number, stripped of "whatsapp:" prefix.  
    - `from`: Business WhatsApp number from Twilio trigger data.  
    - `message`: AI-generated response text from agent.  
    - `toWhatsapp`: true (forces WhatsApp channel).  
  - Input: Response from AI agent node.  
  - Edge cases: Twilio API limits, invalid phone numbers, message length limits.

---

#### 1.5 Conversation Memory Buffer

**Overview:**  
Maintains a session-based memory buffer of recent conversation messages to provide context continuity in AI responses.

**Nodes Involved:**  
- conversation buffer

**Node Details:**

- **conversation buffer**  
  - (Described above in 1.2)  
  - Maintains a rolling window of the last 20 messages keyed by phone number.  
  - Helps the AI agent understand context and maintain coherent multi-turn conversations.  
  - Edge cases include memory overflow or loss of session key leading to reset context.

---

### 3. Summary Table

| Node Name                      | Node Type                               | Functional Role                                 | Input Node(s)                    | Output Node(s)                   | Sticky Note                                                                                                                |
|--------------------------------|---------------------------------------|------------------------------------------------|---------------------------------|---------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Twilio (whatsapp) Trigger       | Twilio Trigger                        | Receive inbound WhatsApp messages               | -                               | human in the loop                | Human + AI: Human in the loop node checks past conversation history. Filter node checks 2-hour human inactivity window.     |
| human in the loop               | HTTP Request                         | Check human agent activity for conversation     | Twilio (whatsapp) Trigger       | 2hour Filter                    |                                                                                                                            |
| 2hour Filter                   | Filter                              | Filter messages to AI if no human active or >2h| human in the loop               | Validate text input             |                                                                                                                            |
| Validate text input            | If (Conditional)                    | Validate that incoming message text is okay     | 2hour Filter                   | Whatsapp Support Agent          |                                                                                                                            |
| Whatsapp Support Agent          | LangChain Agent                     | AI agent processing message and generating reply| Validate text input             | Send an SMS/MMS/WhatsApp message| Whatsapp Agent: Provide agent with necessary tools based on business needs                                                  |
| Send an SMS/MMS/WhatsApp message| Twilio Node                        | Send WhatsApp reply to user                      | Whatsapp Support Agent          | -                               |                                                                                                                            |
| Google Gemini (the brain)       | LangChain LM Chat                   | Language model used by AI agent                  | Whatsapp Support Agent          | Whatsapp Support Agent          |                                                                                                                            |
| Knowledgebase                  | Supabase Vector Store (retrieve)   | Retrieve knowledgebase documents for AI querying| Whatsapp Support Agent          | Whatsapp Support Agent          | RAG pipeline: Set embedding dimension to 1536                                                                              |
| Embeddings OpenAI             | OpenAI Embeddings                   | Generate embeddings for documents & queries     | Default Data Loader             | Supabase Vector Store, Knowledgebase |                                                                                                                            |
| Think                         | LangChain ToolThink                 | Tool for logical reasoning invoked by AI agent | Whatsapp Support Agent          | Whatsapp Support Agent          |                                                                                                                            |
| Calculator                    | LangChain ToolCalculator            | Tool to perform calculations for AI agent       | Whatsapp Support Agent          | Whatsapp Support Agent          |                                                                                                                            |
| Airtable CRM                  | Airtable Tool                      | CRM data lookup for context enrichment           | Whatsapp Support Agent          | Whatsapp Support Agent          |                                                                                                                            |
| conversation buffer           | LangChain MemoryBufferWindow        | Maintain conversation context memory             | Whatsapp Support Agent          | Whatsapp Support Agent          |                                                                                                                            |
| Google Drive Trigger          | Google Drive Trigger                | Trigger on new file creation in knowledge folder | -                             | Set the fields for mapping      | Knowledgebase source: Google drive folder eases data updates without manual workflow execution                              |
| Google Drive Trigger1         | Google Drive Trigger                | Trigger on file updates in knowledge folder      | -                             | Set the fields for mapping      | Knowledgebase source: Google drive folder eases data updates without manual workflow execution                              |
| Set the fields for mapping    | Set Node                          | Map file metadata for processing                  | Google Drive Trigger, Trigger1  | Deletes old records             |                                                                                                                            |
| Deletes old records           | Supabase Delete                   | Delete prior embeddings for updated file          | Set the fields for mapping      | Loop Over Items                 |                                                                                                                            |
| Loop Over Items               | SplitInBatches                   | Iterate over files for processing                   | Deletes old records             | Download file, Deletes old records|                                                                                                                            |
| Download file                | Google Drive Node (download)        | Download document content for embedding           | Loop Over Items                 | Supabase Vector Store           |                                                                                                                            |
| Recursive Character Text Splitter| Text Splitter                   | Split document text into chunks                    | Default Data Loader             | Default Data Loader             | RAG pipeline: Set embedding dimension to 1536                                                                              |
| Default Data Loader          | Document Loader (docx)               | Load document content with metadata                | Recursive Character Text Splitter| Embeddings OpenAI              | RAG pipeline: Set embedding dimension to 1536                                                                              |
| Supabase Vector Store        | Supabase Vector Store (insert)       | Insert document embeddings into vector store       | Embeddings OpenAI              | Knowledgebase                  | RAG pipeline: Set embedding dimension to 1536                                                                              |
| Sticky Note                  | Sticky Note                        | Notes on RAG pipeline embedding dimension           | -                             | -                             | "RAG pipeline: Set the embedding Dimension to 1536"                                                                        |
| Sticky Note7                 | Sticky Note                        | Overview and setup instructions for entire workflow| -                             | -                             | Detailed workflow description with setup links and customization notes (Twilio, Supabase, Gemini API, Human-in-loop dashboard)|
| Sticky Note1                 | Sticky Note                        | Explains human + AI handling logic                   | -                             | -                             | Human in the loop node checks past conversation history. Filter node checks 2-hour human inactivity window.                 |
| Sticky Note2                 | Sticky Note                        | Notes on knowledgebase source                         | -                             | -                             | Google drive folder makes it easier to update or add fresh data without manual workflow execution                           |
| Sticky Note3                 | Sticky Note                        | Notes on WhatsApp Agent tool setup                     | -                             | -                             | Provide the agent with necessary tools based on your business requirements/needs                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Twilio WhatsApp Trigger Node**  
   - Type: Twilio Trigger  
   - Configure webhook to listen on `com.twilio.messaging.inbound-message.received`  
   - Use Twilio API credentials with WhatsApp-enabled phone number.  
   - Position as entry node.

2. **Add HTTP Request Node for Human-in-the-loop Check**  
   - URL: `https://customcx-whatsap.netlify.app/api/check-human?phone={{$json.data.from.trim()}}`  
   - Method: GET, set JSON headers accordingly.  
   - Connect input from Twilio Trigger.

3. **Add Filter Node (2hour Filter)**  
   - Conditions: Allow if humanActive is false OR lastHumanResponseTime is older than current time minus 2 hours.  
   - Connect input from HTTP Request node.

4. **Add If Node (Validate text input)**  
   - Configure to check that incoming message text is not empty.  
   - Connect input from 2hour Filter node.

5. **Add LangChain Agent Node (Whatsapp Support Agent)**  
   - Set `text` input to inbound message body.  
   - Set system prompt describing CustomCX assistant role and constraints.  
   - Link the following tools inside the agent node: Knowledgebase (Supabase retrieve), Think tool, Calculator tool, Airtable CRM.  
   - Configure conversation memory buffer keyed by phone number.  
   - Connect validated messages to this node.

6. **Add LangChain Google Gemini LM Chat Node**  
   - Configure with Google PaLM API credentials.  
   - Connect as language model for Whatsapp Support Agent.

7. **Add Supabase Vector Store Node (Knowledgebase retrieval)**  
   - Configure with Supabase credentials.  
   - Set mode to `retrieve-as-tool`, select `documents` table and `match_documents` query.  
   - Connect as tool for Whatsapp Support Agent.

8. **Add OpenAI Embeddings Node**  
   - Configure with OpenAI credentials.  
   - Set embedding dimension to 1536.  
   - Connect as embedding provider for Supabase Vector Store nodes.

9. **Add Airtable CRM Node**  
   - Configure with Airtable OAuth2 credentials, select appropriate base and table.  
   - Connect as tool for Whatsapp Support Agent.

10. **Add LangChain ToolThink and ToolCalculator Nodes**  
    - No special config needed.  
    - Connect as tools for Whatsapp Support Agent.

11. **Add Conversation Buffer Node**  
    - Configure session key as phone number from inbound message.  
    - Set context window length to 20 messages.  
    - Connect as memory for Whatsapp Support Agent.

12. **Add Twilio Send Message Node**  
    - Configure to send WhatsApp messages using Twilio API credentials.  
    - Set `to` and `from` using expressions to strip "whatsapp:" prefix from inbound message data.  
    - Message content set to AI agent output.  
    - Connect output from Whatsapp Support Agent.

13. **Setup Knowledgebase Update Branch:**  
    - Add two Google Drive Trigger nodes: one for fileCreated, one for fileUpdated events, both watching the specific knowledgebase folder.  
    - Connect both to a Set node to map `file_id` and `file_name`.  
    - Connect Set node to Supabase Delete node to remove old embeddings for that file.  
    - Connect Delete node to SplitInBatches node to process files sequentially.  
    - Connect SplitInBatches to Google Drive download node to get the file content.  
    - Add Recursive Character Text Splitter node and connect to Default Data Loader node configured for docx documents with metadata including file_id.  
    - Connect Default Data Loader to OpenAI Embeddings node.  
    - Connect Embeddings node to Supabase Vector Store insert node for indexing.  

14. **Add Sticky Notes for Documentation**  
    - Add notes explaining RAG pipeline embedding dimension (1536), human + AI collaboration, knowledgebase source, and overall workflow setup and customization instructions.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                          | Context or Link                                                                                          |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| This workflow enables unique WhatsApp automation allowing AI and human collaboration. AI responds to queries until human agent takes over, with handoff and timeout logic. WhatsApp business messaging is constrained by 24h rule. | See Sticky Note7 in workflow for detailed explanation and setup steps.                                  |
| Setup requires Twilio account with WhatsApp-enabled number (~$20), Supabase account for knowledgebase, Google Gemini API key, and optional Airtable CRM integration.                                                               | Setup links in Sticky Note7: Twilio, Supabase tutorial (https://youtu.be/5uw1wE6niGc), Gemini (https://aistudio.google.com/api-keys) |
| For Human-in-loop dashboard and analytics, use GitHub project: https://github.com/shadrack-ago/whatsapp-dashboard.git                                                                                                              | Mentioned in Sticky Note7                                                                                 |
| RAG pipeline uses embedding dimension of 1536 to match OpenAI embeddings and Supabase vector store configuration.                                                                                                                   | Sticky Note "RAG pipeline"                                                                                 |
| AI agent strictly limited to CustomCX business domain; avoids off-topic questions (politics, medical, personal).                                                                                                                     | Defined in AI agent system prompt                                                                          |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---