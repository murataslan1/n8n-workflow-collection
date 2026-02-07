Automate SIEM Alert Enrichment with MITRE ATT&CK, Qdrant & Zendesk in n8n

https://n8nworkflows.xyz/workflows/automate-siem-alert-enrichment-with-mitre-att-ck--qdrant---zendesk-in-n8n-2840


# Automate SIEM Alert Enrichment with MITRE ATT&CK, Qdrant & Zendesk in n8n

### 1. Workflow Overview

This n8n workflow automates the enrichment of SIEM (Security Information and Event Management) alerts by integrating MITRE ATT&CK threat intelligence, Qdrant vector search, and Zendesk ticketing. It is designed primarily for cybersecurity teams and SOC analysts to enhance alert context, automate triage, and embed actionable remediation steps directly into security tickets.

The workflow is logically divided into the following blocks:

- **1.1 Data Ingestion & Triggering:** Receives SIEM alerts via chatbot or manual trigger.
- **1.2 MITRE ATT&CK Data Preparation & Embedding:** Downloads MITRE ATT&CK data from Google Drive, processes, and embeds it into a Qdrant vector store.
- **1.3 AI-Powered Alert Analysis:** Uses AI agents with OpenAI models and Qdrant vector search to extract TTPs and generate remediation steps.
- **1.4 Zendesk Ticket Enrichment:** Retrieves Zendesk tickets, enriches them with MITRE ATT&CK context and remediation, and updates tickets.
- **1.5 Workflow Control & Iteration:** Manages looping over multiple tickets and controls workflow progression.

---

### 2. Block-by-Block Analysis

#### 2.1 Data Ingestion & Triggering

**Overview:**  
This block initiates the workflow by receiving SIEM alert data either from a chatbot interface or manual trigger for testing purposes.

**Nodes Involved:**  
- When chat message received  
- When clicking ‘Test workflow’

**Node Details:**

- **When chat message received**  
  - *Type:* Langchain Chat Trigger  
  - *Role:* Listens for incoming chat messages containing SIEM alerts to start processing.  
  - *Configuration:* Default webhook-based trigger with no additional options.  
  - *Connections:* Outputs to "AI Agent".  
  - *Edge Cases:* Webhook failures, malformed messages, or unsupported chat platforms may cause missed triggers.

- **When clicking ‘Test workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Allows manual initiation of the workflow for testing or debugging.  
  - *Configuration:* No parameters; manual activation only.  
  - *Connections:* Outputs to "Pull Mitre Data From Gdrive".  
  - *Edge Cases:* None significant; manual use only.

---

#### 2.2 MITRE ATT&CK Data Preparation & Embedding

**Overview:**  
This block downloads cleaned MITRE ATT&CK JSON data from Google Drive, extracts the JSON content, splits and processes it, generates embeddings using OpenAI, and inserts the data into a Qdrant vector store for fast semantic search.

**Nodes Involved:**  
- Pull Mitre Data From Gdrive  
- Extract from File  
- Split Out  
- Default Data Loader  
- Token Splitter1  
- Embeddings OpenAI1  
- Embed JSON in Qdrant Collection  
- Sticky Note (related informational notes)

**Node Details:**

- **Pull Mitre Data From Gdrive**  
  - *Type:* Google Drive  
  - *Role:* Downloads the cleaned MITRE ATT&CK JSON file from Google Drive.  
  - *Configuration:* Uses OAuth2 credentials; file ID points to cleaned MITRE data JSON.  
  - *Connections:* Outputs to "Extract from File".  
  - *Edge Cases:* OAuth token expiration, file permission issues, or file not found errors.

- **Extract from File**  
  - *Type:* Extract From File  
  - *Role:* Parses the downloaded file content as JSON.  
  - *Configuration:* Operation set to "fromJson".  
  - *Connections:* Outputs to "Split Out".  
  - *Edge Cases:* Malformed JSON or empty file content.

- **Split Out**  
  - *Type:* Split Out  
  - *Role:* Splits the JSON array into individual items for processing.  
  - *Configuration:* Splits on the "data" field.  
  - *Connections:* Outputs to "Embed JSON in Qdrant Collection".  
  - *Edge Cases:* Empty or missing "data" field.

- **Default Data Loader**  
  - *Type:* Document Default Data Loader (Langchain)  
  - *Role:* Loads JSON data into document format with metadata for embedding.  
  - *Configuration:* Extracts metadata fields such as id, name, kill chain phases, and external references; uses description as document text.  
  - *Connections:* Outputs to "Embed JSON in Qdrant Collection".  
  - *Edge Cases:* Missing metadata fields or inconsistent data structure.

