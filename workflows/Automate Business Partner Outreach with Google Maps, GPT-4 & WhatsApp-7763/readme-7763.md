Automate Business Partner Outreach with Google Maps, GPT-4 & WhatsApp

https://n8nworkflows.xyz/workflows/automate-business-partner-outreach-with-google-maps--gpt-4---whatsapp-7763


# Automate Business Partner Outreach with Google Maps, GPT-4 & WhatsApp

### 1. Workflow Overview

This workflow automates business partner outreach by integrating Google Maps data scraping, AI-powered message generation and reply handling via GPT-4, and WhatsApp messaging through WhatsApp APIs. It targets sales and partnership teams seeking to efficiently gather, enrich, and engage potential business leads for partnerships using automated data collection, AI-driven communication, and messaging orchestration.

The workflow is organized into these logical blocks:

- **1.1 Data Scraping & Cleaning:** Configure and execute Google Maps scraping to collect potential business leads, then save raw data.
- **1.2 Data Enrichment:** Enrich scraped leads with live web data and authoritative sources via a Perplexity-powered AI enrichment process, then update the database.
- **1.3 Company Knowledge Base Management:** Automate syncing and embedding of company knowledge documents from Google Drive using LlamaIndex and Pinecone vector DB for AI context retrieval.
- **1.4 Outbound Messaging:** Select qualified leads, generate personalized outbound messages using GPT-4, and send messages via WhatsApp with typing simulation and read receipt handling.
- **1.5 Reply Handling:** Receive and process inbound WhatsApp messages, interpret replies using GPT-4-based conversation AI, save contact info if provided, and send appropriate WhatsApp replies with managed session memory.
- **1.6 Scheduling & Triggers:** Employ schedule triggers for daily scraping and outbound messaging, and webhook triggers for incoming WhatsApp messages and knowledge base updates.
- **1.7 Supporting Utilities:** Includes session data extraction, message formatting, limits on batch sizes, and data splitting.

---

### 2. Block-by-Block Analysis

#### 2.1 Data Scraping & Cleaning Section

**Overview:**  
This block configures scraping parameters, executes a Google Maps scraper actor via Apify, fetches the scraped data, and saves raw business leads into a Google Sheet.

**Nodes Involved:**  
- Manual Trigger - Start Scraping  
- Configure Scraping Parameters  
- Execute Google Maps Scraper  
- Fetch Scraped Business Data  
- Save Raw Business Leads

**Node Details:**

- **Manual Trigger - Start Scraping**  
  - *Type:* Manual trigger  
  - *Role:* Initiates scraping on demand  
  - *Connections:* Outputs to Configure Scraping Parameters  
  - *Edge cases:* Manual start only; no auth errors

- **Configure Scraping Parameters**  
  - *Type:* Set node  
  - *Role:* Defines dynamic input parameters for scraping, e.g., location category ("bar", "restaurant", "mall"), location ("Jakarta"), lead count (150), min stars ("four"), skip closed places (true)  
  - *Key expressions:* Static values assigned; used downstream in Execute Google Maps Scraper  
  - *Connections:* Input from Manual Trigger; output to Execute Google Maps Scraper  
  - *Edge cases:* Parameters must be valid; improper values may cause scraper failure

- **Execute Google Maps Scraper**  
  - *Type:* Apify node  
  - *Role:* Runs Apify's Google Maps scraper actor with configured parameters  
  - *Configuration:* Custom JSON body includes parameters from Set node; scrapes contacts, skips closed places, filters by stars, and limits leads  
  - *Credentials:* Apify API key required  
  - *Connections:* Input from Configure Scraping Parameters; output to Fetch Scraped Business Data  
  - *Edge cases:* API quota, timeout, or malformed input can cause errors

- **Fetch Scraped Business Data**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves last run dataset from Apify actor (scraped business leads)  
  - *Authentication:* Uses Apify API credentials  
  - *Connections:* Input from Execute Google Maps Scraper; output to Save Raw Business Leads  
  - *Edge cases:* HTTP errors, empty data, rate limits

- **Save Raw Business Leads**  
  - *Type:* Google Sheets  
  - *Role:* Appends or updates scraped leads data in Google Sheets "Raw Data" sheet  
  - *Configuration:* Maps fields such as Title, Address, Phone Number, Socials, Reviews, etc. to sheet columns  
  - *Credentials:* Google Sheets OAuth2  
  - *Connections:* Input from Fetch Scraped Business Data  
  - *Edge cases:* Sheet permission errors, data format mismatches

#### 2.2 Data Enrichment Section

**Overview:**  
Splits raw leads into records, enriches each via Perplexity AI web-grounded research, parses JSON response, and updates the enriched data back into Google Sheets.

**Nodes Involved:**  
- Get Unenriched Records  
- Limit Enrichment Batch Size  
- Split Records for Processing  
- Business Data Enrichment  
- Parse Enrichment Response  
- Save Enriched Business Data

**Node Details:**

- **Get Unenriched Records**  
  - *Type:* Google Sheets  
  - *Role:* Fetches records from Raw Data sheet where "enriched" column is "no"  
  - *Connections:* Output to Limit Enrichment Batch Size  
  - *Edge cases:* Empty results if no unenriched records; sheet access issues

- **Limit Enrichment Batch Size**  
  - *Type:* Limit node  
  - *Role:* Restricts batch size to 20 records per enrichment run to control API usage  
  - *Connections:* Input from Get Unenriched Records; output to Split Records for Processing

