Automate Support Ticket Classification & Routing from HubSpot to Jira with GPT

https://n8nworkflows.xyz/workflows/automate-support-ticket-classification---routing-from-hubspot-to-jira-with-gpt-7981


# Automate Support Ticket Classification & Routing from HubSpot to Jira with GPT

### 1. Workflow Overview

This workflow automates the classification and routing of customer support tickets by integrating HubSpot CRM ticket data with Jira issue tracking, augmented by advanced AI analysis using GPT (OpenAI). Its primary use case is to streamline customer support operations by automatically analyzing incoming support tickets, profiling customer history, detecting sentiment and risk, classifying ticket topics, and finally creating appropriately categorized Jira issues assigned to relevant teams.

The workflow is logically divided into the following blocks:

- **1.1 Data Retrieval from HubSpot:** Pulls tickets and associated contact data from HubSpot.
- **1.2 Variable Preparation:** Prepares message content and agent instructions for AI processing.
- **1.3 AI Agents and Orchestration:** Executes specialized AI agents (Sentinel, Profiler) and an Orchestrator agent to analyze the ticket content, classify risk, intent, and customer profile.
- **1.4 Classification and Ticket Title Generation:** Classifies the ticket into categories and generates a concise ticket title.
- **1.5 Jira Issue Creation:** Creates a Jira issue based on the AI outputs, assigning it to the correct project and assignee.
- **1.6 Routing Logic:** Routes workflow execution between Sentinel and Profiler agents based on workflow inputs.
- **1.7 Triggers and Scheduling:** Supports manual and scheduled triggers for running the workflow.
- **1.8 Auxiliary Nodes:** Sticky notes for documentation and a hubspotTool node to fetch detailed CRM data during profiling.

---

### 2. Block-by-Block Analysis

#### 2.1 Data Retrieval from HubSpot

**Overview:**  
This block retrieves multiple support tickets from HubSpot, including key ticket properties and associated contact emails, then searches for related contact records in HubSpot.

**Nodes Involved:**  
- Get many tickets  
- Search contacts

**Node Details:**  

- **Get many tickets**  
  - *Type:* HubSpot node (resource: ticket, operation: getAll)  
  - *Config:* Retrieves all tickets with properties: content, createdate, conversation mentions, pipeline stage, subject, created by user, and associated contact emails. Authenticated via OAuth2.  
  - *Inputs:* Trigger nodes ("For testing" or "Set the running interval")  
  - *Outputs:* JSON with ticket data passed to "Search contacts".  
  - *Failure cases:* API rate limiting, OAuth token expiration, missing properties.  
   
- **Search contacts**  
  - *Type:* HubSpot node (operation: search)  
  - *Config:* Searches contacts by matching email addresses extracted from tickets. Uses OAuth2 authentication.  
  - *Inputs:* Output of "Get many tickets"  
  - *Outputs:* Contact record(s) JSON for downstream processing.  
  - *Failure cases:* No matching contact found, API errors.

#### 2.2 Variable Preparation

**Overview:**  
Sets up variables containing the message text and agent instructions for the AI agents.

**Nodes Involved:**  
- Set the variables

**Node Details:**  

- **Set the variables**  
  - *Type:* Set node  
  - *Config:* Assigns variables:  
    - `message`: Concatenates ticket subject and content  
    - `agents`: Describes stepwise AI agent workflow logic  
    - `agent`: Provides detailed instructions for Sentinel, Profiler, Classifier, and Summarizer agents including expected output variables (`class`, `risk`, `text`).  
  - *Inputs:* Output from "Search contacts"  
  - *Outputs:* Prepared variables fed into "Sentinel" and "Profiler" tool workflows.  
  - *Failure cases:* Missing or malformed input data causing expressions to fail.

#### 2.3 AI Agents and Orchestration

**Overview:**  
Runs specialized AI agents — Sentinel (risk, intent, tone detection), Profiler (customer profile enrichment), and an Orchestrator that coordinates these tools to produce a comprehensive analysis of each ticket.

