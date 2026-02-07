AI-Powered Email Replies with Spam Filtering & FAQ Lookup using GPT-4o mini & Pinecone

https://n8nworkflows.xyz/workflows/ai-powered-email-replies-with-spam-filtering---faq-lookup-using-gpt-4o-mini---pinecone-5142


# AI-Powered Email Replies with Spam Filtering & FAQ Lookup using GPT-4o mini & Pinecone

### 1. Workflow Overview

This workflow automates the process of replying to incoming Gmail emails using an AI-powered agent enhanced with spam filtering and FAQ lookup capabilities. It targets businesses or support teams that want to automatically handle email replies intelligently by leveraging GPT-4o mini for natural language understanding and Pinecone as a vector store for FAQ and knowledge base retrieval.

The workflow can be logically grouped into these blocks:

- **1.1 Gmail Input and Message Retrieval**  
  Triggered by incoming Gmail emails, retrieves full email details for processing.

- **1.2 Spam Filtering**  
  Uses OpenAI GPT-4o mini with a specialized prompt to classify emails as "spam" or "no spam" based on content and sender characteristics.

- **1.3 Conditional Routing**  
  If the email is classified as "no spam," it proceeds to AI processing; otherwise, the workflow halts without replying.

- **1.4 AI Agent Processing with Contextual Memory and FAQ Lookup**  
  An AI Agent (LangChain node) uses GPT-4o mini as the chat model with a simple memory buffer and Pinecone vector store integration to generate contextually relevant email replies referencing the FAQ knowledge base.

- **1.5 Email Reply**  
  The AI-generated response is sent back as a reply to the original email via the Gmail node.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Gmail Input and Message Retrieval

**Overview:**  
This block listens for new Gmail emails and fetches the full message details necessary for downstream processing.

**Nodes Involved:**  
- Gmail Trigger  
- get_message

**Node Details:**

- **Gmail Trigger**  
  - Type: Gmail Trigger (n8n-nodes-base.gmailTrigger)  
  - Role: Watches Gmail inbox for new emails every hour.  
  - Configuration: No specific filters; polling mode set to every hour.  
  - Credentials: Uses OAuth2 credentials named "total_ai_solutions".  
  - Inputs: None (trigger node)  
  - Outputs: Emits event with email metadata for each new email detected.  
  - Potential Failures: OAuth token expiration, API rate limits.

- **get_message**  
  - Type: Gmail (n8n-nodes-base.gmail)  
  - Role: Retrieves full email content using the email ID from the trigger.  
  - Configuration: Operation = get, messageId extracted from trigger JSON, full message retrieval (simple=false).  
  - Credentials: Same Gmail OAuth2 credentials.  
  - Inputs: Email ID from Gmail Trigger node.  
  - Outputs: Complete email JSON including headers, body text, and metadata.  
  - Potential Failures: Invalid message ID, Gmail API errors, OAuth issues.

---

#### 2.2 Spam Filtering

**Overview:**  
Determines whether an incoming email is spam or a legitimate message from a possible client by classifying it using an OpenAI model with a custom system prompt.

**Nodes Involved:**  
- Spam checker  
- If

**Node Details:**

- **Spam checker**  
  - Type: OpenAI (LangChain openAi node)  
  - Role: Classifies emails as "spam" or "no spam" based on content and sender info.  
  - Configuration:  
    - Model: GPT-4o mini  
    - System prompt instructs checking for spam, automatic emails, and non-client sources; outputs strictly "spam" or "no spam".  
    - Input: Concatenation of email subject, from header, and plain text content.  
  - Credentials: OpenAI account (named "OpenAi account 2").  
  - Inputs: JSON from "get_message" node.  
  - Outputs: Single string with "spam" or "no spam".  
  - Edge Cases: Ambiguous content leading to misclassification; API timeouts; prompt misinterpretation.  
  - Failure Modes: API quota exhaustion, network issues.

