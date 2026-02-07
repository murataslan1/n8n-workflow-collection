AI-Powered Email Triage & Auto-Response System with OpenAI Agents & Gmail

https://n8nworkflows.xyz/workflows/ai-powered-email-triage---auto-response-system-with-openai-agents---gmail-9157


# AI-Powered Email Triage & Auto-Response System with OpenAI Agents & Gmail

### 1. Workflow Overview

This workflow is an advanced AI-powered email triage and auto-response system designed for Gmail inbox management. It automatically classifies incoming emails into predefined categories, uses specialized AI agents to generate contextually appropriate replies based on email type, applies Gmail labels, sends draft or direct replies, and logs all interactions into Google Sheets. It also manages document updates from Google Drive into a Pinecone vector store knowledge base for internal AI reference. Notifications for important emails are sent via Telegram. The workflow includes error handling and logging mechanisms.

**Target Use Cases:**

- Automatically sorting and responding to business emails across multiple categories: internal communications, customer support, promotions, finance/billing, and sales opportunities.
- Maintaining an updated internal document knowledge base for AI agents to reference.
- Providing notifications to a Telegram channel for high-priority emails.
- Logging email interactions and errors for auditing and monitoring.

**Logical Blocks:**

- **1.1 Email Reception & Classification**: Gmail triggers, text classification, labeling.
- **1.2 AI Agent Processing**: Category-specific AI agents generating replies using OpenAI GPT-4o and Pinecone vector store.
- **1.3 Gmail Labeling & Reply Drafting**: Applying Gmail labels and preparing/sending replies or drafts.
- **1.4 Telegram Notifications**: Sending notifications for high-priority emails.
- **1.5 Document Management & Knowledge Base Update**: Google Drive triggers, file downloads, Pinecone vector store update.
- **1.6 Logging & Error Handling**: Logging interactions to Google Sheets and handling workflow errors.

---

### 2. Block-by-Block Analysis

#### 2.1 Email Reception & Classification

- **Overview:**  
  This block listens for new unread emails via Gmail Trigger, classifies them into one of five categories using a text classifier node based on email content, sender, and subject, and applies corresponding Gmail labels.

- **Nodes Involved:**  
  - Gmail Trigger1  
  - Text Classifier  
  - Add Label: Internal  
  - Add Label: Customer Support  
  - Add Label: Promotions  
  - Add Label: Admin/Finance  
  - Add Label: Sales Opportunities  

- **Node Details:**

  - **Gmail Trigger1**  
    - Type: Gmail Trigger  
    - Role: Initiates workflow on incoming unread emails.  
    - Config: Polls every minute, filters for unread emails.  
    - Input: Gmail inbox unread messages.  
    - Output: Email JSON with full content, headers, sender info.  
    - Failure modes: Gmail API rate limits, auth errors.

  - **Text Classifier**  
    - Type: Langchain Text Classifier  
    - Role: Categorizes email text into one of five categories: Internal, Customer Support, Promotions, Admin/Finance, Sales Opportunity.  
    - Config: Uses keywords and domain checks; combines sender, subject, and message text for classification.  
    - Expressions: Input text assembled as sender + subject + body.  
    - Output: Category label.  
    - Edge cases: Misclassification if email text is ambiguous or lacks keywords.

  - **Add Label Nodes (Internal, Customer Support, Promotions, Admin/Finance, Sales Opportunities)**  
    - Type: Gmail  
    - Role: Adds corresponding Gmail label to the email based on classification.  
    - Config: Uses Gmail OAuth2 credential, label IDs specific to Gmail labels.  
    - Input: Message ID from Text Classifier output.  
    - Output: Confirmation of label applied.  
    - Failure modes: Label ID changes, Gmail API permission errors.

---

#### 2.2 AI Agent Processing

- **Overview:**  
  This block uses specialized AI agents, each focused on a specific email category, to generate professional, context-aware email responses. Agents rely on Pinecone vector store knowledge base for internal data or analyze email content to draft replies.

- **Nodes Involved:**  
  - Internal Agent  
  - Customer Support Agent  
  - Promotions Analyst Agent  
  - Finance & Billing Assistant Agent  
  - Sales Agent  
  - Pinecone Vector Store1 to Pinecone Vector Store5 (as knowledge base tools)  

