AI-Powered Customer Feedback Routing with Gmail, Slack, Pipedrive, Zendesk & Notion

https://n8nworkflows.xyz/workflows/ai-powered-customer-feedback-routing-with-gmail--slack--pipedrive--zendesk---notion-11628


# AI-Powered Customer Feedback Routing with Gmail, Slack, Pipedrive, Zendesk & Notion

### 1. Workflow Overview

This workflow is an AI-powered customer feedback routing system designed to aggregate, analyze, and route customer feedback from multiple communication and CRM platforms. It targets organizations needing to efficiently process customer signals from Gmail, Slack, Pipedrive, and Zendesk, then classify and route these signals to appropriate teams or systems such as Zendesk tickets, Slack channels, Notion tasks, or direct emails to customer success managers (CSMs).

**Logical blocks:**

- **1.1 Input Reception and Data Collection:** Collects raw customer feedback data from Gmail, Slack, Pipedrive, and Zendesk.
- **1.2 AI Processing: Signal Extraction and Clustering:** Uses AI agents to summarize feedback into concise signals, then clusters these signals by topic.
- **1.3 Action Routing:** Routes clustered feedback to the correct destination (Zendesk, Slack, Notion, Gmail) based on predefined business rules.
- **1.4 Workflow Control and Configuration:** Handles scheduled or manual triggering of the workflow and sets configuration parameters like the CSM email.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Data Collection

**Overview:**  
This block gathers customer feedback data from multiple sources — Gmail emails, Slack messages, Pipedrive notes, and Zendesk tickets — consolidating them for AI processing.

**Nodes Involved:**  
- Schedule Trigger  
- Manual Trigger (Testing)  
- Set CSM email  
- Get many messages in Gmail  
- Search for messages in Slack  
- Get many notes in Pipedrive  
- Data agent  
- Simple Memory  
- Sticky Notes (related comments)

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule trigger node  
  - Role: Periodically initiates the workflow (default interval set to run regularly)  
  - Config: Default interval (can be daily/weekly)  
  - Connections: Triggers "Set CSM email" node  
  - Failure Modes: Misconfigured intervals, time zone issues

- **Manual Trigger (Testing)**  
  - Type: Manual trigger node  
  - Role: Enables manual workflow execution for testing  
  - Connections: Triggers "Set CSM email" node  
  - Failure Modes: None (manual trigger)

- **Set CSM email**  
  - Type: Set node  
  - Role: Defines the customer success manager email used in subsequent notifications  
  - Config: Hardcoded email "thomas@pollup.net" (editable)  
  - Connections: Outputs to "Data agent"  
  - Edge Cases: Email must be valid; consider externalizing for multi-CSM scenarios

- **Get many messages in Gmail**  
  - Type: Gmail Tool node  
  - Role: Retrieves recent emails filtered by sender and received time  
  - Config: Filters by sender and "receivedAfter" date, returns up to 5 emails  
  - Credentials: OAuth2 Gmail account  
  - Connections: Feeds data into "Data agent"  
  - Edge Cases: Gmail API rate limits, auth expiration, empty inbox, invalid filters

- **Search for messages in Slack**  
  - Type: Slack Tool node  
  - Role: Searches Slack messages across specified channels using a query  
  - Config: Search query is AI-overridable, channel fixed to "all-pollupdotnet"  
  - Credentials: OAuth2 Slack integration  
  - Connections: Feeds data into "Data agent"  
  - Edge Cases: Slack API rate limits, invalid channel, token expiration

- **Get many notes in Pipedrive**  
  - Type: Pipedrive Tool node  
  - Role: Retrieves all notes from Pipedrive CRM  
  - Config: No filters, retrieves all notes  
  - Credentials: Pipedrive API credentials  
  - Connections: Feeds data into "Data agent"  
  - Edge Cases: API limits, auth failure, empty notes

