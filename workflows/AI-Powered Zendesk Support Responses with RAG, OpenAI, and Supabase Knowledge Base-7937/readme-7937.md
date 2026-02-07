AI-Powered Zendesk Support Responses with RAG, OpenAI, and Supabase Knowledge Base

https://n8nworkflows.xyz/workflows/ai-powered-zendesk-support-responses-with-rag--openai--and-supabase-knowledge-base-7937


# AI-Powered Zendesk Support Responses with RAG, OpenAI, and Supabase Knowledge Base

### 1. Workflow Overview

This workflow automates support ticket handling for Zendesk by leveraging AI-powered responses enriched with retrieval-augmented generation (RAG) from a Supabase knowledge base and session memory stored in Postgres. Its main use case is to provide accurate, context-aware, and formal replies to new Zendesk tickets by querying a knowledge base and recalling past ticket interactions, thereby enhancing support efficiency and consistency.

The workflow’s logic is organized into the following functional blocks:

- **1.1 Input Reception:** Receives new ticket webhook data from Zendesk.
- **1.2 Ticket Data Extraction:** Extracts relevant ticket details and formats them for processing.
- **1.3 Knowledge Base Retrieval:** Queries Supabase vector store to find relevant knowledge base documents.
- **1.4 Session Memory Retrieval:** Loads past ticket interactions from Postgres to maintain conversation context.
- **1.5 AI Response Generation:** Uses OpenAI models with RAG to generate a contextual response.
- **1.6 Conditional Processing:** Checks if the AI response is conclusive or requires fallback.
- **1.7 Zendesk Update:** Adds tags to the ticket to indicate AI involvement.
- **1.8 Notes and Testing:** Provides guidance notes for setup and validation.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Receives new ticket data sent from Zendesk via a webhook trigger.

**Nodes Involved:**  
- Note - Webhook Setup  
- Get New Tickets

**Node Details:**  

- **Note - Webhook Setup**  
  - Type: Sticky Note  
  - Role: Instruction to configure Zendesk trigger with this webhook URL.  
  - Content: Advises to set the webhook URL in Zendesk Admin → Triggers.  
  - Inputs/Outputs: None (informational)  
  - Edge Cases: None.

- **Get New Tickets**  
  - Type: Webhook (HTTP POST)  
  - Role: Entry point node that receives new ticket data from Zendesk.  
  - Configuration: Path set to `zendesk_new_ticket`, HTTP method POST.  
  - Inputs: External HTTP POST from Zendesk.  
  - Outputs: Emits JSON payload containing ticket info.  
  - Edge Cases: Failure if Zendesk does not send data or if webhook URL is misconfigured.

---

#### 1.2 Ticket Data Extraction

**Overview:**  
Extracts and formats necessary ticket fields from the webhook payload for downstream processing.

**Nodes Involved:**  
- Extract New Ticket

**Node Details:**  

- **Extract New Ticket**  
  - Type: Set node  
  - Role: Maps incoming webhook JSON to specific variables such as ticket ID, status, requester details, subject, and description.  
  - Configuration: Uses JavaScript expressions to extract fields like `ticket_id`, `requester_email`, and trims the last paragraph of the description. Also adds a timestamp in Asia/Dhaka timezone.  
  - Input: JSON from Get New Tickets node.  
  - Output: Structured JSON with named fields for use in later nodes.  
  - Edge Cases: Description field may be empty; expression handles this safely by defaulting to an empty string.

---

#### 1.3 Knowledge Base Retrieval

**Overview:**  
Queries the Supabase vector store to find relevant knowledge base articles related to the ticket description.

**Nodes Involved:**  
- Note - Supabase Setup  
- Supabase Vector Store  
- Embeddings OpenAI  
- Retrieve Knowledge Base

**Node Details:**  

- **Note - Supabase Setup**  
  - Type: Sticky Note  
  - Role: Reminder to configure Supabase credentials and ensure a `documents` table with embedded knowledge base content is present.  
  - Edge Cases: Misconfigured Supabase connection or missing table will cause failures.

- **Supabase Vector Store**  
  - Type: Vector Store node (LangChain Supabase)  
  - Role: Connects to Supabase to perform similarity search on `documents` table.  
  - Configuration: Uses `match_documents` query, table name `documents`.  
  - Credentials: Supabase API credentials required.  
  - Input: Embeddings of ticket description (from Embeddings OpenAI).  
  - Output: List of matched KB documents.  
  - Edge Cases: API authentication failure, empty results if no relevant docs found.

