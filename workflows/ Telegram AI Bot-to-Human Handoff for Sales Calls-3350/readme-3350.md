 Telegram AI Bot-to-Human Handoff for Sales Calls

https://n8nworkflows.xyz/workflows/-telegram-ai-bot-to-human-handoff-for-sales-calls-3350


#  Telegram AI Bot-to-Human Handoff for Sales Calls

### 1. Workflow Overview

This workflow implements a Telegram AI bot designed for sales call handling with a bot-to-human handoff mechanism using a human-in-the-loop approach. It manages user interactions through a finite-state machine pattern, leveraging Redis for session state and chat memory management, and OpenAI for AI-driven conversational agents.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Session State Management:** Captures incoming Telegram messages, retrieves the user's current interaction state from Redis, and routes the conversation accordingly.
- **1.2 Onboarding Agent:** Engages users initially to collect essential sales inquiry details using an AI agent, extracting structured data from free-form conversation.
- **1.3 Human Handoff Process:** Transfers the conversation to a human agent when onboarding is complete, updating session state and notifying the human agent.
- **1.4 Human-in-the-Loop Interaction:** Pauses workflow execution awaiting human agent input, which includes a summary of the conversation, and then reactivates the bot with context.
- **1.5 After-Sales Agent:** Handles post-handoff user queries with an AI agent, maintaining conversation context and allowing re-delegation to human agents on demand.
- **1.6 Session State Switching and Canned Responses:** Controls conversation flow based on session state, including providing canned responses when the bot is deactivated.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Session State Management

**Overview:**  
This block receives incoming Telegram messages, retrieves the user's current session state from Redis, and directs the workflow to the appropriate conversational path (Onboarding, Human, or After-Sales).

**Nodes Involved:**  
- Telegram Trigger  
- Get Interaction State  
- Switch Interaction

**Node Details:**

- **Telegram Trigger**  
  - *Type:* Telegram Trigger  
  - *Role:* Entry point capturing all incoming Telegram messages (updates of type "message").  
  - *Configuration:* Uses a Telegram bot credential; listens for new messages.  
  - *Input/Output:* No input; outputs message data.  
  - *Edge Cases:* Telegram API downtime, webhook misconfiguration, message format errors.

- **Get Interaction State**  
  - *Type:* Redis Node (Get)  
  - *Role:* Retrieves the current session state for the user from Redis using key pattern `handoff_<chat_id>_state`.  
  - *Configuration:* Uses Redis credentials; key dynamically constructed from incoming message chat ID.  
  - *Input/Output:* Input from Telegram Trigger; outputs session state string under `data`.  
  - *Edge Cases:* Redis connection failures, missing keys (treated as no state set).

- **Switch Interaction**  
  - *Type:* Switch Node  
  - *Role:* Routes workflow based on session state value (`human`, `bot`, or fallback).  
  - *Configuration:* Checks if Redis data equals "human" or "bot"; fallback is "Onboarding".  
  - *Input/Output:* Input from Get Interaction State; outputs to three paths: Human, Bot, Onboarding.  
  - *Edge Cases:* Unexpected or corrupted session state values.

---

#### 1.2 Onboarding Agent

**Overview:**  
Handles initial user onboarding by collecting customer details required for sales inquiries via an AI agent. Extracts structured data from conversation history and verifies completeness before proceeding.

**Nodes Involved:**  
- Onboarding Agent  
- Get Onboarding Chat History  
- Information Extractor  
- With Defaults (Code)  
- Has All Criteria? (If)  
- Handoff Subworkflow1  
- Continue Conversation  
- OpenAI Chat Model  
- Memory

**Node Details:**

- **Onboarding Agent**  
  - *Type:* LangChain Agent (OpenAI-based)  
  - *Role:* Engages user to collect first name, last name, address/postcode, and reason for call.  
  - *Configuration:* System message instructs agent to gather specified details and hand off once complete.  
  - *Input/Output:* Input text from Telegram Trigger; outputs agent response text.  
  - *Edge Cases:* Model misinterpretation, incomplete data capture.

- **Get Onboarding Chat History**  
  - *Type:* Redis Node (Get)  
  - *Role:* Retrieves conversation history from Redis key `handoff_<chat_id>_chat`.  
  - *Configuration:* Uses Redis credentials; dynamic key from chat ID.  
  - *Input/Output:* Input from Onboarding Agent; outputs chat history data.  
  - *Edge Cases:* Missing or corrupted chat history.

