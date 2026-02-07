AI-Powered Email Automation for Business: Summarize & Respond with RAG

https://n8nworkflows.xyz/workflows/ai-powered-email-automation-for-business--summarize---respond-with-rag-2852


# AI-Powered Email Automation for Business: Summarize & Respond with RAG

### 1. Workflow Overview

This workflow automates the processing of incoming business emails by summarizing, classifying, and responding to them using AI models, while leveraging a vector database for enhanced accuracy in responses. It is designed primarily for companies that receive inquiries about their services or products and want to provide timely, professional, and contextually accurate replies.

The workflow is logically divided into three main blocks:

- **1.1 Email Reception and Preprocessing**: Monitors an email inbox, converts incoming email HTML content to Markdown/plain text for AI processing.
- **1.2 AI Processing and Classification**: Summarizes the email content, classifies it into categories, and retrieves relevant information from a vector database if applicable.
- **1.3 Response Generation and Sending**: Drafts a professional email reply, reviews and formats it, then sends the response back to the original sender.
- **1.4 Vector Database Management and Document Vectorization**: Manages Qdrant vector collections and processes documents from Google Drive to keep the vector database updated with company knowledge.

---

### 2. Block-by-Block Analysis

#### 2.1 Email Reception and Preprocessing

**Overview:**  
This block listens for new incoming emails via IMAP, extracts the email content, and converts it from HTML to Markdown/plain text to facilitate AI processing.

**Nodes Involved:**  
- Email Trigger (IMAP)  
- Markdown

**Node Details:**

- **Email Trigger (IMAP)**  
  - Type: Email Read (IMAP)  
  - Role: Monitors the configured email inbox for new incoming messages and triggers the workflow upon receipt.  
  - Configuration: Uses IMAP credentials linked to the email account `info@n3witalia.com`. No additional options set.  
  - Inputs: None (trigger node)  
  - Outputs: Email data including HTML and plain text content, sender, recipient, subject, and metadata.  
  - Potential Failures: Authentication errors if credentials are invalid or expired; connectivity issues with the mail server; malformed emails.  
  - Version: 2  

- **Markdown**  
  - Type: Markdown Conversion  
  - Role: Converts the incoming email's HTML content (`textHtml`) into Markdown/plain text to simplify AI model input.  
  - Configuration: Input is set to the HTML content of the email (`{{$json.textHtml}}`). No additional options enabled.  
  - Inputs: Email Trigger (IMAP) output  
  - Outputs: Plain text version of the email content.  
  - Potential Failures: Conversion errors if HTML is malformed or contains unsupported tags.  
  - Version: 1  

---

#### 2.2 AI Processing and Classification

**Overview:**  
This block summarizes the email content using an AI model, classifies the email into predefined categories, and retrieves relevant company information from a vector database to assist in response generation.

**Nodes Involved:**  
- DeepSeek R1  
- Email Summarization Chain  
- OpenAI 4-o-mini  
- Email Classifier  
- Embeddings OpenAI  
- Qdrant Vector Store

**Node Details:**

- **DeepSeek R1**  
  - Type: AI Language Model (OpenAI Chat via LangChain)  
  - Role: Provides the AI model used for summarizing the email content.  
  - Configuration: Uses the `deepseek/deepseek-r1:free` model via OpenRouter API credentials.  
  - Inputs: None directly; connected as AI model for summarization chain.  
  - Outputs: AI-generated summary text.  
  - Potential Failures: API authentication errors; rate limits; model unavailability.  
  - Version: 1.2  

- **Email Summarization Chain**  
  - Type: Summarization Chain (LangChain)  
  - Role: Generates a concise summary (max 100 words) of the email content in Italian.  
  - Configuration: Uses binary data input from Markdown node; prompt instructs to summarize without stating word count.  
  - Inputs: Markdown output (plain text email)  
  - Outputs: Summarized text stored in `response.text`.  
  - Potential Failures: Prompt formatting errors; model API issues; empty or malformed input.  
  - Version: 2  

