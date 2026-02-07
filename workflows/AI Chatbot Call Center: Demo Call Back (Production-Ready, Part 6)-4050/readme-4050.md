AI Chatbot Call Center: Demo Call Back (Production-Ready, Part 6)

https://n8nworkflows.xyz/workflows/ai-chatbot-call-center--demo-call-back--production-ready--part-6--4050


# AI Chatbot Call Center: Demo Call Back (Production-Ready, Part 6)

---

## 1. Workflow Overview

This workflow, titled **"AI Chatbot Call Center: Demo Call Back (Production-Ready, Part 6)"**, is a **Telegram Output Workflow** designed to receive processed messages from other sub-workflows and output responses to Telegram users. It supports text messages, reply messages, and optionally AI-generated voice messages through the MiniMax API with multi-language capabilities.

### Target Use Cases
- Delivering chatbot responses to Telegram users after AI or logic processing elsewhere.
- Supporting voice message generation and playback using AI voice cloning.
- Caching provider data for performance optimization.
- Logging chat interactions to a PostgreSQL database for backup and further app/API usage.
- Handling multi-language text-to-speech voice responses.
- Managing errors gracefully in production environments with queue mode scaling.

### Logical Blocks

1.1 **Input Reception and Initialization**  
- Listens for incoming messages from sub-workflows or chat triggers.  
- Prepares and formats the input message data.

1.2 **Provider Data Handling and Caching**  
- Attempts to retrieve provider information from Redis cache.  
- If cache miss, loads provider data from PostgreSQL and caches it.  
- Parses and sets provider data for downstream nodes.

1.3 **Message Type Decision & Voice Message Handling**  
- Switches logic based on message type (voice or text).  
- If voice message, calls MiniMax API to generate AI voice message in appropriate language.  
- Downloads generated audio from MiniMax and sends voice message via Telegram.

1.4 **Text or Reply Message Output to Telegram**  
- Determines if the message is a reply or regular text message.  
- Sends message to Telegram accordingly (reply or standard send).  
- Supports multi-chatbot setups and Telegram bots.

1.5 **Chat Logging to PostgreSQL**  
- Saves incoming and outgoing chat messages line-by-line for backup and analytics.

1.6 **Error Management and Flow Control**  
- Incorporates error handling with "continue" behavior on some nodes.  
- Supports stopping flow on critical errors for voice API download.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception and Initialization

**Overview:**  
Receives incoming messages triggered externally (usually from other sub-workflows or test triggers) and prepares input data for processing.

**Nodes Involved:**  
- Flow Trigger  
- Test Trigger  
- Input  
- Test Fields  

**Node Details:**

- **Flow Trigger**  
  - Type: Execute Workflow Trigger  
  - Role: Entry point for messages coming from other workflows.  
  - Configuration: Basic trigger, no special parameters.  
  - Inputs: None (trigger node)  
  - Outputs: Connected to "Input" node.  
  - Failures: Rare; mainly trigger misconfiguration.  
  - Notes: Main production entry point.

- **Test Trigger**  
  - Type: Langchain Chat Trigger  
  - Role: Alternative entry point for manual testing or Langchain integration.  
  - Configuration: Includes webhook ID for external calls.  
  - Inputs: None  
  - Outputs: Connects to "Test Fields".  
  - Failures: Webhook misconfiguration or request issues.

- **Input**  
  - Type: Set (Edit Fields)  
  - Role: Prepares and normalizes incoming data structure for further processing.  
  - Configuration: Defines key input fields expected downstream.  
  - Inputs: From Flow Trigger or Test Fields.  
  - Outputs: Connects to "If Provider No".  
  - Failures: Expression errors if input data is malformed.

- **Test Fields**  
  - Type: Set  
  - Role: Prepares test data for debugging or development.  
  - Inputs: From Test Trigger.  
  - Outputs: To "Input".  
  - Configuration: Contains test field setup.

---

### 2.2 Provider Data Handling and Caching

**Overview:**  
Attempts to retrieve provider information from Redis cache to avoid repeated DB calls. Falls back to PostgreSQL query if cache miss, then caches the result.

**Nodes Involved:**  
- If Provider No  
- Provider Cache (Redis get)  
- If Provider Cache  
- Load Provider Data (Postgres)  
- Save Provider Cache (Redis set)  
- Parse Cache (Code)  
- Provider (Set)  

**Node Details:**

