AI-Powered Gmail Customer Support with OpenRouter & Pinecone Knowledge Base

https://n8nworkflows.xyz/workflows/ai-powered-gmail-customer-support-with-openrouter---pinecone-knowledge-base-9414


# AI-Powered Gmail Customer Support with OpenRouter & Pinecone Knowledge Base

### 1. Workflow Overview

This workflow automates customer support email handling by integrating Gmail with AI-powered classification, knowledge base retrieval, and response generation. It is designed to:

- Automatically detect new customer emails in Gmail.
- Classify emails as customer support related or not.
- Use AI language models (OpenRouter) and a Pinecone vector database knowledge base to generate accurate, friendly replies.
- Send replies directly from the Gmail account.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Gmail Trigger node listens for new incoming emails.
- **1.2 Email Classification:** Classifies incoming emails into "Customer Support" or "Other" using an AI text classifier.
- **1.3 AI Agent Processing:** For customer support emails, invokes an AI Agent that incorporates knowledge retrieval and language model processing to craft responses.
- **1.4 Knowledge Base Integration:** Embeddings and Pinecone vector store nodes enable retrieval of relevant FAQ or policy information to ground AI answers.
- **1.5 Response Dispatch:** Sends the AI-generated reply back to the customer via Gmail.

This design ensures efficient, relevant, and consistent customer support with minimal manual intervention.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Continuously monitors a Gmail inbox for new messages, triggering the workflow when a new email arrives.

- **Nodes Involved:**  
  - Gmail Trigger

- **Node Details:**  
  - **Gmail Trigger**  
    - *Type:* Gmail Trigger (n8n-nodes-base.gmailTrigger)  
    - *Configuration:* Polls Gmail every minute to detect new emails; no filters applied to capture all incoming messages.  
    - *Credentials:* Uses Gmail OAuth2 to authenticate and access the mailbox.  
    - *Inputs:* None (trigger node).  
    - *Outputs:* Emits email metadata and content (including the raw email text).  
    - *Version-specific:* Uses typeVersion 1.2; compatible with current Gmail API and OAuth2.  
    - *Potential Issues:* OAuth token expiration, Gmail API rate limits, network timeouts.  
    - *Sticky Note:* Explains functionality, value, and credential setup.

#### 2.2 Email Classification

- **Overview:**  
  Uses an AI-powered text classifier to determine if the incoming email is related to customer support or not, enabling selective processing.

- **Nodes Involved:**  
  - Text Classifier  
  - OpenRouter Chat Model (used as language model for classification)  
  - No Operation, do nothing (fallback for non-customer support emails)

- **Node Details:**  
  - **Text Classifier**  
    - *Type:* LangChain Text Classifier (@n8n/n8n-nodes-langchain.textClassifier)  
    - *Configuration:* Classifies input text into two categories: "Customer Support" (defined with detailed instructions and example) or "Other."  
    - *Key Expression:* Input text is extracted from the Gmail Trigger node’s email text (`={{ $json.text }}`).  
    - *Input:* From Gmail Trigger (email text).  
    - *Outputs:* Two possible paths — "Customer Support" emails proceed to AI Agent; others go to No Operation node.  
    - *Credentials:* None; uses internal LangChain classifier.  
    - *Failure Modes:* Classification errors due to ambiguous text or malformed input.  
    - *Sticky Note:* Describes classifier purpose and setup.

  - **OpenRouter Chat Model (for classification)**  
    - *Type:* LM Chat OpenRouter (@n8n/n8n-nodes-langchain.lmChatOpenRouter)  
    - *Configuration:* Default OpenRouter Chat Model used to support classification node.  
    - *Credentials:* Requires OpenRouter API key.  
    - *Input/Output:* Connected to Text Classifier as language model backend.  
    - *Potential Issues:* API quota limits, latency, authentication errors.  
    - *Sticky Note:* Highlights role in classification and response generation.

  - **No Operation, do nothing**  
    - *Type:* NoOp (n8n-nodes-base.noOp)  
    - *Purpose:* Ends processing for non-customer support emails without action.  
    - *Input:* From Text Classifier’s "Other" output.  
    - *Output:* None.

#### 2.3 AI Agent Processing

- **Overview:**  
  Processes customer support emails by retrieving relevant knowledge base information and generating a detailed, friendly reply using AI.

- **Nodes Involved:**  
  - AI Agent  
  - OpenRouter Chat Model1 (used by AI Agent)  
  - knowledgeBase (Pinecone Vector Store)  
  - Embeddings OpenAI  
  - Reply to a message (Gmail node)

