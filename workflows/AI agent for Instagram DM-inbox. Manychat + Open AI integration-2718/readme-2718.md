AI agent for Instagram DM/inbox. Manychat + Open AI integration

https://n8nworkflows.xyz/workflows/ai-agent-for-instagram-dm-inbox--manychat---open-ai-integration-2718


# AI agent for Instagram DM/inbox. Manychat + Open AI integration

### 1. Workflow Overview

This workflow automates Instagram Direct Message (DM) interactions by integrating ManyChat with OpenAI’s GPT via n8n. It is designed for marketers, business owners, and content creators who want to provide instant, AI-driven replies to Instagram messages at scale. The workflow captures incoming Instagram DMs through ManyChat’s webhook, processes the messages using GPT with a customizable system prompt and conversational memory, and sends the generated responses back to Instagram via ManyChat.

The workflow’s logic is organized into four main blocks:

- **1.1 Input Reception:** Captures incoming Instagram messages via a webhook triggered by ManyChat.
- **1.2 Prompt Preparation:** Sets up the AI system prompt and extracts relevant message data.
- **1.3 AI Processing:** Uses LangChain nodes to maintain conversational context and generate AI responses with OpenAI GPT.
- **1.4 Response Delivery:** Sends the AI-generated reply back to ManyChat, which forwards it to Instagram.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block receives incoming Instagram DM messages forwarded by ManyChat through an HTTP POST webhook. It acts as the entry point of the workflow.

- **Nodes Involved:**  
  - Getting message from Instagram

- **Node Details:**

  - **Getting message from Instagram**  
    - Type: Webhook (HTTP POST)  
    - Role: Listens for incoming HTTP POST requests from ManyChat containing Instagram DM data.  
    - Configuration:  
      - Path: `instagram_chat`  
      - HTTP Method: POST  
      - Response Mode: Uses "Respond to Webhook" node downstream for response.  
    - Inputs: External HTTP POST request from ManyChat.  
    - Outputs: JSON payload with Instagram DM details, including `session_id` and message `text`.  
    - Edge Cases:  
      - Missing or malformed payloads may cause failures.  
      - Unauthorized requests if webhook URL is exposed.  
    - Sticky Note:  
      - "Just copy production link from this node and insert to custom action in ManyChat. No edits needed."

---

#### 2.2 Prompt Preparation

- **Overview:**  
  Extracts the incoming message text and session ID from the webhook payload and sets a system prompt that defines the AI’s persona and response style.

- **Nodes Involved:**  
  - Set your system promt for AI

- **Node Details:**

  - **Set your system promt for AI**  
    - Type: Set node  
    - Role: Assigns variables for the AI prompt, session ID, and user input text.  
    - Configuration:  
      - `prompt`: A multi-line string defining the AI persona as an Instagram influencer, instructing it to answer in a simple style based on previous posts.  
      - `sessionId`: Extracted from incoming JSON at `body.session_id`.  
      - `chatInput`: Extracted from incoming JSON at `body.text`.  
    - Inputs: JSON from webhook node.  
    - Outputs: JSON with `prompt`, `sessionId`, and `chatInput` fields for downstream AI processing.  
    - Edge Cases:  
      - Missing or malformed `session_id` or `text` fields could cause errors downstream.  
    - Sticky Note:  
      - "In this node in 'prompt' variable you can set your system prompt."

---

#### 2.3 AI Processing

- **Overview:**  
  This block uses LangChain nodes to maintain conversation context and generate AI responses using OpenAI GPT. It includes memory management for conversational history and the AI agent that processes the input with the system prompt.

- **Nodes Involved:**  
  - Local n8n memory  
  - ChatGPT model  
  - AI Agent

