 AI Email Support System: Gmail, Gemini, GPT-4, Slack & Google Sheets Workflow

https://n8nworkflows.xyz/workflows/-ai-email-support-system--gmail--gemini--gpt-4--slack---google-sheets-workflow-6288


#  AI Email Support System: Gmail, Gemini, GPT-4, Slack & Google Sheets Workflow

### 1. Workflow Overview

This workflow automates AI-powered customer support via email by integrating Gmail, Google Gemini and OpenAI GPT-4 language models, Slack, and Google Sheets. It is designed for email-based customer inquiries, intelligently classifying issues, routing them to specialized AI agents, and automating responses or escalation to human support when necessary. The workflow also updates a support dashboard for tracking.

Logical blocks include:  
- **1.1 Input Reception:** Triggering from incoming Gmail emails and Google Drive file changes.  
- **1.2 Text Classification & Metadata Setup:** Classifying the email content and setting ticket metadata for routing.  
- **1.3 AI Agent Processing:** Specialized AI agents (Technical, Billing, Urgent Escalation, General Support) process requests with contextual knowledge bases and language models.  
- **1.4 Response & Logging:** Automated email responses sent and support tickets logged in Google Sheets.  
- **1.5 Human Escalation Notification:** Slack notifications for urgent cases needing human intervention.  
- **1.6 Knowledge Base Management:** Document ingestion from Google Drive, text splitting, embedding generation, and vector storage for retrieval by agents.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Listens for new incoming emails via Gmail and changes in Google Drive to trigger the workflow for email support or knowledge base updates.  
- **Nodes Involved:** Gmail Trigger, Google Drive Trigger, Google Drive  

**Node Details:**  
- **Gmail Trigger**  
  - Type: Trigger node for Gmail new emails  
  - Configuration: Watches inbox for new email events  
  - Inputs: External trigger  
  - Outputs: Email data forwarded to Text Classifier  
  - Failures: Gmail API auth errors, connectivity issues, empty emails  
- **Google Drive Trigger**  
  - Type: Trigger node for Google Drive file changes  
  - Configuration: Monitors specific folder(s) for new/updated documents  
  - Inputs: External trigger  
  - Outputs: File metadata forwarded to Google Drive node  
  - Failures: Google Drive auth errors, file access permissions  
- **Google Drive**  
  - Type: File retrieval from Google Drive  
  - Configuration: Downloads document files for further processing  
  - Inputs: Triggered by Google Drive Trigger  
  - Outputs: Files sent to Pinecone Vector Store1 for embedding and indexing  
  - Failures: File download errors, permission errors

---

#### 2.2 Text Classification & Metadata Setup

- **Overview:** Classifies incoming email text to determine support category and sets metadata to route tickets to specialized AI agents accordingly.  
- **Nodes Involved:** Text Classifier, OpenAI Classification Model, Set Ticket Metadata (4 variants)  

**Node Details:**  
- **Text Classifier**  
  - Type: Langchain text classification node using OpenAI  
  - Configuration: Uses OpenAI Classification Model as language model backend  
  - Inputs: Email text from Gmail Trigger  
  - Outputs: Four parallel outputs for different metadata sets  
  - Failures: API limits, classification ambiguity  
- **OpenAI Classification Model**  
  - Type: Language model node (OpenAI GPT-4 or similar)  
  - Configuration: Fine-tuned or prompt-based classifier for email content  
  - Inputs: Feeds Text Classifier  
  - Outputs: Classification results used for routing  
  - Failures: Auth errors, latency, unexpected input format  
- **Set Ticket Metadata, Set Ticket Metadata1, Set Ticket Metadata3, Set Ticket Metadata2**  
  - Type: Set nodes to attach routing metadata  
  - Configuration: Each corresponds to a support category (Technical, Billing, Urgent, General)  
  - Inputs: Four outputs from Text Classifier  
  - Outputs: Metadata for downstream AI agents  
  - Failures: Expression errors if classification data missing

---

#### 2.3 AI Agent Processing

- **Overview:** Routes tickets to specialized AI agents that utilize Google Gemini Chat Model, Pinecone vector search for document retrieval, and OpenAI embeddings for enhanced contextual understanding.  
- **Nodes Involved:** Technical Support Agent, Billing Support Agent, Urgent Escalation Agent, General Support Agent, Google Gemini Chat Model, Pinecone Vector Store, Embeddings OpenAI  

**Node Details:**  
- **Technical Support Agent, Billing Support Agent, Urgent Escalation Agent, General Support Agent**  
  - Type: Langchain AI agent nodes  
  - Configuration: Each agent configured for its domain knowledge and response style  
  - Inputs: Metadata enriched ticket data from Set Ticket Metadata nodes  
  - Outputs: Responses for sending via Gmail, logging, and escalation  
  - Failures: Model timeout, insufficient knowledge base coverage  