- **Embeddings OpenAI**  
  - Type: OpenAI Embeddings node  
  - Role: Converts ticket description text into vector embeddings compatible with Supabase vector store.  
  - Configuration: Model `text-embedding-3-small`, 1536 dimensions.  
  - Credentials: OpenAI API key needed.  
  - Input: Ticket description text.  
  - Output: Embeddings vector.  
  - Edge Cases: API rate limits or invalid API key may cause errors.

- **Retrieve Knowledge Base**  
  - Type: Tool Vector Store (LangChain)  
  - Role: Retrieves top 5 relevant KB articles from the vector store using embeddings.  
  - Configuration: Uses `content_en` as vector store name, topK=5.  
  - Input: Supabase Vector Store results.  
  - Output: KB content snippets for AI context.  
  - Edge Cases: Empty results handled downstream; failure to query vector store impacts AI response quality.

---

#### 1.4 Session Memory Retrieval

**Overview:**  
Fetches past conversation context for the ticket from a Postgres memory table to provide AI with session history.

**Nodes Involved:**  
- Note - Postgres Memory  
- Postgres Ticket Memory

**Node Details:**  

- **Note - Postgres Memory**  
  - Type: Sticky Note  
  - Role: Instruction to create a Postgres table `zendesk_ticket_histories` for storing ticket session context.  
  - Edge Cases: Missing or misconfigured table results in no session context.

- **Postgres Ticket Memory**  
  - Type: LangChain Postgres Memory node  
  - Role: Retrieves chat memory based on `ticket_id` as session key from `zendesk_ticket_histories` table.  
  - Configuration: Session key set dynamically from extracted ticket ID.  
  - Credentials: Postgres DB credentials required.  
  - Input: Extracted ticket info (ticket_id).  
  - Output: Chat history context for AI.  
  - Edge Cases: DB connection errors, missing session data fallback to empty context.

---

#### 1.5 AI Response Generation

**Overview:**  
Generates a formal, concise AI response using a RAG-enabled agent that combines knowledge base content and session memory.

**Nodes Involved:**  
- Note - OpenAI Setup  
- RAG AI Agent

**Node Details:**  

- **Note - OpenAI Setup**  
  - Type: Sticky Note  
  - Role: Reminder to add OpenAI API key and configure desired model (e.g., gpt-4o).  
  - Edge Cases: Invalid or missing API key causes failures.

- **RAG AI Agent**  
  - Type: LangChain Agent node  
  - Role: Uses ticket description and retrieved KB + memory context to generate a response.  
  - Configuration:  
    - Input text: extracted ticket description.  
    - Options: maxIterations=2 (limits reasoning steps).  
    - System message: instructs AI to act as a professional support assistant using only retrieved KB documents.  
  - Input: Ticket description, KB content, session memory.  
  - Output: AI-generated reply text.  
  - Edge Cases: Model timeout, incomplete or irrelevant responses, API errors.

---

#### 1.6 Conditional Processing

**Overview:**  
Evaluates AI response content to determine if fallback or escalation is needed.

**Nodes Involved:**  
- If No Relevant KB Found

**Node Details:**  

- **If No Relevant KB Found**  
  - Type: If node  
  - Role: Checks if AI response contains a fallback phrase like "will get back to you shortly," indicating no relevant KB was found.  
  - Configuration: Condition uses string containment check on AI output.  
  - Input: AI response text from RAG AI Agent.  
  - Output: Branches workflow based on response content.  
  - Edge Cases: False positives if fallback phrase appears unintentionally.

---

#### 1.7 Zendesk Update

**Overview:**  
Updates the Zendesk ticket by adding an `ai_reply` tag to indicate an AI-generated response was sent.

**Nodes Involved:**  
- Note - Zendesk Domain  
- Add Tags (ai_reply)

**Node Details:**  

- **Note - Zendesk Domain**  
  - Type: Sticky Note  
  - Role: Instruction to replace placeholder with actual Zendesk subdomain.  
  - Edge Cases: Incorrect domain leads to failed HTTP requests.

- **Add Tags (ai_reply)**  
  - Type: HTTP Request node  
  - Role: Sends PUT request to Zendesk API to add the `ai_reply` tag to the ticket.  
  - Configuration:  
    - URL dynamically built using extracted ticket ID and user-provided Zendesk domain.  
    - Uses Zendesk API credentials with OAuth2 or API token.  
    - JSON body: tags array with "ai_reply".  
  - Input: Ticket ID from extraction node.  
  - Output: Zendesk API response.  
  - Edge Cases: Authentication errors, rate limits, invalid ticket ID.

---

#### 1.8 Notes and Testing

**Overview:**  
Provides final guidance for testing and validating the workflow setup.

**Nodes Involved:**  
- Note - Testing

**Node Details:**  

- **Note - Testing**  
  - Type: Sticky Note  
  - Role: Checklist for end users to verify AI reply appearance, correct tagging, and memory storage in Postgres.  
  - Edge Cases: None (informational).

