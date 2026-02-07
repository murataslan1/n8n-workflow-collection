AI-Powered Lead Email Classification & Auto-Reply with GPT-4o and Gmail

https://n8nworkflows.xyz/workflows/ai-powered-lead-email-classification---auto-reply-with-gpt-4o-and-gmail-7330


# AI-Powered Lead Email Classification & Auto-Reply with GPT-4o and Gmail

### 1. Workflow Overview

This workflow automates the classification of incoming emails as potential sales leads and sends AI-generated personalized replies to those identified leads using GPT-4o and Gmail integration. It is designed for sales or business development teams who want to automate initial email triage and engagement, ensuring timely responses to promising inquiries while filtering out irrelevant emails.

Logical blocks included:

- **1.1 Input Reception:** Monitoring an email inbox for new incoming messages via IMAP.
- **1.2 Lead Classification (AI Processing):** Using GPT-4o to analyze email content and classify whether the message is a lead.
- **1.3 Filtering:** Allow only emails classified as leads to proceed.
- **1.4 AI-Generated Reply Creation:** Generate a customized reply message tailored to the lead’s inquiry.
- **1.5 Email Retrieval & Reply Dispatch:** Retrieve complete email details from Gmail and send the AI-generated reply linked to the original conversation thread.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block captures new emails from the inbox in real-time using the IMAP protocol, serving as the workflow’s entry point.

- **Nodes Involved:**  
  - Email Trigger (IMAP)

- **Node Details:**

  - **Email Trigger (IMAP)**  
    - *Type:* Email Read IMAP Trigger  
    - *Role:* Watches the email inbox folder (configurable, e.g., INBOX or Leads) for new incoming messages.  
    - *Configuration:* Uses IMAP credentials to connect; no post-processing action configured (set to "nothing").  
    - *Expressions/Variables:* None.  
    - *Input:* None (trigger node).  
    - *Output:* Emits new email data including sender, subject, message content, and metadata.  
    - *Version:* 2  
    - *Potential Failures:* IMAP authentication failure, connection timeouts, folder misconfiguration, unsupported email formats.  
    - *Notes:* Must configure to monitor the relevant folder with proper credentials.  
    - *Sticky Note Content:*  
      > Checks your email inbox for new incoming messages in real time using the IMAP protocol. This node is the entry point of the workflow, capturing any new email so it can be processed. You can configure it to watch a specific folder (e.g., INBOX, Leads).  
      > [Guide](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.emailimap/)

#### 1.2 Lead Classification (AI Processing)

- **Overview:**  
  This block uses OpenAI’s GPT-4o model to analyze incoming email content and classify whether the email is from a potential lead interested in the user’s service or offer.

- **Nodes Involved:**  
  - Filter leads (OpenAI node)  
  - Filter (standard filter node)

- **Node Details:**

  - **Filter leads**  
    - *Type:* OpenAI (LangChain) Node  
    - *Role:* Sends the email text to GPT-4o with a prompt that requests a JSON response indicating if the email is a lead (`{"lead": "true"}` or `false`).  
    - *Configuration:*  
      - Model: GPT-4o  
      - Prompt includes a placeholder `[service/offer]` for user customization.  
      - Output is parsed as JSON.  
    - *Expressions:*  
      - Input text: `{{ $json.textPlain }}` (plain text body of the email)  
    - *Input:* Email data from IMAP trigger.  
    - *Output:* JSON object with a Boolean lead flag under `message.content.lead`.  
    - *Version:* 1.8  
    - *Potential Failures:* API key issues, OpenAI rate limits, prompt format errors, JSON parsing errors.  

  - **Filter**  
    - *Type:* Filter Node  
    - *Role:* Allows only emails classified as leads (`lead == true`) to continue through the workflow.  
    - *Configuration:* Condition checks if `{{ $json.message.content.lead.toBoolean() }}` is true.  
    - *Input:* Output of Filter leads.  
    - *Output:* Leads proceed; others are dropped.  
    - *Version:* 2.2  
    - *Potential Failures:* Expression evaluation failures if the AI output is malformed or missing.

  - *Sticky Note Content (Filter leads + Filter):*  
    > Uses an AI model to analyze the incoming email and determine whether the sender is a potential lead. The AI looks for keywords, tone, and intent within the message to classify it as a lead or not.  
    > Filters out emails that are NOT classified as leads. Only messages identified as leads will continue through the workflow for an automated reply.

#### 1.3 AI-Generated Reply Creation

