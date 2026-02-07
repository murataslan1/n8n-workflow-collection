Auto-Generate Competitive Battlecards with AI, Slack & Notion (Klue Alternative)

https://n8nworkflows.xyz/workflows/auto-generate-competitive-battlecards-with-ai--slack---notion--klue-alternative--10205


# Auto-Generate Competitive Battlecards with AI, Slack & Notion (Klue Alternative)

### 1. Workflow Overview

This workflow automates the generation of competitive battlecards leveraging real-time sales intelligence gathered from multiple AI sources and integrated platforms such as Slack and Notion. It is designed for sales and competitive intelligence teams aiming to quickly synthesize competitor insights and distribute concise battlecards automatically.

The workflow is logically structured into the following blocks:

- **1.1 Input Reception:** Listens for competitor mentions or chat messages in Slack to trigger the workflow.
- **1.2 Competitor & Context Data Retrieval:** Gathers competitor-specific information from Notion databases and data tables.
- **1.3 Content Extraction & Aggregation:** Retrieves and processes content from competitor URLs using AI content readers and merges multiple inputs.
- **1.4 AI Intelligence Processing:** Uses multiple AI agents (Anthropic, LangChain, Perplexity) to analyze, interpret, and synthesize competitive intelligence data.
- **1.5 Battlecard Generation & Storage:** Compiles AI-generated insights into a battlecard format, stores it in Notion, and logs entries in a data table.
- **1.6 Notification & Error Handling:** Sends notifications back to Slack about battlecard creation or errors encountered.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block triggers the workflow when a competitor is mentioned in Slack or a chat message is received, serving as the entry point for the automation.

**Nodes Involved:**  
- Slack Trigger - Competitor Mention  
- When chat message received  

**Node Details:**  

- **Slack Trigger - Competitor Mention**  
  - Type: Slack Trigger node  
  - Role: Listens for specific competitor mentions in Slack channels to initiate workflow.  
  - Configuration: Uses a Slack webhook to capture mentions; no special parameters configured here.  
  - Input: Slack event (mention)  
  - Output: Trigger data to "Code in JavaScript2" node.  
  - Edge Cases: Slack API rate limiting, webhook not configured or revoked.

- **When chat message received**  
  - Type: LangChain Chat Trigger  
  - Role: Starts workflow when a chat message is received from LangChain chat UI or integration.  
  - Configuration: Webhook enabled for chat message events.  
  - Input: Chat message data  
  - Output: Passes data to "AI Agent" node.  
  - Edge Cases: Webhook misconfiguration, chat message format issues.

---

#### 1.2 Competitor & Context Data Retrieval

**Overview:**  
Retrieves competitor details and context from Notion pages and data tables, preparing structured inputs for AI processing.

**Nodes Involved:**  
- Get Competitor Page  
- Get Our Page  
- Get Competitor URL  
- Get row(s) in Data table  

**Node Details:**  

- **Get Competitor Page**  
  - Type: Notion Tool node  
  - Role: Fetch competitor's detailed page content from Notion database.  
  - Configuration: Queries Notion database by competitor identifier.  
  - Input: Competitor identifier (from Slack or chat trigger)  
  - Output: Competitor page content to Q&A Agent - Answer Questions node.  
  - Edge Cases: Notion API limits, missing competitor page.

- **Get Our Page**  
  - Type: Notion Tool node  
  - Role: Retrieves internal reference page content from Notion for comparison or additional context.  
  - Configuration: Accesses internal Notion database page.  
  - Input: Internal context request  
  - Output: Internal page content to Q&A Agent - Answer Questions.  
  - Edge Cases: Permission errors, page not found.

- **Get Competitor URL**  
  - Type: Data Table Tool node  
  - Role: Fetch competitor URLs from a data table for content scraping.  
  - Configuration: Queries table based on competitor name or ID.  
  - Input: Competitor name/ID  
  - Output: URL(s) sent to Q&A Agent - Answer Questions.  
  - Edge Cases: Empty or invalid URL.

