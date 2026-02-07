AI-Powered Travel Assistant for WhatsApp using Llama 3.2

https://n8nworkflows.xyz/workflows/ai-powered-travel-assistant-for-whatsapp-using-llama-3-2-6052


# AI-Powered Travel Assistant for WhatsApp using Llama 3.2

### 1. Workflow Overview

This workflow, titled **"WhatsApp Travel Planner – Instant Trip Assistance"**, provides an AI-powered personalized travel assistant via WhatsApp. It targets travel customers who want quick, conversational support for trip planning, destination advice, travel documentation (visa, weather, hotels), and booking services. The virtual agent named Alex interacts with users in a warm, professional, and human-like manner, improving customer experience while reducing manual agent workload.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Captures incoming WhatsApp messages as user queries.
- **1.2 AI Processing and Memory Management**: Uses Langchain agents and memory buffers combined with the Llama 3.2 model to understand, remember, and generate relevant travel advice.
- **1.3 Response Timing Control**: Introduces a wait period to simulate thoughtful response timing.
- **1.4 Output Delivery**: Sends the AI-generated reply back to the user on WhatsApp.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** This block listens for incoming WhatsApp messages, triggering the workflow and passing user queries for processing.
- **Nodes Involved:** 
  - *Get WhatsApp Message*
  - *Sticky Note* (Documentation)

##### Node: Get WhatsApp Message
- **Type & Role:** WhatsApp Trigger node; initiates workflow execution upon receiving WhatsApp messages.
- **Configuration:** 
  - Listens for "messages" update type.
  - Uses WhatsApp API credentials (`WhatsApp -test`).
  - Webhook ID configured for receiving WhatsApp events.
- **Expressions:** Accesses incoming message text at `$json.messages[0].text.body`.
- **Inputs/Outputs:** No input; outputs the message data to downstream nodes.
- **Potential Failures:** 
  - Authentication issues with WhatsApp API.
  - Message format changes causing expression failures.
  - Webhook connectivity or subscription errors.
- **Sub-workflow:** None.

##### Node: Sticky Note
- **Type & Role:** Non-functional note providing workflow purpose and context.
- **Content:** Describes the workflow’s goal to automate personalized travel assistance on WhatsApp using a virtual agent named Alex.
- **Inputs/Outputs:** None.
- **Potential Failures:** None.

---

#### 1.2 AI Processing and Memory Management

- **Overview:** This block processes user input text using AI models, maintains conversational context, and generates travel-related responses.
- **Nodes Involved:** 
  - *Travel Assistant*
  - *Memory*
  - *Travel Plan Creator*

##### Node: Travel Assistant
- **Type & Role:** Langchain Agent node; acts as the conversational AI interface.
- **Configuration:** 
  - Input text sourced dynamically from the incoming WhatsApp message body.
  - System message defines persona "Alex" as a friendly, professional travel assistant with specific conversational style instructions.
  - Prompt type set to "define" to customize the system message.
- **Expressions:** 
  - User message: `={{ $json.messages[0].text.body }}`
  - System greeting includes user's WhatsApp profile name: `{{ $json.contacts[0].profile.name }}`
- **Inputs:** Receives message data from *Get WhatsApp Message* node.
- **Outputs:** Passes AI-generated responses to the *Wait For Response* node.
- **Version Needs:** Uses Langchain agent version 1.9; ensure n8n supports this version.
- **Potential Failures:** 
  - Language model API errors.
  - Expression errors if message structure changes.
  - Failure in name extraction causing incomplete greetings.
- **Sub-workflow:** None directly; connected to *Memory* and *Travel Plan Creator* nodes as AI memory and language model services.

##### Node: Memory
- **Type & Role:** Langchain Memory Buffer Window node; manages conversational context with a sliding window of recent messages.
- **Configuration:** 
  - Session key defined as the current user message text to maintain session continuity.
  - Context window length set to 200 tokens/messages for context retention.
- **Expressions:** Session key: `={{ $json.messages[0].text.body }}`
- **Inputs:** Receives context from *Travel Assistant* node.
- **Outputs:** Feeds memory state back into the *Travel Assistant* node to maintain conversation coherence.
- **Potential Failures:** 
  - Memory overflow if too much context accumulates.
  - Session key collisions if different users send identical messages.
