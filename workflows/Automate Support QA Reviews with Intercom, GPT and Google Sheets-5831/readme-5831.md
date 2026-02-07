Automate Support QA Reviews with Intercom, GPT and Google Sheets

https://n8nworkflows.xyz/workflows/automate-support-qa-reviews-with-intercom--gpt-and-google-sheets-5831


# Automate Support QA Reviews with Intercom, GPT and Google Sheets

### 1. Workflow Overview

This workflow automates the Quality Assurance (QA) review process for customer support conversations in Intercom. It listens for conversation closure events, fetches detailed conversation data, filters irrelevant cases, formats the conversation transcript, evaluates agent performance using AI, counts message statistics, logs results in Google Sheets, and optionally generates coaching feedback for low-scoring conversations.

**Target Use Cases:**  
- Automating support conversation reviews to improve agent efficiency and customer satisfaction.  
- Providing structured, actionable feedback to support agents and team leads.  
- Tracking conversation quality trends over time with data logged in Google Sheets.

**Logical Blocks:**  
- **1.1 Input Reception:** Webhook trigger for Intercom conversation closure events.  
- **1.2 Data Retrieval:** Fetch full conversation details via Intercom API.  
- **1.3 Filtering:** Exclude conversations marked as spam or other non-relevant types.  
- **1.4 Conversation Structuring:** Parse and format conversation messages into readable transcripts.  
- **1.5 AI-Powered Evaluations:**  
  - 1.5A Performance Scoring with GPT-4o (response time, clarity, tone, urgency, ownership, problem-solving).  
  - 1.5B Message Analytics (count messages by role and identify last admin responder).  
- **1.6 Data Aggregation and Logging:** Merge AI results and metadata, append to Google Sheets.  
- **1.7 Conditional Coaching Feedback:** For conversations scoring 3 or below, generate detailed coaching feedback with AI.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Listens for Intercom webhook events indicating a conversation has been closed, triggering the workflow.

- **Nodes Involved:**  
  - Webhook

- **Node Details:**  
  - **Webhook**  
    - Type: HTTP Webhook trigger node  
    - Config: Listens for POST requests at a custom path, receives `conversation.admin.closed` events from Intercom.  
    - Inputs: HTTP POST requests  
    - Outputs: JSON payload containing conversation ID and metadata  
    - Edge Cases: Missed or delayed webhook events, malformed payloads, authentication issues (if webhook secret validation is enabled externally)

#### 1.2 Data Retrieval

- **Overview:**  
  Fetches full conversation details from Intercom API using the conversation ID from the webhook.

- **Nodes Involved:**  
  - HTTP Request

- **Node Details:**  
  - **HTTP Request**  
    - Type: REST API call node  
    - Config: GET request to `https://api.intercom.io/conversations/{{conversation_id}}?display_as=plaintext` to retrieve conversation content in plain text.  
    - Credentials: Intercom API OAuth or token-based credentials.  
    - Inputs: Conversation ID from webhook JSON.  
    - Outputs: Full conversation JSON data.  
    - Edge Cases: API rate limits, invalid conversation ID, auth token expiration, network errors.

#### 1.3 Filtering

- **Overview:**  
  Filters out conversations marked as spam or irrelevant types to avoid unnecessary processing.

- **Nodes Involved:**  
  - If (Filter node)

- **Node Details:**  
  - **If**  
    - Type: Conditional filter  
    - Config: Checks if `custom_attributes.Type` equals "Spam/Promotional" or "Other".  
    - Inputs: Conversation JSON from HTTP Request  
    - Outputs:  
      - True branch: Filtered out (no further processing)  
      - False branch: Continue workflow  
    - Edge Cases: Missing or malformed `custom_attributes` field, unexpected attribute values.

#### 1.4 Conversation Structuring

- **Overview:**  
  Extracts and formats conversation parts (messages) into a readable transcript with timestamps, speaker role, and author name.

- **Nodes Involved:**  
  - Split Out (conversation_parts)  
  - Code (filter comments)  
  - Split Out1 (fields: body, created_at, author info)  
  - Code1 (format messages into text)  
  - Split Out2 (fields for initial conversation message)  
  - Code3 (format initial message)  
  - Merge (combine initial message and transcript)

