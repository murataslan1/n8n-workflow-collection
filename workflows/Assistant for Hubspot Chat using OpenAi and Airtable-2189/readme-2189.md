Assistant for Hubspot Chat using OpenAi and Airtable

https://n8nworkflows.xyz/workflows/assistant-for-hubspot-chat-using-openai-and-airtable-2189


# Assistant for Hubspot Chat using OpenAi and Airtable

### 1. Workflow Overview

This workflow enables integration between Hubspot Chat messages and the OpenAI Assistant API, facilitating automated chat responses powered by AI. It is designed primarily for Hubspot but can be adapted to other chat platforms by replacing Hubspot-specific nodes. The workflow supports message retrieval, thread management, AI conversation handling, function execution based on AI instructions, and response posting back to Hubspot.

**Logical Blocks:**

- **1.1 Input Reception and Message Validation:** Receives incoming chat messages from Hubspot via webhook, filters out messages sent by the assistant itself to avoid loops.
- **1.2 Thread Management and Database Synchronization:** Checks if a conversation thread exists in Airtable linking Hubspot thread IDs to OpenAI thread IDs; creates new OpenAI threads if none exist.
- **1.3 OpenAI Assistant Interaction:** Sends user messages to OpenAI Assistant threads, initiates runs, polls for completion, and retrieves assistant responses.
- **1.4 Action Handling and Tool Execution:** Based on assistant response, executes required functions (e.g., external API calls), submits outputs back to Assistant, and waits for further processing.
- **1.5 Posting Responses to Hubspot Chat:** Posts AI-generated or function-derived messages back to Hubspot to appear in the chat.
- **1.6 Wait and Polling Logic:** Implements wait nodes to periodically check OpenAI run statuses and handle asynchronous processing.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Message Validation

**Overview:**  
This block captures new incoming messages from Hubspot chat via a webhook, retrieves the full message details from Hubspot, and filters out messages originating from the assistant itself to prevent message loops.

**Nodes Involved:**  
- Webhook  
- IF2  
- getHubspotMessage  
- IF  

**Node Details:**

- **Webhook**  
  - *Type:* Webhook  
  - *Role:* Entry point to receive POST requests from Hubspot chat messages.  
  - *Configuration:* HTTP POST on path `hubspot-tinder`.  
  - *Input:* Incoming JSON payload from Hubspot chat.  
  - *Output:* Passes data to IF2 node.  
  - *Edge Cases:* Missing or malformed payload; unauthorized requests (should be protected externally).  
  - *Notes:* Sticky Note1 explains this node watches for new chat messages and can be adapted for other chat services.  

- **IF2**  
  - *Type:* If (conditional)  
  - *Role:* Checks if the incoming payload contains a non-empty `messageId` to confirm a valid message.  
  - *Configuration:* Condition checks if `body[0].messageId` is not empty.  
  - *Input:* Webhook output.  
  - *Output:* If true, proceeds to `getHubspotMessage`; else stops.  
  - *Edge Cases:* Empty or missing messageId leads to no further processing.  

- **getHubspotMessage**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves full message details from Hubspot API using thread and message IDs from the webhook payload.  
  - *Configuration:* GET request to `https://api.hubapi.com/conversations/v3/conversations/threads/{{objectId}}/messages/{{messageId}}` with Hubspot App Token authentication.  
  - *Input:* IF2 output providing IDs.  
  - *Output:* Detailed message JSON forwarded to IF node.  
  - *Edge Cases:* API failures, invalid or expired token, network issues.  
  - *Notes:* Requires Hubspot App Token credential.  

- **IF**  
  - *Type:* If (conditional)  
  - *Role:* Filters out messages sent by the assistant user itself (actorId `A-5721819`) to avoid processing own messages.  
  - *Configuration:* Checks if `senders[0].actorId` is not equal to `A-5721819`.  
  - *Input:* Output from `getHubspotMessage`.  
  - *Output:* If true (message from user), proceeds to next block; else stops.  
  - *Edge Cases:* Messages without sender info or malformed data may cause expression errors.  
  - *Notes:* Sticky Note3 emphasizes this user filter to prevent duplication.

