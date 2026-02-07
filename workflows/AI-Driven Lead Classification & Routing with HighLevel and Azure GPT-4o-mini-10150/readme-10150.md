AI-Driven Lead Classification & Routing with HighLevel and Azure GPT-4o-mini

https://n8nworkflows.xyz/workflows/ai-driven-lead-classification---routing-with-highlevel-and-azure-gpt-4o-mini-10150


# AI-Driven Lead Classification & Routing with HighLevel and Azure GPT-4o-mini

### 1. Workflow Overview

This workflow automates intelligent lead classification and routing using AI, integrating HighLevel CRM and Azure OpenAI GPT-4o-mini. It targets sales and support teams by automatically fetching leads, enriching them with contact details, analyzing their intent via AI, and routing them to the appropriate department via email.

Logical blocks:

- **1.1 Input Reception & Initialization:** Manual trigger to start the workflow.
- **1.2 Data Collection:** Fetch opportunities from HighLevel CRM and retrieve detailed contact information.
- **1.3 AI Processing:** Use Azure GPT-4o-mini to analyze lead notes/messages and classify intent.
- **1.4 Post-Processing:** Process AI output into a format suitable for routing decisions.
- **1.5 Routing Logic:** Conditionally route leads by sending emails to Demo, Support, or Partnership teams.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Initialization

- **Overview:**  
  Manual trigger node initiates the workflow execution on demand.

- **Nodes involved:**  
  - When clicking ‘Execute workflow’

- **Node details:**  
  - Type: Manual Trigger  
  - Configuration: Default manual trigger, no parameters set  
  - Inputs: None  
  - Outputs: Starts the workflow and passes control to next node  
  - Edge cases: Workflow only runs on manual execution; no automated triggers  
  - Version: v1

---

#### 1.2 Data Collection

- **Overview:**  
  Fetch all lead opportunities from HighLevel CRM, then enrich each with detailed contact info to prepare for AI analysis.

- **Nodes involved:**  
  - Fetch All Opportunities  
  - Fetch Contact Details

- **Node details:**  
  - **Fetch All Opportunities**  
    - Type: HighLevel CRM node (resource: opportunity, operation: getAll)  
    - Configuration: Retrieves all opportunities without filters, returns all results  
    - Credentials: HighLevel OAuth2 API  
    - Inputs: Trigger node output  
    - Outputs: List of opportunities with basic info including contactId  
    - Edge cases: API rate limits, authentication failure, empty opportunity list  

  - **Fetch Contact Details**  
    - Type: HighLevel CRM node (resource: contact, operation: get)  
    - Configuration: Uses contactId from each opportunity to fetch full contact details  
    - Credentials: HighLevel OAuth2 API  
    - Inputs: Output items from Fetch All Opportunities  
    - Outputs: Enriched lead records including name, email, notes  
    - Edge cases: Missing contactId, contact not found, API errors

---

#### 1.3 AI Processing

- **Overview:**  
  AI agent uses Azure OpenAI GPT-4o-mini to analyze enriched lead notes/messages to identify lead intent (Demo, Support, Partnership).

- **Nodes involved:**  
  - AI Lead Classifier Agent  
  - Azure OpenAI GPT-4o-mini

- **Node details:**  
  - **AI Lead Classifier Agent**  
    - Type: LangChain AI Agent node  
    - Configuration: Uses prompt “You are an AI lead router. Suggest the scope of lead” to classify lead intent  
    - Inputs: Enriched contact data from previous node  
    - Outputs: AI classification results in JSON format under `choices[0].message.content`  
    - Version: 2.2  
    - Edge cases: AI model timeout, malformed response, network issues, prompt misinterpretation  
    - Note: This node drives AI logic and depends on underlying language model node.

  - **Azure OpenAI GPT-4o-mini**  
    - Type: LangChain Azure OpenAI LLM node  
    - Configuration: Model set to “gpt-4o-mini” with default options  
    - Credentials: Azure OpenAI API  
    - Inputs: Invoked by AI Lead Classifier Agent as language model backend  
    - Outputs: AI-generated classification text  
    - Edge cases: API limits, authentication failures, model errors

---

#### 1.4 Post-Processing

- **Overview:**  
  JavaScript node processes raw AI output to prepare data structure for conditional routing decisions.

- **Nodes involved:**  
  - Process AI Response

- **Node details:**  
  - Type: Code (JavaScript) node  
  - Configuration: Adds a new field `myNewField` set to 1 for each item (placeholder logic)  
  - Inputs: AI classification output from AI Lead Classifier Agent  
  - Outputs: Augmented data passed to routing conditions  
  - Edge cases: Expression errors if AI response missing or malformed  
  - Note: Logic is simplistic; recommended to update this node to parse AI JSON output precisely for routing

---

#### 1.5 Routing Logic

- **Overview:**  
  Conditional branching routes leads based on AI classification into three categories: Demo Requests, Support Queries, and Partnership Inquiries. Each category triggers an email to the corresponding team.

