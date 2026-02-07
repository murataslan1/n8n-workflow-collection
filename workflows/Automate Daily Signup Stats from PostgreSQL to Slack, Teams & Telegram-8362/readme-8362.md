Automate Daily Signup Stats from PostgreSQL to Slack, Teams & Telegram

https://n8nworkflows.xyz/workflows/automate-daily-signup-stats-from-postgresql-to-slack--teams---telegram-8362


# Automate Daily Signup Stats from PostgreSQL to Slack, Teams & Telegram

### 1. Workflow Overview

This workflow automates the daily reporting of new user signups from a PostgreSQL database to multiple messaging platforms—Slack, Microsoft Teams, and Telegram. It is designed to run once every day at 9:00 AM UTC, fetch the count of new signups in the last 24 hours, format this data into a summary message, and distribute that message concurrently across all three channels.

The workflow is logically divided into three main blocks:

- **1.1 Trigger & Data Fetching**: Scheduled trigger initiates the workflow and queries the PostgreSQL database for signup counts.
- **1.2 Report Preparation**: Formats the retrieved data into a structured message for reporting.
- **1.3 Multi-Channel Notification Delivery**: Sends the prepared report message concurrently to Slack, Microsoft Teams, and Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger & Data Fetching

**Overview:**  
This block initiates the workflow daily at 9:00 AM and queries the PostgreSQL database to determine the number of new user signups in the past 24 hours.

**Nodes Involved:**  
- ⏰ Daily Report Trigger  
- 🗄️ Fetch Signup Count  
- Database Config Instructions (Sticky Note)

**Node Details:**

- **⏰ Daily Report Trigger**  
  - *Type & Role*: Schedule Trigger node; triggers the workflow daily at a fixed time.  
  - *Configuration*: Set to trigger at 9:00 AM every day (hour 9).  
  - *Inputs/Outputs*: No inputs; outputs trigger data to "🗄️ Fetch Signup Count".  
  - *Version*: 1.2  
  - *Error Cases*: If n8n instance is down or time zone misconfiguration occurs, daily trigger may fail or run at unexpected times.

- **🗄️ Fetch Signup Count**  
  - *Type & Role*: PostgreSQL node; executes a SQL query to fetch signup count.  
  - *Configuration*:  
    - SQL Query: Counts rows in the `customers` table where `created_at` timestamp is within the last 24 hours (using `NOW() - INTERVAL '24 HOURS'`).  
    - Note: User must replace `'customers'` and `'created_at'` with their actual table and timestamp column if different.  
  - *Inputs*: Triggered by "⏰ Daily Report Trigger".  
  - *Outputs*: Outputs JSON with a field `signup_count`.  
  - *Version*: 2.4  
  - *Error Cases*: Database connection failures, query syntax issues, empty or missing data, or incorrect timestamp columns.  
  - *Sticky Note*: "Database Config Instructions" explains the trigger and fetching logic and instructs to adapt the query.

- **Database Config Instructions (Sticky Note)**  
  - Provides a textual explanation of this block’s purpose and instructions for adapting the SQL query.

---

#### 2.2 Report Preparation

**Overview:**  
This block formats the raw signup count data into a human-readable message string with date and summary information, preparing it for sending to messaging platforms.

**Nodes Involved:**  
- 📝 Prepare Report Message  
- Messaging Config Instructions (Sticky Note)

**Node Details:**

- **📝 Prepare Report Message**  
  - *Type & Role*: Set node; creates new JSON fields to hold formatted data.  
  - *Configuration*:  
    - Sets `signup_count` with the fetched count or defaults to 0 if missing.  
    - Sets `report_date` to current UTC date in "Month Day, Year" format (e.g., "June 30, 2024").  
    - Creates `message_text` string that reads:  
      `📊 Daily Signup Report`  
      `New signups in the last 24h: [signup_count]`  
  - *Inputs*: Receives data from "🗄️ Fetch Signup Count".  
  - *Outputs*: JSON with formatted message fields passed to notification nodes.  
  - *Version*: 2  
  - *Error Cases*: Expression failures if input data is missing or malformed.  
  - *Sticky Note*: "Messaging Config Instructions" explains message formatting and content.

