AI-Powered Personal Finances Manager with Gemini, Telegram & Google Sheets

https://n8nworkflows.xyz/workflows/ai-powered-personal-finances-manager-with-gemini--telegram---google-sheets-7411


# AI-Powered Personal Finances Manager with Gemini, Telegram & Google Sheets

---

### 1. Workflow Overview

This workflow implements an **AI-Powered Personal Finances Manager** integrating **Telegram**, **Google Sheets**, and **Google Gemini AI**. Its primary purpose is to allow users to manage their personal financial records (income and expenses) via Telegram messages, including voice notes that are transcribed, with all data stored and managed in a Google Sheets spreadsheet.

The workflow is designed to interpret user inputs (text or voice), extract financial transaction details using AI, perform CRUD operations on Google Sheets for financial records, and respond back to the user in Telegram with well-formatted HTML messages compliant with Telegram's API requirements.

The logical blocks of the workflow are:

- **1.1 Input Reception and Routing**: Captures incoming Telegram messages and routes them based on content type (text, voice, or unsupported).
- **1.2 Voice Transcription**: Downloads and transcribes voice messages using Google Gemini audio model.
- **1.3 AI Financial Agent Processing**: Core AI logic that interprets user intent, performs financial data CRUD operations on Google Sheets, manages conversation memory, and formats Telegram-compatible HTML responses.
- **1.4 Google Sheets Data Operations**: Nodes to query all financial records, create new entries, update existing entries, and delete records in Google Sheets.
- **1.5 Response Delivery**: Sends formatted messages back to Telegram users.
- **1.6 Error Handling / Fallback**: Handles unsupported input types with a fallback message.

Supporting sticky notes provide setup instructions, configuration guidance, and usage rules for the Telegram bot, Google Sheets, and AI credentials.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Routing

- **Overview:** This block captures all incoming Telegram messages and routes them based on whether the message is text, voice, or unsupported content.
- **Nodes Involved:**  
  - Telegram Bot Trigger  
  - Switch  
  - Get a file  
  - Send Fallback Message

- **Node Details:**

  - **Telegram Bot Trigger**  
    - Type: Telegram Trigger  
    - Role: Entry point; triggers workflow on every new Telegram message update  
    - Configuration: Listens to "message" updates only  
    - Credentials: Connected to Telegram bot ("Telegram Financeiro VIKTHYR")  
    - Inputs: Incoming Telegram messages  
    - Outputs: Passes message JSON to Switch node  
    - Edge Cases: Bot must be properly authorized; possible webhook downtime or missing messages

  - **Switch**  
    - Type: Switch  
    - Role: Routes messages by content type  
    - Configuration:  
      - Checks if `message.text` exists → output "Text"  
      - Checks if `message.voice` exists → output "Voice"  
      - Else → output "extra" (fallback)  
    - Inputs: Telegram message JSON  
    - Outputs:  
      - "Text" → Financial Agent (AI processing)  
      - "Voice" → Get a file (to download voice message)  
      - "extra" → Send Fallback Message  
    - Edge Cases: Messages without text or voice (e.g., images, videos) trigger fallback

  - **Get a file**  
    - Type: Telegram node (file download)  
    - Role: Downloads voice message file from Telegram using file_id  
    - Configuration: Uses `message.voice.file_id` from incoming message  
    - Credentials: Telegram API  
    - Inputs: Voice message file_id from Switch "Voice" output  
    - Outputs: Binary audio file to Transcribe a recording node  
    - Edge Cases: File not found, Telegram API failures, large file size

  - **Send Fallback Message**  
    - Type: Telegram message sender  
    - Role: Sends a fallback text when unsupported message types are received  
    - Configuration: Sends fixed HTML-formatted text indicating unsupported input  
    - Inputs: From Switch "extra" output  
    - Outputs: None (end)  
    - Edge Cases: Bot message send failure

---

#### 1.2 Voice Transcription

