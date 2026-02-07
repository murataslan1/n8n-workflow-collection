Automate Web Interactions with Claude 3.5 Haiku and Airtop Browser Agent

https://n8nworkflows.xyz/workflows/automate-web-interactions-with-claude-3-5-haiku-and-airtop-browser-agent-3592


# Automate Web Interactions with Claude 3.5 Haiku and Airtop Browser Agent

### 1. Workflow Overview

This workflow automates web interactions by simulating a human user through a smart AI agent integrated with a remote browser controlled via Airtop tools. It is designed to receive user instructions via a form, then execute complex web browsing tasks such as loading URLs, querying page content, clicking elements, and typing text, all orchestrated by an AI agent powered by Anthropic's Claude 3.5 Haiku model.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures user instructions and optional Airtop profile for authenticated sessions.
- **1.2 AI Agent Processing:** The core agent interprets user prompts and manages browser interactions using various Airtop tools.
- **1.3 Browser Session Management:** Handles creation and management of browser sessions and windows.
- **1.4 Web Interaction Tools:** Executes specific browser actions like loading URLs, querying page content, clicking elements, typing text, and ending sessions.
- **1.5 Output Handling:** Parses the agent’s structured output and prepares it for final delivery.
- **1.6 Optional Slack Integration:** Sends notifications or live view URLs to Slack channels (currently disabled or optional).

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block triggers the workflow upon form submission, collecting user instructions and an optional Airtop profile name for authenticated browsing.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**

  - **On form submission**  
    - Type: Form Trigger  
    - Role: Entry point capturing user input via a web form.  
    - Configuration:  
      - Form titled "Instruction for the Web AI Agent"  
      - Fields:  
        - "Prompt" (textarea, required): User’s instructions for the AI agent.  
        - "Airtop Profile Name (for sites that require authentication)" (optional text).  
      - Webhook ID configured for external form submissions.  
    - Inputs: External HTTP form submission  
    - Outputs: JSON containing user prompt and optional profile name  
    - Edge Cases: Missing required prompt field; malformed input data.

---

#### 2.2 AI Agent Processing

- **Overview:**  
  The AI Agent node is the workflow’s brain, interpreting the user prompt and orchestrating browser interactions through Airtop tools. It uses Anthropic’s Claude 3.5 Haiku language model for natural language understanding and decision-making.

- **Nodes Involved:**  
  - AI Agent  
  - Claude 3.5 Haiku  
  - Structured Output Parser  
  - Output

- **Node Details:**

  - **AI Agent**  
    - Type: Langchain Agent Node  
    - Role: Executes iterative AI-driven steps to fulfill user requests by calling Airtop browser tools.  
    - Configuration:  
      - Input text: User prompt from form submission.  
      - System message defines agent goal and usage instructions for browser tools (Start browser, Query, Click, Type, End session).  
      - Max iterations: 20 (limits agent’s action loop).  
      - Passthrough binary images enabled (for handling images if needed).  
      - Output parser enabled to structure final results.  
    - Inputs: User prompt, Anthropic model output, Airtop tool results  
    - Outputs: Structured JSON results of the agent’s synthesis  
    - Edge Cases: API rate limits, Anthropic API errors, Airtop API failures, iteration timeouts, malformed tool responses.

  - **Claude 3.5 Haiku**  
    - Type: Langchain Chat Language Model (Anthropic)  
    - Role: Provides natural language understanding and generation for the AI Agent.  
    - Configuration: Uses "claude-3-5-haiku-20241022" model.  
    - Credentials: Requires Anthropic API key.  
    - Inputs: Agent system message and user prompt.  
    - Outputs: AI-generated responses for agent decision-making.  
    - Edge Cases: API authentication errors, model unavailability, latency.

  - **Structured Output Parser**  
    - Type: Langchain Structured Output Parser  
    - Role: Parses the AI Agent’s raw output into a defined JSON schema for consistent downstream processing.  
    - Configuration: Manual schema expecting an object with a "results" string property summarizing the agent’s findings.  
    - Inputs: AI Agent’s raw output.  
    - Outputs: Parsed structured JSON.  
    - Edge Cases: Parsing errors if output does not conform to schema.

  - **Output**  
    - Type: Set Node  
    - Role: Prepares the final output by extracting the "results" from the structured parser and assigning it to a key named "output".  
    - Inputs: Structured Output Parser JSON.  
    - Outputs: JSON with "output" string.  
    - Edge Cases: Missing or empty results.

