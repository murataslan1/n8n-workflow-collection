AI-powered email processing autoresponder and response approval (Yes/No)

https://n8nworkflows.xyz/workflows/ai-powered-email-processing-autoresponder-and-response-approval--yes-no--2861


# AI-powered email processing autoresponder and response approval (Yes/No)

### 1. Workflow Overview

This workflow automates the handling of incoming emails by summarizing their content, generating professional responses using AI, and routing these responses for human approval before sending. It is designed primarily for corporate email inboxes to streamline customer or client communication with minimal manual intervention while maintaining quality control.

**Logical Blocks:**

- **1.1 Email Reception and Preprocessing:**  
  Captures incoming emails via IMAP, converts HTML email content to Markdown/plain text for better AI processing.

- **1.2 Email Content Summarization:**  
  Uses AI summarization chains to generate concise summaries of the email content, preparing it for response generation.

- **1.3 Response Generation with Contextual Knowledge Retrieval:**  
  Employs an AI agent that integrates vector database retrieval (Qdrant) to incorporate relevant company knowledge into the reply, ensuring informed and accurate responses.

- **1.4 Draft Sending and Human Approval:**  
  Sends the AI-generated draft response to a designated Gmail address for double approval. Based on approval outcome, either sends the final email to the original sender or loops back for further review.

---

### 2. Block-by-Block Analysis

#### 2.1 Email Reception and Preprocessing

- **Overview:**  
  Listens for new emails in a specified inbox, converts HTML email content to Markdown to improve AI comprehension.

- **Nodes Involved:**  
  - Email Trigger (IMAP)  
  - Markdown

- **Node Details:**

  - **Email Trigger (IMAP):**  
    - Type: Email Read (IMAP) Trigger  
    - Role: Listens for new incoming emails on a configured IMAP account.  
    - Configuration: Uses IMAP credentials for `info@n3witalia.com`. No additional filters configured.  
    - Input: N/A (trigger node)  
    - Output: Email data including HTML content and metadata.  
    - Edge Cases: Connection/authentication failures with IMAP server; malformed emails; large attachments may cause delays.

  - **Markdown:**  
    - Type: Markdown Conversion  
    - Role: Converts the HTML content of the email (`textHtml` field) into Markdown/plain text for easier AI processing.  
    - Configuration: Input is `={{ $json.textHtml }}` from the previous node.  
    - Input: Email HTML content from Email Trigger (IMAP)  
    - Output: Plain text version of the email content.  
    - Edge Cases: Emails with complex HTML or embedded images may not convert cleanly; empty or missing HTML content.

---

#### 2.2 Email Content Summarization

- **Overview:**  
  Summarizes the email content into a concise text of max 100 words using an AI summarization chain.

- **Nodes Involved:**  
  - Email Summarization Chain  
  - DeepSeek R1 (AI Model)

- **Node Details:**

  - **Email Summarization Chain:**  
    - Type: LangChain Summarization Chain  
    - Role: Generates a concise summary of the email content using AI prompts.  
    - Configuration:  
      - Uses binary data input from Markdown node (`$json.data`).  
      - Prompt instructs to summarize in max 100 words without counting words explicitly.  
      - Operation mode: Node input binary.  
    - Input: Markdown text from Markdown node  
    - Output: Summarized text in JSON response field.  
    - Edge Cases: AI model timeouts, incomplete input data, or prompt misinterpretation.

  - **DeepSeek R1:**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides AI language model capabilities to the summarization chain.  
    - Configuration: Uses `deepseek/deepseek-r1:free` model via OpenRouter API credentials.  
    - Input: Summarization chain requests  
    - Output: Summarization results passed back to chain.  
    - Edge Cases: API rate limits, authentication errors, model unavailability.

---

#### 2.3 Response Generation with Contextual Knowledge Retrieval

- **Overview:**  
  Generates a professional, concise email reply in HTML format, enriched by retrieving relevant company knowledge from a vector database.

- **Nodes Involved:**  
  - Write email (LangChain Agent)  
  - Qdrant Vector Store  
  - Embeddings OpenAI  
  - OpenAI (GPT-4o-mini)  
  - Set Email