---

#### 1.2 Thread Management and Database Synchronization

**Overview:**  
This block ensures each Hubspot conversation thread is linked to an OpenAI thread. It searches Airtable for existing mappings, creates new OpenAI threads if none exist, and records the mapping in Airtable.

**Nodes Involved:**  
- Airtable (search)  
- IF1  
- OpenAi Create Thread  
- createThread  

**Node Details:**

- **Airtable**  
  - *Type:* Airtable node  
  - *Role:* Searches the Airtable base/table for a record matching the Hubspot Thread ID.  
  - *Configuration:* Search formula: `{Hubspot Thread ID}="{{conversationsThreadId}}"`  
  - *Input:* Messages passing the user filter IF node.  
  - *Output:* Airtable record(s) or empty if not found.  
  - *Edge Cases:* Airtable API limits, wrong base/table ID, network failure.  
  - *Notes:* Sticky Note6 explains this database maintains thread ID mappings.  

- **IF1**  
  - *Type:* If  
  - *Role:* Determines if Airtable search found a record by checking if `id` is empty.  
  - *Input:* Airtable output.  
  - *Output:*  
    - If empty: proceeds to create new OpenAI thread.  
    - If record found: proceeds to OpenAI assistant interaction.  
  - *Edge Cases:* Missing Airtable response or malformed data.  

- **OpenAi Create Thread**  
  - *Type:* HTTP Request  
  - *Role:* Creates a new OpenAI thread with the initial user message content.  
  - *Configuration:* POST to `https://api.openai.com/v1/threads` with body containing user message text from `getHubspotMessage`. Uses OpenAI API key.  
  - *Input:* IF1 output (empty Airtable record).  
  - *Output:* New OpenAI thread details (including thread ID).  
  - *Edge Cases:* OpenAI API errors, invalid keys, rate limits.  
  - *Notes:* Sticky Note4 describes creation of new thread and saving to database.  

- **createThread**  
  - *Type:* Airtable node  
  - *Role:* Creates a new record in Airtable mapping the Hubspot Thread ID to the newly created OpenAI Thread ID.  
  - *Configuration:* Creates record with fields: `Hubspot Thread ID` and `OpenAI Thread ID` from OpenAi Create Thread output and Hubspot message.  
  - *Input:* OpenAi Create Thread output.  
  - *Output:* Confirmation of Airtable record creation.  
  - *Edge Cases:* Airtable API failures, permission issues.  

---

#### 1.3 OpenAI Assistant Interaction

**Overview:**  
This block manages sending messages to the OpenAI assistant thread, initiating run requests, polling run status, and retrieving assistant responses.

**Nodes Involved:**  
- OpenAI  
- OpenAI Run  
- OpenAI Run1  
- Get Run  
- Completed, Action or Inprogress  
- Get Last Message  
- Wait  
- Wait1  
- Wait2  
- Wait3  

**Node Details:**

- **OpenAI**  
  - *Type:* LangChain OpenAI node  
  - *Role:* Sends user text to the OpenAI assistant in the given thread.  
  - *Configuration:* Uses assistant ID `asst_wVbEcnRttQ8K65DOV0fk1DJU`, sends user text from `getHubspotMessage`.  
  - *Input:* IF1 output when Airtable record exists (i.e., existing thread).  
  - *Output:* Initiates a run with OpenAI.  
  - *Edge Cases:* API errors, invalid assistant ID.  

- **OpenAI Run** and **OpenAI Run1**  
  - *Type:* HTTP Request  
  - *Role:* Starts a run for the OpenAI thread using assistant ID `asst_MA71Jq0SElVpdjmJa212CTFd`.  
  - *Configuration:* POST to `https://api.openai.com/v1/threads/{thread_id}/runs`.  
  - *Input:*  
    - `OpenAI Run`: triggered after creating thread.  
    - `OpenAI Run1`: triggered after sending message to existing thread.  
  - *Output:* Run details including run ID.  
  - *Edge Cases:* API errors, rate limits.  
  - *Note:* `OpenAI Run1` has `continueOnFail` set true to handle errors gracefully.  

