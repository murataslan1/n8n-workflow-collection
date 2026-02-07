A Very Simple "Human in the Loop" Email Response System Using AI and IMAP

https://n8nworkflows.xyz/workflows/a-very-simple--human-in-the-loop--email-response-system-using-ai-and-imap-2907


# A Very Simple "Human in the Loop" Email Response System Using AI and IMAP

### 1. Workflow Overview

This workflow automates the processing of incoming emails by summarizing their content, generating AI-based responses, and incorporating a human approval step before sending replies. It is designed for businesses that want to efficiently manage high volumes of emails while maintaining quality control through a "Human-in-the-Loop" system.

The workflow is logically divided into the following blocks:

- **1.1 Email Reception and Preprocessing**: Monitors an IMAP inbox for new emails and converts the email content from HTML to Markdown for easier AI processing.
- **1.2 Email Summarization**: Uses an AI summarization chain to generate a concise, professional summary of the incoming email.
- **1.3 AI Response Generation**: Employs an AI agent to draft a professional reply based on the summarized content.
- **1.4 Human-in-the-Loop Approval**: Sends the AI-generated draft to a human reviewer for approval and waits for confirmation.
- **1.5 Sending the Approved Response**: If approved, sends the finalized email response back to the original sender.

---

### 2. Block-by-Block Analysis

#### 2.1 Email Reception and Preprocessing

- **Overview:**  
  This block listens for new incoming emails via IMAP and converts the email body from HTML to Markdown format to facilitate better understanding by AI models.

- **Nodes Involved:**  
  - Email Trigger (IMAP)  
  - Markdown

- **Node Details:**

  - **Email Trigger (IMAP)**  
    - *Type & Role:* Email trigger node that monitors an IMAP inbox for new emails.  
    - *Configuration:* Uses stored IMAP credentials for the email account `info@n3witalia.com`. No additional options configured.  
    - *Expressions:* None.  
    - *Connections:* Output connected to the Markdown node.  
    - *Edge Cases:* Possible failures include IMAP authentication errors, connection timeouts, or no new emails triggering the workflow.  
    - *Version:* 2.

  - **Markdown**  
    - *Type & Role:* Converts HTML email content to Markdown text.  
    - *Configuration:* Takes the `textHtml` field from the incoming email JSON and converts it to Markdown.  
    - *Expressions:* `={{ $json.textHtml }}` to access the HTML content.  
    - *Connections:* Output connected to the Email Summarization Chain node.  
    - *Edge Cases:* If the email lacks HTML content or contains malformed HTML, conversion may fail or produce suboptimal Markdown.  
    - *Version:* 1.

#### 2.2 Email Summarization

- **Overview:**  
  This block summarizes the email content into a concise, professional summary limited to 100 words, preparing it for response generation.

- **Nodes Involved:**  
  - Email Summarization Chain  
  - OpenAI Chat Model (used internally by the summarization chain)  
  - Sticky Note2 (comment)

- **Node Details:**

  - **Email Summarization Chain**  
    - *Type & Role:* Langchain summarization chain node that uses AI to summarize text.  
    - *Configuration:*  
      - Input is binary data from the Markdown node (`binaryDataKey` set dynamically).  
      - Summarization prompt instructs the AI to write a concise summary in max 100 words without stating the word count.  
      - Operation mode set to process node input binary data.  
    - *Expressions:* Prompts use `={{ $json.data }}` to access the Markdown text.  
    - *Connections:* Output connected to the Write email node.  
    - *Edge Cases:* AI model may produce summaries that are too brief or miss key points; binary data input must be correctly formatted.  
    - *Version:* 2.

  - **OpenAI Chat Model**  
    - *Type & Role:* Chat model used internally by the summarization chain for generating summaries.  
    - *Configuration:* Uses the "deepseek-chat" model with credentials for DeepSeek API.  
    - *Connections:* Connected as AI language model input for the Email Summarization Chain.  
    - *Edge Cases:* API rate limits, authentication failures, or model unavailability.  
    - *Version:* 1.2.

  - **Sticky Note2**  
    - *Content:* "Chain that summarizes the received email"  
    - *Purpose:* Documentation aid for this block.

#### 2.3 AI Response Generation

