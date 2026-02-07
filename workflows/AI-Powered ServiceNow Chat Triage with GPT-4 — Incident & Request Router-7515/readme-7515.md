AI-Powered ServiceNow Chat Triage with GPT-4 — Incident & Request Router

https://n8nworkflows.xyz/workflows/ai-powered-servicenow-chat-triage-with-gpt-4---incident---request-router-7515


# AI-Powered ServiceNow Chat Triage with GPT-4 — Incident & Request Router

---

### 1. Workflow Overview

This workflow implements an AI-powered chat triage system for ServiceNow Level 1 (L1) support. It receives user chat messages, classifies them into categories (Incident, Request, or Everything Else), and routes them accordingly to create ServiceNow incidents, submit service requests, or provide AI-driven answers using web search and memory capabilities. The workflow leverages GPT-4-based models and integrates with ServiceNow APIs and external tools like SerpAPI for web search.

Logical blocks:

- **1.1 Input Reception:** Triggering on incoming chat messages.
- **1.2 Text Classification:** Categorizing user queries into Incident, Request, or Everything Else.
- **1.3 Incident Creation:** Creating ServiceNow incident records for classified incidents.
- **1.4 Request Submission:** Submitting general requests via ServiceNow Service Catalog API.
- **1.5 AI Agent Handling:** Handling queries not classified as Incident or Request using an AI agent empowered with memory and web search tools.
- **1.6 Summarization:** Summarizing the agent’s actions and user queries for user-friendly feedback.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
Receives chat messages from users as the entry point of the workflow.

**Nodes Involved:**  
- When chat message received

**Node Details:**  
- **When chat message received**  
  - Type: LangChain Chat Trigger (Webhook)  
  - Role: Starts the workflow on receiving a chat message.  
  - Configuration: Listens on a webhook endpoint with no additional parameters.  
  - Inputs: External chat system messages.  
  - Outputs: Sends chat input text downstream.  
  - Edge cases: Webhook failures, malformed input, or missing chat content may cause the workflow to stall or fail.

---

#### 2.2 Text Classification

**Overview:**  
Classifies the incoming chat message into one of three categories: Incident, Request, or Everything Else.

**Nodes Involved:**  
- OpenAI Chat Model  
- Text Classifier  
- Sticky Note (Text Classifier explanation)

**Node Details:**  
- **OpenAI Chat Model**  
  - Type: LangChain OpenAI GPT-4 Chat Model  
  - Role: Provides the language model backend for classification.  
  - Configuration: Uses model "gpt-4.1-mini" with default options.  
  - Credentials: OpenAI API key with free credits.  
  - Inputs: Receives chat input from the trigger.  
  - Outputs: Feeds output to Text Classifier.  
  - Edge cases: API key invalid, rate limits, or timeouts.

- **Text Classifier**  
  - Type: LangChain Text Classifier  
  - Role: Uses GPT-4 to classify text into predefined categories.  
  - Configuration:  
    - System prompt instructs to classify input strictly into Incident, Request, or Everything Else categories with JSON-only output.  
    - Input text is the user chat input.  
    - Auto-fixing enabled to correct formatting.  
  - Inputs: Output from OpenAI Chat Model.  
  - Outputs: Three possible branches based on classification: Incident → Create Incident node, Request → HTTP Request1 node, Everything Else → AI Agent node.  
  - Edge cases: Misclassification, parsing errors, or unexpected categories.

- **Sticky Note (Text Classifier)**  
  - Content: Explains the three categories used for classification.

---

#### 2.3 Incident Creation

**Overview:**  
Creates an incident in ServiceNow when the user query is classified as an Incident.

**Nodes Involved:**  
- Create an incident  
- Sticky Note1 (Create Incident explanation)

