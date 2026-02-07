Allow Users to Send a Sequence of Messages to an AI Agent in Telegram

https://n8nworkflows.xyz/workflows/allow-users-to-send-a-sequence-of-messages-to-an-ai-agent-in-telegram-2917


# Allow Users to Send a Sequence of Messages to an AI Agent in Telegram

### 1. Workflow Overview

This workflow enables a Telegram chatbot to handle multiple short messages sent in quick succession by a user as a single coherent conversation. Instead of responding to each message individually, the workflow buffers incoming messages, aggregates them after a short wait period, processes them together through an AI agent, and sends back one unified reply.

The workflow is logically divided into four main blocks:

- **1.1 Receive Message:** Captures incoming Telegram messages via webhook trigger.
- **1.2 Buffer Incoming Messages:** Stores messages temporarily in a Supabase PostgreSQL table and waits to collect additional messages.
- **1.3 Process Aggregated Messages with AI Assistant:** Retrieves queued messages, sorts and aggregates them, then sends the combined text to an AI agent for response generation.
- **1.4 Send Reply:** Sends the AI-generated unified reply back to the user via Telegram and clears the message queue.

---

### 2. Block-by-Block Analysis

#### 1.1 Receive Message

- **Overview:**  
  This block listens for incoming Telegram messages using a webhook trigger and initiates the workflow for each message received.

- **Nodes Involved:**  
  - Receive Message

- **Node Details:**

  - **Receive Message**  
    - Type: Telegram Trigger  
    - Role: Listens for new Telegram messages (update type "message") to start the workflow.  
    - Configuration: Uses Telegram API credentials; listens for "message" updates only.  
    - Expressions: None.  
    - Input: External Telegram webhook event.  
    - Output: Emits the incoming message JSON, including chat and user details.  
    - Edge Cases: Possible webhook connectivity issues, Telegram API rate limits, malformed messages.  
    - Sub-workflow: None.

---

#### 1.2 Buffer Incoming Messages

- **Overview:**  
  This block stores each incoming message in a Supabase PostgreSQL table (`message_queue`) keyed by user ID, then waits 10 seconds to buffer any additional messages from the same user before processing.

- **Nodes Involved:**  
  - Add to Queued Messages  
  - Wait 10 Seconds  
  - Get Queued Messages  
  - Sort by Message ID  
  - Check Most Recent Message  
  - No Operation, do nothing (conditional fallback)