- **Split Records for Processing**  
  - *Type:* SplitOut node  
  - *Role:* Splits array of records into individual items for processing  
  - *Connections:* Input from Limit Enrichment Batch Size; output to Business Data Enrichment

- **Business Data Enrichment**  
  - *Type:* Perplexity AI node  
  - *Role:* Enriches business data by live web research according to strict schema: validates company name, website, contact, social profiles, normalizes phone/email  
  - *Configuration:* Uses a detailed system message with rules for enrichment, returns JSON only  
  - *Credentials:* Perplexity API key required  
  - *Connections:* Input from Split Records for Processing; output to Parse Enrichment Response  
  - *Edge cases:* API failures, parsing errors, ambiguous data return (null fields)

- **Parse Enrichment Response**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Parses Perplexity API JSON response, extracts the enriched fields, and prepares data for spreadsheet update  
  - *Connections:* Input from Business Data Enrichment; output to Save Enriched Business Data  
  - *Edge cases:* JSON parse errors, missing fields, malformed response

- **Save Enriched Business Data**  
  - *Type:* Google Sheets  
  - *Role:* Updates enriched records back into Raw Data sheet, matching by Place Id  
  - *Credentials:* Google Sheets OAuth2  
  - *Connections:* Input from Parse Enrichment Response  
  - *Edge cases:* Sheet write errors, concurrency issues

#### 2.3 Company Knowledge Base Section

**Overview:**  
Watches a Google Drive document for updates, downloads it, parses content using LlamaIndex cloud service, processes text chunks, and stores vector embeddings into Pinecone vector database for AI retrieval.

**Nodes Involved:**  
- Knowledge Base Updated Trigger  
- Download Knowledge Document  
- Parse Document via LlamaIndex  
- Monitor Document Processing  
- Check Parsing Completion  
- Wait Before Status Recheck  
- Retrieve Parsed Content  
- Document Content Loader  
- Text Chunk Processor  
- Knowledge Embeddings Model  
- Store Knowledge Embeddings

**Node Details:**

- **Knowledge Base Updated Trigger**  
  - *Type:* Google Drive Trigger  
  - *Role:* Triggers workflow on specific Google Doc update (knowledge base document)  
  - *Credentials:* Google Drive OAuth2  
  - *Connections:* Output to Download Knowledge Document

- **Download Knowledge Document**  
  - *Type:* Google Drive (download)  
  - *Role:* Downloads the updated document file content  
  - *Connections:* Output to Parse Document via LlamaIndex  
  - *Edge cases:* File access errors, network failures

- **Parse Document via LlamaIndex**  
  - *Type:* HTTP Request (LlamaIndex API)  
  - *Role:* Uploads document for parsing and embedding creation  
  - *Credentials:* LlamaIndex API key (HTTP Header Auth)  
  - *Connections:* Output to Monitor Document Processing

- **Monitor Document Processing**  
  - *Type:* HTTP Request  
  - *Role:* Polls LlamaIndex API for parsing job status  
  - *Connections:* On success to Check Parsing Completion; on failure/backoff to Wait Before Status Recheck

- **Check Parsing Completion**  
  - *Type:* IF node  
  - *Role:* Checks if parsing status equals "SUCCESS"  
  - *Connections:* True to Retrieve Parsed Content; False to Wait Before Status Recheck

- **Wait Before Status Recheck**  
  - *Type:* Wait node  
  - *Role:* Delays before re-polling parsing status (10 seconds)  
  - *Connections:* Loops back to Monitor Document Processing

- **Retrieve Parsed Content**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves parsed document content in markdown format after success  
  - *Connections:* Output to Document Content Loader

- **Document Content Loader**  
  - *Type:* LangChain Document Loader  
  - *Role:* Loads parsed text chunks for embedding processing  
  - *Connections:* Output to Text Chunk Processor

- **Text Chunk Processor**  
  - *Type:* LangChain Text Splitter  
  - *Role:* Splits document into overlapping chunks (200 chars overlap) for vector embeddings  
  - *Connections:* Output to Knowledge Embeddings Model

- **Knowledge Embeddings Model**  
  - *Type:* LangChain OpenAI Embeddings  
  - *Role:* Generates text embeddings using OpenAI's "text-embedding-3-large" model  
  - *Credentials:* OpenAI API  
  - *Connections:* Output to Store Knowledge Embeddings

- **Store Knowledge Embeddings**  
  - *Type:* LangChain Pinecone Vector Store  
  - *Role:* Inserts embeddings into Pinecone index "n8n-recharge" under namespace "RechargeKnowledge"  
  - *Credentials:* Pinecone API key  
  - *Connections:* Terminal node of this block  
  - *Edge cases:* API quota, connection errors, index configuration issues

#### 2.4 Outbound Messaging Section

**Overview:**  
Selects candidates for outreach, limits batch size, validates phone numbers, generates personalized outbound messages using GPT-4, manages conversation memory, simulates typing indicators and delays, sends WhatsApp messages, and marks leads as contacted.

**Nodes Involved:**  
- Daily Outbound Schedule  
- Get Unenriched Records (shared with enrichment block)  
- Schedule Outbound message  
- Get Outbound Candidates  
- Limit Outbound Batch Size  
- Validate Phone Number Exists  
- Prepare Outbound Session Data  
- Outbound Message Generator (GPT-4 Agent)  
- Outbound Message LLM (GPT-4 Chat)  
- Outbound Conversation Memory (Postgres)  
- Format Outbound Message Data  
- Wait Before Read Receipt - Outbound  
- Show Typing Indicator - Outbound  
- Mark Message as Read - Outbound  
- Simulate Typing Delay - Outbound  
- Stop Typing Indicator - Outbound  
- Send Outbound WhatsApp Message  
- Mark as Contacted  