- **Overview:** Downloads and converts voice messages to text using Google Gemini's audio transcription model.
- **Nodes Involved:**  
  - Transcribe a recording

- **Node Details:**

  - **Transcribe a recording**  
    - Type: Google Gemini Audio Model node  
    - Role: Transcribes voice audio file into text  
    - Configuration:  
      - Model: `gemini-2.5-flash`  
      - Input type: Binary audio (from "Get a file")  
      - Resource: Audio transcription  
    - Credentials: Google Gemini API ("Google Gemini VIKTHYR")  
    - Inputs: Binary audio file  
    - Outputs: Transcribed text in JSON for AI processing  
    - Edge Cases: Audio quality issues, API limits, transcription errors

---

#### 1.3 AI Financial Agent Processing

- **Overview:** Core logic interpreting user messages (text or transcribed voice), extracting financial intents and entities, performing Google Sheets operations, and preparing HTML-formatted responses tailored for Telegram.
- **Nodes Involved:**  
  - Financial Agent  
  - Simple Memory  
  - Google Gemini Chat Model  
  - Calculator

- **Node Details:**

  - **Financial Agent**  
    - Type: Langchain AI Agent  
    - Role: Central AI interpreting messages, managing flow, and invoking tools  
    - Configuration:  
      - Input text sourced from either raw text or transcribed voice (`content.parts[0].text` or `message.text`)  
      - System prompt defines detailed financial assistant behavior, data schema, operation rules, HTML formatting mandates, and response templates  
      - Uses multiple tools for Google Sheets operations and calculations  
    - Credentials: Google Gemini API  
    - Inputs: User text or transcribed text  
    - Outputs: HTML formatted response text for Telegram  
    - Edge Cases: AI interpretation errors, model unavailability, prompt misconfiguration, exceeding Telegram message length

  - **Simple Memory**  
    - Type: Langchain Memory Buffer  
    - Role: Manages conversation context with session keyed by Telegram user ID  
    - Configuration: Session key using Telegram `from.id` ensures individual user sessions  
    - Inputs: User messages and AI outputs  
    - Outputs: Context to Financial Agent for improved interaction coherence  
    - Edge Cases: Memory overflow, data leakage between users

  - **Google Gemini Chat Model**  
    - Type: Langchain Chat Model  
    - Role: Provides chat completions for AI agent's language understanding  
    - Credentials: Google Gemini API  
    - Inputs/Outputs: Plugged into Financial Agent as language model  
    - Edge Cases: API rate limits, downtime

  - **Calculator**  
    - Type: Langchain Tool Calculator  
    - Role: Performs any necessary numeric calculations requested by the AI agent  
    - Inputs/Outputs: Connected to AI agent as a tool  
    - Edge Cases: Calculation errors or invalid operations

---

#### 1.4 Google Sheets Data Operations

- **Overview:** Nodes that execute CRUD operations on the Google Sheets financial ledger based on AI agent commands.
- **Nodes Involved:**  
  - get_all_registers  
  - create_new_register  
  - update_register  
  - delete_register