- **Node Details:**

  - **Add to Queued Messages**  
    - Type: Supabase Node  
    - Role: Inserts the incoming message into the `message_queue` table with fields: `user_id`, `message`, and `message_id`.  
    - Configuration: Maps Telegram message chat ID to `user_id`, message text to `message`, and Telegram message ID to `message_id`.  
    - Expressions: `={{ $json.message.chat.id }}`, `={{ $json.message.text }}`, `={{ $json.message.message_id }}`.  
    - Input: Output of "Receive Message".  
    - Output: Confirmation of database insert.  
    - Edge Cases: Database connectivity issues, duplicate message IDs, invalid data types.  
    - Sub-workflow: None.

  - **Wait 10 Seconds**  
    - Type: Wait Node  
    - Role: Pauses workflow execution for 10 seconds to allow additional messages to arrive.  
    - Configuration: Fixed wait time of 10 seconds (modifiable).  
    - Input: Output of "Add to Queued Messages".  
    - Output: Passes data forward after delay.  
    - Edge Cases: Workflow timeout, unexpected interruptions.  
    - Sub-workflow: None.

  - **Get Queued Messages**  
    - Type: Supabase Node  
    - Role: Retrieves all queued messages for the user from `message_queue` table.  
    - Configuration: Filters by `user_id` equal to the Telegram message sender's ID.  
    - Expressions: `={{ $('Receive Message').item.json.message.from.id }}` for user ID filter.  
    - Input: Output of "Wait 10 Seconds".  
    - Output: Array of queued messages for the user.  
    - Edge Cases: Empty result sets, database errors.  
    - Sub-workflow: None.

  - **Sort by Message ID**  
    - Type: Sort Node  
    - Role: Sorts retrieved messages by their `message_id` in ascending order to preserve message sequence.  
    - Configuration: Sort field set to `message_id`.  
    - Input: Output of "Get Queued Messages".  
    - Output: Sorted list of messages.  
    - Edge Cases: Missing or duplicate message IDs.  
    - Sub-workflow: None.

  - **Check Most Recent Message**  
    - Type: If Node  
    - Role: Checks if the last message in the sorted list matches the current incoming message ID to ensure processing only after the latest message is received.  
    - Configuration: Compares last element's `message_id` to the current message's `message_id`.  
    - Expressions:  
      - Left: `={{ $input.last().json.message_id }}`  
      - Right: `={{ $('Receive Message').item.json.message.message_id }}`  
    - Input: Output of "Sort by Message ID".  
    - Output:  
      - True branch: Proceed to delete queued messages and aggregate.  
      - False branch: No operation (do nothing).  
    - Edge Cases: Race conditions if messages arrive out of order, message ID mismatches.  
    - Sub-workflow: None.

  - **No Operation, do nothing**  
    - Type: NoOp Node  
    - Role: Placeholder to explicitly do nothing if the condition fails.  
    - Input: False branch of "Check Most Recent Message".  
    - Output: None.  
    - Edge Cases: None.  
    - Sub-workflow: None.

---

#### 1.3 Process Aggregated Messages with AI Assistant

- **Overview:**  
  After confirming all messages are received, this block deletes the queued messages from the database, aggregates the text, and sends the combined conversation to an AI agent with chat memory for response generation.

- **Nodes Involved:**  
  - Delete Queued Messages  
  - Aggregate  
  - AI Agent  
  - OpenAI Chat Model  
  - Postgres Chat Memory

- **Node Details:**

  - **Delete Queued Messages**  
    - Type: Supabase Node  
    - Role: Deletes all messages for the user from the `message_queue` table to clear the queue after processing.  
    - Configuration: Filter by `user_id` equal to the current user's ID.  
    - Expressions: `={{ $json.user_id }}` from previous node context.  
    - Input: True branch of "Check Most Recent Message".  
    - Output: Confirmation of deletion.  
    - Edge Cases: Database errors, partial deletions.  
    - Sub-workflow: None.

  - **Aggregate**  
    - Type: Aggregate Node  
    - Role: Combines all messages into a single array of message texts for the AI agent.  
    - Configuration: Aggregates the `message` field from the input data.  
    - Input: Output of "Delete Queued Messages".  
    - Output: Aggregated array of message strings.  
    - Edge Cases: Empty input arrays, aggregation failures.  
    - Sub-workflow: None.

  - **AI Agent**  
    - Type: LangChain Agent Node  
    - Role: Processes the aggregated messages as a single conversation, using chat memory and an OpenAI language model to generate a unified response.  
    - Configuration:  
      - Input text: Joined array of messages separated by newline characters.  
      - Prompt type: "define" (custom prompt).  
      - Connected to: OpenAI Chat Model (language model) and Postgres Chat Memory (memory backend).  
    - Expressions: `={{ $json.message.join(String.fromCharCode(10)) }}` to join messages with line breaks.  
    - Input: Output of "Aggregate".  
    - Output: AI-generated response text.  
    - Edge Cases: API rate limits, model errors, memory retrieval issues.  
    - Sub-workflow: None.

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Model Node  
    - Role: Provides the GPT-4o-mini language model for the AI Agent.  
    - Configuration: Model set to "gpt-4o-mini".  
    - Credentials: OpenAI API credentials required.  
    - Input: Connected as AI language model input to "AI Agent".  
    - Output: Language model responses.  
    - Edge Cases: API key expiration, quota limits, network errors.  
    - Sub-workflow: None.

  - **Postgres Chat Memory**  
    - Type: LangChain Postgres Chat Memory Node  
    - Role: Maintains chat session memory in a PostgreSQL database keyed by Telegram chat ID.  
    - Configuration:  
      - Session key: Telegram chat ID from incoming message.  
      - Session ID type: Custom key.  
    - Credentials: PostgreSQL credentials (Supabase session pooler).  
    - Input: Connected as AI memory input to "AI Agent".  
    - Output: Provides chat history context.  
    - Edge Cases: Database connectivity, session key collisions.  
    - Sub-workflow: None.

