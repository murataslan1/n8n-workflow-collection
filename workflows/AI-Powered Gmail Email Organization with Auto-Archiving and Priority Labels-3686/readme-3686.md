AI-Powered Gmail Email Organization with Auto-Archiving and Priority Labels

https://n8nworkflows.xyz/workflows/ai-powered-gmail-email-organization-with-auto-archiving-and-priority-labels-3686


# AI-Powered Gmail Email Organization with Auto-Archiving and Priority Labels

### 1. Workflow Overview

This workflow automates the organization of a Gmail inbox using AI-powered classification and labeling. It is designed for users who want to reduce email overload by automatically archiving irrelevant emails and categorizing important ones for prioritized reading.

The workflow logically divides into the following blocks:

- **1.1 Trigger Reception**: Initiates the workflow either manually or via Telegram messages.
- **1.2 Email Retrieval**: Fetches all emails currently in the Gmail inbox.
- **1.3 Filtering Processed Emails**: Excludes emails already labeled as processed to avoid redundant work.
- **1.4 AI-Based Email Categorization**: Uses an AI agent to analyze each email’s content and decide whether to archive it or label it as "MustRead" or "NotNeed".
- **1.5 Gmail Labeling and Archiving**: Applies labels or archives emails based on AI decisions.
- **1.6 Reporting and Notification**: Aggregates processing results and sends a summary notification via Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger Reception

- **Overview:**  
  This block starts the workflow either manually or when a Telegram message is received, enabling flexible activation.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Telegram Trigger

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Allows manual initiation of the workflow for testing or on-demand runs.  
    - Configuration: No parameters; triggers on user action.  
    - Inputs: None  
    - Outputs: Connects to "Get mails in INBOX" node.  
    - Edge Cases: None significant; manual trigger is straightforward.

  - **Telegram Trigger**  
    - Type: Telegram Trigger  
    - Role: Starts workflow upon receiving a Telegram message.  
    - Configuration: Listens for "message" updates; uses Telegram API credentials linked to "My Mail Agent Bot via Telegram".  
    - Inputs: Incoming Telegram messages.  
    - Outputs: Connects to "Get mails in INBOX" node.  
    - Edge Cases: Telegram API downtime, invalid credentials, or webhook misconfiguration could cause failure.

---

#### 2.2 Email Retrieval

- **Overview:**  
  Retrieves all emails labeled as "INBOX" from the connected Gmail account.

- **Nodes Involved:**  
  - Get mails in INBOX

- **Node Details:**

  - **Get mails in INBOX**  
    - Type: Gmail  
    - Role: Fetches all emails currently in the Gmail inbox.  
    - Configuration: Operation "getAll" with filter labelIds set to ["INBOX"], returns all emails without limit.  
    - Inputs: Trigger nodes ("When clicking ‘Test workflow’" or "Telegram Trigger").  
    - Outputs: Connects to "Filter processed" node.  
    - Credentials: Uses Gmail OAuth2 credentials linked to the user’s Gmail account.  
    - Edge Cases: Gmail API rate limits, OAuth token expiration, or network issues.

---

#### 2.3 Filtering Processed Emails

- **Overview:**  
  Filters out emails that already have labels "MustRead" or "NotNeed" to avoid reprocessing.

- **Nodes Involved:**  
  - Filter processed

- **Node Details:**

  - **Filter processed**  
    - Type: Filter  
    - Role: Excludes emails already labeled as "MustRead" or "NotNeed".  
    - Configuration: Checks if the email’s labels array does NOT contain "MustRead" and does NOT contain "NotNeed".  
    - Inputs: "Get mails in INBOX" node.  
    - Outputs: Passes unprocessed emails to "Categoriser" node.  
    - Edge Cases: Emails without labels or with unexpected label formats may cause filtering errors.

---

#### 2.4 AI-Based Email Categorization

- **Overview:**  
  Uses an AI agent to analyze each email’s metadata and snippet to decide whether to archive it or label it as "MustRead" or "NotNeed".

- **Nodes Involved:**  
  - Categoriser  
  - OpenRouter Chat Model (used by Categoriser)