- **Information Extractor**  
  - *Type:* LangChain Information Extractor  
  - *Role:* Parses recent conversation messages to extract structured customer details.  
  - *Configuration:* Uses a system prompt to analyze last 5 messages; extracts firstname, lastname, address_and_postcode, reason_for_call.  
  - *Input/Output:* Input chat history; outputs extracted fields.  
  - *Edge Cases:* Extraction failures, incomplete or ambiguous data.

- **With Defaults (Code Node)**  
  - *Type:* Code Node (JavaScript)  
  - *Role:* Ensures all required fields exist with default empty strings if missing.  
  - *Configuration:* Merges extracted output with empty defaults.  
  - *Input/Output:* Input from Information Extractor; outputs normalized data.  
  - *Edge Cases:* None significant.

- **Has All Criteria? (If Node)**  
  - *Type:* If Node  
  - *Role:* Checks if all required customer details are present (non-empty).  
  - *Configuration:* Condition tests all values for truthiness.  
  - *Input/Output:* Input from With Defaults; outputs to two paths: true (all data present) or false (incomplete).  
  - *Edge Cases:* Partial data causing false negatives.

- **Handoff Subworkflow1**  
  - *Type:* Execute Workflow (Subworkflow)  
  - *Role:* Initiates handoff process by passing collected customer details to subworkflow.  
  - *Configuration:* Passes chatId, sessionId, userId, username, and a summary string combining customer details.  
  - *Input/Output:* Triggered when all criteria met; outputs subworkflow results.  
  - *Edge Cases:* Subworkflow failures, parameter mismatches.

- **Continue Conversation**  
  - *Type:* Telegram Node (Send Message)  
  - *Role:* Sends onboarding agent's response back to user if data incomplete.  
  - *Configuration:* Sends text from Onboarding Agent output to user chat.  
  - *Input/Output:* Input from Has All Criteria? false path; outputs Telegram message.  
  - *Edge Cases:* Telegram API errors.

- **OpenAI Chat Model**  
  - *Type:* LangChain OpenAI Model  
  - *Role:* Supports Information Extractor with GPT-4o-mini model.  
  - *Configuration:* Uses OpenAI credentials; model set to GPT-4o-mini.  
  - *Input/Output:* Input from Get Onboarding Chat History; output to Information Extractor.  
  - *Edge Cases:* API rate limits, model errors.

- **Memory**  
  - *Type:* Redis Chat Memory (LangChain)  
  - *Role:* Maintains chat memory for onboarding session keyed by `handoff_<chat_id>_chat`.  
  - *Configuration:* Uses Redis credentials; custom session key.  
  - *Input/Output:* Connected to Onboarding Agent for memory context.  
  - *Edge Cases:* Redis failures, memory corruption.

---

#### 1.3 Human Handoff Process

**Overview:**  
Transfers the conversation to a human agent by updating session state, notifying the human agent with user details, and sending a message to the user confirming the handoff.

**Nodes Involved:**  
- Handoff Subworkflow  
- Notify user  
- Set Interaction to Human  
- Human Handoff using Send and Wait  
- Set Interaction to Bot  
- Send Response  
- Update Agent Memory1  
- Memory3

**Node Details:**

- **Handoff Subworkflow**  
  - *Type:* Execute Workflow Trigger (Subworkflow)  
  - *Role:* Manages the human-in-the-loop handoff interaction.  
  - *Configuration:* Accepts inputs: chatId, sessionId, userId, username, summary.  
  - *Input/Output:* Triggered by Handoff Subworkflow1; outputs to Notify user.  
  - *Edge Cases:* Subworkflow execution errors.

- **Notify user**  
  - *Type:* Telegram Node (Send Message)  
  - *Role:* Informs user they have been transferred to a human and bot is inactive.  
  - *Configuration:* Sends a fixed message to user chat.  
  - *Input/Output:* Input from Handoff Subworkflow; outputs to Set Interaction to Human.  
  - *Edge Cases:* Telegram API errors.

