AI-Powered Telegram Bot for Data Extraction with Bright Data MCP

https://n8nworkflows.xyz/workflows/ai-powered-telegram-bot-for-data-extraction-with-bright-data-mcp-4116


# AI-Powered Telegram Bot for Data Extraction with Bright Data MCP

### 1. Workflow Overview

This workflow implements an AI-powered Telegram bot designed to extract data by leveraging Bright Data's MCP (Massive Computing Platform) tool integrated within an AI agent. It is targeted at users needing automated data extraction and web scraping facilitated by conversational AI through Telegram. The workflow is structured into the following logical blocks:

- **1.1 Telegram Webhook Setup and Message Reception:** Configures and receives incoming Telegram messages via webhook, enabling real-time bot interaction.
- **1.2 AI Agent Processing with Langchain:** Processes the received message through an AI agent configured with memory, language model, and the MCP tool to perform data extraction and web automation.
- **1.3 Typing Action Loop:** Simulates Telegram typing action in a loop while the AI agent processes the query to enhance user experience.
- **1.4 Result Delivery and Error Handling:** Sends the AI agent’s output back to the user via Telegram or replies with an error message if execution fails.
- **1.5 Sub-Workflow Execution:** Invokes a sub-workflow to trigger the typing action asynchronously, decoupling UI feedback from AI processing.

---

### 2. Block-by-Block Analysis

#### 1.1 Telegram Webhook Setup and Message Reception

- **Overview:**  
This block sets up the Telegram webhook to receive incoming messages and triggers the workflow upon user interaction.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Set Telegram Webhook (HTTP Request)  
  - Receive Message Trigger from Telegram (Webhook)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Initiates workflow manually for testing webhook setup.  
    - Config: No parameters.  
    - Inputs: None  
    - Outputs: Connects to Set Telegram Webhook node.  
    - Edge Cases: None inherent.  
    - Sub-workflow: None.

  - **Set Telegram Webhook**  
    - Type: HTTP Request  
    - Role: Registers the webhook URL with Telegram Bot API to enable message reception.  
    - Config:  
      - URL: `https://api.telegram.org/bot<your-api-token>/setWebhook` (placeholder to be replaced)  
      - Body Parameters: URL of the workflow webhook endpoint (to be replaced)  
    - Inputs: Triggered by manual trigger.  
    - Outputs: None connected.  
    - Edge Cases: Invalid API token, incorrect webhook URL, Telegram API downtime.

  - **Receive Message Trigger from Telegram**  
    - Type: Webhook  
    - Role: Listens for incoming POST requests from Telegram with user messages.  
    - Config:  
      - Path: unique webhook identifier  
      - HTTP Method: POST  
    - Inputs: External HTTP POST from Telegram.  
    - Outputs: Routes to AI Agent and Sub-workflow to trigger typing action.  
    - Edge Cases: Incorrect webhook setup, malformed Telegram requests, network issues.

#### 1.2 AI Agent Processing with Langchain

- **Overview:**  
Processes incoming text messages using an AI agent integrated with a language model, memory buffer, and MCP client tool for web scraping and automation.

- **Nodes Involved:**  
  - AI Agent  
  - Simple Memory  
  - OpenRouter Chat Model  
  - MCP Client

- **Node Details:**

  - **AI Agent**  
    - Type: Langchain Agent Node  
    - Role: Core AI processing node interpreting Telegram messages and orchestrating tool usage.  
    - Config:  
      - Input Text: Extracted from incoming Telegram message (`{{ $json.body.message.text }}`)  
      - Options: System message instructs it to run MCP tool for web-related tasks  
      - Prompt Type: Defined prompt  
    - Inputs: Receives message text and AI memory, language model, and MCP tool as ai_memory, ai_languageModel, and ai_tool inputs respectively.  
    - Outputs: Outputs AI-generated response routed to Telegram message sender.  
    - Edge Cases: Expression errors, AI model API failures, MCP tool timeout, malformed input text.

  - **Simple Memory**  
    - Type: Langchain Memory Buffer Window  
    - Role: Maintains session memory per chat to provide context to AI agent.  
    - Config:  
      - Session Key: Chat ID from Telegram message (`{{ $json.body.message.chat.id }}`)  
      - Session ID Type: Custom key  
    - Inputs: Passes memory context to AI Agent.  
    - Outputs: Connects to AI Agent’s ai_memory input.  
    - Edge Cases: Memory overflow, session key missing or invalid.

  - **OpenRouter Chat Model**  
    - Type: Langchain OpenRouter Chat Model  
    - Role: Provides the underlying language model (Anthropic Claude 3.7 Sonnet) for AI agent.  
    - Config:  
      - Model: `anthropic/claude-3.7-sonnet`  
      - Credentials: OpenRouter API credentials required  
    - Inputs: Connected to AI Agent’s ai_languageModel input.  
    - Outputs: Feeds processed language model output to AI Agent.  
    - Edge Cases: API key expiration, model unavailability, rate limits.

  - **MCP Client**  
    - Type: Langchain MCP Client Tool  
    - Role: Enables AI agent to perform web scraping and browser automation via Bright Data MCP.  
    - Config:  
      - SSE Endpoint: `http://localhost:8000` (assumed local MCP SSE server)  
    - Inputs: Connects as AI tool input to AI Agent.  
    - Outputs: Provides data extraction capabilities to AI Agent.  
    - Edge Cases: SSE server offline, network issues, misconfigured endpoint.

