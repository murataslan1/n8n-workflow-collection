AI-Powered Email Support Router with Gmail, ChatGPT-4o, and Slack

https://n8nworkflows.xyz/workflows/ai-powered-email-support-router-with-gmail--chatgpt-4o--and-slack-9376


# AI-Powered Email Support Router with Gmail, ChatGPT-4o, and Slack

### 1. Workflow Overview

This workflow automates the triage and routing of incoming unread Gmail messages using AI classification and Slack notifications. It is designed for support teams that receive email requests and want to automatically classify and route messages to appropriate Slack channels based on content categories. The workflow ensures no duplicate processing of email threads by checking against a Supabase database.

Logical blocks:
- **1.1 Input Reception:** Detect new unread emails from Gmail.
- **1.2 Thread Deduplication:** Query Supabase to check if the email thread has been processed before.
- **1.3 Conditional Branching:** Decide whether to continue processing or stop based on thread existence.
- **1.4 AI Classification:** Use ChatGPT-4o to classify the email into predefined categories.
- **1.5 Routing via Switch:** Route the classified emails to corresponding Slack channels.
- **1.6 Slack Notification:** Send formatted messages to Slack channels (#support or #new-requests).
- **1.7 Data Logging:** Record processed email thread details in Supabase.
- **1.8 Post-Processing:** Mark the email as read in Gmail to avoid reprocessing.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Listens for new unread emails arriving in the connected Gmail inbox and passes email metadata downstream.

- **Nodes Involved:**  
  - Gmail Trigger

- **Node Details:**  
  - **Gmail Trigger**  
    - *Type & Role:* Gmail Trigger node; initiates workflow on new unread emails.  
    - *Configuration:* Polls Gmail every minute for unread emails only.  
    - *Key Expressions:* Outputs email fields including `From`, `Subject`, `snippet`, `threadId`, and `id`.  
    - *Connections:* Output connects to "Get a row" node.  
    - *Failure Modes:* Gmail API rate limits, authentication errors, network timeouts.  
    - *Sticky Note Content:* Triggers when new unread email arrives, sends email data downstream.

#### 1.2 Thread Deduplication

- **Overview:**  
  Queries the Supabase `threads` table to check if the email thread has already been processed, preventing duplicate handling.

- **Nodes Involved:**  
  - Get a row (Supabase)  

- **Node Details:**  
  - **Get a row**  
    - *Type & Role:* Supabase node; retrieves existing thread record by `thread_id`.  
    - *Configuration:* Filters `threads` table on `thread_id` matching incoming email's threadId.  
    - *Key Expressions:* `={{ $json.threadId }}` used for filtering.  
    - *Connections:* Output feeds into "If" node for decision making.  
    - *Failure Modes:* Supabase connectivity issues, incorrect query syntax, empty result sets.  
    - *Sticky Note Content:* Checks if the email thread exists in Supabase.

#### 1.3 Conditional Branching

- **Overview:**  
  Decides whether to proceed with further processing or stop based on if the thread exists already.

- **Nodes Involved:**  
  - If

- **Node Details:**  
  - **If**  
    - *Type & Role:* Conditional node; evaluates if `thread_id` is present in Supabase response.  
    - *Configuration:* Condition tests if `thread_id` is not empty.  
    - *Key Expressions:* `={{ $json.thread_id }}` evaluated for non-empty string.  
    - *Connections:*  
      - True (thread exists): End workflow (no further output).  
      - False (thread does not exist): Continue to "Message a model" node.  
    - *Failure Modes:* Expression evaluation errors, malformed data.  
    - *Sticky Note Content:* Stops if thread exists, continues if new.

#### 1.4 AI Classification

- **Overview:**  
  Sends the email subject and snippet to ChatGPT-4o via Langchain OpenAI node to classify the email into categories for routing.

- **Nodes Involved:**  
  - Message a model (OpenAI)

- **Node Details:**  
  - **Message a model**  
    - *Type & Role:* Langchain OpenAI node; sends prompt to ChatGPT-4o for classification.  
    - *Configuration:*  
      - Model: `chatgpt-4o-latest`.  
      - System message instructs AI to return only a JSON object with a `category` field.  
      - User message includes email Subject and snippet.  
      - JSON output enabled for parsing response.  
    - *Key Expressions:*  
      - System prompt with JSON structure:  
        ```  
        {"category":"support|new-request|enquiry|general|spam|other"}  
        ```  
      - User prompt interpolates:  
        `Subject: {{ $('Gmail Trigger').item.json.Subject }}`  
        `Content: {{ $('Gmail Trigger').item.json.snippet }}`  
    - *Connections:* Output connects to "Switch" node.  
    - *Failure Modes:* API rate limits, invalid API key, malformed AI response, JSON parsing errors.  
    - *Sticky Note Content:* Classifies email into categories.

#### 1.5 Routing via Switch

- **Overview:**  
  Routes the classified email to different Slack channels based on the AI-generated category.

- **Nodes Involved:**  
  - Switch

- **Node Details:**  
  - **Switch**  
    - *Type & Role:* Switch node; routes messages to different Slack nodes based on category.  
    - *Configuration:*  
      - Case 1: category == "support" → output 1.  
      - Case 2: category == "new-request" → output 2.  
      - Other categories implicitly ignored (no output).  
      - Uses strict string equality on `{{ $json.message.content.category }}`.  
    - *Connections:*  
      - Output 1 → "Send a message" (Slack #support channel).  
      - Output 2 → "Send a message 2" (Slack #new-requests channel).  
    - *Failure Modes:* Missing or unexpected category values, expression errors.  
    - *Sticky Note Content:* Routes email based on category to Slack channels.

#### 1.6 Slack Notification

- **Overview:**  
  Posts formatted messages to appropriate Slack channels notifying about new support or request emails.

- **Nodes Involved:**  
  - Send a message (Slack #support)  
  - Send a message 2 (Slack #new-requests)

- **Node Details:**  
  - **Send a message**  
    - *Type & Role:* Slack node; sends message to #support channel.  
    - *Configuration:*  
      - OAuth2 authentication.  
      - Channel ID: `C09EVCZR4P6` (support).  
      - Message includes sender email, subject, and snippet.  
    - *Connections:* Output connects to "Create a row" node.  
    - *Failure Modes:* Slack API errors, invalid OAuth2 tokens, channel permissions.  
    - *Sticky Note Content:* Posts message to #support Slack channel.

  - **Send a message 2**  
    - *Type & Role:* Slack node; sends message to #new-requests channel.  
    - *Configuration:*  
      - OAuth2 authentication.  
      - Channel ID: `C09EQ9Q1Z3R` (new-requests).  
      - Message format same as above.  
    - *Connections:* Output connects to "Create a row" node.  
    - *Failure Modes:* Same as above.  
    - *Sticky Note Content:* Posts message to #new-requests Slack channel.

#### 1.7 Data Logging

- **Overview:**  
  Creates a new record in the Supabase `threads` table to log processed email threads and avoid duplicates.

- **Nodes Involved:**  
  - Create a row (Supabase)

- **Node Details:**  
  - **Create a row**  
    - *Type & Role:* Supabase node; inserts new thread record.  
    - *Configuration:*  
      - Table: `threads`.  
      - Fields set:  
        - `thread_id` = email `threadId`.  
        - `first_message_id` = email `id`.  
        - `from_addr` = email `From`.  
        - `subject` = email `Subject`.  
    - *Connections:* Output connects to "Mark a message as read".  
    - *Failure Modes:* Insertion errors, database connection problems, data type mismatches.  
    - *Sticky Note Content:* Logs thread details for deduplication.

#### 1.8 Post-Processing

- **Overview:**  
  Marks the processed email as read in Gmail to prevent reprocessing.

- **Nodes Involved:**  
  - Mark a message as read (Gmail)

- **Node Details:**  
  - **Mark a message as read**  
    - *Type & Role:* Gmail node; marks email as read.  
    - *Configuration:* Message ID set to the original email's `id`.  
    - *Connections:* End of workflow.  
    - *Failure Modes:* Gmail API errors, permission issues.  
    - *Sticky Note Content:* Marks email as read once processed.

---

### 3. Summary Table

| Node Name             | Node Type                     | Functional Role                    | Input Node(s)        | Output Node(s)          | Sticky Note                                      |
|-----------------------|-------------------------------|----------------------------------|----------------------|-------------------------|-------------------------------------------------|
| Gmail Trigger         | Gmail Trigger                 | Input reception of unread emails | None                 | Get a row               | Triggers on new unread email, sends email data  |
| Get a row             | Supabase                      | Check if thread exists            | Gmail Trigger        | If                      | Checks Supabase for existing email thread       |
| If                    | If                           | Conditional branch to stop/continue | Get a row             | Message a model (false)  | Stops if thread exists, continues if new         |
| Message a model       | Langchain OpenAI (ChatGPT-4o) | AI classification of email       | If (false)           | Switch                  | Classifies email into categories                  |
| Switch                | Switch                       | Routes email by category          | Message a model      | Send a message, Send a message 2 | Routes email to Slack channels based on category |
| Send a message        | Slack                        | Send to #support Slack channel   | Switch (support)     | Create a row             | Sends message to #support Slack channel          |
| Send a message 2      | Slack                        | Send to #new-requests Slack channel | Switch (new-request) | Create a row             | Sends message to #new-requests Slack channel     |
| Create a row          | Supabase                     | Log thread info in Supabase       | Send a message, Send a message 2 | Mark a message as read | Adds record for deduplication                      |
| Mark a message as read | Gmail                        | Mark email as read in Gmail       | Create a row         | None                    | Marks email as read after processing              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create node:** Gmail Trigger  
   - Type: Gmail Trigger  
   - Parameters: Filter unread emails only  
   - Poll interval: Every minute  
   - Credentials: Connect your Gmail account with required scopes  

2. **Create node:** Get a row (Supabase)  
   - Type: Supabase  
   - Operation: Get  
   - Table: `threads`  
   - Filter condition: `thread_id` equals `{{$json["threadId"]}}` from Gmail Trigger  
   - Credentials: Connect Supabase with API key and URL  

3. **Create node:** If  
   - Type: If  
   - Condition: Check if `{{$json["thread_id"]}}` is not empty (string not empty)  
   - Input: Output from Get a row  
   - True branch: No output (stop workflow)  
   - False branch: Continue  

4. **Create node:** Message a model (Langchain OpenAI)  
   - Type: Langchain OpenAI  
   - Model: chatgpt-4o-latest  
   - Messages:  
     - System: "You are an email triage classifier. Return ONLY a JSON object: {\"category\":\"support|new-request|enquiry|general|spam|other\"}"  
     - User: Subject and snippet from Gmail Trigger:  
       ```
       Subject: {{$node["Gmail Trigger"].json["Subject"]}}  
       Content: {{$node["Gmail Trigger"].json["snippet"]}}  
       ```  
   - JSON output: Enabled  
   - Credentials: OpenAI API key  

5. **Create node:** Switch  
   - Type: Switch  
   - Rules:  
     - Case 1: If `{{$json["message"]["content"]["category"]}}` equals "support" → Output 1  
     - Case 2: If equals "new-request" → Output 2  
   - Input: Output from Message a model  

6. **Create node:** Send a message (Slack #support)  
   - Type: Slack  
   - Channel: #support ID (`C09EVCZR4P6`)  
   - Authentication: OAuth2 with Slack credentials  
   - Message text:  
     ```
     New support request received from {{$node["Gmail Trigger"].json["From"]}}  
     Subject: {{$node["Gmail Trigger"].json["Subject"]}}  
     Content: {{$node["Gmail Trigger"].json["snippet"]}}  
     ```  
   - Input: Switch output 1  

7. **Create node:** Send a message 2 (Slack #new-requests)  
   - Type: Slack  
   - Channel: #new-requests ID (`C09EQ9Q1Z3R`)  
   - Authentication: OAuth2  
   - Message same format as above  
   - Input: Switch output 2  

8. **Create node:** Create a row (Supabase)  
   - Type: Supabase  
   - Operation: Insert a row  
   - Table: `threads`  
   - Fields:  
     - `thread_id` = `{{$node["Gmail Trigger"].json["threadId"]}}`  
     - `first_message_id` = `{{$node["Gmail Trigger"].json["id"]}}`  
     - `from_addr` = `{{$node["Gmail Trigger"].json["From"]}}`  
     - `subject` = `{{$node["Gmail Trigger"].json["Subject"]}}`  
   - Input: From both Slack Send message nodes  
   - Credentials: Supabase  

9. **Create node:** Mark a message as read (Gmail)  
   - Type: Gmail  
   - Operation: Mark as read  
   - Message ID: `{{$node["Gmail Trigger"].json["id"]}}`  
   - Input: Create a row output  
   - Credentials: Gmail  

10. **Connect nodes in order:**  
    Gmail Trigger → Get a row → If  
    If (false) → Message a model → Switch  
    Switch output 1 → Send a message → Create a row → Mark a message as read  
    Switch output 2 → Send a message 2 → Create a row → Mark a message as read  

11. **Credentials Setup:**  
    - Gmail with read/write access  
    - Supabase with insert and query permissions on `threads` table  
    - OpenAI API key for ChatGPT-4o model via Langchain node  
    - Slack OAuth2 with permissions to post messages in respective channels  

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                 |
|---------------------------------------------------------------------------------------------------------------|------------------------------------------------|
| Workflow uses ChatGPT-4o model for email classification to improve routing accuracy.                           | OpenAI ChatGPT-4o model via Langchain node     |
| Supabase table `threads` is used as a deduplication log to avoid repeated processing of the same email thread. | Supabase backend setup recommended              |
| Slack channels used: #support (C09EVCZR4P6), #new-requests (C09EQ9Q1Z3R) — update channel IDs as per workspace. | Slack channel configuration                      |
| Gmail OAuth2 requires scopes to read inbox and modify message status (mark as read).                           | Gmail API scopes setup                           |
| Slack OAuth2 requires chat:write permissions to post messages.                                                | Slack App OAuth2 setup                           |

---

**Disclaimer:** The provided workflow is an automated configuration executed via n8n, respecting all applicable content policies. All processed data is legal and publicly accessible.