- **Messaging Config Instructions (Sticky Note)**  
  - Provides instructions on how the report message is prepared and what it contains.

---

#### 2.3 Multi-Channel Notification Delivery

**Overview:**  
This block sends the formatted daily signup summary message concurrently to Slack, Microsoft Teams, and Telegram channels.

**Nodes Involved:**  
- 💬 Post to Slack  
- 📢 Send to Teams  
- 📲 Send to Telegram  
- Messaging Config Instructions1 (Sticky Note)

**Node Details:**

- **💬 Post to Slack**  
  - *Type & Role*: Slack node; posts a message to a Slack channel.  
  - *Configuration*:  
    - Text: Uses the `message_text` field from "📝 Prepare Report Message".  
    - Channel: Hardcoded to `#general` (needs adjustment per environment).  
  - *Inputs*: Connected from "📝 Prepare Report Message".  
  - *Outputs*: None (terminal node).  
  - *Version*: 1  
  - *Error Cases*: Slack authentication failures, invalid channel name, API rate limits.

- **📢 Send to Teams**  
  - *Type & Role*: Microsoft Teams node; sends a message to a Teams channel.  
  - *Configuration*:  
    - Requires user to set `teamId` and `name` (channel name).  
    - Message content is implicitly the message from previous node (though not explicitly mapped in JSON; likely default message sending).  
  - *Inputs*: Connected from "📝 Prepare Report Message".  
  - *Outputs*: None (terminal node).  
  - *Version*: 1  
  - *Error Cases*: Authentication issues, incorrect Team or Channel IDs, permission errors.

- **📲 Send to Telegram**  
  - *Type & Role*: Telegram node; sends a text message to a Telegram chat.  
  - *Configuration*:  
    - Text: Uses `message_text` from "📝 Prepare Report Message".  
    - `chatId`: User must replace with their Telegram chat ID.  
    - `appendAttribution`: Disabled to avoid adding bot attribution.  
  - *Inputs*: Connected from "📝 Prepare Report Message".  
  - *Outputs*: None (terminal node).  
  - *Version*: 1.1  
  - *Error Cases*: Invalid chat ID, authentication failures, message length limits.

- **Messaging Config Instructions1 (Sticky Note)**  
  - Explains that the message is sent concurrently to Slack, Teams, and Telegram.

---

### 3. Summary Table

| Node Name                   | Node Type             | Functional Role                  | Input Node(s)          | Output Node(s)                                | Sticky Note                                                                                                     |
|-----------------------------|-----------------------|---------------------------------|------------------------|-----------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| ⏰ Daily Report Trigger       | Schedule Trigger      | Initiates workflow daily at 9AM | —                      | 🗄️ Fetch Signup Count                          | Database Config Instructions: explains trigger and DB query logic                                              |
| 🗄️ Fetch Signup Count        | PostgreSQL            | Queries signup count from DB     | ⏰ Daily Report Trigger  | 📝 Prepare Report Message                      | Database Config Instructions: query notes and adaptation instructions                                          |
| 📝 Prepare Report Message    | Set                   | Formats report message string    | 🗄️ Fetch Signup Count    | 💬 Post to Slack, 📢 Send to Teams, 📲 Send to Telegram | Messaging Config Instructions: explains message format and contents                                             |
| 💬 Post to Slack             | Slack                 | Posts message to Slack channel   | 📝 Prepare Report Message| —                                             | Messaging Config Instructions1: multi-channel delivery explanation                                             |
| 📢 Send to Teams            | Microsoft Teams       | Sends message to Teams channel   | 📝 Prepare Report Message| —                                             | Messaging Config Instructions1: multi-channel delivery explanation                                             |
| 📲 Send to Telegram          | Telegram              | Sends message to Telegram chat   | 📝 Prepare Report Message| —                                             | Messaging Config Instructions1: multi-channel delivery explanation                                             |
| Database Config Instructions | Sticky Note           | Explains DB query and trigger    | —                      | —                                             |                                                                                                                 |
| Messaging Config Instructions| Sticky Note           | Explains message formatting      | —                      | —                                             |                                                                                                                 |
| Messaging Config Instructions1| Sticky Note          | Explains multi-channel delivery  | —                      | —                                             |                                                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n.