- **Node Details:**

  - **Local n8n memory**  
    - Type: LangChain Memory Buffer Window  
    - Role: Maintains a sliding window of the last 20 messages per session to provide conversational context.  
    - Configuration:  
      - `sessionKey`: Uses the `sessionId` from "Set your system promt for AI" node.  
      - `sessionIdType`: Custom key based on `sessionKey`.  
      - `contextWindowLength`: 20 messages.  
    - Inputs: JSON with `sessionId`.  
    - Outputs: Conversation memory context for AI Agent.  
    - Edge Cases:  
      - If session ID is missing or duplicated, memory context may be lost or mixed.  
      - Memory size too small or too large may affect performance or context relevance.

  - **ChatGPT model**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides the language model interface to OpenAI GPT for generating responses.  
    - Configuration:  
      - Uses OpenAI API credentials stored in n8n under "General".  
      - Default model and options (can be customized).  
    - Inputs: Receives prompt and context from AI Agent.  
    - Outputs: AI-generated text response.  
    - Edge Cases:  
      - API key invalid or quota exceeded causes authentication errors.  
      - Network timeouts or rate limits from OpenAI.  
      - Model selection may affect response quality and cost.

  - **AI Agent**  
    - Type: LangChain Agent  
    - Role: Orchestrates the AI response generation by combining the system prompt, user input, and memory context.  
    - Configuration:  
      - `text`: Uses `chatInput` from "Set your system promt for AI".  
      - `systemMessage`: Uses `prompt` from "Set your system promt for AI".  
      - `promptType`: Defined prompt.  
      - Connects to `ChatGPT model` as language model and `Local n8n memory` as memory source.  
    - Inputs: Prompt, user input, and memory context.  
    - Outputs: AI-generated reply text.  
    - Edge Cases:  
      - Expression errors if variables are missing.  
      - Failures in memory or model nodes propagate here.  
    - Sticky Note:  
      - "There is 3 nodes: AI Agent, Chat GPT model, Memory for history messages. To do: in ChatGPT node you can choose the best model for you; in Memory Block you can change number of messages in history."

---

#### 2.4 Response Delivery

- **Overview:**  
  Sends the AI-generated response back to ManyChat via the webhook response, which then forwards it to the Instagram user.

- **Nodes Involved:**  
  - Send respond

- **Node Details:**

  - **Send respond**  
    - Type: Respond to Webhook  
    - Role: Returns the AI-generated message as an HTTP response to the original webhook call from ManyChat.  
    - Configuration: Default settings to respond with the data from the previous node (AI Agent).  
    - Inputs: AI Agent output containing the reply text.  
    - Outputs: HTTP response to ManyChat.  
    - Edge Cases:  
      - If AI Agent fails, no response or error response sent.  
      - Network issues may cause response delivery failure.  
    - Sticky Note:  
      - "No edits needed."

---

### 3. Summary Table

| Node Name                  | Node Type                          | Functional Role                      | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                              |
|----------------------------|----------------------------------|------------------------------------|-----------------------------|----------------------------|--------------------------------------------------------------------------------------------------------|
| Getting message from Instagram | Webhook (HTTP POST)               | Receives Instagram DM via ManyChat | (External HTTP POST)         | Set your system promt for AI | Just copy production link from this node and insert to custom action in ManyChat. No edits needed.     |
| Set your system promt for AI | Set                              | Prepares AI prompt and extracts input | Getting message from Instagram | AI Agent                   | In this node in "prompt" variable you can set your system prompt.                                      |
| Local n8n memory            | LangChain Memory Buffer Window   | Maintains conversation history     | AI Agent (indirect via config) | AI Agent                   | There is 3 nodes: AI Agent, Chat GPT model, Memory for history messages. To do: adjust memory size.    |
| ChatGPT model              | LangChain OpenAI Chat Model      | Generates AI responses              | AI Agent                    | AI Agent                   | There is 3 nodes: AI Agent, Chat GPT model, Memory for history messages. To do: choose best model.     |
| AI Agent                   | LangChain Agent                  | Orchestrates AI response generation | Set your system promt for AI, Local n8n memory, ChatGPT model | Send respond               | There is 3 nodes: AI Agent, Chat GPT model, Memory for history messages. To do: adjust prompt and memory. |
| Send respond               | Respond to Webhook               | Sends AI reply back to ManyChat    | AI Agent                    | (HTTP response)            | No edits needed.                                                                                        |
| Sticky Note                | Sticky Note                     | Documentation and instructions     |                             |                            | ## Easy Instagram(via ManyChat) bot... [Guide in Notion](https://shadowed-pound-d6e.notion.site/Instagram-GPT-light-version-Manychat-X-N8N-176293bddff880899a9ac255585d29f7?pvs=4) |
| Sticky Note1               | Sticky Note                     | Documentation for AI block          |                             |                            | ## 3) AI block...                                                                                       |
| Sticky Note2               | Sticky Note                     | Documentation for webhook node      |                             |                            | ## 1) HTTP Post webhook...                                                                              |
| Sticky Note3               | Sticky Note                     | Documentation for prompt node       |                             |                            | ## 2) Edit prompt...                                                                                    |
| Sticky Note4               | Sticky Note                     | Documentation for response node     |                             |                            | ## 4) Respond webhook...                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Name: Getting message from Instagram  
   - HTTP Method: POST  
   - Path: `instagram_chat`  
   - Response Mode: Set to "Respond to Webhook" node downstream  
   - Save and activate webhook.