- **Token Splitter1**  
  - *Type:* Text Splitter (Token-based)  
  - *Role:* Splits large text documents into smaller chunks for embedding.  
  - *Configuration:* Default token splitting parameters.  
  - *Connections:* Outputs to "Default Data Loader".  
  - *Edge Cases:* Very large documents may require tuning split size.

- **Embeddings OpenAI1**  
  - *Type:* OpenAI Embeddings  
  - *Role:* Generates vector embeddings for the MITRE ATT&CK documents.  
  - *Configuration:* Uses OpenAI API with default embedding options.  
  - *Connections:* Outputs to "Embed JSON in Qdrant Collection".  
  - *Credentials:* OpenAI API key configured.  
  - *Edge Cases:* API rate limits, network issues, or invalid credentials.

- **Embed JSON in Qdrant Collection**  
  - *Type:* Qdrant Vector Store  
  - *Role:* Inserts the embedded MITRE ATT&CK data into the Qdrant collection named "mitre".  
  - *Configuration:* Mode set to "insert".  
  - *Connections:* None downstream in this block.  
  - *Credentials:* Qdrant API credentials configured.  
  - *Edge Cases:* Qdrant connection failures, collection misconfiguration.

- **Sticky Notes**  
  - Provide visual guidance on embedding vector store data, talking to the vector store, and deploying contextual ticket enrichment.  
  - Contain branding images and instructions relevant to the embedding and vector store setup.

---

#### 2.3 AI-Powered Alert Analysis

**Overview:**  
This block processes incoming SIEM alerts using AI agents powered by OpenAI models and Qdrant vector search. It extracts MITRE ATT&CK TTPs, generates remediation steps, and structures the output for downstream use.

**Nodes Involved:**  
- When chat message received  
- AI Agent  
- OpenAI Chat Model  
- Window Buffer Memory  
- Query Qdrant Vector Store  
- AI Agent1  
- OpenAI Chat Model1  
- Qdrant Vector Store query  
- Structured Output Parser

**Node Details:**

- **AI Agent**  
  - *Type:* Langchain Agent  
  - *Role:* Acts as a cybersecurity expert AI to analyze SIEM alert text, extract TTPs, and generate remediation.  
  - *Configuration:* System message instructs the agent to tag TTPs with tactic, technique name, and ID; provide actionable remediation; cross-reference historical data; recommend external resources.  
  - *Connections:* Input from "When chat message received"; output to no direct node (standalone).  
  - *Edge Cases:* AI model errors, incomplete or ambiguous input data.

- **OpenAI Chat Model**  
  - *Type:* Langchain OpenAI Chat Model  
  - *Role:* Provides the underlying language model (GPT-4o) for the AI Agent.  
  - *Configuration:* Model set to "gpt-4o".  
  - *Connections:* Feeds into "AI Agent".  
  - *Credentials:* OpenAI API key configured.  
  - *Edge Cases:* API rate limits, model unavailability.

- **Window Buffer Memory**  
  - *Type:* Langchain Memory Buffer (Window)  
  - *Role:* Maintains conversational context for the AI Agent.  
  - *Connections:* Connected to "AI Agent".  
  - *Edge Cases:* Memory overflow or context loss in long conversations.

- **Query Qdrant Vector Store**  
  - *Type:* Langchain Vector Store Qdrant (Tool)  
  - *Role:* Retrieves relevant MITRE ATT&CK entries based on alert text embeddings.  
  - *Configuration:* Mode "retrieve-as-tool" with descriptive tool name and description.  
  - *Connections:* Feeds into "AI Agent".  
  - *Credentials:* Qdrant API configured.  
  - *Edge Cases:* Query failures, empty results.

- **AI Agent1**  
  - *Type:* Langchain Agent  
  - *Role:* Similar to "AI Agent" but processes structured input from Zendesk tickets and outputs enriched data.  
  - *Configuration:* System message similar to AI Agent but outputs HTML format without code block delimiters.  
  - *Connections:* Input from "OpenAI Chat Model1" and "Structured Output Parser"; output to "Update Zendesk with Mitre Data".  
  - *Edge Cases:* Parsing errors, malformed input.

- **OpenAI Chat Model1**  
  - *Type:* Langchain OpenAI Chat Model  
  - *Role:* Provides GPT-4o model for AI Agent1.  
  - *Credentials:* OpenAI API key configured.  
  - *Connections:* Feeds into "AI Agent1".  
  - *Edge Cases:* Same as OpenAI Chat Model.