**Node Details:**  
- **Create an incident**  
  - Type: ServiceNow node  
  - Role: Creates a new incident record in ServiceNow.  
  - Configuration:  
    - Resource: Incident  
    - Operation: Create  
    - Short description set to the user’s chat input text.  
    - Uses Basic Authentication credentials for ServiceNow.  
  - Inputs: Triggered from Text Classifier on Incident classification.  
  - Outputs: Passes result to Summarization Chain.  
  - Edge cases: Authentication failures, API errors, missing required fields.

- **Sticky Note1**  
  - Content: Notes this node creates incidents using ServiceNow connector.

---

#### 2.4 Request Submission

**Overview:**  
Submits a general service request via the ServiceNow Service Catalog API when the classification is Request.

**Nodes Involved:**  
- HTTP Request1  
- Sticky Note4 (Submit a General Request explanation)

**Node Details:**  
- **HTTP Request1**  
  - Type: HTTP Request  
  - Role: Posts a service catalog order request to ServiceNow via REST API.  
  - Configuration:  
    - URL: ServiceNow Service Catalog API endpoint (order_now).  
    - Method: POST  
    - Headers: Accept application/json  
    - Body: JSON including quantity=1 and variables.description set to user chat input.  
    - Authentication: Predefined ServiceNow Basic Auth credentials.  
  - Inputs: Triggered from Text Classifier on Request classification.  
  - Outputs: Sent to Summarization Chain.  
  - Edge cases: API endpoint changes, authentication failure, invalid payload.

- **Sticky Note4**  
  - Content: Explains this is a demo for submitting general requests using ServiceNow Service Catalog API; includes a documentation link:  
    https://www.servicenow.com/docs/bundle/zurich-api-reference/page/integrate/inbound-rest/concept/c_ServiceCatalogAPI.html#title_servicecat-POST-cart-sub_order

---

#### 2.5 AI Agent Handling

**Overview:**  
Handles all other user queries (Everything Else category) using a GPT-4 powered AI Agent, augmented with web search and conversation memory.

**Nodes Involved:**  
- AI Agent  
- OpenAI Chat Model1  
- Simple Memory  
- SerpAPI  
- Sticky Note3 (AI Agent explanation)

**Node Details:**  
- **AI Agent**  
  - Type: LangChain Agent  
  - Role: Processes user queries by invoking external tools to generate helpful responses.  
  - Configuration: System message instructs the agent to create requests using attached HTTP tools.  
  - Inputs: Triggered from Text Classifier on Everything Else classification.  
  - Outputs: Sends results to Summarization Chain.  
  - Edge cases: Tool invocation failures, unexpected input formats.

- **OpenAI Chat Model1**  
  - Type: LangChain OpenAI GPT-4 Chat Model  
  - Role: Provides language model capabilities for the AI Agent.  
  - Configuration: Same GPT-4.1-mini model with default options.  
  - Inputs: Connected as AI language model for AI Agent.  
  - Edge cases: API errors or rate limits.

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window  
  - Role: Maintains conversation history to provide context for the AI Agent.  
  - Inputs: AI Agent’s memory input.  
  - Outputs: Feeds back to AI Agent for contextual awareness.

- **SerpAPI**  
  - Type: LangChain SerpAPI Tool  
  - Role: Provides web search capabilities for AI Agent to fetch real-time information.  
  - Credentials: SerpAPI account configured.  
  - Inputs: Connected as AI tool to AI Agent.  
  - Edge cases: API quota exceeded, network failures.

- **Sticky Note3**  
  - Content: Explains that this block handles all other cases using AI Agent with Web Search API.

---

#### 2.6 Summarization

**Overview:**  
Generates a concise, user-friendly summary of the interaction, including the agent’s action and user query.

**Nodes Involved:**  
- Summarization Chain  
- OpenAI Chat Model3  
- Connections from Create an incident, HTTP Request1, and AI Agent converge here.