- **Get row(s) in Data table**  
  - Type: Data Table Tool node  
  - Role: Retrieves relevant data rows for AI Agent to process, possibly sales data or competitor metrics.  
  - Configuration: Configured to fetch rows based on incoming trigger data.  
  - Input: Trigger data identifier  
  - Output: Data rows to AI Agent.  
  - Edge Cases: Empty data, API timeouts.

---

#### 1.3 Content Extraction & Aggregation

**Overview:**  
Reads content from multiple competitor-related URLs using AI-powered content extraction tools, merges multiple content streams into a unified dataset.

**Nodes Involved:**  
- Read URL content  
- Read URL content1  
- Read URL content2  
- Read URL content3  
- Merge3  

**Node Details:**  

- **Read URL content / Read URL content1 / Read URL content2 / Read URL content3**  
  - Type: Jina AI content reader nodes  
  - Role: Extracts textual content from competitor URLs.  
  - Configuration: Each node handles one URL; configured to continue on errors to avoid blocking workflow.  
  - Input: URL from data table or Notion page  
  - Output: Extracted content to Merge3 node.  
  - Edge Cases: URL unreachable, content not readable, timeout.

- **Merge3**  
  - Type: Merge node  
  - Role: Combines outputs from all URL content readers into one aggregated dataset.  
  - Configuration: Defaults to merging all inputs by data order.  
  - Input: Content streams from all Read URL content nodes  
  - Output: Aggregated content to "Code in JavaScript" node.  
  - Edge Cases: Mismatch in input data counts, empty inputs.

---

#### 1.4 AI Intelligence Processing

**Overview:**  
Processes aggregated data through multiple AI agents using Anthropic chat models, LangChain agents, and Perplexity AI tools to analyze competitor features, sentiment, competitive intelligence, and generate insights.

**Nodes Involved:**  
- AI Agent  
- AI Agent1  
- AI Agent2  
- AI Agent3  
- AI Agent4  
- AI Agent5  
- Q&A Agent - Answer Questions  
- Message a model  
- Perplexity - Features & Product Intelligence  
- Perplexity - Competitive Intelligence  
- Perplexity - Reviews & Complaints  
- Perplexity - Ratings & Sentiment  
- Message a model in Perplexity  
- Think, Think1, Think2, Think3, Think4, Think5 (ToolThink nodes)  
- Anthropic Chat Model, Anthropic Chat Model1...6  

**Node Details:**  

- **AI Agent / AI Agent1 ... AI Agent5**  
  - Type: LangChain Agent nodes  
  - Role: Perform AI-driven analysis and synthesis on different facets of competitive data. Each agent specializes in a particular data aspect or type of analysis.  
  - Configuration: Connected to Anthropic Chat Models; receive structured inputs for context.  
  - Input: Outputs from Merge nodes or Think tool nodes  
  - Output: Processed insights to Merge or next processing steps.  
  - Edge Cases: AI model rate limits, malformed inputs, ambiguous outputs.

- **Q&A Agent - Answer Questions**  
  - Type: LangChain Agent specialized for Q&A  
  - Role: Handles question-answering related to competitor and internal data queries.  
  - Configuration: Uses Anthropic Chat Model2 for language understanding.  
  - Input: Queries from Get Competitor Page, Get Our Page, Get Competitor URL, Slack Tool message, or Perplexity Tool.  
  - Output: Answers passed to subsequent AI agents or Slack notifications.  
  - Edge Cases: Insufficient data for answering, timeout.

- **Message a model / Message a model in Perplexity**  
  - Type: Perplexity nodes (AI query tool)  
  - Role: Query Perplexity AI for competitive intelligence, features, sentiment, and complaints data.  
  - Configuration: Multiple Perplexity nodes focus on different data types (features, competitive intelligence, reviews, ratings).  
  - Input: Text or query parameters from upstream nodes.  
  - Output: Data forwarded to JavaScript processing nodes or merged.  
  - Edge Cases: API key invalid, rate limits, query errors.