---

#### 1.4 Send Reply

- **Overview:**  
  Sends the AI-generated unified reply back to the Telegram user in the original chat.

- **Nodes Involved:**  
  - Reply

- **Node Details:**

  - **Reply**  
    - Type: Telegram Node  
    - Role: Sends a text message reply to the Telegram chat.  
    - Configuration:  
      - Text: AI Agent output (`={{ $json.output }}`).  
      - Chat ID: Extracted from the original incoming message (`={{ $('Receive Message').item.json.message.chat.id }}`).  
      - Additional fields: Attribution disabled.  
    - Credentials: Telegram API credentials.  
    - Input: Output of "AI Agent".  
    - Output: Confirmation of message sent.  
    - Edge Cases: Telegram API errors, chat ID invalid, message length limits.  
    - Sub-workflow: None.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                          | Input Node(s)           | Output Node(s)          | Sticky Note                                                                                   |
|-------------------------|----------------------------------|----------------------------------------|------------------------|------------------------|-----------------------------------------------------------------------------------------------|
| Receive Message         | Telegram Trigger                 | Receives incoming Telegram messages    | (Webhook)              | Add to Queued Messages  | ## 1. Receive Message                                                                         |
| Add to Queued Messages  | Supabase                        | Stores incoming messages in Supabase   | Receive Message        | Wait 10 Seconds        | ## 2. Buffer Incoming Messages                                                                |
| Wait 10 Seconds         | Wait                           | Waits 10 seconds to buffer messages    | Add to Queued Messages | Get Queued Messages    | ### Modification: Change the value of *Wait Amount* to vary the buffering window              |
| Get Queued Messages     | Supabase                        | Retrieves all queued messages for user | Wait 10 Seconds        | Sort by Message ID     | ## 2. Buffer Incoming Messages                                                                |
| Sort by Message ID      | Sort                           | Sorts messages by message_id ascending | Get Queued Messages    | Check Most Recent Message | ## 2. Buffer Incoming Messages                                                                |
| Check Most Recent Message | If                            | Checks if last message is the current one | Sort by Message ID     | Delete Queued Messages, No Operation, do nothing | ## 2. Buffer Incoming Messages                                                                |
| No Operation, do nothing | NoOp                          | Does nothing if condition fails        | Check Most Recent Message (False) | -                      | ## 2. Buffer Incoming Messages                                                                |
| Delete Queued Messages  | Supabase                        | Deletes all queued messages for user   | Check Most Recent Message (True) | Aggregate              | ## 3. AI Assistant                                                                           |
| Aggregate               | Aggregate                      | Aggregates messages into array          | Delete Queued Messages | AI Agent               | ## 3. AI Assistant                                                                           |
| AI Agent                | LangChain Agent                | Processes combined messages with AI    | Aggregate, OpenAI Chat Model, Postgres Chat Memory | Reply                  | ## 3. AI Assistant                                                                           |
| OpenAI Chat Model       | LangChain OpenAI Model         | Provides GPT-4o-mini language model    | -                      | AI Agent               | ### Modification: Replace this sub-node to use a different language model                     |
| Postgres Chat Memory    | LangChain Postgres Memory      | Maintains chat session memory          | -                      | AI Agent               | ### Modification: Add a **System Message** to tailor the chatbot to your use case             |
| Reply                   | Telegram                       | Sends AI response back to Telegram chat | AI Agent               | -                      | ## 4. Send Reply                                                                             |
| Sticky Note             | Sticky Note                   | Notes and documentation                 | -                      | -                      | ## 1. Receive Message                                                                         |
| Sticky Note1            | Sticky Note                   | Notes and documentation                 | -                      | -                      | ## 3. AI Assistant                                                                           |
| Sticky Note2            | Sticky Note                   | Notes and documentation                 | -                      | -                      | ## 4. Send Reply                                                                             |
| Sticky Note3            | Sticky Note                   | Notes and documentation                 | -                      | -                      | ## 2. Buffer Incoming Messages                                                                |
| Sticky Note4            | Sticky Note                   | Workflow description and use case       | -                      | -                      | Allow Users to Send a Sequence of Messages to an AI Agent in Telegram with Supabase           |
| Sticky Note5            | Sticky Note                   | Setup instructions                      | -                      | -                      | Setup instructions for Supabase table and credentials                                        |
| Sticky Note6            | Sticky Note                   | Modification instructions               | -                      | -                      | Change the value of *Wait Amount* to vary the buffering window                               |
| Sticky Note8            | Sticky Note                   | Modification instructions               | -                      | -                      | Replace this sub-node to use a different language model                                     |
| Sticky Note9            | Sticky Note                   | Modification instructions               | -                      | -                      | Add a **System Message** to tailor the chatbot to your use case                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Name: Receive Message  
   - Type: Telegram Trigger  
   - Configure with Telegram API credentials.  
   - Set to listen for "message" updates only.