- **Node Details:**

  - **Categoriser**  
    - Type: LangChain Agent (AI Agent)  
    - Role: Processes each email’s ID, sender, subject, and snippet to classify it.  
    - Configuration:  
      - Input text includes email metadata formatted in XML-like tags.  
      - System message defines the persona as an email processing assistant.  
      - Task instructs to archive unnecessary emails first, then label others as "MustRead" or "NotNeed".  
      - Rules specify criteria for archiving and labeling (placeholders for user-defined rules).  
      - Uses two AI tools: "mail_archiver" and "mail_label_setter" to perform Gmail operations based on AI decisions.  
    - Inputs: Emails filtered by "Filter processed".  
    - Outputs: Connects to "Aggregate" node.  
    - Credentials: Uses OpenRouter API credentials for GPT-4.1-nano model.  
    - Edge Cases: AI misclassification, API timeouts, or malformed email data could cause errors.

  - **OpenRouter Chat Model**  
    - Type: LangChain Language Model  
    - Role: Provides GPT-4.1-nano model for the AI agent’s natural language processing.  
    - Configuration: Model set to "openai/gpt-4.1-nano".  
    - Inputs: Connected as AI language model for "Categoriser".  
    - Outputs: Feeds AI responses back to "Categoriser".  
    - Credentials: OpenRouter API credentials.  
    - Edge Cases: API quota limits, network issues, or invalid credentials.

---

#### 2.5 Gmail Labeling and Archiving

- **Overview:**  
  Applies labels or archives emails based on AI agent decisions using Gmail API operations.

- **Nodes Involved:**  
  - mail_archiver  
  - mail_label_setter

- **Node Details:**

  - **mail_archiver**  
    - Type: Gmail Tool  
    - Role: Archives emails by removing the "INBOX" label.  
    - Configuration:  
      - Operation: removeLabels  
      - LabelIds: ["INBOX"]  
      - MessageId: dynamically set from AI output variable 'Message_ID'.  
    - Inputs: AI tool input from "Categoriser".  
    - Outputs: None (terminal for archiving operation).  
    - Credentials: Gmail OAuth2 credentials.  
    - Edge Cases: Invalid message IDs, Gmail API errors, or permission issues.

  - **mail_label_setter**  
    - Type: Gmail Tool  
    - Role: Adds labels to emails such as "MustRead" or "NotNeed".  
    - Configuration:  
      - Operation: addLabels  
      - LabelIds: dynamically set from AI output variable 'Label_Names_or_IDs'.  
      - MessageId: dynamically set from AI output variable 'Message_ID'.  
    - Inputs: AI tool input from "Categoriser".  
    - Outputs: None (terminal for labeling operation).  
    - Credentials: Gmail OAuth2 credentials.  
    - Edge Cases: Label IDs not existing, API errors, or invalid message IDs.

---

#### 2.6 Reporting and Notification

- **Overview:**  
  Aggregates the AI processing results and sends a summarized report via Telegram to notify the user.

- **Nodes Involved:**  
  - Aggregate  
  - Reporter  
  - OpenRouter Chat Model1 (used by Reporter)  
  - Telegram

- **Node Details:**

  - **Aggregate**  
    - Type: Aggregate  
    - Role: Collects all individual email processing outputs into a single data set.  
    - Configuration: Uses "aggregateAllItemData" option to combine all data.  
    - Inputs: From "Categoriser".  
    - Outputs: Connects to "Reporter".  
    - Edge Cases: Large data sets may cause performance issues.

  - **Reporter**  
    - Type: LangChain Agent  
    - Role: Summarizes the aggregated email processing results into a concise report.  
    - Configuration:  
      - Text input uses a template to concatenate all outputs.  
      - System message defines the assistant persona.  
      - Uses OpenRouter Chat Model1 as AI language model.  
    - Inputs: Aggregated data from "Aggregate".  
    - Outputs: Connects to "Telegram".  
    - Credentials: OpenRouter API credentials.  
    - Edge Cases: AI summarization errors or API failures.

  - **OpenRouter Chat Model1**  
    - Type: LangChain Language Model  
    - Role: Provides GPT-4.1-nano model for the Reporter node.  
    - Configuration: Model set to "openai/gpt-4.1-nano".  
    - Inputs: Connected as AI language model for "Reporter".  
    - Outputs: Feeds AI responses back to "Reporter".  
    - Credentials: OpenRouter API credentials.  
    - Edge Cases: Same as other OpenRouter nodes.

  - **Telegram**  
    - Type: Telegram  
    - Role: Sends the summarized report to the Telegram chat where the trigger originated.  
    - Configuration:  
      - Text: Uses output from "Reporter".  
      - ChatId: Extracted dynamically from the "Telegram Trigger" node’s incoming message.  
    - Inputs: From "Reporter".  
    - Outputs: None (terminal notification).  
    - Credentials: Telegram API credentials.  
    - Edge Cases: Telegram API downtime, invalid chat IDs, or credential issues.