- **Qdrant Vector Store query**  
  - *Type:* Langchain Vector Store Qdrant (Tool)  
  - *Role:* Retrieves MITRE ATT&CK context for AI Agent1 queries.  
  - *Connections:* Feeds into "AI Agent1".  
  - *Credentials:* Qdrant API configured.  
  - *Edge Cases:* Same as Query Qdrant Vector Store.

- **Structured Output Parser**  
  - *Type:* Langchain Structured Output Parser  
  - *Role:* Parses AI Agent1’s JSON-formatted output into structured data fields (TTP identification, remediation steps, historical patterns, external resources).  
  - *Configuration:* Uses a detailed JSON schema example to validate and parse output.  
  - *Connections:* Outputs to "AI Agent1".  
  - *Edge Cases:* Parsing failures if AI output deviates from schema.

---

#### 2.4 Zendesk Ticket Enrichment

**Overview:**  
This block retrieves all Zendesk tickets, loops over them, enriches each ticket with MITRE ATT&CK threat intelligence and remediation steps generated by the AI, and updates the tickets accordingly.

**Nodes Involved:**  
- Get all Zendesk Tickets  
- Loop Over Items  
- AI Agent1  
- Update Zendesk with Mitre Data  
- Move on to next ticket

**Node Details:**

- **Get all Zendesk Tickets**  
  - *Type:* Zendesk Node  
  - *Role:* Retrieves all tickets from Zendesk for processing.  
  - *Configuration:* Operation set to "getAll" with default options.  
  - *Connections:* Outputs to "Loop Over Items".  
  - *Credentials:* Zendesk API OAuth2 configured.  
  - *Edge Cases:* API rate limits, authentication failures.

- **Loop Over Items**  
  - *Type:* Split In Batches  
  - *Role:* Iterates over each Zendesk ticket individually to process.  
  - *Connections:* First output (empty) and second output to "AI Agent1".  
  - *Edge Cases:* Large ticket volumes may require batch size tuning.

- **AI Agent1**  
  - *Described above in 2.3.*

- **Update Zendesk with Mitre Data**  
  - *Type:* Zendesk Node  
  - *Role:* Updates each ticket with internal notes summarizing alert and TTPs, and sets custom fields for technique ID and tactic.  
  - *Configuration:* Uses ticket ID from current loop item; updates internal note with alert summary; sets custom fields with MITRE technique ID and tactic.  
  - *Connections:* Outputs to "Move on to next ticket".  
  - *Credentials:* Zendesk API OAuth2 configured.  
  - *Edge Cases:* Update failures, invalid ticket IDs.

- **Move on to next ticket**  
  - *Type:* No Operation (NoOp)  
  - *Role:* Acts as a placeholder to continue looping over tickets.  
  - *Connections:* Outputs back to "Loop Over Items" to process next ticket.  
  - *Edge Cases:* None.

---

#### 2.5 Workflow Control & Iteration

**Overview:**  
Manages the iterative processing of multiple tickets and controls workflow progression.

**Nodes Involved:**  
- Loop Over Items  
- Move on to next ticket

**Node Details:**  
- *Described above in 2.4.*

---

### 3. Summary Table