#### 1.3 Typing Action Loop

- **Overview:**  
Maintains Telegram “typing” status in a loop while the AI agent processes the user query to simulate live typing feedback.

- **Nodes Involved:**  
  - Typing action (Telegram node)  
  - Wait for the typing action to finish by 10 seconds (Wait node)  
  - Check if the execution in N8N is finished (N8N node)  
  - If the N8N execution is finished (If node)  
  - Check if the N8N status is success (If node)  
  - Sub-workflow to trigger Typing Action (Execute Workflow)

- **Node Details:**

  - **Sub-workflow to trigger Typing Action**  
    - Type: Execute Workflow  
    - Role: Asynchronously triggers the typing action sub-workflow to avoid blocking main flow.  
    - Config:  
      - Workflow ID: References another workflow named "Basic Bright Data MCP"  
      - Inputs: Passes current chat ID and execution ID for status tracking  
      - Mode: Each (handles multiple items if present)  
      - Wait For Sub-Workflow: False (asynchronous)  
    - Inputs: Receives Telegram message body.  
    - Outputs: None connected.  
    - Edge Cases: Sub-workflow missing, input type mismatches.

  - **Typing action**  
    - Type: Telegram node (sendChatAction)  
    - Role: Sends “typing” action to Telegram chat to indicate bot is typing.  
    - Config:  
      - Chat ID: From “Trigger by the main workflow” node chatId  
      - Operation: sendChatAction  
    - Inputs: Triggered from main workflow.  
    - Outputs: Connects to Wait node.  
    - Edge Cases: Invalid chat ID, Telegram API errors.

  - **Wait for the typing action to finish by 10 seconds**  
    - Type: Wait node  
    - Role: Pauses the workflow 10 seconds to match Telegram typing action duration.  
    - Config: Fixed 10 seconds wait.  
    - Inputs: From Typing action node.  
    - Outputs: Connects to Check execution node.  
    - Edge Cases: Unexpected delays, workflow timeout.

  - **Check if the execution in N8N is finished**  
    - Type: n8n API node  
    - Role: Polls the status of the current main workflow execution by execution ID.  
    - Config:  
      - Operation: Get execution status  
      - Execution ID: Passed from main workflow inputs  
    - Inputs: From Wait node.  
    - Outputs: Connects to If node “If the N8N execution is finished”.  
    - Edge Cases: Execution ID invalid, API authentication failure.

  - **If the N8N execution is finished**  
    - Type: If node  
    - Role: Checks if the workflow execution has finished.  
    - Config: Condition is boolean false on `finished` property (i.e., continue loop if not finished).  
    - Inputs: From Check execution node.  
    - Outputs:  
      - True: Loop back to Typing action node to continue typing action.  
      - False: Proceed to check execution success status node.  
    - Edge Cases: Unexpected data format.

  - **Check if the N8N status is success**  
    - Type: If node  
    - Role: Verifies if the workflow execution status is “success”.  
    - Config: Condition checks if `status` is not equal to “success”.  
    - Inputs: From If node.  
    - Outputs:  
      - True (status not success): Routes to Reply Error Message node.  
      - False (status success): Ends loop without error.  
    - Edge Cases: Status property missing or unexpected values.

#### 1.4 Result Delivery and Error Handling

- **Overview:**  
Sends the AI agent’s final message back to the Telegram user or replies with an error message if the process failed.

- **Nodes Involved:**  
  - Send AI’s output to the user via Telegram  
  - Reply Error Message  
  - Sticky Note4 (comment node)

