AI-Powered Customer Feedback Analysis & Routing for Gmail, Zendesk, Slack & Pipedrive

https://n8nworkflows.xyz/workflows/ai-powered-customer-feedback-analysis---routing-for-gmail--zendesk--slack---pipedrive-9782


# AI-Powered Customer Feedback Analysis & Routing for Gmail, Zendesk, Slack & Pipedrive

### 1. Workflow Overview

This workflow automates the collection, analysis, and routing of customer feedback from multiple platforms—Gmail, Zendesk, Slack, and Pipedrive—using AI-powered agents within n8n. It is designed for Customer Success Managers (CSMs), Product, Finance, Sales Ops, and Support teams to efficiently process and act upon diverse customer inputs.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Initialization:** Starts the workflow manually and sets initial parameters including contact emails and Slack channels.
- **1.2 Data Gathering Agent:** Collects raw customer feedback data from Gmail, Slack, Pipedrive, and Zendesk using respective API tools.
- **1.3 AI Analysis Chain:** Processes raw data with AI to extract key signals from feedback texts and clusters these signals into actionable topics.
- **1.4 Action & Routing Agent:** Analyzes clustered topics and routes them to appropriate teams or tools (Zendesk, Slack, Notion, Email) based on predefined business rules.
- **1.5 Configuration & Memory Setup:** Defines AI model settings and session memory for agents to maintain context and consistent behavior.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Initialization

- **Overview:** This block triggers the workflow and sets initial static parameters such as the CSM email and Slack billing feedback channel.
- **Nodes Involved:**
  - Manual Trigger: Start VOC Analysis
  - Set: Initial Parameters

- **Node Details:**

  - **Manual Trigger: Start VOC Analysis**
    - *Type & Role:* Manual trigger node to start the VOC (Voice of Customer) analysis process on demand.
    - *Configuration:* No parameters; user manually activates the workflow.
    - *Input/Output:* No input; output connects to the Set node.
    - *Edge Cases:* User must manually trigger; no automation unless externally triggered.
  
  - **Set: Initial Parameters**
    - *Type & Role:* Sets workflow parameters for email and Slack channel names.
    - *Configuration:* Assigns `CSM email` as "your-email@example.com" (placeholder) and `slack_billing_channel` as "#billing-feedback".
    - *Expressions:* None, static values.
    - *Input/Output:* Input from Manual Trigger; output to AI Agent: Gather Customer Feedback.
    - *Edge Cases:* Email and channel must be updated before use; invalid emails or channel names will cause routing failures.

---

#### 2.2 Data Gathering Agent

- **Overview:** This AI Agent uses integrated tools to collect all recent feedback messages from Gmail, Slack, Pipedrive, and Zendesk, focusing on the last 7 days.
- **Nodes Involved:**
  - AI Agent: Gather Customer Feedback
  - Tool: Get Gmail Messages
  - Tool: Search Slack Messages Export to Sheets
  - Tool: Get Pipedrive Notes
  - Tool: Get Zendesk Tickets
  - Config: Set Agent Memory
  - AI: Structure Feedback Data
  - Note: Data Gathering (sticky note)

- **Node Details:**

  - **AI Agent: Gather Customer Feedback**
    - *Type & Role:* LangChain AI Agent node orchestrating data collection using API tools.
    - *Configuration:* Prompt instructs to gather all mails (subject and snippet) from Gmail after 7 days ago, Slack messages returning user IDs, Pipedrive notes (person_id as customerId), Zendesk tickets (requester_id).
    - *Key Expressions:* Calculates date as `Date.now() - 7 * 24 * 60 * 60 * 1000`; references CSM email from initial parameters.
    - *Input/Output:* Input from Set: Initial Parameters; outputs to AI Chain: Extract Key Signals.
    - *Edge Cases:* API rate limits, authentication errors, missing or incomplete data from tools.
    - *Memory:* Linked to Config: Set Agent Memory for session persistence.

  - **Tool: Get Gmail Messages**
    - *Type & Role:* Gmail API to retrieve emails.
    - *Configuration:* Filter by sender and receivedAfter date (overridable by AI via expressions).
    - *Input/Output:* Input from AI Agent; output returned to AI Agent.
    - *Edge Cases:* OAuth token expiration, Gmail API limits.

  - **Tool: Search Slack Messages Export to Sheets**
    - *Type & Role:* Slack API to search messages.
    - *Configuration:* Search query is AI-overridable; OAuth2 authentication.
    - *Input/Output:* Input from AI Agent; output returned to AI Agent.
    - *Edge Cases:* Slack API rate limits, invalid OAuth token, empty search results.

  - **Tool: Get Pipedrive Notes**
    - *Type & Role:* Pipedrive API to fetch notes.
    - *Configuration:* Retrieves all notes without additional filters.
    - *Input/Output:* Input from AI Agent; output returned to AI Agent.
    - *Edge Cases:* API errors, authentication issues.

  - **Tool: Get Zendesk Tickets**
    - *Type & Role:* Zendesk API to retrieve tickets.
    - *Configuration:* Fetches all tickets without filters.
    - *Input/Output:* Input from AI Agent; output returned to AI Agent.
    - *Edge Cases:* API rate limits, credentials invalidation.

  - **Config: Set Agent Memory**
    - *Type & Role:* Memory buffer to store session context for AI agent.
    - *Configuration:* Uses custom session key "1".
    - *Input/Output:* Connected to AI Agent: Gather Customer Feedback.
    - *Edge Cases:* Memory overflow or reset could cause loss of session context.

  - **AI: Structure Feedback Data**
    - *Type & Role:* AI output parser node to format gathered feedback into structured JSON.
    - *Configuration:* Parses AI output into an array of objects with source, customerId, messageId, subject, and text.
    - *Input/Output:* Input from AI Agent; output to AI Chain: Extract Key Signals.
    - *Edge Cases:* Parsing errors if AI output deviates from schema.