- **Overview:**  
  Generates a personalized response using GPT-4o based on the lead’s email content, aiming to greet, answer preliminary questions, and encourage engagement.

- **Nodes Involved:**  
  - Reply with customized message (OpenAI node)

- **Node Details:**

  - **Reply with customized message**  
    - *Type:* OpenAI (LangChain) Node  
    - *Role:* Creates a customized reply to the lead’s inquiry using GPT-4o.  
    - *Configuration:*  
      - Model: GPT-4o  
      - Messages include:  
        1. Instruction for the AI to monitor sales email inbox and respond appropriately with concise language.  
        2. A sample example interaction with a prospect named Michael Jackson for context.  
        3. The incoming email plain text inserted dynamically (`{{ $('Email Trigger (IMAP)').item.json.textPlain }}`).  
    - *Input:* Filtered leads only.  
    - *Output:* AI-generated reply text under `message.content`.  
    - *Version:* 1.8  
    - *Potential Failures:* API errors, prompt misconfiguration, output formatting issues.  
    - *Sticky Note Content:*  
      > Generates a personalized reply using AI based on the content of the incoming email. The response can be tailored to greet the sender, answer initial questions, and encourage further engagement. Make sure to replace your own "business/service" in the prompt.

#### 1.4 Email Retrieval & Reply Dispatch

- **Overview:**  
  Retrieves full details of the original email from Gmail to ensure replies are properly threaded, then sends the AI-generated reply as a direct response within the same conversation thread.

- **Nodes Involved:**  
  - Get Message (Gmail node)  
  - Reply to Message (Gmail node)

- **Node Details:**

  - **Get Message**  
    - *Type:* Gmail Node  
    - *Role:* Searches Gmail for the original email using sender and subject filters to obtain complete message metadata and thread info.  
    - *Configuration:*  
      - Operation: `getAll` filtered by `from:"sender" subject:"subject"` dynamically based on the original email fields.  
      - Credentials: OAuth2 Gmail account.  
    - *Input:* AI-generated reply output.  
    - *Output:* Detailed email message data.  
    - *Version:* 2.1  
    - *Potential Failures:* Gmail API quota limits, OAuth token expiration, query mismatches.  
    - *Sticky Note Content:*  
      > Retrieves the full details of the original email, including the sender’s address and the conversation thread. Ensures the reply is linked to the correct email conversation.  
      > [Guide](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/)

  - **Reply to Message**  
    - *Type:* Gmail Node  
    - *Role:* Sends the AI-generated reply as a reply message linked to the original email's thread.  
    - *Configuration:*  
      - Operation: `reply`  
      - Message: Text generated by the AI (`{{ $('Reply with customized message').item.json.message.content }}`)  
      - Message ID: Original email’s `message-id` metadata to maintain threading (`{{ $('Email Trigger (IMAP)').item.json.metadata['message-id'] }}`)  
      - Email type: Text  
      - Credentials: OAuth2 Gmail account  
    - *Input:* Output from Get Message.  
    - *Output:* Confirmation of sent email.  
    - *Version:* 2.1  
    - *Potential Failures:* Gmail API errors, invalid message ID, OAuth expiration, network issues.  
    - *Sticky Note Content:*  
      > Sends the AI-generated reply back to the sender as a direct response to their email. The reply will appear as part of the same conversation thread in the recipient’s inbox.  
      > [Guide](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/)

---

### 3. Summary Table

