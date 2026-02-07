Automate Content Requests from Telegram to Notion with Gemini AI

https://n8nworkflows.xyz/workflows/automate-content-requests-from-telegram-to-notion-with-gemini-ai-8052


# Automate Content Requests from Telegram to Notion with Gemini AI

### 1. Workflow Overview

This workflow automates content requests received via Telegram and logs them into a Notion database using AI-driven processing with Google Gemini and Langchain agents. It is designed to handle messages from specific Telegram groups or chats, validate user inputs, generate content copywriting, confirm with users, and finally create structured entries in Notion.

Logical blocks are grouped as follows:

- **1.1 Telegram Input Reception:** Listens for new Telegram messages and filters them based on allowed chat or group IDs.
- **1.2 User Validation & Response:** Checks if the message sender is recognized and sends polite replies if not.
- **1.3 AI Processing & Memory:** Uses Langchain AI agents with Google Gemini LM and conversation memory to interpret user commands, generate copywriting, and prepare Notion entries.
- **1.4 User Confirmation & Notion Integration:** Sends AI-generated preview messages back to Telegram users and, upon agreement, creates new pages in Notion with properly formatted properties.

---

### 2. Block-by-Block Analysis

#### 2.1 Telegram Input Reception

- **Overview:**  
  This block captures incoming Telegram messages via webhook triggers and filters them to only process messages from designated Telegram groups or private chats.

- **Nodes Involved:**  
  - Telegram Trigger  
  - If (chat ID filter)  
  - Telegram Trigger1 (duplicate trigger, possibly for another chat scope)  
  - If1 (secondary chat ID filter)

- **Node Details:**

  - **Telegram Trigger**  
    - Type: Telegram Trigger (Webhook trigger for Telegram updates)  
    - Config: Listens for "message" updates. Requires Telegram API credentials.  
    - Inputs: None (trigger)  
    - Outputs: Passes full message JSON to "If" node  
    - Failures: Invalid credentials, webhook misconfiguration, or Telegram API downtime.

  - **If**  
    - Type: Conditional check  
    - Config: Checks if incoming message chat ID equals either `YOUR_TELEGRAM_GROUP_ID` or `YOUR_TELEGRAM_CHAT_ID`  
    - Inputs: From Telegram Trigger  
    - Outputs:  
      - True: forwards message for further processing  
      - False: routes to "Send a text message" node (unrecognized chat)  
    - Edge cases: Incorrect chat ID values, numeric comparison failures.

  - **Telegram Trigger1**  
    - Duplicate of Telegram Trigger, likely to separate handling for private chats or other groups.  
    - Same config as Telegram Trigger.

  - **If1**  
    - Similar to "If" node, filters messages by `YOUR_TELEGRAM_CHAT_ID` only.  
    - Routes allowed messages to "Send a chat action" and rejects others with a polite text response.

#### 2.2 User Validation & Response

- **Overview:**  
  This block validates whether the user or chat is authorized and sends a polite refusal message if not recognized.

- **Nodes Involved:**  
  - Send a text message  
  - Send a text message3  
  - Send a chat action  
  - Send a chat action1  
  - If2 (further user validation by username or mention)

- **Node Details:**

  - **Send a text message**  
    - Type: Telegram node to send messages  
    - Config: Sends "Maaf, siapa ya? aku gak kenal!" ("Sorry, who are you? I don't know you!") to unrecognized chat IDs.  
    - Inputs: From "If" node's false output  
    - Failure: Telegram API errors, invalid chat ID.

  - **Send a text message3**  
    - Similar to above, used in "If1" false branch for private chats.

  - **Send a chat action / Send a chat action1**  
    - Sends Telegram "chat action" (typing indicator) to show bot activity  
    - Inputs: From "If1" or "AI Agent" nodes respectively  
    - Failure: Telegram API issues.

  - **If2**  
    - Checks if the message is a reply to the bot or contains the bot username (YOUR_TELEGRAM_USERNAME)  
    - Inputs: From "If" node true output  
    - Outputs: Currently configured to no further nodes.

#### 2.3 AI Processing & Memory

- **Overview:**  
  Receives user message text, processes with AI agent using Langchain framework, Google Gemini chat model, and conversation memory buffer to generate copywriting content and structured data for Notion.

- **Nodes Involved:**  
  - AI Agent (Langchain agent)  
  - Google Gemini Chat Model  
  - Simple Memory (Langchain memory buffer)