- **Overview:**  
  Generates a professional, concise email reply based on the summarized content from the previous block.

- **Nodes Involved:**  
  - Write email  
  - OpenAI  
  - Sticky Note5 (comment)

- **Node Details:**

  - **Write email**  
    - *Type & Role:* Langchain agent node that drafts email replies.  
    - *Configuration:*  
      - Prompt instructs the AI to write a professional business email reply based on the summarized text, limited to 100 words.  
      - System message sets the AI’s role as an expert email responder.  
      - Output parser enabled to extract the response text cleanly.  
    - *Expressions:* Uses `={{ $json.response.text }}` to access the summary from the previous node.  
    - *Connections:* Output connected to the Set Email text node.  
    - *Edge Cases:* AI may generate incomplete or off-topic responses; prompt tuning may be required.  
    - *Version:* 1.7.

  - **OpenAI**  
    - *Type & Role:* Language model node providing the AI backend for the Write email node.  
    - *Configuration:* Uses the "gpt-4o-mini" model with OpenAI API credentials.  
    - *Connections:* Connected as AI language model input for Write email.  
    - *Edge Cases:* API limits, authentication errors, or model downtime.  
    - *Version:* 1.2.

  - **Sticky Note5**  
    - *Content:* "Agent that retrieves business information from a vector database and processes the response"  
    - *Note:* The description suggests additional functionality, but in this workflow, the node is used for drafting email replies.

#### 2.4 Human-in-the-Loop Approval

- **Overview:**  
  Prepares the AI-generated email text and sends it to a human reviewer for approval before sending. The workflow waits for approval and branches accordingly.

- **Nodes Involved:**  
  - Set Email text  
  - Approve Email  
  - Approved?  
  - Sticky Note (Human in the loop)  
  - Sticky Note7 (comment)

- **Node Details:**

  - **Set Email text**  
    - *Type & Role:* Set node to assign the AI-generated email text to a variable for further use.  
    - *Configuration:* Assigns the AI response output (`$json.output`) to a new field named `email`.  
    - *Connections:* Output connected to Approve Email node.  
    - *Edge Cases:* If the AI response is empty or malformed, the email text may be invalid.  
    - *Version:* 3.4.

  - **Approve Email**  
    - *Type & Role:* Email send node configured to send the AI-generated draft to a human approver for review.  
    - *Configuration:*  
      - Sends an email to `info@n3witalia.com` from the same address.  
      - Subject prefixed with "[Approval Required]" and includes original email subject.  
      - Email body includes the original message (HTML) and the AI-generated response.  
      - Operation set to "sendAndWait" to pause workflow until a reply is received.  
    - *Connections:* Output connected to Approved? node.  
    - *Edge Cases:* Email delivery failures, no response from approver, or timeout.  
    - *Version:* 2.1.

  - **Approved?**  
    - *Type & Role:* If node that checks if the human approver has approved the AI-generated response.  
    - *Configuration:* Checks if the boolean field `data.approved` is true in the incoming JSON.  
    - *Connections:*  
      - If true, proceeds to Send Email node.  
      - If false, workflow ends (no output connection).  
    - *Edge Cases:* Incorrect or missing approval data may cause false negatives.  
    - *Version:* 2.2.

  - **Sticky Note**  
    - *Content:* "Human in the loop"  
    - *Purpose:* Highlights the approval process block.

  - **Sticky Note7**  
    - *Content:* "If the feedback is OK send email"  
    - *Purpose:* Clarifies the conditional sending step after approval.

#### 2.5 Sending the Approved Response

- **Overview:**  
  Sends the approved AI-generated email response back to the original sender.

- **Nodes Involved:**  
  - Send Email

- **Node Details:**

  - **Send Email**  
    - *Type & Role:* Email send node that sends the final approved response.  
    - *Configuration:*  
      - Sends email to the original sender (`from` field of the incoming email).  
      - From address is the original recipient (the monitored inbox).  
      - Subject prepended with "Re:" and original subject included.  
      - Email body uses the approved email text set earlier.  
    - *Expressions:*  
      - To: `={{ $('Email Trigger (IMAP)').item.json.from }}`  
      - From: `={{ $('Email Trigger (IMAP)').item.json.to }}`  
      - Subject: `=Re: {{ $('Email Trigger (IMAP)').item.json.subject }}`  
      - HTML body: `={{ $('Set Email text').item.json.email }}`  
    - *Edge Cases:* SMTP authentication failures, invalid email addresses, or sending errors.  
    - *Version:* 2.1.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                          | Input Node(s)               | Output Node(s)            | Sticky Note                                                                                  |