---

### 3. Summary Table

| Node Name                 | Node Type                         | Functional Role                          | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                                  |
|---------------------------|----------------------------------|----------------------------------------|-----------------------------|----------------------------|--------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                   | Manual start of workflow                | None                        | Get mails in INBOX          |                                                                                                              |
| Telegram Trigger           | Telegram Trigger                 | Starts workflow on Telegram message    | None                        | Get mails in INBOX          | Run by communicating with Telegram                                                                           |
| Get mails in INBOX         | Gmail                           | Retrieves all emails in Gmail inbox    | When clicking ‘Test workflow’, Telegram Trigger | Filter processed            | Retrieve all emails in the Gmail inbox (Label: INBOX)                                                        |
| Filter processed           | Filter                          | Filters out already processed emails   | Get mails in INBOX           | Categoriser                 | Filter out emails that have already been processed to avoid unnecessary work for the AI                      |
| Categoriser               | LangChain Agent                 | AI classifies emails for archiving/labeling | Filter processed            | Aggregate                  | Check each email one by one, categorize them as necessary or unnecessary according to the provided prompt    |
| OpenRouter Chat Model      | LangChain Language Model        | Provides GPT-4.1-nano model for Categoriser | Categoriser (ai_languageModel) | Categoriser               |                                                                                                              |
| mail_archiver              | Gmail Tool                     | Archives emails by removing INBOX label | Categoriser (ai_tool)        | None                       |                                                                                                              |
| mail_label_setter          | Gmail Tool                     | Adds labels like MustRead or NotNeed   | Categoriser (ai_tool)        | None                       |                                                                                                              |
| Aggregate                  | Aggregate                      | Aggregates all email processing results | Categoriser                 | Reporter                   |                                                                                                              |
| Reporter                   | LangChain Agent                | Summarizes aggregated results          | Aggregate                   | Telegram                   |                                                                                                              |
| OpenRouter Chat Model1     | LangChain Language Model        | Provides GPT-4.1-nano model for Reporter | Reporter (ai_languageModel) | Reporter                   |                                                                                                              |
| Telegram                   | Telegram                       | Sends summary report to Telegram chat  | Reporter                    | None                       |                                                                                                              |
| Sticky Note                | Sticky Note                    | Documentation note                     | None                        | None                       | Mail Agent: For emails in the inbox, archive those that are completely unnecessary, and label the rest based on their relevance. |
| Sticky Note1               | Sticky Note                    | Documentation note                     | None                        | None                       | Trigger: Run by communicating with Telegram                                                                  |
| Sticky Note2               | Sticky Note                    | Documentation note                     | None                        | None                       | Get Mail via Gmail: Retrieve all emails in the Gmail inbox. (Inbox = Label: INBOX)                            |
| Sticky Note3               | Sticky Note                    | Documentation note                     | None                        | None                       | Filter: Filter out emails that have already been processed to avoid unnecessary work for the AI.             |
| Sticky Note4               | Sticky Note                    | Documentation note                     | None                        | None                       | AI Agent: Check each email one by one, categorize them as necessary or unnecessary according to the provided prompt, and instruct Gmail to apply the appropriate labels. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Allow manual workflow start.  
   - No parameters needed.

2. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Parameters: Listen for "message" updates.  
   - Credentials: Connect Telegram API credentials for your bot.  
   - Purpose: Start workflow on Telegram message.

3. **Create Gmail Node to Get Emails**  
   - Type: Gmail  
   - Operation: getAll  
   - Filters: LabelIds set to ["INBOX"]  
   - Return All: true  
   - Credentials: Connect Gmail OAuth2 credentials.  
   - Connect inputs from both Manual Trigger and Telegram Trigger nodes.

4. **Create Filter Node to Exclude Processed Emails**  
   - Type: Filter  
   - Conditions:  
     - Email labels array does NOT contain "MustRead"  
     - Email labels array does NOT contain "NotNeed"  
   - Connect input from Gmail node.