**Nodes Involved:**  
- Sentinel (toolWorkflow)  
- Profiler (toolWorkflow)  
- Sentinel_agent (agent)  
- Profiler_agent (agent)  
- Orchestrator (agent)  
- Structured Output Parser

**Node Details:**  

- **Sentinel**  
  - *Type:* LangChain toolWorkflow node  
  - *Config:* Calls a sub-workflow identified by current workflow ID (recursive), passing the ticket message for churn risk, intent, and emotional tone detection.  
  - *Inputs:* Variables from "Set the variables"  
  - *Outputs:* JSON with risk assessment and tone analysis.  
  - *Failure cases:* Sub-workflow errors, API timeout, unexpected null inputs.

- **Profiler**  
  - *Type:* LangChain toolWorkflow node  
  - *Config:* Calls sub-workflow with userId from contact search to retrieve past customer interactions and profile data.  
  - *Inputs:* userId from "Search contacts"  
  - *Outputs:* Customer profile data for Orchestrator.  
  - *Failure cases:* Invalid userId, HubSpot API errors.

- **Sentinel_agent**  
  - *Type:* LangChain agent node  
  - *Config:* Uses AI to analyze incoming messages specifically for churn risk and emotional tone, with instructions to notify customers if alerts arise.  
  - *Inputs:* Routed from "Router" node when route is "Sentinel"  
  - *Outputs:* Analysis data for Orchestrator.  
  - *Failure cases:* Model errors, prompt failures.

- **Profiler_agent**  
  - *Type:* LangChain agent node  
  - *Config:* AI agent tasked with retrieving and analyzing historical CRM interactions for the userId.  
  - *Inputs:* Routed from "Router" node when route is "Profiler"  
  - *Outputs:* Profile data for Orchestrator.  
  - *Failure cases:* Data retrieval issues, API failures.

- **Orchestrator**  
  - *Type:* LangChain agent node with output parser  
  - *Config:* Central AI agent coordinating results from Sentinel and Profiler, adapting response to customer context and sentiment. It includes detailed SOP instructions and examples.  
  - *Inputs:* AI tool data from Sentinel and Profiler nodes  
  - *Outputs:* Summarized analysis text for ticket classification and Jira creation  
  - *Failure cases:* AI chain failures, inconsistent inputs, timeout, or parsing errors.

- **Structured Output Parser**  
  - *Type:* LangChain structured output parser  
  - *Config:* Defines expected JSON schema for AI outputs (e.g., risk level and text) to ensure structured data is passed forward.  
  - *Inputs:* Orchestrator outputs  
  - *Outputs:* Parsed JSON for downstream use  
  - *Failure cases:* Malformed AI output, schema mismatches.

#### 2.4 Classification and Ticket Title Generation

**Overview:**  
Generates a concise ticket title summarizing AI output, then classifies the ticket into predefined categories to determine routing.

**Nodes Involved:**  
- generate ticket title  
- Cateogory Classifier

**Node Details:**  

- **generate ticket title**  
  - *Type:* LangChain summarization chain  
  - *Config:* Uses chunking and summarization prompts to create a short, concise title from the Orchestrator’s text output.  
  - *Inputs:* Orchestrator AI output text  
  - *Outputs:* Summarized ticket title for Jira issue  
  - *Failure cases:* Large input size causing chunking errors, model timeout.

- **Cateogory Classifier**  
  - *Type:* LangChain text classifier  
  - *Config:* Classifies ticket text into categories: invoicing, technical, commercial, fulfillment. Outputs JSON only with no explanation.  
  - *Inputs:* Text from "Orchestrator" or "generate ticket title" node  
  - *Outputs:* Classification JSON used to route tickets in Jira  
  - *Failure cases:* Ambiguous classification, model errors.

#### 2.5 Jira Issue Creation

**Overview:**  
Creates a Jira issue using the ticket title and classification, assigning it to a specified Jira project and user.

**Nodes Involved:**  
- Create an issue in Jira

**Node Details:**  