- **Node Details:**

  - **AI Agent**  
    - Type: Langchain AI agent node  
    - Config:  
      - Input text extracted from Telegram message text  
      - System prompt defines persona "Siti," a cheerful, humble, smart 25yo woman, with detailed instructions on parsing user input format, generating copywriting, sending confirmation, and formatting Notion content.  
      - Variables like current date/time, user first name are injected dynamically.  
      - Output is HTML-formatted Telegram message content including previews and instructions.  
    - Inputs: From "Send a chat action" node (indicates processing start) and memory & language model nodes  
    - Outputs: To "Send a chat action1" node (typing indicator before sending message)  
    - Edge cases: Incorrect input format, missing data, AI API failures, prompt injection risks.

  - **Google Gemini Chat Model**  
    - Type: Langchain Google Gemini LM node  
    - Config: Temperature 0.4 for balanced creativity  
    - Inputs: From AI Agent to provide LLM responses  
    - Outputs: Back to AI Agent  
    - Failures: API key invalid, quota exceeded, network errors.

  - **Simple Memory**  
    - Type: Langchain memory buffer node  
    - Config: Session keyed by Telegram user ID to maintain conversational context, context window length 20 messages  
    - Inputs: From AI Agent (memory input/output)  
    - Outputs: To AI Agent  
    - Edge cases: Session key missing, memory overflow, data privacy concerns.

#### 2.4 User Confirmation & Notion Integration

- **Overview:**  
  Sends AI-generated preview message back to Telegram user for confirmation and creates a database page in Notion with properly formatted properties once confirmed.

- **Nodes Involved:**  
  - Send a text message1  
  - Notion

- **Node Details:**

  - **Send a text message1**  
    - Type: Telegram node to send the AI-generated content preview  
    - Config: Sends HTML-parsed message to the user, replying to original message  
    - Inputs: From "Send a chat action1" node (typing indicator)  
    - On error: Continues workflow without stopping  
    - Edge cases: Telegram message format issues, API errors.

  - **Notion**  
    - Type: Notion node to create a database page  
    - Config:  
      - Database ID set to "Content Calendar" (example ID provided)  
      - Properties populated from AI Agent outputs using dynamic variables (e.g., Title, Content Writing, Channel, Person, Date, Reference Content, Content Type)  
      - Timezone configured for Asia/Jakarta  
    - Inputs: AI Agent output mapped via AI-generated property values  
    - Outputs: None shown in workflow  
    - Failures: Invalid Notion credentials, API limits, malformed property data.

---

### 3. Summary Table

| Node Name           | Node Type                        | Functional Role                       | Input Node(s)            | Output Node(s)           | Sticky Note                                                                 |
|---------------------|---------------------------------|-------------------------------------|--------------------------|--------------------------|------------------------------------------------------------------------------|
| Telegram Trigger     | telegramTrigger                 | Entry point: listens for Telegram messages | None                     | If                       | ## Rules for Group and private<br>Group triggers in mention or reply chat from bot |
| If                  | if                             | Filters messages by allowed chat IDs | Telegram Trigger         | If2, Send a text message |                                                                              |
| Send a text message  | telegram                      | Sends "unknown user" polite reply   | If (false branch)         | None                     |                                                                              |
| Send a chat action   | telegram                      | Shows "typing" action in Telegram   | If1 (true branch)         | AI Agent                 |                                                                              |
| AI Agent            | langchain.agent                | Processes text with AI, generates content & Notion data | Send a chat action, Simple Memory, Google Gemini Chat Model | Send a chat action1          |                                                                              |
| Google Gemini Chat Model | langchain.lmChatGoogleGemini | Provides LLM responses for AI Agent | AI Agent                 | AI Agent                 |                                                                              |
| Simple Memory        | langchain.memoryBufferWindow  | Maintains conversation context      | AI Agent                 | AI Agent                 |                                                                              |
| Send a text message1 | telegram                      | Sends AI-generated preview to user  | Send a chat action1       | None                     |                                                                              |
| Send a chat action1  | telegram                      | Shows "typing" action before reply  | AI Agent                 | Send a text message1     |                                                                              |
| Notion               | notionTool                    | Creates Notion database page         | AI Agent                 | None                     |                                                                              |
| If2                  | if                             | Checks if message is reply or mention of bot | If                      | None                     |                                                                              |
| Telegram Trigger1    | telegramTrigger                | Secondary Telegram message trigger   | None                     | If1                      |                                                                              |
| If1                  | if                             | Filters messages by private chat ID | Telegram Trigger1        | Send a chat action, Send a text message3 |                                                                              |
| Send a text message3 | telegram                      | Sends "unknown user" reply for private chat | If1 (false branch)        | None                     |                                                                              |
| Sticky Note          | stickyNote                    | Note: Explains group/private rules  | None                     | None                     | ## Rules for Group and private<br>Group triggers in mention or reply chat from bot |
| Sticky Note1         | stickyNote                    | Note: Explains private rules         | None                     | None                     | ## Rules private                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node**  
   - Type: Telegram Trigger  
   - Set updates to ["message"]  
   - Connect Telegram API credentials  
   - Position accordingly