- **OpenAI 4-o-mini**  
  - Type: AI Language Model (OpenAI Chat via LangChain)  
  - Role: Provides the AI model used for email classification assistance.  
  - Configuration: Uses `gpt-4o-mini` model with OpenAI API credentials.  
  - Inputs: None directly; used by Email Classifier node.  
  - Outputs: Classification results.  
  - Potential Failures: API errors; rate limits; model unavailability.  
  - Version: 1.2  

- **Email Classifier**  
  - Type: Text Classifier (LangChain)  
  - Role: Classifies the summarized email text into predefined categories, defaulting to "other" if no match.  
  - Configuration:  
    - Categories: "Company info request"  
    - System prompt instructs strict JSON output without explanation.  
    - Input text is the summarized email (`{{$json.response.text}}`).  
    - Auto-fixing enabled to correct minor errors.  
  - Inputs: Email Summarization Chain output  
  - Outputs: Classification result directing workflow path.  
  - Potential Failures: Misclassification; prompt parsing errors; unexpected input format.  
  - Version: 1  

- **Embeddings OpenAI**  
  - Type: Embeddings Generator (OpenAI via LangChain)  
  - Role: Generates vector embeddings of the email content to query the vector database.  
  - Configuration: Uses OpenAI API credentials; no special options.  
  - Inputs: Email content (likely summarized or raw text)  
  - Outputs: Embeddings vector for querying Qdrant.  
  - Potential Failures: API errors; input text too long or empty; rate limits.  
  - Version: 1.2  

- **Qdrant Vector Store**  
  - Type: Vector Store Query (Qdrant via LangChain)  
  - Role: Retrieves relevant company information from the Qdrant vector database based on email embeddings.  
  - Configuration:  
    - Mode: Retrieve-as-tool  
    - Tool name: "company_knowladge_base"  
    - Collection: Dynamic via environment variable `COLLECTION`  
    - Metadata inclusion disabled.  
  - Inputs: Embeddings OpenAI output  
  - Outputs: Retrieved documents or information to assist response generation.  
  - Potential Failures: API authentication errors; collection not found; network issues; empty query results.  
  - Version: 1  

---

#### 2.3 Response Generation and Sending

**Overview:**  
This block drafts a professional email response using AI, reviews and formats it into HTML, then sends the email back to the original sender.

**Nodes Involved:**  
- Write email  
- Review email  
- Send Email  
- Do nothing (fallback path)

**Node Details:**

- **Write email**  
  - Type: AI Agent (LangChain Agent)  
  - Role: Generates a professional, concise email reply (max 100 words) based on the classified email content and retrieved information.  
  - Configuration:  
    - Prompt: "Write the text to reply to the following email: {{ $json.response.text }}"  
    - System message: Expert email responder, professional, concise, business tone.  
  - Inputs: Email Classifier output (only if classified as "Company info request")  
  - Outputs: Draft email text.  
  - Potential Failures: AI model errors; prompt formatting issues; empty input.  
  - Version: 1.7  

- **Review email**  
  - Type: AI Chain LLM (LangChain)  
  - Role: Reviews and formats the drafted email into professional HTML, inserting appropriate tags (`<br>`, `<b>`, `<i>`, `<p>`) and ensuring word limit compliance.  
  - Configuration:  
    - Prompt instructs expert review and HTML formatting, max 100 words, in Italian.  
    - Output parser enabled to ensure structured output.  
  - Inputs: Write email output  
  - Outputs: Reviewed and formatted HTML email content.  
  - Potential Failures: Parsing errors; formatting issues; API errors.  
  - Version: 1.5  

- **Send Email**  
  - Type: Email Send (SMTP)  
  - Role: Sends the reviewed email response to the original sender.  
  - Configuration:  
    - Subject: Prefixed with "Re:" and original email subject.  
    - To: Original sender email address.  
    - From: Original recipient email address.  
    - Email body: HTML content from Review email node.  
    - SMTP credentials configured for `info@n3witalia.com`.  
  - Inputs: Review email output  
  - Outputs: Confirmation of email sent.  
  - Potential Failures: SMTP authentication errors; invalid email addresses; network issues.  
  - Version: 2.1  