- **Think, Think1, Think2, Think3, Think4, Think5**  
  - Type: LangChain ToolThink nodes  
  - Role: Intermediate processing tools that invoke AI Agents for reasoning or data refinement.  
  - Configuration: Each Think node connects to an AI Agent for further analysis.  
  - Input: Prior AI Agent outputs or merged data.  
  - Output: Results fed back into AI Agent nodes or Merge for further synthesis.  
  - Edge Cases: AI model failure, cyclic dependencies.

- **Anthropic Chat Model, Anthropic Chat Model1...6**  
  - Type: Anthropic LM Chat models  
  - Role: Provide language model capabilities to AI Agents. Each model instance is tied to a specific AI Agent or Q&A node.  
  - Configuration: Uses Anthropic API credentials configured in n8n.  
  - Input: AI Agent prompts  
  - Output: Language model responses.  
  - Edge Cases: API quota limits, model latency.

- **Merge**  
  - Type: Merge node  
  - Role: Consolidates AI Agent outputs from multiple analysis streams into unified battlecard data.  
  - Configuration: Merges multiple AI Agent outputs by data index.  
  - Input: Outputs from AI Agent1, AI Agent2, AI Agent3, AI Agent4, AI Agent5  
  - Output: Unified data to "Code in JavaScript4" for final formatting.  
  - Edge Cases: Data mismatch, missing AI Agent outputs.

---

#### 1.5 Battlecard Generation & Storage

**Overview:**  
Compiles the final battlecard content and inserts it into Notion as a new database page; logs the creation event in a data table and notifies Slack.

**Nodes Involved:**  
- Code in JavaScript4  
- Create a database page  
- Insert row  
- Send Battlecard Created  

**Node Details:**  

- **Code in JavaScript4**  
  - Type: Code node (JavaScript)  
  - Role: Formats merged AI Agent outputs into the desired battlecard data structure compatible with Notion database schema.  
  - Configuration: Custom JavaScript code to construct Notion page properties and content blocks.  
  - Input: Merged AI Agent data  
  - Output: Formatted data to "Create a database page".  
  - Edge Cases: Data formatting errors, missing required fields.

- **Create a database page**  
  - Type: Notion node  
  - Role: Creates a new page in the Notion database representing the generated battlecard.  
  - Configuration: Uses Notion API with configured credentials; requires database ID and page properties.  
  - Input: Formatted battlecard data from Code node.  
  - Output: Newly created Notion page data to "Insert row".  
  - Edge Cases: Permission denied, API quota exceeded.

- **Insert row**  
  - Type: Data Table node  
  - Role: Inserts a new row in an internal data table to log the battlecard creation event or metadata.  
  - Configuration: Connects to the data table with appropriate fields for logging.  
  - Input: Notion page creation confirmation data.  
  - Output: Passes control to Slack notification node.  
  - Edge Cases: Data table write failure.

- **Send Battlecard Created**  
  - Type: Slack node  
  - Role: Sends a notification message to Slack informing that the battlecard has been successfully created.  
  - Configuration: Uses Slack webhook or bot credentials; message includes relevant battlecard details.  
  - Input: Log entry confirmation.  
  - Output: Final output of workflow.  
  - Edge Cases: Slack API failure, message formatting errors.

---

#### 1.6 Notification & Error Handling

**Overview:**  
Sends Slack messages for updates or errors encountered during workflow execution, ensuring visibility into workflow status.

**Nodes Involved:**  
- Update Status - Error  
- Switch  
- Send a message in Slack  

**Node Details:**  

- **Switch**  
  - Type: Switch node  
  - Role: Routes workflow based on processing results or error states to appropriate next steps (answer questions, message model, or error update).  
  - Configuration: Condition-based routing evaluating output flags or error codes.  
  - Input: Output from Code in JavaScript1 (post initial AI Agent processing)  
  - Output: Sends to Q&A Agent, Perplexity Message node, or Slack error update.  
  - Edge Cases: Misrouted data, unhandled conditions.

