Auto-Respond to Slack Messages as Yourself using GPT and Google Docs RAG

https://n8nworkflows.xyz/workflows/auto-respond-to-slack-messages-as-yourself-using-gpt-and-google-docs-rag-7426


# Auto-Respond to Slack Messages as Yourself using GPT and Google Docs RAG

---

### 1. Workflow Overview

This workflow automates personalized Slack message responses by leveraging GPT-5 AI and Google Docs for Retrieval-Augmented Generation (RAG). It listens for Slack mentions or messages directed at a specific user and replies on their behalf with context-aware, friendly, and accurate answers. The workflow integrates conversation memory to maintain context and references live project updates stored in a Google Docs document to ensure factual correctness.

**Logical Blocks:**

- **1.1 Slack Input Reception:** Listens for Slack mentions or messages directed at the user.
- **1.2 AI Processing & Context Management:** Uses GPT-5 with a custom agent and conversation memory to generate context-aware replies.
- **1.3 Reference Document Retrieval (RAG):** Pulls live content from a specified Google Docs document for up-to-date project information.
- **1.4 Slack Response Dispatch:** Sends the AI-generated reply back to the Slack channel as the user.
- **1.5 Informational Annotations:** Sticky notes providing context, instructions, and branding for workflow clarity.

---

### 2. Block-by-Block Analysis

#### 1.1 Slack Input Reception

- **Overview:**  
  This block triggers the workflow when the user is mentioned or receives any Slack event, filtering specifically for messages addressed to the configured user ID.

- **Nodes Involved:**  
  - Slack Trigger

- **Node Details:**

  - **Slack Trigger**  
    - *Type & Role:* Event trigger node listening for Slack workspace events.  
    - *Configuration:*  
      - Watches the entire workspace.  
      - Triggers on any event and specifically on app mentions.  
      - Filters events to only those involving a specified user ID (denoted as `"User_ID"` placeholder to be replaced).  
    - *Expressions:* Uses expression to match Slack channel from the event JSON.  
    - *Inputs:* None (trigger node).  
    - *Outputs:* Passes event data downstream.  
    - *Edge Cases:*  
      - Authentication errors if Slack credentials expire.  
      - Incorrect user ID may cause no triggers.  
      - Workspace permission changes may interrupt event reception.  
    - *Sub-workflow:* None.

#### 1.2 AI Processing & Context Management

- **Overview:**  
  This block processes incoming Slack messages using a GPT-5 Langchain agent configured to impersonate the user "Jacob" with a friendly, natural tone. It manages conversation context through a windowed memory buffer keyed by Slack channel.

- **Nodes Involved:**  
  - GPT 5 Slack Agent  
  - Simple Memory  
  - OpenAI Chat Model

- **Node Details:**

  - **GPT 5 Slack Agent**  
    - *Type & Role:* Langchain AI agent node integrating language model, memory, and tools to generate replies.  
    - *Configuration:*  
      - Receives the incoming Slack message text as input.  
      - System prompt defines the AI persona as "Jacob," a social media manager at Purple Unicorn Marketing Agency.  
      - Instructions emphasize a friendly, natural style typical in a tech work environment.  
      - Includes a tool usage instruction to invoke the Google Docs tool when asked about project updates.  
      - Uses "define" prompt type for controlled prompt engineering.  
    - *Expressions:* Pulls message text from Slack Trigger node JSON.  
    - *Inputs:* Slack Trigger node (main), OpenAI Chat Model (ai_languageModel), Simple Memory (ai_memory), Google Docs Tool (ai_tool).  
    - *Outputs:* AI-generated text output to Slack message sender node.  
    - *Edge Cases:*  
      - Failure if OpenAI API quota exceeded or credentials invalid.  
      - Prompt or memory corruption causing irrelevant or incorrect responses.  
      - Tool integration errors if Google Docs document unavailable or malformed.  
    - *Sub-workflow:* None.

  - **Simple Memory**  
    - *Type & Role:* Langchain memory buffer (windowed) to maintain conversation history per Slack channel.  
    - *Configuration:*  
      - Session key dynamically set to the Slack channel ID to isolate conversation context.  
      - Custom session ID type to ensure unique memory per conversation thread.  
    - *Inputs:* Feeds memory data into GPT 5 Slack Agent node.  
    - *Outputs:* Provides conversation memory context to AI agent.  
    - *Edge Cases:*  
      - Memory can grow large; window size may need tuning.  
      - Session key misconfiguration may cause cross-conversation context pollution.  
    - *Sub-workflow:* None.

  - **OpenAI Chat Model**  
    - *Type & Role:* Language model node to execute the GPT-5 chat completions.  
    - *Configuration:*  
      - Model set to "gpt-5" (latest GPT version assumed).  
      - No additional options configured, using defaults for generation.  
    - *Inputs:* Connected as language model backend for GPT 5 Slack Agent node.  
    - *Outputs:* Provides generated language responses.  
    - *Edge Cases:*  
      - API rate limits and latency.  
      - Model version availability and compatibility with Langchain node version.  
    - *Sub-workflow:* None.

