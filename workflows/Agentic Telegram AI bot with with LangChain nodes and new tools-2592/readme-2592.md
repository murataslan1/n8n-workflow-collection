Agentic Telegram AI bot with with LangChain nodes and new tools

https://n8nworkflows.xyz/workflows/agentic-telegram-ai-bot-with-with-langchain-nodes-and-new-tools-2592


# Agentic Telegram AI bot with with LangChain nodes and new tools

### 1. Workflow Overview

This workflow implements an agentic Telegram AI bot integrating LangChain nodes with new n8n tools to provide advanced conversational AI capabilities, including image generation via DALL·E-3. It listens for user messages on Telegram, processes them through an AI agent that dynamically selects tools, maintains conversational context, and responds with text or images accordingly.

The workflow’s logical blocks are:

- **1.1 Input Reception:** Telegram trigger node listens for new messages and initiates processing.
- **1.2 AI Agent Processing:** The LangChain Agent node orchestrates AI interaction, invoking language models and tools based on user input.
- **1.3 Language Model Execution:** The OpenAI GPT-4o chat model generates context-aware replies.
- **1.4 Memory Management:** Window Buffer Memory node maintains conversation context per user session.
- **1.5 Image Generation Tool:** HTTP Request tool calls OpenAI’s DALL·E-3 API to generate images on demand.
- **1.6 Telegram Image Sending Tool:** Telegram node tool sends generated images back to users.
- **1.7 Final Reply Dispatch:** Telegram send node delivers the final textual response to the user.

This modular design enables flexible, context-aware AI conversations with dynamic tool usage, supporting both text and image outputs.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block captures incoming Telegram messages, triggering the workflow for each new update.

- **Nodes Involved:**  
  - Listen for incoming events

- **Node Details:**  
  - **Listen for incoming events**  
    - **Type:** Telegram Trigger node  
    - **Role:** Listens for all updates in the configured Telegram chat, including messages, commands, etc.  
    - **Configuration:**  
      - Listens to all update types (`updates: ["*"]`) for comprehensive event capture.  
      - Uses Telegram API credentials named "Chat & Sound".  
      - Provides webhook-based triggering to start workflow execution.  
    - **Inputs:** External Telegram updates via webhook.  
    - **Outputs:** Emits message JSON object including chat and user details.  
    - **Edge cases:** Telegram API rate limits, webhook misconfiguration, Telegram bot permissions issues.  
    - **Notes:** Critical entry point; ensure Telegram credentials and webhook URL are correctly set.

#### 1.2 AI Agent Processing

- **Overview:**  
  Central orchestration node interpreting user input, managing tool invocation, and generating AI-driven responses.

- **Nodes Involved:**  
  - AI Agent

- **Node Details:**  
  - **AI Agent**  
    - **Type:** LangChain Agent node  
    - **Role:** Processes input text, decides when to use language models or tools (like image generation), manages the conversation flow.  
    - **Configuration:**  
      - Input text mapped from the Telegram message: `={{ $json.message.text }}`  
      - System message template includes personalized greeting using user’s first name:  
        `"You are a helpful assistant. You are communicating with a user named {{ $json.message.from.first_name }}. Address the user by name every time. If the user asks for an image, always send the link to the image in the final reply."`  
      - Uses "define" promptType allowing custom prompt definition.  
    - **Inputs:** Receives Telegram message JSON.  
    - **Outputs:**  
      - AI-generated text response to final reply node.  
      - Tool invocation outputs to language model, memory, and tools nodes.  
    - **Edge cases:** Improper input format, failure in tool invocation, expression evaluation errors, agent logic misfires.  
    - **Notes:** The agent’s flexible tool usage allows non-linear execution flow, including image requests.

#### 1.3 Language Model Execution

- **Overview:**  
  Executes the OpenAI GPT-4o chat model to generate context-aware conversational text.

- **Nodes Involved:**  
  - OpenAI Chat Model

- **Node Details:**  
  - **OpenAI Chat Model**  
    - **Type:** LangChain OpenAI Chat Model node  
    - **Role:** Generates AI text completions using GPT-4o with specified parameters.  
    - **Configuration:**  
      - Model: `gpt-4o` (GPT-4o variant)  
      - Temperature: 0.7 (balances creativity and coherence)  
      - Frequency penalty: 0.2 (reduces repetition)  
      - Credentials: OpenAI API credentials named "Ted's Tech Talks OpenAi".  
    - **Inputs:** Receives prompt and conversation context from AI Agent.  
    - **Outputs:** Returns generated text to AI Agent.  
    - **Edge cases:** API limits, authentication failures, malformed prompts, network timeouts.

#### 1.4 Memory Management

- **Overview:**  
  Maintains conversational context using a sliding window buffer to provide stateful dialogs per user.

- **Nodes Involved:**  
  - Window Buffer Memory