- **Google Gemini Chat Model**  
  - Type: Language model node using Google Gemini  
  - Configuration: Provides conversational AI responses to agents  
  - Inputs: Connected as language model backend for all agents  
  - Outputs: Generated AI responses  
  - Failures: API quota, latency, model update requirements  
- **Pinecone Vector Store**  
  - Type: Vector database for semantic document retrieval  
  - Configuration: Used for contextual retrieval by agents  
  - Inputs: Embeddings from Embeddings OpenAI  
  - Outputs: Relevant documents/pieces relevant to queries sent to agents  
  - Failures: Connectivity, indexing delays  
- **Embeddings OpenAI**  
  - Type: Embeddings generation node using OpenAI  
  - Configuration: Converts documents/text into vector embeddings for Pinecone  
  - Inputs: Document text from loaders and splitters  
  - Outputs: Embeddings to Pinecone Vector Store  
  - Failures: Auth, rate limits

---

#### 2.4 Response & Logging

- **Overview:** Sends AI-generated email responses back to customers and logs support tickets into a Google Sheets support dashboard for tracking.  
- **Nodes Involved:** Send Gmail Response, Log to Support Dashboard  

**Node Details:**  
- **Send Gmail Response**  
  - Type: Gmail node for sending emails  
  - Configuration: Replies to original sender with AI-generated response  
  - Inputs: Responses from AI agents  
  - Outputs: Confirmation of sent email  
  - Failures: Gmail API quota, invalid email addresses  
- **Log to Support Dashboard**  
  - Type: Google Sheets node  
  - Configuration: Appends ticket metadata and response summary to a Google Sheets document  
  - Inputs: Ticket and response data from AI agents  
  - Outputs: Confirmation of log entry  
  - Failures: Sheet permission errors, quota limits

---

#### 2.5 Human Escalation Notification

- **Overview:** Sends Slack notifications for urgent support tickets that require immediate human attention.  
- **Nodes Involved:** Slack Human Escalation  

**Node Details:**  
- **Slack Human Escalation**  
  - Type: Slack node for sending messages  
  - Configuration: Posts urgent ticket details into a designated Slack channel  
  - Inputs: Urgent Escalation Agent output  
  - Outputs: Confirmation of message sent  
  - Failures: Slack API token invalid, channel not found

---

#### 2.6 Knowledge Base Management

- **Overview:** Processes documents uploaded or updated in Google Drive by splitting text recursively, loading documents, generating vector embeddings, and indexing with Pinecone for AI agent retrieval.  
- **Nodes Involved:** Recursive Character Text Splitter, Default Data Loader, Pinecone Vector Store1, Embeddings OpenAI1  

**Node Details:**  
- **Recursive Character Text Splitter**  
  - Type: Text splitter node  
  - Configuration: Splits large documents recursively to optimize embedding size  
  - Inputs: Raw document text from Google Drive files  
  - Outputs: Smaller text chunks forwarded to Default Data Loader  
  - Failures: Unexpected document format, encoding issues  
- **Default Data Loader**  
  - Type: Document loader node  
  - Configuration: Loads text chunks for embedding generation  
  - Inputs: Split text chunks  
  - Outputs: Document data for embedding  
  - Failures: Data corruption  
- **Embeddings OpenAI1**  
  - Type: Embeddings generation node  
  - Configuration: Same as Embeddings OpenAI but for knowledge base documents  
  - Inputs: Loaded documents  
  - Outputs: Embeddings for Pinecone Vector Store1  
  - Failures: API errors  
- **Pinecone Vector Store1**  
  - Type: Vector storage node  
  - Configuration: Stores knowledge base embeddings indexed by document chunks  
  - Inputs: Embeddings OpenAI1 output  
  - Outputs: Indexed vectors for agent retrieval  
  - Failures: Connectivity, indexing errors

---

### 3. Summary Table

