Analyze Telegram Messages with OpenAI and Send Notifications via Gmail & Telegram

https://n8nworkflows.xyz/workflows/analyze-telegram-messages-with-openai-and-send-notifications-via-gmail---telegram-3306


# Analyze Telegram Messages with OpenAI and Send Notifications via Gmail & Telegram

### 1. Workflow Overview

This workflow automates the analysis of incoming Telegram messages using an AI Agent powered by multiple tools and sends notifications via Gmail and Telegram. It is designed for teams or individuals who want to intelligently process Telegram communications and receive timely alerts with AI-generated insights.

**Target Use Cases:**  
- Customer support teams monitoring Telegram queries  
- Project managers tracking team communications  
- Tech enthusiasts automating message analysis and notifications

**Logical Blocks:**

- **1.1 Input Reception:** Listens for new Telegram messages to trigger the workflow.  
- **1.2 AI Processing:** Uses an AI Agent that integrates multiple MCP tools (OpenAI Chat, Airbnb, Brave Search, FireCrawl) and memory to analyze the message content and generate responses.  
- **1.3 Notification Dispatch:** Sends the AI-generated insights as notifications via Gmail and Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block captures incoming Telegram messages to initiate the workflow.

**Nodes Involved:**  
- Listen for Telegram Updates

**Node Details:**

- **Listen for Telegram Updates**  
  - Type: Telegram Trigger  
  - Role: Listens for new Telegram messages (updates of type "message") to start the workflow.  
  - Configuration: Uses a Telegram bot token credential; configured to trigger on "message" updates only.  
  - Inputs: None (trigger node)  
  - Outputs: Passes the Telegram message JSON to the next node.  
  - Edge Cases:  
    - Telegram API connectivity issues or invalid bot token may cause trigger failure.  
    - Large message volumes could cause webhook rate limits.  
  - Notes: Requires Telegram bot token with appropriate permissions.

---

#### 2.2 AI Processing

**Overview:**  
This core block analyzes the Telegram message text using an AI Agent that orchestrates multiple tools to provide comprehensive responses.

**Nodes Involved:**  
- Analyze Message with AI  
- OpenAI Chat Model  
- Airbnb Search  
- Airbnb Execute  
- Brave Search  
- Brave Execute  
- FireCrawl List  
- FireCrawl Execute  
- Simple Memory

**Node Details:**

- **Analyze Message with AI**  
  - Type: LangChain Agent  
  - Role: Central AI Agent that receives the Telegram message text and decides which tool(s) to use for processing based on the query.  
  - Configuration:  
    - Input text: Extracted from Telegram message (`$json.message.text`).  
    - System message: Detailed instructions defining the AI’s role, tool usage, response formatting, error handling, and tone.  
    - Tools integrated: OpenAI Chat Model, Airbnb Search & Execute, Brave Search & Execute, FireCrawl List & Execute, Simple Memory.  
  - Inputs: Telegram message text from "Listen for Telegram Updates"  
  - Outputs: AI-generated response text passed to notification nodes.  
  - Expressions: Uses `$fromAI()` expressions to dynamically select tools and parameters based on AI decisions.  
  - Edge Cases:  
    - Tool failures (e.g., Airbnb API down) trigger fallback logic to alternative tools (e.g., Brave Search).  
    - Ambiguous queries prompt polite clarification requests.  
    - No relevant memory context handled gracefully.  
  - Version: LangChain Agent node v1.8  
  - Notes: This node orchestrates all MCP tools and memory to provide a unified AI response.

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Provides natural language understanding and generation capabilities for conversational and reasoning tasks.  
  - Configuration: Uses GPT-4o-mini model with OpenAI API credentials.  
  - Inputs: Connected as AI language model for the Agent node.  
  - Outputs: Responses fed back to the Agent.  
  - Edge Cases: API rate limits, invalid API key, or network issues.  
  - Version: 1.2

- **Airbnb Search**  
  - Type: MCP Client Tool  
  - Role: Searches Airbnb listings for accommodation-related queries.  
  - Configuration: Uses Airbnb MCP API credentials.  
  - Inputs: Invoked by Agent node when Airbnb tool is selected.  
  - Outputs: Search results returned to Agent.  
  - Edge Cases: API downtime, invalid credentials, or no results found.  
  - Version: 1

- **Airbnb Execute**  
  - Type: MCP Client Tool  
  - Role: Executes specific Airbnb tool commands as directed by the Agent.  
  - Configuration: Uses Airbnb MCP API credentials; tool name and parameters dynamically set by AI.  
  - Inputs: Invoked by Agent node.  
  - Outputs: Execution results returned to Agent.  
  - Edge Cases: Invalid commands or parameters, API errors.  
  - Version: 1

- **Brave Search**  
  - Type: MCP Client Tool  
  - Role: Performs real-time web searches for up-to-date information.  
  - Configuration: Uses Brave Search MCP API credentials.  
  - Inputs: Invoked by Agent node.  
  - Outputs: Search results returned to Agent.  
  - Edge Cases: API failures, no relevant results.  
  - Version: 1

