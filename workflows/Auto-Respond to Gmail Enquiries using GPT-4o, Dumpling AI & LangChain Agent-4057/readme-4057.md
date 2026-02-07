Auto-Respond to Gmail Enquiries using GPT-4o, Dumpling AI & LangChain Agent

https://n8nworkflows.xyz/workflows/auto-respond-to-gmail-enquiries-using-gpt-4o--dumpling-ai---langchain-agent-4057


# Auto-Respond to Gmail Enquiries using GPT-4o, Dumpling AI & LangChain Agent

---

### 1. Workflow Overview

This workflow automates responses to new Gmail enquiries by leveraging advanced AI models and external knowledge sources. It targets customer support teams, sales departments, and solopreneurs who receive frequent emails and want to speed up and personalize their replies without manual effort or coding.

**Logical blocks:**

- **1.1 Input Reception**: Detects new incoming emails in Gmail.
- **1.2 Email Classification**: Uses GPT-4o to classify if an email is a genuine enquiry or not.
- **1.3 Enquiry Filtering**: Allows workflow continuation only for emails classified as enquiries.
- **1.4 AI Contextual Processing**: Utilizes a LangChain Agent enhanced with memory and Dumpling AI to analyze enquiry content and retrieve relevant contextual information.
- **1.5 Response Generation and Sending**: Constructs and sends a personalized reply via Gmail based on the agent’s output.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Watches the Gmail account for new incoming emails, triggering the workflow every minute.
- **Nodes Involved:**  
  - *Watch Gmail for New Incoming Emails*

- **Node Details:**

  - **Watch Gmail for New Incoming Emails**  
    - Type: Gmail Trigger  
    - Role: Initiates the workflow on new emails arrival.  
    - Configuration: Polls Gmail every minute to fetch new messages. No specific filters applied, so all emails trigger it.  
    - Key variables: Extracts the email snippet (body preview) from incoming emails.  
    - Connections: Output to *Classify Email Type with GPT-4o* node.  
    - Edge cases: Potential delays if Gmail API quota limits hit; OAuth token expiry issues; large inboxes may cause latency.

#### 2.2 Email Classification

- **Overview:** Classifies incoming email content as either an "enquiry" or "false" (non-enquiry) using an OpenAI GPT-4o prompt to determine if further processing is warranted.
- **Nodes Involved:**  
  - *Classify Email Type with GPT-4o*

- **Node Details:**

  - **Classify Email Type with GPT-4o**  
    - Type: OpenAI (LangChain node)  
    - Role: Runs a classification prompt instructing GPT-4o to analyze the email snippet and return "enquiry" or "false" exclusively.  
    - Configuration: Uses GPT-4o model, prompt explicitly asks for a single word response with no explanations.  
    - Expressions: References `{{ $json.snippet }}` to obtain email content.  
    - Connections: Output to *Only Proceed if Email is an Enquiry* filter node.  
    - Edge cases: GPT misclassification risk (false positives/negatives); API rate limits; prompt injection risks if emails contain malicious content.

#### 2.3 Enquiry Filtering

- **Overview:** Filters workflow flow to continue processing only if the email classification result is exactly "enquiry".
- **Nodes Involved:**  
  - *Only Proceed if Email is an Enquiry*

- **Node Details:**

  - **Only Proceed if Email is an Enquiry**  
    - Type: Filter  
    - Role: Performs strict string comparison to check if classification output equals "enquiry".  
    - Configuration: Case-sensitive, strict type validation on the field `{{$json.message.content}}` (output from classification).  
    - Connections: Passes filtered emails to *LangChain Agent Handles Reply Logic*.  
    - Edge cases: If classification output format changes or contains whitespace, filter may fail; workflow halts silently for non-enquiries.

#### 2.4 AI Contextual Processing

- **Overview:** This block uses a LangChain agent empowered by additional AI tools and memory to understand the enquiry deeply, fetch relevant contextual information, and generate a coherent response.
- **Nodes Involved:**  
  - *LangChain Agent Handles Reply Logic*  
  - *GPT-4o Chat Model*  
  - *Memory Buffer (Past 10 Interactions)*  
  - *Dumpling AI Agent – Search for Relevant Info*