- **Get Run**  
  - *Type:* HTTP Request  
  - *Role:* Polls the status of the run using run ID and thread ID.  
  - *Configuration:* GET request to `https://api.openai.com/v1/threads/{thread_id}/runs/{run_id}`.  
  - *Input:* Output from `OpenAI Run` or `OpenAI Run1`.  
  - *Output:* Run status and data.  
  - *Edge Cases:* API timeout, invalid IDs.  
  - *Note:* Always outputs data to continue workflow.  

- **Completed, Action or Inprogress**  
  - *Type:* Switch  
  - *Role:* Directs flow based on run status (`completed`, `requires_action`, `in_progress`, `queued`).  
  - *Configuration:* Checks `status` field of run JSON.  
  - *Input:* `Get Run` output.  
  - *Output:*  
    - `completed`: proceeds to get last assistant message.  
    - `requires_action`: branches to function execution.  
    - `in_progress` or `queued`: triggers wait nodes for polling.  
  - *Notes:* Sticky Note8 summarizes this status check and branching logic.  

- **Get Last Message**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves last message(s) from the assistant thread after completion.  
  - *Configuration:* GET request to `https://api.openai.com/v1/threads/{thread_id}/messages`.  
  - *Input:* `Completed, Action or Inprogress` node.  
  - *Output:* Assistant reply messages.  
  - *Edge Cases:* API failure or empty messages.  

- **Wait, Wait1, Wait2, Wait3**  
  - *Type:* Wait  
  - *Role:* Delays execution between polls to avoid excessive API calls while waiting for run completion or required actions.  
  - *Configuration:* Waits are configured with webhook IDs for asynchronous wake-up.  
  - *Input:* Various nodes based on run status.  
  - *Output:* Triggers `Get Run` for next poll cycle.  
  - *Edge Cases:* Long waits may cause timeout or disconnection issues.  

---

#### 1.4 Action Handling and Tool Execution

**Overview:**  
When the assistant requests an action, this block executes the specified function by calling external APIs, submits the output back to the assistant, and manages waiting cycles.

**Nodes Involved:**  
- Select Function  
- HTTP Request  
- HTTP Request1  
- Code  
- Code1  
- Submit Data  
- Submit Data1  
- Wait1  
- Wait2  
- Wait3  

**Node Details:**

- **Select Function**  
  - *Type:* Switch  
  - *Role:* Routes execution based on the assistant's requested function name (e.g., `getAWBbyOrder`, `get_awb_history`).  
  - *Configuration:* Checks `required_action.submit_tool_outputs.tool_calls[0].function.name`.  
  - *Input:* Output from `Completed, Action or Inprogress` node when status is `requires_action`.  
  - *Output:* Branches to different HTTP Request nodes.  
  - *Notes:* Sticky Note9 explains handling of required actions by function routing.  

- **HTTP Request**  
  - *Type:* HTTP Request  
  - *Role:* Calls external API endpoint `https://www.listafirme.ro/api/search-v1.asp` with parameters from assistant function arguments.  
  - *Configuration:* Passes API key and `src` parameter extracted from assistant arguments JSON.  
  - *Input:* Output from `Select Function` when function name is `getAWBbyOrder`.  
  - *Output:* API response passed to `Code1`.  
  - *Edge Cases:* API errors, invalid parameters, network failures.  

- **HTTP Request1**  
  - *Type:* HTTP Request  
  - *Role:* Calls external API endpoint `https://www.listafirme.ro/api/info-v1.asp` with detailed JSON data from assistant function arguments.  
  - *Configuration:* Sends a JSON-encoded string including TaxCode and other fields.  
  - *Input:* Output from `Select Function` when function name is `get_awb_history`.  
  - *Output:* API response passed to `Code`.  
  - *Edge Cases:* Same as above.  

- **Code** and **Code1**  
  - *Type:* Code (JavaScript)  
  - *Role:* Converts JSON response into a string and escapes quotes to safely submit back to OpenAI.  
  - *Configuration:* Uses `JSON.stringify` and regex replace to escape double quotes.  
  - *Input:* HTTP Request or HTTP Request1 output.  
  - *Output:* Object with escaped JSON string.  
  - *Edge Cases:* Invalid JSON or empty response could cause errors.  