| Node Name                  | Node Type                             | Functional Role                         | Input Node(s)                | Output Node(s)                                          | Sticky Note                                      |
|----------------------------|-------------------------------------|---------------------------------------|-----------------------------|--------------------------------------------------------|-------------------------------------------------|
| Gmail Trigger              | n8n Trigger: Gmail                   | Incoming email trigger                 | External                    | Text Classifier                                         |                                                 |
| Text Classifier            | Langchain textClassifier             | Classifies email content               | Gmail Trigger, OpenAI Classification Model | Set Ticket Metadata, Set Ticket Metadata1, Set Ticket Metadata3, Set Ticket Metadata2 |                                                 |
| OpenAI Classification Model | Langchain lmChatOpenAi               | Language model for classification      | None (standalone model)      | Text Classifier                                        |                                                 |
| Set Ticket Metadata        | n8n Set node                        | Adds metadata for Technical Support   | Text Classifier             | Technical Support Agent                                 |                                                 |
| Set Ticket Metadata1       | n8n Set node                        | Adds metadata for Billing Support     | Text Classifier             | Billing Support Agent                                   |                                                 |
| Set Ticket Metadata3       | n8n Set node                        | Adds metadata for Urgent Escalation   | Text Classifier             | Urgent Escalation Agent                                 |                                                 |
| Set Ticket Metadata2       | n8n Set node                        | Adds metadata for General Support     | Text Classifier             | General Support Agent                                   |                                                 |
| Technical Support Agent    | Langchain agent                    | Handles technical support queries     | Set Ticket Metadata         | Send Gmail Response, Log to Support Dashboard          |                                                 |
| Billing Support Agent      | Langchain agent                    | Handles billing support queries       | Set Ticket Metadata1        | Send Gmail Response, Log to Support Dashboard          |                                                 |
| Urgent Escalation Agent    | Langchain agent                    | Handles urgent escalation cases        | Set Ticket Metadata3        | Send Gmail Response, Log to Support Dashboard, Slack Human Escalation |                                                 |
| General Support Agent      | Langchain agent                    | Handles general support queries       | Set Ticket Metadata2        | Send Gmail Response, Log to Support Dashboard          |                                                 |
| Send Gmail Response        | n8n Gmail                          | Sends email responses                  | Technical Support Agent, Billing Support Agent, Urgent Escalation Agent, General Support Agent | None                                                   |                                                 |
| Log to Support Dashboard   | n8n Google Sheets                  | Logs tickets and responses             | Technical Support Agent, Billing Support Agent, Urgent Escalation Agent, General Support Agent | None                                                   |                                                 |
| Slack Human Escalation     | n8n Slack                         | Sends urgent escalation notifications | Urgent Escalation Agent     | None                                                   |                                                 |
| Google Drive Trigger       | n8n Trigger: Google Drive          | Trigger for knowledge base updates    | External                    | Google Drive                                           |                                                 |
| Google Drive              | n8n Google Drive                   | Retrieves updated documents            | Google Drive Trigger        | Pinecone Vector Store1                                 |                                                 |
| Recursive Character Text Splitter | Langchain textSplitterRecursiveCharacterTextSplitter | Splits documents for embedding         | None (internal)             | Default Data Loader                                    |                                                 |
| Default Data Loader        | Langchain documentDefaultDataLoader | Loads document chunks                  | Recursive Character Text Splitter | Pinecone Vector Store1                                 |                                                 |
| Embeddings OpenAI          | Langchain embeddingsOpenAi         | Generates embeddings for tickets       | None (internal)             | Pinecone Vector Store                                  |                                                 |
| Pinecone Vector Store      | Langchain vectorStorePinecone      | Stores ticket context vectors          | Embeddings OpenAI           | Technical Support Agent, Billing Support Agent, Urgent Escalation Agent, General Support Agent |                                                 |
| Embeddings OpenAI1         | Langchain embeddingsOpenAi         | Generates embeddings for knowledge base | Default Data Loader          | Pinecone Vector Store1                                 |                                                 |
| Pinecone Vector Store1     | Langchain vectorStorePinecone      | Stores knowledge base vectors          | Embeddings OpenAI1, Google Drive | None                                                   |                                                 |
| Google Gemini Chat Model   | Langchain lmChatGoogleGemini       | Language model backend for agents      | None (internal)             | Technical Support Agent, Billing Support Agent, Urgent Escalation Agent, General Support Agent |                                                 |
| Sticky Note                | n8n Sticky Note                   | (Empty)                                | None                       | None                                                   |                                                 |
| Sticky Note1               | n8n Sticky Note                   | (Empty)                                | None                       | None                                                   |                                                 |
| Sticky Note2               | n8n Sticky Note                   | (Empty)                                | None                       | None                                                   |                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger node**  
   - Type: Gmail Trigger  
   - Purpose: Trigger on new incoming emails  
   - Configure OAuth2 credentials for Gmail access  
   - Set to watch inbox for new messages  

2. **Create OpenAI Classification Model node**  
   - Type: Langchain lmChatOpenAi  
   - Configure OpenAI API credentials (GPT-4 or equivalent)  
   - Use for text classification  

3. **Create Text Classifier node**  
   - Type: Langchain textClassifier  
   - Connect OpenAI Classification Model as language model backend  
   - Input: Gmail Trigger output (email text)  
   - Outputs: Four parallel outputs to Set Ticket Metadata nodes  