- **Set Interaction to Human**  
  - *Type:* Redis Node (Set)  
  - *Role:* Updates Redis session state key to "human" to deactivate bot responses.  
  - *Configuration:* Key: `handoff_<sessionId>_state`; Value: "human".  
  - *Input/Output:* Input from Notify user; outputs to Human Handoff using Send and Wait.  
  - *Edge Cases:* Redis write failures.

- **Human Handoff using Send and Wait**  
  - *Type:* Telegram Node (Send and Wait)  
  - *Role:* Sends message to human agent chat with user details and waits for human reply (summary).  
  - *Configuration:* Chat ID set to human agent chat; message includes user info and summary; waits for free text response.  
  - *Input/Output:* Input from Set Interaction to Human; outputs to Set Interaction to Bot.  
  - *Edge Cases:* Human agent non-response, timeout, Telegram API errors.

- **Set Interaction to Bot**  
  - *Type:* Redis Node (Set)  
  - *Role:* Updates Redis session state key to "bot" to reactivate bot interaction.  
  - *Configuration:* Key: `handoff_<sessionId>_state`; Value: "bot".  
  - *Input/Output:* Input from Human Handoff using Send and Wait; outputs to Update Agent Memory.  
  - *Edge Cases:* Redis write failures.

- **Send Response**  
  - *Type:* Telegram Node (Send Message)  
  - *Role:* Sends confirmation message to user that human agent will contact them.  
  - *Configuration:* Sends fixed text to user chat.  
  - *Input/Output:* Input from Handoff Subworkflow1; outputs to Update Agent Memory1.  
  - *Edge Cases:* Telegram API errors.

- **Update Agent Memory1**  
  - *Type:* LangChain Memory Manager  
  - *Role:* Inserts AI messages into Redis chat memory with user details summary.  
  - *Configuration:* Mode: insert; messages include user details from Handoff Subworkflow1.  
  - *Input/Output:* Input from Send Response; outputs to Memory3.  
  - *Edge Cases:* Redis or memory manager failures.

- **Memory3**  
  - *Type:* Redis Chat Memory (LangChain)  
  - *Role:* Stores after-sales chat memory keyed by `handoff_<chat_id>_chat2`.  
  - *Configuration:* Uses Redis credentials; context window length 30.  
  - *Input/Output:* Connected to Update Agent Memory1.  
  - *Edge Cases:* Redis failures.

---

#### 1.4 Human-in-the-Loop Interaction and Memory Update

**Overview:**  
Captures human agent feedback from the "Send and Wait" node, updates the bot's memory with the human summary, and sends a message to the user indicating the bot is reactivated and ready.

**Nodes Involved:**  
- Human Handoff using Send and Wait  
- Set Interaction to Bot  
- Update Agent Memory  
- Send Response2  
- Memory2

**Node Details:**

- **Update Agent Memory**  
  - *Type:* LangChain Memory Manager  
  - *Role:* Inserts human agent's summary and a bot readiness message into Redis chat memory.  
  - *Configuration:* Mode: insert; messages include human report and bot greeting.  
  - *Input/Output:* Input from Set Interaction to Bot; outputs to Send Response2.  
  - *Edge Cases:* Memory insertion failures.

- **Send Response2**  
  - *Type:* Telegram Node (Send Message)  
  - *Role:* Sends message to user that bot is ready to answer further questions.  
  - *Configuration:* Sends fixed text to user chat.  
  - *Input/Output:* Input from Update Agent Memory; no further output.  
  - *Edge Cases:* Telegram API errors.

- **Memory2**  
  - *Type:* Redis Chat Memory (LangChain)  
  - *Role:* Stores chat memory for after-sales agent context.  
  - *Configuration:* Uses Redis credentials; context window length 30.  
  - *Input/Output:* Connected to Update Agent Memory.  
  - *Edge Cases:* Redis failures.

---

#### 1.5 After-Sales Agent

**Overview:**  
Handles user queries after the bot is reactivated post-human handoff, providing after-sales assistance and allowing the user to request a handoff back to a human agent.

**Nodes Involved:**  
- After Sales Agent  
- Model1  
- Memory1  
- Handoff Tool  
- Send Response3

**Node Details:**

- **After Sales Agent**  
  - *Type:* LangChain Agent  
  - *Role:* Responds to user questions related to after-sales support.  
  - *Configuration:* System message defines role as aftersales agent; uses conversation context.  
  - *Input/Output:* Input text from Telegram Trigger; outputs response text.  
  - *Edge Cases:* Model misinterpretation, incomplete context.