- **Update Status - Error**  
  - Type: Slack node  
  - Role: Posts error messages to a designated Slack channel for monitoring failures.  
  - Configuration: Slack webhook; message contains error details.  
  - Input: Routed from Switch node on error condition.  
  - Output: End of error path.  
  - Edge Cases: Slack API issues.

- **Send a message in Slack**  
  - Type: Slack Tool node  
  - Role: Sends general messages to Slack, such as intermediate status updates or replies from Q&A Agent.  
  - Configuration: Uses Slack credentials; dynamic message content.  
  - Input: From Q&A Agent or other AI nodes.  
  - Output: Continues workflow or ends.  
  - Edge Cases: Message delivery failures.

---

### 3. Summary Table

| Node Name                      | Node Type                      | Functional Role                               | Input Node(s)                          | Output Node(s)                         | Sticky Note                                                                                     |
|--------------------------------|--------------------------------|----------------------------------------------|--------------------------------------|---------------------------------------|------------------------------------------------------------------------------------------------|
| Slack Trigger - Competitor Mention | Slack Trigger                  | Entry trigger on competitor mention in Slack | -                                    | Code in JavaScript2                    |                                                                                                |
| When chat message received      | LangChain Chat Trigger          | Entry trigger for chat messages               | -                                    | AI Agent                              |                                                                                                |
| Get Competitor Page             | Notion Tool                    | Fetch competitor Notion page                   | -                                    | Q&A Agent - Answer Questions          |                                                                                                |
| Get Our Page                   | Notion Tool                    | Fetch internal Notion page                     | -                                    | Q&A Agent - Answer Questions          |                                                                                                |
| Get Competitor URL             | Data Table Tool                | Get competitor URLs from data table            | -                                    | Q&A Agent - Answer Questions          |                                                                                                |
| Get row(s) in Data table       | Data Table Tool                | Retrieve relevant data rows                     | -                                    | AI Agent                             |                                                                                                |
| Read URL content               | Jina AI Content Reader          | Extract content from URL                        | -                                    | Merge3                               |                                                                                                |
| Read URL content1              | Jina AI Content Reader          | Extract content from URL                        | -                                    | Merge3                               |                                                                                                |
| Read URL content2              | Jina AI Content Reader          | Extract content from URL                        | -                                    | Merge3                               |                                                                                                |
| Read URL content3              | Jina AI Content Reader          | Extract content from URL                        | -                                    | Merge3                               |                                                                                                |
| Merge3                        | Merge                          | Aggregate multiple extracted content streams  | Read URL content, content1, content2, content3 | Code in JavaScript                    |                                                                                                |
| Code in JavaScript             | Code (JavaScript)               | Process and prepare aggregated content         | Merge3                               | AI Agent1, AI Agent2, AI Agent3, AI Agent4, AI Agent5 |                                                                                                |
| AI Agent                      | LangChain Agent                | Analyze input and generate insights            | When chat message received, Get row(s) in Data table | Code in JavaScript1                  |                                                                                                |
| AI Agent1                     | LangChain Agent                | AI analysis part 1                             | Code in JavaScript                   | Merge                                |                                                                                                |
| AI Agent2                     | LangChain Agent                | AI analysis part 2                             | Code in JavaScript                   | Merge                                |                                                                                                |
| AI Agent3                     | LangChain Agent                | AI analysis part 3                             | Code in JavaScript                   | Merge                                |                                                                                                |
| AI Agent4                     | LangChain Agent                | AI analysis part 4                             | Code in JavaScript                   | Merge                                |                                                                                                |
| AI Agent5                     | LangChain Agent                | AI analysis part 5                             | Code in JavaScript                   | Merge                                |                                                                                                |
| Q&A Agent - Answer Questions    | LangChain Agent                | Answer questions based on competitor/internal data | Get Competitor Page, Get Our Page, Get Competitor URL, Send a message in Slack, Message a model in Perplexity | Send a message in Slack, AI Agent     |                                                                                                |
| Message a model                 | Perplexity                    | Query Perplexity AI for intelligence           | Switch                              | Code in JavaScript3                  |                                                                                                |
| Perplexity - Features & Product Intelligence | Perplexity                   | Get product & feature intelligence            | Code in JavaScript3                 | Merge3                              |                                                                                                |
| Perplexity - Competitive Intelligence | Perplexity                   | Get competitive intelligence data              | Code in JavaScript3                 | Merge3                              |                                                                                                |
| Perplexity - Reviews & Complaints | Perplexity                   | Get reviews and complaints data                 | Code in JavaScript3                 | Merge3                              |                                                                                                |
| Perplexity - Ratings & Sentiment | Perplexity                   | Get ratings and sentiment data                   | Code in JavaScript3                 | Merge3                              |                                                                                                |
| Message a model in Perplexity   | Perplexity Tool               | Send queries to Perplexity AI                   | -                                  | Q&A Agent - Answer Questions          |                                                                                                |
| Think, Think1, Think2, Think3, Think4, Think5 | LangChain ToolThink          | Invoke AI Agents for reasoning and refinement | Various AI Agent outputs             | AI Agent1 - AI Agent5, Q&A Agent     |                                                                                                |
| Anthropic Chat Model, Chat Model1...6 | Anthropic LM Chat           | Natural language model for AI Agents            | AI Agent prompts                    | AI Agent outputs                    |                                                                                                |
| Merge                         | Merge                          | Combine outputs from multiple AI Agents         | AI Agent1, AI Agent2, AI Agent3, AI Agent4, AI Agent5 | Code in JavaScript4                  |                                                                                                |
| Code in JavaScript1            | Code (JavaScript)               | Post AI Agent processing, route via Switch      | AI Agent                           | Switch                              |                                                                                                |
| Switch                        | Switch                        | Route output based on condition                  | Code in JavaScript1                 | Q&A Agent, Message a model, Update Status - Error |                                                                                                |
| Code in JavaScript3            | Code (JavaScript)               | Prepare Perplexity queries and handle multiple inputs | Message a model                    | Perplexity nodes                    |                                                                                                |
| Code in JavaScript2            | Code (JavaScript)               | Process Slack trigger data                        | Slack Trigger - Competitor Mention  | AI Agent                           |                                                                                                |
| Code in JavaScript4            | Code (JavaScript)               | Format final battlecard data for Notion          | Merge                              | Create a database page              |                                                                                                |
| Create a database page         | Notion                        | Insert battlecard as a new Notion page           | Code in JavaScript4                 | Insert row                         |                                                                                                |
| Insert row                    | Data Table                    | Log battlecard creation event                     | Create a database page              | Send Battlecard Created            |                                                                                                |
| Send Battlecard Created        | Slack                         | Notify Slack channel about created battlecard    | Insert row                        | -                                  |                                                                                                |
| Update Status - Error          | Slack                         | Send error notification to Slack                  | Switch                            | -                                  |                                                                                                |
| Send a message in Slack        | Slack Tool                    | Send messages or replies in Slack                  | Q&A Agent, other AI nodes          | -                                  |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Slack Trigger node ("Slack Trigger - Competitor Mention")**  
   - Type: Slack Trigger  
   - Configure Slack webhook to listen for competitor mentions in the targeted Slack workspace/channel.