---

### 3. Summary Table

| Node Name             | Node Type                              | Functional Role                     | Input Node(s)          | Output Node(s)           | Sticky Note                                                                                       |
|-----------------------|--------------------------------------|-----------------------------------|-----------------------|--------------------------|-------------------------------------------------------------------------------------------------|
| Note - Webhook Setup  | Sticky Note                          | Zendesk webhook configuration     | —                     | Get New Tickets           | 🔗 Set this webhook URL as a trigger in your Zendesk account under 'Admin → Triggers'            |
| Get New Tickets       | Webhook                             | Receives new ticket data           | Note - Webhook Setup  | Extract New Ticket        |                                                                                                 |
| Extract New Ticket    | Set                                | Extracts and formats ticket fields | Get New Tickets        | Supabase Vector Store, Postgres Ticket Memory, RAG AI Agent |                                                                                                 |
| Note - Supabase Setup | Sticky Note                        | Supabase credentials reminder      | —                     | Supabase Vector Store     | 📚 Replace with your own Supabase project credentials. Ensure you have a 'documents' table       |
| Supabase Vector Store | Vector Store Supabase (LangChain)   | KB vector similarity search        | Extract New Ticket, Embeddings OpenAI | Retrieve Knowledge Base |                                                                                                 |
| Note - Postgres Memory| Sticky Note                        | Postgres memory table reminder     | —                     | Postgres Ticket Memory    | 🗄️ Create a Postgres table `zendesk_ticket_histories` for session context                       |
| Postgres Ticket Memory| Postgres Memory (LangChain)          | Retrieves ticket session memory    | Extract New Ticket      | RAG AI Agent              |                                                                                                 |
| Note - OpenAI Setup   | Sticky Note                        | OpenAI API key and model reminder  | —                     | Embeddings OpenAI, RAG AI Agent | 🤖 Add your own OpenAI API key in the credential settings. Adjust model if desired                |
| Embeddings OpenAI     | OpenAI Embeddings (LangChain)        | Generates text embeddings           | Extract New Ticket      | Supabase Vector Store     |                                                                                                 |
| Retrieve Knowledge Base| Tool Vector Store (LangChain)        | Fetches top KB articles             | Supabase Vector Store   | RAG AI Agent              |                                                                                                 |
| RAG AI Agent          | LangChain Agent                     | Generates AI support response       | Extract New Ticket, Retrieve Knowledge Base, Postgres Ticket Memory | If No Relevant KB Found |                                                                                                 |
| If No Relevant KB Found| If                                 | Checks AI response for fallback phrase | RAG AI Agent          | Add Tags (ai_reply)       |                                                                                                 |
| Note - Zendesk Domain | Sticky Note                        | Zendesk domain placeholder reminder| —                     | Add Tags (ai_reply)       | 🏷️ Update `<YOUR_ZENDESK_DOMAIN>` with your Zendesk subdomain. Example: mycompany.zendesk.com   |
| Add Tags (ai_reply)   | HTTP Request                       | Adds AI reply tag to Zendesk ticket| If No Relevant KB Found | —                        |                                                                                                 |
| Note - Testing        | Sticky Note                        | Final testing checklist             | —                     | —                        | ✅ After setup, create a sample ticket to test AI reply, correct tags, memory stored in Postgres |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node: "Get New Tickets"**  
   - Type: Webhook (HTTP POST)  
   - Path: `zendesk_new_ticket`  
   - No authentication required.  
   - This node receives new ticket payloads from Zendesk.

2. **Add Sticky Note "Note - Webhook Setup"**  
   - Content: "🔗 Set this webhook URL as a trigger in your Zendesk account under 'Admin → Triggers' so that new tickets are forwarded here."

3. **Add Set Node: "Extract New Ticket"**  
   - Inputs: Output from "Get New Tickets"  
   - Assign variables:  
     - `timestamp`: Current date/time in Asia/Dhaka timezone, formatted as medium date and short time.  
     - `ticket_id`: Extract from `body.ticket_id`  
     - `ticket_status`: Extract from `body.ticket_status`  
     - `requester_id`: Extract from `body.requester_id`  
     - `requester_name`: Extract from `body.requester_name`  
     - `requester_email`: Extract from `body.requester_email`  
     - `subject`: Extract from `body.subject`  
     - `description`: Extract last paragraph of `body.description` (split by double newlines, get last). Handle empty safely.

4. **Add Sticky Note "Note - Supabase Setup"**  
   - Content: "📚 Replace with your own Supabase project credentials. Ensure you have a 'documents' table with embedded KB content."

