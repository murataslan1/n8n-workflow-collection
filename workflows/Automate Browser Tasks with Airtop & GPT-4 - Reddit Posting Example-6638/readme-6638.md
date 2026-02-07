Automate Browser Tasks with Airtop & GPT-4 - Reddit Posting Example

https://n8nworkflows.xyz/workflows/automate-browser-tasks-with-airtop---gpt-4---reddit-posting-example-6638


# Automate Browser Tasks with Airtop & GPT-4 - Reddit Posting Example

### 1. Workflow Overview

This workflow automates browser tasks using Airtop browser sessions controlled via GPT-4 AI agent integration within n8n. It is designed primarily for managing browser sessions, windows, and web interactions programmatically with precise state tracking and user communication, demonstrated through a Reddit posting example.

The workflow consists of these logical blocks:

- **1.1 Input Reception:** Receives and triggers workflow based on incoming chat messages.
- **1.2 AI Processing:** Uses GPT-4 powered AI agent to interpret user commands and orchestrate browser automation tasks.
- **1.3 Browser Session Management:** Creates, monitors, and terminates Airtop browser sessions with status tracking in Google Sheets.
- **1.4 Window Management:** Creates and tracks browser windows linked to sessions, including capturing live view URLs.
- **1.5 Web Interaction Tools:** Performs webpage element clicks, text typing, and page querying to simulate user interactions.
- **1.6 Data Persistence & State Management:** Reads and writes session and window states from/to Google Sheets to maintain accurate records.
- **1.7 Communication:** Sends live Airtop window URLs via email, keeping users informed of ongoing browser automation activities.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
Receives chat messages that trigger the workflow to start processing user requests.

**Nodes Involved:**  
- When chat message received

**Node Details:**  
- **Type:** Langchain Chat Trigger  
- **Role:** Entry point listening for chat input messages from users.  
- **Configuration:** Uses webhook with unique ID; no additional configurations specified.  
- **Connections:** Outputs to AI Agent node.  
- **Failure Modes:** Webhook connectivity issues, message format errors, or webhook ID mismatches may cause failures.

---

#### 2.2 AI Processing

**Overview:**  
Processes user input with GPT-4 powered AI agent to interpret commands, control browser automation tools, and maintain conversational context.

**Nodes Involved:**  
- AI Agent  
- OpenAI Chat Model  
- Simple Memory

**Node Details:**  

- **AI Agent**  
  - Type: Langchain Agent  
  - Role: Core logic engine interpreting user instructions and orchestrating subsequent tool calls.  
  - Configuration:  
    - System message defining detailed browser automation roles and tool usage guidelines including session/window management, web interactions, data integrity, error handling, and communication protocols.  
    - Integrates multiple Airtop tools and Google Sheets for state management.  
  - Key Expressions: Uses AI overrides for dynamic parameters such as Profile_Name, Session_ID, URL, Window_ID, Element_Description, etc.  
  - Inputs: Receives chat messages and AI model outputs.  
  - Outputs: Calls Airtop tools and sheets read/write nodes, feeding results back to the AI model.  
  - Failure Types: Model API errors, logic misinterpretation, missing or malformed data inputs, inconsistent sheet data.

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat Model  
  - Role: Provides GPT-4o-mini language model for conversation generation.  
  - Configuration: Uses GPT-4o-mini model, authenticated via OpenAI credentials.  
  - Input: Receives prompts from AI Agent.  
  - Output: Sends generated text back to AI Agent.  
  - Failure Types: API key issues, rate limiting, network errors.

- **Simple Memory**  
  - Type: Langchain Memory Buffer Window  
  - Role: Maintains conversational context of last 3 messages to provide continuity.  
  - Configuration: Context window length set to 3.  
  - Input/Output: Connected to AI Agent’s memory interface.  
  - Failure Types: Memory buffer overflow or data corruption.

---

#### 2.3 Browser Session Management

**Overview:**  
Manages creation, termination, and status tracking of Airtop browser sessions, ensuring only one active session at a time with profile management.

**Nodes Involved:**  
- create_session  
- terminate_session  
- browser_sheet_read  
- browser_sheet_write

**Node Details:**  

- **create_session**  
  - Type: Airtop Tool  
  - Role: Creates new Airtop browser session optionally using a specified Airtop profile.  
  - Configuration: Receives profileName dynamically via AI override; timeout set to 30 minutes.  
  - Inputs: Profile name from AI Agent.  
  - Outputs: Session ID and details to be recorded in Google Sheets.  
  - Failure Modes: API authentication errors, profile mismatch, timeout failures.