- **If**  
  - Type: If (n8n-nodes-base.if)  
  - Role: Conditional routing based on Spam checker output.  
  - Configuration: Checks if output message content is not equal to "spam".  
  - Inputs: Output of Spam checker node.  
  - Outputs:  
    - True branch (no spam) proceeds to AI Agent.  
    - False branch ends workflow (no reply).  
  - Potential Failures: Expression syntax errors, unexpected output values.

---

#### 2.3 AI Agent Processing with Contextual Memory and FAQ Lookup

**Overview:**  
Generates an AI-powered reply using GPT-4o mini, incorporating conversation history (simple memory buffer) and consulting a Pinecone vector store containing FAQs and relevant data.

**Nodes Involved:**  
- AI Agent  
- OpenAI Chat Model  
- Simple Memory  
- Pinecone Vector Store  
- Embeddings OpenAI

**Node Details:**

- **OpenAI Chat Model**  
  - Type: LangChain LM Chat OpenAI  
  - Role: Provides the GPT-4o mini language model for the AI Agent.  
  - Configuration: Model selected as "gpt-4o-mini", no special options.  
  - Credentials: OpenAI account same as for Spam checker.  
  - Inputs: Connected to AI Agent node as language model backend.  
  - Outputs: Provides completions to AI Agent.

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window  
  - Role: Maintains a short-term memory of the conversation via a fixed session key "key".  
  - Configuration: Uses a custom session key 'key' to track conversation state.  
  - Inputs: AI Agent node uses this for context.  
  - Outputs: Updated memory state passed back to AI Agent.  
  - Edge Cases: Memory overflow or loss if session key is reused improperly.

- **Embeddings OpenAI**  
  - Type: LangChain Embeddings OpenAI  
  - Role: Generates vector embeddings from text to query the Pinecone vector store.  
  - Configuration: Default OpenAI embeddings parameters using the same OpenAI credentials.  
  - Inputs: Text from AI Agent or related nodes.  
  - Outputs: Vector embeddings for Pinecone querying.  
  - Failure Modes: API limits, embedding generation errors.

- **Pinecone Vector Store**  
  - Type: LangChain Vector Store Pinecone  
  - Role: Retrieves relevant FAQ information from the Pinecone index "faqmattabott" to inform AI Agent responses.  
  - Configuration: Mode set to "retrieve-as-tool" with tool name "FAQ".  
  - Inputs: Embeddings from Embeddings OpenAI node.  
  - Outputs: Relevant FAQ data passed as tool input to AI Agent.  
  - Edge Cases: Pinecone service outage, index misconfiguration, empty results.

- **AI Agent**  
  - Type: LangChain Agent  
  - Role: Central orchestrator that receives the incoming email text, queries the FAQ vector store, maintains conversation memory, and generates a response.  
  - Configuration:  
    - Input text taken from 'get_message' node JSON content.  
    - System message sets polite, professional assistant context, instructs to consult Pinecone before answering, and mandates sending replies via the Gmail tool node.  
    - Uses GPT-4o mini as the language model.  
    - Uses Simple Memory and Pinecone Vector Store as tools.  
    - Output directed to Gmail node.  
  - Inputs: Email text from 'get_message', memory, language model, vector store.  
  - Outputs: AI-generated email reply content and subject line.  
  - Failure Modes: Model errors, empty or irrelevant FAQ responses, tool communication failures.

---

#### 2.4 Email Reply

**Overview:**  
Sends the AI-generated response back to the original email sender as a reply.

**Nodes Involved:**  
- Gmail

**Node Details:**

- **Gmail**  
  - Type: Gmail Tool (n8n-nodes-base.gmailTool)  
  - Role: Sends a reply email using AI Agent generated content.  
  - Configuration:  
    - Operation: reply  
    - Message: dynamically filled from AI Agent output ("Message" field), overrides default using $fromAI helper.  
    - Subject: set by AI Agent (short subject line or defaults to "Reply").  
    - Message ID: taken from original email ('get_message' node JSON id) to maintain threading.  
    - Email type: plain text.  
  - Credentials: Same Gmail OAuth2 credentials.  
  - Inputs: AI Agent output for message and subject, original email ID.  
  - Outputs: Confirmation of sent email.  
  - Failure Modes: API quota or limits, invalid message ID, OAuth expiration.