- **Node Details:**

  - **Internal Agent**  
    - Type: OpenAI GPT-4o model via Langchain OpenAI node  
    - Role: Handles internal company emails using Pinecone vector store as knowledge base.  
    - Config: System prompt enforces professionalism, conciseness, knowledge base reliance, and fallback escalation.  
    - Input: Email text from Gmail Trigger1, knowledge base retrieval via Pinecone Vector Store1.  
    - Output: JSON with subject and message for reply.  
    - Edge cases: Missing knowledge base info triggers fallback message.

  - **Customer Support Agent**  
    - Similar to Internal Agent but focuses on customer support inquiries.  
    - Uses Pinecone Vector Store2 as knowledge base.  
    - Output: JSON with subject and email body.

  - **Promotions Analyst Agent**  
    - Analyzes promotional emails to summarize offers and recommend action.  
    - Uses Pinecone Vector Store3.  
    - Output: JSON with summary and recommendation (yes/no).  
    - Followed by an "If" node to check recommendation to decide if a response is sent.

  - **Finance & Billing Assistant Agent**  
    - Summarizes financial/billing emails extracting key details without recommendations.  
    - Uses Pinecone Vector Store4.  
    - Output: JSON with subject, summary, and body.

  - **Sales Agent**  
    - Handles sales-related emails, drafting replies and notifications.  
    - Uses Pinecone Vector Store5.  
    - Output: JSON with subject, message, and notification text.

---

#### 2.3 Gmail Labeling & Reply Drafting

- **Overview:**  
  After classification and AI processing, this block applies Gmail labels, marks emails as read, sends replies or drafts replies, and logs the interactions into Google Sheets.

- **Nodes Involved:**  
  - Mark as read (multiple versions for various categories)  
  - Gmail1, Gmail3, Gmail4, Gmail5 (reply or draft message nodes)  
  - Log information into sheet, sheet1, sheet2, sheet3, sheet4 (Google Sheets logging)  

- **Node Details:**

  - **Mark as read nodes**  
    - Type: Gmail  
    - Role: Marks processed emails as read to prevent re-processing.  
    - Input: Message ID from Text Classifier node.  
    - Failure modes: Gmail permission errors.

  - **Gmail reply/draft nodes**  
    - Type: Gmail  
    - Role: Sends reply or saves draft reply based on AI-generated content.  
    - Config: Uses Gmail OAuth2 credentials, pulls reply text from AI node JSON outputs, sends to original sender.  
    - Variants: Some nodes send drafts, others send emails directly.  
    - Edge cases: Gmail send failures, invalid recipient addresses.

  - **Google Sheets logging nodes**  
    - Type: Google Sheets  
    - Role: Append a row logging email metadata, AI-generated reply, category, timestamps.  
    - Config: Uses Google Sheets OAuth2, writes to a specific spreadsheet and sheet.  
    - Edge cases: Sheets API rate limits, missing fields.

---

#### 2.4 Telegram Notifications

- **Overview:**  
  This block sends Telegram notifications to a designated chat for high-priority emails such as sales leads, finance/billing emails, customer support inquiries, and internal emails to alert responsible parties.

- **Nodes Involved:**  
  - Internal notifier  
  - Customer Support notifier  
  - Finance & Billing Assistant notifier  
  - Sales Notifier  
  - Promotions Analyst Notifier (disabled)  

- **Node Details:**

  - **Telegram nodes**  
    - Type: Telegram  
    - Role: Sends notification messages with email subject and a link to Gmail drafts or inbox.  
    - Config: Uses Telegram API credentials, chatId set for specific channel.  
    - Failure modes: Telegram API rate limits, invalid chatId.

---

#### 2.5 Document Management & Knowledge Base Update

- **Overview:**  
  This block manages document ingestion from a specific Google Drive folder to update the Pinecone vector store knowledge base used by AI agents for internal data reference.

- **Nodes Involved:**  
  - Google Drive Trigger  
  - Google Drive Trigger1  
  - Edit Fields  
  - Delete Duplicated  
  - Download file  
  - Embeddings OpenAI  
  - Default Data Loader  
  - Recursive Character Text Splitter  
  - Pinecone Vector Store  

- **Node Details:**

  - **Google Drive Triggers**  
    - Type: Google Drive Trigger  
    - Role: Trigger on file creation or update in a specific folder.  
    - Config: Polls every minute on folder with ID "1jeDVlGiTd3k-ufDzNDwGXMT5gPiC9MWT".  
    - Failure modes: Google Drive permissions, folder access.

  - **Edit Fields**  
    - Type: Set node  
    - Role: Extracts and assigns file metadata (id, type, name, url) for downstream processing.

  - **Delete Duplicated**  
    - Type: HTTP Request to Pinecone API  
    - Role: Removes any existing vector entries with the same file name to avoid duplicates before inserting new data.  
    - Key: Uses Pinecone API Key and version headers.

  - **Download file**  
    - Type: Google Drive  
    - Role: Downloads the file content for embedding.

  - **Embeddings OpenAI**  
    - Type: OpenAI embeddings node  
    - Role: Converts document text into vector embeddings for Pinecone.

  - **Default Data Loader**  
    - Type: Document loader  
    - Role: Prepares document data with metadata for vector insertion.

  - **Recursive Character Text Splitter**  
    - Type: Text splitter  
    - Role: Splits large text into chunks with overlap for efficient embedding.

  - **Pinecone Vector Store**  
    - Type: Vector store node  
    - Role: Inserts vectors into Pinecone under namespace "Email Automation".

