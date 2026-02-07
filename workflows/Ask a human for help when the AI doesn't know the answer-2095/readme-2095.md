Ask a human for help when the AI doesn't know the answer

https://n8nworkflows.xyz/workflows/ask-a-human-for-help-when-the-ai-doesn-t-know-the-answer-2095


# Ask a human for help when the AI doesn't know the answer

### 1. Workflow Overview

This workflow is designed to handle user queries via an AI-powered chat agent using the GPT-4 model. Its primary goal is to answer questions automatically; however, when the AI model is uncertain or unable to provide an answer, it escalates the query to human support by sending a message to a Slack channel. The workflow also ensures that users provide an email address to facilitate follow-up communication by prompting them if none is supplied.

Logical blocks within the workflow:

- **1.1 Input Reception:** Listens for incoming chat messages to trigger the AI processing.
- **1.2 AI Processing and Memory:** Uses GPT-4 with a simple conversational memory buffer and an AI agent node to generate responses or determine uncertainty.
- **1.3 Uncertainty Handling (Custom Tool Sub-Workflow):** If the AI is unsure, it triggers a sub-workflow that verifies if the user provided an email address, prompts for it if missing, or sends a Slack message to request human assistance.
- **1.4 Human Escalation and Confirmation:** Sends a message to Slack for human help and confirms to the user that human support was requested.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block waits for a user to send a chat message to initiate processing.

- **Nodes Involved:**  
  - When chat message received

- **Node Details:**  
  - **When chat message received**  
    - *Type & role:* Chat trigger node that listens to incoming messages from a chat interface or platform.  
    - *Configuration:* Uses a webhook to receive chat messages; no special options configured.  
    - *Input/Output:* No inbound connections; outputs the chat message data when triggered.  
    - *Edge cases:* Webhook connectivity issues, message format errors.  
    - *Version:* 1.1.  
    - *Sticky Notes:* Provides instructions to try the workflow by sending a chat message pretending the AI doesn’t know the answer.

#### 2.2 AI Processing and Memory

- **Overview:**  
  This block processes the user’s message using GPT-4 with a memory buffer to maintain conversational context and an AI agent node to manage logic and tools.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  
  - Simple Memory  
  - Not sure? (Custom AI tool)

- **Node Details:**  
  - **AI Agent**  
    - *Type & role:* Langchain agent node that orchestrates AI response generation using language models, memory, and tools.  
    - *Configuration:* No special options set; connects to the OpenAI model, memory, and custom tool.  
    - *Input:* From “When chat message received” node.  
    - *Output:* To the sub-workflow trigger if unsure.  
    - *Edge cases:* Agent misinterpretation, AI API rate limits, or timeouts.  
    - *Version:* 1.8.

  - **OpenAI Chat Model**  
    - *Type & role:* OpenAI GPT-4 chat model node for generating AI responses.  
    - *Configuration:* Uses GPT-4o-mini model variant; OpenAI credentials required.  
    - *Input:* Connected as AI language model to the agent node.  
    - *Output:* Text completions to the agent.  
    - *Edge cases:* API key invalid, request quota exceeded, network issues.  
    - *Version:* 1.2.

  - **Simple Memory**  
    - *Type & role:* Buffer window memory node storing recent conversation history for context in AI responses.  
    - *Configuration:* Default buffer, no custom parameters.  
    - *Input/Output:* Connected as AI memory to the agent node.  
    - *Edge cases:* Memory overflow or loss if large conversations.  
    - *Version:* 1.3.

  - **Not sure? (Custom AI tool)**  
    - *Type & role:* Tool workflow node acting as a fallback when AI is uncertain.  
    - *Configuration:* References the current workflow as a sub-workflow (self-reference) with parameter `chatInput`.  
    - *Input:* Connected as AI tool to the agent node.  
    - *Output:* Triggers the sub-workflow to handle uncertainty.  
    - *Edge cases:* Circular references, sub-workflow misconfiguration.  
    - *Version:* 2.

- **Sticky Notes:**  
  - “Main workflow: AI agent using custom tool” describes this block.

#### 2.3 Uncertainty Handling (Custom Tool Sub-Workflow)

- **Overview:**  
  When the AI is not confident in its answer, this sub-workflow checks if the user has provided an email address. If not, it prompts the user to include one. If yes, it escalates the issue by messaging a Slack channel for human help.

- **Nodes Involved:**  
  - When Executed by Another Workflow  
  - Check if user has provided email (IF node)  
  - Message Slack for help  
  - Prompt the user to provide an email  
  - Confirm that we've messaged a human