- **Data agent**  
  - Type: LangChain AI agent node  
  - Role: Aggregates data from Gmail, Slack, Pipedrive, and Zendesk; extracts relevant fields per source  
  - Config: Uses a prompt defining data extraction rules for the last 5 emails, Slack messages, Pipedrive notes, and Zendesk tickets  
  - Input: Receives data from Gmail, Slack, Pipedrive nodes and memory buffer  
  - Output: Sends consolidated output to "Signals agent"  
  - Edge Cases: Prompt failures, input data inconsistencies, API timeouts

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window node  
  - Role: Maintains session memory for AI agents to handle context  
  - Config: Uses custom session key "1"  
  - Connections: Connected as memory to "Data agent"  
  - Edge Cases: Memory overflow, session mismanagement

- **Sticky Notes**  
  - Provide documentation for configuring CSM email and scheduling trigger frequency.

---

#### 2.2 AI Processing: Signal Extraction and Clustering

**Overview:**  
Transforms raw customer feedback into concise signals, then clusters these signals into meaningful groups with labels and examples.

**Nodes Involved:**  
- Signals agent  
- Structured Output Parser1  
- Clustering agent  
- Structured Output Parser2  
- LLM (OpenAI GPT-4)  
- Sticky Notes (related comments)

**Node Details:**

- **Signals agent**  
  - Type: LangChain Chain LLM node  
  - Role: Summarizes raw feedback into short, neutral signals (1–2 sentences)  
  - Config: Custom prompt instructing how to compress feedback; batch size of 5  
  - Input: Output from "Data agent"  
  - Output: Connected to "Clustering agent"  
  - Has structured output parser "Structured Output Parser1" attached  
  - Edge Cases: Prompt misunderstandings, incomplete input, API rate limits

- **Structured Output Parser1**  
  - Type: LangChain Structured Output Parser  
  - Role: Parses AI output into JSON structure with original text and signals array  
  - Config: Template JSON schema example provided  
  - Input: Attached to "Signals agent" output  
  - Output: Feeds parsed data to "Signals agent" (internal use)  
  - Edge Cases: Parsing errors if AI output deviates from schema

- **Clustering agent**  
  - Type: LangChain Chain LLM node  
  - Role: Groups summarized signals by topic, assigns human-readable labels, counts, and examples  
  - Config: Prompt defines grouping rules and output schema including label, count, examples  
  - Input: Output from "Signals agent"  
  - Output: Connected to "Action agent"  
  - Has structured output parser "Structured Output Parser2" attached  
  - Edge Cases: Over/under clustering, invalid group labels, insufficient data

- **Structured Output Parser2**  
  - Type: LangChain Structured Output Parser  
  - Role: Parses clustering agent output into structured JSON with labels, counts, examples  
  - Config: Schema example with label, count, examples  
  - Input: Attached to "Clustering agent" output  
  - Output: Internal to "Clustering agent" processing  
  - Edge Cases: Parsing failures if AI output is malformed

- **LLM (OpenAI GPT-4 Mini)**  
  - Type: LangChain LLM Chat OpenAI node  
  - Role: Provides language model backend for AI agents  
  - Config: Model "gpt-4.1-mini", temperature 0 for deterministic output  
  - Credentials: OpenAI API key  
  - Connections: Linked as AI language model for "Signals agent", "Clustering agent", "Action agent", and "Data agent"  
  - Edge Cases: API quota exceeded, latency, model updates

- **Sticky Notes**  
  - Explain the role of the Signal agent and Clustering agent and their prompts.

---

#### 2.3 Action Routing

**Overview:**  
Interprets clustered feedback and routes each cluster to the correct destination system or team based on label and count thresholds.

**Nodes Involved:**  
- Action agent  
- Create a ticket in Zendesk  
- Send a message in Slack  
- Create a database page in Notion  
- Send a message in Gmail  
- Sticky Notes (related comments)

**Node Details:**

