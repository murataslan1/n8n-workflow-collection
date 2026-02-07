Automate Telegram Channel Post Reactions with Bot Rotation & GPT-5-mini

https://n8nworkflows.xyz/workflows/automate-telegram-channel-post-reactions-with-bot-rotation---gpt-5-mini-10296


# Automate Telegram Channel Post Reactions with Bot Rotation & GPT-5-mini

---

### 1. Workflow Overview

This workflow automates sending reactions to Telegram channel posts by rotating multiple bot accounts and intelligently processing user requests. It is designed for Telegram channel managers or admins who want to boost engagement on specific posts by programmatically adding emoji reactions requested via Telegram messages.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** A Telegram trigger listens for incoming user messages requesting reactions on specific posts.
- **1.2 AI Processing:** Uses GPT-5-mini to parse natural language messages, extract the number and type of requested emojis.
- **1.3 Data Processing:** Validates and formats the AI output, extracts message IDs from links, rotates bot tokens, and prepares reaction objects.
- **1.4 Batch Processing & Rate Limit Handling:** Loops through each reaction object, limits the request rate, and adds wait times to avoid API throttling.
- **1.5 Reaction Execution:** Sends each reaction via Telegram’s `setMessageReaction` API endpoint using the appropriate bot token.
- **1.6 Completion & Confirmation:** Sends a confirmation message back to the user indicating all reactions were successfully added.
- **1.7 Debugging:** Logs details of reactions being sent for troubleshooting.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Captures incoming Telegram messages to trigger the workflow and pass user requests downstream.
- **Nodes Involved:**  
  - Telegram Chat Trigger
  - Sticky Note - Telegram

- **Node Details:**

  - **Telegram Chat Trigger**  
    - *Type:* telegramTrigger  
    - *Role:* Entry point triggered when a Telegram message arrives.  
    - *Configuration:* Listens to "message" updates. Uses Telegram API credentials for authentication.  
    - *Expressions:* None. Outputs full message payload with chat ID and text.  
    - *Connections:* Passes data to "Message a model" node.  
    - *Edge Cases:* Failure if Telegram credentials invalid or webhook misconfigured.  
    - *Notes:* Trigger requires the bot to be added to the channel.

  - **Sticky Note - Telegram**  
    - *Type:* stickyNote  
    - *Role:* Documentation of Input Reception block purpose and outputs.  
    - *Configuration:* None.  
    - *Connections:* None.

#### 2.2 AI Processing

- **Overview:** Uses GPT-5-mini to analyze the user message, interpret natural language reaction requests, and output a JSON array of emojis.
- **Nodes Involved:**  
  - Message a model (OpenAI Langchain)  
  - Sticky Note - AI

- **Node Details:**

  - **Message a model**  
    - *Type:* @n8n/n8n-nodes-langchain.openAi  
    - *Role:* Sends user text to GPT-5-mini to parse requested reactions.  
    - *Configuration:*  
      - Model: gpt-5-mini-2025-08-07  
      - System prompt details extensive instructions on emoji aliases, formatting, and output rules.  
      - Input message text is passed dynamically from Telegram trigger.  
    - *Expressions:* Uses expression to inject Telegram message text.  
    - *Connections:* Output forwarded to "Code Prep".  
    - *Edge Cases:* API failures, malformed user input, unexpected AI response format.  
    - *Credentials:* OpenAI API key required.

  - **Sticky Note - AI**  
    - *Type:* stickyNote  
    - *Role:* Documentation for AI analysis purpose and output format.

#### 2.3 Data Processing

- **Overview:** Validates and transforms AI output, extracts Telegram message ID from user text, rotates bot tokens, and prepares reaction objects for API calls.
- **Nodes Involved:**  
  - Code Prep (Code node)  
  - Sticky Note - Processing

- **Node Details:**

  - **Code Prep**  
    - *Type:* code  
    - *Role:* Custom JavaScript to parse AI output JSON, extract messageId from Telegram link in user text, validate emojis, handle duplicates, and assign bot tokens in rotation.  
    - *Key Configurations:*  
      - Hardcoded `chatId` for target Telegram channel (replace with your channel ID).  
      - Array of bot tokens (replace with your own tokens).  
      - Valid emojis list as per Telegram API.  
      - Logic to replace invalid emojis with valid random ones.  
      - Allows duplicates only if ≤3 unique emojis requested.  
      - Throws error if no message ID found with user-friendly message.  
    - *Connections:* Passes processed reaction objects to Debugging node.  
    - *Edge Cases:* Missing or invalid Telegram message link, invalid emojis, empty AI output, code execution errors.  
    - *Notes:* Requires updating with your own channel ID and bot tokens in code.

  - **Sticky Note - Processing**  
    - *Type:* stickyNote  
    - *Role:* Describes detailed processing steps including emoji validation and bot rotation.