- **Do nothing**  
  - Type: No Operation  
  - Role: Fallback path for emails classified as "other" (non-company info requests), effectively ending the workflow without response.  
  - Inputs: Email Classifier output (if not "Company info request")  
  - Outputs: None  
  - Version: 1  

---

#### 2.4 Vector Database Management and Document Vectorization

**Overview:**  
This block manages the Qdrant vector database collection and processes documents from Google Drive to update the vector store with company knowledge, enabling accurate AI responses.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Create collection  
- Refresh collection  
- Get folder  
- Download Files  
- Token Splitter  
- Default Data Loader  
- Embeddings OpenAI1  
- Qdrant Vector Store1  
- Sticky Notes (for instructions)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual triggering of the collection creation and refresh process for testing or setup.  
  - Inputs: None  
  - Outputs: Triggers Create collection and Refresh collection nodes.  
  - Version: 1  

- **Create collection**  
  - Type: HTTP Request  
  - Role: Creates a new collection in Qdrant vector database.  
  - Configuration:  
    - POST to `https://QDRANTURL/collections/COLLECTION` (placeholders to be replaced)  
    - Empty filter in JSON body.  
    - Uses HTTP header authentication with Qdrant API credentials.  
  - Inputs: Manual Trigger output  
  - Outputs: API response confirming collection creation.  
  - Potential Failures: Incorrect URL or collection name; authentication errors; network issues.  
  - Version: 4.2  

- **Refresh collection**  
  - Type: HTTP Request  
  - Role: Deletes all points in the existing Qdrant collection to refresh data.  
  - Configuration:  
    - POST to `https://QDRANTURL/collections/COLLECTION/points/delete`  
    - Empty filter in JSON body.  
    - Uses HTTP header authentication with Qdrant API credentials.  
  - Inputs: Manual Trigger output  
  - Outputs: API response confirming deletion.  
  - Potential Failures: Same as Create collection.  
  - Version: 4.2  

- **Get folder**  
  - Type: Google Drive Node  
  - Role: Retrieves files from a specified Google Drive folder for vectorization.  
  - Configuration:  
    - Drive ID: "My Drive"  
    - Folder ID: `"test-whatsapp"` (example, replace as needed)  
    - Uses Google Drive OAuth2 credentials.  
  - Inputs: Refresh collection output  
  - Outputs: List of files in the folder.  
  - Potential Failures: Permission errors; invalid folder ID; API quota limits.  
  - Version: 3  

- **Download Files**  
  - Type: Google Drive Node  
  - Role: Downloads each file from the folder, converting Google Docs to plain text.  
  - Configuration:  
    - File ID from Get folder output.  
    - Conversion enabled for Google Docs to `text/plain`.  
    - Uses Google Drive OAuth2 credentials.  
  - Inputs: Get folder output  
  - Outputs: Binary file data for each document.  
  - Potential Failures: Download errors; conversion failures; permission issues.  
  - Version: 3  

- **Token Splitter**  
  - Type: Text Splitter (Token-based)  
  - Role: Splits large document texts into chunks of 300 tokens with 30 tokens overlap for embedding.  
  - Configuration: Chunk size 300, overlap 30.  
  - Inputs: Download Files output (binary data)  
  - Outputs: Text chunks for embedding.  
  - Potential Failures: Incorrect chunking if input is empty or malformed.  
  - Version: 1  

- **Default Data Loader**  
  - Type: Document Data Loader  
  - Role: Loads and prepares document chunks for embedding insertion.  
  - Configuration: Data type set to binary.  
  - Inputs: Token Splitter output  
  - Outputs: Prepared document data for vector store insertion.  
  - Potential Failures: Data loading errors; empty input.  
  - Version: 1  

- **Embeddings OpenAI1**  
  - Type: Embeddings Generator (OpenAI)  
  - Role: Generates embeddings for document chunks.  
  - Configuration: Uses OpenAI API credentials.  
  - Inputs: Default Data Loader output  
  - Outputs: Embeddings vectors.  
  - Potential Failures: API errors; rate limits.  
  - Version: 1.1  