---

#### 2.3 AI Analysis Chain

- **Overview:** This chain compresses raw feedback into concise signals and clusters these signals into actionable topics.
- **Nodes Involved:**
  - AI Chain: Extract Key Signals
  - AI: Structure Key Signals
  - AI Chain: Cluster Signals into Topics
  - AI: Structure Clustered Topics Export to Sheets
  - Note: Analysis Chain (sticky note)

- **Node Details:**

  - **AI Chain: Extract Key Signals**
    - *Type & Role:* AI LLM Chain to summarize each feedback text into a concise 1–2 sentence signal.
    - *Configuration:* Prompt instructs stripping greetings and filler, preserving product terms, neutral tone, output only summary text.
    - *Batching:* Processes input in batches of 5 for efficiency.
    - *Input/Output:* Input from AI: Structure Feedback Data; output to AI Chain: Cluster Signals into Topics.
    - *Edge Cases:* Ambiguous or very short input texts may yield vague summaries.

  - **AI: Structure Key Signals**
    - *Type & Role:* Output parser to convert AI summaries into structured JSON containing original_text and signals array.
    - *Configuration:* Schema expects an array with original text and signals.
    - *Input/Output:* Input from AI Chain: Extract Key Signals; output to AI Chain: Cluster Signals into Topics.
    - *Edge Cases:* Parser failure if AI output format is inconsistent.

  - **AI Chain: Cluster Signals into Topics**
    - *Type & Role:* AI LLM Chain to group signals by topic and label each group with actionable names.
    - *Configuration:* Prompt instructs broad but actionable labels, avoiding vague labels unless necessary; outputs label, count, and examples.
    - *Input/Output:* Input from AI: Structure Key Signals; output to AI Agent: Route Topics to Actions.
    - *Edge Cases:* Overlapping or ambiguous clusters; improper labeling.

  - **AI: Structure Clustered Topics Export to Sheets**
    - *Type & Role:* Output parser to structure clustered topics into an array of objects with label, count, and examples.
    - *Input/Output:* Input from AI Chain: Cluster Signals into Topics; output to AI Agent: Route Topics to Actions.
    - *Edge Cases:* Parsing errors if AI output deviates.

---

#### 2.4 Action & Routing Agent

- **Overview:** Final AI Agent reads clustered topics and routes feedback to appropriate teams/tools based on routing rules.
- **Nodes Involved:**
  - AI Agent: Route Topics to Actions
  - Tool: Create Zendesk Ticket
  - Tool: Send Email Alert
  - Tool: Create Notion Page
  - Note: Action Agent (sticky note)