- **Node Details:**

  - **Send AI’s output to the user via Telegram**  
    - Type: Telegram node (sendMessage)  
    - Role: Sends the AI agent's response text back to the Telegram chat.  
    - Config:  
      - Text: Bound to AI Agent output `{{ $json.output }}`  
      - Chat ID: From Telegram message chat ID  
      - Append Attribution: False (no extra attribution text)  
    - Inputs: From AI Agent node.  
    - Outputs: None connected.  
    - Edge Cases: Invalid chat ID, Telegram API rate limits, message size limits.

  - **Reply Error Message**  
    - Type: Telegram node (sendMessage)  
    - Role: Notifies the user about bot errors.  
    - Config:  
      - Text: Static error message "There's an error with the bot. Please try again later."  
      - Chat ID: From main workflow chat ID  
      - Append Attribution: False  
    - Inputs: From Check if N8N status is success node failure branch.  
    - Outputs: None connected.  
    - Edge Cases: Telegram API issues, invalid chat ID.

  - **Sticky Note4**  
    - Type: Sticky Note  
    - Role: Documentation node explaining error response behavior.  
    - Content: "Reply error message to the user on error."

#### 1.5 Supporting Nodes and Flow Control

- **Overview:**  
Additional nodes support workflow triggering and provide instructional comments.

- **Nodes Involved:**  
  - Trigger by the main workflow (Execute Workflow Trigger)  
  - Sticky Note, Sticky Note1, Sticky Note2, Sticky Note3 (Documentation)

- **Node Details:**

  - **Trigger by the main workflow**  
    - Type: Execute Workflow Trigger  
    - Role: Entry point for sub-workflows or internal triggers, passing execution ID and chat ID.  
    - Config: Workflow inputs for executionId (string) and chatId (number).  
    - Inputs: External trigger.  
    - Outputs: To Typing action node.  
    - Edge Cases: Missing inputs, type mismatch.

  - **Sticky Notes**  
    - Role: Provide contextual and instructional information for setting up webhook, AI agent with MCP, typing loop, and Telegram message sending.  
    - Positioned across the canvas to explain major blocks.

---

### 3. Summary Table

| Node Name                          | Node Type                              | Functional Role                                | Input Node(s)                     | Output Node(s)                          | Sticky Note                                                                                      |
|-----------------------------------|--------------------------------------|------------------------------------------------|----------------------------------|----------------------------------------|------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’      | Manual Trigger                       | Manual start for webhook setup                  | None                             | Set Telegram Webhook                   | "Setup telegram hook using the HTTP node below. Replace the api key placeholder in the URL field of the node. Replace the URL with the one generated from the Webhook trigger node." |
| Set Telegram Webhook               | HTTP Request                        | Registers Telegram webhook URL                   | When clicking ‘Test workflow’    | None                                  | Same as above                                                                                   |
| Receive Message Trigger from Telegram | Webhook                            | Receives Telegram messages                        | External Telegram POST           | AI Agent, Sub-workflow to trigger Typing Action |                                                                                               |
| AI Agent                         | Langchain Agent                      | Processes user messages with AI and MCP tool    | Receive Message Trigger from Telegram, Simple Memory, OpenRouter Chat Model, MCP Client | Send AI’s output to the user via Telegram    | "AI Agent with Bright Data MCP as a tool. Host your SSE server using Supergateway or similar tools. Please check the template’s description for more instruction to setup the SSE from STDIO command. Then paste the SSE endpoint in the MCP tool below." |
| Simple Memory                    | Langchain Memory Buffer Window       | Maintains session memory                          | Receive Message Trigger from Telegram | AI Agent (ai_memory input)            |                                                                                               |
| OpenRouter Chat Model            | Langchain OpenRouter Chat Model      | Provides language model for AI Agent             | None                             | AI Agent (ai_languageModel input)     |                                                                                               |
| MCP Client                      | Langchain MCP Client Tool             | Connects AI agent to Bright Data MCP for scraping| None                             | AI Agent (ai_tool input)               | Same as AI Agent sticky note                                                                  |
| Sub-workflow to trigger Typing Action | Execute Workflow                  | Starts typing action sub-workflow asynchronously | Receive Message Trigger from Telegram | None                              |                                                                                               |
| Typing action                   | Telegram                             | Sends 'typing...' action to Telegram chat        | Trigger by the main workflow or If node | Wait for the typing action to finish by 10 seconds | "Loop the typing action in Telegram. Typing action lasts for 10 seconds only, so while the agent is still processing query, execute this tool in a loop until it succeed" |
| Wait for the typing action to finish by 10 seconds | Wait                    | Waits 10 seconds matching Telegram typing time  | Typing action                   | Check if the execution in N8N is finished | Same as Typing action sticky note                                                            |
| Check if the execution in N8N is finished | n8n API Node                   | Polls workflow execution status                   | Wait for the typing action to finish by 10 seconds | If the N8N execution is finished     |                                                                                               |
| If the N8N execution is finished | If Node                             | Checks if execution is finished                    | Check if the execution in N8N is finished | Typing action (loop) or Check if the N8N status is success |                                                                                               |
| Check if the N8N status is success | If Node                            | Checks if workflow finished successfully          | If the N8N execution is finished | Reply Error Message (on failure)       |                                                                                               |
| Send AI’s output to the user via Telegram | Telegram                       | Sends AI response to Telegram user                 | AI Agent                       | None                                  | "Send the agent's message via Telegram Bot"                                                  |
| Reply Error Message             | Telegram                            | Sends error message to Telegram user              | Check if the N8N status is success | None                                  | "Reply error message to the user on error"                                                   |
| Trigger by the main workflow    | Execute Workflow Trigger            | Entry point for typing action sub-workflow       | None                          | Typing action                        |                                                                                               |
| Sticky Note                    | Sticky Note                         | Documentation                                      | None                          | None                                  | See individual sticky note content above                                                    |
| Sticky Note1                   | Sticky Note                         | Documentation                                      | None                          | None                                  | See AI Agent sticky note content above                                                      |
| Sticky Note2                   | Sticky Note                         | Documentation                                      | None                          | None                                  | See Send AI’s output sticky note content above                                              |
| Sticky Note3                   | Sticky Note                         | Documentation                                      | None                          | None                                  | See Typing action sticky note content above                                                |
| Sticky Note4                   | Sticky Note                         | Documentation                                      | None                          | None                                  | "Reply error message to the user on error"                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: When clicking ‘Test workflow’  
   - Type: Manual Trigger  
   - No parameters needed.