- **Node Details:**  
  - **AI Agent**  
    - *Type:* LangChain Agent (@n8n/n8n-nodes-langchain.agent)  
    - *Configuration:* Processes the incoming email text; uses a system message to define agent role as a customer support agent for "Tech Haven."  
    - *System Message Key Points:*  
      - Act as a helpful support agent.  
      - Provide detailed, friendly responses signed as "Mrs. Helpful from Tech Haven Solutions."  
      - Use knowledgeBase tool to retrieve relevant info.  
    - *Input:* Email text from Gmail Trigger (via Text Classifier).  
    - *Outputs:* AI-generated email body content.  
    - *Credentials:* Requires OpenRouter API and Pinecone knowledge base connection.  
    - *Failure Modes:* API errors, missing knowledge base data, malformed input.  
    - *Sticky Note:* Describes AI Agent role and credentials.

  - **OpenRouter Chat Model1**  
    - *Type:* LM Chat OpenRouter  
    - *Configuration:* Uses "google/gemini-2.0-flash-001" model for response generation.  
    - *Input/Output:* Provides language model support to AI Agent.  
    - *Credentials:* OpenRouter API key.  
    - *Potential Issues:* API rate limits, response delays.

  - **knowledgeBase (Pinecone Vector Store)**  
    - *Type:* Vector Store Pinecone (@n8n/n8n-nodes-langchain.vectorStorePinecone)  
    - *Configuration:* Set to "retrieve-as-tool" mode with namespace "FAQ" and index "sample." Acts as a tool for AI Agent to query relevant FAQ data.  
    - *Input:* Receives embeddings from Embeddings OpenAI.  
    - *Output:* Returns relevant knowledge snippets to AI Agent.  
    - *Credentials:* Pinecone API key required.  
    - *Failure Modes:* Connection errors, empty search results, API limits.  
    - *Sticky Note:* Explains role in storing and retrieving database info.

  - **Embeddings OpenAI**  
    - *Type:* LangChain Embeddings OpenAI (@n8n/n8n-nodes-langchain.embeddingsOpenAi)  
    - *Configuration:* Converts FAQ text into embeddings for vector search.  
    - *Input:* FAQ or knowledge base text.  
    - *Output:* Sends embeddings to Pinecone knowledgeBase node.  
    - *Credentials:* OpenAI API key required.  
    - *Potential Issues:* API quota limits, embedding failures.  
    - *Sticky Note:* Describes embedding role and credential setup.

  - **Reply to a message (Gmail)**  
    - *Type:* Gmail (n8n-nodes-base.gmail)  
    - *Operation:* Replies to the original customer email with AI-generated content.  
    - *Parameters:*  
      - Message body set to AI Agent's output.  
      - Email type: text.  
      - Reply to the message ID from Gmail Trigger.  
      - Does not append attribution automatically.  
    - *Credentials:* Gmail OAuth2.  
    - *Failure Modes:* Sending errors, authentication failures, rate limits.

---

### 3. Summary Table

| Node Name               | Node Type                            | Functional Role                          | Input Node(s)          | Output Node(s)             | Sticky Note                                                                                                  |
|-------------------------|------------------------------------|----------------------------------------|-----------------------|----------------------------|-------------------------------------------------------------------------------------------------------------|
| Gmail Trigger           | Gmail Trigger                      | Input Reception: Detect new emails     | None                  | Text Classifier            | ## Gmail Trigger \n- How it Works: Listens for new incoming Gmail messages in real time.\n- Value: Automatically pulls new customer emails into the workflow without manual checking.\n- Credentials: Connect your Gmail account using Gmail OAuth2. |
| Text Classifier         | LangChain Text Classifier          | Email Classification                    | Gmail Trigger         | AI Agent, No Operation     | ## Text Classifier\n- How it Works: Uses AI to classify emails into Customer Support or Other.\n- Value: Ensures only relevant customer support emails get a response.\n- Credentials: None required (uses built-in LangChain classifier). |
| OpenRouter Chat Model   | LM Chat OpenRouter                 | Language Model for Classification      | None                  | Text Classifier            | ## OpenRouter Chat Model \n- How it Works: Provides AI-powered text generation for classification and responses.\n- Value: Enhances classification and helps prepare structured input for the agent.\n- Credentials: Connect your OpenRouter API key. |
| No Operation, do nothing | NoOp                             | Fallback for non-customer emails       | Text Classifier       | None                      |                                                                                                             |
| AI Agent                | LangChain Agent                   | AI response generation                  | Text Classifier       | Reply to a message         | ## AI Agent \n- How it Works: Acts as a virtual support agent. It takes customer emails, retrieves policy/FAQ info, and drafts a helpful reply.\n- Value: Saves time by providing accurate, personalized, and friendly responses automatically.\n- Credentials: Requires OpenRouter API and connection to Pinecone knowledge base. |
| OpenRouter Chat Model1  | LM Chat OpenRouter                 | Language Model for AI Agent             | None                  | AI Agent                   | (Same note as OpenRouter Chat Model)                                                                       |
| knowledgeBase           | Vector Store Pinecone             | Knowledge base retrieval tool           | Embeddings OpenAI     | AI Agent (as tool)         | ## KnowledgeBase \n- How it Works: Stores and retrieves your Database information.\n- Value: Ensures responses are consistent and based on verified knowledge.\n- Credentials: Connect your Pinecone API credentials. |
| Embeddings OpenAI       | LangChain Embeddings OpenAI       | Converts FAQ text to embeddings         | None                  | knowledgeBase              | ## Embeddings (OpenAI)\n- How it Works: Converts FAQ text into embeddings so the AI can search and retrieve relevant information.\n- Value: Improves accuracy of answers by grounding responses in real data.\n- Credentials: Connect your OpenAI API key. |
| Reply to a message      | Gmail                            | Sends AI-generated reply via Gmail     | AI Agent              | None                      |                                                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger node:**  
   - Type: Gmail Trigger  
   - Set polling interval to every 1 minute.  
   - Authenticate using Gmail OAuth2 credentials for the support email account.  
   - Leave filters empty to capture all incoming messages.