- **Nodes involved:**  
  - Check: Demo Request?  
  - Route to Demo Team  
  - Check: Support Query?  
  - Route to Support Team  
  - Check: Partnership Inquiry?  
  - Route to Partnership Team

- **Node details:**  

  - **Check: Demo Request?**  
    - Type: If node  
    - Condition: Checks if AI response string contains “Demo”  
    - Inputs: Process AI Response output  
    - Outputs: Yes → Route to Demo Team  

  - **Route to Demo Team**  
    - Type: Email Send  
    - Configuration: Sends email with lead details to demo@company.com, from noreply@company.com  
    - Credentials: SMTP credentials required  
    - Inputs: Output from Check: Demo Request? node  
    - Edge cases: SMTP failure, invalid email addresses  

  - **Check: Support Query?**  
    - Type: If node  
    - Condition: Checks if AI response string contains “Support”  
    - Inputs: Process AI Response output  
    - Outputs: Yes → Route to Support Team  

  - **Route to Support Team**  
    - Type: Email Send  
    - Configuration: Sends email with lead details to support@company.com, from noreply@company.com  
    - Credentials: SMTP credentials required  
    - Inputs: Output from Check: Support Query? node  

  - **Check: Partnership Inquiry?**  
    - Type: If node  
    - Condition: Checks if AI response string contains “Partnership”  
    - Inputs: Process AI Response output  
    - Outputs: Yes → Route to Partnership Team  

  - **Route to Partnership Team**  
    - Type: Email Send  
    - Configuration: Sends email with lead details to partnership@company.com, from noreply@company.com  
    - Credentials: SMTP credentials required  
    - Inputs: Output from Check: Partnership Inquiry? node  

  - Edge cases across routing: No matching category (lead not routed), email send failures, incomplete contact info

---

### 3. Summary Table

| Node Name                | Node Type                      | Functional Role              | Input Node(s)                | Output Node(s)                          | Sticky Note                                                                                                         |
|--------------------------|--------------------------------|-----------------------------|-----------------------------|---------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger               | Workflow start trigger      | None                        | Fetch All Opportunities               | 🤖 AI-POWERED LEAD ROUTING WORKFLOW: Overview of the workflow including trigger and AI model used                   |
| Sticky Note - Workflow Overview | Sticky Note                 | Documentation note          | None                        | None                                  | 🤖 AI-POWERED LEAD ROUTING WORKFLOW: Summary of main workflow steps                                                |
| Fetch All Opportunities   | HighLevel CRM node             | Fetch all lead opportunities| When clicking ‘Execute workflow’ | Fetch Contact Details                 | 📥 DATA COLLECTION PHASE: Fetch opportunities from HighLevel CRM                                                   |
| Sticky Note - Data Collection | Sticky Note                 | Documentation note          | None                        | None                                  | 📥 DATA COLLECTION PHASE: Explains fetching and enriching lead data                                                |
| Fetch Contact Details     | HighLevel CRM node             | Fetch detailed contact info | Fetch All Opportunities      | AI Lead Classifier Agent              | 📥 DATA COLLECTION PHASE: Detailed contact enrichment                                                              |
| AI Lead Classifier Agent  | LangChain AI Agent             | AI-based lead classification| Fetch Contact Details        | Process AI Response                   | 🧠 AI ANALYSIS PHASE: AI agent analyzes lead intent using Azure GPT-4o-mini                                         |
| Azure OpenAI GPT-4o-mini  | LangChain Azure OpenAI LLM    | AI language model backend   | AI Lead Classifier Agent     | AI Lead Classifier Agent (callback)  | 🧠 AI ANALYSIS PHASE: GPT-4o-mini model processes contact data                                                     |
| Sticky Note - AI Analysis | Sticky Note                   | Documentation note          | None                        | None                                  | 🧠 AI ANALYSIS PHASE: Describes AI processing and prompt                                                            |
| Process AI Response       | Code (JavaScript)              | Process AI output for routing| AI Lead Classifier Agent     | Check: Demo Request?, Check: Support Query?, Check: Partnership Inquiry? | ⚙️ POST-PROCESSING: Explains need to transform AI response for routing logic                                       |
| Sticky Note - Processing  | Sticky Note                   | Documentation note          | None                        | None                                  | ⚙️ POST-PROCESSING: Describes role of JavaScript node                                                             |
| Check: Demo Request?      | If                            | Condition for Demo leads    | Process AI Response          | Route to Demo Team                    | 🔀 INTELLIGENT ROUTING: Details routing destinations based on AI output                                            |
| Route to Demo Team        | Email Send                    | Email Demo leads            | Check: Demo Request?         | None                                  | 🔀 INTELLIGENT ROUTING: Email details for Demo team                                                                |
| Check: Support Query?     | If                            | Condition for Support leads | Process AI Response          | Route to Support Team                 | 🔀 INTELLIGENT ROUTING: Email routing for Support team                                                             |
| Route to Support Team     | Email Send                    | Email Support leads         | Check: Support Query?        | None                                  | 🔀 INTELLIGENT ROUTING: Email details for Support team                                                             |
| Check: Partnership Inquiry?| If                           | Condition for Partnership leads | Process AI Response          | Route to Partnership Team             | 🔀 INTELLIGENT ROUTING: Email routing for Partnership team                                                         |
| Route to Partnership Team | Email Send                    | Email Partnership leads     | Check: Partnership Inquiry?  | None                                  | 🔀 INTELLIGENT ROUTING: Email details for Partnership team                                                         |
| Sticky Note - Routing Logic| Sticky Note                   | Documentation note          | None                        | None                                  | 🔀 INTELLIGENT ROUTING: Overview of routing logic and email recipients                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Start workflow on demand  