---

#### 2.6 Logging & Error Handling

- **Overview:**  
  Logs workflow errors to a Google Sheet and sends Telegram alerts for errors.

- **Nodes Involved:**  
  - Error Trigger  
  - Workflow Error Message1  
  - log error Data1  

- **Node Details:**

  - **Error Trigger**  
    - Type: Error Trigger  
    - Role: Catches any workflow errors.

  - **Workflow Error Message1**  
    - Type: Telegram  
    - Role: Sends a detailed error message including workflow name, error message, execution and workflow links to a Telegram chat for immediate alert.

  - **log error Data1**  
    - Type: Google Sheets  
    - Role: Appends error details into a Google Sheet for historical tracking and auditing.

---

### 3. Summary Table

| Node Name                     | Node Type                              | Functional Role                            | Input Node(s)                | Output Node(s)                  | Sticky Note                                                                                     |
|-------------------------------|--------------------------------------|--------------------------------------------|-----------------------------|--------------------------------|------------------------------------------------------------------------------------------------|
| Gmail Trigger1                | Gmail Trigger                        | Triggers on new unread emails               |                             | Text Classifier                |                                                                                                |
| Text Classifier              | Langchain Text Classifier             | Classifies email into category               | Gmail Trigger1              | Add Label nodes                |                                                                                                |
| Add Label: Internal           | Gmail                               | Adds "Internal" label to email               | Text Classifier             | Internal Agent                |                                                                                                |
| Add Label: Customer Support   | Gmail                               | Adds "Customer Support" label                 | Text Classifier             | Customer Support Agent        |                                                                                                |
| Add Label: Promotions         | Gmail                               | Adds "Promotions" label                       | Text Classifier             | Promotions Analyst Agent      |                                                                                                |
| Add Label: Admin/Finance      | Gmail                               | Adds "Admin/Finance" label                    | Text Classifier             | Finance & Billing Assistant Agent |                                                                                                |
| Add Label: Sales Opportunities| Gmail                               | Adds "Sales Opportunities" label             | Text Classifier             | Sales Agent                  |                                                                                                |
| Internal Agent               | OpenAI GPT-4o Langchain Node          | Generates replies to internal emails         | Add Label: Internal         | Gmail1                       |                                                                                                |
| Customer Support Agent       | OpenAI GPT-4o Langchain Node          | Generates replies to customer support emails | Add Label: Customer Support | Gmail5                       |                                                                                                |
| Promotions Analyst Agent     | OpenAI GPT-4o Langchain Node          | Analyzes promotional emails and recommends  | Add Label: Promotions       | If                          |                                                                                                |
| Finance & Billing Assistant Agent | OpenAI GPT-4o Langchain Node      | Summarizes finance/billing emails             | Add Label: Admin/Finance    | Gmail3                       |                                                                                                |
| Sales Agent                 | OpenAI GPT-4o Langchain Node          | Drafts replies and notifications for sales   | Add Label: Sales Opportunities | Gmail4                       |                                                                                                |
| If                         | If                                  | Checks if promotion is recommended            | Promotions Analyst Agent    | mark as read                 |                                                                                                |
| Gmail1                      | Gmail                               | Replies to internal emails                     | Internal Agent              | Notification clasifier5       |                                                                                                |
| Gmail3                      | Gmail                               | Replies to finance/billing emails              | Finance & Billing Assistant Agent | Finance & Billing Assistant notifier |                                                                                                |
| Gmail4                      | Gmail                               | Drafts replies for sales emails                | Sales Agent                 | Sales Notifier               |                                                                                                |
| Gmail5                      | Gmail                               | Replies to customer support emails             | Customer Support Agent      | Customer Support notifier     |                                                                                                |
| mark as read                | Gmail                               | Marks email read after promotions analysis     | If                         | Promotions Analyst Notifier   |                                                                                                |
| Mark as read                | Gmail                               | Marks email read after customer support reply | Customer Support notifier   | Log information into sheet1   |                                                                                                |
| Mark as read1               | Gmail                               | Marks email read after internal reply          | Internal notifier           | Log information into sheet    |                                                                                                |
| Mark as read3               | Gmail                               | Marks email read after finance/billing reply   | Finance & Billing Assistant notifier | Log information into sheet3  |                                                                                                |
| Mark as read4               | Gmail                               | Marks email read after sales reply              | Sales Notifier              | Append row in sheet4          |                                                                                                |
| Log information into sheet   | Google Sheets                      | Logs internal email info                         | Mark as read1               |                              |                                                                                                |
| Log information into sheet1  | Google Sheets                      | Logs customer support email info                 | Mark as read                |                              |                                                                                                |
| Log information into sheet2  | Google Sheets                      | Logs promotion email info                        | Promotions Analyst Notifier |                              |                                                                                                |
| Log information into sheet3  | Google Sheets                      | Logs finance/billing email info                   | Mark as read3               |                              |                                                                                                |
| Append row in sheet4         | Google Sheets                      | Logs sales email info                            | Mark as read4               |                              |                                                                                                |
| Internal notifier            | Telegram                            | Notifies new internal emails                     | Notification clasifier5     | Mark as read1                |                                                                                                |
| Customer Support notifier    | Telegram                            | Notifies new customer support emails             | Gmail5                      | Mark as read                 |                                                                                                |
| Finance & Billing Assistant notifier | Telegram                   | Notifies new finance/billing emails               | Gmail3                      | Mark as read3                |                                                                                                |
| Sales Notifier              | Telegram                            | Notifies new sales opportunities                  | Gmail4                      | Mark as read4                |                                                                                                |
| Google Drive Trigger        | Google Drive Trigger                | Triggers on new file in specific folder          |                             | Edit Fields                  |                                                                                                |
| Google Drive Trigger1       | Google Drive Trigger                | Triggers on file updates in specific folder      |                             | Edit Fields                  |                                                                                                |
| Edit Fields                | Set                                 | Sets file metadata fields                          | Google Drive Trigger, Google Drive Trigger1 | Delete Duplicated            |                                                                                                |
| Delete Duplicated           | HTTP Request                       | Deletes existing pinecone vectors with same file | Edit Fields                 | Download file                |                                                                                                |
| Download file              | Google Drive                       | Downloads file content                             | Delete Duplicated            | Embeddings OpenAI            |                                                                                                |
| Embeddings OpenAI           | OpenAI Embeddings                  | Generates vector embeddings for Pinecone           | Download file               | Pinecone Vector Store        |                                                                                                |
| Default Data Loader         | Document Loader                   | Loads document data for embedding                   | Recursive Character Text Splitter | Pinecone Vector Store        |                                                                                                |
| Recursive Character Text Splitter | Text Splitter               | Splits large text into chunks                        |                            | Default Data Loader          |                                                                                                |
| Pinecone Vector Store       | Pinecone Vector Store             | Inserts vectors into Pinecone under namespace        | Embeddings OpenAI, Default Data Loader |                             |                                                                                                |
| Pinecone Vector Store1 to 5 | Pinecone Vector Store             | Provides AI agents with knowledge base retrieval    |                             | Internal Agent, Customer Support Agent, Promotions Analyst Agent, Finance & Billing Assistant Agent, Sales Agent |                                                                                                |
| Notification clasifier5     | Langchain Agent                   | Filters emails for notification necessity            | Gmail1                      | Internal notifier            |                                                                                                |
| Error Trigger              | Error Trigger                     | Captures workflow errors                             |                             | Workflow Error Message1      |                                                                                                |
| Workflow Error Message1    | Telegram                         | Sends error notification to Telegram                 | Error Trigger               | log error Data1              |                                                                                                |
| log error Data1            | Google Sheets                    | Logs error details into Google Sheets                 | Workflow Error Message1      |                             |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Set up Gmail OAuth2 Credential** in n8n with the appropriate scopes for reading emails, labeling, and sending emails.