- **Node Details:**

  - **Write email:**  
    - Type: LangChain Agent  
    - Role: Creates the email reply text based on the summarized email content and retrieved knowledge.  
    - Configuration:  
      - Input text prompt includes the summarized email text.  
      - System message instructs to write a professional, concise (max 100 words) HTML-formatted business email body.  
      - Output parser enabled to structure output.  
    - Input: Summarized text from Email Summarization Chain and knowledge from Qdrant Vector Store.  
    - Output: HTML email body text.  
    - Edge Cases: AI generation errors, malformed HTML output, prompt misinterpretation.

  - **Qdrant Vector Store:**  
    - Type: LangChain Vector Store (Qdrant)  
    - Role: Retrieves relevant documents from a company knowledge base to inform the AI response.  
    - Configuration:  
      - Uses a collection named dynamically (`=COLLECTION`).  
      - No document metadata included in output.  
      - Authenticated with Qdrant API credentials.  
    - Input: Embeddings from Embeddings OpenAI node.  
    - Output: Retrieved documents as tools for AI agent.  
    - Edge Cases: API errors, empty or missing collections, network timeouts.

  - **Embeddings OpenAI:**  
    - Type: LangChain Embeddings Node  
    - Role: Converts text into vector embeddings for similarity search in Qdrant.  
    - Configuration: Uses OpenAI API credentials.  
    - Input: Text data from previous nodes.  
    - Output: Vector embeddings.  
    - Edge Cases: API limits, invalid input text.

  - **OpenAI (GPT-4o-mini):**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides AI language model capabilities for the agent.  
    - Configuration: Uses GPT-4o-mini model with OpenAI credentials.  
    - Input: Agent requests.  
    - Output: AI-generated text.  
    - Edge Cases: API errors, rate limits.

  - **Set Email:**  
    - Type: Set Node  
    - Role: Assigns the generated email text to a variable named `email` for downstream use.  
    - Configuration: Sets `email` to `={{ $json.response.text }}` from Write email node.  
    - Input: Output from Email Summarization Chain.  
    - Output: JSON with `email` field.  
    - Edge Cases: Missing or malformed input data.

---

#### 2.4 Draft Sending and Human Approval

- **Overview:**  
  Sends the AI-generated draft email to a designated Gmail address for double approval. Depending on approval, sends the final email to the original sender or loops for further review.

- **Nodes Involved:**  
  - Send Draft (Gmail)  
  - Approve? (If)  
  - Send Email  
  - Set Email

- **Node Details:**

  - **Send Draft:**  
    - Type: Gmail Node (Send and Wait for Response)  
    - Role: Sends the draft email to a specified Gmail address for approval with double-approval enabled.  
    - Configuration:  
      - Sends to `YOUR GMAIL ADDRESS` (to be replaced by user).  
      - Email body includes original email HTML and AI response.  
      - Subject prefixed with `[Approval Required]`.  
      - Uses Gmail OAuth2 credentials.  
      - Operation mode: `sendAndWait` to pause workflow until approval response.  
      - Approval type: double approval (two approvers required).  
    - Input: Generated email from Write email node and original email data.  
    - Output: Approval decision data.  
    - Edge Cases: Gmail API rate limits, OAuth token expiration, approval timeout.

  - **Approve?:**  
    - Type: If Node  
    - Role: Checks if the approval flag `data.approved` is true.  
    - Configuration: Boolean condition on `={{ $json.data.approved }}` equals `true`.  
    - Input: Approval response from Send Draft node.  
    - Output:  
      - True branch: Proceed to send final email.  
      - False branch: Loop back or hold for manual intervention.  
    - Edge Cases: Missing approval data, malformed response.

  - **Send Email:**  
    - Type: Email Send (SMTP)  
    - Role: Sends the approved email reply to the original sender.  
    - Configuration:  
      - Subject: `Re: {{ original email subject }}`  
      - To: Original sender email address  
      - From: Original recipient email address  
      - Email body: HTML from Write email node output  
      - Uses SMTP credentials for `info@n3witalia.com`.  
    - Input: Approved email content and original email metadata.  
    - Output: Confirmation of email sent.  
    - Edge Cases: SMTP server errors, invalid email addresses.

  - **Set Email (second usage):**  
    - Role: Used in the false branch of approval to set or reset email content for further processing or manual edits.  
    - Input/Output: Similar to previous Set Email node.

---

### 3. Summary Table