2. **Add HighLevel Node - Fetch All Opportunities**  
   - Type: HighLevel CRM node  
   - Resource: opportunity  
   - Operation: getAll  
   - Return All: true  
   - Credentials: Configure HighLevel OAuth2 API with valid account  
   - Connect: Manual Trigger node → Fetch All Opportunities  

3. **Add HighLevel Node - Fetch Contact Details**  
   - Type: HighLevel CRM node  
   - Resource: contact  
   - Operation: get  
   - Contact ID: Expression `{{$json["contactId"]}}` from each opportunity  
   - Credentials: Same HighLevel OAuth2 API  
   - Connect: Fetch All Opportunities → Fetch Contact Details  

4. **Add LangChain AI Agent Node - AI Lead Classifier Agent**  
   - Type: LangChain AI Agent  
   - Prompt: “You are an AI lead router. Suggest the scope of lead”  
   - Prompt Type: define  
   - Connect: Fetch Contact Details → AI Lead Classifier Agent  

5. **Add LangChain Azure OpenAI LLM Node - Azure OpenAI GPT-4o-mini**  
   - Type: LangChain Azure OpenAI LLM  
   - Model: gpt-4o-mini  
   - Credentials: Azure OpenAI API with valid key and endpoint  
   - Connect: AI Lead Classifier Agent (as language model backend)  

6. **Add Code Node - Process AI Response**  
   - Type: Code (JavaScript)  
   - Code: Placeholder to add a field or parse AI output; recommended to implement parsing AI JSON content to extract classification  
   - Connect: AI Lead Classifier Agent → Process AI Response  

7. **Add If Nodes for Routing Conditions:**  
   - Create three If nodes with conditions on AI response content (expression on `{{$json["choices"][0]["message"]["content"]}}`):  
     - Check: Demo Request? (contains “Demo”)  
     - Check: Support Query? (contains “Support”)  
     - Check: Partnership Inquiry? (contains “Partnership”)  
   - Connect: Process AI Response → each If node  

8. **Add Email Send Nodes for Each Route:**  
   - Route to Demo Team  
     - To: demo@company.com  
     - From: noreply@company.com  
     - Subject: “New Demo Request Lead”  
     - Text: Include contact firstName, lastName, email, notes from JSON  
     - Credentials: Setup SMTP credentials  
     - Connect: Check: Demo Request? → Route to Demo Team  

   - Route to Support Team  
     - To: support@company.com  
     - Subject: “New Support Query Lead”  
     - Connect: Check: Support Query? → Route to Support Team  

   - Route to Partnership Team  
     - To: partnership@company.com  
     - Subject: “New Partnership Lead”  
     - Connect: Check: Partnership Inquiry? → Route to Partnership Team  

9. **Validate Connections and Credentials:**  
   - Ensure HighLevel API OAuth2 credentials are configured and valid  
   - Ensure Azure OpenAI API credentials are configured and valid  
   - Configure SMTP credentials for sending emails  

10. **Test Workflow:**  
    - Trigger manually and verify each stage: data fetching, AI classification, routing emails  

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The AI model used is Azure OpenAI GPT-4o-mini, a lightweight GPT-4 variant optimized for cost/performance tradeoffs. | Azure OpenAI documentation: https://learn.microsoft.com/en-us/azure/cognitive-services/openai/ |
| SMTP credentials must be properly configured with an authorized email provider to send emails.    | Typical providers: SendGrid, Gmail (OAuth2), SMTP2GO                                                |
| The AI prompt ("You are an AI lead router. Suggest the scope of lead") can be customized to improve classification accuracy. | Experiment with prompt engineering to refine lead intent detection                              |
| The post-processing JavaScript node currently uses placeholder logic; it should be updated to parse AI JSON responses reliably. | See LangChain response formats and n8n JavaScript node examples                                |
| Workflow is triggered manually; integration with scheduled or webhook triggers can automate lead processing further. | n8n triggers docs: https://docs.n8n.io/nodes/n8n-nodes-base.manualTrigger/                      |

---

**Disclaimer:**  
The provided text is exclusively generated from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.