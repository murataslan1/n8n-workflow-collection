AI Email Assistant: Prioritize Gmail with ChatGPT Summaries and Slack Digests

https://n8nworkflows.xyz/workflows/ai-email-assistant--prioritize-gmail-with-chatgpt-summaries-and-slack-digests-5446


# AI Email Assistant: Prioritize Gmail with ChatGPT Summaries and Slack Digests

---
### 1. Workflow Overview

This workflow, titled **AI Email Assistant: Prioritize Gmail with ChatGPT Summaries and Slack Digests**, automates the processing of incoming Gmail messages for a busy startup founder. It uses AI (OpenAI GPT-4o-mini) to classify and prioritize emails, label them in Gmail, log details into Google Sheets, and notify the user via Slack. Additionally, it compiles a daily digest of important emails based on urgency and shares it in Slack at a scheduled time.

The workflow is logically divided into two main functional blocks:

- **1.1 Real-Time Email Processing and Prioritization**:  
  Watches for new Gmail messages, sends the content to an AI model for classification and summarization, parses the AI response, applies labels in Gmail, logs email metadata into a Google Sheet, and sends immediate Slack alerts for high or medium urgency emails.

- **1.2 Daily Digest Compilation and Slack Notification**:  
  Runs once daily to retrieve logged emails from the Google Sheet, filters for today’s high and medium urgency emails, formats a digest message, and posts it to a dedicated Slack channel for review.

---

### 2. Block-by-Block Analysis

#### 2.1 Real-Time Email Processing and Prioritization

- **Overview:**  
  This block triggers on every new Gmail email, classifies the message using GPT-4o-mini AI, parses the AI-generated JSON, applies conditional logic based on urgency, labels the email in Gmail, logs details into Google Sheets, and posts immediate Slack notifications for important emails.

- **Nodes Involved:**  
  - Gmail Trigger  
  - Message a model (OpenAI node)  
  - Code (parsing AI JSON output)  
  - If (urgency condition check)  
  - Send a message (Slack alert)  
  - Add label to message (Gmail - low urgency label)  
  - Add label to message1 (Gmail - high/medium urgency label)  
  - Append row in sheet1 (Google Sheets - low urgency log)  
  - Append row in sheet (Google Sheets - high/medium urgency log)

- **Node Details:**

  1. **Gmail Trigger**  
     - *Type:* Gmail Trigger  
     - *Role:* Watches Gmail inbox for new messages every minute.  
     - *Configuration:* Poll mode every minute, no filter restrictions.  
     - *Credentials:* OAuth2 Gmail account.  
     - *Input/Output:* No input; outputs new email data.  
     - *Failures:* Possible OAuth token expiration or API rate limits.

  2. **Message a model**  
     - *Type:* OpenAI (LangChain)  
     - *Role:* Sends email subject and snippet to GPT-4o-mini to classify the email into JSON fields: summary, urgency, category, intent.  
     - *Configuration:* Model "gpt-4o-mini" with a system prompt instructing strict JSON output without markdown.  
     - *Expressions:* Injects email subject and snippet dynamically from Gmail Trigger node.  
     - *Credentials:* OpenAI API key.  
     - *Input:* Email data from Gmail Trigger.  
     - *Output:* Raw AI response with JSON classification.  
     - *Failures:* API quota limits, malformed JSON output (partially handled downstream).

  3. **Code**  
     - *Type:* Code (JavaScript)  
     - *Role:* Parses the AI response string into JSON, cleans formatting artifacts (removes backticks, smart quotes).  
     - *Logic:* On JSON parse failure, returns an error object with the raw response for troubleshooting.  
     - *Input:* AI response from "Message a model".  
     - *Output:* Structured JSON with summary, urgency, category, intent fields.  
     - *Edge Cases:* Handles JSON parse errors gracefully, but downstream nodes must check for error flags.

  4. **If**  
     - *Type:* If Condition  
     - *Role:* Checks if the parsed email urgency is "High" or "Medium".  
     - *Conditions:* Compares urgency field from Code node output strictly (case sensitive).  
     - *Input:* Parsed classification JSON.  
     - *Output:* Two branches - True (High/Medium urgency), False (Otherwise).  
     - *Edge Cases:* If urgency field is missing or unexpected, falls to False branch.

  5. **Send a message**  
     - *Type:* Slack  
     - *Role:* Sends an immediate Slack alert for important emails (High or Medium urgency).  
     - *Configuration:* Sends to Slack channel "alerts" with a formatted text including summary, urgency, and sender.  
     - *Credentials:* Slack OAuth2.  
     - *Input:* True branch of If node.  
     - *Output:* Forwards to next node (labeling).  
     - *Failures:* Slack API rate limits, OAuth token expiration.

  6. **Add label to message**  
     - *Type:* Gmail  
     - *Role:* Adds a Gmail label (Label_2) for emails not flagged as urgent (False branch of If).  
     - *Configuration:* Uses message ID from Gmail Trigger node, operation "addLabels".  
     - *Credentials:* Same Gmail OAuth2 as trigger.  
     - *Input:* False branch of If node.  
     - *Output:* Forwards to append to Google Sheets low urgency log.  
     - *Failures:* Label ID mismatch, Gmail API errors.

  7. **Add label to message1**  
     - *Type:* Gmail  
     - *Role:* Adds a Gmail label (Label_4585164412428469148) for emails flagged as important (True branch).  
     - *Input:* Output of "Send a message" node.  
     - *Output:* Forwards to append to Google Sheets high/medium urgency log.  
     - *Failures:* Same as above.

  8. **Append row in sheet1**  
     - *Type:* Google Sheets  
     - *Role:* Logs email metadata (From, Summary, Urgency, Category, Timestamp) for low urgency emails.  
     - *Configuration:* Appends row to sheet "Sheet1" in the specified Google Sheets document.  
     - *Credentials:* Google Sheets OAuth2.  
     - *Input:* Output of "Add label to message" node.  
     - *Failures:* Sheet access errors, permission issues.

  9. **Append row in sheet**  
     - *Type:* Google Sheets  
     - *Role:* Logs metadata for high/medium urgency emails similarly to above but into the same sheet.  
     - *Input:* Output of "Add label to message1" node.