---

#### 2.3 Browser Session Management

- **Overview:**  
  This block manages the lifecycle of browser sessions and windows required for web automation, including session creation and window opening.

- **Nodes Involved:**  
  - When Executed by Another Workflow  
  - Session  
  - Window  
  - Return IDs  
  - Start browser (sub-workflow)

- **Node Details:**

  - **When Executed by Another Workflow**  
    - Type: Execute Workflow Trigger  
    - Role: Entry point for sub-workflow execution, receiving inputs like URL and profile name.  
    - Inputs: Workflow parameters "url" and "profile_name".  
    - Outputs: Passes inputs downstream.  
    - Edge Cases: Missing parameters.

  - **Session**  
    - Type: Airtop Node  
    - Role: Creates a new browser session using the provided Airtop profile name (for authenticated sessions).  
    - Configuration: Uses profile name from input JSON.  
    - Credentials: Airtop API credentials required.  
    - Inputs: Profile name.  
    - Outputs: Session ID.  
    - Edge Cases: Authentication failure, invalid profile name, API errors.

  - **Window**  
    - Type: Airtop Node  
    - Role: Opens a new browser window within the session and optionally loads a URL.  
    - Configuration:  
      - URL passed from input parameters.  
      - Requests live view URL for monitoring.  
    - Credentials: Airtop API credentials.  
    - Inputs: Session ID, URL.  
    - Outputs: Window ID, live view URL.  
    - Edge Cases: Invalid session ID, URL load failure.

  - **Return IDs**  
    - Type: Set Node  
    - Role: Collects and returns sessionId, windowId, and a success message for downstream use.  
    - Inputs: Outputs from Session and Window nodes.  
    - Outputs: JSON with sessionId, windowId, and status message.  
    - Edge Cases: Missing session or window IDs.

  - **Start browser**  
    - Type: Tool Workflow Node (Sub-workflow)  
    - Role: Encapsulates session and window creation in a reusable sub-workflow.  
    - Inputs: URL and Airtop profile name.  
    - Outputs: sessionId and windowId for use by the AI Agent.  
    - Edge Cases: Sub-workflow failure, parameter mismatch.

---

#### 2.4 Web Interaction Tools

- **Overview:**  
  These nodes represent the browser interaction tools the AI Agent uses to perform actions on the web page, such as clicking, typing, querying, loading URLs, and ending sessions.

- **Nodes Involved:**  
  - Click  
  - Query  
  - Load URL  
  - Type  
  - End session