- **If Provider No**  
  - Type: If  
  - Role: Checks if provider info is absent; routes accordingly.  
  - Inputs: From "Input" node.  
  - Outputs: Two outputs: cache retrieval or direct next step.  
  - Failures: Logic errors if conditions misconfigured.

- **Provider Cache**  
  - Type: Redis  
  - Role: Retrieves cached provider info with TTL 15 minutes.  
  - Configuration: Uses Redis credentials (must be configured).  
  - Inputs: From "If Provider No".  
  - Outputs: To "If Provider Cache".  
  - Failures: Redis connection/auth issues, fallback enabled.

- **If Provider Cache**  
  - Type: If  
  - Role: Checks if Redis returned valid provider data.  
  - Outputs: True → Parse Cache, False → Load Provider Data.  

- **Load Provider Data**  
  - Type: PostgreSQL  
  - Role: Queries provider info from "sys_provider" table or equivalent.  
  - Configuration: On error continue (non-blocking).  
  - Inputs: From "If Provider Cache" (false output).  
  - Outputs: To "Save Provider Cache".  
  - Failures: DB connection, query errors.

- **Save Provider Cache**  
  - Type: Redis  
  - Role: Caches provider data with TTL 15 minutes.  
  - Inputs: From "Load Provider Data".  
  - Outputs: To "Provider".  
  - Failures: Redis write errors (non-blocking).

- **Parse Cache**  
  - Type: Code (JavaScript)  
  - Role: Parses cached data string back to JSON object for usage.  
  - Inputs: From "If Provider Cache" (true output).  
  - Outputs: To "Provider".  
  - Failures: Parsing errors if cache corrupted.

- **Provider**  
  - Type: Set  
  - Role: Normalizes and sets provider data fields for downstream nodes.  
  - Inputs: From "Save Provider Cache" or "Parse Cache".  
  - Outputs: To "Media Switch" and "If Input".  
  - Failures: Expression errors if data missing.

---

### 2.3 Message Type Decision & Voice Message Handling

**Overview:**  
Determines if incoming message requires AI voice generation. If yes, calls MiniMax API for TTS, downloads the audio, then sends voice message via Telegram.

**Nodes Involved:**  
- Media Switch  
- If Provider Voice  
- Switch (for languages)  
- Chinese,Yue (Set)  
- Chinese (Set)  
- Japanese (Set)  
- English (Set)  
- Minimax TTS (HTTP Request)  
- Download Minimax Audio (HTTP Request)  
- Telegram Voice Output  

**Node Details:**

- **Media Switch**  
  - Type: Switch  
  - Role: Routes based on message media type (voice or other).  
  - Outputs: Voice → "If Provider Voice"; Text → "Output" node.  
  - Failures: Logic errors if media type field missing.

- **If Provider Voice**  
  - Type: If  
  - Role: Checks if provider supports voice message generation.  
  - Outputs: True → Language Switch; False → Telegram Output path.  

- **Switch**  
  - Type: Switch  
  - Role: Routes based on provider or message language code.  
  - Outputs: Routes to language-specific Set nodes for TTS parameters.

- **Language Set Nodes (Chinese,Yue, Chinese, Japanese, English)**  
  - Type: Set  
  - Role: Configure language-specific parameters for MiniMax TTS API.  
  - Inputs: From "Switch".  
  - Outputs: To "Minimax TTS".  

- **Minimax TTS**  
  - Type: HTTP Request  
  - Role: Calls MiniMax API to generate AI voice message from text.  
  - Configuration: Includes API endpoint, headers, body with text and voice parameters.  
  - Inputs: From language Set nodes.  
  - Outputs: To "Download Minimax Audio".  
  - Failures: API errors, timeouts, invalid credentials.  
  - Notes: On error, continue workflow (non-blocking).

- **Download Minimax Audio**  
  - Type: HTTP Request  
  - Role: Downloads generated voice audio file from MiniMax.  
  - Configuration: URL from previous node, stream enabled.  
  - Inputs: From "Minimax TTS".  
  - Outputs: To "Telegram Voice Output" and "If Reply".  
  - Failures: Network issues, file not found; on error, stops workflow.

- **Telegram Voice Output**  
  - Type: Telegram  
  - Role: Sends voice message to Telegram chat.  
  - Configuration: Uses Telegram credentials; targets chat ID based on input.  
  - Inputs: From "Download Minimax Audio".  
  - Outputs: To "If Reply".  
  - Failures: Telegram API errors, rate limits, invalid chat ID.

---

### 2.4 Text or Reply Message Output to Telegram