#### 1.3 Reference Document Retrieval (RAG)

- **Overview:**  
  This block fetches live data from a specified Google Docs document, allowing the AI agent to reference up-to-date project information during response generation.

- **Nodes Involved:**  
  - Get a document in Google Docs

- **Node Details:**

  - **Get a document in Google Docs**  
    - *Type & Role:* Google Docs Tool node configured for document retrieval.  
    - *Configuration:*  
      - Operation set to "get" the content of a Google Docs document.  
      - Document specified by URL or document ID placeholder ("GOOGLE DOC ID OR URL").  
    - *Inputs:* Connected as a tool from GPT 5 Slack Agent node.  
    - *Outputs:* Provides the retrieved document content to the AI agent for RAG.  
    - *Edge Cases:*  
      - Authentication failure if Google credentials expire or lack permission.  
      - Document not found or access denied errors.  
      - Latency or quota limits on Google Docs API.  
    - *Sub-workflow:* None.

#### 1.4 Slack Response Dispatch

- **Overview:**  
  Sends the AI-generated message back to the Slack channel impersonating the user "Jacob," ensuring replies feel natural and integrated.

- **Nodes Involved:**  
  - Send a message

- **Node Details:**

  - **Send a message**  
    - *Type & Role:* Slack node to post messages to channels.  
    - *Configuration:*  
      - Text field dynamically set to AI agent's output.  
      - Channel ID extracted from the incoming Slack event JSON.  
      - Sends message as user "Jacob" (configured to impersonate).  
      - Disables including workflow link in message to keep replies clean.  
    - *Inputs:* Receives AI-generated message from GPT 5 Slack Agent node.  
    - *Outputs:* None (terminal node).  
    - *Edge Cases:*  
      - Slack API rate limits or permission errors.  
      - Channel ID extraction errors if incoming event malformed.  
      - User impersonation might fail if Slack token lacks proper scopes.  
    - *Sub-workflow:* None.

#### 1.5 Informational Annotations

- **Overview:**  
  Sticky notes provide descriptive guidance, branding, and explanation of workflow components for maintainers and users.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  
  - Sticky Note2  
  - Sticky Note3

- **Node Details:**

  - **Sticky Note**  
    - Content: "Slack Respond as a User"  
    - Positioned near the Slack response node for clarity.

  - **Sticky Note1**  
    - Content: "GPT-5 Agent"  
    - Positioned near AI processing nodes.

  - **Sticky Note2**  
    - Content: "Slack Trigger"  
    - Positioned near the Slack Trigger node.

  - **Sticky Note3**  
    - Content: Detailed description including:  
      - Workflow purpose and benefits.  
      - Key features (RAG accuracy, GPT-5 natural conversation, instant responses, impersonation mode, conversation memory).  
      - Ideal use cases (stand-in answering, project management, support roles).  
      - Included integrations.  
      - Link to instructional video channel: https://www.youtube.com/@automatewithmarc  
      - Pro tip about customizing system prompt and expanding document coverage.  
    - Large note positioned prominently for workflow overview and instructions.

---

### 3. Summary Table

| Node Name                | Node Type                          | Functional Role              | Input Node(s)               | Output Node(s)            | Sticky Note                              |
|--------------------------|----------------------------------|-----------------------------|-----------------------------|---------------------------|-----------------------------------------|
| Slack Trigger            | n8n-nodes-base.slackTrigger       | Slack event listener        | None                        | GPT 5 Slack Agent         | Slack Trigger                           |
| GPT 5 Slack Agent        | @n8n/n8n-nodes-langchain.agent    | AI message generation       | Slack Trigger, Simple Memory, OpenAI Chat Model, Get a document in Google Docs | Send a message             | GPT-5 Agent                            |
| Simple Memory            | @n8n/n8n-nodes-langchain.memoryBufferWindow | Conversation memory         | None                        | GPT 5 Slack Agent         | GPT-5 Agent                            |
| OpenAI Chat Model        | @n8n/n8n-nodes-langchain.lmChatOpenAi | Language model backend      | None                        | GPT 5 Slack Agent         | GPT-5 Agent                            |
| Get a document in Google Docs | n8n-nodes-base.googleDocsTool  | Reference document retrieval| None                        | GPT 5 Slack Agent         |                                         |
| Send a message           | n8n-nodes-base.slack              | Slack message sender        | GPT 5 Slack Agent           | None                      | Slack Respond as a User                |
| Sticky Note              | n8n-nodes-base.stickyNote         | Informational annotation    | None                        | None                      | Slack Respond as a User                |
| Sticky Note1             | n8n-nodes-base.stickyNote         | Informational annotation    | None                        | None                      | GPT-5 Agent                           |
| Sticky Note2             | n8n-nodes-base.stickyNote         | Informational annotation    | None                        | None                      | Slack Trigger                        |
| Sticky Note3             | n8n-nodes-base.stickyNote         | Informational annotation    | None                        | None                      | See detailed workflow overview note  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Slack Trigger Node:**  
   - Type: Slack Trigger  
   - Set trigger to listen for "any_event" and "app_mention."  
   - Enable "Watch Workspace."  
   - Configure user ID filter with your Slack user ID (replace `"User_ID"`).  
   - Connect output to GPT 5 Slack Agent node input.