- **terminate_session**  
  - Type: Airtop Tool  
  - Role: Terminates existing Airtop browser session by session ID.  
  - Configuration: Session ID dynamically provided by AI override.  
  - Inputs: Session ID from browser sheet or AI Agent.  
  - Outputs: Confirmation and updates to session status.  
  - Failure Modes: Session ID invalid, API errors, network issues.

- **browser_sheet_read**  
  - Type: Google Sheets Tool  
  - Role: Reads Airtop browser sessions data sheet to check existing sessions and their statuses.  
  - Configuration: Reads sheet named "Airtop browser Session" from specific Google Sheets document.  
  - Inputs: None externally; queried by AI Agent to verify session states.  
  - Outputs: List of sessions with session_id, description, and status.  
  - Failure Modes: Credential authentication failures, sheet access errors.

- **browser_sheet_write**  
  - Type: Google Sheets Tool  
  - Role: Writes or updates Airtop browser session records with session ID, description, and status.  
  - Configuration: Appends or updates rows matched by Airtop Session ID.  
  - Inputs: Status, description, session ID from AI Agent.  
  - Outputs: Confirmation of sheet update.  
  - Failure Modes: Write permission errors, data type mismatches.

---

#### 2.4 Window Management

**Overview:**  
Handles creation and tracking of browser windows tied to browser sessions, capturing live Airtop window URLs and maintaining window status.

**Nodes Involved:**  
- create_window  
- windows_sheet_read  
- windows_sheet_write

**Node Details:**  

- **create_window**  
  - Type: Airtop Tool  
  - Role: Creates a new browser window within an active session, loading a specified URL.  
  - Configuration:  
    - URL and session ID dynamically supplied via AI overrides.  
    - Requests live view URL from Airtop.  
    - Disables resize; waits until page load complete.  
    - Screen resolution fixed at 1280x720.  
  - Inputs: URL and session ID.  
  - Outputs: Window ID and Airtop live view URL for tracking.  
  - Failure Modes: Session not active, API errors, URL invalid.

- **windows_sheet_read**  
  - Type: Google Sheets Tool  
  - Role: Reads Airtop windows data sheet to check current windows and their statuses.  
  - Configuration: Reads sheet named "Airtop Windows" from the same Google Sheets document.  
  - Inputs: None externally; used by AI Agent for window management decisions.  
  - Outputs: List of windows with IDs, session linkage, descriptions, live URLs, and status.  
  - Failure Modes: Credential or access errors.

- **windows_sheet_write**  
  - Type: Google Sheets Tool  
  - Role: Writes or updates Airtop windows records including window ID, session ID, description, live view URL, and status.  
  - Configuration: Appends or updates rows matched by Airtop Window ID.  
  - Inputs: Status, live view URL, window description, window ID, and session ID from AI Agent.  
  - Outputs: Confirmation of write operation.  
  - Failure Modes: Write permission errors, data mismatch.

---

#### 2.5 Web Interaction Tools

**Overview:**  
Enables interaction with web pages through querying page content, clicking elements, and typing text, always based on current window context and verified session/window IDs.

**Nodes Involved:**  
- query_page  
- click_element  
- type_text

**Node Details:**  

- **query_page**  
  - Type: Airtop Tool  
  - Role: Queries page content visually and semantically to understand page elements and states before interaction.  
  - Configuration:  
    - Receives prompt dynamically for specific queries.  
    - Requires session ID and window ID for context.  
  - Inputs: Session ID, window ID, prompt text.  
  - Outputs: Descriptions of page elements, states, and actionable insights.  
  - Failure Modes: Invalid IDs, API errors, malformed prompt.

- **click_element**  
  - Type: Airtop Tool  
  - Role: Simulates clicking a webpage element based on detailed element description.  
  - Configuration:  
    - Requires session ID, window ID, and element description from AI.  
  - Inputs: Session ID, window ID, element description text.  
  - Outputs: Confirmation of click action.  
  - Failure Modes: Element not found, invalid IDs, API failure.

- **type_text**  
  - Type: Airtop Tool  
  - Role: Types specified text into an input field identified by element description within a window session.  
  - Configuration:  
    - Requires session ID, window ID, element description, and text to type.  
  - Inputs: Session ID, window ID, element description, text content.  
  - Outputs: Confirmation of typing action.  
  - Failure Modes: Element not found, input blocked, API errors.

---

#### 2.6 Data Persistence & State Management