**Overview:**  
Sends text or reply messages to Telegram users, selecting the appropriate Telegram node based on message type.

**Nodes Involved:**  
- Media Switch1  
- If Reply  
- Telegram Reply Output  
- Telegram Output  
- Output (Set)  

**Node Details:**

- **Media Switch1**  
  - Type: Switch  
  - Role: Determines if the outgoing message is a reply.  
  - Inputs: From "If Provider No" false branch.  
  - Outputs: Reply → "If Reply"; Text → "Output".  
  - Failures: Logical errors if fields missing.

- **If Reply**  
  - Type: If  
  - Role: Confirms message is a reply or not for Telegram message sending.  
  - Outputs: True → "Telegram Reply Output"; False → "Telegram Output".  

- **Telegram Reply Output**  
  - Type: Telegram  
  - Role: Sends reply message to Telegram chat referencing original message.  
  - Configuration: Uses Telegram credentials, chat ID, and reply message ID.  
  - Inputs: From "If Reply".  
  - Outputs: To "Output".  
  - Failures: Telegram API errors, invalid reply message ID.

- **Telegram Output**  
  - Type: Telegram  
  - Role: Sends a new text message to Telegram chat.  
  - Configuration: Uses Telegram credentials, chat ID, and text.  
  - Inputs: From "If Reply" or "Media Switch" (text path).  
  - Outputs: To "Output".  
  - Failures: Telegram API errors, invalid chat ID.

- **Output (Set)**  
  - Type: Set  
  - Role: Finalizes output data for logging or return.  
  - Inputs: From Telegram nodes and Media Switch (text path).  
  - Outputs: None (end of flow).  

---

### 2.5 Chat Logging to PostgreSQL

**Overview:**  
Stores chat message lines (input and output) in a PostgreSQL database for backup or further analytics.

**Nodes Involved:**  
- If Input  
- Create Chat Log Input (Postgres Insert)  
- Create Chat Log Output (Postgres Insert)  

**Node Details:**

- **If Input**  
  - Type: If  
  - Role: Determines if current message is input or output for logging.  
  - Inputs: From "Provider" node.  
  - Outputs: Input → "Create Chat Log Input"; Output → "Create Chat Log Output".  

- **Create Chat Log Input**  
  - Type: PostgreSQL  
  - Role: Inserts incoming message data into chat log table.  
  - Configuration: Uses Postgres credentials, SQL insert statement.  
  - Inputs: From "If Input".  
  - Failures: DB connection, insert errors.

- **Create Chat Log Output**  
  - Type: PostgreSQL  
  - Role: Inserts outgoing message data into chat log table.  
  - Configuration: Uses Postgres credentials, SQL insert statement.  
  - Inputs: From "If Input" and chained from "Create Chat Log Input".  
  - Failures: DB errors.

---

### 2.6 Error Management and Flow Control

**Overview:**  
Implements error handling strategies and flow control to ensure robust operation in production environments.

**Nodes Involved:**  
- Download Minimax Audio (On Error: stop)  
- Minimax TTS (On Error: continue)  
- Redis nodes (On Error: continue)  
- PostgreSQL nodes (On Error: continue)  

**Node Details:**

- Nodes calling external services (MiniMax TTS, Redis, Postgres) handle errors with either "continue" (non-blocking) or "stop" (blocking) depending on criticality.

- Download Minimax Audio is critical and stops on error to avoid sending invalid voice messages.

- Redis and Postgres nodes tolerate errors to maintain flow continuity.

---

## 3. Summary Table