2. **Add a Schedule Trigger node**:
   - Name: `⏰ Daily Report Trigger`
   - Type: Schedule Trigger
   - Set to trigger daily at 9:00 AM (hour 9).
   - No credentials needed.

3. **Add a PostgreSQL node**:
   - Name: `🗄️ Fetch Signup Count`
   - Connect input from `⏰ Daily Report Trigger`
   - Credentials: Configure PostgreSQL credentials with access to your database.
   - Operation: Execute Query
   - Query:
     ```
     SELECT COUNT(*) as signup_count 
     FROM customers 
     WHERE created_at >= NOW() - INTERVAL '24 HOURS';
     ```
     *Note*: Replace `customers` and `created_at` with your actual table and timestamp column names if different.

4. **Add a Set node**:
   - Name: `📝 Prepare Report Message`
   - Connect input from `🗄️ Fetch Signup Count`
   - Add fields:
     - `signup_count` (string): Expression `{{$json["signup_count"] || 0}}`
     - `report_date` (string): Expression `{{ new Date().toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }) }}`
     - `message_text` (string): Expression  
       ```
       📊 Daily Signup Report
       New signups in the last 24h: {{$json["signup_count"] || 0}}
       ```

5. **Add Slack node**:
   - Name: `💬 Post to Slack`
   - Connect input from `📝 Prepare Report Message`
   - Credentials: Configure Slack OAuth2 credentials.
   - Channel: Set to your Slack channel, e.g., `#general`.
   - Text: Use expression `{{$node["📝 Prepare Report Message"].json.message_text}}`.

6. **Add Microsoft Teams node**:
   - Name: `📢 Send to Teams`
   - Connect input from `📝 Prepare Report Message`
   - Credentials: Configure Microsoft Teams OAuth2 credentials.
   - Team ID: Your Teams team ID.
   - Channel Name: Your Teams channel name.
   - Message content is implicitly sent from the input data; ensure message is mapped if required.

7. **Add Telegram node**:
   - Name: `📲 Send to Telegram`
   - Connect input from `📝 Prepare Report Message`
   - Credentials: Configure Telegram Bot API credentials.
   - Chat ID: Your Telegram chat ID.
   - Text: Expression `{{$node["📝 Prepare Report Message"].json.message_text}}`.
   - Additional Fields: Set `appendAttribution` to false.

8. **Verify all connections**:
   - `⏰ Daily Report Trigger` → `🗄️ Fetch Signup Count`
   - `🗄️ Fetch Signup Count` → `📝 Prepare Report Message`
   - `📝 Prepare Report Message` → `💬 Post to Slack`, `📢 Send to Teams`, `📲 Send to Telegram` (parallel)

9. **Save and activate** the workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                             | Context or Link                                              |
|--------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| The workflow triggers daily at 9:00 AM UTC; adjust time or time zone in the Schedule Trigger node if needed.             | Schedule Trigger node configuration                           |
| Replace placeholder names (e.g., `customers`, `created_at`, Slack channel, Teams team/channel IDs, Telegram chat ID) accordingly. | PostgreSQL query and messaging nodes                          |
| Slack, Teams, and Telegram nodes require valid OAuth2 or API credentials configured in n8n.                              | Credential setup for Slack, Microsoft Teams, Telegram nodes  |
| Message formatting uses UTC date to maintain consistency across time zones.                                               | Set node expression for `report_date`                         |
| This workflow uses parallel message sending for efficiency; ensure rate limits for APIs are respected.                   | Multi-channel delivery block                                   |
| For troubleshooting, verify the database connection and API credentials first.                                            | Common failure points                                         |

---

**Disclaimer:**  
The text above is exclusively derived from an n8n automated workflow. All processing complies with current content policies and contains no illegal or protected content. All data handled is legal and public.