**Overview:**  
Maintains accurate, real-time states of browser sessions and windows by reading and writing to Google Sheets for consistency and session hygiene.

**Nodes Involved:**  
- browser_sheet_read  
- browser_sheet_write  
- windows_sheet_read  
- windows_sheet_write

**Node Details:**  
See details in sections 2.3 and 2.4 for sheet read/write nodes.

---

#### 2.7 Communication

**Overview:**  
Keeps the user informed by sending live Airtop window URLs via email to enable real-time monitoring of browser automation.

**Nodes Involved:**  
- (Note: Sending email is described in system message and workflow logic but no explicit email node is present in JSON; likely handled internally by AI Agent or external integration.)

**Node Details:**  
- Communication of live Airtop window URLs is critical.  
- URLs sent must be the **complete Airtop window live view URL**, not the website URL.  
- Ensures users can monitor automation live.

---

### 3. Summary Table

| Node Name                  | Node Type                      | Functional Role                           | Input Node(s)                | Output Node(s)              | Sticky Note                                                  |
|----------------------------|--------------------------------|-----------------------------------------|-----------------------------|-----------------------------|--------------------------------------------------------------|
| When chat message received | Langchain Chat Trigger         | Entry point for chat message reception  | -                           | AI Agent                    |                                                              |
| AI Agent                   | Langchain Agent                | Core AI orchestration and tool driver   | When chat message received, OpenAI Chat Model, Simple Memory, Airtop tools, Sheets nodes | Multiple Airtop & sheets nodes | System message details full workflow and tool instructions   |
| OpenAI Chat Model          | Langchain OpenAI Chat Model    | GPT-4o-mini language model               | AI Agent                    | AI Agent                    |                                                              |
| Simple Memory              | Langchain Memory Buffer Window | Maintains conversational context        | AI Agent                    | AI Agent                    |                                                              |
| create_session             | Airtop Tool                   | Creates Airtop browser session           | AI Agent                    | AI Agent                    |                                                              |
| terminate_session          | Airtop Tool                   | Terminates Airtop browser session        | AI Agent                    | AI Agent                    |                                                              |
| read_airtop_profiles       | Google Sheets Tool             | Reads Airtop profile data                 | AI Agent                    | AI Agent                    |                                                              |
| create_window             | Airtop Tool                   | Creates a window in a browser session    | AI Agent                    | AI Agent                    |                                                              |
| click_element              | Airtop Tool                   | Performs click action on web element     | AI Agent                    | AI Agent                    |                                                              |
| query_page                 | Airtop Tool                   | Queries visual page content               | AI Agent                    | AI Agent                    |                                                              |
| type_text                  | Airtop Tool                   | Types text into web input field           | AI Agent                    | AI Agent                    |                                                              |
| browser_sheet_read         | Google Sheets Tool             | Reads browser session states              | AI Agent                    | AI Agent                    |                                                              |
| browser_sheet_write        | Google Sheets Tool             | Writes/upserts browser session records   | AI Agent                    | AI Agent                    |                                                              |
| windows_sheet_read         | Google Sheets Tool             | Reads window session states               | AI Agent                    | AI Agent                    |                                                              |
| windows_sheet_write        | Google Sheets Tool             | Writes/upserts window session records    | AI Agent                    | AI Agent                    |                                                              |
| Sticky Note                | Sticky Note                   | Section heading "Tools"                   | -                           | -                           |                                                              |
| Sticky Note1               | Sticky Note                   | Section heading "Memory"                  | -                           | -                           |                                                              |
| Sticky Note2               | Sticky Note                   | Section heading "AI Model"                | -                           | -                           |                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Trigger Node:**  
   - Add **"When chat message received"** node (Langchain Chat Trigger) with webhook ID to receive chat inputs.  

2. **Add AI Processing Nodes:**  
   - Add **OpenAI Chat Model** node using GPT-4o-mini model with OpenAI API credentials.  
   - Add **Simple Memory** node with context window length 3 for conversational context.  
   - Add **AI Agent** node and configure:  
     - Paste the detailed system message describing roles, tool flows, data handling, and error policies.  
     - Connect AI Agent inputs from "When chat message received", "OpenAI Chat Model", and "Simple Memory".  
     - Connect AI Agent outputs to all Airtop tools and Google Sheets nodes below.  