**Node Details:**  
- **Summarization Chain**  
  - Type: LangChain Summarization Chain  
  - Role: Creates a concise summary combining agent action and user query.  
  - Configuration:  
    - Uses "stuff" summarization method with a custom prompt incorporating agent action text and original chat input.  
  - Inputs: Receives outputs from Create an incident, HTTP Request1, and AI Agent.  
  - Outputs: Final summarized output for downstream use.  
  - Edge cases: Missing input data, prompt formatting errors.

- **OpenAI Chat Model3**  
  - Type: LangChain OpenAI GPT-4 Chat Model  
  - Role: Provides language model backend for summarization.  
  - Configuration: Same GPT-4.1-mini model with default options.

---

### 3. Summary Table

| Node Name                 | Node Type                        | Functional Role                      | Input Node(s)           | Output Node(s)            | Sticky Note                                                                                                                |
|---------------------------|---------------------------------|------------------------------------|------------------------|---------------------------|----------------------------------------------------------------------------------------------------------------------------|
| When chat message received | LangChain Chat Trigger          | Receive user chat messages          | External webhook       | Text Classifier           |                                                                                                                            |
| OpenAI Chat Model          | LangChain OpenAI Chat Model     | Language model for classification  | When chat message received | Text Classifier         |                                                                                                                            |
| Text Classifier            | LangChain Text Classifier       | Categorize user queries             | OpenAI Chat Model      | Create an incident, HTTP Request1, AI Agent | ## Text Classifier: This will categorize all the user queries in 3 categories: Incident, Request, Everything Else          |
| Create an incident         | ServiceNow                      | Create ServiceNow Incident          | Text Classifier        | Summarization Chain       | ## Create Incident: Using ServiceNow Connector to create an Incident                                                        |
| HTTP Request1              | HTTP Request                   | Submit ServiceNow Service Catalog Request | Text Classifier        | Summarization Chain       | ## Submit a General Request: For Demo Purpose submitting via Service Catalog API https://www.servicenow.com/docs/...         |
| AI Agent                  | LangChain Agent                 | Handle other queries with AI + tools | Text Classifier        | Summarization Chain       | ## Lastly: To handle all other cases. I am using a AI Agent with Web Search API                                             |
| OpenAI Chat Model1         | LangChain OpenAI Chat Model     | Language model for AI Agent         | -                      | AI Agent                  |                                                                                                                            |
| Simple Memory              | LangChain Memory Buffer Window  | Maintain conversation memory        | -                      | AI Agent                  |                                                                                                                            |
| SerpAPI                   | LangChain SerpAPI Tool          | Provide web search tool             | -                      | AI Agent                  |                                                                                                                            |
| Summarization Chain        | LangChain Summarization Chain   | Summarize agent action and query    | Create an incident, HTTP Request1, AI Agent | -                         |                                                                                                                            |
| OpenAI Chat Model3         | LangChain OpenAI Chat Model     | Language model for summarization    | Summarization Chain    | -                         |                                                                                                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add a **LangChain Chat Trigger** node named "When chat message received."  
   - No special parameters. This node listens for incoming chat messages via webhook.

2. **Add OpenAI Chat Model for Classification:**  
   - Add **LangChain OpenAI Chat Model** node named "OpenAI Chat Model."  
   - Set model to "gpt-4.1-mini."  
   - Connect credential: OpenAI API with valid key.  
   - Connect output of "When chat message received" to this node’s input.

3. **Add Text Classifier Node:**  
   - Add **LangChain Text Classifier** node named "Text Classifier."  
   - Set system prompt: "Please classify the text provided by the user into one of the following categories: Incident, Request, Everything Else, and output JSON only."  
   - Input text: expression `={{ $json.chatInput }}` (from trigger).  
   - Enable auto-fixing to correct output formatting.  
   - Connect output of "OpenAI Chat Model" to this node input.

4. **Create Incident Node:**  
   - Add **ServiceNow** node named "Create an incident."  
   - Set resource to "incident," operation to "create."  
   - Set short description to `={{ $('When chat message received').item.json.chatInput }}`.  
   - Connect ServiceNow Basic Auth credentials.  
   - Connect the "Incident" output from "Text Classifier" to this node.