- **Node Details:**

  - **Click**  
    - Type: Airtop Tool Node (interaction resource)  
    - Role: Simulates clicking on a specified element on the web page.  
    - Configuration:  
      - Requires sessionId and windowId from session management.  
      - Element description provided dynamically by AI Agent.  
      - Waits for page navigation to complete after click.  
    - Credentials: Airtop API.  
    - Inputs: sessionId, windowId, element description.  
    - Outputs: Result of click action.  
    - Edge Cases: Element not found, navigation timeout, stale session.

  - **Query**  
    - Type: Airtop Tool Node (extraction resource)  
    - Role: Queries the current page content to extract information or answer questions.  
    - Configuration:  
      - sessionId and windowId required.  
      - Natural language prompt provided by AI Agent.  
    - Credentials: Airtop API.  
    - Inputs: sessionId, windowId, query prompt.  
    - Outputs: Extracted information in text, markdown, or JSON.  
    - Edge Cases: Query failure, malformed prompt, session expiration.

  - **Load URL**  
    - Type: Airtop Tool Node (window resource)  
    - Role: Loads a specified URL into the browser window.  
    - Configuration:  
      - sessionId and windowId required.  
      - URL provided by AI Agent.  
    - Credentials: Airtop API.  
    - Inputs: sessionId, windowId, URL.  
    - Outputs: Load confirmation.  
    - Edge Cases: Invalid URL, load failure, session issues.

  - **Type**  
    - Type: Airtop Tool Node (interaction resource)  
    - Role: Types text into a specified element on the page and presses Enter.  
    - Configuration:  
      - sessionId and windowId required.  
      - Element description and text provided by AI Agent.  
      - Automatically presses Enter after typing.  
    - Credentials: Airtop API.  
    - Inputs: sessionId, windowId, element description, text.  
    - Outputs: Result of typing action.  
    - Edge Cases: Element not found, input blocked, session timeout.

  - **End session**  
    - Type: Airtop Tool Node  
    - Role: Terminates the browser session to free resources.  
    - Configuration:  
      - Requires sessionId.  
    - Credentials: Airtop API.  
    - Inputs: sessionId.  
    - Outputs: Confirmation of session termination.  
    - Edge Cases: Session already closed, API errors.

---

#### 2.5 Output Handling

- **Overview:**  
  This block finalizes the workflow output by parsing the agent’s structured results and optionally sending notifications.

- **Nodes Involved:**  
  - Structured Output Parser  
  - Output  
  - Slack1 (optional)

- **Node Details:**

  - **Structured Output Parser**  
    - See section 2.2.

  - **Output**  
    - See section 2.2.

  - **Slack1**  
    - Type: Slack Node (OAuth2)  
    - Role: Sends the final output message to a configured Slack channel.  
    - Configuration:  
      - Channel ID: "C08E83RDJN9" (n8n-debug)  
      - Text: The final output string.  
      - Authentication: OAuth2 Slack credentials required.  
    - Inputs: Output node JSON.  
    - Outputs: Slack message confirmation.  
    - Edge Cases: Slack API rate limits, authentication failure, channel permission errors.  
    - Note: This node is enabled but optional; can be disabled if Slack integration is not needed.

---

#### 2.6 Optional Slack Integration for Live View URL

- **Overview:**  
  This optional block can send the live view URL of the browser window to Slack for monitoring purposes.

- **Nodes Involved:**  
  - Slack (disabled by default)  
  - Window

- **Node Details:**

  - **Slack**  
    - Type: Slack Node (OAuth2)  
    - Role: Sends the live view URL to Slack channel.  
    - Configuration:  
      - Text: Live view URL from Window node.  
      - Channel: "C08E83RDJN9" (n8n-debug)  
      - Authentication: OAuth2 Slack credentials.  
    - Inputs: Window node output.  
    - Outputs: Slack message confirmation.  
    - Edge Cases: Same as Slack1 node.  
    - Note: Disabled by default; can be enabled to monitor browser sessions live.

  - **Window**  
    - See section 2.3.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                              | Input Node(s)                | Output Node(s)             | Sticky Note                                                                                         |