**Node Details:**

- **Daily Outbound Schedule** & **Schedule Outbound message**  
  - *Type:* Schedule triggers  
  - *Role:* Automate daily scraping and outbound message batches  
  - *Connections:* Trigger Get Unenriched Records and Get Outbound Candidates respectively

- **Get Outbound Candidates**  
  - *Type:* Google Sheets  
  - *Role:* Retrieves leads for outreach from the Raw Data sheet  
  - *Connections:* Output to Limit Outbound Batch Size

- **Limit Outbound Batch Size**  
  - *Type:* Limit node  
  - *Role:* Restricts batch size for outbound to manageable number  
  - *Connections:* Output to Validate Phone Number Exists

- **Validate Phone Number Exists**  
  - *Type:* IF node  
  - *Role:* Checks if "Phone Number" exists and is non-empty  
  - *Connections:* True to Prepare Outbound Session Data; False stops flow

- **Prepare Outbound Session Data**  
  - *Type:* Set node  
  - *Role:* Prepares session key using phone number for memory tracking  
  - *Connections:* Output to Outbound Message Generator and Outbound Conversation Memory

- **Outbound Message Generator**  
  - *Type:* LangChain Agent with GPT-4  
  - *Role:* Generates personalized opening message in Indonesian based on business name and address  
  - *System Message:* Defines persona "Jessica" and strict message template  
  - *Connections:* Output to Format Outbound Message Data

- **Outbound Message LLM**  
  - *Type:* GPT-4 Chat node  
  - *Role:* Underlying language model used by Agent node

- **Outbound Conversation Memory**  
  - *Type:* Postgres Chat Memory  
  - *Role:* Stores conversation history keyed by phone number session  
  - *Credentials:* PostgreSQL/Neon  
  - *Connections:* Feeds context to Agent nodes

- **Format Outbound Message Data**  
  - *Type:* Set node  
  - *Role:* Formats phone number and generated message for sending  
  - *Connections:* Output to Wait Before Read Receipt - Outbound

- **Wait Before Read Receipt - Outbound**  
  - *Type:* Wait node  
  - *Role:* Randomized delay before showing typing indicator  
  - *Connections:* Output to Show Typing Indicator - Outbound

- **Show Typing Indicator - Outbound**  
  - *Type:* GOWA WhatsApp node  
  - *Role:* Sends "typing" presence on WhatsApp  
  - *Credentials:* WhatsApp API via GOWA  
  - *Connections:* Output to Mark Message as Read - Outbound

- **Mark Message as Read - Outbound**  
  - *Type:* GOWA WhatsApp node  
  - *Role:* Marks outbound message as read in WhatsApp  
  - *Connections:* Output to Simulate Typing Delay - Outbound

- **Simulate Typing Delay - Outbound**  
  - *Type:* Wait node  
  - *Role:* Simulates typing delay before stopping indicator  
  - *Connections:* Output to Stop Typing Indicator - Outbound

- **Stop Typing Indicator - Outbound**  
  - *Type:* GOWA WhatsApp node  
  - *Role:* Stops "typing" presence on WhatsApp  
  - *Connections:* Output to Send Outbound WhatsApp Message

- **Send Outbound WhatsApp Message**  
  - *Type:* GOWA WhatsApp node  
  - *Role:* Sends the generated outbound message to recipient  
  - *Connections:* Output to Mark as Contacted

- **Mark as Contacted**  
  - *Type:* Google Sheets  
  - *Role:* Updates lead record in Raw Data sheet marking outreach status as "yes"  
  - *Connections:* Terminal node for outbound messaging

#### 2.5 Reply Handling Section

**Overview:**  
Handles incoming WhatsApp replies, extracts session data, processes replies with GPT-4 agent using company knowledge base, manages conversation memory, formats response, simulates typing, and sends WhatsApp reply messages.

**Nodes Involved:**  
- Incoming message (Webhook)  
- Extract WhatsApp Session Data  
- Reply Conversation Memory  
- Reply Handler AI Agent (GPT-4 Agent)  
- Reply Handler LLM (GPT-4 Chat)  
- Query Knowledge Base (Pinecone Vector Store)  
- Search Result Reranker (Cohere)  
- Format Reply Message Data  
- Wait Before Read Receipt - Reply  
- Show Typing Indicator - Reply  
- Mark Message as Read - Reply  
- Simulate Typing Delay - Reply  
- Stop Typing Indicator - Reply  
- Send WhatsApp Reply  
- Save Lead Contact Information (Google Sheets Tool)

**Node Details:**

- **Incoming message**  
  - *Type:* WhatsApp webhook trigger (WAHA)  
  - *Role:* Receives inbound WhatsApp messages  
  - *Connections:* Output to Extract WhatsApp Session Data

- **Extract WhatsApp Session Data**  
  - *Type:* Set node  
  - *Role:* Extracts sender phone number (session key) and message body from webhook payload  
  - *Connections:* Output to Reply Conversation Memory and Reply Handler AI Agent