#### 2.4 Debugging

- **Overview:** Logs detailed information about each reaction item for monitoring and troubleshooting.
- **Nodes Involved:**  
  - Debugging (Code node)  
  - Sticky Note - Debug

- **Node Details:**

  - **Debugging**  
    - *Type:* code  
    - *Role:* Logs total items, emoji, chat ID, message ID, and partial bot token (masked) for each reaction.  
    - *Connections:* Sends items to Loop Over Items node.  
    - *Edge Cases:* Console output may not be visible if workflow runs in non-interactive mode.

  - **Sticky Note - Debug**  
    - *Type:* stickyNote  
    - *Role:* Describes debug logging purpose and details.

#### 2.5 Batch Processing & Rate Limit Handling

- **Overview:** Processes each reaction object sequentially to avoid Telegram API rate limits by looping and limiting execution rate.
- **Nodes Involved:**  
  - Loop Over Items (SplitInBatches)  
  - Limit (Limit node)  
  - Wait (Wait node)  
  - Sticky Note - Loop  
  - Sticky Note - Rate Limit

- **Node Details:**

  - **Loop Over Items**  
    - *Type:* splitInBatches  
    - *Role:* Splits array of reactions to process one at a time sequentially.  
    - *Configuration:* Default batch size 1.  
    - *Connections:* Outputs to Limit and HTTP Request nodes.  
    - *Edge Cases:* May cause slow processing if many reactions.

  - **Limit**  
    - *Type:* limit  
    - *Role:* Controls request flow rate to avoid hitting Telegram API limits.  
    - *Connections:* Passes to Wait node.  
    - *Edge Cases:* None specific but misconfiguration can cause delays or throttling.

  - **Wait**  
    - *Type:* wait  
    - *Role:* Adds delay between API calls to comply with rate limits.  
    - *Configuration:* Default delay (can be adjusted).  
    - *Connections:* Leads to "Reply 'all done' message" node.

  - **Sticky Note - Loop**  
    - *Type:* stickyNote  
    - *Role:* Describes looping logic and rate limit necessity.

  - **Sticky Note - Rate Limit**  
    - *Type:* stickyNote  
    - *Role:* Explains limit and wait nodes’ role in preventing throttling.

#### 2.6 Reaction Execution

- **Overview:** Calls Telegram API to add each reaction using the respective bot token.
- **Nodes Involved:**  
  - HTTP Request  
  - Sticky Note - HTTP

- **Node Details:**

  - **HTTP Request**  
    - *Type:* httpRequest  
    - *Role:* Executes POST request to Telegram `setMessageReaction` endpoint.  
    - *Configuration:*  
      - URL dynamically constructed with botToken from current item.  
      - JSON body includes chat_id, message_id, and emoji reaction.  
      - Sends body as JSON.  
    - *Connections:* Loops back to Loop Over Items node for next reaction.  
    - *Edge Cases:* API failures, invalid tokens, message not found errors, rate limiting errors.

  - **Sticky Note - HTTP**  
    - *Type:* stickyNote  
    - *Role:* Describes API request purpose and parameters.

#### 2.7 Completion & Confirmation

- **Overview:** Sends confirmation message to the user once all reactions are processed.
- **Nodes Involved:**  
  - Reply "all done" message (Telegram node)  
  - Sticky Note - Completion

- **Node Details:**

  - **Reply "all done" message**  
    - *Type:* telegram  
    - *Role:* Sends a text message ("All done!") back to the original chat ID.  
    - *Configuration:*  
      - Chat ID dynamically taken from the trigger message.  
      - Append attribution disabled for clean message.  
    - *Connections:* None (end of flow).  
    - *Edge Cases:* Telegram API failure, chat ID missing.

  - **Sticky Note - Completion**  
    - *Type:* stickyNote  
    - *Role:* Describes user confirmation purpose.

#### 2.8 Overview Document

- **Sticky Note - Overview**  
  - Provides high-level workflow description, usage instructions, credentials needed, and example user messages.  
  - Includes tips on how to obtain Telegram Channel IDs.  
  - Serves as an accessible project documentation embedded within the workflow.

---

### 3. Summary Table