---

#### 2.2 Daily Digest Compilation and Slack Notification

- **Overview:**  
  Once daily at 19:00, this block queries the Google Sheet for emails logged that day with high or medium urgency, builds a digest message summarizing these emails, and posts it to a dedicated Slack channel.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get row(s) in sheet (Google Sheets)  
  - Code1 (filter today's relevant emails)  
  - Code2 (format digest message)  
  - Send a message1 (Slack post digest)

- **Node Details:**

  1. **Schedule Trigger**  
     - *Type:* Schedule Trigger  
     - *Role:* Activates workflow daily at 19:00 server time.  
     - *Configuration:* Hourly trigger set at hour 19.  
     - *Output:* Triggers downstream nodes.

  2. **Get row(s) in sheet**  
     - *Type:* Google Sheets  
     - *Role:* Retrieves all rows from the configured sheet ("Sheet1") containing logged email data.  
     - *Configuration:* Reads entire sheet without filters (post-filtering done in code).  
     - *Credentials:* Google Sheets OAuth2.

  3. **Code1**  
     - *Type:* Code (JavaScript)  
     - *Role:* Filters rows to keep only those dated today and with urgency "high" or "medium" (case insensitive).  
     - *Logic:* Compares row timestamp’s date part to current date, checks urgency field.  
     - *Input:* Rows from Google Sheets node.  
     - *Output:* Filtered list of important emails for the day.

  4. **Code2**  
     - *Type:* Code (JavaScript)  
     - *Role:* Builds a markdown-formatted Slack message listing the important emails with their summary, urgency, category, and intent.  
     - *Logic:* If no items, inserts a "No important messages today." placeholder.  
     - *Output:* JSON object containing the composed message text.

  5. **Send a message1**  
     - *Type:* Slack  
     - *Role:* Posts the daily digest message to the Slack channel "daily-digest".  
     - *Credentials:* Slack OAuth2.  
     - *Input:* Digest message from Code2.  
     - *Failures:* Slack API or OAuth issues.

---

### 3. Summary Table

| Node Name           | Node Type               | Functional Role                              | Input Node(s)                  | Output Node(s)               | Sticky Note                                           |
|---------------------|-------------------------|----------------------------------------------|-------------------------------|------------------------------|-------------------------------------------------------|
| Gmail Trigger       | Gmail Trigger           | Watches for new Gmail emails                   |                               | Message a model               |                                                       |
| Message a model     | OpenAI (LangChain)      | Classifies email content via GPT-4o-mini      | Gmail Trigger                 | Code                         |                                                       |
| Code                | Code                    | Parses AI JSON response, cleans formatting    | Message a model               | If                           |                                                       |
| If                  | If                      | Checks if urgency is High or Medium            | Code                         | Send a message (True), Add label to message (False) |                                                       |
| Send a message      | Slack                   | Sends immediate Slack alert for important emails | If (True)                    | Add label to message1         |                                                       |
| Add label to message| Gmail                   | Labels non-urgent emails in Gmail              | If (False)                   | Append row in sheet1          |                                                       |
| Add label to message1| Gmail                  | Labels urgent emails in Gmail                   | Send a message               | Append row in sheet           |                                                       |
| Append row in sheet1 | Google Sheets           | Logs low urgency email metadata                 | Add label to message          |                              |                                                       |
| Append row in sheet  | Google Sheets           | Logs high/medium urgency email metadata        | Add label to message1         |                              |                                                       |
| Schedule Trigger     | Schedule Trigger        | Triggers daily digest compilation at 19:00    |                               | Get row(s) in sheet          |                                                       |
| Get row(s) in sheet  | Google Sheets           | Retrieves all logged email rows                 | Schedule Trigger              | Code1                        |                                                       |
| Code1                | Code                    | Filters rows for today’s high/medium urgency emails | Get row(s) in sheet           | Code2                        |                                                       |
| Code2                | Code                    | Formats Slack daily digest message              | Code1                        | Send a message1              |                                                       |
| Send a message1      | Slack                   | Posts daily digest to Slack channel             | Code2                        |                              |                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node**  
   - Type: Gmail Trigger  
   - Set to poll every minute (no filters)  
   - Connect your Gmail account with OAuth2 credentials.

2. **Add OpenAI Node: "Message a model"**  
   - Type: OpenAI (LangChain)  
   - Model ID: "gpt-4o-mini"  
   - Prompt: Provide system prompt to classify email into JSON fields (summary, urgency, category, intent) using the email subject and snippet dynamically inserted via expressions.  
   - Use your OpenAI API credentials.

3. **Add Code Node: "Code"**  
   - Type: JavaScript code  
   - Logic: Clean and parse the AI output JSON string. Handle parse errors by returning error info.  
   - Input: Output of "Message a model".

4. **Add If Node: "If"**  
   - Type: If Condition  
   - Condition: Check if `urgency` field equals "High" OR "Medium" (case sensitive).  
   - Input: Output of "Code".

5. **Add Slack Node: "Send a message"**  
   - Type: Slack  
   - Send alert message to channel "alerts" with text including summary, urgency, and sender info from previous nodes.  
   - Use Slack OAuth2 credentials.  
   - Connect to True branch of "If".

6. **Add Gmail Node: "Add label to message"**  
   - Type: Gmail  
   - Operation: Add label with ID "Label_2" (for low urgency emails)  
   - Use Gmail OAuth2 credentials.  
   - Connect to False branch of "If".

7. **Add Gmail Node: "Add label to message1"**  
   - Type: Gmail  
   - Operation: Add label with ID "Label_4585164412428469148" (for high/medium urgency)  
   - Use Gmail OAuth2 credentials.  
   - Connect output of "Send a message" node.

8. **Add Google Sheets Node: "Append row in sheet1"**  
   - Type: Google Sheets  
   - Operation: Append row to "Sheet1" of your Inbox Log spreadsheet  
   - Columns: From, Summary, Urgency, Category, Timestamp (current time)  
   - Use Google Sheets OAuth2 credentials.  
   - Connect output of "Add label to message".

9. **Add Google Sheets Node: "Append row in sheet"**  
   - Same as above but connected to "Add label to message1".

10. **Add Schedule Trigger Node**  
    - Type: Schedule Trigger  
    - Set to trigger daily at 19:00 (7 PM).

11. **Add Google Sheets Node: "Get row(s) in sheet"**  
    - Type: Google Sheets  
    - Operation: Read all rows from "Sheet1" of Inbox Log spreadsheet.  
    - Credentials: Google Sheets OAuth2.  
    - Connect to Schedule Trigger.

12. **Add Code Node: "Code1"**  
    - Filter rows to those with Timestamp matching today’s date AND urgency "high" or "medium" (case insensitive).  
    - Connect output of Google Sheets "Get row(s) in sheet".

13. **Add Code Node: "Code2"**  
    - Format a Slack message listing all filtered emails with summary, urgency, category, intent, or show "No important messages today." if empty.  
    - Connect output of "Code1".

14. **Add Slack Node: "Send a message1"**  
    - Post the formatted daily digest message to Slack channel "daily-digest".  
    - Use Slack OAuth2 credentials.  
    - Connect output of "Code2".

---

### 5. General Notes & Resources

| Note Content                                                                                                                    | Context or Link                                                                                              |
|---------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| The workflow uses OpenAI GPT-4o-mini model for classification with strict JSON output enforced in prompt to avoid parsing issues.| Prompt design is crucial for reliable downstream processing.                                                |
| Slack channels used: "alerts" for immediate notifications, "daily-digest" for daily summary delivery.                           | Channel IDs: C093BMY0ESX (alerts), C0934EF3CRM (daily-digest).                                              |
| Gmail labels are referenced by internal IDs; ensure these match your Gmail labels or create equivalent labels in your account.  | Label_2 for low urgency, Label_4585164412428469148 for high/medium urgency.                                 |
| Google Sheets document ID: 1YQgWOSF-UA9gR1_pc6RzJ3UeANqnqi29ldoUd_2CPug; Sheet name: "Sheet1"                                  | Used as persistent log storage for email metadata.                                                         |
| The daily digest time is set to 19:00 server time; adjust schedule trigger if different timezone or time desired.               |                                                                                                            |
| Error handling in JSON parsing node returns error and original raw text for debugging malformed AI output.                      | Monitor logs to catch and fix prompt or model issues.                                                      |
| Slack and Gmail OAuth2 credentials must be correctly configured with required scopes (send messages, read/write Gmail labels).  | Credential expiry or scope changes may cause failures in sending or labeling.                               |

---

This document comprehensively describes the **AI Email Assistant: Prioritize Gmail with ChatGPT Summaries and Slack Digests** workflow, enabling advanced users and AI agents to understand, reproduce, and extend the automation reliably.