- **Create an issue in Jira**  
  - *Type:* Jira node (create issue)  
  - *Config:* Uses Jira Software Cloud credentials to create an Epic issue in project ID 10001, with assignee set to a specific user (Thomas Vie). The issue summary is the generated ticket title, and the description is the Orchestrator’s text output.  
  - *Inputs:* Classification output from "Cateogory Classifier"  
  - *Outputs:* Created Jira issue confirmation JSON  
  - *Failure cases:* Jira API errors, permission failures, invalid project or assignee IDs.

#### 2.6 Routing Logic

**Overview:**  
Routes workflow execution based on the “route” value in input JSON to either Sentinel or Profiler agents.

**Nodes Involved:**  
- Router

**Node Details:**  

- **Router**  
  - *Type:* Switch node  
  - *Config:* Routes based on `route` property in input JSON; routes "Sentinel" to Sentinel_agent and "Profiler" to Profiler_agent.  
  - *Inputs:* Triggered by external workflow execution node  
  - *Outputs:* Routes to respective AI agent nodes  
  - *Failure cases:* Missing or invalid route property.

#### 2.7 Triggers and Scheduling

**Overview:**  
Supports manual and scheduled triggering of the workflow for batch processing or testing purposes.

**Nodes Involved:**  
- For testing (manual trigger)  
- Set the running interval (schedule trigger)  
- When Executed by Another Workflow (execute workflow trigger)

**Node Details:**  

- **For testing**  
  - *Type:* Manual trigger node  
  - *Config:* Allows manual start of the workflow for testing.  
  - *Outputs:* Starts the chain with "Get many tickets".  

- **Set the running interval**  
  - *Type:* Schedule trigger  
  - *Config:* Runs the ticket retrieval process at defined intervals (default every minute/hour based on empty interval config).  
  - *Outputs:* Triggers "Get many tickets" periodically.  

- **When Executed by Another Workflow**  
  - *Type:* Execute workflow trigger  
  - *Config:* Accepts workflow inputs `route`, `userId`, and `text` to route processing to either Sentinel or Profiler agents.  
  - *Outputs:* Feeds into "Router" node.  

#### 2.8 Auxiliary Nodes (Sticky Notes and Sub-workflow Calls)

**Overview:**  
Sticky notes provide in-editor documentation of workflow parts. The "from_crm" node fetches detailed CRM contact data used by the Profiler agent.

**Nodes Involved:**  
- Sticky Note, Sticky Note1, Sticky Note2, Sticky Note3, Sticky Note6  
- from_crm

**Node Details:**  

- **from_crm**  
  - *Type:* HubSpot Tool node  
  - *Config:* Fetches detailed contact properties (buying role, visitor email, notes count, email) for profiling, using userId input from "When Executed by Another Workflow".  
  - *Inputs:* userId JSON parameter  
  - *Outputs:* Detailed contact info JSON for Profiler_agent.  
  - *Failure cases:* Invalid userId, API errors.

- **Sticky Notes**  
  - Provide structured comments on sub-workflows (agents), ticket routing, ticket generation, HubSpot integration, and contact info for assistance.

---

### 3. Summary Table