|-------------------------|----------------------------------|----------------------------------------------|------------------------------|----------------------------|---------------------------------------------------------------------------------------------------|
| On form submission      | Form Trigger                     | Entry point to capture user instructions     | External HTTP form            | AI Agent                   | Provide detailed instructions to the web AI agent. Use an Airtop Profile for login-required sites.|
| Claude 3.5 Haiku        | Langchain Chat Language Model    | Provides AI language understanding           | AI Agent                     | AI Agent                   |                                                                                                   |
| AI Agent                | Langchain Agent                  | Core AI agent managing browser interactions  | On form submission, Claude 3.5 Haiku, Airtop tools | Output                     |                                                                                                   |
| Structured Output Parser| Langchain Output Parser          | Parses AI Agent output into structured JSON  | AI Agent                     | Output                     |                                                                                                   |
| Output                  | Set Node                        | Prepares final output string                   | Structured Output Parser     | Slack1                     |                                                                                                   |
| Slack1                  | Slack Node (OAuth2)              | Sends final output to Slack channel           | Output                       |                            |                                                                                                   |
| Start browser           | Tool Workflow (Sub-workflow)     | Creates browser session and window            | AI Agent                     | AI Agent                   | This sub-workflow simplifies the session management for the agent                                |
| When Executed by Another Workflow | Execute Workflow Trigger  | Sub-workflow entry point for session creation | External call                | Session                    |                                                                                                   |
| Session                 | Airtop Node                     | Creates browser session                        | When Executed by Another Workflow | Window                     |                                                                                                   |
| Window                  | Airtop Node                     | Opens browser window and loads URL            | Session                      | Return IDs, Slack           |                                                                                                   |
| Return IDs              | Set Node                        | Returns sessionId and windowId                 | Window, Session              | Slack                      |                                                                                                   |
| Click                   | Airtop Tool Node (interaction)  | Simulates clicking on page elements            | AI Agent                     | AI Agent                   |                                                                                                   |
| Query                   | Airtop Tool Node (extraction)   | Queries page content for information           | AI Agent                     | AI Agent                   |                                                                                                   |
| Load URL                | Airtop Tool Node (window)       | Loads URL into browser window                   | AI Agent                     | AI Agent                   |                                                                                                   |
| Type                    | Airtop Tool Node (interaction)  | Types text into page elements                   | AI Agent                     | AI Agent                   |                                                                                                   |
| End session             | Airtop Tool Node                | Terminates browser session                      | AI Agent                     | AI Agent                   |                                                                                                   |
| Slack                   | Slack Node (OAuth2)              | Sends live view URL to Slack (disabled by default) | Window                      | Return IDs                 | Enable this Slack node to receive the URL for the Live View in a message                          |
| Sticky Note             | Sticky Note                    | Notes on Slack integration                      |                              |                            | See the agent in action. Enable this Slack node to receive the URL for the Live View in a message|
| Sticky Note1            | Sticky Note                    | Notes on session management sub-workflow       |                              |                            | This sub-workflow simplifies the session management for the agent                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Form Trigger Node**  
   - Type: Form Trigger  
   - Name: "On form submission"  
   - Configure form with title "Instruction for the Web AI Agent"  
   - Add fields:  
     - "Prompt" (textarea, required)  
     - "Airtop Profile Name (for sites that require authentication)" (optional text)  
   - Set webhook ID for external form submissions.

2. **Add the Claude 3.5 Haiku Node**  
   - Type: Langchain Chat Language Model (Anthropic)  
   - Name: "Claude 3.5 Haiku"  
   - Select model: "claude-3-5-haiku-20241022"  
   - Configure with Anthropic API credentials.

3. **Add the AI Agent Node**  
   - Type: Langchain Agent  
   - Name: "AI Agent"  
   - Input text: `={{ $json.Prompt }}` from form trigger  
   - System message: Define agent goal and instructions for browser tools (copy from overview section 2.2)  
   - Max iterations: 20  
   - Enable passthrough binary images  
   - Enable output parser  
   - Connect "Claude 3.5 Haiku" as AI language model input  
   - Connect Airtop tool nodes (to be created) as AI tools input.

4. **Create Airtop Tool Nodes for Browser Interaction**  
   - **Click**  
     - Type: Airtop Tool  
     - Resource: interaction  
     - Operation: click  
     - Parameters: sessionId, windowId (dynamic from AI Agent), element description (dynamic from AI Agent)  
     - Additional: wait for navigation "load"  
     - Credentials: Airtop API  
   - **Query**  
     - Type: Airtop Tool  
     - Resource: extraction  
     - Operation: query  
     - Parameters: sessionId, windowId, prompt (dynamic from AI Agent)  
     - Credentials: Airtop API  
   - **Load URL**  
     - Type: Airtop Tool  
     - Resource: window  
     - Operation: load  
     - Parameters: sessionId, windowId, URL (dynamic from AI Agent)  
     - Credentials: Airtop API  
   - **Type**  
     - Type: Airtop Tool  
     - Resource: interaction  
     - Operation: type  
     - Parameters: sessionId, windowId, element description, text (dynamic from AI Agent)  
     - Press Enter key: true  
     - Credentials: Airtop API  
   - **End session**  
     - Type: Airtop Tool  
     - Operation: terminate  
     - Parameters: sessionId (dynamic from AI Agent)  
     - Credentials: Airtop API