- **Node Details:**  
  - **Split Out**  
    - Type: Splits array field `conversation_parts` into individual items.  
  - **Code**  
    - Filters to keep only parts where `part_type === 'comment'`. Discards system or close parts.  
  - **Split Out1**  
    - Further extracts relevant fields from each comment: body, timestamp, author type and name, author email.  
  - **Code1**  
    - Formats each message into a string: `[YYYY-MM-DD HH:mm:ss] Role (Author): Message body`, stripping HTML tags and applying role labels (User, Bot, Admin).  
  - **Split Out2**  
    - Extracts initial conversation message fields for separate formatting.  
  - **Code3**  
    - Formats the initial conversation message as `Author (email): message`.  
  - **Merge**  
    - Combines the initial message and formatted conversation transcript into one JSON for AI consumption.  
  - Edge Cases: Missing author info, empty messages, HTML tags in body, unexpected author roles.

#### 1.5 AI-Powered Evaluations

##### 1.5A Performance Scoring (GPT-4o)

- **Overview:**  
  Uses GPT-4o to evaluate conversation quality attributes (response time, clarity, tone, urgency, ownership, problem resolution) and produce structured feedback with scores.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model (GPT-4o)  
  - Code2 (parse AI JSON output)  

- **Node Details:**  
  - **AI Agent**  
    - Type: LangChain Agent node configured with a system prompt to act as a human-like QA reviewer.  
    - Input: Combined conversation transcript JSON.  
    - Output: JSON array with attribute scores and dates, formatted strictly with no extra text.  
  - **OpenAI Chat Model**  
    - Model: GPT-4o (latest version available)  
    - Credential: OpenAI API key with appropriate permissions.  
  - **Code2**  
    - Parses raw AI output string into JSON.  
  - Edge Cases: AI response timeouts, malformed JSON response, API quota exceeded, prompt misinterpretation.

##### 1.5B Message Analytics

- **Overview:**  
  Counts the number of messages by role (Bot, User, Admin) and identifies the last Admin who replied.

- **Nodes Involved:**  
  - AI Agent1  
  - OpenAI Chat Model1 (GPT-4.1-mini)  
  - Code5 (parse AI JSON output)  

- **Node Details:**  
  - **AI Agent1**  
    - System prompt asks to analyze the conversation transcript and output counts and last admin name in JSON format.  
  - **OpenAI Chat Model1**  
    - Model: GPT-4.1-mini (smaller GPT-4 variant)  
    - Credential: OpenAI API key  
  - **Code5**  
    - Cleans and parses the AI output JSON string (removes markdown code block if present).  
  - Edge Cases: AI output formatting errors, incomplete counting if transcript malformed, API failures.

#### 1.6 Data Aggregation and Logging

- **Overview:**  
  Merges AI scoring and analytics results and appends structured data to a Google Sheet for tracking.

- **Nodes Involved:**  
  - Merge1  
  - Append row in sheet  
  - If1 (conditional for coaching feedback trigger)

- **Node Details:**  
  - **Merge1**  
    - Combines outputs from performance scoring and message analytics by position.  
  - **Append row in sheet**  
    - Google Sheets node configured to append a new row with mapped fields including scores, counts, conversation ID, and dates.  
    - Document and sheet: Spreadsheet ID `1f9VmrRKolmn3PKIyLWy0yVSiTlQ1QbCAz-8E93XzTJM`, tab `AI.Coach`.  
    - Credential: Google Sheets OAuth2 with editor permissions.  
  - **If1**  
    - Checks if `Overall Score` ≤ 3 to decide whether to generate coaching feedback.  
  - Edge Cases: Google Sheets API quota limits, invalid spreadsheet ID or tab name, data mapping errors.

#### 1.7 Conditional Coaching Feedback

- **Overview:**  
  For conversations with low overall scores (3 or below), generates detailed coaching feedback for the agent with actionable advice.

- **Nodes Involved:**  
  - AI Agent2  
  - OpenAI Chat Model2 (chatgpt-4o-latest)

- **Node Details:**  
  - **AI Agent2**  
    - Inputs combined initial message and conversation transcript.  
    - System message instructs to produce coaching feedback in a friendly, constructive tone with specific format (what went well, what needs fixing, customer feelings, how to improve).  
  - **OpenAI Chat Model2**  
    - Model: chatgpt-4o-latest for best quality coaching feedback.  
    - Credential: OpenAI API key.  
  - Edge Cases: AI timeouts, insufficient conversation context, API errors.

---

### 3. Summary Table