- **Node Details:**

  - **AI Agent: Route Topics to Actions**
    - *Type & Role:* AI Agent analyzing clustered topics to decide routing actions.
    - *Configuration:* Prompt details routing rules:
      - Performance/Feature gaps → Zendesk ticket
      - Billing/Contract issues → Slack channel message
      - Onboarding/Training → Notion task
      - High-risk/VIP → Direct email to CSM
      - Sales/Customer engagement → Direct email
      - Client Management/Proposals → Direct email
      - Unmatched clusters marked as "unassigned"
    - *Input/Output:* Input from AI Chain: Cluster Signals into Topics; outputs to Zendesk, Email, Notion nodes.
    - *Edge Cases:* Misclassification, email or API failure, missing Slack channel or Notion database ID.

  - **Tool: Create Zendesk Ticket**
    - *Type & Role:* Creates Zendesk tickets for relevant clusters.
    - *Configuration:* Ticket description and title generated by AI agent.
    - *Input/Output:* Input from AI Agent; no further output.
    - *Edge Cases:* Zendesk API errors, missing permissions.

  - **Tool: Send Email Alert**
    - *Type & Role:* Sends email alerts to CSM or managers based on routing.
    - *Configuration:* Dynamic recipients, subject, and message body from AI output.
    - *Input/Output:* Input from AI Agent.
    - *Edge Cases:* Email delivery failures, invalid email addresses.

  - **Tool: Create Notion Page**
    - *Type & Role:* Creates Notion database pages for onboarding/training feedback.
    - *Configuration:* Uses Notion database ID (must be set) and dynamically sets title and content.
    - *Input/Output:* Input from AI Agent.
    - *Edge Cases:* Missing database ID, API permission issues.

---

#### 2.5 Configuration & Memory Setup

- **Overview:** Defines AI model parameters and memory buffers used across agents for consistent processing.
- **Nodes Involved:**
  - Config: Set LLM for Agents
  - Config: Set Agent Memory

- **Node Details:**

  - **Config: Set LLM for Agents**
    - *Type & Role:* Defines the OpenAI GPT-4.1-mini model for all AI agents.
    - *Configuration:* Model set to "gpt-4.1-mini" with temperature 0 for deterministic outputs.
    - *Input/Output:* Feeds AI language model reference to all AI nodes.
    - *Edge Cases:* Requires valid OpenAI API credentials; model availability.

  - **Config: Set Agent Memory**
    - *Type & Role:* Sets buffer window memory for agents.
    - *Configuration:* Uses custom session key "1" for session tracking.
    - *Input/Output:* Connected to AI Agent: Gather Customer Feedback.
    - *Edge Cases:* Memory persistence limits.

---

### 3. Summary Table

| Node Name                           | Node Type                                  | Functional Role                               | Input Node(s)                    | Output Node(s)                                | Sticky Note                                                                                              |
|-----------------------------------|--------------------------------------------|-----------------------------------------------|---------------------------------|-----------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Manual Trigger: Start VOC Analysis| Manual Trigger                             | Start workflow manually                        |                                 | Set: Initial Parameters                        |                                                                                                        |
| Set: Initial Parameters            | Set                                        | Sets email and Slack channel parameters       | Manual Trigger: Start VOC Analysis | AI Agent: Gather Customer Feedback             |                                                                                                        |
| AI Agent: Gather Customer Feedback| LangChain Agent                            | Collects raw feedback using multiple tools    | Set: Initial Parameters, Config: Set Agent Memory, Tool nodes | AI Chain: Extract Key Signals                  | Data Gathering Agent: collects recent customer interactions from Gmail, Slack, Pipedrive, Zendesk       |
| Tool: Get Gmail Messages           | Gmail API Tool                             | Fetch Gmail messages                           | AI Agent: Gather Customer Feedback |                                               |                                                                                                        |
| Tool: Search Slack Messages Export to Sheets | Slack API Tool                     | Fetch Slack messages                           | AI Agent: Gather Customer Feedback |                                               |                                                                                                        |
| Tool: Get Pipedrive Notes          | Pipedrive API Tool                         | Fetch Pipedrive notes                          | AI Agent: Gather Customer Feedback |                                               |                                                                                                        |
| Tool: Get Zendesk Tickets          | Zendesk API Tool                           | Fetch Zendesk tickets                          | AI Agent: Gather Customer Feedback |                                               |                                                                                                        |
| Config: Set Agent Memory           | LangChain Memory Buffer                    | Provides session memory for AI agent          |                                 | AI Agent: Gather Customer Feedback             |                                                                                                        |
| AI: Structure Feedback Data        | LangChain Output Parser                    | Structures raw AI output into JSON             | AI Agent: Gather Customer Feedback | AI Chain: Extract Key Signals                  |                                                                                                        |
| AI Chain: Extract Key Signals       | LangChain LLM Chain                        | Summarizes feedback text into concise signals | AI: Structure Feedback Data       | AI Chain: Cluster Signals into Topics          | AI Analysis Chain: signal extraction from raw text                                                    |
| AI: Structure Key Signals           | LangChain Output Parser                    | Structures AI summarized signals               | AI Chain: Extract Key Signals      | AI Chain: Cluster Signals into Topics          |                                                                                                        |
| AI Chain: Cluster Signals into Topics | LangChain LLM Chain                      | Groups signals into labeled clusters           | AI: Structure Key Signals          | AI Agent: Route Topics to Actions               | AI Analysis Chain: clustering signals into actionable topics                                          |
| AI: Structure Clustered Topics Export to Sheets | LangChain Output Parser          | Structures clustered topics output              | AI Chain: Cluster Signals into Topics | AI Agent: Route Topics to Actions               |                                                                                                        |
| AI Agent: Route Topics to Actions   | LangChain Agent                            | Routes clustered topics to appropriate actions | AI Chain: Cluster Signals into Topics | Tool: Create Zendesk Ticket, Tool: Send Email Alert, Tool: Create Notion Page | Action & Routing Agent: dispatches topics based on routing rules                                       |
| Tool: Create Zendesk Ticket         | Zendesk API Tool                           | Creates Zendesk tickets for performance/feature topics | AI Agent: Route Topics to Actions |                                               |                                                                                                        |
| Tool: Send Email Alert              | Gmail API Tool                             | Sends email alerts to CSM or managers          | AI Agent: Route Topics to Actions |                                               |                                                                                                        |
| Tool: Create Notion Page            | Notion API Tool                           | Creates Notion pages for onboarding/training   | AI Agent: Route Topics to Actions |                                               |                                                                                                        |
| Config: Set LLM for Agents          | LangChain Model Config                     | Sets AI model (GPT-4.1-mini) and temperature   |                                 | All AI nodes                                   |                                                                                                        |
| Workflow Documentation              | Sticky Note                               | Describes workflow purpose and setup instructions |                                 |                                               | Voice of Customer AI Analysis & Routing overview; setup instructions                                   |
| Note: Data Gathering                | Sticky Note                               | Explains Data Gathering Agent role             |                                 |                                               | Data Gathering Agent: collects customer interactions via tools                                        |
| Note: Analysis Chain                | Sticky Note                               | Explains AI Analysis Chain steps                |                                 |                                               | AI Analysis Chain: signal extraction and clustering                                                   |
| Note: Action Agent                  | Sticky Note                               | Explains final routing and action agent         |                                 |                                               | Action & Routing Agent: decides and executes routing actions                                          |
| Sticky Note1                       | Sticky Note                               | Contact information for workflow modifications  |                                 |                                               | Contact me: for workflow help or modifications: [thomas@pollup.net](mailto:thomas@pollup.net)          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**
   - Name: `Manual Trigger: Start VOC Analysis`
   - No parameters.
   - This node starts the workflow manually.