- **Node Details:**

  - **get_all_registers**  
    - Type: Google Sheets Tool (Get rows)  
    - Role: Retrieves all financial records from sheet  
    - Configuration:  
      - Sheet: "Página1" (gid=0)  
      - Document: Google Sheets ID "1QL6tl99I5vbZj5CyI772RcSN-YARflEasLfYdV1g2I0"  
      - No filters, returns complete data  
    - Credentials: Google Sheets OAuth2 API  
    - Inputs: Called by AI agent before any data operation  
    - Outputs: Full data for AI analysis  
    - Edge Cases: API quota limits, sheet permission errors

  - **create_new_register**  
    - Type: Google Sheets Tool (Append row)  
    - Role: Adds new financial transaction row  
    - Configuration:  
      - Columns: id, data, tipo, valor, categoria, descricao, metodo_pagamento  
      - Sheet and Document same as above  
      - Appends data as RAW cell format  
    - Credentials: Google Sheets OAuth2 API  
    - Inputs: Data from AI agent with calculated new id  
    - Outputs: Confirmation to AI agent  
    - Edge Cases: Duplicate IDs, data validation errors

  - **update_register**  
    - Type: Google Sheets Tool (Update row)  
    - Role: Updates existing transaction row identified by id  
    - Configuration:  
      - Columns same as create_new_register plus row_number for locating row  
      - Matching columns based on id  
    - Credentials: Google Sheets OAuth2 API  
    - Inputs: Updated data from AI agent  
    - Outputs: Confirmation to AI agent  
    - Edge Cases: Invalid IDs, concurrent edits

  - **delete_register**  
    - Type: Google Sheets Tool (Delete row)  
    - Role: Deletes specified row(s) from sheet  
    - Configuration:  
      - Requires startIndex and numberToDelete parameters from AI input  
      - Sheet and Document same as above  
    - Credentials: Google Sheets OAuth2 API  
    - Inputs: Row indexes to delete from AI agent  
    - Outputs: Confirmation message  
    - Edge Cases: Invalid row index, accidental deletion

---

#### 1.5 Response Delivery

- **Overview:** Sends back the AI-generated, Telegram HTML-compliant response messages to users.
- **Nodes Involved:**  
  - Send Response

- **Node Details:**

  - **Send Response**  
    - Type: Telegram node (send message)  
    - Role: Delivers formatted text response to Telegram user  
    - Configuration:  
      - Text from AI agent output JSON property `output`  
      - Chat ID sourced from Telegram message `from.id`  
      - Parse mode set to "HTML" for Telegram formatting  
      - Attribution disabled (no extra credit text appended)  
    - Credentials: Telegram API  
    - Inputs: AI agent output  
    - Outputs: None (end)  
    - Edge Cases: Telegram API message send failures, message length limits (max 4096 chars)

---

#### 1.6 Error Handling / Fallback

- **Overview:** Handles unsupported user inputs such as images or videos by sending a predefined fallback message.
- **Nodes Involved:**  
  - Send Fallback Message (see above in section 1.1)

---

### 3. Summary Table