- **Reply Conversation Memory**  
  - *Type:* Postgres Chat Memory  
  - *Role:* Retrieves conversation context for reply handling  
  - *Connections:* Feeds context to Reply Handler AI Agent

- **Reply Handler AI Agent**  
  - *Type:* LangChain Agent with GPT-4  
  - *Role:* Analyzes reply message, classifies conversation flow, generates appropriate reply using company knowledge base as tool, handles PIC contact data saving, proposal requests, meeting scheduling, or polite refusals  
  - *System Message:* Detailed instructions with response templates and conversation logic  
  - *Connections:* Output to Format Reply Message Data

- **Reply Handler LLM**  
  - *Type:* GPT-4 Chat node  
  - *Role:* Underlying language model used by Reply Handler AI Agent

- **Query Knowledge Base**  
  - *Type:* Pinecone Vector Store Query  
  - *Role:* Retrieves relevant knowledge base documents to support reply generation  
  - *Credentials:* Pinecone API

- **Search Result Reranker**  
  - *Type:* Cohere Reranker  
  - *Role:* Reranks query results for better context relevance in reply generation

- **Format Reply Message Data**  
  - *Type:* Set node  
  - *Role:* Prepares WhatsApp phone number and reply message for sending  
  - *Connections:* Output to Wait Before Read Receipt - Reply

- **Wait Before Read Receipt - Reply**  
  - *Type:* Wait node  
  - *Role:* Random delay to simulate natural interaction timing  
  - *Connections:* Output to Show Typing Indicator - Reply

- **Show Typing Indicator - Reply**  
  - *Type:* GOWA WhatsApp node  
  - *Role:* Sends "typing" presence for reply  
  - *Credentials:* WhatsApp API  
  - *Connections:* Output to Mark Message as Read - Reply

- **Mark Message as Read - Reply**  
  - *Type:* GOWA WhatsApp node  
  - *Role:* Marks inbound message as read  
  - *Connections:* Output to Simulate Typing Delay - Reply

- **Simulate Typing Delay - Reply**  
  - *Type:* Wait node  
  - *Role:* Simulated typing pause before sending reply  
  - *Connections:* Output to Stop Typing Indicator - Reply

- **Stop Typing Indicator - Reply**  
  - *Type:* GOWA WhatsApp node  
  - *Role:* Stops "typing" presence after delay  
  - *Connections:* Output to Send WhatsApp Reply

- **Send WhatsApp Reply**  
  - *Type:* GOWA WhatsApp node  
  - *Role:* Sends AI-generated reply message to sender  
  - *Connections:* Terminal node for reply flow

- **Save Lead Contact Information**  
  - *Type:* Google Sheets Tool (Append)  
  - *Role:* Saves PIC contact details provided by partner in replies into a separate Leads sheet  
  - *Connections:* Invoked as a tool by Reply Handler AI Agent  
  - *Edge cases:* Partial or missing data prompts AI to ask for info again

#### 2.6 Supporting Utilities & Configuration Notes

**Nodes Involved:**  
- Sticky Notes (informational)  
- Limit nodes for batch size control  
- Set nodes for session data and message formatting  
- Wait nodes for natural timing simulation  
- Conversation Memory nodes for AI context persistence

---

### 3. Summary Table