- **Node Details:**  
  - **Window Buffer Memory**  
    - **Type:** LangChain Memory Buffer Window node  
    - **Role:** Stores the last 10 messages of the conversation per session key (per user chat).  
    - **Configuration:**  
      - Session key dynamically generated as:  
        `=chat_with_{{ $('Listen for incoming events').first().json.message.chat.id }}` — uniquely identifies each chat session.  
      - Context window length: 10 messages (last 10 interactions kept).  
    - **Inputs:** Receives conversation messages from AI Agent.  
    - **Outputs:** Provides memory context to AI Agent for prompt building.  
    - **Edge cases:** Session key evaluation failures, memory overflow, concurrency issues with multiple chats.

#### 1.5 Image Generation Tool

- **Overview:**  
  Calls OpenAI’s DALL·E-3 API to generate images based on user prompts when requested.

- **Nodes Involved:**  
  - Generate image in Dalle

- **Node Details:**  
  - **Generate image in Dalle**  
    - **Type:** LangChain HTTP Request Tool node  
    - **Role:** Sends POST requests to OpenAI images/generations endpoint to create images.  
    - **Configuration:**  
      - URL: `https://api.openai.com/v1/images/generations`  
      - Method: POST  
      - Authentication: pre-configured OpenAI API credentials ("Ted's Tech Talks OpenAi").  
      - Body parameters:  
        - model: `dall-e-3`  
        - prompt: dynamically passed from user input.  
      - Tool description clarifies it is called only when user requests an image.  
    - **Inputs:** Receives image prompt from AI Agent tool invocation.  
    - **Outputs:** Returns image generation response JSON including image URL(s).  
    - **Edge cases:** API quota limits, malformed prompt, network failures, invalid API key.  
    - **Notes:** Response is forwarded to Telegram node tool via agent’s scratchpad.

#### 1.6 Telegram Image Sending Tool

- **Overview:**  
  Sends generated images to Telegram users by retrieving image URLs from the agent’s internal memory.

- **Nodes Involved:**  
  - Send back an image

- **Node Details:**  
  - **Send back an image**  
    - **Type:** Telegram Node Tool  
    - **Role:** Sends a document (image) to the Telegram chat using a URL extracted from the agent’s scratchpad with `$fromAI()` expression.  
    - **Configuration:**  
      - File source: `={{ $fromAI("url", "a valid url of an image", "string", " ") }}` — extracts image URL from AI agent’s short-term memory.  
      - Chat ID: dynamically set from incoming message’s sender ID.  
      - Operation: `sendDocument` (Telegram API method to send files).  
      - Credentials: Telegram API "Chat & Sound".  
    - **Inputs:** Receives image URL from AI Agent tool output.  
    - **Outputs:** Passes control back to AI Agent.  
    - **Edge cases:** Invalid URLs, Telegram API upload errors, file size limitations, user blocking bot.

#### 1.7 Final Reply Dispatch

- **Overview:**  
  Sends the final textual reply generated by the agent back to the Telegram user.

- **Nodes Involved:**  
  - Send final reply

- **Node Details:**  
  - **Send final reply**  
    - **Type:** Telegram Send node  
    - **Role:** Sends the final text response message to the user.  
    - **Configuration:**  
      - Text content: `={{ $json.output }}` — uses the final output generated by the AI Agent.  
      - Chat ID: dynamically determined by sender’s ID from the Telegram trigger node.  
      - Appends no attribution footer.  
      - Credentials: Telegram API "Chat & Sound".  
      - On error: configured to continue execution (non-blocking errors).  
    - **Inputs:** Receives final AI Agent text output.  
    - **Outputs:** None (terminal node).  
    - **Edge cases:** Telegram message sending failures, invalid chat ID, user blocking the bot.

---

### 3. Summary Table

| Node Name               | Node Type                        | Functional Role                         | Input Node(s)              | Output Node(s)             | Sticky Note                                                                                                                   |
|-------------------------|---------------------------------|---------------------------------------|----------------------------|----------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Listen for incoming events | Telegram Trigger                | Entry point, listens for Telegram messages | —                          | AI Agent                   |                                                                                                                               |
| AI Agent                | LangChain Agent                 | Orchestrates AI processing and tool usage | Listen for incoming events | Send final reply, Send back an image, OpenAI Chat Model, Window Buffer Memory, Generate image in Dalle |                                                                                                                               |
| OpenAI Chat Model       | LangChain OpenAI Chat Model    | Generates GPT-4o conversational responses | AI Agent                   | AI Agent                   |                                                                                                                               |
| Window Buffer Memory    | LangChain Memory Buffer Window | Maintains conversation context per user session | AI Agent                   | AI Agent                   |                                                                                                                               |
| Generate image in Dalle | LangChain HTTP Request Tool    | Calls DALL·E-3 API to generate images | AI Agent                   | AI Agent                   | ## Generate an image with Dall-E-3 and send it via Telegram                                                                    |
| Send back an image      | Telegram Node Tool             | Sends generated image as Telegram document | AI Agent                   | AI Agent                   | ## Generate an image with Dall-E-3 and send it via Telegram                                                                    |
| Send final reply        | Telegram Send                  | Sends final text reply to Telegram user | AI Agent                   | —                          |                                                                                                                               |
| Sticky Note             | Sticky Note                   | Documentation note                     | —                          | —                          | ## Generate an image with Dall-E-3 and send it via Telegram                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create “Listen for incoming events” node:**  
   - Type: Telegram Trigger  
   - Configure:  
     - Select your Telegram API credentials with bot token.  
     - Set updates to listen to all (`*`).  
     - Ensure webhook is properly registered.  
   - Position: Input start node.