2. **Create LangChain Chat Trigger node ("When chat message received")**  
   - Type: LangChain Chat Trigger  
   - Configure webhook URL for chat message events.

3. **Create Notion Tool nodes:**  
   - "Get Competitor Page": Configure to fetch competitor pages from your Notion database using competitor identifiers.  
   - "Get Our Page": Configure to fetch internal reference page from Notion.  
   - "Get Competitor URL": Use Data Table Tool to retrieve competitor URLs from your stored data table.

4. **Create Data Table Tool node ("Get row(s) in Data table")**  
   - Configure to retrieve relevant data rows for AI processing.

5. **Create multiple Jina AI nodes ("Read URL content" nodes)**  
   - Four instances, each configured to read content from one competitor URL.  
   - Set "onError" behavior to "continueRegularOutput" to avoid workflow failure on errors.

6. **Create Merge node ("Merge3")**  
   - Configure to aggregate inputs from all four URL content readers.

7. **Create Code node ("Code in JavaScript")**  
   - Write JavaScript to process the merged content and prepare inputs for AI Agents.

8. **Create multiple LangChain Agent nodes ("AI Agent1" through "AI Agent5")**  
   - Configure each with Anthropic Chat Models tailored for different analysis aspects (e.g., sentiment, feature intelligence).  
   - Connect outputs from "Code in JavaScript" to all AI Agents.