| Node Name                    | Node Type                               | Functional Role                                 | Input Node(s)                                    | Output Node(s)                                  | Sticky Note                                                                                  |
|------------------------------|---------------------------------------|------------------------------------------------|-------------------------------------------------|------------------------------------------------|----------------------------------------------------------------------------------------------|
| Manual Trigger - Start Scraping | Manual Trigger                        | Initiate scraping process                       |                                                 | Configure Scraping Parameters                   | # Data Scraping & Cleaning Section                                                           |
| Configure Scraping Parameters  | Set                                   | Define scraping parameters                      | Manual Trigger - Start Scraping                   | Execute Google Maps Scraper                     | # Data Scraping & Cleaning Section                                                           |
| Execute Google Maps Scraper    | Apify                                 | Run Google Maps scraping with params            | Configure Scraping Parameters                      | Fetch Scraped Business Data                      | # Data Scraping & Cleaning Section                                                           |
| Fetch Scraped Business Data    | HTTP Request                         | Retrieve scraped leads dataset                   | Execute Google Maps Scraper                        | Save Raw Business Leads                          | # Data Scraping & Cleaning Section                                                           |
| Save Raw Business Leads        | Google Sheets                       | Save raw scraped leads                          | Fetch Scraped Business Data                        |                                                | # Data Scraping & Cleaning Section                                                           |
| Get Unenriched Records         | Google Sheets                       | Retrieve leads not yet enriched                 | Daily Outbound Schedule                           | Limit Enrichment Batch Size                      | # Data Enrichment Section                                                                     |
| Limit Enrichment Batch Size    | Limit                                | Limit batch size for data enrichment            | Get Unenriched Records                            | Split Records for Processing                     | # Data Enrichment Section                                                                     |
| Split Records for Processing   | SplitOut                            | Split records for enrichment                     | Limit Enrichment Batch Size                       | Business Data Enrichment                         | # Data Enrichment Section                                                                     |
| Business Data Enrichment       | Perplexity AI                       | Enrich business data via live web research      | Split Records for Processing                      | Parse Enrichment Response                        | # Data Enrichment Section                                                                     |
| Parse Enrichment Response      | Code                                | Parse and extract enrichment JSON response      | Business Data Enrichment                          | Save Enriched Business Data                      | # Data Enrichment Section                                                                     |
| Save Enriched Business Data    | Google Sheets                       | Update enriched data into sheet                  | Parse Enrichment Response                         |                                                | # Data Enrichment Section                                                                     |
| Knowledge Base Updated Trigger | Google Drive Trigger                | Trigger on knowledge base document update       |                                                 | Download Knowledge Document                      | # Company Knowledge Base Section                                                             |
| Download Knowledge Document    | Google Drive                       | Download updated knowledge base document         | Knowledge Base Updated Trigger                    | Parse Document via LlamaIndex                    | # Company Knowledge Base Section                                                             |
| Parse Document via LlamaIndex  | HTTP Request                       | Parse document content via LlamaIndex API        | Download Knowledge Document                       | Monitor Document Processing                      | # Company Knowledge Base Section                                                             |
| Monitor Document Processing    | HTTP Request                       | Poll for parsing job status                       | Parse Document via LlamaIndex                     | Check Parsing Completion, Wait Before Status Recheck | # Company Knowledge Base Section                                                             |
| Check Parsing Completion       | IF                                  | Check if parsing status is SUCCESS                | Monitor Document Processing                       | Retrieve Parsed Content, Wait Before Status Recheck | # Company Knowledge Base Section                                                             |
| Wait Before Status Recheck     | Wait                                | Delay before rechecking parsing status            | Check Parsing Completion                          | Monitor Document Processing                      | # Company Knowledge Base Section                                                             |
| Retrieve Parsed Content        | HTTP Request                       | Retrieve parsed document content                  | Check Parsing Completion                          | Document Content Loader                          | # Company Knowledge Base Section                                                             |
| Document Content Loader        | LangChain Document Loader          | Load parsed content for text splitting and embedding | Retrieve Parsed Content                          | Text Chunk Processor                             | # Company Knowledge Base Section                                                             |
| Text Chunk Processor           | LangChain Text Splitter            | Split document content into overlapping chunks   | Document Content Loader                           | Knowledge Embeddings Model                       | # Company Knowledge Base Section                                                             |
| Knowledge Embeddings Model     | LangChain OpenAI Embeddings        | Generate text embeddings from chunks              | Text Chunk Processor                             | Store Knowledge Embeddings                       | # Company Knowledge Base Section                                                             |
| Store Knowledge Embeddings     | LangChain Pinecone Vector Store   | Store embeddings in Pinecone vector database      | Knowledge Embeddings Model                        |                                                | # Company Knowledge Base Section                                                             |
| Daily Outbound Schedule        | Schedule Trigger                  | Daily trigger for outbound process                |                                                 | Get Unenriched Records                           | # Outbound Messaging Section                                                                 |
| Schedule Outbound message      | Schedule Trigger                  | Schedule trigger for outbound messaging           |                                                 | Get Outbound Candidates                          | # Outbound Messaging Section                                                                 |
| Get Outbound Candidates        | Google Sheets                     | Fetch candidates for outreach                      | Schedule Outbound message                         | Limit Outbound Batch Size                        | # Outbound Messaging Section                                                                 |
| Limit Outbound Batch Size      | Limit                            | Limit number of outbound messages per batch       | Get Outbound Candidates                           | Validate Phone Number Exists                     | # Outbound Messaging Section                                                                 |
| Validate Phone Number Exists   | IF                               | Check if phone number exists before messaging     | Limit Outbound Batch Size                         | Prepare Outbound Session Data                    | # Outbound Messaging Section                                                                 |
| Prepare Outbound Session Data  | Set                              | Prepare session key based on phone number         | Validate Phone Number Exists                      | Outbound Message Generator, Outbound Conversation Memory | # Outbound Messaging Section                                                                 |
| Outbound Message Generator     | LangChain Agent (GPT-4)           | Generate outbound personalized message             | Prepare Outbound Session Data                     | Format Outbound Message Data                     | # Outbound Messaging Section                                                                 |
| Outbound Message LLM           | GPT-4 Chat model                 | Underlying GPT-4 language model for Agent          |                                                  |                                                | # Outbound Messaging Section                                                                 |
| Outbound Conversation Memory   | Postgres Chat Memory             | Store conversation context keyed by session        | Prepare Outbound Session Data                     | Outbound Message Generator                       | # Outbound Messaging Section                                                                 |
| Format Outbound Message Data   | Set                              | Format message and number for WhatsApp sending    | Outbound Message Generator                        | Wait Before Read Receipt - Outbound              | # Outbound Messaging Section                                                                 |
| Wait Before Read Receipt - Outbound | Wait                          | Random delay before indicating typing              | Format Outbound Message Data                      | Show Typing Indicator - Outbound                 | # Outbound Messaging Section                                                                 |
| Show Typing Indicator - Outbound | GOWA WhatsApp API              | Send WhatsApp "typing" presence                     | Wait Before Read Receipt - Outbound               | Mark Message as Read - Outbound                   | # Outbound Messaging Section                                                                 |
| Mark Message as Read - Outbound | GOWA WhatsApp API              | Mark outbound message as read                       | Show Typing Indicator - Outbound                   | Simulate Typing Delay - Outbound                  | # Outbound Messaging Section                                                                 |
| Simulate Typing Delay - Outbound | Wait                          | Simulate typing delay before stopping indicator    | Mark Message as Read - Outbound                     | Stop Typing Indicator - Outbound                   | # Outbound Messaging Section                                                                 |
| Stop Typing Indicator - Outbound | GOWA WhatsApp API             | Stop WhatsApp typing presence                        | Simulate Typing Delay - Outbound                    | Send Outbound WhatsApp Message                     | # Outbound Messaging Section                                                                 |
| Send Outbound WhatsApp Message | GOWA WhatsApp API              | Send the generated outbound WhatsApp message       | Stop Typing Indicator - Outbound                    | Mark as Contacted                                  | # Outbound Messaging Section                                                                 |
| Mark as Contacted              | Google Sheets                   | Mark lead as contacted in Raw Data sheet            | Send Outbound WhatsApp Message                     |                                                | # Outbound Messaging Section                                                                 |
| Incoming message              | WAHA WhatsApp Webhook           | Trigger on incoming WhatsApp message                |                                                 | Extract WhatsApp Session Data                     | # Reply Handling Section                                                                     |
| Extract WhatsApp Session Data  | Set                              | Extract session and message text from incoming msg | Incoming message                                  | Reply Conversation Memory, Reply Handler AI Agent | # Reply Handling Section                                                                     |
| Reply Conversation Memory      | Postgres Chat Memory             | Load conversation memory for reply handling         | Extract WhatsApp Session Data                      | Reply Handler AI Agent                            | # Reply Handling Section                                                                     |
| Reply Handler AI Agent         | LangChain Agent (GPT-4)           | Analyze reply, classify, and generate response      | Extract WhatsApp Session Data, Reply Conversation Memory, Query Knowledge Base | Format Reply Message Data, Save Lead Contact Information (tool) | # Reply Handling Section                                                                     |
| Reply Handler LLM             | GPT-4 Chat model                 | Underlying GPT-4 model for Reply Handler Agent       |                                                  |                                                | # Reply Handling Section                                                                     |
| Query Knowledge Base           | Pinecone Vector Store           | Retrieve relevant knowledge base documents           | Reply Handler AI Agent                             | Reply Handler AI Agent (tool usage)               | # Reply Handling Section                                                                     |
| Search Result Reranker         | Cohere Reranker                | Rerank knowledge base query results                   | Query Knowledge Base                               | Query Knowledge Base                               | # Reply Handling Section                                                                     |
| Format Reply Message Data      | Set                              | Format reply message and number for WhatsApp send   | Reply Handler AI Agent                             | Wait Before Read Receipt - Reply                   | # Reply Handling Section                                                                     |
| Wait Before Read Receipt - Reply | Wait                          | Random delay before typing indicator for reply       | Format Reply Message Data                          | Show Typing Indicator - Reply                      | # Reply Handling Section                                                                     |
| Show Typing Indicator - Reply  | GOWA WhatsApp API              | Send "typing" presence for reply                       | Wait Before Read Receipt - Reply                   | Mark Message as Read - Reply                        | # Reply Handling Section                                                                     |
| Mark Message as Read - Reply   | GOWA WhatsApp API              | Mark inbound message as read                           | Show Typing Indicator - Reply                      | Simulate Typing Delay - Reply                       | # Reply Handling Section                                                                     |
| Simulate Typing Delay - Reply  | Wait                          | Simulate typing delay before sending reply            | Mark Message as Read - Reply                       | Stop Typing Indicator - Reply                       | # Reply Handling Section                                                                     |
| Stop Typing Indicator - Reply  | GOWA WhatsApp API              | Stop "typing" presence after delay                     | Simulate Typing Delay - Reply                      | Send WhatsApp Reply                                 | # Reply Handling Section                                                                     |
| Send WhatsApp Reply            | GOWA WhatsApp API              | Send AI-generated reply message                        | Stop Typing Indicator - Reply                      |                                                | # Reply Handling Section                                                                     |
| Save Lead Contact Information  | Google Sheets Tool             | Save PIC contact info from replies                      | Reply Handler AI Agent (tool usage)                | Reply Handler AI Agent                              | # Reply Handling Section                                                                     |
| Sticky Notes (various)         | Sticky Note                    | Informational and setup instructions                   |                                                 |                                                | See individual sticky notes for context                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Start the scraping process manually