- **Version Needs:** Version 1.3 of Langchain memory node.

##### Node: Travel Plan Creator
- **Type & Role:** Langchain Chat LLM node using Ollama API; generates detailed travel plan suggestions.
- **Configuration:** 
  - Uses model “llama3.2-16000:latest” for advanced, large-context AI generation.
  - No additional options configured.
  - Ollama API credentials required (`Ollama - test`).
- **Inputs:** Connected as the language model source for the *Travel Assistant* node.
- **Outputs:** Passes generated text to *Travel Assistant* for integration into the conversational flow.
- **Potential Failures:** 
  - API authentication or rate limiting errors.
  - Model unavailability or version mismatch.
  - Latency issues due to large context size.
- **Version Needs:** Version 1 of Langchain LLM node.

---

#### 1.3 Response Timing Control

- **Overview:** Introduces a fixed wait time before sending the reply, simulating a natural response delay.
- **Nodes Involved:** 
  - *Wait For Response*

##### Node: Wait For Response
- **Type & Role:** Wait node; delays workflow execution for 10 seconds.
- **Configuration:** 
  - Fixed delay of 10 seconds.
- **Inputs:** Receives the AI-generated response from *Travel Assistant*.
- **Outputs:** Forwards the delayed response to *Send Reply On WhatsApp*.
- **Potential Failures:**
  - Workflow timeout if the wait node delays exceed system limits.
- **Version Needs:** Version 1.1.

---

#### 1.4 Output Delivery

- **Overview:** Sends the AI-generated travel assistant reply back to the user’s WhatsApp number.
- **Nodes Involved:** 
  - *Send Reply On WhatsApp*

##### Node: Send Reply On WhatsApp
- **Type & Role:** WhatsApp Node; sends text messages via WhatsApp API.
- **Configuration:** 
  - Operation set to "send".
  - Message text dynamically set from AI output: `={{ $json.output }}`
  - Recipient phone number dynamically retrieved from the initial WhatsApp message contact ID.
  - Phone number ID is statically configured as `+919876542345` (likely the WhatsApp Business number).
  - Uses `WhatsApp-test` API credentials.
- **Expressions:** Recipient phone number: `={{ $('Get WhatsApp Message').item.json.contacts[0].wa_id }}`
- **Inputs:** Receives delayed response from *Wait For Response*.
- **Outputs:** None (terminal node).
- **Potential Failures:** 
  - Invalid or missing recipient phone number.
  - API authentication or quota errors.
  - Message format errors (empty or malformed text).
- **Version Needs:** Version 1.

---

### 3. Summary Table

| Node Name            | Node Type                          | Functional Role                         | Input Node(s)          | Output Node(s)         | Sticky Note                                                                                         |
|----------------------|----------------------------------|---------------------------------------|-----------------------|------------------------|---------------------------------------------------------------------------------------------------|
| Sticky Note          | n8n-nodes-base.stickyNote         | Documentation note                    | None                  | None                   | This workflow automates personalized travel assistance via WhatsApp. It helps users plan trips, explore destinations, get visa/weather/hotel info, and book packages—all through a friendly virtual agent named Alex. It ensures quick, human-like support 24/7, improving customer experience and reducing manual handling by travel agents. |
| Get WhatsApp Message | n8n-nodes-base.whatsAppTrigger    | Receives incoming WhatsApp messages  | None                  | Travel Assistant        |                                                                                                   |
| Travel Assistant      | @n8n/n8n-nodes-langchain.agent    | AI conversational interface          | Get WhatsApp Message, Memory, Travel Plan Creator | Wait For Response       |                                                                                                   |
| Memory                | @n8n/n8n-nodes-langchain.memoryBufferWindow | Maintains conversation context       | Travel Assistant       | Travel Assistant        |                                                                                                   |
| Travel Plan Creator   | @n8n/n8n-nodes-langchain.lmChatOllama | Generates travel plans using Llama 3.2 | None (AI Language Model source for Travel Assistant) | Travel Assistant        |                                                                                                   |
| Wait For Response    | n8n-nodes-base.wait               | Adds delay before replying            | Travel Assistant       | Send Reply On WhatsApp  |                                                                                                   |
| Send Reply On WhatsApp| n8n-nodes-base.whatsApp           | Sends reply message to WhatsApp user | Wait For Response      | None                   |                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Get WhatsApp Message" Node**
   - Type: WhatsApp Trigger
   - Configure webhook to listen for `"messages"` updates.
   - Attach WhatsApp API credentials (use OAuth2 or API key as per your WhatsApp Business setup).
   - Save webhook ID for incoming message reception.