2. **Add OpenRouter Chat Model node (for classification):**  
   - Type: LM Chat OpenRouter  
   - Use default settings without specifying a particular model.  
   - Authenticate with OpenRouter API credentials.

3. **Add Text Classifier node:**  
   - Type: LangChain Text Classifier  
   - Set input text to `={{ $json.text }}` (email body from Gmail Trigger).  
   - Define two categories:  
     - "Customer Support" with detailed description and example email.  
     - "Other" category for non-support emails.  
   - Use OpenRouter Chat Model node as language model backend.  
   - Connect Gmail Trigger’s output to Text Classifier input.

4. **Add No Operation node:**  
   - Type: NoOp  
   - No parameters needed.  
   - Connect from Text Classifier’s "Other" output to this node.

5. **Add OpenRouter Chat Model1 node (for AI Agent):**  
   - Type: LM Chat OpenRouter  
   - Set the model parameter to "google/gemini-2.0-flash-001".  
   - Authenticate with the same OpenRouter API credentials.

6. **Add Embeddings OpenAI node:**  
   - Type: LangChain Embeddings OpenAI  
   - Authenticate with OpenAI API credentials.  
   - Leave other options default.

7. **Add knowledgeBase node:**  
   - Type: Vector Store Pinecone  
   - Set mode to "retrieve-as-tool".  
   - Configure Pinecone namespace as "FAQ".  
   - Select Pinecone index named "sample".  
   - Provide description indicating this tool accesses your database info.  
   - Authenticate using Pinecone API credentials.  
   - Connect Embeddings OpenAI output to knowledgeBase embeddings input.

8. **Add AI Agent node:**  
   - Type: LangChain Agent  
   - Set input text to `={{ $('Gmail Trigger').item.json.text }}` (email text).  
   - Define system message:  
     ```
     # Overview 
     You are a customer support agent for Tech Haven. Your job is to respond to incoming emails with relevant information using your knowledgeBase tool. 

     # Instructions 
     - Your output should be friendly and give as detailed information as possible 
     - Sign off as Mrs. Helpful from Tech Haven Solutions 

     ## Output 
     - Output only the body content of the email
     ```  
   - Set prompt type as "define".  
   - Connect Text Classifier’s "Customer Support" output to AI Agent.  
   - Set AI Agent’s language model input to OpenRouter Chat Model1 node.  
   - Connect knowledgeBase node as AI tool input to AI Agent.

9. **Add Reply to a message node:**  
   - Type: Gmail  
   - Set operation to "reply".  
   - Email type: text.  
   - Message: Bind to AI Agent output `={{ $json.output }}`.  
   - Message ID: Bind to original Gmail Trigger message ID `={{ $('Gmail Trigger').item.json.id }}`.  
   - Disable appendAttribution.  
   - Authenticate with Gmail OAuth2 credentials.  
   - Connect AI Agent’s output to this node.

10. **Connect nodes accordingly:**  
    - Gmail Trigger → Text Classifier  
    - Text Classifier → AI Agent (Customer Support)  
    - Text Classifier → No Operation (Other)  
    - Embeddings OpenAI → knowledgeBase  
    - knowledgeBase → AI Agent (as tool)  
    - OpenRouter Chat Model → Text Classifier (ai_languageModel)  
    - OpenRouter Chat Model1 → AI Agent (ai_languageModel)  
    - AI Agent → Reply to a message

11. **Test the workflow:**  
    - Send a customer support email to the Gmail account.  
    - Confirm classification as Customer Support.  
    - Check that AI generates a reply using knowledge base info.  
    - Verify reply is sent successfully.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                            |
|-----------------------------------------------------------------------------------------------|------------------------------------------------------------|
| This workflow integrates Gmail with AI models and Pinecone vector DB to automate support replies. | Overview of project purpose.                                |
| For Gmail OAuth2 setup, refer to n8n Gmail node documentation for credential configuration.    | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/ |
| OpenRouter API keys are required for AI language models; sign up at https://openrouter.ai/     | OpenRouter API documentation.                               |
| Pinecone vector database is used as knowledge base; sign up and create index at https://www.pinecone.io/ | Pinecone API and index setup guide.                         |
| OpenAI API key is required for generating embeddings from FAQ text.                            | OpenAI API documentation: https://platform.openai.com/docs/api-reference/embeddings |
| The AI Agent uses a system prompt to maintain a friendly, helpful tone and consistent sign-off. | Custom prompt design best practices.                        |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.