| Node Name           | Node Type                          | Functional Role                            | Input Node(s)            | Output Node(s)         | Sticky Note                                                                                                       |
|---------------------|----------------------------------|-------------------------------------------|--------------------------|------------------------|------------------------------------------------------------------------------------------------------------------|
| Telegram Bot Trigger | Telegram Trigger                 | Entry point, receives Telegram messages   | None                     | Switch                 | Setup Telegram Bot Trigger: Create bot, add token, activate, and receive messages                                |
| Switch              | Switch                          | Routes messages by content type            | Telegram Bot Trigger     | Financial Agent, Get a file, Send Fallback Message |                                                                                                                  |
| Get a file          | Telegram File Download           | Downloads voice message from Telegram      | Switch ("Voice")         | Transcribe a recording  | Gemini To Transcription: Insert your Google Gemini Credentials                                                   |
| Transcribe a recording | Google Gemini Audio Model       | Transcribes voice audio to text             | Get a file               | Financial Agent         | Gemini To Transcription: Insert your Google Gemini Credentials                                                   |
| Financial Agent      | Langchain AI Agent              | Interprets messages, manages finances      | Switch ("Text"), Transcribe a recording | Send Response          | Gemini LLM: Insert your Google Gemini Credentials                                                                |
| Simple Memory        | Langchain Memory Buffer Window | Maintains user conversation context        | Financial Agent (ai_memory) | Financial Agent (ai_memory) |                                                                                                                  |
| Google Gemini Chat Model | Langchain Chat Model          | Provides language model support             | Financial Agent (ai_languageModel) | Financial Agent (ai_languageModel) | Gemini LLM: Insert your Google Gemini Credentials                                                                |
| Calculator          | Langchain Calculator Tool       | Performs calculations requested by AI      | Financial Agent (ai_tool) | Financial Agent (ai_tool) |                                                                                                                  |
| get_all_registers    | Google Sheets Tool (Get rows)    | Retrieves all financial records             | Financial Agent (ai_tool) | Financial Agent (ai_tool) | Google Sheets Configuration: Setup spreadsheet columns and share with Google Service Account                    |
| create_new_register  | Google Sheets Tool (Append row)  | Creates new financial record                 | Financial Agent (ai_tool) | Financial Agent (ai_tool) | Google Sheets Configuration                                                                                      |
| update_register      | Google Sheets Tool (Update row)  | Updates existing financial record            | Financial Agent (ai_tool) | Financial Agent (ai_tool) | Google Sheets Configuration                                                                                      |
| delete_register      | Google Sheets Tool (Delete row)  | Deletes specified financial record           | Financial Agent (ai_tool) | Financial Agent (ai_tool) | Google Sheets Configuration                                                                                      |
| Send Response       | Telegram Send Message            | Sends AI response back to Telegram user     | Financial Agent           | None                   |                                                                                                                  |
| Send Fallback Message | Telegram Send Message           | Sends fallback for unsupported inputs       | Switch ("extra")          | None                   |                                                                                                                  |
| Sticky Note          | Sticky Note                     | Setup instructions and info                  | None                     | None                   | See sticky notes for Telegram Bot setup, workflow logic, Google Sheets config, and Gemini credentials            |
| Sticky Note1         | Sticky Note                     | Workflow high-level explanation              | None                     | None                   |                                                                                                                  |
| Sticky Note2         | Sticky Note                     | Google Sheets configuration details          | None                     | None                   |                                                                                                                  |
| Sticky Note3         | Sticky Note                     | Gemini Transcription credentials reminder    | None                     | None                   |                                                                                                                  |
| Sticky Note4         | Sticky Note                     | Gemini LLM credentials reminder               | None                     | None                   |                                                                                                                  |
| Sticky Note5         | Sticky Note                     | Empty content placeholder                     | None                     | None                   |                                                                                                                  |
| Sticky Note6         | Sticky Note                     | Author LinkedIn link                           | None                     | None                   |                                                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Bot Trigger node**  
   - Type: Telegram Trigger  
   - Configure to listen to "message" updates only  
   - Set credentials with your Telegram bot token (from @BotFather)  
   - Position: Entry point of workflow

2. **Add a Switch node**  
   - Connect input from Telegram Bot Trigger  
   - Create three outputs: "Text", "Voice", and "extra" (fallback)  
   - Configure rules:  
     - Output "Text": if message.text exists  
     - Output "Voice": if message.voice exists  
     - Output "extra": all other cases

3. **Add "Get a file" node to download voice messages**  
   - Connect input from Switch output "Voice"  
   - Set resource to "file"  
   - Use expression for fileId: `{{$json.message.voice.file_id}}`  
   - Set Telegram credentials

4. **Add "Transcribe a recording" node**  
   - Connect input from "Get a file" node  
   - Set node type to Google Gemini Audio Model for transcription  
   - Select model: "models/gemini-2.5-flash"  
   - Input type: binary (audio file)  
   - Configure Google Gemini credentials

5. **Add "Financial Agent" Langchain AI node**  
   - Connect inputs from:  
     - Switch output "Text" (for text messages)  
     - Transcribe a recording output (for transcribed voice messages)  
   - Set input text expression: `{{$json.content?.parts[0].text || $json.message.text}}`  
   - Paste the detailed system prompt defining financial assistant behavior and HTML formatting  
   - Configure Google Gemini credentials for AI language model  
   - Add tools: Calculator, Google Sheets nodes (to be created next)  
   - Set up AI memory buffer node (see next steps)

6. **Add "Simple Memory" node (Langchain Memory Buffer Window)**  
   - Set session key to `{{$json.message.from.id}}` to separate user sessions  
   - Connect its output to AI Agent's `ai_memory` input  
   - Connect AI Agent's `ai_memory` output back to this node (bi-directional)