|-------------------------|----------------------------------|----------------------------------------|----------------------------|---------------------------|----------------------------------------------------------------------------------------------|
| Email Trigger (IMAP)     | n8n-nodes-base.emailReadImap      | Triggers workflow on new incoming email| None                       | Markdown                  |                                                                                              |
| Markdown                | n8n-nodes-base.markdown           | Converts email HTML to Markdown         | Email Trigger (IMAP)        | Email Summarization Chain  | Convert email to Markdown format for better understanding of LLM models                      |
| Email Summarization Chain| @n8n/n8n-nodes-langchain.chainSummarization | Summarizes email content using AI       | Markdown                   | Write email               | Chain that summarizes the received email                                                    |
| OpenAI Chat Model        | @n8n/n8n-nodes-langchain.lmChatOpenAi | Provides AI model for summarization     | None (used internally)      | Email Summarization Chain  |                                                                                              |
| Write email              | @n8n/n8n-nodes-langchain.agent    | Generates AI draft email response       | Email Summarization Chain   | Set Email text            | Agent that retrieves business information from a vector database and processes the response |
| OpenAI                   | @n8n/n8n-nodes-langchain.lmChatOpenAi | Provides AI model for response generation| None (used internally)      | Write email               |                                                                                              |
| Set Email text           | n8n-nodes-base.set                | Prepares AI response text for approval | Write email                 | Approve Email             |                                                                                              |
| Approve Email            | n8n-nodes-base.emailSend          | Sends AI draft to human for approval    | Set Email text              | Approved?                 |                                                                                              |
| Approved?                | n8n-nodes-base.if                 | Checks if human approved the response   | Approve Email               | Send Email (if approved)  |                                                                                              |
| Send Email               | n8n-nodes-base.emailSend          | Sends approved email response to sender | Approved?                   | None                      | If the feedback is OK send email                                                             |
| Sticky Note1             | n8n-nodes-base.stickyNote         | Documentation note                      | None                       | None                      | Convert email to Markdown format for better understanding of LLM models                      |
| Sticky Note2             | n8n-nodes-base.stickyNote         | Documentation note                      | None                       | None                      | Chain that summarizes the received email                                                    |
| Sticky Note5             | n8n-nodes-base.stickyNote         | Documentation note                      | None                       | None                      | Agent that retrieves business information from a vector database and processes the response |
| Sticky Note7             | n8n-nodes-base.stickyNote         | Documentation note                      | None                       | None                      | If the feedback is OK send email                                                             |
| Sticky Note              | n8n-nodes-base.stickyNote         | Documentation note                      | None                       | None                      | Human in the loop                                                                            |
| Sticky Note11            | n8n-nodes-base.stickyNote         | Documentation note                      | None                       | None                      | # How it works: This workflow automates handling of incoming emails with AI and human review.|

---

### 4. Reproducing the Workflow from Scratch

1. **Create Email Trigger (IMAP) Node**  
   - Type: Email Trigger (IMAP)  
   - Configure IMAP credentials for the monitored email inbox (e.g., Gmail or Outlook).  
   - Leave options default.  
   - Position: Leftmost in the workflow.

2. **Create Markdown Node**  
   - Type: Markdown  
   - Set parameter `html` to `={{ $json.textHtml }}` to convert incoming email HTML content to Markdown.  
   - Connect Email Trigger (IMAP) output to Markdown input.

3. **Create Email Summarization Chain Node**  
   - Type: Langchain Summarization Chain  
   - Set operation mode to process node input binary data.  
   - Configure summarization prompt:  
     ```
     Write a concise summary of the following in max 100 words:

     "{{ $json.data }}"

     Do not enter the total number of words used.
     ```  
   - Connect Markdown output to Email Summarization Chain input.