4. **Create four Set nodes for ticket metadata**  
   - Names: Set Ticket Metadata (Technical), Set Ticket Metadata1 (Billing), Set Ticket Metadata3 (Urgent), Set Ticket Metadata2 (General)  
   - Each receives one output from Text Classifier  
   - Configure to add routing metadata (e.g., category label, priority)  

5. **Create Google Gemini Chat Model node**  
   - Type: Langchain lmChatGoogleGemini  
   - Configure Google Gemini API credentials  
   - Used as language model backend for AI agents  

6. **Create Embeddings OpenAI node**  
   - Type: Langchain embeddingsOpenAi  
   - Setup OpenAI API for embeddings generation  

7. **Create Pinecone Vector Store node**  
   - Type: Langchain vectorStorePinecone  
   - Configure Pinecone API credentials and index for ticket context embeddings  
   - Connect Embeddings OpenAI output to this node  

8. **Create AI Agent nodes**  
   - Technical Support Agent  
   - Billing Support Agent  
   - Urgent Escalation Agent  
   - General Support Agent  
   - Each: Langchain agent node  
   - Connect corresponding Set Ticket Metadata node as input  
   - Connect Google Gemini Chat Model as language model backend  
   - Connect Pinecone Vector Store as vector store for retrieval  
   - Outputs: Responses to Send Gmail Response and Log to Support Dashboard nodes  
   - Urgent Escalation Agent also connects to Slack Human Escalation node  

9. **Create Send Gmail Response node**  
   - Type: Gmail  
   - Configure Gmail OAuth2 credentials  
   - Set to send replies to original email sender  
   - Connect from all AI agent nodes  

10. **Create Log to Support Dashboard node**  
    - Type: Google Sheets  
    - Configure Google Sheets API credentials  
    - Set to append rows with ticket metadata and responses  
    - Connect from all AI agent nodes  

11. **Create Slack Human Escalation node**  
    - Type: Slack  
    - Configure Slack OAuth token with permission to post messages  
    - Connect input from Urgent Escalation Agent output  

12. **Create Google Drive Trigger node**  
    - Type: Google Drive Trigger  
    - Configure Google Drive OAuth2 credentials  
    - Monitor folder for document updates  

13. **Create Google Drive node**  
    - Type: Google Drive  
    - Download updated documents from trigger  
    - Output to document processing nodes  

14. **Create Recursive Character Text Splitter node**  
    - Type: Langchain textSplitterRecursiveCharacterTextSplitter  
    - Receives raw documents from Google Drive node  
    - Splits large documents into chunks for embeddings  

15. **Create Default Data Loader node**  
    - Type: Langchain documentDefaultDataLoader  
    - Loads split document chunks for embeddings generation  

16. **Create Embeddings OpenAI1 node**  
    - Type: Langchain embeddingsOpenAi  
    - Generates embeddings for knowledge base document chunks  
    - Connect input from Default Data Loader  

17. **Create Pinecone Vector Store1 node**  
    - Type: Langchain vectorStorePinecone  
    - Stores knowledge base embeddings  
    - Connect input from Embeddings OpenAI1 and Google Drive node  

18. **Configure all node connections as per logic above**  
    - Gmail Trigger → Text Classifier → Set Ticket Metadata nodes → AI Agents → Send Gmail Response and Log to Support Dashboard  
    - Urgent Escalation Agent → Slack Human Escalation  
    - Google Drive Trigger → Google Drive → Recursive Character Text Splitter → Default Data Loader → Embeddings OpenAI1 → Pinecone Vector Store1  

19. **Test all API credentials and triggers**  
    - Validate Gmail and Google Drive OAuth2 connections  
    - Validate OpenAI and Google Gemini API keys  
    - Validate Pinecone index connectivity  
    - Validate Slack API token and channel access  

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                              |
|----------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| This workflow demonstrates advanced integration of AI language models (OpenAI GPT-4 & Google Gemini) for customer support automation. | AI model integration best practices                                                                            |
| Slack channel integration enables real-time human escalation notifications for urgent tickets.           | Slack API documentation: https://api.slack.com/messaging                                                     |
| Pinecone vector store is used for semantic search enabling context-aware AI responses.                    | Pinecone docs: https://www.pinecone.io/docs/                                                                 |
| Use Google Sheets as a lightweight, real-time support dashboard for ticket tracking and analytics.       | Google Sheets API: https://developers.google.com/sheets/api                                                   |
| Gmail and Google Drive OAuth2 credential configuration is required with appropriate scopes for full functionality. | Google API OAuth2 scopes: https://developers.google.com/identity/protocols/oauth2/scopes                       |

---

**Disclaimer:** The provided content is extracted exclusively from an automated workflow created with n8n, an integration and automation tool. The processing fully adheres to relevant content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.