2. **Create Set Node (Configure Scraping Parameters)**  
   - Assign variables:  
     - Location Category: `"bar", "restaurant", "mall"`  
     - lokasi: `"Jakarta"`  
     - jumlah leads: `150`  
     - minimum Stars: `"four"`  
     - Skip Closed Place: `true`  
   - Connect Manual Trigger → this node

3. **Create Apify Node (Execute Google Maps Scraper)**  
   - Actor ID: `nwua9Gu5YrADL7ZDj` (Google Maps Scraper)  
   - Custom Body: JSON with fields from Set node, e.g., locationQuery, maxCrawledPlacesPerSearch, etc.  
   - Credentials: Apify API  
   - Connect Set node → Apify node

4. **Create HTTP Request Node (Fetch Scraped Business Data)**  
   - URL: `https://api.apify.com/v2/acts/compass~crawler-google-places/runs/last/dataset/items`  
   - Auth: Apify API  
   - Connect Apify node → HTTP Request

5. **Create Google Sheets Node (Save Raw Business Leads)**  
   - Document: Google Sheets "Recharge Database"  
   - Sheet: "Raw Data"  
   - Operation: Append or Update by Place Id  
   - Map fields for company info, contacts, socials, reviews from HTTP Request output  
   - Credentials: Google Sheets OAuth2  
   - Connect HTTP Request → Google Sheets