2. **Create Gmail Trigger1 node:**  
   - Type: Gmail Trigger  
   - Poll every minute for unread emails.

3. **Add Text Classifier node (Langchain):**  
   - Input: Combine email sender, subject, and body text.  
   - Define categories: Internal, Customer Support, Promotions, Admin/Finance, Sales Opportunity with keyword hints.  
   - Connect Gmail Trigger1 output to this node.

4. **Create Gmail Label nodes for each category:**  
   - Add Label: Internal  
   - Add Label: Customer Support  
   - Add Label: Promotions  
   - Add Label: Admin/Finance  
   - Add Label: Sales Opportunities  
   - Configure each with respective Gmail label IDs.  
   - Connect Text Classifier outputs to these label nodes accordingly.

5. **Set up Pinecone vector store:**  
   - Create Pinecone API credentials in n8n.  
   - Create Pinecone Vector Store nodes for each AI agent (1 to 5), configured for retrieval mode with namespace "Email Automation".

6. **Create AI Agents using Langchain OpenAI nodes:**  
   For each category node:  
   - Internal Agent: Use GPT-4o, system prompt tailored to internal emails, connects to Pinecone Vector Store1.  
   - Customer Support Agent: GPT-4o, system prompt for customer support, Pinecone Vector Store2.  
   - Promotions Analyst Agent: GPT-4o, system prompt to summarize and recommend, Pinecone Vector Store3.  
   - Finance & Billing Assistant Agent: GPT-4o, system prompt for finance emails, Pinecone Vector Store4.  
   - Sales Agent: GPT-4o, system prompt for sales inquiries, Pinecone Vector Store5.  
   - Connect each label node output to its respective AI agent.