5. **Create HTTP Request Node for Service Catalog:**  
   - Add **HTTP Request** node named "HTTP Request1."  
   - Set URL to ServiceNow Service Catalog API endpoint:  
     `https://<your_instance>.service-now.com/api/sn_sc/servicecatalog/items/a4cc1293939362504311f6fa3d03d698/order_now` (replace with actual instance).  
   - Method: POST.  
   - Headers: Accept: application/json.  
   - Body (JSON):  
     ```json
     {
       "sysparm_quantity": 1,
       "variables": {
         "description": "{{ $('When chat message received').item.json.chatInput }}"
       }
     }
     ```  
   - Authentication: ServiceNow Basic Auth credentials.  
   - Connect the "Request" output from "Text Classifier" to this node.

6. **Create AI Agent Node:**  
   - Add **LangChain Agent** node named "AI Agent."  
   - Set system message: "You are a helpful assistant who creates requests based on the user query using the attached HTTP tool."  
   - Connect the "Everything Else" output from "Text Classifier" to this node.

7. **Add OpenAI Chat Model for AI Agent:**  
   - Add **LangChain OpenAI Chat Model** named "OpenAI Chat Model1."  
   - Model: "gpt-4.1-mini."  
   - Connect OpenAI API credentials.  
   - Connect this node as the language model input to the "AI Agent."

8. **Add Simple Memory Node:**  
   - Add **LangChain Memory Buffer Window** node named "Simple Memory."  
   - Connect its output as AI memory input for "AI Agent."

9. **Add SerpAPI Node:**  
   - Add **LangChain SerpAPI Tool** node named "SerpAPI."  
   - Connect SerpAPI credentials.  
   - Connect its output as AI tool input for "AI Agent."

10. **Add Summarization Chain Node:**  
    - Add **LangChain Summarization Chain** node named "Summarization Chain."  
    - Set summarization method to "stuff."  
    - Prompt:  
      ```
      Write a user friendly summary of the following:

      Agent Action"{text}" 
      User Query"{{ $('When chat message received').item.json.chatInput }}"

      CONCISE SUMMARY:
      ```  
    - Connect outputs of "Create an incident," "HTTP Request1," and "AI Agent" nodes to this summarization node.

11. **Add OpenAI Chat Model for Summarization:**  
    - Add **LangChain OpenAI Chat Model** node named "OpenAI Chat Model3."  
    - Model: "gpt-4.1-mini."  
    - Connect OpenAI API credentials.  
    - Connect this node as the language model input for the "Summarization Chain."

---

### 5. General Notes & Resources

| Note Content                                                                                                            | Context or Link                                                                                              |
|-------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Text Classifier categorizes queries into Incident, Request, or Everything Else.                                           | Embedded in Sticky Note near Text Classifier node.                                                          |
| Incident creation uses ServiceNow Connector to create incidents.                                                         | Sticky Note near Create an incident node.                                                                    |
| Request submission demo uses ServiceNow Service Catalog API.                                                             | https://www.servicenow.com/docs/bundle/zurich-api-reference/page/integrate/inbound-rest/concept/c_ServiceCatalogAPI.html#title_servicecat-POST-cart-sub_order |
| AI Agent block uses GPT-4 with web search via SerpAPI for knowledge queries.                                             | Sticky Note near AI Agent node.                                                                              |
| ServiceNow credentials require Basic Authentication with appropriate permissions for incident creation and service requests. | Credential configuration critical for API access.                                                           |
| OpenAI API keys must have access to GPT-4 models; watch for rate limits and quota.                                        |                                                                                                             |
| SerpAPI account must be active and quota sufficient for web search integration.                                           |                                                                                                             |

---

**Disclaimer:** The provided text is exclusively derived from an n8n workflow automation. It complies strictly with content policies and contains no illegal, offensive, or protected material. All data processed is legal and publicly accessible.

---