| Node Name                 | Node Type                          | Functional Role                      | Input Node(s)                      | Output Node(s)                   | Sticky Note                                                                                                                  |
|---------------------------|----------------------------------|------------------------------------|----------------------------------|---------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| For testing               | Manual Trigger                   | Manual start trigger                | -                                | Get many tickets                 |                                                                                                                              |
| Set the running interval  | Schedule Trigger                 | Scheduled start trigger             | -                                | Get many tickets                 |                                                                                                                              |
| Get many tickets          | HubSpot                         | Retrieve tickets from HubSpot       | For testing, Set the running interval | Search contacts           | ## Get tickets from Hubspot<br>Set here your CRM retrieving system                                                           |
| Search contacts           | HubSpot                         | Search contacts by email            | Get many tickets                 | Set the variables               |                                                                                                                              |
| Set the variables         | Set                             | Prepare message and agent instructions | Search contacts                 | Sentinel, Profiler, Orchestrator |                                                                                                                              |
| Router                    | Switch                         | Route to Sentinel or Profiler agent | When Executed by Another Workflow | Sentinel_agent, Profiler_agent  |                                                                                                                              |
| Sentinel                  | LangChain toolWorkflow          | Detect churn risk, intent, tone    | Set the variables                | Orchestrator                   |                                                                                                                              |
| Profiler                  | LangChain toolWorkflow          | Retrieve and analyze customer profile | Set the variables              | Orchestrator                   |                                                                                                                              |
| Sentinel_agent            | LangChain agent                 | AI agent for churn and tone analysis | Router                        | Orchestrator                   | ## Sub-worflows for agents<br>Here you can add any agent that you need                                                        |
| Profiler_agent            | LangChain agent                 | AI agent for profiling CRM data    | Router                         | Orchestrator                   | ## Sub-worflows for agents<br>Here you can add any agent that you need                                                        |
| Orchestrator              | LangChain agent                 | Central AI coordinator of insights | Sentinel, Profiler             | generate ticket title           |                                                                                                                              |
| Structured Output Parser  | LangChain output parser         | Parse AI outputs into structured JSON | Orchestrator                  | Orchestrator (parsed data)     |                                                                                                                              |
| generate ticket title     | LangChain chainSummarization    | Summarizes ticket title             | Orchestrator                   | Cateogory Classifier           | ## Ticket generation<br>Modify the prompt to suit your needs                                                                 |
| Cateogory Classifier      | LangChain textClassifier        | Classify ticket category            | generate ticket title           | Create an issue in Jira         | ## Ticket router<br>Set here the responsible team for each category output                                                   |
| Create an issue in Jira   | Jira                           | Create Jira issue with ticket info | Cateogory Classifier           | -                              |                                                                                                                              |
| When Executed by Another Workflow | Execute Workflow Trigger   | Trigger routing based on input      | -                              | Router                        |                                                                                                                              |
| from_crm                  | HubSpot Tool                    | Fetch detailed contact properties   | When Executed by Another Workflow | Profiler_agent                |                                                                                                                              |
| Sticky Note               | Sticky Note                    | Documentation                      | -                              | -                             | ## Sub-worflows for agents<br>Here you can add any agent that you need                                                        |
| Sticky Note1              | Sticky Note                    | Documentation                      | -                              | -                             | ## Ticket router<br>Set here the responsible team for each category output                                                   |
| Sticky Note2              | Sticky Note                    | Documentation                      | -                              | -                             | ## Ticket generation<br>Modify the prompt to suit your needs                                                                 |
| Sticky Note3              | Sticky Note                    | Documentation                      | -                              | -                             | ## Get tickets from Hubspot<br>Set here your CRM retrieving system                                                           |
| Sticky Note6              | Sticky Note                    | Documentation                      | -                              | -                             | ## Contact me<br>### If you need some help with this workflow: Write to me: [thomas@pollup.net](mailto:thomas@pollup.net)      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node** named "For testing" for manual workflow start.

2. **Create a Schedule Trigger node** named "Set the running interval" with a default interval (e.g., every 1 hour or as needed).

3. **Add a HubSpot node** named "Get many tickets":  
   - Resource: Ticket  
   - Operation: Get All  
   - OAuth2 authentication (configure HubSpot OAuth2 credentials)  
   - Properties to retrieve: content, createdate, hs_all_conversation_mentions, hs_pipeline_stage, subject, hs_created_by_user_id, hs_all_associated_contact_emails  
   - Connect triggers ("For testing" and "Set the running interval") to this node.

4. **Add another HubSpot node** named "Search contacts":  
   - Operation: Search  
   - OAuth2 authentication  
   - Filter by email property with value set from the associated contact emails of the ticket (expression referencing "Get many tickets")  
   - Connect output of "Get many tickets" to this node.

5. **Add a Set node** named "Set the variables":  
   - Assign:  
     - `message`: concatenate ticket subject and content from "Get many tickets"  
     - `agents`: multi-line string describing the agent workflow steps (Sentinel, Profiler, Content Manager, Guide, Messenger, Facilitator)  
     - `agent`: multi-line instructions for AI agents (Sentinel, Profiler, Classifier, Summarizer) with expected output variables `class`, `risk`, `text`  
   - Connect output of "Search contacts" to this node.