- **Node Details:**  
  - **When Executed by Another Workflow**  
    - *Type & role:* Trigger node that starts this sub-workflow when called by the main workflow.  
    - *Configuration:* Expects `chatInput` as workflow input parameter.  
    - *Input:* None.  
    - *Output:* To the IF node checking for email.  
    - *Edge cases:* Missing or malformed input parameters.  
    - *Version:* 1.1.

  - **Check if user has provided email (IF node)**  
    - *Type & role:* Conditional node that uses regex to detect an email address in the user's input.  
    - *Configuration:* Regex pattern matches typical email formats (case-sensitive, strict validation).  
    - *Input:* From “When Executed by Another Workflow”.  
    - *Output:*  
      - True branch: User provided email → “Message Slack for help”  
      - False branch: No email → “Prompt the user to provide an email”  
    - *Edge cases:* False negatives if email format is unusual; false positives if input contains email-like text accidentally.  
    - *Version:* 2.2.

  - **Message Slack for help**  
    - *Type & role:* Slack node that sends a notification message to the support channel.  
    - *Configuration:*  
      - Sends a message to Slack channel `#general` (configurable).  
      - Message text includes the user’s original question.  
      - Requires Slack API credentials.  
    - *Input:* True branch from IF node.  
    - *Output:* To “Confirm that we've messaged a human”.  
    - *Edge cases:* Slack authentication errors, channel access issues, message delivery failures.  
    - *Version:* 2.3.

  - **Prompt the user to provide an email**  
    - *Type & role:* Code node that returns a prompt message asking the user to repeat their question including their email.  
    - *Configuration:* JavaScript code returns a fixed message requesting email address with explanation.  
    - *Input:* False branch from IF node.  
    - *Output:* Final user message response.  
    - *Edge cases:* None significant; possible logic workflow failure if code malformed.  
    - *Version:* 2.

  - **Confirm that we've messaged a human**  
    - *Type & role:* Code node that returns a thank you confirmation message to the user after escalation.  
    - *Configuration:* JavaScript code returning a fixed confirmation string.  
    - *Input:* From Slack message node.  
    - *Output:* Final user message response.  
    - *Edge cases:* None significant.  
    - *Version:* 2.

- **Sticky Notes:**  
  - “Sub-workflow: Custom tool” explains this block’s purpose.  
  - “Set your credentials” for Slack and other nodes.

#### 2.4 Human Escalation and Confirmation

- **Overview:**  
  This block confirms to the user that human help was requested after the Slack message is sent.

- **Nodes Involved:**  
  - Confirm that we've messaged a human

- **Node Details:**  
  - Already detailed in 2.3 above; outputs a user-facing confirmation message.

- **Sticky Notes:**  
  - Credential setup reminders for Slack.

---

### 3. Summary Table

| Node Name                       | Node Type                         | Functional Role                          | Input Node(s)                      | Output Node(s)                         | Sticky Note                                                                                         |
|--------------------------------|----------------------------------|----------------------------------------|----------------------------------|--------------------------------------|---------------------------------------------------------------------------------------------------|
| When chat message received      | Chat Trigger                     | Entry point for user chat messages     | None                             | AI Agent                             | Try it out: Select **Chat** and enter a test message pretending AI doesn’t know the answer.       |
| AI Agent                       | Langchain Agent                  | Main AI processing and decision making | When chat message received       | Not sure? (Custom tool)              | Main workflow: AI agent using custom tool                                                         |
| OpenAI Chat Model              | OpenAI GPT-4 Model               | AI language model for generating replies | Connected to AI Agent (ai_languageModel) | AI Agent                          | Set your credentials                                                                               |
| Simple Memory                 | Memory Buffer                   | Stores conversation history             | Connected to AI Agent (ai_memory) | AI Agent                            |                                                                                                   |
| Not sure?                     | Tool Workflow (Custom Tool)      | Trigger sub-workflow when AI unsure    | Connected to AI Agent (ai_tool)  | When Executed by Another Workflow    | This tool calls the sub-workflow below                                                            |
| When Executed by Another Workflow | Execute Workflow Trigger         | Sub-workflow entry point for email check | Not sure?                      | Check if user has provided email     | Sub-workflow: Custom tool                                                                         |
| Check if user has provided email | IF                              | Checks if user input contains an email | When Executed by Another Workflow | Message Slack for help, Prompt the user to provide an email | Sub-workflow: Custom tool                                                                         |
| Message Slack for help         | Slack                           | Sends message to Slack for human help  | Check if user has provided email (true branch) | Confirm that we've messaged a human | Set your credentials and Slack details                                                            |
| Prompt the user to provide an email | Code                           | Prompts user to provide email           | Check if user has provided email (false branch) | None                             | Sub-workflow: Custom tool                                                                         |
| Confirm that we've messaged a human | Code                        | Confirms escalation message to user    | Message Slack for help           | None                                | Sub-workflow: Custom tool                                                                         |
| Sticky Note1                  | Sticky Note                      | Documentation for sub-workflow          | None                            | None                                | ### Sub-workflow: Custom tool The agent above can call this workflow. It checks if the user has supplied an email address. If they haven't it prompts them to provide one. If they have, it messages a customer support channel for help. |
| Sticky Note2                  | Sticky Note                      | Documentation for main workflow         | None                            | None                                | ### Main workflow: AI agent using custom tool                                                    |
| Sticky Note                   | Sticky Note                      | Documentation for custom tool node      | None                            | None                                | **This tool calls the sub-workflow below**                                                      |
| Sticky Note3                  | Sticky Note                      | Usage instructions for testing          | None                            | None                                | ## Try it out Select **Chat** at the bottom and enter: _Hi! Please respond to this as if you don't know the answer to my query._ |
| Sticky Note4                  | Sticky Note                      | Credential setup reminder for Slack     | None                            | None                                | **Set your credentials and Slack details**                                                       |
| Sticky Note5                  | Sticky Note                      | Credential setup reminder                | None                            | None                                | **Set your credentials**                                                                         |
| Sticky Note6                  | Sticky Note                      | Link to further advanced AI documentation | None                            | None                                | ## Next steps Learn more about [Advanced AI in n8n](https://docs.n8n.io/advanced-ai/)              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add the “When chat message received” node:**  
   - Type: `@n8n/n8n-nodes-langchain.chatTrigger`  
   - Configure webhook (auto-generated).  
   - No special options.  
   - Position it on the left side.

