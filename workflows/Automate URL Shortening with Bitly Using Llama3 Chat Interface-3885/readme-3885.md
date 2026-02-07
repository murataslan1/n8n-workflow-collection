Automate URL Shortening with Bitly Using Llama3 Chat Interface

https://n8nworkflows.xyz/workflows/automate-url-shortening-with-bitly-using-llama3-chat-interface-3885


# Automate URL Shortening with Bitly Using Llama3 Chat Interface

### 1. Workflow Overview

This workflow automates URL shortening using Bitly integrated with an AI chat interface powered by the Ollama Llama3 model. It targets users who need to quickly generate shortened links from long URLs, reducing manual effort and improving workflow efficiency. It is especially useful for users who compile and share numerous links regularly.

The workflow logic is structured into these main blocks:

- **1.1 Input Reception:** Captures user commands and URLs via an AI chat trigger node.
- **1.2 AI Processing:** Uses an AI Agent node that orchestrates the AI language model (Ollama Chat Model) and processes commands.
- **1.3 URL Shortening:** Utilizes the Bitly Tool node, integrated as an AI tool within the AI Agent, to create shortened URLs.
- **1.4 Output Delivery:** The AI Agent outputs the final shortened link for user access.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
Receives user input commands and URLs through an AI chat interface, triggering the workflow execution.

- **Nodes Involved:**  
  - Open Chat

- **Node Details:**  
  - **Open Chat**  
    - *Type & Role:* Chat trigger node from Langchain package; it listens for user chat inputs to start the workflow.  
    - *Configuration:* Default setup with a unique webhook ID; no additional parameters configured.  
    - *Expressions/Variables:* Captures input text from user chat messages.  
    - *Connections:* Outputs to AI Agent node.  
    - *Version-Specific Requirements:* Uses version 1.1; requires webhook capability.  
    - *Potential Failures:* Webhook connectivity issues, malformed input, or trigger not firing due to inactive workflow.  
    - *Sub-workflow:* None.

#### 2.2 AI Processing

- **Overview:**  
Processes the input commands through an AI Agent node that integrates an Ollama language model to interpret and act on the commands.

- **Nodes Involved:**  
  - AI Agent  
  - Ollama Chat Model

- **Node Details:**  
  - **AI Agent**  
    - *Type & Role:* Langchain AI Agent node coordinating AI tools and language models to process input and generate responses.  
    - *Configuration:* No explicit parameters shown; set to receive input from Open Chat and route calls to AI language model and Bitly tool.  
    - *Expressions/Variables:* Handles input from Open Chat; output results to 'Create Link' node.  
    - *Connections:* Input from Open Chat; outputs to Bitly Tool via ai_tool connection.  
    - *Version-Specific Requirements:* Version 1.9 utilized; supports ai_tool and ai_languageModel connections.  
    - *Potential Failures:* Model unavailability, AI processing errors, expression evaluation failures, or misconfiguration of linked AI tools.  
    - *Sub-workflow:* None.

  - **Ollama Chat Model**  
    - *Type & Role:* AI language model node using Ollama's Llama3 chat model to interpret user commands.  
    - *Configuration:* Default; linked as ai_languageModel input for AI Agent.  
    - *Expressions/Variables:* Processes commands from AI Agent.  
    - *Connections:* Input from AI Agent; output back to AI Agent.  
    - *Version-Specific Requirements:* Version 1.  
    - *Potential Failures:* Authentication failures with Ollama API, model loading timeouts, or input formatting issues.  
    - *Sub-workflow:* None.

#### 2.3 URL Shortening

- **Overview:**  
Performs the actual URL shortening using Bitly's API, invoked as an AI tool within the AI Agent.

- **Nodes Involved:**  
  - Create Link (Bitly Tool)

- **Node Details:**  
  - **Create Link**  
    - *Type & Role:* Bitly Tool node that creates shortened URLs from provided long URLs.  
    - *Configuration:* No explicit parameters; relies on input from AI Agent.  
    - *Expressions/Variables:* Receives URLs extracted/processed by AI Agent.  
    - *Connections:* Input from AI Agent via ai_tool connection; outputs shortened URLs.  
    - *Version-Specific Requirements:* Version 1; requires Bitly API credentials configured in n8n.  
    - *Potential Failures:* Bitly API rate limits, authentication errors, invalid URLs, or network timeouts.  
    - *Sub-workflow:* None.

#### 2.4 Output Delivery

- **Overview:**  
Delivers the final shortened URL response back to the user through the AI Agent's output.

- **Nodes Involved:**  
  - AI Agent (final output)

- **Node Details:**  
  - *Handled inside the AI Agent node as output to Open Chat or other configured endpoints.*  
  - *No separate output node exists; the AI Agent node's processed result is the final output.*

---

### 3. Summary Table