2. **Create HTTP Request Node**  
   - Name: Set Telegram Webhook  
   - Type: HTTP Request  
   - Configure URL: `https://api.telegram.org/bot<your-api-token>/setWebhook` (replace `<your-api-token>`)  
   - Method: POST  
   - Body Parameters: JSON with key `"url"` set to your workflow’s webhook URL.  
   - Connect trigger: From Manual Trigger node.

3. **Create Webhook Node**  
   - Name: Receive Message Trigger from Telegram  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Generate unique path (auto-generated or custom)  
   - No authentication (Telegram sends POST)  
   - This node listens for Telegram updates.

4. **Create Langchain Agent Node**  
   - Name: AI Agent  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Parameters:  
     - Text: `={{ $json.body.message.text }}`  
     - System Message: "You are a helpful assistant. Run the MCP tool when dealing with the web search, scraping, and browser automation."  
     - Prompt Type: Define  
   - Connect input: From "Receive Message Trigger from Telegram" node (main output)  
   - Connect ai_memory input: To Simple Memory node (to be created next)  
   - Connect ai_languageModel input: To OpenRouter Chat Model node (to be created)  
   - Connect ai_tool input: To MCP Client node (to be created).

5. **Create Langchain Memory Buffer Window Node**  
   - Name: Simple Memory  
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
   - Parameters:  
     - Session Key: `={{ $json.body.message.chat.id }}`  
     - Session ID Type: Custom Key  
   - Connect output to AI Agent node ai_memory input.

6. **Create Langchain OpenRouter Chat Model Node**  
   - Name: OpenRouter Chat Model  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenRouter`  
   - Parameters:  
     - Model: `anthropic/claude-3.7-sonnet`  
   - Set credentials: OpenRouter API credentials (must be configured in n8n)  
   - Connect output to AI Agent node ai_languageModel input.

7. **Create Langchain MCP Client Tool Node**  
   - Name: MCP Client  
   - Type: `@n8n/n8n-nodes-langchain.mcpClientTool`  
   - Parameters:  
     - SSE Endpoint: `http://localhost:8000` (or your MCP SSE server URL)  
   - Connect output to AI Agent node ai_tool input.