| Node Name             | Node Type                      | Functional Role                      | Input Node(s)               | Output Node(s)                  | Sticky Note                            |
|-----------------------|--------------------------------|------------------------------------|-----------------------------|--------------------------------|---------------------------------------|
| Flow Trigger          | Execute Workflow Trigger        | Entry point for external messages  | None                        | Input                          |                                       |
| Test Trigger          | Langchain Chat Trigger          | Alternative test entry             | None                        | Test Fields                    |                                       |
| Test Fields           | Set                            | Prepare test data                  | Test Trigger                | Input                          |                                       |
| Input                 | Set                            | Normalize input data               | Flow Trigger, Test Fields   | If Provider No                 |                                       |
| If Provider No        | If                             | Check if provider data exists      | Input                       | Provider Cache, Media Switch1  |                                       |
| Provider Cache        | Redis                          | Retrieve provider cache            | If Provider No              | If Provider Cache              | TTL 15m                               |
| If Provider Cache     | If                             | Check if provider cache hit        | Provider Cache              | Parse Cache, Load Provider Data|                                       |
| Load Provider Data    | Postgres                       | Query provider from DB             | If Provider Cache           | Save Provider Cache            | On error continue                     |
| Save Provider Cache   | Redis                          | Cache provider data                | Load Provider Data          | Provider                      | TTL 15m                               |
| Parse Cache           | Code                           | Parse cached provider data         | If Provider Cache           | Provider                      |                                       |
| Provider              | Set                            | Set provider data fields           | Save Provider Cache, Parse Cache | Media Switch, If Input    |                                       |
| Media Switch          | Switch                         | Route by media type                | Provider                    | If Provider Voice, Output      |                                       |
| If Provider Voice     | If                             | Check if voice enabled             | Media Switch                | Switch, If Reply              |                                       |
| Switch                | Switch                         | Route by language for TTS          | If Provider Voice           | Chinese,Yue, Chinese, Japanese, English |                              |
| Chinese,Yue           | Set                            | Set TTS params for Cantonese       | Switch                      | Minimax TTS                   |                                       |
| Chinese               | Set                            | Set TTS params for Chinese         | Switch                      | Minimax TTS                   |                                       |
| Japanese              | Set                            | Set TTS params for Japanese        | Switch                      | Minimax TTS                   |                                       |
| English               | Set                            | Set TTS params for English         | Switch                      | Minimax TTS                   |                                       |
| Minimax TTS           | HTTP Request                   | Call MiniMax TTS API               | Language Set Nodes          | Download Minimax Audio        | On error continue                     |
| Download Minimax Audio| HTTP Request                   | Download voice audio file          | Minimax TTS                 | Telegram Voice Output, If Reply | 👻 ON ERROR STOP                    |
| Telegram Voice Output | Telegram                       | Send voice message to Telegram     | Download Minimax Audio      | If Reply                     | @chpy_demo_bot                        |
| Media Switch1         | Switch                         | Route by reply or normal message   | If Provider No              | If Reply, Output              |                                       |
| If Reply              | If                             | Check if message is reply          | Media Switch1, Download Minimax Audio, Telegram Voice Output | Telegram Reply Output, Telegram Output |                    |
| Telegram Reply Output | Telegram                       | Send reply message                 | If Reply                   | Output                       | @chpy_demo_bot                        |
| Telegram Output       | Telegram                       | Send text message                  | If Reply, Media Switch      | Output                       | @chpy_demo_bot                        |
| Output                | Set                            | Final output data set              | Telegram nodes, Media Switch| None                         |                                       |
| If Input              | If                             | Determine input/output for logging | Provider                   | Create Chat Log Input, Create Chat Log Output |                    |
| Create Chat Log Input | Postgres                      | Log incoming message               | If Input                   | Create Chat Log Output        | On error continue                     |
| Create Chat Log Output| Postgres                      | Log outgoing message               | If Input, Create Chat Log Input | None                      | On error continue                     |

---

## 4. Reproducing the Workflow from Scratch

1. **Create the Workflow:** Name it "💬 Demo Call Back".

2. **Add Entry Nodes:**  
   - Add **Execute Workflow Trigger** node named "Flow Trigger". No special config needed.  
   - Add **Langchain Chat Trigger** named "Test Trigger" with webhook ID configured for manual tests.  

3. **Setup Input Preparation:**  
   - Add **Set** node "Input" connected from "Flow Trigger" and "Test Fields". Configure to normalize incoming data fields (e.g., chat ID, message text, media type, provider ID).  
   - Add **Set** node "Test Fields" connected from "Test Trigger" for test data.  

4. **Provider Data Check & Cache:**  
   - Add **If** node "If Provider No" connected from "Input". Configure to check if provider info is missing.  
   - Add **Redis** node "Provider Cache" connected from "If Provider No" (true output). Configure with Redis credentials; set TTL 15 minutes.  
   - Add **If** node "If Provider Cache" connected from "Provider Cache". Check if cache hit.  
   - Add **Code** node "Parse Cache" connected from "If Provider Cache" (true output). Configure JavaScript to parse Redis string to JSON.  
   - Add **Postgres** node "Load Provider Data" connected from "If Provider Cache" (false output). Configure with Postgres credentials and query to load provider info from "sys_provider" or custom table. Set "Execute Once" and "Always Output Data".  
   - Add **Redis** node "Save Provider Cache" connected from "Load Provider Data". Configure to cache provider data with TTL 15 minutes.  
   - Add **Set** node "Provider" connected from both "Save Provider Cache" and "Parse Cache". Configure to set normalized provider fields.  