| Node Name                | Node Type                        | Functional Role                       | Input Node(s)          | Output Node(s)                    | Sticky Note                                                                                                    |
|--------------------------|---------------------------------|-------------------------------------|-----------------------|---------------------------------|---------------------------------------------------------------------------------------------------------------|
| Telegram Chat Trigger     | telegramTrigger                 | Entry point - listens for messages  |                       | Message a model                  | Part of Input Reception block. Listens for user messages requesting reactions.                                |
| Message a model           | @n8n/n8n-nodes-langchain.openAi| AI parsing of user text              | Telegram Chat Trigger  | Code Prep                       | Uses GPT-5-mini to convert user message into JSON array of emojis.                                            |
| Code Prep                | code                           | Parses AI output, validates emojis, assigns bots | Message a model        | Debugging                      | Processes emojis, extracts message ID from link, rotates bot tokens, validates and prepares reaction objects. |
| Debugging                | code                           | Logs reaction data                   | Code Prep              | Loop Over Items                 | Logs emoji, chatId, messageId, partial bot token for troubleshooting.                                         |
| Loop Over Items          | splitInBatches                 | Processes reactions one by one      | Debugging              | Limit, HTTP Request             | Splits reaction array to avoid sending all at once, enabling sequential processing.                           |
| Limit                    | limit                          | Controls request flow rate          | Loop Over Items        | Wait                           | Prevents exceeding Telegram API rate limits by limiting throughput.                                           |
| Wait                     | wait                           | Adds delay between API calls        | Limit                  | Reply "all done" message        | Adds wait time to further prevent throttling.                                                                 |
| HTTP Request             | httpRequest                    | Sends reaction to Telegram API      | Loop Over Items        | Loop Over Items                 | Calls Telegram `setMessageReaction` API with bot token, chat ID, message ID, and emoji.                        |
| Reply "all done" message | telegram                       | Sends confirmation to user          | Wait                   |                                 | Confirms completion by sending "All done!" message to original chat.                                          |
| Sticky Note - Telegram   | stickyNote                     | Documentation of Input Reception    |                       |                                 | Explains Telegram trigger purpose.                                                                            |
| Sticky Note - AI         | stickyNote                     | Documentation of AI Processing      |                       |                                 | Explains AI parsing and output format.                                                                         |
| Sticky Note - Processing | stickyNote                     | Documentation of Data Processing    |                       |                                 | Explains emoji validation, bot token rotation, and message ID extraction.                                     |
| Sticky Note - Debug      | stickyNote                     | Documentation of Debug Logging      |                       |                                 | Explains debug logging purpose.                                                                                |
| Sticky Note - Loop       | stickyNote                     | Documentation of Looping            |                       |                                 | Explains batch processing to send one reaction at a time.                                                     |
| Sticky Note - Rate Limit | stickyNote                     | Documentation of Rate Limiting      |                       |                                 | Describes limit and wait nodes for throttling prevention.                                                     |
| Sticky Note - HTTP       | stickyNote                     | Documentation of API Request        |                       |                                 | Describes Telegram API call to send reactions.                                                                |
| Sticky Note - Completion | stickyNote                     | Documentation of Completion         |                       |                                 | Describes user confirmation message purpose.                                                                   |
| Sticky Note - Overview   | stickyNote                     | High-level workflow overview        |                       |                                 | Provides full workflow description, usage, credentials, and example inputs.                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Chat Trigger Node:**  
   - Type: telegramTrigger  
   - Configure to listen to "message" updates.  
   - Set Telegram API credentials (your bot’s OAuth token).  
   - Position as workflow entry point.

2. **Create OpenAI Langchain Node ("Message a model"):**  
   - Type: @n8n/n8n-nodes-langchain.openAi  
   - Model: Select "gpt-5-mini-2025-08-07" or equivalent GPT-5-mini model.  
   - Set system prompt as per workflow: instruct AI to parse reaction requests and output JSON array of emojis only.  
   - Pass Telegram message text dynamically via expression `={{ $json.message.text }}`.  
   - Link from Telegram Chat Trigger.

3. **Create Code Node ("Code Prep"):**  
   - Type: code  
   - Paste JavaScript code that:  
     - Extracts Telegram message ID from user message link or text.  
     - Validates emojis against allowed list.  
     - Handles duplicates and replaces invalid emojis.  
     - Rotates among an array of bot tokens (replace the hardcoded tokens with your own).  
     - Sets your channel ID in the `chatId` variable.  
     - Throws error if message ID missing.  
   - Connect from "Message a model".

4. **Create Code Node ("Debugging"):**  
   - Type: code  
   - Code logs total number of reactions and details (emoji, chatId, messageId, partial bot token).  
   - Connect from "Code Prep".