- **Node Details:**

  - **LangChain Agent Handles Reply Logic**  
    - Type: LangChain Agent  
    - Role: Central AI agent that orchestrates tools and memory to handle the reply.  
    - Configuration: Receives the email snippet as input text; system message instructs it to act as a helpful assistant using the Dumpling AI search tool and sending emails via Gmail.  
    - Connections:  
      - Receives input from *Only Proceed if Email is an Enquiry*.  
      - Uses *GPT-4o Chat Model* as the language model.  
      - Uses *Memory Buffer* to maintain context over last 10 interactions.  
      - Uses *Dumpling AI Agent* as an external tool to search relevant info.  
      - Outputs to *Send Email Response via Gmail*.  
    - Edge cases: Tool invocation failures; memory overload; API request failures; inconsistent input data formats.

  - **GPT-4o Chat Model**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides the underlying language generation capability for the agent.  
    - Configuration: Uses a "gpt-4o-mini" model variant optimized for chat.  
    - Connections: Linked as the AI language model for the LangChain agent.  
    - Edge cases: Model unavailability; slow response times; token limits.

  - **Memory Buffer (Past 10 Interactions)**  
    - Type: LangChain Memory Buffer Window  
    - Role: Stores context of the last 10 interactions to enable conversational continuity.  
    - Configuration: Window size set to 10 messages.  
    - Connections: Provides memory input to the LangChain agent.  
    - Edge cases: Memory data corruption; overflow; loss of context on workflow restart.

  - **Dumpling AI Agent – Search for Relevant Info**  
    - Type: LangChain HTTP Request Tool  
    - Role: Sends the email content to Dumpling AI’s API to fetch relevant contextual knowledge from trained agents (e.g., help docs, FAQs).  
    - Configuration:  
      - POST request to Dumpling AI endpoint `https://app.dumplingai.com/api/v1/agents/generate-completion`.  
      - JSON body includes the email snippet and the Dumpling agent ID.  
      - Authenticated with API key via HTTP header (generic HTTP header auth).  
    - Expressions: Uses `{{ $('Watch Gmail for New Incoming Emails').item.json.snippet }}` to grab email body.  
    - Connections: Linked as a tool within the LangChain agent.  
    - Edge cases: API key expiry; network errors; malformed requests; parsing errors.

#### 2.5 Response Generation and Sending

- **Overview:** Sends the AI-generated reply back to the original email thread via Gmail.
- **Nodes Involved:**  
  - *Send Email Response via Gmail*

- **Node Details:**

  - **Send Email Response via Gmail**  
    - Type: Gmail Tool  
    - Role: Sends the response email crafted by the LangChain agent to the original sender.  
    - Configuration:  
      - Message and subject are dynamically overridden by AI-generated content via `$fromAI()` expression.  
      - Sends email to the sender’s address automatically (configured implicitly, no explicit "sendTo" set).  
      - Uses Gmail OAuth2 credentials authenticated for sending.  
    - Connections: Receives output from *LangChain Agent Handles Reply Logic*.  
    - Edge cases: Gmail API rate limits; invalid email addresses; OAuth token expiry; message formatting issues.

---

### 3. Summary Table

| Node Name                        | Node Type                         | Functional Role                         | Input Node(s)                      | Output Node(s)                     | Sticky Note                                                                                                                           |
|---------------------------------|----------------------------------|---------------------------------------|----------------------------------|-----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Watch Gmail for New Incoming Emails | Gmail Trigger                    | Detects new incoming emails           | —                                | Classify Email Type with GPT-4o   |                                                                                                                              |
| Classify Email Type with GPT-4o | OpenAI (LangChain)               | Classifies email as enquiry or not    | Watch Gmail for New Incoming Emails | Only Proceed if Email is an Enquiry |                                                                                                                              |
| Only Proceed if Email is an Enquiry | Filter                          | Filters only enquiry emails            | Classify Email Type with GPT-4o   | LangChain Agent Handles Reply Logic |                                                                                                                              |
| LangChain Agent Handles Reply Logic | LangChain Agent                 | Processes enquiry and formulates reply | Only Proceed if Email is an Enquiry | Send Email Response via Gmail     |                                                                                                                              |
| GPT-4o Chat Model               | LangChain OpenAI Chat Model      | Provides AI language generation       | — (linked as tool)                | LangChain Agent Handles Reply Logic |                                                                                                                              |
| Memory Buffer (Past 10 Interactions) | LangChain Memory Buffer Window  | Provides conversational memory        | — (linked as memory input)        | LangChain Agent Handles Reply Logic |                                                                                                                              |
| Dumpling AI Agent – Search for Relevant Info | LangChain HTTP Request Tool    | Fetches contextual info from Dumpling AI | — (linked as tool)                | LangChain Agent Handles Reply Logic |                                                                                                                              |
| Send Email Response via Gmail   | Gmail Tool                      | Sends AI-generated reply via Gmail    | LangChain Agent Handles Reply Logic | —                                 |                                                                                                                              |
| Sticky Note                    | Sticky Note                      | —                                     | —                                | —                                 | ### ✉️ Sticky Note 2: Website Scraping, Email Generation, and Sending For leads with complete data, Dumpling AI scrapes the content of the lead’s company website. This content, combined with scraped details, is structured into a prompt using the Set node. GPT-4o processes the prompt and generates a personalized cold email. The email is then sent to the lead using Gmail. This automates targeted cold outreach using scraped insights and AI-generated messaging. |
| Sticky Note1                   | Sticky Note                      | —                                     | —                                | —                                 | ### Sticky Note 1: Apollo Link Sourcing & Contact Scraping This section begins the workflow manually. The Apollo lead URLs are pulled from a Google Sheet. Each link is passed to Apify which scrapes key lead details such as name, email, company website, and other contact data. After scraping, a filter checks that both an email and website were found for the lead before moving forward. This ensures only complete lead data is used for outreach. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger node**  
   - Type: Gmail Trigger  
   - Configure OAuth2 credentials with your Gmail account.  
   - Set polling to “Every Minute” with no filters to detect all incoming emails.