- **Brave Execute**  
  - Type: MCP Client Tool  
  - Role: Executes specific Brave commands or scripts as requested.  
  - Configuration: Tool name and parameters dynamically set by AI; uses Brave Search credentials.  
  - Inputs: Invoked by Agent node.  
  - Outputs: Execution results returned to Agent.  
  - Edge Cases: Unsupported commands, API errors.  
  - Version: 1

- **FireCrawl List**  
  - Type: MCP Client Tool  
  - Role: Lists available FireCrawl scraping tasks or configurations.  
  - Configuration: Uses FireCrawl MCP API credentials.  
  - Inputs: Invoked by Agent node.  
  - Outputs: List data returned to Agent.  
  - Edge Cases: API errors, no tasks available.  
  - Version: 1

- **FireCrawl Execute**  
  - Type: MCP Client Tool  
  - Role: Executes web scraping tasks on specified websites.  
  - Configuration: Tool name and parameters dynamically set by AI; uses FireCrawl credentials.  
  - Inputs: Invoked by Agent node.  
  - Outputs: Scraped data returned to Agent.  
  - Edge Cases: Website blocking, scraping failures, API errors.  
  - Version: 1

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window  
  - Role: Maintains conversational context by storing and retrieving past interactions keyed by Telegram chat ID.  
  - Configuration: Session key set to Telegram chat ID (`$json.message.chat.id`), custom key session ID type.  
  - Inputs: Connected as AI memory for Agent node.  
  - Outputs: Provides context to Agent for continuity.  
  - Edge Cases: Memory overflow, missing context.  
  - Version: 1.3

---

#### 2.3 Notification Dispatch

**Overview:**  
This block sends the AI-generated analysis results as notifications to the user via Gmail and Telegram.

**Nodes Involved:**  
- Send Gmail Notification  
- Send Telegram Alert

**Node Details:**

- **Send Gmail Notification**  
  - Type: Gmail Node  
  - Role: Sends an email notification containing the AI response.  
  - Configuration:  
    - Recipient email hardcoded as "emaikuri@gmail.com".  
    - Email subject set dynamically from the original Telegram message text.  
    - Email body set to AI Agent output (`$json.output`).  
    - Uses Gmail OAuth2 credentials.  
  - Inputs: AI response from "Analyze Message with AI" node.  
  - Outputs: None (end node).  
  - Edge Cases: Gmail API auth failures, quota limits, invalid recipient email.  
  - Version: 2.1

- **Send Telegram Alert**  
  - Type: Telegram Node  
  - Role: Sends a Telegram message containing the AI response back to the original chat.  
  - Configuration:  
    - Chat ID dynamically set to the Telegram chat ID from the trigger.  
    - Message text set to AI Agent output (`$json.output`).  
    - Uses Telegram bot token credentials.  
  - Inputs: AI response from "Analyze Message with AI" node.  
  - Outputs: None (end node).  
  - Edge Cases: Telegram API errors, invalid chat ID, message length limits.  
  - Version: 1.2

---

### 3. Summary Table

| Node Name               | Node Type                           | Functional Role                          | Input Node(s)               | Output Node(s)                  | Sticky Note                                                                                          |
|-------------------------|-----------------------------------|----------------------------------------|-----------------------------|--------------------------------|----------------------------------------------------------------------------------------------------|
| Listen for Telegram Updates | Telegram Trigger                  | Trigger on new Telegram messages       | None                        | Analyze Message with AI         |                                                                                                    |
| Analyze Message with AI  | LangChain Agent                   | AI processing and tool orchestration   | Listen for Telegram Updates  | Send Telegram Alert, Send Gmail Notification |                                                                                                    |
| OpenAI Chat Model        | LangChain OpenAI Chat Model       | Natural language understanding         | Connected to Agent           | Connected to Agent             |                                                                                                    |
| Airbnb Search           | MCP Client Tool                   | Airbnb accommodation search            | Connected to Agent           | Connected to Agent             |                                                                                                    |
| Airbnb Execute          | MCP Client Tool                   | Execute Airbnb tool commands            | Connected to Agent           | Connected to Agent             |                                                                                                    |
| Brave Search            | MCP Client Tool                   | Real-time web search                    | Connected to Agent           | Connected to Agent             |                                                                                                    |
| Brave Execute           | MCP Client Tool                   | Execute Brave commands/scripts          | Connected to Agent           | Connected to Agent             |                                                                                                    |
| FireCrawl List          | MCP Client Tool                   | List FireCrawl scraping tasks           | Connected to Agent           | Connected to Agent             |                                                                                                    |
| FireCrawl Execute       | MCP Client Tool                   | Execute FireCrawl scraping tasks        | Connected to Agent           | Connected to Agent             |                                                                                                    |
| Simple Memory           | LangChain Memory Buffer Window    | Maintain conversational context         | Connected to Agent           | Connected to Agent             |                                                                                                    |
| Send Gmail Notification | Gmail Node                       | Send AI response via email              | Analyze Message with AI      | None                          |                                                                                                    |
| Send Telegram Alert     | Telegram Node                    | Send AI response via Telegram message   | Analyze Message with AI      | None                          |                                                                                                    |
| Sticky Note             | Sticky Note                      | Documentation and workflow overview     | None                        | None                          | # 🤖 AI Telegram Analysis + Alerts (📧|✉️)\n\n## 🛠️ Tools\n- 🏠 Airbnb MCP \n- 🔥 Firecrawl  MCP\n- 🦁 Brave  MCP\n\n### 👥 Ideal For\nTeams needing AI-powered Telegram message processing with cross-platform alerts (Gmail/Telegram)\n\n### 🎯 Solves\n- Manual Telegram monitoring  \n- Slow response times  \n- Unstructured message analysis  \n\n### ⚡ Workflow\n1. **⏳ Trigger** →Triggers on a Telegram update (e.g., new message) using the "Listen for Telegram Updates" node\n2. **🧠 Process** → Processes the message with the "Analyze Message with AI" node (MCP tools: OpenAI, Airbnb, Brave, FireCrawl).\n3. **📨 Notify** → Sends notifications:\n\n"Send Gmail Notification" node (📧).\n\n"Send Telegram Alert" node (✉️), including AI-generated insights.\n\n\n\n*Support teams get instant AI-summarized customer queries* |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Add a **Telegram Trigger** node named "Listen for Telegram Updates".  
   - Configure it to listen for "message" updates only.  
   - Set credentials with your Telegram bot token.  
   - This node will start the workflow on new Telegram messages.