5. **Create SplitInBatches Node ("Loop Over Items"):**  
   - Type: splitInBatches  
   - Batch size: 1 (default) to process one reaction at a time.  
   - Connect from "Debugging".

6. **Create Limit Node:**  
   - Type: limit  
   - Use default settings to control throughput (adjust if necessary).  
   - Connect from "Loop Over Items".

7. **Create Wait Node:**  
   - Type: wait  
   - Optional: set delay to avoid hitting Telegram API rate limits (e.g., 1000ms).  
   - Connect from "Limit".

8. **Create Telegram Node ("Reply 'all done' message"):**  
   - Type: telegram  
   - Text: "All done!"  
   - Chat ID: Use expression to get original chat ID `={{ $('Telegram Chat Trigger').item.json.message.chat.id }}`.  
   - Configure Telegram API credentials (can be same or different bot).  
   - Connect from "Wait".

9. **Create HTTP Request Node:**  
   - Type: httpRequest  
   - Method: POST  
   - URL: `https://api.telegram.org/bot{{ $json.botToken }}/setMessageReaction` (use expression to inject bot token from current item).  
   - Body (JSON):  
     ```json
     {
       "chat_id": "{{ $json.chatId }}",
       "message_id": {{ $json.messageId }},
       "reaction": [
         {
           "type": "emoji",
           "emoji": "{{ $json.emoji }}"
         }
       ]
     }
     ```  
   - Send body as JSON.  
   - Connect from "Loop Over Items" (parallel path, see note below).

10. **Wire connections:**  
    - From "Loop Over Items" main output to both "Limit" and "HTTP Request".  
    - From "Limit" to "Wait".  
    - From "Wait" to "Reply 'all done' message".  
    - From "HTTP Request" back to "Loop Over Items" to continue processing next item.

11. **Add Sticky Notes (optional):**  
    - Add descriptive sticky notes at each logical block for documentation and future maintenance.

12. **Credentials Setup:**  
    - Telegram API: Obtain and configure tokens for all bots involved (reaction bots and confirmation bot).  
    - OpenAI API: Set API key for GPT-5-mini model access.

13. **Update Code Node:**  
    - Replace `chatId` with your Telegram target channel ID (e.g., `-1001234567890`).  
    - Replace botTokens array with your own Telegram bot tokens authorized for the channel.

14. **Test Workflow:**  
    - Send a Telegram message to your bot with a request like "https://t.me/channelname/123 needs 5 fire reactions".  
    - Verify that reactions are added to the message and you receive "All done!" confirmation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                             |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| To get the ID of a Telegram channel, add a bot like @userinfobot or @getmy_idbot to the channel and forward a channel message to the bot. It will reply with the channel's numeric ID (e.g., -1001234567890). Forwarding must be allowed for private channels.                                                                                                        | Telegram channel ID retrieval tip (Sticky Note - Overview)                                 |
| The workflow uses the new Telegram API method `setMessageReaction` which requires bots to be administrators in the channel with permission to manage messages. Ensure all reaction bots are added and authorized accordingly.                                                                                                                                          | Telegram API permissions requirement                                                      |
| GPT-5-mini model is a fictional or upcoming model referenced here for advanced NLP parsing. Replace with the closest available OpenAI model if needed.                                                                                                                                                                                                             | AI model selection note                                                                   |
| The workflow handles rate limits by processing reactions sequentially with Limit and Wait nodes. Adjust wait times if you experience rate limiting errors.                                                                                                                                                                                                       | Rate limiting advice (Sticky Note - Rate Limit)                                           |
| Emoji aliases are pre-defined and handled via AI prompt instructions for intuitive user requests (e.g., "fire" maps to "🔥"). The JavaScript code validates and replaces invalid emojis to avoid API errors.                                                                                                                                                        | Emoji aliasing and validation details (Sticky Note - AI and Processing)                    |
| If you want to add more bots for reaction rotation, update the `botTokens` array in the Code Prep node accordingly. Make sure all bots are properly configured with Telegram and have necessary permissions.                                                                                                                                                          | Bot token rotation customization                                                          |
| For troubleshooting, enable the Debugging node console logs or add additional logging as needed.                                                                                                                                                                                                                                                                  | Debugging recommendation (Sticky Note - Debug)                                           |
| The workflow assumes the user provides either a Telegram message link or a textual message/post number. If the message ID cannot be extracted, the workflow throws a clear error prompting correct input format.                                                                                                                                                    | Input validation and error handling                                                       |

---

**Disclaimer:** The provided workflow exclusively automates Telegram reactions using n8n, respecting all platform policies and legal constraints. All data and tokens used must be authorized and legally obtained.

---