- **Action agent**  
  - Type: LangChain AI agent node  
  - Role: Receives clustered feedback and decides routing actions per cluster using detailed routing rules  
  - Config: Prompt defines routing rules mapping cluster labels to actions (Zendesk, Slack, Notion, Gmail), filters out "unassigned" clusters  
  - Input: Output from "Clustering agent"  
  - Output: Triggers Zendesk, Slack, Notion, Gmail nodes accordingly  
  - On error: Continue regular output (does not fail workflow if errors occur)  
  - Edge Cases: Incorrect routing due to prompt errors, API failures, missing CSM email

- **Create a ticket in Zendesk**  
  - Type: Zendesk Tool node  
  - Role: Creates tickets for clusters related to product/performance issues  
  - Config: Subject and description dynamically set from AI output  
  - Credentials: Zendesk API  
  - Input: Triggered by "Action agent"  
  - Edge Cases: API rate limits, permission errors, malformed input

- **Send a message in Slack**  
  - Type: Slack Tool node  
  - Role: Posts messages to Slack "#billing-feedback" channel for billing/contract issues  
  - Config: Channel fixed, message content from AI output  
  - Credentials: Slack OAuth2  
  - Input: Triggered by "Action agent"  
  - Edge Cases: Slack API failures, invalid channel, token expiration

- **Create a database page in Notion**  
  - Type: Notion Tool node  
  - Role: Creates Notion database pages for sales-related feedback clusters  
  - Config: Title and rich text content from AI output, targets specific database by ID  
  - Credentials: Notion API  
  - Input: Triggered by "Action agent"  
  - Edge Cases: API limits, invalid database ID, content formatting errors

- **Send a message in Gmail**  
  - Type: Gmail Tool node  
  - Role: Sends direct email to CSM for high-risk or engagement-related clusters  
  - Config: Recipient is fixed to CSM email; subject and message from AI output  
  - Credentials: Gmail OAuth2  
  - Input: Triggered by "Action agent"  
  - Edge Cases: Email send failures, auth expiration, invalid recipient

- **Sticky Notes**  
  - Explain the routing rules and customization for the Action agent.

---

#### 2.4 Workflow Control and Configuration

**Overview:**  
Manages workflow triggering methods, sets key parameters, and provides user guidance via sticky notes.

**Nodes Involved:**  
- Schedule Trigger  
- Manual Trigger (Testing)  
- Set CSM email  
- Several Sticky Notes explaining usage, configuration, setup, and customization

**Node Details:**

- Already detailed in sections above.

---

### 3. Summary Table