2. **Create Set Node**  
   - Type: Set  
   - Name: Set your system promt for AI  
   - Add three fields:  
     - `prompt` (string):  
       ```
       Persona: You are a instagram influencer.
       Context: You receive a messages from your subscribers
       Task: Answer questions in your writing style and patterns according to your previous posts text. Use your post only for style and patterns reference.
       Style rules:
       simple answers
       ```  
     - `sessionId` (string): Expression `{{$json.body.session_id}}`  
     - `chatInput` (string): Expression `{{$json.body.text}}`  
   - Connect output of webhook node to this node.

3. **Create LangChain Memory Buffer Window Node**  
   - Type: LangChain Memory Buffer Window  
   - Name: Local n8n memory  
   - Parameters:  
     - `sessionKey`: Expression `{{$node["Set your system promt for AI"].json["sessionId"]}}`  
     - `sessionIdType`: Custom key  
     - `contextWindowLength`: 20  
   - Connect output of "Set your system promt for AI" node to this node.

4. **Create LangChain OpenAI Chat Model Node**  
   - Type: LangChain OpenAI Chat Model  
   - Name: ChatGPT model  
   - Credentials: Select your OpenAI API credentials (e.g., "General")  
   - Leave default model or select preferred GPT model.  
   - Connect output of this node to AI Agent node (next step).

5. **Create LangChain Agent Node**  
   - Type: LangChain Agent  
   - Name: AI Agent  
   - Parameters:  
     - `text`: Expression `{{$node["Set your system promt for AI"].json["chatInput"]}}`  
     - `systemMessage`: Expression `{{$node["Set your system promt for AI"].json["prompt"]}}`  
     - `promptType`: Define  
   - Connect:  
     - `ai_languageModel` input to ChatGPT model node output  
     - `ai_memory` input to Local n8n memory node output  
     - Main input from Set your system promt for AI node output  
   - Connect output to Respond to Webhook node.

6. **Create Respond to Webhook Node**  
   - Type: Respond to Webhook  
   - Name: Send respond  
   - Default settings to respond with previous node output.  
   - Connect input from AI Agent node output.

7. **Activate Workflow**  
   - Ensure all nodes are connected as above.  
   - Activate the workflow in n8n.

8. **Configure Credentials**  
   - Add OpenAI API key in n8n credentials (under OpenAI).  
   - Set up ManyChat to send Instagram DM data to the webhook URL generated by the "Getting message from Instagram" node.  
   - Create ManyChat custom fields as needed for session tracking.

9. **Test**  
   - Send a DM to your Instagram linked with ManyChat.  
   - Confirm that the message triggers the webhook, GPT generates a reply, and the reply is sent back to Instagram via ManyChat.

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                                                                                                                      |
|----------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| This template is the main part of the entire solution. It receives new Instagram messages via ManyChat, generates AI responses using ChatGPT, and sends replies back to ManyChat for Instagram delivery. | Sticky Note on workflow overview.                                                                                                  |
| Guide on creating the full Instagram GPT bot with ManyChat and n8n integration.                                | [Notion instruction](https://shadowed-pound-d6e.notion.site/Instagram-GPT-light-version-Manychat-X-N8N-176293bddff880899a9ac255585d29f7?pvs=4) |
| Register for ManyChat to enable Instagram integration and custom actions.                                      | [ManyChat registration](https://manychat.partnerlinks.io/vm4wkw8j81tc)                                                             |
| In the ChatGPT node, you can select the best GPT model for your use case.                                     | Sticky Note in AI block.                                                                                                            |
| In the Memory node, you can adjust the number of messages stored in conversation history for context.         | Sticky Note in AI block.                                                                                                            |
| The webhook node URL should be copied exactly and inserted into ManyChat’s custom action for Instagram DMs.   | Sticky Note on webhook node.                                                                                                       |
| The system prompt can be customized to change the AI’s persona, style, and response behavior.                  | Sticky Note on Set node.                                                                                                           |
| The Respond to Webhook node requires no edits and completes the HTTP response cycle.                           | Sticky Note on Respond node.                                                                                                       |

---

This documentation provides a complete, structured reference for understanding, reproducing, and modifying the Instagram DM AI agent workflow using ManyChat and OpenAI GPT within n8n.