5. **Create LangChain Agent Node for Categorisation**  
   - Type: LangChain Agent  
   - Text Input Template:  
     ```
     <task>
     Process mail
     </task>
     <mail>
     <id>{{ $json.id }}</id>
     <from>{{ $json.From }}</from>
     <subject>{{ $json.Subject }}</subject>
     <body>{{ $json.snippet }}</body>
     </mail>
     ```
   - System Message: Define persona as email processing assistant with instructions to archive unnecessary emails first, then label others.  
   - Rules: Define your own rules for archiving, MustRead, and Other categories.  
   - AI Tools: Add two AI tools:  
     - mail_archiver (Gmail Tool to remove "INBOX" label)  
     - mail_label_setter (Gmail Tool to add labels)  
   - Connect input from Filter node.

6. **Create Gmail Tool Node for Archiving (mail_archiver)**  
   - Type: Gmail Tool  
   - Operation: removeLabels  
   - LabelIds: ["INBOX"]  
   - MessageId: Set dynamically from AI output variable 'Message_ID'  
   - Credentials: Gmail OAuth2  
   - Connect as AI tool input to Categoriser node.

7. **Create Gmail Tool Node for Labeling (mail_label_setter)**  
   - Type: Gmail Tool  
   - Operation: addLabels  
   - LabelIds: Set dynamically from AI output variable 'Label_Names_or_IDs'  
   - MessageId: Set dynamically from AI output variable 'Message_ID'  
   - Credentials: Gmail OAuth2  
   - Connect as AI tool input to Categoriser node.

8. **Create Aggregate Node**  
   - Type: Aggregate  
   - Options: aggregateAllItemData  
   - Connect input from Categoriser node.

9. **Create LangChain Agent Node for Reporting**  
   - Type: LangChain Agent  
   - Text Input Template:  
     ```
     Summarize data
     ```
     ```
     {{ $json.data.map(item => item.output + '\n\n') }}
     ```
   - System Message: Define persona as helpful assistant.  
   - AI Language Model: Connect to OpenRouter Chat Model1 node.  
   - Connect input from Aggregate node.

10. **Create OpenRouter Chat Model Nodes**  
    - Two nodes needed:  
      - One connected as AI language model for Categoriser node.  
      - One connected as AI language model for Reporter node.  
    - Model: openai/gpt-4.1-nano  
    - Credentials: OpenRouter API credentials.

11. **Create Telegram Node for Notification**  
    - Type: Telegram  
    - Text: Use output from Reporter node.  
    - ChatId: Extract from Telegram Trigger node’s incoming message JSON path `message.chat.id`.  
    - Credentials: Telegram API credentials.  
    - Connect input from Reporter node.

12. **Connect all nodes according to the logical flow:**  
    - Manual Trigger and Telegram Trigger → Get mails in INBOX  
    - Get mails in INBOX → Filter processed  
    - Filter processed → Categoriser  
    - Categoriser → Aggregate  
    - Aggregate → Reporter  
    - Reporter → Telegram  
    - Categoriser AI tools → mail_archiver and mail_label_setter  
    - Categoriser AI language model → OpenRouter Chat Model  
    - Reporter AI language model → OpenRouter Chat Model1

13. **Set up credentials:**  
    - Gmail OAuth2 with appropriate scopes for reading, labeling, and modifying emails.  
    - Telegram API credentials for bot access.  
    - OpenRouter API credentials for GPT-4.1-nano model access.

14. **Customize rules in the Categoriser node’s system message:**  
    - Define your own criteria for archiving and labeling emails to suit your preferences.

15. **Activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                      |
|-------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Mail Agent: For emails in the inbox, archive those that are completely unnecessary, and label the rest based on their relevance. | Workflow purpose and logic overview (Sticky Note)                                                  |
| Trigger: Run by communicating with Telegram                                                       | Explains Telegram Trigger usage (Sticky Note1)                                                     |
| Get Mail via Gmail: Retrieve all emails in the Gmail inbox. (Inbox = Label: INBOX)                | Gmail inbox retrieval explanation (Sticky Note2)                                                  |
| Filter: Filter out emails that have already been processed to avoid unnecessary work for the AI.  | Filtering logic explanation (Sticky Note3)                                                        |
| AI Agent: Check each email one by one, categorize them as necessary or unnecessary according to the provided prompt, and instruct Gmail to apply the appropriate labels. | AI categorization and Gmail action explanation (Sticky Note4)                                     |

---

This documentation provides a complete and detailed reference for understanding, reproducing, and customizing the AI-Powered Gmail Email Organization workflow.