- **Model1**  
  - *Type:* LangChain OpenAI Model  
  - *Role:* Provides language model for After Sales Agent using GPT-4o-mini.  
  - *Configuration:* Uses OpenAI credentials.  
  - *Input/Output:* Input from Memory1; output to After Sales Agent.  
  - *Edge Cases:* API limits, model errors.

- **Memory1**  
  - *Type:* Redis Chat Memory (LangChain)  
  - *Role:* Maintains after-sales chat memory keyed by `handoff_<chat_id>_chat2`.  
  - *Configuration:* Redis credentials; context window length 30.  
  - *Input/Output:* Connected to After Sales Agent.  
  - *Edge Cases:* Redis failures.

- **Handoff Tool**  
  - *Type:* LangChain Tool Workflow  
  - *Role:* Allows After Sales Agent to delegate conversation back to human agent on user request.  
  - *Configuration:* Calls current workflow with parameters for handoff; requires summary of reason for handoff.  
  - *Input/Output:* Connected as a tool to After Sales Agent.  
  - *Edge Cases:* Workflow invocation failures, missing summary.

- **Send Response3**  
  - *Type:* Telegram Node (Send Message)  
  - *Role:* Sends After Sales Agent's response to user.  
  - *Configuration:* Sends text from After Sales Agent output.  
  - *Input/Output:* Input from After Sales Agent; outputs Telegram message.  
  - *Edge Cases:* Telegram API errors.

---

#### 1.6 Session State Switching and Canned Responses

**Overview:**  
Controls message flow based on session state. When in "human" state, the bot sends a canned response informing the user that a human agent is handling the conversation. When in "bot" or no state, messages are routed to the appropriate AI agent.

**Nodes Involved:**  
- Switch Interaction (from 1.1)  
- Get Canned Response

**Node Details:**

- **Get Canned Response**  
  - *Type:* Telegram Node (Send Message)  
  - *Role:* Sends a fixed message to user when session state is "human" indicating bot is inactive.  
  - *Configuration:* Message text informs user that human agent is handling the conversation and bot cannot respond.  
  - *Input/Output:* Input from Switch Interaction "Human" output; outputs Telegram message.  
  - *Edge Cases:* Telegram API errors.

---

### 3. Summary Table