6. **Add a Switch node** named "Router":  
   - Define rules based on JSON property `route` with values "Sentinel" and "Profiler"  
   - Connect output of "When Executed by Another Workflow" node (Execute Workflow Trigger) to this node.

7. **Add LangChain toolWorkflow nodes** named "Sentinel" and "Profiler":  
   - Both call sub-workflows (use current workflow ID)  
   - Map inputs:  
     - Sentinel: pass `text` from "Set the variables", route as "Sentinel"  
     - Profiler: pass `userId` from "Search contacts", route as "Profiler"  
   - Connect output of "Set the variables" to both nodes.

8. **Add LangChain agent nodes** named "Sentinel_agent" and "Profiler_agent":  
   - Sentinel_agent prompt: AI to detect churn risk, intent, emotional tone; immediate action if risk detected  
   - Profiler_agent prompt: AI to retrieve and analyze CRM user interactions  
   - Connect outputs of "Router" to respective agent nodes.

9. **Add a HubSpot Tool node** named "from_crm":  
   - Operation: Get contact details by userId (input from "When Executed by Another Workflow")  
   - Properties: hs_buying_role, hs_conversations_visitor_email, num_contacted_notes, email  
   - Connect output to "Profiler_agent" as AI tool input.

10. **Add an Orchestrator LangChain agent node** named "Orchestrator":  
    - Prompt: Detailed instructions to orchestrate Sentinel and Profiler outputs for customer success automation  
    - Use current date/time variable  
    - Enable output parser  
    - Connect AI tool outputs from "Sentinel" and "Profiler" nodes to "Orchestrator".

11. **Add a LangChain structured output parser node** named "Structured Output Parser":  
    - Define JSON schema example with `risk` and `text` fields  
    - Connect output from "Orchestrator" to this parser.

12. **Add a LangChain chainSummarization node** named "generate ticket title":  
    - Configure summarization prompts to generate concise ticket title from Orchestrator’s output text  
    - Use chunkSize 200 and overlap 20  
    - Connect output from "Orchestrator" to this node.

13. **Add a LangChain textClassifier node** named "Cateogory Classifier":  
    - System prompt: classify text into categories (invoicing, technical, commercial, fulfillment) with JSON-only output  
    - Input text: from "Orchestrator" output text  
    - Connect output from "generate ticket title" to this node.

14. **Add a Jira node** named "Create an issue in Jira":  
    - Operation: Create Issue  
    - Project: ID 10001 (set your Jira project)  
    - Issue Type: Epic (ID 10011)  
    - Assignee: user ID corresponding to Thomas Vie (or your assignee)  
    - Summary: use ticket title from "Cateogory Classifier" output or "generate ticket title" output  
    - Description: use detailed text from "Orchestrator" output  
    - Connect output from "Cateogory Classifier" to this node.

15. **Add an Execute Workflow Trigger** node named "When Executed by Another Workflow":  
    - Define inputs: route, userId, text  
    - Connect output to "Router".

16. **Add Sticky Note nodes** at appropriate places to document the workflow sections as in the original workflow.

17. **Configure credentials:**  
    - HubSpot OAuth2 with appropriate scopes for ticket and contact access  
    - OpenAI API key for GPT-4o model access  
    - Jira Software Cloud API credentials with permissions to create issues and assign users.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                          |
|-------------------------------------------------------------------------------------------------|---------------------------------------------------------|
| Contact me if you need help with this workflow: Write to me: [thomas@pollup.net](mailto:thomas@pollup.net) | Author support contact                                   |
| The workflow uses GPT-4o model via OpenAI for advanced AI analysis and classification.           | Model selection detail                                   |
| The workflow is designed for autonomous ticket classification and routing without human intervention. | Operational note                                         |
| Sticky notes in the workflow provide documentation and guidance on agents, routing, and ticket generation. | In-editor documentation                                 |
| Jira project and assignee IDs must be customized to your environment.                            | Customization requirement                                |
| HubSpot OAuth2 authentication requires appropriate API scopes for tickets and contacts.         | Integration requirement                                 |
| The workflow includes recursive sub-workflow calls for AI agents managed within the same workflow ID. | Advanced workflow design                                 |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.