6. **Create Schedule Trigger Node (Daily Outbound Schedule)**  
   - Interval: Monthly (customize as needed)  
   - Connect to next block

7. **Create Google Sheets Node (Get Unenriched Records)**  
   - Filter: enriched = "no" in Raw Data sheet  
   - Credentials: Google Sheets OAuth2  
   - Connect Schedule Trigger → Google Sheets

8. **Create Limit Node (Limit Enrichment Batch Size)**  
   - Max Items: 20  
   - Connect Get Unenriched Records → Limit

9. **Create SplitOut Node (Split Records for Processing)**  
   - Field to Split Out: all relevant columns including Place Id, Title, Phone Number, etc.  
   - Connect Limit → SplitOut

10. **Create Perplexity Node (Business Data Enrichment)**  
    - Model: "sonar-pro"  
    - Input: JSON record per item  
    - System prompt: detailed instructions for web data enrichment  
    - Credentials: Perplexity API  
    - Connect SplitOut → Perplexity

11. **Create Code Node (Parse Enrichment Response)**  
    - JavaScript to parse Perplexity JSON response and map fields for sheet update  
    - Connect Perplexity → Code node

12. **Create Google Sheets Node (Save Enriched Business Data)**  
    - Document & Sheet: same as raw data  
    - Operation: Append or Update by Place Id  
    - Credentials: Google Sheets OAuth2  
    - Connect Code node → Google Sheets

13. **Create Google Drive Trigger Node (Knowledge Base Updated Trigger)**  
    - Watch file ID for knowledge base doc updates  
    - Credentials: Google Drive OAuth2

14. **Create Google Drive Node (Download Knowledge Document)**  
    - Download the updated document content  
    - Connect Drive Trigger → Drive Download

15. **Create HTTP Request Node (Parse Document via LlamaIndex)**  
    - POST multipart form-data to LlamaIndex API with file data  
    - Credentials: LlamaIndex API (HTTP Header Auth)  
    - Connect Drive Download → HTTP Request

16. **Create HTTP Request Node (Monitor Document Processing)**  
    - Poll LlamaIndex job status endpoint with job ID  
    - Connect LlamaIndex Upload → Status Monitor

17. **Create IF Node (Check Parsing Completion)**  
    - Condition: `status == "SUCCESS"`  
    - True → Retrieve Parsed Content  
    - False → Wait Before Status Recheck

18. **Create Wait Node (Wait Before Status Recheck)**  
    - Delay 10 seconds  
    - Connect back to Monitor Document Processing

19. **Create HTTP Request Node (Retrieve Parsed Content)**  
    - Get parsed markdown content for embedding  
    - Connect IF True → Retrieve Parsed Content

20. **Create LangChain Document Loader Node (Document Content Loader)**  
    - Load retrieved markdown text  
    - Connect Retrieve Parsed Content → Document Loader

21. **Create LangChain Text Splitter Node (Text Chunk Processor)**  
    - Recursive Character Splitter, chunk overlap 200 chars  
    - Connect Document Loader → Text Splitter

22. **Create LangChain OpenAI Embeddings Node (Knowledge Embeddings Model)**  
    - Model: text-embedding-3-large  
    - Credentials: OpenAI API  
    - Connect Text Splitter → Embeddings

23. **Create LangChain Pinecone Vector Store Node (Store Knowledge Embeddings)**  
    - Mode: insert  
    - Pinecone index: n8n-recharge  
    - Namespace: RechargeKnowledge  
    - Credentials: Pinecone API  
    - Connect Embeddings → Pinecone Store

24. **Create Schedule Trigger Node (Schedule Outbound message)**  
    - Interval: as desired for outbound batches

25. **Create Google Sheets Node (Get Outbound Candidates)**  
    - Retrieve leads from Raw Data sheet  
    - Credentials: Google Sheets OAuth2  
    - Connect Schedule Outbound message → Get Candidates

26. **Create Limit Node (Limit Outbound Batch Size)**  
    - Optional batch size limit  
    - Connect Get Candidates → Limit

27. **Create IF Node (Validate Phone Number Exists)**  
    - Condition: Phone Number exists and non-empty  
    - True → Prepare Outbound Session Data

28. **Create Set Node (Prepare Outbound Session Data)**  
    - Set session key from phone number for conversations

29. **Create LangChain Agent Node (Outbound Message Generator)**  
    - System message: persona "Jessica", Indonesian greeting template, variables: company name and address  
    - GPT-4 model  
    - Connect Set → Agent

30. **Create GPT-4 Chat Node (Outbound Message LLM)**  
    - GPT-4.1-mini model  
    - Connect to Agent node as language model

31. **Create Postgres Chat Memory Node (Outbound Conversation Memory)**  
    - Table: [Yourcompany]ChatHistories  
    - Session key: phone number  
    - Credentials: PostgreSQL/Neon  
    - Connect Set → Memory and Memory → Agent

32. **Create Set Node (Format Outbound Message Data)**  
    - Format phone number and message for WhatsApp send

33. **Create Wait Node (Wait Before Read Receipt - Outbound)**  
    - Random delay 1-6 seconds

34. **Create GOWA WhatsApp Nodes for Typing Indicator and Messaging:**  
    - Show Typing Indicator - Outbound  
    - Mark Message as Read - Outbound  
    - Simulate Typing Delay - Outbound (3-8 sec)  
    - Stop Typing Indicator - Outbound  
    - Send Outbound WhatsApp Message  
    - Connect nodes sequentially from Wait node → Show Typing → Mark Read → Simulate Typing → Stop Typing → Send Message