| Node Name          | Node Type                              | Functional Role                         | Input Node(s)               | Output Node(s)           | Sticky Note                                                                                     |
|--------------------|--------------------------------------|---------------------------------------|----------------------------|--------------------------|------------------------------------------------------------------------------------------------|
| Webhook            | n8n-nodes-base.webhook                | Receive Intercom conversation closure webhook | None                       | HTTP Request             | 🧠 Intercom Conversation QA Review Automation – n8n Workflow (full overview and objectives)     |
| HTTP Request       | n8n-nodes-base.httpRequest            | Fetch full conversation detail from Intercom API | Webhook                    | If                       |                                                                                                |
| If                 | n8n-nodes-base.if                    | Filter out spam/promotional and other irrelevant conversations | HTTP Request               | Split Out2, Split Out     |                                                                                                |
| Split Out2         | n8n-nodes-base.splitOut              | Extract initial conversation message fields | If                        | Code3                    |                                                                                                |
| Code3              | n8n-nodes-base.code                  | Format initial message (author, email, plain text) | Split Out2                 | Merge                    |                                                                                                |
| Split Out          | n8n-nodes-base.splitOut              | Extract conversation parts array to individual messages | If                        | Code                     |                                                                                                |
| Code                | n8n-nodes-base.code                  | Filter conversation parts to keep only 'comment' type | Split Out                 | Split Out1                |                                                                                                |
| Split Out1         | n8n-nodes-base.splitOut              | Extract message fields (body, timestamp, author info) | Code                      | Code1                    |                                                                                                |
| Code1              | n8n-nodes-base.code                  | Format messages into timestamped, readable transcript | Split Out1                 | Merge                    |                                                                                                |
| Merge              | n8n-nodes-base.merge                 | Combine initial message and conversation transcript | Code3, Code1               | AI Agent                 |                                                                                                |
| AI Agent           | @n8n/n8n-nodes-langchain.agent       | Evaluate conversation quality scores with GPT-4o | Merge                     | Code2                    |                                                                                                |
| Code2              | n8n-nodes-base.code                  | Parse AI JSON output from performance scoring | AI Agent                   | Merge1                   |                                                                                                |
| AI Agent1          | @n8n/n8n-nodes-langchain.agent       | Count messages by role and find last admin message | Code1                     | Code5                    |                                                                                                |
| Code5              | n8n-nodes-base.code                  | Parse AI JSON output from message analytics | AI Agent1                  | Merge1                   |                                                                                                |
| OpenAI Chat Model   | @n8n/n8n-nodes-langchain.lmChatOpenAi | GPT-4o model used by AI Agent          | AI Agent                   | AI Agent                 |                                                                                                |
| OpenAI Chat Model1  | @n8n/n8n-nodes-langchain.lmChatOpenAi | GPT-4.1-mini used by AI Agent1         | AI Agent1                  | AI Agent1                 |                                                                                                |
| Merge1             | n8n-nodes-base.merge                 | Combine performance scoring and message analytics | Code2, Code5               | Append row in sheet, If1  |                                                                                                |
| Append row in sheet | n8n-nodes-base.googleSheets          | Append conversation review data to Google Sheet | Merge1                     | If1                      |                                                                                                |
| If1                | n8n-nodes-base.if                    | Check if overall score ≤ 3 to trigger coaching feedback | Append row in sheet         | AI Agent2                 |                                                                                                |
| AI Agent2          | @n8n/n8n-nodes-langchain.agent       | Generate coaching feedback for low scores | If1                       | OpenAI Chat Model2        |                                                                                                |
| OpenAI Chat Model2  | @n8n/n8n-nodes-langchain.lmChatOpenAi | GPT-4o latest used for coaching feedback | AI Agent2                  |                          |                                                                                                |
| Sticky Note        | n8n-nodes-base.stickyNote            | Documentation and workflow overview sticky | None                      | None                     | Contains detailed workflow explanation and objectives.                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Unique identifier (e.g., `a716761a-b062-4f93-9734-04fdc83e9a9a`)  
   - Purpose: Receive Intercom `conversation.admin.closed` webhook events.