9. **Create Anthropic Chat Model nodes**  
   - One per AI Agent, configure API credentials and model parameters.

10. **Create Merge node ("Merge")**  
    - Combine AI Agent outputs into a single data set.

11. **Create Code node ("Code in JavaScript4")**  
    - Format the merged AI Agent output into Notion page properties and content.

12. **Create Notion node ("Create a database page")**  
    - Configure to create a new page in the designated Notion database for battlecards.  
    - Use the formatted data from the previous code node.

13. **Create Data Table node ("Insert row")**  
    - Configure to log battlecard creation metadata.

14. **Create Slack node ("Send Battlecard Created")**  
    - Configure to notify relevant Slack channels/users of the new battlecard.

15. **Create LangChain Agent node ("Q&A Agent - Answer Questions")**  
    - Configure to handle queries related to competitor and internal data.  
    - Connect inputs from Notion Tool nodes and Slack Tool nodes.

16. **Create Slack Tool node ("Send a message in Slack")**  
    - Configure to send messages or replies based on Q&A Agent output.

17. **Create Perplexity nodes:**  
    - For Features & Product Intelligence, Competitive Intelligence, Reviews & Complaints, Ratings & Sentiment.  
    - Configure API credentials and input query templates.

18. **Create Code nodes ("Code in JavaScript3" and others)**  
    - Prepare queries to Perplexity nodes and handle their multi-source inputs.

19. **Create Switch node ("Switch")**  
    - Configure routing logic based on processing results or error states to route to Q&A Agent, Perplexity message node, or Slack error update.

20. **Create Slack node ("Update Status - Error")**  
    - Configure to post errors to Slack monitoring channel.

21. **Create ToolThink nodes ("Think", "Think1", ... "Think5")**  
    - Connect each to corresponding AI Agent nodes for intermediate reasoning.

22. **Create Code nodes ("Code in JavaScript1", "Code in JavaScript2")**  
    - For processing Slack trigger data and routing AI Agent outputs.

23. **Connect all nodes as per the logical flows described in section 1 and 2**, ensuring correct sequencing and data passing.

24. **Configure all API credentials:**  
    - Slack (bot or webhook)  
    - Notion (integration with required permissions)  
    - Anthropic API keys  
    - Perplexity API key  
    - Jina AI credentials if required

25. **Test the workflow end-to-end with sample competitor mentions in Slack, verifying each stage and Slack notifications, Notion page creation, and data table logging.**

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                                                                 |
|--------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow serves as a Klue alternative for automated competitive battlecard generation.      | Branding context                                                                                 |
| For more on LangChain agents, see https://docs.n8n.io/integrations/ai/langchain/                  | Official n8n LangChain documentation                                                            |
| Anthropic API integration requires registration and API key management at https://www.anthropic.com/ | AI model provider for language processing                                                      |
| Perplexity nodes depend on Perplexity AI's API and are used here for diverse competitive insights | https://www.perplexity.ai/                                                                       |
| Jina AI nodes extract content from competitor URLs; ensure URLs are accessible and content-rich. | https://docs.n8n.io/integrations/ai/jinaai/                                                    |
| Slack triggers and notifications require bot token with appropriate channel and event permissions | https://api.slack.com/bot-users                                                                  |
| Notion integration requires database and page read/write permissions with OAuth or integration token | https://developers.notion.com/                                                                   |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.