- **Submit Data** and **Submit Data1**  
  - *Type:* HTTP Request  
  - *Role:* Submits the function's output back to OpenAI Assistant via `submit_tool_outputs` endpoint, providing the escaped JSON string.  
  - *Configuration:* POST to `https://api.openai.com/v1/threads/{thread_id}/runs/{run_id}/submit_tool_outputs` with tool call ID and output string.  
  - *Input:* Code or Code1 output along with function call metadata.  
  - *Output:* Confirmation of submission, continues wait cycle.  
  - *Edge Cases:* API errors, invalid tokens, malformed payloads.  

- **Wait1, Wait2, Wait3**  
  - *Role:* Wait nodes with webhook IDs to delay and poll again after submitting output.  
  - *Configuration:* Wait times set to avoid rate limits and allow processing.  
  - *Input:* Submit Data or Submit Data1 output.  
  - *Output:* Trigger `Get Run` for next status check.  

---

#### 1.5 Posting Responses to Hubspot Chat

**Overview:**  
After the assistant finishes processing, this block sends the AI-generated message back to the Hubspot chat thread.

**Nodes Involved:**  
- respondHubspotMessage1  

**Node Details:**

- **respondHubspotMessage1**  
  - *Type:* HTTP Request  
  - *Role:* Posts the assistant's response message back to the Hubspot conversation thread.  
  - *Configuration:* POST to `https://api.hubapi.com/conversations/v3/conversations/threads/{thread_id}/messages` with message content, sender ID, channel ID, and account ID.  
  - *Input:* Output of `Get Last Message` providing the assistant's text content.  
  - *Output:* Confirmation that message is posted in Hubspot chat.  
  - *Edge Cases:* API authentication errors, invalid IDs, network issues.  
  - *Notes:* Sticky Note describes this node's role in posting the assistant message back.  

---

### 3. Summary Table