| Node Name              | Node Type                            | Functional Role                                  | Input Node(s)                  | Output Node(s)                | Sticky Note                                                                                          |
|------------------------|------------------------------------|-------------------------------------------------|-------------------------------|------------------------------|----------------------------------------------------------------------------------------------------|
| Email Trigger (IMAP)    | Email Read (IMAP) Trigger           | Listens for new incoming emails                  | N/A                           | Markdown                     | Main Flow: Preliminary step to create vector DB and tokenize documents. Workflow handles corporate email via IMAP. |
| Markdown               | Markdown Conversion                 | Converts HTML email content to Markdown/plain text | Email Trigger (IMAP)           | Email Summarization Chain     | Convert email to Markdown format for better understanding of LLM models                            |
| DeepSeek R1            | LangChain OpenAI Chat Model         | Provides AI model for summarization               | Email Summarization Chain      | Email Summarization Chain     | Chain that summarizes the received email                                                          |
| Email Summarization Chain | LangChain Summarization Chain      | Summarizes email content concisely                 | Markdown                      | Set Email                    | Chain that summarizes the received email                                                          |
| Set Email              | Set Node                           | Assigns summarized text to variable `email`       | Email Summarization Chain      | Write email                  |                                                                                                    |
| Write email            | LangChain Agent                    | Generates professional email reply in HTML        | Set Email, Qdrant Vector Store | Send Draft                   | Agent that retrieves business info from vector DB and processes response                           |
| Embeddings OpenAI      | LangChain Embeddings Node           | Creates vector embeddings for knowledge retrieval | Write email                   | Qdrant Vector Store          |                                                                                                    |
| Qdrant Vector Store    | LangChain Vector Store (Qdrant)     | Retrieves relevant company knowledge documents     | Embeddings OpenAI             | Write email                  |                                                                                                    |
| OpenAI                 | LangChain OpenAI Chat Model         | Provides AI model for agent                         | Write email                   | Write email                  |                                                                                                    |
| Send Draft             | Gmail Node (Send and Wait)           | Sends draft email for double approval              | Write email                   | Approve?                    | IMPORTANT: Send Draft node requires Gmail for "Send and wait for response" function                |
| Approve?               | If Node                           | Checks approval status (Yes/No)                     | Send Draft                   | Send Email, Set Email        |                                                                                                    |
| Send Email             | Email Send (SMTP)                  | Sends approved email to original sender            | Approve? (true branch)         | N/A                         |                                                                                                    |
| Set Email (2nd usage)  | Set Node                           | Handles email content for non-approved cases       | Approve? (false branch)        | N/A                         |                                                                                                    |
| Sticky Note            | Sticky Note                       | Documentation and instructions                      | N/A                           | N/A                         | Main Flow overview and instructions on vector DB and triggers                                     |
| Sticky Note1           | Sticky Note                       | Documentation                                        | N/A                           | N/A                         | Convert email to Markdown format for better understanding of LLM models                            |
| Sticky Note2           | Sticky Note                       | Documentation                                        | N/A                           | N/A                         | Chain that summarizes the received email                                                          |
| Sticky Note3           | Sticky Note                       | Documentation                                        | N/A                           | N/A                         | Agent that retrieves business information from a vector database and processes the response       |
| Sticky Note4           | Sticky Note                       | Documentation                                        | N/A                           | N/A                         | IMPORTANT: Send Draft node requires Gmail for "Send and wait for response" function                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Email Trigger (IMAP) Node:**  
   - Type: Email Read (IMAP) Trigger  
   - Credentials: Configure IMAP credentials for your corporate email (e.g., `info@n3witalia.com`).  
   - Parameters: Default options to listen for new emails.

2. **Add Markdown Node:**  
   - Type: Markdown  
   - Parameters: Set `html` field to `={{ $json.textHtml }}` from Email Trigger node output.  
   - Connect Email Trigger → Markdown.

3. **Add Email Summarization Chain Node:**  
   - Type: LangChain Summarization Chain  
   - Parameters:  
     - Input binary data key: `={{ $json.data }}` (output from Markdown node).  
     - Summarization prompt:  
       ```
       Write a concise summary of the following in max 100 words :

       "{{ $json.data }}"

       Do not enter the total number of words used.
       ```  
   - Connect Markdown → Email Summarization Chain.

4. **Add DeepSeek R1 Node:**  
   - Type: LangChain OpenAI Chat Model  
   - Credentials: Configure OpenRouter or OpenAI API credentials.  
   - Model: `deepseek/deepseek-r1:free`  
   - Connect DeepSeek R1 as AI model for Email Summarization Chain.

5. **Add Set Email Node:**  
   - Type: Set  
   - Parameters: Assign variable `email` with value `={{ $json.response.text }}` from Email Summarization Chain output.  
   - Connect Email Summarization Chain → Set Email.

6. **Add Embeddings OpenAI Node:**  
   - Type: LangChain Embeddings Node  
   - Credentials: Configure OpenAI API credentials.  
   - Connect Set Email → Embeddings OpenAI.