2. **Add an If node to filter allowed chats**  
   - Check if `{{$json.message.chat.id}}` equals `YOUR_TELEGRAM_GROUP_ID` or `YOUR_TELEGRAM_CHAT_ID`  
   - Connect input from Telegram Trigger  
   - True branch: proceed to user validation  
   - False branch: connect to "Send a text message" node

3. **Create "Send a text message" node**  
   - Type: Telegram  
   - Text: "Maaf, siapa ya? aku gak kenal!"  
   - Chat ID: `{{$json.message.chat.id}}`  
   - Reply to message ID: `{{$json.message.message_id}}`  
   - Connect false branch of If node

4. **Create Telegram Trigger1 node (optional for private chats)**  
   - Same setup as Telegram Trigger  
   - Connect to If1 node

5. **Create If1 node for private chat filtering**  
   - Condition: chat ID equals `YOUR_TELEGRAM_CHAT_ID`  
   - True branch: connect to "Send a chat action" node  
   - False branch: connect to "Send a text message3"

6. **Create "Send a text message3" node**  
   - Same message as "Send a text message" node  
   - Connect from If1 false branch

7. **Create "Send a chat action" node**  
   - Type: Telegram  
   - Operation: sendChatAction (typing)  
   - Chat ID: `{{$json.message.chat.id}}`  
   - Connect If1 true branch

8. **Create AI Agent node (Langchain agent)**  
   - Type: Langchain agent  
   - Parameters:  
     - Text input: `{{$('Telegram Trigger').item.json.message.text}}`  
     - System message: Detailed persona and instructions as per the prompt in the original workflow  
     - Dynamic injections for date/time and user first name  
   - Connect input from "Send a chat action" node  
   - Connect AI memory and language model nodes as `ai_memory` and `ai_languageModel` inputs

9. **Create Google Gemini Chat Model node**  
   - Type: Langchain Google Gemini LM node  
   - Temperature: 0.4  
   - Connect as AI Agent’s language model input

10. **Create Simple Memory node**  
    - Type: Langchain memoryBufferWindow  
    - Session key: `{{$('Telegram Trigger').item.json.message.from.id}}`  
    - Context window: 20 messages  
    - Connect as AI Agent’s memory input

11. **Create "Send a chat action1" node**  
    - Same as previous chat action node (typing)  
    - Connect AI Agent output to this node

12. **Create "Send a text message1" node**  
    - Type: Telegram  
    - Text: `{{$('AI Agent').item.json.output}}` (HTML formatted)  
    - Chat ID: `{{$('Telegram Trigger').item.json.message.chat.id}}`  
    - Reply to message ID: original message ID  
    - Parse mode: HTML  
    - On error: continue workflow  
    - Connect from "Send a chat action1"

13. **Create Notion node**  
    - Type: Notion tool, resource: databasePage  
    - Set Notion credentials  
    - Database ID: your Content Calendar database ID  
    - Map properties using AI Agent outputs with the following property keys and types:  
      - Title (rich_text)  
      - Content Writing (rich_text)  
      - Channel (multi_select)  
      - Person (multi_select)  
      - Date (date, timezone Asia/Jakarta)  
      - Reference Content (rich_text)  
      - Content Type (multi_select)  
    - Connect from AI Agent output, mapping AI generated fields

14. **Create If2 node for message reply or mention validation (optional)**  
    - Condition: message reply from bot username or message text contains bot username  
    - Connect from If node true branch (if needed)

15. **Add Sticky Note nodes**  
    - Add notes as reminders for group/private chat rules as per original workflow

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                                                                       |
|--------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Group triggers in mention or reply chat from bot                                                       | Sticky Note covering initial Telegram trigger and If node                                           |
| Rules for handling private chats                                                                       | Sticky Note near secondary Telegram trigger                                                         |
| The AI Agent uses a persona named "Siti" with detailed instructions for content creation and Notion integration | Embedded in AI Agent system prompt                                                                  |
| Ensure Telegram API and Notion credentials are properly configured and have sufficient permissions      | Credential management in n8n                                                                        |
| The workflow uses dynamic date/time variables in Asia/Jakarta timezone                                 | Important for date property in Notion                                                               |
| Telegram bot messages use HTML formatting per Telegram Bot API                                        | Ensures rich text and links can be sent correctly                                                   |
| Google Gemini API requires valid Google Palm API credentials                                          | For AI language model integration                                                                    |

---

**Disclaimer:**  
The provided text is generated exclusively from an automated n8n workflow. The process adheres strictly to current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and publicly accessible.