- **Qdrant Vector Store1**  
  - Type: Vector Store Insert (Qdrant)  
  - Role: Inserts document embeddings into the Qdrant collection.  
  - Configuration:  
    - Mode: Insert  
    - Collection: Dynamic via environment variable `COLLECTION`  
    - Uses Qdrant API credentials.  
  - Inputs: Embeddings OpenAI1 output  
  - Outputs: Confirmation of insertion.  
  - Potential Failures: API errors; collection not found; network issues.  
  - Version: 1  

- **Sticky Notes**  
  - Provide setup instructions and reminders for replacing placeholders such as `QDRANTURL` and `COLLECTION`.  
  - Positioned near collection creation and document vectorization nodes for clarity.

---

### 3. Summary Table

| Node Name               | Node Type                                   | Functional Role                                   | Input Node(s)                  | Output Node(s)                  | Sticky Note                                                                                      |
|-------------------------|---------------------------------------------|--------------------------------------------------|-------------------------------|--------------------------------|------------------------------------------------------------------------------------------------|
| Email Trigger (IMAP)     | Email Read (IMAP)                           | Triggers workflow on new email                    | None                          | Markdown                       |                                                                                                |
| Markdown                | Markdown Conversion                         | Converts email HTML to plain text                 | Email Trigger (IMAP)           | Email Summarization Chain       |                                                                                                |
| DeepSeek R1             | AI Language Model (OpenAI Chat)             | Provides AI model for summarization               | None                          | Email Summarization Chain       |                                                                                                |
| Email Summarization Chain| Summarization Chain (LangChain)             | Summarizes email content                           | Markdown                      | Email Classifier               |                                                                                                |
| OpenAI 4-o-mini         | AI Language Model (OpenAI Chat)             | Provides AI model for classification              | None                          | Email Classifier               |                                                                                                |
| Email Classifier        | Text Classifier (LangChain)                  | Classifies email into categories                   | Email Summarization Chain      | Write email, Do nothing         |                                                                                                |
| Write email             | AI Agent (LangChain Agent)                    | Drafts professional email response                 | Email Classifier               | Review email                  |                                                                                                |
| Review email            | AI Chain LLM (LangChain)                      | Reviews and formats email response into HTML      | Write email                   | Send Email                   |                                                                                                |
| Send Email              | Email Send (SMTP)                             | Sends the formatted email response                 | Review email                  | None                         |                                                                                                |
| Do nothing              | No Operation                                  | Ends workflow for non-relevant emails              | Email Classifier               | None                         |                                                                                                |
| Qdrant Vector Store     | Vector Store Query (Qdrant via LangChain)    | Retrieves relevant info from vector DB             | Embeddings OpenAI             | Write email                  |                                                                                                |
| Embeddings OpenAI       | Embeddings Generator (OpenAI)                 | Generates embeddings for email content             | Email Summarization Chain      | Qdrant Vector Store           |                                                                                                |
| When clicking ‘Test workflow’ | Manual Trigger                          | Manual trigger for collection setup                | None                          | Create collection, Refresh collection |                                                                                                |
| Create collection       | HTTP Request                                 | Creates Qdrant collection                           | Manual Trigger                | None                         | # STEP 1: Create Qdrant Collection. Change QDRANTURL and COLLECTION placeholders.               |
| Refresh collection      | HTTP Request                                 | Deletes all points in Qdrant collection            | Manual Trigger                | Get folder                   | # STEP 1: Create Qdrant Collection. Change QDRANTURL and COLLECTION placeholders.               |
| Get folder              | Google Drive                                 | Retrieves files from Google Drive folder           | Refresh collection            | Download Files               | # STEP 2: Documents vectorization with Qdrant and Google Drive. Change QDRANTURL and COLLECTION.|
| Download Files          | Google Drive                                 | Downloads and converts files to plain text         | Get folder                   | Token Splitter               | # STEP 2: Documents vectorization with Qdrant and Google Drive. Change QDRANTURL and COLLECTION.|
| Token Splitter          | Text Splitter (Token-based)                   | Splits documents into chunks for embedding         | Download Files               | Default Data Loader          | # STEP 2: Documents vectorization with Qdrant and Google Drive. Change QDRANTURL and COLLECTION.|
| Default Data Loader     | Document Data Loader                          | Prepares document chunks for embedding insertion   | Token Splitter               | Embeddings OpenAI1           | # STEP 2: Documents vectorization with Qdrant and Google Drive. Change QDRANTURL and COLLECTION.|
| Embeddings OpenAI1      | Embeddings Generator (OpenAI)                 | Generates embeddings for documents                  | Default Data Loader          | Qdrant Vector Store1         | # STEP 2: Documents vectorization with Qdrant and Google Drive. Change QDRANTURL and COLLECTION.|
| Qdrant Vector Store1    | Vector Store Insert (Qdrant)                   | Inserts document embeddings into Qdrant collection | Embeddings OpenAI1           | None                         | # STEP 2: Documents vectorization with Qdrant and Google Drive. Change QDRANTURL and COLLECTION.|
| Do nothing              | No Operation                                  | Ends workflow for non-relevant emails              | Email Classifier               | None                         |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Email Trigger (IMAP) Node**  
   - Type: Email Read (IMAP)  
   - Configure with IMAP credentials for the target inbox (e.g., `info@n3witalia.com`).  
   - No special options needed.  