---

### 3. Summary Table

| Node Name           | Node Type                          | Functional Role                          | Input Node(s)       | Output Node(s)       | Sticky Note                                                                                                                     |
|---------------------|----------------------------------|----------------------------------------|---------------------|----------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Gmail Trigger       | Gmail Trigger                    | Triggers workflow on new Gmail emails  | None                | get_message          | Gmail trigger get the full email<br>Spam checker is OpenAI node with specific system prompt.<br>If spam, no reply sent.         |
| get_message         | Gmail                           | Retrieves full email content            | Gmail Trigger       | Spam checker         | Gmail trigger get the full email<br>Spam checker is OpenAI node with specific system prompt.<br>If spam, no reply sent.         |
| Spam checker        | OpenAI (LangChain openAi)        | Classifies email as spam or no spam    | get_message         | If                   | Gmail trigger get the full email<br>Spam checker is OpenAI node with specific system prompt.<br>If spam, no reply sent.         |
| If                  | If                              | Routes based on spam classification    | Spam checker        | AI Agent (if no spam) | Gmail trigger get the full email<br>Spam checker is OpenAI node with specific system prompt.<br>If spam, no reply sent.         |
| AI Agent            | LangChain Agent                 | Generates AI email reply via GPT & FAQ | If (true branch)    | Gmail                | AI Agent get the message and respond autonomously using Pinecone vector store FAQ data                                          |
| OpenAI Chat Model   | LangChain LM Chat OpenAI         | GPT-4o mini language model backend     | AI Agent            | AI Agent             | AI Agent get the message and respond autonomously using Pinecone vector store FAQ data                                          |
| Simple Memory       | LangChain Memory Buffer Window   | Maintains conversation context         | AI Agent            | AI Agent             | AI Agent get the message and respond autonomously using Pinecone vector store FAQ data                                          |
| Embeddings OpenAI   | LangChain Embeddings OpenAI      | Generates embeddings for vector store  | Pinecone Vector Store| Pinecone Vector Store | VECTOR STORE                                                                                                                   |
| Pinecone Vector Store| LangChain Vector Store Pinecone | Retrieves relevant FAQ info             | Embeddings OpenAI   | AI Agent             | VECTOR STORE                                                                                                                   |
| Gmail               | Gmail Tool                      | Sends AI-generated reply email         | AI Agent            | None                 |                                                                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node**  
   - Type: Gmail Trigger  
   - Credentials: Set up OAuth2 for Gmail with appropriate scopes.  
   - Parameters: No filters; set polling to every hour.  
   - Purpose: Detect new incoming emails.

2. **Add Gmail Node to Retrieve Full Message**  
   - Type: Gmail (operation: get)  
   - Credentials: Same Gmail OAuth2 credentials.  
   - Parameters:  
     - Message ID: `={{ $json.id }}` (from Gmail Trigger output)  
     - Simple: false (to get full email content)  
   - Connect Gmail Trigger output to this node.

3. **Add Spam Checker Node (OpenAI GPT-4o mini)**  
   - Type: LangChain OpenAI node  
   - Credentials: OpenAI API credentials configured.  
   - Parameters:  
     - Model ID: "gpt-4o-mini"  
     - Messages:  
       - System message:  
         ```
         You are a e-mail assistant. You have to check if the received e-mail are spam or not.
         You have to check not only normal spam, but everything is not sent from a person, for example, automatic e-mail, google email, and anything out of a possible client.

         If an e-mail is considered spam, your output will be "spam". If not, say "no spam".

         Don't respond anything else "spam" or "not spam".
         ```  
       - User input message: concatenate email subject, from header, and body text:  
         `={{ $json.headers.subject }}{{ $json.headers.from }}{{ $json.text }}`  
   - Connect `get_message` output to Spam checker input.