2. **Create OpenAI Chat Model Node:**  
   - Type: @n8n/n8n-nodes-langchain.lmChatOpenAi  
   - Set model to "gpt-5."  
   - Leave options default.  
   - No direct input; will be connected as AI language model for agent node.

3. **Create Simple Memory Node:**  
   - Type: @n8n/n8n-nodes-langchain.memoryBufferWindow  
   - Set session key expression to `{{$json.channel}}` to isolate memory per Slack channel.  
   - Use "customKey" for session ID type.  
   - No direct input; connected as AI memory for agent node.

4. **Create Google Docs Tool Node:**  
   - Type: n8n-nodes-base.googleDocsTool  
   - Operation: "get."  
   - Set Document URL or ID to your project update Google Doc.  
   - No direct input; connected as AI tool for agent node.

5. **Create GPT 5 Slack Agent Node:**  
   - Type: @n8n/n8n-nodes-langchain.agent  
   - Set input text to `{{$json.text}}` from Slack Trigger.  
   - In options, set system message:  
     ```
     You are Jacob, a social media manager at Purple Unicorn Marketing Agency. Respond to your members' message on Jacob's behalf on Slack. Sound friendly and natural in a typical tech working environment.

     ##Tool
     Use the Google Doc Tool when asked about Project Updates
     ```  
   - Set prompt type to "define."  
   - Connect AI language model input to OpenAI Chat Model node.  
   - Connect AI memory input to Simple Memory node.  
   - Connect AI tool input to Google Docs Tool node.  
   - Connect main output to Slack Send Message node.

6. **Create Slack Send Message Node:**  
   - Type: n8n-nodes-base.slack  
   - Set "Text" to `{{$json.output}}` (AI response).  
   - Channel ID: Expression `{{$node["Slack Trigger"].json.channel}}` to target incoming message channel.  
   - In "Other Options," set "Send As User" to "Jacob" (your Slack username).  
   - Disable "Include Link To Workflow."  
   - Connect input from GPT 5 Slack Agent node.

7. **Set Credentials:**  
   - Slack nodes require Slack OAuth2 credentials with permissions for reading events, posting messages, and impersonation.  
   - OpenAI Chat Model requires valid OpenAI API key with GPT-5 access.  
   - Google Docs Tool requires Google OAuth2 credentials with read access to the specified document.

8. **(Optional) Add Sticky Notes:**  
   - Add notes near each block for clarity with contents as per original workflow:
     - Slack Trigger: "Slack Trigger"  
     - GPT Agent: "GPT-5 Agent"  
     - Slack Response: "Slack Respond as a User"  
     - Workflow Overview with full description and video link.

9. **Activate Workflow:**  
   - Test by mentioning your Slack user in your workspace and verify automated reply.  
   - Monitor for errors, API limits, and adjust session memory window as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                               |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| This workflow uses Retrieval-Augmented Generation (RAG) by combining GPT-5 AI with live Google Docs data to ensure accurate, real-time Slack responses. Ideal for social media managers, project managers, and support roles who need timely, context-aware replies.                                                                                                                                                                                                                                           | Workflow purpose and use cases                                |
| Customize the system prompt in the GPT 5 Slack Agent node to better match your tone, role, or company style. Multiple Google Docs integrations can expand knowledge coverage beyond a single document.                                                                                                                                                                                                                                                                                                       | Customization tip                                             |
| Video walkthroughs and detailed build explanations are available at: https://www.youtube.com/@automatewithmarc                                                                                                                                                                                                                                                                                                                                                                                           | Video resource                                                |
| Ensure Slack OAuth2 credentials have scopes for `channels:read`, `chat:write`, `users:read`, and any other necessary permissions for event subscription and message sending as a user.                                                                                                                                                                                                                                                                                                                 | Slack credentials requirements                                 |
| Ensure Google OAuth2 credentials have at least "Viewer" access to the project update Google Docs document.                                                                                                                                                                                                                                                                                                                                                                                             | Google Docs credentials requirement                            |
| Keep an eye on OpenAI API usage to avoid hitting rate limits or exhausting quota, especially with GPT-5.                                                                                                                                                                                                                                                                                                                                                                                               | OpenAI API usage considerations                               |

---

**Disclaimer:** The text provided is derived solely from an automated n8n workflow. It fully complies with applicable content policies and contains no illegal, offensive, or protected material. All data processed is legal and public.

---