2. **Create "Travel Assistant" Node**
   - Type: Langchain Agent
   - Set input text to: `={{ $json.messages[0].text.body }}`
   - Define system message:
     ```
     You are Alex, a friendly, professional travel assistant, helping users on WhatsApp with trip planning, destination suggestions, tour packages, travel questions (like visas, weather, hotels), and bookings.

     Your style: Clear, concise, warm, and human-like. Avoid technical terms unless asked.

     Always start with this message:
     Hello! {{ $json.contacts[0].profile.name }}, welcome to OneClick. I’m your travel assistant. Where would you like to travel?
     ```
   - Set prompt type to "define."
   - Connect input from "Get WhatsApp Message" node.

3. **Create "Memory" Node**
   - Type: Langchain Memory Buffer Window
   - Set session key to: `={{ $json.messages[0].text.body }}`
   - Use "customKey" for session ID type.
   - Set context window length to 200 tokens.
   - Connect input from "Travel Assistant" node (ai_memory port).
   - Connect output back to "Travel Assistant" node (ai_memory input).

4. **Create "Travel Plan Creator" Node**
   - Type: Langchain Chat LLM (Ollama)
   - Select model: `llama3.2-16000:latest`
   - Leave options empty unless specific customization needed.
   - Attach Ollama API credentials.
   - Connect output to "Travel Assistant" node as ai_languageModel input.

5. **Create "Wait For Response" Node**
   - Type: Wait
   - Set delay amount to 10 seconds.
   - Connect input from "Travel Assistant" node's main output.

6. **Create "Send Reply On WhatsApp" Node**
   - Type: WhatsApp Node
   - Operation: "send"
   - Set message text body to: `={{ $json.output }}`
   - Enter your WhatsApp Business phone number ID statically (e.g., `+919876542345`).
   - Set recipient phone number dynamically to: `={{ $('Get WhatsApp Message').item.json.contacts[0].wa_id }}`
   - Attach WhatsApp API credentials.
   - Connect input from "Wait For Response."

7. **Create "Sticky Note" Node** (Optional)
   - Add a Sticky Note with the workflow description to document purpose and context.

8. **Connect Nodes**
   - Connect "Get WhatsApp Message" → "Travel Assistant"
   - Connect "Travel Assistant" → "Memory" (ai_memory)
   - Connect "Memory" → "Travel Assistant" (ai_memory input)
   - Connect "Travel Plan Creator" → "Travel Assistant" (ai_languageModel)
   - Connect "Travel Assistant" → "Wait For Response"
   - Connect "Wait For Response" → "Send Reply On WhatsApp"

9. **Activate Workflow and Test**
   - Test with incoming WhatsApp messages.
   - Monitor logs for errors or expression failures.
   - Adjust context window or wait time as necessary.

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                                                                             |
|-----------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| The virtual assistant persona "Alex" is designed to provide clear, concise, and warm travel assistance messages.| Defined in the system prompt of the Travel Assistant node.                                                  |
| Model "llama3.2-16000:latest" requires Ollama API credentials and sufficient API quota for large context usage.  | Ollama API documentation: https://ollama.com/docs                                                            |
| WhatsApp nodes require proper webhook and API credential setup; ensure WhatsApp Business API access is granted. | WhatsApp Business API docs: https://developers.facebook.com/docs/whatsapp                                   |
| Delay node simulates human-like response time; adjust wait duration to suit user experience.                     | Default set at 10 seconds, customizable in Wait For Response node.                                         |
| Workflow reduces manual agent load by automating travel queries with AI via WhatsApp, available 24/7.             | Workflow sticky note summarizes this benefit.                                                              |

---

This reference document fully describes the WhatsApp Travel Planner workflow with AI integration, enabling advanced users and automation agents to comprehend, reproduce, and extend it reliably.