5. **Route by Media Type:**  
   - Add **Switch** node "Media Switch" connected from "Provider". Configure to route based on media type (e.g., "voice" or other).  
   - Connect voice path to "If Provider Voice" (If node).  
   - Connect other media path to "Output" node (Set).  

6. **Voice Message Handling:**  
   - Add **If** node "If Provider Voice" connected from "Media Switch". Check if provider supports voice output.  
   - Add **Switch** node "Switch" connected from "If Provider Voice" (true). Configure to route by language code (e.g., zh-yue, zh, ja, en).  
   - Add **Set** nodes "Chinese,Yue", "Chinese", "Japanese", "English" connected from "Switch". Set MiniMax TTS parameters accordingly (voice ID, language code, text).  
   - Add **HTTP Request** node "Minimax TTS" connected from all language Set nodes. Configure with MiniMax TTS API endpoint, method POST, appropriate headers, and body containing text and voice parameters. Set "On Error" to continue.  
   - Add **HTTP Request** node "Download Minimax Audio" connected from "Minimax TTS". Configure for GET request to download audio, streaming enabled. Set "On Error" to stop workflow.  
   - Add **Telegram** node "Telegram Voice Output" connected from "Download Minimax Audio". Configure with Telegram credentials, send voice message to chat ID.  

7. **Text or Reply Message Output:**  
   - Add **Switch** node "Media Switch1" connected from "If Provider No" (false output). Configure to route depending on whether message is reply or not.  
   - Add **If** node "If Reply" connected from "Media Switch1" and from "Download Minimax Audio" and "Telegram Voice Output" (to handle reply logic after voice).  
   - Add **Telegram** node "Telegram Reply Output" connected from "If Reply" (true). Configure to send reply message referencing original message.  
   - Add **Telegram** node "Telegram Output" connected from "If Reply" (false) and "Media Switch" (text output). Configure to send normal text message.  
   - Add **Set** node "Output" connected from Telegram nodes and Media Switch (text path) to finalize output data.  

8. **Chat Logging:**  
   - Add **If** node "If Input" connected from "Provider". Configure to check if record is incoming or outgoing message.  
   - Add **Postgres** node "Create Chat Log Input" connected from "If Input" (true). Configure to insert incoming chat lines into PostgreSQL table.  
   - Add **Postgres** node "Create Chat Log Output" connected from "If Input" (false) and from "Create Chat Log Input". Configure to insert outgoing chat lines.  

9. **Error Handling:**  
   - For Redis and Postgres nodes, set "On Error" to continue to avoid breaking flow on transient errors.  
   - For "Download Minimax Audio" node, set "On Error" to stop to prevent sending invalid voice data.  
   - Ensure all credentials (Redis, Postgres, Telegram, MiniMax API) are configured in n8n credential manager.  

10. **Notes and Testing:**  
    - Add Sticky Notes as reminders or instructions in layout for maintainability.  
    - Test workflow with both voice and text inputs, replies, and multiple languages.  
    - Adjust SQL queries and table names according to your database schema.  

---

## 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                                  |
|-------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Pull and set up required SQL from the official repository for database schema and sample data.  | https://github.com/ChatPayLabs/n8n-chatbot-core                                                               |
| Create Redis credentials referencing n8n docs for integration details.                          | https://docs.n8n.io/integrations/builtin/credentials/slack/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal |
| Set up Postgres credentials similarly for chat logs and provider data.                         | https://docs.n8n.io/integrations/builtin/credentials/slack/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal |
| Configure Telegram credentials for bot communication.                                          | https://docs.n8n.io/integrations/builtin/credentials/slack/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal |
| MiniMax API account creation and TTS setup instructions.                                       | https://www.minimax.io/                                                                                         |
| This workflow is designed for n8n version 1.90.2 or higher to ensure compatibility with all nodes. |                                                                                                                 |
| Supports multi-chatbot environments; extendable to WhatsApp, Line, or other channels.          |                                                                                                                 |
| Implements scaling design for n8n queue mode in production environments.                        |                                                                                                                 |
| Backup chat logs can be used for custom APP or API development.                                |                                                                                                                 |

---

**Disclaimer:**  
The provided text is extracted exclusively from an automated workflow built with n8n, a workflow automation tool. The content complies with all current content policies and contains no illegal, offensive, or protected material. All data processed is legal and public.

---