8. **Create Telegram Node (Send AI’s output)**  
   - Name: Send AI’s output to the user via Telegram  
   - Type: Telegram  
   - Operation: sendMessage  
   - Parameters:  
     - Text: `={{ $json.output }}` (from AI Agent output)  
     - Chat ID: `={{ $('Receive Message Trigger from Telegram').item.json.body.message.chat.id }}`  
     - Additional Fields: Append Attribution disabled  
   - Set credentials: Telegram API OAuth2 or Bot Token  
   - Connect input from AI Agent node output.

9. **Create Telegram Node (Typing action)**  
   - Name: Typing action  
   - Type: Telegram  
   - Operation: sendChatAction  
   - Parameters:  
     - Chat ID: `={{ $json.chatId }}` (from workflow input or sub-workflow)  
     - Chat Action: typing  
   - Set credentials: Telegram API  
   - This node is called repeatedly to simulate typing.

10. **Create Wait Node**  
    - Name: Wait for the typing action to finish by 10 seconds  
    - Type: Wait  
    - Parameters: Wait 10 seconds  
    - Connect input from Typing action node output.

11. **Create n8n API Node**  
    - Name: Check if the execution in N8N is finished  
    - Type: n8n node (resource: execution, operation: get)  
    - Parameters:  
      - Execution ID: `={{ $json.executionId }}` (passed from main workflow)  
    - Connect input from Wait node output.

12. **Create If Node (Execution Finished Check)**  
    - Name: If the N8N execution is finished  
    - Condition: Check if `finished` property is false  
    - If true: Loop back to Typing action node  
    - If false: Proceed to next check node.

13. **Create If Node (Execution Success Check)**  
    - Name: Check if the N8N status is success  
    - Condition: `status` not equal to `success`  
    - True branch: Connect to Reply Error Message node  
    - False branch: End loop.

14. **Create Telegram Node (Reply Error Message)**  
    - Name: Reply Error Message  
    - Type: Telegram  
    - Operation: sendMessage  
    - Parameters:  
      - Text: "There's an error with the bot. Please try again later."  
      - Chat ID: `={{ $json.chatId }}`  
      - Append Attribution: False  
    - Set credentials: Telegram API  
    - Connect input from If node failure branch.

15. **Create Execute Workflow Trigger Node**  
    - Name: Trigger by the main workflow  
    - Type: Execute Workflow Trigger  
    - Parameters: Inputs `executionId` (string) and `chatId` (number)  
    - Connect output to Typing action node input.

16. **Create Execute Workflow Node (Sub-workflow to trigger Typing Action)**  
    - Name: Sub-workflow to trigger Typing Action  
    - Type: Execute Workflow  
    - Parameters:  
      - Workflow ID: ID of the "Basic Bright Data MCP" workflow  
      - Workflow Inputs: Map `chatId` and `executionId` from incoming Telegram message  
      - Mode: Each  
      - Wait for sub-workflow: False (async)  
    - Connect input from Receive Message Trigger node (parallel to AI Agent).

17. **Add Sticky Notes**  
    - Add sticky notes with content as per documentation nodes spread across the canvas to assist future maintainers.

18. **Connect Nodes as per Workflow Connections**  
    - Ensure all nodes are connected exactly as described in the connections section above.

19. **Configure Credentials**  
    - Setup Telegram API credentials (Bot Token or OAuth2).  
    - Setup OpenRouter API credentials.  
    - Setup n8n API credentials.  
    - Ensure MCP SSE server is running and accessible at the configured endpoint.

---

### 5. General Notes & Resources

| Note Content                                                                                                            | Context or Link                                                                                               |
|-------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Host your SSE server using Supergateway or similar tools. See template description for instruction on setting up SSE.   | Bright Data MCP integration documentation                                                                    |
| Telegram typing action lasts only 10 seconds. Use looping to simulate continuous typing while AI processes queries.      | Telegram Bot API documentation                                                                                |
| Replace `<your-api-token>` and webhook URLs with your actual Telegram Bot API token and n8n webhook URL respectively.   | Telegram Bot API setup guide                                                                                   |
| OpenRouter Chat Model uses Anthropic Claude 3.7 Sonnet - ensure API access and keys are valid.                           | https://openrouter.ai                                                                                         |
| The workflow asynchronously triggers a sub-workflow for typing action to prevent blocking the main AI processing flow. | n8n Execute Workflow node docs                                                                                |
| Error handling replies a generic error message to user if AI processing fails or workflow does not complete successfully.| Best practice for user experience in Telegram bot automation                                                 |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created using n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or proprietary elements. All data handled is legal and public.