5. **Create the Structured Output Parser Node**  
   - Type: Langchain Output Parser Structured  
   - Name: "Structured Output Parser"  
   - Input schema: JSON object with a "results" string property describing the agent’s synthesis.

6. **Create the Output Node**  
   - Type: Set Node  
   - Name: "Output"  
   - Assign "output" field: `={{ $json.output.results }}` from Structured Output Parser.

7. **Optional: Create Slack Notification Node**  
   - Type: Slack Node (OAuth2)  
   - Name: "Slack1"  
   - Channel: select appropriate Slack channel (e.g., "n8n-debug")  
   - Text: `={{ $json.output }}`  
   - Configure Slack OAuth2 credentials.

8. **Create Sub-workflow for Browser Session Management ("Start browser")**  
   - Inputs:  
     - url (string)  
     - profile_name (string, optional)  
   - Nodes inside sub-workflow:  
     - Execute Workflow Trigger ("When Executed by Another Workflow") to receive inputs  
     - Airtop Node "Session" to create session with profile_name  
     - Airtop Node "Window" to open window with URL and get live view URL  
     - Set Node "Return IDs" to output sessionId, windowId, and status message  
   - Credentials: Airtop API for Session and Window nodes  
   - Outputs: sessionId and windowId for use by AI Agent.

9. **Connect Nodes**  
   - Connect "On form submission" to "AI Agent"  
   - Connect "Claude 3.5 Haiku" to "AI Agent" as language model  
   - Connect Airtop Tool nodes (Click, Query, Load URL, Type, End session) to "AI Agent" as AI tools  
   - Connect "AI Agent" to "Structured Output Parser"  
   - Connect "Structured Output Parser" to "Output"  
   - Connect "Output" to "Slack1" (optional)  
   - Connect "Start browser" sub-workflow to "AI Agent" as a tool  
   - Inside sub-workflow, connect "When Executed by Another Workflow" → "Session" → "Window" → "Return IDs"

10. **Configure Credentials**  
    - Airtop API credentials for all Airtop nodes  
    - Anthropic API credentials for Claude 3.5 Haiku  
    - Slack OAuth2 credentials for Slack nodes (optional)

11. **Set Default Values and Constraints**  
    - Max iterations on AI Agent: 20  
    - Passthrough binary images enabled on AI Agent  
    - Press Enter enabled on Type node  
    - Wait for navigation "load" on Click node  
    - Form prompt field required.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                          |
|-----------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Use an [Airtop Profile](https://docs.airtop.ai/guides/how-to/saving-a-profile) for websites requiring login. | Form field description for "Airtop Profile Name"                                                        |
| Slack integration is optional and currently disabled for live view URL notifications; enable Slack nodes to activate. | Sticky Note near Slack and Window nodes                                                                  |
| The sub-workflow "Start browser" simplifies session and window creation for the AI Agent.                 | Sticky Note near "Start browser" node                                                                    |
| Agent system message includes detailed instructions on how to use Airtop tools effectively.                | AI Agent node configuration                                                                              |
| Anthropic Claude 3.5 Haiku model requires valid API credentials and is used for natural language processing. | Node "Claude 3.5 Haiku"                                                                                   |

---

This document provides a comprehensive understanding of the workflow’s structure, logic, and configuration, enabling advanced users and AI agents to reproduce, modify, or troubleshoot the automation effectively.