2. **Add Markdown Node**  
   - Type: Markdown Conversion  
   - Set input HTML to `{{$json.textHtml}}` from Email Trigger output.  

3. **Add DeepSeek R1 Node**  
   - Type: AI Language Model (OpenAI Chat via LangChain)  
   - Select model `deepseek/deepseek-r1:free`.  
   - Configure OpenRouter API credentials.  

4. **Add Email Summarization Chain Node**  
   - Type: Summarization Chain (LangChain)  
   - Input: Markdown node output (binary data key set to `{{$json.data}}`).  
   - Prompt: "Write a concise summary of the following in max 100 words: \"{{$json.data}}\" Do not enter the total number of words used."  
   - Use DeepSeek R1 node as AI model.  

5. **Add OpenAI 4-o-mini Node**  
   - Type: AI Language Model (OpenAI Chat via LangChain)  
   - Select model `gpt-4o-mini`.  
   - Configure OpenAI API credentials.  

6. **Add Email Classifier Node**  
   - Type: Text Classifier (LangChain)  
   - Input text: "You must classify the following email:: {{ $json.response.text }}" (from Email Summarization Chain output).  
   - Categories: Add "Company info request" with description.  
   - Fallback category: "other".  
   - Enable auto-fixing.  
   - Use OpenAI 4-o-mini node as AI model.  

7. **Add Embeddings OpenAI Node**  
   - Type: Embeddings Generator (OpenAI)  
   - Configure OpenAI API credentials.  

8. **Add Qdrant Vector Store Node**  
   - Type: Vector Store Query (Qdrant via LangChain)  
   - Mode: Retrieve-as-tool  
   - Tool name: "company_knowladge_base"  
   - Collection: Use environment variable or fixed string `COLLECTION`.  
   - Configure Qdrant API credentials.  

9. **Connect Embeddings OpenAI output to Qdrant Vector Store input.**  

10. **Add Write email Node**  
    - Type: AI Agent (LangChain Agent)  
    - Prompt: "Write the text to reply to the following email:\n\n{{ $json.response.text }}"  
    - System message: "You are an expert at answering emails. You need to answer them professionally based on the information you have. This is a business email. Be concise and never exceed 100 words."  
    - Use OpenAI or appropriate AI model.  

11. **Add Review email Node**  
    - Type: AI Chain LLM (LangChain)  
    - Prompt: "Review at the following email:\n\n{{ $json.output }}"  
    - System message: "If you are an expert in reviewing emails before sending them. You need to review and structure them in such a way that you can send them. It must be in HTML format and you can insert (if you think it is appropriate) only HTML characters such as <br>, <b>, <i>, <p> where necessary. Non superare le 100 parole."  
    - Enable output parser.  
    - Use DeepSeek or similar AI model.  