| Node Name                     | Node Type                                | Functional Role                                   | Input Node(s)                  | Output Node(s)                    | Sticky Note                                                                                              |
|-------------------------------|-----------------------------------------|-------------------------------------------------|-------------------------------|----------------------------------|--------------------------------------------------------------------------------------------------------|
| When chat message received     | Langchain Chat Trigger                   | Trigger workflow on incoming SIEM alert chat    | -                             | AI Agent                         |                                                                                                        |
| AI Agent                      | Langchain Agent                         | Analyze SIEM alert, extract TTPs, generate remediation | When chat message received    | -                                |                                                                                                        |
| OpenAI Chat Model             | Langchain OpenAI Chat Model             | Provides GPT-4o model for AI Agent               | -                             | AI Agent                         |                                                                                                        |
| Window Buffer Memory          | Langchain Memory Buffer (Window)        | Maintains AI conversational context              | -                             | AI Agent                         |                                                                                                        |
| Query Qdrant Vector Store     | Langchain Vector Store Qdrant (Tool)    | Retrieve MITRE ATT&CK entries for alert          | -                             | AI Agent                         |                                                                                                        |
| When clicking ‘Test workflow’ | Manual Trigger                          | Manual start for testing workflow                 | -                             | Pull Mitre Data From Gdrive      |                                                                                                        |
| Pull Mitre Data From Gdrive   | Google Drive                           | Download cleaned MITRE ATT&CK JSON data           | When clicking ‘Test workflow’ | Extract from File                |                                                                                                        |
| Extract from File             | Extract From File                      | Parse downloaded file as JSON                      | Pull Mitre Data From Gdrive   | Split Out                       |                                                                                                        |
| Split Out                    | Split Out                             | Split JSON array into individual items            | Extract from File             | Embed JSON in Qdrant Collection |                                                                                                        |
| Default Data Loader           | Langchain Document Default Data Loader | Load JSON data with metadata for embedding        | Token Splitter1               | Embed JSON in Qdrant Collection |                                                                                                        |
| Token Splitter1               | Langchain Text Splitter (Token)         | Split large text into chunks for embedding        | -                             | Default Data Loader             |                                                                                                        |
| Embeddings OpenAI1            | Langchain OpenAI Embeddings             | Generate embeddings for MITRE ATT&CK data         | -                             | Embed JSON in Qdrant Collection |                                                                                                        |
| Embed JSON in Qdrant Collection | Langchain Vector Store Qdrant           | Insert embedded MITRE data into Qdrant collection | Split Out, Default Data Loader, Embeddings OpenAI1 | -                                | ![n8n](https://uploads.n8n.io/templates/qdrantlogo.png) Embed your Vector Store: Pulls JSON from Google Drive and inserts into Qdrant. |
| Sticky Note                  | Sticky Note                           | Informational notes on embedding vector store     | -                             | -                                | ![n8n](https://uploads.n8n.io/templates/qdrantlogo.png) Embed your Vector Store: Pulls JSON from Google Drive and inserts into Qdrant. |
| Sticky Note1                 | Sticky Note                           | Informational notes on interacting with vector store | -                             | -                                | ![n8n](https://uploads.n8n.io/templates/n8n.png) Talk to your Vector Store: Use chat interface with OpenAI or other LLMs. |
| Sticky Note2                 | Sticky Note                           | Informational notes on ticket enrichment           | -                             | -                                | ![Servicenow](https://uploads.n8n.io/templates/zendesk.png) Deploy your Vector Store: Adds contextual info to tickets using MITRE ATT&CK. |
| AI Agent1                   | Langchain Agent                         | Analyze Zendesk ticket data, generate enrichment  | OpenAI Chat Model1, Structured Output Parser, Qdrant Vector Store query | Update Zendesk with Mitre Data |                                                                                                        |
| OpenAI Chat Model1           | Langchain OpenAI Chat Model             | Provides GPT-4o model for AI Agent1                | -                             | AI Agent1                      |                                                                                                        |
| Qdrant Vector Store query    | Langchain Vector Store Qdrant (Tool)    | Retrieve MITRE ATT&CK context for AI Agent1       | -                             | AI Agent1                      |                                                                                                        |
| Structured Output Parser     | Langchain Structured Output Parser      | Parse AI Agent1 JSON output into structured data  | -                             | AI Agent1                      |                                                                                                        |
| Get all Zendesk Tickets      | Zendesk Node                          | Retrieve all Zendesk tickets                        | -                             | Loop Over Items                |                                                                                                        |
| Loop Over Items              | Split In Batches                      | Iterate over Zendesk tickets                        | Get all Zendesk Tickets, Move on to next ticket | AI Agent1                      |                                                                                                        |
| Update Zendesk with Mitre Data | Zendesk Node                          | Update tickets with MITRE ATT&CK enrichment        | AI Agent1                     | Move on to next ticket          |                                                                                                        |
| Move on to next ticket       | No Operation (NoOp)                   | Control loop iteration over tickets                 | Update Zendesk with Mitre Data | Loop Over Items                |                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**
   - Add **"When chat message received"** node (Langchain Chat Trigger) to receive SIEM alerts via chat.
   - Add **"When clicking ‘Test workflow’"** node (Manual Trigger) for manual testing.

2. **Set Up MITRE ATT&CK Data Ingestion:**
   - Add **"Pull Mitre Data From Gdrive"** node (Google Drive) configured with OAuth2 credentials and file ID pointing to cleaned MITRE ATT&CK JSON.
   - Connect to **"Extract from File"** node (Extract From File) with operation "fromJson".
   - Connect to **"Split Out"** node (Split Out) configured to split on the "data" field.

3. **Prepare Data for Embedding:**
   - Add **"Token Splitter1"** node (Langchain Text Splitter Token) with default settings.
   - Connect to **"Default Data Loader"** node (Langchain Document Default Data Loader) configured to extract metadata fields: id, name, kill_chain_phases, external_references; use description as document text.

4. **Generate Embeddings and Insert into Qdrant:**
   - Add **"Embeddings OpenAI1"** node (Langchain OpenAI Embeddings) with OpenAI API credentials.
   - Connect outputs of "Split Out", "Default Data Loader", and "Embeddings OpenAI1" to **"Embed JSON in Qdrant Collection"** node (Langchain Vector Store Qdrant) configured to insert into collection "mitre" with Qdrant API credentials.

5. **Configure AI-Powered Alert Analysis:**
   - Add **"AI Agent"** node (Langchain Agent) with system message instructing cybersecurity expert behavior focused on MITRE ATT&CK TTP extraction and remediation.
   - Add **"OpenAI Chat Model"** node (Langchain OpenAI Chat Model) with GPT-4o model and OpenAI credentials.
   - Add **"Window Buffer Memory"** node (Langchain Memory Buffer Window) for conversational context.
   - Add **"Query Qdrant Vector Store"** node (Langchain Vector Store Qdrant) configured as a tool named "mitre_attack_vector_store" with Qdrant API credentials.
   - Connect "When chat message received" → "AI Agent" → "OpenAI Chat Model", "Window Buffer Memory", and "Query Qdrant Vector Store" as per dependencies.

6. **Set Up Zendesk Ticket Enrichment Loop:**
   - Add **"Get all Zendesk Tickets"** node (Zendesk) configured with Zendesk OAuth2 credentials, operation "getAll".
   - Add **"Loop Over Items"** node (Split In Batches) to iterate over tickets.
   - Add **"AI Agent1"** node (Langchain Agent) with similar system message as "AI Agent" but configured to output HTML format without code block delimiters.
   - Add **"OpenAI Chat Model1"** node (Langchain OpenAI Chat Model) with GPT-4o and OpenAI credentials.
   - Add **"Qdrant Vector Store query"** node (Langchain Vector Store Qdrant) configured as tool "mitre_attack_vector_store" with Qdrant credentials.
   - Add **"Structured Output Parser"** node (Langchain Structured Output Parser) with JSON schema example for TTP identification, remediation, historical patterns, and external resources.
   - Connect "Get all Zendesk Tickets" → "Loop Over Items" → "AI Agent1" (with inputs from "OpenAI Chat Model1", "Qdrant Vector Store query", and "Structured Output Parser").

7. **Update Zendesk Tickets:**
   - Add **"Update Zendesk with Mitre Data"** node (Zendesk) configured to update ticket by ID from current loop item.
   - Set internal note with alert summary and custom fields for technique ID and tactic from AI output.
   - Connect "AI Agent1" → "Update Zendesk with Mitre Data".

8. **Control Loop Iteration:**
   - Add **"Move on to next ticket"** node (NoOp).
   - Connect "Update Zendesk with Mitre Data" → "Move on to next ticket" → "Loop Over Items" to continue processing remaining tickets.

9. **Add Sticky Notes (Optional):**
   - Add sticky notes with branding and instructions for embedding vector store, interacting with vector store, and ticket enrichment.

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                                                                  |
|------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow video setup guide                                                                     | [Watch the Setup Video](https://youtu.be/SbWrCe0R9LE)                                           |
| MITRE ATT&CK data cleaning and embedding scripts                                              | [Clean Mitre Data Python Script](https://drive.google.com/file/d/1Yxv5fDdQ2OigYhhfv_WqGb9QTr-Q_aeW/view?usp=sharing) |
| Cleaned MITRE ATT&CK data JSON                                                                | [Cleaned Mitre Data](https://drive.google.com/file/d/1Kt6ZJ4DYvNm44I9fBKvmXjeHQqLJqCwA/view?usp=drive_link) |
| Full MITRE ATT&CK data JSON                                                                   | [Full Mitre Data](https://drive.google.com/file/d/1Lq7v3luu3DC44Tdn2DIxiVwnh3UQWM_Y/view?usp=drive_link) |
| Workflow designed for cybersecurity teams, SOC analysts, and IT security professionals        | Ideal for automating SIEM alert enrichment and integrating threat intelligence into Zendesk.   |
| Supports customization for chatbot triggers, SIEM input sources, remediation AI models, and ticketing platforms | Enables adaptation to Slack, Microsoft Teams, Splunk, Elastic SIEM, Jira, ServiceNow, etc.     |

---

This documentation provides a comprehensive understanding of the workflow structure, node configurations, and integration points, enabling advanced users and AI agents to reproduce, modify, and troubleshoot the workflow effectively.