| Node Name                   | Node Type                             | Functional Role                                    | Input Node(s)                    | Output Node(s)                   | Sticky Note                                                                                   |
|-----------------------------|-------------------------------------|---------------------------------------------------|---------------------------------|---------------------------------|----------------------------------------------------------------------------------------------|
| Schedule Trigger             | Schedule Trigger                    | Periodically triggers the workflow                 | —                               | Set CSM email                   | You can set the frequency of the executions in the Schedule trigger node.                     |
| Testing                     | Manual Trigger                     | Allows manual trigger for testing                   | —                               | Set CSM email                   | You can set the frequency of the executions in the Schedule trigger node.                     |
| Set CSM email               | Set                               | Defines the CSM email address                        | Schedule Trigger, Testing        | Data agent                     | Set your CSM or responsible email here.                                                     |
| Get many messages in Gmail  | Gmail Tool                        | Retrieves recent emails from Gmail                   | —                               | Data agent                     | Data agent sources                                                                           |
| Search for messages in Slack| Slack Tool                       | Searches Slack messages                              | —                               | Data agent                     | Data agent sources                                                                           |
| Get many notes in Pipedrive | Pipedrive Tool                   | Retrieves notes from Pipedrive                       | —                               | Data agent                     | Data agent sources                                                                           |
| Data agent                 | LangChain AI agent               | Aggregates and extracts relevant data               | Set CSM email, Gmail, Slack, Pipedrive, Memory | Signals agent                 | Data agent is in charge of collecting data from various sources. Modify prompt as needed.    |
| Simple Memory              | LangChain Memory Buffer           | Maintains AI session memory                          | —                               | Data agent (memory input)      |                                                                                              |
| Signals agent              | LangChain Chain LLM               | Summarizes raw feedback into concise signals        | Data agent                     | Clustering agent               | Generates signals from user input; modify prompt if data sources change.                     |
| Structured Output Parser1  | LangChain Structured Output Parser | Parses signals agent output into structured JSON    | Signals agent                  | Signals agent (internal)       |                                                                                              |
| Clustering agent           | LangChain Chain LLM               | Groups signals by topic with labels and examples    | Signals agent                  | Action agent                  | Groups the signals by topic, numbers them, and outputs examples.                             |
| Structured Output Parser2  | LangChain Structured Output Parser | Parses clustering agent output into structured JSON| Clustering agent               | Clustering agent (internal)   |                                                                                              |
| Action agent               | LangChain AI agent               | Routes clustered feedback to correct destinations   | Clustering agent               | Zendesk ticket, Slack post, Notion page, Gmail send | Takes action from the input; highly customizable routing rules.                              |
| Create a ticket in Zendesk | Zendesk Tool                     | Creates Zendesk tickets for product/performance issues | Action agent                  | —                             | Output messages                                                                             |
| Send a message in Slack    | Slack Tool                      | Posts messages to Slack channel for billing issues  | Action agent                  | —                             | Output messages                                                                             |
| Create a database page in Notion | Notion Tool                   | Creates Notion database pages for sales feedback    | Action agent                  | —                             | Output messages                                                                             |
| Send a message in Gmail    | Gmail Tool                     | Sends direct email notifications to CSM             | Action agent                  | —                             | Output messages                                                                             |
| LLM                        | LangChain LLM Chat OpenAI       | Provides language model backend for AI agents       | —                               | Signals agent, Clustering agent, Action agent, Data agent |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a **Schedule Trigger** node; set desired interval (e.g., daily or weekly).  
   - Add a **Manual Trigger** node for testing purposes.

2. **Set CSM Email:**  
   - Add a **Set** node named "Set CSM email".  
   - Define a string parameter "CSM email" with the email address of the Customer Success Manager (e.g., "thomas@pollup.net").  
   - Connect both trigger nodes to this node.

3. **Data Collection Nodes:**  
   - Add a **Gmail Tool** node "Get many messages in Gmail".  
     - Configure operation to "getAll" with filters: sender and receivedAfter (to be dynamically set or left blank).  
     - Set returnAll to 5 for recent emails.  
     - Add credentials for Gmail OAuth2.  
   - Add a **Slack Tool** node "Search for messages in Slack".  
     - Configure operation "search" with a query parameter (can be empty or dynamic).  
     - Set searchChannel to the relevant channel(s), e.g., "all-pollupdotnet".  
     - Use OAuth2 Slack credentials.  
   - Add a **Pipedrive Tool** node "Get many notes in Pipedrive".  
     - Configure to "getAll" notes with no additional filters.  
     - Set Pipedrive API credentials.

4. **AI Memory Node:**  
   - Add a **LangChain Memory Buffer Window** node "Simple Memory".  
   - Set sessionKey to "1" and sessionIdType to "customKey".

5. **AI Data Agent:**  
   - Add a **LangChain AI agent** node "Data agent".  
   - Configure the prompt to collect and extract relevant fields from Gmail, Slack, Pipedrive, and Zendesk data.  
   - Connect inputs from "Set CSM email", Gmail, Slack, Pipedrive nodes, and add memory input from "Simple Memory".  
   - Connect output to the "Signals agent".

6. **Signals Agent (AI Summary):**  
   - Add a **LangChain Chain LLM** node "Signals agent".  
   - Configure prompt to generate concise, neutral summaries of feedback signals, stripping greetings and filler.  
   - Set batchSize to 5 and enable structured output parsing.  
   - Attach a **Structured Output Parser** node with a JSON schema example for signals.  
   - Connect output to "Clustering agent".