| Node Name                     | Node Type                         | Functional Role                                  | Input Node(s)                  | Output Node(s)                          | Sticky Note                                                                                                    |
|-------------------------------|----------------------------------|-------------------------------------------------|-------------------------------|----------------------------------------|----------------------------------------------------------------------------------------------------------------|
| Telegram Trigger               | Telegram Trigger                 | Entry point for incoming Telegram messages       | None                          | Get Interaction State                  | ## 1. Check Interaction State For Incoming Message [Learn more about the telegram trigger](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.telegramtrigger/) This is an example of a state-based agent - the technique commonly known as a finite-state machine. This is a great way to really control the flow and direction of the conversation where there are requirements to collect data or perform steps in sequence. To manage the session state, we can use Redis and the session key will be the user's number. |
| Get Interaction State          | Redis (Get)                     | Retrieves current session state from Redis       | Telegram Trigger              | Switch Interaction                    |                                                                                                                |
| Switch Interaction             | Switch                         | Routes based on session state                     | Get Interaction State         | Get Canned Response, After Sales Agent, Onboarding Agent |                                                                                                                |
| Get Canned Response            | Telegram Send Message           | Sends canned message when bot is inactive        | Switch Interaction (Human)    | None                                 |                                                                                                                |
| Onboarding Agent              | LangChain Agent                 | Collects user details during onboarding           | Telegram Trigger              | Get Onboarding Chat History           | ## 2. Onboarding Agent to Validate Customers [Read more about Agents](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent) This agent unlike the common multi-tasking examples out there, is only tasked to handle the user's onboarding. In this way, we trade convenience for clutter but ensure the agent is less likely to stray from the desired path. |
| Get Onboarding Chat History    | Redis (Get)                    | Retrieves onboarding conversation history         | Onboarding Agent             | OpenAI Chat Model                     |                                                                                                                |
| OpenAI Chat Model              | LangChain OpenAI Model          | Supports information extraction                    | Get Onboarding Chat History  | Information Extractor                 |                                                                                                                |
| Information Extractor          | LangChain Information Extractor | Extracts structured customer details              | OpenAI Chat Model            | With Defaults                       | ## 3. Extract Customer Details from Conversation [Learn more about the Information Extractor](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.information-extractor) To collect the user's details in a structured format, we can analyse the current conversation and extract the data with the Information Extractor node. This allows the conversation to remain free-form and avoids asking a question for each field. We use a code node to check if all details are captured. |
| With Defaults                 | Code Node                      | Ensures all required fields have default values   | Information Extractor        | Has All Criteria?                   |                                                                                                                |
| Has All Criteria?              | If Node                       | Checks if all required customer details are present | With Defaults               | Handoff Subworkflow1, Continue Conversation |                                                                                                                |
| Handoff Subworkflow1           | Execute Workflow (Subworkflow) | Initiates human handoff with collected details    | Has All Criteria? (true)      | Send Response                       | ## 4. Human Handoff when Criteria Met [Learn more about subworkflows](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow) Here, we initiate the hand-off which calls our hand-off subworkflow. Subworkflows can be a great way to run actions concurrently and without blocking the reply to the user. At this point, the session state would be set to "human" which means the human agent should take over. |
| Continue Conversation          | Telegram Send Message          | Sends onboarding agent's reply if data incomplete | Has All Criteria? (false)     | None                               |                                                                                                                |
| Handoff Subworkflow            | Execute Workflow Trigger       | Manages human-in-the-loop handoff interaction     | Handoff Subworkflow1          | Notify user                        | ## 7. Interaction Subworkflow [Learn more about n8n's human-in-the-loop feature](https://docs.n8n.io/advanced-ai/examples/human-fallback/) The hand-off implementation here involves a "human-in-the-loop" feature of n8n - a feature which "pauses" an execution whilst running until a reply or action is sent back by the human. Sounds complicated but good to note that n8n handles this interaction seemlessly! Here, we're using it to allow the human agent to reliquish control of the conversation back to the AI agent. Additionally, the human agent's feedback is captured and added to the agent's memory to better assist the user afterwards. |
| Notify user                   | Telegram Send Message          | Notifies user of transfer to human agent          | Handoff Subworkflow           | Set Interaction to Human            |                                                                                                                |
| Set Interaction to Human       | Redis (Set)                   | Sets session state to "human" to deactivate bot   | Notify user                  | Human Handoff using Send and Wait  |                                                                                                                |
| Human Handoff using Send and Wait | Telegram Send and Wait        | Sends message to human agent and waits for reply  | Set Interaction to Human      | Set Interaction to Bot              |                                                                                                                |
| Set Interaction to Bot         | Redis (Set)                   | Sets session state to "bot" to reactivate bot     | Human Handoff using Send and Wait | Update Agent Memory              |                                                                                                                |
| Update Agent Memory            | LangChain Memory Manager       | Inserts human summary and bot readiness messages  | Set Interaction to Bot        | Send Response2                     |                                                                                                                |
| Send Response2                | Telegram Send Message          | Sends message that bot is ready for further queries | Update Agent Memory          | None                               |                                                                                                                |
| Memory2                      | Redis Chat Memory (LangChain)  | Stores after-sales chat memory                      | Update Agent Memory          | After Sales Agent                  |                                                                                                                |
| Send Response                 | Telegram Send Message          | Confirms transfer to human agent                    | Handoff Subworkflow1          | Update Agent Memory1               |                                                                                                                |
| Update Agent Memory1           | LangChain Memory Manager       | Inserts user details summary into chat memory      | Send Response                | Memory3                          |                                                                                                                |
| Memory3                      | Redis Chat Memory (LangChain)  | Stores after-sales chat memory                       | Update Agent Memory1          | None                               |                                                                                                                |
| After Sales Agent             | LangChain Agent                | Handles after-sales user queries                     | Telegram Trigger             | Send Response3                   |                                                                                                                |
| Model1                       | LangChain OpenAI Model          | Provides language model for After Sales Agent       | Memory1                     | After Sales Agent                |                                                                                                                |
| Memory1                      | Redis Chat Memory (LangChain)  | Maintains after-sales chat memory                     | None                        | Model1                          |                                                                                                                |
| Handoff Tool                 | LangChain Tool Workflow         | Allows after-sales agent to handoff back to human   | After Sales Agent            | None                           |                                                                                                                |
| Send Response3               | Telegram Send Message           | Sends after-sales agent's reply to user              | After Sales Agent            | None                           |                                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure with Telegram bot credentials.  
   - Listen for "message" updates.  
   - Position as entry point.