2. **Add OpenAI classification node**  
   - Type: OpenAI (LangChain)  
   - Connect input from Gmail Trigger node output.  
   - Use GPT-4o model.  
   - Set prompt text:  
     ```
     Classify the following email content. Determine if it is an enquiry.
     If it is an enquiry, return only this word: enquiry
     If it is not an enquiry, return only this word: false
     Do not explain or add any other text. Only return the result.
     Here is the email body: {{ $json.snippet }}
     ```
   - Use OpenAI API credentials.

3. **Add Filter node to continue only if classified as "enquiry"**  
   - Type: Filter  
   - Connect input from OpenAI classification node.  
   - Condition: Check if `{{$json.message.content}}` equals string `"enquiry"` (case-sensitive, strict).

4. **Add LangChain Agent node for reply logic**  
   - Type: LangChain Agent  
   - Connect input from Filter node output.  
   - Input text: `{{ $('Watch Gmail for New Incoming Emails').item.json.snippet }}`  
   - System message:  
     ```
     You are a helpful assistant, use the search for information tool to search for users information.
     use Gmail tool to send email
     ```  
   - Prompt type: Define  
   - Credentials: OpenAI API credentials.

5. **Add GPT-4o Chat Model node**  
   - Type: LangChain OpenAI Chat Model  
   - Model: gpt-4o-mini  
   - Credentials: OpenAI API credentials.  
   - Link this node as the AI language model input to the LangChain Agent node.

6. **Add Memory Buffer node**  
   - Type: LangChain Memory Buffer Window  
   - Set context window length to 10 messages.  
   - Connect as memory input to LangChain Agent node.

7. **Add Dumpling AI HTTP Request node**  
   - Type: HTTP Request (LangChain Tool)  
   - Set method POST  
   - URL: `https://app.dumplingai.com/api/v1/agents/generate-completion`  
   - Body (JSON):  
     ```json
     {
       "messages": [
         {
           "role": "user",
           "content": "{{ $('Watch Gmail for New Incoming Emails').item.json.snippet }}"
         }
       ],
       "agentId": "YOUR_DUMPLING_AGENT_ID",
       "parseJson": "True"
     }
     ```  
   - Authentication: HTTP Header with Dumpling API key.  
   - Connect as a tool input to LangChain Agent node.

8. **Add Gmail Send node to send the reply**  
   - Type: Gmail Tool  
   - Connect input from LangChain Agent node output.  
   - Use OAuth2 credentials for Gmail.  
   - Set message and subject parameters to be dynamically overridden by AI output using:  
     - Message: `={{ $fromAI('Message', '', 'string') }}`  
     - Subject: `={{ $fromAI('Subject', '', 'string') }}`  

9. **Verify all connections**:  
   - Gmail Trigger → OpenAI Classification → Filter → LangChain Agent  
   - LangChain Agent uses GPT-4o Chat Model, Memory Buffer, Dumpling AI tool  
   - LangChain Agent → Gmail Send node

10. **Test workflow**:  
    - Send test enquiry emails to Gmail inbox and verify AI classification, context search, and email reply.

---

### 5. General Notes & Resources

| Note Content                                                                                                                    | Context or Link                               |
|--------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------|
| Workflow ideal for customer support, sales teams, or solopreneurs who want to automate email response without coding.          | Workflow Description                          |
| Dumpling AI requires separate signup and agent setup to search your knowledge base or FAQs.                                     | https://www.dumplingai.com/                    |
| Gmail OAuth2 credentials must be authenticated for both trigger and send nodes.                                                 | Gmail API documentation                        |
| GPT-4o model used for both classification and chat generation tasks in LangChain nodes.                                        | OpenAI GPT-4o model reference                  |
| Sticky notes in workflow mention related workflows involving Apollo lead scraping and cold outreach automation.                | Internal workflow documentation notes          |

---

**Disclaimer:** The text provided is exclusively from an automated workflow created with n8n, respecting all current content policies and containing no illegal, offensive, or protected elements. All data processed is legal and public.

---