| Node Name                  | Node Type                   | Functional Role                                  | Input Node(s)              | Output Node(s)             | Sticky Note                                                                                           |
|----------------------------|-----------------------------|-------------------------------------------------|----------------------------|----------------------------|-----------------------------------------------------------------------------------------------------|
| Email Trigger (IMAP)        | Email Read IMAP Trigger      | Watches inbox for new incoming emails           | —                          | Filter leads               | Checks your email inbox for new incoming messages in real time using the IMAP protocol. [Guide](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.emailimap/) |
| Filter leads                | OpenAI (LangChain)           | AI classifies emails as potential leads or not | Email Trigger (IMAP)       | Filter                     | Uses an AI model to analyze the incoming email and determine whether the sender is a potential lead. The AI looks for keywords, tone, and intent within the message to classify it as a lead or not. |
| Filter                     | Filter                      | Filters out non-lead emails                      | Filter leads               | Reply with customized message | Filters out emails that are NOT classified as leads. Only messages identified as leads continue.     |
| Reply with customized message| OpenAI (LangChain)           | Generates personalized AI reply for leads       | Filter                     | Get Message                | Generates a personalized reply using AI based on the content of the incoming email. Make sure to replace your own "business/service" in the prompt. |
| Get Message                 | Gmail                       | Retrieves full original email details            | Reply with customized message | Reply to Message           | Retrieves the full details of the original email, including sender and conversation thread. [Guide](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/) |
| Reply to Message            | Gmail                       | Sends AI-generated reply linked to original email| Get Message                | —                          | Sends the AI-generated reply back to the sender as a direct response to their email. [Guide](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Email Trigger (IMAP)" node**  
   - Type: Email Read IMAP Trigger  
   - Configure IMAP credentials with your email account.  
   - Set folder to monitor (e.g., INBOX or Leads).  
   - Set post-processing action to "nothing".  
   - This node triggers the workflow on each new email.

2. **Create "Filter leads" node (OpenAI LangChain)**  
   - Type: OpenAI (LangChain) node  
   - Credentials: Link your OpenAI API key credentials.  
   - Model: Select "gpt-4o".  
   - Message prompt:  
     ```
     Indicate if the following message is a lead that's interested in my [service/offer]

     Output as JSON {"lead": "<true/false>"}

     {{ $json.textPlain }}
     ```  
   - Output: Enable JSON output (parsed).  
   - Connect "Email Trigger (IMAP)" output to this node input.

3. **Create "Filter" node**  
   - Type: Filter  
   - Condition: Only continue if expression `{{ $json.message.content.lead.toBoolean() }}` equals true.  
   - Connect "Filter leads" output to this node input.

4. **Create "Reply with customized message" node (OpenAI LangChain)**  
   - Type: OpenAI (LangChain) node  
   - Credentials: Use same OpenAI API key.  
   - Model: "gpt-4o"  
   - Messages sequence:  
     1. Instruction:  
        ```
        You're currently monitoring a sales email inbox for my [business and service you offer]. For every inquiry you receive, digest it and respond appropriately with a customized message that's tuned to the particular prospect. Make sure to use spartan, no-frills language.
        ```
     2. Example conversation:  
        ```
        Name: Michael Jackson  
        Type: High-Ticket  
        Monthly Commitment: $8,000  
        About: Hi I really want to get started on your high tickey monthly e-commerce offer - let me know how to start!
        ```
     3. AI assistant example reply:  
        ```
        Hey Michael,

        Nick here. Thanks for reaching out & I appreciate your interest in my high ticket e-commerce offer. Happy to help you get started!

        I just let someone on my team know about this & they'll give you a call in a couple of minutes to dive into detail. Looking forward to working with you.

        Cheers,  
        Santi
        ```
     4. Dynamic user input: `{{ $('Email Trigger (IMAP)').item.json.textPlain }}`  
   - Connect "Filter" node output to this node input.

5. **Create "Get Message" node (Gmail)**  
   - Type: Gmail  
   - Credentials: Set up Gmail OAuth2 credentials.  
   - Operation: `getAll`  
   - Filters:  
     ```
     q = from:"{{ $('Email Trigger (IMAP)').item.json.from }}" subject:"{{ $('Email Trigger (IMAP)').item.json.subject }}"
     ```  
   - Connect "Reply with customized message" output to this node input.

6. **Create "Reply to Message" node (Gmail)**  
   - Type: Gmail  
   - Credentials: Use Gmail OAuth2 credentials.  
   - Operation: `reply`  
   - Message: `{{ $('Reply with customized message').item.json.message.content }}`  
   - Message ID: `{{ $('Email Trigger (IMAP)').item.json.metadata['message-id'] }}` (to ensure threading)  
   - Email Type: Text  
   - Connect "Get Message" output to this node input.

7. **Save and activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                                                                                      |
|----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Make sure to replace your own [service/offer] or [business and service you offer] placeholders in the AI prompts to tailor the model's understanding and replies to your specific context. | Prompt customization instruction within AI nodes.                                                                   |
| Gmail nodes require OAuth2 credentials with permissions to read and send emails on your behalf. Ensure proper consent and token refresh handling. | Gmail OAuth2 setup.                                                                                                  |
| IMAP node requires correct server, port, and security settings matching your email provider’s specifications. | IMAP email account configuration.                                                                                   |
| Sticky notes in the workflow provide helpful links to official n8n documentation for the Gmail and IMAP nodes. | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/ and https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.emailimap/ |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All processed data is legal and public.