2. **Add Redis Get Node "Get Interaction State"**  
   - Operation: Get  
   - Key: `handoff_{{ $json.message.chat.id }}_state`  
   - Use Redis credentials.  
   - Connect Telegram Trigger output to this node.

3. **Add Switch Node "Switch Interaction"**  
   - Add rules:  
     - If `data` equals "human" → output "Human"  
     - If `data` equals "bot" → output "Bot"  
     - Else → output "Onboarding" (fallback)  
   - Connect output of Get Interaction State to this node.

4. **Add Telegram Send Message Node "Get Canned Response"**  
   - Text: "This conversation has been handed-off to a human agent who will be in contact soon if not done so already. I cannot respond to your query until the human agent transfers you back to me."  
   - Chat ID: `={{ $json.message.chat.id }}`  
   - Connect "Human" output of Switch Interaction to this node.

5. **Build Onboarding Agent Block:**  
   - Add LangChain Agent Node "Onboarding Agent"  
     - System message instructing to collect first name, last name, address/postcode, reason for call.  
     - Input text from Telegram Trigger message text.  
     - Connect "Onboarding" output of Switch Interaction to this node.  
   - Add Redis Get Node "Get Onboarding Chat History"  
     - Key: `handoff_{{ $json.message.chat.id }}_chat`  
     - Connect Onboarding Agent output to this node.  
   - Add LangChain OpenAI Model Node "OpenAI Chat Model"  
     - Model: GPT-4o-mini  
     - Connect Get Onboarding Chat History output to this node.  
   - Add LangChain Information Extractor Node "Information Extractor"  
     - System prompt to extract firstname, lastname, address_and_postcode, reason_for_call from last 5 messages.  
     - Connect OpenAI Chat Model output to this node.  
   - Add Code Node "With Defaults"  
     - JavaScript to merge extracted data with empty string defaults for all fields.  
     - Connect Information Extractor output to this node.  
   - Add If Node "Has All Criteria?"  
     - Condition: All fields are non-empty (`Object.values($json).every(val => Boolean(val))`).  
     - Connect With Defaults output to this node.  
   - Add Execute Workflow Node "Handoff Subworkflow1"  
     - Mode: Each  
     - Workflow ID: current workflow ID  
     - Inputs: chatId, sessionId, userId, username, summary (formatted string with user details)  
     - Connect "true" output of Has All Criteria? to this node.  
   - Add Telegram Send Message Node "Continue Conversation"  
     - Text: output of Onboarding Agent  
     - Chat ID: `={{ $json.message.chat.id }}`  
     - Connect "false" output of Has All Criteria? to this node.

6. **Build Human Handoff Subworkflow:**  
   - Add Execute Workflow Trigger Node "Handoff Subworkflow"  
     - Inputs: chatId, sessionId, userId, username, summary  
     - Connect Handoff Subworkflow1 output to this node.  
   - Add Telegram Send Message Node "Notify user"  
     - Text: "You have now been transferred to a human. Unfortunately, I will not be able to respond until the human agent transfers you back to me."  
     - Chat ID: `={{ $json.chatId }}`  
     - Connect Handoff Subworkflow output to this node.  
   - Add Redis Set Node "Set Interaction to Human"  
     - Key: `handoff_{{ $json.sessionId }}_state`  
     - Value: "human"  
     - Connect Notify user output to this node.  
   - Add Telegram Send and Wait Node "Human Handoff using Send and Wait"  
     - Chat ID: human agent chat ID (static or configured)  
     - Message: includes chatId, sessionId, user, summary, and instructions to return user to bot.  
     - Operation: sendAndWait, responseType: freeText  
     - Connect Set Interaction to Human output to this node.  
   - Add Redis Set Node "Set Interaction to Bot"  
     - Key: `handoff_{{ $json.sessionId }}_state`  
     - Value: "bot"  
     - Connect Human Handoff using Send and Wait output to this node.  
   - Add LangChain Memory Manager Node "Update Agent Memory"  
     - Mode: insert  
     - Messages: human report from human agent reply, plus bot readiness message.  
     - Connect Set Interaction to Bot output to this node.  
   - Add Telegram Send Message Node "Send Response2"  
     - Text: "Hello again! I'm now ready to answer any remaining questions you may have."  
     - Chat ID: `={{ $json.chatId }}`  
     - Connect Update Agent Memory output to this node.  
   - Add Redis Chat Memory Node "Memory2"  
     - Session Key: `handoff_{{ $json.chatId }}_chat2`  
     - Context Window Length: 30  
     - Connect Update Agent Memory output to this node.