2. **Create Supabase Node to Insert Messages**  
   - Name: Add to Queued Messages  
   - Type: Supabase  
   - Configure with Supabase credentials.  
   - Set operation to insert into table `message_queue`.  
   - Map fields:  
     - `user_id` = `{{$json.message.chat.id}}`  
     - `message` = `{{$json.message.text}}`  
     - `message_id` = `{{$json.message.message_id}}`  
   - Connect input from "Receive Message".

3. **Create Wait Node**  
   - Name: Wait 10 Seconds  
   - Type: Wait  
   - Set wait time to 10 seconds (modifiable).  
   - Connect input from "Add to Queued Messages".

4. **Create Supabase Node to Retrieve Messages**  
   - Name: Get Queued Messages  
   - Type: Supabase  
   - Configure with Supabase credentials.  
   - Set operation to get all from `message_queue` table.  
   - Filter: `user_id` equals `{{$('Receive Message').item.json.message.from.id}}`.  
   - Connect input from "Wait 10 Seconds".

5. **Create Sort Node**  
   - Name: Sort by Message ID  
   - Type: Sort  
   - Sort field: `message_id` ascending.  
   - Connect input from "Get Queued Messages".

6. **Create If Node to Check Most Recent Message**  
   - Name: Check Most Recent Message  
   - Type: If  
   - Condition: Check if last element's `message_id` equals current message's `message_id`:  
     - Left: `{{$input.last().json.message_id}}`  
     - Right: `{{$('Receive Message').item.json.message.message_id}}`  
   - Connect input from "Sort by Message ID".

7. **Create Supabase Node to Delete Messages**  
   - Name: Delete Queued Messages  
   - Type: Supabase  
   - Configure with Supabase credentials.  
   - Set operation to delete from `message_queue` table.  
   - Filter: `user_id` equals `{{$json.user_id}}`.  
   - Connect input from True branch of "Check Most Recent Message".

8. **Create Aggregate Node**  
   - Name: Aggregate  
   - Type: Aggregate  
   - Aggregate field: `message` (collect all messages into an array).  
   - Connect input from "Delete Queued Messages".