7. **Add Gmail nodes to send replies or save drafts:**  
   - Gmail1 for internal agent replies (reply mode).  
   - Gmail3 for finance/billing (draft mode).  
   - Gmail4 for sales (draft mode).  
   - Gmail5 for customer support (reply mode).  
   - Configure message contents from AI output JSON.  
   - Connect AI agents to respective Gmail nodes.

8. **Add Mark as Read Gmail nodes:**  
   - For each category, create a mark as read node connected after the reply/draft node.  
   - Input message ID from Text Classifier node.

9. **Add Telegram notifier nodes:**  
   - Internal notifier, Customer Support notifier, Finance & Billing Assistant notifier, Sales Notifier.  
   - Configure with Telegram API credential and chat ID.  
   - Connect from AI agent outputs or reply nodes to respective notifiers.

10. **Google Sheets logging:**  
    - Create Google Sheets OAuth2 credential.  
    - Create nodes to append rows with email metadata, AI replies, and status for each category.  
    - Connect after mark as read nodes.

11. **Document Management:**  
    - Create Google Drive Triggers for file creation and update on specific folder.  
    - Add Set node (Edit Fields) to extract file metadata.  
    - HTTP Request node (Delete Duplicated) to remove existing Pinecone entries by file name.  
    - Google Drive node to download files.  
    - Embeddings OpenAI node to generate embeddings for documents.  
    - Text splitter and document loader nodes to prepare documents.  
    - Pinecone Vector Store node to insert embeddings under "Email Automation" namespace.  
    - Connect these nodes in sequence.

12. **Error Handling:**  
    - Add an Error Trigger node.  
    - Connect to Telegram node (Workflow Error Message1) for alerts.  
    - Connect Telegram node to Google Sheets node (log error Data1) for error logging.

13. **Optional:**  
    - Create an "If" node after Promotions Analyst Agent to check if recommendation is "yes" before further action (e.g., mark as read).  
    - Add manual trigger and test nodes if needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| The AI agents rely on a Pinecone vector store for knowledge base lookups, ensuring responses are accurate and up to date. | Pinecone namespace: "Email Automation"                                                             |
| Email classification uses keyword-based categories with domain checks, enabling granular processing by AI agents. | Classification categories: Internal, Customer Support, Promotions, Admin/Finance, Sales Opportunities |
| Telegram notifications alert the team in a dedicated channel to ensure prompt awareness of high-priority emails. | Telegram chatId: 6158704034                                                                         |
| Google Sheets logging provides an audit trail of all processed emails and AI-generated responses for transparency and review. | Google Sheets document ID: 1tPJnXe35a__nescIseMG6oDgqF4A8enkzJGz7MnNUSI                            |
| Error handling includes immediate Telegram alerts and detailed logging to Google Sheets for troubleshooting.   | Workflow error notifications bot configured with Telegram API credential.                           |
| The workflow is designed to work with Gmail and Google Drive API scopes, requiring OAuth2 credentials with appropriate permissions. | Gmail OAuth2 scopes include read, send, label management; Google Drive OAuth2 includes file read access. |
| OpenAI GPT-4o models are primarily used, with system prompts customized per email category for focused responses. | Each AI agent has a tailored system message defining identity, mission, capabilities, and boundaries. |
| This workflow architecture supports scalability by modularizing email categories and AI agents for maintainability and ease of updates. |                                                                                                    |

---

**Disclaimer:** The provided text is exclusively derived from an n8n automated workflow. It fully complies with content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.