3. **Configure Airtop Tools:**  
   - Create **create_session** node:  
     - Select Airtop API credentials.  
     - Set profileName parameter dynamically from AI Agent input (Profile_Name).  
     - Timeout: 30 minutes.  
   - Create **terminate_session** node:  
     - Airtop API credentials.  
     - Set operation to "terminate".  
     - sessionId parameter from AI Agent input (Session_ID).  
   - Create **create_window** node:  
     - Airtop API credentials.  
     - Set URL parameter from AI Agent input (URL).  
     - Use sessionId from AI Agent input (Session_ID).  
     - Enable getLiveView (to get live Airtop window URL).  
     - Disable resize, wait until load, screen resolution 1280x720.  
   - Create **click_element** node:  
     - Airtop API credentials.  
     - sessionId and windowId from AI Agent inputs (Session_ID, Window_ID).  
     - elementDescription from AI Agent input (Element_Description).  
   - Create **query_page** node:  
     - Airtop API credentials.  
     - sessionId, windowId from AI Agent inputs.  
     - prompt text from AI Agent input (Prompt).  
   - Create **type_text** node:  
     - Airtop API credentials.  
     - sessionId, windowId from AI Agent inputs.  
     - elementDescription and text from AI Agent inputs (Element_Description, Text).  

4. **Setup Google Sheets Nodes:**  
   - Create **browser_sheet_read** node:  
     - Use Google Sheets OAuth2 credentials.  
     - Configure to read "Airtop browser Session" sheet from target Google Sheets document.  
   - Create **browser_sheet_write** node:  
     - Same Google Sheets credentials.  
     - Configure appendOrUpdate operation with matching column "Airtop Session ID".  
     - Map fields: Status, Description, Airtop Session ID from AI Agent inputs.  
   - Create **windows_sheet_read** node:  
     - Google Sheets credentials.  
     - Configure to read "Airtop Windows" sheet from same document.  
   - Create **windows_sheet_write** node:  
     - Google Sheets credentials.  
     - Configure appendOrUpdate with matching column "Airtop Window ID".  
     - Map fields: Status, Live View URL, Airtop Window ID, Airtop Session ID, Window Description from AI Agent inputs.  

5. **Connect Nodes:**  
   - Connect "When chat message received" output to AI Agent input.  
   - AI Agent connects to OpenAI Chat Model and Simple Memory for language and memory.  
   - AI Agent connects to all Airtop tools and Google Sheets read/write nodes via its ai_tool interface.  
   - Airtop and Sheets nodes output back to AI Agent to complete the loop.  

6. **Configure Credentials:**  
   - OpenAI API credentials (OpenAI key).  
   - Airtop API credentials for all Airtop tool nodes.  
   - Google Sheets OAuth2 credentials for all Sheets nodes.  

7. **Test and Validate:**  
   - Test chat triggers to verify AI Agent interprets commands correctly.  
   - Validate session creation and termination flows update Google Sheets accurately.  
   - Confirm windows open with live view URLs captured and sent via email or chat.  
   - Check web interaction nodes perform query, click, and type operations correctly.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                               | Context or Link                                                                                                        |
|------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| The workflow uses Airtop browser automation tools integrated via n8n custom nodes to control browser sessions and windows programmatically.               | Core workflow description and system message.                                                                         |
| Airtop live view URLs are critical for real-time monitoring; always send the full URL, never the website URL.                                              | System message emphasizes this repeatedly for user communication.                                                     |
| Session and window IDs must only be retrieved from Google Sheets; never assume or fabricate IDs to ensure data consistency and avoid errors.              | System message and tool flow instructions.                                                                             |
| Only one active Airtop browser session can exist at a time; the workflow enforces this constraint with user confirmations.                                | Session management tool flow.                                                                                           |
| Use profile names (not platform names or URLs) when creating sessions; profile selection is interactive via AI prompts.                                   | Profile management flow instructions.                                                                                  |
| Always query page content before clicking or typing to ensure accurate element targeting and avoid erroneous interactions.                                | Web interaction tool flow instructions.                                                                                |
| The AI Agent uses a detailed system message outlining all operational rules, error handling, and best practices to maintain session hygiene and user clarity.| System message content inside AI Agent node.                                                                           |
| Google Sheets document: [airtop n8n tutorial](https://docs.google.com/spreadsheets/d/1SZ_P9Ike3xodjAVEsoxfJzgk0kKyaL-EJAEQ7UVibFs) contains all session and window sheets.| Referenced in all Google Sheets nodes configuration.                                                                   |

---

**Disclaimer:** The text provided derives exclusively from an automated n8n workflow. It complies fully with content policies and contains no illegal or protected elements. All data handled is legal and public.