2. **Create LangChain Agent Node**  
   - Add a **LangChain Agent** node named "Analyze Message with AI".  
   - Set the input text parameter to `{{$json.message.text}}` to receive the Telegram message text.  
   - Paste the detailed system message instructions defining the AI’s role, tool usage, response formatting, and error handling (as provided in the workflow description).  
   - Connect this node’s input to the output of "Listen for Telegram Updates".

3. **Add LangChain OpenAI Chat Model Node**  
   - Add a **LangChain OpenAI Chat Model** node named "OpenAI Chat Model".  
   - Select the GPT-4o-mini model.  
   - Set OpenAI API credentials.  
   - Connect this node as the AI language model input to the "Analyze Message with AI" node.

4. **Add MCP Client Tool Nodes for Airbnb**  
   - Add two MCP Client Tool nodes named "Airbnb Search" and "Airbnb Execute".  
   - Configure both with Airbnb MCP API credentials.  
   - Connect both nodes as AI tool inputs to the "Analyze Message with AI" node.

5. **Add MCP Client Tool Nodes for Brave**  
   - Add two MCP Client Tool nodes named "Brave Search" and "Brave Execute".  
   - Configure both with Brave Search MCP API credentials.  
   - Connect both nodes as AI tool inputs to the "Analyze Message with AI" node.

6. **Add MCP Client Tool Nodes for FireCrawl**  
   - Add two MCP Client Tool nodes named "FireCrawl List" and "FireCrawl Execute".  
   - Configure both with FireCrawl MCP API credentials.  
   - Connect both nodes as AI tool inputs to the "Analyze Message with AI" node.

7. **Add LangChain Memory Node**  
   - Add a **LangChain Memory Buffer Window** node named "Simple Memory".  
   - Set the session key to `{{$json.message.chat.id}}` and session ID type to "customKey".  
   - Connect this node as AI memory input to the "Analyze Message with AI" node.

8. **Create Gmail Node for Notifications**  
   - Add a **Gmail** node named "Send Gmail Notification".  
   - Configure it to send emails to your desired recipient (e.g., "emaikuri@gmail.com").  
   - Set the email subject dynamically to the original Telegram message text: `{{$('Listen for Telegram Updates').item.json.message.text}}`.  
   - Set the email message body to the AI Agent output: `{{$json.output}}`.  
   - Use Gmail OAuth2 credentials.  
   - Connect this node’s input to the output of "Analyze Message with AI".

9. **Create Telegram Node for Notifications**  
   - Add a **Telegram** node named "Send Telegram Alert".  
   - Set the chat ID dynamically to the Telegram chat ID from the trigger: `{{$('Listen for Telegram Updates').item.json.message.chat.id}}`.  
   - Set the message text to the AI Agent output: `{{$json.output}}`.  
   - Use Telegram bot token credentials.  
   - Connect this node’s input to the output of "Analyze Message with AI".

10. **Add Sticky Note for Documentation (Optional)**  
    - Add a **Sticky Note** node with the workflow overview and instructions for users and maintainers.

11. **Set Execution Order**  
    - Ensure the workflow triggers from "Listen for Telegram Updates" → "Analyze Message with AI" → ["Send Telegram Alert", "Send Gmail Notification"].

12. **Test the Workflow**  
    - Send a message to your Telegram bot to trigger the workflow.  
    - Verify AI analysis and notifications are sent correctly via Gmail and Telegram.

---

This completes the detailed analysis and reproduction instructions for the "Analyze Telegram Messages with OpenAI and Send Notifications via Gmail & Telegram" workflow.