7. **Clustering Agent:**  
   - Add a **LangChain Chain LLM** node "Clustering agent".  
   - Configure prompt to group signals into labeled clusters with counts and examples.  
   - Enable structured output parsing with a suitable JSON schema.  
   - Connect output to "Action agent".

8. **Action Agent:**  
   - Add a **LangChain AI agent** node "Action agent".  
   - Configure prompt with routing rules to decide actions per cluster based on label and count thresholds.  
   - Define routing to Zendesk, Slack, Notion, and Gmail nodes.  
   - Connect input from "Clustering agent".

9. **Destination Nodes:**  
   - Add **Zendesk Tool** node "Create a ticket in Zendesk".  
     - Configure to create tickets with subject and description from AI output.  
     - Use Zendesk API credentials.  
   - Add **Slack Tool** node "Send a message in Slack".  
     - Configure to post messages to the "#billing-feedback" channel.  
     - Use Slack OAuth2 credentials.  
   - Add **Notion Tool** node "Create a database page in Notion".  
     - Configure to create a database page with title and content from AI output.  
     - Use Notion API credentials and specify database ID.  
   - Add **Gmail Tool** node "Send a message in Gmail".  
     - Configure to send emails to the CSM email with subject and message from AI output.  
     - Use Gmail OAuth2 credentials.

10. **Connect Action agent outputs to respective nodes** for Zendesk, Slack, Notion, and Gmail.

11. **Add Sticky Notes** throughout the workflow for documentation and clarity:
    - CSM email setting  
    - Scheduling instructions  
    - Data agent purpose  
    - Signal agent explanation  
    - Clustering agent role  
    - Action agent routing rules  

12. **Connect all nodes as per the workflow connections** provided, ensuring AI language model node (LLM) is linked as the AI backend for all LangChain nodes.

13. **Test and validate** the workflow by running the manual trigger and checking each step’s output and routing.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                               | Context or Link                                                                                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| The workflow aggregates customer feedback from multiple platforms to create a unified feedback processing system powered by AI, enabling automated routing to the right teams or tools.                                                                                                                                                                                                    | Overview section                                                                                                                                                |
| Modify the CSM email in the "Set CSM email" node to target the responsible person or team.                                                                                                                                                                                                                                                                                                  | Node-specific note                                                                                                                                                 |
| Scheduling frequency can be adjusted in the Schedule Trigger node; manual runs are possible via the Testing node.                                                                                                                                                                                                                                                                             | Scheduling instructions                                                                                                                                           |
| The AI prompts embedded in the Data agent, Signals agent, Clustering agent, and Action agent nodes are highly customizable to fit specific business contexts, categories, and routing requirements.                                                                                                                                                                                          | AI prompt customization guidance                                                                                                                                 |
| Add new data sources or routing destinations (e.g., Jira, HubSpot) by extending the Data agent and Action agent nodes and connecting appropriate n8n integrations.                                                                                                                                                                                                                           | Customization advice                                                                                                                                               |
| Ensure all API credentials (Gmail OAuth2, Slack OAuth2, Pipedrive API, Zendesk API, Notion API, OpenAI API) are valid, authorized, and have sufficient permissions before enabling the workflow.                                                                                                                                                                                               | Credential management                                                                                                                                              |
| OpenAI GPT-4 model is used with temperature 0 for consistent, deterministic summarization and clustering. Adjust temperature for more creative outputs if desired.                                                                                                                                                                                                                          | AI model configuration                                                                                                                                            |
| The workflow uses a “Simple Memory” node to maintain context across AI calls, enhancing coherence and session-based processing.                                                                                                                                                                                                                                                            | AI memory usage                                                                                                                                                    |
| For detailed explanation of LangChain nodes and structured output parsers, refer to n8n docs on LangChain integration: https://docs.n8n.io/integrations/builtin/n8n-nodes-langchain/                                                                                                                                                                                                       | n8n LangChain documentation link                                                                                                                                  |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow constructed using n8n, a tool for integration and automation. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.