3. **Add “OpenAI Chat Model” node:**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Model: Select `gpt-4o-mini` (GPT-4 variant).  
   - Add OpenAI credentials (create or select an existing API key).  
   - No additional options.  
   - Position to the right of chat trigger.

4. **Add “Simple Memory” node:**  
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
   - Leave defaults.  
   - Position near the OpenAI node.

5. **Add “Not sure?” node (Tool Workflow):**  
   - Type: `@n8n/n8n-nodes-langchain.toolWorkflow`  
   - Set `name` to `dont_know_tool`.  
   - Workflow ID: Set to the current workflow (self-reference).  
   - Define input parameter `chatInput` as string.  
   - Description: "Use this tool if you don't know the answer to the user's question ..."  
   - Position near the AI Agent node (next step).

6. **Add “AI Agent” node:**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - No special options needed.  
   - Connect inputs:  
     - AI languageModel input: Connect from “OpenAI Chat Model”.  
     - AI memory input: Connect from “Simple Memory”.  
     - AI tool input: Connect from “Not sure?” node.  
   - Connect main input: Connect from “When chat message received”.

7. **Connect output from “AI Agent” to the sub-workflow trigger:**

8. **Create a new workflow for the sub-workflow (name e.g., “Email Check and Human Escalation”):**

9. **In the sub-workflow, add “When Executed by Another Workflow” trigger:**  
   - Input parameter: `chatInput` (string).  
   - Position on the left.

10. **Add “Check if user has provided email” IF node:**  
    - Condition: Use regex operator on expression `{{$json["chatInput"]}}` to detect email format matching regex `/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi`.  
    - Position to the right.

11. **Add “Message Slack for help” node:**  
    - Type: `Slack`.  
    - Configure with Slack API credentials (OAuth2).  
    - Channel: Set to `#general` or desired support channel.  
    - Message text: `"A user had a question the bot couldn't answer. Here's their message: {{$json["chatInput"]}}"`.  
    - Connect IF node’s true branch to this node.  
    - Position to the right.

12. **Add “Confirm that we've messaged a human” Code node:**  
    - JavaScript code:  
      ```js
      return { response: "Thank you for getting in touch. I've messaged a human to help." };
      ```  
    - Connect from Slack node.  
    - Position right of Slack node.

13. **Add “Prompt the user to provide an email” Code node:**  
    - JavaScript code:  
      ```js
      return { response: "I'm sorry I don't know the answer. Please repeat your question and include your email address so I can request help." };
      ```  
    - Connect IF node’s false branch to this node.  
    - Position below IF node.

14. **Connect “When Executed by Another Workflow” node to IF node.**

15. **Save the sub-workflow.**

16. **Back in the main workflow, configure the “Not sure?” toolWorkflow node to call the sub-workflow by its workflow ID and map the parameter `chatInput` to the user's input.**

17. **Verify all credentials are set:**  
    - OpenAI API key for the OpenAI Chat Model node.  
    - Slack OAuth2 credentials for the Slack node in the sub-workflow.

18. **Test the workflow:**  
    - Send a chat message that the AI cannot confidently answer.  
    - If no email is provided, user is prompted to supply one.  
    - If email included, a message is sent to Slack and confirmation returned.

19. **Add sticky notes as helpful documentation and reminders on credential setup where appropriate.**

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                                  |
|-----------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| This workflow is used in [Advanced AI examples | Ask a human](https://docs.n8n.io/advanced-ai/examples/human-fallback/) in the n8n documentation. | Official n8n Documentation                                      |
| Learn more about Advanced AI in n8n at [https://docs.n8n.io/advanced-ai/](https://docs.n8n.io/advanced-ai/)       | Further reading and resources on AI workflows in n8n            |
| Ensure Slack credentials use OAuth2 with proper permissions to post messages in the chosen channel.              | Credential setup notes                                          |
| Test the workflow by submitting messages pretending the AI does not know the answer to trigger fallback logic.   | Sticky Note3 instructions                                        |

---

This completes the comprehensive analysis and documentation of the "Ask a human for help when the AI doesn't know the answer" workflow.