2. **Create Set Node**
   - Name: `Set: Initial Parameters`
   - Add two string fields:
     - `CSM email` = `"your-email@example.com"` (replace with actual email)
     - `slack_billing_channel` = `"#billing-feedback"` (replace with actual Slack channel)
   - Connect output of Manual Trigger to this node.

3. **Create LangChain Memory Node**
   - Name: `Config: Set Agent Memory`
   - Set `sessionKey` to `"1"`
   - Set `sessionIdType` to `"customKey"`
   - This node provides session memory for AI agents.

4. **Create LangChain LLM Node for Model Config**
   - Name: `Config: Set LLM for Agents`
   - Model: Select `gpt-4.1-mini`
   - Temperature: `0`
   - This sets the AI model for all AI nodes.

5. **Create Gmail Tool Node**
   - Name: `Tool: Get Gmail Messages`
   - Operation: `getAll`
   - Filters:
     - Sender: `"="` (empty or specify as needed)
     - Received After: Expression `{{ Date.now() - 7 * 24 * 60 * 60 * 1000 }}`
   - Return All: `true` or as needed
   - Connect this node as a tool to the AI Agent node below.

6. **Create Slack Tool Node**
   - Name: `Tool: Search Slack Messages Export to Sheets`
   - Operation: `search`
   - Query: Leave default or set expression for AI override.
   - Authentication: OAuth2 (configure Slack OAuth2 credentials)
   - Connect as a tool to the AI Agent node.

7. **Create Pipedrive Tool Node**
   - Name: `Tool: Get Pipedrive Notes`
   - Resource: `note`
   - Operation: `getAll`
   - Connect as a tool to the AI Agent node.

8. **Create Zendesk Tool Node**
   - Name: `Tool: Get Zendesk Tickets`
   - Operation: `getAll`
   - Connect as a tool to the AI Agent node.