| Node Name               | Node Type                 | Functional Role                                | Input Node(s)                       | Output Node(s)                | Sticky Note                                                                                                      |
|-------------------------|---------------------------|-----------------------------------------------|-----------------------------------|------------------------------|------------------------------------------------------------------------------------------------------------------|
| Webhook                 | Webhook                   | Entry point for Hubspot chat messages          | -                                 | IF2                          | Watch for new message on the chatbot. This can be triggered with [n8n chat widget](https://www.npmjs.com/package/@n8n/chat), hubspot or other chat services. |
| IF2                     | If                        | Checks messageId presence                       | Webhook                           | getHubspotMessage             |                                                                                                                  |
| getHubspotMessage       | HTTP Request              | Retrieves full Hubspot message details          | IF2                              | IF                           |                                                                                                                  |
| IF                      | If                        | Filters out messages sent by assistant itself   | getHubspotMessage                | Airtable                     | UPDATE USER FILTER FOR DUPLICATION                                                                               |
| Airtable                | Airtable                  | Searches for thread mapping in database         | IF                               | IF1                          | Search for Thread ID in a database. This database is maintaining references between messaging service thread id and OpenI Thread ID.                    |
| IF1                     | If                        | Determines if thread mapping exists              | Airtable                         | OpenAi Create Thread, OpenAI |                                                                                                                  |
| OpenAi Create Thread    | HTTP Request              | Creates new OpenAI thread for new conversations | IF1                             | createThread                 | Create a new Thread, save it to database and RUN                                                                |
| createThread            | Airtable                  | Saves new thread mapping in database             | OpenAi Create Thread             | OpenAI Run                   |                                                                                                                  |
| OpenAI                  | LangChain OpenAI          | Sends message to existing OpenAI thread          | IF1 (existing record)            | OpenAI Run1                  |                                                                                                                  |
| OpenAI Run              | HTTP Request              | Starts OpenAI run for new thread                  | createThread                    | Get Run                     |                                                                                                                  |
| OpenAI Run1             | HTTP Request              | Starts OpenAI run for existing thread             | OpenAI                         | Get Run                     |                                                                                                                  |
| Get Run                 | HTTP Request              | Polls OpenAI run status                            | OpenAI Run, OpenAI Run1, Waits  | Completed, Action or Inprogress| Get Run Status: If still in progress, run again. If action needed go to respective action. If Completed, post message. |
| Completed, Action or Inprogress | Switch              | Branches based on run status                      | Get Run                         | Get Last Message, Select Function, Wait1, Wait |                                                                                                                  |
| Get Last Message        | HTTP Request              | Fetches assistant's last message                  | Completed, Action or Inprogress  | respondHubspotMessage1       |                                                                                                                  |
| respondHubspotMessage1  | HTTP Request              | Posts assistant message back to Hubspot chat     | Get Last Message                | -                            | Post assistant Message back to chat service, in this case Hubspot                                               |
| Select Function         | Switch                    | Routes to function execution based on assistant  | Completed, Action or Inprogress  | HTTP Request, HTTP Request1  | Run required actions based on Assistant answer and respond to Assistant with the function answer. Each route is a function that you need to define inside your assistant configuration. |
| HTTP Request            | HTTP Request              | Calls external API for function `getAWBbyOrder`  | Select Function                 | Code1                       |                                                                                                                  |
| HTTP Request1           | HTTP Request              | Calls external API for function `get_awb_history`| Select Function                 | Code                        |                                                                                                                  |
| Code                    | Code                      | Escapes JSON string for safe submission           | HTTP Request1                   | Submit Data1                 |                                                                                                                  |
| Code1                   | Code                      | Escapes JSON string for safe submission           | HTTP Request                   | Submit Data                  |                                                                                                                  |
| Submit Data             | HTTP Request              | Submits function output to OpenAI assistant       | Code1                          | Wait2                       |                                                                                                                  |
| Submit Data1            | HTTP Request              | Submits function output to OpenAI assistant       | Code                          | Wait3                       |                                                                                                                  |
| Wait                    | Wait                      | Waits before polling run status again              | Completed, Action or Inprogress | Get Run                     |                                                                                                                  |
| Wait1                   | Wait                      | Waits before polling run status again              | Completed, Action or Inprogress | Get Run                     |                                                                                                                  |
| Wait2                   | Wait                      | Waits after submitting function output             | Submit Data                    | Get Run                     |                                                                                                                  |
| Wait3                   | Wait                      | Waits after submitting function output             | Submit Data1                   | Get Run                     |                                                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `hubspot-tinder`  
   - Purpose: Receive incoming Hubspot chat messages.  

2. **Add IF2 Node**  
   - Type: If  
   - Condition: Check that `body[0].messageId` exists and is not empty.  
   - Connect Webhook main output to IF2 main input.  

3. **Add HTTP Request Node (getHubspotMessage)**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.hubapi.com/conversations/v3/conversations/threads/{{ $json["body"][0]["objectId"] }}/messages/{{ $json["body"][0]["messageId"] }}`  
   - Authentication: Use Hubspot App Token Credential  
   - Connect IF2 "true" output to this node.  

4. **Add IF Node**  
   - Type: If  
   - Condition: Check that `senders[0].actorId` is not equal to `A-5721819` (assistant user ID)  
   - Connect `getHubspotMessage` main output to IF input.  

5. **Add Airtable Search Node**  
   - Type: Airtable  
   - Operation: Search  
   - Base: Your Airtable base ID (e.g., `appGAPr0tOy8J0NXC`)  
   - Table: Your Airtable table ID (e.g., `tbljZ0POq35jgnKES`)  
   - Filter formula: `{Hubspot Thread ID}="{{ $json.conversationsThreadId }}"`  
   - Credentials: Airtable API token  
   - Connect IF "true" output to Airtable node.  

6. **Add IF1 Node**  
   - Type: If  
   - Condition: Check if Airtable record `id` is empty (i.e., no thread mapping)  
   - Connect Airtable output to IF1 input.  

7. **Add HTTP Request Node (OpenAi Create Thread)**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.openai.com/v1/threads`  
   - Headers: Add header `openai-beta: assistants=v1`  
   - Body (JSON):  
     ```
     {
       "messages": [
         {
           "role": "user",
           "content": "{{ $('getHubspotMessage').item.json['text'] }}"
         }
       ]
     }
     ```  
   - Authentication: OpenAI API Key Credential  
   - Connect IF1 output (empty record) to this node.  

8. **Add Airtable Create Node (createThread)**  
   - Type: Airtable  
   - Operation: Create  
   - Base/Table: Same as step 5  
   - Fields to map:  
     - `Hubspot Thread ID`: from `getHubspotMessage.conversationsThreadId`  
     - `OpenAI Thread ID`: from OpenAi Create Thread response `id`  
   - Connect OpenAi Create Thread output to this node.  

9. **Add HTTP Request Node (OpenAI Run)**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.openai.com/v1/threads/{{ $('createThread').item.json["OpenAI Thread ID"] }}/runs`  
   - Headers: `openai-beta: assistants=v1`  
   - Body (JSON):  
     ```
     {
       "assistant_id": "asst_MA71Jq0SElVpdjmJa212CTFd"
     }
     ```  
   - Authentication: OpenAI API Key Credential  
   - Connect `createThread` output to this node.  

10. **Add LangChain OpenAI Node (OpenAI)**  
    - Type: OpenAI Assistant (LangChain)  
    - Text: `{{ $('getHubspotMessage').item.json['text'] }}`  
    - Assistant ID: Use existing assistant ID (e.g., `asst_wVbEcnRttQ8K65DOV0fk1DJU`)  
    - Connect IF1 output (non-empty Airtable record) to this node.  

11. **Add HTTP Request Node (OpenAI Run1)**  
    - Same as step 9 but URL uses Airtable `OpenAI Thread ID`  
    - Connect output of OpenAI node to this node.  
    - Set `continueOnFail` to true to allow graceful error handling.  

12. **Add HTTP Request Node (Get Run)**  
    - Type: HTTP Request  
    - Method: GET  
    - URL: `https://api.openai.com/v1/threads/{{ $json["thread_id"] }}/runs/{{ $json["id"] }}`  
    - Headers: `openai-beta: assistants=v1`  
    - Authentication: OpenAI API Key Credential  
    - Connect outputs of OpenAI Run, OpenAI Run1, and Wait nodes to this node.  

13. **Add Switch Node (Completed, Action or Inprogress)**  
    - Type: Switch  
    - Value to check: `{{ $json.status }}`  
    - Rules:  
      - equals "completed" → output 0  
      - equals "requires_action" → output 1  
      - equals "in_progress" → output 2  
      - equals "queued" → output 3  
    - Connect `Get Run` output to this node.  

14. **Add HTTP Request Node (Get Last Message)**  
    - Type: HTTP Request  
    - Method: GET  
    - URL: `https://api.openai.com/v1/threads/{{ $json["thread_id"] }}/messages`  
    - Headers: `openai-beta: assistants=v1`  
    - Authentication: OpenAI API Key Credential  
    - Connect Completed output from Switch to this node.  

15. **Add HTTP Request Node (respondHubspotMessage1)**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: `https://api.hubapi.com/conversations/v3/conversations/threads/{{ $('getHubspotMessage').item.json["conversationsThreadId"] }}/messages`  
    - Authentication: Hubspot App Token  
    - Body parameters:  
      - type: "MESSAGE"  
      - richText: `{{ $json.data[0].content[0].text.value }}`  
      - senderActorId: "A-5721819" (assistant user ID)  
      - channelId: `{{ $('getHubspotMessage').item.json.channelId }}`  
      - channelAccountId: `{{ $('getHubspotMessage').item.json.channelAccountId }}`  
      - text: `{{ $json.data[0].content[0].text.value }}`  
    - Connect output of `Get Last Message` to this node.  

16. **Add Switch Node (Select Function)**  
    - Type: Switch  
    - Value: `{{ $json.required_action.submit_tool_outputs.tool_calls[0].function.name }}`  
    - Rules:  
      - equals `getAWBbyOrder` → output 0  
      - equals `get_awb_history` → output 1  
    - Connect `requires_action` output from Switch node (Completed, Action or Inprogress) here.  

17. **Add HTTP Request Nodes for Functions**  
    - For `getAWBbyOrder` (HTTP Request):  
      - GET `https://www.listafirme.ro/api/search-v1.asp`  
      - Query parameters include API key and `src` extracted from function arguments JSON.  
    - For `get_awb_history` (HTTP Request1):  
      - GET `https://www.listafirme.ro/api/info-v1.asp`  
      - Query parameters include API key and JSON string with multiple fields from function arguments.  
    - Connect outputs of Select Function accordingly.  

18. **Add Code Nodes (Code, Code1)**  
    - Purpose: Escape JSON responses from function API calls for safe JSON submission.  
    - JavaScript:  
      ```javascript
      const item1 = $input.all()[0]?.json;
      const jsonString = JSON.stringify(item1);
      const escapedJsonString = jsonString.replace(/"/g, '\\"');
      return { escapedJsonString };
      ```  
    - Connect HTTP Request outputs to these code nodes.  

19. **Add Submit Data Nodes (Submit Data, Submit Data1)**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: `https://api.openai.com/v1/threads/{{ $('Select Function').item.json["thread_id"] }}/runs/{{ $('Select Function').item.json["id"] }}/submit_tool_outputs`  
    - Headers: `openai-beta: assistants=v1`  
    - Body JSON:  
      ```
      {
        "tool_outputs": [
          {
            "tool_call_id": "{{ $('Select Function').item.json.required_action.submit_tool_outputs.tool_calls[0].id }}",
            "output": "{{ $json.escapedJsonString }}"
          }
        ]
      }
      ```  
    - Authentication: OpenAI API Key  
    - Connect Code/Code1 outputs to corresponding Submit Data nodes.  

20. **Add Wait Nodes (Wait, Wait1, Wait2, Wait3)**  
    - Type: Wait  
    - Use webhook-mode wait nodes with unique webhook IDs for asynchronous delay.  
    - Connect Submit Data outputs and relevant switch outputs (e.g., queued, in_progress) to these wait nodes.  
    - Connect wait nodes back to `Get Run` node for polling loop.  

21. **Credential Setup:**  
    - Configure Hubspot App Token credential with valid API key or token to access Hubspot Conversations API.  
    - Configure OpenAI API Key credential with access to OpenAI Assistant API (beta).  
    - Configure Airtable credential with API key and base/table access.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                              | Context or Link                                                                                               |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Hubspot Chat integration requires creating a custom app to forward chat messages to n8n webhook. Support available via email or scheduled call.                                                           | Setup instructions from workflow description and contact: tsocaci@makeitfuture.eu, https://meetings.hubspot.com/makeitfuture/tiberiu-makeitfuture-xcal |
| The workflow is adaptable to other chat platforms by replacing Hubspot-specific nodes, retaining the same logic for message reception and response.                                                       | General workflow design principle.                                                                            |
| For Hubspot API usage, ensure correct scopes and permissions for conversations API, and use Hubspot App Token for authentication.                                                                          | Hubspot Developer docs.                                                                                        |
| Airtable stores mappings between Hubspot conversation thread IDs and OpenAI thread IDs, enabling continuity in conversations.                                                                              | Airtable base/table as per workflow nodes.                                                                    |
| OpenAI Assistant API used is currently in beta, requiring special header `openai-beta: assistants=v1` in requests.                                                                                        | OpenAI API beta documentation.                                                                                 |
| The assistant’s user actor ID in Hubspot is set as `A-5721819`; modify accordingly if changed to prevent message loops.                                                                                   | Workflow IF node filtering logic.                                                                              |
| Handling of required actions must be aligned with functions defined inside the OpenAI assistant configuration to ensure correct routing and execution in the workflow.                                     | Assistant configuration and function definitions.                                                             |
| Sticky Notes in workflow provide useful contextual hints and links, e.g., n8n chat widget package for alternative chat input sources: https://www.npmjs.com/package/@n8n/chat                            | Visible in workflow canvas.                                                                                    |

---

This detailed reference document enables thorough understanding, modification, and reproduction of the "Assistant for Hubspot Chat using OpenAI and Airtable" workflow in n8n. It highlights potential failure points and critical configuration details to anticipate integration issues.