| Node Name        | Node Type                          | Functional Role              | Input Node(s) | Output Node(s) | Sticky Note                                                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------|----------------------------------|-----------------------------|---------------|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Open Chat        | @n8n/n8n-nodes-langchain.chatTrigger | Input Reception (Trigger)    | —             | AI Agent       | Set up an Open Chat Trigger node or any other trigger to start the workflow. Webhook ID is configured.                                                                                                                                                                                                                                                                                                                         |
| AI Agent         | @n8n/n8n-nodes-langchain.agent   | AI Processing Orchestration  | Open Chat     | Create Link    | AI Agent uses the Ollama Chat Model and Bitly Tool as AI Language Model and AI Tool respectively. No explicit parameters configured; ensure credentials are set. Version 1.9 used.                                                                                                                                                                                                                                                 |
| Ollama Chat Model| @n8n/n8n-nodes-langchain.lmChatOllama | AI Language Model            | AI Agent      | AI Agent       | Requires Ollama credential setup after downloading and running Ollama. Used by AI Agent as language model. Version 1.                                                                                                                                                                                                                                                                                                            |
| Create Link      | n8n-nodes-base.bitlyTool          | URL Shortening via Bitly     | AI Agent      | —              | Bitly Tool node linked as AI tool inside AI Agent. Ensure Bitly API credentials configured. Version 1.                                                                                                                                                                                                                                                                                                                           |
| Sticky Note      | n8n-nodes-base.stickyNote         | Documentation/Comments       | —             | —              | Multiple sticky notes present; see notes column for setup instructions and workflow context.                                                                                                                                                                                                                                                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Trigger Node:**
   - Add a **Chat Trigger** node from the Langchain package (`@n8n/n8n-nodes-langchain.chatTrigger`).
   - Configure it with a unique webhook ID to listen for incoming chat messages.
   - No additional parameters required.
   - This node will start the workflow on user input.

2. **Add the AI Agent Node:**
   - Add an **AI Agent** node (`@n8n/n8n-nodes-langchain.agent`).
   - Connect the output of the Chat Trigger node to the AI Agent node's input.
   - No explicit parameters required initially; the AI Agent is set to receive input and route it to AI language model and tools.

3. **Configure the Ollama Chat Model Node:**
   - Add an **Ollama Chat Model** node (`@n8n/n8n-nodes-langchain.lmChatOllama`).
   - Set up Ollama credentials through n8n credentials manager after installing and running the Ollama model locally or via API.
   - Connect this node as the AI language model (`ai_languageModel`) input to the AI Agent node.
   - The AI Agent will use this node to interpret chat commands.

4. **Add the Bitly Tool Node:**
   - Add a **Bitly Tool** node (`n8n-nodes-base.bitlyTool`).
   - Set up Bitly API credentials in n8n (OAuth2 or token-based depending on Bitly account).
   - Connect this node as an AI tool (`ai_tool`) input to the AI Agent node.
   - No additional parameters needed; Bitly Tool will receive URLs and return shortened links.

5. **Link Nodes Properly:**
   - From the Chat Trigger node output, connect to AI Agent input.
   - From AI Agent, connect `ai_languageModel` input to Ollama Chat Model node.
   - From AI Agent, connect `ai_tool` input to Bitly Tool node.

6. **Configure Credentials:**
   - For **Ollama Chat Model**, create a credential in n8n linking to your running Ollama Llama3 model instance.
   - For **Bitly Tool**, create and link Bitly API credentials (API token or OAuth2).

7. **Save and Activate:**
   - Save the workflow.
   - Activate it to allow webhook triggers.
   - Test by sending chat commands containing URLs to shorten.

8. **Optional Customizations:**
   - Add additional output nodes (e.g., email, messaging) to send shortened links automatically.
   - Enhance AI Agent prompts or add error handling nodes as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                       | Context or Link                                                                                                                   |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Ollama setup guide required before using Ollama Chat Model node; download and run Ollama model locally or via API.                                                                                                                                 | Refer to Ollama official documentation or n8n community guides on setting up Ollama credentials.                                 |
| Workflow is intended as a community service and learning tool to automate URL shortening and reduce manual link creation time.                                                                                                                   | Workflow description section.                                                                                                   |
| Customize by adding other trigger nodes or output nodes (e.g., email) to expand automation capabilities.                                                                                                                                           | Workflow description section.                                                                                                   |
| Save and ensure workflow is active; credentials must be properly configured in each node for the workflow to function.                                                                                                                             | Workflow description section.                                                                                                   |
| Bitly API credentials must be configured properly to avoid authentication errors or API limits.                                                                                                                                                    | Bitly Tool node requirements.                                                                                                   |
| AI Agent node version 1.9 supports linking multiple AI tools and language models; ensure compatibility with n8n version.                                                                                                                           | Node version notes.                                                                                                             |
| Open Chat trigger node requires webhook to receive chat messages; ensure network accessibility for webhook URL.                                                                                                                                    | Open Chat node notes.                                                                                                           |

---

This documentation provides a comprehensive reference to understand, reproduce, and maintain the "Automate URL Shortening with Bitly Using Llama3 Chat Interface" workflow in n8n. It covers the logic flow from receiving input to delivering shortened URLs, integration points, and configuration essentials.