12. **Add Send Email Node**  
    - Type: Email Send (SMTP)  
    - Configure SMTP credentials for sending email (e.g., `info@n3witalia.com`).  
    - Set subject: `Re: {{$json.subject}}` from original email.  
    - Set To: original sender email.  
    - Set From: original recipient email.  
    - Set HTML body to Review email output.  

13. **Add Do nothing Node**  
    - Type: No Operation  
    - Connect as fallback for emails classified as "other".  

14. **Set up connections:**  
    - Email Trigger → Markdown → Email Summarization Chain → Email Classifier  
    - Email Classifier → Write email (if "Company info request") → Review email → Send Email  
    - Email Classifier → Do nothing (if other)  
    - Email Summarization Chain → Embeddings OpenAI → Qdrant Vector Store → Write email  

15. **Vector Database Management Setup:**  
    - Add Manual Trigger node ("When clicking ‘Test workflow’").  
    - Add HTTP Request node "Create collection": POST to `https://QDRANTURL/collections/COLLECTION` with empty filter JSON body; use HTTP header auth with Qdrant API credentials.  
    - Add HTTP Request node "Refresh collection": POST to `https://QDRANTURL/collections/COLLECTION/points/delete` with empty filter JSON body; same auth.  
    - Connect Manual Trigger → Create collection and Refresh collection.  
    - Add Google Drive node "Get folder": configure with Google Drive OAuth2 credentials, specify Drive and Folder ID.  
    - Connect Refresh collection → Get folder.  
    - Add Google Drive node "Download Files": download and convert files to plain text.  
    - Connect Get folder → Download Files.  
    - Add Token Splitter node: chunk size 300, overlap 30.  
    - Connect Download Files → Token Splitter.  
    - Add Default Data Loader node: data type binary.  
    - Connect Token Splitter → Default Data Loader.  
    - Add Embeddings OpenAI1 node: configure OpenAI credentials.  
    - Connect Default Data Loader → Embeddings OpenAI1.  
    - Add Qdrant Vector Store1 node: mode insert, collection `COLLECTION`, Qdrant API credentials.  
    - Connect Embeddings OpenAI1 → Qdrant Vector Store1.  

16. **Add Sticky Notes** near collection creation and document vectorization nodes with instructions to replace placeholders `QDRANTURL` and `COLLECTION`.  

17. **Test the workflow:**  
    - Use manual trigger to create and refresh collection, then load documents.  
    - Send test emails to verify summarization, classification, response generation, and sending.  

18. **Activate the workflow** once testing is successful.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The workflow uses multiple AI models: DeepSeek R1 for summarization, OpenAI GPT-4o-mini for classification and response drafting, and DeepSeek for email review and formatting. | AI Model selection and usage details.                                                          |
| Replace placeholders `QDRANTURL` and `COLLECTION` with your actual Qdrant API URL and collection name in HTTP Request nodes. | Critical for vector database integration setup.                                                |
| Google Drive folder ID and Drive ID must be configured correctly to access documents for vectorization. | Document vectorization setup.                                                                  |
| SMTP credentials must be valid and authorized to send emails from the specified sender address. | Email sending configuration.                                                                   |
| The workflow includes fallback logic to ignore emails not classified as "Company info request". | Ensures only relevant emails are processed.                                                   |
| For detailed LangChain node usage, refer to n8n documentation: https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-langchain/ | Official n8n LangChain integration documentation.                                              |
| Video overview and setup instructions may be available from the workflow author or platform.  | Check project repository or support channels for additional resources.                         |

---

This document provides a detailed, structured reference for understanding, reproducing, and maintaining the "AI-Powered Email Automation for Business: Summarize & Respond with RAG" workflow in n8n. It covers all nodes, configurations, and logical flows, enabling advanced users and AI agents to work effectively with the workflow.