5. **Add OpenAI Embeddings Node: "Embeddings OpenAI"**  
   - Credentials: Configure with your OpenAI API key.  
   - Model: `text-embedding-3-small`  
   - Input: Ticket description from "Extract New Ticket"  
   - Output: Embeddings vector.

6. **Add Supabase Vector Store Node: "Supabase Vector Store"**  
   - Credentials: Configure with your Supabase API credentials.  
   - Table: `documents`  
   - Query: Use `match_documents` query to retrieve documents matching the embedding vector.

7. **Add Tool Vector Store Node: "Retrieve Knowledge Base"**  
   - Configuration: Name = `content_en`, topK = 5 (retrieve top 5 documents).  
   - Input: Results from "Supabase Vector Store"  
   - Output: Matches to be used by AI.

8. **Add Sticky Note "Note - Postgres Memory"**  
   - Content: "🗄️ Create a Postgres table `zendesk_ticket_histories` with fields for session context. This allows AI to recall past ticket interactions."

9. **Add Postgres Memory Node: "Postgres Ticket Memory"**  
   - Credentials: Postgres DB connection with proper access.  
   - Table: `zendesk_ticket_histories`  
   - Session Key: Use `ticket_id` from "Extract New Ticket" as customKey.  
   - Output: Previous conversation context.

10. **Add Sticky Note "Note - OpenAI Setup"**  
    - Content: "🤖 Add your own OpenAI API key in the credential settings. Adjust model if desired (gpt-4o, gpt-4o-mini, etc.)."

11. **Add LangChain Agent Node: "RAG AI Agent"**  
    - Input text: Ticket description from "Extract New Ticket"  
    - Options: `maxIterations=2`  
    - System message: "You are a professional support assistant. Use only the retrieved knowledge base documents to answer the customer’s ticket clearly, formally, and concisely."  
    - Inputs: Ticket description, KB articles, session memory  
    - Output: AI-generated reply.

12. **Add If Node: "If No Relevant KB Found"**  
    - Condition: Check if AI output contains phrase "will get back to you shortly" (indicates fallback response).  
    - Input: Output from "RAG AI Agent"  
    - Branches: True/False for further processing.

13. **Add Sticky Note "Note - Zendesk Domain"**  
    - Content: "🏷️ Update `<YOUR_ZENDESK_DOMAIN>` with your Zendesk subdomain. Example: `https://mycompany.zendesk.com/...`"

14. **Add HTTP Request Node: "Add Tags (ai_reply)"**  
    - Credentials: Zendesk API credentials (OAuth2 or API token).  
    - HTTP Method: PUT  
    - URL: `https://<YOUR_ZENDESK_DOMAIN>/api/v2/tickets/{{ $json.ticket_id }}/tags.json`  
    - Body (JSON): `{ "tags": ["ai_reply"] }`  
    - Input: Ticket ID from "Extract New Ticket"  
    - Trigger on the true branch of "If No Relevant KB Found".

15. **Add Sticky Note "Note - Testing"**  
    - Content:  
      ```
      ✅ After setup, create a sample ticket in Zendesk to test:
      - Does AI reply appear?
      - Correct tags (`ai_reply` / `human_requested`)?
      - Memory stored in Postgres?
      If yes → workflow is ready!
      ```

16. **Connect Nodes Appropriately**  
    - Webhook → Extract New Ticket  
    - Extract New Ticket → Embeddings OpenAI  
    - Embeddings OpenAI → Supabase Vector Store  
    - Supabase Vector Store → Retrieve Knowledge Base  
    - Extract New Ticket → Postgres Ticket Memory  
    - Extract New Ticket, Retrieve Knowledge Base, Postgres Ticket Memory → RAG AI Agent  
    - RAG AI Agent → If No Relevant KB Found  
    - If No Relevant KB Found → Add Tags (ai_reply) (true branch)  
    - Add Tags (ai_reply) → end

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                                    |
|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| 🔗 Set this webhook URL as a trigger in your Zendesk account under 'Admin → Triggers'.         | Webhook configuration step                                        |
| 📚 Replace with your own Supabase project credentials. Ensure you have a 'documents' table.   | Supabase vector store setup                                       |
| 🗄️ Create a Postgres table `zendesk_ticket_histories` with fields for session context.        | Storing session memory for AI context                             |
| 🤖 Add your own OpenAI API key in the credential settings. Adjust model if desired.            | OpenAI API and model setup                                        |
| 🏷️ Update `<YOUR_ZENDESK_DOMAIN>` with your Zendesk subdomain. Example: `mycompany.zendesk.com`| Zendesk API HTTP request URL configuration                        |
| ✅ After setup, create a sample ticket in Zendesk to test AI reply, tags, and memory storage.  | Testing checklist                                                 |

---

**Disclaimer:**  
The provided text is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.