2. **Create “AI Agent” node:**  
   - Type: LangChain Agent  
   - Configure:  
     - Set `text` parameter: `={{ $json.message.text }}` to receive Telegram message text.  
     - Set system message:  
       `You are a helpful assistant. You are communicating with a user named {{ $json.message.from.first_name }}. Address the user by name every time. If the user asks for an image, always send the link to the image in the final reply.`  
     - Set promptType to “define”.  
   - Connect the “Listen for incoming events” node output to this node’s input.

3. **Create “OpenAI Chat Model” node:**  
   - Type: LangChain OpenAI Chat Model  
   - Configure:  
     - Model: `gpt-4o`  
     - Temperature: 0.7  
     - Frequency Penalty: 0.2  
     - Attach OpenAI API credentials.  
   - Connect “OpenAI Chat Model” node to the AI Agent node with the `ai_languageModel` connection.

4. **Create “Window Buffer Memory” node:**  
   - Type: LangChain Memory Buffer Window  
   - Configure:  
     - Session key: `=chat_with_{{ $('Listen for incoming events').first().json.message.chat.id }}` (dynamically based on chat id)  
     - Context window length: 10  
   - Connect to AI Agent node with the `ai_memory` connection.

5. **Create “Generate image in Dalle” node:**  
   - Type: LangChain HTTP Request Tool  
   - Configure:  
     - URL: `https://api.openai.com/v1/images/generations`  
     - Method: POST  
     - Authentication: Use OpenAI API credentials  
     - Body parameters:  
       - model: `dall-e-3`  
       - prompt: leave dynamic, passed from AI Agent tool invocation input.  
   - Connect to AI Agent node with the `ai_tool` connection.

6. **Create “Send back an image” node:**  
   - Type: Telegram Node Tool  
   - Configure:  
     - File: `={{ $fromAI("url", "a valid url of an image", "string", " ") }}` — extracts image URL from AI Agent scratchpad.  
     - Chat ID: `={{ $('Listen for incoming events').first().json.message.from.id }}`  
     - Operation: `sendDocument`  
     - Attach Telegram API credentials.  
   - Connect to AI Agent node with the `ai_tool` connection.

7. **Create “Send final reply” node:**  
   - Type: Telegram Send  
   - Configure:  
     - Text: `={{ $json.output }}` (final AI Agent response)  
     - Chat ID: `={{ $('Listen for incoming events').first().json.message.from.id }}`  
     - Disable append attribution.  
     - Attach Telegram API credentials.  
     - Set “On Error” to “Continue”.  
   - Connect AI Agent’s main output to this node.

8. **Sticky Note:** (optional for documentation)  
   - Add a sticky note near the image generation and sending nodes describing:  
     “Generate an image with Dall-E-3 and send it via Telegram”.

9. **Verify Credentials:**  
   - Ensure OpenAI API credentials are configured and tested.  
   - Ensure Telegram Bot API credentials are valid and bot has necessary permissions.

10. **Activate and Test:**  
    - Deploy the workflow, send messages through Telegram, test text replies and image generation requests.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                   | Context or Link                                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| This workflow uses the new n8n feature “Nodes as tools” and HTTP Request tool to enhance flexibility in AI agent workflows.                                  | https://community.n8n.io/t/review-node-as-tools-is-finally-here/57539                                           |
| The `$fromAI()` expression is used to extract data (like image URLs) from the AI Agent’s scratchpad for passing between tools.                               | https://docs.n8n.io/advanced-ai/examples/using-the-fromai-function/                                             |
| For similar workflows handling both text and voice messages, refer to the alternative Telegram AI template.                                                  | https://n8n.io/workflows/2534-telegram-ai-bot-assistant-ready-made-template-for-voice-and-text-messages/        |
| Before using, set up OpenAI and Telegram credentials carefully to avoid authentication issues.                                                                |                                                                                                                 |
| The agent’s non-deterministic tool invocation means image sending may vary; for stricter step sequences, consider the older custom workflow tool approach.   |                                                                                                                 |

---

This comprehensive documentation enables developers or AI agents to fully understand, reproduce, and customize the Telegram AI bot workflow with LangChain nodes and new n8n tools.