7. **Add "Google Gemini Chat Model" node**  
   - Connect to AI Agent's `ai_languageModel` input/output  
   - Configure Google Gemini credentials

8. **Add "Calculator" node**  
   - Connect to AI Agent's `ai_tool` input/output

9. **Add Google Sheets Tool nodes for CRUD operations:**  
   - **get_all_registers** (Get all rows)  
     - Document ID: your Google Sheet ID  
     - Sheet Name: "Página1" (gid=0)  
     - Credentials: Google Sheets OAuth2  
     - Connect to AI Agent's `ai_tool` input/output  

   - **create_new_register** (Append row)  
     - Columns: id, data, tipo, valor, categoria, descricao, metodo_pagamento  
     - Document ID and Sheet Name as above  
     - Credentials: Google Sheets OAuth2  
     - Connect to AI Agent's `ai_tool` input/output  

   - **update_register** (Update row)  
     - Columns: same as create_new_register plus row_number  
     - Matching column: id  
     - Credentials: Google Sheets OAuth2  
     - Connect to AI Agent's `ai_tool` input/output  

   - **delete_register** (Delete row)  
     - Parameters: startIndex and numberToDelete (from AI input)  
     - Document ID and Sheet Name as above  
     - Credentials: Google Sheets OAuth2  
     - Connect to AI Agent's `ai_tool` input/output  

10. **Add "Send Response" node**  
    - Connect from AI Agent main output  
    - Configure to send message to Telegram user: chatId `{{$json.message.from.id}}`  
    - Text: `{{$json.output}}` (AI generated HTML response)  
    - Parse mode: "HTML"  
    - Credentials: Telegram API  

11. **Add "Send Fallback Message" node**  
    - Connect from Switch output "extra"  
    - Text: fixed message informing unsupported content types (HTML formatted)  
    - ChatId: `{{$json.message.from.id}}`  
    - Parse mode: "HTML"  
    - Credentials: Telegram API  

12. **Connect workflow nodes as per described flow:**  
    - Telegram Bot Trigger → Switch  
    - Switch "Text" → Financial Agent  
    - Switch "Voice" → Get a file → Transcribe a recording → Financial Agent  
    - Switch "extra" → Send Fallback Message  
    - Financial Agent → Send Response  

13. **Set sticky notes or comments (optional):**  
    - Instructions for Telegram Bot setup, Google Sheets configuration, AI prompt usage, and credentials

14. **Test the workflow:**  
    - Send text commands or voice notes to Telegram bot  
    - Confirm data is correctly inserted, updated, or queried in Google Sheets  
    - Observe formatted Telegram HTML responses

---

### 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                    |
|----------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| Setup Telegram Bot Trigger: Create bot with @BotFather, add token, enable message reception.                                     | Sticky Note near Telegram Bot Trigger node         |
| Workflow logic: Receive messages, interpret with AI, manage Google Sheets data, respond via Telegram in HTML format.             | Workflow explanation Sticky Note                    |
| Google Sheets setup: Create sheet with columns id, tipo, valor, categoria, metodo_pagamento, descricao, data; share with service account and configure OAuth2 credentials. | Sticky Note near Google Sheets nodes                |
| Insert your Google Gemini Credentials in transcription and LLM nodes for AI functionality.                                       | Sticky Notes near Gemini nodes                       |
| Telegram HTML formatting rules and templates strictly enforced for responses.                                                    | Detailed in AI agent system prompt                   |
| LinkedIn profile of workflow author: [https://www.linkedin.com/in/vikthyr](https://www.linkedin.com/in/vikthyr)                   | Sticky Note6                                         |

---

**Disclaimer:**  
The content provided derives exclusively from an automated workflow created with n8n, respecting all current content policies. It contains no illegal, offensive, or protected elements. All processed data is legal and public.

---