2. **Add HTTP Request Node**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.intercom.io/conversations/{{ $json.body.data.item.id }}?display_as=plaintext`  
   - Authentication: Use Intercom API credentials (OAuth2 or token)  
   - Connect Webhook → HTTP Request.

3. **Add If Node (Filter Conversations)**  
   - Conditions: OR  
     - `$json.custom_attributes.Type` equals `"Spam/Promotional"`  
     - `$json.custom_attributes.Type` equals `"Other"`  
   - Connect HTTP Request → If (filter false branch continues).

4. **Split Conversation Parts for Initial Message**  
   - Add Split Out2 Node  
   - Field to split out: `source.body, source.delivered_as, source.author.name, source.author.email`  
   - Connect If (false branch) → Split Out2.

5. **Code Node to Format Initial Message**  
   - JavaScript to remove HTML, format as: `Author (email): message`  
   - Connect Split Out2 → Code3.

6. **Split Conversation Parts for All Messages**  
   - Add Split Out Node  
   - Field to split: `conversation_parts`  
   - Connect If (false branch) → Split Out.

7. **Code Node to Filter 'comment' Parts**  
   - Filter parts where `part_type === 'comment'`  
   - Connect Split Out → Code.

8. **Split Out1 Node**  
   - Extract fields: `body, created_at, author.type, author.name, author.email`  
   - Connect Code → Split Out1.

9. **Code1 Node to Format Conversation Transcript**  
   - Format each message with timestamp, role label, and author name, removing HTML tags.  
   - Connect Split Out1 → Code1.

10. **Merge Node to Combine Initial Message and Transcript**  
    - Mode: Combine by position  
    - Connect Code3 and Code1 → Merge.

11. **Add AI Agent Node for Performance Scoring**  
    - Use LangChain Agent node  
    - System prompt: Detailed instructions to act as human QA reviewer evaluating response time, clarity, tone, urgency, ownership, problem solving, output pure JSON array with scores and dates.  
    - Model: GPT-4o via OpenAI Chat Model node  
    - Connect Merge → AI Agent (with OpenAI Chat Model node connected as language model).

12. **Add Code2 Node to Parse AI Output JSON**  
    - Parse AI raw string output to JSON object  
    - Connect AI Agent → Code2.

13. **Add AI Agent1 Node for Message Analytics**  
    - Input: conversation transcript text.  
    - System prompt: Count messages by role, identify last admin message sender, output JSON.  
    - Model: GPT-4.1-mini via OpenAI Chat Model1 node  
    - Connect Code1 → AI Agent1 (with OpenAI Chat Model1 connected).

14. **Add Code5 Node to Parse Analytics Output JSON**  
    - Clean markdown code blocks and parse JSON  
    - Connect AI Agent1 → Code5.

15. **Add Merge1 Node to Combine Scoring and Analytics**  
    - Mode: Combine by position  
    - Connect Code2 and Code5 → Merge1.

16. **Add Google Sheets Node to Append Row**  
    - Operation: Append  
    - Spreadsheet ID: `1f9VmrRKolmn3PKIyLWy0yVSiTlQ1QbCAz-8E93XzTJM`  
    - Sheet Name: `AI.Coach`  
    - Map columns for all relevant fields (scores, counts, conversation ID, dates, last message by, etc.)  
    - Credential: Google Sheets OAuth2 with write access  
    - Connect Merge1 → Append row in sheet.

17. **Add If1 Node to Check if Overall Score ≤ 3**  
    - Condition: `Overall Score` ≤ 3  
    - Connect Append row in sheet → If1.

18. **Add AI Agent2 Node for Coaching Feedback**  
    - Input: combined initial message and transcript from Merge node  
    - System prompt: Generate friendly coaching feedback with positives, negatives, customer feelings, and improvement suggestions  
    - Model: chatgpt-4o-latest via OpenAI Chat Model2 node  
    - Connect If1 (true branch) → AI Agent2 (with OpenAI Chat Model2 connected).

19. **Add all necessary OpenAI Chat Model nodes**  
    - GPT-4o (performance scoring)  
    - GPT-4.1-mini (message analytics)  
    - chatgpt-4o-latest (coaching feedback)

20. **Test end-to-end with Intercom webhook events and verify Google Sheets logging and AI outputs.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Context or Link                                                                                          |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| 🧠 Intercom Conversation QA Review Automation – n8n Workflow: This sticky note contains a detailed high-level explanation of the workflow objectives, structure, and outputs to assist understanding and maintenance.                                                                                                                                                                                                                                                                                                                                                                                                                  | Included as a Sticky Note node at the beginning of the workflow.                                        |
| The workflow is designed to process `conversation.admin.closed` events specifically, which means it triggers only after a conversation is closed in Intercom, ensuring final state evaluation.                                                                                                                                                                                                                                                                                                                                                                                                                                 | Intercom Webhook event type.                                                                             |
| OpenAI models used have different roles: GPT-4o for detailed scoring, GPT-4.1-mini for message analytics, and chatgpt-4o-latest for coaching feedback generation, balancing cost and performance.                                                                                                                                                                                                                                                                                                                                                                                                                                   | OpenAI Chat Model nodes with appropriate credentials.                                                    |
| Google Sheets integration requires OAuth2 credentials with permission to edit the targeted spreadsheet and sheet tab.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Google Sheets node configuration.                                                                        |
| The system prompts for AI agents are carefully crafted to enforce JSON-only output without extraneous text or markdown, which is critical for parsing downstream in code nodes.                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Prompt instructions in AI Agent nodes.                                                                   |
| Error handling is minimal; consider adding error workflows or retry mechanisms for API calls and AI models to handle quota limits, timeouts, or malformed data.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Suggested workflow improvement.                                                                          |

---

**Disclaimer:** The text provided comes exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.