7. **Add Qdrant Vector Store Node:**  
   - Type: LangChain Vector Store (Qdrant)  
   - Credentials: Configure Qdrant API credentials.  
   - Parameters:  
     - Mode: Retrieve as tool  
     - Collection: Set dynamically or fixed collection name for company knowledge base.  
   - Connect Embeddings OpenAI → Qdrant Vector Store.

8. **Add Write email Node (LangChain Agent):**  
   - Type: LangChain Agent  
   - Parameters:  
     - Text prompt:  
       ```
       Write the text to reply to the following email:

       {{ $('Email Summarization Chain').item.json.response.text }}
       ```  
     - System message:  
       ```
       You are an expert at answering emails. You need to answer them professionally based on the information you have. This is a business email. Be concise and never exceed 100 words. Only the body of the email, not create the subject.

       It must be in HTML format and you can insert (if you think it is appropriate) only HTML characters such as <br>, <b>, <i>, <p> where necessary.
       ```  
   - Connect Qdrant Vector Store → Write email (as AI tool input).  
   - Connect Set Email → Write email (for prompt input).

9. **Add Send Draft Node (Gmail):**  
   - Type: Gmail Node (Send and Wait for Response)  
   - Credentials: Configure Gmail OAuth2 credentials.  
   - Parameters:  
     - Send To: Your Gmail address for approval.  
     - Subject: `=[Approval Required]  {{ $('Email Trigger (IMAP)').item.json.subject }}`  
     - Message:  
       ```
       <h3>MESSAGE</h3>
       {{ $('Email Trigger (IMAP)').item.json.textHtml }}

       <h3>AI RESPONSE</h3>
       {{ $json.output }}
       ```  
     - Operation: `sendAndWait`  
     - Approval Options: Double approval enabled.  
   - Connect Write email → Send Draft.

10. **Add Approve? Node (If):**  
    - Type: If  
    - Parameters:  
      - Condition: `={{ $json.data.approved }}` equals `true` (boolean).  
    - Connect Send Draft → Approve?.

11. **Add Send Email Node (SMTP):**  
    - Type: Email Send (SMTP)  
    - Credentials: Configure SMTP credentials for your corporate email.  
    - Parameters:  
      - To: `={{ $('Email Trigger (IMAP)').item.json.from }}`  
      - From: `={{ $('Email Trigger (IMAP)').item.json.to }}`  
      - Subject: `=Re: {{ $('Email Trigger (IMAP)').item.json.subject }}`  
      - HTML Body: `={{ $('Write email').item.json.output }}`  
    - Connect Approve? (true branch) → Send Email.

12. **Add Set Email Node (for false branch):**  
    - Type: Set  
    - Parameters: Assign `email` variable as needed for further processing or manual intervention.  
    - Connect Approve? (false branch) → Set Email.

13. **Connect Nodes According to Workflow:**  
    - Email Trigger (IMAP) → Markdown → Email Summarization Chain → Set Email → Write email → Send Draft → Approve? → Send Email / Set Email.

14. **Additional Setup:**  
    - Create and populate a Qdrant vector database with company knowledge documents for retrieval.  
    - Replace placeholder emails and credentials with actual accounts.  
    - Test each node individually to ensure connectivity and correct data flow.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                   |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Main Flow: Preliminary step to create a vector database on Qdrant and tokenize documents useful for generating responses. | Sticky Note in workflow overview section.                                                       |
| This workflow is designed to handle general inquiries via corporate email using IMAP and generate responses using Retrieval-Augmented Generation (RAG). | Sticky Note in workflow overview section.                                                       |
| Convert email to Markdown format for better understanding by large language models (LLMs).       | Sticky Note near Markdown node.                                                                  |
| Chain that summarizes the received email content.                                               | Sticky Note near Email Summarization Chain node.                                                |
| Agent that retrieves business information from a vector database and processes the response.    | Sticky Note near Write email node.                                                              |
| IMPORTANT: The "Send Draft" Gmail node requires sending drafts to a Gmail address because only Gmail supports the "Send and wait for response" function. | Sticky Note near Send Draft node.                                                                |
| For detailed n8n credential setup and API key management, refer to official n8n documentation: https://docs.n8n.io/ | External resource for credential configuration.                                                 |
| Qdrant vector database setup and management: https://qdrant.tech/documentation/                 | External resource for vector store configuration.                                               |
| OpenAI API usage and prompt design guidelines: https://platform.openai.com/docs/guides         | External resource for AI model configuration and prompt best practices.                          |

---

This document provides a complete, structured reference to understand, reproduce, and maintain the AI-powered email processing autoresponder workflow with approval. It covers all nodes, their roles, configurations, and integration points, enabling advanced users and AI agents to work effectively with this automation.