9. **Create LangChain Agent Node**
   - Name: `AI Agent: Gather Customer Feedback`
   - Text prompt instructs to gather all recent data from Gmail (last 7 days), Slack, Pipedrive, Zendesk as per the prompt in the original workflow.
   - Connect to tools: Gmail, Slack, Pipedrive, Zendesk nodes.
   - Connect to memory node for ai_memory.
   - Connect to LLM node for ai_languageModel.
   - Connect input from `Set: Initial Parameters`.
   - Output connects to `AI: Structure Feedback Data`.

10. **Create LangChain Output Parser Node**
    - Name: `AI: Structure Feedback Data`
    - Configure JSON schema to parse feedback into objects with keys: source, customerId, messageId, subject, text.
    - Connect input from AI Agent: Gather Customer Feedback.
    - Output connects to `AI Chain: Extract Key Signals`.

11. **Create LangChain Chain Node**
    - Name: `AI Chain: Extract Key Signals`
    - Prompt instructs compression of feedback text into concise signals (1-2 sentences).
    - Batch size: 5
    - Connect input from `AI: Structure Feedback Data`.
    - Output connects to `AI: Structure Key Signals`.
    - Connect to LLM node.

12. **Create LangChain Output Parser Node**
    - Name: `AI: Structure Key Signals`
    - Configure JSON schema to parse output into array with original_text and signals.
    - Connect input from `AI Chain: Extract Key Signals`.
    - Output connects to `AI Chain: Cluster Signals into Topics`.

13. **Create LangChain Chain Node**
    - Name: `AI Chain: Cluster Signals into Topics`
    - Prompt instructs grouping signals into labeled clusters with label, count, and examples.
    - Connect input from `AI: Structure Key Signals`.
    - Output connects to `AI: Structure Clustered Topics Export to Sheets`.
    - Connect to LLM node.

14. **Create LangChain Output Parser Node**
    - Name: `AI: Structure Clustered Topics Export to Sheets`
    - Configure JSON schema to parse clusters into label, count, examples.
    - Connect input from `AI Chain: Cluster Signals into Topics`.
    - Output connects to `AI Agent: Route Topics to Actions`.

15. **Create LangChain Agent Node**
    - Name: `AI Agent: Route Topics to Actions`
    - Prompt includes routing rules for topics to Zendesk, Slack, Notion, and Email.
    - Connect input from `AI: Structure Clustered Topics Export to Sheets`.
    - Connect to LLM node.
    - Outputs connected to:
      - `Tool: Create Zendesk Ticket`
      - `Tool: Send Email Alert`
      - `Tool: Create Notion Page`

16. **Create Zendesk Tool Node**
    - Name: `Tool: Create Zendesk Ticket`
    - Operation: create ticket with title and description from AI output.
    - Connect input from AI Agent: Route Topics to Actions.

17. **Create Gmail Tool Node for Sending Email**
    - Name: `Tool: Send Email Alert`
    - Operation: send email
    - Parameters: recipient, subject, message dynamically set by AI output.
    - Connect input from AI Agent: Route Topics to Actions.

18. **Create Notion Tool Node**
    - Name: `Tool: Create Notion Page`
    - Resource: `databasePage`
    - Database ID: Set to your target Notion database ID.
    - Properties: Title and content dynamically set by AI.
    - Connect input from AI Agent: Route Topics to Actions.

19. **Connect all AI nodes to the LLM Model Config node** for consistent model usage.

20. **Set Credentials**
    - Configure OAuth2 for Gmail, Slack, Zendesk, Pipedrive, and Notion nodes.
    - Configure OpenAI credentials for LangChain nodes.

21. **Add Sticky Notes for Documentation**
    - Add notes explaining Data Gathering, AI Analysis Chain, Action Agent, and overall workflow documentation for clarity.

22. **Test and Activate Workflow**
    - Test manually triggering the workflow.
    - Verify data collection, AI processing, and routing outputs.
    - Activate for scheduled or on-demand use.

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                               |
|--------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| Voice of Customer AI Analysis & Routing automates multi-source feedback collection, AI analysis, and routing. | Workflow Documentation sticky note                            |
| Data Gathering Agent uses Gmail, Slack, Pipedrive, Zendesk to fetch recent customer interactions.       | Note: Data Gathering                                           |
| AI Analysis Chain compresses feedback into signals and clusters them into actionable topics.             | Note: Analysis Chain                                           |
| Action & Routing Agent dispatches topics to Zendesk, Slack, Notion, or Email based on rules.             | Note: Action Agent                                            |
| Contact for workflow modifications or help: [thomas@pollup.net](mailto:thomas@pollup.net)                | Sticky Note1                                                  |

---

**Disclaimer:**  
The provided content is extracted solely from an n8n workflow automation. It complies fully with current content policies and contains no illegal or protected material. All data processed is lawful and public.