4. **Add If Node**  
   - Type: If  
   - Parameters:  
     - Condition: Check if the Spam checker output is not equal to "spam"  
       Expression: `{{$json.message.content}} != 'spam'`  
   - Connect Spam checker output to the If node.

5. **Create OpenAI Chat Model Node**  
   - Type: LangChain LM Chat OpenAI  
   - Credentials: OpenAI API credentials.  
   - Parameters: Set model to "gpt-4o-mini".  
   - No direct connections yet (used by AI Agent).

6. **Create Simple Memory Node**  
   - Type: LangChain Memory Buffer Window  
   - Parameters:  
     - Session Key: `'key'` (static string)  
     - Session ID Type: customKey  
   - No direct connections yet (used by AI Agent).

7. **Create Embeddings OpenAI Node**  
   - Type: LangChain Embeddings OpenAI  
   - Credentials: OpenAI API credentials.  
   - Use default parameters for embedding generation.

8. **Create Pinecone Vector Store Node**  
   - Type: LangChain Vector Store Pinecone  
   - Parameters:  
     - Mode: retrieve-as-tool  
     - Tool Name: "FAQ"  
     - Pinecone Index: Select or create index named "faqmattabott" containing FAQ and knowledge base data.  
   - Connect Embeddings OpenAI output to this node.

9. **Create AI Agent Node**  
   - Type: LangChain Agent  
   - Parameters:  
     - Text input: `={{ $('get_message').item.json.text }}` (email body text)  
     - Prompt Type: define  
     - System Message:  
       ```
       You are a polite and professional virtual assistant.

       You receive an email.

       Your knowledge base is stored in the Pinecone Vector Store, which contains all relevant FAQs and information needed to assist the user accurately.

       Always consult the Pinecone Vector Store before generating your response.

       Your final answer must be sent using the "Gmail" tool.

       When using the Gmail tool, make sure to:

       Fill in the Message field with the response content

       Fill in the Subject field with a short subject line (you can use "Reply" if unsure)
       ```  
     - Language Model: Connect to OpenAI Chat Model node  
     - Memory: Connect to Simple Memory node  
     - AI Tool: Connect to Pinecone Vector Store node  

   - Connect If node's **true** output (no spam) to AI Agent input.

10. **Create Gmail Node for Sending Reply**  
    - Type: Gmail Tool  
    - Credentials: Same Gmail OAuth2 credentials.  
    - Parameters:  
      - Operation: reply  
      - Message: `={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('Message', ``, 'string') }}` (dynamic from AI Agent output)  
      - Subject: from AI Agent output (subject line)  
      - MessageId: `={{ $('get_message').item.json.id }}` (to maintain thread)  
      - Email Type: text/plain  
      - Options: Disable attribution footer  
    - Connect AI Agent main output to Gmail node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                | Context or Link                                                                                         |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Gmail trigger gets the full email; spam checker uses an OpenAI node with a specific system prompt to classify spam; if spam, no email reply is sent.                                                        | Sticky Note on Gmail Trigger, get_message, Spam checker, If nodes                                     |
| AI Agent responds autonomously to emails, referencing a vector store with FAQs and product data.                                                                                                            | Sticky Note on AI Agent, OpenAI Chat Model, Simple Memory nodes                                       |
| Pinecone vector store is used to store and retrieve FAQ data to support accurate AI responses.                                                                                                             | Sticky Note near Embeddings OpenAI and Pinecone Vector Store nodes                                   |
| System prompt in AI Agent emphasizes polite, professional tone and instructs consulting Pinecone vector store before replying.                                                                             | AI Agent system message details                                                                        |
| GPT-4o mini model selected for its balance of performance and capability in email understanding and generation.                                                                                             | OpenAI Chat Model and Spam Checker node configurations                                               |

---

**Disclaimer:** The provided text is extracted exclusively from an n8n automated workflow. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.