4. **Create OpenAI Chat Model Node (for summarization)**  
   - Type: Langchain OpenAI Chat Model  
   - Select model: "deepseek-chat" or equivalent.  
   - Configure OpenAI API credentials.  
   - Connect to Email Summarization Chain as AI language model input.

5. **Create Write email Node**  
   - Type: Langchain Agent  
   - Set prompt text:  
     ```
     Write the text to reply to the following email:

     {{ $json.response.text }}
     ```  
   - Configure system message:  
     ```
     You are an expert at answering emails. You need to answer them professionally based on the information you have. This is a business email. Be concise and never exceed 100 words. Only the body of the email, not create the subject
     ```  
   - Enable output parser.  
   - Connect Email Summarization Chain output to Write email input.

6. **Create OpenAI Node (for response generation)**  
   - Type: Langchain OpenAI  
   - Select model: "gpt-4o-mini" or equivalent.  
   - Configure OpenAI API credentials.  
   - Connect to Write email as AI language model input.

7. **Create Set Email text Node**  
   - Type: Set  
   - Assign new field `email` with value `={{ $json.output }}` (the AI-generated email text).  
   - Connect Write email output to Set Email text input.

8. **Create Approve Email Node**  
   - Type: Email Send  
   - Configure SMTP credentials for sending email from `info@n3witalia.com`.  
   - Set recipient and sender both to `info@n3witalia.com` (human approver).  
   - Subject: `=[Approval Required]  {{ $('Email Trigger (IMAP)').item.json.subject }}`  
   - Message body (HTML):  
     ```
     <h3>MESSAGE</h3>
     {{ $('Email Trigger (IMAP)').item.json.textHtml }}

     <h3>AI RESPONSE</h3>
     {{ $json.email }}
     ```  
   - Set operation to "sendAndWait" to pause workflow until approval response is received.  
   - Connect Set Email text output to Approve Email input.

9. **Create Approved? Node**  
   - Type: If  
   - Condition: Check if `={{ $json.data.approved }}` is boolean true.  
   - Connect Approve Email output to Approved? input.

10. **Create Send Email Node**  
    - Type: Email Send  
    - Configure SMTP credentials same as Approve Email node.  
    - To: `={{ $('Email Trigger (IMAP)').item.json.from }}` (original sender)  
    - From: `={{ $('Email Trigger (IMAP)').item.json.to }}` (monitored inbox)  
    - Subject: `=Re: {{ $('Email Trigger (IMAP)').item.json.subject }}`  
    - HTML body: `={{ $('Set Email text').item.json.email }}`  
    - Connect Approved? node’s true output to Send Email input.

11. **Connect Approved? node’s false output to no further nodes** (workflow ends if not approved).

12. **Add Sticky Notes** (optional for documentation):  
    - Near Markdown: "Convert email to Markdown format for better understanding of LLM models"  
    - Near Email Summarization Chain: "Chain that summarizes the received email"  
    - Near Write email: "Agent that retrieves business information from a vector database and processes the response"  
    - Near Approve Email and Approved?: "Human in the loop"  
    - Near Send Email: "If the feedback is OK send email"  
    - At top or side: "# How it works: This workflow automates handling of incoming emails, summarizes their content, generates appropriate responses and validates them through a 'Human in the loop' system. You can quickly integrate Gmail and Outlook via the appropriate nodes."

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow balances automation with human oversight to ensure professional and accurate email responses.  | Workflow purpose                                                                                 |
| Integration supports IMAP email services such as Gmail and Outlook.                                           | Email Trigger (IMAP) node                                                                        |
| AI models used include OpenAI's GPT variants and DeepSeek chat model for summarization and response generation.| AI nodes configuration                                                                           |
| Human approval is implemented by sending the AI draft to a dedicated internal email address with "sendAndWait".| Approve Email node                                                                               |
| The workflow is inactive by default (`active: false`), so enable it after setup.                              | Workflow metadata                                                                                |
| For more information on n8n email nodes and Langchain integration, visit: https://docs.n8n.io/nodes/n8n-nodes-base.emailReadImap/ and https://docs.n8n.io/integrations/ai/langchain/ | Official n8n documentation links                                                                |

---

This structured documentation provides a complete understanding of the workflow’s architecture, node configurations, and operational logic, enabling users and AI agents to reproduce, modify, and troubleshoot the system effectively.