35. **Create Google Sheets Node (Mark as Contacted)**  
    - Update "Outreach" column to "yes" by Place Id after message sent

36. **Create WAHA Webhook Trigger Node (Incoming message)**  
    - Configure webhook URL for WhatsApp incoming messages

37. **Create Set Node (Extract WhatsApp Session Data)**  
    - Extract sender phone number (session key) and message text from webhook payload

38. **Create Postgres Chat Memory Node (Reply Conversation Memory)**  
    - Table: [Yourcompany]chathistories  
    - Session key: sender phone number  
    - Credentials: PostgreSQL/Neon

39. **Create LangChain Agent Node (Reply Handler AI Agent)**  
    - System message: persona "Siska", detailed reply handling logic and conversation flows, use knowledge base tool and Google Sheets tool for saving contacts  
    - GPT-4 model  
    - Connect Extract Session Data and Reply Memory → Agent

40. **Create GPT-4 Chat Node (Reply Handler LLM)**  
    - GPT-4.1-mini model  
    - Connect to Agent node

41. **Create Pinecone Vector Store Node (Query Knowledge Base)**  
    - Query top 10 relevant entries with reranking using Cohere reranker  
    - Credentials: Pinecone API and Cohere API

42. **Create Cohere Reranker Node (Search Result Reranker)**  
    - Model: rerank-multilingual-v3.0

43. **Create Set Node (Format Reply Message Data)**  
    - Format phone number and reply message text for sending

44. **Create Wait Node (Wait Before Read Receipt - Reply)**  
    - Random delay 1-6 seconds

45. **Create GOWA WhatsApp Nodes for Reply Messaging:**  
    - Show Typing Indicator - Reply  
    - Mark Message as Read - Reply  
    - Simulate Typing Delay - Reply (3-8 sec)  
    - Stop Typing Indicator - Reply  
    - Send WhatsApp Reply  
    - Connect sequentially from Wait → Show Typing → Mark Read → Simulate Typing → Stop Typing → Send Reply

46. **Create Google Sheets Tool Node (Save Lead Contact Information)**  
    - Append PIC contact and proposal inquiry details to Leads sheet  
    - Used as tool invoked by Reply Handler AI Agent

47. **Add Sticky Notes** for documentation on credentials setup, database schema, and process sections.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                                                             |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| **Required Credentials:** Google Sheets OAuth2, Google Drive OAuth2, OpenAI API, Pinecone API, Cohere API, LlamaIndex API, Perplexity API, GOWA WhatsApp API, WAHA WhatsApp HTTP API, Apify API, PostgreSQL/Neon database. Setup guides linked in sticky notes.                                                                                                                                                                                                                                          | See Sticky Note5 at position [2704,608]                                                                                                    |
| **Google Sheets Structure:** Raw Data sheet with business listings, Leads Collected sheet for PIC contacts.                                                                                                                                                                                                                                                                                                                                                                                                   | Sticky Note8 at position [2704,1408]                                                                                                      |
| **PostgreSQL Tables:** Chat histories for conversation memory per session key (WhatsApp number).                                                                                                                                                                                                                                                                                                                                                                                                              | Sticky Note8                                                                                                                              |
| **Pinecone Vector DB:** Vector index named "n8n-recharge" with namespaces for knowledge base. Uses OpenAI text-embedding-3-large model.                                                                                                                                                                                                                                                                                                                                                                     | Sticky Note8                                                                                                                              |
| **WhatsApp APIs:** Integration uses GOWA (Go WhatsApp Web Multi-device) and WAHA (WhatsApp HTTP API) for inbound and outbound messages.                                                                                                                                                                                                                                                                                                                                                                     | Sticky Note5                                                                                                                                 |
| **Conversation AI Agents:** GPT-4.1-mini model used for message generation and reply handling with detailed system prompts for personas "Jessica" and "Siska". Context maintained with Postgres memory and knowledge base vector search with reranking.                                                                                                                                                                                                                                                     | Throughout workflow                                                                                                                        |
| **Data Enrichment AI:** Perplexity "sonar-pro" model used for live web data enrichment of business leads with strict schema and validation rules.                                                                                                                                                                                                                                                                                                                                                           | Block 2.2                                                                                                                                 |
| **Knowledge Base Sync:** Google Docs document auto-sync to vector DB embeddings via LlamaIndex parsing and Pinecone indexing for AI contextual queries.                                                                                                                                                                                                                                                                                                                                                      | Block 2.3                                                                                                                                 |
| **Batch Size Controls:** Limit nodes used to avoid API quota overruns and manage workflow performance.                                                                                                                                                                                                                                                                                                                                                                                                      | Throughout enrichment and outbound blocks                                                                                                |
| **Message Timing Simulation:** Wait nodes with randomized delays and WhatsApp typing presence nodes simulate human interaction for better user experience.                                                                                                                                                                                                                                                                                                                                                | Outbound and Reply Handling sections                                                                                                     |

---

This structured document provides a detailed, stepwise understanding of the "Automate Business Partner Outreach with Google Maps, GPT-4 & WhatsApp" workflow, enabling reproduction, modification, and error anticipation for advanced users and automation agents alike.

---

*Disclaimer: The text provided comes exclusively from an automated n8n workflow and complies strictly with content policies. No illegal, offensive, or protected elements are included. All data processed is legal and public.*