9. **Create LangChain Postgres Chat Memory Node**  
   - Name: Postgres Chat Memory  
   - Type: LangChain Postgres Chat Memory  
   - Configure with PostgreSQL credentials (Supabase session pooler).  
   - Set session key to `{{$('Receive Message').item.json.message.chat.id}}`.  
   - Session ID type: Custom key.

10. **Create LangChain OpenAI Chat Model Node**  
    - Name: OpenAI Chat Model  
    - Type: LangChain OpenAI Chat Model  
    - Configure with OpenAI API credentials.  
    - Set model to `gpt-4o-mini` (or replace as needed).

11. **Create LangChain Agent Node**  
    - Name: AI Agent  
    - Type: LangChain Agent  
    - Input text: Join aggregated messages with newline: `{{$json.message.join(String.fromCharCode(10))}}`.  
    - Prompt type: Define (custom prompt).  
    - Connect AI language model input from "OpenAI Chat Model".  
    - Connect AI memory input from "Postgres Chat Memory".  
    - Connect input from "Aggregate".

12. **Create Telegram Node to Send Reply**  
    - Name: Reply  
    - Type: Telegram  
    - Configure with Telegram API credentials.  
    - Text: `{{$json.output}}` (AI Agent output).  
    - Chat ID: `{{$('Receive Message').item.json.message.chat.id}}`.  
    - Disable attribution.  
    - Connect input from "AI Agent".

13. **Create No Operation Node**  
    - Name: No Operation, do nothing  
    - Type: NoOp  
    - Connect input from False branch of "Check Most Recent Message".

14. **Connect Workflow Nodes**  
    - Connect "Receive Message" → "Add to Queued Messages" → "Wait 10 Seconds" → "Get Queued Messages" → "Sort by Message ID" → "Check Most Recent Message".  
    - From "Check Most Recent Message" True branch → "Delete Queued Messages" → "Aggregate" → "AI Agent" → "Reply".  
    - From "Check Most Recent Message" False branch → "No Operation, do nothing".

15. **Create Supabase Table**  
    - Table name: `message_queue`  
    - Columns:  
      - `user_id` (uint8)  
      - `message` (text)  
      - `message_id` (uint8)

16. **Activate Workflow**  
    - Ensure all credentials (Telegram, Supabase, OpenAI, PostgreSQL) are configured and tested.  
    - Activate the workflow.  
    - Test by sending multiple short messages to the Telegram bot in quick succession.  
    - After 10 seconds of inactivity, receive a single combined AI-generated reply.

---

### 5. General Notes & Resources

| Note Content                                                                                                                  | Context or Link                                                                                      |
|-------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| When creating chatbots for Telegram or WhatsApp, users often send multiple short messages instead of one long message. This workflow buffers and aggregates these messages for coherent AI responses. | Workflow purpose and use case description.                                                         |
| To modify the buffering window, change the "Wait Amount" parameter in the "Wait 10 Seconds" node.                              | See Sticky Note6 near "Wait 10 Seconds" node.                                                      |
| To tailor the chatbot personality or behavior, add a System Message in the AI Agent node configuration.                        | See Sticky Note9 near "AI Agent" node.                                                             |
| Replace the OpenAI Chat Model node to use a different language model if desired.                                                | See Sticky Note8 near "OpenAI Chat Model" node.                                                    |
| Supabase table `message_queue` must be created with columns: `user_id` (uint8), `message` (text), and `message_id` (uint8).    | Setup instructions in Sticky Note5.                                                                |
| Credentials required: Telegram API, Supabase API, OpenAI API, PostgreSQL (for chat memory).                                    | Setup instructions in Sticky Note5.                                                                |
| The workflow uses LangChain nodes for AI processing and memory management, enabling advanced conversational AI capabilities.  | Node types: LangChain Agent, LangChain OpenAI Chat Model, LangChain Postgres Chat Memory.           |

---

This documentation provides a full, structured reference to understand, reproduce, and modify the Telegram message buffering workflow with AI integration using n8n.