7. **Build After-Sales Agent Block:**  
   - Add Redis Chat Memory Node "Memory1"  
     - Session Key: `handoff_{{ $json.message.chat.id }}_chat2`  
     - Context Window Length: 30  
   - Add LangChain OpenAI Model Node "Model1"  
     - Model: GPT-4o-mini  
     - Connect Memory1 output to this node.  
   - Add LangChain Agent Node "After Sales Agent"  
     - System message: "You are an aftersales agent helping the user answer questions about their recent purchase."  
     - Input text from Telegram Trigger message text.  
     - Connect Model1 output to this node.  
   - Add LangChain Tool Workflow Node "Handoff Tool"  
     - Name: "handoff_to_human"  
     - Workflow ID: current workflow ID  
     - Description: tool to handoff to human agent with summary.  
     - Inputs: chatId, userId, summary, username, sessionId  
     - Connect as tool to After Sales Agent.  
   - Add Telegram Send Message Node "Send Response3"  
     - Text: output of After Sales Agent  
     - Chat ID: `={{ $json.message.chat.id }}`  
     - Connect After Sales Agent output to this node.  
   - Connect Switch Interaction "Bot" output to After Sales Agent.

8. **Add Redis Set Node "Set Interaction to Bot" (for reactivation)**  
   - Key: `handoff_{{ $json.sessionId }}_state`  
   - Value: "bot"  
   - Used in Human Handoff block.

9. **Add Redis Set Node "Set Interaction to Human" (for handoff)**  
   - Key: `handoff_{{ $json.sessionId }}_state`  
   - Value: "human"  
   - Used in Human Handoff block.

10. **Configure Credentials:**  
    - Telegram API credentials for bot.  
    - Redis credentials for session and chat memory.  
    - OpenAI API credentials for AI agents.

11. **Add Sticky Notes (Optional):**  
    - Add explanatory sticky notes as per original workflow for documentation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Context or Link                                                                                                  |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| This workflow demonstrates a finite-state machine approach to managing conversational states in a Telegram bot using Redis for session state and chat memory. It leverages n8n's human-in-the-loop feature to pause execution and await human agent input for handoff scenarios.                                                                                                                                                                                                                 | Workflow Overview                                                                                               |
| Onboarding and After-Sales agents use separate Redis chat memories to maintain focused context per conversation phase.                                                                                                                                                                                                                                                                                                                                                                         | Workflow Design                                                                                                 |
| Human-in-the-loop feature allows seamless pausing and resuming of workflows based on human agent input, facilitating smooth bot-to-human and human-to-bot transitions.                                                                                                                                                                                                                                                                                                                           | n8n Documentation: https://docs.n8n.io/advanced-ai/examples/human-fallback/                                     |
| For Telegram integration details, see: https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.telegramtrigger/                                                                                                                                                                                                                                                                                                                                                                  | Telegram Trigger Documentation                                                                                  |
| For LangChain Agent usage, see: https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent                                                                                                                                                                                                                                                                                                                                                                     | LangChain Agent Documentation                                                                                   |
| For Information Extractor node details, see: https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.information-extractor                                                                                                                                                                                                                                                                                                                                       | Information Extractor Documentation                                                                              |
| For Subworkflow usage, see: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow                                                                                                                                                                                                                                                                                                                                                                                  | Subworkflow Documentation                                                                                        |
| Join n8n community for support: Discord https://discord.com/invite/XPKeKXeB7d, Forum https://community.n8n.io/                                                                                                                                                                                                                                                                                                                                                                                   | Community Support                                                                                               |

---

This structured documentation provides a comprehensive understanding of the Telegram AI Bot-to-Human Handoff workflow, enabling advanced users and automation agents to reproduce, modify, and anticipate operational considerations effectively.